import React, {useMemo} from 'react';
import {useBui} from './mauBui';
import * as THREE from 'three';
import {rnd, P, Ctx, Plate} from './depth';
import {tex} from './kitLab';
import {Halo} from './look';

/** lib3/kitVuTru (23/11/2026, lô chương 10-14, phần "Vũ trụ"): đồ cắt giấy dùng chung cho `VuTru`, `TrenMay`, `Battleworld`.
 *  Mọi thứ là mảng phẳng 2-3 sắc, mép sắc, không phun mềm, không khối cầu (đĩa phẳng thì được).
 *  - `Cut`: một tấm vẽ đặt giữa không trung ở toạ độ thế giới (tâm, rộng w x cao h), xoay quanh trục nhìn.
 *  - `Hat`: hạt nhỏ sắc (kim cương / sao bốn cánh), trôi, có đời.
 *  - `at(eye, d, u, v)`: đổi toạ độ màn hình (u, v 0..1 từ trái-trên) ở khoảng cách d thành toạ độ thế giới (ống kính 28 độ cố định).
 *  - Trời sao, tinh vân nhiều lớp, hành tinh, mảnh thiên thạch, tàu, Galactus: ở cuối file. */
type V3 = [number, number, number];
export const TAN_V = 0.4986, TAN_H = 0.887;
/** screen (u right, v down, both 0..1) at distance d in front of the eye -> world */
export const at = (eye: V3, d: number, u: number, v: number): V3 => [eye[0] + (u - 0.5) * TAN_H * d, eye[1] + (0.5 - v) * TAN_V * d, eye[2] - d];
/** the world width of a picture that fills `share` of the frame width at distance d */
export const wAt = (d: number, share: number) => share * TAN_H * d;

export const lerpHex = (a: string, b: string, t: number) => { const x = new THREE.Color(a), y = new THREE.Color(b); return '#' + x.lerp(y, Math.min(1, Math.max(0, t))).getHexString(); };

// ---------------------------------------------------------------- Cut: a painted picture hanging in the world
export const Cut: React.FC<{id: string; w: number; h: number; paint: (c: Ctx, W: number, H: number) => void; pos: V3; px?: number; rot?: number; order?: number; opacity?: number; flip?: boolean; fog?: boolean; rotY?: number; rotX?: number; add?: boolean}> =
  ({id, w, h, paint, pos, px = 1024, rot = 0, order = 3, opacity = 1, flip, fog = false, rotY = 0, rotX = 0, add}) => {
    const W = Math.round(px), H = Math.max(8, Math.round((px * h) / w)), t = useMemo(() => tex(id, W, H, paint), [id, W, H]);
    return <group position={pos} rotation={[rotX, rotY, rot]}><mesh renderOrder={order} scale={[flip ? -1 : 1, 1, 1]}><planeGeometry args={[w, h]} />
      <meshBasicMaterial map={t} transparent opacity={opacity} depthWrite={false} fog={fog} toneMapped={false} blending={add ? THREE.AdditiveBlending : THREE.NormalBlending} /></mesh></group>;
  };

// ---------------------------------------------------------------- Hat: small sharp specks
const starTex = () => tex('vt-star4', 64, 64, (c, W, H) => { c.clearRect(0, 0, W, H); const x = W / 2, y = H / 2, L = W * 0.48; P(c, [[x, y - L], [x + L * 0.2, y - L * 0.2], [x + L, y], [x + L * 0.2, y + L * 0.2], [x, y + L], [x - L * 0.2, y + L * 0.2], [x - L, y], [x - L * 0.2, y - L * 0.2]], '#ffffff'); });
const diaTex = () => tex('vt-dia', 32, 32, (c, W, H) => { c.clearRect(0, 0, W, H); P(c, [[W / 2, 1], [W - 3, H / 2], [W / 2, H - 1], [3, H / 2]], '#ffffff'); });
const shardTex = () => tex('vt-shard', 32, 32, (c, W, H) => { c.clearRect(0, 0, W, H); P(c, [[4, 2], [W - 2, H * 0.4], [W * 0.5, H - 2], [2, H * 0.7]], '#ffffff'); });
/** specks drifting through a box [x0,x1,y0,y1,z0,z1]. wind = [x, y] world units a second; spin makes them tumble (shards); each wraps round the box. */
export const Hat: React.FC<{f: number; box: [number, number, number, number, number, number]; n?: number; color?: string; colors?: string[]; size?: number; wind?: [number, number]; kind?: 'sao' | 'kim' | 'manh'; seed?: number; spin?: number; opacity?: number; order?: number; twinkle?: boolean}> =
  ({f, box, n = 40, color = '#ffffff', colors, size = 0.06, wind = [0.1, 0], kind = 'kim', seed = 1, spin = 0, opacity = 1, order = 8, twinkle}) => {
    const bui = useBui(), t = kind === 'sao' ? starTex() : kind === 'manh' ? shardTex() : diaTex();
    const P0 = useMemo(() => { const r = rnd(seed * 17 + 3); return Array.from({length: n}, () => [r(), r(), r(), 0.5 + r() * 1.1, r() * 6.28, 0.7 + r() * 0.7, Math.floor(r() * 99)] as const); }, [seed, n]);
    const W = box[1] - box[0], Hh = box[3] - box[2], s = f / 24;
    return <>{P0.map(([x, y, z, k, ph, sp, ci], i) => {
      const px = box[0] + ((((x * W + wind[0] * sp * s) % W) + W) % W), py = box[2] + ((((y * Hh + wind[1] * sp * s) % Hh) + Hh) % Hh);
      const tw = twinkle ? 0.55 + 0.45 * Math.sin(f * 0.25 * sp + ph) : 1, col0 = colors ? colors[ci % colors.length] : color, col = kind === 'kim' ? bui.mau(col0, ci) : col0;
      if (kind === 'kim' && !bui.giu(i, n, seed)) return null;
      return <mesh key={i} renderOrder={order} position={[px, py, box[4] + z * (box[5] - box[4])]} rotation={[0, 0, spin ? ph + f * spin * sp : (kind === 'manh' ? ph : 0)]} scale={[size * k * tw, size * k * tw, 1]}>
        <planeGeometry /><meshBasicMaterial map={t} color={col} transparent opacity={opacity * tw} depthWrite={false} fog={false} toneMapped={false} /></mesh>;
    })}</>;
  };

// ---------------------------------------------------------------- flat painters
/** an irregular straight-edged blob (cut-paper): n corners round an ellipse, each pushed in or out by `jag` */
export const blobPts = (cx: number, cy: number, rx: number, ry: number, n: number, jag: number, r: () => number, rot = 0): number[][] =>
  Array.from({length: n}, (_, i) => { const a = rot + (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 2 * jag; return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; });
/** a sweeping band from (x0,y0) to (x1,y1), thick `th`, with a jagged edge of `step` px segments */
export const bandPts = (x0: number, y0: number, x1: number, y1: number, th: number, jag: number, r: () => number, step = 70): number[][] => {
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(3, Math.round(L / step)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L, up: number[][] = [], dn: number[][] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, bell = 0.35 + 0.65 * Math.sin(Math.PI * t), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; up.push([x + nx * th * bell * (0.5 + r() * jag), y + ny * th * bell * (0.5 + r() * jag)]); dn.push([x - nx * th * bell * (0.5 + r() * jag), y - ny * th * bell * (0.5 + r() * jag)]); }
  return [...up, ...dn.reverse()];
};
const disc = (c: Ctx, x: number, y: number, rad: number, f: string) => { c.beginPath(); c.arc(x, y, rad, 0, 7); c.fillStyle = f; c.fill(); };
const star4 = (c: Ctx, x: number, y: number, L: number, f: string) => P(c, [[x, y - L], [x + L * 0.2, y - L * 0.2], [x + L, y], [x + L * 0.2, y + L * 0.2], [x, y + L], [x - L * 0.2, y + L * 0.2], [x - L, y], [x - L * 0.2, y - L * 0.2]], f);

// ---------------------------------------------------------------- SPACE: the sky layers (screen units 1600 x 900 painted on `Plate`)
export type SpacePal = {base: [string, string, string, string]; neb: [string, string, string][]; star: string[]};
export const SPACE_PAL: SpacePal = {
  base: ['#3a4aa0', '#3f4fa6', '#4655ae', '#4b58b2'],
  neb: [['#4b5bb6', '#5a63c2', '#6a70cc'], ['#5a4ab0', '#6a58c0', '#7c68cc'], ['#3f6cb4', '#4f7cc4', '#6490d0'], ['#7a4cb0', '#8d5cc0', '#a070cc']],
  star: ['#ffffff', '#cfe0ff', '#ffe9c2', '#ffd0e8'],
};
/** the far sky: banded indigo, two thousand small stars, four-point stars */
export const paintSpaceBase = (seed: number, pal: SpacePal = SPACE_PAL) => (c: Ctx) => {
  const r = rnd(seed), X0 = -520, X1 = 2120, Y0 = -300, Y1 = 1200;
  pal.base.forEach((col, i) => { c.fillStyle = col; const h = (Y1 - Y0) / pal.base.length; c.fillRect(X0, Y0 + h * i, X1 - X0, h + 2); });
  // jagged seams between the bands, so they read as cut paper laid over paper
  pal.base.forEach((col, i) => { if (!i) return; const y = Y0 + ((Y1 - Y0) / pal.base.length) * i, pts: number[][] = [[X0, y]]; for (let x = X0; x <= X1; x += 90) pts.push([x, y + (r() - 0.5) * 46]); pts.push([X1, y], [X1, Y1], [X0, Y1]); P(c, pts, col); });
  for (let k = 0; k < 1500; k++) { c.globalAlpha = 0.35 + r() * 0.6; c.fillStyle = pal.star[Math.floor(r() * pal.star.length)]; const q = r() < 0.92 ? 1.6 + r() * 1.6 : 3.6; c.fillRect(X0 + r() * (X1 - X0), Y0 + r() * (Y1 - Y0), q, q); }
  c.globalAlpha = 1;
  for (let k = 0; k < 46; k++) star4(c, X0 + r() * (X1 - X0), Y0 + r() * (Y1 - Y0), 9 + r() * 14, pal.star[Math.floor(r() * 3)]);
};
/** nebula banks: broad bands of three layered tones, lightest on top, sharp edges, with a few paler cut islands inside */
export const paintNebula = (seed: number, bands: number[][], pal: SpacePal = SPACE_PAL) => (c: Ctx) => {
  const r = rnd(seed);
  bands.forEach(([x0, y0, x1, y1, th, ti], bi) => {
    const tones = pal.neb[ti % pal.neb.length];
    tones.forEach((col, k) => { const q = 1 - k * 0.28; P(c, bandPts(x0, y0 - k * 14, x1, y1 - k * 14, th * q, 0.9, r, 90), col); });
    for (let j = 0; j < 4; j++) { const t = 0.15 + 0.7 * r(), cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t - 20, q = th * (0.14 + r() * 0.12); P(c, blobPts(cx, cy, q * 1.8, q, 7, 0.35, r, r()), tones[2]); }
    void bi;
  });
  // a handful of bright four-point stars sitting on the nebula
  for (let k = 0; k < 22; k++) { const b = bands[k % bands.length], t = r(); star4(c, b[0] + (b[2] - b[0]) * t + (r() - 0.5) * 80, b[1] + (b[3] - b[1]) * t + (r() - 0.5) * 80, 8 + r() * 16, '#fff7e4'); }
};
/** a loose scatter of bright stars with long cross arms (the near star layer) */
export const paintStarsNear = (seed: number, n = 40) => (c: Ctx) => { const r = rnd(seed); for (let k = 0; k < n; k++) { const x = -300 + r() * 2200, y = -150 + r() * 1200, L = 7 + r() * 18; star4(c, x, y, L, r() < 0.3 ? '#ffe8b8' : '#ffffff'); if (r() < 0.25) { c.fillStyle = '#ffffff'; c.fillRect(x - L * 1.8, y - 0.8, L * 3.6, 1.6); c.fillRect(x - 0.8, y - L * 1.8, 1.6, L * 3.6); } } };

// ---------------------------------------------------------------- planets (flat discs, cut-paper)
const clipDisc = (c: Ctx, cx: number, cy: number, R: number, fn: () => void) => { c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip(); fn(); c.restore(); };
/** a planet with bands and a ring (the ring's far half behind, its near half in front, a gap in it). square canvas, planet at the middle */
export const paintPlanetRing = (c: Ctx, W: number, H: number, pal: {a: string; b: string; c: string; ring: string; ring2: string} = {a: '#d9a46a', b: '#b9784c', c: '#efc88e', ring: '#e9d6a8', ring2: '#b89a6c'}) => {
  const cx = W / 2, cy = H / 2, R = W * 0.25, r = rnd(5), ringP = (rx: number, ry: number, half: 'back' | 'front', col: string) => { c.beginPath(); c.ellipse(cx, cy, rx, ry, -0.22, half === 'back' ? Math.PI : 0, half === 'back' ? Math.PI * 2 : Math.PI); c.ellipse(cx, cy, rx * 0.86, ry * 0.86, -0.22, half === 'back' ? Math.PI * 2 : Math.PI, half === 'back' ? Math.PI : 0, true); c.closePath(); c.fillStyle = col; c.fill(); };
  ringP(W * 0.46, W * 0.12, 'back', pal.ring2); ringP(W * 0.41, W * 0.105, 'back', pal.ring);
  disc(c, cx, cy, R, pal.a);
  clipDisc(c, cx, cy, R, () => {
    for (let i = 0; i < 7; i++) { const y = cy - R + (i + 0.3) * (R * 2 / 7), h = R * (0.1 + r() * 0.1); const pts: number[][] = [[cx - R, y]]; for (let x = cx - R; x <= cx + R; x += R / 3) pts.push([x, y + (r() - 0.5) * R * 0.05]); P(c, [...pts, [cx + R, y + h], [cx - R, y + h]], i % 3 === 0 ? pal.b : i % 3 === 1 ? pal.c : pal.a); }
    P(c, [[cx + R * 0.3, cy - R], [cx + R, cy - R], [cx + R, cy + R], [cx + R * 0.05, cy + R], [cx + R * 0.45, cy + R * 0.2], [cx + R * 0.36, cy - R * 0.4]], 'rgba(40,30,80,0.34)');
  });
  ringP(W * 0.46, W * 0.12, 'front', pal.ring2); ringP(W * 0.41, W * 0.105, 'front', pal.ring);
};
/** a cratered rocky ball; the lit side left, a sharp terminator on the right */
export const paintPlanetRock = (c: Ctx, W: number, H: number, pal: {lit: string; mid: string; dark: string; crater: string; shade: string} = {lit: '#d8805a', mid: '#bd6448', dark: '#8e4638', crater: '#a2523d', shade: 'rgba(48,24,70,0.42)'}) => {
  const cx = W / 2, cy = H / 2, R = W * 0.42, r = rnd(11);
  disc(c, cx, cy, R, pal.mid);
  clipDisc(c, cx, cy, R, () => {
    P(c, [[cx - R, cy - R], [cx - R * 0.1, cy - R], [cx - R * 0.35, cy - R * 0.2], [cx - R * 0.05, cy + R * 0.4], [cx - R * 0.3, cy + R], [cx - R, cy + R]], pal.lit);
    for (let k = 0; k < 9; k++) { const a = r() * 6.28, d = R * (0.1 + r() * 0.75), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, q = R * (0.06 + r() * 0.11); P(c, blobPts(x, y, q, q * 0.8, 8, 0.12, r), pal.crater); P(c, blobPts(x - q * 0.2, y - q * 0.18, q * 0.7, q * 0.55, 8, 0.12, r), pal.dark); }
    P(c, [[cx + R * 0.35, cy - R], [cx + R, cy - R], [cx + R, cy + R], [cx + R * 0.1, cy + R], [cx + R * 0.52, cy + R * 0.3], [cx + R * 0.42, cy - R * 0.4]], pal.shade);
  });
};
export const paintMoonPaper = (c: Ctx, W: number, H: number, col = '#e6dfd0', crater = '#c9bfae') => {
  const cx = W / 2, cy = H / 2, R = W * 0.42, r = rnd(23); disc(c, cx, cy, R, col);
  clipDisc(c, cx, cy, R, () => { for (let k = 0; k < 6; k++) { const a = r() * 6.28, d = R * (0.1 + r() * 0.7), q = R * (0.07 + r() * 0.1); P(c, blobPts(cx + Math.cos(a) * d, cy + Math.sin(a) * d, q, q * 0.8, 7, 0.14, r), crater); } P(c, [[cx + R * 0.38, cy - R], [cx + R, cy - R], [cx + R, cy + R], [cx + R * 0.12, cy + R], [cx + R * 0.5, cy + R * 0.2], [cx + R * 0.44, cy - R * 0.4]], 'rgba(60,50,110,0.38)'); });
};
/** BATTLEWORLD from space: a ball sewn from different places. Patches (ice, red desert, dark forest, violet swamp, a grid city) each a flat polygon, glowing seams between them, the rim broken with floating fragments */
export const paintBattleworldBall = (c: Ctx, W: number, H: number) => {
  const cx = W / 2, cy = H / 2, R = W * 0.36, r = rnd(31);
  // fragments first (they float off the rim)
  [[-0.9, -0.62, 0.1], [0.98, -0.42, 0.075], [0.86, 0.66, 0.09], [-0.78, 0.8, 0.065], [0.2, -1.06, 0.06], [-1.05, 0.12, 0.055]].forEach(([a, b, q], i) => { const x = cx + a * R, y = cy + b * R; P(c, blobPts(x, y, R * q * 1.4, R * q, 6, 0.3, r, i), ['#dfe9f2', '#c9663f', '#3b5a48', '#6a4a9a', '#9aa0b0', '#d9a46a'][i]); P(c, blobPts(x - R * 0.02, y - R * 0.02, R * q * 0.9, R * q * 0.6, 6, 0.3, r, i), 'rgba(255,255,255,0.28)'); });
  disc(c, cx, cy, R, '#6a4a9a');
  const patches: [string, string, number[][]][] = [
    ['#dfe9f2', '#b8cadc', [[-1, -1], [-0.1, -1], [-0.3, -0.35], [-0.7, -0.1], [-1, -0.05]]],
    ['#c9663f', '#a84c34', [[-0.1, -1], [1, -1], [1, -0.2], [0.35, -0.3], [0.1, -0.55], [-0.3, -0.35]]],
    ['#3b5a48', '#2c4838', [[-1, -0.05], [-0.7, -0.1], [-0.25, 0.35], [-0.45, 1], [-1, 1]]],
    ['#6a4a9a', '#523a82', [[-0.3, -0.35], [0.1, -0.55], [0.35, -0.3], [0.2, 0.3], [-0.25, 0.35], [-0.7, -0.1]]],
    ['#d9a46a', '#b8844c', [[0.35, -0.3], [1, -0.2], [1, 1], [0.4, 1], [0.2, 0.3]]],
    ['#8e96a8', '#6c748a', [[-0.25, 0.35], [0.2, 0.3], [0.4, 1], [-0.45, 1]]],
  ];
  clipDisc(c, cx, cy, R, () => {
    patches.forEach(([a, b, pts]) => { const q = pts.map(([x, y]) => [cx + x * R, cy + y * R]); P(c, q, a); P(c, [q[0], q[1], q[2], [(q[0][0] + q[2][0]) / 2 + R * 0.12, (q[0][1] + q[2][1]) / 2 + R * 0.1]], b); });
    // the city patch: a grid of squares in the lower middle, a few tall ones; a forest of dark triangles; red mesas
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) P(c, [[cx - R * 0.2 + i * R * 0.1, cy + R * 0.45 + j * R * 0.1], [cx - R * 0.12 + i * R * 0.1, cy + R * 0.45 + j * R * 0.1], [cx - R * 0.12 + i * R * 0.1, cy + R * 0.53 + j * R * 0.1], [cx - R * 0.2 + i * R * 0.1, cy + R * 0.53 + j * R * 0.1]], (i + j) % 2 ? '#aab2c4' : '#5a6078');
    for (let k = 0; k < 9; k++) { const x = cx - R * 0.9 + r() * R * 0.6, y = cy + R * 0.15 + r() * R * 0.7, q = R * 0.06; P(c, [[x, y - q * 1.6], [x + q, y + q], [x - q, y + q]], '#1f3a2c'); }
    for (let k = 0; k < 5; k++) { const x = cx + R * 0.1 + r() * R * 0.7, y = cy - R * 0.9 + r() * R * 0.4, q = R * 0.07; P(c, [[x - q * 1.4, y + q], [x - q, y - q * 0.5], [x + q, y - q * 0.5], [x + q * 1.4, y + q]], '#8e3a28'); }
    P(c, [[cx + R * 0.36, cy - R], [cx + R, cy - R], [cx + R, cy + R], [cx + R * 0.05, cy + R], [cx + R * 0.5, cy + R * 0.3], [cx + R * 0.44, cy - R * 0.4]], 'rgba(36,20,70,0.36)');
    // seams: glowing violet stitches along the borders
    patches.forEach(([, , pts]) => { c.strokeStyle = '#f4d8ff'; c.lineWidth = R * 0.016; c.setLineDash([R * 0.05, R * 0.03]); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(cx + x * R, cy + y * R) : c.moveTo(cx + x * R, cy + y * R))); c.closePath(); c.stroke(); c.setLineDash([]); });
  });
  c.strokeStyle = '#d9b8ff'; c.lineWidth = R * 0.02; c.beginPath(); c.arc(cx, cy, R * 1.025, 0.2, 2.4); c.stroke();
};
/** a faceted rock chunk, two or three tones; light from the left */
export const paintChunk = (seed: number, tones: [string, string, string] = ['#a8a4bc', '#85819e', '#615e7c']) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), cx = W / 2, cy = H / 2, n = 7 + Math.floor(r() * 3), pts = Array.from({length: n}, (_, i) => { const a = (i / n) * 6.283 + r() * 0.3, k = 0.62 + r() * 0.38; return [cx + Math.cos(a) * W * 0.46 * k, cy + Math.sin(a) * H * 0.42 * k]; });
  P(c, pts, tones[1]); P(c, [pts[0], pts[1], [cx + W * 0.02, cy - H * 0.04], pts[n - 1]].concat(n > 7 ? [pts[n - 2]] : []), tones[0]);
  P(c, [[cx + W * 0.02, cy - H * 0.04], pts[Math.floor(n / 2)], pts[Math.floor(n / 2) + 1], pts[(Math.floor(n / 2) + 2) % n]], tones[2]);
};
/** the ship of Reed's party: a silver rocket seen from the side, red nose and fins (small = white-grey, for the plain rocket of chapter 12). Nose to the RIGHT. */
export const paintTau = (small = false) => (c: Ctx, W: number, H: number) => {
  const y = H / 2, S = small ? ['#e9ecf2', '#c7ccd8', '#9ea6b8'] : ['#d6dce8', '#aab4c8', '#7e8aa4'], R = small ? ['#c9ced8', '#a1a8b8'] : ['#d63a34', '#a02824'];
  // flame, two layers
  P(c, [[W * 0.2, y - H * 0.08], [W * 0.02, y - H * 0.02], [W * 0.1, y + H * 0.04], [W * 0.02, y + H * 0.1], [W * 0.2, y + H * 0.1]], '#ff9a3c'); P(c, [[W * 0.2, y - H * 0.05], [W * 0.09, y], [W * 0.2, y + H * 0.06]], '#ffe27a');
  // far fins (dark), body, near fins
  P(c, [[W * 0.24, y - H * 0.1], [W * 0.14, y - H * 0.4], [W * 0.38, y - H * 0.12]], R[1]); P(c, [[W * 0.24, y + H * 0.1], [W * 0.14, y + H * 0.4], [W * 0.38, y + H * 0.12]], R[1]);
  P(c, [[W * 0.2, y - H * 0.13], [W * 0.62, y - H * 0.16], [W * 0.84, y - H * 0.05], [W * 0.9, y], [W * 0.84, y + H * 0.05], [W * 0.62, y + H * 0.16], [W * 0.2, y + H * 0.13]], S[1]);
  P(c, [[W * 0.2, y - H * 0.13], [W * 0.62, y - H * 0.16], [W * 0.84, y - H * 0.05], [W * 0.9, y], [W * 0.5, y - H * 0.02], [W * 0.2, y - H * 0.02]], S[0]);
  P(c, [[W * 0.2, y + H * 0.13], [W * 0.5, y + H * 0.15], [W * 0.9, y], [W * 0.5, y + H * 0.03], [W * 0.2, y + H * 0.04]], S[2]);
  P(c, [[W * 0.74, y - H * 0.145], [W * 0.84, y - H * 0.05], [W * 0.9, y], [W * 0.84, y + H * 0.05], [W * 0.74, y + H * 0.145]], R[0]);
  P(c, [[W * 0.28, y - H * 0.13], [W * 0.18, y - H * 0.46], [W * 0.46, y - H * 0.15]], R[0]); P(c, [[W * 0.28, y + H * 0.13], [W * 0.18, y + H * 0.46], [W * 0.46, y + H * 0.15]], R[1]);
  for (let i = 0; i < 4; i++) { const x = W * (0.36 + i * 0.1); disc(c, x, y - H * 0.02, H * 0.045, '#25304e'); disc(c, x - H * 0.01, y - H * 0.03, H * 0.022, '#9fd4ff'); }
};
/** cosmic rays: long thin cut streaks in white, magenta and cyan, slanting down-left to up-right (screen units) */
export const paintTia = (seed: number, n = 34) => (c: Ctx) => { const r = rnd(seed); for (let k = 0; k < n; k++) { const x = -200 + r() * 1900, y = -100 + r() * 1100, L = 160 + r() * 520, w = 2 + r() * 5, a = -0.5 + (r() - 0.5) * 0.1, col = ['#ffffff', '#ff7ad8', '#7affff', '#ffe27a'][Math.floor(r() * 4)]; const dx = Math.cos(a) * L, dy = Math.sin(a) * L; P(c, [[x, y], [x + dx * 0.5, y + dy * 0.5 - w], [x + dx, y + dy], [x + dx * 0.5, y + dy * 0.5 + w]], col); } };

// ---------------------------------------------------------------- GALACTUS: a huge cut-paper panel, drawn after the comic's design (a stern giant in violet and blue armour,
// a helmet with a tall central crest and two great curved horns, a pale lilac-tan face with heavy brows). No label with his name is written anywhere.
const GP = {hl: '#8a62c8', hm: '#6a44a8', hd: '#46308a', bl: '#4a62c0', bd: '#2f3f8e', mg: '#b8409a', gold: '#e6b84a', skL: '#d9b4a6', skM: '#bb8c92', skD: '#8a6478', ink: '#241838'};
const drawHead = (c: Ctx, cx: number, cy: number, s: number) => {
  const T = (pts: number[][]) => pts.map(([x, y]) => [cx + x * s, cy + y * s]), Q = (pts: number[][], f: string) => P(c, T(pts), f), M = (pts: number[][]) => pts.map(([x, y]) => [-x, y]);
  // horns and crest behind everything
  const hornL = [[-150, -150], [-240, -200], [-350, -300], [-470, -430], [-590, -610], [-540, -420], [-450, -290], [-340, -190], [-200, -100]];
  Q(M(hornL), GP.hd); Q(hornL, GP.hm); Q([[-150, -150], [-240, -200], [-350, -300], [-470, -430], [-590, -610], [-520, -380], [-420, -260], [-300, -170]], GP.hl);
  for (const k of [0.3, 0.5, 0.7]) { const a = [-170 - 480 * k, -150 - 420 * k * k - 40 * k], b = [-170 - 480 * k - 56, -150 - 420 * k * k - 40 * k + 40]; Q(M([[a[0], a[1]], [b[0], b[1]], [b[0] + 28, b[1] + 70], [a[0] + 28, a[1] + 70]]), GP.hd); Q([a, b, [b[0] + 28, b[1] + 70], [a[0] + 28, a[1] + 70]], GP.hd); }
  Q([[-60, -200], [-40, -420], [0, -640], [40, -420], [60, -200]], GP.hm); Q([[-60, -200], [-40, -420], [0, -640], [-2, -300], [-8, -200]], GP.hl); Q([[0, -640], [40, -420], [60, -200], [8, -200]], GP.hd);
  // the helmet cap and its band
  Q([[-215, -20], [-205, -170], [-120, -250], [0, -285], [120, -250], [205, -170], [215, -20], [150, -70], [0, -100], [-150, -70]], GP.hm);
  Q([[-215, -20], [-205, -170], [-120, -250], [0, -285], [-10, -100], [-150, -70]], GP.hl); Q([[0, -285], [120, -250], [205, -170], [215, -20], [150, -70], [0, -100]], GP.hd);
  Q([[-150, -70], [0, -100], [150, -70], [140, -40], [0, -72], [-140, -40]], GP.gold); Q([[-22, -84], [0, -118], [22, -84], [0, -66]], GP.mg);
  // side guards and the face
  Q([[-215, -20], [-160, -60], [-170, 150], [-130, 210], [-205, 150]], GP.hd); Q(M([[-215, -20], [-160, -60], [-170, 150], [-130, 210], [-205, 150]]), GP.hd);
  Q([[-160, -60], [160, -60], [168, 70], [140, 175], [70, 245], [0, 262], [-70, 245], [-140, 175], [-168, 70]], GP.skL);
  Q([[0, -60], [160, -60], [168, 70], [140, 175], [70, 245], [0, 262]], GP.skM); Q([[100, 40], [168, 70], [140, 175], [70, 245], [90, 150]], GP.skD);
  Q([[-160, -60], [160, -60], [150, 8], [0, 26], [-150, 8]], GP.skM); Q([[-150, 8], [0, 26], [150, 8], [140, 30], [0, 44], [-140, 30]], GP.skD);   // the heavy brow
  Q([[-120, 34], [-26, 54], [-28, 72], [-112, 62]], GP.ink); Q([[120, 34], [26, 54], [28, 72], [112, 62]], GP.ink); Q([[-130, 28], [-20, 46], [-24, 56], [-128, 40]], GP.skD); Q([[130, 28], [20, 46], [24, 56], [128, 40]], GP.skD); Q([[-104, 44], [-42, 56], [-44, 66], [-100, 58]], '#9a86c0'); Q([[104, 44], [42, 56], [44, 66], [100, 58]], '#9a86c0');                                   // the dark eye slits
  Q([[-14, 60], [14, 60], [24, 150], [0, 168], [-24, 150]], GP.skM); Q([[0, 60], [14, 60], [24, 150], [0, 168]], GP.skD);                            // nose
  Q([[-74, 208], [0, 194], [74, 208], [62, 220], [0, 206], [-62, 220]], GP.ink); Q([[-120, 118], [-70, 150], [-66, 196], [-110, 170]], GP.skM); Q([[120, 118], [70, 150], [66, 196], [110, 170]], GP.skD); Q([[-16, 232], [16, 232], [0, 252]], GP.skD);                                  // mouth, chin
  Q([[-168, 70], [-130, 100], [-120, 175], [-140, 175]], GP.skD);
};
/** Galactus from the chest up, in a canvas 1600 wide: the head near the top, the huge shoulders, the chest plate and arms going off the bottom */
export const paintGalactusNguc = (c: Ctx, W: number, H: number) => {
  c.translate(0, 510);   // canvas 1600 x 2000: the body is moved down so the big head (scale 1.3, centre y 900) has the horns above it
  const cx = W / 2, T = (pts: number[][]) => pts.map(([x, y]) => [cx + x, y]), M = (pts: number[][]) => pts.map(([x, y]) => [-x, y]), Q = (pts: number[][], f: string) => P(c, T(pts), f);
  const body = (kind: 'L' | 'R') => { const pts = (p: number[][]) => (kind === 'L' ? p : M(p)), [A, B, C] = kind === 'L' ? [GP.bl, GP.bd, GP.hl] : [GP.bd, '#222e72', GP.hm];
    // the arm hanging down, a great bracer, and the pauldron of three ridged plates
    Q(pts([[-360, 900], [-470, 980], [-540, 1500], [-250, 1500], [-250, 1000]]), B); Q(pts([[-360, 900], [-470, 980], [-500, 1250], [-380, 1250]]), A); Q(pts([[-540, 1260], [-250, 1260], [-250, 1360], [-545, 1360]]), GP.gold);
    Q(pts([[-170, 820], [-380, 760], [-640, 800], [-740, 950], [-690, 1130], [-440, 1010], [-190, 920]]), B); Q(pts([[-170, 820], [-380, 760], [-640, 800], [-740, 950], [-600, 900], [-380, 880], [-190, 880]]), C);
    Q(pts([[-190, 880], [-380, 850], [-600, 900], [-640, 960], [-420, 940], [-195, 960]]), A); Q(pts([[-200, 960], [-430, 960], [-690, 1060], [-700, 1110], [-430, 1030], [-205, 1020]]), GP.bd);
    Q(pts([[-250, 1000], [-250, 1500], [-90, 1500], [-90, 980]]), A);
  };
  body('R'); body('L');
  // chest plate: dark blue-violet, a central ridge, magenta chevrons, the belt of squares at the bottom
  Q([[-200, 800], [200, 800], [250, 1020], [240, 1500], [-240, 1500], [-250, 1020]], GP.bd); Q([[-200, 800], [0, 800], [0, 1500], [-240, 1500], [-250, 1020]], GP.bl);
  Q([[-170, 860], [0, 900], [170, 860], [160, 940], [0, 990], [-160, 940]], GP.hm); Q([[-170, 860], [0, 900], [0, 990], [-160, 940]], GP.hl);
  Q([[-150, 1050], [0, 1110], [150, 1050], [140, 1130], [0, 1200], [-140, 1130]], GP.mg); Q([[-150, 1050], [0, 1110], [0, 1200], [-140, 1130]], '#d65cb4');
  Q([[-4, 800], [4, 800], [4, 1500], [-4, 1500]], GP.ink);
  for (let i = -3; i <= 2; i++) Q([[i * 80 + 8, 1330], [i * 80 + 72, 1330], [i * 80 + 72, 1400], [i * 80 + 8, 1400]], i % 2 ? GP.gold : GP.hm);
  // neck, collar plates
  Q([[-90, 600], [90, 600], [140, 800], [-140, 800]], GP.skD); Q([[-90, 600], [0, 600], [0, 800], [-140, 800]], GP.skM);
  Q([[-250, 770], [-90, 690], [-90, 820], [-230, 900]], GP.hm); Q([[250, 770], [90, 690], [90, 820], [230, 900]], GP.hd); Q([[-250, 770], [-90, 690], [-100, 730], [-240, 800]], GP.hl);
  c.translate(0, -510); drawHead(c, cx, 900, 1.3);
  void H;
};
/** the head alone, big: for the close shot (the horns are cut by the top edge). The same face on a canvas 1600 wide, the head at the middle */
export const paintGalactusMat = (c: Ctx, W: number, H: number) => { drawHead(c, W * 0.5, H * 0.55, 2.0); };
/** one huge hand reaching in from the upper right, palm to the viewer, fingers pointing down-left (two gold bands on the wrist, a sleeve of violet armour). Drawn along +x then turned. */
export const paintGalactusTay = (c: Ctx, W: number, H: number) => {
  c.translate(W * 0.55, H * 0.46); c.rotate(-0.62); c.scale(0.92, 0.92); c.translate(-120, 0);
  const Q = (pts: number[][], f: string) => P(c, pts, f);
  Q([[1100, -230], [420, -170], [420, 170], [1100, 250]], GP.bd); Q([[1100, -230], [420, -170], [420, 0], [1100, 0]], GP.bl); Q([[760, -200], [560, -176], [560, 176], [760, 200]], GP.hm);
  Q([[560, -180], [440, -168], [440, 168], [560, 180]], GP.gold); Q([[680, -192], [640, -188], [640, 188], [680, 192]], GP.gold);
  // the palm: broad, light above and shaded below, a crease across it
  Q([[440, -168], [440, 168], [200, 220], [90, 30], [180, -230]], GP.skM); Q([[440, -168], [440, 10], [150, 10], [180, -230]], GP.skL); Q([[440, 168], [200, 220], [90, 30], [160, 90], [420, 100]], GP.skD);
  Q([[340, -80], [140, -30], [150, -14], [340, -66]], GP.skD); Q([[300, 70], [150, 90], [160, 104], [300, 84]], GP.skD);
  // four fingers: two cut segments each, a dark crease at the knuckle, the underside shaded, a blunt cut tip
  const fin = (y0: number, len: number, spread: number, w: number) => { const x1 = 90 - len * 0.5, x2 = 90 - len, ym = y0 + spread * 0.5, ye = y0 + spread;
    Q([[200, y0 - w], [x1, ym - w * 0.95], [x1, ym + w * 0.95], [200, y0 + w]], GP.skL); Q([[x1, ym - w * 0.9], [x2, ye - w * 0.7], [x2 - 24, ye + w * 0.3], [x2 - 6, ye + w * 0.8], [x1, ym + w * 0.9]], GP.skL);
    Q([[200, y0 + w * 0.2], [x1, ym + w * 0.2], [x1, ym + w * 0.95], [200, y0 + w]], GP.skM); Q([[x1, ym + w * 0.2], [x2 - 12, ye + w * 0.2], [x2 - 6, ye + w * 0.8], [x1, ym + w * 0.9]], GP.skM);
    Q([[x1 - 7, ym - w], [x1 + 9, ym - w], [x1 + 9, ym + w], [x1 - 7, ym + w]], GP.skD); };
  fin(-150, 470, -150, 46); fin(-50, 540, -50, 48); fin(50, 510, 50, 47); fin(150, 410, 150, 44);
  // the thumb, pushed out to the upper left from the palm's heel
  Q([[350, -170], [220, -320], [140, -470], [70, -500], [40, -440], [100, -310], [200, -180]], GP.skL); Q([[350, -170], [220, -320], [140, -470], [70, -500], [96, -380], [250, -170]], GP.skM); Q([[40, -440], [70, -500], [140, -470], [96, -440]], GP.skD);
};
/** the eyes of Galactus lit (white-hot slits and a few cut rays), painted where `paintGalactusNguc` (dy 520, s 1) or `paintGalactusMat` (W/2, H*.55, s 2.55) put them; laid over the dark panel, opacity = how lit */
export const paintGalactusMat2 = (cx: number, cy: number, s: number) => (c: Ctx) => {
  const Q = (pts: number[][], f: string) => P(c, pts.map(([x, y]) => [cx + x * s, cy + y * s]), f);
  [1, -1].forEach((m) => { Q([[m * 126, 30], [m * 20, 52], [m * 24, 76], [m * 116, 66]], '#fff3cf'); Q([[m * 112, 40], [m * 36, 56], [m * 40, 68], [m * 106, 60]], '#ffffff'); Q([[m * 140, 52], [m * 340, 6], [m * 156, 72]], 'rgba(255,240,200,0.85)'); Q([[m * 70, 14], [m * 96, -90], [m * 104, 26]], 'rgba(255,240,200,0.75)'); });
};

// ---------------------------------------------------------------- THE SHELL round the Earth (chapter 12): same centre, 6-8 % wider than the globe, a faint hexagon lattice that follows the curve, bright at the rim.
/** hexagon lattice on a sphere seen from the front, canvas square, sphere radius = W*0.4 (the shell). Cells are laid on a (lon, lat) grid and projected orthographically so they bend and shrink toward the rim. */
export const paintMang = (c: Ctx, W: number, H: number) => {
  const R = W * 0.4, cx = W / 2, cy = H / 2, step = 0.2, pr = (lo: number, la: number): number[] | null => { const x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo); return z < 0 ? null : [cx + x * R, cy - y * R]; };
  c.fillStyle = 'rgba(150,215,255,0.07)'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
  for (let la = -1.4; la <= 1.4; la += step * 0.87) { const row = Math.round(la / (step * 0.87)); for (let lo = -1.6 + (row % 2 ? step / 2 : 0); lo <= 1.6; lo += step) {
    const pts: (number[] | null)[] = Array.from({length: 6}, (_, k) => { const a = (k / 6) * 6.283 + 0.5236, r = step * 0.55; return pr(lo + (r * Math.cos(a)) / Math.max(0.2, Math.cos(la)), la + r * Math.sin(a) * 0.87); });
    if (pts.some((q) => !q)) continue; const mid = pr(lo, la)!, rim = Math.hypot(mid[0] - cx, mid[1] - cy) / R, a = 0.2 + 0.65 * Math.pow(rim, 3);
    c.strokeStyle = `rgba(200,240,255,${a})`; c.lineWidth = 2 + 2.5 * rim; c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q![0], q![1]) : c.moveTo(q![0], q![1]))); c.closePath(); c.stroke(); } }
  [[1, 0.9, 7], [1.04, 0.35, 4]].forEach(([k, a, w]) => { c.strokeStyle = `rgba(210,245,255,${a})`; c.lineWidth = w as number; c.beginPath(); c.arc(cx, cy, R * (k as number), 0, 7); c.stroke(); });
};
/** where a blow lands on the shell: a flash of cut rays at angle `ang` (degrees, round the disc) at fraction `rim` of the radius, and a crack running out along straight lattice-like segments up to `reach` (0..1) */
export const paintMangHit = (ang: number, rim: number, reach: number, flash: number) => (c: Ctx, W: number, H: number) => {
  const R = W * 0.4, cx = W / 2, cy = H / 2, a = (ang * Math.PI) / 180, hx = cx + Math.cos(a) * R * rim, hy = cy - Math.sin(a) * R * rim, r = rnd(Math.round(ang) + 7);
  if (reach > 0) for (let k = 0; k < 9; k++) { let x = hx, y = hy, d = (k / 9) * 6.283 + r() * 0.4; c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y);
    const n = Math.floor(8 * reach); for (let j = 0; j < n; j++) { d += Math.round((r() - 0.5) * 3) * 1.047; x += Math.cos(d) * R * 0.07; y += Math.sin(d) * R * 0.07; if (Math.hypot(x - cx, y - cy) > R * 0.99) break; c.lineTo(x, y); } c.stroke(); }
  if (flash > 0) { c.globalAlpha = Math.min(1, flash); for (let k = 0; k < 8; k++) { const d = (k / 8) * 6.283, L = R * (k % 2 ? 0.1 : 0.2); P(c, [[hx + Math.cos(d - 0.15) * 8, hy + Math.sin(d - 0.15) * 8], [hx + Math.cos(d) * L, hy + Math.sin(d) * L], [hx + Math.cos(d + 0.15) * 8, hy + Math.sin(d + 0.15) * 8]], '#ffffff'); } c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(hx, hy, R * 0.025, 0, 7); c.fill(); }
};
