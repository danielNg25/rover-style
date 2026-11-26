import React from 'react';
import * as THREE from 'three';
import {Poly} from '../three/prims';
import {useTextures} from '../three/ImageRig';

/** Helpers shared by agent b's shots. */
export type V3 = [number, number, number];
export const rand = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

/** Maps reference-frame pixels (1280x720) to world space for a camera looking straight down -z.
 *  cam = [x, y, z] of the camera on frame 0, fov in degrees. A point drawn at pixel (px, py) on a card at depth z
 *  lands exactly where the reference shows it on frame 0; later camera moves give natural parallax. */
export const pixMap = (cam: V3, fov: number) => {
  const k = 2 * Math.tan((fov * Math.PI) / 360);
  const ppu = (z: number) => 720 / ((cam[2] - z) * k);
  const pt = (px: number, py: number, z: number): V3 => [cam[0] + (px - 640) / ppu(z), cam[1] - (py - 360) / ppu(z), z];
  return {ppu, pt};
};
type PM = ReturnType<typeof pixMap>;

/** Flat card whose outline is given in reference pixels at depth z. */
export const PxPoly: React.FC<{m: PM; pts: [number, number][]; z: number; color: string; opacity?: number}> = ({m, pts, z, color, opacity}) => {
  const w = pts.map(([x, y]) => { const p = m.pt(x, y, z); return [p[0], p[1]] as [number, number]; });
  return <Poly pts={w} color={color} pos={[0, 0, z]} fog={false} opacity={opacity} />;
};
export const PxCircle: React.FC<{m: PM; c: [number, number]; r: number; z: number; color: string; sy?: number; opacity?: number}> = ({m, c, r, z, color, sy = 1, opacity}) => {
  const p = m.pt(c[0], c[1], z), rr = r / m.ppu(z);
  return (
    <mesh position={p} scale={[1, sy, 1]}>
      <circleGeometry args={[rr, 40]} />
      <meshBasicMaterial color={color} fog={false} transparent={opacity !== undefined} opacity={opacity ?? 1} depthWrite={opacity === undefined} />
    </mesh>
  );
};
export const PxRect: React.FC<{m: PM; x0: number; y0: number; x1: number; y1: number; z: number; color: string; opacity?: number}> = ({m, x0, y0, x1, y1, z, color, opacity}) =>
  <PxPoly m={m} pts={[[x0, y0], [x1, y0], [x1, y1], [x0, y1]]} z={z} color={color} opacity={opacity} />;

/** Flat textured cards placed in a little canvas (px, y down), scaled to world units. Tint via `color`. */
export type FlatPart = {src: string; x: number; y: number; w: number; h: number; z: number; rot?: number; mirror?: boolean; color?: string; hide?: boolean; pivot?: [number, number]};
export const FlatCards: React.FC<{parts: FlatPart[]; scale: number; origin: [number, number]; pos: V3}> = ({parts, scale, origin, pos}) => {
  const tex = useTextures(React.useMemo(() => Array.from(new Set(parts.map((p) => p.src))), [parts.map((p) => p.src).join('|')]));
  if (!tex) return null;
  return (
    <group position={pos} scale={[scale, -scale, scale]}>
      {parts.filter((p) => !p.hide).map((p, i) => {
        const piv = p.pivot ?? [p.x + p.w / 2, p.y + p.h / 2];
        return (
          <group key={i} position={[piv[0] - origin[0], piv[1] - origin[1], p.z / scale]} rotation={[0, 0, ((p.rot ?? 0) * Math.PI) / 180]}>
            <mesh position={[p.x + p.w / 2 - piv[0], p.y + p.h / 2 - piv[1], 0]} scale={[p.mirror ? -1 : 1, -1, 1]}>
              <planeGeometry args={[p.w, p.h]} />
              <meshBasicMaterial map={tex[p.src]} color={p.color ?? '#ffffff'} transparent alphaTest={0.04} side={THREE.DoubleSide} fog={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** deterministic hash -> 0..1 */
export const hash = (a: number, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

/** One flame layer outline: tips = [[x -1..1, height 0..1], ...] left to right; sides bulge, dips sit between tips. */
const flameOutline = (w: number, h: number, tips: [number, number][]): [number, number][] => {
  // straight-edged cartoon tongues: the silhouette narrows from the base up to a row of wedge tips with V notches between
  const pts: [number, number][] = [[-w, 0], [-w * 0.9, h * 0.3]];
  tips.forEach(([x, th], i) => {
    if (i > 0) { const [px, ph] = tips[i - 1]; pts.push([((px + x) / 2 + 0.05) * w, Math.min(ph, th) * h * 0.62]); }
    pts.push([x * w, th * h]);
  });
  pts.push([w * 0.9, h * 0.3], [w, 0]);
  return pts;
};

/** Cartoon fire: three nested tongues (outer / mid / core) whose tips re-jitter every 2 frames, a coal heap with
 *  glowing pebbles, and sparks that rise and fade. pos = centre of the base (world), w = half-width, h = height. */
export const Flame: React.FC<{pos: V3; w: number; h: number; f: number; seed: number; colors: [string, string, string]; coal?: string; ember?: string; spark?: string}> = ({pos, w, h, f, seed, colors, coal = '#4a3f45', ember = '#ffb347', spark}) => {
  const k = Math.floor(f / 2);
  const jit = (base: [number, number][], amp: number, salt: number) => base.map(([x, y], i) => [x + (hash(k + seed * 13, i + salt) - 0.5) * 0.14, y * (1 - amp + 2 * amp * hash(k * 1.7 + seed, i * 3 + salt + 7))] as [number, number]);
  const outer = flameOutline(w, h, jit([[-0.5, 0.66], [0.02, 1.0], [0.55, 0.8]], 0.09, 1));
  const mid = flameOutline(w * 0.58, h * 0.72, jit([[-0.35, 0.85], [0.3, 1.0]], 0.1, 5));
  const core = flameOutline(w * 0.3, h * 0.3, jit([[-0.3, 0.8], [0.3, 1.0]], 0.14, 9));
  const mound: [number, number][] = Array.from({length: 13}, (_, i) => { const a = Math.PI - (i / 12) * Math.PI; return [Math.cos(a) * w * 1.0, Math.sin(a) * w * 0.3 * (0.8 + 0.35 * hash(i, seed))] as [number, number]; });
  return (
    <group position={pos}>
      <Poly pts={outer} color={colors[0]} pos={[0, 0, 0]} fog={false} />
      <Poly pts={mid} color={colors[1]} pos={[0, 0, 0.004]} fog={false} />
      <Poly pts={core} color={colors[2]} pos={[0, 0, 0.008]} fog={false} />
      <Poly pts={mound} color={coal} pos={[0, -0.01, 0.012]} fog={false} />
      {Array.from({length: 8}, (_, i) => {
        const x = (-0.8 + (i / 7) * 1.6) * w, y = Math.sin(Math.acos(Math.max(-1, Math.min(1, x / (w * 0.95))))) * w * 0.2;
        return <mesh key={i} position={[x, y, 0.016]}><circleGeometry args={[w * (0.06 + 0.025 * hash(i, seed + 3)), 10]} /><meshBasicMaterial color={ember} transparent opacity={0.7 + 0.3 * Math.sin(f * 0.5 + i * 2.1)} fog={false} /></mesh>;
      })}
      {Array.from({length: 7}, (_, i) => {
        const life = 16, ph = (f + i * 5.3 + seed * 3) % life, u = ph / life;
        const x = (hash(Math.floor((f + i * 5.3 + seed * 3) / life), i) - 0.5) * w * 1.6 + Math.sin(ph * 0.5 + i) * w * 0.08;
        return <mesh key={`s${i}`} position={[x, h * (0.35 + u * 0.95), 0.02]}><circleGeometry args={[w * 0.05 * (1 - u * 0.5), 8]} /><meshBasicMaterial color={spark ?? ember} transparent opacity={(1 - u) * 0.9} depthWrite={false} fog={false} /></mesh>;
      })}
    </group>
  );
};

/** 4-point star flare: two crossed thin diamonds plus a soft halo. s = arm length (world). */
export const Flare: React.FC<{pos: V3; s: number; color?: string; opacity?: number}> = ({pos, s, color = '#ffffff', opacity = 1}) => {
  if (opacity <= 0.01 || s <= 0) return null;
  const arm = (rot: number) => <Poly pts={[[0, s], [s * 0.13, 0], [0, -s], [-s * 0.13, 0]]} color={color} rot={[0, 0, rot]} fog={false} opacity={opacity} />;
  return (
    <group position={pos}>
      {arm(0)}{arm(Math.PI / 2)}
      <mesh position={[0, 0, -0.001]}><circleGeometry args={[s * 0.55, 20]} /><meshBasicMaterial color={color} transparent opacity={0.22 * opacity} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh>
    </group>
  );
};
