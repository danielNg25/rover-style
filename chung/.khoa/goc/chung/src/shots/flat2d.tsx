import React, {useMemo} from 'react';
import * as THREE from 'three';

/** Flat 2D helpers used by the "cutaway" space shots (agent a). Everything lives in a PIXEL group:
 *  children use reference-frame pixel coords (x right, y DOWN, 1280x720), z = layer order (small numbers). */
export const CAM_Z = 20;
export const CAM_FOV = (2 * Math.atan(3.6 / CAM_Z) * 180) / Math.PI; // plane z=0 spans exactly 12.8 x 7.2 units
export const PixelSpace: React.FC<{children: React.ReactNode}> = ({children}) => (
  <group position={[-6.4, 3.6, 0]} scale={[0.01, -0.01, 0.01]}>{children}</group>
);

export const rand = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

type C = {color: string; z?: number; opacity?: number};
// all flat layers are drawn painter-style: no depth test, order = z (renderOrder), all in the transparent list
export const ro = (z: number) => 100000 + Math.round(z * 1000);
const mat = (color: string, opacity?: number, additive?: boolean) => (
  <meshBasicMaterial color={color} side={THREE.DoubleSide} fog={false} transparent opacity={opacity ?? 1} depthTest={false} depthWrite={false}
    blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending} />
);
export const Disc: React.FC<C & {x: number; y: number; r: number; sy?: number; seg?: number; add?: boolean}> = ({x, y, r, z = 0, color, opacity, sy = 1, seg = 40, add}) => (
  <mesh position={[x, y, 0]} scale={[1, sy, 1]} renderOrder={ro(z)}><circleGeometry args={[Math.max(r, 0.001), seg]} />{mat(color, opacity, add)}</mesh>
);
/** ring segment; angles in degrees measured on screen from UP, clockwise */
export const Ring: React.FC<C & {x: number; y: number; r1: number; r2: number; a0?: number; a1?: number; sy?: number; rot?: number}> = ({x, y, r1, r2, a0 = 0, a1 = 360, z = 0, color, opacity, sy = 1, rot = 0}) => (
  <group position={[x, y, 0]} rotation={[0, 0, (rot * Math.PI) / 180]} scale={[1, sy, 1]}>
    <mesh renderOrder={ro(z)}><ringGeometry args={[r1, r2, 64, 1, ((a0 - 90) * Math.PI) / 180, ((a1 - a0) * Math.PI) / 180]} />{mat(color, opacity)}</mesh>
  </group>
);
export const P: React.FC<C & {pts: [number, number][]; x?: number; y?: number}> = ({pts, x = 0, y = 0, z = 0, color, opacity}) => {
  const geo = useMemo(() => {
    const sh = new THREE.Shape();
    pts.forEach(([a, b], i) => (i ? sh.lineTo(a, b) : sh.moveTo(a, b)));
    return new THREE.ShapeGeometry(sh);
  }, [JSON.stringify(pts)]);
  return <mesh geometry={geo} position={[x, y, 0]} renderOrder={ro(z)}>{mat(color, opacity)}</mesh>;
};
export const Rect: React.FC<C & {x0: number; y0: number; x1: number; y1: number}> = ({x0, y0, x1, y1, ...c}) => (
  <P pts={[[x0, y0], [x1, y0], [x1, y1], [x0, y1]]} {...c} />
);
/** 4-point sparkle star */
export const Sparkle: React.FC<{x: number; y: number; s: number; z?: number; color?: string; opacity?: number}> = ({x, y, s, z = 0, color = '#fff6dc', opacity}) => (
  <>
    <P pts={[[x, y - s], [x + s * 0.16, y], [x, y + s], [x - s * 0.16, y]]} color={color} z={z} opacity={opacity} />
    <P pts={[[x - s, y], [x, y - s * 0.16], [x + s, y], [x, y + s * 0.16]]} color={color} z={z} opacity={opacity} />
  </>
);
/** small diamond */
export const Dia: React.FC<{x: number; y: number; w: number; h?: number; z?: number; color: string; opacity?: number}> = ({x, y, w, h, z = 0, color, opacity}) => {
  const hh = h ?? w;
  return <P pts={[[x, y - hh], [x + w, y], [x, y + hh], [x - w, y]]} color={color} z={z} opacity={opacity} />;
};
/** spike (triangle) pointing outwards from (cx,cy) at screen angle a (deg from up, clockwise) */
export const spike = (cx: number, cy: number, a: number, r0: number, r1: number, hw: number): [number, number][] => {
  const t = (a * Math.PI) / 180, dx = Math.sin(t), dy = -Math.cos(t), nx = -dy, ny = dx;
  return [[cx + dx * r0 + nx * hw, cy + dy * r0 + ny * hw], [cx + dx * r1, cy + dy * r1], [cx + dx * r0 - nx * hw, cy + dy * r0 - ny * hw]];
};
/** circle polygon clipped to the side of line (p0 -> p0+d) where cross(d, p-p0) > 0 */
export const clipCircle = (r: number, p0: [number, number], d: [number, number], n = 128): [number, number][] => {
  const pts: [number, number][] = [];
  const side = (p: [number, number]) => d[0] * (p[1] - p0[1]) - d[1] * (p[0] - p0[0]);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2;
    const p: [number, number] = [Math.cos(a) * r, Math.sin(a) * r], q: [number, number] = [Math.cos(b) * r, Math.sin(b) * r];
    const sp = side(p), sq = side(q);
    if (sp >= 0) pts.push(p);
    if ((sp >= 0) !== (sq >= 0)) { const k = sp / (sp - sq); pts.push([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]); }
  }
  return pts;
};
