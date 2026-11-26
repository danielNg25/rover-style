import React from 'react';
import {Composition, useCurrentFrame} from 'remotion';
import {Shot} from '../lib3/shot';
import {Motes} from '../lib3/kit';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import {act, blink} from '../mould/act';
import type {Key} from '../mould/act';
import {POSES, perform} from '../mould/gestures';
import type {Spec, ArmPose, Expr} from '../mould/draw';
import {ChicagoFair, FAIR_VIEWS, FAIR_MARKS, FAIR_CROWD, powerShot11, powerShot12, powerShot13} from './ChicagoFair';
import {HomeCorner, HOME_EYE, homeShot14} from './HomeCorner';
import {TESLA_FAIR, WESTINGHOUSE, HEIGHT} from '../episodes/teslaCast';

/** Shots 11, 12, 13 (set HC, the Chicago fair, src/demo/ChicagoFair.tsx) and 14 (set NHA, the wall at home,
 *  src/demo/HomeCorner.tsx) of episodes/tesla-danh-sach-canh.md, after the stage notes out/tesla/ghi-chu-san-khau-HC-NHA.md.
 *  One component per shot (no props), the table TESLA_HC_SHOTS, and TeslaShotsHCComps that registers them.
 *  Axis of the passage: Tesla on the LEFT of frame, Westinghouse on the RIGHT (flipped), looking at each other across it. */
type V3 = [number, number, number];
/** gaze in SCREEN terms (x > 0 = towards screen right; y < 0 = up); a flipped figure is mirrored, so its sign is turned */
const look = (flip: boolean, x: number, y: number): [number, number] => [flip ? -x : x, y];
/** a coat figure's arm: the coat hides plain arms, so every arm carries show: true (front: true = drawn over the coat's front) */
const coatArm = (p: ArmPose, more: Partial<ArmPose> = {}): ArmPose => ({...p, show: true, ...more});
/** clears the face fields one expression sets and the next does not (as perform does), so faces do not leak into each other */
const RESET = {lidL: undefined, lidR: undefined, lower: undefined, lowerAmt: undefined, browY: undefined, pupil: undefined, blank: undefined, closed: undefined} as Partial<Expr>;
const face = (name: keyof typeof EXPR, gaze: [number, number], more: Partial<Expr> = {}): Partial<Expr> => ({...RESET, ...EXPR[name], gaze, ...more});

/** The waiting crowd of the set (FAIR_CROWD, backs to the camera), drawn here so that each can act: a moving hold for all,
 *  and per-person beats keyed by the index in FAIR_CROWD. */
const Crowd: React.FC<{f: number; beats: Record<number, Key[]>; live?: number}> = ({f, beats, live = 0.6}) => (
  <>{FAIR_CROWD.map((p, i) => <Puppet3 key={i} height={p.h} pos={p.pos} spec={act(p.spec, beats[i] ?? [], f, {seed: 40 + i, live})} />)}</>
);
const crowdAt = (x: number, z: number) => FAIR_CROWD.findIndex((p) => Math.abs(p.pos[0] - x) < 0.01 && Math.abs(p.pos[2] - z) < 0.01);

// ---------------------------------------------------------------- shot 11: "Năm 1893," (50)
// View a, high and wide from the head of the water, pushing in 2 % (dz to -0.4, the stage notes allow -1.5). Nothing lit; at
// frame 44 the one bulb on the dome's lantern flashes on (powerShot11). The crowd waits; now and then one shifts its weight.
const SHIFTS_11: Record<number, Key[]> = Object.fromEntries(
  [[3, 8, 1], [9, 18, -1], [14, 26, 1], [20, 12, -1], [24, 34, 1], [6, 40, -1]].map(([i, f, d]) => [i, perform([{f, body: 'shift', dir: d as 1 | -1}])]));
export const Tesla11: React.FC = () => {
  const f = useCurrentFrame(), t = f / 49;
  return <Shot grade="nightExterior" eye={FAIR_VIEWS.a.eye} dz={-0.4 * t} finish={{warm: ''}}
    set={(inside, cam) => <ChicagoFair view="a" f={f} power={powerShot11(f)} people={false} dx={cam.dx} dz={cam.dz}>{inside}</ChicagoFair>}
    figures={<Crowd f={f} beats={SHIFTS_11} live={0.5} />} />;
};

// ---------------------------------------------------------------- shot 12: "họ thắp sáng cả hội chợ Chicago ..." (96)
// View b, low behind the balustrade, pulling back 3 % (dz to +0.6). The lights come on by powerShot12 (the set's fairWave, all
// of the list's timings). The crowd: f20 a few heads come up (the mould cannot tilt a head seen from behind: a lean back with
// the head raised is the nearest), f46-50 three people near the camera jump for joy (hop: cheer does not read from behind), the others bounce.
const C12 = {a: crowdAt(2.8, -10.3), b: crowdAt(4.6, -10.6), c: crowdAt(9.2, -10.4), d: crowdAt(10.4, -11.2), e: crowdAt(12.2, -10.8), g: crowdAt(4.2, -11.6), h: crowdAt(10.6, -12.0)};
const headsUp = (f: number): Key[] => perform([{f, body: 'leanBack'}]).map((k) => (k.f === f - (f % 2) ? {...k, head: {dy: -10}} : k));
// The list asks for cheer (both arms up, fast). Tried on the first render: seen from behind the mould draws every arm under the
// hair disc, so only two small hands showed at the lower edge of the frame. Replaced by a joyful jump (hop, then a bounce),
// which reads from behind; see the report.
const CHEER = (f: number): Key[] => perform([{f, body: 'hop', big: true}, {f: f + 10, body: 'bounce'}]);
const BOUNCE = (f: number): Key[] => perform([{f, body: 'bounce'}, {f: f + 14, body: 'bounce'}]);
const BEATS_12: Record<number, Key[]> = {
  [C12.a]: [...headsUp(20), ...BOUNCE(50)],
  [C12.b]: [...headsUp(22), ...CHEER(48)],
  [C12.c]: [...headsUp(20), ...CHEER(46)],
  [C12.d]: [...headsUp(24), ...BOUNCE(52)],
  [C12.e]: [...headsUp(22), ...CHEER(50)],
  [C12.g]: BOUNCE(54),
  [C12.h]: BOUNCE(48),
};
export const Tesla12: React.FC = () => {
  const f = useCurrentFrame(), t = f / 95;
  return <Shot grade="nightExterior" eye={FAIR_VIEWS.b.eye} dz={0.6 * t} finish={{warm: ''}}
    set={(inside, cam) => <ChicagoFair view="b" f={f} power={powerShot12(f)} people={false} dx={cam.dx} dz={cam.dz}>{inside}</ChicagoFair>}
    figures={<Crowd f={f} beats={BEATS_12} />} />;
};

// ---------------------------------------------------------------- shot 13: (music, no words) (44)
// View c, the two-shot at shoulder height, soft background, pushing in 3 % (dz to -0.15). Everything burns (powerShot13).
// Tesla (left): f0 shock, eyes up to the buildings behind the camera; f10 happy; f18 a hand to his chest (screen-right arm, over
// the coat, ~12 frames); f30 his eyes go to Westinghouse (screen right).
// Westinghouse (right, flipped): f2 shock (mouth o), eyes up, 2 frames after Tesla; f14 happy, the broad smile; f16 both arms
// open (a big move, ~14 frames); f32 his eyes go to Tesla (screen left). Blinks 12 frames apart.
const HANG = coatArm(POSES.idle[0] as ArmPose);
const T13_BASE: Spec = {...TESLA_FAIR, expr: {...EXPR.shock, gaze: look(false, 0, -30)}, armL: HANG, armR: HANG};
const T13_KEYS: Key[] = [
  {f: 4, head: {dy: -4}},
  {f: 10, expr: face('happy', look(false, 4, -28)), head: {dy: 2}},
  {f: 18, armR: coatArm({sh: 44, el: -150, wrist: 0, hand: 'open'}, {front: true}), inb: 4, head: {dy: 5}, kick: 0.04},   // the hand to the chest, there about f30
  {f: 30, expr: face('happy', look(false, 48, 8)), head: {dy: 0}},                                      // eyes to Westinghouse
  {f: 38, head: {dy: -3}},
];
const W13_BASE: Spec = {...WESTINGHOUSE, expr: {...EXPR.neutral, gaze: look(true, 0, -24)}, armL: HANG, armR: HANG};
const W13_KEYS: Key[] = [
  {f: 2, expr: face('shock', look(true, 0, -30)), head: {dy: -5}},
  {f: 14, expr: face('happy', look(true, -2, -28), {lowerAmt: 3.4}), head: {dy: 2}},
  {f: 16, armL: coatArm(POSES.open[0] as ArmPose), armR: coatArm(POSES.open[1] as ArmPose), inb: 6, kick: 0.1},   // arms open, there about f30
  {f: 32, expr: face('happy', look(true, -48, 8), {lowerAmt: 3.4}), head: {dy: -2}},                              // eyes to Tesla
  {f: 40, head: {dy: 0}},
];
export const Tesla13: React.FC = () => {
  const f = useCurrentFrame(), t = f / 43;
  const tesla = blink(act(T13_BASE, T13_KEYS, f, {seed: 13}), f, [24], 'half');
  const west = blink(act(W13_BASE, W13_KEYS, f, {seed: 14, live: 0.8}), f, [36], 'half');
  return <Shot grade="nightExterior" eye={FAIR_VIEWS.c.eye} soft={1.6} dz={-0.15 * t} finish={{warm: ''}}
    set={(inside, cam) => <ChicagoFair view="c" f={f} power={powerShot13(f)} people={false} dx={cam.dx} dz={cam.dz}>{inside}</ChicagoFair>}
    figures={<>
      {/* the warm light of the lamps and buildings behind the camera, on their faces (a lamp on the lens side, skill 3) */}
      <pointLight position={[0, 2.4, -4.2]} color="#ffc77a" intensity={5} distance={8} decay={1.3} />
      <Puppet3 height={HEIGHT.tesla} pos={FAIR_MARKS.tesla} res={3} spec={tesla} />
      <Puppet3 height={HEIGHT.westinghouse} pos={FAIR_MARKS.westinghouse} res={3} flip spec={west} />
      <Motes f={f} box={[-2.2, 2.2, 0.6, 2.6, -9.5, -5.5]} n={18} color="#ffe2a0" size={0.012} drift={0.25} glow={0.35} seed={5} />
    </>} />;
};

// ---------------------------------------------------------------- shot 14: "Từ đó, điện trong nhà bạn là điện xoay chiều." (60)
// Set NHA, straight at the wall, pulling back 3 % (dz to +0.05). The set's plan homeShot14: dark to 6; the blue sine wave (the
// shared SineWave of lib3/kit, the same piece as the map of shot 6) runs out of the socket along the cable to the lamp 6-22;
// the lamp comes on at 22 and spreads over 6 frames; "~ 220 V" pops at 30; the wave keeps crawling along the cord to the end.
export const Tesla14: React.FC = () => {
  const f = useCurrentFrame(), t = f / 59, p = homeShot14(f);
  return <Shot grade="darkInterior" eye={HOME_EYE} dz={0.05 * t} finish={{warm: ''}}
    set={(inside, cam) => <HomeCorner f={f} lamp={p.lamp} wave={p.wave} label={p.label} dx={cam.dx} dz={cam.dz}>{inside}</HomeCorner>} figures={null} />;
};

export const TESLA_HC_SHOTS = [
  {id: 'tesla-11', C: Tesla11, frames: 50}, {id: 'tesla-12', C: Tesla12, frames: 96},
  {id: 'tesla-13', C: Tesla13, frames: 44}, {id: 'tesla-14', C: Tesla14, frames: 60},
];
export const TeslaShotsHCComps: React.FC = () => (
  <>{TESLA_HC_SHOTS.map(({id, C, frames}) => <Composition key={id} id={id} component={C} width={1280} height={720} fps={24} durationInFrames={frames} />)}</>
);
