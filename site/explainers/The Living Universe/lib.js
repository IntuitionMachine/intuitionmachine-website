/* Drawing helpers shared by the engine and the scenes. */
'use strict';
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
const eio = t => (t = clamp(t)) < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eout = t => 1 - Math.pow(1 - clamp(t), 3);
const eoutx = t => { t = clamp(t); return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };
const eback = t => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y, s) { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

const COL = {
  gold: [255, 200, 120], amber: [255, 150, 60], white: [255, 244, 226], cyan: [120, 215, 255],
  blue: [80, 140, 255], violet: [165, 105, 255], magenta: [255, 95, 175], red: [255, 96, 64],
  teal: [90, 235, 205], grey: [130, 145, 170], dim: [70, 90, 130],
};
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

const FONT = {
  disp: '"Cormorant Garamond", "Noto Serif Greek", Georgia, serif',
  body: 'Spectral, "Noto Serif Greek", Georgia, serif',
  mono: '"IBM Plex Mono", "Noto Serif Greek", ui-monospace, monospace',
};

const _glow = new Map();
function glowSprite(c) {
  const key = c.join(',');
  let s = _glow.get(key);
  if (!s) {
    s = document.createElement('canvas'); s.width = s.height = 128;
    const g = s.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, rgba(mix(c, [255, 255, 255], 0.55), 1));
    gr.addColorStop(0.1, rgba(c, 0.8));
    gr.addColorStop(0.28, rgba(c, 0.3));
    gr.addColorStop(0.55, rgba(c, 0.08));
    gr.addColorStop(1, rgba(c, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    _glow.set(key, s);
  }
  return s;
}
function glow(ctx, x, y, r, c, a = 1) {
  if (a <= 0.004 || r <= 0) return;
  const s = glowSprite(c), pa = ctx.globalAlpha, op = ctx.globalCompositeOperation;
  ctx.globalAlpha = pa * Math.min(1, a); ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(s, x - r, y - r, 2 * r, 2 * r);
  ctx.globalCompositeOperation = op; ctx.globalAlpha = pa;
}

const HAS_LS = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;
function setFont(ctx, o) {
  ctx.font = `${o.it ? 'italic ' : ''}${o.w || 400} ${o.size || 32}px ${o.f || FONT.disp}`;
  if (HAS_LS) ctx.letterSpacing = (o.ls || 0) + 'px';
}
function txt(ctx, s, x, y, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= 0.004) return;
  ctx.save();
  setFont(ctx, o);
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
  ctx.globalAlpha *= a;
  if (o.glow) { ctx.shadowColor = rgba(o.glow, 0.9); ctx.shadowBlur = o.blur || 18; }
  ctx.fillStyle = o.c ? (typeof o.c === 'string' ? o.c : rgba(o.c, 1)) : '#fff4e2';
  ctx.fillText(s, x, y);
  if (o.glow) { ctx.shadowBlur = 0; ctx.fillText(s, x, y); }
  ctx.restore();
}
// typewriter-style reveal with a soft leading edge
function txtR(ctx, s, x, y, p, o = {}) {
  if (p <= 0) return;
  if (p >= 1) return txt(ctx, s, x, y, o);
  ctx.save(); setFont(ctx, o);
  const w = ctx.measureText(s).width;
  const align = o.align || 'center';
  let x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  const n = s.length * p, full = Math.floor(n);
  const head = s.slice(0, full);
  ctx.restore();
  txt(ctx, head, x0, y, Object.assign({}, o, { align: 'left' }));
  if (full < s.length) {
    ctx.save(); setFont(ctx, o); const hw = ctx.measureText(head).width; ctx.restore();
    txt(ctx, s[full], x0 + hw, y, Object.assign({}, o, { align: 'left', a: (o.a == null ? 1 : o.a) * (n - full) }));
  }
}
function measure(ctx, s, o) { ctx.save(); setFont(ctx, o); const w = ctx.measureText(s).width; ctx.restore(); return w; }

function stroke(ctx, c, a, w) { ctx.strokeStyle = rgba(c, a); ctx.lineWidth = w; ctx.stroke(); }
function fill(ctx, c, a) { ctx.fillStyle = rgba(c, a); ctx.fill(); }
function seg(ctx, x1, y1, x2, y2, c, a = 1, w = 2) { if (a <= 0.004) return; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); stroke(ctx, c, a, w); }
function ring(ctx, x, y, r, c, a = 1, w = 2, a0 = 0, a1 = TAU) { if (a <= 0.004 || r <= 0) return; ctx.beginPath(); ctx.arc(x, y, r, a0, a1); stroke(ctx, c, a, w); }
function disc(ctx, x, y, r, c, a = 1) { if (a <= 0.004 || r <= 0) return; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); fill(ctx, c, a); }
function dot(ctx, x, y, r, c, a = 1) { disc(ctx, x, y, r, c, a); glow(ctx, x, y, r * 6, c, a * 0.6); }
function arrowHead(ctx, x, y, ang, s, c, a = 1) {
  if (a <= 0.004) return;
  ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * s, y + Math.sin(ang) * s);
  ctx.lineTo(x + Math.cos(ang + 2.5) * s * 0.8, y + Math.sin(ang + 2.5) * s * 0.8);
  ctx.lineTo(x + Math.cos(ang - 2.5) * s * 0.8, y + Math.sin(ang - 2.5) * s * 0.8);
  ctx.closePath(); fill(ctx, c, a);
}
function polyPath(ctx, x, y, r, n, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const t = rot + i * TAU / n; const px = x + Math.cos(t) * r, py = y + Math.sin(t) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath();
}
function check(ctx, x, y, s, c, a) { ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.3, y + s * 0.7); ctx.lineTo(x + s, y - s * 0.8); ctx.lineCap = 'round'; stroke(ctx, c, a, s * 0.28); ctx.lineCap = 'butt'; }
function cross(ctx, x, y, s, c, a, w) { ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.lineCap = 'round'; stroke(ctx, c, a, w || s * 0.28); ctx.lineCap = 'butt'; }

// an entangled pair: two strands braided between two ends
function braid(ctx, x1, y1, x2, y2, amp, ph, c, a = 1, w = 1.6, waves) {
  if (a <= 0.004) return;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); if (L < 1) return;
  const nx = -dy / L, ny = dx / L, n = Math.max(8, Math.min(48, L / 7 | 0));
  const k = waves || Math.max(1, Math.round(L / 60));
  for (let s = 0; s < 2; s++) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const t = i / n, env = Math.sin(Math.PI * t);
      const o = amp * env * Math.sin(t * k * TAU + ph + s * Math.PI);
      const px = x1 + dx * t + nx * o, py = y1 + dy * t + ny * o;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    stroke(ctx, c, a * (s ? 0.75 : 1), w);
  }
}

// qudit glyph: d=1 point, d=2 lens pair, d=3 triangle, d=4 square
function qudit(ctx, x, y, r, d, rot, c, a = 1, w = 2) {
  if (a <= 0.004) return;
  if (d <= 1) { dot(ctx, x, y, r * 0.25, c, a); return; }
  if (d === 2) {
    const ox = Math.cos(rot) * r * 0.7, oy = Math.sin(rot) * r * 0.7;
    seg(ctx, x - ox, y - oy, x + ox, y + oy, c, a * 0.7, w);
    dot(ctx, x - ox, y - oy, r * 0.2, c, a); dot(ctx, x + ox, y + oy, r * 0.2, c, a);
    return;
  }
  polyPath(ctx, x, y, r, d, rot); stroke(ctx, c, a, w);
  for (let i = 0; i < d; i++) { const t = rot + i * TAU / d; dot(ctx, x + Math.cos(t) * r, y + Math.sin(t) * r, r * 0.14, c, a); }
}

// wireframe Bloch sphere
function sphere(ctx, x, y, r, T, c, a = 1, opts = {}) {
  if (a <= 0.004) return;
  glow(ctx, x, y, r * 2.2, c, a * 0.25);
  ring(ctx, x, y, r, c, a * 0.85, 1.6);
  const tilt = opts.tilt == null ? 0.35 : opts.tilt;
  for (let i = -2; i <= 2; i++) {     // latitudes
    const lat = i * 0.5, ry = r * Math.cos(lat), cy = y - r * Math.sin(lat) * Math.cos(tilt);
    ctx.beginPath(); ctx.ellipse(x, cy, ry, ry * Math.sin(tilt), 0, 0, TAU); stroke(ctx, c, a * 0.28, 1);
  }
  for (let i = 0; i < 4; i++) {        // longitudes
    const ph = T * 0.5 + i * Math.PI / 4, rx = Math.abs(r * Math.cos(ph));
    ctx.beginPath(); ctx.ellipse(x, y, rx, r, 0, 0, TAU); stroke(ctx, c, a * (0.15 + 0.25 * Math.abs(Math.sin(ph))), 1);
  }
  if (opts.poles !== false) {
    dot(ctx, x, y - r, r * 0.07, c, a); dot(ctx, x, y + r, r * 0.07, c, a);
  }
}

// DNA-like double helix along x
function helix(ctx, x, y, len, amp, T, a, c1, c2, opts = {}) {
  if (a <= 0.004) return;
  const n = opts.n || 60, k = opts.k || 3, rungs = opts.rungs || 18;
  for (let s = 0; s < 2; s++) {
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const ph0 = t0 * k * TAU + T * 1.4 + s * Math.PI, ph1 = t1 * k * TAU + T * 1.4 + s * Math.PI;
      const z = Math.cos(ph0);
      ctx.beginPath();
      ctx.moveTo(x - len / 2 + len * t0, y + amp * Math.sin(ph0));
      ctx.lineTo(x - len / 2 + len * t1, y + amp * Math.sin(ph1));
      stroke(ctx, s ? c2 : c1, a * (0.35 + 0.65 * (z * 0.5 + 0.5)), (opts.w || 2.4) * (0.6 + 0.4 * (z * 0.5 + 0.5)));
    }
  }
  for (let i = 0; i < rungs; i++) {
    const t = (i + 0.5) / rungs, ph = t * k * TAU + T * 1.4;
    const px = x - len / 2 + len * t;
    seg(ctx, px, y + amp * Math.sin(ph), px, y + amp * Math.sin(ph + Math.PI), i % 2 ? c1 : c2, a * 0.35 * Math.abs(Math.cos(ph)), 1.4);
  }
}

// a curved arrow along a circle
function arcArrow(ctx, x, y, r, a0, a1, c, a = 1, w = 3, head = 14) {
  if (a <= 0.004) return;
  ring(ctx, x, y, r, c, a, w, Math.min(a0, a1), Math.max(a0, a1));
  const dir = a1 > a0 ? 1 : -1;
  arrowHead(ctx, x + Math.cos(a1) * r, y + Math.sin(a1) * r, a1 + dir * Math.PI / 2, head, c, a);
}

// small caps label with rule
function label(ctx, s, x, y, o = {}) {
  txt(ctx, s.toUpperCase(), x, y, Object.assign({ f: FONT.disp, w: 600, size: 22, ls: 5, c: COL.gold }, o));
}
