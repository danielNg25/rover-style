import React from 'react';
import {AbsoluteFill, Composition, useVideoConfig, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Finish, GradeCtx, Halo} from '../lib3/look';
import {StageCam} from '../lib3/kit';
import {Plate, Ctx, rnd, RiseCtx} from '../lib3/depth';
import {Embers} from '../lib3/fx';
import {FireCage, AshDrift, SoulFigure, FireBurst, FlamePal, JaggedFire, paintPeaks, Mephisto, MephistoPose, MEPH_POSES, mephistoHand, LavaLake, ObsidianSpire, SmokeBank, FireChain, ColorFlame} from '../lib3/kitCoiLua';
import type {Spec} from '../mould/draw';

/** THE FIRE REALM OF MEPHISTO (d1c3 set D), as approved in kenh/phim-tv/out/d1c3/mephisto-thiet-ke-rieng.md (23/11/2026; the
 *  earlier hall copied from the reference channel is gone). The lens sits just above a lake of lava and looks up (rise):
 *    sky (plate, 70 m): deep red smoke above, orange glow at the horizon; far ridges of black obsidian with lit edges;
 *    banks of smoke drifting at 60 and 48 m; low-poly fire walls on the far lava;
 *    MEPHISTO (the comics' red devil, a jointed puppet) standing waist-deep in the lava at 40 m, right half, 16 m from the hips to
 *      the top of his head, his collar cut by the top edge; his left hand holds a chain of fire;
 *    a spire of black glass rising out of the lava at 37 m, left of centre, and on its point the CAGE OF FIRE with a soul inside
 *      (the soul comes in by the prop `soul`, about a tenth of the frame tall);
 *    smaller spires with pale blue soul-flames trapped in their seams; embers rising everywhere, ash.
 *  Shot 13 runs as coiLuaShot13(f): he looks down, narrows his eyes, grins; the chain falls slack; his hand comes down over the
 *  cage and the fingers close one by one (palm behind the bars, fingers in front); a red flash; he lifts the fist to his face and
 *  laughs, the soul's light dimming. No real lamps: everything glows by itself. */
export type V3 = [number, number, number];
export const COI_EYE: V3 = [0, 0.9, 0];
export const COI_RISE = 0.25;
/** marks: the spire's foot, the cage on its point (where the soul stands), Mephisto's hips (under the lava) */
export const COI_MARKS = {spire: [-3.9, 0, -37] as V3, cage: [-3.9, 5.0, -37] as V3, mephisto: [6.4, -1.2, -40] as V3};
export const MEPH_H = 16;

export type CoiPlan = {
  pose: MephistoPose;            // Mephisto's every joint (see MephistoPose in src/lib3/kitCoiLua.tsx)
  cage: V3;                      // where the cage stands (it is carried in his fist at the end)
  flare: number;                 // the cage's bars flare up (0..1)
  chain: number;                 // the chain of fire from the cage to his left hand (opacity 0..1)
  flash: number;                 // red flash at the cage (0..1)
  burst: number | null;          // frame of the spray of sparks out of the fingers
  soul: number;                  // the soul's glow (1 = full)
  grip: boolean;                 // palm behind the cage, fingers in front
};
const ease = (t: number) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpArm = (a: MephistoPose['armL'], b: MephistoPose['armL'], t: number) => ({sh: lerp(a!.sh, b!.sh, t), el: lerp(a!.el, b!.el, t), wrist: lerp(a!.wrist ?? 0, b!.wrist ?? 0, t),
  spread: [0, 1, 2, 3, 4].map((i) => lerp(a!.spread?.[i] ?? 1, b!.spread?.[i] ?? 1, t)), curl: [0, 1, 2, 3, 4].map((i) => lerp(a!.curl?.[i] ?? 0, b!.curl?.[i] ?? 0, t))});
/** the three poses of his left arm in shot 13 (solved so that the palm lands on the cage) */
export const COI_ARMS = {
  chain: {sh: 116, el: 96, wrist: -15, curl: [0.7, 0.8, 0.8, 0.8, 0.8]},
  grip: {sh: 158, el: -100, wrist: -10, spread: [1.4, 1.3, 1.2, 1.3, 1.4]},
  face: {sh: 108, el: 146, wrist: -20, curl: [1, 1, 1, 1, 1]},
};
/** the cage seen in a hand that is 3 m further back: the point at the cage's depth on the line from the lens to the palm */
const toCageDepth = (p: V3, z: number): V3 => { const k = (COI_EYE[2] - z) / (COI_EYE[2] - p[2]); return [p[0] * k, COI_EYE[1] + (p[1] - COI_EYE[1]) * k, z]; };
/** Shot 13 (74 frames), with three beats of his own plus the grip (design, section 3):
 *  0-14 he stands breathing, hair and cape stirring in the heat, eyes on the cage, the chain held in his left hand;
 *  14-30 he bends his head down, narrows his eyes, the jaw opens into a grin; 8 the bars flare;
 *  30-46 the chain falls slack, his hand swings down over the cage; 39-51 the fingers close one by one round it, red flash at 47;
 *  52-74 he lifts the fist to his face and laughs (jaw opening and closing), eyes to the lens; the soul's light dims, not out. */
export const coiLuaShot13 = (f: number): CoiPlan => {
  const A = COI_ARMS, tDown = ease((f - 30) / 14), tUp = ease((f - 54) / 14);
  let armL = lerpArm(A.chain, A.grip, tDown);
  armL.curl = armL.curl.map((c, i) => Math.max(c * (1 - tDown), ease((f - 39 - (4 - i) * 2.2) / 6)));
  if (f >= 54) { armL = lerpArm({...A.grip, curl: [1, 1, 1, 1, 1]}, A.face, tUp); }
  const laugh = f >= 56 ? 0.25 + 0.35 * Math.abs(Math.sin((f - 56) * 0.42)) : 0;
  const pose: MephistoPose = {
    armL, armR: MEPH_POSES.down,
    nod: f < 52 ? lerp(0.2, 0.65, ease((f - 14) / 16)) : lerp(0.65, 0.15, ease((f - 52) / 10)),
    turn: -0.25, tilt: lerp(0, 6, ease((f - 14) / 16)),
    gaze: f < 52 ? [-0.7, 0.7] : [lerp(-0.7, 0, ease((f - 52) / 8)), lerp(0.7, 0, ease((f - 52) / 8))],
    squint: f < 52 ? lerp(0.15, 0.55, ease((f - 14) / 16)) : 0.3, brow: 0.5,
    jaw: f < 56 ? lerp(0.05, 0.3, ease((f - 18) / 12)) : laugh, grin: lerp(0.55, 0.9, ease((f - 18) / 12)),
    lean: lerp(0, 7, ease((f - 14) / 20)), breath: 1, wind: 0.3, fire: 0,
  };
  const M = COI_MARKS, palm = mephistoHand(M.mephisto, MEPH_H, 'L', pose);
  const cage: V3 = f < 52 ? M.cage : (() => { const c = toCageDepth(palm, M.cage[2]); const t = ease((f - 52) / 4); return [lerp(M.cage[0], c[0], t), lerp(M.cage[1], c[1] - 1.1, t), M.cage[2]] as V3; })();
  return {pose, cage, flare: f < 8 ? 0 : f < 10 ? 1 : Math.max(0, 1 - (f - 10) / 5) * 0.7, chain: 1 - ease((f - 38) / 8), flash: f >= 47 && f < 51 ? 1 - (f - 47) / 4 : 0, burst: 47,
    soul: f < 52 ? 1 : lerp(1, 0.35, ease((f - 52) / 22)), grip: f >= 36};
};
export const COI_REST: CoiPlan = coiLuaShot13(4);

// ---------------------------------------------------------------- plates (1600 x 900 screen units)
const sky = (c: Ctx) => {
  const g = c.createLinearGradient(0, -220, 0, 1120);
  [[0, '#8e2c14'], [0.3, '#bc4620'], [0.6, '#e8782e'], [0.75, '#f6a04a'], [0.8, '#e88a3a'], [1, '#b84a1e']].forEach(([k, col]) => g.addColorStop(k as number, col as string));
  c.fillStyle = g; c.fillRect(-300, -220, 2200, 1340);
  const r = rnd(4); for (let i = 0; i < 14; i++) { const x = -200 + r() * 2000, y = -150 + r() * 420; c.fillStyle = `rgba(${90 + r() * 40},${24 + r() * 14},14,0.45)`; c.beginPath(); c.ellipse(x, y, 220 + r() * 200, 40 + r() * 40, 0, 0, 7); c.fill(); }
};
const ridges = (c: Ctx) => { paintPeaks(c, 21, 760, [470, 620], ['#4a1a1c', '#2a1014'], 12, -300, 1900, 1.4); c.fillStyle = 'rgba(255,140,60,0.5)'; c.fillRect(-300, 742, 2200, 18); };
export const FIRE_WALL: FlamePal = {edge: '#a0200f', body: '#e2481c', mid: '#f8902a', core: '#ffd864', glow: '#ff8a30', spark: '#ffd27a'};

export const CoiLua: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; plan?: CoiPlan; soul?: Spec | null; soulHeight?: number}> =
  ({children, f = 0, dx, dz, plan = COI_REST, soul = null, soulHeight = 1.56}) => {
    const M = COI_MARKS, cage = plan.cage, hand = mephistoHand(M.mephisto, MEPH_H, 'L', plan.pose);
    return (
      <RiseCtx.Provider value={COI_RISE}>
      <GradeCtx.Provider value="nightExterior">
        <StageCam eye={COI_EYE} haze="#d86a2a" fog={[400, 900]} dx={dx} dz={dz} />
        <ambientLight intensity={1} />
        <Plate from={COI_EYE} id="coi3-sky" d={80} paint={sky} fog={false} />
        <Plate from={COI_EYE} id="coi2-ridges" d={72} paint={ridges} fog={false} />
        <SmokeBank pos={[-6, 18, -66]} w={70} h={14} f={f} speed={0.35} seed={2} color="#6a2014" lit="#d2582a" opacity={0.85} order={1} />
        <JaggedFire f={f} x0={-40} x1={40} z={-62} base={-0.5} h={[3, 7]} n={22} pal={FIRE_WALL} step={4} seed={3} order={1} />
        <ObsidianSpire pos={[-16, 0, -58]} h={16} seed={3} order={2} /><ObsidianSpire pos={[20, 0, -60]} h={19} seed={4} order={2} /><ObsidianSpire pos={[-26, 0, -52]} h={11} seed={5} order={2} />
        {[[-16.5, 6, -57.8], [-15.4, 9.5, -57.8], [20.6, 7, -59.8], [-26, 4.2, -51.8]].map((p, i) => <ColorFlame key={i} pos={p as V3} f={f + i * 9} h={0.9} w={0.5} pal="soul" n={2} seed={i + 3} glow={1.2} order={3} />)}
        <SmokeBank pos={[8, 9, -50]} w={44} h={9} f={f} speed={-0.25} seed={5} color="#7a2416" lit="#e0642c" opacity={0.6} order={2} />
        <LavaLake />
        <Mephisto pos={M.mephisto} f={f} h={MEPH_H} pose={plan.pose} order={4} handOrders={plan.grip ? {L: [440, 640]} : {}} />
        <JaggedFire f={f + 5} x0={-14} x1={30} z={-41} base={-0.4} h={[1.2, 3.2]} n={20} pal={FIRE_WALL} step={3} seed={8} order={40} />
        <ObsidianSpire pos={M.spire} h={M.cage[1] + 0.25} seed={1} order={60} />
        <JaggedFire f={f + 2} x0={-5.6} x1={-2.2} z={-36.8} base={-0.2} h={[0.8, 1.6]} n={5} pal={FIRE_WALL} step={3} seed={11} order={61} />
        <ObsidianSpire pos={[5, 0, -26]} h={4} seed={7} order={62} /><ObsidianSpire pos={[-11, 0, -24]} h={5.5} seed={8} order={62} />
        <ColorFlame pos={[-11.3, 2.4, -23.8]} f={f + 4} h={0.5} w={0.3} pal="soul" n={2} seed={9} glow={1.2} order={63} />
        <Embers f={f} box={[-20, 20, 0, 18, -45, -15]} n={90} size={0.06} life={70} seed={4} color="#ffcf70" />
        <AshDrift f={f} box={[-12, 12, 1, 14, -36, -18]} n={30} seed={5} />
        {/* the chain from the cage's crown to his left hand */}
        <FireChain a={[cage[0], cage[1] + 2.75, cage[2]]} b={[hand[0], hand[1] - 0.6, hand[2] + 1]} f={f} link={0.55} sag={2.2} opacity={plan.chain} order={420} />
        {/* the cage, the soul inside */}
        <FireCage pos={cage} f={f} flare={plan.flare} seed={2} glow={0.75} />
        {soul ? <SoulFigure spec={soul} height={soulHeight} pos={[cage[0], cage[1], cage[2] - 0.05]} glow={plan.soul} /> : null}
        {plan.grip && plan.soul < 1 ? <Halo pos={[cage[0], cage[1] + 1.2, cage[2] + 1.0]} r={1.4} color="#bfe4ff" strength={0.22} order={650} /> : null}
        {plan.flash > 0 ? <group scale={[0.4 + 0.6 * plan.flash, 0.4 + 0.6 * plan.flash, 1]} position={[cage[0], cage[1] + 1.4, cage[2] + 1.2]}><Halo pos={[0, 0, 0]} r={4} color="#ff2a0e" strength={0.7} order={700} /></group> : null}
        {plan.burst !== null ? <FireBurst f={f} at={plan.burst} pos={[cage[0] + 0.2, cage[1] + 1.8, cage[2] + 1.0]} n={46} up={4.5} spread={3} size={0.06} order={705} /> : null}
        {children}
      </GradeCtx.Provider>
      </RiseCtx.Provider>
    );
  };

// ---------------------------------------------------------------- stills without people (the channel's stills with people: kenh/phim-tv/tap/doom-1/dung-canh/CoiLuaNguoi.tsx)
export const Frame: React.FC<{children: React.ReactNode}> = ({children}) => { const {width, height} = useVideoConfig(); return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat gl={{antialias: true}}>{children}</ThreeCanvas></Finish></AbsoluteFill>; };

/** (b) CLOSE ON HIS FACE (design, frame b): three-quarter to screen left, bent down as if looking at Cynthia off frame, lit from
 *  the fire below; the head about 55 % of the frame height in the right third; red smoke and embers on the left, where his hand
 *  rises into the frame. */
export const FACE = {eye: [0, 1.5, 10] as V3, mephisto: [1.55, -5.9, 0] as V3, h: 8.9};
export const FACE_POSE: MephistoPose = {turn: -0.6, nod: 0.45, tilt: 4, gaze: [-0.8, 0.6], squint: 0.35, brow: 0.7, jaw: 0.35, grin: 0.85, light: 'below', wind: 0.4, armL: {sh: 96, el: 128, wrist: -30, spread: [1.4, 1.3, 1.2, 1.3, 1.5], curl: [0.1, 0.25, 0.1, 0.2, 0.35], bare: true, shadow: 1}, armR: MEPH_POSES.down};
const faceSky = (c: Ctx) => { const g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, '#9a3416'); g.addColorStop(0.5, '#e0702c'); g.addColorStop(1, '#ffb050'); c.fillStyle = g; c.fillRect(-300, -220, 2200, 1340); };
export const MephistoFaceStage: React.FC<{f: number; pose?: MephistoPose}> = ({f, pose = FACE_POSE}) => <>
  <StageCam eye={FACE.eye} haze="#c8562a" fog={[400, 900]} />
  <Plate from={FACE.eye} id="meph3-face-sky" d={60} paint={faceSky} fog={false} />
  <SmokeBank pos={[-3, 6, -30]} w={40} h={10} f={f} speed={0.3} seed={7} color="#7a2214" lit="#e06a2c" opacity={0.8} order={1} />
  <SmokeBank pos={[2, -1, -18]} w={30} h={8} f={f} speed={-0.4} seed={8} color="#8a2a16" lit="#f07a30" opacity={0.7} order={2} />
  <JaggedFire f={f} x0={-10} x1={10} z={-8} base={-4} h={[2.5, 4.5]} n={12} pal={FIRE_WALL} step={3} seed={13} order={2} />
  <Mephisto pos={FACE.mephisto} f={f} h={FACE.h} pose={pose} order={4} />
  <JaggedFire f={f + 3} x0={-6} x1={6} z={3} base={-2.2} h={[0.7, 1.4]} n={10} pal={FIRE_WALL} step={3} seed={12} order={60} />
  <Glow2 />
  <Embers f={f} box={[-4, 4, -2, 4, 1, 5]} n={36} size={0.03} life={50} seed={2} color="#ffe0a0" />
</>;
const Glow2: React.FC = () => <Halo pos={[1.2, -0.6, 1.5]} r={3.2} color="#ff7a2a" strength={0.35} order={59} />;
const MephistoFace: React.FC = () => <Frame><MephistoFaceStage f={40} /></Frame>;

/** MEPHISTO ON SHOW (store preview): upper body, arms in two poses, on a plain fire stage. */
const SHOW_EYE: V3 = [0, 3.2, 17];
const MephistoShow: React.FC = () => { const f = 40;
  return <Frame>
    <StageCam eye={SHOW_EYE} haze="#c8562a" fog={[400, 900]} />
    <Plate from={SHOW_EYE} id="meph3-show-sky2" d={60} paint={sky} fog={false} />
    <Mephisto pos={[0, -0.4, 0]} f={f} h={7.2} pose={{armL: MEPH_POSES.raise, armR: MEPH_POSES.beckon, nod: 0.15, jaw: 0.3, grin: 0.8, squint: 0.2, gaze: [0, 0.2]}} order={4} />
    <JaggedFire f={f} x0={-8} x1={8} z={0.8} base={-0.5} h={[0.8, 1.6]} n={16} pal={FIRE_WALL} step={3} seed={31} order={60} />
    <Embers f={f} box={[-6, 6, 0, 8, -1, 2]} n={40} size={0.04} life={50} seed={2} color="#ffcf70" />
  </Frame>; };

/** A 48-FRAME MOTION TEST (to look at as nine frames): breathing, the head bowing and tilting, the jaw opening into a laugh, the
 *  fingers of the raised hand fanning out one by one and curling back, hair and cape stirring. */
export const motionTestPose = (f: number): MephistoPose => {
  const sp = (i: number) => 0.7 + 0.8 * ease((f - 14 - i * 3) / 6) - 0.5 * ease((f - 34 - i * 2) / 6);
  return {...FACE_POSE, nod: lerp(0.1, 0.55, ease((f - 4) / 12)), tilt: lerp(-3, 6, ease((f - 4) / 14)), jaw: f < 22 ? lerp(0.05, 0.45, ease((f - 10) / 10)) : 0.25 + 0.3 * Math.abs(Math.sin((f - 22) * 0.45)),
    squint: lerp(0.1, 0.6, ease((f - 8) / 10)), gaze: [lerp(0, -0.8, ease((f - 4) / 10)), lerp(0, 0.6, ease((f - 4) / 10))], wind: 0.8,
    armL: {bare: true, shadow: 1, sh: lerp(92, 100, ease((f - 6) / 14)), el: lerp(110, 132, ease((f - 6) / 14)), wrist: lerp(-10, -30, ease((f - 6) / 14)), spread: [0, 1, 2, 3, 4].map(sp), curl: [0, 1, 2, 3, 4].map((i) => 0.6 * ease((f - 34 - i * 2) / 6))}};
};
const MotionTest: React.FC = () => { const f = useCurrentFrame(); return <Frame><MephistoFaceStage f={f} pose={motionTestPose(f)} /></Frame>; };
/** the realm alone: shot 13 at frame 4, the cage empty (store) */
const RealmEmpty: React.FC = () => <Frame><CoiLua f={4} plan={coiLuaShot13(4)} /></Frame>;
export const CoiLuaComps: React.FC = () => (
  <>
    <Composition id="coi-lua-trong" component={RealmEmpty} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="mephisto-can-mat" component={MephistoFace} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="mephisto-bong" component={MephistoShow} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="mephisto-thu-dong" component={MotionTest} width={1280} height={720} fps={24} durationInFrames={48} />
  </>
);
