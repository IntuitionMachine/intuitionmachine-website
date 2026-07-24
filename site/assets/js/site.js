/* ============================================================
   The twelve-cell matrix, with loop words tracing across it.

   Three spine levels (quality, causation, mediation) by four
   attentional columns (ii, ie, ci, ce). Each recurring process in
   QPT is a closed walk on this grid, so animating the walks shows
   the theory's central object rather than illustrating it.
   ============================================================ */

(function () {
  "use strict";

  var canvas = document.getElementById("matrix");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var INK = "#14171a";
  var INK2 = "#5a6068";
  var RULE = "#c8c4b9";
  var SIGNAL = "#0f6e63";
  var PAPER = "#f3f1eb";

  var COLS = ["ii", "ie", "ci", "ce"];
  var LEVELS = [3, 2, 1];               // drawn top to bottom
  var LEVEL_GLYPH = { 3: "ν", 2: "κ", 1: "ω" };

  // Waypoint paths from the loop inventory. The word is authoritative in
  // the specification; these are the waypoints it passes through.
  var LOOPS = [
    { sym: "⦿ G", name: "grounding", word: "DIDGUGUI",
      note: "descends to felt quality, returns carrying receipts",
      path: ["3.ce", "2.ie", "1.ii", "2.ie", "3.ce"] },
    { sym: "⦿ K", name: "knowledge creation", word: "GIGI",
      note: "four quadrant flips, no change of level",
      path: ["3.ii", "3.ie", "3.ce", "3.ci", "3.ii"] },
    { sym: "⦿ M", name: "management", word: "DIIU",
      note: "never descends to quality",
      path: ["3.ce", "2.ce", "2.ie", "2.ce", "3.ce"] },
    { sym: "⦿ R", name: "reflexive quality", word: "DDUUIGIG",
      note: "opens with a double descent you must perform yourself",
      path: ["3.ce", "1.ce", "2.ce", "3.ii", "3.ce"] },
    { sym: "⦿ P", name: "policy / identity", word: "DDUUII",
      note: "identity coherence across the system columns",
      path: ["3.ci", "1.ci", "2.ci", "3.ii", "3.ci"] }
  ];

  var W = 0, H = 0, dpr = 1, geo = null;
  var loopIx = 0, seg = 0, t01 = 0, hold = 0;
  var last = 0;

  function layout() {
    // Wide enough for the right-aligned level names ("mediation" is the
    // longest) once they are drawn; narrow when only the glyph shows.
    var padL = Math.max(30, W * 0.045);
    var padR = Math.max(14, W * 0.025);
    var padT = Math.max(30, H * 0.13);
    var padB = Math.max(30, H * 0.16);
    var gw = W - padL - padR;
    var gh = H - padT - padB;
    return {
      padL: padL, padT: padT, gw: gw, gh: gh,
      cw: gw / COLS.length,
      ch: gh / LEVELS.length
    };
  }

  function cellXY(id) {
    var parts = id.split(".");
    var lvl = parseInt(parts[0], 10);
    var col = COLS.indexOf(parts[1]);
    var row = LEVELS.indexOf(lvl);
    return {
      x: geo.padL + geo.cw * (col + 0.5),
      y: geo.padT + geo.ch * (row + 0.5)
    };
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    var ratio = rect.width < 640 ? 0.82 : 0.46;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = Math.round(rect.width * ratio);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    geo = layout();
  }

  function drawGrid() {
    var mono = '500 10px "IBM Plex Mono", ui-monospace, monospace';

    // Cells.
    ctx.lineWidth = 1;
    for (var r = 0; r < LEVELS.length; r++) {
      for (var c = 0; c < COLS.length; c++) {
        var x = geo.padL + geo.cw * c;
        var y = geo.padT + geo.ch * r;
        ctx.strokeStyle = RULE;
        ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5,
                       Math.round(geo.cw), Math.round(geo.ch));

        // Cell name, quietly, in the corner.
        ctx.fillStyle = RULE;
        ctx.font = mono;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(LEVELS[r] + "." + COLS[c], x + 7, y + 6);
      }
    }

    // Column headings.
    ctx.fillStyle = INK2;
    ctx.font = mono;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    for (var c2 = 0; c2 < COLS.length; c2++) {
      ctx.fillText(COLS[c2].toUpperCase(),
                   geo.padL + geo.cw * (c2 + 0.5), geo.padT - 12);
    }

    // Level glyphs down the left. The names live in the figure caption, so
    // the plate stays uncluttered and nothing depends on gutter width.
    ctx.textAlign = "right";
    ctx.fillStyle = INK2;
    ctx.font = '600 13px "IBM Plex Mono", ui-monospace, monospace';
    for (var r2 = 0; r2 < LEVELS.length; r2++) {
      var cy = geo.padT + geo.ch * (r2 + 0.5);
      ctx.fillText(LEVEL_GLYPH[LEVELS[r2]], geo.padL - 12, cy + 4);
    }
  }

  // Each leg bows perpendicular to its own direction of travel. Two useful
  // consequences: the walk reads as flowing rather than stepping, and a leg
  // that retraces its outbound path bows the opposite way in absolute terms,
  // so the return separates into a visible loop instead of overlapping.
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

  // Smoothstep, so the head settles onto each cell rather than arriving at
  // full speed and stopping dead.
  function ease(t) { return t * t * (3 - 2 * t); }

  function drawWalk(loop, upto, frac) {
    var pts = loop.path.map(cellXY);

    ctx.strokeStyle = SIGNAL;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.85;

    // Legs already travelled, drawn whole.
    for (var i = 0; i < upto && i + 1 < pts.length; i++) {
      var cp = ctrlPoint(pts[i], pts[i + 1]);
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.quadraticCurveTo(cp.x, cp.y, pts[i + 1].x, pts[i + 1].y);
      ctx.stroke();
    }

    // The leg being travelled, truncated at the head. Splitting a quadratic at
    // t (de Casteljau) keeps the drawn part exactly on the full curve.
    var head = pts[Math.min(upto, pts.length - 1)];
    if (upto + 1 < pts.length) {
      var a = pts[upto], b = pts[upto + 1], c = ctrlPoint(a, b);
      var t = ease(frac);
      head = quadAt(a, c, b, t);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(a.x + (c.x - a.x) * t, a.y + (c.y - a.y) * t,
                           head.x, head.y);
      ctx.stroke();
    }

    // Visited cells.
    ctx.globalAlpha = 1;
    for (var j = 0; j <= upto && j < pts.length; j++) {
      ctx.fillStyle = SIGNAL;
      ctx.beginPath();
      ctx.arc(pts[j].x, pts[j].y, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Travelling head.
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = SIGNAL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(head.x, head.y, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawLabel(loop) {
    var y = geo.padT + geo.gh + 22;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    ctx.fillStyle = SIGNAL;
    ctx.font = '600 12px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText(loop.sym, geo.padL, y);

    ctx.fillStyle = INK;
    ctx.font = '600 12px "IBM Plex Mono", ui-monospace, monospace';
    var symW = ctx.measureText(loop.sym).width + 12;
    ctx.fillText(loop.name, geo.padL + symW, y);

    ctx.fillStyle = INK2;
    ctx.font = '400 11px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = "right";
    ctx.fillText(loop.word, geo.padL + geo.gw, y);

    if (W > 620) {
      ctx.textAlign = "left";
      ctx.fillStyle = INK2;
      ctx.fillText(loop.note, geo.padL, y + 16);
    }
  }

  function render(loop, upto, frac) {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawWalk(loop, upto, frac);
    ctx.globalAlpha = 1;
    drawLabel(loop);
  }

  function frame(ts) {
    if (!last) last = ts;
    var dt = Math.min(ts - last, 60);
    last = ts;

    var loop = LOOPS[loopIx];

    if (hold > 0) {
      hold -= dt;
    } else {
      t01 += dt / 620;                       // ~0.6s per segment
      while (t01 >= 1) {
        t01 -= 1;
        seg++;
        if (seg >= loop.path.length - 1) {
          hold = 1400;                       // rest on the closed walk
          seg = loop.path.length - 1;
          t01 = 0;
          break;
        }
      }
      if (hold > 0 && seg >= loop.path.length - 1) {
        // finished; the next tick after the hold moves on
      }
    }

    render(loop, seg, t01);

    if (hold <= 0 && seg >= loop.path.length - 1) {
      loopIx = (loopIx + 1) % LOOPS.length;
      seg = 0; t01 = 0;
    }

    requestAnimationFrame(frame);
  }

  function still() {
    var loop = LOOPS[0];
    render(loop, loop.path.length - 1, 0);
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      if (reduced) still();
    }, 150);
  });

  resize();
  if (reduced) still();
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
