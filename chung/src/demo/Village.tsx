import React, {useMemo} from 'react';
import {AbsoluteFill, Composition, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Scene3, Finish, Ground, FacetLathe} from '../lib3/look';
import {Scatter} from '../lib3/detail';
import {Plate, Sprite, VIEW, rnd, P, Ctx, paintKarst, paintCloud, paintHouse, paintPagoda, paintBamboo, paintPalm, paintBanana, paintBanyan, paintBuffalo, paintEgret, paintChicken, paintHaystack, paintBush, paintTuft} from '../lib3/depth';
import {B, StageCam, Gate, BambooFence, ThatchHouse, Jar} from '../lib3/kit';

/** NO-REFERENCE TEST: a Vietnamese village at sunrise. The reference film has nothing like it and no frame of it was looked at
 *  while this was built; only the written rules were used:
 *    layers  nine depths from sky to foreground, haze by distance, nearer hides farther, no part of the frame left plain;
 *    pieces  each has three tones, a secondary structure (courses, thatch layers, slats), one small trace of life, and is
 *            never perfectly regular; big built things are boxes, small and living things are flat pictures. */
type V3 = [number, number, number];
const HAZE = '#dde1d4', EYE: V3 = [0, 3.4, 14];   // a raised, level camera: flat fields need height to be seen at all

// ---------------------------------------------------------------- painted layers, back to front (screen units 1600 x 900)
const sky = (c: Ctx) => {
  const g = c.createLinearGradient(0, -140, 0, 520); g.addColorStop(0, '#a3c6dc'); g.addColorStop(1, '#f2e4c6'); c.fillStyle = g; c.fillRect(-300, -200, 2200, 1300);
  ([[92, 'rgba(255,246,214,0.26)'], [62, 'rgba(255,246,214,0.5)'], [40, '#fff7de']] as [number, string][]).forEach(([r, f]) => { c.beginPath(); c.arc(1060, 104, r, 0, 7); c.fillStyle = f; c.fill(); });
  paintCloud(c, 640, 60, 0.9, {light: '#f8f2e6', dark: '#e7e0d3'}); paintCloud(c, 1290, 168, 0.7, {light: '#f8f2e6', dark: '#e7e0d3'}); paintCloud(c, 60, 150, 0.6, {light: '#f6efe2', dark: '#e4dccd'});
  [[820, 214], [854, 198], [884, 218], [916, 202], [846, 234]].forEach(([x, y]) => P(c, [[x - 13, y - 4], [x, y + 3], [x + 13, y - 5], [x, y - 1]], '#fbfaf5'));
};
const farKarst = (c: Ctx) => {
  const t = {light: '#a9c0cc', dark: '#94acbb'};
  ([[900, 120, 210], [360, 150, 190], [1420, 150, 200], [120, 200, 150], [640, 214, 150], [1180, 204, 160], [1690, 224, 170], [-130, 236, 150]] as number[][]).forEach(([x, y, w]) => paintKarst(c, x, y, w, 640, t));
  [[-200, 470, 900, 54], [560, 500, 1300, 50]].forEach(([x, y, w, h]) => { c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fillStyle = 'rgba(240,241,232,0.5)'; c.fill(); });
};
const midKarst = (c: Ctx) => {
  const t = {light: '#88a797', dark: '#759585', cap: '#6f987a'};
  ([[1010, 300, 190], [40, 312, 180], [1600, 300, 190], [300, 352, 140], [1300, 344, 150], [700, 372, 130]] as number[][]).forEach(([x, y, w]) => paintKarst(c, x, y, w, 660, t));
  [[100, 540, 1000, 40], [900, 556, 1000, 36]].forEach(([x, y, w, h]) => { c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fillStyle = 'rgba(236,238,226,0.42)'; c.fill(); });
};
const pagodaHill = (c: Ctx) => {
  P(c, [[330, 660], [440, 540], [540, 486], [640, 462], [730, 480], [830, 540], [930, 660]], '#6f9a78'); P(c, [[330, 660], [440, 540], [540, 486], [640, 462], [660, 560], [620, 660]], '#80ab86');
  const r = rnd(17); for (let i = 0; i < 30; i++) { const x = 380 + r() * 500, y = 520 + r() * 120 - Math.max(0, 60 - Math.abs(x - 640) * 0.3), q = 12 + r() * 14; if (Math.abs(x - 640) < 44 && y < 560) continue; c.beginPath(); c.arc(x, y, q, 0, 7); c.fillStyle = i % 2 ? '#578a62' : '#63966c'; c.fill(); }
  paintPagoda(c, 640, 470, 1.2, {wall: '#d2c2a4', shade: '#b8a98e', roof: '#8d5c4b'});
};
const farTrees = (c: Ctx) => {
  c.fillStyle = '#5e8d5b'; c.fillRect(-300, 536, 2200, 180);
  const r = rnd(23); for (let x = -260; x < 1860; x += 18 + r() * 16) { const q = 18 + r() * 20; c.beginPath(); c.arc(x, 536 - r() * 12, q, 0, 7); c.fillStyle = ['#5e8d5b', '#6c9b63', '#507f53'][Math.floor(r() * 3)]; c.fill(); }
  // areca palms above the tree line, and two thatched roofs among the trees with their cooking smoke
  [[300, 470], [338, 488], [1082, 474], [1122, 492], [1404, 480], [150, 484]].forEach(([x, y]) => { c.strokeStyle = '#8a846a'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, 540); c.lineTo(x + 3, y); c.stroke(); for (let k = 0; k < 7; k++) { const a = (-170 + k * 27) * (Math.PI / 180); c.strokeStyle = k % 2 ? '#4f8650' : '#5d9659'; c.lineWidth = 5; c.beginPath(); c.moveTo(x + 3, y); c.quadraticCurveTo(x + 3 + Math.cos(a) * 16, y + Math.sin(a) * 16 - 4, x + 3 + Math.cos(a) * 26, y + Math.sin(a) * 18 + 10); c.stroke(); } });
  ([[856, 540, 46, 22], [1226, 544, 40, 20]] as number[][]).forEach(([x, b, w, h]) => paintHouse(c, x, b, w, h, {light: '#e2d4b2', dark: '#c4b798'}, {light: '#cdb26c', dark: '#aa9054'}, '#6a5a44'));
  [[902, 494, 5], [908, 482, 7], [918, 468, 9]].forEach(([x, y, q]) => { c.beginPath(); c.arc(x, y, q, 0, 7); c.fillStyle = 'rgba(240,240,234,0.7)'; c.fill(); });
};
const hedge = (c: Ctx) => {
  c.fillStyle = '#5f8a52'; c.fillRect(-300, 566, 2200, 160);
  const r = rnd(29); for (let x = -260; x < 1860; x += 14 + r() * 12) { c.beginPath(); c.arc(x, 568 - r() * 6, 10 + r() * 9, 0, 7); c.fillStyle = r() < 0.5 ? '#5f8a52' : '#6d9a5a'; c.fill(); }
  ([[-190, 200, 230, 1], [20, 170, 190, 2], [230, 150, 160, 3], [1190, 160, 170, 4], [1390, 200, 230, 5], [1600, 170, 200, 6], [1790, 190, 210, 7]] as number[][]).forEach(([x, w, h, s]) => { c.save(); c.translate(x - w / 2, 578 - h); paintBamboo(c, w, h, s, {a: '#9db266', b: '#819751', leaf: '#5d9550', leafDark: '#4a7f45'}); c.restore(); });
};
const foreground = (c: Ctx) => {
  // nearest layer: bamboo leaves from the upper right corner, a corner of a lotus pond lower left, grass at the lower corners
  const leaf = (x: number, y: number, a: number, L: number, f: string) => { const tx = x + Math.cos(a) * L, ty = y + Math.sin(a) * L, nx = -Math.sin(a), ny = Math.cos(a); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + tx) / 2 + nx * L * 0.12, (y + ty) / 2 + ny * L * 0.12, tx, ty); c.quadraticCurveTo((x + tx) / 2 - nx * L * 0.12, (y + ty) / 2 - ny * L * 0.12, x, y); c.fillStyle = f; c.fill(); };
  const r = rnd(41);
  P(c, [[-260, 930], [-260, 792], [-40, 772], [190, 786], [372, 832], [440, 930]], '#b9a67e'); P(c, [[-260, 930], [-260, 806], [-40, 786], [180, 800], [352, 842], [416, 930]], '#86aaa4'); P(c, [[-260, 930], [-260, 850], [40, 836], [250, 868], [330, 930]], '#99b9b2');
  ([[40, 850, 58], [-130, 878, 50], [200, 888, 44], [-40, 900, 34]] as number[][]).forEach(([x, y, q], i) => { c.beginPath(); c.ellipse(x, y, q, q * 0.36, 0, 0, 7); c.fillStyle = i % 2 ? '#5b9a5e' : '#4c8a54'; c.fill(); P(c, [[x, y], [x + q * 0.9, y - q * 0.1], [x + q * 0.85, y + q * 0.12]], '#86aaa4'); });
  [[-150, 0.9], [-125, 1], [-100, 1.1], [-75, 1], [-50, 0.9]].forEach(([deg, k]) => leaf(120, 842, deg * (Math.PI / 180), 46 * k, '#f3a9c0')); [[-112, 0.8], [-90, 0.9], [-68, 0.8]].forEach(([deg, k]) => leaf(120, 842, deg * (Math.PI / 180), 40 * k, '#f8c6d6')); c.beginPath(); c.arc(120, 836, 6, 0, 7); c.fillStyle = '#e9c94a'; c.fill();
  const g = ['#3a6b3a', '#4a7d42'];
  for (let x = 380; x < 1860; x += 10 + r() * 12) { const edge = Math.min(1, Math.abs(x - 800) / 800), h = 12 + r() * 20 + edge * edge * 56, w = 6 + r() * 5, lean = (r() - 0.5) * 22; if (edge < 0.3 && r() < 0.6) continue; P(c, [[x - w, 912], [x + lean, 900 - h], [x + w, 912]], g[r() < 0.5 ? 0 : 1]); }
};

// ---------------------------------------------------------------- the rice fields: one painted ground sheet, 68 m x 32 m
const paddyTex = (() => { let t: THREE.CanvasTexture | null = null; return () => {
  if (t) return t;
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 964; const c = cv.getContext('2d')!, k = 2048 / 68, X = (x: number) => (x + 34) * k, Y = (z: number) => (z + 44) * k, r = rnd(51);
  c.fillStyle = '#8db45a'; c.fillRect(0, 0, 2048, 964);
  const cols = [-34, -23, -12.5, -1.3, 0.2, 1.8, 12, 22.5, 34], rows = [-44, -32, -21.5, -12], pal = ['#8db45a', '#9fbe60', '#b9c56e', '#80a956', '#a6c365', '#93b85c'];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 8; i++) {
    if (i === 4) continue;
    const x0 = X(cols[i]) + (j - 1) * 6, x1 = X(cols[i + 1]) + (j - 1) * 6, y0 = Y(rows[j]), y1 = Y(rows[j + 1]), wet = (i === 2 && j === 2) || (i === 6 && j === 1);
    c.fillStyle = wet ? '#a9cbd0' : pal[(i * 2 + j * 3) % 6]; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    // rows of rice: lines that run away from us in some plots, across in others
    c.strokeStyle = wet ? 'rgba(92,150,86,0.75)' : 'rgba(60,110,50,0.3)'; c.lineWidth = wet ? 2.5 : 2;
    if ((i + j) % 2) for (let x = x0 + 8; x < x1 - 4; x += wet ? 22 : 15) { c.beginPath(); c.moveTo(x, y0 + 4); c.lineTo(x, y1 - 4); c.stroke(); }
    else for (let y = y0 + 8; y < y1 - 4; y += wet ? 22 : 15) { c.beginPath(); c.moveTo(x0 + 4, y); c.lineTo(x1 - 4, y); c.stroke(); }
    if (wet) for (let n = 0; n < 5; n++) { c.fillStyle = 'rgba(232,242,240,0.6)'; c.fillRect(x0 + 20 + r() * (x1 - x0 - 120), y0 + 14 + r() * (y1 - y0 - 30), 60 + r() * 60, 5); }
  }
  // the dikes: earth banks with a grass edge, never ruler-straight
  const bank = (a: number[], b: number[], w: number) => { c.strokeStyle = '#7d9c52'; c.lineWidth = w + 8; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = '#b89f72'; c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
  for (let j = 0; j < 3; j++) cols.forEach((x, i) => { if (i === 4 || i === 5) return; bank([X(x) + (j - 1) * 6, Y(rows[j])], [X(x) + (j - 1) * 6 + (r() - 0.5) * 6, Y(rows[j + 1])], 12); });
  rows.forEach((z) => bank([0, Y(z) + (r() - 0.5) * 4], [2048, Y(z) + (r() - 0.5) * 4], 13));
  // the village road on its bank, straight out to the far trees
  c.fillStyle = '#7d9c52'; c.fillRect(X(0.2) - 8, 0, X(1.8) - X(0.2) + 16, 964); c.fillStyle = '#c4a97f'; c.fillRect(X(0.2), 0, X(1.8) - X(0.2), 964); c.fillStyle = '#ae956c'; [0.62, 1.38].forEach((x) => c.fillRect(X(x) - 3, 0, 6, 964));
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t; }; })();

// ---------------------------------------------------------------- built pieces (boxes)

const Village: React.FC = () => (
  <Scene3 grade="dayExterior" reach={26}>
    <StageCam eye={EYE} haze={HAZE} fog={[20, 430]} />
    <Plate from={EYE} id="v-sky" d={520} paint={sky} fog={false} /><Plate from={EYE} id="v-far" d={220} paint={farKarst} /><Plate from={EYE} id="v-mid" d={140} paint={midKarst} /><Plate from={EYE} id="v-pag" d={95} paint={pagodaHill} /><Plate from={EYE} id="v-trees" d={70} paint={farTrees} /><Plate from={EYE} id="v-hedge" d={58} paint={hedge} />
    <Ground near="#c4a97f" far="#b59e78" size={[110, 70]} pos={[0, 0, -18]} swell={0.02} patch={0.05} farAt={0.6} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -28]} receiveShadow><planeGeometry args={[68, 32]} /><meshLambertMaterial map={paddyTex()} /></mesh>
    {/* the yard: worn earth with grass creeping in from the sides and darker damp patches */}
    {([[-9, -8, 4.5, '#8fa862'], [-12, -5, 3.5, '#7f9a58'], [10, -5.5, 4, '#8fa862'], [11.5, -10.5, 3, '#7f9a58'], [-3, -10.5, 2.4, '#a89068'], [3, -5, 2.8, '#b0986e'], [-1, -4, 2, '#ceb48a'], [0.9, -9, 1.8, '#d0b68c'], [-6, -11.5, 2.6, '#8fa862']] as [number, number, number, string][]).map(([x, z, q, col], i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006 + i * 0.0003, z]} scale={[1, 0.4, 1]} receiveShadow><circleGeometry args={[q, 30]} /><meshLambertMaterial color={col} /></mesh>)}
    <Gate pos={[1.0, 0, -11.2]} /><BambooFence from={-16} to={-3.9} z={-11.3} /><BambooFence from={5.9} to={17} z={-11.3} seed={3} />
    <ThatchHouse pos={[7.6, 0, -6.6]} rotY={1.25} />
    <Jar pos={[4.5, 0, -3.3]} lid /><Jar pos={[5.2, 0, -2.9]} s={0.8} /><B p={[9.6, 0.75, -2.6]} s={[0.05, 1.6, 0.05]} c="#bfae6a" r={[0, 0, 0.2]} /><B p={[9.46, 0.06, -2.6]} s={[0.4, 0.1, 0.06]} c="#8a7440" />
    {/* washing on a line between two bamboo poles */}
    <B p={[0.9, 0.95, -7.6]} s={[0.07, 1.9, 0.07]} c="#bfae6a" /><B p={[3.5, 0.95, -7.2]} s={[0.07, 1.9, 0.07]} c="#bfae6a" /><B p={[2.2, 1.82, -7.4]} s={[2.64, 0.02, 0.02]} c="#6a5a44" r={[0, 0.153, 0]} cast={false} />
    {([[1.5, '#f1ede2', 0.5, 0.7], [2.15, '#3f4f7a', 0.56, 0.8], [2.85, '#8a5a3a', 0.46, 0.62]] as [number, string, number, number][]).map(([x, col, ww, hh], i) => <mesh key={i} position={[x, 1.8 - hh / 2, -7.5 + (x - 0.9) * 0.154]} castShadow><planeGeometry args={[ww, hh]} /><meshLambertMaterial color={col} side={THREE.DoubleSide} /></mesh>)}
    {/* the well with its bucket, the shrine at the foot of the banyan */}
    <FacetLathe profile={[[0.78, 0], [0.8, 0.1], [0.8, 0.7], [0.72, 0.78], [0.58, 0.78], [0.58, 0.4]]} sides={12} color="#a86a54" pos={[-2.6, 0, -6.4]} tones={[0.82, 1, 1.12, 1.16, 0.7]} />{[0.16, 0.34, 0.52].map((y) => <FacetLathe key={y} profile={[[0.805, y], [0.815, y], [0.815, y + 0.045], [0.805, y + 0.045]]} sides={12} color="#cb9078" pos={[-2.6, 0, -6.4]} contact={false} cast={false} />)}<mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.6, 0.5, -6.4]}><circleGeometry args={[0.57, 12]} /><meshBasicMaterial color="#3f5a5c" /></mesh>
    <FacetLathe profile={[[0.14, 0], [0.19, 0.3], [0.175, 0.3]]} sides={9} color="#8a6a4a" pos={[-1.5, 0, -5.8]} /><B p={[-2.6, 0.8, -5.7]} s={[0.5, 0.05, 0.16]} c="#8a6a4a" />
    <group position={[-5.9, 0, -4.2]}><B p={[0, 0.28, 0]} s={[0.76, 0.56, 0.64]} c="#a39f96" /><B p={[0, 0.8, -0.04]} s={[0.52, 0.46, 0.44]} c="#a8483a" /><B p={[0, 0.76, 0.19]} s={[0.26, 0.3, 0.02]} c="#3a2620" cast={false} /><B p={[0, 1.1, 0.14]} s={[0.7, 0.06, 0.4]} c="#7d4638" r={[0.45, 0, 0]} /><B p={[0, 1.1, -0.2]} s={[0.7, 0.06, 0.4]} c="#7d4638" r={[-0.45, 0, 0]} />
      <FacetLathe profile={[[0.06, 0], [0.1, 0.05], [0.09, 0.1]]} sides={8} color="#c9b48c" pos={[0, 0.56, 0.24]} contact={false} />{[-0.02, 0.02, 0].map((x, i) => <B key={i} p={[x, 0.78, 0.24 + i * 0.01]} s={[0.012, 0.3, 0.012]} c="#c8443a" cast={false} />)}</group>
    {/* living things as flat pictures: the banyan, bamboo, areca palms, bananas, hay, animals */}
    <Sprite name="banyan2" art={paintBanyan} px={[1120, 920]} w={9.6} pos={[-8.6, 0, -5.6]} />
    {([[-13.5, -9.6, 5.2, 1], [-15.6, -7, 4.6, 2], [13.2, -10.4, 5, 3], [15.6, -8, 4.4, 4], [-11, -10.6, 3.8, 5]] as number[][]).map(([x, z, w, s], i) => <Sprite key={i} name={`bamboo${s}`} art={(c, W, H) => paintBamboo(c, W, H, s)} px={[420, 640]} w={w} pos={[x, 0, z]} flip={i % 2 === 1} />)}
    {([[8.4, -10.4, 3.9], [10.8, -9.6, 3.4], [5.6, -10.8, 3.2], [-7.4, -10.4, 3.3]] as number[][]).map(([x, z, w], i) => <Sprite key={i} name="palm" art={paintPalm} px={[300, 620]} w={w} pos={[x, 0, z]} flip={i % 2 === 1} />)}
    <Sprite name="banana" art={paintBanana} px={[400, 420]} w={2.5} pos={[4.2, 0, -9.4]} /><Sprite name="banana" art={paintBanana} px={[400, 420]} w={2.2} pos={[11.4, 0, -4.2]} flip />
    <Sprite name="hay" art={paintHaystack} px={[300, 300]} w={2.3} pos={[-5.6, 0, -8.4]} />
    <Sprite name="buffalo" art={paintBuffalo} px={[400, 260]} w={3.3} pos={[-4.8, 0, -33]} shade={0.3} />
    {([[4.6, -21, 0.5], [-10.5, -25, 0.5], [6.2, -22.4, 0.46], [-2.2, -30, 0.5], [9.5, -33, 0.5]] as number[][]).map(([x, z, w], i) => <Sprite key={i} name="egret" art={paintEgret} px={[120, 200]} w={w} pos={[x, 0, z]} flip={i % 2 === 0} shade={0} />)}
    <Sprite name="hen" art={(c, W, H) => paintChicken(c, W, H)} px={[140, 120]} w={0.5} pos={[1.9, 0, -4.6]} shade={0.3} /><Sprite name="hen2" art={(c, W, H) => paintChicken(c, W, H, '#f1ead8', '#d8ccb0')} px={[140, 120]} w={0.46} pos={[2.8, 0, -4.0]} flip shade={0.3} /><Sprite name="hen" art={(c, W, H) => paintChicken(c, W, H)} px={[140, 120]} w={0.42} pos={[-0.2, 0, -3.2]} flip shade={0.3} />
    {([[-4.4, -8.8, 1.5, '#f2f2f2'], [3.4, -2.2, 1.5, '#e88aa0'], [-10.6, -2.6, 1.6, ''], [5.4, -10.6, 1.4, '#f4e27a'], [-12.5, -5.6, 1.8, '']] as [number, number, number, string][]).map(([x, z, w, f], i) => <Sprite key={i} name={`vbush${f}`} art={(c, W, H) => paintBush(c, W, H, undefined, f || undefined)} px={[400, 240]} w={w} pos={[x, 0, z]} flip={i % 2 === 0} />)}
    {([[-1.2, -3.6, 0.5], [3.6, -5.6, 0.46], [-4.6, -2.0, 0.5], [6.4, -1.4, 0.5], [0.2, -9.4, 0.42], [-6.5, -8.4, 0.5], [9.8, -1.8, 0.46], [-8.5, -1.2, 0.5], [1.4, -1.0, 0.44]] as number[][]).map(([x, z, w], i) => <Sprite key={`t${i}`} name="vtuft" art={paintTuft} px={[160, 110]} w={w} pos={[x, 0, z]} flip={i % 2 === 0} cast={false} shade={0} />)}
    <Scatter kind="meadow" area={[26, 9]} pos={[0, 0, -5.5]} seed={6} density={1.4} keep={[[1, -8, 1.8]]} />
    {/* the trodden way from the gate into the yard */}
    <mesh rotation={[-Math.PI / 2, 0, 0.05]} position={[0.75, 0.009, -5.2]} receiveShadow><planeGeometry args={[2.3, 12.4]} /><meshLambertMaterial color="#d3ba90" /></mesh>{[-0.42, 0.42].map((o) => <mesh key={o} rotation={[-Math.PI / 2, 0, 0.05]} position={[0.75 + o, 0.011, -5.2]} receiveShadow><planeGeometry args={[0.12, 12.4]} /><meshLambertMaterial color="#bfa57c" /></mesh>)}
    <Plate from={EYE} id="v-fg" d={3.4} paint={foreground} fog={false} order={900} />
  </Scene3>
);
const VillageStill: React.FC = () => { const {width, height} = useVideoConfig(); return <AbsoluteFill><Finish><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><Village /></ThreeCanvas></Finish></AbsoluteFill>; };
export const VillageComps: React.FC = () => <Composition id="village-still" component={VillageStill} width={1280} height={720} fps={24} durationInFrames={1} />;
