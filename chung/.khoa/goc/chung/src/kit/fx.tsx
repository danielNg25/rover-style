import React, {useContext, useEffect, useId, useMemo} from 'react';
import * as THREE from 'three';
import type {V3, Pt} from './math';
import {rand, hash, clamp, deg} from './math';
import {twos, steps, idle, easeOut} from './timing';
import {Poly, Disc, Rect, RoundRect, Diamond, Stroke, FlatMat, MatFx, StageCtx, circlePts} from './shapes';

/** kit/fx: ambient loops and effects. Flat shapes in 2-4 tones. Rules v3 (LUAT-CUTOUT3D-v3 A1, I42-47): effects run ON ONES
 *  (a flame is a new shape every frame; particles move every frame); only characters are on twos.
 *  Every component is a pure function of f. */

// ---------------------------------------------------------------- fire, smoke
const flamePts = (w: number, h: number, t: number, seed: number): Pt[] => {
  // three fat tongues: a height field = max of three pointed lobes over a round belly. The lobes sway and
  // breathe with smooth phases (never re-randomised), so step to step the mass deforms instead of strobing.
  const T = [{c: -0.5, a: 0.6, s: 0.52}, {c: 0.03, a: 1, s: 0.62}, {c: 0.52, a: 0.74, s: 0.5}].map((o, i) => ({
    c: o.c + 0.09 * Math.sin(t * 0.9 + i * 2.1 + seed) + 0.04 * Math.sin(t * 2.1 + i * 1.3 + seed * 2),
    a: o.a * (1 + 0.17 * Math.sin(t * 1.25 + i * 2.6 + seed * 1.7) + 0.07 * Math.sin(t * 2.7 + i + seed)), s: o.s,
  }));
  const xs = Array.from({length: 41}, (_, i) => -1 + i / 20).concat(T.map((o) => o.c)).filter((x) => x > -1 && x < 1).sort((a, b) => a - b);
  const top = xs.map((x) => {
    const belly = 0.36 * Math.sqrt(1 - x * x);
    const y = Math.max(belly, ...T.map((o) => { const u = Math.abs((x - o.c) / o.s); return u < 1 ? o.a * Math.pow(1 - u, 0.62) : 0; }));
    return [x * w, y * h] as Pt;
  });
  const bottom = Array.from({length: 9}, (_, i) => { const a = (i / 8) * Math.PI; return [Math.cos(a) * w, -Math.sin(a) * w * 0.16] as Pt; });
  return [[-w, 0], ...top, ...bottom];
};
/** Cartoon fire: three fat tongues as ONE mass in three flat tones (outer, mid, core), reshaped every 2 frames.
 *  pos = centre of the base, w = half-width, h = height. embers = number of small crisp sparks rising (0 = none;
 *  keep it 3-6). No halo: if the story needs light, change a wall tone, do not add a glow. */
export const Flame: React.FC<{pos: V3; w: number; h: number; f: number; seed?: number; colors?: [string, string, string]; embers?: number; emberColor?: string; cadence?: 1 | 2}> =
  ({pos, w, h, f, seed = 0, colors = ['#e8552d', '#f6a52e', '#fde38a'], embers = 0, emberColor = '#f9c04a', cadence = 1}) => {
    // v3: a new outline EVERY frame (151 of 229 reference fire shots); cadence 2 only for small or far torches and candles
    const q0 = cadence === 2 ? twos(f) : f, t = q0 * 1.7;
    return (
      <group position={pos}>
        <Poly pts={flamePts(w, h, t, seed)} color={colors[0]} />
        <Poly pts={flamePts(w * 0.62, h * 0.64, t + 1.3, seed + 3)} color={colors[1]} pos={[0, 0, 0.004]} />
        <Poly pts={flamePts(w * 0.32, h * 0.34, t + 2.6, seed + 7)} color={colors[2]} pos={[0, 0, 0.008]} />
        {Array.from({length: Math.min(embers, 8)}, (_, i) => {
          const life = 20 + (i % 3) * 4, q = f + i * 7 + seed * 3, u = (q % life) / life, n = Math.floor(q / life);
          const x = (hash(n, i + seed) - 0.5) * w * 1.5 + Math.sin(u * 5 + i) * w * 0.12;
          return <Diamond key={i} w={w * 0.055 * (1 - u * 0.6)} color={emberColor} pos={[x, h * (0.55 + u * 1.1), 0.012]} />;
        })}
      </group>
    );
  };
/** Smoke or steam column: 4-8 flat circles that rise, grow and shrink away, stepping on twos. pos = source. */
export const Smoke: React.FC<{pos: V3; f: number; count?: number; size?: number; rise?: number; spread?: number; tones?: string[]; seed?: number; life?: number}> =
  ({pos, f, count = 5, size = 0.3, rise = 2, spread = 0.35, tones = ['#cfcbc4', '#b9b5b0'], seed = 0, life = 56}) => {
    const n = clamp(count, 4, 8), q = f;
    return (
      <group position={pos}>
        {Array.from({length: n}, (_, i) => {
          const u = ((q + (i * life) / n + seed * 5) % life) / life, born = Math.floor((q + (i * life) / n + seed * 5) / life);
          const x = (hash(born, i + seed) - 0.5) * spread * 0.6 + Math.sin(u * 3.2 + i * 2.4) * spread * u;
          const r = size * (0.45 + 0.75 * u) * Math.min(1, u / 0.12) * (u > 0.75 ? (1 - u) / 0.25 : 1);
          return <Disc key={i} r={r} color={tones[i % tones.length]} pos={[x, rise * u, 0.003 * i]} seg={28} />;
        })}
      </group>
    );
  };
/** One-off puff (appear / disappear / impact): 4-8 flat circles burst out from pos and shrink, on twos.
 *  Lives from frame f0 for dur frames; renders nothing outside. r = radius of the burst. */
export const Puff: React.FC<{pos: V3; f: number; f0: number; dur?: number; r?: number; count?: number; color?: string; seed?: number}> =
  ({pos, f, f0, dur = 10, r = 0.5, count = 6, color = '#f3efe4', seed = 0}) => {
    const q = f - f0; if (f < f0 || q >= dur) return null;
    const u = (q + 2) / dur, n = clamp(count, 4, 8);
    return (
      <group position={pos}>
        {Array.from({length: n}, (_, i) => {
          const a = (i / n) * Math.PI * 2 + hash(i, seed) * 0.7, d = r * (0.35 + 0.95 * easeOut(u)) * (0.75 + 0.5 * hash(i, seed + 1));
          return <Disc key={i} r={r * 0.42 * (1 - u * 0.85) * (0.7 + 0.6 * hash(i, seed + 2))} color={color} pos={[Math.cos(a) * d, Math.sin(a) * d * 0.8, 0.002 * i]} seg={24} />;
        })}
      </group>
    );
  };
/** Pop-in (v3 I46): children grow from a dot, overshoot and settle, ON ONES over 8 frames (reference: globe 9 frames,
 *  icon 8, label 5), with an optional puff that comes AFTER the object is there. */
export const PopIn: React.FC<{f: number; f0: number; pos?: V3; puff?: string | false; puffR?: number; children: React.ReactNode}> = ({f, f0, pos = [0, 0, 0], puff = '#f3efe4', puffR = 0.5, children}) => {
  if (f < f0) return null;
  const s = [0.08, 0.3, 0.62, 0.92, 1.12, 1.16, 1.06, 0.98, 1][Math.min(8, f - f0)];
  return <group position={pos}><group scale={s}>{children}</group>{puff ? <Puff pos={[0, puffR * 0.6, 0.05]} f={f} f0={f0 + 6} r={puffR} color={puff} /> : null}</group>;
};

// ---------------------------------------------------------------- sky
const UNIT = new THREE.PlaneGeometry(1, 1);
const STAR_VS = `attribute float aSize; attribute vec3 aColor; uniform float uPx; varying vec3 vC; varying float vS;
void main() { vC = aColor; vS = aSize * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = vS; }`;
const STAR_FS = `varying vec3 vC; varying float vS;
void main() { vec2 p = abs(gl_PointCoord - 0.5); float a = clamp((0.5 - p.x - p.y) * vS * 0.707 + 0.5, 0.0, 1.0); if (a <= 0.0) discard;
  gl_FragColor = vec4(vC, a); gl_FragColor = linearToOutputTexel(gl_FragColor); }`;
const V2 = new THREE.Vector2();
/** Sparse crisp stars: diamonds at CONSTANT brightness (no twinkle, no halo, no flare). pos = centre of the field,
 *  size = [width, height] in world units. px = [min, max] width of a star in PIXELS OF A 720p FRAME, the same at any
 *  depth and under any camera move (default [6, 11]; under 4 a star turns into a soft dot, so that throws).
 *  count: tens, not hundreds (default 36; a warning above 120; an error above 300). */
export const StarField: React.FC<{pos: V3; size: Pt; count?: number; seed?: number; px?: Pt; colors?: string[]}> =
  ({pos, size, count = 36, seed = 1, px = [6, 11], colors = ['#f6f1dc', '#f6f1dc', '#f6f1dc', '#ffd9a3', '#dfe6ff']}) => {
    if (count > 300) throw new Error(`kit: StarField count ${count} is far too dense (bible 8.3: tens of stars; hard limit 300)`);
    if (count > 120) console.warn(`kit: StarField count ${count} is dense; a night sky behind a set has tens of stars`);
    if (px[0] < 4 || px[1] > 24) throw new Error(`kit: StarField px [${px}] out of range: a star is 4-24 px wide on a 720p frame (smaller ones render as soft dots)`);
    const {geo, mat} = useMemo(() => {
      const r = rand(seed * 97 + 3), P: number[] = [], S: number[] = [], C: number[] = [];
      for (let i = 0; i < count; i++) {
        P.push((r() - 0.5) * size[0], (r() - 0.5) * size[1], 0); S.push(px[0] + r() * r() * (px[1] - px[0]));
        const c = new THREE.Color(colors[Math.floor(r() * colors.length)]); C.push(c.r, c.g, c.b);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aSize', new THREE.Float32BufferAttribute(S, 1)); g.setAttribute('aColor', new THREE.Float32BufferAttribute(C, 3));
      const m = new THREE.ShaderMaterial({uniforms: {uPx: {value: 1}}, vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, fog: false});
      return {geo: g, mat: m};
    }, [count, seed, size[0], size[1], px[0], px[1], colors.join()]);
    useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
    return <points position={pos} geometry={geo} material={mat} onBeforeRender={(gl: THREE.WebGLRenderer) => { mat.uniforms.uPx.value = gl.getDrawingBufferSize(V2).y / 720; }} />;
  };
const cloudPts = (lumps: {c: number; r: number}[], k: number, lift: number, cap = Infinity, shift = 0): Pt[] => {
  const x0 = Math.min(...lumps.map((l) => l.c - l.r * k)) + shift, x1 = Math.max(...lumps.map((l) => l.c + l.r * k)) + shift, n = 72, pts: Pt[] = [];
  for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n; pts.push([x, Math.min(cap, lift + Math.max(0, ...lumps.map((l) => { const d = (l.r * k) ** 2 - (x - shift - l.c) ** 2; return d > 0 ? Math.sqrt(d) : 0; })))]); }
  return [[x0, lift], ...pts, [x1, lift]];
};
/** Flat clouds: each one a row of overlapping lumps with a flat base, in 3 tones [body, shaded underside band, top
 *  light], drifting slowly sideways. pos = centre of the bank, size = [width, height] of the area they sit in,
 *  scale = lump radius, speed = world units per second (positive = to the right). */
export const Clouds: React.FC<{pos: V3; size: Pt; f: number; count?: number; scale?: number; tones?: [string, string, string]; speed?: number; seed?: number}> =
  ({pos, size, f, count = 3, scale = 0.6, tones = ['#f1ece0', '#d9d6d2', '#fbf8ef'], speed = 0.12, seed = 1}) => {
    const clouds = useMemo(() => {
      const r = rand(seed * 31 + 5);
      return Array.from({length: count}, (_, i) => {
        const n = 4 + Math.floor(r() * 3); let x = 0;
        const lumps = Array.from({length: n}, (_, j) => { const rr = scale * (0.55 + r() * 0.5) * (j === 0 || j === n - 1 ? 0.7 : 1.05); x += rr * 0.95; const l = {c: x, r: rr}; x += rr * 0.2; return l; });
        const mid = x / 2; lumps.forEach((l) => (l.c -= mid));
        return {lumps, x: ((i + 0.5) / count - 0.5) * size[0] + (r() - 0.5) * size[0] * 0.15, y: (r() - 0.5) * size[1], v: 0.7 + r() * 0.6, z: i * 0.02};
      });
    }, [count, seed, scale, size[0], size[1]]);
    return (
      <group position={pos}>
        {clouds.map((c, i) => {
          const rmin = Math.min(...c.lumps.map((l) => l.r));
          return (
            <group key={i} position={[c.x + speed * c.v * (f / 24), c.y, c.z]}>
              <Poly pts={cloudPts(c.lumps, 1, 0)} color={tones[0]} />
              <Poly pts={cloudPts(c.lumps, 0.62, rmin * 0.42, Infinity, -rmin * 0.1)} color={tones[2]} pos={[0, 0, 0.004]} />
              <Poly pts={cloudPts(c.lumps, 1, 0, rmin * 0.3)} color={tones[1]} pos={[0, 0, 0.006]} />
            </group>
          );
        })}
      </group>
    );
  };
/** Sky as flat horizontal colour bands, listed top to bottom (distance = lighter and bluer toward the horizon).
 *  pos = centre, size = [width, height]; shares = optional relative band heights. */
export const SkyBands: React.FC<{pos: V3; size: Pt; colors: string[]; shares?: number[]}> = ({pos, size, colors, shares}) => {
  const sh = shares ?? colors.map(() => 1), tot = sh.reduce((a, b) => a + b, 0); let y = size[1] / 2;
  return <group position={pos}>{colors.map((c, i) => { const h = (size[1] * sh[i]) / tot; y -= h; return <Rect key={i} w={size[0]} h={h + 0.01} color={c} pos={[0, y + h / 2, 0]} />; })}</group>;
};
/** Birds: small flat silhouettes crossing the sky, wings in 4 held poses changing on twos. pos = start centre,
 *  span = [dx, dy] they spread over, speed = world units per second along x. */
export const Birds: React.FC<{pos: V3; f: number; count?: number; size?: number; span?: Pt; speed?: number; color?: string; seed?: number}> =
  ({pos, f, count = 3, size = 0.18, span = [2, 0.8], speed = 0.5, color = '#2b2d3a', seed = 1}) => (
    <group position={pos}>
      {Array.from({length: Math.min(count, 7)}, (_, i) => {
        const a = deg([34, 12, -18, 12][(Math.floor(f / 2) + i * 3) % 4]), s = size * (0.75 + 0.5 * hash(i, seed)), cx = Math.cos(a) * s, sy = Math.sin(a) * s;
        const x = (hash(i, seed + 1) - 0.5) * span[0] + speed * (0.85 + 0.3 * hash(i, seed + 2)) * (f / 24), y = (hash(i, seed + 3) - 0.5) * span[1] + idle(f, seed + i, 8) * s * 0.15;
        return (
          <group key={i} position={[x, y, 0]} scale={[speed < 0 ? -1 : 1, 1, 1]}>
            <Poly pts={[[0, 0], [cx, sy], [cx * 0.3, sy * 0.3 - s * 0.2]]} color={color} />
            <Poly pts={[[0, 0], [-cx, sy], [-cx * 0.3, sy * 0.3 - s * 0.2]]} color={color} />
          </group>
        );
      })}
    </group>
  );
/** Weather: snow (small crisp discs) or rain (thin slanted streaks), in two depth layers inside a box.
 *  pos = centre of the box, size = [width, height, depth]. count 40+ (bible 7.4). Replaces any dust layer. */
export const Weather: React.FC<{kind: 'snow' | 'rain'; pos: V3; size: V3; f: number; count?: number; color?: string; wind?: number; seed?: number; grain?: number}> =
  ({kind, pos, size, f, count = 60, color, wind = 0.15, seed = 1, grain = 0.03}) => {
    const ps = useMemo(() => { const r = rand(seed * 53 + 11); return Array.from({length: Math.min(count, 240)}, (_, i) => ({x: r(), y: r(), near: i % 2 === 0, v: 0.75 + r() * 0.5, ph: r() * 6.28, k: 0.7 + r() * 0.6})); }, [count, seed]);
    const rain = kind === 'rain', col = color ?? (rain ? '#c9d6e6' : '#f7f5ee'), fall = (rain ? 9 : 1.1) / 24;
    return (
      <group position={pos}>
        {ps.map((p, i) => {
          const sc = p.near ? 1 : 0.6, y = size[1] / 2 - ((p.y * size[1] + f * fall * p.v * sc) % size[1]);
          const x = (((p.x * size[0] + (size[1] / 2 - y) * wind + (rain ? 0 : Math.sin(f * 0.07 + p.ph) * 0.12)) % size[0]) + size[0]) % size[0] - size[0] / 2;
          const z = p.near ? size[2] / 2 : -size[2] / 2;
          return rain
            ? <mesh key={i} geometry={UNIT} position={[x, y, z]} rotation={[0, 0, -Math.atan(wind)]} scale={[grain * 0.45 * sc, grain * 12 * sc * p.k, 1]}><FlatMat color={col} /></mesh>
            : <mesh key={i} position={[x, y, z]} scale={grain * sc * p.k}><circleGeometry args={[1, 10]} /><FlatMat color={col} /></mesh>;
        })}
      </group>
    );
  };

// ---------------------------------------------------------------- cloth, light, water
/** Hanging banner (kind 'banner': fixed along the top, pos = top centre) or flag on a pole (kind 'flag': fixed
 *  on the left edge, pos = middle of that edge). One flat shape whose free end sways, reshaped on twos.
 *  stripe = optional second colour band; notch = swallow-tail cut on a banner. amp 0.03-0.1. */
export const ClothSway: React.FC<{kind?: 'banner' | 'flag'; pos: V3; rot?: V3; w: number; h: number; f: number; color: string; stripe?: string; notch?: boolean; amp?: number; seed?: number; children?: React.ReactNode}> =
  ({kind = 'banner', pos, rot, w, h, f, color, stripe, notch = true, amp = 0.06, seed = 0, children}) => {
    const ph = (twos(f) / 2) * 0.42 + seed * 1.9, N = 10;
    let pts: Pt[], band: Pt[] = [];
    if (kind === 'banner') {
      const off = (v: number) => amp * w * v * Math.sin(ph - v * 1.7) + amp * 0.4 * w * v * Math.sin(ph * 1.9 + 1);
      const L: Pt[] = [], R: Pt[] = [];
      for (let j = 0; j <= N; j++) { const v = j / N; L.push([-w / 2 + off(v), -v * h]); R.push([w / 2 + off(v), -v * h]); }
      pts = [...L, ...(notch ? [[off(1), -h * 0.86] as Pt] : []), ...R.reverse()];
      const b0 = 0.16, b1 = 0.26; band = [[-w / 2 + off(b0), -b0 * h], [-w / 2 + off(b1), -b1 * h], [w / 2 + off(b1), -b1 * h], [w / 2 + off(b0), -b0 * h]];
    } else {
      const off = (u: number) => amp * h * u * Math.sin(ph - u * 3.4) * 1.6;
      const T: Pt[] = [], B: Pt[] = [];
      for (let j = 0; j <= N; j++) { const u = j / N; T.push([u * w, h / 2 + off(u)]); B.push([u * w, -h / 2 + off(u)]); }
      pts = [...T, ...B.reverse()];
      const M: Pt[] = [], M2: Pt[] = [];
      for (let j = 0; j <= N; j++) { const u = j / N; M.push([u * w, h * 0.12 + off(u)]); M2.push([u * w, -h * 0.12 + off(u)]); }
      band = [...M, ...M2.reverse()];
    }
    return (
      <group position={pos} rotation={rot}>
        <Poly pts={pts} color={color} />
        {stripe ? <Poly pts={band} color={stripe} pos={[0, 0, 0.004]} /> : null}
        {children ? <group position={[0, 0, 0.008]}>{children}</group> : null}
      </group>
    );
  };
/** Light shaft through a window or between trees: one flat pale trapezoid, 15-30 % opaque (clamped). pos = where
 *  it starts (centre of the opening), angle = lean in degrees, w0 / w1 = width at start / end, len = length. */
export const LightShaft: React.FC<{pos: V3; rot?: V3; angle?: number; w0: number; w1: number; len: number; f: number; color?: string; opacity?: number}> =
  ({pos, rot, angle = 20, w0, w1, len, f, color = '#fff3c8', opacity = 0.2}) => {
    const o = clamp(opacity, 0.12, 0.3) + (steps(f, 6) % 12 ? 0.012 : 0);
    return <group position={pos} rotation={rot}><Poly pts={[[-w0 / 2, 0], [w0 / 2, 0], [w1 / 2, -len], [-w1 / 2, -len]]} color={color} opacity={o} rot={[0, 0, deg(angle)]} order={800} /></group>;
  };
const GLOW_VS = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GLOW_FS = `uniform vec3 uColor; uniform float uA; varying vec2 vUv;
void main() { float r = clamp(length(vUv - 0.5) * 2.0, 0.0, 1.0); float a = uA * (1.0 - r) * (1.0 - r) * (1.0 + 2.0 * r);
  gl_FragColor = vec4(uColor, a); gl_FragColor = linearToOutputTexel(gl_FragColor); }`;
/** Soft glow: ONE disc whose opacity falls smoothly from `strength` at the centre to 0 at radius r (no rings).
 *  MAGIC, ENERGY HELD BY A CHARACTER, OR A SCREEN IN A DARK ROOM ONLY (bible 8.2): never on lamps, lanterns, windows,
 *  fires, thrusters or stars. ONE per shot: a second Glow inside the same <Stage> throws. strength = opacity at the
 *  centre, clamped to 0.3; pulses on twos when f is given. */
export const Glow: React.FC<{pos: V3; r: number; color: string; strength?: number; f?: number}> = ({pos, r, color, strength = 0.24, f}) => {
  const stage = useContext(StageCtx), id = useId();
  if (stage) stage.glows.add(id);   // v3 G37: halos are allowed on any emitter at night, at dusk and in close shots (about 205 reference shots)
  useEffect(() => () => { stage?.glows.delete(id); }, [stage, id]);
  const mat = useMemo(() => new THREE.ShaderMaterial({uniforms: {uColor: {value: new THREE.Color()}, uA: {value: 0}}, vertexShader: GLOW_VS, fragmentShader: GLOW_FS, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide}), []);
  useEffect(() => () => mat.dispose(), [mat]);
  mat.uniforms.uColor.value.set(color);
  mat.uniforms.uA.value = clamp(strength, 0, 0.6) * (f === undefined ? 1 : 0.9 + 0.1 * Math.sin(f * 0.45));
  return <mesh position={pos} geometry={UNIT} material={mat} scale={[r * 2, r * 2, 1]} renderOrder={850} />;
};
/** Water shimmer: a few short crisp light dashes lying on the water that stretch and shrink in place, on twos.
 *  pos = centre of the patch, size = [width, depth]; by default it lies flat (rot = [-90 deg, 0, 0]). */
export const WaterShimmer: React.FC<{pos: V3; size: Pt; f: number; rot?: V3; count?: number; color?: string; dash?: number; seed?: number}> =
  ({pos, size, f, rot = [-Math.PI / 2, 0, 0], count = 9, color = '#d8f0f2', dash = 0.5, seed = 1}) => {
    const t = (twos(f) / 2) * 0.33;
    return (
      <group position={pos} rotation={rot}>
        {Array.from({length: Math.min(count, 24)}, (_, i) => {
          const k = Math.max(0, Math.sin(t + hash(i, seed) * 6.28)), far = hash(i, seed + 2), sc = 0.55 + 0.45 * (1 - far);
          const w = dash * sc * (0.5 + hash(i, seed + 3)) * k; if (w < dash * 0.08) return null;
          return <RoundRect key={i} w={w} h={dash * 0.09 * sc} r={dash * 0.045 * sc} color={color} pos={[(hash(i, seed + 1) - 0.5) * size[0] + t * 0.03, (far - 0.5) * size[1], 0.002]} />;
        })}
      </group>
    );
  };

// ---------------------------------------------------------------- people
/** Background crowd: 3-8 repeated flat silhouettes (or your own puppets through `render`), each idling on twos
 *  with its own phase so nobody is frozen and no two move on the same frame. pos = centre of the row at ground
 *  level, h = figure height, gap = spacing. tones = body colours to cycle. */
export const Crowd: React.FC<{pos: V3; f: number; count?: number; h?: number; gap?: number; tones?: string[]; skin?: string; seed?: number; depth?: number; render?: (i: number, bob: number, tilt: number) => React.ReactNode}> =
  ({pos, f, count = 5, h = 1.6, gap, tones = ['#3d4a6b', '#6b4a4a', '#4f6b55'], skin, seed = 1, depth = 0.5, render}) => {
    if (count < 3 || count > 8) console.warn(`kit: Crowd count ${count} clamped to 3-8`);
    const n = clamp(Math.round(count), 3, 8), g = gap ?? h * 0.62;
    return (
      <group position={pos}>
        {Array.from({length: n}, (_, i) => {
          const fi = f + i * 3, bob = idle(fi, seed + i, 9 + (i % 3) * 2) * h * 0.012, tilt = idle(fi, seed + i + 40, 14 + (i % 4) * 3) * 2.5;
          const k = 0.88 + 0.24 * hash(i, seed), x = (i - (n - 1) / 2) * g + (hash(i, seed + 5) - 0.5) * g * 0.35, z = (hash(i, seed + 6) - 0.5) * depth, H = h * k, c = tones[i % tones.length];
          return (
            <group key={i} position={[x, bob, z]}>
              {render ? render(i, bob, tilt) : (<>
                <Poly pts={[[-H * 0.2, 0], [-H * 0.17, H * 0.5], [-H * 0.09, H * 0.6], [H * 0.09, H * 0.6], [H * 0.17, H * 0.5], [H * 0.2, 0]]} color={c} />
                <group position={[0, H * 0.6, 0.003]} rotation={[0, 0, deg(tilt)]}><Disc r={H * 0.2} color={skin ?? c} pos={[0, H * 0.17, 0]} seg={28} /></group>
              </>)}
            </group>
          );
        })}
      </group>
    );
  };
/** Floating particles, chosen by what is IN the scene (v3 I42-43; never a default layer):
 *  kind 'dust'    sparse pale dots drifting slowly through a room or a street (8-20; common, also indoors and by day)
 *       'embers'  orange dots rising from a fire at `pos` and thinning out (use with every open fire)
 *       'magic'   soft dots around a glowing hand or object at `pos`, at a new place every frame (give them the glow's colour)
 *       'fireflies' a few warm dots wandering, night exteriors
 *  pos = centre of the box (dust, fireflies) or the source (embers, magic); size = [width, height, depth] of the box or
 *  the reach. px = dot width in pixels of a 720p frame at the stage's usual distance. All of it moves ON ONES. */
export const Motes: React.FC<{kind: 'dust' | 'embers' | 'magic' | 'fireflies'; pos: V3; size: V3; f: number; count?: number; color?: string; r?: number; seed?: number}> =
  ({kind, pos, size, f, count, color, r, seed = 0}) => {
    const n = count ?? {dust: 14, embers: 16, magic: 10, fireflies: 7}[kind], col = color ?? {dust: '#f4f1e6', embers: '#f7a33a', magic: '#c8f5d2', fireflies: '#ffe9a0'}[kind];
    const rad = r ?? {dust: 0.014, embers: 0.018, magic: 0.022, fireflies: 0.02}[kind];
    return (
      <group position={pos}>
        {Array.from({length: n}, (_, i) => {
          let x: number, y: number, z: number, k = 1;
          if (kind === 'dust' || kind === 'fireflies') {
            const sp = kind === 'dust' ? 0.0016 : 0.004, ph = hash(i, seed) * 6.28;
            x = (((hash(i, seed + 1) + f * sp * (0.4 + hash(i, seed + 5))) % 1) - 0.5) * size[0] + Math.sin(f * 0.05 + ph) * 0.03;
            y = (hash(i, seed + 2) - 0.5) * size[1] + Math.sin(f * 0.031 + ph * 2) * (kind === 'dust' ? 0.04 : 0.12);
            z = (hash(i, seed + 3) - 0.5) * size[2];
          } else if (kind === 'embers') {
            const life = 26 + (i % 5) * 6, q = f + i * 9 + seed * 5, u = (q % life) / life, c = Math.floor(q / life);
            x = (hash(c, i + seed) - 0.5) * size[0] * (0.35 + u) + Math.sin(u * 7 + i) * size[0] * 0.06; y = u * size[1]; z = (hash(c, i + 9) - 0.5) * size[2]; k = 1 - u * 0.75;
          } else {
            const a = hash(f, i + seed) * 6.28, d = Math.sqrt(hash(f + 3, i + seed)) * 0.5;   // repositioned every frame
            x = Math.cos(a) * d * size[0]; y = Math.sin(a) * d * size[1] + size[1] * 0.15; z = 0.02; k = 0.5 + hash(i, seed + 7);
          }
          return <mesh key={i} position={[x, y, z]} scale={k} renderOrder={860}><circleGeometry args={[rad, 10]} /><meshBasicMaterial color={col} transparent opacity={kind === 'dust' ? 0.85 : 0.95} fog={false} depthWrite={false} /></mesh>;
        })}
      </group>
    );
  };

/** One soft-edged blob on the ground. v3 F31-33: a STANDING figure gets a real cast shadow from the set's key light
 *  (<Stage shadows="cast"> is the default, mould/Puppet3 casts its own outline). Use this blob only for the detached
 *  shadow that stays on the ground under a HOVERING figure, or the contact pool under a hem in a dark interior. */
export const BlobShadow: React.FC<{pos: V3; r: number; sy?: number; color?: string; opacity?: number}> = ({pos, r, sy = 0.45, color = '#20222e', opacity = 0.2}) => (
  <group position={pos} rotation={[-Math.PI / 2, 0, 0]}>
    <Disc r={r} sy={sy} color={color} opacity={opacity * 0.5} order={5} /><Disc r={r * 0.8} sy={sy} color={color} opacity={opacity * 0.6} pos={[0, 0, 0.002]} order={6} />
  </group>
);

// ---------------------------------------------------------------- draw-on marks (pass p = prog(f, f0, dur))
type Mark = {pos?: V3; rot?: V3; color?: string; width?: number; p?: number; order?: number};
/** Hand-drawn circle around something: slightly lopsided, overlaps its own start. r = radius, sy = squash. */
export const MarkCircle: React.FC<Mark & {r: number; sy?: number}> = ({pos, rot, color = '#c8372d', width, p = 1, r, sy = 0.8, order = 900}) => {
  const pts = circlePts([0, 0], r, 100, -285, 56, sy).map(([x, y], i) => [x * (1 + 0.04 * Math.sin(i * 0.5)), y * (1 + 0.05 * Math.cos(i * 0.37)) + (i / 56) * r * 0.08] as Pt);
  return <Stroke pts={pts} width={width ?? r * 0.09} taper={0.6} p={p} color={color} pos={pos} rot={rot} order={order} />;
};
/** Tick (check mark). size = its width. */
export const MarkTick: React.FC<Mark & {size: number}> = ({pos, rot, color = '#3c9a4b', width, p = 1, size, order = 900}) =>
  <Stroke pts={[[-size * 0.42, 0.02 * size], [-size * 0.12, -size * 0.32], [size * 0.5, size * 0.42]]} width={width ?? size * 0.16} taper={0.7} p={p} color={color} pos={pos} rot={rot} order={order} />;
/** Strike-through line from a to b (slightly wavy). */
export const MarkStrike: React.FC<Mark & {a: Pt; b: Pt}> = ({pos, rot, color = '#c8372d', width, p = 1, a, b, order = 900}) => {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l;
  const pts = Array.from({length: 13}, (_, i) => { const t = i / 12, o = Math.sin(t * 7) * l * 0.012; return [a[0] + (b[0] - a[0]) * t + nx * o, a[1] + (b[1] - a[1]) * t + ny * o] as Pt; });
  return <Stroke pts={pts} width={width ?? l * 0.045} taper={0.7} p={p} color={color} pos={pos} rot={rot} order={order} />;
};
/** Dotted route through points (map device): dashes appear along the path as p grows; a pin dot at the end. */
export const MarkRoute: React.FC<Mark & {pts: Pt[]; dash?: Pt; dot?: number}> = ({pos, rot, color = '#c8372d', width = 0.05, p = 1, pts, dash, dot, order = 900}) => (
  <group position={pos} rotation={rot}>
    <Stroke pts={pts} width={width} p={p} dash={dash ?? [width * 2.2, width * 2]} color={color} order={order} />
    {p >= 1 ? <Disc r={dot ?? width * 1.8} color={color} pos={[pts[pts.length - 1][0], pts[pts.length - 1][1], 0.002]} order={order + 1} /> : null}
  </group>
);

// ---------------------------------------------------------------- the one allowed blur
/** Soft focus by multi-draw. v3 B14: in CLOSE and MEDIUM shots wrap the far part of the set (walls, trees, sky cards) in
 *  <NearBlur radius=...> so the background is softer than the character (127 of 194 soft-background reference shots are
 *  close or medium); wides stay sharp. Also still usable for ONE edge object that overlaps the frame edge (a pillar, a branch,
 *  a shoulder), in roughly one close-up in three (bible 8.1). Draws its children 12 times with small offsets.
 *  radius = blur radius in world units at the object (aim for 4-8 px on a 720p frame). Kit shapes only. */
export const NearBlur: React.FC<{radius: number; children: React.ReactNode}> = ({radius, children}) => {
  const offs: Pt[] = [[0, 0], ...Array.from({length: 5}, (_, i) => [Math.cos(i * 1.257) * 0.5, Math.sin(i * 1.257) * 0.5] as Pt), ...Array.from({length: 6}, (_, i) => [Math.cos(i * 1.047 + 0.4), Math.sin(i * 1.047 + 0.4)] as Pt)];
  return <MatFx.Provider value={{opacity: 0.3, soft: true}}>{offs.map(([x, y], i) => <group key={i} position={[x * radius, y * radius, i * 0.0005]}>{children}</group>)}</MatFx.Provider>;
};
