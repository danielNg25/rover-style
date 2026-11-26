import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Composition, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Finish} from '../lib3/look';
import {ShotCtx} from '../lib3/depth';
import {Motes, AutoRecv} from '../lib3/kit';
import {Arc} from '../lib3/fx';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import {act, blink} from '../mould/act';
import type {Key} from '../mould/act';
import {perform} from '../mould/gestures';
import type {Spec, ArmPose, Expr} from '../mould/draw';
import {NyStreet, NY_VIEWS, NY_MARKS, DIGGER_A, DIGGER_B, powerShot1, powerShot2, powerShot3} from './NyStreet';
import type {NyView, NyTime} from './NyStreet';
import type {NyPower} from '../lib3/kitNyStreet';
import {EDISON, TESLA_WORN, WESTINGHOUSE, HEIGHT, extra, coatArms} from '../episodes/teslaCast';

/** Shots 1, 2, 3 (night) and 9, 10 (day) of episodes/tesla-danh-sach-canh.md, filmed in set PH (src/demo/NyStreet.tsx), after
 *  the stage notes out/tesla/ghi-chu-san-khau-PH.md. One component per shot (no props), the table TESLA_PH_SHOTS, and
 *  TeslaShotsPHComps that registers them plus the check sheets.
 *  The shots are drawn by PHShot below, a copy of lib3/shot's sharp path with a FIXED canvas size (lib3/shot takes its size
 *  from the composition, so it cannot be laid out several to a check sheet). */
type V3 = [number, number, number];
const W = 1280, H = 720;
const clamp = (x: number) => Math.min(1, Math.max(0, x));

/** the check sheets render several frames of a shot side by side by overriding the frame through this context */
const FrameOv = createContext<number | null>(null);
const useF = () => { const o = useContext(FrameOv), f = useCurrentFrame(); return o ?? f; };
/** gaze in SCREEN terms (x > 0 = towards screen right); a flipped figure is mirrored, so its sign is turned */
const look = (flip: boolean, x: number, y: number): [number, number] => [flip ? -x : x, y];
const arm = (sh: number, el: number, hand: ArmPose['hand'] = 'open', extraArm: Partial<ArmPose> = {}): ArmPose => ({sh, el, wrist: 0, hand, ...extraArm});
const HANG = arm(6, 0, 'relaxed');

/** One sharp shot of the street: the set at view `view`, camera eye + (dx, dz). */
const PHShot: React.FC<{time: NyTime; view: NyView; f: number; power?: NyPower; pull?: number; dx?: number; dz?: number; people?: boolean; children?: React.ReactNode}> =
  ({time, view, f, power, pull, dx = 0, dz = 0, people = true, children}) => {
    const eye = NY_VIEWS[view].eye, day = time === 'ngay';
    return (
      <AbsoluteFill><Finish {...(day ? {warm: '#e8d6b0', warmAmount: 0.12} : {warm: ''})}>
        <ThreeCanvas width={W} height={H} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv />
          <ShotCtx.Provider value={{eye}}>
            <NyStreet time={time} view={view} f={f} power={power} pull={pull} dx={dx} dz={dz} people={people}>{children}</NyStreet>
          </ShotCtx.Provider>
        </ThreeCanvas>
      </Finish></AbsoluteFill>
    );
  };

// ---------------------------------------------------------------- shot 1: "Cuối thế kỉ mười chín, Edison" (54)
// View a, at the station's door, pushing in 2 %. Edison left of the switch, smirking at it; f6 he reaches up to the handle (a
// big move held to 14 frames, there about f20); f24 the pull, fast, the body dips with it, the switch goes down in 3 frames;
// f26-27 a spark at the blades; f27 the station's lights (powerShot1); f30 he straightens with the hand left on the switch;
// f32 a smile, eyes up to the lamp over the door; from f34 the street lamps come on, one every 5 frames; moths from f36.
// The mark is moved 0.12 m to screen right of the set's [9.98, 0, 0.62]: from there the hand cannot follow the handle down
// (it ends 0.57 m right of his centre and 0.4 m below his shoulder, beyond the mould's arm), see the report.
const EDISON_AT: V3 = [NY_MARKS.edison[0] + 0.12, NY_MARKS.edison[1], NY_MARKS.edison[2]];
const REACH_UP = arm(114, 8, 'grip');      // the hand on the handle when it is up (the set's still)
const PULLED = arm(66, 4, 'grip');          // the hand on the handle when it is down
const E1_BASE: Spec = {...EDISON, expr: {...EXPR.smirk, gaze: look(false, 36, 6)}, armL: HANG, armR: HANG};
const E1_KEYS: Key[] = [
  {f: 6, armR: REACH_UP, inb: 6, head: {dy: 4}, kick: 0.06},                                  // the reach: 14 frames, there at f20
  {f: 24, armR: PULLED, fast: true, inb: 1, y: -24, head: {dy: 10}, kick: 0.1},               // the pull
  {f: 30, y: 0, head: {dy: -4}},                                                              // stands straight, hand still on it
  {f: 32, expr: {...EXPR.smile, gaze: look(false, 26, -34)}},                                 // smiles up at the lamp
  {f: 44, head: {dy: -6}},
];
const pull1 = (f: number) => (f < 24 ? 0 : clamp((f - 24) / 3));
export const Tesla01: React.FC = () => {
  const f = useF(), t = f / 53, spec = blink(act(E1_BASE, E1_KEYS, f, {seed: 1}), f, [46], 'half');
  const lamp: V3 = [10.85, 2.98, 0.62];
  return (
    <PHShot time="dem" view="a" f={f} power={powerShot1(f)} pull={pull1(f)} dz={-0.17 * t}>
      <Puppet3 height={HEIGHT.edison} pos={EDISON_AT} res={3} spec={spec} />
      {f >= 26 && f <= 27 ? <>
        <Arc a={[10.44, 0.78, 0.14]} b={[10.44, 0.6, 0.14]} f={f} on={1} seed={1} color="#d8f2ff" width={0.014} />
        <Arc a={[10.66, 0.78, 0.14]} b={[10.66, 0.6, 0.14]} f={f} on={1} seed={2} color="#d8f2ff" width={0.014} />
      </> : null}
      {f >= 36 ? <Motes f={f} box={[lamp[0] - 0.45, lamp[0] + 0.45, lamp[1] - 0.3, lamp[1] + 0.35, lamp[2] + 0.05, lamp[2] + 0.35]} n={Math.min(7, 2 + Math.floor((f - 36) / 3))} color="#f2dfb0" size={0.016} drift={0.18} glow={0.25} seed={11} /> : null}
    </PHShot>
  );
};

// ---------------------------------------------------------------- shot 2: "thắp sáng New York bằng dòng điện một chiều." (58)
// View b, high down Pearl Street, pushing in about 2 % of the way to the line of light (1 m of 50). Block 1 already lit;
// blocks 2 then 3 come on by depth from f4, a step every 3 frames (powerShot2). The set's four passers-by look up at the lamps.
export const Tesla02: React.FC = () => {
  const f = useF(), t = f / 57;
  return <PHShot time="dem" view="b" f={f} power={powerShot2(f)} dz={-1.0 * t} />;
};

// ---------------------------------------------------------------- shot 3: "Nhưng điện của ông chỉ đi xa được vài dãy phố." (56)
// View c, at the last lamp looking into the dark, sliding right (dx to +0.4, the most the stage notes allow) the way the wire
// goes. The last lamp flickers, out at f18 and f41 (powerShot3); a few moths round its globe. No one in the shot.
export const Tesla03: React.FC = () => {
  const f = useF(), t = f / 55, g: V3 = [-4.85, 4.32, -104];
  return (
    <PHShot time="dem" view="c" f={f} power={powerShot3(f)} dx={0.4 * t}>
      <Motes f={f} box={[g[0] - 0.5, g[0] + 0.5, g[1] - 0.45, g[1] + 0.35, g[2] + 0.2, g[2] + 0.6]} n={6} color="#ecd3a0" size={0.03} drift={0.22} glow={0.2} seed={13} />
    </PHShot>
  );
};

// ---------------------------------------------------------------- shot 9: "đi đào mương kiếm sống," (44)
// View d, low along the ditch, pulling back 2 % (dz to +0.35). Tesla in the ditch, worn clothes, sad, eyes down; f6 the shoulders
// drop; f16 hands to the hips (14 frames); f30 he looks up to screen right, the brows knit, the head comes up a little.
// The two diggers shift their weight slowly (the set's people are switched off and re-placed here with a moving hold), earth
// flies from them (the set's DirtThrow), dust in the sun.
const T9_BASE: Spec = {...TESLA_WORN, expr: {...EXPR.sad, gaze: [0, 30]}, armL: HANG, armR: HANG};
const HIP = arm(38, -78, 'fist');
const RESOLVE: Partial<Expr> = {upper: 'flat', lidL: [-44, -36], lidR: [-44, -36], lower: undefined, brow: 'angry', browY: 26, mouth: 'flat', gaze: look(false, 34, -26)};
const T9_KEYS: Key[] = [
  {f: 6, y: -26, head: {dy: 18, rot: 4}, inb: 1},                                             // slump
  {f: 16, armL: HIP, armR: HIP, inb: 6, kick: 0.05},                                          // hands on the hips, there about f30
  {f: 30, expr: RESOLVE, head: {dy: 4, rot: 0}, y: -10},                                     // looks up, set
  {f: 38, head: {dy: 2}},
];
const D_A = perform([{f: 10, body: 'shift'}, {f: 34, body: 'shift', dir: 1}], {dirDefault: -1, mirror: true});
const D_B = perform([{f: 20, body: 'shift', dir: 1}], {dirDefault: 1});
export const Tesla09: React.FC = () => {
  const f = useF(), t = f / 43, ditch = NY_MARKS.teslaDitch;
  const spec = blink(act(T9_BASE, T9_KEYS, f, {seed: 9}), f, [22], 'half');
  return (
    <PHShot time="ngay" view="d" f={f} dz={0.35 * t} people={false}>
      {/* the set's day people, as in NyStreet, but with a moving hold */}
      <Puppet3 height={HEIGHT.extra} pos={[6.5, 0, -51]} flip spec={act(extra('#3a3a44', '#2a2420'), [], f, {seed: 21, live: 0.6})} />
      <Puppet3 height={HEIGHT.extraShort} pos={[-6.6, 0, -86]} spec={act(extra('#5a4a3a', '#6b4a2a', 'sweep'), [], f, {seed: 22, live: 0.6})} />
      <Puppet3 height={HEIGHT.extra} pos={[6.4, 0, -94]} flip spec={act(extra('#2e3a4a', '#1f1c22'), [], f, {seed: 23, live: 0.6})} />
      <Puppet3 height={HEIGHT.extra} pos={[ditch[0], ditch[1], -56]} flip spec={blink(act(DIGGER_A, D_A, f, {seed: 24, live: 0.7}), f, [28], 'half')} />
      <Puppet3 height={HEIGHT.extraShort} pos={[ditch[0], ditch[1], -64]} spec={blink(act(DIGGER_B, D_B, f, {seed: 25, live: 0.7}), f, [8], 'half')} />
      <Puppet3 height={HEIGHT.tesla} pos={ditch} res={3} spec={spec} />
      <Motes f={f} box={[-6.2, -2.8, 0.1, 2.0, -66, -50]} n={18} color="#c8a882" size={0.025} drift={0.25} glow={0} seed={19} />
    </PHShot>
  );
};

// ---------------------------------------------------------------- shot 10: "rồi mang ý tưởng của mình tới Westinghouse." (60)
// View e, at the office door, sliding right 2 % (dx to +0.12). Tesla left (happy, eyes on Westinghouse): f2 a hand out to screen
// right, palm up (12 frames); f6-30 he talks (mouth flat and o, as the list asks); f30 a smile; f44 a broader one.
// Westinghouse right, flipped, arms crossed, sizing him up: f22 the brows go up (late after Tesla's words), f34 happy, f36 he
// uncrosses and holds out his screen-left hand (armR of a flipped figure) towards Tesla, palm up, there about f50. No touch.
const T10_BASE: Spec = {...TESLA_WORN, expr: {...EXPR.happy, gaze: look(false, 28, 2)}, armL: HANG, armR: HANG};
const TALK: Key[] = [6, 10, 14, 18, 22, 26].map((f, i): Key => ({f, expr: {mouth: i % 2 ? 'flat' : 'o'}}));
const T10_KEYS: Key[] = ([
  {f: 2, armR: arm(48, 52, 'open'), inb: 5, head: {dy: 5}},                                   // present, palm up, there about f14
  ...TALK,
  {f: 30, expr: {mouth: 'up' as const}, head: {dy: 0}},
  {f: 44, expr: {...EXPR.happy, lowerAmt: 3.4, gaze: look(false, 28, 2)}, head: {dy: -4}},   // a broader smile
  {f: 52, armR: arm(40, 56, 'open'), head: {dy: -2}},                                         // the hand eases a little
] as Key[]).sort((a, b) => a.f - b.f);
// the coat draws plain show:true arms UNDER its front, so crossed arms vanish (seen on the first check sheet); front: true lays them over it
const W_CROSS = {armL: {...coatArms('cross').armL, front: true}, armR: {...coatArms('cross').armR, front: true}};
const W10_BASE: Spec = {...WESTINGHOUSE, ...W_CROSS, expr: {...EXPR.neutral, brow: 'angry', browY: 10, gaze: look(true, -28, 0)}};
const W10_KEYS: Key[] = [
  {f: 22, expr: {upper: 'none', lidL: undefined, lidR: undefined, brow: 'arc', browY: -14}, head: {dy: -4}},   // the brows go up
  {f: 34, expr: {...EXPR.happy, gaze: look(true, -28, 0)}, head: {dy: 2}},
  {f: 36, armR: arm(48, 52, 'open', {show: true}), armL: arm(6, 0, 'relaxed', {show: true}), inb: 6, kick: 0.12},   // the hand held out
  {f: 54, head: {dy: 0}},
];
export const Tesla10: React.FC = () => {
  const f = useF(), t = f / 59;
  const tesla = blink(act(T10_BASE, T10_KEYS, f, {seed: 10}), f, [38], 'blank');
  const west = blink(act(W10_BASE, W10_KEYS, f, {seed: 11, live: 0.8}), f, [12, 50], 'half');
  return (
    <PHShot time="ngay" view="e" f={f} dx={0.12 * t}>
      <Puppet3 height={HEIGHT.tesla} pos={NY_MARKS.teslaOffice} res={3} spec={tesla} />
      <Puppet3 height={HEIGHT.westinghouse} pos={NY_MARKS.westOffice} res={3} flip spec={west} />
    </PHShot>
  );
};

export const TESLA_PH_SHOTS = [
  {id: 'tesla-01', C: Tesla01, frames: 54}, {id: 'tesla-02', C: Tesla02, frames: 58}, {id: 'tesla-03', C: Tesla03, frames: 56},
  {id: 'tesla-09', C: Tesla09, frames: 44}, {id: 'tesla-10', C: Tesla10, frames: 60},
];

/** Check sheets: rows of shots, several frames side by side, one render each (one canvas per frame; keep under ~14). */
const sheet = (rows: {C: React.FC; at: number[]}[]): React.FC => () => (
  <AbsoluteFill style={{flexDirection: 'column', background: '#000'}}>{rows.map(({C, at}, r) => (
    <div key={r} style={{display: 'flex', flexDirection: 'row'}}>{at.map((fr) => <div key={fr} style={{position: 'relative', width: W, height: H, overflow: 'hidden'}}><FrameOv.Provider value={fr}><C /></FrameOv.Provider></div>)}</div>
  ))}</AbsoluteFill>
);
const CHECKS: {id: string; rows: {C: React.FC; at: number[]}[]}[] = [
  {id: 'tesla-ph-chk-dem', rows: [{C: Tesla01, at: [0, 20, 26, 53]}, {C: Tesla02, at: [0, 20, 57]}, {C: Tesla03, at: [0, 18, 55]}]},
  {id: 'tesla-ph-chk-ngay', rows: [{C: Tesla09, at: [0, 16, 30, 43]}, {C: Tesla10, at: [0, 20, 44, 59]}]},
];
const CHECK_C = CHECKS.map(({id, rows}) => ({id, C: sheet(rows), n: rows.length, m: Math.max(...rows.map((r) => r.at.length))}));
export const TeslaShotsPHComps: React.FC = () => (
  <>
    {TESLA_PH_SHOTS.map(({id, C, frames}) => <Composition key={id} id={id} component={C} width={W} height={H} fps={24} durationInFrames={frames} />)}
    {CHECK_C.map(({id, C, n, m}) => <Composition key={id} id={id} component={C} width={W * m} height={H * n} fps={24} durationInFrames={1} />)}
  </>
);
