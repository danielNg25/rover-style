import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, Cyl, Cone, Ball, Poly, Arc, Speck, Glow} from '../three/prims';
import {HallSky, HallGlints} from './HallAmbience';

const CREAM = '#f6f0e0', CREAM2 = '#e5dec8', CREAM3 = '#eee7d4', GOLD = '#e2b63a', GOLD2 = '#c99a2c', GOLDL = '#f1d362';
const GREEN = '#4cc05c', GREEN2 = '#2f9a48', SKY = '#1c2271', SKY2 = '#262a8c', LAV = '#aeb4dc', ROOF = '#8d8a8c';
type V3 = [number, number, number];
const rand = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

const Diamonds: React.FC<{w: number; h: number; z: number; y0: number; s?: number}> = ({w, h, z, y0, s = 1}) => {
  const rows = 4, items: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const y = y0 + h * (0.14 + (r * 0.72) / (rows - 1));
    const xs = r % 2 ? [-0.36, -0.14, 0.14, 0.36] : [-0.3, -0.12, 0.12, 0.3];
    xs.forEach((fx, i) => items.push(<Poly key={`${r}${i}`} pts={[[0, 0.19 * s], [0.1 * s, 0], [0, -0.19 * s], [-0.1 * s, 0]]} color={GOLDL} pos={[fx * w, y, z]} fog={false} />));
  }
  return <>{items}</>;
};

/** Big throne: slab back, green panel, tall arm pillars with gold spheres, low front blocks. */
const Throne: React.FC<{pos: V3; big?: boolean}> = ({pos, big}) => {
  const W = big ? 4.3 : 3.0, H = big ? 6.4 : 4.4, PW = big ? 3.2 : 2.05, PH = big ? 3.7 : 2.6, PY = big ? 1.75 : 1.25;
  const pillarH = big ? 3.0 : 1.55, pillarW = big ? 1.35 : 0.8, px = W / 2 + pillarW / 2 - 0.25;
  return (
    <group position={pos}>
      <Box size={[W, H, 0.5]} pos={[0, H / 2, -1.0]} color={CREAM} />
      <Box size={[W + 0.25, 0.2, 0.62]} pos={[0, H - (big ? 0.5 : 0.1), -1.0]} color={GOLD} />
      {big ? <Ball r={0.3} pos={[0, H + 0.1, -0.9]} color={GOLDL} /> : (
        <>
          {/* flat gable (pediment) with a gold disc, on a small step */}
          <Box size={[W * 0.86, 0.22, 0.5]} pos={[0, H + 0.12, -1.0]} color={CREAM3} />
          <Box size={[W * 0.8, 0.5, 0.42]} pos={[0, H + 0.42, -1.02]} color={CREAM} />
          <Poly pts={[[-W * 0.43, 0], [W * 0.43, 0], [0, 1.25]]} color={'#f3eddc'} pos={[0, H + 0.23, -0.74]} fog={false} />
          <Poly pts={[[-W * 0.43, 0], [W * 0.43, 0], [0, 1.25], [0, 1.12], [W * 0.36, 0.06], [-W * 0.36, 0.06], [0, 1.12], [0, 1.25]]} color={'#e2d9bf'} pos={[0, H + 0.23, -0.735]} fog={false} />
          <mesh position={[0, H + 0.62, -0.72]}><circleGeometry args={[0.24, 24]} /><meshBasicMaterial color={GOLD} fog={false} /></mesh>
          <mesh position={[0, H + 0.62, -0.715]}><circleGeometry args={[0.12, 24]} /><meshBasicMaterial color={'#fff3c4'} fog={false} /></mesh>
          {[-1, 1].map((k) => (<group key={k}><Box size={[0.3, 1.3, 0.3]} pos={[k * (W / 2 - 0.1), H + 0.65, -1.0]} color={CREAM} /><Cone r={0.2} h={0.8} pos={[k * (W / 2 - 0.1), H + 1.7, -1.0]} color={GOLD2} seg={4} /></group>))}
        </>
      )}
      {/* green panel with gold frame */}
      <Box size={[PW + 0.24, PH + 0.24, 0.08]} pos={[0, PY + PH / 2, -0.72]} color={GOLD} cast={false} />
      <Box size={[PW, PH, 0.08]} pos={[0, PY + PH / 2, -0.69]} color={GREEN} cast={false} unlit />
      <Diamonds w={PW} h={PH} z={-0.64} y0={PY} s={big ? 1 : 0.7} />
      {/* seat */}
      <Box size={[W - 0.5, big ? 1.1 : 0.8, 1.5]} pos={[0, big ? 0.55 : 0.4, -0.1]} color={CREAM3} />
      <Box size={[W - 0.9, 0.14, 1.3]} pos={[0, big ? 1.17 : 0.87, -0.05]} color={GREEN2} cast={false} />
      {/* arm pillars */}
      {[-1, 1].map((k) => (
        <group key={k}>
          <Box size={[pillarW, pillarH, 1.3]} pos={[k * px, pillarH / 2, -0.2]} color={CREAM} />
          <Box size={[pillarW * 0.56, pillarH * 0.62, 0.04]} pos={[k * px, pillarH * 0.48, 0.47]} color={CREAM2} cast={false} />
          <Ball r={big ? 0.33 : 0.22} pos={[k * px, pillarH + (big ? 0.28 : 0.18), -0.2]} color={GOLD} />
        </group>
      ))}
      {/* low front blocks */}
      {big && [-1, 1].map((k) => (
        <group key={k}>
          <Box size={[1.05, 0.92, 1.0]} pos={[k * 1.22, 0.46, 1.5]} color={CREAM} />
          <Box size={[1.1, 0.1, 1.05]} pos={[k * 1.22, 0.95, 1.5]} color={GOLD} cast={false} />
          <Box size={[0.62, 0.5, 0.04]} pos={[k * 1.22, 0.42, 2.02]} color={CREAM2} cast={false} />
        </group>
      ))}
    </group>
  );
};

const Lantern: React.FC<{pos: V3; t?: number; seed?: number}> = ({pos, t = 0, seed = 0}) => {
  // candle flicker: two fast sines plus a stepped jitter every 3 frames
  const fl = 0.85 + 0.1 * Math.sin(t * 0.9 + seed) + 0.06 * Math.sin(t * 2.3 + seed * 3) + 0.05 * (Math.sin(Math.floor(t / 3) * 12.9898 + seed) % 1);
  return (
  <group position={pos}>
    <Cyl r={0.06} h={1.4} pos={[0, 0.7, 0]} color={GOLD2} />
    <Box size={[0.66, 0.08, 0.66]} pos={[0, 1.42, 0]} color={GOLD} />
    <Box size={[0.5, 0.95, 0.5]} pos={[0, 1.93, 0]} color={'#fff8de'} unlit cast={false} />
    {[-1, 1].map((k) => <Box key={k} size={[0.05, 0.95, 0.05]} pos={[k * 0.25, 1.93, 0.25]} color={GOLD} cast={false} />)}
    <Box size={[0.05, 0.95, 0.03]} pos={[0, 1.93, 0.26]} color={GOLD} cast={false} />
    <Box size={[0.66, 0.08, 0.66]} pos={[0, 2.44, 0]} color={GOLD} />
    <Cone r={0.46} h={0.42} pos={[0, 2.68, 0]} color={GOLD} seg={4} rot={[0, Math.PI / 4, 0]} />
    <Ball r={0.09} pos={[0, 2.98, 0]} color={GOLDL} />
    <Box size={[0.22, 0.5, 0.02]} pos={[0, 1.88, 0.26]} color={'#ffd77a'} unlit cast={false} />
    <Glow pos={[0, 1.93, 0.4]} r={0.75 * (0.92 + 0.08 * fl)} color={'#ffe7a0'} strength={0.3 * fl} />
    <pointLight position={[0, 1.95, 0.6]} color={'#ffe9a8'} intensity={5 * fl} distance={6} decay={2} />
  </group>
  );
};

const Tower: React.FC<{pos: V3; h: number; w: number; c?: string; t?: number}> = ({pos, h, w, c = LAV, t = 0}) => (
  <group position={pos}>
    <Box size={[w, h, w]} pos={[0, h / 2, 0]} color={c} cast={false} />
    <Box size={[w * 1.2, w * 0.3, w * 1.2]} pos={[0, h, 0]} color={c} cast={false} />
    <Cone r={w * 0.8} h={w * 2.4} pos={[0, h + w * 1.35, 0]} color={ROOF} seg={4} rot={[0, Math.PI / 4, 0]} cast={false} />
    {[0.86, 0.72, 0.58, 0.44].map((f, i) => { const ph = pos[0] * 1.3 + i * 2.1; const on = 0.75 + 0.25 * Math.sin(t * (0.15 + 0.05 * i) + ph); return <group key={i}><Poly pts={[[0, 0.16 * w], [0.1 * w, 0], [0, -0.16 * w], [-0.1 * w, 0]]} color={'#ffe9a0'} pos={[(i % 2 ? 0.2 : -0.2) * w, h * f, w / 2 + 0.03]} fog={false} opacity={on} /><Glow pos={[(i % 2 ? 0.2 : -0.2) * w, h * f, w / 2 + 0.05]} r={0.2 * w} color={'#ffe9a0'} strength={0.14 * on} /></group>; })}
  </group>
);

const Cloud: React.FC<{pos: V3; s: number; t?: number}> = ({pos, s, t = 0}) => (
  <group position={[pos[0] + t * 0.02 * (1 + (pos[2] % 3) * 0.2), pos[1], pos[2]]} scale={s}>
    {/* shaded underside lumps (second tone) */}
    {[[-1.0, -0.65, 0.75], [0.9, -0.6, 0.8], [-0.1, -0.75, 0.7]].map(([x, y, r], i) => <mesh key={`u${i}`} position={[x, y, -0.02]}><circleGeometry args={[r, 20]} /><meshBasicMaterial color={'#cfd8ee'} fog={false} /></mesh>)}
    {[[0, 0, 1.2], [-1.3, -0.3, 0.9], [1.4, -0.25, 1.0], [0.6, 0.5, 0.8], [-2.3, -0.6, 0.6], [2.5, -0.6, 0.6]].map(([x, y, r], i) => (
      <mesh key={i} position={[x, y, 0]}><circleGeometry args={[r, 20]} /><meshBasicMaterial color={'#eef2fb'} fog={false} /></mesh>
    ))}
    <mesh position={[0, -1.0, 0.01]}><planeGeometry args={[6.4, 1]} /><meshBasicMaterial color={'#eef2fb'} fog={false} /></mesh>
  </group>
);

const Column: React.FC<{pos: V3; r?: number}> = ({pos, r = 0.78}) => (
  <group position={pos}>
    <Box size={[r * 2.7, 0.55, r * 2.7]} pos={[0, 0.275, 0]} color={CREAM} />
    <Box size={[r * 2.45, 0.2, r * 2.45]} pos={[0, 0.65, 0]} color={GOLD} />
    <Cyl r={r} h={24} pos={[0, 12.7, 0]} color={'#e9e2ce'} seg={20} />
    {Array.from({length: 10}, (_, i) => { const a = (i / 10) * Math.PI * 2 + 0.15; return <Box key={i} size={[0.07, 24, 0.07]} pos={[Math.sin(a) * (r + 0.005), 12.7, Math.cos(a) * (r + 0.005)]} color={'#cfc6ae'} cast={false} rot={[0, a, 0]} />; })}
    <group position={[0, 7.2, r + 0.03]}>
      <Poly pts={[[-0.6, 0.5], [0, 0], [0.6, 0.5], [0.6, 0.72], [0, 0.22], [-0.6, 0.72]]} color={GOLD} fog={false} />
    </group>
  </group>
);

export const ThroneHall: React.FC<{frontColumns?: boolean; frame?: number}> = ({frontColumns, frame = 0}) => {
  const stars = useMemo(() => { const r = rand(11); return Array.from({length: 260}, () => [(r() - 0.5) * 300, r() * 95 + 4, 0.16 + r() * r() * 0.6] as const); }, []);
  const pines = useMemo(() => { const r = rand(5); return Array.from({length: 90}, (_, i) => [-135 + i * 3 + r() * 2, 7 + r() * 5] as const); }, []);
  const dust = useMemo(() => { const r = rand(23); return Array.from({length: 72}, () => [(r() - 0.5) * 14 - 0.5, 0.6 + r() * 5, -6 + r() * 12, 0.016 + r() * r() * 0.045] as const); }, []);
  return (
    <group>
      {/* ---------- sky + far cards ---------- */}
      <mesh position={[0, 40, -160]}><planeGeometry args={[600, 240]} /><meshBasicMaterial color={SKY} fog={false} /></mesh>
      <Poly pts={[[-200, 30], [-120, 44], [-40, 34], [30, 48], [110, 36], [200, 46], [200, 90], [-200, 90]]} color={SKY2} pos={[0, 22, -158]} fog={false} />
      <Poly pts={[[-200, 0], [-110, 12], [-30, 4], [60, 14], [140, 5], [200, 10], [200, -14], [-200, -14]]} color={'#3640a8'} pos={[0, 22, -157]} fog={false} />
      {stars.map(([x, y, s], i) => { const tw = 0.5 + 0.5 * Math.sin(frame * (0.12 + (i % 9) * 0.03) + i * 2.7); return <Speck key={i} pos={[x, y, -156]} s={s * (0.65 + 0.55 * tw)} color={i % 7 ? '#ffffff' : '#ffe9a0'} opacity={0.4 + 0.6 * tw} />; })}
      <HallSky frame={frame} />
      {/* mountains: grey-blue with white caps */}
      <Poly pts={[[-170, 0], [-128, 30], [-104, 14], [-78, 38], [-50, 16], [-28, 30], [-4, 12], [24, 36], [50, 15], [78, 32], [108, 12], [136, 30], [170, 0]]} color={'#8e9cc4'} pos={[0, -2, -140]} fog={false} />
      {[[-128, 30], [-78, 38], [-28, 30], [24, 36], [78, 32], [136, 30]].map(([x, y], i) => (
        <Poly key={i} pts={[[0, 0], [9, -11], [5, -9], [2, -13], [-2, -9], [-5, -12], [-9, -11]]} color={'#f6f8fd'} pos={[x, y - 4, -139.5]} fog={false} />
      ))}
      <Poly pts={[[-170, 0], [-120, 14], [-70, 6], [-20, 16], [30, 7], [80, 15], [130, 6], [170, 12], [170, -10], [-170, -10]]} color={'#b9c6e6'} pos={[0, -2, -125]} fog={false} />
      <Cloud pos={[-52, 14, -120]} s={2.6} t={frame} /><Cloud pos={[26, 22, -122]} s={3.2} t={frame} /><Cloud pos={[75, 12, -118]} s={2.4} t={frame} /><Cloud pos={[-10, 9, -116]} s={2} t={frame} />
      {/* pine forest */}
      {pines.map(([x, h], i) => <Poly key={i} pts={[[-2.1, 0], [0, h], [2.1, 0]]} color={i % 2 ? '#2f7a52' : '#3b8a5c'} pos={[x, -3, -104 + (i % 3)]} fog={false} />)}
      <mesh position={[0, -8, -103]}><planeGeometry args={[400, 12]} /><meshBasicMaterial color={'#2f7a52'} fog={false} /></mesh>
      <Poly pts={[[-170, 0], [-110, 5], [-50, 1], [10, 6], [70, 2], [120, 6], [170, 1], [170, -8], [-170, -8]]} color={'#e8eef8'} pos={[0, -3, -92]} fog={false} />
      <Poly pts={[[-220, -20], [220, -20], [220, 14], [110, 20], [0, 15], [-110, 21], [-220, 16]]} color={'#3344a6'} pos={[0, 0, -155]} fog={false} />
      {/* castle towers */}
      <Tower pos={[-15, -6, -40]} h={15} w={3.6} c={'#b9bfe6'} t={frame} /><Tower pos={[-9, -6, -46]} h={12.5} w={3.2} c={'#aeb4de'} t={frame} />
      <Tower pos={[11, -6, -42]} h={14} w={3.4} c={'#b9bfe6'} t={frame} /><Tower pos={[17, -6, -48]} h={19} w={4} c={'#aeb4de'} t={frame} /><Tower pos={[-22, -6, -50]} h={20} w={4} c={'#aeb4de'} t={frame} />
      <Tower pos={[-34, -6, -82]} h={24} w={5} t={frame} /><Tower pos={[-24, -6, -92]} h={19} w={4} c={'#a2a8d4'} t={frame} />
      <Tower pos={[22, -6, -86]} h={25} w={4.6} t={frame} /><Tower pos={[36, -6, -80]} h={20} w={4.4} c={'#a2a8d4'} t={frame} />

      {/* ---------- sun-ring behind the thrones ---------- */}
      <group position={[-1.2, 6.1, -9.4]}>
        {Array.from({length: 9}, (_, i) => { const a0 = -0.5 + i * 0.47; return <Arc key={i} r1={4.55} r2={4.95} a0={a0} a1={a0 + 0.38} color={i % 2 ? '#f0dc8c' : '#e6c659'} />; })}
        <Arc r1={4.05} r2={4.17} a0={-0.6} a1={Math.PI + 0.6} color={'#e3c458'} />
        {Array.from({length: 6}, (_, i) => { const a0 = -0.3 + i * 0.66; return <Arc key={i} r1={5.3} r2={5.42} a0={a0} a1={a0 + 0.42} color={'#f0dc8c'} />; })}
        {[-0.3, 0.12, 0.55, 0.98, 1.4, 1.74, 2.16, 2.6, 3.02, 3.44].map((a, i) => <Poly key={i} pts={[[-0.36, 5.75], [0.36, 5.75], [0, i % 2 ? 7.3 : 6.7]]} color={i % 2 ? '#f1e39a' : '#e8cf6a'} rot={[0, 0, a - Math.PI / 2]} fog={false} />)}
      </group>

      {/* ---------- floor + dais ---------- */}
      <Box size={[90, 1, 60]} pos={[0, -0.5, -6]} color={'#ece6d6'} cast={false} />
      {[8, 4.6].map((z, i) => <Box key={i} size={[90, 0.02, 0.22]} pos={[0, 0.011, z]} color={GOLD} cast={false} />)}
      <Box size={[22, 0.3, 13]} pos={[1.4, 0.15, -6.5]} color={CREAM} /><Box size={[22.06, 0.09, 0.14]} pos={[1.4, 0.26, 0.02]} color={GOLD} cast={false} />
      <Box size={[20, 0.3, 12]} pos={[1.4, 0.45, -7.0]} color={CREAM} /><Box size={[20.06, 0.09, 0.14]} pos={[1.4, 0.56, -0.98]} color={GOLD} cast={false} />
      <Box size={[18, 0.3, 11]} pos={[1.4, 0.75, -7.5]} color={'#faf7ec'} /><Box size={[18.06, 0.09, 0.14]} pos={[1.4, 0.86, -1.98]} color={GOLD} cast={false} />
      {/* carpet */}
      {[[0.012, 5.0, 10], [0.312, -0.49, 1.02], [0.612, -1.49, 1.02], [0.912, -3.6, 3.25]].map(([y, z, d], i) => <Box key={i} size={[4.6, 0.02, d]} pos={[-1.2, y, z]} color={'#cbb65c'} cast={false} />)}
      {[[0.15, 0.03], [0.45, -0.97], [0.75, -1.97]].map(([y, z], i) => <Box key={i} size={[4.6, 0.3, 0.02]} pos={[-1.2, y, z]} color={'#bfa848'} cast={false} />)}
      {/* balustrade */}
      <Box size={[70, 1.3, 0.5]} pos={[0, 0.65, -14.5]} color={CREAM2} /><Box size={[70, 0.16, 0.75]} pos={[0, 1.38, -14.5]} color={CREAM} />

      {/* ---------- thrones ---------- */}
      <Throne pos={[-1.2, 0.9, -6.6]} big />
      <Throne pos={[2.75, 0.9, -7.6]} />

      {/* ---------- left props: pedestals, lantern, orrery ---------- */}
      <Box size={[1.25, 1.7, 1.25]} pos={[-5.5, 1.75, -5.0]} color={CREAM} /><Box size={[1.3, 0.12, 1.3]} pos={[-5.5, 1.5, -5.0]} color={GOLD} cast={false} />
      <Box size={[1.4, 0.1, 1.4]} pos={[-5.5, 2.63, -5.0]} color={GOLD} cast={false} />
      <group position={[-5.5, 2.68, -4.9]} scale={0.78}><Lantern pos={[0, 0, 0]} t={frame} seed={0} /></group>
      <Box size={[1.0, 1.0, 1.0]} pos={[-6.3, 1.4, -4.2]} color={CREAM3} />
      <group position={[-5.2, 5.0, -6.6]} scale={0.85}>
        <Cyl r={0.07} h={4.2} pos={[0, -2.2, 0]} color={GOLD2} /><Box size={[1.2, 0.12, 0.12]} pos={[0, -1.3, 0]} color={GOLD} />
        <Ball r={0.62} pos={[0, 0, 0]} color={'#6f8fc4'} seg={18} />
        {[[0.2, 0.25, 0.3], [-0.25, -0.05, 0.26], [0.1, -0.3, 0.2], [0.75, 0.1, 0.24], [-0.85, 0.3, 0.2]].map(([x0, y, r], i) => {
          // the globe turns: continents slide across the face, squash near the rim and wrap round the back
          const u = (((x0 / 0.62 + frame * 0.02 + 1) % 2) + 2) % 2 - 1; if (Math.abs(u) > 0.88) return null;
          const k = Math.sqrt(1 - u * u);
          return <mesh key={i} position={[u * 0.6, y, 0.6 * k]} scale={[k, 1, 1]}><circleGeometry args={[r, 12]} /><meshBasicMaterial color={'#4f9b5a'} fog={false} /></mesh>;
        })}
        {[[1.25, 0.5, 0], [1.9, -0.6, 0.4], [0.5, 0.3, 0.2]].map((rot, i) => {
          const R = 1.0 + i * 0.16, a = frame * (0.05 + i * 0.025) * (i === 1 ? -1 : 1) + i * 2.1;
          return (
            <group key={i} rotation={[rot[0], rot[1] + frame * 0.004 * (i + 1), rot[2]]}>
              <mesh><torusGeometry args={[R, 0.035, 6, 48]} /><meshBasicMaterial color={i === 1 ? GOLDL : GOLD} fog={false} /></mesh>
              <mesh position={[Math.cos(a) * R, Math.sin(a) * R, 0]}><sphereGeometry args={[0.09, 10, 8]} /><meshBasicMaterial color={'#f4f6ff'} fog={false} /></mesh>
            </group>
          );
        })}
      </group>
      {/* right lantern */}
      <Box size={[1.0, 0.9, 1.0]} pos={[4.75, 1.35, -7.9]} color={CREAM} /><Box size={[1.08, 0.1, 1.08]} pos={[4.75, 1.83, -7.9]} color={GOLD} cast={false} />
      <group position={[4.75, 1.88, -7.8]} scale={0.8}><Lantern pos={[0, 0, 0]} t={frame} seed={2.4} /></group>

      {dust.map(([x, y, z, sz], i) => {
        // slow upward drift with a sideways wobble, wrapping inside the hall; each mote twinkles on its own phase
        const yy = 0.6 + ((y - 0.6 + frame * (0.004 + (i % 5) * 0.0015)) % 5);
        const xx = x + Math.sin(frame * 0.03 + i * 1.7) * 0.12;
        return <Speck key={i} pos={[xx, yy, z]} s={sz} color={'#fff6d0'} opacity={0.55 + 0.35 * Math.sin(frame * 0.12 + i * 2.1)} />;
      })}

      {/* ---------- columns ---------- */}
      <Column pos={[5.15, 0.9, -4.2]} />
      <Column pos={[-9.4, 0.9, -4.2]} />
      {frontColumns ? <><Column pos={[-5.3, 0, 3.4]} r={0.75} /><Column pos={[2.9, 0, 3.4]} r={0.75} /></> : null}
      <HallGlints frame={frame} />
    </group>
  );
};
