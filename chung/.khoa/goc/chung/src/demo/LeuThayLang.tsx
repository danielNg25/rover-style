import React from 'react';
import {AbsoluteFill, Composition, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {GradeCtx, Finish} from '../lib3/look';
import {StageCam, Motes, B} from '../lib3/kit';
import {Shot} from '../lib3/shot';
import {Spot} from '../lib3/kitLab';
import {LightShaft} from '../lib3/kitSanhNgai';
import {ClayPot, Basket, Stool, CynthiaScarf} from '../lib3/kitCamp';
import {LEU, BAN_THUOC, TentInside, TentDoor, FloorRug, StrawPallet, IronChest, HealerTable, HerbLine, HangingLamp, Brazier, WallHanging, Swaddle, SwaddleLook, paintHungThings,
  MotherChest, MotherThings, Cobweb, TippedTable, BrokenGlass, RolledPallet, ScarfHook, CloakPeg, WorkBench, CopperCoil, GearString, GearToy, CoilMachine} from '../lib3/kitLeuThayLang';
import {tex, Sheet, paintPlan} from '../lib3/kitLab';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import type {Spec, ArmPose} from '../mould/draw';

/** THE HEALER'S TENT, INSIDE (d1c2 set B, episodes/d1c2-danh-sach-canh.md). World = tent metres, NOT turned: the lens stands
 *  outside the open front (z 0) and looks straight in (-z).
 *    floor x -3..3, z 0..-5; canvas walls 2.0 high on three sides; roof up to the apex (0, 3.8, -2.5); no centre pole.
 *    back wall: the door x -2.4..-1.4 (1.8 high); a drying line of herbs under the roof (x -1.2..2.8, y 2.24, z -4.55);
 *               an indigo kilim (x -1.25..-0.35) and a plain brown blanket (x 0.45..1.45) hung on it, a bag and a rope coil.
 *    left: the straw pallet with the red blanket (x -2.78..-1.88, z -1.05..-2.95); a basket at its foot.
 *    right: the healer's table (x 0.9..2.3, z -2.6..-3.2, top 0.75), a stool at its right end, the chest at the back (x 1.9..2.8,
 *           z -4.2..-4.7), a kilim on the right wall.
 *    middle: an old rug on the beaten earth (x -1.4..1.6, z -1.0..-3.2).
 *  States: 'sinh' (night; the lamp burns low over the two of them, the brazier glows on the left, the door is shut) and
 *  'chua-benh' (morning; the canvas glows with the day, the door is rolled up, a shaft of sun from it lies across the rug,
 *  the lamp is out and hoisted up, no brazier). */
export type V3 = [number, number, number];
export type LeuState = 'sinh' | 'chua-benh' | 'bo-hoang' | 'xuong';
/** the mother's chest (states bo-hoang and xuong): see MotherChest of kitLeuThayLang */
export type ChestState = {open?: number; seam?: number; cover?: number; candles?: boolean};
/** what stands on the chest in xuong: the gear toy (d1c5 shot 6) or the copper-coil machine (shot 7; on = bulb lit, spin, arc, lever) */
export type MachineState = {kind: 'toy' | 'coil'; on?: number; spin?: number; arc?: number; lever?: number};
/** the chest stands where IronChest stood in the first two states */
export const CHEST_POS: V3 = [2.35, 0, -4.45];
/** vial = false: the green vial is off the table (the healer holds it up in d1c2 shot 12; added by the actor of the tent shots). */
/** Marks (checked in the state named after each). */
export const LEU_MARKS = {
  meBe: [-0.4, 0, -2.0] as V3, chaBe: [0.36, 0, -1.9] as V3,          // shots 2, 3 (sinh)
  chaBan: [1.4, 0, -3.55] as V3,                                        // shot 12 (chua-benh), behind the table
  chaXoaDau: [0.25, 0, -2.2] as V3, beBenh: [-0.25, 0, -2.05] as V3,   // shot 13 (chua-benh)
  meCua: [-1.9, 0, -4.5] as V3,                                         // shot 13: the young mother waiting just inside the door
  conRuong: [1.55, 0, -3.9] as V3,                                      // d1c4 23-24, d1c5 1-7 (bo-hoang, xuong): the boy left of the chest
};
/** Camera positions. toan = the whole tent (also shot 13); c2 = the two of them, knees up; c3 = the close of mother and baby;
 *  c12 = the healer behind his table, medium (frameOn). */
export const LEU_VIEWS = {
  toan: [0, 1.1, 3.0] as V3,
  c2: [0.05, 1.3, 1.0] as V3,
  c3: [-0.32, 1.12, -0.12] as V3,
  /** set by hand: frameOn 'medium' (head 30 %) gives a 2.2 m frame with this mould's big head and puts the lens at table
   *  height. Here: frame 1.5 m high (0.3 .. 1.8), head in the top 45 %, the things on the table in the lower part. */
  c12: [1.08, 1.05, -0.55] as V3,
  /** d1c4 shot 23 (bo-hoang): the boy and the covered chest, from inside the tent */
  r23: [1.5, 1.0, -1.0] as V3,
  /** d1c4 shot 24: low, straight at the front of the chest */
  r24: [2.35, 0.5, -2.7] as V3,
  /** d1c5 shot 1: the boy and the chest as the lid opens */
  r51: [2.0, 0.9, -1.2] as V3,
  /** d1c5 shot 2: the inside of the open lid */
  r52: [2.4, 0.85, -2.9] as V3,
  /** d1c5 shots 6, 7 (xuong): the boy at the chest, the workshop wall above */
  r56: [1.9, 1.1, -0.9] as V3,
  /** d1c5 shots 3 to 5 (bo-hoang by night, candles): the boy reading by the shut chest */
  r53: [1.7, 0.85, -0.6] as V3,
  /** xuong seen whole: the workbench on the left, the lit lamp, the chest with the machine on the right */
  xuongToan: [0.3, 1.3, 2.6] as V3,
};
/** the lamp: hanging in front of the two of them at night (they are lit from the front), hoisted up out of the way by day */
export const LAMP = {x: 0.05, z: -1.55, low: 1.72, high: 2.62, roof: 3.1};

// ---------------------------------------------------------------- hands, for the things held (the swaddle)
const handAt = (s: Spec, sd: 'L' | 'R'): [number, number] => {
  const p: ArmPose = (sd === 'L' ? s.armL : s.armR) ?? {sh: 5}, k = sd === 'L' ? 1 : -1, r = Math.PI / 180;
  let x = 272 + (sd === 'L' ? -148 : 148), y = 634;
  const a1 = k * p.sh * r; x += -90 * Math.sin(a1); y += 90 * Math.cos(a1);
  const a2 = k * (p.sh + (p.el ?? 0)) * r; x += -114 * Math.sin(a2); y += 114 * Math.cos(a2);
  const a = (s.lean ?? 0) * r, X = x - 272, Y = y - 960;
  return [272 + X * Math.cos(a) - Y * Math.sin(a) + (s.hip ?? 0), 960 + X * Math.sin(a) + Y * Math.cos(a) - (s.hipDy ?? 0)];
};
/** where the swaddle goes for a figure (not flipped) standing at pos: centred between the hands, a little above them (it rests
 *  on the forearms), 0.16 m in front of the figure. The actor calls it every frame with the acted spec. */
export const swaddleAt = (s: Spec, pos: V3, height: number, up = 0.1): V3 => {
  const U = height / 1191, l = handAt(s, 'L'), q = handAt(s, 'R'), mx = (l[0] + q[0]) / 2, my = (l[1] + q[1]) / 2;
  return [pos[0] + ((s.x ?? 0) + mx - 272) * U, (1197 - my) * U + up, pos[2] + 0.16];
};

/** a hand of a figure standing at pos, in world metres (sd = the arm of the Spec, 'L' or 'R'; flip = the figure is drawn
 *  mirrored, so that arm lies on the other side). For the green vial of shot 12 (put GlassVial a little below and 0.15 m in
 *  front of it) and to check the healer's reach in shots 2 and 13. */
export const handWorld = (s: Spec, pos: V3, height: number, sd: 'L' | 'R', flip = false): V3 => {
  const U = height / 1191, [mx, my] = handAt(s, sd), dx = ((s.x ?? 0) + mx - 272) * U;
  return [pos[0] + (flip ? -dx : dx), (1197 - my) * U, pos[2]];
};

// ---------------------------------------------------------------- the scene
const hung = tex('leu-hung-things', 360, 320, paintHungThings(3));
export const LeuThayLang: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; state?: LeuState; vial?: boolean; pestle?: boolean; chest?: ChestState; night?: boolean; cloak?: boolean; machine?: MachineState | null}> =
  ({children, f = 0, dx, dz, eye = LEU_VIEWS.toan, state = 'sinh', vial = true, pestle = true, chest, night, cloak, machine}) => {
    if (state === 'bo-hoang' || state === 'xuong') return <LaterTent f={f} dx={dx} dz={dz} eye={eye} state={state} chest={chest} night={night} cloak={cloak} machine={machine}>{children}</LaterTent>;
    const day = state === 'chua-benh', d = LEU.door;
    return (
      <GradeCtx.Provider value={day ? 'brightInterior' : 'darkInterior'}>
        <StageCam eye={eye} haze={day ? '#3a3028' : '#14110e'} fog={[40, 300]} dx={dx} dz={dz} />
        {day ? <>
          {/* morning: the sky light through the open front and the glowing canvas; the low sun through the door behind */}
          <hemisphereLight args={['#fff0d6', '#9a8466', 1.45]} />
          <directionalLight position={[-1.5, 4, 8]} color="#fff4e0" intensity={1.1} />
          <Spot from={[d.x0 - 0.3, 2.75, LEU.back - 4.2]} to={[-0.7, 0, -1.7]} color="#ffe2a6" intensity={620} angle={0.32} penumbra={0.35} distance={16} />
          <LightShaft top={[(d.x0 + d.x1) / 2, 1.25, LEU.back]} bottom={[-0.85, 0.05, -1.95]} r={0.42} color="#ffe8b8" strength={0.09} f={f} />
          <Motes f={f} box={[-1.9, -0.8, 0.3, 1.5, -4.4, -2.4]} n={14} color="#fff0c0" size={0.006} glow={0} drift={0.15} seed={5} />
        </> : <>
          {/* night: a dim cool fill; the lamp and the brazier carry the picture */}
          <hemisphereLight args={['#a2a6cc', '#5e4c40', 1.5]} />
          <pointLight position={[0.2, 1.4, 1.2]} color="#ffc890" intensity={0.8} distance={6} decay={1.4} />
          <Brazier pos={[-1.45, 0, -1.25]} f={f} />
        </>}
        <HangingLamp pos={[LAMP.x, day ? LAMP.high : LAMP.low, LAMP.z]} top={[LAMP.x, LAMP.roof, LAMP.z]} on={!day} f={f} k={day ? 1 : 1.5} lk={day ? 1 : 0.85} />
        <TentInside day={day} through={!day} glow={day ? 0.85 : 0.3} glowColor={day ? '#ffe3a8' : '#ffb26a'} />
        <TentDoor open={day} />
        <FloorRug pos={[0.1, 0, -2.1]} w={3.0} d={2.2} seed={5} />
        <StrawPallet pos={[-2.33, 0, -2.0]} w={0.9} len={1.9} />
        <Basket pos={[-2.35, 0, -3.4]} s={0.9} fill="#c9b48a" seed={3} />
        <IronChest pos={[2.35, 0, -4.45]} rotY={-0.08} />
        <ClayPot pos={[1.62, 0, -4.55]} kind="jar" s={0.9} color="#9a5a3a" seed={4} />
        <HealerTable vial={vial} pestle={pestle} jug={<ClayPot pos={[0.6, BAN_THUOC.h, 0.12]} kind="jug" s={0.62} color="#8a4a30" seed={6} />} stool={<Stool pos={[2.72, 0, -2.45]} seed={4} />} />
        <HerbLine a={[-1.2, 2.24, -4.55]} b={[2.8, 2.24, -4.55]} sag={0.07} at={[0.04, 0.13, 0.22, 0.31, 0.62, 0.71, 0.8, 0.89, 0.97]} size={0.3} seed={1} />
        <WallHanging pos={[-0.8, 1.3, LEU.back + 0.04]} w={0.9} h={1.15} seed={4} ground="#2e3048" a="#7a3a2e" b="#c8a868" />
        <WallHanging pos={[0.95, 1.3, LEU.back + 0.04]} w={1.0} h={1.1} seed={6} ground="#4a3428" a="#5e4230" b="#8a6a48" />
        <WallHanging pos={[LEU.hw - 0.03, 1.25, -2.4]} rotY={-Math.PI / 2} w={1.3} h={1.1} seed={2} ground="#3a3a5a" />
        <mesh position={[2.15, 1.25, LEU.back + 0.05]} castShadow receiveShadow><planeGeometry args={[0.62, 0.55]} /><meshLambertMaterial map={hung} transparent alphaTest={0.4} /></mesh>
        {children}
      </GradeCtx.Provider>
    );
  };

// ---------------------------------------------------------------- years later: bo-hoang (abandoned) and xuong (the workshop)
const plan1 = tex('leu-plan-1', 600, 440, paintPlan('cream', 31)), plan2 = tex('leu-plan-2', 600, 440, paintPlan('cream', 57));
/** The same tent years later (d1c4, d1c5). bo-hoang: by day the canvas lets in a weak grey light; the sun comes through a
 *  tear in the right roof facet in a shaft with dust onto the mother's chest; cobwebs in the corners and between poles; the
 *  herbs dried black; the table knocked on its side against the back wall left of centre, broken glass by it; the straw bed
 *  rolled up in the front left corner; the lamp out, the brazier cold; the chest with the mother's old things round it.
 *  night = the same by night (d1c5 shots 3 to 5): dim blue, the two candle stubs on the chest give the light.
 *  xuong: a few years on, at night: cleaned, the tear patched, the table stood up against the back wall as a workbench with
 *  tools, copper wire, a string of gears and two machine drawings on the wall, the lamp lit low, the bed laid out again,
 *  the father's cloak on a peg and the headscarf on its hook. */
const LaterTent: React.FC<{children?: React.ReactNode; f: number; dx?: number; dz?: number; eye: V3; state: 'bo-hoang' | 'xuong'; chest?: ChestState; night?: boolean; cloak?: boolean; machine?: MachineState | null}> =
  ({children, f, dx, dz, eye, state, chest = {}, night = false, cloak, machine}) => {
    const mach = machine === undefined ? (state === 'xuong' ? {kind: 'toy' as const} : null) : machine;
    const old = state === 'bo-hoang', day = !night, T = LEU.tear, d = LEU.door, hook: V3 = [2.93, 1.62, -4.9];
    const ch = {open: 0, seam: 0, cover: old ? 0 : 1, candles: old && night, ...chest};
    return (
      <GradeCtx.Provider value={day ? 'brightInterior' : 'darkInterior'}>
        <StageCam eye={eye} haze="#14110e" fog={[40, 300]} dx={dx} dz={dz} />
        {day && !old ? <>
          {/* xuong by day (d1c5 6, 7, 14): the canvas glowing with the day as in chua-benh, the door rolled up, a sunbeam from it */}
          <hemisphereLight args={['#fff0d6', '#9a8466', 1.45]} />
          <directionalLight position={[-1.5, 4, 8]} color="#fff4e0" intensity={1.1} />
          <Spot from={[d.x0 - 0.3, 2.75, LEU.back - 4.2]} to={[-0.7, 0, -1.7]} color="#ffe2a6" intensity={620} angle={0.32} penumbra={0.35} distance={16} />
          <LightShaft top={[(d.x0 + d.x1) / 2, 1.25, LEU.back]} bottom={[-0.85, 0.05, -1.95]} r={0.42} color="#ffe8b8" strength={0.09} f={f} />
          <Motes f={f} box={[-1.9, -0.8, 0.3, 1.5, -4.4, -2.4]} n={14} color="#fff0c0" size={0.006} glow={0} drift={0.15} seed={5} />
        </> : day ? <>
          {/* a grey day through old canvas; the sun through the tear onto the chest */}
          <hemisphereLight args={['#d6d6d0', '#6e6860', 1.45]} />
          <directionalLight position={[-1.5, 4, 8]} color="#ece8de" intensity={0.9} />
          <Spot from={[T[0] + 0.8, T[1] + 2.2, T[2] + 0.4]} to={[CHEST_POS[0], 0.6, CHEST_POS[2]]} color="#ffd890" intensity={230} angle={0.26} penumbra={0.4} distance={8} />
          <LightShaft top={[T[0], T[1] - 0.05, T[2]]} bottom={[CHEST_POS[0] + 0.05, 0.62, CHEST_POS[2]]} r={0.3} color="#ffe6b0" strength={0.13} f={f} />
          {/* the sun pool on the floor bouncing back up onto the front of the chest (the subject of d1c4 24 has its own light) */}
          <pointLight position={[CHEST_POS[0], 0.55, CHEST_POS[2] + 1.3]} color="#ffe2b4" intensity={1.1} distance={3.2} decay={1.6} />
          <Motes f={f} box={[CHEST_POS[0] - 0.35, CHEST_POS[0] + 0.3, 0.7, 2.3, CHEST_POS[2] - 0.15, CHEST_POS[2] + 0.35]} n={22} color="#fff0c8" size={0.0035} glow={0} drift={0.08} seed={8} />
        </> : <>
          <hemisphereLight args={old ? ['#7486d0', '#34365a', 2.0] : ['#a2a6cc', '#5e4c40', 1.5]} />
          {old ? <><pointLight position={[1.8, 1.2, -1.6]} color="#8a9ad0" intensity={1.2} distance={7} decay={1.4} /><directionalLight position={[1.5, 3, 8]} color="#9aaee6" intensity={0.7} /></> : <pointLight position={[0.8, 1.4, 0.6]} color="#ffb46a" intensity={1.3} distance={7} decay={1.4} />}
        </>}
        <HangingLamp pos={[LAMP.x, old || day ? LAMP.high : LAMP.low, LAMP.z]} top={[LAMP.x, LAMP.roof, LAMP.z]} on={!old && !day} f={f} k={1.5} />
        <TentInside day={day} wear={old ? 'old' : 'mended'} through glow={day ? (old ? 0.42 : 0.6) : old ? 0.27 : 0.24} glowColor={day ? (old ? '#ece6d6' : '#ffe3a8') : old ? '#7088e0' : '#ffb26a'} />
        <TentDoor open={!old && day} day={day} />
        <FloorRug pos={[0.1, 0, -2.1]} w={3.0} d={2.2} seed={5} />
        {old ? <RolledPallet pos={[-2.7, 0, -2.25]} /> : <StrawPallet pos={[-2.33, 0, -2.0]} w={0.9} len={1.9} />}
        <Basket pos={[-2.35, 0, -3.4]} s={0.9} fill="#c9b48a" seed={3} />
        <Brazier pos={[-1.45, 0, -1.25]} f={f} heat={0} />
        {old ? <><TippedTable pos={[-1.6, 0, -4.2]} rotY={0.22} /><BrokenGlass pos={[-1.2, 0, -3.6]} /></> : <WorkBench pos={[-1.6, 0, -4.2]} />}
        <MotherChest pos={CHEST_POS} f={f} scarf={old} {...ch} />
        {/* xuong: a board laid across the domed lid, the machine on it, papers and screws */}
        {!old ? <group position={[CHEST_POS[0], 0.62, CHEST_POS[2]]}>
          <B p={[0, 0.012, 0.02]} s={[0.86, 0.025, 0.36]} c="#8a6644" />
          <mesh position={[0.28, 0.026, 0.06]} rotation={[-Math.PI / 2, 0, 0.2]}><planeGeometry args={[0.24, 0.17]} /><meshLambertMaterial map={plan2} /></mesh>
          {Array.from({length: 5}, (_, i) => <mesh key={i} position={[-0.3 + i * 0.035, 0.03, 0.15 - (i % 2) * 0.02]} rotation={[0, i, Math.PI / 2]}><cylinderGeometry args={[0.005, 0.005, 0.025, 5]} /><meshLambertMaterial color="#8a8680" /></mesh>)}
          {mach?.kind === 'toy' ? <GearToy pos={[-0.05, 0.025, 0.02]} spin={mach.spin ?? f * 0.05} rotY={-0.25} /> : null}
          {mach?.kind === 'coil' ? <CoilMachine pos={[-0.04, 0.025, 0.02]} on={mach.on ?? 1} spin={mach.spin ?? f * 0.2} arc={mach.arc ?? 0} lever={mach.lever ?? 1} f={f} rotY={-0.2} /> : null}
        </group> : null}
        <MotherThings />
        <ScarfHook pos={hook} rotY={-Math.PI / 2} />
        {!old ? <CynthiaScarf pos={[hook[0] - 0.06, hook[1] - 0.01, hook[2] + 0.02]} on="hook" /> : null}
        {(cloak ?? !old) ? <CloakPeg pos={[0.55, 0, -4.72]} /> : null}
        <HerbLine a={[-1.2, 2.24, -4.55]} b={[2.8, 2.24, -4.55]} sag={0.07} at={[0.04, 0.13, 0.22, 0.31, 0.62, 0.71, 0.8, 0.89, 0.97]} size={0.3} seed={1} dry={old} />
        <WallHanging pos={[-0.8, 1.3, LEU.back + 0.04]} w={0.9} h={1.15} seed={4} ground="#2e3048" a="#7a3a2e" b="#c8a868" />
        {old ? <WallHanging pos={[0.55, 1.3, LEU.back + 0.04]} w={1.0} h={1.1} seed={6} ground="#4a3428" a="#5e4230" b="#8a6a48" /> : <>
          <Sheet map={plan1} x={1.1} y={1.38} w={0.55} h={0.4} rot={-0.04} z={LEU.back + 0.05} pins={2} />
          <Sheet map={plan2} x={1.75} y={1.5} w={0.5} h={0.37} rot={0.05} z={LEU.back + 0.05} pins={2} />
          <CopperCoil pos={[2.42, 1.42, LEU.back + 0.06]} r={0.13} />
          <GearString top={[2.68, 1.86, LEU.back + 0.06]} n={5} />
        </>}
        <WallHanging pos={[LEU.hw - 0.03, 1.25, -2.4]} rotY={-Math.PI / 2} w={1.3} h={1.1} seed={2} ground="#3a3a5a" />
        {old ? <>
          <Cobweb pos={[2.95, 1.98, -4.95]} size={0.55} rotY={-Math.PI / 4} flipX seed={1} />
          <Cobweb pos={[-2.95, 1.98, -4.95]} size={0.5} rotY={Math.PI / 4} seed={2} />
          <Cobweb pos={[0.0, 2.0, -4.94]} size={0.42} seed={3} />
          <Cobweb pos={[1.25, 1.98, -4.93]} size={0.5} seed={7} />
          <Cobweb pos={[2.95, 1.98, -2.5]} size={0.45} rotY={-Math.PI / 2} seed={4} />
          <Cobweb pos={[-2.95, 1.98, -2.5]} size={0.45} rotY={Math.PI / 2} flipX seed={5} />
          <Cobweb pos={[1.8, 2.7, -3.6]} size={0.6} rotY={-0.4} seed={6} />
        </> : null}
        {children}
      </GradeCtx.Provider>
    );
  };
// ---------------------------------------------------------------- the tent alone (kho chung, 23/11/2026): the wide view of each state, no people
const LeuEmpty: React.FC<{state: LeuState; chest?: ChestState; machine?: MachineState; eye?: V3}> = ({state, chest, machine, eye = LEU_VIEWS.toan}) => (
  <Shot grade={state === 'sinh' ? 'darkInterior' : 'brightInterior'} eye={eye} finish={{warm: ''}} set={(inside, cam) => <LeuThayLang eye={eye} dx={cam.dx} dz={cam.dz} state={state} chest={chest} machine={machine} f={40}>{inside}</LeuThayLang>} figures={null} />
);
export const LeuThayLangComps: React.FC = () => (
  <>
    <Composition id="leu-sinh-trong" component={() => <LeuEmpty state="sinh" />} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="leu-chua-benh-trong" component={() => <LeuEmpty state="chua-benh" />} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="leu-bo-hoang-trong" component={() => <LeuEmpty state="bo-hoang" chest={{cover: 0}} />} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="leu-xuong-trong" component={() => <LeuEmpty state="xuong" chest={{}} machine={{kind: 'coil', on: 1}} eye={LEU_VIEWS.xuongToan} />} width={1280} height={720} fps={24} durationInFrames={1} />
  </>
);
