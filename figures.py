#!/usr/bin/env python3
"""Inline SVG figures explaining the QPT concepts.

Kept as source rather than image files: they inherit the site palette, stay
crisp at any size, add no extra requests, and can be edited as text.

Palette, mirroring site.css:
    paper-hi #f3f1eb   ink #14171a   ink-2 #5a6068
    rule     #c8c4b9   signal #0f6e63   bad #a33a2a
"""

MONO = 'IBM Plex Mono, ui-monospace, monospace'
DISP = 'Archivo, Helvetica Neue, Arial, sans-serif'

# Shared <defs>: one arrowhead per colour we draw arrows in.
DEFS = f"""<defs>
  <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="#0f6e63"/>
  </marker>
  <marker id="ah-ink" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="#5a6068"/>
  </marker>
  <marker id="ah-bad" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="#a33a2a"/>
  </marker>
</defs>"""


def _wrap(view_box, inner, label):
    return (f'<svg viewBox="{view_box}" role="img" aria-label="{label}" '
            f'xmlns="http://www.w3.org/2000/svg">{DEFS}{inner}</svg>')


# --------------------------------------------------------------------------
# The three levels, and the two moves that travel between them
# --------------------------------------------------------------------------

def _level_band(y, glyph, name, desc, tint):
    return f"""
  <rect x="150" y="{y}" width="500" height="62" fill="{tint}" stroke="#c8c4b9"/>
  <text x="172" y="{y + 30}" font-family="{MONO}" font-size="20" font-weight="600" fill="#0f6e63">{glyph}</text>
  <text x="204" y="{y + 27}" font-family="{DISP}" font-size="16" font-weight="600" fill="#14171a">{name}</text>
  <text x="204" y="{y + 47}" font-family="{MONO}" font-size="11" fill="#5a6068">{desc}</text>"""


FIG_LEVELS = _wrap(
    "0 0 720 300",
    f"""
  <text x="24" y="30" font-family="{MONO}" font-size="11" letter-spacing="1.6" fill="#5a6068">THE SPINE</text>

  {_level_band(56, "ν", "Thirdness — mediation", "law, habit, convention, meaning", "#eceae4")}
  {_level_band(136, "κ", "Secondness — causation", "brute encounter, resistance, surprise", "#eeece6")}
  {_level_band(216, "ω", "Firstness — quality", "felt character, before any comparison", "#f1efe9")}

  <!-- unfold / fold -->
  <line x1="96" y1="240" x2="96" y2="78" stroke="#0f6e63" stroke-width="1.6" marker-end="url(#ah)"/>
  <text x="88" y="150" font-family="{MONO}" font-size="11" font-weight="600" fill="#0f6e63" text-anchor="end">U</text>
  <text x="88" y="166" font-family="{MONO}" font-size="10" fill="#5a6068" text-anchor="end">unfold</text>

  <line x1="128" y1="78" x2="128" y2="240" stroke="#5a6068" stroke-width="1.6" marker-end="url(#ah-ink)"/>
  <text x="138" y="150" font-family="{MONO}" font-size="11" font-weight="600" fill="#5a6068">D</text>
  <text x="138" y="166" font-family="{MONO}" font-size="10" fill="#5a6068">fold</text>

  <text x="150" y="292" font-family="{MONO}" font-size="11" fill="#0f6e63">ω ≺ κ ≺ ν</text>
  <text x="230" y="292" font-family="{MONO}" font-size="11" fill="#5a6068">— each level presupposes the one below, not the other way round</text>
""",
    "Three spine levels: quality, causation and mediation, with unfold and fold moving between them.")


# --------------------------------------------------------------------------
# The four attentional quadrants
# --------------------------------------------------------------------------

def _quad(x, y, code, title, example):
    return f"""
  <rect x="{x}" y="{y}" width="250" height="104" fill="#f1efe9" stroke="#c8c4b9"/>
  <text x="{x + 18}" y="{y + 32}" font-family="{MONO}" font-size="18" font-weight="600" fill="#0f6e63">{code}</text>
  <text x="{x + 58}" y="{y + 31}" font-family="{DISP}" font-size="13" font-weight="600" fill="#14171a">{title}</text>
  <text x="{x + 18}" y="{y + 62}" font-family="{MONO}" font-size="11" fill="#5a6068">{example}</text>"""


FIG_QUADRANTS = _wrap(
    "0 0 720 340",
    f"""
  <text x="24" y="26" font-family="{MONO}" font-size="11" letter-spacing="1.6" fill="#5a6068">ONE SENTENCE, FOUR THINGS TO ATTEND TO</text>

  <text x="205" y="62" font-family="{MONO}" font-size="11" letter-spacing="1.4" fill="#5a6068" text-anchor="middle">CONTENT</text>
  <text x="465" y="62" font-family="{MONO}" font-size="11" letter-spacing="1.4" fill="#5a6068" text-anchor="middle">VEHICLE</text>

  <text x="72" y="134" font-family="{MONO}" font-size="10" letter-spacing="1.2" fill="#5a6068" text-anchor="end">INSTANCE</text>
  <text x="72" y="250" font-family="{MONO}" font-size="10" letter-spacing="1.2" fill="#5a6068" text-anchor="end">SYSTEM</text>

  {_quad(80, 78, "ii", "Instance · Content", "the meaning of this utterance")}
  {_quad(340, 78, "ie", "Instance · Vehicle", "the sound waves of it")}
  {_quad(80, 194, "ci", "System · Content", "the language&#8217;s semantics")}
  {_quad(340, 194, "ce", "System · Vehicle", "its grammar, as a machine")}

  <line x1="80" y1="316" x2="640" y2="316" stroke="#c8c4b9"/>
  <text x="80" y="334" font-family="{MONO}" font-size="11" fill="#5a6068">ι swaps instance ↔ system &#160;·&#160; γ swaps content ↔ vehicle</text>
""",
    "The four attentional quadrants as a two-by-two of instance versus system and content versus vehicle.")


# --------------------------------------------------------------------------
# The one-letter edit: healthy audit versus degraded audit
# --------------------------------------------------------------------------

FIG_AUDIT = _wrap(
    "0 0 720 400",
    f"""
  <!-- healthy lane -->
  <text x="24" y="28" font-family="{MONO}" font-size="11" letter-spacing="1.6" fill="#0f6e63">HEALTHY &#8212; ⦿M*</text>

  <rect x="24" y="46" width="150" height="52" fill="#f1efe9" stroke="#c8c4b9"/>
  <text x="99" y="70" font-family="{DISP}" font-size="13" font-weight="600" fill="#14171a" text-anchor="middle">the claim</text>
  <text x="99" y="88" font-family="{MONO}" font-size="11" fill="#5a6068" text-anchor="middle">ν · convention</text>

  <line x1="99" y1="104" x2="99" y2="146" stroke="#0f6e63" stroke-width="1.6" marker-end="url(#ah)"/>
  <text x="112" y="130" font-family="{MONO}" font-size="12" font-weight="600" fill="#0f6e63">D</text>
  <text x="130" y="130" font-family="{MONO}" font-size="10" fill="#5a6068">fold it down</text>

  <rect x="24" y="152" width="150" height="52" fill="#eceae4" stroke="#0f6e63"/>
  <text x="99" y="176" font-family="{DISP}" font-size="13" font-weight="600" fill="#14171a" text-anchor="middle">claim, folded</text>
  <text x="99" y="194" font-family="{MONO}" font-size="11" fill="#0f6e63" text-anchor="middle">κ · encounter</text>

  <rect x="286" y="152" width="150" height="52" fill="#eceae4" stroke="#0f6e63"/>
  <text x="361" y="176" font-family="{DISP}" font-size="13" font-weight="600" fill="#14171a" text-anchor="middle">what happened</text>
  <text x="361" y="194" font-family="{MONO}" font-size="11" fill="#0f6e63" text-anchor="middle">κ · encounter</text>

  <line x1="180" y1="178" x2="280" y2="178" stroke="#0f6e63" stroke-width="1.6" marker-start="url(#ah)" marker-end="url(#ah)"/>
  <text x="230" y="168" font-family="{MONO}" font-size="11" font-weight="600" fill="#0f6e63" text-anchor="middle">Δ(κ,ν)</text>

  <text x="470" y="172" font-family="{MONO}" font-size="11" fill="#5a6068">nothing left over</text>
  <text x="470" y="190" font-family="{DISP}" font-size="14" font-weight="600" fill="#0f6e63">claim is grounded</text>

  <line x1="24" y1="238" x2="696" y2="238" stroke="#c8c4b9"/>

  <!-- degraded lane -->
  <text x="24" y="268" font-family="{MONO}" font-size="11" letter-spacing="1.6" fill="#a33a2a">DEGRADED &#8212; THE SAME WORD, MINUS ONE D</text>

  <rect x="24" y="286" width="150" height="52" fill="#f1efe9" stroke="#c8c4b9"/>
  <text x="99" y="310" font-family="{DISP}" font-size="13" font-weight="600" fill="#14171a" text-anchor="middle">the claim</text>
  <text x="99" y="328" font-family="{MONO}" font-size="11" fill="#5a6068" text-anchor="middle">ν · convention</text>

  <rect x="286" y="286" width="150" height="52" fill="#f1efe9" stroke="#a33a2a"/>
  <text x="361" y="310" font-family="{DISP}" font-size="13" font-weight="600" fill="#14171a" text-anchor="middle">another account</text>
  <text x="361" y="328" font-family="{MONO}" font-size="11" fill="#a33a2a" text-anchor="middle">ν · convention</text>

  <line x1="180" y1="312" x2="280" y2="312" stroke="#a33a2a" stroke-width="1.6" marker-start="url(#ah-bad)" marker-end="url(#ah-bad)"/>
  <text x="230" y="302" font-family="{MONO}" font-size="11" font-weight="600" fill="#a33a2a" text-anchor="middle">Δ(ν,ν)</text>

  <!-- the missing fold -->
  <line x1="99" y1="344" x2="99" y2="380" stroke="#a33a2a" stroke-width="1.4" stroke-dasharray="4 4"/>
  <line x1="88" y1="356" x2="110" y2="378" stroke="#a33a2a" stroke-width="1.6"/>
  <line x1="110" y1="356" x2="88" y2="378" stroke="#a33a2a" stroke-width="1.6"/>
  <text x="126" y="372" font-family="{MONO}" font-size="11" fill="#a33a2a">the fold is gone &#8212; ground is never reached</text>

  <text x="470" y="306" font-family="{MONO}" font-size="11" fill="#5a6068">type-checks, runs,</text>
  <text x="470" y="322" font-family="{MONO}" font-size="11" fill="#5a6068">reports on schedule</text>
  <text x="470" y="342" font-family="{DISP}" font-size="14" font-weight="600" fill="#a33a2a">blind to failure</text>
""",
    "A healthy audit folds the claim to the encounter level before comparing; the degraded audit deletes that fold and compares two accounts.")


# --------------------------------------------------------------------------
# Complementary words: grounding descends, knowledge rotates
# --------------------------------------------------------------------------

def _mini_matrix(ox, oy, path, title, sym, letters, note, offsets=None):
    cw, ch = 42, 34
    cells = ""
    for r, lvl in enumerate([3, 2, 1]):
        for c, col in enumerate(["ii", "ie", "ci", "ce"]):
            cells += (f'<rect x="{ox + c * cw}" y="{oy + r * ch}" width="{cw}" height="{ch}" '
                      f'fill="#f1efe9" stroke="#c8c4b9"/>')
    pts = []
    for i, cell in enumerate(path):
        lvl, col = cell.split(".")
        c = ["ii", "ie", "ci", "ce"].index(col)
        r = [3, 2, 1].index(int(lvl))
        dx, dy = (offsets[i] if offsets else (0, 0))
        pts.append((ox + c * cw + cw / 2 + dx, oy + r * ch + ch / 2 + dy))
    poly = " ".join(f"{x},{y}" for x, y in pts)
    dots = "".join(f'<circle cx="{x}" cy="{y}" r="3.6" fill="#0f6e63"/>' for x, y in pts)
    glyphs = "".join(
        f'<text x="{ox - 10}" y="{oy + i * ch + ch / 2 + 4}" font-family="{MONO}" '
        f'font-size="11" fill="#5a6068" text-anchor="end">{g}</text>'
        for i, g in enumerate(["ν", "κ", "ω"]))
    return f"""
  <text x="{ox}" y="{oy - 30}" font-family="{MONO}" font-size="15" font-weight="600" fill="#0f6e63">{sym}</text>
  <text x="{ox + 40}" y="{oy - 30}" font-family="{DISP}" font-size="14" font-weight="600" fill="#14171a">{title}</text>
  {cells}{glyphs}
  <polyline points="{poly}" fill="none" stroke="#0f6e63" stroke-width="1.8" stroke-linejoin="round"/>
  {dots}
  <text x="{ox}" y="{oy + 3 * ch + 26}" font-family="{MONO}" font-size="12" font-weight="600" fill="#14171a">{letters}</text>
  <text x="{ox}" y="{oy + 3 * ch + 44}" font-family="{MONO}" font-size="10.5" fill="#5a6068">{note}</text>"""


FIG_COMPLEMENT = _wrap(
    "0 0 720 300",
    f"""
  <text x="24" y="26" font-family="{MONO}" font-size="11" letter-spacing="1.6" fill="#5a6068">EACH WORD IS MADE OF THE OTHER&#8217;S MISSING LETTERS</text>

  {_mini_matrix(60, 90, ["3.ce", "2.ie", "1.ii", "2.ie", "3.ce"], "grounding", "⦿G",
                "uses D and U", "climbs and descends; never changes perspective",
                offsets=[(-6, -4), (-6, 0), (0, 6), (6, 0), (6, -4)])}
  {_mini_matrix(420, 90, ["3.ii", "3.ie", "3.ce", "3.ci", "3.ii"], "knowledge", "⦿K",
                "uses G and I", "rotates perspective; never touches ground")}

  <line x1="360" y1="86" x2="360" y2="248" stroke="#c8c4b9" stroke-dasharray="3 4"/>
""",
    "Grounding walks down to quality and back; knowledge rotates through all four quadrants at the convention level.")


# --------------------------------------------------------------------------
# The ceiling conjecture
# --------------------------------------------------------------------------

FIG_CEILING = _wrap(
    "0 0 720 320",
    f"""
  <text x="24" y="26" font-family="{MONO}" font-size="11" letter-spacing="1.6" fill="#5a6068">HOW DEEP A PROCESS GOES CAPS HOW FAR IT CAN BE STANDARDISED</text>

  <!-- grade axis -->
  <text x="24" y="62" font-family="{MONO}" font-size="10" fill="#5a6068">STRICTEST</text>
  <text x="696" y="62" font-family="{MONO}" font-size="10" fill="#5a6068" text-anchor="end">LOOSEST</text>
  <line x1="24" y1="72" x2="696" y2="72" stroke="#c8c4b9"/>

  <text x="90" y="92" font-family="{MONO}" font-size="12" font-weight="600" fill="#14171a" text-anchor="middle">path</text>
  <text x="90" y="108" font-family="{MONO}" font-size="10" fill="#5a6068" text-anchor="middle">same steps</text>
  <text x="270" y="92" font-family="{MONO}" font-size="12" font-weight="600" fill="#14171a" text-anchor="middle">outcome</text>
  <text x="270" y="108" font-family="{MONO}" font-size="10" fill="#5a6068" text-anchor="middle">same result</text>
  <text x="450" y="92" font-family="{MONO}" font-size="12" font-weight="600" fill="#14171a" text-anchor="middle">semantic</text>
  <text x="450" y="108" font-family="{MONO}" font-size="10" fill="#5a6068" text-anchor="middle">same meaning</text>
  <text x="630" y="92" font-family="{MONO}" font-size="12" font-weight="600" fill="#14171a" text-anchor="middle">statistical</text>
  <text x="630" y="108" font-family="{MONO}" font-size="10" fill="#5a6068" text-anchor="middle">stable pattern</text>

  <!-- management: depth kappa, reaches the strictest grade -->
  <rect x="24" y="140" width="640" height="54" fill="#eceae4" stroke="#c8c4b9"/>
  <rect x="24" y="140" width="200" height="54" fill="#0f6e63" opacity=".13"/>
  <text x="40" y="164" font-family="{MONO}" font-size="13" font-weight="600" fill="#0f6e63">⦿M</text>
  <text x="80" y="164" font-family="{DISP}" font-size="13" font-weight="600" fill="#14171a">management</text>
  <text x="40" y="183" font-family="{MONO}" font-size="10.5" fill="#5a6068">depth = κ &#160;· stays at encounter</text>
  <line x1="224" y1="132" x2="224" y2="202" stroke="#0f6e63" stroke-width="2"/>
  <text x="236" y="152" font-family="{MONO}" font-size="10.5" fill="#0f6e63">ceiling: proceduralise nearly to identity</text>

  <!-- grounding / reflexive: depth omega, capped much looser -->
  <rect x="24" y="216" width="640" height="54" fill="#eceae4" stroke="#c8c4b9"/>
  <rect x="24" y="216" width="380" height="54" fill="#a33a2a" opacity=".08"/>
  <text x="40" y="240" font-family="{MONO}" font-size="13" font-weight="600" fill="#0f6e63">⦿G ⦿R</text>
  <text x="104" y="240" font-family="{DISP}" font-size="13" font-weight="600" fill="#14171a">grounding, reflexive quality</text>
  <text x="40" y="259" font-family="{MONO}" font-size="10.5" fill="#5a6068">depth = ω &#160;· descends to felt quality</text>
  <line x1="404" y1="208" x2="404" y2="278" stroke="#a33a2a" stroke-width="2"/>
  <text x="416" y="228" font-family="{MONO}" font-size="10.5" fill="#a33a2a">ceiling: same meaning, never the same steps</text>

  <text x="24" y="304" font-family="{MONO}" font-size="10.5" fill="#5a6068">Proceduralising past a process&#8217;s ceiling is how organisations kill the work they meant to scale.</text>
""",
    "Processes that stay at the encounter level can be proceduralised strictly; those descending to quality can promise only the same meaning.")


# --------------------------------------------------------------------------
# The fold-witness chain
# --------------------------------------------------------------------------

def _witness_node(x, y, title, sub, ok=True):
    stroke = "#0f6e63" if ok else "#c8c4b9"
    return f"""
  <rect x="{x}" y="{y}" width="146" height="50" fill="#f1efe9" stroke="{stroke}"/>
  <text x="{x + 73}" y="{y + 22}" font-family="{DISP}" font-size="12.5" font-weight="600" fill="#14171a" text-anchor="middle">{title}</text>
  <text x="{x + 73}" y="{y + 39}" font-family="{MONO}" font-size="10" fill="#5a6068" text-anchor="middle">{sub}</text>"""


FIG_WITNESS = _wrap(
    "0 0 720 290",
    f"""
  <text x="24" y="26" font-family="{MONO}" font-size="11" letter-spacing="1.6" fill="#0f6e63">GROUNDED &#8212; A DESCENT CHAIN WITH PROVENANCE</text>

  {_witness_node(24, 44, "the claim", "ν · convention")}
  {_witness_node(198, 44, "interpretation", "record")}
  {_witness_node(372, 44, "trace", "κ · execution log")}
  {_witness_node(546, 44, "event", "what happened")}

  <line x1="176" y1="69" x2="192" y2="69" stroke="#0f6e63" stroke-width="1.6" marker-start="url(#ah)"/>
  <line x1="350" y1="69" x2="366" y2="69" stroke="#0f6e63" stroke-width="1.6" marker-start="url(#ah)"/>
  <line x1="524" y1="69" x2="540" y2="69" stroke="#0f6e63" stroke-width="1.6" marker-start="url(#ah)"/>
  <text x="360" y="116" font-family="{MONO}" font-size="11" fill="#0f6e63" text-anchor="middle">anyone can walk the chain and check</text>

  <line x1="24" y1="146" x2="696" y2="146" stroke="#c8c4b9"/>

  <text x="24" y="178" font-family="{MONO}" font-size="11" letter-spacing="1.6" fill="#a33a2a">UNGROUNDED &#8212; NO WITNESS, THEREFORE CAPTURE-VULNERABLE</text>

  {_witness_node(24, 196, "the claim", "ν · convention", ok=False)}
  {_witness_node(546, 196, "event", "what happened", ok=False)}

  <line x1="176" y1="221" x2="330" y2="221" stroke="#a33a2a" stroke-width="1.4" stroke-dasharray="5 5"/>
  <line x1="392" y1="221" x2="540" y2="221" stroke="#a33a2a" stroke-width="1.4" stroke-dasharray="5 5"/>
  <line x1="348" y1="208" x2="374" y2="234" stroke="#a33a2a" stroke-width="1.8"/>
  <line x1="374" y1="208" x2="348" y2="234" stroke="#a33a2a" stroke-width="1.8"/>
  <text x="360" y="266" font-family="{MONO}" font-size="11" fill="#a33a2a" text-anchor="middle">nothing to check the story against but the story</text>
""",
    "A grounded claim links through an interpretation record and an execution trace to a real event; an ungrounded claim has no such chain.")


# --------------------------------------------------------------------------
# The selector: dispatch, misroute, starvation
# --------------------------------------------------------------------------

FIG_SELECTOR = _wrap(
    "0 0 720 330",
    f"""
  <text x="24" y="26" font-family="{MONO}" font-size="11" letter-spacing="1.6" fill="#5a6068">EVERY LOOP HEALTHY &#8212; AND THE CONTENT REACHED THE WRONG ONE</text>

  <rect x="24" y="130" width="140" height="56" fill="#f1efe9" stroke="#c8c4b9"/>
  <text x="94" y="154" font-family="{DISP}" font-size="13" font-weight="600" fill="#14171a" text-anchor="middle">arriving item</text>
  <text x="94" y="172" font-family="{MONO}" font-size="10" fill="#5a6068" text-anchor="middle">a strange complaint</text>

  <line x1="170" y1="158" x2="212" y2="158" stroke="#5a6068" stroke-width="1.6" marker-end="url(#ah-ink)"/>

  <rect x="218" y="118" width="112" height="80" fill="#eceae4" stroke="#0f6e63" stroke-width="1.6"/>
  <text x="274" y="150" font-family="{MONO}" font-size="17" font-weight="600" fill="#0f6e63" text-anchor="middle">Sel</text>
  <text x="274" y="170" font-family="{MONO}" font-size="10" fill="#5a6068" text-anchor="middle">the front desk</text>
  <text x="274" y="184" font-family="{MONO}" font-size="10" fill="#5a6068" text-anchor="middle">typed · regimed · owned</text>

  <!-- routes -->
  <line x1="336" y1="136" x2="470" y2="72" stroke="#a33a2a" stroke-width="1.8" marker-end="url(#ah-bad)"/>
  <line x1="336" y1="158" x2="470" y2="158" stroke="#0f6e63" stroke-width="1.8" marker-end="url(#ah)"/>
  <line x1="336" y1="180" x2="470" y2="252" stroke="#c8c4b9" stroke-width="1.6" stroke-dasharray="5 5"/>

  <rect x="476" y="46" width="220" height="52" fill="#f1efe9" stroke="#a33a2a"/>
  <text x="494" y="70" font-family="{MONO}" font-size="13" font-weight="600" fill="#a33a2a">⦿O</text>
  <text x="530" y="70" font-family="{DISP}" font-size="13" font-weight="600" fill="#14171a">handled as operations</text>
  <text x="494" y="88" font-family="{MONO}" font-size="10" fill="#a33a2a">MISROUTE &#8212; competent, and wrong</text>

  <rect x="476" y="132" width="220" height="52" fill="#f1efe9" stroke="#0f6e63"/>
  <text x="494" y="156" font-family="{MONO}" font-size="13" font-weight="600" fill="#0f6e63">⦿I</text>
  <text x="530" y="156" font-family="{DISP}" font-size="13" font-weight="600" fill="#14171a">early intelligence</text>
  <text x="494" y="174" font-family="{MONO}" font-size="10" fill="#5a6068">where it belonged</text>

  <rect x="476" y="226" width="220" height="52" fill="#f1efe9" stroke="#c8c4b9"/>
  <text x="494" y="250" font-family="{MONO}" font-size="13" font-weight="600" fill="#5a6068">⦿R</text>
  <text x="530" y="250" font-family="{DISP}" font-size="13" font-weight="600" fill="#5a6068">reflexive quality</text>
  <text x="494" y="268" font-family="{MONO}" font-size="10" fill="#5a6068">ROUTE STARVATION &#8212; never engaged</text>

  <text x="24" y="316" font-family="{MONO}" font-size="10.5" fill="#5a6068">The diagnostic layers examine each loop, find all of them healthy, and return nothing.</text>
""",
    "A selector routes an arriving item; a misroute sends it to a competent but wrong loop, and route starvation leaves a healthy loop never engaged.")
