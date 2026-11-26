import {rnd, P, Ctx, paintPeak} from './depth';
import {blobPts, bandPts} from './kitVuTru';

/** lib3/kitTrenMay (23/11/2026): painters for the sky above the clouds, in cut paper (used by `TrenMay`, chapter 12 scenes 2, 5, 12, 13, 28, 33).
 *  Everything is a flat shape of two or three tones with sharp edges. Plates paint in screen units 1600 x 900 (horizon at y 560); strips and walls paint on their own canvas. */
export type MayPal = {
  bands: string[];                  // the sky from the top to the horizon (flat bands, jagged seams)
  sun?: {x: number; y: number; r: number; cols: [string, string, string]};
  star: number;                     // how many small stars
  cloud: {light: string; mid: string; dark: string}[];   // sea of clouds, far -> near
  strip: {light: string; mid: string; dark: string};     // loose clouds in the air
  peak: {light: string; dark: string; snow: string; snowShade: string};
  wisp: string;                     // the dark tufts at the bottom edge
  haze: string;
};
export const MAY_PAL: Record<'chang-vang' | 'ngay', MayPal> = {
  'chang-vang': {
    bands: ['#3b3a86', '#4c4294', '#66499e', '#8a54a6', '#b05f9e', '#d46f90', '#ec8a82', '#f6ab78', '#fbcb86'],
    sun: {x: 330, y: 520, r: 74, cols: ['#f9b872', '#ffd08a', '#fff0bc']}, star: 60,
    cloud: [{light: '#f4b6a0', mid: '#d489a0', dark: '#9a64a8'}, {light: '#f6c0a8', mid: '#d896a8', dark: '#a06cb0'}, {light: '#fbd2b8', mid: '#e0a2b4', dark: '#a874b8'}],
    strip: {light: '#f8c8b0', mid: '#e09ab0', dark: '#a86ab0'},
    peak: {light: '#d8b4d8', dark: '#8a68b4', snow: '#fff0e8', snowShade: '#f0c8d8'}, wisp: '#6a4a9a', haze: '#f2a98a',
  },
  ngay: {
    bands: ['#2b5aa8', '#3368b4', '#3f78c0', '#5188cc', '#6a9ad6', '#86b0de', '#a4c6e8', '#c2dcf2', '#dcecf8'],
    sun: {x: 220, y: 90, r: 52, cols: ['#e6f2ff', '#f4faff', '#ffffff']}, star: 0,
    cloud: [{light: '#ffffff', mid: '#dbe6f2', dark: '#a0aec4'}, {light: '#ffffff', mid: '#d2dfee', dark: '#98a6be'}, {light: '#ffffff', mid: '#cbd9ea', dark: '#8e9cb6'}],
    strip: {light: '#ffffff', mid: '#dfe8f4', dark: '#9aa8c0'},
    peak: {light: '#c8d8ee', dark: '#8aa0c4', snow: '#ffffff', snowShade: '#dbe6f4'}, wisp: '#7f93b8', haze: '#cfe2f4',
  },
};
const rows = (c: Ctx, x0: number, x1: number, y0: number, y1: number, cols: string[], r: () => number, jag = 40) => {
  const h = (y1 - y0) / cols.length;
  cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(x0, y0 + h * i, x1 - x0, h + 2); });
  cols.forEach((col, i) => { if (!i) return; const y = y0 + h * i, pts: number[][] = [[x0, y]]; for (let x = x0; x <= x1; x += 80) pts.push([x, y + (r() - 0.5) * jag]); pts.push([x1, y + 4], [x1, y1], [x0, y1]); P(c, pts, col); });
};
/** the sky: banded from the top to the horizon (y 560), a flat sun with rings and long cut rays, small stars high up */
export const paintMaySky = (pal: MayPal, seed = 3) => (c: Ctx) => {
  const r = rnd(seed); rows(c, -520, 2120, -300, 720, pal.bands, r, 46);
  for (let k = 0; k < pal.star; k++) { const y = -250 + r() * 620; c.globalAlpha = 0.4 + r() * 0.5; c.fillStyle = '#fff4e0'; c.fillRect(-300 + r() * 2200, y, 2.4, 2.4); } c.globalAlpha = 1;
  if (pal.sun) { const s = pal.sun;
    for (let k = 0; k < 7; k++) { const a = -Math.PI + (k / 6) * Math.PI * 0.98 + 0.05, w = 0.05 + r() * 0.04; P(c, [[s.x, s.y], [s.x + Math.cos(a - w) * 900, s.y + Math.sin(a - w) * 900], [s.x + Math.cos(a + w) * 900, s.y + Math.sin(a + w) * 900]], pal === MAY_PAL.ngay ? 'rgba(255,255,255,0.10)' : 'rgba(255,190,120,0.13)'); }
    [[s.r * 2.5, s.cols[0], 0.5], [s.r * 1.6, s.cols[1], 0.8], [s.r, s.cols[2], 1]].forEach(([q, col, al]) => { c.globalAlpha = al as number; c.fillStyle = col as string; c.beginPath(); c.arc(s.x, s.y, q as number, 0, 7); c.fill(); }); c.globalAlpha = 1; }
};
/** long thin streaks of high cloud (flat lens shapes, a light face and a darker underside), laid across the upper sky */
export const paintMayStreaks = (t: {light: string; mid: string; dark: string}, seed = 12) => (c: Ctx) => {
  const r = rnd(seed);
  for (let i = 0; i < 11; i++) { const x = -250 + r() * 1800, y = 40 + r() * 470, L = 260 + r() * 520, th = 10 + r() * 20 + (y / 470) * 8;
    P(c, [[x, y], [x + L * 0.3, y - th], [x + L * 0.75, y - th * 0.5], [x + L, y], [x + L * 0.7, y + th * 0.9], [x + L * 0.25, y + th * 0.7]], t.mid); P(c, [[x + L * 0.04, y - 1], [x + L * 0.3, y - th], [x + L * 0.75, y - th * 0.5], [x + L * 0.96, y - 1], [x + L * 0.5, y - th * 0.15]], t.light); P(c, [[x + L * 0.25, y + th * 0.7], [x + L * 0.7, y + th * 0.9], [x + L * 0.96, y + 2], [x + L * 0.5, y + th * 0.35]], t.dark); }
};
/** three snow peaks poking up from the horizon (the cloud sea hides their feet) */
export const paintMayPeaks = (pal: MayPal) => (c: Ctx) => {
  paintPeak(c, 1290, 330, 250, 640, pal.peak); paintPeak(c, 1010, 470, 150, 640, pal.peak); paintPeak(c, 120, 430, 190, 640, pal.peak); paintPeak(c, 1560, 450, 170, 640, pal.peak);
};
const puff = (c: Ctx, cx: number, cy: number, rr: number, t: {light: string; mid: string; dark: string}, r: () => number) => {
  P(c, blobPts(cx + rr * 0.04, cy + rr * 0.06, rr * 1.08, rr * 0.88, 9, 0.16, r, r() * 6), t.dark);
  P(c, blobPts(cx - rr * 0.05, cy - rr * 0.1, rr, rr * 0.8, 9, 0.16, r, r() * 6), t.mid);
  P(c, blobPts(cx - rr * 0.24, cy - rr * 0.3, rr * 0.6, rr * 0.42, 8, 0.2, r, r() * 6), t.light);
};
/** a bank of cumulus along a base line: big puffs behind, smaller in front, a lobed top edge; the body below the base is filled to `fillTo`. Peaks of `top` px rise above the base. */
export const paintCloudBank = (t: {light: string; mid: string; dark: string}, seed: number, base: number, top: number, size: number, fillTo = 1250, x0 = -400, x1 = 2000, tallAt?: number[]) => (c: Ctx) => {
  const r = rnd(seed); c.fillStyle = t.mid; c.fillRect(x0, base, x1 - x0, fillTo - base);
  const ps: [number, number, number][] = [];
  for (let x = x0; x < x1; x += size * 0.7) { const tall = tallAt?.some((q) => Math.abs(x - q) < size * 1.6) ? 1.7 : 1, rr = size * (0.7 + r() * 0.7); ps.push([x + r() * size * 0.4, base - r() * top * tall * 0.7, rr]); }
  ps.sort((a, b) => a[1] - b[1]).forEach(([x, y, rr]) => puff(c, x, y, rr, t, r));
  // the band under the puffs: a darker underside with a jagged lit edge
  P(c, [[x0, base + size * 0.35], ...Array.from({length: Math.ceil((x1 - x0) / 120)}, (_, i) => [x0 + i * 120, base + size * (0.3 + r() * 0.2)]), [x1, base + size * 0.4], [x1, fillTo], [x0, fillTo]], t.mid);
  P(c, [[x0, base + size * 0.62], [x1, base + size * 0.62], [x1, fillTo], [x0, fillTo]], t.dark);
};
/** dark tufts of cloud along the bottom edge (the foreground) */
export const paintMayWisp = (col: string, seed = 8) => (c: Ctx) => { const r = rnd(seed); for (let x = -300; x < 1900; x += 150 + r() * 120) P(c, blobPts(x, 920 + r() * 40, 120 + r() * 90, 55 + r() * 30, 8, 0.2, r), col); };
/** loose clouds in the air on a tall canvas that tiles vertically (W x H canvas px): n clusters, each three puffs, wrapped top to bottom */
export const paintMayStrip = (t: {light: string; mid: string; dark: string}, seed: number, n = 7) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), u = W / 1600;
  for (let i = 0; i < n; i++) { const cx = (i % 2 ? 0.06 + 0.24 * r() : 0.68 + 0.26 * r()) * W, cy = ((i + 0.2 + r() * 0.6) / n) * H, rr = (34 + r() * 40) * u;
    [-1, 0, 1].forEach((k) => { const y = cy + k * H; if (y < -rr * 2 || y > H + rr * 2) return;
      puff(c, cx, y, rr, t, r); puff(c, cx - rr * 0.9, y + rr * 0.2, rr * 0.7, t, r); puff(c, cx + rr * 1.0, y + rr * 0.25, rr * 0.75, t, r);
      P(c, [[cx - rr * 1.6, y + rr * 0.55], [cx + rr * 1.7, y + rr * 0.6], [cx + rr * 1.5, y + rr * 0.78], [cx - rr * 1.5, y + rr * 0.75]], t.dark); }); }
};
/** one tall cloud tower (the wall of scene 12), painted on a canvas W x H, and the jagged line (x as a function of y) it splits along */
export const wallCrack = (H: number, W: number, seed = 5) => { const r = rnd(seed), pts: number[] = []; for (let i = 0; i <= 12; i++) pts.push(W * (0.5 + (r() - 0.5) * 0.12)); return (y: number) => { const t = Math.max(0, Math.min(12, (y / H) * 12)), i = Math.floor(t); return pts[i] + (pts[Math.min(12, i + 1)] - pts[i]) * (t - i); }; };
export const paintMayWall = (t: {light: string; mid: string; dark: string}, seed = 6) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed); P(c, [[W * 0.2, H], [W * 0.22, H * 0.3], [W * 0.3, H * 0.05], [W * 0.5, 0], [W * 0.7, H * 0.06], [W * 0.78, H * 0.32], [W * 0.8, H]], t.mid);
  const puffs: [number, number, number][] = []; for (let k = 0; k < 34; k++) puffs.push([W * (0.2 + r() * 0.6), H * (0.02 + (k / 34) * 0.98), W * (0.1 + r() * 0.1)]);
  puffs.forEach(([cx, cy, rr]) => { const shade = cx > W * 0.55 ? t.dark : t.mid; P(c, blobPts(cx + rr * 0.05, cy + rr * 0.06, rr * 1.05, rr * 0.8, 9, 0.18, r), shade); P(c, blobPts(cx, cy, rr, rr * 0.76, 9, 0.18, r), cx > W * 0.55 ? t.mid : t.mid); if (cx <= W * 0.55) P(c, blobPts(cx - rr * 0.22, cy - rr * 0.26, rr * 0.6, rr * 0.42, 8, 0.2, r), t.light); else P(c, blobPts(cx - rr * 0.2, cy - rr * 0.24, rr * 0.55, rr * 0.38, 8, 0.2, r), t.mid); });
};
/** a far sky-castle on a cloud: dark violet towers, a lit window or two (the "warm light far below" of scene 13) */
export const paintMayCastle = (c: Ctx, W: number, H: number, lamp = '#ffd27a') => {
  const b = H * 0.78, u = W / 400, Q = (pts: number[][], f: string) => P(c, pts.map(([x, y]) => [x * u, b - y * u]), f);
  [[40, 90, 34], [90, 140, 40], [150, 70, 60], [220, 170, 44], [290, 100, 36], [335, 130, 30]].forEach(([x, h, w], i) => { Q([[x, 30], [x, 30 + h], [x + w, 30 + h], [x + w, 30]], i % 2 ? '#5a3f8c' : '#6a4a9a'); Q([[x - 4, 30 + h], [x + w / 2, 30 + h + w * 1.1], [x + w + 4, 30 + h]], '#3f2a70'); Q([[x + w * 0.5, 30 + h + w * 1.1], [x + w * 0.5, 30 + h + w * 1.5], [x + w * 0.5 + 8, 30 + h + w * 1.35]], '#e2556a'); });
  [[104, 100], [236, 110], [160, 60], [300, 84]].forEach(([x, y]) => Q([[x, y], [x + 8, y], [x + 8, y + 14], [x, y + 14]], lamp));
};
export const bandsForWind = (seed: number, n: number) => (c: Ctx, W: number, H: number) => { const r = rnd(seed); for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H, L = H * (0.12 + r() * 0.3); P(c, [[x, y], [x + 1.6, y + L * 0.5], [x, y + L], [x - 1.6, y + L * 0.5]], 'rgba(255,255,255,0.8)'); } };
export {bandPts};

// ---------------------------------------------------------------- big cloud masses (cumulus towers) in four flat tones
const mixc = (a: string, b: string, t: number) => { const h = (x: string) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16)), A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
/** One cumulus mass: a flat foot, a body of round lobes (discs of several sizes, biggest at the middle, the top rolled), four tones: shade, body, lit face toward the sun (upper left), bright rim; a darker band under the foot.
 *  haze 0..1 pales it toward `fogCol` (far layers). */
export const cloudMass = (c: Ctx, cx: number, base: number, w: number, h: number, t: {light: string; mid: string; dark: string}, r: () => number, haze = 0, fogCol = '#ffffff') => {
  const k = (col: string) => (haze > 0 ? mixc(col, fogCol, haze) : col), dark = k(t.dark), mid = k(t.mid), light = k(t.light), rim = k(mixc(t.light, '#ffffff', 0.5)), disc = (x: number, y: number, rad: number, f: string) => { c.beginPath(); c.arc(x, y, rad, 0, 7); c.fillStyle = f; c.fill(); };
  const n = Math.max(5, Math.round(w / (h * 0.36))), lobes: [number, number, number][] = [];
  for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, bell = Math.sin(Math.PI * u), rad = h * (0.2 + 0.3 * bell) * (0.8 + r() * 0.4); lobes.push([cx - w / 2 + u * w + (r() - 0.5) * h * 0.12, base - rad * (0.55 + 0.9 * bell * (0.6 + r() * 0.6)), rad]); }
  for (let i = 0; i < 4; i++) { const u = 0.25 + 0.5 * r(), rad = h * (0.22 + 0.16 * r()); lobes.push([cx - w / 2 + u * w, base - h * (0.5 + 0.35 * r()), rad]); }
  c.fillStyle = dark; c.fillRect(cx - w * 0.52, base - h * 0.2, w * 1.04, h * 0.2);
  lobes.forEach(([x, y, rad]) => disc(x + rad * 0.05, y + rad * 0.05, rad, dark));
  lobes.forEach(([x, y, rad]) => disc(x - rad * 0.05, y - rad * 0.08, rad * 0.93, mid));
  c.fillStyle = mid; c.fillRect(cx - w * 0.5, base - h * 0.3, w, h * 0.16);
  lobes.forEach(([x, y, rad]) => { if (y < base - h * 0.15) { disc(x - rad * 0.1, y - rad * 0.14, rad * 0.8, light); disc(x + rad * 0.12, y + rad * 0.16, rad * 0.74, mid); } });
  lobes.filter((_, i) => i % 3 === 0).forEach(([x, y, rad]) => { if (y < base - h * 0.3) { disc(x - rad * 0.3, y - rad * 0.36, rad * 0.3, rim); disc(x - rad * 0.2, y - rad * 0.25, rad * 0.28, light); } });
  P(c, [[cx - w * 0.5, base - h * 0.06], [cx + w * 0.5, base - h * 0.06], [cx + w * 0.46, base + h * 0.06], [cx - w * 0.46, base + h * 0.06]], dark);
};
/** a layer of masses along a horizon: `n` masses of widths `w0..w1` and heights `h0..h1` at a base line y, spaced with gaps of open sky; fogged by `haze` */
export const paintMassLayer = (t: {light: string; mid: string; dark: string}, seed: number, base: number, n: number, w0: number, w1: number, h0: number, h1: number, haze: number, fogCol: string, fillTo = 0) => (c: Ctx) => {
  const r = rnd(seed); if (fillTo) { c.fillStyle = mixc(t.dark, fogCol, haze); c.fillRect(-400, base, 2400, fillTo - base); }
  const xs = Array.from({length: n}, (_, i) => -300 + ((i + 0.3 + r() * 0.4) / n) * 2200);
  xs.map((x) => [x, r()] as const).sort((a, b) => a[1] - b[1]).forEach(([x]) => cloudMass(c, x, base + (r() - 0.5) * 24, w0 + r() * (w1 - w0), h0 + r() * (h1 - h0), t, r, haze, fogCol));
};
