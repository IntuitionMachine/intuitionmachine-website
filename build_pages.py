#!/usr/bin/env python3
"""Generate the inner pages of site/ from one shared shell.

index.html is hand-written (it carries the film poster); everything else is
assembled here so the header, footer and metadata cannot drift apart.

spec.html is the full QPT specification rendered from the markdown source in
the repository root.

Run:  python3 build_pages.py
"""
import json
import os

import ai_search
import figures

OUT = "site"
PLAYLIST_JSON = "site/assets/playlist.json"


def playlist_data():
    """The video list, inlined into the page rather than fetched at runtime."""
    try:
        with open(PLAYLIST_JSON, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {"playlist": "PLoOMKjCBaDuX8vYGfcSUgw_84xj3wo62-",
                "title": "Quaternion Process Theory", "videos": []}

NAV = [
    ("index.html", "Home"),
    ("machines.html", "Machines"),
    ("how-we-work.html", "How we work"),
    ("first-workflow.html", "First workflow"),
    ("exo.html", "ExO 3.0"),
    ("research.html", "Research"),
    ("explorations.html", "Explorations"),
    ("books.html", "Books"),
    ("writing.html", "Writing"),
    ("about.html", "Contact"),
]

MARK = ""   # the cube is now supplied artwork, not an inline symbol

CTA = """<section class="band--deep">
    <div class="wrap section cta">
      <h2>Start with one workflow.</h2>
      <p class="lede">We map your constraints, build a governed AI workflow alongside your
      existing operations, and prove the results before autonomy expands.</p>
      <div class="cta__actions">
        <a class="btn btn--lit" href="first-workflow.html">Your first workflow</a>
        <a class="btn btn--lit" style="background:transparent;border-color:#43c4b0;color:#43c4b0"
           href="mailto:info@intuitionmachine.com">info@intuitionmachine.com</a>
      </div>
    </div>
  </section>"""


def render_figures(body):
    """Swap <!--FIG_X--> sentinels for the SVG in figures.py.

    Sentinels rather than f-string interpolation: the page bodies quote formal
    notation containing literal braces, which an f-string would try to eval.
    """
    for name in dir(figures):
        if name.startswith("FIG_"):
            body = body.replace(f"<!--{name}-->", getattr(figures, name))
    return body


SITE = "https://intuitionmachine.com"


def shell(title, description, body, body_class="", slug="index.html"):
    def nav_link(href, text):
        rel = ' rel="noopener"' if href.startswith("http") else ""
        return f'<a href="{href}"{rel}>{text}</a>'
    nav = "\n      ".join(nav_link(href, text) for href, text in NAV)
    cls = f' class="{body_class}"' if body_class else ""
    body = render_figures(body)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{SITE}/{slug}">
<link rel="icon" href="assets/img/favicon.ico" sizes="any">
<link rel="icon" href="assets/img/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Intuition Machine">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{SITE}/{slug}">
<meta property="og:image" content="{SITE}/assets/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Intuition Machine — Making the AI-native enterprise real.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{description}">
<meta name="twitter:image" content="{SITE}/assets/img/og.png">

<link rel="stylesheet" href="assets/css/site.css">
{ai_search.jsonld(slug, title, description)}
</head>
<body{cls}>

<a class="skip" href="#main">Skip to content</a>

{MARK}

<header class="masthead">
  <div class="wrap masthead__inner">
    <a class="brand" href="index.html">
      <img class="brand__mark" src="assets/img/mark.png" width="193" height="235" alt="">
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
          <img class="brand__mark" src="assets/img/mark.png" width="193" height="235" alt="">
          <b style="color:var(--paper-hi)">Intuition Machine</b>
        </a>
        <p style="margin-top:.9rem;max-width:34ch">Enterprise AI Engineering &amp; Assurance</p>
      </div>
      <div>
        <h4>Work with us</h4>
        <ul>
          <li><a href="machines.html">The machines</a></li>
          <li><a href="how-we-work.html">How we work</a></li>
          <li><a href="first-workflow.html">Your first workflow</a></li>
          <li><a href="exo.html">ExO 3.0</a></li>
          <li><a href="team.html">Team</a></li>
          <li><a href="about.html">Contact</a></li>
          <li><a href="mailto:info@intuitionmachine.com">info@intuitionmachine.com</a></li>
        </ul>
      </div>
      <div>
        <h4>Research</h4>
        <ul>
          <li><a href="research.html">Overview</a></li>
          <li><a href="ai-native.html">AI-Native Organisations</a></li>
          <li><a href="kernel.html">The Kernel</a></li>
          <li><a href="loops.html">The Loops</a></li>
          <li><a href="diagnosis.html">Diagnosis</a></li>
          <li><a href="explorations.html">Explorations</a></li>
          <li><a href="video.html">Video</a></li>
          <li><a href="books.html">Books</a></li>
          <li><a href="writing.html">Writing</a></li>
        </ul>
      </div>
    </div>
    <div class="foot__base">
      <span>Intuition Machine, 1200 South Arlington Ridge Road, 508, Arlington, VA 22202, USA</span>
      <span>(833) 8INTUIT &#160;·&#160; <a href="privacy.html">Privacy &amp; cookies</a></span>
    </div>
  </div>
</footer>

<script src="assets/js/site.js"></script>
</body>
</html>
"""


# --------------------------------------------------------------------------
# The Kernel
# --------------------------------------------------------------------------

AINATIVE = """
  <section class="wrap page-head">
    <span class="label">Research</span>
    <h1>AI-native organisations have a shape, and the shape is specifiable</h1>
    <p class="lede">The labs that compound are not running a plan-execute pipeline with a
    model bolted on. They are built as learning loops themselves. That architecture can be
    written down — and once written down, it can be checked.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">The premise</span>
        <h2>You cannot host a learning system inside a pipeline</h2>
      </div>
      <div class="prose">
        <p>A pipeline organisation asks what you will discover before you discover it. It
        funds plans, reviews against plans, and treats a changed plan as a failure of
        planning. Everything it measures is convention checked against other convention.</p>
        <p>A learning organisation cannot make that promise and should not be asked to. Its
        unit of work is a cheap trial with an honest result, and its unit of memory is the
        machinery that made the trial cheap. The way you organise has to match the way you
        actually do the work.</p>
        <p>Both organisations pass their own audits. That is the whole problem, and it is why
        the difference has to be stated formally rather than felt.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">The architecture</span>
      <h2>Six layers, each with a formal counterpart</h2>
      <p class="lede prose" style="margin-top:1.2rem">Read top to bottom: the upper layers
      constrain the lower ones. Read bottom to top: the lower layers must be able to attack
      the upper ones. An organisation with only the first reading ossifies.</p>
    </div>

    <figure class="fig" style="margin-top:0">
      <!--FIG_LAYERS-->
      <figcaption class="label">Fig. 01 — The layers, and the constructs that specify them</figcaption>
    </figure>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div>
        <div class="failure">
          <span class="label">01 &nbsp;·&nbsp; ⦿P &nbsp;·&nbsp; identity coherence</span>
          <h3>An invariant core</h3>
          <p>One premise that is not relitigated weekly, and which licenses the only genuinely
          top-down act: deciding what <em>not</em> to do. It is what lets a shared direction
          hold without constant realignment. In the theory this is the identity loop, and its
          protection is structural — the standard a system measures against cannot be moved by
          the measuring.</p>
        </div>
        <div class="failure">
          <span class="label">02 &nbsp;·&nbsp; ⦿K + ⦿M* &nbsp;·&nbsp; knowledge and audit</span>
          <h3>One System, pointed at arbitrary problems</h3>
          <p>Not a product: an internal machine that can generate data for a new question, run
          the trial, read the signal and kill it, in days. Its value is reuse — the same
          machinery aimed at a different problem next month. Every project owes it a payment
          back, so the organisation's weights improve with each problem it survives.</p>
        </div>
        <div class="failure">
          <span class="label">03 &nbsp;·&nbsp; ⦿O ⦿C &nbsp;·&nbsp; autonomy distribution</span>
          <h3>Units under contract, not under plan</h3>
          <p>Fix the rhythm and the interfaces; leave the content free. Nobody is asked to plan
          what they will discover, only to run cheap trials and report true results. The
          theory's condition here is exact: the interface between management and operations
          must carry current encounter, never an imposed convention standing in for it.</p>
        </div>
      </div>
      <div>
        <div class="failure">
          <span class="label">04 &nbsp;·&nbsp; ⦿G &nbsp;·&nbsp; grounding</span>
          <h3>No wall between research and product</h3>
          <p>The same System that attacks a capability tests whether a product finds its
          market; the same people jam and ship. Products are experiments that escaped.
          A handoff wall is a broken descent chain — the side that ships stops touching what
          the side that learns touched.</p>
        </div>
        <div class="failure">
          <span class="label">05 &nbsp;·&nbsp; ⊕ ⊳ &nbsp;·&nbsp; composition</span>
          <h3>Coherence as the unit of ambition</h3>
          <p>Parallel tracks periodically resolve into one statement rather than shipping as
          disconnected singles. Leadership's concrete artefact between releases is sequencing.
          Done means the thing holds together, not that a number moved.</p>
        </div>
        <div class="failure">
          <span class="label">06 &nbsp;·&nbsp; ⦿R + V9a &nbsp;·&nbsp; the licensed saboteur</span>
          <h3>A standing channel against the design itself</h3>
          <p>A System that repeats itself successfully is optimising yesterday. So any unit
          must be able to attack the top-level design cheaply, and the most successful process
          must be scheduled for demolition. This is the layer almost nobody builds, and the
          theory says exactly why its absence is invisible: no audit above it can see that it
          is missing.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="section__head">
        <span class="label">The load-bearing part</span>
        <h2>A System that flatters you is worse than no System</h2>
        <p class="lede prose" style="margin-top:1.2rem">The whole architecture rests on
        evaluations nobody can charm their way past. Lose that and every layer above keeps
        running, on signal that has quietly stopped being connected to anything.</p>
      </div>
      <figure class="fig">
        <!--FIG_SYSTEM-->
        <figcaption class="label">Fig. 02 — The difference is one fold</figcaption>
      </figure>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">How it stops</span>
      <h2>Four failures, each of which passes review</h2>
    </div>
    <div class="split">
      <div>
        <div class="failure">
          <h3>The System starts flattering</h3>
          <p>Evaluation drifts from measuring against what happened to measuring against the
          last report. Reports keep arriving on schedule. Nothing announces the change.</p>
        </div>
        <div class="failure">
          <h3>The saboteur is never paged</h3>
          <p>The insubordination channel still exists on the org chart and nothing routes to
          it. The capacity is intact and unreachable — which no review of the capacity itself
          will ever detect.</p>
        </div>
      </div>
      <div>
        <div class="failure">
          <h3>The constitution outlives its editor</h3>
          <p>The founding premise has an impeccable paper trail and no living owner empowered
          to revise it. It keeps executing while the world drifts. Constitutions are the
          hardest thing to amend and the easiest thing to orphan.</p>
        </div>
        <div class="failure">
          <h3>The work is proceduralised past its ceiling</h3>
          <p>Under commercial pressure the factory logic creeps back and standardises work
          that descends to felt quality. The theory caps how far any process can be
          standardised by how deep it goes; push past that and the work dies while the process
          reports health.</p>
        </div>
      </div>
    </div>
  </section>


  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">Where this is fragile</span>
      <h2>Three places the architecture strains, and what the theory does about each</h2>
      <p class="lede prose" style="margin-top:1.2rem">An architecture that cannot say where it
      is weak is not an architecture, it is a sales deck. These are the three real stress
      points. None is dissolved. Each is converted from a matter of judgement into something
      with a name, a test, and a way of being wrong.</p>
    </div>

    <div class="steps">
      <article class="step">
        <span class="label step__label">Stress 01 &nbsp;·&nbsp; the core is a bet</span>
        <h3>The greatest coordination asset is the hardest thing to amend</h3>
        <p>The invariant core works <em>because</em> it is not relitigated. That is also what
        makes it dangerous: if the premise bends, the asset becomes the liability, and by
        construction nobody is arguing about it.</p>
        <p><b>What the theory adds.</b> A standing convention is <em>orphaned</em> when it is
        perfectly grounded in the evidence that once justified it and has no living owner
        empowered to revise it. Its paper trail is impeccable — that is precisely why no audit
        catches it. The answer is not a weaker constitution but a named editor with a live
        path, and the test is blunt: propose a revision and see whether any route exists by
        which it could be adopted or rejected. If there is none, the core is already an
        artefact.</p>
      </article>

      <article class="step">
        <span class="label step__label">Stress 02 &nbsp;·&nbsp; layers 02 and 06 pull apart</span>
        <h3>The System wants to standardise; the anti-machine wants to demolish</h3>
        <p>These are in permanent tension, and organisations usually resolve it by whoever
        argues hardest or whoever the quarter favours.</p>
        <p><b>What the theory adds.</b> The disagreement is typed, not political. How far any
        process can be standardised is capped by how deep into felt experience its work
        descends. Management never goes below encounter, and proceduralises nearly to
        identity. Grounding and reflexive quality descend to felt quality, and quality-level
        content cannot be transmitted on demand — so they can promise the same meaning, never
        the same steps. The tension resolves by depth rather than seniority. It is also
        separable in data, which is to say it is a claim that can turn out false.</p>
      </article>

      <article class="step">
        <span class="label step__label">Stress 03 &nbsp;·&nbsp; the factory returns</span>
        <h3>Under commercial pressure the deterministic logic creeps back</h3>
        <p>It comes back through the product side, and it comes back quietly — as sensible
        discipline, from people acting in good faith.</p>
        <p><b>What the theory adds.</b> It has a signature. The interface that used to carry
        current encounter starts carrying an imposed convention instead: last quarter's plan
        dressed as this quarter's input. One tag on one input changes; the loop still runs and
        the reports still arrive. And the ceiling conjecture says which work dies first —
        whatever descends deepest, which is exactly the work the organisation was built to
        protect.</p>
      </article>
    </div>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="section__head">
        <span class="label">Run it yourself</span>
        <h2>Four questions, answerable this week, without us</h2>
        <p class="lede prose" style="margin-top:1.2rem">A diagnostic that only works when we
        run it is not a diagnostic. Each of these has a definite answer, and each maps to a
        condition the theory states formally.</p>
      </div>

      <div class="terms">
        <div class="term">
          <span class="term__glyph">01</span>
          <h3>The editor test</h3>
          <p>Pick a standing rule everyone follows. Propose a revision. If no path exists by
          which that proposal could be evaluated and adopted or rejected, the rule has no
          editor — and it will keep executing after the world it fitted is gone.</p>
        </div>
        <div class="term">
          <span class="term__glyph">02</span>
          <h3>The witness test</h3>
          <p>Take a claim from your last board deck and ask for the chain down to something
          that actually happened: claim, interpretation, log, event. Count the hops. Claims
          with no chain are not lies — they are simply uncheckable, and therefore capturable.</p>
        </div>
        <div class="term">
          <span class="term__glyph">03</span>
          <h3>The routing test</h3>
          <p>When did anything last reach the process that senses the quality of your own
          formal structures, and who sent it there? A capacity nobody routes to is disabled
          without ever being touched, and no review of that capacity will show it.</p>
        </div>
        <div class="term">
          <span class="term__glyph">04</span>
          <h3>The ceiling test</h3>
          <p>List the processes that descend to felt judgement. Now check which of them are
          held to a same-steps-every-time standard. Every match is work being standardised
          past its ceiling, and it will degrade while its metrics improve.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">What would make this wrong</span>
        <h2>The claims carry their own kill conditions</h2>
      </div>
      <div class="prose">
        <p>Editor liveness ships with the condition that would falsify it: if healthy
        conventions with no living owner turn out to be common in the wild, it is not a
        viability condition and demotes to a heuristic. The ceiling conjecture is labelled
        semi-formal because the model family that would verify it has not been built. The
        selector is labelled framework, with its formalisation deferred to a numbered open
        problem.</p>
        <p>One loop in the published inventory does not close as printed. It is flagged in the
        specification, and it is flagged on <a href="loops.html">this site</a> — our own
        implementation of the rules reproduces the anomaly rather than papering over it.</p>
        <p>This is the part that should make the rest credible. An account that never says
        what would refute it is not offering you a way to check its work.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">In practice</span>
        <h2>From architecture to working systems</h2>
      </div>
      <div class="prose">
        <p>This architecture is the reason we engineer AI workflows the way we do. Every agent
        we deploy is evaluated against what actually happened, not against the last report;
        every rule it enforces has an owner; and every workflow keeps a channel through which
        it can be challenged.</p>
        <p>In an engagement that becomes <a href="how-we-work.html">Map, Build, Prove</a> —
        and it usually starts with <a href="first-workflow.html">one governed workflow</a>.
        Where an organisation already runs, the <a href="diagnosis.html">seven-layer
        diagnostic</a> establishes which of its loops actually close and which of its standing
        rules no longer have an owner.</p>
      </div>
    </div>
  </section>

  
""" + CTA + """
"""

KERNEL = """
  <section class="wrap page-head">
    <span class="label">The Kernel</span>
    <h1>Three levels, four columns, one operator</h1>
    <p class="lede">QML — the Quaternion Modeling Language — is a short list of ingredients,
    seven axioms, one derived operator, and one small model in which every formal claim has
    been machine-checked.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">The matrix, executed</span>
      <h2>Run a word and watch where it goes</h2>
      <p class="lede prose" style="margin-top:1.2rem">Every loop in the theory is a word: a
      string of moves on the twelve cells. Pick one and step through it, or type your own and
      see whether the walk closes on its start cell.</p>
    </div>
    <figure class="plate" style="margin-top:0">
      <div class="plate__frame">
        <canvas id="matrix" role="img"
                aria-label="The twelve-cell matrix: three spine levels (mediation, causation, quality) by four attentional columns (ii, ie, ci, ce). Loop words trace closed walks across the cells."></canvas>
      </div>
      <div class="plate__bar">
        <div class="plate__word" id="word-display" aria-live="off"></div>
        <div class="plate__buttons">
          <button type="button" id="step-btn">Step</button>
          <button type="button" id="play-toggle">Pause</button>
        </div>
      </div>

      <div class="loop-picker" id="loop-picker" role="group" aria-label="Choose a loop"></div>

      <p class="plate__status">
        <span id="loop-name"></span>
        <span class="verdict" id="verdict"></span>
      </p>

      <details class="lab">
        <summary>Run your own word</summary>
        <form id="word-lab">
          <label for="lab-start">from</label>
          <select id="lab-start">
            <option>3.ce</option><option>3.ii</option><option>3.ie</option><option>3.ci</option>
            <option>2.ce</option><option>2.ii</option><option>2.ie</option><option>2.ci</option>
            <option>1.ce</option><option>1.ii</option><option>1.ie</option><option>1.ci</option>
          </select>
          <label for="lab-word">word</label>
          <input id="lab-word" type="text" value="DDUUIGIG" spellcheck="false"
                 inputmode="latin" autocomplete="off" aria-describedby="lab-help">
          <button class="btn" type="submit">Run</button>
        </form>
        <p id="lab-help">Letters over <b>U</b> unfold, <b>D</b> fold, <b>I</b> instance&#8596;system,
        <b>G</b> content&#8596;vehicle. Anything else is ignored. The interpreter reports whether
        the walk closes on its start cell.</p>
      </details>

      <figcaption class="plate__caption label">
        <span>Fig. 01 — Words executed under the kernel&#8217;s move rules</span>
        <span>ν mediation &#160;·&#160; κ causation &#160;·&#160; ω quality</span>
      </figcaption>
    </figure>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">The three categories</span>
      <h2>What experience sorts into</h2>
      <p class="lede prose" style="margin-top:1.2rem">The theory begins with Peirce's claim
      that all experience sorts into exactly three basic kinds.</p>
    </div>
    <div class="terms">
      <div class="term">
        <span class="term__glyph">ω</span>
        <h3>Firstness — quality</h3>
        <p>Something in itself, without reference to anything else. A felt character, a
        possibility, a mood. The redness of red before any comparison.</p>
      </div>
      <div class="term">
        <span class="term__glyph">κ</span>
        <h3>Secondness — causation</h3>
        <p>Brute encounter between two things. Resistance, effort, surprise. The door that
        will not open.</p>
      </div>
      <div class="term">
        <span class="term__glyph">ν</span>
        <h3>Thirdness — mediation</h3>
        <p>A third thing that brings a first and a second into relation. A law, a habit, a
        convention, a meaning.</p>
      </div>
    </div>


    <figure class="fig">
      <!--FIG_LEVELS-->
      <figcaption class="label">Fig. 02 — The spine, and the two moves that travel it</figcaption>
    </figure>

    <div class="split" style="margin-top:clamp(2.5rem,5vw,4rem)">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Prescission</span>
        <h2>The order is about what you can ignore</h2>
      </div>
      <div class="prose">
        <p>The three come in an order, and it is not about time or importance. Call X
        prescissively prior to Y when X can be attended to while neglecting Y, but not the
        other way around.</p>
        <p>You can contemplate the pure feel of a colour without thinking about any collision
        or law. You cannot contemplate a collision without it having some felt character.</p>
        <pre class="code">1st ≺ 2nd:  quality without reaction is conceivable;
            every reaction has a felt character.
2nd ≺ 3rd:  brute encounter without interpretation is
            conceivable; every law applies to something actual.

Therefore:  1st ≺ 2nd ≺ 3rd</pre>
        <p>This ordering — abstractive dependency — is the single most load-bearing idea in
        the theory, and it returns at the very end in the tradeoff theory.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">The four quadrants</span>
        <h2>One sentence, four things you can attend to</h2>
      </div>
      <div class="prose">
        <p>Independently of the three levels there is a second, four-way division, arriving
        from thinking about signs and media rather than experience. Any sign can be examined
        along two distinctions: is it this particular sign-event or the whole system? And are
        we asking what it means, or what it is made of?</p>
        <pre class="code">ii = Instance·Content     ie = Instance·Vehicle
ci = System·Content       ce = System·Vehicle</pre>
        <p>A spoken sentence makes it concrete. The meaning of this one utterance is
        <b>ii</b>. The sound waves of this one utterance are <b>ie</b>. The shared language's
        semantics is <b>ci</b>. Its grammar and phonology, considered as a machine, is
        <b>ce</b>.</p>
        <p>McLuhan's Laws of Media independently discovered this four-faced structure. Its
        independence from the three-level division is not an accident of intellectual history
        — it is a formal fact: the four-way division cannot be derived from the operator that
        generates the levels.</p>
      </div>
    </div>

    <figure class="fig">
      <!--FIG_QUADRANTS-->
      <figcaption class="label">Fig. 03 — The four attentional columns</figcaption>
    </figure>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="section__head">
        <span class="label">The generative operator</span>
        <h2>Everything is built from this</h2>
      </div>
      <div class="split">
        <div>
          <pre class="code">𝔏 = ⟨ L, ⊑, π, {Φ_q}, {Φ̄_q}, ⊕, ⊖, ι, γ ⟩

qml_q(x, y)  :=  Φ_q(x) ⊖ Φ̄_q(y)</pre>
        </div>
        <div class="prose">
          <p>Take the first input and unfold it one step toward mediation; take the second and
          fold it one step toward quality; then ask what the unfolded thing contains beyond
          the folded thing. That remainder is the output.</p>
          <p>The subscript <b>q</b> records a basic commitment: no cognitive operation
          executes without an attentional mode. There is no view from nowhere — every act of
          abstraction or grounding is somebody's act, performed in some register.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="wrap section">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Adjunction, not inversion</span>
        <h2>The loss is built in from the beginning</h2>
      </div>
      <div class="prose">
        <p>Unfolding and folding are not inverses. Folding what you unfolded does not return
        you to where you started — abstracting an experience and then trying to recover the
        experience from the abstraction loses something, and the axiom builds that loss in
        rather than apologising for it later.</p>
        <p>Instead of inversion, the two maps are related by an adjunction: a looser but exact
        relationship defined by a single "fits under" equivalence. One consequence, proved
        rather than assumed, is that convention can never be fully grounded — rebuild a
        convention from its grounding and you get less than the convention claimed.</p>
        <p>That permanent remainder is why no amount of process eliminates spin-room, and why
        the honest goal is making the <em>groundable portion</em> commonly checkable.</p>
      </div>
    </div>
  </section>

  """ + CTA + """
"""


# --------------------------------------------------------------------------
# The Loops
# --------------------------------------------------------------------------

LOOPS = """
  <section class="wrap page-head">
    <span class="label">The Loops</span>
    <h1>Every recurring process is literally a word</h1>
    <p class="lede">A string of moves on the matrix that starts at a cell and walks back to
    it. Ten of the twelve are intra-matrix words, machine-verified as closed walks.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Notation</span>
        <h2>Four letters, one for each thing you can do</h2>
      </div>
      <div class="prose">
        <pre class="code">U = Φ   unfold, +1 level
D = Φ̄   fold,   −1 level
I = ι   instance ↔ system
G = γ   content  ↔ vehicle

Words: strings over {U, D, I, G}, read left to
right from a start cell.</pre>
        <p>Because processes are strings, structural facts about them are visible in the
        letters before any interpretation is added — and two processes can be compared by
        diffing their words.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">The inventory</span>
      <h2>Twelve loops</h2>
    </div>
    <pre class="code">LOOP  FUNCTION              INTENDED CV             START  WORD
──────────────────────────────────────────────────────────────────────
⦿O    skilled action        task completion         2.ie   DGUUDG
⦿C    coordination          coordination state      2.ie   DIGUUDIG
⦿M    management            operational conformity  3.ce   DIIU
⦿M*   audit                 truth correspondence    3.ce   DI▼UI
⦿I    intelligence          model accuracy          1.ie   IUUIIIGIIG
⦿P    policy / identity     identity coherence      3.ci   DDUUII
⦿K    knowledge creation    knowledge validity      3.ii   GIGI
⦿G    grounding             empirical grounding     3.ce   DIDGUGUI
⦿L    legitimation          normative legitimacy    3.ci   GDGU
⦿R    reflexive quality     formal quality          3.ce   DDUUIGIG
⦿H    harness (mediation)   mediation effectiveness  — coupling layer —
⦿T    transparency          perceptual integrity     — coupling layer —</pre>
    <p class="prose" style="margin-top:1.4rem">The specification flags one anomaly rather than
    silently fixing it: the intelligence row does not close under the stated move rules. The
    likely reading is that intelligence is an <em>entering</em> walk which then settles onto a
    closed convention-level cycle — but the claim as printed is "ten machine-verified closed
    walks", so the row is marked for re-checking against the verifier.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">What the words reveal</span>
      <h2>Structure visible before interpretation</h2>
    </div>


    <figure class="fig">
      <!--FIG_COMPLEMENT-->
      <figcaption class="label">Fig. 05 — Grounding descends; knowledge rotates</figcaption>
    </figure>

    <div class="split">
      <div>
        <div class="failure">
          <span class="label">⦿G — the V-word</span>
          <h3>Grounding descends, then returns</h3>
          <p>Descents, a turn at felt quality, then ascents. Its phase trajectory <em>is</em>
          its syntax. To ground a claim you go down to what the thing is actually like, and
          you come back up carrying receipts.</p>
        </div>
        <div class="failure">
          <span class="label">⦿K — the Klein word</span>
          <h3>Knowledge rotates without descending</h3>
          <p>GIGI: flip, flip, flip, flip. A complete tour of the four quadrants conducted
          entirely at the convention level, containing zero up or down moves.</p>
        </div>
        <div class="failure">
          <span class="label">The complement</span>
          <h3>Each is made of the other's missing letters</h3>
          <p>The knowledge word uses only flips; grounding's core is climbs and descents. So
          the old claim that knowledge-making and grounding need each other is not consultant's
          advice — it is forced by letter inventories.</p>
        </div>
      </div>
      <div>
        <div class="failure">
          <span class="label">⦿M</span>
          <h3>Management never touches quality</h3>
          <p>Its word moves only between the causation and convention levels. The inability to
          feel is a typing fact, not a character flaw — and it is the structural reason the
          reflexive quality loop has to exist separately rather than as a management agenda
          item.</p>
        </div>
        <div class="failure">
          <span class="label">⦿R</span>
          <h3>The no-outsourcing rule</h3>
          <p>The reflexive loop opens with a double descent within the formal column, and that
          level change is reachable only by folding. Sensing the quality of your own formal
          structures is a descent you must perform yourself.</p>
        </div>
        <div class="failure">
          <span class="label">Recovery</span>
          <h3>Always two letters away</h3>
          <p>From any cell in a formal column, a double descent reaches the quality level.
          Whatever else is true of quality-bypass pathologies, the route back is structurally
          short.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="split">
        <div class="section__head" style="margin-bottom:0">
          <span class="label">The ceiling conjecture &nbsp;·&nbsp; new in 5.3</span>
          <h2>How far anything can ever be proceduralised</h2>
        </div>
        <div class="prose">
          <p>Which processes can become a standard operating procedure — same steps, every
          time, by anyone — and which will forever require judgment? Organisations answer this
          today by proceduralising everything and discovering the hard way what dies.</p>
          <pre class="code">depth(⦿X) = lowest spine level its word visits

contract ∈ { path ≻ outcome ≻ semantic ≻ statistical }

depth = κ  (⦿M)      → path-approachable
depth = ω  (⦿G, ⦿R)  → semantic at best</pre>
          <p>Management's word never descends below causation — and management is precisely
          what organisations proceduralise most successfully. Grounding descends to quality,
          and quality-level content cannot be transmitted on demand, so grounding can promise
          the same meaning but never the same steps.</p>
        </div>
      </div>

    <figure class="fig">
      <!--FIG_CEILING-->
      <figcaption class="label">Fig. 06 — Depth caps the strictest promise a process can keep</figcaption>
    </figure>
    </div>
  </section>

  """ + CTA + """
"""


# --------------------------------------------------------------------------
# The Machines — the product family for the self-learning enterprise
# --------------------------------------------------------------------------

# (id, name, capability, question, layer, tagline, body paragraphs (HTML),
#  principal capabilities, produces, creates value by, closing line)
MACHINES_DATA = [
    ("sense", "Sense Machine", "Enterprise perception and discovery",
     "What exists, and what is happening?", "understanding",
     "Make the invisible enterprise visible.",
     ["Sense Machine discovers how an enterprise actually operates. It examines existing "
      "systems without first requiring the organisation to produce a comprehensive ontology "
      "or formal architectural model.",
      "Using connectors, crawlers, static analysis, process mining and AI-assisted "
      "interpretation, it reconstructs the relationships among applications, data, business "
      "processes, organisational responsibilities and operating rules — both the structures "
      "that are documented and the implicit relationships that emerge from operational "
      "evidence."],
     ["Enterprise crawling and system inventory",
      "Software and data architecture reverse engineering",
      "Process and workflow discovery",
      "Relationship and dependency extraction",
      "Identification of implicit rules and practices",
      "Detection of undocumented assumptions and contradictions",
      "Targeted elicitation of tacit knowledge from domain experts"],
     "Evidence-backed observations, candidate semantic assertions, dependency maps and "
     "explicit knowledge gaps.",
     "Reducing the cost of understanding complex, poorly documented enterprise environments.",
     "Sense Machine is the primary way enterprise intelligence is bootstrapped from messy "
     "organisational reality."),
    ("connection", "Connection Machine", "Evidence grounding and traceability",
     "How are claims connected to evidence?", "understanding",
     "Connect organisational claims to reality.",
     ["Connection Machine establishes the evidence underneath enterprise knowledge. It "
      "maintains witness graphs that connect claims, observations, interpretations and "
      "decisions to what supports them.",
      "It shows not merely that two things are related, but why that relationship is believed "
      "and where the supporting evidence comes from. That matters most when AI-generated "
      "interpretations circulate through several systems and begin to look independently "
      "corroborated."],
     ["Evidence and provenance tracing",
      "Witness graph construction",
      "Claim-to-source grounding",
      "Dependency and derivation tracking",
      "Detection of unsupported claims",
      "Identification of circular or duplicated evidence",
      "Traceability across organisational decisions"],
     "Witness graphs, provenance chains, grounding assessments and evidence-dependency "
     "structures.",
     "Making enterprise intelligence traceable, auditable and resistant to unsupported or "
     "self-reinforcing conclusions.",
     "Connection Machine provides the grounding that trustworthy shared knowledge requires."),
    ("context", "Context Machine", "Organisational memory and understanding",
     "What do we know, and what matters here?", "understanding",
     "Give every decision the context it deserves.",
     ["Context Machine maintains an evolving representation of what an enterprise knows, "
      "believes, requires and intends, preserving organisational meaning across systems, "
      "teams and time.",
      "Unlike a conventional knowledge repository, it represents uncertainty, conflicting "
      "interpretations, authority, applicability and change explicitly. It keeps three kinds "
      "of knowledge distinct rather than forcing agreement between perspectives:",
      '<dl class="kinds"><div><dt>Descriptive</dt><dd>What exists or happens.</dd></div>'
      '<div><dt>Normative</dt><dd>What is required or permitted.</dd></div>'
      '<div><dt>Intentional</dt><dd>What the organisation is trying to accomplish.</dd></div></dl>',
      "It also assembles task-specific views, giving each agent the knowledge relevant to its "
      "work without exposing it to the full complexity of the enterprise."],
     ["Persistent enterprise semantic memory",
      "Entity and relationship management",
      "Representation of assertions, conflicts and unknowns",
      "Context-sensitive interpretation",
      "Organisational authority and policy context",
      "Temporal knowledge and semantic versioning",
      "Permission-aware contextual retrieval",
      "Task-specific context assembly"],
     "Enterprise semantic models, contextual knowledge views, scoped assertions and "
     "decision-relevant context.",
     "Making organisational understanding reusable across applications, teams and autonomous "
     "agents.",
     "Context Machine preserves what the enterprise learns."),
    ("judgment", "Judgment Machine", "Evaluation and decision governance",
     "What conclusions are justified?", "intelligence",
     "Determine what deserves to be trusted.",
     ["Judgment Machine establishes whether interpretations, conclusions and proposed actions "
      "are sufficiently justified. It distinguishes evidence from inference, confidence from "
      "correctness, and observed behaviour from legitimate authority.",
      "Different situations need different kinds of validation. Some assertions can be checked "
      "deterministically; others need specialised classifiers, formal policies, empirical "
      "evaluations or an authorised human. Judgment Machine coordinates them."],
     ["Evidence sufficiency evaluation",
      "Semantic consistency checking",
      "Policy and authority validation",
      "Conflict and contradiction analysis",
      "Task-specific eval generation",
      "Risk-sensitive decision thresholds",
      "Uncertainty assessment and abstention",
      "Human approval and escalation",
      "Specialised typed judgments"],
     "Validated assertions, judgment results, evaluation evidence, authorisation requirements "
     "and decision constraints.",
     "Making enterprise AI decisions verifiable, accountable and governable.",
     "Judgment Machine makes sure that accumulating information does not automatically become "
     "accumulating authority."),
    ("intuition", "Intuition Machine", "Typed cognitive dispatch",
     "How should this situation be handled?", "intelligence",
     "Know what kind of intelligence is needed.",
     ["Intuition Machine decides how each situation should be handled. Not every enterprise "
      "event needs the same cognitive process: routine transactions can run on deterministic "
      "rules, familiar exceptions need narrow judgments, unfamiliar situations call for "
      "investigation, and consequential decisions need human deliberation.",
      "It dispatches work to the right mechanism, treating different kinds of cognition as "
      "distinct operational capabilities rather than routing everything through one "
      "general-purpose model."],
     ["Situation classification and typed dispatch",
      "Selection of appropriate cognitive workflows",
      "Deterministic versus judgment-based routing",
      "Escalation and exception handling",
      "Selection among available processing capabilities",
      "Prevention of inappropriate routine processing",
      "Routing traceability and diagnostics"],
     "Typed dispatch decisions, selected cognitive workflows and escalation instructions.",
     "Improving the efficiency and reliability of enterprise intelligence through the right "
     "cognitive specialisation.",
     "Intuition Machine makes sure the enterprise applies the right kind of intelligence to "
     "each situation."),
    ("agency", "Agency Machine", "Governed autonomous execution",
     "What are we authorised to do?", "intelligence",
     "Turn justified understanding into authorised action.",
     ["Agency Machine lets AI agents perform enterprise work within explicit organisational "
      "constraints. Rather than leaving each agent to interpret policy for itself, it compiles "
      "the applicable requirements, permissions and decision contracts into constrained "
      "execution environments — a semantic compiler and an enterprise meta-harness.",
      "It separates the ability to perform an action from the authority to perform it."],
     ["Semantic compilation of requirements and policies",
      "Generation of specialised agent harnesses",
      "Scoped tool permissions and credentials",
      "Model and judgment-service integration",
      "Workflow orchestration and durable execution",
      "Human approval gates",
      "Runtime precondition verification",
      "Exception handling, recovery and rollback",
      "Execution tracing and auditing"],
     "Compiled decision contracts, constrained agents, governed workflows and action records.",
     "Enabling reliable enterprise automation without giving up organisational control.",
     "Agency Machine turns knowledge into safely delegated operational capability."),
    ("learning", "Learning Machine", "Semantic adaptation and improvement",
     "What should we learn or change?", "intelligence",
     "Make experience improve the enterprise.",
     ["Learning Machine closes the loop between organisational knowledge, actions and "
      "outcomes. It watches for changes in processes, systems, policies, decisions and "
      "results, and identifies when assumptions should be reconsidered, when new knowledge "
      "should be acquired, and when deployed workflows must be revalidated.",
      "It does not simply accumulate information. It manages the controlled evolution of "
      "organisational understanding."],
     ["Semantic drift detection",
      "Operational feedback analysis",
      "Detection of obsolete or conflicting knowledge",
      "Initiation of semantic learning transactions",
      "Dependency-aware impact analysis",
      "Validation of proposed semantic revisions",
      "Regression evaluation of affected agents",
      "Knowledge refinement and retirement",
      "Measurement of semantic reuse and economic benefit"],
     "Semantic revisions, learning transactions, change-impact reports, updated validations "
     "and improvement recommendations.",
     "Keeping enterprise intelligence from going stale while turning operational experience "
     "into reusable capability.",
     "Learning Machine makes the enterprise&#8217;s intelligence compound rather than decay."),
    ("choreography", "Choreography Machine", "Collective intelligence and coordinated action",
     "How do we act coherently together?", "collective",
     "Enable people and AI agents to act as one coherent organisation.",
     ["Choreography Machine coordinates complex work across human teams, software systems and "
      "AI agents. It goes beyond conventional orchestration, where a central controller "
      "directs every participant.",
      "Instead it relies on <strong>shared context, commitments, protocols and events that let "
      "distributed participants coordinate without a single controlling intelligence</strong>. "
      "People and agents work in shared project and organisational contexts — observing "
      "progress, making commitments, negotiating dependencies and responding to change — "
      "while each keeps their own responsibilities and delegated authority. It brings "
      "together agentic technical programme management and multiplayer AI."],
     ["Multiplayer human–agent workspaces",
      "Autonomous technical programme management",
      "Cross-functional dependency discovery",
      "Commitment and decision tracking",
      "Distributed, event-driven workflow coordination",
      "Detection of conflicting plans and responsibilities",
      "Human–agent negotiation and escalation",
      "Shared operational state and progress monitoring",
      "Continuous capture of coordination knowledge"],
     "Coordinated activities, shared commitments, resolved dependencies, decision histories "
     "and reusable organisational knowledge.",
     "Reducing organisational friction, coordination overhead, delivery delays and fragmented "
     "decision-making.",
     "Choreography Machine is where the whole architecture meets the organisation: it lets the "
     "enterprise act collectively while getting steadily better at understanding and "
     "coordinating itself."),
]

MACHINE_LAYERS = [
    ("understanding", "Enterprise understanding",
     "Construct and maintain reliable organisational knowledge"),
    ("intelligence", "Enterprise intelligence and automation",
     "Turn knowledge into justified decisions, execution and improvement"),
    ("collective", "Collective enterprise applications",
     "Deliver coordinated outcomes across people and agents"),
]

_MACHINE_NUM = {m[0]: f"{i + 1:02d}" for i, m in enumerate(MACHINES_DATA)}


def _machine_cell(m):
    mid, name, cap, question = m[:4]
    return f"""          <a class="arch__cell" href="#{mid}">
            <span class="arch__num">{_MACHINE_NUM[mid]}</span>
            <b>{name}</b>
            <span class="arch__cap">{cap}</span>
            <i>{question}</i>
          </a>"""


def machine_architecture():
    rows = []
    for key, title, purpose in MACHINE_LAYERS:
        cells = "\n".join(_machine_cell(m) for m in MACHINES_DATA if m[4] == key)
        rows.append(f"""      <div class="arch__layer arch__layer--{key}">
        <div class="arch__head">
          <span class="label">{title}</span>
          <p>{purpose}</p>
        </div>
        <div class="arch__cells">
{cells}
        </div>
      </div>""")
    return ('    <div class="arch" role="group" aria-label="The product family in three layers, on Common Ground">\n'
            + "\n".join(rows) + """
      <a class="arch__ground" href="#common-ground">
        <b>Common Ground</b>
        <span>The shared foundation under all eight: meaning, evidence, authority, versions
        and learning, represented once</span>
      </a>
    </div>""")


def machine_section(m):
    mid, name, cap, question, layer, tagline, body, caps, produces, value, closing = m
    paras = "\n".join(p if p.startswith("<") else f"        <p>{p}</p>" for p in body)
    items = "\n".join(f"          <li>{c}</li>" for c in caps)
    return f"""  <section class="wrap section section--ruled machine" id="{mid}">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">{_MACHINE_NUM[mid]} &#160;·&#160; {cap}</span>
        <h2>{name}</h2>
        <p class="machine__tagline">{tagline}</p>
        <p class="machine__question">{question}</p>
      </div>
      <div class="prose">
{paras}
        <h3 class="machine__sub">Principal capabilities</h3>
        <ul class="caps caps--two">
{items}
        </ul>
        <dl class="machine__yield">
          <div><dt>Produces</dt><dd>{produces}</dd></div>
          <div><dt>Creates value by</dt><dd>{value}</dd></div>
        </dl>
        <p class="machine__close">{closing}</p>
      </div>
    </div>
  </section>"""


_MACHINE_JUMPS = "\n".join(
    f'      <a href="#{m[0]}">{m[1]}</a>' for m in MACHINES_DATA) + \
    '\n      <a href="#common-ground">Common Ground</a>\n      <a href="#start">Where to start</a>'

_SLT_ROLES = [
    ("sense", "can open one through discovery"),
    ("connection", "supplies the evidence"),
    ("context", "maintains the knowledge involved"),
    ("judgment", "evaluates proposed resolutions"),
    ("intuition", "routes unfamiliar situations to the right process"),
    ("agency", "applies validated decisions through controlled action"),
    ("learning", "manages the resulting change in meaning"),
    ("choreography", "creates new occasions for learning through coordinated work"),
]
_NAME = {m[0]: m[1] for m in MACHINES_DATA}

MACHINES = f"""
  <section class="wrap page-head">
    <span class="label">The machines</span>
    <h1>Machines for the self-learning enterprise</h1>
    <p class="lede">A family of specialised intelligence systems that help an enterprise
    understand itself, coordinate its work, and improve continuously through experience.</p>
    <p class="verbs" aria-label="Discover, connect, understand, judge, act, learn">
      <span>Discover</span><span>Connect</span><span>Understand</span><span>Judge</span><span>Act</span><span>Learn</span>
    </p>
    <nav class="jumpbar" aria-label="On this page">
{_MACHINE_JUMPS}
    </nav>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">The approach</span>
        <h2>Learn the enterprise by doing useful work in it</h2>
      </div>
      <div class="prose">
        <p>Traditional enterprise software assumes an organisation can describe its
        structures, processes, policies and requirements explicitly before automation
        begins.</p>
        <p>Real enterprises are different. Their knowledge is scattered across systems,
        documents, people and institutional habit. Processes go undocumented, rules sometimes
        conflict, and the organisation keeps changing underneath both.</p>
        <p><strong>So instead of asking an enterprise to model itself before it can use AI,
        our machines discover, validate and formalise organisational knowledge progressively,
        through useful work.</strong> As that knowledge accumulates, the enterprise becomes
        steadily more able to understand its own operations and automate them reliably.</p>
      </div>
    </div>
    <div class="twofold">
      <div><span class="label">Every operation yields</span><b>A business outcome</b>
        <p>The work the enterprise needed done, done now.</p></div>
      <div><span class="label">and</span><b>Reusable organisational intelligence</b>
        <p>Validated knowledge the next operation starts from.</p></div>
    </div>
  </section>

  <section class="wrap section section--ruled" id="family">
    <div class="section__head">
      <span class="label">The product family</span>
      <h2>Eight machines, one foundation</h2>
      <p class="lede prose" style="margin-top:1.2rem">Each machine specialises in one aspect
      of enterprise intelligence and answers one fundamental question. Together they form a
      system that can progressively understand, operate and improve an organisation.</p>
    </div>
{machine_architecture()}
  </section>

""" + "\n\n".join(machine_section(m) for m in MACHINES_DATA) + f"""

  <section class="band--deep" id="common-ground">
    <div class="wrap section">
      <div class="section__head">
        <span class="label">Common Ground</span>
        <h2>One foundation. Many forms of intelligence.</h2>
        <p class="lede prose" style="margin-top:1.2rem">Common Ground is the architecture all
        eight machines share. It is not another agent, application or enterprise database. It
        is the common system through which knowledge, evidence, authority, uncertainty,
        decisions and learning are represented consistently — so no machine has to
        reconstruct or reinterpret organisational meaning on its own.</p>
      </div>
      <div class="ground">
        <div><b>Shared semantic representation</b><p>Entities, assertions, relationships,
        contexts, policies, decisions, commitments, outcomes and explicit unknowns.</p></div>
        <div><b>Evidence and provenance</b><p>How observations, claims, interpretations and
        decisions connect to where they came from.</p></div>
        <div><b>Authority and validity</b><p>When knowledge can be trusted, who may authorise a
        change, and where an interpretation applies.</p></div>
        <div><b>Semantic versioning</b><p>The history of organisational meaning: definitions,
        obligations, ownership and dependencies as they change.</p></div>
        <div><b>Learning transaction protocol</b><p>One standard way to investigate
        uncertainty, resolve contradictions, validate new understanding and publish it.</p></div>
        <div><b>Common integration contract</b><p>The interfaces through which the machines
        discover, interpret, validate, consume and revise knowledge.</p></div>
      </div>
    </div>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="split">
        <div class="section__head" style="margin-bottom:0">
          <span class="label">Not universal agreement</span>
          <h2>Shared context, not one interpretation</h2>
        </div>
        <div class="prose">
          <p>Departments may legitimately use different definitions, priorities and operating
          rules. Common Ground represents those differences consistently, records the context
          each belongs to, and identifies when reconciliation is actually needed.</p>
          <p>Its purpose is not to manufacture consensus. It is to make agreement,
          disagreement, uncertainty and authority explicit — and actionable.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="section__head">
        <span class="label">Semantic learning transactions</span>
        <h2>How the enterprise learns, one question at a time</h2>
        <p class="lede prose" style="margin-top:1.2rem">The essential operation on Common
        Ground. A transaction opens whenever work reveals an uncertainty, a contradiction, a
        missing dependency or an obsolete assumption.</p>
      </div>
      <div class="split">
        <ol class="slt">
          <li>Define the unresolved semantic question.</li>
          <li>Collect the relevant evidence.</li>
          <li>Develop and compare interpretations.</li>
          <li>Identify the organisational authority that applies.</li>
          <li>Validate, reject, or preserve the uncertainty.</li>
          <li>Record the resulting semantic change.</li>
          <li>Determine which activities and agents depend on it.</li>
        </ol>
        <ul class="caps slt__roles">
""" + "\n".join(f'          <li><span><a href="#{k}">{_NAME[k]}</a> {v}.</span></li>' for k, v in _SLT_ROLES) + f"""
        </ul>
      </div>
      <p class="slt__coda">Common Ground is what makes these capabilities one intelligence
      system rather than eight products.</p>
    </div>
  </section>

  <section class="wrap section section--ruled" id="cycle">
    <div class="section__head">
      <span class="label">The learning cycle</span>
      <h2>An interconnected system, not a pipeline</h2>
    </div>
    <div class="terms terms--five">
      <div class="term">
        <span class="term__glyph">Discover</span>
        <p><a href="#sense">Sense</a> investigates how the organisation really works;
        <a href="#connection">Connection</a> grounds what it finds in evidence.</p>
      </div>
      <div class="term">
        <span class="term__glyph">Understand</span>
        <p><a href="#context">Context</a> integrates knowledge, keeps competing
        interpretations, and builds the view each task needs.</p>
      </div>
      <div class="term">
        <span class="term__glyph">Decide</span>
        <p><a href="#judgment">Judgment</a> tests whether conclusions are justified;
        <a href="#intuition">Intuition</a> picks the right process for each situation.</p>
      </div>
      <div class="term">
        <span class="term__glyph">Act together</span>
        <p><a href="#agency">Agency</a> executes within constraints;
        <a href="#choreography">Choreography</a> coordinates people and agents.</p>
      </div>
      <div class="term">
        <span class="term__glyph">Learn</span>
        <p><a href="#learning">Learning</a> turns new evidence, corrections and outcomes into
        validated knowledge on Common Ground.</p>
      </div>
    </div>
    <p class="loopline">More useful work <span>&#8594;</span> more validated understanding
    <span>&#8594;</span> better decisions <span>&#8594;</span> more capable automation
    <span>&#8594;</span> more useful work</p>
    <p class="prose" style="margin-top:1.2rem;color:var(--ink-2)">The cycle only pays if
    evidence quality, semantic integrity, legitimate authority and economic efficiency hold
    all the way round.</p>
  </section>

  <section class="wrap section section--ruled" id="start">
    <div class="section__head">
      <span class="label">Where to start</span>
      <h2>You do not need all eight to get value</h2>
      <p class="lede prose" style="margin-top:1.2rem">Each machine is a distinct capability.
      Start where the problem is; as deployments widen, Common Ground becomes more valuable,
      because knowledge validated once is reused by every new workflow.</p>
    </div>
    <div class="maptable" role="table" aria-label="Starting points">
      <div class="maptable__row maptable__row--head" role="row">
        <span role="columnheader">If you are</span>
        <span role="columnheader">Begin with</span>
      </div>
      <div class="maptable__row" role="row">
        <b role="cell">Modernising legacy software</b>
        <span role="cell"><a href="#sense">Sense Machine</a> and
        <a href="#connection">Connection Machine</a>: find out what the estate really does,
        and what each claim about it rests on.</span>
      </div>
      <div class="maptable__row" role="row">
        <b role="cell">Deploying governed AI agents</b>
        <span role="cell"><a href="#context">Context Machine</a>,
        <a href="#judgment">Judgment Machine</a> and <a href="#agency">Agency Machine</a>:
        the right context, justified decisions, and action within authority.</span>
      </div>
      <div class="maptable__row" role="row">
        <b role="cell">Struggling with cross-functional delivery</b>
        <span role="cell"><a href="#choreography">Choreography Machine</a>: shared
        commitments and dependencies across teams and agents.</span>
      </div>
    </div>
    <div class="split" style="margin-top:clamp(2.5rem,5vw,3.5rem)">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">What we are building first</span>
        <h2>An evidence-grounded technical programme manager</h2>
      </div>
      <div class="prose">
        <p>Our first integrated application combines <b>Sense</b>, <b>Connection</b>,
        <b>Context</b> and <b>Choreography</b>: a programme manager that discovers dependencies,
        exposes conflicting requirements, coordinates their resolution, and preserves what the
        organisation learns along the way. <b>Judgment</b> supplies the validation controls
        and <b>Intuition</b> the routing; <b>Agency</b> and <b>Learning</b> then widen its
        autonomy and adaptation.</p>
        <p>The principle is the same one behind our
        <a href="first-workflow.html">first governed workflow</a> offer: prove the economic
        benefit of accumulating reliable organisational knowledge in one place before
        attempting an enterprise-wide transformation.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Why it matters</span>
        <h2>Agents are not what enterprises lack</h2>
      </div>
      <div class="prose">
        <p>Enterprise AI has concentrated on better models, giving agents tools, and
        increasingly elaborate workflows. These help, but they are not enough.</p>
        <p>What is missing is a continuously maintained, machine-usable representation of how
        the organisation actually operates — its obligations, authority, goals and accumulated
        experience. Without it, agents rediscover context again and again, reproduce
        contradictory assumptions, decide under outdated policies, and struggle to coordinate
        across organisational boundaries.</p>
        <p>The machines provide the specialised capabilities. Common Ground keeps their
        shared understanding. Choreography Machine makes that intelligence useful across the
        organisation, and Learning Machine makes sure experience produces improvement rather
        than more semantic debt.</p>
      </div>
    </div>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="section__head">
        <span class="label">The promise</span>
        <h2>From fragmented knowledge to shared intelligence</h2>
      </div>
      <ul class="promise">
        <li><a href="#sense">Sense Machine</a> discovers reality.</li>
        <li><a href="#connection">Connection Machine</a> grounds understanding.</li>
        <li><a href="#context">Context Machine</a> preserves meaning.</li>
        <li><a href="#judgment">Judgment Machine</a> establishes validity.</li>
        <li><a href="#intuition">Intuition Machine</a> chooses the right cognitive process.</li>
        <li><a href="#agency">Agency Machine</a> enables authorised action.</li>
        <li><a href="#learning">Learning Machine</a> turns experience into improvement.</li>
        <li><a href="#choreography">Choreography Machine</a> enables collective intelligence.</li>
        <li class="promise__ground"><a href="#common-ground">Common Ground</a> connects them
        into one coherent system.</li>
      </ul>
      <p class="lede" style="margin-top:clamp(2rem,4vw,2.8rem);max-width:60ch">From isolated
      agents to coordinated action. From automation to continuous organisational learning.</p>
    </div>
  </section>

  <section class="wrap section section--ruled" style="padding-bottom:0">
    <div class="section__head">
      <span class="label">The research underneath</span>
      <h2>Two machines, grounded in the kernel</h2>
      <p class="lede prose" style="margin-top:1.2rem">Connection Machine and Intuition Machine
      come directly out of <a href="research.html">our research</a> on how organisations
      learn. Here is the formal idea behind each.</p>
    </div>
  </section>

  <section class="wrap section">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Connection Machine</span>
        <h2>What a witness graph is for</h2>
      </div>
      <div class="prose">
        <p>A convention-level claim is grounded exactly when a descent chain with provenance
        connects it to encounter-level records: the claim links to an interpretation, which
        links to a log, which links to something that actually happened. No such chain means
        no witness, and no witness means capture-vulnerable.</p>
        <p>Connection Machine instruments that chain. It ingests the trace store, indexes the
        four strata of witness depth, and reports — per claim — whether a descent path to
        evidence exists and how many hops long it is. Because the test is mechanical, anyone
        can run it on any assertion.</p>

    <figure class="fig">
      <!--FIG_WITNESS-->
      <figcaption class="label">Fig. 07 — A claim with a descent chain, and one without</figcaption>
    </figure>

        <p>What it cannot do is eliminate the remainder. Convention is never fully groundable,
        so a narratable margin is permanent. The job is to make the groundable portion
        commonly computable, and to say plainly which claims fall outside it.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Intuition Machine</span>
        <h2>Why dispatch needs a guard</h2>
      </div>
      <div class="prose">
        <p>A strange complaint arrives on Monday morning. It might be an operations matter, an
        audit trigger, or early market intelligence. Every loop is healthy; the diagnostic
        layers examine each one, find nothing, and return nothing — because the failure was
        that the item reached the wrong loop.</p>
        <p>Intuition Machine makes the selector explicit. Every route is typed by level and
        column. Rules are marked as compiled or live, and the mix is matched to stage —
        compiled selection is appropriate standardisation at commodity stage and lethal at
        genesis.</p>

    <figure class="fig">
      <!--FIG_SELECTOR-->
      <figcaption class="label">Fig. 08 — Misroute and route starvation at the front desk</figcaption>
    </figure>
        <p>Two guards are structural rather than configurable. Routes that must read
        quality-level content cannot be fully compiled, so no rulebook becomes the sole gate on
        quality-sensing. And every compiled rule set is itself a standing convention, so it
        carries a witness and an owner — because orphaned routing rules are the dead hand at
        the front desk.</p>
        <p style="color:var(--ink-2)">The kernel is verified — seven axioms, nine load-bearing
        theorems, 43 of 43 checks passing. The selector construct is newer and labelled
        FRAMEWORK, with its formalisation still an open problem.</p>
      </div>
    </div>
  </section>

  """ + CTA + """
"""


# --------------------------------------------------------------------------
# Diagnosis
# --------------------------------------------------------------------------

DIAGNOSIS = """
  <section class="wrap page-head">
    <span class="label">Diagnosis</span>
    <h1>Nothing breaks. Something is quietly rewritten.</h1>
    <p class="lede">Every pathology in the theory is a small syntactic edit to a healthy word.
    The rewritten version still type-checks, still runs, and still reports on schedule.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">The taxonomy</span>
      <h2>Pathologies as word edits</h2>
    </div>
    <pre class="code">EDIT TYPE                PATHOLOGY
──────────────────────────────────────────────────────────────────────
Letter deletion          degraded audit — Δ(ν,ν), the fold removed
                         ⦿G bypass — the V-word flattened, never reaches ω
Provenance substitution  stale input dressed as current; state ossification;
                         context starvation; a preference presented as a wall
Operator substitution    false dual; phantom pool
Index freezing           one attentional column unavailable — its words
                         untypeable, its cells unperformed verbs
Word truncation          the loop fails to close
Type coercion            model output stored as fact without the audit gate
Route substitution       misroute — content matching loop X delivered to Y
Route deletion           route starvation — a healthy loop never engaged
Binding decay            orphaned convention — grounded, but no living editor
Edit at the spine        IMPOSSIBLE — quality cannot be rewritten,
                         only refused</pre>


    <figure class="fig">
      <!--FIG_AUDIT-->
      <figcaption class="label">Fig. 09 — The audit, and the same audit with one letter deleted</figcaption>
    </figure>
    <p class="prose" style="margin-top:1.8rem">The last row carries the hopeful theorem.
    Because spine edits are impossible and the reflexive loop's critical move is just a double
    descent, every quality-bypass is a <em>routing</em> pathology around an intact capacity.
    The pathologies that look most entrenched are structurally the cheapest to reverse.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">The protective corollary</span>
      <h2>A rulebook can disable a capacity without touching it</h2>
    </div>
    <div class="split">
      <div class="prose">
        <p>Theorem T9 protects the quality-sensing capacity: nothing the diagnostics recommend
        can move the standard the diagnostics measure against. But a routing rule set that
        simply never sends anything to the reflexive loop disables the protected capacity
        without editing it — the way a hospital could neutralise its untouchable trauma team
        by never paging them.</p>
      </div>
      <div class="prose">
        <p>So no fully compiled rule set may be the sole gate on engaging quality-sensing. The
        invocation must retain either a live-judgment path or an alerting bypass — Beer's
        algedonic channels, which the theory already carried, turn out to be the existing
        recognition that routine routing must be bypassable.</p>
      </div>
    </div>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="section__head">
        <span class="label">The method</span>
        <h2>Seven layers, in order</h2>
        <p class="lede prose" style="margin-top:1.2rem">Each layer is a typing question about
        the system's words, and each presupposes the previous layer's judgment. There is no
        point asking whether a loop's controlled variable is aligned if the loop does not
        close.</p>
      </div>
      <pre class="code">1  Structural     does the word exist and close?
                  does a selector exist; is every arrival routable?
2  Attentional    is every letter index-typed?
3  Content-phase  do positions match levels; provenance tags healthy?
                  is routing type-correct for the content's level?
4  Evolutionary   are interface levels matched to stage?
5  Harness        are both phase conversions and the audit gate intact?
6  CV             is the system's controlled variable aligned with the
                  collective's? including the selector's own
7  Transparency   do all convention-level traces have cross-boundary
                  witnesses? does every standing rule have a living editor?</pre>
    </div>
  </section>

  <section class="wrap section">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">What it measures</span>
        <h2>Who holds the fold-witnesses</h2>
      </div>
      <div class="prose">
        <p>The capture indicators of the diagnostic practice — context-authorship
        concentration, decision-beneficiary correlation, reviewer diversity, taxonomy
        concentration, runbook visibility — are all measurements of one underlying thing: who
        holds the fold-witnesses, and how far claims sit from their folds.</p>
        <p>To those, version 5.3 adds one forward-looking measurement of the same thing: who
        holds the <em>edit rights</em> over each standing convention, and whether those editors
        are currently functional.</p>
        <p>Sixteen viability conditions state what must be true of a system's words,
        interfaces and perceptions for it to remain viable. They are also the source of the
        walls that carve any resource tradeoff's feasible region — the theory reinterprets the
        conditions it already had rather than adding new ones for the purpose.</p>
      </div>
    </div>
  </section>

  """ + CTA + """
"""


# --------------------------------------------------------------------------
# Team and Contact — the company is unchanged
# --------------------------------------------------------------------------

_PL = playlist_data()
_ITEMS = "\n".join(
    '        <li><button type="button" data-i="{i}" data-id="{vid}">'
    '<span class="pl__n">{n:02d}</span><span class="pl__t">{title}</span></button></li>'.format(
        i=i, vid=v["id"], n=i + 1,
        title=(v["title"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")))
    for i, v in enumerate(_PL["videos"]))

VIDEO = f"""
  <section class="wrap page-head">
    <span class="label">Video</span>
    <h1>Quaternion Process Theory of Cognition, on video</h1>
    <p class="lede">{len(_PL["videos"])} episodes working through the theory — the kernel, the
    loops, the pathologies, and the dispatch extensions. Play them here, in order or not.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="player"
         data-playlist="{_PL["playlist"]}"
         data-videos='{json.dumps(_PL["videos"], ensure_ascii=False).replace("'", "&#39;")}'>

      <div class="player__stage">
        <button class="embed__poster" type="button" id="pl-play"
                aria-label="Play the series">
          <img src="assets/img/qpt-playlist-poster.jpg" width="1280" height="720" alt="">
          <span class="embed__play" aria-hidden="true">
            <svg viewBox="0 0 68 48" width="68" height="48">
              <path d="M66.5 7.5a8.6 8.6 0 0 0-6-6C55.2 0 34 0 34 0S12.8 0 7.5 1.4a8.6 8.6 0 0 0-6 6A90 90 0 0 0 0 24a90 90 0 0 0 1.5 16.5 8.6 8.6 0 0 0 6 6C12.8 48 34 48 34 48s21.2 0 26.5-1.5a8.6 8.6 0 0 0 6-6A90 90 0 0 0 68 24a90 90 0 0 0-1.5-16.5z" fill="#0f6e63"/>
              <path d="M27 34V14l18 10z" fill="#f3f1eb"/>
            </svg>
          </span>
          <span class="embed__meta">
            <b id="pl-poster-title">The Grounded Loop Graph Model</b>
            <i>{len(_PL["videos"])} episodes &#160;·&#160; press to load from YouTube</i>
          </span>
        </button>

        <div class="player__bar">
          <button type="button" id="pl-prev" aria-label="Previous episode">&#8592; Prev</button>
          <p class="player__now"><span id="pl-count"></span> <b id="pl-title"></b></p>
          <button type="button" id="pl-next" aria-label="Next episode">Next &#8594;</button>
        </div>
      </div>

      <nav class="pl" aria-label="Episodes">
        <p class="label pl__head">Episodes</p>
        <ol class="pl__list" id="pl-list">
{_ITEMS}
        </ol>
      </nav>
    </div>

    <p class="embed__note">Nothing is requested from YouTube until you press play. Loading the
    player sets YouTube&#8217;s cookies and is subject to their privacy policy
    (<a href="privacy.html">our privacy notice</a>).
    <a href="https://www.youtube.com/playlist?list={_PL["playlist"]}" rel="noopener">Open the
    playlist on YouTube</a>.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Where to start</span>
        <h2>If you want the argument before the machinery</h2>
      </div>
      <div class="prose">
        <p>The written pages here cover the same ground in less time.
        <a href="kernel.html">The Kernel</a> gives the three levels and four columns the whole
        theory is built from; <a href="loops.html">The Loops</a> shows why each recurring
        process is a word; and <a href="diagnosis.html">Diagnosis</a> carries the result most
        worth arguing with — that the worst failures are one-letter edits which still
        compile.</p>
        <p>The series goes further than the site does, and in the author&#8217;s own words.</p>
      </div>
    </div>
  </section>

  """ + CTA + """
"""

TEAM = """
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
        <p>Intuition Machine publishes an ongoing series on patterns, methodology and
        strategy, alongside the specification itself.</p>
        <p><a class="btn btn--ghost" style="margin-top:.6rem"
              href="writing.html">Read the essays</a></p>
      </div>
    </div>
  </section>

  """ + CTA + """
"""

ABOUT = """
  <section class="wrap page-head">
    <span class="label">Contact</span>
    <h1>Get in touch</h1>
    <p class="lede">Tell us about one workflow you would like to run AI-native — and the
    rules it has to follow.</p>
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

  """ + CTA + """
"""

# --------------------------------------------------------------------------
# Books — the catalogue on Gumroad. Covers live under assets/img/books/.
# Kept in one list so the page and its ordering stay easy to edit.
# --------------------------------------------------------------------------

STORE = "https://intuitionmachine.gumroad.com"

# (permalink, cover file, title, kind, price label, blurb)
BOOKS_DATA = [
    # The "Artificial" trilogy
    ("intuition", "intuition.png",
     "Artificial Intuition",
     "Book", "Name your price",
     "The improbable deep learning revolution — how machines arrived at intuition, grasping "
     "patterns they were never explicitly taught to derive."),
    ("empathy", "empathy.jpg",
     "Artificial Empathy",
     "Book", "Name your price",
     "A roadmap for human-aligned artificial general intelligence, where empathy — not raw "
     "optimisation — is the coordinate most designs leave out."),
    ("fluency", "fluency.jpg",
     "Artificial Fluency",
     "Book", "Name your price",
     "Large language models read through the lens of language as a living process rather "
     "than a fixed code to be executed."),
    # The pattern-language series
    ("gpt4", "gpt4.jpg",
     "A Pattern Language for Generative AI",
     "Pattern Language", "$17.50",
     "A self-generating GPT-4 blueprint: a pattern language for designing and building "
     "with generative models."),
    ("o1", "o1.jpg",
     "A Pattern Language for Large Reasoning AI",
     "Pattern Language", "$17.50",
     "Long-horizon thinking with ChatGPT o1-pro — patterns for getting sustained reasoning "
     "out of large reasoning models."),
    ("agentic", "agentic.jpg",
     "A Pattern Language for Agentic AI",
     "Pattern Language", "$19.99",
     "Patterns for developing autonomous, intentional agents that act with purpose rather "
     "than react a prompt at a time."),
    ("aiskills", "aiskills.png",
     "A Pattern Language for Agentic AI Skill Design",
     "Pattern Language", "$33",
     "Patterns for structuring, composing and governing the skills that instruct large "
     "language models — mined from open-source and industry practice."),
    ("notation", "notation.jpg",
     "A Pattern Language for LLM-Optimized Formal Notation",
     "Pattern Language", "$20",
     "Align formal notations and domain-specific languages to the way models actually "
     "reason, instead of fighting their biases."),
    # Quaternion Process Theory
    ("processoriented", "processoriented.jpg",
     "Quaternion Process Theory of Cognition",
     "Book", "$5",
     "The core theory in book form: process-oriented thinking on a twelve-cell space — the "
     "foundation the rest of this site is built on."),
    ("incompleteness", "incompleteness.jpg",
     "The Incompleteness of Being",
     "Book", "$5",
     "A QPT approach to consciousness: mind as an inherently underspecified process to be "
     "navigated, not a problem to be finally solved."),
    # Field guides and playbooks
    ("WRbUs", "WRbUs.png",
     "The Deep Learning AI Playbook",
     "Book", "$9.99+",
     "Strategy, methodology and patterns for putting deep learning to work — the field "
     "guide behind the pattern-language lineage."),
    ("arbitrage", "arbitrage.jpg",
     "The Artificial Intelligence Arbitrage Playbook",
     "Book", "$100",
     "A generative pattern language for finding and capturing value where reality shifts "
     "faster than prices, rules and business models can adjust."),
    ("friction", "friction.jpg",
     "The Friction Calculus",
     "Book", "$9.95",
     "What enterprise leaders get wrong about AI: generating content is cheap, verifying it "
     "is not — and that asymmetry is the whole game."),
    ("survival", "survival.jpg",
     "The Survival Guide for The AI Singularity",
     "Book", "$10",
     "A field guide to the coming phase transition — how to read, and stay ahead of, an "
     "accelerating AI singularity."),
]


def book_card(permalink, cover, title, kind, price, blurb):
    href = f"{STORE}/l/{permalink}"
    t = title.replace("&", "&amp;")
    b = blurb.replace("&", "&amp;")
    return f"""      <article class="book">
        <a class="book__cover" href="{href}" rel="noopener"
           aria-label="{t} — open on Gumroad">
          <img src="assets/img/books/{cover}" loading="lazy" alt="Cover of {t}">
        </a>
        <div class="book__body">
          <span class="label book__kind">{kind}</span>
          <h3><a href="{href}" rel="noopener">{t}</a></h3>
          <p class="book__desc">{b}</p>
          <div class="book__foot">
            <span class="book__price">{price}</span>
            <a class="btn btn--ghost book__btn" href="{href}" rel="noopener">Get it &#8594;</a>
          </div>
        </div>
      </article>"""


_BOOK_CARDS = "\n".join(book_card(*b) for b in BOOKS_DATA)

BOOKS = f"""
  <section class="wrap page-head">
    <span class="label">Books</span>
    <h1>Books and field guides on AI</h1>
    <p class="lede">Books, pattern languages and field guides on deep learning, generative AI
    and agentic systems — published through Gumroad. Several are pay-what-you-want, so you can
    read first and decide what it was worth.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="books">
{_BOOK_CARDS}
    </div>
    <p class="prose" style="margin-top:1.8rem">
      <a class="btn btn--ghost" href="{STORE}" rel="noopener">Browse the full store on Gumroad &#8594;</a>
    </p>
  </section>

  """ + CTA + """
"""

# --------------------------------------------------------------------------
# Writing — the latest posts from the Medium publication, baked in at build
# time by fetch_posts.py. Nothing is requested from Medium when the page loads.
# --------------------------------------------------------------------------

POSTS_JSON = "site/assets/posts.json"
MEDIUM = "https://medium.com/intuitionmachine"


def posts_data():
    try:
        with open(POSTS_JSON, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {"publication": MEDIUM, "posts": []}


def _esc(s):
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def post_card(p):
    title = _esc(p["title"])
    href = p["link"]
    date = _esc(p.get("date", ""))
    iso = p.get("iso", "")
    sub = _esc(p.get("subtitle", ""))
    tag = _esc(p["tags"][0]) if p.get("tags") else "Essay"
    img = p.get("image")
    media = (
        f'<a class="post__cover" href="{href}" rel="noopener" tabindex="-1" aria-hidden="true">'
        f'<img src="{img}" loading="lazy" alt=""></a>'
        if img else ""
    )
    return f"""      <article class="post">
{media}
        <div class="post__body">
          <p class="label post__meta"><span>{tag}</span><time datetime="{iso}">{date}</time></p>
          <h3><a href="{href}" rel="noopener">{title}</a></h3>
          <p class="post__desc">{sub}</p>
        </div>
      </article>"""


_POSTS = posts_data()
_POST_CARDS = "\n".join(post_card(p) for p in _POSTS["posts"])

WRITING = f"""
  <section class="wrap page-head">
    <span class="label">Writing</span>
    <h1>Essays on intelligence, real and artificial</h1>
    <p class="lede">An ongoing series on patterns, methodology and strategy in AI — the
    thinking that the theory and the books are drawn from. The latest {len(_POSTS["posts"])}
    posts are below; the full archive lives on Medium.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="posts">
{_POST_CARDS}
    </div>
    <p class="prose" style="margin-top:1.8rem">
      <a class="btn btn--ghost" href="{MEDIUM}" rel="noopener">Read the full archive on Medium &#8594;</a>
    </p>
  </section>

  """ + CTA + """
"""

# --------------------------------------------------------------------------
# Explorations — interactive companions to the theory, hosted elsewhere.
# --------------------------------------------------------------------------

# (url, kind, title, blurb, cta)
EXPLORATIONS_DATA = [
    ("https://deeplearningplaybook.com/spiral-semiosis/",
     "Interactive atlas",
     "Semiosis Atlas",
     "Sign-making, mapped. Two synchronised views — a classification field of 66 sign "
     "classes and a temporal process spiral — trace how attention, competing "
     "interpretants, contextual constraint and provisional understanding build into "
     "meaning and action. Play a scenario, or read it as the transformer analogy for how "
     "a language model settles on sense.",
     "Open the atlas"),
    ("https://codeaudit.github.io/4d-chess/",
     "Playable game",
     "4D Chess",
     "Chess lifted into four dimensions: pieces move across four linked 4×4×2×2 boards "
     "under movement rules extended along the extra axes. Guided lessons, checkmate "
     "studies and game replay come with it, against the computer or a second player — a "
     "hands-on way to feel how structure multiplies once you add dimensions.",
     "Play it"),
]


# Poster stills captured from each piece, in assets/img/explorations/
POSTERS = {
    "https://deeplearningplaybook.com/spiral-semiosis/": "semiosis-atlas",
    "https://codeaudit.github.io/4d-chess/": "4d-chess",
    "Artificial Intuition on Film.html": "artificial-intuition-film",
    "Artificial Empathy/index.html": "artificial-empathy",
    "The Modular Universe.html": "modular-universe",
    "Artificial Fluency.html": "artificial-fluency",
    "artificial-fluency-film_3.html": "artificial-fluency-film",
    "In the Beginning.html": "in-the-beginning",
    "Unbounded.html": "unbounded",
    "Transformers Explained Using Semiotics.html": "transformers-semiotics",
    "The Scale of Thought.html": "scale-of-thought",
    "The Tribes of the AI Discourse/index.html": "tribes",
    "Chain Theory.html": "chain-theory",
    "The Architecture of Imperfection.html": "architecture-of-imperfection",
}


def exploration_media(url, key, rel=""):
    return f"""        <a class="exploration__media" href="{url}"{rel} tabindex="-1" aria-hidden="true">
          <img src="assets/img/explorations/{POSTERS[key]}.jpg" width="960" height="600" alt="" loading="lazy" decoding="async">
        </a>"""


def exploration_card(url, kind, title, blurb, cta):
    t = title.replace("&", "&amp;")
    b = blurb.replace("&", "&amp;")
    return f"""      <article class="exploration">
{exploration_media(url, url, ' rel="noopener"')}
        <div class="exploration__body">
          <span class="label exploration__kind">{kind}</span>
          <h3><a href="{url}" rel="noopener">{t}</a></h3>
          <p class="exploration__desc">{b}</p>
          <p class="exploration__foot">
            <a class="btn btn--ghost" href="{url}" rel="noopener">{cta} &#8594;</a>
          </p>
        </div>
      </article>"""


_EXPLORATION_CARDS = "\n".join(exploration_card(*e) for e in EXPLORATIONS_DATA)

# --------------------------------------------------------------------------
# Explainer films, listed on the Explorations page; files live in site/explainers/
# --------------------------------------------------------------------------

from urllib.parse import quote

# (group, file under site/explainers/, kind, title, blurb)
EXPLAINERS_DATA = [
    ("Artificial Intuition", "Artificial Intuition on Film.html", "Film · 12 min",
     "Artificial Intuition on Film",
     "A voyage through The Improbable Deep Learning Revolution, chapter by chapter, over "
     "real footage of sea, sky and Earth."),
    ("Artificial Empathy", "Artificial Empathy/index.html", "Narrated tour · 8:23",
     "Artificial Empathy",
     "The premise, the cycle of creation, and the six-level roadmap from intuition to "
     "conversational empathy. Jump to any chapter."),
    ("Artificial Empathy", "The Modular Universe.html", "Chapter one · infinite zoom",
     "The Modular Universe",
     "From quarks to culture, modules all the way up: modularity as evolution's memory."),
    ("Artificial Fluency", "Artificial Fluency.html", "Book trailer · 7:54",
     "Artificial Fluency",
     "All twelve chapters in a narrated introduction, with captions and chapter jumps."),
    ("Artificial Fluency", "artificial-fluency-film_3.html", "Film · 4 min",
     "Artificial Fluency — The Film",
     "A visual précis of the book's most insightful line from each chapter, on why meaning "
     "isn't stored but made."),
    ("Artificial Creativity", "In the Beginning.html", "Prologue · interactive voyage",
     "In the Beginning",
     "Twenty-six layers of the adjacent possible, from the first binding of particles to "
     "machines that construct their own ways of making."),
    ("Artificial Creativity", "Unbounded.html", "Film · interactive descent",
     "Unbounded",
     "Recursive self-improvement as a descent: each world inside the core of the last, until "
     "the machinery of making begins to remake itself."),
    ("Ideas", "Transformers Explained Using Semiotics.html", "Fourteen chapters · narrated",
     "Transformers Explained Using Semiotics",
     "How a transformer reads, told through Charles Sanders Peirce's theory of signs."),
    ("Ideas", "The Scale of Thought.html", "Narrated explainer",
     "The Scale of Thought",
     "Human thought is limited less by what we understand than by how much we can carry "
     "out. Automated cognition lifts that limit."),
    ("Ideas", "The Tribes of the AI Discourse/index.html", "Film · explorable map",
     "The Tribes of the AI Discourse",
     "A map of the camps in the AI debate — what it is, what to do, which harm, where power "
     "sits — with neighbours and opposites for every tribe."),
    ("Ideas", "Chain Theory.html", "Film · ten chapters · 8 min",
     "Chain Theory",
     "Rebuilding fundamental physics from quantum information: one axiom of maximally "
     "entangled pairs, and from it a candidate value for the fine-structure constant."),
    ("Ideas", "The Architecture of Imperfection.html", "Film · thirteen chapters · 19 min",
     "The Architecture of Imperfection",
     "A reply to Chain Theory: where its derivation of α cracks, and a theory that matter, "
     "light and spacetime are the counterweights of a universe trying to cancel its own "
     "mathematical error."),
]

EXPLAINER_GROUPS = [
    ("Artificial Intuition", "From the book <i>Artificial Intuition</i>"),
    ("Artificial Empathy", "From the book <i>Artificial Empathy</i>"),
    ("Artificial Fluency", "From the book <i>Artificial Fluency</i>"),
    ("Artificial Creativity", "From <i>Artificial Creativity</i>"),
    ("Ideas", "Ideas, explained"),
]


def explainer_card(path, kind, title, blurb):
    url = "explainers/" + quote(path)
    t = title.replace("&", "&amp;")
    return f"""      <article class="exploration">
{exploration_media(url, path)}
        <div class="exploration__body">
          <span class="label exploration__kind">{kind}</span>
          <h3><a href="{url}">{t}</a></h3>
          <p class="exploration__desc">{blurb}</p>
          <p class="exploration__foot">
            <a class="btn btn--ghost" href="{url}">Watch &#8594;</a>
          </p>
        </div>
      </article>"""


def _slug(text):
    return text.lower().replace(" ", "-")


_JUMPS = [("theory", "The theory")] + [(_slug(k), k) for k, _ in EXPLAINER_GROUPS]
_JUMPBAR = "\n".join(f'      <a href="#{i}">{t}</a>' for i, t in _JUMPS)


def _explainer_sections():
    out = []
    for key, heading in EXPLAINER_GROUPS:
        cards = "\n".join(explainer_card(*e[1:]) for e in EXPLAINERS_DATA if e[0] == key)
        out.append(f"""  <section class="wrap section section--ruled" id="{_slug(key)}">
    <div class="section__head">
      <span class="label">{key}</span>
      <h2>{heading}</h2>
    </div>
    <div class="explorations">
{cards}
    </div>
  </section>
""")
    return "\n".join(out)


EXPLORATIONS = f"""
  <section class="wrap page-head">
    <span class="label">Explorations</span>
    <h1>Interactive explorations and films</h1>
    <p class="lede">The ideas are easier to feel than to read. These are hands-on companions
    to the theory, and narrated films and explorable worlds made from our books — each opens
    in a full page of its own. Most are best with sound on, and many let you leave the film at
    any point to explore the scene yourself.</p>
    <nav class="jumpbar" aria-label="On this page">
{_JUMPBAR}
    </nav>
  </section>

  <section class="wrap section section--ruled" id="theory">
    <div class="section__head">
      <span class="label">The theory</span>
      <h2>Hands-on companions to the theory</h2>
    </div>
    <div class="explorations">
{_EXPLORATION_CARDS}
    </div>
  </section>

""" + _explainer_sections() + """
  """ + CTA + """
"""

YT_PLAY = """<svg viewBox="0 0 68 48" width="68" height="48">
              <path d="M66.5 7.5a8.6 8.6 0 0 0-6-6C55.2 0 34 0 34 0S12.8 0 7.5 1.4a8.6 8.6 0 0 0-6 6A90 90 0 0 0 0 24a90 90 0 0 0 1.5 16.5 8.6 8.6 0 0 0 6 6C12.8 48 34 48 34 48s21.2 0 26.5-1.5a8.6 8.6 0 0 0 6-6A90 90 0 0 0 68 24a90 90 0 0 0-1.5-16.5z" fill="#0f6e63"/>
              <path d="M27 34V14l18 10z" fill="#f3f1eb"/>
            </svg>"""


# --------------------------------------------------------------------------
# How we work: Map -> Build -> Prove
# --------------------------------------------------------------------------

HOW = """
  <section class="wrap page-head">
    <span class="label">How we work</span>
    <h1>Understand the enterprise. Deploy AI within it. Prove that it works.</h1>
    <p class="lede">Most AI pilots succeed in isolation and stall at the boundary of the real
    organisation. We work from the other end: start with the rules, systems and dependencies
    the AI has to live inside, and build outward from there.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Map</span>
        <h2>Understand what it takes to deploy AI</h2>
      </div>
      <div class="prose">
        <p>Before anything is automated, we find out what the work actually depends on: which
        systems it touches, which policies govern it, who holds which decision, and where the
        written process and the real one have drifted apart.</p>
        <ul class="caps" style="margin-top:1.4rem">
          <li>Enterprise rules, approved technologies and the constraints that apply to them</li>
          <li>Dependencies between systems, teams and decisions</li>
          <li>Conflicts between rules, surfaced before an agent trips over them</li>
          <li>Workflows that are good candidates for automation, and ones that are not</li>
        </ul>
        <p class="label" style="margin-top:1.4rem">Underneath: an enterprise context graph,
        semantic analysis and capability mapping</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Build</span>
        <h2>Turn AI experiments into enterprise-ready workflows</h2>
      </div>
      <div class="prose">
        <p>We build narrow, purpose-made execution environments for AI agents: each one knows
        the systems it may use, the identity it acts under, the approvals it needs and the
        standards it has to deploy against.</p>
        <ul class="caps" style="margin-top:1.4rem">
          <li>Integration with the enterprise applications the workflow already runs on</li>
          <li>Identity, permissions and approvals enforced, not merely documented</li>
          <li>Work routed to the right handler, with a human path held open</li>
          <li>Deployment against your existing architecture and standards</li>
        </ul>
        <p class="label" style="margin-top:1.4rem">Underneath: generated agent environments,
        agent orchestration and typed routing</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Prove</span>
        <h2>Show it delivers value and stays within its boundaries</h2>
      </div>
      <div class="prose">
        <p>An AI workflow earns more autonomy by producing evidence, not by passing a demo. We
        measure it against what actually happened, enforce its policies continuously, and
        flag the moment its behaviour starts to drift.</p>
        <ul class="caps" style="margin-top:1.4rem">
          <li>Outcome evaluations against the workflow it replaces</li>
          <li>Policy enforcement, audit trails and escalation</li>
          <li>Autonomy that expands only as the evidence supports it</li>
          <li>Drift detection, so degradation is caught rather than reported around</li>
        </ul>
        <p class="label" style="margin-top:1.4rem">Underneath: judgment governance, bounded
        judgments, continuous evaluation and capability promotion criteria</p>
      </div>
    </div>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="section__head">
        <span class="label">What "rules" means</span>
        <h2>Your enterprise has rules. Your AI should know them.</h2>
        <p class="lede prose" style="margin-top:1.2rem">Compliance is the smallest part of it.
        The rules of an organisation are its architecture, its roles, its operating
        procedures, its economic priorities and the ways its departments coordinate. An agent
        that ignores any of them is a liability, however capable it is.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">The long game</span>
      <h2>From experiment, to dependable operation, to reusable capability</h2>
      <p class="lede prose" style="margin-top:1.2rem">Capabilities evolve. What starts as an
      experiment becomes a dependable part of operations, and eventually a utility other
      workflows build on. We manage that whole progression, so each workflow you prove makes
      the next one cheaper.</p>
    </div>
    <div class="terms">
      <div class="term">
        <span class="term__glyph">Experiment</span>
        <h3>Find out what works</h3>
        <p>Cheap trials with honest results, run in shadow alongside the existing process.</p>
      </div>
      <div class="term">
        <span class="term__glyph">Operation</span>
        <h3>Make it dependable</h3>
        <p>Governed, evaluated and integrated, with autonomy matched to the evidence.</p>
      </div>
      <div class="term">
        <span class="term__glyph">Utility</span>
        <h3>Make it reusable</h3>
        <p>The proven capability becomes infrastructure the next workflow starts from.</p>
      </div>
    </div>
  </section>

  """ + CTA + """
"""

# --------------------------------------------------------------------------
# Entry offer: the first governed workflow
# --------------------------------------------------------------------------

FIRST = """
  <section class="wrap page-head">
    <span class="label">Where to start</span>
    <h1>Your first governed AI-native workflow</h1>
    <p class="lede">One business process. Real enterprise systems. Measurable results.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">The engagement</span>
        <h2>Rebuild one workflow with AI agents, inside your enterprise</h2>
      </div>
      <div class="prose">
        <p>We take a workflow you select and rebuild it with AI agents, working within your
        existing technology standards, access controls and business constraints.</p>
        <p>It runs alongside the current process first, in parallel or in shadow mode, so the
        two can be compared on real work before anything is switched over. You expand its
        autonomy when the evidence says you should, not before.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">What you receive</span>
        <h2>A working system, and the evidence to decide what comes next</h2>
      </div>
      <div class="prose">
        <ul class="caps">
          <li>A working, bounded AI workflow, initially running in parallel or shadow mode</li>
          <li>Integration with approved enterprise systems and permissions</li>
          <li>Explicit evaluation and escalation criteria</li>
          <li>A comparison against the existing workflow on speed, cost, accuracy and
          exception rate</li>
          <li>A documented path toward greater autonomy and reuse</li>
        </ul>
        <p class="label" style="margin-top:1.4rem">Pilot scope and production authorisation
        depend on the workflow's risk and its integration requirements.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">How it runs</span>
      <h2>Map, build and prove, scoped to one workflow</h2>
    </div>
    <div class="terms">
      <div class="term">
        <span class="term__glyph">Map</span>
        <h3>Choose and understand the workflow</h3>
        <p>The systems it touches, the rules that govern it, the decisions people hold, and
        the baseline it will be measured against.</p>
      </div>
      <div class="term">
        <span class="term__glyph">Build</span>
        <h3>Rebuild it with agents</h3>
        <p>A bounded agent workflow, integrated with approved systems and permissions, with
        escalation paths to people defined up front.</p>
      </div>
      <div class="term">
        <span class="term__glyph">Prove</span>
        <h3>Run it in shadow and compare</h3>
        <p>Side-by-side results on real work, and a documented decision on what to expand,
        what to change, and what to leave with people.</p>
      </div>
    </div>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="split">
        <div class="section__head" style="margin-bottom:0">
          <span class="label">An illustrative scope</span>
          <h2>Agentic project coordination</h2>
        </div>
        <div class="prose">
          <p class="lede">A good first workflow is high-volume, rule-bound and easy to measure.
          Project coordination is all three.</p>
          <p style="color:var(--on-deep)">Agents collect status, identify dependencies, manage
          handoffs and run routine follow-ups across the systems a programme already uses.
          People keep the decisions that are theirs: priorities, trade-offs and escalations.</p>
          <p style="color:var(--on-deep)">It is not another chatbot. It is the step from
          individual AI assistance to an AI-native team workflow — and it removes the kind of
          coordination overhead that AI-native organisations are built to eliminate.</p>
          <p class="label" style="margin-top:1.4rem">An example of the shape of an engagement,
          not a packaged product</p>
        </div>
      </div>
    </div>
  </section>

  <section class="band--deep">
    <div class="wrap section cta">
      <h2>Tell us about one workflow.</h2>
      <p class="lede">We help you build your first AI-native workflow, connect it safely to
      your existing enterprise, and prove the business results before autonomy expands.</p>
      <div class="cta__actions">
        <a class="btn btn--lit" href="mailto:info@intuitionmachine.com?subject=First%20governed%20workflow">info@intuitionmachine.com</a>
        <a class="btn btn--lit" style="background:transparent;border-color:#43c4b0;color:#43c4b0"
           href="how-we-work.html">How we work</a>
      </div>
    </div>
  </section>
"""

# --------------------------------------------------------------------------
# ExO 3.0: the framework, and where the engineering fits
# --------------------------------------------------------------------------

EXO_SOURCE = "https://openexo.com/organizational-singularity"


def maprow(name, text):
    return f"""      <div class="maptable__row" role="row">
        <b role="cell">{name}</b>
        <span role="cell">{text}</span>
      </div>"""


def maptable(label, head_a, head_b, rows):
    body = "\n".join(maprow(*r) for r in rows)
    return f"""<div class="maptable" role="table" aria-label="{label}">
      <div class="maptable__row maptable__row--head" role="row">
        <span role="columnheader">{head_a}</span>
        <span role="columnheader">{head_b}</span>
      </div>
{body}
    </div>"""


_DRIVE = maptable("DRIVE: the intelligence engine", "DRIVE", "What it means", [
    ("Decision Architecture", "What is automated, what is escalated, and what stays with people."),
    ("Recursive Learning", "The capacity to learn faster than the environment changes — results "
     "feed straight back into the next cycle."),
    ("Intelligence Stack", "The operating core: six layers wrapped in a governance control plane "
     "(below)."),
    ("Value Moat", "Advantage from proprietary data, network effects, intelligence density, "
     "reconfiguration speed and curatorial judgment."),
    ("Elastic Agency", "One pool of human and AI capacity, allocated through a capability "
     "registry, graduated authority and a map of decision boundaries."),
])

_SHAPE = maptable("SHAPE: the organisational form", "SHAPE", "What it means", [
    ("Safe Autonomy", "Agents governed by protocol, with absolute human accountability."),
    ("Human Architecture", "Where human judgment, ethics, relationships and taste create value "
     "agents cannot."),
    ("Adaptive Architecture", "Modularity plus antifragility: the organisation reconfigures "
     "rather than breaks."),
    ("Purpose Control", "The MTP run as an operational protocol rather than a poster."),
    ("Ecosystem Trust", "Trust across organisational boundaries made into protocol: verifiable "
     "identity, credentials and audit trails."),
])

_STACK = maptable("The Intelligence Stack", "Layer", "What it does", [
    ("Purpose", "Sets objectives and constraints derived from the MTP."),
    ("Sense", "Collects signals from customers, operations, competitors and the environment."),
    ("Interpret", "Builds context, retrieves history and simulates scenarios."),
    ("Decide", "Generates options and commits — within a defined permission envelope."),
    ("Orchestrate / Act", "Executes through tools, workflows, APIs, people and other agents."),
    ("Learn", "Evaluates outcomes, updates models and propagates what worked."),
    ("GOVERN / ASSURE", "The control plane over every layer: trusted evaluations, searchable "
     "logs, granular rollback and a human review queue — plus escalation and kill switches."),
])

_REWRITE = maptable("REWRITE: the transformation method", "Step", "What happens", [
    ("1 · Backcast &amp; define", "Define the AI-native destination first, then work backward."),
    ("2 · Assess &amp; prepare", "Score readiness, stand up a minimal Intelligence Stack, choose "
     "an on-ramp."),
    ("3 · Extract", "Capture tacit institutional knowledge and build the governed data layer "
     "agents need."),
    ("4 · Diagnose &amp; strip", "Remove organisational drag before automating anything."),
    ("5 · Build &amp; prove", "Deploy agents in waves, run them in parallel with legacy "
     "workflows, then retire the old path."),
    ("6 · Rewire &amp; evolve", "Replace hierarchy with pod-based networks and make "
     "self-disruption a permanent rhythm."),
])

_FIT = maptable("ExO 3.0 concepts and Intuition Machine's role", "ExO 3.0 concept",
                "What we build", [
    ("MTP as protocol", "Your constraints, priorities and policies, captured so an agent can "
     "actually follow them — and conflicts between them found before an agent trips over them"),
    ("Decision Architecture", "Explicit boundaries for each workflow: what the agent decides, "
     "what it escalates, and to whom"),
    ("Intelligence Stack", "Constrained agentic workflows, connected to the enterprise systems "
     "and identity they depend on"),
    ("GOVERN / ASSURE", "Evaluations against real outcomes, policy enforcement, audit trails, "
     "rollback and approval paths — from the first deployment"),
    ("Edge Twin", "One governed AI-native workflow, launched alongside existing operations — "
     "<a href=\"first-workflow.html\">our entry engagement</a>"),
    ("REWRITE · Extract", "Mapping the rules, dependencies and tacit knowledge a workflow "
     "really runs on"),
    ("REWRITE · Build &amp; prove", "Parallel running, side-by-side measurement and the "
     "evidence to retire the old path"),
    ("Recursive Learning", "Drift and degradation detected, and updates driven by evidence "
     "rather than by the last report"),
])

EXO = f"""
  <section class="wrap page-head">
    <span class="label">ExO 3.0</span>
    <h1>From ExO 3.0 to production</h1>
    <p class="lede">ExO 3.0 shows organisations what the AI-native future looks like.
    Intuition Machine helps them build it.</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">What ExO 3.0 is</span>
        <h2>A blueprint for the organisation after the org chart</h2>
      </div>
      <div class="prose">
        <p>The Exponential Organisations (ExO) model, developed by Salim Ismail and the OpenExO
        community, describes how organisations grow far faster than their headcount. The
        first version paired a Massive Transformative Purpose (MTP) with ten attributes —
        SCALE and IDEAS — for organisations built on information and networks.</p>
        <p>ExO 3.0, set out in <a href="{EXO_SOURCE}" rel="noopener"><i>The Organizational
        Singularity</i></a>, updates the model for AI agents. Its starting point is economic:
        firms exist because coordinating work inside them used to be cheaper than
        coordinating it outside. AI is collapsing the cost of coordination, so execution is
        becoming cheaper than management — and much of the org chart turns into overhead.</p>
        <p>The AI-native organisation it describes runs through networks of people and agents
        sharing one intelligence layer, learning continuously, and governed by protocol rather
        than by hierarchy.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">The architecture</span>
      <h2>MTP + DRIVE + SHAPE</h2>
      <p class="lede prose" style="margin-top:1.2rem">Three parts: a purpose agents can read,
      an engine that makes the organisation fast and smart, and a form that keeps it tight and
      resilient.</p>
    </div>
    <div class="terms">
      <div class="term">
        <span class="term__glyph">MTP</span>
        <h3>Purpose, as a protocol</h3>
        <p>The purpose stops being a poster and becomes something machines can execute, in
        three layers: hard constraints agents may never violate, weighted priorities for
        resolving trade-offs, and the identity that holds people together.</p>
      </div>
      <div class="term">
        <span class="term__glyph">DRIVE</span>
        <h3>The intelligence engine</h3>
        <p>Five attributes for speed and intelligence: how decisions are allocated, how the
        organisation learns, the stack it runs on, where its advantage comes from, and how
        human and AI capacity is pooled.</p>
      </div>
      <div class="term">
        <span class="term__glyph">SHAPE</span>
        <h3>The organisational form</h3>
        <p>Five attributes for resilience: safe autonomy, the work only people should do,
        modular structure, purpose as control, and trust that works across organisational
        boundaries.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">DRIVE</span>
        <h2>Fast and smart</h2>
      </div>
      {_DRIVE}
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">SHAPE</span>
        <h2>Tight and resilient</h2>
      </div>
      {_SHAPE}
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">The operating core</span>
        <h2>The Intelligence Stack, under GOVERN / ASSURE</h2>
        <p class="lede prose" style="margin-top:1.2rem">Six layers modelled on a
        sense-decide-act loop, with a control plane that watches every one of them. ExO 3.0
        asks for that control plane from the very start, not after the first incident.</p>
      </div>
      {_STACK}
    </div>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="split">
        <div class="section__head" style="margin-bottom:0">
          <span class="label">Where to begin</span>
          <h2>The Edge Twin</h2>
        </div>
        <div class="prose">
          <p class="lede">Rather than transform the core first, ExO 3.0 recommends building at
          the edge: a small, CEO-sponsored parallel unit — typically three to five people and
          a cluster of agents — that rebuilds real workflows on the Intelligence Stack.</p>
          <p style="color:var(--on-deep)">The twin runs alongside the existing business,
          proves it outperforms it on real work, and then takes that work over. It is a way to
          change a large organisation without betting the whole organisation on the change.</p>
          <p style="color:var(--on-deep)">This is the point at which a vision has to become
          working software inside real systems — and where our
          <a href="first-workflow.html" style="color:var(--signal-lit)">first governed
          workflow</a> engagement is designed to start.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">The method</span>
        <h2>REWRITE: six steps, one workflow at a time</h2>
        <p class="lede prose" style="margin-top:1.2rem">REWRITE rebuilds work as agent-native
        a workflow at a time, from defining the destination to rewiring the organisation
        around what has been proven.</p>
      </div>
      {_REWRITE}
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">The execution gap</span>
        <h2>A clear destination, and decades of systems in the way</h2>
      </div>
      <div class="prose">
        <p>ExO 3.0 is a framework for organisational design. It says what to build and in
        what order; by design, it does not prescribe vendors or technology. It advises
        organisations to find an AI-native builder rather than a traditional consultancy.</p>
        <p>Existing enterprises have to make the journey from where they are: decades of
        technology investment, regulation, policy and dependencies between teams. Turning
        GOVERN/ASSURE, an Edge Twin or a REWRITE wave into working systems under those
        conditions is engineering work. That is the work we do.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="terms">
      <div class="term">
        <span class="term__glyph">Vision</span>
        <h3>The vision and transformation method</h3>
        <p>What the AI-native enterprise should become.</p>
      </div>
      <div class="term">
        <span class="term__glyph">Engineering</span>
        <h3>Enterprise AI engineering &amp; assurance</h3>
        <p>How AI-native workflows are integrated, governed, evaluated and deployed in real
        enterprises.</p>
      </div>
      <div class="term">
        <span class="term__glyph">Outcome</span>
        <h3>AI-native operations with measurable results</h3>
        <p>Working workflows, controlled autonomy and reusable infrastructure.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="section__head">
      <span class="label">Where we fit</span>
      <h2>ExO 3.0 concepts, and the engineering behind each</h2>
    </div>
    {_FIT}
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="split">
        <div class="section__head" style="margin-bottom:0">
          <span class="label">For ExO practitioners</span>
          <h2>You shape the transformation. We engineer it.</h2>
        </div>
        <div class="prose">
          <p class="lede">Strategy engagements create the demand; the hard part comes when a
          roadmap meets existing applications, regulation and policy. We are glad to work
          alongside practitioners on that part — through referral, implementation or
          co-development.</p>
          <ul class="caps" style="margin-top:1.4rem;color:var(--on-deep)">
            <li>Technical and architectural readiness analysis, alongside organisational
            assessment</li>
            <li>Governed AI-native workflows, built to the roadmap</li>
            <li>Repeatable software infrastructure, alongside change coaching</li>
            <li>Technical assurance and workflow economics, alongside transformation
            metrics</li>
          </ul>
          <p style="margin-top:1.8rem"><a class="btn btn--lit"
             href="mailto:info@intuitionmachine.com?subject=ExO%203.0%20implementation">Talk to us</a></p>
        </div>
      </div>
    </div>
  </section>

  <section class="wrap section">
    <p class="label prose">ExO 3.0 is a framework published by OpenExO; the summary above
    paraphrases <a href="{EXO_SOURCE}" rel="noopener"><i>The Organizational Singularity</i></a>.
    Intuition Machine is independent and is not affiliated with, certified by or endorsed by
    OpenExO.</p>
  </section>

  """ + CTA + """
"""


# --------------------------------------------------------------------------
# Research hub: the theory underneath the engineering
# --------------------------------------------------------------------------

RESEARCH_DATA = [
    ("ai-native.html", "Architecture", "AI-Native Organisations",
     "Six layers, from an invariant core to a licensed saboteur, each with a formal "
     "counterpart in the theory."),
    ("kernel.html", "Formal core", "The Kernel",
     "Three levels, four columns and one operator — with an interactive matrix you can "
     "run words on."),
    ("loops.html", "Processes", "The Loops",
     "Twelve recurring processes, each written as a word that closes back on its start."),
    ("diagnosis.html", "Failure modes", "Diagnosis",
     "Pathologies as minimal edits to healthy processes, and the seven-layer diagnostic "
     "that locates them."),
    ("machines.html#connection", "The machines", "Connection Machine &amp; Intuition Machine",
     "Two of our eight machines come straight out of the kernel — one traces grounding, one "
     "makes routing explicit."),
    ("explorations.html", "Interactive", "Explorations",
     "Hands-on companions to the theory, and ten narrated films and explorable voyages "
     "made from our books."),
    ("video.html", "Video", "The series",
     "A 36-part video series working through the theory from the kernel to dispatch."),
    ("film.html", "Film", "Never the same twice",
     "A 97-second film built from the Chair44 aperiodic monotile."),
]


def research_card(url, kind, title, blurb):
    return f"""      <article class="exploration">
        <div class="exploration__body">
          <span class="label exploration__kind">{kind}</span>
          <h3><a href="{url}">{title}</a></h3>
          <p class="exploration__desc">{blurb}</p>
        </div>
      </article>"""


_RESEARCH_CARDS = "\n".join(research_card(*r) for r in RESEARCH_DATA)

RESEARCH = f"""
  <section class="wrap page-head">
    <span class="label">Research</span>
    <h1>The theory underneath the engineering</h1>
    <p class="lede">Our engineering rests on Quaternion Process Theory of Cognition: a formal
    account of how organisations learn, and of the ways they quietly stop. It is small enough
    to check by machine, and it publishes what it has not yet proved.</p>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="section__head">
        <span class="label">Why this is not consulting</span>
        <h2>The account is small enough to check by machine</h2>
      </div>
      <div class="figures">
        <div class="figure-cell"><b>7</b><span>Axioms</span></div>
        <div class="figure-cell"><b>1</b><span>Derived operator</span></div>
        <div class="figure-cell"><b>9</b><span>Load-bearing theorems</span></div>
        <div class="figure-cell"><b>12</b><span>Matrix cells</span></div>
        <div class="figure-cell"><b>12</b><span>Recurring loops</span></div>
        <div class="figure-cell"><b>43/43</b><span>Checks verified</span></div>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="explorations">
{_RESEARCH_CARDS}
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Explainer</span>
        <h2>3D aperiodic tiles</h2>
        <p class="lede prose" style="margin-top:1.2rem">How a single tile can fill space
        without ever repeating — supertiles of supertiles, each piece inside a unique
        infinite hierarchy.</p>
      </div>
      <div class="embed">
        <button class="embed__poster" type="button"
                data-src="https://www.youtube-nocookie.com/embed/cvpExVxrJOY?autoplay=1&amp;rel=0"
                data-title="3D aperiodic tiles" aria-label="Play 3D aperiodic tiles">
          <img src="assets/img/aperiodic-tiles-poster.jpg" width="1280" height="720" alt=""
               loading="lazy">
          <span class="embed__play" aria-hidden="true">{YT_PLAY}</span>
          <span class="embed__meta">
            <b>3D aperiodic tiles</b>
            <i>1:45 &#160;·&#160; press to load from YouTube</i>
          </span>
        </button>
        <p class="embed__note">Nothing is requested from YouTube until you press play; pressing it
        loads YouTube&#8217;s player, which may set cookies
        (<a href="privacy.html">privacy notice</a>). Or
        <a href="https://www.youtube.com/watch?v=cvpExVxrJOY" rel="noopener">watch it on
        YouTube</a>.</p>
      </div>
    </div>
  </section>

  """ + CTA + """
"""


# --------------------------------------------------------------------------
# Privacy & cookies. Keep this in step with what the site actually does:
# no cookies, no browser storage, no analytics, no third-party requests at
# page load; YouTube only after the visitor presses play.
# --------------------------------------------------------------------------

PRIVACY = """
  <section class="wrap page-head">
    <span class="label">Privacy &amp; cookies</span>
    <h1>No cookies, no tracking</h1>
    <p class="lede">This site sets no cookies, keeps nothing in your browser and runs no
    analytics. Every page, font, script and film is served from intuitionmachine.com itself.
    The one exception is a YouTube video, and that loads only when you press play.</p>
    <p class="label" style="margin-top:1.6rem">Last updated 22 October 2026</p>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Cookies</span>
        <h2>Why there is no cookie banner</h2>
      </div>
      <div class="prose">
        <p>European rules (the ePrivacy Directive and the GDPR) require consent before a
        website stores or reads information on your device, unless it is strictly necessary.
        We do not do that at all: no cookies, no <code>localStorage</code> or
        <code>sessionStorage</code>, no tracking pixels, no fingerprinting, no advertising and no
        analytics. There is nothing to consent to, so we do not ask.</p>
        <p>Fonts and scripts, including those used by the films and explorations on this
        domain, are hosted here rather than fetched from Google Fonts or a public CDN, so
        reading a page does not tell any third party that you visited.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Video</span>
        <h2>YouTube, only when you press play</h2>
      </div>
      <div class="prose">
        <p>Some pages show a video poster. Until you press it, nothing is requested from
        YouTube. Pressing play is your choice to load YouTube&#8217;s player (from
        youtube-nocookie.com) in that spot. From then on, YouTube, operated by Google, receives
        your IP address and may store cookies or similar data on your device, under
        <a href="https://policies.google.com/privacy" rel="noopener">Google&#8217;s privacy
        policy</a>. If you would rather not, every video also has a plain link to watch it on
        YouTube directly, or you can simply not press play. Reloading the page removes the
        player; you can clear anything YouTube stored in your browser settings.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Hosting</span>
        <h2>Server logs</h2>
      </div>
      <div class="prose">
        <p>The site is hosted on GitHub Pages. To deliver pages and protect the service, GitHub
        and its network provider process technical data about each request, including your IP
        address, and may keep it in logs for a limited period. We do not receive or use these
        logs. See the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
        rel="noopener">GitHub privacy statement</a>. The legal basis is our legitimate interest
        in running a secure website (GDPR Art. 6(1)(f)).</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Contact</span>
        <h2>When you email us</h2>
      </div>
      <div class="prose">
        <p>There are no forms on this site. If you write to
        <a href="mailto:info@intuitionmachine.com">info@intuitionmachine.com</a>, we use your
        name, address and what you tell us only to reply and, if you ask, to discuss working
        together (GDPR Art. 6(1)(b) and (f)). We do not add you to a mailing list or share
        your message with anyone outside the people working on your enquiry, and we delete
        correspondence when it is no longer needed for that purpose.</p>
        <p>Our email runs on Google&#8217;s Gmail service, so Google stores and processes
        messages on our behalf, including on servers outside the EU, under
        <a href="https://policies.google.com/privacy" rel="noopener">Google&#8217;s privacy
        policy</a> and its data processing terms. We are based in the United States, so the
        messages you send us are handled there.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Elsewhere</span>
        <h2>Links to other sites</h2>
      </div>
      <div class="prose">
        <p>Some links lead to other sites: the Semiosis Atlas and 4D Chess explorations, our
        writing on Medium, our books on Gumroad, YouTube, LinkedIn and OpenExO. Those sites
        have their own privacy and cookie practices, which apply once you follow the link.</p>
      </div>
    </div>
  </section>

  <section class="wrap section section--ruled">
    <div class="split">
      <div class="section__head" style="margin-bottom:0">
        <span class="label">Your rights</span>
        <h2>Who we are, and what you can ask</h2>
      </div>
      <div class="prose">
        <p>The controller for this site is Intuition Machine, 1200 South Arlington Ridge Road,
        508, Arlington, VA 22202, USA,
        <a href="mailto:info@intuitionmachine.com">info@intuitionmachine.com</a>.</p>
        <p>If you are in the EU, the EEA or the UK, you can ask us for access to, correction
        or deletion of personal data we hold about you, ask us to restrict or stop processing
        it, or ask for a copy to take elsewhere. Write to the address above. You also have the
        right to complain to your local data protection authority.</p>
        <p>If what this site does changes, for instance if we ever add analytics, we will ask
        for your consent first where the law requires it and update this page.</p>
      </div>
    </div>
  </section>
"""

PAGES = [
    ("how-we-work.html", "How We Work — Intuition Machine",
     "Map, Build, Prove: how Intuition Machine turns AI experiments into governed, "
     "enterprise-ready workflows that follow your organisation's rules.", HOW),
    ("first-workflow.html", "Your First Governed AI-Native Workflow — Intuition Machine",
     "One business process, real enterprise systems, measurable results: a bounded AI "
     "workflow run in shadow alongside the existing one, with evidence for what comes next.",
     FIRST),
    ("exo.html", "From ExO 3.0 to Production — Intuition Machine",
     "What ExO 3.0 is — MTP, DRIVE, SHAPE, the Intelligence Stack, the Edge Twin and REWRITE "
     "— and the engineering and assurance it takes to build it in existing enterprises.", EXO),
    ("research.html", "Research — Intuition Machine",
     "Quaternion Process Theory of Cognition: the machine-checked theory underneath "
     "Intuition Machine's engineering.", RESEARCH),
    ("ai-native.html", "AI-Native Organisations — Intuition Machine",
     "AI-native organisations have a specifiable shape: six layers from an invariant core "
     "to a licensed saboteur, each with a formal counterpart in QPT.", AINATIVE),
    ("kernel.html", "The Kernel — Quaternion Process Theory of Cognition",
     "The QML kernel: three spine levels, four attentional columns, and one generative "
     "operator from which the rest of the theory is built.", KERNEL),
    ("loops.html", "The Loops — Quaternion Process Theory of Cognition",
     "Twelve recurring processes, each written as a word: a string of moves on the matrix "
     "that closes back on its start cell.", LOOPS),
    ("machines.html", "The Machines — Intuition Machine",
     "Machines for the self-learning enterprise: eight specialised intelligence systems — "
     "Sense, Connection, Context, Judgment, Intuition, Agency, Learning and Choreography — "
     "on one Common Ground.", MACHINES),
    ("diagnosis.html", "Diagnosis — Quaternion Process Theory of Cognition",
     "Pathologies as syntactic edits to healthy words, and the seven-layer diagnostic that "
     "locates them.", DIAGNOSIS),
    ("explorations.html", "Explorations — Intuition Machine",
     "Interactive companions to the theory — the Semiosis Atlas and a four-dimensional chess "
     "variant — and narrated films made from Artificial Intuition, Empathy, Fluency and "
     "Creativity.", EXPLORATIONS),
    ("video.html", "Video — Quaternion Process Theory of Cognition",
     "A 36-part video series working through Quaternion Process Theory: the kernel, "
     "the loops, the pathologies and the dispatch extensions.", VIDEO),
    ("books.html", "Books — Intuition Machine",
     "Books, pattern languages and field guides on deep learning, generative AI and agentic "
     "systems, published through Gumroad. Several are pay-what-you-want.", BOOKS),
    ("writing.html", "Writing — Intuition Machine",
     "Recent essays from Intuition Machine on Medium: patterns, methodology and strategy "
     "in deep learning, generative AI and agentic systems.", WRITING),
    ("team.html", "Team — Intuition Machine",
     "Carlos Perez, Software Architect and Co-Founder of Intuition Machine, an enterprise "
     "AI engineering and assurance company founded in 2015.", TEAM),
    ("about.html", "Contact — Intuition Machine",
     "Contact Intuition Machine about governed AI-native workflows, the machines for the "
     "self-learning enterprise, or our research: info@intuitionmachine.com.", ABOUT),
    ("privacy.html", "Privacy and Cookies — Intuition Machine",
     "Intuition Machine's website sets no cookies, stores nothing in your browser and runs "
     "no analytics. YouTube loads only when you press play.", PRIVACY),
]

# Old Squarespace and previous-design URLs, pointed at their new homes.
REDIRECTS = {
    "solutions.html": "machines.html",
    "software.html": "machines.html",
    "research-machine.html": "diagnosis.html",
    "products.html": "machines.html",
    "design-patterns-access.html": "index.html",
}


def redirect_page(target):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url={target}">
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="{SITE}/{target}">
<title>Redirecting…</title>
</head>
<body>
<p>This page has moved to <a href="{target}">{target}</a>.</p>
</body>
</html>
"""


def main():
    for slug, title, desc, body in PAGES:
        with open(os.path.join(OUT, slug), "w", encoding="utf-8") as f:
            f.write(shell(title, desc, body, slug=slug))
        print(f"  wrote {OUT}/{slug}")


    for slug, target in REDIRECTS.items():
        with open(os.path.join(OUT, slug), "w", encoding="utf-8") as f:
            f.write(redirect_page(target))
        print(f"  wrote {OUT}/{slug} -> {target}")

    # Films dropped into site/explainers/ arrive calling Google Fonts and CDNs;
    # privacy.html promises they don't, so copy those files into the site.
    import selfhost_assets
    selfhost_assets.main([])

    # Homepage FAQ and structured data, llms.txt and the sitemap.
    ai_search.main()


if __name__ == "__main__":
    main()
