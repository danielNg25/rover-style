import React from 'react';
import {Composition} from 'remotion';
import * as THREE from 'three';
import {GradeCtx} from '../lib3/look';
import {StageCam, B} from '../lib3/kit';
import {HoledWall, tex, Spot, DriftSpecks} from '../lib3/kitLab';
import {Sun} from '../lib3/room';
import {Shot, frameOn} from '../lib3/shot';
import {stoneTex, paintStone, Timber} from '../lib3/kitForge';
import {HALL, HallBanner, WallTorch, LightShaft} from '../lib3/kitSanhNgai';
import {FloorRug} from '../lib3/kitLeuThayLang';
import {CanopyBed, BED, SickbedTable, MullionWindow, paintNightView, paintDayView, ArchDoor, Tapestry, WallShield, IronCandleStand, CarvedChest, HipSword} from '../lib3/kitPhongNgu';
import {Puppet3} from '../mould/Puppet3';
import {headSpan} from '../mould/draw';
import type {Spec} from '../mould/draw';
import {EXPR} from '../mould/expr';

/** THE BARONESS'S BEDCHAMBER IN THE BARON'S CASTLE, AT NIGHT (first built for the Doom episode, chapter d1c4 set B: tap/doom-1/d1c4-danh-sach-canh.md of that channel; also
 *  d1c3 shot 18). Same castle as the throne hall (src/demo/SanhNgai.tsx, state 'nam-tuoc'): HALL_STONE walls, the Baron's red
 *  and gold. World = room metres, NOT turned: the lens stands outside the open front (z 0) and looks straight in (-z).
 *    room: x -4.5..4.5, back wall z -7 (0.45 thick), beams at 4.9 (never in frame).
 *    back wall, left to right: the two-light arched window (x -4.0..-2.8, sill 1.3, top 3.3; the night, the mountains and the
 *      camp's fires outside); a small red banner (x -2.12); the bed against the wall; the tapestry with the great gold diamond
 *      (x 0.62..2.0, 0.92..2.92); the oak door in a round arch (x 2.45..3.55, 2.3 high) with the Baron's shield over it.
 *    the bed: x -1.42..0.22, head at the wall (z -6.9), foot at z -4.8; covers sloping from 0.66 at the foot to 0.9 at the
 *      sleeper's chin (z -6.42); four turned posts 2.6 high, a velvet valance, a crest; the bed lamp left of the pillows.
 *    left of the bed: the bedside table (-2.0, -6.3) with a tall candle, a basin, three bottles, a goblet.
 *    floor: dark flags; an old red-brown rug before the bed (-0.5, -3.5); a carved chest at the bed's foot; a tall iron candle
 *      stand at the left edge of the wide (-3.6, -2.4). Side walls (out of every frame): torches at x ±4.4, z -3.5; a chest, a cabinet.
 *    beyond the door: a stone corridor (z -7.45..-9.3) with a torch at x 4.1 on its far wall.
 *  Light: a cool dim fill; the moon through the window from high behind (its window lies on the floor left of the bed, with a
 *  pale beam and dust); the candle and the bed lamp warm, with shadows; the side torches; the corridor's warm light through the
 *  open door. States: 'mo-rem' (curtains drawn back, default), 'kin-rem' (curtains drawn, lit through from inside); cua: 'dong'
 *  (default) or 'mo'. */
export type V3 = [number, number, number];
export type PhongNguState = 'mo-rem' | 'kin-rem';
export const PN = {hw: 4.5, back: -7, wallT: 0.45, h: 5, win: {x: -3.4, w: 1.2, sill: 1.3, h: 2.0}, door: {x0: 2.45, x1: 3.55, h: 2.3}, corridor: {x0: 1.2, x1: 4.8, z: -9.3, h: 3.0}, table: [-2.0, 0, -6.3] as V3};
const W = PN.win, D = PN.door, HW = PN.hw, BACK = PN.back;
/** where the moon comes from and lands (its window lies on the floor around (-2.6, -4.9)) */
const MOON_FROM: V3 = [-6.6, 11.5, -15.4], MOON_TO: V3 = [-2.6, 0, -4.9];
/** the afternoon sun (by day): low from the left beyond the window, its window lands across the foot of the bed, the covers and the floor */
const SUN_FROM: V3 = [-17.9, 10.8, -16.2], SUN_TO: V3 = [-0.5, 0.6, -5.4];
export type PhongNguGio = 'ngay' | 'dem';

/** Marks (all checked in 'mo-rem'; the door ones with cua 'mo'). Nearest things: see the stage notes
 *  (out/d1c4/ghi-chu-san-khau-phong-ngu.md of that channel). */
export const PN_MARKS = {
  ntChanGiuong: [1.05, 0, -4.4] as V3,    // the Baron, right of the bed's foot; behind his head: the tapestry (wide, shots 3, 9)
  thayLangGiuong: [0.95, 0, -5.9] as V3,  // the healer, right of the head of the bed; behind him: the tapestry
  thayThuocA: [-2.0, 0, -5.4] as V3,      // physician A, before the bedside table; behind his head: the stone between window and bed
  thayThuocB: [1.9, 0, -4.3] as V3,       // physician B (shot 7 only, the Baron is not there); behind his head: the shut door
  linhVao: [2.4, 0, -4.9] as V3,          // the soldier come in (shot 3)
  linhCua1: [2.85, 0, -7.9] as V3, linhCua2: [3.45, 0, -8.6] as V3,   // the two guards in the corridor (shot 9, door open)
};
/** Cameras. toan = shots 1 and 7 (d1c4) the wide from beyond the bed's foot; c2 = the close of the Baroness; c3 = the Baron and the
 *  soldier; c6 = the healer and the Baroness; c8 = the close of the healer; c9 = the Baron with the guards in the corridor;
 *  kin = d1c3 shot 18, straight at the drawn foot curtain. */
export const PN_VIEWS = {
  toan: [-0.2, 1.35, 1.6] as V3,
  c3: [1.5, 1.45, -1.2] as V3,
  c6: [0.3, 1.3, -2.6] as V3,
  c9: [0.95, 1.5, -1.4] as V3,
  kin: [-0.6, 1.3, -0.6] as V3,
};

// ---------------------------------------------------------------- the shell
const holes = () => [
  {x0: HW + W.x - W.w / 2, x1: HW + W.x + W.w / 2, sill: W.sill, spring: W.sill + W.h - W.w / 2},
  {x0: HW + D.x0, x1: HW + D.x1, sill: 0, spring: D.h - (D.x1 - D.x0) / 2},
];
/** the room's stone: the hall's green-grey, lifted for a readable night (chủ kênh 23/11/2026: "các cảnh hơi tối"; skill 1, Độ sáng) */
const PN_STONE = {tones: ['#8c9894', '#85918d', '#949f9b', '#7f8b87', '#9aa5a1', '#a1aca8', '#7b8783', '#8f9a96'], mortar: '#46504c'};
/** the Baron's red and gold a shade lighter than the hall's, so the cloth reads at night (same family as HALL.namTuoc) */
export const PN_LOOK = {...HALL.namTuoc, cloth: '#9a3430', clothDark: '#6e2420', clothLight: '#b84a3e'};
const backTex = () => stoneTex('pn-wall-back3', HW * 2, PN.h, {...PN_STONE, seed: 17, arches: holes(), damp: 0.7, course: [0.26, 0.46], len: [0.45, 1.1],
  soot: [{x: HW + BED.x0 + 0.3, y: 3.0, r: 0.8, k: 0.25}, {x: HW - 2.0, y: 2.0, r: 0.5, k: 0.3}]}, 300);
const sideTex = (k: number) => stoneTex(`pn-wall-side3-${k}`, -BACK, PN.h, {...PN_STONE, seed: 23 + k, damp: 0.7, course: [0.26, 0.46], len: [0.45, 1.1], soot: [{x: 3.5, y: 3.2, r: 0.9, k: 0.4}]}, 220);
const floorTex = () => tex('pn-floor3', 4000, Math.round(4000 * -BACK / (HW * 2)), paintStone(HW * 2, -BACK, {seed: 29, tones: ['#8c9089', '#848880', '#92958d', '#7c8079', '#999c93', '#787c75', '#888b83'], mortar: '#40444a', course: [0.6, 0.9], len: [0.6, 1.15], damp: 0, streaks: 0}));
const corrTex = (k: number, w: number, h: number) => stoneTex(`pn-corr3-${k}`, w, h, {...PN_STONE, seed: 41 + k, damp: 0.5, course: [0.26, 0.46], len: [0.45, 1.1], soot: k === 0 ? [{x: 4.1 - PN.corridor.x0, y: 2.6, r: 0.7, k: 0.5}] : []}, 200);
const viewTex = (day: boolean) => day ? tex('pn-day-view', 1800, 1200, paintDayView(9, 6)) : tex('pn-night-view', 1800, 1200, paintNightView(9, 6));

const Shell: React.FC<{day: boolean}> = ({day}) => {
  const C = PN.corridor, cw = C.x1 - C.x0, cd = BACK - PN.wallT - C.z;
  return (
    <group>
      <group position={[-HW, 0, BACK]}><HoledWall w={HW * 2} h={PN.h} t={PN.wallT} map={backTex()} slab="#3a4240" holes={holes().map((h) => ({kind: 'arch' as const, x0: h.x0, x1: h.x1, y0: h.sill, spring: h.spring}))} /></group>
      <group position={[-HW, 0, 0]} rotation={[0, Math.PI / 2, 0]}><HoledWall w={-BACK} h={PN.h} t={0.5} map={sideTex(0)} slab="#3a4240" /></group>
      <group position={[HW, 0, BACK]} rotation={[0, -Math.PI / 2, 0]}><HoledWall w={-BACK} h={PN.h} t={0.5} map={sideTex(1)} slab="#3a4240" /></group>
      <mesh position={[0, 0, BACK / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[HW * 2, -BACK]} /><meshPhongMaterial map={floorTex()} shininess={40} specular="#3a4642" /></mesh>
      <mesh position={[0, PN.h, BACK / 2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[HW * 2, -BACK]} /><meshLambertMaterial color="#121514" /></mesh>
      {[-5.6, -3.2, -0.8].map((z, i) => <Timber key={z} p={[0, PN.h - 0.18, z]} s={[HW * 2, 0.32, 0.3]} seed={i} />)}
      {/* the night outside the window */}
      <mesh position={[-6.0, 3.0, -14]}><planeGeometry args={[9, 6]} /><meshBasicMaterial map={viewTex(day)} fog={false} toneMapped={false} color="#ffffff" /></mesh>
      {/* the corridor beyond the door: flags, three stone walls, a dark vault, a torch on the far wall */}
      <mesh position={[(C.x0 + C.x1) / 2, 0.001, BACK - PN.wallT - cd / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[cw, cd]} /><meshLambertMaterial map={floorTex()} /></mesh>
      <mesh position={[(C.x0 + C.x1) / 2, C.h / 2, C.z]} receiveShadow><planeGeometry args={[cw, C.h]} /><meshLambertMaterial map={corrTex(0, cw, C.h)} /></mesh>
      {[C.x0, C.x1].map((x, i) => <mesh key={x} position={[x, C.h / 2, BACK - PN.wallT - cd / 2]} rotation={[0, i ? -Math.PI / 2 : Math.PI / 2, 0]} receiveShadow><planeGeometry args={[cd, C.h]} /><meshLambertMaterial map={corrTex(1 + i, cd, C.h)} /></mesh>)}
      <mesh position={[(C.x0 + C.x1) / 2, C.h, BACK - PN.wallT - cd / 2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[cw, cd]} /><meshLambertMaterial color="#141716" /></mesh>
    </group>
  );
};

/** The scene. Figures are children (world units). state = 'mo-rem' | 'kin-rem'; cua = 'dong' | 'mo' (the door); f = frame
 *  (flames, dust in the moonbeam); dx / dz = slide and push. lamp = the bed lamp burns (default true). pool = strength of the warm light over the bed
 *  (default 1). cua may also be the
 *  leaf's angle in radians (0 shut … 1.75 wide open) for a door opening during a shot. */
export const PhongNgu: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; state?: PhongNguState; cua?: 'dong' | 'mo' | number; lamp?: boolean; pool?: number; gio?: PhongNguGio}> =
  ({children, f = 0, dx, dz, eye = PN_VIEWS.toan, state = 'mo-rem', cua = 'dong', lamp: lampIn, pool = 1, gio = 'ngay'}) => {
    const day = gio === 'ngay', lamp = lampIn ?? !day, FROM = day ? SUN_FROM : MOON_FROM, TO = day ? SUN_TO : MOON_TO;
    const look = PN_LOOK, ang = typeof cua === 'number' ? cua : cua === 'mo' ? 1.75 : 0, open = ang > 0.3, mDir = new THREE.Vector3(TO[0] - FROM[0], TO[1] - FROM[1], TO[2] - FROM[2]).normalize();
    const beamTop: V3 = [W.x, W.sill + 0.9, BACK - 0.2], beamFoot: V3 = [W.x + mDir.x * (beamTop[1] / -mDir.y), 0.02, beamTop[2] + mDir.z * (beamTop[1] / -mDir.y)];
    return (
      <GradeCtx.Provider value={day ? 'brightInterior' : 'darkInterior'}>
        <StageCam eye={eye} haze="#0a0c10" fog={[30, 900]} dx={dx} dz={dz} />
        {day ? <>
          {/* DAY (main state, d1c4 lượt ba): a bright neutral fill off the pale stone; the afternoon sun through the window lays its
              leaded window across the bed's foot, the covers and the floor; a warm beam with dust; the candle still burns */}
          <hemisphereLight args={['#f6f2ea', '#a08a72', 4.5]} />
          <Sun from={SUN_FROM} to={SUN_TO} intensity={8.5} color="#ffe8c2" />
          <LightShaft top={beamTop} bottom={beamFoot} r={0.6} color="#fff0c8" strength={0.05} f={f} />
          <DriftSpecks f={f} box={[-3.4, -0.6, 0.6, 2.4, -6.8, -4.8]} n={18} color="#fff6d8" size={0.005} wind={[0.05, -0.02]} glow={0.2} seed={7} />
          <pointLight position={[0.6, 1.8, 0.6]} color="#fff0dc" intensity={2.6} distance={14} decay={1.2} />
          <pointLight position={[-0.6, 2.6, -2.6]} color="#ffdcb0" intensity={1.2 * pool} distance={8} decay={1.3} />
        </> : <>
          {/* NIGHT: a cool blue fill (the night is in the colour, not the darkness), the moon through the window, warm lamps */}
          <hemisphereLight args={['#94aade', '#665a54', 3.6]} />
          <Sun from={MOON_FROM} to={MOON_TO} intensity={6.0} color="#b8cbf2" />
          <LightShaft top={beamTop} bottom={beamFoot} r={0.55} color="#c4d4f4" strength={0.025} f={f} />
          <DriftSpecks f={f} box={[-3.9, -2.7, 0.3, 2.8, -6.6, -4.8]} n={14} color="#dbe6ff" size={0.005} wind={[0.04, -0.02]} glow={0.25} seed={7} />
          {/* a warm fill from the front (the torches and candles out of frame behind the lens) */}
          <pointLight position={[0.6, 1.8, 0.6]} color="#ffb47a" intensity={3.4} distance={14} decay={1.2} />
          {/* the warm pool of the bed: candle, lamp and torches lift the back wall and the bed */}
          <pointLight position={[-0.6, 2.6, -2.6]} color="#ffbe86" intensity={2.8 * pool} distance={8} decay={1.3} />
        </>}
        <Shell day={day} />
        {/* the back wall: window, banner, tapestry, door, shield */}
        <group position={[W.x, W.sill, BACK]}><MullionWindow w={W.w} h={W.h} /></group>
        <HallBanner id="pn-banner" pos={[-2.12, 3.32, BACK]} w={0.5} h={0.95} look={look} seed={4} />
        <Tapestry pos={[1.31, 2.95, BACK]} w={1.38} h={2.0} look={look} />
        <group position={[(D.x0 + D.x1) / 2, 0, BACK]}><ArchDoor w={D.x1 - D.x0} h={D.h} open={ang} /></group>
        <WallShield pos={[(D.x0 + D.x1) / 2, 3.3, BACK]} s={0.42} look={look} />
        {/* the bed, the table, the chest at the foot, the rug, the iron candle stand */}
        <CanopyBed look={look} state={state === 'kin-rem' ? 'closed' : 'open'} f={f} lamp={lamp} inner={day ? 0.3 : 1} />
        <SickbedTable pos={PN.table} f={f} />
        <CarvedChest pos={[-0.6, 0, -4.38]} w={1.3} look={look} />
        <FloorRug pos={[-0.5, 0, -3.5]} w={2.6} d={1.7} seed={7} />
        <IronCandleStand pos={[-3.6, 0, -2.4]} f={f} />
        {/* the side walls: torches, a low cabinet on the left, a chest on the right (out of the frames, they light the room) */}
        {day ? null : <><WallTorch pos={[-HW + 0.02, 2.2, -3.5]} rotY={Math.PI / 2} f={f} seed={1} />
        <WallTorch pos={[HW - 0.02, 2.2, -3.5]} rotY={-Math.PI / 2} f={f} seed={2} /></>}
        <CarvedChest pos={[-HW + 0.3, 0, -5.2]} rotY={Math.PI / 2} w={1.1} h={0.8} cushion={false} look={look} />
        <CarvedChest pos={[HW - 0.3, 0, -5.2]} rotY={-Math.PI / 2} w={1.2} look={look} />
        {/* the corridor: a torch on its far wall, its warm light; with the door open it spills into the room across the floor */}
        {day ? <>
          {/* by day the corridor is lit by a small high window on its far wall (above the guards' heads in shot 9) */}
          <mesh position={[3.75, 2.55, PN.corridor.z + 0.01]}><planeGeometry args={[0.6, 0.7]} /><meshBasicMaterial color="#dfeaf6" toneMapped={false} /></mesh>
          <B p={[3.75, 2.55, PN.corridor.z + 0.02]} s={[0.05, 0.7, 0.03]} c="#5a5e5c" />
          <pointLight position={[3.6, 2.4, -8.9]} color="#f4f0e6" intensity={open ? 5 : 0.6} distance={7} decay={1.4} />
          {open ? <Spot from={[2.85, 2.3, -8.9]} to={[2.3, 0, -4.6]} color="#fff2dc" intensity={70} angle={0.42} penumbra={0.5} distance={9} /> : null}
        </> : <>
          <WallTorch pos={[4.1, 1.95, PN.corridor.z]} f={f} seed={3} />
          <pointLight position={[2.9, 2.2, -8.4]} color="#ffa860" intensity={open ? 4.6 : 0.4} distance={6} decay={1.5} />
          {open ? <Spot from={[2.85, 2.3, -8.9]} to={[2.3, 0, -4.6]} color="#ffb070" intensity={95} angle={0.42} penumbra={0.5} distance={9} /> : null}
        </>}
        {children}
      </GradeCtx.Provider>
    );
  };

export const still = (eye: V3, figures: React.ReactNode, o: {soft?: number; state?: PhongNguState; cua?: 'dong' | 'mo'; pool?: number; gio?: PhongNguGio} = {}): React.FC => () =>
  <Shot grade={o.gio === 'dem' ? 'darkInterior' : 'brightInterior'} eye={eye} soft={o.soft} finish={{warm: ''}} set={(inside, cam) => <PhongNgu eye={eye} dx={cam.dx} dz={cam.dz} state={o.state} cua={o.cua} pool={o.pool} gio={o.gio}>{inside}</PhongNgu>} figures={figures} />;
/** the room alone (kho chung, 23/11/2026): the wide by day and by night, no people; plus the drawn curtain */
const STILLS: [string, React.FC][] = [
  ['phong-ngu-kin-rem', still(PN_VIEWS.kin, null, {state: 'kin-rem'})],
  ['phong-ngu-dem-kin-rem', still(PN_VIEWS.kin, null, {state: 'kin-rem', gio: 'dem'})],
  ['phong-ngu-trong', still(PN_VIEWS.toan, null)],
  ['phong-ngu-dem-trong', still(PN_VIEWS.toan, null, {gio: 'dem'})],
];
export const PhongNguComps: React.FC = () => <>{STILLS.map(([id, C]) => <Composition key={id} id={id} component={C} width={1280} height={720} fps={24} durationInFrames={1} />)}</>;
