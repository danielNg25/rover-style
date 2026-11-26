import React, {useMemo} from 'react';
import {Box, Cyl, Ball, Speck, Poly, Glow} from '../three/prims';
import {Cam, Lights, lerp3, drift} from '../three/stage';
import {Post} from '../three/Post';
import type {ShotDef} from './types';
import {pixMap, PxPoly, PxCircle, PxRect, FlatCards, rand, V3, Flame, Flare, hash} from './bkit';

// Measured on ref frames 98 / 141: the cloak grows x1.145, the back wall only x1.087 -> a straight dolly-in
// (wall ~1.6x farther than the cloak). Everything stays centred, no pan.
const FOV = 40, CAM0: V3 = [0, 1.52, 5.27], CAM1: V3 = [0, 1.52, 4.6];
const M = pixMap(CAM0, FOV);
const WZ = -3.06; // back wall plane
const GOLD = '#e6be44', NAVY = '#2b2f5a';

const Window: React.FC<{x0: number; x1: number; f: number}> = ({x0, x1, f}) => {
  // the reference shows ~10 crisp white diamond stars per window, each twinkling on its own phase
  const stars = useMemo(() => { const r = rand(Math.round(x0) + 3); return Array.from({length: 11}, () => [x0 + 8 + r() * (x1 - x0 - 16), 5 + r() * 315, 3 + r() * 2.5] as const); }, [x0, x1]);
  const cx = (x0 + x1) / 2;
  return (
    <group>
      <PxRect m={M} x0={x0 - 15} y0={-40} x1={x1 + 15} y1={335} z={WZ + 0.01} color={'#d9d4c0'} />
      <PxRect m={M} x0={x0} y0={-40} x1={x1} y1={330} z={WZ + 0.02} color={'#283068'} />
      <PxRect m={M} x0={x0} y0={170} x1={x1} y1={330} z={WZ + 0.021} color={'#2f3a7c'} />
      <PxRect m={M} x0={x0} y0={260} x1={x1} y1={330} z={WZ + 0.022} color={'#34428a'} />
      {stars.map(([x, y, s], i) => { const tw = 0.5 + 0.5 * Math.sin(f * (0.22 + (i % 4) * 0.07) + i * 2.4); const r = s * (0.55 + 0.6 * tw); return <PxPoly key={i} m={M} pts={[[x, y - r], [x + r * 0.7, y], [x, y + r], [x - r * 0.7, y]]} z={WZ + 0.03} color={'#ffffff'} opacity={0.45 + 0.55 * tw} />; })}
      <PxRect m={M} x0={cx - 2.5} y0={-40} x1={cx + 2.5} y1={330} z={WZ + 0.04} color={'#a68246'} />
      {[10, 168].map((y) => <PxRect key={y} m={M} x0={x0} y0={y} x1={x1} y1={y + 5} z={WZ + 0.04} color={'#a68246'} />)}
      <PxRect m={M} x0={x0 - 42} y0={334} x1={x1 + 42} y1={352} z={WZ + 0.05} color={'#cbc5b9'} />
      <PxRect m={M} x0={x0 - 42} y0={350} x1={x1 + 42} y1={355} z={WZ + 0.05} color={'#b9b3a6'} />
    </group>
  );
};

const Banner: React.FC<{x0: number; x1: number; f: number; seed: number}> = ({x0, x1, f, seed}) => {
  const cx = (x0 + x1) / 2;
  // slow sway about the top edge, plus a few gold motes catching the light in front of it
  const piv = M.pt(cx, -20, WZ), a = (Math.sin(f * 0.09 + seed) * 0.6 + Math.sin(f * 0.21 + seed * 2) * 0.25) * (Math.PI / 180);
  return (
    <group>
      {Array.from({length: 5}, (_, i) => { const x = x0 + 15 + hash(i, seed) * (x1 - x0 - 30), y = 30 + hash(i + 9, seed) * 150 - f * 0.4 * (0.5 + hash(i, 3)); return <PxCircle key={i} m={M} c={[x + Math.sin(f * 0.1 + i) * 4, y]} r={1.8} z={WZ + 0.06} color={'#f2d66b'} opacity={0.5 + 0.4 * Math.sin(f * 0.35 + i * 2)} />; })}
      <group position={piv} rotation={[0, 0, a]}><group position={[-piv[0], -piv[1], -piv[2]]}>
      <PxCircle m={M} c={[cx + 8, 205]} r={38} sy={2.1} z={WZ + 0.005} color={'#e4dfc9'} />
      <PxPoly m={M} pts={[[x0, -20], [x1, -20], [x1, 145], [cx, 212], [x0, 145]]} z={WZ + 0.02} color={GOLD} />
      <PxPoly m={M} pts={[[x0, -20], [x1, -20], [x1, 135], [cx, 197], [x0, 135]]} z={WZ + 0.03} color={'#317c39'} />
      <PxPoly m={M} pts={[[x0, -20], [x0 + 10, -20], [x0 + 10, 140], [x0, 135]]} z={WZ + 0.035} color={'#2b6e33'} />
      </group></group>
    </group>
  );
};

/** The navy arched window with the gold sun ring behind the cloak. */
const SunWindow: React.FC<{f: number}> = ({f}) => {
  const arch = (x0: number, x1: number, cy: number, yb: number) => {
    const cx = (x0 + x1) / 2, r = (x1 - x0) / 2, pts: [number, number][] = [[x0, yb]];
    for (let i = 0; i <= 24; i++) { const a = Math.PI - (i / 24) * Math.PI; pts.push([cx + Math.cos(a) * r, cy - Math.sin(a) * r]); }
    pts.push([x1, yb]); return pts;
  };
  const C: [number, number] = [637, 210];
  const ring = (r1: number, r2: number, color: string, z: number) => {
    const p = M.pt(C[0], C[1], z), k = M.ppu(z);
    return <mesh position={p}><ringGeometry args={[r1 / k, r2 / k, 72]} /><meshBasicMaterial color={color} fog={false} /></mesh>;
  };
  const spikes = useMemo(() => Array.from({length: 22}, (_, i) => { const a = (i / 22) * Math.PI * 2 + 0.07; return {a, long: i % 2 === 0}; }), []);
  return (
    <group>
      <PxPoly m={M} pts={arch(447, 828, 60, 462)} z={WZ + 0.01} color={GOLD} />
      <PxPoly m={M} pts={arch(462, 813, 60, 462)} z={WZ + 0.02} color={NAVY} />
      <PxCircle m={M} c={C} r={190} z={WZ + 0.025} color={'#3a3a66'} />
      {Array.from({length: 18}, (_, i) => { const r = rand(91); const pts = Array.from({length: 18}, () => [480 + r() * 320, r() * 440] as const); const [x, y] = pts[i]; return <PxCircle key={i} m={M} c={[x, y]} r={1.6 + (i % 3)} z={WZ + 0.03} color={'#e8d79a'} opacity={0.5 + 0.4 * Math.sin(f * 0.3 + i)} />; })}
      {spikes.map(({a, long}, i) => {
        const r0 = 168, r1 = long ? 250 : 215, w = long ? 10 : 7;
        const ca = Math.cos(a), sa = Math.sin(a);
        return <PxPoly key={i} m={M} pts={[[C[0] + ca * r0 - sa * w, C[1] + sa * r0 + ca * w], [C[0] + ca * r1, C[1] + sa * r1], [C[0] + ca * r0 + sa * w, C[1] + sa * r0 - ca * w]]} z={WZ + 0.04} color={long ? '#ecc95a' : '#f0d77c'} />;
      })}
      {ring(140, 158, '#ecc95a', WZ + 0.05)}
      {ring(121, 127, '#e8c656', WZ + 0.05)}
      {/* glints travelling over the gold ring */}
      {([[-2.4, 6], [-0.6, 20], [-1.5, 33], [-3.0, 40]] as const).map(([ang, k], i) => { const o = Math.max(0, 1 - Math.abs(f - k) / 4); const p = M.pt(C[0] + Math.cos(ang) * 149, C[1] + Math.sin(ang) * 149, WZ + 0.06); return <Flare key={i} pos={p} s={0.13 * (0.4 + o)} color={'#fff6d6'} opacity={o} />; })}
    </group>
  );
};

/** Bowl on a cream stem with an orange fire (sits a little in front of the wall). */
const Brazier: React.FC<{x: number; z: number; f: number; seed: number}> = ({x, z, f, seed}) => {
  const top = 1.12;
  return (
    <group>
      <Cyl r={0.26} r2={0.2} h={0.08} pos={[x, 0.04, z]} color={'#e6e0c8'} cast={false} unlit />
      <Cyl r={0.06} h={top} pos={[x, top / 2, z]} color={'#ebe5cf'} cast={false} unlit />
      <Cyl r={0.085} h={0.08} pos={[x, 0.36, z]} color={'#eacf4e'} cast={false} unlit />
      <Cyl r={0.085} h={0.08} pos={[x, 0.76, z]} color={'#eacf4e'} cast={false} unlit />
      <Cyl r={0.12} r2={0.48} h={0.3} pos={[x, top - 0.15, z]} color={'#f5eed1'} seg={28} cast={false} unlit />
      <Cyl r={0.5} h={0.06} pos={[x, top, z]} color={'#f4cd4e'} seg={28} cast={false} unlit />
      <Flame pos={[x, top + 0.04, z + 0.1]} w={0.36} h={0.92} f={f} seed={seed} colors={['#f2641e', '#f9a531', '#fde49a']} coal={'#4a3d3a'} ember={'#ffa83a'} spark={'#ff9a3a'} />
      <Glow pos={[x, top + 0.3, WZ + 0.3]} r={0.95} color={'#fff2c8'} strength={0.3 + 0.07 * Math.sin(f * 0.7 + seed) + 0.04 * Math.sin(f * 1.9 + seed * 2)} />
    </group>
  );
};

/** The empty hooded cloak on its little gold stand: hood picture + cut-paper cape, laid out in ref pixels at z = 0. */
const Cloak: React.FC<{f: number}> = ({f}) => {
  const z = 0, sway = drift(f, 3) * 1.5; // hem sways a couple of pixels
  const hem = (x0: number, x1: number, y: number, n: number, d: number): [number, number][] => Array.from({length: n + 1}, (_, i) => [x1 - ((x1 - x0) * i) / n + (i % 2 ? sway : 0), y + (i % 2 ? d : 0)] as [number, number]);
  const P = (pts: [number, number][], dz: number, color: string) => <PxPoly m={M} pts={pts} z={z + dz} color={color} />;
  return (
    <group>
      {/* gold stand */}
      {P([[548, 590], [728, 590], [716, 572], [560, 572]], -0.02, '#a78d36')}
      {P([[588, 592], [690, 592], [688, 572], [590, 572]], -0.015, '#c9ab45')}
      {/* cape: outer green, dark inside, hem points */}
      {P([[566, 276], [712, 276], [745, 400], [782, 572], ...hem(495, 782, 572, 8, 10), [495, 572], [532, 400]], 0, '#2c6d37')}
      {P([[566, 276], [600, 290], [570, 400], [540, 560], [500, 572], [532, 400]], 0.004, '#337a3c')}
      {P([[602, 292], [676, 292], [700, 566], ...hem(580, 700, 566, 4, -6), [580, 566]], 0.008, '#132414')}
      {[[555, 330, 520, 540], [585, 330, 560, 560], [708, 330, 745, 545], [688, 330, 720, 555]].map(([xa, ya, xb, yb], i) => P([[xa, ya], [xa + 3, ya], [xb + 3, yb], [xb, yb]], 0.012, '#1f5229'))}
      {/* gold front trim + clasps */}
      {P([[634, 290], [640, 290], [640, 562], [634, 562]], 0.02, '#c9ab45')}
      <PxCircle m={M} c={[611, 285]} r={10} z={z + 0.03} color={'#dcbe4e'} />
      <PxCircle m={M} c={[663, 285]} r={10} z={z + 0.03} color={'#dcbe4e'} />
      <PxCircle m={M} c={[611, 285]} r={5} z={z + 0.035} color={'#c9a43a'} />
      <PxCircle m={M} c={[663, 285]} r={5} z={z + 0.035} color={'#c9a43a'} />
      {P([[617, 288], [637, 296], [657, 288], [657, 292], [637, 300], [617, 292]], 0.025, '#c9ab45')}
      {/* hood picture (green rim, dark opening) */}
      <FlatCards parts={[{src: 'doom/hood.png', x: 538, y: 98, w: 190, h: 186, z: 0.006}]} scale={1 / M.ppu(z)} origin={[640, 360]} pos={[0, CAM0[1], z]} />
    </group>
  );
};

const Room: React.FC<{f: number}> = ({f}) => {
  const dust = useMemo(() => { const r = rand(17); return Array.from({length: 32}, () => [(r() - 0.5) * 7, 0.3 + r() * 3.2, -2.5 + r() * 3.5, 0.012 + r() * 0.018] as const); }, []);
  return (
    <group>
      {/* wall, wainscot, gold rail */}
      <PxRect m={M} x0={-300} y0={-300} x1={1600} y1={545} z={WZ} color={'#ece7d3'} />
      <PxRect m={M} x0={-300} y0={462} x1={1600} y1={545} z={WZ + 0.01} color={'#cfccb6'} />
      <PxRect m={M} x0={-300} y0={459} x1={1600} y1={466} z={WZ + 0.02} color={'#c4a238'} />
      <Window x0={43} x1={140} f={f} />
      <Window x0={1133} x1={1228} f={f} />
      <Banner x0={243} x1={360} f={f} seed={0} />
      <Banner x0={918} x1={1035} f={f} seed={2.1} />
      <SunWindow f={f} />
      {/* floor with big tiles */}
      <Box size={[30, 0.2, 20]} pos={[0, -0.1, 6.9]} color={'#c4bdb3'} unlit cast={false} />
      {[-0.9, 1.6, 4.2].map((zz) => <Box key={zz} size={[30, 0.004, 0.02]} pos={[0, 0.002, zz]} color={'#b2aba1'} unlit cast={false} />)}
      {[-5.4, -2.9, 2.9, 5.4].map((xx) => <Box key={xx} size={[0.02, 0.004, 20]} pos={[xx, 0.002, 6.9]} color={'#b2aba1'} unlit cast={false} />)}
      {/* dais with gold edge, green runner in front, book */}
      <Box size={[2.1, 0.31, 1.7]} pos={[0, 0.155, -0.25]} color={'#ddd7cb'} />
      <Box size={[2.12, 0.035, 0.03]} pos={[0, 0.29, 0.6]} color={'#b3952f'} cast={false} />
      <Box size={[1.85, 0.01, 6]} pos={[0, 0.005, 3.6]} color={'#3b7744'} unlit cast={false} />
      {[-1, 1].map((k) => <Box key={k} size={[0.06, 0.012, 6]} pos={[k * 0.95, 0.006, 3.6]} color={'#c9a43a'} unlit cast={false} />)}
      <group position={[0.78, 0.31, 0.3]} rotation={[0, -0.04, 0]}>
        <Box size={[0.66, 0.035, 0.42]} pos={[0, 0.0175, 0]} color={'#d4b246'} />
        <Box size={[0.58, 0.08, 0.36]} pos={[0, 0.075, -0.01]} color={'#c8ad82'} />
        <Box size={[0.62, 0.035, 0.4]} pos={[0, 0.13, 0]} color={'#7a2a3b'} />
        <Box size={[0.62, 0.11, 0.025]} pos={[-0.0, 0.08, 0.19]} color={'#722839'} cast={false} />
      </group>
      <Brazier x={-2.1} z={-1.5} f={f} seed={0} />
      <Brazier x={2.07} z={-1.5} f={f} seed={1.7} />
      {dust.map(([x, y, z, s], i) => <Speck key={i} pos={[x + Math.sin(f * 0.05 + i) * 0.06, y + ((f * 0.005 * (1 + (i % 3))) % 0.8), z]} s={s} color={i % 2 ? '#ffd27a' : '#fff6d8'} opacity={0.55 + 0.4 * Math.sin(f * 0.25 + i * 1.3)} />)}
    </group>
  );
};

const Scene: React.FC<{f: number; t: number}> = ({f, t}) => {
  const c = lerp3(CAM0, CAM1, t);
  return (
    <>
      <Cam pos={[c[0] + drift(f, 2) * 0.004, c[1] + drift(f, 5) * 0.004, c[2]]} look={[c[0], c[1], -30]} fov={FOV} />
      <Lights />
      <Post focus={[0, 1.4, 0]} blur={0.25} />
      <Room f={f} />
      <Cloak f={f} />
    </>
  );
};

export const ALCOVE: ShotDef = {id: 'alcove', len: 44, bg: '#ece7d3', Scene};
