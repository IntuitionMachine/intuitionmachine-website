#!/usr/bin/env python3
"""Generate the inner pages of site/ from one shared shell.

index.html is hand-written (it carries the matrix plate); everything else is
assembled here so the header, footer and metadata cannot drift apart.

spec.html is the full QPT specification rendered from the markdown source in
the repository root.

Run:  python3 build_pages.py
"""
import os

import figures

OUT = "site"

NAV = [
    ("index.html", "Home"),
    ("kernel.html", "Kernel"),
    ("loops.html", "Loops"),
    ("software.html", "Software"),
    ("diagnosis.html", "Diagnosis"),
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
          <path d="M22 6 L22 16 M22 28 L22 38 M6 22 L16 22 M28 22 L38 22" stroke-linecap="round"/>
          <circle cx="22" cy="22" r="6.2"/>
          <path d="M11 11 L16.5 16.5 M33 11 L27.5 16.5" stroke-linecap="round" opacity=".55"/>
        </svg>"""

PRODUCTS = f"""<div class="products">
      <article class="product">
        {CM_ICON}
        <span class="product__abbr">CM</span>
        <h3>Connection Machine</h3>
        <p class="product__role">Witness graph and word tracing</p>
        <ul class="caps">
          <li>Builds the fold-witness graph: which claims descend to evidence, and how far</li>
          <li>Traces which of the twelve loops a system actually runs, and which fail to close</li>
          <li>Detects letter deletions — the audit that compares reports to other reports</li>
          <li>Flags orphaned conventions: standing rules with no living editor</li>
        </ul>
      </article>

      <article class="product">
        {IM_ICON}
        <span class="product__abbr">IM</span>
        <h3>Intuition Machine</h3>
        <p class="product__role">Typed dispatch</p>
        <ul class="caps">
          <li>The selector made operational: routes arriving content to the handling loop</li>
          <li>Types every route by level and column — no unindexed selection</li>
          <li>Holds routing rules to the ceiling: quality-reading routes stay uncompiled</li>
          <li>Keeps a live-judgment path and an alerting bypass permanently open</li>
        </ul>
      </article>
    </div>"""

CTA = """<section class="band--deep">
    <div class="wrap section cta">
      <h2>Bring it a system that is failing quietly.</h2>
      <p class="lede">Diagnostic engagements start by asking which words your organisation
      actually runs, and which of its standing rules no longer have an owner.</p>
      <div class="cta__actions">
        <a class="btn btn--lit" href="diagnosis.html">How diagnosis works</a>
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


def shell(title, description, body, body_class=""):
    nav = "\n      ".join(f'<a href="{href}">{text}</a>' for href, text in NAV)
    cls = f' class="{body_class}"' if body_class else ""
    body = render_figures(body)
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
<body{cls}>

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
        <p style="margin-top:.9rem;max-width:34ch">Quaternion Process Theory on the QML kernel</p>
      </div>
      <div>
        <h4>Theory</h4>
        <ul>
          <li><a href="kernel.html">The Kernel</a></li>
          <li><a href="loops.html">The Loops</a></li>
          <li><a href="diagnosis.html">Diagnosis</a></li>
        </ul>
      </div>
      <div>
        <h4>Software</h4>
        <ul>
          <li><a href="software.html">Connection Machine</a></li>
          <li><a href="software.html">Intuition Machine</a></li>
          <li><a href="team.html">Team</a></li>
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
# The Kernel
# --------------------------------------------------------------------------

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
# Software
# --------------------------------------------------------------------------

SOFTWARE = f"""
  <section class="wrap page-head">
    <span class="label">Software</span>
    <h1>Two instruments, one kernel</h1>
    <p class="lede">One reads the words a system already runs and checks how far its claims
    sit from ground. The other stands at the front desk and decides which word runs next.</p>
  </section>

  <section class="wrap section section--ruled">
    {PRODUCTS}
  </section>

  <section class="wrap section section--ruled">
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
        <p>CM instruments that chain. It ingests the trace store, indexes the four strata of
        witness depth, and reports — per claim — whether a descent path to evidence exists and
        how many hops long it is. Because the test is mechanical, anyone can run it on any
        assertion.</p>

    <figure class="fig">
      <!--FIG_WITNESS-->
      <figcaption class="label">Fig. 07 — A claim with a descent chain, and one without</figcaption>
    </figure>

        <p>What it cannot do is eliminate the remainder. Convention is never fully groundable,
        so a narratable margin is permanent. CM's job is to make the groundable portion
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
        <p>IM makes the selector explicit. Every route is typed by level and column. Rules are
        marked as compiled or live, and the mix is matched to stage — compiled selection is
        appropriate standardisation at commodity stage and lethal at genesis.</p>

    <figure class="fig">
      <!--FIG_SELECTOR-->
      <figcaption class="label">Fig. 08 — Misroute and route starvation at the front desk</figcaption>
    </figure>
        <p>Two guards are structural rather than configurable. Routes that must read
        quality-level content cannot be fully compiled, so no rulebook becomes the sole gate on
        quality-sensing. And every compiled rule set is itself a standing convention, so it
        carries a witness and an owner — because orphaned routing rules are the dead hand at
        the front desk.</p>
      </div>
    </div>
  </section>

  <section class="band--deep">
    <div class="wrap section">
      <div class="section__head">
        <span class="label">Status</span>
        <h2>What is claimed, and what is not</h2>
      </div>
      <div class="prose" style="max-width:70ch">
        <p>The kernel these instruments implement is verified: seven axioms, nine load-bearing
        theorems, and 43 of 43 checks passing in the canonical model. The constructs the
        dispatch layer rests on are newer and carry weaker labels — the selector is FRAMEWORK
        with its formalisation deferred to an open problem, and the ceiling conjecture is
        SEMI-FORMAL pending a model family not yet built.</p>
        <p>Those labels are printed here for the same reason they are printed in the
        specification. A tool that reports on grounding should be honest about its own.</p>
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
              href="https://medium.com/intuitionmachine/archive" rel="noopener">Read the archive</a></p>
      </div>
    </div>
  </section>

  """ + CTA + """
"""

ABOUT = """
  <section class="wrap page-head">
    <span class="label">Contact</span>
    <h1>Get in touch</h1>
    <p class="lede">Tell us which of your standing conventions no longer has anyone who could
    change it.</p>
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

PAGES = [
    ("kernel.html", "The Kernel — Quaternion Process Theory",
     "The QML kernel: three spine levels, four attentional columns, and one generative "
     "operator from which the rest of the theory is built.", KERNEL),
    ("loops.html", "The Loops — Quaternion Process Theory",
     "Twelve recurring processes, each written as a word: a string of moves on the matrix "
     "that closes back on its start cell.", LOOPS),
    ("software.html", "Software — Connection Machine and Intuition Machine",
     "Connection Machine builds the fold-witness graph. Intuition Machine makes the "
     "selector explicit: typed dispatch with a live-judgment path held open.", SOFTWARE),
    ("diagnosis.html", "Diagnosis — Quaternion Process Theory",
     "Pathologies as syntactic edits to healthy words, and the seven-layer diagnostic that "
     "locates them.", DIAGNOSIS),
    ("team.html", "Team — Intuition Machine",
     "Carlos Perez, Software Architect and Co-Founder of Intuition Machine.", TEAM),
    ("about.html", "Contact — Intuition Machine",
     "Contact Intuition Machine.", ABOUT),
]

# Old Squarespace and previous-design URLs, pointed at their new homes.
REDIRECTS = {
    "solutions.html": "software.html",
    "research-machine.html": "diagnosis.html",
    "products.html": "software.html",
    "design-patterns-access.html": "index.html",
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
        with open(os.path.join(OUT, slug), "w", encoding="utf-8") as f:
            f.write(shell(title, desc, body))
        print(f"  wrote {OUT}/{slug}")


    for slug, target in REDIRECTS.items():
        with open(os.path.join(OUT, slug), "w", encoding="utf-8") as f:
            f.write(redirect_page(target))
        print(f"  wrote {OUT}/{slug} -> {target}")


if __name__ == "__main__":
    main()
