import React from 'react';
import {AbsoluteFill, Composition, useVideoConfig, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Scene3, Finish, Ground} from '../lib3/look';
import {Scatter} from '../lib3/detail';
import {Plate, Sprite, rnd, P, Ctx, paintPeak, paintHills, paintCloud, paintHouse, paintBamboo, paintPalm, paintTree, paintBush, paintTuft, paintChicken, paintEgret, paintFlameTree, paintWaterTower, paintPotPlant} from '../lib3/depth';
import {B, StageCam, Track, Locomotive, Carriage, Platform, StationShelter, StationLamp, Semaphore, PoleLine, CarryBaskets, Bench, LocoSmoke} from '../lib3/kit';
import {Puppet3} from '../mould/Puppet3';
import {Shot, frameOn} from '../lib3/shot';
import {EXPR} from '../mould/expr';
import {withPose, perform, swapArms, lintBeats, Beat} from '../mould/gestures';
import {act, blink} from '../mould/act';
import {SOLE_Y, HAIR_TOP} from '../mould/draw';
import type {Spec} from '../mould/draw';

/** A small country railway station in the late afternoon (stage-1 test of the written skills: no reference frame used).
 *  The camera stands on the platform looking across the tracks. Platform top = y 0; the track bed lies TY lower.
 *  The train waits on the far track, the locomotive's nose a little right of centre; beyond it the line curves away
 *  through the rice to a gap in the trees (the eye line); the shelter frames the upper right, the flame tree the upper left.
 *  The boy's walking lane is the strip z 0.4 from the left edge to his mark; nothing stands in it. */
type V3 = [number, number, number];
const HAZE = '#e9d3b2', EYE: V3 = [0, 1.6, 8], TY = -0.9, RT = TY + 0.05 + 0.27;   // RT = rail top
// marks chosen so each head falls on a patch of another tone: the master's dark hair on the engine's cream band, the boy's on the
// pale rice beyond the track. The boy comes OUT of the station (from the right) and stops; the master, on his left, turns to him.
export const BOY_MARK: V3 = [1.5, 0, 0.4], MASTER_MARK: V3 = [-0.6, 0, 0];

// ---------------------------------------------------------------- painted layers, back to front (screen units 1600 x 900)
const sky = (c: Ctx) => {
  const g = c.createLinearGradient(0, -200, 0, 520); g.addColorStop(0, '#8ea6c6'); g.addColorStop(0.45, '#d6c3b4'); g.addColorStop(1, '#f5d6a2'); c.fillStyle = g; c.fillRect(-300, -200, 2200, 1300);
  // the low sun, upper left, a soft glow round it
  ([[130, 'rgba(255,236,190,0.18)'], [84, 'rgba(255,236,190,0.32)'], [52, 'rgba(255,240,205,0.6)'], [34, '#fff3d6']] as [number, string][]).forEach(([r, f]) => { c.beginPath(); c.arc(800, 176, r, 0, 7); c.fillStyle = f; c.fill(); });
  paintCloud(c, 900, 46, 1.0, {light: '#f6dcb4', dark: '#d9b39c'}); paintCloud(c, 1180, 150, 0.75, {light: '#f3d7b2', dark: '#d6ae9a'}); paintCloud(c, 160, 210, 0.6, {light: '#f1d2ae', dark: '#d2aa98'}); paintCloud(c, 1420, 40, 0.6, {light: '#e9d0b8', dark: '#cdab9f'});
  // a skein of birds going home
  [[1000, 230], [1026, 218], [1050, 236], [1078, 226], [1012, 252]].forEach(([x, y]) => { c.strokeStyle = '#6d5f63'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - 9, y - 4); c.quadraticCurveTo(x - 4, y - 7, x, y); c.quadraticCurveTo(x + 4, y - 7, x + 9, y - 4); c.stroke(); });
};
const farRange = (c: Ctx) => {
  const t = {light: '#b6abc0', dark: '#a198b1'};
  paintPeak(c, 300, 300, 420, 640, t); paintPeak(c, 860, 330, 380, 640, t); paintPeak(c, 1380, 290, 440, 640, t); paintPeak(c, 1840, 340, 300, 640, t); paintPeak(c, -200, 340, 300, 640, t);
};
const ridge = (pts: number[][]) => (x: number) => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const k = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k; } return pts[pts.length - 1][1]; };
const midHills = (c: Ctx) => {
  paintHills(c, [[-260, 440], [120, 404], [420, 432], [760, 396], [1040, 430], [1300, 410], [1560, 386], [1860, 420]], 640, {light: '#9fa79a', dark: '#8d9590'});
};
const landmark = (c: Ctx) => {
  // the station's old water tower on a low rise beyond the bend, and a few roofs of the next village
  P(c, [[1080, 520], [1180, 486], [1300, 478], [1420, 494], [1520, 520]], '#93a17e');
  paintWaterTower(c, 1345, 482, 0.95, {light: '#d8c6a4', dark: '#bba987', tank: '#a98a6c', tankDark: '#8f735a', cap: '#8a5a48'});
  ([[1140, 494, 26, 13], [1340, 488, 30, 14], [1400, 496, 22, 11]] as number[][]).forEach(([x, b, w, h]) => paintHouse(c, x, b, w, h, {light: '#e5d4b0', dark: '#cbb995'}, {light: '#b77a5c', dark: '#9a6450'}, '#7a6a58'));
};
const farTrees = (c: Ctx) => {
  // a far line of trees and palms, broken where the railway runs out through it; cooking smoke over two roofs
  const base = 518, r = rnd(23), gap = [1170, 1320];
  for (let x = -260; x < 1860; x += 16 + r() * 14) { if (x > gap[0] && x < gap[1]) continue; const q = 14 + r() * 16; c.beginPath(); c.arc(x, base - 6 - r() * 10, q, 0, 7); c.fillStyle = ['#7f9468', '#8a9e70', '#74895f'][Math.floor(r() * 3)]; c.fill(); }
  c.fillStyle = '#7f9468'; c.fillRect(-300, base - 6, gap[0] + 300, 30); c.fillRect(gap[1], base - 6, 600, 30);
  [[300, 450], [338, 466], [980, 456], [1460, 448], [1500, 468], [120, 462]].forEach(([x, y]) => { c.strokeStyle = '#8f8a70'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, base); c.lineTo(x + 3, y); c.stroke(); for (let k = 0; k < 7; k++) { const a = (-170 + k * 27) * (Math.PI / 180); c.strokeStyle = k % 2 ? '#6c8457' : '#7a9160'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 3, y); c.quadraticCurveTo(x + 3 + Math.cos(a) * 13, y + Math.sin(a) * 13 - 3, x + 3 + Math.cos(a) * 21, y + Math.sin(a) * 14 + 8); c.stroke(); } });
  ([[1380, base - 2, 34, 16]] as number[][]).forEach(([x, b, w, h]) => paintHouse(c, x, b, w, h, {light: '#e2d2b0', dark: '#c8b896'}, {light: '#c9ab6a', dark: '#a98e56'}, '#6f6250'));
  [[1416, 474, 5], [1420, 462, 7], [1428, 448, 9]].forEach(([x, y, q]) => { c.beginPath(); c.arc(x, y, q, 0, 7); c.fillStyle = 'rgba(244,236,224,0.66)'; c.fill(); });
};
const nearTrees = (c: Ctx) => {
  // the nearer line: bamboo clumps and round trees, open at the bend so the line of the rails runs on into the distance
  const base = 534, r = rnd(29), gap = [1130, 1460];
  for (let x = -260; x < 1860; x += 14 + r() * 12) { if (x > gap[0] && x < gap[1]) continue; c.beginPath(); c.arc(x, base - r() * 8, 12 + r() * 12, 0, 7); c.fillStyle = r() < 0.5 ? '#6c8a55' : '#5f7d4c'; c.fill(); }
  c.fillStyle = '#617f4e'; c.fillRect(-300, base - 4, gap[0] + 300, 40); c.fillRect(gap[1], base - 4, 600, 40);
  ([[-150, 220, 260, 1], [60, 180, 220, 2], [430, 200, 240, 3], [700, 170, 200, 4], [1000, 190, 230, 5], [1560, 210, 250, 6], [1760, 190, 230, 7]] as number[][]).forEach(([x, w, h, s]) => { c.save(); c.translate(x - w / 2, base + 4 - h); paintBamboo(c, w, h, s, {a: '#a7ad6c', b: '#8e9658', leaf: '#6f9452', leafDark: '#5c8047'}); c.restore(); });
  ([[860, 150, 160], [1030, 120, 130], [1500, 140, 150]] as number[][]).forEach(([x, w, h], i) => { c.save(); c.translate(x - w / 2, base + 4 - h); paintTree(c, w, h, i % 2 ? ['#5c7a4a', '#6c8b54', '#81a05e'] : ['#587548', '#678650', '#7b9a5a']); c.restore(); });
};
const foreground = (c: Ctx) => {
  // nearest layer: the rim of a big glazed pot with a plant at the lower right, grass in the cracks at the lower corners
  const r = rnd(41);
  const g = ['#55703f', '#64804a'];
  for (let x = -260; x < 1860; x += 10 + r() * 14) { const edge = Math.min(1, Math.abs(x - 800) / 800); if (edge < 0.55) continue; const h = 8 + r() * 16 + edge * edge * 38, w = 5 + r() * 4, lean = (r() - 0.5) * 18; P(c, [[x - w, 912], [x + lean, 902 - h], [x + w, 912]], g[r() < 0.5 ? 0 : 1]); }
  // a few fallen flame-tree petals at the lower left
  for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(40 + r() * 260, 872 + r() * 26, 7, 3.5, r() * 3, 0, 7); c.fillStyle = r() < 0.5 ? '#c9402c' : '#e0603a'; c.fill(); }
};

// ---------------------------------------------------------------- the rice beyond the line: one painted sheet on the track bed
const paddyTex = (() => { let t: THREE.CanvasTexture | null = null; return () => {
  if (t) return t;
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024; const c = cv.getContext('2d')!, k = 2048 / 100, X = (x: number) => (x + 50) * k, Y = (z: number) => (z + 62) * k, r = rnd(51);
  c.fillStyle = '#c9ad55'; c.fillRect(0, 0, 2048, 1024);
  const cols = [-50, -36, -24, -13, -3, 7, 16, 27, 38, 50], rows = [-62, -46, -33, -22, -12], pal = ['#d1b35a', '#c4a24c', '#a9b35c', '#d8bd66', '#93a853', '#cdaa50'];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) {
    const x0 = X(cols[i]) + (j - 1.5) * 8, x1 = X(cols[i + 1]) + (j - 1.5) * 8, y0 = Y(rows[j]), y1 = Y(rows[j + 1]), wet = (i === 1 && j === 3) || (i === 7 && j === 1);
    c.fillStyle = wet ? '#c2ccc0' : pal[(i * 2 + j * 3) % 6]; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.strokeStyle = wet ? 'rgba(120,150,96,0.7)' : 'rgba(110,96,40,0.28)'; c.lineWidth = 2;
    if ((i + j) % 2) for (let x = x0 + 8; x < x1 - 4; x += 14) { c.beginPath(); c.moveTo(x, y0 + 4); c.lineTo(x, y1 - 4); c.stroke(); }
    else for (let y = y0 + 8; y < y1 - 4; y += 14) { c.beginPath(); c.moveTo(x0 + 4, y); c.lineTo(x1 - 4, y); c.stroke(); }
    if (wet) for (let n = 0; n < 5; n++) { c.fillStyle = 'rgba(250,236,206,0.6)'; c.fillRect(x0 + 20 + r() * (x1 - x0 - 120), y0 + 14 + r() * (y1 - y0 - 30), 60 + r() * 60, 5); }
  }
  const bank = (a: number[], b: number[], w: number) => { c.strokeStyle = '#8a9a52'; c.lineWidth = w + 8; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = '#b39a6c'; c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
  for (let j = 0; j < 4; j++) cols.forEach((x) => bank([X(x) + (j - 1.5) * 8, Y(rows[j])], [X(x) + (j - 1.5) * 8 + (r() - 0.5) * 6, Y(rows[j + 1])], 12));
  rows.forEach((z) => bank([0, Y(z) + (r() - 0.5) * 4], [2048, Y(z) + (r() - 0.5) * 4], 13));
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t; }; })();

// the far line: straight past the platform, then bending away through the rice towards the gap in the trees
const FAR_LINE = new THREE.CatmullRomCurve3([[-80, 0, -7.6], [-30, 0, -7.6], [2.5, 0, -7.6], [6.5, 0, -8.7], [9.6, 0, -12.5], [12, 0, -20], [14.2, 0, -33], [16.6, 0, -55], [19, 0, -90]].map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, 'centripetal');
const NEAR_LINE = new THREE.LineCurve3(new THREE.Vector3(-80, 0, -3.6), new THREE.Vector3(60, 0, -3.6));

// moving = the sequence: the engine smoke rises and drifts (the still keeps its one painted column)
export const Station: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; moving?: boolean}> = ({children, f = 0, dx, dz, moving}) => (
  <Scene3 grade="lateDay" dir={[-8, 4.5, 3.5]} reach={22}>
    <StageCam eye={EYE} haze={HAZE} fog={[20, 420]} dx={dx} dz={dz} />
    <Plate from={EYE} id="st-sky" d={520} paint={sky} fog={false} /><Plate from={EYE} id="st-far" d={215} paint={farRange} /><Plate from={EYE} id="st-mid" d={140} paint={midHills} /><Plate from={EYE} id="st-mark" d={95} paint={landmark} /><Plate from={EYE} id="st-trees" d={70} paint={farTrees} /><Plate from={EYE} id="st-near" d={58} paint={nearTrees} />
    {/* the track bed and the rice beyond it */}
    <Ground near="#a49a68" far="#b4a66e" size={[200, 90]} pos={[0, TY, -42]} swell={0.02} patch={0.06} farAt={0.6} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TY + 0.004, -37]} receiveShadow><planeGeometry args={[100, 50]} /><meshLambertMaterial map={paddyTex()} /></mesh>
    <group position={[0, TY + 0.05, 0]}><Track curve={FAR_LINE} seed={5} /><Track curve={NEAR_LINE} seed={8} /></group>
    {/* the train about to leave: locomotive (smoke at the stack), one coach behind it with its door open */}
    <Locomotive pos={[-1.0, RT, -7.6]} L={5.6} smoke={!moving} />
    {moving && <LocoSmoke pos={[-1.6, RT + 4.0, -7.35]} f={f} n={12} life={96} rise={1.9} wind={1.1} size={0.46} />}
    <Carriage pos={[-8.85, RT, -7.6]} open={1} num="3" />
    <Carriage pos={[-19.0, RT, -7.6]} num="2" seed={4} />
    <Semaphore pos={[7.6, TY, -11]} />
    <PoleLine feet={[[-24, TY, -10.6], [-13, TY, -10.6], [-2, TY, -10.6], [8.6, TY, -12.2], [17, TY, -19]]} h={6} />
    {/* beyond the line: trees, bamboo, bananas, a haystack, a buffalo and egrets in the rice */}
    {([[-12, -12.5, 6.5, 0], [8.5, -16, 5.6, 1], [22, -18, 6.4, 0], [-26, -16, 7, 1]] as number[][]).map(([x, z, w, k], i) => <Sprite key={i} name={`sttree${k}`} art={(c, W, H) => paintTree(c, W, H, k ? ['#56743f', '#678548', '#7d9a55'] : ['#5a7a44', '#6b8a4c', '#82a05a'])} px={[600, 720]} w={w} pos={[x, TY, z]} flip={i % 2 === 1} />)}
    {([[11.5, -13.5, 3.6, 2], [3.6, -24, 4.2, 4], [-5, -20, 4.4, 6]] as number[][]).map(([x, z, w, s], i) => <Sprite key={i} name={`stbamboo${s}`} art={(c, W, H) => paintBamboo(c, W, H, s, {a: '#a7ad6c', b: '#8e9658', leaf: '#6f9452', leafDark: '#5c8047'})} px={[420, 640]} w={w} pos={[x, TY, z]} flip={i % 2 === 1} />)}
    {([[10.4, -21, 2.6], [15.2, -27, 2.8]] as number[][]).map(([x, z, w], i) => <Sprite key={i} name="stpalm" art={paintPalm} px={[300, 620]} w={w} pos={[x, TY, z]} flip={i % 2 === 1} />)}
    {([[4.6, -28, 0.46], [9.4, -34, 0.44], [3.2, -32, 0.42]] as number[][]).map(([x, z, w], i) => <Sprite key={i} name="stegret" art={paintEgret} px={[120, 200]} w={w} pos={[x, TY, z]} flip={i % 2 === 0} shade={0} />)}
    {([[3.2, -5.4, 0.5], [6.4, -5.8, 0.46], [-6, -5.6, 0.5], [9, -9.8, 0.5], [2.4, -9.9, 0.44]] as number[][]).map(([x, z, w], i) => <Sprite key={i} name="sttuft" art={(c, W, H) => paintTuft(c, W, H, {light: '#8a9a58', dark: '#728248'})} px={[160, 110]} w={w} pos={[x, TY, z]} flip={i % 2 === 0} cast={false} shade={0} />)}
    {/* the platform, its shelter on the right, the lamp and the flame tree on the left */}
    <Platform x0={-40} x1={40} edge={-2.2} back={12} h={-TY} wear={[16, 10]} wearAt={[0, 1]} />
    <StationShelter pos={[2.9, 0, 0.5]} w={9} d={4.6} h={3.0} office={0.95} board={[0.05, -1.3, 1.6]} bell={[0.6, -1.75]} />
    <CarryBaskets pos={[3.5, 0, -1.2]} rotY={-0.9} />
    <Bench pos={[-4.0, 0, -1.3]} />
    <StationLamp pos={[-2.6, 0, -1.6]} />
    <Sprite name="sthen" art={(c, W, H) => paintChicken(c, W, H)} px={[140, 120]} w={0.42} pos={[-3.3, 0, -1.9]} shade={0.3} /><Sprite name="sthen2" art={(c, W, H) => paintChicken(c, W, H, '#f1ead8', '#d8ccb0')} px={[140, 120]} w={0.38} pos={[-2.1, 0, -2.0]} flip shade={0.3} />
    <Sprite name="stflametree2" art={(c, W, H) => paintFlameTree(c, W, H, 3)} px={[900, 640]} w={7.6} pos={[-4.9, 0, -1.9]} shade={0.2} />
    {Array.from({length: 14}, (_, i) => { const r = rnd(60 + i); return <mesh key={`pt${i}`} rotation={[-Math.PI / 2, 0, r() * 3]} position={[-6 + r() * 4.2, 0.006, -1.8 + r() * 1.4]}><circleGeometry args={[0.05, 6]} /><meshBasicMaterial color={i % 2 ? '#c9402c' : '#de5a38'} /></mesh>; })}
    <Scatter kind="street" pos={[0, 0, -0.4]} area={[12, 2.6]} seed={9} density={1} keep={[[-4.5, 0.8, 0.7], [-3, 0.8, 0.7], [-1.5, 0.8, 0.7], [0, 0.8, 0.7], [1.7, 0.4, 0.8], [1.7, 0.8, 0.7], [2.6, 0.8, 0.7], [3.5, 0.8, 0.7], [4.4, 0.8, 0.7]]} />
    {children}
    <Plate from={EYE} id="st-fg" d={3} paint={foreground} fog={false} order={900} />
  </Scene3>
);

// ---------------------------------------------------------------- the two people at their marks, neutral
export const MASTER: Spec = withPose({outfit: 'vest', hair: 'sweep', build: 'adult', longLegs: true, expr: {...EXPR.neutral, gaze: [18, 10]},
  palette: {hair: '#3f3a36', brow: '#2a2522', shirt: '#eceef0', shirtEdge: '#c9ced6', shirtRim: '#f7f8f9', vest: '#2f4c75', shorts: '#34363c', shoe: '#221e1c'}}, 'idle');
export const BOY: Spec = withPose({outfit: 'vest', hair: 'level', build: 'child', expr: {...EXPR.neutral, gaze: [18, -10]},
  palette: {hair: '#1c1512', shirt: '#bcd3e0', vest: '#bcd3e0', shirtEdge: '#9fb9c9', shirtRim: '#d6e5ee', shorts: '#5b4a3a', shoe: '#3a2e26'}}, 'idle');

const StationStill: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill><Finish warm="#f0c48e" warmAmount={0.1}><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>
      <Station><Puppet3 height={1.7} pos={MASTER_MARK} spec={MASTER} /><Puppet3 height={1.15} pos={BOY_MARK} flip spec={BOY} /></Station>
    </ThreeCanvas></Finish></AbsoluteFill>
  );
};
// ---------------------------------------------------------------- nine seconds: the boy comes out, the master greets him and points to the train
// "Chiều hôm ấy, cậu bé ra ga một mình. | Bác trưởng ga nhìn cậu, rồi chỉ về phía đoàn tàu sắp chuyển bánh."
//  0-94 the boy walks in from the right edge to his mark      96-216 greeting, a few words, the point, the boy's reaction
// A Puppet3's pos is where the figure STARTS; perform() keys x from 0. So the walker is placed at the start of the walk,
// WALK units to the right of his mark (flip: +x in his own space is screen left).
const LEN = 216, BOY_U = 1.15 / (SOLE_Y - HAIR_TOP), WALK = 2590, BOY_START: V3 = [BOY_MARK[0] + WALK * BOY_U, 0, BOY_MARK[2]];
const M_BEATS: Beat[] = [
  {f: 0, look: [-4, 16]},                                   // waiting, eyes down the platform
  {f: 34, look: [24, 4]},                                   // hears / sees the boy come out (he enters the frame about f 24)
  {f: 66, face: 'smile', look: [22, 6], body: 'shift'},     // weight toward him as he comes near
  {f: 100, pose: 'greet', big: true, say: 14},              // greets him
  {f: 124, pose: 'explain', say: 20},                       // a few words
  {f: 140, body: 'shift', dir: -1},
  {f: 148, look: [-40, -6]},                                // eyes go to the train first...
  {f: 152, pose: 'point', big: true, body: 'leanIn', dir: -1, say: 16},   // ...then the arm (left arm: see swapArms below)
  {f: 174, look: [22, 6]},                                  // back to the boy, still pointing
  {f: 190, pose: 'idle', body: 'upright'},
];
const B_BEATS: Beat[] = [
  {f: 2, body: 'walk', dist: WALK, over: 90},               // in from the right edge, 2.5 m at the standard pace
  {f: 96, look: [18, -14]},                                 // arrived: looks up at the master
  {f: 104, face: 'smile'},                                  // answers the greeting, 4 frames after it
  {f: 132, body: 'shift'},
  {f: 156, look: [40, -6]},                                 // follows the pointing arm to the train (4 frames late, eyes first)
  {f: 164, face: 'happy', look: [40, -8], body: 'leanIn'},  // brightens, leans toward it
  {f: 192, face: 'smile', look: [18, -14], pose: 'idle'},   // back to the master, a nod
  {f: 206, body: 'upright'},
];
const M_BASE: Spec = {...MASTER, expr: {...MASTER.expr, gaze: [-4, 16]}}, B_BASE: Spec = {...BOY, expr: {...BOY.expr, gaze: [20, -4]}};
const KM = swapArms(perform(M_BEATS, {dirDefault: 1}), 152, 170), KB = perform(B_BEATS, {dirDefault: -1, mirror: true});
export const STATION_LINT = {master: lintBeats(M_BEATS, 120, 'speaker', 96), boy: lintBeats(B_BEATS, LEN, 'listener', 0)};
const StationSeq: React.FC = () => {
  const {width, height} = useVideoConfig(), f = useCurrentFrame(), t = f / (LEN - 1);
  return (
    <AbsoluteFill><Finish warm="#f0c48e" warmAmount={0.1}><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>
      <Station f={f} moving dx={0.15 - 0.27 * t} dz={-0.35 * t}>
        <Puppet3 height={1.7} pos={MASTER_MARK} spec={blink(act(M_BASE, KM, f, {seed: 1}), f, [22, 118, 198], 'half')} />
        <Puppet3 height={1.15} pos={BOY_START} flip spec={blink(act(B_BASE, KB, f, {seed: 2}), f, [58, 122, 200], 'half')} />
      </Station>
    </ThreeCanvas></Finish></AbsoluteFill>
  );
};
// ---------------------------------------------------------------- the same set, other shots (lib3/shot)
const StationClose: React.FC = () => <Shot grade="lateDay" eye={frameOn({pos: MASTER_MARK, height: 1.7, spec: MASTER}, 'close', -0.08)} soft={1.6} finish={{warm: '#f0c48e', warmAmount: 0.1}}
  set={(inside, cam) => <Station dx={cam.dx} dz={cam.dz}>{inside}</Station>} figures={<Puppet3 height={1.7} pos={MASTER_MARK} res={3} spec={{...MASTER, expr: {...EXPR.smile, gaze: [30, 6]}}} />} />;
const StationMedium: React.FC = () => <Shot grade="lateDay" eye={frameOn({pos: BOY_MARK, height: 1.15, spec: BOY}, 'medium', 0.1)} soft={1.0} finish={{warm: '#f0c48e', warmAmount: 0.1}}
  set={(inside, cam) => <Station dx={cam.dx} dz={cam.dz}>{inside}</Station>} figures={<Puppet3 height={1.15} pos={BOY_MARK} flip res={3} spec={{...BOY, expr: {...EXPR.smile, gaze: [34, -14]}}} />} />;
export const StationComps: React.FC = () => <><Composition id="station-still" component={StationStill} width={1280} height={720} fps={24} durationInFrames={1} /><Composition id="station-seq" component={StationSeq} width={1280} height={720} fps={24} durationInFrames={LEN} /><Composition id="station-close" component={StationClose} width={1280} height={720} fps={24} durationInFrames={1} /><Composition id="station-medium" component={StationMedium} width={1280} height={720} fps={24} durationInFrames={1} /></>;
