import React from 'react';
import {Composition, Still, useCurrentFrame} from 'remotion';
import {
  Stage, StageCanvas, shotComp, KitShot, camPush, camTruck, liveness, Box, Rect, Disc, Flame, ClothSway, SignText, Glow, Clouds, SkyBands, Smoke,
  ImageRig, V3,
} from '../kit';
import {Puppet, act, mix, beatFrames, lintBeats, puppetPoint, puppetAttach, hop, shiver, talk, fakeWalk, walk, glide, quadGait} from '../puppet';
import {DOOM, DOOM_FACE, DoomBeat} from '../chars/_lib/doom';
import {KING, KING_FACE, KingBeat} from '../chars/_lib/king';
import {VILLAGER, VillagerBeat} from '../chars/_lib/villager';
import {WALKER} from '../chars/_lib/walker';
import {ELEPHANT} from '../chars/_lib/elephant';
import {doomImgRig, doomHands, facePose, FACE, FACE0} from '../chars/doomImg';

/* ------------------------------------------------------------------ puppet-demo: a short exchange, 72 frames
 * Doom turns to the king and raises a glowing palm; the king strokes his beard, squints, then throws his arms up;
 * a villager at the back watches, then jumps. Every puppet is driven by a BEAT LIST only. */
const LEN = 72;
const P_DOOM: V3 = [-2.5, 0, 0.2], P_KING: V3 = [2.3, 0, -0.2], P_VIL: V3 = [0.0, 0, -1.5];
const H_DOOM = 2.7, H_KING = 3.1, H_VIL = 2.1;

const DOOM_BEATS: DoomBeat[] = [
  {f: 0, note: 'glare at us, fists down', ...DOOM_FACE.angry, shL: 6, shR: 6},
  {f: 6, note: 'head turns to the king (eyes go first)', turn: 0.75, px: 0.6, lean: 2},
  {f: 18, note: 'right palm comes up, open', shR: 62, elR: 100, wrR: -10, handR: 'open'},
  {f: 30, note: 'palm lights up; brows drop', handR: 'glow', ...DOOM_FACE.squint, px: 0.8},
  {f: 42, note: 'leans in', lean: 5, bodyX: 10, headTilt: 5},
  {f: 56, blink: true, note: 'blink after the king breaks'},
  {f: 60, note: 'straightens, satisfied', lean: 1, bodyX: 0, headTilt: -3, ...DOOM_FACE.neutral, turn: 0.5},
];
const KING_BEATS: KingBeat[] = [
  {f: 0, note: 'smug, hands down', ...KING_FACE.smug},
  {f: 12, note: 'hand to the beard, thinking', handR: 'chin', shR: 8, lean: -1.5},
  {f: 24, blink: true, note: 'blink before the squint'},
  {f: 28, note: 'suspicious squint', ...KING_FACE.squint, shR: 3},
  {f: 46, note: 'shock: new head, both arms fly up', ...KING_FACE.shock, handL: 'up', handR: 'up', shL: -20, shR: -20, lean: 3, bodyY: 26, n: 2},
  {f: 50, note: 'arms higher, lands', shL: 12, shR: 12, bodyY: 0, squash: 0.03},
  {f: 64, note: 'sags', shL: -8, shR: -8, squash: 0, lean: 4, headTilt: 4},
];
const VIL_BEATS: VillagerBeat[] = [
  {f: 0, note: 'watches, calm'},
  {f: 20, blink: true, note: 'blink'},
  {f: 36, note: 'leans to see', lean: -4, bodyX: -8},
  {f: 52, note: 'gasps (drawing swap) and hops', sel: {pic: 'shock'}, lean: 2, bodyX: 6},
];
// poses as functions of the frame: <Puppet> calls them for this frame and the one before, to hold the twos rule
const doomAt = (f: number) => act(DOOM_BEATS, f, {rig: DOOM, seed: 1});
const kingAt = (f: number) => act(KING_BEATS, f, {rig: KING, seed: 2});
const vilHop = (f: number) => hop(f, 52, {sc: VILLAGER.height / 520});
const vilAt = (f: number) => mix(act(VIL_BEATS, f, {rig: VILLAGER, seed: 3, alive: 0.7}), vilHop(f));
export const PUPPET_DEMO_LINT = lintBeats({doom: {beats: DOOM_BEATS, rig: DOOM, seed: 1}, king: {beats: KING_BEATS, rig: KING, seed: 2}, villager: {beats: VIL_BEATS, rig: VILLAGER, seed: 3, alive: 0.7, extra: vilHop}}, LEN);

const cam = camTruck(camPush({pos: [-0.5, 2.1, 10], look: [-0.1, 2.0, 0], fov: 30}, {pctPerSec: 1.5}), {pctPerSec: 1.6});
const Scene: React.FC<{f: number; t: number}> = ({f}) => {
  if (PUPPET_DEMO_LINT.length) throw new Error(`puppet-demo beats: ${PUPPET_DEMO_LINT.join('; ')}`);
  const palm = puppetPoint(DOOM, doomAt(f), '', 'palmR', H_DOOM, P_DOOM);
  return (
    <Stage cam={cam} f={f} len={LEN} mood="dayInterior" name="puppet-demo">
      {/* hall: floor, wall in two tones, carpet, window with sky, banners, two wall torches, dais */}
      <Box size={[22, 0.2, 10]} pos={[0, -0.1, 0]} color="#b9a48c" />
      <Box size={[22, 8, 0.3]} pos={[0, 4, -3.4]} color="#ddd3bd" />
      <Rect w={22} h={1.3} pos={[0, 0.65, -3.24]} color="#bfae92" />
      <Rect w={22} h={0.14} pos={[0, 1.37, -3.235]} color="#a08c6e" />
      <group position={[0, 0.005, 0.6]} rotation={[-Math.PI / 2, 0, 0]}><Rect w={15} h={2.6} color="#a8433c" /><Rect w={15} h={0.16} pos={[0, 1.1, 0.002]} color="#e2b65a" /><Rect w={15} h={0.16} pos={[0, -1.1, 0.002]} color="#e2b65a" /></group>
      <Rect w={1.9} h={2.1} pos={[-0.3, 3.0, -3.23]} color="#9fc4e4" />
      <SkyBands pos={[-0.3, 3.0, -3.225]} size={[1.9, 2.1]} colors={['#8fb8de', '#b4d2ea', '#d6e6f0']} />
      {[[-0.95, 0, 0.16, 2.4], [0.95, 0, 0.16, 2.4], [0, 1.12, 2.06, 0.16], [0, -1.12, 2.06, 0.16], [0, 0, 0.1, 2.2]].map(([x, y, w, h], i) => <Rect key={i} w={w} h={h} pos={[-0.3 + x, 3.0 + y, -3.21]} color="#8a7458" />)}
      <ClothSway kind="banner" pos={[-4.3, 4.9, -3.2]} w={1} h={2.3} f={f} color="#3f7a57" stripe="#e2b65a" seed={1} />
      <ClothSway kind="banner" pos={[4.3, 4.9, -3.2]} w={1} h={2.3} f={f} color="#a8433c" stripe="#e2b65a" seed={4} />
      {[-1.6, 1.0].map((x, i) => (
        <group key={x}>
          <Box size={[0.14, 0.6, 0.14]} pos={[x, 2.9, -3.1]} color="#6b5440" />
          <Flame pos={[x, 3.22, -3.05]} w={0.24} h={0.6} f={f} seed={3 + i * 4} />
          <Smoke pos={[x, 3.8, -3.08]} f={f} count={4} size={0.11} rise={0.9} spread={0.14} tones={['#c9bfa8', '#b9ae96']} seed={i + 1} />
        </group>
      ))}
      <SignText text="Phòng Ngai Vàng" pos={[-0.3, 4.38, -3.2]} height={0.26} color="#5a3c2e" board="#f3e6c0" />
      {/* the cast */}
      <Puppet rig={VILLAGER} pose={vilAt} height={H_VIL} pos={P_VIL} />
      <Puppet rig={DOOM} pose={doomAt} height={H_DOOM} pos={P_DOOM} />
      <Puppet rig={KING} pose={kingAt} height={H_KING} pos={P_KING} />
      {/* magic held by a character: the one allowed glow, glued to the palm with puppetPoint */}
      {f >= 30 ? <Glow pos={[palm[0], palm[1], palm[2] + 0.05]} r={0.5} color="#7dffa0" strength={0.28} f={f} /> : null}
      {f >= 30 ? [0, 1, 2].map((i) => <Disc key={i} r={0.035} color="#c9ffd4" pos={[palm[0] + [-0.3, 0.32, 0.05][i], palm[1] + 0.3 + ((Math.floor(f / 2) * 0.05 + i * 0.17) % 0.5), palm[2] + 0.07]} />) : null}
    </Stage>
  );
};
const DEMO: KitShot = {id: 'puppet-demo', len: LEN, bg: '#ddd3bd', Scene, liveness: liveness('medium', [
  {name: 'camera', kind: 'camera', note: 'push 1.5 %/s with a truck'},
  {name: 'doom', kind: 'puppet', beats: beatFrames(DOOM_BEATS)},
  {name: 'king', kind: 'puppet', beats: beatFrames(KING_BEATS)},
  {name: 'villager', kind: 'puppet', beats: beatFrames(VIL_BEATS)},
  {name: 'torches', kind: 'ambient', family: 'flame'}, {name: 'banners', kind: 'ambient', family: 'cloth'}, {name: 'torch smoke', kind: 'ambient', family: 'smoke'},
  {name: 'palm glow', kind: 'effect', beats: [30]},
])};

/* ------------------------------------------------------------------ puppet-cycles: the cycle functions, 48 frames.
 * A TEST CARD, not a shot: it is mounted without shotComp, so it carries no liveness declaration. */
const CLEN = 48;
const ccam = camTruck({pos: [0.6, 2.4, 16], look: [0.6, 1.9, 0], fov: 30}, {pctPerSec: 2});
const K = VILLAGER.height / 520, WK = WALKER.height / 520;
const walkerAt = (f: number) => mix({sel: {prop: 'staff'}, shL: 8}, act([{f: 0}, {f: 20, headTilt: 8, note: 'looks down the road'}, {f: 36, headTilt: -4}], f, {rig: WALKER, seed: 7}), walk(f, {sc: WK, leg: 200}));
const walkerPos = (f: number) => glide(f, [5.6, 0, 1.0], [6.7, 0, 1.0], 0, CLEN);
const Cycles: React.FC = () => {
  const f = useCurrentFrame();
  const say = (g: number) => talk(g, [[4, 22], [30, 46]], {open: 'shock', closed: 'base'});
  // a prop that is NOT a rig piece: glued to the walker's free hand with puppetAttach (position, depth and angle)
  const lamp = puppetAttach(WALKER, mix(walkerAt(f), {}), 'armR', [151, 280], 2.2, walkerPos(f));
  return (
    <StageCanvas bg="#b4d2ea">
      <Stage cam={ccam} f={f} len={CLEN} mood="dayExterior" name="puppet-cycles">
        <Box size={[44, 0.2, 40]} pos={[0, -0.1, 0]} color="#c9c48e" />
        <SkyBands pos={[0, 6, -6]} size={[34, 12]} colors={['#8fb8de', '#b4d2ea', '#e3ecd9']} />
        <Clouds pos={[0, 7, -5.9]} size={[26, 3]} f={f} count={4} seed={3} />
        {/* four-legged gait */}
        <Puppet rig={ELEPHANT} pose={(g) => quadGait(ELEPHANT, g)} height={2.6} pos={(g) => glide(g, [-5.4, 0, -1.5], [-4.2, 0, -1.5], 0, CLEN)} />
        {/* fake walk: robed rig seen from behind, sliding away to the right */}
        <Puppet rig={DOOM} pose={(g) => mix({view: 'back'}, fakeWalk(g, {sc: 1450 / 520}))} height={2.3} pos={(g) => glide(g, [-2.4, 0, 0.4], [-1.5, 0, 0.4], 0, CLEN)} />
        {/* fake walk, front rig */}
        <Puppet rig={DOOM} pose={(g) => mix({turn: 0.6, px: 0.5}, fakeWalk(g))} height={2.3} pos={(g) => glide(g, [-0.4, 0, 1.2], [0.6, 0, 1.2], 0, CLEN)} />
        {/* hop, shiver, talk (single-picture puppets) */}
        <Puppet rig={VILLAGER} pose={(g) => mix({}, hop(g, 8, {sc: K}), hop(g, 28, {sc: K}))} height={1.9} pos={[2.0, 0, 0.6]} />
        <Puppet rig={VILLAGER} pose={(g) => shiver(g, {sc: K, seed: 4})} height={1.9} pos={[3.1, 0, 0.2]} />
        <Puppet rig={VILLAGER} pose={(g) => ({sel: {pic: say(g).mouth ?? 'base'}, headY: say(g).headY})} height={1.9} pos={[4.2, 0, 0.7]} />
        {/* legged test rig (flat shapes): walk() with planted soles, torso bob on the hips role, hair that lags the head,
            a staff as a rig piece (variant group `prop`), a lamp glued to the far hand with puppetAttach */}
        <Puppet rig={WALKER} pose={walkerAt} height={2.2} pos={walkerPos} />
        <group position={lamp.pos} rotation={[0, 0, lamp.rot]}><Rect w={0.05} h={0.3} pos={[0, -0.15, 0]} color="#3a2f2a" /><Disc r={0.11} pos={[0, -0.36, 0.001]} color="#f2cf7a" /></group>
      </Stage>
    </StageCanvas>
  );
};

/* ------------------------------------------------------------------ puppet-equiv: old engine (top) against the new Puppet (bottom) */
const Equiv: React.FC = () => {
  const H = 2.7, xs = [-2.6, 0, 2.6];
  return (
    <StageCanvas bg="#e9e4d6">
      <Stage cam={{pos: [0, 0, 14], look: [0, 0, 0], fov: 28}} f={0} len={1} mood="dayInterior" bg="#e9e4d6">
        {/* top row: src/three/ImageRig + src/chars/doomImg, the three poses of the "rig-doom" composition */}
        <ImageRig rig={doomImgRig} worldHeight={H} pos={[xs[0], 0.35, 0]} pose={{...doomHands(), ...facePose(FACE0)}} />
        <ImageRig rig={doomImgRig} worldHeight={H} pos={[xs[1], 0.35, 0]} pose={{...doomHands('fist', 'glow'), ...facePose({...FACE0, ...FACE.neutral, turn: 0.8, px: 0.8}), armR: {rot: -60}, foreR: {rot: -105}, armL: {rot: 14}, foreL: {rot: 8}}} />
        <ImageRig rig={doomImgRig} worldHeight={H} pos={[xs[2], 0.35, 0]} pose={{...doomHands('open', 'fist'), ...facePose({...FACE0, ...FACE.sad, turn: -0.8, px: -0.6, py: 0.6}), armL: {rot: 58}, foreL: {rot: 104}, armR: {rot: -18}, foreR: {rot: -10}}} />
        {/* bottom row: the generic Puppet + src/chars/_lib/doom.ts, the same poses written as channels */}
        <Puppet rig={DOOM} height={H} pos={[xs[0], -3.15, 0]} shadow={false} />
        <Puppet rig={DOOM} height={H} pos={[xs[1], -3.15, 0]} shadow={false} pose={{...DOOM_FACE.neutral, handR: 'glow', turn: 0.8, px: 0.8, shR: 60, elR: 105, shL: 14, elL: 8}} />
        <Puppet rig={DOOM} height={H} pos={[xs[2], -3.15, 0]} shadow={false} pose={{...DOOM_FACE.sad, handL: 'open', turn: -0.8, px: -0.6, py: -0.6, shL: 58, elL: 104, shR: 18, elR: 10}} />
      </Stage>
    </StageCanvas>
  );
};

export const PuppetDemoComps: React.FC = () => (
  <>
    <Composition id="puppet-demo" component={shotComp(DEMO)} width={1280} height={720} fps={24} durationInFrames={LEN} />
    <Composition id="puppet-cycles" component={Cycles} width={1280} height={720} fps={24} durationInFrames={CLEN} />
    <Still id="puppet-equiv" component={Equiv} width={1920} height={1080} />
  </>
);
