import React, {useMemo} from 'react';
import {datNoiBui} from '../lib3/mauBui';
import {AbsoluteFill, Composition, useVideoConfig, useCurrentFrame} from 'remotion';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import {act, blink} from '../mould/act';
import {perform, POSES, Beat} from '../mould/gestures';
import type {Spec} from '../mould/draw';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Scene3, Finish, Ground, FacetLathe, Halo} from '../lib3/look';
import {SmokeDrift} from '../lib3/fx';
import {AirLayer} from '../lib3/kitCamp';
import {Scatter} from '../lib3/detail';
import {Plate, TheoTam, Sprite, VIEW, rnd, P, Ctx, paintPeak, paintHills, paintPine, paintTree, paintBush, paintHaystack, paintRock, paintHouse, paintCastle, paintCloud} from '../lib3/depth';
import {StageCam, Cottage, Crate, Barrel, Well, Road, Fence} from '../lib3/kit';
import {RockMass, SnowRock, SnowDrift, Blizzard} from '../lib3/kitNuiTuyet';

/** Layer test (background only, no figures): a valley with far mountains, a castle, hills, tree lines, a road and a cottage.
 *  Nine depths from the sky to the foreground; nothing in the frame is left as one plain area. */
type V3 = [number, number, number];
const HAZE = '#b7c9e2';
const PINE = [{light: '#4f8c5a', dark: '#3c6f49', trunk: '#5a4634'}, {light: '#5a9460', dark: '#44774d', trunk: '#5a4634'}, {light: '#467f5c', dark: '#35654a', trunk: '#544232'}];

// ---------------------------------------------------------------- the painted layers, back to front (screen units 1600 x 900)
const sky = (c: Ctx) => {
  const g = c.createLinearGradient(0, -140, 0, 520); g.addColorStop(0, '#9fbbdd'); g.addColorStop(1, '#cfdcec'); c.fillStyle = g; c.fillRect(-300, -200, 2200, 1300);
  paintCloud(c, 300, 60, 1.0, {light: '#e3ebf5', dark: '#cbd8e9'}); paintCloud(c, 1120, 130, 0.8, {light: '#e3ebf5', dark: '#cbd8e9'}); paintCloud(c, -120, 170, 0.7, {light: '#dde7f3', dark: '#c7d5e7'});
  c.strokeStyle = '#5d6c84'; c.lineWidth = 2.2; [[1210, 96, 9], [1238, 84, 7], [1262, 104, 6]].forEach(([x, y, s]) => { c.beginPath(); c.moveTo(x - s, y - s * 0.5); c.lineTo(x, y); c.lineTo(x + s, y - s * 0.6); c.stroke(); });
};
const farRange = (c: Ctx) => {
  const t = {light: '#b3c4dc', dark: '#9aaecd', snow: '#f3f6fa', snowShade: '#d5deec'};
  paintPeak(c, 790, -40, 560, 640, t); paintPeak(c, 230, 46, 430, 640, t); paintPeak(c, 1370, 70, 470, 640, t); paintPeak(c, 1820, 150, 300, 640, t); paintPeak(c, -220, 160, 300, 640, t);
};
const midRange = (c: Ctx) => {
  const t = {light: '#86a3a0', dark: '#718f8d'}, s = {...t, snow: '#e6edf2', snowShade: '#c3d0da'};
  paintPeak(c, 990, 222, 430, 660, s); paintPeak(c, 70, 262, 390, 660, t); paintPeak(c, 520, 318, 330, 660, t); paintPeak(c, 1520, 268, 410, 660, t);
};
const castleHill = (c: Ctx) => {
  c.translate(-90, 0);
  P(c, [[790, 640], [880, 486], [948, 440], [998, 380], [1222, 380], [1250, 420], [1318, 486], [1400, 640]], '#7f9086');
  P(c, [[790, 640], [880, 486], [948, 440], [998, 380], [1080, 380], [1040, 470], [1070, 640]], '#93a498');
  P(c, [[1222, 380], [1250, 420], [1318, 486], [1400, 640], [1290, 640], [1262, 500]], '#6f8078');
  // the way up to the gate
  c.strokeStyle = '#d2c9ad'; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 6; c.beginPath(); c.moveTo(1108, 380); c.lineTo(1066, 416); c.lineTo(1126, 448); c.lineTo(1050, 492); c.lineTo(1020, 560); c.stroke();
  paintCastle(c, 986, 380, 1, {stone: '#c3c5cb', shade: '#a9adb8', roof: '#7786a4', roofShade: '#64728f', mark: '#6c7386', flag: '#b4574d'});
  const t = {light: '#5f8f72', dark: '#4c7a61', trunk: '#59493a'};
  [[900, 470, 44], [868, 500, 52], [930, 452, 36], [1276, 462, 46], [1304, 488, 54], [1246, 430, 34]].forEach(([x, y, h]) => paintPine(c, x, y, h, h * 0.5, t, 3));
};
const farHills = (c: Ctx) => {
  const pts = [[-260, 470], [120, 420], [380, 456], [640, 432], [900, 470], [1200, 446], [1500, 412], [1860, 462]];
  paintHills(c, pts, 680, {light: '#76a184', dark: '#648f75'});
  const yAt = (x: number) => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const k = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k; } return 460; };
  const r = rnd(11), t = {light: '#528769', dark: '#417458', trunk: '#4f4336'};
  // tree lines on the ridge, in clumps with gaps
  [[-200, 40], [60, 250], [380, 470], [840, 1010], [1330, 1620], [1700, 1860]].forEach(([a, b]) => { for (let x = a; x < b; x += 15 + r() * 12) { const h = 34 + r() * 24; paintPine(c, x, yAt(x) + 5, h, h * 0.46, t, 3); } });
  // the village in the dip, the church above its roofs, smoke
  const wall = {light: '#e9e2d0', dark: '#c9c3b6'}, red = {light: '#c0735a', dark: '#9b5743'}, grey = {light: '#8b93a6', dark: '#727a8f'};
  c.fillStyle = wall.light; c.fillRect(648, 388, 15, 62); c.fillStyle = wall.dark; c.fillRect(658, 388, 7, 62); P(c, [[644, 388], [656.5, 346], [669, 388]], grey.light); P(c, [[656.5, 346], [669, 388], [660, 388]], grey.dark);
  ([[556, 458, 34, 20, red], [600, 452, 30, 22, grey], [674, 452, 38, 22, red], [722, 458, 30, 19, grey], [760, 464, 34, 20, red], [626, 468, 42, 24, red], [700, 472, 36, 22, grey]] as [number, number, number, number, typeof red][]).forEach(([x, b, w, h, rf]) => paintHouse(c, x, b, w, h, wall, rf));
  [[612, 412, 4], [617, 402, 5.5], [625, 390, 7], [776, 428, 3.5], [781, 418, 5]].forEach(([x, y, q]) => { c.beginPath(); c.arc(x, y, q, 0, 7); c.fillStyle = 'rgba(232,236,242,0.7)'; c.fill(); });
  [[540, 468, 13], [590, 474, 11], [742, 474, 12], [800, 470, 14], [664, 480, 10]].forEach(([x, y, q]) => { c.beginPath(); c.arc(x, y, q, 0, 7); c.fillStyle = '#4f8565'; c.fill(); c.beginPath(); c.arc(x - q * 0.25, y - q * 0.25, q * 0.6, 0, 7); c.fillStyle = '#5f9672'; c.fill(); });
  // fields: long strips in other greens and a straw yellow, and the road going on to the village
  c.save(); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(1860, 680); c.lineTo(-260, 680); c.clip();
  P(c, [[860, 500], [1090, 482], [1130, 512], [880, 532]], '#8fae7c'); P(c, [[1150, 486], [1380, 462], [1410, 494], [1170, 516]], '#c8c486'); P(c, [[300, 500], [520, 492], [540, 522], [310, 532]], '#8bab7a'); P(c, [[60, 470], [270, 478], [280, 508], [50, 500]], '#c2bf84');
  c.strokeStyle = '#d2c9ad'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(772, 600); c.quadraticCurveTo(820, 540, 730, 506); c.quadraticCurveTo(690, 492, 700, 474); c.stroke(); c.restore();
};
const nearHills = (c: Ctx) => {
  const pts = [[-260, 522], [60, 484], [300, 514], [520, 502], [735, 530], [800, 530], [1010, 508], [1300, 494], [1560, 472], [1860, 506]];
  paintHills(c, pts, 700, {light: '#7fa86c', dark: '#6c965f'});
  const yAt = (x: number) => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const k = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k; } return 500; };
  const r = rnd(5);
  [[-240, 330], [470, 640], [900, 1000], [1240, 1700]].forEach(([a, b]) => { for (let x = a; x < b; x += 26 + r() * 22) { const h = 60 + r() * 46, k = Math.floor(r() * 3); paintPine(c, x, yAt(x) + 8, h, h * 0.48, PINE[k], 4); } });
  c.strokeStyle = '#cdbf98'; c.lineWidth = 11; c.lineCap = 'round'; c.beginPath(); c.moveTo(768, 700); c.lineTo(770, 528); c.stroke();
};
const foreground = (c: Ctx) => {
  // a bough in the upper left corner and grass at the lower edge, darker than the scene: the frame within the frame
  const g = ['#27452f', '#35583a', '#456c46'];
  const r = rnd(3);
  for (let x = -260; x < 1860; x += 9 + r() * 10) { const edge = Math.min(1, Math.abs(x - 800) / 800), h = 16 + r() * 26 + edge * edge * 70, w = 7 + r() * 6, lean = (r() - 0.5) * 22; P(c, [[x - w, 912], [x + lean, 900 - h], [x + w, 912]], r() < 0.5 ? g[0] : g[1]); }
  [[70, 868], [128, 880], [1480, 872], [1540, 884], [1420, 890]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 6, 0, 7); c.fillStyle = '#e9d27a'; c.fill(); });
};

// ---------------------------------------------------------------- the built pieces (boxes: big, simple, they give the depth)
const ROAD = new THREE.CatmullRomCurve3([[-1.4, 4], [-0.7, 0.5], [0.7, -4], [2.2, -9], [1.9, -15], [0.3, -22], [-0.5, -30], [-0.6, -38]].map(([x, z]) => new THREE.Vector3(x, 0, z)));
const Patches: React.FC = () => {
  const list = useMemo(() => { const r = rnd(8); return Array.from({length: 26}, () => { const z = 2 - r() * 34; return [(r() - 0.5) * (16 + -z * 0.9), z, 1 + r() * 2.6, r() < 0.55] as const; }); }, []);
  return <>{list.map(([x, z, q, lightOne], i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006 + i * 0.0002, z]} scale={[1, 0.34, 1]} receiveShadow><circleGeometry args={[q, 28]} /><meshLambertMaterial color={lightOne ? '#9bb478' : '#7f9a66'} /></mesh>)}</>;
};

const pine = (k: number) => (c: Ctx, W: number, H: number) => paintPine(c, W / 2, H, H, W, PINE[k], 4 + (k % 2));
const TREES: [number, number, number, number][] = [   // x, z, height, kind
  [-7.4, -13, 7.6, 2], [-11.5, -16, 9, 0], [-6.8, -19, 6.2, 1], [-9.5, -24, 7, 1], [-15, -21, 8.2, 2], [-6.0, -26, 5.6, 0], [-17, -28, 7.4, 1], [-6.5, -31, 5, 2],
  [10.6, -14, 8.2, 0], [12.8, -18, 9, 2], [9.2, -21, 6.4, 1], [14.6, -12, 6.6, 1], [11.4, -27, 7, 0], [15.5, -24, 8, 2], [17.5, -30, 7.6, 0], [9.5, -30, 5.6, 1],
];
/** 'chieu-ta' (d1c9 scene 20, Doom turns for home over a mountain pass): the same valley under a low gold sun, every painted layer and sprite warmed or cooled by distance, a sunset sky,
 *  the pass rocks with snow, snow driven across, a flag on the castle. The default (no `gio`) is the day set exactly as before. */
export type ValleyGio = 'ngay' | 'chieu-ta';
export const VALLEY_MARKS = {doomLung: [-0.9, 0, 3.0] as V3, robotThua: [0.8, 0, 0.8] as V3 /* chapter 10 scene 14 */, doomHo: [0.3, 0, -3.0] as V3 /* centre of the crater `hoVa` (chapter 12 scene 34) */};   // chieu-ta: Doom from behind at screen x 0.33 from VIEW.cam (his head is clear of the castle, which sits right of centre)
export const VALLEY_VIEWS = {vai: [-0.1, 1.55, 7.2] as V3, dao2: [1.1, 1.45, 5.0] as V3 /* chapter 10 scene 14: another corner of the pass; the robot at robotThua */, gan: [-0.44, 1.55, 5.6] as V3 /* chapter 10 scene 1 */};     // chieu-ta: level with his shoulders
const warm = (paint: (c: Ctx) => void, col: string) => (c: Ctx) => { paint(c); c.globalCompositeOperation = 'source-atop'; c.fillStyle = col; c.fillRect(-400, -300, 2400, 1400); c.globalCompositeOperation = 'source-over'; };
const warmArt = (art: (c: Ctx, W: number, H: number) => void, col: string) => (c: Ctx, W: number, H: number) => { art(c, W, H); c.globalCompositeOperation = 'source-atop'; c.fillStyle = col; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; };
const skyCT = (c: Ctx) => {
  const g = c.createLinearGradient(0, -140, 0, 540); g.addColorStop(0, '#5e5f98'); g.addColorStop(0.4, '#a2789c'); g.addColorStop(0.72, '#ec9f7a'); g.addColorStop(1, '#f8cf8e'); c.fillStyle = g; c.fillRect(-300, -200, 2200, 1300);
  const h = c.createRadialGradient(150, 470, 0, 150, 470, 760); h.addColorStop(0, 'rgba(255,226,150,0.85)'); h.addColorStop(0.3, 'rgba(255,190,120,0.3)'); h.addColorStop(1, 'rgba(255,170,110,0)'); c.fillStyle = h; c.fillRect(-300, -200, 2200, 1300);
  c.beginPath(); c.arc(150, 470, 44, 0, 7); c.fillStyle = '#fff1c4'; c.fill();
  paintCloud(c, 300, 70, 1.1, {light: '#f2b894', dark: '#c98a98'}); paintCloud(c, 1100, 120, 0.9, {light: '#f4c09a', dark: '#c58a9c'}); paintCloud(c, 760, 210, 0.7, {light: '#f8cfa4', dark: '#d6959a'}); paintCloud(c, 1450, 60, 0.8, {light: '#d6a0a6', dark: '#a8789e'});
};
const SPR_DUSK = 'rgba(120,70,100,0.30)';
// ---------------------------------------------------------------- added 23/11/2026: lit castle windows with a fluttering pennant (chapter 10 scene 1), the crater of Doom's fall (chapter 12 scene 34)
/** a point of the castle plate (screen units of the standard camera, 1600 x 900) in world metres: the plate stands d = 95 m in front of VIEW.cam */
const onPlate = (sx: number, sy: number, d = 95): V3 => { const t = Math.tan((VIEW.fov * Math.PI) / 360), wf = 2 * t * d * (VIEW.W / VIEW.H), hf = 2 * t * d; return [VIEW.cam[0] + ((sx - 800) * wf) / VIEW.W, VIEW.cam[1] + ((450 - sy) * hf) / VIEW.H, VIEW.cam[2] - d + 0.4]; };
const CASTLE_WINDOWS: [number, number][] = [[985.4, 289.5], [1062, 306.5], [1123, 324.5]];
/** cua 0..3: the three windows light one after the other (a window fades in over one unit); the pennants of the three towers flutter. Drawn over the castle plate (chieu-ta) */
const CastleLife: React.FC<{cua: number; f: number}> = ({cua, f}) => {
  return (
    <group>
      {CASTLE_WINDOWS.map(([sx, sy], i) => { const k = Math.max(0, Math.min(1, cua - i)); if (k <= 0.01) return null; const p = onPlate(sx, sy);
        return <group key={i} position={[p[0], p[1], p[2]]}><mesh renderOrder={2}><planeGeometry args={[0.52, 1.15]} /><meshBasicMaterial color="#ffd36a" transparent opacity={k} depthWrite={false} /></mesh><Halo pos={[0, 0, 0.05]} r={2.6} color="#ffb84a" strength={0.32 * k} order={2} /></group>; })}
      <PennantAt sx={998} sy={133} f={f} w={22} h={13} seed={0} /><PennantAt sx={911} sy={203} f={f} w={20} h={12} seed={2} /><PennantAt sx={1131} sy={221} f={f} w={20} h={12} seed={4} />
    </group>
  );
};
/** a pennant that flutters: a strip of nine segments whose free end waves; it covers the painted pennant of the castle at the same place */
const PennantAt: React.FC<{sx: number; sy: number; f: number; w: number; h: number; seed: number}> = ({sx, sy, f, w, h, seed}) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1, 9, 1), []), p = onPlate(sx, sy), U = 0.0526;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  // u lấy từ chỉ số đỉnh, không đọc lại x: đọc lại thì mỗi khung cờ dài thêm 0,5 (24/11/2026, chương 16 cảnh 11)
  for (let v = 0; v < pos.count; v++) { const u = (v % 10) / 9, y0 = v < 10 ? 0.5 : -0.5; pos.setX(v, u); pos.setY(v, y0 * (1 - 0.55 * u) + Math.sin(f * 0.34 + u * 5 + seed) * 0.12 * u); pos.setZ(v, Math.sin(f * 0.34 + u * 5 + seed) * 0.25 * u); }
  pos.needsUpdate = true; geo.computeVertexNormals();
  return <mesh geometry={geo} position={[p[0], p[1], p[2] + 0.03]} scale={[w * U, h * U, 1]} renderOrder={2}><meshBasicMaterial color="#c0605a" side={THREE.DoubleSide} /></mesh>;
};
/** THE CRATER of Doom's fall: a pit 2.2 m wide (rim ring of thrown earth with lumps and flung stones, dark inside), cracks radiating from it, burnt grass, thin smoke and ash */
const Crater: React.FC<{pos: V3; f: number}> = ({pos, f}) => {
  const R = useMemo(() => rnd(23), []);
  const lumps = useMemo(() => Array.from({length: 22}, (_, i) => { const a = (i / 22) * 6.2832 + R() * 0.2, d = 1.3 + R() * 0.45; return {x: Math.cos(a) * d, z: Math.sin(a) * d * 0.62, s: [0.22 + R() * 0.34, 0.05 + R() * 0.1 + (Math.sin(a) < -0.3 ? 0.1 : 0), 0.18 + R() * 0.28] as V3, ry: R() * 3, i}; }), [R]);
  const cracks = useMemo(() => Array.from({length: 11}, (_, i) => { const a = (i / 11) * 6.2832 + R() * 0.3, len = 1.2 + R() * 1.8; return {a, len, i}; }), [R]);
  const stones = useMemo(() => Array.from({length: 14}, (_, i) => { const a = R() * 6.2832, d = 1.5 + R() * 2.4; return {x: Math.cos(a) * d, z: Math.sin(a) * d * 0.7, s: 0.07 + R() * 0.16, ry: R() * 3, i}; }), [R]);
  return (
    <group position={pos}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.62, 1]}><circleGeometry args={[2.3, 24]} /><meshLambertMaterial color="#4a4034" transparent opacity={0.7} /></mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.62, 1]}><circleGeometry args={[1.5, 20]} /><meshLambertMaterial color="#6a5844" /></mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.62, 1]}><circleGeometry args={[1.1, 18]} /><meshLambertMaterial color="#2a211a" /></mesh>
      <mesh position={[0.05, 0.04, 0.05]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.6, 1]}><circleGeometry args={[0.62, 14]} /><meshLambertMaterial color="#120d0a" /></mesh>
      {cracks.map((c) => <mesh key={c.i} position={[Math.cos(c.a) * (1.3 + c.len / 2), 0.035, Math.sin(c.a) * (1.3 + c.len / 2) * 0.62]} rotation={[-Math.PI / 2, 0, -c.a * 0.62]}><planeGeometry args={[c.len, 0.07 + (c.i % 3) * 0.03]} /><meshBasicMaterial color="#1a1410" /></mesh>)}
      {lumps.map((l) => <mesh key={l.i} position={[l.x, l.s[1] / 2, l.z]} rotation={[0, l.ry, 0]} castShadow receiveShadow><boxGeometry args={l.s} /><meshLambertMaterial color={l.i % 3 === 0 ? '#8a7258' : l.i % 3 === 1 ? '#6c5a44' : '#9a8468'} flatShading /></mesh>)}
      {stones.map((l) => <mesh key={l.i} position={[l.x, l.s / 2, l.z]} rotation={[0, l.ry, 0.2]} castShadow><boxGeometry args={[l.s * 1.4, l.s, l.s]} /><meshLambertMaterial color="#8d8f8c" flatShading /></mesh>)}
      {[[-2.2, 0.9], [2.4, 0.5], [0.5, 1.8], [-1.0, -1.6], [2.0, -1.4]].map(([x, z], i) => <mesh key={i} position={[x, 0.014, z]} rotation={[-Math.PI / 2, 0, i]} scale={[1, 0.6, 1]}><circleGeometry args={[0.6 + (i % 3) * 0.25, 10]} /><meshBasicMaterial color="#3a3a22" transparent opacity={0.55} /></mesh>)}
      <SmokeDrift f={f} box={[-0.7, 0.7, 0.5, 2.6, -0.3, 0.3]} n={5} color="#8a847a" opacity={0.3} size={0.7} wind={0.1} seed={4} order={6} />
      <AirLayer f={f} box={[-2.4, 2.4, 0.1, 2.6, -1.0, 1.4]} n={26} color={['#8a7a64', '#6a6054', '#a69884']} size={0.035} life={110} wind={[0.05, 0.22]} wob={0.2} opacity={0.85} seed={44} />
      <AirLayer f={f} box={[-2.6, 2.6, 0.3, 2.4, -1.0, 1.6]} n={14} color={['#d8d4cc', '#f2eee6']} size={0.04} life={120} wind={[0.3, -0.04]} wob={0.2} opacity={0.9} seed={45} />
      <pointLight position={[0, 0.5, 0.8]} color="#ffb070" intensity={0.9} distance={4} decay={1.5} />
    </group>
  );
};
export const Valley: React.FC<{children?: React.ReactNode; dx?: number; dz?: number; gio?: ValleyGio; f?: number; eye?: V3; tuyet?: number;
  /** added 23/11/2026 (default: nothing, the old images unchanged): cua 0..3 = castle windows lighting one by one and the tower pennants fluttering ('chieu-ta' only); hoVa = the crater of the fall at VALLEY_MARKS.doomHo */
  cua?: number; hoVa?: boolean}> = ({children, dx, dz, gio = 'ngay', f = 0, eye = VIEW.cam, tuyet = 1, cua, hoVa}) => { datNoiBui(tuyet > 0 ? 'tuyet' : 'ngoai-troi'); return (gio === 'chieu-ta' ? (
  <Scene3 grade="lateDay" dir={[-8, 3.4, 4.5]} reach={26}>
    <StageCam eye={eye} haze="#d8a88e" fog={[20, 420]} dx={dx} dz={dz} />
    <Plate id="sky-ct" d={520} paint={skyCT} fog={false} /><Plate id="far-ct" d={215} paint={warm(farRange, 'rgba(176,130,190,0.42)')} /><Plate id="mid-ct" d={140} paint={warm(midRange, 'rgba(176,120,150,0.4)')} />
    <Plate id="castle-ct" d={95} paint={warm(castleHill, 'rgba(190,120,130,0.34)')} />{cua !== undefined ? <TheoTam><CastleLife cua={cua} f={f} /></TheoTam> : null}<Plate id="hills-ct" d={70} paint={warm(farHills, 'rgba(200,120,110,0.3)')} /><Plate id="near-ct" d={46} paint={warm(nearHills, 'rgba(210,130,90,0.28)')} />
    <Ground near="#86884e" far="#8a8468" size={[110, 54]} pos={[0, 0, -11.5]} swell={0.03} patch={0.05} farAt={0.6} />
    <Patches /><Road curve={ROAD} /><Fence curve={ROAD} off={-1.95} from={0.43} to={0.8} /><Fence curve={ROAD} off={2.0} from={0.27} to={0.52} seed={5} />
    {TREES.map(([x, z, h, k], i) => <Sprite key={i} name={`pine${k}-ct`} art={warmArt(pine(k), SPR_DUSK)} px={[300, 600]} w={h * 0.42} pos={[x, 0, z]} flip={i % 2 === 1} />)}
    {/* the pass: rock masses with snow flanking the road, a ledge at the front left, drifts in the lee, a few loose rocks */}
    <RockMass pos={[-5.6, 0, -1.6]} w={4.2} h={3.8} d={3.4} seed={4} rotY={0.4} color="#c9b2b0" snow={0.9} snowColor="#f2dcd8" />
    <RockMass pos={[6.6, 0, -2.8]} w={5.2} h={4.6} d={3.8} seed={9} rotY={-0.3} color="#c9b2b0" snow={0.9} snowColor="#f2dcd8" />
    <RockMass pos={[-9.8, 0, -9]} w={6} h={5.4} d={4} seed={2} rotY={0.2} color="#bda8ae" snow={0.8} snowColor="#f0dcdc" />
    <SnowRock pos={[-3.0, 0, 1.3]} w={1.8} h={0.9} seed={5} rotY={0.5} color="#8a727a" snow="#f6e4de" />
    <SnowRock pos={[2.6, 0, -0.4]} w={0.9} h={0.5} seed={6} rotY={1.2} color="#8a727a" snow="#f6e4de" /><SnowRock pos={[4.2, 0, 1.6]} w={0.6} h={0.35} seed={7} color="#8a727a" snow="#f6e4de" />
    <SnowDrift pos={[-1.8, 0, -0.9]} w={2.6} d={1.2} h={0.22} seed={3} color="#f2e2dc" /><SnowDrift pos={[3.4, 0, -2.2]} w={3.2} d={1.4} h={0.26} seed={5} color="#f2e2dc" />
    <Scatter kind="meadow" area={[15, 7]} pos={[0, 0, -1.5]} seed={4} density={1.2} keep={[[0, 0, 1.2]]} />
    {/* snow driven across the pass (from the right to the left) and a pennant on the castle's tall tower */}
    <Blizzard f={f} eye={eye} amount={tuyet * 1.2} n={150} wind={3.4} fall={0.35} streak={0.05} size={0.018} reach={[1.5, 22]} seed={13} color="#fff4ec" />
    <Blizzard f={f} eye={eye} amount={tuyet * 1.2} n={110} wind={2.6} fall={0.3} streak={0.05} size={0.03} height={9} reach={[8, 44]} seed={17} color="#ffeee4" />
    {hoVa ? <Crater pos={VALLEY_MARKS.doomHo} f={f} /> : null}
    {children}
    <Plate id="fg-ct" d={3.4} paint={warm(foreground, 'rgba(120,70,70,0.4)')} fog={false} order={900} />
  </Scene3>
) : (
  <Scene3 grade="dayExterior" reach={22}>
    <StageCam eye={VIEW.cam} haze={HAZE} fog={[16, 400]} dx={dx} dz={dz} />
    <Plate id="sky" d={520} paint={sky} fog={false} /><Plate id="far" d={215} paint={farRange} /><Plate id="mid" d={140} paint={midRange} /><Plate id="castle" d={95} paint={castleHill} /><Plate id="hills" d={70} paint={farHills} /><Plate id="near" d={46} paint={nearHills} />
    <Ground near="#8ea66c" far="#84a073" size={[110, 54]} pos={[0, 0, -11.5]} swell={0.03} patch={0.05} farAt={0.6} />
    <Patches /><Road curve={ROAD} /><Fence curve={ROAD} off={-1.95} from={0.43} to={0.8} /><Fence curve={ROAD} off={2.0} from={0.27} to={0.52} seed={5} />
    {TREES.map(([x, z, h, k], i) => <Sprite key={i} name={`pine${k}`} art={pine(k)} px={[300, 600]} w={h * 0.42} pos={[x, 0, z]} flip={i % 2 === 1} />)}
    <Sprite name="tree" art={(c, W, H) => paintTree(c, W, H)} px={[600, 720]} w={5.2} pos={[-6.3, 0, -5.4]} /><Sprite name="tree2" art={(c, W, H) => paintTree(c, W, H, ['#47794a', '#5a9258', '#74aa62'])} px={[600, 720]} w={4.6} pos={[-15.5, 0, -15]} flip /><Sprite name="tree2" art={(c, W, H) => paintTree(c, W, H)} px={[600, 720]} w={5.2} pos={[15, 0, -17]} />
    {([[-2.7, -8.4, 1.5, '#f2f2f2'], [4.3, -12.5, 1.7, ''], [-5.4, -11, 1.9, '#e88aa0'], [1.1, -18.5, 1.5, ''], [6.6, -20, 1.9, '#f4e27a'], [-1.9, -30, 1.8, ''], [3.1, -7.4, 1.3, '#f2f2f2'], [8.4, -5.6, 1.6, '#e88aa0']] as [number, number, number, string][]).map(([x, z, w, f], i) => <Sprite key={i} name={`bush${f}`} art={(c, W, H) => paintBush(c, W, H, undefined, f || undefined)} px={[400, 240]} w={w} pos={[x, 0, z]} flip={i % 2 === 0} />)}
    {[[4.4, -17, 1.8], [6.0, -20, 1.6], [3.6, -21.5, 1.4]].map(([x, z, w], i) => <Sprite key={i} name="hay" art={paintHaystack} px={[300, 300]} w={w} pos={[x, 0, z]} />)}
    {[[-2.0, -2.4, 0.7], [3.6, -3.0, 0.56], [-4.2, -6.8, 0.8], [1.9, -10.5, 0.6]].map(([x, z, w], i) => <Sprite key={i} name="rock" art={paintRock} px={[240, 150]} w={w} pos={[x, 0, z]} flip={i % 2 === 1} shade={0.4} />)}
    <Cottage pos={[6.9, 0, -9.5]} rotY={0.5} /><Crate pos={[4.3, 0, -7.2]} rotY={0.3} /><Crate pos={[4.35, 0.7, -7.25]} s={0.5} rotY={-0.2} /><Crate pos={[5.1, 0, -6.8]} s={0.56} rotY={0.7} /><Barrel pos={[3.7, 0, -8.0]} />
    <Well pos={[-3.9, 0, -8.2]} />
    <Scatter kind="meadow" area={[15, 7]} pos={[0, 0, -1.5]} seed={4} density={2.2} keep={[[0, 0, 1.2]]} /><Scatter kind="meadow" area={[30, 14]} pos={[0, 0, -13]} seed={9} density={2.4} />
    {hoVa ? <Crater pos={VALLEY_MARKS.doomHo} f={f} /> : null}
    {children}
    <Plate id="fg" d={3.4} paint={foreground} fog={false} order={900} />
  </Scene3>
)); };
const ValleyStill: React.FC = () => { const {width, height} = useVideoConfig(); return <AbsoluteFill><Finish><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><Valley /></ThreeCanvas></Finish></AbsoluteFill>; };
// ---------------------------------------------------------------- lower-body test: a man walks in, stops, talks; a child reacts
const MAN: Spec = {outfit: 'vest', hair: 'sweep', build: 'adult', longLegs: true, expr: {...EXPR.smile, gaze: [18, -2]}, armL: {...POSES.idle[0]}, armR: {...POSES.idle[1]},
  palette: {hair: '#6b4a2a', hairLine: '#8a6a44', brow: '#3a2816', shirt: '#ece6d6', shirtEdge: '#cfc7b2', shirtRim: '#f7f3e8', vest: '#3f6a8a', shorts: '#3d4252', shoe: '#2b2422'}};
const KID: Spec = {outfit: 'vest', hair: 'level', build: 'child', expr: {...EXPR.neutral, gaze: [20, -8]}, armL: {...POSES.idle[0]}, armR: {...POSES.idle[1]},
  palette: {hair: '#b5602e', hairLine: '#d08a4a', brow: '#7a3a18', vest: '#b9463c', shirt: '#f4e6b8', shirtEdge: '#d8c48a', shirtRim: '#fbf2d2', shorts: '#3f5a7a', shoe: '#2f2620'}};
const MAN_BEATS: Beat[] = [{f: 6, body: 'walk', dist: 1611, over: 56}, {f: 68, pose: 'greet', big: true}, {f: 86, pose: 'present', say: 22}, {f: 110, body: 'shift'}, {f: 122, pose: 'point', body: 'leanIn', say: 18},
  {f: 146, pose: 'hips', body: 'upright'}, {f: 164, body: 'step', dir: -1}, {f: 178, pose: 'idle'}];
const KID_BEATS: Beat[] = [{f: 40, pose: 'akimbo'}, {f: 72, face: 'smile', look: [20, -10]}, {f: 96, body: 'shift'}, {f: 128, face: 'shock', look: [20, -16], pose: 'gasp', body: 'recoil'}, {f: 152, face: 'happy', look: [20, -12], pose: 'cheer', body: 'hop'}, {f: 174, pose: 'chest'}];
const KM = perform(MAN_BEATS, {dirDefault: 1}), KK = perform(KID_BEATS, {dirDefault: -1, mirror: true});
const ValleyWalk: React.FC = () => {
  const {width, height} = useVideoConfig(), f = useCurrentFrame(), t = f / 191;
  return (
    <AbsoluteFill><Finish><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>
      <Valley dx={-0.3 + 0.6 * t} dz={-0.5 * t}>
        <Puppet3 height={1.7} pos={[-3.3, 0, -0.6]} spec={blink(act(MAN, KM, f, {seed: 1}), f, [30, 100, 158], 'half')} />
        <Puppet3 height={1.15} pos={[1.25, 0, -0.9]} flip spec={blink(act(KID, KK, f, {seed: 2}), f, [18, 88, 140], 'half')} />
      </Valley>
    </ThreeCanvas></Finish></AbsoluteFill>
  );
};
/** 'chieu-ta' stills, no people: the standard view, and level with Doom's shoulders (the d1c9 scene 20 camera) */
const ctStill = (eye: V3, f: number): React.FC => () => { const {width, height} = useVideoConfig(); return <AbsoluteFill><Finish><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><Valley gio="chieu-ta" eye={eye} f={f} /></ThreeCanvas></Finish></AbsoluteFill>; };
const ValleyCTToan = ctStill(VIEW.cam, 10), ValleyCTVai = ctStill(VALLEY_VIEWS.vai, 30);
const stillOf = (eye: V3, f: number, o: {gio?: ValleyGio; cua?: number; hoVa?: boolean}): React.FC => () => { const {width, height} = useVideoConfig(); return <AbsoluteFill><Finish><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><Valley eye={eye} f={f} {...o} /></ThreeCanvas></Finish></AbsoluteFill>; };
const NEW_STILLS: [string, React.FC][] = [
  ['valley-ct-dao2', stillOf(VALLEY_VIEWS.dao2, 10, {gio: 'chieu-ta'})], ['valley-ct-gan-cua', stillOf(VALLEY_VIEWS.gan, 30, {gio: 'chieu-ta', cua: 3})], ['valley-ct-cua-1', stillOf(VALLEY_VIEWS.gan, 30, {gio: 'chieu-ta', cua: 1.5})],
  ['valley-ngay-hova', stillOf(VIEW.cam, 20, {hoVa: true})], ['valley-ct-hova', stillOf(VIEW.cam, 20, {gio: 'chieu-ta', hoVa: true})],
];
export const ValleyComps: React.FC = () => <>{NEW_STILLS.map(([id, C]) => <Composition key={id} id={id} component={C} width={1280} height={720} fps={24} durationInFrames={1} />)}<Composition id="valley-still" component={ValleyStill} width={1280} height={720} fps={24} durationInFrames={1} /><Composition id="valley-walk" component={ValleyWalk} width={1280} height={720} fps={24} durationInFrames={192} />
  <Composition id="valley-chieu-ta-toan" component={ValleyCTToan} width={1280} height={720} fps={24} durationInFrames={1} /><Composition id="valley-chieu-ta-vai" component={ValleyCTVai} width={1280} height={720} fps={24} durationInFrames={1} /></>;
