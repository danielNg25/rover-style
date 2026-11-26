import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';
import {rnd} from './depth';
import {Halo} from './look';
import {DriftSpecks} from './kitLab';

/** lib3/fx: THE BIG EFFECTS. An effect is the accent of ONE shot, not the background of every shot (skill 0): a flash of two
 *  frames, a shake that has stopped by the cut, a door of light, an explosion with things flying out of it. Everything here
 *  takes the frame `f`, runs on ones (effects are redrawn every frame; figures stay on twos) and is the same on every render.
 *  The flat pieces face +z: inside a turned room give them rotY = -yaw, except the ones that lie IN a thing's plane (Portal). */
type V3 = [number, number, number];
const TEX = new Map<string, THREE.CanvasTexture>();
const tex = (key: string, size: number, paint: (c: CanvasRenderingContext2D, S: number) => void) => {
  let t = TEX.get(key);
  if (!t) { const cv = document.createElement('canvas'); cv.width = cv.height = size; paint(cv.getContext('2d')!, size); t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; TEX.set(key, t); }
  return t;
};
const soft = () => tex('fx-soft', 128, (c, S) => { const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, S, S); });
const mix = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), Math.min(1, Math.max(0, t))).getHexString();
const clamp = (x: number) => Math.min(1, Math.max(0, x));

// ---------------------------------------------------------------- over the whole frame (DOM layers: put them round or over the canvas)
/** A white-out: full at frame `at`, gone `len` frames later. Lay it OVER the picture. */
export const Flash: React.FC<{f: number; at: number; len?: number; color?: string}> = ({f, at, len = 3, color = '#ffffff'}) => {
  const k = f < at ? 0 : clamp(1 - (f - at) / len);
  return k > 0 ? <AbsoluteFill style={{background: color, opacity: k * k * (3 - 2 * k), pointerEvents: 'none'}} /> : null;
};
/** Camera shake: wrap the picture in it. Starts at `at`, dies away over `len` frames and is EXACTLY still afterwards (a shake
 *  never runs into the cut). amp = the largest jump in pixels at 1280 wide. */
export const Shake: React.FC<{f: number; at: number; len?: number; amp?: number; children: React.ReactNode}> = ({f, at, len = 6, amp = 14, children}) => {
  const d = f - at, on = d >= 0 && d < len, k = on ? 1 - d / len : 0, r = rnd(d * 7 + 3), x = (r() - 0.5) * 2 * amp * k, y = (r() - 0.5) * 2 * amp * k, a = (r() - 0.5) * 0.6 * k;
  return <AbsoluteFill style={on ? {transform: `translate(${x}px, ${y}px) rotate(${a}deg) scale(${1 + 0.03 * k + (2 * amp) / 1280})`} : undefined}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------- a door of light
/** THE OTHER SIDE, as a picture to show inside a Portal: a pale land under a deep violet sky, rows of columns going away into
 *  a white glow on the horizon, mist on the ground, small lights in the air. Looked at on the reference (the lab portal, shots
 *  90-92): a door of light is a WINDOW onto another place with its own depth, not an abstract whirl. */
export const beyondTex = () => tex('fx-beyond', 768, (c, S) => {
  const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#23265c'); g.addColorStop(0.36, '#5458ae'); g.addColorStop(0.58, '#c8d2ff'); g.addColorStop(0.65, '#f2f5ff'); g.addColorStop(0.71, '#b4bdee'); g.addColorStop(1, '#4b5299'); c.fillStyle = g; c.fillRect(0, 0, S, S);
  const h = c.createRadialGradient(S / 2, S * 0.63, 0, S / 2, S * 0.63, S * 0.46); h.addColorStop(0, 'rgba(255,255,255,0.95)'); h.addColorStop(0.35, 'rgba(232,238,255,0.5)'); h.addColorStop(1, 'rgba(232,238,255,0)'); c.fillStyle = h; c.fillRect(0, 0, S, S);
  const r = rnd(41);
  for (let i = 0; i < 46; i++) { const x = r() * S, y = r() * S * 0.5, q = 1 + r() * 2.4; c.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.5})`; c.beginPath(); c.arc(x, y, q, 0, 7); c.fill(); }
  // three rows of columns with a lintel, the far ones small, pale and close to the middle
  ([[0.34, '#dfe5ff', '#cdd5fa'], [0.6, '#aab3e6', '#929cd6'], [1, '#7880c4', '#5f67ae']] as [number, string, string][]).forEach(([k, lite, dark]) => {
    const base = S * (0.655 + 0.085 * k), ht = S * 0.5 * k, w = S * 0.062 * k;
    [-1, 1].forEach((sd) => { for (let n = 0; n < 2; n++) { const x = S / 2 + sd * S * (0.12 + 0.3 * k + n * 0.2 * k);
      c.fillStyle = lite; c.fillRect(x - w / 2, base - ht, w, ht); c.fillStyle = dark; c.fillRect(x + (sd > 0 ? -w / 2 : w * 0.12), base - ht, w * 0.38, ht);
      c.fillStyle = lite; c.fillRect(x - w * 0.72, base - ht - w * 0.3, w * 1.44, w * 0.3); c.fillRect(x - w * 0.66, base - w * 0.22, w * 1.32, w * 0.22); }
      c.fillStyle = dark; c.fillRect(S / 2 + (sd > 0 ? S * (0.12 + 0.3 * k) - w : -S * (0.12 + 0.5 * k) - w), base - ht - w * 0.62, S * 0.2 * k + w * 2, w * 0.34); });
  });
  for (let i = 0; i < 9; i++) { const y = S * (0.66 + r() * 0.3), x = r() * S, rx = S * (0.18 + r() * 0.26), m = c.createRadialGradient(x, y, 0, x, y, rx); m.addColorStop(0, 'rgba(255,255,255,0.42)'); m.addColorStop(1, 'rgba(255,255,255,0)'); c.save(); c.translate(0, y); c.scale(1, 0.22); c.translate(0, -y); c.fillStyle = m; c.fillRect(x - rx, y - rx, rx * 2, rx * 2); c.restore(); }
  const v = c.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.52); v.addColorStop(0, 'rgba(10,12,40,0)'); v.addColorStop(1, 'rgba(10,12,40,0.6)'); c.fillStyle = v; c.fillRect(0, 0, S, S);
});
const BANDS = [[0.93, 1.05, 2.3, 0.16, 0, 0.9, 0], [0.97, 1.08, 1.2, -0.23, 1.7, 0.85, 1], [0.9, 0.98, 1.6, 0.29, 3.6, 0.8, 0], [1.0, 1.11, 0.8, -0.12, 4.6, 0.8, 1], [0.93, 1.0, 1.9, 0.2, 3.1, 0.7, 0], [0.85, 0.9, 2.9, 0.09, 0.6, 0.55, 2],
  [0.775, 0.795, 1.1, 0.35, 2.2, 0.7, 1], [0.655, 0.672, 1.5, -0.27, 5.1, 0.6, 0], [0.56, 0.572, 0.9, 0.42, 1.1, 0.5, 1]];
/** A DOOR OF LIGHT filling a ring. open = 0..1: it grows from a bright dot. `inside` = the picture of the other side (beyondTex,
 *  or any texture); without one the opening is a whirl of light. children = what stands inside (a Puppet3 with a low `order`,
 *  no shadow), drawn between the picture and the rim. The rim is a set of bright bands turning at different speeds, thin arcs
 *  further in, a dark band under them; rays flicker outside. heat = 0 cold .. 1: the picture goes red, flames climb inside,
 *  the rim turns orange. Lies in the ring's plane: put it at the ring's centre, inside the ring's own group. */
export const Portal: React.FC<{pos: V3; r: number; f: number; open?: number; heat?: number; color?: string; inside?: THREE.Texture; children?: React.ReactNode}> = ({pos, r, f, open = 1, heat = 0, color = '#8fe9ff', inside, children}) => {
  const arms = tex('fx-arms', 512, (c, S) => {
    c.translate(S / 2, S / 2);
    for (let a = 0; a < 5; a++) { c.rotate((Math.PI * 2) / 5); c.beginPath(); for (let i = 0; i <= 60; i++) { const t = i / 60, ang = t * 2.6, rad = 20 + t * (S / 2 - 26), w = 5 + 26 * t * (1 - t) * 2; const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad; c.lineTo(x - Math.sin(ang) * w * 0.5, y + Math.cos(ang) * w * 0.5); }
      for (let i = 60; i >= 0; i--) { const t = i / 60, ang = t * 2.6, rad = 20 + t * (S / 2 - 26), w = 5 + 26 * t * (1 - t) * 2; const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad; c.lineTo(x + Math.sin(ang) * w * 0.5, y - Math.cos(ang) * w * 0.5); }
      c.closePath(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill(); }
  });
  const col = mix(color, '#ff6a2a', heat), R = r * open, flick = 0.86 + 0.14 * Math.sin(f * 1.9) * Math.sin(f * 0.7 + 1);
  const rays = useMemo(() => Array.from({length: 14}, (_, i) => { const q = rnd(i * 13 + 5); return {a: (i / 14) * Math.PI * 2 + q() * 0.3, l: 0.2 + q() * 0.4, w: 0.03 + q() * 0.04, p: q() * 6}; }), []);
  const bandGeo = useMemo(() => BANDS.map(([ri, ro, len]) => new THREE.RingGeometry(ri, ro, 40, 1, 0, len)), []);
  const tri = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, 1, 0], 3)); return g; }, []);
  if (open <= 0.01) return null;
  const tones = [col, mix(col, '#ffffff', 0.75), mix(col, '#04202c', 0.55)];
  return (
    <group position={pos}>
      <mesh renderOrder={4}><circleGeometry args={[R, 56]} /><meshBasicMaterial color={mix(col, '#101a2a', 0.55)} depthWrite={false} fog={false} /></mesh>
      {inside ? <mesh renderOrder={5} position={[0, 0, 0.004]}><circleGeometry args={[R * 0.985, 56]} /><meshBasicMaterial map={inside} color={mix('#ffffff', '#ff6f48', heat * 0.85)} transparent opacity={clamp(open * 1.6 - 0.5)} depthWrite={false} fog={false} toneMapped={false} /></mesh>
        : <><mesh renderOrder={5} scale={[R * 2.25, R * 2.25, 1]}><planeGeometry /><meshBasicMaterial map={soft()} color={col} transparent opacity={0.9 * flick} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh>
          <mesh renderOrder={6} rotation={[0, 0, -f * 0.21]} scale={[R * 1.96, R * 1.96, 1]}><planeGeometry /><meshBasicMaterial map={arms} color={mix(col, '#ffffff', 0.35)} transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh>
          <mesh renderOrder={7} scale={[R * 0.66, R * 0.66, 1]}><planeGeometry /><meshBasicMaterial map={soft()} color="#ffffff" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh></>}
      <group position={[0, 0, 0.01]} scale={[open, open, 1]}>{children}</group>
      {/* flames climbing from the lower rim when it turns: three tones, a new shape every two frames. Each tongue is a triangle
          standing ON the inside of the rim, so nothing of it hangs out below the ring */}
      {inside && heat > 0.02 ? Array.from({length: 11}, (_, i) => { const q = rnd(i * 7 + Math.floor(f / 2) * 31), x = (-0.74 + (i / 10) * 1.48) * R, floor = -Math.sqrt(Math.max(0, R * R - x * x)) * 0.97, hgt = R * (0.5 + 0.9 * q()) * heat, w = R * (0.24 + q() * 0.16), lean = (q() - 0.5) * 0.3;
        return <group key={`fl${i}`} position={[x, floor, 0.012]} rotation={[0, 0, lean]}>
          {([['#c8321e', 1, 1], ['#f2742a', 0.72, 0.74], ['#ffd166', 0.44, 0.5]] as [string, number, number][]).map(([cl, kh, kw], n) => <mesh key={n} geometry={tri} renderOrder={6} position={[0, 0, n * 0.001]} scale={[w * kw, hgt * kh, 1]}><meshBasicMaterial color={cl} depthWrite={false} fog={false} toneMapped={false} side={THREE.DoubleSide} /></mesh>)}
        </group>; }) : null}
      <mesh renderOrder={7} position={[0, 0, 0.016]}><ringGeometry args={[R * 0.8, R * 0.95, 56]} /><meshBasicMaterial color={mix('#041c26', '#2a0a04', heat)} transparent opacity={0.5} depthWrite={false} fog={false} /></mesh>
      {BANDS.map(([, , , sp, ph, op, tone], i) => <mesh key={`b${i}`} geometry={bandGeo[i]} renderOrder={8} position={[0, 0, 0.02 + i * 0.001]} rotation={[0, 0, ph + f * sp]} scale={[R, R, 1]}>
        <meshBasicMaterial color={tones[tone]} transparent opacity={op * (0.82 + 0.18 * Math.sin(f * 1.3 + i * 2.1))} depthWrite={false} blending={tone === 2 ? THREE.NormalBlending : THREE.AdditiveBlending} side={THREE.DoubleSide} fog={false} toneMapped={false} /></mesh>)}
      {open < 0.35 ? <mesh renderOrder={9} position={[0, 0, 0.03]} scale={[r * (0.5 - open), r * (0.5 - open), 1]}><planeGeometry /><meshBasicMaterial map={soft()} color="#ffffff" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh> : null}
      {rays.map((q, i) => { const len = R * q.l * (0.55 + 0.45 * Math.sin(f * 1.3 + q.p)) * (1 + heat); return (
        <mesh key={i} renderOrder={5} rotation={[0, 0, q.a + f * 0.02]} position={[Math.cos(q.a + f * 0.02) * (R * 1.08 + len / 2), Math.sin(q.a + f * 0.02) * (R * 1.08 + len / 2), 0.01]}>
          <planeGeometry args={[len, R * q.w]} /><meshBasicMaterial map={soft()} color={col} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh>); })}
    </group>
  );
};
/** Lightning crawling round a ring: `n` bolts hugging its outer edge. A bolt keeps its place for three frames while its kinks
 *  change on every frame, then jumps elsewhere; white core, a wider faint glow, a side fork on some. Lies in the ring's plane. */
export const RingLightning: React.FC<{pos: V3; r: number; f: number; n?: number; on?: number; color?: string; width?: number; seed?: number}> = ({pos, r, f, n = 3, on = 0.8, color = '#bff4ff', width = 0.012, seed = 1}) => {
  const out: React.ReactNode[] = [];
  for (let b = 0; b < n; b++) {
    const ep = Math.floor((f + b * 2) / 3), q = rnd(seed * 97 + b * 13 + ep * 7), a0 = q() * Math.PI * 2, span = (0.45 + q() * 0.75) * (q() < 0.5 ? 1 : -1), fork = q() < 0.55; if (q() > on) continue;
    const j = rnd(f * 17 + b * 5 + seed), m = 8, pts = Array.from({length: m + 1}, (_, i) => { const a = a0 + (span * i) / m, rad = r * (1.07 + (j() - 0.5) * 0.16); return [Math.cos(a) * rad, Math.sin(a) * rad] as [number, number]; });
    if (fork) { const k = 2 + Math.floor(j() * 4), [x, y] = pts[k], d = 1.2 + j() * 0.25; pts.push([NaN, NaN], [x, y], [x * d + (j() - 0.5) * r * 0.12, y * d + (j() - 0.5) * r * 0.12], [x * d * 1.12, y * d * 1.12 + (j() - 0.5) * r * 0.15]); }
    pts.slice(1).forEach((p, i) => { const o = pts[i]; if (Number.isNaN(p[0]) || Number.isNaN(o[0])) return; const l = Math.hypot(p[0] - o[0], p[1] - o[1]), rot = Math.atan2(p[1] - o[1], p[0] - o[0]), at: V3 = [(p[0] + o[0]) / 2, (p[1] + o[1]) / 2, 0.03];
      out.push(<mesh key={`${b}-${i}g`} renderOrder={8} position={at} rotation={[0, 0, rot]}><planeGeometry args={[l + width * 3, width * 5]} /><meshBasicMaterial map={soft()} color={color} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh>,
        <mesh key={`${b}-${i}`} renderOrder={9} position={at} rotation={[0, 0, rot]}><planeGeometry args={[l + width, width]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.96} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh>); });
  }
  return <group position={pos}>{out}</group>;
};
/** A bulb or terminal switched on, as the reference lights them: a flat many-sided disc of colour round it (a faceted edge, no
 *  soft gradient), a pale core, the size beating a little on every frame. Faces +z (rotY = -yaw in a turned room). */
export const BulbHalo: React.FC<{pos: V3; r: number; f: number; color?: string; core?: string; rotY?: number; seed?: number}> = ({pos, r, f, color = '#5fe9ff', core = '#f4fbd8', rotY = 0, seed = 1}) => {
  const k = 1 + 0.07 * Math.sin(f * 2.1 + seed * 3) * Math.sin(f * 0.9 + seed);
  return <group position={pos} rotation={[0, rotY, 0]}>
    <mesh renderOrder={6} scale={[r * 1.5 * k, r * 1.5 * k, 1]}><planeGeometry /><meshBasicMaterial map={soft()} color={color} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh>
    <mesh renderOrder={7} rotation={[0, 0, seed * 0.4 + Math.floor(f / 2) * 0.35]}><circleGeometry args={[r * k, 9]} /><meshBasicMaterial color={color} transparent opacity={0.88} depthWrite={false} fog={false} toneMapped={false} /></mesh>
    <mesh renderOrder={8} position={[0, 0, 0.002]}><circleGeometry args={[r * 0.46, 14]} /><meshBasicMaterial color={core} depthWrite={false} fog={false} toneMapped={false} /></mesh>
  </group>;
};

/** An electric arc between two points: a jagged line that jumps to a new shape on every frame and is dark on some frames.
 *  on = 0..1 how often it fires. Drawn in the plane facing +z (rotY to face the lens in a turned room). */
export const Arc: React.FC<{a: V3; b: V3; f: number; on?: number; color?: string; width?: number; seed?: number; rotY?: number}> = ({a, b, f, on = 0.7, color = '#bff4ff', width = 0.012, seed = 1, rotY = 0}) => {
  const r = rnd(f * 17 + seed * 101); if (r() > on) return null;
  const n = 7, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, px = -dy / L, py = dx / L;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;   // drawn round its own middle, so that rotY turns it in place
  const pts = Array.from({length: n + 1}, (_, i) => { const t = i / n, j = i === 0 || i === n ? 0 : (r() - 0.5) * L * 0.34; return [a[0] + dx * t + px * j - mx, a[1] + dy * t + py * j - my] as [number, number]; });
  return (
    <group position={[mx, my, (a[2] + b[2]) / 2]} rotation={[0, rotY, 0]}>
      {pts.slice(1).map((p, i) => { const q = pts[i], l = Math.hypot(p[0] - q[0], p[1] - q[1]); return (
        <mesh key={i} renderOrder={8} position={[(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, 0]} rotation={[0, 0, Math.atan2(p[1] - q[1], p[0] - q[0])]}>
          <planeGeometry args={[l + width, width * (1 + r())]} /><meshBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh>); })}
      <Halo pos={[0, 0, 0]} r={L * 0.9} color={color} strength={0.5} order={7} />
    </group>
  );
};

/** Sheets of paper pulled through the air to one point: each leaves its place, speeds up, turns over and over, and shrinks as
 *  it goes in; new ones keep leaving. from = [x0, x1, y0, y1, z0, z1] where they start; to = where they go; every = frames between sheets. */
export const FlyingPapers: React.FC<{f: number; from: [number, number, number, number, number, number]; to: V3; start?: number; every?: number; life?: number; size?: number; seed?: number; color?: string}> =
  ({f, from, to, start = 0, every = 3, life = 20, size = 0.22, seed = 1, color = '#ece3c8'}) => {
    const out: React.ReactNode[] = [];
    for (let i = 0; i < 40; i++) {
      const born = start + i * every, d = f - born; if (d < 0 || d > life) continue;
      const r = rnd(i * 31 + seed * 7), p0: V3 = [from[0] + r() * (from[1] - from[0]), from[2] + r() * (from[3] - from[2]), from[4] + r() * (from[5] - from[4])];
      const t = d / life, e = t * t, arc = Math.sin(t * Math.PI) * (0.3 + r() * 0.5), sp = 0.5 + r();
      const pos: V3 = [p0[0] + (to[0] - p0[0]) * e, p0[1] + (to[1] - p0[1]) * e + arc, p0[2] + (to[2] - p0[2]) * e], k = size * (1 - 0.75 * e) * (0.7 + r() * 0.6);
      out.push(<mesh key={i} renderOrder={9} position={pos} rotation={[d * 0.5 * sp, d * 0.37 * sp + i, d * 0.61 * sp]}><planeGeometry args={[k, k * 1.35]} /><meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.95 * (1 - e * e)} depthWrite={false} fog={false} /></mesh>);
    }
    return <>{out}</>;
  };

// ---------------------------------------------------------------- an explosion out of an opening
/** Something blows OUT of an opening (a window, a door) towards the lens: a ball of light that swells in three frames and
 *  dies down, glass and splinters thrown out on falling arcs, burning scraps that flutter down slowly, sparks, and smoke that
 *  keeps pouring upward and grows. pos = the middle of the opening; s = its size in metres; at = the frame it goes off.
 *  cool / hot = the colour of the first burst and what it turns into. The pieces fly in world space (gravity down). */
export const Explosion: React.FC<{pos: V3; f: number; at: number; s?: number; cool?: string; hot?: string; shards?: number; smoke?: boolean; seed?: number;
  /** star = size in metres of the flat starburst (a cream many-pointed star over an orange one with longer points, there for about
   *  nine frames); clouds = how many flat scalloped clouds are thrown outward and shrink to nothing (orange, cream, two greys) */
  star?: number; clouds?: number}> =
  ({pos, f, at, s = 1.2, cool = '#9fefff', hot = '#ff8a3a', shards = 34, smoke = true, seed = 1, star = 0, clouds = 0}) => {
    const d = f - at;
    const t = d / 24, burst = d < 3 ? (d + 1) / 3 : Math.max(0, 1 - (d - 3) / 26), col = mix(cool, hot, d / 10);
    const bits = useMemo(() => Array.from({length: shards}, (_, i) => { const r = rnd(i * 19 + seed * 3), ang = r() * Math.PI * 2, sp = 2.5 + r() * 6.5, kind = r() < 0.55 ? 0 : r() < 0.6 ? 1 : 2;
      return {v: [Math.cos(ang) * sp * 0.9, Math.abs(Math.sin(ang)) * sp * 0.8 + 1.2, 1.5 + r() * 4.5] as V3, o: [(r() - 0.5) * s * 0.7, (r() - 0.5) * s * 0.7, 0] as V3, w: 0.06 + r() * 0.16, spin: (r() - 0.5) * 1.4, kind, tw: r() * 6}; }), [shards, seed]);
    const puffs = useMemo(() => Array.from({length: 9}, (_, i) => { const r = rnd(i * 23 + seed * 11); return {born: i * 3.2, x: (r() - 0.5) * s * 0.8, vx: (r() - 0.3) * 0.5, vy: 0.9 + r() * 0.7, g: 0.9 + r() * 0.8, tone: 0.3 + r() * 0.3}; }), [seed]);
    const starGeo = useMemo(() => [[11, 0.62, 1.0], [11, 0.5, 1.35]].map(([n, ri, ro], k) => { const sh = new THREE.Shape(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 + k * 0.28, q = i % 2 ? ri : ro * (0.86 + 0.28 * ((i * 7 + k * 3) % 5) / 4); if (i) sh.lineTo(Math.cos(a) * q, Math.sin(a) * q); else sh.moveTo(Math.cos(a) * q, Math.sin(a) * q); } return new THREE.ShapeGeometry(sh); }), []);
    const flat = useMemo(() => Array.from({length: clouds}, (_, i) => { const r = rnd(i * 41 + seed * 17), kind = [0, 1, 2, 3, 2, 3, 0, 2][i % 8];
      return {a: r() * Math.PI * 2, r0: s * (0.2 + r() * 0.5), v: 1.4 + r() * 2.6, born: 2 + Math.floor(r() * 9), life: 14 + Math.floor(r() * 16), k: s * (0.5 + r() * 0.75), kind, lobes: Array.from({length: 5}, () => [(r() - 0.5) * 0.9, (r() - 0.5) * 0.5, 0.3 + r() * 0.26] as V3)}; }), [clouds, seed, s]);
    const TONE = [['#ef8a3a', '#f8b56a'], ['#f3e4c4', '#fff6e0'], ['#8d8992', '#aaa6b0'], ['#4c465a', '#655f74']];
    const sk = d < 0 ? 0 : d < 3 ? 0.35 + 0.65 * (d / 2) : d < 6 ? 1 + 0.05 * Math.sin(d * 3) : Math.max(0, 1 - (d - 5) / 4);
    if (d < 0) return null;
    return (
      <group position={pos}>
        {star > 0 && sk > 0.01 ? <group position={[0, 0, 0.36]} rotation={[0, 0, d * 0.05]} scale={[star * sk, star * sk, 1]}>
          <mesh geometry={starGeo[1]} renderOrder={9}><meshBasicMaterial color={mix('#ffb04a', hot, 0.4)} depthWrite={false} fog={false} toneMapped={false} /></mesh>
          <mesh geometry={starGeo[0]} renderOrder={9} position={[0, 0, 0.004]} scale={[0.78, 0.78, 1]}><meshBasicMaterial color="#fff3d6" depthWrite={false} fog={false} toneMapped={false} /></mesh>
        </group> : null}
        {flat.map((p, i) => { const a = d - p.born; if (a < 0 || a > p.life) return null; const t = a / 24, grow = Math.min(1, a / 3), k = p.k * grow * (1 - (a / p.life) ** 2), R0 = p.r0 + p.v * t * (1 - 0.35 * a / p.life);
          return <group key={`c${i}`} position={[Math.cos(p.a) * R0, Math.sin(p.a) * R0 * 0.8 + t * 0.5, 0.3 + i * 0.004]} scale={[k, k, 1]}>
            {p.lobes.map(([x, y, q], n) => <mesh key={n} renderOrder={8} position={[x, y, n * 0.0005]}><circleGeometry args={[q, 14]} /><meshBasicMaterial color={TONE[p.kind][0]} depthWrite={false} fog={false} toneMapped={false} /></mesh>)}
            {p.lobes.slice(0, 3).map(([x, y, q], n) => <mesh key={`h${n}`} renderOrder={8} position={[x - q * 0.2, y + q * 0.22, 0.003 + n * 0.0005]}><circleGeometry args={[q * 0.62, 12]} /><meshBasicMaterial color={TONE[p.kind][1]} depthWrite={false} fog={false} toneMapped={false} /></mesh>)}
          </group>; })}
        {burst > 0 && <><Halo pos={[0, 0, 0.3]} r={s * (1.2 + 2.6 * burst)} color={col} strength={0.95 * burst} order={8} /><Halo pos={[0, 0, 0.32]} r={s * (0.5 + 1.1 * burst)} color="#ffffff" strength={0.9 * burst} order={9} /></>}
        {bits.map((b, i) => { const g = b.kind === 2 ? 2.6 : 9.8, drag = b.kind === 2 ? 0.45 : 1, x = b.o[0] + b.v[0] * t * drag, y = b.o[1] + b.v[1] * t * drag - 0.5 * g * t * t + (b.kind === 2 ? Math.sin(d * 0.5 + b.tw) * 0.08 : 0), z = b.o[2] + b.v[2] * t * drag;
          if (y < -pos[1] - 0.2 || d > 60) return null;
          const c = b.kind === 0 ? '#dff6ff' : b.kind === 1 ? '#6b4a32' : mix('#ffb04a', '#5a2a1a', d / 40);
          return <mesh key={i} renderOrder={9} position={[x, y, z]} rotation={[d * b.spin, d * b.spin * 0.7, d * b.spin * 1.3 + b.tw]}>{b.kind === 0 ? <circleGeometry args={[b.w * 0.6, 3]} /> : <planeGeometry args={[b.w * (b.kind === 1 ? 2.4 : 1), b.w * (b.kind === 1 ? 0.35 : 1.3)]} />}<meshBasicMaterial color={c} side={THREE.DoubleSide} transparent opacity={b.kind === 0 ? 0.9 : 1} depthWrite={false} fog={false} /></mesh>; })}
        {smoke && puffs.map((p, i) => { const a = d - p.born; if (a < 0) return null; const ts = a / 24, k = s * p.g * (0.45 + ts * 0.95), fade = clamp(1.15 - ts / 3.2);
          return <mesh key={`s${i}`} renderOrder={7} position={[p.x + p.vx * ts, s * 0.2 + p.vy * ts, 0.15 + i * 0.01]} scale={[k, k, 1]}><planeGeometry /><meshBasicMaterial map={soft()} color={mix('#d9d2c8', '#4a4648', p.tone + ts * 0.12)} transparent opacity={0.85 * fade} depthWrite={false} fog={false} /></mesh>; })}
      </group>
    );
  };

// ---------------------------------------------------------------- the air after it
/** Smoke hanging in a room or over a yard: big soft shapes that drift slowly sideways and turn, thin enough to see through.
 *  box = [x0, x1, y0, y1, z0, z1]; rotY = -yaw in a turned room. */
export const SmokeDrift: React.FC<{f: number; box: [number, number, number, number, number, number]; n?: number; color?: string; opacity?: number; size?: number; wind?: number; seed?: number; rotY?: number; order?: number}> =
  ({f, box, n = 7, color = '#cfc8c2', opacity = 0.28, size = 1.6, wind = 0.25, seed = 1, rotY = 0, order = 6}) => {
    const W = box[1] - box[0];
    return <>{Array.from({length: n}, (_, i) => { const r = rnd(i * 29 + seed * 5), x0 = r() * W, y = box[2] + r() * (box[3] - box[2]), z = box[4] + r() * (box[5] - box[4]), k = size * (0.7 + r() * 0.8), sp = wind * (0.6 + r() * 0.8), ph = r() * 6;
      const x = box[0] + ((x0 + (f / 24) * sp) % W + W) % W, edge = Math.min(1, Math.min(x - box[0], box[1] - x) / (W * 0.18));
      return <mesh key={i} renderOrder={order} position={[x, y + Math.sin(f * 0.03 + ph) * 0.08, z]} rotation={[0, rotY, f * 0.004 * (i % 2 ? 1 : -1) + ph]} scale={[k * 1.7, k, 1]}><planeGeometry /><meshBasicMaterial map={soft()} color={color} transparent opacity={opacity * edge} depthWrite={false} fog={false} /></mesh>; })}</>;
  };
/** Embers: sparks that rise from a place, waver, and go out; a new one every few frames. box = [x0, x1, y0, y1, z0, z1] (they are born in the lower part). */
export const Embers: React.FC<{f: number; box: [number, number, number, number, number, number]; n?: number; color?: string; size?: number; life?: number; seed?: number; rotY?: number}> =
  ({f, box, n = 16, color = '#ffb24a', size = 0.035, life = 46, seed = 1, rotY = 0}) => (
    <>{Array.from({length: n}, (_, i) => { const r = rnd(i * 37 + seed * 13), ph = Math.floor(r() * life), a = ((f + ph) % life + life) % life, t = a / life, x = box[0] + r() * (box[1] - box[0]), z = box[4] + r() * (box[5] - box[4]), rise = (box[3] - box[2]) * (0.5 + r() * 0.5);
      const k = size * (0.6 + r() * 0.9) * (1 - t * 0.6);
      return <mesh key={i} renderOrder={9} position={[x + Math.sin(a * 0.21 + i) * 0.12, box[2] + rise * t, z]} rotation={[0, rotY, 0]} scale={[k * 4, k * 4, 1]}><planeGeometry /><meshBasicMaterial map={soft()} color={color} transparent opacity={0.95 * (1 - t) * (1 - t)} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh>; })}</>
  );

// ---------- hot iron (first used in the forge opening of the Doom episode, 22/11/2026) ----------
const softDotTex = (() => { let t: THREE.CanvasTexture | null = null; return () => {
  if (!t) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!, g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; }
  return t; }; })();
/** Steam off hot iron dipped against a face: soft puffs born along the mask's edges from `start`, rising, swelling and thinning.
 *  from = points the puffs are born at (world); k = strength 0..1 (thins the smoke as the iron cools). */
export const Steam: React.FC<{f: number; start: number; from: V3[]; k?: number; life?: number; size?: number; seed?: number}> = ({f, start, from, k = 1, life = 30, size = 0.09, seed = 1}) => {
  if (f < start || k <= 0) return null;
  const n = from.length * 4;
  return <>{Array.from({length: n}, (_, i) => {
    const r = rnd(i * 17 + seed), born = start + Math.floor(r() * life), age = ((f - born) % life + life) % life;
    if (f < born) return null;
    const t = age / life, o = from[i % from.length], drift = (r() - 0.5) * 0.25, s = size * (0.6 + r() * 0.6) * (0.5 + 1.6 * t);
    const a = (t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85) * 0.42 * k;
    return <mesh key={i} position={[o[0] + drift * t + Math.sin(f * 0.13 + i) * 0.02, o[1] + 0.45 * t, o[2] + 0.03]} renderOrder={520} scale={[s * 2.2, s * 2.2, 1]}><planeGeometry /><meshBasicMaterial map={softDotTex()} color="#e6e2dc" transparent opacity={a} depthWrite={false} fog={false} /></mesh>;
  })}</>;
};
/** A burst of sparks from a point at frame `at`: thrown out to both sides, falling, dimming over about 16 frames. */
export const SparkBurst: React.FC<{f: number; at: number; pos: V3; n?: number; speed?: number; seed?: number}> = ({f, at, pos, n = 22, speed = 1.3, seed = 3}) => {
  const d = f - at;
  if (d < 0 || d > 22) return null;
  return <>{Array.from({length: n}, (_, i) => {
    const r = rnd(i * 31 + seed), side = i % 2 ? 1 : -1, life = 10 + r() * 12;
    if (d > life) return null;
    const t = d / 24, vx = side * speed * (0.3 + r() * 0.9), vy = speed * (r() * 1.4 - 0.3), x = pos[0] + side * 0.2 + vx * t, y = pos[1] + (r() - 0.5) * 0.36 + vy * t - 2.4 * t * t, a = 1 - d / life, s = 0.005 + r() * 0.006;
    return <mesh key={i} position={[x, y, pos[2] + 0.06]} renderOrder={530} scale={[s * 4, s * 4, 1]}><planeGeometry /><meshBasicMaterial map={softDotTex()} color={r() < 0.5 ? '#ffd27a' : '#ff9a3a'} transparent opacity={a} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} /></mesh>;
  })}</>;
};
/** The "glow" Daniel asks for round hot iron: small points of light drifting up and round it (embers, coal dust, flakes of
 *  scale), on top of the mask's own sparks. k = heat (they thin out as it cools); box round the hot thing. */
export const HotSpecks: React.FC<{f: number; box: [number, number, number, number, number, number]; k: number; seed?: number}> = ({f, box, k, seed = 5}) => k < 0.1 ? null : (
  <>
    <Embers f={f} box={box} n={Math.round(14 * k)} size={0.011} life={36} seed={seed} color="#ffcf70" />
    <Embers f={f + 17} box={[box[0] - 0.1, box[1] + 0.1, box[2], box[3] + 0.2, box[4], box[5]]} n={Math.round(8 * k)} size={0.007} life={52} seed={seed + 4} color="#ff8a3a" />
    <DriftSpecks f={f} box={box} n={Math.round(16 * k)} color="#ffb060" size={0.0045} wind={[0.03, 0.09]} glow={0.45 * k} seed={seed + 9} />
  </>
);
/** What flies off the rim when it is struck: sparks and hot flakes of scale thrown both ways ALONG the edge and up, falling
 *  back under their weight, white-hot first, then orange; the struck spot of the rim flares white for 3 frames.
 *  (Shot-local for now; meant for src/lib3/fx.tsx: report, lượt ba.) */
export const RimSparks: React.FC<{f: number; at: number; pos: V3; along?: number; seed?: number}> = ({f, at, pos, along = 0, seed = 1}) => {
  const d = f - at;
  if (d < 0 || d > 24) return null;
  const ca = Math.cos(along), sa = Math.sin(along);
  return <>
    {d < 3 ? <>
      <Halo pos={[pos[0], pos[1], pos[2] + 0.04]} r={0.16} color="#fff6dc" strength={0.95 * (1 - d / 3)} order={14} />
      <mesh position={[pos[0], pos[1] - 0.004, pos[2] + 0.03]} rotation={[0, 0, along]} renderOrder={15}><planeGeometry args={[0.24, 0.016]} /><meshBasicMaterial color="#fffbe8" transparent opacity={1 - d / 3} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
    </> : null}
    {Array.from({length: 34}, (_, i) => {
      const r = rnd(i * 41 + seed * 7), flake = i % 5 === 0, side = i % 2 ? 1 : -1, life = flake ? 12 + r() * 10 : 7 + r() * 11;
      if (d > life) return null;
      const t = d / 24, sp = flake ? 0.3 + r() * 0.35 : 0.45 + r() * 0.8, vAlong = side * sp, vUp = (flake ? 0.25 : 0.2) + r() * (flake ? 0.4 : 0.75);
      const u = (r() - 0.5) * 0.06 + vAlong * t, v = vUp * t - 2.8 * t * t, x = pos[0] + u * ca - v * sa, y = pos[1] + 0.01 + u * sa + v * ca, k = 1 - d / life;
      const s = flake ? 0.006 + r() * 0.005 : 0.003 + r() * 0.003, col = flake ? (k > 0.6 ? '#ffb24a' : '#d2481c') : k > 0.55 ? '#ffe9a0' : '#ff8a2a';
      // a spark is drawn stretched along its flight (a short streak), a flake as a small square
      const vx = vAlong * ca - (vUp - 5.6 * t) * sa, vy = vAlong * sa + (vUp - 5.6 * t) * ca, ang = Math.atan2(vy, vx), len = flake ? 1 : 1 + Math.min(4, Math.hypot(vx, vy) * 1.6);
      return <mesh key={i} position={[x, y, pos[2] + 0.05]} rotation={[0, 0, flake ? i + d * 0.6 : ang]} renderOrder={16} scale={[s * 2 * len, s * (flake ? 2 : 1.3), 1]}><planeGeometry /><meshBasicMaterial color={col} transparent opacity={Math.min(1, k * 1.4)} blending={flake ? THREE.NormalBlending : THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>;
    })}
  </>;
};
