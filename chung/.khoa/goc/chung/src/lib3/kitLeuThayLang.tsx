import React, {useMemo} from 'react';
import * as THREE from 'three';
import {NguonBui} from './buiNguon';
import {FacetLathe, Halo, ContactShade} from './look';
import {rnd, Ctx, P} from './depth';
import {B} from './kit';
import {tex, EmberBed} from './kitLab';
import {paintPlanks, Basket, CynthiaScarf, cynthiaScarfTex} from './kitCamp';
import {Embers} from './fx';

/** lib3/kitLeuThayLang: the inside of the healer's tent (d1c2, set B: Victor is born here; his father treats the sick here).
 *  Made 22/11/2026 for `src/demo/LeuThayLang.tsx`. Every surface carries the three sizes of detail of skill 1: big form
 *  (walls, roof facets, poles, table, chest), middle pieces (seams, patches, bands, bottles, bunches) and small grain (weave,
 *  stitches, wood grain, soot, straw). The canvas is the same cloth as tent A seen from outside, warmer from inside.
 *  World = tent metres: floor x -3..3, z 0 (open front) .. -5 (back wall), walls 2.0 high, roof up to the apex. */
type V3 = [number, number, number];

// ---------------------------------------------------------------- sizes everyone needs
export const LEU = {
  hw: 3, back: -5, wall: 2.0, apex: [0, 3.8, -2.5] as V3,
  /** the door in the back wall (x from, x to, height) */
  door: {x0: -2.4, x1: -1.4, h: 1.8},
  /** the tear in the right roof facet (bo-hoang): world centre, and [x, y, r] on that facet's cloth (metres) */
  tear: [2.05, 2.57, -3.45] as V3, tearCloth: [3.45, 1.11, 0.2] as [number, number, number],
  cloth: '#c2a271',
};
/** the healer's table: centre of its foot print, size; its top is at h. vial = where the green vial stands (world). */
export const BAN_THUOC = {pos: [1.6, 0, -2.9] as V3, w: 1.4, d: 0.6, h: 0.75, vial: [1.24, 0.75, -2.72] as V3};

// ---------------------------------------------------------------- colour helpers
const hx = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const tone = (h: string, k: number, a = 1) => { const [r, g, b] = hx(h), f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgba(${f(r)},${f(g)},${f(b)},${a})`; };
const blob = (c: Ctx, x: number, y: number, rad: number, col: string) => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); };

// ---------------------------------------------------------------- the canvas, seen from inside
export type TentCloth = {seed: number; Wm: number; Hm: number; cloth?: string;
  /** patches: [x, y, w, h] in metres from the bottom left (rotation comes from the seed) */
  patches?: [number, number, number, number][];
  /** soot: 0..1, how dark the top edge is (the lamp smoke gathers under the roof) */
  soot?: number;
  /** strips of cloth run across (true) or up (false, for roof facets) */
  across?: boolean;
  /** day: paint the light coming THROUGH the canvas (emissive map): thin cloth bright, seams and patches dark */
  through?: boolean;
  /** a rectangle to leave out of the dirt and the patches (the door) */
  skip?: [number, number, number, number];
  /** a hole torn in the cloth: [x, y, radius] in metres (sky through it; `through` paints it as bright light) */
  tear?: [number, number, number]};
const PATCH_COLS = ['#6e4a32', '#8c3b2c', '#5d6a78', '#a08850', '#6a7250', '#7d5a6a', '#b0905e'];
/** Canvas from inside: strips sewn together, each its own tone; the weave; the cloth sagging between poles in soft vertical
 *  folds; seams with a fold line and running stitches; patches of other cloths sewn flat with a thread all round and cross
 *  stitches at the corners; a darned tear; soot under the roof, damp and dust at the hem. `through` paints the same cloth as
 *  light coming through it: the thin cloth glows, seams, patches and soot are darker. */
export const paintTentCloth = (o: TentCloth) => (c: Ctx, W: number, H: number) => {
  const r = rnd(o.seed), cloth = o.cloth ?? LEU.cloth, k = W / o.Wm, X = (x: number) => x * k, Y = (y: number) => H - y * k, across = o.across ?? true;
  const lit = !!o.through, base = lit ? '#fff0cc' : cloth;
  // 1. strips
  const step = 0.48 + r() * 0.06, n = Math.ceil((across ? o.Hm : o.Wm) / step) + 1;
  for (let i = 0; i < n; i++) { const t = (lit ? 0.9 : 0.92) + r() * 0.14; c.fillStyle = tone(base, t); if (across) c.fillRect(0, Y((i + 1) * step), W, step * k + 1); else c.fillRect(X(i * step), 0, step * k + 1, H); }
  for (let q = 0; q < 26; q++) blob(c, r() * W, r() * H, H * (0.1 + r() * 0.3), r() < 0.5 ? (lit ? 'rgba(255,250,235,0.12)' : 'rgba(255,240,210,0.08)') : (lit ? 'rgba(150,110,60,0.12)' : 'rgba(60,44,30,0.08)'));
  // the weave
  c.globalAlpha = lit ? 0.022 : 0.07; for (let y = 0; y < H; y += 3) { c.fillStyle = y % 6 ? '#000' : '#fff'; c.fillRect(0, y, W, 1); } for (let x = 0; x < W; x += 4) { c.fillStyle = '#000'; c.fillRect(x, 0, 1, H); } c.globalAlpha = 1;
  // soft folds hanging from the top (the cloth sags between the poles)
  for (let q = 0; q < o.Wm * 2.2; q++) { const x = r() * W, w = k * (0.06 + r() * 0.16), g = c.createLinearGradient(x - w, 0, x + w, 0), dk = r() < 0.6; g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, dk ? `rgba(50,36,24,${0.08 + r() * 0.1})` : `rgba(255,245,225,${0.06 + r() * 0.08})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - w, 0, 2 * w, H * (0.5 + r() * 0.5)); }
  // 2. seams with stitches
  for (let i = 1; i < n; i++) {
    const p = i * step;
    if (across) { const y = Y(p); c.fillStyle = lit ? 'rgba(120,80,40,0.55)' : 'rgba(50,38,26,0.45)'; c.fillRect(0, y - 3, W, 6); c.fillStyle = 'rgba(255,245,220,0.25)'; c.fillRect(0, y + 4, W, 3); c.fillStyle = lit ? 'rgba(120,80,40,0.5)' : 'rgba(70,56,40,0.55)'; for (let x = r() * 8; x < W; x += 12) c.fillRect(x, y + 9, 6, 2); }
    else { const x = X(p); c.fillStyle = lit ? 'rgba(120,80,40,0.55)' : 'rgba(50,38,26,0.45)'; c.fillRect(x - 3, 0, 6, H); c.fillStyle = 'rgba(255,245,220,0.25)'; c.fillRect(x + 4, 0, 3, H); c.fillStyle = lit ? 'rgba(120,80,40,0.5)' : 'rgba(70,56,40,0.55)'; for (let y = r() * 8; y < H; y += 12) c.fillRect(x + 9, y, 2, 6); }
  }
  // water marks and stains
  for (let q = 0; q < o.Wm * 3; q++) { const x = r() * W, y0 = r() * H * 0.6, len = H * (0.1 + r() * 0.35), g = c.createLinearGradient(0, y0, 0, y0 + len); g.addColorStop(0, `rgba(70,52,34,${0.08 + r() * 0.1})`); g.addColorStop(1, 'rgba(70,52,34,0)'); c.fillStyle = g; c.fillRect(x, y0, 2 + r() * 6, len); }
  for (let q = 0; q < o.Wm * 0.6; q++) { const x = r() * W, y = r() * H, rr = k * (0.06 + r() * 0.12); c.strokeStyle = `rgba(90,64,40,${0.18 + r() * 0.12})`; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, rr, rr * 0.7, r(), 0, 7); c.stroke(); blob(c, x, y, rr, 'rgba(110,80,50,0.08)'); }
  // 3. patches
  (o.patches ?? []).forEach(([px, py, pw, ph], i) => {
    const rot = (r() - 0.5) * 0.12, col = PATCH_COLS[(i + o.seed) % PATCH_COLS.length];
    c.save(); c.translate(X(px + pw / 2), Y(py + ph / 2)); c.rotate(rot);
    const w = pw * k, h = ph * k;
    c.fillStyle = 'rgba(30,22,16,0.35)'; c.fillRect(-w / 2 + 3, -h / 2 + 5, w, h);
    c.fillStyle = lit ? tone(col, 0.55) : col; c.fillRect(-w / 2, -h / 2, w, h);
    c.globalAlpha = 0.18; for (let y = -h / 2; y < h / 2; y += 4) { c.fillStyle = '#000'; c.fillRect(-w / 2, y, w, 1.5); } c.globalAlpha = 1;
    for (let q = 0; q < 4; q++) blob(c, (r() - 0.5) * w, (r() - 0.5) * h, Math.min(w, h) * 0.4, lit ? 'rgba(255,220,170,0.1)' : 'rgba(255,240,210,0.12)');
    c.strokeStyle = 'rgba(30,22,16,0.55)'; c.lineWidth = 2; c.strokeRect(-w / 2, -h / 2, w, h);
    c.strokeStyle = lit ? '#b0864e' : '#e6d6aa'; c.lineWidth = 2.5; c.setLineDash([7, 6]); c.strokeRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14); c.setLineDash([]);
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([u, v]) => { const x = u * (w / 2 - 10), y = v * (h / 2 - 10); c.beginPath(); c.moveTo(x - 6, y - 6); c.lineTo(x + 6, y + 6); c.moveTo(x + 6, y - 6); c.lineTo(x - 6, y + 6); c.stroke(); });
    c.restore();
  });
  // a darned tear: a ragged slit closed with zig-zag thread
  { const x = X(o.Wm * (0.2 + r() * 0.6)), y = Y(o.Hm * (0.3 + r() * 0.4)), L = k * (0.18 + r() * 0.12), a = (r() - 0.5) * 1.2;
    c.save(); c.translate(x, y); c.rotate(a); c.strokeStyle = 'rgba(40,28,18,0.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-L / 2, 0); for (let t = -L / 2; t <= L / 2; t += 6) c.lineTo(t, (r() - 0.5) * 4); c.stroke();
    c.strokeStyle = lit ? '#a07848' : '#ddcc9c'; c.lineWidth = 2; c.beginPath(); for (let t = -L / 2; t <= L / 2; t += 8) { c.moveTo(t, -7); c.lineTo(t + 4, 7); } c.stroke(); c.restore(); }
  // 4. soot gathered under the roof; damp and dust at the hem
  if (o.tear) { const [tx, ty, tr] = o.tear, rr = rnd(o.seed + 77), pts = Array.from({length: 22}, (_, i) => { const a = (i / 22) * Math.PI * 2, q = tr * k * (0.55 + rr() * 0.6) * (i % 2 ? 1 : 0.7); return [X(tx) + Math.cos(a) * q * 1.3, Y(ty) + Math.sin(a) * q] as [number, number]; });
    c.save(); c.translate(4, 6); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = 'rgba(40,28,18,0.5)'; c.fill(); c.restore();
    c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = lit ? '#ffffff' : '#dfe8ee'; c.fill();
    c.strokeStyle = lit ? 'rgba(160,120,70,0.9)' : 'rgba(70,50,30,0.8)'; c.lineWidth = 3; pts.forEach(([x, y], i) => { if (i % 2) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + (X(tx) - x) * 0.25 + (rr() - 0.5) * 10, y + (Y(ty) - y) * 0.25 + (rr() - 0.5) * 10); c.stroke(); } }); }
  const soot = o.soot ?? 0.4;
  { const g = c.createLinearGradient(0, 0, 0, H * 0.45); g.addColorStop(0, `rgba(30,24,20,${0.6 * soot})`); g.addColorStop(1, 'rgba(30,24,20,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H * 0.45); }
  if (across) { const g = c.createLinearGradient(0, Y(0.45), 0, H); g.addColorStop(0, 'rgba(70,52,36,0)'); g.addColorStop(1, lit ? 'rgba(90,60,30,0.5)' : 'rgba(70,52,36,0.5)'); c.fillStyle = g; c.fillRect(0, Y(0.45), W, H - Y(0.45));
    for (let q = 0; q < o.Wm * (lit ? 14 : 50); q++) { c.fillStyle = `rgba(60,44,30,${(lit ? 0.06 : 0.15) + r() * (lit ? 0.1 : 0.3)})`; c.beginPath(); c.arc(r() * W, H - Math.pow(r(), 2) * k * 0.3, 1 + r() * (lit ? 1.5 : 3), 0, 7); c.fill(); } }
};
const clothTex = (o: TentCloth, ppm = 240) => tex(`leu-cloth-${o.seed}-${o.Wm}-${o.Hm}-${o.through ? 1 : 0}-${o.across === false ? 0 : 1}-${(o.patches ?? []).length}${o.cloth ? '-' + o.cloth : ''}${o.tear ? '-t' + o.tear.join('_') : ''}`, Math.round(o.Wm * ppm), Math.round(o.Hm * ppm), paintTentCloth(o));

// ---------------------------------------------------------------- the floor: beaten earth, and an old woven rug on it
const paintEarth = (seed: number, Wm: number, Dm: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), k = W / Wm;
  c.fillStyle = '#6b5640'; c.fillRect(0, 0, W, H);
  for (let q = 0; q < 160; q++) blob(c, r() * W, r() * H, k * (0.1 + r() * 0.5), r() < 0.5 ? 'rgba(140,112,80,0.16)' : 'rgba(40,30,20,0.16)');
  // trodden paths: smoother, lighter, from the open front to the bed, the table and the door
  [[0.5, 1, 0.5, 0.45], [0.5, 0.6, 0.15, 0.1], [0.5, 0.6, 0.78, 0.3]].forEach(([x0, y0, x1, y1]) => { for (let t = 0; t <= 1; t += 0.04) blob(c, (x0 + (x1 - x0) * t) * W, (y0 + (y1 - y0) * t) * H, k * 0.45, 'rgba(160,130,95,0.06)'); });
  // straw, chaff, pebbles, little cracks
  for (let q = 0; q < Wm * Dm * 60; q++) { const x = r() * W, y = r() * H, L = k * (0.03 + r() * 0.08), a = r() * 6.28; c.strokeStyle = r() < 0.7 ? `rgba(214,182,110,${0.35 + r() * 0.4})` : 'rgba(120,92,50,0.5)'; c.lineWidth = 1.5 + r() * 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke(); }
  for (let q = 0; q < Wm * Dm * 26; q++) { const x = r() * W, y = r() * H, s = 2 + r() * 5; c.fillStyle = `rgba(${90 + r() * 60},${80 + r() * 50},${60 + r() * 40},0.8)`; c.beginPath(); c.ellipse(x, y, s, s * 0.7, r(), 0, 7); c.fill(); c.fillStyle = 'rgba(255,240,210,0.25)'; c.fillRect(x - s * 0.4, y - s * 0.4, s * 0.4, s * 0.3); }
  for (let q = 0; q < Wm * Dm * 2; q++) { const x = r() * W, y = r() * H; c.strokeStyle = 'rgba(40,30,20,0.4)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) c.lineTo(x + (r() - 0.5) * k * 0.3, y + (r() - 0.5) * k * 0.3); c.stroke(); }
  // darker along the walls (damp, less trodden)
  const g = c.createLinearGradient(0, 0, 0, H * 0.3); g.addColorStop(0, 'rgba(40,30,22,0.45)'); g.addColorStop(1, 'rgba(40,30,22,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H * 0.3);
  [0, 1].forEach((s) => { const gg = c.createLinearGradient(s ? W : 0, 0, s ? W * 0.82 : W * 0.18, 0); gg.addColorStop(0, 'rgba(40,30,22,0.45)'); gg.addColorStop(1, 'rgba(40,30,22,0)'); c.fillStyle = gg; c.fillRect(s ? W * 0.82 : 0, 0, W * 0.18, H); });
};
/** An old woven rug: madder red ground, a dark brown border with a cream running hook pattern, three lozenge medallions,
 *  small stars in the field; worn pale in the middle where people walk, threads showing, a stain, fringes at both ends. */
export const paintOldRug = (seed: number, col = '#8a3826', border = '#4a2c1e', light = '#d9b882') => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), fr = H * 0.05, y0 = fr, y1 = H - fr;
  c.clearRect(0, 0, W, H);
  c.fillStyle = col; c.fillRect(0, y0, W, y1 - y0);
  for (let q = 0; q < 50; q++) blob(c, r() * W, y0 + r() * (y1 - y0), W * (0.04 + r() * 0.1), r() < 0.5 ? 'rgba(255,200,150,0.08)' : 'rgba(40,10,5,0.12)');
  // border band
  const b = H * 0.1; c.fillStyle = border; c.fillRect(0, y0, W, b); c.fillRect(0, y1 - b, W, b); c.fillRect(0, y0, b * 0.8, y1 - y0); c.fillRect(W - b * 0.8, y0, b * 0.8, y1 - y0);
  c.strokeStyle = light; c.lineWidth = b * 0.12;
  const hooks = (xa: number, ya: number, xb: number, yb: number) => { const L = Math.hypot(xb - xa, yb - ya), n = Math.floor(L / (b * 0.9)); c.beginPath(); for (let i = 0; i <= n; i++) { const t = i / n, x = xa + (xb - xa) * t, y = ya + (yb - ya) * t, o = (i % 2 ? 1 : -1) * b * 0.22; if (xa === xb) { if (i) c.lineTo(x + o, y); else c.moveTo(x + o, y); } else { if (i) c.lineTo(x, y + o); else c.moveTo(x, y + o); } } c.stroke(); };
  hooks(b, y0 + b / 2, W - b, y0 + b / 2); hooks(b, y1 - b / 2, W - b, y1 - b / 2); hooks(b * 0.4, y0 + b, b * 0.4, y1 - b); hooks(W - b * 0.4, y0 + b, W - b * 0.4, y1 - b);
  c.fillStyle = tone(light, 0.8); c.fillRect(0, y0 + b, W, 4); c.fillRect(0, y1 - b - 4, W, 4);
  // three medallions
  [0.25, 0.5, 0.75].forEach((t, i) => {
    const cx = W * t, cy = H / 2, rx = W * 0.1, ry = (y1 - y0 - 2 * b) * 0.4;
    const dia = (s: number, f: string) => { c.fillStyle = f; c.beginPath(); c.moveTo(cx, cy - ry * s); c.lineTo(cx + rx * s, cy); c.lineTo(cx, cy + ry * s); c.lineTo(cx - rx * s, cy); c.closePath(); c.fill(); };
    dia(1, border); dia(0.82, i === 1 ? '#3e5a6a' : light); dia(0.55, col); dia(0.28, light);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + 0.78; c.fillStyle = border; c.fillRect(cx + Math.cos(a) * rx * 1.15 - 6, cy + Math.sin(a) * ry * 1.1 - 6, 12, 12); }
  });
  for (let q = 0; q < 30; q++) { const x = b + r() * (W - 2 * b), y = y0 + b + r() * (y1 - y0 - 2 * b); c.fillStyle = r() < 0.5 ? light : border; c.fillRect(x - 3, y - 8, 6, 16); c.fillRect(x - 8, y - 3, 16, 6); }
  // wear: pale in the middle, threads showing, a stain, a hole at one corner
  for (let q = 0; q < 40; q++) blob(c, W * (0.3 + r() * 0.4), H * (0.3 + r() * 0.4), W * (0.05 + r() * 0.08), 'rgba(230,200,160,0.1)');
  c.strokeStyle = 'rgba(220,190,150,0.35)'; c.lineWidth = 1; for (let q = 0; q < 300; q++) { const x = W * (0.25 + r() * 0.5), y = H * (0.25 + r() * 0.5); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 6 + r() * 10); c.stroke(); }
  blob(c, W * (0.6 + r() * 0.2), H * 0.35, W * 0.07, 'rgba(50,25,15,0.3)');
  c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.ellipse(W * 0.93, y1 - b * 0.6, b * 0.5, b * 0.35, 0.3, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  // fringes
  c.strokeStyle = tone(light, 0.9); c.lineWidth = 3; for (let x = 6; x < W - 4; x += 9) { [[y0, -1], [y1, 1]].forEach(([y, s]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 6, y + s * fr * (0.6 + r() * 0.4)); c.stroke(); }); }
};
/** The rug laid flat on the floor (centre pos, size w along x, d along z). */
export const FloorRug: React.FC<{pos: V3; w: number; d: number; rotY?: number; seed?: number}> = ({pos, w, d, rotY = 0, seed = 5}) => (
  <mesh position={[pos[0], pos[1] + 0.012, pos[2]]} rotation={[-Math.PI / 2, 0, rotY]} receiveShadow><planeGeometry args={[w, d]} /><meshLambertMaterial map={tex(`leu-rug-${seed}`, 1400, Math.round(1400 * d / w), paintOldRug(seed))} transparent alphaTest={0.3} /></mesh>
);

// ---------------------------------------------------------------- poles
const poleTex = () => tex('leu-pole', 64, 512, paintPlanks(12, {base: '#4a3424', n: 1, vertical: true, knots: 0.7, age: 0.7}));
/** a rough pole from a to b, radius rr */
export const Pole: React.FC<{a: V3; b: V3; rr?: number; cast?: boolean}> = ({a, b, rr = 0.05, cast = true}) => {
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return <mesh position={A.clone().add(Bv).multiplyScalar(0.5)} quaternion={q} castShadow={cast} receiveShadow><cylinderGeometry args={[rr * 0.85, rr, d.length(), 7]} /><meshLambertMaterial map={poleTex()} /></mesh>;
};
const Rope: React.FC<{a: V3; b: V3; t?: number; c?: string}> = ({a, b, t = 0.012, c = '#b8a47a'}) => {
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return <mesh position={A.clone().add(Bv).multiplyScalar(0.5)} quaternion={q}><boxGeometry args={[t, d.length(), t]} /><meshLambertMaterial color={c} /></mesh>;
};

// ---------------------------------------------------------------- the shell
const glowMat = (map: THREE.Texture, emi: THREE.Texture | null, k: number, col = '#ffe3a8') => emi ? <meshLambertMaterial map={map} emissiveMap={emi} emissive={col} emissiveIntensity={k} side={THREE.DoubleSide} /> : <meshLambertMaterial map={map} side={THREE.DoubleSide} />;
/** a triangle (roof facet) with uv (0,0) (1,0) at the base, (0.5,1) at the apex */
const triGeo = (p0: V3, p1: V3, p2: V3) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...p0, ...p1, ...p2], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); g.computeVertexNormals(); return g; };
/** the back wall with the door cut out of it: a U-shaped outline, uv = metres / size */
const backGeo = () => {
  const W = LEU.hw * 2, H = LEU.wall, d0 = LEU.door.x0 + LEU.hw, d1 = LEU.door.x1 + LEU.hw, dh = LEU.door.h, s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(d0, 0); s.lineTo(d0, dh); s.lineTo(d1, dh); s.lineTo(d1, 0); s.lineTo(W, 0); s.lineTo(W, H); s.lineTo(0, H); s.closePath();
  const g = new THREE.ShapeGeometry(s), uv = g.attributes.uv as THREE.BufferAttribute, p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / W, p.getY(i) / H);
  return g;
};
/** THE TENT, inside: three canvas walls 2.0 m high (back wall with the door, patched all over), a canvas roof of four facets
 *  up to the apex, darkened by lamp smoke; corner posts, middle posts on the side walls, rafters from every post to the apex
 *  where they cross and are lashed; a beaten earth floor. day = the light of the day comes through the canvas (it glows,
 *  the patches and seams show darker). The front (z 0) is open: the lens stands outside. */
export const TentInside: React.FC<{day?: boolean; wear?: 'old' | 'mended'; glow?: number; through?: boolean; glowColor?: string}> = ({day = false, wear, glow = 0.85, through = false, glowColor = '#ffe3a8'}) => {
  const W = LEU.hw * 2, H = LEU.wall, [ax, ay, az] = LEU.apex, bk = LEU.back, hw = LEU.hw;
  const backP: [number, number, number, number][] = [[3.15, 0.35, 0.5, 0.38], [4.55, 1.15, 0.42, 0.32], [1.8, 1.25, 0.34, 0.28], [5.2, 0.4, 0.36, 0.5], [2.4, 0.2, 0.28, 0.22]];
  const sideP: [number, number, number, number][] = [[0.8, 0.5, 0.45, 0.36], [3.3, 1.2, 0.38, 0.3], [2.0, 0.25, 0.3, 0.26]];
  const sideP2: [number, number, number, number][] = [[1.2, 1.1, 0.4, 0.34], [3.6, 0.4, 0.5, 0.36]];
  const cl = wear === 'old' ? '#a99d86' : undefined;
  const back = {seed: 31, cloth: cl, Wm: W, Hm: H, patches: backP, soot: 0.35, skip: [LEU.door.x0 + hw, 0, LEU.door.x1 + hw, LEU.door.h] as [number, number, number, number]};
  const left = {seed: 33, cloth: cl, Wm: -bk, Hm: H, patches: sideP, soot: 0.35}, right = {seed: 35, cloth: cl, Wm: -bk, Hm: H, patches: sideP2, soot: 0.35};
  const slantS = Math.hypot(hw, ay - H), slantF = Math.hypot(-bk / 2, ay - H);
  const roofS = (seed: number) => ({seed, cloth: cl, Wm: -bk, Hm: slantS, across: false, soot: 0.9, patches: [[1.4, 0.6, 0.4, 0.34], [3.0, 1.2, 0.3, 0.3]] as [number, number, number, number][]});
  const roofF = (seed: number) => ({seed, cloth: cl, Wm: W, Hm: slantF, across: false, soot: 0.9, patches: [[1.6, 0.5, 0.36, 0.3], [4.2, 0.9, 0.4, 0.3]] as [number, number, number, number][]});
  /** the canvas glows: by day the light through it; at night (through) the lamp's light caught in the pale cloth */
  const em = (o: TentCloth) => (day || through ? clothTex({...o, through: true}, 120) : null), ek = glow;
  /** the right roof facet with the tear of `bo-hoang` (LEU.tear) or the patch sewn over it later (`xuong`) */
  const rr57 = wear === 'old' ? {...roofS(57), tear: LEU.tearCloth} : wear === 'mended' ? {...roofS(57), patches: [...roofS(57).patches, [LEU.tearCloth[0] - 0.3, LEU.tearCloth[1] - 0.22, 0.6, 0.44] as [number, number, number, number]]} : roofS(57);
  const backG = useMemo(backGeo, []), floor = tex('leu-earth', 1800, 1500, paintEarth(41, W, -bk));
  const g = useMemo(() => ({
    rb: triGeo([hw, H, bk], [-hw, H, bk], [ax, ay, az]), rf: triGeo([-hw, H, 0], [hw, H, 0], [ax, ay, az]),
    rl: triGeo([-hw, H, bk], [-hw, H, 0], [ax, ay, az]), rr: triGeo([hw, H, 0], [hw, H, bk], [ax, ay, az]),
  }), []);
  const posts: V3[] = [[-hw, 0, bk], [hw, 0, bk], [-hw, 0, 0], [hw, 0, 0], [-hw, 0, bk / 2], [hw, 0, bk / 2]];
  return (
    <group>
      {/* floor */}
      <mesh position={[0, 0, bk / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[W + 0.4, -bk + 0.4]} /><meshLambertMaterial map={floor} /></mesh>
      {/* walls: back (with the door), left, right */}
      <mesh geometry={backG} position={[-hw, 0, bk]} castShadow receiveShadow>{glowMat(clothTex(back), em(back), ek, glowColor)}</mesh>
      <mesh position={[-hw, H / 2, bk / 2]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow><planeGeometry args={[-bk, H]} />{glowMat(clothTex(left), em(left), ek, glowColor)}</mesh>
      <mesh position={[hw, H / 2, bk / 2]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow><planeGeometry args={[-bk, H]} />{glowMat(clothTex(right), em(right), ek, glowColor)}</mesh>
      {/* roof facets */}
      <mesh geometry={g.rb} castShadow receiveShadow>{glowMat(clothTex(roofF(51)), em(roofF(51)), ek * 0.8, glowColor)}</mesh>
      <mesh geometry={g.rf} castShadow receiveShadow>{glowMat(clothTex(roofF(53)), em(roofF(53)), ek * 0.8, glowColor)}</mesh>
      <mesh geometry={g.rl} castShadow receiveShadow>{glowMat(clothTex(roofS(55)), em(roofS(55)), ek * 0.8, glowColor)}</mesh>
      <mesh geometry={g.rr} castShadow receiveShadow>{glowMat(clothTex(rr57), em(rr57), ek * 0.8, glowColor)}</mesh>
      {/* posts and rafters; the rafters cross at the apex and stick out, lashed with rope */}
      {posts.map((p, i) => <Pole key={i} a={[p[0] * 0.985, 0, p[2] === 0 ? -0.04 : p[2] + 0.04]} b={[p[0] * 0.985, H + 0.02, p[2] === 0 ? -0.04 : p[2] + 0.04]} rr={0.055} />)}
      {posts.map((p, i) => { const a: V3 = [p[0] * 0.97, H, p[2] === 0 ? -0.06 : p[2] + 0.06], d = [ax - a[0], ay - a[1], az - a[2]]; return <Pole key={`r${i}`} a={a} b={[a[0] + d[0] * 1.12, a[1] + d[1] * 1.12, a[2] + d[2] * 1.12]} rr={0.045} />; })}
      {[-0.06, 0, 0.06].map((dy, i) => <mesh key={i} position={[ax, ay - 0.12 + dy, az]}><torusGeometry args={[0.09, 0.014, 5, 12]} /><meshLambertMaterial color="#a48e64" /></mesh>)}
      {/* the wall plates: a pole along the top of each wall where the roof meets it */}
      <Pole a={[-hw + 0.04, H, bk + 0.05]} b={[hw - 0.04, H, bk + 0.05]} rr={0.04} />
      <Pole a={[-hw + 0.05, H, bk]} b={[-hw + 0.05, H, 0]} rr={0.04} />
      <Pole a={[hw - 0.05, H, bk]} b={[hw - 0.05, H, 0]} rr={0.04} />
      {/* the door frame */}
      <Pole a={[LEU.door.x0 - 0.04, 0, bk + 0.05]} b={[LEU.door.x0 - 0.04, H, bk + 0.05]} rr={0.04} />
      <Pole a={[LEU.door.x1 + 0.04, 0, bk + 0.05]} b={[LEU.door.x1 + 0.04, H, bk + 0.05]} rr={0.04} />
      <Pole a={[LEU.door.x0 - 0.1, LEU.door.h + 0.03, bk + 0.06]} b={[LEU.door.x1 + 0.1, LEU.door.h + 0.03, bk + 0.06]} rr={0.035} />
    </group>
  );
};

/** What is seen through the door: open = morning sun on grass, the corner of another tent, a stake and a rope, mountains;
 *  closed = dark blue night (only a slit of it shows between the flaps). */
const paintOutside = (day: boolean) => (c: Ctx, W: number, H: number) => {
  const r = rnd(day ? 3 : 4);
  if (!day) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#161d33'); g.addColorStop(1, '#1e2538'); c.fillStyle = g; c.fillRect(0, 0, W, H); for (let i = 0; i < 12; i++) { c.fillStyle = 'rgba(230,236,255,0.8)'; c.fillRect(r() * W, r() * H * 0.5, 3, 3); } c.fillStyle = '#141a2c'; c.fillRect(0, H * 0.72, W, H * 0.28); return; }
  const g = c.createLinearGradient(0, 0, 0, H * 0.6); g.addColorStop(0, '#bcd6e6'); g.addColorStop(1, '#f6e9c4'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  P(c, [[0, H * 0.5], [W * 0.2, H * 0.36], [W * 0.38, H * 0.44], [W * 0.6, H * 0.3], [W * 0.82, H * 0.42], [W, H * 0.38], [W, H * 0.62], [0, H * 0.62]], '#a8b8c4');
  P(c, [[W * 0.52, H * 0.34], [W * 0.6, H * 0.3], [W * 0.66, H * 0.35], [W * 0.6, H * 0.36]], '#f4f4f0');
  P(c, [[0, H * 0.58], [W * 0.3, H * 0.52], [W * 0.7, H * 0.56], [W, H * 0.52], [W, H * 0.7], [0, H * 0.7]], '#7f9a6a');
  for (let i = 0; i < 7; i++) { const x = r() * W, h = H * (0.08 + r() * 0.06); P(c, [[x - h * 0.3, H * 0.6], [x, H * 0.6 - h], [x + h * 0.3, H * 0.6]], '#56704e'); }
  const gg = c.createLinearGradient(0, H * 0.66, 0, H); gg.addColorStop(0, '#b8b46a'); gg.addColorStop(1, '#8c8a4e'); c.fillStyle = gg; c.fillRect(0, H * 0.66, W, H * 0.34);
  for (let i = 0; i < 200; i++) { const x = r() * W, y = H * (0.68 + r() * 0.32); c.strokeStyle = r() < 0.5 ? 'rgba(230,220,140,0.6)' : 'rgba(90,100,50,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 8, y - 8 - r() * 14); c.stroke(); }
  // the corner of another tent on the right, in sun; a peg and its rope
  P(c, [[W * 0.62, H * 0.86], [W * 1.05, H * 0.12], [W * 1.05, H * 0.9]], '#d8bf8e'); P(c, [[W * 0.62, H * 0.86], [W * 0.8, H * 0.56], [W * 0.84, H * 0.88]], '#c4a676');
  c.strokeStyle = '#8c3b2c'; c.lineWidth = 10; c.beginPath(); c.moveTo(W * 0.66, H * 0.8); c.lineTo(W * 1.05, H * 0.82); c.stroke();
  c.strokeStyle = '#c8b88a'; c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.78, H * 0.6); c.lineTo(W * 0.4, H * 0.92); c.stroke(); c.fillStyle = '#6a4a2e'; c.fillRect(W * 0.38, H * 0.88, 10, 30);
  // sun glare on the left
  blob(c, W * 0.1, H * 0.2, W * 0.5, 'rgba(255,248,220,0.6)');
};
/** THE DOOR of the back wall and what is outside it. open = the flap rolled up and tied over the door, the morning outside;
 *  closed = two flaps hanging down, a slit of night between them (wider at the foot), a tie loose. */
export const TentDoor: React.FC<{open: boolean; day?: boolean}> = ({open, day}) => {
  const d = LEU.door, w = d.x1 - d.x0, cx = (d.x0 + d.x1) / 2, bk = LEU.back;
  const out = tex(`leu-outside-${(day ?? open) ? 1 : 0}`, 512, 512, paintOutside(day ?? open));
  const flapT = tex('leu-flap', 256, 512, paintTentCloth({seed: 61, Wm: 0.55, Hm: 1.85, soot: 0.15, patches: [[0.1, 0.9, 0.24, 0.2]]}));
  const flapGeo = (pts: [number, number][]) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); const g = new THREE.ShapeGeometry(s), uv = g.attributes.uv as THREE.BufferAttribute, p = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, p.getY(i) / d.h); return g; };
  const L = useMemo(() => flapGeo([[-w / 2 - 0.03, 0], [-0.022, 0], [-0.004, d.h + 0.02], [-w / 2 - 0.03, d.h + 0.02]]), []), R = useMemo(() => flapGeo([[0.022, 0], [w / 2 + 0.03, 0], [w / 2 + 0.03, d.h + 0.02], [0.004, d.h + 0.02]]), []);
  const band = '#7a3226';
  return (
    <group>
      {/* the binding round the door: two sides and the top, a stitched band of dark red cloth */}
      {[d.x0 - 0.07, d.x1 + 0.07].map((x) => <B key={x} p={[x, d.h / 2, bk + 0.012]} s={[0.1, d.h + 0.12, 0.01]} c={band} cast={false} />)}
      <B p={[cx, d.h + 0.05, bk + 0.012]} s={[w + 0.24, 0.1, 0.01]} c={band} cast={false} />
      {/* the outside, a picture standing 0.6 m behind the door */}
      <mesh position={[cx, 1.1, bk - 0.6]}><planeGeometry args={[2.4, 2.4]} /><meshBasicMaterial map={out} toneMapped={false} /></mesh>
      {open ? <group>
        <mesh position={[cx, d.h - 0.03, bk + 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.085, 0.085, w + 0.12, 10]} /><meshLambertMaterial map={flapT} /></mesh>
        {[-0.3, 0.3].map((x) => <group key={x}><Rope a={[cx + x, d.h + 0.06, bk + 0.14]} b={[cx + x, d.h - 0.13, bk + 0.14]} t={0.016} /><Rope a={[cx + x, d.h - 0.13, bk + 0.14]} b={[cx + x + 0.03, d.h - 0.3, bk + 0.13]} t={0.012} /></group>)}
      </group> : <group position={[cx, 0, bk + 0.03]}>
        <mesh geometry={L} castShadow receiveShadow><meshLambertMaterial map={flapT} side={THREE.DoubleSide} /></mesh>
        <mesh geometry={R} castShadow receiveShadow><meshLambertMaterial map={flapT} side={THREE.DoubleSide} /></mesh>
        <Rope a={[-0.18, 1.1, 0.02]} b={[-0.22, 0.75, 0.025]} t={0.014} />
      </group>}
    </group>
  );
};

// ---------------------------------------------------------------- herbs hung to dry
type Bunch = 'leaf' | 'flower' | 'root' | 'garlic';
/** one bunch hung upside down, tied at the top with a string loop: leafy herbs (sage green), dried flowers (yellow, purple),
 *  a fist of roots, a plait of garlic. Drawn with its light side on the left. */
export const paintHerbBunch = (kind: Bunch, seed = 1, dry = false) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), cx = W / 2;
  c.strokeStyle = '#b8a47a'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, 0); c.lineTo(cx, H * 0.1); c.stroke();
  c.fillStyle = '#8c3b2c'; c.fillRect(cx - W * 0.09, H * 0.1, W * 0.18, H * 0.05);
  if (kind === 'garlic') {
    for (let i = 0; i < 7; i++) { const y = H * (0.2 + i * 0.1), x = cx + (i % 2 ? 1 : -1) * W * 0.12; c.fillStyle = '#e8e0cc'; c.beginPath(); c.ellipse(x, y, W * 0.16, H * 0.06, 0, 0, 7); c.fill(); c.fillStyle = '#c9bca0'; c.beginPath(); c.ellipse(x + W * 0.05, y + H * 0.01, W * 0.08, H * 0.05, 0, 0, 7); c.fill(); c.strokeStyle = '#a8977a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - W * 0.1, y); c.quadraticCurveTo(x, y - H * 0.06, x + W * 0.1, y); c.stroke(); }
    return;
  }
  const stems = kind === 'root' ? 9 : 16;
  for (let i = 0; i < stems; i++) {
    const a = (r() - 0.5) * 0.7, L = H * (0.55 + r() * 0.3), x1 = cx + Math.sin(a) * L, y1 = H * 0.14 + Math.cos(a) * L;
    c.strokeStyle = kind === 'root' ? (r() < 0.5 ? '#7a5a3a' : '#9a7650') : (r() < 0.5 ? '#6a6a3e' : '#8a7a4a'); c.lineWidth = kind === 'root' ? 5 + r() * 4 : 2.5;
    c.beginPath(); c.moveTo(cx, H * 0.14); c.quadraticCurveTo(cx + Math.sin(a) * L * 0.5 + (r() - 0.5) * 10, H * 0.14 + Math.cos(a) * L * 0.5, x1, y1); c.stroke();
    if (kind === 'leaf') for (let j = 0; j < 5; j++) { const t = 0.3 + j * 0.15, x = cx + Math.sin(a) * L * t, y = H * 0.14 + Math.cos(a) * L * t, s = W * (0.06 + r() * 0.05); c.fillStyle = r() < 0.4 ? '#8a9a6a' : r() < 0.5 ? '#6e7e54' : '#a4a880'; c.beginPath(); c.ellipse(x + (j % 2 ? s : -s) * 0.6, y, s, s * 0.45, (j % 2 ? 1 : -1) * 0.8, 0, 7); c.fill(); }
    if (kind === 'flower') { const s = W * (0.05 + r() * 0.04); c.fillStyle = r() < 0.55 ? '#d8b040' : r() < 0.5 ? '#8a5a8a' : '#e0d6b0'; for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(x1 + (r() - 0.5) * s * 2, y1 - j * s * 0.9, s, 0, 7); c.fill(); } c.fillStyle = 'rgba(40,30,20,0.25)'; c.beginPath(); c.arc(x1 + s * 0.5, y1, s * 0.6, 0, 7); c.fill(); }
    if (kind === 'root') { c.strokeStyle = 'rgba(70,50,30,0.6)'; c.lineWidth = 1.5; for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 + (r() - 0.5) * 30, y1 + 10 + r() * 20); c.stroke(); } }
  }
  // the light side on the left, the shadow on the right
  c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,240,200,0.18)'); g.addColorStop(1, 'rgba(30,20,10,0.25)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (dry) { c.fillStyle = 'rgba(42,30,20,0.62)'; c.fillRect(0, 0, W, H); }
  c.globalCompositeOperation = 'source-over';
};
/** A drying line: a cord strung from a to b (sagging), bunches of herbs, flowers, roots and garlic hung from it at `at`
 *  (shares of the way along). The bunches lie in the plane of the line (facing +z). */
export const HerbLine: React.FC<{a: V3; b: V3; sag?: number; at: number[]; size?: number; seed?: number; dry?: boolean}> = ({a, b, sag = 0.08, at, size = 0.32, seed = 1, dry = false}) => {
  const P0 = (s: number): V3 => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s - sag * 4 * s * (1 - s), a[2] + (b[2] - a[2]) * s];
  const kinds: Bunch[] = ['leaf', 'flower', 'root', 'leaf', 'garlic', 'flower', 'leaf', 'root'];
  return (
    <group>
      {Array.from({length: 12}, (_, i) => <Rope key={i} a={P0(i / 12)} b={P0((i + 1) / 12)} t={0.01} />)}
      {at.map((s, i) => { const p = P0(s), k = kinds[(i + seed) % kinds.length], h = size * (k === 'garlic' ? 1.15 : 0.9 + ((i * 37) % 5) / 12), w = h * 0.62;
        const map = tex(`leu-herb-${k}-${i % 3}${dry ? '-dry' : ''}`, 160, 256, paintHerbBunch(k, i + 3, dry));
        return <mesh key={i} position={[p[0], p[1] - h / 2, p[2] + 0.01]} castShadow receiveShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={map} transparent alphaTest={0.4} side={THREE.DoubleSide} /></mesh>; })}
    </group>
  );
};

// ---------------------------------------------------------------- the oil lamp hung from the rafters
/** A brass oil lamp with a glass chimney in a wire cage, hung on a rope from `top` down to `pos` (the foot of the lamp).
 *  on = burning: a warm flame, a halo, a warm point light that casts shadows; f flickers it. */
/** bui (mặc định true): đèn tự đăng ký nguồn bụi (lib3/buiNguon) tại thân đèn ('nen': đèn dầu, khi thắp). */
export const HangingLamp: React.FC<{pos: V3; top: V3; on?: boolean; f?: number; k?: number; lk?: number; bui?: boolean}> = ({pos, top, on = true, f = 0, k = 1, lk, bui = true}) => {
  /** k = size of the glow; lk = strength of the light it casts (defaults to k). A big glow with a moderate light keeps the
   *  lamp a large bright patch without burning out the faces near it. */
  const L = lk ?? k;
  const fl = on ? 1 + 0.06 * Math.sin(f * 0.9) + 0.04 * Math.sin(f * 2.3 + 1) : 0;
  return (
    <group>
      <Rope a={top} b={[pos[0], pos[1] + 0.36, pos[2]]} t={0.012} />
      <group position={pos}>
        {/* the oil font, a brass bowl; the burner collar; the chimney; the cap and its ring */}
        <FacetLathe profile={[[0.001, 0], [0.05, 0.005], [0.085, 0.04], [0.08, 0.075], [0.04, 0.09], [0.035, 0.11]]} sides={10} color="#b08a3e" contact={false} cast={false} />
        <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.035, 0.045, 0.14, 10, 1, true]} /><meshPhongMaterial color="#fff6e0" transparent opacity={on ? 0.35 : 0.25} shininess={90} emissive={on ? '#ffcc77' : '#000000'} emissiveIntensity={0.5} side={THREE.DoubleSide} /></mesh>
        <FacetLathe pos={[0, 0.24, 0]} profile={[[0.05, 0], [0.06, 0.02], [0.03, 0.06], [0.012, 0.09]]} sides={8} color="#6a5630" contact={false} cast={false} />
        <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.025, 0.005, 4, 10]} /><meshLambertMaterial color="#6a5630" /></mesh>
        {[0, 2.1, 4.2].map((a) => <Rope key={a} a={[Math.sin(a) * 0.075, 0.08, Math.cos(a) * 0.075]} b={[Math.sin(a) * 0.05, 0.25, Math.cos(a) * 0.05]} t={0.006} c="#4a3c22" />)}
        {on ? <>
          <mesh position={[0, 0.16, 0]} scale={[1, fl, 1]}><coneGeometry args={[0.016, 0.06, 8]} /><meshBasicMaterial color="#ffe6a0" toneMapped={false} /></mesh>
          <Halo pos={[0, 0.16, 0.02]} r={0.38 * k} color="#ffc878" strength={0.55} />{bui ? <NguonBui kieu="nen" pos={[0, 0.16, 0]} mau="#ffc878" /> : null}
          <Halo pos={[0, 0.16, 0.03]} r={0.12} color="#fff0c0" strength={0.8} />
          <pointLight position={[0, 0.16, 0]} color="#ffbf78" intensity={5.2 * L * fl} distance={9} decay={1.5} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.002} shadow-radius={3} />
        </> : null}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- the brazier
/** A low iron brazier on three bent legs, full of glowing coals and grey ash; a red light low on the floor, a few sparks. */
export const Brazier: React.FC<{pos: V3; f?: number; heat?: number}> = ({pos, f = 0, heat = 1}) => {
  const pts = useMemo(() => { const r = rnd(9); return Array.from({length: 22}, () => { const a = r() * 6.28, q = Math.sqrt(r()) * 0.19; return [Math.cos(a) * q, 0.27 + r() * 0.04, Math.sin(a) * q] as V3; }); }, []);
  const fl = 1 + 0.08 * Math.sin(f * 0.37) + 0.05 * Math.sin(f * 1.1);
  return (
    <group position={pos}>
      <FacetLathe pos={[0, 0.14, 0]} profile={[[0.001, 0], [0.12, 0.0], [0.22, 0.06], [0.26, 0.13], [0.25, 0.14]]} sides={12} color="#3a3432" contact={false} />
      {[0, 2.1, 4.2].map((a) => <mesh key={a} position={[Math.sin(a) * 0.17, 0.07, Math.cos(a) * 0.17]} rotation={[Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3]} castShadow><boxGeometry args={[0.03, 0.16, 0.03]} /><meshLambertMaterial color="#2a2624" /></mesh>)}
      <mesh position={[0, 0.268, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.235, 16]} /><meshLambertMaterial color="#5a4a44" emissive="#ff5a1e" emissiveIntensity={0.18 * heat * fl} /></mesh>
      {heat > 0 ? <EmberBed pts={pts} heat={heat * 0.6} size={0.026} /> : pts.map((p, i) => <mesh key={i} position={p}><boxGeometry args={[0.03, 0.018, 0.03]} /><meshLambertMaterial color={i % 3 ? '#4a4644' : '#6e6a66'} /></mesh>)}
      {heat > 0 ? <>
        <Halo pos={[0, 0.34, 0.05]} r={0.3} color="#ff7a30" strength={0.32 * heat} />
        <pointLight position={[0, 0.5, 0.25]} color="#ff7038" intensity={1.8 * heat * fl} distance={4.5} decay={1.6} />
        <Embers f={f} box={[-0.15, 0.15, 0.3, 1.3, -0.1, 0.1]} n={6} size={0.012} life={40} seed={4} />
      </> : null}
      <ContactShade r={0.4} />
    </group>
  );
};

// ---------------------------------------------------------------- the straw bed, the chest
const strawTex = () => tex('leu-straw', 512, 512, (c, W, H) => { const r = rnd(5); c.fillStyle = '#b89a58'; c.fillRect(0, 0, W, H); for (let q = 0; q < 1400; q++) { const x = r() * W, y = r() * H, L = 10 + r() * 30, a = (r() - 0.5) * 0.9; c.strokeStyle = r() < 0.6 ? `rgba(230,205,130,${0.5 + r() * 0.4})` : 'rgba(120,92,44,0.5)'; c.lineWidth = 1.5 + r() * 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke(); } const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(50,36,20,0.35)'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
/** red wool with cream stripes near both ends, a fringe, folds and a darned hole */
const blanketTex = (seed: number) => tex(`leu-blanket-${seed}`, 512, 768, (c, W, H) => {
  const r = rnd(seed); c.fillStyle = '#8c2a24'; c.fillRect(0, 0, W, H);
  for (let q = 0; q < 30; q++) blob(c, r() * W, r() * H, W * (0.1 + r() * 0.2), r() < 0.5 ? 'rgba(255,180,140,0.07)' : 'rgba(40,8,6,0.12)');
  [0.08, 0.14, 0.18, 0.82, 0.86, 0.92].forEach((t, i) => { c.fillStyle = i % 3 === 1 ? '#3a2a22' : '#e8d6b0'; c.fillRect(0, t * H, W, H * (i % 3 === 1 ? 0.02 : 0.025)); });
  c.globalAlpha = 0.12; for (let y = 0; y < H; y += 3) { c.fillStyle = '#000'; c.fillRect(0, y, W, 1); } c.globalAlpha = 1;
  for (let q = 0; q < 6; q++) { const x = r() * W, g = c.createLinearGradient(x - 30, 0, x + 30, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(30,6,4,0.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 30, 0, 60, H); }
  c.strokeStyle = '#d8c090'; c.lineWidth = 2; c.beginPath(); for (let a = 0; a < 6.28; a += 0.5) c.lineTo(W * 0.66 + Math.cos(a) * 18, H * 0.5 + Math.sin(a) * 14); c.closePath(); c.stroke();
});
/** A straw pallet along a wall: a thick mattress of straw in sacking, a red blanket with cream stripes thrown over most of
 *  it and falling over the front edge, a rolled pillow. pos = centre; it runs along z (len), w across. */
export const StrawPallet: React.FC<{pos: V3; w?: number; len?: number}> = ({pos, w = 0.95, len = 1.9}) => (
  <group position={pos}>
    <mesh position={[0, 0.12, 0]} castShadow receiveShadow><boxGeometry args={[w, 0.24, len]} /><meshLambertMaterial map={strawTex()} /></mesh>
    {/* tufts of straw sticking out at the sides */}
    {Array.from({length: 14}, (_, i) => <mesh key={i} position={[(i % 2 ? 1 : -1) * (w / 2 + 0.01), 0.05 + (i % 3) * 0.06, -len / 2 + 0.1 + i * (len - 0.2) / 13]} rotation={[0, 0, (i % 2 ? -1 : 1) * 0.6]}><boxGeometry args={[0.09, 0.008, 0.02]} /><meshLambertMaterial color="#d8be7a" /></mesh>)}
    {/* the blanket over the top, falling over the side towards the room */}
    <mesh position={[0.02, 0.248, len * 0.12]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow><planeGeometry args={[w + 0.06, len * 0.78]} /><meshLambertMaterial map={blanketTex(2)} /></mesh>
    <mesh position={[w / 2 + 0.035, 0.14, len * 0.12]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[len * 0.78, 0.22]} /><meshLambertMaterial map={blanketTex(3)} side={THREE.DoubleSide} /></mesh>
    {/* the blanket's end folded back on itself at the foot (a thick band), and a flat sack pillow at the head */}
    <mesh position={[0.02, 0.27, len * 0.12 - len * 0.39 + 0.12]} rotation={[-Math.PI / 2 + 0.12, 0, 0]} castShadow receiveShadow><boxGeometry args={[w + 0.04, 0.26, 0.05]} /><meshLambertMaterial map={blanketTex(3)} /></mesh>
    <mesh position={[0, 0.29, -len / 2 + 0.2]} rotation={[0.25, 0.08, 0]} castShadow receiveShadow><boxGeometry args={[w * 0.66, 0.1, 0.3]} /><meshLambertMaterial map={strawTex()} color="#e8dcc0" /></mesh>
    <ContactShade r={len * 0.6} />
  </group>
);
/** A wooden chest with a domed lid, three iron bands with rivets, a lock plate, rope handles. pos = foot centre. */
export const IronChest: React.FC<{pos: V3; rotY?: number; w?: number; d?: number; h?: number}> = ({pos, rotY = 0, w = 0.9, d = 0.5, h = 0.48}) => {
  const wood = tex('leu-chest-wood', 512, 256, paintPlanks(17, {base: '#6e4a2e', n: 4, knots: 0.6, age: 0.8, nails: true}));
  const iron = '#2e2c2c';
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[w, h, d]} /><meshLambertMaterial map={wood} /></mesh>
      <mesh position={[0, h, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, d / w * 1.0]} castShadow receiveShadow><cylinderGeometry args={[d / 2, d / 2, w, 12, 1, false, 0, Math.PI]} /><meshLambertMaterial map={wood} /></mesh>
      {[-0.36, 0, 0.36].map((x) => <group key={x}>
        <B p={[x * w, h / 2, d / 2 + 0.006]} s={[0.05, h, 0.012]} c={iron} cast={false} />
        <mesh position={[x * w, h, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[d / 2 + 0.008, d / 2 + 0.008, 0.05, 12, 1, true, 0, Math.PI]} /><meshLambertMaterial color={iron} side={THREE.DoubleSide} /></mesh>
        {[0.15, 0.5, 0.85].map((t) => <mesh key={t} position={[x * w, h * t, d / 2 + 0.014]}><boxGeometry args={[0.016, 0.016, 0.01]} /><meshLambertMaterial color="#8a8680" /></mesh>)}
      </group>)}
      <B p={[0, h * 0.82, d / 2 + 0.012]} s={[0.12, 0.14, 0.01]} c="#3a3634" cast={false} />
      <mesh position={[0, h * 0.8, d / 2 + 0.02]}><boxGeometry args={[0.02, 0.04, 0.01]} /><meshBasicMaterial color="#14110e" /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * (w / 2 + 0.03), h * 0.7, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.06, 0.012, 4, 10, Math.PI]} /><meshLambertMaterial color="#9a8458" /></mesh>)}
      <ContactShade r={w * 0.7} />
    </group>
  );
};

// ---------------------------------------------------------------- hangings on the walls
/** a woven wall hanging (kilim): bands of lozenges and zig-zags in rust, indigo, ochre and cream, a fringe at the foot */
export const paintKilim = (seed: number, ground = '#3a3a5a', a = '#a8442e', b = '#d6b46a') => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), fr = H * 0.08; c.clearRect(0, 0, W, H); c.fillStyle = ground; c.fillRect(0, 0, W, H - fr);
  const rows = 5, rh = (H - fr) / rows;
  for (let j = 0; j < rows; j++) {
    const y = j * rh; c.fillStyle = j % 2 ? a : tone(ground, 1.15); c.fillRect(0, y + rh * 0.08, W, rh * 0.84);
    const n = 4 + (j % 2) * 2, s = W / n;
    for (let i = 0; i < n; i++) { const cx = (i + 0.5) * s, cy = y + rh / 2; c.fillStyle = j % 2 ? b : a; c.beginPath(); c.moveTo(cx, cy - rh * 0.36); c.lineTo(cx + s * 0.4, cy); c.lineTo(cx, cy + rh * 0.36); c.lineTo(cx - s * 0.4, cy); c.closePath(); c.fill(); c.fillStyle = j % 2 ? ground : '#e8dcc0'; c.fillRect(cx - s * 0.08, cy - rh * 0.08, s * 0.16, rh * 0.16); }
    c.strokeStyle = '#e8dcc0'; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= W; x += s / 2) c.lineTo(x, y + rh * 0.08 + ((x / (s / 2)) % 2 ? 6 : 0)); c.stroke();
  }
  c.globalAlpha = 0.14; for (let y = 0; y < H - fr; y += 3) { c.fillStyle = '#000'; c.fillRect(0, y, W, 1); } c.globalAlpha = 1;
  for (let q = 0; q < 16; q++) blob(c, r() * W, r() * (H - fr), W * 0.15, r() < 0.5 ? 'rgba(255,230,190,0.08)' : 'rgba(20,10,10,0.15)');
  c.strokeStyle = '#d8c8a0'; c.lineWidth = 3; for (let x = 4; x < W; x += 8) { c.beginPath(); c.moveTo(x, H - fr); c.lineTo(x + (r() - 0.5) * 5, H - fr * (0.1 + r() * 0.3)); c.stroke(); }
};
/** A woven hanging on a wall: hung from a stick with two ties. pos = centre of the cloth; rotY turns it to its wall. */
export const WallHanging: React.FC<{pos: V3; w: number; h: number; rotY?: number; seed?: number; ground?: string; a?: string; b?: string}> = ({pos, w, h, rotY = 0, seed = 1, ground, a, b}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <mesh receiveShadow castShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={tex(`leu-kilim-${seed}-${ground}`, 512, Math.round(512 * h / w), paintKilim(seed, ground, a, b))} transparent alphaTest={0.3} side={THREE.DoubleSide} /></mesh>
    <Pole a={[-w / 2 - 0.08, h / 2 + 0.04, 0.03]} b={[w / 2 + 0.08, h / 2 + 0.04, 0.03]} rr={0.02} cast={false} />
    {[-w / 2 + 0.06, w / 2 - 0.06].map((x) => <Rope key={x} a={[x, h / 2 + 0.04, 0.03]} b={[x * 0.7, h / 2 + 0.22, 0.01]} t={0.01} />)}
  </group>
);
/** a leather bag hung by its strap, a coil of rope, a rolled cloth: small things hung on a pole or a wall */
export const paintHungThings = (seed: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed);
  c.strokeStyle = '#4a3020'; c.lineWidth = 6; c.beginPath(); c.moveTo(W * 0.3, H * 0.02); c.lineTo(W * 0.16, H * 0.4); c.moveTo(W * 0.3, H * 0.02); c.lineTo(W * 0.44, H * 0.4); c.stroke();
  P(c, [[W * 0.08, H * 0.4], [W * 0.52, H * 0.4], [W * 0.56, H * 0.84], [W * 0.3, H * 0.9], [W * 0.04, H * 0.84]], '#7a4e2e');
  P(c, [[W * 0.06, H * 0.4], [W * 0.54, H * 0.4], [W * 0.5, H * 0.58], [W * 0.1, H * 0.58]], '#62402a'); c.fillStyle = '#c9a050'; c.fillRect(W * 0.27, H * 0.55, W * 0.06, H * 0.05);
  c.strokeStyle = 'rgba(230,200,150,0.45)'; c.lineWidth = 2; c.setLineDash([5, 5]); c.strokeRect(W * 0.1, H * 0.62, W * 0.4, H * 0.2); c.setLineDash([]);
  for (let i = 0; i < 6; i++) { c.strokeStyle = i % 2 ? '#c8b48a' : '#a8946a'; c.lineWidth = 6; c.beginPath(); c.ellipse(W * 0.76, H * 0.36 + i * 3, W * 0.15, H * 0.17, 0, 0, 7); c.stroke(); }
  c.strokeStyle = '#a8946a'; c.lineWidth = 5; c.beginPath(); c.moveTo(W * 0.76, H * 0.02); c.lineTo(W * 0.76, H * 0.2); c.stroke();
  c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,240,210,0.12)'); g.addColorStop(1, 'rgba(20,12,8,0.25)'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
  void r;
};

// ---------------------------------------------------------------- the healer's table and what is on it
/** One glass bottle: a faceted glass body (colour), the liquid a darker tone inside, a cork; glow = the bottle lights itself
 *  (the healer holds it up to the light in d1c2 shot 12): emissive and a small point light of its own colour. */
export const GlassVial: React.FC<{pos: V3; color?: string; h?: number; kind?: 'vial' | 'flask' | 'jar'; glow?: number}> = ({pos, color = '#4f9a52', h = 0.16, kind = 'vial', glow = 0}) => {
  const prof: [number, number][] = kind === 'flask' ? [[0.001, 0], [0.06, 0], [0.075, 0.05], [0.06, 0.11], [0.022, 0.14], [0.02, 0.2], [0.026, 0.21]]
    : kind === 'jar' ? [[0.001, 0], [0.055, 0], [0.06, 0.02], [0.06, 0.12], [0.045, 0.14], [0.046, 0.16]]
    : [[0.001, 0], [0.032, 0], [0.036, 0.02], [0.036, 0.12], [0.016, 0.15], [0.015, 0.19], [0.02, 0.2]];
  const s = h / prof[prof.length - 1][1];
  const geo = useMemo(() => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r * s, y * s)), 10), [kind, s]);
  const liq = useMemo(() => new THREE.LatheGeometry(prof.filter(([, y]) => y < prof[prof.length - 1][1] * 0.6).map(([r, y]) => new THREE.Vector2(r * s * 0.86, y * s + 0.004)), 10), [kind, s]);
  const top = prof[prof.length - 1];
  return (
    <group position={pos}>
      <mesh geometry={liq}><meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.25 + glow * 0.9} /></mesh>
      <mesh geometry={geo} castShadow><meshPhongMaterial color={color} transparent opacity={0.55} shininess={120} specular="#ffffff" emissive={color} emissiveIntensity={0.12 + glow * 0.4} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <mesh position={[-top[0] * s * 0.4, h * 0.45, top[0] * s * 0.9]}><boxGeometry args={[0.006, h * 0.5, 0.002]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.6} /></mesh>
      <mesh position={[0, h + 0.012, 0]}><cylinderGeometry args={[top[0] * s * 0.95, top[0] * s * 0.8, 0.03, 8]} /><meshLambertMaterial color="#a07a4e" /></mesh>
      {glow > 0 ? <><Halo pos={[0, h * 0.4, 0.05]} r={0.16 * glow} color={color} strength={0.45} /><pointLight position={[0, h * 0.5, 0.12]} color={color} intensity={0.9 * glow} distance={1.6} decay={2} /></> : null}
    </group>
  );
};
/** a stone mortar with a wooden pestle leaning in it, a smear of crushed green on its lip */
/** pestle = false: the pestle is not drawn (an actor holds his own: d1c2 shot 12) */
export const Mortar: React.FC<{pos: V3; pestle?: boolean}> = ({pos, pestle = true}) => (
  <group position={pos}>
    <FacetLathe profile={[[0.001, 0], [0.09, 0], [0.11, 0.03], [0.115, 0.09], [0.1, 0.12], [0.075, 0.11], [0.06, 0.05], [0.001, 0.045]]} sides={11} wobble={0.08} seed={3} color="#8e8a82" />
    <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.07, 10]} /><meshLambertMaterial color="#5e6e3e" /></mesh>
    {pestle ? <mesh position={[-0.04, 0.16, 0.0]} rotation={[0, 0, 0.45]} castShadow><cylinderGeometry args={[0.018, 0.026, 0.24, 7]} /><meshLambertMaterial color="#9a7650" /></mesh> : null}
  </group>
);
const leavesTex = () => tex('leu-leaves', 256, 256, (c, W, H) => { const r = rnd(8); c.clearRect(0, 0, W, H); for (let q = 0; q < 26; q++) { const x = W * (0.2 + r() * 0.6), y = H * (0.2 + r() * 0.6), s = W * (0.07 + r() * 0.06); c.fillStyle = r() < 0.4 ? '#6e8a4a' : r() < 0.5 ? '#8aa05e' : '#5a7040'; c.beginPath(); c.ellipse(x, y, s, s * 0.45, r() * 3, 0, 7); c.fill(); c.strokeStyle = 'rgba(40,50,20,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x + s, y); c.stroke(); } });
/** THE HEALER'S TABLE (BAN_THUOC): rough planks on four splayed legs with stretchers; on it a stone mortar and pestle, four
 *  glass bottles (green, amber, brown, a tall green one), a wooden bowl of leaves, a loose handful of leaves, a clay jug
 *  (`ClayPot` of kitCamp), a folded cloth; a three-legged stool at its right end. vial = false leaves the green vial off (the
 *  healer has picked it up: d1c2 shot 12, the actor puts `GlassVial` in his hand). */
export const HealerTable: React.FC<{vial?: boolean; pestle?: boolean; jug?: React.ReactNode; stool?: React.ReactNode}> = ({vial = true, pestle = true, jug, stool}) => {
  const {pos, w, d, h} = BAN_THUOC, top = tex('leu-table-top', 1024, 440, paintPlanks(23, {base: '#8a6644', n: 3, knots: 0.7, age: 0.7, nails: true}));
  const legT = tex('leu-table-leg', 64, 512, paintPlanks(24, {base: '#6e5034', n: 1, vertical: true, age: 0.6}));
  const V = BAN_THUOC.vial;
  return (
    <group>
      <group position={pos}>
        <mesh position={[0, h - 0.03, 0]} castShadow receiveShadow><boxGeometry args={[w, 0.06, d]} /><meshLambertMaterial map={top} /></mesh>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => <mesh key={i} position={[sx * (w / 2 - 0.1), (h - 0.06) / 2, sz * (d / 2 - 0.07)]} rotation={[sz * 0.04, 0, -sx * 0.04]} castShadow receiveShadow><boxGeometry args={[0.07, h - 0.06, 0.07]} /><meshLambertMaterial map={legT} /></mesh>)}
        {[-1, 1].map((sz) => <B key={sz} p={[0, 0.18, sz * (d / 2 - 0.07)]} s={[w - 0.2, 0.05, 0.04]} c="#5e4430" />)}
        <B p={[0, h - 0.09, d / 2 - 0.02]} s={[w - 0.1, 0.06, 0.025]} c="#5e4430" />
        <ContactShade r={w * 0.65} />
        {/* things on the table (local to the table, top = h) */}
        <Mortar pos={[-0.6, h, -0.06]} pestle={pestle} />
        <GlassVial pos={[0.02, h, 0.12]} color="#c88a2e" h={0.15} kind="flask" />
        <GlassVial pos={[0.17, h, -0.12]} color="#6a4426" h={0.17} kind="jar" />
        <GlassVial pos={[0.3, h, 0.06]} color="#3e7a56" h={0.24} />
        <FacetLathe pos={[-0.18, h, -0.1]} profile={[[0.001, 0], [0.07, 0], [0.12, 0.04], [0.14, 0.07], [0.13, 0.075], [0.1, 0.04], [0.001, 0.035]]} sides={11} color="#8a6440" contact={false} />
        <mesh position={[-0.18, h + 0.072, -0.1]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.24, 0.24]} /><meshLambertMaterial map={leavesTex()} transparent alphaTest={0.4} /></mesh>
        <mesh position={[0.45, h + 0.005, 0.12]} rotation={[-Math.PI / 2, 0, 0.6]}><planeGeometry args={[0.2, 0.2]} /><meshLambertMaterial map={leavesTex()} transparent alphaTest={0.4} /></mesh>
        <B p={[0.5, h + 0.02, -0.15]} s={[0.26, 0.04, 0.2]} c="#d8ccb0" />
        <B p={[0.5, h + 0.045, -0.15]} s={[0.24, 0.012, 0.03]} c="#8c3b2c" cast={false} />
        {jug}
      </group>
      {vial ? <GlassVial pos={V} color="#4f9a52" h={0.16} /> : null}
      {stool}
    </group>
  );
};

// ---------------------------------------------------------------- the baby and the small hand-held things of the patients
export type SwaddleLook = 'closed' | 'open' | 'hand';
/** BABY VICTOR in his swaddle (d1c2 shots 2, 3, 11), a flat picture: a cream swaddle wound round in folds, the edge of a dark
 *  red blanket with cream stripes; a small round face in Victor's skin tone with a tuft of near-black hair (#1f1c22, as grown
 *  Victor); look = eyes closed, eyes open (round dark eyes with a light in them), or one small hand out of the swaddle.
 *  The bundle lies tilted (head up right) so the face looks at the lens. Picture box 600 x 760. */
export const paintSwaddle = (look: SwaddleLook) => (c: Ctx, W: number, H: number) => {
  const s = W / 600, Q = (pts: number[][], f: string) => P(c, pts.map(([x, y]) => [x * s, y * s]), f), E = (x: number, y: number, rx: number, ry: number, a: number, f: string) => { c.fillStyle = f; c.beginPath(); c.ellipse(x * s, y * s, rx * s, ry * s, a, 0, 7); c.fill(); };
  c.save(); c.translate(W / 2, H / 2); c.rotate(0.38); c.translate(-W / 2, -H / 2);
  // the red blanket under and round it, with cream stripes along its edge
  E(300, 420, 200, 300, 0, '#7a1e1c'); E(300, 418, 188, 288, 0, '#922a26');
  c.save(); c.beginPath(); c.ellipse(300 * s, 418 * s, 188 * s, 288 * s, 0, 0, 7); c.clip(); [[0.9, '#e8d6b0'], [0.84, '#3a2a22'], [0.8, '#e8d6b0']].forEach(([k, col]) => { c.strokeStyle = col as string; c.lineWidth = 12 * s; c.beginPath(); c.ellipse(300 * s, 418 * s, 188 * s * (k as number), 288 * s * (k as number), 0, 0, 7); c.stroke(); }); c.restore();
  // the cream swaddle: a body wound in three diagonal folds
  E(300, 450, 150, 250, 0, '#efe4cc');
  [[200, 360, 420, 470], [180, 480, 420, 590], [190, 590, 400, 680]].forEach(([x0, y0, x1, y1], i) => { c.strokeStyle = '#c9b898'; c.lineWidth = 10 * s; c.beginPath(); c.moveTo(x0 * s, y0 * s); c.quadraticCurveTo((x0 + x1) / 2 * s, (y0 + y1) / 2 * s - 40 * s, x1 * s, y1 * s); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 5 * s; c.beginPath(); c.moveTo(x0 * s, (y0 - 12) * s); c.quadraticCurveTo((x0 + x1) / 2 * s, ((y0 + y1) / 2 - 52) * s, x1 * s, (y1 - 12) * s); c.stroke(); void i; });
  E(370, 520, 70, 200, 0.2, 'rgba(120,96,70,0.16)');
  // the hood round the face
  E(300, 230, 150, 140, 0, '#e6d8bc'); E(300, 236, 118, 112, 0, '#d4c4a2');
  // the face
  const skin = '#d8a582', skinD = '#bf8a68';
  E(300, 250, 96, 98, 0, skin); E(318, 262, 74, 80, 0, '#dcab88'); E(240, 292, 18, 12, 0, '#e89a8a'); E(360, 292, 18, 12, 0, '#e89a8a');
  // a tuft of near-black hair
  Q([[230, 178], [262, 150], [300, 140], [342, 150], [372, 182], [340, 170], [310, 168], [296, 186], [280, 166], [252, 176]], '#1f1c22');
  Q([[296, 148], [306, 120], [320, 132], [310, 150]], '#1f1c22');
  // eyes
  c.lineCap = 'round';
  if (look === 'open') { [[262, 252], [338, 252]].forEach(([x, y]) => { E(x, y, 15, 17, 0, '#2a2026'); E(x - 4, y - 6, 5, 5, 0, '#ffffff'); }); c.strokeStyle = skinD; c.lineWidth = 4 * s; [[262, 228], [338, 228]].forEach(([x, y]) => { c.beginPath(); c.moveTo((x - 16) * s, y * s); c.quadraticCurveTo(x * s, (y - 6) * s, (x + 16) * s, y * s); c.stroke(); }); }
  else { c.strokeStyle = '#3a2a2a'; c.lineWidth = 6 * s; [[262, 256], [338, 256]].forEach(([x, y]) => { c.beginPath(); c.moveTo((x - 17) * s, y * s); c.quadraticCurveTo(x * s, (y + 12) * s, (x + 17) * s, y * s); c.stroke(); }); }
  // nose and mouth
  E(300, 282, 9, 6, 0, skinD); c.strokeStyle = '#a8584e'; c.lineWidth = 5 * s; c.beginPath(); c.moveTo(286 * s, 312 * s); c.quadraticCurveTo(300 * s, (look === 'open' ? 322 : 318) * s, 314 * s, 312 * s); c.stroke();
  // a small hand out of the swaddle, under the chin, on the right
  if (look === 'hand') { E(388, 368, 34, 30, 0.3, skin); E(410, 346, 12, 18, -0.4, skin); E(420, 362, 11, 16, -0.2, skin); E(424, 380, 10, 14, 0.1, skin); E(364, 352, 11, 15, -0.9, skin); c.strokeStyle = skinD; c.lineWidth = 3 * s; c.beginPath(); c.arc(388 * s, 372 * s, 18 * s, 0.4, 2.2); c.stroke(); E(360, 400, 52, 34, 0.4, '#efe4cc'); c.strokeStyle = '#c9b898'; c.lineWidth = 6 * s; c.beginPath(); c.moveTo(318 * s, 396 * s); c.quadraticCurveTo(360 * s, 380 * s, 410 * s, 410 * s); c.stroke(); }
  c.restore();
};
/** The swaddle as a picture that faces the lens; pos = its centre; w = its width in metres (about 0.42 for a newborn held
 *  at the chest). lit = takes the room's light (true indoors). */
export const Swaddle: React.FC<{pos: V3; look?: SwaddleLook; w?: number; tilt?: number; lit?: boolean}> = ({pos, look = 'closed', w = 0.42, tilt = 0}) => (
  <mesh position={pos} rotation={[0, 0, tilt]} renderOrder={510}><planeGeometry args={[w, w * 760 / 600]} /><meshLambertMaterial map={tex(`leu-swaddle-${look}`, 600, 760, paintSwaddle(look))} transparent alphaTest={0.35} /></mesh>
);
/** a walking stick of a crooked branch, knob at the top (for the old woman of d1c2 shot 14): flat picture, foot at the bottom */
export const paintCane = (c: Ctx, W: number, H: number) => {
  c.lineCap = 'round'; c.strokeStyle = '#5a3e26'; c.lineWidth = W * 0.22; c.beginPath(); c.moveTo(W * 0.5, H * 0.99); c.bezierCurveTo(W * 0.44, H * 0.7, W * 0.58, H * 0.4, W * 0.48, H * 0.08); c.stroke();
  c.strokeStyle = '#7a5838'; c.lineWidth = W * 0.08; c.beginPath(); c.moveTo(W * 0.46, H * 0.98); c.bezierCurveTo(W * 0.4, H * 0.7, W * 0.54, H * 0.4, W * 0.44, H * 0.08); c.stroke();
  c.fillStyle = '#4a3220'; c.beginPath(); c.ellipse(W * 0.48, H * 0.06, W * 0.22, H * 0.035, 0, 0, 7); c.fill();
  [0.3, 0.55, 0.78].forEach((t) => { c.fillStyle = '#3e2a1a'; c.beginPath(); c.ellipse(W * 0.5, H * t, W * 0.12, H * 0.008, 0.3, 0, 7); c.fill(); });
};
/** an arm sling: a triangle of cream linen knotted at the top, the shape of a forearm in it (for the man of d1c2 shot 14),
 *  laid over the chest of the figure (flat picture 300 x 300, the knot at the top centre) */
export const paintSling = (c: Ctx, W: number, H: number) => {
  P(c, [[W * 0.45, H * 0.02], [W * 0.58, H * 0.02], [W * 0.98, H * 0.55], [W * 0.8, H * 0.92], [W * 0.1, H * 0.78], [W * 0.05, H * 0.6]], '#e6dcc4');
  P(c, [[W * 0.1, H * 0.6], [W * 0.95, H * 0.58], [W * 0.8, H * 0.92], [W * 0.1, H * 0.78]], '#d4c8ac');
  c.strokeStyle = '#b8aa8a'; c.lineWidth = 4; c.beginPath(); c.moveTo(W * 0.12, H * 0.68); c.quadraticCurveTo(W * 0.5, H * 0.62, W * 0.9, H * 0.66); c.stroke();
  c.fillStyle = '#cfc2a2'; c.beginPath(); c.ellipse(W * 0.52, H * 0.06, W * 0.07, H * 0.05, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(160,60,50,0.4)'; c.lineWidth = 3; c.beginPath(); c.ellipse(W * 0.7, H * 0.72, W * 0.08, H * 0.04, 0, 0, 7); c.stroke();
};

// ================================================================ d1c4 and d1c5: the tent abandoned (`bo-hoang`) and the workshop
// (`xuong`); the mother's chest. Made 22/11/2026 (chapters 4 and 5 share them: the chest must stay ONE piece).
/** the colour of Cynthia's magic (her green flame, d1c3): the light in the chest */
export const MAGIC_GREEN = {glow: '#4fe08a', core: '#d4ffe2', deep: '#1f8a4a'};
const ease01 = (x: number) => { const q = Math.min(1, Math.max(0, x)); return q * q * (3 - 2 * q); };
/** CYNTHIA'S YELLOW HEADSCARF, folded (d1c4 shot 24, d1c5 shot 1): a folded square of yellow wool with its border band, one
 *  corner flap hanging over an edge. pos = the middle of the folded part on its support; flap = how far the corner hangs down
 *  in front (metres); rotY turns it. The cloth is the camp's `cynthiaScarfTex` (ONE scarf for the episode); hung on a
 *  hook it is the camp's `CynthiaScarf on="hook"`. */
export const FoldedScarf: React.FC<{pos: V3; rotY?: number; flap?: number; w?: number}> = ({pos, rotY = 0, flap = 0.16, w = 0.34}) => {
  const m = cynthiaScarfTex(0);
  /** the folded square shows the upper half of the cloth (no squashing: the cloth is 1:2), the flap the lower half with
   *  the border band and the fringe */
  const top = useMemo(() => { const g = new THREE.BoxGeometry(w, 0.04, w * 0.72); const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setY(i, 0.5 + uv.getY(i) * 0.36); return g; }, [w]);
  const fl = useMemo(() => { const g = new THREE.PlaneGeometry(w * 0.5, flap + 0.04); const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * 0.5); return g; }, [w, flap]);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh geometry={top} position={[0, 0.02, 0]} castShadow receiveShadow><meshLambertMaterial map={m} emissive="#5a3c06" emissiveIntensity={0.2} /></mesh>
      {[0.012, 0.026].map((y, i) => <mesh key={i} position={[0, y, w * 0.36 + 0.001]}><boxGeometry args={[w * 0.98, 0.003, 0.002]} /><meshLambertMaterial color="#8c3b2c" /></mesh>)}
      {flap > 0 ? <mesh geometry={fl} position={[w * 0.12, 0.03 - flap / 2, w * 0.36 + 0.03]} rotation={[0.08, 0, 0.12]} castShadow receiveShadow><meshLambertMaterial map={m} emissive="#5a3c06" emissiveIntensity={0.2} side={THREE.DoubleSide} transparent alphaTest={0.4} /></mesh> : null}
    </group>
  );
};
/** an iron hook on a post, for the headscarf: a plate with two nails and a hook bent up (pos = the hook's tip) */
export const ScarfHook: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <B p={[0, -0.03, -0.06]} s={[0.04, 0.1, 0.01]} c="#2e2c2c" cast={false} />
    <mesh position={[0, -0.05, -0.03]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.008, 0.008, 0.06, 6]} /><meshLambertMaterial color="#3a3634" /></mesh>
    <mesh position={[0, -0.03, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.022, 0.007, 5, 10, Math.PI]} /><meshLambertMaterial color="#3a3634" /></mesh>
  </group>
);

/** the lining of the lid: old madder red cloth, quilted in diamonds, brass tacks round the edge, a leather strap across
 *  the lower part with three loops (the vials stand in them) */
const liningTex = () => tex('leu-chest-lining', 512, 300, (c, W, H) => {
  const r = rnd(14); c.fillStyle = '#5e1c1a'; c.fillRect(0, 0, W, H);
  for (let q = 0; q < 26; q++) blob(c, r() * W, r() * H, W * 0.12, r() < 0.5 ? 'rgba(160,60,50,0.18)' : 'rgba(20,5,5,0.22)');
  c.strokeStyle = 'rgba(30,8,8,0.55)'; c.lineWidth = 2; for (let k = -H; k < W + H; k += 36) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + H, H); c.stroke(); c.beginPath(); c.moveTo(k + H, 0); c.lineTo(k, H); c.stroke(); }
  c.fillStyle = '#c9a24a'; for (let x = 10; x < W; x += 26) { c.beginPath(); c.arc(x, 9, 4, 0, 7); c.fill(); c.beginPath(); c.arc(x, H - 9, 4, 0, 7); c.fill(); } for (let y = 10; y < H; y += 26) { c.beginPath(); c.arc(9, y, 4, 0, 7); c.fill(); c.beginPath(); c.arc(W - 9, y, 4, 0, 7); c.fill(); }
  const sy = H * 0.62; c.fillStyle = '#6a4226'; c.fillRect(16, sy, W - 32, H * 0.12); c.strokeStyle = '#d8b47a'; c.lineWidth = 2; c.setLineDash([6, 5]); c.strokeRect(20, sy + 4, W - 40, H * 0.12 - 8); c.setLineDash([]);
  c.fillStyle = 'rgba(255,200,170,0.06)'; c.fillRect(0, 0, W, H * 0.5);
});
type Charm = 'leather' | 'coin' | 'feather' | 'sachet' | 'bone' | 'eye';
/** one charm hung on a string: a leather tab with burnt marks, a bronze coin with a hole, a bunch of feathers, a small sachet
 *  tied at the neck, a little bone, a blue glass eye bead (box 100 x 220, the string from the top) */
const paintCharm = (kind: Charm) => (c: Ctx, W: number, H: number) => {
  c.clearRect(0, 0, W, H); c.strokeStyle = '#c8b48a'; c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H * 0.45); c.stroke();
  const cy = H * 0.68;
  if (kind === 'coin') { c.fillStyle = '#a8742a'; c.beginPath(); c.arc(W / 2, cy, W * 0.36, 0, 7); c.fill(); c.strokeStyle = '#6a4418'; c.lineWidth = 4; c.stroke(); c.beginPath(); c.arc(W / 2, cy, W * 0.24, 0, 7); c.lineWidth = 2; c.stroke(); c.fillStyle = '#5e1c1a'; c.beginPath(); c.arc(W / 2, cy - W * 0.22, 6, 0, 7); c.fill(); c.fillStyle = 'rgba(255,240,200,0.4)'; c.beginPath(); c.arc(W * 0.4, cy - W * 0.1, W * 0.08, 0, 7); c.fill(); }
  else if (kind === 'leather') { P(c, [[W * 0.18, H * 0.45], [W * 0.82, H * 0.45], [W * 0.78, H * 0.95], [W * 0.5, H], [W * 0.22, H * 0.95]], '#7a4a2a'); c.strokeStyle = '#3a2214'; c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.5, H * 0.55); c.lineTo(W * 0.5, H * 0.85); c.moveTo(W * 0.32, H * 0.7); c.lineTo(W * 0.68, H * 0.7); c.stroke(); c.beginPath(); c.arc(W * 0.5, H * 0.7, W * 0.14, 0, 7); c.stroke(); }
  else if (kind === 'feather') { ['#e8e0cc', '#6a5a4a', '#3a4a5a'].forEach((col, i) => { c.save(); c.translate(W / 2, H * 0.45); c.rotate((i - 1) * 0.28); c.fillStyle = col; c.beginPath(); c.ellipse(0, H * 0.26, W * 0.13, H * 0.26, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(30,20,10,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, H * 0.5); c.stroke(); c.restore(); }); c.fillStyle = '#8c3b2c'; c.fillRect(W * 0.4, H * 0.43, W * 0.2, H * 0.05); }
  else if (kind === 'sachet') { P(c, [[W * 0.3, H * 0.5], [W * 0.7, H * 0.5], [W * 0.88, H * 0.92], [W * 0.12, H * 0.92]], '#6a7a4a'); P(c, [[W * 0.36, H * 0.42], [W * 0.64, H * 0.42], [W * 0.7, H * 0.52], [W * 0.3, H * 0.52]], '#566640'); c.fillStyle = '#8c3b2c'; c.fillRect(W * 0.3, H * 0.5, W * 0.4, H * 0.04); c.fillStyle = 'rgba(255,240,200,0.25)'; c.fillRect(W * 0.2, H * 0.6, W * 0.12, H * 0.25); }
  else if (kind === 'bone') { c.fillStyle = '#e8dfc8'; c.fillRect(W * 0.42, H * 0.5, W * 0.16, H * 0.4); [0.5, 0.9].forEach((y) => { c.beginPath(); c.arc(W * 0.4, H * y, W * 0.11, 0, 7); c.arc(W * 0.6, H * y, W * 0.11, 0, 7); c.fill(); }); c.strokeStyle = 'rgba(90,70,40,0.5)'; c.lineWidth = 2; c.strokeRect(W * 0.42, H * 0.5, W * 0.16, H * 0.4); }
  else { c.fillStyle = '#1f4f9a'; c.beginPath(); c.arc(W / 2, cy, W * 0.3, 0, 7); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(W / 2, cy, W * 0.2, 0, 7); c.fill(); c.fillStyle = '#5aa8e0'; c.beginPath(); c.arc(W / 2, cy, W * 0.12, 0, 7); c.fill(); c.fillStyle = '#101820'; c.beginPath(); c.arc(W / 2, cy, W * 0.06, 0, 7); c.fill(); }
};
/** a vial with its cork, a hand-written paper label and the leather loop that holds it, ONE picture (lesson of d1c2: a vial
 *  in several pieces came apart in the hand). colour = the potion. Box 120 x 300. */
const paintStrapVial = (col: string, label: string) => (c: Ctx, W: number, H: number) => {
  c.clearRect(0, 0, W, H);
  c.fillStyle = '#9a7650'; c.fillRect(W * 0.36, 0, W * 0.28, H * 0.12); c.fillStyle = '#7a5838'; c.fillRect(W * 0.36, H * 0.08, W * 0.28, H * 0.04);
  c.fillStyle = 'rgba(220,235,230,0.55)'; c.fillRect(W * 0.38, H * 0.12, W * 0.24, H * 0.14);
  c.beginPath(); c.moveTo(W * 0.38, H * 0.26); c.quadraticCurveTo(W * 0.08, H * 0.34, W * 0.1, H * 0.6); c.lineTo(W * 0.12, H * 0.94); c.quadraticCurveTo(W * 0.5, H, W * 0.88, H * 0.94); c.lineTo(W * 0.9, H * 0.6); c.quadraticCurveTo(W * 0.92, H * 0.34, W * 0.62, H * 0.26); c.closePath(); c.fillStyle = 'rgba(220,235,230,0.5)'; c.fill();
  c.save(); c.clip(); c.fillStyle = col; c.fillRect(0, H * 0.42, W, H); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(W * 0.2, H * 0.36, W * 0.1, H * 0.5); c.restore();
  c.strokeStyle = 'rgba(40,40,40,0.6)'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#efe4c8'; c.fillRect(W * 0.2, H * 0.6, W * 0.6, H * 0.14); c.fillStyle = '#4a3424'; c.font = `bold ${H * 0.07}px "Chalkboard SE", "Noteworthy", cursive`; c.textAlign = 'center'; c.fillText(label, W / 2, H * 0.695);
  c.fillStyle = '#6a4226'; c.fillRect(0, H * 0.76, W, H * 0.12); c.strokeStyle = '#d8b47a'; c.lineWidth = 2; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(4, H * 0.78); c.lineTo(W - 4, H * 0.78); c.moveTo(4, H * 0.86); c.lineTo(W - 4, H * 0.86); c.stroke(); c.setLineDash([]);
};
/** the string of charms hung over the edge of the lid (beads, small bones, coins with holes), one picture 400 x 200 */
const paintCharmString = (c: Ctx, W: number, H: number) => {
  c.clearRect(0, 0, W, H); const pt = (t: number): [number, number] => [W * (0.04 + t * 0.92), H * (0.06 + 0.7 * Math.sin(Math.PI * t))];
  c.strokeStyle = '#c8b48a'; c.lineWidth = 3; c.beginPath(); for (let t = 0; t <= 1; t += 0.02) { const [x, y] = pt(t); if (t) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke();
  for (let i = 1; i < 18; i++) { const t = i / 18, [x, y] = pt(t), k = i % 4;
    if (k === 0) { c.fillStyle = '#a8742a'; c.beginPath(); c.arc(x, y + 14, 12, 0, 7); c.fill(); c.fillStyle = '#5e1c1a'; c.beginPath(); c.arc(x, y + 6, 3, 0, 7); c.fill(); }
    else if (k === 2) { c.fillStyle = '#e8dfc8'; c.fillRect(x - 4, y, 8, 22); c.beginPath(); c.arc(x - 3, y + 22, 5, 0, 7); c.arc(x + 3, y + 22, 5, 0, 7); c.fill(); }
    else { c.fillStyle = k === 1 ? '#8c3b2c' : '#2e6a8a'; c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.arc(x - 2, y - 2, 2.5, 0, 7); c.fill(); } }
};
/** a dark leather book cover: tooled border; sigil = a circle with a star of lines and marks round it (the spell book) */
const bookTex = (col: string, sigil: boolean) => tex(`leu-book-${col}-${sigil ? 1 : 0}`, 256, 320, (c, W, H) => {
  const r = rnd(col.length + (sigil ? 9 : 2)); c.fillStyle = col; c.fillRect(0, 0, W, H);
  for (let q = 0; q < 20; q++) blob(c, r() * W, r() * H, W * 0.2, r() < 0.5 ? 'rgba(255,220,180,0.08)' : 'rgba(0,0,0,0.18)');
  c.strokeStyle = 'rgba(200,160,90,0.6)'; c.lineWidth = 4; c.strokeRect(14, 14, W - 28, H - 28); c.lineWidth = 2; c.strokeRect(24, 24, W - 48, H - 48);
  if (sigil) { const cx = W / 2, cy = H / 2, R = W * 0.3; c.strokeStyle = '#f0cc6a'; c.lineWidth = 9; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke(); c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R * 0.8, 0, 7); c.stroke();
    c.beginPath(); for (let k = 0; k <= 5; k++) { const a = -Math.PI / 2 + k * (Math.PI * 4 / 5); const x = cx + Math.cos(a) * R * 0.78, y = cy + Math.sin(a) * R * 0.78; if (k) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.28; c.fillStyle = '#d8b45a'; c.fillRect(cx + Math.cos(a) * R * 1.15 - 4, cy + Math.sin(a) * R * 1.15 - 4, 8, 8); } }
});
/** A BOOK: a leather cover box with cream page edges; sigil = the spell book's circle on the cover (top face). Lies flat. */
export const SpellBook: React.FC<{pos: V3; rotY?: number; rot?: V3; size?: V3; color?: string; sigil?: boolean; glow?: number}> = ({pos, rotY = 0, rot, size = [0.26, 0.05, 0.34], color = '#3e2a22', sigil = false, glow = 0}) => {
  const [w, h, d] = size, cov = bookTex(color, sigil);
  return (
    <group position={pos} rotation={rot ?? [0, rotY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[w * 0.97, h * 0.8, d * 0.97]} /><meshLambertMaterial color="#e8dcc0" /></mesh>
      <mesh position={[0, h - 0.006, 0]} castShadow receiveShadow><boxGeometry args={[w, 0.012, d]} /><meshLambertMaterial map={cov} emissive={MAGIC_GREEN.glow} emissiveIntensity={sigil ? glow * 0.06 : 0} /></mesh>
      <mesh position={[0, 0.006, 0]} receiveShadow><boxGeometry args={[w, 0.012, d]} /><meshLambertMaterial color={color} /></mesh>
      <mesh position={[-w / 2 + 0.006, h / 2, 0]}><boxGeometry args={[0.014, h, d]} /><meshLambertMaterial color={color} /></mesh>
    </group>
  );
};
/** the coarse cloth that covered the chest: a heap on the floor once pulled off (low lumpy mound of grey-brown sacking) */
/** the cover cloth: coarse undyed wool gone grey-brown, a woven check of darker threads, a faded madder stripe near each
 *  edge, darns, dust lying thick in the middle (the top, where it settles) and thinner towards the edges; a frayed hem cut
 *  out of the border (the material uses alphaTest) */
const coverClothTex = () => tex('leu-cover-cloth', 1024, 1024, (c, W, H) => {
  const r = rnd(33); c.fillStyle = '#8e7a5c'; c.fillRect(0, 0, W, H);
  for (let q = 0; q < 60; q++) blob(c, r() * W, r() * H, W * (0.04 + r() * 0.1), r() < 0.5 ? 'rgba(60,44,28,0.14)' : 'rgba(200,180,140,0.1)');
  c.globalAlpha = 0.18; for (let y = 0; y < H; y += 4) { c.fillStyle = y % 8 ? '#2a1e12' : '#e8dcc0'; c.fillRect(0, y, W, 1.5); } for (let x = 0; x < W; x += 4) { c.fillStyle = x % 8 ? '#2a1e12' : '#e8dcc0'; c.fillRect(x, 0, 1.5, H); } c.globalAlpha = 1;
  c.fillStyle = 'rgba(70,52,34,0.35)'; for (let k = 40; k < W; k += 64) { c.fillRect(k, 0, 6, H); c.fillRect(0, k, W, 6); }
  [0.1, 0.9].forEach((t) => { c.fillStyle = 'rgba(140,60,44,0.45)'; c.fillRect(0, H * t - 10, W, 20); c.fillRect(W * t - 10, 0, 20, H); });
  for (let q = 0; q < 5; q++) { const x = W * (0.2 + r() * 0.6), y = H * (0.2 + r() * 0.6); c.fillStyle = '#7a6a50'; c.fillRect(x - 30, y - 22, 60, 44); c.strokeStyle = '#c8b48a'; c.lineWidth = 2; for (let t = -26; t < 26; t += 6) { c.beginPath(); c.moveTo(x + t, y - 24); c.lineTo(x + t + 3, y + 24); c.stroke(); } }
  // dust: thick in the middle third (the lid), fading out
  const g = c.createRadialGradient(W * 0.56, H / 2, W * 0.05, W * 0.56, H / 2, W * 0.42); g.addColorStop(0, 'rgba(214,204,182,0.55)'); g.addColorStop(0.6, 'rgba(214,204,182,0.25)'); g.addColorStop(1, 'rgba(214,204,182,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let q = 0; q < 900; q++) { const x = W * (0.25 + r() * 0.62), y = H * (0.2 + r() * 0.6); c.fillStyle = `rgba(225,216,196,${0.15 + r() * 0.3})`; c.fillRect(x, y, 2 + r() * 3, 2 + r() * 3); }
  c.globalCompositeOperation = 'destination-out';
  const hem = (horiz: boolean, at: number) => { for (let t = 0; t < W; t += 5 + r() * 9) { const d = 6 + Math.pow(r(), 3) * 30; if (horiz) c.fillRect(t, at === 0 ? 0 : H - d, 3 + r() * 3, d); else c.fillRect(at === 0 ? 0 : W - d, t, d, 3 + r() * 3); } };
  hem(true, 0); hem(true, 1); hem(false, 0); hem(false, 1);
  c.globalCompositeOperation = 'source-over';
});
/** the drape of the cover: sacking with folds running down and a frayed, uneven hem (cut out) */
const drapeTex = () => tex('leu-sack-drape', 512, 512, (c, W, H) => { const r = rnd(21); c.fillStyle = '#8a7a62'; c.fillRect(0, 0, W, H);
  c.globalAlpha = 0.16; for (let y = 0; y < H; y += 4) { c.fillStyle = '#000'; c.fillRect(0, y, W, 2); } c.globalAlpha = 1;
  for (let q = 0; q < 9; q++) { const x = r() * W, w2 = 18 + r() * 40, g = c.createLinearGradient(x - w2, 0, x + w2, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, `rgba(40,30,20,${0.25 + r() * 0.2})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - w2, H * 0.1, 2 * w2, H); c.fillStyle = 'rgba(255,245,220,0.12)'; c.fillRect(x + w2 * 0.6, H * 0.1, 6, H); }
  c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 16) c.lineTo(x, H - 10 - r() * 40 - 25 * Math.sin(x / 70)); c.lineTo(W, H); c.closePath(); c.fill(); c.globalCompositeOperation = 'source-over';
  c.strokeStyle = 'rgba(120,104,80,0.8)'; c.lineWidth = 2; for (let x = 0; x < W; x += 6) { const y = H - 30 - 25 * Math.sin(x / 70); c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 6, y + 6 + r() * 12); c.stroke(); } });
const sackTex = () => tex('leu-sack-cover', 512, 512, (c, W, H) => { const r = rnd(19); c.fillStyle = '#8a7a62'; c.fillRect(0, 0, W, H); c.globalAlpha = 0.16; for (let y = 0; y < H; y += 4) { c.fillStyle = '#000'; c.fillRect(0, y, W, 2); } for (let x = 0; x < W; x += 4) { c.fillStyle = '#fff'; c.fillRect(x, 0, 1, H); } c.globalAlpha = 1; for (let q = 0; q < 30; q++) blob(c, r() * W, r() * H, W * 0.15, r() < 0.5 ? 'rgba(40,30,20,0.2)' : 'rgba(255,240,210,0.1)'); });

/** THE MOTHER'S CHEST (d1c4 shots 23, 24; d1c5 shots 1 to 4; the same chest as `IronChest` of the tent, now with a lid that
 *  opens). Wood with three iron bands, a brass lock plate, rope handles; a domed lid hinged at the back.
 *    open  0..1: the lid swings up and back about its rear edge (1 = upright, leaning back a little, inside facing the lens).
 *    seam  0..1: green light of Cynthia's magic: closed, a thin line along the lid's edge and the keyhole, a green light in
 *          front; open, a green light inside that lights the lid, the books and whoever stands near.
 *    cover 0..1: the coarse cloth over it (0 = covering the chest and spilling to the floor, 1 = pulled off, a heap on the
 *          floor at the left); in between it slides off to the left and drops.
 *  On the lid (closed): Cynthia's folded yellow headscarf with a corner hanging over the front, a string of charms over the
 *  front edge, two candle stubs (candles = lit). As the lid rises past 0.15 the scarf slides off and ends draped over the
 *  front rim; the candles stand on the floor at the right once the lid is open. Inside the lid: old red lining, six charms on
 *  strings that swing (f), three vials in leather loops (green, purple, amber; ONE picture each). Inside the chest: a stack
 *  of leather books, the spell book with the circle on its cover leaning on top. pos = foot centre, front faces +z. */
export const MotherChest: React.FC<{pos: V3; rotY?: number; open?: number; seam?: number; cover?: number; candles?: boolean; scarf?: boolean; f?: number; w?: number; d?: number; h?: number}> =
  ({pos, rotY = 0, open = 0, seam = 0, cover = 1, candles = false, scarf = true, f = 0, w = 0.9, d = 0.5, h = 0.48}) => {
    const wood = tex('leu-chest-wood', 512, 256, paintPlanks(17, {base: '#6e4a2e', n: 4, knots: 0.6, age: 0.8, nails: true}));
    const iron = '#2e2c2c', t = 0.03, dome = 0.14, ang = -open * 1.9, G = MAGIC_GREEN;
    const slide = ease01((open - 0.12) / 0.45), shut = open < 0.04;
    const charms: Charm[] = ['leather', 'coin', 'feather', 'sachet', 'bone', 'eye'];
    const domeGeo = useMemo(() => { const g = new THREE.CylinderGeometry(d / 2, d / 2, w, 14, 1, true, 0, Math.PI); g.rotateZ(Math.PI / 2); g.scale(1, dome / (d / 2), 1); return g; }, [w, d]);
    const bandGeo = useMemo(() => { const g = new THREE.CylinderGeometry(d / 2 + 0.008, d / 2 + 0.008, 0.05, 14, 1, true, 0, Math.PI); g.rotateZ(Math.PI / 2); g.scale(1, (dome + 0.008) / (d / 2 + 0.008), 1); return g; }, [d]);
    const top = h + dome;
    /** THE COVER CLOTH DRAPED OVER THE CHEST: one sheet (a grid), each point laid on the chest by how far it is from the top:
     *  on the lid it follows the dome (with lumps where the scarf and the candles are under it); past the edge it hangs down
     *  the side in folds that grow towards the ground; what is left lies on the floor and spreads out, the hem wavy and
     *  frayed. The sheet sits a little to the left, so more of it spills on the left. */
    const drapeGeo = useMemo(() => {
      const a = w / 2 + 0.012, b = d / 2 + 0.012, SX = 2.15, SZ = 1.62, cx = -0.12, nx = 86, nz = 66, g = new THREE.PlaneGeometry(SX, SZ, nx, nz); g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position as THREE.BufferAttribute, r = rnd(31);
      const topY = (x: number, z: number) => { const q = Math.min(1, Math.abs(z) / b); return h + 0.012 + dome * Math.sqrt(Math.max(0, 1 - q * q)) + 0.04 * Math.exp(-((x + 0.2) ** 2 + (z - 0.12) ** 2) / 0.012) + 0.05 * Math.exp(-((x - 0.33) ** 2 + z ** 2) / 0.004); };
      const ph = [r() * 6, r() * 6, r() * 6, r() * 6];
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) + cx, z = pos.getZ(i), dx = Math.max(0, Math.abs(x) - a), dz = Math.max(0, Math.abs(z) - b), e = Math.hypot(dx, dz);
        const clx = Math.max(-a, Math.min(a, x)), clz = Math.max(-b, Math.min(b, z));
        if (e === 0) { pos.setXYZ(i, x, topY(x, z) + 0.004 * Math.sin(x * 37 + z * 19), z); continue; }
        const ox = dx > 0 ? Math.sign(x) * dx / e : 0, oz = dz > 0 ? Math.sign(z) * dz / e : 0, edge = topY(clx, clz);
        // folds: along the edge, deeper further down, a little wavy so they are not combed straight
        const along = dz > dx ? x : z, side = dz > dx ? (z > 0 ? 0 : 1) : (x > 0 ? 2 : 3), fold = Math.sin(along * 23 + ph[side] + Math.sin(along * 7) * 1.4);
        if (e < edge) { const k = e / edge, out = 0.01 + 0.012 * k + 0.045 * k * k * (0.5 + 0.5 * fold) + 0.02 * k * k;
          pos.setXYZ(i, clx + ox * out, edge - e * (1 - 0.06 * k), clz + oz * out); }
        else { const f2 = e - edge, out = 0.03 + 0.045 * (0.5 + 0.5 * fold) + f2 * 0.92;
          pos.setXYZ(i, clx + ox * out + (oz !== 0 ? 0.015 * fold : 0), 0.008 + 0.012 * Math.max(0, 1 - f2 / 0.08) * (0.5 + 0.5 * fold) + 0.004 * Math.sin(f2 * 60), clz + oz * out + (ox !== 0 ? 0.015 * fold : 0)); }
      }
      g.computeVertexNormals(); return g;
    }, [w, d, h]);
    /** the cloth over the lid: a sagging sheet following the dome, with lumps where the scarf and the candles are under it */
    return (
      <group position={pos} rotation={[0, rotY, 0]}>
        {/* the body: a box of planks, open at the top, dark inside */}
        <mesh position={[0, t / 2, 0]} castShadow receiveShadow><boxGeometry args={[w, t, d]} /><meshLambertMaterial map={wood} /></mesh>
        {([[0, h / 2, d / 2 - t / 2, w, h, t], [0, h / 2, -d / 2 + t / 2, w, h, t], [-w / 2 + t / 2, h / 2, 0, t, h, d], [w / 2 - t / 2, h / 2, 0, t, h, d]] as number[][]).map(([x, y, z, a, b, c2], i) =>
          <mesh key={i} position={[x, y, z]} castShadow receiveShadow><boxGeometry args={[a, b, c2]} /><meshLambertMaterial map={wood} /></mesh>)}
        <mesh position={[0, h * 0.5, 0]}><boxGeometry args={[w - 2 * t - 0.002, h - 0.02, d - 2 * t - 0.002]} /><meshLambertMaterial color="#2a1210" side={THREE.BackSide} /></mesh>
        {[-0.36, 0, 0.36].map((x) => <group key={x}>
          <B p={[x * w, h / 2, d / 2 + 0.006]} s={[0.05, h, 0.012]} c={iron} cast={false} />
          {[0.15, 0.5, 0.85].map((q) => <mesh key={q} position={[x * w, h * q, d / 2 + 0.014]}><boxGeometry args={[0.016, 0.016, 0.01]} /><meshLambertMaterial color="#8a8680" /></mesh>)}
        </group>)}
        <B p={[0, h * 0.8, d / 2 + 0.012]} s={[0.11, 0.13, 0.01]} c="#7a5a28" cast={false} />
        <mesh position={[0, h * 0.78, d / 2 + 0.019]}><boxGeometry args={[0.022, 0.045, 0.004]} /><meshBasicMaterial color={seam > 0 ? G.glow : '#14110e'} transparent opacity={seam > 0 ? 0.4 + 0.6 * seam : 1} toneMapped={false} /></mesh>
        {[-1, 1].map((sd) => <mesh key={sd} position={[sd * (w / 2 + 0.03), h * 0.7, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.06, 0.012, 4, 10, Math.PI]} /><meshLambertMaterial color="#9a8458" /></mesh>)}
        <ContactShade r={w * 0.7} />
        {/* the inside: books, the spell book leaning on top of the stack; the green light */}
        {open > 0.02 ? <group>
          {[['#3e2a22', 0.06], ['#2e3a2a', 0.05], ['#4a2420', 0.055]].map(([col, th], i) => <SpellBook key={i} pos={[-0.12 + i * 0.03, t + i * 0.06, 0.02]} rotY={(i - 1) * 0.12} size={[0.3, th as number, 0.36]} color={col as string} />)}
          <SpellBook pos={[0.08, 0.38, -0.12]} rot={[1.4, 0, -0.05]} size={[0.28, 0.06, 0.36]} color="#3a2420" sigil glow={seam} />
          {seam > 0 ? <><pointLight position={[0, h * 0.75, 0.05]} color={G.glow} intensity={2.6 * seam} distance={3.5} decay={1.6} />
            <Halo pos={[0, h + 0.02, 0.05]} r={0.5 * seam + 0.1} color={G.glow} strength={0.45 * seam} /></> : null}
        </group> : null}
        {/* the seam glowing while shut */}
        {shut && seam > 0 ? <>
          <mesh position={[0, h + 0.004, d / 2 + 0.003]}><boxGeometry args={[w * 0.96, 0.01, 0.004]} /><meshBasicMaterial color={G.core} transparent opacity={Math.min(1, seam * 1.4)} toneMapped={false} /></mesh>
          {[-0.3, 0, 0.3].map((x) => <Halo key={x} pos={[x * w, h + 0.005, d / 2 + 0.03]} r={0.14 * seam + 0.02} color={G.glow} strength={0.5 * seam} />)}
          <Halo pos={[0, h * 0.78, d / 2 + 0.03]} r={0.04 * seam + 0.015} color={G.glow} strength={0.5 * seam} />
          <pointLight position={[0, h + 0.04, d / 2 + 0.3]} color={G.glow} intensity={0.2 * seam} distance={1.2} decay={2} />
        </> : null}
        {/* the lid, hinged at the back top edge */}
        <group position={[0, h, -d / 2]} rotation={[ang, 0, 0]}>
          <group position={[0, 0, d / 2]}>
            <mesh geometry={domeGeo} castShadow receiveShadow><meshLambertMaterial map={wood} side={THREE.DoubleSide} /></mesh>
            {[-0.36, 0, 0.36].map((x) => <mesh key={x} geometry={bandGeo} position={[x * w, 0, 0]}><meshLambertMaterial color={iron} side={THREE.DoubleSide} /></mesh>)}
            {/* the inside face of the lid, with its charms and vials (seen when open) */}
            <group position={[0, -0.003, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh position={[0, 0, 0.001]}><planeGeometry args={[w - 0.02, d - 0.02]} /><meshLambertMaterial map={liningTex()} side={THREE.DoubleSide} /></mesh>
              {open > 0.02 ? <>
                {charms.map((k, i) => { const x = -0.36 + i * 0.145, sw = Math.sin(f * 0.16 + i * 1.7) * 0.18 * (0.4 + open), len = 0.1 + (i % 3) * 0.025;
                  return <group key={k} position={[x, d / 2 - 0.04, 0.012 + i * 0.001]} rotation={[0, 0, sw]}><mesh position={[0, -len / 2 - 0.02, 0]}><planeGeometry args={[len * 0.45, len + 0.04]} /><meshLambertMaterial map={tex(`leu-charm-${k}`, 100, 220, paintCharm(k))} transparent alphaTest={0.3} side={THREE.DoubleSide} /></mesh></group>; })}
                {([[MAGIC_GREEN.deep, 'sinh lực'], ['#6a3a8a', 'giấc ngủ'], ['#c88a2e', 'đông máu']] as [string, string][]).map(([col, lb], i) =>
                  <mesh key={lb} position={[-0.22 + i * 0.22, -d / 2 + 0.135, 0.016]}><planeGeometry args={[0.07, 0.175]} /><meshLambertMaterial map={tex(`leu-strap-vial-${i}`, 120, 300, paintStrapVial(col, lb))} transparent alphaTest={0.25} emissive={col} emissiveIntensity={0.15} side={THREE.DoubleSide} /></mesh>)}
              </> : null}
            </group>
            {/* the string of charms over the front edge: kept hanging straight down whatever the lid does */}
            <group position={[0, 0.0, d / 2 + 0.012]} rotation={[-ang, 0, 0]}>
              <mesh position={[-0.05, -0.05, 0]} rotation={[0, 0, Math.sin(f * 0.13) * 0.04]}><planeGeometry args={[0.5, 0.2]} /><meshLambertMaterial map={tex('leu-charm-string', 400, 200, paintCharmString)} transparent alphaTest={0.3} side={THREE.DoubleSide} /></mesh>
            </group>
          </group>
        </group>
        {/* the headscarf: on the lid, then sliding down to drape over the front rim */}
        {scarf && (cover > 0.7 || open > 0) ? (() => { const s = slide, p0: V3 = [-0.2, top - 0.035, 0.13], p1: V3 = [-0.08, h - 0.012, d / 2 - 0.05], y = p0[1] + (p1[1] - p0[1]) * s + Math.sin(s * Math.PI) * 0.06;
          return <FoldedScarf pos={[p0[0] + (p1[0] - p0[0]) * s, y, p0[2] + (p1[2] - p0[2]) * s]} rotY={0.1 - s * 0.15} flap={0.16 + 0.12 * s} />; })() : null}
        {/* two candle stubs: on the lid while shut, on the floor at the right once it opens */}
        {[[0.3, -0.06, 0.07], [0.37, 0.07, 0.05]].map(([x, z, ch], i) => { const base: V3 = shut ? [x, top - 0.02 - Math.abs(x) * 0.0, z] : [w / 2 - 0.05 + i * 0.09, 0, d / 2 + 0.12 + i * 0.05];
          return <group key={i} position={base}>
            <mesh position={[0, ch / 2, 0]} castShadow><cylinderGeometry args={[0.022, 0.026, ch, 8]} /><meshLambertMaterial color="#e8dcc0" /></mesh>
            <mesh position={[0.012, ch * 0.4, 0.02]}><boxGeometry args={[0.01, ch * 0.6, 0.008]} /><meshLambertMaterial color="#efe6d0" /></mesh>
            <mesh position={[0, 0.004, 0]}><cylinderGeometry args={[0.04, 0.045, 0.008, 10]} /><meshLambertMaterial color="#e0d4b6" /></mesh>
            {candles ? <><mesh position={[0, ch + 0.022, 0]} scale={[1, 1 + 0.12 * Math.sin(f * 0.9 + i), 1]}><coneGeometry args={[0.009, 0.034, 6]} /><meshBasicMaterial color="#ffe4a0" toneMapped={false} /></mesh>
              <Halo pos={[0, ch + 0.02, 0.02]} r={0.2} color="#ffc070" strength={0.65} /><pointLight position={[0, ch + 0.05, 0.05]} color="#ffb860" intensity={2.2} distance={4.5} decay={1.4} /></> : null}
          </group>; })}
        {/* the cover cloth: draped over everything, sliding off to the left and dropping into a heap */}
        {cover < 0.85 ? (() => { const p = cover, dx = -p * 0.85, dy = -Math.max(0, p - 0.35) * 0.55, tilt = p * 0.7, sq = 1 - Math.max(0, p - 0.55) * 1.8;
          return <group position={[dx, dy, 0]} rotation={[0, 0, tilt]} scale={[1, Math.max(0.2, sq), 1]}>
            <mesh geometry={drapeGeo} castShadow receiveShadow><meshLambertMaterial map={coverClothTex()} side={THREE.DoubleSide} transparent alphaTest={0.45} /></mesh>
          </group>; })() : null}
        {cover > 0.6 ? <group position={[-w / 2 - 0.42, 0, 0.0]} scale={[Math.min(1, (cover - 0.6) / 0.25), Math.min(1, (cover - 0.6) / 0.25), Math.min(1, (cover - 0.6) / 0.25)]}>
          <FacetLathe profile={[[0.001, 0], [0.34, 0], [0.36, 0.04], [0.26, 0.09], [0.12, 0.13], [0.001, 0.14]]} sides={9} wobble={0.25} seed={4} squash={0.7} color="#8a7a62" />
        </group> : null}
      </group>
    );
  };

// ---------------------------------------------------------------- the abandoned tent
/** a cobweb: radial threads and a spiral, sagging, a few broken strands and dust on them (flat, transparent) */
export const paintCobweb = (seed = 1) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed); c.clearRect(0, 0, W, H); const cx = W * 0.12, cy = H * 0.12, n = 9, R = W * 1.1;
  c.strokeStyle = 'rgba(235,232,224,0.75)'; c.lineWidth = 1.6;
  const rays = Array.from({length: n}, (_, i) => (i / (n - 1)) * (Math.PI / 2) + (r() - 0.5) * 0.08);
  rays.forEach((a) => { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.stroke(); });
  for (let q = 1; q < 9; q++) { const rad = q * R * 0.1; c.beginPath(); rays.forEach((a, i) => { const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad; if (!i) { c.moveTo(x, y); return; } const pa = rays[i - 1], mx = cx + Math.cos((a + pa) / 2) * rad * 0.9, my = cy + Math.sin((a + pa) / 2) * rad * 0.9; if (r() < 0.12) c.moveTo(x, y); else c.quadraticCurveTo(mx, my, x, y); }); c.stroke(); }
  c.fillStyle = 'rgba(220,215,205,0.5)'; for (let q = 0; q < 40; q++) { const a = r() * Math.PI / 2, d = r() * R * 0.8; c.beginPath(); c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.5 + r() * 2, 0, 7); c.fill(); }
};
/** A cobweb strung in a corner (pos = the corner the threads come from; the web spreads to +x and -y of its plane; rotY and
 *  flip turn it into any corner). */
export const Cobweb: React.FC<{pos: V3; size?: number; rotY?: number; flipX?: boolean; seed?: number}> = ({pos, size = 0.5, rotY = 0, flipX = false, seed = 1}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={[flipX ? -1 : 1, 1, 1]}>
    <mesh position={[size * 0.5, -size * 0.5, 0]} renderOrder={4}><planeGeometry args={[size, size]} /><meshBasicMaterial map={tex(`leu-cobweb-${seed}`, 400, 400, paintCobweb(seed))} transparent depthWrite={false} side={THREE.DoubleSide} opacity={0.8} /></mesh>
  </group>
);
/** THE HEALER'S TABLE KNOCKED ON ITS SIDE (bo-hoang): the top board standing up facing +z, the legs sticking back towards
 *  the wall, a little tilted; pos = the foot of the top board's middle. */
export const TippedTable: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => {
  const {w, d, h} = BAN_THUOC, top = tex('leu-table-top', 1024, 440, paintPlanks(23, {base: '#8a6644', n: 3, knots: 0.7, age: 0.7, nails: true})), legT = tex('leu-table-leg', 64, 512, paintPlanks(24, {base: '#6e5034', n: 1, vertical: true, age: 0.6}));
  return (
    <group position={pos} rotation={[0, rotY, 0.03]}>
      <mesh position={[0, d / 2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow><boxGeometry args={[w, 0.06, d]} /><meshLambertMaterial map={top} /></mesh>
      {[[-1, 0.08], [1, 0.08], [-1, d - 0.08], [1, d - 0.08]].map(([sx, y], i) => <mesh key={i} position={[sx * (w / 2 - 0.1), y, -0.03 - (h - 0.06) / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow><boxGeometry args={[0.07, h - 0.06, 0.07]} /><meshLambertMaterial map={legT} /></mesh>)}
      <B p={[0, 0.08, -0.03 - (h - 0.24)]} s={[w - 0.2, 0.04, 0.05]} c="#5e4430" />
      <ContactShade r={w * 0.6} />
    </group>
  );
};
/** broken glass on the floor: shards of green, amber and brown glass, a vial lying on its side, a dark stain where it ran */
export const BrokenGlass: React.FC<{pos: V3; seed?: number}> = ({pos, seed = 3}) => {
  const sh = useMemo(() => { const r = rnd(seed); return Array.from({length: 11}, () => [(r() - 0.5) * 0.6, (r() - 0.5) * 0.35, r() * 6.28, 0.03 + r() * 0.04, ['#4f9a52', '#c88a2e', '#6a4426'][Math.floor(r() * 3)]] as const); }, [seed]);
  return (
    <group position={pos}>
      <mesh position={[0.05, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0.4]}><circleGeometry args={[0.2, 14]} /><meshBasicMaterial color="#2a1e14" transparent opacity={0.35} depthWrite={false} /></mesh>
      {sh.map(([x, z, a, s, col], i) => <mesh key={i} position={[x, 0.006 + i * 0.0004, z]} rotation={[-Math.PI / 2, 0, a]}><circleGeometry args={[s, 3]} /><meshPhongMaterial color={col} transparent opacity={0.75} shininess={120} specular="#ffffff" /></mesh>)}
      <group position={[-0.12, 0.035, 0.06]} rotation={[0, 0.6, Math.PI / 2]}><GlassVial pos={[0, -0.08, 0]} color="#c88a2e" h={0.15} kind="flask" /></group>
    </group>
  );
};
/** the straw bed rolled up and stood on end in a corner, tied with a rope, the red blanket round it */
export const RolledPallet: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow><cylinderGeometry args={[0.2, 0.22, 0.9, 12]} /><meshLambertMaterial map={strawTex()} /></mesh>
    <mesh position={[0, 0.5, 0]} castShadow receiveShadow><cylinderGeometry args={[0.215, 0.235, 0.55, 12, 1, true, -0.6, 3.6]} /><meshLambertMaterial map={blanketTex(2)} side={THREE.DoubleSide} /></mesh>
    {[0.2, 0.78].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.225, 0.012, 5, 16]} /><meshLambertMaterial color="#b8a47a" /></mesh>)}
    <ContactShade r={0.35} />
  </group>
);
/** the mother's old things round her chest: two wicker baskets (one with a folded red dress on it), a rolled striped
 *  blanket stood on end, a bronze hand mirror lying face down. Placed for the chest at (2.35, -4.45) of LeuThayLang. */
export const MotherThings: React.FC = () => (
  <group>
    <Basket pos={[1.62, 0, -4.66]} s={0.85} tall seed={6} />
    <mesh position={[1.62, 0.445, -4.66]} rotation={[0, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[0.34, 0.07, 0.26]} /><meshLambertMaterial map={blanketTex(5)} color="#c06058" /></mesh>
    <mesh position={[2.88, 0.36, -4.3]} castShadow receiveShadow><cylinderGeometry args={[0.1, 0.1, 0.72, 10]} /><meshLambertMaterial map={tex('leu-roll-stripe', 256, 256, (c, W, H) => { c.fillStyle = '#3e5a6e'; c.fillRect(0, 0, W, H); ['#d6b46a', '#8c3b2c', '#e8dcc0'].forEach((col, i) => { c.fillStyle = col; for (let y = i * 28; y < H; y += 84) c.fillRect(0, y, W, 14); }); })} /></mesh>
    <Basket pos={[2.86, 0, -3.66]} s={0.5} fill="#8c3b2c" seed={8} />
    <group position={[2.62, 0.012, -3.86]} rotation={[0, 0.7, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow><circleGeometry args={[0.09, 14]} /><meshLambertMaterial color="#8a6a32" /></mesh>
      <B p={[0.14, 0.006, 0]} s={[0.12, 0.012, 0.03]} c="#6a4e22" />
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.075, 0.09, 14]} /><meshLambertMaterial color="#b08a3e" /></mesh>
    </group>
  </group>
);
/** a forked stick driven into the floor in front of a wall, a peg for clothes; cloak = the father's brown cloak with its fur
 *  collar hangs on it (flat picture) */
const paintCloak = (c: Ctx, W: number, H: number) => {
  P(c, [[W * 0.42, H * 0.04], [W * 0.58, H * 0.04], [W * 0.86, H * 0.3], [W * 0.95, H * 0.98], [W * 0.05, H * 0.98], [W * 0.14, H * 0.3]], '#6a4a32');
  P(c, [[W * 0.5, H * 0.1], [W * 0.62, H * 0.4], [W * 0.56, H * 0.98], [W * 0.44, H * 0.98], [W * 0.4, H * 0.4]], '#563a26');
  c.strokeStyle = 'rgba(40,26,16,0.6)'; c.lineWidth = 3; [0.25, 0.7, 0.82].forEach((x) => { c.beginPath(); c.moveTo(W * x, H * 0.32); c.quadraticCurveTo(W * (x + 0.02), H * 0.6, W * (x - 0.03), H * 0.97); c.stroke(); });
  P(c, [[W * 0.18, H * 0.1], [W * 0.82, H * 0.1], [W * 0.9, H * 0.26], [W * 0.5, H * 0.34], [W * 0.1, H * 0.26]], '#cfc0a0');
  c.fillStyle = 'rgba(255,250,235,0.35)'; for (let i = 0; i < 30; i++) { c.fillRect(W * (0.15 + i * 0.023), H * (0.13 + (i % 3) * 0.03), 3, 10); }
  c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(W * 0.5, H * 0.3, W * 0.03, 0, 7); c.fill();
};
export const CloakPeg: React.FC<{pos: V3; cloak?: boolean; scarf?: boolean}> = ({pos, cloak = true, scarf = false}) => (
  <group position={pos}>
    <Pole a={[0, 0, 0]} b={[0, 1.62, 0]} rr={0.035} />
    <Pole a={[0, 1.5, 0]} b={[-0.14, 1.72, 0.02]} rr={0.02} cast={false} /><Pole a={[0, 1.5, 0]} b={[0.14, 1.72, 0.02]} rr={0.02} cast={false} />
    {cloak ? <mesh position={[0, 1.6 - 0.62, 0.05]} castShadow receiveShadow><planeGeometry args={[0.66, 1.24]} /><meshLambertMaterial map={tex('leu-cloak', 330, 620, paintCloak)} transparent alphaTest={0.4} side={THREE.DoubleSide} /></mesh> : null}
    {scarf ? <CynthiaScarf pos={[0.15, 1.7, 0.07]} on="hook" /> : null}
    <ContactShade r={0.15} />
  </group>
);

// ---------------------------------------------------------------- the workshop (xuong)
/** a toothed gear (flat disc with teeth and a hub), axis along z; r = radius */
export const Gear: React.FC<{pos: V3; r?: number; teeth?: number; spin?: number; color?: string; rot?: V3}> = ({pos, r = 0.06, teeth = 12, spin = 0, color = '#b08a3e', rot = [0, 0, 0]}) => (
  <group position={pos} rotation={rot}><group rotation={[0, 0, spin]}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[r, r, r * 0.25, 18]} /><meshLambertMaterial color={color} /></mesh>
    {Array.from({length: teeth}, (_, i) => { const a = (i / teeth) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * r * 1.08, Math.sin(a) * r * 1.08, 0]} rotation={[0, 0, a]}><boxGeometry args={[r * 0.22, r * 0.24, r * 0.25]} /><meshLambertMaterial color={color} /></mesh>; })}
    <mesh position={[0, 0, r * 0.13]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[r * 0.3, r * 0.3, 0.004, 10]} /><meshLambertMaterial color="#5a4a2a" /></mesh>
  </group></group>
);
/** a coil of copper wire hung on a nail (torus of several turns) */
export const CopperCoil: React.FC<{pos: V3; r?: number}> = ({pos, r = 0.12}) => (
  <group position={pos}>{[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[i * 0.004, -i * 0.006, i * 0.006]} rotation={[0, 0, i * 0.2]} castShadow><torusGeometry args={[r, 0.007, 5, 22]} /><meshPhongMaterial color={i % 2 ? '#c8783a' : '#b0652e'} shininess={60} specular="#ffd0a0" /></mesh>)}
    <mesh position={[0, r, 0]}><cylinderGeometry args={[0.006, 0.006, 0.05, 5]} /><meshLambertMaterial color="#3a3634" /></mesh></group>
);
/** THE WORKBENCH (xuong): the healer's table stood back up against the back wall, scarred, with tools: a hammer, pliers, a
 *  file, a coil of wire, loose gears, screws, a little vice at the left end. pos = foot centre. */
export const WorkBench: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => {
  const {w, d, h} = BAN_THUOC, top = tex('leu-table-top', 1024, 440, paintPlanks(23, {base: '#8a6644', n: 3, knots: 0.7, age: 0.7, nails: true})), legT = tex('leu-table-leg', 64, 512, paintPlanks(24, {base: '#6e5034', n: 1, vertical: true, age: 0.6}));
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, h - 0.03, 0]} castShadow receiveShadow><boxGeometry args={[w, 0.06, d]} /><meshLambertMaterial map={top} /></mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => <mesh key={i} position={[sx * (w / 2 - 0.1), (h - 0.06) / 2, sz * (d / 2 - 0.07)]} castShadow receiveShadow><boxGeometry args={[0.07, h - 0.06, 0.07]} /><meshLambertMaterial map={legT} /></mesh>)}
      {[-1, 1].map((sz) => <B key={sz} p={[0, 0.18, sz * (d / 2 - 0.07)]} s={[w - 0.2, 0.05, 0.04]} c="#5e4430" />)}
      <ContactShade r={w * 0.65} />
      {/* vice */}
      <B p={[-w / 2 + 0.1, h + 0.05, 0.18]} s={[0.12, 0.1, 0.1]} c="#3a3e44" /><B p={[-w / 2 + 0.1, h + 0.06, 0.25]} s={[0.12, 0.08, 0.02]} c="#4a4e54" />
      {/* hammer, file, pliers */}
      <B p={[-0.3, h + 0.012, 0.12]} s={[0.26, 0.024, 0.03]} r={[0, 0.3, 0]} c="#9a7650" /><B p={[-0.42, h + 0.025, 0.08]} s={[0.04, 0.05, 0.1]} r={[0, 0.3, 0]} c="#4a4e54" />
      <B p={[0.05, h + 0.008, 0.18]} s={[0.24, 0.012, 0.02]} r={[0, -0.2, 0]} c="#6a6e74" />
      <B p={[0.25, h + 0.01, 0.1]} s={[0.18, 0.016, 0.025]} r={[0, 0.5, 0]} c="#5a5e64" /><B p={[0.27, h + 0.01, 0.14]} s={[0.18, 0.016, 0.025]} r={[0, 0.2, 0]} c="#5a5e64" />
      <CopperCoil pos={[0.5, h + 0.02, -0.1]} r={0.09} />
      {[[-0.05, -0.12, 0.05], [0.12, -0.05, 0.035], [0.35, 0.2, 0.045]].map(([x, z, r], i) => <Gear key={i} pos={[x, h + 0.01, z]} r={r} rot={[-Math.PI / 2, 0, 0]} spin={i} />)}
      {Array.from({length: 7}, (_, i) => <mesh key={i} position={[-0.15 + i * 0.03, h + 0.006, 0.22 - (i % 2) * 0.02]} rotation={[0, i, Math.PI / 2]}><cylinderGeometry args={[0.005, 0.005, 0.03, 5]} /><meshLambertMaterial color="#8a8680" /></mesh>)}
    </group>
  );
};
/** a string of gears threaded on a cord, hung from a nail (top = the nail) */
export const GearString: React.FC<{top: V3; n?: number}> = ({top, n = 5}) => (
  <group>
    <Rope a={top} b={[top[0], top[1] - 0.12 * n, top[2]]} t={0.008} c="#8a7a5a" />
    {Array.from({length: n}, (_, i) => <Gear key={i} pos={[top[0], top[1] - 0.1 - i * 0.12, top[2] + 0.01]} r={0.035 + (i % 3) * 0.012} spin={i * 0.7} color={i % 2 ? '#b08a3e' : '#8a8680'} />)}
  </group>
);

/** THE GEAR TOY (d1c5 shot 6): a small brass box 0.25 m with a lid of glass, three gears showing on its face (they turn with
 *  `spin`), a little wind vane on top, a crank handle at the side, rivets. pos = the middle of its foot. */
export const GearToy: React.FC<{pos: V3; spin?: number; rotY?: number}> = ({pos, spin = 0, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <B p={[0, 0.09, 0]} s={[0.25, 0.18, 0.16]} c="#b08a3e" />
    <B p={[0, 0.185, 0]} s={[0.27, 0.014, 0.18]} c="#8a6a2a" />
    {[[-0.07, 0.1, 0.034, 10, 1], [0.03, 0.12, 0.026, 8, -1.3], [0.08, 0.06, 0.02, 7, 1.7]].map(([x, y, r, t, k], i) => <Gear key={i} pos={[x, y, 0.083]} r={r} teeth={t} spin={spin * k} color={i === 1 ? '#8a8680' : '#d0a850'} />)}
    {[[-0.115, 0.02], [0.115, 0.02], [-0.115, 0.165], [0.115, 0.165]].map(([x, y], i) => <mesh key={i} position={[x, y, 0.082]}><boxGeometry args={[0.012, 0.012, 0.004]} /><meshLambertMaterial color="#6a5020" /></mesh>)}
    <mesh position={[0, 0.235, 0]}><cylinderGeometry args={[0.005, 0.005, 0.09, 5]} /><meshLambertMaterial color="#5a4a2a" /></mesh>
    <group position={[0, 0.28, 0]} rotation={[0, 0, spin * 2]}>{[0, 1, 2, 3].map((k) => <mesh key={k} rotation={[0, 0, (k * Math.PI) / 2]} position={[Math.cos((k * Math.PI) / 2) * 0.03, Math.sin((k * Math.PI) / 2) * 0.03, 0.006]}><boxGeometry args={[0.05, 0.018, 0.003]} /><meshLambertMaterial color="#e8dcc0" /></mesh>)}</group>
    <group position={[0.135, 0.1, 0]} rotation={[spin, 0, 0]}><B p={[0.008, 0, 0]} s={[0.012, 0.012, 0.012]} c="#5a4a2a" /><B p={[0.014, -0.03, 0]} s={[0.008, 0.06, 0.01]} c="#5a4a2a" /><mesh position={[0.024, -0.06, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.01, 0.01, 0.03, 8]} /><meshLambertMaterial color="#7a5a3a" /></mesh></group>
  </group>
);
/** THE COPPER-COIL MACHINE (d1c5 shot 7): 0.55 m high: a wooden base with brass edging and a lever switch, two upright coils
 *  of copper wire on iron cores with brass caps, a big gear between them (turns with `spin`), a mast with a round glass bulb
 *  on top. on 0..1 = the bulb lit (white-warm core, a halo with points, a warm light) and the coils glowing a little; arc =
 *  a thin spark between the coil tops (0..1). lever 0..1 = the switch thrown. pos = middle of its foot. */
export const CoilMachine: React.FC<{pos: V3; on?: number; spin?: number; arc?: number; lever?: number; f?: number; rotY?: number}> = ({pos, on = 0, spin = 0, arc = 0, lever = 0, f = 0, rotY = 0}) => {
  const coil = (x: number) => <group position={[x, 0.06, 0]}>
    <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.022, 0.022, 0.3, 8]} /><meshLambertMaterial color="#3a3e44" /></mesh>
    {Array.from({length: 11}, (_, i) => <mesh key={i} position={[0, 0.04 + i * 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.04, 0.009, 5, 14]} /><meshPhongMaterial color={i % 2 ? '#c8783a' : '#b0652e'} shininess={70} specular="#ffd0a0" emissive="#ff7a30" emissiveIntensity={0.25 * on} /></mesh>)}
    <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.03, 0.03, 0.02, 10]} /><meshLambertMaterial color="#c9a24a" /></mesh>
  </group>;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <B p={[0, 0.03, 0]} s={[0.42, 0.06, 0.2]} c="#7a5434" /><B p={[0, 0.062, 0.101]} s={[0.42, 0.008, 0.004]} c="#c9a24a" />
      {coil(-0.13)}{coil(0.13)}
      <Gear pos={[0, 0.2, 0.03]} r={0.075} teeth={16} spin={spin} color="#c9a24a" />
      <mesh position={[0, 0.35, -0.02]}><cylinderGeometry args={[0.008, 0.01, 0.3, 6]} /><meshLambertMaterial color="#3a3e44" /></mesh>
      <mesh position={[0, 0.48, -0.02]}><cylinderGeometry args={[0.02, 0.024, 0.03, 10]} /><meshLambertMaterial color="#c9a24a" /></mesh>
      <mesh position={[0, 0.525, -0.02]}><sphereGeometry args={[0.04, 14, 12]} /><meshPhongMaterial color={on > 0 ? '#fff6dc' : '#dfe6e6'} transparent opacity={on > 0 ? 0.95 : 0.45} shininess={100} emissive="#ffe8b0" emissiveIntensity={on * 1.4} /></mesh>
      {on > 0 ? <><Halo pos={[0, 0.525, 0.03]} r={0.12 + 0.18 * on} color="#fff0c4" strength={0.7 * on} /><Halo pos={[0, 0.525, 0.04]} r={0.05} color="#ffffff" strength={0.9 * on} />
        <pointLight position={[0, 0.53, 0.12]} color="#ffe6b0" intensity={1.3 * on} distance={3} decay={1.7} /></> : null}
      {arc > 0 ? <mesh position={[0, 0.375 + 0.01 * Math.sin(f * 3), 0.02]} rotation={[0, 0, 0.08 * Math.sin(f * 5)]}><planeGeometry args={[0.2, 0.012]} /><meshBasicMaterial color="#cfeeff" transparent opacity={0.4 + 0.5 * arc * (0.5 + 0.5 * Math.sin(f * 7))} toneMapped={false} /></mesh> : null}
      <group position={[0.17, 0.065, 0.06]} rotation={[0, 0, -0.5 + lever * 1.0]}><B p={[0, 0.04, 0]} s={[0.01, 0.08, 0.01]} c="#3a3e44" /><mesh position={[0, 0.085, 0]}><cylinderGeometry args={[0.012, 0.012, 0.02, 8]} /><meshLambertMaterial color="#2a2020" /></mesh></group>
      <ContactShade r={0.3} />
    </group>
  );
};
