import React, {useMemo} from 'react';
import {Poly, Rect, Disc, Stroke, Flame, Smoke, ClothSway, refSpace, bezier, circlePts, rand, deg, FPS} from '../../../../kit';
import type {Pt, V3, RefSpace, CamRig, CamPose} from '../../../../kit';
import {COLORS, MOUNTAINS, PINES, SNOW} from '../../shared';

/* MOUNTAIN CAMP: the one new hub of episode doom-b (group B). Built from flat cards only, no generated art.
 * Everything is laid out in FRAME PIXELS OF FRAME 0 (1280 x 720, y UP from the bottom edge inside a <Layer>) on
 * planes with a real world depth, so the camera gives true parallax and nothing needs light (crisp, flat, no blur,
 * no glow, no halo; bible section 8). Each prop is a small pile of 2-3 tone polygons: planks, hoops, seams, stitched
 * patches, snow caps. Two states: `dusk` (S7, S8) and `night` (S10, the night he was born). */

// ------------------------------------------------------------------------------------------------ space and helpers
export const CAM0 = {pos: [0, 0, 20] as V3, look: [0, 0, 0] as V3, fov: 30};
export const M: RefSpace = refSpace({cam: CAM0.pos, fov: CAM0.fov});
/** frame pixel y (down) -> layer y (up) */
export const Y = (y: number) => 720 - y;
/** world position and world length of something given in frame pixels at depth z (for puppets, which live in world units) */
export const wpos = (x: number, yDown: number, z: number): V3 => M.pt(x, yDown, z);
export const wlen = (px: number, z: number) => M.len(px, z);

/** children in frame pixels (x right, y up from the bottom edge) on a plane at world depth z */
export const Layer: React.FC<{z: number; children: React.ReactNode}> = ({z, children}) => (
  <group position={M.pt(0, M.h, z)} scale={M.len(1, z)}>{children}</group>
);
/** place a prop: its origin (base centre) at pixel (x, yDown), stacked at dz (layer px; lower in frame = nearer = larger) */
export const At: React.FC<{x: number; y: number; dz?: number; s?: number; flip?: boolean; rot?: number; children: React.ReactNode}> =
  ({x, y, dz = 0, s = 1, flip, rot = 0, children}) => <group position={[x, Y(y), dz]} rotation={[0, 0, deg(rot)]} scale={[flip ? -s : s, s, 1]}>{children}</group>;
/** kit effects stack their own tones with z steps meant for world units; in a pixel layer those steps are too thin */
export const Fx: React.FC<{children: React.ReactNode}> = ({children}) => <group scale={[1, 1, 150]}>{children}</group>;

/** Push toward a point that is not on the lens axis: it keeps its place on screen and grows pctPerSec per second
 *  (the camera only translates). Used for the S9 / S10 pair: the push is centred on the apex column. */
export const camPushTo = (base: {pos: V3; fov: number}, target: V3, pctPerSec: number): CamRig => {
  const rig = ((f: number): CamPose => {
    const s = 1 + (pctPerSec / 100) * (f / FPS);
    const pos: V3 = [target[0] + (base.pos[0] - target[0]) / s, target[1] + (base.pos[1] - target[1]) / s, target[2] + (base.pos[2] - target[2]) / s];
    return {pos, look: [pos[0], pos[1], target[2]], fov: base.fov};
  }) as CamRig;
  rig.shakes = [];
  return rig;
};

type El = React.ReactElement;
/** painter's pen: every shape it draws sits a little nearer than the one before */
export const pen = (dz = 0.1) => {
  const out: El[] = []; let z = 0;
  const nz = () => (z += dz);
  const api = {
    out,
    poly: (pts: Pt[], color: string) => { out.push(<Poly key={out.length} pts={pts} color={color} pos={[0, 0, nz()]} />); return api; },
    rect: (x: number, y: number, w: number, h: number, color: string, rot = 0) => { out.push(<Rect key={out.length} w={w} h={h} color={color} pos={[x, y, nz()]} rot={[0, 0, deg(rot)]} />); return api; },
    disc: (x: number, y: number, r: number, color: string, sy = 1) => { out.push(<Disc key={out.length} r={r} sy={sy} color={color} pos={[x, y, nz()]} seg={28} />); return api; },
    line: (pts: Pt[], width: number, color: string) => { out.push(<Stroke key={out.length} pts={pts} width={width} color={color} pos={[0, 0, nz()]} />); return api; },
    put: (fn: (z: number) => El) => { out.push(React.cloneElement(fn(nz()), {key: out.length})); return api; },
    /** leave n px of depth for a child group that stacks its own shapes */
    skip: (n: number) => { z += n; return api; },
  };
  return api;
};
const lerpP = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// ------------------------------------------------------------------------------------------------ palette
const C = COLORS.camp;
export type Pal = typeof DUSK;
/** slate blue and blue-grey snow about 70 %, canvas cream and ochre about 20 %, warm points about 10 % */
export const DUSK = {
  sky: ['#4d5787', '#6c6f9c', '#9c8aa6', '#d2a39c', '#e9bfa2'], cloud: ['#b99aae', '#a288a6', '#d4b0b0'] as [string, string, string],
  far: '#8f97bd', farShade: '#7d85ae', cap: '#f0ebf0', capShade: '#cfd0e6',
  ridge1: '#767da6', ridge1Hi: '#8a90b6', ridge2: '#5d668f', ridge2Hi: '#6f78a0', forest: '#414b72', forest2: '#374066',
  pine: '#2b4650', pine2: '#365a5e', trunk: '#4a3a40', pineSnow: '#e3e9f4', pineSnowShade: '#b7c3de',
  snow: C.snow, snowLight: C.snowLight, snowShade: C.snowShade, snowDeep: '#8797bd', path: C.path,
  canvas: C.canvas, canvasShade: C.canvasShade, canvasDark: '#938a74', seam: '#a59a7c', ochre: C.ochrePatch, ochre2: '#9a6f38', green: '#3f8f4e', green2: '#2f7440',
  rust: '#a2584a', slate: '#62709a', door: '#3a3442', doorLit: '#f2c770', doorLit2: '#e2a552',
  wood: '#8a6650', wood2: '#6f5142', woodDark: '#4a3a3c', wagon: '#6a5462', wagon2: '#584652', edge: C.wagonEdge,
  tin: C.tin, tin2: '#6c7388', soot: '#3a3640', stone: '#7f859c', stone2: '#62688a', rope: '#7a6a58', grass: '#7d8474', grass2: '#646d72',
  smoke: ['#c9c8d6', '#b3b3c8'], steam: ['#e3e6f0', '#cfd5e6'],
};
export const NIGHT: Pal = {
  sky: ['#151b45', '#1b2354', '#232c62', '#2a356e', '#2f3b76'], cloud: ['#2a3468', '#232c5c', '#34407a'],
  far: '#55629a', farShade: '#475388', cap: '#b9c5e6', capShade: '#93a1cc',
  ridge1: '#3e4a82', ridge1Hi: '#4a5790', ridge2: '#303b70', ridge2Hi: '#3a467e', forest: '#222b58', forest2: '#1c244c',
  pine: '#1a2a44', pine2: '#22364f', trunk: '#241f30', pineSnow: '#a9b6dc', pineSnowShade: '#7f8dbd',
  snow: '#7786b8', snowLight: '#9aa8d4', snowShade: '#5c6a9e', snowDeep: '#48558a', path: '#66749f',
  canvas: '#7d7f9a', canvasShade: '#63668a', canvasDark: '#4c4f72', seam: '#585b80', ochre: '#7a6850', ochre2: '#655545', green: '#2f7d4a', green2: '#25643c',
  rust: '#5e4658', slate: '#3f4a78', door: '#1c1a2c', doorLit: '#f0e2b4', doorLit2: '#dccf9e',
  wood: '#4c4258', wood2: '#3c3449', woodDark: '#231f30', wagon: '#352f44', wagon2: '#2c2739', edge: '#1d1a2a',
  tin: '#6f7896', tin2: '#555d7c', soot: '#1c1a2c', stone: '#56608c', stone2: '#434c78', rope: '#3c3850', grass: '#46527a', grass2: '#394468',
  smoke: ['#5b6694', '#4d5886'], steam: ['#7f8cb8', '#6c79a8'],
};

// ------------------------------------------------------------------------------------------------ far background
/** flat sky bands, top to bottom (shares of the height) */
export const Sky: React.FC<{pal: Pal; shares?: number[]; top?: number; bottom?: number}> = ({pal, shares = [2.2, 1.6, 1.2, 0.8, 0.6], top = 900, bottom = 150}) => {
  const tot = shares.reduce((a, b) => a + b, 0); let y = top;
  return <>{pal.sky.map((c, i) => { const h = ((top - bottom) * shares[i]) / tot; y -= h; return <Rect key={i} w={2600} h={h + 1} color={c} pos={[640, y + h / 2, i * 0.3]} />; })}</>;
};

/** The hall's own far range (shared MOUNTAINS.range, the same silhouette as in S3, S5, S6), k px per range unit, with
 *  the tallest peak as the landmark: its summit sits at pixel `peak`. Each summit gets a snow cap that follows its
 *  flanks and a pale shadow facet on its screen-right flank (the tallest uses the shared facet polygon). */
export const Peaks: React.FC<{pal: Pal; k: number; peak: Pt}> = ({pal, k, peak}) => {
  const R = MOUNTAINS.range.pts, T = MOUNTAINS.tallest, ox = peak[0] - T[0] * k, oy = Y(peak[1]) - T[1] * k;
  const p = (q: readonly number[]): Pt => [ox + q[0] * k, oy + q[1] * k];
  const g = pen();
  g.poly([...R.map(p), [ox + 170 * k, oy - 60 * k], [ox - 170 * k, oy - 60 * k]], pal.far);
  R.forEach((s, i) => {
    if (i === 0 || i === R.length - 1 || !(s[1] > R[i - 1][1] && s[1] > R[i + 1][1])) return;
    const S: Pt = [s[0], s[1]], L: Pt = [R[i - 1][0], R[i - 1][1]], Rr: Pt = [R[i + 1][0], R[i + 1][1]], tall = s[0] === T[0];
    // shadow facet on the screen-right flank
    const facet: Pt[] = tall ? MOUNTAINS.facet.pts.map((q) => [q[0], q[1]] as Pt) : [S, Rr, [Rr[0] - (Rr[0] - S[0]) * 0.57, Rr[1]], [S[0] + (Rr[0] - S[0]) * 0.14, S[1] - (S[1] - Rr[1]) * 0.5]];
    g.poly(facet.map(p), pal.farShade);
    // a second, lower facet breaks the big flank up
    g.poly([lerpP(S, L, 0.55), lerpP(S, L, 1), [L[0] + (S[0] - L[0]) * 0.5, L[1]]].map(p), pal.farShade);
    // snow cap: follows both flanks, zig-zag lower edge
    const t = tall ? 0.46 : 0.4, l = lerpP(S, L, t), r = lerpP(S, Rr, t), d = (S[1] - l[1]) * 0.34;
    const zig: Pt[] = [l, [lerpP(l, r, 0.2)[0], l[1] + d], [lerpP(l, r, 0.36)[0], l[1] - d * 0.5], [lerpP(l, r, 0.52)[0], l[1] + d * 1.1], [lerpP(l, r, 0.7)[0], l[1] - d * 0.2], [lerpP(l, r, 0.84)[0], l[1] + d * 0.7], r];
    g.poly([S, ...zig].map(p), pal.cap);
    g.poly([S, zig[3], zig[4], zig[5], r].map(p), pal.capShade);
    // one thin snow gully lower on the left flank
    { const a0 = lerpP(S, L, 0.5), a1 = lerpP(S, L, 0.8); g.poly([a0, [a0[0] + 2.2, a0[1] + 0.4], [a1[0] + 5.5, a1[1] + 1.2], [a1[0] + 3.4, a1[1] - 0.6]].map(p), pal.cap); }
  });
  return <>{g.out}</>;
};

/** a ridge band: top profile in frame pixels (y down), filled down to `base`; `hi` adds pale snow shelves on it */
export const Ridge: React.FC<{top: Pt[]; base: number; color: string; hi?: string; shelves?: [number, number, number][]}> = ({top, base, color, hi, shelves = []}) => {
  const g = pen();
  g.poly([...top.map(([x, y]) => [x, Y(y)] as Pt), [top[top.length - 1][0], Y(base)], [top[0][0], Y(base)]], color);
  if (hi) shelves.forEach(([x, y, w]) => g.poly([[x, Y(y)], [x + w * 0.12, Y(y - 7)], [x + w * 0.9, Y(y - 9)], [x + w, Y(y - 1)], [x + w * 0.86, Y(y + 5)], [x + w * 0.1, Y(y + 6)]], hi));
  return <>{g.out}</>;
};

/** dark forest band: a row of small pine silhouettes along its top edge, a few of them snow-tipped */
export const Forest: React.FC<{pal: Pal; y: number; base: number; x0?: number; x1?: number; seed?: number; hMin?: number; hMax?: number}> = ({pal, y, base, x0 = -260, x1 = 1540, seed = 3, hMin = 34, hMax = 66}) => {
  const trees = useMemo(() => { const r = rand(seed * 17 + 5), out: {x: number; h: number; c: number; snow: boolean}[] = []; for (let x = x0; x < x1; x += 16 + r() * 22) out.push({x, h: hMin + r() * (hMax - hMin), c: r() < 0.4 ? 1 : 0, snow: r() < 0.3}); return out; }, [seed, x0, x1, hMin, hMax]);
  const g = pen(0.05);
  g.rect((x0 + x1) / 2, Y((y + base) / 2), x1 - x0, base - y, pal.forest);
  g.rect((x0 + x1) / 2, Y(y + 22 + (base - y - 22) / 2), x1 - x0, base - y - 22, pal.forest2);
  trees.forEach((t) => {
    const w = t.h * 0.42, b = Y(y) - 4, col = t.c ? pal.forest2 : pal.forest;
    g.poly([[t.x - w / 2, b], [t.x - w * 0.22, b + t.h * 0.42], [t.x - w * 0.36, b + t.h * 0.42], [t.x, b + t.h], [t.x + w * 0.36, b + t.h * 0.42], [t.x + w * 0.22, b + t.h * 0.42], [t.x + w / 2, b]], col);
    if (t.snow) g.poly([[t.x, b + t.h], [t.x - w * 0.2, b + t.h * 0.66], [t.x + w * 0.04, b + t.h * 0.74], [t.x + w * 0.2, b + t.h * 0.66]], pal.pineSnowShade);
  });
  return <>{g.out}</>;
};

/** A pine: trunk and four notched tiers in two greens (light side, shade side), a snow cap on every tier.
 *  Origin = foot of the trunk; h in px. The three of S6 use heights PINES.heights. */
export const Pine: React.FC<{h: number; pal: Pal; snow?: boolean; lean?: number}> = ({h, pal, snow = true}) => {
  const g = pen(), w = h * PINES.halfBaseOverHeight * 2;
  g.rect(0, h * 0.05, h * 0.05, h * 0.1, pal.trunk);
  for (let i = 0; i < 4; i++) {
    const y0 = h * (0.08 + 0.2 * i), top = Math.min(h, y0 + h * 0.36), half = (w / 2) * (1 - i * 0.2), n = h * 0.03;
    g.poly([[-half, y0], [-half * 0.45, y0 + n], [0, y0 - n * 0.2], [half * 0.45, y0 + n], [half, y0], [0, top]], pal.pine);
    g.poly([[0, y0 - n * 0.2], [half * 0.45, y0 + n], [half, y0], [0, top]], pal.pine2);
    if (snow) {
      const e = (t: number, side: number): Pt => [side * half * t, top - (top - y0) * t];
      g.poly([[0, top], e(0.56, -1), [-half * 0.28, top - (top - y0) * 0.4], [-half * 0.06, top - (top - y0) * 0.6], [half * 0.2, top - (top - y0) * 0.38], e(0.5, 1)], pal.pineSnow);
      g.poly([[0, top], [half * 0.2, top - (top - y0) * 0.38], e(0.5, 1)], pal.pineSnowShade);
    }
  }
  return <>{g.out}</>;
};

// ------------------------------------------------------------------------------------------------ props
/** a stitched patch: a slightly crooked quad with short stitches round its edge */
const patch = (g: ReturnType<typeof pen>, x: number, y: number, w: number, h: number, rot: number, color: string, stitch: string) => {
  const c = Math.cos(deg(rot)), s = Math.sin(deg(rot)), q = (a: number, b: number): Pt => [x + a * c - b * s, y + a * s + b * c];
  g.poly([q(-w / 2, -h / 2), q(w / 2, -h / 2 + h * 0.06), q(w / 2 - w * 0.04, h / 2), q(-w / 2 + w * 0.05, h / 2 - h * 0.05)], color);
  const n = Math.max(2, Math.round(w / 9)), m = Math.max(2, Math.round(h / 9)), sw = Math.max(1.1, w * 0.035);
  for (let i = 0; i < n; i++) { const u = -w / 2 + ((i + 0.5) * w) / n; g.line([q(u, h / 2 - 1), q(u, h / 2 + sw * 2.4)], sw, stitch); g.line([q(u, -h / 2 + 1), q(u, -h / 2 - sw * 2.4)], sw, stitch); }
  for (let i = 0; i < m; i++) { const v = -h / 2 + ((i + 0.5) * h) / m; g.line([q(w / 2 - 1, v), q(w / 2 + sw * 2.4, v)], sw, stitch); g.line([q(-w / 2 + 1, v), q(-w / 2 - sw * 2.4, v)], sw, stitch); }
};
export const Patch: React.FC<{w: number; h: number; rot?: number; color: string; stitch: string}> = ({w, h, rot = 0, color, stitch}) => { const g = pen(); patch(g, 0, 0, w, h, rot, color, stitch); return <>{g.out}</>; };

/** crooked tin stovepipe: origin where it leaves the roof. `tip` turns the upper length (degrees, + to screen right). */
export const StovePipe: React.FC<{pal: Pal; s?: number; tip?: number; snow?: boolean}> = ({pal, s = 1, tip = 0, snow = true}) => {
  const g = pen(), u = pen();
  g.rect(0, 4 * s, 26 * s, 8 * s, pal.soot).rect(0, 22 * s, 15 * s, 44 * s, pal.tin).rect(4.5 * s, 22 * s, 6 * s, 44 * s, pal.tin2).rect(0, 30 * s, 18 * s, 4 * s, pal.tin2);
  u.rect(0, 22 * s, 15 * s, 46 * s, pal.tin).rect(4.5 * s, 22 * s, 6 * s, 46 * s, pal.tin2).rect(0, 12 * s, 18 * s, 4 * s, pal.tin2)
    .rect(0, 46 * s, 24 * s, 7 * s, pal.tin2).poly([[-15 * s, 50 * s], [0, 62 * s], [15 * s, 50 * s]], pal.tin);
  if (snow) u.poly([[-11 * s, 53 * s], [-4 * s, 60 * s], [0, 63 * s], [6 * s, 58 * s], [3 * s, 55 * s]], pal.pineSnow);
  return <>{g.out}<group position={[0, 42 * s, 3]} rotation={[0, 0, deg(-(14 + tip))]}><Disc r={9 * s} color={pal.tin2} pos={[0, 0, 0.2]} />{u.out}</group></>;
};

/** A prism tent seen from its gable end: canvas triangle with seams, hem, centre pole, door, guy ropes with pegs,
 *  stitched patches, snow on the ridge. Origin = middle of the base; w, h in px. `side` shows a receding roof plane
 *  (-1 to screen left, +1 right, 0 square-on). hero = the big green patch and the crooked stovepipe. */
export const Tent: React.FC<{w: number; h: number; pal: Pal; side?: -1 | 0 | 1; door?: 'dark' | 'lit'; hero?: boolean; f?: number; patches?: number; snow?: boolean; front?: string; flapSide?: 1 | -1; warm?: -1 | 1; warmColor?: string}> =
  ({w, h, pal, side = -1, door = 'dark', hero, f = 0, patches = 2, snow = true, front, flapSide = 1, warm, warmColor = '#efd39a'}) => {
    const g = pen(), A: Pt = [0, h], L: Pt = [-w / 2, 0], R: Pt = [w / 2, 0], dx = side * w * 0.5, bh = h * 0.93;
    const edge = (t: number, s: number): Pt => [s * (w / 2) * t, h * (1 - t)];
    // guy ropes behind everything, with pegs
    ([-1, 1] as const).forEach((s) => { const a = edge(0.46, s), b: Pt = [s * w * 0.74, -h * 0.02]; g.line([a, b], Math.max(1.4, w * 0.008), pal.rope); g.rect(b[0], b[1] + h * 0.02, w * 0.02, h * 0.07, pal.woodDark, s * 24); });
    if (side) {
      // receding roof plane and its snow
      const B: Pt = [dx, bh], Bb: Pt = [dx + side * w * 0.42, h * 0.02];
      g.poly([A, B, Bb, side < 0 ? L : R], pal.canvasShade);
      g.line([lerpP(A, B, 0.5), lerpP(side < 0 ? L : R, Bb, 0.5)], Math.max(1.2, w * 0.007), pal.seam);
      if (hero) g.put((z) => <group position={[dx * 0.62 + side * w * 0.1, h * 0.69, z]}><Patch w={w * 0.11} h={h * 0.1} rot={side * 30} color={pal.ochre2} stitch={pal.canvasDark} /></group>).skip(4);
      if (snow) g.poly([A, B, [B[0] + side * w * 0.07, B[1] - h * 0.12], [dx * 0.8, bh - h * 0.05], [dx * 0.55, h * 0.9], [dx * 0.3, h * 0.94], [dx * 0.12, h * 0.9]], pal.pineSnow);
      if (hero) g.put((z) => <group position={[dx * 0.72 + side * w * 0.2, h * 0.52, z]}><StovePipe pal={pal} s={w / 330} /></group>).skip(7);
    }
    // front gable
    g.poly([L, A, R], front ?? pal.canvas);
    // firelight: a flat warm wedge along the gable edge that faces the fire (warm = which side)
    if (warm) g.poly([[warm * w * 0.5, 0], [warm * w * 0.5 * 0.34, h * 0.66], [warm * w * 0.5 * 0.3, h * 0.6], [warm * w * 0.34, 0]], warmColor);
    g.poly([L, [-w / 2 + h * 0.035, h * 0.07], [w / 2 - h * 0.035, h * 0.07], R], pal.canvasShade);
    ([-0.5, 0.5] as const).forEach((t) => g.line([A, [t * w * 0.52, 0]], Math.max(1.2, w * 0.007), pal.seam));
    // door: a dark (or lit) slit with one flap folded back
    const dw = w * 0.11, dh = h * 0.6;
    g.poly([[-dw, 0], [0, dh], [dw, 0]], door === 'lit' ? pal.doorLit : pal.door);
    if (door === 'lit') g.poly([[-dw * 0.5, 0], [0, dh * 0.5], [dw * 0.5, 0]], pal.doorLit2);
    g.put((z) => <group position={[flapSide * dw * 0.15, dh, z]} rotation={[0, 0, deg(flapSide * 14)]}><Fx><ClothSway kind="banner" pos={[0, 0, 0]} w={dw * 1.5} h={dh * 0.97} f={f} color={pal.canvasShade} notch={false} amp={0.05} seed={w} /></Fx></group>).skip(2);
    g.poly([[-dw * 0.4, dh * 0.92], [0, dh * 1.08], [dw * 0.4, dh * 0.92]], pal.canvasDark);
    // patches
    if (hero) patch(g, -w * 0.2, h * 0.3, w * 0.2, h * 0.2, -8, pal.green, pal.green2);
    if (patches > 0) patch(g, w * 0.24, h * 0.18, w * 0.1, h * 0.1, 10, pal.ochre, pal.ochre2);
    if (patches > 1) patch(g, hero ? w * 0.13 : -w * 0.16, hero ? h * 0.5 : h * 0.34, w * 0.07, h * 0.08, -14, pal.rust, pal.canvasDark);
    // pole top, rope knot, snow on the ridge and at the foot
    g.rect(0, h * 1.03, Math.max(3, w * 0.02), h * 0.1, pal.woodDark).rect(0, h * 1.0, w * 0.045, h * 0.018, pal.rope);
    if (snow) {
      g.poly([[-w * 0.045, h * 0.94], [-w * 0.02, h * 1.0], [0, h * 1.015], [w * 0.03, h * 0.985], [w * 0.075, h * 0.89], [w * 0.03, h * 0.93], [-w * 0.01, h * 0.955]], pal.pineSnow);
      g.poly([[-w * 0.58, 0], [-w * 0.5, h * 0.045], [-w * 0.4, h * 0.03], [-w * 0.34, 0]], pal.snowLight).poly([[w * 0.3, 0], [w * 0.42, h * 0.04], [w * 0.52, h * 0.05], [w * 0.6, 0]], pal.snowLight);
    }
    return <>{g.out}</>;
  };

/** spoked wagon wheel, origin at the hub */
export const Wheel: React.FC<{r: number; pal: Pal}> = ({r, pal}) => {
  const g = pen();
  g.disc(0, 0, r, pal.woodDark).disc(0, 0, r * 0.8, pal.wagon2);
  for (let i = 0; i < 4; i++) g.rect(0, 0, r * 1.7, r * 0.12, pal.wood, i * 45 + 12);
  g.disc(0, 0, r * 0.24, pal.woodDark).disc(0, 0, r * 0.1, pal.tin);
  g.poly([[-r * 0.95, -r * 1.02], [-r * 0.5, -r * 0.7], [r * 0.1, -r * 0.62], [r * 0.6, -r * 0.76], [r * 0.95, -r * 1.02]], pal.snowLight);
  return <>{g.out}</>;
};
/** Box wagon with a canvas arch, side on. Origin = ground under its middle; w = body length in px. */
export const Wagon: React.FC<{w: number; pal: Pal; f?: number}> = ({w, pal}) => {
  const g = pen(), bh = w * 0.3, by = w * 0.2, r = w * 0.16;
  g.line([[w * 0.48, by + bh * 0.2], [w * 0.92, w * 0.03]], w * 0.03, pal.woodDark);                      // drawbar resting on the snow
  g.rect(0, by - w * 0.02, w * 0.9, w * 0.035, pal.woodDark);                                               // under-frame
  g.put((z) => <group position={[-w * 0.27, r, z]}><Wheel r={r} pal={pal} /></group>).skip(3);
  g.put((z) => <group position={[w * 0.29, r, z]}><Wheel r={r} pal={pal} /></group>).skip(3);
  // canvas arch with ribs, a patch and snow on top
  const arch = circlePts([0, by + bh], w * 0.5, 0, 180, 20, 0.62);
  g.poly(arch, pal.canvas);
  g.poly(circlePts([0, by + bh], w * 0.5, 0, 62, 10, 0.62).concat([[w * 0.2, by + bh]]), pal.canvasShade);
  [-0.3, -0.1, 0.1, 0.3].forEach((t) => g.line([[t * w, by + bh], [t * w, by + bh + w * 0.31 * Math.sqrt(1 - 4 * t * t)]], Math.max(1.2, w * 0.008), pal.seam));
  patch(g, -w * 0.16, by + bh + w * 0.14, w * 0.11, w * 0.08, 12, pal.ochre, pal.ochre2);
  g.poly([[-w * 0.3, by + bh + w * 0.248], [-w * 0.14, by + bh + w * 0.305], [0, by + bh + w * 0.315], [w * 0.2, by + bh + w * 0.29], [w * 0.36, by + bh + w * 0.215], [w * 0.2, by + bh + w * 0.255], [0, by + bh + w * 0.275], [-w * 0.16, by + bh + w * 0.262]], pal.pineSnow);
  // plank body: planks, frame posts, a little shuttered hatch
  g.rect(0, by + bh / 2, w, bh, pal.wagon);
  for (let i = 1; i < 4; i++) g.rect(0, by + (bh * i) / 4, w, Math.max(1.2, w * 0.008), pal.wagon2);
  [-0.49, -0.17, 0.17, 0.49].forEach((t) => g.rect(t * w, by + bh / 2, w * 0.035, bh * 1.04, pal.wagon2));
  g.rect(0, by + bh, w * 1.04, w * 0.03, pal.woodDark).rect(0, by, w * 1.04, w * 0.03, pal.woodDark);
  g.rect(w * 0.33, by + bh * 0.56, w * 0.17, bh * 0.44, pal.edge).rect(w * 0.33, by + bh * 0.56, w * 0.02, bh * 0.44, pal.wood2).rect(w * 0.33, by + bh * 0.56, w * 0.17, w * 0.016, pal.wood2);
  // a bucket on a hook and two steps at the back
  g.line([[-w * 0.4, by], [-w * 0.4, by - w * 0.07]], Math.max(1.2, w * 0.008), pal.woodDark).poly([[-w * 0.44, by - w * 0.06], [-w * 0.36, by - w * 0.06], [-w * 0.37, by - w * 0.13], [-w * 0.43, by - w * 0.13]], pal.tin).rect(-w * 0.4, by - w * 0.075, w * 0.085, w * 0.012, pal.tin2);
  g.poly([[-w * 0.5, by], [-w * 0.64, w * 0.02], [-w * 0.6, w * 0.02], [-w * 0.47, by]], pal.woodDark).rect(-w * 0.555, by * 0.62, w * 0.09, w * 0.018, pal.wood2).rect(-w * 0.6, by * 0.28, w * 0.09, w * 0.018, pal.wood2);
  return <>{g.out}</>;
};

/** crate of planks with a brace; origin = base centre. `snow` puts a cap on it. */
export const Crate: React.FC<{w: number; h?: number; pal: Pal; snow?: boolean}> = ({w, h = w * 0.72, pal, snow}) => {
  const g = pen();
  g.rect(0, h / 2, w, h, pal.wood);
  for (let i = 1; i < 4; i++) g.rect(0, (h * i) / 4, w, Math.max(1, w * 0.018), pal.wood2);
  g.rect(-w * 0.43, h / 2, w * 0.13, h, pal.wood2).rect(w * 0.43, h / 2, w * 0.13, h, pal.wood2).line([[-w * 0.36, h * 0.08], [w * 0.36, h * 0.92]], w * 0.09, pal.wood2);
  g.rect(0, h * 0.95, w, h * 0.1, pal.woodDark).rect(0, h * 0.05, w, h * 0.1, pal.woodDark);
  [-0.43, 0.43].forEach((t) => [0.05, 0.95].forEach((u) => g.disc(t * w, h * u, w * 0.022, pal.tin)));
  if (snow) g.poly([[-w * 0.52, h], [-w * 0.4, h + w * 0.09], [-w * 0.1, h + w * 0.13], [w * 0.25, h + w * 0.1], [w * 0.52, h], [w * 0.46, h - w * 0.05], [w * 0.2, h - w * 0.02], [-w * 0.3, h - w * 0.06]], pal.pineSnow);
  return <>{g.out}</>;
};
/** tied grain sack */
export const Sack: React.FC<{w: number; pal: Pal; tone?: string}> = ({w, pal, tone}) => {
  const g = pen(), c = tone ?? pal.canvasShade;
  g.poly([[-w * 0.5, 0], [-w * 0.56, w * 0.5], [-w * 0.34, w * 0.98], [-w * 0.14, w * 1.08], [w * 0.14, w * 1.08], [w * 0.34, w * 0.98], [w * 0.56, w * 0.5], [w * 0.5, 0]], c);
  g.poly([[w * 0.1, 0], [w * 0.2, w * 0.6], [w * 0.14, w * 1.08], [w * 0.34, w * 0.98], [w * 0.56, w * 0.5], [w * 0.5, 0]], pal.canvasDark);
  g.rect(0, w * 1.08, w * 0.34, w * 0.07, pal.rust).poly([[-w * 0.2, w * 1.1], [-w * 0.3, w * 1.3], [0, w * 1.22], [w * 0.28, w * 1.32], [w * 0.2, w * 1.1]], c);
  patch(g, -w * 0.16, w * 0.42, w * 0.26, w * 0.22, 8, pal.ochre, pal.ochre2);
  return <>{g.out}</>;
};
/** barrel with two hoops and a lid of snow */
export const Barrel: React.FC<{w: number; pal: Pal; snow?: boolean}> = ({w, pal, snow = true}) => {
  const g = pen(), h = w * 1.3;
  g.poly([[-w * 0.4, 0], [-w * 0.5, h * 0.3], [-w * 0.5, h * 0.7], [-w * 0.4, h], [w * 0.4, h], [w * 0.5, h * 0.7], [w * 0.5, h * 0.3], [w * 0.4, 0]], pal.wood);
  g.poly([[w * 0.12, 0], [w * 0.16, h], [w * 0.4, h], [w * 0.5, h * 0.7], [w * 0.5, h * 0.3], [w * 0.4, 0]], pal.wood2);
  [-0.25, 0.02].forEach((t) => g.line([[t * w, h * 0.03], [t * w * 1.1, h * 0.97]], Math.max(1, w * 0.025), pal.wood2));
  g.rect(0, h * 0.26, w * 1.0, h * 0.07, pal.tin2).rect(0, h * 0.74, w * 1.0, h * 0.07, pal.tin2);
  if (snow) g.poly([[-w * 0.44, h], [-w * 0.3, h + w * 0.14], [w * 0.1, h + w * 0.18], [w * 0.44, h], [w * 0.2, h - w * 0.04], [-w * 0.2, h - w * 0.02]], pal.pineSnow);
  return <>{g.out}</>;
};
/** stacked firewood seen end on, snow on top */
export const StickPile: React.FC<{w: number; pal: Pal; rows?: number; snow?: boolean}> = ({w, pal, rows = 3, snow = true}) => {
  const g = pen(), r = w / 10;
  for (let j = 0; j < rows; j++) for (let i = 0; i < 5 - j; i++) { const x = (i - (4 - j) / 2) * r * 2, y = r + j * r * 1.72; g.disc(x, y, r, pal.woodDark).disc(x, y, r * 0.74, (i + j) % 2 ? pal.wood : pal.wood2).disc(x, y, r * 0.3, pal.woodDark); }
  g.rect(-w * 0.56, r * rows * 0.9, r * 0.5, r * rows * 2, pal.woodDark, -6).rect(w * 0.56, r * rows * 0.9, r * 0.5, r * rows * 2, pal.woodDark, 6);
  const top = r * (1 + (rows - 1) * 1.72 + 0.8);
  if (snow) g.poly([[-r * (5 - rows) - r, top - r * 0.5], [-r * 1.6, top + r * 0.9], [r * 0.4, top + r * 1.1], [r * (5 - rows) + r, top - r * 0.4], [r * 1.2, top - r * 0.1], [-r * 1.4, top - r * 0.2]], pal.pineSnow);
  return <>{g.out}</>;
};
/** grey rock in two tones with a snow cap */
export const Rock: React.FC<{w: number; pal: Pal; snow?: boolean}> = ({w, pal, snow = true}) => {
  const g = pen();
  g.poly([[-w * 0.5, 0], [-w * 0.36, w * 0.34], [-w * 0.06, w * 0.5], [w * 0.28, w * 0.4], [w * 0.5, 0]], pal.stone);
  g.poly([[w * 0.05, 0], [-w * 0.06, w * 0.5], [w * 0.28, w * 0.4], [w * 0.5, 0]], pal.stone2);
  if (snow) g.poly([[-w * 0.4, w * 0.27], [-w * 0.06, w * 0.5], [w * 0.28, w * 0.4], [w * 0.36, w * 0.27], [w * 0.12, w * 0.32], [-w * 0.08, w * 0.22], [-w * 0.22, w * 0.3]], pal.pineSnow);
  return <>{g.out}</>;
};
/** dry grass poking through the snow: a few thin blades */
export const Tuft: React.FC<{h: number; pal: Pal; n?: number; seed?: number}> = ({h, pal, n = 5, seed = 1}) => {
  const b = useMemo(() => { const r = rand(seed * 31 + 7); return Array.from({length: n}, (_, i) => ({x: (i - (n - 1) / 2) * h * 0.2 + (r() - 0.5) * h * 0.1, t: (i - (n - 1) / 2) * h * 0.16 + (r() - 0.5) * h * 0.2, k: 0.55 + r() * 0.45, c: r() < 0.5})); }, [h, n, seed]);
  return <>{b.map((q, i) => <Poly key={i} pts={[[q.x - h * 0.06, 0], [q.x + q.t, h * q.k], [q.x + h * 0.06, 0]]} color={q.c ? pal.grass : pal.grass2} pos={[0, 0, i * 0.2]} />)}</>;
};
/** soft snow drift: a pale hump with a shade foot (flat, two tones) */
export const Drift: React.FC<{w: number; h?: number; pal: Pal}> = ({w, h = w * 0.16, pal}) => {
  const g = pen();
  g.poly(circlePts([0, 0], w / 2, 0, 180, 14, (h * 2) / w), pal.snowLight);
  g.poly(circlePts([0, 0], w / 2, 0, 70, 6, (h * 2) / w).concat([[w * 0.12, 0]]), pal.snow);
  return <>{g.out}</>;
};
/** a pair of footprints (trampled snow) */
export const Steps: React.FC<{pts: Pt[]; pal: Pal; r?: number}> = ({pts, pal, r = 4}) => <>{pts.map(([x, y], i) => <Disc key={i} r={r} sy={0.45} color={pal.snowShade} pos={[x, Y(y), i * 0.1]} seg={12} />)}</>;

/** Campfire: melted patch, a ring of stones, crossed logs, a tripod with a hanging pot. `lit` = flame (3 fat
 *  tongues, flat, no halo) plus pot steam; unlit = a dead grey ring with snow on the logs. size 1 = normal, 1.25 = stepped up. */
export const Campfire: React.FC<{pal: Pal; f: number; lit?: boolean; size?: number; s?: number; pot?: boolean}> = ({pal, f, lit = true, size = 1, s = 1, pot = true}) => {
  const g = pen();
  g.disc(0, 2 * s, 62 * s, lit ? '#8a8fae' : pal.snowShade, 0.26);
  if (lit) g.disc(0, 2 * s, 44 * s, '#6e6a80', 0.24);
  // back legs of the tripod
  g.line([[0, 122 * s], [-8 * s, 4 * s]], 4 * s, pal.woodDark);
  // stones behind
  [[-34, 9, 15], [-12, 13, 13], [14, 13, 14], [36, 8, 15]].forEach(([x, y, w], i) => g.put((z) => <group position={[x * s, y * s, z]}><Rock w={w * s * 1.5} pal={pal} snow={!lit && i % 2 === 0} /></group>).skip(1));
  g.rect(-6 * s, 12 * s, 54 * s, 9 * s, lit ? '#3e3038' : pal.woodDark, 16).rect(8 * s, 12 * s, 54 * s, 9 * s, lit ? '#56403c' : pal.wood2, -14);
  if (lit) g.put((z) => <group position={[0, 8 * s, z]}><Fx><Flame pos={[0, 0, 0]} w={24 * s * size} h={66 * s * size} f={f} seed={2} colors={[C.fire[2], C.fire[1], C.fire[0]]} embers={4} emberColor={C.fire[0]} /></Fx></group>).skip(3);
  else g.poly([[-30 * s, 14 * s], [-16 * s, 24 * s], [4 * s, 26 * s], [26 * s, 20 * s], [34 * s, 12 * s], [10 * s, 17 * s], [-12 * s, 15 * s]], pal.pineSnow);
  // stones in front
  [[-42, 0, 16], [-20, -4, 17], [4, -5, 16], [27, -3, 17], [46, 1, 14]].forEach(([x, y, w], i) => g.put((z) => <group position={[x * s, y * s, z]}><Rock w={w * s * 1.5} pal={pal} snow={!lit || i === 0 || i === 4} /></group>).skip(1));
  // tripod, chain, pot
  g.line([[0, 124 * s], [-58 * s, 0]], 5 * s, pal.woodDark).line([[0, 124 * s], [58 * s, 0]], 5 * s, pal.woodDark).rect(0, 122 * s, 16 * s, 7 * s, pal.rope);
  if (lit) g.line([[-3 * s, 112 * s], [-50 * s, 6 * s]], 1.8 * s, '#e0935a').line([[3 * s, 112 * s], [50 * s, 6 * s]], 1.8 * s, '#e0935a');
  if (pot) {
    const py = lit ? 62 * s * (size > 1 ? 1.12 : 1) + 14 * s : 52 * s;
    g.line([[0, 120 * s], [0, py + 22 * s]], 2 * s, pal.soot);
    g.poly([[-20 * s, py + 20 * s], [-22 * s, py + 6 * s], [-14 * s, py - 4 * s], [14 * s, py - 4 * s], [22 * s, py + 6 * s], [20 * s, py + 20 * s]], pal.soot).rect(0, py + 21 * s, 46 * s, 5 * s, '#56505e').poly([[6 * s, py - 4 * s], [14 * s, py - 4 * s], [22 * s, py + 6 * s], [20 * s, py + 20 * s], [10 * s, py + 20 * s]], '#2a2630');
    if (lit) g.poly([[-14 * s, py - 4 * s], [14 * s, py - 4 * s], [18 * s, py + 1 * s], [-18 * s, py + 1 * s]], '#c9703c');
    if (lit) g.put((z) => <group position={[0, py + 24 * s, z]}><Fx><Smoke pos={[0, 0, 0]} f={f} count={5} size={11 * s} rise={84 * s} spread={22 * s} tones={pal.steam} seed={4} life={48} /></Fx></group>).skip(5);
    else g.poly([[-20 * s, py + 22 * s], [-8 * s, py + 31 * s], [8 * s, py + 30 * s], [20 * s, py + 22 * s]], pal.pineSnow);
  }
  return <>{g.out}</>;
};

/** washing line between two points (frame px, y down): sagging rope, two forked posts, `cloths` swaying on it */
export const WashingLine: React.FC<{a: Pt; b: Pt; pal: Pal; f: number; cloths?: boolean; sag?: number; posts?: [number, number][]; amp?: number}> = ({a, b, pal, f, cloths = true, sag = 26, posts = [], amp = 0.14}) => {
  const A: Pt = [a[0], Y(a[1])], B: Pt = [b[0], Y(b[1])], mid: Pt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - sag * 2], line = bezier(A, mid, B, 24);
  const at = (t: number) => line[Math.round(t * 24)];
  const items: {t: number; w: number; h: number; c: string; stripe?: string}[] = [
    {t: 0.2, w: 34, h: 50, c: pal.canvas}, {t: 0.4, w: 44, h: 38, c: pal.rust, stripe: pal.canvas}, {t: 0.6, w: 30, h: 56, c: pal.slate}, {t: 0.8, w: 40, h: 42, c: pal.ochre, stripe: pal.ochre2},
  ];
  return (
    <>
      {posts.map(([x, base], i) => { const top = at((x - A[0]) / (B[0] - A[0]))[1]; return <group key={i} position={[0, 0, -1]}><Rect w={5} h={top - Y(base) + 10} color={pal.woodDark} pos={[x, (top + Y(base)) / 2 + 5, 0]} /><Rect w={14} h={4} color={pal.woodDark} pos={[x, top + 9, 0.2]} rot={[0, 0, 0.5]} /></group>; })}
      <Stroke pts={line} width={2} color={pal.rope} />
      {cloths ? items.map((it, i) => { const p = at(it.t); return (
        <group key={i} position={[p[0], p[1] + 1, 0.6 + i * 2]}>
          <Fx><ClothSway kind="banner" pos={[0, 0, 0]} w={it.w} h={it.h} f={f} color={it.c} stripe={it.stripe} notch={false} amp={amp} seed={i + 2} /></Fx>
          {[-0.36, 0.36].map((u) => <Rect key={u} w={2.5} h={7} color={pal.woodDark} pos={[u * it.w, 1, 1.4]} />)}
        </group>
      ); }) : [0.3, 0.72].map((t) => <Rect key={t} w={2.5} h={7} color={pal.woodDark} pos={[at(t)[0], at(t)[1] - 1, 0.6]} />)}
    </>
  );
};

/** snowy pine branch reaching into the frame from the screen-right edge (sharp, no blur). Origin = where it enters. */
export const Branch: React.FC<{len: number; pal: Pal}> = ({len, pal}) => {
  const g = pen(), n = 7;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), x = -len * (0.1 + 0.9 * t), y = -len * 0.16 * t * t - len * 0.02 * i, k = len * (0.3 - 0.17 * t);
    g.poly([[x + k * 0.5, y + k * 0.2], [x - k * 0.75, y - k * 0.05], [x - k * 0.5, y - k * 0.55], [x - k * 0.1, y - k * 0.38], [x + k * 0.1, y - k * 0.8], [x + k * 0.45, y - k * 0.42], [x + k * 0.75, y - k * 0.62]], i % 2 ? pal.pine : pal.pine2);
    g.poly([[x + k * 0.5, y + k * 0.2], [x - k * 0.75, y - k * 0.05], [x - k * 0.42, y - k * 0.2], [x - k * 0.1, y - k * 0.08], [x + k * 0.2, y - k * 0.2]], pal.pineSnow);
  }
  g.line([[len * 0.1, len * 0.03], [-len * 0.5, -len * 0.07], [-len * 0.95, -len * 0.28]], len * 0.022, pal.trunk);
  return <>{g.out}</>;
};

/** one depth layer of snow: crisp cream-blue flakes that fall the normal way (px per frame), wrapping in a box */
export const SnowLayer: React.FC<{f: number; count: number; seed: number; r: number; speed: number; color?: string; x0?: number; x1?: number; top?: number; bottom?: number; wind?: number}> =
  ({f, count, seed, r, speed, color = SNOW.color, x0 = -160, x1 = 1440, top = 780, bottom = -40, wind = 0.25}) => {
    const ps = useMemo(() => { const q = rand(seed * 53 + 11); return Array.from({length: count}, () => ({x: q(), y: q(), v: 0.75 + q() * 0.5, ph: q() * 6.28, k: 0.8 + q() * 0.4})); }, [count, seed]);
    const H = top - bottom, Wd = x1 - x0;
    return <>{ps.map((p, i) => {
      const d = (p.y * H + f * speed * p.v) % H, y = top - d;
      const x = x0 + ((((p.x * Wd + d * wind + Math.sin(f * 0.07 + p.ph) * 7) % Wd) + Wd) % Wd);
      return <Disc key={i} r={r * p.k} color={color} pos={[x, y, (i % 7) * 0.2]} seg={10} />;
    })}</>;
  };

/** flat dusk cloud: a few lumps on a flat base, two tones; drifts slowly (a set piece, smooth) */
export const Cloud: React.FC<{w: number; pal: Pal; f: number; speed?: number}> = ({w, pal, f, speed = 0.12}) => {
  const g = pen(), h = w * 0.2;
  [[-0.3, 0.5, 0.7], [-0.05, 0.85, 1], [0.24, 0.55, 0.8], [0.42, 0.3, 0.5], [-0.46, 0.25, 0.45]].forEach(([x, y, r]) => g.disc(x * w, h * y, h * r, pal.cloud[0]));
  g.rect(0, h * 0.28, w, h * 0.56, pal.cloud[0]).rect(0, h * 0.08, w, h * 0.16, pal.cloud[1]);
  return <group position={[f * speed, 0, 0]}>{g.out}</group>;
};
/** snow ground band: top profile in frame px (y down), filled to below the frame; `lip` = a paler rim along the top */
export const Ground: React.FC<{top: Pt[]; color: string; lip?: string; base?: number}> = ({top, color, lip, base = 800}) => {
  const up = top.map(([x, y]) => [x, Y(y)] as Pt);
  return (
    <>
      <Poly pts={[...up, [top[top.length - 1][0], Y(base)], [top[0][0], Y(base)]]} color={color} />
      {lip ? <Poly pts={[...up, ...up.slice().reverse().map(([x, y]) => [x, y - 7] as Pt)]} color={lip} pos={[0, 0, 0.1]} /> : null}
    </>
  );
};
