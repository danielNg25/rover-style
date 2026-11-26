import React, {useMemo} from 'react';
import {useBui} from './mauBui';
import * as THREE from 'three';
import {FacetLathe, Halo} from './look';
import {rnd, P, Ctx} from './depth';
import {B} from './kit';

/** lib3/kitLab: pieces for a NIGHT INTERIOR (first used by the dormitory laboratory, src/demo/Lab.tsx), all in room units
 *  (metres, x along a wall, y up, z out from it). Made things are boxes and turned solids; papers, pictures, cloth and
 *  writing are canvas pictures lying on their surface. Lights that belong to a thing (the desk lamp, the corridor, the
 *  moon through a window) are here too, because a night room is lit by its objects, not by a sky. */
type V3 = [number, number, number];

// ---------------------------------------------------------------- textures (kept by key)
const TEX = new Map<string, THREE.CanvasTexture>();
export const tex = (key: string, w: number, h: number, paint: (c: Ctx, W: number, H: number) => void) => {
  let t = TEX.get(key);
  if (!t) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; paint(cv.getContext('2d')!, w, h); t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; TEX.set(key, t); }
  return t;
};
const HAND = '"Chalkboard SE", "Noteworthy", "Comic Sans MS", cursive';

/** Whitewashed brick, old: brick courses showing faintly through the lime, patches where the wash has flaked off to the red
 *  brick, damp rising from the foot, stains running down from the ceiling, a crack. ppm = pixels per metre. */
export const paintWhitewash = (seed: number, Wm: number, Hm: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / Wm, bh = 0.075 * ppm, bw = 0.23 * ppm;
  c.fillStyle = '#d2cbbb'; c.fillRect(0, 0, W, H);
  for (let y = 0, row = 0; y < H; y += bh, row++) for (let x = row % 2 ? -bw / 2 : 0; x < W; x += bw) {
    const q = r(); if (q < 0.25) { c.fillStyle = q < 0.12 ? 'rgba(255,252,240,0.35)' : 'rgba(120,100,80,0.10)'; c.fillRect(x, y, bw, bh); }
    c.strokeStyle = `rgba(95,85,72,${0.05 + r() * 0.08})`; c.lineWidth = 2; c.strokeRect(x, y, bw, bh);
  }
  // flaked patches: red brick with dark joints, a ragged lime edge
  for (let k = 0; k < Math.round(Wm * 0.9); k++) {
    const cx = r() * W, cy = H * (0.15 + r() * 0.75), rx = (0.12 + r() * 0.22) * ppm, ry = rx * (0.5 + r() * 0.4), pts: number[][] = [];
    for (let a = 0; a < 14; a++) { const t = (a / 14) * Math.PI * 2, m = 0.7 + r() * 0.45; pts.push([cx + Math.cos(t) * rx * m, cy + Math.sin(t) * ry * m]); }
    c.save(); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip();
    c.fillStyle = '#9a5c46'; c.fillRect(cx - rx * 1.3, cy - ry * 1.3, rx * 2.6, ry * 2.6);
    for (let y = Math.floor((cy - ry * 1.3) / bh) * bh, row = Math.floor((cy - ry * 1.3) / bh); y < cy + ry * 1.3; y += bh, row++) for (let x = Math.floor((cx - rx * 1.3) / bw) * bw - (row % 2 ? bw / 2 : 0); x < cx + rx * 1.3; x += bw) {
      c.fillStyle = r() < 0.3 ? '#8a4f3c' : r() < 0.5 ? '#a8664c' : '#9a5c46'; c.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    }
    c.restore();
    c.strokeStyle = 'rgba(250,246,236,0.7)'; c.lineWidth = 3; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke();
  }
  for (let k = 0; k < Wm * 2; k++) { const x = r() * W, w = (0.05 + r() * 0.15) * ppm, h = (0.3 + r() * 0.9) * ppm, g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(90,78,60,0.22)'); g.addColorStop(1, 'rgba(90,78,60,0)'); c.fillStyle = g; c.fillRect(x, 0, w, h); }
  const damp = c.createLinearGradient(0, H, 0, H - 0.7 * ppm); damp.addColorStop(0, 'rgba(70,74,60,0.30)'); damp.addColorStop(1, 'rgba(70,74,60,0)'); c.fillStyle = damp; c.fillRect(0, H - 0.7 * ppm, W, 0.7 * ppm);
  for (let k = 0; k < 18; k++) { const x = r() * W, y = H - r() * 0.6 * ppm, q = (0.1 + r() * 0.2) * ppm, g = c.createRadialGradient(x, y, 0, x, y, q); g.addColorStop(0, 'rgba(60,66,52,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - q, y - q, q * 2, q * 2); }
  c.strokeStyle = 'rgba(70,60,50,0.55)'; c.lineWidth = 2; c.beginPath(); let x = W * (0.2 + r() * 0.6), y = 0; c.moveTo(x, y); for (let k = 0; k < 10; k++) { x += (r() - 0.5) * 40; y += 20 + r() * 40; c.lineTo(x, y); } c.stroke();
};

/** A wall with openings: a solid slab (casts the shadows that keep the moon and the corridor light to their openings) and
 *  a painted face just in front of it. holes = shapes in wall units (x right, y up from the wall's left foot). The wall lies
 *  in its own x-y plane, face towards +z, thickness going back to -t. notch = [x0, x1, top]: a door cut up from the foot. */
export type Hole = {kind: 'rect'; x0: number; x1: number; y0: number; y1: number} | {kind: 'arch'; x0: number; x1: number; y0: number; spring: number};
const holePath = (h: Hole) => {
  const p = new THREE.Path();
  if (h.kind === 'rect') { p.moveTo(h.x0, h.y0); p.lineTo(h.x1, h.y0); p.lineTo(h.x1, h.y1); p.lineTo(h.x0, h.y1); p.closePath(); }
  else { const r = (h.x1 - h.x0) / 2, cx = (h.x0 + h.x1) / 2; p.moveTo(h.x0, h.y0); p.lineTo(h.x1, h.y0); p.lineTo(h.x1, h.spring); p.absarc(cx, h.spring, r, 0, Math.PI, false); p.lineTo(h.x0, h.y0); }
  return p;
};
export const HoledWall: React.FC<{w: number; h: number; t?: number; holes?: Hole[]; notch?: [number, number, number]; map: THREE.Texture; color?: string; slab?: string}> = ({w, h, t = 0.3, holes = [], notch, map, color = '#ffffff', slab = '#8a8478'}) => {
  const [solid, face] = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(0, 0); if (notch) { s.lineTo(notch[0], 0); s.lineTo(notch[0], notch[2]); s.lineTo(notch[1], notch[2]); s.lineTo(notch[1], 0); } s.lineTo(w, 0); s.lineTo(w, h); s.lineTo(0, h); s.closePath(); holes.forEach((q) => s.holes.push(holePath(q)));
    const g = new THREE.ExtrudeGeometry(s, {depth: t, bevelEnabled: false, curveSegments: 18}); g.translate(0, 0, -t - 0.004);
    const f = new THREE.ShapeGeometry(s, 18), pos = f.attributes.position as THREE.BufferAttribute, uv: number[] = [];
    for (let i = 0; i < pos.count; i++) uv.push(pos.getX(i) / w, pos.getY(i) / h);
    f.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return [g, f];
  }, [w, h, t, JSON.stringify(holes), JSON.stringify(notch)]);
  return (
    <group>
      <mesh geometry={solid} castShadow receiveShadow><meshLambertMaterial color={slab} /></mesh>
      <mesh geometry={face} receiveShadow><meshLambertMaterial color={color} map={map} /></mesh>
    </group>
  );
};

// ---------------------------------------------------------------- lights that belong to things
/** A spot light set in the parent's space (a desk lamp, a corridor lamp shining through a door). Soft shadows. */
export const Spot: React.FC<{from: V3; to: V3; color: string; intensity: number; angle: number; penumbra?: number; distance?: number; shadow?: boolean}> = ({from, to, color, intensity, angle, penumbra = 0.6, distance = 10, shadow = true}) => {
  const l = useMemo(() => {
    const s = new THREE.SpotLight(color, intensity, distance, angle, penumbra, 2);
    if (shadow) { s.castShadow = true; s.shadow.mapSize.set(2048, 2048); s.shadow.bias = -0.0006; s.shadow.normalBias = 0.02; s.shadow.radius = 2.2; s.shadow.blurSamples = 10; s.shadow.camera.near = 0.05; s.shadow.camera.far = distance; }
    return s;
  }, []);
  l.color.set(color); l.intensity = intensity; l.angle = angle; l.penumbra = penumbra; l.distance = distance;
  return <><primitive object={l} position={from} /><primitive object={l.target} position={to} /></>;
};

// ---------------------------------------------------------------- the window
/** An arched window set in a hole of a HoledWall (same x0, x1, sill, spring): painted wooden frame and glazing bars, a deep
 *  sill, faint glass, one cracked pane mended with tape, a curtain gathered on the left. Origin = the wall's left foot. */
export const ArchWindow: React.FC<{x0: number; x1: number; sill: number; spring: number; frame?: string}> = ({x0, x1, sill, spring, frame = '#4f5a52'}) => {
  const w = x1 - x0, r = w / 2, cx = (x0 + x1) / 2, bars = 12;
  const curtain = tex('lab-curtain', 200, 720, (c, W, H) => {
    for (let x = 0; x < W; x += 25) { const g = c.createLinearGradient(x, 0, x + 25, 0); g.addColorStop(0, '#5b3432'); g.addColorStop(0.5, '#7a4642'); g.addColorStop(1, '#4a2a29'); c.fillStyle = g; c.fillRect(x, 0, 25, H); }
    c.fillStyle = '#3c2322'; c.fillRect(0, H - 30, W, 30); c.fillStyle = 'rgba(220,190,140,0.5)'; for (let x = 6; x < W; x += 16) c.fillRect(x, H - 22, 6, 6);
    c.fillStyle = 'rgba(30,20,20,0.35)'; c.fillRect(0, 0, W, 18);
  });
  return (
    <group>
      {/* frame: jambs, sill board, the arch as short boxes along the curve */}
      {[x0 + 0.04, x1 - 0.04].map((x) => <B key={x} p={[x, (sill + spring) / 2, -0.06]} s={[0.08, spring - sill, 0.12]} c={frame} />)}
      <B p={[cx, sill - 0.03, -0.02]} s={[w + 0.22, 0.06, 0.4]} c="#a89a82" /><B p={[cx, sill - 0.09, 0.15]} s={[w + 0.1, 0.06, 0.04]} c="#8a7c66" cast={false} />
      {Array.from({length: bars}, (_, i) => { const a0 = (i / bars) * Math.PI, a1 = ((i + 1) / bars) * Math.PI, am = (a0 + a1) / 2, rr = r - 0.04, len = 2 * rr * Math.sin((a1 - a0) / 2) + 0.012;
        return <B key={i} p={[cx + Math.cos(am) * rr, spring + Math.sin(am) * rr, -0.06]} s={[len, 0.08, 0.12]} r={[0, 0, am + Math.PI / 2]} c={frame} />; })}
      {/* glazing bars: one upright, two cross bars, three rays in the arch */}
      <B p={[cx, (sill + spring + r) / 2, -0.08]} s={[0.035, spring + r - sill - 0.05, 0.04]} c={frame} cast />
      {[sill + (spring - sill) * 0.36, spring].map((y) => <B key={y} p={[cx, y, -0.08]} s={[w - 0.08, 0.035, 0.04]} c={frame} cast />)}
      {[0.5, 1.0, 2.14, 2.64].map((a) => <B key={a} p={[cx + Math.cos(a) * r * 0.5, spring + Math.sin(a) * r * 0.5, -0.08]} s={[r - 0.04, 0.03, 0.035]} r={[0, 0, a]} c={frame} cast />)}
      {/* glass: faint, a cracked pane taped across */}
      <mesh position={[cx, (sill + spring + r) / 2, -0.1]}><planeGeometry args={[w, spring + r - sill]} /><meshBasicMaterial color="#9fb6d8" transparent opacity={0.07} depthWrite={false} /></mesh>
      <B p={[cx + w * 0.24, sill + 0.42, -0.07]} s={[0.22, 0.03, 0.004]} r={[0, 0, 0.6]} c="#d8cfae" cast={false} /><B p={[cx + w * 0.24, sill + 0.42, -0.068]} s={[0.22, 0.03, 0.004]} r={[0, 0, -0.6]} c="#d8cfae" cast={false} />
      {/* the curtain gathered on the left, on a rod */}
      <B p={[cx, spring + r + 0.12, 0.08]} s={[w + 0.7, 0.03, 0.03]} c="#3a3430" />
      <mesh position={[x0 - 0.12, (sill - 0.25 + spring + r + 0.1) / 2, 0.09]} receiveShadow castShadow><planeGeometry args={[0.42, spring + r + 0.35 - sill]} /><meshLambertMaterial map={curtain} side={THREE.DoubleSide} /></mesh>
    </group>
  );
};

// ---------------------------------------------------------------- the machine
/** The machine: a riveted iron plinth; a standing iron ring, taller than a man, wound with copper in eight coils; two
 *  porcelain insulators with brass balls (the spark gap) on the left; a console with three needle gauges and FIVE
 *  indicator lamps on the right; a big lever beside it. Origin = the plinth's centre on the floor; the ring faces +z.
 *  lamps: how many lamps are lit from the left (or one flag each). coils: how many coils glow, clockwise from the top.
 *  needles: gauge needle angles in radians (0 = straight up). lever: 0 = up (off) .. 1 = pulled down. */
export const MACHINE = {ring: {y: 1.72, R: 1.25, r: 1.05}, plinth: [2.2, 0.44, 1.0] as V3, console: [0.74, 0.0, 0.4] as V3, lever: [0.98, 0.6, -0.3] as V3,
  leverSide: [1.06, 0.36, 0.42] as V3,
  lamp: (i: number): V3 => [0.54 + i * 0.1, 0.8, 0.47], gaps: [[-0.92, 0.32], [-0.46, 0.38]] as [number, number][]};
export const Machine: React.FC<{pos: V3; rotY?: number; lamps?: number | boolean[]; coils?: number; needles?: [number, number, number]; lever?: number;
  /** where the lever stands (machine units); default MACHINE.lever, behind the ring where the master views cannot see it.
   *  MACHINE.leverSide puts it low on the plinth's front-right corner, beside the console, in sight of the 'wide' view and
   *  with its grip at a figure's hand height (shot 9 on). */
  leverAt?: V3}> = ({pos, rotY = 0, lamps = 0, coils = 0, needles = [-0.9, -0.5, -1.1], lever = 0, leverAt = MACHINE.lever}) => {
  const {y: RY, R, r} = MACHINE.ring, mid = (R + r) / 2, th = R - r, dep = 0.22, iron = '#454c55', ironL = '#5d6670', ironD = '#30353b', copper = '#d0843e', copperD = '#8e5528';
  const lx0 = MACHINE.console[0], lit = (i: number) => (typeof lamps === 'number' ? i < lamps : !!lamps[i]);
  const dial = tex('lab-dial', 256, 256, (c) => {
    c.beginPath(); c.arc(128, 128, 126, 0, 7); c.fillStyle = '#c9a24a'; c.fill(); c.beginPath(); c.arc(128, 128, 112, 0, 7); c.fillStyle = '#efe6cc'; c.fill();
    c.lineCap = 'round'; for (let k = 0; k <= 20; k++) { const a = -Math.PI * 0.75 + (k / 20) * Math.PI * 1.5 - Math.PI / 2; c.strokeStyle = k > 15 ? '#b8362c' : '#2a2a30'; c.lineWidth = k % 5 ? 3 : 6; c.beginPath(); c.moveTo(128 + Math.cos(a) * 98, 128 + Math.sin(a) * 98); c.lineTo(128 + Math.cos(a) * (k % 5 ? 86 : 78), 128 + Math.sin(a) * (k % 5 ? 86 : 78)); c.stroke(); }
    c.strokeStyle = '#b8362c'; c.lineWidth = 8; c.beginPath(); c.arc(128, 128, 104, -Math.PI * 0.75 + Math.PI * 1.125 - Math.PI / 2, Math.PI * 0.75 - Math.PI / 2); c.stroke();
    c.fillStyle = '#2a2a30'; c.font = 'bold 26px Georgia, serif'; c.textAlign = 'center'; c.fillText('kV', 128, 186); ['0', '5', '10', '15'].forEach((t, i) => { const a = -Math.PI * 0.75 + (i / 4) * Math.PI * 1.5 - Math.PI / 2 + (i ? 0.08 : 0); c.font = '20px Georgia, serif'; c.fillText(t, 128 + Math.cos(a) * 62, 136 + Math.sin(a) * 62); });
  });
  const segs = 28, coilAt = (k: number) => Math.PI / 2 - (k * Math.PI) / 4;   // coil k centred at this angle (top first, clockwise seen from the front)
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {/* plinth: body, darker foot, top plate, side seams, rivet rows, rust runs */}
      <B p={[0, 0.06, 0]} s={[2.28, 0.12, 1.08]} c={ironD} /><B p={[0, 0.24, 0]} s={[2.2, 0.36, 1.0]} c={iron} /><B p={[0, 0.44, 0]} s={[2.26, 0.05, 1.06]} c={ironL} />
      {[-0.55, 0, 0.55].map((x) => <B key={x} p={[x, 0.24, 0.502]} s={[0.03, 0.34, 0.01]} c={ironD} cast={false} />)}
      {Array.from({length: 19}, (_, i) => -1.04 + i * 0.1156).map((x) => [0.4, 0.14].map((y) => <B key={`${x}${y}`} p={[x, y, 0.508]} s={[0.026, 0.026, 0.014]} c="#7a838c" cast={false} />))}
      {[-0.42, 0.18, 0.83].map((x, i) => <B key={x} p={[x, 0.3 - i * 0.02, 0.506]} s={[0.025 + i * 0.01, 0.16 + i * 0.05, 0.004]} c="#7a4a2c" cast={false} />)}
      {/* the ring: iron segments, a lighter flange on the front, bolts at every joint */}
      {Array.from({length: segs}, (_, i) => { const a = (i / segs) * Math.PI * 2, len = 2 * R * Math.sin(Math.PI / segs) + 0.01;
        return <group key={i} position={[0, RY, 0]} rotation={[0, 0, a]}><B p={[mid, 0, 0]} s={[th, len * (mid / R), dep]} c={iron} /><B p={[R - 0.02, 0, dep / 2 + 0.01]} s={[0.05, len, 0.02]} c={ironL} cast={false} /><B p={[r + 0.02, 0, dep / 2 + 0.01]} s={[0.04, len * (r / R), 0.02]} c={ironL} cast={false} />{i % 2 ? <B p={[mid, 0, dep / 2 + 0.025]} s={[0.035, 0.035, 0.02]} c="#8a929a" cast={false} /> : null}</group>; })}
      {/* eight coils of copper wound round the ring: a copper sleeve over the iron, cut by dark grooves between the turns */}
      {Array.from({length: 8}, (_, k) => { const on = k < coils, a0 = coilAt(k), span = 0.5, n = 5, len = 2 * mid * Math.sin(span / n / 2) + 0.006;
        return <group key={k} position={[0, RY, 0]}>
          {Array.from({length: n}, (_, j) => <group key={j} rotation={[0, 0, a0 + ((j + 0.5) / n - 0.5) * span]}><mesh position={[mid, 0, 0]} castShadow receiveShadow><boxGeometry args={[th + 0.05, len, dep + 0.05]} />{on ? <meshBasicMaterial color="#aef6ff" /> : <meshLambertMaterial color={j % 2 ? copper : '#c47a3e'} />}</mesh></group>)}
          {Array.from({length: 13}, (_, j) => <group key={`g${j}`} rotation={[0, 0, a0 + (j / 12 - 0.5) * span]}><B p={[mid, 0, 0]} s={[th + 0.056, 0.007, dep + 0.056]} c={on ? '#5fd0e0' : '#5a3418'} cast={false} /></group>)}
          {[-1, 1].map((e) => <group key={`e${e}`} rotation={[0, 0, a0 + (e * span) / 2]}><B p={[mid, 0, 0]} s={[th + 0.07, 0.02, dep + 0.07]} c={copperD} cast={false} /></group>)}
        </group>; })}
      {Array.from({length: coils}, (_, k) => <Halo key={k} pos={[Math.cos(coilAt(k)) * mid, RY + Math.sin(coilAt(k)) * mid, 0.2]} r={0.5} color="#7fe8ff" strength={0.45} />)}
      {/* cradle under the ring, posts and clamps at its sides */}
      <B p={[0, 0.5, 0]} s={[0.7, 0.1, 0.36]} c={ironD} />{[-1, 1].map((k) => <group key={k}><B p={[k * 0.28, 0.58, 0]} s={[0.1, 0.16, 0.3]} c={ironD} /><B p={[k * (R + 0.08), 1.18, 0]} s={[0.12, 1.5, 0.16]} c={iron} /><B p={[k * (R + 0.02), RY, 0]} s={[0.16, 0.14, 0.26]} c={ironL} /><B p={[k * (R + 0.08), 0.5, 0]} s={[0.26, 0.08, 0.3]} c={ironD} /></group>)}
      {/* porcelain insulators with brass balls: the spark gap */}
      {MACHINE.gaps.map(([x, z], i) => <group key={i} position={[x, 0.465, z]}>
        <FacetLathe profile={[[0.1, 0], [0.12, 0.05], [0.06, 0.08], [0.12, 0.12], [0.05, 0.16], [0.11, 0.2], [0.045, 0.24], [0.1, 0.28], [0.04, 0.32], [0.035, 0.44]]} sides={10} color="#ece4d2" contact={false} tones={[0.85, 1.05, 0.9, 1.08, 0.9, 1.1, 0.9, 1.1, 1]} />
        <FacetLathe profile={[[0.01, 0.44], [0.05, 0.46], [0.065, 0.5], [0.05, 0.55], [0.01, 0.57]]} sides={8} color="#c9a24a" contact={false} />
      </group>)}
      {/* console: case, brass trim, three gauges with needles, five indicator lamps with brass bezels and tiny plates */}
      <group position={MACHINE.console}>
        <B p={[0, 0.465 + 0.28, 0]} s={[0.58, 0.56, 0.1]} c="#2b3036" /><B p={[0, 0.465 + 0.28, 0.053]} s={[0.6, 0.58, 0.006]} c="#6a5a36" cast={false} /><B p={[0, 0.465 + 0.28, 0.058]} s={[0.55, 0.53, 0.006]} c="#2f353b" cast={false} />
        <B p={[0, 0.465 + 0.16, -0.12]} s={[0.5, 0.32, 0.2]} c={ironD} /><B p={[0, 0.465 + 0.58, -0.02]} s={[0.62, 0.04, 0.16]} c={ironD} />
        {[-0.18, 0, 0.18].map((x, i) => <group key={x} position={[x, 0.93, 0.064]}>
          <mesh><circleGeometry args={[0.075, 24]} /><meshLambertMaterial map={dial} /></mesh>
          <B p={[Math.sin(needles[i]) * 0.026, Math.cos(needles[i]) * 0.026, 0.006]} s={[0.007, 0.056, 0.004]} r={[0, 0, -needles[i]]} c="#1c1c20" cast={false} />
        </group>)}
        {Array.from({length: 5}, (_, i) => { const [lx, ly, lz] = MACHINE.lamp(i), on = lit(i); return <group key={i} position={[lx - lx0, ly, 0.07]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.02, 12]} /><meshLambertMaterial color="#b08a3a" /></mesh>
          <mesh position={[0, 0, 0.014]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.021, 0.023, 0.02, 12]} />{on ? <meshBasicMaterial color="#b8fcff" /> : <meshLambertMaterial color="#26484c" />}</mesh>
          <B p={[0, -0.05, -0.002]} s={[0.055, 0.014, 0.004]} c="#c9b07a" cast={false} />
          {on ? <Halo pos={[0, 0, 0.04]} r={0.12} color="#7fefff" strength={0.75} /> : null}
          <Halo pos={[0, 0, 0.03]} r={0.03} color="#6fd8e0" strength={on ? 0 : 0.18} />
        </group>; })}
        <B p={[0, 0.66, 0.064]} s={[0.48, 0.03, 0.006]} c="#c9b07a" cast={false} />
      </group>
      {/* the lever: a block, a pivot, a long arm with a red grip; 0 = up and back, 1 = pulled forward and down */}
      <group position={leverAt}>
        <B p={[0, -0.06, 0]} s={[0.18, 0.2, 0.22]} c={ironD} /><B p={[0.1, 0.02, 0]} s={[0.04, 0.12, 0.12]} c="#9a7a3a" />
        <group position={[0.13, 0.02, 0]} rotation={[-0.55 + lever * 1.6, 0, 0]}>
          <B p={[0, 0.36, 0]} s={[0.04, 0.72, 0.04]} c="#6a727a" />
          <FacetLathe profile={[[0.03, 0], [0.045, 0.04], [0.045, 0.16], [0.03, 0.2]]} sides={8} color="#a8322a" pos={[0, 0.7, 0]} contact={false} />
        </group>
      </group>
    </group>
  );
};

/** A heavy cable lying on the floor (or rising to a terminal): a rubber tube along points, with a lighter ridge. */
export const Cable: React.FC<{pts: V3[]; r?: number; color?: string}> = ({pts, r = 0.032, color = '#1f1e22'}) => {
  const g = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 80, r, 7, false), [JSON.stringify(pts), r]);
  return <mesh geometry={g} castShadow receiveShadow><meshLambertMaterial color={color} /></mesh>;
};

// ---------------------------------------------------------------- papers
/** A plan of the machine: 'blue' = a blueprint (white lines on blue); 'cream' = pencil on cartridge paper. */
export const paintPlan = (kind: 'blue' | 'cream', seed: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), blue = kind === 'blue', ink = blue ? 'rgba(236,244,255,0.9)' : 'rgba(60,58,62,0.85)', faint = blue ? 'rgba(236,244,255,0.13)' : 'rgba(60,58,62,0.12)';
  c.fillStyle = blue ? '#2e5a8a' : '#e8dec3'; c.fillRect(0, 0, W, H);
  const edge = c.createLinearGradient(0, 0, W, H); edge.addColorStop(0, 'rgba(0,0,0,0.08)'); edge.addColorStop(0.5, 'rgba(0,0,0,0)'); edge.addColorStop(1, 'rgba(0,0,0,0.12)'); c.fillStyle = edge; c.fillRect(0, 0, W, H);
  c.strokeStyle = faint; c.lineWidth = 1; for (let x = 0; x < W; x += 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = 3; c.strokeRect(14, 14, W - 28, H - 28);
  const v = Math.floor(r() * 3);
  if (v === 0 || blue) {   // the ring, front view, with its coils and a diameter
    const cx = W * (0.38 + r() * 0.1), cy = H * 0.46, R0 = Math.min(W, H) * 0.3;
    c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R0, 0, 7); c.stroke(); c.beginPath(); c.arc(cx, cy, R0 * 0.82, 0, 7); c.stroke();
    for (let k = 0; k < 8; k++) for (let j = -3; j <= 3; j++) { const a = Math.PI / 2 - (k * Math.PI) / 4 + j * 0.06; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + Math.cos(a) * R0 * 0.8, cy - Math.sin(a) * R0 * 0.8); c.lineTo(cx + Math.cos(a) * R0 * 1.03, cy - Math.sin(a) * R0 * 1.03); c.stroke(); }
    c.setLineDash([10, 6]); c.beginPath(); c.moveTo(cx - R0 - 20, cy); c.lineTo(cx + R0 + 20, cy); c.moveTo(cx, cy - R0 - 20); c.lineTo(cx, cy + R0 + 20); c.stroke(); c.setLineDash([]);
    const yd = cy + R0 + 34; c.beginPath(); c.moveTo(cx - R0, yd); c.lineTo(cx + R0, yd); c.stroke(); P(c, [[cx - R0, yd], [cx - R0 + 14, yd - 6], [cx - R0 + 14, yd + 6]], ink); P(c, [[cx + R0, yd], [cx + R0 - 14, yd - 6], [cx + R0 - 14, yd + 6]], ink);
    c.font = `bold 22px ${HAND}`; c.textAlign = 'center'; c.fillText('Ø 2500', cx, yd - 10);
    c.fillRect(cx - R0 * 0.5, cy + R0 * 0.98, R0, 10);
  }
  if (v === 1 && !blue) {   // a circuit: coil, capacitor, the spark gap, a battery
    c.lineWidth = 3; const y0 = H * 0.35, y1 = H * 0.68; c.beginPath(); c.moveTo(60, y0); c.lineTo(W - 60, y0); c.moveTo(60, y1); c.lineTo(W - 60, y1); c.moveTo(60, y0); c.lineTo(60, y1); c.moveTo(W - 60, y0); c.lineTo(W - 60, y1); c.stroke();
    for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(W * 0.3 + k * 22, y0, 11, Math.PI, 0); c.stroke(); }
    c.fillStyle = blue ? '#2e5a8a' : '#e8dec3'; c.fillRect(W * 0.62 - 8, y0 - 4, 16, 8); c.fillStyle = ink; c.fillRect(W * 0.62 - 10, y0 - 22, 4, 44); c.fillRect(W * 0.62 + 6, y0 - 22, 4, 44);
    c.beginPath(); c.arc(W * 0.45, y1, 9, 0, 7); c.fill(); c.beginPath(); c.arc(W * 0.45 + 34, y1, 9, 0, 7); c.fill();
    [0, 1, 2].forEach((k) => { c.fillRect(W * 0.75 + k * 18, y1 - (k % 2 ? 10 : 22), 4, k % 2 ? 20 : 44); });
    c.font = `22px ${HAND}`; c.textAlign = 'left'; c.fillText('L', W * 0.34, y0 - 26); c.fillText('C', W * 0.6, y0 - 30); c.fillText('khe phóng', W * 0.4, y1 + 40);
  }
  if (v === 2 && !blue) {   // the insulator and the plinth, side view, with rivets
    c.lineWidth = 3; const bx = W * 0.15, by = H * 0.62; c.strokeRect(bx, by, W * 0.55, H * 0.16); for (let x = bx + 16; x < bx + W * 0.55; x += 26) { c.beginPath(); c.arc(x, by + 12, 4, 0, 7); c.fill(); }
    const ix = W * 0.78; for (let k = 0; k < 6; k++) { c.beginPath(); c.ellipse(ix, by - k * 26, 34 - (k % 2) * 14, 8, 0, 0, 7); c.stroke(); } c.beginPath(); c.arc(ix, by - 170, 16, 0, 7); c.stroke();
    c.font = `22px ${HAND}`; c.textAlign = 'left'; c.fillText('chóp sứ', ix - 40, by + 40); c.fillText('bệ tán đinh', bx, by - 14);
  }
  // notes as pencil bars, a title block, a stain, a fold
  c.lineWidth = 2; for (let k = 0; k < 5; k++) { c.fillStyle = ink; c.globalAlpha = 0.55; c.fillRect(W * 0.66, H * 0.12 + k * 20, 40 + r() * 80, 4); } c.globalAlpha = 1;
  c.strokeStyle = ink; c.strokeRect(W - 200, H - 82, 172, 56); c.beginPath(); c.moveTo(W - 200, H - 54); c.lineTo(W - 28, H - 54); c.stroke();
  c.fillStyle = ink; c.font = `bold 18px ${HAND}`; c.textAlign = 'left'; c.fillText(`CỖ MÁY · tờ ${1 + Math.floor(r() * 9)}`, W - 192, H - 61); c.font = `16px ${HAND}`; c.fillText('tỉ lệ 1 : 25', W - 192, H - 34);
  if (!blue) { c.strokeStyle = 'rgba(120,80,40,0.35)'; c.lineWidth = 6; c.beginPath(); c.arc(W * (0.2 + r() * 0.5), H * (0.2 + r() * 0.5), 34, 0.3, 5.6); c.stroke(); c.strokeStyle = 'rgba(190,40,40,0.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.66, H * 0.12 + 92); c.lineTo(W * 0.66 + 120, H * 0.12 + 90); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(W * 0.5 - 2, 0, 4, H);
};
/** One pinned sheet on a wall: the picture, a pin in each top corner (or four), lying a few degrees off level. x, y = centre. */
export const Sheet: React.FC<{map: THREE.Texture; x: number; y: number; w: number; h: number; rot?: number; z?: number; pins?: 2 | 4; pin?: string}> = ({map, x, y, w, h, rot = 0, z = 0.01, pins = 2, pin = '#c8372d'}) => (
  <group position={[x, y, z]} rotation={[0, 0, (rot * Math.PI) / 180]}>
    <mesh receiveShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={map} /></mesh>
    {(pins === 4 ? [[-1, 1], [1, 1], [-1, -1], [1, -1]] : [[-1, 1], [1, 1]]).map(([a, b], i) => <mesh key={i} position={[a * (w / 2 - 0.025), b * (h / 2 - 0.025), 0.006]}><circleGeometry args={[0.012, 10]} /><meshLambertMaterial color={pin} /></mesh>)}
  </group>
);

/** THE CALCULATION SHEET pinned to the blackboard (shot 6): cream paper, ruled, a red margin, the heading "Cỗ máy" and six
 *  lines of working. Line 5 holds the wrong figure (18 240 x 0,5 is 9 120, not 9 210). The right quarter is left clear for
 *  the ticks of shot 6. CALC_LINES = the centre of each line as a fraction of the sheet height from the TOP, and where the
 *  tick column is (fraction of the width from the left). */
export const CALC_LINES = {y: [0.262, 0.372, 0.482, 0.592, 0.702, 0.812], tickX: 0.86, textRight: 0.79, heading: 0.12};
export const calcSheetTex = () => tex('lab-calc', 640, 840, (c, W, H) => {
  c.fillStyle = '#efe5c9'; c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(W * 0.5, H * 0.45, 100, W * 0.5, H * 0.5, W * 0.8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(110,80,40,0.16)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(80,110,170,0.28)'; for (let y = 172; y < H - 40; y += 92.4) c.fillRect(30, y + 26, W - 60, 2);
  c.fillStyle = 'rgba(200,70,70,0.45)'; c.fillRect(70, 0, 2, H);
  c.fillStyle = '#22304e'; c.font = `bold 74px ${HAND}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('Cỗ máy', 100, H * CALC_LINES.heading);
  c.fillRect(100, H * CALC_LINES.heading + 42, 250, 4);
  const lines = ['R = 1,25 m    n = 240', 'L = 2π · R · n = 1885 m', 'U = 380 V    I = 48 A', 'P = U · I = 18 240 W', 'W = 18 240 · 0,5 = 9 210 J', 'f = 1 / 2π√(LC) ≈ 4,7 MHz'];
  lines.forEach((t, i) => { c.font = `34px ${HAND}`; c.fillStyle = '#22304e'; c.fillText(`${i + 1}.`, 84, H * CALC_LINES.y[i]); c.fillText(t, 128, H * CALC_LINES.y[i], W * CALC_LINES.textRight - 128); });
  // a struck-out first try on line 2, a small arrow, initials, a coffee ring
  c.strokeStyle = '#22304e'; c.lineWidth = 3; c.font = `24px ${HAND}`; c.fillText('1508', 440, H * CALC_LINES.y[1] - 40); c.beginPath(); c.moveTo(434, H * CALC_LINES.y[1] - 40); c.lineTo(500, H * CALC_LINES.y[1] - 44); c.stroke();
  c.font = `italic 30px ${HAND}`; c.fillText('— V. v. D.', W - 220, H - 50);
  c.strokeStyle = 'rgba(120,80,40,0.3)'; c.lineWidth = 7; c.beginPath(); c.arc(140, H - 90, 46, 0.6, 5.9); c.stroke();
});

/** The blackboard: slate full of chalk, half wiped. */
export const boardTex = () => tex('lab-board', 1400, 1000, (c, W, H) => {
  const r = rnd(41); c.fillStyle = '#27312d'; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 30; k++) { c.strokeStyle = `rgba(225,232,222,${0.03 + r() * 0.05})`; c.lineWidth = 40 + r() * 60; c.beginPath(); const x = r() * W, y = r() * H; c.arc(x, y, 60 + r() * 140, r() * 6, r() * 6 + 2.4); c.stroke(); }
  const chalk = (t: string, x: number, y: number, s: number, a = 0.9) => { c.font = `${s}px ${HAND}`; c.fillStyle = `rgba(240,242,232,${a})`; c.textAlign = 'left'; c.fillText(t, x, y); };
  chalk('∮ E · dl = − dΦ / dt', 470, 110, 54); chalk('B = μ₀ · n · I', 760, 230, 50); chalk('ω = 1 / √(LC)', 790, 350, 50); chalk('Φ = B · S', 770, 470, 46, 0.8);
  chalk('λ = c / f', 1040, 600, 46, 0.75); chalk('t = 0,5 s  ?', 760, 700, 48); chalk('E ∝ I² · t', 1000, 820, 46, 0.85); chalk('n = 240 vòng', 470, 900, 44, 0.7);
  c.strokeStyle = 'rgba(240,242,232,0.85)'; c.lineWidth = 6; c.beginPath(); c.arc(1180, 330, 120, 0, 7); c.stroke(); c.beginPath(); c.arc(1180, 330, 92, 0, 7); c.stroke();
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.beginPath(); c.moveTo(1180 + Math.cos(a) * 90, 330 + Math.sin(a) * 90); c.lineTo(1180 + Math.cos(a) * 124, 330 + Math.sin(a) * 124); c.stroke(); }
  c.beginPath(); c.moveTo(1040, 520); c.quadraticCurveTo(1110, 470, 1120, 440); c.stroke(); P(c, [[1120, 436], [1104, 462], [1128, 458]], 'rgba(240,242,232,0.85)');
  c.fillStyle = 'rgba(240,242,232,0.55)'; for (let k = 0; k < 6; k++) c.fillRect(470 + (k % 2) * 30, 560 + k * 46, 160 + r() * 160, 6);
  c.strokeStyle = 'rgba(246,200,120,0.85)'; c.lineWidth = 5; c.beginPath(); c.moveTo(752, 718); c.lineTo(1010, 712); c.stroke();
});

/** The mother's portrait: a woman with dark hair in a bun, a shawl round her shoulders, a gentle smile; sepia, a cream mat. */
export const portraitTex = () => tex('lab-mother', 400, 500, (c, W, H) => {
  c.fillStyle = '#efe4c8'; c.fillRect(0, 0, W, H);
  const x0 = 34, y0 = 34, w = W - 68, h = H - 68, bg = c.createRadialGradient(W / 2, H * 0.4, 30, W / 2, H * 0.45, 260); bg.addColorStop(0, '#c9b08a'); bg.addColorStop(1, '#7d6448');
  c.fillStyle = bg; c.fillRect(x0, y0, w, h); c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
  const cx = W / 2;
  // shawl over the shoulders, a fringe, a dress under it
  P(c, [[cx - 180, H], [cx - 150, 360], [cx - 70, 310], [cx, 330], [cx + 70, 310], [cx + 150, 360], [cx + 180, H]], '#6e3f47');
  P(c, [[cx - 60, 316], [cx, 400], [cx + 60, 316], [cx + 30, 312], [cx, 350], [cx - 30, 312]], '#3a2a2e');
  c.strokeStyle = '#5a3038'; c.lineWidth = 3; for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(cx - 140 + k * 10, 380 + k * 16); c.quadraticCurveTo(cx - 60, 400 + k * 10, cx - 20 + k * 6, H); c.stroke(); c.beginPath(); c.moveTo(cx + 140 - k * 10, 380 + k * 16); c.quadraticCurveTo(cx + 60, 400 + k * 10, cx + 20 - k * 6, H); c.stroke(); }
  c.fillStyle = '#8a5560'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(cx - 110 + k * 44, 372 + Math.abs(k - 2.5) * 10, 6, 0, 7); c.fill(); }
  // neck, face, ears
  c.fillStyle = '#d9b892'; c.fillRect(cx - 26, 250, 52, 70); c.fillStyle = 'rgba(120,80,50,0.25)'; c.fillRect(cx - 26, 250, 52, 22);
  c.beginPath(); c.ellipse(cx, 196, 72, 90, 0, 0, 7); c.fillStyle = '#e4c4a0'; c.fill();
  c.beginPath(); c.ellipse(cx + 22, 210, 44, 70, 0, 0, 7); c.fillStyle = 'rgba(120,80,50,0.10)'; c.fill();
  // hair: parted in the middle, swept back to a bun at the crown
  c.beginPath(); c.arc(cx + 4, 92, 46, 0, 7); c.fillStyle = '#2a2024'; c.fill(); c.beginPath(); c.arc(cx - 8, 86, 22, 0, 7); c.fillStyle = '#3a2e30'; c.fill();
  c.beginPath(); c.moveTo(cx, 112); c.bezierCurveTo(cx - 70, 104, cx - 86, 150, cx - 76, 210); c.lineTo(cx - 64, 206); c.bezierCurveTo(cx - 62, 160, cx - 40, 132, cx, 128); c.bezierCurveTo(cx + 40, 132, cx + 62, 160, cx + 64, 206); c.lineTo(cx + 76, 210); c.bezierCurveTo(cx + 86, 150, cx + 70, 104, cx, 112); c.fillStyle = '#2a2024'; c.fill();
  c.strokeStyle = 'rgba(120,100,100,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, 114); c.lineTo(cx, 130); c.stroke();
  // brows, smiling closed-arc eyes, nose, a gentle smile, cheeks
  c.strokeStyle = '#3a2a26'; c.lineWidth = 4; c.lineCap = 'round';
  [-1, 1].forEach((k) => { c.beginPath(); c.moveTo(cx + k * 18, 162); c.quadraticCurveTo(cx + k * 34, 154, cx + k * 48, 160); c.stroke(); c.beginPath(); c.moveTo(cx + k * 20, 186); c.quadraticCurveTo(cx + k * 33, 176, cx + k * 46, 186); c.stroke(); c.beginPath(); c.arc(cx + k * 40, 220, 14, 0, 7); c.fillStyle = 'rgba(210,120,110,0.28)'; c.fill(); });
  c.lineWidth = 3; c.beginPath(); c.moveTo(cx + 2, 196); c.quadraticCurveTo(cx + 8, 222, cx - 4, 226); c.stroke();
  c.strokeStyle = '#8a3a3a'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - 22, 246); c.quadraticCurveTo(cx, 262, cx + 22, 246); c.stroke();
  c.restore();
  // sepia wash and age
  c.fillStyle = 'rgba(150,110,60,0.16)'; c.fillRect(x0, y0, w, h); c.strokeStyle = 'rgba(90,70,40,0.4)'; c.lineWidth = 3; c.strokeRect(x0, y0, w, h);
  c.fillStyle = 'rgba(255,250,235,0.18)'; P(c, [[x0, y0], [x0 + 120, y0], [x0, y0 + 160]], 'rgba(255,250,235,0.14)');
});
/** A pressed dried flower (transparent picture lying on the desk). */
export const flowerTex = () => tex('lab-flower', 256, 256, (c) => {
  c.strokeStyle = '#6a6a3a'; c.lineWidth = 5; c.beginPath(); c.moveTo(40, 230); c.quadraticCurveTo(110, 170, 150, 100); c.stroke();
  P(c, [[90, 180], [60, 150], [100, 160]], '#7a7a44'); P(c, [[120, 150], [150, 160], [128, 136]], '#7a7a44');
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; c.beginPath(); c.ellipse(158 + Math.cos(a) * 30, 88 + Math.sin(a) * 30, 28, 14, a, 0, 7); c.fillStyle = k % 2 ? '#9a7aa8' : '#8a6a98'; c.fill(); }
  c.beginPath(); c.arc(158, 88, 13, 0, 7); c.fillStyle = '#c9a24a'; c.fill();
});
/** Plans spread flat on the desk. */
export const deskPlanTex = () => tex('lab-deskplan', 720, 520, paintPlan('cream', 77));

// ---------------------------------------------------------------- the desk and what is on it
/** DESK_SPOTS: where things stand on the desk, in the desk's own units (origin = centre of the top, +z = the front edge,
 *  the side away from the man working at it; the drawers are under the left end). Used by the scene to tell the next stage where to point the close shots. */
export const DESK = {w: 1.9, d: 0.8, h: 0.8, lamp: [-0.55, 0, -0.22] as V3, bulb: [-0.67, 0.44, -0.12] as V3, photo: [-0.82, 0, -0.04] as V3, flower: [-0.6, 0, 0.1] as V3, cup: [0.78, 0, 0.22] as V3, plan: [0.1, 0, 0.06] as V3, books: [0.66, 0, -0.16] as V3, pencil: [-0.62, 0, 0.3] as V3};
export const LabDesk: React.FC<{pos: V3; rotY?: number; lampOn?: boolean}> = ({pos, rotY = 0, lampOn = true}) => {
  const {w, d, h} = DESK, wood = '#7a5638', woodD = '#5a3e28', woodL = '#93694a';
  const top = tex('lab-desktop', 1024, 432, (c, W, H) => {
    const r = rnd(9); c.fillStyle = '#efefef'; c.fillRect(0, 0, W, H); for (let k = 1; k < 4; k++) { c.fillStyle = '#cfcfcf'; c.fillRect(0, (H / 4) * k, W, 3); }
    for (let k = 0; k < 40; k++) { c.strokeStyle = `rgba(70,50,30,${0.1 + r() * 0.14})`; c.lineWidth = 1.5 + r() * 2; const y = r() * H, x0 = r() * W * 0.6; c.beginPath(); c.moveTo(x0, y); c.bezierCurveTo(x0 + 90, y + (r() - 0.5) * 8, x0 + 200, y + (r() - 0.5) * 8, x0 + 160 + r() * 300, y + (r() - 0.5) * 6); c.stroke(); }
    c.fillStyle = 'rgba(30,30,60,0.4)'; c.beginPath(); c.ellipse(W * 0.3, H * 0.7, 26, 14, 0.4, 0, 7); c.fill(); c.strokeStyle = 'rgba(90,50,30,0.35)'; c.lineWidth = 6; c.beginPath(); c.arc(W * 0.84, H * 0.62, 36, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(40,20,10,0.4)'; c.lineWidth = 3; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(W * 0.55 + k * 9, H * 0.86); c.lineTo(W * 0.6 + k * 9, H * 0.92); c.stroke(); }
  });
  const photo = portraitTex(), [px, , pz] = DESK.photo;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {/* top with grain, an apron, four legs, a stretcher; a drawer unit under the right end */}
      <mesh position={[0, h - 0.025, 0]} castShadow receiveShadow><boxGeometry args={[w, 0.05, d]} /><meshLambertMaterial color={woodL} map={top} /></mesh>
      <B p={[0, h - 0.1, d / 2 - 0.04]} s={[w - 0.1, 0.1, 0.03]} c={wood} /><B p={[0, h - 0.1, -d / 2 + 0.04]} s={[w - 0.1, 0.1, 0.03]} c={woodD} />
      {[-1, 1].map((a) => [-1, 1].map((b) => <B key={`${a}${b}`} p={[a * (w / 2 - 0.06), (h - 0.05) / 2, b * (d / 2 - 0.06)]} s={[0.07, h - 0.05, 0.07]} c={woodD} />))}
      <B p={[w / 2 - 0.06, 0.14, 0]} s={[0.04, 0.05, d - 0.12]} c={woodD} cast={false} />
      <B p={[-w / 2 + 0.3, 0.42, 0]} s={[0.46, 0.5, d - 0.1]} c={wood} /><B p={[-w / 2 + 0.3, 0.55, d / 2 - 0.04]} s={[0.4, 0.18, 0.02]} c={woodL} cast={false} /><B p={[-w / 2 + 0.3, 0.32, d / 2 - 0.04]} s={[0.4, 0.2, 0.02]} c={woodL} cast={false} />
      {[0.55, 0.32].map((y) => <B key={y} p={[-w / 2 + 0.3, y, d / 2 - 0.02]} s={[0.08, 0.02, 0.025]} c="#c9a24a" cast={false} />)}
      <group position={[0, h, 0]}>
        {/* the plans spread out, a second sheet curling under */}
        <mesh position={[DESK.plan[0], 0.002, DESK.plan[2]]} rotation={[-Math.PI / 2, 0, 0.08]} receiveShadow><planeGeometry args={[0.78, 0.56]} /><meshLambertMaterial map={deskPlanTex()} /></mesh>
        <mesh position={[DESK.plan[0] - 0.2, 0.001, DESK.plan[2] - 0.08]} rotation={[-Math.PI / 2, 0, -0.2]} receiveShadow><planeGeometry args={[0.6, 0.42]} /><meshLambertMaterial color="#d9cfb2" /></mesh>
        {/* the lamp: weighted brass foot, stem, arm, green shade, warm bulb */}
        <group position={DESK.lamp}>
          <FacetLathe profile={[[0.11, 0], [0.11, 0.025], [0.07, 0.04], [0.03, 0.05]]} sides={12} color="#a8843a" contact={false} />
          <B p={[0, 0.2, 0]} s={[0.022, 0.38, 0.022]} c="#a8843a" /><B p={[-0.06, 0.39, 0.05]} s={[0.022, 0.022, 0.2]} r={[0, 0.9, 0]} c="#a8843a" />
          <group position={[DESK.bulb[0] - DESK.lamp[0], DESK.bulb[1], DESK.bulb[2] - DESK.lamp[2]]}>
            <FacetLathe profile={[[0.17, -0.1], [0.165, -0.085], [0.12, -0.01], [0.06, 0.05], [0.03, 0.07]]} sides={14} color="#2f6a4a" contact={false} tones={[1.2, 0.95, 1.08, 1]} />
            <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.04, 0.035, 0.06, 10]} /><meshBasicMaterial color={lampOn ? '#fff1c8' : '#8a8478'} /></mesh>
            <mesh position={[0, -0.095, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.16, 14]} /><meshBasicMaterial color={lampOn ? '#ffe2a0' : '#3a3630'} transparent opacity={lampOn ? 0.55 : 0.9} side={THREE.DoubleSide} depthWrite={false} /></mesh>
          </group>
        </group>
        {/* the mother's photograph in a small wooden frame, standing on its strut, turned towards the room */}
        <group position={[px, 0, pz]} rotation={[0, -0.35, 0]}>
          <group position={[0, 0.115, 0]} rotation={[-0.2, 0, 0]}>
            <B p={[0, 0, 0]} s={[0.19, 0.235, 0.02]} c="#5a3a24" /><B p={[0, 0.112, 0.012]} s={[0.19, 0.012, 0.006]} c="#7a5434" cast={false} />
            <mesh position={[0, 0, 0.0105]}><planeGeometry args={[0.16, 0.2]} /><meshLambertMaterial map={photo} /></mesh>
            <mesh position={[0, 0, 0.012]}><planeGeometry args={[0.16, 0.2]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.05} depthWrite={false} /></mesh>
          </group>
          <B p={[0, 0.07, -0.06]} s={[0.03, 0.15, 0.012]} r={[0.5, 0, 0]} c="#4a2e1c" />
        </group>
        <mesh position={[DESK.flower[0], 0.004, DESK.flower[2]]} rotation={[-Math.PI / 2, 0, 0.5]}><planeGeometry args={[0.16, 0.16]} /><meshLambertMaterial map={flowerTex()} transparent alphaTest={0.05} /></mesh>
        {/* books: a leaning stack, one open; an ink pot; pencils and an eraser at the front edge */}
        <group position={DESK.books}>
          {[['#6a2e2a', 0.05, 0.04], ['#2e4a6a', 0.045, -0.05], ['#4a5a32', 0.05, 0.1]].map(([col, t, a], i, arr) => { const y = arr.slice(0, i).reduce((s, q) => s + (q[1] as number), 0); return <group key={i}><B p={[0.01 * i, y + (t as number) / 2, 0]} s={[0.3, t as number, 0.22]} r={[0, a as number, 0]} c={col as string} /><B p={[0.01 * i + 0.002, y + (t as number) / 2, 0.112]} s={[0.28, (t as number) - 0.012, 0.004]} r={[0, a as number, 0]} c="#e6dcc4" cast={false} /></group>; })}
        </group>
        <group position={[0.4, 0, 0.2]} rotation={[0, -0.25, 0]}><B p={[-0.085, 0.012, 0]} s={[0.17, 0.024, 0.24]} c="#5a2e2a" /><B p={[0.085, 0.012, 0]} s={[0.17, 0.024, 0.24]} c="#5a2e2a" /><mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.32, 0.22]} /><meshLambertMaterial map={tex('lab-openbook', 320, 220, (c, W, H) => { c.fillStyle = '#efe6cf'; c.fillRect(0, 0, W, H); c.fillStyle = '#d4c9ac'; c.fillRect(W / 2 - 3, 0, 6, H); c.fillStyle = 'rgba(40,40,60,0.55)'; for (let y = 20; y < H - 10; y += 12) { c.fillRect(14, y, W / 2 - 34 - ((y * 7) % 26), 3); c.fillRect(W / 2 + 14, y, W / 2 - 34 - ((y * 11) % 30), 3); } c.strokeStyle = 'rgba(40,40,60,0.7)'; c.lineWidth = 2; c.beginPath(); c.arc(W * 0.75, H * 0.5, 30, 0, 7); c.stroke(); })} /></mesh></group>
        <FacetLathe profile={[[0.03, 0], [0.035, 0.04], [0.015, 0.055], [0.012, 0.065]]} sides={8} color="#1c2a3a" pos={[0.05, 0, -0.26]} contact={false} />
        <B p={DESK.pencil.map((v, i) => (i === 1 ? 0.006 : v)) as V3} s={[0.17, 0.012, 0.012]} r={[0, 0.4, 0]} c="#e0b030" /><B p={[DESK.pencil[0] + 0.1, 0.006, DESK.pencil[2] + 0.02]} s={[0.15, 0.012, 0.012]} r={[0, -0.2, 0]} c="#3a5a7a" /><B p={[DESK.pencil[0] - 0.12, 0.012, DESK.pencil[2] - 0.01]} s={[0.05, 0.024, 0.03]} r={[0, 0.3, 0]} c="#d88a8a" />
        {/* coffee: a cup on a saucer, cold, a spoon */}
        <group position={DESK.cup}>
          <FacetLathe profile={[[0.07, 0], [0.075, 0.01], [0.04, 0.014]]} sides={12} color="#e8e2d4" contact={false} />
          <FacetLathe profile={[[0.03, 0.012], [0.042, 0.03], [0.046, 0.09], [0.044, 0.094]]} sides={12} color="#ece6d8" contact={false} tones={[0.9, 1.05, 1.1]} />
          <mesh position={[0, 0.082, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.04, 12]} /><meshLambertMaterial color="#3a2418" /></mesh>
          <B p={[0.055, 0.055, 0]} s={[0.022, 0.05, 0.012]} c="#ece6d8" /><B p={[-0.05, 0.016, 0.04]} s={[0.08, 0.006, 0.012]} r={[0, 0.5, 0]} c="#b8b4aa" />
        </group>
        {/* crumpled sheets */}
        {[[0.2, 0.3], [-0.12, -0.3], [0.42, -0.32], [-0.86, 0.28]].map(([x, z], i) => <FacetLathe key={i} profile={[[0.03, 0], [0.05, 0.02], [0.048, 0.05], [0.025, 0.075]]} sides={7} wobble={0.35} seed={i + 3} color="#f2ead6" s={0.8} pos={[x, 0, z]} contact={false} />)}
        {/* a rack of test tubes at the left end, nearest the machine */}
        <group position={[0.3, 0, -0.3]}><B p={[0, 0.06, 0]} s={[0.22, 0.012, 0.06]} c="#8a6644" /><B p={[0, 0.01, 0]} s={[0.22, 0.02, 0.06]} c="#7a5634" />{[-0.08, 0.08].map((x) => <B key={x} p={[x, 0.035, 0]} s={[0.012, 0.05, 0.05]} c="#7a5634" />)}
          {[-0.07, -0.025, 0.025, 0.07].map((x, i) => <FacetLathe key={x} profile={[[0.008, 0], [0.012, 0.01], [0.012, 0.12]]} sides={6} color={['#9fd8c8', '#d8e2e8', '#e0a070', '#d8e2e8'][i]} pos={[x, 0.02, 0]} contact={false} />)}</group>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- other furniture
/** A plain three-legged stool with a worn round seat. */
export const Stool: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <FacetLathe profile={[[0.17, 0.5], [0.18, 0.52], [0.18, 0.56], [0.16, 0.57]]} sides={12} color="#8a6644" contact={false} tones={[0.8, 1.05, 1.15]} />
    {[0, 2.09, 4.19].map((a) => <B key={a} p={[Math.cos(a) * 0.12, 0.25, Math.sin(a) * 0.12]} s={[0.035, 0.52, 0.035]} r={[Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12]} c="#6a4c30" />)}
    {[0, 2.09, 4.19].map((a) => <B key={`r${a}`} p={[Math.cos(a + 1.05) * 0.065, 0.18, Math.sin(a + 1.05) * 0.065]} s={[0.13, 0.02, 0.02]} r={[0, -(a + 1.05) + Math.PI / 2, 0]} c="#6a4c30" cast={false} />)}
  </group>
);
/** A single iron bed, made but slept in: tube frame with upright bars at head and foot, a thin mattress, a grey blanket
 *  thrown back, a pillow. Origin = the middle of the head end on the floor; the bed runs along +z. */
export const IronBed: React.FC<{pos: V3; rotY?: number; L?: number; W?: number}> = ({pos, rotY = 0, L = 1.95, W = 0.88}) => {
  const iron = '#2e3236';
  const end = (z: number, h: number) => <group position={[0, 0, z]}>{[-W / 2, W / 2].map((x) => <B key={x} p={[x, h / 2, 0]} s={[0.035, h, 0.035]} c={iron} />)}<B p={[0, h, 0]} s={[W + 0.04, 0.035, 0.035]} c={iron} /><B p={[0, 0.34, 0]} s={[W, 0.03, 0.03]} c={iron} />{Array.from({length: 6}, (_, i) => <B key={i} p={[-W / 2 + ((i + 1) * W) / 7, (0.34 + h) / 2, 0]} s={[0.018, h - 0.34, 0.018]} c={iron} cast={false} />)}</group>;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {end(0.03, 1.02)}{end(L - 0.03, 0.78)}
      {[-W / 2, W / 2].map((x) => <B key={x} p={[x, 0.32, L / 2]} s={[0.03, 0.05, L]} c={iron} />)}
      <B p={[0, 0.41, L / 2]} s={[W - 0.04, 0.13, L - 0.1]} c="#c9c0a8" /><B p={[0, 0.41, L / 2]} s={[W - 0.02, 0.02, L - 0.08]} c="#a89c84" cast={false} />
      <B p={[0, 0.5, 0.3]} s={[0.56, 0.1, 0.34]} c="#e6e0d0" r={[0.1, 0.05, 0]} />
      <B p={[0, 0.5, 1.25]} s={[W + 0.02, 0.07, 1.25]} c="#5a6676" r={[0, 0.03, 0]} /><B p={[0.03, 0.55, 0.72]} s={[W - 0.04, 0.1, 0.28]} c="#6a7686" r={[0.2, 0.06, 0]} />
      {[0.7, 1.1, 1.5].map((z) => <B key={z} p={[0, 0.538, z]} s={[W + 0.03, 0.006, 0.03]} c="#7a4a40" cast={false} />)}
      <B p={[W / 2 + 0.02, 0.33, 1.3]} s={[0.02, 0.3, 0.9]} c="#5a6676" cast={false} />
    </group>
  );
};
/** A pendulum clock on a wall: a tall dark case, a cream face (hands at twenty to midnight), a glazed door with the brass
 *  bob behind it. Origin = the middle of the case's back, at its foot; it faces +z. */
export const PendulumClock: React.FC<{pos: V3; rotY?: number; swing?: number; /** the time shown, [hours, minutes]; default twenty to midnight */ time?: [number, number]}> = ({pos, rotY = 0, swing = 0.08, time = [11, 40]}) => {
  const [hh, mm] = time;
  const face = tex(hh === 11 && mm === 40 ? 'lab-clockface' : `lab-clockface-${hh}-${mm}`, 256, 256, (c) => {
    c.beginPath(); c.arc(128, 128, 124, 0, 7); c.fillStyle = '#c9a24a'; c.fill(); c.beginPath(); c.arc(128, 128, 112, 0, 7); c.fillStyle = '#efe6cc'; c.fill();
    c.fillStyle = '#2a2420'; c.font = 'bold 22px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((t, k) => { const a = (k / 12) * Math.PI * 2 - Math.PI / 2; c.fillText(t, 128 + Math.cos(a) * 88, 128 + Math.sin(a) * 88); });
    c.strokeStyle = '#1e1a18'; c.lineCap = 'round'; const hand = (a: number, l: number, wdt: number) => { c.lineWidth = wdt; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.cos(a - Math.PI / 2) * l, 128 + Math.sin(a - Math.PI / 2) * l); c.stroke(); };
    hand(((hh + mm / 60) / 12) * Math.PI * 2, 52, 8); hand((mm / 60) * Math.PI * 2, 78, 5); c.beginPath(); c.arc(128, 128, 7, 0, 7); c.fillStyle = '#1e1a18'; c.fill();
  });
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <B p={[0, 0.55, 0.08]} s={[0.36, 1.1, 0.16]} c="#4a2e1e" /><B p={[0, 1.16, 0.09]} s={[0.42, 0.1, 0.19]} c="#3a2216" /><B p={[0, 1.24, 0.08]} s={[0.24, 0.07, 0.15]} c="#3a2216" /><B p={[0, -0.03, 0.09]} s={[0.4, 0.06, 0.18]} c="#3a2216" />
      <mesh position={[0, 0.88, 0.165]}><circleGeometry args={[0.14, 24]} /><meshLambertMaterial map={face} /></mesh>
      <B p={[0, 0.36, 0.16]} s={[0.26, 0.6, 0.006]} c="#20140e" cast={false} />
      <group position={[0, 0.68, 0.165]} rotation={[0, 0, swing]}><B p={[0, -0.2, 0]} s={[0.012, 0.4, 0.004]} c="#b08a3a" cast={false} /><mesh position={[0, -0.42, 0.002]}><circleGeometry args={[0.06, 16]} /><meshLambertMaterial color="#c9a24a" /></mesh></group>
      <mesh position={[0, 0.36, 0.172]}><planeGeometry args={[0.26, 0.6]} /><meshBasicMaterial color="#c8d8f0" transparent opacity={0.08} depthWrite={false} /></mesh>
      {[-1, 1].map((k) => <B key={k} p={[k * 0.15, 0.36, 0.17]} s={[0.03, 0.64, 0.01]} c="#5a3a26" cast={false} />)}
    </group>
  );
};
/** A wall shelf on two brackets, set a little out of level, with books leaning and lying. `tilt` in radians. */
export const CrookedShelf: React.FC<{pos: V3; w: number; tilt?: number; seed?: number; rotY?: number}> = ({pos, w, tilt = 0.035, seed = 1, rotY = 0}) => {
  const books = useMemo(() => { const r = rnd(seed), out: [number, number, number, number, string][] = []; let x = -w / 2 + 0.05; while (x < w / 2 - 0.08) { const lying = r() < 0.12, t = 0.03 + r() * 0.04, h = 0.18 + r() * 0.12, lean = r() < 0.2 ? (r() - 0.3) * 0.5 : 0; out.push([x + (lying ? 0.12 : t / 2), lying ? 1 : 0, t, lying ? 0 : h, ['#6a2e2a', '#2e4a6a', '#4a5a32', '#8a6a3a', '#3a2e3e', '#a8843a', '#5a3a2a'][Math.floor(r() * 7)]]); if (!lying && lean) out[out.length - 1][1] = lean + 2; x += lying ? 0.28 : t + 0.006 + (r() < 0.08 ? 0.1 : 0); } return out; }, [w, seed]);
  return (
    <group position={pos} rotation={[0, rotY, 0]}><group rotation={[0, 0, tilt]}>
      <B p={[0, 0, 0.12]} s={[w, 0.03, 0.24]} c="#6a4a30" />{[-w / 2 + 0.12, w / 2 - 0.12].map((x) => <B key={x} p={[x, -0.08, 0.04]} s={[0.025, 0.14, 0.08]} c="#3a3430" />)}
      {books.map(([x, kind, t, h, col], i) => kind === 1 ? <B key={i} p={[x, 0.015 + 0.02, 0.12]} s={[0.24, 0.04, 0.18]} c={col} r={[0, 0.1, 0]} /> : <B key={i} p={[x, 0.015 + h / 2, 0.12]} s={[t, h, 0.18]} c={col} r={[0, 0, kind > 1 ? -(kind - 2) : 0]} />)}
    </group></group>
  );
};
/** A shelf of glassware: a retort with its bent neck, round flasks with coloured liquid, a rack of test tubes, a jar. */
export const GlassShelf: React.FC<{pos: V3; w?: number; rotY?: number}> = ({pos, w = 1.0, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <B p={[0, 0, 0.13]} s={[w, 0.03, 0.26]} c="#6a4a30" />{[-w / 2 + 0.1, w / 2 - 0.1].map((x) => <B key={x} p={[x, -0.09, 0.05]} s={[0.025, 0.16, 0.1]} c="#3a3430" />)}
    <group position={[-w / 2 + 0.2, 0.015, 0.13]}>
      <FacetLathe profile={[[0.02, 0], [0.08, 0.03], [0.1, 0.09], [0.08, 0.16], [0.03, 0.19]]} sides={12} color="#b8d0c8" contact={false} tones={[0.9, 1, 1.15, 1.1]} />
      <FacetLathe profile={[[0.02, 0.002], [0.08, 0.03], [0.095, 0.07]]} sides={12} color="#6aa89a" contact={false} />
      <B p={[0.12, 0.24, 0]} s={[0.24, 0.025, 0.025]} r={[0, 0, -0.5]} c="#c8dcd4" /><B p={[0.03, 0.2, 0]} s={[0.03, 0.05, 0.03]} c="#c8dcd4" />
    </group>
    {[[-0.05, '#c86a5a', 0.075], [0.12, '#d8c86a', 0.06]].map(([x, col, rr]) => <group key={x as number} position={[x as number, 0.015, 0.12]}>
      <FacetLathe profile={[[0.02, 0], [(rr as number) * 0.9, 0.03], [rr as number, 0.08], [(rr as number) * 0.8, 0.13], [0.022, 0.16], [0.02, 0.26], [0.026, 0.27]]} sides={12} color="#c8dcd4" contact={false} tones={[0.95, 1, 1.12, 1.05, 1.1, 1.2]} />
      <FacetLathe profile={[[0.02, 0.002], [(rr as number) * 0.9, 0.03], [(rr as number) * 0.98, 0.065]]} sides={12} color={col as string} contact={false} />
    </group>)}
    <group position={[w / 2 - 0.22, 0.015, 0.12]}><B p={[0, 0.07, 0]} s={[0.2, 0.012, 0.06]} c="#8a6644" /><B p={[0, 0.01, 0]} s={[0.2, 0.02, 0.06]} c="#7a5634" />{[-0.07, 0.07].map((x) => <B key={x} p={[x, 0.04, 0]} s={[0.012, 0.06, 0.05]} c="#7a5634" />)}
      {[-0.06, -0.02, 0.02, 0.06].map((x, i) => <FacetLathe key={x} profile={[[0.009, 0], [0.012, 0.01], [0.012, 0.14]]} sides={6} color={['#9a6ac0', '#d8e2e8', '#6ac0a0', '#c06a6a'][i]} pos={[x, 0.02, 0]} contact={false} />)}</group>
    <FacetLathe profile={[[0.05, 0], [0.06, 0.02], [0.06, 0.16], [0.045, 0.18], [0.05, 0.2]]} sides={10} color="#8a7a5a" pos={[w / 2 - 0.06, 0.015, 0.12]} contact={false} />
  </group>
);
/** A door opening's casing, the door itself standing open (hinge = which post; with the left hinge open > 0 swings it out into the corridor, with the right hinge open < 0 does), and the corridor seen
 *  through it: a warm, lamp-lit wall, a floor, a sconce. The corridor is painted (unlit), so it reads bright from any angle.
 *  Origin = the opening's left foot on the wall face; the wall faces +z, the corridor lies behind it (-z). open in radians. */
export const LabDoor: React.FC<{w?: number; h?: number; open?: number; corridor?: number; hinge?: 'left' | 'right'}> = ({w = 1.0, h = 2.15, open = 1.25, corridor = 1.7, hinge = 'left'}) => {
  const hall = tex('lab-corridor', 1600, 600, (c, W, H) => {
    const g = c.createRadialGradient(W * 0.5, H * 0.3, 20, W * 0.5, H * 0.4, W * 0.5); g.addColorStop(0, '#f6dca0'); g.addColorStop(1, '#b48a52'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#6a4a30'; c.fillRect(0, H * 0.62, W, H * 0.38); c.fillStyle = '#7a5838'; for (let x = 0; x < W; x += 80) c.fillRect(x, H * 0.64, 70, H * 0.34); c.fillStyle = '#5a3c26'; c.fillRect(0, H * 0.6, W, 10);
    c.fillStyle = '#4a2e1e'; c.fillRect(W * 0.12, H * 0.16, W * 0.12, H * 0.84); c.fillStyle = '#5a3a26'; c.fillRect(W * 0.13, H * 0.19, W * 0.1, H * 0.34); c.fillRect(W * 0.13, H * 0.58, W * 0.1, H * 0.4); c.fillStyle = '#c9a24a'; c.fillRect(W * 0.215, H * 0.6, 12, 12);
    c.fillStyle = '#2a2a2a'; c.font = 'bold 30px Georgia, serif'; c.textAlign = 'center'; c.fillText('214', W * 0.18, H * 0.13);
    c.fillStyle = '#8a6a44'; c.fillRect(W * 0.62, H * 0.2, W * 0.22, H * 0.28); c.fillStyle = '#c9a678'; c.fillRect(W * 0.625, H * 0.21, W * 0.21, H * 0.26);
    [[0.64, 0.24, '#efe6cf'], [0.71, 0.23, '#f4d8a0'], [0.77, 0.26, '#e8eef2'], [0.66, 0.36, '#f2e0c8']].forEach(([x, y, col]) => { c.fillStyle = col as string; c.fillRect(W * (x as number), H * (y as number), W * 0.05, H * 0.09); });
    const s = c.createRadialGradient(W * 0.47, H * 0.18, 4, W * 0.47, H * 0.18, 120); s.addColorStop(0, 'rgba(255,250,220,1)'); s.addColorStop(1, 'rgba(255,230,160,0)'); c.fillStyle = s; c.fillRect(W * 0.47 - 120, H * 0.18 - 120, 240, 240);
    c.fillStyle = '#7a5a2a'; c.fillRect(W * 0.47 - 10, H * 0.2, 20, 26);
  });
  const leaf = '#5a3a26';
  return (
    <group>
      {/* casing */}
      {[-0.05, w + 0.05].map((x) => <B key={x} p={[x, (h + 0.08) / 2, 0.025]} s={[0.1, h + 0.08, 0.05]} c="#4a3020" />)}<B p={[w / 2, h + 0.06, 0.025]} s={[w + 0.2, 0.12, 0.05]} c="#4a3020" />
      <B p={[w / 2, 0.01, -0.15]} s={[w, 0.02, 0.3]} c="#6a4a30" />
      {/* the door, open into the room on its left hinge */}
      <group position={[hinge === 'right' ? w : 0, 0, 0]} rotation={[0, open, 0]}><group position={[hinge === 'right' ? -w : 0, 0, 0]}>
        <B p={[w / 2 - 0.01, h / 2, 0.025]} s={[w - 0.04, h - 0.02, 0.05]} c={leaf} />
        {[[0.42, 0.62], [1.12, 0.78]].map(([y, hh]) => <B key={y} p={[w / 2 - 0.01, y + hh / 2 - 0.1, 0.055]} s={[w - 0.26, hh, 0.012]} c="#6a4630" cast={false} />)}
        {[[0.42, 0.62], [1.12, 0.78]].map(([y, hh]) => <B key={`b${y}`} p={[w / 2 - 0.01, y + hh / 2 - 0.1, -0.005]} s={[w - 0.26, hh, 0.012]} c="#6a4630" cast={false} />)}
        {[0.07, -0.02].map((z) => <B key={z} p={[hinge === 'right' ? 0.1 : w - 0.1, 1.0, z]} s={[0.04, 0.04, 0.05]} c="#c9a24a" />)}
      </group></group>
      {/* the corridor: floor, far wall painted with its lamp, a ceiling */}
      <mesh position={[w / 2, 0.002, -corridor / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[8, corridor]} /><meshLambertMaterial color="#8a6a48" /></mesh>
      <mesh position={[w / 2, 1.5, -corridor]}><planeGeometry args={[8, 3]} /><meshBasicMaterial map={hall} /></mesh>
      <mesh position={[w / 2, 2.9, -corridor / 2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[8, corridor]} /><meshBasicMaterial color="#8a6a44" /></mesh>
      <mesh position={[w / 2, 0.004, -corridor / 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[8, corridor]} /><meshBasicMaterial color="#e8b870" transparent opacity={0.35} depthWrite={false} /></mesh>
    </group>
  );
};
/** A threadbare rug lying on the floor. */
export const Rug: React.FC<{pos: V3; w: number; d: number; rotY?: number}> = ({pos, w, d, rotY = 0}) => {
  const t = tex('lab-rug', 600, 400, (c, W, H) => {
    c.fillStyle = '#6a3a34'; c.fillRect(0, 0, W, H); c.strokeStyle = '#a8805a'; c.lineWidth = 14; c.strokeRect(24, 24, W - 48, H - 48); c.strokeStyle = '#3a2a2a'; c.lineWidth = 6; c.strokeRect(50, 50, W - 100, H - 100);
    c.fillStyle = '#8a5a44'; for (let k = 0; k < 5; k++) { c.save(); c.translate(W / 2, H / 2); c.rotate(Math.PI / 4); c.fillRect(-60 + k * 6, -60 + k * 6, 120 - k * 12, 120 - k * 12); c.restore(); c.fillStyle = k % 2 ? '#8a5a44' : '#5a2e2a'; }
    const r = rnd(5); for (let k = 0; k < 40; k++) { c.fillStyle = `rgba(200,180,150,${0.06 + r() * 0.1})`; c.fillRect(r() * W, r() * H, 20 + r() * 60, 4 + r() * 10); }
  });
  return <mesh position={[pos[0], 0.006, pos[2]]} rotation={[-Math.PI / 2, 0, rotY]} receiveShadow><planeGeometry args={[w, d]} /><meshLambertMaterial map={t} /></mesh>;
};

// ---------------------------------------------------------------- graphics on paper (shots 6-7 of the Victor test)
/** A pop with a small overshoot: 0 before `at`, then up past full size and back, every frame (graphics move on ones).
 *  Returns the scale for frame f. len = frames to settle. */
export const popScale = (f: number, at: number, len = 6, over = 0.28) => {
  const t = (f - at) / len;
  if (t < 0) return 0;
  if (t >= 1) return 1;
  // 0 -> 1 + over at 45 %, then a damped return through 1
  return t < 0.45 ? (t / 0.45) * (1 + over) : 1 + over * Math.cos(((t - 0.45) / 0.55) * Math.PI * 1.5) * (1 - (t - 0.45) / 0.55);
};
const tickTex = () => tex('mark-tick', 128, 128, (c) => {
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = 'rgba(20,60,30,0.35)'; c.lineWidth = 22; c.beginPath(); c.moveTo(22, 70); c.lineTo(52, 100); c.lineTo(108, 26); c.stroke();
  c.strokeStyle = '#2f9a48'; c.lineWidth = 15; c.beginPath(); c.moveTo(20, 66); c.lineTo(50, 96); c.lineTo(106, 22); c.stroke();
});
const ringTex = () => tex('mark-ring', 512, 160, (c) => {
  // a hand-drawn red ring: one stroke that overruns its start a little, slightly uneven
  c.lineCap = 'round'; c.strokeStyle = '#c8302a'; c.lineWidth = 11; c.beginPath();
  for (let i = 0; i <= 80; i++) { const a = -2.6 + (i / 80) * (Math.PI * 2 + 0.55), r = 1 + 0.035 * Math.sin(a * 3 + 1); const x = 256 + Math.cos(a) * 236 * r, y = 80 + Math.sin(a) * 62 * r + (i / 80) * 8 - 4; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
  c.stroke();
});
/** Marks popping on a pinned sheet: green ticks at the right end of the lines and a red ring round one line, as an
 *  insert graphic. Same placement props as Sheet (x, y, w, h, rot, z of the sheet), so it lies exactly on it.
 *  lines = line centres as fractions of the sheet height from the top; tickX = the tick column (fraction of the width);
 *  ticks[i] = the frame line i gets its tick (null = never); ring = {line, at, x0, x1} rings that line from frame `at`
 *  between x0 and x1 (fractions of the width). The marks are ink on the paper: lit by the room, a little self-lit so they
 *  read as graphics. */
export const SheetMarks: React.FC<{f: number; x: number; y: number; w: number; h: number; rot?: number; z?: number; lines: number[]; tickX: number; ticks: (number | null)[]; ring?: {line: number; at: number; x0?: number; x1?: number}; tickSize?: number}> =
  ({f, x, y, w, h, rot = 0, z = 0.01, lines, tickX, ticks, ring, tickSize = 0.075}) => {
    const tk = tickTex(), rg = ringTex(), at = (fy: number) => h / 2 - fy * h, ax = (fx: number) => -w / 2 + fx * w;
    return (
      <group position={[x, y, z + 0.004]} rotation={[0, 0, (rot * Math.PI) / 180]}>
        {ticks.map((t, i) => { const s = t === null ? 0 : popScale(f, t); return s > 0 ? <mesh key={i} position={[ax(tickX), at(lines[i]), 0.001 * (i + 1)]} scale={[s, s, 1]} renderOrder={6}><planeGeometry args={[tickSize * w * 2.2, tickSize * w * 2.2]} /><meshLambertMaterial map={tk} transparent depthWrite={false} emissive="#2f9a48" emissiveIntensity={0.35} /></mesh> : null; })}
        {ring && popScale(f, ring.at, 7, 0.18) > 0 ? (() => { const s = popScale(f, ring.at, 7, 0.18), x0 = ring.x0 ?? 0.08, x1 = ring.x1 ?? 0.96, rw = (x1 - x0) * w, rh = rw * (160 / 512) * 1.15;
          return <mesh position={[ax((x0 + x1) / 2), at(lines[ring.line]), 0.012]} scale={[s, s, 1]} renderOrder={6}><planeGeometry args={[rw, rh]} /><meshLambertMaterial map={rg} transparent depthWrite={false} emissive="#c8302a" emissiveIntensity={0.3} /></mesh>; })() : null}
      </group>
    );
  };
/** A soft shadow cast by someone out of frame, laid on a surface: a dark, blurred silhouette (a head and shoulders, or a
 *  plain blob) on a transparent plane. Place it like any plane (pos, rotation); opacity = how dark at the core. */
export const SoftShadow: React.FC<{pos: V3; size: [number, number]; rotation?: V3; kind?: 'head' | 'blob'; opacity?: number}> = ({pos, size, rotation = [0, 0, 0], kind = 'head', opacity = 0.35}) => {
  const t = tex(`soft-shadow-${kind}`, 256, 256, (c) => {
    c.filter = 'blur(14px)'; c.fillStyle = '#000';
    if (kind === 'head') { c.beginPath(); c.ellipse(128, 92, 52, 60, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(128, 250, 118, 80, 0, 0, 7); c.fill(); c.fillRect(104, 130, 48, 60); }
    else { c.beginPath(); c.ellipse(128, 128, 100, 100, 0, 0, 7); c.fill(); }
  });
  return <mesh position={pos} rotation={rotation} renderOrder={5}><planeGeometry args={size} /><meshBasicMaterial map={t} color="#000000" transparent opacity={opacity} depthWrite={false} /></mesh>;
};

// ================================================================ AFTER THE EXPLOSION (shots 13-14 of the Victor test)
// Pieces for a room wrecked by a blast: soot on the walls, burnt papers, a broken window, a scorched floor, the torn machine,
// overturned furniture and what spilt from it. All in room units, like the rest of this file.

/** Soot over a painted wall: draws `base` (e.g. paintWhitewash) and then smoke staining on top of it, so the result is ONE
 *  wall picture (no decal to z-fight). Wm, Hm = the wall in metres; every place below is in wall metres (x from the left
 *  foot, y up). src = where the fire was: soot is darkest there and fades with distance, with a plume rising above it to
 *  the ceiling. clean = rectangles where something hung during the fire (a plan since torn away): the soot stops at its
 *  edge and leaves a paler patch, with its pin holes. */
export type SootSrc = {x: number; y: number; r: number; k?: number};
export const paintSooty = (base: (c: Ctx, W: number, H: number) => void, seed: number, Wm: number, Hm: number, src: SootSrc[], clean: {x: number; y: number; w: number; h: number; rot?: number}[] = []) => (c: Ctx, W: number, H: number) => {
  base(c, W, H);
  const r = rnd(seed), px = W / Wm, py = H / Hm, X = (x: number) => x * px, Y = (y: number) => H - y * py;
  const sc = document.createElement('canvas'); sc.width = W; sc.height = H; const s = sc.getContext('2d')!;
  src.forEach(({x, y, r: rad, k = 1}) => {
    const cx = X(x), cy = Y(y), R = rad * px;
    // the core: a dark, warm-black bloom
    const g = s.createRadialGradient(cx, cy, R * 0.05, cx, cy, R); g.addColorStop(0, `rgba(22,16,12,${0.92 * k})`); g.addColorStop(0.35, `rgba(30,24,20,${0.7 * k})`); g.addColorStop(0.7, `rgba(45,38,32,${0.28 * k})`); g.addColorStop(1, 'rgba(45,38,32,0)');
    s.fillStyle = g; s.fillRect(cx - R, cy - R, R * 2, R * 2);
    // the plume: smoke climbs and spreads, darkest along the ceiling line
    for (let k2 = 0; k2 < 26; k2++) { const w0 = R * (0.25 + r() * 0.35), x0 = cx + (r() - 0.5) * R * 0.8, top = 0, wTop = w0 * (1.8 + r() * 1.6), gg = s.createLinearGradient(0, cy, 0, top); gg.addColorStop(0, `rgba(30,24,20,${0.08 * k})`); gg.addColorStop(0.7, `rgba(30,24,20,${0.12 * k})`); gg.addColorStop(1, `rgba(30,24,20,${0.2 * k})`); s.fillStyle = gg; s.beginPath(); s.moveTo(x0 - w0 / 2, cy); s.lineTo(x0 + w0 / 2, cy); s.lineTo(x0 + wTop / 2 + (r() - 0.5) * R * 0.6, top); s.lineTo(x0 - wTop / 2 + (r() - 0.5) * R * 0.6, top); s.closePath(); s.fill(); }
    const ceil = s.createLinearGradient(0, 0, 0, 0.5 * py); ceil.addColorStop(0, `rgba(28,22,18,${0.5 * k})`); ceil.addColorStop(1, 'rgba(28,22,18,0)'); s.fillStyle = ceil; s.fillRect(cx - R * 1.6, 0, R * 3.2, 0.5 * py);
    // blotches and runs, denser near the source: the stain is never a clean gradient
    for (let k2 = 0; k2 < 140; k2++) { const a = r() * Math.PI * 2, d = Math.pow(r(), 0.8) * R * 1.1, bx = cx + Math.cos(a) * d, by = cy + Math.sin(a) * d * 0.8, br = (0.03 + r() * 0.1) * px, al = 0.25 * k * (1 - d / (R * 1.15)); if (al <= 0) continue; const bg = s.createRadialGradient(bx, by, 0, bx, by, br); bg.addColorStop(0, `rgba(20,15,12,${al})`); bg.addColorStop(1, 'rgba(20,15,12,0)'); s.fillStyle = bg; s.fillRect(bx - br, by - br, br * 2, br * 2); }
    s.strokeStyle = `rgba(25,20,16,${0.25 * k})`; for (let k2 = 0; k2 < 18; k2++) { const x1 = cx + (r() - 0.5) * R * 1.4; s.lineWidth = 2 + r() * 5; s.beginPath(); s.moveTo(x1, cy - R * 0.2 * r()); s.lineTo(x1 + (r() - 0.5) * 10, cy + R * (0.2 + r() * 0.5)); s.stroke(); }
  });
  // where a plan hung: cut the soot away (pale patch), a thin dark line of soot along its edge
  clean.forEach(({x, y, w, h, rot = 0}) => { s.save(); s.translate(X(x), Y(y)); s.rotate((-rot * Math.PI) / 180); s.globalCompositeOperation = 'destination-out'; s.fillStyle = 'rgba(0,0,0,0.88)'; s.fillRect((-w / 2) * px, (-h / 2) * py, w * px, h * py); s.globalCompositeOperation = 'source-over'; s.strokeStyle = 'rgba(30,24,20,0.12)'; s.lineWidth = 2; s.strokeRect((-w / 2) * px, (-h / 2) * py, w * px, h * py); s.restore(); });
  c.drawImage(sc, 0, 0);
  clean.forEach(({x, y, w, h, rot = 0}) => { c.save(); c.translate(X(x), Y(y)); c.rotate((-rot * Math.PI) / 180); c.fillStyle = '#1a1410'; [[-1, -1], [1, -1]].forEach(([a, b]) => { c.beginPath(); c.arc(a * (w / 2 - 0.025) * px, b * (h / 2 - 0.025) * py, 2.6, 0, 7); c.fill(); }); c.fillStyle = 'rgba(200,190,170,0.5)'; c.fillRect(-0.04 * px, (-h / 2 - 0.012) * py, 0.07 * px, 0.02 * py); c.restore(); });
};

/** A paper burnt from one side: draws `paint`, toasts it brown towards that side, and eats it away along a ragged, charred
 *  front. amount = how much of the sheet is gone (0..0.8). Use the picture on a material with alphaTest (BurntSheet). */
export const paintBurnt = (paint: (c: Ctx, W: number, H: number) => void, seed: number, side: 'left' | 'right' | 'bottom' | 'top', amount: number) => (c: Ctx, W: number, H: number) => {
  paint(c, W, H);
  const r = rnd(seed), horiz = side === 'left' || side === 'right', L = horiz ? W : H, M = horiz ? H : W, n = 22;
  const at = (t: number, o: number): [number, number] => { const d = side === 'left' || side === 'top' ? o : L - o; return horiz ? [d, t * M] : [t * M, d]; };
  const front: number[] = []; for (let i = 0; i <= n; i++) front.push(L * amount + (r() - 0.5) * L * 0.22 + Math.sin(i * 1.7 + seed) * L * 0.05);
  // toast: a brown wash that deepens towards the front
  const tg = horiz ? c.createLinearGradient(...at(0, L), ...at(0, 0)) : c.createLinearGradient(...at(0, L), ...at(0, 0)); tg.addColorStop(0, 'rgba(120,80,30,0)'); tg.addColorStop(Math.max(0.05, 1 - amount - 0.25), 'rgba(140,90,40,0.12)'); tg.addColorStop(1, 'rgba(90,50,20,0.5)'); c.fillStyle = tg; c.fillRect(0, 0, W, H);
  const line = () => { c.beginPath(); front.forEach((o, i) => { const [x, y] = at(i / n, o); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); };
  c.lineJoin = 'round'; c.lineCap = 'round';
  line(); c.strokeStyle = 'rgba(150,95,40,0.45)'; c.lineWidth = L * 0.16; c.stroke();
  line(); c.strokeStyle = 'rgba(90,45,15,0.8)'; c.lineWidth = L * 0.07; c.stroke();
  line(); c.strokeStyle = '#1a100a'; c.lineWidth = L * 0.03; c.stroke();
  // a few glowing specks on the edge, holes burnt through ahead of the front
  for (let k = 0; k < 4; k++) { const i = Math.floor(r() * n), [x, y] = at(i / n, front[i] + L * 0.04); c.fillStyle = '#1a100a'; c.beginPath(); c.arc(x, y, M * (0.02 + r() * 0.03), 0, 7); c.fill(); }
  c.globalCompositeOperation = 'destination-out'; c.beginPath(); front.forEach((o, i) => { const [x, y] = at(i / n, o - L * 0.012); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); const [ex, ey] = at(1, -10), [sx, sy] = at(0, -10); c.lineTo(ex, ey); c.lineTo(sx, sy); c.closePath(); c.fillStyle = '#000'; c.fill(); c.globalCompositeOperation = 'source-over';
};

/** A sheet left hanging by ONE pin after the blast (or still pinned flat when hang = 0 and pins = 2): the picture cut out
 *  by its alpha (pair with paintBurnt), the pin at its top-left (corner 'tl') or top-right ('tr') corner, the sheet swung
 *  about it by `hang` degrees (gravity pulls a tl sheet clockwise: use a negative angle; a tr sheet positive), a slight
 *  curl away from the wall at the free end. pin = where the pin is on the wall (wall metres). */
export const HangingSheet: React.FC<{map: THREE.Texture; pin: [number, number]; w: number; h: number; hang?: number; corner?: 'tl' | 'tr'; z?: number; pinColor?: string; curl?: number}> = ({map, pin, w, h, hang = -30, corner = 'tl', z = 0.01, pinColor = '#c8372d', curl = 0.25}) => {
  const sx = corner === 'tl' ? 1 : -1;
  return (
    <group position={[pin[0], pin[1], z]}>
      <group rotation={[curl * 0.3, sx * curl * 0.4, (hang * Math.PI) / 180]}>
        <mesh position={[sx * (w / 2 - 0.025), -(h / 2 - 0.025), 0]} receiveShadow castShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={map} transparent alphaTest={0.5} side={THREE.DoubleSide} /></mesh>
      </group>
      <mesh position={[0, 0, 0.008]}><circleGeometry args={[0.012, 10]} /><meshLambertMaterial color={pinColor} /></mesh>
    </group>
  );
};
/** A burnt sheet still pinned flat on a wall (both top pins): like Sheet, but the picture is cut out by its alpha. */
export const BurntSheet: React.FC<{map: THREE.Texture; x: number; y: number; w: number; h: number; rot?: number; z?: number; pin?: string; pins?: [boolean, boolean]}> = ({map, x, y, w, h, rot = 0, z = 0.01, pin = '#c8372d', pins = [true, true]}) => (
  <group position={[x, y, z]} rotation={[0, 0, (rot * Math.PI) / 180]}>
    <mesh receiveShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={map} transparent alphaTest={0.5} /></mesh>
    {[-1, 1].map((a, i) => (pins[i] ? <mesh key={i} position={[a * (w / 2 - 0.025), h / 2 - 0.025, 0.006]}><circleGeometry args={[0.012, 10]} /><meshLambertMaterial color={pin} /></mesh> : null))}
  </group>
);

/** The arched window after the blast (same x0, x1, sill, spring as ArchWindow in the same hole): the glass gone from most
 *  panes, jagged shards left in the corners of the frame, two glazing bars snapped (one hanging), the frame scorched, the
 *  curtain torn to a ragged strip hanging from a rod that has come away at one end. */
export const BrokenArchWindow: React.FC<{x0: number; x1: number; sill: number; spring: number; frame?: string; seed?: number}> = ({x0, x1, sill, spring, frame = '#3a3e38', seed = 4}) => {
  const w = x1 - x0, r = w / 2, cx = (x0 + x1) / 2, bars = 12, top = spring + r, midY = sill + (spring - sill) * 0.36, R = rnd(seed);
  const curtain = tex('lab-curtain-torn', 200, 720, (c, W, H) => {
    for (let x = 0; x < W; x += 25) { const g = c.createLinearGradient(x, 0, x + 25, 0); g.addColorStop(0, '#4a2a28'); g.addColorStop(0.5, '#643a36'); g.addColorStop(1, '#3a2220'); c.fillStyle = g; c.fillRect(x, 0, 25, H); }
    const rr = rnd(31); c.fillStyle = 'rgba(20,12,10,0.55)'; for (let k = 0; k < 30; k++) { c.beginPath(); c.arc(rr() * W, H * (0.3 + rr() * 0.7), 6 + rr() * 22, 0, 7); c.fill(); }
    const sg = c.createLinearGradient(W, 0, 0, 0); sg.addColorStop(0, 'rgba(15,10,8,0.7)'); sg.addColorStop(1, 'rgba(15,10,8,0)'); c.fillStyle = sg; c.fillRect(0, 0, W, H);
    // torn: the lower part ripped away in a long ragged diagonal, a hole burnt through, frayed threads
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.moveTo(0, H * 0.62); for (let i = 0; i <= 14; i++) c.lineTo((i / 14) * W, H * (0.62 - (i / 14) * 0.3) + (rr() - 0.5) * 50); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(W * 0.6, H * 0.22, 34, 50, 0.3, 0, 7); c.fill(); c.beginPath(); c.moveTo(W * 0.15, H * 0.6); c.lineTo(W * 0.32, H * 0.78); c.lineTo(W * 0.4, H * 0.5); c.closePath(); c.fill();
    c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#2a1614'; c.lineWidth = 3; c.beginPath(); c.ellipse(W * 0.6, H * 0.22, 36, 52, 0.3, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(100,60,56,0.9)'; c.lineWidth = 2; for (let k = 0; k < 16; k++) { const x = rr() * W, y = H * (0.62 - (x / W) * 0.3); c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + (rr() - 0.5) * 12, y + 20 + rr() * 50); c.stroke(); }
  });
  // shards: jagged triangles of glass left in the corners of the panes (faint, catching the moon)
  const shard = (x: number, y: number, a: number, s: number, k: number) => <mesh key={k} position={[x, y, -0.085]} rotation={[0, 0, a]}><shapeGeometry args={[(() => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(s, 0); sh.lineTo(s * (0.15 + R() * 0.3), s * (0.6 + R() * 0.8)); sh.lineTo(s * 0.05, s * 0.3); sh.closePath(); return sh; })()]} /><meshBasicMaterial color="#c8daf2" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} /></mesh>;
  const inL = x0 + 0.08, inR = x1 - 0.08;
  return (
    <group>
      {[x0 + 0.04, x1 - 0.04].map((x) => <B key={x} p={[x, (sill + spring) / 2, -0.06]} s={[0.08, spring - sill, 0.12]} c={frame} />)}
      <B p={[cx, sill - 0.03, -0.02]} s={[w + 0.22, 0.06, 0.4]} c="#8a7e6a" /><B p={[cx, sill - 0.09, 0.15]} s={[w + 0.1, 0.06, 0.04]} c="#6a5e4c" cast={false} />
      {/* the arch: two segments torn out at the top right */}
      {Array.from({length: bars}, (_, i) => { if (i === 2 || i === 3) return null; const a0 = (i / bars) * Math.PI, a1 = ((i + 1) / bars) * Math.PI, am = (a0 + a1) / 2, rr = r - 0.04, len = 2 * rr * Math.sin((a1 - a0) / 2) + 0.012;
        return <B key={i} p={[cx + Math.cos(am) * rr, spring + Math.sin(am) * rr, -0.06]} s={[len, 0.08, 0.12]} r={[0, 0, am + Math.PI / 2]} c={frame} />; })}
      {/* glazing: the upright stands, the lower cross bar stands, the upper one snapped and hanging from the left jamb */}
      <B p={[cx, (sill + spring + r) / 2, -0.08]} s={[0.035, spring + r - sill - 0.05, 0.04]} c={frame} />
      <B p={[cx, midY, -0.08]} s={[w - 0.08, 0.035, 0.04]} c={frame} />
      <B p={[inL + 0.2, spring - 0.16, -0.08]} s={[0.46, 0.035, 0.04]} r={[0, 0, -0.72]} c={frame} />
      <B p={[inR - 0.08, spring, -0.08]} s={[0.16, 0.035, 0.04]} r={[0, 0, 0.25]} c={frame} />
      {[1.0, 2.14, 2.64].map((a) => <B key={a} p={[cx + Math.cos(a) * r * 0.5, spring + Math.sin(a) * r * 0.5, -0.08]} s={[r - 0.04, 0.03, 0.035]} r={[0, 0, a]} c={frame} />)}
      <B p={[cx + 0.1, spring + 0.08, -0.08]} s={[0.18, 0.03, 0.035]} r={[0, 0, 0.5]} c={frame} />
      {/* shards: corners of the lower panes, the right jamb, under the arch */}
      {[[inL, sill + 0.02, 0, 0.16], [cx + 0.02, sill + 0.02, 0, 0.13], [inR, sill + 0.02, Math.PI / 2, 0.2], [cx - 0.02, midY + 0.02, Math.PI / 2, 0.12], [inL, midY + 0.03, -0.1, 0.14], [inR, midY + 0.35, Math.PI * 0.9, 0.15], [cx - 0.03, spring - 0.01, Math.PI * 1.2, 0.12], [inL + 0.02, spring - 0.02, -Math.PI / 2, 0.18], [cx + 0.02, top - 0.12, -Math.PI * 0.35, 0.1]].map(([x, y, a, s], k) => shard(x, y, a, s, k))}
      {/* the rod has come away at the right: it hangs at a slant; the curtain left on it is a torn strip */}
      <B p={[cx - 0.05, top + 0.02, 0.08]} s={[w + 0.7, 0.03, 0.03]} r={[0, 0, -0.18]} c="#2a2624" />
      <mesh position={[x0 - 0.12, (sill - 0.25 + top + 0.1) / 2 + 0.02, 0.09]} rotation={[0, 0.15, 0.03]} receiveShadow castShadow><planeGeometry args={[0.42, top + 0.35 - sill]} /><meshLambertMaterial map={curtain} transparent alphaTest={0.5} side={THREE.DoubleSide} /></mesh>
      <mesh position={[x0 + 0.22, top - 0.32, 0.12]} rotation={[0.1, -0.2, 0.12]} receiveShadow castShadow><planeGeometry args={[0.22, 0.75]} /><meshLambertMaterial map={curtain} transparent alphaTest={0.5} side={THREE.DoubleSide} /></mesh>
    </group>
  );
};

/** A picture laid flat on the floor (scorch, soot fall-out): a transparent plane just above the boards. size = [w, d]. */
export const FloorDecal: React.FC<{pos: V3; size: [number, number]; map: THREE.Texture; rotY?: number; opacity?: number; y?: number}> = ({pos, size, map, rotY = 0, opacity = 1, y = 0.003}) => (
  <mesh position={[pos[0], y, pos[2]]} rotation={[-Math.PI / 2, 0, rotY]} receiveShadow renderOrder={1}><planeGeometry args={size} /><meshLambertMaterial map={map} transparent opacity={opacity} depthWrite={false} polygonOffset polygonOffsetFactor={-2} /></mesh>
);
/** Scorch marks fanning out from a blast: a black core at the bottom middle of the picture (lay the decal so that point sits
 *  at the machine's foot) and burnt streaks thrown outward in a half circle, thinning and fading with distance, a few
 *  bright ash flecks. */
export const scorchTex = (seed = 3) => tex(`scorch-fan-${seed}`, 1024, 1024, (c, W, H) => {
  const r = rnd(seed), ox = W / 2, oy = H * 0.04;
  const core = c.createRadialGradient(ox, oy, 10, ox, oy, W * 0.3); core.addColorStop(0, 'rgba(12,8,6,0.95)'); core.addColorStop(0.5, 'rgba(18,12,8,0.6)'); core.addColorStop(1, 'rgba(18,12,8,0)'); c.fillStyle = core; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 70; k++) {
    const a = Math.PI * (0.06 + r() * 0.88), L = W * (0.25 + Math.pow(r(), 0.7) * 0.5), w0 = W * (0.02 + r() * 0.05), al = 0.35 + r() * 0.45;
    const ex = ox + Math.cos(a) * L, ey = oy + Math.sin(a) * L, nx = -Math.sin(a), ny = Math.cos(a), g = c.createLinearGradient(ox, oy, ex, ey);
    g.addColorStop(0, `rgba(14,10,8,${al})`); g.addColorStop(0.6, `rgba(24,16,12,${al * 0.55})`); g.addColorStop(1, 'rgba(24,16,12,0)'); c.fillStyle = g;
    c.beginPath(); c.moveTo(ox + nx * w0, oy + ny * w0); c.lineTo(ex + nx * w0 * 0.15, ey + ny * w0 * 0.15); c.lineTo(ex - nx * w0 * 0.15, ey - ny * w0 * 0.15); c.lineTo(ox - nx * w0, oy - ny * w0); c.closePath(); c.fill();
  }
  for (let k = 0; k < 90; k++) { const a = Math.PI * r(), d = W * (0.1 + r() * 0.55); c.fillStyle = r() < 0.7 ? `rgba(15,10,8,${0.3 + r() * 0.4})` : `rgba(170,160,150,${0.25 + r() * 0.3})`; c.beginPath(); c.arc(ox + Math.cos(a) * d, oy + Math.sin(a) * d, 2 + r() * 6, 0, 7); c.fill(); }
});

/** Glowing embers: a few small orange-red points with soft glows (static; the filming step makes them pulse or drift by
 *  driving `heat` 0..1). pts = room points. */
export const EmberBed: React.FC<{pts: V3[]; heat?: number; size?: number}> = ({pts, heat = 1, size = 0.018}) => (
  <>{pts.map((p, i) => <group key={i} position={p}>
    <mesh><boxGeometry args={[size, size * 0.6, size]} /><meshBasicMaterial color={i % 3 ? '#ff7a2a' : '#ffb04a'} /></mesh>
    <Halo pos={[0, 0, 0]} r={size * 7} color="#ff7a30" strength={0.55 * heat} />
  </group>)}</>
);

/** THE MACHINE AFTER THE BLAST (same origin and size as Machine, so it stands in the same place): the ring torn open at the
 *  top, its two ends bent forward and outward; the top coil gone, the two coils beside the tear snapped with copper hanging
 *  on its wire; the other coils blackened; the console dead (dark lamps, one bezel empty, needles fallen below zero, the
 *  middle gauge's glass cracked); the lever pulled down; the left insulator snapped with its brass ball on the plinth;
 *  soot and scorch on the iron. leverAt as on Machine. */
export const WreckedMachine: React.FC<{pos: V3; rotY?: number; leverAt?: V3}> = ({pos, rotY = 0, leverAt = MACHINE.leverSide}) => {
  const {y: RY, R, r} = MACHINE.ring, mid = (R + r) / 2, th = R - r, dep = 0.22, iron = '#33373c', ironL = '#464c52', ironD = '#24272b', soot = '#1c1a18';
  const dialPaint = (crack: boolean) => (c: Ctx) => {
    c.beginPath(); c.arc(128, 128, 126, 0, 7); c.fillStyle = '#8a6a32'; c.fill(); c.beginPath(); c.arc(128, 128, 112, 0, 7); c.fillStyle = '#c9bea2'; c.fill();
    c.lineCap = 'round'; for (let k = 0; k <= 20; k++) { const a = -Math.PI * 0.75 + (k / 20) * Math.PI * 1.5 - Math.PI / 2; c.strokeStyle = '#2a2a30'; c.lineWidth = k % 5 ? 3 : 6; c.beginPath(); c.moveTo(128 + Math.cos(a) * 98, 128 + Math.sin(a) * 98); c.lineTo(128 + Math.cos(a) * (k % 5 ? 86 : 78), 128 + Math.sin(a) * (k % 5 ? 86 : 78)); c.stroke(); }
    const sg = c.createRadialGradient(170, 70, 5, 170, 70, 120); sg.addColorStop(0, 'rgba(20,14,10,0.7)'); sg.addColorStop(1, 'rgba(20,14,10,0)'); c.fillStyle = sg; c.fillRect(0, 0, 256, 256);
    if (!crack) return;
    c.strokeStyle = 'rgba(250,250,255,0.95)'; c.lineWidth = 2.5; const o = [150, 96]; [[0.2, 120], [1.3, 110], [2.4, 95], [3.3, 118], [4.4, 100], [5.4, 80]].forEach(([a, l]) => { c.beginPath(); c.moveTo(o[0], o[1]); let x = o[0], y = o[1]; for (let s = 0; s < 4; s++) { x += Math.cos(a + (s % 2 ? 0.3 : -0.25)) * l / 4; y += Math.sin(a + (s % 2 ? 0.3 : -0.25)) * l / 4; c.lineTo(x, y); } c.stroke(); });
    c.beginPath(); c.arc(o[0], o[1], 22, 0, 7); c.stroke(); c.beginPath(); c.arc(o[0], o[1], 46, 0.4, 2.2); c.stroke();
  };
  const dial = tex('lab-dial-sooty', 256, 256, dialPaint(false)), cracked = tex('lab-dial-cracked', 256, 256, dialPaint(true));
  const segs = 28, coilAt = (k: number) => Math.PI / 2 - (k * Math.PI) / 4;
  // the bend: distance (radians) from the top; ends near the tear bend forward (+z) and outward, the left end droops
  const bend = (a: number) => { const d = Math.abs(a - Math.PI / 2), k = Math.max(0, (0.95 - d) / 0.65), left = a > Math.PI / 2 ? 1 : 0; return {k, out: 0.12 * k * k, fwd: (0.42 + 0.12 * left) * k * k, drop: -0.18 * left * k * k, tilt: 0.6 * k * k}; };
  const place = (a: number, rad: number) => { const b = bend(a); return [Math.cos(a) * (rad + b.out), RY + Math.sin(a) * (rad + b.out) + b.drop, b.fwd] as V3; };
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {/* plinth, scorched: the rivets dull, a black bloom across its front */}
      <B p={[0, 0.06, 0]} s={[2.28, 0.12, 1.08]} c={ironD} /><B p={[0, 0.24, 0]} s={[2.2, 0.36, 1.0]} c={iron} /><B p={[0, 0.44, 0]} s={[2.26, 0.05, 1.06]} c={ironL} />
      {[-0.55, 0, 0.55].map((x) => <B key={x} p={[x, 0.24, 0.502]} s={[0.03, 0.34, 0.01]} c={ironD} cast={false} />)}
      {Array.from({length: 19}, (_, i) => -1.04 + i * 0.1156).map((x) => [0.4, 0.14].map((y) => <B key={`${x}${y}`} p={[x, y, 0.508]} s={[0.026, 0.026, 0.014]} c="#5a6068" cast={false} />))}
      <B p={[0.05, 0.3, 0.509]} s={[1.1, 0.26, 0.004]} c={soot} cast={false} /><B p={[-0.2, 0.465, 0.1]} s={[1.3, 0.004, 0.7]} c={soot} cast={false} />
      {/* the ring: segments missing at the top, the ends either side bent forward */}
      {Array.from({length: segs}, (_, i) => { const a = (i / segs) * Math.PI * 2 + Math.PI / segs, d = Math.abs(((a - Math.PI / 2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (d < 0.3) return null;
        const b = bend(a), len = 2 * R * Math.sin(Math.PI / segs) + 0.01, [x, y, z] = place(a, 0);
        return <group key={i} position={[x, y, z]} rotation={[-b.tilt * Math.sin(a), b.tilt * Math.cos(a) * 0.5, a]}><B p={[mid, 0, 0]} s={[th, len * (mid / R), dep]} c={d < 1.2 ? '#2e3236' : iron} /><B p={[R - 0.02, 0, dep / 2 + 0.01]} s={[0.05, len, 0.02]} c={ironL} cast={false} />{i % 2 ? <B p={[mid, 0, dep / 2 + 0.025]} s={[0.035, 0.035, 0.02]} c="#6a7078" cast={false} /> : null}</group>; })}
      {/* torn ends: jagged lips of iron */}
      {[Math.PI / 2 - 0.3, Math.PI / 2 + 0.3].map((a, i) => { const [x, y, z] = place(a, mid); return <group key={i} position={[x, y, z]} rotation={[0, 0, a + (i ? 0.5 : -0.5)]}><B p={[0, 0, 0]} s={[0.06, th + 0.06, dep + 0.04]} c="#1e2024" /><B p={[0.03, 0.08, 0.04]} s={[0.05, 0.08, 0.06]} r={[0.3, 0, 0.6]} c="#5a3a22" /></group>; })}
      {/* coils: 0 gone; 1 and 7 snapped (two turns left on the ring, copper hanging on its wire); the rest blackened */}
      {Array.from({length: 8}, (_, k) => { if (k === 0) return null; const a0 = coilAt(k), span = 0.5, n = 5, snapped = k === 1 || k === 7, keep = snapped ? (k === 1 ? [3, 4] : [0, 1]) : [0, 1, 2, 3, 4], len = 2 * mid * Math.sin(span / n / 2) + 0.006;
        return <group key={k}>{keep.map((j) => { const a = a0 + ((j + 0.5) / n - 0.5) * span, b = bend(a), [x, y, z] = place(a, 0);
          return <group key={j} position={[x, y, z]} rotation={[-b.tilt * Math.sin(a), b.tilt * Math.cos(a) * 0.5, a]}><mesh position={[mid, 0, 0]} castShadow receiveShadow><boxGeometry args={[th + 0.05, len, dep + 0.05]} /><meshLambertMaterial color={j % 2 ? '#7a4a26' : (k > 2 && k < 6 ? '#a8683a' : '#5a3a22')} /></mesh><B p={[mid, len * 0.3, 0]} s={[th + 0.056, 0.007, dep + 0.056]} c="#2a1a10" cast={false} /></group>; })}</group>; })}
      {/* copper hanging from the snapped coils: a loose wire and a dangling lump of winding */}
      {[[coilAt(1) + 0.12, 0.62, 0.06], [coilAt(7) - 0.12, 0.85, -0.05], [coilAt(7) - 0.2, 0.45, 0.1]].map(([a, l, sw], i) => { const [x, y, z] = place(a, mid); const pts: V3[] = [[x, y, z + 0.1], [x + sw, y - l * 0.5, z + 0.16], [x + sw * 1.6, y - l, z + 0.12]];
        return <group key={i}><Cable pts={pts} r={0.011} color="#b86a32" /><B p={[pts[2][0], pts[2][1] - 0.06, pts[2][2]]} s={[0.1, 0.13, 0.1]} r={[0.2, 0.4, 0.3 * (i - 1)]} c="#8a5228" /></group>; })}
      {/* bits of the top coil on the plinth */}
      {[[-0.35, 0.12, 0.3], [0.25, -0.1, -0.5], [0.5, 0.25, 1.1]].map(([x, z, a], i) => <B key={i} p={[x, 0.5, z]} s={[0.16, 0.06, 0.1]} r={[0, a, 0.1]} c={i % 2 ? '#7a4a26' : '#9a5e32'} />)}
      {/* cradle and side posts (the right post bent back) */}
      <B p={[0, 0.5, 0]} s={[0.7, 0.1, 0.36]} c={ironD} />{[-1, 1].map((k) => <group key={k}><B p={[k * 0.28, 0.58, 0]} s={[0.1, 0.16, 0.3]} c={ironD} /><B p={[k * (R + 0.08), 1.18, 0]} s={[0.12, 1.5, 0.16]} r={[k > 0 ? -0.08 : 0, 0, k > 0 ? -0.05 : 0.02]} c={iron} /><B p={[k * (R + 0.02), RY, 0]} s={[0.16, 0.14, 0.26]} c={ironL} /><B p={[k * (R + 0.08), 0.5, 0]} s={[0.26, 0.08, 0.3]} c={ironD} /></group>)}
      {/* insulators: the right one whole but sooty, the left one snapped half way, its ball lying on the plinth */}
      <group position={[MACHINE.gaps[1][0], 0.465, MACHINE.gaps[1][1]]}>
        <FacetLathe profile={[[0.1, 0], [0.12, 0.05], [0.06, 0.08], [0.12, 0.12], [0.05, 0.16], [0.11, 0.2], [0.045, 0.24], [0.1, 0.28], [0.04, 0.32], [0.035, 0.44]]} sides={10} color="#a8a294" contact={false} tones={[0.85, 1.05, 0.9, 1.08, 0.9, 1.1, 0.9, 1.1, 1]} />
        <FacetLathe profile={[[0.01, 0.44], [0.05, 0.46], [0.065, 0.5], [0.05, 0.55], [0.01, 0.57]]} sides={8} color="#8a7034" contact={false} />
      </group>
      <group position={[MACHINE.gaps[0][0], 0.465, MACHINE.gaps[0][1]]}>
        <FacetLathe profile={[[0.1, 0], [0.12, 0.05], [0.06, 0.08], [0.12, 0.12], [0.05, 0.16], [0.11, 0.18], [0.07, 0.2], [0.09, 0.17], [0.06, 0.21]]} sides={10} color="#b8b2a2" contact={false} wobble={0.25} seed={7} tones={[0.85, 1.05, 0.9, 1.08, 0.9, 1.1, 0.8, 1, 1]} />
      </group>
      <FacetLathe profile={[[0.01, 0], [0.05, 0.02], [0.065, 0.06], [0.05, 0.11], [0.01, 0.13]]} sides={8} color="#8a7034" pos={[-0.62, 0.465, 0.42]} contact={false} />
      <FacetLathe profile={[[0.06, 0], [0.09, 0.03], [0.06, 0.07], [0.02, 0.09]]} sides={7} wobble={0.4} seed={3} color="#c9c2b0" pos={[-0.75, 0.465, 0.15]} contact={false} />
      {/* console, dead */}
      <group position={MACHINE.console}>
        <B p={[0, 0.465 + 0.28, 0]} s={[0.58, 0.56, 0.1]} c="#24282c" /><B p={[0, 0.465 + 0.28, 0.053]} s={[0.6, 0.58, 0.006]} c="#4a4028" cast={false} /><B p={[0, 0.465 + 0.28, 0.058]} s={[0.55, 0.53, 0.006]} c="#272b30" cast={false} />
        <B p={[0, 0.465 + 0.16, -0.12]} s={[0.5, 0.32, 0.2]} c={ironD} /><B p={[0, 0.465 + 0.58, -0.02]} s={[0.62, 0.04, 0.16]} c={ironD} />
        <B p={[-0.12, 0.95, 0.062]} s={[0.3, 0.16, 0.002]} c={soot} cast={false} />
        {[-0.18, 0, 0.18].map((x, i) => <group key={x} position={[x, 0.93, 0.064]}>
          <mesh><circleGeometry args={[0.075, 24]} /><meshLambertMaterial map={i === 1 ? cracked : dial} /></mesh>
          <B p={[Math.sin(-2.5 + i * 0.1) * 0.026, Math.cos(-2.5 + i * 0.1) * 0.026, 0.006]} s={[0.007, 0.056, 0.004]} r={[0, 0, 2.5 - i * 0.1]} c="#1c1c20" cast={false} />
        </group>)}
        {Array.from({length: 5}, (_, i) => { const [lx, ly] = MACHINE.lamp(i); return <group key={i} position={[lx - MACHINE.console[0], ly, 0.07]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.02, 12]} /><meshLambertMaterial color="#6a5a30" /></mesh>
          {i === 3 ? <mesh position={[0, 0, 0.012]}><circleGeometry args={[0.02, 10]} /><meshBasicMaterial color="#0c0c0e" /></mesh> : <mesh position={[0, 0, 0.014]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.021, 0.023, 0.02, 12]} /><meshLambertMaterial color="#1c2a2c" /></mesh>}
        </group>; })}
      </group>
      {/* the lever, pulled */}
      <group position={leverAt}>
        <B p={[0, -0.06, 0]} s={[0.18, 0.2, 0.22]} c={ironD} /><B p={[0.1, 0.02, 0]} s={[0.04, 0.12, 0.12]} c="#6a5a2a" />
        <group position={[0.13, 0.02, 0]} rotation={[1.05, 0, 0]}><B p={[0, 0.36, 0]} s={[0.04, 0.72, 0.04]} c="#4a5058" /><FacetLathe profile={[[0.03, 0], [0.045, 0.04], [0.045, 0.16], [0.03, 0.2]]} sides={8} color="#7a2a24" pos={[0, 0.7, 0]} contact={false} /></group>
      </group>
    </group>
  );
};

/** The long desk thrown over on its side (DESK's size): the top standing on its back edge facing away, the four legs
 *  pointing out, the drawer unit's drawers slid half out, one drawer fallen on the floor in front. Bare: what was on it
 *  lies on the floor (SpiltPapers, FallenLamp). Origin = the middle of the edge it rests on. */
export const DeskOverturned: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => {
  const {w, d, h} = DESK, wood = '#6a4a30', woodD = '#4a3220', woodL = '#83603f';
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <group position={[0, d / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <B p={[0, h - 0.025, 0]} s={[w, 0.05, d]} c={woodL} />
        <B p={[0, h - 0.1, d / 2 - 0.04]} s={[w - 0.1, 0.1, 0.03]} c={wood} /><B p={[0, h - 0.1, -d / 2 + 0.04]} s={[w - 0.1, 0.1, 0.03]} c={woodD} />
        {[-1, 1].map((a) => [-1, 1].map((b) => <B key={`${a}${b}`} p={[a * (w / 2 - 0.06), (h - 0.05) / 2, b * (d / 2 - 0.06)]} s={[0.07, h - 0.05, 0.07]} c={woodD} />))}
        <B p={[w / 2 - 0.06, 0.14, 0]} s={[0.04, 0.05, d - 0.12]} c={woodD} cast={false} />
        <B p={[-w / 2 + 0.3, 0.42, 0]} s={[0.46, 0.5, d - 0.1]} c={wood} />
        <B p={[-w / 2 + 0.3, 0.55, d / 2 + 0.06]} s={[0.4, 0.18, 0.22]} c={woodL} /><B p={[-w / 2 + 0.3, 0.55, d / 2 + 0.17]} s={[0.08, 0.02, 0.025]} c="#9a7a3a" cast={false} />
        <B p={[-w / 2 + 0.3, 0.32, d / 2 - 0.04]} s={[0.4, 0.2, 0.02]} c={woodL} cast={false} />
        {/* a scorched patch on the underside */}
        <B p={[-0.3, h - 0.052, 0.05]} s={[0.9, 0.004, 0.6]} c="#2a1c14" cast={false} />
      </group>
      {/* the drawer that fell out, upside down, with its spilt pencils */}
      <group position={[-w / 2 + 0.2, 0, d / 2 + 0.45]} rotation={[0, 0.5, 0]}><B p={[0, 0.09, 0]} s={[0.4, 0.18, 0.5]} c={woodL} /><B p={[0, 0.09, 0.255]} s={[0.08, 0.02, 0.02]} c="#9a7a3a" cast={false} />{[[0.3, 0.1, 0.4], [0.35, -0.12, -0.3]].map(([x, z, a], i) => <B key={i} p={[x, 0.006, z]} s={[0.17, 0.012, 0.012]} r={[0, a, 0]} c={i ? '#3a5a7a' : '#e0b030'} />)}</group>
    </group>
  );
};

/** The desk lamp knocked to the floor: on its side, the green shade come off and lying upturned a little way off, the
 *  bulb broken. Origin = the foot. */
export const FallenLamp: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <group position={[0, 0.11, 0]} rotation={[0, 0, Math.PI / 2 - 0.1]}>
      <FacetLathe profile={[[0.11, 0], [0.11, 0.025], [0.07, 0.04], [0.03, 0.05]]} sides={12} color="#7a6230" contact={false} />
      <B p={[0, 0.2, 0]} s={[0.022, 0.38, 0.022]} c="#7a6230" /><B p={[-0.03, 0.4, 0.06]} s={[0.022, 0.022, 0.2]} r={[0, 0.9, 0]} c="#7a6230" />
    </group>
    <group position={[-0.6, 0.0, 0.25]} rotation={[0.35, 0.4, 0.15]}><FacetLathe profile={[[0.17, -0.1], [0.165, -0.085], [0.12, -0.01], [0.06, 0.05], [0.03, 0.07]]} pos={[0, 0.1, 0]} sides={14} color="#245238" contact={false} tones={[1.2, 0.95, 1.08, 1]} /></group>
    {[[-0.3, 0.12], [-0.22, -0.05], [-0.4, 0.02]].map(([x, z], i) => <B key={i} p={[x, 0.004, z]} s={[0.03, 0.004, 0.02]} r={[0, i, 0]} c="#d8d2c0" cast={false} />)}
  </group>
);

/** What spilt off a desk across a floor: loose sheets (some plans) lying at all angles, books fallen open and shut, a broken
 *  cup, crumpled sheets. Spread over [w, d] round pos; keep = clear circles [x, z, r] (room units, absolute) left free for
 *  feet. Deterministic by seed. */
export const SpiltPapers: React.FC<{pos: V3; area: [number, number]; n?: number; books?: number; seed?: number; keep?: [number, number, number][]}> = ({pos, area, n = 16, books = 5, seed = 1, keep = []}) => {
  const items = useMemo(() => {
    const r = rnd(seed), free = (x: number, z: number) => keep.every(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) > kr), out: {x: number; z: number; a: number; kind: number; s: number}[] = [];
    let tries = 0; while (out.length < n + books && tries++ < 400) { const x = pos[0] + (r() - 0.5) * area[0], z = pos[2] + (r() - 0.5) * area[1]; if (!free(x, z)) continue; out.push({x, z, a: r() * Math.PI * 2, kind: out.length < books ? 1 : r() < 0.3 ? 2 : r() < 0.6 ? 3 : 0, s: 0.8 + r() * 0.4}); }
    return out;
  }, [seed, n, books, JSON.stringify(pos), JSON.stringify(area), JSON.stringify(keep)]);
  const cols = ['#6a2e2a', '#2e4a6a', '#4a5a32', '#8a6a3a', '#3a2e3e', '#5a3a2a'];
  return (
    <group>{items.map(({x, z, a, kind, s}, i) => {
      const y = 0.006 + (i % 7) * 0.0012;
      if (kind === 1) return i % 2 ? <group key={i} position={[x, 0, z]} rotation={[0, a, 0]}><B p={[0, 0.025 * s, 0]} s={[0.3 * s, 0.05 * s, 0.22 * s]} c={cols[i % cols.length]} /><B p={[0, 0.025 * s, 0.111 * s]} s={[0.28 * s, 0.04 * s, 0.004]} c="#e2d8c0" cast={false} /></group>
        : <group key={i} position={[x, 0, z]} rotation={[0, a, 0]}><B p={[-0.085, 0.02, 0]} s={[0.17, 0.02, 0.24]} r={[0, 0, 0.12]} c={cols[(i + 2) % cols.length]} /><B p={[0.085, 0.02, 0]} s={[0.17, 0.02, 0.24]} r={[0, 0, -0.12]} c={cols[(i + 2) % cols.length]} /><mesh position={[0, 0.036, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.32, 0.22]} /><meshLambertMaterial color="#ece2c8" /></mesh></group>;
      if (kind === 2) return <FacetLathe key={i} profile={[[0.03, 0], [0.05, 0.02], [0.048, 0.05], [0.025, 0.075]]} sides={7} wobble={0.35} seed={i + 40} color="#e8e0cc" s={0.8} pos={[x, 0, z]} />;
      if (kind === 3) return <mesh key={i} position={[x, y, z]} rotation={[-Math.PI / 2, 0, a]} receiveShadow><planeGeometry args={[0.3 * s, 0.4 * s]} /><meshLambertMaterial map={tex(`spilt-plan-${i % 4}`, 300, 400, paintPlan('cream', 60 + (i % 4)))} /></mesh>;
      return <mesh key={i} position={[x, y, z]} rotation={[-Math.PI / 2, 0, a]} receiveShadow><planeGeometry args={[0.21 * s, 0.29 * s]} /><meshLambertMaterial color={i % 3 ? '#e6dcc2' : '#d6ccb0'} /></mesh>;
    })}</group>
  );
};

/** A heap of fallen books: a low front step and a taller back pile, spines every way, one lying open face down. Origin = the
 *  middle of the front step on the floor; it faces +z. STEP and BACK tell where something can stand on it and lean on it. */
export const BOOKPILE = {step: 0.19, back: [0, 0.47, -0.2] as V3};
export const BookPile: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => {
  const C = ['#6a2e2a', '#2e4a6a', '#4a5a32', '#8a6a3a', '#3a2e3e', '#5a3a2a', '#7a5a2a'];
  const stack: [number, number, number, number, number, number, number][] = [   // x, y, z, w, t, d, yaw; colour by index
    [0, 0.025, 0, 0.34, 0.05, 0.25, 0.1], [0.03, 0.075, 0.01, 0.3, 0.05, 0.22, -0.25], [-0.02, 0.1225, -0.01, 0.28, 0.045, 0.2, 0.35], [0.01, 0.1675, 0.0, 0.27, 0.045, 0.21, -0.1],
    [0.04, 0.03, -0.2, 0.36, 0.06, 0.26, -0.15], [-0.03, 0.09, -0.21, 0.32, 0.06, 0.24, 0.2], [0.02, 0.15, -0.2, 0.3, 0.06, 0.22, -0.4], [0.0, 0.205, -0.22, 0.31, 0.05, 0.23, 0.1],
    [-0.02, 0.255, -0.21, 0.28, 0.05, 0.2, 0.55], [0.03, 0.31, -0.22, 0.3, 0.06, 0.22, -0.2], [0.0, 0.37, -0.2, 0.26, 0.05, 0.2, 0.3], [0.02, 0.42, -0.21, 0.27, 0.05, 0.21, -0.35], [-0.24, 0.02, -0.08, 0.3, 0.04, 0.22, 1.2],
  ];
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {stack.map(([x, y, z, w, t, d, a], i) => <group key={i} position={[x, y, z]} rotation={[0, a, i === 10 ? 0.08 : 0]}><B p={[0, 0, 0]} s={[w, t, d]} c={C[i % C.length]} /><B p={[0.004, 0, d / 2 + 0.001]} s={[w - 0.02, t - 0.012, 0.004]} c="#e4dac2" cast={false} /></group>)}
      {/* one fallen open, face down, over the side of the back pile */}
      <group position={[0.24, 0.12, -0.18]} rotation={[0, -0.3, -0.9]}><B p={[0, 0, 0]} s={[0.17, 0.02, 0.24]} c="#2e4a6a" /><B p={[0, -0.016, 0]} s={[0.16, 0.012, 0.22]} c="#e4dac2" cast={false} /></group>
    </group>
  );
};

/** The mother's photograph after the blast (the same small wooden frame as on the desk, LabDesk): standing on its foot,
 *  leaning back by `lean` radians against whatever is behind it, the glass cracked from one corner in a star. It faces +z:
 *  turn it with rotY to face the lens. Origin = the middle of its bottom edge. */
export const PhotoCracked: React.FC<{pos: V3; rotY?: number; lean?: number; tiltZ?: number}> = ({pos, rotY = 0, lean = 0.28, tiltZ = 0.06}) => {
  const crack = tex('lab-glass-crack', 320, 400, (c, W, H) => {
    const r = rnd(12), o: [number, number] = [W * 0.72, H * 0.28];
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2.2; c.lineCap = 'round';
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2 + r() * 0.4; let x = o[0], y = o[1]; c.beginPath(); c.moveTo(x, y); const L = 60 + r() * 220; for (let s = 0; s < 6; s++) { x += Math.cos(a + (r() - 0.5) * 0.6) * L / 6; y += Math.sin(a + (r() - 0.5) * 0.6) * L / 6; c.lineTo(x, y); } c.stroke(); }
    c.lineWidth = 1.6; [18, 40].forEach((rr) => { c.beginPath(); for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI * 2, q = rr * (0.8 + r() * 0.4); const x = o[0] + Math.cos(a) * q, y = o[1] + Math.sin(a) * q; if (k) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); });
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.moveTo(o[0], o[1]); c.lineTo(o[0] + 40, o[1] - 50); c.lineTo(o[0] + 70, o[1] + 10); c.closePath(); c.fill();
  });
  return (
    <group position={pos} rotation={[0, rotY, tiltZ]}>
      <group rotation={[-lean, 0, 0]}><group position={[0, 0.1175, 0]}>
        <B p={[0, 0, 0]} s={[0.19, 0.235, 0.02]} c="#5a3a24" /><B p={[0, 0.112, 0.012]} s={[0.19, 0.012, 0.006]} c="#7a5434" cast={false} />
        <mesh position={[0, 0, 0.0105]}><planeGeometry args={[0.16, 0.2]} /><meshLambertMaterial map={portraitTex()} /></mesh>
        <mesh position={[0, 0, 0.0125]} renderOrder={6}><planeGeometry args={[0.16, 0.2]} /><meshBasicMaterial map={crack} transparent depthWrite={false} opacity={0.85} /></mesh>
        <B p={[-0.07, 0.09, 0.012]} s={[0.05, 0.03, 0.003]} r={[0, 0, 0.6]} c="#2a1a12" cast={false} />
      </group></group>
    </group>
  );
};

// ---------------------------------------------------------------- in the air round the machine
// (A painted silhouette of the mother stood here for the first version of shot 11. Daniel, 22/11/2026: the person in the door
//  of light must look like OUR people. She is now a figure of the mould: BA_MAU in src/mould/nguoi-mau.ts in the store preview, drawn inside fx Portal.)
/** Specks of light drifting one way through the air (the machine's glow in a close shot): small discs with a soft halo,
 *  carried along `wind` (metres per second, room units; default towards -x) and wrapping round the box, twinkling a little.
 *  box = [x0, x1, y0, y1, z0, z1]. */
export const DriftSpecks: React.FC<{f: number; box: [number, number, number, number, number, number]; n?: number; color?: string; size?: number; wind?: [number, number]; glow?: number; seed?: number}> =
  ({f, box, n = 26, color: color0 = '#9ff4ff', size = 0.006, wind = [-0.22, 0.03], glow = 0.35, seed = 2}) => {
    const bui = useBui(), color = bui.mau(color0, seed);
    const P0 = useMemo(() => { const r = rnd(seed); return Array.from({length: n}, () => [r(), r(), r(), 0.6 + r() * 0.9, r() * 6.28, 0.7 + r() * 0.6] as const); }, [seed, n]);
    const W = box[1] - box[0], Hh = box[3] - box[2];
    return <>{P0.map(([x, y, z, s, ph, sp], i) => {
      if (!bui.giu(i, n, seed)) return null;
      const t = f / 24, px = box[0] + (((x * W + wind[0] * sp * t) % W) + W) % W, py = box[2] + (((y * Hh + wind[1] * sp * t + Math.sin(f * 0.07 + ph) * 0.02) % Hh) + Hh) % Hh, k = 0.75 + 0.35 * Math.sin(f * 0.21 + ph * 3);
      const edge = Math.min(1, Math.min(px - box[0], box[1] - px) / (W * 0.12));
      return <group key={i} position={[px, py, box[4] + z * (box[5] - box[4])]} scale={k * Math.max(0.05, edge)}>
        <mesh renderOrder={5}><circleGeometry args={[size * s, 8]} /><meshBasicMaterial color={color} fog={false} transparent depthWrite={false} toneMapped={false} /></mesh>
        {glow > 0 && <Halo pos={[0, 0, 0.002]} r={size * s * 6} color={color} strength={glow * bui.sang} />}</group>;
    })}</>;
  };
