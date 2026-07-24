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
  }

  // ---------------------------------------------------------------- drawing

  // Each leg bows perpendicular to travel, so the walk flows, and a leg that
  // retraces its outbound path separates from it instead of overlapping.
  function ctrlPoint(p, q) {
    var dx = q.x - p.x, dy = q.y - p.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var bow = Math.min(len * 0.2, 30);
    return { x: (p.x + q.x) / 2 - (dy / len) * bow,
             y: (p.y + q.y) / 2 + (dx / len) * bow };
  }

  function quadAt(p, c, q, t) {
    var m = 1 - t;
    return { x: m * m * p.x + 2 * m * t * c.x + t * t * q.x,
             y: m * m * p.y + 2 * m * t * c.y + t * t * q.y };
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
    var colour = run.valid ? SIGNAL : BAD;

    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.globalAlpha = 0.85;

    for (var i = 0; i < upto && i + 1 < pts.length; i++) {
      var cp = ctrlPoint(pts[i], pts[i + 1]);
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.quadraticCurveTo(cp.x, cp.y, pts[i + 1].x, pts[i + 1].y);
      ctx.stroke();
    }

    var head = pts[Math.min(upto, pts.length - 1)];
    if (upto + 1 < pts.length) {
      var a = pts[upto], b = pts[upto + 1], c = ctrlPoint(a, b), t = ease(frac);
      head = quadAt(a, c, b, t);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(a.x + (c.x - a.x) * t, a.y + (c.y - a.y) * t, head.x, head.y);
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
    seg = 0; t01 = 0; hold = 0;
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
      paintWord(); render();
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
