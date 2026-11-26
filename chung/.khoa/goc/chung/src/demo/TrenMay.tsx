import React from 'react';
import {datNoiBui} from '../lib3/mauBui';
import {AbsoluteFill, Composition, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Finish, Scene3, Halo} from '../lib3/look';
import {StageCam} from '../lib3/kit';
import {Plate} from '../lib3/depth';
import {XoayCtx} from '../lib3/duongMay';
import {Cut, Hat, at, wAt, TAN_V, TAN_H} from '../lib3/kitVuTru';
import {MAY_PAL, paintMaySky, paintMayPeaks, paintMayStreaks, paintCloudBank, paintMayWisp, paintMayStrip, paintMayWall, wallCrack, paintMassLayer, paintMayCastle, bandsForWind} from '../lib3/kitTrenMay';

/** ABOVE THE CLOUDS (`TrenMay`, chapter 12 scenes 2, 5, 12, 13, 28, 33): no floor, only sky and a sea of cloud; people float at z 0 (the frame there is 8.9 m wide, 5.0 m tall).
 *  The lens looks along -z from TM_EYE = [0, 0, 10]. Layers far to near: the banded sky with its sun (d 520) / snow peaks (d 330) / the far sea of cloud (d 220) / a sky-castle far down
 *  at the lower right with a warm lit window (d 140, `den`) / the middle sea (d 120) / the near sea (d 60) / loose clouds in the air that can flow up or down (`troi`, d 14-40) /
 *  the tall cloud wall of scene 12 (`buc`, split by `tach` 0..1, light through the gap) / the people / tufts along the bottom edge (a foreground plate, order 900: left out by Shot).
 *  STATES: `chang-vang` (orange-violet sky, a low sun on the LEFT so it is never behind a head at the middle or on the right, early stars) and `ngay` (deep blue to pale at the horizon,
 *  white cumulus with grey bases). `troi` (metres) slides the loose clouds up the frame (positive: they go UP, as if the person falls) or down (negative: rising); the near ones go faster.
 *  `vet` 0..1 adds thin wind streaks that run with them (scenes 28, 33). Specks: ice crystals, fine and sharp. */
type V3 = [number, number, number];
export type TrenMayState = 'chang-vang' | 'ngay';
export const TM_EYE: V3 = [0, 0, 10];
/** where to stand a person (feet; a person 62 % of the frame is 3.1 m tall: feet at y -1.55 puts them in the middle of the frame) */
export const TM_MARKS = {giua: [0, -1.55, 0] as V3, trai: [-1.9, -1.4, 0] as V3, phai: [2.0, -1.4, 0] as V3, traiGan: [-1.5, -1.3, 0] as V3, phaiNho: [2.6, -1.0, 0] as V3, doom: [0, -1.1, 0] as V3};
export const TM_VIEWS = {chuan: TM_EYE, gan: [0, 0, 8] as V3, xa: [0, 0, 13] as V3};
/** the wall of scene 12: its middle and size, and the lamp of the sky-castle (world, from TM_EYE) */
export const TM_BUC = {pos: at(TM_EYE, 11.5, 0.2, 0.42), cao: 11, rong: 3.7};
export const TM_DEN = at(TM_EYE, 140, 0.8, 0.7);

const STRIPS = [{d: 40, k: 0, seed: 21, n: 3}, {d: 24, k: 1, seed: 22, n: 3}, {d: 14, k: 2, seed: 23, n: 2}];

export const TrenMay: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; state?: TrenMayState; troi?: number; vet?: number; buc?: boolean; tach?: number; den?: boolean; bui?: number; may?: number; kieu?: 'khoi' | 'cu'}> =
  ({children, f = 0, dx, dz, eye = TM_EYE, state = 'chang-vang', troi = 0, vet = 0, buc = false, tach = 0, den = false, bui = 1, may = 1, kieu = 'khoi'}) => { datNoiBui('tren-may');
    const pal = MAY_PAL[state], cv = state === 'chang-vang', wallT = cv ? {light: '#fbd2c0', mid: '#e8a4b0', dark: '#a874b8'} : {light: '#ffffff', mid: '#e2ebf6', dark: '#a6b4cc'};
    const crack = wallCrack(1800, 600), WP = 600, HP = 1800;
    return (
      <Scene3 grade={cv ? 'lateDay' : 'dayExterior'} dir={[-8, 4.5, 3.5]} gain={cv ? 1.1 : 1} reach={10}>
        <StageCam eye={eye} haze={pal.haze} fog={[500, 900]} dx={dx} dz={dz} />
        <Plate from={eye} id={`tm-sky-${state}`} d={520} fog={false} paint={paintMaySky(pal)} />
        <Plate from={eye} id={`tm-streaks-${state}`} d={420} fog={false} paint={paintMayStreaks(pal.strip)} />
        <Plate from={eye} id={`tm-peaks-${state}`} d={330} fog={false} paint={paintMayPeaks(pal)} />
        {kieu === 'khoi' ? <Plate from={eye} id={`tm-m1-${state}`} d={220} fog={false} paint={paintMassLayer(pal.cloud[0], 51, 640, 9, 260, 420, 120, 200, 0.45, pal.haze, 760)} /> : <Plate from={eye} id={`tm-sea1-${state}`} d={220} fog={false} paint={paintCloudBank(pal.cloud[0], 31, 650, 40, 52, 1250, -400, 2000, [210, 1120])} />}
        {den ? <>
          <Cut id={`tm-castle-${state}`} pos={TM_DEN} w={wAt(140, 0.11)} h={wAt(140, 0.11) * 0.75} px={512} paint={(c, W, H) => paintMayCastle(c, W, H)} />
          <Halo pos={[TM_DEN[0] - 0.4, TM_DEN[1] + 0.3, TM_DEN[2] + 0.5]} r={wAt(140, 0.05)} color="#ffd27a" strength={0.7} />
        </> : null}
        {kieu === 'khoi' ? <>
          <Plate from={eye} id={`tm-m2-${state}`} d={120} fog={false} paint={paintMassLayer(pal.cloud[1], 52, 745, 7, 340, 560, 170, 280, 0.22, pal.haze, 860)} />
          <Plate from={eye} id={`tm-m3-${state}`} d={60} fog={false} paint={paintMassLayer(pal.cloud[2], 53, 880, 5, 460, 760, 230, 360, 0, pal.haze, 1250)} />
        </> : <>
          <Plate from={eye} id={`tm-sea2-${state}`} d={120} fog={false} paint={paintCloudBank(pal.cloud[1], 32, 770, 50, 80, 1250, -400, 2000, [1400, 300])} />
          <Plate from={eye} id={`tm-sea3-${state}`} d={60} fog={false} paint={paintCloudBank(pal.cloud[2], 33, 860, 56, 105, 1250, -400, 2000, [90, 1000])} />
        </>}
        {/* loose clouds in the air, scrolling vertically with `troi`; the near ones faster */}
        {may > 0 ? STRIPS.map((s) => { const Hs = TAN_V * s.d * 1.35, Ws = TAN_H * s.d * 1.5, off = (troi * 10) / s.d, sh = ((off % Hs) + Hs) % Hs - Hs;
          return [0, 1, 2].map((k) => <Cut key={`${s.d}-${k}`} id={`tm-strip-${state}-${s.k}`} pos={[eye[0] + 0.2 * s.k * 0, eye[1] + sh + k * Hs, eye[2] - s.d]} w={Ws} h={Hs} px={1024} opacity={may * (s.k === 2 ? 0.95 : 0.9)} paint={paintMayStrip(pal.strip, s.seed, s.n)} />); }) : null}
        {vet > 0 ? [0, 1].map((j) => { const d = 11 + j * 5, Hs = TAN_V * d * 1.35, off = (troi * 10) / d, sh = ((off % Hs) + Hs) % Hs - Hs;
          return [0, 1, 2].map((k) => <Cut key={`v${j}-${k}`} id={`tm-vet-${j}`} pos={[eye[0], eye[1] + sh + k * Hs, eye[2] - d]} w={TAN_H * d * 1.2} h={Hs} px={768} opacity={vet * 0.5} order={4} paint={bandsForWind(40 + j, 14)} />); }) : null}
        {/* the tall cloud wall of scene 12 and the light through its split */}
        {buc ? <>
          <Cut id="tm-buc-anh" pos={[TM_BUC.pos[0], TM_BUC.pos[1], TM_BUC.pos[2] - 0.1]} w={0.9 + tach * 1.4} h={TM_BUC.cao} px={256} opacity={Math.min(1, tach * 1.4)} paint={(c, W, H) => { c.fillStyle = '#ffe2a0'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff6d6'; c.fillRect(W * 0.3, 0, W * 0.4, H); }} />
          {[-1, 1].map((m) => <Cut key={m} id={`tm-buc-${state}-${m}`} pos={[TM_BUC.pos[0] + m * tach * 1.7, TM_BUC.pos[1], TM_BUC.pos[2]]} w={TM_BUC.rong} h={TM_BUC.cao} px={600} paint={(c, W, H) => { c.save(); c.beginPath(); c.moveTo(m < 0 ? 0 : W, 0); for (let y = 0; y <= H; y += 40) c.lineTo(crack(y), y); c.lineTo(m < 0 ? 0 : W, H); c.closePath(); c.clip(); paintMayWall(wallT)(c, W, H); c.restore(); }} />)}
        </> : null}
        <Plate from={eye} id={`tm-wisp-${state}`} d={5} order={900} fog={false} paint={paintMayWisp(pal.wisp)} />
        {bui > 0 ? <>
          <Hat f={f} box={[-4.6, 4.6, -2.7, 2.7, 1, 4]} n={Math.round(36 * bui)} colors={cv ? ['#fff0e0', '#ffd8e8', '#e8f0ff'] : ['#ffffff', '#e8f4ff']} size={0.05} wind={[-0.5, 0.05]} kind="kim" twinkle seed={3} />
          <Hat f={f} box={[-4.6, 4.6, -2.7, 2.7, -3, 1]} n={Math.round(22 * bui)} colors={cv ? ['#ffd890', '#ffe8c0'] : ['#ffffff']} size={0.03} wind={[-0.3, 0.03]} kind="sao" seed={6} />
        </> : null}
        {children}
      </Scene3>
    );
  };

type Props = React.ComponentProps<typeof TrenMay>;
const mk = (p: Props, yaw = 0): React.FC => () => {
  const {width, height} = useVideoConfig();
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat gl={{antialias: true}}><XoayCtx.Provider value={yaw}><TrenMay {...p} /></XoayCtx.Provider></ThreeCanvas></Finish></AbsoluteFill>;
};
const STILLS: [string, Props][] = [
  ['tren-may-chang-vang', {state: 'chang-vang', f: 12}],
  ['tren-may-chang-vang-cao-tuong', {state: 'chang-vang', buc: true, f: 12}],
  ['tren-may-chang-vang-tach', {state: 'chang-vang', buc: true, tach: 0.8, f: 30}],
  ['tren-may-ngay', {state: 'ngay', f: 12}],
  ['tren-may-chang-vang-cu', {state: 'chang-vang', kieu: 'cu', f: 12}],
  ['tren-may-ngay-troi', {state: 'ngay', troi: 3.2, vet: 1, f: 30}],
];
const COMPS = STILLS.map(([id, p]) => [id, mk(p)] as const);
export const TrenMayComps: React.FC = () => <>{COMPS.map(([id, C]) => <Composition key={id} id={id} component={C} width={1280} height={720} fps={24} durationInFrames={48} />)}</>;
