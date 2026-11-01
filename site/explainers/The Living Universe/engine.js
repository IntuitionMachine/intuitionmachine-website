/* Infinite-canvas film engine: world layout, smooth zoom-pan camera, deep-field stars,
   galaxy, station LOD, overlays, transport and free exploration. */
'use strict';
(function () {
const TL = TIMELINE;
const LEAD = 3.2;
const params = new URLSearchParams(location.search);
const RENDER = params.has('render');

/* ---------------- world layout ---------------- */
const ST = {};                 // id -> station {x,y,a,size,s}
const spiral = ['hurricane', 'principles', 'axiom', 'homeostasis', 'horizon', 'wash', 'ribosome', 'closure', 'metabolism', 'predictions', 'finale'];
const HUE = { hurricane: COL.blue, principles: COL.gold, axiom: COL.cyan, alphabet: COL.magenta, homeostasis: COL.amber, horizon: COL.violet, wash: COL.white, hub: COL.gold, ribosome: COL.teal, closure: COL.gold, metabolism: COL.blue, predictions: COL.gold, finale: COL.teal };
ST.title = { x: 0, y: 0, a: 0, size: 9000 };
spiral.forEach((id, i) => {
  const th = 0.55 + i * 0.78, r = 4300 + i * 640;
  ST[id] = { x: Math.cos(th) * r, y: Math.sin(th) * r, a: th * 0.3 - 0.2, size: 2000 };
});
function nest(id, parent, local, div) {
  const p = ST[parent], s = p.size / 1920, c = Math.cos(p.a), n = Math.sin(p.a);
  ST[id] = { x: p.x + (local[0] * c - local[1] * n) * s, y: p.y + (local[0] * n + local[1] * c) * s, a: p.a, size: p.size / div, parent };
}
nest('alphabet', 'axiom', SCENES.axiom.NEST, 16);
nest('hub', 'wash', SCENES.wash.NEST, 18);
for (const k in ST) ST[k].s = ST[k].size / 1920;

// draw order: big first, nested after their parents
const ORDER = ['title', ...spiral.slice(0, 3), 'alphabet', ...spiral.slice(3, 6), 'hub', ...spiral.slice(6)];
const SC = {};                 // id -> timeline scene
TL.scenes.forEach(s => SC[s.id] = s);
Object.values(SCENES).forEach(s => s.init && s.init());

/* ---------------- title station ---------------- */
SCENES.title = {
  draw(ctx, S) {
    const t = S.lt;
    const k1 = ss(3.2, 6.2, t), k2 = ss(5.6, 7.6, t), k3 = ss(7.2, 9.2, t);
    txt(ctx, 'THE LIVING UNIVERSE', 0, -60, { size: 118, w: 300, ls: 22 * lerp(1.7, 1, eout(k1)), c: COL.white, a: k1, glow: COL.amber, blur: 30 });
    seg(ctx, -520 * k2, 40, 520 * k2, 40, COL.gold, 0.7 * k2, 1.5);
    txt(ctx, 'how the cosmos reads itself into being', 0, 100, { f: FONT.body, it: true, w: 300, size: 46, c: COL.gold, a: k2 });
    txt(ctx, 'A THEORY BY CARLOS E. PEREZ', 0, 200, { size: 34, w: 600, ls: 12, c: COL.white, a: 0.85 * k3 });
  },
};
const TITLE_SC = { id: 'title', start: 0, end: TL.title, lines: [] };

/* ---------------- state for a scene at a film time ---------------- */
function makeS(sc, t, T) {
  const len = sc.end - sc.start, lt = clamp(t - sc.start, 0, len), now = sc.start + lt;
  return {
    lt, T, sc,
    at(i) { const L = sc.lines[i]; return L ? now - L.t : -1e9; },
    k(i, d = 1.2, off = 0) { return eout((this.at(i) - off) / d); },
    line(i) { return sc.lines[i]; },
    lite: false,
  };
}

/* ---------------- camera ---------------- */
let W = 1, H = 1, DPR = 1, quality = 1;
function fitW(st) {
  const aspect = W / H;
  return aspect > 16 / 9 ? st.s * 1080 * aspect : st.s * 1920;
}
function stationCam(id, t, T) {
  const st = ST[id], sc = id === 'title' ? TITLE_SC : SC[id];
  const S = makeS(sc, t, T);
  const c = Object.assign({ x: 0, y: 0, z: 1 }, SCENES[id].cam && SCENES[id].cam(S));
  const len = sc.end - sc.start;
  const drift = 1 + 0.035 * clamp(S.lt / len);
  const cs = Math.cos(st.a), sn = Math.sin(st.a);
  if (id !== 'title') { c.y = (c.y || 0) + 55; c.z = (c.z || 1) * 0.93; }
  return {
    x: st.x + (c.x * cs - c.y * sn) * st.s,
    y: st.y + (c.x * sn + c.y * cs) * st.s,
    w: fitW(st) / (c.z * drift),
    a: st.a + 0.012 * Math.sin(S.lt * 0.15),
  };
}
// van Wijk & Nuij smooth zoom-pan
function zoomPath(p0, p1) {
  const rho = 1.42, r2 = rho * rho, r4 = r2 * r2;
  const dx = p1.x - p0.x, dy = p1.y - p0.y, d2 = dx * dx + dy * dy, w0 = p0.w, w1 = p1.w;
  if (d2 < 1e-6) { const S = Math.log(w1 / w0) / rho; return u => ({ x: p0.x + u * dx, y: p0.y + u * dy, w: w0 * Math.exp(rho * u * S) }); }
  const d1 = Math.sqrt(d2);
  const b0 = (w1 * w1 - w0 * w0 + r4 * d2) / (2 * w0 * r2 * d1), b1 = (w1 * w1 - w0 * w0 - r4 * d2) / (2 * w1 * r2 * d1);
  const q0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), q1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (q1 - q0) / rho;
  return u => {
    const s = u * S, ch = Math.cosh(q0);
    const uu = w0 / (r2 * d1) * (ch * Math.tanh(rho * s + q0) - Math.sinh(q0));
    return { x: p0.x + uu * dx, y: p0.y + uu * dy, w: w0 * ch / Math.cosh(rho * s + q0) };
  };
}
function angLerp(a, b, u) { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + d * u; }
function flight(c0, c1, u, roll = 0) {
  const p = zoomPath(c0, c1)(eio(u));
  p.a = angLerp(c0.a, c1.a, eio(u)) + roll * Math.sin(Math.PI * u);
  return p;
}
const OVERVIEW = () => { const w = 36000 * Math.max(1, (16 / 9) / (W / H)); return { x: 600 + w * 0.24, y: 900, w, a: 0.1 }; };
function scriptedCam(t, T) {
  if (t < TL.title) {
    const far = { x: -90000, y: 52000, w: 520000, a: -0.6 };
    const tc = stationCam('title', t, T);
    return flight(far, tc, clamp(t / 9.2));
  }
  if (t >= TL.creditsStart) {
    const fin = TL.scenes[TL.scenes.length - 1];
    const c0 = stationCam(fin.id, fin.end, T);
    const lt = t - TL.creditsStart;
    const ov = OVERVIEW();
    if (lt < 9) return flight(c0, ov, lt / 9, 0.15);
    const e = lt - 9;
    return { x: ov.x, y: ov.y, w: ov.w * (1 + e * 0.012), a: ov.a + e * 0.006 };
  }
  for (let i = 0; i < TL.scenes.length; i++) {
    const sc = TL.scenes[i];
    if (t < sc.end || i === TL.scenes.length - 1) {
      const lt = t - sc.start;
      if (lt < LEAD) {
        const prevId = i ? TL.scenes[i - 1].id : 'title', prevT = i ? TL.scenes[i - 1].end : TL.title;
        const c0 = stationCam(prevId, prevT, T), c1 = stationCam(sc.id, sc.start + LEAD, T);
        const nested = ST[sc.id].parent === prevId || ST[prevId].parent === sc.id;
        return flight(c0, c1, lt / LEAD, nested ? 0.35 : 0.08);
      }
      return stationCam(sc.id, t, T);
    }
  }
}

/* ---------------- canvas & static textures ---------------- */
const cv = document.getElementById('film'), ctx = cv.getContext('2d');
let neb = null, grain = null;
function buildTextures() {
  // nebula: value-noise fBm, coloured
  const w = 320, h = 200; neb = document.createElement('canvas'); neb.width = w; neb.height = h;
  const g = neb.getContext('2d'), img = g.createImageData(w, h);
  const r = mulberry(42), G = 64, grid = Array.from({ length: (G + 1) * (G + 1) * 2 }, () => r());
  const vn = (x, y, o) => { const xi = Math.floor(x) & (G - 1), yi = Math.floor(y) & (G - 1), xf = x - Math.floor(x), yf = y - Math.floor(y); const s = t => t * t * (3 - 2 * t); const idx = (a, b) => grid[o + (a & (G - 1)) * G + (b & (G - 1))]; const a = idx(xi, yi), b = idx(xi + 1, yi), c = idx(xi, yi + 1), d = idx(xi + 1, yi + 1); return lerp(lerp(a, b, s(xf)), lerp(c, d, s(xf)), s(yf)); };
  const fbm = (x, y, o) => { let v = 0, amp = 0.5, f = 1; for (let i = 0; i < 5; i++) { v += amp * vn(x * f, y * f, o); f *= 2.03; amp *= 0.5; } return v; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w * 4, v = y / h * 2.5;
    const n1 = fbm(u, v, 0), n2 = fbm(u + 7.3, v + 2.1, 0), warp = fbm(u + n1 * 1.5, v + n2 * 1.5, 0);
    const ex = Math.min(x, w - 1 - x) / (w * 0.22), ey = Math.min(y, h - 1 - y) / (h * 0.22);
    const dens = Math.pow(clamp((warp - 0.38) * 2.2), 2.2) * ss(0, 1, ex) * ss(0, 1, ey);
    const hue = fbm(u * 0.6 + 3, v * 0.6, 0);
    const c = hue < 0.45 ? [40, 70, 160] : hue < 0.55 ? [120, 50, 140] : [190, 110, 60];
    const i = (y * w + x) * 4;
    img.data[i] = c[0] * dens; img.data[i + 1] = c[1] * dens; img.data[i + 2] = c[2] * dens; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grain = document.createElement('canvas'); grain.width = grain.height = 192;
  const gg = grain.getContext('2d'), gi = gg.createImageData(192, 192);
  for (let i = 0; i < gi.data.length; i += 4) { const v = Math.random() * 255; gi.data[i] = gi.data[i + 1] = gi.data[i + 2] = v; gi.data[i + 3] = 22; }
  gg.putImageData(gi, 0, 0);
}
// galaxy along the same spiral the stations sit on
const GAL = { pts: [[], [], [], []], neb: [] };
(function buildGalaxy() {
  const r = mulberry(7), cols = 4;
  const gauss = () => (r() + r() + r() - 1.5) / 1.5;
  for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 4200; i++) {
    const u = -5 + r() * 21, th = 0.55 + u * 0.78 + arm * Math.PI, rad = Math.max(300, 4300 + u * 640);
    const spread = rad * 0.13 * (0.4 + r());
    const x = Math.cos(th) * rad + gauss() * spread, y = Math.sin(th) * rad + gauss() * spread;
    const b = r(); const bucket = b < 0.08 ? 3 : b < 0.6 ? 0 : b < 0.85 ? 1 : 2;
    GAL.pts[bucket].push(x, y, 0.5 + r());
  }
  for (let i = 0; i < 2600; i++) {            // bulge
    const a = r() * TAU, rr = Math.abs(gauss()) * 2600;
    GAL.pts[r() < 0.7 ? 2 : 0].push(Math.cos(a) * rr, Math.sin(a) * rr * 0.85, 0.6 + r());
  }
  for (let i = 0; i < 140; i++) {
    const arm = i % 2, u = -3 + r() * 19, th = 0.55 + u * 0.78 + arm * Math.PI + (r() - 0.5) * 0.25, rad = Math.max(500, 4300 + u * 640);
    GAL.neb.push({ x: Math.cos(th) * rad, y: Math.sin(th) * rad, r: 500 + r() * 1700, c: [COL.magenta, COL.blue, COL.violet, COL.amber][Math.floor(r() * 4)], a: 0.05 + r() * 0.08 });
  }
})();
const GALCOL = [[200, 220, 255], [255, 236, 210], [255, 200, 140], [255, 120, 170]];

/* ---------------- render ---------------- */
let camPrev = null;
function worldTransform(cam) {
  const k = W / cam.w;
  ctx.setTransform(DPR * quality, 0, 0, DPR * quality, 0, 0);
  ctx.translate(W / 2, H / 2); ctx.scale(k, k); ctx.rotate(-cam.a); ctx.translate(-cam.x, -cam.y);
  return k;
}
function toScreen(cam, x, y) {
  const k = W / cam.w, c = Math.cos(-cam.a), s = Math.sin(-cam.a), dx = x - cam.x, dy = y - cam.y;
  return [W / 2 + (dx * c - dy * s) * k, H / 2 + (dx * s + dy * c) * k];
}
function drawStars(cam, prev) {
  const base = 700, L = Math.log(cam.w / base) / Math.log(4);
  const R = Math.hypot(W, H) / 2 * cam.w / W;          // world radius of view
  ctx.setTransform(DPR * quality, 0, 0, DPR * quality, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  for (let lv = Math.floor(L) - 2; lv <= Math.floor(L) + 1; lv++) {
    const TS = base * Math.pow(4, lv), f = TS / cam.w;
    const wgt = ss(1 / 22, 1 / 7, f) * (1 - ss(0.5, 1.2, f));
    if (wgt < 0.02) continue;
    const x0 = Math.floor((cam.x - R) / TS), x1 = Math.floor((cam.x + R) / TS), y0 = Math.floor((cam.y - R) / TS), y1 = Math.floor((cam.y + R) / TS);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 900) continue;
    const sz = lerp(0.7, 1.5, ss(1 / 10, 0.6, f));
    for (let tx = x0; tx <= x1; tx++) for (let ty = y0; ty <= y1; ty++) {
      for (let i = 0; i < 9; i++) {
        const hx = hash2(tx * 9 + i, ty, lv + 50), hy = hash2(tx, ty * 9 + i, lv + 90), hm = hash2(tx + i, ty - i, lv + 13);
        const wx = (tx + hx) * TS, wy = (ty + hy) * TS;
        const [sx, sy] = toScreen(cam, wx, wy);
        if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
        const m = hm * hm * hm, a = wgt * (0.25 + 0.75 * m);
        const px = (0.5 + 2.1 * m) * sz;
        const tint = hm > 0.93 ? '255,210,170' : hm > 0.86 ? '170,200,255' : '235,240,255';
        if (prev) {
          const [qx, qy] = toScreen(prev, wx, wy);
          const d = Math.hypot(sx - qx, sy - qy);
          if (d > 2.5) { ctx.strokeStyle = `rgba(${tint},${a * 0.7})`; ctx.lineWidth = px * 0.9; ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(sx, sy); ctx.stroke(); continue; }
        }
        ctx.fillStyle = `rgba(${tint},${a})`; ctx.fillRect(sx - px / 2, sy - px / 2, px, px);
        if (m > 0.7) glow(ctx, sx, sy, px * 7, [200, 215, 255], a * 0.35);
      }
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}
function drawGalaxy(cam) {
  const k = worldTransform(cam);
  const zoomOut = ss(2500, 22000, cam.w);
  const ga = lerp(0.28, 1, ss(2200, 14000, cam.w));
  // core + nebulae
  glow(ctx, 0, 0, 5200, COL.amber, 0.55 * ga);
  glow(ctx, 0, 0, 1600, COL.white, 0.45 * ga);
  GAL.neb.forEach(n => glow(ctx, n.x, n.y, n.r, n.c, n.a * lerp(0.5, 1.2, zoomOut)));
  const px = Math.max(0.9, 1.6 * lerp(1, 1.3, zoomOut)) / k;
  ctx.globalCompositeOperation = 'lighter';
  GAL.pts.forEach((arr, b) => {
    ctx.fillStyle = rgba(GALCOL[b], (b === 3 ? 0.8 : 0.6) * ga * clamp(12000 / cam.w * W / 520, 0.12, 1));
    ctx.beginPath();
    for (let i = 0; i < arr.length; i += 3) { const s = px * arr[i + 2]; ctx.rect(arr[i] - s / 2, arr[i + 1] - s / 2, s, s); }
    ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';
}
// the golden thread through every station, closing into a loop
let LOOP = null;
function buildLoop() {
  const ids = ['title', ...TL.scenes.map(s => s.id)];
  const P = ids.map(id => [ST[id].x, ST[id].y]);
  const pts = [];
  const n = P.length;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    for (let j = 0; j < 24; j++) {
      const t = j / 24, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  LOOP = { pts, per: 24 };
}
function drawLoop(cam, t, T) {
  const k = worldTransform(cam);
  const zo = ss(3500, 26000, cam.w);
  const a = 0.05 + 0.5 * zo;
  if (a < 0.01) return;
  const n = LOOP.pts.length;
  let prog = 0;
  if (t >= TL.title) { const i = TL.scenes.findIndex(s => t < s.end); prog = (i < 0 ? TL.scenes.length : i) + 1; }
  if (t >= TL.creditsStart) prog = TL.scenes.length + 2;
  ctx.lineWidth = 1.3 / k;
  ctx.beginPath(); LOOP.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
  ctx.strokeStyle = rgba(COL.gold, a * 0.45); ctx.stroke();
  const lim = Math.min(n, prog * LOOP.per);
  if (lim > 1) {
    ctx.beginPath(); for (let i = 0; i < lim; i++) i ? ctx.lineTo(LOOP.pts[i][0], LOOP.pts[i][1]) : ctx.moveTo(LOOP.pts[0][0], LOOP.pts[0][1]);
    ctx.lineWidth = 2.4 / k; ctx.strokeStyle = rgba(COL.gold, a); ctx.stroke();
  }
  for (let p = 0; p < 16; p++) {
    const u = ((T * 0.012 + p / 16) % 1) * n, i = Math.floor(u), q = LOOP.pts[i];
    glow(ctx, q[0], q[1], 14 / k, COL.gold, a * 1.4);
  }
}
function drawStations(cam, t, T) {
  for (const id of ORDER) {
    const st = ST[id];
    const ratio = st.size / cam.w;
    const [sx, sy] = toScreen(cam, st.x, st.y);
    const rad = ratio * W * 0.85;
    if (sx + rad < -50 || sx - rad > W + 50 || sy + rad < -50 || sy - rad > H + 50) continue;
    const vis = ss(0.018, 0.07, ratio) * (1 - ss(3.2, 8, ratio));
    // beacon seen from afar
    const beacon = 1 - ss(0.04, 0.5, ratio);
    if (id !== 'title' && beacon > 0.01) {
      worldTransform(cam);
      glow(ctx, st.x, st.y, st.size * 0.75, HUE[id], 0.4 * beacon);
      glow(ctx, st.x, st.y, Math.max(st.size * 0.05, 5 * cam.w / W), COL.white, 0.6 * beacon);
    }
    if (vis < 0.01) continue;
    const sc = id === 'title' ? TITLE_SC : SC[id];
    const S = makeS(sc, t, T); S.lite = ratio < 0.2;
    worldTransform(cam);
    ctx.translate(st.x, st.y); ctx.rotate(st.a); ctx.scale(st.s, st.s);
    ctx.globalAlpha = vis;
    try { SCENES[id].draw(ctx, S); } catch (e) { if (!drawStations.err) { console.error(id, e); drawStations.err = 1; } }
    ctx.globalAlpha = 1;
  }
}
function drawBackground(cam) {
  ctx.setTransform(DPR * quality, 0, 0, DPR * quality, 0, 0);
  ctx.fillStyle = '#020309'; ctx.fillRect(0, 0, W, H);
  const lw = Math.log(cam.w);
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate(-cam.a * 0.5);
  const sc = 1.25 + 0.1 * Math.sin(lw * 0.6);
  const ox = Math.sin(lw * 0.45) * W * 0.08 - cam.x / cam.w * W * 0.012, oy = Math.cos(lw * 0.37) * H * 0.08 - cam.y / cam.w * H * 0.012;
  ctx.globalAlpha = 0.75; ctx.globalCompositeOperation = 'lighter';
  const D = Math.hypot(W, H) * sc * 1.15;
  ctx.drawImage(neb, -D / 2 + ox, -D * 0.3125 + oy, D, D * 0.625);
  ctx.restore();
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function drawPost() {
  ctx.setTransform(DPR * quality, 0, 0, DPR * quality, 0, 0);
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = ctx.createPattern(grain, 'repeat');
  const ox = Math.random() * 192, oy = Math.random() * 192;
  ctx.translate(-ox, -oy); ctx.fillRect(0, 0, W + 192, H + 192);
  ctx.restore();
}

/* ---------------- transport ---------------- */
const $ = id => document.getElementById(id);
let filmT = RENDER ? +(params.get('t') || 0) : 9.4, playing = false, started = false, wall0 = 0, idleT = 0;
let free = null, returning = null, captionsOn = true, lastFrame = performance.now();
const audio = window.FilmAudio;
let audioOK = false;

function T_ambient() { return RENDER ? filmT : filmT + idleT; }
function play() {
  if (filmT >= TL.duration - 0.2) filmT = 0;
  playing = true; started = true;
  if (free) { returning = { from: free, t0: performance.now() }; free = null; }
  document.body.classList.add('playing'); document.body.classList.remove('exploring');
  $('playBtn').setAttribute('aria-label', 'Pause'); $('playBtn').dataset.state = 'pause';
  if (audioOK) { audio.resume().then(() => audio.play(filmT)); }
  wall0 = performance.now() - filmT * 1000;
  poke();
}
function pause() {
  playing = false;
  if (audioOK) audio.pause();
  document.body.classList.remove('playing');
  $('playBtn').setAttribute('aria-label', 'Play'); $('playBtn').dataset.state = 'play';
  poke();
}
function seek(t) {
  filmT = clamp(t, 0, TL.duration - 0.05);
  free = null; returning = null; document.body.classList.remove('exploring');
  if (playing) { if (audioOK) audio.play(filmT); wall0 = performance.now() - filmT * 1000; }
}
window.FILM = { seek, play, pause, get t() { return filmT; } };

/* ---------------- overlays ---------------- */
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];
let shownScene = -2, shownLine = null;
function updateOverlays(t) {
  // chapter card
  let si = TL.scenes.findIndex(s => t >= s.start && t < s.end);
  if (t >= TL.creditsStart) si = -1;
  const card = $('chapter');
  if (si !== shownScene) {
    shownScene = si;
    if (si >= 0) { $('chNum').textContent = ROMAN[si]; $('chTitle').textContent = TL.scenes[si].title; }
  }
  if (si >= 0) { const lt = t - TL.scenes[si].start; card.style.opacity = (ss(0.4, 1.4, lt) * (1 - ss(6.5, 8, lt))).toFixed(3); card.style.setProperty('--rule', ss(0.6, 2.2, lt).toFixed(3)); }
  else card.style.opacity = 0;
  // captions
  let cur = null;
  if (si >= 0) for (const L of TL.scenes[si].lines) if (t >= L.t - 0.1 && t < L.t + L.d + 0.5) cur = L;
  const cap = $('caption');
  if (cur !== shownLine) {
    shownLine = cur;
    cap.classList.remove('on');
    if (cur) { cap.textContent = cur.text; void cap.offsetWidth; cap.classList.add('on'); }
  }
  cap.style.display = captionsOn ? '' : 'none';
  // credits
  const ck = t - TL.creditsStart;
  $('credits').style.opacity = (ss(3.5, 6, ck) * (1 - ss(TL.duration - TL.creditsStart - 1.2, TL.duration - TL.creditsStart, ck))).toFixed(3);
  // transport
  $('time').textContent = fmt(t) + ' / ' + fmt(TL.duration);
  $('fill').style.width = (t / TL.duration * 100).toFixed(2) + '%';
  return cur;
}
const fmt = s => { s = Math.max(0, s); return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };

let hideTimer = 0;
function poke() { document.body.classList.add('ui'); clearTimeout(hideTimer); if (playing) hideTimer = setTimeout(() => document.body.classList.remove('ui'), 2600); }

/* ---------------- main loop ---------------- */
let ftAvg = 16;
function frame(now) {
  const dt = Math.min(0.1, (now - lastFrame) / 1000); lastFrame = now;
  ftAvg = ftAvg * 0.95 + dt * 1000 * 0.05;
  if (!RENDER && started) {
    if (ftAvg > 30 && quality > 0.6) { quality *= 0.9; resize(); ftAvg = 20; }
    else if (ftAvg < 14 && quality < 1) { quality = Math.min(1, quality * 1.05); resize(); ftAvg = 16; }
  }
  if (playing) {
    const at = audioOK ? audio.now() : null;
    filmT = at != null ? at : (now - wall0) / 1000;
    if (filmT >= TL.duration) { filmT = TL.duration - 0.01; pause(); document.body.classList.add('ended'); }
  } else idleT += dt;
  const T = T_ambient();
  let cam = scriptedCam(filmT, T);
  if (free) cam = free;
  else if (returning) {
    const u = (now - returning.t0) / 1400;
    if (u >= 1) returning = null; else { cam = flight(returning.from, cam, u); }
  }
  const prevCam = camPrev && playing && !free ? scriptedCam(Math.max(0, filmT - 1 / 30), T) : null;
  drawBackground(cam);
  drawStars(cam, prevCam);
  drawGalaxy(cam);
  drawLoop(cam, filmT, T);
  drawStations(cam, filmT, T);
  drawPost();
  camPrev = cam; window._cam = cam;
  const cur = updateOverlays(filmT);
  if (audioOK) audio.update(filmT, !!cur && filmT >= cur.t - 0.3 && filmT < cur.t + cur.d + 0.2);
  if (!RENDER) requestAnimationFrame(frame);
}

function resize() {
  W = innerWidth; H = innerHeight; DPR = Math.min(devicePixelRatio || 1, 2);
  if (W * H * DPR * DPR > 4.2e6) DPR = Math.sqrt(4.2e6 / (W * H));
  cv.width = Math.round(W * DPR * quality); cv.height = Math.round(H * DPR * quality);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  document.documentElement.style.setProperty('--vh', H / 100 + 'px');
}

/* ---------------- interaction: explore the infinite canvas ---------------- */
function currentCam() { return free || window._cam || scriptedCam(filmT, T_ambient()); }
function startExplore() {
  if (!started) return false;
  if (playing) pause();
  if (!free) free = Object.assign({}, currentCam());
  returning = null;
  document.body.classList.add('exploring');
  return true;
}
const pts = new Map();
cv.addEventListener('pointerdown', e => {
  if (!startExplore()) return;
  cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
});
cv.addEventListener('pointermove', e => {
  poke();
  if (!pts.has(e.pointerId) || !free) return;
  const p = pts.get(e.pointerId), k = W / free.w;
  if (pts.size === 1) {
    const dx = (e.clientX - p[0]) / k, dy = (e.clientY - p[1]) / k, c = Math.cos(free.a), s = Math.sin(free.a);
    free.x -= dx * c - dy * s; free.y -= dx * s + dy * c;
  } else {
    const other = [...pts.entries()].find(([id]) => id !== e.pointerId)[1];
    const d0 = Math.hypot(p[0] - other[0], p[1] - other[1]), d1 = Math.hypot(e.clientX - other[0], e.clientY - other[1]);
    if (d0 > 0) zoomAt((e.clientX + other[0]) / 2, (e.clientY + other[1]) / 2, d0 / d1);
  }
  pts.set(e.pointerId, [e.clientX, e.clientY]);
});
const endPtr = e => pts.delete(e.pointerId);
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
function zoomAt(px, py, f) {
  const k = W / free.w, c = Math.cos(free.a), s = Math.sin(free.a);
  const dx = (px - W / 2) / k, dy = (py - H / 2) / k;
  const wx = free.x + dx * c - dy * s, wy = free.y + dx * s + dy * c;
  free.w = clamp(free.w * f, 40, 2e6);
  const k2 = W / free.w, dx2 = (px - W / 2) / k2, dy2 = (py - H / 2) / k2;
  free.x = wx - (dx2 * c - dy2 * s); free.y = wy - (dx2 * s + dy2 * c);
}
cv.addEventListener('wheel', e => { e.preventDefault(); if (!startExplore()) return; zoomAt(e.clientX, e.clientY, Math.exp(e.deltaY * (e.deltaMode ? 0.05 : 0.0016))); }, { passive: false });

$('playBtn').addEventListener('click', () => playing ? pause() : play());
$('ccBtn').addEventListener('click', () => { captionsOn = !captionsOn; $('ccBtn').setAttribute('aria-pressed', captionsOn); });
$('musicVol').addEventListener('input', e => { if (audio) audio.musicVol = +e.target.value; });
$('fsBtn').addEventListener('click', () => { const d = document; if (d.fullscreenElement) d.exitFullscreen && d.exitFullscreen().catch(() => {}); else d.documentElement.requestFullscreen && d.documentElement.requestFullscreen().catch(() => {}); });
$('returnBtn').addEventListener('click', () => play());
const bar = $('bar');
bar.addEventListener('pointerdown', e => {
  const r = bar.getBoundingClientRect(); const go = x => seek(clamp((x - r.left) / r.width) * TL.duration);
  go(e.clientX); bar.setPointerCapture(e.pointerId);
  const mv = ev => go(ev.clientX), up = () => { bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); };
  bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up);
});
// chapter ticks
TL.scenes.forEach((s, i) => {
  const b = document.createElement('button'); b.className = 'tick'; b.style.left = (s.start / TL.duration * 100) + '%';
  b.title = `${ROMAN[i]} · ${s.title}`; b.setAttribute('aria-label', `Chapter ${ROMAN[i]}: ${s.title}`);
  b.addEventListener('pointerdown', e => e.stopPropagation());
  b.addEventListener('click', e => { e.stopPropagation(); seek(s.start); if (!playing) play(); });
  bar.appendChild(b);
});
addEventListener('keydown', e => {
  if (!started) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); begin(); } return; }
  if (e.key === ' ' || e.key === 'k') { e.preventDefault(); playing ? pause() : play(); }
  else if (e.key === 'ArrowRight') { const n = TL.scenes.find(s => s.start > filmT + 0.5); if (n) seek(n.start); }
  else if (e.key === 'ArrowLeft') { const p = [...TL.scenes].reverse().find(s => s.start < filmT - 2); seek(p ? p.start : 0); }
  else if (e.key === 'c') $('ccBtn').click();
  else if (e.key === 'f') $('fsBtn').click();
  poke();
});
addEventListener('pointermove', poke);
addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });

/* ---------------- boot ---------------- */
async function begin() {
  if (started || !$('beginBtn').dataset.ready) return;
  $('intro').classList.add('gone');
  filmT = 0;
  if (audioOK) { try { await audio.resume(); } catch (e) {} }
  play();
}
$('beginBtn').addEventListener('click', begin);

resize(); buildTextures(); buildLoop();
if (RENDER) {
  document.body.classList.add('render');
  const go = () => { started = true; idleT = 0; frame(performance.now()); window.READY = true; };
  document.fonts.ready.then(go);
  window.renderAt = t => { filmT = t; camPrev = null; frame(performance.now()); };
} else {
  requestAnimationFrame(frame);
  const prog = $('loadProg');
  audio.init(p => { prog.style.width = (p * 80) + '%'; }).then(() => {
    audioOK = true; prog.style.width = '100%';
  }).catch(err => { console.warn('audio unavailable', err); $('loadNote').textContent = 'Sound could not load here; the film will play silently with captions.'; })
    .finally(() => { const b = $('beginBtn'); b.dataset.ready = '1'; b.disabled = false; b.querySelector('span').textContent = 'Begin the journey'; });
}
})();
