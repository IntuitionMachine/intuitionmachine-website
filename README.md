# intuitionmachine.com — static mirror

A self-contained static copy of [www.intuitionmachine.com](https://www.intuitionmachine.com/)
(originally hosted on Squarespace), runnable locally and deployable to GitHub Pages.

Everything the pages need — HTML, CSS, JS, fonts, images — is committed under
`site/`. Nothing is fetched from Squarespace at page load.

## Run it locally

```sh
python3 -m http.server 8000 --directory site
```

Then open <http://localhost:8000/>.

Any static file server works; there is no build step and no runtime dependency.

## Deploy to GitHub Pages

1. Push this repo to GitHub with `main` as the default branch.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main`. `.github/workflows/pages.yml` publishes `site/` on every push.

To serve it from a custom domain, rename `site/CNAME.example` to `site/CNAME`
and set the DNS records GitHub asks for under Settings → Pages.

## Layout

```
site/                 the deployable site (this is the Pages artifact)
  index.html          home
  about.html  team.html  solutions.html  products.html
  research-machine.html  design-patterns-access.html
  cart.html  buy-now-fulton.html  intro-alt-fulton.html  new-cover-page.html
  feed.xml            the blog RSS feed as captured
  assets/img/         page images, pulled from the Squarespace CDN
  assets/vendor/      Squarespace CSS/JS/fonts, directory layout preserved
  .nojekyll           stops Pages running the output through Jekyll
build.py              regenerates site/ from mirror/
.github/workflows/    Pages deploy
```

## Regenerating

`site/` is committed, so you only need this to refresh from the live site.

```sh
# 1. Re-mirror the source site
wget --mirror --page-requisites --convert-links --adjust-extension --no-parent \
  --span-hosts --restrict-file-names=windows -e robots=off --directory-prefix=mirror \
  --domains=www.intuitionmachine.com,images.squarespace-cdn.com,static1.squarespace.com,assets.squarespace.com \
  https://www.intuitionmachine.com/

# 2. Rebuild site/ from it
python3 build.py
```

`build.py` needs only the standard library. It rewrites every Squarespace URL to
a local path, copies `data-src` into `src` so images render without JavaScript,
and drops in a small shim that swallows the leftover analytics beacons.

## Known limitations

These are inherent to serving a Squarespace site as static files:

- **Forms do not submit.** The newsletter signup and any contact forms posted to
  Squarespace's backend. They render, but submissions go nowhere.
- **Commerce is inert.** `cart.html` renders; checkout has no backend.
- **Search does not work** — it was a server-side Squarespace feature.
- **Analytics are intentionally disabled.** A shim in each page's `<head>`
  swallows the `/api/census/*` and `tracing.squarespace.com` beacons so the
  mirror does not report traffic back to Squarespace.
- **Content is frozen** at the time of mirroring. Re-run the steps above to refresh.

Two unlinked Squarespace template demo pages (`typography-fulton`,
`new-gallery`) are excluded by default: they are not part of the real site and
carry ~52 MB of Squarespace's own stock photography. Build with
`python3 build.py --all` to include them.
