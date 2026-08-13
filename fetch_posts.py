#!/usr/bin/env python3
"""Refresh site/assets/posts.json from the Medium publication RSS feed.

The Writing page is baked at build time -- like the video playlist, nothing is
requested from a third-party host when the page loads. This reads the last ten
posts out of the RSS feed, downloads each post's header image into
site/assets/img/posts/, and records everything the page needs.

Run:  python3 fetch_posts.py   (then rebuild with build_pages.py)
"""
import html
import json
import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

FEED = "https://medium.com/feed/intuitionmachine"
PUBLICATION = "https://medium.com/intuitionmachine"
OUT = "site/assets/posts.json"
IMG_DIR = "site/assets/img/posts"
LIMIT = 10
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120 Safari/537.36")

NS = {"content": "http://purl.org/rss/1.0/modules/content/",
      "dc": "http://purl.org/dc/elements/1.1/"}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def strip_tags(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def subtitle(body):
    """First substantial paragraph -- the closest thing to a standfirst."""
    for m in re.finditer(r"<(?:p|h3|h4)[^>]*>(.*?)</(?:p|h3|h4)>", body or "", re.S):
        txt = strip_tags(m.group(1))
        if len(txt) > 40:
            return txt
    return ""


def first_image(body):
    m = re.search(r'<img[^>]+src="([^"]+)"', body or "")
    return m.group(1) if m else None


def slug_id(link):
    """Medium article ids are the trailing hex on the URL slug."""
    tail = link.rstrip("/").rsplit("-", 1)[-1]
    return tail if re.fullmatch(r"[0-9a-f]{6,}", tail) else re.sub(r"\W+", "", tail)[-12:]


def save_image(url, ident):
    try:
        data = fetch(url)
    except Exception as e:  # noqa: BLE001 -- a missing image must not fail the build
        print(f"  ! image for {ident} failed: {e}")
        return None
    ext = "png" if data[:8] == b"\x89PNG\r\n\x1a\n" else "jpg"
    os.makedirs(IMG_DIR, exist_ok=True)
    name = f"{ident}.{ext}"
    with open(os.path.join(IMG_DIR, name), "wb") as f:
        f.write(data)
    return f"assets/img/posts/{name}"


def main():
    root = ET.fromstring(fetch(FEED))
    items = root.findall("./channel/item")[:LIMIT]

    posts = []
    for it in items:
        title = strip_tags(it.findtext("title") or "")
        link = (it.findtext("link") or "").split("?")[0]
        if not title or not link:
            continue
        ident = slug_id(link)
        dt = parsedate_to_datetime(it.findtext("pubDate") or "")
        author = strip_tags(it.findtext("dc:creator", namespaces=NS) or "")
        cats = [strip_tags(c.text or "") for c in it.findall("category")]
        body = it.findtext("content:encoded", namespaces=NS) or ""
        img = first_image(body)
        local = save_image(img, ident) if img else None
        sub = subtitle(body)
        if len(sub) > 180:
            sub = sub[:177].rstrip() + "…"
        posts.append({
            "title": title,
            "link": link,
            "date": dt.strftime("%-d %b %Y") if dt else "",
            "iso": dt.strftime("%Y-%m-%d") if dt else "",
            "author": author,
            "tags": [c for c in cats if c][:3],
            "subtitle": sub,
            "image": local,
        })

    if not posts:
        raise SystemExit("no posts parsed; the feed shape changed")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"publication": PUBLICATION, "posts": posts},
                  f, indent=1, ensure_ascii=False)
    print(f"  wrote {OUT}: {len(posts)} posts")


if __name__ == "__main__":
    main()
