import React from 'react';
import type {ShotDef} from './types';
import {Cam, V3, lerp3, inOut, track, drift} from '../three/stage';
import {Post} from '../three/Post';
import {Speck} from '../three/prims';
import * as THREE from 'three';
import type {PartPose} from '../three/SvgRig';
import {ImageCard} from '../three/ImageCard';
import {ImageRig} from '../three/ImageRig';
import {doomImgRig, doomHands, facePose, FACE, FACE0} from '../chars/doomImg';
import {KingRoom} from './KingRoom';
import {Piece} from './sprite';

const KingLights: React.FC = () => (
  <>
    <hemisphereLight args={['#fff6ec', '#a9a0b8', 1.55]} />
    <directionalLight position={[7, 14, 12]} intensity={1.9} color={'#fff1dc'} castShadow
      shadow-mapSize={[2048, 2048]} shadow-radius={10} shadow-blurSamples={18} shadow-bias={-0.0006} shadow-normalBias={0.03}
      shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-6} shadow-camera-near={1} shadow-camera-far={60} />
  </>
);

/** step timeline for drawings that swap */
const at = <T,>(f: number, steps: [number, T][]): T => { let v = steps[0][1]; for (const [k, x] of steps) if (f >= k) v = x; return v; };

// king picture pieces (public/king): k-2 body without arms (530x986), k-1 shocked head, k-3 resting arm, k-4 hand-to-chin arm, k-5 raised open arm
type Arm = 'rest' | 'chin' | 'up';
const ARM: Record<Arm, {src: string; pivot: [number, number]; scale: number}> = {
  rest: {src: 'king/k-3.png', pivot: [84, 30], scale: 0.84},
  chin: {src: 'king/k-4.png', pivot: [172, 238], scale: 0.95},
  up: {src: 'king/k-5.png', pivot: [52, 236], scale: 0.8},
};
const SH_L: [number, number] = [118, 505], SH_R: [number, number] = [412, 505]; // shoulders on the body picture
const EYES: [number, number][] = [[207, 226], [324, 226]];

const King: React.FC<{f: number}> = ({f}) => {
  // beats (shot frames): 0 smug, hands on the armrests | 8 his left hand comes up to the beard, thinking | 20 hand drops to the belly
  // | 23 palm turns up in a little shrug, 27 raised higher | 33 hand back on the armrest, suspicious squint | 39 shocked face
  // | 41 both arms fly up, palms out, 44 higher | 42 green puffs at his hips -> 46 he is gone (Doom sits there)
  const armR = at<Arm>(f, [[0, 'rest'], [8, 'chin'], [20, 'rest'], [23, 'up'], [33, 'rest'], [41, 'up']]);
  const armL = at<Arm>(f, [[0, 'rest'], [41, 'up']]);
  const rotR = track(f, [[0, -36], [8, -24], [12, -30], [16, -26], [20, -50], [23, 40], [27, 6], [33, -36], [41, 30], [44, -5]], 4) + drift(f, 3) * 1.2;
  const rotL = track(f, [[0, 36], [41, -30], [44, 5]], 4) + drift(f, 5) * 1.2;
  const shocked = f >= 39;
  const blink = [5, 30].some((b) => f >= b && f < b + 3);
  const squint = f >= 33 && f < 39;
  const bob = Math.sin((f / 24) * Math.PI * 2 / 1.3) * 0.012 + track(f, [[0, 0], [39, 0.06], [42, 0.03]], 3);
  const tilt = track(f, [[0, 1.2], [8, -1.5], [20, 0.5], [23, 2], [33, -2], [39, 0], [41, 0.8]], 5) + drift(f, 1) * 0.5;
  return (
    <ImageCard src="king/k-2.png" height={4.55} pos={[0, 0.3 + bob, -0.3]} tilt={tilt}>
      {/* arms in front (they must cover the armrest front edge, the body itself sits behind it) */}
      <group position={[0, 0, 0.32]}>
        {/* every drawing stays mounted (textures load once); only the active one shows */}
        {(Object.keys(ARM) as Arm[]).map((k) => (
          <React.Fragment key={k}>
            <Piece src={ARM[k].src} at={SH_L} pivot={ARM[k].pivot} scale={ARM[k].scale} flip rot={rotL} hide={armL !== k} />
            <Piece src={ARM[k].src} at={SH_R} pivot={ARM[k].pivot} scale={ARM[k].scale} rot={rotR} hide={armR !== k} />
          </React.Fragment>
        ))}
      </group>
      <Piece src="king/k-1.png" at={[264, 0]} pivot={[218, 0]} z={0.01} hide={!shocked} />
      {!shocked && (blink || squint) ? EYES.map(([x, y], i) => (
        <group key={i} position={[x, y + (blink ? 0 : -24), 0.01]}>
          <mesh scale={[1, 0.62, 1]}><circleGeometry args={[52, 40]} /><meshBasicMaterial color={'#e4a679'} fog={false} /></mesh>
          {squint ? <mesh position={[0, -34, 0.002]} rotation={[0, 0, (i ? -8 : 8) * Math.PI / 180]}><planeGeometry args={[110, 16]} /><meshBasicMaterial color={'#6a3a1e'} fog={false} /></mesh> : null}
        </group>
      )) : null}
    </ImageCard>
  );
};

/** light-green magic puff: a cluster of discs */
const Puff: React.FC<{pos: V3; s: number; o?: number}> = ({pos, s, o = 1}) => (
  <group position={pos} scale={s}>
    {[[0, 0, 0.5], [0.45, 0.05, 0.38], [-0.45, 0.02, 0.36], [0.2, 0.28, 0.36], [-0.2, 0.25, 0.32]].map(([x, y, r], i) => (
      <mesh key={i} position={[x, y, 0]} renderOrder={960}><circleGeometry args={[r, 20]} /><meshBasicMaterial color={'#a6f39a'} transparent opacity={o} fog={false} depthWrite={false} /></mesh>
    ))}
  </group>
);

/** 4-point star sparkle (two thin crossed diamonds) with a faint core glow */
const Star: React.FC<{pos: V3; s: number; o: number}> = ({pos, s, o}) => (
  <group position={pos} scale={s}>
    {[0, Math.PI / 2].map((r) => (
      <mesh key={r} rotation={[0, 0, r]} renderOrder={970}>
        <shapeGeometry args={[new THREE.Shape([new THREE.Vector2(0, 1), new THREE.Vector2(0.13, 0), new THREE.Vector2(0, -1), new THREE.Vector2(-0.13, 0)])]} />
        <meshBasicMaterial color={'#c8ffd6'} transparent opacity={o} fog={false} depthWrite={false} />
      </mesh>
    ))}
    <mesh renderOrder={969}><circleGeometry args={[0.28, 16]} /><meshBasicMaterial color={'#7dffa8'} transparent opacity={o * 0.35} fog={false} depthWrite={false} /></mesh>
  </group>
);

// Doom SEATED, built from the standing rig: two instances of the same pose.
// back instance (behind the armrest fronts): cape + shortened legs hanging from the seat (boots show);
// front instance (in front of the armrests): torso, arms resting on the armrests, hood, mantle.
const DOOM_H = 4.25, DOOM_Y = 0.36;
const Doom: React.FC<{f: number; cam: V3}> = ({f, cam}) => {
  const g = f - 46;
  const lean = track(f, [[46, 0], [48, -2.5], [53, 1.5]], 4) + drift(f, 3) * 0.3; // he settles in with a small sway
  const pose: Record<string, PartPose> = {
    ...doomHands('open', 'open'),
    ...facePose({...FACE0, ...FACE.angry, turn: track(f, [[46, 0.25], [50, 0.05]], 4) + drift(f, 2) * 0.04, px: track(f, [[46, 0.4], [50, 0]], 4), py: 0}),
    body: {x: 0, y: Math.sin(f * 0.25) * 1.0, rot: lean},
    hood: {rot: track(f, [[46, 4], [50, -2], [55, 1]], 5) + drift(f, 4) * 0.8, x: 0, y: 0},
    legs: {sy: 0.8},
    // upper arms out and down, forearms foreshortened as they lie forward on the armrests, hands draped over the front edge
    armL: {rot: 30 + drift(f, 6) * 0.6}, foreL: {rot: -10, sy: 0.75}, openL: {rot: -14},
    armR: {rot: -30 + drift(f, 7) * 0.6}, foreR: {rot: 10, sy: 0.75}, openR: {rot: 14},
  };
  const pop = 1 + 0.06 * Math.exp(-g / 2) * Math.cos(g * 1.4);
  const back: Record<string, PartPose> = {...pose, body: {...pose.body, hide: true}};
  const front: Record<string, PartPose> = {...pose, cape: {hide: true}, legs: {hide: true}};
  // the front copy sits nearer the camera: shrink it about the camera axis so both copies line up on screen
  const zb = -0.3, zf = 0.12, k = (cam[2] - zf) / (cam[2] - zb);
  const fy = cam[1] + (DOOM_Y - cam[1]) * k, fx = cam[0] + (0 - cam[0]) * k;
  return (
    <>
      <group position={[0, DOOM_Y, zb]} scale={[pop, pop, 1]}><ImageRig rig={doomImgRig} worldHeight={DOOM_H} pose={back} /></group>
      <group position={[fx, fy, zf]} scale={[pop * k, pop * k, 1]}><ImageRig rig={doomImgRig} worldHeight={DOOM_H} pose={front} /></group>
    </>
  );
};

const Scene: React.FC<{f: number; t: number}> = ({f, t}) => {
  const e = inOut(t);
  const camPos = lerp3([-0.19, 2.4, 10], [0.12, 2.4, 9.8], e);
  const look: V3 = [camPos[0], 2.4, -10];
  const doom = f >= 46;
  // puffs: two at his hips from 42, then a burst around Doom that drifts up and fades
  const puffs: {p: V3; s: number; o: number}[] = [];
  if (f >= 42 && f < 46) [[-0.85, 1.55], [0.95, 1.55]].forEach(([x, y]) => puffs.push({p: [x, y, 0.45], s: 0.22 + (f - 42) * 0.02, o: 1}));
  if (doom) {
    const g = f - 46;
    [[1.55, 4.85, 0], [1.1, 4.2, 1], [-1.0, 5.2, 2]].forEach(([x, y, i]) => {
      if (i === 2 && g > 5) return; // the left puff only flashes at the swap
      puffs.push({p: [x + g * 0.012, y + g * 0.01, 0.6], s: 0.36 - i * 0.04, o: Math.max(0, Math.min(1, (g + 2) / 2)) * Math.max(0, 1 - Math.max(0, g - 9) / 5)});
    });
  }
  // sparkles: [x, y, phase] - each twinkles on its own (size and brightness)
  const STARS: [number, number, number][] = [[-2.6, 5.15, 0], [-1.35, 4.75, 1.3], [1.9, 5.3, 2.1], [1.95, 4.35, 3.0], [3.3, 5.1, 0.7], [-3.6, 4.4, 2.6], [2.5, 3.6, 1.8]];
  return (
    <>
      <Cam pos={camPos} look={look} fov={30} />
      <KingLights />
      <Post focus={[0, 2.5, -0.3]} blur={0.35} />
      <KingRoom />
      {doom ? <Doom f={f} cam={camPos} /> : <King f={f} />}
      {puffs.map((p, i) => p.o > 0.02 ? <Puff key={i} pos={p.p} s={p.s} o={p.o} /> : null)}
      {doom ? STARS.map(([x, y, ph], i) => {
        const g = f - 46, tw = 0.5 + 0.5 * Math.sin(g * 0.55 + ph * 2.1);
        return tw > 0.05 ? <Star key={i} pos={[x, y + g * 0.008, 0.7]} s={0.09 + 0.07 * tw} o={Math.min(1, tw * 1.4)} /> : null;
      }) : null}
      {/* floating dust */}
      {Array.from({length: 26}, (_, i) => {
        const x = ((i * 37) % 100) / 100 * 9 - 4.5, y = ((i * 53) % 100) / 100 * 6 + 0.5 + Math.sin(f * 0.05 + i) * 0.1;
        return <Speck key={`d${i}`} pos={[x + f * 0.004, y, 1.5 + (i % 5) * 0.6]} s={0.025} color={'#f4ead8'} opacity={0.35} />;
      })}
    </>
  );
};

export const KING: ShotDef = {id: 'king', len: 59, bg: '#5e5660', Scene};
