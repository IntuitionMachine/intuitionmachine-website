/* ============================================================
   The matrix, executed.

   Words are not illustrated here, they are run. Each loop's word is
   interpreted one letter at a time under the kernel's move rules and
   the resulting walk is drawn. Visitors can run their own words too,
   and the interpreter reports whether the walk closes.

   The rules, in full:
     U  unfold  +1 spine level        D  fold  -1 spine level
     I  iota    instance <-> system   G  gamma  content <-> vehicle
   ============================================================ */

(function () {
  "use strict";

  var canvas = document.getElementById("matrix");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var INK = "#14171a", INK2 = "#5a6068", RULE = "#c8c4b9";
  var SIGNAL = "#0f6e63", PAPER = "#f3f1eb", BAD = "#a33a2a";

  var COLS = ["ii", "ie", "ci", "ce"];
  var LEVELS = [3, 2, 1];
  var LEVEL_GLYPH = { 3: "ν", 2: "κ", 1: "ω" };
  var LEVEL_NAME = { 3: "mediation", 2: "causation", 1: "quality" };
  var COL_NAME = { ii: "instance · content", ie: "instance · vehicle",
                   ci: "system · content", ce: "system · vehicle" };

  var IOTA = { ii: "ci", ci: "ii", ie: "ce", ce: "ie" };
  var GAMMA = { ii: "ie", ie: "ii", ci: "ce", ce: "ci" };

  // ---------------------------------------------------------------- kernel

  function move(cell, letter) {
    var lvl = parseInt(cell.charAt(0), 10), col = cell.slice(2);
    if (letter === "U") { if (lvl >= 3) return null; lvl += 1; }
    else if (letter === "D") { if (lvl <= 1) return null; lvl -= 1; }
    else if (letter === "I") { col = IOTA[col]; }
    else if (letter === "G") { col = GAMMA[col]; }
    else return null;
    return lvl + "." + col;
  }

  // Returns the walk, plus what went wrong if anything did.
  function trace(start, word) {
    var letters = word.toUpperCase().replace(/[^UDIG]/g, "").split("");
    var path = [start], cur = start;
    for (var i = 0; i < letters.length; i++) {
      var next = move(cur, letters[i]);
      if (!next) {
        return { path: path, letters: letters, valid: false, failedAt: i,
                 reason: letters[i] + " is undefined from " + cur };
      }
      path.push(next); cur = next;
    }
    return { path: path, letters: letters, valid: true,
             closed: cur === start, end: cur };
  }

  // Words are authoritative; the walk is computed from them, not stored.
  var LOOPS = [
    { sym: "⦿G", name: "grounding", start: "3.ce", word: "DIDGUGUI",
      note: "descends to felt quality, returns carrying receipts" },
    { sym: "⦿K", name: "knowledge creation", start: "3.ii", word: "GIGI",
      note: "four quadrant flips, never changes level" },
    { sym: "⦿M", name: "management", start: "3.ce", word: "DIIU",
      note: "never descends to quality" },
    { sym: "⦿M*", name: "audit", start: "3.ce", word: "DI▼UI",
      note: "▼ marks the audit computation, not a move" },
    { sym: "⦿R", name: "reflexive quality", start: "3.ce", word: "DDUUIGIG",
      note: "opens with a double descent you must perform yourself" },
    { sym: "⦿O", name: "skilled action", start: "2.ie", word: "DGUUDG",
      note: "task completion" },
    { sym: "⦿C", name: "coordination", start: "2.ie", word: "DIGUUDIG",
      note: "operation routed through the system pole" },
    { sym: "⦿P", name: "policy / identity", start: "3.ci", word: "DDUUII",
      note: "identity coherence" },
    { sym: "⦿L", name: "legitimation", start: "3.ci", word: "GDGU",
      note: "normative legitimacy" },
    { sym: "⦿I", name: "intelligence", start: "1.ie", word: "IUUIIIGIIG",
      note: "flagged in the spec: does not close as printed" }
  ];

  // ---------------------------------------------------------------- state

  var W = 0, H = 0, dpr = 1, geo = null;
  var current = LOOPS[0], run = trace(current.start, current.word);
  var seg = 0, t01 = 0, hold = 0, last = 0, playing = !reduced;
  var paintedSeg = -1;
  var ctrls = [];
  var hoverCell = null;

  // ---------------------------------------------------------------- layout

  function layout() {
    var padL = Math.max(30, W * 0.045);
    var padR = Math.max(14, W * 0.025);
    var padT = Math.max(30, H * 0.15);
    var padB = Math.max(24, H * 0.1);
    return { padL: padL, padT: padT,
             gw: W - padL - padR, gh: H - padT - padB,
             cw: (W - padL - padR) / COLS.length,
             ch: (H - padT - padB) / LEVELS.length };
  }

  function cellXY(id) {
    var c = COLS.indexOf(id.slice(2)), r = LEVELS.indexOf(parseInt(id.charAt(0), 10));
    return { x: geo.padL + geo.cw * (c + 0.5), y: geo.padT + geo.ch * (r + 0.5) };
  }

  function cellAt(px, py) {
    var c = Math.floor((px - geo.padL) / geo.cw), r = Math.floor((py - geo.padT) / geo.ch);
    if (c < 0 || c > 3 || r < 0 || r > 2) return null;
    return LEVELS[r] + "." + COLS[c];
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = Math.round(rect.width * (rect.width < 640 ? 0.8 : 0.44));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    geo = layout();
    ctrls = [];
  }

  // ---------------------------------------------------------------- drawing

  // Control points for the walk's legs.
  //
  // Two rules, in order of priority:
  //  1. every arc bows to the side the grid centre is on, so none reads as
  //     convex regardless of which way the leg is travelled;
  //  2. no two arcs may sit on top of each other.
  //
  // (2) is not just about retraced legs. A leg from 3.ci to 3.ii runs straight
  // through 3.ie, laying it over two earlier legs of the same walk. So legs
  // are grouped by the infinite line they lie on, and within a line any that
  // overlap are given increasing bow depths - all on the same concave side,
  // so separating them never turns one convex.
  function computeCtrls(pts, cells) {
    var n = pts.length;
    if (n < 2) return [];

    var refx = geo.padL + geo.gw / 2;
    var refy = geo.padT + geo.gh / 2;

    var legs = [], i;
    for (i = 0; i < n - 1; i++) {
      var p = pts[i], q = pts[i + 1];
      var dx = q.x - p.x, dy = q.y - p.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / len, uy = dy / len;

      // Canonical direction, so a leg and its reverse share one line key.
      var cux = ux, cuy = uy;
      if (cux < -1e-6 || (Math.abs(cux) < 1e-6 && cuy < 0)) { cux = -cux; cuy = -cuy; }
      var nx = -cuy, ny = cux;

      var t0 = cux * p.x + cuy * p.y, t1 = cux * q.x + cuy * q.y;
      legs.push({
        p: p, q: q, len: len, ux: ux, uy: uy,
        line: Math.round(cux * 1e3) + "/" + Math.round(cuy * 1e3) + "/" +
              Math.round(nx * p.x + ny * p.y),
        t0: Math.min(t0, t1), t1: Math.max(t0, t1),
        layer: 0
      });
    }

    // Greedy interval colouring per line: give a leg the shallowest depth not
    // already taken by an earlier leg it overlaps.
    var byLine = {};
    for (i = 0; i < legs.length; i++) {
      (byLine[legs[i].line] = byLine[legs[i].line] || []).push(legs[i]);
    }
    var keys = Object.keys(byLine);
    for (var g = 0; g < keys.length; g++) {
      var group = byLine[keys[g]];
      for (var a = 0; a < group.length; a++) {
        var used = {};
        for (var b = 0; b < a; b++) {
          // Overlapping spans, with a small tolerance so legs that merely
          // touch end-to-end are left alone.
          if (group[a].t0 < group[b].t1 - 1 && group[b].t0 < group[a].t1 - 1) {
            used[group[b].layer] = true;
          }
        }
        var d = 0;
        while (used[d]) d++;
        group[a].layer = d;
      }
    }

    var spread = Math.max(13, Math.min(24, geo.ch * 0.22));
    var out = [];
    for (i = 0; i < legs.length; i++) {
      var L = legs[i];
      var mx = (L.p.x + L.q.x) / 2, my = (L.p.y + L.q.y) / 2;
      var px = -L.uy, py = L.ux;

      var side = px * (refx - mx) + py * (refy - my);
      if (Math.abs(side) < 0.5) side = (py !== 0 ? py : 1);
      var sign = side >= 0 ? 1 : -1;

      var base = Math.min(L.len * 0.14, 16);
      var mag = sign * (base + L.layer * spread);

      // A cubic with both controls offset, rather than one mid control point.
      // A quadratic leaves its endpoints almost tangent to the straight leg,
      // so two arcs at different depths still run together for a long way
      // out of a shared cell. The cubic reaches its depth quickly and holds
      // it, which is what keeps stacked lanes apart.
      var h = mag * 1.34;                    // both controls at h -> apex ~mag
      var ax = L.p.x + L.ux * L.len / 3, ay = L.p.y + L.uy * L.len / 3;
      var bx = L.q.x - L.ux * L.len / 3, by = L.q.y - L.uy * L.len / 3;
      out.push({ c1: { x: ax + px * h, y: ay + py * h },
                 c2: { x: bx + px * h, y: by + py * h } });
    }
    return out;
  }

  function lerp(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  // de Casteljau: the cubic from p to q, truncated at t, exactly on the
  // full curve.
  function cubicUpTo(p, c1, c2, q, t) {
    var a = lerp(p, c1, t), b = lerp(c1, c2, t), c = lerp(c2, q, t);
    var d = lerp(a, b, t), e = lerp(b, c, t);
    return { c1: a, c2: d, end: lerp(d, e, t) };
  }

  function ease(t) { return t * t * (3 - 2 * t); }

  var MONO = '"IBM Plex Mono", ui-monospace, monospace';

  function drawGrid() {
    ctx.lineWidth = 1;
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 4; c++) {
        var x = geo.padL + geo.cw * c, y = geo.padT + geo.ch * r;
        var id = LEVELS[r] + "." + COLS[c];
        ctx.fillStyle = (id === hoverCell) ? "#e2ded4" : "rgba(0,0,0,0)";
        ctx.fillRect(x, y, geo.cw, geo.ch);
        ctx.strokeStyle = RULE;
        ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5,
                       Math.round(geo.cw), Math.round(geo.ch));
        ctx.fillStyle = (id === hoverCell) ? INK2 : RULE;
        ctx.font = "500 10px " + MONO;
        ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText(id, x + 7, y + 6);
      }
    }
    ctx.fillStyle = INK2; ctx.font = "500 10px " + MONO;
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    for (var c2 = 0; c2 < 4; c2++) {
      ctx.fillText(COLS[c2].toUpperCase(), geo.padL + geo.cw * (c2 + 0.5), geo.padT - 12);
    }
    ctx.textAlign = "right"; ctx.font = "600 13px " + MONO;
    for (var r2 = 0; r2 < 3; r2++) {
      ctx.fillText(LEVEL_GLYPH[LEVELS[r2]], geo.padL - 12,
                   geo.padT + geo.ch * (r2 + 0.5) + 4);
    }
  }

  function drawWalk(upto, frac) {
    var pts = run.path.map(cellXY);
    if (!pts.length) return;
    if (ctrls.length !== pts.length - 1) ctrls = computeCtrls(pts, run.path);
    var colour = run.valid ? SIGNAL : BAD;

    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.globalAlpha = 0.85;

    for (var i = 0; i < upto && i + 1 < pts.length; i++) {
      var cp = ctrls[i];
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.bezierCurveTo(cp.c1.x, cp.c1.y, cp.c2.x, cp.c2.y,
                        pts[i + 1].x, pts[i + 1].y);
      ctx.stroke();
    }

    var head = pts[Math.min(upto, pts.length - 1)];
    if (upto + 1 < pts.length) {
      var a = pts[upto], b = pts[upto + 1], c = ctrls[upto], t = ease(frac);
      var part = cubicUpTo(a, c.c1, c.c2, b, t);
      head = part.end;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.bezierCurveTo(part.c1.x, part.c1.y, part.c2.x, part.c2.y,
                        head.x, head.y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = colour;
    for (var j = 0; j <= upto && j < pts.length; j++) {
      ctx.beginPath(); ctx.arc(pts[j].x, pts[j].y, 3.4, 0, Math.PI * 2); ctx.fill();
    }

    // Start cell gets a ring, so "closes back on itself" is visible.
    var s = pts[0];
    ctx.strokeStyle = colour; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(s.x, s.y, 8, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = PAPER; ctx.strokeStyle = colour; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(head.x, head.y, 5.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }

  function drawReadout() {
    if (!hoverCell) return;
    var lvl = parseInt(hoverCell.charAt(0), 10);
    ctx.fillStyle = INK; ctx.font = "500 11px " + MONO;
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(hoverCell + "  " + COL_NAME[hoverCell.slice(2)] +
                 "  at " + LEVEL_NAME[lvl], geo.padL, geo.padT - 30);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawWalk(seg, t01);
    drawReadout();
  }

  // ---------------------------------------------------------------- animation

  function frame(ts) {
    if (!last) last = ts;
    var dt = Math.min(ts - last, 60); last = ts;

    if (playing) {
      if (hold > 0) { hold -= dt; }
      else {
        t01 += dt / 560;
        while (t01 >= 1) {
          t01 -= 1; seg += 1;
          if (seg >= run.path.length - 1) {
            seg = run.path.length - 1; t01 = 0; hold = 1500; break;
          }
        }
        if (hold <= 0 && seg >= run.path.length - 1) {
          if (run.path.length < 2) { playing = false; syncPlay(); }
          else advance();
        }
      }
    }
    // The word strip is DOM, not canvas, so it has to be repainted when the
    // walk moves on. Only on an actual change of leg -- rebuilding it every
    // frame would thrash the DOM sixty times a second for no visible gain.
    if (seg !== paintedSeg) { paintWord(); paintedSeg = seg; }
    render();
    requestAnimationFrame(frame);
  }

  function advance() {
    if (current.custom) { seg = 0; t01 = 0; return; }   // replay, don't move on
    var i = LOOPS.indexOf(current);
    select(LOOPS[(i + 1) % LOOPS.length]);
  }

  // ---------------------------------------------------------------- ui

  var picker = document.getElementById("loop-picker");
  var wordEl = document.getElementById("word-display");
  var verdictEl = document.getElementById("verdict");
  var playBtn = document.getElementById("play-toggle");
  var stepBtn = document.getElementById("step-btn");

  function paintWord() {
    if (!wordEl) return;
    var letters = current.word.split("");
    var shown = 0;
    var html = "";
    for (var i = 0; i < letters.length; i++) {
      var isMove = /[UDIG]/i.test(letters[i]);
      var active = isMove && shown === seg && seg < run.path.length - 1;
      if (isMove) shown += 1;
      html += '<span class="ltr' + (active ? " is-on" : "") +
              (isMove ? "" : " is-mark") + '">' + letters[i] + "</span>";
    }
    wordEl.innerHTML = html;
  }

  function paintVerdict() {
    if (!verdictEl) return;
    var txt, cls;
    if (!run.valid) { txt = "invalid — " + run.reason; cls = "is-bad"; }
    else if (run.closed) { txt = "closes on " + current.start; cls = "is-ok"; }
    else { txt = "does not close — ends at " + run.end; cls = "is-bad"; }
    verdictEl.textContent = txt;
    verdictEl.className = "verdict " + cls;
  }

  function select(loop) {
    current = loop;
    run = trace(loop.start, loop.word);
    ctrls = [];
    seg = 0; t01 = 0; hold = 0; paintedSeg = -1;
    if (picker) {
      var btns = picker.querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) {
        btns[i].setAttribute("aria-pressed", String(LOOPS[i] === loop));
      }
    }
    var nameEl = document.getElementById("loop-name");
    if (nameEl) nameEl.textContent = loop.name + " — " + loop.note;
    paintWord(); paintVerdict();
    if (reduced) { seg = run.path.length - 1; render(); }
  }

  if (picker) {
    LOOPS.forEach(function (loop) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = loop.sym;
      b.title = loop.name;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { select(loop); playing = true; syncPlay(); });
      picker.appendChild(b);
    });
  }

  function syncPlay() {
    if (playBtn) playBtn.textContent = playing ? "Pause" : "Play";
  }

  if (playBtn) {
    playBtn.addEventListener("click", function () {
      playing = !playing; syncPlay();
    });
  }

  if (stepBtn) {
    stepBtn.addEventListener("click", function () {
      playing = false; syncPlay();
      if (seg < run.path.length - 1) { seg += 1; t01 = 0; }
      else { seg = 0; t01 = 0; }
      paintWord(); paintedSeg = seg; render();
    });
  }

  canvas.addEventListener("mousemove", function (e) {
    var r = canvas.getBoundingClientRect();
    var was = hoverCell;
    hoverCell = cellAt(e.clientX - r.left, e.clientY - r.top);
    if (was !== hoverCell && reduced) render();
  });
  canvas.addEventListener("mouseleave", function () {
    hoverCell = null; if (reduced) render();
  });

  // Custom word lab.
  var labForm = document.getElementById("word-lab");
  if (labForm) {
    labForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var startSel = document.getElementById("lab-start");
      var wordIn = document.getElementById("lab-word");
      var w = (wordIn.value || "").toUpperCase().replace(/[^UDIG]/g, "");
      if (!w) { wordIn.value = ""; return; }
      wordIn.value = w;
      select({ sym: "custom", name: "your word", start: startSel.value,
               word: w, custom: true,
               note: "run under the same rules as the inventory" });
      playing = true; syncPlay();
      if (!run.valid) { playing = false; syncPlay(); render(); }
    });
  }

  var t;
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(function () { resize(); render(); }, 150);
  });

  resize();
  select(LOOPS[0]);
  syncPlay();
  if (reduced) render();
  else requestAnimationFrame(frame);
})();

/* Click-to-load video. The poster is a real button, so it works from the
   keyboard; pressing it swaps in the privacy-mode YouTube player. Nothing
   is requested from YouTube before that. */
(function () {
  "use strict";
  var box = document.querySelector(".embed");
  if (!box) return;
  var btn = box.querySelector(".embed__poster");
  if (!btn) return;

  btn.addEventListener("click", function () {
    var list = box.getAttribute("data-playlist");
    var vid = box.getAttribute("data-video");
    var src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(vid) +
              "?list=" + encodeURIComponent(list) + "&autoplay=1&rel=0";
    var f = document.createElement("iframe");
    f.setAttribute("src", src);
    f.setAttribute("title", "Quaternion Process Theory playlist");
    f.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture");
    f.setAttribute("allowfullscreen", "");
    f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    box.replaceChild(f, btn);
    f.focus();
  });
})();

/* Mark the current page in the nav without hand-editing every file. */
(function () {
  "use strict";
  var here = location.pathname.split("/").pop() || "index.html";
  var links = document.querySelectorAll(".nav a");
  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute("href") === here) {
      links[i].setAttribute("aria-current", "page");
    }
  }
})();
