import React, {useMemo, useRef, useLayoutEffect} from 'react';
import * as THREE from 'three';
import {FacetLathe, Halo} from './look';
import {rnd, Ctx} from './depth';
import {B, Flame} from './kit';
import {tex} from './kitLab';
import {Embers} from './fx';
import {paintMask, MASK_BOX} from '../mould/draw';

/** lib3/kitForge: the FORGE OF A MOUNTAIN MONASTERY at night (first used by src/demo/Forge.tsx, passage d1mo, Doctor Doom).
 *  Everything is in metres, y up; pieces that hang on a wall lie in their own x-y plane facing +z.
 *  Large surfaces (walls, floor, the hearth, the hood) carry detail at three sizes: the big masses (blocks, steps, beams),
 *  the middle pieces (quoins, voussoirs, sills, rims, straps) and the small grain of the material (every stone its own tone,
 *  a lit top edge and a dark lower edge, pitting, chips, cracks, soot, damp). */
type V3 = [number, number, number];
const clamp = (x: number) => Math.min(1, Math.max(0, x));

// ---------------------------------------------------------------- stone, painted
/** Options of a stone surface. course = [min, max] height of a course (m); len = [min, max] length of a stone (m);
 *  tones = the stone colours; soot = dark clouds (x, y in metres from the left foot, r radius, k strength);
 *  arches = window arches cut in the wall: voussoirs round the arch, long and short quoins down the jambs, a sill stone;
 *  damp = height of the damp band at the foot (m); streaks = how many soot or water streaks run down from the top. */
export type StoneLook = {seed: number; course?: [number, number]; len?: [number, number]; tones?: string[]; mortar?: string; soot?: {x: number; y: number; r: number; k?: number}[];
  arches?: {x0: number; x1: number; sill: number; spring: number}[]; damp?: number; streaks?: number; flat?: boolean};
const STONE_TONES = ['#8b8174', '#7f766b', '#968b7c', '#74695f', '#8e7b68', '#a09584', '#6c645c', '#857a6a'];
const shade = (hex: string, k: number) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
/** the same stones painted lighter (night rooms that must still read: Y 85-100, 23/11/2026) */
export const STONE_TONES_LIGHT = STONE_TONES.map((t) => '#' + new THREE.Color(shade(t, 1.28)).lerp(new THREE.Color('#9aa3ba'), 0.4).getHexString());   // lighter and cooler: blue-grey stone at night, the fire stays the only warm thing

/** One stone: an irregular polygon inside its cell, its own tone, a light top-left edge and a dark lower-right edge (so the
 *  joints read as relief under any light), pitting, a chip, sometimes a crack. Units: pixels; ppm = pixels per metre. */
const stone = (c: Ctx, r: () => number, x: number, y: number, w: number, h: number, ppm: number, col: string) => {
  const g = (0.012 + r() * 0.012) * ppm, j = 0.02 * ppm, J = () => (r() - 0.5) * j;
  const pts = [[x + g + J(), y + g + J()], [x + w * 0.5 + J(), y + g + J() * 0.6], [x + w - g + J(), y + g + J()], [x + w - g + J() * 0.6, y + h * 0.5 + J()], [x + w - g + J(), y + h - g + J()], [x + w * 0.5 + J(), y + h - g + J() * 0.6], [x + g + J(), y + h - g + J()], [x + g + J() * 0.6, y + h * 0.5 + J()]];
  const path = () => { c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.closePath(); };
  path(); c.fillStyle = col; c.fill();
  c.save(); path(); c.clip();
  // a soft fall of light across the face (top-left lit)
  const fl = c.createLinearGradient(x, y, x + w * 0.6, y + h); fl.addColorStop(0, 'rgba(255,248,232,0.16)'); fl.addColorStop(0.55, 'rgba(0,0,0,0)'); fl.addColorStop(1, 'rgba(20,14,10,0.22)'); c.fillStyle = fl; c.fillRect(x, y, w, h);
  // weathering: two or three soft lighter and darker blotches inside the stone, so no face is one flat colour
  for (let k = 0; k < 3; k++) { const bx = x + r() * w, by = y + r() * h, br = (0.3 + r() * 0.5) * Math.min(w, h), bg = c.createRadialGradient(bx, by, 0, bx, by, br); bg.addColorStop(0, r() < 0.5 ? 'rgba(255,240,215,0.13)' : 'rgba(20,14,10,0.18)'); bg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = bg; c.fillRect(bx - br, by - br, br * 2, br * 2); }
  // grain: speckles, pits, a few lighter flecks
  const n = Math.round((w * h) / (ppm * ppm) * 1500);
  for (let k = 0; k < n; k++) { const a = r(); c.fillStyle = a < 0.55 ? `rgba(30,24,20,${0.18 + r() * 0.25})` : a < 0.85 ? `rgba(255,246,230,${0.1 + r() * 0.16})` : `rgba(90,70,50,${0.2 + r() * 0.2})`; const s = (0.003 + r() * 0.006) * ppm; c.fillRect(x + r() * w, y + r() * h, s, s * (0.6 + r() * 0.8)); }
  for (let k = 0; k < Math.round(n / 60); k++) { const px = x + r() * w, py = y + r() * h, s = (0.008 + r() * 0.014) * ppm; c.fillStyle = 'rgba(25,20,16,0.35)'; c.beginPath(); c.ellipse(px, py, s, s * 0.7, r() * 3, 0, 7); c.fill(); c.fillStyle = 'rgba(255,245,225,0.18)'; c.beginPath(); c.ellipse(px - s * 0.3, py - s * 0.3, s * 0.5, s * 0.3, 0, 0, 7); c.fill(); }
  // a chip off one corner, a crack now and then
  if (r() < 0.45) { const cx = r() < 0.5 ? x + g : x + w - g, cy = r() < 0.5 ? y + g : y + h - g, s = (0.03 + r() * 0.05) * ppm; c.fillStyle = 'rgba(40,32,26,0.45)'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + (cx < x + w / 2 ? s : -s), cy); c.lineTo(cx, cy + (cy < y + h / 2 ? s * 0.8 : -s * 0.8)); c.closePath(); c.fill(); }
  if (r() < 0.16) { c.strokeStyle = 'rgba(28,22,18,0.6)'; c.lineWidth = Math.max(1, 0.004 * ppm); c.beginPath(); let px = x + w * (0.2 + r() * 0.6), py = y + g; c.moveTo(px, py); while (py < y + h - g) { px += (r() - 0.5) * 0.05 * ppm; py += (0.02 + r() * 0.04) * ppm; c.lineTo(px, py); } c.stroke(); }
  c.restore();
  // relief: lit top and left edges, dark bottom and right edges
  const lw = Math.max(1.5, 0.009 * ppm);
  c.lineWidth = lw; c.strokeStyle = 'rgba(255,244,222,0.30)'; c.beginPath(); c.moveTo(pts[6][0], pts[6][1]); c.lineTo(pts[7][0], pts[7][1]); c.lineTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(pts[2][0], pts[2][1]); c.stroke();
  c.strokeStyle = 'rgba(16,12,10,0.45)'; c.beginPath(); c.moveTo(pts[2][0], pts[2][1]); c.lineTo(pts[3][0], pts[3][1]); c.lineTo(pts[4][0], pts[4][1]); c.lineTo(pts[5][0], pts[5][1]); c.lineTo(pts[6][0], pts[6][1]); c.stroke();
};

/** A stone surface Wm x Hm metres painted on a canvas: coursed rubble (rows of stones of uneven length and height, each its
 *  own tone), dark mortar, cut stone round any window arch, soot, damp and streaks. */
export const paintStone = (Wm: number, Hm: number, o: StoneLook) => (c: Ctx, W: number, H: number) => {
  const r = rnd(o.seed), ppm = W / Wm, tones = o.tones ?? STONE_TONES, [c0, c1] = o.course ?? [0.24, 0.42], [l0, l1] = o.len ?? [0.38, 0.95];
  c.fillStyle = o.mortar ?? '#4a4038'; c.fillRect(0, 0, W, H);
  // mortar is not one flat colour either
  for (let k = 0; k < Wm * Hm * 30; k++) { c.fillStyle = r() < 0.5 ? 'rgba(20,16,12,0.15)' : 'rgba(150,135,115,0.12)'; c.fillRect(r() * W, r() * H, 2 + r() * 4, 2 + r() * 4); }
  const tone = () => { const t = tones[Math.floor(r() * tones.length)]; return shade(t, 0.9 + r() * 0.2); };
  const inArch = (x: number, y: number, w: number, h: number) => (o.arches ?? []).some((a) => { const xm = x / ppm, ym = (H - y - h) / ppm, wm = w / ppm, hm = h / ppm, R = (a.x1 - a.x0) / 2 + 0.36; return xm + wm > a.x0 - 0.42 && xm < a.x1 + 0.42 && ym + hm > a.sill - 0.18 && ym < a.spring + R; });
  for (let y = H; y > -c1 * ppm; ) {
    const ch = (c0 + r() * (c1 - c0)) * ppm;
    for (let x = -r() * l1 * ppm; x < W; ) { const cw = (l0 + r() * (l1 - l0)) * ppm; if (!inArch(x, y - ch, cw, ch)) stone(c, r, x, y - ch, cw, ch, ppm, tone()); x += cw; }
    y -= ch;
  }
  // cut stone round each window: voussoirs on the arch, quoins down the jambs, a sill stone
  (o.arches ?? []).forEach((a) => {
    const cx = (a.x0 + a.x1) / 2, R = (a.x1 - a.x0) / 2, ring = 0.34, n = 11, X = (m: number) => m * ppm, Y = (m: number) => H - m * ppm;
    // fill the cut-out zone with mortar first, then the dressed stones
    c.fillStyle = o.mortar ?? '#4a4038'; c.beginPath(); c.rect(X(a.x0 - 0.42), Y(a.spring + R + 0.4), X(a.x1 - a.x0 + 0.84), (a.spring + R + 0.4 - a.sill + 0.2) * ppm); c.fill();
    for (let k = 0; k < n; k++) {
      const t0 = Math.PI - (k / n) * Math.PI, t1 = Math.PI - ((k + 1) / n) * Math.PI, gap = 0.012, keyK = k === (n - 1) / 2 ? 0.06 : 0;
      const p = [[cx + Math.cos(t0 - gap) * R, a.spring + Math.sin(t0 - gap) * R], [cx + Math.cos(t0 - gap) * (R + ring + keyK), a.spring + Math.sin(t0 - gap) * (R + ring + keyK)], [cx + Math.cos(t1 + gap) * (R + ring + keyK), a.spring + Math.sin(t1 + gap) * (R + ring + keyK)], [cx + Math.cos(t1 + gap) * R, a.spring + Math.sin(t1 + gap) * R]];
      const xs = p.map((q) => X(q[0])), ys = p.map((q) => Y(q[1]));
      c.save(); c.beginPath(); xs.forEach((xx, i) => (i ? c.lineTo(xx, ys[i]) : c.moveTo(xx, ys[i]))); c.closePath(); c.clip();
      stone(c, r, Math.min(...xs) - 0.02 * ppm, Math.min(...ys) - 0.02 * ppm, Math.max(...xs) - Math.min(...xs) + 0.04 * ppm, Math.max(...ys) - Math.min(...ys) + 0.04 * ppm, ppm, shade('#9a8f80', 0.92 + r() * 0.14));
      c.restore();
    }
    for (const side of [-1, 1]) {
      let yy = a.sill; let k = 0;
      while (yy < a.spring - 0.05) { const h = Math.min(0.24 + r() * 0.12, a.spring - yy), long = k % 2 === 0, wq = long ? 0.42 : 0.26, x0 = side < 0 ? a.x0 - wq : a.x1;
        stone(c, r, X(x0), Y(yy + h), wq * ppm, h * ppm, ppm, shade('#988d7e', 0.92 + r() * 0.14)); yy += h; k++; }
    }
    stone(c, r, X(a.x0 - 0.2), Y(a.sill), (a.x1 - a.x0 + 0.4) * ppm, 0.2 * ppm, ppm, '#8e8476');
  });
  // soot clouds, streaks, damp at the foot
  (o.soot ?? []).forEach((s) => { const x = s.x * ppm, y = H - s.y * ppm, rr = s.r * ppm, g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, `rgba(14,10,8,${0.78 * (s.k ?? 1)})`); g.addColorStop(0.5, `rgba(20,15,12,${0.42 * (s.k ?? 1)})`); g.addColorStop(1, 'rgba(20,15,12,0)'); c.fillStyle = g; c.fillRect(x - rr, y - rr, rr * 2, rr * 2); });
  for (let k = 0; k < (o.streaks ?? Math.round(Wm * 1.6)); k++) { const x = r() * W, w = (0.04 + r() * 0.12) * ppm, h = (0.4 + r() * 1.4) * ppm, g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(24,18,14,0.28)'); g.addColorStop(1, 'rgba(24,18,14,0)'); c.fillStyle = g; c.fillRect(x, 0, w, h); }
  if ((o.damp ?? 0.6) > 0) { const d = (o.damp ?? 0.6) * ppm, g = c.createLinearGradient(0, H, 0, H - d); g.addColorStop(0, 'rgba(30,34,26,0.42)'); g.addColorStop(1, 'rgba(30,34,26,0)'); c.fillStyle = g; c.fillRect(0, H - d, W, d);
    for (let k = 0; k < Wm * 3; k++) { const x = r() * W, y = H - r() * d, q = (0.08 + r() * 0.2) * ppm, gg = c.createRadialGradient(x, y, 0, x, y, q); gg.addColorStop(0, 'rgba(40,46,34,0.22)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - q, y - q, q * 2, q * 2); } }
};
/** A stone texture of a size in metres, kept by key. ppm = pixels per metre (capped so that the canvas stays under 4096). */
export const stoneTex = (key: string, Wm: number, Hm: number, look: StoneLook, ppm = 300) => {
  const k = Math.min(ppm, 4096 / Math.max(Wm, Hm)); return tex(key, Math.max(64, Math.round(Wm * k)), Math.max(64, Math.round(Hm * k)), paintStone(Wm, Hm, look));
};

/** A box of masonry: each face gets its own stone picture at its own size (no stretching), so a hearth or a hood has the same
 *  coursed stone as the walls. p = centre, s = size. */
export const StoneBox: React.FC<{id: string; p: V3; s: V3; look?: Partial<StoneLook>; color?: string; cast?: boolean; ppm?: number}> = ({id, p, s, look = {}, color = '#ffffff', cast = true, ppm = 260}) => {
  const [w, h, d] = s, L = (sd: number): StoneLook => ({seed: sd, course: [0.18, 0.3], len: [0.26, 0.6], damp: 0.2, streaks: 1, ...look, ...(look.seed ? {seed: look.seed + sd} : {})});
  const mats = useMemo(() => {
    const side = stoneTex(`${id}-x`, d, h, L(3), ppm), top = stoneTex(`${id}-y`, w, d, {...L(5), damp: 0, streaks: 0}, ppm), front = stoneTex(`${id}-z`, w, h, L(7), ppm);
    return [side, side, top, top, front, front].map((m) => new THREE.MeshLambertMaterial({color, map: m}));
  }, [id, w, h, d, color]);
  return <mesh position={p} castShadow={cast} receiveShadow material={mats}><boxGeometry args={s} /></mesh>;
};

// ---------------------------------------------------------------- the floor and wood
/** Flagstone floor, Wm x Dm metres (canvas y = distance from the back wall): rows of large slabs of uneven size, worn
 *  smoother on the walking line, coal dust round the hearth, iron scale round the anvil, a damp ring by the quench tub.
 *  dirt = [x, z, r, kind]: 'coal' | 'scale' | 'wet'. */
/** lift = how much lighter the slabs are painted (1 = as first approved; the forge uses about 1.35 since 23/11/2026, "too dark"). */
export const paintFlags = (Wm: number, Dm: number, seed: number, dirt: [number, number, number, 'coal' | 'scale' | 'wet'][] = [], lift = 1) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / Wm, tones = ['#6a6158', '#625a52', '#71675c', '#5b544d', '#6e6152', '#787064'].map((t) => shade(t, lift));
  c.fillStyle = '#2e2924'; c.fillRect(0, 0, W, H);
  for (let y = 0; y < H; ) { const dh = (0.45 + r() * 0.4) * ppm; for (let x = -r() * 0.8 * ppm; x < W; ) { const dw = (0.5 + r() * 0.7) * ppm; stone(c, r, x, y, dw, dh, ppm, shade(tones[Math.floor(r() * tones.length)], 0.9 + r() * 0.18)); x += dw; } y += dh; }
  dirt.forEach(([x, z, rad, kind]) => {
    const X = x * ppm, Y = z * ppm, R = rad * ppm;
    if (kind === 'wet') { const g = c.createRadialGradient(X, Y, R * 0.2, X, Y, R); g.addColorStop(0, 'rgba(18,22,26,0.5)'); g.addColorStop(1, 'rgba(18,22,26,0)'); c.fillStyle = g; c.fillRect(X - R, Y - R, R * 2, R * 2); return; }
    const g = c.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, kind === 'coal' ? 'rgba(12,10,9,0.62)' : 'rgba(30,22,18,0.35)'); g.addColorStop(1, 'rgba(12,10,9,0)'); c.fillStyle = g; c.fillRect(X - R, Y - R, R * 2, R * 2);
    for (let k = 0; k < rad * rad * 900; k++) { const a = r() * 6.28, d = Math.pow(r(), 0.7) * R; c.fillStyle = kind === 'coal' ? (r() < 0.8 ? 'rgba(10,9,8,0.8)' : 'rgba(70,64,60,0.6)') : (r() < 0.6 ? 'rgba(28,24,24,0.8)' : 'rgba(110,70,40,0.6)'); const s = (0.006 + r() * (kind === 'coal' ? 0.018 : 0.01)) * ppm; c.fillRect(X + Math.cos(a) * d, Y + Math.sin(a) * d, s, s * (0.5 + r())); }
  });
};
/** Dark old timber for posts and beams: long grain lines, a few knots, checks (splits) along the grain, worn lighter edges. */
export const paintTimber = (seed: number, base = '#3b2a1d') => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed); c.fillStyle = base; c.fillRect(0, 0, W, H);
  for (let k = 0; k < H / 3; k++) { const y = r() * H; c.strokeStyle = r() < 0.5 ? 'rgba(15,10,6,0.35)' : 'rgba(120,90,60,0.18)'; c.lineWidth = 1 + r() * 2; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= W; x += W / 8) c.lineTo(x, y + Math.sin(x * 0.02 + k) * 2 + (r() - 0.5) * 2); c.stroke(); }
  for (let k = 0; k < 3; k++) { const x = r() * W, y = r() * H; c.fillStyle = 'rgba(15,9,5,0.6)'; c.beginPath(); c.ellipse(x, y, 7 + r() * 8, 3 + r() * 3, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(120,85,55,0.25)'; c.beginPath(); c.ellipse(x, y, 14, 6, 0, 0, 7); c.stroke(); }
  for (let k = 0; k < 4; k++) { const y = r() * H, x = r() * W * 0.6; c.strokeStyle = 'rgba(8,5,3,0.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + W * (0.15 + r() * 0.3), y + (r() - 0.5) * 3); c.stroke(); }
};
const timberTex = (k: number) => tex(`forge-timber-${k}`, 512, 128, paintTimber(k));
/** A box of dark timber (grain along its longest side). */
export const Timber: React.FC<{p: V3; s: V3; r?: V3; seed?: number; cast?: boolean}> = ({p, s, r: rot, seed = 1, cast = true}) => {
  const long = s[0] >= s[1] && s[0] >= s[2] ? 0 : s[1] >= s[2] ? 1 : 2;
  const mat = useMemo(() => { const t = timberTex(seed % 4).clone(); t.needsUpdate = true; if (long === 1) { t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; } return new THREE.MeshLambertMaterial({map: t}); }, [seed, long]);
  return <mesh position={p} rotation={rot} castShadow={cast} receiveShadow material={mat}><boxGeometry args={s} /></mesh>;
};

// ---------------------------------------------------------------- the forge
/** THE FORGE: a stone hearth against the back wall with a firebrick rim, a bed of coals glowing in the middle, a fire whose
 *  tongues lean slowly (f), embers rising; over it an iron-strapped lintel and a stepped stone hood narrowing into a chimney.
 *  pos = the hearth's back centre on the floor (the hearth stands forward of it); w = hearth width; ceiling = where the
 *  chimney ends; fire = 0..1 strength (light, flames, embers). Lights included: the coals' glow and a shadow-casting spot
 *  thrown into the room towards `aim` (world, relative to pos). */
export const FORGE = {w: 1.9, d: 1.4, h: 0.8, lintel: 1.82};
export const ForgeHearth: React.FC<{pos: V3; f?: number; ceiling?: number; fire?: number; aim?: V3; light?: boolean}> = ({pos, f = 0, ceiling = 4.8, fire = 1, aim = [2.6, -1.2, 3.2], light = true}) => {
  const {w, d, h, lintel} = FORGE, coals = useMemo(() => { const r = rnd(41); return Array.from({length: 90}, () => { const a = r() * 6.28, q = Math.sqrt(r()), x = Math.cos(a) * q * 0.62, z = Math.sin(a) * q * 0.42; const hot = q < 0.62 && r() < 0.78; return [x, z, 0.04 + r() * 0.06, r() * 3, hot ? (r() < 0.35 ? '#ffd27a' : r() < 0.6 ? '#ff8a2a' : '#e2501c') : (r() < 0.5 ? '#231e1b' : '#2f2925'), hot] as const; }); }, []);
  const breathe = 1 + 0.06 * Math.sin(f * 0.19) + 0.03 * Math.sin(f * 0.43), k = fire * breathe;
  const hoodH = ceiling - lintel - 0.2;
  return (
    <group position={pos}>
      {/* the hearth block, a firebrick rim round the coal pit, cap stones along the front edge */}
      <StoneBox id="forge-hearth" p={[0, h / 2, d / 2]} s={[w, h, d]} look={{seed: 11}} />
      {[[-0.78, 0.84], [0.78, 0.84]].map(([x], i) => <StoneBox key={i} id={`forge-cheek-${i}`} p={[x, h + 0.09, d / 2 - 0.05]} s={[0.34, 0.18, d - 0.1]} look={{seed: 21 + i, course: [0.09, 0.1], len: [0.14, 0.22]}} />)}
      <StoneBox id="forge-cap" p={[0, h + 0.03, d - 0.12]} s={[w + 0.08, 0.08, 0.26]} look={{seed: 31, course: [0.08, 0.09], len: [0.3, 0.5]}} />
      {Array.from({length: 7}, (_, i) => <B key={i} p={[-0.6 + i * 0.2, h + 0.035, d - 0.27]} s={[0.19, 0.07, 0.1]} c={i % 2 ? '#6a3a2a' : '#7a4430'} />)}
      {/* coal pit: dark bed, lumps, the hot heart */}
      <mesh position={[0, h + 0.012, d / 2 - 0.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[1.3, 0.95]} /><meshLambertMaterial color="#1a1614" /></mesh>
      {coals.map(([x, z, s, ry, col, hot], i) => <mesh key={i} position={[x, h + 0.02 + s * 0.3, d / 2 - 0.05 + z]} rotation={[0.3, ry, 0.2]}><boxGeometry args={[s, s * 0.6, s * 0.8]} />{hot ? <meshBasicMaterial color={new THREE.Color(col).multiplyScalar(0.55 + 0.45 * k)} /> : <meshLambertMaterial color={col} />}</mesh>)}
      {fire > 0 ? <>
        <group position={[0, h - 0.04, d / 2 + 0.05]} scale={[0.85 * fire, 0.7 * fire * breathe, 1]}><Flame f={f} w={1.0} /></group>
        <group position={[0.28, h - 0.04, d / 2 - 0.15]} scale={[0.45 * fire, 0.42 * fire, 1]}><Flame f={f + 37} w={1.0} /></group>
        <Halo pos={[0, h + 0.35, d / 2 + 0.2]} r={1.35 * breathe} color="#ff9a48" strength={0.42 * fire} order={2} />
        <Embers f={f} box={[-0.5, 0.5, h + 0.2, lintel + 0.9, d / 2 - 0.2, d / 2 + 0.25]} n={14} size={0.022} life={52} seed={7} />
      </> : null}
      {/* tongs and a poker resting on the rim */}
      <B p={[0.55, h + 0.1, d - 0.2]} s={[0.62, 0.018, 0.022]} r={[0, 0.35, -0.08]} c="#26262a" /><B p={[0.6, h + 0.1, d - 0.16]} s={[0.6, 0.018, 0.022]} r={[0, 0.25, -0.1]} c="#2c2c30" />
      <B p={[-0.5, h + 0.12, d - 0.3]} s={[0.9, 0.022, 0.022]} r={[0, -0.6, -0.12]} c="#2a2a2e" />
      {/* the lintel: a heavy beam on two corbel stones, two iron straps, hooks */}
      <StoneBox id="forge-corbel-l" p={[-w / 2 - 0.12, lintel - 0.45, d - 0.25]} s={[0.36, 0.9, 0.5]} look={{seed: 51}} />
      <StoneBox id="forge-corbel-r" p={[w / 2 + 0.12, lintel - 0.45, d - 0.25]} s={[0.36, 0.9, 0.5]} look={{seed: 53}} />
      <Timber p={[0, lintel + 0.1, d - 0.1]} s={[w + 0.7, 0.22, 0.26]} seed={2} />
      {[-0.7, 0.7].map((x) => <B key={x} p={[x, lintel + 0.1, d + 0.035]} s={[0.07, 0.24, 0.02]} c="#2a2624" cast={false} />)}
      {[-0.7, 0.7].flatMap((x) => [0.04, 0.16].map((y) => <mesh key={`${x}${y}`} position={[x, lintel + y, d + 0.05]}><sphereGeometry args={[0.014, 6, 5]} /><meshLambertMaterial color="#4a4440" /></mesh>))}
      {[-0.35, 0.05, 0.4].map((x) => <group key={x}><B p={[x, lintel - 0.04, d + 0.03]} s={[0.018, 0.1, 0.018]} c="#2a2624" /><mesh position={[x, lintel - 0.11, d + 0.03]}><torusGeometry args={[0.028, 0.008, 5, 10, Math.PI * 1.3]} /><meshLambertMaterial color="#2e2c2e" /></mesh></group>)}
      {/* the hood: three steps of masonry narrowing upwards into the chimney, each with a dressed cap course */}
      <StoneBox id="forge-hood-1" p={[0, lintel + 0.22 + 0.4, (d - 0.05) / 2]} s={[w + 0.5, 0.8, d - 0.05]} look={{seed: 61, soot: [{x: (w + 0.5) / 2, y: 0, r: 1.2, k: 0.7}]}} />
      <B p={[0, lintel + 1.04, d - 0.08]} s={[w + 0.58, 0.07, 0.16]} c="#6e655a" />
      <StoneBox id="forge-hood-2" p={[0, lintel + 1.07 + 0.5, (d - 0.3) / 2]} s={[w, 1.0, d - 0.3]} look={{seed: 71, soot: [{x: w / 2, y: 0, r: 1.1, k: 0.55}]}} />
      <B p={[0, lintel + 2.1, d - 0.32]} s={[w + 0.08, 0.07, 0.16]} c="#655d53" />
      <StoneBox id="forge-hood-3" p={[0, (lintel + 2.12 + ceiling) / 2, (d - 0.6) / 2]} s={[1.2, Math.max(0.2, ceiling - lintel - 2.12), d - 0.6]} look={{seed: 81, soot: [{x: 0.6, y: 0, r: 1.2, k: 0.4}]}} />
      {/* soot on the underside of the hood, a dark mouth */}
      <mesh position={[0, lintel + 0.215, d / 2 - 0.05]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[w + 0.7, d - 0.15]} /><meshBasicMaterial color="#120e0c" /></mesh>
      {light ? <>
        <pointLight position={[0, h + 0.45, d / 2 + 0.25]} color="#ff8436" intensity={7 * k} distance={5} decay={1.5} />
        <ForgeSpot from={[0.1, h + 0.55, d / 2 + 0.55]} to={aim} intensity={26 * k} />
        {/* spill: the glow of the coals reaching the FRONT of figures who stand in the room */}
        <pointLight position={[0.6, 1.0, d + 2.2]} color="#ff9a52" intensity={2.6 * k} distance={7} decay={1.4} />
      </> : null}
    </group>
  );
};
const ForgeSpot: React.FC<{from: V3; to: V3; intensity: number}> = ({from, to, intensity}) => {
  const l = useMemo(() => { const s = new THREE.SpotLight('#ff9040', intensity, 14, 1.15, 0.85, 1.6); s.castShadow = true; s.shadow.mapSize.set(2048, 2048); s.shadow.bias = -0.0006; s.shadow.normalBias = 0.02; s.shadow.radius = 2.4; s.shadow.blurSamples = 10; s.shadow.camera.near = 0.1; s.shadow.camera.far = 14; return s; }, []);
  l.intensity = intensity;
  return <><primitive object={l} position={from} /><primitive object={l.target} position={to} /></>;
};

/** Leather bellows on a trestle: two wedge boards with pleated leather between, an iron nozzle pointing +x (into the hearth's
 *  side), a wooden handle at the back end. pos = middle of the trestle on the floor. */
export const Bellows: React.FC<{pos: V3; rotY?: number; open?: number}> = ({pos, rotY = 0, open = 0.6}) => {
  const a = 0.12 + open * 0.12;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {[-0.4, 0.38].map((x) => <group key={x}><Timber p={[x, 0.25, -0.2]} s={[0.07, 0.5, 0.07]} seed={3} /><Timber p={[x, 0.25, 0.2]} s={[0.07, 0.5, 0.07]} seed={1} /><Timber p={[x, 0.47, 0]} s={[0.09, 0.07, 0.5]} seed={2} /></group>)}
      <Timber p={[0, 0.54, 0]} s={[1.05, 0.05, 0.56]} seed={3} />
      {/* leather pleats, wider at the back */}
      {[0, 1, 2].map((k) => <B key={k} p={[-0.08, 0.6 + k * 0.07, 0]} s={[0.82 - k * 0.05, 0.075, 0.54 - k * 0.04]} r={[0, 0, a * (0.3 + k * 0.25)]} c={k % 2 ? '#4a2e1e' : '#5c3a26'} />)}
      <group position={[0.46, 0.57, 0]} rotation={[0, 0, a]}><Timber p={[-0.52, 0.22, 0]} s={[1.05, 0.05, 0.58]} seed={0} />
        <B p={[-0.98, 0.25, 0]} s={[0.4, 0.05, 0.06]} c="#5a4230" /><B p={[-0.5, 0.25, 0.2]} s={[0.05, 0.012, 0.05]} c="#8a7a5a" cast={false} /></group>
      <mesh position={[0.68, 0.6, 0]} rotation={[0, 0, Math.PI / 2 - 0.05]} castShadow><cylinderGeometry args={[0.035, 0.07, 0.42, 9]} /><meshLambertMaterial color="#2c2a2a" /></mesh>
      <B p={[0.46, 0.61, 0]} s={[0.06, 0.16, 0.6]} c="#2a2624" />
    </group>
  );
};

/** A plank rack on the wall with pegs: tongs, two hammers, a file, a ring of wire. Faces +z; pos = the rack's centre. */
export const ToolRack: React.FC<{pos: V3; w?: number}> = ({pos, w = 1.1}) => {
  const tongs = (x: number, L: number, k: number) => <group key={`t${k}`} position={[x, -0.06, 0.06]}><B p={[-0.015, -L / 2, 0]} s={[0.018, L, 0.018]} r={[0, 0, 0.04]} c="#2e2e32" /><B p={[0.015, -L / 2, 0.012]} s={[0.018, L, 0.018]} r={[0, 0, -0.04]} c="#38383c" /><mesh position={[0, -0.08, 0.025]}><sphereGeometry args={[0.016, 6, 5]} /><meshLambertMaterial color="#555" /></mesh><B p={[0, -L + 0.02, 0.006]} s={[0.07, 0.03, 0.02]} c="#2a2a2e" /></group>;
  const hammer = (x: number, L: number, k: number) => <group key={`h${k}`} position={[x, -0.04, 0.07]}><B p={[0, -0.02, 0]} s={[0.15, 0.06, 0.06]} c="#3a3a40" /><B p={[0, -L / 2 - 0.05, 0]} s={[0.035, L, 0.03]} c="#7a5a3a" /></group>;
  return (
    <group position={pos}>
      <Timber p={[0, 0, 0.03]} s={[w, 0.12, 0.06]} seed={1} />
      {Array.from({length: 6}, (_, i) => <B key={i} p={[-w / 2 + 0.12 + i * (w - 0.24) / 5, -0.01, 0.08]} s={[0.025, 0.025, 0.08]} c="#4a3624" />)}
      {tongs(-w / 2 + 0.12, 0.62, 0)}{tongs(-w / 2 + 0.12 + (w - 0.24) / 5, 0.7, 1)}{hammer(-w / 2 + 0.12 + 2 * (w - 0.24) / 5, 0.36, 2)}{tongs(-w / 2 + 0.12 + 3 * (w - 0.24) / 5, 0.55, 3)}{hammer(-w / 2 + 0.12 + 4 * (w - 0.24) / 5, 0.3, 4)}
      <group position={[w / 2 - 0.12, -0.18, 0.065]}><mesh rotation={[0, 0, 0]}><torusGeometry args={[0.1, 0.012, 5, 16]} /><meshLambertMaterial color="#5a4a3a" /></mesh></group>
      <B p={[w / 2 - 0.12, -0.42, 0.06]} s={[0.025, 0.3, 0.012]} c="#4a4a50" />
    </group>
  );
};

/** A painted scroll (thangka) on the wall: a brocade border, a deep blue field with a lotus mandala, wooden rods with brass
 *  caps, a thin yellow veil rolled up at the top, two ribbons. Faces +z; pos = centre. */
const thangkaTex = () => tex('forge-thangka', 360, 560, (c, W, H) => {
  const r = rnd(9);
  c.fillStyle = '#7a1e1a'; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 220; k++) { c.fillStyle = r() < 0.5 ? 'rgba(220,170,70,0.35)' : 'rgba(40,10,8,0.3)'; c.beginPath(); c.arc(r() * W, r() * H, 2 + r() * 3, 0, 7); c.fill(); }
  c.fillStyle = '#d8a83c'; c.fillRect(28, 46, W - 56, H - 130); c.fillStyle = '#1e3458'; c.fillRect(36, 54, W - 72, H - 146);
  const cx = W / 2, cy = 54 + (H - 146) / 2;
  const ring = (rad: number, col: string, lw: number) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(cx, cy, rad, 0, 7); c.stroke(); };
  c.fillStyle = '#2a4a72'; c.beginPath(); c.arc(cx, cy, 120, 0, 7); c.fill(); ring(120, '#d8a83c', 4); ring(104, '#b8483a', 6);
  c.save(); c.translate(cx, cy); c.rotate(Math.PI / 4); c.fillStyle = '#e6d6a8'; c.fillRect(-62, -62, 124, 124); c.fillStyle = '#3a6a5a'; c.fillRect(-50, -50, 100, 100); c.restore();
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.fillStyle = k % 2 ? '#e88a6a' : '#f2c27a'; c.beginPath(); c.ellipse(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30, 22, 10, a, 0, 7); c.fill(); }
  c.fillStyle = '#f2d27a'; c.beginPath(); c.arc(cx, cy, 16, 0, 7); c.fill();
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; c.fillStyle = '#d8a83c'; c.beginPath(); c.arc(cx + Math.cos(a) * 112, cy + Math.sin(a) * 112, 3, 0, 7); c.fill(); }
  // clouds and little flames in the corners of the field
  [[60, 80], [W - 60, 80], [60, H - 120], [W - 60, H - 120]].forEach(([x, y]) => { c.fillStyle = 'rgba(230,226,210,0.6)'; [0, 1, 2].forEach((i) => { c.beginPath(); c.arc(x - 10 + i * 10, y, 9, 0, 7); c.fill(); }); });
  c.fillStyle = 'rgba(30,20,10,0.25)'; c.fillRect(0, 0, W, H * 0.05); const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,18,10,0.3)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
});
export const Thangka: React.FC<{pos: V3; w?: number; h?: number}> = ({pos, w = 0.56, h = 0.87}) => (
  <group position={pos}>
    <mesh position={[0, 0, 0.03]} receiveShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={thangkaTex()} /></mesh>
    {[h / 2 + 0.02, -h / 2 - 0.02].map((y, i) => <group key={y}><mesh position={[0, y, 0.045]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.018, 0.018, w + 0.08, 8]} /><meshLambertMaterial color={i ? '#5a2a1a' : '#4a2a1a'} /></mesh>
      {[-1, 1].map((sd) => <mesh key={sd} position={[sd * (w / 2 + 0.055), y, 0.045]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.026, 0.022, 0.035, 8]} /><meshLambertMaterial color="#c9a24a" /></mesh>)}</group>)}
    {/* the rolled-up veil and two ribbons */}
    <mesh position={[0, h / 2 - 0.02, 0.07]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.035, 0.035, w - 0.02, 10]} /><meshLambertMaterial color="#d9b84a" /></mesh>
    {[-0.12, 0.12].map((x, i) => <B key={x} p={[x, h / 2 - 0.22, 0.085]} s={[0.035, 0.36, 0.004]} r={[0, 0, (i ? 1 : -1) * 0.05]} c={i ? '#b8483a' : '#d9b84a'} cast={false} />)}
    <B p={[0, h / 2 + 0.12, 0.04]} s={[0.006, 0.2, 0.006]} c="#2a2420" cast={false} /><B p={[0, h / 2 + 0.22, 0.03]} s={[0.03, 0.03, 0.05]} c="#3a3430" />
  </group>
);

/** A stone ledge on the wall with three butter lamps: brass cups on stems, small flames, their own warm light. pos = the
 *  ledge's centre at the wall; lit = flames on. */
export const ButterLamps: React.FC<{pos: V3; f?: number; lit?: boolean}> = ({pos, f = 0, lit = true}) => (
  <group position={pos}>
    <StoneBox id="forge-ledge" p={[0, 0, 0.13]} s={[0.78, 0.08, 0.26]} look={{seed: 91, course: [0.08, 0.08], len: [0.25, 0.4]}} />
    <StoneBox id="forge-ledge-corbel" p={[0, -0.13, 0.07]} s={[0.26, 0.18, 0.14]} look={{seed: 93, course: [0.18, 0.18], len: [0.26, 0.26]}} />
    {[-0.24, 0, 0.24].map((x, i) => <group key={x} position={[x, 0.04, 0.15]}>
      <FacetLathe profile={[[0.035, 0], [0.025, 0.02], [0.012, 0.03], [0.012, 0.06], [0.04, 0.075], [0.055, 0.11], [0.05, 0.112]]} sides={10} color="#c9a24a" tones={[0.8, 1, 1.15, 1.1, 0.9, 1.2, 1]} contact={false} />
      {lit ? <><mesh position={[0, 0.15 + 0.004 * Math.sin(f * 0.4 + i * 2), 0.01]} scale={[1, 1 + 0.12 * Math.sin(f * 0.33 + i * 1.7), 1]} renderOrder={4}><circleGeometry args={[0.018, 10]} /><meshBasicMaterial color="#fff0b0" /></mesh>
        <mesh position={[0, 0.17, 0.008]} scale={[0.6, 1.8, 1]} renderOrder={4}><circleGeometry args={[0.018, 10]} /><meshBasicMaterial color="#ffb44a" transparent opacity={0.9} /></mesh>
        <Halo pos={[0, 0.16, 0.02]} r={0.16} color="#ffc46a" strength={0.5} /></> : null}
    </group>)}
    {lit ? <pointLight position={[0, 0.25, 0.35]} color="#ffb860" intensity={0.9} distance={2.6} decay={2} /> : null}
  </group>
);

/** A wooden quench tub: staves, two iron hoops, dark water with the forge's light lying on it, a ladle hooked on the rim. */
export const QuenchTub: React.FC<{pos: V3; glow?: number}> = ({pos, glow = 1}) => (
  <group position={pos}>
    <FacetLathe profile={[[0.34, 0], [0.37, 0.25], [0.39, 0.52], [0.36, 0.53], [0.34, 0.05]]} sides={16} color="#5a3e2a" tones={[0.82, 1.05, 0.9, 1.12, 0.86, 1.0, 0.92, 1.08, 0.84, 1.06, 0.9, 1.1, 0.86, 1.02, 0.94, 1.08]} />
    {[0.1, 0.42].map((y) => <FacetLathe key={y} profile={[[0.355 + y * 0.06, y], [0.362 + y * 0.06, y + 0.012], [0.362 + y * 0.06, y + 0.04], [0.355 + y * 0.06, y + 0.05]]} sides={16} color="#2a2826" contact={false} cast={false} />)}
    <mesh position={[0, 0.47, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.35, 20]} /><meshLambertMaterial color="#1c262e" /></mesh>
    <mesh position={[-0.08, 0.472, 0.05]} rotation={[-Math.PI / 2, 0, 0.4]} scale={[1, 0.35, 1]}><circleGeometry args={[0.16, 14]} /><meshBasicMaterial color="#ff9a4a" transparent opacity={0.35 * glow} depthWrite={false} /></mesh>
    <group position={[0.3, 0.52, 0.12]} rotation={[0, -0.5, -0.9]}><B p={[0, 0.18, 0]} s={[0.025, 0.4, 0.02]} c="#6a4a30" /><FacetLathe profile={[[0.06, -0.05], [0.07, 0], [0.065, 0.02]]} sides={8} color="#3a3634" pos={[0, -0.04, 0]} contact={false} /></group>
  </group>
);

/** A hessian sack of charcoal, open at the top with coal heaped in it, a few lumps spilt beside it. */
export const CoalSack: React.FC<{pos: V3; s?: number; seed?: number}> = ({pos, s = 1, seed = 1}) => {
  const lumps = useMemo(() => { const r = rnd(seed + 5); return Array.from({length: 18}, (_, i) => i < 11 ? [(r() - 0.5) * 0.36, 0.66 + r() * 0.07, (r() - 0.5) * 0.34, 0.05 + r() * 0.04, r() * 3] : [0.32 + r() * 0.35, 0.02, (r() - 0.3) * 0.5, 0.035 + r() * 0.03, r() * 3]); }, [seed]);
  return (
    <group position={pos} scale={s}>
      <FacetLathe profile={[[0.22, 0], [0.33, 0.14], [0.35, 0.4], [0.28, 0.62], [0.27, 0.68], [0.24, 0.66]]} sides={10} color="#6a5a44" wobble={0.12} seed={seed} tones={[0.85, 1.08, 0.92, 1.12, 0.88, 1, 0.94, 1.1, 0.86, 1.04]} />
      <FacetLathe profile={[[0.24, 0.63], [0.1, 0.74], [0.01, 0.76]]} sides={9} color="#1c1a18" contact={false} cast={false} />
      {lumps.map(([x, y, z, k, ry], i) => <mesh key={i} position={[x, y + k * 0.3, z]} rotation={[0.4, ry, 0.3]} castShadow><boxGeometry args={[k, k * 0.7, k * 0.8]} /><meshLambertMaterial color={i % 3 ? '#1e1c1a' : '#2c2926'} /></mesh>)}
      <B p={[0.1, 0.34, 0.36]} s={[0.36, 0.03, 0.004]} r={[0, 0, 0.2]} c="#4e4234" cast={false} />
    </group>
  );
};

/** The anvil on its tree stump. The anvil's long axis runs along x with the horn to -x; ANVIL.top = height of the face.
 *  tongs = a pair of tongs lying across the heel; hammer = a hammer lying on the stump's rim. */
export const ANVIL = {top: 0.86, faceX: [-0.24, 0.3] as [number, number], faceZ: 0.16, stumpR: 0.31};
export const Anvil: React.FC<{pos: V3; rotY?: number; tongs?: boolean; hammer?: boolean; glow?: number}> = ({pos, rotY = 0, tongs = true, hammer = false, glow = 0}) => {
  const iron = '#33363c', ironDark = '#24262b', ironLight = '#6d727c';
  const S = 0.47;   // stump height
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {/* the stump: bark, an iron band, axe marks, a ring of chips round its foot */}
      <FacetLathe profile={[[0.35, 0], [0.33, 0.06], [0.31, 0.2], [0.305, S - 0.02], [0.29, S]]} sides={13} color="#5c402c" wobble={0.1} seed={4} tones={[0.8, 1.05, 0.9, 1.1, 0.85, 1.0, 0.92, 1.12, 0.82, 1.06, 0.9, 1.0, 0.88]} />
      <mesh position={[0, S + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[0.29, 24]} /><meshLambertMaterial map={tex('forge-stump-top', 256, 256, (c, W) => { c.fillStyle = '#a07a52'; c.fillRect(0, 0, W, W); for (let k = 1; k < 12; k++) { c.strokeStyle = k % 2 ? 'rgba(90,60,35,0.5)' : 'rgba(120,85,55,0.35)'; c.lineWidth = 2; c.beginPath(); c.arc(W / 2 + 4, W / 2 - 3, k * 11, 0, 7); c.stroke(); } c.strokeStyle = 'rgba(40,25,15,0.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2, W / 2); c.lineTo(W * 0.92, W * 0.6); c.stroke(); c.fillStyle = 'rgba(20,15,12,0.35)'; c.fillRect(0, 0, W, W); })} /></mesh>
      <FacetLathe profile={[[0.318, 0.33], [0.322, 0.34], [0.322, 0.38], [0.318, 0.39]]} sides={13} color="#26262a" contact={false} cast={false} />
      {[0, 1, 2, 3, 4, 5].map((i) => { const a = i * 1.1 + 0.4; return <B key={i} p={[Math.cos(a) * 0.45, 0.01, Math.sin(a) * 0.4]} s={[0.07, 0.015, 0.035]} r={[0, a * 2, 0]} c={i % 2 ? '#8a6a48' : '#6a4e34'} cast={false} />; })}
      {/* the anvil */}
      <group position={[0, S, 0]}>
        <B p={[0.03, 0.04, 0]} s={[0.5, 0.08, 0.36]} c={ironDark} />
        <B p={[0.03, 0.1, 0]} s={[0.4, 0.05, 0.28]} c={iron} />
        <B p={[0.03, 0.19, 0]} s={[0.28, 0.14, 0.2]} c={iron} />
        <B p={[0.03, 0.32, 0]} s={[0.56, 0.12, 0.32]} c={iron} />
        <B p={[0.03, ANVIL.top - S - 0.012, 0]} s={[0.56, 0.024, 0.32]} c={ironLight} />
        <B p={[0.03, ANVIL.top - S - 0.03, 0.163]} s={[0.56, 0.012, 0.004]} c="#9aa0aa" cast={false} />
        {/* horn to -x, heel to +x with the hardy and pritchel holes */}
        <mesh position={[-0.42, 0.34, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow><coneGeometry args={[0.13, 0.32, 10]} /><meshLambertMaterial color={iron} /></mesh>
        <mesh position={[-0.42, 0.372, 0]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.09, 0.3, 10, 1, false, Math.PI * 0.75, Math.PI * 0.5]} /><meshLambertMaterial color={ironLight} side={THREE.DoubleSide} /></mesh>
        <B p={[0.21, ANVIL.top - S + 0.001, 0.04]} s={[0.04, 0.002, 0.04]} c="#0e0e10" cast={false} /><B p={[0.25, ANVIL.top - S + 0.001, -0.05]} s={[0.025, 0.002, 0.025]} c="#0e0e10" cast={false} />
        {/* rust bloom on the side, a worn bright edge */}
        <mesh position={[-0.05, 0.27, 0.161]}><planeGeometry args={[0.14, 0.05]} /><meshLambertMaterial color="#6a3a24" transparent opacity={0.6} /></mesh>
        <mesh position={[0.18, 0.15, 0.101]}><planeGeometry args={[0.08, 0.06]} /><meshLambertMaterial color="#5a3424" transparent opacity={0.5} /></mesh>
        {tongs ? <group position={[0.2, ANVIL.top - S + 0.02, 0.02]} rotation={[0, 0.5, 0]}><B p={[0.12, 0, 0]} s={[0.62, 0.018, 0.022]} r={[0, 0.04, 0]} c="#2a2a2e" /><B p={[0.12, 0.006, 0.03]} s={[0.6, 0.018, 0.022]} r={[0, -0.06, 0]} c="#323236" /></group> : null}
      </group>
      {hammer ? <group position={[0.12, S + 0.03, 0.18]} rotation={[0, -0.4, 0]}><B p={[0, 0, 0]} s={[0.05, 0.05, 0.16]} c="#3a3a40" /><B p={[0.18, 0, 0]} s={[0.36, 0.035, 0.03]} c="#7a5a3a" /></group> : null}
      {glow > 0 ? <pointLight position={[0, ANVIL.top + 0.08, 0.22]} color="#ff7a2a" intensity={2.2 * glow} distance={2.2} decay={2} /> : null}
    </group>
  );
};

// ---------------------------------------------------------------- the mask
/** The size of the loose mask in metres: the same plate as the one on Doom's face (mould units x adult head scale 0.8 x
 *  height / 1191), so the mask he lifts from the anvil is the mask he wears. */
export const maskSize = (height = 1.96) => { const k = (0.8 * height) / 1191; return {w: MASK_BOX.w * k, h: MASK_BOX.h * k}; };
const MASK_TEX = new Map<string, THREE.CanvasTexture>();
const maskTex = (heat: number) => { const q = Math.round(clamp(heat) * 50) / 50, key = q.toFixed(2); let t = MASK_TEX.get(key); if (!t) { const cv = document.createElement('canvas'); paintMask(cv, 1.6, q); t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; MASK_TEX.set(key, t); } return t; };
/** THE LOOSE MASK (the forge's one prop): Doom's iron mask as a flat plate, glowing with heat (1 = red-hot, just forged;
 *  0 = cold grey iron). Hot, it lights itself (emissive), throws an orange light on what is near and sheds sparks (f).
 *  pos = the middle of its LOWER edge; lean = how far it leans back from upright (radians; lying on the anvil about 0.6);
 *  rotY / tilt (about z) to turn it; height = Doom's height (sets its size). It faces +z. */
export const LooseMask: React.FC<{pos: V3; heat?: number; f?: number; lean?: number; rotY?: number; tilt?: number; height?: number; sparks?: boolean; light?: boolean}> =
  ({pos, heat = 1, f = 0, lean = 0.6, rotY = 0, tilt = 0, height = 1.96, sparks = true, light = true}) => {
    const {w, h} = maskSize(height), k = clamp(heat), flick = 1 + 0.06 * Math.sin(f * 0.53) + 0.04 * Math.sin(f * 1.31);
    const map = maskTex(k);
    return (
      <group position={pos} rotation={[0, rotY, 0]}>
        <group rotation={[-lean, 0, tilt]}>
          <mesh position={[0, h / 2, 0]} renderOrder={3}><planeGeometry args={[w, h]} /><meshLambertMaterial map={map} color={new THREE.Color(1 - 0.55 * k, 1 - 0.55 * k, 1 - 0.55 * k)} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.78 * k * flick} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>{/* hot iron shines by itself: the plate's own painting (white core, dark rim, scale) must show, not the lamps' colour (coordinator, 22/11/2026) */}
          {k > 0.05 ? <Halo pos={[0, h * 0.48, 0.03]} r={w * (0.9 + 0.5 * k)} color="#ff8a3a" strength={0.3 * k * flick} order={5} /> : null}
          {k > 0.5 ? <Halo pos={[-0.01, h * 0.42, 0.035]} r={w * 0.42} color="#fff0c4" strength={0.34 * (k - 0.5) * 2 * flick} order={5} /> : null}
        </group>
        {light && k > 0.02 ? <pointLight position={[0, h * 0.3, -0.12]} color="#ff7a30" intensity={3.2 * k * flick} distance={3.2} decay={1.8} /> : null}
        {sparks && k > 0.3 ? <Embers f={f} box={[-w * 0.35, w * 0.35, h * 0.3, h * 0.3 + 0.9, -0.05, 0.12]} n={Math.round(10 * k)} size={0.014} life={40} seed={3} color="#ffc060" /> : null}
      </group>
    );
  };

/** A low smith's bench: thick top of two planks on splayed legs; on it tongs, a hammer, a chisel, iron rods, a whetstone. */
export const LowBench: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Timber p={[0, 0.5, -0.14]} s={[1.3, 0.07, 0.28]} seed={1} /><Timber p={[0.02, 0.5, 0.15]} s={[1.28, 0.07, 0.29]} seed={3} />
    {[[-0.52, -0.2], [-0.52, 0.2], [0.52, -0.2], [0.52, 0.2]].map(([x, z], i) => <Timber key={i} p={[x * 1.04, 0.23, z * 1.1]} s={[0.07, 0.48, 0.07]} r={[z * 0.25, 0, -x * 0.12]} seed={i} />)}
    <Timber p={[0, 0.16, 0]} s={[1.0, 0.05, 0.05]} seed={2} />
    <group position={[-0.25, 0.545, 0.05]} rotation={[0, 0.3, 0]}><B p={[0, 0, 0]} s={[0.6, 0.02, 0.022]} c="#2c2c30" /><B p={[0, 0.005, 0.03]} s={[0.58, 0.02, 0.022]} r={[0, -0.07, 0]} c="#36363a" /></group>
    <group position={[0.3, 0.56, -0.08]} rotation={[0, -0.5, 0]}><B p={[0, 0, 0]} s={[0.06, 0.06, 0.16]} c="#3a3a40" /><B p={[0.2, -0.01, 0]} s={[0.38, 0.035, 0.03]} c="#7a5a3a" /></group>
    {[0, 1, 2].map((i) => <mesh key={i} position={[0.05 + i * 0.03, 0.548, 0.2]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.01, 0.01, 0.7, 6]} /><meshLambertMaterial color="#3a3a40" /></mesh>)}
    <B p={[0.5, 0.555, 0.12]} s={[0.18, 0.04, 0.06]} c="#8a8478" />
  </group>
);

// ---------------------------------------------------------------- outside the window
/** THE NIGHT OUTSIDE (world pieces behind the back wall, seen through a window; they keep their places for every camera, so
 *  a push towards the window has real parallax): a deep blue sky with stars and a moon, a far range of snow peaks, a nearer
 *  ridge with snow on its shoulders, a string of five-colour prayer flags running down across the view, snow falling.
 *  at = [x, z] of the window's centre in the wall (the pieces are placed behind it); f = frame (flags flutter, snow falls). */
const skyTex = () => tex('forge-sky', 2048, 1200, (c, W, H) => {
  const r = rnd(5), g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1230'); g.addColorStop(0.55, '#1b2858'); g.addColorStop(0.8, '#24346a'); g.addColorStop(1, '#2e3f78'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 900; k++) { const a = 0.35 + r() * 0.65; c.fillStyle = `rgba(238,240,255,${a * (1 - r() * 0.3)})`; const s = r() < 0.06 ? 3.2 : 1.6; c.fillRect(r() * W, r() * H * 0.85, s, s); }
  const mx = W * 0.528, my = H * 0.4, halo = c.createRadialGradient(mx, my, 6, mx, my, 220); halo.addColorStop(0, 'rgba(220,230,255,0.4)'); halo.addColorStop(1, 'rgba(220,230,255,0)'); c.fillStyle = halo; c.fillRect(mx - 240, my - 240, 480, 480);
  c.fillStyle = '#eef0f6'; c.beginPath(); c.arc(mx, my, 34, 0, 7); c.fill(); c.fillStyle = 'rgba(170,180,205,0.5)'; [[-10, -6, 8], [8, 10, 6], [12, -12, 5]].forEach(([x, y, s]) => { c.beginPath(); c.arc(mx + x, my + y, s, 0, 7); c.fill(); });
  // a thin band of cloud low on the sky
  for (let k = 0; k < 14; k++) { const x = r() * W, y = H * (0.62 + r() * 0.12); c.fillStyle = 'rgba(120,140,190,0.16)'; c.beginPath(); c.ellipse(x, y, 160 + r() * 200, 12 + r() * 10, 0, 0, 7); c.fill(); }
});
const rangeTex = (key: string, seed: number, near: boolean) => tex(key, 2048, 640, (c, W, H) => {
  const r = rnd(seed), base = H, peaks: number[][] = [];
  for (let x = -60; x < W + 120; x += (near ? 90 : 70) + r() * (near ? 170 : 110)) peaks.push([x, H * (near ? 0.42 + r() * 0.34 : 0.3 + r() * 0.35)]);
  const rock = near ? ['#1c2238', '#141a2c'] : ['#5a6690', '#46507a'], snow = near ? ['#6e7aa0', '#4a5478'] : ['#c2cce4', '#8a96ba'];
  for (let i = 0; i < peaks.length; i++) {
    const [x, y] = peaks[i], hw = (near ? 230 : 150) + r() * (near ? 180 : 110);
    // dark (left, away from the moon) and lit (right) faces
    c.fillStyle = rock[1]; c.beginPath(); c.moveTo(x - hw, base); c.lineTo(x, y); c.lineTo(x + hw * 0.1, base); c.closePath(); c.fill();
    c.fillStyle = rock[0]; c.beginPath(); c.moveTo(x, y); c.lineTo(x + hw, base); c.lineTo(x + hw * 0.1, base); c.closePath(); c.fill();
    // snow: a cap and ragged tongues down the gullies
    const sh = (base - y) * (near ? 0.32 : 0.55);
    c.fillStyle = snow[1]; c.beginPath(); c.moveTo(x, y); c.lineTo(x - hw * (sh / (base - y)), y + sh); for (let k = 0; k < 5; k++) c.lineTo(x - hw * (sh / (base - y)) * (1 - k / 5), y + sh + (k % 2 ? -sh * 0.25 : sh * 0.3) * r()); c.lineTo(x, y + sh * 0.9); c.closePath(); c.fill();
    c.fillStyle = snow[0]; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + sh * 0.9); for (let k = 0; k <= 5; k++) c.lineTo(x + hw * (sh / (base - y)) * (k / 5), y + sh * (k % 2 ? 0.6 : 1.1) * (0.85 + r() * 0.2)); c.closePath(); c.fill();
    for (let k = 0; k < 4; k++) { const t = 0.3 + r() * 0.6, gx = x + (r() - 0.3) * hw * t, gy = y + (base - y) * t; c.fillStyle = r() < 0.5 ? snow[0] : snow[1]; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + 18 + r() * 30, gy + 50 + r() * 70); c.lineTo(gx + 6, gy + 60 + r() * 60); c.closePath(); c.fill(); }
  }
  if (near) { c.fillStyle = '#1a2038'; c.fillRect(0, H * 0.9, W, H * 0.1); for (let x = 0; x < W; x += 6 + r() * 10) { const h = 10 + r() * 34; c.fillStyle = r() < 0.5 ? '#141a30' : '#1c233e'; c.beginPath(); c.moveTo(x, H * 0.9); c.lineTo(x + 5, H * 0.9 - h); c.lineTo(x + 10, H * 0.9); c.fill(); } }
});
export const FLAG_COLOURS = ['#3a6ab0', '#e6e2d4', '#c23a30', '#3f8a4a', '#e0b23a'];
export const NightPeaks: React.FC<{at: [number, number]; f?: number; flags?: boolean; snow?: boolean}> = ({at, f = 0, flags = true, snow = true}) => {
  const [X, Z] = at;
  const flakes = useMemo(() => { const r = rnd(19); return Array.from({length: 70}, () => [X - 2.2 + r() * 4.4, r() * 5.2, Z - 0.6 - r() * 5.5, 0.012 + r() * 0.016, r() * 6.28, 0.3 + r() * 0.5] as const); }, [X, Z]);
  // the flag string: from high left to low right, a sagging line
  const A: V3 = [X - 2.8, 4.6, Z - 4.5], Bp: V3 = [X + 3.4, 1.9, Z - 7.0], N = 20;
  const pt = (t: number): V3 => [A[0] + (Bp[0] - A[0]) * t, A[1] + (Bp[1] - A[1]) * t - Math.sin(t * Math.PI) * 0.55, A[2] + (Bp[2] - A[2]) * t];
  return (
    <group>
      <mesh position={[X, 40, Z - 420]}><planeGeometry args={[820, 480]} /><meshBasicMaterial map={skyTex()} fog={false} /></mesh>
      <mesh position={[X + 20, 10, Z - 200]}><planeGeometry args={[160, 50]} /><meshBasicMaterial map={rangeTex('forge-range-far', 7, false)} transparent fog={false} /></mesh>
      <mesh position={[X + 8, 4, Z - 72]}><planeGeometry args={[100, 30]} /><meshBasicMaterial map={rangeTex('forge-range-near', 13, true)} transparent fog={false} /></mesh>
      {flags ? <group>
        {Array.from({length: 24}, (_, i) => { const t0 = i / 24, t1 = (i + 1) / 24, a = pt(t0), b = pt(t1), mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          return <mesh key={i} position={mid} rotation={[0, 0, Math.atan2(b[1] - a[1], b[0] - a[0])]}><boxGeometry args={[len, 0.012, 0.012]} /><meshBasicMaterial color="#2a2a34" fog={false} /></mesh>; })}
        {Array.from({length: N}, (_, i) => { const t = (i + 0.5) / N, p = pt(t), sw = Math.sin(f * 0.21 + i * 0.9) * 0.25, col = new THREE.Color(FLAG_COLOURS[i % 5]).multiplyScalar(0.42);
          return <mesh key={`f${i}`} position={[p[0], p[1] - 0.15, p[2]]} rotation={[sw * 0.4, sw, sw * 0.15]}><planeGeometry args={[0.2, 0.24]} /><meshBasicMaterial color={col} side={THREE.DoubleSide} fog={false} /></mesh>; })}
      </group> : null}
      {snow ? flakes.map(([x, y, z, s, ph, sp], i) => { const yy = ((y - (f / 24) * sp) % 5.2 + 5.2) % 5.2 - 0.3; return <mesh key={`s${i}`} position={[x + Math.sin(f * 0.05 + ph) * 0.15, yy, z]}><circleGeometry args={[s, 6]} /><meshBasicMaterial color="#e8ecf6" transparent opacity={0.85} fog={false} /></mesh>; }) : null}
    </group>
  );
};

// ---------------------------------------------------------------- lighting the set without lighting the people
/** SET GLOW: the surfaces inside glow faintly with their own picture (emissive = their texture x tint x amount), so a night room
 *  reads brighter WITHOUT any extra light falling on the figures, the hot mask or the armour (Daniel, 23/11/2026: the scenes were
 *  too dark; a brighter fill had also washed the mask's orange-red to white and the steel gauntlets to pink). Nested: an inner
 *  <SetGlow> wins over an outer one. Only materials with a picture (map) and an emissive slot are touched. */
export const SetGlow: React.FC<{amount: number; tint?: string; children?: React.ReactNode}> = ({amount, tint = '#ffffff', children}) => {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    ref.current?.traverse((o) => {
      const m = (o as THREE.Mesh).material; if (!m || o.userData.setGlow) return;
      (Array.isArray(m) ? m : [m]).forEach((x) => { const q = x as THREE.MeshLambertMaterial; if (q.map && q.emissive) { q.emissive.set(tint); q.emissiveMap = q.map; q.emissiveIntensity = amount; q.needsUpdate = true; } });
      o.userData.setGlow = true;
    });
  });
  return <group ref={ref}>{children}</group>;
};

// ---------------------------------------------------------------- the smith's hammer and fist (moved here from the d1mo shots of
// the channel on 23/11/2026, word for word, so the forge set owns it; the swing timing of a shot stays with the shot)
/** where the hammer's face lands: the TOP RIM of the leaning mask (the set's mask: foot [4.81, 0.86, 3.61], lean 0.6, 0.505 m
 *  high, so its top edge is at y 1.277, z 3.325), a little left of the middle, where the edge is still straight
 *  (Daniel, bản 2: "chỉ cho búa đánh vào viền, và có hiệu ứng toé ra ở viền") */
const HIT: V3 = [4.74, 1.272, 3.33];
/** THE HAMMER, built from where it lands. Only the hammer head, the handle and the fist at the top edge are seen; the forearm
 *  is above the frame. Two joints: the arm turns about ELBOW (above the top left corner), the hammer turns about the wrist,
 *  so the head trails on the way up and snaps through on the way down (bản 2 was one stiff bar: "tay cầm búa đang hơi cứng").
 *  At contact the handle runs right and a little down (-15 deg) and the head stands nearly upright on the rim. */
const FORE = 0.45, HANDLE = 0.36, HEAD_LEN = 0.17;
const B0 = (-15 * Math.PI) / 180;                                   // the handle's angle at contact
const HEAD_C: V3 = [HIT[0] + (HEAD_LEN / 2) * Math.cos(B0 + Math.PI / 2), HIT[1] + (HEAD_LEN / 2) * Math.sin(B0 + Math.PI / 2), HIT[2] + 0.03];
const WRIST0: V3 = [HEAD_C[0] - HANDLE * Math.cos(B0), HEAD_C[1] - HANDLE * Math.sin(B0), HEAD_C[2]];
const A0 = (-50 * Math.PI) / 180;                                   // the forearm's angle at contact: coming down steeply
export const ELBOW: V3 = [WRIST0[0] - FORE * Math.cos(A0), WRIST0[1] - FORE * Math.sin(A0), WRIST0[2]];
const fistTex = (() => { let t: THREE.CanvasTexture | null = null; return () => {
  if (t) return t;
  const c = document.createElement('canvas'); c.width = 200; c.height = 360; const x = c.getContext('2d')!;
  x.lineJoin = 'round'; x.lineCap = 'round';
  // the wrist going up out of frame, with the turned-back saffron sleeve at the top
  x.fillStyle = '#bd875e'; x.strokeStyle = '#6a4630'; x.lineWidth = 7;
  x.beginPath(); x.moveTo(58, 0); x.lineTo(62, 200); x.lineTo(142, 200); x.lineTo(146, 0); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#d4822e'; x.strokeStyle = '#7a3a18'; x.beginPath(); x.moveTo(30, 0); x.lineTo(40, 70); x.quadraticCurveTo(100, 90, 166, 70); x.lineTo(176, 0); x.closePath(); x.fill(); x.stroke();
  // the fist round the handle
  x.fillStyle = '#c9926a'; x.strokeStyle = '#6a4630';
  x.beginPath(); x.roundRect(40, 190, 124, 110, 40); x.fill(); x.stroke();
  x.strokeStyle = '#8a5a3c'; x.lineWidth = 5; [222, 250, 278].forEach((y) => { x.beginPath(); x.moveTo(78, y); x.lineTo(156, y); x.stroke(); });
  x.fillStyle = '#b07a54'; x.lineWidth = 6; x.strokeStyle = '#6a4630'; x.beginPath(); x.ellipse(74, 214, 28, 18, -0.4, 0, 7); x.fill(); x.stroke();
  return (t = new THREE.CanvasTexture(c), t.colorSpace = THREE.SRGBColorSpace, t);
}; })();
/** The smith's hammer and fist. a = the arm's turn over contact (about ELBOW), w = the hammer's turn over contact (about the
 *  wrist), gone 0..1 = drawn back out of frame. The wrist card hangs from the forearm's direction; the handle and the iron head
 *  are boxes, the head square to the handle, its lower face the striking face. */
export const HammerArm: React.FC<{a: number; w?: number; opacity?: number; gone?: number}> = ({a, w = 0, opacity = 1, gone = 0}) => {
  const aa = A0 + a, wx = ELBOW[0] + FORE * Math.cos(aa) - 0.45 * gone, wy = ELBOW[1] + FORE * Math.sin(aa) + 0.4 * gone, bb = B0 + w;
  const hx = wx + HANDLE * Math.cos(bb), hy = wy + HANDLE * Math.sin(bb);
  const lam = (color: string) => <meshLambertMaterial color={color} transparent opacity={opacity} />;
  return (
    <group position={[0, 0, ELBOW[2]]}>
      {/* the wrist card lies along the forearm: its fist end at the wrist */}
      <mesh position={[wx - 0.07 * Math.cos(aa), wy - 0.07 * Math.sin(aa), 0.012]} rotation={[0, 0, aa + Math.PI / 2]} renderOrder={513}><planeGeometry args={[0.13, 0.234]} />
        <meshLambertMaterial map={fistTex()} transparent opacity={opacity} alphaTest={0.05} side={THREE.DoubleSide} depthWrite={opacity > 0.9} /></mesh>
      <mesh position={[(wx + hx) / 2, (wy + hy) / 2, 0]} rotation={[0, 0, bb]} renderOrder={509}><boxGeometry args={[HANDLE + 0.06, 0.04, 0.034]} />{lam('#a8743e')}</mesh>
      <mesh position={[hx, hy, 0]} rotation={[0, 0, bb + Math.PI / 2]} renderOrder={511}><boxGeometry args={[HEAD_LEN, 0.078, 0.078]} />{lam('#3c3e44')}</mesh>
      <mesh position={[hx, hy, 0.041]} rotation={[0, 0, bb + Math.PI / 2]} renderOrder={512}><planeGeometry args={[HEAD_LEN - 0.02, 0.018]} /><meshBasicMaterial color="#8a8e96" transparent opacity={opacity} /></mesh>{/* a worn bright edge */}
    </group>
  );
};
export {HIT as HAMMER_HIT};
