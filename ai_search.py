"""
Make the site easy for search engines and AI assistants to read and cite.

    - JSON-LD structured data on every page (organisation, website, page,
      breadcrumbs, plus people, books, services and FAQs where they appear)
    - the homepage FAQ, rendered from FAQ below so the visible answers and the
      FAQPage data cannot drift apart
    - llms.txt (a curated index) and llms-full.txt (every page as plain text)
    - sitemap.xml with last-modified dates from git

build_pages.py calls jsonld() for each generated page and main() after the build.
index.html is hand-written, so its FAQ and JSON-LD are replaced between
<!-- faq:start/end --> and <!-- ld:start/end --> markers.

    python3 ai_search.py      # refresh index.html, llms*.txt and sitemap.xml
"""

import datetime
import html
import json
import os
import re
import subprocess
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE_DIR = os.path.join(ROOT, "site")
SITE = "https://intuitionmachine.com"

ORG_ID = f"{SITE}/#organization"
SITE_ID = f"{SITE}/#website"
PERSON_ID = f"{SITE}/team.html#carlos-perez"
NAME = "Intuition Machine"
TAGLINE = "Enterprise AI Engineering & Assurance"
SUMMARY = ("Intuition Machine turns AI agents and experimental workflows into reliable, "
           "governed systems that work within your enterprise architecture, follow your "
           "organisation's rules, and deliver measurable value.")
SAME_AS = [
    "https://medium.com/intuitionmachine",
    "https://intuitionmachine.gumroad.com",
    "https://www.youtube.com/playlist?list=PLoOMKjCBaDuX8vYGfcSUgw_84xj3wo62-",
]

# Short names for breadcrumbs, and the section each page sits in.
CRUMBS = {
    "machines.html": (None, "The Machines"),
    "how-we-work.html": (None, "How we work"),
    "first-workflow.html": (None, "Your first workflow"),
    "exo.html": (None, "ExO 3.0"),
    "research.html": (None, "Research"),
    "ai-native.html": ("research.html", "AI-Native Organisations"),
    "kernel.html": ("research.html", "The Kernel"),
    "loops.html": ("research.html", "The Loops"),
    "diagnosis.html": ("research.html", "Diagnosis"),
    "video.html": ("research.html", "Video"),
    "explorations.html": (None, "Explorations"),
    "books.html": (None, "Books"),
    "writing.html": (None, "Writing"),
    "team.html": (None, "Team"),
    "about.html": (None, "Contact"),
    "privacy.html": (None, "Privacy and cookies"),
}

# Questions people ask an assistant about us, answered in the site's own words.
# Rendered on the homepage and as FAQPage data. Answers may use simple inline HTML.
FAQ = [
    ("What does Intuition Machine do?",
     "Intuition Machine is an enterprise AI engineering and assurance company, founded in "
     "2015 and based in Arlington, Virginia. We turn AI agents and experimental workflows "
     "into reliable, governed systems that work within your existing architecture, follow "
     "your organisation's rules, and deliver measurable value."),
    ("How do you move an AI pilot into production?",
     "In three steps: <a href=\"how-we-work.html\">Map, Build, Prove</a>. Map the rules, "
     "dependencies, approved technologies and constraints that apply. Build purpose-made "
     "agent environments that integrate with your applications, identity systems, approvals "
     "and deployment standards. Prove the outcomes: evaluate results, enforce policy, manage "
     "autonomy and detect drift before deploying more widely."),
    ("What is a governed AI-native workflow, and where should we start?",
     "Start with one business process. We rebuild a workflow you choose with AI agents "
     "inside your existing standards, access controls and business constraints, and run it "
     "in shadow alongside the current process. You get a bounded working workflow, "
     "integration with approved systems, explicit evaluation and escalation criteria, a "
     "comparison on speed, cost, accuracy and exception rate, and a documented path toward "
     "greater autonomy. <a href=\"first-workflow.html\">Your first workflow</a>."),
    ("What are the machines for the self-learning enterprise?",
     "Eight specialised intelligence systems on one shared foundation, Common Ground: Sense "
     "(enterprise perception and discovery), Connection (evidence grounding and "
     "traceability), Context (organisational memory), Judgment (evaluation and decision "
     "governance), Intuition (typed cognitive dispatch), Agency (governed autonomous "
     "execution), Learning (semantic adaptation) and Coreography (coordinated action across "
     "people and agents). Instead of asking an enterprise to model itself before it can use "
     "AI, they discover, validate and formalise organisational knowledge through useful work. "
     "<a href=\"machines.html\">Meet the machines</a>."),
    ("How does Intuition Machine relate to ExO 3.0?",
     "ExO 3.0 describes organisations run through coordinated networks of people and AI "
     "agents. We are the engineering and assurance behind getting an existing enterprise "
     "there: an Edge Twin that runs real work, GOVERN and ASSURE built in from the start, and "
     "infrastructure that makes each next workflow cheaper than the last. "
     "<a href=\"exo.html\">From ExO 3.0 to production</a>."),
    ("Why do AI workflows fail in production?",
     "Rarely loudly. They keep running and quietly stop being connected to anything: model "
     "output stored as fact, evaluations that drift into comparing against the last report, "
     "agents running on stale context, work routed to the wrong competent handler, and "
     "policies nobody owns any more. We design against these failures."),
    ("What research is the work based on?",
     "<a href=\"research.html\">Quaternion Process Theory of Cognition</a>, a formal account "
     "of how organisations learn and how they quietly stop, with explicit assumptions, a "
     "machine-checked model, and its open problems published alongside its results."),
]


# ---------------------------------------------------------------- JSON-LD

def _text(s):
    """Plain text from a snippet of the site's HTML."""
    return html.unescape(re.sub(r"<[^>]+>", "", s))


def _org():
    return {
        "@type": "Organization",
        "@id": ORG_ID,
        "name": NAME,
        "url": f"{SITE}/",
        "logo": f"{SITE}/assets/img/apple-touch-icon.png",
        "image": f"{SITE}/assets/img/og.png",
        "slogan": "Making the AI-native enterprise real",
        "description": SUMMARY,
        "foundingDate": "2015",
        "address": {"@type": "PostalAddress", "addressLocality": "Arlington",
                    "addressRegion": "VA", "addressCountry": "US"},
        "email": "info@intuitionmachine.com",
        "telephone": "+1-833-846-8848",
        "founder": {"@id": PERSON_ID},
        "knowsAbout": ["Enterprise AI", "AI governance", "AI assurance", "Agentic AI",
                       "AI-native organisations", "ExO 3.0",
                       "Quaternion Process Theory of Cognition"],
        "sameAs": SAME_AS,
    }


def _person():
    return {
        "@type": "Person",
        "@id": PERSON_ID,
        "name": "Carlos E. Perez",
        "alternateName": "Carlos Perez",
        "jobTitle": "Software Architect and Co-Founder",
        "worksFor": {"@id": ORG_ID},
        "alumniOf": {"@type": "CollegeOrUniversity",
                     "name": "University of Massachusetts"},
        "image": f"{SITE}/assets/img/carlos-perez.png",
        "url": f"{SITE}/team.html",
        "sameAs": ["https://www.linkedin.com/in/ceperez"],
    }


def _faq_page(url):
    return {
        "@type": "FAQPage",
        "@id": f"{url}#faq",
        "mainEntity": [{"@type": "Question", "name": q,
                        "acceptedAnswer": {"@type": "Answer", "text": _text(a)}}
                       for q, a in FAQ],
    }


def _books():
    from build_pages import BOOKS_DATA, STORE
    return {
        "@type": "ItemList",
        "name": "Books and field guides from Intuition Machine",
        "itemListElement": [
            {"@type": "ListItem", "position": i,
             "item": {"@type": "Book", "name": _text(title), "description": _text(blurb),
                      "url": f"{STORE}/l/{permalink}",
                      "image": f"{SITE}/assets/img/books/{cover}",
                      "author": {"@id": PERSON_ID}, "publisher": {"@id": ORG_ID}}}
            for i, (permalink, cover, title, kind, price, blurb) in enumerate(BOOKS_DATA, 1)],
    }


def _machines():
    from build_pages import MACHINES_DATA
    return {
        "@type": "ItemList",
        "name": "Machines for the self-learning enterprise",
        "itemListElement": [
            {"@type": "ListItem", "position": i,
             "item": {"@type": "Service", "name": _text(m[1]), "description": _text(m[2]),
                      "url": f"{SITE}/machines.html#{m[0]}", "provider": {"@id": ORG_ID}}}
            for i, m in enumerate(MACHINES_DATA, 1)],
    }


SERVICES = {
    "first-workflow.html": ("Your first governed AI-native workflow",
                            "One business process rebuilt with AI agents inside your existing "
                            "standards, access controls and constraints, run in shadow "
                            "alongside the current process and measured on speed, cost, "
                            "accuracy and exception rate."),
    "how-we-work.html": ("Map, Build, Prove",
                         "Enterprise AI engineering and assurance: map the rules and "
                         "constraints that apply, build governed agent workflows, and prove "
                         "they deliver and stay in bounds."),
}


def jsonld(slug, title, description):
    """The <script type="application/ld+json"> block for one page."""
    url = f"{SITE}/" if slug == "index.html" else f"{SITE}/{slug}"
    page = {
        "@type": "AboutPage" if slug in ("team.html", "about.html") else "WebPage",
        "@id": f"{url}#webpage",
        "url": url,
        "name": _text(title),
        "description": _text(description),
        "inLanguage": "en",
        "isPartOf": {"@id": SITE_ID},
        "about": {"@id": ORG_ID},
        "publisher": {"@id": ORG_ID},
        "primaryImageOfPage": f"{SITE}/assets/img/og.png",
    }
    graph = [_org(), {"@type": "WebSite", "@id": SITE_ID, "url": f"{SITE}/", "name": NAME,
                      "description": SUMMARY, "inLanguage": "en",
                      "publisher": {"@id": ORG_ID}}, page]

    if slug in CRUMBS:
        parent, name = CRUMBS[slug]
        trail = [("Home", f"{SITE}/")]
        if parent:
            trail.append((CRUMBS[parent][1], f"{SITE}/{parent}"))
        trail.append((name, url))
        page["breadcrumb"] = {"@id": f"{url}#breadcrumb"}
        graph.append({"@type": "BreadcrumbList", "@id": f"{url}#breadcrumb",
                      "itemListElement": [{"@type": "ListItem", "position": i, "name": n,
                                           "item": u} for i, (n, u) in enumerate(trail, 1)]})

    if slug in ("index.html", "team.html"):
        graph.append(_person())
    if slug == "index.html":
        graph.append(_faq_page(url))
    if slug == "books.html":
        page["mainEntity"] = _books()
    if slug == "machines.html":
        page["mainEntity"] = _machines()
    if slug in SERVICES:
        name, desc = SERVICES[slug]
        page["mainEntity"] = {"@type": "Service", "name": name, "description": desc,
                              "provider": {"@id": ORG_ID}, "areaServed": "Worldwide",
                              "serviceType": "Enterprise AI engineering and assurance"}

    data = json.dumps({"@context": "https://schema.org", "@graph": graph},
                      ensure_ascii=False, indent=1).replace("</", "<\\/")
    return f'<script type="application/ld+json">\n{data}\n</script>'


# ---------------------------------------------------------------- homepage

def faq_html():
    items = "\n".join(f"""        <div class="faq__item">
          <dt>{html.escape(q)}</dt>
          <dd>{a}</dd>
        </div>""" for q, a in FAQ)
    return f"""<!-- faq:start (generated by ai_search.py) -->
  <section class="wrap section section--ruled" id="faq">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Questions</span>
        <h2>What people ask us</h2>
      </div>
      <dl class="faq">
{items}
      </dl>
    </div>
  </section>
  <!-- faq:end -->"""


def _between(text, name, new):
    start, end = f"<!-- {name}:start", f"<!-- {name}:end -->"
    i, j = text.index(start), text.index(end) + len(end)
    return text[:i] + new + text[j:]


def update_index():
    path = os.path.join(SITE_DIR, "index.html")
    src = open(path, encoding="utf-8").read()
    title = re.search(r"<title>(.*?)</title>", src).group(1)
    desc = re.search(r'<meta name="description" content="(.*?)"', src).group(1)
    out = _between(src, "ld", "<!-- ld:start (generated by ai_search.py) -->\n"
                   + jsonld("index.html", title, desc) + "\n<!-- ld:end -->")
    out = _between(out, "faq", faq_html())
    if out != src:
        with open(path, "w", encoding="utf-8") as f:
            f.write(out)
        print("  updated site/index.html (FAQ, JSON-LD)")


# ---------------------------------------------------------------- llms.txt

class _Text(HTMLParser):
    """The <main> of a page as light Markdown."""
    BLOCK = {"p", "li", "dt", "dd", "h1", "h2", "h3", "h4", "figcaption", "tr", "blockquote"}
    SKIP = {"script", "style", "svg", "nav", "button", "noscript"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.depth, self.skip, self.href = [], 0, 0, None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "main":
            self.depth += 1
        if not self.depth:
            return
        if tag in self.SKIP:
            self.skip += 1
        elif tag in self.BLOCK:
            self.out.append("\n\n" + {"h1": "# ", "h2": "## ", "h3": "### ", "h4": "#### ",
                                      "li": "- ", "dt": "**", "td": ""}.get(tag, ""))
        elif tag in ("div", "section", "figure", "header", "footer", "article") or \
                "label" in (a.get("class") or "").split():
            self.out.append("\n\n")
        elif tag in ("td", "th"):
            self.out.append(" | ")
        elif tag == "br":
            self.out.append("\n")
        elif tag == "a" and a.get("href") and not a["href"].startswith(("#", "mailto:")):
            self.href = a["href"] if a["href"].startswith("http") else f"{SITE}/{a['href']}"
            self.out.append("[")

    def handle_endtag(self, tag):
        if tag == "main":
            self.depth -= 1
        if not self.depth:
            return
        if tag in self.SKIP:
            self.skip -= 1
        elif tag == "dt":
            self.out.append("**")
        elif tag == "a" and self.href:
            self.out.append(f"]({self.href})")
            self.href = None

    def handle_data(self, data):
        if self.depth and not self.skip:
            self.out.append(re.sub(r"\s+", " ", data))

    def text(self):
        t = "".join(self.out)
        t = re.sub(r"\[\s*\]\([^)]*\)", "", t)          # links with no text
        t = re.sub(r"[ \t]+\n", "\n", t)
        t = re.sub(r"\n(#+|-|\*\*) +", r"\n\1 ", t)
        t = re.sub(r"\n{3,}", "\n\n", t)
        return "\n".join(line.strip() for line in t.splitlines()).strip()


def page_text(slug):
    p = _Text()
    p.feed(open(os.path.join(SITE_DIR, slug), encoding="utf-8").read())
    return p.text()


def _meta(slug):
    src = open(os.path.join(SITE_DIR, slug), encoding="utf-8").read()
    title = html.unescape(re.search(r"<title>(.*?)</title>", src).group(1))
    desc = html.unescape(re.search(r'<meta name="description" content="(.*?)"', src).group(1))
    return title.split(" — ")[0] if " — Intuition Machine" in title else title, desc


# Sections of llms.txt, in reading order. Anything in PAGES not listed lands in Optional.
LLMS_SECTIONS = [
    ("Work with us", ["machines.html", "how-we-work.html", "first-workflow.html", "exo.html"]),
    ("Research", ["research.html", "ai-native.html", "kernel.html", "loops.html",
                  "diagnosis.html", "video.html"]),
    ("Publications", ["books.html", "writing.html", "explorations.html"]),
    ("Company", ["team.html", "about.html"]),
]


def write_llms(slugs):
    lines = [f"# {NAME}", "", f"> {SUMMARY}", "",
             f"{NAME} is an enterprise AI engineering and assurance company founded in 2015 "
             "and based in Arlington, Virginia. Its approach is Map, Build, Prove: understand "
             "the enterprise, deploy AI within it, and prove that it works. Its products are "
             "the machines for the self-learning enterprise; its research is Quaternion "
             "Process Theory of Cognition. Contact: info@intuitionmachine.com.", "",
             f"The full text of every page is at {SITE}/llms-full.txt.", ""]
    placed = set()
    for heading, group in LLMS_SECTIONS + [("Optional", [s for s in slugs if s not in
                                            {x for _, g in LLMS_SECTIONS for x in g}])]:
        group = [s for s in group if s in slugs]
        if not group:
            continue
        lines += [f"## {heading}", ""]
        for s in group:
            title, desc = _meta(s)
            lines.append(f"- [{title}]({SITE}/{s}): {desc}")
            placed.add(s)
        lines.append("")
    with open(os.path.join(SITE_DIR, "llms.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    full = [f"# {NAME} — full text", "", f"> {SUMMARY}", "",
            f"Source: {SITE}/ · Index: {SITE}/llms.txt", ""]
    for s in ["index.html"] + [s for _, g in LLMS_SECTIONS for s in g if s in slugs] + \
             [s for s in slugs if s not in placed]:
        url = f"{SITE}/" if s == "index.html" else f"{SITE}/{s}"
        full += ["", "---", "", f"URL: {url}", "", page_text(s), ""]
    with open(os.path.join(SITE_DIR, "llms-full.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(full).strip() + "\n")
    print("  wrote site/llms.txt, site/llms-full.txt")


# ---------------------------------------------------------------- sitemap

PRIORITY = {"index.html": "1.0", "machines.html": "0.9", "how-we-work.html": "0.9",
            "first-workflow.html": "0.9", "exo.html": "0.9", "privacy.html": "0.3",
            "team.html": "0.6", "about.html": "0.6"}


def _lastmod(slug):
    """Date of the last commit that touched the page; today if it has changed since."""
    def git(*args):
        return subprocess.run(["git", *args], cwd=ROOT, capture_output=True,
                              text=True).stdout.strip()
    try:
        if git("status", "--porcelain", "--", f"site/{slug}"):
            return datetime.date.today().isoformat()
        return git("log", "-1", "--format=%cs", "--", f"site/{slug}")
    except OSError:
        return ""


def write_sitemap(slugs):
    rows = []
    for s in ["index.html"] + list(slugs):
        loc = f"{SITE}/" if s == "index.html" else f"{SITE}/{s}"
        mod = _lastmod(s)
        mod = f"<lastmod>{mod}</lastmod>" if mod else ""
        rows.append(f"  <url><loc>{loc}</loc>{mod}<priority>{PRIORITY.get(s, '0.7')}"
                    "</priority></url>")
    with open(os.path.join(SITE_DIR, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                + "\n".join(rows) + "\n</urlset>\n")
    print("  wrote site/sitemap.xml")


def main():
    from build_pages import PAGES
    slugs = [p[0] for p in PAGES]
    update_index()
    write_llms(slugs)
    write_sitemap(slugs)


if __name__ == "__main__":
    main()
