import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {ThroneHall} from './sets/ThroneHall';
import {ImageRig, rigPoint} from './three/ImageRig';
import {ImageCard} from './three/ImageCard';
import {doomImgRig, doomHands, facePose, FACE, FACE0, Face, HAND_CENTRE} from './chars/doomImg';
import {Post} from './three/Post';
import {Glow, Speck} from './three/prims';
import {Cam, Lights, V3, lerp3, outBack, track, trackObj, drift} from './three/stage';
import type {PartPose} from './three/SvgRig';

const H = 2.9; // Doom's height in world units
type Hand = 'fist' | 'open' | 'glow';

// ---------------------------------------------------------------- shot list (24 fps)
export const SEQ = [
  {id: 'back', len: 29},   // from behind: hooded back, throne ahead
  {id: 'raise', len: 35},  // medium: raises the glowing hand
  {id: 'wide', len: 49},   // wide: Doom + queen
  {id: 'globe', len: 90},  // medium: the world appears above his palm, hand to chin
] as const;
export const HALL_SEQ_FRAMES = SEQ.reduce((a, s) => a + s.len, 0);
const shotAt = (frame: number) => { let f = frame; for (const s of SEQ) { if (f < s.len) return {id: s.id, f, len: s.len}; f -= s.len; } const l = SEQ[SEQ.length - 1]; return {id: l.id, f: l.len - 1, len: l.len}; };

// ---------------------------------------------------------------- Doom, driven by numbers
type Body = {x: number; y: number; lean: number; headRot: number; headX: number; headY: number};
type Arms = {armL: number; foreL: number; wristL: number; armR: number; foreR: number; wristR: number};
type Beat<T> = [number, Partial<T>];
const BODY0: Body = {x: 0, y: 0, lean: 0, headRot: 0, headX: 0, headY: 0};
/** step timeline for things that swap (hand drawings) */
const at = <T,>(f: number, steps: [number, T][]): T => { let v = steps[0][1]; for (const [k, x] of steps) if (f >= k) v = x; return v; };

/** Every channel is a pose-to-pose track (pop + settle, then hold); a little drift keeps the holds alive. */
const Doom: React.FC<{pos: V3; f: number; face: Face; body: Body; arms: Arms; hands: [Hand, Hand];
  glow?: {side: 'L' | 'R'; strength: number; color?: string; r?: number}}> = ({pos, f, face, body, arms, hands, glow}) => {
  const rig = doomImgRig; const sec = f / 24;
  const breath = Math.sin((sec * Math.PI * 2) / 1.15);
  const pose: Record<string, PartPose> = {
    ...doomHands(hands[0], hands[1]),
    ...facePose({...face, turn: face.turn + drift(f, 1) * 0.03, px: face.px + drift(f, 2) * 0.03}),
    body: {x: body.x, y: body.y + breath * 1.4, rot: body.lean + drift(f, 3) * 0.25},
    hood: {rot: body.headRot + drift(f, 4) * 0.7, x: body.headX + drift(f, 5) * 0.5, y: body.headY + breath * 0.5},
    cape: {y: body.y * 0.55, x: body.x * 0.6, sx: 1 + Math.sin((sec * Math.PI * 2) / 2.3) * 0.012},
    armL: {rot: arms.armL + drift(f, 6) * 0.8}, foreL: {rot: arms.foreL + drift(f, 7) * 1.2},
    armR: {rot: arms.armR + drift(f, 8) * 0.8}, foreR: {rot: arms.foreR + drift(f, 9) * 1.2},
  };
  (['fist', 'open', 'glow'] as Hand[]).forEach((h) => {
    if (!pose[`${h}L`]?.hide) pose[`${h}L`] = {rot: arms.wristL + drift(f, 10) * 2};
    if (!pose[`${h}R`]?.hide) pose[`${h}R`] = {rot: arms.wristR + drift(f, 11) * 2};
  });
  const g = glow ? rigPoint(rig, pose, `${hands[glow.side === 'L' ? 0 : 1]}${glow.side}`, HAND_CENTRE[glow.side], H, pos) : null;
  return (
    <>
      <ImageRig rig={rig} worldHeight={H} pos={pos} pose={pose} />
      {g && glow && glow.strength > 0.02 ? (
        <>
          <Glow pos={g} r={(glow.r ?? 0.46) * (0.94 + 0.06 * Math.sin(f * 0.9))} color={glow.color ?? '#7dffa0'} strength={glow.strength * (0.85 + 0.15 * Math.sin(f * 1.3 + 1))} />
          {Array.from({length: 7}, (_, i) => {
            // sparks circle the hand and rise, each on its own phase
            const a = i * 0.9 + f * 0.05, rr = 0.32 + (0.22 * ((i * 37) % 10)) / 10, up = (f * 0.012 + i * 0.17) % 0.5;
            return <Speck key={i} pos={[g[0] + Math.cos(a) * rr, g[1] + Math.sin(a) * rr * 0.7 + up, g[2] + 0.05]} s={(0.03 + (i % 3) * 0.014) * glow.strength} color={glow.color ? '#fff6c8' : '#b6ffc4'} opacity={0.5 + 0.5 * Math.sin(f * 0.5 + i)} />;
          })}
        </>
      ) : null}
    </>
  );
};

/** The little world that pops up above Doom's palm. */
const EarthBubble: React.FC<{pos: V3; r: number}> = ({pos, r}) => {
  const Disc: React.FC<{rad: number; color: string; z: number; p?: [number, number]; sy?: number}> = ({rad, color, z, p = [0, 0], sy = 1}) => (
    <mesh position={[p[0], p[1], z]} scale={[1, sy, 1]}><circleGeometry args={[rad, 48]} /><meshBasicMaterial color={color} fog={false} /></mesh>
  );
  const Blob: React.FC<{pts: [number, number][]; color: string; z: number}> = ({pts, color, z}) => {
    const geo = React.useMemo(() => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); return new THREE.ShapeGeometry(s); }, []);
    return <mesh geometry={geo} position={[0, 0, z]}><meshBasicMaterial color={color} fog={false} /></mesh>;
  };
  return (
    <group position={pos} scale={r}>
      <Disc rad={1} color={'#4f7fe6'} z={0} />
      <Disc rad={0.9} color={'#78a8f6'} z={0.004} />
      <Disc rad={0.72} color={'#3f86d6'} z={0.008} />
      <Blob pts={[[-0.34, 0.3], [-0.08, 0.42], [0.04, 0.2], [-0.1, -0.02], [-0.02, -0.34], [-0.26, -0.44], [-0.4, -0.12]]} color={'#7fbe68'} z={0.012} />
      <Blob pts={[[0.12, 0.1], [0.36, 0.2], [0.5, -0.02], [0.34, -0.22], [0.14, -0.16]]} color={'#e8c25e'} z={0.012} />
      <Blob pts={[[0.2, -0.34], [0.4, -0.3], [0.34, -0.5], [0.16, -0.5]]} color={'#7fbe68'} z={0.012} />
      <Disc rad={0.3} color={'#e9f1ff'} z={0.016} p={[0, 0.78]} sy={0.32} />
    </group>
  );
};

/** The queen is one picture; blinking is done with two skin-coloured lids placed in the picture's pixel space. */
const Queen: React.FC<{pos: V3; f: number; blinkAt: number[]; startle?: number}> = ({pos, f, blinkAt, startle}) => {
  const closed = blinkAt.some((b) => f >= b && f < b + 4);
  // a small hop when Doom looks at her
  const hop = startle !== undefined && f >= startle ? 0.05 * Math.exp(-(f - startle) / 3) * Math.cos((f - startle) * 0.9) : 0;
  return (
    <ImageCard src="queen/q-1.png" height={3.0} pos={[pos[0], pos[1] + hop, pos[2]]} tilt={Math.sin(((f / 24) * Math.PI * 2) / 2.6) * 0.5 + (startle !== undefined ? track(f, [[0, 0], [startle, -1.2], [startle + 10, 0]], 5) : 0)}>
      {closed ? [285, 462].map((cx) => (
        <group key={cx} position={[cx, 331, 0]}>
          <mesh scale={[1, 0.9, 1]}><circleGeometry args={[93, 40]} /><meshBasicMaterial color={'#f0c5a3'} fog={false} /></mesh>
          <mesh position={[0, 22, 0.5]}><planeGeometry args={[150, 9]} /><meshBasicMaterial color={'#b98a6a'} fog={false} /></mesh>
        </group>
      )) : null}
    </ImageCard>
  );
};

// ---------------------------------------------------------------- the sequence
export const HallSeq: React.FC<{from?: number}> = ({from = 0}) => {
  const frame = useCurrentFrame() + from; // `from` lets the full film start this timeline part-way in
  const {width, height} = useVideoConfig();
  const {id, f, len} = shotAt(frame);
  const t = f / (len - 1); // 0..1 through the shot; camera moves run from the first frame to the last, linearly (as measured)

  let cam: {pos: V3; look: V3; fov: number}; let focus: V3; let blur = 0.5; let frontColumns = true; let body: React.ReactNode = null;

  if (id === 'back') {
    const p: V3 = [-1.2, 0, 4.4];
    cam = {pos: lerp3([-0.95, 2.45, 8.4], [-1.25, 2.7, 9.2], t), look: [-1.2, 4.0, -7], fov: 42};
    focus = [p[0], 2.2, p[2]]; blur = 0.35;
    // the hood sinks a touch and tips, as if he lowers his head
    body = <ImageCard src="doom/back.png" height={H} pos={[p[0], Math.sin(f / 5) * 0.012 - track(f, [[0, 0], [10, 0.05]], 8), p[2]]} tilt={track(f, [[0, 0], [10, 1.5], [20, -0.8]], 7)} />;
  } else if (id === 'raise') {
    const p: V3 = [-1.2, 0, 5.7];
    cam = {pos: lerp3([-1.2, 2.02, 11.0], [-1.2, 2.02, 10.1], t), look: [-1.2, 2.05, -6], fov: 28};
    focus = [p[0], 2, p[2]]; blur = 0.55;
    // beats (frames): 0 looks down at the glowing fist | 7 head turns to camera, eyes follow a frame later | 12 dips (anticipation)
    // | 14 hand opens and rises, body straightens with a bounce | 21 brows drop | 27 glance at the hand | 31 back to camera
    const face = trackObj<Face>(f, [[0, {...FACE0, turn: 0.75, up: -0.5, px: 0.7, py: 0.8}], [7, {turn: 0.05, up: 0}], [8, {px: 0, py: 0, browL: 9, browR: 9, slant: 6}],
      [12, {up: -0.4}], [15, {up: 0.15, open: 1}], [21, {...FACE.angry, open: 0.62, browYL: 4, browYR: 4}], [27, {px: 0.75, py: -0.2}], [31, {px: 0, py: 0}]] as Beat<Face>[], 4);
    const bod = trackObj<Body>(f, [[0, {...BODY0, y: 3, lean: -2.5, headRot: 4, headY: 1}], [7, {headRot: 1, headY: -1}], [12, {y: 6, headY: 4, headRot: 2}],
      [15, {y: -5, x: 3, lean: 1.5, headY: -2, headRot: -2.5}], [21, {headY: 0.5}], [27, {headRot: 1}], [31, {headRot: -1}]] as Beat<Body>[], 5);
    const arm = trackObj<Arms>(f, [[0, {armL: 12, foreL: 6, wristL: 0, armR: -20, foreR: -102, wristR: 10}], [12, {armR: -14, foreR: -96}],
      [14, {armR: -50, foreR: -125, wristR: -14}], [15, {armL: 16, foreL: 10}], [20, {wristR: 6}], [26, {wristR: -5}]] as Beat<Arms>[], 7);
    body = <Doom pos={p} f={f} face={face} body={bod} arms={arm} hands={['fist', at<Hand>(f, [[0, 'fist'], [13, 'glow']])]}
      glow={{side: 'R', strength: track(f, [[0, 0.85], [13, 0.9], [16, 1.1], [22, 0.95]], 4), r: track(f, [[0, 0.36], [13, 0.46]], 4)}} />;
  } else if (id === 'wide') {
    const p: V3 = [-1.2, 0.9, -4.7]; frontColumns = false;
    cam = {pos: lerp3([0.25, 2.65, 7.6], [0.25, 2.62, 7.25], t), look: [0.25, 2.5, -6], fov: 28};
    focus = [p[0], 2.9, p[2]]; blur = 0.25;
    // beats: 0 looks at his sparkling left hand | 10 flicks the wrist | 18 turns to camera | 22 face relaxes | 30 looks over at the queen,
    // right arm gestures toward her (she starts) | 36 brows up | 42 back to camera
    const face = trackObj<Face>(f, [[0, {...FACE0, turn: -0.75, px: -0.7, py: 0.4}], [18, {turn: 0, px: 0, py: 0}], [22, {...FACE.neutral, browL: 8, browR: 8}],
      [30, {turn: 0.7, px: 0.85}], [36, {browYL: -4, browYR: -4, browL: 0, browR: 0}], [42, {turn: 0.1, px: 0.1}]] as Beat<Face>[], 4);
    const bod = trackObj<Body>(f, [[0, {...BODY0, lean: 2, headRot: -3}], [18, {lean: 0, headRot: 0, y: -2}], [30, {lean: -2, headRot: 3, x: 2}], [42, {lean: 0, headRot: 0, x: 0}]] as Beat<Body>[], 5);
    const arm = trackObj<Arms>(f, [[0, {armL: 44, foreL: 40, wristL: 0, armR: -36, foreR: -30, wristR: 0}], [10, {wristL: 22}], [14, {wristL: -6}],
      [18, {armL: 34, foreL: 30}], [30, {armR: -58, foreR: -44, wristR: -12}], [42, {armR: -40, foreR: -32, wristR: 0}]] as Beat<Arms>[], 6);
    body = (
      <>
        <Doom pos={p} f={f} face={face} body={bod} arms={arm} hands={['open', 'open']} glow={{side: 'L', strength: track(f, [[0, 0.65], [18, 0.4]], 6), color: '#fff3a0', r: 0.3}} />
        <Queen pos={[2.75, 0.9, -5.3]} f={f} blinkAt={[12, 33, 41]} startle={31} />
      </>
    );
  } else {
    const p: V3 = [-1.2, 0, 5.7];
    cam = {pos: lerp3([-0.5, 2.0, 11.07], [-0.72, 2.26, 9.2], t), look: lerp3([-0.5, 2.03, -6], [-0.72, 2.29, -6], t), fov: 28};
    focus = [p[0], 2, p[2]]; blur = 0.55;
    // beats: 0 stares at camera, palm out | 6 glances toward the palm | 13 the world pops up: head and eyes snap to it | 16 face opens
    // | 34 one brow lifts | 42 brows fall (sad) | 48 looks away down-left, head sinks | 56 hand comes up to the chin | 64 eyes half close
    // | 72 looks back at the world | 82 eyes drop again (timings read off the reference frame by frame)
    const face = trackObj<Face>(f, [[0, {...FACE0, open: 0.9}], [6, {px: 0.6, py: 0.3}], [13, {turn: 0.6, up: 0.5, px: 0.85, py: -0.7}], [16, {...FACE.neutral}],
      [34, {browL: -6, browYL: -5}], [42, {...FACE.sad}], [48, {turn: 0.15, up: -0.4, px: -0.55, py: 0.7}], [64, {open: 0.6, py: 0.9}],
      [72, {turn: 0.45, up: 0.2, px: 0.8, py: -0.4, open: 0.8}], [82, {px: 0.3, py: 0.6, open: 0.6}]] as Beat<Face>[], 4);
    const bod = trackObj<Body>(f, [[0, {...BODY0}], [13, {y: -3, lean: 1.5, headRot: 3, headY: -1.5}], [42, {headRot: 1, headY: 1}], [48, {y: 2, lean: -0.5, headRot: -4, headX: -2, headY: 3}],
      [56, {y: 3, lean: -1.5}], [72, {headRot: -1.5, headY: 1.5}], [82, {headRot: -3.5, headY: 3}]] as Beat<Body>[], 5);
    // hand to chin is a two-joint reach solved by hand: shoulder (93,294) -> palm under the chin (188,232), elbow across the chest
    const arm = trackObj<Arms>(f, [[0, {armL: 12, foreL: 6, wristL: 0, armR: -42, foreR: -92, wristR: -8}], [6, {wristR: 4}], [13, {armR: -46, foreR: -90, wristR: -14}],
      [48, {armR: -40, foreR: -94}], [56, {armL: -64, foreL: -86, wristL: 6}], [66, {wristL: -2}], [74, {wristL: 8}]] as Beat<Arms>[], 7);
    const hands: [Hand, Hand] = ['fist', 'open']; // the hand at the chin stays a loose fist, knuckles up, as in the reference
    const pose = {...doomHands(hands[0], hands[1]), body: {x: bod.x, y: bod.y, rot: bod.lean}, armR: {rot: arm.armR}, foreR: {rot: arm.foreR}, openR: {rot: arm.wristR}};
    const hand = rigPoint(doomImgRig, pose, 'openR', HAND_CENTRE.R, H, p);
    const pop = f < 12 ? 0 : outBack((f - 12) / 10, 2.4); // the world pops in with an overshoot
    const gp: V3 = [hand[0] + 0.12, hand[1] + 0.66 + Math.sin(((f / 24) * Math.PI * 2) / 1.6) * 0.035, hand[2] + 0.05];
    const orbit = f * 0.16;
    body = (
      <>
        <Doom pos={p} f={f} face={face} body={bod} arms={arm} hands={hands} />
        {pop > 0 ? <EarthBubble pos={gp} r={0.44 * pop} /> : null}
        {/* a little moon circles the rim */}
        {pop > 0.9 ? <mesh position={[gp[0] + Math.cos(orbit) * 0.49, gp[1] + Math.sin(orbit) * 0.49, gp[2] + 0.03]}><circleGeometry args={[0.035, 16]} /><meshBasicMaterial color={'#ffffff'} fog={false} /></mesh> : null}
        {pop > 0 && f < 32 ? Array.from({length: 6}, (_, i) => { const a = i * 1.05, d = 0.3 + (f - 12) * 0.03; return <Speck key={i} pos={[gp[0] + Math.cos(a) * d, gp[1] + Math.sin(a) * d, gp[2] + 0.08]} s={0.05 * (1 - (f - 12) / 20)} color={'#dff0ff'} />; }) : null}
      </>
    );
  }

  return (
    <AbsoluteFill style={{background: '#1c2271'}}>
      <ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>
        <Cam {...cam} />
        <Lights />
        <Post focus={focus} blur={blur} />
        <ThroneHall frontColumns={frontColumns} frame={frame} />
        {body}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
