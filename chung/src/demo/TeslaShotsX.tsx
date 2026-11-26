import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import {Finish} from '../lib3/look';
import {MapInsert, B} from '../lib3/kit';
import {act, blink} from '../mould/act';
import type {Key} from '../mould/act';
import {perform} from '../mould/gestures';
import type {Beat} from '../mould/gestures';
import {headSpan} from '../mould/draw';
import type {Spec, Expr} from '../mould/draw';
import {EDISON, TESLA_LAB, HEIGHT} from '../episodes/teslaCast';
import {Lab, LAB_VIEWS, LAB_MARKS} from './Lab';
import type {LabLayer, LabViewSpec, MachineState} from './Lab';
import {FrameOv, useF, look, Fig, arm, Canvas, LampDust} from './LabLop';

/** Shots 4-8 of episodes/tesla-danh-sach-canh.md ("Tesla và Edison"), set X: Edison's works = the laboratory at night
 *  (src/demo/Lab.tsx, state 'night', unchanged). Same helpers as the Doom passage's lab shots (src/demo/DaiHoc.tsx).
 *  Axis for the whole passage: Tesla on the LEFT of frame, Edison on the RIGHT, looking screen left (flipped). */
type V3 = [number, number, number];
const W = 1280, H = 720;
const clamp = (x: number) => Math.min(1, Math.max(0, x));

type LabArgs = {view: LabViewSpec; f: number; dx?: number; dz?: number; machine?: MachineState; extra?: React.ReactNode};
/** One shot in the lab ('night'). soft = blur of the set in pixels (0 = one sharp picture); fg = a near prop on its own canvas. */
const LabShotX: React.FC<{lab: LabArgs; figures?: React.ReactNode; soft?: number; fg?: React.ReactNode; fgSoft?: number}> = ({lab, figures, soft = 0, fg, fgSoft = 3}) => {
  const L = (layer: LabLayer, kids?: React.ReactNode) => <Lab view={lab.view} f={lab.f} dx={lab.dx} dz={lab.dz} machine={lab.machine} extra={lab.extra} fg={fg} layer={layer}>{kids}</Lab>;
  if (!soft && !fg) return <AbsoluteFill><Finish warm=""><Canvas>{L('all', figures)}</Canvas></Finish></AbsoluteFill>;
  return (
    <AbsoluteFill><Finish warm="">
      <AbsoluteFill style={soft ? {filter: `blur(${soft}px)`, transform: 'scale(1.012)'} : undefined}><Canvas>{L('back', figures)}</Canvas></AbsoluteFill>
      {figures ? <AbsoluteFill><Canvas alpha>{L('figures', figures)}</Canvas></AbsoluteFill> : null}
      {fg ? <AbsoluteFill style={{filter: `blur(${fgSoft}px)`}}><Canvas alpha>{L('front')}</Canvas></AbsoluteFill> : null}
    </Finish></AbsoluteFill>
  );
};

/** A camera on one person's HEAD in the turned room: the head fills `frac` of the frame height, its centre lands at screen
 *  (sx, sy) (0..1 across, 0..1 down), the room turned by yaw. The inverse of labScreen; head size from the mould (headSpan),
 *  then checked on the picture (skill 3: the formula can be off). */
const viewOn = (at: V3, height: number, spec: Spec, o: {yaw: number; frac: number; sx: number; sy: number}): LabViewSpec => {
  const hs = headSpan(spec), head = height * hs.size, hy = at[1] + height * (hs.top - hs.size / 2), D = head / (o.frac * 0.4986);
  const s = Math.sin(o.yaw), c = Math.cos(o.yaw), X = (o.sx - 0.5) * 0.887 * D;
  return {yaw: o.yaw, cam: [at[0] - s * D - c * X, at[2] + c * D - s * X], eye: hy + (o.sy - 0.5) * 0.4986 * D};
};
/** a room point `fwd` metres from p towards the lens of view v and `left` metres to screen left (for a light on the lens side) */
const lensSide = (v: LabViewSpec, p: V3, fwd: number, left: number, up: number): V3 => {
  const s = Math.sin(v.yaw), c = Math.cos(v.yaw);
  return [p[0] - s * fwd - c * left, p[1] + up, p[2] + c * fwd - s * left];
};
const keysOf = (beats: Beat[], extra: Key[], flip: boolean) => [...perform(beats, flip ? {dirDefault: -1, mirror: true} : {}), ...extra].sort((a, b) => a.f - b.f);

/** shots 4-5: by the machine's console. The set's mark victorLever [3.42, 0, 2.75] was checked in the 'dark' state, where the
 *  stool is pushed aside; in 'night' the stool stands at [3.4, 0, 3.0], right in front of his shins. Moved 0.27 m left and
 *  0.3 m back: plinth's front-right corner 0.7 m behind-left, desk's front-left corner 0.55 m to his right, stool 0.6 m in front
 *  and to the right. */
const TESLA_AT: V3 = [3.15, 0, 2.45];
const EDISON_AT = LAB_MARKS.victorDesk;   // shots 4, 7, 8: behind the desk
/** the machine "idling" in shot 4: 3 lamps, a faint glow on a few coils. The list says coils "about 0.3"; coils is a COUNT of
 *  the eight coils (kitLab Machine), so 0.3 is read as 0.3 x 8 = 2 coils, 0.9 as 7. */
const IDLE: MachineState = {lamps: 3, coils: 2};
/** A stack of three books (four in shot 7: the third alone left the photograph's top edge showing) on the desk's front-left corner (all shots of this set, so it is there in the wides too): in the close
 *  on Edison (shot 7) it stands between the lens and the Doom passage's photograph of the mother, which the list says must not
 *  be seen close. Spines toward the lens, cream page edges. */
const DeskBooks: React.FC<{tall?: boolean}> = ({tall}) => (
  <group position={[3.86, 0.8, 2.47]} rotation={[0, 0.3, 0]}>
    {([[0.34, 0.07, 0.25, '#5a2e2a', 0], [0.3, 0.06, 0.22, '#2e4a6a', -0.12], [0.32, 0.08, 0.24, '#6a5a32', 0.1], ...(tall ? [[0.27, 0.06, 0.2, '#3d5a3a', -0.05]] : [])] as [number, number, number, string, number][])
      .reduce<[number, React.ReactNode[]]>(([y, acc], [w, h, d, c, r], i) => [y + h, [...acc, <group key={i} position={[0, y + h / 2, 0]} rotation={[0, r, 0]}><B p={[0, 0, 0]} s={[w, h, d]} c={c} /><B p={[0.005, 0, d / 2 + 0.002]} s={[w - 0.02, h - 0.012, 0.004]} c="#e8dcc0" cast={false} /></group>]], [0, []])[1]}
  </group>
);

// ---------------------------------------------------------------- Edison reading at the desk (shots 4 and 8)
const READ: Expr = {...({upper: 'flat', lidL: [-30, -30], lidR: [-30, -30], brow: 'angry', browY: 16, mouth: 'flat'} as Expr), gaze: look(true, -8, 34)};
const EDISON_READ: Spec = {...EDISON, expr: READ, head: {dy: 6}};

// ---------------------------------------------------------------- shot 4: "Nikola Tesla, một kĩ sư trẻ làm cho ông," (52)
// The set's own wide, sliding left 2 %. Tesla (flipped, facing screen left) at the console, delighted, points at it (f4, a big
// move: arrives about f16); f30 his eyes go to Edison (screen right), the hand stays; f40 he shifts his weight. Edison behind
// the desk reads, never looks up; f26 his head sinks a little more.
const T4_BASE: Spec = {...TESLA_LAB, expr: {...({upper: 'none', lower: 'curve', lowerAmt: 2.6, brow: 'arc', browY: -6, mouth: 'up'} as Expr), gaze: look(true, -42, 10)}};
const T4_KEYS = keysOf([{f: 4, pose: 'point', big: true}, {f: 40, body: 'shift', dir: -1}],
  [{f: 30, expr: {gaze: look(true, 44, 2), mouth: 'open'}}, {f: 34, expr: {mouth: 'up'}}], true);
const E4_KEYS: Key[] = [{f: 26, head: {dy: 10}, inb: 1}, {f: 44, expr: {gaze: look(true, -2, 36)}}];
export const Tx04: React.FC = () => {
  const f = useF(), t = f / 51, v = LAB_VIEWS.wide;
  const tesla = blink(act(T4_BASE, T4_KEYS, f, {seed: 4}), f, [22], 'half'), edison = blink(act(EDISON_READ, E4_KEYS, f, {seed: 5, live: 0.7}), f, [38], 'half');
  return <LabShotX lab={{view: v, f, dx: -0.12 * t, machine: IDLE, extra: <><LampDust f={f} /><DeskBooks /></>}}
    figures={<><Fig v={v} at={TESLA_AT} spec={tesla} height={HEIGHT.tesla} flip /><Fig v={v} at={EDISON_AT} spec={edison} height={HEIGHT.edison} flip /></>} />;
};

// ---------------------------------------------------------------- shot 5: "có cách khác:" (36)
// Medium close on Tesla, head about 40 % of the frame, left of centre, the ring and its coils soft on the left, the plans soft
// behind. f0 thinking (eyes up); f8 the idea: brows up, eyes wide (shock), happy at f12; f8 the finger goes up (screen-right arm,
// a big move, arrives about f22); f24 eyes to screen right (Edison, off frame) and he speaks 10 frames. The coils come up from 2
// to 7 and the last two lamps light between f10 and f22; a cyan light on the lens side, left, rises with them onto his face.
export const V5: LabViewSpec = viewOn(TESLA_AT, HEIGHT.tesla, TESLA_LAB, {yaw: 0.45, frac: 0.4, sx: 0.4, sy: 0.42});
const THINK: Expr = {upper: 'flat', lidL: [-46, -46], lidR: [-46, -46], brow: 'arc', browY: -4, mouth: 'flat', gaze: look(true, 6, -26)};
const T5_BASE: Spec = {...TESLA_LAB, expr: THINK};
const T5_KEYS: Key[] = [
  {f: 8, expr: {upper: 'none', lidL: undefined, lidR: undefined, pupil: 'dot', brow: 'none', mouth: 'o', gaze: look(true, 10, -20)}, head: {dy: -6}},   // shock: the idea
  {f: 8, armL: arm(104, 48, 'point'), inb: 2},                                                                                                        // the finger up (flipped: armL is on screen right); arrives about f22
  {f: 12, expr: {upper: 'none', pupil: undefined, lower: 'curve', lowerAmt: 3, brow: 'arc', browY: -2, mouth: 'up'}, head: {dy: 0}},
  {f: 24, expr: {gaze: look(true, 38, -2), mouth: 'o'}, head: {dy: 4}}, {f: 26, expr: {mouth: 'flat'}}, {f: 28, expr: {mouth: 'o'}}, {f: 30, expr: {mouth: 'flat'}, head: {dy: 0}}, {f: 32, expr: {mouth: 'o'}}, {f: 34, expr: {mouth: 'flat'}},
];
const rise5 = (f: number) => clamp((f - 10) / 12);
export const Tx05: React.FC = () => {
  const f = useF(), t = f / 35, k = rise5(f);
  const tesla = blink(act(T5_BASE, T5_KEYS, f, {seed: 6}), f, [30], 'blank');
  const machine: MachineState = {lamps: f >= 16 ? 5 : f >= 12 ? 4 : 3, coils: 2 + Math.round(5 * k)};
  const cyan = <pointLight position={lensSide(V5, [TESLA_AT[0], 1.4, TESLA_AT[2]], 0.9, 0.6, 0)} color="#6fe0ff" intensity={0.5 + 3.2 * k} distance={2.6} decay={2} />;
  return <LabShotX lab={{view: V5, f, dz: -0.1 * t, machine, extra: <DeskBooks />}} soft={1.6}
    figures={<><Fig v={V5} at={TESLA_AT} spec={tesla} height={HEIGHT.tesla} flip />{cyan}</>} />;
};

// ---------------------------------------------------------------- shot 6: "dòng điện xoay chiều, đi xa hàng trăm cây số." (72)
// The map pinned over the calculation sheet on the blackboard, filling most of the frame, lit by a warm light from the lens
// side. f2 a tiny red ring round New York and "một chiều"; f14-50 the blue wave draws itself out through the six towns, each
// popping into a yellow light as it arrives; f52 "xoay chiều"; held to the end, the lights twinkle. Push in 1 %.
export const MAP = {x: 5.93, y: 1.72, w: 0.9, h: 0.58, z: 0.075};
const V6: LabViewSpec = {yaw: 0, cam: [MAP.x, MAP.z + 1.25], eye: MAP.y};
export const Tx06: React.FC = () => {
  const f = useF(), t = f / 71;
  const extra = <>
    <MapInsert f={f} x={MAP.x} y={MAP.y} w={MAP.w} h={MAP.h} z={MAP.z} />
    <pointLight position={[MAP.x - 0.25, MAP.y + 0.35, 1.1]} color="#ffd9a6" intensity={2.0} distance={2.6} decay={2} />
  </>;
  return <LabShotX lab={{view: V6, f, dz: -0.0125 * t, machine: IDLE, extra}} />;
};

// ---------------------------------------------------------------- shot 7: "Edison gạt đi." (36)
// Close on Edison, head about 50 %, right of centre (he looks screen left, at Tesla), still camera. f0 a sidelong look left,
// lids half down (bored); f6 the smirk; f12 the brush-off: the screen-left hand (flipped: armR) flung out sideways, fast, to
// the left at shoulder height (the list wants it low at the bottom edge, but there the desk and its books hide it); f22 a slow blink and his eyes drop to the desk; f20-26 the hand comes back in across the
// chest (elbow target 360, the inward way: skill 3).
export const V7: LabViewSpec = viewOn(EDISON_AT, HEIGHT.edison, EDISON, {yaw: 0.3, frac: 0.5, sx: 0.62, sy: 0.44});
const E7_BASE: Spec = {...EDISON, expr: {...({upper: 'flat', lidL: [6, 6], lidR: [6, 6], brow: 'arc', browY: 10, mouth: 'flat'} as Expr), gaze: look(true, -36, 6)}};
const E7_KEYS: Key[] = [
  {f: 6, expr: {mouth: 'smirk', lidL: [14, 10], lidR: [8, 14], browY: 14}, head: {dy: 3}},
  {f: 8, armR: arm(30, -100, 'open'), inb: 1},                                   // the wind-up: the hand comes up in front of the chest
  {f: 12, armR: arm(96, 12, 'back'), fast: true, inb: 2, head: {dy: -3}, kick: 0.1},   // the flick out to screen left at shoulder height: lower (sh 78) the hand stayed hidden behind the desk books
  {f: 20, armR: arm(26, -120, 'relaxed'), inb: 1},                               // back in across the chest
  {f: 22, expr: {closed: true}, head: {dy: 6}},
  {f: 26, armR: arm(6, 360, 'relaxed'), expr: {closed: false, gaze: look(true, -10, 60), lidL: [12, 12], lidR: [12, 12]}, head: {dy: 8}},
];
export const Tx07: React.FC = () => {
  const f = useF(), spec = act(E7_BASE, E7_KEYS, f, {seed: 7});
  return <LabShotX lab={{view: V7, f, machine: IDLE, extra: <DeskBooks tall />}} soft={1.6} figures={<Fig v={V7} at={EDISON_AT} spec={spec} height={HEIGHT.edison} flip />} />;
};

// ---------------------------------------------------------------- shot 8: "Tesla bỏ việc," (40)
// The wide of shot 4 again, still camera. The machine dead (lamps 0, coils 0), the desk lamp still on. Tesla (not flipped: he
// turns to go) starts between the desk and the door, tight-lipped, eyes ahead; from f2 he walks screen right (brisk: 1.9 m in 32 frames, a third faster than the reference pace) through the middle
// of the doorway into the lit corridor and out of the right edge of the frame (the door's near casing is outside the wide) by f36. Edison reads on; one blink at f30.
// The walk runs along the screen's sideways axis (place(), skill 3) and 0.45 m away from the lens, so that he passes the door
// in the middle of its opening (z about 3.1, 0.5 m from both casings) and not past its near edge.
const T8_START: V3 = [5.45, 0, 3.2];
const T8_LAT = 1.9, T8_DEPTH = 0.47, T8_WALK = Math.round((T8_LAT * 1191) / HEIGHT.tesla);   // metres across the screen -> mould units
const T8_BASE: Spec = {...TESLA_LAB, expr: {...({upper: 'angry', lidL: [-44, -24], lidR: [-44, -24], lower: 'curve', lowerAmt: 0.6, brow: 'angry', browY: 34, mouth: 'flat'} as Expr), gaze: look(false, 4, 4)}};
const T8_KEYS = keysOf([{f: 2, body: 'walk', dist: T8_WALK, over: 32, dir: 1}], [], false);
const E8_KEYS: Key[] = [{f: 14, head: {dy: 9}, inb: 1}];
export const Tx08: React.FC = () => {
  const f = useF(), v = LAB_VIEWS.wide;
  const tesla = act(T8_BASE, T8_KEYS, f, {seed: 8}), prog = clamp((tesla.x ?? 0) / T8_WALK);
  const edison = blink(act(EDISON_READ, E8_KEYS, f, {seed: 9, live: 0.6}), f, [30], 'half');
  return <LabShotX lab={{view: v, f, machine: {lamps: 0, coils: 0}, extra: <><LampDust f={f} /><DeskBooks /></>}}
    figures={<><Fig v={v} at={T8_START} spec={tesla} height={HEIGHT.tesla} depth={T8_DEPTH * prog} /><Fig v={v} at={EDISON_AT} spec={edison} height={HEIGHT.edison} flip /></>} />;
};

export const TX_SHOTS = [
  {id: 'tesla-04', C: Tx04, frames: 52}, {id: 'tesla-05', C: Tx05, frames: 36}, {id: 'tesla-06', C: Tx06, frames: 72},
  {id: 'tesla-07', C: Tx07, frames: 36}, {id: 'tesla-08', C: Tx08, frames: 40},
];

/** Check sheets: rows of shots, several frames side by side, one render for several frames. */
const sheet = (rows: {C: React.FC; at: number[]}[]): React.FC => () => (
  <AbsoluteFill style={{flexDirection: 'column'}}>{rows.map(({C, at}, r) => (
    <div key={r} style={{display: 'flex', flexDirection: 'row'}}>{at.map((fr) => <div key={fr} style={{position: 'relative', width: W, height: H, overflow: 'hidden'}}><FrameOv.Provider value={fr}><C /></FrameOv.Provider></div>)}</div>
  ))}</AbsoluteFill>
);
const CHECKS: {id: string; rows: {C: React.FC; at: number[]}[]}[] = [
  {id: 'tesla-x-chk-48', rows: [{C: Tx04, at: [0, 26, 51]}, {C: Tx08, at: [0, 20, 36]}]},
  {id: 'tesla-x-chk-6', rows: [{C: Tx06, at: [8, 36, 71]}]},
  {id: 'tesla-x-chk-5', rows: [{C: Tx05, at: [8, 22, 35]}]},
  {id: 'tesla-x-chk-7', rows: [{C: Tx07, at: [0, 14, 35]}]},
];
const CHECK_C = CHECKS.map(({id, rows}) => ({id, C: sheet(rows), n: rows.length}));
export const TeslaShotsXComps: React.FC = () => (
  <>
    {TX_SHOTS.map(({id, C, frames}) => <Composition key={id} id={id} component={C} width={W} height={H} fps={24} durationInFrames={frames} />)}
    {CHECK_C.map(({id, C, n}) => <Composition key={id} id={id} component={C} width={W * 3} height={H * n} fps={24} durationInFrames={1} />)}
  </>
);
