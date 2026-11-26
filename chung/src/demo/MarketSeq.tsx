import React, {useMemo} from 'react';
import {AbsoluteFill, Composition, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Scene3, Ground, FacetLathe, GRADES, Finish, distanceFor} from '../lib3/look';
import {useSurface, useWear, Studs, Scatter} from '../lib3/detail';
import {Facade, Stall, Bunting, stageCast} from '../lib3/town';
import {Foliage, Pic2D} from '../lib3/flat';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import {act, blink, Key} from '../mould/act';
import {perform, lintBeats, Beat} from '../mould/gestures';
import type {Spec} from '../mould/draw';

/** A NEW SUBJECT as a moving sequence, built only from the shared libraries and rules (lib3 + mould + LUAT-CUTOUT3D-v3):
 *  a market stall, four people, three shot sizes. Nothing here is copied from a reference shot.
 *  Rules in use: characters on twos and pop-and-hold (A1-3), camera moving from frame 0 at constant speed with a slight
 *  roll (B8-11), wide sharp / close with a softer set (B14), hard cuts (C15), blink recipes (D18), staging in depth. */
type V3 = [number, number, number];
const H = 1.7, FOCUS: [number, number] = [0.1, -0.9], P = stageCast(FOCUS, 4, 3.0);
const RESET = {lidL: undefined, lidR: undefined, lower: undefined, lowerAmt: undefined, browY: undefined, pupil: undefined} as Partial<Spec['expr']>;
const W = (n: string): [string, number][] => n.split(',').map((s) => { const [k, w] = s.split(':'); return [`wares/w-${k}.png`, Number(w)]; });

const Set: React.FC<{gain: number; children?: React.ReactNode}> = ({gain, children}) => {
  const {scene} = useThree(); scene.background = useMemo(() => new THREE.Color(GRADES.dayExterior.bg), []);
  const cobbles = useSurface('stone', 6), gwear = useWear(5, 0.5, false);
  return (
    <Scene3 grade="dayExterior" gain={gain}>
      <Ground near="#bdb6a8" far="#9c968c" size={[60, 40]} swell={0.01} patch={0.05} farAt={0.6} pos={[0, 0, -8]} map={cobbles} tile={1.1} wear={gwear} />
      <Facade pos={[0.8, 0, -7.5]} w={18} h={11} color="#b9a48c" kind="plaster" cols={7} floors={4} seed={9} />
      <Facade pos={[-6.3, 0, -4.2]} w={4.6} h={7.2} color="#c9b48c" kind="plaster" shutters="#3f6a58" cols={2} floors={2} seed={2} sign="Books" />
      <Facade pos={[-1.7, 0, -4.6]} w={4.8} h={8} color="#a8523d" kind="brick" shutters="#2f4a6a" cols={3} floors={3} seed={3} awning={['#3f6a8a', '#f1ead8']} />
      <Facade pos={[3.2, 0, -4.2]} w={4.6} h={7} color="#d9cdb4" kind="stone" trim="#8a6a4a" shutters="#8a3a30" cols={2} floors={2} seed={5} sign="Cafe" awning={['#5a8f5a', '#f1ead8']} />
      <Facade pos={[7.9, 0, -4.6]} w={4.6} h={7.6} color="#9a5a48" kind="brick" shutters="#3a3f4a" cols={2} floors={3} seed={7} />
      <Stall pos={[FOCUS[0], 0, FOCUS[1]]} w={3.4} name="Bakery" seed={2} pics={W('loaf:0.62,cake:0.46,buns:0.56,roundLoaf:0.5,jar:0.3,jug:0.34')} shelf={W('bottle:0.17,jar:0.24,cheese:0.36,bottle:0.17,grapes:0.3,jug:0.26')} />
      <FacetLathe profile={[[0.3, 0], [0.34, 0.08], [0.36, 0.86], [0.4, 0.9], [0.4, 0.98], [0.26, 1.04]]} color="#3f6a58" pos={[-3.4, 0, 0.6]} tones={[0.8, 1, 1.18, 1.18, 0.9]} />
      <Studs pos={[-3.4, 0, 0.6]} r={0.365} y={0.8} n={12} />
      <FacetLathe profile={[[0.16, 0], [0.16, 0.12], [0.07, 0.2], [0.055, 2.9], [0.1, 2.96]]} sides={8} color="#2f3440" pos={[3.5, 0, -0.2]} />
      <FacetLathe profile={[[0.1, 2.96], [0.2, 3.02], [0.17, 3.32], [0.06, 3.4]]} sides={6} color="#f3e2a6" pos={[3.5, 0, -0.2]} contact={false} />
      <mesh position={[-3.7, 0.3, -1.0]} castShadow receiveShadow><boxGeometry args={[0.9, 0.6, 0.7]} /><meshLambertMaterial color="#b9a184" /></mesh>
      <Foliage pos={[-3.7, 0.55, -0.95]} w={1.0} h={1.9} shape="column" seed={3} />
      <mesh position={[4.3, 1.6, -2.4]} castShadow><boxGeometry args={[0.22, 3.2, 0.22]} /><meshLambertMaterial color="#5a4030" /></mesh>
      <Foliage pos={[4.3, 2.3, -2.3]} w={3.6} h={3.2} seed={6} />
      <Pic2D src="wares/w-pumpkin.png" w={0.62} pos={[-2.6, 0, 0.3]} /><Pic2D src="wares/w-pumpkin.png" w={0.42} pos={[-3.05, 0, 0.55]} flip />
      <Pic2D src="wares/w-flowers.png" w={0.5} pos={[2.75, 0.44, -0.55]} />
      <Bunting a={[-7, 5.6, -3.8]} b={[7.5, 5.8, -3.8]} sag={1.0} n={26} />
      <Scatter kind="street" area={[11, 3.4]} pos={[0, 0, 1.5]} seed={11} density={1.5} keep={P.map((q) => [q.x, q.z, 0.75] as [number, number, number])} />
      {children}
    </Scene3>
  );
};

// ---------- the cast: four people from the one mould, each with a palette ----------
const CAST: Spec[] = [
  {outfit: 'vest', hair: 'sweep', longLegs: true, build: 'adult', view: 'back', expr: EXPR.neutral, armL: {sh: 6, hand: 'relaxed'}, armR: {sh: 8, hand: 'relaxed'}, palette: {hair: '#3a2a22', hairLine: '#5a463c', vest: '#6a4a7a', shirt: '#e9e2d0', shirtEdge: '#cfc6ae', shirtRim: '#f4efe2', shorts: '#3f3a44', shoe: '#2a2428'}},
  {outfit: 'vest', hair: 'level', longLegs: true, build: 'adult', expr: {...EXPR.smile, gaze: [18, -6]}, armL: {sh: 8, hand: 'relaxed'}, armR: {sh: 8, hand: 'relaxed'}, palette: {hair: '#6b4a2a', hairLine: '#8a6a44', shirt: '#e8ecef', shirtEdge: '#c3ccd4', shirtRim: '#f6f8fa', vest: '#3f6a8a', shorts: '#4a4f5c', shoe: '#2a2c33', brow: '#3a2816'}},
  {outfit: 'vest', hair: 'sweep', longLegs: true, build: 'adult', expr: {...EXPR.smile, gaze: [-16, -4]}, armL: {sh: 8, hand: 'relaxed'}, armR: {sh: 8, hand: 'relaxed'}, palette: {skinA: '#c98f68', skinB: '#b98060', skinC: '#a87256', skin: '#b98060', hair: '#2a2420', vest: '#7a8f3a', shirt: '#f1ead8', shirtEdge: '#d6ccb2', shirtRim: '#faf6ea', shorts: '#5a4a3c', shoe: '#33261f'}},
  {outfit: 'vest', hair: 'level', expr: {...EXPR.bored, gaze: [-10, 20]}, armL: {sh: 8, hand: 'relaxed'}, armR: {sh: 8, hand: 'relaxed'}, palette: {hair: '#b5602e', hairLine: '#d08a4a', brow: '#7a3a18', vest: '#b9463c', shirt: '#f4e6b8', shirtEdge: '#d8c48a', shirtRim: '#fbf2d2', shorts: '#3f5a7a', shoe: '#2f2620'}},
];
// Acting as BEATS over the whole sequence (frames count across the cuts). Named gestures, faces and body moves from
// mould/gestures; the density rule (a speaker every 24 frames, a listener every 48) is checked below.
const BEATS: {role: 'speaker' | 'listener'; dir: 1 | -1; beats: Beat[]}[] = [
  // 0 the customer, seen from behind: greets, shifts her weight, points at the cake, steps closer, throws her hands up
  {role: 'listener', dir: 1, beats: [{f: 8, body: 'shift'}, {f: 20, pose: 'greet', big: true}, {f: 44, pose: 'akimbo', body: 'leanIn'}, {f: 76, pose: 'idle', body: 'upright'}, {f: 104, pose: 'point', big: true, body: 'step'}, {f: 132, pose: 'hips', body: 'leanBack'}, {f: 160, pose: 'idle', body: 'upright'}, {f: 196, pose: 'cheer', big: true, body: 'bounce'}, {f: 224, pose: 'hips'}]},
  // 1 the helper: waves back, presents the counter while talking, laughs, shrugs
  {role: 'speaker', dir: 1, beats: [{f: 6, face: 'smile', look: [18, -6]}, {f: 28, pose: 'wave', big: true, body: 'bounce'}, {f: 48, pose: 'present', body: 'leanIn', say: 30}, {f: 70, pose: 'explain'}, {f: 86, pose: 'akimbo', body: 'upright', face: 'smile', look: [18, -6]}, {f: 104, look: [-20, 4]}, {f: 114, pose: 'open', big: true, face: 'happy', body: 'bounce', say: 30}, {f: 136, pose: 'chest'}, {f: 150, pose: 'shrug', face: 'smile', body: 'shift'}, {f: 172, pose: 'hips', look: [24, 0]}, {f: 194, pose: 'point', dir: 1, body: 'leanIn'}, {f: 216, pose: 'idle', body: 'upright', face: 'happy'}]},
  // 2 the baker: nods, crosses her arms, points to the cake and laughs, leans back
  {role: 'speaker', dir: -1, beats: [{f: 4, face: 'smile', look: [-16, -4]}, {f: 18, pose: 'hips', body: 'shift'}, {f: 40, body: 'dip'}, {f: 54, pose: 'cross', body: 'leanBack'}, {f: 76, body: 'dip', look: [-22, 2]}, {f: 88, pose: 'point', big: true, face: 'happy', body: 'leanIn', say: 24}, {f: 112, pose: 'explain', face: 'smile'}, {f: 132, pose: 'think', body: 'upright'}, {f: 152, pose: 'fist', face: 'happy', body: 'bounce'}, {f: 176, pose: 'akimbo', face: 'smile'}, {f: 198, pose: 'open', body: 'leanBack', face: 'happy', say: 20}, {f: 212, pose: 'chest', body: 'upright'}, {f: 228, pose: 'hips'}]},
  // 3 the child: bored and slumped, sees the cake (shock in one frame, recoils), then hops with delight and points
  {role: 'listener', dir: -1, beats: [{f: 10, face: 'bored', look: [-10, 20], body: 'slump'}, {f: 50, pose: 'akimbo', look: [14, 18]}, {f: 92, pose: 'cross', body: 'shift'}, {f: 136, look: [-18, 22], body: 'dip'}, {f: 168, look: [-22, -20], body: 'upright'}, {f: 184, face: 'shock', look: [-20, -28], pose: 'gasp', big: true, body: 'recoil'}, {f: 206, face: 'happy', look: [-18, -24], pose: 'pointUp', big: true, body: 'hop'}, {f: 222, pose: 'cheer', body: 'hop'}]},
];
BEATS.forEach((c, i) => { const bad = lintBeats(c.beats, 240, c.role); if (bad.length) throw new Error(`market-seq: figure ${i} (${c.role}) stands too long without a beat: ${bad.join(', ')}`); });
const KEYS: Key[][] = BEATS.map((c) => perform(c.beats, {dirDefault: c.dir}));
const BLINKS: [number[], 'half' | 'blank' | 'swap'][] = [[[], 'half'], [[14, 96], 'half'], [[70, 132], 'blank'], [[176, 232], 'blank']];

// ---------- shots: [length, camera at start, camera at end, roll, kind] ----------
type CamKey = {pos: V3; look: V3};
const dWide = distanceFor(H, 0.42), dMed = distanceFor(H, 0.78);
const SHOTS: {len: number; a: CamKey; b: CamKey; roll: number; fov: number; soft?: boolean}[] = [
  // wide: a straight vertical slide down with a slight push (B10), everything sharp
  {len: 84, fov: 28, roll: 0.7, a: {pos: [0.2, 2.05, 1.2 + dWide], look: [0.2, 1.75, 0]}, b: {pos: [0.2, 1.6, 1.0 + dWide], look: [0.2, 1.35, 0]}},
  // medium on the two at the stall, past the customer's shoulder: slow sideways slide
  {len: 78, fov: 28, roll: -0.5, a: {pos: [-0.25, 1.4, 0.75 + dMed], look: [0.2, 1.32, 0]}, b: {pos: [0.05, 1.4, 0.7 + dMed], look: [0.42, 1.32, 0]}},
  // close on the child: push in, the set softer than the figure (B14)
  {len: 78, fov: 28, roll: 0.5, soft: true, a: {pos: [P[3].x - 0.1, 0.92, P[3].z + 2.6], look: [P[3].x - 0.1, 0.9, P[3].z]}, b: {pos: [P[3].x - 0.14, 0.94, P[3].z + 2.3], look: [P[3].x - 0.14, 0.92, P[3].z]}},
];
export const MARKET_FRAMES = SHOTS.reduce((n, s) => n + s.len, 0);

const Cam: React.FC<{s: typeof SHOTS[number]; t: number}> = ({s, t}) => {
  const {camera} = useThree(), c = camera as THREE.PerspectiveCamera, m = (k: 'pos' | 'look', i: number) => s.a[k][i] + (s.b[k][i] - s.a[k][i]) * t;
  c.position.set(m('pos', 0), m('pos', 1), m('pos', 2)); c.fov = s.fov; c.near = 0.1; c.far = 200; c.lookAt(m('look', 0), m('look', 1), m('look', 2)); c.rotateZ((-s.roll * t * Math.PI) / 180); c.updateProjectionMatrix();
  return null;
};
const People: React.FC<{f: number; only?: number}> = ({f, only}) => (
  <>{P.map((q, i) => (only !== undefined && only !== i ? null : <Puppet3 key={i} height={i === 3 ? 1.15 : H} pos={[q.x, 0, q.z]} res={only === i ? 2.4 : q.near === 1 ? 2 : 1.5} flip={q.flip} spec={blink(act(CAST[i], KEYS[i], f, {seed: i + 1}), f, BLINKS[i][0], BLINKS[i][1])} />))}</>
);

const Seq: React.FC = () => {
  const frame = useCurrentFrame(), {width, height} = useVideoConfig(), gain = 1.2;
  let f = frame, i = 0; while (i < SHOTS.length - 1 && f >= SHOTS[i].len) { f -= SHOTS[i].len; i++; }
  const s = SHOTS[i], t = s.len > 1 ? f / (s.len - 1) : 0, cam = <Cam s={s} t={t} />;
  if (s.soft) return (
    <AbsoluteFill style={{background: '#000'}}><Finish>
      <AbsoluteFill style={{filter: 'blur(1.6px)', transform: 'scale(1.01)'}}><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>{cam}<Set gain={gain} /></ThreeCanvas></AbsoluteFill>
      <AbsoluteFill><ThreeCanvas width={width} height={height} flat gl={{antialias: true, alpha: true}}>{cam}<Scene3 grade="dayExterior" gain={gain}><People f={frame} only={3} /></Scene3></ThreeCanvas></AbsoluteFill>
    </Finish></AbsoluteFill>
  );
  return <AbsoluteFill style={{background: '#000'}}><Finish><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>{cam}<Set gain={gain}><People f={frame} /></Set></ThreeCanvas></Finish></AbsoluteFill>;
};
export const MarketSeqComps: React.FC = () => <Composition id="market-seq" component={Seq} width={1280} height={720} fps={24} durationInFrames={MARKET_FRAMES} />;
