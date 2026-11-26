import React, {useMemo} from 'react';
import type {ShotDef} from './types';
import {Cam, keys, outBack, inOut, drift} from '../three/stage';
import {Post} from '../three/Post';
import * as THREE from 'three';
import {PixelSpace, CAM_Z, CAM_FOV, rand, ro, Disc, Ring, P, Rect, Dia, spike, clipCircle} from './flat2d';
import {makeStars, StarField, makeNebula, Nebula, type NebSpec} from './space';

/* Shot "earth" = ref frames 0-46. Flat 2D space backdrop (static), Earth scales in from a dot (f0-12, overshoot),
   throne drops onto it (f13-16) and two cream cloud puffs burst sideways from its base (f16-36). */

type Pt = [number, number];
const BG = '#0a0d22';
const NEBS: NebSpec[] = [
  {x0: 395, y0: 35, x1: 635, y1: 150, c: ['#211c4f', '#262058', '#2b2461'], drift: [5, 0]},
  {x0: 145, y0: 180, x1: 440, y1: 340, c: ['#191d4a', '#1d2252', '#22275a'], drift: [-3, 0]},
  {x0: 470, y0: 270, x1: 880, y1: 510, c: ['#151a40', '#191e48', '#1d2250'], drift: [2, 0]},
  {x0: 675, y0: 465, x1: 1010, y1: 650, c: ['#221b50', '#271f59', '#2c2462'], drift: [4, 0]},
  {x0: 1015, y0: 238, x1: 1240, y1: 352, c: ['#16234a', '#1a2852', '#1f2e5a'], drift: [-4, 0]},
  {x0: -10, y0: 552, x1: 250, y1: 690, c: ['#152044', '#19254c', '#1d2a54'], drift: [-9, 0]},
];
const FLARES: [number, number, number][] = [[80, 93, 9], [830, 54, 7], [527, 143, 5], [1255, 538, 10], [1010, 333, 6], [360, 640, 7], [1196, 72, 5]];

/** gibbous lit part of the moon: disc A (r, centre 0) intersected with disc B (rB, centre +d) */
const lens = (r: number, d: number, rB: number): Pt[] => {
  const al = Math.acos((r * r + d * d - rB * rB) / (2 * r * d)), tb = Math.acos((r * r - d * d - rB * rB) / (2 * d * rB));
  const pts: Pt[] = [];
  for (let i = 0; i <= 40; i++) { const a = -al + (2 * al * i) / 40; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  for (let i = 0; i <= 40; i++) { const a = tb + ((2 * Math.PI - 2 * tb) * i) / 40; pts.push([d + Math.cos(a) * rB, Math.sin(a) * rB]); }
  return pts;
};
const MOON_LIT = lens(31, 9, 31);
const CRATERS: [number, number, number][] = [[0.25, 0.45, 6], [-0.25, -0.2, 7], [0.55, -0.35, 5], [-0.05, 0.4, 4.5], [0.2, -0.65, 4], [0.75, 0.2, 4.5], [-0.6, 0.1, 4], [1.1, -0.1, 5], [1.5, 0.3, 6]];

const Backdrop: React.FC<{f: number; t: number}> = ({f, t}) => {
  const stars = useMemo(() => makeStars({seed: 7, tiny: 1500, mid: 200, bright: 60,
    clusters: NEBS.map((n) => [n.x0 + 20, n.y0 + 10, n.x1 - 20, n.y1 - 10, Math.round((n.x1 - n.x0) * 0.5)] as [number, number, number, number, number])}), []);
  const nebs = useMemo(() => NEBS.map((n, i) => makeNebula(n, 31 + i)), []);
  const sunRot = 8 + 10 * t, mrot = 0.3 * t;
  return (
    <>
      <Rect x0={-100} y0={-100} x1={1380} y1={820} color={BG} z={-5} />
      {NEBS.map((n, i) => <Nebula key={i} n={n} d={nebs[i]} t={t} z={-4 + i * 0.01} />)}
      <StarField stars={stars} f={f} z={-3} flares={FLARES} />
      {/* little sun icon: rays turn slowly, core pulses */}
      <group>
        <Disc x={1022} y={152} r={40} color={'#ffb04a'} z={-2.52} opacity={0.06} add />
        {Array.from({length: 16}, (_, i) => <P key={i} pts={spike(1022, 152, i * 22.5 + sunRot, 24, (i % 2 ? 46 : 70) * (1 + 0.03 * Math.sin(f * 0.4 + i)), i % 2 ? 1.6 : 2.1)} color={'#f2a13c'} z={-2.5} />)}
        <Disc x={1022} y={152} r={29} color={'#f39a2e'} z={-2.4} />
        <Disc x={1022} y={152} r={22.5} color={'#ffd77a'} z={-2.39} />
        <Disc x={1022} y={152} r={17 + 0.8 * Math.sin(f * 0.3)} color={'#fff2c6'} z={-2.38} />
      </group>
      {/* moon: dark blue body, gibbous lit part, craters rotating with the moon */}
      <group position={[360 - 4 * t, 272, 0]}>
        <Disc x={0} y={0} r={36} color={'#c8d0ff'} z={-2.52} opacity={0.06} add />
        <Disc x={0} y={0} r={31} color={'#3b4479'} z={-2.5} />
        <P pts={MOON_LIT} color={'#dddacb'} z={-2.49} />
        {CRATERS.map(([lon, lat, rr], i) => {
          const l = lon - mrot, cx = Math.sin(l) * Math.cos(lat) * 27 + 3, cy = -Math.sin(lat) * 27, k = Math.cos(l);
          if (k < 0.15 || cx < -20) return null;
          return (
            <group key={i}>
              <Disc x={cx} y={cy} r={rr} sy={1} color={'#b3ae9d'} z={-2.48} />
              <Disc x={cx + rr * 0.15} y={cy + rr * 0.15} r={rr * 0.72} color={'#c8c4b3'} z={-2.47} />
            </group>
          );
        })}
      </group>
      {/* comet: drifts right, tail shimmers */}
      <group position={[10 * t, 2 * t, 0]}>
        <P pts={[[245, 157], [245 - 106 * (1 + 0.05 * Math.sin(f * 0.9)), 187], [245, 169]]} color={'#3a5fc4'} z={-2.5} />
        <P pts={[[245, 158.5], [245 - 72 * (1 + 0.06 * Math.sin(f * 1.3 + 1)), 179], [245, 166.5]]} color={'#8fb4ff'} z={-2.49} />
        <P pts={[[245, 160.5], [245 - 40 * (1 + 0.08 * Math.sin(f * 1.7 + 2)), 172], [245, 165]]} color={'#d4e3ff'} z={-2.485} />
        <Disc x={246} y={163} r={10} color={'#fff1c0'} z={-2.48} opacity={0.08 + 0.03 * Math.sin(f * 0.8)} add />
        <Disc x={246} y={163} r={6} color={'#fff8e2'} z={-2.47} />
      </group>
      {/* ringed planet: drifts left (nearer layer), ring tilt changes slowly */}
      <group position={[152 - 15 * t, 568, 0]}>
        <Ring x={0} y={0} r1={42} r2={48} a0={-90} a1={90} sy={0.22} rot={-10 - 5 * t} color={'#e9d6b4'} z={-2.5} />
        <Disc x={0} y={0} r={22} color={'#c98656'} z={-2.45} />
        {[-13, -6, 2, 9, 16].map((dy, i) => <Rect key={i} x0={-Math.sqrt(484 - dy * dy) + 1} x1={Math.sqrt(484 - dy * dy) - 1} y0={dy - 1.5} y1={dy + 1.5} color={i % 2 ? '#a96a46' : '#e3ab7c'} z={-2.44} />)}
        <P pts={clipCircle(22, [8, -30], [6, 60])} color={'#3b2a3a'} opacity={0.3} z={-2.43} />
        <Ring x={0} y={0} r1={42} r2={48} a0={90} a1={270} sy={0.22} rot={-10 - 5 * t} color={'#f3e3c4'} z={-2.4} />
      </group>
    </>
  );
};

/* ---------------- Earth (local px around its centre, outer radius 200) ---------------- */
const Z = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x / 2 - 220, y / 2 - 215]); // traced on a 2x zoom of the ref frame
const EURASIA = Z([[510, 88], [600, 92], [680, 128], [740, 190], [772, 262], [792, 350], [786, 420], [760, 452], [745, 498], [716, 452], [690, 440], [620, 442], [560, 416], [510, 432], [470, 396], [420, 372], [380, 386], [330, 356], [300, 362], [262, 356], [250, 322], [298, 312], [306, 280], [300, 250], [330, 232], [380, 242], [440, 250], [480, 232], [490, 180], [500, 120]]);
const SCAND = Z([[370, 180], [440, 166], [452, 198], [420, 216], [380, 212]]);
const STEPPE = Z([[565, 238], [700, 212], [722, 300], [640, 352], [560, 330]]);
const AFRICA = Z([[250, 376], [345, 376], [347, 396], [440, 410], [470, 436], [522, 452], [540, 520], [602, 545], [562, 600], [532, 652], [512, 722], [470, 762], [420, 766], [372, 732], [330, 672], [310, 600], [240, 582], [190, 540], [174, 470], [190, 420]]);
const SAHARA = Z([[232, 420], [380, 412], [440, 470], [380, 502], [262, 492]]);
const CONGO = Z([[330, 612], [450, 600], [492, 642], [470, 692], [400, 702], [340, 682]]);
const MADA = Z([[562, 700], [588, 688], [566, 732], [548, 726]]);
const CLOUDS: [number, number, number][] = [ // zoom x, zoom y, width(zoom)
  [320, 138, 120], [235, 218, 60], [410, 256, 100], [615, 205, 70], [575, 250, 70], [620, 285, 80], [720, 272, 70], [728, 410, 40], [360, 488, 90], [210, 592, 80], [740, 585, 70], [110, 495, 40], [170, 290, 25],
];

/* The globe is a real sphere: the traced front view above is inverse-projected onto an equirectangular canvas
   (u = 0.25 faces the camera at spin 0), painted with facets, trees, rivers; a second slightly larger sphere carries
   the clouds and turns a little faster. Rim rings, the hard night-side band and the highlights stay fixed (pixel space). */
const R0 = 177;
const TILT = new THREE.Euler(0.3, 0, 0.14);
const INV_TILT = new THREE.Matrix4().makeRotationFromEuler(TILT).invert();
const TW = 2048, TH = 1024;
const toUV = (x: number, y: number): Pt => {
  let px = x / R0, py = -y / R0; const l = Math.hypot(px, py); if (l > 0.985) { px *= 0.985 / l; py *= 0.985 / l; }
  const v = new THREE.Vector3(px, py, Math.sqrt(Math.max(0, 1 - px * px - py * py))).applyMatrix4(INV_TILT);
  const lon = Math.atan2(v.x, v.z), lat = Math.asin(THREE.MathUtils.clamp(v.y, -1, 1));
  return [(0.25 + lon / (2 * Math.PI)) * TW, (0.5 - lat / Math.PI) * TH];
};
const ll = (lon: number, lat: number): Pt => [(0.25 + lon / 360) * TW, (0.5 - lat / 180) * TH];
const dens = (pts: Pt[], n = 6): Pt[] => pts.flatMap(([x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return Array.from({length: n}, (_, k) => [x + ((x2 - x) * k) / n, y + ((y2 - y) * k) / n] as Pt); });
const proj = (pts: Pt[]) => dens(pts).map(([x, y]) => toUV(x, y));
// back-side land (lon/lat in the texture frame) so the left limb is not empty while the globe turns
const AMERICA_N: Pt[] = [[-150, 62], [-120, 68], [-95, 60], [-75, 52], [-62, 47], [-78, 35], [-82, 26], [-97, 20], [-105, 24], [-118, 34], [-125, 48], [-140, 58]].map(([a, b]) => ll(a, b));
const AMERICA_S: Pt[] = [[-80, 10], [-62, 9], [-38, -6], [-40, -22], [-58, -38], [-68, -54], [-74, -45], [-72, -18], [-81, -4]].map(([a, b]) => ll(a, b));
const GREEN_T = ['#78a450', '#729f4c', '#7fa956', '#749f4d', '#83ad5a'], TAN_T = ['#c9a24f', '#c19a49', '#cfa955', '#bd9445', '#c59e4c'];

const makeEarthTex = () => {
  const c = document.createElement('canvas'); c.width = TW; c.height = TH;
  const g = c.getContext('2d')!; const r = rand(101);
  g.fillStyle = '#2f6cb7'; g.fillRect(0, 0, TW, TH);
  // ocean facets + faint wave streaks
  for (let i = 0; i < 260; i++) {
    const x = r() * TW, y = r() * TH, sz = 60 + r() * 140;
    g.fillStyle = r() > 0.5 ? '#3373bd' : '#2b65ae'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + sz, y + (r() - 0.5) * sz); g.lineTo(x + (r() - 0.5) * sz, y + sz); g.closePath(); g.fill();
  }
  g.strokeStyle = 'rgba(160,200,245,0.35)'; g.lineWidth = 1.4;
  for (let i = 0; i < 220; i++) { const x = r() * TW, y = r() * TH; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8 + r() * 10, y - 3 - r() * 3); g.stroke(); }
  const path = (pts: Pt[]) => { g.beginPath(); pts.forEach(([u, v], i) => (i ? g.lineTo(u, v) : g.moveTo(u, v))); g.closePath(); };
  const land = (pts: Pt[], tones: string[], facetN: number, deco: 'tree' | 'hill' | null, decoN: number, rivers = 0) => {
    if (tones.length) { path(pts); g.fillStyle = tones[0]; g.fill(); }
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const bx = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    g.save(); path(pts); g.clip();
    for (let i = 0; i < facetN; i++) {
      const x = bx[0] + r() * (bx[2] - bx[0]), y = bx[1] + r() * (bx[3] - bx[1]), sz = 60 + r() * 120;
      g.fillStyle = tones[1 + Math.floor(r() * (tones.length - 1))];
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + sz * (0.4 + r()), y + (r() - 0.3) * sz); g.lineTo(x + (r() - 0.5) * sz, y + sz * (0.5 + r() * 0.6)); g.closePath(); g.fill();
    }
    g.restore();
    path(pts);
    for (let i = 0, n = 0; i < decoN * 6 && n < decoN; i++) {
      const x = bx[0] + r() * (bx[2] - bx[0]), y = bx[1] + r() * (bx[3] - bx[1]);
      if (!g.isPointInPath(x, y)) continue; n++;
      const k = 0.8 + r() * 0.6;
      if (deco === 'tree') {
        for (let j = 0; j < 3; j++) { const ox = x + j * 5 * k, oy = y + (j % 2) * 2;
          g.fillStyle = '#2f5a2e'; g.beginPath(); g.moveTo(ox, oy - 6 * k); g.lineTo(ox + 2.6 * k, oy + 1); g.lineTo(ox - 2.6 * k, oy + 1); g.closePath(); g.fill();
          g.fillStyle = '#e9f2e0'; g.fillRect(ox - 0.8, oy - 6.5 * k, 1.6, 1.8); }
      } else if (deco === 'hill') {
        g.fillStyle = '#7d6230'; g.beginPath(); g.moveTo(x, y - 7 * k); g.lineTo(x + 5 * k, y + 1); g.lineTo(x - 5 * k, y + 1); g.closePath(); g.fill();
        g.fillStyle = '#f2ead6'; g.beginPath(); g.moveTo(x, y - 7 * k); g.lineTo(x + 1.8 * k, y - 4.4 * k); g.lineTo(x - 1.8 * k, y - 4.4 * k); g.closePath(); g.fill();
      }
      path(pts);
    }
    g.strokeStyle = '#5b8fcf'; g.lineWidth = 1.6;
    for (let i = 0; i < rivers; i++) {
      let x = bx[0] + (0.2 + r() * 0.6) * (bx[2] - bx[0]), y = bx[1] + (0.2 + r() * 0.6) * (bx[3] - bx[1]);
      g.save(); path(pts); g.clip(); g.beginPath(); g.moveTo(x, y);
      for (let j = 0; j < 7; j++) { x += (r() - 0.5) * 40; y += 12 + r() * 18; g.lineTo(x, y); }
      g.stroke(); g.restore();
    }
  };
  land(AMERICA_N, GREEN_T, 60, 'tree', 25, 2);
  land(AMERICA_S, GREEN_T, 50, 'tree', 20, 2);
  land(proj(EURASIA), GREEN_T, 40, null, 0, 0);
  land(proj(STEPPE), ['#a9a55a', '#b4ab62', '#9c9a52'], 20, null, 0);
  land(proj(SCAND), GREEN_T, 10, 'tree', 6);
  land(proj(EURASIA), [], 0, 'tree', 70, 5); // decoration pass only (no fill)
  land(proj(AFRICA), TAN_T, 25, 'hill', 14, 2);
  land(proj(SAHARA), ['#d8b866', '#cfae5c', '#e0c172'], 14, null, 0);
  land(proj(CONGO), ['#5f8f3e', '#557f37', '#6a9a45'], 16, 'tree', 10);
  land(proj(MADA), GREEN_T, 2, null, 0);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
};
const makeCloudTex = () => {
  const c = document.createElement('canvas'); c.width = TW; c.height = TH;
  const g = c.getContext('2d')!; const r = rand(202);
  const lump = (u: number, v: number, w: number, h: number) => {
    g.fillStyle = 'rgba(180,195,222,0.95)'; g.beginPath(); g.ellipse(u + w * 0.05, v + h * 0.35, w * 0.55, h * 0.45, 0, 0, 7); g.fill();
    g.fillStyle = '#f8faff';
    [[0, 0, 0.5, 0.42], [-0.28, -0.12, 0.3, 0.4], [0.25, -0.08, 0.32, 0.38], [0.05, -0.3, 0.26, 0.32]].forEach(([dx, dy, rx, ry]) => {
      g.beginPath(); g.ellipse(u + dx * w, v + dy * h, rx * w, ry * h, 0, 0, 7); g.fill();
    });
  };
  CLOUDS.forEach(([zx, zy, w]) => {
    const x = zx / 2 - 220, y = zy / 2 - 215, [u, v] = toUV(x, y);
    const du = Math.min(6, Math.abs(toUV(x + 2, y)[0] - toUV(x - 2, y)[0]) / 4), dv = Math.min(6, Math.abs(toUV(x, y + 2)[1] - toUV(x, y - 2)[1]) / 4);
    lump(u, v, (w / 2) * du * 1.1, (w / 2) * 0.42 * dv * 1.1);
  });
  for (let i = 0; i < 70; i++) { const u = r() * TW, v = TH * (0.15 + r() * 0.7); if (u > TW * 0.12 && u < TW * 0.4) continue; lump(u, v, 30 + r() * 60, 12 + r() * 16); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
};

const Globe: React.FC<{cy: number; s: number; spin: number; roll: number}> = ({cy, s, spin, roll}) => {
  const ground = useMemo(makeEarthTex, []), clouds = useMemo(makeCloudTex, []);
  const R = (R0 * s) / 100, rW = R / Math.sqrt(1 + (R / CAM_Z) ** 2);
  return (
    <group position={[0, (360 - cy) / 100, 0]} rotation={[0, 0, roll]}>
      <group rotation={TILT}>
        <mesh rotation={[0, spin, 0]} renderOrder={ro(0.04)}>
          <sphereGeometry args={[rW, 96, 64]} />
          <meshBasicMaterial map={ground} transparent depthTest={false} depthWrite={false} fog={false} />
        </mesh>
        <mesh rotation={[0, spin * 1.35 + 0.01, 0]} renderOrder={ro(0.045)}>
          <sphereGeometry args={[rW * 1.004, 96, 64]} />
          <meshBasicMaterial map={clouds} transparent depthTest={false} depthWrite={false} fog={false} />
        </mesh>
      </group>
    </group>
  );
};

const EarthRims: React.FC<{cx: number; cy: number; s: number; back: boolean}> = ({cx, cy, s, back}) => {
  const shadow = useMemo(() => clipCircle(178, [-120, -90], [165, 245]), []);
  return (
    <group position={[cx, cy, 0]} scale={[s, s, 1]}>
      {back ? (
        <>
          <Disc x={0} y={0} r={201} color={'#1d3685'} z={0} seg={96} />
          <Disc x={0} y={0} r={193} color={'#3f78d6'} z={0.01} seg={96} />
          <Disc x={0} y={0} r={187} color={'#79b8f0'} z={0.02} seg={96} />
          <Disc x={0} y={0} r={180} color={'#2f6cb7'} z={0.03} seg={96} />
        </>
      ) : (
        <>
          {/* fixed night band (hard edge, as in the ref) + inner atmosphere glow + rim highlights */}
          <P pts={shadow} color={'#06123a'} z={0.1} opacity={0.34} />
          <Ring x={0} y={0} r1={172} r2={180} color={'#9fd0ff'} z={0.105} opacity={0.22} />
          <Ring x={0} y={0} r1={170} r2={177} a0={120} a1={160} color={'#cfe6ff'} z={0.11} opacity={0.7} />
          <Ring x={0} y={0} r1={168} r2={176} a0={30} a1={55} color={'#e3f0ff'} z={0.11} opacity={0.5} />
        </>
      )}
    </group>
  );
};

/* ---------------- Throne (flat, local px; origin = bottom centre of the lower step) ---------------- */
const CREAM = '#f6edd2', CREAM2 = '#e7dbb6', GOLD = '#e2b850', GOLDL = '#f3d68a', GREEN = '#3c9c4c', GREEN2 = '#2a7a3a';
const T = (x: number, y: number): Pt => [x - 640, y - 337]; // ref px -> local
const TR = (x0: number, y0: number, x1: number, y1: number, color: string, z: number) => <P pts={[T(x0, y0), T(x1, y0), T(x1, y1), T(x0, y1)]} color={color} z={z} />;

const Halo: React.FC<{f: number}> = ({f}) => {
  const [hx, hy] = T(640, 213);
  const segs = [-155, -124, -93, -62, -31, 0, 31, 62, 93, 124, 155];
  return (
    <group rotation={[0, 0, Math.sin(f * 0.05) * 0.02]} position={[hx, hy, 0]}>
      {segs.map((a, i) => <Ring key={i} x={0} y={0} r1={83} r2={92} a0={a - 11} a1={a + 11} color={GOLDL} z={-1} />)}
      {segs.map((a, i) => <Ring key={'i' + i} x={0} y={0} r1={71} r2={75} a0={a + 4} a1={a + 26} color={GOLDL} z={-1} />)}
      {[-136, -106, -78, -46, -15, 15, 46, 78, 106, 136].map((a, i) => <P key={i} pts={spike(0, 0, a, 96, 114, 6.5)} color={GOLDL} z={-1} />)}
    </group>
  );
};

const Throne: React.FC<{f: number}> = ({f}) => (
  <group>
    <Halo f={f} />
    {/* spires */}
    {[[593, 605], [675, 687]].map(([a, b], i) => (
      <group key={i}>{TR(a, 168, b, 200, CREAM, 0.3)}<P pts={[T(a, 172), T(b, 172), T((a + b) / 2, 149)]} color={GOLD} z={0.31} /></group>
    ))}
    {/* pediment + gold ring */}
    <P pts={[T(597, 196), T(683, 196), T(640, 171)]} color={CREAM} z={0.3} />
    <Ring x={0} y={187 - 337} r1={3.5} r2={7} color={GOLD} z={0.32} />
    {TR(589, 195, 691, 201, GOLD, 0.33)}
    {/* back + panel */}
    {TR(597, 201, 683, 322, CREAM, 0.3)}
    {TR(604, 206, 676, 291, GOLD, 0.31)}
    {TR(608, 210, 672, 284, GREEN, 0.32)}
    {TR(608, 284, 672, 291, GREEN2, 0.32)}
    {[227, 246, 265].map((y) => [617, 628, 652, 663].map((x) => <Dia key={`${x}${y}`} x={x - 640} y={y - 337} w={3.2} h={5.5} color={'#f6e7ae'} z={0.33} />))}
    {/* seat + arms */}
    {TR(600, 291, 680, 322, CREAM2, 0.34)}
    {[[582, 603, 592], [677, 698, 688]].map(([a, b, c], i) => (
      <group key={i}>{TR(a, 258, b, 322, CREAM, 0.35)}{TR(a + 4, 270, b - 4, 316, CREAM2, 0.36)}<Disc x={c - 640} y={257 - 337} r={10.5} color={GOLD} z={0.37} /></group>
    ))}
    {/* carpet */}
    {TR(622, 296, 658, 337, GOLD, 0.38)}
    {TR(626, 297, 654, 337, GREEN, 0.39)}
    {/* steps */}
    {TR(566, 319, 714, 328, CREAM, 0.37)}
    {TR(546, 327, 734, 337, CREAM2, 0.36)}
    {TR(546, 327, 734, 329, '#fbf5e2', 0.365)}
  </group>
);

/* ---------------- cloud puffs (cream), emitted sideways from the throne base ---------------- */
const PUFFS = (() => { const r = rand(3); return Array.from({length: 7}, (_, i) => ({sp: 0.5 + r() * 0.8, y: -10 - r() * 40, rr: 20 + r() * 16, lag: r() * 0.15, i})); })();
const Puffs: React.FC<{f: number}> = ({f}) => {
  const p = (f - 15) / 23;
  if (p <= 0 || p >= 1) return null;
  return (
    <>
      {[-1, 1].map((k) => PUFFS.map((q) => {
        const u = Math.max(0, (p - q.lag) / (1 - q.lag));
        const env = u < 0.28 ? outBack(u / 0.28, 1.2) : Math.max(0, 1 - Math.pow((u - 0.28) / 0.72, 1.7));
        const out = 1 - Math.pow(1 - u, 2.2);
        const x = k * (55 + q.sp * 175 * out), y = q.y * (1 - 0.3 * out) - 4;
        const r = q.rr * env * (1 - 0.35 * u);
        if (r < 0.5) return null;
        return (
          <group key={`${k}${q.i}`}>
            <Disc x={x} y={y + r * 0.18} r={r} color={'#d5c39b'} z={0.5 + q.i * 0.002} />
            <Disc x={x - r * 0.12} y={y - r * 0.08} r={r * 0.88} color={'#efe4c6'} z={0.501 + q.i * 0.002} />
          </group>
        );
      }))}
    </>
  );
};

const Scene: React.FC<{f: number; t: number}> = ({f, t}) => {
  // earth: dot at f0 -> full at f9, overshoot f12, settles; slides down a little while the throne lands
  const s = keys(f, [[0, 0.02], [3, 0.2], [6, 0.6], [9, 1.0], [12, 1.05], [16, 1.0]], inOut);
  const cy = keys(f, [[0, 492], [13, 490], [16, 508]], inOut);
  const drop = keys(f, [[13, -215], [15, 0]], (x) => x * (0.6 + 0.4 * x));
  const squash = f >= 15 ? 1 - 0.07 * Math.exp(-(f - 15) / 2.5) * Math.cos((f - 15) * 0.9) : 1;
  const baseY = cy - 168 + drop;
  const push = 1 + 0.01 * t;
  // globe turns: fast while it pops in, then ~0.0025 rad/frame (measured on the Africa horn, ref f16-46)
  const settle = inOut((f - 2) / 12);
  const spin = -0.0025 * (46 - f) - 0.42 * (1 - settle), roll = 0.1 * (1 - settle);
  return (
    <>
      <Cam pos={[drift(f, 1) * 0.01, drift(f, 2) * 0.01, CAM_Z / push]} look={[drift(f, 1) * 0.01, drift(f, 2) * 0.01, 0]} fov={CAM_FOV} />
      <PixelSpace>
        <Backdrop f={f} t={t} />
        <EarthRims cx={640} cy={cy} s={s} back />
        <EarthRims cx={640} cy={cy} s={s} back={false} />
        {f >= 13 && (
          <group position={[640, baseY, 0]} scale={[1 / squash, squash, 1]}>
            <Throne f={f} />
            <Puffs f={f} />
          </group>
        )}
      </PixelSpace>
      <Globe cy={cy} s={s} spin={spin} roll={roll} />
      <Post focus={[0, 0, 0]} blur={0} />
    </>
  );
};

export const earthShot: ShotDef = {id: 'earth', len: 47, bg: BG, Scene};
