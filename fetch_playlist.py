#!/usr/bin/env python3
"""Refresh site/assets/playlist.json from the YouTube playlist.

The playlist page is rendered client-side, so the video list is scraped out
of the ytInitialData blob embedded in the HTML. YouTube renames its renderers
periodically -- this reads whatever key currently carries the items and falls
back to a scan, so a rename degrades to "no items found" rather than silently
producing a short list.

Run:  python3 fetch_playlist.py
"""
import json
import os
import re
import sys
import urllib.request

PLAYLIST = "PLoOMKjCBaDuX8vYGfcSUgw_84xj3wo62-"
OUT = "site/assets/playlist.json"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120 Safari/537.36")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA,
                                               "Accept-Language": "en-US,en;q=0.9"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")


def initial_data(html):
    """Pull the ytInitialData object by scanning for its closing brace."""
    m = re.search(r"var ytInitialData\s*=\s*", html)
    if not m:
        raise SystemExit("ytInitialData not found; YouTube changed the page shape")
    start = m.end()
    depth = i = 0
    instr = esc = False
    i = start
    while i < len(html):
        c = html[i]
        if instr:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                instr = False
        else:
            if c == '"':
                instr = True
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    i += 1
                    break
        i += 1
    return json.loads(html[start:i])


def collect(node, out):
    """Walk the tree gathering (id, title) from whichever item shape is in use."""
    if isinstance(node, dict):
        # Current shape (2026): lockupViewModel carries contentId + a title.
        lv = node.get("lockupViewModel")
        if isinstance(lv, dict) and lv.get("contentId"):
            out.append((lv["contentId"], find_title(lv)))
        # Older shape, kept so an older cached page still parses.
        pv = node.get("playlistVideoRenderer")
        if isinstance(pv, dict) and pv.get("videoId"):
            out.append((pv["videoId"], find_title(pv)))
        for v in node.values():
            collect(v, out)
    elif isinstance(node, list):
        for v in node:
            collect(v, out)


def find_title(node):
    if isinstance(node, dict):
        for k, v in node.items():
            if k == "title":
                if isinstance(v, dict):
                    c = v.get("content") or v.get("simpleText")
                    if isinstance(c, str) and c.strip():
                        return c.strip()
                    runs = v.get("runs")
                    if isinstance(runs, list) and runs:
                        return "".join(r.get("text", "") for r in runs).strip()
                elif isinstance(v, str) and v.strip():
                    return v.strip()
            got = find_title(v)
            if got:
                return got
    elif isinstance(node, list):
        for v in node:
            got = find_title(v)
            if got:
                return got
    return None


def main():
    html = fetch("https://www.youtube.com/playlist?list=" + PLAYLIST)

    title = "Quaternion Process Theory"
    m = re.search(r'<meta property="og:title" content="([^"]*)"', html)
    if m:
        title = m.group(1)

    raw = []
    collect(initial_data(html), raw)

    seen, videos = set(), []
    for vid, name in raw:
        if vid in seen or not name:
            continue
        seen.add(vid)
        videos.append({"id": vid, "title": name})

    if not videos:
        raise SystemExit("no videos parsed; the page shape changed - fix collect()")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"playlist": PLAYLIST, "title": title, "videos": videos},
                  f, indent=1, ensure_ascii=False)
    print(f"  wrote {OUT}: {len(videos)} videos")


if __name__ == "__main__":
    main()
