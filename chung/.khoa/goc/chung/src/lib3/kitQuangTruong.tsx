import React, {useMemo} from 'react';
import * as THREE from 'three';
import {NguonBui} from './buiNguon';
import {rnd, P, Ctx, Sprite} from './depth';
import {B} from './kit';
import {tex, HoledWall} from './kitLab';
import {StoneBox, stoneTex} from './kitForge';
import {paintPlanks} from './kitCamp';
import {Halo} from './look';

/** lib3/kitQuangTruong (23/11/2026): the pieces of the town of Latveria's capital square (src/demo/QuangTruong.tsx, chapter 10, 11, 15, 16).
 *  A TOWN in cut paper: steep-roofed half-timbered houses with gable ends to the street (plaster in four warm tints, dark frame, shutters,
 *  flower boxes, a shop sign), a stone gate tower, a guard post with an empty cell, market stalls, a stone statue and bunting.
 *  Metres, y up. Houses stand with their front face on z = 0 of their own group and go back to -d; a group turned by +-PI/2 faces along x. */
type V3 = [number, number, number];

// ---------------------------------------------------------------- the houses
export type CasaLook = {wall: string; wall2: string; beam: string; shutter: string; glass: string; roof: string; roofDark: string; flower: string[]};
export const CASA_LOOKS: CasaLook[] = [
  {wall: '#f0e2c0', wall2: '#d8c79c', beam: '#5a3d2a', shutter: '#3f7a4a', glass: '#7f95aa', roof: '#c9573c', roofDark: '#a44331', flower: ['#e0405a', '#f4c542']},
  {wall: '#f3d9ae', wall2: '#dcbc88', beam: '#4f3626', shutter: '#b24a3c', glass: '#86a0b4', roof: '#bf5a3a', roofDark: '#9a4630', flower: ['#f2f0e8', '#e8708a']},
  {wall: '#dde8d0', wall2: '#bccdb0', beam: '#4a3a2e', shutter: '#c9962f', glass: '#7e94a8', roof: '#b9503a', roofDark: '#963f2e', flower: ['#e0405a', '#f6f0e0']},
  {wall: '#ecd3c2', wall2: '#d3b09c', beam: '#54382a', shutter: '#2f5f8a', glass: '#8aa0b4', roof: '#a85a46', roofDark: '#864636', flower: ['#f4c542', '#e8708a']},
  {wall: '#d5dcdc', wall2: '#b4c0c2', beam: '#4a3d34', shutter: '#8a3a34', glass: '#7a90a4', roof: '#7e8aa2', roofDark: '#626e88', flower: ['#e0405a', '#f4c542']},
];
/** set the context font so `text` is at most maxW wide, starting from `size` px */
const fit = (c: Ctx, text: string, maxW: number, size: number, face: string) => { c.font = `bold ${size}px ${face}`; const w = c.measureText(text).width; if (w > maxW) c.font = `bold ${Math.floor(size * maxW / w)}px ${face}`; };
const lighten = (hex: string, k: number) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();

/** the face of a gable-front house on a canvas W x H (a rectangle of wall under a triangle); base of the wall at the bottom edge */
export const paintCasa = (o: {w: number; hW: number; ridge: number; look: CasaLook; seed: number; floors?: number; shop?: 'banh' | 'hoa' | 'ruou' | null; lit?: number}) => (c: Ctx, W: number, H: number) => {
  const r = rnd(o.seed), ppm = W / o.w, L = o.look, n = o.floors ?? 2, pH = 0.9, fh = (o.hW - pH) / n, nb = Math.max(2, Math.round(o.w / 1.45)), bw = o.w / nb;
  const Y = (m: number) => H - m * ppm, X = (m: number) => m * ppm;
  c.clearRect(0, 0, W, H);
  c.save(); c.beginPath(); c.moveTo(0, Y(0)); c.lineTo(W, Y(0)); c.lineTo(W, Y(o.hW)); c.lineTo(W / 2, Y(o.hW + o.ridge)); c.lineTo(0, Y(o.hW)); c.closePath(); c.clip();
  c.fillStyle = L.wall; c.fillRect(0, 0, W, H);
  // plaster: broad tints, damp streaks, a few flaked patches showing brick
  for (let i = 0; i < 16; i++) { c.globalAlpha = 0.3; c.fillStyle = r() < 0.5 ? L.wall2 : lighten(L.wall, 1.06); c.fillRect(r() * W, r() * H, X(0.5 + r() * 1.3), X(0.4 + r() * 1.1)); }
  c.globalAlpha = 1;
  for (let i = 0; i < 5; i++) { const px = X(0.3 + r() * (o.w - 0.6)), py = Y(pH + r() * (o.hW - pH - 0.6)); P(c, [[px, py], [px + X(0.34), py + X(0.05)], [px + X(0.3), py + X(0.28)], [px + X(0.04), py + X(0.22)]], '#b9694a'); c.strokeStyle = 'rgba(70,40,30,0.4)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px + X(0.02), py + X(0.12)); c.lineTo(px + X(0.3), py + X(0.14)); c.stroke(); }
  // stone plinth
  c.fillStyle = '#8f8a80'; c.fillRect(0, Y(pH), W, X(pH));
  for (let row = 0; row < 4; row++) for (let x = (row % 2) * X(0.2); x < W; x += X(0.45 + r() * 0.2)) { c.fillStyle = ['#a39e92', '#827d73', '#97928a', '#6f6b63'][Math.floor(r() * 4)]; c.fillRect(x + 1, Y(pH) + row * X(pH / 4) + 1, X(0.4) - 2, X(pH / 4) - 2); }
  // the frame: floor beams, posts, braces
  const beam = L.beam, bt = X(0.17);
  for (let k = 0; k <= n; k++) { const y = Y(pH + k * fh); c.fillStyle = beam; c.fillRect(0, y - bt / 2, W, bt); if (k && k < n + 1) for (let x = X(0.12); x < W; x += X(0.34)) { c.fillStyle = lighten(beam, 0.8); c.fillRect(x, y + bt / 2, X(0.12), X(0.07)); } }
  for (let i = 0; i <= nb; i++) { c.fillStyle = beam; c.fillRect(Math.min(W - bt, Math.max(0, i * X(bw) - bt / 2)), Y(pH + n * fh), bt, X(n * fh)); }
  c.strokeStyle = beam; c.lineWidth = X(0.13); c.lineCap = 'butt';
  for (let k = 0; k < n; k++) for (const i of [0, nb - 1]) { const x0 = i * X(bw), y0 = Y(pH + k * fh), y1 = Y(pH + (k + 1) * fh); c.beginPath(); if (i === 0) { c.moveTo(x0 + bt / 2, y0 - bt / 2); c.lineTo(x0 + X(bw) * 0.3, y1 + bt / 2); } else { c.moveTo(x0 + X(bw) - bt / 2, y0 - bt / 2); c.lineTo(x0 + X(bw) * 0.7, y1 + bt / 2); } c.stroke(); }
  // windows (ground floor: a door and, if a shop, a wide shop window)
  const doorBay = Math.floor(r() * nb);
  const win = (cx: number, base: number, ww: number, hh: number, lit: boolean, box: boolean) => {
    const x0 = X(cx - ww / 2), y0 = Y(base + hh), w = X(ww), h = X(hh), sw = X(ww * 0.36);
    c.fillStyle = L.shutter; [[x0 - sw - 2, sw], [x0 + w + 2, sw]].forEach(([sx, s]) => { c.fillRect(sx, y0, s, h); c.strokeStyle = lighten(L.shutter, 0.7); c.lineWidth = 1.4; for (let yy = y0 + X(0.07); yy < y0 + h; yy += X(0.09)) { c.beginPath(); c.moveTo(sx + 2, yy); c.lineTo(sx + s - 2, yy); c.stroke(); } });
    c.fillStyle = '#f2ead6'; c.fillRect(x0 - 3, y0 - 3, w + 6, h + 6);
    const g = c.createLinearGradient(0, y0, 0, y0 + h); if (lit) { g.addColorStop(0, '#ffd77a'); g.addColorStop(1, '#f6a94e'); } else { g.addColorStop(0, lighten(L.glass, 1.15)); g.addColorStop(1, lighten(L.glass, 0.78)); } c.fillStyle = g; c.fillRect(x0, y0, w, h);
    if (lit) { c.fillStyle = 'rgba(190,70,60,0.5)'; c.fillRect(x0, y0, w * 0.22, h); c.fillRect(x0 + w * 0.78, y0, w * 0.22, h); }
    c.strokeStyle = '#f2ead6'; c.lineWidth = X(0.035); c.beginPath(); c.moveTo(x0 + w / 2, y0); c.lineTo(x0 + w / 2, y0 + h); c.moveTo(x0, y0 + h * 0.42); c.lineTo(x0 + w, y0 + h * 0.42); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.28)'; c.beginPath(); c.moveTo(x0 + w * 0.08, y0 + h * 0.36); c.lineTo(x0 + w * 0.3, y0 + 2); c.lineTo(x0 + w * 0.4, y0 + 2); c.lineTo(x0 + w * 0.15, y0 + h * 0.36); c.fill();
    c.fillStyle = 'rgba(80,60,40,0.16)'; c.fillRect(x0 - sw, y0 + h + 3, w + sw * 2, X(0.7));   // damp under the sill
    if (box) { c.fillStyle = '#6a4a30'; c.fillRect(x0 - 4, y0 + h + 3, w + 8, X(0.14)); for (let i = 0; i < 6; i++) { const fx = x0 + 3 + (i + 0.5) * (w / 6), fy = y0 + h - X(0.02) - r() * X(0.06); P(c, [[fx - 5, y0 + h + 4], [fx, fy - X(0.1)], [fx + 5, y0 + h + 4]], '#3f7a3c'); c.fillStyle = L.flower[i % 2]; c.fillRect(fx - 4, fy - X(0.12), 8, 7); } }
  };
  for (let k = 0; k < n; k++) for (let i = 0; i < nb; i++) {
    const cx = (i + 0.5) * bw, base = pH + k * fh + fh * 0.18, lit = r() < (o.lit ?? 0);
    if (k === 0 && i === doorBay) {
      const dw = Math.min(bw * 0.62, 1.0), dh = Math.min(fh * 0.8, 2.0), x0 = X(cx - dw / 2), y0 = Y(pH + dh);
      c.fillStyle = '#4a3322'; c.beginPath(); c.moveTo(x0 - 4, Y(pH)); c.lineTo(x0 - 4, y0 + X(dw / 2)); c.arc(x0 + X(dw) / 2, y0 + X(dw / 2), X(dw) / 2 + 4, Math.PI, 0); c.lineTo(x0 + X(dw) + 4, Y(pH)); c.fill();
      c.fillStyle = '#7b5230'; c.beginPath(); c.moveTo(x0, Y(pH)); c.lineTo(x0, y0 + X(dw / 2)); c.arc(x0 + X(dw) / 2, y0 + X(dw / 2), X(dw) / 2, Math.PI, 0); c.lineTo(x0 + X(dw), Y(pH)); c.fill();
      c.strokeStyle = '#4c3220'; c.lineWidth = 1.6; for (let xx = x0 + X(dw) / 5; xx < x0 + X(dw); xx += X(dw) / 5) { c.beginPath(); c.moveTo(xx, Y(pH)); c.lineTo(xx, y0 + X(dw / 2) * (Math.abs(xx - (x0 + X(dw) / 2)) < X(dw) / 4 ? 0.2 : 0.7)); c.stroke(); }
      c.fillStyle = '#2d2a28'; [0.35, 0.75].forEach((q) => c.fillRect(x0, Y(pH + dh * q), X(dw) * 0.55, 5)); c.fillStyle = '#d7b252'; c.fillRect(x0 + X(dw) * 0.78, Y(pH + dh * 0.45), 6, 6);
    } else if (k === 0 && o.shop && i === (doorBay + 1) % nb) {
      const ww = bw * 0.84, x0 = X((i + 0.5) * bw - ww / 2), y0 = Y(pH + fh * 0.72);
      c.fillStyle = '#4a3322'; c.fillRect(x0 - 4, y0 - 4, X(ww) + 8, X(fh * 0.56) + 8); c.fillStyle = '#ffd98a'; c.fillRect(x0, y0, X(ww), X(fh * 0.56));
      c.fillStyle = 'rgba(120,70,40,0.3)'; c.fillRect(x0, y0 + X(fh * 0.34), X(ww), X(fh * 0.22));
      const col = o.shop === 'banh' ? '#d49a4e' : o.shop === 'hoa' ? '#e0405a' : '#7a3a34';
      for (let j = 0; j < 5; j++) { c.fillStyle = col; c.beginPath(); c.ellipse(x0 + X(ww) * (0.12 + j * 0.19), y0 + X(fh * 0.5), X(0.17), X(0.08), 0, 0, 7); c.fill(); }
      for (let j = 0; j < 8; j++) { c.fillStyle = j % 2 ? '#2f7a40' : '#f4efdf'; c.fillRect(x0 - 5 + j * (X(ww) + 10) / 8, y0 - X(0.34), (X(ww) + 10) / 8, X(0.3)); } P(c, [[x0 - 5, y0 - X(0.04)], [x0 + X(ww) + 5, y0 - X(0.04)], [x0 + X(ww) + 5, y0 - X(0.02)]], '#3a2a20');
    } else win(cx, base, Math.min(bw * 0.5, 0.82), fh * 0.6, lit, k >= 0);
  }
  // the gable: fan of braces, an attic window, the barge boards with a scalloped edge
  const gy = Y(o.hW);
  c.strokeStyle = beam; c.lineWidth = X(0.12); c.beginPath(); c.moveTo(W / 2, Y(o.hW + o.ridge)); c.lineTo(W / 2, gy); [[0.18, 0.62], [0.82, 0.62]].forEach(([a, b]) => { c.moveTo(X(o.w * a), gy); c.lineTo(W / 2, Y(o.hW + o.ridge * b)); }); c.stroke();
  win(o.w / 2 + o.w * 0.0, o.hW + 0.28, 0.5, Math.min(0.75, o.ridge * 0.34), r() < (o.lit ?? 0), false);
  c.strokeStyle = beam; c.lineWidth = X(0.26); c.lineJoin = 'miter'; c.beginPath(); c.moveTo(-4, gy + 2); c.lineTo(W / 2, Y(o.hW + o.ridge) - 1); c.lineTo(W + 4, gy + 2); c.stroke();
  c.fillStyle = lighten(beam, 0.7); for (let t = 0.04; t < 0.5; t += 0.07) { const px = W * t, py = gy + (Y(o.hW + o.ridge) - gy) * (t / 0.5); P(c, [[px - 5, py + X(0.12)], [px, py + X(0.28)], [px + 5, py + X(0.12)]], beam); P(c, [[W - px - 5, py + X(0.12)], [W - px, py + X(0.28)], [W - px + 5, py + X(0.12)]], beam); }
  // a hanging sign for a shop, on the corner of the first floor
  if (o.shop) { const sx = X(o.w - 0.55), sy = Y(pH + fh * 0.9); c.fillStyle = '#2d2a28'; c.fillRect(sx - X(0.45), sy - X(0.5), X(0.5), 4); c.fillStyle = '#e8c27a'; c.beginPath(); c.arc(sx, sy, X(0.26), 0, 7); c.fill(); c.strokeStyle = '#4a3322'; c.lineWidth = 3; c.stroke();
    c.fillStyle = o.shop === 'banh' ? '#b86a2c' : o.shop === 'hoa' ? '#d03a54' : '#6a3a34'; c.beginPath(); c.ellipse(sx, sy, X(0.14), X(0.09), 0.4, 0, 7); c.fill(); }
  c.restore();
};
/** roof tiles: rows of scalloped tiles in two tones, a darker lower edge; W x H canvas covers a slope of (Wm x Hm) */
export const paintTiles = (seed: number, col: string, dark: string, Wm: number, Hm: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / Wm, th = 0.3 * ppm, tw = 0.24 * ppm;
  c.fillStyle = dark; c.fillRect(0, 0, W, H);
  for (let y = 0, row = 0; y < H; y += th, row++) for (let x = (row % 2) * tw / 2 - tw; x < W + tw; x += tw) {
    c.fillStyle = [col, lighten(col, 1.08), lighten(col, 0.92), col][Math.floor(r() * 4)]; c.beginPath(); c.moveTo(x + 1, y); c.lineTo(x + tw - 1, y); c.lineTo(x + tw - 1, y + th * 0.6); c.quadraticCurveTo(x + tw / 2, y + th * 1.15, x + 1, y + th * 0.6); c.fill();
    c.strokeStyle = dark; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + 1, y + th * 0.6); c.quadraticCurveTo(x + tw / 2, y + th * 1.15, x + tw - 1, y + th * 0.6); c.stroke();
  }
  if (r() < 2) for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(70,90,50,0.35)'; c.fillRect(r() * W, r() * H, 14 + r() * 24, 6); }   // moss
};
const faceGeo = (w: number, hW: number, ridge: number) => {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, hW); s.lineTo(0, hW + ridge); s.lineTo(-w / 2, hW); s.closePath();
  const g = new THREE.ShapeGeometry(s), p = g.attributes.position as THREE.BufferAttribute, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + w / 2) / w; uv[i * 2 + 1] = p.getY(i) / (hW + ridge); }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
};
const prismGeo = (w: number, hW: number, ridge: number, d: number) => {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, hW); s.lineTo(0, hW + ridge); s.lineTo(-w / 2, hW); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth: d, bevelEnabled: false}); g.translate(0, 0, -d); return g;
};
/** One house: the painted gable face, the side walls and gable fill, two tile slopes with an overhang, a chimney. d = depth; the face is on z = 0. */
export const Casa: React.FC<{pos: V3; rotY?: number; w?: number; hW?: number; ridge?: number; d?: number; look?: number; seed?: number; floors?: number; shop?: 'banh' | 'hoa' | 'ruou' | null; lit?: number; chimney?: number; f?: number; smoke?: boolean}> =
  ({pos, rotY = 0, w = 4.2, hW = 5.4, ridge = 2.4, d = 6, look = 0, seed = 1, floors = 2, shop = null, lit = 0, chimney, f = 0, smoke = false}) => {
    const L = CASA_LOOKS[look % CASA_LOOKS.length], key = `qt-casa-${w}-${hW}-${ridge}-${look}-${seed}-${floors}-${shop}-${lit}`;
    const ppm = 78, face = useMemo(() => tex(key, Math.round(w * ppm), Math.round((hW + ridge) * ppm), paintCasa({w, hW, ridge, look: L, seed, floors, shop, lit})), [key]);
    const geoF = useMemo(() => faceGeo(w, hW, ridge), [w, hW, ridge]), geoP = useMemo(() => prismGeo(w - 0.02, hW, ridge, d), [w, hW, ridge, d]);
    const ov = 0.42, half = w / 2 + ov, rise = ridge * (half / (w / 2)), ang = Math.atan2(rise, half), Ls = Math.hypot(half, rise), dd = d + 0.5;
    const roofTex = useMemo(() => tex(`qt-roof-${L.roof}-${Ls.toFixed(1)}-${dd.toFixed(1)}-${seed % 3}`, Math.round(Ls * 44), Math.round(dd * 44), paintTiles(seed % 3 + 5, L.roof, L.roofDark, Ls, dd)), [L.roof, Ls, dd, seed]);
    const mats = useMemo(() => [0, 1, 2, 3, 4, 5].map((i) => new THREE.MeshLambertMaterial(i === 2 ? {map: roofTex} : {color: L.roofDark})), [roofTex, L.roofDark]);
    const cx = chimney ?? (seed % 2 ? 0.3 : -0.3) * w / 2;
    return (
      <group position={pos} rotation={[0, rotY, 0]}>
        <mesh geometry={geoF} receiveShadow castShadow><meshLambertMaterial map={face} transparent alphaTest={0.4} side={THREE.DoubleSide} /></mesh>
        <mesh geometry={geoP} position={[0, 0, -0.04]} castShadow receiveShadow><meshLambertMaterial color={L.wall2} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[s * (half / 2) , hW + (ridge - rise / 2) - 0.0, -d / 2 + 0.22]} rotation={[0, 0, s * -ang]} material={mats} castShadow receiveShadow><boxGeometry args={[Ls, 0.13, dd]} /></mesh>)}
        <B p={[cx, hW + ridge * 0.55 + 0.3, -d * 0.45]} s={[0.62, 1.7, 0.62]} c="#a4533e" /><B p={[cx, hW + ridge * 0.55 + 1.2, -d * 0.45]} s={[0.78, 0.14, 0.78]} c="#6f6a64" />
        {smoke ? Array.from({length: 5}, (_, i) => { const t = ((f + i * 22 + seed * 13) % 110) / 110; return <mesh key={i} position={[cx + t * 0.9 + Math.sin(f * 0.05 + i) * 0.1, hW + ridge * 0.55 + 1.4 + t * 2.6, -d * 0.45]} rotation={[0, 0, i + f * 0.01]} scale={0.22 + t * 0.45} renderOrder={3}><circleGeometry args={[1, 7]} /><meshBasicMaterial color={t < 0.5 ? '#f1ece4' : '#dcd5cc'} transparent opacity={0.8 * Math.sin(Math.PI * Math.min(1, t * 1.15))} depthWrite={false} /></mesh>; }) : null}
      </group>
    );
  };

// ---------------------------------------------------------------- the paving
/** cobbles: rows of rounded stones in warm greys, and round the statue at (cx, cz) rings of stones laid along arcs, eight pale spokes, a pale outer band */
export const paintCobbles = (Wm: number, Hm: number, cx: number, cz: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(41), ppm = W / Wm, tones = ['#a39a8c', '#948b7e', '#b0a698', '#877f74', '#9d9486', '#bab0a0', '#8d8478'];
  c.fillStyle = '#5c564e'; c.fillRect(0, 0, W, H);
  const stone = (x: number, y: number, w: number, h: number, t: string) => { c.fillStyle = t; c.beginPath(); c.roundRect(x + 1, y + 1, w - 2, h - 2, Math.min(w, h) * 0.28); c.fill(); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(x + 3, y + 3, w * 0.5, 2); };
  for (let y = 0, row = 0; y < H; y += 0.34 * ppm, row++) for (let x = (row % 2) * 0.2 * ppm - 0.3 * ppm; x < W; x += (0.3 + r() * 0.16) * ppm) stone(x, y, 0.34 * ppm, 0.34 * ppm, tones[Math.floor(r() * tones.length)]);
  const X0 = cx * ppm, Y0 = cz * ppm;
  c.save(); c.beginPath(); c.arc(X0, Y0, 7.7 * ppm, 0, 7); c.clip(); c.fillStyle = '#5c564e'; c.fillRect(0, 0, W, H);
  for (let k = 0, rad = 1.9; rad < 7.7; k++, rad += 0.36) {
    const nS = Math.floor((2 * Math.PI * rad) / 0.4), pale = k % 4 === 3;
    for (let i = 0; i < nS; i++) { c.save(); c.translate(X0, Y0); c.rotate((i / nS) * 6.2832 + (k % 2) * 0.05); const t = pale ? ['#c9c0ae', '#bfb5a2'][i % 2] : tones[Math.floor(r() * tones.length)]; c.fillStyle = t; c.beginPath(); c.roundRect(rad * ppm + 1, -0.17 * ppm, 0.33 * ppm - 2, 0.34 * ppm, 5); c.fill(); c.restore(); }
  }
  for (let a = 0; a < 8; a++) for (let rad = 2.0; rad < 7.6; rad += 0.38) { c.save(); c.translate(X0, Y0); c.rotate((a / 8) * 6.2832 + 0.39); c.fillStyle = r() < 0.5 ? '#d3cab8' : '#c4baa6'; c.beginPath(); c.roundRect(rad * ppm, -0.14 * ppm, 0.34 * ppm, 0.28 * ppm, 5); c.fill(); c.restore(); }
  c.restore();
  c.strokeStyle = '#d0c7b4'; c.lineWidth = 0.28 * ppm; c.beginPath(); c.arc(X0, Y0, 7.85 * ppm, 0, 7); c.stroke(); c.strokeStyle = '#5c564e'; c.lineWidth = 3; c.setLineDash([0.3 * ppm, 0.08 * ppm]); c.beginPath(); c.arc(X0, Y0, 7.85 * ppm, 0, 7); c.stroke(); c.setLineDash([]);
  for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(70,100,50,${0.2 + r() * 0.25})`; c.fillRect(r() * W, r() * H, 3 + r() * 9, 2 + r() * 4); }   // weeds in the joints
  for (let i = 0; i < 18; i++) { c.fillStyle = 'rgba(40,36,30,0.12)'; c.beginPath(); c.ellipse(r() * W, r() * H, 20 + r() * 50, 8 + r() * 18, 0, 0, 7); c.fill(); }
};

// ---------------------------------------------------------------- the statue's pedestal and the banner
const shade = (hex: string, k: number) => lighten(hex, k);
export const Pedestal: React.FC<{pos: V3}> = ({pos}) => {
  const plaque = useMemo(() => tex('qt-plaque', 512, 192, (c, W, H) => { c.fillStyle = '#7b6a3a'; c.fillRect(0, 0, W, H); c.fillStyle = '#c9a74a'; c.fillRect(8, 8, W - 16, H - 16); c.fillStyle = '#8f7430'; c.fillRect(16, 16, W - 32, H - 32); c.fillStyle = '#e8d083'; c.textAlign = 'center'; c.textBaseline = 'middle'; fit(c, 'VICTOR VON DOOM', W - 90, 76, 'Georgia, serif'); c.fillText('VICTOR VON DOOM', W / 2, H * 0.4); fit(c, 'KING AND FATHER OF LATVERIA', W - 90, 36, 'Georgia, serif'); c.fillText('KING AND FATHER OF LATVERIA', W / 2, H * 0.76); [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]].forEach(([x, y]) => { c.fillStyle = '#4a3c18'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); }); }), []);
  const L = {tones: ['#a9aaa2', '#9a9b94', '#b4b4ab', '#8e8f89'], mortar: '#5f6058', damp: 0.2, streaks: 1};
  return (
    <group position={pos}>
      <StoneBox id="qt-ped-1" p={[0, 0.16, 0]} s={[3.5, 0.32, 3.5]} look={{...L, seed: 3, course: [0.3, 0.3], len: [0.7, 1.1]}} />
      <StoneBox id="qt-ped-2" p={[0, 0.5, 0]} s={[3.0, 0.36, 3.0]} look={{...L, seed: 5, course: [0.36, 0.36], len: [0.6, 1.0]}} />
      <StoneBox id="qt-ped-3" p={[0, 1.08, 0]} s={[2.4, 0.8, 2.4]} look={{...L, seed: 7, course: [0.4, 0.4], len: [0.8, 1.2], damp: 0.4}} />
      <StoneBox id="qt-ped-4" p={[0, 1.58, 0]} s={[2.7, 0.2, 2.7]} look={{...L, seed: 9, course: [0.2, 0.2], len: [0.8, 1.2], damp: 0}} />
      <mesh position={[0, 1.08, 1.215]}><planeGeometry args={[1.7, 0.64]} /><meshBasicMaterial map={plaque} /></mesh>
      {[-0.9, 0.9].map((x) => <B key={x} p={[x, 1.08, 1.21]} s={[0.12, 0.7, 0.04]} c="#8a8b84" cast={false} />)}
      {[-1.3, 1.3].flatMap((x) => [-1.3, 1.3].map((z) => <B key={`${x}${z}`} p={[x, 0.46, z]} s={[0.24, 0.92, 0.24]} c="#8e8f89" />))}
      <B p={[0, 0.34, 1.77]} s={[1.9, 0.04, 0.9]} c="#8a8b84" cast={false} />
    </group>
  );
};
/** the mask banner: dark green, gold border, the iron mask in a hood; swallow tail. f for the sway */
export const paintMaskBanner = (c: Ctx, W: number, H: number) => {
  c.clearRect(0, 0, W, H); const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#256a36'); g.addColorStop(0.5, '#2f7a40'); g.addColorStop(1, '#205c2e');
  c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, H * 0.94); c.lineTo(W / 2, H * 0.84); c.lineTo(0, H * 0.94); c.closePath(); c.fillStyle = g; c.fill();
  c.clip(); c.strokeStyle = '#e2b843'; c.lineWidth = W * 0.045; c.stroke(); c.strokeStyle = '#9a7426'; c.lineWidth = 3; c.strokeRect(W * 0.07, W * 0.07, W * 0.86, H * 0.76);
  for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.06)'; c.fillRect(W * (k / 6), 0, W / 6, H); }
  const cx = W / 2, cy = H * 0.4, s = W / 300;
  P(c, [[cx - 120 * s, cy + 150 * s], [cx - 100 * s, cy - 120 * s], [cx, cy - 175 * s], [cx + 100 * s, cy - 120 * s], [cx + 120 * s, cy + 150 * s], [cx, cy + 190 * s]], '#173f22');   // hood
  P(c, [[cx - 78 * s, cy - 92 * s], [cx, cy - 112 * s], [cx + 78 * s, cy - 92 * s], [cx + 70 * s, cy + 40 * s], [cx + 36 * s, cy + 112 * s], [cx, cy + 128 * s], [cx - 36 * s, cy + 112 * s], [cx - 70 * s, cy + 40 * s]], '#a9b3bf');   // mask
  P(c, [[cx, cy - 112 * s], [cx + 78 * s, cy - 92 * s], [cx + 70 * s, cy + 40 * s], [cx + 36 * s, cy + 112 * s], [cx, cy + 128 * s]], '#8892a0');
  P(c, [[cx - 62 * s, cy - 36 * s], [cx - 14 * s, cy - 26 * s], [cx - 20 * s, cy - 6 * s], [cx - 62 * s, cy - 14 * s]], '#1a1d22'); P(c, [[cx + 62 * s, cy - 36 * s], [cx + 14 * s, cy - 26 * s], [cx + 20 * s, cy - 6 * s], [cx + 62 * s, cy - 14 * s]], '#1a1d22');
  P(c, [[cx - 8 * s, cy - 20 * s], [cx + 8 * s, cy - 20 * s], [cx + 14 * s, cy + 52 * s], [cx, cy + 62 * s], [cx - 14 * s, cy + 52 * s]], '#c9d1da'); P(c, [[cx - 34 * s, cy + 78 * s], [cx + 34 * s, cy + 78 * s], [cx + 26 * s, cy + 90 * s], [cx - 26 * s, cy + 90 * s]], '#1a1d22');
  c.fillStyle = '#5a6470'; [[-66, -80], [66, -80], [-60, 30], [60, 30]].forEach(([x, y]) => { c.beginPath(); c.arc(cx + x * s, cy + y * s, 4.5 * s, 0, 7); c.fill(); });
  c.fillStyle = '#e2b843'; c.beginPath(); c.moveTo(cx, H * 0.7); c.lineTo(cx + 20 * s, H * 0.74); c.lineTo(cx, H * 0.78); c.lineTo(cx - 20 * s, H * 0.74); c.fill();
};
export const MaskBanner: React.FC<{pos: V3; w?: number; h?: number; f?: number; rotY?: number}> = ({pos, w = 1.3, h = 4.2, f = 0, rotY = 0}) => {
  const map = useMemo(() => tex('qt-banner', 300, 970, paintMaskBanner), []);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <B p={[0, h + 0.1, 0]} s={[w + 0.5, 0.1, 0.1]} c="#3a2a1c" /><B p={[0, h / 2 + 0.4, -0.04]} s={[0.14, h + 1.6, 0.14]} c="#4a3622" />
      {[-1, 1].map((s) => <B key={s} p={[s * (w / 2 + 0.25), h + 0.1, 0]} s={[0.14, 0.14, 0.14]} c="#e2b843" />)}
      <group position={[0, h, 0]} rotation={[0, Math.sin(f * 0.045) * 0.16, Math.sin(f * 0.07) * 0.012]}><mesh position={[0, -h / 2, 0.03]} castShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={map} transparent alphaTest={0.4} side={THREE.DoubleSide} /></mesh></group>
    </group>
  );
};

// ---------------------------------------------------------------- strings of flags and lanterns
const flagGeo = (() => { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, -1.15); s.closePath(); return new THREE.ShapeGeometry(s); })();
export const Bunting: React.FC<{a: V3; b: V3; sag?: number; n?: number; f?: number; cols?: string[]; size?: number; seed?: number}> = ({a, b, sag = 0.7, n = 12, f = 0, cols = ['#2f7a40', '#e2b843'], size = 0.26, seed = 1}) => {
  const pts = useMemo(() => Array.from({length: n + 1}, (_, i) => { const t = i / n; return new THREE.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t); }), [a.join(), b.join(), sag, n]);
  const tube = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.012, 4), [pts]);
  return (
    <group>
      <mesh geometry={tube}><meshBasicMaterial color="#3a2f26" /></mesh>
      {pts.slice(0, n).map((p, i) => { const q = pts[i + 1], m: V3 = [(p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2], ang = Math.atan2(q.y - p.y, q.x - p.x); return <mesh key={i} geometry={flagGeo} position={m} rotation={[0, Math.sin(f * 0.09 + i * 1.3 + seed) * 0.4, ang]} scale={[size * 1.7, size * 1.0, 1]} renderOrder={3}><meshLambertMaterial color={cols[i % cols.length]} side={THREE.DoubleSide} /></mesh>; })}
    </group>
  );
};
/** hanging paper lanterns on a string (festival): flat painted lanterns, lit, each with a halo */
export const LanternString: React.FC<{a: V3; b: V3; sag?: number; n?: number; f?: number; seed?: number; lit?: number}> = ({a, b, sag = 0.9, n = 7, f = 0, seed = 1, lit = 1}) => {
  const maps = useMemo(() => ['#e8503a', '#f2b23a', '#e8503a', '#6fb04a'].map((col, k) => tex(`qt-lantern-${k}`, 96, 128, (c, W, H) => {
    c.clearRect(0, 0, W, H); c.fillStyle = '#3a2a1c'; c.fillRect(W * 0.3, 2, W * 0.4, 9); c.fillRect(W * 0.3, H - 11, W * 0.4, 9);
    const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, lighten(col, 0.8)); g.addColorStop(0.5, lighten(col, 1.35)); g.addColorStop(1, lighten(col, 0.8)); c.fillStyle = g;
    c.beginPath(); c.moveTo(W * 0.3, 10); c.lineTo(W * 0.7, 10); c.lineTo(W * 0.92, H * 0.45); c.lineTo(W * 0.7, H - 12); c.lineTo(W * 0.3, H - 12); c.lineTo(W * 0.08, H * 0.45); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(70,30,10,0.55)'; c.lineWidth = 2.2; [0.5, 0.3, 0.7].forEach((q) => { c.beginPath(); c.moveTo(W * q, 10); c.lineTo(W * (0.5 + (q - 0.5) * 1.8), H * 0.45); c.lineTo(W * q, H - 12); c.stroke(); }); c.beginPath(); c.moveTo(W * 0.08, H * 0.45); c.lineTo(W * 0.92, H * 0.45); c.stroke();
  })), []);
  const at = (t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  const tube = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({length: 13}, (_, i) => new THREE.Vector3(...at(i / 12)))), 24, 0.012, 4), [a.join(), b.join(), sag]);
  return (
    <group>
      <mesh geometry={tube}><meshBasicMaterial color="#3a2f26" /></mesh>
      {Array.from({length: n}, (_, i) => { const t = (i + 0.5) / n, p = at(t), sw = Math.sin(f * 0.05 + i * 1.7 + seed) * 0.05; return <group key={i} position={[p[0] + sw, p[1] - 0.26, p[2]]}>
        <mesh renderOrder={5}><planeGeometry args={[0.3, 0.4]} /><meshBasicMaterial map={maps[i % 4]} transparent alphaTest={0.3} side={THREE.DoubleSide} toneMapped={false} color={new THREE.Color(1, 1, 1).multiplyScalar(0.8 + 0.2 * lit)} /></mesh>
        {lit > 0 ? <Halo pos={[0, 0, 0.02]} r={0.55} color={['#ff9a4a', '#ffd070'][i % 2]} strength={0.5 * lit} /> : null}
      </group>; })}
    </group>
  );
};
/** a pennant on a roof ridge: a pole and a green swallow-tail that unfurls with `k` 0..1 */
const PENNANT = (() => { const s = new THREE.Shape(); s.moveTo(-0.4, 0.26); s.lineTo(0.5, 0.2); s.lineTo(0.3, 0); s.lineTo(0.5, -0.2); s.lineTo(-0.4, -0.26); s.closePath(); return new THREE.ShapeGeometry(s); })();
export const RoofFlag: React.FC<{pos: V3; k: number; f?: number; h?: number; seed?: number}> = ({pos, k, f = 0, h = 1.6, seed = 0}) => k <= 0.001 ? null : (
  <group position={pos}>
    <B p={[0, h / 2, 0]} s={[0.05, h, 0.05]} c="#3a2a1c" /><B p={[0, h + 0.03, 0]} s={[0.09, 0.09, 0.09]} c="#e2b843" />
    <group position={[0.02, h - 0.12, 0]} rotation={[0, Math.sin(f * 0.1 + seed) * 0.25, 0]} scale={[k, 1, 1]}>
      <mesh position={[0.42, 0, 0]} geometry={PENNANT} renderOrder={3}><meshLambertMaterial color="#2f7a40" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0.08, 0, 0.002]} renderOrder={4}><planeGeometry args={[0.14, 0.14]} /><meshBasicMaterial color="#e2b843" side={THREE.DoubleSide} /></mesh>
    </group>
  </group>
);

// ---------------------------------------------------------------- pigeons (flat), perched or flying
export const paintPigeon = (wing: number) => (c: Ctx, W: number, H: number) => {
  c.clearRect(0, 0, W, H); const s = W / 100, cy = H * 0.66;
  P(c, [[2 * s, cy + 6 * s], [24 * s, cy - 8 * s], [30 * s, cy + 6 * s]], '#4f596a');                       // tail
  c.fillStyle = '#8f99aa'; c.beginPath(); c.ellipse(46 * s, cy, 30 * s, 17 * s, -0.12, 0, 7); c.fill();       // body
  c.fillStyle = '#b4bccb'; c.beginPath(); c.ellipse(52 * s, cy + 6 * s, 20 * s, 9 * s, -0.1, 0, 7); c.fill(); // breast
  c.fillStyle = '#6a7589'; c.beginPath(); c.arc(78 * s, cy - 12 * s, 11 * s, 0, 7); c.fill();                // head
  c.fillStyle = '#6dc08e'; c.beginPath(); c.ellipse(70 * s, cy - 5 * s, 8 * s, 5 * s, 0.4, 0, 7); c.fill();  // neck sheen
  P(c, [[87 * s, cy - 14 * s], [99 * s, cy - 10 * s], [87 * s, cy - 8 * s]], '#e8a060');                      // beak
  c.fillStyle = '#e8503a'; c.beginPath(); c.arc(81 * s, cy - 14 * s, 2 * s, 0, 7); c.fill(); c.fillStyle = '#1a1a1e'; c.beginPath(); c.arc(81.5 * s, cy - 14 * s, 1 * s, 0, 7); c.fill();
  c.strokeStyle = '#c06060'; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(46 * s, cy + 15 * s); c.lineTo(46 * s, cy + 24 * s); c.moveTo(56 * s, cy + 15 * s); c.lineTo(56 * s, cy + 24 * s); c.stroke();
  if (wing === 0) { c.fillStyle = '#6a7589'; c.beginPath(); c.ellipse(40 * s, cy - 2 * s, 21 * s, 9 * s, -0.15, 0, 7); c.fill(); }
  else if (wing === 1) P(c, [[34 * s, cy - 10 * s], [52 * s, cy - 54 * s], [66 * s, cy - 50 * s], [58 * s, cy - 8 * s]], '#6a7589');
  else P(c, [[34 * s, cy - 6 * s], [54 * s, cy + 28 * s], [68 * s, cy + 24 * s], [58 * s, cy - 4 * s]], '#6a7589');
};
export const Pigeon: React.FC<{pos: V3; flip?: boolean; w?: number; wing?: 0 | 1 | 2; name?: string}> = ({pos, flip, w = 0.34, wing = 0}) =>
  <Sprite name={`qt-pigeon-${wing}`} art={paintPigeon(wing)} px={[200, 150]} w={w} pos={pos} flip={flip} shade={0} lit={false} cast={false} />;
/** a flock circling over the square (f) */
export const PigeonFlock: React.FC<{f: number; at: V3; n?: number; r?: number; seed?: number}> = ({f, at, n = 5, r = 3.2, seed = 1}) => (
  <>{Array.from({length: n}, (_, i) => { const a = f * 0.035 * (0.9 + (i % 3) * 0.1) + i * 1.25 + seed, x = at[0] + Math.cos(a) * r * (0.7 + (i % 3) * 0.2), z = at[2] + Math.sin(a) * r * 0.5, y = at[1] + Math.sin(f * 0.05 + i) * 0.5 + i * 0.18, wing = (Math.floor(f / 3 + i) % 3) as 0 | 1 | 2;
    return <Pigeon key={i} pos={[x, y, z]} flip={Math.sin(a) < 0 ? false : true} wing={wing === 0 ? 1 : wing === 1 ? 0 : 2} w={0.3} />; })}</>
);

const SCALLOP = (() => { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0.5, -0.35); s.quadraticCurveTo(0, -1.1, -0.5, -0.35); s.closePath(); return new THREE.ShapeGeometry(s); })();
// ---------------------------------------------------------------- market stalls
export const paintGoods = (kind: 'banh' | 'qua') => (c: Ctx, W: number, H: number) => {
  c.clearRect(0, 0, W, H); const r = rnd(kind === 'banh' ? 4 : 9), s = W / 200;
  if (kind === 'banh') {
    const loaf = (x: number, y: number, w: number, h: number, a: number) => { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#c98a44'; c.beginPath(); c.ellipse(0, 0, w, h, 0, 0, 7); c.fill(); c.fillStyle = '#e2a85c'; c.beginPath(); c.ellipse(-w * 0.1, -h * 0.25, w * 0.8, h * 0.55, 0, 0, 7); c.fill(); c.strokeStyle = '#a56a2e'; c.lineWidth = 2.4; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * w * 0.4 - 4, -h * 0.5); c.lineTo(i * w * 0.4 + 5, h * 0.2); c.stroke(); } c.restore(); };
    [[40, 118, 30, 14, -0.2], [86, 122, 32, 14, 0.1], [136, 118, 30, 14, 0.25], [64, 96, 28, 13, 0.3], [112, 98, 30, 13, -0.15], [160, 100, 24, 12, 0.1], [88, 76, 26, 12, 0.05]].forEach(([x, y, w, h, a]) => loaf(x * s, y * s * 0.9 + 6, w * s, h * s, a));
    for (let i = 0; i < 4; i++) { c.fillStyle = '#e8d6a8'; c.beginPath(); c.ellipse((30 + i * 44) * s, 140 * s, 18 * s, 8 * s, 0, 0, 7); c.fill(); c.strokeStyle = '#a8864a'; c.lineWidth = 2; c.stroke(); }
  } else {
    const cols = ['#d8453a', '#e8b83a', '#8fbf4a', '#d8453a', '#e8a03a'];
    for (let row = 0; row < 4; row++) for (let i = 0; i < 9 - row; i++) { const x = (20 + i * 20 + row * 10) * s, y = (140 - row * 22) * s; c.fillStyle = cols[Math.floor(r() * cols.length)]; c.beginPath(); c.ellipse(x, y, 11 * s, 10 * s, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.28)'; c.beginPath(); c.ellipse(x - 3 * s, y - 3 * s, 4 * s, 3 * s, 0, 0, 7); c.fill(); c.fillStyle = '#4a3a20'; c.fillRect(x - 1, y - 12 * s, 2, 5); }
  }
};
/** a market stall: a wooden counter (front boards, a sign), four posts, a striped awning with a scalloped edge, goods piled on it; opens to +z */
export const Stall: React.FC<{pos: V3; kind: 'banh' | 'qua'; rotY?: number; f?: number; seed?: number}> = ({pos, kind, rotY = 0, f = 0, seed = 1}) => {
  const wood = useMemo(() => tex(`qt-stall-wood-${kind}`, 256, 128, paintPlanks(seed + 3, {base: '#8a5e38', n: 5, nails: true, age: 0.5})), [kind]);
  const awn = useMemo(() => tex(`qt-awning-${kind}`, 256, 128, (c, W, H) => { const cols = kind === 'banh' ? ['#e8dcc0', '#c4553a'] : ['#e8dcc0', '#3f8a4a']; for (let i = 0; i < 8; i++) { c.fillStyle = cols[i % 2]; c.fillRect((i * W) / 8, 0, W / 8 + 1, H); } c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(0, H * 0.7, W, H * 0.3); }), [kind]);
  const sign = useMemo(() => tex(`qt-stall-sign-${kind}`, 256, 96, (c, W, H) => { c.fillStyle = '#4a3322'; c.fillRect(0, 0, W, H); c.fillStyle = kind === 'banh' ? '#e6c88a' : '#bcd8a0'; c.fillRect(6, 6, W - 12, H - 12); c.fillStyle = kind === 'banh' ? '#b4682c' : '#b8453a';
    if (kind === 'banh') { c.beginPath(); c.ellipse(W * 0.5, H * 0.52, 62, 24, 0, 0, 7); c.fill(); c.fillStyle = '#e6c88a'; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(W * 0.5 + i * 28 - 5, H * 0.34); c.lineTo(W * 0.5 + i * 28 + 8, H * 0.7); c.lineTo(W * 0.5 + i * 28 + 13, H * 0.66); c.lineTo(W * 0.5 + i * 28, H * 0.3); c.fill(); } }
    else { [[0.3, 0.5], [0.5, 0.5], [0.7, 0.5]].forEach(([x, y], i) => { c.fillStyle = ['#d8453a', '#e8b83a', '#8fbf4a'][i]; c.beginPath(); c.arc(W * x, H * y, 22, 0, 7); c.fill(); }); } }), [kind]);
  const sway = Math.sin(f * 0.05 + seed) * 0.02;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow><boxGeometry args={[2.3, 1.0, 0.9]} /><meshLambertMaterial map={wood} /></mesh>
      <B p={[0, 1.03, 0]} s={[2.4, 0.07, 1.0]} c="#6a4a2c" />
      {[-1.15, 1.15].flatMap((x) => [-0.42, 0.42].map((z) => <B key={`${x}${z}`} p={[x, 1.55, z]} s={[0.08, 1.1, 0.08]} c="#4a3322" />))}
      <B p={[0, 2.0, -0.42]} s={[2.5, 0.06, 0.06]} c="#4a3322" />
      <mesh position={[0, 2.12, 0.1]} rotation={[0.42 + sway, 0, 0]} castShadow><boxGeometry args={[2.7, 0.04, 1.35]} /><meshLambertMaterial map={awn} /></mesh>
      {Array.from({length: 8}, (_, i) => <mesh key={i} geometry={SCALLOP} position={[-1.2 + i * 0.343, 1.72, 0.74]} rotation={[0.42 + sway, 0, 0]} scale={[0.343, 0.2, 1]}><meshLambertMaterial color={i % 2 ? (kind === 'banh' ? '#c4553a' : '#3f8a4a') : '#e8dcc0'} side={THREE.DoubleSide} /></mesh>)}
      <mesh position={[0, 1.93, 0.86]} rotation={[0.1, 0, 0]}><planeGeometry args={[1.1, 0.4]} /><meshBasicMaterial map={sign} /></mesh>
      <Sprite name={`qt-goods-${kind}`} art={paintGoods(kind)} px={[400, 300]} w={1.9} pos={[0, 1.06, 0.02]} shade={0} lit={false} cast={false} />
    </group>
  );
};

// ---------------------------------------------------------------- the gate tower and its signs
export const paintSignOld = (c: Ctx, W: number, H: number) => {
  c.fillStyle = '#6f6a5e'; c.fillRect(0, 0, W, H); const r = rnd(5);
  for (let i = 0; i < 60; i++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)'; c.fillRect(r() * W, r() * H, 18 + r() * 40, 8 + r() * 14); }
  c.strokeStyle = '#4a463e'; c.lineWidth = 8; c.strokeRect(10, 10, W - 20, H - 20); c.strokeStyle = '#8a8478'; c.lineWidth = 3; c.strokeRect(22, 22, W - 44, H - 44);
  c.fillStyle = '#3a372f'; c.textAlign = 'center'; c.textBaseline = 'middle'; fit(c, 'HAASENSTADT', W - 70, H * 0.4, 'Georgia, serif'); c.fillText('HAASENSTADT', W / 2, H * 0.52);
  c.strokeStyle = 'rgba(30,28,24,0.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.64, 0); c.lineTo(W * 0.58, H * 0.5); c.lineTo(W * 0.66, H); c.stroke();
};
export const paintSignNew = (c: Ctx, W: number, H: number) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2f7a40'); g.addColorStop(1, '#1f5a2e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#e2b843'; c.lineWidth = 12; c.strokeRect(8, 8, W - 16, H - 16); c.strokeStyle = '#9a7426'; c.lineWidth = 3; c.strokeRect(24, 24, W - 48, H - 48);
  c.fillStyle = '#e8d083'; c.textAlign = 'center'; c.textBaseline = 'middle'; fit(c, 'DOOMSTADT', W - H * 0.95 - 40, H * 0.42, 'Georgia, serif'); c.fillText('DOOMSTADT', H * 0.95 + (W - H * 0.95) / 2, H * 0.53);
  const cx = H * 0.5, cy = H * 0.52, s = H / 260; P(c, [[cx - 62 * s, cy - 70 * s], [cx, cy - 92 * s], [cx + 62 * s, cy - 70 * s], [cx + 50 * s, cy + 40 * s], [cx, cy + 92 * s], [cx - 50 * s, cy + 40 * s]], '#a9b3bf'); P(c, [[cx, cy - 92 * s], [cx + 62 * s, cy - 70 * s], [cx + 50 * s, cy + 40 * s], [cx, cy + 92 * s]], '#8892a0');
  P(c, [[cx - 46 * s, cy - 26 * s], [cx - 8 * s, cy - 20 * s], [cx - 12 * s, cy - 4 * s], [cx - 46 * s, cy - 10 * s]], '#1a1d22'); P(c, [[cx + 46 * s, cy - 26 * s], [cx + 8 * s, cy - 20 * s], [cx + 12 * s, cy - 4 * s], [cx + 46 * s, cy - 10 * s]], '#1a1d22');
  c.fillStyle = '#5a6470'; [[-48, -60], [48, -60], [-40, 30], [40, 30]].forEach(([x, y]) => { c.beginPath(); c.arc(cx + x * s, cy + y * s, 4 * s, 0, 7); c.fill(); });
};
const SignPlate: React.FC<{pos: V3; w: number; h: number; id: string; art: (c: Ctx, W: number, H: number) => void; chain: number; rot?: number}> = ({pos, w, h, id, art, chain, rot = 0}) => {
  const map = useMemo(() => tex(id, Math.round(w * 190), Math.round(h * 190), art), [id]);
  return (
    <group position={pos} rotation={[0, 0, rot]}>
      <mesh position={[0, 0, 0.08]} castShadow><boxGeometry args={[w, h, 0.14]} /><meshLambertMaterial color="#4d4a43" /></mesh>
      <mesh position={[0, 0, 0.155]}><planeGeometry args={[w - 0.02, h - 0.02]} /><meshLambertMaterial map={map} /></mesh>
      {chain > 0 ? [-1, 1].map((s) => <B key={s} p={[s * (w / 2 - 0.2), h / 2 + chain / 2, 0.1]} s={[0.04, chain, 0.04]} c="#2d2a28" />) : null}
      {[-1, 1].map((s) => <B key={`h${s}`} p={[s * (w / 2 - 0.2), h / 2 + 0.03, 0.12]} s={[0.12, 0.08, 0.1]} c="#2d2a28" />)}
    </group>
  );
};
export type GateBien = 'cu' | 'moi' | {cu: number; moi: number};
/** The gate tower of the capital: a stone face with a round arch, a battlement, two arrow slits, a string course, and over the arch a sign hung from chains.
 *  bien: 'cu' = the old stone sign HAASENSTADT; 'moi' = the steel sign DOOMSTADT (default); {cu, moi} = a change in progress: cu 0..1 is the old sign
 *  falling off its hooks (0 = in place, 1 = gone below), moi 0..1 the new sign lowered on its chains (0 = high above the tower's face, out of the usual frame, 1 = in place).
 *  gianGiao: low scaffolds either side of the arch (default: only while the sign changes). The face lies on z = 0 of the group, the tower goes back 2.2 m. */
export const GateTower: React.FC<{pos: V3; bien?: GateBien; gianGiao?: boolean; f?: number}> = ({pos, bien = 'moi', gianGiao, f = 0}) => {
  const W = 5.6, H = 8.2, T = 2.2, aX0 = 1.5, aX1 = 4.1, spring = 1.85, top = spring + (aX1 - aX0) / 2;
  const map = useMemo(() => stoneTex2(), []);
  const b = typeof bien === 'string' ? (bien === 'cu' ? {cu: 0, moi: -1} : {cu: 1, moi: 1}) : bien, scaf = gianGiao ?? typeof bien !== 'string';
  const SY = top + 0.62;
  const fall = b.cu, oldOff = -fall * fall * 6.0;
  return (
    <group position={pos}>
      <group position={[-W / 2, 0, 0]}><HoledWall w={W} h={H} t={T} map={map} holes={[{kind: 'arch', x0: aX0, x1: aX1, y0: 0, spring}]} /></group>
      {/* the passage: a dark floor, a bright landscape at the far end, the timber gates swung back against the walls */}
      <mesh position={[0, 0.012, -T / 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[aX1 - aX0, T]} /><meshLambertMaterial color="#7a6e58" /></mesh>
      <mesh position={[0, top * 0.55, -T - 0.05]}><planeGeometry args={[aX1 - aX0, top + 0.2]} /><meshBasicMaterial map={useMemo(() => tex('qt-passage', 128, 160, (c, Wd, Hd) => { const g = c.createLinearGradient(0, 0, 0, Hd); g.addColorStop(0, '#bcd4ea'); g.addColorStop(0.55, '#e2d6b4'); g.addColorStop(0.56, '#7fa062'); g.addColorStop(1, '#a89470'); c.fillStyle = g; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#5d8a58'; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(20 + i * 16, Hd * 0.56); c.lineTo(28 + i * 16, Hd * 0.36); c.lineTo(36 + i * 16, Hd * 0.56); c.fill(); } c.fillStyle = 'rgba(30,26,20,0.6)'; c.fillRect(0, 0, 10, Hd); c.fillRect(Wd - 10, 0, 10, Hd); }), [])} /></mesh>
      {[-1, 1].map((s) => <group key={s} position={[s * ((aX1 - aX0) / 2 - 0.02), 0, -0.25]} rotation={[0, s * 1.35, 0]}><B p={[-s * 0.65, top / 2 - 0.2, 0]} s={[1.3, top - 0.5, 0.1]} c="#5a3d26" /><B p={[-s * 0.65, 0.9, 0.06]} s={[1.3, 0.1, 0.04]} c="#2d2a28" /><B p={[-s * 0.65, 2.0, 0.06]} s={[1.3, 0.1, 0.04]} c="#2d2a28" /></group>)}
      {/* string course, corbels, battlement, slits, a pennant */}
      <StoneBox id="qt-gate-course" p={[0, 5.2, 0.12]} s={[W + 0.1, 0.22, 0.28]} look={{seed: 3, course: [0.22, 0.22], len: [0.5, 0.8], tones: ['#9a958a', '#8a857b', '#a6a196'], mortar: '#5a564e'}} />
      {Array.from({length: 7}, (_, i) => <B key={i} p={[-W / 2 + 0.4 + i * ((W - 0.8) / 6), H + 0.22, 0.14]} s={[0.55, 0.5, 0.5]} c={i % 2 ? '#8e897f' : '#9a958a'} />)}
      <B p={[0, H + 0.02, 0.1]} s={[W + 0.1, 0.18, 0.7]} c="#7a766c" />
      {[-1, 1].map((s) => <group key={s}><B p={[s * 1.9, 6.4, 0.05]} s={[0.22, 1.0, 0.12]} c="#25242a" /><B p={[s * 1.9, 6.4, 0.115]} s={[0.1, 0.8, 0.02]} c="#ffc46a" cast={false} /></group>)}
      {[-2.15, 2.15].map((x, i) => <MaskBanner key={x} pos={[x, 0.7, 0.22]} w={0.7} h={2.1} f={f + i * 17} />)}
      <RoofFlag pos={[0, H + 0.5, 0.1]} k={1} f={f} h={2.2} seed={3} />
      <Halo pos={[0, top + 0.2, -0.8]} r={2.4} color="#fff2c8" strength={0.28} />
      {/* the signs, hung from hooks over the arch */}
      {[-1, 1].map((s) => <B key={`hk${s}`} p={[s * 1.15, SY + 0.28, 0.1]} s={[0.1, 0.1, 0.16]} c="#2d2a28" />)}
      {b.cu < 1 ? <SignPlate pos={[0, SY + oldOff, 0.02]} w={2.5} h={0.8} id="qt-sign-old" art={paintSignOld} chain={0.18} rot={fall > 0 ? -fall * 0.5 : 0} /> : null}
      {b.moi > 0 ? <SignPlate pos={[0, SY + (1 - b.moi) * 2.6 + (typeof bien === 'string' && bien === 'moi' ? 0.0 : 0), 0.06]} w={2.6} h={0.84} id="qt-sign-new" art={paintSignNew} chain={0.18 + (1 - b.moi) * 2.6} /> : null}
      {scaf ? [-1, 1].map((s) => <Scaffold key={s} pos={[s * 2.9 + (s > 0 ? 0.05 : 0), 0, 0.7]} />) : null}
    </group>
  );
};
let _st: THREE.Texture | null = null;
const stoneTex2 = () => _st ?? (_st = stoneTex('qt-gate-face', 5.6, 8.2, {seed: 11, course: [0.3, 0.42], len: [0.5, 1.0], tones: ['#a29d92', '#8f8a80', '#aaa59a', '#7f7b72', '#98938a', '#b2ada2'], mortar: '#5a564e', damp: 0.5, streaks: 1, arches: [{x0: 1.5, x1: 4.1, sill: 0, spring: 1.85}]}, 120));
/** low timber scaffold: four poles, a plank deck at 1.25 m (1.9 m x 1.1 m), cross braces, a ladder */
export const Scaffold: React.FC<{pos: V3}> = ({pos}) => {
  const plank = useMemo(() => tex('qt-scaffold', 256, 128, paintPlanks(4, {base: '#a0794a', n: 5, nails: true, age: 0.7})), []);
  return (
    <group position={pos}>
      {[-0.95, 0.95].flatMap((x) => [-0.5, 0.5].map((z) => <B key={`${x}${z}`} p={[x, 0.7, z]} s={[0.1, 1.4, 0.1]} c="#6a4a2c" />))}
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow><boxGeometry args={[2.0, 0.07, 1.2]} /><meshLambertMaterial map={plank} /></mesh>
      {[-0.5, 0.5].map((z) => <B key={z} p={[0, 0.8, z]} s={[2.1, 0.08, 0.06]} c="#7a5a3a" r={[0, 0, 0.5]} />)}
      <B p={[0, 1.1, 0.5]} s={[1.9, 0.07, 0.06]} c="#7a5a3a" />
      {[0.8, 1.55].map((x, i) => <B key={i} p={[x * (x > 1 ? 1 : -1) + (i ? 0 : 0), 0.7, 0.7]} s={[0.05, 1.6, 0.05]} c="#5a3d26" r={[0.2, 0, 0]} />)}
    </group>
  );
};

// ---------------------------------------------------------------- the guard post with an empty cell
const paintWeb = (c: Ctx, W: number, H: number) => {
  c.clearRect(0, 0, W, H); c.strokeStyle = 'rgba(245,245,238,0.85)'; c.lineWidth = 1.6; const ox = 0, oy = 0;
  for (let i = 0; i <= 5; i++) { const a = (i / 5) * (Math.PI / 2); c.beginPath(); c.moveTo(ox, oy); c.lineTo(Math.cos(a) * W, Math.sin(a) * H); c.stroke(); }
  for (let k = 1; k <= 5; k++) { c.beginPath(); for (let i = 0; i <= 5; i++) { const a = (i / 5) * (Math.PI / 2), rr = k / 5.4 + (i % 2 ? -0.03 : 0.02); const x = Math.cos(a) * W * rr, y = Math.sin(a) * H * rr; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
};
export const Web: React.FC<{pos: V3; s?: number; rotZ?: number; rotY?: number}> = ({pos, s = 0.6, rotZ = 0, rotY = 0}) => {
  const map = useMemo(() => tex('qt-web', 128, 128, paintWeb), []);
  return <mesh position={pos} rotation={[0, rotY, rotZ]} renderOrder={4}><planeGeometry args={[s, s]} /><meshBasicMaterial map={map} transparent depthWrite={false} side={THREE.DoubleSide} /></mesh>;
};
const paintPoster = (c: Ctx, W: number, H: number) => {
  c.fillStyle = '#d9c796'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(120,90,50,0.25)'; for (let i = 0; i < 12; i++) c.fillRect((i * 37) % W, (i * 53) % H, 30, 14);
  c.fillStyle = '#4a3a24'; c.fillRect(W * 0.12, H * 0.1, W * 0.76, H * 0.07); c.fillStyle = '#8a7a58'; c.fillRect(W * 0.2, H * 0.24, W * 0.6, H * 0.42); c.fillStyle = '#4a3a24'; for (let i = 0; i < 4; i++) c.fillRect(W * 0.14, H * (0.72 + i * 0.06), W * (0.72 - i * 0.1), H * 0.025);
  c.strokeStyle = '#b4342a'; c.lineWidth = 7; c.beginPath(); c.moveTo(W * 0.1, H * 0.1); c.lineTo(W * 0.9, H * 0.9); c.moveTo(W * 0.9, H * 0.1); c.lineTo(W * 0.1, H * 0.9); c.stroke();
};
/** The guard post of the square: a stone hut open to +z. On the left a porch with a bench-stool, old wanted posters (crossed out) and a key rack; on the right
 *  a cell shut by an iron grille whose door stands wide open: a toppled chair, old straw, a bucket, cobwebs, a rusted key on a nail.
 *  Origin = the left end of the front wall on the ground; the hut goes x 0..4.2, z 0..-3.0. */
/** bui (mặc định true): đèn bão treo ở chòi tự đăng ký nguồn bụi 'den' (lib3/buiNguon). */
export const GuardPost: React.FC<{pos: V3; f?: number; bui?: boolean}> = ({pos, f = 0, bui = true}) => {
  const L = {tones: ['#a29d92', '#8f8a80', '#aaa59a', '#7f7b72'], mortar: '#5a564e', damp: 0.4};
  const roofTex = useMemo(() => tex('qt-post-roof', 256, 180, paintTiles(3, '#9a5a42', '#7a4434', 5.2, 3.6)), []);
  const poster = useMemo(() => tex('qt-poster', 96, 128, paintPoster), []);
  const straw = useMemo(() => tex('qt-straw', 256, 128, (c, W, H) => { c.clearRect(0, 0, W, H); const r = rnd(8); for (let i = 0; i < 160; i++) { c.strokeStyle = ['#c9a85a', '#b08e44', '#d8bc72', '#8f7436'][i % 4]; c.lineWidth = 2; const x = r() * W, y = H * 0.3 + r() * H * 0.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 36, y + (r() - 0.5) * 10); c.stroke(); } }), []);
  return (
    <group position={pos}>
      <StoneBox id="qt-post-back" p={[2.1, 1.6, -3.0]} s={[4.4, 3.2, 0.4]} look={{...L, seed: 21, course: [0.3, 0.4], len: [0.5, 0.9]}} />
      <StoneBox id="qt-post-left" p={[-0.1, 1.6, -1.5]} s={[0.4, 3.2, 3.2]} look={{...L, seed: 23, course: [0.3, 0.4], len: [0.5, 0.9]}} />
      <StoneBox id="qt-post-right" p={[4.3, 1.6, -1.5]} s={[0.4, 3.2, 3.2]} look={{...L, seed: 25, course: [0.3, 0.4], len: [0.5, 0.9]}} />
      <StoneBox id="qt-post-div" p={[2.15, 1.6, -1.55]} s={[0.3, 3.2, 2.9]} look={{...L, seed: 27, course: [0.3, 0.4], len: [0.5, 0.9]}} />
      <StoneBox id="qt-post-lintel" p={[2.1, 3.0, 0.05]} s={[4.5, 0.4, 0.3]} look={{...L, seed: 29, course: [0.2, 0.2], len: [0.6, 1.0], damp: 0}} />
      <StoneBox id="qt-post-plinth" p={[2.1, 0.14, 0.05]} s={[4.5, 0.28, 0.3]} look={{...L, seed: 31, course: [0.14, 0.14], len: [0.5, 0.9]}} />
      {/* the roof: two slopes with ridge along x, a deep overhang */}
      {[-1, 1].map((s) => <mesh key={s} position={[2.1, 3.65, s * 1.0 - 1.4]} rotation={[s * 0.5, 0, 0]} castShadow><boxGeometry args={[5.2, 0.14, 2.7]} />{[0, 1, 2, 3, 4, 5].map((i) => <meshLambertMaterial key={i} attach={`material-${i}`} {...(i === 2 ? {map: roofTex} : {color: '#7a4434'})} />)}</mesh>)}
      <mesh position={[2.1, 3.55, -1.5]} rotation={[0, 0, 0]}><boxGeometry args={[4.4, 0.5, 3.0]} /><meshLambertMaterial color="#6a6258" /></mesh>
      <B p={[2.1, 4.05, -1.4]} s={[5.3, 0.16, 0.2]} c="#6a4434" />
      {/* the porch: a post and a beam, the bench, posters, a key rack, a lantern */}
      <B p={[1.85, 1.5, 0.15]} s={[0.2, 3.0, 0.2]} c="#4a3322" /><B p={[0.85, 0.5, -0.6]} s={[1.3, 0.08, 0.42]} c="#8a5e38" /><B p={[0.3, 0.25, -0.6]} s={[0.1, 0.5, 0.38]} c="#6a4a2c" /><B p={[1.4, 0.25, -0.6]} s={[0.1, 0.5, 0.38]} c="#6a4a2c" />
      {[[0.45, 1.75, 0.0], [0.95, 1.65, 0.05], [1.5, 1.8, -0.03]].map(([x, y, rz], i) => <mesh key={i} position={[x, y, -2.78]} rotation={[0, 0, rz]}><planeGeometry args={[0.38, 0.5]} /><meshLambertMaterial map={poster} /></mesh>)}
      <B p={[1.4, 1.5, -2.76]} s={[0.7, 0.06, 0.06]} c="#3a2a1c" />{[1.15, 1.4, 1.65].map((x, i) => <B key={i} p={[x, 1.38, -2.74]} s={[0.04, 0.2, 0.03]} c={i === 1 ? '#8a5a2c' : '#4a4a48'} />)}
      <pointLight position={[1.0, 2.4, 0.2]} color="#ffd8a0" intensity={9} distance={8} decay={1.3} /><pointLight position={[3.3, 2.2, -1.2]} color="#d8e4ff" intensity={6} distance={5} decay={1.4} />
      <B p={[0.25, 2.3, -0.1]} s={[0.04, 0.5, 0.04]} c="#2d2a28" /><B p={[0.25, 2.0, -0.1]} s={[0.2, 0.28, 0.2]} c="#e2a84a" /><Halo pos={[0.25, 2.0, 0.1]} r={0.5} color="#ffc060" strength={0.16} />{bui ? <NguonBui kieu="den" pos={[0.25, 2.0, 0]} r={0.7} mau="#ffd8a0" /> : null}
      {/* the cell: the grille across its front, the door wide open on its hinge, the cell's own floor of old straw */}
      {[...Array(9)].map((_, i) => <B key={i} p={[2.45 + i * 0.185, 1.6, 0.0]} s={[0.04, 3.0, 0.04]} c="#2d2e32" cast={false} />)}
      {[0.4, 1.5, 2.8].map((y) => <B key={y} p={[3.3, y, 0.0]} s={[1.78, 0.05, 0.05]} c="#2d2e32" cast={false} />)}
      <group position={[4.05, 0, 0.02]} rotation={[0, -1.25, 0]}>{[...Array(5)].map((_, i) => <B key={i} p={[-i * 0.17, 1.4, 0]} s={[0.04, 2.8, 0.04]} c="#3a3b40" cast={false} />)}{[0.3, 1.4, 2.6].map((y) => <B key={y} p={[-0.34, y, 0]} s={[0.78, 0.05, 0.05]} c="#3a3b40" cast={false} />)}</group>
      <mesh position={[3.25, 0.03, -1.4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.9, 2.6]} /><meshLambertMaterial map={straw} transparent depthWrite={false} /></mesh>
      <group position={[3.3, 0, -1.2]} rotation={[0, 0.5, 0]}><B p={[0, 0.2, 0]} s={[0.46, 0.06, 0.46]} c="#7a5230" r={[0, 0, 1.3]} /><B p={[-0.19, 0.46, 0.18]} s={[0.05, 0.9, 0.05]} c="#6a4426" r={[0, 0, 1.2]} /><B p={[0.2, 0.2, -0.18]} s={[0.05, 0.4, 0.05]} c="#6a4426" r={[0.2, 0, 1.2]} /></group>
      <B p={[2.85, 0.14, -2.4]} s={[0.34, 0.28, 0.34]} c="#6a5a46" /><B p={[2.85, 0.31, -2.4]} s={[0.38, 0.05, 0.38]} c="#2d2a28" />
      <B p={[3.6, 2.0, -2.76]} s={[0.4, 0.04, 0.03]} c="#2d2a28" /><B p={[3.5, 1.82, -2.76]} s={[0.04, 0.3, 0.03]} c="#4a4a4a" /><mesh position={[3.5, 1.62, -2.76]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.07, 0.016, 4, 8]} /><meshLambertMaterial color="#4a4a4a" /></mesh><B p={[3.95, 1.6, -2.78]} s={[0.04, 0.26, 0.04]} c="#7a4a2a" /><B p={[3.95, 1.76, -2.74]} s={[0.1, 0.04, 0.08]} c="#2d2a28" />
      <Web pos={[2.55, 2.75, -2.6]} s={0.95} /><Web pos={[4.0, 2.8, -2.6]} s={0.8} rotY={0} rotZ={Math.PI / 2} /><Web pos={[2.4, 2.9, -0.05]} s={0.7} rotZ={0} />
      <B p={[4.0, 0.05, -2.2]} s={[0.4, 0.06, 0.3]} c="#cbbd9c" r={[0, 0.4, 0]} />
    </group>
  );
};
