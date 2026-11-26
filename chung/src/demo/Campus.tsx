import React from 'react';
import {datNoiBui} from '../lib3/mauBui';
import {AbsoluteFill, Composition, useVideoConfig, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Scene3, Finish, Ground, Grade} from '../lib3/look';
import {Plate, Sprite, rnd, P, Ctx, paintCloud, paintTree, paintBush, paintTuft} from '../lib3/depth';
import {StageCam, AutoRecv} from '../lib3/kit';
import {LectureHall, Dormitory, IronGate, CampusLamp, StoneBench, FounderStatue, BikeRack, PavedPath, FallenLeaves, paintMaple, HALL, DORM, Pal3, NoticeBoard, GroundShade} from '../lib3/kitCampus';
import {Puppet3} from '../mould/Puppet3';
import {Shot} from '../lib3/shot';
import {FlyingLeaves, Motes} from '../lib3/kit';
import {Halo} from '../lib3/look';
import {act, blink, Key} from '../mould/act';
import {Flash, Shake, Explosion, Embers} from '../lib3/fx';
import {EXPR} from '../mould/expr';
import {withPose, POSES} from '../mould/gestures';
import type {Spec} from '../mould/draw';

/** Set G: the grounds of a university ("Victor at university", episodes/doom-dai-hoc-danh-sach-canh.md).
 *  One world, three times of day, three camera positions:
 *    view 'a' (shot 1)   straight at the lecture hall from the middle of the yard; the tower right of centre, the left
 *                        diagonal path leading the eye from the lower left to the door.
 *    view 'b' (shot 12)  the dormitory filling the right half, Victor's window (first floor up) at the upper third point,
 *                        the hall and its clock tower further off at the left.
 *    view 'c' (shot 15)  close to the steps: the door at the left, the right diagonal path running through the iron gate
 *                        in the right foreground.
 *  Plan (metres, x right, z toward camera a): hall front z = -56 (x -16..16, tower and door at x = 0, steps out to z = -51.4,
 *  landing y = 1.0); dormitory front z = -36 from x = 15 to 43; the gate's centre (10, -36), turned to face along the path.
 *  The camera never turns (fixed 28-degree lens looking along -z); each view only moves the eye. */
export type V3 = [number, number, number];
/** 'chang-vang' (d1c6, 23/11/2026): dusk, the sky orange over violet, the lamps just lit, fireflies and dust; the other three are untouched */
export type CampusTime = 'chieu' | 'dem' | 'sang' | 'chang-vang';
export type CampusView = 'a' | 'b' | 'c';

export const HALL_Z = -56, DORM_POS: V3 = [15, 0, -36], GATE = {x: 10, z: -36, rotY: 0.335};
/** Victor's window: dormitory bay 1 on the first floor up (index 11), world position of the centre of its glass. */
export const VICTOR_WINDOW: V3 = [DORM_POS[0] + DORM.bays[1], DORM.floorY[1], DORM_POS[2] + 0.06];
export const LANDING_Y = HALL.landing;
/** the notice board on the forecourt (d1c5 shots 19, 20; d1c6 shot 1): its foot, facing the camera of view a. Free ground
 *  in front of it from z -46.9 to -43 and x -5 to 0 (the bench at (3, -48.6) and the lamp at (5.8, -44.5) are well clear). */
export const BOARD_POS: V3 = [-3.4, 0, -47];
export const VIEWS: Record<CampusView, {eye: V3}> = {
  a: {eye: [-4, 1.8, 14]},
  b: {eye: [14, 1.6, 0]},
  c: {eye: [6.3, 1.7, -26.3]},
};
export const TIMES: Record<CampusTime, {grade: Grade; dir: V3; gain?: number; haze: string; fog: [number, number]; grass: [string, string]; path: string; maple: Pal3; trees: Pal3; bush: Pal3; warm: string; warmAmount: number}> = {
  chieu: {grade: 'lateDay', dir: [-8, 4.5, 3.5], haze: '#ecd2ac', fog: [30, 480], grass: ['#8f9658', '#a7a46c'], path: '#dcc8a6', maple: ['#a4302a', '#cc4a2c', '#ec8f3e'], trees: ['#6f7a4c', '#7f8a56', '#97985f'], bush: ['#4f6a3c', '#5f7a44', '#7a8f52'], warm: '#f0c48e', warmAmount: 0.1},
  dem: {grade: 'nightExterior', dir: [-5, 7, 4], gain: 1.5, haze: '#5a6180', fog: [26, 420], grass: ['#3e4a48', '#4a5258'], path: '#767a8c', maple: ['#3c2c3a', '#4a3442', '#5e4250'], trees: ['#2f3a44', '#35414b', '#3e4a52'], bush: ['#26323a', '#2e3a42', '#36444a'], warm: '', warmAmount: 0},
  sang: {grade: 'dayExterior', dir: [5, 9, 6], gain: 0.9, haze: '#c6ced8', fog: [26, 460], grass: ['#7d8f6c', '#8f9a84'], path: '#c4c0b6', maple: ['#963a32', '#b44c36', '#d48a4c'], trees: ['#62705e', '#6f7c68', '#848f78'], bush: ['#4a5e48', '#566a50', '#6a7c5e'], warm: '#bccbe0', warmAmount: 0.2},
  'chang-vang': {grade: 'lateDay', dir: [-9, 3.2, 3.5], gain: 0.8, haze: '#d6a0b0', fog: [30, 460], grass: ['#7a8058', '#8a8a66'], path: '#cdb4a4', maple: ['#8c2e2c', '#b8483a', '#e08a4a'], trees: ['#5c6048', '#6c6c50', '#82805c'], bush: ['#46603c', '#566e44', '#6e8450'], warm: '#f2a878', warmAmount: 0.12},
};

// ---------------------------------------------------------------- painted layers, back to front (screen units 1600 x 900)
export const sky = (time: CampusTime) => (c: Ctx) => {
  const g = c.createLinearGradient(0, -200, 0, 520), r = rnd(21);
  if (time === 'chieu') { g.addColorStop(0, '#86a2c6'); g.addColorStop(0.5, '#e2c6ae'); g.addColorStop(1, '#f6d8a0'); }
  else if (time === 'dem') { g.addColorStop(0, '#262d4c'); g.addColorStop(1, '#5a6384'); }
  else if (time === 'chang-vang') { g.addColorStop(0, '#5a4a86'); g.addColorStop(0.35, '#a3689a'); g.addColorStop(0.7, '#ee9a78'); g.addColorStop(1, '#fbc27c'); }
  else { g.addColorStop(0, '#93a6bd'); g.addColorStop(1, '#d6dce3'); }
  c.fillStyle = g; c.fillRect(-300, -200, 2200, 1300);
  if (time === 'chieu') {
    // the low sun's glow at the left, flat clouds lit pink from below, a skein of birds going home
    ([[170, 'rgba(255,232,186,0.16)'], [100, 'rgba(255,236,196,0.3)'], [56, 'rgba(255,242,210,0.6)']] as [number, string][]).forEach(([q, f]) => { c.beginPath(); c.arc(60, 400, q, 0, 7); c.fillStyle = f; c.fill(); });
    paintCloud(c, 120, 120, 1.0, {light: '#f3cdb8', dark: '#d8a59c'}); paintCloud(c, 1240, 40, 0.9, {light: '#efc9b8', dark: '#d2a29e'}); paintCloud(c, 560, 30, 0.7, {light: '#efcbbb', dark: '#d4a6a0'}); paintCloud(c, 1380, 230, 0.55, {light: '#f4d3b8', dark: '#dcae9c'}); paintCloud(c, -120, 300, 0.6, {light: '#f6d6b6', dark: '#ddb09a'});
    [[1180, 140], [1206, 128], [1230, 146], [1256, 134], [1194, 162], [1282, 150], [1150, 156], [1310, 138], [1220, 172]].forEach(([x, y]) => { c.strokeStyle = '#6a5a60'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x - 10, y - 4); c.quadraticCurveTo(x - 4, y - 8, x, y); c.quadraticCurveTo(x + 4, y - 8, x + 10, y - 4); c.stroke(); });
  } else if (time === 'dem') {
    for (let i = 0; i < 70; i++) { c.beginPath(); c.arc(-240 + r() * 2080, -150 + r() * 520, 1.3 + r() * 1.9, 0, 7); c.fillStyle = `rgba(232,236,250,${0.45 + r() * 0.5})`; c.fill(); }
    // a waning crescent, high in the gap between the tower and the dormitory roof
    c.beginPath(); c.arc(640, 70, 40, 0, 7); c.fillStyle = 'rgba(240,232,200,0.16)'; c.fill();
    c.save(); c.beginPath(); c.arc(640, 70, 26, 0, 7); c.clip(); c.fillStyle = '#efe6c4'; c.fillRect(600, 30, 80, 80); c.beginPath(); c.arc(652, 62, 24, 0, 7); c.fillStyle = '#2f3756'; c.fill(); c.restore();
    paintCloud(c, 820, 150, 0.7, {light: '#4e5677', dark: '#434b6b'}); paintCloud(c, -60, 60, 0.8, {light: '#4a5272', dark: '#3f4767'});
  } else if (time === 'chang-vang') {
    // the sun just under the roofs at the left: a flat glow, long clouds lit orange below and violet above, a few first stars, birds going home
    ([[220, 'rgba(255,196,130,0.16)'], [130, 'rgba(255,208,140,0.3)'], [64, 'rgba(255,228,170,0.55)']] as [number, string][]).forEach(([q, f]) => { c.beginPath(); c.arc(40, 470, q, 0, 7); c.fillStyle = f; c.fill(); });
    paintCloud(c, 100, 90, 1.1, {light: '#f4a888', dark: '#b46c92'}); paintCloud(c, 1180, 20, 1.0, {light: '#f09a84', dark: '#a8648e'}); paintCloud(c, 560, 150, 0.8, {light: '#f6b090', dark: '#bc7496'}); paintCloud(c, 1400, 220, 0.6, {light: '#f8bc92', dark: '#c47c98'}); paintCloud(c, -140, 260, 0.7, {light: '#f8b88e', dark: '#c47a96'});
    for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(-200 + r() * 2000, -150 + r() * 200, 1.2 + r() * 1.3, 0, 7); c.fillStyle = `rgba(250,240,255,${0.4 + r() * 0.4})`; c.fill(); }
    [[1180, 150], [1206, 138], [1230, 156], [1256, 144], [1194, 172], [1282, 160]].forEach(([x, y]) => { c.strokeStyle = '#4a3c5a'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x - 10, y - 4); c.quadraticCurveTo(x - 4, y - 8, x, y); c.quadraticCurveTo(x + 4, y - 8, x + 10, y - 4); c.stroke(); });
  } else {
    // thin cold cloud in long bands
    [[100, 60, 1.3], [700, 10, 1.6], [1180, 110, 1.2], [-200, 230, 1.0], [880, 240, 0.9]].forEach(([x, y, s]) => paintCloud(c, x, y, s, {light: '#e4e8ec', dark: '#c6cdd6'}));
  }
};
/** very far: the city skyline in the haze: roofs, chimneys with a thread of smoke, a church bell tower */
const city = (time: CampusTime) => (c: Ctx) => {
  const r = rnd(8), dusk = time === 'chang-vang', t = time === 'dem' ? ['#4e5674', '#475070', '#c8b37a'] : dusk ? ['#a2688e', '#965c86', '#f2c070'] : time === 'sang' ? ['#b4bcc8', '#a8b1be', '#9aa4b2'] : ['#d7b9a2', '#cdae9a', '#c2a392'];
  for (let x = -260; x < 1860; x += 40 + r() * 70) { const w = 40 + r() * 80, h = 18 + r() * 50, b = 476; P(c, [[x, b], [x, b - h], [x + w / 2, b - h - 10 - r() * 14], [x + w, b - h], [x + w, b]], r() < 0.5 ? t[0] : t[1]); if (r() < 0.4) c.fillRect(x + w * 0.7, b - h - 26, 7, 20); if ((time === 'dem' || dusk) && r() < (dusk ? 0.3 : 0.5)) { c.fillStyle = t[2]; c.fillRect(x + w * 0.3, b - h * 0.5, 5, 5); } c.fillStyle = t[1]; }
  // the church tower and spire, left of centre
  P(c, [[300, 476], [300, 360], [336, 360], [336, 476]], t[1]); P(c, [[294, 362], [318, 290], [342, 362]], t[0]);
  [[1470, 410], [1560, 430]].forEach(([x, y]) => { c.fillStyle = t[0]; c.fillRect(x, y, 10, 476 - y); if (time !== 'dem') { c.fillStyle = 'rgba(240,236,230,0.45)'; [0, 1, 2].forEach((k) => { c.beginPath(); c.arc(x + 6 + k * 9, y - 12 - k * 14, 8 + k * 3, 0, 7); c.fill(); }); } });
};
/** far: big old trees behind the school, with the slate roofs of other buildings among them */
const farTrees = (time: CampusTime, g: Pal3) => (c: Ctx) => {
  const r = rnd(33), base = 488, dusk = time === 'chang-vang', roof = time === 'dem' ? '#3a4058' : dusk ? '#6a5272' : time === 'sang' ? '#8d95a2' : '#9a8f94', wall = time === 'dem' ? '#4a4652' : dusk ? '#9a6478' : time === 'sang' ? '#a89a92' : '#b58a76';
  [[-120, 150, 60], [560, 200, 70], [1240, 180, 64], [1600, 160, 56]].forEach(([x, w, h]) => { P(c, [[x, base], [x, base - h], [x + w, base - h], [x + w, base]], wall); P(c, [[x - 10, base - h], [x + w * 0.2, base - h - 34], [x + w * 0.8, base - h - 34], [x + w + 10, base - h]], roof); });
  for (let x = -260; x < 1860; x += 26 + r() * 30) { const h = 70 + r() * 110, w = 70 + r() * 70; c.save(); c.translate(x - w / 2, base - h); paintTree(c, w, h, g); c.restore(); }
  c.fillStyle = g[0]; c.fillRect(-300, base - 8, 2200, 30);
};
const fgA = (time: CampusTime, m: Pal3) => (c: Ctx) => {
  // a maple bough reaching in from the top left, its leaves catching the low sun; fallen leaves along the lower edge
  const r = rnd(4);
  c.strokeStyle = '#4a3426'; c.lineWidth = 26; c.lineCap = 'round'; c.beginPath(); c.moveTo(-200, -40); c.quadraticCurveTo(120, 30, 420, 40); c.stroke();
  c.lineWidth = 12; c.beginPath(); c.moveTo(150, 30); c.quadraticCurveTo(250, 100, 300, 150); c.moveTo(300, 40); c.lineTo(360, -20); c.stroke();
  // leaves in small clusters along the twigs (three tones, the light ones on top), never one big blob
  for (let i = 0; i < 260; i++) { const t = r(), x = -180 + t * 600 + (r() - 0.5) * 90, y = -30 + t * 60 + (r() - 0.35) * 110 + (x > 150 && x < 330 ? (x - 150) * 0.5 : 0); const q = 7 + r() * 11; c.beginPath(); c.arc(x, y, q, 0, 7); c.fillStyle = m[i % 7 === 0 ? 2 : r() < 0.5 ? 0 : 1]; c.fill(); }
  for (let i = 0; i < 26; i++) { const x = r() * 1600, edge = Math.abs(x - 800) / 800; if (edge < 0.4) continue; c.beginPath(); c.ellipse(x, 880 + r() * 30, 9, 5, r() * 3, 0, 7); c.fillStyle = m[Math.floor(r() * 3)]; c.fill(); }
  const g = time === 'dem' ? ['#232b2c', '#2c3532'] : ['#5f6e3c', '#6f7c46'];
  for (let x = -260; x < 1860; x += 12 + r() * 16) { const edge = Math.min(1, Math.abs(x - 800) / 800); if (edge < 0.55) continue; const h = 8 + r() * 14 + edge * edge * 34, w = 5 + r() * 4, lean = (r() - 0.5) * 18; P(c, [[x - w, 912], [x + lean, 902 - h], [x + w, 912]], g[r() < 0.5 ? 0 : 1]); }
};
const fgB = (c: Ctx) => paintFgB(c, false);
const fgBDusk = (c: Ctx) => paintFgB(c, true);
const paintFgB = (c: Ctx, dusk: boolean) => {
  // night: dark grass along the lower corners, a bare-ish bough in the top-left corner (keeps clear of the tower); dusk: the same shapes in violet-green
  const r = rnd(6);
  c.strokeStyle = dusk ? '#3a2e48' : '#1e2230'; c.lineWidth = 18; c.lineCap = 'round'; c.beginPath(); c.moveTo(-220, -30); c.quadraticCurveTo(-40, 10, 150, 0); c.stroke();
  for (let i = 0; i < 30; i++) { const x = -200 + r() * 360, y = -40 + r() * 80; c.beginPath(); c.arc(x, y, 12 + r() * 16, 0, 7); c.fillStyle = (dusk ? ['#5a3a5a', '#6a4262', '#7a4c66'] : ['#2a2230', '#33283a', '#3a2c3e'])[Math.floor(r() * 3)]; c.fill(); }
  for (let x = -260; x < 1860; x += 12 + r() * 16) { const edge = Math.min(1, Math.abs(x - 800) / 800); if (edge < 0.5) continue; const h = 10 + r() * 16 + edge * edge * 40, w = 6 + r() * 4, lean = (r() - 0.5) * 18; P(c, [[x - w, 912], [x + lean, 900 - h], [x + w, 912]], r() < 0.5 ? (dusk ? '#3e4a3a' : '#1f2628') : (dusk ? '#4a5842' : '#28302e')); }
};
const fgC = (m: Pal3) => (c: Ctx) => {
  const r = rnd(9);
  for (let i = 0; i < 40; i++) { const x = r() * 1600; c.beginPath(); c.ellipse(x, 860 + r() * 50, 10, 6, r() * 3, 0, 7); c.fillStyle = m[Math.floor(r() * 3)]; c.fill(); }
  for (let x = -260; x < 1860; x += 12 + r() * 16) { const edge = Math.min(1, Math.abs(x - 800) / 800); if (edge < 0.6) continue; const h = 8 + r() * 14 + edge * edge * 30, w = 5 + r() * 4, lean = (r() - 0.5) * 18; P(c, [[x - w, 912], [x + lean, 902 - h], [x + w, 912]], r() < 0.5 ? '#56664a' : '#62714f'); }
};

// ---------------------------------------------------------------- the set
export const maple = (name: string, m: Pal3, seed: number) => ({name, art: (c: Ctx, W: number, H: number) => paintMaple(c, W, H, m, undefined, seed), px: [600, 720] as [number, number]});
export const Campus: React.FC<{/** chạng vạng: độ lớn của đom đóm 0..1 (cho máy bay sát vào mà đom đóm không thành đốm to) */ domDom?: number; children?: React.ReactNode; f?: number; dx?: number; dz?: number; time?: CampusTime; view?: CampusView;
  /** which dormitory windows are lit (floor * 10 + bay) and which one glows with the machine (null = none) */
  dormLit?: number[]; dormMachine?: number | null;
  /** the notice board on the forecourt (off by default so the older stills stay as they were); stars = frames at which the
   *  gold stars pop on its three sheets (see NoticeBoard) */
  board?: boolean | {stars?: number[]};
  /** (d1c6) a multiplier over the light of the time of day, for a shot that measures too dark; undefined = as before */
  gain?: number}> = ({domDom = 1, children, f = 0, dx, dz, dormLit, dormMachine, time = 'chieu', view = 'a', board, gain}) => { datNoiBui('ngoai-troi');
  const T = TIMES[time], EYE = VIEWS[view].eye, night = time === 'dem', sun = time === 'chieu', dusk = time === 'chang-vang', lamps = night || dusk, k = `${time}-${view}`;
  const hour = time === 'chieu' ? 17.2 : time === 'dem' ? 23.85 : dusk ? 18.7 : 8.1;
  return (
    <Scene3 grade={T.grade} dir={T.dir} gain={gain ?? T.gain} reach={62}>
      <StageCam eye={EYE} haze={T.haze} fog={T.fog} dx={dx} dz={dz} />
      <Plate from={EYE} id={`cg-sky-${k}`} d={520} paint={sky(time)} fog={false} />
      <Plate from={EYE} id={`cg-city-${k}`} d={215} paint={city(time)} />
      <Plate from={EYE} id={`cg-trees-${k}`} d={95} paint={farTrees(time, T.trees)} />
      <Ground near={T.grass[0]} far={T.grass[1]} size={[220, 150]} pos={[0, 0, -45]} swell={0.02} patch={0.07} farAt={0.6} />
      {/* paving: the forecourt before the steps, the left path out to the lower left of view a, the right path through the gate */}
      <PavedPath a={[0, -56]} b={[0, -46.5]} w={22} color={T.path} seed={2} y={0.01} />
      <PavedPath a={[-0.5, -47]} b={[-8.5, 12]} w={2.6} color={T.path} seed={3} />
      <PavedPath a={[6, -47]} b={[GATE.x, GATE.z]} w={3.0} color={T.path} seed={4} />
      <PavedPath a={[GATE.x, GATE.z]} b={[22, -1.5]} w={3.0} color={T.path} seed={5} />
      {/* the buildings */}
      <LectureHall pos={[0, 0, HALL_Z]} night={lamps} sun={sun} hour={hour} ivy={night ? ['#1e2a26', '#26332c', '#2c3a30'] : ['#4a3a2a', '#5a7a3a', '#7a8a3a', '#b0502e', '#4f6a34']} />
      {([-13, -10.4, -7.6, 7.6, 10.4, 13] as number[]).map((x, i) => <Sprite key={i} name={`cg-hedge-${time}`} art={(c, W, H) => paintBush(c, W, H, T.bush)} px={[400, 240]} w={2.2} pos={[x - 0.6, 0, HALL_Z + 0.75]} flip={i % 2 === 1} shade={0.2} />)}
      <Dormitory pos={DORM_POS} night={lamps} sun={sun} lit={dormLit ?? [3, 7, 14, 18, 2]} machine={dormMachine === null ? undefined : dormMachine ?? 11} />
      <IronGate pos={[GATE.x, 0, GATE.z]} rotY={GATE.rotY} night={lamps} wings={[0, 3.6]} />
      {/* the dormitory's strip of garden: clipped bushes under the ground-floor windows, a bench, leaves */}
      {DORM.bays.map((x, i) => i === DORM.door ? null : <Sprite key={`dh${i}`} name={`cg-dhedge-${time}`} art={(c, W, H) => paintBush(c, W, H, T.bush)} px={[400, 240]} w={1.9} pos={[DORM_POS[0] + x, 0, DORM_POS[2] + 0.8]} flip={i % 2 === 0} shade={0.2} />)}
      {/* the yard: statue, benches, lamps, bicycles, maples, leaves */}
      <FounderStatue pos={[-14, 0, -34]} name={`cg-founder-${time}`} tone={night ? ['#3a4048', '#2e343c', '#4a525a'] : ['#5f6a52', '#46503e', '#7d8a68']} />
      <StoneBench pos={[-10, 0, -10]} rotY={0.3} /><StoneBench pos={[3, 0, -48.6]} rotY={-0.25} /><StoneBench pos={[21, 0, -30.5]} rotY={-0.1} />
      {([[1.2, -0.5], [5.8, -44.5], [12.5, -24], [20, -16], [-16, -40]] as [number, number][]).map(([x, z], i) => <CampusLamp key={i} pos={[x, 0, z]} lit={lamps} />)}
      <BikeRack pos={[-7, 0, -54.6]} night={night} /><BikeRack pos={[20.5, 0, -18]} night={night} bikes={['#5a3a2a', '#3a4a5a']} />
      {([[-16, -16, 6.0, 1], [14, -47, 6.4, 2], [6, -6, 6.8, 3], [-22, -44, 6.6, 4]] as number[][]).map(([x, z, w, s], i) => { const mp = maple(`cg-maple${s}-${time}`, T.maple, s); return <Sprite key={i} {...mp} w={w} pos={[x, 0, z]} flip={i % 2 === 1} />; })}
      {/* the dappled shade of trees standing out of frame at the left, lying across the near lawn (day only) */}
      {!night && !dusk ? <><GroundShade pos={[-0.6, 0, 4.6]} size={[8, 3.6]} rotY={0.22} seed={4} opacity={sun ? 0.36 : 0.26} /><GroundShade pos={[4.5, 0, 0.5]} size={[9, 4.2]} rotY={0.25} seed={1} opacity={sun ? 0.34 : 0.24} /><GroundShade pos={[9, 0, -6]} size={[9, 4]} rotY={0.2} seed={2} opacity={sun ? 0.26 : 0.2} /><GroundShade pos={[-9.5, 0, -3]} size={[7, 3.4]} rotY={0.3} seed={3} opacity={sun ? 0.24 : 0.18} /></> : null}
      <FallenLeaves pos={[-14, 0, -14]} area={[9, 6]} n={60} seed={1} night={night} />
      <FallenLeaves pos={[6, 0, -6]} area={[8, 5]} n={50} seed={2} night={night} />
      <FallenLeaves pos={[10, 0, -40]} area={[14, 14]} n={90} seed={3} night={night} />
      <FallenLeaves pos={[-6, 0, -20]} area={[16, 24]} n={70} seed={4} night={night} />
      <FallenLeaves pos={[-1, 0, 6]} area={[14, 10]} n={90} seed={5} night={night} />
      <FallenLeaves pos={[17, 0, -14]} area={[16, 16]} n={90} seed={6} night={night} />
      <FallenLeaves pos={[15, 0, -6]} area={[14, 8]} n={110} seed={7} night={night} />
      {([[-8, -2], [-1, 6], [2, -8], [-12, -24], [4, -32], [12, -30], [-2, -40], [9, -12], [16, -8], [19, -14], [13, -16], [22, -20], [11, -7]] as number[][]).map(([x, z], i) => <Sprite key={`t${i}`} name={`cg-tuft-${time}`} art={(c, W, H) => paintTuft(c, W, H, {light: T.bush[2], dark: T.bush[1]})} px={[160, 110]} w={0.75} pos={[x, 0, z]} flip={i % 2 === 0} cast={false} shade={0} />)}
      {board ? <><NoticeBoard pos={BOARD_POS} f={f} stars={typeof board === 'object' ? board.stars : undefined} />
        {/* leaves blown across the paving of the forecourt, a drift against each post; the marks before the board kept clear */}
        <FallenLeaves pos={[-2.5, 0, -45.5]} area={[12, 7]} n={110} seed={11} night={night} keep={[[-1.2, -0.5, 0.7], [0.6, -0.1, 0.7]]} />
        <FallenLeaves pos={[BOARD_POS[0], 0, BOARD_POS[2] + 0.1]} area={[2.2, 0.5]} n={30} seed={12} night={night} /></> : null}
      {/* dusk: fireflies low over the grass, dust drifting in the last light (box = in front of the camera of whichever view) */}
      {dusk ? <>
        <Motes f={f} box={[EYE[0] - 9, EYE[0] + 11, 0.5, 3.1, EYE[2] - 32, EYE[2] - 12]} n={46} color="#d6f27a" size={0.05 * domDom} drift={0.5} glow={0.7 * domDom} seed={31} />
        <Motes f={f} box={[EYE[0] - 8, EYE[0] + 10, 0.4, 4.2, EYE[2] - 26, EYE[2] - 5]} n={60} color="#ffd9a8" size={0.022} drift={0.35} glow={0.3} seed={32} />
      </> : null}
      {children}
      {view === 'a' ? <Plate from={EYE} id={`cg-fg-${k}`} d={3} paint={fgA(time, T.maple)} fog={false} order={900} /> : view === 'b' ? <Plate from={EYE} id={`cg-fg-${k}`} d={3} paint={dusk ? fgBDusk : fgB} fog={false} order={900} /> : <Plate from={EYE} id={`cg-fg-${k}`} d={3} paint={fgC(T.maple)} fog={false} order={900} />}
    </Scene3>
  );
};

export const Still: React.FC<{time: CampusTime; view: CampusView; children: React.ReactNode}> = ({time, view, children}) => {
  const {width, height} = useVideoConfig(), T = TIMES[time];
  return (
    <AbsoluteFill><Finish warm={T.warm} warmAmount={T.warmAmount}><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv />
      <Campus time={time} view={view}>{children}</Campus>
    </ThreeCanvas></Finish></AbsoluteFill>
  );
};
/** the forecourt in the morning with the notice board, no people: the camera 7 m before the board, the hall's door and steps
 *  behind (frame 40 = the three stars out) */
export const BOARD_EYE: V3 = [-2.6, 1.6, -40];
const BoardStill: React.FC = () => { const f = useCurrentFrame(); return <Shot grade="dayExterior" eye={BOARD_EYE} finish={{warm: TIMES.sang.warm, warmAmount: TIMES.sang.warmAmount}} set={(inside, cam) => <Campus time="sang" view="c" f={f} dx={cam.dx} dz={cam.dz} board={{stars: [-20, -14, -8]}}>{inside}</Campus>} figures={null} />; };
/** the yard alone at each hour, the view of its stills, no people (kho chung, 23/11/2026) */
export const CampusComps: React.FC = () => <>
  <Composition id="campus-chieu-trong" component={() => <Still time="chieu" view="a">{null}</Still>} width={1280} height={720} fps={24} durationInFrames={1} />
  <Composition id="campus-dem-trong" component={() => <Still time="dem" view="b">{null}</Still>} width={1280} height={720} fps={24} durationInFrames={1} />
  <Composition id="campus-sang-trong" component={() => <Still time="sang" view="c">{null}</Still>} width={1280} height={720} fps={24} durationInFrames={1} />
  <Composition id="campus-sang-bang-tin" component={BoardStill} width={1280} height={720} fps={24} durationInFrames={48} />
</>;
