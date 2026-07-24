#!/usr/bin/env python3
"""Turn the wget mirror of www.intuitionmachine.com into a self-contained
static site under site/ that can be served by GitHub Pages.

Run:  python3 build.py
"""
import os
import re
import shutil
import sys
import urllib.parse
import urllib.request

MIRROR = "mirror"
PAGES_DIR = os.path.join(MIRROR, "www.intuitionmachine.com")
OUT = "site"

VENDOR_HOSTS = ["assets.squarespace.com", "static1.squarespace.com"]

# Unlinked Squarespace template demo pages. They are not part of the real site
# and account for ~52MB of Squarespace's own stock photography, so they are
# skipped by default. Build with --all to include them.
TEMPLATE_DEMOS = {"typography-fulton.html", "new-gallery.html"}
IMG_HOSTS = ["images.squarespace-cdn.com", "static1.squarespace.com"]

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120 Safari/537.36")

# URLs are matched as whole quoted values rather than by scanning for a URL
# pattern -- asset names here contain parentheses, which any character-class
# based match truncates.
QUOTED_RE = re.compile(r'"([^"\n]*)"')
HOSTS_ALT = (r'images\.squarespace-cdn\.com|static1\.squarespace\.com|'
             r'assets\.squarespace\.com')
ABS_RE = re.compile(r'^(?:https?:)?//(' + HOSTS_ALT + r')(/.*)$')
REL_RE = re.compile(r'^\.\./(' + HOSTS_ALT + r')/(.*)$')

IMG_EXT = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp")

# The cover-page layout references this as a host-relative path, so it escapes
# the host-based matching above and needs handling on its own.
COVER_IMG = ("/universal/backend/rendering/coverpages/slides/lib/layouts/"
             "cover-page/landing-full-center-01/img/gallery/0.jpg")
COVER_LOCAL = "assets/img/coverpage-landing-full-center-01-gallery-0.jpg"


def sanitize(part):
    """wget encodes '?' as '@'; make a filesystem/URL friendly name."""
    part = urllib.parse.unquote(part)
    part = part.replace("@", "_").replace("?", "_").replace("+", "-")
    part = re.sub(r"[^A-Za-z0-9._/-]", "-", part)
    return re.sub(r"-{2,}", "-", part)


def is_image(url):
    path = urllib.parse.urlsplit(url).path.lower()
    return path.endswith(IMG_EXT) or "/content/v1/" in path


def local_for(host, path):
    """Map a remote (host, path) to a repo-relative path under site/."""
    if is_image(host + "/" + path):
        # Flatten CDN image paths: keep the last two segments for uniqueness.
        segs = [s for s in sanitize(path.lstrip("/")).split("/") if s]
        name = "-".join(segs[-2:]) if len(segs) >= 2 else segs[-1]
        if not name.lower().endswith(IMG_EXT):
            name += ".png"
        return "assets/img/" + name
    # Vendor CSS/JS keep wget's exact layout (including its '?' -> '@' encoding)
    # so the relative url() references inside the stylesheets still resolve.
    return "assets/vendor/" + host + "/" + path.lstrip("/").replace("?", "@")


def absolutize(url):
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("http://"):
        return "https://" + url[len("http://"):]
    return url


def resolve(value):
    """Map one quoted attribute/JSON value to (remote_url, local_path).

    Returns None when the value is not an asset we host ourselves.
    """
    v = value.replace("\\/", "/").strip()
    # srcset lists are several URLs in one attribute, and get dropped anyway;
    # a trailing slash is a directory prefix, not a file.
    if re.search(r"\s", v) or v.endswith("/"):
        return None
    m = ABS_RE.match(v)
    if m:
        host, path = m.group(1), m.group(2)
        return absolutize("https://" + host + path), local_for(host, path)
    m = REL_RE.match(v)
    if m:
        host, path = m.group(1), m.group(2)
        # Undo wget's '@' -> '?' encoding to recover the real remote URL.
        return "https://" + host + "/" + path.replace("@", "?"), local_for(host, path)
    return None


def collect(html):
    """Return {absolute_url: local_path} for every hosted asset in the page."""
    found = {}
    for m in QUOTED_RE.finditer(html):
        hit = resolve(m.group(1))
        if hit:
            found[hit[0]] = hit[1]
    return found


def download(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return True
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    # Ask only for the original formats. With a bare 'Accept: */*' the
    # Squarespace CDN returns a WebP stub, and offering it image/webp makes it
    # transcode; either way some responses fail to decode in the browser.
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "image/png,image/jpeg,image/gif,image/svg+xml,*/*;q=0.5",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
            shutil.copyfileobj(r, f)
        return True
    except Exception as e:  # noqa: BLE001 - report and keep going
        print(f"  ! {url} -> {e}", file=sys.stderr)
        return False


def copy_from_mirror(host, path, dest):
    """Prefer the already-downloaded wget copy over a fresh network fetch."""
    src = os.path.join(MIRROR, host, path.lstrip("/"))
    for cand in (src, src.replace("?", "@")):
        if os.path.isfile(cand):
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copyfile(cand, dest)
            return True
    return False


def sniff(path):
    """Return the real image extension from magic bytes, or None."""
    with open(path, "rb") as f:
        head = f.read(16)
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return ".webp"
    if head[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    if head[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if head[:4] in (b"GIF8",):
        return ".gif"
    return None


def fix_extensions(mapping):
    """The CDN content-negotiates: some '.png' URLs return WebP. Rename those
    files to match their real format so browsers decode them."""
    fixed = 0
    for url, rel in list(mapping.items()):
        dest = os.path.join(OUT, rel)
        if not rel.startswith("assets/img/") or not os.path.isfile(dest):
            continue
        real = sniff(dest)
        if not real:
            continue
        stem, ext = os.path.splitext(rel)
        if ext.lower() == real or (ext.lower(), real) == (".jpeg", ".jpg"):
            continue
        new_rel = stem + real
        os.rename(dest, os.path.join(OUT, new_rel))
        mapping[url] = new_rel
        fixed += 1
    if fixed:
        print(f"corrected {fixed} mislabelled image extensions")


def rewrite(html, mapping):
    """Point every hosted URL at its local copy and de-lazy the images."""
    def repl(m):
        hit = resolve(m.group(1))
        if hit and hit[0] in mapping:
            return '"' + mapping[hit[0]] + '"'
        return m.group(0)

    html = QUOTED_RE.sub(repl, html)

    # Squarespace paints images from data-src via JS and hides them until then.
    # Copy data-src into src so the page renders with no JS at all.
    html = re.sub(r'<img\b[^>]*>', fix_img, html)
    # srcset still points at the CDN's resize endpoint; drop it.
    html = re.sub(r'\s(?:data-)?srcset="[^"]*"', "", html)

    # Local page links: wget wrote index.html/foo.html, which Pages serves fine.
    html = html.replace('href="home@format=rss"', 'href="feed.xml"')
    html = html.replace('href="/products"', 'href="products.html"')
    html = html.replace('"' + COVER_IMG + '"', '"' + COVER_LOCAL + '"')

    head_close = html.find("</head>")
    if head_close != -1:
        html = html[:head_close] + STATIC_FIXES + html[head_close:]
    return html


def fix_img(m):
    tag = m.group(0)
    ds = re.search(r'\sdata-src="([^"]*)"', tag)
    if not ds:
        return tag
    src = ds.group(1)
    if re.search(r'\ssrc="', tag):
        tag = re.sub(r'\ssrc="[^"]*"', f' src="{src}"', tag, count=1)
    else:
        tag = tag[:-1].rstrip() + f' src="{src}">'
    # These classes keep the image at opacity 0 until the SQS loader runs.
    tag = tag.replace("summary-thumbnail-image", "summary-thumbnail-image loaded")
    if 'class="' in tag:
        tag = re.sub(r'class="([^"]*)"', r'class="\1 loaded"', tag, count=1)
    else:
        tag = tag[:-1].rstrip() + ' class="loaded">'
    return tag


STATIC_FIXES = """
<script>
/* The bundled Squarespace scripts keep beaconing analytics to /api/census/*
   and tracing.squarespace.com. There is no backend here, and the mirror should
   not report traffic to Squarespace, so swallow those calls. */
(function () {
  var blocked = /\\/api\\/census\\/|tracing\\.squarespace\\.com|\\/api\\/events\\//;
  var url = function (r) { return typeof r === "string" ? r : (r && r.url) || ""; };

  var fetch_ = window.fetch;
  window.fetch = function (r, o) {
    if (blocked.test(url(r))) return Promise.resolve(new Response("{}", {status: 200}));
    return fetch_.apply(this, arguments);
  };

  var open_ = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) {
    this.__blocked = blocked.test(u || "");
    return open_.apply(this, arguments);
  };
  var send_ = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    if (this.__blocked) return;
    return send_.apply(this, arguments);
  };

  if (navigator.sendBeacon) {
    var beacon_ = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (u) {
      return blocked.test(u || "") ? true : beacon_.apply(null, arguments);
    };
  }
})();
</script>
<style>
/* Static-hosting fixes: Squarespace's JS image loader is not running here,
   so force every image to be visible at its natural size. */
img[data-src], .sqs-block-image img, .content-fill img, img.loaded {
  opacity: 1 !important;
  visibility: visible !important;
}
.sqs-block-image .image-block-wrapper { padding-bottom: 0 !important; height: auto !important; }
.sqs-block-image img, .image-block-wrapper img {
  position: static !important;
  width: 100% !important;
  height: auto !important;
  object-fit: contain;
}
</style>
"""


def main():
    if not os.path.isdir(PAGES_DIR):
        sys.exit(f"missing {PAGES_DIR} - run the wget mirror first")

    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)

    include_all = "--all" in sys.argv
    pages = sorted(p for p in os.listdir(PAGES_DIR)
                   if p.endswith(".html") and (include_all or p not in TEMPLATE_DEMOS))
    if not include_all:
        print(f"skipping template demos: {', '.join(sorted(TEMPLATE_DEMOS))} (use --all to keep)")
    mapping = {}
    for page in pages:
        with open(os.path.join(PAGES_DIR, page), encoding="utf-8", errors="replace") as f:
            mapping.update(collect(f.read()))

    print(f"{len(pages)} pages, {len(mapping)} assets")
    ok = 0
    for url, rel in sorted(mapping.items()):
        dest = os.path.join(OUT, rel)
        sp = urllib.parse.urlsplit(url)
        path = sp.path + (("?" + sp.query) if sp.query else "")
        # Images come from the CDN fresh (see the Accept-header note in
        # download); everything else is already correct in the wget mirror.
        if rel.startswith("assets/img/"):
            got = download(url, dest) or copy_from_mirror(sp.netloc, path, dest)
        else:
            got = copy_from_mirror(sp.netloc, path, dest) or download(url, dest)
        if got:
            ok += 1
    print(f"fetched {ok}/{len(mapping)} assets")
    fix_extensions(mapping)

    for page in pages:
        with open(os.path.join(PAGES_DIR, page), encoding="utf-8", errors="replace") as f:
            html = f.read()
        with open(os.path.join(OUT, page), "w", encoding="utf-8") as f:
            f.write(rewrite(html, mapping))
        print(f"  wrote {OUT}/{page}")

    download("https://static1.squarespace.com" + COVER_IMG,
             os.path.join(OUT, COVER_LOCAL))

    # Stylesheets pull in fonts and icon sprites via relative url(), which the
    # HTML-only scan above never sees. Copy the mirrored vendor trees wholesale.
    for host in VENDOR_HOSTS:
        src = os.path.join(MIRROR, host)
        if os.path.isdir(src):
            shutil.copytree(src, os.path.join(OUT, "assets", "vendor", host),
                            dirs_exist_ok=True)

    rss = os.path.join(PAGES_DIR, "home@format=rss")
    if os.path.isfile(rss):
        shutil.copyfile(rss, os.path.join(OUT, "feed.xml"))

    # GitHub Pages otherwise runs the output through Jekyll, which skips
    # directories and files starting with an underscore.
    open(os.path.join(OUT, ".nojekyll"), "w").close()


if __name__ == "__main__":
    main()
