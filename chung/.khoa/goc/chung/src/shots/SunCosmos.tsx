import React, {useMemo} from 'react';
import * as THREE from 'three';
import type {ShotDef} from './types';
import {Cam, drift} from '../three/stage';
import {Post} from '../three/Post';
import {PixelSpace, CAM_Z, CAM_FOV, rand, Disc, Ring, P, Rect, spike, ro} from './flat2d';
import {makeStars, StarField} from './space';

/* Shot "sun" = ref frames 332-365. Close-up of a stylised Sun: a real rotating sphere textured with
   pentagon granules + sunspots, layered spiky corona cards behind it (flickering), prominence loops,
   a blob trail on the left, dark-maroon halo bands, space backdrop. Camera pans up (sun drifts down ~50 px). */

const BG = '#0b1029';
const SUN_X = 640, SUN_Y = 330, SUN_R = 305; // at f0, ref px

/* ---------- granule texture (equirect, u=0.25 faces the camera at rotation 0) ---------- */
const makeSunTexture = () => {
  const W = 4096, H = 2048;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#a63a12'; g.fillRect(0, 0, W, H);
  const r = rand(17);
  const step = 52;
  const pal = ['#ec7a22', '#f08826', '#f39530', '#e8701e', '#f7a238'];
  for (let y = 0; y < H + step; y += step * 0.8) {
    const lat = (0.5 - y / H) * Math.PI, sx = 1 / Math.max(0.2, Math.cos(lat)); // stretch cells near poles
    for (let x = -step; x < W + step; x += step * 0.85 * sx) {
      const k = r();
      g.fillStyle = k > 0.9 ? '#ffe9a0' : k > 0.74 ? '#ffc14e' : pal[Math.floor(r() * pal.length)];
      const n = r() > 0.35 ? 5 : 6, rad = step * (0.3 + r() * 0.17), a0 = r() * 6.28;
      const cx = x + (r() - 0.5) * step * 0.45 * sx, cy = y + (r() - 0.5) * step * 0.4;
      g.beginPath();
      for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2; const q = rad * (0.85 + r() * 0.3); g.lineTo(cx + Math.cos(a) * q * sx, cy + Math.sin(a) * q); }
      g.closePath(); g.fill();
    }
  }
  // sunspots: [lon deg (screen-right +), lat deg, radius px]
  const spots: [number, number, number][] = [[-31.5, 7.5, 70], [-18, -2, 44], [-23, 17, 18], [39, -43, 44], [52, -36, 24], [70, 15, 28], [8, -62, 30]];
  spots.forEach(([lon, lat, rr], i) => {
    const u = (0.25 + lon / 360) * W, v = ((90 - lat) / 180) * H, sx = 1 / Math.cos((lat * Math.PI) / 180);
    const rr2 = rand(40 + i);
    const blob = (rad: number, col: string) => {
      g.fillStyle = col; g.beginPath();
      for (let j = 0; j < 9; j++) { const a = (j / 9) * Math.PI * 2; const q = rad * (0.85 + rr2() * 0.25); g.lineTo(u + Math.cos(a) * q * sx, v + Math.sin(a) * q); }
      g.closePath(); g.fill();
    };
    blob(rr * 1.7, '#b04818'); blob(rr * 1.3, '#6e2c12'); blob(rr * 0.8, '#2c1208');
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
};

/** sparkle layer: random bright cells on a transparent canvas; two of them alternate every 2 frames (surface shimmer) */
const makeShimmer = (seed: number) => {
  const W = 2048, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!; const r = rand(seed);
  for (let i = 0; i < 520; i++) {
    const y = H * (0.08 + r() * 0.84), lat = (0.5 - y / H) * Math.PI, sx = 1 / Math.max(0.25, Math.cos(lat));
    const x = r() * W, rad = 7 + r() * 6, a0 = r() * 6.28;
    g.fillStyle = r() > 0.6 ? '#ffe9a0' : '#ffc94e'; g.globalAlpha = 1;
    g.beginPath(); for (let k = 0; k < 5; k++) { const a = a0 + (k / 5) * Math.PI * 2; g.lineTo(x + Math.cos(a) * rad * sx, y + Math.sin(a) * rad); } g.closePath(); g.fill();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
};

const SunBall: React.FC<{f: number; dy: number}> = ({f, dy}) => {
  const tex = useMemo(makeSunTexture, []);
  const sh = useMemo(() => [makeShimmer(71), makeShimmer(72), makeShimmer(73)], []);
  // sphere in world units: centre px -> world, radius chosen so its silhouette matches SUN_R
  const d = CAM_Z, rWorld = (SUN_R / 100) / Math.sqrt(1 + (SUN_R / 100 / d) ** 2);
  const y = (360 - (SUN_Y + dy)) / 100, rot = (f / 33) * 0.133;
  return (
    <group position={[(SUN_X - 640) / 100, y, 0]}>
      <mesh rotation={[0, rot, 0]} renderOrder={ro(5)}>
        <sphereGeometry args={[rWorld, 96, 64]} />
        <meshBasicMaterial map={tex} transparent depthTest={false} depthWrite={false} fog={false} />
      </mesh>
      <mesh rotation={[0, rot, 0]} renderOrder={ro(5.1)}>
        <sphereGeometry args={[rWorld * 1.002, 96, 64]} />
        <meshBasicMaterial map={sh[Math.floor(f / 2) % 3]} transparent opacity={1} depthTest={false} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
};

/** thick ribbon along a centre line (closed or open), rebuilt every frame */
const Strip: React.FC<{pts: [number, number][]; w: number | ((i: number) => number); color: string; z: number; opacity?: number; add?: boolean; closed?: boolean}> = ({pts, w, color, z, opacity = 1, add, closed}) => {
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const n = pts.length, pos: number[] = [], idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], p1 = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let tx = p1[0] - p0[0], ty = p1[1] - p0[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const hw = (typeof w === 'number' ? w : w(i)) / 2;
    pos.push(pts[i][0] - ty * hw, pts[i][1] + tx * hw, 0, pts[i][0] + ty * hw, pts[i][1] - tx * hw, 0);
  }
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) { const a = i * 2, b = ((i + 1) % n) * 2; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  return (
    <mesh geometry={geo} renderOrder={ro(z)} frustumCulled={false}>
      <meshBasicMaterial color={color} transparent opacity={opacity} depthTest={false} depthWrite={false} side={THREE.DoubleSide} fog={false} blending={add ? THREE.AdditiveBlending : THREE.NormalBlending} />
    </mesh>
  );
};

/* ---------- corona ---------- */
const CORONA = (() => {
  const r = rand(5);
  const longS = Array.from({length: 26}, (_, i) => ({a: i * (360 / 26) + r() * 8, r1: 470 + r() * 140, w: 16 + r() * 14, ph: r() * 6}));
  const midS = Array.from({length: 48}, (_, i) => ({a: i * 7.5 + r() * 5, r1: 390 + r() * 110, w: 20 + r() * 16, ph: r() * 6}));
  const shortS = Array.from({length: 80}, (_, i) => ({a: i * 4.5 + r() * 3, r1: 345 + r() * 70, w: 14 + r() * 12, ph: r() * 6}));
  const tinyS = Array.from({length: 110}, (_, i) => ({a: i * (360 / 110) + r() * 2, r1: 318 + r() * 34, w: 8 + r() * 8, ph: r() * 6}));
  return {longS, midS, shortS, tinyS};
})();

const hash = (a: number, b: number) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const Corona: React.FC<{f: number; cx: number; cy: number}> = ({f, cx, cy}) => {
  const fl = (ph: number, k: number) => 1 + k * Math.sin(f * 0.9 + ph * 3) * Math.sin(f * 0.37 + ph);
  const step = Math.floor(f / 2); // limb flames take a new shape every 2 frames
  const jl = (i: number, k: number) => 1 - k + 2 * k * hash(i, step), ja = (i: number) => (hash(i + 0.5, step) - 0.5) * 2.2;
  return (
    <>
      {/* dark maroon halo bands */}
      <Disc x={cx} y={cy} r={575} color={'#240c1c'} z={-3} seg={96} />
      <Disc x={cx} y={cy} r={545} color={'#3a0f16'} z={-2.9} seg={96} />
      <Disc x={cx} y={cy} r={470} color={'#4c1414'} z={-2.8} seg={96} />
      <Disc x={cx} y={cy} r={405} color={'#5f1a12'} z={-2.7} seg={96} />
      <Disc x={cx} y={cy} r={350} color={'#7a2412'} z={-2.6} seg={96} />
      {CORONA.longS.map((s, i) => <P key={i} pts={spike(cx, cy, s.a, 280, s.r1 * fl(s.ph, 0.04), s.w)} color={i % 2 ? '#8e2714' : '#a3321a'} z={-2.5} />)}
      {CORONA.midS.map((s, i) => <P key={i} pts={spike(cx, cy, s.a, 290, 290 + (s.r1 - 290) * fl(s.ph, 0.08) * jl(i + 600, 0.06), s.w)} color={i % 3 ? '#e0541c' : '#c94418'} z={-2.4} />)}
      {CORONA.shortS.map((s, i) => <P key={i} pts={spike(cx, cy, s.a + ja(i), 295, 295 + (s.r1 - 295) * jl(i, 0.22), s.w)} color={i % 2 ? '#f87426' : '#ea6020'} z={-2.3} />)}
      {CORONA.tinyS.map((s, i) => <P key={i} pts={spike(cx, cy, s.a + ja(i + 300), 298, 298 + (s.r1 - 298) * jl(i + 300, 0.3), s.w)} color={i % 2 ? '#ffa236' : '#ff8a2a'} z={-2.2} />)}
    </>
  );
};

/** prominence loop: irregular wobbling ellipse ribbon (glow, body, bright core), drawn behind the sphere so its root is hidden */
const Loop: React.FC<{x: number; y: number; r: number; sy?: number; rot?: number; f: number; a0?: number; a1?: number; seed?: number}> = ({x, y, r, sy = 1, rot = 0, f, a0 = 0, a1 = 360, seed = 1}) => {
  const closed = a1 - a0 >= 360, n = closed ? 72 : 24, cr = Math.cos((rot * Math.PI) / 180), sr = Math.sin((rot * Math.PI) / 180);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / (closed ? n : n - 1)) * Math.PI) / 180;
    const k = 1 + 0.09 * Math.sin(a * 2 + seed) + 0.06 * Math.sin(a * 3 + seed * 2.3) + 0.035 * Math.sin(f * 0.55 + a * 2 + seed);
    const lx = Math.sin(a) * r * k, ly = -Math.cos(a) * r * k * sy;
    pts.push([x + lx * cr - ly * sr, y + lx * sr + ly * cr]);
  }
  const pulse = 1 + 0.04 * Math.sin(f * 0.7 + seed * 1.7);
  const thick = (base: number) => (i: number) => base * pulse * (0.8 + 0.35 * (0.5 + 0.5 * Math.sin(i * 0.35 + seed + f * 0.3)));
  return (
    <>
      <Strip pts={pts} closed={closed} w={thick(46)} color={'#ff7a2a'} z={-2.01} opacity={0.12} add />
      <Strip pts={pts} closed={closed} w={thick(26)} color={'#f2702a'} z={-2.0} />
      <Strip pts={pts} closed={closed} w={thick(15)} color={'#ffb24e'} z={-1.99} />
      <Strip pts={pts} closed={closed} w={thick(5.5)} color={'#fff4c4'} z={-1.98} />
    </>
  );
};

const Backdrop: React.FC<{f: number}> = ({f}) => {
  const d = useMemo(() => {
    const r = rand(29);
    return {
      embers: Array.from({length: 150}, (_, i) => { const a = r() * 6.28, d = i < 110 ? 320 + r() * 260 : r() * 700; return [640 + Math.sin(a) * d * 1.3, 330 - Math.cos(a) * d, 0.9 + r() * 1.8, r() * 6] as const; }),
    };
  }, []);
  const stars = useMemo(() => makeStars({seed: 77, rect: [-20, -120, 1300, 760], tiny: 1100, mid: 120, bright: 18,
    clusters: [[1100, 40, 1280, 250, 160], [0, 450, 200, 700, 160], [1100, 450, 1280, 650, 120]]}), []);
  return (
    <>
      <Rect x0={-100} y0={-200} x1={1380} y1={900} color={BG} z={-5} />
      {/* blue nebula patches at the frame edges */}
      {[[1220, 120, 110], [1180, 170, 90], [1240, 520, 100], [1160, 560, 70], [60, 120, 110], [40, 300, 90], [90, 620, 110], [20, 520, 80]].map(([x, y, rr], i) => (
        <Disc key={i} x={x} y={y} r={rr} sy={0.6} color={'#161d44'} z={-4.5} />
      ))}
      <StarField stars={stars} f={f} z={-4} flares={[[48, 38, 13], [1272, 130, 11], [8, 180, 7]]} />
      {d.embers.map(([x, y, s, ph], i) => <Disc key={'e' + i} x={x + Math.sin(f * 0.05 + ph) * 3} y={y - f * 0.35} r={s * (0.8 + 0.3 * Math.sin(f * 0.5 + ph))} seg={6} color={'#ffad4a'} z={-1.5} opacity={0.5 + 0.35 * Math.sin(f * 0.4 + ph * 2)} />)}
    </>
  );
};

const Scene: React.FC<{f: number; t: number}> = ({f, t}) => {
  const dy = 52 * t; // camera tilts up: everything slides down
  const cx = SUN_X, cy = SUN_Y + dy;
  const trail = 1 + 0.06 * t;
  return (
    <>
      <Cam pos={[drift(f, 3) * 0.01, drift(f, 4) * 0.01, CAM_Z]} look={[drift(f, 3) * 0.01, drift(f, 4) * 0.01, 0]} fov={CAM_FOV} />
      <PixelSpace>
        <group position={[12 * t, dy, 0]}><Backdrop f={f} /></group>
        <Corona f={f} cx={cx} cy={cy} />
        {/* prominence loops (offsets from sun centre) */}
        {([[55, 360, 100, 0.56], [-67, 350, 66, 0.62], [156, 335, 70, 0.6], [-7, 318, 38, 0.7], [100, 312, 34, 0.75]] as const).map(([ang, dist, rr, sq], i) => {
          const q = (ang * Math.PI) / 180;
          return <Loop key={i} seed={i + 1} f={f} x={cx + Math.sin(q) * dist} y={cy - Math.cos(q) * dist} r={rr} sy={sq} rot={ang} />;
        })}
        {/* tendril + blob trail on the left */}
        <Loop f={f} seed={9} x={cx - 330} y={cy - 70} r={120} sy={0.55} rot={-18} a0={190} a1={250} />
        {[[190, 295, 22], [150, 268, 18], [118, 258, 12], [93, 262, 8], [77, 272, 5]].map(([x, y, rr], i) => {
          const bx = cx + (x - 640) * trail, by = cy + (y - 330) - i * 2 * t;
          return (
            <group key={i}>
              <Disc x={bx} y={by} r={rr + 3} color={'#e8581e'} z={-1.9} />
              <Disc x={bx} y={by} r={rr} color={'#ff9a3c'} z={-1.89} />
              <Disc x={bx + rr * 0.1} y={by + rr * 0.1} r={rr * 0.5} color={'#ffe08a'} z={-1.88} />
            </group>
          );
        })}
        {/* bright limb rim, drawn over the sphere */}
        <Ring x={cx} y={cy} r1={SUN_R - 3} r2={SUN_R + 2} color={'#ffd77a'} z={6} />
        <Ring x={cx} y={cy} r1={SUN_R - 14} r2={SUN_R - 3} color={'#ff9a3a'} z={6} opacity={0.35} />
        {/* small dark planet bottom-left + rocks */}
        <group position={[12 * t, dy, 0]}>
          <Disc x={130} y={552} r={32} color={'#e07a34'} z={7} />
          <Disc x={124} y={552} r={30} color={'#4a2a20'} z={7.01} />
          {[[118, 545, 4], [132, 565, 3], [110, 562, 2.5]].map(([x, y, rr], i) => <Disc key={i} x={x} y={y} r={rr} color={'#2c1812'} z={7.02} />)}
          {[[175, 612, 5], [190, 615, 4], [1105, 600, 7], [1205, 625, 6], [1125, 652, 4], [40, 80, 4]].map(([x, y, rr], i) => <P key={i} z={7} color={'#8a4a2a'} pts={[[x - rr, y], [x, y - rr], [x + rr, y + rr * 0.3], [x, y + rr]]} />)}
        </group>
      </PixelSpace>
      <SunBall f={f} dy={dy} />
      <Post focus={[0, 0, 0]} blur={0} />
    </>
  );
};

export const sunShot: ShotDef = {id: 'sun', len: 34, bg: BG, Scene};
