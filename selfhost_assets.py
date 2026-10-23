"""
Keep every page under site/ free of third-party requests.

The privacy notice (privacy.html) promises that pages, fonts and scripts all
come from intuitionmachine.com, so no consent banner is needed. Films exported
into site/explainers/ tend to arrive with Google Fonts links and CDN scripts;
this copies those files into the site and points the pages at the copies.

    python3 selfhost_assets.py           # fix pages in place
    python3 selfhost_assets.py --check   # report only; exit 1 if anything is left

build_pages.py runs the fix after every build, and the deploy workflow runs the
fix and then the check before publishing.
"""

import hashlib
import json
import os
import posixpath
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(ROOT, "site")
FONTS = os.path.join(SITE, "assets", "fonts", "hosted")     # Google Fonts copies
VENDOR = os.path.join(SITE, "assets", "js", "vendor")       # CDN script copies

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")      # so Google serves woff2
SUBSETS = {"latin", "latin-ext"}
CDNS = r"(?:cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)"

GF_LINK = re.compile(r'[ \t]*<link\b[^>]*href="(https://fonts\.googleapis\.com/css2?\?[^"]+)"[^>]*>')
GF_IMPORT = re.compile(r"""@import\s+url\(\s*['"]?(https://fonts\.googleapis\.com/css2?\?[^'")]+)['"]?\s*\)\s*;?""")
PRECONNECT = re.compile(r'[ \t]*<link\b[^>]*rel="(?:preconnect|dns-prefetch)"[^>]*href="https://'
                        r'(?:fonts\.googleapis\.com|fonts\.gstatic\.com|' + CDNS + r')"[^>]*>\n?')
SCRIPT_SRC = re.compile(r'(<script\b[^>]*\bsrc=")(https://' + CDNS + r'/[^"]+)(")')
IMPORTMAP = re.compile(r'(<script\b[^>]*type="importmap"[^>]*>)(.*?)(</script>)', re.S)

# What --check treats as a third-party request (anchors to other sites are fine).
LEAK = re.compile(r'(?:<link\b[^>]*href|<script\b[^>]*src|<iframe\b[^>]*src|<img\b[^>]*src|@import\s+url\()'
                  r'\s*=?\s*["\']?(https?://(?!(?:www\.)?intuitionmachine\.com)[^"\')\s>]+)'
                  r'|"(https://' + CDNS + r'/[^"]+)"')


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def rel(from_file, target):
    """URL of target as seen from the page at from_file."""
    return os.path.relpath(target, os.path.dirname(from_file)).replace(os.sep, "/")


# ---------------------------------------------------------------- fonts

def host_font_css(url):
    """Copy a Google Fonts stylesheet (Latin subsets) and its woff2 files; return its path."""
    url = url.replace("&amp;", "&")
    path = os.path.join(FONTS, "fonts-" + hashlib.sha1(url.encode()).hexdigest()[:10] + ".css")
    if os.path.exists(path):
        return path
    os.makedirs(FONTS, exist_ok=True)
    css = fetch(url).decode()
    blocks = []
    for m in re.finditer(r"/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*\{.*?\})", css, re.S):
        if m.group(1) not in SUBSETS:
            continue

        def local(fm):
            name = hashlib.sha1(fm.group(1).encode()).hexdigest()[:16] + ".woff2"
            dest = os.path.join(FONTS, name)
            if not os.path.exists(dest):
                with open(dest, "wb") as f:
                    f.write(fetch(fm.group(1)))
            return f"url({name})"

        blocks.append(f"/* {m.group(1)} */\n" +
                      re.sub(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", local, m.group(2)))
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(blocks) + "\n")
    return path


# ---------------------------------------------------------------- scripts

def vendor_path(url):
    """Local mirror of a CDN URL: assets/js/vendor/<host>/<path>."""
    host, _, path = url.split("://", 1)[1].partition("/")
    return os.path.join(VENDOR, host, *path.split("?")[0].split("/"))


def host_module(url, seen):
    """Copy an ES module and, recursively, the relative modules it imports."""
    if url in seen:
        return
    seen.add(url)
    dest = vendor_path(url)
    if os.path.exists(dest):
        src = open(dest, encoding="utf-8").read()
    else:
        src = fetch(url).decode()
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "w", encoding="utf-8") as f:
            f.write(src)
    for spec in re.findall(r"""(?:from|import)\s*\(?\s*['"](\.{1,2}/[^'"]+)['"]""", src):
        base = url.rsplit("/", 1)[0] + "/"
        scheme, rest = base.split("://", 1)
        host_module(scheme + "://" + posixpath.normpath(posixpath.join(rest, spec)), seen)


def fix_importmap(page, html):
    def sub(m):
        imports = json.loads(m.group(2))
        table = imports.get("imports", {})
        for key, url in list(table.items()):
            if not re.match(r"https://" + CDNS + "/", url):
                continue
            seen = set()
            if url.endswith("/"):
                # A prefix entry: copy each module the page actually imports through it.
                for spec in set(re.findall(r"""['"]""" + re.escape(key) + r"""([^'"]+)['"]""", html)):
                    host_module(url + spec, seen)
                table[key] = rel(page, vendor_path(url + "x"))[:-1]
            else:
                host_module(url, seen)
                table[key] = rel(page, vendor_path(url))
        return m.group(1) + "\n" + json.dumps(imports, indent=1) + "\n" + m.group(3)
    return IMPORTMAP.sub(sub, html)


# ---------------------------------------------------------------- pages

def pages():
    for d, _, files in os.walk(SITE):
        for name in files:
            if name.endswith(".html"):
                yield os.path.join(d, name)


def fix(page):
    html = open(page, encoding="utf-8").read()
    if not re.search(r"https://(?:fonts\.googleapis\.com|fonts\.gstatic\.com|" + CDNS + ")", html):
        return False
    out = PRECONNECT.sub("", html)
    out = GF_LINK.sub(lambda m: f'<link rel="stylesheet" href="{rel(page, host_font_css(m.group(1)))}">', out)
    out = GF_IMPORT.sub(lambda m: f'@import url("{rel(page, host_font_css(m.group(1)))}");', out)
    out = fix_importmap(page, out)

    def script(m):
        dest = vendor_path(m.group(2))
        if not os.path.exists(dest):
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "wb") as f:
                f.write(fetch(m.group(2)))
        return m.group(1) + rel(page, dest) + m.group(3)
    out = SCRIPT_SRC.sub(script, out)

    if out != html:
        with open(page, "w", encoding="utf-8") as f:
            f.write(out)
        print(f"  self-hosted assets in {os.path.relpath(page, ROOT)}")
        return True
    return False


def leaks():
    found = []
    for page in pages():
        html = open(page, encoding="utf-8", errors="replace").read()
        for m in LEAK.finditer(html):
            url = m.group(1) or m.group(2)
            # YouTube players are built only when the visitor presses play.
            if url.startswith(("https://www.youtube-nocookie.com/embed/",)):
                continue
            found.append((os.path.relpath(page, ROOT), url))
    return found


def main(argv):
    if "--check" not in argv:
        for page in pages():
            fix(page)
    left = leaks()
    for page, url in left:
        print(f"  third-party request: {page}: {url}")
    if "--check" in argv and left:
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv[1:])
