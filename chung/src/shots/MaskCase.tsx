import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Cyl, Ball, Speck, Poly} from '../three/prims';
import {Cam, Lights, lerp3, drift} from '../three/stage';
import {Post} from '../three/Post';
import type {ShotDef} from './types';
import {pixMap, PxPoly, PxCircle, PxRect, FlatCards, FlatPart, rand, V3, Flame, Flare} from './bkit';

// Measured on ref frames 76 / 97: case outer width 464 -> 435 px (the camera pulls back ~6 %), centred, no pan.
// Camera is close with a wide lens (front posts at x 424, back posts at x 485 => strong perspective).
const FOV = 50, CAM0: V3 = [0, 2.4, 3.8], CAM1: V3 = [0, 2.4, 4.03];
const M = pixMap(CAM0, FOV);
const GOLD = '#e8c45e', GOLD2 = '#c9a24a', GOLDL = '#f2d677', CREAM = '#f6f1e2', CREAM2 = '#e6e0cf';

/** Far view through the window, laid out in reference pixels (frame 0). */
const Backdrop: React.FC<{f: number}> = ({f}) => {
  const stars = useMemo(() => { const r = rand(7); return Array.from({length: 110}, () => [r() * 1280, r() * 80, 0.8 + r() * r() * 2.6] as const); }, []);
  const tower = (cx: number, w: number, top: number, body: string, z: number, roof = '#8597ad', key = 0) => {
    const roofH = w * 1.7, ledge = top + roofH;
    return (
      <group key={key}>
        <PxRect m={M} x0={cx - w / 2} y0={ledge} x1={cx + w / 2} y1={440} z={z} color={body} />
        <PxRect m={M} x0={cx - w * 0.62} y0={ledge - 4} x1={cx + w * 0.62} y1={ledge + 10} z={z + 0.01} color={body} />
        <PxRect m={M} x0={cx - w * 0.6} y0={ledge + 95} x1={cx + w * 0.6} y1={ledge + 108} z={z + 0.01} color={body} />
        <PxRect m={M} x0={cx - w * 0.68} y0={ledge + 150} x1={cx + w * 0.68} y1={440} z={z + 0.008} color={body} />
        <PxRect m={M} x0={cx + w * 0.18} y0={ledge} x1={cx + w * 0.5} y1={440} z={z + 0.012} color={'#000000'} opacity={0.07} />
        {[40, 75, 125].map((dy) => <PxRect key={dy} m={M} x0={cx - 3} y0={ledge + dy} x1={cx + 3} y1={ledge + dy + 12} z={z + 0.015} color={'#7d8aa3'} />)}
        <PxPoly m={M} pts={[[cx - w * 0.6, ledge - 4], [cx, top], [cx + w * 0.6, ledge - 4]]} z={z + 0.02} color={roof} />
        <PxPoly m={M} pts={[[cx, ledge - 4], [cx, top], [cx + w * 0.6, ledge - 4]]} z={z + 0.025} color={'#7487a0'} />
        <PxPoly m={M} pts={[[cx - 2, top + 2], [cx, top - 22], [cx + 2, top + 2]]} z={z + 0.03} color={'#e7c35e'} />
      </group>
    );
  };
  const Z = {sky: -60, mtn: -50, forest: -42, tw2: -32, tw1: -24};
  return (
    <group>
      {/* sky: navy left -> violet right, a pale atmosphere arc low down */}
      <PxRect m={M} x0={-400} y0={-200} x1={700} y1={260} z={Z.sky} color={'#29296a'} />
      <PxRect m={M} x0={700} y0={-200} x1={1700} y1={260} z={Z.sky - 0.01} color={'#55437f'} />
      <PxPoly m={M} pts={[[540, -200], [760, -200], [820, 260], [600, 260]]} z={Z.sky + 0.005} color={'#3f3f75'} />
      <PxPoly m={M} pts={[[-200, 110], [200, 88], [640, 78], [1080, 88], [1500, 110], [1500, 130], [-200, 130]]} z={Z.sky + 0.01} color={'#5b6aaf'} />
      <PxPoly m={M} pts={[[-200, 100], [200, 93], [640, 86], [1080, 93], [1500, 100], [1500, 106], [1080, 99], [640, 92], [200, 99], [-200, 106]]} z={Z.sky + 0.02} color={'#b9def1'} />
      {stars.map(([x, y, s], i) => { const tw = 0.55 + 0.45 * Math.sin(f * (0.25 + (i % 7) * 0.06) + i * 2.3); return <PxCircle key={i} m={M} c={[x, y]} r={s * (0.7 + 0.5 * tw)} z={Z.sky + 0.03} color={i % 5 ? '#ffffff' : '#ffe9a8'} opacity={0.35 + 0.65 * tw} />; })}
      {[[455, 22], [790, 12], [1000, 40], [140, 30], [690, 60]].map(([x, y], i) => { const tw = 0.5 + 0.5 * Math.sin(f * 0.3 + i * 1.9); const p = M.pt(x, y, Z.sky + 0.04); return <Flare key={`fl${i}`} pos={p} s={(4 + 4 * tw) / M.ppu(Z.sky)} opacity={0.5 + 0.5 * tw} />; })}
      {/* ringed planet */}
      <PxCircle m={M} c={[312, 52]} r={40} z={Z.sky + 0.04} color={'#c77f5c'} />
      {[[30, '#e0a47c'], [46, '#b56a4f'], [62, '#d99772']].map(([y, c], i) => <PxRect key={i} m={M} x0={278} y0={y as number} x1={348} y1={(y as number) + 6} z={Z.sky + 0.045} color={c as string} />)}
      <PxPoly m={M} pts={[[236, 92], [300, 70], [380, 45], [394, 44], [330, 72], [250, 96]]} z={Z.sky + 0.05} color={'#e8cf9a'} />
      {/* clouds (slow drift) */}
      <group position={[f * 0.012, 0, 0]}>
      {[[[200, 125], 55], [[255, 110], 48], [[300, 140], 40], [[525, 55], 45], [[575, 60], 30], [[880, 80], 58], [[960, 72], 70], [[1030, 95], 45], [[1100, 50], 30]].map(([c, r], i) =>
        <PxCircle key={i} m={M} c={c as [number, number]} r={r as number} z={Z.sky + 0.06} color={'#e4ebf3'} />)}
      <PxRect m={M} x0={150} y0={120} x1={340} y1={190} z={Z.sky + 0.06} color={'#e4ebf3'} />
      <PxRect m={M} x0={820} y0={90} x1={1090} y1={150} z={Z.sky + 0.06} color={'#e4ebf3'} />
      </group>
      {/* mountains */}
      <PxPoly m={M} pts={[[-100, 300], [-100, 150], [60, 110], [180, 150], [310, 82], [420, 140], [500, 110], [620, 160], [760, 120], [870, 150], [1000, 100], [1120, 145], [1200, 95], [1400, 140], [1400, 300]]} z={Z.mtn} color={'#87aca5'} />
      <PxPoly m={M} pts={[[-100, 300], [-100, 200], [120, 170], [300, 150], [450, 175], [640, 165], [900, 180], [1200, 160], [1400, 190], [1400, 300]]} z={Z.mtn + 0.02} color={'#a0b69f'} />
      {[[310, 82], [1000, 100], [500, 110]].map(([x, y], i) => <PxPoly key={i} m={M} pts={[[x - 26, y + 18], [x, y], [x + 26, y + 18], [x + 10, y + 13], [x, y + 20], [x - 10, y + 13]]} z={Z.mtn + 0.03} color={'#f3f6fb'} />)}
      {/* forest + lakes */}
      <PxPoly m={M} pts={[[-100, 450], [-100, 200], [200, 175], [500, 195], [800, 160], [1100, 170], [1400, 190], [1400, 450]]} z={Z.forest} color={'#759f77'} />
      {Array.from({length: 46}, (_, i) => { const x = -60 + i * 31, h = 70 + ((i * 37) % 60); return <PxPoly key={i} m={M} pts={[[x - 20, 440], [x, 440 - h - 140], [x + 20, 440]]} z={Z.forest + 0.01} color={i % 2 ? '#537461' : '#5e8268'} />; })}
      <PxCircle m={M} c={[285, 286]} r={45} sy={0.16} z={Z.forest + 0.02} color={'#a6dcf4'} />
      <PxCircle m={M} c={[862, 298]} r={60} sy={0.16} z={Z.forest + 0.02} color={'#a6dcf4'} />
      {/* castle towers (two depth layers) */}
      {tower(185, 38, 40, '#a3b3ca', Z.tw2, '#8597ad', 1)}
      {tower(265, 48, 70, '#a3b3ca', Z.tw2, '#8597ad', 2)}
      {tower(400, 40, 115, '#a8b4c8', Z.tw2, '#8597ad', 3)}
      {tower(965, 40, 70, '#a3b3ca', Z.tw2, '#8597ad', 4)}
      {tower(1085, 44, 110, '#c9c4b6', Z.tw2, '#a8a294', 5)}
      {tower(1110, 40, 30, '#a3b3ca', Z.tw2, '#8597ad', 6)}
      {tower(220, 52, 135, '#e7e3d8', Z.tw1, '#c7c1b0', 7)}
      {tower(358, 50, 90, '#e7e3d8', Z.tw1, '#c7c1b0', 8)}
      {tower(1015, 70, 145, '#a9b6cb', Z.tw1, '#8597ad', 9)}
      {tower(1080, 58, 185, '#e7e3d8', Z.tw1, '#c7c1b0', 10)}
      {/* domed cream tower */}
      <PxRect m={M} x0={915} y0={215} x1={968} y1={440} z={Z.tw1 + 0.1} color={'#e7e3d8'} />
      <PxRect m={M} x0={908} y0={230} x1={975} y1={245} z={Z.tw1 + 0.11} color={'#ddd8ca'} />
      <PxCircle m={M} c={[941, 215]} r={27} z={Z.tw1 + 0.1} color={'#d7d2c4'} />
      <PxPoly m={M} pts={[[939, 192], [941, 165], [943, 192]]} z={Z.tw1 + 0.11} color={'#e7c35e'} />
    </group>
  );
};

/** Bowl on a pole with a cold blue fire. */
const Brazier: React.FC<{x: number; f: number; seed: number}> = ({x, f, seed}) => {
  const z = -0.6, top = 1.62;
  return (
    <group>
      <Cyl r={0.06} h={top} pos={[x, top / 2, z]} color={'#b7b0a0'} cast={false} />
      <Ball r={0.11} pos={[x, top - 0.5, z]} color={GOLD} cast={false} />
      <Ball r={0.11} pos={[x, 0.15, z]} color={GOLD} cast={false} />
      <Cyl r={0.3} r2={0.62} h={0.36} pos={[x, top - 0.16, z]} color={'#f1ead6'} seg={28} cast={false} unlit />
      <Cyl r={0.28} r2={0.36} h={0.06} pos={[x, top - 0.35, z]} color={'#ddd4bd'} seg={28} cast={false} unlit />
      <Cyl r={0.64} h={0.06} pos={[x, top + 0.04, z]} color={'#e9c95e'} seg={28} cast={false} unlit />
      <Flame pos={[x, top + 0.07, z + 0.12]} w={0.52} h={1.6} f={f} seed={seed} colors={['#6aa6f4', '#acd8ff', '#fae1b8']} coal={'#4f4c58'} ember={'#9fd0ff'} spark={'#d8ecff'} />
    </group>
  );
};

const Column: React.FC<{x: number; z: number; r: number}> = ({x, z, r}) => (
  <group>
    <Cyl r={r} h={14} pos={[x, 7, z]} color={'#ece5d2'} seg={14} cast={false} />
    {Array.from({length: 7}, (_, i) => { const a = -1.3 + i * 0.43; return <Box key={i} size={[0.05, 14, 0.05]} pos={[x + Math.sin(a) * r, 7, z + Math.cos(a) * r]} rot={[0, a, 0]} color={'#d2c9b3'} cast={false} />; })}
  </group>
);

/** The mask, from the doom mask layers as flat cards (canvas 168 x 208, measured on the reference). */
const TINT = '#dde1e6';
const MASK_PARTS: FlatPart[] = [
  {src: 'doom/mask.png', x: -9, y: -6, w: 186, h: 222, z: -0.004, color: '#3a434c'},
  {src: 'doom/mask.png', x: 0, y: 0, w: 168, h: 208, z: 0, color: TINT},
  {src: 'doom/plate.png', x: 12.5, y: 65, w: 62, h: 34, z: 0.002, color: TINT},
  {src: 'doom/plate.png', x: 93.5, y: 65, w: 62, h: 34, z: 0.002, mirror: true, color: TINT},
  {src: 'doom/slit.png', x: 15, y: 73, w: 58, h: 18, z: 0.003, color: TINT},
  {src: 'doom/slit.png', x: 96, y: 73, w: 58, h: 18, z: 0.003, color: TINT},
  {src: 'doom/brow.png', x: 8, y: 44, w: 78, h: 21, z: 0.004, rot: 10, color: '#c4c9cf'},
  {src: 'doom/brow.png', x: 82, y: 44, w: 78, h: 21, z: 0.004, rot: -10, mirror: true, color: '#c4c9cf'},
  {src: 'doom/nose.png', x: 63, y: 62, w: 42, h: 62, z: 0.005, color: TINT},
  {src: 'doom/mouth.png', x: 2.5, y: 118, w: 163, h: 93, z: 0.003, color: TINT},
];

const Case: React.FC = () => {
  const W = 1.86, D = 1.2, yb = 1.3, yh = 3.3; // base top / header bottom
  const posts: [number, number][] = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
  return (
    <group>
      {/* pedestal */}
      <Box size={[1.62, 1.14, 1.05]} pos={[0, 0.57, 0]} color={'#e9e5dc'} cast={false} />
      <Box size={[1.66, 0.09, 1.08]} pos={[0, 0.09, 0]} color={GOLD} />
      {/* base slab */}
      <Box size={[W + 0.05, 0.16, D + 0.05]} pos={[0, yb - 0.08, 0]} color={GOLD} />
      {/* posts */}
      {posts.map(([kx, kz], i) => <Box key={i} size={[0.1, yh - yb, 0.1]} pos={[kx * (W / 2 - 0.04), (yb + yh) / 2, kz * (D / 2 - 0.04)]} color={GOLD} />)}
      {/* header + cap + crown + corner balls */}
      <Box size={[W + 0.02, 0.28, D + 0.02]} pos={[0, yh + 0.14, 0]} color={GOLD} />
      <Box size={[W - 0.18, 0.1, D - 0.18]} pos={[0, yh + 0.33, 0]} color={GOLDL} />
      {[-1, 1].map((k) => <Ball key={k} r={0.105} pos={[k * (W / 2 - 0.02), yh + 0.38, D / 2 - 0.04]} color={GOLDL} />)}
      <group position={[0, yh + 0.36, 0.25]}>
        {/* crown ridge: two humps */}
        <mesh rotation={[0, 0, 0]}><shapeGeometry args={[(() => { const sh = new THREE.Shape(); sh.moveTo(-0.55, 0); sh.lineTo(-0.24, 0.17); sh.lineTo(-0.12, 0.12); sh.lineTo(0, 0.22); sh.lineTo(0.12, 0.12); sh.lineTo(0.24, 0.17); sh.lineTo(0.55, 0); return sh; })()]} /><meshStandardMaterial color={GOLD} roughness={1} flatShading /></mesh>
      </group>
      {/* back panel (navy) with darker rim */}
      <Box size={[1.56, 2.08, 0.04]} pos={[0, 2.38, -0.52]} color={'#2d3150'} cast={false} />
      <Box size={[1.44, 1.96, 0.04]} pos={[0, 2.38, -0.5]} color={'#3a3f68'} cast={false} />
      {/* stand under the chin */}
      <Box size={[0.42, 0.06, 0.32]} pos={[0, yb + 0.03, -0.3]} color={GOLD} />
      <Cyl r={0.06} r2={0.1} h={0.18} pos={[0, yb + 0.12, -0.3]} color={GOLD2} />
      {/* mask */}
      <FlatCards parts={MASK_PARTS} scale={0.0086} origin={[84, 104]} pos={[0, 2.42, -0.36]} />
      {/* chin cradle */}
      <group position={[0, 1.44, -0.33]}>
        <mesh><shapeGeometry args={[(() => { const sh = new THREE.Shape(); sh.moveTo(-0.5, 0.12); sh.lineTo(0, -0.03); sh.lineTo(0.5, 0.12); sh.lineTo(0.42, 0.18); sh.lineTo(0, 0.05); sh.lineTo(-0.42, 0.18); return sh; })()]} /><meshBasicMaterial color={GOLD2} /></mesh>
      </group>
      {/* glass: faint panes + highlight streaks on the front pane */}
      <mesh position={[0, (yb + yh) / 2, D / 2 - 0.04]}><planeGeometry args={[W - 0.1, yh - yb]} /><meshBasicMaterial color={'#ffffff'} transparent opacity={0.06} depthWrite={false} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[k * (W / 2 - 0.04), (yb + yh) / 2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[D - 0.1, yh - yb]} /><meshBasicMaterial color={'#e8f0ff'} transparent opacity={0.1} depthWrite={false} side={2} /></mesh>)}
      <PxPoly m={M} pts={[[468, 268], [575, 122], [596, 122], [490, 268]]} z={D / 2 - 0.03} color={'#ffffff'} opacity={0.55} />
      <PxPoly m={M} pts={[[508, 268], [612, 122], [622, 122], [518, 268]]} z={D / 2 - 0.03} color={'#ffffff'} opacity={0.55} />
      <PxPoly m={M} pts={[[664, 262], [712, 202], [726, 202], [678, 262]]} z={D / 2 - 0.03} color={'#ffffff'} opacity={0.75} />
      <PxPoly m={M} pts={[[695, 262], [742, 204], [750, 204], [703, 262]]} z={D / 2 - 0.03} color={'#ffffff'} opacity={0.75} />
      <PxPoly m={M} pts={[[525, 232], [529, 232], [529, 356], [525, 356]]} z={D / 2 - 0.03} color={'#ffffff'} opacity={0.6} />
    </group>
  );
};

const Room: React.FC<{f: number}> = ({f}) => {
  const dust = useMemo(() => { const r = rand(31); return Array.from({length: 34}, () => [(r() - 0.5) * 9, 1.4 + r() * 3.4, -3.2 - r() * 4, 0.018 + r() * 0.025] as const); }, []);
  return (
    <group>
      {/* floor */}
      <Box size={[40, 1, 30]} pos={[0, -0.5, -5]} color={'#efe8da'} cast={false} receive={false} />
      {/* low wall with panels and gold diamonds; grey terrace behind it */}
      <Box size={[30, 1.18, 0.4]} pos={[0, 0.59, -3.7]} color={CREAM} />
      <Box size={[30, 0.05, 0.42]} pos={[0, 1.13, -3.68]} color={'#d4b35c'} cast={false} />
      {[-4.6, -1.6, 1.6, 4.6].map((x, i) => (
        <group key={i}>
          <Box size={[2.6, 0.62, 0.02]} pos={[x, 0.5, -3.49]} color={'#e1dccd'} cast={false} />
          <Box size={[2.5, 0.54, 0.02]} pos={[x, 0.5, -3.48]} color={'#f7f2e3'} cast={false} />
          {[-0.85, -0.3, 0.3, 0.85].map((dx, j) => <Box key={j} size={[0.1, 0.1, 0.02]} rot={[0, 0, Math.PI / 4]} pos={[x + dx, 0.5, -3.465]} color={'#efd986'} cast={false} />)}
        </group>
      ))}
      <Box size={[30, 1.6, 6]} pos={[0, 0.8, -7.0]} color={'#c3c0b7'} cast={false} unlit />
      {/* columns */}
      <Column x={-4.95} z={-2.9} r={0.62} />
      <Column x={4.95} z={-2.9} r={0.62} />
      <Column x={0} z={-4.8} r={0.5} />
      <Brazier x={-3.2} f={f} seed={0} />
      <Brazier x={3.2} f={f} seed={2} />
      {dust.map(([x, y, z, sz], i) => <Speck key={i} pos={[x + Math.sin(f * 0.05 + i) * 0.05, y + ((f * 0.004 * (1 + (i % 3))) % 0.6), z]} s={sz} color={i % 3 ? '#f4dd8a' : '#ffffff'} opacity={0.6 + 0.35 * Math.sin(f * 0.3 + i * 2)} />)}
    </group>
  );
};

const Scene: React.FC<{f: number; t: number}> = ({f, t}) => {
  const c = lerp3(CAM0, CAM1, t);
  return (
    <>
      <Cam pos={[c[0] + drift(f, 1) * 0.004, c[1] + drift(f, 2) * 0.004, c[2]]} look={[c[0], c[1], -20]} fov={FOV} />
      <Lights />
      <Post focus={[0, 2.38, -0.36]} blur={0.18} />
      <Backdrop f={f} />
      <Room f={f} />
      <Case />
      {/* glints on the gold: short pops on the corner balls, crown and base edge */}
      {([[-0.88, 3.74, 0.66, 3], [0.88, 3.74, 0.66, 12], [0.05, 3.9, 0.3, 17], [-0.9, 1.33, 0.66, 8]] as const).map(([x, y, z, k], i) => {
        const d = Math.abs(f - k), o = Math.max(0, 1 - d / 4);
        return <Flare key={i} pos={[x, y, z]} s={0.065 * (0.4 + o)} color={'#fff6d6'} opacity={o} />;
      })}
    </>
  );
};

export const MASKCASE: ShotDef = {id: 'maskcase', len: 22, bg: '#29296a', Scene};
