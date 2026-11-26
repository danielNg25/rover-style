import React from 'react';
import {AbsoluteFill, Composition, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {GradeCtx, Finish} from '../lib3/look';
import {B, StageCam} from '../lib3/kit';
import {HoledWall, tex} from '../lib3/kitLab';
import {Sun} from '../lib3/room';
import {Shot} from '../lib3/shot';
import {Puppet3} from '../mould/Puppet3';
import type {Spec} from '../mould/draw';
import {DaiBangChay, ChuChay, GiotXeo} from '../lib3/kitTayTang';
import {SetGlow, stoneTex, STONE_TONES_LIGHT, paintFlags, Timber, ForgeHearth, FORGE, Bellows, ToolRack, Thangka, ButterLamps, QuenchTub, CoalSack, Anvil, ANVIL, LooseMask, maskSize, LowBench, NightPeaks} from '../lib3/kitForge';

/** THE FORGE OF THE MOUNTAIN MONASTERY, AT NIGHT (passage d1mo, episodes/d1mo-danh-sach-canh.md). World units = room units
 *  (metres), the room is NOT turned: the camera looks straight at the back wall through the open front.
 *    room: x 0..10 (left to right), z 0..8 (back wall at z 0, open front at z 8), y 0..4.8.
 *    back wall (z 0): tool rack (x 1.0, over the bellows); the forge (hearth x 2.0-3.9, stepped hood up to the ceiling);
 *                     the thangka and the shelf of three butter lamps (x 6.0); the arched window, no glass (x 6.5-8.7,
 *                     sill 1.1, top 3.45) with the snow peaks, the moon and a string of prayer flags outside.
 *    floor: the anvil on its stump in the middle (x 4.78, z 3.55); bellows (x 1.15) and coal sacks at the left; the quench
 *           tub right of the hearth; a low bench near the front left (for the widest view).
 *  Light: a cool dim fill; the forge fire (a warm point in the hearth, a shadow-casting spot thrown into the room, a weak warm
 *  spill that reaches the FRONT of the figures); the moon through the window (cool, casts the window on the floor); the three
 *  butter lamps; in 'ruc' the red-hot mask lights the anvil and what is near it. */
type V3 = [number, number, number];
export const RW = 10, RL = 8, RH = 4.8;
export const WIN = {x0: 6.6, x1: 8.6, sill: 1.55, spring: 2.65};
export const HEARTH: V3 = [3.25, 0, 0];
/** how much each part of the shell glows with its own picture (SetGlow); the side walls and the floor are mostly seen by the wide view */
export const GLOW = {back: 0.5, side: 1.4, floor: 1.05, props: 0.45};
export const ANVIL_POS: V3 = [4.78, 0, 3.55];
/** 'ruc' = the red-hot mask lying on the anvil (shots 1-2); 'trong' = the anvil empty (from shot 3). */
export type ForgeState = 'ruc' | 'trong';
/** Marks for the figures (world = room units). Each: nearest things and clearances are in out/d1mo/ghi-chu-san-khau.md. */
export const FORGE_MARKS = {
  doomDe: [5.0, 0, 2.7] as V3,      // behind the anvil, centre
  doomLung: [5.3, 0, 4.55] as V3,   // in front of the anvil, back to the lens (shot 2)
  suTho: [2.95, 0, 3.1] as V3,     // the smith, left, in front of the hearth
  suGia: [6.5, 0, 3.3] as V3,       // the abbot, right, towards the window
  suTre: [8.45, 0, 2.3] as V3,      // the young monk, right, further back
  // shots 6 and 7 (whole figure): he has stepped out from behind the anvil, which would hide him from the thighs down;
  // the smith stays behind his anvil, the abbot stands clear of the cape (coordinator, 22/11/2026)
  doomGiua: [5.95, 0, 3.3] as V3,
  suThoDe: [4.68, 0, 2.9] as V3,   // behind his anvil, his head against the stone pier of the hearth (not against the flames)
  suGiaXa: [7.45, 0, 3.2] as V3,
  // d1c9 (Tibet), scenes 16 and 18 (added 23/11/2026; the marks above are untouched)
  doomCuaSo: [7.6, 0, 1.2] as V3,   // 18: in front of the window opening (x 6.6-8.6, sill 1.55), head and shoulders inside the arch against the night sky
  doomLo: [4.6, 0, 1.95] as V3,     // 16: right of the hearth (its right edge is x 4.2, its front z 1.4: 0.45 m clear in x), facing the lens, hand reaches the fire pit (3.7, 0.9, 0.9)
};
/** Where the loose mask lies in 'ruc': the middle of its lower edge on the anvil face, leaning back. */
export const MASK_ON_ANVIL = {pos: [ANVIL_POS[0] + 0.03, ANVIL.top, ANVIL_POS[2] + 0.06] as V3, lean: 0.6};
/** Camera positions (eye). s1 = shot 1 (low on the anvil face, the mask a third of the width); s6 = shot 6 (Doom full length,
 *  60 % of the frame); wide = shot 7 first half and the set's master view (Doom about 40 %). */
export const FORGE_VIEWS = {
  s1: [ANVIL_POS[0] + 0.03, 1.05, ANVIL_POS[2] + 1.72] as V3,
  s6: [5.95, 1.3, 8.7] as V3,
  wide: [5.0, 1.5, 12.4] as V3,
  /** the end of shot 7: the frame is all window opening (night sky, snow peaks, flags) */
  window: [7.6, 2.2, 1.2] as V3,
  /** d1c9 scene 18: Doom at doomCuaSo from the hips up, the arch round his head and shoulders */
  doomCuaSo: [7.6, 1.5, 4.6] as V3,
  /** d1c9 scene 16: medium shot in front of the hearth mouth: the hearth the left half, Doom at doomLo the right half */
  lo: [3.9, 1.45, 5.4] as V3,
};

// ---------------------------------------------------------------- the shell
const SOOT_BACK = [{x: 3.25, y: 1.4, r: 1.6, k: 0.9}, {x: 3.25, y: 3.2, r: 2.3, k: 0.55}, {x: 0.8, y: 2.6, r: 1.0, k: 0.3}, {x: 6.0, y: 2.5, r: 0.5, k: 0.35}];
const backTex = () => stoneTex('forge-wall-back-c', RW, RH, {tones: STONE_TONES_LIGHT, mortar: '#5a5046', seed: 3, soot: SOOT_BACK, arches: [{...WIN}], damp: 0.7, course: [0.2, 0.5], len: [0.3, 1.1]}, 400);
const leftTex = () => stoneTex('forge-wall-left-c', RL, RH, {tones: STONE_TONES_LIGHT, mortar: '#5a5046', seed: 8, soot: [{x: 7.4, y: 1.6, r: 1.5, k: 0.5}], damp: 0.7, course: [0.2, 0.5], len: [0.3, 1.1]}, 300);
const rightTex = () => stoneTex('forge-wall-right-c', RL, RH, {tones: STONE_TONES_LIGHT, mortar: '#5a5046', seed: 12, damp: 0.7, course: [0.2, 0.5], len: [0.3, 1.1]}, 300);
const floorTex = () => tex('forge-floor-l', 3200, 2560, paintFlags(RW, RL, 5, [[3.25, 1.7, 1.3, 'coal'], [0.8, 1.7, 0.9, 'coal'], [4.78, 3.55, 0.9, 'scale'], [0.85, 2.7, 0.7, 'wet'], [5.2, 3.2, 1.6, 'scale']], 1.35));
const ceilTex = () => tex('forge-ceiling', 512, 512, (c, W, H) => { c.fillStyle = '#3a2c20'; c.fillRect(0, 0, W, H); for (let x = 0; x < W; x += 32) { c.fillStyle = x % 64 ? '#43331f' : '#33261b'; c.fillRect(x, 0, 30, H); } });

const Shell: React.FC = () => (
  <group>
    {/* back wall: coursed rubble, cut stone round the window; the reveal of the thick wall in plain dark stone */}
    <HoledWall w={RW} h={RH} t={0.6} map={backTex()} slab="#5e564c" holes={[{kind: 'arch', x0: WIN.x0, x1: WIN.x1, y0: WIN.sill, spring: WIN.spring}]} />
    <mesh position={[(WIN.x0 + WIN.x1) / 2, WIN.sill + 0.002, -0.3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[WIN.x1 - WIN.x0, 0.6]} /><meshLambertMaterial map={stoneTex('forge-sill', 2.2, 0.6, {seed: 17, course: [0.6, 0.6], len: [0.5, 0.8], damp: 0, streaks: 0})} /></mesh>
    {/* snow lying on the outer half of the sill */}
    <mesh position={[(WIN.x0 + WIN.x1) / 2, WIN.sill + 0.02, -0.46]} scale={[1, 0.25, 1]}><boxGeometry args={[WIN.x1 - WIN.x0 - 0.06, 0.12, 0.26]} /><meshLambertMaterial color="#dfe5f2" /></mesh>
    {/* left and right walls */}
    <SetGlow amount={GLOW.side} tint="#d8c0a8"><group position={[0, 0, RL]} rotation={[0, Math.PI / 2, 0]}><HoledWall w={RL} h={RH} t={0.6} map={leftTex()} slab="#5e564c" /></group></SetGlow>
    <SetGlow amount={GLOW.side} tint="#b4bede"><group position={[RW, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><HoledWall w={RL} h={RH} t={0.6} map={rightTex()} slab="#5e564c" /></group></SetGlow>
    {/* flagstone floor (slightly larger than the room so no edge shows) and a dark plank ceiling with beams */}
    <SetGlow amount={GLOW.floor} tint="#c8c4cc"><mesh position={[RW / 2, 0, RL / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[RW, RL]} /><meshLambertMaterial map={floorTex()} /></mesh></SetGlow>
    <mesh position={[RW / 2, RH, RL / 2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[RW + 1.2, RL + 0.6]} /><meshLambertMaterial map={ceilTex()} /></mesh>
    {[1.3, 3.4, 5.5, 7.6].map((z, i) => <Timber key={z} p={[RW / 2, RH - 0.15, z]} s={[RW, 0.3, 0.26]} seed={i} />)}
    {/* the timber frame on the back wall: corner posts, a ring beam with a row of painted joist ends over it */}
    {[0.2, RW - 0.2].map((x, i) => <group key={x}><Timber p={[x, RH / 2, 0.14]} s={[0.26, RH, 0.26]} seed={i + 2} /><Timber p={[x + (i ? -0.2 : 0.2), 3.98, 0.14]} s={[0.3, 0.16, 0.24]} seed={1} /></group>)}
    <Timber p={[1.2, 4.2, 0.13]} s={[2.05, 0.24, 0.26]} seed={3} /><Timber p={[7.25, 4.2, 0.13]} s={[5.1, 0.24, 0.26]} seed={0} />
    {Array.from({length: 24}, (_, i) => { const x = 0.45 + i * 0.4; if (x > 2.2 && x < 4.4) return null; return <group key={i}><B p={[x, 4.44, 0.1]} s={[0.15, 0.15, 0.2]} c={i % 2 ? '#6a2a20' : '#7a5a2a'} /><B p={[x, 4.44, 0.201]} s={[0.1, 0.1, 0.004]} c={i % 2 ? '#8a3a2a' : '#9a7a3a'} cast={false} /></group>; })}
    {/* iron hooks and a lantern bracket on the right wall, a leather apron on a peg on the left wall */}
    <group position={[RW, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <B p={[3.2, 2.1, 0.05]} s={[0.04, 0.04, 0.1]} c="#2a2624" /><B p={[3.2, 1.72, 0.06]} s={[0.42, 0.7, 0.03]} r={[0, 0, 0.03]} c="#5a3a26" />
      <B p={[5.0, 2.2, 0.05]} s={[0.04, 0.04, 0.1]} c="#2a2624" /><mesh position={[5.0, 1.75, 0.08]} castShadow><torusGeometry args={[0.18, 0.025, 6, 18]} /><meshLambertMaterial color="#6a5a3a" /></mesh>
    </group>
    <group position={[0, 0, RL]} rotation={[0, Math.PI / 2, 0]}>
      <B p={[2.6, 2.2, 0.05]} s={[0.04, 0.04, 0.1]} c="#2a2624" /><B p={[2.6, 1.6, 0.05]} s={[0.5, 1.1, 0.03]} c="#4e3220" />
    </group>
  </group>
);

const Dressing: React.FC<{f: number; fire: number}> = ({f, fire}) => (
  <group>
    <ForgeHearth pos={HEARTH} f={f} fire={fire} ceiling={RH} aim={[2.3, -1.0, 3.4]} />
    <Bellows pos={[1.65, 0, 0.75]} />
    <ToolRack pos={[0.72, 2.35, 0]} w={1.0} />
    <Thangka pos={[6.0, 2.15, 0]} />
    <ButterLamps pos={[6.0, 1.3, 0]} f={f} />
    <QuenchTub pos={[0.85, 0, 2.7]} glow={fire} />
    <CoalSack pos={[0.42, 0, 1.45]} seed={1} /><CoalSack pos={[1.0, 0, 1.75]} s={0.85} seed={2} />
    <LowBench pos={[3.05, 0, 6.7]} rotY={0.15} />
    {/* iron offcuts and scale round the anvil, a bucket of water by the hearth */}
    {[[4.2, 3.0, 0.3], [5.55, 3.9, 1.2], [4.4, 4.2, 2.1], [5.45, 3.05, 0.8]].map(([x, z, r], i) => <B key={i} p={[x, 0.012, z]} s={[0.16 - i * 0.02, 0.022, 0.03]} r={[0, r, 0]} c="#2e2e32" />)}
  </group>
);

/** The scene. Figures are children in world units. state = 'ruc' (mask on the anvil) or 'trong'; heat = the mask's heat in
 *  'ruc' (1 = red); anvil = false leaves the anvil and the mask out (a shot that draws them itself, sharp, as `figures`);
 *  fire = the forge fire's strength 0..1; f = frame (fire, embers, lamps, flags, snow); dx / dz = slide and push. */
export const Forge: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; state?: ForgeState; heat?: number; anvil?: boolean; fire?: number; phu?: number; phuAt?: V3}> =
  ({children, f = 0, dx, dz, eye = FORGE_VIEWS.wide, state = 'trong', heat = 1, anvil = true, fire = 1, phu = 0, phuAt = [7.6, 2.2, 3.4]}) => (
    <GradeCtx.Provider value="darkInterior">
      <StageCam eye={eye} haze="#0d1120" fog={[40, 900]} dx={dx} dz={dz} />
      {/* LIGHT. The figures, the hot mask and the armour get exactly the light approved before 23/11/2026 (cool fill, moon, the
          forge's own lights); the set is made brighter by its MATERIALS (lighter cooler stone, a lighter floor) and by SetGlow, which
          lifts only the walls, floor and ceiling. The widest view sees the dark corners (side walls, front floor, upper wall), so
          those glow more. Daniel, 23/11/2026: "các cảnh hơi tối"; then the brighter fill had burnt the mask white and the gauntlets pink. */}
      <hemisphereLight args={['#6c78a8', '#3e3630', 0.95]} />
      <Sun nguocSang from={[9.6, 8.5, -6.5]} to={[7.2, 0, 3.2]} intensity={2.6} color="#a6b8ee" />
      {/* short-reach lights (3 m) that touch only the upper back wall, the beams and the front floor: no mark lies within their reach
          (Doom's head at doomDe is 3.2 m from the nearest), so the people keep their approved light */}
      {[1.5, 5.0, 8.5].map((x) => <pointLight key={x} position={[x, 4.45, 0.55]} color="#aab6de" intensity={9} distance={3} decay={1} />)}
      {[2.5, 7.0].map((x) => <pointLight key={x} position={[x, 0.8, 7.5]} color="#b8bcd4" intensity={9} distance={3} decay={1} />)}
      {/* phu > 0 (d1c9 scene 18 only): a faint cool fill in front of the window arch so the figure standing in it reads; off by default */}
      {phu > 0 ? <pointLight position={phuAt} color="#a8b8e8" intensity={14 * phu} distance={6} decay={1.2} /> : null}
      <NightPeaks at={[(WIN.x0 + WIN.x1) / 2, -0.6]} f={f} />
      <SetGlow amount={GLOW.back} tint="#c4c8dc"><Shell /></SetGlow>
      <SetGlow amount={GLOW.props} tint="#c4c8dc"><Dressing f={f} fire={fire} /></SetGlow>
      {anvil ? <><Anvil pos={ANVIL_POS} tongs={state === 'ruc'} hammer={state === 'trong'} glow={state === 'ruc' ? heat * 0.6 : 0} />
        {state === 'ruc' ? <LooseMask pos={MASK_ON_ANVIL.pos} lean={MASK_ON_ANVIL.lean} heat={heat} f={f} /> : null}</> : null}
      {children}
    </GradeCtx.Provider>
  );


/** shot 1: low on the anvil face, the red-hot mask a third of the frame wide, the forge and the window soft behind. The anvil
 *  and the mask are drawn on the sharp layer. */
const ForgeS1: React.FC = () => (
  <Shot grade="darkInterior" eye={FORGE_VIEWS.s1} soft={1.6} finish={{warm: ''}}
    set={(inside, cam) => <Forge eye={FORGE_VIEWS.s1} state="ruc" anvil={false} dx={cam.dx} dz={cam.dz}>{inside}</Forge>}
    figures={<><Anvil pos={ANVIL_POS} tongs glow={0.6} /><LooseMask pos={MASK_ON_ANVIL.pos} lean={MASK_ON_ANVIL.lean} heat={1} f={0} /></>} />
);
export const stillOf = (state: ForgeState, cast: React.ReactNode): React.FC => () => {
  const {width, height} = useVideoConfig();
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><Forge state={state}>{cast}</Forge></ThreeCanvas></Finish></AbsoluteFill>;
};
const ForgeRuc = stillOf('ruc', null);
const ForgeWindow: React.FC = () => <Shot grade="darkInterior" eye={FORGE_VIEWS.window} finish={{warm: ''}} set={(inside, cam) => <Forge eye={FORGE_VIEWS.window} dx={cam.dx} dz={cam.dz}>{inside}</Forge>} figures={null} />;
export {FORGE};
/** the room alone in the 'trong' state, the same set-up as forge-wide without the people (kho chung, 23/11/2026) */
const ForgeEmpty = stillOf('trong', null);
/** d1c9: the room alone at the two new marks' views, and the small things that belong to scenes 13 and 16 (no people) */
const ForgeAt = (eye: V3, state: ForgeState, extra: (f: number) => React.ReactNode, f = 0, phu = 0, phuAt?: V3): React.FC => () => {
  const {width, height} = useVideoConfig();
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><Forge state={state} eye={eye} f={f} phu={phu} phuAt={phuAt}>{extra(f)}</Forge></ThreeCanvas></Finish></AbsoluteFill>;
};
const ForgeDoomCuaSo = ForgeAt(FORGE_VIEWS.doomCuaSo, 'trong', () => null, 12, 1);
const ForgeDoomLo = ForgeAt(FORGE_VIEWS.lo, 'trong', () => null, 12, 1, [4.8, 2.4, 3.8]);
const ForgeBangChay = ForgeAt(FORGE_VIEWS.lo, 'trong', (f) => <><DaiBangChay pos={[3.55, 1.15, 1.55]} f={f} chay={0.42} curl={0.5} /><ChuChay pos={[4.45, 1.5, 1.7]} burn={0.4} f={f} /></>, 20, 1, [4.8, 2.4, 3.8]);
const ForgeGiotXeo = ForgeAt(FORGE_VIEWS.s1, 'ruc', (f) => <GiotXeo f={f} at={24} from={[MASK_ON_ANVIL.pos[0] + 0.0, 1.62, 3.32]} to={[MASK_ON_ANVIL.pos[0] + 0.0, 1.275, 3.32]} />, 30);
export const ForgeComps: React.FC = () => (
  <>
    <Composition id="forge-s1" component={ForgeS1} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="forge-ruc" component={ForgeRuc} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="forge-cua-so" component={ForgeWindow} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="forge-trong" component={ForgeEmpty} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="forge-doom-cua-so" component={ForgeDoomCuaSo} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="forge-doom-lo" component={ForgeDoomLo} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="forge-doom-lo-bang-chay" component={ForgeBangChay} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="forge-ruc-giot-xeo" component={ForgeGiotXeo} width={1280} height={720} fps={24} durationInFrames={1} />
  </>
);
