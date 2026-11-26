import React, {useMemo, useLayoutEffect, useRef} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Halo} from './look';
import {rnd, Ctx} from './depth';
import {tex, popScale} from './kitLab';
import {paintOldPaper} from './kitBanDo';

/** lib3/kitGiayTo: PAPER GRAPHICS in the channel's insert style (old paper with depth, brown ink, hand-writing big enough to
 *  read, things popping in with `popScale`). Made for d1c5 (23/11/2026): the newspaper (shot 10), the letter of invitation
 *  with its round stamp (shot 11, held in 12-13; chapter 7 re-uses the crest and the stamp), the notebook page (shot 17), the
 *  thought bubble with a small figure in it (shot 5), and the dark wood desk they lie on.
 *  Every sheet stands in the x-y plane facing +z, centred on its `pos`; the camera looks straight at it (`paperEye`).
 *  The sheets use unlit materials (a graphic is never in shadow); depth comes from the paint (fibres, foxing, creases, a lit
 *  edge and a cast shadow on the desk). */
type V3 = [number, number, number];
export const INK = '#3e2818', INK_BLUE = '#1f3a6e', RED = '#c3302a';
/** the hand used for writing on paper (the same as the maps') */
export const HAND = '"Chalkboard SE", "Noteworthy", "Comic Sans MS", cursive';
const SERIF = 'Georgia, "Times New Roman", serif';
const blob = (c: Ctx, x: number, y: number, rad: number, col: string) => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
const ease = (x: number) => { const q = Math.min(1, Math.max(0, x)); return q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2; };
const clamp = (x: number) => Math.min(1, Math.max(0, x));

/** Where the camera stands to see a sheet `h` tall at `share` of the frame height, centred on (x, y) of the plane z = 0. */
export const paperEye = (h: number, share = 0.7, x = 0, y = 0): V3 => [x, y, h / share / 0.4986];

// ================================================================ the desk
/** DARK WOOD DESK the inserts lie on: wide planks of walnut, the grain running along them in two tones, knots, the seams
 *  between the planks dark with a lit edge, scratches, an ink blot, a ring from a cup, the light pooling in the middle and
 *  falling off to the corners. w x h metres; it fills any frame behind a sheet. */
export const deskTex = () => tex('paper-desk-walnut', 2048, 1280, (c, W, H) => {
  const r = rnd(41), plank = H / 6;
  for (let k = 0; k < 6; k++) {
    const y0 = k * plank, base = ['#6e4a30', '#7a5232', '#684630', '#744c31', '#80592f', '#6a472e'][k];
    c.fillStyle = base; c.fillRect(0, y0, W, plank);
    for (let q = 0; q < 70; q++) { const y = y0 + r() * plank, a = 0.6 + r() * 1.6; c.strokeStyle = r() < 0.5 ? `rgba(30,18,10,${0.12 + r() * 0.16})` : `rgba(140,96,58,${0.08 + r() * 0.12})`; c.lineWidth = 1 + r() * 3; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= W; x += 64) c.lineTo(x, y + Math.sin(x / (180 + r() * 40) + q) * a * 4); c.stroke(); }
    for (let q = 0; q < 2; q++) { const x = r() * W, y = y0 + plank * (0.3 + r() * 0.4); c.fillStyle = 'rgba(30,16,8,0.6)'; c.beginPath(); c.ellipse(x, y, 16 + r() * 12, 7 + r() * 4, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(30,16,8,0.3)'; c.lineWidth = 2; for (let j = 1; j < 5; j++) { c.beginPath(); c.ellipse(x, y, 16 + j * 14, 7 + j * 6, 0, 0, 7); c.stroke(); } }
    c.fillStyle = 'rgba(18,10,6,0.8)'; c.fillRect(0, y0, W, 4); c.fillStyle = 'rgba(160,116,74,0.35)'; c.fillRect(0, y0 + 4, W, 2);
    for (let q = 0; q < 3; q++) { const x = r() * W; c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(x, y0 + plank * 0.5, 6, 0, 7); c.fill(); c.fillStyle = 'rgba(200,160,110,0.4)'; c.beginPath(); c.arc(x - 1.5, y0 + plank * 0.5 - 1.5, 2.5, 0, 7); c.fill(); }
  }
  c.strokeStyle = 'rgba(210,170,120,0.18)'; c.lineWidth = 1.5; for (let q = 0; q < 50; q++) { const x = r() * W, y = r() * H, a = r() * 3, L = 20 + r() * 90; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L * 0.3); c.stroke(); }
  c.strokeStyle = 'rgba(30,16,8,0.25)'; c.lineWidth = 8; c.beginPath(); c.arc(W * 0.86, H * 0.22, 70, 0.4, 5.9); c.stroke();
  c.fillStyle = 'rgba(14,16,30,0.55)'; c.beginPath(); c.ellipse(W * 0.12, H * 0.8, 26, 18, 0.4, 0, 7); c.fill(); [[40, 12], [-30, 26], [52, -18]].forEach(([dx, dy]) => { c.beginPath(); c.arc(W * 0.12 + dx, H * 0.8 + dy, 5, 0, 7); c.fill(); });
  const g = c.createRadialGradient(W * 0.45, H * 0.42, H * 0.1, W * 0.5, H * 0.5, W * 0.62); g.addColorStop(0, 'rgba(255,224,176,0.22)'); g.addColorStop(0.6, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,5,2,0.3)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
});
export const WoodDesk: React.FC<{w?: number; h?: number; z?: number}> = ({w = 4, h = 2.5, z = -0.02}) => (
  <mesh position={[0, 0, z]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={deskTex()} toneMapped={false} /></mesh>
);
/** the soft shadow a sheet casts on the desk (down and to the right: the light is top left) */
const shadowTex = () => tex('paper-drop-shadow', 256, 256, (c, W, H) => { c.filter = 'blur(18px)'; c.fillStyle = 'rgba(0,0,0,1)'; c.fillRect(40, 40, W - 80, H - 80); });
export const DropShadow: React.FC<{w: number; h: number; off?: number; opacity?: number; z?: number}> = ({w, h, off = 0.02, opacity = 0.55, z = -0.004}) => (
  <mesh position={[off * 0.7, -off, z]} renderOrder={1}><planeGeometry args={[w * 1.18, h * 1.14]} /><meshBasicMaterial map={shadowTex()} transparent opacity={opacity} depthWrite={false} /></mesh>
);
/** a sheet: a plane with a paint, unlit, with its drop shadow */
const Sheet: React.FC<{map: THREE.Texture; w: number; h: number; order?: number; shadow?: number}> = ({map, w, h, order = 2, shadow = 0.55}) => <>
  {shadow > 0 ? <DropShadow w={w} h={h} opacity={shadow} off={w * 0.025} /> : null}
  <mesh renderOrder={order}><planeGeometry args={[w, h]} /><meshBasicMaterial map={map} transparent toneMapped={false} /></mesh>
</>;

// ================================================================ hand-writing that writes itself
const HAND_TEX = (text: string, color: string, halo: string) => {
  const Wc = Math.max(256, Math.round(text.length * 92 + 90));
  return tex(`hand-${text}-${color}-${halo}`, Wc, 256, (c, W, H) => { c.clearRect(0, 0, W, H); c.font = `bold 150px ${HAND}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.lineJoin = 'round'; const tw = Math.min(W - 40, c.measureText(text).width);
    if (halo) { c.strokeStyle = halo; c.lineWidth = 22; c.strokeText(text, 20, H * 0.55, W - 40); }
    c.fillStyle = color; c.fillText(text, 20, H * 0.55, W - 40); (c.canvas as HTMLCanvasElement).dataset.tw = String(tw); });
};
/** HAND-WRITTEN TEXT, left-aligned at `pos` (the left end of the line, middle of the letters), letters `h` tall; it appears
 *  from left to right as p goes 0..1 with a glowing nib at the front. Any length (the texture grows with the text). */
export const HandWrite: React.FC<{text: string; pos: V3; h: number; p: number; color?: string; halo?: string; nib?: string; order?: number}> = ({text, pos, h, p, color = INK, halo = '', nib = '#ffb07a', order = 7}) => {
  const map = HAND_TEX(text, color, halo), img = map.image as HTMLCanvasElement, Wc = img.width, hh = h * 1.5, w = (hh * Wc) / 256;
  const used = Math.min(1, (Number(img.dataset?.tw ?? Wc - 40) + 40) / Wc), q = clamp(p) * used;
  const geo = useMemo(() => { if (q <= 0) return null; const g = new THREE.PlaneGeometry(w * q, hh); const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * q); g.translate((w * q) / 2, 0, 0); return g; }, [q, w, hh]);
  if (!geo) return null;
  return <group position={pos}>
    <mesh geometry={geo} renderOrder={order}><meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} /></mesh>
    {p > 0 && p < 1 ? <Halo pos={[w * q, -h * 0.1, 0.002]} r={h * 0.55} color={nib} strength={0.55} order={order + 1} /> : null}
  </group>;
};
/** the width (m) a HandWrite of this text takes at letter height h */
export const handWidth = (text: string, h: number) => { const map = HAND_TEX(text, INK, ''), img = map.image as HTMLCanvasElement; return (h * 1.5 * (Number(img.dataset?.tw ?? img.width - 40) + 40)) / 256; };

/** A HAND-DRAWN RED RING (one stroke overrunning its start, slightly uneven) that draws itself as p goes 0..1 */
export const InkRing: React.FC<{pos: V3; w: number; h: number; p: number; color?: string; width?: number; order?: number}> = ({pos, w, h, p, color = RED, width = 0.006, order = 8}) => {
  const geo = useMemo(() => {
    const q = clamp(p); if (q <= 0) return null;
    const n = Math.max(2, Math.round(90 * q)), pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i++) { const t = (i / 90) , a = -2.5 + t * (Math.PI * 2 + 0.6), rr = 1 + 0.04 * Math.sin(a * 3 + 1); pts.push(new THREE.Vector3(Math.cos(a) * (w / 2) * rr, Math.sin(a) * (h / 2) * rr + (t - 0.5) * h * 0.08, 0)); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, width / 2, 6, false);
  }, [p, w, h, width]);
  return geo ? <mesh position={pos} geometry={geo} renderOrder={order}><meshBasicMaterial color={color} toneMapped={false} /></mesh> : null;
};

// ================================================================ the newspaper (shot 10)
/** the engraving in the middle of the front page, as a list of ink strokes (so it can draw itself stroke by stroke): a
 *  patched tent with a smoke hole, a boy with tousled hair standing beside a little machine of gears on a box, a pine, hills,
 *  the ground hatched; every shape outlined then hatched for shade on its right side. Coordinates 0..1 of the picture box. */
type Stroke = {pts: [number, number][]; w: number; fill?: string};
const ENGRAVING: Stroke[] = (() => {
  const r = rnd(17), S: Stroke[] = [];
  const line = (pts: [number, number][], w = 3, fill?: string) => S.push({pts, w, fill});
  const hatch = (x0: number, y0: number, x1: number, y1: number, n: number, slant = 0.04, w = 1.6) => { for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t; line([[x, y0 + r() * 0.01], [x + slant, y1 - r() * 0.01]], w); } };
  const ellipse = (cx: number, cy: number, rx: number, ry: number, n = 22): [number, number][] => Array.from({length: n + 1}, (_, k) => { const a = (k / n) * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  // the sky: engraved horizontal lines, close at the top and opening toward the horizon, broken round the sun
  for (let k = 0; k < 16; k++) { const y = 0.03 + k * k * 0.0016 + k * 0.006; if (y > 0.4) break; const gap = Math.abs(y - 0.16) < 0.07; if (gap) { line([[0.02, y], [0.66, y]], 1.1); line([[0.86, y], [0.98, y]], 1.1); } else line([[0.02, y], [0.98, y]], 1.1); }
  line(ellipse(0.76, 0.16, 0.045, 0.06), 2.2, '#f3ead4'); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; line([[0.76 + Math.cos(a) * 0.06, 0.16 + Math.sin(a) * 0.08], [0.76 + Math.cos(a) * 0.085, 0.16 + Math.sin(a) * 0.11]], 1.6); }
  [[0.2, 0.12], [0.25, 0.1], [0.6, 0.08]].forEach(([x, y]) => line([[x - 0.02, y + 0.012], [x - 0.008, y], [x, y + 0.008], [x + 0.008, y], [x + 0.02, y + 0.012]], 1.6));
  // far mountains with snow lines, hatched on their right faces
  line([[0.02, 0.5], [0.12, 0.34], [0.2, 0.42], [0.3, 0.3], [0.42, 0.46], [0.5, 0.4], [0.6, 0.5]], 2.2, '#efe6cf'); hatch(0.12, 0.36, 0.2, 0.48, 5, 0.03, 1.1); hatch(0.3, 0.32, 0.42, 0.5, 7, 0.03, 1.1);
  line([[0.27, 0.34], [0.3, 0.3], [0.33, 0.35], [0.31, 0.34], [0.29, 0.36]], 1.6);
  line([[0.6, 0.5], [0.72, 0.38], [0.82, 0.48], [0.9, 0.42], [0.98, 0.5]], 2.2, '#efe6cf'); hatch(0.72, 0.4, 0.82, 0.52, 6, 0.03, 1.1);
  // a second, smaller tent far back at the left, with a thread of smoke
  line([[0.04, 0.6], [0.09, 0.47], [0.14, 0.6], [0.04, 0.6]], 2, '#efe6cf'); hatch(0.095, 0.5, 0.135, 0.6, 3, 0, 1.1); line([[0.09, 0.46], [0.085, 0.42], [0.095, 0.39], [0.088, 0.35]], 1.4);
  // the meadow line
  line([[0.02, 0.6], [0.2, 0.58], [0.42, 0.6], [0.7, 0.57], [0.98, 0.6]], 2.4);
  // the pine at the right, three tiers, hatched dark on its right
  line([[0.9, 0.86], [0.9, 0.62]], 3.2);
  [[0.38, 0.07, 0.58], [0.46, 0.085, 0.68], [0.55, 0.1, 0.78]].forEach(([top, hw, bot]) => line([[0.9 - hw, bot], [0.9, top], [0.9 + hw, bot], [0.9 - hw, bot]], 2.4, '#efe6cf'));
  hatch(0.905, 0.4, 0.99, 0.78, 9, 0.0, 1.3);
  // the tent: a tall cone of cloth with seams, two patches, the door open and dark, poles crossing, guy ropes and pegs, smoke
  line([[0.1, 0.86], [0.32, 0.2], [0.56, 0.86], [0.1, 0.86]], 3.4, '#f1e8d2');
  line([[0.27, 0.12], [0.34, 0.27]], 3); line([[0.38, 0.11], [0.3, 0.27]], 3); line([[0.32, 0.09], [0.325, 0.22]], 3);
  [0.21, 0.27, 0.37, 0.44].forEach((x) => line([[0.32, 0.22], [x, 0.86]], 1.2));
  line([[0.27, 0.86], [0.325, 0.5], [0.39, 0.86]], 3, '#3e2818');
  line([[0.18, 0.62], [0.25, 0.62], [0.245, 0.7], [0.175, 0.7], [0.18, 0.62]], 2.2, '#e2d6b8'); for (let k = 0; k < 5; k++) line([[0.185 + k * 0.012, 0.625], [0.183 + k * 0.012, 0.695]], 0.9);
  line([[0.4, 0.42], [0.45, 0.42], [0.452, 0.48], [0.402, 0.48], [0.4, 0.42]], 2, '#e2d6b8');
  hatch(0.4, 0.4, 0.54, 0.84, 12, -0.05, 1.4); for (let k = 0; k < 6; k++) line([[0.14 + k * 0.03, 0.78 - k * 0.1], [0.52 - k * 0.025, 0.78 - k * 0.1 + 0.01]], 1.1);
  [[0.1, 0.86, 0.04, 0.9], [0.56, 0.86, 0.6, 0.91]].forEach(([x0, y0, x1, y1]) => { line([[x0, y0 - 0.12], [x1, y1]], 1.2); line([[x1, y1 - 0.02], [x1, y1 + 0.015]], 2.4); });
  line([[0.33, 0.08], [0.31, 0.05], [0.34, 0.02], [0.32, -0.01]], 1.6); line([[0.35, 0.08], [0.37, 0.05], [0.355, 0.03]], 1.3);
  // the machine on a crate, right of the boy: crate with planks and nails, three gears, a coil, a lamp giving off rays
  line([[0.64, 0.88], [0.64, 0.73], [0.82, 0.73], [0.82, 0.88], [0.64, 0.88]], 3, '#e8dcc0'); [0.78, 0.83].forEach((y) => line([[0.64, y], [0.82, y]], 1.2)); hatch(0.77, 0.735, 0.82, 0.875, 5, 0, 1.2);
  const gear = (cx: number, cy: number, R: number) => { const pts: [number, number][] = []; for (let k = 0; k <= 48; k++) { const a = (k / 48) * Math.PI * 2, rr = R * (k % 4 < 2 ? 1 : 0.8); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 1.25]); } line(pts, 2.4, '#efe6cf'); line(ellipse(cx, cy, R * 0.32, R * 0.4, 14), 2, '#3e2818'); for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4; line([[cx + Math.cos(a) * R * 0.32, cy + Math.sin(a) * R * 0.4], [cx + Math.cos(a) * R * 0.75, cy + Math.sin(a) * R * 0.94]], 1.4); } };
  gear(0.69, 0.65, 0.05); gear(0.77, 0.61, 0.036); gear(0.745, 0.69, 0.026);
  for (let k = 0; k < 6; k++) line([[0.795, 0.725 - k * 0.012], [0.815, 0.72 - k * 0.012]], 1.8);
  line([[0.8, 0.66], [0.8, 0.54]], 2.2); line(ellipse(0.8, 0.515, 0.018, 0.026, 16), 2, '#fbf4dc'); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; line([[0.8 + Math.cos(a) * 0.03, 0.515 + Math.sin(a) * 0.04], [0.8 + Math.cos(a) * 0.05, 0.515 + Math.sin(a) * 0.065]], 1.4); }
  // the boy, between the tent and the machine, turned to it: boots, a long coat, the arm out to a gear, a tousled head
  line([[0.57, 0.88], [0.575, 0.8], [0.585, 0.8], [0.585, 0.88]], 2.6, '#3e2818'); line([[0.6, 0.88], [0.598, 0.8], [0.61, 0.8], [0.612, 0.88]], 2.6, '#3e2818');
  line([[0.56, 0.81], [0.565, 0.66], [0.582, 0.6], [0.612, 0.6], [0.625, 0.66], [0.63, 0.81], [0.56, 0.81]], 3, '#d8ccae'); hatch(0.598, 0.62, 0.628, 0.8, 5, 0, 1.2); line([[0.594, 0.61], [0.594, 0.8]], 1.2);
  line([[0.615, 0.63], [0.64, 0.665], [0.662, 0.655]], 3.2); line(ellipse(0.666, 0.652, 0.008, 0.01, 10), 2, '#f4ead4');
  line(ellipse(0.598, 0.56, 0.025, 0.033), 2.6, '#f4ead4'); line([[0.612, 0.555], [0.616, 0.556]], 2.4); line([[0.606, 0.575], [0.614, 0.573]], 1.4);
  for (let k = 0; k < 9; k++) { const x = 0.574 + k * 0.006; line([[x, 0.54], [x + 0.008 - r() * 0.016, 0.515 - r() * 0.016]], 2.2); }
  // the ground: grass strokes, stones, the shadow of the tent and of the crate hatched
  for (let k = 0; k < 26; k++) { const x = 0.03 + k * 0.037; line([[x, 0.93 + r() * 0.03], [x + 0.025, 0.9 + r() * 0.03]], 1.3); }
  hatch(0.56, 0.88, 0.7, 0.92, 8, 0.03, 1.1); hatch(0.82, 0.88, 0.9, 0.92, 4, 0.02, 1.1);
  [[0.06, 0.92], [0.47, 0.94], [0.95, 0.93]].forEach(([x, y]) => line(ellipse(x, y, 0.02, 0.012, 10), 1.8, '#d8ccae'));
  line([[0.02, 0.88], [0.98, 0.88]], 2.4);
  return S;
})();
const paintEngraving = (c: Ctx, x0: number, y0: number, w: number, h: number, upto: number) => {
  const n = Math.round(ENGRAVING.length * clamp(upto));
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  ENGRAVING.slice(0, n).forEach((s) => { c.beginPath(); s.pts.forEach(([x, y], i) => (i ? c.lineTo(x0 + x * w, y0 + y * h) : c.moveTo(x0 + x * w, y0 + y * h))); if (s.fill) { c.fillStyle = s.fill; c.fill(); } c.strokeStyle = '#2e2014'; c.lineWidth = s.w * (w / 600); c.stroke(); });
  c.restore();
};
/** fake columns of small print: grey lines of words of uneven length, paragraph breaks, a little heading now and then */
const paintPrint = (c: Ctx, x: number, y: number, w: number, h: number, r: () => number, lh: number) => {
  for (let yy = y; yy < y + h - lh; yy += lh) {
    if (r() < 0.06) { c.fillStyle = 'rgba(40,30,20,0.85)'; c.fillRect(x + w * 0.15, yy, w * 0.7, lh * 0.55); yy += lh * 0.5; continue; }
    let xx = x + (r() < 0.12 ? w * 0.08 : 0); const end = r() < 0.1 ? x + w * (0.3 + r() * 0.5) : x + w;
    while (xx < end - 6) { const ww = Math.min(end - xx, lh * (0.8 + r() * 2.6)); c.fillStyle = `rgba(52,40,28,${0.55 + r() * 0.25})`; c.fillRect(xx, yy + lh * 0.18, ww, lh * 0.42); xx += ww + lh * 0.35; }
  }
};
/** NEWSPAPER FRONT PAGE, portrait, yellowed: the masthead "NHẬT BÁO" in a heavy serif between double rules with a date
 *  band, three columns of small print, a framed box in the middle of the page for the engraving (drawn `upto` 0..1 of its
 *  strokes), a blank band above the picture where the hand-written headline goes, a fold across the middle, foxing, a torn
 *  corner, the light from the top left. */
export const NEWS = {aspect: 0.72, pic: [0.16, 0.36, 0.84, 0.74] as [number, number, number, number], title: 0.3};
const newsTex = (upto: number) => { const step = Math.round(clamp(upto) * 20); return tex(`news-front-${step}`, 1440, 2000, (c, W, H) => {
  const r = rnd(23), m = W * 0.06;
  c.fillStyle = '#e6d6ac'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#2a1e14'; c.font = `bold ${W * 0.13}px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('NHẬT BÁO', W / 2, H * 0.1);
  c.fillRect(m, H * 0.118, W - 2 * m, 7); c.fillRect(m, H * 0.128, W - 2 * m, 2); c.fillRect(m, H * 0.158, W - 2 * m, 2); c.fillRect(m, H * 0.163, W - 2 * m, 6);
  c.font = `italic ${W * 0.024}px ${SERIF}`; c.fillStyle = '#3a2a1c'; c.textAlign = 'left'; c.fillText('Số 214', m + 6, H * 0.149); c.textAlign = 'right'; c.fillText('Giá 2 xu', W - m - 6, H * 0.149);
  c.textAlign = 'center'; c.fillText('✦  tin trong nước và ngoài nước  ✦', W / 2, H * 0.149);
  const colW = (W - 2 * m - 2 * 30) / 3, [px0, py0, px1, py1] = NEWS.pic;
  // the print: full columns above and below the picture, cut round it
  for (let k = 0; k < 3; k++) { const x = m + k * (colW + 30); paintPrint(c, x, H * 0.18, colW, H * (NEWS.title - 0.03) - H * 0.18 + 2, r, W * 0.018); paintPrint(c, x, H * (py1 + 0.03), colW, H * (0.94 - py1 - 0.03), r, W * 0.018); if (k) { c.fillStyle = 'rgba(40,30,20,0.5)'; c.fillRect(x - 16, H * 0.18, 2, H * 0.76); } }
  paintPrint(c, m, H * (py0), W * px0 - m - 10, H * (py1 - py0), r, W * 0.018); paintPrint(c, W * px1 + 14, H * py0, W - m - W * px1 - 14, H * (py1 - py0), r, W * 0.018);
  // the picture box (framed), the engraving in it
  const bx = W * px0, by = H * py0, bw = W * (px1 - px0), bh = H * (py1 - py0);
  c.fillStyle = '#efe4c6'; c.fillRect(bx, by, bw, bh); c.strokeStyle = '#2a1e14'; c.lineWidth = 6; c.strokeRect(bx, by, bw, bh); c.lineWidth = 2; c.strokeRect(bx + 10, by + 10, bw - 20, bh - 20);
  paintEngraving(c, bx + 14, by + 14, bw - 28, bh - 28, step / 20);
  c.font = `italic ${W * 0.022}px ${SERIF}`; c.fillStyle = '#3a2a1c'; c.textAlign = 'center'; c.fillText('Căn lều ở xứ Latveria. Tranh khắc theo lời kể.', W / 2, by + bh + H * 0.022);
  // the blank band for the headline: a thin rule under it
  c.fillStyle = 'rgba(40,30,20,0.6)'; c.fillRect(m, H * (NEWS.title + 0.035), W - 2 * m, 2);
  // age: yellowing toward the edges, fold, foxing, a torn corner
  paintOldPaper(c, W, H, 11);
  c.fillStyle = 'rgba(0,0,0,0)'; c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.moveTo(W, H * 0.9); c.lineTo(W - W * 0.05, H * 0.93); c.lineTo(W - W * 0.02, H * 0.96); c.lineTo(W - W * 0.07, H); c.lineTo(W, H); c.closePath(); c.fill(); c.globalCompositeOperation = 'source-over';
}); };
/** THE NEWSPAPER INSERT (shot 10), `h` tall, tilted `tilt` degrees, on the desk. On frame f:
 *    t.slide [from, to]   it slides up into place from below the frame and settles with a bounce
 *    t.draw  [from, to]   the engraving draws itself stroke by stroke
 *    t.title [from, to]   the hand-written headline "cậu bé thiên tài trong lều" writes itself above the picture
 *    t.ring  frame         a red hand-drawn ring circles the picture (with a pop)
 *  Defaults follow shot 10. NEWS.pic is the picture box (fractions of the page, v from the top). */
export type NewsT = {slide: [number, number]; draw: [number, number]; title: [number, number]; ring: number};
export const SHOT10_T: NewsT = {slide: [0, 8], draw: [10, 26], title: [28, 46], ring: 48};
export const Newspaper: React.FC<{f: number; h?: number; pos?: V3; tilt?: number; t?: NewsT; headline?: string}> = ({f, h = 1, pos = [0, 0, 0], tilt = 4, t = SHOT10_T, headline = 'cậu bé thiên tài trong lều'}) => {
  const w = h * NEWS.aspect, k = (f - t.slide[0]) / (t.slide[1] - t.slide[0]), y = k >= 1 ? 0 : -h * 1.6 * (1 - ease(k)) * (k < 0 ? 1 : 1);
  const bounce = k >= 1 && k < 2 ? Math.sin((k - 1) * Math.PI * 2) * Math.exp(-(k - 1) * 3) * h * 0.02 : 0;
  const [px0, py0, px1, py1] = NEWS.pic, P = (u: number, v: number): [number, number] => [-w / 2 + u * w, h / 2 - v * h];
  const pc = P((px0 + px1) / 2, (py0 + py1) / 2), th = h * 0.042, tw = handWidth(headline, th);
  return <group position={[pos[0], pos[1] + y + bounce, pos[2]]} rotation={[0, 0, (tilt * Math.PI) / 180]}>
    <Sheet map={newsTex((f - t.draw[0]) / (t.draw[1] - t.draw[0]))} w={w} h={h} />
    {f >= t.draw[0] && f < t.draw[1] ? <Halo pos={[pc[0] + w * 0.25 * Math.cos(f), pc[1] + h * 0.1 * Math.sin(f * 1.7), 0.003]} r={h * 0.02} color="#ffb07a" strength={0.5} order={8} /> : null}
    <HandWrite text={headline} pos={[-tw / 2, h / 2 - NEWS.title * h, 0.004]} h={th} p={(f - t.title[0]) / (t.title[1] - t.title[0])} color="#3a1e10" />
    <group position={[pc[0], pc[1], 0.006]} scale={[popScale(f, t.ring, 6, 0.25) || 0.0001, popScale(f, t.ring, 6, 0.25) || 0.0001, 1]}><InkRing pos={[0, 0, 0]} w={w * (px1 - px0) * 1.16} h={h * (py1 - py0) * 1.18} p={f >= t.ring ? 1 : 0} width={h * 0.008} /></group>
  </group>;
};

// ================================================================ the crest, the stamp, the letter (shot 11; held in 12-13; chapter 7)
/** THE SCHOOL CREST in blue ink: a heater shield with a double border, an open book across its middle with lines on its
 *  pages, a star above, a laurel branch either side, a ribbon below (no name). x, y = centre; s = height in px. */
export const paintCrest = (c: Ctx, x: number, y: number, s: number, ink = INK_BLUE) => {
  const k = s / 200; c.save(); c.translate(x, y); c.strokeStyle = ink; c.fillStyle = ink; c.lineJoin = 'round'; c.lineCap = 'round';
  const shield = (sc: number) => { c.beginPath(); c.moveTo(-60 * sc * k, -70 * sc * k); c.lineTo(60 * sc * k, -70 * sc * k); c.lineTo(60 * sc * k, 0); c.quadraticCurveTo(58 * sc * k, 55 * sc * k, 0, 80 * sc * k); c.quadraticCurveTo(-58 * sc * k, 55 * sc * k, -60 * sc * k, 0); c.closePath(); };
  shield(1); c.fillStyle = 'rgba(31,58,110,0.12)'; c.fill(); c.lineWidth = 6 * k; c.stroke(); shield(0.86); c.lineWidth = 2.5 * k; c.stroke();
  // the book
  c.fillStyle = '#f4ecd6'; c.beginPath(); c.moveTo(0, -8 * k); c.quadraticCurveTo(-22 * k, -20 * k, -44 * k, -14 * k); c.lineTo(-44 * k, 26 * k); c.quadraticCurveTo(-22 * k, 20 * k, 0, 32 * k); c.quadraticCurveTo(22 * k, 20 * k, 44 * k, 26 * k); c.lineTo(44 * k, -14 * k); c.quadraticCurveTo(22 * k, -20 * k, 0, -8 * k); c.closePath(); c.fill(); c.lineWidth = 3.5 * k; c.stroke();
  c.beginPath(); c.moveTo(0, -8 * k); c.lineTo(0, 32 * k); c.stroke(); c.lineWidth = 2 * k; for (let j = 0; j < 4; j++) { c.beginPath(); c.moveTo(-36 * k, (-4 + j * 8) * k); c.lineTo(-8 * k, (-2 + j * 8) * k); c.moveTo(8 * k, (-2 + j * 8) * k); c.lineTo(36 * k, (-4 + j * 8) * k); c.stroke(); }
  // a star above the book
  c.fillStyle = ink; c.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + (j * Math.PI) / 5, rr = j % 2 ? 6 * k : 15 * k; c.lineTo(Math.cos(a) * rr, -42 * k + Math.sin(a) * rr); } c.closePath(); c.fill();
  // laurel either side
  [-1, 1].forEach((sd) => { c.lineWidth = 3 * k; c.beginPath(); c.moveTo(sd * 52 * k, 70 * k); c.quadraticCurveTo(sd * 92 * k, 20 * k, sd * 74 * k, -60 * k); c.stroke(); for (let j = 0; j < 7; j++) { const t = j / 7, px = sd * (52 + 40 * Math.sin(t * 2.6)) * k, py = (70 - t * 130) * k; c.beginPath(); c.ellipse(px + sd * 8 * k, py, 9 * k, 4.5 * k, sd * (0.6 + t), 0, 7); c.fill(); } });
  // the ribbon
  c.fillStyle = '#f4ecd6'; c.beginPath(); c.moveTo(-70 * k, 78 * k); c.quadraticCurveTo(0, 100 * k, 70 * k, 78 * k); c.lineTo(76 * k, 96 * k); c.quadraticCurveTo(0, 120 * k, -76 * k, 96 * k); c.closePath(); c.fill(); c.lineWidth = 3 * k; c.stroke();
  c.restore();
};
/** A ROUND RUBBER STAMP in red ink: double outer ring, the words round the top arc, two small stars at the sides, a straight
 *  band across the middle with the word(s) `mid`, a row of dots round the bottom; ink uneven (patchy, a few bare specks, the
 *  edge heavier on one side), as a real stamp prints. Used for "miễn học phí" (d1c5) and the expulsion letter (d1c7). */
export const stampTex = (top: string, mid: string, color = RED) => tex(`stamp-${top}-${mid}-${color}`, 640, 640, (c, W, H) => {
  const r = rnd(top.length * 7 + mid.length), cx = W / 2, cy = H / 2, R = W * 0.44; c.clearRect(0, 0, W, H);
  c.strokeStyle = color; c.fillStyle = color; c.lineWidth = 16; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke(); c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R * 0.8, 0, 7); c.stroke();
  c.font = `bold ${W * 0.085}px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const chars = [...top.toUpperCase()], span = Math.min(Math.PI * 1.1, chars.length * 0.2); chars.forEach((ch, i) => { const a = -Math.PI / 2 - span / 2 + (i + 0.5) * (span / chars.length); c.save(); c.translate(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9); c.rotate(a + Math.PI / 2); c.fillText(ch, 0, 0); c.restore(); });
  [-1, 1].forEach((sd) => { c.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + (j * Math.PI) / 5, rr = j % 2 ? 7 : 17; c.lineTo(cx + sd * R * 0.9 + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); c.fill(); });
  c.fillRect(cx - R * 0.79, cy - H * 0.075, R * 1.58, 7); c.fillRect(cx - R * 0.79, cy + H * 0.075, R * 1.58, 7);
  c.font = `bold ${W * 0.1}px ${SERIF}`; c.fillText(mid.toUpperCase(), cx, cy + 4, R * 1.52);
  for (let j = 0; j < 14; j++) { const a = Math.PI * 0.2 + (j / 13) * Math.PI * 0.6; c.beginPath(); c.arc(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9, 6, 0, 7); c.fill(); }
  // uneven ink: bare specks, a lighter patch, heavier left edge
  c.globalCompositeOperation = 'destination-out'; for (let j = 0; j < 500; j++) { c.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.7})`; c.beginPath(); c.arc(r() * W, r() * H, 1 + r() * 4, 0, 7); c.fill(); } blob(c, W * 0.7, H * 0.65, W * 0.3, 'rgba(0,0,0,0.35)'); c.globalCompositeOperation = 'source-over';
});
const splatTex = (color = RED) => tex(`ink-splat-${color}`, 512, 512, (c, W, H) => { const r = rnd(5); c.clearRect(0, 0, W, H); c.fillStyle = color; for (let j = 0; j < 22; j++) { const a = r() * 6.28, d = W * (0.3 + r() * 0.18), q = 3 + r() * 9; c.beginPath(); c.ellipse(W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d, q * 1.6, q, a, 0, 7); c.fill(); } });
/** THE STAMP coming down: from frame `at` it drops from 1.6x (pale) to 1.2x and back to 1 in 4 frames, the paper flexes, and
 *  a few drops of ink spray round it and stay. size = diameter (m); rot = its slant in radians. */
export const RoundStamp: React.FC<{f: number; at: number; pos: V3; size: number; top?: string; mid?: string; color?: string; rot?: number}> = ({f, at, pos, size, top = '✶ giáo vụ ✶', mid = 'miễn học phí', color = RED, rot = -0.22}) => {
  const d = f - at; if (d < -2) return null;
  const s = d < 0 ? 1.6 - (d + 2) * 0.2 : d < 1 ? 1.2 : d < 4 ? 1 + 0.2 * (1 - (d - 1) / 3) * Math.cos((d - 1) * 1.6) : 1, op = d < 0 ? 0.25 : 1;
  return <group position={pos} rotation={[0, 0, rot]}>
    <mesh scale={[s, s, 1]} renderOrder={9}><planeGeometry args={[size, size]} /><meshBasicMaterial map={stampTex(top, mid, color)} transparent opacity={op * 0.92} depthWrite={false} toneMapped={false} /></mesh>
    {d >= 0 ? <mesh position={[0, 0, -0.0005]} scale={[Math.min(1, 0.6 + d * 0.2), Math.min(1, 0.6 + d * 0.2), 1]} renderOrder={8}><planeGeometry args={[size * 1.5, size * 1.5]} /><meshBasicMaterial map={splatTex(color)} transparent opacity={0.85} depthWrite={false} toneMapped={false} /></mesh> : null}
  </group>;
};
/** the letter sheet: cream laid paper (chain lines), the crest at the top centre, a thin blue rule, a blank line for the
 *  hand-written heading, then lines of copperplate (scribbled) in brown ink, a signature with a flourish, foxing */
export const LETTER = {aspect: 0.74, crest: 0.14, heading: 0.31, stamp: [0.7, 0.69] as [number, number]};
const letterTex = (heading = '', stamp = false) => tex(`invite-letter-${heading}-${stamp}`, 1110, 1500, (c, W, H) => {
  const r = rnd(31); c.fillStyle = '#f1e6c9'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(150,120,70,0.10)'; c.lineWidth = 2; for (let x = 30; x < W; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 4) { c.fillStyle = `rgba(150,120,70,${0.02 + r() * 0.02})`; c.fillRect(0, y, W, 1); }
  paintCrest(c, W / 2, H * LETTER.crest, H * 0.17);
  c.fillStyle = INK_BLUE; c.fillRect(W * 0.12, H * 0.235, W * 0.76, 3); c.fillRect(W * 0.12, H * 0.242, W * 0.76, 1.5);
  if (heading) { c.font = `bold ${H * 0.05}px ${HAND}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK_BLUE; c.fillText(heading, W / 2, H * LETTER.heading, W * 0.8); }
  c.strokeStyle = 'rgba(70,46,26,0.8)'; c.lineCap = 'round'; c.lineWidth = 4;
  for (let j = 0; j < 9; j++) { const y = H * (0.4 + j * 0.045), x0 = W * (j === 0 ? 0.2 : 0.13), x1 = W * (j === 8 ? 0.55 : 0.86 - r() * 0.05); c.beginPath(); c.moveTo(x0, y); for (let x = x0; x < x1; x += 14) c.lineTo(x, y + Math.sin(x * 0.21 + j) * 6 * (r() < 0.2 ? 1.8 : 1) - (r() < 0.06 ? 14 : 0)); c.stroke(); }
  c.lineWidth = 5; c.beginPath(); c.moveTo(W * 0.15, H * 0.86); c.bezierCurveTo(W * 0.2, H * 0.8, W * 0.26, H * 0.9, W * 0.3, H * 0.84); c.bezierCurveTo(W * 0.34, H * 0.8, W * 0.36, H * 0.9, W * 0.42, H * 0.85); c.quadraticCurveTo(W * 0.5, H * 0.82, W * 0.38, H * 0.89); c.stroke();
  if (stamp) { const st = stampTex('✶ giáo vụ ✶', 'miễn học phí').image as HTMLCanvasElement; c.save(); c.translate(W * LETTER.stamp[0], H * LETTER.stamp[1]); c.rotate(-0.22); c.globalAlpha = 0.92; c.drawImage(st, -W * 0.2, -W * 0.2, W * 0.4, W * 0.4); c.restore(); }
  paintOldPaper(c, W, H, 7);
});
/** the envelope: back panel (seen through the open top) and the front pocket with the flap folded up and back, the red wax
 *  seal broken open on the flap, a blue-ink address scribble, a postmark */
const envBackTex = () => tex('invite-env-back', 1200, 800, (c, W, H) => { c.fillStyle = '#d9c9a2'; c.fillRect(0, 0, W, H); paintOldPaper(c, W, H, 3); });
const envFrontTex = () => tex('invite-env-front-3', 1200, 800, (c, W, H) => {
  const r = rnd(9); c.clearRect(0, 0, W, H);
  c.fillStyle = '#ead9b2'; c.beginPath(); c.moveTo(0, H * 0.12); c.lineTo(W * 0.5, H * 0.52); c.lineTo(W, H * 0.12); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(110,80,40,0.45)'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, H * 0.12); c.lineTo(W * 0.5, H * 0.52); c.lineTo(W, H * 0.12); c.stroke(); c.beginPath(); c.moveTo(0, H); c.lineTo(W * 0.42, H * 0.6); c.moveTo(W, H); c.lineTo(W * 0.58, H * 0.6); c.stroke();
  // shading of the folds: the lower flap lighter, the side flaps darker
  c.fillStyle = 'rgba(90,60,30,0.10)'; c.beginPath(); c.moveTo(0, H * 0.12); c.lineTo(W * 0.42, H * 0.6); c.lineTo(0, H); c.fill(); c.beginPath(); c.moveTo(W, H * 0.12); c.lineTo(W * 0.58, H * 0.6); c.lineTo(W, H); c.fill();
  c.strokeStyle = 'rgba(31,58,110,0.75)'; c.lineWidth = 4; for (let j = 0; j < 3; j++) { const y = H * (0.7 + j * 0.07), x0 = W * 0.36; c.beginPath(); c.moveTo(x0, y); for (let x = x0; x < W * (0.78 - j * 0.06); x += 12) c.lineTo(x, y + Math.sin(x * 0.25 + j) * 5); c.stroke(); }
  c.strokeStyle = 'rgba(70,50,90,0.55)'; c.lineWidth = 4; c.beginPath(); c.arc(W * 0.83, H * 0.36, 58, 0, 7); c.stroke(); c.beginPath(); c.arc(W * 0.83, H * 0.36, 42, 0, 7); c.stroke(); for (let j = 0; j < 4; j++) { c.beginPath(); c.moveTo(W * 0.72, H * (0.3 + j * 0.04)); for (let x = W * 0.72; x < W * 0.97; x += 10) c.lineTo(x, H * (0.3 + j * 0.04) + Math.sin(x * 0.2) * 5); c.stroke(); }
  c.fillStyle = '#c9b07a'; c.fillRect(W * 0.07, H * 0.24, 110, 130); c.strokeStyle = '#8a6a3a'; c.lineWidth = 3; c.setLineDash([6, 6]); c.strokeRect(W * 0.07 + 6, H * 0.24 + 6, 98, 118); c.setLineDash([]); paintCrest(c, W * 0.07 + 55, H * 0.24 + 66, 80, '#5a3a2a');
  paintOldPaper(c, W, H, 4);
  // the broken wax seal where the flap was closed onto the pocket: a red blot with a stamped star, cracked across, a chip gone
  { const x = W * 0.5, y = H * 0.56; blob(c, x + 10, y + 12, 80, 'rgba(60,20,10,0.35)'); c.fillStyle = '#9e1f1a'; c.beginPath(); for (let j = 0; j < 18; j++) { const a = (j / 18) * 6.28, rr = 54 + (j % 3) * 6; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill();
    c.fillStyle = '#c3352c'; c.beginPath(); c.arc(x - 5, y - 5, 40, 0, 7); c.fill(); c.strokeStyle = '#7a1612'; c.lineWidth = 5; c.beginPath(); c.arc(x - 5, y - 5, 29, 0, 7); c.stroke();
    c.fillStyle = '#7a1612'; c.font = `bold 34px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('✶', x - 5, y - 3);
    c.strokeStyle = '#4a0c08'; c.lineWidth = 5; c.beginPath(); c.moveTo(x - 46, y - 14); c.lineTo(x - 12, y + 4); c.lineTo(x + 10, y - 8); c.lineTo(x + 50, y + 10); c.stroke();
    c.fillStyle = 'rgba(255,220,200,0.6)'; c.beginPath(); c.ellipse(x - 22, y - 24, 10, 5, -0.6, 0, 7); c.fill(); }
  c.globalCompositeOperation = 'destination-in'; c.fillStyle = '#000'; c.beginPath(); c.moveTo(0, H * 0.12); c.lineTo(W * 0.5, H * 0.52); c.lineTo(W, H * 0.12); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill(); c.beginPath(); c.arc(W * 0.5, H * 0.56, 66, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  void r;
});
/** the flap standing up behind (open), with the broken wax seal on its point */
const envFlapTex = () => tex('invite-env-flap', 1200, 500, (c, W, H) => {
  c.clearRect(0, 0, W, H); c.fillStyle = '#e2d0a6'; c.beginPath(); c.moveTo(0, H); c.lineTo(W * 0.5, H * 0.08); c.lineTo(W, H); c.closePath(); c.fill(); c.strokeStyle = 'rgba(110,80,40,0.5)'; c.lineWidth = 4; c.stroke();
  const x = W * 0.5, y = H * 0.24; blob(c, x + 10, y + 12, 90, 'rgba(60,20,10,0.35)');
  c.fillStyle = '#9e1f1a'; c.beginPath(); for (let j = 0; j < 18; j++) { const a = (j / 18) * 6.28, rr = 62 + (j % 3) * 7; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill();
  c.fillStyle = '#c3352c'; c.beginPath(); c.arc(x - 6, y - 6, 46, 0, 7); c.fill(); c.strokeStyle = '#7a1612'; c.lineWidth = 5; c.beginPath(); c.arc(x - 6, y - 6, 34, 0, 7); c.stroke();
  c.fillStyle = '#7a1612'; c.font = `bold 40px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('✶', x - 6, y - 4);
  c.strokeStyle = '#4a0c08'; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 50, y + 20); c.lineTo(x - 10, y - 4); c.lineTo(x + 14, y + 10); c.lineTo(x + 56, y - 14); c.stroke();
  c.fillStyle = 'rgba(255,220,200,0.6)'; c.beginPath(); c.ellipse(x - 26, y - 28, 12, 6, -0.6, 0, 7); c.fill();
  paintOldPaper(c, W, H, 5);
  c.globalCompositeOperation = 'destination-in'; c.fillStyle = '#000'; c.beginPath(); c.moveTo(0, H); c.lineTo(W * 0.5, H * 0.08 - 70); c.lineTo(W, H); c.closePath(); c.fill(); c.fillRect(W * 0.5 - 95, 0, 190, H * 0.6); c.globalCompositeOperation = 'source-over';
});
/** THE LETTER OF INVITATION (shot 11), the envelope `w` wide standing upright on the desk. On frame f:
 *    t.seal   frame         the red wax seal glows once
 *    t.slide  [from, to]   the letter rises out of the envelope and settles with a bounce
 *    t.write  [from, to]   the heading "thư mời nhập học" writes itself under the crest (the crest is printed already)
 *    t.stamp  frame         the round red stamp "miễn học phí" slams on the lower right of the letter, ink spatters
 *  Defaults follow shot 11. The shot adds its own camera shake at t.stamp. */
export type InviteT = {seal: number; slide: [number, number]; write: [number, number]; stamp: number};
export const SHOT11_T: InviteT = {seal: 0, slide: [4, 14], write: [14, 26], stamp: 40};
export const InviteLetter: React.FC<{f: number; w?: number; pos?: V3; t?: InviteT; heading?: string}> = ({f, w = 0.9, pos = [0, 0, 0], t = SHOT11_T, heading = 'thư mời nhập học'}) => {
  const eh = w * (2 / 3), lw = w * 0.84, lh = lw / LETTER.aspect, k = (f - t.slide[0]) / (t.slide[1] - t.slide[0]);
  // letter centre: inside the envelope at rest (top just showing), then up so its lower fifth stays in the pocket
  const y0 = -eh / 2 + lh / 2 - eh * 0.02, y1 = eh / 2 + lh * 0.32, over = k >= 1 && k < 2.2 ? Math.sin((k - 1) * Math.PI * 1.6) * Math.exp(-(k - 1) * 2.4) * lh * 0.03 : 0;
  const ly = y0 + (y1 - y0) * ease(k) + over, hp = (f - t.write[0]) / (t.write[1] - t.write[0]), hh = lh * 0.042, hw = handWidth(heading, hh);
  const flex = f >= t.stamp && f < t.stamp + 5 ? Math.sin(((f - t.stamp) / 5) * Math.PI) * 0.012 : 0, seal = Math.max(0, 1 - Math.abs(f - t.seal - 2) / 4);
  return <group position={pos}>
    <DropShadow w={w} h={eh} off={w * 0.03} />
    <mesh position={[0, 0, 0]} renderOrder={2}><planeGeometry args={[w, eh]} /><meshBasicMaterial map={envBackTex()} toneMapped={false} /></mesh>
    <mesh position={[0, eh / 2 + w * 0.13, -0.002]} renderOrder={2}><planeGeometry args={[w, w * (500 / 1200)]} /><meshBasicMaterial map={envFlapTex()} transparent toneMapped={false} /></mesh>
    
    {/* the letter: between the back panel and the front pocket */}
    <group position={[0, ly, 0.004]} scale={[1 - flex, 1 + flex, 1]}>
      <DropShadow w={lw} h={lh} off={lw * 0.012} opacity={0.35} z={-0.001} />
      <mesh renderOrder={3}><planeGeometry args={[lw, lh]} /><meshBasicMaterial map={letterTex()} toneMapped={false} /></mesh>
      <HandWrite text={heading} pos={[-hw / 2, lh / 2 - LETTER.heading * lh, 0.002]} h={hh} p={hp} color={INK_BLUE} order={4} />
      <RoundStamp f={f} at={t.stamp} pos={[-lw / 2 + LETTER.stamp[0] * lw, lh / 2 - LETTER.stamp[1] * lh, 0.003]} size={lw * 0.4} />
    </group>
    <mesh position={[0, 0, 0.008]} renderOrder={6}><planeGeometry args={[w, eh]} /><meshBasicMaterial map={envFrontTex()} transparent toneMapped={false} /></mesh>
    {seal > 0 ? <Halo pos={[0, eh / 2 - 0.56 * eh, 0.01]} r={w * 0.12 * (0.6 + seal * 0.6)} color="#ff6a4a" strength={0.65 * seal} order={7} /> : null}
  </group>;
};
/** THE LETTER HELD IN A HAND (shots 12, 13): the same letter as one flat piece, written and stamped. fold 'open' = the whole
 *  sheet; 'half' = folded in half (the top half folded back: the lower half shows, its top edge a lit fold). h = sheet
 *  height (0.28 m is a real letter). Lit by the scene (it is paper in a hand, not a graphic). */
export const HeldLetter: React.FC<{pos: V3; h?: number; fold?: 'open' | 'half'; rotZ?: number; rotY?: number}> = ({pos, h = 0.28, fold = 'open', rotZ = 0, rotY = 0}) => {
  const w = h * LETTER.aspect, map = letterTex('thư mời nhập học', true), half = useMemo(() => { const m = map.clone(); m.needsUpdate = true; m.repeat.set(1, 0.5); m.offset.set(0, 0); return m; }, [map]);
  return <group position={pos} rotation={[0, rotY, rotZ]}>
    {fold === 'open' ? <mesh castShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={map} side={THREE.DoubleSide} /></mesh>
      : <>
        <mesh position={[0, -h * 0.25, 0]} castShadow><planeGeometry args={[w, h / 2]} /><meshLambertMaterial map={half} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -h * 0.25, -0.004]}><planeGeometry args={[w, h / 2]} /><meshLambertMaterial color="#e6d8b6" side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 0.002, 0.001]}><planeGeometry args={[w, 0.004]} /><meshBasicMaterial color="#fff6e0" /></mesh>
      </>}
  </group>;
};

// ================================================================ the notebook page (shot 17)
/** a notebook page: cream paper ruled in pale blue with a red margin, a column of punched binding holes down the left edge
 *  (each with a torn ring and the dark desk showing through), a pencil smudge, a small doodle of a gear in the top corner,
 *  a coffee ring, foxing; the lines are blank (the writing writes itself on top). NOTE.lines = the ruled lines (fraction of
 *  height from the top), NOTE.margin = the red margin (fraction of width). */
export const NOTE = {aspect: 0.78, lines: Array.from({length: 13}, (_, i) => 0.17 + i * 0.062), margin: 0.17};
export const noteTex = () => tex('notebook-page-2', 1400, 1800, (c, W, H) => {
  const r = rnd(13); c.fillStyle = '#f2e8cc'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(70,110,160,0.45)'; c.lineWidth = 3; NOTE.lines.forEach((v) => { c.beginPath(); c.moveTo(0, v * H); for (let x = 0; x <= W; x += 40) c.lineTo(x, v * H + Math.sin(x * 0.01 + v * 30) * 1.2); c.stroke(); });
  c.strokeStyle = 'rgba(190,60,50,0.7)'; c.lineWidth = 4; c.beginPath(); c.moveTo(W * NOTE.margin, 0); c.lineTo(W * NOTE.margin, H); c.stroke(); c.lineWidth = 1.5; c.beginPath(); c.moveTo(W * NOTE.margin + 9, 0); c.lineTo(W * NOTE.margin + 9, H); c.stroke();
  // the binding holes: dark (desk below), a torn paper ring round each, two of them torn through to the edge
  for (let j = 0; j < 9; j++) { const y = H * (0.07 + j * 0.108), x = W * 0.065; c.fillStyle = '#2a1c12'; c.beginPath(); c.arc(x, y, 26, 0, 7); c.fill(); c.strokeStyle = 'rgba(120,90,50,0.5)'; c.lineWidth = 6; c.beginPath(); c.arc(x, y, 31, 0, 7); c.stroke();
    if (j === 2 || j === 6) { c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.beginPath(); c.moveTo(0, y - 12); c.lineTo(x, y - 18); c.lineTo(x, y + 18); c.lineTo(0, y + 10); c.fill(); c.globalCompositeOperation = 'source-over'; } }
  // a doodled gear and a little spiral in the top right corner, pencil
  c.strokeStyle = 'rgba(80,70,64,0.55)'; c.lineWidth = 4; const gx = W * 0.86, gy = H * 0.07; c.beginPath(); for (let k = 0; k <= 40; k++) { const a = (k / 40) * 6.28, rr = k % 4 < 2 ? 54 : 42; c.lineTo(gx + Math.cos(a) * rr, gy + Math.sin(a) * rr); } c.stroke(); c.beginPath(); c.arc(gx, gy, 16, 0, 7); c.stroke();
  c.beginPath(); for (let k = 0; k < 60; k++) { const a = k * 0.35, rr = 4 + k * 0.6; c.lineTo(W * 0.72 + Math.cos(a) * rr, H * 0.075 + Math.sin(a) * rr); } c.stroke();
  // pencil smudge, a coffee ring, foxing
  blob(c, W * 0.3, H * 0.9, 120, 'rgba(70,70,80,0.10)'); c.strokeStyle = 'rgba(120,80,40,0.18)'; c.lineWidth = 9; c.beginPath(); c.arc(W * 0.8, H * 0.82, 120, 0.2, 5.6); c.stroke();
  paintOldPaper(c, W, H, 17);
  // the right edge slightly rough (torn out of the book? no: cut), the corner curling: a lit band
  const g = c.createLinearGradient(W * 0.9, H, W, H * 0.9); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,250,235,0.35)'); c.fillStyle = g; c.fillRect(W * 0.85, H * 0.85, W * 0.15, H * 0.15);
  void r;
});
/** THE NOTEBOOK PAGE (shot 17): the page `h` tall, tilted `tilt` degrees; the lines write themselves in blue-black ink;
 *    t.l1 [from, to] line 1; t.tick frame a small green tick pops at its end; t.l2 [from, to] line 2;
 *    t.under [a, b] two red underlines under line 2 draw themselves (each 4 frames).
 *  Text and timings default to shot 17. NOTE.lines tells which ruled line each sits on (index 3 and 6). */
export type NoteT = {l1: [number, number]; tick: number; l2: [number, number]; under: [number, number]};
export const SHOT17_T: NoteT = {l1: [2, 30], tick: 32, l2: [40, 64], under: [66, 72]};
const tickTex = () => tex('note-tick-green', 128, 128, (c) => { c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = 'rgba(20,60,30,0.3)'; c.lineWidth = 22; c.beginPath(); c.moveTo(22, 70); c.lineTo(52, 100); c.lineTo(108, 26); c.stroke(); c.strokeStyle = '#2f9a48'; c.lineWidth = 15; c.beginPath(); c.moveTo(20, 66); c.lineTo(50, 96); c.lineTo(106, 22); c.stroke(); });
export const NotebookPage: React.FC<{f: number; h?: number; pos?: V3; tilt?: number; t?: NoteT; lines?: [string, string]}> = ({f, h = 1, pos = [0, 0, 0], tilt = 3, t = SHOT17_T, lines = ['1. học hết mọi thứ trên đời', '2. đưa mẹ trở về']}) => {
  const w = h * NOTE.aspect, th = h * 0.046, x0 = -w / 2 + w * (NOTE.margin + 0.04), y = (i: number) => h / 2 - NOTE.lines[i] * h - th * 0.1;
  const w1 = handWidth(lines[0], th), w2 = handWidth(lines[1], th), tickS = popScale(f, t.tick, 6, 0.35);
  const under = (k: number) => clamp((f - t.under[k]) / 4);
  return <group position={pos} rotation={[0, 0, (tilt * Math.PI) / 180]}>
    <Sheet map={noteTex()} w={w} h={h} />
    <HandWrite text={lines[0]} pos={[x0, y(3), 0.003]} h={th} p={(f - t.l1[0]) / (t.l1[1] - t.l1[0])} color="#1c2440" />
    {tickS > 0 ? <mesh position={[x0 + w1 + th * 0.9, y(3) + th * 0.2, 0.004]} scale={[tickS, tickS, 1]} renderOrder={9}><planeGeometry args={[th * 1.6, th * 1.6]} /><meshBasicMaterial map={tickTex()} transparent depthWrite={false} toneMapped={false} /></mesh> : null}
    <HandWrite text={lines[1]} pos={[x0, y(6), 0.003]} h={th} p={(f - t.l2[0]) / (t.l2[1] - t.l2[0])} color="#1c2440" />
    {[0, 1].map((k) => under(k) > 0 ? <mesh key={k} position={[x0 + (w2 * under(k)) / 2 - th * 0.1, y(6) - th * (0.75 + k * 0.32), 0.004]} rotation={[0, 0, (k ? -0.012 : 0.01)]} renderOrder={8}><planeGeometry args={[w2 * under(k) + th * 0.2, th * 0.14]} /><meshBasicMaterial color={RED} toneMapped={false} /></mesh> : null)}
  </group>;
};

// ================================================================ the thought bubble (shot 5)
/** the cloud: ivory, a ring of round lobes, a soft inner shade toward the lower right; `rim` = only the brown ink outline
 *  band (drawn in front of the figure so the figure seems to sit inside) */
const cloudPath = (c: Ctx, W: number, H: number, inset = 0) => { const n = 11, cx = W / 2, cy = H / 2, rx = W * 0.36 - inset, ry = H * 0.33 - inset; c.beginPath(); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, b = ((k + 1) / n) * Math.PI * 2, m = (a + b) / 2, px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry, qx = cx + Math.cos(b) * rx, qy = cy + Math.sin(b) * ry, bulge = 1.32 + 0.06 * Math.sin(k * 2.3); if (k === 0) c.moveTo(px, py); c.quadraticCurveTo(cx + Math.cos(m) * rx * bulge, cy + Math.sin(m) * ry * bulge, qx, qy); } c.closePath(); };
const cloudTex = (rim: boolean) => tex(`thought-cloud-${rim ? 'rim' : 'fill'}`, 1024, 800, (c, W, H) => {
  c.clearRect(0, 0, W, H);
  if (!rim) { c.save(); c.translate(10, 14); cloudPath(c, W, H); c.fillStyle = 'rgba(40,24,12,0.35)'; c.filter = 'blur(10px)'; c.fill(); c.restore(); c.filter = 'none';
    cloudPath(c, W, H); c.fillStyle = '#fbf3df'; c.fill(); c.save(); cloudPath(c, W, H); c.clip(); const g = c.createRadialGradient(W * 0.42, H * 0.4, W * 0.1, W * 0.5, H * 0.5, W * 0.5); g.addColorStop(0, 'rgba(255,255,248,0.6)'); g.addColorStop(1, 'rgba(200,170,120,0.35)'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); return; }
  // the rim: the outline band, then the inside cut out (a lobed ring)
  cloudPath(c, W, H); c.fillStyle = '#fbf3df'; c.fill(); c.strokeStyle = '#4e321e'; c.lineWidth = 12; c.stroke();
  c.globalCompositeOperation = 'destination-out'; cloudPath(c, W, H, 40); c.fillStyle = '#000'; c.fill(); c.globalCompositeOperation = 'source-over';
  c.save(); cloudPath(c, W, H, 40); c.strokeStyle = 'rgba(160,120,70,0.5)'; c.lineWidth = 6; c.stroke(); c.restore();
});
const dotTex = () => tex('thought-dot', 128, 128, (c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = '#fbf3df'; c.beginPath(); c.arc(W / 2, H / 2, W * 0.4, 0, 7); c.fill(); c.strokeStyle = '#4e321e'; c.lineWidth = 9; c.stroke(); });
/** Clips every mesh inside it to a box (local x0..x1, y0..y1 of the group) with clipping planes: used to cut a figure off
 *  at the chest inside a bubble. Turns on local clipping for the renderer. */
export const ClipBox: React.FC<{x0: number; x1: number; y0: number; y1: number; children: React.ReactNode}> = ({x0, x1, y0, y1, children}) => {
  const g = useRef<THREE.Group>(null), gl = useThree((s) => s.gl);
  gl.localClippingEnabled = true;
  useLayoutEffect(() => {
    const grp = g.current; if (!grp) return; grp.updateWorldMatrix(true, true);
    const M = grp.matrixWorld, n = new THREE.Matrix3().getNormalMatrix(M);
    const planes = ([[1, 0, -x0], [-1, 0, x1], [0, 1, -y0], [0, -1, y1]] as number[][]).map(([a, b, d]) => new THREE.Plane(new THREE.Vector3(a, b, 0), d).applyMatrix4(M, n));
    grp.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined; if (!m) return; (Array.isArray(m) ? m : [m]).forEach((mm) => { mm.clippingPlanes = planes; mm.needsUpdate = true; }); });
  });
  return <group ref={g}>{children}</group>;
};
/** THE THOUGHT BUBBLE (shot 5): three small dots pop one after another from `from` (near the thinker's head) toward the
 *  bubble, then the cloud pops at `pos` (w wide) with a bounce. `children` = what is thought of (a small figure standing at
 *  local [0, -h*0.?, 0]): it is clipped to the inside of the cloud (from the chest up if it stands low) and the brown rim is
 *  drawn over it. The figure must be drawn between the cloud (order 640) and its rim (660): give it `order={645}` (and
 *  `lit={false}` so it keeps its own colours). at = the first dot's frame; the cloud comes at at + 6. */
export const ThoughtBubble: React.FC<{f: number; at: number; pos: V3; w: number; from: V3; children?: React.ReactNode}> = ({f, at, pos, w, from, children}) => {
  const h = w * (800 / 1024), s = popScale(f, at + 6, 8, 0.3), dots = [0, 1, 2].map((k) => popScale(f, at + k * 2, 5, 0.4));
  const P = (k: number): V3 => { const t = 0.18 + k * 0.22; return [from[0] + (pos[0] - from[0]) * t, from[1] + (pos[1] - from[1]) * t, from[2] + (pos[2] - from[2]) * t]; };
  return <group>
    {dots.map((d, k) => d > 0 ? <mesh key={k} position={P(k)} scale={[d, d, 1]} renderOrder={650}><planeGeometry args={[w * (0.05 + k * 0.03), w * (0.05 + k * 0.03)]} /><meshBasicMaterial map={dotTex()} transparent depthWrite={false} depthTest={false} toneMapped={false} /></mesh> : null)}
    {s > 0 ? <group position={pos} scale={[s, s, s]}>
      <mesh renderOrder={640}><planeGeometry args={[w * 1.04, h * 1.04]} /><meshBasicMaterial map={cloudTex(false)} transparent depthWrite={false} depthTest={false} toneMapped={false} /></mesh>
      <ClipBox x0={-w * 0.36} x1={w * 0.36} y0={-h * 0.33} y1={h * 0.4}>{children}</ClipBox>
      <mesh position={[0, 0, 0.001]} renderOrder={660}><planeGeometry args={[w, h]} /><meshBasicMaterial map={cloudTex(true)} transparent depthWrite={false} depthTest={false} toneMapped={false} /></mesh>
    </group> : null}
  </group>;
};
