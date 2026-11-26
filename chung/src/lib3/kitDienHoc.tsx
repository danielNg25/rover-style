import React, {useMemo} from 'react';
import * as THREE from 'three';
import {FacetLathe, Halo} from './look';
import {rnd, Ctx, paintPeak, paintCloud} from './depth';
import {B} from './kit';
import {tex, DriftSpecks} from './kitLab';
import {Embers} from './fx';

/** lib3/kitDienHoc: the pieces of the monastery's lore hall (src/demo/DienHoc.tsx, d1c9 scenes 4-10). Metres, y up; things that hang on a wall lie in
 *  their own x-y plane facing +z. The shapes are plain and invented here: a whitewashed hall with a maroon painted band, red lacquered columns with a
 *  gilt bracket, a hanging scroll with a geometric ring diagram, parchments for drawing, a copper brazier on three legs. The diagrams are abstract
 *  (rings, a star, ticks): no sacred figure or text of any real tradition is drawn. */
type V3 = [number, number, number];
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const L2 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const ease = (t: number) => t * t * (3 - 2 * t);
const dot = () => tex('dh-dot', 64, 64, (c, W) => { const g = c.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, W); });

// ---------------------------------------------------------------- surfaces
/** whitewashed plaster, a dark-ochre dado to 0.95 m with a black line, and (back wall) a maroon band with gilt squares between y 3.5 and 4.15. soot clouds under the lamps. */
export const paintPlaster = (Wm: number, Hm: number, seed: number, band = true) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / Wm, Y = (y: number) => H - y * ppm;
  c.fillStyle = '#efe6d2'; c.fillRect(0, 0, W, H);
  for (let k = 0; k < Wm * 5; k++) { const x = r() * W, y = r() * H, q = (0.3 + r() * 0.8) * ppm, g = c.createRadialGradient(x, y, 0, x, y, q); g.addColorStop(0, r() < 0.5 ? 'rgba(255,250,236,0.35)' : 'rgba(150,120,80,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - q, y - q, q * 2, q * 2); }
  c.fillStyle = '#b88a55'; c.fillRect(0, Y(0.95), W, 0.95 * ppm); c.fillStyle = '#9c6f3f'; c.fillRect(0, Y(0.95), W, 0.05 * ppm); c.fillStyle = '#2a2018'; c.fillRect(0, Y(0.99), W, 0.04 * ppm);
  for (let k = 0; k < Wm * 4; k++) { const x = r() * W, w = (0.04 + r() * 0.1) * ppm, h = (0.15 + r() * 0.5) * ppm, g = c.createLinearGradient(0, Y(0.95) - h, 0, Y(0.95)); g.addColorStop(0, 'rgba(120,90,60,0)'); g.addColorStop(1, 'rgba(120,90,60,0.22)'); c.fillStyle = g; c.fillRect(x, Y(0.95) - h, w, h); }
  if (band) {
    c.fillStyle = '#8a2f28'; c.fillRect(0, Y(4.15), W, 0.65 * ppm); c.fillStyle = '#6e2420'; c.fillRect(0, Y(3.5) - 0.06 * ppm, W, 0.06 * ppm); c.fillStyle = '#2a1a14'; c.fillRect(0, Y(4.15), W, 0.04 * ppm);
    c.fillStyle = '#d6a742'; for (let x = 0.2; x < Wm; x += 0.34) c.fillRect(x * ppm, Y(3.95), 0.13 * ppm, 0.13 * ppm);
    c.fillStyle = '#efe6d2'; for (let x = 0.2; x < Wm; x += 0.34) c.fillRect(x * ppm, Y(3.68), 0.13 * ppm, 0.05 * ppm);
  }
};
export const paintPlanks = (Wm: number, Dm: number, seed: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / Wm, pw = 0.3 * ppm, tones = ['#b07a46', '#a06f3e', '#bd8650', '#a87442'];
  for (let y = 0, i = 0; y < H; y += pw, i++) { for (let x = 0; x < W;) { const len = (0.9 + r() * 1.6) * ppm; c.fillStyle = tones[Math.floor(r() * 4)]; c.fillRect(x, y, len, pw); c.fillStyle = 'rgba(60,35,18,0.55)'; c.fillRect(x + len - 2, y, 2, pw); x += len; } c.fillStyle = 'rgba(50,28,14,0.5)'; c.fillRect(0, y, W, 2); }
  for (let k = 0; k < 40; k++) { const x = r() * W, y = r() * H, q = (0.4 + r() * 0.9) * ppm, g = c.createRadialGradient(x, y, 0, x, y, q); g.addColorStop(0, r() < 0.5 ? 'rgba(255,230,180,0.14)' : 'rgba(60,30,10,0.14)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - q, y - q, q * 2, q * 2); }
  // a long runner rug down the middle (a woven strip in dark red with a border and a row of diamonds)
  const rx = (Wm / 2 - 1.1) * ppm, rw = 2.2 * ppm; c.fillStyle = '#7e2a26'; c.fillRect(rx, 0, rw, H); c.fillStyle = '#d6a742'; c.fillRect(rx + 0.06 * ppm, 0, 0.04 * ppm, H); c.fillRect(rx + rw - 0.1 * ppm, 0, 0.04 * ppm, H);
  c.fillStyle = '#2f4a73'; for (let y = 0.2; y < Dm; y += 0.55) { const cx = rx + rw / 2, cy = y * ppm; c.beginPath(); c.moveTo(cx, cy - 0.2 * ppm); c.lineTo(cx + 0.28 * ppm, cy); c.lineTo(cx, cy + 0.2 * ppm); c.lineTo(cx - 0.28 * ppm, cy); c.closePath(); c.fill(); }
};

// ---------------------------------------------------------------- columns, beams, shelves
/** A red lacquered column (slightly tapered), a dark base block, a gilt-banded neck and a bracket capital (two stacked blocks in blue and ochre). */
export const Column: React.FC<{pos: V3; h?: number; seed?: number}> = ({pos, h = 3.8, seed = 1}) => (
  <group position={pos}>
    <B p={[0, 0.1, 0]} s={[0.46, 0.2, 0.46]} c="#3a2a20" />
    <mesh position={[0, h / 2 + 0.1, 0]} castShadow receiveShadow><cylinderGeometry args={[0.17, 0.215, h - 0.4, 12]} /><meshLambertMaterial color={seed % 2 ? '#a2342a' : '#97302a'} /></mesh>
    <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.2, 0.2, 0.05, 12]} /><meshLambertMaterial color="#d6a742" /></mesh>
    <mesh position={[0, h - 0.34, 0]}><cylinderGeometry args={[0.185, 0.185, 0.05, 12]} /><meshLambertMaterial color="#d6a742" /></mesh>
    <B p={[0, h - 0.18, 0]} s={[0.5, 0.16, 0.5]} c="#2f4a73" /><B p={[0, h - 0.04, 0]} s={[0.78, 0.14, 0.4]} c="#c9902f" />
    {[-1, 1].map((s) => <B key={s} p={[s * 0.33, h - 0.14, 0]} s={[0.08, 0.1, 0.34]} c="#8a2f28" cast={false} />)}
  </group>
);
/** A painted cross beam: ochre face, a maroon underside, joist ends painted in turn. */
export const Beam: React.FC<{p: V3; len: number; h?: number; d?: number; ends?: boolean}> = ({p, len, h = 0.34, d = 0.34, ends = true}) => (
  <group position={p}>
    <B p={[0, 0, 0]} s={[len, h, d]} c="#8a2f28" /><B p={[0, h * 0.18, d * 0.505]} s={[len, h * 0.5, 0.012]} c="#d6a742" cast={false} /><B p={[0, -h * 0.3, d * 0.505]} s={[len, h * 0.22, 0.012]} c="#2f4a73" cast={false} />
    {ends ? Array.from({length: Math.floor(len / 0.32)}, (_, i) => <B key={i} p={[-len / 2 + 0.16 + i * 0.32, h * 0.9, d * 0.32]} s={[0.14, 0.14, 0.16]} c={i % 2 ? '#c9902f' : '#2f4a73'} cast={false} />) : null}
  </group>
);
/** The scripture shelf: a wooden frame with pigeonholes, each holding a cloth-wrapped bundle of long loose pages (yellow, red, white, blue wrappers). pos = its middle foot on the wall; faces +z. */
export const GiaKinh: React.FC<{pos: V3; w?: number; h?: number; cols?: number; rows?: number; rotY?: number}> = ({pos, w = 1.7, h = 2.5, cols = 5, rows = 5, rotY = 0}) => {
  const wr = ['#d6a742', '#a2342a', '#efe6d2', '#2f4a73', '#c9902f'], cw = w / cols, rh = h / rows;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <B p={[0, h / 2, 0.16]} s={[w, h, 0.32]} c="#4a2e1e" />
      {Array.from({length: cols}, (_, i) => Array.from({length: rows}, (_, j) => {
        const x = -w / 2 + cw * (i + 0.5), y = rh * (j + 0.5), k = (i * 3 + j * 2) % 5, full = (i + j * 2) % 7 !== 3;
        return <group key={`${i}-${j}`}>
          <B p={[x, y, 0.2]} s={[cw - 0.05, rh - 0.05, 0.28]} c="#2a1a12" cast={false} />
          {full ? <><B p={[x, y - 0.02, 0.27]} s={[cw - 0.1, rh - 0.12, 0.2]} c={wr[k]} cast={false} /><B p={[x, y - 0.02, 0.375]} s={[cw - 0.1, 0.02, 0.01]} c="#4a2e1e" cast={false} /><B p={[x, y + (rh - 0.12) * 0.2, 0.375]} s={[0.02, (rh - 0.12) * 0.55, 0.01]} c="#efe6d2" cast={false} /></> : null}
        </group>;
      }))}
      <B p={[0, h + 0.05, 0.16]} s={[w + 0.12, 0.1, 0.38]} c="#8a2f28" />
    </group>
  );
};

// ---------------------------------------------------------------- the view outside the windows (day)
const rangeTex = (key: string, seed: number, near: boolean) => tex(key, 2048, 512, (c, W, H) => {
  const r = rnd(seed), t = near ? {light: '#a9b3cf', dark: '#8d99ba', snow: '#f4f3f8', snowShade: '#c6cbdf'} : {light: '#bcc6dd', dark: '#a5b0cc', snow: '#fbfaff', snowShade: '#d4d9ea'};
  c.setTransform(W / 1600, 0, 0, H / 400, 0, 0);
  for (let i = 0; i < (near ? 6 : 8); i++) paintPeak(c, 80 + i * (near ? 270 : 210) + (r() - 0.5) * 80, 60 + r() * (near ? 150 : 110), (near ? 230 : 190) + r() * 120, 400, t);
});
/** Sky, two snow ranges and a string of prayer flags seen through the windows by day (centred on x, behind the back wall at z 0). */
export const DayPeaks: React.FC<{x: number; f?: number}> = ({x, f = 0}) => {
  const sky = useMemo(() => tex('dh-sky', 16, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7fa6d8'); g.addColorStop(0.5, '#b9d2ee'); g.addColorStop(1, '#f2e8d8'); c.fillStyle = g; c.fillRect(0, 0, W, H); }), []);
  const clouds = useMemo(() => tex('dh-clouds', 1024, 256, (c, W, H) => { c.setTransform(W / 1600, 0, 0, H / 400, 0, 0); paintCloud(c, 300, 120, 1.2, {light: '#fdfdff', dark: '#dfe6f4'}); paintCloud(c, 900, 60, 1.0, {light: '#fdfdff', dark: '#dfe6f4'}); paintCloud(c, 1350, 170, 0.8, {light: '#fdfdff', dark: '#dfe6f4'}); }), []);
  const pts = useMemo(() => { const q = rnd(4); return Array.from({length: 46}, () => [q() * 7 - 3.5, q() * 4.6, -4 - q() * 9, 0.014 + q() * 0.016, q() * 6.28, 0.4 + q() * 0.5] as const); }, []);
  const A: V3 = [x - 3.6, 4.4, -5.5], Bp: V3 = [x + 3.4, 2.2, -7.5], pt = (t: number): V3 => [A[0] + (Bp[0] - A[0]) * t, A[1] + (Bp[1] - A[1]) * t - Math.sin(t * Math.PI) * 0.5, A[2] + (Bp[2] - A[2]) * t];
  const cols = ['#3a6ab0', '#ece7d8', '#c23a30', '#3f8a4a', '#e0b23a'];
  return (
    <group>
      <mesh position={[x, 40, -420]}><planeGeometry args={[900, 520]} /><meshBasicMaterial map={sky} fog={false} /></mesh>
      <mesh position={[x, 60, -380]}><planeGeometry args={[700, 175]} /><meshBasicMaterial map={clouds} transparent fog={false} /></mesh>
      <mesh position={[x + 20, 12, -200]}><planeGeometry args={[320, 80]} /><meshBasicMaterial map={rangeTex('dh-range-far', 7, false)} transparent fog={false} /></mesh>
      <mesh position={[x + 8, 5, -72]}><planeGeometry args={[180, 45]} /><meshBasicMaterial map={rangeTex('dh-range-near', 13, true)} transparent fog={false} /></mesh>
      {Array.from({length: 16}, (_, i) => { const p0 = pt(i / 16), p1 = pt((i + 1) / 16); return <mesh key={i} position={[(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2]} rotation={[0, 0, Math.atan2(p1[1] - p0[1], p1[0] - p0[0])]}><boxGeometry args={[Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.01, 0.012, 0.012]} /><meshBasicMaterial color="#3a3236" fog={false} /></mesh>; })}
      {Array.from({length: 14}, (_, i) => { const p = pt((i + 0.5) / 14), sw = Math.sin(f * 0.23 + i * 0.9) * 0.2; return <mesh key={i} position={[p[0], p[1] - 0.15, p[2]]} rotation={[sw * 0.4, sw, -0.5 + sw * 0.15]}><planeGeometry args={[0.2, 0.26]} /><meshBasicMaterial color={cols[i % 5]} side={THREE.DoubleSide} fog={false} /></mesh>; })}
      {pts.map(([px, py, pz, s, ph, sp], i) => { const yy = ((py - (f / 24) * sp) % 4.6 + 4.6) % 4.6 - 0.2; return <mesh key={i} position={[x + px + Math.sin(f * 0.05 + ph) * 0.15, yy, pz]}><circleGeometry args={[s, 6]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.8} fog={false} /></mesh>; })}
    </group>
  );
};
/** A window of the hall: black painted trapezoid frame (narrower at the top) and a red valance board above, a deep sill, no glass. rect: x0 x1 sill head (metres) on the back wall; faces +z. */
export const DienCuaSo: React.FC<{x0: number; x1: number; sill: number; head: number}> = ({x0, x1, sill, head}) => {
  const cx = (x0 + x1) / 2, w = x1 - x0, h = head - sill, shape = useMemo(() => { const s = new THREE.Shape(); const i = 0.07; s.moveTo(-w / 2 - 0.12, -h / 2 - 0.1); s.lineTo(w / 2 + 0.12, -h / 2 - 0.1); s.lineTo(w / 2 + 0.12 - 0.06, h / 2 + 0.1); s.lineTo(-w / 2 - 0.12 + 0.06, h / 2 + 0.1); s.closePath();
    const hole = new THREE.Path(); hole.moveTo(-w / 2 + i * 0.4, -h / 2); hole.lineTo(w / 2 - i * 0.4, -h / 2); hole.lineTo(w / 2 - i, h / 2); hole.lineTo(-w / 2 + i, h / 2); hole.closePath(); s.holes.push(hole); return new THREE.ShapeGeometry(s); }, [w, h]);
  return (
    <group position={[cx, (sill + head) / 2, 0.012]}>
      <mesh geometry={shape}><meshLambertMaterial color="#2a1c1c" /></mesh>
      <B p={[0, h / 2 + 0.24, 0.05]} s={[w + 0.4, 0.3, 0.08]} c="#8a2f28" /><B p={[0, h / 2 + 0.24, 0.1]} s={[w + 0.34, 0.06, 0.02]} c="#d6a742" cast={false} />
      {[-1, 0, 1].map((k) => <B key={k} p={[k * (w / 2 - 0.1), h / 2 + 0.06, 0.1]} s={[0.1, 0.16, 0.02]} c={k ? '#efe6d2' : '#2f4a73'} cast={false} />)}
      <B p={[0, -h / 2 - 0.05, -0.2]} s={[w + 0.3, 0.08, 0.62]} c="#c9a870" />
    </group>
  );
};

// ---------------------------------------------------------------- light shafts and dust
/** A slanted volume of sunlight from a window rectangle to the floor: four faint additive sides that fade with distance. dir = the way the light travels (unit). */
export const VetNang: React.FC<{x0: number; x1: number; y0: number; y1: number; dir: V3; opacity?: number; color?: string}> = ({x0, x1, y0, y1, dir, opacity = 0.12, color = '#fff0c8'}) => {
  const geo = useMemo(() => {
    const at = (x: number, y: number): V3 => [x, y, 0.02], gr = (p: V3): V3 => { const t = p[1] / -dir[1]; return [p[0] + dir[0] * t, 0.01, p[2] + dir[2] * t]; };
    const w = [at(x0, y0), at(x1, y0), at(x1, y1), at(x0, y1)], g = w.map(gr), pos: number[] = [], col: number[] = [], idx: number[] = [];
    w.forEach((p) => pos.push(...p)); g.forEach((p) => pos.push(...p));
    for (let i = 0; i < 4; i++) { col.push(1, 1, 1, 1); } for (let i = 0; i < 4; i++) { col.push(0.25, 0.25, 0.25, 1); }
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; idx.push(i, j, 4 + j, i, 4 + j, 4 + i); }
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('color', new THREE.Float32BufferAttribute(col.filter((_, i) => i % 4 !== 3), 3)); G.setIndex(idx); return G;
  }, [x0, x1, y0, y1, dir[0], dir[1], dir[2]]);
  return <mesh geometry={geo} renderOrder={5}><meshBasicMaterial vertexColors color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} fog={false} /></mesh>;
};

// ---------------------------------------------------------------- the hanging scroll with the ring diagram
/** The ring diagram, drawn on the middle of a panel. ring i (0 = outermost) glows when lit[i] > 0. Gilt lines on deep blue: four rings, a star between the 2nd and 3rd, ticks, small marks. */
const paintRings = (c: Ctx, cx: number, cy: number, R: number, lit: number[], flat: string) => {
  const ring = (rr: number, i: number, wd: number) => { const k = lit[i] ?? 0; c.save(); c.lineWidth = wd; c.strokeStyle = k > 0 ? `rgb(${Math.round(214 + 41 * k)},${Math.round(167 + 58 * k)},${Math.round(66 + 40 * k)})` : flat;
    if (k > 0) { c.shadowColor = `rgba(255,214,110,${0.9 * k})`; c.shadowBlur = 26 * k; } c.beginPath(); c.arc(cx, cy, rr, 0, 7); c.stroke(); if (k > 0) { c.shadowBlur = 0; c.strokeStyle = `rgba(255,248,214,${0.8 * k})`; c.lineWidth = wd * 0.35; c.stroke(); } c.restore(); };
  const rs = [R, R * 0.8, R * 0.58, R * 0.34];
  rs.forEach((rr, i) => ring(rr, i, 7));
  c.strokeStyle = flat; c.lineWidth = 5; for (let a = 0; a < 24; a++) { const t = (a / 24) * Math.PI * 2, r1 = R * 0.84, r2 = R * 0.96; c.beginPath(); c.moveTo(cx + Math.cos(t) * r1, cy + Math.sin(t) * r1); c.lineTo(cx + Math.cos(t) * r2, cy + Math.sin(t) * r2); c.stroke(); }
  [0, Math.PI].forEach((o) => { c.beginPath(); for (let k = 0; k < 3; k++) { const t = o + (k / 3) * Math.PI * 2 - Math.PI / 2; (k ? c.lineTo : c.moveTo).call(c, cx + Math.cos(t) * R * 0.7, cy + Math.sin(t) * R * 0.7); } c.closePath(); c.stroke(); });
  c.fillStyle = flat; for (let a = 0; a < 4; a++) { const t = (a / 4) * Math.PI * 2; c.beginPath(); c.arc(cx + Math.cos(t) * R * 0.46, cy + Math.sin(t) * R * 0.46, R * 0.05, 0, 7); c.fill(); }
  c.save(); c.translate(cx, cy); c.rotate(Math.PI / 4); c.strokeStyle = flat; c.strokeRect(-R * 0.12, -R * 0.12, R * 0.24, R * 0.24); c.restore();
};
/** The hanging scroll: silk brocade border (maroon, ochre, blue), a deep blue panel with the ring diagram. mo 0..1 = how far it is unrolled (the roll at the top, the cloth coming down,
 *  a bottom dowel at the lower edge); vong 0..1 = the four rings light from the outside in, with a halo and drifting gold specks. top = the y of the top dowel. */
export const CuonTranh: React.FC<{pos: V3; w?: number; full?: number; mo?: number; vong?: number; f?: number}> = ({pos, w = 1.1, full = 2.1, mo = 1, vong = 0, f = 0}) => {
  const len = Math.max(0.0, full * clamp(mo)), q = Math.round(clamp(vong) * 24) / 24;
  const map = useMemo(() => len < 0.05 ? null : tex(`dh-scroll-${Math.round(len * 40)}-${q}`, 352, Math.max(8, Math.round(len * 320)), (c, W, H) => {
    c.fillStyle = '#8a2f28'; c.fillRect(0, 0, W, H); c.fillStyle = '#d6a742'; c.fillRect(8, 0, 6, H); c.fillRect(W - 14, 0, 6, H); c.fillStyle = '#2f4a73'; c.fillRect(24, 0, W - 48, H);
    c.fillStyle = '#c9902f'; c.fillRect(24, 0, 4, H); c.fillRect(W - 28, 0, 4, H); for (let y = 10; y < H; y += 30) { c.fillStyle = '#d6a742'; c.fillRect(11, y, 0, 0); c.fillRect(30, y, 10, 3); c.fillRect(W - 40, y, 10, 3); }
    const lit = [0, 1, 2, 3].map((i) => clamp(q * 4 - i)); paintRings(c, W / 2, 0.52 * 320, 128, lit, '#d6a742');
  }), [len > 0.05 ? Math.round(len * 40) : 0, q]);
  const rollTop = 0.08;
  return (
    <group position={pos}>
      {map ? <mesh position={[0, -len / 2, 0.02]} receiveShadow><planeGeometry args={[w, len]} /><meshLambertMaterial map={map} /></mesh> : null}
      <mesh position={[0, 0.0, 0.04]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[rollTop, rollTop, w + 0.08, 12]} /><meshLambertMaterial color="#d6a742" /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * (w / 2 + 0.09), 0, 0.04]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, 0.06, 10]} /><meshLambertMaterial color="#8a2f28" /></mesh>)}
      {len > 0.05 ? <><mesh position={[0, -len, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.035, 0.035, w + 0.06, 10]} /><meshLambertMaterial color="#4a2e1e" /></mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[s * (w / 2 + 0.05), -len, 0.05]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.045, 0.045, 0.03, 8]} /><meshLambertMaterial color="#d6a742" /></mesh>)}</> : null}
      <B p={[0, 0.2, 0.03]} s={[0.012, 0.3, 0.012]} c="#2a2018" cast={false} />
      {q > 0 && len > 1.2 ? <>
        <Halo pos={[0, -0.52 * 1.0 - 0.05, 0.12]} r={1.25} color="#ffcf6a" strength={0.65 * q} />
        <DriftSpecks f={f} box={[-0.55, 0.55, -1.2, -0.1, 0.1, 0.4]} n={Math.round(34 * q)} color="#ffd878" size={0.01} wind={[0.01, 0.1]} glow={0.7} seed={5} />
      </> : null}
    </group>
  );
};

// ---------------------------------------------------------------- parchments that are drawn on
export type GiayKind = 'trang' | 'vong' | 'giap' | 'matna';
type Stroke = {pts: [number, number][]; w: number};
const circ = (cx: number, cy: number, r: number, n = 48, a0 = 0): [number, number][] => Array.from({length: n + 1}, (_, i) => [cx + Math.cos(a0 + (i / n) * Math.PI * 2) * r, cy + Math.sin(a0 + (i / n) * Math.PI * 2) * r]);
const poly = (...p: number[][]): [number, number][] => p.map(([x, y]) => [x, y] as [number, number]);
/** drawing strokes in sheet metres (origin = the sheet's middle, y up; the sheet is 1.55 x 2.3). Drawn in this order, each along its length. */
export const GIAY_STROKES: Record<Exclude<GiayKind, 'trang'>, Stroke[]> = {
  vong: [
    {pts: circ(0, 0.05, 0.62), w: 7}, ...Array.from({length: 24}, (_, a): Stroke => { const t = (a / 24) * Math.PI * 2; return {pts: poly([Math.cos(t) * 0.52, 0.05 + Math.sin(t) * 0.52], [Math.cos(t) * 0.6, 0.05 + Math.sin(t) * 0.6]), w: 4}; }),
    {pts: circ(0, 0.05, 0.5), w: 6},
    {pts: poly([0, 0.5], [0.4, -0.17], [-0.4, -0.17], [0, 0.5]), w: 5}, {pts: poly([0, -0.4], [0.4, 0.27], [-0.4, 0.27], [0, -0.4]), w: 5},
    {pts: circ(0, 0.05, 0.27), w: 6}, {pts: poly([-0.09, -0.04], [0.09, -0.04], [0.09, 0.14], [-0.09, 0.14], [-0.09, -0.04]), w: 4},
    ...[0, 1, 2, 3].map((a): Stroke => ({pts: circ(Math.cos(a * Math.PI / 2) * 0.38, 0.05 + Math.sin(a * Math.PI / 2) * 0.38, 0.045, 14), w: 4})),
  ],
  // an armoured figure from the head down, front view, 1.9 m: helm with a crest, pauldrons, breastplate, belt, tassets, greaves, boots
  giap: [
    {pts: poly([-0.13, 0.9], [-0.13, 0.7], [-0.15, 0.62], [0.15, 0.62], [0.13, 0.7], [0.13, 0.9], [0.0, 0.97], [-0.13, 0.9]), w: 6}, {pts: poly([0, 0.97], [0, 1.0], [0.03, 1.02]), w: 4}, {pts: poly([-0.08, 0.72], [0.08, 0.72]), w: 4}, {pts: poly([-0.05, 0.84], [0.05, 0.84]), w: 3},
    {pts: poly([-0.08, 0.62], [-0.08, 0.55], [0.08, 0.55], [0.08, 0.62]), w: 5},
    {pts: poly([-0.08, 0.55], [-0.3, 0.55], [-0.46, 0.46], [-0.5, 0.34], [-0.42, 0.3], [-0.26, 0.38], [-0.2, 0.5]), w: 6}, {pts: poly([0.08, 0.55], [0.3, 0.55], [0.46, 0.46], [0.5, 0.34], [0.42, 0.3], [0.26, 0.38], [0.2, 0.5]), w: 6},
    {pts: poly([-0.2, 0.5], [-0.24, 0.2], [-0.2, 0.0], [0.2, 0.0], [0.24, 0.2], [0.2, 0.5]), w: 6}, {pts: poly([0, 0.5], [0, 0.0]), w: 3}, {pts: poly([-0.2, 0.26], [0.2, 0.26]), w: 3},
    {pts: poly([-0.42, 0.3], [-0.46, 0.06], [-0.44, -0.18], [-0.34, -0.2], [-0.3, 0.04], [-0.24, 0.2]), w: 6}, {pts: poly([0.42, 0.3], [0.46, 0.06], [0.44, -0.18], [0.34, -0.2], [0.3, 0.04], [0.24, 0.2]), w: 6},
    {pts: poly([-0.22, 0.0], [-0.22, -0.07], [0.22, -0.07], [0.22, 0.0]), w: 5}, {pts: poly([-0.22, -0.07], [-0.26, -0.4], [-0.1, -0.44], [0, -0.3], [0.1, -0.44], [0.26, -0.4], [0.22, -0.07]), w: 5},
    {pts: poly([-0.2, -0.42], [-0.22, -0.74], [-0.1, -0.76], [-0.06, -0.42]), w: 6}, {pts: poly([0.2, -0.42], [0.22, -0.74], [0.1, -0.76], [0.06, -0.42]), w: 6},
    {pts: poly([-0.26, -0.74], [-0.28, -0.9], [-0.04, -0.9], [-0.06, -0.76]), w: 6}, {pts: poly([0.26, -0.74], [0.28, -0.9], [0.04, -0.9], [0.06, -0.76]), w: 6},
    {pts: poly([-0.42, 0.44], [-0.3, 0.4], [-0.24, 0.46]), w: 3}, {pts: poly([0.42, 0.44], [0.3, 0.4], [0.24, 0.46]), w: 3}, {pts: poly([-0.1, 0.4], [0, 0.34], [0.1, 0.4]), w: 3},
    {pts: poly([-0.04, 0.0], [-0.04, -0.07], [0.04, -0.07], [0.04, 0.0], [-0.04, 0.0]), w: 3}, {pts: poly([-0.47, -0.1], [-0.33, -0.12]), w: 3}, {pts: poly([0.47, -0.1], [0.33, -0.12]), w: 3},
    {pts: poly([-0.2, -0.58], [-0.1, -0.6]), w: 3}, {pts: poly([0.2, -0.58], [0.1, -0.6]), w: 3}, {pts: poly([-0.16, 0.18], [-0.06, 0.2]), w: 2}, {pts: poly([0.16, 0.18], [0.06, 0.2]), w: 2},
  ],
  // the face plate: two eye slits and a square jaw first, then the rest of the outline (the iron wash fills it at the end)
  matna: [
    {pts: poly([-0.2, 0.12], [-0.06, 0.08], [-0.05, 0.14], [-0.19, 0.18], [-0.2, 0.12]), w: 6}, {pts: poly([0.2, 0.12], [0.06, 0.08], [0.05, 0.14], [0.19, 0.18], [0.2, 0.12]), w: 6},
    {pts: poly([-0.27, 0.0], [-0.27, -0.2], [-0.2, -0.3], [-0.12, -0.38], [0.12, -0.38], [0.2, -0.3], [0.27, -0.2], [0.27, 0.0]), w: 7},
    {pts: poly([-0.27, 0.0], [-0.29, 0.22], [-0.2, 0.34], [0, 0.4], [0.2, 0.34], [0.29, 0.22], [0.27, 0.0]), w: 7}, {pts: poly([0, 0.08], [-0.03, -0.08], [0.03, -0.08], [0, 0.08]), w: 4},
    {pts: poly([-0.1, -0.22], [0.1, -0.22]), w: 4}, {pts: poly([-0.08, -0.28], [0.08, -0.28]), w: 3}, {pts: poly([-0.24, 0.26], [-0.04, 0.3]), w: 3}, {pts: poly([0.24, 0.26], [0.04, 0.3]), w: 3},
  ],
};
const lens = (s: Stroke) => { let L = 0; for (let i = 1; i < s.pts.length; i++) L += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]); return L; };
const TOT: Record<string, number> = {}; (['vong', 'giap', 'matna'] as const).forEach((k) => { TOT[k] = GIAY_STROKES[k].reduce((a, s) => a + lens(s), 0); });
/** where each drawing sits on the sheet (centre, scale), in sheet metres: the ring diagram fills the sheet; the armour is life-size to the sheet's height; the face plate is drawn big (about 0.55 m wide) */
const GIAY_AT: Record<string, {c: [number, number]; k: number}> = {vong: {c: [0, 0.05], k: 1}, giap: {c: [0, 0.0], k: 1.05}, matna: {c: [0, -0.55], k: 0.95}};
/** the point where the pen is, in sheet metres (the hand goes here), after a share p of the drawing has been made */
export const giayBut = (kind: Exclude<GiayKind, 'trang'>, p: number): [number, number] => {
  let rest = clamp(p) * TOT[kind], last: [number, number] = GIAY_STROKES[kind][0].pts[0];
  for (const s of GIAY_STROKES[kind]) { for (let i = 1; i < s.pts.length; i++) { const d = Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]); if (rest <= d) { const t = d ? rest / d : 0; last = [s.pts[i - 1][0] + (s.pts[i][0] - s.pts[i - 1][0]) * t, s.pts[i - 1][1] + (s.pts[i][1] - s.pts[i - 1][1]) * t]; return [last[0] * GIAY_AT[kind].k + GIAY_AT[kind].c[0], last[1] * GIAY_AT[kind].k + GIAY_AT[kind].c[1]]; } rest -= d; last = s.pts[i]; } }
  return [last[0] * GIAY_AT[kind].k + GIAY_AT[kind].c[0], last[1] * GIAY_AT[kind].k + GIAY_AT[kind].c[1]];
};
export const GIAY = {w: 1.55, h: 2.3, thick: 0.02};
/** A parchment hung from a wooden dowel by two cords: warm hide, a darker deckled border, a bottom dowel with tassels. kind = what is being drawn on it (a ring diagram, the armour, the face plate);
 *  p = share drawn 0..1 (the pen's path follows `giayBut`); sang 0..1 = the finished lines turn gold and shine (vong only). pos = the middle of the sheet; its drawing lies on its face.
 *  The drawing lines are dark red ink (vong), black-brown ink (giap) or ink with a grey-iron wash (matna: the wash fills in from p 0.82 to 1). */
export const GiayDa: React.FC<{pos: V3; kind?: GiayKind; p?: number; sang?: number; f?: number; pen?: boolean}> = ({pos, kind = 'trang', p = 0, sang = 0, f = 0, pen = true}) => {
  const q = Math.round(clamp(p) * 120), s = Math.round(clamp(sang) * 20) / 20, W = 620, H = 920, ppm = 400;
  const map = useMemo(() => tex(`dh-giay-${kind}-${q}-${s}`, W, H, (c) => {
    const r = rnd(17); c.fillStyle = '#d2b684'; c.fillRect(0, 0, W, H); c.fillStyle = '#e8d6ac'; c.beginPath(); c.moveTo(14, 10); for (let x = 14; x < W - 14; x += 14) c.lineTo(x, 8 + r() * 6); c.lineTo(W - 10, 20); for (let y = 20; y < H - 14; y += 14) c.lineTo(W - 8 - r() * 6, y); c.lineTo(W - 14, H - 10); for (let x = W - 14; x > 14; x -= 14) c.lineTo(x, H - 8 - r() * 6); c.lineTo(10, H - 20); for (let y = H - 20; y > 14; y -= 14) c.lineTo(8 + r() * 6, y); c.closePath(); c.fill();
    for (let k = 0; k < 12; k++) { const x = r() * W, y = r() * H, qq = 60 + r() * 120, g = c.createRadialGradient(x, y, 0, x, y, qq); g.addColorStop(0, r() < 0.6 ? 'rgba(255,244,214,0.22)' : 'rgba(140,100,50,0.06)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - qq, y - qq, qq * 2, qq * 2); }
    c.strokeStyle = 'rgba(120,84,44,0.5)'; c.lineWidth = 3; c.strokeRect(34, 34, W - 68, H - 68);
    if (kind === 'trang') return;
    const X = (x: number) => W / 2 + (x * GIAY_AT[kind].k + GIAY_AT[kind].c[0]) * ppm, Y = (y: number) => H / 2 - (y * GIAY_AT[kind].k + GIAY_AT[kind].c[1]) * ppm;
    let rest = (q / 120) * TOT[kind];
    const lit = kind === 'vong' && s > 0, ink = kind === 'vong' ? '#7c2a1c' : '#2c2018';
    const fillWash = kind === 'matna' && q / 120 > 0.82 ? clamp((q / 120 - 0.82) / 0.18) : 0;
    if (fillWash > 0) { c.save(); c.globalAlpha = fillWash; c.fillStyle = '#6c7078'; c.beginPath(); GIAY_STROKES.matna[3].pts.concat(GIAY_STROKES.matna[2].pts.slice().reverse()).forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y)))); c.closePath(); c.fill(); c.fillStyle = '#1e1c20'; GIAY_STROKES.matna.slice(0, 2).forEach((st) => { c.beginPath(); st.pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y)))); c.closePath(); c.fill(); }); c.restore(); }
    if (kind === 'giap' && q / 120 > 0.97) { c.save(); c.globalAlpha = 0.22; c.fillStyle = '#6c7078'; [[-0.2, 0.5, 0.2, 0.0], [-0.26, -0.07, 0.26, -0.44]].forEach(([a, b, d, e]) => c.fillRect(X(a), Y(b), (d - a) * ppm * 1.05, (b - e) * ppm * 1.05)); c.restore(); }
    for (const st of GIAY_STROKES[kind]) {
      if (rest <= 0) break; const Ls = lens(st), take = Math.min(1, rest / Ls); rest -= Ls;
      const pts: [number, number][] = []; let acc = 0, goal = take * Ls; pts.push(st.pts[0]);
      for (let i = 1; i < st.pts.length; i++) { const d = Math.hypot(st.pts[i][0] - st.pts[i - 1][0], st.pts[i][1] - st.pts[i - 1][1]); if (acc + d <= goal) { pts.push(st.pts[i]); acc += d; } else { const t = (goal - acc) / d; pts.push([st.pts[i - 1][0] + (st.pts[i][0] - st.pts[i - 1][0]) * t, st.pts[i - 1][1] + (st.pts[i][1] - st.pts[i - 1][1]) * t]); break; } }
      const path = () => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y)))); };
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (lit) { c.save(); c.shadowColor = `rgba(255,210,100,${0.95 * s})`; c.shadowBlur = 24 * s; c.strokeStyle = `rgb(${Math.round(124 + 131 * s)},${Math.round(42 + 168 * s)},${Math.round(28 + 62 * s)})`; c.lineWidth = st.w * (1 + 0.5 * s); path(); c.stroke(); c.restore(); c.strokeStyle = `rgba(255,246,206,${0.85 * s})`; c.lineWidth = st.w * 0.4; path(); c.stroke(); }
      else { c.strokeStyle = ink; c.lineWidth = st.w; path(); c.stroke(); }
    }
  }), [kind, q, s]);
  const tip = kind !== 'trang' && q > 0 && q < 120 ? giayBut(kind, p) : null;
  return (
    <group position={pos}>
      <mesh position={[0, 0, 0.0]} receiveShadow><planeGeometry args={[GIAY.w, GIAY.h]} /><meshLambertMaterial map={map} /></mesh>
      <mesh position={[0, GIAY.h / 2 + 0.03, 0.03]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.03, 0.03, GIAY.w + 0.14, 8]} /><meshLambertMaterial color="#4a2e1e" /></mesh>
      <mesh position={[0, -GIAY.h / 2 - 0.02, 0.03]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.025, 0.025, GIAY.w + 0.1, 8]} /><meshLambertMaterial color="#4a2e1e" /></mesh>
      {[-0.62, 0.62].map((x) => <group key={x}><B p={[x, GIAY.h / 2 + 0.15, 0.03]} s={[0.012, 0.26, 0.012]} c="#2a2018" cast={false} /><B p={[x, GIAY.h / 2 + 0.28, 0.03]} s={[0.05, 0.05, 0.05]} c="#8a2f28" cast={false} /></group>)}
      {[-0.7, 0.7].map((x) => <group key={x}><B p={[x, -GIAY.h / 2 - 0.12, 0.03]} s={[0.04, 0.2, 0.012]} c="#a2342a" cast={false} /><B p={[x, -GIAY.h / 2 - 0.24, 0.03]} s={[0.07, 0.05, 0.012]} c="#d6a742" cast={false} /></group>)}
      {tip && pen ? <mesh position={[tip[0], tip[1], 0.012]} renderOrder={6}><circleGeometry args={[0.008, 8]} /><meshBasicMaterial color="#1a1410" /></mesh> : null}
      {kind === 'vong' && s > 0 ? <><Halo pos={[0, 0.05, 0.1]} r={1.5} color="#ffcf6a" strength={0.7 * s} /><DriftSpecks f={f} box={[pos[0] - 0.75, pos[0] + 0.75, pos[1] - 0.9, pos[1] + 0.9, pos[2] + 0.05, pos[2] + 0.5]} n={Math.round(30 * s)} color="#ffd878" size={0.011} wind={[0.01, 0.12]} glow={0.8} seed={pos[0] > 5 ? 9 : 2} /></> : null}
    </group>
  );
};

// ---------------------------------------------------------------- the brazier, the crucible, the mould, the pour
/** copper brazier on three legs: a faceted bowl with a rim, red coals that glow, a warm light, drifting embers. glow 0..1. pos = the middle of the foot. */
export const LoThan: React.FC<{pos: V3; f?: number; glow?: number}> = ({pos, f = 0, glow = 1}) => (
  <group position={pos}>
    {[0, 1, 2].map((i) => { const a = (i / 3) * Math.PI * 2 + 0.4; return <mesh key={i} position={[Math.cos(a) * 0.2, 0.27, Math.sin(a) * 0.2]} rotation={[Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22]} castShadow><boxGeometry args={[0.045, 0.54, 0.045]} /><meshLambertMaterial color="#6a4a2a" /></mesh>; })}
    <FacetLathe profile={[[0.0, 0.52], [0.22, 0.54], [0.34, 0.66], [0.36, 0.78], [0.33, 0.8], [0.3, 0.7], [0.2, 0.62], [0.0, 0.6]]} sides={10} color="#b8683a" tones={[0.85, 1, 1.15, 1.05, 0.9, 1.1]} contact={false} pos={[0, 0, 0]} />
    <mesh position={[0, 0.74, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.3, 10]} /><meshBasicMaterial color={new THREE.Color('#ff5a1a').lerp(new THREE.Color('#2a1a14'), 1 - glow)} /></mesh>
    {Array.from({length: 9}, (_, i) => { const r = rnd(i * 5 + 1), a = r() * 6.28, d = r() * 0.22; return <mesh key={i} position={[Math.cos(a) * d, 0.745, Math.sin(a) * d]} rotation={[-Math.PI / 2, 0, r() * 3]} scale={[0.07 + r() * 0.05, 0.05 + r() * 0.04, 1]}><circleGeometry args={[1, 5]} /><meshBasicMaterial color={r() < 0.4 ? '#ffd27a' : '#ff8a2a'} transparent opacity={0.4 + 0.6 * glow * (0.7 + 0.3 * Math.sin(f * 0.3 + i))} /></mesh>; })}
    {glow > 0 ? <><Halo pos={[0, 0.9, 0.2]} r={1.1} color="#ff8a3a" strength={0.5 * glow} /><pointLight position={[0, 1.0, 0.45]} color="#ff8a3a" intensity={1.6 * glow} distance={3.2} decay={1.8} />
      <Embers f={f} box={[-0.2, 0.2, 0.8, 1.7, -0.2, 0.2]} n={Math.round(9 * glow)} size={0.016} life={50} seed={3} color="#ffb24a" /></> : null}
  </group>
);
/** a clay crucible (tall, narrow mouth) with a molten top; tilt in radians about z (towards -x when positive, the lip leading the pour) */
export const ChenNung: React.FC<{pos: V3; tilt?: number; heat?: number; f?: number}> = ({pos, tilt = 0, heat = 1, f = 0}) => (
  <group position={pos} rotation={[0, 0, tilt]}>
    <FacetLathe profile={[[0.0, 0.0], [0.09, 0.0], [0.13, 0.08], [0.14, 0.2], [0.11, 0.27], [0.1, 0.3], [0.12, 0.31], [0.115, 0.285]]} sides={9} color="#4a4038" tones={[0.85, 1, 1.15, 0.95, 1.1]} contact={false} />
    <B p={[0.5, 0.15, 0]} s={[0.78, 0.024, 0.024]} c="#26262a" cast={false} /><mesh position={[0.1, 0.15, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.13, 0.012, 5, 14, Math.PI * 1.1]} /><meshLambertMaterial color="#26262a" /></mesh>
    <mesh position={[0, 0.29, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.1, 9]} /><meshBasicMaterial color={new THREE.Color('#ffe9a8').lerp(new THREE.Color('#ff6a1a'), 0.35 + 0.15 * Math.sin(f * 0.4))} /></mesh>
    {heat > 0 ? <><Halo pos={[0, 0.3, 0.1]} r={0.5} color="#ffb04a" strength={0.55 * heat} /><pointLight position={[0, 0.4, 0.3]} color="#ff9a3a" intensity={1.2 * heat} distance={2.4} decay={1.8} /></> : null}
  </group>
);
/** a low mould: a dark iron box on a stone block with a channel; fill 0..1 = the molten iron lying in the channel (a glowing strip with a halo) */
export const Khuon: React.FC<{pos: V3; fill?: number; f?: number}> = ({pos, fill = 0, f = 0}) => (
  <group position={pos}>
    <B p={[0, 0.22, 0]} s={[0.62, 0.44, 0.5]} c="#8a8274" /><B p={[0, 0.2, 0.255]} s={[0.6, 0.02, 0.01]} c="#5a5448" cast={false} />
    <B p={[0, 0.48, 0]} s={[0.5, 0.08, 0.34]} c="#2e2c30" /><B p={[0, 0.535, 0]} s={[0.5, 0.012, 0.34]} c="#4a4850" cast={false} />
    <mesh position={[0, 0.545, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.36, 0.12]} /><meshBasicMaterial color={new THREE.Color('#2a2024').lerp(new THREE.Color('#ff7a22'), fill)} /></mesh>
    {fill > 0 ? <><mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.3 * fill, 0.07]} /><meshBasicMaterial color="#ffe9a8" /></mesh><Halo pos={[0, 0.62, 0.16]} r={0.7} color="#ff9a3a" strength={0.6 * fill} /><pointLight position={[0, 0.8, 0.3]} color="#ff8a2a" intensity={1.3 * fill} distance={2.6} decay={1.8} /></> : null}
  </group>
);
/** The stream of molten iron from `from` (the lip) down to `to` (the mould): white-yellow core, orange and red skins, a flare where it lands, sparks; k 0..1 = how strong it runs. */
export const DongSat: React.FC<{from: V3; to: V3; k?: number; f?: number}> = ({from, to, k = 1, f = 0}) => {
  if (k <= 0.02) return null;
  const n = 6, pts: V3[] = Array.from({length: n + 1}, (_, i) => { const t = i / n; return [from[0] + (to[0] - from[0]) * t + Math.sin(f * 0.5 + t * 6) * 0.004 * t, from[1] + (to[1] - from[1]) * t * t * 0.0 + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t] as V3; });
  const seg = (w: number, col: string, op: number, key: string) => pts.slice(1).map((p1, i) => { const p0 = pts[i], len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); return <mesh key={`${key}${i}`} position={[(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2 + 0.01]} rotation={[0, 0, ang]} renderOrder={8}><planeGeometry args={[len + 0.004, w * k]} /><meshBasicMaterial color={col} transparent opacity={op} depthWrite={false} /></mesh>; });
  return (
    <group>
      {seg(0.05, '#d6481a', 0.85, 'o')}{seg(0.032, '#ff8a2a', 0.95, 'm')}{seg(0.014, '#fff0b8', 1, 'c')}
      <Halo pos={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, from[2] + 0.12]} r={0.45} color="#ff9a3a" strength={0.45 * k} />
      <Halo pos={[to[0], to[1] + 0.05, to[2] + 0.1]} r={0.5} color="#ffd27a" strength={0.7 * k} />
      <Embers f={f} box={[to[0] - 0.12, to[0] + 0.12, to[1], to[1] + 0.5, to[2] - 0.05, to[2] + 0.1]} n={Math.round(12 * k)} size={0.012} life={26} seed={7} color="#ffd27a" />
    </group>
  );
};
/** where the crucible is at `nung` 0..1 (0 resting on the brazier, 1 tipped over the mould) and its tilt; the pour starts when nung > 0.5 */
export const chenTai = (rest: V3, over: V3, nung: number) => { const t = ease(clamp(nung)); const p = L2(rest, over, t); p[1] += Math.sin(t * Math.PI) * 0.14; return {pos: p, tilt: clamp((nung - 0.35) / 0.55) * 1.25 * Math.sign(over[0] - rest[0] || 1) * -1}; };

// ---------------------------------------------------------------- low furniture
/** A low scripture table (a lacquered top with a painted apron and a drawer, short turned legs) and the book, a tray and a lamp on it. pos = the middle of its foot. */
export const BanKinh: React.FC<{pos: V3; rotY?: number; s?: number}> = ({pos, rotY = 0, s = 1}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={s}>
    <B p={[0, 0.34, 0]} s={[1.2, 0.07, 0.52]} c="#a2342a" /><B p={[0, 0.3, 0.262]} s={[1.2, 0.09, 0.012]} c="#d6a742" cast={false} /><B p={[0, 0.21, 0.262]} s={[1.14, 0.1, 0.012]} c="#2f4a73" cast={false} />
    {[-0.54, 0.54].map((x) => [-0.2, 0.2].map((z) => <B key={`${x}${z}`} p={[x, 0.15, z]} s={[0.08, 0.3, 0.08]} c="#7e2a26" />))}
    <B p={[-0.25, 0.393, 0]} s={[0.46, 0.04, 0.32]} c="#efe6d2" cast={false} /><B p={[-0.25, 0.4, 0.1]} s={[0.46, 0.02, 0.1]} c="#d6a742" cast={false} /><B p={[0.3, 0.38, -0.04]} s={[0.26, 0.016, 0.2]} c="#c9902f" cast={false} />
    <mesh position={[0.4, 0.43, 0.14]}><boxGeometry args={[0.07, 0.07, 0.07]} /><meshLambertMaterial color="#c9a24a" /></mesh><mesh position={[0.4, 0.485, 0.14]} scale={[0.4, 1, 1]}><circleGeometry args={[0.02, 8]} /><meshBasicMaterial color="#ffe9a8" /></mesh>
  </group>
);
/** A square cushion with a woven top, a dark side and a tassel at each corner (flat). */
export const Dem: React.FC<{pos: V3; w?: number; rotY?: number; col?: number}> = ({pos, w = 0.7, rotY = 0, col = 0}) => {
  const cs = [['#2f4a73', '#d6a742'], ['#8a2f28', '#efe6d2'], ['#3f6a4a', '#d6a742']][col % 3];
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <B p={[0, 0.06, 0]} s={[w, 0.12, w]} c={cs[0]} /><B p={[0, 0.124, 0]} s={[w * 0.76, 0.006, w * 0.76]} c={cs[1]} cast={false} /><B p={[0, 0.128, 0]} s={[w * 0.4, 0.006, w * 0.4]} c={cs[0]} cast={false} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => <B key={i} p={[x * (w / 2 + 0.01), 0.1, z * (w / 2 + 0.01)]} s={[0.035, 0.06, 0.035]} c={cs[1]} cast={false} />)}
    </group>
  );
};
/** A sleeping mattress laid on the floor: a thick cotton pad (blue and cream stripes) with a rolled bolster at the head end (the left end). l along x. */
export const Nem: React.FC<{pos: V3; l?: number; d?: number}> = ({pos, l = 1.95, d = 0.72}) => {
  const map = useMemo(() => tex('dh-nem', 256, 96, (c, W, H) => { c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, W, H); c.fillStyle = '#2f4a73'; for (let x = 10; x < W; x += 36) c.fillRect(x, 0, 14, H); c.fillStyle = '#a2342a'; c.fillRect(0, 0, W, 8); c.fillRect(0, H - 8, W, 8); }), []);
  return (
    <group position={pos}>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow><boxGeometry args={[l, 0.12, d]} /><meshLambertMaterial map={map} /></mesh>
      <B p={[-l / 2 + 0.2, 0.17, 0]} s={[0.34, 0.12, d - 0.1]} c="#efe6d2" /><B p={[-l / 2 + 0.2, 0.235, 0]} s={[0.3, 0.012, d - 0.14]} c="#a2342a" cast={false} />
    </group>
  );
};
