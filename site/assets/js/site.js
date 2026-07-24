/* ============================================================
   Hero plate: unstructured input resolved into indexed features.
   Particles enter as scattered noise on the left, are pulled onto
   a lattice through the middle, and leave as ordered rows on the
   right - the Ingest / Integrate / Index thesis, drawn literally.
   ============================================================ */

(function () {
  "use strict";

  var canvas = document.getElementById("plate");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var INK = "#14171a";
  var SIGNAL = "#0f6e63";
  var RULE = "#c8c4b9";

  var W = 0, H = 0, dpr = 1;
  var particles = [];
  var ROWS = 9;

  // Zone boundaries as a fraction of width: noise | resolving | indexed.
  var Z1 = 0.30, Z2 = 0.70;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function rowY(row) {
    var top = H * 0.16, bottom = H * 0.84;
    return top + (bottom - top) * (row / (ROWS - 1));
  }

  function spawn(p, seeded) {
    p.x = seeded ? rand(0, W) : rand(-W * 0.12, 0);
    p.row = (Math.random() * ROWS) | 0;
    p.noiseY = rand(H * 0.08, H * 0.92);
    p.speed = rand(0.22, 0.55) * (W / 900);
    p.size = rand(1.5, 3.1);
    p.phase = rand(0, Math.PI * 2);
    p.wob = rand(4, 16);
    return p;
  }

  function build() {
    var count = Math.round(Math.min(520, Math.max(180, W / 2.4)));
    particles = [];
    for (var i = 0; i < count; i++) particles.push(spawn({}, true));
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    // A wide, plate-like aspect that shortens on small screens.
    var ratio = rect.width < 620 ? 0.62 : 0.34;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = Math.round(rect.width * ratio);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  // Ease the transition from noise to row so the middle band reads as work
  // being done rather than a straight line.
  function ease(t) { return t * t * (3 - 2 * t); }

  function drawStructure() {
    ctx.save();

    // Indexed row guides on the right.
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    for (var r = 0; r < ROWS; r++) {
      var y = Math.round(rowY(r)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(W * Z2, y);
      ctx.lineTo(W * 0.985, y);
      ctx.stroke();
    }

    // Lattice nodes through the resolving band.
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = RULE;
    var cols = 7;
    for (var c = 0; c < cols; c++) {
      var x = W * Z1 + ((W * (Z2 - Z1)) * (c / (cols - 1)));
      for (var r2 = 0; r2 < ROWS; r2++) {
        ctx.fillRect(Math.round(x) - 1, Math.round(rowY(r2)) - 1, 2, 2);
      }
    }

    // Zone divider ticks.
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = RULE;
    ctx.setLineDash([2, 4]);
    [Z1, Z2].forEach(function (z) {
      ctx.beginPath();
      ctx.moveTo(Math.round(W * z) + 0.5, H * 0.06);
      ctx.lineTo(Math.round(W * z) + 0.5, H * 0.94);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    ctx.restore();
  }

  function drawParticles(t) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var f = p.x / W;
      var y, resolved;

      if (f < Z1) {
        y = p.noiseY + Math.sin(t * 0.0011 + p.phase) * p.wob;
        resolved = 0;
      } else if (f < Z2) {
        var k = ease((f - Z1) / (Z2 - Z1));
        var noisy = p.noiseY + Math.sin(t * 0.0011 + p.phase) * p.wob * (1 - k);
        y = noisy + (rowY(p.row) - noisy) * k;
        resolved = k;
      } else {
        y = rowY(p.row);
        resolved = 1;
      }

      ctx.globalAlpha = 0.42 + resolved * 0.55;
      ctx.fillStyle = resolved > 0.5 ? SIGNAL : INK;

      if (resolved > 0.85) {
        // Indexed: uniform ticks snapped to a column grid, so the right-hand
        // zone reads as ordered records rather than dots that happen to line up.
        var step = 9;
        var s = 3.4;
        var qx = Math.round(p.x / step) * step;
        ctx.fillRect(qx - s / 2, Math.round(y) - s / 2, s, s);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, y, p.size * (1 - resolved * 0.3), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    drawStructure();
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.speed;
      if (p.x > W * 1.02) spawn(p, false);
    }
    drawParticles(t);
    requestAnimationFrame(frame);
  }

  function still() {
    ctx.clearRect(0, 0, W, H);
    drawStructure();
    drawParticles(0);
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
