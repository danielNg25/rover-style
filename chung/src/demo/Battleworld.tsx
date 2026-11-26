import React from 'react';
import {datNoiBui} from '../lib3/mauBui';
import {AbsoluteFill, Composition, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Finish, Scene3, Halo} from '../lib3/look';
import {StageCam, B} from '../lib3/kit';
import {Plate, rnd, P, Ctx} from '../lib3/depth';
import {XoayCtx} from '../lib3/duongMay';
import {Cut, Hat, blobPts, TAN_V, TAN_H} from '../lib3/kitVuTru';
import {bwPal, BwState, BwPal, PanoMesh, paintBwSky, paintBwFar, paintBwMid, paintBwGround, paintMesa, paintArch, paintColumn, paintBoulders, paintCrystalCluster, paintAsphalt, paintBrick, paintPlume,
  paintCastleBase, paintCastleTower, paintCastleRoof, paintCastleCrack, paintRubble, BoxTex, Bar, MomDa, MayHut} from '../lib3/kitBattleworld';

/** BATTLEWORLD (`Battleworld`), a planet sewn from pieces of other places; chapters 13 and 14 of the Doom episode share it (same coordinates, same views).
 *  World in metres, the A frame: the mesa of the machine at the origin side, the lens looks along -z. One set TURNS to give many views: the whole scenery (not the camera, not the people)
 *  is rotated about the pivot BW_TAM = [2, 0, -4] by -yaw, so a person is stood with `place(yaw, p)` and the camera with the `eye` of `BW_VIEWS` (`bwEye(yaw, eye0)`). A horizon runs round 220 degrees
 *  (cylinder strips: sky 520 m, far land 300 m, nearer ridges 170 m), so every view has its own marks:
 *    north (A, yaw 0): the table mountain `nuiMatBan`, the seam of light, the broken moon; the mesa `momDa` right.   west (B2, +60): ice mountains and the green aurora, open ground.
 *    north-west (B, +32): the fighting ground, ice mountains, the mesa behind a figure at `doomRieng`.   north-east (C, -25): the broken city on its tilted slab, the plain, the castle site `lauDai`.
 *  Light: a low sun at the left of the frame in most states (`bwPal(state).sun`), never behind a head at the middle or the right.
 *  STATES (`state`): `chien` (pink-violet afternoon, a little smoke), `hut` (= `chien` darkened by `tat` 0..1, for the draining), `than` (clear gold, smoke gone), `bao` (= `chang-vang` plus a storm of violet cloud
 *  coming in by `u` 0..1, the horizon still gold-pink) and `chang-vang` (dusk). Props: `may` the machine (`rap`, `chay` with `lit` 0..1, `chayDen`), `lauDai` {moc, thapMoi, nut, sap} (the castle site [30, 0, -110]: rising, the new tower rising,
 *  the crack, the collapse), `hoNo` the crater's smoke, `chop` 0..1 a flash of lightning, `bui` the amount of air specks. Brightness: the sky and land carry the frame (chien Y over 105; than over 120; chang-vang / bao over 95). */
type V3 = [number, number, number];
export const BW_TAM: V3 = [2, 0, -4];
const rad = (yaw: number) => (-yaw * Math.PI) / 180;
/** a point of the A frame in the turned world (where to stand a person, or the camera) */
export const place = (yaw: number, p: V3): V3 => { const t = rad(yaw), c = Math.cos(t), s = Math.sin(t), x = p[0] - BW_TAM[0], z = p[2] - BW_TAM[2]; return [BW_TAM[0] + x * c + z * s, p[1], BW_TAM[2] - x * s + z * c]; };
export const bwEye = (yaw: number, eye0: V3): V3 => place(yaw, eye0);
/** the five views of the lists. eye0 = the camera in the A frame (as the list gives it, looking along the turned direction), eye = the camera to pass to StageCam / Shot with that yaw */
const VW = (yaw: number, eye0: V3) => ({yaw, eye0, eye: bwEye(yaw, eye0)});
export const BW_VIEWS = {
  a: VW(0, [-0.2, 2.0, 9.4]),     // wide, north: scenes 9, 10, 11, 15, 17 of d1c13; 7, 9, 10, 17, 19, 22, 26 of d1c14
  aGan: VW(0, [-1.5, 1.7, 3.2]),  // d1c13 scene 10
  b: VW(32, [8.1, 0.9, 5.1]),     // d1c13 scene 12; d1c14 8, 15, 18
  b14: VW(32, [6.3, 3.1, -1.1]),  // d1c13 scene 14 (building the machine)
  b2: VW(60, [7.7, 1.6, 0.55]),   // d1c13 scene 13; d1c14 6, 14, 20, 23-25
  c: VW(-25, [1.4, 3.0, 0]),      // d1c14 scenes 2, 3, 11-13, 16, 21
  d: VW(0, [4.3, 3.4, -2.7]),     // close on the machine: d1c13 scenes 16, 19 (d19 at z 0), d1c14 scene 1
  dXa: VW(0, [4.3, 3.45, 0]),
  may: VW(0, [2.8, 2.9, 3.0]),
  mayXa: VW(0, [4.3, 5.9, 11.7]),   // the whole machine in frame    // d1c13 scene 15
} as const;
/** marks in the A frame: stand people with place(yaw, mark) */
export const BW_MARKS = {
  momDa: {x0: 1.2, x1: 5.6, z0: -7.4, z1: -4.8, top: 2.0},
  mayHut: [4.3, 2.0, -6.0] as V3, may: [4.3, 2.2, -6.0] as V3, doomLoTho: [4.3, 2.8, -6.0] as V3, doomMay: [4.3, 2.2, -6.0] as V3, doomDinh: [3.0, 2.0, -5.4] as V3, doomRieng: [3.7, 0, -1.8] as V3,
  nuiMatBan: [-12, 0, -60] as V3, vomDa: [-28, 0, -45] as V3, hoNo: [-3, 0, -10] as V3, phaLe: [[8, 0, -12], [-9, 0, -7]] as V3[], tamDuong: [-6, 0, -14] as V3, bucGach: [10, 0, -18] as V3, lauDai: [30, 0, -110] as V3,
  heroes: [[-4.4, 0, -2.0], [-3.6, 0, -2.0], [-2.8, 0, -2.0], [-1.8, 0, -2.0], [-0.9, 0, -2.0], [-0.1, 0, -2.0]] as V3[], villains: [[1.3, 0, -2.0], [2.2, 0, -2.0]] as V3[], doomTach: [3.7, 0, -1.9] as V3,
  quaDau: [-1, 3.4, -6] as V3,   // where the Beyonder's light hangs in most views (high, left of centre)
};
export type LauDai = {moc?: number; thapMoi?: number; nut?: number; sap?: number};

const Face: React.FC<{p: V3; yaw: number; children: React.ReactNode}> = ({p, yaw, children}) => <group position={p} rotation={[0, -rad(yaw), 0]}>{children}</group>;
const inCastleLine = (p: V3) => { const b = (Math.atan2(p[0] - BW_TAM[0], -(p[2] - BW_TAM[2])) * 180) / Math.PI, d = Math.hypot(p[0] - BW_TAM[0], p[2] - BW_TAM[2]); return d > 25 && d < 108 && b > 4 && b < 30; };
const Sprite: React.FC<{yaw: number; id: string; p: V3; w: number; h: number; paint: (c: Ctx, W: number, H: number) => void; px?: number; flip?: boolean; fog?: boolean; opacity?: number}> = ({yaw, id, p, w, h, paint, px = 768, flip, fog = true, opacity = 1}) =>
  <Face p={p} yaw={yaw}><Cut id={id} pos={[0, h / 2, 0]} w={w} h={h} px={px} paint={paint} flip={flip} fog={fog} opacity={opacity} /></Face>;

/** a bank of storm cloud: three stacked dark layers across the upper sky, a pink lit underside */
const paintStorm = (c: Ctx) => { const r = rnd(41);
  [['#7a62a8', 70, 330], ['#6a54a0', 110, 250], ['#5a4690', 150, 160]].forEach(([col, base, top], i) => { const pts: number[][] = [[-400, -300], [-400, (base as number) + 130 + i * 20]]; for (let x = -400; x <= 2000; x += 90 + r() * 70) pts.push([x, (base as number) + 130 + (r() - 0.5) * 100 + Math.sin(x / 230 + i) * 50 + (top as number) * 0.5]); pts.push([2000, -300]); P(c, pts, col as string); });
  for (let k = 0; k < 24; k++) { const x = -300 + r() * 2000, y = 150 + r() * 330; P(c, blobPts(x, y, 80 + r() * 160, 30 + r() * 40, 8, 0.25, r, r()), r() < 0.5 ? '#8068b0' : '#5e4a92'); }
  P(c, [[-400, 470], ...Array.from({length: 22}, (_, i) => [-400 + i * 110, 470 + Math.sin(i * 1.7) * 30 + (r() - 0.5) * 30]), [2000, 470], [2000, 505], [-400, 505]], '#d07aa4'); };
const paintFg = (p: BwPal) => (c: Ctx) => { const r = rnd(77);
  for (let x = -300; x < 1900; x += 120 + r() * 180) { const h = 40 + r() * 90, w = 90 + r() * 120; P(c, [[x, 960], [x + w * 0.1, 960 - h * 0.6], [x + w * 0.3, 960 - h], [x + w * 0.7, 960 - h * 0.9], [x + w, 960 - h * 0.3], [x + w * 1.05, 960]], p.rock[2]); P(c, [[x, 960], [x + w * 0.1, 960 - h * 0.6], [x + w * 0.3, 960 - h], [x + w * 0.5, 960 - h * 0.4], [x + w * 0.4, 960]], p.rock[1]); }
  for (let x = -200; x < 1800; x += 420 + r() * 300) for (let j = 0; j < 3; j++) { const h = 60 + r() * 80, a = (j - 1) * 0.3; const bx = x + j * 22; P(c, [[bx - 13, 960], [bx - 8 + Math.sin(a) * h, 960 - h * 0.85], [bx + Math.sin(a) * h, 960 - h], [bx + 9 + Math.sin(a) * h, 960 - h * 0.85], [bx + 15, 960]], p.crystal[1]); P(c, [[bx - 13, 960], [bx - 8 + Math.sin(a) * h, 960 - h * 0.85], [bx + Math.sin(a) * h, 960 - h], [bx + 2, 960]], p.crystal[0]); } };

/** the castle site: rises (moc), a new tower rises beside it (thapMoi), a crack climbs it (nut), then it falls (sap) */
const Lau: React.FC<{yaw: number; p: BwPal; L: LauDai; f: number}> = ({yaw, p, L, f}) => {
  const {moc = 1, thapMoi = 0, nut = 0, sap = 0} = L, [x, , z] = BW_MARKS.lauDai, W = 34, H = W * 0.56, tw = 5.6, th = tw * (350 / 220), rw = tw, rh = rw * (230 / 220), ease = (t: number) => t * t * (3 - 2 * t);
  const ym = -(1 - ease(Math.min(1, moc))) * (H + 2), yt = -(1 - ease(Math.min(1, thapMoi))) * (th + rh + 2);
  const fall = ease(Math.min(1, sap)), shrink = 1 - fall * 0.5, tilt = fall * 0.22;
  return <group>
    <Face p={[x, ym, z]} yaw={yaw}><Cut id="bw-castle-base" pos={[0, H / 2, 0]} w={W} h={H} px={1400} paint={paintCastleBase(p)} fog /></Face>
    {thapMoi > 0 ? <Face p={[x - 14.2, yt, z + 4]} yaw={yaw}>
      <group rotation={[0, 0, -tilt]} scale={[1, shrink, 1]}><Cut id="bw-castle-tower" pos={[0, th / 2, 0]} w={tw} h={th} px={440} paint={paintCastleTower(p)} fog order={4} /></group>
      {nut > 0 ? <group rotation={[0, 0, -tilt]} scale={[1, shrink, 1]}><Cut id="bw-castle-crack" pos={[0.1, th / 2, 0.05]} w={tw * 0.55} h={th} px={256} paint={paintCastleCrack} fog order={5} opacity={Math.min(1, nut * 1.6) * (1 - fall * 0.5)} /></group> : null}
      <group position={[fall * 3.2, th * shrink - fall * (th * shrink + 0.1) * 0.9, 0.1]} rotation={[0, 0, -fall * 1.3]} scale={[1, 1, 1]}><Cut id="bw-castle-roof" pos={[0, rh / 2, 0]} w={rw} h={rh} px={440} paint={paintCastleRoof(p)} fog order={5} opacity={1 - Math.max(0, fall - 0.85) * 6} /></group>
      {fall > 0.05 ? [[-0.8, 0.5, 0.6], [0.9, 0.3, 0.8], [1.8, 0.2, 0.5], [-1.6, 0.4, 0.4]].map(([dx, dy, sc], i) => <group key={i} position={[dx * fall * 3, Math.max(0.2, th * shrink * (0.9 - i * 0.18) - fall * fall * (th * 0.9)) * (fall < 1 ? 1 : 1) + dy, 0.4]} rotation={[0, 0, fall * (i + 1)]}><Cut id="bw-rubble" pos={[0, 0, 0]} w={sc * 1.4} h={sc * 1.2} px={128} paint={paintRubble} fog order={5} /></group>) : null}
    </Face> : null}
    {fall > 0.1 ? <Hat f={f} box={[x - 20, x - 7, 0.4, 7 + fall * 5, z + 1, z + 5]} n={34} colors={['#cfc6d8', '#a89cbc', '#e8dcc8']} size={0.9} wind={[0.3, 0.6]} kind="manh" spin={0.01} order={6} opacity={0.5} seed={3} /> : null}
  </group>;
};

/** a scatter of specks in three depth bands in front of the camera (final world coordinates) */
const Air: React.FC<{eye: V3; f: number; state: BwState; k: number; u: number}> = ({eye, f, state, k, u}) => {
  const p = bwPal(state), band = (d: number, hw: number) => [eye[0] - hw, eye[0] + hw, eye[1] - hw * 0.56, eye[1] + hw * 0.56 + 0.6, eye[2] - d - 1, eye[2] - d + 1] as [number, number, number, number, number, number];
  const gold = state === 'than', storm = state === 'bao' ? 0.5 + u : 0;
  return k > 0 ? <>
    <Hat f={f} box={band(3, 1.9)} n={Math.round(26 * k)} colors={p.ember} size={0.022} wind={[-0.3 - storm * 2, gold ? 0.12 : 0.22]} kind="kim" seed={2} order={8} />
    <Hat f={f} box={band(8, 4.6)} n={Math.round(44 * k)} colors={gold ? ['#fff2b0', '#ffe27a'] : p.ember} size={0.05} wind={[-0.35 - storm * 3, gold ? 0.12 : 0.2]} kind="kim" seed={4} order={8} />
    <Hat f={f} box={band(22, 11)} n={Math.round(40 * k)} colors={gold ? ['#fff6c8'] : ['#e8c0ff', '#ffcfa8']} size={0.14} wind={[-0.6 - storm * 4, 0.1]} kind="kim" seed={7} order={8} />
    {!gold ? <Hat f={f} box={band(7, 4.2)} n={Math.round(16 * k)} color="#7a5a86" size={0.09} wind={[-0.5 - storm * 3, 0.05]} kind="manh" spin={0.012} seed={9} order={8} /> : null}
  </> : null;
};

export const Battleworld: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; yaw?: number; state?: BwState; u?: number; tat?: number; may?: 'rap' | 'chay' | 'chayDen' | null; lit?: number; lauDai?: LauDai | null;
  hoNo?: boolean; chop?: number; bui?: number; tienCanh?: boolean}> =
  ({children, f = 0, dx, dz, eye = BW_VIEWS.a.eye, yaw = 0, state = 'chien', u = 0, tat = 0, may = null, lit = 1, lauDai = null, hoNo, chop = 0, bui = 1, tienCanh = true}) => { datNoiBui('battleworld');
    const p = bwPal(state), th = rad(yaw), smoke = hoNo ?? (state === 'chien' || state === 'hut'), wob = Math.sin(f * 0.12);
    const scene = new THREE.Color(p.ground[0]);
    return (
      <Scene3 grade={p.light.grade} dir={p.light.dir} gain={p.light.gain} reach={16}>
        <StageCam eye={eye} haze={p.haze} fog={[80, 460]} dx={dx} dz={dz} />
        <group position={BW_TAM} rotation={[0, th, 0]}>
          <group position={[-BW_TAM[0], -BW_TAM[1], -BW_TAM[2]]}>
            <group position={BW_TAM}>
              <PanoMesh id={`bw-sky-${bwPalKey(state)}`} R={520} order={-3} paint={paintBwSky(p)} />
              <PanoMesh id={`bw-far-${bwPalKey(state)}`} R={300} order={-2} paint={paintBwFar(p)} />
              <PanoMesh id={`bw-mid-${bwPalKey(state)}`} R={170} order={-1} paint={paintBwMid(p)} />
            </group>
            {/* the ground: a flat plane that the haze fades, with a painted decal of cracks, scorch and stones over the middle */}
            <mesh position={[BW_TAM[0], 0, BW_TAM[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[900, 900]} /><meshLambertMaterial color={scene} /></mesh>
            <Cut id={`bw-ground-${bwPalKey(state)}`} pos={[BW_TAM[0], 0.012, BW_TAM[2] - 22]} w={140} h={100} px={2048} rotX={-Math.PI / 2} fog paint={paintBwGround(p)} order={1} />
            <Cut id={`bw-ground-near-${bwPalKey(state)}`} pos={[BW_TAM[0], 0.016, BW_TAM[2] + 4]} w={40} h={28} px={2048} rotX={-Math.PI / 2} fog paint={paintBwGround(p, 23, 40, 1.6)} order={1} />
            {[[-9.5, 2.6, 2.2], [-7.2, 5.0, 1.5], [8.8, 3.0, 2.4], [6.5, 6.0, 1.3], [-11, -3.5, 2.8], [11.5, -2, 2.2], [-6.2, 0.6, 1.1], [7.6, 1.4, 1.0]].map(([x, z, w], i) => <Sprite key={`nr${i}`} yaw={yaw} id={`bw-nr-${bwPalKey(state)}-${i}`} p={[x, 0, z]} w={w} h={w * 0.55} px={384} fog={false} paint={paintBoulders(p, 31 + i)} />)}
            {/* the far standing things: mesa, arch, columns, boulders */}
            <Sprite yaw={yaw} id={`bw-mesa-${bwPalKey(state)}`} p={[-16, 0, -60]} w={32} h={12.8} px={1200} paint={paintMesa(p)} />
            <Sprite yaw={yaw} id={`bw-arch-${bwPalKey(state)}`} p={BW_MARKS.vomDa} w={22} h={14.3} px={900} paint={paintArch(p)} />
            {[[-4, -44, 5, 16, 1], [14, -58, 6, 20, 2], [-20, -72, 6, 22, 3], [24, -50, 5, 14, 4], [-38, -64, 7, 18, 5], [8, -84, 6, 24, 6], [40, -76, 7, 20, 7], [-52, -55, 6, 15, 8]].filter(([x, z]) => !inCastleLine([x, 0, z])).map(([x, z, w, h, s]) => <Sprite key={s} yaw={yaw} id={`bw-col-${bwPalKey(state)}-${s}`} p={[x, 0, z]} w={w} h={h} px={320} paint={paintColumn(p, s)} />)}
            {[[-9, -22, 7], [6, -30, 9], [-22, -28, 8], [18, -24, 6], [-3, -40, 10], [30, -34, 8], [-34, -40, 9], [12, -16, 4.5], [-14, -12, 4]].filter(([x, z]) => !inCastleLine([x, 0, z])).map(([x, z, w], i) => <Sprite key={i} yaw={yaw} id={`bw-boulders-${bwPalKey(state)}-${i}`} p={[x, 0, z]} w={w} h={w * 0.5} px={512} paint={paintBoulders(p, 9 + i)} />)}
            {/* crystals (turquoise, glowing) near the ground */}
            {[...BW_MARKS.phaLe, [-18, 0, -26] as V3, [20, 0, -38] as V3, [-30, 0, -58] as V3].map((q, i) => <group key={i}><Sprite yaw={yaw} id={`bw-crystal-${bwPalKey(state)}-${i}`} p={q} w={i < 2 ? 3.1 : 6} h={i < 2 ? 2.4 : 4.6} px={512} paint={paintCrystalCluster(p, 2 + i)} />
              <Face p={[q[0], 0.9, q[2] + 0.2]} yaw={yaw}><Halo pos={[0, 0, 0]} r={i < 2 ? 1.7 : 3} color="#8ffff0" strength={0.38} order={5} /></Face></group>)}
            {/* the blast crater and its smoke */}
            <Cut id={`bw-crater-${bwPalKey(state)}`} pos={[BW_MARKS.hoNo[0], 0.03, BW_MARKS.hoNo[2]]} w={6.2} h={4.0} px={512} rotX={-Math.PI / 2} fog order={2} paint={(c, W, H) => { P(c, blobPts(W / 2, H / 2, W * 0.47, H * 0.46, 11, 0.12, rnd(3)), '#8a5a64'); P(c, blobPts(W / 2, H * 0.52, W * 0.4, H * 0.38, 11, 0.12, rnd(4)), '#2c1a2c'); P(c, blobPts(W * 0.46, H * 0.46, W * 0.26, H * 0.2, 9, 0.12, rnd(5)), '#4a2e44'); for (let k = 0; k < 9; k++) { const a = (k / 9) * 6.28; c.strokeStyle = '#3a2238'; c.lineWidth = 6; c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * W * 0.44, H / 2 + Math.sin(a) * H * 0.42); c.lineTo(W / 2 + Math.cos(a) * W * 0.5, H / 2 + Math.sin(a) * H * 0.5); c.stroke(); } }} />
            {smoke ? [0].map((i) => <Sprite key={i} yaw={yaw} id={`bw-plume-${i}`} p={[BW_MARKS.hoNo[0] + wob * 0.12 * (i + 1) + i * 0.5, 0.2, BW_MARKS.hoNo[2] - 0.2 - i * 0.6]} w={1.7 + i * 0.5} h={5.8 + i * 1.4} px={256} paint={paintPlume(3 + i)} opacity={0.94} />) : null}
            {/* things from other places: a torn slab of road, a broken lamp post, a sign, a ruin of brick wall */}
            <group position={[BW_MARKS.tamDuong[0], 0.34, BW_MARKS.tamDuong[2]]} rotation={[0.16, 0.5, 0.1]}><BoxTex id="bw-asphalt" p={[0, 0, 0]} s={[3.6, 0.36, 5.6]} paint={paintAsphalt} px={512} /></group>
            <group position={[-7.9, 0, -12.2]}><Bar a={[0, 0, 0]} b={[0.05, 2.1, 0]} t={0.12} c="#6a6a7c" /><Bar a={[0.05, 2.1, 0]} b={[1.2, 1.7, 0.1]} t={0.1} c="#5a5a6c" /><B p={[1.35, 1.64, 0.1]} s={[0.46, 0.14, 0.3]} c="#3a3a4a" r={[0, 0, -0.35]} /></group>
            <group position={[-4.7, 0, -13.4]} rotation={[0, 0.3, 0.12]}><Bar a={[0, 0, 0]} b={[0, 1.9, 0]} t={0.07} c="#7a7a8c" /><Cut id="bw-sign" pos={[0, 2.1, 0.05]} w={0.8} h={0.8} px={128} fog order={4} paint={(c, W, H) => { P(c, Array.from({length: 8}, (_, i) => [W / 2 + Math.cos((i / 8) * 6.283 + 0.39) * W * 0.46, H / 2 + Math.sin((i / 8) * 6.283 + 0.39) * H * 0.46]), '#c8383a'); P(c, Array.from({length: 8}, (_, i) => [W / 2 + Math.cos((i / 8) * 6.283 + 0.39) * W * 0.34, H / 2 + Math.sin((i / 8) * 6.283 + 0.39) * H * 0.34]), '#e85a52'); }} /></group>
            <group position={[BW_MARKS.bucGach[0], 0, BW_MARKS.bucGach[2]]}>
              <BoxTex id="bw-brick" p={[0, 0.8, 0]} s={[3.4, 1.6, 0.42]} paint={paintBrick} rot={[0, 0.2, 0.03]} /><BoxTex id="bw-brick" p={[2.2, 0.4, 0.4]} s={[1.6, 0.8, 0.42]} paint={paintBrick} rot={[0, 0.5, -0.06]} />
              {[[-1.9, 0.14, 0.9, 0.5], [-2.6, 0.12, 0.4, 0.4], [1.2, 0.13, 1.1, 0.6], [3.2, 0.12, 1.0, 0.7]].map(([x, y, z, r], i) => <BoxTex key={i} id="bw-brick" p={[x, y, z]} s={[0.5, 0.26, 0.3]} paint={paintBrick} rot={[0.1, r * 3, 0.2]} />)}
            </group>
            {/* the mesa and the machine on it */}
            <MomDa p={p} />
            {may ? <group position={BW_MARKS.mayHut}><MayHut trang={may} f={f} lit={lit} pal={p} tat={tat} /></group> : null}
            {may === 'chayDen' ? [0, 1].map((i) => <Sprite key={i} yaw={yaw} id={`bw-plume-t${i}`} p={[4.4 + wob * 0.08, 9.4 + i * 0.6, -5.9]} w={0.9 + i * 0.5} h={3.0 + i * 1.2} px={256} paint={paintPlume(21 + i, ['#6a5a74', '#4a3e58', '#322a44'])} opacity={0.65} />) : null}
            {lauDai ? <Lau yaw={yaw} p={p} L={lauDai} f={f} /> : null}
          </group>
        </group>
        {/* storm and darkening: over the scenery, under the people (order 100) */}
        {state === 'bao' && u > 0 ? <Plate from={eye} id="bw-storm" d={260} fog={false} order={-0.5} paint={paintStorm} /> : null}
        {state === 'bao' && u > 0 ? <mesh position={[eye[0], eye[1], eye[2] - 6]} renderOrder={100}><planeGeometry args={[TAN_H * 6 * 1.6, TAN_V * 6 * 1.6]} /><meshBasicMaterial color="#2a1c52" transparent opacity={Math.min(0.12, u * 0.06)} depthWrite={false} fog={false} /></mesh> : null}
        {state === 'hut' || tat > 0 ? <mesh position={[eye[0], eye[1], eye[2] - 6]} renderOrder={100}><planeGeometry args={[TAN_H * 6 * 1.6, TAN_V * 6 * 1.6]} /><meshBasicMaterial color="#2c1858" transparent opacity={Math.min(0.62, tat * 0.62)} depthWrite={false} fog={false} /></mesh> : null}
        {chop > 0 ? <mesh position={[eye[0], eye[1], eye[2] - 6]} renderOrder={101}><planeGeometry args={[TAN_H * 6 * 1.6, TAN_V * 6 * 1.6]} /><meshBasicMaterial color="#efe0ff" transparent opacity={Math.min(0.55, chop * 0.55)} depthWrite={false} fog={false} /></mesh> : null}
        {tienCanh ? <Plate from={eye} id={`bw-fg-${bwPalKey(state)}`} d={3.4} order={900} fog={false} paint={paintFg(p)} /> : null}
        <Air eye={eye} f={f} state={state} k={bui} u={u} />
        {children}
      </Scene3>
    );
  };
const bwPalKey = (s: BwState) => (s === 'than' ? 'than' : s === 'chang-vang' || s === 'bao' ? 'cv' : 'chien');

// ---------------------------------------------------------------- stills (no people): each state and each view
type Props = React.ComponentProps<typeof Battleworld>;
const view = (v: keyof typeof BW_VIEWS, o: Props = {}): Props => ({eye: BW_VIEWS[v].eye, yaw: BW_VIEWS[v].yaw, f: 12, ...o});
const mk = (p: Props): React.FC => () => {
  const {width, height} = useVideoConfig();
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><XoayCtx.Provider value={0}><Battleworld {...p} /></XoayCtx.Provider></ThreeCanvas></Finish></AbsoluteFill>;
};
const STILLS: [string, Props][] = [
  ['battleworld-chien-a', view('a', {may: 'chay'})],
  ['battleworld-chien-a-gan', view('aGan')],
  ['battleworld-chien-b', view('b')],
  ['battleworld-chien-b-lap-may', view('b14', {may: 'rap'})],
  ['battleworld-chien-b2', view('b2')],
  ['battleworld-chien-c', view('c')],
  ['battleworld-chien-d-may-chay', view('d', {may: 'chay'})],
  ['battleworld-chien-may-toan', view('mayXa', {may: 'chay'})],
  ['battleworld-chien-may-rap-toan', view('mayXa', {may: 'rap'})],
  ['battleworld-than-may-den-toan', view('mayXa', {state: 'than', may: 'chayDen'})],
  ['battleworld-chien-khai-hoa', view('may', {may: 'chay'})],
  ['battleworld-hut-a', view('a', {state: 'hut', tat: 0.6, may: 'chay'})],
  ['battleworld-hut-d', view('d', {state: 'hut', tat: 0.8, may: 'chay', lit: 1})],
  ['battleworld-than-d', view('dXa', {state: 'than', may: 'chayDen'})],
  ['battleworld-than-b2', view('b2', {state: 'than'})],
  ['battleworld-than-c', view('c', {state: 'than', lauDai: {moc: 1}})],
  ['battleworld-than-a', view('a', {state: 'than', may: 'chayDen'})],
  ['battleworld-cv-a', view('a', {state: 'chang-vang', may: 'chayDen'})],
  ['battleworld-cv-c-lau-dai', view('c', {state: 'chang-vang', lauDai: {moc: 1, thapMoi: 1}})],
  ['battleworld-cv-c-lau-dai-nut', view('c', {state: 'chang-vang', lauDai: {moc: 1, thapMoi: 1, nut: 1}})],
  ['battleworld-cv-c-lau-dai-sap', view('c', {state: 'chang-vang', lauDai: {moc: 1, thapMoi: 1, nut: 1, sap: 0.6}, f: 30})],
  ['battleworld-cv-c-lau-dai-troi', view('c', {state: 'chang-vang', lauDai: {moc: 0.55}, f: 20})],
  ['battleworld-bao-c', view('c', {state: 'bao', u: 0.6, lauDai: {moc: 1, thapMoi: 1, nut: 1}})],
  ['battleworld-bao-b2', view('b2', {state: 'bao', u: 0.85, chop: 0.8})],
  ['battleworld-bao-a', view('a', {state: 'bao', u: 0.45, may: 'chayDen'})],
];
const COMPS = STILLS.map(([id, p]) => [id, mk(p)] as const);
export const BattleworldComps: React.FC = () => <>{COMPS.map(([id, C]) => <Composition key={id} id={id} component={C} width={1280} height={720} fps={24} durationInFrames={48} />)}</>;
