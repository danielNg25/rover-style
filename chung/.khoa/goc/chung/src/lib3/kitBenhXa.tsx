import React, {useMemo} from 'react';
import * as THREE from 'three';
import {B} from './kit';
import {FacetLathe, Halo} from './look';
import {P, rnd, Ctx} from './depth';
import {tex, calcSheetTex, CALC_LINES, HoledWall} from './kitLab';

type V3 = [number, number, number];
const HAND = '"Chalkboard SE", "Noteworthy", "Comic Sans MS", cursive';
const SERIF = 'Georgia, "Times New Roman", serif';

/** BỆNH XÁ trường đại học đầu thế kỉ 20 (chương 7 cảnh 15-16, chương 8). Mọi thứ xếp dọc MỘT bức tường sau (z = 0), máy chỉ dời theo
 *  trục x; phòng KHÔNG xoay. Đơn vị mét: x 0..8 từ trái sang phải, z từ tường ra phía máy, y lên. Các món rời ở cuối file dùng được cả
 *  ngoài phòng này (giá kẹp, ảnh, vòng đỏ, ghế… truyền vào `Lab` qua `extra`/`children`). */
export const BX = {
  W: 8, D: 5.5, H: 3.6, T: 0.3,
  door: {x0: 0.4, x1: 1.2, h: 2.1},
  mirror: {x0: 1.5, x1: 2.0, y0: 1.25, y1: 1.85},
  window: {x0: 5.8, x1: 7.2, y0: 1.0, y1: 2.7},
  sheet: {x: 2.6, y: 1.5, w: 0.42, h: 0.55},
  table: {x0: 2.85, x1: 3.3, d: 0.42, h: 0.78},
  bed: {x0: 3.4, x1: 5.4, z0: 0.1, z1: 0.98, top: 0.55},
  cabinet: {x0: 7.25, x1: 7.85},
  railY: 2.3,
};
/** Chỗ hình phản chiếu trong gương: người đứng ở (x, y, z) trong phòng thì hình trong gương ở (x, y, -z) (đã lật ở người dựng). */
export const guongDiem = (p: V3): V3 => [p[0], p[1], -p[2]];

// ================================================================ tường, sàn, trần
const paintWall = (seed: number, Wm: number, Hm: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / Wm, Y = (y: number) => H - y * ppm, rect = (x: number, y0: number, y1: number, w: number, col: string) => { c.fillStyle = col; c.fillRect(x * ppm, Y(y1), w * ppm, (y1 - y0) * ppm); };
  rect(0, 0, Hm, Wm, '#ece6d4');
  for (let x = 0; x < Wm; x += 1.0) rect(x, 1.3, 2.88, 0.5, x % 2 ? '#efead9' : '#e8e1ce');   // upper plaster: wide flat bands
  rect(0, 0, 1.28, Wm, '#93aa9d');                                                           // dado: sage green
  for (let x = 0.3; x < Wm; x += 0.62) { rect(x, 0.16, 1.16, 0.46, '#86a092'); rect(x, 1.1, 1.16, 0.46, '#a2b8ab'); }
  rect(0, 1.28, 1.34, Wm, '#4f6157'); rect(0, 1.34, 1.37, Wm, '#c9c1a8');                   // dado rail
  rect(0, 0, 0.13, Wm, '#4b5750'); rect(0, 0.13, 0.15, Wm, '#6c7a70');                      // skirting
  rect(0, 2.88, 2.95, Wm, '#6f5f48'); rect(0, 2.95, 2.99, Wm, '#d3cbb2');                   // picture rail
  rect(0, 3.52, Hm, Wm, '#7d6f58'); rect(0, 3.4, 3.52, Wm, '#d9d2bd');                      // cornice
  for (let k = 0; k < Math.round(Wm * 2); k++) {                                              // flat stains, sharp edged
    const cx = r() * Wm, cy = 1.5 + r() * 1.3, n = 7, pts: number[][] = [], rr = 0.14 + r() * 0.3;
    for (let a = 0; a < n; a++) { const t = (a / n) * 6.283, m = 0.55 + r() * 0.6; pts.push([(cx + Math.cos(t) * rr * m) * ppm, Y(cy + Math.sin(t) * rr * m * 0.6)]); }
    P(c, pts, k % 3 ? 'rgba(206,194,160,0.45)' : 'rgba(255,252,238,0.5)');
  }
  c.strokeStyle = 'rgba(150,134,108,0.35)'; c.lineWidth = 2; for (let k = 0; k < 1; k++) { c.beginPath(); let x = (0.8 + r() * (Wm - 1.6)) * ppm, y = Y(1.9); c.moveTo(x, y); for (let i = 0; i < 4; i++) { x += (r() - 0.5) * 30; y += 20 + r() * 24; c.lineTo(x, y); } c.stroke(); }
};
const wallTex = (seed: number, Wm: number) => tex(`bx-wall-${seed}`, Math.round(Wm * 250), Math.round(3.6 * 250), paintWall(seed, Wm, 3.6));
const floorTex = () => tex('bx-floor', 1280, 880, (c, W, H) => {
  const ppm = W / BX.W, t = 0.4 * ppm; c.fillStyle = '#cbc5af'; c.fillRect(0, 0, W, H);
  for (let i = 0; i * t < W; i++) for (let j = 0; j * t < H; j++) { c.fillStyle = (i + j) % 2 ? '#b5b09a' : '#d6d0ba'; c.fillRect(i * t, j * t, t, t); }
  c.fillStyle = 'rgba(96,90,72,0.5)'; for (let i = 0; i * t < W; i++) c.fillRect(i * t - 1, 0, 2, H); for (let j = 0; j * t < H; j++) c.fillRect(0, j * t - 1, W, 2);
});
export const BxShell: React.FC<{mirror?: boolean; children?: React.ReactNode}> = ({children}) => {
  const holes = [
    {kind: 'rect' as const, x0: BX.door.x0, x1: BX.door.x1, y0: 0, y1: BX.door.h},
    {kind: 'rect' as const, x0: BX.mirror.x0, x1: BX.mirror.x1, y0: BX.mirror.y0, y1: BX.mirror.y1},
    {kind: 'rect' as const, x0: BX.window.x0, x1: BX.window.x1, y0: BX.window.y0, y1: BX.window.y1},
  ];
  return (
    <group>
      <BxHoledWall holes={holes} />
      <mesh position={[0, BX.H / 2, BX.D / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[BX.D, BX.H]} /><meshLambertMaterial map={wallTex(5, BX.D)} /></mesh>
      <mesh position={[BX.W, BX.H / 2, BX.D / 2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow><planeGeometry args={[BX.D, BX.H]} /><meshLambertMaterial map={wallTex(6, BX.D)} /></mesh>
      <mesh position={[BX.W / 2, 0, BX.D / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[BX.W, BX.D]} /><meshLambertMaterial map={floorTex()} /></mesh>
      <mesh position={[BX.W / 2, BX.H, BX.D / 2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[BX.W, BX.D]} /><meshLambertMaterial color="#e7e2d2" /></mesh>
      {[1.2, 2.9, 4.6].map((z) => <group key={z}><B p={[BX.W / 2, BX.H - 0.12, z]} s={[BX.W, 0.24, 0.22]} c="#7a6650" /><B p={[BX.W / 2, BX.H - 0.25, z]} s={[BX.W, 0.03, 0.26]} c="#5a4a38" cast={false} /></group>)}
      {children}
    </group>
  );
};
const BxHoledWall: React.FC<{holes: React.ComponentProps<typeof HoledWall>['holes']}> = ({holes}) => <HoledWall w={BX.W} h={BX.H} t={BX.T} holes={holes} map={wallTex(3, BX.W)} slab="#9a9482" />;

// ================================================================ cửa ra vào, bên TRÁI
const corridorFar = () => tex('bx-corr-far', 1024, 768, (c, W, H) => {
  c.fillStyle = '#f0e6ca'; c.fillRect(0, 0, W, H); c.fillStyle = '#c9b88c'; c.fillRect(0, H * 0.52, W, H * 0.48);
  c.fillStyle = '#a89870'; c.fillRect(0, H * 0.52, W, 8); c.fillStyle = '#8a7a58'; c.fillRect(0, H * 0.93, W, H * 0.07);
  for (let k = 0; k < 3; k++) { const x = W * (0.12 + k * 0.3); c.fillStyle = '#5a4a38'; c.fillRect(x - 6, H * 0.1, W * 0.2 + 12, H * 0.42 + 6); c.fillStyle = '#fff4d4'; c.fillRect(x, H * 0.12, W * 0.2, H * 0.4); c.fillStyle = '#5a4a38'; c.fillRect(x + W * 0.1 - 3, H * 0.12, 6, H * 0.4); c.fillRect(x, H * 0.32, W * 0.2, 6); }
});
/** the door in the left of the wall: casing, leaf (hinged on the left, swinging OUT into the corridor, so a figure standing in the doorway is never hit), a frosted pane that glows, a brass handle; beyond it a bright corridor.
 *  open = leaf angle in radians (0 shut ... 1.45; it swings away from the room, so a figure at BX_MARKS.aCua is clear at every angle). */
export const CuaRa: React.FC<{open?: number}> = ({open = 0}) => {
  const x0 = BX.door.x0, w = BX.door.x1 - x0, h = BX.door.h, ang = Math.max(0, Math.min(1.45, open));
  return (
    <group>
      {/* casing */}
      <B p={[x0 - 0.04, h / 2, 0.025]} s={[0.08, h, 0.06]} c="#6a4c30" /><B p={[x0 + w + 0.04, h / 2, 0.025]} s={[0.08, h, 0.06]} c="#6a4c30" /><B p={[x0 + w / 2, h + 0.045, 0.025]} s={[w + 0.2, 0.09, 0.06]} c="#6a4c30" />
      <B p={[x0 + w / 2, h + 0.11, 0.03]} s={[w + 0.3, 0.03, 0.07]} c="#8a6a48" cast={false} />
      {/* the corridor beyond: bright, warm */}
      <mesh position={[x0 + w / 2, 1.5, -2.3]}><planeGeometry args={[3.4, 3.0]} /><meshBasicMaterial map={corridorFar()} toneMapped={false} fog={false} /></mesh>
      <mesh position={[x0 + w / 2, 0.001, -1.2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.4, 2.4]} /><meshLambertMaterial map={floorTex()} /></mesh>
      <mesh position={[x0 + w / 2, 3.0, -1.2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[3.4, 2.4]} /><meshLambertMaterial color="#e8dcc0" /></mesh>
      <pointLight position={[x0 + w / 2, 2.4, -1.2]} color="#ffe2a8" intensity={2.4} distance={6} decay={1.6} />
      {/* the leaf */}
      <group position={[x0, 0, 0.03]} rotation={[0, ang, 0]}>
        <B p={[w / 2, h / 2, 0.02]} s={[w - 0.02, h - 0.02, 0.045]} c="#7b5a3c" />
        <B p={[w / 2, 0.42, 0.045]} s={[w - 0.2, 0.62, 0.012]} c="#8d6a47" cast={false} /><B p={[w / 2, 1.0, 0.045]} s={[w - 0.2, 0.34, 0.012]} c="#8d6a47" cast={false} />
        <B p={[w / 2, 1.62, 0.045]} s={[w - 0.1, 0.8, 0.014]} c="#5a4228" cast={false} />
        <mesh position={[w / 2, 1.62, 0.054]}><planeGeometry args={[w - 0.2, 0.7]} /><meshBasicMaterial color="#fff1c4" toneMapped={false} /></mesh>
        <B p={[w / 2, 1.62, 0.058]} s={[0.025, 0.7, 0.008]} c="#5a4228" cast={false} /><B p={[w / 2, 1.62, 0.058]} s={[w - 0.2, 0.025, 0.008]} c="#5a4228" cast={false} />
        {[[0.12, 0.45], [0.2, 0.52], [0.52, 0.44]].map(([a, b], i) => <mesh key={i} position={[a + 0.2, 1.4 + b * 0.5, 0.0584]}><planeGeometry args={[0.1, 0.012]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.5} toneMapped={false} /></mesh>)}
        <B p={[w - 0.1, 1.0, 0.07]} s={[0.04, 0.04, 0.05]} c="#c9a24a" cast={false} /><B p={[w - 0.1, 1.0, 0.095]} s={[0.1, 0.022, 0.022]} c="#d8b45a" cast={false} />
      </group>
      <BxSign pos={[x0 + w / 2, 2.52, 0.035]} />
    </group>
  );
};
const BxSign: React.FC<{pos: V3}> = ({pos}) => {
  const map = useMemo(() => tex('bx-sign', 512, 128, (c, W, H) => { c.fillStyle = '#3a4a42'; c.fillRect(0, 0, W, H); c.fillStyle = '#efe6c8'; c.fillRect(8, 8, W - 16, H - 16); c.fillStyle = '#2f3f38'; c.font = `bold 66px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BỆNH XÁ', W / 2 + 18, H / 2 + 4); c.fillStyle = '#b03a30'; c.fillRect(50, 44, 40, 12); c.fillRect(64, 30, 12, 40); }), []);
  return <mesh position={pos}><planeGeometry args={[0.62, 0.155]} /><meshLambertMaterial map={map} /></mesh>;
};

// ================================================================ cửa sổ, bên PHẢI, và cảnh bên ngoài
const leaf = (c: Ctx, x: number, y: number, s: number, a: number, col: string, dark: string) => {
  const pts: number[][] = []; for (let k = 0; k < 10; k++) { const t = a + (k / 10) * 6.283, m = k % 2 ? 0.45 : 1; pts.push([x + Math.cos(t) * s * m, y + Math.sin(t) * s * m]); }
  P(c, pts, col); P(c, [pts[0], pts[1], pts[2], [x, y]], dark);
};
const outsideTex = (state: 'sang' | 'chieu') => tex(`bx-outside2-${state}`, 1600, 1280, (c, W, H) => {
  const r = rnd(state === 'sang' ? 3 : 5), dusk = state === 'chieu';
  const g = c.createLinearGradient(0, 0, 0, H * 0.62); (dusk ? [[0, '#8a6aa0'], [0.5, '#e4887c'], [1, '#fbc27a']] : [[0, '#a3c1db'], [0.55, '#d0e1ea'], [1, '#f0f3ec']]).forEach(([o, col]) => g.addColorStop(o as number, col as string)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  [[420, 330, 300], [820, 400, 260], [1100, 300, 220]].forEach(([x, y, w]) => { P(c, [[x, y], [x + w * 0.2, y - 26], [x + w * 0.55, y - 34], [x + w * 0.85, y - 12], [x + w, y], [x + w * 0.5, y + 14]], dusk ? 'rgba(250,170,140,0.85)' : 'rgba(255,255,255,0.9)'); P(c, [[x + 30, y + 4], [x + w * 0.5, y + 14], [x + w - 20, y + 2], [x + w * 0.5, y + 22]], dusk ? 'rgba(186,110,140,0.75)' : 'rgba(196,214,226,0.8)'); });
  if (dusk) { c.beginPath(); c.arc(560, 700, 130, 0, 7); c.fillStyle = 'rgba(255,214,150,0.5)'; c.fill(); c.beginPath(); c.arc(560, 700, 70, 0, 7); c.fillStyle = 'rgba(255,238,190,0.85)'; c.fill(); }
  // the neighbouring building: brick, two tones, a grid of windows with sills
  const bx = 730, by = 520; P(c, [[bx, by], [W, by - 40], [W, H], [bx, H]], dusk ? '#9a5a4e' : '#b4725e'); P(c, [[bx, by], [bx + 30, by - 5], [bx + 30, H], [bx, H]], dusk ? '#7a443e' : '#94584a');
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const wx = bx + 80 + i * 130, wy = by + 60 + j * 150; c.fillStyle = dusk ? '#f2c070' : '#4f5f76'; c.fillRect(wx, wy, 66, 96); c.fillStyle = dusk ? '#c9945a' : '#e6eaec'; c.fillRect(wx - 5, wy - 7, 76, 9); c.fillRect(wx + 30, wy, 6, 96); }
  // tiled roofs below, with a ridge and a chimney
  const roof = (x0: number, y0: number, x1: number, ca: string, cb: string, rc: string) => { P(c, [[x0, H], [x0, y0], [x1, y0 - 30], [x1, H]], ca); for (let x = x0; x < x1; x += 46) P(c, [[x, H], [x, y0 - ((x - x0) / (x1 - x0)) * 30], [x + 22, y0 - ((x + 22 - x0) / (x1 - x0)) * 30], [x + 22, H]], cb); P(c, [[x0, y0], [x1, y0 - 30], [x1, y0 - 44], [x0, y0 - 14]], rc); };
  roof(-20, 860, 760, dusk ? '#7a3a4a' : '#9a5a46', dusk ? '#8e4856' : '#a8664e', dusk ? '#4a2c3e' : '#cdd6da'); P(c, [[360, 820], [420, 820], [420, 740], [360, 740]], dusk ? '#5a3040' : '#7a4a3e'); P(c, [[352, 744], [428, 744], [428, 724], [352, 724]], dusk ? '#3a2030' : '#5a463e');
  // a maple branch from the top left, leaves red and orange in two tones
  c.strokeStyle = dusk ? '#2a1a28' : '#3a2e28'; c.lineCap = 'butt';
  const twig = (x: number, y: number, a: number, l: number, w: number, d: number) => { const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); if (d > 0) { twig(x2, y2, a - 0.55 + r() * 0.2, l * 0.7, w * 0.62, d - 1); twig(x2, y2, a + 0.5 + r() * 0.2, l * 0.64, w * 0.6, d - 1); } else { leaf(c, x2, y2, 30 + r() * 12, r() * 6, r() < 0.5 ? (dusk ? '#c0402e' : '#d2562c') : (dusk ? '#e0782e' : '#e89a34'), dusk ? '#8a2a28' : '#a83a22'); } if (d === 1) leaf(c, x2, y2, 24, r() * 6, dusk ? '#d65a30' : '#e07a2c', dusk ? '#8a2a28' : '#a83a22'); };
  twig(230, 300, 0.42, 250, 15, 3);
});
export const CuaSo: React.FC<{state: 'sang' | 'chieu'}> = ({state}) => {
  const {x0, x1, y0, y1} = BX.window, w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, wood = '#efe9d6', woodD = '#c8bea4';
  return (
    <group>
      <mesh position={[cx + 0.3, cy, -1.0]}><planeGeometry args={[3.6, 2.88]} /><meshBasicMaterial map={outsideTex(state)} toneMapped={false} fog={false} /></mesh>
      <mesh position={[cx, cy, -0.06]} renderOrder={4}><planeGeometry args={[w, h]} /><meshBasicMaterial color="#cfe4ee" transparent opacity={0.14} depthWrite={false} toneMapped={false} /></mesh>
      {/* casing and sill */}
      <B p={[x0 - 0.05, cy, 0.03]} s={[0.1, h + 0.2, 0.07]} c={wood} /><B p={[x1 + 0.05, cy, 0.03]} s={[0.1, h + 0.2, 0.07]} c={wood} />
      <B p={[cx, y1 + 0.05, 0.03]} s={[w + 0.2, 0.1, 0.07]} c={wood} /><B p={[cx, y0 - 0.04, 0.09]} s={[w + 0.3, 0.06, 0.2]} c="#f6f1e2" /><B p={[cx, y0 - 0.09, 0.12]} s={[w + 0.34, 0.03, 0.2]} c={woodD} cast={false} />
      {/* glazing bars: a centre mullion, a transom, two sashes */}
      <B p={[cx, cy, -0.02]} s={[0.07, h, 0.06]} c={wood} /><B p={[cx, y0 + h * 0.72, -0.02]} s={[w, 0.06, 0.06]} c={wood} />
      {[0.25, 0.75].map((k) => <B key={k} p={[x0 + w * k, (y0 + y0 + h * 0.72) / 2, -0.02]} s={[0.025, h * 0.72, 0.03]} c={woodD} cast={false} />)}
      {[0.5].map((k) => <B key={k} p={[cx, y0 + h * k * 0.72, -0.02]} s={[w, 0.025, 0.03]} c={woodD} cast={false} />)}
      <B p={[cx - w / 4 - 0.12, y0 + h * 0.36, 0.005]} s={[0.025, 0.1, 0.03]} c="#c9a24a" cast={false} />
    </group>
  );
};

// ================================================================ rèm quanh giường: mảng phẳng ba sắc
/** The ward curtain on a rail over the bed, flat pleat strips in three tones; rem 0..1 = how far it is drawn from the head of the bed (0 = bunched at the head). */
export const Rem: React.FC<{rem?: number; sun?: boolean; state?: 'sang' | 'chieu'}> = ({rem = 0.55, sun = true, state = 'sang'}) => {
  const x0 = BX.bed.x0 - 0.1, x1 = BX.bed.x1 + 0.25, yTop = BX.railY, yBot = 0.42;
  const geo = useMemo(() => {
    const pos: number[] = [], col: number[] = [];
    const tones = (state === 'chieu' ? ['#a39aa0', '#8e858e', '#b4aab0'] : ['#a2aeb8', '#8e9aa6', '#b4c0c8']).map((h) => new THREE.Color(h));
    const bunch = 0.55, xe = x0 + bunch + rem * (x1 - x0 - bunch), n = Math.max(6, Math.round((xe - x0) / 0.1));
    const tri = (a: V3, b: V3, c2: V3, k: number) => { [a, b, c2].forEach((q) => pos.push(...q)); for (let i = 0; i < 3; i++) col.push(tones[k].r, tones[k].g, tones[k].b); };
    for (let i = 0; i < n; i++) {
      const xa = x0 + ((xe - x0) * i) / n, xb = x0 + ((xe - x0) * (i + 1)) / n, za = 0.06 + 0.02 * Math.sin(i * 1.9), zb = 0.06 + 0.02 * Math.sin((i + 1) * 1.9);
      const ya = yBot + 0.05 * Math.sin(i * 2.7), yb = yBot + 0.05 * Math.sin((i + 1) * 2.7), k = i % 3;
      tri([xa, yTop, za], [xb, yTop, zb], [xb, yb, zb], k); tri([xa, yTop, za], [xb, yb, zb], [xa, ya, za], k);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
  }, [rem, state]);
  const xe = x0 + 0.55 + rem * (x1 - x0 - 0.55);
  return (
    <group>
      <B p={[(x0 + x1) / 2, yTop + 0.03, 0.1]} s={[x1 - x0 + 0.1, 0.03, 0.03]} c="#3a3e42" />
      {Array.from({length: 9}, (_, i) => <B key={i} p={[x0 + ((xe - x0) * i) / 8, yTop + 0.03, 0.1]} s={[0.03, 0.045, 0.03]} c="#6a6e72" cast={false} />)}
      <mesh geometry={geo} castShadow receiveShadow><meshLambertMaterial vertexColors flatShading side={THREE.DoubleSide} /></mesh>
      {/* a slanted patch of low sun across the cloth, hard edged, two tones */}
      {sun ? <group position={[0, 0, 0.095]}>
        <mesh position={[0, 0, 0]} renderOrder={3}><shapeGeometry args={[(() => { const s = new THREE.Shape(); const a = Math.min(xe - 0.2, x0 + 1.6), b = Math.min(xe - 0.05, a + 0.6); s.moveTo(a, 2.05); s.lineTo(b, 2.05); s.lineTo(b - 0.7, 0.85); s.lineTo(a - 0.7, 0.85); s.closePath(); return s; })()]} /><meshBasicMaterial color={state === 'chieu' ? '#ffc890' : '#fff1c8'} transparent opacity={0.38} depthWrite={false} toneMapped={false} /></mesh>
      </group> : null}
    </group>
  );
};

// ================================================================ gương khung gỗ trong hốc tường, hộp phản chiếu, khăn phủ
/** The mirror: a frame of wood in the wall, a real BOX behind the glass (a false room, 1.8 m deep) so that a reflection is a figure standing at guongDiem(p). The wall hides anything outside the opening.
 *  khan = 0..1 how far a white cloth is drawn down over the glass (0 = none); lay = how much it sways (0..1); f = frame. children = the reflected figures. */
export const Guong: React.FC<{khan?: number; lay?: number; f?: number; children?: React.ReactNode; dim?: boolean}> = ({khan = 0, lay = 0, f = 0, children}) => {
  const {x0, x1, y0, y1} = BX.mirror, w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, deep = 1.8, wood = '#6e4a2e', woodL = '#8c6440';
  const back = useMemo(() => tex('bx-mirror-back2', 640, 640, (c, W, H) => {
    // the reflected room, painted over 5 x the mirror's size: cream wall, a sage dado at the mirror's own dado height, a window's glare
    c.fillStyle = '#e4ddc8'; c.fillRect(0, 0, W, H); c.fillStyle = '#93aa9d'; c.fillRect(0, H * 0.58, W, H * 0.42); c.fillStyle = '#4f6157'; c.fillRect(0, H * 0.56, W, 12); c.fillStyle = '#c9c1a8'; c.fillRect(0, H * 0.556, W, 5);
    P(c, [[W * 0.5, H * 0.12], [W * 0.86, H * 0.12], [W * 0.86, H * 0.5], [W * 0.5, H * 0.5]], '#8a7a62'); P(c, [[W * 0.52, H * 0.14], [W * 0.84, H * 0.14], [W * 0.84, H * 0.48], [W * 0.52, H * 0.48]], '#f1efe0');
    P(c, [[W * 0.52, H * 0.14], [W * 0.84, H * 0.14], [W * 0.84, H * 0.3], [W * 0.52, H * 0.3]], '#ffffff'); c.fillStyle = '#8a7a62'; c.fillRect(W * 0.68 - 3, H * 0.14, 6, H * 0.34);
  }), []);
  return (
    <group>
      {/* the room behind the glass: one big back panel (its sides would show as a tunnel), lit like the room */}
      <mesh position={[cx, cy, -deep]}><planeGeometry args={[w * 5, h * 5]} /><meshBasicMaterial map={back} color="#f2f0e8" toneMapped={false} fog={false} /></mesh>
      <pointLight position={[cx, cy + 0.2, -0.5]} color="#fff4e0" intensity={1.6} distance={3.2} decay={1.4} />
      {children}
      {/* the glass: two hard-edged pale streaks, nothing soft */}
      <mesh position={[cx, cy, -0.02]} renderOrder={8}><planeGeometry args={[w, h]} /><meshBasicMaterial color="#dfeef2" transparent opacity={0.1} depthWrite={false} toneMapped={false} /></mesh>
      <mesh position={[cx, cy, -0.015]} renderOrder={9}><shapeGeometry args={[(() => { const s = new THREE.Shape(); s.moveTo(x0 + 0.04 - cx, y1 - 0.04 - cy); s.lineTo(x0 + 0.16 - cx, y1 - 0.04 - cy); s.lineTo(x0 + 0.03 - cx, y1 - 0.34 - cy); s.lineTo(x0 + 0.02 - cx - 0.0, y1 - 0.3 - cy); s.closePath(); return s; })()]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} toneMapped={false} /></mesh>
      <mesh position={[cx, cy, -0.014]} renderOrder={9}><shapeGeometry args={[(() => { const s = new THREE.Shape(); s.moveTo(x0 + 0.2 - cx, y1 - 0.04 - cy); s.lineTo(x0 + 0.25 - cx, y1 - 0.04 - cy); s.lineTo(x0 + 0.1 - cx, y1 - 0.4 - cy); s.lineTo(x0 + 0.05 - cx, y1 - 0.4 - cy); s.closePath(); return s; })()]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.2} depthWrite={false} toneMapped={false} /></mesh>
      <mesh position={[cx, y1 - 0.022, -0.012]} renderOrder={9}><planeGeometry args={[w, 0.044]} /><meshBasicMaterial color="#3a3228" transparent opacity={0.16} depthWrite={false} toneMapped={false} /></mesh>
      <mesh position={[x0 + 0.016, cy, -0.012]} renderOrder={9}><planeGeometry args={[0.032, h]} /><meshBasicMaterial color="#3a3228" transparent opacity={0.12} depthWrite={false} toneMapped={false} /></mesh>
      {/* the frame, in front of the wall: four boards, a carved top, a ledge */}
      <B p={[x0 - 0.05, cy, 0.04]} s={[0.1, h + 0.2, 0.07]} c={wood} /><B p={[x1 + 0.05, cy, 0.04]} s={[0.1, h + 0.2, 0.07]} c={wood} />
      <B p={[cx, y1 + 0.05, 0.04]} s={[w + 0.2, 0.1, 0.07]} c={wood} /><B p={[cx, y0 - 0.05, 0.04]} s={[w + 0.2, 0.1, 0.07]} c={wood} />
      <B p={[cx, y1 + 0.13, 0.04]} s={[w + 0.3, 0.06, 0.08]} c={woodL} cast={false} /><B p={[cx, y1 + 0.2, 0.04]} s={[w * 0.5, 0.08, 0.07]} c={wood} cast={false} />
      <B p={[x0 - 0.05, cy, 0.08]} s={[0.025, h + 0.2, 0.01]} c={woodL} cast={false} /><B p={[x1 + 0.05, cy, 0.08]} s={[0.025, h + 0.2, 0.01]} c={woodL} cast={false} />
      <KhanPhu x={cx} yTop={y1 + 0.1} w={w + 0.02} drop={khan} lay={lay} f={f} />
    </group>
  );
};
/** A white cloth hung over the mirror's top: pleat strips in three whites, a hard zig-zag hem. drop 0..1 = how far down it hangs (1 covers the glass and the frame's foot); lay = sway. */
export const KhanPhu: React.FC<{x: number; yTop: number; w: number; drop: number; lay?: number; f?: number; z?: number}> = ({x, yTop, w, drop, lay = 0, f = 0, z = 0.09}) => {
  const geo = useMemo(() => {
    if (drop <= 0.001) return null;
    const pos: number[] = [], col: number[] = [], n = 10, tones = ['#f6f4ec', '#e4e2d8', '#ffffff'].map((h) => new THREE.Color(h)), len = drop * (yTop - BX.mirror.y0 + 0.1);
    const tri = (a: V3, b: V3, c2: V3, k: number) => { [a, b, c2].forEach((q) => pos.push(...q)); for (let i = 0; i < 3; i++) col.push(tones[k].r, tones[k].g, tones[k].b); };
    const bot = (i: number): V3 => [x - w / 2 + (w * i) / n + lay * 0.025 * Math.sin(f * 0.33 + i * 0.7), yTop - len * (0.92 + 0.08 * Math.sin(i * 2.4) + (i % 2 ? -0.05 : 0.04)) + lay * 0.012 * Math.sin(f * 0.4 + i), z + 0.03 * Math.sin(i * 1.7 + f * 0.25 * lay)];
    const top = (i: number): V3 => [x - w / 2 + (w * i) / n, yTop, z];
    for (let i = 0; i < n; i++) { tri(top(i), top(i + 1), bot(i + 1), i % 3); tri(top(i), bot(i + 1), bot(i), i % 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
  }, [drop, lay, f, x, yTop, w, z]);
  return geo ? <mesh geometry={geo} castShadow><meshLambertMaterial vertexColors flatShading side={THREE.DoubleSide} /></mesh> : null;
};

// ================================================================ chậu rửa, giá khăn
/** Wall basin under the mirror: a white half-bowl, a brass tap, a drain pipe, a tiled splash panel. Origin = floor, centre x. */
export const ChauRua: React.FC<{x?: number}> = ({x = 1.75}) => (
  <group position={[x, 0, 0]}>
    <B p={[0, 1.02, 0.015]} s={[0.66, 0.46, 0.03]} c="#f1efe6" /><B p={[0, 1.26, 0.03]} s={[0.7, 0.03, 0.04]} c="#c9c6b8" cast={false} />
    {[-0.22, -0.11, 0, 0.11, 0.22].map((a) => <B key={a} p={[a, 1.02, 0.032]} s={[0.006, 0.44, 0.004]} c="#cfccbf" cast={false} />)}
    <FacetLathe profile={[[0.0, 0.0], [0.15, 0.04], [0.26, 0.12], [0.27, 0.14]]} sides={10} color="#f4f2ea" pos={[0, 0.7, 0.2]} squash={0.9} contact={false} tones={[0.82, 1, 1.12]} />
    <B p={[0, 0.84, 0.05]} s={[0.56, 0.05, 0.1]} c="#f8f6ee" /><B p={[0, 0.73, 0.04]} s={[0.5, 0.18, 0.06]} c="#e4e1d6" />
    <B p={[0, 0.93, 0.07]} s={[0.04, 0.12, 0.04]} c="#c9a24a" /><B p={[0, 0.99, 0.12]} s={[0.04, 0.03, 0.12]} c="#d8b45a" cast={false} /><B p={[-0.1, 0.9, 0.07]} s={[0.04, 0.04, 0.04]} c="#6a8aa0" cast={false} /><B p={[0.1, 0.9, 0.07]} s={[0.04, 0.04, 0.04]} c="#a05a4a" cast={false} />
    <B p={[0, 0.4, 0.07]} s={[0.04, 0.5, 0.04]} c="#8a8f94" /><B p={[0.06, 0.18, 0.1]} s={[0.04, 0.3, 0.04]} c="#7a7f84" cast={false} /><B p={[0.03, 0.04, 0.1]} s={[0.14, 0.04, 0.04]} c="#7a7f84" cast={false} />
    <B p={[0, 0.2, 0.03]} s={[0.46, 0.03, 0.05]} c="#9a9ea4" cast={false} />
  </group>
);
/** A towel rail on the wall (two brass rods on brackets) with a white towel with blue stripes hung over it. */
export const GiaKhan: React.FC<{x?: number; khan?: boolean}> = ({x = 2.3, khan = true}) => (
  <group position={[x, 0, 0]}>
    {[-0.22, 0.22].map((a) => <B key={a} p={[a, 1.14, 0.06]} s={[0.03, 0.03, 0.1]} c="#c9a24a" />)}
    <B p={[0, 1.14, 0.1]} s={[0.5, 0.022, 0.022]} c="#d8b45a" /><B p={[0, 0.98, 0.1]} s={[0.5, 0.018, 0.018]} c="#d8b45a" cast={false} />
    {khan ? <group position={[0, 0, 0.115]}>
      <mesh position={[0.02, 0.9, 0]}><planeGeometry args={[0.34, 0.5]} /><meshLambertMaterial color="#f6f4ea" /></mesh><mesh position={[0.02, 1.11, 0.012]}><planeGeometry args={[0.34, 0.08]} /><meshLambertMaterial color="#e4e2d6" /></mesh>
      {[0.8, 0.84].map((y) => <mesh key={y} position={[0.02, y, 0.003]}><planeGeometry args={[0.34, 0.014]} /><meshLambertMaterial color="#4a6aa0" /></mesh>)}
      <mesh position={[-0.05, 0.7, 0.002]} rotation={[0, 0, 0.1]}><planeGeometry args={[0.16, 0.04]} /><meshLambertMaterial color="#d8d6ca" /></mesh>
    </group> : null}
  </group>
);

// ================================================================ giường, bàn đầu giường, bình nước, cốc, lá thư
/** The ward bed along the wall: iron head (left) and foot, thin white mattress, turned-down sheet, a pillow, a folded grey-blue blanket at the foot. Made, not rumpled (a person sits on it). */
export const GiuongBenh: React.FC = () => {
  const {x0, x1, z0, z1, top} = BX.bed, iron = '#343a40', zc = (z0 + z1) / 2, W = z1 - z0;
  const end = (x: number, h: number, bars: number) => <group position={[x, 0, zc]}>
    {[-W / 2 + 0.02, W / 2 - 0.02].map((z) => <B key={z} p={[0, h / 2, z]} s={[0.04, h, 0.04]} c={iron} />)}
    <B p={[0, h, 0]} s={[0.045, 0.045, W]} c={iron} /><B p={[0, 0.36, 0]} s={[0.03, 0.03, W]} c={iron} /><B p={[0, h - 0.18, 0]} s={[0.025, 0.025, W]} c={iron} cast={false} />
    {Array.from({length: bars}, (_, i) => <B key={i} p={[0, (0.36 + h - 0.18) / 2 + 0.05, -W / 2 + 0.07 + (i * (W - 0.14)) / (bars - 1)]} s={[0.02, h - 0.5, 0.02]} c={iron} cast={false} />)}
    {[-W / 2 + 0.02, W / 2 - 0.02].map((z) => <B key={`k${z}`} p={[0, h + 0.04, z]} s={[0.06, 0.06, 0.06]} c="#c9a24a" cast={false} />)}
  </group>;
  return (
    <group>
      {end(x0 + 0.03, 1.05, 7)}{end(x1 - 0.03, 0.8, 6)}
      {[z0 + 0.03, z1 - 0.03].map((z) => <B key={z} p={[(x0 + x1) / 2, 0.36, z]} s={[x1 - x0 - 0.06, 0.05, 0.03]} c={iron} />)}
      <B p={[(x0 + x1) / 2, top - 0.075, zc]} s={[x1 - x0 - 0.1, 0.15, W - 0.04]} c="#e9e4d2" /><B p={[(x0 + x1) / 2, top - 0.145, zc]} s={[x1 - x0 - 0.08, 0.02, W - 0.02]} c="#c7c0aa" cast={false} />
      <B p={[x0 + 0.42, top + 0.055, zc]} s={[0.5, 0.1, 0.5]} c="#f6f3e8" r={[0, 0, 0.05]} /><B p={[x0 + 0.42, top + 0.012, zc + 0.255]} s={[0.5, 0.03, 0.012]} c="#d9d5c4" cast={false} />
      <B p={[x0 + 1.25, top + 0.012, zc]} s={[1.2, 0.025, W - 0.08]} c="#f1eee2" /><B p={[x0 + 0.83, top + 0.02, zc]} s={[0.1, 0.03, W - 0.04]} c="#dcd8c8" cast={false} />
      <B p={[x1 - 0.5, top + 0.06, zc]} s={[0.62, 0.1, W - 0.06]} c="#8fa0b0" /><B p={[x1 - 0.5, top + 0.112, zc]} s={[0.6, 0.012, W - 0.1]} c="#a3b3c2" cast={false} /><B p={[x1 - 0.5, top + 0.06, z1 - 0.02]} s={[0.62, 0.1, 0.012]} c="#6e7e8e" cast={false} />
    </group>
  );
};
/** The bedside table: a plain painted cabinet, two drawers, a shelf below. Children are laid on its top, in coordinates with the origin at the top's centre (x right, y up, z towards the lens). */
export const BanDauGiuong: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const {x0, x1, d, h} = BX.table, cx = (x0 + x1) / 2, w = x1 - x0, zc = 0.1 + d / 2;
  return (
    <group>
      <B p={[cx, h - 0.02, zc]} s={[w + 0.04, 0.04, d + 0.04]} c="#d7d3c0" /><B p={[cx, h - 0.045, zc + d / 2 + 0.02]} s={[w + 0.04, 0.012, 0.012]} c="#a9a590" cast={false} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <B key={i} p={[cx + a * (w / 2 - 0.02), (h - 0.04) / 2, zc + b * (d / 2 - 0.02)]} s={[0.035, h - 0.04, 0.035]} c="#bfbba6" />)}
      <B p={[cx, h - 0.2, zc]} s={[w - 0.04, 0.32, d - 0.04]} c="#e4e1d2" />
      <B p={[cx, h - 0.2, zc + d / 2 - 0.018]} s={[w - 0.08, 0.28, 0.012]} c="#cfcbb8" cast={false} /><B p={[cx, h - 0.2, zc + d / 2 - 0.01]} s={[0.04, 0.012, 0.012]} c="#c9a24a" cast={false} />
      <B p={[cx, 0.2, zc]} s={[w - 0.04, 0.025, d - 0.06]} c="#c3bfaa" /><B p={[cx, 0.05, zc]} s={[w - 0.04, 0.025, d - 0.06]} c="#c3bfaa" cast={false} />
      <group position={[cx, h, zc]}>{children}</group>
    </group>
  );
};
/** A glass water jug, cut from flat sheets: pale glass body, the water as a flat polygon with a rippling top edge in two blues, a handle, a spout. rung 0..1 = the ripple's strength (0 = calm, a faint wave remains). Origin = its foot. */
export const BinhNuoc: React.FC<{f?: number; rung?: number; level?: number; s?: number}> = ({f = 0, rung = 0, level = 0.62, s = 1}) => {
  const PR: [number, number][] = [[0, 0.07], [0.03, 0.078], [0.1, 0.083], [0.17, 0.076], [0.22, 0.058], [0.26, 0.055], [0.29, 0.064], [0.3, 0.068]];
  const hw = (y: number) => { for (let i = 1; i < PR.length; i++) if (y <= PR[i][0]) { const t = (y - PR[i - 1][0]) / (PR[i][0] - PR[i - 1][0]); return PR[i - 1][1] + (PR[i][1] - PR[i - 1][1]) * t; } return PR[PR.length - 1][1]; };
  const body = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(-PR[0][1], 0); PR.forEach(([y, w]) => sh.lineTo(w, y)); [...PR].reverse().forEach(([y, w]) => sh.lineTo(-w, y)); sh.closePath(); return new THREE.ShapeGeometry(sh); }, []);
  const shade = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(PR[0][1] * 0.35, 0); PR.forEach(([y, w]) => sh.lineTo(w, y)); [...PR].reverse().forEach(([y, w]) => sh.lineTo(w * 0.35, y)); sh.closePath(); return new THREE.ShapeGeometry(sh); }, []);
  const L = 0.3 * level * 0.8, amp = 0.004 + 0.016 * rung, ph = f * 0.55, k = 2 * Math.PI / 0.075;
  const wave = (yy: number, a: number, ph2: number, thick: number, inset: number) => { const sh = new THREE.Shape(), n = 12, w0 = hw(yy) - inset; sh.moveTo(-w0, yy + a * Math.sin(k * -w0 + ph2)); for (let i = 1; i <= n; i++) { const x = -w0 + (2 * w0 * i) / n; sh.lineTo(x, yy + a * Math.sin(k * x + ph2)); } for (let i = n; i >= 0; i--) { const x = -w0 + (2 * w0 * i) / n; sh.lineTo(x, yy - thick + a * Math.sin(k * x + ph2)); } sh.closePath(); return new THREE.ShapeGeometry(sh); };
  const water = useMemo(() => {
    const sh = new THREE.Shape(), edge = 0.005, ys = PR.map((q) => q[0]).filter((y) => y < L); sh.moveTo(-hw(0) + edge, 0.004); ys.forEach((y) => sh.lineTo(hw(y) - edge, y + 0.004));
    const n = 14, hwl = hw(L) - edge; for (let i = 0; i <= n; i++) { const x = hwl - (2 * hwl * i) / n, e = 1 - Math.pow(Math.abs(x) / hwl, 4); sh.lineTo(x, L + amp * e * Math.sin(k * x + ph)); }
    [...ys].reverse().forEach((y) => sh.lineTo(-hw(y) + edge, y + 0.004)); sh.closePath(); return new THREE.ShapeGeometry(sh);
  }, [L, amp, ph]);
  const rip1 = useMemo(() => wave(L - 0.03, 0.004 + 0.012 * rung, ph * 1.3 + 1, 0.007, 0.012), [L, rung, ph]), rip2 = useMemo(() => wave(L - 0.065, 0.003 + 0.01 * rung, ph * 0.9 + 3, 0.006, 0.02), [L, rung, ph]);
  const shine = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(-0.05, 0.06); sh.lineTo(-0.03, 0.06); sh.lineTo(-0.036, 0.19); sh.lineTo(-0.052, 0.2); sh.closePath(); return new THREE.ShapeGeometry(sh); }, []);
  return (
    <group scale={s}>
      <mesh geometry={body}><meshLambertMaterial color="#c3dce2" /></mesh>
      <mesh geometry={shade} position={[0, 0, 0.001]}><meshLambertMaterial color="#a9c8d1" /></mesh>
      <mesh geometry={water} position={[0, 0, 0.002]}><meshLambertMaterial color="#5f98b6" /></mesh>
      <mesh geometry={rip1} position={[0, 0, 0.003]}><meshLambertMaterial color="#9ccbdc" /></mesh>
      <mesh geometry={rip2} position={[0, 0, 0.003]}><meshLambertMaterial color="#8abbd0" /></mesh>
      <mesh position={[0, L + 0.002, 0.0035]}><planeGeometry args={[hw(L) * 1.5, 0.006]} /><meshLambertMaterial color="#c8e6f0" /></mesh>
      <mesh geometry={shine} position={[0, 0, 0.004]}><meshBasicMaterial color="#ffffff" transparent opacity={0.6} toneMapped={false} /></mesh>
      <mesh position={[-0.062, 0.3, 0.002]} rotation={[0, 0, 0.9]}><planeGeometry args={[0.05, 0.016]} /><meshLambertMaterial color="#b3cdd3" /></mesh>
      <mesh position={[0.075, 0.18, -0.001]}><ringGeometry args={[0.05, 0.064, 7, 1, -1.5, 3]} /><meshLambertMaterial color="#b9d3d9" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.3, 0.002]}><planeGeometry args={[0.145, 0.012]} /><meshLambertMaterial color="#8fb3bc" /></mesh>
    </group>
  );
};
/** A drinking glass: a faceted tumbler, water inside as a lighter band. rung 0..1 shakes it. Origin = its foot. */
export const Coc: React.FC<{f?: number; rung?: number; s?: number}> = ({f = 0, rung = 0, s = 1}) => (
  <group scale={s} rotation={[0, 0, rung * 0.05 * Math.sin(f * 1.3)]} position={[rung * 0.004 * Math.sin(f * 1.7), 0, 0]}>
    <FacetLathe profile={[[0.034, 0], [0.04, 0.0], [0.046, 0.045], [0.052, 0.1]]} sides={7} color="#cde0df" contact={false} tones={[0.88, 1, 1.12]} />
    <FacetLathe profile={[[0.034, 0.004], [0.042, 0.03], [0.047, 0.062]]} sides={7} color="#8fbfd0" contact={false} cast={false} tones={[0.95, 1.05, 1.15]} />
    <mesh position={[0, 0.066, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.047, 7]} /><meshLambertMaterial color="#b6dbe6" /></mesh>
  </group>
);
const thuTex = () => tex('bx-thu', 480, 640, (c, W, H) => {
  c.fillStyle = '#f4ecd6'; c.fillRect(0, 0, W, H); c.fillStyle = '#e6dcc0'; c.fillRect(0, 0, 10, H); c.fillRect(W - 10, 0, 10, H); c.fillRect(0, 0, W, 10);
  c.fillStyle = 'rgba(0,0,0,0.05)'; c.fillRect(0, H / 2 - 2, W, 4);                                                                 // the fold
  // crest: a shield in navy, a gold tower, a gold band, two sprigs
  const cx = W / 2, cy = 112; P(c, [[cx - 54, cy - 62], [cx + 54, cy - 62], [cx + 54, cy + 14], [cx, cy + 66], [cx - 54, cy + 14]], '#243a66'); P(c, [[cx - 54, cy - 62], [cx, cy - 62], [cx, cy + 66], [cx - 54, cy + 14]], '#2f4a80');
  P(c, [[cx - 20, cy + 22], [cx - 20, cy - 24], [cx - 28, cy - 24], [cx - 28, cy - 38], [cx - 10, cy - 38], [cx - 10, cy - 30], [cx + 10, cy - 30], [cx + 10, cy - 38], [cx + 28, cy - 38], [cx + 28, cy - 24], [cx + 20, cy - 24], [cx + 20, cy + 22]], '#d9b24e');
  c.fillStyle = '#243a66'; c.fillRect(cx - 7, cy - 2, 14, 24); P(c, [[cx - 54, cy - 62], [cx + 54, cy - 62], [cx + 54, cy - 52], [cx - 54, cy - 52]], '#d9b24e');
  [-1, 1].forEach((k) => { for (let i = 0; i < 4; i++) P(c, [[cx + k * (66 + i * 6), cy + 24 - i * 18], [cx + k * (84 + i * 6), cy + 14 - i * 18], [cx + k * (70 + i * 6), cy + 10 - i * 18]], '#6a8a5a'); });
  c.fillStyle = '#243a66'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `bold 34px ${SERIF}`; c.fillText('ĐẠI HỌC', cx, 204); c.font = `20px ${SERIF}`; c.fillText('VĂN PHÒNG HIỆU TRƯỞNG', cx, 234);
  c.fillStyle = '#243a66'; c.fillRect(60, 252, W - 120, 4);
  c.fillStyle = 'rgba(40,40,60,0.55)'; for (let i = 0; i < 9; i++) c.fillRect(64, 290 + i * 28, (W - 128) * (i === 8 ? 0.4 : 0.9 - (i % 3) * 0.07), 8);
  c.strokeStyle = '#243a66'; c.lineWidth = 3; c.beginPath(); c.moveTo(W - 220, H - 62); c.quadraticCurveTo(W - 180, H - 110, W - 150, H - 66); c.quadraticCurveTo(W - 120, H - 40, W - 90, H - 80); c.stroke();
  // the red stamp: double ring, EXPELLED across the middle, a star each side, slightly crooked and not quite filled
  c.save(); c.translate(W * 0.5, H * 0.62); c.rotate(-0.2); c.strokeStyle = '#b32a24'; c.lineWidth = 9; c.beginPath(); c.arc(0, 0, 118, 0.08, 6.2); c.stroke(); c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 100, 0.2, 6.1); c.stroke();
  c.fillStyle = '#b32a24'; c.fillRect(-100, -38, 200, 76); c.fillStyle = '#f4ecd6'; c.font = `bold 40px ${SERIF}`; c.fillText('ĐUỔI HỌC', 0, 4); c.font = `20px ${SERIF}`; c.fillStyle = '#b32a24'; c.fillText('★   ★   ★', 0, 70); c.fillText('1 9 0 8', 0, -68); c.restore();
});
/** The expulsion letter: cream paper, a navy crest with a gold tower, a few ruled lines of text, a red stamp "ĐUỔI HỌC". Origin = the middle of its foot; stands upright, leaning back by `back` and sideways by `lean` (radians; positive leans to the right). */
export const LaThu: React.FC<{lean?: number; back?: number; s?: number}> = ({lean = 0.2, back = 0.2, s = 1}) => {
  const w = 0.2, h = 0.27;
  return (
    <group scale={s} rotation={[-back, 0, -lean]}>
      <group position={[0, h / 2, 0]}>
        <mesh><planeGeometry args={[w, h]} /><meshLambertMaterial map={thuTex()} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0.004, -0.004, -0.001]}><planeGeometry args={[w, h]} /><meshLambertMaterial color="#8a7e62" /></mesh>
      </group>
    </group>
  );
};

// ================================================================ tờ tính trên tường, vòng đỏ
/** A hand-drawn red ring (marker line, flat), drawn on over `ve` 0..1. In the parent's plane: centre (x, y), width w, height h, metres. */
export const VongDo: React.FC<{x: number; y: number; w: number; h: number; ve?: number; z?: number; color?: string; width?: number; seed?: number}> = ({x, y, w, h, ve = 1, z = 0.01, color = '#c4271f', width = 0.012, seed = 3}) => {
  const geo = useMemo(() => {
    if (ve <= 0.001) return null;
    const r = rnd(seed), N = 64, tot = Math.round(N * 1.14), pts: number[][] = [], wob = Array.from({length: N + 12}, () => 0.94 + r() * 0.12);
    for (let i = 0; i <= Math.round(tot * Math.min(1, ve)); i++) { const t = (i / N) * Math.PI * 2 + 3.9, m = wob[i] * (1 - 0.06 * (i / N)); pts.push([Math.cos(t) * (w / 2) * m + 0.005 * Math.sin(i * 0.4), Math.sin(t) * (h / 2) * m]); }
    if (pts.length < 2) return null;
    const pos: number[] = [], idx: number[] = [];
    pts.forEach((p, i) => { const q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, tw = width * (0.8 + 0.5 * Math.sin(i * 0.37 + 1)); pos.push(p[0] + nx * tw / 2, p[1] + ny * tw / 2, 0, p[0] - nx * tw / 2, p[1] - ny * tw / 2, 0); if (i) { const a = i * 2; idx.push(a - 2, a, a - 1, a - 1, a, a + 1); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }, [ve, w, h, width, seed]);
  return geo ? <mesh geometry={geo} position={[x, y, z]} renderOrder={7}><meshBasicMaterial color={color} side={THREE.DoubleSide} toneMapped={false} /></mesh> : null;
};
/** Where the wrong figures are on the calculation sheet, as fractions of the sheet (x from the left, y from the top; line 3 and line 5 of CALC_LINES, "9 210"). For VongDo. */
export const TO_VONG = {dong3: {x: 0.37, line: 2, w: 0.26}, dong5: {x: 0.66, line: 4, w: 0.27}};
/** The calculation sheet pinned to the wall (x 2.6, y 1.3-1.7). children are in the sheet's own plane (origin = its centre, metres). */
export const ToTinh: React.FC<{vong?: {dong3?: number; dong5?: number}; children?: React.ReactNode; pos?: V3; w?: number; h?: number}> = ({vong, children, pos = [BX.sheet.x, BX.sheet.y, 0.012], w = BX.sheet.w, h = BX.sheet.h}) => {
  const at = (fx: number, line: number): [number, number] => [-w / 2 + fx * w, h / 2 - CALC_LINES.y[line] * h];
  return (
    <group position={pos} rotation={[0, 0, -0.03]}>
      <mesh receiveShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={calcSheetTex()} /></mesh>
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([a, b], i) => <mesh key={i} position={[a * (w / 2 - 0.02), b * (h / 2 - 0.02), 0.006]}><circleGeometry args={[0.011, 6]} /><meshLambertMaterial color="#c8372d" /></mesh>)}
      {vong?.dong3 ? <VongDo x={at(TO_VONG.dong3.x, 2)[0]} y={at(0, 2)[1]} w={TO_VONG.dong3.w * w} h={0.06} ve={vong.dong3} z={0.012} seed={5} /> : null}
      {vong?.dong5 ? <VongDo x={at(TO_VONG.dong5.x, 4)[0]} y={at(0, 4)[1]} w={TO_VONG.dong5.w * w} h={0.058} ve={vong.dong5} z={0.012} seed={9} /> : null}
      {children}
    </group>
  );
};

// ================================================================ đồ trang trí tường và tủ thuốc
export const DongHo: React.FC<{pos: V3; r?: number}> = ({pos, r = 0.17}) => {
  const map = useMemo(() => tex('bx-clock', 256, 256, (c, W) => {
    c.fillStyle = '#4a3a2c'; c.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * 6.283; c.lineTo(W / 2 + Math.cos(a) * W / 2, W / 2 + Math.sin(a) * W / 2); } c.fill();
    c.fillStyle = '#f4efdc'; c.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * 6.283; c.lineTo(W / 2 + Math.cos(a) * W * 0.43, W / 2 + Math.sin(a) * W * 0.43); } c.fill();
    c.fillStyle = '#2f2a24'; for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.283; c.save(); c.translate(W / 2 + Math.cos(a) * W * 0.36, W / 2 + Math.sin(a) * W * 0.36); c.rotate(a); c.fillRect(-9, -3, 18, 6); c.restore(); }
    c.strokeStyle = '#2f2a24'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(W / 2, W / 2); c.lineTo(W / 2 + 40, W / 2 - 52); c.stroke(); c.lineWidth = 6; c.beginPath(); c.moveTo(W / 2, W / 2); c.lineTo(W / 2 - 18, W / 2 + 74); c.stroke();
  }), []);
  return <mesh position={pos}><planeGeometry args={[r * 2, r * 2]} /><meshLambertMaterial map={map} transparent /></mesh>;
};
/** A white medicine cabinet against the wall: glazed doors, three shelves of bottles in flat colours, a red cross. */
export const TuThuoc: React.FC = () => {
  const {x0, x1} = BX.cabinet, w = x1 - x0, cx = (x0 + x1) / 2;
  const cols = ['#7a4a2c', '#2f6a5a', '#c9a24a', '#5a7aa0', '#9a3a30', '#e0d8b8'];
  return (
    <group>
      <B p={[cx, 1.2, 0.17]} s={[w, 2.2, 0.3]} c="#eceadf" /><B p={[cx, 2.33, 0.17]} s={[w + 0.08, 0.06, 0.34]} c="#d4d1c2" cast={false} /><B p={[cx, 0.12, 0.17]} s={[w + 0.04, 0.08, 0.32]} c="#cfccbc" cast={false} />
      <B p={[cx, 1.3, 0.326]} s={[w - 0.1, 1.76, 0.012]} c="#9ebac4" cast={false} />
      {[0, 1, 2].map((s) => <group key={s}><B p={[cx, 0.7 + s * 0.55, 0.33]} s={[w - 0.1, 0.02, 0.05]} c="#cfccbc" cast={false} />
        {Array.from({length: 6}, (_, i) => <B key={i} p={[x0 + 0.1 + i * 0.09, 0.78 + s * 0.55 + (i % 3) * 0.02, 0.336]} s={[0.05, 0.12 + (i % 3) * 0.04, 0.02]} c={cols[(i + s * 2) % 6]} cast={false} />)}</group>)}
      <B p={[cx, 1.3, 0.34]} s={[0.012, 1.76, 0.012]} c="#6a6d70" cast={false} />
      <B p={[cx, 2.12, 0.34]} s={[0.07, 0.2, 0.006]} c="#b32a24" cast={false} /><B p={[cx, 2.12, 0.34]} s={[0.2, 0.07, 0.006]} c="#b32a24" cast={false} />
    </group>
  );
};

// ================================================================ MÓN CỦA CẢNH `Lab` (chương 7): truyền qua `extra` / `children`, không đổi Lab
/** A clipboard with the calculation sheet, standing on the desk and leaning back on a wooden strut. Origin = its foot (the desk top), facing +z. vong = how drawn-on the two red rings are (0..1 each). */
export const GiaKep: React.FC<{vong?: {dong3?: number; dong5?: number}; s?: number; rotY?: number}> = ({vong, s = 1, rotY = 0}) => {
  const bw = 0.3, bh = 0.4, sw = 0.27, sh = 0.354;
  return (
    <group scale={s} rotation={[0, rotY, 0]}>
      <group rotation={[-0.3, 0, 0]}>
        <B p={[0, bh / 2, 0]} s={[bw, bh, 0.014]} c="#8a6a48" /><B p={[0, bh / 2, 0.008]} s={[bw - 0.03, bh - 0.03, 0.004]} c="#9a7a56" cast={false} />
        <group position={[0, bh / 2 - 0.0, 0.012]}>
          <mesh position={[0, -0.005, 0]}><planeGeometry args={[sw, sh]} /><meshLambertMaterial map={calcSheetTex()} /></mesh>
          <B p={[0, sh / 2 - 0.018, 0.008]} s={[0.14, 0.05, 0.012]} c="#a7aeb6" /><B p={[0, sh / 2 + 0.01, 0.01]} s={[0.1, 0.02, 0.014]} c="#c4cad0" cast={false} /><B p={[-0.04, sh / 2 - 0.018, 0.016]} s={[0.012, 0.012, 0.01]} c="#6a6f74" cast={false} />
          {vong?.dong3 ? <VongDo x={-sw / 2 + TO_VONG.dong3.x * sw} y={sh / 2 - CALC_LINES.y[2] * sh - 0.005} w={TO_VONG.dong3.w * sw} h={0.05} ve={vong.dong3} z={0.006} seed={5} width={0.008} /> : null}
          {vong?.dong5 ? <VongDo x={-sw / 2 + TO_VONG.dong5.x * sw} y={sh / 2 - CALC_LINES.y[4] * sh - 0.005} w={TO_VONG.dong5.w * sw} h={0.05} ve={vong.dong5} z={0.006} seed={9} width={0.008} /> : null}
        </group>
      </group>
      <B p={[0, 0.07, -0.15]} s={[0.04, 0.14, 0.012]} c="#6a4c30" r={[0.3, 0, 0]} cast={false} />
    </group>
  );
};
const cynthiaTex = () => tex('bx-cynthia-blank', 400, 500, (c, W, H) => {
  c.fillStyle = '#efe4c8'; c.fillRect(0, 0, W, H); const x0 = 34, y0 = 34, w = W - 68, h = H - 68;
  c.fillStyle = '#b79a72'; c.fillRect(x0, y0, w, h); c.fillStyle = '#c9b08a'; c.fillRect(x0, y0, w, h * 0.55); c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
  const cx = W / 2;
  P(c, [[cx - 180, H], [cx - 150, 360], [cx - 70, 310], [cx, 330], [cx + 70, 310], [cx + 150, 360], [cx + 180, H]], '#6e3f47'); P(c, [[cx - 60, 316], [cx, 400], [cx + 60, 316], [cx + 30, 312], [cx, 350], [cx - 30, 312]], '#3a2a2e');
  c.fillStyle = '#d9b892'; c.fillRect(cx - 26, 250, 52, 70);
  c.beginPath(); c.moveTo(cx - 72, 196); c.lineTo(cx - 36, 112); c.lineTo(cx + 36, 112); c.lineTo(cx + 72, 196); c.lineTo(cx + 50, 276); c.lineTo(cx - 50, 276); c.closePath(); c.fillStyle = '#e4c4a0'; c.fill();      // the face: left blank
  c.restore();
  c.fillStyle = 'rgba(150,110,60,0.16)'; c.fillRect(x0, y0, w, h); c.strokeStyle = 'rgba(90,70,40,0.4)'; c.lineWidth = 3; c.strokeRect(x0, y0, w, h);
});
/** Cynthia's photograph in a standing frame, the face left BLANK (a flat oval); children are drawn over it in the photo's own plane (origin = the face's centre, metres; the photo is 0.22 x 0.28). Origin = the frame's foot, facing +z. */
export const AnhCynthia: React.FC<{s?: number; rotY?: number; tilt?: number; children?: React.ReactNode}> = ({s = 1, rotY = 0, tilt = 0.16, children}) => {
  const pw = 0.22, ph = 0.28;
  return (
    <group scale={s} rotation={[0, rotY, 0]}>
      <group rotation={[-tilt, 0, 0]}>
        <B p={[0, 0.19, 0]} s={[0.3, 0.38, 0.02]} c="#5a3a24" /><B p={[0, 0.19, 0.012]} s={[0.27, 0.35, 0.006]} c="#8c6440" cast={false} />
        <mesh position={[0, 0.19, 0.016]}><planeGeometry args={[pw, ph]} /><meshLambertMaterial map={cynthiaTex()} /></mesh>
        <group position={[0, 0.19 + ph * (0.5 - 0.392), 0.022]}>{children}</group>
        <mesh position={[0, 0.19, 0.0165]}><planeGeometry args={[pw, ph]} /><meshBasicMaterial transparent opacity={0} /></mesh>
        <mesh position={[0.07, 0.3, 0.0168]} renderOrder={5}><shapeGeometry args={[(() => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.035, 0); sh.lineTo(-0.045, -0.12); sh.lineTo(-0.065, -0.12); sh.closePath(); return sh; })()]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.28} depthWrite={false} toneMapped={false} /></mesh>
      </group>
      <B p={[0, 0.16, -0.15]} s={[0.04, 0.32, 0.012]} c="#4a2e1c" r={[0.5, 0, 0]} cast={false} />
    </group>
  );
};
/** A plain wooden chair for behind the desk, facing +z (the lens): seat 0.46, a back of two rails and slats. Origin = the floor under the seat's centre. */
export const GheBan: React.FC<{rotY?: number}> = ({rotY = 0}) => (
  <group rotation={[0, rotY, 0]}>
    <B p={[0, 0.46, 0]} s={[0.42, 0.04, 0.4]} c="#9a7650" /><B p={[0, 0.435, 0.0]} s={[0.4, 0.02, 0.38]} c="#7a5a3c" cast={false} />
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <B key={i} p={[a * 0.18, 0.22, b * 0.17]} s={[0.035, 0.44, 0.035]} c="#6a4c30" />)}
    <B p={[0, 0.2, 0.17]} s={[0.36, 0.02, 0.02]} c="#6a4c30" cast={false} />
    {[-1, 1].map((a) => <B key={a} p={[a * 0.18, 0.74, -0.17]} s={[0.035, 0.56, 0.035]} c="#6a4c30" />)}
    <B p={[0, 0.98, -0.17]} s={[0.4, 0.07, 0.03]} c="#7a5a3c" />
    {[-0.1, 0, 0.1].map((a) => <B key={a} p={[a, 0.76, -0.17]} s={[0.05, 0.36, 0.015]} c="#8a6a48" cast={false} />)}
  </group>
);
/** Marks and sizes for the Lab pieces (room units of `Lab`; desk at (4.65, 0, 2.2), top 0.8): pass them through `extra`. */
export const LAB_THEM = {
  giaKep: [5.25, 0.8, 2.25] as V3,
  gheBan: [4.65, 0, 1.46] as V3,
  anh: [3.95, 0.8, 2.22] as V3,
  reedBan: [5.7, 0, 2.9] as V3,
};

// ================================================================ hạt bụi trong nắng
export const BuiNang: React.FC<{f: number; state?: 'sang' | 'chieu'}> = ({f, state = 'sang'}) => {
  const r = useMemo(() => rnd(11), []);
  void r;
  return <Halo pos={[6.5, 1.9, 0.2]} r={state === 'chieu' ? 1.5 : 1.2} color={state === 'chieu' ? '#ff9a58' : '#fff0c8'} strength={state === 'chieu' ? 0.28 : 0.16} order={3} />;
};
