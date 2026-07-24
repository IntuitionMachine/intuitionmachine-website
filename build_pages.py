#!/usr/bin/env python3
"""Generate the inner pages of site/ from one shared shell.

index.html is hand-written (it has the hero plate); everything else is
assembled here so the header, footer and metadata cannot drift apart.

Run:  python3 build_pages.py
"""
import os

OUT = "site"

NAV = [
    ("index.html", "Home"),
    ("solutions.html", "Software"),
    ("research-machine.html", "Research Machine"),
    ("team.html", "Team"),
    ("about.html", "Contact"),
]

MARK = """<svg width="0" height="0" aria-hidden="true" style="position:absolute">
  <symbol id="mark" viewBox="0 0 64 64">
    <polygon points="32,6 54.5,19 32,32 9.5,19" fill="currentColor" opacity=".95"/>
    <polygon points="9.5,19 32,32 32,58 9.5,45" fill="currentColor" opacity=".5"/>
    <polygon points="54.5,19 54.5,45 32,58 32,32" fill="currentColor" opacity=".72"/>
  </symbol>
</svg>"""

CM_ICON = """<svg class="product__icon" viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <path d="M8 8 L22 22 L8 22 M8 36 L22 22 L36 8 M22 22 L36 22 M22 22 L36 36" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="8" cy="8" r="2.8" fill="currentColor" stroke="none"/>
          <circle cx="8" cy="22" r="2.8" fill="currentColor" stroke="none"/>
          <circle cx="8" cy="36" r="2.8" fill="currentColor" stroke="none"/>
          <circle cx="36" cy="8" r="2.8" fill="currentColor" stroke="none"/>
          <circle cx="36" cy="22" r="2.8" fill="currentColor" stroke="none"/>
          <circle cx="36" cy="36" r="2.8" fill="currentColor" stroke="none"/>
          <circle cx="22" cy="22" r="4.4" fill="currentColor" stroke="none"/>
        </svg>"""

IM_ICON = """<svg class="product__icon" viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <path d="M7 11 H31 M7 19 H24 M7 27 H18" stroke-linecap="round"/>
          <circle cx="27.5" cy="28.5" r="8"/>
          <path d="M33.4 34.4 L39 40" stroke-linecap="round"/>
        </svg>"""

PRODUCTS = f"""<div class="products">
      <article class="product">
        {CM_ICON}
        <span class="product__abbr">CM</span>
        <h3>Connection Machine</h3>
        <p class="product__role">Deep Learning Analytics Suite</p>
        <ul class="caps">
          <li>Data Inventory and Discovery</li>
          <li>Deep Learning Analytics Lifecycle management</li>
          <li>Scalable Spark and TensorFlow based Deep Learning</li>
        </ul>
      </article>

      <article class="product">
        {IM_ICON}
        <span class="product__abbr">IM</span>
        <h3>Intuition Machine</h3>
        <p class="product__role">Deep Question and Answer</p>
        <ul class="caps">
          <li>Automate codification of enterprise knowledge</li>
          <li>Leveraging Deep Learning Analytics</li>
          <li>Query Unstructured Data from Learned Features</li>
          <li>User friendly Natural Language Queries</li>
        </ul>
      </article>
    </div>"""

SHOTS = """<div class="shots">
      <figure class="shot">
        <img src="assets/img/cm-catalog.png" width="1618" height="1024" loading="lazy"
             alt="Catalog analysis screen showing distributions of entities, types and fields across ingested data sources.">
        <figcaption class="label">Fig. 02 — Catalogue analysis across ingested sources</figcaption>
      </figure>
      <figure class="shot">
        <img src="assets/img/cm-mapping.png" width="1326" height="873" loading="lazy"
             alt="Schema mapping screen showing inferred semantic types for each column of a dataset.">
        <figcaption class="label">Fig. 03 — Inferred semantic types per column</figcaption>
      </figure>
    </div>"""

CTA = """<section class="band--deep">
    <div class="wrap section cta">
      <h2>Leverage Deep Learning to improve your Business Processes.</h2>
      <p class="lede">Start with a two-week roadmap that turns one business problem into a
      Deep Learning proof of concept.</p>
      <div class="cta__actions">
        <a class="btn btn--lit" href="research-machine.html">Find out how</a>
        <a class="btn btn--lit" style="background:transparent;border-color:#43c4b0;color:#43c4b0"
           href="mailto:info@intuitionmachine.com">info@intuitionmachine.com</a>
      </div>
    </div>
  </section>"""


def shell(slug, title, description, body):
    nav = "\n      ".join(
        f'<a href="{href}">{text}</a>' for href, text in NAV
    )
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="icon" href="assets/img/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="assets/css/site.css">
</head>
<body>

<a class="skip" href="#main">Skip to content</a>

{MARK}

<header class="masthead">
  <div class="wrap masthead__inner">
    <a class="brand" href="index.html">
      <svg style="color:var(--signal)"><use href="#mark"></use></svg>
      <b>Intuition Machine</b>
    </a>
    <nav class="nav" aria-label="Primary">
      {nav}
    </nav>
  </div>
</header>

<main id="main">
{body}
</main>

<footer class="foot">
  <div class="wrap">
    <div class="foot__grid">
      <div>
        <a class="brand" href="index.html" style="color:var(--signal-lit)">
          <svg><use href="#mark"></use></svg>
          <b style="color:var(--paper-hi)">Intuition Machine</b>
        </a>
        <p style="margin-top:.9rem;max-width:34ch">Deep Learning Patterns, Methodology and Strategy™</p>
      </div>
      <div>
        <h4>Site</h4>
        <ul>
          <li><a href="solutions.html">Software</a></li>
          <li><a href="research-machine.html">Research Machine</a></li>
          <li><a href="team.html">Team</a></li>
          <li><a href="about.html">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4>Elsewhere</h4>
        <ul>
          <li><a href="https://medium.com/intuitionmachine/archive" rel="noopener">Blog</a></li>
          <li><a href="https://twitter.com/IntuitMachine" rel="noopener">Twitter</a></li>
          <li><a href="mailto:info@intuitionmachine.com">info@intuitionmachine.com</a></li>
        </ul>
      </div>
    </div>
    <div class="foot__base">
      <span>Intuition Machine, 1200 South Arlington Ridge Road, 508, Arlington, VA 22202, USA</span>
      <span>(833) 8INTUIT</span>
    </div>
  </div>
</footer>

<script src="assets/js/site.js"></script>
</body>
</html>
"""


# --------------------------------------------------------------------------
# Page bodies
# --------------------------------------------------------------------------

SOLUTIONS = f"""
  <section class="wrap page-head">
    <span class="label">Software</span>
    <h1>Two systems, one pipeline</h1>
    <p class="lede">One carries data from scattered silos into an indexed catalogue.
    The other answers questions against it in plain language.</p>
  </section>

  <section class="wrap section section--ruled">
    {PRODUCTS}
    {SHOTS}
  </section>

  {CTA}
"""

RESEARCH = f"""
  <section class="wrap page-head">
    <span class="label">Research Machine</span>
    <h1>A Low Risk Entry Point to AI</h1>
    <p class="lede">We’ll take you step-by-step through the process of turning your ideas
    into a Deep Learning machine.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">The premise</span>
        <h2>Electricity transformed countless industries. How are you Plugging In?</h2>
      </div>
      <div class="prose">
        <p>Research Machine is Intuition Machine’s suite of services that enable Deep Learning
        in a business workflow. It shape-shifts, depending on the chosen entry point into
        Deep Learning.</p>
        <p>It is a Roadmap Project Plan, which details the steps that a group needs to take
        to get started. The Roadmap leads to a Proof of Concept, which is a learning vehicle
        for tweaking what the next step, the Pilot Project, would look like.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">The engagement</span>
      <h2>Two weeks to a roadmap</h2>
    </div>
    <div class="steps">
      <article class="step">
        <span class="label step__label">Week 01 — Strategy and Idealization</span>
        <h3>Find the problem worth solving</h3>
        <p>We’ll identify and refine your key value proposition, project objectives, verify it
        against the state-of-the-art AI technology and design patterns. We’ll apply the most
        effective combination of learning algorithms to the data and business problem that you
        are most eager to solve. We’ll provide you with a roadmap that is customized to your
        business needs and highlights specific opportunities were AI can be leveraged.</p>
      </article>
      <article class="step">
        <span class="label step__label">Week 02 — Deep Dive and Roadmap</span>
        <h3>Turn it into an end-to-end plan</h3>
        <p>From evaluating data sources, ingesting structured and unstructured data, data
        munging, to creating training sets that jump start the Deep Learning process. By week’s
        end you have a comprehensive end-to-end roadmap you can take to any Data Engineering
        team to get you going on the Proof of Concept – Pilot Project – Production Environment
        journey.</p>
      </article>
      <article class="step">
        <span class="label step__label">Then — Proof of Concept</span>
        <h3>Define every aspect</h3>
        <p>Now comes more work. We’ll define every aspect of your Deep Learning
        Proof-of-Concept.</p>
      </article>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">FAQ</span>
      <h2>Questions</h2>
    </div>
    <div class="faq">

      <details>
        <summary>Why ‘Research Machine’?</summary>
        <div class="faq__body">
          <p>The reason we exist is to accelerate the actualization of Deep Learning instances
          in the real world. Read: we want to cut through the clutter of current academic
          journals and newspaper articles, and get this AI in the hands of practitioners.</p>
          <p>The broad field of “Research” is being affected by many forces: the routine of
          updating excel rows and columns with even more data, the explosion of more fields to
          fill in, the explosion of unstructured data that can give more clarity to an analyst’s
          insights, the increase in frequency of this data availability – from quarterly to
          by-the-second. All these data and how they are analyzed support evidence-based
          investments and decision-making.</p>
          <p>It is clear that a faster and more comprehensive way of getting ahead of this
          explosion of opportunities is through Artificial Intelligence, more specifically Deep
          Learning. We created Research Machine to be the tool for research-intensive
          organizations.</p>
        </div>
      </details>

      <details>
        <summary>What is Research Machine?</summary>
        <div class="faq__body">
          <p>Research Machine is Intuition Machine’s suite of services that enable Deep Learning
          in a business workflow. It shape-shifts, depending on the chosen entry point into Deep
          Learning. It is a Roadmap Project Plan, which details the steps that a group needs to
          take to get started.</p>
          <p>The Roadmap leads to a Proof of Concept, which is a learning vehicle for tweaking
          what the next step, the Pilot Project, would look like. The Proof of Concept stage is
          also where a good fitting is made with ongoing workflows of the group. Finally, the
          Pilot Project gives way to a Production Environment, which is a point where the group
          begins to derive benefits from using Artificial Intelligence in the workplace.</p>
        </div>
      </details>

      <details>
        <summary>Explain the Iteration and Learning Process</summary>
        <div class="faq__body">
          <p>Sure. Just like a startup, the use of Artificial Intelligence is based on a number
          of hypotheses. “We can save on headcount expenses by using AI”, or “We can augment the
          work of our current analysts with AI”, or “AI can help our analysts absorb more, and
          more disparate information”, or “We can gain more customers when we show that our work
          is augmented by AI algorithms.”</p>
          <p>All these hypotheses define a certain goal for using Deep Learning in the workflow,
          and therefore, determine what milestones to cross on the road to successfully proving
          the hypothesis. This will require iteration through many ideas for how to implement the
          Proof of Concept -to- Production Environment journey.</p>
        </div>
      </details>

      <details>
        <summary>Are you a hardware or software company?</summary>
        <div class="faq__body">
          <p>Yes. Ultimately, what enabled the stunning advances in Deep Learning is a
          combination of: very large data sets to train on, very fast hardware (GPU – graphics
          processing units) that can perform the algorithms required by the third component, the
          software patterns defined by the problem.</p>
          <p>You have a choice of hosting these data and software in the cloud, or on-prem, via
          hardware and software (which designs are mostly open source, thereby reducing cost of
          entry).</p>
        </div>
      </details>

      <details>
        <summary>Who can use Research Machine, and why?</summary>
        <div class="faq__body">
          <p>Research Machine if for teams, groups or businesses that analyze and report some
          conclusion based on research. This can be as large as the largest research departments
          on Wall Street, or as small as the independent Research Consultant or Equity
          Researcher.</p>
          <p>It can be the bond trader updating information on multiple portfolio elements, or
          the distressed securities analyst going through mounds of discovery documents. It can
          be the oil trading group analyzing changes in satellite imagery of Rotterdam oil tanks,
          or a retail analyst evaluating shopping mall parking lot congestion.</p>
          <p>Research is not just just for the investment and finance industry. All around the
          world, huge strategic decisions are being made and validated based on competitor
          analysis. Sensors, tweets, blog posts, customer comments on public forums, conference
          results – all define a large and growing source of data that must also enter into the
          research equation. We believe the Deep Learning software in Research Machine can help
          get ahead of this growing threat – and opportunity.</p>
        </div>
      </details>

    </div>
  </section>

  {CTA}
"""

TEAM = f"""
  <section class="wrap page-head">
    <span class="label">Wetware</span>
    <h1>Who builds it</h1>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="person">
        <img class="person__portrait" src="assets/img/carlos-perez.png" width="156" height="156"
             alt="Carlos Perez">
        <div>
          <h3>Carlos Perez</h3>
          <p class="person__meta">Software Architect &nbsp;·&nbsp; MS Comp. Sci., UMass &nbsp;·&nbsp; Co-Founder</p>
          <a class="person__link" href="https://www.linkedin.com/in/ceperez" rel="noopener">LinkedIn profile →</a>
        </div>
      </div>
    </div>
  </section>

  <section class="wrap section">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Writing</span>
        <h2>Patterns, in public</h2>
      </div>
      <div class="prose">
        <p>Intuition Machine publishes an ongoing series on Deep Learning patterns, methodology
        and strategy.</p>
        <p><a class="btn btn--ghost" style="margin-top:.6rem"
              href="https://medium.com/intuitionmachine/archive" rel="noopener">Read the archive</a></p>
      </div>
    </div>
  </section>

  {CTA}
"""

ABOUT = f"""
  <section class="wrap page-head">
    <span class="label">Contact</span>
    <h1>Get in touch</h1>
    <p class="lede">Tell us the business problem you want to put Deep Learning against.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="contact-grid">
      <div class="contact-cell">
        <span class="label">Email</span>
        <p><a href="mailto:info@intuitionmachine.com">info@intuitionmachine.com</a></p>
      </div>
      <div class="contact-cell">
        <span class="label">Telephone</span>
        <p><a href="tel:+18338346884">(833) 8INTUIT</a></p>
      </div>
      <div class="contact-cell">
        <span class="label">Post</span>
        <p>Intuition Machine<br>1200 South Arlington Ridge Road, 508<br>Arlington, VA 22202<br>USA</p>
      </div>
    </div>
  </section>

  {CTA}
"""

PAGES = [
    ("solutions.html", "Software — Intuition Machine",
     "Connection Machine and Intuition Machine: a Deep Learning analytics suite and a "
     "deep question and answer system.", SOLUTIONS),
    ("research-machine.html", "Research Machine — Intuition Machine",
     "A low risk entry point to AI: a two-week engagement that turns one business problem "
     "into a Deep Learning roadmap and proof of concept.", RESEARCH),
    ("team.html", "Team — Intuition Machine",
     "Carlos Perez, Software Architect and Co-Founder of Intuition Machine.", TEAM),
    ("about.html", "Contact — Intuition Machine",
     "Contact Intuition Machine.", ABOUT),
]

# Old Squarespace URLs that used to resolve, pointed at their new homes.
REDIRECTS = {
    "products.html": "research-machine.html",
    "design-patterns-access.html": "research-machine.html",
}


def redirect_page(target):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url={target}">
<link rel="canonical" href="{target}">
<title>Redirecting…</title>
</head>
<body>
<p>This page has moved to <a href="{target}">{target}</a>.</p>
</body>
</html>
"""


def main():
    for slug, title, desc, body in PAGES:
        html = shell(slug, title, desc, body)
        with open(os.path.join(OUT, slug), "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  wrote {OUT}/{slug}")

    for slug, target in REDIRECTS.items():
        with open(os.path.join(OUT, slug), "w", encoding="utf-8") as f:
            f.write(redirect_page(target))
        print(f"  wrote {OUT}/{slug} -> {target}")


if __name__ == "__main__":
    main()
