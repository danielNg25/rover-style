import React, {useMemo} from 'react';
import * as THREE from 'three';
import {FacetLathe} from './look';
import {Tuft} from './nature';
import {NguonBui} from './buiNguon';

/** lib3/detail: RICHNESS, applied by rule to any scene on any subject (LUAT-CUTOUT3D-v3 J48 and the set / floor / props
 *  tallies of the whole reference: thin joints with a few odd blocks 118 shots, wear 66, cracks 45, pinned paper 82,
 *  trims 217, studs 157, floor joints in perspective 194, floor debris 57, tufts 72, rocks 75; props per view: median 14
 *  of about 6 kinds). Nothing here is tied to one place. */
type V3 = [number, number, number];
const rnd = (seed: number) => { let s = seed * 9301 + 49297; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

export type SurfaceKind = 'brick' | 'stone' | 'slabs' | 'plank' | 'plaster';
/** A surface drawn once into a texture: a near-white base (the material colour tints it), thin joints, about one block
 *  in six a little lighter or darker, plus wear: soft stains running down, round spots, one crack. wear 0-1. */
export const useSurface = (kind: SurfaceKind, seed = 1) => useMemo(() => {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d')!, r = rnd(seed);
  x.fillStyle = '#ececec'; x.fillRect(0, 0, S, S);
  const cell = (cw: number, ch: number, stagger: boolean) => {
    for (let j = 0, row = 0; j < S; j += ch, row++) for (let i = stagger && row % 2 ? -cw / 2 : 0; i < S; i += cw) {
      const q = r(); x.fillStyle = q < 0.08 ? '#fbfbfb' : q < 0.17 ? '#dcdcdc' : q < 0.22 ? '#d2d2d2' : '#ececec'; x.fillRect(i, j, cw, ch);
    }
    x.strokeStyle = 'rgba(70,70,80,0.45)'; x.lineWidth = 3;
    for (let j = 0, row = 0; j <= S; j += ch, row++) { x.beginPath(); x.moveTo(0, j); x.lineTo(S, j); x.stroke(); for (let i = stagger && row % 2 ? -cw / 2 : 0; i <= S; i += cw) { x.beginPath(); x.moveTo(i, j); x.lineTo(i, j + ch); x.stroke(); } }
  };
  if (kind === 'brick') cell(128, 64, true); else if (kind === 'stone') cell(256, 128, true); else if (kind === 'slabs') cell(512, 512, false);
  else if (kind === 'plank') { cell(1024, 128, false); x.strokeStyle = 'rgba(70,70,80,0.18)'; x.lineWidth = 2; for (let k = 0; k < 40; k++) { const y = r() * S, x0 = r() * S; x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + 60 + r() * 200, y + (r() - 0.5) * 6); x.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}, [kind, seed]);

/** Wear as ONE picture stretched over the whole surface (it must never repeat with the tiles): soft stains running down
 *  from the top, lighter and darker patches, a crack or two. vertical = a wall (stains run down); otherwise a floor. */
export const useWear = (seed = 1, amount = 0.6, vertical = true) => useMemo(() => {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d')!, r = rnd(seed + 11);
  for (let k = 0; k < Math.round(12 * amount); k++) { const px = r() * S, py = r() * S, rad = 60 + r() * 170; const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, r() < 0.45 ? 'rgba(255,255,255,0.10)' : 'rgba(30,30,45,0.13)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
  if (vertical) for (let k = 0; k < Math.round(9 * amount); k++) { const sx = r() * S, w = 10 + r() * 26, h = 90 + r() * 260; const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(30,30,45,0.2)'); g.addColorStop(1, 'rgba(30,30,45,0)'); x.fillStyle = g; x.fillRect(sx, 0, w, h); }
  for (let k = 0; k < Math.round(2 * amount + 0.5); k++) { x.strokeStyle = 'rgba(30,30,40,0.5)'; x.lineWidth = 2; x.beginPath(); let cx = r() * S, cy = r() * S * 0.5; x.moveTo(cx, cy); for (let j = 0; j < 6; j++) { cx += (r() - 0.5) * 60; cy += 24 + r() * 40; x.lineTo(cx, cy); } x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}, [seed, amount, vertical]);

/** A wall of any material: the surface texture, a darker plinth at the foot, a lighter cap on top, the soft shade where
 *  it meets the ground, and room for pinned things (children are placed in wall units: x right, y up, origin at the
 *  foot centre, z = just in front of the wall). tile = world size of one texture repeat. */
export const Wall: React.FC<{pos?: V3; w: number; h: number; color: string; kind?: SurfaceKind; tile?: number; seed?: number; rotY?: number; trim?: string; children?: React.ReactNode}> =
  ({pos = [0, 0, 0], w, h, color, kind = 'brick', tile = 2.2, seed = 1, rotY = 0, trim, children}) => {
    const wear = useWear(seed);
    const map = useSurface(kind, seed); const m = useMemo(() => { const t = map.clone(); t.needsUpdate = true; t.repeat.set(w / tile, h / tile); return t; }, [map, w, h, tile]);
    const c = new THREE.Color(color), dark = '#' + c.clone().multiplyScalar(0.72).getHexString(), light = trim ?? '#' + c.clone().lerp(new THREE.Color('#ffffff'), 0.35).getHexString();
    return (
      <group position={pos} rotation={[0, rotY, 0]}>
        <mesh position={[0, h / 2, 0]} receiveShadow><planeGeometry args={[w, h]} /><meshLambertMaterial color={color} map={m} /></mesh>
        <mesh position={[0, h / 2, 0.004]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={wear} transparent depthWrite={false} /></mesh>
        <mesh position={[0, 0.16, 0.05]} receiveShadow castShadow><boxGeometry args={[w, 0.32, 0.1]} /><meshLambertMaterial color={dark} /></mesh>
        <mesh position={[0, h + 0.07, 0.03]} castShadow><boxGeometry args={[w + 0.1, 0.14, 0.24]} /><meshLambertMaterial color={light} /></mesh>
        <mesh position={[0, 0.02, 0.35]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[w, 0.7]} /><meshBasicMaterial color="#141828" transparent opacity={0.16} depthWrite={false} /></mesh>
        <group position={[0, 0, 0.012]}>{children}</group>
      </group>
    );
  };

/** Pinned paper (poster, notice, map): a sheet a few degrees off level with a second sheet peeking behind, a pin, and
 *  bars instead of words (reference: fake text as bars in 58 shots). x, y = centre on the wall. */
export const Paper: React.FC<{x: number; y: number; w?: number; h?: number; rot?: number; tone?: string; accent?: string; seed?: number}> = ({x, y, w = 0.5, h = 0.66, rot = -3, tone = '#efe6cf', accent = '#b9463c', seed = 1}) => {
  const r = rnd(seed), lines = Array.from({length: 5}, (_, i) => [0.5 + r() * 0.35, i] as const);
  return (
    <group position={[x, y, 0]} rotation={[0, 0, (rot * Math.PI) / 180]}>
      <mesh position={[0.03, -0.02, 0]} rotation={[0, 0, 0.09]}><planeGeometry args={[w, h]} /><meshLambertMaterial color="#d8cfb6" /></mesh>
      <mesh position={[0, 0, 0.004]}><planeGeometry args={[w, h]} /><meshLambertMaterial color={tone} /></mesh>
      <mesh position={[0, h * 0.26, 0.008]}><planeGeometry args={[w * 0.7, h * 0.22]} /><meshLambertMaterial color={accent} /></mesh>
      {lines.map(([k, i]) => <mesh key={i} position={[-(w * (0.8 - k)) / 2 + 0, h * (0.04 - i * 0.085), 0.008]}><planeGeometry args={[w * k, h * 0.035]} /><meshLambertMaterial color="#6f6a60" /></mesh>)}
      <mesh position={[0, h * 0.44, 0.012]}><circleGeometry args={[0.022, 10]} /><meshLambertMaterial color="#c8372d" /></mesh>
    </group>
  );
};

/** A row of studs or rivets around a turned solid at height y and radius r (reference: studs and bolts in 157 shots). */
export const Studs: React.FC<{pos?: V3; r: number; y: number; n?: number; size?: number; color?: string; squash?: number}> = ({pos = [0, 0, 0], r, y, n = 10, size = 0.022, color = '#d8c27a', squash = 1}) => (
  <group position={pos}>{Array.from({length: n}, (_, i) => { const a = (i / n) * Math.PI * 2 + 0.26 + Math.PI / n; return <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r * squash]}><sphereGeometry args={[size, 6, 5]} /><meshLambertMaterial color={color} /></mesh>; })}</group>
);

/** Ground dressing by kind of place, scattered by rule over an area (so no scene ships with a bare floor):
 *  'street'  pebbles, cracks, a few leaves and paper scraps, a drain cover, a puddle
 *  'meadow'  grass tufts, flowers dots, stones
 *  'snow'    dry tufts, small snow-capped stones, footprint ovals
 *  'floor'   scuffs and a few scraps
 *  area = [width, depth] centred on pos; keep = positions [x, z, radius] to leave clear (where characters and props stand). */
export const Scatter: React.FC<{kind: 'street' | 'meadow' | 'snow' | 'floor'; pos?: V3; area: [number, number]; seed?: number; density?: number; keep?: [number, number, number][]}> =
  ({kind, pos = [0, 0, 0], area, seed = 1, density = 1, keep = []}) => {
    const items = useMemo(() => {
      const r = rnd(seed), out: React.ReactNode[] = [];
      const spot = (): [number, number] | null => { for (let t = 0; t < 12; t++) { const x = (r() - 0.5) * area[0], z = (r() - 0.5) * area[1]; if (!keep.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr)) return [x, z]; } return null; };
      const n = (k: number) => Math.round(k * density);
      const stone = (i: number, col: string, cap?: string) => { const p = spot(); if (!p) return; const s = 0.06 + r() * 0.1; out.push(<group key={'s' + i} position={[p[0], 0, p[1]]}><FacetLathe profile={[[0.6, 0], [0.75, 0.3], [0.5, 0.62]]} sides={6} s={s} color={col} wobble={0.2} seed={i + seed} contact />{cap ? <FacetLathe profile={[[0.52, 0.6], [0.36, 0.78]]} sides={6} s={s} color={cap} seed={i} contact={false} /> : null}</group>); };
      const flatMark = (i: number, w: number, d: number, col: string, op: number, rot = r() * 3) => { const p = spot(); if (!p) return; out.push(<mesh key={'m' + i + col} position={[p[0], 0.004 + i * 0.0002, p[1]]} rotation={[-Math.PI / 2, 0, rot]} scale={[w, d, 1]} renderOrder={1}><circleGeometry args={[1, 14]} /><meshBasicMaterial color={col} transparent opacity={op} depthWrite={false} /></mesh>); };
      const crack = (i: number) => { const p = spot(); if (!p) return; const pts: THREE.Vector3[] = []; let x = 0, z = 0; for (let k = 0; k < 6; k++) { pts.push(new THREE.Vector3(x, 0.005, z)); x += 0.12 + r() * 0.2; z += (r() - 0.5) * 0.3; } out.push(<group key={'c' + i} position={[p[0], 0, p[1]]} rotation={[0, r() * 6, 0]}>{pts.slice(1).map((b, k) => { const a = pts[k], mid = a.clone().add(b).multiplyScalar(0.5), len = a.distanceTo(b), ang = Math.atan2(b.z - a.z, b.x - a.x); return <mesh key={k} position={mid} rotation={[-Math.PI / 2, 0, -ang]}><planeGeometry args={[len, 0.014]} /><meshBasicMaterial color="#2a2a30" transparent opacity={0.5} /></mesh>; })}</group>); };
      const scrap = (i: number, col: string) => { const p = spot(); if (!p) return; out.push(<mesh key={'p' + i} position={[p[0], 0.008, p[1]]} rotation={[-Math.PI / 2 + (r() - 0.5) * 0.3, 0, r() * 6]}><planeGeometry args={[0.1 + r() * 0.08, 0.07 + r() * 0.06]} /><meshLambertMaterial color={col} side={THREE.DoubleSide} /></mesh>); };
      const tuft = (i: number, col: string) => { const p = spot(); if (!p) return; out.push(<Tuft key={'t' + i} pos={[p[0], 0.005, p[1]]} s={0.14 + r() * 0.16} color={col} seed={i + seed} bui={false} />); };
      if (kind === 'street') { for (let i = 0; i < n(9); i++) stone(i, '#7d7b78'); for (let i = 0; i < n(5); i++) crack(i); for (let i = 0; i < n(6); i++) scrap(i, ['#e9e2cf', '#b88a4a', '#9a6a3a'][i % 3]); for (let i = 0; i < n(2); i++) flatMark(i, 0.5 + r() * 0.3, 0.22 + r() * 0.1, '#dfe6ee', 0.35); for (let i = 0; i < n(4); i++) tuft(i, '#6f8a52'); }
      // đồng cỏ: một nguồn 'hat-co' cho cả vùng (lib3/buiNguon), thay cho từng bụi cỏ
      if (kind === 'meadow') { out.push(<NguonBui key="bui" kieu="hat-co" r={area[0] / 2} w={area[1] / 2} h={0.5} k={density} mau="#f4efdc" bang={['#f4efdc', '#ece4c8']} />); for (let i = 0; i < n(16); i++) tuft(i, '#5f8a4a'); for (let i = 0; i < n(6); i++) stone(i, '#8a8c88'); for (let i = 0; i < n(10); i++) flatMark(i, 0.03, 0.03, ['#f4e27a', '#f2f2f2', '#e88aa0'][i % 3], 1); }
      if (kind === 'snow') { for (let i = 0; i < n(9); i++) tuft(i, '#84775a'); for (let i = 0; i < n(7); i++) stone(i, '#62677f', '#d9deea'); for (let i = 0; i < n(10); i++) flatMark(i, 0.09, 0.05, '#8f97ad', 0.4); }
      if (kind === 'floor') { for (let i = 0; i < n(6); i++) flatMark(i, 0.3 + r() * 0.3, 0.1, '#2a2a30', 0.1); for (let i = 0; i < n(4); i++) scrap(i, '#e9e2cf'); }
      return out;
    }, [kind, seed, density, area[0], area[1], JSON.stringify(keep)]);
    return <group position={pos}>{items}</group>;
  };

/** A sign board that belongs to the set (reference: real words in bold serif capitals, always part of the set, 69 shots).
 *  x, y = centre on its wall; w, h in world units. */
export const Sign: React.FC<{text: string; x: number; y: number; w: number; h: number; board?: string; ink?: string; z?: number}> = ({text, x, y, w, h, board = '#24402f', ink = '#e7c96a', z = 0.06}) => {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round((1024 * h) / w); const g = c.getContext('2d')!;
    g.fillStyle = board; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = ink; g.lineWidth = 8; g.strokeRect(22, 22, c.width - 44, c.height - 44);
    g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${Math.round(c.height * 0.5)}px Georgia, "Times New Roman", serif`; g.fillText(text.toUpperCase(), c.width / 2, c.height / 2 + 6, c.width - 120);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }, [text, w, h, board, ink]);
  return (
    <group position={[x, y, z]}>
      <mesh castShadow><boxGeometry args={[w, h, 0.1]} /><meshLambertMaterial color={board} /></mesh>
      <mesh position={[0, 0, 0.052]}><planeGeometry args={[w, h]} /><meshLambertMaterial map={tex} /></mesh>
    </group>
  );
};

/** A striped awning with a scalloped front edge, hung on a wall at (x, y). */
export const Awning: React.FC<{x: number; y: number; w: number; depth?: number; drop?: number; a?: string; b?: string}> = ({x, y, w, depth = 0.9, drop = 0.45, a = '#c8463c', b = '#f1ead8'}) => {
  const n = Math.max(4, Math.round(w / 0.35)), sw = w / n, ang = Math.atan2(drop, depth), len = Math.hypot(drop, depth);
  return (
    <group position={[x, y, 0]}>
      {Array.from({length: n}, (_, i) => (
        <group key={i} position={[-w / 2 + sw * (i + 0.5), 0, 0]}>
          <mesh position={[0, -drop / 2, depth / 2]} rotation={[ang, 0, 0]} castShadow><boxGeometry args={[sw, 0.03, len]} /><meshLambertMaterial color={i % 2 ? a : b} /></mesh>
          <mesh position={[0, -drop - 0.07, depth]}><circleGeometry args={[sw / 2, 12, Math.PI, Math.PI]} /><meshLambertMaterial color={i % 2 ? a : b} side={THREE.DoubleSide} /></mesh>
        </group>
      ))}
    </group>
  );
};
