import React, {useMemo, useContext} from 'react';
import * as THREE from 'three';
import {FacetLathe, lathe} from './look';
import {rnd, Ctx, ShotCtx} from './depth';
import {tex} from './kitLab';
import {paint as paintFigure, BOX, SOLE_Y, CENTRE_X, HAIR_TOP} from '../mould/draw';
import type {Spec} from '../mould/draw';

/** lib3/kitNuiTuyet: THE SNOWY MOUNTAINSIDE WITH A ROCK SHELTER (d1c4, Doctor Doom chapter 4; meant to serve chapters 8 and 9 too,
 *  Victor lost in the snow, Tibet). Metres, y up, the lens looks along -z.
 *  Big surfaces carry detail at three sizes (skill 1): the masses (stacked slabs, the overhang, the buttresses, drifts), the middle
 *  pieces (ledges with snow on them, icicles, cracks, splinters) and the grain (strata, joints, pitting, frost, lichen, ice). */
type V3 = [number, number, number];
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const shade = (hex: string, k: number) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();

// ================================================================ rock, painted
/** A face of mountain rock (natural, not masonry): large soft blotches of tone; strata as wavy dark seams that break off and
 *  start again, each with a lit lip above it and snow lodged on the lip; slanting fractures; flakes and chips with a lit edge;
 *  ice streaks running down from the lips; lichen; grain. Wm x Hm metres. frost 0..1 = snow on the lips; ice = ice streaks. */
export type CliffLook = {seed: number; tones?: string[]; course?: [number, number]; joint?: [number, number]; tilt?: number; frost?: number; ice?: number; lichen?: number};
const CLIFF_TONES = ['#929bab', '#858e9e', '#9ea5b1', '#7a8292', '#8f94a1', '#9aa0ac', '#737b8b'];
export const paintCliff = (Wm: number, Hm: number, o: CliffLook) => (c: Ctx, W: number, H: number) => {
  const r = rnd(o.seed), ppm = W / Wm, tones = o.tones ?? CLIFF_TONES, [c0, c1] = o.course ?? [0.16, 0.55], tilt = (o.tilt ?? 0.08) * ppm, frost = o.frost ?? 0.6, ice = o.ice ?? 0.5;
  const base = tones[0]; c.fillStyle = base; c.fillRect(0, 0, W, H);
  // big soft blotches of the other tones (no two square metres alike)
  for (let k = 0; k < Wm * Hm * 6 + 6; k++) { const x = r() * W, y = r() * H, q = (0.25 + r() * 0.9) * ppm, col = new THREE.Color(tones[Math.floor(r() * tones.length)]), g = c.createRadialGradient(x, y, 0, x, y, q);
    g.addColorStop(0, `rgba(${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0},0.55)`); g.addColorStop(1, `rgba(${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0},0)`); c.fillStyle = g; c.fillRect(x - q, y - q, q * 2, q * 2); }
  // a darker cast towards the foot, lighter towards the top
  const v = c.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(235,240,255,0.1)'); v.addColorStop(1, 'rgba(10,12,24,0.22)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
  // strata: wavy seams across the face, broken into runs; the band under each seam a little darker (it is recessed)
  let y = (0.05 + r() * 0.2) * ppm;
  while (y < H) {
    const sl = (r() - 0.5) * tilt * 2, amp = (0.01 + r() * 0.03) * ppm, fr = 2 + r() * 4, ph = r() * 6, seam = (x: number) => y + (x / W) * sl + Math.sin((x / W) * fr * 6.28 + ph) * amp;
    const band = (c0 + r() * (c1 - c0)) * ppm;
    for (let x0 = -r() * 0.5 * ppm; x0 < W; ) {
      const run = (0.6 + r() * 2.2) * ppm, x1 = Math.min(W + 10, x0 + run);
      // recessed band under the seam
      c.fillStyle = 'rgba(14,16,28,0.09)'; c.beginPath(); c.moveTo(x0, seam(x0)); for (let x = x0; x <= x1; x += 8) c.lineTo(x, seam(x)); for (let x = x1; x >= x0; x -= 8) c.lineTo(x, seam(x) + band * (0.25 + 0.15 * Math.sin(x * 0.01))); c.closePath(); c.fill();
      // the seam and its lit lip
      c.lineCap = 'round'; c.lineWidth = Math.max(2, (0.012 + r() * 0.01) * ppm); c.strokeStyle = 'rgba(10,12,22,0.62)'; c.beginPath(); for (let x = x0; x <= x1; x += 6) (x === x0 ? c.moveTo(x, seam(x)) : c.lineTo(x, seam(x))); c.stroke();
      c.lineWidth = Math.max(1.5, 0.008 * ppm); c.strokeStyle = 'rgba(236,242,255,0.3)'; c.beginPath(); for (let x = x0; x <= x1; x += 6) (x === x0 ? c.moveTo(x, seam(x) - 0.012 * ppm) : c.lineTo(x, seam(x) - 0.012 * ppm)); c.stroke();
      // snow on the lip, in patches
      for (let x = x0; x < x1; x += (0.15 + r() * 0.4) * ppm) if (r() < frost * 0.7) { const w = (0.08 + r() * 0.35) * ppm; c.fillStyle = 'rgba(236,240,250,0.82)'; c.beginPath(); c.moveTo(x, seam(x) - 0.006 * ppm); for (let t = 0; t <= 1; t += 0.2) c.lineTo(x + w * t, seam(x + w * t) - (0.01 + Math.sin(t * 3.14) * (0.015 + r() * 0.02)) * ppm); for (let t = 1; t >= 0; t -= 0.25) c.lineTo(x + w * t, seam(x + w * t) + 0.004 * ppm); c.closePath(); c.fill(); }
      // ice streaks running down from the seam
      if (r() < ice) { const sx = x0 + r() * (x1 - x0), len = (0.12 + r() * 0.4) * ppm, g2 = c.createLinearGradient(0, seam(sx), 0, seam(sx) + len); g2.addColorStop(0, 'rgba(200,222,245,0.45)'); g2.addColorStop(1, 'rgba(200,222,245,0)'); c.fillStyle = g2; c.fillRect(sx, seam(sx), (0.015 + r() * 0.035) * ppm, len); }
      x0 = x1 + (0.05 + r() * 0.5) * ppm;
    }
    y += band;
  }
  // fractures: slanting dark cracks, some forking, with a lit edge on one side
  for (let k = 0; k < Math.round(Wm * Hm * 1.6) + 2; k++) {
    let px = r() * W, py = r() * H; const a = (r() - 0.5) * 0.9, len = (0.2 + r() * 0.9) * ppm, n = 6;
    c.strokeStyle = 'rgba(10,12,22,0.6)'; c.lineWidth = Math.max(1.2, (0.006 + r() * 0.008) * ppm); c.beginPath(); c.moveTo(px, py);
    for (let i = 0; i < n; i++) { px += Math.sin(a) * len / n + (r() - 0.5) * 0.04 * ppm; py += Math.cos(a) * len / n; c.lineTo(px, py); } c.stroke();
  }
  // flakes: angular facets with a lit top edge and a shadow below (the surface is broken, not smooth)
  for (let k = 0; k < Math.round(Wm * Hm * 5); k++) {
    const x = r() * W, y2 = r() * H, s = (0.05 + r() * 0.16) * ppm, a2 = r() * 6.28, pts = [0, 1, 2, 3].map((i) => [x + Math.cos(a2 + i * 1.6 + r() * 0.5) * s * (0.6 + r() * 0.5), y2 + Math.sin(a2 + i * 1.6 + r() * 0.5) * s * 0.6]);
    c.fillStyle = r() < 0.5 ? 'rgba(235,240,255,0.05)' : 'rgba(12,14,26,0.07)'; c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(236,242,255,0.22)'; c.lineWidth = Math.max(1, 0.005 * ppm); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.stroke();
  }
  // lichen rosettes, grain and pits
  for (let k = 0; k < Wm * Hm * (o.lichen ?? 0.35) * 12; k++) { const px = r() * W, py = r() * H, s = (0.012 + r() * 0.03) * ppm; c.fillStyle = r() < 0.5 ? 'rgba(168,140,78,0.3)' : 'rgba(132,150,120,0.28)'; c.beginPath(); c.ellipse(px, py, s, s * 0.7, r() * 3, 0, 7); c.fill(); }
  const n = Math.round(Wm * Hm * 1800);
  for (let k = 0; k < n; k++) { const a = r(); c.fillStyle = a < 0.55 ? `rgba(16,18,30,${0.14 + r() * 0.22})` : a < 0.85 ? `rgba(235,240,252,${0.08 + r() * 0.12})` : 'rgba(70,74,92,0.25)'; const s = (0.003 + r() * 0.007) * ppm; c.fillRect(r() * W, r() * H, s, s * (0.6 + r() * 0.8)); }
};
/** a cliff texture of a size in metres, kept by key (ppm capped so the canvas stays under 4096) */
export const cliffTex = (key: string, Wm: number, Hm: number, look: CliffLook, ppm = 240) => {
  const k = Math.min(ppm, 4096 / Math.max(Wm, Hm)); return tex(key, Math.max(64, Math.round(Wm * k)), Math.max(64, Math.round(Hm * k)), paintCliff(Wm, Hm, look));
};
/** smooth noise in 3D (a few sines), about -1..1 */
const noise3 = (x: number, y: number, z: number, sd: number) => (Math.sin(x * 1.7 + sd) * Math.cos(y * 2.3 + sd * 1.3) + Math.sin(z * 1.9 + x * 0.7 + sd * 2.1) * 0.7 + Math.sin((x + y + z) * 3.7 + sd * 0.3) * 0.35) / 2.05;
/** A box made rough: every vertex pushed by a smooth noise and the edges and corners pulled in (a bevel), so with flat shading it
 *  reads as a broken block of rock, not a brick. rough = metres of push; bevel = how much the corners are cut. */
export const roughBox = (w: number, h: number, d: number, rough: number, bevel: number, seed: number) => {
  const seg = (m: number) => Math.max(1, Math.round(m * 1.4)), g = new THREE.BoxGeometry(w, h, d, seg(w), seg(h), seg(d)), p = g.attributes.position as THREE.BufferAttribute, c = bevel * 0.14;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const ex = Math.abs(x) > w / 2 - 1e-4, ey = Math.abs(y) > h / 2 - 1e-4, ez = Math.abs(z) > d / 2 - 1e-4, edge = (ex ? 1 : 0) + (ey ? 1 : 0) + (ez ? 1 : 0) >= 2;
    // broken edges: a vertex ON an edge is pulled in along its two outer axes (so every edge becomes a narrow slanted facet)
    if (edge) { const j = 0.6 + 0.8 * (0.5 + 0.5 * noise3(x * 2, y * 2, z * 2, seed + 4)); if (ex) x -= Math.sign(x) * c * j; if (ey) y -= Math.sign(y) * c * j * 0.6; if (ez) z -= Math.sign(z) * c * j; }
    const q = rough * noise3(x * 0.9, y * 0.9, z * 0.9, seed), q2 = rough * 0.45 * noise3(x * 2.3 + 5, y * 2.3, z * 2.3, seed + 9);
    p.setXYZ(i, x + q2 * 0.5, y + q2 * 0.3, z + q + q2);
  }
  g.computeVertexNormals(); return g;
};
/** A block of mountain rock: each face its own cliff picture at its own size (no stretching). p = centre, s = size, r = rotation.
 *  rough / bevel: break its outline (roughBox) and shade it facet by facet. */
export const CliffBox: React.FC<{id: string; p: V3; s: V3; r?: V3; look?: Partial<CliffLook>; color?: string; cast?: boolean; rough?: number; bevel?: number}> = ({id, p, s, r: rot, look = {}, color = '#ffffff', cast = true, rough = 0, bevel = 0}) => {
  const [w, h, d] = s;
  const mats = useMemo(() => {
    const L = (sd: number): CliffLook => ({...look, seed: (look.seed ?? 1) * 7 + sd});
    const side = cliffTex(`${id}-x`, d, h, L(3)), top = cliffTex(`${id}-y`, w, d, {...L(5), frost: 1, ice: 0}), front = cliffTex(`${id}-z`, w, h, L(7));
    return [side, side, top, top, front, front].map((m) => new THREE.MeshLambertMaterial({color, map: m, flatShading: rough > 0}));
  }, [id, w, h, d, color, rough]);
  const geo = useMemo(() => (rough > 0 ? roughBox(w, h, d, rough, bevel, (look.seed ?? 1) * 3.1) : new THREE.BoxGeometry(w, h, d)), [w, h, d, rough, bevel, look.seed]);
  return <mesh position={p} rotation={rot} castShadow={cast} receiveShadow material={mats} geometry={geo} />;
};
/** A low-poly rock: a twenty-sided solid split once, pushed out of round by noise, its foot cut flat; with flat shading every facet
 *  takes its own tone. top = cut its top flat at that share of its height (a rock to stand on). */
export const rockGeo = (seed: number, top = 1) => {
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.32 * noise3(x * 1.6, y * 1.6, z * 1.6, seed); p.setXYZ(i, x * k, Math.min(Math.max(y * k, -0.35), top * 0.9 + 0.1 * (1 - top)), z * k); }
  g.computeBoundingBox(); const b = g.boundingBox!; g.translate(0, -b.min.y, 0); g.scale(1, 1 / (b.max.y - b.min.y), 1); g.computeVertexNormals(); return g;
};
/** A rock half buried in snow, with snow lying on its top: w wide, h high, d deep (metres). snow = false: bare rock. */
export const SnowRock: React.FC<{pos: V3; w: number; h: number; d?: number; seed?: number; color?: string; snow?: string | false; rotY?: number; flatTop?: boolean}> =
  ({pos, w, h, d, seed = 1, color = '#4a5062', snow = SNOW, rotY = 0, flatTop}) => {
    const g = useMemo(() => rockGeo(seed, flatTop ? 0.55 : 1), [seed, flatTop]), cap = useMemo(() => rockGeo(seed + 50, 0.5), [seed]), dd = d ?? w * 0.8;
    return (
      <group position={pos} rotation={[0, rotY, 0]}>
        <mesh geometry={g} scale={[w / 2, h, dd / 2]} castShadow receiveShadow><meshLambertMaterial color={color} flatShading /></mesh>
        {snow ? <mesh geometry={cap} position={[w * 0.04, h * (flatTop ? 0.96 : 0.78), dd * 0.02]} scale={[w * 0.4, h * 0.2, dd * 0.38]} castShadow receiveShadow><meshLambertMaterial color={snow} flatShading /></mesh> : null}
        <SnowDrift pos={[0, 0, dd * 0.1]} w={w * 1.3} d={dd * 1.2} h={h * 0.22} seed={seed + 7} />
      </group>
    );
  };

// ================================================================ snow shapes
const SNOW = '#e8ecf5';
/** A drift of snow: a low faceted heap, w long (x), d deep (z), h high, its crest a little behind the middle; heaps of several
 *  facets so the light gives it a lit and a shadowed side. */
export const SnowDrift: React.FC<{pos: V3; w: number; d: number; h: number; seed?: number; color?: string; rotY?: number; cast?: boolean}> = ({pos, w, d, h, seed = 1, color = SNOW, rotY = 0, cast = true}) => {
  const geo = useMemo(() => lathe([[1, 0], [0.86, 0.34], [0.58, 0.72], [0.22, 1]], 11, 1, 0.14, seed, 1, 0.8, [0.92, 1, 1.05]), [seed]);
  return <mesh geometry={geo} position={pos} rotation={[0, rotY, 0]} scale={[w / 2, h, d / 2]} castShadow={cast} receiveShadow><meshLambertMaterial color={color} vertexColors /></mesh>;
};
/** The father's grave (d1c4 shot 18 onwards): a long mound of snow, len along x, a dry pine branch stuck upright at its head
 *  (the left end), a few stones at its foot. */
export const SnowGrave: React.FC<{pos: V3; len?: number; seed?: number}> = ({pos, len = 1.6, seed = 3}) => (
  <group position={pos}>
    <SnowDrift pos={[0, 0, 0]} w={len} d={0.62} h={0.45} seed={seed} />
    <SnowDrift pos={[len * 0.05, 0, 0.04]} w={len * 0.8} d={0.5} h={0.5} seed={seed + 4} />
    {/* the branch: a crooked stick, two side twigs and a few dead needles, stuck in at the left end */}
    <group position={[-len * 0.42, 0.32, 0]} rotation={[0, 0, 0.08]}>
      <mesh position={[0, 0.32, 0]} castShadow><boxGeometry args={[0.035, 0.68, 0.035]} /><meshLambertMaterial color="#4a3526" /></mesh>
      <mesh position={[0.08, 0.5, 0]} rotation={[0, 0, -0.9]} castShadow><boxGeometry args={[0.02, 0.24, 0.02]} /><meshLambertMaterial color="#4a3526" /></mesh>
      <mesh position={[-0.07, 0.36, 0]} rotation={[0, 0, 0.8]} castShadow><boxGeometry args={[0.018, 0.2, 0.018]} /><meshLambertMaterial color="#56402e" /></mesh>
      {[[0.15, 0.58, -1.3], [0.17, 0.55, -0.4], [-0.13, 0.42, 1.2], [-0.12, 0.45, 0.5], [0.03, 0.66, 0.2], [-0.02, 0.69, -0.3]].map(([x, y, a], i) => <mesh key={i} position={[x, y, 0.005]} rotation={[0, 0, a]}><boxGeometry args={[0.01, 0.07, 0.01]} /><meshLambertMaterial color="#5c5034" /></mesh>)}
      <mesh position={[0.01, 0.67, 0.01]}><boxGeometry args={[0.05, 0.025, 0.05]} /><meshLambertMaterial color={SNOW} /></mesh>
    </group>
    {[[len * 0.44, 0.16, 0.08], [len * 0.5, 0.14, -0.1], [len * 0.38, 0.12, 0.2]].map(([x, s, z], i) => <SnowRock key={i} pos={[x, 0, z]} w={s * 1.6} h={s} seed={seed + i * 3} snow={false} color="#474c5c" />)}
  </group>
);
/** A low flat-topped rock to stand on (d1c4 shot 21: the boy on it, his shadow on the wall): top = height of its flat top. */
export const StandRock: React.FC<{pos: V3; top?: number; r?: number; seed?: number}> = ({pos, top = 0.3, r = 0.38, seed = 5}) => (
  <group position={pos}>
    <SnowRock pos={[0, 0, 0]} w={r * 2} h={top} d={r * 1.6} seed={seed} flatTop snow={false} color="#525a6c" />
    <mesh position={[0, top + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[r * 0.55, 7]} /><meshLambertMaterial color={SNOW} /></mesh>
  </group>
);

// ================================================================ the rock shelter
/** the triangles of a geometry split in two groups: 0 = the rest, 1 = facets that face up more than `thr` (normal y): snow lies
 *  on those. Returns a non-indexed copy. */
const splitUp = (src: THREE.BufferGeometry, thr: number) => {
  const g = src.index ? src.toNonIndexed() : src.clone(), p = g.attributes.position as THREE.BufferAttribute, uv = g.attributes.uv as THREE.BufferAttribute | undefined;
  const up: number[] = [], rest: number[] = [], a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) { a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2); const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize(); (n.y > thr ? up : rest).push(i); }
  const P: number[] = [], U: number[] = [];
  for (const i of [...rest, ...up]) for (let k = 0; k < 3; k++) { P.push(p.getX(i + k), p.getY(i + k), p.getZ(i + k)); if (uv) U.push(uv.getX(i + k), uv.getY(i + k)); }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); if (uv) out.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  out.addGroup(0, rest.length * 3, 0); out.addGroup(rest.length * 3, up.length * 3, 1); out.computeVertexNormals(); return out;
};
/** A big mass of rock (a low-poly solid from rockGeo, its foot cut flat, flat-shaded so each facet takes one tone from the light)
 *  with a cliff picture over it for the grain; snow lies on the facets that face up (snow 0..1: deeper snow covers steeper ones).
 *  w x h x d metres. */
export const RockMass: React.FC<{pos: V3; w: number; h: number; d: number; seed?: number; rotY?: number; tilt?: number; color?: string; snow?: number; snowColor?: string; look?: Partial<CliffLook>}> =
  ({pos, w, h, d, seed = 1, rotY = 0, tilt = 0, color = '#ffffff', snow = 1, snowColor = SNOW, look = {}}) => {
    // the threshold is taken on the SCALED shape: a facet's slope depends on how the unit solid is stretched
    const g = useMemo(() => { const u = rockGeo(seed); u.scale(w / 2, h, d / 2); return splitUp(u, 0.72 - 0.22 * snow); }, [seed, w, h, d, snow]);
    const mats = useMemo(() => [new THREE.MeshLambertMaterial({map: cliffTex(`rockmass-${seed}`, 4, 4, {seed: seed * 13, course: [0.2, 0.6], frost: 0.3, ice: 0.2, ...look}, 160), color, flatShading: true}),
      new THREE.MeshLambertMaterial({color: snowColor, flatShading: true})], [seed, color, snowColor]);
    return <group position={pos} rotation={[0, rotY, tilt]}><mesh geometry={g} material={mats} castShadow receiveShadow /></group>;
  };
/** where the shelter's parts are (metres): the back wall's face, its width, the overhang's front edge and its underside */
export const SHELTER = {wallZ: -4.0, x0: -2.5, x1: 2.5, h: 2.6, roofEdge: -2.8, under: 2.1, roofTop: 3.5};
/** THE ROCK SHELTER (hốc đá): a huge slab of rock lying across two standing masses, the way rock shelters are made in the
 *  mountains: the slab's flat underside is the roof (2.1 m up, its front edge at z -2.8); the back wall inside, facing the lens
 *  (x -2.5..2.5, face at z -4.0), is layered rock with snow on its ledges; the two side masses close the niche; more rock above
 *  and behind; snow on every top, drifted along the foot (to z -3.5) and against the sides, a fringe of icicles under the roof.
 *  icicles 0..1 = how long the icicles are; snow 0..1 = how deep the snow lies (1 after a night of storm). */
export const RockShelter: React.FC<{pos?: V3; icicles?: number; snow?: number; seed?: number}> = ({pos = [0, 0, 0], icicles = 1, snow = 1, seed = 1}) => {
  const S = SHELTER, k = 0.6 + 0.4 * snow;
  const ice = useMemo(() => { const r = rnd(seed * 31 + 7); const out: [number, number, number, number][] = []; for (let x = -2.4; x < 2.5; x += 0.08 + r() * 0.18) { const len = (0.05 + r() * r() * 0.42) * icicles; if (len > 0.03) out.push([x, len, 0.012 + r() * 0.018, (r() - 0.5) * 0.08]); } return out; }, [seed, icicles]);
  const look = (sd: number, extra: Partial<CliffLook> = {}): Partial<CliffLook> => ({seed: seed * 10 + sd, ...extra});
  return (
    <group position={pos}>
      {/* the back wall: two courses of layered rock, a little rough, set back from the roof's edge */}
      <CliffBox id={`sh${seed}-w0`} p={[0, 0.62, S.wallZ - 0.6]} s={[5.6, 1.24, 1.2]} rough={0.035} look={look(1, {tones: ['#a8b0be', '#9ba4b4', '#b2b8c4', '#909aaa', '#a4a9b6']})} />
      <CliffBox id={`sh${seed}-w1`} p={[0.05, 1.78, S.wallZ - 0.08 - 0.6]} s={[5.4, 1.1, 1.2]} r={[0, 0, 0.015]} rough={0.035} look={look(2, {tones: ['#a8b0be', '#9ba4b4', '#b2b8c4', '#909aaa', '#a4a9b6']})} />
      {/* the roof: a great slab lying on the two side masses, its flat underside at 2.1 */}
      <RockMass pos={[-0.1, S.under, -4.5]} w={6.6} h={1.05} d={3.5} seed={seed + 3} snow={snow} />
      {/* rock piled behind, highest on the left: the shelter is a corner of the mountain, not a hut */}
      <RockMass pos={[-1.9, 2.7, -6.4]} w={3.6} h={1.6} d={2.8} seed={seed + 5} snow={snow} rotY={0.3} />
      <RockMass pos={[1.9, 2.6, -6.8]} w={2.8} h={1.0} d={2.4} seed={seed + 6} snow={snow} rotY={-0.4} />
      {/* the side masses: tall faceted rocks that close the niche left and right, and lower ones in front of them */}
      <RockMass pos={[-3.25, 0, -4.2]} w={2.0} h={2.45} d={2.6} seed={seed + 7} snow={snow} rotY={0.5} />
      <RockMass pos={[-4.15, 0, -3.3]} w={1.4} h={1.1} d={1.6} seed={seed + 8} snow={snow} rotY={1.1} />
      <RockMass pos={[3.2, 0, -4.2]} w={1.9} h={2.3} d={2.6} seed={seed + 9} snow={snow} rotY={-0.6} />
      <RockMass pos={[4.0, 0, -3.4]} w={1.3} h={0.9} d={1.5} seed={seed + 10} snow={snow} rotY={0.8} />
      {/* snow on the two ledges of the wall and drifted along its foot (leaving room in front: the drift ends at z -3.5) */}
      <SnowDrift pos={[-1.2, 0, -3.78]} w={2.8} d={0.55} h={0.26 * k} seed={seed + 8} />
      <SnowDrift pos={[1.3, 0, -3.8]} w={2.6} d={0.5} h={0.22 * k} seed={seed + 9} />
      <SnowDrift pos={[-2.9, 0, -2.9]} w={1.8} d={1.0} h={0.36 * k} seed={seed + 10} />
      <SnowDrift pos={[3.0, 0, -3.0]} w={1.6} d={0.9} h={0.32 * k} seed={seed + 11} />
      {/* icicles under the roof's front edge */}
      {ice.map(([x, len, r, z], i) => <mesh key={i} position={[x, S.under + 0.02 - len / 2, S.roofEdge - 0.08 + z]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[r, len, 5]} /><meshLambertMaterial color="#d6e6f6" emissive="#6f88a8" emissiveIntensity={0.25} transparent opacity={0.92} /></mesh>)}
    </group>
  );
};

// ================================================================ things in the snow
/** A pine snapped by the wind: a stump with a splintered top and a cap of snow; the broken top lies in the snow beside it with
 *  two dead branches. h = height of the stump. */
export const BrokenPine: React.FC<{pos: V3; h?: number; seed?: number; fallen?: boolean}> = ({pos, h = 1.4, seed = 2, fallen = true}) => {
  const trunk = useMemo(() => { const t = new THREE.CylinderGeometry(0.18 * h, 0.26 * h, h, 9, 3); t.translate(0, h / 2, 0); return t; }, [h]);
  const bark = tex('nt-bark', 256, 512, (c, W, H) => { const q = rnd(4); c.fillStyle = '#5a4434'; c.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 10 + q() * 16) { c.fillStyle = q() < 0.5 ? '#3a2a20' : '#6e5440'; c.fillRect(x, 0, 3 + q() * 6, H); }
    for (let k = 0; k < 60; k++) { c.fillStyle = 'rgba(30,20,14,0.5)'; c.fillRect(q() * W, q() * H, 10 + q() * 30, 3 + q() * 4); }
    for (let k = 0; k < 14; k++) { c.fillStyle = 'rgba(150,160,130,0.3)'; c.beginPath(); c.ellipse(q() * W, H * (0.6 + q() * 0.4), 8 + q() * 14, 5, 0, 0, 7); c.fill(); } });
  const r = rnd(seed), sp = useMemo(() => Array.from({length: 6}, () => [(r() - 0.5) * 0.3, 0.12 + r() * 0.32, (r() - 0.5) * 0.24, (r() - 0.5) * 0.5] as const), [seed]);
  return (
    <group position={pos}>
      <mesh geometry={trunk} castShadow receiveShadow><meshLambertMaterial map={bark} flatShading /></mesh>
      {/* bark ridges: thin darker strips down the trunk */}
      {[0, 1.2, 2.4, 3.6, 4.8].map((a, i) => <mesh key={i} position={[Math.cos(a) * h * 0.185, h * 0.5, Math.sin(a) * h * 0.185]} rotation={[0, -a, 0]}><boxGeometry args={[0.012, h * 0.9, 0.04]} /><meshLambertMaterial color="#2e241c" /></mesh>)}
      {/* splinters at the break, pale inner wood */}
      {sp.map(([x, l, z, a], i) => <mesh key={i} position={[x * h * 0.5, h + l * h * 0.3, z * h * 0.5]} rotation={[0, 0, a]} castShadow><coneGeometry args={[0.035 * h, l * h * 0.6, 4]} /><meshLambertMaterial color={i % 2 ? '#b89a72' : '#8e7454'} /></mesh>)}
      <SnowDrift pos={[0.02 * h, h * 0.98, 0]} w={0.34 * h} d={0.3 * h} h={0.08 * h} seed={seed + 2} />
      <SnowDrift pos={[0, 0, 0.05]} w={0.9 * h} d={0.7 * h} h={0.18 * h} seed={seed + 3} />
      {fallen ? <group position={[0.55 * h, 0.12 * h, 0.25 * h]} rotation={[0.1, -0.5, Math.PI / 2 - 0.12]}>
        <FacetLathe profile={[[0.17, 0], [0.14, 0.6], [0.06, 1.6]]} sides={7} s={h} color="#4a3a2e" wobble={0.08} seed={seed + 5} contact={false} />
        <mesh position={[0.12 * h, 0.7 * h, 0]} rotation={[0, 0, -0.9]} castShadow><boxGeometry args={[0.03 * h, 0.5 * h, 0.03 * h]} /><meshLambertMaterial color="#3a2e24" /></mesh>
        <mesh position={[-0.1 * h, 1.0 * h, 0.05]} rotation={[0, 0, 0.8]} castShadow><boxGeometry args={[0.025 * h, 0.4 * h, 0.025 * h]} /><meshLambertMaterial color="#3a2e24" /></mesh>
      </group> : null}
    </group>
  );
};
/** Dry twigs poking out of the snow (a flat picture: a few dark forked sticks with crumbs of snow on them). */
export const paintTwigs = (seed = 1) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed);
  const stick = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
    const x2 = x + Math.sin(a) * len, y2 = y - Math.cos(a) * len; c.strokeStyle = depth ? '#3a2c22' : '#2a2019'; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
    if (r() < 0.6) { c.fillStyle = 'rgba(236,240,250,0.9)'; c.beginPath(); c.ellipse(x + (x2 - x) * 0.6, y + (y2 - y) * 0.6 - w * 0.4, w * 1.4, w * 0.6, a, 0, 7); c.fill(); }
    if (depth < 2) for (let k = 0; k < 2; k++) { const t = 0.4 + r() * 0.4; stick(x + (x2 - x) * t, y + (y2 - y) * t, a + (r() < 0.5 ? -1 : 1) * (0.4 + r() * 0.5), len * (0.35 + r() * 0.25), w * 0.6, depth + 1); }
  };
  for (let i = 0; i < 4; i++) stick(W * (0.25 + r() * 0.5), H, (r() - 0.5) * 0.9, H * (0.5 + r() * 0.4), W * 0.025, 0);
  c.fillStyle = 'rgba(236,240,250,0.95)'; c.beginPath(); c.ellipse(W / 2, H, W * 0.42, H * 0.08, 0, Math.PI, 0); c.fill();
};
/** Footprints across the snow: pairs of blue-grey hollows along a line of points [x, z] (left, right, left...), each with a
 *  lighter rim on its far side. soft 0..1 = filled in by fresh snow. */
export const Footprints: React.FC<{points: [number, number][]; step?: number; size?: number; soft?: number; seed?: number}> = ({points, step = 0.42, size = 0.12, soft = 0, seed = 1}) => {
  const prints = useMemo(() => {
    const out: [number, number, number, number][] = [], P = points.map(([x, z]) => new THREE.Vector2(x, z)); let side = 1;
    for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], L = a.distanceTo(b), dir = b.clone().sub(a).normalize(), nrm = new THREE.Vector2(-dir.y, dir.x);
      for (let d = 0; d < L; d += step) { const p = a.clone().addScaledVector(dir, d).addScaledVector(nrm, side * 0.1); out.push([p.x, p.y, Math.atan2(dir.x, dir.y), side]); side = -side; } }
    return out;
  }, [JSON.stringify(points), step]);
  const t = useMemo(() => tex(`footprint-${Math.round(soft * 10)}`, 64, 128, (c, W, H) => {
    c.filter = `blur(${2 + soft * 6}px)`; c.fillStyle = `rgba(70,84,120,${0.55 - soft * 0.3})`; c.beginPath(); c.ellipse(W / 2, H * 0.36, W * 0.3, H * 0.22, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(W / 2, H * 0.74, W * 0.24, H * 0.15, 0, 0, 7); c.fill();
    c.fillStyle = `rgba(255,255,255,${0.35 - soft * 0.2})`; c.beginPath(); c.ellipse(W / 2, H * 0.1, W * 0.3, H * 0.06, 0, 0, 7); c.fill();
  }), [soft]);
  return <>{prints.map(([x, z, a], i) => <mesh key={i} position={[x, 0.012 + i * 0.0001, z]} rotation={[-Math.PI / 2, 0, a]} renderOrder={2}><planeGeometry args={[size, size * 2.2]} /><meshBasicMaterial map={t} transparent depthWrite={false} /></mesh>)}</>;
};
/** Wind-rippled snow crust for Ground's map: soft ripples, a few blue hollows, sparkling crystals; tiles every `tile` metres. */
export const snowCrustTex = (seed = 1) => tex(`snow-crust-${seed}`, 512, 512, (c, W, H) => {
  const r = rnd(seed); c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
  const wrap = (fn: (dx: number, dy: number) => void) => { for (const dx of [-W, 0, W]) for (const dy of [-H, 0, H]) fn(dx, dy); };
  for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, len = 120 + r() * 200, a = -0.15 + r() * 0.3, cur = (r() - 0.5) * 40;
    wrap((dx, dy) => { c.lineWidth = 6 + r() * 6; c.strokeStyle = 'rgba(150,165,205,0.16)'; c.beginPath(); c.moveTo(x + dx, y + dy); c.quadraticCurveTo(x + dx + len / 2, y + dy + cur + Math.sin(a) * len / 2, x + dx + len, y + dy + Math.sin(a) * len); c.stroke();
      c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(x + dx, y + dy - 5); c.quadraticCurveTo(x + dx + len / 2, y + dy + cur - 5 + Math.sin(a) * len / 2, x + dx + len, y + dy - 5 + Math.sin(a) * len); c.stroke(); }); }
  for (let i = 0; i < 14; i++) { const x = r() * W, y = r() * H, q = 14 + r() * 30; wrap((dx, dy) => { const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, q); g.addColorStop(0, 'rgba(140,155,200,0.18)'); g.addColorStop(1, 'rgba(140,155,200,0)'); c.fillStyle = g; c.fillRect(x + dx - q, y + dy - q, q * 2, q * 2); }); }
  for (let i = 0; i < 260; i++) { c.fillStyle = r() < 0.7 ? 'rgba(120,135,180,0.18)' : 'rgba(255,255,255,0.9)'; c.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
});

// ================================================================ weather
/** BLIZZARD: snow driven by the wind, drawn as short soft streaks (motion-blurred flakes) in a box round the CURRENT camera (it
 *  follows a Shot's eye). Two layers: near = large, fast, few; far = small, slow, many (fogged with distance). wind > 0 blows
 *  from screen right to left; fall = how fast it comes down; streak = length of a streak per unit of speed; amount 0..2 = how
 *  thick (above 1 the reserve flakes join in: a gust). split = z in front of which flakes draw over the figures (behind it they
 *  draw before them, so a flake behind a person never shows across the face). glint = flakes that twinkle (dawn).
 *  tf = the weather's own clock in frames (default f): to slow the snow down smoothly, pass an integrated clock (sum of the speed). */
export const Blizzard: React.FC<{f: number; eye: V3; n?: number; wind?: number; fall?: number; streak?: number; amount?: number; split?: number; size?: number; color?: string; glint?: number; seed?: number; reach?: [number, number]; height?: number; tf?: number}> =
  ({f, eye: eye0, n = 160, wind = 2.6, fall = 1.2, streak = 0.05, amount = 1, split = -2.4, size = 0.016, color = '#eef2fb', glint = 0, seed = 7, reach = [1.2, 16], height = 6, tf}) => {
    const shot = useContext(ShotCtx), eye = shot ? shot.eye : eye0;
    const P0 = useMemo(() => { const r = rnd(seed); return Array.from({length: n * 2}, () => [r(), r(), r(), r(), r()] as const); }, [seed, n]);
    const t = useMemo(() => tex('blizzard-streak', 64, 16, (c, W, H) => { const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.save(); c.scale(1, H / W); c.fillStyle = g; c.fillRect(0, 0, W, W); c.restore(); }), []);
    const sec = (tf ?? f) / 24, count = Math.round(n * clamp(amount / 2) * 2);
    return <>{P0.slice(0, count).map(([a, b, cz, k, ph], i) => {
      const z = eye[2] - reach[0] - Math.pow(cz, 1.3) * (reach[1] - reach[0]), D = eye[2] - z, near = D < 4.5, sp = (0.6 + k * 0.8) * (near ? 1.5 : 1);
      const half = 0.4435 * D * 1.15 + wind * 0.4, Hh = height + 0.4;
      const x = eye[0] + ((((a * 2 * half - wind * sp * sec) % (2 * half)) + 2 * half) % (2 * half)) - half;
      const y = ((((b * Hh - fall * sp * sec + Math.sin(sec * 2.2 + ph * 6) * 0.08) % Hh) + Hh) % Hh) - 0.2;
      const vx = -wind * sp, vy = -fall * sp, v = Math.hypot(vx, vy), s = size * (near ? 1.1 + k * 0.6 : 0.7 + k * 0.6), len = Math.min(s * 6, Math.max(s * 2.2, v * streak * (near ? 1.4 : 1)));
      const tw = glint > 0 ? 0.55 + 0.45 * Math.sin(f * 0.6 + ph * 40) : 1, op = (near ? 0.85 : 0.75) * tw;
      return <mesh key={i} position={[x, y, z]} rotation={[0, 0, Math.atan2(vy, vx)]} renderOrder={z > split ? 720 : 450}><planeGeometry args={[len, s * 2]} /><meshBasicMaterial map={t} color={color} transparent opacity={op} depthWrite={false} /></mesh>;
    })}</>;
  };
/** Veils of snow blown low over the ground: long soft translucent wisps racing to screen left, in a band in front of the shelter. */
export const SnowVeils: React.FC<{f: number; box: [number, number, number, number]; n?: number; wind?: number; opacity?: number; seed?: number; order?: number}> = ({f, box, n = 7, wind = 3.2, opacity = 0.28, seed = 4, order = 460}) => {  // f may be a weather clock (see Blizzard tf)
  const P0 = useMemo(() => { const r = rnd(seed); return Array.from({length: n}, () => [r(), r(), r(), r()] as const); }, [seed, n]);
  const t = useMemo(() => tex('snow-veil', 256, 64, (c, W, H) => { c.filter = 'blur(9px)'; for (let k = 0; k < 7; k++) { c.fillStyle = `rgba(255,255,255,${0.25 + k * 0.06})`; c.beginPath(); c.ellipse(W * (0.2 + k * 0.1), H * (0.55 - k * 0.02), W * (0.2 - k * 0.012), H * 0.18, 0, 0, 7); c.fill(); } }), []);
  const [x0, x1, z0, z1] = box, Wd = x1 - x0 + 8, sec = f / 24;
  return <>{P0.map(([a, b, c2, k], i) => { const w = 2.5 + k * 3, x = x0 - 4 + ((((a * Wd - wind * (0.7 + k * 0.6) * sec) % Wd) + Wd) % Wd), z = z0 + b * (z1 - z0);
    return <mesh key={i} position={[x, 0.12 + c2 * 0.35, z]} renderOrder={order}><planeGeometry args={[w, w * 0.18]} /><meshBasicMaterial map={t} transparent opacity={opacity * (0.6 + k * 0.4)} depthWrite={false} /></mesh>; })}</>;
};

// ================================================================ the climbers far off
/** a tiny father in a brown cloak leading a tiny boy by the hand, both walking to the left (one picture; no faces) */
const climbersTex = (step: number) => tex(`nui-climbers-${step}`, 128, 128, (c, W, H) => {
  const leg = (x: number, y: number, len: number, a: number, w: number, col: string) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(a) * len, y + Math.cos(a) * len); c.stroke(); };
  const sw = step ? 0.35 : -0.35;
  c.fillStyle = 'rgba(40,50,80,0.25)'; c.beginPath(); c.ellipse(W * 0.5, H - 4, 46, 4, 0, 0, 7); c.fill();
  // the father, on the left (leading), a brown cloak to the shins, bald with grey hair, a sack on his back
  leg(44, 96, 26, sw, 7, '#2a2420'); leg(52, 96, 26, -sw, 7, '#2a2420');
  c.fillStyle = '#6b4a32'; c.beginPath(); c.moveTo(30, 108); c.lineTo(36, 50); c.lineTo(62, 50); c.lineTo(68, 108); c.closePath(); c.fill();
  c.fillStyle = '#553a27'; c.beginPath(); c.moveTo(52, 52); c.lineTo(62, 50); c.lineTo(68, 108); c.lineTo(56, 108); c.closePath(); c.fill();
  c.fillStyle = '#4a3424'; c.fillRect(34, 46, 30, 8);
  c.fillStyle = '#8a7a5a'; c.beginPath(); c.ellipse(66, 64, 9, 13, 0.2, 0, 7); c.fill();
  c.fillStyle = '#c99573'; c.beginPath(); c.arc(48, 34, 14, 0, 7); c.fill(); c.fillStyle = '#b9b4ac'; c.beginPath(); c.arc(48, 40, 13, 0.2, Math.PI - 0.2); c.fill();
  // the joined hands, then the boy on the right (behind), red waistcoat, dark messy hair
  c.strokeStyle = '#6b4a32'; c.lineWidth = 6; c.beginPath(); c.moveTo(62, 62); c.lineTo(78, 76); c.stroke();
  leg(86, 106, 16, -sw, 6, '#3a322a'); leg(93, 106, 16, sw, 6, '#3a322a');
  c.fillStyle = '#e6dcc2'; c.fillRect(80, 76, 20, 30); c.fillStyle = '#7a2a24'; c.fillRect(82, 77, 16, 26);
  c.fillStyle = '#c08a64'; c.beginPath(); c.arc(90, 64, 13, 0, 7); c.fill(); c.fillStyle = '#1f1c22'; c.beginPath(); c.arc(90, 60, 13, Math.PI * 0.9, Math.PI * 2.1); c.fill();
  [[80, 54, -8, -6], [88, 49, 0, -9], [97, 52, 7, -7]].forEach(([x, y, dx, dy]) => { c.beginPath(); c.moveTo(x - 3, y + 2); c.lineTo(x + dx, y + dy); c.lineTo(x + 3, y + 2); c.closePath(); c.fill(); });
});
/** The father and the boy climbing a path on the far slope (d1c4 shot 12): ONE small flat picture (both of them, hand in hand)
 *  moving `speed` metres a frame along `path` (world points, e.g. from onPlate of lib3/kitCamp), starting `start` metres in,
 *  bobbing with the step; h = height of the father. It faces the way the path goes. */
export const PathPair: React.FC<{f: number; path: V3[]; speed?: number; start?: number; h?: number; tint?: string}> = ({f, path, speed = 0.02, start = 0, h = 1.7, tint = '#ffffff'}) => {
  const P = path.map((p) => new THREE.Vector3(...p)), seg = P.slice(1).map((p, i) => p.distanceTo(P[i])), L = seg.reduce((a, b) => a + b, 0);
  let d = Math.min(L, start + f * speed), k = 0; while (k < seg.length - 1 && d > seg[k]) { d -= seg[k]; k++; }
  const p = P[k].clone().lerp(P[k + 1], Math.min(1, d / seg[k])), left = P[k + 1].x < P[k].x, step = Math.floor(f / 5) % 2, bob = Math.abs(Math.sin(f * 0.62)) * h * 0.025, w = h * 1.4 / 1.1;
  return <mesh position={[p.x, p.y + w / 2 * 0.98 + bob, p.z]} scale={[left ? 1 : -1, 1, 1]} renderOrder={1}><planeGeometry args={[w, w]} /><meshBasicMaterial map={climbersTex(step)} color={tint} transparent alphaTest={0.1} depthWrite={false} /></mesh>;
};

// ================================================================ the shadow on the wall
const SIL = new Map<string, THREE.CanvasTexture>();
/** a figure's outline filled with one colour and softened (blur in pixels of a 0.5-scale picture), kept by spec */
const silhouette = (spec: Spec, blur: number) => {
  const key = JSON.stringify(spec) + '|' + blur; let t = SIL.get(key);
  if (!t) { const src = paintFigure(document.createElement('canvas'), spec, 0.5), cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; const c = cv.getContext('2d')!;
    c.filter = `blur(${blur}px)`; c.drawImage(src, 0, 0); c.filter = 'none'; c.globalCompositeOperation = 'source-in'; c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
    t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; SIL.set(key, t); }
  return t;
};
/** A PAINTED SHADOW on a wall (d1c4 shot 21: the boy's shadow on the rock grows and turns into Doctor Doom's). The low sun from
 *  the lens side throws a figure's shadow onto the wall behind it, larger than the figure: this draws it there as a soft dark
 *  shape. from = the figure whose shadow it is; to = what it becomes (optional); mix 0..1 = how far it has become `to` (the two
 *  outlines cross-fade, never a cut); at = [x of the shadow's centre line, y of its feet, z of the wall face]; height = its height
 *  (grows to toHeight as mix goes to 1); color, opacity = how dark (a cool violet, as shadows on snow-lit rock are). */
export const WallShadow: React.FC<{from: Spec; to?: Spec; mix?: number; at: V3; height: number; toHeight?: number; color?: string; opacity?: number; blur?: number; flip?: boolean}> =
  ({from, to, mix = 0, at, height, toHeight, color = '#2a2440', opacity = 0.55, blur = 3, flip}) => {
    const hNow = height + ((toHeight ?? height) - height) * mix;
    const card = (spec: Spec, op: number, k: string) => {
      if (op < 0.01) return null;
      const t = silhouette(spec, blur), u = hNow / (SOLE_Y - HAIR_TOP), w = BOX.w * u, h = BOX.h * u, cx = (BOX.x + BOX.w / 2 - CENTRE_X) * u * (flip ? -1 : 1), cy = (SOLE_Y - (BOX.y + BOX.h / 2)) * u;
      return <mesh key={k} position={[at[0] + cx, at[1] + cy, at[2]]} scale={[flip ? -1 : 1, 1, 1]} renderOrder={6}><planeGeometry args={[w, h]} /><meshBasicMaterial map={t} color={color} transparent opacity={op * opacity} depthWrite={false} /></mesh>;
    };
    return <group>{card(from, to ? 1 - mix : 1, 'a')}{to ? card(to, mix, 'b') : null}</group>;
  };


/** a tiny far-off soldier of the Baron: iron helmet, dark red tunic with a gold mark, a spear on the shoulder; two leg frames */
const soldierTex = (step: number) => tex(`nui-soldier-${step}`, 64, 128, (c, W, H) => {
  const sw = step ? 5 : -5; c.fillStyle = 'rgba(40,50,80,0.25)'; c.beginPath(); c.ellipse(W / 2, H - 3, 16, 3, 0, 0, 7); c.fill();
  c.strokeStyle = '#2a2020'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(W / 2 - 4, H - 32); c.lineTo(W / 2 - 4 + sw, H - 4); c.moveTo(W / 2 + 4, H - 32); c.lineTo(W / 2 + 4 - sw, H - 4); c.stroke();
  c.fillStyle = '#8a1e20'; c.beginPath(); c.moveTo(W / 2 - 13, H - 28); c.lineTo(W / 2 - 10, H - 72); c.lineTo(W / 2 + 10, H - 72); c.lineTo(W / 2 + 13, H - 28); c.fill();
  c.fillStyle = '#e2b843'; c.beginPath(); c.moveTo(W / 2, H - 62); c.lineTo(W / 2 + 5, H - 55); c.lineTo(W / 2, H - 48); c.lineTo(W / 2 - 5, H - 55); c.fill();
  c.fillStyle = '#d0a080'; c.beginPath(); c.arc(W / 2, H - 86, 15, 0, 7); c.fill(); c.fillStyle = '#8a9096'; c.beginPath(); c.arc(W / 2, H - 90, 16, Math.PI, 0); c.fill(); c.fillRect(W / 2 - 18, H - 92, 36, 4);
  c.strokeStyle = '#5a4030'; c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2 + 14, H - 30); c.lineTo(W / 2 + 18, H - 124); c.stroke(); c.fillStyle = '#b8bcc4'; c.beginPath(); c.moveTo(W / 2 + 18, H - 128); c.lineTo(W / 2 + 21, H - 116); c.lineTo(W / 2 + 15, H - 116); c.fill();
});
/** The Baron's soldiers marching up a far path in daylight (d1c4 shot 12 by day, in place of the torches): n tiny flat soldiers
 *  in a file, `gap` metres apart, `speed` metres a frame along `path` (world points, e.g. from onPlate), the lead one `start`
 *  metres in; each bobs with the step and faces the way the path goes. tint darkens them for dusk. */
export const PathSoldiers: React.FC<{f: number; path: V3[]; n?: number; gap?: number; speed?: number; start?: number; h?: number; tint?: string}> = ({f, path, n = 6, gap = 1.3, speed = 0.05, start = 11, h = 1.75, tint = '#ffffff'}) => {
  const P = path.map((p) => new THREE.Vector3(...p)), seg = P.slice(1).map((p, i) => p.distanceTo(P[i])), L = seg.reduce((a, b) => a + b, 0);
  return <>{Array.from({length: n}, (_, i) => {
    let d = start + f * speed - i * gap; if (d < 0 || d > L) return null; let k = 0; while (k < seg.length - 1 && d > seg[k]) { d -= seg[k]; k++; }
    const p = P[k].clone().lerp(P[k + 1], Math.min(1, d / seg[k])), left = P[k + 1].x < P[k].x, step = Math.floor((f + i * 3) / 5) % 2, bob = Math.abs(Math.sin(f * 0.6 + i)) * h * 0.025;
    return <mesh key={i} position={[p.x, p.y + h / 2 + bob, p.z + i * 0.01]} scale={[left ? -1 : 1, 1, 1]} renderOrder={1}><planeGeometry args={[h * 0.5, h]} /><meshBasicMaterial map={soldierTex(step)} color={tint} transparent alphaTest={0.1} depthWrite={false} /></mesh>;
  })}</>;
};
