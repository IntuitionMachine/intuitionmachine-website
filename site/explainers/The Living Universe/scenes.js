/* The thirteen stations of the film. Each draws in a 1920x1080 local frame centred on 0,0.
   S.lt = seconds into the scene, S.at(i) = seconds since line i began, S.k(i,d,off) eased reveal. */
'use strict';

// sound cues: [line index, offset seconds, sfx type, params]
const SCENE_SFX = {
  hurricane: [[3, 2.6, 'tick', { f: 660, vel: 0.12 }], [4, 0.6, 'shimmer', { vel: 0.25 }], [6, 0.3, 'riser', { dur: 2.2, vel: 0.12 }]],
  principles: [[1, 0.2, 'bell', { f: 392, vel: 0.12 }], [2, 0.2, 'bell', { f: 523, vel: 0.12 }], [3, 0.2, 'bell', { f: 659, vel: 0.12 }], [4, 0.5, 'shimmer', { vel: 0.35 }], [4, 0.5, 'boom', { vel: 0.25 }]],
  axiom: [[1, 0.1, 'shimmer', { vel: 0.18 }], [3, 2.0, 'tick', { f: 990, vel: 0.2 }], [4, 1.2, 'glitch', { vel: 0.2 }], [4, 2.4, 'glitch', { vel: 0.16 }], [5, 1.4, 'bell', { f: 587, vel: 0.15 }]],
  alphabet: [[1, 0.3, 'tick', { f: 880, vel: 0.12 }], [2, 0.3, 'tick', { f: 1320, vel: 0.12 }], [3, 0.6, 'shimmer', { vel: 0.18 }],
    ...Array.from({ length: 12 }, (_, s) => [4, 0.6 + s * 0.55, 'tick', { f: 1100 + s * 55, vel: 0.08 }]),
    [5, 0.2, 'bell', { f: 293.66, vel: 0.22 }], [5, 0.25, 'shimmer', { vel: 0.3 }]],
  homeostasis: [[0, 0.2, 'riser', { dur: 2.5, vel: 0.1 }], [2, 1.5, 'glitch', { vel: 0.14 }], [3, 1.0, 'heartbeat', { vel: 0.35 }], [5, 0.8, 'whoosh', { dur: 3, vel: 0.15 }], [6, 0.5, 'shimmer', { vel: 0.3 }], [7, 1.5, 'boom', { vel: 0.25 }]],
  horizon: [[1, 0.6, 'shimmer', { vel: 0.2 }], [2, 0.5, 'bell', { f: 523.25, vel: 0.12 }], [3, 0.8, 'boom', { vel: 0.2 }], [5, 0.8, 'boom', { vel: 0.45 }], [5, 0.8, 'glitch', { vel: 0.18 }]],
  wash: [[1, 1.5, 'tick', { f: 880, vel: 0.15 }], [2, 4.3, 'wash', { vel: 0.5 }], [3, 5.2, 'tick', { f: 1500, vel: 0.2 }], [4, 0.4, 'shimmer', { vel: 0.2 }], [5, 0.5, 'boom', { vel: 0.3 }]],
  hub: [[0, 0.0, 'riser', { dur: 2.4, vel: 0.16 }], [1, 1.2, 'boom', { vel: 0.5 }], [1, 1.25, 'shimmer', { vel: 0.35 }], [3, 7.6, 'bell', { f: 440, vel: 0.2 }], [4, 1.0, 'shimmer', { vel: 0.3 }]],
  ribosome: [[2, 0.5, 'bell', { f: 659.25, vel: 0.12 }], [3, 0.5, 'whoosh', { dur: 2.5, vel: 0.12 }],
    [4, 3.0, 'tick', { f: 880, vel: 0.15 }], [4, 4.0, 'tick', { f: 990, vel: 0.15 }], [4, 5.0, 'tick', { f: 1100, vel: 0.15 }], [4, 6.4, 'glitch', { vel: 0.2 }]],
  closure: [[0, 0.4, 'shimmer', { vel: 0.2 }], [3, 0.0, 'bell', { f: 349.2, vel: 0.14 }], [3, 1.8, 'bell', { f: 440, vel: 0.14 }], [3, 3.6, 'bell', { f: 523.3, vel: 0.14 }], [3, 5.4, 'bell', { f: 698.5, vel: 0.14 }],
    [4, 0.5, 'heartbeat', { vel: 0.5 }], [4, 1.5, 'heartbeat', { vel: 0.45 }], [4, 2.5, 'heartbeat', { vel: 0.4 }], [4, 3.5, 'heartbeat', { vel: 0.35 }], [4, 4.5, 'heartbeat', { vel: 0.3 }]],
  metabolism: [...Array.from({ length: 14 }, (_, i) => [2, 0.8 + i * 0.5, 'tick', { f: 1500 + (i % 3) * 200, vel: 0.06, pan: (i % 3 - 1) * 0.5 }]), [3, 0.8, 'shimmer', { vel: 0.25 }], [4, 0.6, 'whoosh', { dur: 4, vel: 0.12 }]],
  predictions: [[1, 0.5, 'bell', { f: 523.25, vel: 0.14 }], [2, 0.4, 'wash', { vel: 0.3 }], [3, 0.4, 'bell', { f: 587.3, vel: 0.14 }], [4, 0.4, 'bell', { f: 659.3, vel: 0.14 }]],
  finale: [[0, 0.3, 'boom', { vel: 0.3 }], [2, 0.5, 'shimmer', { vel: 0.35 }], [3, 0.5, 'riser', { dur: 5, vel: 0.08 }]],
};

const SCENES = {};

/* ---------- shared figures ---------- */
function makeVortex(n, R, seed) {
  const r = mulberry(seed), P = [];
  for (let i = 0; i < n; i++) {
    const u = Math.pow(r(), 0.75), rr = R * (0.13 + 0.87 * u);
    const arm = Math.floor(r() * 3), onArm = r() < 0.72;
    const th = arm * TAU / 3 + 2.6 * Math.log(rr / R + 0.02) + (onArm ? (r() - 0.5) * 0.55 : r() * TAU);
    P.push({ r: rr, th, w: 0.06 * Math.pow(R / rr, 0.5), l: 0.06 + r() * 0.16 * (1 - u * 0.5), b: onArm ? 0.55 + r() * 0.45 : r() * 0.35 });
  }
  return P;
}
function drawVortex(ctx, x, y, R, T, a, P, lite) {
  if (a <= 0.01) return;
  glow(ctx, x, y, R * 1.7, [70, 110, 190], a * 0.35);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const step = lite ? 4 : 1, spin = T * 0.22;
  for (let i = 0; i < P.length; i += step) {
    const p = P[i];
    const th = p.th - spin - T * p.w;
    const al = a * (0.08 + 0.6 * p.b * p.b);
    if (al < 0.03) continue;
    const r1 = p.r, r0 = p.r * 1.04;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(th) * r0, y + Math.sin(th) * r0);
    ctx.quadraticCurveTo(x + Math.cos(th + p.l * 0.5) * (r0 + r1) * 0.51, y + Math.sin(th + p.l * 0.5) * (r0 + r1) * 0.51, x + Math.cos(th + p.l) * r1, y + Math.sin(th + p.l) * r1);
    ctx.strokeStyle = rgba(p.b > 0.92 ? [255, 236, 210] : [190, 215, 255], al); ctx.lineWidth = 1 + p.b * 2.6; ctx.stroke();
  }
  ctx.restore();
  disc(ctx, x, y, R * 0.1, [2, 4, 12], a * 0.95);
  ring(ctx, x, y, R * 0.12, [225, 238, 255], a * 0.6, 3);
  glow(ctx, x, y, R * 0.28, [200, 220, 255], a * 0.35);
}

function makeCell(seed) {
  const r = mulberry(seed);
  const ribo = Array.from({ length: 9 }, () => ({ a: r() * TAU, d: 0.5 + r() * 0.3, s: 0.2 + r() * 0.3 }));
  const prot = Array.from({ length: 5 }, () => ({ a: r() * TAU, d: 0.55 + r() * 0.3, k: Array.from({ length: 12 }, () => r() * 2 - 1) }));
  return { ribo, prot };
}
function drawCell(ctx, x, y, R, T, a, C, o = {}) {
  if (a <= 0.01) return;
  const mem = (th) => R * (1 + 0.03 * Math.sin(5 * th + T * 0.8) + 0.02 * Math.sin(9 * th - T * 1.3));
  glow(ctx, x, y, R * 1.7, [40, 160, 150], a * 0.25);
  // cytoplasm
  ctx.beginPath();
  for (let i = 0; i <= 90; i++) { const th = i / 90 * TAU, rr = mem(th); i ? ctx.lineTo(x + Math.cos(th) * rr, y + Math.sin(th) * rr) : ctx.moveTo(x + Math.cos(th) * rr, y + Math.sin(th) * rr); }
  ctx.closePath();
  const gr = ctx.createRadialGradient(x, y, R * 0.2, x, y, R);
  gr.addColorStop(0, `rgba(30,70,80,${0.35 * a})`); gr.addColorStop(1, `rgba(20,80,90,${0.12 * a})`);
  ctx.fillStyle = gr; ctx.fill();
  stroke(ctx, COL.teal, a * 0.85, 3); stroke(ctx, COL.teal, a * 0.18, 12);
  // nucleus with helix
  const nx = x - R * 0.12, ny = y - R * 0.1, nr = R * 0.4;
  disc(ctx, nx, ny, nr, [40, 25, 80], a * 0.5); ring(ctx, nx, ny, nr, COL.violet, a * 0.8, 2.2);
  if (o.nucleus) o.nucleus(nx, ny, nr);
  else {
    ctx.save(); ctx.beginPath(); ctx.arc(nx, ny, nr * 0.95, 0, TAU); ctx.clip();
    helix(ctx, nx, ny, nr * 1.9, nr * 0.32, T, a, COL.gold, COL.magenta, { k: 2.5, rungs: 16, w: 2.2 });
    ctx.restore();
  }
  // ribosomes reading mRNA, proteins folding
  C.ribo.forEach((p, i) => {
    const th = p.a + T * p.s * 0.2, rx = x + Math.cos(th) * R * p.d * 0.95, ry = y + Math.sin(th) * R * p.d * 0.95;
    disc(ctx, rx, ry, R * 0.028, COL.gold, a * 0.9); disc(ctx, rx + R * 0.02, ry - R * 0.018, R * 0.02, COL.gold, a * 0.7);
    glow(ctx, rx, ry, R * 0.08, COL.gold, a * 0.4);
  });
  C.prot.forEach((p, i) => {
    let px = x + Math.cos(p.a) * R * p.d, py = y + Math.sin(p.a) * R * p.d, ang = p.a + T * 0.15;
    ctx.beginPath(); ctx.moveTo(px, py);
    for (let j = 0; j < p.k.length; j++) { ang += p.k[j] * 1.1 + Math.sin(T * 0.7 + i + j) * 0.2; px += Math.cos(ang) * R * 0.035; py += Math.sin(ang) * R * 0.035; ctx.lineTo(px, py); }
    stroke(ctx, COL.cyan, a * 0.55, 2);
  });
  if (o.loop > 0) {   // code -> reader -> code
    const LA = o.noLabels ? 0 : 1;
    const L = o.loop, rr = R * 1.18;
    arcArrow(ctx, x, y, rr, -Math.PI * 0.85, lerp(-Math.PI * 0.85, Math.PI * 0.05, L), COL.gold, a * L, 3, 16);
    arcArrow(ctx, x, y, rr, Math.PI * 0.15, lerp(Math.PI * 0.15, Math.PI * 1.05, L), COL.cyan, a * L, 3, 16);
    txt(ctx, 'CODE', x + Math.cos(-Math.PI * 0.12) * rr * 1.2, y + Math.sin(-Math.PI * 0.12) * rr * 1.2, { size: 22, w: 600, ls: 5, c: COL.gold, a: a * L * LA });
    txt(ctx, 'READER', x + Math.cos(Math.PI * 0.88) * rr * 1.24, y + Math.sin(Math.PI * 0.88) * rr * 1.24, { size: 22, w: 600, ls: 5, c: COL.cyan, a: a * L * LA });
  }
}

/* ===================== 1. Hurricane and cell ===================== */
SCENES.hurricane = {
  init() { this.V = makeVortex(1600, 330, 7); this.C = makeCell(11); },
  cam(S) { const p = eio(S.k(5, 3, 0)); return { x: 0, y: lerp(-10, 300, p), z: lerp(1, 0.94, p) }; },
  draw(ctx, S) {
    const T = S.T;
    const cellOn = lerp(0.28, 1, S.k(4, 2)), hurOn = lerp(1, 0.6, S.k(4, 2));
    drawVortex(ctx, -440, -80, 320, T, hurOn, this.V, S.lite);
    drawCell(ctx, 440, -80, 280, T, cellOn, this.C, { loop: S.k(4, 2.5, 2) });
    label(ctx, 'a hurricane', -440, 285, { a: S.k(0, 2) * hurOn });
    txt(ctx, 'dynamics, without a code', -440, 322, { f: FONT.body, it: true, w: 300, size: 24, c: COL.white, a: 0.8 * S.k(2, 1.5) * hurOn });
    label(ctx, 'a living cell', 440, 285, { a: S.k(4, 1.5), c: COL.teal });
    txt(ctx, 'a code that builds its own reader', 440, 322, { f: FONT.body, it: true, w: 300, size: 24, c: COL.white, a: 0.8 * S.k(4, 1.5, 1.5) });
    // motion / energy / memory chips
    const items = [['motion', 1], ['energy', 1], ['memory', 0]];
    items.forEach(([w, ok], i) => {
      const k = S.k(3, 0.8, i * 0.9 + (i === 2 ? 0.8 : 0)) * hurOn;
      const cx = -620 + i * 180, cy = 380;
      if (ok) check(ctx, cx - 52, cy, 11, COL.teal, k); else cross(ctx, cx - 52, cy, 10, COL.red, k, 3);
      txt(ctx, w, cx - 30, cy, { f: FONT.mono, size: 21, c: ok ? COL.white : COL.red, a: k, align: 'left' });
    });
    // cosmic timeline: life arrives late... or does the loop run all the way back?
    const tk = S.k(5, 2.5, 0.5);
    if (tk > 0) {
      const y = 560, x0 = -760, x1 = 760, xl = lerp(x0, x1, 10 / 13.8);
      const gr = ctx.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, rgba(COL.gold, 0.9)); gr.addColorStop(0.7, rgba(COL.dim, 0.5)); gr.addColorStop(1, rgba(COL.teal, 0.9));
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(lerp(x0, x1, tk), y); ctx.strokeStyle = gr; ctx.globalAlpha = tk; ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1;
      for (let g = 0; g <= 13; g++) { const gx = lerp(x0, x1, g / 13.8); seg(ctx, gx, y - 8, gx, y + 8, COL.white, 0.35 * tk, 1.2); }
      glow(ctx, x0, y, 90, COL.gold, tk); dot(ctx, x0, y, 6, COL.white, tk);
      txt(ctx, 'Big Bang', x0, y + 48, { f: FONT.body, size: 22, c: COL.gold, a: tk });
      txt(ctx, '13.8 billion years', x0, y + 78, { f: FONT.mono, size: 16, c: COL.white, a: 0.6 * tk });
      txt(ctx, 'today', x1, y + 48, { f: FONT.body, size: 22, c: COL.teal, a: tk });
      const lk = S.k(5, 1.2, 4.5);
      dot(ctx, xl, y, 7, COL.teal, lk); glow(ctx, xl, y, 70, COL.teal, lk * (0.6 + 0.4 * Math.sin(T * 4)));
      txt(ctx, 'life on Earth', xl, y - 46, { f: FONT.body, it: true, size: 24, c: COL.teal, a: lk });
      txt(ctx, 'a dead stage?', lerp(x0, xl, 0.5), y - 40, { f: FONT.body, it: true, w: 300, size: 24, c: COL.grey, a: S.k(5, 1.2, 6.5) * (1 - S.k(6, 1)) });
      // the loop runs backward through all of time
      const bk = S.k(6, 2.2, 0.2);
      if (bk > 0) {
        const bx = lerp(xl, x0, eio(bk));
        const g2 = ctx.createLinearGradient(bx, 0, xl, 0); g2.addColorStop(0, rgba(COL.gold, 0)); g2.addColorStop(0.1, rgba(COL.gold, 0.9)); g2.addColorStop(1, rgba(COL.teal, 0.9));
        ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(xl, y); ctx.strokeStyle = g2; ctx.lineWidth = 7; ctx.stroke();
        glow(ctx, bx, y, 120, COL.gold, bk);
        const ek = S.k(6, 1.5, 1.6);
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, y, 860, 120, 0, Math.PI * 1.02, Math.PI * (1.02 + 1.96 * ek)); stroke(ctx, COL.gold, 0.7 * ek, 2.4); ctx.restore();
        txt(ctx, '?', 0, y - 190, { size: 150, w: 300, c: COL.gold, a: ek, glow: COL.amber, blur: 30 });
      }
    }
  },
};

/* ===================== 2. Three principles ===================== */
SCENES.principles = {
  cam(S) { const p = eio(S.k(4, 3)); return { x: 0, y: 0, z: lerp(1, 0.92, p) }; },
  draw(ctx, S) {
    const T = S.T;
    txt(ctx, 'HOWARD PATTEE', -620, -440, { size: 30, w: 500, ls: 8, a: S.k(0, 1.5) });
    txt(ctx, 'physicist · the epistemic cut, semantic closure', -620, -404, { f: FONT.body, it: true, w: 300, size: 20, c: COL.gold, a: 0.85 * S.k(0, 1.5, 0.5) });
    txt(ctx, 'JESPER HOFFMEYER', 620, -440, { size: 30, w: 500, ls: 8, a: S.k(0, 1.5, 2.2) });
    txt(ctx, 'biosemiotician · code-duality', 620, -404, { f: FONT.body, it: true, w: 300, size: 20, c: COL.gold, a: 0.85 * S.k(0, 1.5, 2.7) });
    const fin = S.k(4, 2.5);
    const spread = lerp(1, 0.86, fin);
    const R = 195, centers = [[-290 * spread, 70 * spread], [0, -200 * spread], [290 * spread, 70 * spread]];
    const cols = [COL.cyan, COL.gold, COL.magenta];
    const names = ['CODE-DUALITY', 'EPISTEMIC CUT', 'SEMANTIC CLOSURE'];
    centers.forEach(([cx, cy], i) => {
      const k = S.k(i + 1, 1.6);
      if (k <= 0) return;
      const rr = R * eback(k);
      glow(ctx, cx, cy, rr * 1.6, cols[i], 0.22 * k);
      ring(ctx, cx, cy, rr, cols[i], 0.9 * k, 2.4);
      ctx.save(); ctx.setLineDash([4, 14]); ctx.lineDashOffset = -T * 30 * (i % 2 ? 1 : -1); ring(ctx, cx, cy, rr + 14, cols[i], 0.5 * k, 1.5); ctx.restore();
      const lx = cx, ly = cy + (i === 1 ? -rr - 40 : rr + 44);
      txt(ctx, names[i], lx, ly, { size: 26, w: 600, ls: 7, c: cols[i], a: k });
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, rr - 6, 0, TAU); ctx.clip(); ctx.globalAlpha *= 1 - 0.8 * fin;
      if (i === 0) {          // digital stream above, analog wave below, coupled
        ctx.save(); setFont(ctx, { f: FONT.mono, size: 22 }); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let j = 0; j < 9; j++) {
          const bx = cx - 160 + ((j * 40 + T * 30) % 360), bit = (Math.floor(j * 7.3 + T * 0.5) % 3) ? '1' : '0';
          ctx.fillStyle = rgba(COL.cyan, 0.8 * k); ctx.fillText(bit, bx, cy - 45);
        }
        ctx.restore();
        ctx.beginPath();
        for (let j = 0; j <= 60; j++) { const xx = cx - 170 + j * 340 / 60; const yy = cy + 50 + 26 * Math.sin(j * 0.32 + T * 1.6) * Math.sin(j * 0.06 + T * 0.4); j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        stroke(ctx, COL.gold, 0.9 * k, 2.2);
        for (let j = 0; j < 9; j++) { const bx = cx - 160 + ((j * 40 + T * 30) % 360); seg(ctx, bx, cy - 25, bx, cy + 20, COL.white, 0.15 * k, 1); }
      } else if (i === 1) {   // a blade between the wave and the record
        const g = ctx.createLinearGradient(cx - 6, 0, cx + 6, 0); g.addColorStop(0, 'rgba(255,240,210,0)'); g.addColorStop(0.5, rgba(COL.white, 0.95 * k)); g.addColorStop(1, 'rgba(255,240,210,0)');
        ctx.fillStyle = g; ctx.fillRect(cx - 6, cy - rr, 12, rr * 2); glow(ctx, cx, cy, 60, COL.gold, 0.5 * k);
        ctx.beginPath(); for (let j = 0; j <= 40; j++) { const xx = cx - 170 + j * 4; const yy = cy + 34 * Math.sin(j * 0.45 - T * 3) * (j / 40); j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } stroke(ctx, COL.cyan, 0.85 * k, 2.2);
        ctx.save(); ctx.translate(cx + 85, cy); ctx.rotate(Math.PI / 4); ctx.strokeStyle = rgba(COL.gold, k); ctx.lineWidth = 2.5; ctx.strokeRect(-26, -26, 52, 52); ctx.restore();
        disc(ctx, cx + 85, cy, 8, COL.gold, k);
      } else {                // ouroboros D -> I -> D
        const r2 = rr * 0.55, sp = T * 0.6;
        arcArrow(ctx, cx, cy, r2, sp, sp + Math.PI * 0.85, COL.magenta, k, 3, 14);
        arcArrow(ctx, cx, cy, r2, sp + Math.PI, sp + Math.PI * 1.85, COL.gold, k, 3, 14);
        txt(ctx, 'D', cx + Math.cos(sp + Math.PI * 1.43) * r2 * 0.45, cy + Math.sin(sp + Math.PI * 1.43) * r2 * 0.45, { size: 40, w: 500, c: COL.gold, a: k });
        txt(ctx, 'I', cx + Math.cos(sp + Math.PI * 0.43) * r2 * 0.45, cy + Math.sin(sp + Math.PI * 0.43) * r2 * 0.45, { size: 40, w: 500, c: COL.magenta, a: k });
      }
      ctx.restore();
      const descs = ['digital memory  +  analog activity', 'description  |  dynamics', 'description builds reader, reader keeps description'];
      txt(ctx, descs[i], lx, ly + (i === 1 ? -34 : 34), { f: FONT.body, it: true, w: 300, size: 19, c: COL.white, a: 0.75 * S.k(i + 1, 1.5, 1.2) * (1 - fin * 0.6) });
    });
    if (fin > 0) {
      const R2 = lerp(200, 560, eio(fin));
      ring(ctx, 0, -10, R2, COL.gold, 0.5 * fin, 1.6);
      ctx.save(); ctx.setLineDash([2, 10]); ctx.lineDashOffset = T * 20; ring(ctx, 0, -10, R2 + 22, COL.gold, 0.35 * fin, 1.2); ctx.restore();
      glow(ctx, 0, 30, 260, COL.gold, 0.3 * fin); ctx.save(); ctx.globalAlpha *= 0.75 * S.k(4, 1.5, 0.6); ctx.beginPath(); ctx.ellipse(0, 62, 330, 78, 0, 0, TAU); ctx.fillStyle = '#04050c'; ctx.filter = 'blur(18px)'; ctx.fill(); ctx.restore();
      txt(ctx, 'CARLOS E. PEREZ', 0, 45, { size: 40, w: 600, ls: 10, c: COL.white, a: S.k(4, 1.5, 0.6), glow: COL.amber, blur: 24 });
      txt(ctx, 'the architecture of the universe itself', 0, 92, { f: FONT.body, it: true, w: 300, size: 24, c: COL.gold, a: S.k(4, 1.5, 3.2) });
    }
  },
};

/* ===================== 3. The axiom and the chainmail ===================== */
SCENES.axiom = {
  NEST: [330, 90],
  init() {
    const r = mulberry(18), N = [];
    N.push({ x: 0, y: 110, d: 3 });
    N.push({ x: this.NEST[0], y: this.NEST[1], d: 4, special: true });
    let tries = 0;
    while (N.length < 84 && tries++ < 6000) {
      const a = r() * TAU, rr = Math.sqrt(r());
      const x = Math.cos(a) * 760 * rr, y = 110 + Math.sin(a) * 270 * rr;
      if (N.every(n => Math.hypot(n.x - x, n.y - y) > 64)) N.push({ x, y, d: 2 + Math.floor(r() * 3) });
    }
    const E = [], seen = new Set([0]), order = [0];
    // grow by attaching the nearest unseen node to the nearest seen node
    while (order.length < N.length) {
      let best = null;
      for (const i of order) for (let j = 0; j < N.length; j++) if (!seen.has(j)) {
        const d = Math.hypot(N[i].x - N[j].x, N[i].y - N[j].y) * (0.8 + 0.4 * hash2(i, j, 3));
        if (!best || d < best[2]) best = [i, j, d];
      }
      seen.add(best[1]); order.push(best[1]); E.push([best[0], best[1]]);
    }
    // close some loops (shared qudits)
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
      const d = Math.hypot(N[i].x - N[j].x, N[i].y - N[j].y);
      if (d < 92 && !E.some(e => (e[0] === i && e[1] === j) || (e[0] === j && e[1] === i)) && hash2(i, j, 9) < 0.45) E.push([i, j]);
    }
    N.forEach((n, i) => n.rot = hash2(i, 1, 1) * TAU);
    this.N = N; this.E = E;
    this.words = 'Nothing exists but finitely many maximally entangled pairs of qudits, some qudits shared, known only by distilling them.'.split(' ');
    this.eye = [820, -150];
  },
  cam(S) { const p = eio(S.k(5, 3, 2)); return { x: lerp(0, 120, p), y: lerp(0, 40, p), z: lerp(1, 1.18, p) }; },
  draw(ctx, S) {
    const T = S.T, N = this.N, E = this.E;
    // the dissolving stage: a spacetime grid
    const gA = (1 - S.k(2, 3, 0.5)) * 0.5;
    if (gA > 0.01) {
      const drift = S.k(2, 4, 0.5) * 80;
      for (let i = -12; i <= 12; i++) {
        seg(ctx, i * 80 - drift * Math.sin(i), -120, i * 140 + drift * Math.cos(i), 420 + drift, COL.blue, gA * 0.5, 1);
      }
      for (let j = 0; j < 9; j++) { const yy = -120 + j * j * 7 + j * 4; seg(ctx, -960, yy + drift * (j % 2 ? 1 : -1) * 0.3, 960, yy, COL.blue, gA * 0.45, 1); }
      txt(ctx, 'space · time · a pre-built stage', -600, -100, { f: FONT.mono, size: 18, c: COL.blue, a: gA * 1.6 * S.k(0, 1, 3) });
    }
    // axiom words
    const wk = S.at(1), W = this.words, per = (S.line(1) ? S.line(1).d : 9) / W.length;
    const rows = [W.slice(0, 9), W.slice(9)];
    let wi = 0;
    rows.forEach((row, ri) => {
      const s = row.join(' '); const full = measure(ctx, s, { size: 46, w: 400 });
      let x = -full / 2;
      row.forEach(w => {
        const k = clamp((wk - wi * per) / 0.6);
        const hot = clamp(1 - Math.abs(wk - wi * per - 0.3) / 1.2);
        const ww = measure(ctx, w + ' ', { size: 46, w: 400 });
        txt(ctx, w, x, -400 + ri * 64 - (1 - eout(k)) * 18, { size: 46, w: 400, align: 'left', c: mix(COL.white, COL.gold, hot), a: k });
        x += ww; wi++;
      });
    });
    txt(ctx, 'the eighteen-word axiom of Chain Theory', 0, -290, { f: FONT.body, it: true, w: 300, size: 22, c: COL.gold, a: 0.8 * S.k(0, 1.5, 2) });
    // the network grows
    const grow = clamp((S.lt - 1.5) / 20);
    const fail = S.k(4, 1.6), special = S.k(5, 1.2);
    const base = mix(COL.cyan, COL.grey, fail * 0.85);
    const ne = Math.floor(grow * E.length);
    const shown = new Set([0]);
    for (let i = 0; i < E.length; i++) {
      const [a, b] = E[i]; const ek = clamp(grow * E.length - i);
      if (ek <= 0) break;
      shown.add(a); shown.add(b);
      const A = N[a], B = N[b];
      braid(ctx, A.x, A.y, lerp(A.x, B.x, eout(ek)), lerp(A.y, B.y, eout(ek)), 4.5, T * 2 + i, base, 0.55 * ek, 1.3, 2);
    }
    N.forEach((n, i) => {
      if (!shown.has(i) && grow < 1) return;
      const isS = n.special;
      const c = isS ? mix(base, COL.gold, special) : base;
      qudit(ctx, n.x, n.y, 11, n.d, n.rot + T * 0.2, c, 0.9, 1.6);
      if (isS && special > 0) {
        glow(ctx, n.x, n.y, 70 + 20 * Math.sin(T * 3), COL.gold, special);
        ring(ctx, n.x, n.y, 30 + 6 * Math.sin(T * 3), COL.gold, special * 0.8, 1.5);
      }
    });
    if (S.lt < 1.5) dot(ctx, N[0].x, N[0].y, 6, COL.white, 1);
    // the observer is linked in
    const ek = S.k(3, 1.0), lk = S.k(3, 0.8, 1.9), [ex, ey] = this.eye;
    if (ek > 0) {
      const sh = 1 - lk;
      ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, 60 * sh + 8, 30 * sh + 8, 0, 0, TAU); stroke(ctx, COL.white, ek * 0.8, 2); ctx.restore();
      disc(ctx, ex, ey, 14 * sh + 5, COL.gold, ek);
      const near = N.reduce((b, n) => Math.hypot(n.x - ex, n.y - ey) < Math.hypot(b.x - ex, b.y - ey) ? n : b, N[0]);
      if (lk > 0) braid(ctx, near.x, near.y, lerp(near.x, ex, lk), lerp(near.y, ey, lk), 4.5, T * 2, COL.gold, 0.9, 1.6, 3);
      txt(ctx, '“to learn about a link is to link to it”', ex - 40, ey - 80, { f: FONT.body, it: true, w: 300, size: 24, c: COL.gold, a: S.k(3, 1.2, 2.5) * (1 - fail * 0.6), align: 'right' });
    }
    // flat machine fails
    if (fail > 0) {
      txt(ctx, 'stable particles reached from one pair:  0', 0, -215, { f: FONT.mono, size: 26, c: COL.red, a: fail * (1 - special * 0.4) });
      [[-430, 160], [-120, -30], [520, 230]].forEach(([x, y], i) => {
        const k = S.k(4, 0.4, 1.2 + i * 0.5);
        cross(ctx, x, y, 12, COL.red, k * (0.6 + 0.4 * Math.sin(T * 9 + i)), 3);
        txt(ctx, 'parts', x, y + 30, { f: FONT.mono, size: 15, c: COL.red, a: k * 0.8 });
      });
    }
    if (special > 0) {
      const [sx, sy] = this.NEST;
      seg(ctx, sx + 30, sy - 30, sx + 160, sy - 160, COL.gold, special * 0.7, 1.4);
      txt(ctx, 'the missing letter:', sx + 170, sy - 182, { f: FONT.body, it: true, w: 300, size: 22, c: COL.white, a: S.k(5, 1, 0.8), align: 'left' });
      txt(ctx, 'attach at a washed end', sx + 170, sy - 150, { size: 30, w: 600, c: COL.gold, a: S.k(5, 1, 1.4), align: 'left' });
    }
  },
};

/* ===================== 4. Alphabet (nested inside the axiom network) ===================== */
SCENES.alphabet = {
  cam(S) { const p = eio(S.k(4, 3, -0.5)); return { x: 0, y: lerp(-30, 230, p), z: lerp(1, 1.04, p) }; },
  draw(ctx, S) {
    const T = S.T, y = -200;
    const dimRow = 1 - 0.55 * S.k(4, 2);
    // d = 1 excluded
    const k1 = S.k(0, 1.2, 1.5) * dimRow;
    dot(ctx, -700, y, 7, COL.grey, k1);
    cross(ctx, -700, y, 34, COL.red, S.k(0, 0.6, 3.2) * dimRow, 2.5);
    txt(ctx, 'd = 1', -700, y + 175, { f: FONT.mono, size: 22, c: COL.grey, a: k1 });
    txt(ctx, 'no relation', -700, y + 208, { f: FONT.body, it: true, w: 300, size: 20, c: COL.grey, a: k1 });
    // d = 2 qubit
    const k2 = S.k(1, 1.4) * dimRow;
    sphere(ctx, -270, y, 120 * eback(S.k(1, 1.4)), T, COL.cyan, k2);
    txt(ctx, 'this', -270, y - 150, { f: FONT.body, it: true, size: 20, c: COL.cyan, a: k2 * S.k(1, 1, 2) });
    txt(ctx, 'that', -270, y + 150, { f: FONT.body, it: true, size: 20, c: COL.cyan, a: k2 * S.k(1, 1, 2.6) });
    txt(ctx, 'd = 2 · QUBIT', -270, y + 190, { size: 26, w: 600, ls: 5, c: COL.cyan, a: k2 });
    txt(ctx, 'distinction', -270, y + 222, { f: FONT.body, it: true, w: 300, size: 20, a: 0.8 * k2 });
    // d = 3 qutrit: three phases at 120 degrees
    const k3 = S.k(2, 1.4) * dimRow, r3 = 120 * eback(S.k(2, 1.4));
    if (k3 > 0) {
      glow(ctx, 170, y, r3 * 2, COL.gold, 0.2 * k3);
      qudit(ctx, 170, y, r3, 3, -Math.PI / 2 + T * 0.25, COL.gold, k3, 2.2);
      for (let i = 0; i < 3; i++) { const t = T * 0.9 + i * TAU / 3; seg(ctx, 170, y, 170 + Math.cos(t) * r3 * 0.6, y + Math.sin(t) * r3 * 0.6, COL.white, k3 * 0.6, 1.5); arrowHead(ctx, 170 + Math.cos(t) * r3 * 0.6, y + Math.sin(t) * r3 * 0.6, t, 9, COL.white, k3 * 0.7); }
    }
    txt(ctx, 'd = 3 · QUTRIT', 170, y + 190, { size: 26, w: 600, ls: 5, c: COL.gold, a: k3 });
    txt(ctx, 'context', 170, y + 222, { f: FONT.body, it: true, w: 300, size: 20, a: 0.8 * k3 });
    // d = 4: two qubits read as one
    const k4 = S.k(3, 1.2) * dimRow, m = S.k(3, 2.2, 1.2);
    if (k4 > 0) {
      const sep = lerp(110, 0, eio(m));
      sphere(ctx, 610 - sep, y, lerp(60, 0, m), T, COL.cyan, k4 * (1 - m * 0.9), { poles: false });
      sphere(ctx, 610 + sep, y, lerp(60, 0, m), T + 1, COL.cyan, k4 * (1 - m * 0.9), { poles: false });
      if (m > 0) { qudit(ctx, 610, y, 110 * eback(m), 4, Math.PI / 4 + T * 0.15, COL.magenta, k4 * m, 2.4); glow(ctx, 610, y, 200, COL.magenta, 0.25 * m * k4); }
      txt(ctx, '2 × 2', 610, y, { f: FONT.mono, size: 22, c: COL.white, a: k4 * m });
    }
    txt(ctx, 'd = 4 · QUQUART', 610, y + 190, { size: 26, w: 600, ls: 5, c: COL.magenta, a: k4 });
    txt(ctx, 're-entry: a relation folded into a thing', 610, y + 222, { f: FONT.body, it: true, w: 300, size: 20, a: 0.8 * k4 });
    // the 24-step clock
    const ck = S.k(4, 1.5);
    if (ck > 0) {
      const cx = 0, cy = 340, R = 220;
      glow(ctx, cx, cy, R * 1.5, COL.gold, 0.15 * ck);
      ring(ctx, cx, cy, R, COL.gold, 0.7 * ck, 1.6);
      seg(ctx, cx - R - 40, cy, cx + R + 40, cy, COL.white, 0.25 * ck, 1);
      seg(ctx, cx, cy - R - 40, cx, cy + R + 40, COL.white, 0.25 * ck, 1);
      for (let i = 0; i < 24; i++) {
        const t = -i * TAU / 24, big = i % 6 === 0;
        seg(ctx, cx + Math.cos(t) * (R - (big ? 18 : 9)), cy + Math.sin(t) * (R - (big ? 18 : 9)), cx + Math.cos(t) * R, cy + Math.sin(t) * R, COL.gold, ck * (big ? 0.9 : 0.5), big ? 2 : 1.2);
      }
      const step = Math.min(12, Math.floor(clamp((S.at(4) - 0.6) / 0.55, 0, 12)) + (S.at(4) > 0.6 ? 1 : 0)) ;
      const st = Math.min(12, step);
      for (let i = 0; i <= st; i++) { const t = -i * Math.PI / 12; dot(ctx, cx + Math.cos(t) * R, cy + Math.sin(t) * R, i === st ? 6 : 3, i === st ? COL.white : COL.gold, ck * (i === st ? 1 : 0.6)); }
      const ha = -st * Math.PI / 12;
      seg(ctx, cx, cy, cx + Math.cos(ha) * R * 0.92, cy + Math.sin(ha) * R * 0.92, COL.white, ck, 2.4);
      txt(ctx, 'z = e^(iπ/12)', cx + R + 20, cy - R + 10, { f: FONT.mono, size: 20, c: COL.gold, a: ck, align: 'left' });
      txt(ctx, `step ${st} / 24`, cx, cy + R + 36, { f: FONT.mono, size: 18, c: COL.white, a: 0.7 * ck });
      // the gain lemma: projections onto the real axis
      const pk = S.k(4, 1.5, 4);
      [[Math.PI / 4, '√2 = 2 cos(π/4)', COL.cyan], [Math.PI / 6, '√3 = 2 cos(π/6)', COL.gold]].forEach(([t, s, c], i) => {
        const px = cx + Math.cos(-t) * R, py = cy + Math.sin(-t) * R;
        seg(ctx, cx, cy, px, py, c, pk * 0.8, 1.6); ctx.save(); ctx.setLineDash([5, 6]); seg(ctx, px, py, px, cy, c, pk * 0.7, 1.2); ctx.restore();
        txt(ctx, s, -600, 250 + i * 50, { f: FONT.mono, size: 26, c, a: pk, align: 'left' });
      });
      txt(ctx, '1 = −e^(iπ)', -600, 350, { f: FONT.mono, size: 26, c: COL.magenta, a: pk, align: 'left' });
      txt(ctx, 'lcm(2, 3, 4) = 12', -600, 410, { f: FONT.mono, size: 20, c: COL.white, a: 0.7 * pk, align: 'left' });
      // Euler at the twelfth step
      const ek = S.k(5, 1.2);
      if (ek > 0) {
        glow(ctx, cx - R, cy, 160 * ek, COL.gold, ek);
        txt(ctx, 'e', 470, 330, { size: 92, w: 500, it: true, c: COL.white, a: ek, glow: COL.amber, blur: 26 });
        txt(ctx, 'iπ', 525, 290, { size: 50, w: 500, it: true, c: COL.white, a: ek, glow: COL.amber, blur: 20 });
        txt(ctx, '+ 1 = 0', 690, 336, { f: FONT.body, size: 70, w: 300, c: COL.white, a: ek, glow: COL.amber, blur: 26 });
        txt(ctx, 'the twelfth step: a half turn', 610, 410, { f: FONT.body, it: true, w: 300, size: 20, c: COL.gold, a: S.k(5, 1, 1.5) });
      }
    }
  },
};

/* ===================== 5. Homeostasis: the hum and the ballast ===================== */
SCENES.homeostasis = {
  cam(S) { const p = eio(S.k(3, 3)); return { x: lerp(-60, 0, p), y: 0, z: lerp(1.04, 1, p) }; },
  draw(ctx, S) {
    const T = S.T;
    const LX = -430, LY = -50, RX = 430, RY = -50;
    // --- left column: Lissajous → homeostat → alpha
    const lisA = S.k(0, 2) * (1 - S.k(3, 1.5));
    if (lisA > 0.01) {
      const U = 4 + Math.max(0, S.lt - 3) * 2.2, A = 250;
      ctx.beginPath();
      const n = Math.min(3000, Math.floor(U / 0.04));
      for (let i = 0; i <= n; i++) { const u = i * 0.04; const x = LX + A * Math.sin(Math.SQRT2 * u), y = LY + A * Math.sin(Math.sqrt(3) * u + 0.6); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; stroke(ctx, COL.gold, 0.28 * lisA, 1.2); ctx.restore();
      const u = U; const hx = LX + A * Math.sin(Math.SQRT2 * u), hy = LY + A * Math.sin(Math.sqrt(3) * u + 0.6);
      dot(ctx, hx, hy, 6, COL.white, lisA);
      txt(ctx, '√2  against  √3', LX, LY + A + 50, { size: 30, w: 500, ls: 3, c: COL.gold, a: lisA });
      txt(ctx, 'the curve never closes', LX, LY + A + 86, { f: FONT.body, it: true, w: 300, size: 20, a: 0.8 * lisA });
    }
    const dialA = S.k(3, 1.5) * (1 - S.k(6, 1.2));
    if (dialA > 0.01) {
      const R = 190, t = S.at(3);
      const needle = -Math.PI / 2 + 0.9 * Math.exp(-0.35 * Math.max(0, t)) * Math.sin(3.2 * t) + 0.03 * Math.sin(T * 2);
      ring(ctx, LX, LY, R, COL.white, 0.25 * dialA, 2, Math.PI * 0.8, Math.PI * 2.2);
      for (let i = 0; i <= 20; i++) { const a = Math.PI * 0.8 + i / 20 * Math.PI * 1.4; seg(ctx, LX + Math.cos(a) * (R - 14), LY + Math.sin(a) * (R - 14), LX + Math.cos(a) * R, LY + Math.sin(a) * R, i === 10 ? COL.gold : COL.white, dialA * (i === 10 ? 1 : 0.4), i === 10 ? 3 : 1.2); }
      seg(ctx, LX, LY, LX + Math.cos(needle) * R * 0.85, LY + Math.sin(needle) * R * 0.85, COL.amber, dialA, 3);
      dot(ctx, LX, LY, 8, COL.amber, dialA);
      txt(ctx, 'HOMEOSTASIS', LX, LY + 120, { size: 26, w: 600, ls: 7, c: COL.amber, a: dialA });
      txt(ctx, 'a self-righting loop', LX, LY + 156, { f: FONT.body, it: true, w: 300, size: 20, a: 0.8 * dialA });
    }
    // --- right column: equation → (3,2) link → four channels → balance
    const eqA = S.k(1, 1.5) * (1 - S.k(2, 1.2));
    if (eqA > 0.01) {
      txt(ctx, 'c₀ + c₁√2 + c₂√3 + c₃√6  ≠  0', RX, RY - 120, { f: FONT.mono, size: 34, c: COL.white, a: eqA });
      txt(ctx, 'for any whole numbers, not all zero', RX, RY - 72, { f: FONT.body, it: true, w: 300, size: 20, c: COL.gold, a: 0.8 * eqA });
      [[Math.SQRT2, COL.cyan], [Math.sqrt(3), COL.gold]].forEach(([f, c], i) => {
        ctx.beginPath(); for (let j = 0; j <= 160; j++) { const x = RX - 300 + j * 600 / 160; const y = RY + 60 + i * 90 + 32 * Math.sin(f * j * 0.12 - T * 1.5); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } stroke(ctx, c, eqA * 0.9, 2);
        txt(ctx, i ? '√3' : '√2', RX - 340, RY + 60 + i * 90, { f: FONT.mono, size: 22, c, a: eqA });
      });
    }
    const lkA = S.k(2, 1.4) * (1 - S.k(4, 1.2));
    if (lkA > 0.01) {
      const jit = 4 * Math.sin(T * 23) * Math.sin(T * 7);
      qudit(ctx, RX - 180, RY, 70, 3, -Math.PI / 2 + T * 0.2, COL.gold, lkA, 2.2);
      qudit(ctx, RX + 180, RY, 60, 2, Math.PI / 2, COL.cyan, lkA, 2.2);
      braid(ctx, RX - 110, RY, RX + 120, RY + jit, 12, T * 3, COL.white, 0.8 * lkA, 1.8, 3);
      glow(ctx, RX, RY, 110, COL.white, 0.25 * lkA * (0.7 + 0.3 * Math.sin(T * 9)));
      txt(ctx, 'LIGHT', RX, RY - 140, { size: 32, w: 600, ls: 10, c: COL.white, a: lkA });
      txt(ctx, 'the (3,2) link: qutrit meets qubit', RX, RY + 130, { f: FONT.body, it: true, w: 300, size: 20, c: COL.gold, a: 0.85 * lkA });
    }
    const chA = S.k(4, 1.5) * (1 - S.k(7, 1.2));
    if (chA > 0.01) {
      const sq = eio(S.k(5, 3.5, 0.5));
      const names = ['Φ++', 'Φ+−', 'Φ−+', 'Φ−−'];
      const H = [lerp(220, 6, sq), lerp(220, 300, sq), lerp(220, 270, sq), lerp(220, 320, sq)];
      names.forEach((nm, i) => {
        const x = RX - 225 + i * 150, by = RY + 170, h = H[i] * eback(S.k(4, 1.2, i * 0.25));
        const c = i === 0 ? COL.cyan : COL.violet;
        const g = ctx.createLinearGradient(0, by - h, 0, by); g.addColorStop(0, rgba(c, 0.85 * chA)); g.addColorStop(1, rgba(c, 0.1 * chA));
        ctx.fillStyle = g; ctx.fillRect(x - 32, by - h, 64, h);
        ctx.strokeStyle = rgba(c, 0.9 * chA); ctx.lineWidth = 1.5; ctx.strokeRect(x - 32, by - h, 64, h);
        glow(ctx, x, by - h, 60, c, 0.5 * chA);
        txt(ctx, nm, x, by + 34, { f: FONT.mono, size: 24, c, a: chA });
        if (i > 0) for (let p = 0; p < 6; p++) {   // strain flows in
          const u = ((T * 0.4 + p / 6 + i * 0.13) % 1);
          const fx = lerp(RX - 225, x, u), fy = lerp(RY + 160, by - h, u) - Math.sin(u * Math.PI) * 120;
          dot(ctx, fx, fy, 2.5, COL.magenta, chA * sq * Math.sin(u * Math.PI));
        }
      });
      txt(ctx, 'explicate', RX - 225, RY + 240, { f: FONT.body, it: true, w: 300, size: 19, c: COL.cyan, a: chA });
      txt(ctx, 'implicate · hidden', RX + 75, RY + 240, { f: FONT.body, it: true, w: 300, size: 19, c: COL.violet, a: chA });
      txt(ctx, '~10⁻¹³', RX - 225, RY + 120, { f: FONT.mono, size: 18, c: COL.cyan, a: chA * sq });
      const pk = S.k(5, 1.5, 4) * (1 - S.k(6, 1));
      txt(ctx, 'v_Q + v_B  =  v_L + v_ct  =  J  =  (12, 155, −51, 127)', 0, 320, { f: FONT.mono, size: 26, c: COL.white, a: pk });
      txt(ctx, 'quark + boson = lepton + photon: the four-sector plaquette', 0, 358, { f: FONT.body, it: true, w: 300, size: 19, c: COL.gold, a: 0.8 * pk });
    }
    const alA = S.k(6, 1.2);
    if (alA > 0.01) {
      const target = '137.035999179', roll = S.k(6, 4.5, 2.5);
      txt(ctx, 'α⁻¹(0)', LX, LY - 120, { size: 40, w: 500, it: true, c: COL.gold, a: alA });
      const chars = target.split('');
      const w = 44, x0 = LX - (chars.length - 1) * w / 2;
      chars.forEach((ch, i) => {
        const settle = clamp(roll * chars.length * 1.3 - i * 0.9);
        const shown = ch === '.' || settle >= 1 ? ch : String(Math.floor((T * 30 + i * 7) % 10));
        txt(ctx, shown, x0 + i * w, LY, { f: FONT.body, size: 72, w: 300, c: settle >= 1 ? COL.white : COL.grey, a: alA, glow: settle >= 1 ? COL.amber : null, blur: 18 });
      });
      txt(ctx, 'predicted · plaquette-dressed', LX, LY + 80, { f: FONT.body, it: true, w: 300, size: 20, c: COL.gold, a: alA * roll });
      txt(ctx, 'measured (CODATA 2022)  137.035999177(21)', LX, LY + 118, { f: FONT.mono, size: 18, c: COL.white, a: 0.7 * alA * roll });
      glow(ctx, LX, LY, 380, COL.amber, 0.15 * alA);
    }
    const bA = S.k(7, 1.5);
    if (bA > 0.01) {
      const tilt = 0.05 * Math.sin(T * 1.2) * Math.exp(-0.2 * Math.max(0, S.at(7)));
      const bx = RX, by = RY - 40, L = 260;
      polyPath(ctx, bx, by + 70, 40, 3); fill(ctx, COL.gold, 0.25 * bA); stroke(ctx, COL.gold, bA, 2);
      const lx = bx - Math.cos(tilt) * L, ly = by - Math.sin(tilt) * L, rx = bx + Math.cos(tilt) * L, ry = by + Math.sin(tilt) * L;
      seg(ctx, lx, ly, rx, ry, COL.gold, bA, 4);
      [[lx, ly], [rx, ry]].forEach(([px, py], i) => {
        seg(ctx, px, py, px - 60, py + 110, COL.gold, 0.6 * bA, 1.2); seg(ctx, px, py, px + 60, py + 110, COL.gold, 0.6 * bA, 1.2);
        ctx.beginPath(); ctx.ellipse(px, py + 112, 70, 12, 0, 0, TAU); stroke(ctx, COL.gold, bA, 2);
        if (!i) { glow(ctx, px, py + 80, 80, COL.white, bA * (0.8 + 0.2 * Math.sin(T * 6))); dot(ctx, px, py + 85, 6, COL.white, bA); }
        else for (let m = 0; m < 7; m++) disc(ctx, px - 36 + (m % 4) * 24, py + 92 - Math.floor(m / 4) * 22, 13, COL.violet, bA * 0.85);
        txt(ctx, i ? 'MATTER' : 'LIGHT', px, py + 160, { size: 26, w: 600, ls: 7, c: i ? COL.violet : COL.white, a: bA });
      });
      txt(ctx, 'matter is the ballast that keeps light in tune', bx, by + 250, { f: FONT.body, it: true, w: 300, size: 22, c: COL.gold, a: S.k(7, 1.5, 2.5) });
    }
  },
};

/* ===================== 6. The horizon at six ===================== */
SCENES.horizon = {
  G: [
    { f: 2, c: 2, n: 'SPACETIME', v: 4, y: -120 },
    { f: 2, c: 3, n: 'ELECTROMAGNETISM', v: 6, y: -300 },
    { f: 2, c: 4, n: 'WEAK', v: 8, y: -120 },
    { f: 3, c: 3, n: 'STRONG', v: 9, y: -320 },
    { f: 3, c: 4, n: 'YUKAWA', v: 12, y: -150 },
    { f: 4, c: 4, n: 'HIGGS', v: 16, y: -300 },
  ],
  init() { this.sparks = Array.from({ length: 40 }, (_, i) => ({ a: hash2(i, 2, 2) * TAU, s: 80 + hash2(i, 3, 3) * 260 })); },
  cam(S) { return { x: 40, y: -40, z: 1 }; },
  draw(ctx, S) {
    const T = S.T, X = v => -860 + v * 102, AY = 170;
    const ak = S.k(0, 1.5);
    seg(ctx, X(0), AY, X(17), AY, COL.white, 0.5 * ak, 1.5);
    for (let v = 0; v <= 16; v++) { seg(ctx, X(v), AY - 6, X(v), AY + 6, COL.white, 0.4 * ak, 1); if (v % 2 === 0 || v === 9) txt(ctx, String(v), X(v), AY + 28, { f: FONT.mono, size: 16, c: COL.white, a: 0.5 * ak }); }
    txt(ctx, 'd₁ × d₂', X(17) + 10, AY, { f: FONT.mono, size: 20, c: COL.white, a: 0.6 * ak, align: 'left' });
    // horizon curtain
    const hk = S.k(1, 2);
    if (hk > 0) {
      const hx = X(7);
      for (let i = 0; i < 26; i++) {
        const yy = -470 + i * 26, w = 8 + 6 * Math.sin(T * 1.7 + i * 0.6);
        glow(ctx, hx + 4 * Math.sin(T + i * 0.4), yy, 60 + w * 3, COL.white, 0.13 * hk);
      }
      seg(ctx, hx, -480, hx, AY + 60, COL.white, 0.9 * hk, 2);
      txt(ctx, 'd₁ d₂ ≤ 6  |  > 6', hx, -505, { f: FONT.mono, size: 26, c: COL.white, a: hk });
      txt(ctx, 'the Størmer–Woronowicz–Choi horizon', hx, AY + 92, { f: FONT.body, it: true, w: 300, size: 21, c: COL.gold, a: hk });
    }
    const bright = S.k(2, 1.2), dark = S.k(3, 1.2), armor = S.k(4, 2), hit = S.at(5);
    // membrane around dark genres
    if (armor > 0) {
      ctx.beginPath();
      const cx = X(12), cy = -215, rx = 500 * eback(armor), ry = 250 * eback(armor);
      for (let i = 0; i <= 120; i++) { const t = i / 120 * TAU; const w = 1 + 0.025 * Math.sin(6 * t + T) + 0.02 * Math.sin(11 * t - T * 1.4) + (hit > 0 ? 0.05 * Math.exp(-hit * 2) * Math.sin(20 * t - hit * 20) : 0); const px = cx + Math.cos(t) * rx * w, py = cy + Math.sin(t) * ry * w; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.closePath(); fill(ctx, [40, 20, 80], 0.35 * armor); stroke(ctx, COL.violet, 0.9 * armor, 3); stroke(ctx, COL.violet, 0.15 * armor, 16);
      helix(ctx, cx, cy + 10, 900, 70, T * 0.6, 0.18 * armor, COL.violet, COL.magenta, { k: 4, rungs: 28 });
      txt(ctx, 'AUTOPOIETIC ARMOR', cx, cy - ry - 34, { size: 26, w: 600, ls: 8, c: COL.violet, a: S.k(4, 1.2, 1) });
      txt(ctx, 'bound entanglement · the cell membrane of matter', cx, cy + ry + 34, { f: FONT.body, it: true, w: 300, size: 20, c: COL.white, a: 0.8 * S.k(4, 1.2, 2) });
    }
    this.G.forEach((g, i) => {
      const isB = g.v <= 6, k = S.k(0, 1.2, 1 + i * 0.5);
      if (k <= 0) return;
      const x = X(g.v), y = g.y, c = isB ? (g.v === 4 ? COL.cyan : COL.gold) : COL.violet;
      const on = isB ? 0.55 + 0.45 * bright : 0.55 + 0.45 * dark;
      seg(ctx, x, y + 70, x, AY, c, 0.25 * k, 1);
      dot(ctx, x, AY, 4, c, k);
      const vib = isB ? 0 : dark * 3 * Math.sin(T * 14 + i);
      qudit(ctx, x - 52, y, 26, g.f, T * 0.3, c, k * on, 2);
      qudit(ctx, x + 52, y + vib, 26, g.c, -T * 0.3, c, k * on, 2);
      braid(ctx, x - 26, y, x + 26, y + vib, 7, T * 3 + i, c, k * on, 1.6, 2);
      txt(ctx, g.n, x, y - 52, { size: 19, w: 600, ls: 3, c, a: k });
      txt(ctx, `(${g.f},${g.c}) = ${g.v}`, x, y + 52, { f: FONT.mono, size: 17, c: COL.white, a: 0.75 * k });
      if (isB && bright > 0) {     // a single read sweeps through
        const u = ((T * 0.5 + i * 0.3) % 1);
        dot(ctx, lerp(x - 90, x + 90, u), y, 3.5, COL.white, bright * Math.sin(u * Math.PI));
      }
    });
    txt(ctx, 'BRIGHT · read in one act', X(3.4), -470, { size: 22, w: 600, ls: 4, c: COL.gold, a: bright * (1 - armor * 0.3) });
    txt(ctx, 'the analog metabolism', X(3.4), -440, { f: FONT.body, it: true, w: 300, size: 19, c: COL.white, a: 0.8 * bright });
    txt(ctx, 'DARK · bound entangled', X(12), -470, { size: 22, w: 600, ls: 4, c: COL.violet, a: dark * (1 - armor) });
    txt(ctx, 'the digital memory', X(12), -440, { f: FONT.body, it: true, w: 300, size: 19, c: COL.white, a: 0.8 * dark * (1 - armor) });
    // a probe strikes the armor and learns nothing
    if (hit > 0) {
      const u = clamp(hit / 1.0), px = lerp(-960, X(12) - 500, eoutx(u)), py = -215;
      if (u < 1) { seg(ctx, px - 160, py, px, py, COL.white, 0.6, 2); dot(ctx, px, py, 7, COL.white, 1); }
      else {
        const e = hit - 1;
        this.sparks.forEach(s => { const d = s.s * eout(e / 1.2); dot(ctx, X(12) - 500 + Math.cos(s.a) * d * 0.5 - d * 0.4, py + Math.sin(s.a) * d * 0.6, 2.2, COL.gold, clamp(1 - e / 1.6)); });
        glow(ctx, X(12) - 500, py, 200, COL.white, clamp(1 - e / 0.8));
        txt(ctx, 'F(q²) = 1  ·  point-like, at every energy', X(12), 300, { f: FONT.mono, size: 22, c: COL.gold, a: S.k(5, 1, 2) });
      }
    }
  },
};

/* ===================== 7. The wash: crossing the epistemic cut ===================== */
SCENES.wash = {
  NEST: [380, -180],
  init() {
    this.app = Array.from({ length: 9 }, (_, i) => ({ x: 560 + hash2(i, 4, 1) * 300, y: 120 + hash2(i, 5, 1) * 200 }));
  },
  cam(S) { return { x: 0, y: -20, z: 1 }; },
  draw(ctx, S) {
    const T = S.T, wash = clamp((S.at(2) - 4.3) / 0.25);
    // the blade
    for (let i = 0; i < 20; i++) glow(ctx, 2 * Math.sin(T * 2 + i), -460 + i * 44, 50, COL.white, 0.09);
    seg(ctx, 0, -500, 0, 420, COL.white, 0.85, 2);
    const cutK = S.k(5, 1.5);
    if (cutK > 0) {
      ctx.save(); ctx.translate(-40, -40); ctx.rotate(-Math.PI / 2);
      txt(ctx, 'THE EPISTEMIC CUT', 0, 0, { size: 40, w: 600, ls: 16, c: COL.white, a: cutK, glow: COL.gold, blur: 24 });
      ctx.restore();
    }
    // left: the wave, approaching the cut
    const waveA = S.k(0, 1.5) * (1 - S.k(3, 1.2));
    if (waveA > 0.01) {
      const amp = 90 * (1 - 0.0 * wash);
      for (let s = 0; s < 2; s++) {
        ctx.beginPath();
        for (let j = 0; j <= 120; j++) { const x = -860 + j * 7; const env = Math.sin(j / 120 * Math.PI); const y = -60 + amp * env * Math.sin(j * 0.16 - T * 2.4 + s * Math.PI / 2); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        stroke(ctx, s ? COL.magenta : COL.cyan, waveA * 0.85, 2.4);
      }
      // twirl: phase-rotated ghost copies that average away
      const tw = S.k(2, 2.5, 1.5) * (1 - wash);
      for (let g = 0; g < 7; g++) {
        ctx.beginPath();
        for (let j = 0; j <= 120; j++) { const x = -860 + j * 7, env = Math.sin(j / 120 * Math.PI); const y = -60 + amp * env * Math.sin(j * 0.16 - T * 2.4 + g * TAU / 7 + tw * T); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        stroke(ctx, COL.white, 0.12 * tw * waveA, 1.2);
      }
      label(ctx, 'continuous dynamics', -440, -240, { a: waveA, c: COL.cyan, size: 22 });
      if (wash > 0) { glow(ctx, -20, -60, 240, COL.white, (1 - clamp((S.at(2) - 4.55) / 1.2)) * waveA); }
    }
    // single copy
    const one = S.k(1, 1.2) * (1 - S.k(3, 1));
    if (one > 0.01) {
      for (let g = 7; g >= 1; g--) braid(ctx, -620 + g * 10, -380 - g * 8, -470 + g * 10, -380 - g * 8, 6, T, COL.grey, 0.18 * one, 1, 2);
      cross(ctx, -505, -410, 56, COL.red, S.k(1, 0.6, 1.5) * one, 3);
      txt(ctx, '×1000', -380, -420, { f: FONT.mono, size: 22, c: COL.red, a: one * S.k(1, 0.6, 1.5) });
      braid(ctx, -620, -380, -470, -380, 7, T * 2, COL.gold, one, 2, 2);
      qudit(ctx, -620, -380, 12, 2, 0, COL.gold, one); qudit(ctx, -470, -380, 12, 3, T, COL.gold, one);
      txt(ctx, 'one copy · one act', -545, -320, { f: FONT.body, it: true, w: 300, size: 21, c: COL.gold, a: one });
    }
    // right: apparatus web links across, the density matrix snaps to its diagonal
    const mA = S.k(2, 1.4);
    if (mA > 0.01) {
      const MX = 500, MY = -60, cs = 80;
      const ak = S.k(2, 1.5, 0.6) * (1 - S.k(4, 1));
      this.app.forEach((p, i) => { dot(ctx, p.x, p.y, 5, COL.teal, ak); if (i) braid(ctx, this.app[i - 1].x, this.app[i - 1].y, p.x, p.y, 3, T * 2, COL.teal, 0.5 * ak, 1.2, 2); });
      const reach = S.k(2, 2.2, 1.6);
      if (reach > 0 && wash < 1) braid(ctx, this.app[0].x, this.app[0].y, lerp(this.app[0].x, -40, reach), lerp(this.app[0].y, -60, reach), 6, T * 3, COL.teal, 0.8 * ak, 1.6, 6);
      txt(ctx, 'apparatus web', 700, 360, { f: FONT.body, it: true, w: 300, size: 19, c: COL.teal, a: ak });
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const x = MX + (j - 1.5) * cs, y = MY + (i - 1.5) * cs, diag = i === j;
        const ph = (i * 1.7 + j * 2.3) + T * 1.5;
        const mag = diag ? 0.55 + 0.1 * Math.sin(i) : 0.7 * (1 - wash);
        const c = diag ? COL.gold : mix(COL.cyan, COL.magenta, 0.5 + 0.5 * Math.sin(ph));
        ctx.fillStyle = rgba(c, mag * mA * 0.75); ctx.fillRect(x - cs / 2 + 3, y - cs / 2 + 3, cs - 6, cs - 6);
        ctx.strokeStyle = rgba(COL.white, 0.15 * mA); ctx.lineWidth = 1; ctx.strokeRect(x - cs / 2 + 3, y - cs / 2 + 3, cs - 6, cs - 6);
        if (!diag && wash < 1) { seg(ctx, x, y, x + Math.cos(ph) * 26 * mag, y + Math.sin(ph) * 26 * mag, COL.white, mA * 0.7 * (1 - wash), 1.6); }
        if (diag && wash > 0) glow(ctx, x, y, 60, COL.gold, 0.6 * wash * mA);
        if (!diag && wash >= 1) txt(ctx, '0', x, y, { f: FONT.mono, size: 18, c: COL.white, a: 0.35 * mA });
      }
      txt(ctx, wash < 1 ? 'coherences' : 'records · the pointer basis', MX, MY - 200, { f: FONT.body, it: true, w: 300, size: 21, c: wash < 1 ? COL.cyan : COL.gold, a: mA });
      txt(ctx, 'the wash: W² = W', MX, MY + 200, { f: FONT.mono, size: 22, c: COL.white, a: mA * wash });
      if (S.k(5, 1, 1.5) > 0) { const [nx, ny] = this.NEST; ring(ctx, nx, ny, 48 + 4 * Math.sin(T * 3), COL.gold, S.k(5, 1, 1.5), 2); glow(ctx, nx, ny, 120, COL.gold, S.k(5, 1, 1.5)); }
    }
    // chart: textbook decay vs the one-act step
    const chA = S.k(3, 1.4) * (1 - S.k(4, 1.2));
    if (chA > 0.01) {
      const ox = -820, oy = 130, w = 680, h = 330;
      seg(ctx, ox, oy, ox + w, oy, COL.white, 0.6 * chA, 1.5); seg(ctx, ox, oy, ox, oy - h, COL.white, 0.6 * chA, 1.5);
      txt(ctx, 'shared records  N', ox + w, oy + 34, { f: FONT.mono, size: 16, c: COL.white, a: 0.7 * chA, align: 'right' });
      txt(ctx, 'off-diagonal coherence', ox, oy - h - 24, { f: FONT.mono, size: 16, c: COL.white, a: 0.7 * chA, align: 'left' });
      for (let n = 0; n <= 10; n++) { seg(ctx, ox + n * w / 10, oy, ox + n * w / 10, oy + 7, COL.white, 0.5 * chA, 1); txt(ctx, String(n), ox + n * w / 10, oy + 20, { f: FONT.mono, size: 13, c: COL.white, a: 0.5 * chA }); }
      const dk = S.k(3, 3, 0.3);
      ctx.beginPath(); for (let i = 0; i <= 100 * dk; i++) { const n = i / 10, x = ox + n * w / 10, y = oy - h * 0.9 * Math.exp(-0.32 * n); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } stroke(ctx, COL.blue, chA, 2.4);
      txt(ctx, 'textbook: e^(−γt), never quite zero', ox + w * 0.55, oy - h * 0.55, { f: FONT.body, it: true, w: 300, size: 19, c: COL.blue, a: chA * dk });
      const sk = S.k(3, 1.5, 5.0);
      if (sk > 0) {
        ctx.beginPath(); ctx.moveTo(ox, oy - h * 0.9); ctx.lineTo(ox + w / 10, oy - h * 0.9); ctx.lineTo(ox + w / 10, lerp(oy - h * 0.9, oy - 2, eoutx(sk))); ctx.lineTo(ox + lerp(w / 10, w, sk), oy - 2); stroke(ctx, COL.gold, chA, 3.2);
        glow(ctx, ox + w / 10, oy - 2, 60, COL.gold, chA * sk);
        txt(ctx, 'the wash: exactly zero at N = 1', ox + w * 0.42, oy - 40, { f: FONT.body, it: true, w: 400, size: 21, c: COL.gold, a: chA * sk, align: 'left' });
      }
    }
    // three levels
    const lv = S.k(4, 1.4);
    if (lv > 0.01) {
      const ox = -440, w = 640, h = 120;
      [['ROOT', 'pure superposition · no record', -290, COL.cyan], ['WASHED', 'discrete records · every mass and rate', -60, COL.gold], ['FLAT', 'equilibrium · all distinctions erased', 170, COL.grey]].forEach(([nm, d, y, c], i) => {
        const k = S.k(4, 1, i * 0.8) * (i === 1 ? 1 : 1 - 0.35 * S.k(4, 1, 4));
        ctx.save(); ctx.beginPath(); ctx.rect(ox - w / 2, y - h / 2, w, h); ctx.clip();
        if (i === 0) for (let s = 0; s < 3; s++) { ctx.beginPath(); for (let j = 0; j <= 80; j++) { const x = ox - w / 2 + j * w / 80; ctx.lineTo(x, y + 40 * Math.sin(j * 0.25 + T * 2 + s * 2) * Math.sin(j * 0.05 + s)); } stroke(ctx, c, 0.45 * k, 1.5); }
        if (i === 1) for (let gx = 0; gx < 14; gx++) for (let gy = 0; gy < 2; gy++) { ctx.strokeStyle = rgba(c, 0.8 * k); ctx.lineWidth = 1.5; ctx.strokeRect(ox - w / 2 + 18 + gx * 48, y - 40 + gy * 46, 30, 30); if ((gx * 3 + gy * 5) % 4 === 0) { ctx.fillStyle = rgba(c, 0.5 * k); ctx.fillRect(ox - w / 2 + 18 + gx * 48, y - 40 + gy * 46, 30, 30); } }
        if (i === 2) { ctx.fillStyle = rgba(c, 0.18 * k); ctx.fillRect(ox - w / 2, y - h / 2, w, h); }
        ctx.restore();
        ctx.strokeStyle = rgba(c, (i === 1 ? 0.95 : 0.4) * k); ctx.lineWidth = i === 1 ? 2.5 : 1; ctx.strokeRect(ox - w / 2, y - h / 2, w, h);
        if (i === 1) glow(ctx, ox, y, 420, COL.gold, 0.12 * k * S.k(4, 1, 4));
        txt(ctx, nm, ox - w / 2, y - h / 2 - 22, { size: 24, w: 600, ls: 6, c, a: k, align: 'left' });
        txt(ctx, d, ox + w / 2, y - h / 2 - 20, { f: FONT.body, it: true, w: 300, size: 17, c: COL.white, a: 0.75 * k, align: 'right' });
      });
      txt(ctx, '— a knife’s edge —', ox, 22, { f: FONT.body, it: true, size: 20, c: COL.gold, a: S.k(4, 1, 4) });
    }
  },
};

/* ===================== 8. The hub-forming move ===================== */
SCENES.hub = {
  cam(S) { return { x: 0, y: -10, z: 1 }; },
  init() { const r = mulberry(5); this.br = Array.from({ length: 26 }, (_, i) => ({ a: (i / 26) * TAU + r() * 0.2, l: 150 + r() * 220, k: r() })); },
  draw(ctx, S) {
    const T = S.T;
    const fold = eio(S.k(1, 1.6, 0.2));
    const move = eio(S.k(3, 1.5));
    const hx = lerp(0, -470, move), hy = lerp(-40, -40, move);
    // two qubits, then one hub
    const sep = lerp(260, 0, fold), rot = fold * Math.PI;
    if (fold < 1) {
      const a1 = 1 - fold * 0.95;
      sphere(ctx, hx - sep * Math.cos(rot * 0.5), hy - sep * 0.3 * Math.sin(rot), lerp(90, 30, fold), T, COL.cyan, a1);
      sphere(ctx, hx + sep * Math.cos(rot * 0.5), hy + sep * 0.3 * Math.sin(rot), lerp(90, 30, fold), T + 2, COL.cyan, a1);
      braid(ctx, hx - sep + 90, hy, hx + sep - 90, hy, 12, T * 3, COL.white, a1 * 0.9 * S.k(0, 1), 2, 4);
      txt(ctx, 'a washed pair of qubits', hx, hy - 170, { f: FONT.body, it: true, w: 300, size: 24, c: COL.cyan, a: S.k(0, 1.2) * a1 });
    }
    if (fold > 0) {
      const r = 150 * eback(fold);
      glow(ctx, hx, hy, r * 2.4, COL.gold, 0.4 * fold);
      qudit(ctx, hx, hy, r, 4, Math.PI / 4 + T * 0.2, COL.gold, fold, 3);
      polyPath(ctx, hx, hy, r * 0.55, 4, -Math.PI / 4 - T * 0.3); stroke(ctx, COL.white, 0.5 * fold, 1.5);
      for (let i = 0; i < 4; i++) { const t = Math.PI / 4 + T * 0.2 + i * TAU / 4; seg(ctx, hx, hy, hx + Math.cos(t) * r, hy + Math.sin(t) * r, COL.gold, 0.25 * fold, 1); }
      dot(ctx, hx, hy, 8, COL.white, fold);
      txt(ctx, 'd = 4 HUB', hx, hy + r + 46, { size: 26, w: 600, ls: 6, c: COL.gold, a: fold });
      txt(ctx, 'su(4) ≅ spin(6) · center ℤ₄', hx, hy + r + 80, { f: FONT.mono, size: 17, c: COL.white, a: 0.6 * fold });
      if (S.at(1) > 1.2 && S.at(1) < 3) glow(ctx, hx, hy, 600, COL.white, 0.6 * (1 - clamp((S.at(1) - 1.2) / 1.6)));
    }
    // verb -> noun
    const vk = S.k(2, 1.2), nk = S.k(2, 1.2, 2.2);
    const vy = -400;
    txt(ctx, 'to link', -150, vy, { size: 60, w: 300, it: true, c: COL.cyan, a: vk * (1 - nk * 0.7) });
    txt(ctx, 'verb', -150, vy + 48, { f: FONT.mono, size: 16, c: COL.cyan, a: 0.6 * vk });
    if (nk > 0) { seg(ctx, -60, vy, lerp(-60, 60, nk), vy, COL.white, nk, 2); arrowHead(ctx, lerp(-60, 66, nk), vy, 0, 12, COL.white, nk); }
    txt(ctx, 'a hub', 170, vy, { size: 60, w: 600, c: COL.gold, a: nk, glow: COL.amber, blur: 18 });
    txt(ctx, 'noun', 170, vy + 48, { f: FONT.mono, size: 16, c: COL.gold, a: 0.6 * nk });
    // the ledger
    const lk = S.k(3, 1.2, 0.6);
    if (lk > 0) {
      const LX = 120, LY = -230, rows = [
        ['strike one bright (2,3) link', '−1', COL.cyan],
        ['insert one (2,2) pair link', '0', COL.cyan],
        ['insert two (2,4) weak legs', '+4', COL.violet],
        ['insert one (3,4) Yukawa in-leg', '+1', COL.violet],
      ];
      txt(ctx, 'THE LEDGER OF RE-ENTRY', LX, LY - 50, { size: 24, w: 600, ls: 6, c: COL.gold, a: lk, align: 'left' });
      rows.forEach(([d, v, c], i) => {
        const k = S.k(3, 0.6, 1.2 + i * 0.9);
        txt(ctx, d, LX, LY + i * 52, { f: FONT.body, w: 300, size: 24, c: COL.white, a: k, align: 'left' });
        txt(ctx, v, LX + 640, LY + i * 52, { f: FONT.mono, size: 26, c, a: k, align: 'right' });
      });
      const k5 = S.k(3, 0.6, 4.8), k6 = S.k(3, 0.6, 6.0), k7 = S.k(3, 0.8, 7.4);
      seg(ctx, LX, LY + 186, LX + 640, LY + 186, COL.white, 0.5 * k5, 1);
      txt(ctx, 'inserted', LX, LY + 218, { f: FONT.body, it: true, w: 300, size: 22, c: COL.white, a: k5, align: 'left' });
      txt(ctx, '+4', LX + 640, LY + 218, { f: FONT.mono, size: 28, c: COL.violet, a: k5, align: 'right' });
      txt(ctx, '(4,4) vacuum register, 81² = 6561', LX, LY + 270, { f: FONT.body, w: 300, size: 22, c: COL.white, a: k6, align: 'left' });
      txt(ctx, '−4', LX + 640, LY + 270, { f: FONT.mono, size: 28, c: COL.magenta, a: k6, align: 'right' });
      seg(ctx, LX, LY + 306, LX + 640, LY + 306, COL.gold, k7, 2); seg(ctx, LX, LY + 312, LX + 640, LY + 312, COL.gold, k7, 2);
      txt(ctx, 'balance at every one of 1,693 forward edges', LX, LY + 350, { f: FONT.body, it: true, w: 300, size: 22, c: COL.gold, a: k7, align: 'left' });
      txt(ctx, '0', LX + 640, LY + 352, { f: FONT.body, size: 56, w: 300, c: COL.white, a: k7, align: 'right', glow: COL.amber, blur: 22 });
    }
    // with the third letter, matter bootstraps
    const bk = S.k(4, 3, 0.5);
    if (bk > 0) {
      this.br.forEach((b, i) => {
        const L = b.l * eout(clamp(bk * 1.4 - b.k * 0.4));
        let px = hx, py = hy, ang = b.a;
        ctx.beginPath(); ctx.moveTo(px, py);
        for (let s = 0; s < 6; s++) { ang += Math.sin(i * 3.1 + s) * 0.3; px += Math.cos(ang) * L / 6; py += Math.sin(ang) * L / 6; ctx.lineTo(px, py); }
        stroke(ctx, COL.gold, 0.35 * bk, 1.2);
        if (i % 4 === 0) { const sk = clamp(bk * 2 - 1 - b.k * 0.5); dot(ctx, px, py, 5, i % 8 ? COL.white : COL.magenta, sk); glow(ctx, px, py, 40, COL.gold, sk * (0.6 + 0.4 * Math.sin(T * 4 + i))); }
      });
      txt(ctx, 'stable matter, bootstrapped from one pair', hx, hy + 290, { f: FONT.body, it: true, w: 300, size: 22, c: COL.gold, a: S.k(4, 1.2, 2.5) });
    }
  },
};

/* ===================== 9. The cosmic ribosome ===================== */
SCENES.ribosome = {
  cam(S) { const p = eio(S.k(2, 3, -0.6)); return { x: 0, y: lerp(-110, 360, p), z: lerp(1, 1.0, p) }; },
  init() { this.cod = Array.from({ length: 40 }, (_, i) => Math.floor(hash2(i, 9, 9) * 4)); },
  draw(ctx, S) {
    const T = S.T;
    // ---- upper row: biology and its cosmic analogue
    const up = S.k(0, 1.5) * (1 - 0.8 * S.k(2, 2));
    const BX = -480, BY = -170;
    if (up > 0.01) {
      const shift = (T * 40) % 60, cc = [COL.cyan, COL.gold, COL.magenta, COL.teal];
      for (let i = 0; i < 22; i++) {
        const x = BX - 420 + i * 40 + shift;
        if (x > BX + 380) continue;
        ctx.fillStyle = rgba(cc[this.cod[(i + Math.floor(T * 40 / 60) * 0) % 40]], 0.75 * up); ctx.fillRect(x, BY + 40, 34, 16);
      }
      seg(ctx, BX - 420, BY + 48, BX + 400, BY + 48, COL.white, 0.4 * up, 1);
      ctx.beginPath(); ctx.ellipse(BX, BY + 10, 110, 70, 0, 0, TAU); fill(ctx, [80, 60, 30], 0.5 * up); stroke(ctx, COL.gold, up, 2.4);
      ctx.beginPath(); ctx.ellipse(BX, BY + 95, 140, 55, 0, 0, TAU); fill(ctx, [80, 60, 30], 0.4 * up); stroke(ctx, COL.gold, up, 2.4);
      let px = BX, py = BY - 50, ang = -Math.PI / 2;
      for (let i = 0; i < 18; i++) { ang += Math.sin(i * 1.3 + T * 0.8) * 0.6; const nx = px + Math.cos(ang) * 22, ny = py + Math.sin(ang) * 22; seg(ctx, px, py, nx, ny, COL.cyan, 0.6 * up, 2); disc(ctx, nx, ny, 7, COL.cyan, 0.8 * up); px = nx; py = ny; }
      label(ctx, 'ribosome', BX, BY + 200, { a: up, c: COL.gold, size: 22 });
      txt(ctx, 'reads codons, folds proteins', BX, BY + 232, { f: FONT.body, it: true, w: 300, size: 20, a: 0.8 * up });
      // cosmic: the spectral operator reads a web
      const ok = S.k(1, 1.5, 3) * (1 - 0.8 * S.k(2, 2));
      const OX = 470, OY = -150;
      qudit(ctx, OX - 300, OY, 46, 3, T * 0.3, COL.violet, ok, 2); qudit(ctx, OX - 300, OY + 110, 30, 4, -T * 0.3, COL.violet, ok, 2);
      braid(ctx, OX - 300, OY + 46, OX - 300, OY + 80, 5, T * 3, COL.violet, ok, 1.5, 1);
      ctx.strokeStyle = rgba(COL.gold, ok); ctx.lineWidth = 2.4; ctx.strokeRect(OX - 120, OY - 70, 240, 200);
      glow(ctx, OX, OY + 30, 200, COL.gold, 0.2 * ok);
      txt(ctx, 'M', OX - 18, OY + 20, { size: 90, w: 400, it: true, c: COL.white, a: ok });
      txt(ctx, 'Pauli', OX + 38, OY + 52, { size: 28, w: 500, it: true, c: COL.white, a: ok, align: 'left' });
      for (let p = 0; p < 5; p++) { const u = (T * 0.35 + p / 5) % 1; dot(ctx, lerp(OX - 260, OX - 120, u), OY + 30, 3, COL.violet, ok * Math.sin(u * Math.PI)); dot(ctx, lerp(OX + 120, OX + 280, u), OY + 30, 3, COL.gold, ok * Math.sin(u * Math.PI)); }
      txt(ctx, 'mass', OX + 330, OY + 30, { size: 34, w: 500, it: true, c: COL.gold, a: ok });
      label(ctx, 'the spectral operator', OX, OY + 200, { a: ok, size: 22 });
      txt(ctx, 'reads a particle web’s hidden code', OX, OY + 232, { f: FONT.body, it: true, w: 300, size: 20, a: 0.8 * ok });
    }
    // ---- lower row: leptons (closed triangle) and quarks (open star)
    const Y = 430;
    const lk = S.k(2, 1.5);
    if (lk > 0) {
      const X = -600, R = 130;
      glow(ctx, X, Y, 330, COL.cyan, 0.15 * lk);
      ring(ctx, X, Y, R * 1.6, COL.cyan, 0.35 * lk, 1.2);
      polyPath(ctx, X, Y, R, 3); stroke(ctx, COL.violet, lk, 2.5);
      ['A', 'B', 'C'].forEach((n, i) => { const t = -Math.PI / 2 + i * TAU / 3; dot(ctx, X + Math.cos(t) * R, Y + Math.sin(t) * R, 9, COL.violet, lk); txt(ctx, n, X + Math.cos(t) * (R + 32), Y + Math.sin(t) * (R + 32), { size: 24, w: 600, c: COL.violet, a: lk }); });
      const ra = T * 1.6; dot(ctx, X + Math.cos(ra) * R * 0.62, Y + Math.sin(ra) * R * 0.62, 7, COL.white, lk);
      for (let i = 1; i < 12; i++) dot(ctx, X + Math.cos(ra - i * 0.09) * R * 0.62, Y + Math.sin(ra - i * 0.09) * R * 0.62, 7 - i * 0.5, COL.cyan, lk * (1 - i / 12) * 0.6);
      txt(ctx, 'ω = e^(2πik/3)', X, Y, { f: FONT.mono, size: 17, c: COL.white, a: 0.7 * lk });
      label(ctx, 'closed color loop · leptons', X + 150, Y - R * 1.6 - 40, { a: lk * (1 - S.k(4, 1, 7)), c: COL.cyan, size: 22 });
      // mass bars (log scale)
      const ms = [['e', 0.511], ['μ', 105.66], ['τ', 1776.9]];
      ms.forEach(([n, m], i) => {
        const k = S.k(2, 1, 3 + i * 0.6), w = (Math.log10(m) + 0.5) / 4 * 300;
        const bx = X + 290, by = Y - 60 + i * 40;
        ctx.fillStyle = rgba(COL.cyan, 0.75 * k); ctx.fillRect(bx, by - 8, w * eout(k), 16);
        txt(ctx, n, bx - 18, by, { size: 22, it: true, c: COL.white, a: k, align: 'right' });
      });
      txt(ctx, 'Koide  K = 2/3', X + 290, Y + 80, { f: FONT.mono, size: 22, c: COL.gold, a: S.k(2, 1, 6), align: 'left' });
      txt(ctx, 'log mass', X + 290, Y - 100, { f: FONT.mono, size: 14, c: COL.white, a: 0.5 * S.k(2, 1, 3), align: 'left' });
    }
    const qk = S.k(3, 1.5);
    if (qk > 0) {
      const X = 520, R = 110;
      for (let i = 0; i < 3; i++) { const t = -Math.PI / 2 + i * TAU / 3; seg(ctx, X, Y, X + Math.cos(t) * R, Y + Math.sin(t) * R, COL.violet, qk, 2.5); dot(ctx, X + Math.cos(t) * R, Y + Math.sin(t) * R, 8, COL.violet, qk); }
      ring(ctx, X + Math.cos(Math.PI / 6) * R, Y + Math.sin(Math.PI / 6) * R, 18, COL.red, qk * (0.6 + 0.4 * Math.sin(T * 5)), 2);
      dot(ctx, X, Y, 9, COL.white, qk);
      // logarithmic spiral of the Pisot boosts
      const turns = 2.3 * eout(S.k(3, 4, 0.5)), b = Math.log(5.828) / TAU * 0.5;
      ctx.beginPath(); for (let i = 0; i <= 200 * turns / 2.3; i++) { const t = i / 200 * 2.3 * TAU; const r = Math.min(240, 26 * Math.exp(b * t)); ctx.lineTo(X + Math.cos(t - T * 0.2) * r, Y + Math.sin(t - T * 0.2) * r); } stroke(ctx, COL.gold, 0.8 * qk, 2);
      ['u', 'd', 's', 'c', 'b', 't'].forEach((n, i) => {
        const t = (0.5 + i * 0.8) * TAU / 2.3 * 2.3 / 2.4, r = 26 * Math.exp(b * t * 2.4);
        const k = clamp(turns / 2.3 * 6 - i);
        const px = X + Math.cos(t * 2.4 - T * 0.2) * Math.min(r, 240), py = Y + Math.sin(t * 2.4 - T * 0.2) * Math.min(r, 240);
        dot(ctx, px, py, 5, COL.gold, k); txt(ctx, n, px + 18, py - 14, { size: 26, it: true, c: COL.white, a: k });
      });
      label(ctx, 'open color star · quarks', X, Y - 290, { a: qk, size: 22 });
      txt(ctx, '(1+√2)² ≈ 5.828    (2+√3)² ≈ 13.928', X, Y - 256, { f: FONT.mono, size: 19, c: COL.gold, a: qk * S.k(3, 1, 2) });
    }
    // three hubs fill the corners; a fourth is refused
    const hk = S.k(4, 1, 2.2);
    if (hk > 0) {
      const X = -600, R = 130;
      for (let i = 0; i < 3; i++) {
        const k = S.k(4, 0.7, 2.8 + i);
        const t = -Math.PI / 2 + i * TAU / 3, px = X + Math.cos(t) * (R + 75), py = Y + Math.sin(t) * (R + 75);
        seg(ctx, X + Math.cos(t) * R, Y + Math.sin(t) * R, lerp(X + Math.cos(t) * R, px, k), lerp(Y + Math.sin(t) * R, py, k), COL.gold, k, 2);
        if (k > 0) { qudit(ctx, px, py, 22 * k, 4, Math.PI / 4, COL.gold, k, 2); txt(ctx, `k=${i + 1}`, px, py + 38, { f: FONT.mono, size: 15, c: COL.gold, a: k }); }
      }
      const f4 = S.k(4, 0.5, 6.2);
      if (f4 > 0) {
        const bounce = Math.sin(clamp((S.at(4) - 6.2) / 0.8) * Math.PI) * 50;
        const px = X + 120 - bounce * 0.5, py = Y + 250 - bounce * 0.2;
        qudit(ctx, px, py, 22, 4, Math.PI / 4, COL.grey, f4, 2); cross(ctx, px, py, 24, COL.red, f4, 3);
        txt(ctx, 'no room: k_max = 3', px + 40, py, { f: FONT.mono, size: 18, c: COL.red, a: f4, align: 'left' });
      }
      txt(ctx, 'THREE GENERATIONS', X + 150, Y - R * 1.6 - 40, { size: 30, w: 600, ls: 8, c: COL.gold, a: S.k(4, 1.2, 7), glow: COL.amber, blur: 16 });
    }
  },
};

/* ===================== 10. Semantic closure: the loop ===================== */
SCENES.closure = {
  N: [
    ['washed record', 'R', COL.gold], ['re-entry (HF)', 'hub-forming move', COL.gold], ['dark hub code', '(v_S, k, n₃)', COL.violet],
    ['spectral operator', 'M_Pauli', COL.magenta], ['probe & scale sinks', 'the interpreters', COL.cyan], ['distill & wash', 'a new read', COL.teal],
  ],
  cam(S) { const p = eio(S.k(2, 2.5, -0.4)), q = eio(S.k(3, 2.5, 0)); return { x: lerp(0, -230, p - q), y: lerp(-20, 30, p - q), z: lerp(1, 1.25, p - q) }; },
  draw(ctx, S) {
    const T = S.T, CX = 0, CY = -30, R = 315;
    const beat = S.at(4) > 0 ? Math.pow(Math.max(0, Math.sin((S.at(4) - 0.5) * Math.PI)), 12) * clamp(1 - (S.at(4) - 4.5) / 3) : 0;
    const Rb = R * (1 + 0.03 * beat);
    const dk = S.k(0, 3, 0.3);
    glow(ctx, CX, CY, Rb * 1.5, COL.gold, 0.12 + 0.25 * beat);
    ring(ctx, CX, CY, Rb, COL.gold, 0.35 * dk, 1.4, -Math.PI / 2, -Math.PI / 2 + TAU * dk);
    const hlIdx = S.at(3) > 0 && S.at(3) < 8 ? Math.min(3, Math.floor(S.at(3) / 1.8)) : -1;
    const hlArcs = [[3, 4], [5, 0], [0, 1, 2], [2]];       // which arrows light per phrase
    this.N.forEach(([nm, sub, c], i) => {
      const t = -Math.PI / 2 + i * TAU / 6;
      const k = clamp(dk * 6 - i);
      const x = CX + Math.cos(t) * Rb, y = CY + Math.sin(t) * Rb;
      // arrow to next node
      const t2 = t + TAU / 6, hl = hlIdx >= 0 && hlArcs[hlIdx].includes(i);
      arcArrow(ctx, CX, CY, Rb, t + 0.2, t2 - 0.2, hl ? COL.white : c, k * (hl ? 1 : 0.6), hl ? 4 : 2.2, 13);
      for (let p = 0; p < 3; p++) { const u = (T * 0.25 + p / 3 + i * 0.1) % 1, tt = lerp(t + 0.2, t2 - 0.2, u); dot(ctx, CX + Math.cos(tt) * Rb, CY + Math.sin(tt) * Rb, 3, c, k * Math.sin(u * Math.PI)); }
      disc(ctx, x, y, 34, [6, 8, 18], k); ring(ctx, x, y, 34, c, k, 2.4); glow(ctx, x, y, 100, c, 0.45 * k * (hl ? 1.6 : 1));
      if (i === 1) qudit(ctx, x, y, 16, 4, Math.PI / 4 + T * 0.3, c, k, 1.6);
      else if (i === 2) qudit(ctx, x, y, 16, 3, T * 0.3, c, k, 1.6);
      else if (i === 3) txt(ctx, 'M', x, y, { size: 34, it: true, c, a: k });
      else if (i === 4) { dot(ctx, x, y, 5, c, k); ring(ctx, x, y, 18, c, k * 0.7, 1.2); }
      else dot(ctx, x, y, 7, c, k);
      const cx2 = Math.cos(t), side = Math.abs(cx2) > 0.3;
      const al = side ? (cx2 > 0 ? 'left' : 'right') : 'center';
      const lx = side ? x + Math.sign(cx2) * 52 : x, ly = side ? y : y + Math.sign(Math.sin(t)) * 66 - (Math.sin(t) > 0 ? 0 : 14);
      txt(ctx, nm.toUpperCase(), lx, ly - 13, { size: 21, w: 600, ls: 3, c, a: k, align: al });
      txt(ctx, sub, lx, ly + 15, { f: i === 2 || i === 3 ? FONT.mono : FONT.body, it: i !== 2 && i !== 3, w: 300, size: 18, c: COL.white, a: 0.75 * k, align: al });
    });
    // the embodied interpreters
    const ik = S.k(2, 1.2);
    if (ik > 0) {
      const sx = CX + Math.cos(-Math.PI / 2 + 4 * TAU / 6) * R, sy = CY + Math.sin(-Math.PI / 2 + 4 * TAU / 6) * R;
      const items = [
        ['electron · the probe', (x, y, a) => { dot(ctx, x, y, 7, COL.cyan, a); ctx.beginPath(); ctx.ellipse(x, y, 30, 12, T, 0, TAU); stroke(ctx, COL.cyan, a * 0.7, 1.2); }],
        ['hydrogen', (x, y, a) => { dot(ctx, x - 26, y, 11, COL.red, a); braid(ctx, x - 14, y, x + 22, y, 6, T * 4, COL.gold, a, 1.4, 2); dot(ctx, x + 30, y, 6, COL.cyan, a); }],
        ['W and Z · scale bodies', (x, y, a) => { disc(ctx, x - 16, y, 13, COL.magenta, a * 0.8); disc(ctx, x + 18, y, 15, COL.violet, a * 0.8); ring(ctx, x, y, 38, COL.white, a * 0.4, 1); }],
      ];
      items.forEach(([n, f], i) => {
        const k = S.k(2, 0.8, 1.2 + i * 2.6);
        const x = sx - 520, y = sy - 250 + i * 100;
        f(x, y, k); txt(ctx, n, x + 60, y, { f: FONT.body, it: true, w: 300, size: 22, c: COL.white, a: k, align: 'left' });
        ctx.save(); ctx.setLineDash([3, 6]); seg(ctx, x + 300, y, sx - 260, sy - 20, COL.cyan, 0.3 * k, 1); ctx.restore();
      });
      txt(ctx, 'built by the code, they become the instruments', sx - 520, sy - 330, { f: FONT.body, it: true, w: 300, size: 21, c: COL.cyan, a: S.k(1, 1.2) * (1 - S.k(3, 1)) });
    }
    // centre phrases
    const phrases = ['Code builds the readers.', 'Readers wash new records.', 'Records fold into new hubs.', 'Hubs become code.'];
    if (S.at(3) > 0) {
      const i = Math.min(3, Math.floor(S.at(3) / 1.8)), loc = S.at(3) - i * 1.8;
      const a = clamp(loc / 0.4) * (i < 3 ? clamp((1.8 - loc) / 0.4) : 1 - S.k(4, 0.8));
      txt(ctx, phrases[i], CX, CY, { size: 34, w: 500, it: true, c: COL.white, a });
    }
    const rk = S.k(4, 1.5);
    if (rk > 0) {
      txt(ctx, 'read', CX - 80, CY - 4, { size: 44, w: 400, it: true, c: COL.cyan, a: rk });
      txt(ctx, 'known', CX + 90, CY - 4, { size: 44, w: 400, it: true, c: COL.gold, a: rk });
      arcArrow(ctx, CX, CY - 40, 60, Math.PI * 1.15, Math.PI * 1.85, COL.white, rk * 0.8, 1.6, 9);
      arcArrow(ctx, CX, CY + 32, 60, Math.PI * 0.15, Math.PI * 0.85, COL.white, rk * 0.8, 1.6, 9);
      txt(ctx, 'the heartbeat of the loop', CX, CY + 120, { f: FONT.body, it: true, w: 300, size: 20, c: COL.gold, a: S.k(4, 1.2, 3) });
    }
  },
};

/* ===================== 11. Metabolism and the arrow of time ===================== */
SCENES.metabolism = {
  init() {
    const r = mulberry(444), comps = 27, N = [], E = [];
    // 27 components summing to 444 sites
    const sizes = Array.from({ length: comps }, () => 1 + r() * 2); const tot = sizes.reduce((a, b) => a + b, 0);
    let cnt = sizes.map(s => Math.max(3, Math.round(s / tot * 444)));
    let diff = 444 - cnt.reduce((a, b) => a + b, 0); let ix = 0; while (diff !== 0) { const d = Math.sign(diff); if (cnt[ix % comps] + d >= 3) { cnt[ix % comps] += d; diff -= d; } ix++; }
    const centers = [];
    for (let c = 0; c < comps; c++) {
      let x, y, tries = 0;
      do { const a = r() * TAU, rr = 300 * Math.sqrt(r()); x = Math.cos(a) * rr; y = Math.sin(a) * rr; tries++; } while (tries < 50 && centers.some(p => Math.hypot(p[0] - x, p[1] - y) < 80));
      centers.push([x, y]);
      const first = N.length, spread = 20 + Math.sqrt(cnt[c]) * 9;
      for (let i = 0; i < cnt[c]; i++) {
        const a = r() * TAU, rr = spread * Math.sqrt(r());
        N.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr, c });
        if (i) { let best = first, bd = 1e9; for (let j = first; j < N.length - 1; j++) { const d = Math.hypot(N[j].x - N[N.length - 1].x, N[j].y - N[N.length - 1].y); if (d < bd) { bd = d; best = j; } } E.push([best, N.length - 1]); }
      }
    }
    // extra cycles until 551 links
    let guard = 0;
    while (E.length < 551 && guard++ < 50000) {
      const i = Math.floor(r() * N.length); let best = -1, bd = 1e9;
      for (let j = 0; j < N.length; j++) if (j !== i && N[j].c === N[i].c) { const d = Math.hypot(N[j].x - N[i].x, N[j].y - N[i].y); if (d < bd && !E.some(e => (e[0] === i && e[1] === j) || (e[0] === j && e[1] === i))) { bd = d; best = j; } }
      if (best >= 0) E.push([i, best]);
    }
    N.forEach((n, i) => n.dark = hash2(i, 7, 7) < 0.6);
    this.N = N; this.E = E;
  },
  cam(S) { const p = eio(S.k(4, 3, -0.5)); return { x: lerp(40, 0, p), y: lerp(-20, 160, p), z: lerp(1, 0.95, p) }; },
  draw(ctx, S) {
    const T = S.T, WX = -330, WY = -60, HR = 400;
    const wk = S.k(1, 2.5, -1);
    const rot = T * 0.02;
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const P = (n) => [WX + n.x * cs - n.y * sn, WY + n.x * sn + n.y * cs];
    const ne = Math.floor(this.E.length * wk);
    ctx.beginPath();
    for (let i = 0; i < ne; i++) { const [a, b] = this.E[i]; const A = P(this.N[a]), B = P(this.N[b]); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
    stroke(ctx, COL.blue, 0.4 * wk, 1);
    const nn = Math.floor(this.N.length * wk);
    for (let i = 0; i < nn; i++) { const [x, y] = P(this.N[i]); disc(ctx, x, y, 2.6, this.N[i].dark ? COL.violet : COL.gold, 0.9 * wk); }
    glow(ctx, WX, WY, HR * 1.3, COL.blue, 0.15 * wk);
    txt(ctx, `${nn} sites · ${ne} links · 27 components`, WX, WY + HR + 44, { f: FONT.mono, size: 20, c: COL.white, a: 0.75 * wk * (1 - S.k(4, 1)) });
    // the horizon cut, and its metabolism
    const hk = S.k(2, 1.5);
    ctx.save(); ctx.setLineDash([10, 8]); ctx.lineDashOffset = -T * 12; ring(ctx, WX, WY, HR, COL.white, 0.25 + 0.5 * hk, 2); ctx.restore();
    if (hk > 0) {
      txt(ctx, 'THE HORIZON CUT', WX, WY - HR - 30, { size: 22, w: 600, ls: 6, c: COL.white, a: hk });
      const wires = [[-0.35, COL.violet, '9'], [0, COL.gold, '6'], [0.35, COL.violet, '9']];
      wires.forEach(([a, c, n], i) => {
        const x1 = WX + Math.cos(a) * (HR - 80), y1 = WY + Math.sin(a) * (HR - 80), x2 = WX + Math.cos(a) * (HR + 140), y2 = WY + Math.sin(a) * (HR + 140);
        braid(ctx, x1, y1, x2, y2, 6, T * 4 + i, c, hk, i === 1 ? 2 : 2.6, 4);
        for (let p = 0; p < 4; p++) { const u = (T * 0.6 + p / 4 + i * 0.2) % 1; dot(ctx, lerp(x1, x2, u), lerp(y1, y2, u), 3, c, hk * Math.sin(u * Math.PI)); }
        txt(ctx, n, x2 + 26, y2, { f: FONT.mono, size: 22, c, a: hk });
      });
      txt(ctx, 'φ = 9 + 9 + 6 = 24', WX + HR + 230, WY - 200, { f: FONT.mono, size: 26, c: COL.white, a: S.k(2, 1, 1.5) * (1 - S.k(3, 1)), align: 'left' });
      txt(ctx, 'per step', WX + HR + 230, WY - 166, { f: FONT.body, it: true, w: 300, size: 19, c: COL.gold, a: S.k(2, 1, 2) * (1 - S.k(3, 1)), align: 'left' });
      // records tucked behind the cut, three per tick
      const ticks = Math.min(14, Math.floor(clamp(S.at(2) - 0.8, 0, 99) / 0.5) + (S.at(2) > 0.8 ? 1 : 0));
      const n = Math.max(0, ticks) * 3 + (S.at(3) > 0 ? Math.floor(S.at(3) * 2) * 3 : 0);
      for (let i = 0; i < Math.min(n, 180); i++) {
        const x = WX + HR + 240 + (i % 15) * 22, y = WY + 40 - Math.floor(i / 15) * 22;
        ctx.strokeStyle = rgba(COL.gold, 0.8 * hk * (1 - S.k(3, 1))); ctx.lineWidth = 1.2; ctx.strokeRect(x, y, 15, 15);
      }
      txt(ctx, `records behind the cut: ${n}`, WX + HR + 240, WY + 100, { f: FONT.mono, size: 18, c: COL.gold, a: hk * (1 - S.k(3, 1)), align: 'left' });
    }
    // 81 x 81 = 6561 at two placements
    const gk = S.k(3, 1.5);
    if (gk > 0) {
      const GX = 560, GY = -150, s = 3.4;
      ctx.save(); ctx.globalAlpha = gk;
      for (let i = 0; i < 81; i += 1) for (let j = 0; j < 81; j += 1) {
        if ((i * 81 + j) > 6561 * eout(S.k(3, 2.5))) continue;
        const v = 0.5 + 0.5 * Math.sin(i * 0.3 + j * 0.21 + T);
        ctx.fillStyle = rgba(mix(COL.violet, COL.gold, v), 0.55); ctx.fillRect(GX - 138 + j * s, GY - 138 + i * s, s - 0.6, s - 0.6);
      }
      ctx.restore();
      txt(ctx, '81² = 6561', GX, GY + 180, { f: FONT.body, size: 40, w: 300, c: COL.white, a: gk, glow: COL.amber, blur: 18 });
      txt(ctx, 'the horizon register', GX - 150, GY + 230, { f: FONT.body, it: true, w: 300, size: 20, c: COL.white, a: gk * S.k(3, 1, 1.5) });
      txt(ctx, '=', GX, GY + 230, { f: FONT.mono, size: 20, c: COL.gold, a: gk * S.k(3, 1, 2.5) });
      txt(ctx, 'the Higgs vacuum at every hub', GX + 168, GY + 230, { f: FONT.body, it: true, w: 300, size: 20, c: COL.gold, a: gk * S.k(3, 1, 2.5) });
      // link to the heart of the web
      const lk = S.k(3, 1.5, 3);
      ctx.save(); ctx.setLineDash([4, 7]); ctx.lineDashOffset = -T * 20;
      ctx.beginPath(); ctx.moveTo(GX - 140, GY); ctx.quadraticCurveTo(WX + 200, WY - 300, lerp(GX - 140, WX, lk), lerp(GY, WY, lk)); stroke(ctx, COL.gold, 0.7 * lk, 1.5); ctx.restore();
      qudit(ctx, WX, WY, 26, 4, Math.PI / 4 + T * 0.3, COL.gold, lk, 2.4); glow(ctx, WX, WY, 120, COL.gold, 0.6 * lk);
    }
    // the arrow of time: records only accumulate
    const ak = S.k(4, 1.5);
    if (ak > 0) {
      const ox = -560, oy = 560, w = 1120, h = 190, grow = S.k(4, 8, 0.5);
      seg(ctx, ox, oy, ox + w + 30, oy, COL.white, 0.6 * ak, 1.5); arrowHead(ctx, ox + w + 36, oy, 0, 12, COL.white, 0.6 * ak);
      txt(ctx, 'time', ox + w + 30, oy + 30, { f: FONT.body, it: true, size: 20, c: COL.white, a: 0.7 * ak });
      ctx.beginPath(); ctx.moveTo(ox, oy);
      let y = oy, steps = Math.floor(48 * grow);
      for (let i = 0; i < steps; i++) { const x = ox + (i + 1) * w / 48; const ny = y - (1.5 + hash2(i, 4, 4) * 5.5); ctx.lineTo(x, y); ctx.lineTo(x, ny); y = ny; }
      stroke(ctx, COL.gold, ak, 2.4);
      glow(ctx, ox + steps * w / 48, y, 50, COL.gold, ak);
      txt(ctx, 'records: added, never erased   ΔB ≥ 0', ox, oy - h - 10, { f: FONT.mono, size: 20, c: COL.gold, a: ak, align: 'left' });
      txt(ctx, 'strictly increasing along all 182,940 forward edges', ox, oy - h + 22, { f: FONT.body, it: true, w: 300, size: 19, c: COL.white, a: 0.75 * ak, align: 'left' });
    }
  },
};

/* ===================== 12. Predictions ===================== */
SCENES.predictions = {
  P: [[-600, -150], [-190, -260], [230, -260], [630, -150], [20, 180]],
  cam(S) { return { x: 0, y: -40, z: 1 }; },
  draw(ctx, S) {
    const T = S.T, R = 165;
    // constellation lines
    const ck = S.k(0, 2);
    for (let i = 0; i < this.P.length; i++) { const a = this.P[i], b = this.P[(i + 1) % this.P.length]; ctx.save(); ctx.setLineDash([2, 9]); seg(ctx, a[0], a[1], lerp(a[0], b[0], ck), lerp(a[1], b[1], ck), COL.gold, 0.4 * ck, 1.2); ctx.restore(); }
    txt(ctx, 'FIVE WAYS TO BE WRONG', 0, -480, { size: 30, w: 600, ls: 10, c: COL.gold, a: ck });
    const frame = (i, k, title) => {
      const [x, y] = this.P[i];
      disc(ctx, x, y, R, [8, 10, 24], 0.85 * k); ring(ctx, x, y, R, COL.gold, 0.8 * k, 2); glow(ctx, x, y, R * 1.6, COL.gold, 0.12 * k);
      txt(ctx, title, x, y - R - 26, { size: 21, w: 600, ls: 4, c: COL.gold, a: k });
      return [x, y];
    };
    // 1. alpha digits
    let k = S.k(1, 1.2) || ck * 0.25;
    if (k > 0) {
      const [x, y] = frame(0, k, 'THE NEXT DIGITS OF α');
      const shrink = S.k(1, 3, 2.5), err = lerp(21, 2, shrink) * 3.2;
      seg(ctx, x - 130, y + 40, x + 130, y + 40, COL.white, 0.4 * k, 1);
      const pos = v => x + (v - 184) * 3.2;
      ctx.fillStyle = rgba(COL.white, 0.15 * k); ctx.fillRect(pos(177) - err, y + 28, err * 2, 24);
      dot(ctx, pos(177), y + 40, 4, COL.white, k);
      [[179, COL.gold, '…179', -1], [190, COL.grey, '…190', 1]].forEach(([v, c, s, d]) => { seg(ctx, pos(v), y + 10, pos(v), y + 70, c, k, 2.4); txt(ctx, s, pos(v) + d * 14, d < 0 ? y - 6 : y + 86, { f: FONT.mono, size: 18, c, a: k, align: d < 0 ? 'right' : 'left' }); });
      txt(ctx, 'gold: closed loop · grey: bare link', x, y + 118, { f: FONT.body, it: true, w: 300, size: 17, c: COL.white, a: 0.75 * k });
      txt(ctx, '137.035999…', x, y - 60, { f: FONT.mono, size: 22, c: COL.white, a: k });
    }
    // 2. step decoherence
    k = S.k(2, 1.2) || ck * 0.25;
    if (k > 0) {
      const [x, y] = frame(1, k, 'ONE-STEP DECOHERENCE');
      const ox = x - 110, oy = y + 60;
      seg(ctx, ox, oy, ox + 220, oy, COL.white, 0.5 * k, 1); seg(ctx, ox, oy, ox, oy - 130, COL.white, 0.5 * k, 1);
      ctx.beginPath(); for (let i = 0; i <= 40; i++) ctx.lineTo(ox + i * 5.5, oy - 120 * Math.exp(-i * 0.08)); stroke(ctx, COL.blue, 0.7 * k, 1.6);
      ctx.beginPath(); ctx.moveTo(ox, oy - 120); ctx.lineTo(ox + 22, oy - 120); ctx.lineTo(ox + 22, oy - 1); ctx.lineTo(ox + 220, oy - 1); stroke(ctx, COL.gold, k, 2.6);
      txt(ctx, 'no exponential tail', x, y + 100, { f: FONT.body, it: true, w: 300, size: 17, c: COL.white, a: 0.75 * k });
    }
    // 3. point-like, stable
    k = S.k(3, 1.2) || ck * 0.25;
    if (k > 0) {
      const [x, y] = frame(2, k, 'WHAT WE WILL NOT SEE');
      const items = ['substructure', 'proton decay', 'a 4th generation', 'superpartners'];
      items.forEach((s, i) => {
        const kk = S.k(3, 0.6, 0.5 + i * 1.3) || ck * 0.25;
        txt(ctx, s, x + 10, y - 70 + i * 46, { f: FONT.body, w: 300, size: 21, c: COL.white, a: kk * 0.9 });
        const w = measure(ctx, s, { f: FONT.body, w: 300, size: 21 });
        seg(ctx, x + 10 - w / 2 - 6, y - 70 + i * 46, x + 10 + w / 2 + 6, y - 70 + i * 46, COL.red, kk * S.k(3, 0.4, 1 + i * 1.3), 2);
      });
    }
    // 4. Higgs-horizon identity (from the metabolism chapter)
    k = S.k(3, 1.2, 4) || ck * 0.25;
    if (k > 0) {
      const [x, y] = frame(3, k, 'ONE REGISTER, TWO PLACES');
      txt(ctx, '81² = 6561', x, y - 20, { f: FONT.body, size: 38, w: 300, c: COL.white, a: k });
      txt(ctx, 'Higgs vacuum  =  cosmic horizon', x, y + 34, { f: FONT.body, it: true, w: 300, size: 18, c: COL.gold, a: k });
      txt(ctx, 'Λ = 36⁻⁶³ ≈ 1.07 × 10⁻⁹⁸', x, y + 78, { f: FONT.mono, size: 16, c: COL.white, a: 0.7 * k });
    }
    // 5. the dark share
    k = S.k(4, 1.2) || ck * 0.25;
    if (k > 0) {
      const [x, y] = frame(4, k, 'A COSMOS THAT BRIGHTENS');
      const ox = x - 120, oy = y + 70, w = 240, h = 150;
      const Y = v => oy - (v - 60) / 40 * h;
      seg(ctx, ox, oy, ox + w, oy, COL.white, 0.5 * k, 1);
      ctx.fillStyle = rgba(COL.teal, 0.25 * k); ctx.fillRect(ox, Y(69.5), w, Y(67.5) - Y(69.5));
      txt(ctx, 'observed ≈ 68.5%', ox + w, Y(68.5) + 20, { f: FONT.mono, size: 13, c: COL.teal, a: k, align: 'right' });
      const g = S.k(4, 3, 0.8);
      const pts = [[0, 96.3], [0.25, 96.17], [0.45, 96.07], [1, 69.79]];
      ctx.beginPath(); pts.forEach(([u, v], i) => { const px = ox + u * w * g, py = Y(lerp(96.3, v, g)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); stroke(ctx, COL.gold, k, 2.4);
      txt(ctx, '96.3%', ox - 8, Y(96.3), { f: FONT.mono, size: 15, c: COL.gold, a: k, align: 'right' });
      txt(ctx, '69.8%', ox + w + 8, Y(69.79) - 14, { f: FONT.mono, size: 15, c: COL.gold, a: k * g, align: 'left' });
      txt(ctx, 'dark share: early horizon → termination', x, y + 104, { f: FONT.body, it: true, w: 300, size: 16, c: COL.white, a: 0.75 * k });
    }
  },
};

/* ===================== 13. Finale ===================== */
SCENES.finale = {
  init() { this.C = makeCell(23); this.V = makeVortex(700, 90, 31); },
  cam(S) { const p = eio(S.k(2, 4)); return { x: 0, y: lerp(-20, 0, p), z: lerp(1, 0.9, p) }; },
  draw(ctx, S) {
    const T = S.T;
    const ck = S.k(0, 2.5, -2);
    const zoomN = eio(S.k(1, 3, 0.5));
    drawCell(ctx, 0, -40, 330, T, ck, this.C, {
      nucleus: (nx, ny, nr) => {
        ctx.save(); ctx.beginPath(); ctx.arc(nx, ny, nr * 0.95, 0, TAU); ctx.clip();
        helix(ctx, nx, ny, nr * 1.9, nr * 0.32, T, ck * (1 - zoomN), COL.gold, COL.magenta, { k: 2.5, rungs: 16 });
        // a spiral galaxy in the nucleus
        const g = zoomN * ck;
        if (g > 0) {
          for (let i = 0; i < 260; i++) {
            const arm = i % 2, u = (i / 260), th = u * 9 + arm * Math.PI + T * 0.15, r = nr * 0.9 * u;
            dot(ctx, nx + Math.cos(th) * r + (hash2(i, 1, 2) - 0.5) * 10, ny + Math.sin(th) * r * 0.85 + (hash2(i, 3, 4) - 0.5) * 10, 1.2, i % 7 ? COL.white : COL.magenta, g * (1 - u * 0.5));
          }
          glow(ctx, nx, ny, nr * 0.6, COL.gold, g);
        }
        ctx.restore();
      },
      loop: S.k(2, 2), noLabels: true,
    });
    txt(ctx, 'a late, local echo of the oldest pattern', 0, 380, { f: FONT.body, it: true, w: 300, size: 24, c: COL.teal, a: S.k(1, 1.5, 3) * (1 - S.k(2, 1)) });
    const wk = S.k(2, 2, 0.5);
    txt(ctx, 'THE UNIVERSE, READING ITS OWN STORY', 0, -470, { size: 36, w: 500, ls: 12, c: COL.white, a: wk, glow: COL.amber, blur: 22 });
    const fk = S.k(3, 2);
    if (fk > 0) {
      ring(ctx, 0, -40, 520 + 20 * Math.sin(T), COL.gold, 0.35 * fk, 1.2);
      ctx.save(); ctx.setLineDash([2, 12]); ctx.lineDashOffset = T * 18; ring(ctx, 0, -40, 560, COL.gold, 0.3 * fk, 1.2); ctx.restore();
      ['read', 'interpret', 're-encode'].forEach((w, i) => {
        const t = -Math.PI / 6 + i * TAU / 3 + T * 0.04;
        txt(ctx, w, Math.cos(t) * 640, -40 + Math.sin(t) * 400, { size: 34, w: 400, it: true, c: COL.gold, a: S.k(3, 1, i * 1.3) });
      });
    }
  },
};

/* ===================== Measured against nature ===================== */
SCENE_SFX.scorecard = [[1, 1.0, 'shimmer', { vel: 0.2 }], [2, 9.0, 'tick', { f: 1320, vel: 0.18 }], [3, 1.0, 'tick', { f: 1320, vel: 0.18 }],
  [4, 1.0, 'tick', { f: 1320, vel: 0.15 }], [4, 2.0, 'tick', { f: 1480, vel: 0.15 }], [4, 3.0, 'tick', { f: 1660, vel: 0.15 }], [5, 0.8, 'bell', { f: 587.3, vel: 0.16 }]];
SCENE_SFX.hierarchy = [[1, 0.5, 'glitch', { vel: 0.16 }], [2, 0.6, 'whoosh', { dur: 3, vel: 0.14 }], [2, 3.4, 'shimmer', { vel: 0.25 }], [3, 0.5, 'bell', { f: 523.3, vel: 0.12 }], [4, 0.5, 'bell', { f: 784, vel: 0.14 }]];
SCENE_SFX.observed = [[1, 1.2, 'whoosh', { dur: 2.2, vel: 0.12 }], [1, 3.2, 'shimmer', { vel: 0.2 }], [2, 0.6, 'tick', { f: 990, vel: 0.15 }], [3, 0.8, 'bell', { f: 659.3, vel: 0.12 }],
  [4, 2.5, 'glitch', { vel: 0.18 }], [4, 4.5, 'glitch', { vel: 0.15 }], [5, 0.6, 'boom', { vel: 0.22 }]];

// a measurement axis with a band, a measured centre, and theory points
function measureAxis(ctx, x0, x1, y, a, o) {
  seg(ctx, x0, y, x1, y, COL.white, 0.5 * a, 1.4);
  (o.ticks || []).forEach(([v, s]) => { const x = o.X(v); seg(ctx, x, y - 6, x, y + 6, COL.white, 0.45 * a, 1); txt(ctx, s, x, y + 26, { f: FONT.mono, size: 15, c: COL.white, a: 0.55 * a }); });
  if (o.band) { const [lo, hi] = o.band; ctx.fillStyle = rgba(COL.teal, 0.22 * a); ctx.fillRect(o.X(lo), y - 34, o.X(hi) - o.X(lo), 68); ctx.strokeStyle = rgba(COL.teal, 0.5 * a); ctx.lineWidth = 1; ctx.strokeRect(o.X(lo), y - 34, o.X(hi) - o.X(lo), 68); }
  if (o.meas != null) { seg(ctx, o.X(o.meas), y - 44, o.X(o.meas), y + 44, COL.teal, a, 2); txt(ctx, o.measLabel || 'measured', o.X(o.meas), y + 62, { f: FONT.body, it: true, w: 300, size: 18, c: COL.teal, a }); }
  (o.pts || []).forEach(([v, c, s, up], i) => {
    const k = o.k ? o.k(i) : 1; if (k <= 0) return;
    const x = o.X(v), yy = y - (up ? 70 : -96) * 1;
    dot(ctx, x, y, 7, c, a * k);
    seg(ctx, x, y + (up ? -10 : 10), x, yy + (up ? 14 : -14), c, 0.5 * a * k, 1);
    txt(ctx, s, x, yy, { f: FONT.body, it: true, w: 300, size: 18, c, a: a * k });
  });
}

SCENES.scorecard = {
  ROWS: [
    ['fine-structure  α⁻¹', '137.0359991790', '137.035999177(21)', '+0.10 σ', 2],
    ['proton / electron', '1836.164', '1836.15267', '+6.2 ppm', 3],
    ['Koide  K', '0.666667', '0.666661(7)', '+0.8 σ', 4],
    ['muon / electron', '206.764', '206.76828', '−20 ppm', 4],
    ['tau / electron', '3474.26', '3477.23(23)', '−0.085 %', 4],
    ['generations', '3', '2.984(8)', 'exact', 5],
  ],
  init() { this.ring = Array.from({ length: 28 }, (_, i) => ({ c: [COL.gold, COL.cyan, COL.magenta, COL.violet, COL.teal, COL.amber][[0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5][i]], d: hash2(i, 3, 3) })); },
  cam(S) { return { x: 0, y: -40, z: 1 }; },
  draw(ctx, S) {
    const T = S.T, LX = -480, LY = -60;
    // left: 28 numbers, then each test in turn
    const ringA = S.k(0, 2) * (1 - S.k(2, 1.2));
    if (ringA > 0.01) {
      const R = 240, grow = S.k(1, 4, 0.5);
      ring(ctx, LX, LY, R, COL.gold, 0.25 * ringA, 1);
      this.ring.forEach((p, i) => {
        const k = clamp(grow * 28 - i * 0.9);
        const t = -Math.PI / 2 + i * TAU / 28 + T * 0.05, r = R + 10 * Math.sin(T + i);
        dot(ctx, LX + Math.cos(t) * r, LY + Math.sin(t) * r, 5, p.c, ringA * (0.3 + 0.7 * k));
        if (k > 0) seg(ctx, LX + Math.cos(t) * r * 0.86, LY + Math.sin(t) * r * 0.86, LX + Math.cos(t) * r * 0.97, LY + Math.sin(t) * r * 0.97, p.c, 0.4 * ringA * k, 1.2);
      });
      const n = Math.round(grow * 28);
      txt(ctx, String(n), LX, LY - 10, { f: FONT.body, size: 130, w: 300, c: COL.white, a: ringA * S.k(1, 1), glow: COL.amber, blur: 26 });
      txt(ctx, 'pure numbers', LX, LY + 74, { f: FONT.body, it: true, w: 300, size: 24, c: COL.gold, a: ringA * S.k(1, 1, 1) });
      txt(ctx, 'zero adjustable parameters', LX, LY + 108, { f: FONT.mono, size: 17, c: COL.white, a: 0.7 * ringA * S.k(1, 1, 2.5) });
      txt(ctx, 'evidence', LX, LY - 10, { size: 64, w: 300, it: true, c: COL.gold, a: ringA * (1 - S.k(1, 0.8)) * S.k(0, 2, 1) });
    }
    // alpha: the last three digits
    const aA = S.k(2, 1.2) * (1 - S.k(3, 1));
    if (aA > 0.01) {
      txt(ctx, '137.035999', LX, LY - 190, { f: FONT.body, size: 48, w: 300, c: COL.white, a: aA });
      txt(ctx, '…the last three digits, in units of 10⁻⁹', LX, LY - 145, { f: FONT.body, it: true, w: 300, size: 18, c: COL.gold, a: 0.8 * aA });
      const X = v => LX - 330 + (v - 140) * 11;
      const ptk = i => S.k(2, 1, 6 + i * 3);
      measureAxis(ctx, LX - 330, LX + 330, LY + 20, aA, { X, ticks: [[150, '150'], [170, '170'], [190, '190']], band: [156, 198], meas: 177, measLabel: 'measured 177 ± 21', pts: [[179, COL.gold, 'living universe · 179', true], [190, COL.grey, 'flat link · 190', true]].map((p, i) => i ? [p[0], p[1], p[2], false] : p), k: ptk });
    }
    // proton / electron in ppm
    const pA = S.k(3, 1.2) * (1 - S.k(4, 1));
    if (pA > 0.01) {
      txt(ctx, 'proton / electron mass', LX, LY - 190, { size: 30, w: 600, ls: 5, c: COL.white, a: pA });
      txt(ctx, 'parts per million from the measured 1836.15267', LX, LY - 150, { f: FONT.body, it: true, w: 300, size: 18, c: COL.gold, a: 0.8 * pA });
      const X = v => LX - 300 + (v + 5) * 20;
      measureAxis(ctx, LX - 300, LX + 300, LY + 20, pA, { X, ticks: [[0, '0'], [10, '+10'], [20, '+20']], band: [-0.3, 0.3], meas: 0, measLabel: 'measured', pts: [[6.2, COL.gold, 'closed loop · +6.2', true], [18.4, COL.grey, 'flat · +18.4', true]], k: i => S.k(3, 1, 2 + i * 2) });
    }
    // Koide circle
    const kA = S.k(4, 1.2) * (1 - S.k(5, 1));
    if (kA > 0.01) {
      const R = 190, m = [0.511, 105.66, 1776.9].map(Math.sqrt), mean = (m[0] + m[1] + m[2]) / 3;
      ring(ctx, LX, LY, R, COL.cyan, 0.7 * kA, 1.6);
      ring(ctx, LX, LY, R * Math.SQRT1_2, COL.white, 0.2 * kA, 1);
      seg(ctx, LX - R - 30, LY, LX + R + 30, LY, COL.white, 0.2 * kA, 1);
      ['e', 'μ', 'τ'].forEach((n, i) => {
        const t = 0.2222 + i * TAU / 3 - T * 0.1, r = R;
        const px = LX + Math.cos(t) * r, py = LY + Math.sin(t) * r;
        seg(ctx, LX, LY, px, py, COL.cyan, 0.6 * kA, 1.4); dot(ctx, px, py, 8, COL.cyan, kA);
        txt(ctx, n, px + Math.cos(t) * 30, py + Math.sin(t) * 30, { size: 30, it: true, c: COL.white, a: kA });
      });
      txt(ctx, 'K = 2/3', LX, LY + R + 60, { f: FONT.mono, size: 24, c: COL.gold, a: kA });
      txt(ctx, 'measured 0.666661 ± 0.000007', LX, LY + R + 94, { f: FONT.mono, size: 16, c: COL.teal, a: 0.85 * kA });
    }
    // Z lineshape: two, three or four light neutrinos
    const zA = S.k(5, 1.2);
    if (zA > 0.01) {
      const ox = LX - 300, oy = LY + 150, w = 600, h = 300;
      seg(ctx, ox, oy, ox + w, oy, COL.white, 0.5 * zA, 1.2); seg(ctx, ox, oy, ox, oy - h - 20, COL.white, 0.5 * zA, 1.2);
      txt(ctx, 'collision energy near the Z', ox + w, oy + 28, { f: FONT.mono, size: 14, c: COL.white, a: 0.6 * zA, align: 'right' });
      [[2, COL.grey], [3, COL.gold], [4, COL.grey]].forEach(([n, c]) => {
        const peak = h * 1.25 / (1 + 0.2 * n), g = 50 + n * 4;
        ctx.beginPath(); for (let i = 0; i <= 120; i++) { const x = i / 120, d = (x - 0.5) * 600; const v = peak * g * g / (d * d + g * g); i ? ctx.lineTo(ox + x * w, oy - v) : ctx.moveTo(ox + x * w, oy - v); }
        stroke(ctx, c, zA * (n === 3 ? 1 : 0.5), n === 3 ? 2.4 : 1.4);
        txt(ctx, `N = ${n}`, ox + w * 0.5 + 6, oy - peak - 14, { f: FONT.mono, size: 15, c, a: zA, align: 'left' });
      });
      for (let i = 0; i < 13; i++) { const x = 0.2 + i * 0.05, d = (x - 0.5) * 600, g = 62, v = h * 1.25 / 1.6 * g * g / (d * d + g * g) + Math.sin(i * 7) * 3; dot(ctx, ox + x * w, oy - v, 3.5, COL.white, zA * S.k(5, 1, 1 + i * 0.12)); }
      txt(ctx, 'three generations · measured N_ν = 2.984 ± 0.008', LX, oy + 64, { f: FONT.body, it: true, w: 300, size: 19, c: COL.gold, a: zA });
    }
    // right: the ledger
    const hk = S.k(1, 1.5, 3);
    const CX = [70, 520, 760, 930];
    if (hk > 0) {
      txt(ctx, 'THE SCORECARD', CX[0], -400, { size: 26, w: 600, ls: 8, c: COL.gold, a: hk, align: 'left' });
      txt(ctx, 'CODATA 2022 · Particle Data Group', CX[3], -400, { f: FONT.body, it: true, w: 300, size: 17, c: COL.white, a: 0.7 * hk, align: 'right' });
      ['', 'THEORY', 'MEASURED', 'OFF BY'].forEach((h, i) => { if (h) txt(ctx, h, CX[i], -340, { f: FONT.mono, size: 14, c: COL.white, a: 0.55 * hk, align: 'right' }); });
      seg(ctx, CX[0], -318, CX[3], -318, COL.white, 0.25 * hk, 1);
    }
    this.ROWS.forEach(([n, th, me, off, li], r) => {
      const sub = r >= 2 && r <= 4 ? (r - 2) * 1.0 : 0;
      const k = S.k(li, 0.8, 1 + sub);
      if (k <= 0) return;
      const y = -280 + r * 64;
      const hl = S.at(li) > 0 && S.at(li) < 12 ? 1 : 0;
      if (hl) { ctx.fillStyle = rgba(COL.gold, 0.06 * k); ctx.fillRect(CX[0] - 14, y - 26, CX[3] - CX[0] + 28, 52); }
      txt(ctx, n, CX[0], y, { f: FONT.body, w: 300, size: 22, c: COL.white, a: k, align: 'left' });
      txt(ctx, th, CX[1], y, { f: FONT.mono, size: 19, c: COL.gold, a: k, align: 'right' });
      txt(ctx, me, CX[2], y, { f: FONT.mono, size: 19, c: COL.teal, a: k, align: 'right' });
      txt(ctx, off, CX[3], y, { f: FONT.mono, size: 19, c: COL.white, a: k, align: 'right' });
      seg(ctx, CX[0], y + 32, CX[3], y + 32, COL.white, 0.08 * k, 1);
    });
  },
};

/* ===================== Righting the hierarchy ===================== */
SCENES.hierarchy = {
  Q: [['u', 1, 0.478, 0.46], ['d', 1, 1, 1], ['s', 27.2, 21.59, 20], ['c', 0.76, 300.7, 272], ['b', 914, 952.3, 895], ['t', 44, 40693, 36987]],
  B: [['W', 1, 1, 1], ['Z', 1, 1.1338, 1.1346], ['H', 0.5714, 1.5633, 1.5584]],
  cam(S) { return { x: 0, y: -30, z: 1 }; },
  draw(ctx, S) {
    const T = S.T, m = eio(S.k(2, 3, 0.4)), bm = eio(S.k(2, 3, 1.6));
    const base = 250, Y = v => base - (Math.log10(v) + 0.7) * 88;
    // quark ladder
    const qa = S.k(0, 1.4);
    txt(ctx, 'QUARK MASSES', -480, -440, { size: 26, w: 600, ls: 8, c: m > 0.5 ? COL.gold : COL.grey, a: qa });
    txt(ctx, 'relative to the down quark · log scale', -480, -404, { f: FONT.body, it: true, w: 300, size: 18, c: COL.white, a: 0.7 * qa });
    for (let d = 0; d <= 5; d++) { const y = Y(Math.pow(10, d)); seg(ctx, -840, y, -120, y, COL.white, 0.08 * qa, 1); txt(ctx, d ? `10${'⁰¹²³⁴⁵'[d]}` : '1', -856, y, { f: FONT.mono, size: 14, c: COL.white, a: 0.45 * qa, align: 'right' }); }
    this.Q.forEach(([n, fl, cl, ex], i) => {
      const k = S.k(0, 0.8, 0.5 + i * 0.25); if (k <= 0) return;
      const x = -780 + i * 120, v = Math.exp(lerp(Math.log(fl), Math.log(cl), m)), top = Y(v);
      const c = mix(COL.grey, COL.gold, m);
      const g = ctx.createLinearGradient(0, top, 0, base); g.addColorStop(0, rgba(c, 0.9 * k)); g.addColorStop(1, rgba(c, 0.12 * k));
      ctx.fillStyle = g; ctx.fillRect(x - 30, top, 60, (base - top) * eout(k));
      glow(ctx, x, top, 50, c, 0.4 * k);
      txt(ctx, n, x, base + 34, { size: 36, it: true, c: COL.white, a: k });
      const pk = S.k(2, 1, 3.4);
      if (pk > 0) { seg(ctx, x - 42, Y(ex), x + 42, Y(ex), COL.teal, pk, 2.4); }
    });
    // what was wrong
    const wk = S.k(1, 0.8) * (1 - m);
    if (wk > 0.01) {
      [[2, 3, 'charm < strange', 1.0], [4, 5, 'top < bottom', 3.5], [0, 1, 'up = down', 0]].forEach(([a, b, s, off]) => {
        const kk = S.k(1, 0.6, off) * (1 - m); if (kk <= 0) return;
        const xa = -780 + a * 120, xb = -780 + b * 120, y = Math.min(Y(this.Q[a][1]), Y(this.Q[b][1])) - 60;
        ctx.save(); ctx.setLineDash([4, 5]); seg(ctx, xa, y + 20, xb, y + 20, COL.red, kk, 1.5); ctx.restore();
        txt(ctx, s, (xa + xb) / 2, y - 4, { f: FONT.mono, size: 16, c: COL.red, a: kk });
      });
      txt(ctx, 'FLAT LINK-COUNTING', -480, -360, { f: FONT.mono, size: 16, c: COL.red, a: wk });
    }
    const rk = S.k(2, 1.2, 4.5);
    txt(ctx, 'teal: measured (PDG)   ·   ratios within ~1.5 σ', -480, -360, { f: FONT.mono, size: 15, c: COL.teal, a: rk });
    // boson bars
    const BX = 220, BH = 290, Yb = v => base - v * BH * 0.62;
    txt(ctx, 'BOSON MASSES', 480, -200 + 0, { size: 26, w: 600, ls: 8, c: bm > 0.5 ? COL.gold : COL.grey, a: qa * S.k(0, 1, 1.5) });
    txt(ctx, 'relative to the W', 480, -166, { f: FONT.body, it: true, w: 300, size: 18, c: COL.white, a: 0.7 * qa * S.k(0, 1, 1.5) });
    this.B.forEach(([n, fl, cl, ex], i) => {
      const k = S.k(0, 0.8, 2 + i * 0.3) || S.k(1, 0.8); if (k <= 0) return;
      const x = BX + i * 120, v = lerp(fl, cl, bm), top = Yb(v), c = mix(COL.grey, i === 2 ? COL.magenta : COL.violet, bm);
      const g = ctx.createLinearGradient(0, top, 0, base); g.addColorStop(0, rgba(c, 0.9 * k)); g.addColorStop(1, rgba(c, 0.12 * k));
      ctx.fillStyle = g; ctx.fillRect(x - 32, top, 64, (base - top) * eout(k)); glow(ctx, x, top, 50, c, 0.4 * k);
      txt(ctx, n, x, base + 34, { size: 34, c: COL.white, a: k });
      if (S.k(2, 1, 4.6) > 0) seg(ctx, x - 44, Yb(ex), x + 44, Yb(ex), COL.teal, S.k(2, 1, 4.6), 2.4);
      if (i === 2) { const hk = S.k(1, 0.6, 5.5) * (1 - bm); txt(ctx, 'Higgs < W', x, top - 30, { f: FONT.mono, size: 16, c: COL.red, a: hk }); }
    });
    // photon and gluon: exactly zero
    const zk = S.k(4, 1.2);
    ['γ', 'g'].forEach((n, i) => {
      const x = BX + (3 + i) * 120;
      seg(ctx, x - 30, base, x + 30, base, COL.white, zk, 3); glow(ctx, x, base, 50, COL.white, 0.6 * zk);
      txt(ctx, n, x, base + 34, { size: 34, it: true, c: COL.white, a: zk });
      txt(ctx, '0', x, base - 30, { f: FONT.mono, size: 20, c: COL.gold, a: zk });
    });
    txt(ctx, '1 + e^(iπ) = 0  on the unbroken vacuum', BX + 420, base + 80, { f: FONT.mono, size: 16, c: COL.gold, a: S.k(4, 1, 1.5) });
    // electroweak readouts and the weak-angle triangle
    const ek = S.k(3, 1);
    const rows = [['sin²θ_W', '0.22217', '0.2232', '−0.45 %'], ['m_W / m_Z', '0.88195', '0.88136', '+0.067 %'], ['m_H / m_W', '1.5633', '1.5584', '+0.31 %']];
    rows.forEach(([n, a, b, d], i) => {
      const k = S.k(3, 0.6, 1.5 + i * 2.6); if (k <= 0) return;
      const y = -430 + i * 48;
      txt(ctx, n, 120, y, { f: FONT.mono, size: 20, c: COL.white, a: k, align: 'left' });
      txt(ctx, a, 400, y, { f: FONT.mono, size: 20, c: COL.gold, a: k, align: 'right' });
      txt(ctx, b, 530, y, { f: FONT.mono, size: 20, c: COL.teal, a: k, align: 'right' });
      txt(ctx, d, 670, y, { f: FONT.mono, size: 20, c: COL.white, a: k, align: 'right' });
    });
    if (ek > 0) {
      const tx = 720, ty = -300, L = 170, th = Math.acos(0.88195);
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + L, ty); ctx.lineTo(tx + L, ty - L * Math.tan(th)); ctx.closePath(); stroke(ctx, COL.violet, ek, 2);
      ring(ctx, tx, ty, 46, COL.gold, ek, 1.6, -th, 0);
      txt(ctx, 'θ_W', tx + 62, ty - 14, { f: FONT.mono, size: 16, c: COL.gold, a: ek, align: 'left' });
      txt(ctx, 'm_W', tx + L / 2, ty + 20, { f: FONT.mono, size: 15, c: COL.white, a: 0.7 * ek });
      txt(ctx, 'm_Z', tx + L / 2 - 26, ty - L * Math.tan(th) / 2 - 18, { f: FONT.mono, size: 15, c: COL.white, a: 0.7 * ek });
    }
  },
};

/* ===================== From decays to the dark ===================== */
SCENES.observed = {
  PULL: [
    ['fine-structure α⁻¹', 1.46e-9], ['proton / electron', 6.2e-4], ['Koide K', 9e-4], ['muon / electron', 2.0e-3], ['W / Z mass', 0.067],
    ['tau / muon', 0.083], ['tau / electron', 0.085], ['Γτ / Γμ decay widths', 0.15], ['Higgs / W', 0.31], ['Higgs / Z', 0.38], ['weak angle sin²θ_W', 0.45],
    ['top / charm', 0.49], ['bottom / strange', 1.4], ['dark-sector share', 1.9], ['charm / strange', 2.4], ['Cabibbo |Vus|', 2.7, 1], ['top / bottom', 3.4, 1],
    ['Jarlskog J', 3.6], ['up / down', 4.0], ['|Vub|', 7.0, 1], ['strange / down', 7.9], ['|Vcb|', 9.3, 1],
  ],
  cam(S) { return { x: 0, y: -30, z: 1 }; },
  draw(ctx, S) {
    const T = S.T;
    const fadeAll = 1 - S.k(4, 1.2);
    // Jarlskog on a log axis
    const jA = S.k(1, 1.2) * fadeAll;
    if (jA > 0.01) {
      const X = v => -760 + (Math.log10(v) + 6) * 250, y = -300;
      txt(ctx, 'JARLSKOG INVARIANT', -760, -440, { size: 24, w: 600, ls: 7, c: COL.gold, a: jA, align: 'left' });
      txt(ctx, 'how quark mixing tells matter from antimatter', -760, -406, { f: FONT.body, it: true, w: 300, size: 18, c: COL.white, a: 0.75 * jA, align: 'left' });
      measureAxis(ctx, -760, 740, y, jA, { X, ticks: [[1e-6, '10⁻⁶'], [1e-5, '10⁻⁵'], [1e-4, '10⁻⁴'], [1e-3, '10⁻³'], [1e-2, '10⁻²'], [1e-1, '10⁻¹']], band: [2.93e-5, 3.23e-5], meas: 3.08e-5, measLabel: '', pts: [[2.97e-5, COL.gold, 'living universe · 2.97 × 10⁻⁵', true], [0.0962, COL.grey, 'flat · 0.0962', true]], k: i => S.k(1, 1, 2 + i * 1.2) });
      const ak = S.k(1, 1.6, 4);
      if (ak > 0) {
        const xa = X(0.0962), xb = X(3.2e-5);
        ctx.beginPath(); ctx.moveTo(xa, y + 50); ctx.quadraticCurveTo((xa + xb) / 2, y + 150, lerp(xa, xb + 20, ak), y + 50); stroke(ctx, COL.gold, 0.8 * ak, 1.8);
        if (ak > 0.95) arrowHead(ctx, xb + 20, y + 50, -Math.PI * 0.65, 12, COL.gold, ak);
        txt(ctx, '≈ 3,100 × closer', (xa + xb) / 2, y + 130, { f: FONT.body, it: true, size: 24, c: COL.gold, a: ak });
      }
    }
    // tau / muon decay widths
    const gA = S.k(2, 1.2) * fadeAll;
    if (gA > 0.01) {
      const y = -50;
      txt(ctx, 'Γτ / Γμ', -560, y, { f: FONT.body, size: 46, it: true, c: COL.white, a: gA });
      txt(ctx, 'leptonic decay widths', -560, y + 44, { f: FONT.body, it: true, w: 300, size: 18, c: COL.gold, a: 0.8 * gA });
      txt(ctx, '1.340 × 10⁶', -40, y - 8, { f: FONT.body, size: 50, w: 300, c: COL.gold, a: gA, glow: COL.amber, blur: 16 });
      txt(ctx, 'predicted', -40, y + 34, { f: FONT.mono, size: 15, c: COL.gold, a: 0.8 * gA });
      txt(ctx, '1.342 × 10⁶', 380, y - 8, { f: FONT.body, size: 50, w: 300, c: COL.teal, a: S.k(2, 1, 1.5) * fadeAll });
      txt(ctx, 'measured', 380, y + 34, { f: FONT.mono, size: 15, c: COL.teal, a: 0.8 * S.k(2, 1, 1.5) * fadeAll });
      txt(ctx, '−0.15 %', 650, y - 8, { f: FONT.mono, size: 22, c: COL.white, a: S.k(2, 1, 3) * fadeAll, align: 'left' });
    }
    // shells, matter over antimatter, dark share
    const bA = S.k(3, 1.2) * fadeAll, y = 165;
    if (bA > 0.01) {
      const sk = S.k(3, 1, 0), SX = -560;
      [2, 8, 18, 32].forEach((n, i) => {
        const r = 34 + i * 34, k = S.k(3, 0.8, 0.4 + i * 0.7);
        ring(ctx, SX, y, r, COL.cyan, 0.4 * bA * k, 1.2);
        for (let e = 0; e < n; e++) { const t = e / n * TAU + T * (0.4 - i * 0.07); dot(ctx, SX + Math.cos(t) * r, y + Math.sin(t) * r, 2.6, COL.white, bA * k); }
        txt(ctx, String(n), SX + r + 6, y - 8 - i * 4, { f: FONT.mono, size: 14, c: COL.cyan, a: bA * k, align: 'left' });
      });
      dot(ctx, SX, y, 9, COL.red, bA * sk);
      txt(ctx, 'atomic shells 2 · 8 · 18 · 32', SX, y + 162, { f: FONT.body, it: true, w: 300, size: 19, c: COL.cyan, a: bA * sk });
      const mk = S.k(3, 1, 4.5), tilt = 0.18 * eout(S.k(3, 2, 5)), MX = 0;
      if (mk > 0) {
        polyPath(ctx, MX, y + 50, 30, 3); stroke(ctx, COL.gold, bA * mk, 2);
        const lx = MX - Math.cos(tilt) * 150, ly = y - Math.sin(-tilt) * 150, rx = MX + Math.cos(tilt) * 150, ry = y - Math.sin(tilt) * 150;
        seg(ctx, lx, ly, rx, ry, COL.gold, bA * mk, 3);
        for (let i = 0; i < 6; i++) disc(ctx, lx - 30 + (i % 3) * 24, ly + 24 + Math.floor(i / 3) * 20, 10, COL.gold, bA * mk * 0.85);
        disc(ctx, rx, ry + 26, 9, COL.violet, bA * mk * 0.7);
        txt(ctx, 'matter', lx, ly + 84, { f: FONT.body, it: true, size: 20, c: COL.gold, a: bA * mk });
        txt(ctx, 'antimatter', rx, ry + 70, { f: FONT.body, it: true, size: 20, c: COL.violet, a: bA * mk });
        txt(ctx, 'the right sign: 784 lowering edges vs 8 raising', MX, y + 162, { f: FONT.body, it: true, w: 300, size: 19, c: COL.gold, a: bA * mk });
      }
      const dk = S.k(3, 1, 8.5), DX = 560;
      if (dk > 0) {
        const R = 120, frac = 0.6979 * eout(S.k(3, 2.5, 8.5));
        ring(ctx, DX, y, R, COL.white, 0.12 * bA * dk, 18);
        ring(ctx, DX, y, R, COL.violet, bA * dk, 18, -Math.PI / 2, -Math.PI / 2 + TAU * frac);
        const ob = -Math.PI / 2 + TAU * 0.685;
        seg(ctx, DX + Math.cos(ob) * (R - 22), y + Math.sin(ob) * (R - 22), DX + Math.cos(ob) * (R + 22), y + Math.sin(ob) * (R + 22), COL.teal, bA * dk, 3);
        txt(ctx, (frac * 100).toFixed(1) + '%', DX, y - 6, { f: FONT.body, size: 38, w: 300, c: COL.white, a: bA * dk });
        txt(ctx, 'observed 68.5%', DX, y + 30, { f: FONT.mono, size: 14, c: COL.teal, a: bA * dk });
        txt(ctx, 'dark share of the cosmos', DX, y + 162, { f: FONT.body, it: true, w: 300, size: 19, c: COL.violet, a: bA * dk });
      }
    }
    // the honest picture: every number, by its distance from measurement
    const pA = S.k(4, 1.4);
    if (pA > 0.01) {
      const X = p => -700 + (Math.log10(p) + 9.5) * 118, top = -380, rh = 25, L = this.PULL;
      txt(ctx, 'EVERY NUMBER, BY ITS DISTANCE FROM MEASUREMENT', -40, -450, { size: 24, w: 600, ls: 6, c: COL.gold, a: pA });
      const ay = top + L.length * rh + 6;
      seg(ctx, -720, ay, 520, ay, COL.white, 0.5 * pA, 1.2);
      [[-9, '10⁻⁹ %'], [-6, '10⁻⁶ %'], [-3, '0.001 %'], [-1, '0.1 %'], [0, '1 %'], [1, '10 %']].forEach(([e, s]) => { const x = X(Math.pow(10, e)); seg(ctx, x, top - 10, x, ay, COL.white, 0.08 * pA, 1); txt(ctx, s, x, ay + 22, { f: FONT.mono, size: 14, c: COL.white, a: 0.55 * pA }); });
            L.forEach(([n, p, miss], i) => {
        const k = S.k(4, 0.5, 0.6 + i * 0.12) * pA; if (k <= 0) return;
        const yy = top + i * rh, x = X(p), c = miss ? COL.red : COL.gold;
        ctx.save(); ctx.setLineDash([2, 5]); seg(ctx, x + 8, yy, 600, yy, c, 0.25 * k, 1); ctx.restore();
        dot(ctx, x, yy, 5, c, k);
        txt(ctx, n, 612, yy, { f: FONT.body, w: 300, size: 17, c: miss ? COL.red : COL.white, a: k, align: 'left' });
        const sup = n => String(n).split('').map(ch => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(ch)] || (ch === '-' ? '⁻' : ch)).join('');
        const ex = Math.floor(Math.log10(p)), lab = p < 0.01 ? `${(p / Math.pow(10, ex)).toFixed(1)}×10${sup(ex)} %` : p + ' %';
        txt(ctx, lab, 900, yy, { f: FONT.mono, size: 14, c, a: 0.75 * k, align: 'right' });
      });
      txt(ctx, 'red: outside the measured band', 520, ay + 50, { f: FONT.mono, size: 14, c: COL.red, a: S.k(4, 1, 2.5), align: 'right' });
      txt(ctx, 'quark masses carry wide experimental bands', -720, ay + 50, { f: FONT.body, it: true, w: 300, size: 16, c: COL.white, a: 0.6 * S.k(4, 1, 2.5), align: 'left' });
      txt(ctx, 'exact: three generations · shells 2, 8, 18, 32 · massless photon and gluon · matter over antimatter', -100, ay + 86, { f: FONT.body, it: true, w: 300, size: 17, c: COL.gold, a: S.k(4, 1, 3.5) });
      const ok = S.k(4, 1, 11);
      if (ok > 0) {
        ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = rgba(COL.white, 0.5 * ok); ctx.lineWidth = 1.2; ctx.strokeRect(-890, top - 30, 150, 150); ctx.restore();
        txt(ctx, 'STILL OPEN', -815, top - 2, { size: 17, w: 600, ls: 4, c: COL.white, a: ok });
        txt(ctx, 'neutrino masses', -815, top + 42, { f: FONT.body, it: true, w: 300, size: 16, c: COL.white, a: 0.8 * ok });
        txt(ctx, 'and mixing', -815, top + 62, { f: FONT.body, it: true, w: 300, size: 16, c: COL.white, a: 0.8 * ok });
        txt(ctx, 'gravity’s field', -815, top + 92, { f: FONT.body, it: true, w: 300, size: 16, c: COL.white, a: 0.8 * ok });
        txt(ctx, 'equation', -815, top + 112, { f: FONT.body, it: true, w: 300, size: 16, c: COL.white, a: 0.8 * ok });
      }
      const fk = S.k(5, 1.5);
      txt(ctx, 'as reported by the framework · awaiting independent checks', -40, -412, { f: FONT.body, it: true, w: 300, size: 19, c: COL.white, a: 0.85 * fk });
    }
  },
};
