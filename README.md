# intuitionmachine.com

A redesigned static site for [Intuition Machine](https://www.intuitionmachine.com/), plus a
faithful archive of the original Squarespace site it replaced.

Everything is committed and self-contained — no build step, no runtime dependency, and no
requests to any third-party host at page load.

- `site/` — the redesigned site. This is what deploys.
- `archive/` — a byte-faithful mirror of the original Squarespace site, kept for reference.

## Run it locally

```sh
python3 -m http.server 8000 --directory site
```

Then open <http://localhost:8000/>. Any static file server works.

## Deploy to GitHub Pages

This repo deploys to <https://intuitionmachine.com>.

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Push to `main`. `.github/workflows/pages.yml` publishes `site/` on every push.

### Custom domain

`site/CNAME` contains `intuitionmachine.com`, the apex. It must match the domain set under
Settings → Pages, or each deploy will overwrite that setting. DNS at the registrar:

| Type  | Name  | Value                        |
|-------|-------|------------------------------|
| CNAME | `www` | `intuitionmachine.github.io`  |
| A     | `@`   | GitHub Pages IPs (see below) |

GitHub redirects `www` to the apex automatically.

To serve the apex (`intuitionmachine.com`) too, add A records for `@` pointing at
`185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`, plus AAAA
records at `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` and
`2606:50c0:8003::153`. Verify current values in GitHub's Pages documentation before applying.

Tick **Enforce HTTPS** in Settings → Pages once the certificate is issued (usually minutes,
occasionally up to 24 hours).

**Changing this DNS moves the live site off Squarespace.** Deploy first, check the
`github.io` URL, then cut over.

## The design

The direction is a **pattern language** — the lineage behind "Deep Learning Patterns,
Methodology and Strategy". It reads as a technical document rather than a landing page:
drafting-stock paper instead of white, hairline rules as structure, and the brand mark's
own teal used only as a signal colour.

- **Type** — Archivo (display), Source Serif 4 (body), IBM Plex Mono (labels, figure
  numbers, captions). All self-hosted under `site/assets/fonts/`, Latin subsets only.
- **Numbering is used once.** Only the Ingest → Invest cycle is numbered, because it is
  genuinely a sequence. Nothing else gets decorative `01 / 02 / 03` markers.
- **Signature element** — the hero plate (`site/assets/js/site.js`) animates the company's
  actual thesis: scattered unstructured points enter on the left, are pulled onto a lattice
  through the middle, and leave as ordered indexed rows on the right. It renders a single
  static frame under `prefers-reduced-motion`.

### Imagery

The original's photographs were Unsplash stock (the old About page credited them) and have
been dropped. What replaced them:

- Diagrams and icons drawn as SVG and canvas — sharp at any size, a few KB, and specific
  to the subject.
- The cube mark redrawn as clean SVG (`site/assets/img/mark.svg`), carrying the original
  identity forward without the 2015-era bevels and gradients.
- Two genuine product screenshots kept as evidence, desaturated to sit in the palette.
- Carlos's portrait, treated to monochrome.

### Layout

```
site/
  index.html            home — hand-written, since it carries the hero plate
  solutions.html        Software: Connection Machine and Intuition Machine
  research-machine.html the two-week engagement and FAQ
  team.html  about.html
  products.html, design-patterns-access.html   redirects for old URLs
  assets/css/site.css   the whole stylesheet
  assets/js/site.js     hero plate + nav current-page marking
  assets/fonts/         self-hosted woff2 + @font-face
  assets/img/           mark, portrait, product screenshots
  .nojekyll
build_pages.py          regenerates the inner pages from one shared shell
build.py                regenerates archive/ from a wget mirror
```

## Editing

`index.html` is plain HTML — edit it directly.

The inner pages share a header and footer, so they are generated to keep that chrome from
drifting. Edit the content in `build_pages.py` and re-run it:

```sh
python3 build_pages.py
```

The generated HTML is committed, so this is only needed when you change those pages.

## Refreshing the archive

```sh
wget --mirror --page-requisites --convert-links --adjust-extension --no-parent \
  --span-hosts --restrict-file-names=windows -e robots=off --directory-prefix=mirror \
  --domains=www.intuitionmachine.com,images.squarespace-cdn.com,static1.squarespace.com,assets.squarespace.com \
  https://www.intuitionmachine.com/

python3 build.py
```

`build.py` needs only the standard library. It rewrites Squarespace URLs to local paths,
copies `data-src` into `src` so images render without JavaScript, and adds a shim that
swallows the leftover analytics beacons so the mirror does not report traffic to Squarespace.

Two unlinked Squarespace template demo pages (`typography-fulton`, `new-gallery`) are
excluded by default — they are not part of the real site and carry ~52 MB of Squarespace's
own stock photography. Build with `python3 build.py --all` to include them.

## Notes and limitations

- **The newsletter form is gone.** It posted to Squarespace's backend and cannot work on
  static hosting. Rather than render a form that silently fails, the calls to action are
  now direct email links. Wiring up a real form (Formspree, Netlify Forms, Buttondown)
  would be a small change.
- **Commerce and search are gone** for the same reason; both were server-side Squarespace
  features. The old cart page survives only in `archive/`.
- **Some connective copy is new.** Every claim, product description, methodology stage and
  FAQ answer is the original wording. Section headings that had no equivalent in the
  original — "Two systems, one pipeline", "Two weeks to a roadmap", "Who builds it",
  "Patterns, in public" — were written to hold the new structure together.
- **The two addresses in the original disagreed** (a Germantown, MD address on the About
  page; a Cambridge, MA PO box in the footer). The Cambridge one is used throughout; worth
  confirming which is current.
- Fonts are SIL Open Font License 1.1. See `site/assets/fonts/fonts.css`.
