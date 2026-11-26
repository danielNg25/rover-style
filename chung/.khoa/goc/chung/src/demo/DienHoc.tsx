import React from 'react';
import {AbsoluteFill, Composition, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {GradeCtx, Finish} from '../lib3/look';
import {B, StageCam} from '../lib3/kit';
import {HoledWall, tex, DriftSpecks} from '../lib3/kitLab';
import {Sun} from '../lib3/room';
import {XoayCtx} from '../lib3/duongMay';
import {SetGlow, Thangka, ButterLamps} from '../lib3/kitForge';
import {Embers} from '../lib3/fx';
import {paintPlaster, paintPlanks, Column, Beam, GiaKinh, DayPeaks, DienCuaSo, VetNang, CuonTranh, GiayDa, GIAY, giayBut, LoThan, ChenNung, Khuon, DongSat, chenTai, BanKinh, Dem, Nem} from '../lib3/kitDienHoc';
import type {GiayKind} from '../lib3/kitDienHoc';
import {TamChan, DenLongCam} from '../lib3/kitTayTang';

/** THE LORE HALL OF THE MONASTERY (điện học), by day. First built for d1c9 (Tibet), scenes 4-10. World units = room units (metres), the room is NOT turned:
 *  the camera looks straight at the back wall through the open front; a shot that wants a diagonal view turns the whole room with XoayCtx (the camera slides with dx / dz).
 *    room: x 0..10 (left to right), z 0..8 (back wall at z 0, open front at z 8), y 0..4.6. Whitewashed walls with an ochre dado, a maroon painted band under the ceiling on the back
 *      wall, dark-red plank floor with a woven runner down the middle, plank ceiling with painted beams, two red lacquered columns (x 3.9, 6.1) at z 1.2.
 *    back wall (z 0, from the left): window A (x 0.45-1.45, sill 1.2, head 3.4); parchment 1 (x 2.6, centre y 2.2, 1.55 x 2.3); the HANGING SCROLL (x 5.0, top y 3.4, 1.1 wide, up to 2.1
 *      long) over a ledge with three butter lamps (x 5.0, y 0.95); parchment 2 (x 7.4); window B (x 8.55-9.55). Outside: snow peaks, sky, prayer flags. Sun comes in through the windows
 *      from the upper left behind and falls on the floor in two patches with dusty shafts.
 *    left wall (x 0): the scripture shelf (z 0.35-2.05), thangka beside it. right: a brazier on three legs (x 9.0, z 2.2), a mould on a stone block (x 7.55, z 2.2), a crucible that can be tipped
 *      to pour (nung), a scripture table (x 8.7, z 4.4) with two cushions; a mattress (nem) lies at x 3.2, z 4.6 for scene 5.
 *  STATES: only the day 'ngay' is needed by the list; the rest is props: cuon (the scroll unrolling 0..1), vong (its four rings lighting 0..1), giay1 / giay2 (each parchment: kind, p drawn, sang),
 *  nung (the crucible, 0..1), lo (brazier glow), nem / chan (mattress, blanket), den (butter lamps lit), bui (dust 0..1). The pen's point on a parchment: `giayBut` + DH_GIAY.
 *  The room never imports a channel's cast: people come in through `children` (world units, standing at DH_MARKS). */
type V3 = [number, number, number];
export const DH_W = 10, DH_L = 8, DH_H = 4.6;
export type DienHocState = 'ngay';
/** parchment centres (the sheet's middle; its face is at z 0.06) and the other fixed places */
export const DH_GIAY: Record<'g1' | 'g2', V3> = {g1: [2.6, 2.2, 0.06], g2: [7.4, 2.2, 0.06]};
export const DH_CUON: V3 = [5.0, 3.4, 0.05];
export const DH_LO = {than: [9.0, 0, 2.2] as V3, khuon: [7.55, 0, 2.2] as V3, mieng: [9.0, 0.78, 2.2] as V3, rot: [7.83, 1.0, 2.2] as V3, rotDen: [7.55, 0.56, 2.2] as V3};
/** where to stand (world, feet on the floor). Victor on the left, the monks on the right, the scroll in the middle of the back wall (list d1c9, scenes 4-10). Clearance between two people at least 0.45 m. */
export const DH_MARKS = {
  victor: [2.6, 0, 3.2] as V3,        // 4, 6, 7, 8: in front of parchment 1
  truTri: [7.3, 0, 3.1] as V3,        // the abbot, right (4, 6, 7, 9 left of the smith)
  thoRen: [8.4, 0, 3.0] as V3,        // the smith, right of the abbot, near the brazier and the mould (4: tilts the crucible)
  suTre: [9.1, 0, 3.7] as V3,         // the young monk, far right
  victorNam: [3.2, 0, 4.6] as V3,     // 5: the middle of the mattress (the head at its left end, x 2.4)
  suTreNgoi: [4.9, 0, 4.7] as V3,     // 5: beside the mattress, right
  victorGiay: [3.75, 0, 2.5] as V3,   // 9, 10: right of parchment 1 (x 1.83-3.38), 0.45 m clear of it
  thoRenGiay: [5.3, 0, 2.8] as V3,    // 9: the smith right of Victor
  victor10: [6.0, 0, 2.0] as V3,      // 10: left of parchment 2 (x 6.63-8.18): face and drawing side by side
  quy: [[6.1, 0, 3.4], [7.4, 0, 3.0], [8.7, 0, 3.3]] as V3[],   // 8: the three monks kneeling in a row to the right of Victor (victor at x 2.9)
};
/** camera positions (eye). toan = the whole room; trung = scene 4 (the middle figure is 42 % of the frame); thap = scene 5; day = scene 6; hai = scene 7 (both parchments); gan = scenes 8-9; can = scene 10;
 *  lo = the pour. */
export const DH_VIEWS = {
  toan: [5.0, 1.55, 12.8] as V3,
  trung: [5.0, 1.5, 11.2] as V3,
  thap: [3.7, 1.0, 9.6] as V3,
  day: [4.6, 1.35, 8.6] as V3,
  hai: [5.0, 1.45, 9.8] as V3,
  gan: [4.1, 1.45, 9.0] as V3,
  can: [6.65, 1.75, 6.0] as V3,
  lo: [8.2, 1.25, 6.6] as V3,
};
const SUN_FROM: V3 = [-4, 9, -8], SUN_TO: V3 = [3, 0, 4];
const SUN_DIR: V3 = (() => { const d = [SUN_TO[0] - SUN_FROM[0], SUN_TO[1] - SUN_FROM[1], SUN_TO[2] - SUN_FROM[2]], l = Math.hypot(d[0], d[1], d[2]); return [d[0] / l, d[1] / l, d[2] / l]; })();
const WIN_A = {x0: 0.45, x1: 1.45, sill: 1.2, head: 3.4}, WIN_B = {x0: 8.55, x1: 9.55, sill: 1.2, head: 3.4};

const backTex = () => tex('dh-wall-back', 2000, 920, paintPlaster(10, 4.6, 3, true));
const sideTex = (k: number) => tex(`dh-wall-side-${k}`, 1600, 920, paintPlaster(8, 4.6, 8 + k, false));
const floorTex = () => tex('dh-floor', 2000, 1600, paintPlanks(10, 8, 6));
const ceilTex = () => tex('dh-ceiling', 512, 512, (c, W, H) => { c.fillStyle = '#6a4a30'; c.fillRect(0, 0, W, H); for (let x = 0; x < W; x += 32) { c.fillStyle = x % 64 ? '#74512f' : '#5e4129'; c.fillRect(x, 0, 30, H); } });

const Shell: React.FC<{cuon?: number}> = () => (
  <group>
    <HoledWall w={DH_W} h={DH_H} t={0.6} map={backTex()} slab="#9a8c78" holes={[{kind: 'rect', x0: WIN_A.x0, x1: WIN_A.x1, y0: WIN_A.sill, y1: WIN_A.head}, {kind: 'rect', x0: WIN_B.x0, x1: WIN_B.x1, y0: WIN_B.sill, y1: WIN_B.head}]} />
    <DienCuaSo {...WIN_A} /><DienCuaSo {...WIN_B} />
    <SetGlow amount={0.45} tint="#e8dcc4"><group position={[0, 0, DH_L]} rotation={[0, Math.PI / 2, 0]}><HoledWall w={DH_L} h={DH_H} t={0.6} map={sideTex(0)} slab="#9a8c78" /></group></SetGlow>
    <SetGlow amount={0.45} tint="#e8dcc4"><group position={[DH_W, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><HoledWall w={DH_L} h={DH_H} t={0.6} map={sideTex(1)} slab="#9a8c78" /></group></SetGlow>
    <SetGlow amount={0.3} tint="#e4d4bc"><mesh position={[DH_W / 2, 0, DH_L / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[DH_W, DH_L]} /><meshLambertMaterial map={floorTex()} /></mesh></SetGlow>
    <B p={[DH_W / 2, DH_H + 0.06, DH_L / 2]} s={[DH_W + 1.2, 0.12, DH_L + 0.6]} c="#6a4a30" />
    <mesh position={[DH_W / 2, DH_H - 0.001, DH_L / 2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[DH_W, DH_L]} /><meshLambertMaterial map={ceilTex()} /></mesh>
    {[1.2, 4.2, 7.2].map((z) => <Beam key={z} p={[DH_W / 2, DH_H - 0.45, z]} len={DH_W} ends={z < 2} />)}
    {[3.9, 6.1].map((x, i) => <Column key={x} pos={[x, 0, 1.2]} h={DH_H - 0.65} seed={i + 1} />)}
    {/* ledge under the hanging scroll */}
    <B p={[5.0, 0.86, 0.2]} s={[1.5, 0.08, 0.4]} c="#8a2f28" /><B p={[5.0, 0.4, 0.15]} s={[1.3, 0.8, 0.3]} c="#4a2e1e" /><B p={[5.0, 0.8, 0.401]} s={[1.5, 0.03, 0.01]} c="#d6a742" cast={false} />
    <GiaKinh pos={[0.0, 0, 2.05]} rotY={Math.PI / 2} />
    <Thangka pos={[0.01, 2.25, 4.9]} w={0.7} h={1.1} />
  </group>
);

/** the room. children = people (world units). */
export const DienHoc: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; state?: DienHocState;
  cuon?: number; vong?: number; giay1?: {kind?: GiayKind; p?: number; sang?: number}; giay2?: {kind?: GiayKind; p?: number; sang?: number}; nung?: number; lo?: number; nem?: boolean; chan?: boolean; den?: boolean; bui?: number; lampe?: boolean}> =
  ({children, f = 0, dx, dz, eye = DH_VIEWS.toan, cuon = 1, vong = 0, giay1, giay2, nung = 0, lo = 0.85, nem = false, chan = false, den = true, bui = 1}) => {
    const pour = Math.max(0, (nung - 0.5) / 0.5), cr = chenTai([9.0, 0.78, 2.2], DH_LO.rot, nung), fill = Math.max(0, Math.min(1, (nung - 0.62) / 0.38));
    return (
      <GradeCtx.Provider value="brightInterior">
        <StageCam eye={eye} haze="#cfd2de" fog={[60, 900]} dx={dx} dz={dz} />
        {/* LIGHT. A warm sky fill, ONE sun through the back windows (it casts the window panes on the floor), short-reach lights that touch only the high walls and the front floor,
            and SetGlow on the shell so the room reads bright without lighting the people more. */}
        <hemisphereLight args={['#fff1dc', '#b8946a', 1.55]} />
        <Sun from={SUN_FROM} to={SUN_TO} intensity={3.4} color="#ffe4b0" />
        {[2.5, 7.0].map((x) => <pointLight key={x} position={[x, 0.9, 7.4]} color="#ffe6c4" intensity={9} distance={3.4} decay={1} />)}
        <DayPeaks x={5.0} f={f} />
        <Shell />
        {/* things on the back wall */}
        <GiayDa pos={DH_GIAY.g1} {...(giay1 ?? {})} f={f} /><GiayDa pos={DH_GIAY.g2} {...(giay2 ?? {})} f={f} />
        <CuonTranh pos={DH_CUON} mo={cuon} vong={vong} f={f} />
        <ButterLamps pos={[5.0, 0.9, 0.0]} f={f} lit={den} />
        {/* the hot corner */}
        <LoThan pos={DH_LO.than} f={f} glow={lo} />
        <Khuon pos={DH_LO.khuon} fill={fill} f={f} />
        <ChenNung pos={cr.pos} tilt={cr.tilt} heat={lo} f={f} />
        {pour > 0 ? <DongSat from={[cr.pos[0] - 0.11 * Math.cos(cr.tilt) - 0.3 * Math.sin(cr.tilt), cr.pos[1] - 0.11 * Math.sin(cr.tilt) + 0.3 * Math.cos(cr.tilt), cr.pos[2]]} to={DH_LO.rotDen} k={Math.min(1, pour * 1.4)} f={f} /> : null}
        {/* furniture */}
        <BanKinh pos={[8.7, 0, 4.5]} rotY={-0.2} />
        <Dem pos={[7.4, 0, 4.9]} col={0} rotY={0.2} /><Dem pos={[9.3, 0, 5.2]} col={1} rotY={-0.3} w={0.6} />
        {nem ? <Nem pos={[3.2, 0, 4.6]} /> : null}
        {nem && chan ? <TamChan pos={[3.45, 0.12, 4.6]} w={1.25} d={0.68} lift={0.11} /> : null}
        {/* dust in the two shafts of sun, warm sparks round the lamps */}
        <VetNang x0={WIN_A.x0} x1={WIN_A.x1} y0={WIN_A.sill} y1={WIN_A.head} dir={SUN_DIR} opacity={0.1 * bui} />
        <VetNang x0={WIN_B.x0} x1={WIN_B.x1} y0={WIN_B.sill} y1={WIN_B.head} dir={SUN_DIR} opacity={0.08 * bui} />
        {bui > 0 ? <>
          <DriftSpecks f={f} box={[0.6, 3.4, 0.3, 3.4, 0.2, 4.2]} n={Math.round(46 * bui)} color="#fff0c4" size={0.0065} wind={[0.03, 0.02]} glow={0.35} seed={4} />
          <DriftSpecks f={f} box={[8.4, 10.0, 0.3, 3.4, 0.2, 3.4]} n={Math.round(20 * bui)} color="#fff0c4" size={0.0065} wind={[-0.02, 0.02]} glow={0.35} seed={6} />
          {den ? <Embers f={f} box={[4.6, 5.4, 1.1, 1.9, 0.1, 0.5]} n={6} size={0.01} life={60} seed={9} color="#ffd27a" /> : null}
        </> : null}
        {children}
      </GradeCtx.Provider>
    );
  };
export {giayBut, GIAY, DenLongCam};

// ---------------------------------------------------------------- stills (no people); each opens a state or a view of the room
type Props = React.ComponentProps<typeof DienHoc>;
const mk = (p: Props, yaw = 0): React.FC => () => {
  const {width, height} = useVideoConfig();
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><XoayCtx.Provider value={yaw}><DienHoc {...p} /></XoayCtx.Provider></ThreeCanvas></Finish></AbsoluteFill>;
};
const S = {
  toan: mk({eye: DH_VIEWS.toan, nem: true}),
  trung: mk({eye: DH_VIEWS.trung, cuon: 0.0}),
  cuonMo: mk({eye: DH_VIEWS.trung, cuon: 0.5, f: 8}),
  cuonSang: mk({eye: DH_VIEWS.trung, cuon: 1, vong: 1, f: 20}),
  loRot: mk({eye: DH_VIEWS.lo, nung: 1, f: 12, cuon: 1}),
  loNghi: mk({eye: DH_VIEWS.trung, nung: 0.3, f: 5}),
  nam: mk({eye: DH_VIEWS.thap, nem: true, chan: true}),
  giayVong: mk({eye: DH_VIEWS.hai, giay1: {kind: 'vong', p: 1, sang: 1}, giay2: {kind: 'vong', p: 0.74}, f: 16}),
  giayGiap: mk({eye: DH_VIEWS.gan, giay1: {kind: 'giap', p: 0.62}}),
  giayMatNa: mk({eye: DH_VIEWS.can, giay2: {kind: 'matna', p: 1}}),
  trong: mk({eye: DH_VIEWS.toan}),
  denLong: mk({eye: DH_VIEWS.day, giay1: {kind: 'trang'}}),
  xoay: mk({eye: [5.8, 1.55, 12.8], nem: true}, 0.07),
};
export const DienHocComps: React.FC = () => (
  <>
    <Composition id="dien-hoc-toan" component={S.toan} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="dien-hoc-trung-cuon-cuon" component={S.trung} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="dien-hoc-cuon-mo-nua" component={S.cuonMo} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="dien-hoc-cuon-vong-sang" component={S.cuonSang} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="dien-hoc-rot-sat" component={S.loRot} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="dien-hoc-chen-nghieng" component={S.loNghi} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="dien-hoc-nem-chan-thap" component={S.nam} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="dien-hoc-giay-hai-vong" component={S.giayVong} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="dien-hoc-giay-ve-giap" component={S.giayGiap} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="dien-hoc-giay-mat-na-can" component={S.giayMatNa} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="dien-hoc-trong" component={S.trong} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="dien-hoc-giay-trang-day" component={S.denLong} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="dien-hoc-xoay-nhe" component={S.xoay} width={1280} height={720} fps={24} durationInFrames={1} />
  </>
);
