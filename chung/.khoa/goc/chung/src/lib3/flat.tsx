import React, {useMemo, useContext} from 'react';
import {GradeCtx, PIC_FIT, ContactShade} from './look';
import * as THREE from 'three';
import {useTextures} from '../three/ImageRig';

/** lib3/flat: THE FORM RULE (owner, 2026-11-21; checked on reference shots 68 and 139).
 *   - Built things with straight edges are 3D boxes: houses, walls, stalls, tables, chairs, crates, steps.
 *   - Organic, round or small things are FLAT 2D drawings that face the camera: food, fruit, flowers, tree crowns,
 *     bushes, things laid out on a table. Two or three flat tones, a hand-drawn highlight stroke, no outline.
 *   - No 3D spheres. Turned solids (lib3/look FacetLathe) are for rocks, columns, lamp posts and barrels only.
 *  Everything here is drawn once on a canvas and shown on a card, so any new subject gets its small things the same way. */
type V3 = [number, number, number];
type Ctx = CanvasRenderingContext2D;
const rnd = (seed: number) => { let s = seed * 9301 + 49297; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
const shade = (hex: string, k: number) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
const tint = (hex: string, k: number) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), k).getHexString();

/** A flat drawing on a card. draw(ctx, W, H) paints into a W x H canvas (y down); w, h = size in the world; pos = the
 *  middle of its bottom edge. It casts a soft shadow through its own outline. */
export const Card2D: React.FC<{draw: (c: Ctx, W: number, H: number) => void; w: number; h: number; pos?: V3; res?: number; cast?: boolean; deps?: unknown[]}> = ({draw, w, h, pos = [0, 0, 0], res = 256, cast = true, deps = []}) => {
  const tex = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = Math.round(res * Math.max(1, w / h)); cv.height = Math.round(res * Math.max(1, h / w)); const c = cv.getContext('2d')!;
    draw(c, cv.width, cv.height); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }, [w, h, res, ...deps]);
  return <mesh position={[pos[0], pos[1] + h / 2, pos[2]]} castShadow={cast}><planeGeometry args={[w, h]} /><meshLambertMaterial map={tex} transparent alphaTest={0.5} side={THREE.DoubleSide} /></mesh>;
};

/** Foliage: overlapping flat circles in three greens (dark mass, mid lobes, a few light discs), as tree crowns, bushes,
 *  hedges and clipped topiary are drawn in the reference. shape 'crown' is round, 'column' is a tall stack. */
export const Foliage: React.FC<{pos?: V3; w: number; h: number; color?: string; shape?: 'crown' | 'column'; seed?: number}> = ({pos, w, h, color = '#3f7a45', shape = 'crown', seed = 1}) => (
  <Card2D pos={pos} w={w} h={h} res={320} deps={[color, shape, seed]} draw={(c, W, H) => {
    const r = rnd(seed), disc = (x: number, y: number, rad: number, col: string) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); };
    const n = shape === 'crown' ? 11 : 8;
    for (let i = 0; i < n; i++) { const t = i / (n - 1), x = shape === 'crown' ? W * (0.5 + Math.cos(i * 2.4) * 0.27) : W * (0.5 + (r() - 0.5) * 0.3), y = shape === 'crown' ? H * (0.5 + Math.sin(i * 2.4) * 0.24) : H * (0.12 + t * 0.76); disc(x, y, Math.min(W, H) * (shape === 'crown' ? 0.26 : 0.2 + (shape === 'column' ? t * 0.14 : 0)), shade(color, 0.86)); }
    disc(W / 2, H / 2, Math.min(W, H) * (shape === 'crown' ? 0.36 : 0.2), shade(color, 0.86));
    for (let i = 0; i < 5; i++) disc(W * (0.3 + r() * 0.4), H * (0.2 + r() * 0.5), Math.min(W, H) * (0.1 + r() * 0.08), color);
    for (let i = 0; i < 3; i++) disc(W * (0.3 + r() * 0.35), H * (0.2 + r() * 0.4), Math.min(W, H) * (0.05 + r() * 0.04), tint(color, 0.18));
  }} />
);

export type Ware = 'loaf' | 'roundLoaf' | 'buns' | 'grapes' | 'jug' | 'pumpkin' | 'cheese' | 'apples' | 'flowers' | 'bottle' | 'jar' | 'cake';
/** One flat drawing of a small thing. kind picks the picture, color its main tone. Sizes are in canvas fractions. */
const WARES: Record<Ware, (c: Ctx, W: number, H: number, col: string, r: () => number) => void> = {
  loaf: (c, W, H, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(W * 0.04, H * 0.3, W * 0.92, H * 0.7, [H * 0.5, H * 0.5, H * 0.1, H * 0.1]); c.fill(); c.fillStyle = shade(col, 0.82); c.fillRect(W * 0.04, H * 0.86, W * 0.92, H * 0.14); c.strokeStyle = tint(col, 0.45); c.lineWidth = H * 0.07; c.lineCap = 'round'; [0.3, 0.5, 0.7].forEach((x) => { c.beginPath(); c.moveTo(W * (x - 0.05), H * 0.62); c.lineTo(W * (x + 0.05), H * 0.44); c.stroke(); }); },
  roundLoaf: (c, W, H, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(W / 2, H * 0.62, W * 0.46, H * 0.38, 0, 0, 7); c.fill(); c.strokeStyle = shade(col, 0.75); c.lineWidth = H * 0.05; c.lineCap = 'round'; [0.38, 0.5, 0.62].forEach((x) => { c.beginPath(); c.moveTo(W * x, H * 0.4); c.lineTo(W * x, H * 0.62); c.stroke(); }); },
  buns: (c, W, H, col) => { [0.2, 0.5, 0.8].forEach((x) => { c.fillStyle = col; c.beginPath(); c.ellipse(W * x, H * 0.62, W * 0.16, H * 0.36, 0, 0, 7); c.fill(); c.fillStyle = shade(col, 0.8); c.fillRect(W * (x - 0.1), H * 0.56, W * 0.2, H * 0.07); }); },
  grapes: (c, W, H, col) => { const rows = [4, 5, 4, 3, 2]; rows.forEach((n, j) => { for (let i = 0; i < n; i++) { c.fillStyle = (i + j) % 3 ? col : tint(col, 0.14); c.beginPath(); c.arc(W * (0.5 + (i - (n - 1) / 2) * 0.17), H * (0.26 + j * 0.15), W * 0.1, 0, 7); c.fill(); } }); c.strokeStyle = '#6a4a2a'; c.lineWidth = W * 0.035; c.beginPath(); c.moveTo(W * 0.5, H * 0.18); c.lineTo(W * 0.62, H * 0.02); c.stroke(); },
  jug: (c, W, H, col) => { c.strokeStyle = col; c.lineWidth = W * 0.09; c.beginPath(); c.arc(W * 0.24, H * 0.5, W * 0.18, 1.2, 5.1); c.stroke(); c.fillStyle = col; c.beginPath(); c.moveTo(W * 0.34, H * 0.05); c.lineTo(W * 0.74, H * 0.05); c.lineTo(W * 0.66, H * 0.3); c.quadraticCurveTo(W * 0.96, H * 0.7, W * 0.84, H); c.lineTo(W * 0.28, H); c.quadraticCurveTo(W * 0.14, H * 0.7, W * 0.42, H * 0.3); c.closePath(); c.fill(); c.fillStyle = tint(col, 0.35); c.fillRect(W * 0.58, H * 0.5, W * 0.05, H * 0.34); },
  pumpkin: (c, W, H, col) => { [[0.3, 0.3], [0.7, 0.3], [0.5, 0.36]].forEach(([x, rx], i) => { c.fillStyle = i === 2 ? col : shade(col, 0.88); c.beginPath(); c.ellipse(W * x, H * 0.6, W * rx, H * 0.38, 0, 0, 7); c.fill(); }); c.fillStyle = '#5a7a3a'; c.fillRect(W * 0.46, H * 0.08, W * 0.08, H * 0.2); },
  cheese: (c, W, H, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(W * 0.04, H); c.lineTo(W * 0.04, H * 0.5); c.lineTo(W * 0.96, H * 0.2); c.lineTo(W * 0.96, H); c.closePath(); c.fill(); c.fillStyle = shade(col, 0.82); [[0.3, 0.74, 0.07], [0.6, 0.6, 0.09], [0.78, 0.84, 0.05]].forEach(([x, y, q]) => { c.beginPath(); c.arc(W * x, H * y, W * q, 0, 7); c.fill(); }); },
  apples: (c, W, H, col, r) => { c.fillStyle = '#9a6a3a'; c.beginPath(); c.moveTo(W * 0.08, H * 0.62); c.lineTo(W * 0.92, H * 0.62); c.lineTo(W * 0.78, H); c.lineTo(W * 0.22, H); c.closePath(); c.fill(); [[0.3, 0.5], [0.5, 0.46], [0.7, 0.5], [0.4, 0.3], [0.6, 0.3], [0.5, 0.14]].forEach(([x, y], i) => { c.fillStyle = i % 3 === 1 ? '#8fb84a' : col; c.beginPath(); c.arc(W * x, H * y, W * 0.12, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.arc(W * (x - 0.04), H * (y - 0.05), W * 0.03, 0, 7); c.fill(); }); void r; },
  flowers: (c, W, H, col) => { c.strokeStyle = '#4f7f4a'; c.lineWidth = W * 0.03; [[0.3, 0.3], [0.5, 0.16], [0.7, 0.32], [0.42, 0.44]].forEach(([x, y], i) => { c.beginPath(); c.moveTo(W * 0.5, H * 0.74); c.lineTo(W * x, H * y); c.stroke(); const pc = [col, '#f2c84a', '#f2f2f2', '#e88aa0'][i]; for (let k = 0; k < 6; k++) { c.fillStyle = pc; c.beginPath(); c.arc(W * x + Math.cos(k * 1.05) * W * 0.07, H * y + Math.sin(k * 1.05) * W * 0.07, W * 0.055, 0, 7); c.fill(); } c.fillStyle = '#e7a23a'; c.beginPath(); c.arc(W * x, H * y, W * 0.04, 0, 7); c.fill(); }); c.fillStyle = '#b9a184'; c.beginPath(); c.moveTo(W * 0.3, H * 0.7); c.lineTo(W * 0.7, H * 0.7); c.lineTo(W * 0.62, H); c.lineTo(W * 0.38, H); c.closePath(); c.fill(); },
  bottle: (c, W, H, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(W * 0.2, H * 0.36, W * 0.6, H * 0.64, W * 0.14); c.fill(); c.fillRect(W * 0.38, H * 0.06, W * 0.24, H * 0.34); c.fillStyle = '#7a5a3a'; c.fillRect(W * 0.36, 0, W * 0.28, H * 0.09); c.fillStyle = tint(col, 0.4); c.fillRect(W * 0.3, H * 0.46, W * 0.09, H * 0.38); },
  jar: (c, W, H, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(W * 0.1, H * 0.2, W * 0.8, H * 0.8, W * 0.16); c.fill(); c.fillStyle = '#e9dfc6'; c.fillRect(W * 0.06, H * 0.04, W * 0.88, H * 0.2); c.fillStyle = tint(col, 0.5); c.fillRect(W * 0.26, H * 0.5, W * 0.48, H * 0.26); },
  cake: (c, W, H, col) => { c.fillStyle = '#f1ead8'; c.fillRect(W * 0.08, H * 0.4, W * 0.84, H * 0.6); c.fillStyle = col; c.beginPath(); c.roundRect(W * 0.04, H * 0.26, W * 0.92, H * 0.24, H * 0.1); c.fill(); for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(W * (0.14 + i * 0.18), H * 0.5, W * 0.07, 0, 7); c.fill(); } c.fillStyle = '#c8372d'; c.beginPath(); c.arc(W * 0.5, H * 0.16, W * 0.08, 0, 7); c.fill(); },
};
export const Ware2D: React.FC<{kind: Ware; pos?: V3; w: number; h?: number; color?: string; seed?: number}> = ({kind, pos, w, h, color = '#c98a4a', seed = 1}) => {
  const hh = h ?? w * ({loaf: 0.5, roundLoaf: 0.62, buns: 0.4, grapes: 1.0, jug: 1.15, pumpkin: 0.8, cheese: 0.6, apples: 0.9, flowers: 1.5, bottle: 2.2, jar: 1.2, cake: 0.8} as Record<Ware, number>)[kind];
  return <Card2D pos={pos} w={w} h={hh} deps={[kind, color, seed]} draw={(c, W, H) => WARES[kind](c, W, H, color, rnd(seed))} />;
};

/** A row of wares laid out along a counter by rule: kinds cycle, sizes vary a little, neighbours overlap slightly so the
 *  display reads as full. from / to = the two ends of the row on the counter top. */
export const WareRow: React.FC<{from: V3; to: V3; kinds: Ware[]; colors?: Partial<Record<Ware, string>>; size?: number; seed?: number}> = ({from, to, kinds, colors = {}, size = 0.34, seed = 1}) => {
  const r = rnd(seed), len = Math.hypot(to[0] - from[0], to[2] - from[2]), n = Math.max(2, Math.round(len / (size * 0.95)));
  const DEF: Record<Ware, string> = {loaf: '#c98a4a', roundLoaf: '#d09a58', buns: '#d9a860', grapes: '#7a4a8a', jug: '#3f6a8a', pumpkin: '#e08a34', cheese: '#f0c84a', apples: '#c8372d', flowers: '#e0566a', bottle: '#4f8a6a', jar: '#b9523c', cake: '#e88aa0'};
  return <group>{Array.from({length: n}, (_, i) => { const t = (i + 0.5) / n, k = kinds[i % kinds.length]; return <Ware2D key={i} kind={k} w={size * (0.85 + r() * 0.4)} color={colors[k] ?? DEF[k]} seed={seed + i} pos={[from[0] + (to[0] - from[0]) * t, from[1], from[2] + (to[2] - from[2]) * t + (i % 2) * 0.05]} />; })}</group>;
};

/** A GENERATED 2D picture on a card (owner's reading of the reference, 2026-11-21: large simple things are 3D boxes for
 *  depth; small, detailed, complex things are generated 2D pictures, which look better and cost less than modelling).
 *  src = a cut-out PNG under public/ made with ./gen.sh (style reference: a reference crop) and tools/art/cut.py.
 *  w = width in the world (height follows the picture); pos = middle of its bottom edge. */
/** chinh (26/11/2026, phiếu P1126-09): chỉnh NHẸ màu riêng của một tấm ảnh, đặt chồng lên phép khớp theo cảnh (PIC_FIT) ở dưới.
 *  sat = độ rực (0,5–1,3), lum = độ sáng (0,6–1,2), tint + amount = phủ một màu (amount 0–0,4). Số ngoài khoảng bị kẹp lại; không đổi
 *  được sắc màu của ảnh. Không truyền thì vẽ như trước. Đây là đường HỢP LỆ để chỉnh màu một ảnh: không tự viết tấm ảnh, không lọc màu. */
export type ChinhMau = {sat?: number; lum?: number; tint?: string; amount?: number};
const kepMau = (v: number | undefined, md: number, a: number, b: number) => Math.min(b, Math.max(a, v ?? md));
export const Pic2D: React.FC<{src: string; w: number; pos?: V3; cast?: boolean; flip?: boolean; contact?: boolean; chinh?: ChinhMau}> = ({src, w, pos = [0, 0, 0], cast = true, flip, contact = true, chinh}) => {
  const tex = useTextures([src]), grade = useContext(GradeCtx);
  const cSat = kepMau(chinh?.sat, 1, 0.5, 1.3), cLum = kepMau(chinh?.lum, 1, 0.6, 1.2), cAm = kepMau(chinh?.amount, 0, 0, 0.4), cTint = chinh?.tint;
  // fitted to the scene: the picture is redrawn with the scene's saturation, brightness and cast (look.tsx PIC_FIT), so a
  // generated picture takes the colours of the place it stands in; the scene light then shades the card as a whole
  const fitted = useMemo(() => {
    if (!tex) return null;
    const img = tex[src].image as HTMLImageElement, f = PIC_FIT[grade], cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const c = cv.getContext('2d')!;
    c.filter = `saturate(${f.sat * cSat}) brightness(${f.lum * cLum})`; c.drawImage(img, 0, 0); c.filter = 'none';
    c.globalCompositeOperation = 'source-atop'; c.globalAlpha = f.amount; c.fillStyle = f.tint; c.fillRect(0, 0, cv.width, cv.height);
    if (cTint && cAm > 0) { c.globalAlpha = cAm; c.fillStyle = cTint; c.fillRect(0, 0, cv.width, cv.height); }   // màu riêng của món, phủ nhẹ
    // a soft darker foot, as if the thing stood on the surface
    c.globalAlpha = 1; const g = c.createLinearGradient(0, cv.height * 0.8, 0, cv.height); g.addColorStop(0, 'rgba(40,30,30,0)'); g.addColorStop(1, 'rgba(40,30,30,0.22)'); c.fillStyle = g; c.fillRect(0, cv.height * 0.8, cv.width, cv.height * 0.2);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return {t, ar: img.height / img.width};
  }, [tex, src, grade, cSat, cLum, cAm, cTint]);
  if (!fitted) return null;
  const h = w * fitted.ar;
  return (
    <group position={pos}>
      <mesh position={[0, h / 2, 0]} scale={[flip ? -1 : 1, 1, 1]} castShadow={cast} receiveShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={fitted.t} transparent alphaTest={0.5} side={THREE.DoubleSide} /></mesh>
      {contact ? <group scale={[1, 1, 0.4]}><ContactShade r={w * 0.5} strength={0.3} /></group> : null}
    </group>
  );
};
/** A row of generated pictures along a counter: files cycle, widths as given (world units), neighbours overlap a little. */
export const PicRow: React.FC<{from: V3; to: V3; items: [string, number][]; seed?: number}> = ({from, to, items, seed = 1}) => {
  const r = rnd(seed), total = items.reduce((a, [, w]) => a + w * 0.9, 0), len = Math.hypot(to[0] - from[0], to[2] - from[2]), reps = Math.max(1, Math.round(len / total)), list = Array.from({length: reps * items.length}, (_, i) => items[i % items.length]);
  let x = 0; const sum = list.reduce((a, [, w]) => a + w * 0.9, 0);
  return <group>{list.map(([src, w], i) => { const t = (x + w * 0.45) / sum; x += w * 0.9; return <Pic2D key={i} src={src} w={w * (0.92 + r() * 0.16)} pos={[from[0] + (to[0] - from[0]) * t, from[1], from[2] + (to[2] - from[2]) * t + (i % 2) * 0.04]} />; })}</group>;
};
