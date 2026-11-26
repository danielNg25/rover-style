import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rnd, Ctx, P} from './depth';
import {Embers} from './fx';
import {DriftSpecks, tex} from './kitLab';
import {Puppet3} from '../mould/Puppet3';
import type {Spec} from '../mould/draw';

/** lib3/kitCoiLua: FIRE THAT CHANGES COLOUR, MEPHISTO, and the fire effects of the Doom episode (d1c3, 22/11/2026), shared by
 *  chapters 3, 4, 5, 15, 16. Everything is flat (cut paper) and faces +z; everything is self-lit (no lamp needed) and runs on the
 *  frame `f` (redrawn every frame, the same on every render).
 *
 *  Hot things are NEVER one flat colour (Daniel: a flat orange mask "chưa ra chất"): every flame here has four nested tones
 *  (dark edge, body, bright middle, pale core), a glow behind it and points of light flying off it.
 *
 *  Draw order: these pieces are transparent and write no depth, so the ORDER decides what lies over what. Defaults: 3 like the
 *  set's flat pieces (behind figures, which are 500). Pass a higher order (600+) for flames that must lie OVER a figure. */
type V3 = [number, number, number];
type P2 = [number, number];
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), clamp(t)).getHexString();
const ease = (t: number) => { const x = clamp(t); return x * x * (3 - 2 * x); };
const softTex = () => tex('cl-soft', 128, 128, (c, W) => { const g = c.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, W); });
const shapeOf = (pts: P2[]) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); return s; };

// ================================================================ palettes: the fire that changes colour
export type FlamePal = {edge: string; body: string; mid: string; core: string; glow: string; spark: string};
export type FlameName = 'fire' | 'hell' | 'green' | 'soul' | 'violet' | 'gold' | 'ember';
/** FLAME palettes: fire = a camp fire; hell = Mephisto's deep red; green = Cynthia's witch fire before the pact; soul = pale
 *  blue (a soul, a ghost light); violet, gold = spare; ember = the far, dark, slow walls of fire of the fire realm. */
export const FLAME: Record<FlameName, FlamePal> = {
  fire: {edge: '#a3200c', body: '#e5501a', mid: '#ff9a2e', core: '#ffe6a0', glow: '#ff9a48', spark: '#ffcf70'},
  hell: {edge: '#5e0b06', body: '#b8190c', mid: '#ff4f16', core: '#ffc76a', glow: '#ff3c14', spark: '#ffb24a'},
  green: {edge: '#0d5a2e', body: '#22a64e', mid: '#7cec6a', core: '#eaffd6', glow: '#4cff7e', spark: '#c6ff9c'},
  soul: {edge: '#1c4c86', body: '#4a95dc', mid: '#a6d8ff', core: '#f2fbff', glow: '#9fd2ff', spark: '#dff3ff'},
  violet: {edge: '#3c1466', body: '#7a32c4', mid: '#c48aff', core: '#f6e8ff', glow: '#b070ff', spark: '#e6ccff'},
  gold: {edge: '#8a4a08', body: '#e09a18', mid: '#ffd24a', core: '#fff6cc', glow: '#ffc840', spark: '#fff0a0'},
  ember: {edge: '#6e1a0c', body: '#a02e14', mid: '#cc4c1c', core: '#ea7a30', glow: '#d8461a', spark: '#ffb24a'},
};
const palOf = (p: FlameName | FlamePal) => (typeof p === 'string' ? FLAME[p] : p);
/** a palette pushed towards white-hot (flare 0..1): for the beat where a flame flares up */
const hotter = (P: FlamePal, k: number): FlamePal => k <= 0 ? P : {edge: mix(P.edge, P.body, k), body: mix(P.body, P.mid, k), mid: mix(P.mid, P.core, k), core: mix(P.core, '#ffffff', k), glow: P.glow, spark: P.spark};

/** One tongue of flame as an outline: fat low down, a wavering tip, a round foot. Moves smoothly on every frame (no random jump).
 *  W, H = the size of the OUTER tongue it belongs to: inner tones pass their own w, h but the outer W, H, so that all four share
 *  one centre line and stay nested. */
const tongue = (w: number, h: number, f: number, seed: number, lean = 0, wob = 1, W = w, H = h): P2[] => {
  const N = 16, L: P2[] = [], R: P2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, y = h * t, ta = y / H, bulge = Math.sin(Math.PI * Math.min(1, 0.22 + t * 1.15));
    let hw = (w / 2) * Math.pow(1 - t, 0.85) * (0.5 + 0.62 * bulge);
    hw *= 1 + 0.24 * wob * ta * Math.sin(f * 0.47 + ta * 9 + seed * 2.3);
    const A = Math.min(W, H * 0.55);
    const cx = lean * H * ta * ta + wob * A * (0.34 * Math.pow(ta, 1.4) * Math.sin(f * 0.29 + ta * 4.2 + seed * 1.7) + 0.1 * ta * Math.sin(f * 0.71 + ta * 7.5 + seed));
    L.push([cx - hw, y]); R.push([cx + hw, y]);
  }
  const b0 = L[0], b1 = R[0], bot: P2[] = [];
  for (let k = 1; k < 6; k++) { const a = Math.PI * (k / 6); bot.push([b1[0] + ((b0[0] - b1[0]) * (1 - Math.cos(a))) / 2, -Math.sin(a) * (b1[0] - b0[0]) * 0.2]); }
  return [...L, ...R.reverse(), ...bot];
};
const LAYERS: [keyof FlamePal, number, number][] = [['edge', 1, 1], ['body', 0.8, 0.84], ['mid', 0.56, 0.62], ['core', 0.3, 0.36]];
/** four nested tones of one tongue */
const Tongue: React.FC<{x: number; y?: number; z?: number; w: number; h: number; f: number; seed: number; P: FlamePal; lean?: number; wob?: number; order: number; opacity?: number; tones?: number}> =
  ({x, y = 0, z = 0, w, h, f, seed, P, lean = 0, wob = 1, order, opacity = 1, tones = 4}) => (
    <group position={[x, y, z]}>
      {LAYERS.slice(0, tones).map(([k, sw, sh], li) => (
        <mesh key={li} position={[0, 0, li * 0.004]} renderOrder={order}>
          <shapeGeometry args={[shapeOf(tongue(w * sw, h * sh, f, seed, lean, wob, w, h))]} />
          <meshBasicMaterial color={P[k]} transparent opacity={opacity} depthWrite={false} fog={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
/** a soft additive glow whose strength may change on every frame (Halo bakes its strength into a texture) */
const Glow: React.FC<{pos: V3; r: number; color: string; k?: number; order?: number; sx?: number}> = ({pos, r, color, k = 0.5, order = 2, sx = 1}) => k <= 0.005 ? null : (
  <mesh position={pos} renderOrder={order} scale={[r * 2 * sx, r * 2, 1]}><planeGeometry /><meshBasicMaterial map={softTex()} color={color} transparent opacity={clamp(k)} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} /></mesh>
);

/** A RIBBON along a path (bolts, cage bars, cracks): pts in the group's own x-y plane (z kept as given), half-width hw per point.
 *  The geometry is kept and refilled on every frame (no new buffers per frame). */
const MAXN = 72;
const Strip: React.FC<{pts: V3[]; hw: number[]; color: string; order: number; opacity?: number; add?: boolean; map?: THREE.Texture}> = ({pts, hw, color, order, opacity = 1, add = false, map}) => {
  const g = useMemo(() => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXN * 6), 3)); geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(MAXN * 4), 2));
    const idx: number[] = []; for (let i = 0; i < MAXN - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(idx); return geo; }, []);
  const n = Math.min(MAXN, pts.length); if (n < 2) return null;
  const arr = g.attributes.position.array as Float32Array, uv = g.attributes.uv.array as Float32Array;
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, w = hw[i];
    arr.set([p[0] + nx * w, p[1] + ny * w, p[2], p[0] - nx * w, p[1] - ny * w, p[2]], i * 6); uv.set([i / (n - 1), 1, i / (n - 1), 0], i * 4);
  }
  g.setDrawRange(0, (n - 1) * 6); g.attributes.position.needsUpdate = true; g.attributes.uv.needsUpdate = true; g.computeBoundingSphere();
  return <mesh geometry={g} renderOrder={order} frustumCulled={false}><meshBasicMaterial map={map} color={color} transparent opacity={opacity} depthWrite={false} fog={false} toneMapped={false} side={THREE.DoubleSide} blending={add ? THREE.AdditiveBlending : THREE.NormalBlending} /></mesh>;
};
/** a soft-edged band (for glows along a ribbon): a strip whose texture fades to its two long edges */
const bandTex = () => tex('cl-band', 8, 64, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); });

// ================================================================ a flame of any colour
/** A FLAME OF ANY COLOUR (the coloured variant of Fire, no stones and no tripod): `n` tongues side by side, the middle one tallest,
 *  four tones each, a few small tongues breaking off the top and rising, a glow behind, optional sparks.
 *  h = height in metres (0.14 for the witch flame on a palm, 3 for a column), w = width (default 0.6 h); pal = a FLAME name or
 *  your own FlamePal; flare 0..1 = flaring up (taller, wider, white-hot). Faces +z (rotY in a turned room). */
export const ColorFlame: React.FC<{pos: V3; f: number; h: number; w?: number; pal?: FlameName | FlamePal; n?: number; seed?: number; flare?: number; glow?: number; sparks?: number; order?: number; lean?: number; opacity?: number; rotY?: number; flicks?: boolean}> =
  ({pos, f, h, w: w0, pal = 'fire', n = 3, seed = 1, flare = 0, glow = 1, sparks = 0, order = 3, lean = 0, opacity = 1, rotY = 0, flicks = true}) => {
    if (h <= 0.002) return null;
    const P = hotter(palOf(pal), flare * 0.7), w = (w0 ?? h * 0.6) * (1 + 0.25 * flare), H = h * (1 + 0.3 * flare), r = rnd(seed * 17 + 3);
    const ts = Array.from({length: n}, (_, j) => { const c = n === 1 ? 0 : j / (n - 1) - 0.5, a = r(), b = r();
      return {x: c * w * 0.6, hh: n === 1 || Math.abs(c) < 0.01 ? H : H * (1 - Math.abs(c) * 0.95) * (0.72 + a * 0.3), ww: n === 1 ? w : w * (0.5 + b * 0.14), s: seed * 7 + j * 3.1, lean: lean + c * 0.3}; });
    // the tallest last, so the side tongues sit behind it
    const order3 = ts.map((t, i) => [t, i] as const).sort((a, b) => a[0].hh - b[0].hh);
    return (
      <group position={pos} rotation={[0, rotY, 0]}>
        <Glow pos={[0, H * 0.42, -0.02]} r={Math.max(H, w) * 0.95 * glow} color={P.glow} k={0.55 * opacity * glow} order={order - 1} />
        <Glow pos={[0, H * 0.35, -0.03]} r={Math.max(H, w) * 1.9 * glow} color={P.glow} k={0.16 * opacity * glow} order={order - 1} />
        {order3.map(([t, i]) => <Tongue key={i} x={t.x} z={i * 0.0006} w={t.ww} h={t.hh} f={f} seed={t.s} P={P} lean={t.lean} order={order} opacity={opacity} />)}
        {/* small tongues breaking off the tips and rising, every 12 frames */}
        {flicks ? Array.from({length: Math.max(1, Math.round(n * 0.7))}, (_, k) => { const life = 12, q = f + k * 5 + seed * 3, u = (((q % life) + life) % life) / life, x = (rnd(k * 13 + Math.floor(q / life) * 7 + seed)() - 0.5) * w * 0.5;
          const fw = Math.min(w * 0.2, H * 0.11);
          return <Tongue key={`k${k}`} x={x + Math.sin(f * 0.3 + k) * w * 0.05} y={H * (0.72 + 0.5 * u)} z={0.02} w={fw * (1 - u)} h={fw * 2.2 * (1 - u * 0.6)} f={f} seed={k + seed} P={P} order={order} opacity={opacity * (1 - u)} tones={3} />; }) : null}
        {sparks > 0 ? <Embers f={f} box={[-w * 0.45, w * 0.45, H * 0.35, H * 1.7, -0.02, 0.04]} n={sparks} size={Math.max(0.006, H * 0.022)} life={30} seed={seed + 5} color={P.spark} /> : null}
      </group>
    );
  };

/** A WALL OF FIRE: a row of tongues from x0 to x1 standing on `base` (for the walls of the fire realm, the sea of fire under
 *  Mephisto, a burning field). step = frames a shape is held (4 = slow giant flames far away, 1 = near ones); gap = [x, half
 *  width] ranges left empty (to keep a clean area behind someone's head). */
export const FlameWall: React.FC<{f: number; x0: number; x1: number; z: number; base: number; h: [number, number]; n?: number; pal?: FlameName | FlamePal; step?: number; seed?: number; order?: number; gap?: [number, number][]; wob?: number; opacity?: number}> =
  ({f, x0, x1, z, base, h, n = 12, pal = 'ember', step = 1, seed = 1, order = 1, gap = [], wob = 0.7, opacity = 1}) => {
    const P = palOf(pal), fq = Math.floor(f / step) * step, r = rnd(seed * 31 + 7), dw = (x1 - x0) / n;
    // a tongue is never wider than about 0.6 of its height (wider ones turn into onion bulbs): pass more tongues to close gaps
    const items = Array.from({length: n}, (_, j) => { const x = x0 + dw * (j + 0.5) + (r() - 0.5) * dw * 0.6, hh = h[0] + r() * (h[1] - h[0]); return {x, hh, ww: Math.min(dw * (1.5 + r() * 0.7), hh * 0.6), s: seed * 11 + j * 2.3, lean: (r() - 0.5) * 0.25}; })
      .filter((t) => !gap.some(([gx, gw]) => Math.abs(t.x - gx) < gw)).sort((a, b) => a.hh - b.hh);
    return <>{items.map((t, i) => <Tongue key={i} x={t.x} y={base} z={z + i * 0.002} w={t.ww} h={t.hh} f={fq * 0.6} seed={t.s} P={P} lean={t.lean} wob={wob} order={order} opacity={opacity} />)}</>;
  };

// ================================================================ fire from the ground: a column and the cracks it comes out of
/** A COLUMN OF FIRE bursting up out of the ground at frame `at` (d1c3 shot 7): a flash for one frame, the column growing to h in
 *  `grow` frames (a little over, then settling), changing shape on every frame; a bright core pillar, low flames round its foot,
 *  a spray of sparks at the burst, embers rising all the time; dark smoke rolling out sideways along the ground (smoke); its
 *  own red light (light = intensity, 0 = none). pos = the spot on the ground. */
export const FireColumn: React.FC<{pos: V3; f: number; at?: number; h?: number; w?: number; pal?: FlameName | FlamePal; seed?: number; grow?: number; smoke?: boolean; light?: number; order?: number}> =
  ({pos, f, at = 0, h = 3, w = 2, pal = 'hell', seed = 1, grow = 4, smoke = true, light = 0, order = 3}) => {
    const d = f - at; if (d < 0) return null;
    const P = palOf(pal), g = d < grow ? ease((d + 1) / grow) * 1.08 : 1 + 0.06 * Math.sin(f * 0.55) * Math.sin(f * 0.23 + 1), flash = d < 2 ? 1 - d / 2 : 0;
    const flick = 0.86 + 0.14 * Math.sin(f * 1.7) * Math.sin(f * 0.6 + 1);
    const pillar: FlamePal = {edge: P.body, body: P.mid, mid: P.core, core: '#fffbe8', glow: P.glow, spark: P.spark};
    return (
      <group position={pos}>
        <Glow pos={[0, h * 0.5, -0.1]} r={h * 1.25} color={P.glow} k={0.42 * flick} order={order - 1} />
        {flash > 0 ? <><Glow pos={[0, h * 0.35, 0.3]} r={h * 1.6} color="#ffd9a0" k={0.95 * flash} order={order + 30} /><Glow pos={[0, h * 0.3, 0.32]} r={h * 0.7} color="#ffffff" k={flash} order={order + 31} /></> : null}
        <ColorFlame pos={[0, 0, 0]} f={f} h={h * g} w={w * (0.7 + 0.3 * Math.min(1, g))} pal={P} n={7} seed={seed} flare={flash * 0.8 + 0.35} glow={0} order={order} />
        <ColorFlame pos={[0, 0, 0.05]} f={f + 7} h={h * g * 0.9} w={w * 0.62} pal={pillar} n={3} seed={seed + 3} glow={0} order={order} />
        <Glow pos={[0, h * 0.4, 0.08]} r={w * 0.55} sx={0.8} color={P.core} k={0.32 * flick} order={order} />
        <ColorFlame pos={[0, -0.02, 0.12]} f={f + 3} h={h * 0.22 * Math.min(1, g)} w={w * 1.5} pal={P} n={7} seed={seed + 9} glow={0} order={order} flicks={false} />
        <FireBurst f={f} at={at} pos={[0, h * 0.15, 0.2]} n={44} up={6} spread={2.5} size={0.025} pal={P} seed={seed} order={order + 5} />
        <Embers f={f} box={[-w * 0.5, w * 0.5, h * 0.2, h * 1.5, 0.05, 0.3]} n={26} size={0.03} life={40} seed={seed + 2} color={P.spark} />
        {smoke ? Array.from({length: 12}, (_, i) => { const r = rnd(i * 43 + seed), born = 2 + i * 2.5, a = d - born; if (a < 0) return null;
          const t = a / 24, side = i % 2 ? 1 : -1, x = side * (w * 0.35 + (0.7 + r() * 0.8) * t * 1.1), y = 0.25 + t * (0.15 + r() * 0.25), k = (0.5 + r() * 0.5) * Math.min(1.9, 0.6 + t * 1.1), fade = clamp(1 - t / 3.2);
          return <mesh key={`s${i}`} position={[x, y + k * 0.2, 0.25 + r() * 0.4]} rotation={[0, 0, t * 0.4 * side]} renderOrder={order - 1} scale={[k * 1.8, k, 1]}><planeGeometry /><meshBasicMaterial map={softTex()} color={mix('#3a2420', '#1a1012', r())} transparent opacity={0.62 * fade} depthWrite={false} fog={false} /></mesh>; }) : null}
        {light > 0 ? <pointLight position={[0, h * 0.4, 0.8]} color={P.glow} intensity={light * flick * Math.min(1, g)} distance={16} decay={2} /> : null}
      </group>
    );
  };

/** A BURST OF SPARKS thrown out of a point at frame `at` (a column bursting up, a claw closing on a cage, a blow): streaks along
 *  their flight, white-hot then the palette's spark colour, falling back and going out within about 34 frames.
 *  up = upward speed (m/s), spread = sideways speed, size = thickness of a streak (metres; 0.02-0.04 seen from 10 m). */
export const FireBurst: React.FC<{f: number; at: number; pos: V3; n?: number; up?: number; spread?: number; size?: number; pal?: FlameName | FlamePal; seed?: number; order?: number}> =
  ({f, at, pos, n = 40, up = 5, spread = 2.5, size = 0.025, pal = 'hell', seed = 1, order = 8}) => {
    const d = f - at, P = palOf(pal); if (d < 0 || d > 34) return null;
    return <group position={pos}>{Array.from({length: n}, (_, i) => { const r = rnd(i * 29 + seed * 5), life = 14 + r() * 20; if (d > life) return null;
      const t = d / 24, vx = (r() - 0.5) * 2 * spread * (0.6 + r()), vy = up * (0.55 + r() * 0.9), x = vx * t, y = vy * t - 4.9 * t * t, k = 1 - d / life, vyy = vy - 9.8 * t, ang = Math.atan2(vyy, vx), s = size * (0.8 + r() * 1.2);
      return <mesh key={i} position={[x, y, r() * 0.3]} rotation={[0, 0, ang]} renderOrder={order} scale={[s * (2 + Math.min(5, Math.hypot(vx, vyy) * 0.5)), s, 1]}><planeGeometry /><meshBasicMaterial map={softTex()} color={k > 0.5 ? P.core : P.spark} transparent opacity={k} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} /></mesh>; })}</group>;
  };

/** CRACKS IN THE GROUND LIGHTING UP from the centre outward (d1c3 shot 7, round the ring of stones): jagged cracks with side
 *  branches, dark when unlit (dark = show them before), glowing from `at` and reaching radius r after `len` frames; three tones
 *  (wide glow, line, white-hot core) that pulse; a glow over the middle. Lies flat on the ground at pos; rot turns the plane
 *  (default flat on the ground; [0, 0, 0] stands it up facing the lens, for a rock face). k = brightness. */
export const GroundCracks: React.FC<{pos: V3; f: number; at?: number; r?: number; len?: number; n?: number; pal?: FlameName | FlamePal; seed?: number; dark?: boolean; k?: number; rot?: V3; order?: number}> =
  ({pos, f, at = 0, r = 2.4, len = 6, n = 9, pal = 'hell', seed = 1, dark = true, k = 1, rot = [-Math.PI / 2, 0, 0], order = 2}) => {
    const P = palOf(pal);
    const cracks = useMemo(() => { const q = rnd(seed * 13 + 1), out: {pts: V3[]; rho: number[]}[] = [];
      for (let i = 0; i < n; i++) { let a = (i / n) * Math.PI * 2 + (q() - 0.5) * 0.5, rho = 0.18 + q() * 0.2; const end = r * (0.65 + q() * 0.45), pts: V3[] = [], rs: number[] = [];
        while (rho < end) { pts.push([Math.cos(a) * rho, Math.sin(a) * rho, 0]); rs.push(rho); rho += 0.18 + q() * 0.22; a += (q() - 0.5) * 0.5; }
        out.push({pts, rho: rs});
        // a branch from somewhere along it
        if (pts.length > 4) { const s = 1 + Math.floor(q() * (pts.length - 3)); let b = a + (q() < 0.5 ? 0.7 : -0.7), rr = rs[s]; const bp: V3[] = [pts[s]], br: number[] = [rr];
          for (let j = 0; j < 3 + Math.floor(q() * 3); j++) { rr += 0.16 + q() * 0.14; b += (q() - 0.5) * 0.5; const p = bp[bp.length - 1]; bp.push([p[0] + Math.cos(b) * 0.2, p[1] + Math.sin(b) * 0.2, 0]); br.push(rr); }
          out.push({pts: bp, rho: br}); } }
      return out; }, [seed, n, r]);
    const spread = clamp((f - at) / len) * r * 1.1, pulse = (0.8 + 0.2 * Math.sin(f * 0.9) * Math.sin(f * 0.37 + seed)) * k;
    const lit = (c: {pts: V3[]; rho: number[]}) => { const o: V3[] = []; for (let i = 0; i < c.pts.length; i++) { if (c.rho[i] <= spread) o.push(c.pts[i]); else { if (i > 0) { const t = (spread - c.rho[i - 1]) / (c.rho[i] - c.rho[i - 1]), a = c.pts[i - 1], b = c.pts[i]; o.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0]); } break; } } return o; };
    const W = (pts: V3[], _w: number, z: number) => pts.map((p) => [p[0], p[1], z] as V3);
    return (
      <group position={pos} rotation={rot}>
        {dark ? cracks.map((c, i) => <Strip key={`d${i}`} pts={W(c.pts, 0, 0.006)} hw={c.pts.map((_, j) => 0.035 * (1 - 0.6 * j / c.pts.length))} color="#120a09" order={order} opacity={0.85} />) : null}
        {spread > 0 ? <>
          <Glow pos={[0, 0, 0.01]} r={Math.min(spread, r) * 0.9} color={P.glow} k={0.5 * pulse} order={order} />
          {cracks.map((c, i) => { const p = lit(c); if (p.length < 2) return null; const t = (m: number) => p.map((_, j) => m * (1 - 0.6 * j / c.pts.length));
            return <React.Fragment key={i}>
              <Strip pts={W(p, 0, 0.012)} hw={t(0.24)} color={P.glow} order={order} opacity={0.6 * pulse} add map={bandTex()} />
              <Strip pts={W(p, 0, 0.016)} hw={t(0.045)} color={P.mid} order={order + 1} opacity={Math.min(1, pulse * 1.1)} />
              <Strip pts={W(p, 0, 0.02)} hw={t(0.016)} color={P.core} order={order + 1} opacity={Math.min(1, pulse * 1.1)} />
            </React.Fragment>; })}
        </> : null}
      </group>
    );
  };

// ================================================================ a bolt of fire thrown through the air
/** A BOLT OF FIRE thrown from a to b (d1c3 shot 10, from Cynthia's hands to the soldiers): its head races from a to b in `travel`
 *  frames, the jet stays `hold` frames, then its tail runs after the head and it is gone in `fade` frames. A tapered jet, widest
 *  near the head with a pointed tip, four tones flickering backwards along it, glows along it, embers shed from it drifting down.
 *  w = thickness at the head (metres). The jet faces the lens; a and b may differ in depth a little. */
export const FireBolt: React.FC<{a: V3; b: V3; f: number; at?: number; travel?: number; hold?: number; fade?: number; w?: number; pal?: FlameName | FlamePal; seed?: number; order?: number}> =
  ({a, b, f, at = 0, travel = 6, hold = 8, fade = 7, w = 0.36, pal = 'hell', seed = 1, order = 520}) => {
    const d = f - at, P = palOf(pal); if (d < 0 || d > travel + hold + fade + 16) return null;
    const head = ease((d + 1) / travel) * 0.98 + (d >= travel ? 0.02 : 0), tail = ease((d - travel - hold) / fade), at3 = (s: number): V3 => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, px = -(b[1] - a[1]) / L, py = (b[0] - a[0]) / L, N = 40;
    const jet = tail < 0.995 && head > tail;
    const line = (zoff: number) => Array.from({length: N + 1}, (_, i) => { const u = i / N, s = tail + (head - tail) * u, p = at3(s), wob = w * 0.16 * Math.sin(s * L * 5 - f * 1.3 + seed) * u * (1 - u * 0.6);
      return [p[0] + px * wob, p[1] + py * wob, p[2] + zoff] as V3; });
    const prof = (m: number, ph: number) => Array.from({length: N + 1}, (_, i) => { const u = i / N, tip = u > 0.86 ? Math.pow(Math.cos(((u - 0.86) / 0.14) * Math.PI / 2), 0.7) : 1;
      return (w / 2) * m * (0.16 + 0.84 * Math.pow(u, 0.75)) * tip * (1 + 0.24 * Math.sin(u * 22 - f * 2.1 + seed + ph)) * (1 - tail * 0.6); });
    const hp = at3(head);
    return (
      <>
        {jet ? <>
          <Strip pts={line(-0.01)} hw={prof(2.6, 0)} color={P.glow} order={order} opacity={0.55} add map={bandTex()} />
          {(['edge', 'body', 'mid', 'core'] as (keyof FlamePal)[]).map((k, li) => <Strip key={k} pts={line(li * 0.004)} hw={prof([1, 0.76, 0.5, 0.24][li], li * 1.7)} color={P[k]} order={order + 1 + li} />)}
          <Glow pos={[hp[0], hp[1], hp[2] + 0.02]} r={w * 1.9} color={P.glow} k={0.55 * (1 - tail)} order={order + 6} />
          <Glow pos={[hp[0], hp[1], hp[2] + 0.03]} r={w * 0.7} color="#fff4d8" k={0.5 * (1 - tail)} order={order + 7} />
        </> : null}
        {/* embers shed along the way: born two a frame at the head, drifting down and back, going out */}
        {Array.from({length: 40}, (_, i) => { const born = i * 0.5, age = d - born; if (age < 0 || age > 16 || born > travel + hold) return null; const q = rnd(i * 23 + seed * 7), s0 = Math.min(head, ease((born + 1) / travel)) * (0.55 + 0.45 * q()), p = at3(s0), t = age / 24, k = 1 - age / 16;
          return <mesh key={i} position={[p[0] - (b[0] - a[0]) / L * t * 0.4 + (q() - 0.5) * w, p[1] + (q() - 0.5) * w * 0.8 - t * t * 2.2 + t * 0.3, p[2] + 0.05]} renderOrder={order + 8} scale={[0.05 * k + 0.01, 0.05 * k + 0.01, 1]}><planeGeometry /><meshBasicMaterial map={softTex()} color={k > 0.6 ? P.core : P.spark} transparent opacity={k} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} /></mesh>; })}
      </>
    );
  };

// ================================================================ the cage of fire, the floating rock
/** A CAGE OF FIRE (d1c3 shot 13): bars that are standing ribbons of fire (four tones, waving every two frames) set round a
 *  cylinder h high and w wide with a domed top, small tongues licking off every bar, a ring of low flames round its foot, a
 *  crown of fire on top, a glow inside, embers. pos = the middle of its foot. The bars in FRONT of the axis are drawn with
 *  orderFront (over a figure standing inside, 500), the ones behind with orderBack. flare 0..1 = the bars flare up (taller,
 *  thicker, white-hot). Stand the figure inside at about pos (cast={false}). */
export const FireCage: React.FC<{pos: V3; f: number; h?: number; w?: number; bars?: number; pal?: FlameName | FlamePal; flare?: number; seed?: number; glow?: number; orderBack?: number; orderFront?: number}> =
  ({pos, f, h: h0 = 2.4, w = 1.6, bars = 12, pal = 'hell', flare = 0, seed = 1, glow = 1, orderBack = 450, orderFront = 610}) => {
    const P = hotter(palOf(pal), flare * 0.8), h = h0 * (1 + 0.12 * flare), R = w / 2, dome = w * 0.42, wall = h - dome, arc = (Math.PI / 2) * dome * 0.9, sw = wall / (wall + arc), fs = Math.floor(f / 2) * 2, K = 30;
    const bar = (i: number) => { const th = (i / bars) * Math.PI * 2 + Math.PI / bars, sn = Math.sin(th), cs = Math.cos(th);
      const pts: V3[] = [], hw: number[] = [];
      for (let j = 0; j <= K; j++) { const s = j / K; let rr = R, y: number, top = 0;
        if (s < sw) y = (s / sw) * wall; else { const ph = ((s - sw) / (1 - sw)) * (Math.PI / 2) * 0.96; rr = R * Math.cos(ph); y = wall + dome * Math.sin(ph); top = ph / (Math.PI / 2); }
        const wig = 0.035 * (1 + flare) * Math.sin(y * 7 + fs * 0.8 + i * 2.1) * (1 - top);
        pts.push([rr * sn + wig, y, rr * cs]); hw.push(0.04 * (1 + 0.45 * Math.sin(y * 11 - fs * 1.1 + i * 1.3)) * (1 - 0.55 * top) * (1 + 0.8 * flare)); }
      return {pts, hw, front: cs >= 0, sn, cs, th}; };
    const all = Array.from({length: bars}, (_, i) => bar(i));
    const ring = (front: boolean) => { const pts: V3[] = []; for (let j = 0; j <= 36; j++) { const a = front ? Math.PI * (j / 36) : Math.PI + Math.PI * (j / 36); pts.push([R * Math.cos(a), 0.03, R * Math.sin(a)]); } return pts; };
    const tones: [keyof FlamePal, number][] = [['edge', 1], ['body', 0.72], ['mid', 0.46], ['core', 0.2]];
    return (
      <group position={pos}>
        <Glow pos={[0, h * 0.45, -R]} r={h * 1.05 * glow} color={P.glow} k={(0.5 + 0.4 * flare) * glow} order={orderBack - 20} />
        <Glow pos={[0, h * 0.4, -R - 0.1]} r={h * 1.4 * glow} color={P.glow} k={0.12 * glow} order={orderBack - 20} />
        {all.map((b, i) => { const order = b.front ? orderFront : orderBack;
          return <React.Fragment key={i}>
            <Strip pts={b.pts} hw={b.hw.map((x) => x * (b.front ? 2.2 : 3.2))} color={P.glow} order={order} opacity={b.front ? 0.26 : 0.4} add map={bandTex()} />
            {tones.map(([k, m], li) => <Strip key={k} pts={b.pts.map((p) => [p[0], p[1], p[2] + li * 0.003] as V3)} hw={b.hw.map((x) => x * m)} color={P[k]} order={order + 1} />)}
            {/* tongues licking up off the bar */}
            {[0, 1].map((k) => { const q = rnd(i * 7 + k * 3 + seed), t = 0.12 + q() * 0.3 + k * 0.38, j = Math.round(t * sw * K), p = b.pts[j], tall = 0.16 + q() * 0.3, cyc = 0.75 + 0.25 * Math.sin(f * 0.23 + i * 1.7 + k * 2);
              return <Tongue key={`t${k}`} x={p[0] + (b.sn > 0 ? 0.015 : -0.015)} y={p[1] - 0.03} z={p[2] + 0.015} w={(0.06 + q() * 0.06) * (1 + flare)} h={tall * cyc * (1 + 0.8 * flare)} f={f + i * 5 + k * 3} seed={i * 3 + k} P={P} lean={b.sn * (0.1 + q() * 0.3)} order={order + 2} tones={3} />; })}
          </React.Fragment>; })}
        {/* the ring of low flames at the foot: back half behind, front half over the figure's feet */}
        <Strip pts={ring(false)} hw={ring(false).map(() => 0.035)} color={P.mid} order={orderBack + 1} />
        <Strip pts={ring(true)} hw={ring(true).map(() => 0.035)} color={P.mid} order={orderFront + 1} />
        {Array.from({length: 16}, (_, k) => { const a = (k / 16) * Math.PI * 2 + 0.1, x = R * Math.cos(a), z = R * Math.sin(a), q = rnd(k * 11 + seed)();
          return <Tongue key={`r${k}`} x={x} y={0} z={z} w={0.15 + q * 0.06} h={(0.26 + q * 0.26) * (1 + 0.6 * flare)} f={f + k * 4} seed={k + 40} P={P} lean={Math.cos(a) * 0.35 * (0.4 + q)} order={(z >= 0 ? orderFront : orderBack) + 2} />; })}
        <ColorFlame pos={[0, h - 0.06, 0]} f={f} h={0.45 * (1 + 0.6 * flare)} w={0.34} pal={P} n={3} seed={seed + 21} glow={0.6} order={orderFront + 3} />
        <Embers f={f} box={[-R * 1.3, R * 1.3, 0.1, h * 1.3, -R, R]} n={22} size={0.028} life={44} seed={seed + 8} color={P.spark} />
        {flare > 0.02 ? <Glow pos={[0, h * 0.5, R + 0.2]} r={h * 0.9} color="#ffe2b0" k={0.5 * flare} order={orderFront + 10} /> : null}
      </group>
    );
  };

/** The floating rock of a fire realm: black basalt with a flat top and a jagged underside tapering to a point, faceted planes,
 *  strata, cracks of glowing lava, the underside lit red from the fire below, an orange catch-light on the top edge. Canvas
 *  900 x 560; the top surface is at row 78. */
export const paintFloatRock = (seed: number) => (c: Ctx, W: number, H: number) => {
  const s = W / 900; c.save(); c.scale(s, s); const r = rnd(seed * 19 + 4);
  const top: P2[] = Array.from({length: 11}, (_, i) => [40 + i * 82, 74 + (r() - 0.5) * 14] as P2);
  const under: P2[] = [[872, 110], [850, 190], [868, 250], [800, 320], [760, 410], [650, 462], [570, 535], [470, 556], [400, 498], [300, 470], [222, 400], [150, 328], [92, 250], [32, 172], [22, 108]].map(([x, y]) => [x + (r() - 0.5) * 30, y + (r() - 0.5) * 22] as P2);
  const out = [...top, ...under];
  const path = () => { c.beginPath(); out.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
  path(); c.fillStyle = '#3a2224'; c.fill(); c.save(); path(); c.clip();
  // faceted planes fanning from a line under the top
  const tones = ['#4a2c2c', '#3a2224', '#56342f', '#2c1a1c', '#4e302c'];
  for (let i = 0; i < under.length - 1; i++) { const a = under[i], b = under[i + 1], m: P2 = [460 + (r() - 0.5) * 160, 200 + r() * 80]; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(m[0], m[1]); c.closePath(); c.fillStyle = tones[i % tones.length]; c.fill(); }
  // strata
  c.strokeStyle = '#0a0507'; c.lineWidth = 4; for (let k = 0; k < 5; k++) { const y0 = 130 + k * 60 + r() * 20; c.beginPath(); for (let x = 30; x <= 870; x += 60) c.lineTo(x, y0 + (r() - 0.5) * 18 + (x - 450) * (r() - 0.5) * 0.06); c.stroke(); }
  // the top face, lit orange by the fire above
  c.beginPath(); top.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); for (let i = top.length - 1; i >= 0; i--) c.lineTo(top[i][0], top[i][1] + 26 + r() * 8); c.closePath(); c.fillStyle = '#3c2422'; c.fill();
  c.beginPath(); top.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.lineWidth = 5; c.strokeStyle = '#b4501e'; c.stroke();
  for (let i = 0; i < 14; i++) { const x = 60 + r() * 780, y = 82 + r() * 14; c.fillStyle = r() < 0.5 ? '#5a3226' : '#120a0c'; c.beginPath(); c.moveTo(x - 8, y + 6); c.lineTo(x, y - 6 - r() * 6); c.lineTo(x + 9, y + 6); c.fill(); }
  // the underside lit red from below
  let g = c.createLinearGradient(0, 560, 0, 200); g.addColorStop(0, 'rgba(255,80,20,0.55)'); g.addColorStop(0.5, 'rgba(180,30,10,0.25)'); g.addColorStop(1, 'rgba(120,20,8,0)'); c.fillStyle = g; c.fillRect(0, 0, 900, 560);
  // cracks of lava
  for (let k = 0; k < 5; k++) { let x = 150 + r() * 600, y = 520 - r() * 120; const pts: P2[] = [[x, y]]; for (let j = 0; j < 6; j++) { x += (r() - 0.5) * 70; y -= 30 + r() * 40; pts.push([x, y]); if (y < 140) break; }
    const line = (w: number, col: string, blur: number) => { c.shadowColor = '#ff3a0a'; c.shadowBlur = blur; c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.lineWidth = w; c.strokeStyle = col; c.lineJoin = 'round'; c.stroke(); };
    line(7, '#ff5a16', 18); line(2.5, '#ffd38a', 0); c.shadowBlur = 0; }
  c.restore();
  // a hot rim along the underside edge
  c.save(); path(); c.clip(); c.beginPath(); under.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.lineWidth = 12; c.strokeStyle = 'rgba(220,60,16,0.8)'; c.shadowColor = '#ff4a12'; c.shadowBlur = 16; c.stroke(); c.restore();
  c.restore();
};
/** A FLOATING ROCK (paintFloatRock) w metres wide whose top surface is at pos[1]; drift = it bobs and slides slowly with f. */
export const FloatRock: React.FC<{pos: V3; w: number; seed?: number; f?: number; drift?: number; order?: number}> = ({pos, w, seed = 1, f = 0, drift = 0, order = 3}) => {
  const t = tex(`cl-rock-${seed}`, 900, 560, paintFloatRock(seed)), h = (w * 560) / 900, y = pos[1] - (h / 2 - (78 / 560) * h);
  return <mesh position={[pos[0] + drift * f * 0.004, y + drift * 0.08 * Math.sin(f * 0.035 + seed), pos[2]]} renderOrder={order}><planeGeometry args={[w, h]} /><meshBasicMaterial map={t} transparent depthWrite={false} fog={false} toneMapped={false} /></mesh>;
};

// ================================================================ the air of the fire realm
/** Shimmer of heat: faint bands of light drifting up and swaying (additive), inside box = [x0, x1, y0, y1, z0, z1]. */
export const HeatRise: React.FC<{f: number; box: [number, number, number, number, number, number]; n?: number; color?: string; opacity?: number; seed?: number; order?: number}> =
  ({f, box, n = 14, color = '#ff8a3a', opacity = 0.14, seed = 1, order = 6}) => {
    const H = box[3] - box[2];
    return <>{Array.from({length: n}, (_, i) => { const q = rnd(i * 19 + seed), x = box[0] + q() * (box[1] - box[0]), z = box[4] + q() * (box[5] - box[4]), sp = 0.35 + q() * 0.5, ht = H * (0.3 + q() * 0.3), y = box[2] + (((q() * H + (f / 24) * sp) % H) + H) % H, edge = Math.min(1, (y - box[2]) / (H * 0.2), (box[3] - y) / (H * 0.25));
      return <mesh key={i} position={[x + Math.sin(f * 0.05 + i) * 0.3, y, z]} rotation={[0, 0, Math.sin(f * 0.04 + i * 2) * 0.12]} renderOrder={order} scale={[ht * 0.14, ht, 1]}><planeGeometry /><meshBasicMaterial map={softTex()} color={color} transparent opacity={opacity * Math.max(0, edge)} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} /></mesh>; })}</>;
  };
/** Grey ash drifting slowly sideways (the other half of a fire realm's air, with embers rising). */
export const AshDrift: React.FC<{f: number; box: [number, number, number, number, number, number]; n?: number; seed?: number}> = ({f, box, n = 40, seed = 3}) =>
  <DriftSpecks f={f} box={box} n={n} color="#8e807c" size={0.016} wind={[0.22, -0.03]} glow={0} seed={seed} />;

// ================================================================ MEPHISTO, the red devil of the comics, as a jointed cut-paper puppet
/** Approved design: kenh/phim-tv/out/d1c3/mephisto-thiet-ke-rieng.md (23/11/2026). Red skin, long black hair swept back with a
 *  deep widow's peak, a long gaunt face, pointed ears, a heavy brow over glowing yellow eyes, a wide grin of ivory teeth with a
 *  glowing mouth, a dark red cape with a tall flared collar, a black suit seen only as a strip down the middle, bony red hands
 *  with black claws. NO horns. Built as a puppet of flat pieces (two or three tones each, lit from the left), every piece on its
 *  own joint, so that a shot can act him: see MephistoPose.
 *  Units inside: the head's width = 1 ("HW"); the hips are the origin; the head's top is 4.35 HW above the hips. */
type Pt = P2;
/** one flat piece: a polygon in a single colour (pieces are stacked by order; they write no depth but are hidden by solid ground) */
const Poly: React.FC<{pts: Pt[]; color: string; order: number; z?: number; opacity?: number; add?: boolean}> = ({pts, color, order, z = 0, opacity = 1, add = false}) =>
  <mesh position={[0, 0, z]} renderOrder={order}><shapeGeometry args={[shapeOf(pts)]} /><meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} fog={false} toneMapped={false} side={THREE.DoubleSide} blending={add ? THREE.AdditiveBlending : THREE.NormalBlending} /></mesh>;
const mirP = (pts: Pt[]) => pts.map(([x, y]) => [-x, y] as Pt).reverse();
const D2R = Math.PI / 180;
export type MephArmPose = {sh: number; el: number; wrist?: number; spread?: number[]; curl?: number[];
  /** bare = the sleeve pushed back to the elbow, the forearm shows red skin (for close shots of the hand); shadow 0..1 = a soft
   *  shadow of forearm and hand on what is behind them */
  bare?: boolean; shadow?: number};
/** Everything a shot can drive. Angles in degrees. Arms are given for the figure's screen-LEFT arm and mirrored for the right:
 *  sh 0 = hanging down, + raises it outward (90 = straight out to the side, 170 = straight up); el + bends the forearm further
 *  the same way (out and up), - folds it in towards the body; wrist the same. spread[5] (thumb..little) 0..1.6 = how far each
 *  finger fans (1 = natural); curl[5] 0..1 = how far each finger curls in (thumb closes against the others).
 *  Head: turn -1..1 (- = face turned to screen left, three-quarter at about 0.6), nod -1..1 (+ = looks down), tilt (degrees,
 *  + = head leans to screen left), gaze [x, y] -1..1 (pupils in the eye slits), squint 0..1, brow -1..1 (+ = frown, inner ends
 *  down), jaw 0..1 (open), grin 0..1 (corners pulled up and wide), flash 0..1 (eyes white). Body: lean (degrees from the hips,
 *  + = to screen left), breath (amplitude, the chest rises every 48 frames), wind 0..2 (hair and cape blown back and up, as when
 *  fire bursts), fire 0..1 (flames round the hips), light 'side' | 'below' (lit from the left, or from fire below for close-ups). */
export type MephistoPose = {armL?: MephArmPose; armR?: MephArmPose; turn?: number; nod?: number; tilt?: number; gaze?: [number, number]; squint?: number; brow?: number;
  jaw?: number; grin?: number; flash?: number; lean?: number; breath?: number; wind?: number; fire?: number; light?: 'side' | 'below'};
export const MEPH_POSES: Record<string, MephArmPose> = {
  down: {sh: 8, el: -10, wrist: 0},
  reach: {sh: 55, el: -35, wrist: -10, spread: [1.2, 1.1, 1.1, 1.1, 1.2]},
  raise: {sh: 150, el: -30, wrist: -10, spread: [1.3, 1.2, 1.1, 1.2, 1.3]},
  beckon: {sh: 60, el: -70, wrist: -20, curl: [0.2, 0.5, 0.15, 0.15, 0.2]},
  fist: {sh: 40, el: -90, wrist: 0, curl: [1, 1, 1, 1, 1]},
};
// ---- palette (design: mephisto-thiet-ke-rieng.md)
const SK = {lit: '#c43a22', mid: '#9a2618', dark: '#6a160e', deep: '#4a0e08', hi: '#de5a36'};
const HAIR = {base: '#1c1018', sheen: '#3e2a44', edge: '#2c1c30'};
const CAPE = {lit: '#9a2018', mid: '#7a1612', dark: '#561010', lining: '#3a0c0e', rib: '#2a0808'};
const SUIT = {base: '#2a1624', lit: '#3e2232'};
const EYE = {fill: '#ffd84a', core: '#fff6c8', glow: '#ffb020', pupil: '#3a0a04'};
const TOOTH = {fill: '#f2e4c4', shade: '#c8b08a', edge: '#5a1a10'}, MOUTH = {glow: '#e8521e', deep: '#8a1c0e'};
const SHOULDER: Pt = [1.42, 2.52], UPPER = 1.3, FORE = 1.2, PALM = 0.5, NECK: Pt = [0, 2.8], HEAD_K = 1.45, TALL = 2.8 + 1.62 * 1.45;
// ---- the arm and hand (drawn for the LEFT arm; the right one is the same group mirrored)
const FINGERS = [ // base point on the palm's end, base angle (rad, + = towards the body side), length factor, width
  {b: [0.2, -0.36], a: 0.75, k: 0.66, w: 0.15}, {b: [0.13, -0.5], a: 0.16, k: 0.92, w: 0.13}, {b: [0.03, -0.53], a: 0.0, k: 1.0, w: 0.13},
  {b: [-0.08, -0.51], a: -0.16, k: 0.9, w: 0.125}, {b: [-0.18, -0.45], a: -0.36, k: 0.72, w: 0.115}];
const SEG = [0.3, 0.25, 0.22];
const fingerPiece = (L: number, w0: number, w1: number): Pt[] => [[-w0 / 2, 0.02], [-w0 * 0.58, -L * 0.15], [-w0 * 0.38, -L * 0.55], [-w1 * 0.55, -L * 0.9], [-w1 / 2, -L], [w1 / 2, -L], [w1 * 0.55, -L * 0.9], [w0 * 0.38, -L * 0.55], [w0 * 0.58, -L * 0.15], [w0 / 2, 0.02]];
const Hand: React.FC<{pose: MephArmPose; f: number; seed: number; oPalm: number; oFing: number}> = ({pose, f, seed, oPalm, oFing}) => {
  const tw = (i: number) => 0.04 * Math.sin(f * 0.13 + i * 1.7 + seed);   // the fingers never quite still
  const palm: Pt[] = [[-0.2, 0.06], [0.2, 0.06], [0.26, -0.2], [0.2, -0.5], [-0.2, -0.48], [-0.25, -0.2]];
  return <>
    <Poly pts={palm} color={SK.mid} order={oPalm} /><Poly pts={[[-0.2, 0.06], [0, 0.06], [0.02, -0.5], [-0.2, -0.48], [-0.25, -0.2]]} color={SK.lit} order={oPalm} z={0.001} />
    {[0, 1, 2, 3].map((i) => <Poly key={`k${i}`} pts={[[0.16 - i * 0.1, -0.12], [0.135 - i * 0.1, -0.45], [0.1 - i * 0.1, -0.46], [0.13 - i * 0.1, -0.12]]} color={i % 2 ? SK.dark : '#7e1c12'} order={oPalm} z={0.002} />)}
    {[0, 1, 2, 3].map((i) => <Poly key={`n${i}`} pts={[[0.17 - i * 0.105, -0.44], [0.12 - i * 0.105, -0.5], [0.07 - i * 0.105, -0.44], [0.12 - i * 0.105, -0.4]]} color={SK.hi} order={oPalm} z={0.003} />)}
    {FINGERS.map((F, i) => { const sp = pose.spread?.[i] ?? 1, cu = clamp(pose.curl?.[i] ?? 0), dir = i === 0 ? -1 : 1, base = F.a * sp, bend = dir * cu * [0.6, 0.85, 0.7][0];
      const L = SEG.map((l) => l * F.k * (1 - 0.18 * cu)), w = F.w;
      return <group key={i} position={[F.b[0], F.b[1], 0.003]} rotation={[0, 0, base + tw(i) + 0.08 * dir * (1 - cu)]}>
        <Poly pts={fingerPiece(L[0], w, w * 0.88)} color={SK.mid} order={oFing} /><Poly pts={[[-w / 2, 0], [-w * 0.55, -L[0] * 0.2], [-w * 0.44, -L[0]], [0, -L[0]], [0, 0]]} color={SK.lit} order={oFing} z={0.001} />
        <group position={[0, -L[0], 0.002]} rotation={[0, 0, bend * 0.9 + 0.12 * dir]}>
          <Poly pts={fingerPiece(L[1], w * 0.88, w * 0.76)} color={SK.mid} order={oFing} /><Poly pts={[[-w * 0.44, 0], [-w * 0.48, -L[1] * 0.2], [-w * 0.38, -L[1]], [0, -L[1]], [0, 0]]} color={SK.lit} order={oFing} z={0.001} />
          <Poly pts={[[-w * 0.5, 0.01], [w * 0.5, 0.01], [w * 0.45, -0.03], [-w * 0.45, -0.03]]} color={SK.dark} order={oFing} z={0.002} />
          <group position={[0, -L[1], 0.002]} rotation={[0, 0, bend * 1.1 + 0.15 * dir]}>
            <Poly pts={fingerPiece(L[2] * 0.6, w * 0.76, w * 0.6)} color={SK.mid} order={oFing} />
            {/* the black claw, hooked towards the palm side */}
            <Poly pts={[[-w * 0.36, -L[2] * 0.45], [w * 0.36, -L[2] * 0.45], [w * 0.3, -L[2] * 0.9], [w * 0.05 * dir, -L[2] * 1.3], [-dir * w * 0.55, -L[2] * 1.62], [-w * 0.32, -L[2] * 1.0]]} color="#140608" order={oFing} z={0.002} />
            <Poly pts={[[-w * 0.3, -L[2] * 0.5], [-w * 0.05, -L[2] * 0.5], [-dir * w * 0.2, -L[2] * 1.35], [-w * 0.28, -L[2] * 0.95]]} color="#4a2024" order={oFing} z={0.003} />
          </group>
        </group>
      </group>; })}
  </>;
};
/** a sleeve of the cape: red cloth, lit on its outer half, a dark lining showing at the bell of the cuff */
const Arm: React.FC<{pose: MephArmPose; f: number; seed: number; o: number; oPalm?: number; oFing?: number; wind: number; below?: boolean}> = ({pose, f, seed, o, oPalm, oFing, wind, below = false}) => {
  const sway = (0.6 + wind) * 0.05 * Math.sin(f * 0.11 + seed);
  return <group rotation={[0, 0, -pose.sh * D2R]}>
    <Poly pts={[[-0.26, 0.14], [0.24, 0.14], [0.2, -UPPER], [-0.19, -UPPER]]} color={CAPE.mid} order={o} />
    <Poly pts={[[-0.26, 0.14], [-0.02, 0.14], [-0.02, -UPPER], [-0.19, -UPPER]]} color={CAPE.lit} order={o} z={0.001} />
    <Poly pts={[[0.04, -0.2], [0.1, -0.25], [0.08, -1.0], [0.03, -0.95]]} color={CAPE.dark} order={o} z={0.002} />
    <group position={[0, -UPPER, 0.004]} rotation={[0, 0, -pose.el * D2R]}>
      {pose.bare ? <>
        {/* the sleeve pushed back: a ring of cloth and lining at the elbow, then the bare red forearm, lit like the face */}
        {(pose.shadow ?? 0) > 0 ? <mesh position={[0.22, -FORE * 0.75, -0.02]} renderOrder={o + 1} scale={[1.1, FORE * 1.9, 1]}><planeGeometry /><meshBasicMaterial map={softTex()} color="#1a0403" transparent opacity={0.6 * (pose.shadow ?? 0)} depthWrite={false} fog={false} /></mesh> : null}
        <Poly pts={[[-0.25, 0.06], [0.25, 0.06], [0.27, -FORE * 0.4], [0.2, -FORE], [-0.18, -FORE], [-0.26, -FORE * 0.4]]} color={SK.mid} order={o + 1} z={0.001} />
        <Poly pts={below ? [[0.25, 0.06], [0.08, 0.06], [0.06, -FORE], [0.2, -FORE], [0.27, -FORE * 0.4]] : [[-0.25, 0.06], [-0.05, 0.06], [-0.04, -FORE], [-0.18, -FORE], [-0.26, -FORE * 0.4]]} color={below ? SK.hi : SK.lit} order={o + 1} z={0.002} />
        <Poly pts={below ? [[-0.25, 0.06], [-0.12, 0.06], [-0.1, -FORE], [-0.18, -FORE], [-0.26, -FORE * 0.4]] : [[0.25, 0.06], [0.12, 0.06], [0.1, -FORE], [0.2, -FORE], [0.27, -FORE * 0.4]]} color={SK.dark} order={o + 1} z={0.002} />
        <Poly pts={[[-0.03, -0.3], [0.02, -0.32], [0.0, -FORE * 0.85], [-0.04, -FORE * 0.83]]} color={SK.deep} order={o + 1} z={0.003} />
        <Poly pts={[[-0.19, -FORE + 0.06], [0.21, -FORE + 0.06], [0.22, -FORE - 0.02], [-0.2, -FORE - 0.02]]} color={SK.dark} order={o + 1} z={0.003} />
        <Poly pts={[[-0.36, 0.16], [0.36, 0.16], [0.32, -0.08], [-0.32, -0.08]]} color={CAPE.mid} order={o + 1} z={0.004} />
        <Poly pts={[[-0.32, -0.03], [0.32, -0.03], [0.3, -0.1], [-0.3, -0.1]]} color={CAPE.lining} order={o + 1} z={0.005} />
      </> : <>
      <Poly pts={[[-0.2, 0.1], [0.2, 0.1], [0.16, -FORE * 0.55], [0.32 + sway, -FORE], [-0.32 + sway, -FORE], [-0.17, -FORE * 0.55]]} color={CAPE.mid} order={o + 1} />
      <Poly pts={[[-0.2, 0.1], [0, 0.1], [0, -FORE * 0.55], [sway, -FORE], [-0.32 + sway, -FORE], [-0.17, -FORE * 0.55]]} color={CAPE.lit} order={o + 1} z={0.001} />
      <Poly pts={[[-0.32 + sway, -FORE], [0.32 + sway, -FORE], [0.24 + sway, -FORE + 0.13], [-0.24 + sway, -FORE + 0.13]]} color={CAPE.lining} order={o + 1} z={0.002} />
      </>}
      <group position={[0, -FORE + 0.08, 0.004]} rotation={[0, 0, -(pose.wrist ?? 0) * D2R]}>
        <group scale={[1.25, 1.25, 1]}><Hand pose={pose} f={f} seed={seed} oPalm={oPalm ?? o + 2} oFing={oFing ?? o + 3} /></group>
      </group>
    </group>
  </group>;
};
/** where a hand of the figure is in the world (the middle of the palm): for things held, the chain, the cage carried */
export const mephistoHand = (pos: V3, h: number, side: 'L' | 'R', pose: MephistoPose, flip = false): V3 => {
  const s = h / TALL, arm = (side === 'L' ? pose.armL : pose.armR) ?? MEPH_POSES.down, m = side === 'L' ? 1 : -1, lean = (pose.lean ?? 0) * D2R;
  const rot = (p: Pt, a: number): Pt => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  // in the left arm's frame, then mirrored for the right
  const a1 = -arm.sh * D2R, a2 = a1 - arm.el * D2R, a3 = a2 - (arm.wrist ?? 0) * D2R;
  let p: Pt = [-SHOULDER[0], SHOULDER[1]];
  const add = (q: Pt) => { p = [p[0] + q[0], p[1] + q[1]]; };
  add(rot([0, -UPPER], a1)); add(rot([0, -FORE + 0.08], a2)); add(rot([0, -0.375], a3));
  let w: Pt = [p[0] * m, p[1]]; w = rot(w, lean);
  return [pos[0] + w[0] * s * (flip ? -1 : 1), pos[1] + w[1] * s, pos[2] + 0.02];
};
/** MEPHISTO (the comics' red devil) as a puppet. pos = the middle of his hips (put them under the ground, lava or fire when he is
 *  only seen from the waist up: solid ground hides what is below it); h = metres from the hips to the top of the head.
 *  pose = MephistoPose (every joint); breath, hair and cape sway and the fingers' twitch run by themselves with f.
 *  orders: base `order` (default 3); handOrders = {L: [palm, fingers], R: [...]} to wrap a hand ROUND something drawn between. */
export const Mephisto: React.FC<{pos: V3; f: number; h?: number; pose?: MephistoPose; order?: number; flip?: boolean; handOrders?: {L?: [number, number]; R?: [number, number]}; aura?: number}> =
  ({pos, f, h = 4.35, pose = {}, order = 3, flip = false, handOrders = {}, aura = 1}) => {
    const s = h / TALL, o = order, P = pose, turn = clamp(P.turn ?? 0, -1, 1), nod = clamp(P.nod ?? 0, -1, 1), wind = P.wind ?? 0, jaw = clamp(P.jaw ?? 0), grin = clamp(P.grin ?? 0.6), sq = clamp(P.squint ?? 0), brow = P.brow ?? 0.3, flash = clamp(P.flash ?? 0);
    const br = (P.breath ?? 1) * Math.sin((f / 48) * Math.PI * 2), below = P.light === 'below';
    const gz = P.gaze ?? [0, 0];
    // ---- head transform for turn and nod: features (dep 1) slide, the outline (dep 0.3) barely
    const sqx = 1 - 0.22 * Math.abs(turn);
    const T = (pts: Pt[], dep = 1): Pt[] => pts.map(([x, y]) => [x * sqx + turn * 0.16 * dep, y - nod * 0.08 * dep * (y < 1.1 ? 1 : 0.4)]);
    const cape = (k: number) => (0.5 + wind) * Math.sin(f * 0.07 + k * 1.3) * 0.12;
    const hairSway = (i: number) => (0.6 + wind) * 0.07 * Math.sin(f * 0.1 + i * 0.9) + wind * 0.18;
    // ---- face pieces (head frame: chin at y 0.2, top at 1.58)
    const mouthC = 0.33 + 0.04 * grin, cy = 0.6 + 0.07 * grin;
    const upLine = (n = 10): Pt[] => Array.from({length: n + 1}, (_, i) => { const u = i / n, x = -mouthC + 2 * mouthC * u, k = Math.abs(x) / mouthC; return [x, 0.53 + (cy - 0.53) * Math.pow(k, 1.6)] as Pt; });
    const drop = (x: number) => jaw * 0.22 * (1 - Math.pow(Math.abs(x) / mouthC, 2));
    const loLine = (n = 10): Pt[] => upLine(n).map(([x, y]) => [x, y - 0.025 - drop(x)] as Pt);
    const faceUp: Pt[] = [[-mouthC - 0.02, cy], [-0.38, 0.62], [-0.47, 0.92], [-0.46, 1.18], [-0.36, 1.42], [-0.18, 1.55], [0, 1.58], [0.18, 1.55], [0.36, 1.42], [0.46, 1.18], [0.47, 0.92], [0.38, 0.62], [mouthC + 0.02, cy], ...upLine().reverse()];
    const jawPts: Pt[] = [...loLine(), [mouthC + 0.02, cy], [0.3, 0.42 - jaw * 0.15], [0.14, 0.26 - jaw * 0.2], [0, 0.18 - jaw * 0.22], [-0.14, 0.26 - jaw * 0.2], [-0.3, 0.42 - jaw * 0.15], [-mouthC - 0.02, cy]];
    const lit = below ? {fore: SK.dark, cheek: SK.lit, chin: SK.hi, nose: SK.hi} : {fore: SK.lit, cheek: SK.lit, chin: SK.mid, nose: SK.hi};
    const hideL = turn > 0.3, hideR = turn < -0.3;   // the far ear goes behind the head
    const eyeL = (sqz: number): Pt[] => [[-0.37, 1.0], [-0.22, 1.0 - 0.0 * sqz], [-0.08, 0.95], [-0.2, 0.9 + 0.04 * sqz], [-0.33, 0.93 + 0.03 * sqz]].map(([x, y]) => [x, 0.955 + (y - 0.955) * (1 - 0.7 * sqz)] as Pt);
    const glowCol = mix(EYE.glow, '#ffffff', flash), eyeCol = mix(EYE.fill, '#ffffff', flash);
    const nUp = 9, teethUp = Array.from({length: nUp}, (_, i) => { const L = upLine(nUp), a = L[i], b = L[i + 1], mx = (a[0] + b[0]) / 2, hgt = 0.075 * (1 - 0.5 * Math.abs(mx) / mouthC); return [a, b, [mx, (a[1] + b[1]) / 2 - hgt]] as Pt[]; });
    const teethLo = Array.from({length: nUp - 1}, (_, i) => { const L = loLine(nUp), a = L[i], b = L[i + 1], mx = (a[0] + b[0]) / 2, hgt = 0.06 * (1 - 0.5 * Math.abs(mx) / mouthC); return [a, b, [mx, (a[1] + b[1]) / 2 + hgt]] as Pt[]; });
    const toothPoly = (t: Pt[], i: number, oo: number, key: string) => <React.Fragment key={key}>
      <Poly pts={t.map(([x, y]) => [x + (x - (t[0][0] + t[1][0]) / 2) * 0.12, y] as Pt)} color={TOOTH.edge} order={oo} />
      <Poly pts={[t[0], t[1], t[2]].map(([x, y], k) => (k < 2 ? [x + (k ? -0.004 : 0.004), y] : [x, y]) as Pt)} color={i % 2 ? TOOTH.fill : '#e8d6b0'} order={oo} z={0.001} />
      <Poly pts={[[(t[0][0] + t[1][0]) / 2, (t[0][1] + t[1][1]) / 2], t[1], t[2]]} color={TOOTH.shade} order={oo} z={0.002} />
    </React.Fragment>;
    // hair: locks swept back, each on its own sway (root, tip, width)
    const LOCKS: [Pt, Pt, number][] = [[[-0.2, 1.6], [-0.62, 1.88], 0.34], [[-0.36, 1.5], [-0.86, 1.4], 0.4], [[-0.45, 1.3], [-0.92, 0.75], 0.42], [[-0.47, 1.1], [-0.86, 0.15], 0.4], [[-0.44, 0.9], [-0.7, -0.25], 0.34], [[-0.38, 1.0], [-1.0, 0.4], 0.3]];
    const lock = ([r, t, w]: [Pt, Pt, number], i: number, side: number) => { const sw = hairSway(i + side * 3), tt: Pt = [t[0] - sw * 0.6, t[1] + sw * 0.5 + 0.04 * Math.sin(f * 0.13 + i)];
      const nx = -(tt[1] - r[1]), ny = tt[0] - r[0], L = Math.hypot(nx, ny) || 1, q = (k: number): Pt => [r[0] + (tt[0] - r[0]) * k + (nx / L) * w * 0.5 * (1 - k) * 1.0, r[1] + (tt[1] - r[1]) * k + (ny / L) * w * 0.5 * (1 - k)], q2 = (k: number): Pt => [r[0] + (tt[0] - r[0]) * k - (nx / L) * w * 0.5 * (1 - k), r[1] + (tt[1] - r[1]) * k - (ny / L) * w * 0.5 * (1 - k)];
      const pts: Pt[] = [q(0), q(0.5), tt, q2(0.55), q2(0)], sheen: Pt[] = [q(0.05), q(0.5), tt, [(q(0.5)[0] + q2(0.5)[0]) / 2, (q(0.5)[1] + q2(0.5)[1]) / 2]];
      const M = (p: Pt[]) => (side > 0 ? p.map(([x, y]) => [-x, y] as Pt) : p);
      return <React.Fragment key={`${side}-${i}`}><Poly pts={T(M(pts), 0.3)} color={HAIR.base} order={o + 8} /><Poly pts={T(M(sheen), 0.3)} color={HAIR.sheen} order={o + 8} z={0.001} /></React.Fragment>; };
    const handO = (sd: 'L' | 'R', k: number) => handOrders[sd]?.[k];
    const armL = P.armL ?? MEPH_POSES.down, armR = P.armR ?? MEPH_POSES.down;
    // ---- cape behind: shoulders to below the hips, flaring, the hem in tatters that sway
    const hem: Pt[] = Array.from({length: 13}, (_, i) => { const u = i / 12, x = -2.9 + 5.8 * u + cape(i) * 2; return [x, -1.4 + (i % 2 ? 0.35 : 0) + cape(i + 4)] as Pt; });
    const capeBack: Pt[] = [[-1.5, 2.66], [-2.2, 1.9 + cape(1) * 0.5], [-2.6, 0.6], ...hem, [2.6, 0.6], [2.2, 1.9 + cape(2) * 0.5], [1.5, 2.66]];
    // ---- the tall collar: a fan of jagged points behind the head, its dark lining towards us
    const collar: Pt[] = [[0, 0], [-0.1, 0.95], [-0.42, 1.95], [-0.62, 1.55], [-1.02, 2.15], [-1.2, 1.5], [-1.72, 1.7], [-1.6, 0.95], [-2.05, 0.7], [-1.35, -0.25]];
    const collarIn = collar.map(([x, y]) => [x * 0.8 + 0.04, y * 0.8 + 0.05] as Pt);
    const fl = 1 + 0.04 * Math.sin(f * 0.09) + wind * 0.06;
    return (
      <group position={pos} scale={[(flip ? -1 : 1) * s, s, s]}>
        {aura > 0 ? <Glow pos={[0, 2.6, -0.2]} r={3.4} sx={1.2} color="#ff4a16" k={0.28 * aura} order={o - 2} /> : null}
        <group rotation={[0, 0, (P.lean ?? 0) * D2R * 0.6]}>
          <Poly pts={capeBack} color={CAPE.mid} order={o} />
          {[-1.7, -0.9, 0.9, 1.7].map((x, i) => <Poly key={i} pts={[[x * 0.62, 2.3], [x * 0.62 + 0.12, 2.3], [x * 1.25 + cape(i) * 2 + 0.2, -1.1], [x * 1.25 + cape(i) * 2 - 0.15, -1.1]]} color={i < 2 ? CAPE.lit : CAPE.dark} order={o} z={0.001} />)}
        </group>
        <group rotation={[0, 0, (P.lean ?? 0) * D2R]}>
          {/* collar halves */}
          {[1, -1].map((sd) => <group key={sd} position={[-0.32 * sd, 2.82 + 0.03 * br, -0.01]} rotation={[0, 0, sd * 0.05 * (fl - 1) * 4]} scale={[sd * fl, fl, 1]}>
            <Poly pts={collar} color={sd > 0 ? CAPE.lit : CAPE.mid} order={o + 1} /><Poly pts={collarIn} color={CAPE.lining} order={o + 1} z={0.001} />
            {[[-0.3, 1.3], [-0.85, 1.6], [-1.3, 1.2], [-1.55, 0.6]].map(([x, y], i) => <Poly key={i} pts={[[0, 0.05], [0.03, 0.05], [x * 0.8 + 0.02, y * 0.8], [x * 0.8, y * 0.8]]} color={CAPE.rib} order={o + 1} z={0.002} />)}
          </group>)}
          {/* torso: the black suit, the red chest in a narrow V, the cape's front panels over the shoulders */}
          <group scale={[1, 1 + 0.012 * br, 1]}>
            <Poly pts={[[-0.3, 2.9], [-0.9, 2.78], [-1.55, 2.62], [-1.6, 2.2], [-1.25, 1.2], [-1.05, -0.4], [1.05, -0.4], [1.25, 1.2], [1.6, 2.2], [1.55, 2.62], [0.9, 2.78], [0.3, 2.9]]} color={SUIT.base} order={o + 2} />
            <Poly pts={[[-0.3, 2.9], [0.3, 2.9], [0.95, 2.66], [0.62, 1.4], [0, 0.75], [-0.62, 1.4], [-0.95, 2.66]]} color={SK.mid} order={o + 2} z={0.001} />
            <Poly pts={[[-0.3, 2.9], [0, 2.9], [0, 0.75], [-0.62, 1.4], [-0.95, 2.66]]} color={SK.lit} order={o + 2} z={0.002} />
            <Poly pts={[[-0.5, 1.6], [-0.06, 1.45], [-0.05, 1.38], [-0.45, 1.5]]} color={SK.dark} order={o + 2} z={0.003} /><Poly pts={[[0.5, 1.6], [0.06, 1.45], [0.05, 1.38], [0.45, 1.5]]} color={SK.deep} order={o + 2} z={0.003} />
            <Poly pts={[[-0.6, 2.5], [-0.05, 2.32], [0, 2.26], [-0.55, 2.42]]} color={SK.dark} order={o + 2} z={0.003} />
            <Poly pts={[[0.6, 2.5], [0.05, 2.32], [0, 2.26], [0.55, 2.42]]} color={SK.deep} order={o + 2} z={0.003} />
            <Poly pts={[[-0.01, 2.2], [0.01, 2.2], [0.01, 1.5], [-0.01, 1.5]]} color={SK.dark} order={o + 2} z={0.003} />
            <Poly pts={[[-0.5, 0.1], [0.5, 0.1], [0.55, -0.12], [-0.55, -0.12]]} color="#5a1410" order={o + 2} z={0.003} />
            {[1, -1].map((sd) => <React.Fragment key={sd}>
              <Poly pts={[[-0.98, 2.68], [-1.6, 2.62], [-1.72, 2.0], [-1.55, 0.9], [-1.42, -0.4], [-0.3, -0.4], [-0.38, 0.6], [-0.66, 1.4]].map(([x, y]) => [x * sd, y] as Pt)} color={sd > 0 ? CAPE.lit : CAPE.mid} order={o + 3} />
              <Poly pts={[[-0.98, 2.68], [-0.66, 1.4], [-0.38, 0.6], [-0.3, -0.4], [-0.38, -0.4], [-0.46, 0.6], [-0.74, 1.4]].map(([x, y]) => [x * sd, y] as Pt)} color={CAPE.lining} order={o + 3} z={0.001} />
              <Poly pts={[[-1.15, 2.4], [-1.1, 2.4], [-1.05, -0.3], [-1.12, -0.3]].map(([x, y]) => [x * sd, y] as Pt)} color={CAPE.dark} order={o + 3} z={0.002} />
            </React.Fragment>)}
          </group>
          {/* head */}
          <group position={[NECK[0], NECK[1] + 0.025 * br, 0.01]} rotation={[0, 0, (P.tilt ?? 0) * D2R]} scale={[HEAD_K, HEAD_K * (1 - 0.05 * Math.abs(nod)), 1]}>
            <Poly pts={[[-0.22, -0.2], [0.22, -0.2], [0.17, 0.4], [-0.17, 0.4]]} color={SK.dark} order={o + 7} />
            <Poly pts={T([[-0.4, 1.55], [-0.72, 1.3], [-0.82, 0.6], [-0.66, -0.1], [-0.3, 0.3], [0.3, 0.3], [0.66, -0.1], [0.82, 0.6], [0.72, 1.3], [0.4, 1.55], [0, 1.7]], 0.2)} color={HAIR.base} order={o + 8} />
            {LOCKS.map((l, i) => lock(l, i, 1))}{LOCKS.map((l, i) => lock(l, i, -1))}
            {/* ears */}
            {!hideL ? <><Poly pts={T([[-0.44, 1.04], [-0.78, 1.42], [-0.62, 1.0], [-0.45, 0.8]], 0.4)} color={SK.mid} order={o + 9} /><Poly pts={T([[-0.5, 1.0], [-0.7, 1.3], [-0.6, 1.0]], 0.4)} color={SK.dark} order={o + 9} z={0.001} /></> : null}
            {!hideR ? <><Poly pts={T(mirP([[-0.44, 1.04], [-0.78, 1.42], [-0.62, 1.0], [-0.45, 0.8]]), 0.4)} color={SK.dark} order={o + 9} /><Poly pts={T(mirP([[-0.5, 1.0], [-0.7, 1.3], [-0.6, 1.0]]), 0.4)} color={SK.deep} order={o + 9} z={0.001} /></> : null}
            {/* mouth inside (glowing), behind the face */}
            <Poly pts={T([...upLine(), ...loLine().reverse()])} color={MOUTH.glow} order={o + 10} />
            {jaw > 0.15 ? <Poly pts={T(upLine(8).slice(2, 7).map(([x, y]) => [x * 0.6, y - 0.05] as Pt).concat(loLine(8).slice(2, 7).reverse().map(([x, y]) => [x * 0.6, y + 0.04] as Pt)))} color={MOUTH.deep} order={o + 10} z={0.001} /> : null}
            {teethLo.map((t, i) => toothPoly(T(t), i, o + 11, `lo${i}`))}
            {teethUp.map((t, i) => toothPoly(T(t), i, o + 11, `up${i}`))}
            {/* face above the mouth: planes */}
            <Poly pts={T(faceUp, 0.3)} color={SK.mid} order={o + 12} />
            <Poly pts={T([[-0.47, 0.92], [-0.46, 1.18], [-0.36, 1.42], [-0.18, 1.55], [0, 1.58], [0, 0.66], [-0.2, 0.72], [-0.38, 0.62]], 0.6)} color={lit.fore} order={o + 12} z={0.001} />
            <Poly pts={T([[-0.43, 0.84], [-0.24, 0.74], [-0.34, 0.58], [-0.4, 0.64]], 0.7)} color={SK.deep} order={o + 12} z={0.002} />
            <Poly pts={T([[0.43, 0.84], [0.24, 0.74], [0.34, 0.58], [0.4, 0.64]], 0.7)} color={SK.deep} order={o + 12} z={0.002} />
            {below ? <Poly pts={T([[-0.4, 0.66], [-0.22, 0.76], [0, 0.7], [0.22, 0.76], [0.4, 0.66], [0.36, 0.62], [-0.36, 0.62]], 0.8)} color={lit.cheek} order={o + 12} z={0.003} /> : null}
            <Poly pts={T([[0.12, 1.25], [0.36, 1.42], [0.46, 1.18], [0.47, 0.92], [0.38, 0.86], [0.1, 1.0]], 0.6)} color={SK.dark} order={o + 12} z={0.003} />
            {/* eye sockets, eyes, pupils */}
            <Poly pts={T([[-0.43, 1.06], [-0.04, 0.98], [-0.05, 0.86], [-0.4, 0.86]])} color="#2e0806" order={o + 13} />
            <Poly pts={T(mirP([[-0.43, 1.06], [-0.04, 0.98], [-0.05, 0.86], [-0.4, 0.86]]))} color="#2e0806" order={o + 13} />
            <Poly pts={T(eyeL(sq))} color={eyeCol} order={o + 13} z={0.001} /><Poly pts={T(mirP(eyeL(sq)))} color={eyeCol} order={o + 13} z={0.001} />
            {[-1, 1].map((sd) => { const cx = sd * 0.22 + gz[0] * 0.06, cy0 = 0.955 - gz[1] * 0.02 * (1 - sq), hh = 0.04 * (1 - 0.7 * sq);
              return <Poly key={sd} pts={T([[cx - 0.015, cy0 + hh], [cx + 0.015, cy0 + hh], [cx + 0.012, cy0 - hh], [cx - 0.012, cy0 - hh]])} color={EYE.pupil} order={o + 13} z={0.002} />; })}
            {[-1, 1].map((sd) => { const c = T([[sd * 0.22, 0.955]])[0]; return <Glow key={`g${sd}`} pos={[c[0], c[1], 0.02]} r={0.2 + 0.15 * flash} sx={1.6} color={glowCol} k={(0.5 + 0.4 * flash) * (1 - 0.4 * sq)} order={o + 14} />; })}
            {/* brows: heavy, the inner ends drop with a frown */}
            {[-1, 1].map((sd) => { const b = brow * 0.06; const pts: Pt[] = [[sd * 0.46, 1.06], [sd * 0.08, 0.98 - b], [sd * 0.03, 1.05 - b], [sd * 0.44, 1.16]];
              return <React.Fragment key={`b${sd}`}><Poly pts={T(sd < 0 ? pts : pts.reverse())} color={sd < 0 && !below ? SK.lit : SK.mid} order={o + 14} /><Poly pts={T([[sd * 0.46, 1.06], [sd * 0.08, 0.98 - b], [sd * 0.1, 1.0 - b], [sd * 0.45, 1.09]])} color="#1a0606" order={o + 14} z={0.001} /></React.Fragment>; })}
            {/* nose: long and thin */}
            <Poly pts={T([[0, 1.0], [-0.055, 0.7], [0, 0.66]])} color={lit.nose} order={o + 14} /><Poly pts={T([[0, 1.0], [0, 0.66], [0.06, 0.7]])} color={SK.deep} order={o + 14} />
            {/* lower jaw: chin, lower lip */}
            <Poly pts={T(jawPts, 0.5)} color={lit.chin} order={o + 12} />
            <Poly pts={T([[0, 0.18 - jaw * 0.22], [0.14, 0.26 - jaw * 0.2], [0.3, 0.42 - jaw * 0.15], [0.1, 0.4 - jaw * 0.2]], 0.5)} color={SK.dark} order={o + 12} z={0.001} />
            <Poly pts={T([[-0.06, 0.32 - jaw * 0.2], [0.06, 0.32 - jaw * 0.2], [0, 0.18 - jaw * 0.22]], 0.6)} color={HAIR.base} order={o + 12} z={0.002} />
            {/* hair over the top with the deep widow's peak */}
            <Poly pts={T([[-0.48, 1.14], [-0.36, 1.28], [-0.16, 1.22], [0, 1.0], [0.16, 1.22], [0.36, 1.28], [0.48, 1.14], [0.45, 1.5], [0.22, 1.66], [0, 1.69], [-0.22, 1.66], [-0.45, 1.5]], 0.5)} color={HAIR.base} order={o + 15} />
            <Poly pts={T([[-0.3, 1.42], [-0.1, 1.3], [-0.02, 1.15], [-0.08, 1.5], [-0.28, 1.6]], 0.5)} color={HAIR.sheen} order={o + 15} z={0.001} />
            <Poly pts={T([[0.12, 1.36], [0.36, 1.4], [0.3, 1.56], [0.14, 1.58]], 0.5)} color={HAIR.edge} order={o + 15} z={0.001} />
          </group>
          {/* arms (in front of the body) */}
          <group position={[-SHOULDER[0], SHOULDER[1] + 0.03 * br, 0.02]}><Arm pose={armL} f={f} seed={1} o={o + 16} oPalm={handO('L', 0)} oFing={handO('L', 1)} wind={wind} below={below} /></group>
          <group position={[SHOULDER[0], SHOULDER[1] + 0.03 * br, 0.02]} scale={[-1, 1, 1]}><Arm pose={armR} f={f} seed={4} o={o + 16} oPalm={handO('R', 0)} oFing={handO('R', 1)} wind={wind} below={below} /></group>
          {/* a rim of firelight down the left edges */}
          <Glow pos={[-1.7, 1.4, 0.03]} r={1.6} sx={0.25} color="#ff8a3a" k={0.12} order={o + 22} />
        </group>
        {(P.fire ?? 0) > 0.01 ? <ColorFlame pos={[0, -0.1, 0.3]} f={f} h={1.3 * (P.fire ?? 0)} w={4.2} pal="hell" n={8} seed={31} glow={0.6} sparks={12} order={o + 24} /> : null}
      </group>
    );
  };
/** A SOUL as a shadow person (Daniel's choice: a "người bóng" with the shape of our own mould, no face): the figure of `spec`
 *  self-lit and tinted almost black, a little see-through, with a pale glow BEHIND it so its outline shines. glow 0..1 fades the
 *  light (a soul held fast, nearly put out). Used for Cynthia's soul in the fire realm (d1c3 shot 13). */
export const SoulFigure: React.FC<{spec: Spec; height: number; pos: V3; flip?: boolean; glow?: number; color?: string; opacity?: number; order?: number}> =
  ({spec, height, pos, flip, glow = 1, color = '#bfe4ff', opacity = 0.9, order = 500}) => (
    <>
      <Glow pos={[pos[0], pos[1] + height * 0.55, pos[2] - 0.05]} r={height * 0.62} sx={0.75} color={color} k={0.7 * glow} order={order - 2} />
      <Glow pos={[pos[0], pos[1] + height * 0.74, pos[2] - 0.04]} r={height * 0.3} color={color} k={0.65 * glow} order={order - 1} />
      <Puppet3 spec={spec} height={height} pos={pos} flip={flip} lit={false} tint="#0b0a12" opacity={opacity} cast={false} order={order} />
    </>
  );

// ================================================================ low-poly fire and peaks
/** One LOW-POLY FLAME as an outline: a jagged spike with two or three side points, straight edges (the cut-paper fire of the
 *  reference hell), a new shape every `step` frames. */
const jag = (w: number, h: number, seed: number): P2[] => { const r = rnd(seed), L: P2[] = [[-w / 2, 0]], R: P2[] = [[w / 2, 0]], n = 2 + Math.floor(r() * 2);
  for (let i = 1; i <= n; i++) { const t = i / (n + 1); L.push([-w / 2 * (1 - t) * (0.55 + r() * 0.3) - w * 0.12 * r(), h * t * (0.7 + r() * 0.2)], [-w / 2 * (1 - t) * 0.35, h * (t + 0.08)]);
    R.push([w / 2 * (1 - t) * (0.55 + r() * 0.3) + w * 0.12 * r(), h * t * (0.75 + r() * 0.2)], [w / 2 * (1 - t) * 0.35, h * (t + 0.1)]); }
  return [...L, [(r() - 0.5) * w * 0.25, h], ...R.reverse()]; };
const JAG_TONES: [keyof FlamePal, number, number][] = [['edge', 1, 1], ['body', 0.82, 0.84], ['mid', 0.64, 0.66], ['core', 0.42, 0.45]];
/** A ROW OF LOW-POLY FLAMES (the walls of fire of the reference hell): `n` jagged flames from x0 to x1 on `base`, heights in h,
 *  four nested tones, a new shape every `step` frames. pal 'fire' is the yellow-orange of the reference. */
export const JaggedFire: React.FC<{f: number; x0: number; x1: number; z: number; base: number; h: [number, number]; n?: number; pal?: FlameName | FlamePal; step?: number; seed?: number; order?: number; opacity?: number}> =
  ({f, x0, x1, z, base, h, n = 10, pal = 'fire', step = 3, seed = 1, order = 3, opacity = 1}) => {
    const P = palOf(pal), k = Math.floor(f / step), r = rnd(seed * 37 + 1), dw = (x1 - x0) / n;
    const items = Array.from({length: n}, (_, j) => { const hh = h[0] + r() * (h[1] - h[0]); return {x: x0 + dw * (j + 0.5) + (r() - 0.5) * dw * 0.5, hh, ww: Math.min(dw * (1.5 + r() * 0.6), hh * 0.75), s: seed * 100 + j * 7}; }).sort((a, b) => a.hh - b.hh);
    return <>{items.map((t, i) => { const hh = t.hh * (0.92 + 0.08 * Math.sin(k * 1.7 + i)); return <group key={i} position={[t.x, base, z + i * 0.003]}>
      {JAG_TONES.map(([tn, sw, sh], li) => <mesh key={li} position={[0, 0, li * 0.001]} renderOrder={order}><shapeGeometry args={[shapeOf(jag(t.ww * sw, hh * sh, t.s + k * 13))]} /><meshBasicMaterial color={P[tn]} transparent opacity={opacity} depthWrite={false} fog={false} toneMapped={false} side={THREE.DoubleSide} /></mesh>)}
    </group>; })}</>;
  };
/** RIDGES OF SHARP PEAKS for a Plate (1600 x 900 units): each peak a tall spike with a lit left face and a shaded right face,
 *  extra spikes on its flanks. base = screen row of their feet; top = [highest, lowest] row of the tips. */
export const paintPeaks = (c: Ctx, seed: number, base: number, top: [number, number], cols: [string, string], n = 14, x0 = -300, x1 = 1900, wide = 1) => {
  const r = rnd(seed), dw = (x1 - x0) / n;
  for (let i = 0; i < n; i++) { const x = x0 + dw * (i + 0.5) + (r() - 0.5) * dw * 0.6, ty = top[0] + r() * (top[1] - top[0]), w = dw * (0.9 + r() * 0.9) * wide, tx = x + (r() - 0.5) * w * 0.25;
    P(c, [[x - w / 2, base], [tx, ty], [tx + w * 0.06, base]], cols[0]); P(c, [[tx, ty], [x + w / 2, base], [tx + w * 0.06, base]], cols[1]);
    if (r() < 0.7) { const sx = x - w * 0.3, sy = ty + (base - ty) * (0.35 + r() * 0.2); P(c, [[sx - w * 0.18, base], [sx, sy], [sx + w * 0.05, base]], cols[0]); P(c, [[sx, sy], [sx + w * 0.16, base], [sx + w * 0.05, base]], cols[1]); }
  }
};
// ================================================================ the fire realm of the approved design: lava, obsidian, smoke, a chain
/** A LAKE OF LAVA (canvas 2048 x 2048, repeated): plates of cooled crust in three dark reds, each with a lit edge, floating on
 *  bright orange-yellow lava that shows in every gap. LavaLake lays it flat and SOLID (it hides what is below it: a giant
 *  standing waist-deep in it). x, z = extent; rep = repeats of the texture. */
export const paintLava = (c: Ctx, W: number) => { const r = rnd(17), S = W / 2048; c.save(); c.scale(S, S);
  const g = c.createLinearGradient(0, 0, 2048, 2048); g.addColorStop(0, '#f07024'); g.addColorStop(0.5, '#ffa040'); g.addColorStop(1, '#e45e1e'); c.fillStyle = g; c.fillRect(0, 0, 2048, 2048);
  const step = 150;
  for (let gy = -1; gy <= 14; gy++) for (let gx = -1; gx <= 14; gx++) { const cx = gx * step + (gy % 2) * 70 + (r() - 0.5) * 110, cy = gy * step + (r() - 0.5) * 100, R = 60 + r() * 40, n = 6 + Math.floor(r() * 3);
    const pts: P2[] = Array.from({length: n}, (_, i) => { const a = (i / n) * Math.PI * 2 + r() * 0.4, q = R * (0.8 + r() * 0.35); return [cx + Math.cos(a) * q, cy + Math.sin(a) * q * 0.9] as P2; });
    const tone = ['#6a2416', '#5a1e12', '#7a2c1a'][Math.floor(r() * 3)];
    P(c, pts, tone); P(c, [pts[n - 1], pts[0], pts[1], [cx, cy]], '#8e3a22'); P(c, [[cx, cy], pts[Math.floor(n / 2)], pts[Math.floor(n / 2) + 1]], '#4a160e');
    if (r() < 0.25) { c.strokeStyle = '#ff9a40'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - R * 0.5, cy + (r() - 0.5) * 20); c.lineTo(cx + R * 0.4, cy + (r() - 0.5) * 30); c.stroke(); } }
  c.restore(); };
export const LavaLake: React.FC<{x?: [number, number]; z?: [number, number]; y?: number; rep?: number}> = ({x = [-70, 70], z = [-90, -1], y = 0, rep = 3}) => {
  const t = useMemo(() => { const b = tex('cl-lava2', 2048, 2048, (c, W) => paintLava(c, W)), k = b.clone(); k.wrapS = k.wrapT = THREE.RepeatWrapping; k.repeat.set(rep, rep * (z[1] - z[0]) / (x[1] - x[0])); k.needsUpdate = true; return k; }, [rep, x[0], x[1], z[0], z[1]]);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(x[0] + x[1]) / 2, y, (z[0] + z[1]) / 2]}><planeGeometry args={[x[1] - x[0], z[1] - z[0]]} /><meshBasicMaterial map={t} fog={false} toneMapped={false} /></mesh>;
};
/** AN OBSIDIAN SPIRE (canvas 500 x 1400): black volcanic glass rising to a sharp point, cut into facets (three blacks and a
 *  plum), orange firelight caught on the left edges, a few glowing seams, a ragged foot. ObsidianSpire stands it h high. */
export const paintSpire = (seed: number) => (c: Ctx, W: number) => { const r = rnd(seed * 7 + 2), S = W / 500; c.save(); c.scale(S, S);
  const tip: P2 = [250 + (r() - 0.5) * 60, 10], L: P2[] = [tip], R: P2[] = [tip];
  for (let i = 1; i <= 7; i++) { const y = 10 + i * 195, half = 30 + i * 30 + (r() - 0.5) * 30; L.push([250 - half + (r() - 0.5) * 30, y]); R.push([250 + half + (r() - 0.5) * 30, y]); }
  const out = [...L, ...R.slice(1).reverse()]; P(c, out, '#1e1014');
  for (let i = 0; i < L.length - 1; i++) { P(c, [L[i], L[i + 1], [250 + (r() - 0.5) * 40, L[i + 1][1] - 60]], i % 2 ? '#2e161c' : '#3a1c22'); P(c, [R[i], R[i + 1], [250 + (r() - 0.5) * 40, R[i + 1][1] - 40]], i % 2 ? '#140a0e' : '#1a0c10'); }
  c.strokeStyle = '#ff8a3a'; c.lineWidth = 7; c.beginPath(); L.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  c.strokeStyle = '#ffb060'; c.lineWidth = 2.5; c.stroke();
  c.save(); c.shadowColor = '#ff4a10'; c.shadowBlur = 12; c.strokeStyle = '#ff7a2a'; c.lineWidth = 4;
  for (let k = 0; k < 3; k++) { let x = 220 + r() * 60, y = 500 + r() * 700; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (r() - 0.5) * 50; y -= 40 + r() * 50; c.lineTo(x, y); } c.stroke(); }
  c.restore(); c.restore(); };
export const ObsidianSpire: React.FC<{pos: V3; h: number; seed?: number; order?: number}> = ({pos, h, seed = 1, order = 3}) => {
  const t = tex(`cl-spire-${seed}`, 500, 1400, paintSpire(seed)), w = (h * 500) / 1400;
  return <mesh position={[pos[0], pos[1] + h / 2, pos[2]]} renderOrder={order}><planeGeometry args={[w, h]} /><meshBasicMaterial map={t} transparent depthWrite={false} fog={false} toneMapped={false} /></mesh>;
};
/** A BANK OF SMOKE (canvas 1024 x 320): rolling clouds with a lit underside, drifting sideways slowly. color = the cloud,
 *  lit = its underside; w x h metres at pos; speed in m per 24 frames. */
export const paintSmokeBank = (seed: number, color: string, lit: string) => (c: Ctx, W: number) => { const r = rnd(seed), S = W / 1024; c.save(); c.scale(S, S);
  for (let i = 0; i < 26; i++) { const x = r() * 1024, y = 150 + r() * 120, rx = 70 + r() * 110, ry = 50 + r() * 60; c.fillStyle = lit; c.beginPath(); c.ellipse(x, y + 14, rx, ry, 0, 0, 7); c.fill(); c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); }
  c.globalCompositeOperation = 'destination-in'; const g = c.createLinearGradient(0, 0, 1024, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.12, 'rgba(0,0,0,1)'); g.addColorStop(0.88, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 1024, 320);
  c.restore(); };
export const SmokeBank: React.FC<{pos: V3; w: number; h: number; f: number; speed?: number; seed?: number; color?: string; lit?: string; opacity?: number; order?: number}> =
  ({pos, w, h, f, speed = 0.3, seed = 1, color = '#5a1a14', lit = '#c2481e', opacity = 0.9, order = 2}) => {
    const t = tex(`cl-smoke-${seed}-${color}-${lit}`, 1024, 320, paintSmokeBank(seed, color, lit));
    return <mesh position={[pos[0] + (f / 24) * speed, pos[1] + 0.05 * h * Math.sin(f * 0.02 + seed), pos[2]]} renderOrder={order}><planeGeometry args={[w, h]} /><meshBasicMaterial map={t} transparent opacity={opacity} depthWrite={false} fog={false} toneMapped={false} /></mesh>;
  };
/** A CHAIN OF FIRE from a to b, sagging: links of glowing rings in two orientations, each flickering, a glow along it.
 *  link = length of one link (metres); sag = how far it hangs in the middle; opacity fades it out. */
export const FireChain: React.FC<{a: V3; b: V3; f: number; link?: number; sag?: number; pal?: FlameName | FlamePal; opacity?: number; order?: number}> =
  ({a, b, f, link = 0.35, sag = 1, pal = 'hell', opacity = 1, order = 8}) => {
    if (opacity <= 0.01) return null;
    const Pl = palOf(pal), L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(2, Math.round(L / link));
    const at = (t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t) + 0.05 * Math.sin(f * 0.15 + t * 6), a[2] + (b[2] - a[2]) * t];
    return <>{Array.from({length: n}, (_, i) => { const t = (i + 0.5) / n, p = at(t), q = at(Math.min(1, t + 0.01)), ang = Math.atan2(q[1] - p[1], q[0] - p[0]), k = 0.8 + 0.2 * Math.sin(f * 0.7 + i * 1.3);
      return <group key={i} position={p} rotation={[0, 0, ang]}>
        <mesh renderOrder={order} scale={[link * 0.62, i % 2 ? link * 0.14 : link * 0.36, 1]}><ringGeometry args={[0.62, 1, 14]} /><meshBasicMaterial color={i % 2 ? Pl.mid : Pl.core} transparent opacity={opacity * k} depthWrite={false} fog={false} toneMapped={false} /></mesh>
        <Glow pos={[0, 0, -0.01]} r={link * 0.9} color={Pl.glow} k={0.35 * opacity} order={order - 1} />
      </group>; })}</>;
  };
