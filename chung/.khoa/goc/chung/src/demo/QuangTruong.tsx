import React, {useMemo} from 'react';
import {datNoiBui} from '../lib3/mauBui';
import {Composition, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {Scene3, Ground} from '../lib3/look';
import {StageCam, Crate, Barrel, Sack, Fireflies} from '../lib3/kit';
import {Plate, Sprite, rnd, P, Ctx, paintPeak, paintHills, paintPine, paintCastle, paintCloud, paintHouse, paintBush} from '../lib3/depth';
import {Shot} from '../lib3/shot';
import {StoneBox, stoneTex} from '../lib3/kitForge';
import {tex} from '../lib3/kitLab';
import {Basket, Cask, HandCart} from '../lib3/kitCamp';
import {AirLayer} from '../lib3/kitCamp';
import {Halo} from '../lib3/look';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import {POSES} from '../mould/gestures';
import {SKINS} from '../mould/palettes';
import type {Spec} from '../mould/draw';
import {Casa, Pedestal, MaskBanner, Bunting, LanternString, RoofFlag, Pigeon, PigeonFlock, Stall, GateTower, GuardPost, paintCobbles, GateBien} from '../lib3/kitQuangTruong';

/** QUẢNG TRƯỜNG LATVERIA (chapter 10 scenes 5-9 and 17, chapter 11 scenes 11, 12, 15; chapters 15, 16 reuse it). Part of the common set: NO people
 *  (they come in through `children`); the stone statue of Doom on the pedestal is part of the square and is drawn with the mould's Doom outfit in grey stone.
 *  World metres, camera looks along -z. The square: cobbles x -13..13, z +8..-18, a fan of stones round the pedestal at (0, 0, -9.6).
 *  Left side row x -9.8 (houses face +x), right side row x +9.8 (face -x), back: a left cluster with the GATE TOWER (x -9.8..-4.2, face z -12.4),
 *  an open AVENUE (x -4.2..3.1) running away to the castle on its hill, a right cluster. On the right the GUARD POST (x 4.8..9.0, front z -4.6).
 *  Market: bread stall (-2.1, -3.4), fruit stall (2.2, -4.0), both open to the camera; the mask banner on its pole at (1.9, -7.0).
 *  States: 'ngay' (default, blue day, Y > 120); 'ngay-am' (warmer, lower sun: chapter 11 scene 15 "the world he believes in"); 'le-hoi' (pink-orange
 *  dusk, lanterns lit, festival bunting and paper confetti: chapter 10 scene 9).
 *  Props: coMai 0..1 = the green pennants unfurling on the roof ridges from the near ones to the far ones (1 = all up; the castle's own flags show at 1);
 *  bien = the gate sign (see GateTower); gianGiao = scaffolds at the gate; bui = density of the air (dust, leaves, paper). */
type V3 = [number, number, number];
export type QtState = 'ngay' | 'ngay-am' | 'le-hoi';

const GATE: V3 = [-7.0, 0, -12.4], POST: V3 = [4.8, 0, -4.6], PED: V3 = [0, 0, -9.6];
/** Marks (world metres). People stand on y = 0 unless a value says otherwise. */
export const QT_MARKS = {
  quayBanh: [-2.1, 0, -3.4] as V3, quayQua: [2.2, 0, -4.0] as V3,
  baBanh: [-2.1, 0, -4.1] as V3,          // the baker behind her counter (counter front z -3.4, depth 0.9)
  khachBanh: [-2.4, 0, -2.5] as V3,       // a customer at the bread stall, 0.9 m in front of the counter
  banQua: [2.2, 0, -4.7] as V3, khachQua: [2.4, 0, -3.1] as V3,
  danA: [-3.4, 0, -1.4] as V3, danB: [-1.6, 0, -2.0] as V3, danC: [0.3, 0, -2.8] as V3, danD: [1.7, 0, -1.7] as V3, danE: [3.4, 0, -1.2] as V3, danF: [-0.6, 0, -4.4] as V3,   // six backs to the lens, z -1 to -4.4
  be: PED, doomBe: [0, 0, -7.3] as V3,    // Doom before the pedestal (front edge of the base z -7.85)
  doomChi: [0.15, 0, -5.8] as V3,         // Doom pointing west (ch11 s12): a low camera (QT_VIEWS.chiTay with `rise` 0.18) sees the banner on the right and the sky above the avenue
  linhGac: [5.6, 0, -5.45] as V3,         // the old guard seated on the porch bench (seat top y 0.5; the bench spans x 5.1..6.4)
  tho1: [GATE[0] - 1.9, 1.3, GATE[2] + 0.7] as V3, tho2: [GATE[0] + 1.9, 1.3, GATE[2] + 0.7] as V3,   // the two workers on the scaffold decks (y = deck)
  cong: GATE, tram: POST, bienGiua: [GATE[0], 3.77, GATE[2] + 0.2] as V3,
  banRong: [1.9, 0, -7.0] as V3,
};
/** Camera positions (eye). cho = ch10 s5 (+ ch11 s15: with state 'ngay-am'); cui = s7; leHoi = s9; cao = s17 (a high move); tramGac = s6; cong = s8 (the sign
 *  fills the upper third, the scaffold decks lower left and right); truocTuong = ch11 s11 (three backs in front, Doom at the pedestal); chiTay = ch11 s12 (low, the banner right). */
export const QT_VIEWS = {
  cho: [0, 1.55, 3.4] as V3, cui: [0, 1.6, 4.2] as V3, leHoi: [0, 1.2, 3.6] as V3, cao: [0, 3.3, 10] as V3,
  tramGac: [6.95, 1.4, 0.9] as V3, cong: [GATE[0], 2.2, GATE[2] + 8.5] as V3,
  truocTuong: [0, 1.5, 0.4] as V3, chiTay: [0.15, 1.0, -2.4] as V3,
};

// ---------------------------------------------------------------- the far layers (painted on plates, standard camera [0, 1.55, 3.4])
const STD: V3 = [0, 1.55, 3.4];
const skyDay = (warm: boolean) => (c: Ctx) => {
  const g = c.createLinearGradient(0, -140, 0, 520); if (warm) { g.addColorStop(0, '#7fa8d8'); g.addColorStop(1, '#f1dcba'); } else { g.addColorStop(0, '#78a9e0'); g.addColorStop(0.6, '#a9cdf0'); g.addColorStop(1, '#dcebf6'); }
  c.fillStyle = g; c.fillRect(-300, -200, 2200, 1300);
  const tw = warm ? {light: '#fff4e4', dark: '#f0d6bc'} : {light: '#f4f8fc', dark: '#d3e1f0'};
  paintCloud(c, 240, 50, 1.1, tw); paintCloud(c, 980, 110, 0.9, tw); paintCloud(c, 1380, 40, 0.8, tw); paintCloud(c, -140, 160, 0.75, tw);
  c.strokeStyle = '#5d6c84'; c.lineWidth = 2.2; [[620, 150, 8], [646, 138, 7], [668, 156, 6], [1250, 240, 7]].forEach(([x, y, s]) => { c.beginPath(); c.moveTo(x - s, y - s * 0.5); c.lineTo(x, y); c.lineTo(x + s, y - s * 0.6); c.stroke(); });
};
const skyDusk = (c: Ctx) => {
  const g = c.createLinearGradient(0, -140, 0, 540); g.addColorStop(0, '#6a64a4'); g.addColorStop(0.38, '#b27ca4'); g.addColorStop(0.7, '#f2a47c'); g.addColorStop(1, '#fad093'); c.fillStyle = g; c.fillRect(-300, -200, 2200, 1300);
  const h = c.createRadialGradient(1180, 480, 0, 1180, 480, 760); h.addColorStop(0, 'rgba(255,226,150,0.8)'); h.addColorStop(0.3, 'rgba(255,190,120,0.28)'); h.addColorStop(1, 'rgba(255,170,110,0)'); c.fillStyle = h; c.fillRect(-300, -200, 2200, 1300);
  c.beginPath(); c.arc(1180, 480, 40, 0, 7); c.fillStyle = '#fff1c4'; c.fill();
  paintCloud(c, 160, 80, 1.1, {light: '#f4b894', dark: '#c98a98'}); paintCloud(c, 760, 150, 0.9, {light: '#f6c29c', dark: '#c58a9c'}); paintCloud(c, 1300, 60, 0.8, {light: '#d6a0a6', dark: '#a8789e'});
};
const farRange = (tintCol: string | null) => (c: Ctx) => {
  const t = {light: '#b3c4dc', dark: '#9aaecd', snow: '#f3f6fa', snowShade: '#d5deec'};
  paintPeak(c, 790, -40, 560, 640, t); paintPeak(c, 230, 46, 430, 640, t); paintPeak(c, 1370, 70, 470, 640, t); paintPeak(c, 1820, 150, 300, 640, t); paintPeak(c, -220, 160, 300, 640, t);
  if (tintCol) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = tintCol; c.fillRect(-400, -300, 2400, 1400); c.globalCompositeOperation = 'source-over'; }
};
const castleHill = (flags: boolean, tintCol: string | null) => (c: Ctx) => {
  c.translate(60, 0);
  P(c, [[640, 640], [740, 500], [820, 440], [880, 392], [1120, 392], [1160, 430], [1250, 500], [1360, 640]], '#7f9086'); P(c, [[640, 640], [740, 500], [820, 440], [880, 392], [960, 392], [920, 470], [940, 640]], '#93a498'); P(c, [[1120, 392], [1160, 430], [1250, 500], [1360, 640], [1230, 640], [1190, 500]], '#6f8078');
  c.strokeStyle = '#d2c9ad'; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 6; c.beginPath(); c.moveTo(1010, 392); c.lineTo(960, 424); c.lineTo(1030, 458); c.lineTo(940, 500); c.lineTo(900, 580); c.stroke();
  paintCastle(c, 850, 392, 1.1, {stone: '#c3c5cb', shade: '#a9adb8', roof: '#4f8a64', roofShade: '#3d7050', mark: '#5c6a60', flag: flags ? '#2f9a4a' : 'rgba(0,0,0,0)'});
  const t = {light: '#5f8f72', dark: '#4c7a61', trunk: '#59493a'}; [[780, 480, 46], [748, 510, 54], [820, 462, 38], [1200, 470, 48], [1236, 498, 56], [1170, 440, 36]].forEach(([x, y, h]) => paintPine(c, x, y, h, h * 0.5, t, 3));
  if (tintCol) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = tintCol; c.fillRect(-400, -300, 2400, 1400); c.globalCompositeOperation = 'source-over'; }
};
const farHills = (tintCol: string | null) => (c: Ctx) => {
  const pts = [[-260, 470], [120, 430], [380, 456], [640, 440], [900, 470], [1200, 446], [1500, 420], [1860, 462]];
  paintHills(c, pts, 680, {light: '#76a184', dark: '#648f75'});
  const yAt = (x: number) => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const k = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k; } return 460; };
  const r = rnd(11), t = {light: '#528769', dark: '#417458', trunk: '#4f4336'};
  [[-200, 60], [330, 560], [900, 1010], [1300, 1700]].forEach(([a, b]) => { for (let x = a; x < b; x += 15 + r() * 12) { const h = 34 + r() * 24; paintPine(c, x, yAt(x) + 5, h, h * 0.46, t, 3); } });
  const wall = {light: '#e9e2d0', dark: '#c9c3b6'}, red = {light: '#c0735a', dark: '#9b5743'};
  ([[560, 460, 34, 20], [610, 454, 30, 22], [676, 454, 38, 22], [726, 460, 30, 19], [776, 466, 34, 20], [630, 470, 42, 24]] as number[][]).forEach(([x, b, w, h]) => paintHouse(c, x, b, w, h, wall, red));
  if (tintCol) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = tintCol; c.fillRect(-400, -300, 2400, 1400); c.globalCompositeOperation = 'source-over'; }
};

// ---------------------------------------------------------------- the town
type House = {x: number; z: number; rot: number; w: number; hW: number; ridge: number; look: number; seed: number; floors?: number; shop?: 'banh' | 'hoa' | 'ruou'; lit?: number};
const HOUSES: House[] = [
  // left side row, faces +x
  {x: -9.8, z: -1.6, rot: Math.PI / 2, w: 4.2, hW: 5.0, ridge: 2.3, look: 1, seed: 21, shop: 'ruou'}, {x: -9.8, z: -5.7, rot: Math.PI / 2, w: 4.4, hW: 5.6, ridge: 2.6, look: 3, seed: 22, lit: 0.3},
  {x: -9.8, z: -9.7, rot: Math.PI / 2, w: 4.2, hW: 5.2, ridge: 2.4, look: 0, seed: 23, floors: 2},
  // right side row, faces -x
  {x: 9.8, z: -1.6, rot: -Math.PI / 2, w: 4.0, hW: 5.2, ridge: 2.4, look: 2, seed: 24, shop: 'hoa'}, {x: 9.8, z: -5.7, rot: -Math.PI / 2, w: 4.4, hW: 5.6, ridge: 2.5, look: 4, seed: 25, lit: 0.3},
  {x: 9.8, z: -9.7, rot: -Math.PI / 2, w: 4.2, hW: 5.0, ridge: 2.3, look: 1, seed: 26},
  // back left cluster (the gate tower stands at x -8..-2.4)
  {x: -12.2, z: -13.4, rot: 0, w: 4.8, hW: 5.8, ridge: 2.7, look: 3, seed: 31, floors: 3}, {x: -16.6, z: -13.4, rot: 0, w: 4.2, hW: 5.0, ridge: 2.2, look: 0, seed: 32},
  // back right cluster
  {x: 5.0, z: -13.4, rot: 0, w: 3.8, hW: 5.4, ridge: 2.5, look: 1, seed: 33, shop: 'banh', lit: 0.3}, {x: 8.9, z: -13.4, rot: 0, w: 4.0, hW: 6.0, ridge: 2.6, look: 2, seed: 34, floors: 3}, {x: 13.0, z: -13.4, rot: 0, w: 4.2, hW: 5.2, ridge: 2.4, look: 4, seed: 35},
];
const ridgeOf = (h: House): V3 => { const dz = -3.0, c = Math.cos(h.rot), s = Math.sin(h.rot); return [h.x + dz * s, h.hW + h.ridge, h.z + dz * c]; };

const STATUE: Spec = {outfit: 'doom', mask: 'iron', hair: 'sweep', build: 'adult', longLegs: true, bulk: 1.3, expr: {...EXPR.neutral, upper: 'none', lower: 'none', brow: 'none'}, armL: {...POSES.akimbo[0]}, armR: {...POSES.akimbo[1]},
  palette: {...SKINS.tan, cloak: '#8f9796', cloakDark: '#6c7473', cloakLight: '#aab1af', cloakIn: '#565e5d', tunic: '#98a09e', plate: '#aeb4b2', plateLine: '#4c5453', armour: '#9aa2a0', armourDark: '#737b79', armourLight: '#c4cac8', gold: '#b9b29c', goldDark: '#8a846f', belt: '#6f7776', socket: '#2c302f'}};

const Lamp: React.FC<{pos: V3; lit: number; f: number}> = ({pos, lit, f}) => (
  <group position={pos}>
    <B3 p={[0, 1.7, 0]} s={[0.1, 3.4, 0.1]} c="#2f3236" /><B3 p={[0, 0.2, 0]} s={[0.34, 0.4, 0.34]} c="#3a3d42" /><B3 p={[0.22, 3.3, 0]} s={[0.5, 0.06, 0.06]} c="#2f3236" />
    <B3 p={[0.46, 3.1, 0]} s={[0.26, 0.36, 0.26]} c={lit > 0 ? '#ffd27a' : '#c9c0a4'} cast={false} /><B3 p={[0.46, 3.34, 0]} s={[0.34, 0.07, 0.34]} c="#2f3236" />
    {lit > 0 ? <Halo pos={[0.46, 3.1, 0.2]} r={0.9 + 0.04 * Math.sin(f * 0.3)} color="#ffb860" strength={0.55 * lit} /> : null}
  </group>
);
const B3: React.FC<{p: V3; s: V3; c: string; cast?: boolean}> = ({p, s, c, cast = true}) => <mesh position={p} castShadow={cast} receiveShadow><boxGeometry args={s} /><meshLambertMaterial color={c} /></mesh>;

export type QuangTruongProps = {children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; state?: QtState; coMai?: number; bien?: GateBien; gianGiao?: boolean; bui?: number; ngoai?: React.ReactNode};
export const QuangTruong: React.FC<QuangTruongProps> = ({children, f = 0, dx, dz, eye = QT_VIEWS.cho, state = 'ngay', coMai = 1, bien = 'moi', gianGiao, bui = 1, ngoai}) => { datNoiBui('ngoai-troi');
  const fest = state === 'le-hoi', warm = state === 'ngay-am', lit = fest ? 1 : 0;
  const tintFar = fest ? 'rgba(220,130,130,0.34)' : warm ? 'rgba(240,190,130,0.16)' : null, tintMid = fest ? 'rgba(220,120,110,0.3)' : null;
  const cobble = useMemo(() => tex('qt-cobbles', 1820, 1820, paintCobbles(26, 26, 13, 8.4)), []);
  const flags = useMemo(() => HOUSES.map((h) => ({h, p: ridgeOf(h)})).sort((a, b) => b.p[2] - a.p[2]), []);
  const N = flags.length + 3, tow = (i: number) => Math.max(0, Math.min(1, (coMai * (N + 2) - i) / 2));
  const haze = fest ? '#e7ae92' : warm ? '#d6dcdc' : '#c3d8ec';
  return (
    <Scene3 grade={fest || warm ? 'lateDay' : 'dayExterior'} dir={fest ? [-9, 5.2, 4.5] : warm ? [-7, 6.4, 4.6] : undefined} reach={26}>
      <StageCam eye={eye} haze={haze} fog={[34, 460]} dx={dx} dz={dz} />
      <hemisphereLight args={fest ? ['#ffd8c0', '#9a7a78', 0.55] : ['#fff4e2', '#b8aa94', 0.7]} />
      <Plate from={STD} id={fest ? 'qt-sky-fest' : warm ? 'qt-sky-warm' : 'qt-sky'} d={520} paint={fest ? skyDusk : skyDay(warm)} fog={false} />
      <Plate from={STD} id={`qt-far-${state}`} d={215} paint={farRange(tintFar)} /><Plate from={STD} id={`qt-castle-${state}-${coMai >= 0.97 ? 1 : 0}`} d={95} paint={castleHill(coMai >= 0.97, tintFar)} />
      <Plate from={STD} id={`qt-hills-${state}`} d={70} paint={farHills(tintMid)} />
      <Ground near="#8ea66c" far="#84a073" size={[140, 90]} pos={[0, -0.03, -30]} swell={0.02} patch={0.05} farAt={0.6} />
      <mesh position={[0, 0.006, -5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[26, 26]} /><meshLambertMaterial map={cobble} /></mesh>
      {/* the avenue to the castle: a dirt strip, low walls, poplars */}
      <mesh position={[0.15, 0.004, -38]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[5.0, 42]} /><meshLambertMaterial color="#a8946e" /></mesh>
      {[-1, 1].map((s) => <StoneBox key={s} id={`qt-avwall-${s}`} p={[0.15 + s * 2.7, 0.45, -28]} s={[0.5, 0.9, 20]} look={{seed: 41, tones: ['#9a958a', '#8a857b', '#a6a196'], mortar: '#5a564e', course: [0.3, 0.3], len: [0.5, 0.9], damp: 0.3}} />)}
      {[[-3.6, -22], [3.8, -24], [-3.9, -30], [4.0, -33], [-3.7, -38], [3.9, -41]].map(([x, z], i) => <Sprite key={i} name={`qt-poplar-${i % 2}`} art={(c, W, H) => paintPine(c, W / 2, H, H, W * 0.5, {light: '#5a9460', dark: '#44774d', trunk: '#5a4634'}, 6)} px={[160, 420]} w={1.8} pos={[x, 0, z]} />)}
      {/* the town */}
      {HOUSES.map((h, i) => <Casa key={i} pos={[h.x, 0, h.z]} rotY={h.rot} w={h.w} hW={h.hW} ridge={h.ridge} look={h.look} seed={h.seed} floors={h.floors ?? 2} shop={h.shop ?? null} lit={fest ? 0.85 : h.lit ?? 0} f={f} smoke={i % 3 !== 1} />)}
      <GateTower pos={GATE} bien={bien} gianGiao={gianGiao} f={f} />
      <GuardPost pos={POST} f={f} />
      {flags.map(({p}, i) => <RoofFlag key={i} pos={p} k={tow(i)} f={f} h={1.7} seed={i} />)}
      {/* the pedestal and the statue */}
      <Pedestal pos={PED} /><Puppet3 spec={STATUE} height={2.75} pos={[PED[0], 1.68, PED[2] + 0.1]} noShadow={false} />
      {[[-1.3, 0.92, -8.3], [1.5, 0.92, -9.1], [0.9, 1.68, -8.7]].map(([x, y, z], i) => <Pigeon key={i} pos={[x, y, z]} flip={i === 1} w={0.3} />)}
      <Pigeon pos={[2.3, 7.3, -3.2]} w={0.3} /><Pigeon pos={[-9.4, 7.9, -5.1]} w={0.3} flip />
      {/* the market */}
      <Stall pos={QT_MARKS.quayBanh} kind="banh" f={f} seed={1} /><Stall pos={QT_MARKS.quayQua} kind="qua" f={f} seed={2} />
      <Basket pos={[-3.6, 0, -3.2]} s={1.2} tall /><Basket pos={[-3.2, 0, -2.7]} s={0.9} /><Cask pos={[-3.9, 0, -4.1]} s={1.1} /><Crate pos={[-0.9, 0, -5.3]} s={0.55} rotY={0.3} />
      <Barrel pos={[3.6, 0, -4.9]} /><Basket pos={[3.5, 0, -3.4]} s={1.0} /><Sack pos={[4.0, 0, -3.8]} s={1.1} /><Sack pos={[4.35, 0, -3.5]} s={0.9} />
      <HandCart pos={[-5.6, 0, -2.4]} rotY={0.6} /><Crate pos={[-6.7, 0, -4.2]} s={0.8} rotY={0.4} /><Barrel pos={[-6.2, 0, -4.9]} />
      <Lamp pos={[-5.6, 0, -6.4]} lit={lit} f={f} /><Lamp pos={[5.2, 0, -9.2]} lit={lit} f={f} />
      <MaskBanner pos={[QT_MARKS.banRong[0], 0.4, QT_MARKS.banRong[2]]} w={1.3} h={4.2} f={f} />
      <MaskBanner pos={[6.5, 1.8, -13.1]} w={0.8} h={2.6} f={f + 20} /><MaskBanner pos={[-10.9, 1.8, -13.1]} w={0.8} h={2.6} f={f + 40} />
      {/* strings across the square: bunting always, lanterns at the festival */}
      <Bunting a={[-9.5, 6.4, -3.0]} b={[9.5, 6.4, -3.0]} sag={1.0} n={18} f={f} seed={1} /><Bunting a={[-9.5, 6.6, -8.0]} b={[9.5, 6.6, -8.0]} sag={1.1} n={18} f={f} seed={2} />
      <Bunting a={[-2.8, 4.2, -3.2]} b={[2.4, 3.9, -4.0]} sag={0.4} n={9} f={f} seed={3} cols={['#e8503a', '#e2b843', '#2f7a40']} />
      {fest ? <>
        <LanternString a={[-9.5, 5.8, -1.0]} b={[9.5, 5.8, -1.0]} sag={1.0} n={10} f={f} seed={1} /><LanternString a={[-9.5, 5.0, -5.6]} b={[9.5, 5.0, -5.6]} sag={1.0} n={10} f={f} seed={2} />
        <LanternString a={[-9.0, 4.4, -2.0]} b={[-9.0, 4.4, -9.0]} sag={0.8} n={6} f={f} seed={4} /><LanternString a={[9.0, 4.4, -2.0]} b={[9.0, 4.4, -9.0]} sag={0.8} n={6} f={f} seed={5} />
      </> : null}
      <PigeonFlock f={f} at={[0.5, 6.6, -6.5]} n={fest ? 0 : 5} r={3.4} seed={2} />
      {fest ? null : <Fireflies f={f} />}
      {/* the air: gold dust, leaves, and at the festival paper confetti and warm sparks */}
      <AirLayer f={f} box={[-11, 11, 0.4, 5.2, -14, -2]} n={110 * bui} color={fest ? ['#ffd9a0', '#ffc888', '#ffe6c0'] : ['#f6cc62', '#ffd780', '#fbe6a8']} size={0.07} life={170} wind={[0.07, 0.012]} opacity={0.75} seed={61} />
      <AirLayer f={f} box={[-7, 7, 0.5, 3.6, -7, 3]} n={60 * bui} color={fest ? ['#ffd9a0', '#ffe6c0'] : ['#f6cc62', '#fbe6a8']} size={0.05} life={150} wind={[0.06, 0.015]} opacity={0.85} seed={62} />
      <AirLayer f={f} box={[-9, 9, 0.8, 4.4, -12, 1]} n={(fest ? 54 : 30) * bui} color={fest ? ['#2f7a40', '#e2b843', '#f4efdf', '#e8503a'] : ['#c9b45a', '#a9b858', '#e0c070', '#d8683a']} size={0.06} life={120} wind={[0.5, -0.05]} wob={0.22} opacity={0.95} seed={63} leaf />
      {fest ? <AirLayer f={f} box={[-10, 10, 0.6, 4.6, -12, 0]} n={36 * bui} color={['#ffe070', '#ffc060']} size={0.045} life={140} wind={[0.02, 0.04]} wob={0.3} opacity={1} seed={64} add blink /> : null}
      {ngoai}
      {children}
    </Scene3>
  );
};

// ---------------------------------------------------------------- stills (no people): comp ids for the stage notes
/** `rise` of the Shot for a view that looks UP (chiTay) or DOWN onto roofs (cao): pass it to <Shot rise={...}> */
export const QT_RISE: Partial<Record<keyof typeof QT_VIEWS, number>> = {cao: 0.14, chiTay: 0.18};
const mk = (view: keyof typeof QT_VIEWS, o: Partial<QuangTruongProps> = {}, frame = 16): React.FC => () => {
  const f = useCurrentFrame() + frame, eye = QT_VIEWS[view];
  return <Shot grade={o.state === 'le-hoi' || o.state === 'ngay-am' ? 'lateDay' : 'dayExterior'} eye={eye} rise={QT_RISE[view] ?? 0} finish={{warm: ''}} figures={null} set={(inside, cam) => <QuangTruong eye={eye} dx={cam.dx} dz={cam.dz} f={f} {...o}>{inside}</QuangTruong>} />;
};
const STILLS: [string, React.FC][] = [
  ['qt-cho', mk('cho')], ['qt-cui', mk('cui')], ['qt-cao', mk('cao', {coMai: 0.55})], ['qt-cao-xong', mk('cao')], ['qt-le-hoi', mk('leHoi', {state: 'le-hoi'})], ['qt-le-hoi-rong', mk('cho', {state: 'le-hoi'})],
  ['qt-tram-gac', mk('tramGac')], ['qt-cong-cu', mk('cong', {bien: 'cu'})], ['qt-cong-doi', mk('cong', {bien: {cu: 0.3, moi: 0.45}})], ['qt-cong-moi', mk('cong', {bien: 'moi'})],
  ['qt-truoc-tuong', mk('truocTuong')], ['qt-chi-tay', mk('chiTay')], ['qt-ngay-am', mk('cho', {state: 'ngay-am'})],
];
export const QuangTruongComps: React.FC = () => <>{STILLS.map(([id, C]) => <Composition key={id} id={id} component={C} width={1280} height={720} fps={24} durationInFrames={48} />)}</>;
void stoneTex; void paintBush;
