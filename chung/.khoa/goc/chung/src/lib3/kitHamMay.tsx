import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rnd, P, Ctx, Sprite} from './depth';
import {B} from './kit';
import {tex} from './kitLab';
import {Halo} from './look';
import {Arc} from './fx';
import {paintPlanks} from './kitCamp';

/** lib3/kitHamMay (23/11/2026): the pieces of DOOM'S WORKSHOP under the castle (src/demo/HamMayDoom.tsx; chapters 10, 11, 12): steel and green and orange,
 *  tanks, pipes, gears, a furnace, a crane, a rack where robots are put together, rows of robots, a time machine, a draining machine.
 *  Cut paper: flat panels with sharp edges, two or three tones; metres, y up. */
type V3 = [number, number, number];
const shade = (hex: string, k: number) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();

// ---------------------------------------------------------------- painted pieces
/** a robot standing, front view, Doom's own build in cut paper: green hood, iron mask, shoulders with a gold clasp, a cloak, grey armour; eyes = two green points
 *  (`on`) or dark sockets; `open` = the chest plate swung open on the right, gears and an orange glow inside; `head` false = no head (a body on the rack). */
export const paintRobot = (o: {on?: boolean; open?: boolean; broken?: boolean} = {}) => (c: Ctx, W: number, H: number) => {
  c.clearRect(0, 0, W, H); const s = W / 100, x = (v: number) => v * s, y = (v: number) => v * s;
  const cx = 50;
  // cloak behind, legs, boots
  P(c, [[x(cx - 34), y(52)], [x(cx + 34), y(52)], [x(cx + 44), y(176)], [x(cx - 44), y(176)]], '#1f5a2c'); P(c, [[x(cx), y(52)], [x(cx + 34), y(52)], [x(cx + 44), y(176)], [x(cx + 6), y(176)]], '#17441f');
  P(c, [[x(cx - 20), y(118)], [x(cx - 4), y(118)], [x(cx - 5), y(170)], [x(cx - 24), y(170)]], '#a8adb3'); P(c, [[x(cx + 4), y(118)], [x(cx + 20), y(118)], [x(cx + 24), y(170)], [x(cx + 5), y(170)]], '#8a9096');
  P(c, [[x(cx - 27), y(170)], [x(cx - 3), y(170)], [x(cx - 2), y(182)], [x(cx - 29), y(182)]], '#3a3d44'); P(c, [[x(cx + 3), y(170)], [x(cx + 27), y(170)], [x(cx + 29), y(182)], [x(cx + 2), y(182)]], '#2c2f35');
  // tunic and belt
  P(c, [[x(cx - 24), y(70)], [x(cx + 24), y(70)], [x(cx + 28), y(120)], [x(cx - 28), y(120)]], '#2f8a45'); P(c, [[x(cx), y(70)], [x(cx + 24), y(70)], [x(cx + 28), y(120)], [x(cx), y(120)]], '#26733a');
  c.fillStyle = '#6a4424'; c.fillRect(x(cx - 28), y(104), x(56), y(7)); c.fillStyle = '#dcae3a'; c.fillRect(x(cx - 6), y(103), x(12), y(9));
  // chest plate
  const plate = o.open ? '#6a717a' : '#b3bfcc';
  P(c, [[x(cx - 22), y(60)], [x(cx + 22), y(60)], [x(cx + 20), y(96)], [x(cx - 20), y(96)]], '#4f5966');
  if (o.open) {
    P(c, [[x(cx - 17), y(64)], [x(cx + 17), y(64)], [x(cx + 15), y(92)], [x(cx - 15), y(92)]], '#1a1c20'); c.fillStyle = '#ff9a3a'; c.fillRect(x(cx - 10), y(72), x(20), y(14));
    [[cx - 6, 78, 7], [cx + 6, 80, 5]].forEach(([gx, gy, gr]) => { c.fillStyle = '#9aa0a8'; c.beginPath(); c.arc(x(gx), y(gy), x(gr), 0, 7); c.fill(); c.fillStyle = '#1a1c20'; c.beginPath(); c.arc(x(gx), y(gy), x(gr * 0.4), 0, 7); c.fill(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.fillStyle = '#9aa0a8'; c.fillRect(x(gx + Math.cos(a) * gr) - 2, y(gy + Math.sin(a) * gr) - 2, 4, 4); } });
    c.strokeStyle = '#c8402a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x(cx - 14), y(66)); c.quadraticCurveTo(x(cx - 20), y(80), x(cx - 12), y(90)); c.stroke(); c.strokeStyle = '#2f6ac8'; c.beginPath(); c.moveTo(x(cx + 14), y(66)); c.quadraticCurveTo(x(cx + 20), y(78), x(cx + 10), y(90)); c.stroke();
    P(c, [[x(cx + 17), y(64)], [x(cx + 36), y(56)], [x(cx + 34), y(98)], [x(cx + 15), y(92)]], plate); P(c, [[x(cx + 17), y(64)], [x(cx + 36), y(56)], [x(cx + 30), y(70)]], '#8a929c');
  } else { P(c, [[x(cx - 20), y(62)], [x(cx + 20), y(62)], [x(cx + 18), y(94)], [x(cx - 18), y(94)]], plate); P(c, [[x(cx), y(62)], [x(cx + 20), y(62)], [x(cx + 18), y(94)], [x(cx), y(94)]], '#8e99a6'); c.fillStyle = '#4f5966'; c.fillRect(x(cx - 1), y(62), x(2), y(32)); }
  // shoulders (mantle) and arms
  P(c, [[x(cx - 46), y(54)], [x(cx - 22), y(52)], [x(cx - 24), y(68)], [x(cx - 44), y(72)]], '#2a7a3c'); P(c, [[x(cx + 22), y(52)], [x(cx + 46), y(54)], [x(cx + 44), y(72)], [x(cx + 24), y(68)]], '#206030');
  P(c, [[x(cx - 44), y(70)], [x(cx - 28), y(70)], [x(cx - 30), y(118)], [x(cx - 42), y(118)]], '#a8adb3'); P(c, [[x(cx + 28), y(70)], [x(cx + 44), y(70)], [x(cx + 42), y(118)], [x(cx + 30), y(118)]], '#8a9096');
  P(c, [[x(cx - 43), y(118)], [x(cx - 29), y(118)], [x(cx - 31), y(130)], [x(cx - 41), y(130)]], '#d5d9dc'); P(c, [[x(cx + 29), y(118)], [x(cx + 43), y(118)], [x(cx + 41), y(130)], [x(cx + 31), y(130)]], '#d5d9dc');
  c.fillStyle = '#dcae3a'; c.fillRect(x(cx - 16), y(56), x(5), y(5)); c.fillRect(x(cx + 11), y(56), x(5), y(5));
  // hood and mask
  P(c, [[x(cx - 20), y(58)], [x(cx - 22), y(28)], [x(cx), y(8)], [x(cx + 22), y(28)], [x(cx + 20), y(58)]], '#2f7a3d'); P(c, [[x(cx), y(8)], [x(cx + 22), y(28)], [x(cx + 20), y(58)], [x(cx), y(58)]], '#1e5529');
  P(c, [[x(cx - 15), y(22)], [x(cx), y(18)], [x(cx + 15), y(22)], [x(cx + 14), y(48)], [x(cx + 7), y(56)], [x(cx - 7), y(56)], [x(cx - 14), y(48)]], o.broken ? '#8a929c' : '#b3bfcc'); P(c, [[x(cx), y(18)], [x(cx + 15), y(22)], [x(cx + 14), y(48)], [x(cx + 7), y(56)], [x(cx), y(56)]], '#8892a0');
  c.fillStyle = '#16181c'; c.fillRect(x(cx - 12), y(30), x(9), y(4)); c.fillRect(x(cx + 3), y(30), x(9), y(4)); c.fillRect(x(cx - 5), y(48), x(10), y(3));
  if (o.on) { c.fillStyle = '#6dff98'; c.fillRect(x(cx - 11), y(30.4), x(7), y(3.2)); c.fillRect(x(cx + 4), y(30.4), x(7), y(3.2)); }
  c.fillStyle = '#5a6470'; [[-11, 24], [11, 24], [-9, 50], [9, 50]].forEach(([dx, dy]) => { c.beginPath(); c.arc(x(cx + dx), y(dy), x(1.1), 0, 7); c.fill(); });
};
export const paintGear = (teeth: number, body: string, hole: string, seed = 1) => (c: Ctx, W: number, H: number) => {
  c.clearRect(0, 0, W, H); const cx = W / 2, R = W * 0.44, r = W * 0.36, r2 = rnd(seed);
  c.fillStyle = shade(body, 0.7); c.beginPath(); for (let i = 0; i < teeth; i++) { const a = (i / teeth) * 6.2832, b = ((i + 0.5) / teeth) * 6.2832; [[a - 0.06, r], [a + 0.04, R], [b - 0.04, R], [b + 0.06, r]].forEach(([t, rr], k) => { const px = cx + Math.cos(t) * rr, py = cx + Math.sin(t) * rr; (i === 0 && k === 0) ? c.moveTo(px, py) : c.lineTo(px, py); }); } c.closePath(); c.fill();
  c.fillStyle = body; c.beginPath(); for (let i = 0; i < teeth; i++) { const a = (i / teeth) * 6.2832, b = ((i + 0.5) / teeth) * 6.2832; [[a - 0.06, r - 4], [a + 0.04, R - 4], [b - 0.04, R - 4], [b + 0.06, r - 4]].forEach(([t, rr], k) => { const px = cx + Math.cos(t) * rr - 2, py = cx + Math.sin(t) * rr - 2; (i === 0 && k === 0) ? c.moveTo(px, py) : c.lineTo(px, py); }); } c.closePath(); c.fill();
  c.fillStyle = hole; c.beginPath(); c.arc(cx, cx, r * 0.62, 0, 7); c.fill(); c.fillStyle = shade(body, 0.8); for (let k = 0; k < 5; k++) { c.save(); c.translate(cx, cx); c.rotate(k * 1.2566); c.fillRect(-r * 0.09, 0, r * 0.18, r * 0.62); c.restore(); }
  c.fillStyle = shade(body, 1.2); c.beginPath(); c.arc(cx, cx, r * 0.2, 0, 7); c.fill(); void r2;
};
/** a gear on a wall: turns slowly with f (dir = +-1) */
export const Gear: React.FC<{pos: V3; r: number; teeth?: number; f?: number; dir?: 1 | -1; body?: string; seed?: number}> = ({pos, r, teeth = 14, f = 0, dir = 1, body = '#8a7a56', seed = 1}) => {
  const map = useMemo(() => tex(`hm-gear-${teeth}-${body}`, 256, 256, paintGear(teeth, body, '#1a1c20', seed)), [teeth, body]);
  return <mesh position={pos} rotation={[0, 0, dir * f * (0.014 * 10 / teeth)]}><planeGeometry args={[r * 2, r * 2]} /><meshLambertMaterial map={map} transparent alphaTest={0.4} side={THREE.DoubleSide} /></mesh>;
};
const paintMaskPlate = (c: Ctx, W: number, H: number) => {
  c.fillStyle = '#2a3238'; c.fillRect(0, 0, W, H); c.strokeStyle = '#59646c'; c.lineWidth = 8; c.strokeRect(10, 10, W - 20, H - 20); c.strokeStyle = '#1a1f24'; c.lineWidth = 3; c.strokeRect(24, 24, W - 48, H - 48);
  const cx = W / 2, s = W / 260, cy = H * 0.5;
  P(c, [[cx - 78 * s, cy - 100 * s], [cx, cy - 124 * s], [cx + 78 * s, cy - 100 * s], [cx + 64 * s, cy + 44 * s], [cx + 30 * s, cy + 126 * s], [cx, cy + 142 * s], [cx - 30 * s, cy + 126 * s], [cx - 64 * s, cy + 44 * s]], '#a9b3bf'); P(c, [[cx, cy - 124 * s], [cx + 78 * s, cy - 100 * s], [cx + 64 * s, cy + 44 * s], [cx + 30 * s, cy + 126 * s], [cx, cy + 142 * s]], '#8892a0');
  P(c, [[cx - 62 * s, cy - 40 * s], [cx - 12 * s, cy - 28 * s], [cx - 18 * s, cy - 8 * s], [cx - 62 * s, cy - 16 * s]], '#14171b'); P(c, [[cx + 62 * s, cy - 40 * s], [cx + 12 * s, cy - 28 * s], [cx + 18 * s, cy - 8 * s], [cx + 62 * s, cy - 16 * s]], '#14171b');
  P(c, [[cx - 8 * s, cy - 22 * s], [cx + 8 * s, cy - 22 * s], [cx + 14 * s, cy + 60 * s], [cx, cy + 70 * s], [cx - 14 * s, cy + 60 * s]], '#c9d1da'); c.fillStyle = '#14171b'; c.fillRect(cx - 30 * s, cy + 92 * s, 60 * s, 8 * s);
  c.fillStyle = '#5a6470'; [[-66, -88], [66, -88], [-56, 40], [56, 40]].forEach(([x, y]) => { c.beginPath(); c.arc(cx + x * s, cy + y * s, 5 * s, 0, 7); c.fill(); });
};
/** a big iron mask of Doom set into the wall, lit by a green strip under it */
export const MaskPlate: React.FC<{pos: V3; w?: number; glow?: number}> = ({pos, w = 2.0, glow = 1}) => {
  const map = useMemo(() => tex('hm-maskplate', 260, 340, paintMaskPlate), []);
  return <group position={pos}><mesh><planeGeometry args={[w, w * 1.3]} /><meshLambertMaterial map={map} /></mesh><B p={[0, -w * 0.67, 0.05]} s={[w, 0.08, 0.12]} c="#3fd48a" cast={false} /><Halo pos={[0, -w * 0.5, 0.2]} r={w * 0.9} color="#3fd48a" strength={0.16 * glow} /></group>;
};

// ---------------------------------------------------------------- pipes, tanks, lamps
export const Pipe: React.FC<{a: V3; b: V3; r?: number; c?: string; flange?: boolean}> = ({a, b, r = 0.1, c = '#7a8590', flange = true}) => {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length(), q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()), [a.join(), b.join()]);
  const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  return <group>
    <mesh position={mid} quaternion={q} castShadow receiveShadow><cylinderGeometry args={[r, r, len, 8]} /><meshLambertMaterial color={c} flatShading /></mesh>
    {flange ? [0.12, 0.5, 0.88].map((t, i) => <mesh key={i} position={[a[0] + d.x * t, a[1] + d.y * t, a[2] + d.z * t]} quaternion={q}><cylinderGeometry args={[r * 1.35, r * 1.35, 0.07, 8]} /><meshLambertMaterial color={shade(c, 0.78)} flatShading /></mesh>) : null}
  </group>;
};
/** a tall tank of green liquid in a steel frame, with bubbles rising (f), a green halo and a light */
export const Tank: React.FC<{pos: V3; r?: number; h?: number; f?: number; seed?: number; light?: boolean; glow?: number}> = ({pos, r = 0.75, h = 2.8, f = 0, seed = 1, light = true, glow = 1}) => (
  <group position={pos}>
    <mesh position={[0, h / 2 + 0.25, 0]} castShadow><cylinderGeometry args={[r, r, h, 10]} /><meshLambertMaterial color="#2fa06c" flatShading emissive="#1f8a52" emissiveIntensity={0.3 * glow} /></mesh>
    <mesh position={[r * 0.38, h / 2 + 0.25, r * 0.7]} rotation={[0, 0.4, 0]}><planeGeometry args={[r * 0.3, h * 0.82]} /><meshBasicMaterial color="#b8f4d4" transparent opacity={0.3} /></mesh>
    <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[r * 1.25, r * 1.35, 0.25, 10]} /><meshLambertMaterial color="#3a424a" flatShading /></mesh><mesh position={[0, h + 0.4, 0]}><cylinderGeometry args={[r * 1.2, r * 1.2, 0.3, 10]} /><meshLambertMaterial color="#4a545c" flatShading /></mesh>
    {[0.3, 0.95].map((t) => <mesh key={t} position={[0, 0.25 + h * t, 0]}><cylinderGeometry args={[r * 1.06, r * 1.06, 0.1, 10]} /><meshLambertMaterial color="#59646c" flatShading /></mesh>)}
    {[-1, 1].map((s) => <B key={s} p={[s * r * 1.02, h / 2 + 0.25, 0]} s={[0.1, h + 0.3, 0.1]} c="#59646c" />)}
    <B p={[0, h + 0.75, 0]} s={[0.4, 0.4, 0.4]} c="#6a747c" /><Pipe a={[0, h + 0.9, 0]} b={[0, h + 2.4, 0]} r={0.12} c="#8a7a56" />
    {Array.from({length: 8}, (_, i) => { const t = ((f * 0.7 + i * 17 + seed * 9) % 60) / 60; return <mesh key={i} position={[Math.sin(i * 2.3 + seed) * r * 0.5, 0.45 + t * (h - 0.4), r * 0.55 + 0.02]} renderOrder={4}><circleGeometry args={[0.05 + (i % 3) * 0.02, 6]} /><meshBasicMaterial color="#d8ffe8" transparent opacity={0.65 * Math.sin(Math.PI * t)} depthWrite={false} /></mesh>; })}
    <Halo pos={[0, h * 0.55, r + 0.3]} r={r * 3.2} color="#3fe08a" strength={0.22 * glow} />
    {light ? <pointLight position={[0, h * 0.6, r + 0.8]} color="#6af0a8" intensity={2.4 * glow} distance={7} decay={1.5} /> : null}
  </group>
);
/** a work lamp over a row: a steel conical shade, a glowing underside, a cool halo; on 0..1 */
export const WorkLamp: React.FC<{pos: V3; on?: number; w?: number; color?: string}> = ({pos, on = 1, w = 0.9, color = '#e6f4ff'}) => (
  <group position={pos}>
    <B p={[0, 0.9, 0]} s={[0.05, 1.8, 0.05]} c="#2d3238" cast={false} />
    <mesh position={[0, 0, 0]} castShadow><cylinderGeometry args={[w * 0.18, w * 0.5, 0.34, 8]} /><meshLambertMaterial color="#59646c" flatShading /></mesh>
    <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[w * 0.46, 8]} /><meshBasicMaterial color={on > 0.05 ? color : '#3a4048'} toneMapped={false} /></mesh>
    {on > 0.05 ? <Halo pos={[0, -0.5, 0.1]} r={w * 1.7} color={color} strength={0.12 * on} /> : null}
  </group>
);

// ---------------------------------------------------------------- rows of robots
const robotName = (k: string) => `hm-robot-${k}`;
export const RobotSprite: React.FC<{pos: V3; on?: boolean; open?: boolean; h?: number; flip?: boolean; broken?: boolean; rotZ?: number}> = ({pos, on = false, open, h = 1.9, flip, broken}) => {
  const k = `${on ? 'on' : 'off'}${open ? 'O' : ''}${broken ? 'B' : ''}`;
  return <Sprite name={robotName(k)} art={paintRobot({on, open, broken})} px={[300, 560]} w={h * 0.535} pos={pos} flip={flip} shade={0.3} />;
};
/** rows of robots: `cols` columns, `rows` rows going back from z0 by dz; the first `lit` rows (fractions allowed: the next row fades in as its eyes light) have green eyes */
export const RobotRows: React.FC<{x: number[]; z0: number; dz: number; rows: number; lit: number; skipFirst?: boolean}> = ({x, z0, dz, rows, lit, skipFirst}) => (
  <>{Array.from({length: rows}, (_, r) => (skipFirst && r === 0) ? null : x.map((xx, i) => <RobotSprite key={`${r}-${i}`} pos={[xx + ((r + i) % 3 - 1) * 0.02, 0, z0 - r * dz]} on={lit > r + 0.5} h={1.92} flip={(i + r) % 2 === 1} />))}</>
);

// ---------------------------------------------------------------- the blueprint partition
const paintSheet = (kind: number, lit: number, seed: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed); c.fillStyle = '#a9bccd'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(30,70,120,0.2)'; c.lineWidth = 1; for (let x = 0; x < W; x += 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.strokeStyle = '#1a4478'; c.lineWidth = 3; c.fillStyle = 'rgba(31,79,138,0.14)';
  const gear = (gx: number, gy: number, gr: number) => { c.beginPath(); c.arc(gx, gy, gr, 0, 7); c.stroke(); c.beginPath(); c.arc(gx, gy, gr * 0.45, 0, 7); c.stroke(); for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; c.beginPath(); c.moveTo(gx + Math.cos(a) * gr, gy + Math.sin(a) * gr); c.lineTo(gx + Math.cos(a) * gr * 1.18, gy + Math.sin(a) * gr * 1.18); c.stroke(); } };
  if (kind === 0) { c.strokeRect(W * 0.34, H * 0.1, W * 0.32, H * 0.22); c.strokeRect(W * 0.28, H * 0.34, W * 0.44, H * 0.3); c.strokeRect(W * 0.18, H * 0.34, W * 0.1, H * 0.3); c.strokeRect(W * 0.72, H * 0.34, W * 0.1, H * 0.3); c.strokeRect(W * 0.3, H * 0.66, W * 0.15, H * 0.26); c.strokeRect(W * 0.55, H * 0.66, W * 0.15, H * 0.26); gear(W * 0.5, H * 0.48, W * 0.09); }
  else if (kind === 1) { c.beginPath(); c.arc(W * 0.4, H * 0.7, W * 0.22, 0, 7); c.stroke(); c.beginPath(); c.arc(W * 0.4, H * 0.7, W * 0.13, 0, 7); c.stroke(); c.beginPath(); c.arc(W * 0.4, H * 0.3, W * 0.28, Math.PI, 0); c.stroke(); c.beginPath(); c.moveTo(W * 0.12, H * 0.3); c.lineTo(W * 0.12, H * 0.7); c.moveTo(W * 0.68, H * 0.3); c.lineTo(W * 0.68, H * 0.7); c.stroke(); gear(W * 0.78, H * 0.18, W * 0.07); gear(W * 0.78, H * 0.46, W * 0.09); }
  else { for (let k = 0; k < 9; k++) gear(W * (0.16 + (k % 3) * 0.3), H * (0.16 + Math.floor(k / 3) * 0.3), W * (0.06 + r() * 0.05)); c.beginPath(); for (let k = 0; k < 14; k++) { const px = W * (0.08 + r() * 0.84), py = H * (0.08 + r() * 0.84); k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); c.strokeRect(W * 0.06, H * 0.78, W * 0.88, H * 0.16); }
  c.fillStyle = '#1f4f8a'; c.font = `${H * 0.04}px "Chalkboard SE", "Comic Sans MS", cursive`; c.fillText(['ROBOT  MK.I', 'TIME  PLATFORM', 'THE  GREAT  WORK'][kind], W * 0.08, H * 0.97);
  if (lit > 0) { c.fillStyle = `rgba(120,230,255,${0.25 * lit})`; c.fillRect(0, 0, W, H); }
};
/** the blueprint partition: a timber board wall (3.4 m high) with three big sheets, growing and more tangled left to right, and small notes. `lit` 0..3: how many sheets glow (fractions fade). x from 0 to length on its own group; face to +z */
export const Partition: React.FC<{length?: number; lit?: number}> = ({length = 7.5, lit = 0}) => {
  const wood = useMemo(() => tex('hm-part-wood', 512, 256, paintPlanks(7, {base: '#6a5640', n: 8, vertical: true, nails: true, age: 0.8})), []);
  const specs: [number, number, number, number][] = [[1.4, 1.7, 2.1, 0], [3.7, 2.0, 2.4, 1], [6.1, 2.4, 2.7, 2]];   // x centre, w, h, kind
  return (
    <group>
      <mesh position={[length / 2, 1.7, 0]} castShadow receiveShadow><boxGeometry args={[length, 3.4, 0.16]} /><meshLambertMaterial map={wood} /></mesh>
      <B p={[length / 2, 3.45, 0.02]} s={[length + 0.2, 0.12, 0.28]} c="#3a3f46" /><B p={[length / 2, 0.06, 0.02]} s={[length + 0.1, 0.12, 0.24]} c="#3a3f46" />
      {[0, 1, 2, 3].map((i) => <B key={i} p={[i * (length / 3), 1.7, 0.06]} s={[0.14, 3.4, 0.2]} c="#2f353c" />)}
      {specs.map(([x, w, h, k], i) => { const L = Math.max(0, Math.min(1, lit - i)); return <SheetPlane key={i} pos={[x, 1.75, 0.095]} w={w} h={h} kind={k} lit={L} />; })}
      {[[0.5, 0.7, 0.4], [2.6, 0.5, 0.38], [5.0, 0.6, 0.4], [7.0, 0.85, 0.34], [0.55, 2.7, 0.34], [7.0, 2.4, 0.4]].map(([x, y, w], i) => <mesh key={i} position={[x, y, 0.09]} rotation={[0, 0, (i % 3 - 1) * 0.06]}><planeGeometry args={[w, w * 1.2]} /><meshLambertMaterial color={['#e8dcb0', '#dfe8f0', '#e8d0c0'][i % 3]} /></mesh>)}
      {specs.flatMap(([x, w, h], i) => [[-1, 1], [1, 1]].map(([sx], j) => <B key={`${i}${j}`} p={[x + sx * (w / 2 - 0.08), 1.75 + h / 2 - 0.07, 0.11]} s={[0.06, 0.06, 0.04]} c="#8a2a24" cast={false} />))}
    </group>
  );
};
const SheetPlane: React.FC<{pos: V3; w: number; h: number; kind: number; lit: number}> = ({pos, w, h, kind, lit}) => {
  const map = useMemo(() => tex(`hm-sheet-${kind}-${lit > 0.5 ? 1 : 0}`, 300, Math.round(300 * h / w), paintSheet(kind, lit > 0.5 ? 1 : 0, kind + 3)), [kind, lit > 0.5, w, h]);
  return <group position={pos}><mesh><planeGeometry args={[w, h]} /><meshLambertMaterial map={map} emissive="#7fe4ff" emissiveIntensity={0.55 * lit} /></mesh>{lit > 0 ? <Halo pos={[0, 0, 0.3]} r={Math.max(w, h) * 0.9} color="#8fe8ff" strength={0.2 * lit} /> : null}</group>;
};

// ---------------------------------------------------------------- the assembly rack, the bench, the scrap
/** the assembly rack (giá lắp): two steel posts, a top beam with a chain hoist, a robot body hanging with its chest open, a work lamp, a cable to a welding torch; the robot stands on y = 0.1 */
export const AssemblyRack: React.FC<{pos: V3; f?: number; open?: boolean}> = ({pos, f = 0, open = true}) => (
  <group position={pos}>
    {[-1.15, 1.15].map((x) => <B key={x} p={[x, 1.55, 0]} s={[0.16, 3.1, 0.2]} c="#59646c" />)}
    <B p={[0, 3.12, 0]} s={[2.6, 0.2, 0.26]} c="#4a545c" /><B p={[0, 0.06, 0]} s={[2.8, 0.12, 0.7]} c="#3a424a" /><B p={[0, 0.14, 0.0]} s={[2.0, 0.05, 0.6]} c="#c9a02c" cast={false} />
    {[0.5, 1.4, 2.3].map((y) => <B key={y} p={[0, y, -0.12]} s={[2.3, 0.07, 0.07]} c="#6a747c" />)}
    <B p={[0.0, 2.85, 0.02]} s={[0.1, 0.5, 0.1]} c="#2d3238" /><B p={[0.0, 2.55, 0.02]} s={[0.3, 0.08, 0.2]} c="#8a7a56" /><B p={[-0.6, 2.4, 0.04]} s={[0.04, 1.2, 0.04]} c="#2d3238" r={[0, 0, 0.1]} />
    <RobotSprite pos={[0, 0.1, 0.12]} open={open} h={1.9} />
    {open ? <Halo pos={[0.02, 1.25, 0.5]} r={0.9} color="#ff9a3a" strength={0.32 + 0.05 * Math.sin(f * 0.6)} /> : null}
    <group position={[1.8, 0, 0.5]}><B p={[0, 0.32, 0]} s={[0.5, 0.64, 0.4]} c="#6a4a2c" /><B p={[0, 0.7, 0]} s={[0.56, 0.08, 0.46]} c="#4a3322" /><B p={[-0.1, 0.9, 0.05]} s={[0.04, 0.4, 0.04]} c="#2d3238" r={[0, 0, 0.5]} /><B p={[0.12, 0.8, 0.05]} s={[0.05, 0.05, 0.3]} c="#8a2a24" /></group>
    <WorkLamp pos={[-1.5, 3.2, 0.8]} on={1} w={0.8} color="#fff0d0" />
  </group>
);
export const Bench: React.FC<{pos: V3; len?: number; rotY?: number}> = ({pos, len = 3.0, rotY = 0}) => {
  const wood = useMemo(() => tex('hm-bench-wood', 256, 128, paintPlanks(11, {base: '#7a5e40', n: 4, nails: true, age: 0.9})), []);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.92, 0]} castShadow receiveShadow><boxGeometry args={[len, 0.1, 0.9]} /><meshLambertMaterial map={wood} /></mesh>
      {[-1, 1].flatMap((x) => [-0.34, 0.34].map((z) => <B key={`${x}${z}`} p={[x * (len / 2 - 0.1), 0.45, z]} s={[0.1, 0.9, 0.1]} c="#59646c" />))}
      <B p={[0, 0.3, 0]} s={[len - 0.2, 0.06, 0.7]} c="#4a545c" />
      {/* tools and parts on the top: spanners, a coil of cable, a robot head, a hand, a lamp */}
      <B p={[-len * 0.34, 1.0, 0.1]} s={[0.5, 0.06, 0.08]} c="#9aa0a8" r={[0, 0.4, 0]} /><B p={[-len * 0.3, 1.0, -0.1]} s={[0.36, 0.05, 0.07]} c="#8a9096" r={[0, -0.3, 0]} />
      <B p={[len * 0.05, 1.04, 0.0]} s={[0.3, 0.14, 0.3]} c="#30333a" /><B p={[len * 0.05, 1.06, 0.16]} s={[0.1, 0.04, 0.01]} c="#6dff98" cast={false} />
      <B p={[len * 0.3, 1.0, 0.05]} s={[0.44, 0.06, 0.34]} c="#3f4a52" /><B p={[len * 0.38, 1.04, 0.2]} s={[0.16, 0.1, 0.12]} c="#d5d9dc" />
      <mesh position={[-len * 0.12, 1.05, -0.12]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.13, 0.04, 4, 8]} /><meshLambertMaterial color="#c8402a" flatShading /></mesh>
    </group>
  );
};
/** the scrap heap: broken robot parts piled up (heads, arms, plates, gears, wire), with sparks and a glint */
export const ScrapHeap: React.FC<{pos: V3; f?: number; r?: number}> = ({pos, f = 0, r = 2.1}) => {
  const bits = useMemo(() => { const R = rnd(17); return Array.from({length: 64}, (_, i) => { const a = R() * 6.28, d = Math.pow(R(), 0.8) * r, h = Math.max(0.05, (1 - d / r)) * 1.5, long = i % 5 === 0; return {x: Math.cos(a) * d, z: Math.sin(a) * d * 0.7, y: h * (0.35 + R() * 0.65), s: (long ? [0.9 + R() * 0.5, 0.1 + R() * 0.07, 0.1 + R() * 0.07] : [0.1 + R() * 0.34, 0.05 + R() * 0.16, 0.1 + R() * 0.26]) as V3, ry: R() * 3, rz: (R() - 0.5) * 1.5, col: ['#7a838c', '#a8adb3', '#2f7a3d', '#4a545c', '#8a7a56', '#5a6470', '#c8d0d8'][i % 7], i}; }); }, [r]);
  const lying: [number, number, number, number, boolean][] = [[0.5, 1.15, 0.2, 1.35, true], [-0.8, 0.9, 0.3, -1.2, false], [0.1, 0.55, 0.7, 1.7, false]];
  return (
    <group position={pos}>
      {bits.map((b) => <B key={b.i} p={[b.x, b.y, b.z]} s={b.s} c={b.col} r={[0, b.ry, b.rz]} />)}
      {lying.map(([x, y, z, ang, fl], i) => <group key={i} position={[x, y, z]} rotation={[0, 0, ang]}><RobotSprite pos={[0, 0, 0]} broken h={0.9 - i * 0.12} flip={fl} /></group>)}
      {[[-0.4, 1.0], [0.6, 1.3], [0.1, 0.6]].map(([x, y], i) => <group key={i}><B p={[x, y, 0.5]} s={[0.04, 0.04, 0.04]} c="#fff6c0" cast={false} />{Math.sin(f * 0.9 + i * 2.1) > 0.5 ? <Halo pos={[x, y, 0.6]} r={0.4} color="#9fe8ff" strength={0.6} /> : null}</group>)}
    </group>
  );
};

// ---------------------------------------------------------------- the furnace and the crane
/** the furnace: a squat brick-and-steel body with an open fire door (orange core, yellow edge, white heart), a riveted hood, a flue to the ceiling, a heap of coal, the glow in the air */
export const Furnace: React.FC<{pos: V3; f?: number; heat?: number}> = ({pos, f = 0, heat = 1}) => {
  const door = useMemo(() => tex('hm-furnace-door', 256, 192, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ff7a24'); g.addColorStop(0.6, '#ffb84a'); g.addColorStop(1, '#ffe28a'); c.fillStyle = '#1a1210'; c.fillRect(0, 0, W, H); c.fillStyle = g; c.beginPath(); c.moveTo(14, H); c.lineTo(14, H * 0.42); c.quadraticCurveTo(W / 2, -H * 0.15, W - 14, H * 0.42); c.lineTo(W - 14, H); c.fill(); const r = rnd(3); for (let i = 0; i < 20; i++) { c.fillStyle = ['#fff2b0', '#ffd060', '#ff8a30'][i % 3]; c.beginPath(); c.moveTo(20 + r() * (W - 40), H); c.lineTo(30 + r() * (W - 60), H * (0.35 + r() * 0.45)); c.lineTo(40 + r() * (W - 80), H); c.fill(); } }), []);
  const k = 0.9 + 0.1 * Math.sin(f * 0.37) * heat;
  return (
    <group position={pos}>
      <B p={[0, 1.2, 0]} s={[3.2, 2.4, 2.2]} c="#6a4a3c" /><B p={[0, 2.5, 0]} s={[3.4, 0.2, 2.4]} c="#3a424a" /><B p={[0, 0.1, 0.2]} s={[3.6, 0.2, 2.6]} c="#3a424a" />
      {Array.from({length: 5}, (_, i) => <B key={i} p={[0, 0.35 + i * 0.42, 1.12]} s={[3.1, 0.04, 0.02]} c="#4a3228" cast={false} />)}
      <mesh position={[0, 1.15, 1.12]}><planeGeometry args={[1.5, 1.2]} /><meshBasicMaterial map={door} toneMapped={false} /></mesh>
      <B p={[0, 1.8, 1.14]} s={[1.7, 0.12, 0.08]} c="#2d3238" /><B p={[-0.82, 1.15, 1.14]} s={[0.12, 1.3, 0.08]} c="#2d3238" /><B p={[0.82, 1.15, 1.14]} s={[0.12, 1.3, 0.08]} c="#2d3238" />
      <B p={[0, 3.6, -0.2]} s={[1.6, 1.8, 1.4]} c="#4a545c" r={[0, 0, 0]} /><Pipe a={[0, 4.4, -0.2]} b={[0, 9, -0.2]} r={0.42} c="#59646c" />
      {[-1.2, 1.2].map((x) => <B key={x} p={[x, 1.1, 1.14]} s={[0.4, 0.5, 0.3]} c="#2f2a28" />)}
      <Halo pos={[0, 1.15, 1.5]} r={3.4 * k} color="#ff8a30" strength={0.5 * heat} /><Halo pos={[0, 1.15, 1.6]} r={1.5 * k} color="#ffd070" strength={0.5 * heat} />
      <pointLight position={[0, 1.4, 2.2]} color="#ff8a3a" intensity={7 * heat * k} distance={11} decay={1.3} />
    </group>
  );
};
/** the crane: two rails along z under the ceiling, a bridge across x, a trolley at `x` with a chain down to a hook at height `hook` and a lamp */
export const Crane: React.FC<{y?: number; z?: number; span?: number; x?: number; hook?: number; len?: number}> = ({y = 7.4, z = -9, span = 20, x = 2, hook = 4.2, len = 8}) => (
  <group>
    {[-span / 2, span / 2].map((rx) => <group key={rx}><B p={[rx, y, z]} s={[0.4, 0.4, len * 2]} c="#59646c" /><B p={[rx, y - 0.3, z]} s={[0.12, 0.3, len * 2]} c="#2d3238" /></group>)}
    <B p={[0, y - 0.2, z]} s={[span, 0.5, 0.5]} c="#c9a02c" /><B p={[0, y - 0.5, z]} s={[span, 0.14, 0.62]} c="#3a424a" />
    {Array.from({length: 14}, (_, i) => <B key={i} p={[-span / 2 + 0.8 + i * (span - 1.6) / 13, y - 0.2, z + 0.26]} s={[0.05, 0.4, 0.02]} c="#3a3f46" cast={false} />)}
    <group position={[x, 0, z]}>
      <B p={[0, y - 0.82, 0]} s={[1.0, 0.36, 0.9]} c="#8a7a56" /><B p={[0, y - 1.0, 0]} s={[1.1, 0.1, 1.0]} c="#3a424a" />
      <B p={[0, (y - 1.05 + hook + 0.4) / 2, 0]} s={[0.07, y - 1.05 - hook - 0.4, 0.07]} c="#2d3238" />
      <B p={[0, hook + 0.2, 0]} s={[0.3, 0.4, 0.26]} c="#c9a02c" /><B p={[0, hook - 0.1, 0]} s={[0.1, 0.34, 0.1]} c="#2d3238" /><B p={[0.1, hook - 0.32, 0]} s={[0.3, 0.08, 0.1]} c="#2d3238" /><B p={[0.22, hook - 0.18, 0]} s={[0.08, 0.36, 0.1]} c="#2d3238" />
    </group>
  </group>
);

// ---------------------------------------------------------------- screens and a control desk
export const paintScreen = (kind: 'lines' | 'radar' | 'plain', seed = 1, hue = '#5fe39a') => (c: Ctx, W: number, H: number) => {
  c.fillStyle = '#07140e'; c.fillRect(0, 0, W, H); c.strokeStyle = hue; c.fillStyle = hue; const r = rnd(seed);
  if (kind === 'lines') { c.lineWidth = 2; for (let i = 0; i < 9; i++) { c.globalAlpha = 0.5 + r() * 0.5; c.fillRect(W * 0.08, H * (0.1 + i * 0.1), W * (0.2 + r() * 0.65), H * 0.035); } c.globalAlpha = 1; c.beginPath(); c.moveTo(W * 0.08, H * 0.94); for (let i = 1; i <= 12; i++) c.lineTo(W * (0.08 + i * 0.07), H * (0.9 - r() * 0.12)); c.stroke(); }
  else if (kind === 'radar') { c.lineWidth = 2; [0.42, 0.28, 0.14].forEach((q) => { c.beginPath(); c.arc(W / 2, H / 2, W * q, 0, 7); c.stroke(); }); c.beginPath(); c.moveTo(W / 2, H / 2); c.lineTo(W * 0.78, H * 0.22); c.stroke(); for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(W * (0.3 + r() * 0.4), H * (0.3 + r() * 0.4), 5, 0, 7); c.fill(); } }
  c.globalAlpha = 0.14; c.fillStyle = '#000'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2); c.globalAlpha = 1;
};
export const Monitor: React.FC<{pos: V3; w?: number; h?: number; kind?: 'lines' | 'radar' | 'plain'; seed?: number; rotY?: number; glow?: number}> = ({pos, w = 0.7, h = 0.5, kind = 'lines', seed = 1, rotY = 0, glow = 1}) => {
  const map = useMemo(() => tex(`hm-mon-${kind}-${seed}`, 256, Math.round(256 * h / w), paintScreen(kind, seed)), [kind, seed, w, h]);
  return <group position={pos} rotation={[0, rotY, 0]}><B p={[0, 0, 0]} s={[w + 0.1, h + 0.1, 0.12]} c="#2d3238" /><mesh position={[0, 0, 0.07]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={map} toneMapped={false} color={new THREE.Color(1, 1, 1).multiplyScalar(0.7 + 0.3 * glow)} /></mesh><Halo pos={[0, 0, 0.3]} r={Math.max(w, h) * 1.1} color="#5fe39a" strength={0.12 * glow} /></group>;
};
/** the control desk of the time machine and the draining machine: a steel body, a slanted panel with buttons and two monitors, and the great LEVER at its left end:
 *  `can` 0 = up (ready), 1 = pulled down. Origin = the middle of the desk's foot; the desk is 1.5 m wide (x), 0.9 deep (z), 1.05 high; the lever's pivot is at x = -0.62 */
export const ControlDesk: React.FC<{pos: V3; can?: number; f?: number; on?: number}> = ({pos, can = 0, f = 0, on = 0.5}) => {
  const ang = -0.9 + can * 1.55;
  return (
    <group position={pos}>
      <B p={[0, 0.5, 0]} s={[1.5, 1.0, 0.9]} c="#4a545c" /><B p={[0, 0.06, 0]} s={[1.6, 0.12, 1.0]} c="#2d3238" />
      <mesh position={[0, 1.1, 0.1]} rotation={[-0.45, 0, 0]} castShadow><boxGeometry args={[1.5, 0.12, 0.8]} /><meshLambertMaterial color="#59646c" flatShading /></mesh>
      {[[-0.3, 1.2, 0.0], [0.0, 1.2, 0.05], [0.3, 1.18, 0.1], [0.5, 1.15, 0.15]].map(([x, y, z], i) => <group key={i}><B p={[x, y, z + 0.1]} s={[0.1, 0.05, 0.1]} c={['#c8402a', '#e8c23a', '#3fd48a', '#3a8ae8'][i]} cast={false} />{on > 0.3 && Math.sin(f * 0.3 + i * 1.7) > -0.3 ? <Halo pos={[x, y + 0.04, z + 0.2]} r={0.16} color={['#ff6a4a', '#ffe070', '#6af0a8', '#6ab0ff'][i]} strength={0.5} /> : null}</group>)}
      <Monitor pos={[0.1, 1.55, -0.18]} w={0.62} h={0.42} kind="radar" seed={3} glow={on} /><Monitor pos={[0.65, 1.5, -0.12]} w={0.4} h={0.34} kind="lines" seed={5} glow={on} rotY={-0.4} />
      <group position={[-0.62, 1.16, 0.0]} rotation={[0, 0, ang]}>
        <B p={[0, 0.0, 0]} s={[0.22, 0.22, 0.28]} c="#2d3238" /><B p={[0, 0.4, 0]} s={[0.07, 0.8, 0.07]} c="#9aa0a8" /><B p={[0, 0.82, 0]} s={[0.2, 0.2, 0.2]} c="#c8402a" /><B p={[0, 0.82, 0.11]} s={[0.12, 0.12, 0.02]} c="#ff8a6a" cast={false} />
      </group>
      <B p={[-0.62, 1.22, 0.0]} s={[0.12, 0.3, 0.34]} c="#3a424a" />
      <Pipe a={[-0.9, 0.2, -0.3]} b={[-0.9, 0.9, -0.3]} r={0.06} c="#8a7a56" flange={false} />
    </group>
  );
};

// ---------------------------------------------------------------- the time machine and the draining machine
const paintPedestal = (c: Ctx, W: number, H: number) => {
  c.fillStyle = '#3a424a'; c.fillRect(0, 0, W, H); const cx = W / 2, r = rnd(3);
  c.strokeStyle = '#59646c'; c.lineWidth = 6; for (let k = 1; k < 5; k++) { c.beginPath(); c.arc(cx, cx, (W / 2) * (k / 5), 0, 7); c.stroke(); }
  c.strokeStyle = '#1a1f24'; c.lineWidth = 3; for (let k = 0; k < 12; k++) { c.beginPath(); c.moveTo(cx, cx); c.lineTo(cx + Math.cos(k * 0.5236) * W / 2, cx + Math.sin(k * 0.5236) * W / 2); c.stroke(); }
  c.fillStyle = '#c9a02c'; for (let k = 0; k < 24; k++) { const a = k * 0.2618; c.save(); c.translate(cx + Math.cos(a) * W * 0.46, cx + Math.sin(a) * W * 0.46); c.rotate(a); c.fillRect(-14, -4, 28, 8); c.restore(); }
  for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(20,20,24,${0.1 + r() * 0.2})`; c.beginPath(); c.arc(r() * W, r() * H, 6 + r() * 20, 0, 7); c.fill(); }
};
/** the round platform of the machines: a riveted steel disc (r 1.35, 0.18 high) with an inlaid ring pattern and a yellow edge; its ring of lamps runs round when `on` 0..1 (f) */
export const Pedestal: React.FC<{pos: V3; on?: number; f?: number; r?: number}> = ({pos, on = 0, f = 0, r = 1.35}) => {
  const map = useMemo(() => tex('hm-pedestal', 512, 512, paintPedestal), []);
  return (
    <group position={pos}>
      <mesh position={[0, 0.09, 0]} castShadow receiveShadow><cylinderGeometry args={[r, r * 1.06, 0.18, 14]} /><meshLambertMaterial color="#59646c" flatShading /></mesh>
      <mesh position={[0, 0.185, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[r * 0.98, 14]} /><meshLambertMaterial map={map} /></mesh>
      {Array.from({length: 16}, (_, i) => { const a = (i / 16) * 6.2832, lit = on > 0.05 ? Math.max(0, Math.sin((f * 0.35 - i * 0.7))) * on : 0; return <group key={i}><B p={[Math.cos(a) * r * 1.04, 0.1, Math.sin(a) * r * 1.04]} s={[0.12, 0.08, 0.12]} c={lit > 0.3 ? '#9ff4ff' : '#3a4852'} cast={false} />{lit > 0.3 ? <Halo pos={[Math.cos(a) * r * 1.08, 0.2, Math.sin(a) * r * 1.08 + 0.06]} r={0.34} color="#8fe9ff" strength={0.5 * lit} /> : null}</group>; })}
      {on > 0.05 ? <pointLight position={[0, 1.2, 0.6]} color="#7fe4ff" intensity={4 * on} distance={8} decay={1.4} /> : null}
    </group>
  );
};
/** the arc of the time machine: two thick pillars with coils, a half ring over the platform (radius 1.8, centre 1.75 m high), ring lamps; the portal opens in the ring.
 *  Faces +z; origin = the middle of the platform. on 0..1 = lamps and the blue glow. */
export const TimeArc: React.FC<{pos: V3; on?: number; f?: number}> = ({pos, on = 0, f = 0}) => (
  <group position={pos}>
    {[-1, 1].map((s) => <group key={s} position={[s * 1.95, 0, -0.55]}><B p={[0, 1.2, 0]} s={[0.46, 2.4, 0.46]} c="#4a545c" /><B p={[0, 0.08, 0]} s={[0.8, 0.16, 0.8]} c="#2d3238" />{[0.5, 0.95, 1.4, 1.85].map((y, i) => <B key={y} p={[0, y, 0.0]} s={[0.58, 0.14, 0.58]} c={i % 2 ? '#c9a02c' : '#8a7a56'} />)}<B p={[0, 2.55, 0]} s={[0.36, 0.3, 0.36]} c="#3a424a" /></group>)}
    {Array.from({length: 18}, (_, i) => { const a = Math.PI * (i / 17), x = Math.cos(a) * 1.95, y = 2.45 + Math.sin(a) * 1.3; return <group key={i}><B p={[x, y, -0.55]} s={[0.34, 0.3, 0.42]} c={i % 2 ? '#59646c' : '#4a545c'} r={[0, 0, a - Math.PI / 2]} />{on > 0.05 && Math.sin(f * 0.4 - i * 0.6) > 0 ? <Halo pos={[x, y, -0.2]} r={0.4} color="#8fe9ff" strength={0.55 * on} /> : null}</group>; })}
    <B p={[0, 3.9, -0.55]} s={[1.2, 0.3, 0.5]} c="#c9a02c" />
    {[-1.2, 1.2].map((x) => <Pipe key={x} a={[x, 3.7, -0.55]} b={[x * 1.5, 3.7, -2.4]} r={0.12} c="#8a7a56" />)}
  </group>
);
/** the draining machine (chapter 12): replaces the arc. Four pillars at the platform's corners, a funnel hood above (cone, steel), two clamp rings at waist height that close on `kep` 0..1,
 *  three corrugated cables arching from the hood over to an electrode ring at `ring`; `on` 0..1 = silver-white glow in the hood. */
export const HutMachine: React.FC<{pos: V3; kep?: number; on?: number; f?: number; ring?: V3}> = ({pos, kep = 0, on = 0, f = 0, ring = [1.7, 3.1, -1.0]}) => {
  const cab = (i: number) => { const a: V3 = [0, 4.35, 0], b: V3 = [ring[0], ring[1] + 0.4, ring[2]], p = new THREE.CatmullRomCurve3([new THREE.Vector3(...a), new THREE.Vector3((a[0] + b[0]) / 2 + 0.3 * (i - 1), 5.4 + i * 0.2, (a[2] + b[2]) / 2 + 0.4 * (i - 1)), new THREE.Vector3(...b)]); return new THREE.TubeGeometry(p, 18, 0.1, 6); };
  const geos = useMemo(() => [0, 1, 2].map(cab), [ring.join()]);
  return (
    <group position={pos}>
      {[[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><B p={[0, 2.15, 0]} s={[0.22, 4.3, 0.22]} c="#59646c" /><B p={[0, 0.1, 0]} s={[0.5, 0.2, 0.5]} c="#2d3238" />{[0.8, 1.9, 3.0].map((y) => <B key={y} p={[0, y, 0]} s={[0.3, 0.1, 0.3]} c="#c9a02c" />)}</group>)}
      <B p={[0, 4.4, -1.1]} s={[2.4, 0.2, 0.2]} c="#4a545c" /><B p={[0, 4.4, 1.1]} s={[2.4, 0.2, 0.2]} c="#4a545c" /><B p={[-1.1, 4.4, 0]} s={[0.2, 0.2, 2.4]} c="#4a545c" /><B p={[1.1, 4.4, 0]} s={[0.2, 0.2, 2.4]} c="#4a545c" />
      <mesh position={[0, 3.7, 0]} castShadow><cylinderGeometry args={[0.35, 1.6, 1.3, 10, 1, true]} /><meshLambertMaterial color="#6a747c" flatShading side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 3.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.55, 10]} /><meshBasicMaterial color={on > 0.02 ? '#e8f4ff' : '#3a4650'} transparent opacity={on > 0.02 ? 0.3 + 0.7 * on : 1} toneMapped={false} /></mesh>
      <mesh position={[0, 4.45, 0]}><cylinderGeometry args={[0.5, 0.35, 0.5, 10]} /><meshLambertMaterial color="#8a7a56" flatShading /></mesh>
      {[-1, 1].map((s) => <group key={s} position={[s * (1.55 - kep * 0.75), 1.15, 0]}><B p={[0, 0, 0]} s={[0.42, 0.32, 1.7]} c="#c9a02c" /><B p={[0, 0, 0.0]} s={[0.44, 0.1, 1.74]} c="#3a424a" />{kep > 0.9 ? <Halo pos={[-s * 0.2, 0, 0.9]} r={0.5} color="#fff0b0" strength={0.5} /> : null}</group>)}
      {geos.map((g, i) => <mesh key={i} geometry={g} castShadow><meshLambertMaterial color={['#2d3238', '#8a7a56', '#2d3238'][i]} flatShading /></mesh>)}
      <group position={ring}><mesh rotation={[0, 0.2, 0]}><torusGeometry args={[0.9, 0.12, 5, 10]} /><meshLambertMaterial color="#9aa0a8" flatShading /></mesh>{[0, 1, 2, 3, 4, 5].map((i) => <B key={i} p={[Math.cos(i * 1.047) * 0.9, Math.sin(i * 1.047) * 0.9, 0]} s={[0.22, 0.22, 0.26]} c="#c9a02c" />)}<B p={[0, 1.4, 0]} s={[0.06, 1.4, 0.06]} c="#2d3238" />{on > 0.05 ? <Halo pos={[0, 0, 0.2]} r={1.8} color="#e8f4ff" strength={0.4 * on} /> : null}</group>
      {on > 0.02 ? <><Halo pos={[0, 2.2, 1.6]} r={3.2} color="#e8f4ff" strength={0.45 * on} /><pointLight position={[0, 2.6, 1.8]} color="#e8f4ff" intensity={9 * on} distance={12} decay={1.3} /></> : null}
    </group>
  );
};
/** the round screen of chapter 12, hung by four chains: a dark rim, a lens of green-black glass with lines; d = diameter */
export const RoundScreen: React.FC<{pos: V3; d?: number; f?: number; on?: number}> = ({pos, d = 2.4, f = 0, on = 1}) => {
  const map = useMemo(() => tex('hm-roundscreen', 384, 384, (c, W, H) => { c.fillStyle = '#06130d'; c.fillRect(0, 0, W, H); c.strokeStyle = '#5fe39a'; c.lineWidth = 3; [0.46, 0.32, 0.18].forEach((q) => { c.beginPath(); c.arc(W / 2, H / 2, W * q, 0, 7); c.stroke(); }); c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.stroke(); c.fillStyle = '#5fe39a'; const r = rnd(2); for (let i = 0; i < 12; i++) { c.globalAlpha = 0.5; c.fillRect(W * 0.2, H * (0.16 + i * 0.06), W * (0.1 + r() * 0.5), 5); } c.globalAlpha = 0.16; c.fillStyle = '#000'; for (let y = 0; y < H; y += 5) c.fillRect(0, y, W, 2); }), []);
  return (
    <group position={pos}>
      {[[-0.8, 0.8], [0.8, 0.8], [-0.8, -0.8], [0.8, -0.8]].map(([x, z], i) => <Pipe key={i} a={[x * d * 0.4, d * 0.5, z * 0.2]} b={[x * d * 0.6, d * 2.2, z * 0.2]} r={0.035} c="#2d3238" flange={false} />)}
      <mesh rotation={[0, 0, 0]} castShadow><cylinderGeometry args={[d / 2 + 0.1, d / 2 + 0.1, 0.3, 16]} /><meshLambertMaterial color="#3a424a" flatShading /></mesh>
      <mesh position={[0, 0, 0.17]} rotation={[0, 0, f * 0.0]}><circleGeometry args={[d / 2, 16]} /><meshBasicMaterial map={map} toneMapped={false} color={new THREE.Color(1, 1, 1).multiplyScalar(0.6 + 0.4 * on)} /></mesh>
      <mesh position={[0, 0, 0.0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[d / 2 + 0.1, d / 2 + 0.1, 0.32, 16, 1, true]} /><meshLambertMaterial color="#59646c" flatShading side={THREE.DoubleSide} /></mesh>
      <Halo pos={[0, 0, 0.5]} r={d * 1.2} color="#5fe39a" strength={0.22 * on} />
    </group>
  );
};
/** the glass tube that holds a prisoner (chapter 11 scene 17): a base ring with a blue glow, tall faceted glass, a cap, cables; `wave` 0..1 = a ring of light rippling on the glass (f) */
export const GlassTube: React.FC<{pos: V3; r?: number; h?: number; f?: number; wave?: number}> = ({pos, r = 0.75, h = 2.6, f = 0, wave = 0}) => (
  <group position={pos}>
    <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[r * 1.25, r * 1.35, 0.3, 10]} /><meshLambertMaterial color="#3a424a" flatShading /></mesh>
    <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[r * 1.1, 10]} /><meshBasicMaterial color="#5ab4ff" toneMapped={false} /></mesh>
    <mesh position={[0, h / 2 + 0.3, 0]}><cylinderGeometry args={[r, r, h, 10, 1, true]} /><meshLambertMaterial color="#b8e4ff" transparent opacity={0.22} flatShading side={THREE.DoubleSide} /></mesh>
    <mesh position={[r * 0.45, h / 2 + 0.3, r * 0.8]} rotation={[0, 0.5, 0]}><planeGeometry args={[r * 0.22, h * 0.8]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.3} /></mesh>
    <mesh position={[0, h + 0.4, 0]}><cylinderGeometry args={[r * 1.15, r * 1.15, 0.24, 10]} /><meshLambertMaterial color="#4a545c" flatShading /></mesh>
    {[-0.4, 0.4].map((x) => <Pipe key={x} a={[x, h + 0.5, 0]} b={[x * 2, h + 2, -0.5]} r={0.07} c="#2d3238" flange={false} />)}
    {[-1, 1].map((s) => <B key={s} p={[s * r * 1.05, h / 2 + 0.3, 0]} s={[0.08, h, 0.08]} c="#59646c" />)}
    {wave > 0 ? <mesh position={[0, 0.5 + ((f * 0.04) % 1) * (h - 0.4), 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r * 0.98, r * 1.04, 10]} /><meshBasicMaterial color="#e8f8ff" transparent opacity={0.8 * wave} toneMapped={false} /></mesh> : null}
    <Halo pos={[0, 0.5, r + 0.6]} r={r * 2.8} color="#5ab4ff" strength={0.3} /><pointLight position={[0, 0.8, r + 0.8]} color="#6ab4ff" intensity={2.6} distance={6} decay={1.5} />
  </group>
);

// ---------------------------------------------------------------- 23/11/2026: THE GREAT TIME GATE (chapter 11) and the treasure chest
const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const paintRing = (kind: 'roman' | 'ticks' | 'teeth' | 'clock', body: string, dark: string) => (c: Ctx, W: number) => {
  const cx = W / 2; c.clearRect(0, 0, W, W);
  const rO = W * 0.5, rI = kind === 'clock' ? W * 0.5 - 6 : W * (kind === 'roman' ? 0.4 : kind === 'ticks' ? 0.43 : 0.42);
  const ring = (a: number, b: number, col: string) => { c.fillStyle = col; c.beginPath(); c.arc(cx, cx, a, 0, 7); c.arc(cx, cx, b, 0, 7, true); c.fill('evenodd'); };
  if (kind === 'teeth') { c.fillStyle = dark; c.beginPath(); const n = 48; for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832, b = ((i + 0.5) / n) * 6.2832; [[a - 0.03, rO * 0.94], [a + 0.02, rO], [b - 0.02, rO], [b + 0.03, rO * 0.94]].forEach(([t, r], k) => { const x = cx + Math.cos(t) * r, y = cx + Math.sin(t) * r; (i === 0 && k === 0) ? c.moveTo(x, y) : c.lineTo(x, y); }); } c.closePath(); c.arc(cx, cx, rI, 0, 7, true); c.fill('evenodd'); ring(rO * 0.93, rI, body); }
  else { ring(rO, rI, dark); ring(rO - 5, rI + 5, body); }
  c.strokeStyle = dark; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, cx, (rO + rI) / 2, 0, 7); c.stroke();
  if (kind === 'roman') { c.fillStyle = dark; c.font = `bold ${W * 0.05}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; ROMAN.forEach((t, i) => { const a = (i / 12) * 6.2832 - Math.PI / 2, r = (rO + rI) / 2; c.save(); c.translate(cx + Math.cos(a) * r, cx + Math.sin(a) * r); c.rotate(a + Math.PI / 2); c.fillText(t, 0, 0); c.restore(); }); }
  if (kind === 'ticks') { c.fillStyle = dark; for (let i = 0; i < 60; i++) { const a = (i / 60) * 6.2832; c.save(); c.translate(cx, cx); c.rotate(a); c.fillRect(rO - 4 - (i % 5 === 0 ? 22 : 11), -2, i % 5 === 0 ? 22 : 11, 4); c.restore(); } }
  if (kind === 'clock') { for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.2832; c.save(); c.translate(cx, cx); c.rotate(a); c.fillStyle = '#e8c34a'; c.fillRect(rI - 2, -7, 14, 14); c.restore(); } }
};
const paintVortex = (c: Ctx, W: number) => {
  const cx = W / 2, r = rnd(5); c.clearRect(0, 0, W, W);
  const g = c.createRadialGradient(cx, cx, 0, cx, cx, cx); g.addColorStop(0, '#f2d878'); g.addColorStop(0.18, '#d9a02a'); g.addColorStop(0.4, '#5a8cff'); g.addColorStop(0.75, '#6a3cc8'); g.addColorStop(1, '#2a1670'); c.fillStyle = g; c.beginPath(); c.arc(cx, cx, cx, 0, 7); c.fill();
  for (let arm = 0; arm < 6; arm++) { c.beginPath(); for (let t = 0; t <= 1; t += 0.02) { const a = arm * 1.0472 + t * 5.2, rr = cx * (0.08 + t * 0.92); const x = cx + Math.cos(a) * rr, y = cx + Math.sin(a) * rr; t ? c.lineTo(x, y) : c.moveTo(x, y); } c.strokeStyle = ['rgba(255,236,150,0.8)', 'rgba(150,200,255,0.75)', 'rgba(200,150,255,0.75)'][arm % 3]; c.lineWidth = 16 - (arm % 3) * 4; c.lineCap = 'round'; c.stroke(); }
  for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = cx * (0.25 + r() * 0.65), x = cx + Math.cos(a) * d, y = cx + Math.sin(a) * d, s = 16 + r() * 20; c.save(); c.translate(x, y); c.rotate(a * 3); c.fillStyle = '#f2d878'; c.beginPath(); c.arc(0, 0, s, 0, 7); c.fill(); c.fillStyle = '#2a1670'; c.beginPath(); c.arc(0, 0, s * 0.82, 0, 7); c.fill(); c.strokeStyle = '#f2d878'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.65); c.moveTo(0, 0); c.lineTo(s * 0.45, 0); c.stroke(); c.restore(); }
};
const Disc: React.FC<{map: THREE.Texture; r: number; z: number; rot: number; tilt?: [number, number, number?]; op?: number; add?: boolean}> = ({map, r, z, rot, tilt = [0, 0], op = 1, add}) =>
  <mesh position={[0, 0, z]} rotation={[tilt[0], tilt[1], rot]} renderOrder={1}><planeGeometry args={[r * 2, r * 2]} /><meshBasicMaterial map={map} transparent opacity={op} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} blending={add ? THREE.AdditiveBlending : THREE.NormalBlending} /></mesh>;
/** THE GREAT TIME GATE: a ring 4.3 m in radius (top near the ceiling) standing behind the platform, four rings of bronze, steel, copper and gold turning at their own speeds and slightly off axis (Roman numerals, minute ticks, teeth, clock studs),
 *  two big exposed gears, a stepped base round the platform, pipes and cables crawling to it, a coil tower either side that throws arcs to the outer ring, and in its mouth a time vortex of three turning layers (violet, blue, gold) with clock faces drifting.
 *  pos = the middle of the platform on the floor; the gate stands 1.4 m behind it. mo 0..1 = how open the vortex is; xoay = turning time (frames, default f); on = glow. */
export const TimeGate: React.FC<{pos: V3; f?: number; xoay?: number; mo?: number; on?: number}> = ({pos, f = 0, xoay, mo = 1, on = 1}) => {
  const t = xoay ?? f, R = 4.3, cy = 4.6;
  const T = useMemo(() => ({
    roman: tex('hm-gate-roman', 1024, 1024, paintRing('roman', '#c98a3c', '#4a2c14')), ticks: tex('hm-gate-ticks', 1024, 1024, paintRing('ticks', '#9aa6b2', '#27303a')), teeth: tex('hm-gate-teeth', 1024, 1024, paintRing('teeth', '#b8683a', '#3a2216')),
    clock: tex('hm-gate-clock', 1024, 1024, paintRing('clock', '#d9a830', '#5a3c0c')), vortex: tex('hm-gate-vortex', 1024, 1024, paintVortex as (c: Ctx, W: number, H: number) => void),
  }), []);
  const arcs: [V3, V3][] = [[[-4.5, 4.3, 0.2], [-3.3, 3.5, 0.3]], [[4.5, 4.3, 0.2], [3.3, 3.5, 0.3]], [[-4.5, 5.2, 0.2], [-2.8, 6.4, 0.3]], [[4.5, 5.2, 0.2], [2.8, 6.4, 0.3]]];
  return (
    <group position={[pos[0], pos[1], pos[2] - 1.4]}>
      <group position={[0, cy, 0]}>
        <Disc map={T.vortex} r={R * 0.74} z={-0.25} rot={t * 0.02} op={mo} />
        <Disc map={T.vortex} r={R * 0.62} z={-0.2} rot={-t * 0.034} op={0.55 * mo} add />
        <Disc map={T.vortex} r={R * 0.42} z={-0.15} rot={t * 0.06} op={0.6 * mo} add />
        <Disc map={T.roman} r={R * 0.82} z={0} rot={-t * 0.012} tilt={[Math.sin(t * 0.02) * 0.05, 0.04]} />
        <Disc map={T.ticks} r={R * 0.92} z={0.1} rot={t * 0.008} tilt={[0.03, Math.cos(t * 0.017) * 0.05]} />
        <Disc map={T.clock} r={R * 0.74} z={0.2} rot={t * 0.016} tilt={[-0.04, Math.sin(t * 0.013) * 0.06]} />
        <Disc map={T.teeth} r={R} z={0.3} rot={-t * 0.005} tilt={[0.02, -0.03]} />
        {Array.from({length: 8}, (_, i) => { const a = (i / 8) * 6.2832 + t * 0.004; return <B key={i} p={[Math.cos(a) * R * 1.02, Math.sin(a) * R * 1.02, 0.15]} s={[0.5, 0.5, 0.5]} c={i % 2 ? '#8a7a56' : '#59646c'} r={[0, 0, a]} />; })}
        <Halo pos={[0, 0, 0.6]} r={R * 1.5} color="#8a6aff" strength={0.38 * mo * on} /><Halo pos={[0, 0, 0.7]} r={R * 0.7} color="#ffe070" strength={0.18 * mo * on} />
        <pointLight position={[0, -1.5, 3]} color="#9a8aff" intensity={8 * mo * on} distance={16} decay={1.3} /><pointLight position={[0, -2.5, 2]} color="#ffd070" intensity={6 * mo * on} distance={9} decay={1.4} />
      </group>
      <Gear pos={[-3.9, 1.5, 0.5]} r={1.7} teeth={20} f={t} dir={1} body="#b8683a" seed={3} /><Gear pos={[3.9, 1.3, 0.5]} r={1.4} teeth={16} f={t} dir={-1} body="#8a7a56" seed={5} />
      {[-1, 1].map((s) => <group key={s} position={[s * 4.9, 0, 0.5]}>
        <B p={[0, 0.2, 0]} s={[1.0, 0.4, 1.0]} c="#3a424a" />
        <FacetStack />
        {[0.6, 1.1, 1.6, 2.1, 2.6, 3.1, 3.6].map((y) => <B key={y} p={[0, y, 0]} s={[0.8, 0.12, 0.8]} c="#c98a3c" />)}
        <B p={[0, 4.6, 0]} s={[0.5, 0.6, 0.5]} c="#9aa6b2" />
        <Halo pos={[0, 4.8, 0.5]} r={1.2} color="#bfeaff" strength={0.5 * on} />
      </group>)}
      {arcs.map(([a, b], i) => <Arc key={i} a={[a[0], a[1] + cy - 4.6 + 0.4, a[2]]} b={[b[0], b[1] + cy - 4.6 + 0.4 + 0.8, b[2]]} f={f} on={0.8 * on} color="#cfe8ff" width={0.03} seed={i + 1} />)}
      {/* the stepped base round the platform, pipes and cables to it */}
      <group position={[0, 0, 1.4]}>
        <mesh position={[0, 0.04, 0]} receiveShadow><cylinderGeometry args={[2.2, 2.3, 0.08, 14]} /><meshLambertMaterial color="#4a545c" flatShading /></mesh>
        <mesh position={[0, 0.1, 0]} receiveShadow><cylinderGeometry args={[1.8, 1.9, 0.12, 14]} /><meshLambertMaterial color="#59646c" flatShading /></mesh>
        {Array.from({length: 14}, (_, i) => { const a = (i / 14) * 6.2832; return <B key={i} p={[Math.cos(a) * 2.0, 0.1, Math.sin(a) * 2.0]} s={[0.1, 0.05, 0.1]} c={i % 2 ? '#ffd070' : '#8fe9ff'} cast={false} />; })}
      </group>
      {[-2.6, -1.5, 1.5, 2.6].map((x, i) => <group key={i}><Pipe a={[x * 1.15, 0.5, -0.3]} b={[x * 0.5, 0.2, 1.5]} r={0.12} c={i % 2 ? '#8a7a56' : '#6a7a88'} /><Pipe a={[x * 1.15, 0.5, -0.3]} b={[x * 1.3, 3.2, -0.2]} r={0.1} c="#59646c" flange={false} /></group>)}
    </group>
  );
};
const FacetStack: React.FC = () => <mesh position={[0, 2.1, 0]}><cylinderGeometry args={[0.32, 0.42, 4.2, 8]} /><meshLambertMaterial color="#4a545c" flatShading /></mesh>;

/** THE TREASURE: an oak chest bound in iron, lid thrown back (lid 0..1 = how far it has opened), heaped with flat gold coins in several shades, a jade ring, gold cups, red and blue gems, a necklace, a few coins fallen round it (f gives them a roll);
 *  a warm gold light for the people who hold it. pos = the chest's foot; about 0.9 m wide, 0.5 high; scale to taste. glow 0..1. */
export const Treasure: React.FC<{pos: V3; s?: number; lid?: number; glow?: number; f?: number; rotY?: number}> = ({pos, s = 1, lid = 1, glow = 1, f = 0, rotY = 0}) => {
  const wood = useMemo(() => tex('hm-chest-wood', 256, 128, paintPlanks(13, {base: '#7a4e2a', n: 5, nails: true, age: 0.6})), []);
  const coins = useMemo(() => { const R = rnd(31); const cols = ['#f2c43a', '#e2a82a', '#ffe070', '#c98a22', '#f8d860']; return Array.from({length: 120}, (_, i) => { const a = R() * 6.28, d = Math.sqrt(R()) * 0.36; const h = 0.5 + (1 - d / 0.36) * 0.16; return {x: Math.cos(a) * d, z: Math.sin(a) * d * 0.7, y: h + R() * 0.03, rx: (R() - 0.5) * 1.6, rz: (R() - 0.5) * 1.6, c: cols[i % 5], i}; }); }, []);
  const fallen = useMemo(() => { const R = rnd(8); return Array.from({length: 9}, (_, i) => ({x: (R() - 0.5) * 1.5, z: 0.45 + R() * 0.5, c: i % 2 ? '#f2c43a' : '#e2a82a', i})); }, []);
  const gem = (p: V3, c: string, k: number) => <group key={k} position={p}><mesh rotation={[0, k, 0]}><cylinderGeometry args={[0.001, 0.05, 0.05, 4]} /><meshBasicMaterial color={c} toneMapped={false} /></mesh><mesh position={[0, -0.04, 0]} rotation={[Math.PI, k, 0]}><cylinderGeometry args={[0.001, 0.05, 0.05, 4]} /><meshLambertMaterial color={c} flatShading /></mesh><Halo pos={[0, 0, 0.05]} r={0.14} color={c} strength={0.6} /></group>;
  return (
    <group position={pos} scale={s} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow><boxGeometry args={[0.92, 0.44, 0.58]} /><meshLambertMaterial map={wood} /></mesh>
      {[-0.34, 0, 0.34].map((x) => <B key={x} p={[x, 0.22, 0.295]} s={[0.07, 0.46, 0.015]} c="#2d3238" cast={false} />)}<B p={[0, 0.43, 0.295]} s={[0.94, 0.05, 0.016]} c="#2d3238" cast={false} /><B p={[0, 0.03, 0.295]} s={[0.94, 0.05, 0.016]} c="#2d3238" cast={false} />
      {[-0.44, 0.44].flatMap((x) => [-0.27, 0.27].map((z) => <B key={`${x}${z}`} p={[x, 0.22, z]} s={[0.05, 0.46, 0.05]} c="#3a424a" />))}
      <group position={[0, 0.44, -0.29]} rotation={[-lid * 1.9, 0, 0]}><mesh position={[0, 0.06, 0.29]} castShadow><boxGeometry args={[0.92, 0.12, 0.58]} /><meshLambertMaterial map={wood} /></mesh>{[-0.34, 0, 0.34].map((x) => <B key={x} p={[x, 0.07, 0.29]} s={[0.07, 0.13, 0.6]} c="#2d3238" cast={false} />)}<B p={[0, 0.0, 0.59]} s={[0.12, 0.1, 0.03]} c="#e2b843" /></group>
      <B p={[0, 0.5, 0]} s={[0.84, 0.1, 0.5]} c="#c98a22" />
      {coins.map((c) => <mesh key={c.i} position={[c.x, c.y, c.z]} rotation={[c.rx, c.i, c.rz]}><cylinderGeometry args={[0.058, 0.058, 0.012, 9]} /><meshLambertMaterial color={c.c} flatShading emissive="#6a4a08" emissiveIntensity={0.12 * glow} /></mesh>)}
      {fallen.map((c) => <mesh key={c.i} position={[c.x, 0.008, c.z]} rotation={[Math.PI / 2 * 0.05, c.i, 0]}><cylinderGeometry args={[0.06, 0.06, 0.012, 9]} /><meshLambertMaterial color={c.c} flatShading emissive="#6a4a08" emissiveIntensity={0.3 * glow} /></mesh>)}
      <mesh position={[0.12, 0.62, 0.08]} rotation={[1.2, 0.3, 0]}><torusGeometry args={[0.1, 0.022, 5, 12]} /><meshLambertMaterial color="#3fc08a" flatShading emissive="#1f8a52" emissiveIntensity={0.5} /></mesh>
      <mesh position={[-0.05, 0.6, 0.1]} rotation={[1.3, 0, 0.2]}><torusGeometry args={[0.16, 0.012, 4, 14]} /><meshBasicMaterial color="#ffe070" toneMapped={false} /></mesh>
      {[[-0.22, 0.62, 0.0], [0.26, 0.6, -0.1]].map(([x, y, z], i) => <group key={i} position={[x, y, z]}><mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.07, 0.04, 0.12, 8]} /><meshLambertMaterial color="#e2b843" flatShading emissive="#8a6a14" emissiveIntensity={0.5} /></mesh><B p={[0, 0.0, 0]} s={[0.1, 0.02, 0.1]} c="#c9a02c" cast={false} /></group>)}
      {gem([0.0, 0.68, 0.16], '#e0304a', 1)}{gem([-0.26, 0.64, 0.14], '#3a7aff', 2)}{gem([0.3, 0.66, 0.12], '#3fd48a', 3)}{gem([0.12, 0.7, -0.04], '#e0304a', 4)}{gem([-0.1, 0.7, -0.08], '#8a5aff', 5)}
      <Halo pos={[0, 0.7, 0.25]} r={1.5 * (0.9 + 0.1 * Math.sin(f * 0.4))} color="#ffc84a" strength={0.28 * glow} />
      <pointLight position={[0, 1.0, 0.7]} color="#ffc860" intensity={1.8 * glow} distance={5} decay={1.4} />
    </group>
  );
};
