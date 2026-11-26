import React, {useMemo} from 'react';
import * as THREE from 'three';
import {NguonBui} from './buiNguon';
import {B} from './kit';
import {tex} from './kitLab';
import {Ctx, rnd} from './depth';
import {FacetLathe} from './look';

/** lib3/kitPhongReed: pieces of REED RICHARDS' LABORATORY in New York, 1960s: bright, white and pale teal, steel and glass, lots of machines
 *  (computer cabinets with tape reels, a long control desk with three round screens, an analog computer, a rocket model, a wall chart, a blueprint board).
 *  Nothing here is the university lab (kitLab: whitewashed stone, brass, a hand-cranked machine). Flat shapes, two or three tones, hard edges. */
type V3 = [number, number, number];
const STEEL = '#3d464d', WHITE = '#eef1f2', TEAL = '#5f8c96', TEAL_DK = '#46707b', CREAM = '#e8e2d0', RED = '#c8352a', BLUE = '#2a5db0';

// ---------------------------------------------------------------- the blueprint of a rocket (white lines on blue, no words)
export const paintRocketPlan = (c: Ctx, W: number, H: number) => {
  c.fillStyle = '#2f5d9e'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1; for (let x = 0; x < W; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.strokeStyle = '#f4f1e8'; c.lineWidth = 4; c.lineJoin = 'round';
  // the rocket, side view: a long body with a pointed nose, four fins, portholes, stage rings, flame
  const cx = W * 0.46, top = H * 0.14, bot = H * 0.78, hw = W * 0.075;
  c.beginPath(); c.moveTo(cx, top); c.bezierCurveTo(cx + hw * 1.1, top + (bot - top) * 0.14, cx + hw, top + (bot - top) * 0.2, cx + hw, top + (bot - top) * 0.3); c.lineTo(cx + hw, bot); c.lineTo(cx - hw, bot); c.lineTo(cx - hw, top + (bot - top) * 0.3); c.bezierCurveTo(cx - hw, top + (bot - top) * 0.2, cx - hw * 1.1, top + (bot - top) * 0.14, cx, top); c.stroke();
  [[1, 1], [-1, 1]].forEach(([s]) => { c.beginPath(); c.moveTo(cx + s * hw, bot - (bot - top) * 0.28); c.lineTo(cx + s * hw * 2.7, bot + H * 0.02); c.lineTo(cx + s * hw, bot); c.stroke(); });
  c.beginPath(); c.moveTo(cx, bot - (bot - top) * 0.22); c.lineTo(cx, bot); c.stroke();
  [0.3, 0.38, 0.46].forEach((q) => { c.beginPath(); c.arc(cx, top + (bot - top) * q, hw * 0.32, 0, 7); c.stroke(); });
  [0.28, 0.52, 0.66].forEach((q) => { c.beginPath(); c.moveTo(cx - hw, top + (bot - top) * q); c.lineTo(cx + hw, top + (bot - top) * q); c.stroke(); });
  c.beginPath(); c.moveTo(cx - hw * 0.8, bot); c.lineTo(cx, bot + H * 0.1); c.lineTo(cx + hw * 0.8, bot); c.stroke();
  // dimension lines with arrows, a front view circle, a cut-away of the engine, notes as bars
  c.lineWidth = 2.5; const arrow = (x1: number, y1: number, x2: number, y2: number) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); const a = Math.atan2(y2 - y1, x2 - x1); [[x1, y1, 1], [x2, y2, -1]].forEach(([x, y, d]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + d * 12 * Math.cos(a - 0.4), y + d * 12 * Math.sin(a - 0.4)); c.moveTo(x, y); c.lineTo(x + d * 12 * Math.cos(a + 0.4), y + d * 12 * Math.sin(a + 0.4)); c.stroke(); }); };
  arrow(cx + hw * 3.4, top, cx + hw * 3.4, bot); arrow(cx - hw, bot + H * 0.14, cx + hw, bot + H * 0.14);
  c.lineWidth = 3; c.beginPath(); c.arc(W * 0.8, H * 0.28, W * 0.09, 0, 7); c.stroke(); c.beginPath(); c.arc(W * 0.8, H * 0.28, W * 0.05, 0, 7); c.stroke();
  for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(W * 0.8, H * 0.28); c.lineTo(W * 0.8 + Math.cos(i * 1.57 + 0.78) * W * 0.09, H * 0.28 + Math.sin(i * 1.57 + 0.78) * W * 0.09); c.stroke(); }
  c.strokeRect(W * 0.71, H * 0.52, W * 0.2, H * 0.22); c.beginPath(); c.moveTo(W * 0.71, H * 0.63); c.lineTo(W * 0.91, H * 0.63); c.moveTo(W * 0.81, H * 0.52); c.lineTo(W * 0.81, H * 0.74); c.stroke();
  c.fillStyle = '#f4f1e8'; [[0.07, 0.86, 0.3], [0.07, 0.9, 0.22], [0.64, 0.86, 0.3], [0.64, 0.9, 0.2], [0.07, 0.08, 0.12]].forEach(([x, y, w]) => c.fillRect(W * x, H * y, W * w, 5));
};
const planTex = () => tex('pr-plan', 640, 460, paintRocketPlan);

/** the blueprint board on the back wall: a pale wood frame, the plan, a pencil tray, pinned scraps. w x h in metres; faces +z */
export const BangVe: React.FC<{pos: V3; w?: number; h?: number}> = ({pos, w = 2.2, h = 1.6}) => {
  const m = planTex();
  return (
    <group position={pos}>
      <B p={[0, 0, 0.03]} s={[w + 0.16, h + 0.16, 0.06]} c="#b8a07a" />
      <mesh position={[0, 0, 0.07]}><planeGeometry args={[w, h]} /><meshLambertMaterial map={m} /></mesh>
      <B p={[0, -h / 2 - 0.1, 0.12]} s={[w * 0.8, 0.06, 0.16]} c="#8a7050" />
      {[-0.5, -0.2, 0.15, 0.45].map((x, i) => <B key={x} p={[x * w * 0.6, -h / 2 - 0.06, 0.14]} s={[0.22, 0.015, 0.015]} c={['#e2b82a', '#c8352a', '#2a5db0', '#e8e2d0'][i]} cast={false} />)}
      <B p={[w * 0.35, h * 0.2, 0.09]} s={[0.4, 0.3, 0.01]} c="#efe6c8" cast={false} r={[0, 0, 0.08]} />
      {[[-w / 2 + 0.1, h / 2 - 0.1], [w / 2 - 0.1, h / 2 - 0.1]].map(([x, y], i) => <mesh key={i} position={[x, y, 0.1]}><sphereGeometry args={[0.03, 6, 5]} /><meshLambertMaterial color={RED} /></mesh>)}
    </group>
  );
};

// ---------------------------------------------------------------- the computer cabinets: tape reels that turn, panels of blinking lamps, printout
const reelTex = () => tex('pr-reel', 128, 128, (c, W, H) => {
  c.fillStyle = '#2a2d31'; c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 2, 0, 7); c.fill(); c.fillStyle = '#6a4a38'; c.beginPath(); c.arc(W / 2, H / 2, W * 0.36, 0, 7); c.fill();
  c.fillStyle = '#c9ced2'; c.beginPath(); c.arc(W / 2, H / 2, W * 0.16, 0, 7); c.fill(); c.fillStyle = '#2a2d31'; for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; c.beginPath(); c.arc(W / 2 + Math.cos(a) * W * 0.26, H / 2 + Math.sin(a) * W * 0.26, W * 0.06, 0, 7); c.fill(); }
  c.beginPath(); c.arc(W / 2, H / 2, W * 0.05, 0, 7); c.fill();
});
export const Reel: React.FC<{pos: V3; r?: number; f?: number; dir?: 1 | -1}> = ({pos, r = 0.16, f = 0, dir = 1}) => (
  <mesh position={pos} rotation={[0, 0, -f * 0.12 * dir]}><circleGeometry args={[r, 20]} /><meshBasicMaterial map={reelTex()} transparent /></mesh>
);
/** a tall computer cabinet: steel-grey case, a tape drive with two reels and a tape loop, a panel of lamps and switches, a printer slot with paper */
export const TuMay: React.FC<{pos: V3; w?: number; h?: number; f?: number; seed?: number; tone?: string}> = ({pos, w = 0.95, h = 2.1, f = 0, seed = 1, tone = '#9aa3a8'}) => {
  const lamps = useMemo(() => { const r = rnd(seed * 3 + 1); return Array.from({length: 5 * 9}, () => ({c: ['#ff5a3a', '#ffd54a', '#6aeb7a', '#e8f2f8'][Math.floor(r() * 4)], p: 3 + Math.floor(r() * 5), o: Math.floor(r() * 9)})); }, [seed]);
  return (
    <group position={pos}>
      <B p={[0, h / 2, 0]} s={[w, h, 0.75]} c={tone} />
      <B p={[0, h + 0.03, 0.02]} s={[w + 0.04, 0.06, 0.78]} c={STEEL} />
      <B p={[0, 0.07, 0.04]} s={[w + 0.02, 0.14, 0.78]} c={STEEL} />
      {/* tape drive window */}
      <B p={[0, h * 0.74, 0.38]} s={[w - 0.14, 0.62, 0.03]} c="#2a2d31" cast={false} />
      <Reel pos={[-w * 0.22, h * 0.745, 0.4]} f={f} r={0.15} dir={1} /><Reel pos={[w * 0.22, h * 0.745, 0.4]} f={f} r={0.15} dir={-1} />
      <mesh position={[0, h * 0.7, 0.402]}><planeGeometry args={[w * 0.5, 0.012]} /><meshBasicMaterial color="#6a4a38" /></mesh>
      {[-w * 0.08, w * 0.08].map((x) => <mesh key={x} position={[x, h * 0.7, 0.405]}><circleGeometry args={[0.03, 8]} /><meshBasicMaterial color="#c9ced2" /></mesh>)}
      {/* panel of lamps (they blink with the frame), a row of switches, two dials */}
      <B p={[0, h * 0.4, 0.38]} s={[w - 0.14, 0.52, 0.03]} c="#1f2428" cast={false} />
      {lamps.map((q, i) => { const col = i % 9, row = Math.floor(i / 9), on = ((Math.floor(f / q.p) + q.o + row) % 3) !== 0; return <mesh key={i} position={[-w / 2 + 0.14 + col * ((w - 0.28) / 8), h * 0.4 + 0.2 - row * 0.1, 0.4]}><circleGeometry args={[0.027, 8]} /><meshBasicMaterial color={on ? q.c : '#3a3f44'} /></mesh>; })}
      {[0, 1, 2, 3, 4, 5].map((i) => <B key={i} p={[-w / 2 + 0.16 + i * 0.12, h * 0.19, 0.4]} s={[0.04, 0.09, 0.04]} c={i % 2 ? '#e8e2d0' : RED} cast={false} />)}
      {[0.26, 0.52].map((x, i) => <mesh key={i} position={[-w / 2 + w * x + 0.1, h * 0.28, 0.4]}><circleGeometry args={[0.06, 14]} /><meshBasicMaterial color="#e8e2d0" /></mesh>)}
      <B p={[0, h * 0.1, 0.38]} s={[w - 0.2, 0.05, 0.03]} c="#1f2428" cast={false} />
      <B p={[w * 0.18, h * 0.96, 0.18]} s={[0.4, 0.34, 0.01]} c="#f4f1e8" r={[-0.5, 0, 0]} cast={false} />
      <B p={[-w / 2 + 0.08, h * 0.9, 0.39]} s={[0.12, 0.05, 0.02]} c={BLUE} cast={false} />
    </group>
  );
};

// ---------------------------------------------------------------- the long control desk with three round screens and a lever
const scopeTex = (k: number) => tex(`pr-scope-${k}`, 256, 256, (c, W, H) => {
  const g = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2); g.addColorStop(0, '#1e4a3a'); g.addColorStop(1, '#0c2018'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(120,255,170,0.28)'; c.lineWidth = 1.5; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(W * i / 6, 0); c.lineTo(W * i / 6, H); c.moveTo(0, H * i / 6); c.lineTo(W, H * i / 6); c.stroke(); }
  c.strokeStyle = '#7dffb0'; c.lineWidth = 3.5; c.lineJoin = 'round';
  if (k === 0) { c.beginPath(); for (let x = 0; x <= W; x += 4) { const y = H / 2 + Math.sin(x * 0.07) * H * 0.22 * Math.sin(x * 0.012 + 1); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  else if (k === 1) { [0.2, 0.4, 0.6, 0.85].forEach((q) => { c.beginPath(); c.arc(W / 2, H / 2, W * q / 2, 0, 7); c.stroke(); }); c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.stroke(); c.fillStyle = '#d8ffe8'; [[0.62, 0.3], [0.36, 0.64], [0.7, 0.68]].forEach(([x, y]) => { c.beginPath(); c.arc(W * x, H * y, 6, 0, 7); c.fill(); }); }
  else { for (let i = 0; i < 9; i++) { const h = H * (0.2 + 0.6 * Math.abs(Math.sin(i * 1.7 + 1))); c.fillStyle = '#7dffb0'; c.fillRect(W * (0.1 + i * 0.09), H * 0.9 - h, W * 0.06, h); } }
});
/** a round screen on a stand, angled to the viewer: bezel, a lit face (flickers with f), a knob row under it; k = which picture (0 wave, 1 rings, 2 bars) */
export const MayDoTron: React.FC<{pos: V3; k?: number; f?: number; r?: number; rotY?: number}> = ({pos, k = 0, f = 0, r = 0.3, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <B p={[0, 0.07, 0]} s={[0.34, 0.14, 0.3]} c={STEEL} />
    <group position={[0, r + 0.14, 0.02]} rotation={[-0.2, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[r + 0.05, r + 0.07, 0.14, 24]} /><meshLambertMaterial color="#aab2b6" /></mesh>
      <mesh position={[0, 0, 0.072]}><circleGeometry args={[r, 28]} /><meshBasicMaterial map={scopeTex(k)} color={new THREE.Color().setScalar(0.82 + 0.18 * Math.sin(f * 0.7 + k))} /></mesh>
      {k === 1 ? <mesh position={[0, 0, 0.075]} rotation={[0, 0, -f * 0.12]}><circleGeometry args={[r * 0.96, 3, 0, 0.5]} /><meshBasicMaterial color="#9affc0" transparent opacity={0.22} depthWrite={false} /></mesh> : null}
    </group>
    {[-0.1, 0, 0.1].map((x, i) => <mesh key={i} position={[x, 0.05, 0.17]}><circleGeometry args={[0.025, 8]} /><meshBasicMaterial color={['#e8e2d0', RED, '#e2b82a'][i]} /></mesh>)}
  </group>
);
export const Ghe: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.03, 0.03, 0.5, 8]} /><meshLambertMaterial color="#9aa3a8" /></mesh>
    {[0, 1, 2, 3, 4].map((i) => <B key={i} p={[Math.cos(i * 1.256) * 0.22, 0.03, Math.sin(i * 1.256) * 0.22]} s={[0.46, 0.03, 0.04]} c="#9aa3a8" r={[0, -i * 1.256, 0]} cast={false} />)}
    <B p={[0, 0.54, 0]} s={[0.5, 0.08, 0.46]} c={TEAL} /><B p={[0, 0.83, -0.2]} s={[0.46, 0.4, 0.06]} c={TEAL_DK} r={[-0.1, 0, 0]} />
  </group>
);
/** the control desk: a long white-topped desk with a steel frame, three round screens, a bank of knobs and buttons, the lever (angle = its swing), a clamp lamp, a cup.
 *  Local: centre of the desk's floor plan; the front edge faces +z. len along x. */
export const BanMay: React.FC<{pos: V3; len?: number; f?: number; lever?: number; lampOn?: boolean}> = ({pos, len = 2.4, f = 0, lever = 0.2, lampOn = true}) => {
  const bank = useMemo(() => { const r = rnd(21); return Array.from({length: 14}, () => ({c: ['#e8e2d0', RED, '#e2b82a', '#2a5db0', '#6aeb7a'][Math.floor(r() * 5)], k: r() < 0.4})); }, []);
  return (
    <group position={pos}>
      <B p={[0, 0.84, 0]} s={[len, 0.06, 0.9]} c={WHITE} />
      <B p={[0, 0.8, 0.43]} s={[len, 0.04, 0.05]} c={STEEL} cast={false} />
      {[-len / 2 + 0.1, len / 2 - 0.1].map((x) => <group key={x}><B p={[x, 0.4, 0.3]} s={[0.06, 0.8, 0.06]} c={STEEL} /><B p={[x, 0.4, -0.3]} s={[0.06, 0.8, 0.06]} c={STEEL} /><B p={[x, 0.04, 0]} s={[0.06, 0.06, 0.8]} c={STEEL} /></group>)}
      <B p={[0, 0.62, -0.38]} s={[len - 0.2, 0.5, 0.04]} c={TEAL_DK} />
      {/* the sloped console in front of the screens: knobs and buttons */}
      <B p={[-0.25, 0.92, 0.2]} s={[1.2, 0.1, 0.4]} c="#aab2b6" r={[-0.18, 0, 0]} />
      {bank.map((q, i) => <mesh key={i} position={[-0.8 + (i % 7) * 0.17, 0.97 + Math.floor(i / 7) * 0.0, 0.1 + Math.floor(i / 7) * 0.2]} rotation={[-0.18, 0, 0]}>{q.k ? <cylinderGeometry args={[0.035, 0.04, 0.05, 10]} /> : <boxGeometry args={[0.07, 0.03, 0.07]} />}<meshLambertMaterial color={q.c} /></mesh>)}
      <MayDoTron pos={[-0.78, 0.87, -0.2]} k={0} f={f} rotY={0.15} /><MayDoTron pos={[-0.06, 0.87, -0.26]} k={1} f={f} /><MayDoTron pos={[0.66, 0.87, -0.2]} k={2} f={f} rotY={-0.15} />
      {/* the lever: a slot, a steel arm and a red ball on top */}
      <B p={[len / 2 - 0.35, 0.88, 0.1]} s={[0.1, 0.03, 0.5]} c="#1f2428" cast={false} />
      <group position={[len / 2 - 0.35, 0.9, 0.1 - 0.0]} rotation={[lever, 0, 0]}><B p={[0, 0.25, 0]} s={[0.035, 0.5, 0.035]} c="#c9ced2" /><mesh position={[0, 0.52, 0]}><sphereGeometry args={[0.06, 10, 8]} /><meshLambertMaterial color={RED} /></mesh></group>
      {/* clamp lamp, a cup, a roll of paper */}
      <group position={[len / 2 - 0.1, 0.87, -0.3]}><B p={[0, 0.3, 0]} s={[0.025, 0.6, 0.025]} c="#2a2d31" r={[0, 0, 0.15]} /><B p={[-0.12, 0.6, 0]} s={[0.26, 0.1, 0.1]} c="#d8a82a" r={[0, 0, 0.3]} />{lampOn ? <mesh position={[-0.18, 0.55, 0]}><circleGeometry args={[0.05, 8]} /><meshBasicMaterial color="#fff4cf" /></mesh> : null}</group>
      <FacetLathe profile={[[0.035, 0], [0.045, 0.02], [0.05, 0.09]]} sides={10} color="#e8e2d0" pos={[-len / 2 + 0.3, 0.87, 0.2]} contact={false} />
      <mesh position={[-len / 2 + 0.55, 0.92, 0.25]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, 0.3, 10]} /><meshLambertMaterial color="#efe6c8" /></mesh>
    </group>
  );
};

// ---------------------------------------------------------------- the rocket model on a stand
/** a metre-and-a-half rocket model: silver body in two tones, a red nose, four red fins, round windows, a tripod stand and a plaque. h = height. */
export const TenLua: React.FC<{pos: V3; h?: number}> = ({pos, h = 1.6}) => (
  <group position={pos}>
    {[0, 1, 2].map((i) => <B key={i} p={[Math.cos(i * 2.094) * 0.22, 0.2, Math.sin(i * 2.094) * 0.22]} s={[0.04, 0.5, 0.04]} c={STEEL} r={[Math.sin(i * 2.094) * 0.35, 0, -Math.cos(i * 2.094) * 0.35]} />)}
    <mesh position={[0, 0.52, 0]}><cylinderGeometry args={[0.3, 0.32, 0.05, 12]} /><meshLambertMaterial color={STEEL} /></mesh>
    <FacetLathe profile={[[0.0, 0.5], [0.17, 0.52], [0.19, 0.7], [0.18, h * 0.7], [0.17, h * 0.78]]} sides={14} color="#d4dade" contact={false} tones={[0.95, 1.0, 1.1, 1.0]} />
    <FacetLathe profile={[[0.17, h * 0.78], [0.14, h * 0.88], [0.07, h * 0.96], [0.0, h]]} sides={14} color={RED} contact={false} />
    {[0, 1, 2, 3].map((i) => <group key={i} rotation={[0, i * Math.PI / 2, 0]}><mesh position={[0.2, 0.74, 0]} rotation={[Math.PI / 2, 0, 0]}><shapeGeometry args={[(() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.3, -0.26); s.lineTo(0.3, 0.02); s.lineTo(0, 0.4); s.closePath(); return s; })()]} /><meshLambertMaterial color={RED} side={THREE.DoubleSide} /></mesh></group>)}
    {[0.5, 0.64].map((q, i) => <mesh key={i} position={[0, h * q + 0.2, 0.185]}><circleGeometry args={[0.04, 10]} /><meshBasicMaterial color="#9ad0e8" /></mesh>)}
    {[h * 0.35, h * 0.58].map((y) => <mesh key={y} position={[0, y + 0.1, 0]}><cylinderGeometry args={[0.195, 0.195, 0.025, 14]} /><meshLambertMaterial color={BLUE} /></mesh>)}
    <B p={[0, 0.5, 0.3]} s={[0.2, 0.06, 0.01]} c="#c9a54a" cast={false} />
  </group>
);

// ---------------------------------------------------------------- shelves of glassware
const GLASS_COL = ['#9ed4c4', '#e8b0a0', '#d8d890', '#a8c4e8', '#c8a8d8'];
/** a wall shelf (faces +z; rotate for a side wall) with flasks, a beaker, a rack of test tubes and a stack of notebooks. seed varies what stands on it */
export const KeKinh: React.FC<{pos: V3; w?: number; rotY?: number; seed?: number}> = ({pos, w = 1.5, rotY = 0, seed = 1}) => {
  const r = useMemo(() => rnd(seed * 7 + 2), [seed]), items = useMemo(() => Array.from({length: Math.floor(w / 0.26)}, () => ({k: Math.floor(r() * 4), c: GLASS_COL[Math.floor(r() * 5)], s: 0.8 + r() * 0.5})), [w, r]);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <B p={[0, 0, 0.14]} s={[w, 0.04, 0.28]} c={WHITE} />
      {[-w / 2 + 0.12, w / 2 - 0.12].map((x) => <B key={x} p={[x, -0.1, 0.08]} s={[0.03, 0.2, 0.14]} c={STEEL} />)}
      {items.map((q, i) => { const x = -w / 2 + 0.2 + i * 0.26; return q.k === 0 ? <group key={i} position={[x, 0.02, 0.14]} scale={q.s}>
        <FacetLathe profile={[[0.02, 0], [0.085, 0.01], [0.075, 0.1], [0.025, 0.17], [0.025, 0.22], [0.032, 0.23]]} sides={12} color="#d4e4e8" contact={false} tones={[1, 1.05, 1.1, 1.15, 1.2]} />
        <FacetLathe profile={[[0.02, 0.002], [0.083, 0.012], [0.078, 0.06]]} sides={12} color={q.c} contact={false} /></group>
        : q.k === 1 ? <group key={i} position={[x, 0.02, 0.14]} scale={q.s}>
        <FacetLathe profile={[[0.06, 0], [0.065, 0.1], [0.07, 0.15]]} sides={12} color="#d4e4e8" contact={false} tones={[1, 1.1]} />
        <FacetLathe profile={[[0.058, 0.002], [0.062, 0.07]]} sides={12} color={q.c} contact={false} /></group>
        : q.k === 2 ? <group key={i} position={[x, 0.02, 0.14]}>
        <B p={[0, 0.03, 0]} s={[0.2, 0.06, 0.09]} c="#8a7a5a" />{[-0.07, -0.025, 0.025, 0.07].map((dx, j) => <FacetLathe key={j} profile={[[0.012, 0], [0.014, 0.01], [0.014, 0.17]]} sides={6} color={GLASS_COL[(j + i) % 5]} pos={[dx, 0.04, 0]} contact={false} />)}</group>
        : <group key={i} position={[x, 0.02, 0.14]}>{[0, 1, 2].map((j) => <B key={j} p={[0, 0.02 + j * 0.04, 0]} s={[0.22 - j * 0.02, 0.04, 0.16]} c={['#2a5db0', '#e8e2d0', '#c8352a'][j]} />)}</group>; })}
    </group>
  );
};

// ---------------------------------------------------------------- the white bench in the foreground, with test tubes
export const BanTruoc: React.FC<{pos: V3; w?: number}> = ({pos, w = 2.8}) => (
  <group position={pos}>
    <B p={[0, 0.98, 0]} s={[w, 0.06, 1.0]} c={WHITE} />
    <B p={[0, 0.52, 0]} s={[w - 0.1, 0.9, 0.9]} c="#c9d0d4" />
    <B p={[0, 0.96, 0.52]} s={[w, 0.03, 0.04]} c={STEEL} cast={false} />
    {/* rack with test tubes and a bunsen burner and a flask */}
    <group position={[-0.6, 1.01, 0]}><B p={[0, 0.03, 0]} s={[0.5, 0.03, 0.14]} c="#8a7a5a" />{[-0.18, -0.09, 0, 0.09, 0.18].map((x, i) => <group key={x}><FacetLathe profile={[[0.016, 0], [0.018, 0.02], [0.018, 0.22]]} sides={6} color="#d4e4e8" pos={[x, 0.04, 0]} contact={false} /><FacetLathe profile={[[0.0, 0.002], [0.015, 0.02], [0.015, 0.1 + (i % 3) * 0.04]]} sides={6} color={GLASS_COL[i]} pos={[x, 0.04, 0]} contact={false} /></group>)}</group>
    <group position={[0.4, 1.01, 0.05]}><FacetLathe profile={[[0.02, 0], [0.095, 0.01], [0.085, 0.12], [0.03, 0.2], [0.03, 0.26], [0.038, 0.27]]} sides={12} color="#d4e4e8" contact={false} tones={[1, 1.05, 1.1, 1.15, 1.2]} /><FacetLathe profile={[[0.02, 0.002], [0.093, 0.012], [0.088, 0.07]]} sides={12} color="#e8b0a0" contact={false} /></group>
    <group position={[0.9, 1.01, -0.1]}><B p={[0, 0.02, 0]} s={[0.12, 0.04, 0.12]} c="#2a2d31" /><mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.015, 0.015, 0.2, 6]} /><meshLambertMaterial color="#8a8e92" /></mesh><mesh position={[0, 0.27, 0]}><coneGeometry args={[0.02, 0.07, 6]} /><meshBasicMaterial color="#7ad0ff" /></mesh></group>
    <FacetLathe profile={[[0.05, 0], [0.06, 0.1], [0.055, 0.12]]} sides={10} color="#e8e2d0" pos={[-1.1, 1.01, 0.2]} contact={false} />
  </group>
);

// ---------------------------------------------------------------- fluorescent ceiling lights, the wall chart, the badge, an analog computer, a trolley with an oscilloscope
/** bui (mặc định true): đèn tự đăng ký nguồn bụi (lib3/buiNguon) tại thân đèn ('den', khi bật). */
export const DenOng: React.FC<{pos: V3; on?: number; w?: number; d?: number; bui?: boolean}> = ({pos, on = 1, w = 1.5, d = 0.4, bui = true}) => (
  <group position={pos}>{bui && on > 0.3 ? <NguonBui kieu="den" pos={[0, -0.1, 0]} r={w * 0.6} mau="#fffdf0" k={on} /> : null}
    <B p={[0, 0, 0]} s={[w + 0.1, 0.06, d + 0.1]} c="#c9ced2" cast={false} />
    <mesh position={[0, -0.035, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[w, d]} /><meshBasicMaterial color={new THREE.Color('#fffdf0').multiplyScalar(0.35 + 0.65 * on)} /></mesh>
  </group>
);
const chartTex = () => tex('pr-chart', 512, 320, (c, W, H) => {
  c.fillStyle = '#f2efe4'; c.fillRect(0, 0, W, H); const r = rnd(12), cols = ['#9ed4c4', '#e8b0a0', '#d8d890', '#a8c4e8', '#c8a8d8', '#f0c890'];
  for (let y = 0; y < 7; y++) for (let x = 0; x < 18; x++) { if (y < 3 && x > 1 && x < 16 && !(y === 0 && x > 1 && x < 16)) { if (!(x < 2 || x > 15) && !(y === 0)) continue; } if (r() < 0.12) continue; c.fillStyle = cols[Math.floor(r() * 6)]; c.fillRect(20 + x * 26, 28 + y * 34, 23, 30); c.fillStyle = 'rgba(40,40,50,0.5)'; c.fillRect(24 + x * 26, 34 + y * 34, 12, 3); }
  c.fillStyle = '#2f3a4a'; c.fillRect(20, 6, 220, 10); c.fillRect(20, H - 22, 160, 8);
});
/** a printed wall chart of squares in six colours (no words) in a steel frame */
export const BieuDo: React.FC<{pos: V3; w?: number; rotY?: number}> = ({pos, w = 1.7, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <B p={[0, 0, 0.02]} s={[w + 0.08, w * 0.625 + 0.08, 0.04]} c={STEEL} />
    <mesh position={[0, 0, 0.045]}><planeGeometry args={[w, w * 0.625]} /><meshLambertMaterial map={chartTex()} /></mesh>
  </group>
);
/** an analog computer on a trolley: a bay of patch cords (coloured loops), dials and a plotter drum */
export const MayTuongTu: React.FC<{pos: V3; f?: number}> = ({pos, f = 0}) => {
  const cords = useMemo(() => { const r = rnd(5); return Array.from({length: 9}, () => ({x1: r(), y1: r(), x2: r(), y2: r(), c: [RED, '#e2b82a', '#6aeb7a', '#2a5db0', '#e8e2d0'][Math.floor(r() * 5)]})); }, []);
  return (
    <group position={pos}>
      <B p={[0, 0.5, 0]} s={[1.3, 1.0, 0.7]} c="#8c969b" /><B p={[0, 1.05, 0]} s={[1.36, 0.1, 0.76]} c={STEEL} />
      <B p={[0, 0.7, 0.36]} s={[1.1, 0.5, 0.03]} c="#1f2428" cast={false} />
      {Array.from({length: 40}, (_, i) => <mesh key={i} position={[-0.5 + (i % 10) * 0.11, 0.88 - Math.floor(i / 10) * 0.12, 0.38]}><circleGeometry args={[0.022, 8]} /><meshBasicMaterial color="#9aa3a8" /></mesh>)}
      {cords.map((q, i) => { const a = new THREE.Vector3(-0.5 + Math.round(q.x1 * 9) * 0.11, 0.88 - Math.round(q.y1 * 3) * 0.12, 0.39), b = new THREE.Vector3(-0.5 + Math.round(q.x2 * 9) * 0.11, 0.88 - Math.round(q.y2 * 3) * 0.12, 0.39), m = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -0.06, 0.12)); return <mesh key={i}><tubeGeometry args={[new THREE.QuadraticBezierCurve3(a, m, b), 10, 0.008, 5, false]} /><meshBasicMaterial color={q.c} /></mesh>; })}
      {[-0.4, -0.15, 0.1, 0.35].map((x, i) => <mesh key={i} position={[x, 0.36, 0.37]}><circleGeometry args={[0.07, 14]} /><meshBasicMaterial color="#e8e2d0" /></mesh>)}
      {[-0.4, -0.15, 0.1, 0.35].map((x, i) => <B key={`n${i}`} p={[x + 0.03 * Math.cos(f * 0.05 + i), 0.36 + 0.03 * Math.sin(f * 0.05 + i), 0.375]} s={[0.012, 0.012, 0.01]} c={RED} cast={false} />)}
      <mesh position={[0.0, 1.16, 0.0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.08, 0.08, 0.5, 12]} /><meshLambertMaterial color="#d8d4c4" /></mesh>
      {[-0.55, 0.55].flatMap((x) => [-0.25, 0.25].map((z) => <mesh key={`${x}${z}`} position={[x, 0.04, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, 0.05, 8]} /><meshLambertMaterial color="#1f2428" /></mesh>))}
    </group>
  );
};
/** the round badge for the lab wall (same drawing as the street's): a ring and a 4 */
export const LabBadge: React.FC<{pos: V3; r?: number}> = ({pos, r = 0.35}) => {
  const m = tex('pr-badge', 256, 256, (c, W, H) => {
    c.fillStyle = BLUE; c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 4, 0, 7); c.fill(); c.strokeStyle = '#f4f1e8'; c.lineWidth = 16; c.beginPath(); c.arc(W / 2, H / 2, W * 0.4, 0, 7); c.stroke();
    c.lineWidth = 24; c.lineCap = 'butt'; c.beginPath(); c.moveTo(W * 0.56, H * 0.24); c.lineTo(W * 0.56, H * 0.76); c.moveTo(W * 0.24, H * 0.6); c.lineTo(W * 0.78, H * 0.6); c.moveTo(W * 0.56, H * 0.24); c.lineTo(W * 0.24, H * 0.6); c.stroke();
  });
  return <group position={pos}><mesh position={[0, 0, 0.02]}><circleGeometry args={[r * 1.06, 32]} /><meshLambertMaterial color="#c9a54a" /></mesh><mesh position={[0, 0, 0.03]}><circleGeometry args={[r, 32]} /><meshBasicMaterial map={m} transparent /></mesh></group>;
};
/** a tile floor: big white-grey squares with a thin darker joint and a few scuffs */
export const paintTiles = (seed: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), n = 12, cw = W / n, ch = H / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const t = r(); c.fillStyle = (x + y) % 2 ? (t < 0.2 ? '#dfe3e4' : '#e6e9ea') : (t < 0.2 ? '#cfd6d8' : '#d8dedf'); c.fillRect(x * cw, y * ch, cw, ch); }
  c.strokeStyle = 'rgba(90,104,110,0.35)'; c.lineWidth = 2; for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * cw, 0); c.lineTo(i * cw, H); c.moveTo(0, i * ch); c.lineTo(W, i * ch); c.stroke(); }
  c.strokeStyle = 'rgba(70,70,76,0.12)'; c.lineWidth = 4; for (let i = 0; i < 14; i++) { const x = r() * W, y = r() * H; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 20 + r() * 50, y + (r() - 0.5) * 12); c.stroke(); }
};
/** the wall of the lab: pale teal-white plaster with a darker band at the foot, a steel rail at 0.9 m and a narrow teal stripe under the ceiling; a plain darker panel (x0..x1 in wall metres from the left) on the back wall */
export const paintLabWall = (Wm: number, Hm: number, panel?: [number, number, number, number]) => (c: Ctx, W: number, H: number) => {
  const px = W / Wm, py = H / Hm;
  c.fillStyle = '#e2ebec'; c.fillRect(0, 0, W, H);
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(120,150,160,0.12)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#7da3ac'; c.fillRect(0, H - 0.9 * py, W, 0.9 * py); c.fillStyle = '#9ebdc4'; c.fillRect(0, H - 0.94 * py, W, 0.05 * py);
  c.fillStyle = '#46707b'; c.fillRect(0, 0, W, 0.14 * py); c.fillStyle = '#f4f1e8'; c.fillRect(0, 0.14 * py, W, 0.03 * py);
  if (panel) { const [x0, x1, y0, y1] = panel; c.fillStyle = '#5f7a8c'; c.fillRect(x0 * px, H - y1 * py, (x1 - x0) * px, (y1 - y0) * py); const gg = c.createLinearGradient(0, H - y1 * py, 0, H - y0 * py); gg.addColorStop(0, 'rgba(255,255,255,0.1)'); gg.addColorStop(1, 'rgba(0,0,0,0.12)'); c.fillStyle = gg; c.fillRect(x0 * px, H - y1 * py, (x1 - x0) * px, (y1 - y0) * py); c.strokeStyle = '#d8e2e4'; c.lineWidth = 3; c.strokeRect(x0 * px, H - y1 * py, (x1 - x0) * px, (y1 - y0) * py); }
  const r = rnd(3); c.fillStyle = 'rgba(70,90,100,0.05)'; for (let i = 0; i < 26; i++) c.fillRect(r() * W, r() * H * 0.8, 40 + r() * 90, 3);
};

/** the silver model plane of d1c12 (shot 24): a slim body, swept wings, a V tail, a small antenna ring on its back, on a short steel rail; sets in the middle of the desk */
export const MayBayNho: React.FC<{pos: V3; tilt?: number}> = ({pos, tilt = 0.52}) => {
  const wing = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(0.1, 0.02); sh.lineTo(-0.12, 0.3); sh.lineTo(-0.2, 0.3); sh.lineTo(-0.1, 0.02); sh.closePath(); return new THREE.ShapeGeometry(sh); }, []);
  return (
    <group position={pos}>
      <group rotation={[0, 0, tilt]}>
        <B p={[0, 0.0, 0]} s={[0.8, 0.025, 0.05]} c={STEEL} />
        <B p={[-0.34, -0.05, 0]} s={[0.05, 0.1, 0.07]} c={STEEL} /><B p={[0.3, -0.05, 0]} s={[0.05, 0.1, 0.07]} c={STEEL} />
        <group position={[0.02, 0.07, 0]}>
          <group rotation={[0, 0, -Math.PI / 2]}><FacetLathe profile={[[0.0, -0.3], [0.03, -0.26], [0.042, -0.05], [0.04, 0.12], [0.02, 0.28], [0.0, 0.34]]} sides={10} color="#dfe3e6" contact={false} tones={[0.9, 1, 1.1, 1.05, 1.15]} /></group>
          {[1, -1].map((k) => <mesh key={k} position={[0, 0, 0]} rotation={[-Math.PI / 2 * k, 0, 0]} geometry={wing}><meshLambertMaterial color="#c4cbcf" side={THREE.DoubleSide} /></mesh>)}
          {[1, -1].map((k) => <mesh key={`t${k}`} position={[-0.27, 0.0, 0]} rotation={[k * 0.62, 0, 0]} scale={[0.45, 0.5, 1]}><mesh rotation={[-Math.PI / 2, 0, 0]} geometry={wing}><meshLambertMaterial color="#b4bcc0" side={THREE.DoubleSide} /></mesh></mesh>)}
          <mesh position={[0.02, 0.07, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.045, 0.007, 5, 14]} /><meshLambertMaterial color="#e8e2d0" /></mesh>
          <mesh position={[0.34, 0.0, 0]}><sphereGeometry args={[0.014, 8, 6]} /><meshBasicMaterial color="#6aeb7a" /></mesh>
        </group>
      </group>
    </group>
  );
};

/** a 1960s wall clock: white face, steel rim, two hands, twelve ticks, a red second hand */
export const Dongho: React.FC<{pos: V3; r?: number}> = ({pos, r = 0.24}) => {
  const m = tex('pr-clock', 256, 256, (c, Wd, Hd) => { c.fillStyle = '#f4f1e8'; c.beginPath(); c.arc(Wd / 2, Hd / 2, Wd / 2 - 6, 0, 7); c.fill(); c.strokeStyle = '#2a2d31'; c.lineWidth = 8; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.beginPath(); c.moveTo(Wd / 2 + Math.cos(a) * Wd * 0.38, Hd / 2 + Math.sin(a) * Wd * 0.38); c.lineTo(Wd / 2 + Math.cos(a) * Wd * 0.45, Hd / 2 + Math.sin(a) * Wd * 0.45); c.stroke(); } c.lineWidth = 12; c.beginPath(); c.moveTo(Wd / 2, Hd / 2); c.lineTo(Wd / 2 - 18, Hd / 2 - 62); c.stroke(); c.lineWidth = 8; c.beginPath(); c.moveTo(Wd / 2, Hd / 2); c.lineTo(Wd / 2 + 58, Hd / 2 + 24); c.stroke(); c.strokeStyle = '#c8352a'; c.lineWidth = 4; c.beginPath(); c.moveTo(Wd / 2, Hd / 2 + 20); c.lineTo(Wd / 2 - 40, Hd / 2 - 70); c.stroke(); });
  return <group position={pos}><mesh position={[0, 0, 0.02]}><circleGeometry args={[r * 1.1, 28]} /><meshLambertMaterial color="#9aa3a8" /></mesh><mesh position={[0, 0, 0.035]}><circleGeometry args={[r, 28]} /><meshBasicMaterial map={m} transparent /></mesh></group>;
};
/** a potted plant in a white pot: broad leaves in two greens */
export const CayCanh: React.FC<{pos: V3; s?: number}> = ({pos, s = 1}) => (
  <group position={pos} scale={s}>
    <FacetLathe profile={[[0.16, 0], [0.22, 0.2], [0.26, 0.42], [0.24, 0.44]]} sides={10} color="#eef1f2" tones={[0.95, 1, 1.1]} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => { const a = i * 0.9; return <mesh key={i} position={[Math.cos(a) * 0.12, 0.72 + (i % 3) * 0.12, Math.sin(a) * 0.12]} rotation={[Math.sin(a) * 0.5, a, Math.cos(a) * 0.6]} scale={[0.1, 0.5 + (i % 3) * 0.12, 0.02]}><octahedronGeometry args={[1, 0]} /><meshLambertMaterial color={i % 2 ? '#4f8a4a' : '#3f7340'} flatShading /></mesh>; })}
  </group>
);
/** a tiny radar dish on a stand, for a shelf top */
export const ChanDia: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <B p={[0, 0.04, 0]} s={[0.26, 0.08, 0.2]} c={STEEL} />
    <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.02, 0.02, 0.2, 6]} /><meshLambertMaterial color="#9aa3a8" /></mesh>
    <mesh position={[0, 0.34, 0.03]} rotation={[-0.9, 0, 0]}><sphereGeometry args={[0.15, 12, 6, 0, Math.PI * 2, 0, 1.0]} /><meshLambertMaterial color="#e8e2d0" side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 0.4, 0.16]} rotation={[-0.9, 0, 0]}><cylinderGeometry args={[0.006, 0.006, 0.18, 4]} /><meshLambertMaterial color="#9aa3a8" /></mesh>
  </group>
);
