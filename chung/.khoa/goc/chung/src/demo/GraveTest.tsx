import React, {useMemo} from 'react';
import {AbsoluteFill, Composition, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Puppet3} from '../mould/Puppet3';
import {act, blink, Key} from '../mould/act';
import type {Spec} from '../mould/draw';
import {EXPR} from '../mould/expr';
import {AutoRecv} from '../lib3/kit';

/** Ten-second test of the mould puppet on the 3D stage: the reference's grave scene (frames 2744-2996, four shots)
 *  rebuilt with the vector boy, one shadow-casting light per set, and pop-and-hold acting read off the reference.
 *  Sets are plain primitives; the point of the test is the character. */
type V3 = [number, number, number];
const H = 1.25;   // the boy's world height
const L: React.FC<{c: string}> = ({c}) => <meshLambertMaterial color={c} />;
const rnd = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

const Cam: React.FC<{a: {pos: V3; look: V3}; b: {pos: V3; look: V3}; t: number; fov: number; roll?: number}> = ({a, b, t, fov, roll = 0}) => {
  const {camera} = useThree(), c = camera as THREE.PerspectiveCamera, m = (i: number, k: 'pos' | 'look') => a[k][i] + (b[k][i] - a[k][i]) * t;
  c.position.set(m(0, 'pos'), m(1, 'pos'), m(2, 'pos')); c.fov = fov; c.near = 0.1; c.far = 200; c.lookAt(m(0, 'look'), m(1, 'look'), m(2, 'look')); c.rotateZ((-roll * t * Math.PI) / 180); c.updateProjectionMatrix();
  return null;
};
const Sky: React.FC<{c: string}> = ({c}) => { const {scene} = useThree(); scene.background = useMemo(() => new THREE.Color(c), [c]); return null; };

const Pine: React.FC<{pos: V3; h: number}> = ({pos, h}) => (
  <group position={pos}>
    <mesh position={[0, h * 0.1, 0]}><cylinderGeometry args={[h * 0.03, h * 0.04, h * 0.2, 6]} /><L c="#4a3a34" /></mesh>
    {[0, 1, 2, 3].map((i) => { const r = h * (0.3 - i * 0.06), y = h * (0.3 + i * 0.19); return (
      <group key={i}>
        <mesh position={[0, y, 0]} castShadow><coneGeometry args={[r, h * 0.34, 7]} /><L c="#3f5f58" /></mesh>
        <mesh position={[0, y + h * 0.055, 0]}><coneGeometry args={[r * 0.86, h * 0.25, 7]} /><L c="#eef1f7" /></mesh>
      </group>); })}
  </group>
);
const Rock: React.FC<{pos: V3; s: number; snow?: boolean}> = ({pos, s, snow = true}) => (
  <group position={pos}>
    <mesh position={[0, s * 0.42, 0]} scale={[1, 0.8, 0.9]} castShadow receiveShadow><dodecahedronGeometry args={[s * 0.55, 0]} /><L c="#727b93" /></mesh>
    {snow ? <mesh position={[0, s * 0.78, 0]} scale={[1, 0.3, 0.9]}><sphereGeometry args={[s * 0.4, 10, 8]} /><L c="#eef1f7" /></mesh> : null}
  </group>
);
const Snow: React.FC<{f: number; seed: number; box: [number, number, number, number]}> = ({f, seed, box}) => {
  const pts = useMemo(() => { const r = rnd(seed); return Array.from({length: 110}, () => [r(), r(), r(), 0.009 + r() * 0.011, 0.5 + r()] as const); }, [seed]);
  return <>{pts.map(([x, y, z, s, v], i) => { const yy = (((y - (f * v) / 260) % 1) + 1) % 1; return <mesh key={i} position={[box[0] + x * box[1], yy * 4.2, box[2] + z * box[3]]}><circleGeometry args={[s, 8]} /><meshBasicMaterial color="#f4f6fb" /></mesh>; })}</>;
};
const Flat: React.FC<{pts: [number, number][]; c: string; pos: V3}> = ({pts, c, pos}) => {
  const geo = useMemo(() => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); return new THREE.ShapeGeometry(s); }, [JSON.stringify(pts)]);
  return <mesh geometry={geo} position={pos}><meshBasicMaterial color={c} /></mesh>;
};
const Lights: React.FC<{dir: V3; sky: string; ground: string}> = ({dir, sky, ground}) => (
  <>
    <hemisphereLight args={[sky, ground, 1.75]} />
    <directionalLight position={dir} intensity={1.55} color="#fff4e6" castShadow shadow-mapSize={[2048, 2048]} shadow-radius={7} shadow-blurSamples={16} shadow-bias={-0.0005}
      shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-5} shadow-camera-near={1} shadow-camera-far={40} />
  </>
);

/** The road below the castle (shots B and D). The boy stands at the origin, on the road, facing +z. */
const Road: React.FC<{f: number}> = ({f}) => (
  <group>
    <Sky c="#aeb4c6" />
    <Lights dir={[-6, 7.5, 5]} sky="#e9eefa" ground="#a9afc0" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1.5]} receiveShadow><planeGeometry args={[40, 6]} /><L c="#8e8783" /></mesh>
    <mesh position={[0, 0.07, -8.2]} receiveShadow><boxGeometry args={[40, 0.14, 14]} /><L c="#d9dee9" /></mesh>
    <mesh position={[0, 0.02, -1.24]} rotation={[-0.9, 0, 0]} receiveShadow><planeGeometry args={[40, 0.2]} /><L c="#c3c9d8" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0.5]} position={[5.2, 0.15, -6]}><planeGeometry args={[2.4, 14]} /><L c="#948d89" /></mesh>
    {Array.from({length: 7}, (_, i) => { const x = -1.7 - i * 0.7, z = -3.4 - i * 0.28; return (
      <group key={i}>
        <mesh position={[x, 0.5, z]} castShadow><boxGeometry args={[0.1, 0.74, 0.1]} /><L c="#4c352c" /></mesh>
        <mesh position={[x, 0.9, z]}><boxGeometry args={[0.14, 0.06, 0.14]} /><L c="#eef1f7" /></mesh>
      </group>); })}
    {[0.42, 0.7].map((y) => <mesh key={y} position={[-3.8, y, -4.24]} rotation={[0, -0.38, 0]} castShadow><boxGeometry args={[4.6, 0.07, 0.05]} /><L c="#553b30" /></mesh>)}
    <group position={[1.55, 0.14, -4.6]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow><boxGeometry args={[0.5, 0.8, 0.22]} /><L c="#8f97a6" /></mesh>
      <mesh position={[0, 0.86, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.36, 0.36, 0.22]} /><L c="#8f97a6" /></mesh>
      <mesh position={[0, 0.42, 0.115]}><planeGeometry args={[0.26, 0.4]} /><L c="#6f7787" /></mesh>
      <mesh position={[0, 1.07, 0]} scale={[1, 0.35, 1]}><sphereGeometry args={[0.2, 8, 6]} /><L c="#eef1f7" /></mesh>
    </group>
    <Pine pos={[-2.9, 0.14, -9]} h={3.6} /><Pine pos={[-5.2, 0.14, -11]} h={2.6} /><Pine pos={[0.9, 0.14, -10.5]} h={3.8} /><Pine pos={[2.6, 0.14, -12]} h={3.2} />
    <Rock pos={[-3.6, 0.14, -4.6]} s={0.36} /><Rock pos={[0.9, 0.14, -5.2]} s={0.4} />
    {/* far: hills, the castle wall with lit windows and the gate, village houses */}
    <Flat pts={[[-30, 0], [-30, 2.6], [-14, 4.2], [-2, 2.4], [8, 4.4], [20, 2.8], [30, 4], [30, 0]]} c="#8f9bb9" pos={[0, 0, -16]} />
    <Flat pts={[[-30, 0], [-30, 1.8], [-12, 2.8], [-3, 1.6], [6, 2.0], [10, 3.2], [30, 2.0], [30, 0]]} c="#a7b0c8" pos={[0, 0, -13]} />
    <Flat pts={[[-9, 2.5], [-4.5, 3.2], [-1.2, 2.7], [-1.6, 2.45], [-4.6, 2.9], [-9, 2.25]]} c="#f0f3f9" pos={[4, 0, -12.9]} />
    <mesh position={[0, 6, -26]}><planeGeometry args={[60, 14]} /><meshBasicMaterial color="#8d92a3" /></mesh>
    {useMemo(() => { const r = rnd(11); return Array.from({length: 26}, () => [-16 + r() * 32, 3.2 + r() * 6.5, 0.5 + r() * 0.7] as const); }, []).map(([x, y, w], i) => <mesh key={i} position={[x, y, -25.95]}><planeGeometry args={[w, 0.34]} /><meshBasicMaterial color="#838899" /></mesh>)}
    {[[-9, 6.4], [-2, 7.2], [8.4, 7.4], [14, 6]].map(([x, y], i) => <group key={i} position={[x, y, -25.9]}><mesh><planeGeometry args={[0.14, 0.9]} /><meshBasicMaterial color="#6f7488" /></mesh><mesh position={[0, 0.12, 0]}><planeGeometry args={[0.5, 0.14]} /><meshBasicMaterial color="#6f7488" /></mesh></group>)}
    {Array.from({length: 16}, (_, i) => <mesh key={i} position={[-22 + i * 3, 13.3, -25.9]}><planeGeometry args={[1.5, 1.2]} /><meshBasicMaterial color="#9da2b1" /></mesh>)}
    {[[-5.2, 5.6], [5.6, 5.9], [-12, 6.6], [11.5, 6.8]].map(([x, y], i) => (
      <group key={i} position={[x, y, -25.8]}><mesh><planeGeometry args={[0.7, 1.3]} /><meshBasicMaterial color="#f6cd72" /></mesh><mesh position={[0, 0.65, 0]}><circleGeometry args={[0.35, 12]} /><meshBasicMaterial color="#f6cd72" /></mesh></group>))}
    <Flat pts={[[-1.1, 0], [-1.1, 2.6], [0, 3.5], [1.1, 2.6], [1.1, 0]]} c="#20243a" pos={[1.2, 3.4, -25.8]} />
    {[[12, 3.9, 0.8], [-13, 3.4, 0.7], [16, 3.5, 0.6]].map(([x, y, s], i) => (
      <group key={i} position={[x, y, -15.5]} scale={s}>
        <mesh><planeGeometry args={[2.6, 1.8]} /><meshBasicMaterial color="#b9bfd0" /></mesh>
        <Flat pts={[[-1.7, 0.9], [0, 2.3], [1.7, 0.9]]} c="#eef1f7" pos={[0, 0, 0.01]} />
        {[-0.6, 0.1, 0.8].map((wx) => <mesh key={wx} position={[wx, -0.2, 0.02]}><planeGeometry args={[0.36, 0.5]} /><meshBasicMaterial color="#f6cd72" /></mesh>)}
      </group>))}
    <Snow f={f} seed={7} box={[-5, 10, -9, 9.5]} />
  </group>
);

const stoneText = () => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 640; const g = c.getContext('2d')!;
  g.fillStyle = '#474b58'; g.textAlign = 'center'; g.font = '900 96px Georgia, "Times New Roman", serif'; g.fillText('WERNER', 256, 130);
  g.font = '900 74px Georgia, "Times New Roman", serif'; g.fillText('VON DOOM', 256, 232); g.fillRect(96, 290, 320, 8);
  g.font = '700 58px Georgia, "Times New Roman", serif'; g.fillText('1886 - 1931', 256, 392);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
/** The roadside grave (shots A and C). The boy stands at the origin; the stone is to his right (screen left). */
const Grave: React.FC<{f: number}> = ({f}) => {
  const slab = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-0.58, 0); s.lineTo(-0.58, 1.25); s.absarc(0, 1.25, 0.58, Math.PI, 0, true); s.lineTo(0.58, 0); return new THREE.ExtrudeGeometry(s, {depth: 0.26, bevelEnabled: false}); }, []);
  const cap = useMemo(() => { const s = new THREE.Shape(); s.absarc(0, 1.25, 0.62, Math.PI * 0.94, Math.PI * 0.06, true); s.absarc(0, 1.2, 0.58, Math.PI * 0.06, Math.PI * 0.94, false); return new THREE.ExtrudeGeometry(s, {depth: 0.3, bevelEnabled: false}); }, []);
  const text = useMemo(stoneText, []);
  return (
    <group>
      <Sky c="#4b5375" />
      <Lights dir={[-5, 7.5, 6]} sky="#e6ebf8" ground="#a6adc0" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 40]} /><L c="#d5dae6" /></mesh>
      <group position={[-1.45, 0, -0.1]} scale={0.84}>
        <mesh geometry={slab} castShadow receiveShadow><L c="#9aa2ae" /></mesh>
        <mesh geometry={cap} position={[0, 0, -0.02]}><L c="#eef1f7" /></mesh>
        <mesh position={[0, 0.98, 0.265]}><planeGeometry args={[0.98, 1.22]} /><meshBasicMaterial map={text} transparent /></mesh>
        <mesh position={[-0.1, 0.02, 0.75]} scale={[1.25, 0.24, 0.6]} receiveShadow><sphereGeometry args={[0.8, 16, 10]} /><L c="#eef1f7" /></mesh>
        {[[0.52, 0.2], [0.6, 0.34]].map(([x, h2], i) => <mesh key={i} position={[x, h2, 0.36]} rotation={[0, 0, -0.12 + i * 0.2]}><cylinderGeometry args={[0.012, 0.012, 0.4, 5]} /><L c="#7b3d47" /></mesh>)}
        <Rock pos={[-0.95, 0, 0.55]} s={0.22} /><Rock pos={[0.9, 0, 0.5]} s={0.2} /><Rock pos={[1.15, 0, 0.3]} s={0.16} />
      </group>
      <Rock pos={[0.95, 0, -2.6]} s={0.8} /><Rock pos={[1.7, 0, -1.6]} s={0.26} /><Rock pos={[-0.3, 0, -1.9]} s={0.22} />
      {/* rope fence and the signpost with two flags */}
      {[[-0.55, -1.6], [-2.6, -2.2], [-4.6, -2.8]].map(([x, z], i) => <mesh key={i} position={[x, 0.45, z]} castShadow><boxGeometry args={[0.09, 0.9, 0.09]} /><L c="#4c352c" /></mesh>)}
      {[[-1.57, -1.9], [-3.6, -2.5]].map(([x, z], i) => <mesh key={i} position={[x, 0.66, z]} rotation={[0, 0.28, 0]}><boxGeometry args={[2.1, 0.03, 0.03]} /><L c="#8a7867" /></mesh>)}
      <group position={[-3.2, 0, -3.4]}>
        <mesh position={[0, 1.2, 0]} castShadow><boxGeometry args={[0.1, 2.4, 0.1]} /><L c="#4c352c" /></mesh>
        <Flat pts={[[0, 0], [-0.7, 0.05], [-0.55, 0.14], [-0.72, 0.26], [0, 0.22]]} c="#a8443f" pos={[0, 2.05, 0.06]} />
        <Flat pts={[[0, 0], [-0.62, 0.02], [-0.5, 0.1], [-0.64, 0.2], [0, 0.18]]} c="#b9a57e" pos={[0, 1.76, 0.06]} />
      </group>
      <Pine pos={[-4.6, 0, -9]} h={3.6} /><Pine pos={[-2.2, 0, -11]} h={3.0} /><Pine pos={[0.2, 0, -10.5]} h={5.6} /><Pine pos={[2.9, 0, -9]} h={3.6} /><Pine pos={[4.4, 0, -12]} h={3.0} /><Pine pos={[-7, 0, -12]} h={4.2} /><Pine pos={[1.7, 0, -13]} h={2.8} />
      <Flat pts={[[-30, 0], [-30, 3], [-12, 6.5], [-4, 3.5], [5, 7.5], [14, 4], [30, 6.5], [30, 0]]} c="#a39ab2" pos={[0, 0, -18]} />
      <Flat pts={[[-30, 0], [-30, 2], [-10, 3.4], [0, 1.8], [9, 3.6], [30, 2], [30, 0]]} c="#b9b6c9" pos={[0, 0, -15]} />
      <Flat pts={[[-16, 9], [-8, 12], [-2, 6.4], [-3, 6], [-8.5, 10.4], [-16, 7.8]]} c="#dfe2ee" pos={[0, 0, -17.9]} />
      <Flat pts={[[4, 7], [12, 11], [18, 6.6], [17, 6.2], [12, 9.6], [5, 6.4]]} c="#dfe2ee" pos={[0, 0, -17.9]} />
      <Snow f={f} seed={3} box={[-5, 10, -9, 9.5]} />
    </group>
  );
};

// ---------- acting, read off the reference frames (pop and hold, on twos) ----------
const RESET = {lidL: undefined, lidR: undefined, lower: undefined, lowerAmt: undefined, browY: undefined, pupil: undefined} as Partial<Spec['expr']>;
const SAD_LID: Partial<Spec['expr']> = {...RESET, ...EXPR.sad};
const ANGRY: Partial<Spec['expr']> = {...RESET, ...EXPR.angry};
const BOY: Spec = {outfit: 'coat', hair: 'sweep', expr: EXPR.sad, faceDy: -30, whites: '#e6e3df'};
const SHOTS: {len: number; set: 'grave' | 'road'; fov: number; roll?: number; soft?: boolean; blinkKind?: 'half' | 'blank' | 'swap'; camA: {pos: V3; look: V3}; camB: {pos: V3; look: V3}; pos: V3; res: number; base: Spec; keys: Key[]; blinks: number[]}[] = [
  { // A, 2744-2781: wide; he looks up at the stone, lifts a hand toward it and speaks
    len: 38, set: 'grave', fov: 28, camA: {pos: [-0.75, 1.0, 4.75], look: [-0.75, 0.9, 0]}, camB: {pos: [-0.75, 1.0, 4.5], look: [-0.75, 0.9, 0]}, pos: [0.1, 0, 0.3], res: 1.25,
    base: {...BOY, expr: {...BOY.expr, gaze: [-24, -8]}, head: {rot: -3}},
    keys: [{f: 16, inb: 1, x: -10, kick: 0.18, armL: {sh: 30, el: 24, hand: 'relaxed', show: true}}, {f: 22, inb: 1, armL: {sh: 46, el: 62, hand: 'open'}, head: {rot: -6}}, {f: 28, expr: {mouth: 'aw'}}, {f: 32, expr: {mouth: 'down'}, inb: 1, armL: {sh: 40, el: 44}}, {f: 34, expr: {mouth: 'aw'}}],
    blinks: [],
  },
  { // B, 2782-2877: medium; sad, looks up and speaks, sad again, then the brows drop into a scowl
    len: 96, set: 'road', fov: 28, roll: 0.8, blinkKind: 'blank', camA: {pos: [-0.1, 0.6, 2.85], look: [-0.1, 0.63, 0]}, camB: {pos: [0.08, 0.6, 2.72], look: [0.08, 0.63, 0]}, pos: [0, 0, 0], res: 1.6,
    base: {...BOY, head: {rot: 3}},
    keys: [{f: 10, head: {rot: 4, dx: -3}}, {f: 30, inb: 1, x: -16, expr: {...RESET, ...EXPR.sadTalk}, head: {rot: -3, dx: 0, dy: -10}}, {f: 34, expr: {mouth: 'down'}}, {f: 36, expr: {mouth: 'aw'}}, {f: 40, expr: {mouth: 'down'}},
      {f: 44, inb: 1, x: -4, expr: {...SAD_LID, gaze: [0, 24]}, head: {rot: 4, dy: 0}}, {f: 56, inb: 1, x: 10, kick: 0.12, expr: {...RESET, ...EXPR.squint}, head: {rot: 0, dy: 4}}, {f: 70, head: {dy: 8, rot: -1}}, {f: 84, expr: {...RESET, ...EXPR.squint, gaze: [-6, 12]}}],
    blinks: [18],
  },
  { // C, 2878-2920: close-up; fist at the chest, sad, then the glare; the camera pushes in
    len: 43, set: 'grave', fov: 28, roll: -0.6, soft: true, camA: {pos: [0.26, 0.9, 2.08], look: [0.26, 0.9, 0]}, camB: {pos: [0.24, 0.92, 1.9], look: [0.24, 0.92, 0]}, pos: [0.1, 0, 0.3], res: 2.2,
    base: {...BOY, faceDy: 0, head: {dy: -45, rot: 4}, expr: {upper: 'sad', lidL: [-13, -52], lidR: [-8, -52], brow: 'sad', mouth: 'down', gaze: [14, 30]}, armL: {sh: 22, el: -142, hand: 'fist', show: true, front: true}},
    keys: [{f: 12, expr: {upper: 'flat', lidL: [-22, -18], lidR: [-22, -18], brow: 'arc', browY: 30, gaze: [8, 12]}, head: {dy: -45, rot: 1}}, {f: 16, expr: {...ANGRY, gaze: [0, 6]}, head: {dy: -42, rot: -3}}, {f: 20, armL: {wrist: 6}}, {f: 24, armL: {wrist: -4}}, {f: 28, expr: {...RESET, ...EXPR.glare}, armL: {wrist: 4}}],
    blinks: [],
  },
  { // D, 2921-2996: he has turned his back; the fist goes up at the castle and shakes
    len: 76, set: 'road', fov: 28, roll: 0.5, camA: {pos: [0.42, 0.6, 3.1], look: [0.42, 0.61, 0]}, camB: {pos: [0.42, 0.6, 2.98], look: [0.42, 0.62, 0]}, pos: [0, 0, 0], res: 1.6,
    base: {...BOY, view: 'back'},
    keys: [{f: 14, x: -8, feet: 'step'}, {f: 18, inb: 1, armR: {sh: 24, el: 62, hand: 'fist', show: true}, kick: 0.3}, {f: 20, x: 47, kick: 0.15}, {f: 22, inb: 1, armR: {el: 118}}, {f: 24, x: 36, feet: 'stand'}, {f: 30, armR: {el: 111}}, {f: 34, armR: {el: 120}}, {f: 40, armR: {el: 112}}, {f: 46, armR: {el: 120}}, {f: 54, armR: {el: 113}}, {f: 60, armR: {el: 120}}],
    blinks: [],
  },
];
export const GRAVE_FRAMES = SHOTS.reduce((n, s) => n + s.len, 0);

const GraveSeq: React.FC = () => {
  const frame = useCurrentFrame(), {width, height} = useVideoConfig();
  let f = frame, i = 0; while (i < SHOTS.length - 1 && f >= SHOTS[i].len) { f -= SHOTS[i].len; i++; }
  const s = SHOTS[i], spec = blink(act(s.base, s.keys, f), f, s.blinks, s.blinkKind), t = s.len > 1 ? f / (s.len - 1) : 0;
  const cam = <Cam a={s.camA} b={s.camB} t={t} fov={s.fov} roll={s.roll} />, set = s.set === 'road' ? <Road f={frame} /> : <Grave f={frame} />;
  // v3 B14: in a close shot the set is softer than the figure. Two canvases with the same camera: the set, blurred, and the figure on top.
  if (s.soft) return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{filter: 'blur(0.9px)', transform: 'scale(1.012)'}}>
        <ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv />{cam}{set}</ThreeCanvas>
      </AbsoluteFill>
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} flat gl={{antialias: true, alpha: true}}>{cam}<Puppet3 key={i} spec={spec} height={H} pos={s.pos} res={s.res} /></ThreeCanvas>
      </AbsoluteFill>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv />
        {cam}{set}
        <Puppet3 key={i} spec={spec} height={H} pos={s.pos} res={s.res} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
export const GraveTestComps: React.FC = () => <Composition id="grave-seq" component={GraveSeq} width={1280} height={720} fps={24} durationInFrames={GRAVE_FRAMES} />;
