import React, {createContext, useContext, useEffect, useMemo} from 'react';
import * as THREE from 'three';
import type {V3, Pt} from './math';
import {deg} from './math';

/** kit/shapes: solids (lit, flat-shaded) and flat cards (unlit). No outlines, no gradients.
 *  Flat shapes are drawn in their local XY plane; place them with pos / rot. Angles are in degrees. */

/** internal: lets <NearBlur> fade the copies it draws */
export const MatFx = createContext<{opacity: number; soft: boolean}>({opacity: 1, soft: false});
/** internal: true inside a y-down pixel plane (RefPlane, Card children) so text and pictures un-flip themselves */
export const YDown = createContext(false);
/** internal: what <Stage> tells its children (frame, shot length, the glows mounted in it) */
export const StageCtx = createContext<{f: number; len: number; glows: Set<string>} | null>(null);
/** DRAW ORDER (the `order` prop). Opaque things need none: depth sorts them. See-through things (opacity below 1,
 *  `add`, LightShaft, Glow, NearBlur copies) are drawn late, at SEE_THROUGH = 500, so they tint whatever stands behind
 *  them, puppets included (puppets draw at 10-30); depth is still tested, so a see-through card BEHIND a figure stays
 *  hidden by it. Marks draw at 900, name tags at 990. Pass `order` only to sort see-through things among themselves. */
export const SEE_THROUGH = 500;

type Solid = {pos?: V3; rot?: V3; scale?: V3 | number; color: string; cast?: boolean; receive?: boolean; unlit?: boolean; opacity?: number};
const SolidMat: React.FC<Solid> = ({color, unlit, opacity = 1}) => {
  const fx = useContext(MatFx), o = opacity * fx.opacity, tr = o < 1;
  return unlit
    ? <meshBasicMaterial color={color} fog={false} transparent={tr} opacity={o} depthWrite={!tr} />
    : <meshStandardMaterial color={color} roughness={1} metalness={0} flatShading transparent={tr} opacity={o} depthWrite={!tr} />;
};
const SolidMesh: React.FC<{p: Solid; children: React.ReactNode}> = ({p, children}) => {
  const fx = useContext(MatFx), see = (p.opacity ?? 1) * fx.opacity < 1;
  return <mesh position={p.pos} rotation={p.rot} scale={p.scale} castShadow={p.cast ?? false} receiveShadow={p.receive ?? true} userData={{noRecv: p.receive === false}} renderOrder={see ? SEE_THROUGH : 0}>{children}<SolidMat {...p} /></mesh>;
};
const solid = (p: Solid, geo: React.ReactNode) => <SolidMesh p={p}>{geo}</SolidMesh>;
/** Box, size = [x, y, z], origin at its centre */
export const Box: React.FC<Solid & {size: V3}> = (p) => solid(p, <boxGeometry args={p.size} />);
/** Cylinder (r2 = top radius for a taper), origin at its centre */
export const Cyl: React.FC<Solid & {r: number; r2?: number; h: number; seg?: number}> = (p) => solid(p, <cylinderGeometry args={[p.r2 ?? p.r, p.r, p.h, p.seg ?? 20]} />);
/** Cone (seg 4 = pyramid), origin at its centre */
export const Cone: React.FC<Solid & {r: number; h: number; seg?: number}> = (p) => solid(p, <coneGeometry args={[p.r, p.h, p.seg ?? 16]} />);
const BANDS = (() => { const t = new THREE.DataTexture(new Uint8Array([150, 150, 150, 255, 212, 212, 212, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
/** Ball (planets, gold knobs, fruit). Round outline, never faceted. shade = 'bands' (default: three hard-edged
 *  flat tones from the light, the cut-paper look), 'flat' (one unlit tone) or 'smooth' (soft gradient: avoid). */
export const Ball: React.FC<Solid & {r: number; seg?: number; shade?: 'bands' | 'flat' | 'smooth'}> = (p) => {
  const fx = useContext(MatFx), o = (p.opacity ?? 1) * fx.opacity, tr = o < 1, shade = p.unlit ? 'flat' : p.shade ?? 'bands';
  return (
    <mesh position={p.pos} rotation={p.rot} scale={p.scale} castShadow={p.cast ?? false} receiveShadow={false} userData={{noRecv: true}} renderOrder={tr ? SEE_THROUGH : 0}>
      <sphereGeometry args={[p.r, p.seg ?? 48, Math.round((p.seg ?? 48) * 0.7)]} />
      {shade === 'flat' ? <meshBasicMaterial color={p.color} fog={false} transparent={tr} opacity={o} />
        : shade === 'bands' ? <meshToonMaterial color={p.color} gradientMap={BANDS} transparent={tr} opacity={o} />
        : <meshStandardMaterial color={p.color} roughness={1} metalness={0} transparent={tr} opacity={o} />}
    </mesh>
  );
};

export type Flat = {color: string; pos?: V3; rot?: V3; scale?: V3 | number; opacity?: number; order?: number; add?: boolean};
/** internal: the one material every flat card uses */
export const FlatMat: React.FC<{color: string; opacity?: number; add?: boolean; map?: THREE.Texture | null; alphaTest?: number}> = ({color, opacity = 1, add, map, alphaTest}) => {
  const fx = useContext(MatFx), o = opacity * fx.opacity, tr = o < 1 || !!add || !!map;
  return <meshBasicMaterial color={color} map={map ?? undefined} side={THREE.DoubleSide} fog={false} toneMapped={false} transparent={tr} opacity={o}
    alphaTest={alphaTest ?? 0} depthWrite={!(o < 1 || add)} blending={add ? THREE.AdditiveBlending : THREE.NormalBlending} />;
};
/** internal: default draw order of a flat card (see SEE_THROUGH) */
export const useOrder = (order: number | undefined, opacity = 1, add = false) => {
  const fx = useContext(MatFx);
  return order ?? (opacity * fx.opacity < 1 || add ? SEE_THROUGH : 0);
};
const FlatMesh: React.FC<{p: Flat; geometry?: THREE.BufferGeometry; children?: React.ReactNode}> = ({p, geometry, children}) => (
  <mesh geometry={geometry} position={p.pos} rotation={p.rot} scale={p.scale} renderOrder={useOrder(p.order, p.opacity, p.add)}>{children}<FlatMat color={p.color} opacity={p.opacity} add={p.add} /></mesh>
);
const flat = (p: Flat, geo: React.ReactNode | null, geometry?: THREE.BufferGeometry) => <FlatMesh p={p} geometry={geometry}>{geo}</FlatMesh>;
const useGeo = (make: () => THREE.BufferGeometry, key: string) => {
  const g = useMemo(make, [key]);
  useEffect(() => () => g.dispose(), [g]);
  return g;
};
/** Polygon card from 2D points (any outline without holes) */
export const Poly: React.FC<Flat & {pts: Pt[]}> = (p) => {
  const g = useGeo(() => { const s = new THREE.Shape(); p.pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); return new THREE.ShapeGeometry(s); }, JSON.stringify(p.pts));
  return flat(p, null, g);
};
/** Rectangle w x h, centred */
export const Rect: React.FC<Flat & {w: number; h: number}> = (p) => flat(p, <planeGeometry args={[p.w, p.h]} />);
/** Rounded rectangle w x h with corner radius r, centred */
export const RoundRect: React.FC<Flat & {w: number; h: number; r: number}> = (p) => {
  const g = useGeo(() => {
    const {w, h} = p, r = Math.min(p.r, w / 2, h / 2), s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
    s.lineTo(w / 2, h / 2 - r); s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
    s.lineTo(-w / 2 + r, h / 2); s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-w / 2, -h / 2 + r); s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
    return new THREE.ShapeGeometry(s, 8);
  }, `${p.w},${p.h},${p.r}`);
  return flat(p, null, g);
};
/** Disc of radius r (sy squashes it into an ellipse) */
export const Disc: React.FC<Flat & {r: number; sy?: number; seg?: number}> = (p) => {
  const order = useOrder(p.order, p.opacity, p.add);
  return <group position={p.pos} rotation={p.rot} scale={p.scale}><mesh scale={[1, p.sy ?? 1, 1]} renderOrder={order}><circleGeometry args={[Math.max(p.r, 1e-4), p.seg ?? 48]} /><FlatMat color={p.color} opacity={p.opacity} add={p.add} /></mesh></group>;
};
/** Ring or ring segment between radii r1 < r2, from angle a0 to a1 (degrees, counter-clockwise from +x) */
export const Arc: React.FC<Flat & {r1: number; r2: number; a0?: number; a1?: number}> = (p) =>
  flat(p, <ringGeometry args={[p.r1, p.r2, 64, 1, deg(p.a0 ?? 0), deg((p.a1 ?? 360) - (p.a0 ?? 0))]} />);
/** Diamond (half-width w, half-height h): stars, gems, crisp sparks */
export const Diamond: React.FC<Flat & {w: number; h?: number}> = (p) => { const h = p.h ?? p.w; return <Poly {...p} pts={[[0, h], [p.w, 0], [0, -h], [-p.w, 0]]} />; };

// ---- strokes
const pathLen = (pts: Pt[]) => { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; };
const pointAt = (pts: Pt[], cum: number[], s: number): {p: Pt; n: Pt} => {
  let i = 1; while (i < pts.length - 1 && cum[i] < s) i++;
  const a = pts[i - 1], b = pts[i], l = cum[i] - cum[i - 1] || 1, t = Math.max(0, Math.min(1, (s - cum[i - 1]) / l));
  const dx = (b[0] - a[0]) / l, dy = (b[1] - a[1]) / l;
  return {p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], n: [-dy, dx]};
};
/** Line with thickness, drawn from its start up to fraction p (0..1) of its length: the draw-on primitive.
 *  pts = polyline (use bezier() / circlePts() for curves); width = thickness; taper = start width as a share of
 *  the end width (0.5 = marker stroke); dash = [on, off] lengths for a dotted route. */
export const Stroke: React.FC<Flat & {pts: Pt[]; width: number; p?: number; taper?: number; dash?: [number, number]}> = (q) => {
  const {pts, width, p = 1, taper = 1, dash} = q;
  const g = useGeo(() => {
    const cum = pathLen(pts), L = cum[cum.length - 1], end = L * Math.max(0, Math.min(1, p));
    const pos: number[] = [], idx: number[] = [];
    const seg = (s0: number, s1: number) => {
      const n = Math.max(2, Math.ceil((s1 - s0) / Math.max(width * 0.6, L / 160)) + 1), base = pos.length / 3;
      for (let i = 0; i < n; i++) {
        const s = s0 + ((s1 - s0) * i) / (n - 1), {p: c, n: nn} = pointAt(pts, cum, s), hw = (width / 2) * (taper + (1 - taper) * (s / (L || 1)));
        pos.push(c[0] + nn[0] * hw, c[1] + nn[1] * hw, 0, c[0] - nn[0] * hw, c[1] - nn[1] * hw, 0);
        if (i) { const k = base + i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
      }
    };
    if (end > 0) { if (dash) for (let s = 0; s < end; s += dash[0] + dash[1]) seg(s, Math.min(end, s + dash[0])); else seg(0, end); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
    return geo;
  }, JSON.stringify([pts, width, p, taper, dash]));
  if (p <= 0) return null;
  return flat(q, null, g);
};
/** points along a quadratic curve p0 -> (control p1) -> p2 */
export const bezier = (p0: Pt, p1: Pt, p2: Pt, n = 24): Pt[] => Array.from({length: n + 1}, (_, i) => { const t = i / n, a = (1 - t) ** 2, b = 2 * (1 - t) * t, c = t * t; return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]] as Pt; });
/** points along a circle or ellipse arc (degrees, counter-clockwise from +x) */
export const circlePts = (c: Pt, r: number, a0 = 0, a1 = 360, n = 48, sy = 1): Pt[] => Array.from({length: n + 1}, (_, i) => { const a = deg(a0 + ((a1 - a0) * i) / n); return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * sy] as Pt; });

// ---- reference pixel space
export type RefSpace = {cam: V3; fov: number; w: number; h: number; ppu: (z: number) => number; pt: (px: number, py: number, z: number) => V3; len: (px: number, z: number) => number};
/** Lay flat cards out by FRAME PIXELS at a chosen depth. cam / fov = the camera on frame 0 (looking straight down
 *  -z). m.pt(px, py, z) = the world point that appears at pixel (px, py) (y down) on frame 0 when it sits at depth
 *  z; m.len(px, z) = world length of px pixels at that depth. Because every card has a real depth, any camera
 *  move then gives true parallax. */
export const refSpace = (o: {cam: V3; fov: number; w?: number; h?: number}): RefSpace => {
  const w = o.w ?? 1280, h = o.h ?? 720, k = 2 * Math.tan((o.fov * Math.PI) / 360);
  const ppu = (z: number) => h / ((o.cam[2] - z) * k);
  return {cam: o.cam, fov: o.fov, w, h, ppu, pt: (px, py, z) => [o.cam[0] + (px - w / 2) / ppu(z), o.cam[1] - (py - h / 2) / ppu(z), z], len: (px, z) => px / ppu(z)};
};
/** A plane at depth z whose children are placed in frame pixels (x right, y DOWN, origin top-left of the frame).
 *  Use small z offsets (0.1 .. 2 "pixels") between children to stack them. */
export const RefPlane: React.FC<{m: RefSpace; z: number; children: React.ReactNode}> = ({m, z, children}) => {
  const s = 1 / m.ppu(z);
  return <group position={m.pt(0, 0, z)} scale={[s, -s, s]}><YDown.Provider value={true}>{children}</YDown.Provider></group>;
};
