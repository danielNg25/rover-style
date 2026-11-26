import React from 'react';
import {datNoiBui} from '../lib3/mauBui';
import {AbsoluteFill, Composition, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Finish, Scene3} from '../lib3/look';
import {StageCam} from '../lib3/kit';
import {Plate, rnd} from '../lib3/depth';
import {XoayCtx} from '../lib3/duongMay';
import {DiaCau} from '../lib3/kitDiaCau';
import {Cut, Hat, at, wAt, TAN_V, paintSpaceBase, paintNebula, paintStarsNear, paintPlanetRing, paintPlanetRock, paintMoonPaper, paintBattleworldBall, paintChunk, paintTau, paintTia,
  paintGalactusNguc, paintGalactusMat, paintGalactusTay, paintGalactusMat2, paintMang, paintMangHit, SPACE_PAL} from '../lib3/kitVuTru';

/** SPACE IN CUT PAPER (`VuTru`), shared by chapters 11, 12, 13 of the Doom episode. World in metres; the lens looks along -z from VT_EYE = [0, 0, 10]; people (children) float at z 0, a frame at that
 *  distance is 8.9 m wide and 5.0 m tall. Layers, far to near, each a flat picture at a real distance so any slide of the camera parallaxes them:
 *    stars + banded indigo (d 520) / nebula bank, far (d 400) / nebula bank, near (d 300) / near bright stars (d 220) / planets and moons (d 40-90) / the Earth (DiaCau, d 12) / the main player of the state
 *    (Galactus d 26, Battleworld ball d 40) / rock chunks tumbling at d 4-70 (a few at the frame edges, very near) / sharp specks in front.
 *  STATES (`state`):
 *    nen         plain space, a small Earth low left (chapter 13 scenes 4, 5, 7)
 *    tau         the big Earth arc low left, the silver ship mid frame, `tia` = the cosmic ray storm 0..1 (chapter 11 scene 3; `tauNho` = the small white-grey rocket of chapter 12 scene 10)
 *    sao         chapter 12 scenes 3, 4: the ringed planet right, two moons, a red cratered planet left; `doi` 0..1 = the red planet drifting left across 18 % of the frame
 *    galactus    chapter 12 scenes 6-8: Galactus (`gal` 'nguc' = chest up, 'tay' = the huge hand, 'mat' = the face close), the Earth low left (>= 25 % of the frame); `matSang` 0..1 lights his eyes
 *    trai-dat    the Earth in the middle, 58 % of the frame height (scenes 9, 32)
 *    ria         the Earth's arc along the bottom, 40 % of the frame (scenes 10, 11, 29, 30, 31); `vo` 0..1 draws the faint shell 25 % from the top
 *    battleworld the patchwork ball right of centre, 58 % of the height (chapter 13 scene 8)
 *  Brightness: the sky is a bright indigo (the Earth's sunlit face and the nebula carry the frame to Y 95 and over). */
type V3 = [number, number, number];
export type VuTruState = 'nen' | 'tau' | 'sao' | 'galactus' | 'trai-dat' | 'ria' | 'battleworld';
export const VT_EYE: V3 = [0, 0, 10];
/** where to float people (world); the frame at z 0 spans x -4.4..4.4, y -2.5..2.5 */
export const VT_MARKS = {giua: [0, 0, 0] as V3, trai: [-2.3, 0, 0] as V3, phai: [2.3, 0, 0] as V3, phaiXa: [3.2, -0.3, 0] as V3, traiXa: [-3.2, -0.3, 0] as V3, goc: [3.4, -1.4, 0] as V3};
export const VT_VIEWS = {chuan: VT_EYE, gan: [0, 0, 8.2] as V3};
export const VT_STATES: VuTruState[] = ['nen', 'tau', 'sao', 'galactus', 'trai-dat', 'ria', 'battleworld'];
/** where each Earth sits: u, v = its centre on the frame (0..1 from left-top), r = radius in frame heights, d = distance */
const EARTH: Record<string, {u: number; v: number; r: number; d: number; lon: number; lat: number}> = {
  nen: {u: 0.1, v: 0.86, r: 0.2, d: 14, lon: 10, lat: 30},
  tau: {u: 0.05, v: 1.02, r: 0.62, d: 12, lon: 20, lat: 25},
  galactus: {u: 0.09, v: 1.0, r: 0.5, d: 12, lon: -20, lat: 25},
  'trai-dat': {u: 0.5, v: 0.5, r: 0.29, d: 12, lon: -40, lat: 25},
  ria: {u: 0.5, v: 1.5, r: 0.9, d: 12, lon: 12, lat: 38},
};

const chunkList = (n: number, seed: number) => { const r = rnd(seed); return Array.from({length: n}, (_, i) => {
  const near = i < 3, d = near ? 3.6 + r() * 1.6 : 14 + r() * 56, side = r() < 0.5 ? -1 : 1, u = near ? 0.5 + side * (0.44 + r() * 0.1) : r() < 0.7 ? 0.5 + side * (0.18 + r() * 0.34) : r(), v = near ? 0.1 + r() * 0.8 : 0.08 + r() * 0.84;
  return {d, u, v, w: near ? 0.5 + r() * 0.7 : 0.7 + r() * (d * 0.09), rot: r() * 6.28, sp: (r() - 0.5) * 0.012, seed: 3 + i * 7, near, tone: i % 3}; }); };
const TONES: [string, string, string][] = [['#b2aed0', '#8c88b0', '#68648e'], ['#c7b3a2', '#a28d82', '#7c6a66'], ['#9ab0d4', '#788fb6', '#586e96']];

export const VuTru: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; state?: VuTruState; gal?: 'nguc' | 'tay' | 'mat'; matSang?: number; tia?: number; tauNho?: boolean; doi?: number; vo?: number; mangTrung?: {goc: number; rim?: number; loe?: number; nut?: number}; thienThach?: number; bui?: number; galDx?: number; galDy?: number; galRot?: number; galSc?: number}> =
  ({children, f = 0, dx, dz, eye = VT_EYE, state = 'nen', gal = 'nguc', matSang = 0, tia = 0, tauNho = false, doi = 0, vo = 0, mangTrung, thienThach, bui = 1, galDx = 0, galDy = 0, galRot = 0, galSc = 1}) => { datNoiBui('vu-tru');
    const E = EARTH[state], nCh = thienThach ?? (state === 'nen' ? 7 : state === 'galactus' ? 4 : 8);
    const fr = (d: number) => TAN_V * d;   // frame height at d
    const chunks = chunkList(nCh, state.length * 11 + 5);
    return (
      <Scene3 grade="nightExterior" gain={1.5} reach={10}>
        <StageCam eye={eye} haze="#3f4fa6" fog={[600, 900]} dx={dx} dz={dz} />
        <Plate from={eye} id="vt-base" d={520} paint={paintSpaceBase(4)} fog={false} />
        <Plate from={eye} id="vt-neb-far" d={400} fog={false} paint={paintNebula(8, [[-200, 760, 900, 300, 190, 0], [700, 140, 1850, 440, 210, 1], [-250, 160, 600, -60, 140, 2]])} />
        <Plate from={eye} id="vt-neb-near" d={300} fog={false} paint={paintNebula(9, [[300, 980, 1500, 640, 150, 3], [1000, 460, 1900, 100, 120, 0], [-300, 420, 400, 280, 100, 1]])} />
        <Plate from={eye} id="vt-stars-near" d={220} fog={false} paint={paintStarsNear(6, 46)} />
        {/* the main player of the state */}
        {state === 'sao' ? <>
          <Cut id="vt-ring" pos={at(eye, 70, 0.7, 0.4)} w={wAt(70, 0.5)} h={wAt(70, 0.5)} paint={paintPlanetRing} px={1400} />
          <Cut id="vt-moon-a" pos={at(eye, 46, 0.2, 0.16)} w={wAt(46, 0.1)} h={wAt(46, 0.1)} paint={(c, W, H) => paintMoonPaper(c, W, H)} px={256} />
          <Cut id="vt-moon-b" pos={at(eye, 58, 0.42, 0.1)} w={wAt(58, 0.05)} h={wAt(58, 0.05)} paint={(c, W, H) => paintMoonPaper(c, W, H, '#cfd8ea', '#a9b4cc')} px={256} />
          <Cut id="vt-red" pos={at(eye, 40, 0.24 - 0.18 * doi, 0.62)} w={wAt(40, 0.22)} h={wAt(40, 0.22)} paint={paintPlanetRock} px={1024} />
        </> : null}
        {state === 'galactus' ? <>
          {gal === 'nguc' ? <>
            <Cut id="vt-gal-nguc" pos={[eye[0] + 0.4 + galDx, eye[1] + 0.9 + galDy, eye[2] - 28]} w={16.6 * galSc} h={20.75 * galSc} rot={galRot} px={1600} paint={paintGalactusNguc} />
            <Cut id="vt-gal-eyes-n" pos={[eye[0] + 0.4 + galDx, eye[1] + 0.9 + galDy, eye[2] - 27.9]} w={16.6 * galSc} h={20.75 * galSc} rot={galRot} px={1600} opacity={matSang} paint={paintGalactusMat2(800, 900, 1.3)} />
          </> : null}
          {gal === 'mat' ? <>
            <Cut id="vt-gal-mat" pos={[eye[0] + 2.3 + galDx, eye[1] + 3.65 + galDy, eye[2] - 22]} w={24 * galSc} h={24 * galSc} rot={galRot} px={1600} paint={paintGalactusMat} />
            <Cut id="vt-gal-eyes-m" pos={[eye[0] + 2.3 + galDx, eye[1] + 3.65 + galDy, eye[2] - 21.9]} w={24 * galSc} h={24 * galSc} rot={galRot} px={1600} opacity={matSang} paint={paintGalactusMat2(800, 880, 2.0)} />
          </> : null}
          {gal === 'tay' ? <Cut id="vt-gal-tay" pos={[eye[0] + 1.2 + galDx, eye[1] + 0.2 + galDy, eye[2] - 22]} w={19 * galSc} h={19 * galSc} rot={galRot} px={1600} paint={paintGalactusTay} /> : null}
        </> : null}
        {state === 'battleworld' ? <Cut id="vt-bw-ball" pos={at(eye, 40, 0.6, 0.5)} w={16} h={16} px={1600} paint={paintBattleworldBall} /> : null}
        {state === 'tau' ? <>
          <Cut id="vt-tau" pos={at(eye, 14, 0.56, 0.4)} w={wAt(14, 0.46)} h={wAt(14, 0.46) * 0.5} px={1400} rot={0.14} paint={paintTau(false)} order={3} />
        </> : null}
        {tauNho ? <Cut id="vt-tau-nho" pos={at(eye, 14, 0.3, 0.6)} w={wAt(14, 0.12)} h={wAt(14, 0.12) * 0.5} px={512} rot={0.5} paint={paintTau(true)} order={3} /> : null}
        {tia > 0 || state === 'tau' ? <Plate from={eye} id="vt-tia" d={9} fog={false} order={3} paint={paintTia(12, 36)} /> : null}
        {/* the Earth */}
        {E ? <DiaCau lon={E.lon} lat={E.lat} f={f} r={E.r * fr(E.d)} pos={at(eye, E.d, E.u, E.v)} /> : null}
        {E && vo > 0 ? (() => { const Rw = E.r * fr(E.d) * 1.07, sz = (Rw / 0.4) * 2 / 2, ctr = at(eye, E.d, E.u, E.v), nutQ = mangTrung ? Math.round((mangTrung.nut ?? 0) * 10) / 10 : 0, loeQ = mangTrung ? Math.round((mangTrung.loe ?? 0) * 4) / 4 : 0;
          return <>
            <Cut id="vt-mang" pos={[ctr[0], ctr[1], ctr[2] + 0.02]} w={sz} h={sz} px={1400} opacity={vo} order={3} paint={paintMang} />
            {mangTrung && (nutQ > 0 || loeQ > 0) ? <Cut id={`vt-mang-hit-${mangTrung.goc}-${mangTrung.rim ?? 0.9}-${nutQ}-${loeQ}`} pos={[ctr[0], ctr[1], ctr[2] + 0.03]} w={sz} h={sz} px={1400} order={4} paint={paintMangHit(mangTrung.goc, mangTrung.rim ?? 0.9, nutQ, loeQ)} /> : null}
          </>; })() : null}
        {/* rock chunks */}
        {chunks.map((k, i) => <Cut key={i} id={`vt-chunk-${k.seed}`} pos={at(eye, k.d, k.u, k.v)} w={k.w} h={k.w * 0.85} px={256} rot={k.rot + f * k.sp} order={k.near ? 4 : 0} paint={paintChunk(k.seed, TONES[k.tone])} />)}
        {/* sharp specks: stars passing, dust of the nebula */}
        {bui > 0 ? <>
          <Hat f={f} box={[-4.5, 4.5, -2.6, 2.6, 1.5, 4]} n={Math.round(34 * bui)} colors={['#ffffff', '#cfe0ff', '#ffe9c2']} size={0.07} wind={[0.16, 0.02]} kind="sao" twinkle seed={2} />
          <Hat f={f} box={[-4.5, 4.5, -2.6, 2.6, -2, 2]} n={Math.round(26 * bui)} colors={['#bcd0ff', '#e6c8ff']} size={0.035} wind={[0.3, -0.02]} kind="kim" seed={5} />
          <Hat f={f} box={[-5, 5, -2.8, 2.8, -6, -1]} n={Math.round(10 * bui)} color="#9a96c4" size={0.12} wind={[0.12, 0.03]} kind="manh" spin={0.01} seed={8} />
        </> : null}
        {children}
      </Scene3>
    );
  };

// ---------------------------------------------------------------- stills (no people); one per state and per view
type Props = React.ComponentProps<typeof VuTru>;
const mk = (p: Props, yaw = 0): React.FC => () => {
  const {width, height} = useVideoConfig();
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat gl={{antialias: true}}><XoayCtx.Provider value={yaw}><VuTru {...p} /></XoayCtx.Provider></ThreeCanvas></Finish></AbsoluteFill>;
};
const STILLS: [string, Props][] = [
  ['vu-tru-nen', {state: 'nen', f: 12}],
  ['vu-tru-tau', {state: 'tau', f: 12, tia: 1}],
  ['vu-tru-tau-nho', {state: 'ria', tauNho: true, f: 12, vo: 1}],
  ['vu-tru-sao', {state: 'sao', f: 12}],
  ['vu-tru-sao-doi', {state: 'sao', doi: 1, f: 40}],
  ['vu-tru-galactus-nguc', {state: 'galactus', gal: 'nguc', f: 12}],
  ['vu-tru-galactus-nguc-mat-sang', {state: 'galactus', gal: 'nguc', matSang: 1, f: 12}],
  ['vu-tru-galactus-tay', {state: 'galactus', gal: 'tay', f: 12}],
  ['vu-tru-galactus-mat', {state: 'galactus', gal: 'mat', f: 12}],
  ['vu-tru-galactus-mat-sang', {state: 'galactus', gal: 'mat', matSang: 1, f: 12}],
  ['vu-tru-trai-dat', {state: 'trai-dat', f: 12}],
  ['vu-tru-ria', {state: 'ria', f: 12}],
  ['vu-tru-ria-vo', {state: 'ria', vo: 1, f: 12}],
  ['vu-tru-trai-dat-mang', {state: 'trai-dat', vo: 1, f: 12}],
  ['vu-tru-trai-dat-mang-nut', {state: 'trai-dat', vo: 1, mangTrung: {goc: 50, rim: 0.85, loe: 1, nut: 0.6}, f: 12}],
  ['vu-tru-ria-mang-nut', {state: 'ria', vo: 1, mangTrung: {goc: 90, rim: 0.95, loe: 1, nut: 0.7}, f: 12}],
  ['vu-tru-battleworld', {state: 'battleworld', f: 12}],
];
const COMPS = STILLS.map(([id, p]) => [id, mk(p)] as const);
export const VuTruComps: React.FC = () => <>{COMPS.map(([id, C]) => <Composition key={id} id={id} component={C} width={1280} height={720} fps={24} durationInFrames={48} />)}</>;
