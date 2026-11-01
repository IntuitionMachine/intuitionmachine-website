/* Audio engine: Kokoro narration, FluidR3 score performed in JS, synthesized SFX.
   Everything is a pure function of film time, so seeking re-schedules cleanly. */
(function () {
'use strict';
const A = {};
window.FilmAudio = A;

let ctx = null, master, comp, voiceGain, musicBus, musicDuck, sfxBus, reverb, revSend, sfxRev;
let session = null;            // per-play gain node; dropped on pause/seek
let narrBuf = null, narrSrc = null;
const SF = {};                 // inst -> [{midi, buf}]
let events = [];               // scheduled score + sfx, sorted by t
let ptr = 0;
let t0 = 0;                    // ctx time at film time 0
let playing = false;
let noiseBuf = null;
A.musicVol = 1; A.voiceVol = 1;

const NOTE = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
const nameToMidi = n => { const m = n.match(/^([A-G]b?)(-?\d)$/); return 12 * (+m[2] + 1) + NOTE[m[1]]; };

// deterministic random
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

A.init = async function (onProgress) {
  ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'playback' });
  comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.4;
  master = ctx.createGain(); master.gain.value = 0.95;
  comp.connect(master); master.connect(ctx.destination);
  voiceGain = ctx.createGain(); voiceGain.gain.value = 1.0; voiceGain.connect(comp);
  musicDuck = ctx.createGain(); musicDuck.gain.value = 1; musicDuck.connect(comp);
  musicBus = ctx.createGain(); musicBus.gain.value = 1.5; musicBus.connect(musicDuck);
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(comp);
  reverb = ctx.createConvolver(); reverb.buffer = makeIR(5.2, 2.6);
  const revOut = ctx.createGain(); revOut.gain.value = 0.9; reverb.connect(revOut); revOut.connect(musicDuck);
  revSend = ctx.createGain(); revSend.gain.value = 0.55; musicBus.connect(revSend); revSend.connect(reverb);
  sfxRev = ctx.createGain(); sfxRev.gain.value = 0.5; sfxBus.connect(sfxRev); sfxRev.connect(reverb);
  noiseBuf = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = noiseBuf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }

  let done = 0; const total = 2;
  const tick = () => onProgress && onProgress(++done / total);
  const [narr, sfbin] = await Promise.all([
    fetch('narration.mp3').then(r => r.arrayBuffer()).then(b => { tick(); return b; }),
    fetch('soundfont.mp3').then(r => r.arrayBuffer()).then(b => { tick(); return b; }),
  ]);
  const jobs = [ctx.decodeAudioData(narr).then(b => { narrBuf = b; })];
  for (const inst in SFINDEX) {
    SF[inst] = [];
    for (const nm in SFINDEX[inst]) {
      const [off, len] = SFINDEX[inst][nm];
      jobs.push(ctx.decodeAudioData(sfbin.slice(off, off + len)).then(b => { SF[inst].push({ midi: nameToMidi(nm), buf: b }); }));
    }
  }
  await Promise.all(jobs);
  for (const k in SF) SF[k].sort((a, b) => a.midi - b.midi);
  events = buildScore();
};

A._dbg = () => ({ ctx, master, musicBus, voiceGain, sfxBus });
A.resume = () => ctx && ctx.state !== 'running' ? ctx.resume() : Promise.resolve();
A.now = () => (ctx && playing) ? ctx.currentTime - t0 : null;
A.ready = () => !!narrBuf;

A.play = function (fromT) {
  if (!ctx) return;
  stopAll();
  playing = true;
  session = ctx.createGain(); session.gain.value = 1;
  const sm = ctx.createGain(); sm.connect(musicBus); session.connect(sm);
  session._sfx = ctx.createGain(); session._sfx.connect(sfxBus);
  session._music = session;
  const start = ctx.currentTime + 0.08;
  t0 = start - fromT;
  if (narrBuf && fromT < narrBuf.duration) {
    narrSrc = ctx.createBufferSource(); narrSrc.buffer = narrBuf;
    const g = ctx.createGain(); g.gain.value = 1; narrSrc.connect(g); g.connect(voiceGain);
    narrSrc.start(start, Math.max(0, fromT));
  }
  // find first event that is still sounding or upcoming
  ptr = 0;
  while (ptr < events.length && events[ptr].t + (events[ptr].dur || 0.5) < fromT) ptr++;
  pump(fromT, true);
};

A.pause = function () { stopAll(); playing = false; };

function stopAll() {
  if (narrSrc) { try { narrSrc.stop(); } catch (e) {} narrSrc = null; }
  if (session) {
    const s = session, now = ctx.currentTime;
    s.gain.cancelScheduledValues(now); s.gain.setValueAtTime(s.gain.value, now); s.gain.linearRampToValueAtTime(0, now + 0.25);
    s._sfx.gain.setValueAtTime(1, now); s._sfx.gain.linearRampToValueAtTime(0, now + 0.2);
    setTimeout(() => { try { s.disconnect(); s._sfx.disconnect(); } catch (e) {} }, 400);
    session = null;
  }
}

// called every frame by the engine
A.update = function (filmT, speaking) {
  if (!ctx || !playing) return;
  pump(filmT, false);
  const target = (speaking ? 0.42 : 1.0) * A.musicVol;
  musicDuck.gain.setTargetAtTime(target, ctx.currentTime, speaking ? 0.25 : 0.9);
  voiceGain.gain.setTargetAtTime(A.voiceVol, ctx.currentTime, 0.05);
};

function pump(filmT, catchUp) {
  const horizon = filmT + 0.35;
  while (ptr < events.length && events[ptr].t < horizon) {
    const e = events[ptr++];
    const late = filmT - e.t;
    if (late > 0) {
      if (!catchUp && late > 0.25) continue;            // missed (tab hidden): skip
      if (e.kind === 'sfx' && late > 0.3) continue;
      if (e.kind === 'note' && late > 0.3) continue;
      if (e.kind === 'sus') { // join a sustained chord already in progress
        const rem = e.dur - late; if (rem < 1.2) continue;
        fire(Object.assign({}, e, { t: filmT + 0.02, dur: rem, attack: 1.2 }));
        continue;
      }
    }
    fire(e);
  }
}

function at(filmT) { return Math.max(ctx.currentTime, t0 + filmT); }

function sample(inst, midi) {
  const arr = SF[inst]; if (!arr || !arr.length) return null;
  let best = arr[0];
  for (const s of arr) if (Math.abs(s.midi - midi) < Math.abs(best.midi - midi)) best = s;
  return { buf: best.buf, rate: Math.pow(2, (midi - best.midi) / 12) };
}

function panner(p) {
  if (ctx.createStereoPanner) { const n = ctx.createStereoPanner(); n.pan.value = p; return n; }
  return ctx.createGain();
}

function fire(e) {
  if (!session) return;
  if (e.kind === 'note') return playNote(e);
  if (e.kind === 'sus') return playSus(e);
  if (e.kind === 'sfx') { const f = SFX[e.type]; if (f) f(at(e.t), e); }
}

function playNote(e) {
  const s = sample(e.inst, e.midi); if (!s) return;
  const when = at(e.t);
  const src = ctx.createBufferSource(); src.buffer = s.buf; src.playbackRate.value = s.rate;
  const g = ctx.createGain(); const p = panner(e.pan || 0);
  const len = Math.min(e.dur || 3, s.buf.duration / s.rate);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(e.vel, when + (e.attack || 0.005));
  g.gain.setValueAtTime(e.vel, when + Math.max(0.01, len - (e.release || 0.6)));
  g.gain.linearRampToValueAtTime(0, when + len);
  src.connect(g); g.connect(p); p.connect(session);
  src.start(when); src.stop(when + len + 0.05);
}

// sustained tone from overlapping grains of a ~3 s FluidR3 sample
function playSus(e) {
  const s = sample(e.inst, e.midi); if (!s) return;
  const when = at(e.t), dur = e.dur;
  const atk = e.attack || 2, rel = e.release || 2.5;
  const ng = ctx.createGain(); const p = panner(e.pan || 0);
  ng.gain.setValueAtTime(0, when);
  ng.gain.linearRampToValueAtTime(e.vel, when + atk);
  ng.gain.setValueAtTime(e.vel, when + Math.max(atk, dur - 0.01));
  ng.gain.linearRampToValueAtTime(0, when + dur + rel);
  ng.connect(p); p.connect(session);
  const real = s.buf.duration / s.rate;
  const gl = Math.min(2.3, real - 0.45), step = gl * 0.55, off = 0.3;
  const end = when + dur + rel;
  for (let gt = when, i = 0; gt < end; gt += step, i++) {
    const src = ctx.createBufferSource(); src.buffer = s.buf; src.playbackRate.value = s.rate;
    const gg = ctx.createGain(); const x = gl * 0.42;
    gg.gain.setValueAtTime(i === 0 ? 1 : 0, gt);
    if (i) gg.gain.linearRampToValueAtTime(1, gt + x);
    gg.gain.setValueAtTime(1, gt + gl - x);
    gg.gain.linearRampToValueAtTime(0, gt + gl);
    src.connect(gg); gg.connect(ng);
    src.start(gt, i === 0 ? 0 : off * s.rate); src.stop(gt + gl + 0.02);
  }
}

function makeIR(sec, decay) {
  const rate = ctx.sampleRate, len = Math.floor(rate * sec);
  const b = ctx.createBuffer(2, len, rate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c); let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      lp = lp * 0.6 + (Math.random() * 2 - 1) * 0.4;     // darker tail
      d[i] = (i < rate * 0.02 ? 0 : 1) * lp * Math.pow(1 - t, decay) * (0.6 + 0.4 * Math.sin(i * 0.0007 + c));
    }
  }
  return b;
}

/* ---------------- code-generated sound effects (released CC0) ---------------- */
function noiseSrc(when, dur) {
  const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
  n.start(when, Math.random() * 3); n.stop(when + dur + 0.1); return n;
}
const out = () => session._sfx;
const SFX = {
  whoosh(when, e) {
    const dur = e.dur || 3, v = e.vel || 0.5;
    const n = noiseSrc(when, dur);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(180, when);
    bp.frequency.exponentialRampToValueAtTime(2600, when + dur * 0.55);
    bp.frequency.exponentialRampToValueAtTime(240, when + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(v, when + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    const p = panner(-0.8); if (p.pan) p.pan.linearRampToValueAtTime(0.8, when + dur);
    n.connect(bp); bp.connect(g); g.connect(p); p.connect(out());
    // sub swell
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(70, when); o.frequency.exponentialRampToValueAtTime(38, when + dur);
    const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, when);
    og.gain.exponentialRampToValueAtTime(v * 0.5, when + dur * 0.6); og.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(og); og.connect(out()); o.start(when); o.stop(when + dur + 0.05);
  },
  shimmer(when, e) {
    const v = e.vel || 0.25, scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    const r = mulberry(Math.floor(when * 1000));
    for (let i = 0; i < 14; i++) {
      const t = when + i * 0.045 + r() * 0.03;
      const f = 1046.5 * Math.pow(2, scale[Math.floor(r() * scale.length)] / 12);
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.76;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * 0.18, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      const g2 = ctx.createGain(); g2.gain.value = 0.25;
      const p = panner(r() * 1.6 - 0.8);
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(p); p.connect(out());
      o.start(t); o2.start(t); o.stop(t + 1.5); o2.stop(t + 1.5);
    }
  },
  boom(when, e) {
    const v = e.vel || 0.8;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(90, when); o.frequency.exponentialRampToValueAtTime(30, when + 2.2);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(v, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 3.2);
    o.connect(g); g.connect(out()); o.start(when); o.stop(when + 3.3);
    const n = noiseSrc(when, 1.5); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, when); lp.frequency.exponentialRampToValueAtTime(80, when + 1.2);
    const ng = ctx.createGain(); ng.gain.setValueAtTime(v * 0.6, when); ng.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
    n.connect(lp); lp.connect(ng); ng.connect(out());
  },
  wash(when, e) {   // the one-act projection: a swept noise that snaps shut
    const v = e.vel || 0.5;
    const n = noiseSrc(when, 1.6);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6;
    lp.frequency.setValueAtTime(9000, when); lp.frequency.exponentialRampToValueAtTime(140, when + 0.9);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(v, when + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.3);
    n.connect(lp); lp.connect(g); g.connect(out());
    SFX.tick(when + 0.92, { vel: v * 1.4, f: 880 });
  },
  tick(when, e) {
    const v = e.vel || 0.25, f = e.f || 1760;
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(v, when + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    const p = panner(e.pan || 0);
    o.connect(g); g.connect(p); p.connect(out()); o.start(when); o.stop(when + 0.25);
  },
  heartbeat(when, e) {
    const v = e.vel || 0.7;
    [0, 0.28].forEach((d, i) => {
      const t = when + d; const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(i ? 62 : 55, t); o.frequency.exponentialRampToValueAtTime(34, t + 0.25);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * (i ? 0.7 : 1), t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g); g.connect(out()); o.start(t); o.stop(t + 0.5);
    });
  },
  riser(when, e) {
    const dur = e.dur || 3, v = e.vel || 0.3;
    const n = noiseSrc(when, dur);
    const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.Q.value = 3;
    hp.frequency.setValueAtTime(300, when); hp.frequency.exponentialRampToValueAtTime(6000, when + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(v, when + dur * 0.95);
    g.gain.linearRampToValueAtTime(0, when + dur + 0.05);
    n.connect(hp); hp.connect(g); g.connect(out());
    [0, 7.02].forEach(det => {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(110 * Math.pow(2, det / 12), when); o.frequency.exponentialRampToValueAtTime(440 * Math.pow(2, det / 12), when + dur);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(400, when); f.frequency.exponentialRampToValueAtTime(3000, when + dur);
      const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, when); og.gain.exponentialRampToValueAtTime(v * 0.25, when + dur);
      og.gain.linearRampToValueAtTime(0, when + dur + 0.05);
      o.connect(f); f.connect(og); og.connect(out()); o.start(when); o.stop(when + dur + 0.1);
    });
  },
  bell(when, e) {   // FM bell
    const v = e.vel || 0.3, f = e.f || 523.25;
    const car = ctx.createOscillator(); car.frequency.value = f;
    const mod = ctx.createOscillator(); mod.frequency.value = f * 1.4;
    const mg = ctx.createGain(); mg.gain.setValueAtTime(f * 2.2, when); mg.gain.exponentialRampToValueAtTime(f * 0.05, when + 3);
    mod.connect(mg); mg.connect(car.frequency);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(v, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 4);
    const p = panner(e.pan || 0);
    car.connect(g); g.connect(p); p.connect(out());
    car.start(when); mod.start(when); car.stop(when + 4.1); mod.stop(when + 4.1);
  },
  glitch(when, e) {  // a "parting": short broken crackle
    const v = e.vel || 0.25; const r = mulberry(Math.floor(when * 977));
    for (let i = 0; i < 6; i++) {
      const t = when + i * 0.06 + r() * 0.03;
      const n = noiseSrc(t, 0.05); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 600 + r() * 3000; bp.Q.value = 8;
      const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      n.connect(bp); bp.connect(g); g.connect(out());
    }
  },
};

/* ---------------- the score ---------------- */
// chord: [bass, ...upper voices] as note names
const C = s => s.split(' ').map(nameToMidi);
const PROG = {
  title:       [C('D2 A3 D4 E4 F4 A4'), C('Bb1 F3 Bb3 D4 F4 A4'), C('F2 C4 F4 A4 C5'), C('C2 G3 C4 D4 G4')],
  hurricane:   [C('D2 A3 D4 F4 A4'), C('Bb1 F3 Bb3 D4 F4'), C('G1 G3 Bb3 D4 F4'), C('A1 E3 A3 D4 E4')],
  principles:  [C('F2 C4 F4 A4 C5'), C('E2 C4 E4 G4 C5'), C('D2 A3 D4 F4 A4'), C('Bb1 F3 Bb3 D4 F4 C5')],
  axiom:       [C('A1 E3 A3 B3 C4 E4'), C('F2 C4 E4 A4'), C('A1 E3 A3 C4 E4 B4'), C('G1 D3 G3 B3 D4')],
  alphabet:    [C('C2 G3 C4 E4 G4 D5'), C('F2 C4 F4 A4 B4 E5'), C('A1 E3 A3 C4 E4 B4'), C('G1 D3 G3 B3 D4 A4')],
  homeostasis: [C('D2 A3 D4 F4 A4'), C('Eb2 Bb3 Eb4 G4 Bb4'), C('D2 A3 D4 F4 A4'), C('C2 G3 C4 E4 G4')],
  horizon:     [C('Bb1 F3 Bb3 D4 F4 C5'), C('F2 C4 F4 A4 C5'), C('C2 G3 C4 E4 G4 D5'), C('D2 A3 D4 F4 A4 E5')],
  wash:        [C('E2 B3 E4 G4 B4'), C('C2 G3 C4 E4 G4 B4'), C('G1 D3 G3 B3 D4'), C('D2 A3 D4 Gb4 A4')],
  hub:         [C('D2 A3 D4 F4 A4'), C('Bb1 F3 Bb3 D4 F4'), C('F2 C4 F4 A4 C5'), C('C2 G3 C4 E4 G4')],
  ribosome:    [C('A1 E3 A3 C4 E4'), C('F2 C4 F4 A4 C5'), C('C2 G3 C4 E4 G4'), C('G1 D3 G3 B3 D4')],
  closure:     [C('F2 C4 F4 A4 C5'), C('A1 E3 A3 C4 E4'), C('D2 A3 D4 F4 A4'), C('Bb1 F3 Bb3 D4 F4 A4')],
  metabolism:  [C('D2 A3 D4 Gb4 A4'), C('A1 E3 A3 Db4 E4'), C('B1 Gb3 B3 D4 Gb4'), C('G1 D3 G3 B3 D4 A4')],
  predictions: [C('G1 D3 G3 Bb3 D4'), C('Eb2 Bb3 Eb4 G4 Bb4'), C('Bb1 F3 Bb3 D4 F4'), C('F2 C4 F4 A4 C5')],
  finale:      [C('D2 A3 D4 Gb4 A4 E5'), C('G1 D3 G3 B3 D4 Gb4'), C('B1 Gb3 B3 D4 Gb4'), C('A1 E3 A3 Db4 E4 A4')],
  credits:     [C('D2 A3 D4 Gb4 A4 E5'), C('G1 D3 G3 B3 D4 A4'), C('D2 A3 D4 Gb4 A4 E5')],
};
// per-section texture
const STYLE = {
  title:       { chord: 8,   arp: 'celesta', rate: 0.75, dens: 0.35, strings: 0.0, halo: 0.22, choir: 0.0 },
  hurricane:   { chord: 8,   arp: 'orchestral_harp', rate: 0.5, dens: 0.45, strings: 0.12, halo: 0.10, choir: 0 },
  principles:  { chord: 8,   arp: 'celesta', rate: 0.5, dens: 0.4, strings: 0.16, halo: 0.14, choir: 0.12 },
  axiom:       { chord: 9,   arp: 'fx_3_crystal', rate: 1.0, dens: 0.3, strings: 0.0, halo: 0.2, choir: 0 },
  alphabet:    { chord: 6,   arp: 'celesta', rate: 0.25, dens: 0.5, strings: 0.0, halo: 0.18, choir: 0 },
  homeostasis: { chord: 8,   arp: 'orchestral_harp', rate: 0.5, dens: 0.35, strings: 0.2, halo: 0.08, choir: 0.1 },
  horizon:     { chord: 8,   arp: 'orchestral_harp', rate: 0.25, dens: 0.35, strings: 0.22, halo: 0.1, choir: 0.16 },
  wash:        { chord: 7,   arp: 'fx_3_crystal', rate: 0.5, dens: 0.35, strings: 0.1, halo: 0.18, choir: 0 },
  hub:         { chord: 6,   arp: 'celesta', rate: 0.25, dens: 0.55, strings: 0.2, halo: 0.08, choir: 0.12 },
  ribosome:    { chord: 8,   arp: 'orchestral_harp', rate: 0.25, dens: 0.5, strings: 0.12, halo: 0.12, choir: 0 },
  closure:     { chord: 8,   arp: 'celesta', rate: 0.5, dens: 0.45, strings: 0.22, halo: 0.12, choir: 0.2 },
  metabolism:  { chord: 9,   arp: 'orchestral_harp', rate: 0.5, dens: 0.4, strings: 0.2, halo: 0.16, choir: 0.12 },
  predictions: { chord: 7,   arp: 'celesta', rate: 0.25, dens: 0.4, strings: 0.14, halo: 0.08, choir: 0 },
  finale:      { chord: 8,   arp: 'orchestral_harp', rate: 0.25, dens: 0.55, strings: 0.26, halo: 0.18, choir: 0.26 },
  credits:     { chord: 10,  arp: 'celesta', rate: 0.75, dens: 0.3, strings: 0.2, halo: 0.2, choir: 0.22 },
};

function buildScore() {
  const ev = [];
  const TL = TIMELINE;
  const sections = [{ id: 'title', s: 0, e: TL.title }];
  TL.scenes.forEach(sc => sections.push({ id: sc.id, s: sc.start, e: sc.end }));
  sections.push({ id: 'credits', s: TL.creditsStart, e: TL.duration });
  const r = mulberry(1980);
  sections.forEach((sec, si) => {
    const prog = PROG[sec.id], st = STYLE[sec.id];
    let t = sec.s, ci = 0;
    while (t < sec.e - 1) {
      let dur = st.chord;
      if (sec.e - (t + dur) < st.chord * 0.6) dur = sec.e - t;     // stretch last chord to the boundary
      const ch = prog[ci % prog.length];
      const bass = ch[0], up = ch.slice(1);
      const rel = 3.2;
      ev.push({ kind: 'sus', inst: 'pad_2_warm', midi: bass, t, dur, vel: 0.5, attack: 2.2, release: rel, pan: 0 });
      ev.push({ kind: 'sus', inst: 'pad_2_warm', midi: bass + 12, t, dur, vel: 0.16, attack: 2.5, release: rel, pan: 0 });
      up.slice(0, 4).forEach((m, i) => ev.push({ kind: 'sus', inst: 'pad_2_warm', midi: m, t: t + i * 0.12, dur, vel: 0.2, attack: 2.4, release: rel, pan: (i - 1.5) * 0.3 }));
      if (st.strings) up.slice(0, 4).forEach((m, i) => ev.push({ kind: 'sus', inst: 'synth_strings_1', midi: m, t: t + 0.3, dur, vel: st.strings, attack: 3.2, release: rel, pan: (1.5 - i) * 0.35 }));
      if (st.halo) up.slice(-2).forEach((m, i) => ev.push({ kind: 'sus', inst: 'pad_7_halo', midi: m + 12, t: t + 0.6, dur, vel: st.halo, attack: 3.5, release: 4, pan: i ? 0.5 : -0.5 }));
      if (st.choir && ci % 2 === 1) ev.push({ kind: 'sus', inst: 'choir_aahs', midi: up[up.length - 1], t: t + 0.2, dur, vel: st.choir, attack: 3, release: 3.5, pan: 0.1 });
      // arpeggio
      const pool = [];
      up.forEach(m => { pool.push(m + 12); pool.push(m + 24); });
      pool.sort((a, b) => a - b);
      const lo = st.arp === 'celesta' ? 60 : st.arp === 'fx_3_crystal' ? 64 : 55;
      const hi = st.arp === 'celesta' ? 98 : 88;
      const notes = pool.filter(m => m >= lo && m <= hi);
      for (let at = t + 1.0, k = 0; at < t + dur - 0.3; at += st.rate, k++) {
        if (r() > st.dens) continue;
        const idx = (k * 3 + Math.floor(r() * 2)) % Math.max(1, notes.length);
        const m = notes[idx] || 72;
        ev.push({ kind: 'note', inst: st.arp, midi: m, t: at + (r() - 0.5) * 0.03, dur: 2.8, vel: 0.08 + r() * 0.1, release: 1.2, pan: r() * 1.4 - 0.7 });
      }
      t += dur; ci++;
    }
    // section downbeat colors
    if (sec.id !== 'title' && sec.id !== 'credits') {
      ev.push({ kind: 'note', inst: 'tubular_bells', midi: prog[0][0] + 36, t: sec.s + 2.9, dur: 3, vel: 0.16, release: 1.5, pan: -0.2 });
    }
  });
  // camera flights and scene cues
  TL.scenes.forEach((sc, i) => {
    ev.push({ kind: 'sfx', type: 'whoosh', t: sc.start + 0.05, dur: 3.0, vel: 0.32 });
    const cues = (window.SCENE_SFX && SCENE_SFX[sc.id]) || [];
    cues.forEach(([li, off, type, extra]) => {
      const line = sc.lines[li]; if (!line) return;
      ev.push(Object.assign({ kind: 'sfx', type, t: line.t + off }, extra || {}));
    });
  });
  ev.push({ kind: 'sfx', type: 'boom', t: 0.3, vel: 0.5 });
  ev.push({ kind: 'sfx', type: 'shimmer', t: 4.0, vel: 0.3 });
  ev.push({ kind: 'note', inst: 'timpani', midi: 38, t: 0.25, dur: 3, vel: 0.5, release: 2 });
  ev.push({ kind: 'sfx', type: 'whoosh', t: TL.creditsStart, dur: 6, vel: 0.3 });
  ev.push({ kind: 'sfx', type: 'boom', t: TL.creditsStart + 0.5, vel: 0.35 });
  ev.sort((a, b) => a.t - b.t);
  return ev;
}
})();
