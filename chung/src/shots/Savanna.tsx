import React from 'react';
import type {ShotDef} from './types';
import {Cam, V3, lerp3, lerp, track} from '../three/stage';
const TAU = Math.PI * 2;
import {Post} from '../three/Post';
import {Box, Poly, Speck} from '../three/prims';
import {Card} from './sprite';
import {Elephant, Giraffe, Impala, Dust} from './savannaAnimals';

type P2 = [number, number];
const ell = (rx: number, ry: number, n = 28, cx = 0, cy = 0): P2[] => Array.from({length: n}, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry]);
/** stadium (rounded slab) used for flat acacia canopies */
const slab = (w: number, h: number, cx = 0, cy = 0): P2[] => {
  const r = h / 2, pts: P2[] = [];
  for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI; pts.push([cx + w / 2 - r + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + (i / 10) * Math.PI; pts.push([cx - w / 2 + r + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
};
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------- savanna
const TINT = '#bdb6b0';
const SAND = '#d6b26a', SAND_FAR = '#e2c88c', TRUNK = '#5a3826', LEAF = '#6f9c45', LEAF2 = '#557f35', LEAF3 = '#89b25a';

/** Flat acacia: forked trunk + layered flat-topped canopy, all in a card at depth z. s = scale (1 = 6 units tall). */
const Acacia: React.FC<{pos: V3; s: number; dead?: boolean; flip?: boolean}> = ({pos, s, dead, flip}) => {
  const k = flip ? -1 : 1;
  const tr = dead ? '#7b6a5c' : TRUNK;
  return (
    <group position={pos} scale={[s * k, s, 1]}>
      <Poly pts={[[-0.22, 0], [0.22, 0], [0.12, 2.6], [1.9, 4.2], [1.75, 4.4], [0.0, 3.0], [-1.6, 4.5], [-1.8, 4.3], [-0.12, 2.6]]} color={tr} fog={false} />
      <Poly pts={[[0.05, 2.9], [0.15, 2.9], [0.2, 5.0], [0.05, 5.0]]} color={tr} pos={[0, 0, -0.001]} fog={false} />
      {dead ? <Poly pts={[[1.8, 4.3], [1.9, 4.3], [2.4, 5.4], [2.3, 5.45]]} color={tr} fog={false} /> : (
        <>
          <Poly pts={slab(4.3, 0.55, -1.0, 4.65)} color={LEAF2} pos={[0, 0, 0.002]} fog={false} />
          <Poly pts={slab(3.6, 0.55, 1.6, 4.55)} color={LEAF2} pos={[0, 0, 0.002]} fog={false} />
          <Poly pts={slab(3.4, 0.5, -1.1, 4.95)} color={LEAF} pos={[0, 0, 0.003]} fog={false} />
          <Poly pts={slab(3.2, 0.5, 1.5, 4.85)} color={LEAF} pos={[0, 0, 0.003]} fog={false} />
          <Poly pts={slab(3.6, 0.5, 0.2, 5.35)} color={LEAF} pos={[0, 0, 0.004]} fog={false} />
          <Poly pts={slab(2.6, 0.18, 0.2, 5.55)} color={LEAF3} pos={[0, 0, 0.005]} fog={false} />
          <Poly pts={slab(2.4, 0.16, -1.1, 5.15)} color={LEAF3} pos={[0, 0, 0.005]} fog={false} />
          {[-2.6, -2.2, -1.6, 0.9, 2.6].map((x, i) => <group key={i} position={[x, 4.4 - (i % 2) * 0.25, 0.006]}><Poly pts={[[-0.01, 0], [0.01, 0], [0.01, -0.35], [-0.01, -0.35]]} color={'#6a4a30'} fog={false} /><Poly pts={[[-0.1, -0.35], [0.1, -0.35], [0.12, -0.55], [0, -0.62], [-0.12, -0.55]]} color={'#b0874e'} fog={false} /></group>)}
        </>
      )}
    </group>
  );
};

const Tuft: React.FC<{pos: V3; s: number; green?: boolean}> = ({pos, s, green}) => {
  const c = green ? '#6fa04a' : '#b0903f', c2 = green ? '#5a8a3a' : '#9c7d34';
  const blades: P2[][] = [-3, -2, -1, 0, 1, 2, 3].map((i) => [[i * 0.07 - 0.04, 0], [i * 0.07 + 0.04, 0], [i * 0.16, 0.5 + 0.18 * Math.cos(i * 0.6)]]);
  return <group position={pos} scale={s}>{blades.map((b, i) => <Poly key={i} pts={b} color={i % 2 ? c : c2} pos={[0, 0, i * 0.001]} fog={false} />)}</group>;
};

const SKY_BANDS = ['#b9c9c9', '#c6d0c5', '#d6d8c0', '#e1dbba', '#eadfb3', '#f0e2b0'];

/** Parallax measured on the reference (full shot, 21 frames): the sky drifts right 40 px, mountain / far trees / acacias
 *  right 13-27 px, while the ground slides LEFT (waterhole -93 px). Returns the world x offset of a layer at depth z. */
const SCREEN_SHIFT = (z: number) => (z <= -40 ? 40 : z <= -6 ? 18 : lerp(15, -93, (z + 6) / 10.9));
const par = (z: number, f: number) => (SCREEN_SHIFT(z) * (f / 21)) / (1343 / (20 - z));

const Savanna: React.FC<{f: number}> = ({f}) => {
  const P = (z: number) => par(z, f);
  const items: React.ReactNode[] = [];
  // impala herd: ~30 animals, most walking right, each on its own pose cycle
  for (let i = 0; i < 30; i++) {
    const z = -2.5 - rnd(i) * 10, left = rnd(i + 9) < 0.2;
    const x = -12 + ((i * 0.618) % 1) * 30 + (left ? -1 : 1) * f * 0.03;
    items.push(<Impala key={`i${i}`} pos={[x + P(z), 0, z]} h={1.15 + rnd(i + 11) * 0.2} f={f} seed={i} left={left} />);
  }
  // grass tufts, swaying around their base
  for (let i = 0; i < 46; i++) {
    const z = -3 + rnd(i + 70) * 9, x = -10 + rnd(i + 90) * 20;
    items.push(<group key={`t${i}`} position={[x + P(z), 0, z]} rotation={[0, 0, 0.05 * Math.sin(f * 0.18 + i * 1.3)]}><Tuft pos={[0, 0, 0]} s={0.5 + rnd(i + 5) * 0.5} green={rnd(i + 3) < 0.35} /></group>);
  }
  // elephants: body advances at the speed read off the reference (relative to the ground under it)
  const EP = 28;
  const ex = (x0: number, z: number) => x0 + 0.055 * f + P(z);
  const dust: React.ReactNode[] = [];
  [[-1.68, 0, 3.75, 0], [-7.6, 0.2, 2.75, 1.7], [-6.0, 1.5, 1.8, 3.1]].forEach(([x0, z, h, sd], j) => {
    // a puff each time a near foot touches down (twice per cycle), drifting behind the animal
    for (let k = -1; k < 3; k++) {
      const tf = ((k * EP) / 2) - (sd / TAU) * EP + (j * 5) % 7;
      const age = f - tf;
      if (age >= 0 && age <= 10) dust.push(<Dust key={`d${j}${k}`} pos={[ex(x0, z) + (k % 2 ? 0.9 : -0.9) * h / 3.75, 0, z + 0.1]} age={age} s={0.3 * h / 3.75} />);
    }
  });
  const peck = (i: number) => { const c = (f + i * 9) % 18; return c < 5 ? Math.sin((c / 5) * Math.PI) * 14 : 0; };
  return (
    <group>
      {/* sky: soft horizontal bands, faint streak clouds; the whole sky layer drifts right */}
      <group position={[P(-80), 0, 0]}>
        {SKY_BANDS.map((c, i) => <Box key={i} size={[260, 8, 0.1]} pos={[0, 31 - i * 6, -82 + i * 0.01]} color={c} unlit cast={false} receive={false} />)}
        {[[-20, 19, 30], [12, 31, 26], [30, 14, 18], [-36, 26, 22]].map(([x, y, w], i) => <Poly key={i} pts={slab(w, 0.9)} color={'#e6e4cc'} pos={[x + f * 0.02, y, -81]} fog={false} opacity={0.55} />)}
        {/* sun: halo breathes slowly */}
        <group position={[-23.7, 22.5, -80.5]} scale={1 + 0.03 * Math.sin(f * 0.2)}>
          <Poly pts={ell(11, 11, 48)} color={'#efe6bd'} fog={false} />
        </group>
        <Poly pts={ell(7, 7, 48)} color={'#f8efc6'} pos={[-23.7, 22.5, -80.4]} fog={false} />
        <Poly pts={ell(4.6, 4.6, 48)} color={'#fdf6d6'} pos={[-23.7, 22.5, -80.3]} fog={false} />
        <Poly pts={[...slab(10, 2.2, 0, 0), ...ell(2.4, 2.1, 20, -1, 1)]} color={'#f1e2b8'} pos={[13 + f * 0.04, 20.8, -80]} fog={false} />
        <Poly pts={[...slab(8, 1.8, 0, 0), ...ell(2.0, 1.7, 20, 0, 0.9)]} color={'#f1e2b8'} pos={[42 + f * 0.04, 13.5, -80]} fog={false} />
        {/* birds gliding and flapping */}
        {[[-23, 23.5], [-16, 27.5]].map(([x, y], i) => {
          const flap = Math.sin(f * 0.9 + i * 2);
          return <Poly key={i} pts={[[-1.1, 0.25 * flap], [0, -0.35], [1.1, 0.25 * flap], [0, -0.15]]} color={'#5b5048'} pos={[x + f * 0.12, y + Math.sin(f * 0.15 + i) * 0.3, -79]} fog={false} />;
        })}
      </group>
      {/* far mountain with snow, pale hills and tree line */}
      <group position={[P(-48), 0, -48]} scale={[1.2, 1.25, 1]}>
        <Poly pts={[[-3, 0], [1.2, 6.4], [3.4, 7.4], [7.6, 7.2], [10.5, 5.8], [16, 0]]} color={'#c4bcc0'} fog={false} />
        <Poly pts={[[0.6, 5.4], [1.2, 6.4], [3.4, 7.4], [7.6, 7.2], [10.5, 5.8], [9.6, 5.0], [8.4, 5.9], [7.2, 4.6], [5.8, 5.9], [4.6, 4.4], [3.4, 5.8], [2.2, 4.6]].map(([x, y]) => [x, y + (y < 6 ? 0.9 : 0)] as P2)} color={'#eeeae8'} pos={[0, 0, 0.01]} fog={false} />
        <Poly pts={[[-60, 0], [-40, 3.8], [-22, 2.6], [-8, 4.2], [10, 2.4], [30, 3.6], [60, 1.2], [60, 0]]} color={'#dccaa0'} pos={[0, 0, 0.5]} fog={false} />
      </group>
      <group position={[P(-36), 0, 0]}>
        {Array.from({length: 22}, (_, i) => <Acacia key={`far${i}`} pos={[-50 + i * 4.9 + rnd(i) * 2, 0, -36]} s={0.38 + rnd(i + 3) * 0.12} />)}
        {/* far herd specks on the plain */}
        {Array.from({length: 26}, (_, i) => <Poly key={`h${i}`} pts={slab(0.9, 0.35)} color={'#9a8a78'} pos={[-30 + rnd(i + 500) * 60 + f * 0.01, 0.2, -33]} fog={false} />)}
      </group>
      {/* ground */}
      <Box size={[200, 0.2, 60]} pos={[0, -0.1, -15]} color={SAND} />
      <Box size={[200, 0.02, 14]} pos={[0, 0.0, -38]} color={SAND_FAR} cast={false} />
      {/* trees: canopies sway a hair */}
      {[[-12.6, -12, 0.7, 0, 0], [-5.9, -6.5, 1.05, 0, 0], [2.3, -10.9, 0.95, 1, 0], [9.9, -10.9, 0.85, 0, 1], [12.5, -16, 0.6, 0, 0]].map(([x, z, sc, dead, flip], i) => (
        <group key={`tr${i}`} position={[P(z), 0, 0]} rotation={[0, 0, 0.004 * Math.sin(f * 0.1 + i)]}><Acacia pos={[x, 0, z]} s={sc} dead={!!dead} flip={!!flip} /></group>
      ))}
      {/* termite mounds */}
      {[[2.9, -7, 0.9], [11.6, -10, 0.6]].map(([x, z, h], i) => <Poly key={i} pts={[[-0.7 * h, 0], [-0.25 * h, 1.4 * h], [0, 1.8 * h], [0.2 * h, 1.3 * h], [0.7 * h, 0]]} color={'#a24f2c'} pos={[x + P(z), 0, z]} fog={false} />)}
      {/* vultures on the dead tree: little head turns */}
      <Card src="savanna/s-6.png" height={0.75} pos={[4.4 + P(-10.8), 5.05, -10.8]} rot={track(f, [[0, 0], [6, 4], [13, -3], [18, 1]], 3)} />
      {items}
      {dust}
      {/* giraffes walking left */}
      <Giraffe pos={[5.4 - 0.032 * f + P(-3.1), 0, -3.1]} h={4.15} f={f} />
      <Giraffe pos={[12.7 - 0.02 * f + P(-13.6), 0, -13.6]} h={3.4} f={f} seed={2} />
      {/* elephants walking right */}
      <Elephant pos={[ex(-7.6, 0.2), 0, 0.2]} h={2.75} f={f} period={EP} seed={1.7} />
      <Elephant pos={[ex(-6.0, 1.5), 0, 1.5]} h={1.8} f={f} period={EP * 0.8} seed={3.1} />
      <Elephant pos={[ex(-1.68, 0), 0, 0]} h={3.75} f={f} period={EP} seed={0}>
        {/* egret riding on the back (bobs with the body), vulture on the head */}
        <group scale={[1, -1, 1]}>
          <Card src="savanna/s-5.png" height={0.75 / (3.75 / 426)} pos={[150, -42, 0.05]} flip rot={peck(3) * 0.4} />
          <Card src="savanna/s-6.png" height={0.6 / (3.75 / 426)} pos={[395, -16, 0.05]} rot={track(f, [[0, 0], [8, -5], [15, 3]], 3)} />
        </group>
      </Elephant>
      {/* waterhole: rim, water, glints */}
      <group position={[3.9 + P(4.9), 0.02, 4.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <Poly pts={ell(3.6, 2.4, 40)} color={'#b08b52'} fog={false} />
        <Poly pts={ell(3.3, 2.05, 40)} color={'#8fc0d6'} pos={[0, 0, 0.005]} fog={false} />
        <Poly pts={slab(3.4, 0.08, -0.2 + Math.sin(f * 0.2) * 0.2, 0.3)} color={'#c5e2ee'} pos={[0, 0, 0.01]} fog={false} />
        <Poly pts={slab(1.6, 0.06, 1.2 - Math.sin(f * 0.2) * 0.2, -0.6)} color={'#c5e2ee'} pos={[0, 0, 0.01]} fog={false} />
      </group>
      {/* egrets at the water: peck and shift */}
      <Card src="savanna/s-5.png" height={1.25} pos={[1.6 + P(4), 0, 4]} flip rot={peck(0)} />
      <Card src="savanna/s-5.png" height={1.15} pos={[5.3 + P(4.4), 0, 4.4]} rot={-peck(5)} />
      {/* rocks */}
      {[[-8.5, 3, 1.2], [-2.6, 5, 0.5], [0.8, 2, 0.4]].map(([x, z, s], i) => <Poly key={i} pts={[[-s, 0], [-s * 0.4, s * 0.9], [s * 0.5, s * 0.7], [s, 0]]} color={'#7a6656'} pos={[x + P(z), 0, z]} fog={false} />)}
      {/* drifting warm dust in the air */}
      {Array.from({length: 30}, (_, i) => <Speck key={`sp${i}`} pos={[-9 + rnd(i + 200) * 18 + f * 0.02 + P(6), 0.4 + rnd(i + 300) * 6 + Math.sin(f * 0.07 + i) * 0.15, 6]} s={0.035 + rnd(i) * 0.03} color={'#fff8e0'} opacity={0.35 + 0.3 * Math.sin(f * 0.3 + i)} />)}
    </group>
  );
};

// ---------------------------------------------------------------- ocean (the shot cuts here at f22)
const SEA = ['#6f9ec2', '#5089b8', '#437eaf', '#3b74a6', '#356b9c', '#306392', '#2b5b88', '#27547f'];
const WaveRow: React.FC<{z: number; i: number; f: number; n: number}> = ({z, i, f, n}) => {
  const d = 20 - z, sc = d / 20; // sizes follow distance so every row reads about the same on screen
  const w = d * 1.3, steps = 120, amp = 0.42 * sc, ph = f * 0.14 + i * 1.7;
  const pts: P2[] = [[-w / 2, -8 * sc]];
  for (let k = 0; k <= steps; k++) { const x = -w / 2 + (k / steps) * w; pts.push([x, amp * Math.abs(Math.sin(x / (1.4 * sc) + ph))]); }
  pts.push([w / 2, -8 * sc]);
  const col = SEA[Math.min(SEA.length - 1, Math.floor((i * SEA.length) / n))];
  const caps: React.ReactNode[] = [];
  const nc = 34;
  for (let k = 0; k < nc; k++) {
    if (rnd(k + i * 31) < 0.42) continue;
    const x = -w / 2 + ((k + 0.5) / nc) * w + (rnd(k * 3 + i) - 0.5) * w / nc;
    // each cap swells and vanishes on its own phase
    const life = Math.sin(f * 0.22 + rnd(k * 5 + i) * 6.3);
    if (life < -0.3) continue;
    const c = (0.32 + rnd(k + i * 7) * 0.3) * sc * Math.min(1, (life + 0.3) / 0.6);
    caps.push(<Poly key={k} pts={[[-1.0 * c, 0], [0, 0.42 * c], [1.0 * c, 0], [0, 0.15 * c]]} color={'#f3f8fb'} pos={[x, amp * 0.55, 0.01]} fog={false} />);
  }
  // nearer rows roll sideways faster than far ones
  const slide = f * 0.012 * (1 + i * 0.12) * sc * (i % 2 ? 1 : -0.6);
  return (
    <group position={[slide, Math.sin(f * 0.18 + i) * 0.05 * sc, z]}>
      <Poly pts={pts} color={'#79abd0'} fog={false} />
      <Poly pts={pts.map(([x, y]) => [x, y - 0.07 * sc] as P2)} color={col} pos={[0, 0, 0.004]} fog={false} />
      {caps}
    </group>
  );
};

// a crisp flat dolphin drawn in code (straight streamlined body, facing +x, length 2 units before scaling)
const D_BODY: P2[] = [[1.0, 0.0], [0.86, 0.06], [0.62, 0.13], [0.3, 0.16], [0.0, 0.15], [-0.35, 0.11], [-0.7, 0.05], [-0.88, 0.025], [-0.88, -0.025], [-0.7, -0.04], [-0.35, -0.08], [0.0, -0.12], [0.3, -0.12], [0.62, -0.08], [0.86, -0.03]];
const D_BELLY: P2[] = [[0.92, -0.02], [0.62, -0.07], [0.3, -0.105], [0.0, -0.105], [-0.35, -0.065], [-0.62, -0.03], [-0.3, -0.03], [0.2, -0.03], [0.6, -0.015]];
const D_FIN: P2[] = [[0.08, 0.14], [-0.1, 0.36], [-0.2, 0.36], [-0.18, 0.12]];
const D_FLIP: P2[] = [[0.46, -0.08], [0.3, -0.28], [0.22, -0.27], [0.3, -0.07]];
const D_FLUKE: P2[] = [[-0.84, 0], [-1.08, 0.19], [-1.0, 0.0], [-1.08, -0.19]];
const DolphinShape: React.FC<{L: number}> = ({L}) => (
  <group scale={[L / 2, L / 2 * 1.45, 1]}>
    <Poly pts={D_FIN} color={'#3f5c7c'} fog={false} />
    <Poly pts={D_FLUKE} color={'#3f5c7c'} fog={false} />
    <Poly pts={D_BODY} color={'#4f6f92'} pos={[0, 0, 0.002]} fog={false} />
    <Poly pts={D_BELLY} color={'#eaf1f5'} pos={[0, 0, 0.004]} fog={false} />
    <Poly pts={D_FLIP} color={'#3a5676'} pos={[0, 0, 0.006]} fog={false} />
    <Poly pts={ell(0.022, 0.022, 10, 0.78, 0.035)} color={'#1d2a38'} pos={[0, 0, 0.006]} fog={false} />
  </group>
);

type Leap = {f0: number; dur: number; x0: number; x1: number; y0: number; h: number; z: number; size: number};
const leapAt = (l: Leap, u: number) => [lerp(l.x0, l.x1, u), l.y0 + 4 * l.h * u * (1 - u)] as const;
/** fractions of the arc where the dolphin crosses the water line (y = 0): leaves, then re-enters */
const leapCross = (l: Leap) => { const r = Math.sqrt(Math.max(0, 1 + l.y0 / l.h)); return [(1 - r) / 2, (1 + r) / 2]; };
const Dolphin: React.FC<{f: number; l: Leap}> = ({f, l}) => {
  const u = (f - l.f0) / l.dur;
  if (u < 0 || u > 1) return null;
  const [x, y] = leapAt(l, u);
  const dx = (l.x1 - l.x0) / l.dur, dy = (4 * l.h * (1 - 2 * u)) / l.dur;
  const ang = Math.atan2(dy, dx);
  return <group position={[x, y, l.z]} rotation={[0, 0, ang]}><DolphinShape L={l.size * 1.5} /></group>;
};

/** splash: spiky crown that shoots up and sinks, flying droplets, a foam lump left behind */
const Splash: React.FC<{pos: V3; f: number; f0: number; s: number; dur?: number}> = ({pos, f, f0, s, dur = 14}) => {
  const g = f - f0; if (g < 0 || g > dur) return null;
  const rise = Math.min(1, g / 4), fall = g > dur * 0.5 ? 1 - (g - dur * 0.5) / (dur * 0.5) : 1;
  const hk = rise * fall;
  const spikes: P2[] = [[-1.5, 0]];
  [[-1.2, 0.9], [-0.95, 0.3], [-0.65, 1.7], [-0.35, 0.45], [0.0, 2.3], [0.3, 0.5], [0.6, 1.9], [0.9, 0.35], [1.15, 1.0]].forEach(([x, y], i) => spikes.push([x, i % 2 ? y : y * hk * (1 + 0.08 * Math.sin(g + i))]));
  spikes.push([1.5, 0]);
  return (
    <group position={pos} scale={[s, s, 1]}>
      {hk > 0.05 ? <Poly pts={spikes} color={'#e7f2f8'} fog={false} /> : null}
      {hk > 0.05 ? <Poly pts={spikes.map(([x, y]) => [x * 0.6, y * 0.55] as P2)} color={'#c4dcea'} pos={[0, 0, 0.01]} fog={false} /> : null}
      <Poly pts={[...slab(2.6 + g * 0.06, 0.4, 0, 0.05)]} color={'#e2eef5'} pos={[0, 0, 0.02]} opacity={Math.max(0, 0.95 - g / dur)} fog={false} />
      {Array.from({length: 9}, (_, i) => {
        const vx = (rnd(i + 70) - 0.5) * 0.35, vy = 0.35 + rnd(i + 80) * 0.25, t = g * 0.5;
        const y = vy * t - 0.045 * t * t * 3;
        return y > -0.1 ? <Poly key={i} pts={ell(0.07, 0.07, 10)} color={'#f3f9fc'} pos={[vx * t * 3, 0.4 + y * 3, 0.03]} fog={false} /> : null;
      })}
    </group>
  );
};

const LEAPS: Leap[] = [
  {f0: -8, dur: 22, x0: -6, x1: 2.5, y0: -0.8, h: 3.2, z: 0, size: 2.6},
  {f0: -4, dur: 16, x0: -9.5, x1: -5, y0: -1, h: 2.6, z: 1, size: 2.3},
  {f0: -12, dur: 22, x0: 3.0, x1: 7.6, y0: -1.6, h: 3.8, z: 2, size: 3.0},
  {f0: 4, dur: 16, x0: -1.5, x1: 2.2, y0: -1, h: 2.6, z: -1, size: 2.3},
  {f0: 10, dur: 18, x0: -7, x1: -1, y0: -1.6, h: 3.6, z: 4, size: 2.8},
  {f0: 9, dur: 16, x0: -10, x1: -4, y0: -0.8, h: 2.6, z: -5, size: 2.2},
];
const Ocean: React.FC<{f: number}> = ({f}) => {
  const g = f - 22;
  const rows = Array.from({length: 30}, (_, i) => 20 - 1 / lerp(1 / 90, 1 / 2.6, Math.pow(i / 29, 1.1))); // even steps on screen
  return (
    <group>
      <Box size={[260, 60, 0.1]} pos={[0, 22, -82]} color={'#a9cde2'} unlit cast={false} receive={false} />
      <Box size={[260, 6, 0.1]} pos={[0, 2.5, -81.9]} color={'#cfe3ec'} unlit cast={false} receive={false} />
      {/* sun: rays turn slowly and pulse, halo ring, disc */}
      <group position={[25, 26, -81]} rotation={[0, 0, f * 0.006]}>
        {Array.from({length: 12}, (_, i) => { const a = (i / 12) * Math.PI * 2 + 0.2, L = 16 * (1 + 0.08 * Math.sin(f * 0.25 + i * 1.7)); return <Poly key={i} pts={[[0, -0.5], [L, 0], [0, 0.5]]} color={'#c7e1ef'} rot={[0, 0, a]} fog={false} />; })}
      </group>
      <group position={[25, 26, -80.8]} scale={1 + 0.025 * Math.sin(f * 0.3)}><Poly pts={ell(9.5, 9.5, 48)} color={'#c9e2f0'} fog={false} /></group>
      <Poly pts={ell(7, 7, 48)} color={'#e4f2f8'} pos={[25, 26, -80.7]} fog={false} />
      <Poly pts={ell(5, 5, 48)} color={'#fbfbe8'} pos={[25, 26, -80.6]} fog={false} />
      {/* blocky flat cloud top-left */}
      <Poly pts={[[-46, 26], [-44, 32], [-28, 32], [-26, 26]]} color={'#e8eef2'} pos={[0, 0, -80]} fog={false} />
      <Poly pts={[[-46, 26], [-26, 26], [-26.4, 24.8], [-45.6, 24.8]]} color={'#cfd9e0'} pos={[0, 0, -79.9]} fog={false} />
      {/* gulls */}
      {[[-18, 15], [-12, 17.5], [-22, 7], [-30, 5]].map(([x, y], i) => <Poly key={i} pts={[[-0.6, 0], [0, -0.2], [0.6, 0], [0, -0.08]]} color={'#ffffff'} pos={[x + g * 0.05, y, -78]} fog={false} />)}
      {/* far pale mountains and dark rocks */}
      <Poly pts={[[-60, 0], [-52, 6], [-46, 3], [-40, 7], [-32, 0]]} color={'#b9cbd6'} pos={[0, 0, -60]} fog={false} />
      <Poly pts={[[30, 0], [38, 4], [46, 1.5], [52, 3], [60, 0]]} color={'#bccdd8'} pos={[0, 0, -60]} fog={false} />
      <group position={[-14.5, 0, -32]} scale={[0.8, 0.8, 1]}>
        <Poly pts={[[-3, 0], [-1.8, 3.4], [-0.6, 2.2], [0.6, 3.8], [1.8, 2.0], [3.4, 0]]} color={'#5c6670'} fog={false} />
        <Poly pts={[[-0.6, 2.2], [0.6, 3.8], [0.2, 0], [-0.8, 0]]} color={'#78828c'} pos={[0, 0, 0.01]} fog={false} />
        <Poly pts={[[5, 0], [5.6, 1.3], [6.4, 0]]} color={'#5c6670'} fog={false} />
      </group>
      {/* sailing ship far right */}
      <Card src="savanna/s-8.png" tint={'#f2eee6'} opacity={0.85} height={4.2} pos={[8.5 + g * 0.01, -0.3 + Math.sin(f * 0.35) * 0.08, -34]} rot={2.2 * Math.sin(f * 0.3)} flip shadow={false} />
      {rows.map((z, i) => <WaveRow key={i} z={z} i={i} f={f} n={rows.length} />)}
      {/* horizon mist over the farthest rows */}
      <Poly pts={[[-80, -0.6], [80, -0.6], [80, 1.6], [-80, 1.6]]} color={'#dcebf3'} pos={[0, 0, -50]} opacity={0.55} />
      {/* gold glints on the water: ~70 short dashes, each flashing on its own phase */}
      {Array.from({length: 110}, (_, i) => {
        const d = 4 + rnd(i + 900) * 40, z = 20 - d, tw = Math.sin(f * 0.9 + i * 2.3);
        if (tw < 0.2) return null;
        const sc = d / 20, y = (0.15 + rnd(i + 950) * 0.25) * sc;
        return <Poly key={`gl${i}`} pts={slab(0.4 * sc * tw, 0.06 * sc)} color={'#f4edcc'} pos={[(rnd(i + 990) - 0.35) * d * 0.9 + f * 0.01 * sc, y, z + 0.02]} fog={false} />;
      })}
      {/* leaping dolphins, each with a splash where it leaves the water and where it dives back in */}
      {LEAPS.map((l, i) => {
        const [ua, ub] = leapCross(l);
        const pa = leapAt(l, ua), pb = leapAt(l, ub);
        return (
          <React.Fragment key={i}>
            <Dolphin f={g} l={l} />
            <Splash pos={[pa[0], -0.1, l.z + 0.3]} f={g} f0={l.f0 + ua * l.dur} s={l.size * 0.26} dur={12} />
            <Splash pos={[pb[0], -0.1, l.z + 0.3]} f={g} f0={l.f0 + ub * l.dur - 1} s={l.size * 0.36} dur={16} />
          </React.Fragment>
        );
      })}
    </group>
  );
};

/** sea = true renders the ocean shot; the ocean code counts its frames from 22 (where it sat in the reference range) */
const makeScene = (sea: boolean): React.FC<{f: number; t: number}> => ({f: f0}) => {
  const f = sea ? f0 + 22 : f0;
  const u = sea ? f0 / 18 : f0 / 21;
  const cam = sea
    ? {pos: lerp3([0, 1.5, 20], [0.3, 1.5, 19.5], u), look: [0, 3.15, -10] as V3, fov: 30}
    : {pos: lerp3([0, 2.75, 20], [0, 2.75, 19.85], u), look: [0, 2.75, -10] as V3, fov: 30};
  const look: V3 = [cam.pos[0] + cam.look[0], cam.look[1], cam.look[2]];
  return (
    <>
      <Cam pos={cam.pos} look={look} fov={cam.fov} />
      <hemisphereLight args={['#fffaf0', '#c9b48a', 1.7]} />
      <directionalLight position={[-10, 18, 10]} intensity={1.6} color={'#fff1d6'} castShadow
        shadow-mapSize={[2048, 2048]} shadow-radius={8} shadow-bias={-0.0006} shadow-normalBias={0.03}
        shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={14} shadow-camera-bottom={-8} shadow-camera-near={1} shadow-camera-far={70} />
      <Post focus={sea ? [0, 1, -6] : [0, 1.5, 0]} blur={0.12} />
      {sea ? <Ocean f={f} /> : <Savanna f={f} />}
    </>
  );
};

export const SAVANNA: ShotDef = {id: 'savanna', len: 22, bg: '#d9d9bf', Scene: makeScene(false)};
export const OCEAN: ShotDef = {id: 'ocean', len: 19, bg: '#a9cde2', Scene: makeScene(true)};
