// Adversarial trial: written from KIT.md and PUPPET.md only.
import React from 'react';
import {Composition} from 'remotion';
import {Stage, KitShot, shotComp, camTruck, camPush, liveness, checkLiveness, Box, Rect, Poly, Disc, Stroke, Cyl,
  Flame, Smoke, StarField, ClothSway, SignText, NameTag, SkyBands, idle, prog, twos} from '../../kit';
import {Puppet, act, Beat, beatFrames, lintBeats} from '../../puppet';
import {VILLAGER} from '../../chars/_lib/villager';
import {DOOM, DOOM_FACE} from '../../chars/_lib/doom';
import {KING, KING_FACE} from '../../chars/_lib/king';
import {mix, hop, talk, puppetPoint} from '../../puppet';
import {camHold, Glow, MarkCircle, PopIn, Puff, Weather, NearBlur, Card, LightShaft, Crowd, Birds, Clouds} from '../../kit';

const LEN = 48;
const cam = camTruck(camPush({pos: [-0.6, 2.3, 12], look: [-0.6, 2.1, 0], fov: 30}, {pctPerSec: 1}), {pctPerSec: 2.5, dir: 1});

const SELLER: Beat[] = [
  {f: 0, note: 'calm behind the stall', sel: {pic: 'base'}},
  {f: 8, note: 'hears something to screen right: leans', lean: 3, headTilt: 3},
  {f: 16, blink: true, note: 'blink before the shock'},
  {f: 20, note: 'SHOCK: jumps back', sel: {pic: 'shock'}, bodyX: -14, bodyY: 10, lean: -5, squash: -0.05, n: 2},
  {f: 24, note: 'lands', bodyY: 0, squash: 0.06},
  {f: 30, note: 'recovers', squash: 0, lean: -2},
  {f: 40, blink: true, note: 'blink, stays shocked', lean: 0},
];
const lint = lintBeats({seller: SELLER}, LEN);
if (lint.length) throw new Error('trial beats: ' + JSON.stringify(lint));

const LANTERNS: [number, number][] = [[-3.4, 4.5], [-1.7, 4.25], [0, 4.15], [1.7, 4.25], [3.4, 4.5]];

const Scene: React.FC<{f: number; t: number}> = ({f}) => {
  const pose = (g: number) => act(SELLER, g, {rig: VILLAGER, seed: 3});
  return (
    <Stage cam={cam} f={f} len={LEN} mood="nightExterior" name="trial-market">
      <SkyBands pos={[0, 6, -14]} size={[60, 16]} colors={['#141a3a', '#1f2a55', '#35407a']} />
      <StarField pos={[0, 8, -13.5]} size={[40, 8]} count={30} />
      {/* ground and back houses */}
      <Box size={[40, 0.2, 20]} pos={[0, -0.1, 0]} color="#3a3550" />
      <Box size={[5, 5, 2]} pos={[-7, 2.5, -7]} color="#2a2f55" />
      <Box size={[6, 6.5, 2]} pos={[6.5, 3.25, -8]} color="#262a4c" />
      <Rect w={0.8} h={1} pos={[-7.5, 3, -5.98]} color="#f1d58a" />
      <Rect w={0.8} h={1} pos={[6, 4, -6.98]} color="#f1d58a" />
      {/* stall: posts, awning, counter */}
      <Cyl r={0.08} h={4.4} pos={[-3.8, 2.2, 0]} color="#6a4a3a" />
      <Cyl r={0.08} h={4.4} pos={[3.8, 2.2, 0]} color="#6a4a3a" />
      <Poly pts={[[-4.3, 0], [4.3, 0], [3.9, 0.9], [-3.9, 0.9]]} pos={[0, 4.4, 0.05]} color="#b8433a" />
      {[-3, -1, 1, 3].map((x) => <Poly key={x} pts={[[-0.5, 0], [0.5, 0], [0.45, 0.9], [-0.45, 0.9]]} pos={[x, 4.4, 0.054]} color="#efe2c2" />)}
      <Box size={[7.2, 1.2, 1.4]} pos={[0, 0.6, 0.8]} color="#8a5a40" />
      <Rect w={7.2} h={0.25} pos={[0, 1.05, 1.504]} color="#a8704c" />
      {/* sign */}
      <SignText text="Phở bò đêm" pos={[-1.1, 0.5, 1.52]} height={0.5} color="#5a2c22" board="#f1dfae" />
      <SignText text="Chợ đêm Kỳ Lừa" pos={[0.4, 3.55, -0.9]} height={0.3} color="#f1dfae" upper={false} />
      {/* lantern string: flat shapes, no glow */}
      <Stroke pts={LANTERNS} width={0.03} color="#1c1a2a" pos={[0, 0.35, 0.3]} />
      {LANTERNS.map(([x, y], i) => {
        const sw = idle(f, 10 + i) * 0.04;
        return (
          <group key={i} position={[x + sw, y, 0.3]}>
            <Disc r={0.3} sy={1.15} color={i % 2 ? '#e2553f' : '#f1c75a'} />
            <Rect w={0.22} h={0.07} pos={[0, 0.36, 0.004]} color="#3a2a22" />
            <Rect w={0.22} h={0.07} pos={[0, -0.36, 0.004]} color="#3a2a22" />
            <Disc r={0.13} sy={1.3} pos={[0, 0, 0.004]} color="#f7e9b4" />
          </group>
        );
      })}
      {/* pot with fire and steam on the counter */}
      <Cyl r={0.5} h={0.5} pos={[2.2, 1.45, 0.8]} color="#4a4a58" />
      <Flame pos={[2.2, 0.0, 1.6]} w={0.5} h={0.7} f={f} seed={2} embers={3} />
      <Smoke pos={[2.2, 1.8, 0.8]} f={f} count={5} size={0.3} rise={1.6} tones={['#cfd3e6', '#aab0cc']} />
      <ClothSway kind="banner" pos={[-3.2, 4.3, 0.4]} w={0.8} h={1.6} f={f} color="#2f6a6a" stripe="#f1dfae" />
      {/* seller behind the counter */}
      <Puppet rig={VILLAGER} pose={pose} height={2.6} pos={[-0.8, 0, -0.4]} />
      <NameTag text="bà bán phở" pos={[-3.4, 3.3, 1]} height={0.36} to={[1.8, -0.6]} p={prog(f, 0, 14)} tone="white" />
    </Stage>
  );
};

export const TRIAL: KitShot = {id: 'trial-market', len: LEN, bg: '#141a3a', Scene, liveness: liveness('medium', [
  {name: 'camera', kind: 'camera', note: 'truck 2.5 %/s + push 1 %/s'},
  {name: 'seller', kind: 'puppet', beats: beatFrames(SELLER)},
  {name: 'fire', kind: 'ambient', family: 'flame'},
  {name: 'steam', kind: 'ambient', family: 'smoke'},
  {name: 'banner', kind: 'ambient', family: 'cloth'},
])};
const lv = checkLiveness(TRIAL.liveness, LEN);
if (lv.length) throw new Error('trial liveness: ' + JSON.stringify(lv));
void twos;

// second trial: PUPPET.md worked example verbatim + stacking against flat cards
const REACT: Beat[] = [
  {f: 0,  note: 'calm, looking at us', ...DOOM_FACE.neutral},
  {f: 8,  note: 'a noise: looks left (pupils go on frame 6 by themselves)', turn: -0.7, px: -0.7, headTilt: -3},
  {f: 18, blink: true, note: 'blink before the shock'},
  {f: 22, note: 'STARTLE: eyes wide, jumps back to the right', ...DOOM_FACE.wide, bodyX: 16, bodyY: 10, lean: 6, squash: -0.04, n: 2},
  {f: 26, note: 'lands', bodyY: 0, squash: 0.05},
  {f: 30, note: 'left hand comes up, open, to ward it off', shL: 70, elL: 95, handL: 'open', squash: 0},
  {f: 44, note: 'settles: weight back, hand lowers, wary squint', bodyX: 4, lean: 1, shL: 25, elL: 40, ...DOOM_FACE.squint, turn: -0.5},
  {f: 54, note: 'fist again', handL: 'fist', shL: 6, elL: 0},
];
const KB: Beat[] = [
  {f: 0, ...KING_FACE.smug},
  {f: 12, handR: 'chin', headTilt: 4},
  {f: 28, ...KING_FACE.shock, handR: 'up', shR: 30},
  {f: 46, blink: true},
];
export const lint2 = lintBeats({doom: REACT, king: KB}, 60);
const cam2 = camHold({pos: [0, 1.9, 10], look: [0, 1.7, 0], fov: 30}, {});
const Scene2: React.FC<{f: number; t: number}> = ({f}) => {
  const dp = (g: number) => act(REACT, g, {rig: DOOM, seed: 1});
  const kp = (g: number) => mix(act(KB, g, {rig: KING, seed: 2}), hop(g, 30, {}));
  const palm = puppetPoint(DOOM, dp(f), 'handL', 'palmL', 2.7, [-2, 0, 0.5]);
  return (
    <Stage cam={cam2} f={f} len={60} mood="dayInterior" name="trial-stack">
      <Box size={[16, 0.2, 9]} pos={[0, -0.1, 0]} color="#b98a62" />
      <Box size={[16, 7, 0.3]} pos={[0, 3.5, -3]} color="#e6dcc6" />
      <Rect w={3} h={2.4} pos={[-2, 1.6, 0.2]} color="#7fa6c9" />
      <Puppet rig={DOOM} pose={dp} height={2.7} pos={[-2, 0, 0.5]} />
      <Rect w={1.6} h={0.9} pos={[-2.9, 0.6, 0.9]} color="#c9483c" opacity={0.6} />
      <Smoke pos={[-1.2, 0.4, 1.0]} f={f} count={5} size={0.3} />
      <Disc r={0.12} pos={palm} color="#31d07a" />
      <Puppet rig={KING} pose={kp} height={2.9} pos={[1.6, 0, 0]} />
      <Puppet rig={VILLAGER} pose={(g) => act(SELLER, g, {rig: VILLAGER, seed: 5, alive: 0.5})} height={2.2} pos={[3.9, 0, 0.6]} flip />
      <PopIn f={f} f0={20} pos={[0, 3.2, 0.5]} puffR={0.3}><MarkCircle r={0.4} p={prog(f, 20, 10)} /></PopIn>
      <LightShaft pos={[4.5, 5.5, -2.5]} w0={0.8} w1={2} len={5} f={f} angle={20} />
    </Stage>
  );
};
export const TRIAL2: KitShot = {id: 'trial-stack', len: 60, bg: '#e6dcc6', Scene: Scene2, liveness: liveness('medium', [
  {name: 'camera', kind: 'camera'}, {name: 'doom', kind: 'puppet', beats: beatFrames(REACT)}, {name: 'king', kind: 'puppet', beats: [12, 28, 46]},
  {name: 'smoke', kind: 'ambient', family: 'smoke'}, {name: 'shaft', kind: 'ambient', family: 'light'}, {name: 'circle', kind: 'effect', beats: [20]},
])};
void [Glow, Puff, Weather, NearBlur, Card, Crowd, Birds, Clouds, talk];

export const TrialComps: React.FC = () => (<>
  <Composition id="trial-stack" component={shotComp(TRIAL2)} width={1280} height={720} fps={24} durationInFrames={60} />
  <Composition id="trial-market" component={shotComp(TRIAL)} width={1280} height={720} fps={24} durationInFrames={LEN} />
</>);
