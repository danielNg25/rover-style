import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Ball, Speck} from '../three/prims';
import {Cam, Lights, V3, lerp3, track, trackObj, drift} from '../three/stage';
import {Post} from '../three/Post';
import {ImageRig} from '../three/ImageRig';
import {doomImgRig, doomHands, facePose, FACE0, Face} from '../chars/doomImg';
import type {PartPose} from '../three/SvgRig';
import type {ShotDef} from './types';
import {pixMap, PxPoly, PxRect, rand} from './bkit';

// Measured on ref frames 142 / 172: mask 390 px wide (centre 820, 365) -> Doom ~3.2 units from a 30deg lens.
// The throne panel behind barely moves; the label drifts up-left ~20 px (camera sinks a touch, label is near the lens);
// Doom himself leans in and to his right (face grows ~5 % and slides ~40 px left).
const FOV = 30, CAM0: V3 = [0, 2.237, 3.23], CAM1: V3 = [0.012, 2.204, 3.18];
const M = pixMap(CAM0, FOV);
const H = 2.9;
const DOOM: V3 = [0.433, 0, 0];
const LABEL_Z = 1.0;
const ARROW_DRAW: [number, number] = [0, 0]; // frames over which the arrow draws on; the reference shows it complete from frame 0
type Hand = 'fist' | 'open' | 'glow';
type Body = {x: number; y: number; z: number; lean: number; headRot: number; headX: number; headY: number};
type Arms = {armL: number; foreL: number; wristL: number; armR: number; foreR: number; wristR: number};
type Beat<T> = [number, Partial<T>];

/** Copied from HallSeq's Doom (no glow): every channel is a pose-to-pose track, drift keeps the holds alive. */
const Doom: React.FC<{pos: V3; f: number; face: Face; body: Body; arms: Arms; hands: [Hand, Hand]}> = ({pos, f, face, body, arms, hands}) => {
  const sec = f / 24, breath = Math.sin((sec * Math.PI * 2) / 1.15);
  const pose: Record<string, PartPose> = {
    ...doomHands(hands[0], hands[1]),
    ...facePose({...face, turn: face.turn + drift(f, 1) * 0.03, px: face.px + drift(f, 2) * 0.03}),
    body: {x: body.x, y: 12 + body.y + breath * 1.0, rot: body.lean + drift(f, 3) * 0.25},
    hood: {rot: body.headRot + drift(f, 4) * 0.6, x: body.headX + drift(f, 5) * 0.5, y: -12 + body.headY + breath * 0.4},
    cape: {y: body.y * 0.55, x: body.x * 0.6},
    armL: {rot: arms.armL + drift(f, 6) * 0.8}, foreL: {rot: arms.foreL + drift(f, 7) * 1.2},
    armR: {rot: arms.armR + drift(f, 8) * 0.8}, foreR: {rot: arms.foreR + drift(f, 9) * 1.2},
  };
  // close-up: the reference mask reads a little taller and sits higher in the hood than on the full-body rig
  pose.mask = {...pose.mask, sy: 1.1, y: (pose.mask?.y ?? 0) - 6};
  // in this framing the arms sit below the frame: hide the left arm, and the right one until it rises to the chain
  pose.armL = {hide: true};
  if (f < 18) pose.armR = {hide: true};
  (['fist', 'open', 'glow'] as Hand[]).forEach((h) => {
    if (!pose[`${h}L`]?.hide) pose[`${h}L`] = {rot: arms.wristL + drift(f, 10) * 2};
    if (!pose[`${h}R`]?.hide) pose[`${h}R`] = {rot: arms.wristR + drift(f, 11) * 2};
  });
  return <ImageRig rig={doomImgRig} worldHeight={H} pos={[pos[0], pos[1], pos[2] + body.z]} pose={pose} />;
};

/** Text drawn into a canvas texture, laid in the set as a flat card (so it parallaxes with the camera). */
const Label: React.FC<{text: string; x0: number; x1: number; baseline: number; z: number; color: string}> = ({text, x0, x1, baseline, z, color}) => {
  const {tex, w, h, bx, by, tw} = useMemo(() => {
    const cw = 1400, ch = 260, c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d')!;
    g.font = "800 150px 'Avenir Next', 'Helvetica Neue', Arial, sans-serif";
    const tw = g.measureText(text).width, bx = 30, by = 180;
    g.shadowColor = 'rgba(255,255,255,0.35)'; g.shadowBlur = 18;
    g.fillStyle = color; g.fillText(text, bx, by);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return {tex: t, w: cw, h: ch, bx, by, tw};
  }, [text, color]);
  // canvas px -> reference px: the text spans x0..x1 on the reference
  const k = (x1 - x0) / tw, ppu = M.ppu(z);
  const left = x0 - bx * k, top = baseline - by * k;
  const c = M.pt(left + (w * k) / 2, top + (h * k) / 2, z);
  return (
    <mesh position={c} renderOrder={990}>
      <planeGeometry args={[(w * k) / ppu, (h * k) / ppu]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
};

/** Hand-drawn curved arrow (tapered ribbon + filled head), drawing on with `p` 0..1. Laid out in reference px. */
const Arrow: React.FC<{p: number; z: number}> = ({p, z}) => {
  const P0: [number, number] = [399, 398], P1: [number, number] = [402, 458], P2: [number, number] = [486, 459];
  const bez = (t: number): [number, number] => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]];
  const n = 28, m = Math.max(2, Math.round(n * Math.min(1, p)));
  const L: [number, number][] = [], R: [number, number][] = [];
  for (let i = 0; i <= m; i++) {
    const t = (i / n), a = bez(t), b = bez(Math.min(1, t + 0.01)), dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const wd = 1.6 + 1.4 * t; // thin start, a bit heavier toward the head, like a marker stroke
    L.push([a[0] - (dy / len) * wd, a[1] + (dx / len) * wd]); R.push([a[0] + (dy / len) * wd, a[1] - (dx / len) * wd]);
  }
  if (p <= 0.02) return null;
  return (
    <group>
      <PxPoly m={M} pts={[...L, ...R.reverse()]} z={z} color={'#121214'} />
      {p >= 0.98 ? <PxPoly m={M} pts={[[516, 460], [478, 448], [484, 460], [479, 473]]} z={z + 0.001} color={'#121214'} /> : null}
    </group>
  );
};

/** Throne back (green panel, gold frame, gold diamonds), the cream arm pillar on the left, a far peek at the left. */
const Set: React.FC<{f: number}> = ({f}) => {
  const PZ = -2.0, PILZ = 0.55;
  const diamonds: [number, number][] = [[455, 25], [630, 25], [905, 25], [1085, 25], [470, 282], [590, 282], [1090, 282], [905, 282]];
  const dust = useMemo(() => { const r = rand(5); return Array.from({length: 24}, () => [r() * 1280, r() * 720, 1.5 + r() * 2.5] as const); }, []);
  return (
    <group>
      {/* wall behind */}
      <PxRect m={M} x0={-800} y0={-800} x1={2200} y1={1400} z={-3.2} color={'#c8c0a7'} />
      {/* far peek through at the top-left: sky, green hill, grey tower */}
      <PxRect m={M} x0={-100} y0={-80} x1={150} y1={175} z={-3.0} color={'#648280'} />
      <PxPoly m={M} pts={[[-100, 175], [-100, 120], [60, 100], [150, 140], [150, 175]]} z={-2.99} color={'#4c7451'} />
      <PxRect m={M} x0={88} y0={-80} x1={138} y1={175} z={-2.98} color={'#c1c4cb'} />
      <PxRect m={M} x0={62} y0={60} x1={150} y1={100} z={-2.97} color={'#d3d5da'} />
      <PxRect m={M} x0={140} y0={-80} x1={330} y1={600} z={-2.96} color={'#cdc6ae'} />
      {/* throne panel */}
      <PxRect m={M} x0={308} y0={-200} x1={1228} y1={552} z={PZ} color={'#baa13c'} />
      <PxRect m={M} x0={358} y0={-200} x1={1176} y1={500} z={PZ + 0.01} color={'#52ba5b'} />
      {diamonds.map(([x, y], i) => <PxPoly key={i} m={M} pts={[[x, y - 58], [x + 46, y], [x, y + 58], [x - 46, y]]} z={PZ + 0.02} color={'#ecd27c'} />)}
      <PxRect m={M} x0={1228} y0={-200} x1={1500} y1={900} z={PZ - 0.05} color={'#cbc3ac'} />
      {/* near arm pillar (soft, out of focus) */}
      <Box size={[0.75, 3, 0.7]} pos={[-1.25, 1.05, PILZ]} color={'#ece6c9'} unlit />
      <Box size={[0.05, 3, 0.02]} pos={[-0.9, 1.05, PILZ + 0.36]} color={'#d2ccb4'} cast={false} unlit />
      <Box size={[0.8, 0.06, 0.75]} pos={[-1.25, 2.56, PILZ]} color={'#d9d2b6'} unlit />
      <Ball r={0.28} pos={[-1.62, 2.86, PILZ - 0.25]} color={'#9a7a2a'} />
      {dust.map(([x, y, s], i) => { const p = M.pt(x + Math.sin(f * 0.06 + i) * 6, y - f * (0.3 + (i % 3) * 0.2), -1.0); return <Speck key={i} pos={p} s={s * 0.004} color={'#fff6d0'} opacity={0.45 + 0.35 * Math.sin(f * 0.3 + i)} />; })}
    </group>
  );
};

const Scene: React.FC<{f: number; t: number}> = ({f, t}) => {
  const c = lerp3(CAM0, CAM1, t);
  // beats (read off the reference, 3-frame steps): 0 calm stare, eyes a touch left | 3 eyes centre | 5 brows drop, slits slant
  // | 7 full scowl, eyes flick left | 10 head tips right (cw), eyes further left | 13 tips more, eyes centre | 17 head levels
  // | 19 right hand rises to the clasp chain | 21 head tips back to the left (ccw) and leans in | 26 eyes drift left again
  // (keys sit ~2 frames before the reference pose so the 3-4 frame settle lands on it)
  const face = trackObj<Face>(f, [
    [0, {...FACE0, slant: 2, open: 0.95, browL: 5, browR: 5, browYL: 0, browYR: 0, px: -0.35, py: 0}],
    [3, {px: 0, up: 0.15, open: 0.9}],
    [5, {slant: 8, browL: 11, browR: 11, browYL: 2, browYR: 2, px: -0.2, up: 0}],
    [7, {slant: 13, open: 0.82, browL: 17, browR: 17, browYL: 3, browYR: 3, turn: 0.2, px: -0.35}],
    [10, {turn: -0.15, px: -0.55}],
    [13, {turn: 0.15, px: 0}],
    [17, {turn: 0, px: -0.1}],
    [21, {turn: -0.3, px: 0.05, browL: 19, browR: 14}],
    [26, {px: -0.35}],
  ] as Beat<Face>[], 3);
  const body = trackObj<Body>(f, [
    [0, {x: 0, y: 0, z: 0, lean: 0, headRot: 0, headX: 0, headY: 0}],
    [3, {headY: -1.5}],
    [7, {headRot: 1.5, headY: 0}],
    [10, {headRot: 3, headX: -2}],
    [13, {headRot: 5, headX: 2}],
    [17, {headRot: 0.5, headX: 0}],
    [21, {headRot: -6, headX: -4, lean: -1.5, z: 0.12, x: -2}],
    [26, {headRot: -5}],
  ] as Beat<Body>[], 4);
  const arms = trackObj<Arms>(f, [
    [0, {armL: 4, foreL: 2, wristL: 0, armR: -4, foreR: -2, wristR: 0}],
    [19, {armR: 60, foreR: 100, wristR: -18}],
    [26, {wristR: -12, foreR: 96}],
  ] as Beat<Arms>[], 4);
  const arrowP = ARROW_DRAW[1] > ARROW_DRAW[0] ? Math.min(1, Math.max(0, (f - ARROW_DRAW[0]) / (ARROW_DRAW[1] - ARROW_DRAW[0]))) : 1;
  const lean = track(f, [[0, 0], [23, 1]], 6);
  return (
    <>
      <Cam pos={[c[0] + drift(f, 1) * 0.003, c[1] + drift(f, 2) * 0.003, c[2]]} look={[c[0], c[1], -30]} fov={FOV} />
      <Lights />
      <Post focus={[DOOM[0], 2.2, DOOM[2]]} blur={0.35} />
      <Set f={f} />
      <Doom pos={[DOOM[0] - 0.015 * lean, DOOM[1], DOOM[2]]} f={f} face={face} body={body} arms={arms} hands={['fist', 'fist']} />
      <Label text="doctor doom" x0={57} x1={480} baseline={383} z={LABEL_Z} color={'#18181c'} />
      <Arrow p={arrowP} z={LABEL_Z} />
    </>
  );
};

export const CLOSEUP: ShotDef = {id: 'closeup', len: 31, bg: '#c8c0a7', Scene};
