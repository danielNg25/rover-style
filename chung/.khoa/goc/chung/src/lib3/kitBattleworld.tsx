import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {rnd, P, Ctx, paintPeak} from './depth';
import {tex} from './kitLab';
import {FacetLathe, Halo} from './look';
import {blobPts, Cut, Hat} from './kitVuTru';
import {B} from './kit';

/** lib3/kitBattleworld (23/11/2026, lô chương 10-14, phần "Vũ trụ"): the pieces of BATTLEWORLD, a planet sewn from pieces of other places.
 *  Cut-paper: flat shapes of two or three tones, sharp edges. Panoramas are painted on a strip of cylinder (bearings -110..+110 degrees seen from the pivot) so a turned view still has a horizon:
 *  X(b) = pixel of bearing b, Y(el) = pixel of elevation el (degrees), the horizon at y 512. All painters read a palette `BwPal`. */
type V3 = [number, number, number];
export type BwState = 'chien' | 'hut' | 'than' | 'bao' | 'chang-vang';
export type BwPal = {
  sky: string[];                        // from the top of the sky down to the horizon: 7 flat bands
  sun: {b: number; el: number; r: number; cols: [string, string, string]};
  cloud: {light: string; mid: string; dark: string};
  aurora: boolean; moon: boolean; island: {top: string; side: string; root: string};
  ice: {light: string; dark: string; snow: string; snowShade: string};
  mesa: {lit: string; mid: string; dark: string; stripe: string};
  city: {wall: string; dark: string; win: string};
  ridge: [string, string]; spire: [string, string]; crystal: [string, string, string];
  seam: string; ground: [string, string]; haze: string; farGround: string;
  rock: [string, string, string]; stone: {lit: string; dark: string; flag: string; roof: string};
  light: {grade: 'lateDay' | 'dayExterior'; gain: number; dir: V3; color?: string};
  ember: string[];
};
const ROCK_D: [string, string, string] = ['#b8a0a8', '#8c7284', '#64506c'];
export const BW_PAL: Record<'chien' | 'than' | 'chang-vang', BwPal> = {
  chien: {
    sky: ['#5c4a98', '#7a54a4', '#9a5eac', '#bf6aa8', '#dd7ca2', '#f0969a', '#f8b49a'], sun: {b: -42, el: 5, r: 120, cols: ['#f9a89a', '#fcc2a2', '#ffe2b8']},
    cloud: {light: '#f4b8d0', mid: '#cf86b8', dark: '#9a62a8'}, aurora: true, moon: true, island: {top: '#9a7898', side: '#6a4e78', root: '#4a3860'},
    ice: {light: '#dfe8f6', dark: '#9aa6d0', snow: '#ffffff', snowShade: '#cdd8f0'}, mesa: {lit: '#f08a58', mid: '#cf6a48', dark: '#9a4a3e', stripe: '#e8a070'},
    city: {wall: '#a8a4c0', dark: '#78749c', win: '#ffe6a0'}, ridge: ['#a8789c', '#8a5a88'], spire: ['#a47898', '#78587c'], crystal: ['#bff8f0', '#6ad8d0', '#3aa6b8'],
    seam: '#f6d4ff', ground: ['#b27a70', '#d49a90'], haze: '#eaa59a', farGround: '#d89a92', rock: ROCK_D, stone: {lit: '#9c96b4', dark: '#6a6488', flag: '#3fbf5a', roof: '#443f66'},
    light: {grade: 'lateDay', gain: 1.15, dir: [-9, 5, 4]}, ember: ['#ffb870', '#ff9a58', '#e6a8ff'],
  },
  than: {
    sky: ['#6a78c2', '#8a92cc', '#b0b0d6', '#dcc4d4', '#f4d8b6', '#fbe6a6', '#fdf2c0'], sun: {b: 10, el: 14, r: 130, cols: ['#fde7a0', '#fff0b8', '#fffbe0']},
    cloud: {light: '#fff4dc', mid: '#f0d0b8', dark: '#c8a4b4'}, aurora: false, moon: true, island: {top: '#b8a0a8', side: '#8c748a', root: '#665068'},
    ice: {light: '#eef4ff', dark: '#b4c0e0', snow: '#ffffff', snowShade: '#dde6f6'}, mesa: {lit: '#f8a468', mid: '#dc8458', dark: '#a8604a', stripe: '#f2b480'},
    city: {wall: '#c4c0d8', dark: '#9490b4', win: '#ffe6a0'}, ridge: ['#c8a0a0', '#a87e90'], spire: ['#c0a0a0', '#9c7a8c'], crystal: ['#d2fff6', '#80e8dc', '#46b4c4'],
    seam: '#fff2c8', ground: ['#cdb080', '#e8cc9c'], haze: '#f8e4b4', farGround: '#ecd2a2', rock: ['#d8c4b8', '#b09a98', '#887480'], stone: {lit: '#a8a2c0', dark: '#767090', flag: '#3fbf5a', roof: '#4e4a72'},
    light: {grade: 'dayExterior', gain: 1.1, dir: [-4, 8, 4]}, ember: ['#ffe27a', '#fff0a8', '#ffd060'],
  },
  'chang-vang': {
    sky: ['#4a3f92', '#62489c', '#8650a4', '#b0609e', '#d87494', '#f08e86', '#f9b480'], sun: {b: -48, el: 3, r: 130, cols: ['#f8a888', '#fcc496', '#ffe6b6']},
    cloud: {light: '#f2b4c8', mid: '#c880b0', dark: '#905ea4'}, aurora: true, moon: true, island: {top: '#907094', side: '#664c78', root: '#463660'},
    ice: {light: '#d8def2', dark: '#98a0cc', snow: '#fdf4ff', snowShade: '#cbc6ec'}, mesa: {lit: '#e8825c', mid: '#c46248', dark: '#8e4640', stripe: '#dc9870'},
    city: {wall: '#a09cbc', dark: '#706c98', win: '#ffe6a0'}, ridge: ['#9c7096', '#7e5484'], spire: ['#9a7094', '#745478'], crystal: ['#c0f6ee', '#68d0cc', '#3a9ab0'],
    seam: '#f2ccff', ground: ['#a8746e', '#cc9088'], haze: '#e49c92', farGround: '#cc9088', rock: ROCK_D, stone: {lit: '#9a94b2', dark: '#686286', flag: '#3fbf5a', roof: '#423e64'},
    light: {grade: 'lateDay', gain: 1.1, dir: [-9, 5, 4]}, ember: ['#ffb070', '#ff9060', '#d8a0ff'],
  },
};
export const bwPal = (s: BwState): BwPal => BW_PAL[s === 'than' ? 'than' : s === 'chang-vang' || s === 'bao' ? 'chang-vang' : 'chien'];

// ---------------------------------------------------------------- panoramas on a cylinder strip
const PW = 6144, PH = 1024, B0 = -110, B1 = 110;
export const bX = (b: number) => ((b - B0) / (B1 - B0)) * PW;
export const bY = (el: number) => 512 - Math.tan((el * Math.PI) / 180) * 1600;
const jag = (c: Ctx, pts: number[][], f: string) => P(c, pts, f);
/** a strip of cylinder of radius R round the pivot: bearing 0 = straight ahead (-z), positive to the right; 220 degrees wide; texture painted by `paint` */
export const PanoMesh: React.FC<{id: string; R: number; paint: (c: Ctx, W: number, H: number) => void; order: number; fog?: boolean}> = ({id, R, paint, order, fog = false}) => {
  const t = useMemo(() => tex(id, PW, PH, paint), [id]);
  const geo = useMemo(() => { const N = 110, pos: number[] = [], uv: number[] = [], idx: number[] = [], hy = (512 * R) / 1600;
    for (let i = 0; i <= N; i++) { const b = ((B0 + ((B1 - B0) * i) / N) * Math.PI) / 180; pos.push(R * Math.sin(b), hy, -R * Math.cos(b), R * Math.sin(b), -hy, -R * Math.cos(b)); uv.push(i / N, 1, i / N, 0); if (i) { const a = i * 2; idx.push(a - 2, a - 1, a, a - 1, a + 1, a); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere(); return g; }, [R]);
  return <mesh geometry={geo} renderOrder={order} frustumCulled={false}><meshBasicMaterial map={t} transparent depthWrite={false} side={THREE.DoubleSide} fog={fog} toneMapped={false} /></mesh>;
};
/** the sky: seven flat bands to the horizon, a low sun with rays, the broken moon, a chain of floating rock islands, two ribbons of aurora, long streaks of cloud */
export const paintBwSky = (p: BwPal, seed = 3) => (c: Ctx, W: number) => {
  const r = rnd(seed), edges = [-5, 0, 2.6, 5.4, 9, 13, 18, 30];
  for (let i = 0; i < 7; i++) { c.fillStyle = p.sky[6 - i]; c.fillRect(0, bY(edges[i + 1]), W, bY(edges[i]) - bY(edges[i + 1]) + 2); }
  for (let i = 1; i < 7; i++) { const y = bY(edges[i]), pts: number[][] = [[0, y]]; for (let x = 0; x <= W; x += 110) pts.push([x, y + (r() - 0.5) * 34]); pts.push([W, y + 3], [W, bY(edges[0])], [0, bY(edges[0])]); jag(c, pts, p.sky[7 - i]); }
  for (let k = 0; k < 90; k++) { c.globalAlpha = 0.3 + r() * 0.5; c.fillStyle = '#fff6e8'; c.fillRect(r() * W, bY(14) - r() * 380, 2.4, 2.4); } c.globalAlpha = 1;
  // the sun and its long cut rays
  const sx = bX(p.sun.b), sy = bY(p.sun.el);
  for (let k = 0; k < 9; k++) { const a = -Math.PI * 0.95 + (k / 8) * Math.PI * 0.9, w = 0.04 + r() * 0.03; jag(c, [[sx, sy], [sx + Math.cos(a - w) * 1800, sy + Math.sin(a - w) * 1800], [sx + Math.cos(a + w) * 1800, sy + Math.sin(a + w) * 1800]], 'rgba(255,214,160,0.13)'); }
  [[p.sun.r * 2.3, p.sun.cols[0], 0.5], [p.sun.r * 1.5, p.sun.cols[1], 0.8], [p.sun.r, p.sun.cols[2], 1]].forEach(([q, col, al]) => { c.globalAlpha = al as number; c.fillStyle = col as string; c.beginPath(); c.arc(sx, sy, q as number, 0, 7); c.fill(); }); c.globalAlpha = 1;
  // long streaks of cloud in flat tones
  for (let k = 0; k < 20; k++) { const x = r() * W, y = bY(2.5 + r() * 14), L = 360 + r() * 800, th = 12 + r() * 26;
    jag(c, [[x, y], [x + L * 0.3, y - th], [x + L * 0.75, y - th * 0.5], [x + L, y], [x + L * 0.7, y + th * 0.9], [x + L * 0.25, y + th * 0.7]], p.cloud.mid); jag(c, [[x + L * 0.04, y - 1], [x + L * 0.3, y - th], [x + L * 0.75, y - th * 0.5], [x + L * 0.96, y - 1], [x + L * 0.5, y - th * 0.15]], p.cloud.light); jag(c, [[x + L * 0.25, y + th * 0.7], [x + L * 0.7, y + th * 0.9], [x + L * 0.96, y + 2], [x + L * 0.5, y + th * 0.35]], p.cloud.dark); }
  if (p.aurora) [[-96, -34, 7.4, 1, '#4fe6a0'], [-84, -40, 11, -1, '#7af2c0']].forEach(([a, b, el, s, col], i) => { const pts: number[][] = [], n = 14; for (let k = 0; k <= n; k++) { const t = k / n, x = bX((a as number) + ((b as number) - (a as number)) * t), y = bY((el as number) + Math.sin(t * 4 + i) * 1.3 * (s as number)); pts.push([x, y - 20 - 120 * Math.sin(Math.PI * t) * (1 - i * 0.3)]); } const dn = pts.map(([x, y]) => [x, y + 70 + 40 * Math.sin(x / 300)]).reverse(); jag(c, [...pts, ...dn], `${col}88`); jag(c, [...pts, ...pts.map(([x, y]) => [x, y + 28]).reverse()], `${col}cc`); });
  // floating rock islands with roots hanging down
  for (let k = 0; k < 9; k++) { const b = -75 + k * 17 + (r() - 0.5) * 6, x = bX(b), y = bY(6.5 + r() * 7), w = 70 + r() * 150, h = 16 + r() * 26;
    for (let j = 0; j < 4; j++) { const rx = x + (j / 3 - 0.5) * w * 0.8, L = 40 + r() * 120; jag(c, [[rx - 6, y + h * 0.4], [rx + 6, y + h * 0.4], [rx + (r() - 0.5) * 16, y + h * 0.4 + L]], p.island.root); }
    jag(c, [[x - w / 2, y], [x - w * 0.3, y - h * 0.8], [x + w * 0.2, y - h], [x + w / 2, y], [x + w * 0.3, y + h * 0.7], [x - w * 0.1, y + h * 1.1], [x - w * 0.4, y + h * 0.5]], p.island.side); jag(c, [[x - w / 2, y], [x - w * 0.3, y - h * 0.8], [x + w * 0.2, y - h], [x + w / 2, y], [x, y + h * 0.1]], p.island.top); }
  // the moon: one big ball broken in three, the seams glowing
  if (p.moon) { const mx = bX(3), my = bY(8.6), R = 145, tones = ['#ece4f6', '#cfc2e0', '#9d8ec4'];
    const piece = (pts: number[][], dx: number, dy: number, f: string) => jag(c, pts.map(([x, y]) => [mx + x * R + dx, my + y * R + dy]), f);
    const arc = (a0: number, a1: number, extra: number[][]) => { const o: number[][] = []; for (let a = a0; a <= a1 + 1e-6; a += (a1 - a0) / 10) o.push([Math.cos(a), Math.sin(a)]); return [...o, ...extra]; };
    const A = arc(-2.6, 0.2, [[0.1, -0.15], [-0.35, -0.4]]), Bp = arc(0.2, 2.0, [[-0.2, 0.3], [0.1, -0.15]]), Cp = arc(2.0, 3.68, [[-0.35, -0.4], [-0.2, 0.3]]);
    c.fillStyle = 'rgba(246,220,255,0.5)'; c.beginPath(); c.arc(mx, my, R * 1.18, 0, 7); c.fill();
    piece(A, 14, -16, tones[0]); piece(Bp, 20, 14, tones[1]); piece(Cp, -22, 10, tones[2]);
    [[-0.5, -0.2, 0.12], [0.35, 0.3, 0.09], [-0.15, 0.5, 0.07], [0.5, -0.5, 0.1]].forEach(([a, b, q]) => jag(c, blobPts(mx + a * R, my + b * R, q * R, q * R * 0.8, 8, 0.14, r), 'rgba(110,90,160,0.4)'));
    [[-0.1, -0.15, -0.35, -0.4], [0.1, -0.15, -0.2, 0.3]].forEach(([x0, y0, x1, y1]) => { c.strokeStyle = '#fff4ff'; c.lineWidth = 5; c.beginPath(); c.moveTo(mx + x0 * R, my + y0 * R); c.lineTo(mx + x1 * R, my + y1 * R); c.stroke(); });
    for (let k = 0; k < 9; k++) { const a = r() * 6.28, d = R * (1.12 + r() * 0.45); jag(c, blobPts(mx + Math.cos(a) * d, my + Math.sin(a) * d, 9 + r() * 14, 8 + r() * 10, 6, 0.3, r), tones[k % 3]); } }
};
/** far horizon (300 m): ice mountains in the west, a seam of light, red mesas in the north with strata, the tilted slab of a city in the east; the ground band below the horizon */
export const paintBwFar = (p: BwPal, seed = 4) => (c: Ctx, W: number) => {
  const r = rnd(seed), hz = bY(0);
  c.fillStyle = p.farGround; c.fillRect(0, hz, W, PH - hz);
  for (let b = -112; b < -28; b += 7 + r() * 6) paintPeak(c, bX(b), bY(1.2 + r() * 6.5), 90 + r() * 120, hz + 6, p.ice);
  for (let b = -22; b < 48; b += 9 + r() * 9) { const x = bX(b), w = 90 + r() * 150, h = (hz - bY(1.4 + r() * 3.6)), top = hz - h;
    jag(c, [[x - w, hz], [x - w * 0.8, top + h * 0.1], [x - w * 0.55, top], [x + w * 0.55, top], [x + w * 0.85, top + h * 0.14], [x + w, hz]], p.mesa.mid); jag(c, [[x - w, hz], [x - w * 0.8, top + h * 0.1], [x - w * 0.55, top], [x - w * 0.1, top], [x - w * 0.2, hz]], p.mesa.lit); jag(c, [[x + w * 0.4, top], [x + w * 0.55, top], [x + w * 0.85, top + h * 0.14], [x + w, hz], [x + w * 0.5, hz]], p.mesa.dark);
    for (let s = 1; s < 5; s++) { c.fillStyle = p.mesa.stripe; c.globalAlpha = 0.55; c.fillRect(x - w * 0.9, top + (h * s) / 5, w * 1.8, 5 + r() * 5); } c.globalAlpha = 1; }
  // the tilted slab of a city: a piece of ground on its own heave, towers leaning with it
  const cx = bX(70), slab = (pts: number[][], f: string) => jag(c, pts.map(([x, y]) => [cx + x, hz + y]), f);
  slab([[-480, 0], [-440, -26], [440, -90], [520, 0]], p.city.dark);
  for (let k = 0; k < 15; k++) { const x = -420 + k * 58 + r() * 20, base = -26 - ((x + 440) / 880) * 64, h = 80 + r() * 230, w = 32 + r() * 34, lean = -0.17;
    c.save(); c.translate(cx + x, hz + base); c.rotate(lean); jag(c, [[0, 0], [w, 0], [w, -h], [0, -h]], k % 2 ? p.city.wall : p.city.dark); jag(c, [[w * 0.55, 0], [w, 0], [w, -h], [w * 0.55, -h]], 'rgba(60,50,110,0.3)');
    for (let i = 0; i < 6; i++) if (r() < 0.4) { c.fillStyle = p.city.win; c.fillRect(w * 0.18 + r() * w * 0.4, -h + 14 + i * (h / 7), 5, 7); } c.restore(); }
  // a seam: a short rift of light rising from the horizon between two pieces of land, stitched across with bars, and a line of stitches running toward the viewer on the ground band
  [-28, 44].forEach((b, i) => { const x = bX(b), pts: number[][] = []; for (let k = 0; k <= 5; k++) pts.push([x + (r() - 0.5) * 18, hz - k * 22]); jag(c, [...pts, ...pts.map(([px, py]) => [px + 9, py]).reverse()], p.seam);
    for (let k = 1; k < 5; k++) { c.fillStyle = p.seam; c.fillRect(x - 18, hz - k * 22, 44, 4); }
    for (let k = 0; k < 6; k++) { const yy = hz + 6 + k * 14; c.fillStyle = p.seam; c.fillRect(x - 28 - k * 14, yy, 30 + k * 8, 3 + k * 0.6); } void i; });
};
/** nearer ridges (170 m): two ridgelines, rock spires, arches, crystals; a flat haze band at the horizon */
export const paintBwMid = (p: BwPal, seed = 5) => (c: Ctx, W: number) => {
  const r = rnd(seed), hz = bY(0) + 14;
  c.fillStyle = p.ridge[0]; c.fillRect(0, hz, W, PH - hz);
  [[p.ridge[1], 1.0, 1.7], [p.ridge[0], 0.62, 1.2]].forEach(([col, k, hh]) => { const pts: number[][] = [[0, hz]]; for (let x = 0; x <= W; x += 120) pts.push([x, hz - (30 + r() * 140) * (hh as number) * 0.4 * (k as number) - 20]); pts.push([W, hz]); jag(c, pts, col as string); });
  for (let k = 0; k < 26; k++) { const b = B0 + 6 + r() * (B1 - B0 - 12), x = bX(b), h = 50 + r() * 150, w = 16 + r() * 28; jag(c, [[x - w, hz], [x - w * 0.5, hz - h], [x - w * 0.1, hz - h - 20], [x + w * 0.4, hz - h * 0.8], [x + w, hz]], p.spire[1]); jag(c, [[x - w, hz], [x - w * 0.5, hz - h], [x - w * 0.1, hz - h - 20], [x - w * 0.05, hz]], p.spire[0]); }
  for (let k = 0; k < 7; k++) { const x = bX(-95 + k * 33 + (r() - 0.5) * 8), w = 80 + r() * 70, h = 70 + r() * 60; jag(c, [[x - w, hz], [x - w * 0.9, hz - h * 0.6], [x - w * 0.5, hz - h], [x + w * 0.5, hz - h], [x + w * 0.9, hz - h * 0.6], [x + w, hz], [x + w * 0.55, hz], [x + w * 0.5, hz - h * 0.55], [x - w * 0.5, hz - h * 0.55], [x - w * 0.55, hz]], p.spire[1]); }
  for (let k = 0; k < 16; k++) { const b = B0 + 8 + r() * (B1 - B0 - 16), x = bX(b), y = hz - 2, n = 2 + Math.floor(r() * 3);
    for (let j = 0; j < n; j++) { const h = 40 + r() * 90, a = (j - (n - 1) / 2) * 0.28, w = 11 + r() * 8; c.save(); c.translate(x + j * 12, y); c.rotate(a); jag(c, [[-w, 0], [-w * 0.6, -h * 0.82], [0, -h], [w * 0.6, -h * 0.82], [w, 0]], p.crystal[1]); jag(c, [[-w, 0], [-w * 0.6, -h * 0.82], [0, -h], [-w * 0.05, 0]], p.crystal[0]); jag(c, [[w * 0.3, 0], [w * 0.6, -h * 0.82], [0, -h], [w * 0.02, -h * 0.3]], p.crystal[2]); c.restore(); } }
  c.fillStyle = 'rgba(250,200,190,0.28)'; c.fillRect(0, hz - 70, W, 70);
};

// ---------------------------------------------------------------- sprites (flat pictures standing on the ground, bottom edge at y 0)
export const paintMesa = (p: BwPal, seed = 7) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), u = W / 1000, T = (pts: number[][]) => pts.map(([x, y]) => [x * u, H - y * u]);
  const sil = [[0, 0], [60, 260], [120, 320], [230, 360], [500, 372], [790, 356], [900, 300], [960, 200], [1000, 0]];
  jag(c, T(sil), p.mesa.mid);
  jag(c, T([[0, 0], [60, 260], [120, 320], [230, 360], [360, 366], [300, 0]]), p.mesa.lit); jag(c, T([[690, 358], [790, 356], [900, 300], [960, 200], [1000, 0], [740, 0]]), p.mesa.dark);
  c.save(); c.beginPath(); T(sil).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip();
  for (let s = 1; s < 9; s++) { c.fillStyle = p.mesa.stripe; c.globalAlpha = 0.5; const y = H - (s * 40 + r() * 8) * u; c.fillRect(0, y, W, (5 + r() * 6) * u); } c.globalAlpha = 1; c.restore();
  [[220, 360, 190, 240], [560, 372, 600, 250]].forEach(([x0, y0, x1, y1]) => jag(c, T([[x0 - 9, y0], [x0 + 9, y0], [x1 + 5, y1], [x1 - 5, y1 - 40]]), 'rgba(50,30,70,0.55)'));
  jag(c, T([[70, 0], [140, 40], [260, 18], [380, 46], [520, 20], [700, 50], [860, 18], [960, 0]]), 'rgba(60,40,70,0.3)');
};
export const paintArch = (p: BwPal) => (c: Ctx, W: number, H: number) => {
  const u = W / 800, T = (pts: number[][]) => pts.map(([x, y]) => [x * u, H - y * u]), t = p.mesa;
  jag(c, T([[0, 0], [30, 260], [140, 420], [320, 470], [500, 480], [660, 420], [770, 250], [800, 0], [620, 0], [600, 190], [520, 300], [400, 330], [280, 300], [200, 190], [180, 0]]), t.mid);
  jag(c, T([[0, 0], [30, 260], [140, 420], [320, 470], [330, 400], [240, 330], [180, 0]]), t.lit); jag(c, T([[660, 420], [770, 250], [800, 0], [620, 0], [600, 190], [640, 300]]), t.dark);
  for (let s = 1; s < 5; s++) { c.fillStyle = t.stripe; c.globalAlpha = 0.45; c.fillRect(40 * u, H - (s * 52) * u, 110 * u, 5 * u); c.fillRect(670 * u, H - (s * 52) * u, 100 * u, 5 * u); } c.globalAlpha = 1;
};
export const paintColumn = (p: BwPal, seed = 3) => (c: Ctx, W: number, H: number) => { const r = rnd(seed), T = (x: number, y: number) => [x * W, H - y * H];
  jag(c, [T(0.1, 0), T(0.16, 0.5), T(0.1, 0.8), T(0.24, 0.98), T(0.78, 0.94), T(0.9, 0.7), T(0.84, 0.4), T(0.92, 0)], p.mesa.mid); jag(c, [T(0.1, 0), T(0.16, 0.5), T(0.1, 0.8), T(0.24, 0.98), T(0.4, 0.97), T(0.36, 0.5), T(0.4, 0)], p.mesa.lit); jag(c, [T(0.66, 0.95), T(0.9, 0.7), T(0.84, 0.4), T(0.92, 0), T(0.64, 0)], p.mesa.dark);
  c.save(); c.beginPath(); [T(0.1, 0), T(0.16, 0.5), T(0.1, 0.8), T(0.24, 0.98), T(0.78, 0.94), T(0.9, 0.7), T(0.84, 0.4), T(0.92, 0)].forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip();
  for (let s = 1; s < 8; s++) { c.fillStyle = p.mesa.stripe; c.globalAlpha = 0.5; c.fillRect(0, H - (s / 8) * H * 0.95, W, 4 + r() * 4); } c.globalAlpha = 1; c.restore(); };
export const paintBoulders = (p: BwPal, seed = 9) => (c: Ctx, W: number, H: number) => { const r = rnd(seed), n = 3 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) { const w = W * (0.3 + r() * 0.3), h = H * (0.4 + r() * 0.5), x = (i / n) * (W - w) * 1.0 + r() * W * 0.1, b = H;
    jag(c, [[x, b], [x + w * 0.05, b - h * 0.5], [x + w * 0.3, b - h], [x + w * 0.72, b - h * 0.92], [x + w, b - h * 0.4], [x + w * 0.96, b]], p.rock[1]); jag(c, [[x, b], [x + w * 0.05, b - h * 0.5], [x + w * 0.3, b - h], [x + w * 0.5, b - h * 0.5], [x + w * 0.38, b]], p.rock[0]); jag(c, [[x + w * 0.72, b - h * 0.92], [x + w, b - h * 0.4], [x + w * 0.96, b], [x + w * 0.62, b], [x + w * 0.64, b - h * 0.5]], p.rock[2]); } };
export const paintCrystalCluster = (p: BwPal, seed = 2) => (c: Ctx, W: number, H: number) => { const r = rnd(seed), n = 5 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) { const x = W * (0.15 + 0.7 * (i / (n - 1))) + (r() - 0.5) * W * 0.05, h = H * (0.45 + r() * 0.5) * (1 - Math.abs(i / (n - 1) - 0.5) * 0.6), w = W * (0.07 + r() * 0.05), a = (i / (n - 1) - 0.5) * 0.7;
    c.save(); c.translate(x, H); c.rotate(a); jag(c, [[-w, 0], [-w * 0.6, -h * 0.84], [0, -h], [w * 0.6, -h * 0.84], [w, 0]], p.crystal[1]); jag(c, [[-w, 0], [-w * 0.6, -h * 0.84], [0, -h], [-w * 0.05, 0]], p.crystal[0]); jag(c, [[w * 0.3, 0], [w * 0.6, -h * 0.84], [0, -h], [w * 0.02, -h * 0.3]], p.crystal[2]); c.restore(); } };
/** a slab of road torn from another city, lying tilted: asphalt with a broken yellow line (a top-down picture) */
export const paintAsphalt = (c: Ctx, W: number, H: number) => { const r = rnd(5); c.fillStyle = '#4a4a56'; c.fillRect(0, 0, W, H); jag(c, [[0, H * 0.15], [W * 0.3, 0], [W * 0.34, H * 0.2], [0, H * 0.3]], '#3a3a46'); c.fillStyle = '#f2c83a'; for (let x = 20; x < W; x += 140) c.fillRect(x, H * 0.47, 80, H * 0.06);
  c.fillStyle = '#6a6a78'; c.fillRect(0, 0, W, 8); c.fillRect(0, H - 8, W, 8); for (let k = 0; k < 18; k++) { c.fillStyle = r() < 0.5 ? '#3a3a46' : '#5a5a68'; c.fillRect(r() * W, r() * H, 12 + r() * 40, 6 + r() * 12); } };
export const paintBrick = (c: Ctx, W: number, H: number) => { const r = rnd(6); c.fillStyle = '#b4604a'; c.fillRect(0, 0, W, H); for (let y = 0, row = 0; y < H; y += 28, row++) for (let x = row % 2 ? -32 : 0; x < W; x += 64) { c.fillStyle = r() < 0.5 ? '#c4705a' : r() < 0.5 ? '#a4523e' : '#b4604a'; c.fillRect(x + 2, y + 2, 60, 24); } };
export const paintStrata = (p: BwPal, seed = 4) => (c: Ctx, W: number, H: number) => { const r = rnd(seed); c.fillStyle = p.mesa.mid; c.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 34 + r() * 30) { c.fillStyle = r() < 0.5 ? p.mesa.lit : p.mesa.dark; c.globalAlpha = 0.5; c.fillRect(0, y, W, 12 + r() * 16); } c.globalAlpha = 1; for (let k = 0; k < 8; k++) { c.fillStyle = 'rgba(60,40,70,0.35)'; c.fillRect(r() * W, r() * H, 3, 40 + r() * 70); } };
/** the ground's own picture (a decal lying flat, top-down): cracks, scorch, scattered stones, a seam of light; 140 x 100 m around the pivot */
export const paintBwGround = (p: BwPal, seed = 11, area = 140, dens = 1) => (c: Ctx, W: number, H: number) => { const r = rnd(seed), s = W / area;
  for (let k = 0; k < 34 * dens; k++) { const x = r() * W, y = r() * H, rr = (2 + r() * 5) * s; jag(c, blobPts(x, y, rr * 1.4, rr, 7, 0.3, r, r() * 3), r() < 0.5 ? 'rgba(120,70,80,0.2)' : 'rgba(255,220,200,0.16)'); }
  for (let k = 0; k < 26 * dens; k++) { let x = r() * W, y = r() * H, a = r() * 6.28; c.strokeStyle = 'rgba(60,34,52,0.4)'; c.lineWidth = (0.1 + r() * 0.2) * s; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 7; j++) { a += (r() - 0.5) * 1.2; x += Math.cos(a) * (2 + r() * 3) * s; y += Math.sin(a) * (2 + r() * 3) * s; c.lineTo(x, y); } c.stroke(); }
  for (let k = 0; k < 120 * dens; k++) { const x = r() * W, y = r() * H, q = (0.15 + r() * 0.4) * s; jag(c, blobPts(x, y, q * 1.3, q, 6, 0.3, r), p.rock[1 + (k % 2)]); jag(c, blobPts(x - q * 0.25, y - q * 0.2, q * 0.7, q * 0.5, 6, 0.3, r), p.rock[0]); }
  c.strokeStyle = p.seam; c.globalAlpha = 0.8; c.lineWidth = 0.35 * s; c.setLineDash([1.6 * s, 1 * s]); c.beginPath(); c.moveTo(W * 0.0, H * 0.28); for (let x = 0; x <= W; x += 6 * s) c.lineTo(x, H * 0.28 + (r() - 0.5) * 2 * s); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; };
/** a column of smoke in flat cut tones (grey-violet, a light face on the left) */
export const paintPlume = (seed = 3, tone: [string, string, string] = ['#d6b4c8', '#a98bb2', '#7c6296']) => (c: Ctx, W: number, H: number) => { const r = rnd(seed), n = 14, L: number[][] = [], R: number[][] = [], M: number[][] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, cx = W * (0.5 + 0.2 * Math.sin(t * 3.6 + seed) * t), w = W * (0.1 + 0.34 * t * t + 0.05 * t) * (0.92 + r() * 0.16), y = H * (0.98 - 0.9 * t); L.push([cx - w, y]); R.push([cx + w, y]); M.push([cx - w * 0.15, y]); }
  jag(c, [...L, ...R.slice().reverse()], tone[1]); jag(c, [...M, ...R.slice().reverse()], tone[2]); jag(c, [...L, ...M.slice().reverse()].map(([x, y], i2) => (i2 > n ? [x + (L[n][0] - M[n][0]) * 0 , y] : [x, y])), tone[0]);
  for (let k = 0; k < 3; k++) { const t = 0.62 + k * 0.12, i2 = Math.min(n, Math.round(t * n)), cx = (L[i2][0] + R[i2][0]) / 2 + (k - 1) * W * 0.08, y = L[i2][1] + (r() - 0.5) * H * 0.04, rr = W * (0.2 + 0.12 * t);
    jag(c, blobPts(cx + rr * 0.1, y + rr * 0.05, rr, rr * 0.7, 7, 0.18, r, r() * 3), tone[2]); jag(c, blobPts(cx, y, rr * 0.94, rr * 0.66, 7, 0.18, r, r() * 3), tone[1]); } };

// ---------------------------------------------------------------- the castle (grey stone, green flags): a base castle and a loose new tower
/** curtain wall with teeth, a gate, five towers under slate cones, a keep; green flags on long poles. 1000 x 560 canvas, bottom at the base. `p` colours. */
export const paintCastleBase = (p: BwPal) => (c: Ctx, W: number, H: number) => {
  const u = W / 1000, T = (pts: number[][]) => pts.map(([x, y]) => [x * u, H - y * u]), Q = (pts: number[][], f: string) => jag(c, T(pts), f), r = rnd(5), S = p.stone;
  Q([[40, 0], [40, 120], [960, 120], [960, 0]], S.dark); Q([[40, 0], [40, 120], [480, 120], [480, 0]], S.lit);
  for (let x = 40; x < 960; x += 46) Q([[x, 120], [x, 144], [x + 26, 144], [x + 26, 120]], x < 480 ? S.lit : S.dark);
  Q([[440, 0], [440, 90], [470, 112], [530, 112], [560, 90], [560, 0]], '#3c3850');
  const tower = (x: number, w: number, h: number, i: number) => { Q([[x, 0], [x, h], [x + w, h], [x + w, 0]], S.dark); Q([[x, 0], [x, h], [x + w * 0.55, h], [x + w * 0.55, 0]], S.lit); Q([[x - 8, h], [x + w / 2, h + w * 1.15], [x + w + 8, h]], S.roof); Q([[x - 8, h], [x + w / 2, h + w * 1.15], [x + w * 0.4, h]], '#6a6490');
    Q([[x + w * 0.38, h * 0.6], [x + w * 0.62, h * 0.6], [x + w * 0.62, h * 0.6 + 36], [x + w * 0.38, h * 0.6 + 36]], '#2e2a44'); const px = x + w / 2, py = h + w * 1.15; Q([[px - 2, py], [px + 2, py], [px + 2, py + 70], [px - 2, py + 70]], '#4a4458'); Q([[px + 2, py + 70], [px + 46, py + 56], [px + 40, py + 40], [px + 2, py + 46]], S.flag); void i; };
  [[60, 90, 230], [210, 80, 300], [690, 90, 280], [840, 100, 240]].forEach(([x, w, h], i) => tower(x, w, h, i));
  Q([[360, 120], [360, 360], [640, 360], [640, 120]], S.dark); Q([[360, 120], [360, 360], [500, 360], [500, 120]], S.lit); [[400, 220], [540, 220], [470, 290]].forEach(([x, y]) => Q([[x, y], [x + 22, y], [x + 22, y + 44], [x, y + 44]], '#2e2a44'));
  tower(430, 140, 360, 9);
  void r;
};
/** the new tower's body, tall and narrow, in the same stone; 220 x 350 canvas */
export const paintCastleTower = (p: BwPal) => (c: Ctx, W: number, H: number) => {
  const u = W / 220, T = (pts: number[][]) => pts.map(([x, y]) => [x * u, H - y * u]), Q = (pts: number[][], f: string) => jag(c, T(pts), f), S = p.stone;
  Q([[20, 0], [20, 340], [200, 340], [200, 0]], S.dark); Q([[20, 0], [20, 340], [120, 340], [120, 0]], S.lit); for (let y = 40; y < 330; y += 60) Q([[20, y], [200, y], [200, y + 6], [20, y + 6]], 'rgba(60,50,90,0.3)');
  [[84, 210], [84, 120]].forEach(([x, y]) => Q([[x, y], [x + 28, y], [x + 28, y + 52], [x, y + 52]], '#2e2a44'));
  Q([[6, 340], [214, 340], [214, 352], [6, 352]], S.lit);
};
/** the new tower's slate cone and flag; 220 x 230 canvas */
export const paintCastleRoof = (p: BwPal) => (c: Ctx, W: number, H: number) => {
  const u = W / 220, T = (pts: number[][]) => pts.map(([x, y]) => [x * u, H - y * u]), Q = (pts: number[][], f: string) => jag(c, T(pts), f), S = p.stone;
  Q([[8, 0], [110, 170], [212, 0]], S.roof); Q([[8, 0], [110, 170], [96, 0]], '#6a6490'); Q([[108, 170], [112, 170], [112, 225], [108, 225]], '#4a4458'); Q([[112, 225], [160, 212], [152, 196], [112, 200]], S.flag);
};
/** a crack running up the tower, white-dark, for the overlay */
export const paintCastleCrack = (c: Ctx, W: number, H: number) => { const r = rnd(8); let x = W * 0.5, y = H; c.strokeStyle = '#1a1424'; c.lineWidth = W * 0.035; c.lineJoin = 'miter'; c.beginPath(); c.moveTo(x, y); while (y > H * 0.28) { y -= H * (0.05 + r() * 0.05); x += (r() - 0.5) * W * 0.2; c.lineTo(x, y); } c.stroke(); c.strokeStyle = '#ffe28a'; c.lineWidth = W * 0.01; c.stroke(); };
export const paintRubble = (c: Ctx, W: number, H: number) => { const r = rnd(4); jag(c, blobPts(W / 2, H / 2, W * 0.46, H * 0.4, 7, 0.28, r), '#8a84a2'); jag(c, blobPts(W * 0.44, H * 0.44, W * 0.28, H * 0.22, 6, 0.28, r), '#b4aec8'); };

// ---------------------------------------------------------------- 3D: boxes with a picture on them, a bar between two points, the machine
export const BoxTex: React.FC<{p: V3; s: V3; id: string; paint: (c: Ctx, W: number, H: number) => void; px?: number; color?: string; rotY?: number; rot?: V3}> = ({p, s, id, paint, px = 512, color = '#ffffff', rotY = 0, rot}) => {
  const t = useMemo(() => tex(id, px, px, paint), [id, px]);
  return <mesh position={p} rotation={rot ?? [0, rotY, 0]} castShadow receiveShadow><boxGeometry args={s} /><meshLambertMaterial map={t} color={color} /></mesh>;
};
const Y_AX = new THREE.Vector3(0, 1, 0);
/** a straight bar of square section `t` from a to b */
export const Bar: React.FC<{a: V3; b: V3; t: number; c: string; cast?: boolean}> = ({a, b, t, c, cast = true}) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va), L = d.length(), q = new THREE.Quaternion().setFromUnitVectors(Y_AX, d.clone().normalize()), m = va.clone().add(vb).multiplyScalar(0.5);
  return <mesh position={m.toArray() as V3} quaternion={q} castShadow={cast} receiveShadow><boxGeometry args={[t, L, t]} /><meshLambertMaterial color={c} /></mesh>;
};
/** the mesa the machine stands on (`momDa`): top 2.0 m, x 1.2..5.6, z -7.4..-4.8, a vertical crack in its front, rough steps up its left side (x 0..1.2) */
export const MomDa: React.FC<{p: BwPal}> = ({p}) => {
  const top = useMemo(() => tex(`bw-momda-top-${p.haze}`, 1024, 1024, (c, W, H) => { c.fillStyle = p.stone.lit; c.fillRect(0, 0, W, H); paintBwGround(p, 5, 5, 3)(c, W, H); }), [p.haze]);
  return (
  <group>
    <BoxTex id="bw-momda-strata" p={[3.4, 1.0, -6.1]} s={[4.4, 2.0, 2.6]} paint={paintStrata(p)} />
    <BoxTex id="bw-momda-strata" p={[0.6, 0.25, -5.6]} s={[1.2, 0.5, 1.7]} paint={paintStrata(p)} rotY={0.04} />
    <BoxTex id="bw-momda-strata" p={[0.9, 0.7, -5.9]} s={[0.9, 1.4, 1.5]} paint={paintStrata(p)} rotY={-0.05} />
    <BoxTex id="bw-momda-strata" p={[1.12, 1.55, -6.1]} s={[0.55, 0.9, 1.3]} paint={paintStrata(p)} rotY={0.06} />
    <mesh position={[3.4, 2.003, -6.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[4.4, 2.6]} /><meshLambertMaterial map={top} /></mesh>
    {[[3.3, 1.0, 1.9, 0.07], [3.5, 1.5, 1.0, 0.06], [3.4, 0.4, 0.8, 0.09]].map(([x, y, h, w], i) => <mesh key={i} position={[x, y, -4.795]} rotation={[0, 0, (i - 1) * 0.08]}><boxGeometry args={[w, h, 0.02]} /><meshBasicMaterial color="#2c1c34" /></mesh>)}
    {[[2.0, 2.06, -5.4, 0.22], [4.9, 2.05, -5.0, 0.18], [5.2, 2.07, -6.9, 0.26], [1.8, 2.05, -7.0, 0.16]].map(([x, y, z, s], i) => <mesh key={i} position={[x, y + s * 0.4, z]} rotation={[0.3 * i, 0.7 * i, 0.2]} castShadow><dodecahedronGeometry args={[s, 0]} /><meshLambertMaterial color={p.rock[i % 3]} flatShading /></mesh>)}
  </group>
);
};
/** THE MACHINE (chapters 13, 14), a colossus about 9.7 m tall, built as MASSES: a stone pedestal wrapped round the mesa with stairs down to the ground, a steel stepped platform with an open middle (where Doom stands or hovers,
 *  see BW_MARKS.doomMay / doomLoTho), three thick jointed claws with copper edges that rise round the middle and close under a great dish wider than the base, whose inside glows in green rings; two big metal rings turning
 *  round the axis, a green ring and a blazing core above the middle, cables as thick as arms down the stairs and over the ground. Two claws stand at the front sides (angle +-0.5 rad from the x axis), the third behind, so no part
 *  crosses the line from the camera to a figure at the centre.
 *  `trang`: rap (unfinished: scaffolds and a hoist gantry, two claws half built, the third and the dish lying on the ground, dark lamps), chay (everything up: lit coils, green rings, a thick column of light to the sky, lightning crawling on the claws,
 *  shock rings on the ground, specks rising), chayDen (steel but dull and sooty, lamps dim, the dish cracked, no beam, thin smoke). `lit` 0..1 scales the glow and the beam. `pal` gives the stone colours.
 *  Origin = the middle of the base on the mesa top (y 2.0); the ground is at y -2 here. */
type RP = [number, number];
const CLAW: RP[] = [[3.2, 0.2], [3.9, 1.2], [4.1, 2.5], [3.5, 3.8], [2.7, 4.9], [2.2, 5.8], [2.5, 6.5]];
const onClaw = (t: number): RP => { const s = t * (CLAW.length - 1), i = Math.min(CLAW.length - 2, Math.floor(s)), k = s - i; return [CLAW[i][0] + (CLAW[i + 1][0] - CLAW[i][0]) * k, CLAW[i][1] + (CLAW[i + 1][1] - CLAW[i][1]) * k]; };
const Fil: React.FC<{a: V3; b: V3; t: number; c: string}> = ({a, b, t, c}) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va), L = d.length(), q = new THREE.Quaternion().setFromUnitVectors(Y_AX, d.clone().normalize()), m = va.clone().add(vb).multiplyScalar(0.5);
  return <mesh position={m.toArray() as V3} quaternion={q}><boxGeometry args={[t, L, t]} /><meshBasicMaterial color={c} toneMapped={false} /></mesh>;
};
/** The machine's metal: three flat tones per face chosen by the sun, a bright line on box edges, stepped green light from the core and a violet sweep from the Beyonder.
 *  Self-lit on purpose: under the scene's Lambert light most faces turned away from the low sun and the steel read as dull grey (Daniel, 23/11/2026). */
const MAY_U = {uSun: {value: new THREE.Vector3(-0.74, 0.41, 0.33)}, uCore: {value: new THREE.Vector3()}, uGlow: {value: new THREE.Color('#38ff8c')}, uAmt: {value: 0}, uBey: {value: new THREE.Vector3(-0.5, 0.62, 0.6).normalize()}, uBeyC: {value: new THREE.Color('#a66bff')}, uBeyA: {value: 0}, uT: {value: 0}, uOv: {value: new THREE.Vector3(0.173, 0.094, 0.345)}, uOvA: {value: 0}};
const MAY_TONE: Record<string, [string, string, string]> = {
  '#9cc6ec': ['#c4e6fb', '#6fa8de', '#2f4f9c'], '#6f9bd4': ['#9fcdf2', '#4f84cc', '#263f88'], '#d6ecfc': ['#eef9ff', '#9fd0f2', '#4a74bc'], '#b4d6f2': ['#d4eefc', '#7fb6e6', '#35589f'], '#7fa8dc': ['#a8d4f4', '#5a90d4', '#2a4690'],
  '#e8602c': ['#ffb27c', '#f0672c', '#a82c26'], '#ffc62e': ['#fff6a8', '#ffcb2e', '#dc8216'], '#4f74b8': ['#8fb6ea', '#5480c8', '#2f4692'], '#3e5c9e': ['#7aa0dc', '#4468b0', '#28397e'],
};
const mayTone = (hex: string): [THREE.Color, THREE.Color, THREE.Color] => {
  const t = MAY_TONE[hex]; if (t) return [new THREE.Color(t[0]), new THREE.Color(t[1]), new THREE.Color(t[2])];
  const m = new THREE.Color(hex), h = {h: 0, s: 0, l: 0}; m.getHSL(h);
  return [new THREE.Color().setHSL(h.h, Math.min(1, h.s * 1.1), Math.min(0.95, h.l + 0.16)), m, new THREE.Color().setHSL(h.h + (0.7 - h.h) * 0.18, Math.min(1, h.s * 1.1), h.l * 0.62)];
};
const MAY_MATS = new Map<string, THREE.ShaderMaterial>();
const mayMat = (hex: string, hasUv: boolean, hasVc: boolean, flat = false) => { const k = `${hex}|${hasUv}|${hasVc}|${flat}`; let m = MAY_MATS.get(k); if (m) return m; const [L, M, D] = flat ? [new THREE.Color(hex), new THREE.Color(hex), new THREE.Color(hex)] : mayTone(hex);
  m = new THREE.ShaderMaterial({side: THREE.DoubleSide, toneMapped: false, defines: {...(hasUv && !flat ? {HAS_UV: 1} : {}), ...(hasVc && !flat ? {HAS_VC: 1} : {}), ...(flat ? {IS_LAMP: 1} : {})}, uniforms: {...MAY_U, cL: {value: L}, cM: {value: M}, cD: {value: D}},
    vertexShader: `varying vec3 vP; varying vec2 vU; #ifdef HAS_VC
attribute vec3 color; varying vec3 vC;
#endif
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; vU = uv;
#ifdef HAS_VC
vC = color;
#endif
gl_Position = projectionMatrix * viewMatrix * w; }`.replace('vU; #ifdef', 'vU;\n#ifdef'),
    fragmentShader: `uniform vec3 cL, cM, cD, uSun, uCore, uGlow, uBey, uBeyC, uOv; uniform float uAmt, uBeyA, uT, uOvA; varying vec3 vP; varying vec2 vU;
#ifdef HAS_VC
varying vec3 vC;
#endif
void main() {
#ifdef IS_LAMP
  vec3 c = cM;
#else
  vec3 N = normalize(cross(dFdx(vP), dFdy(vP))), V = normalize(cameraPosition - vP); if (dot(N, V) < 0.0) N = -N;
  float d = dot(N, uSun) + 0.3 * N.y; vec3 c = d > 0.6 ? cL : d > -0.1 ? cM : cD;
#ifdef HAS_VC
  c *= mix(vec3(1.0), vC, 0.55);
#endif
#ifdef HAS_UV
  vec2 e = min(vU, 1.0 - vU) / max(fwidth(vU), vec2(1e-5)); if (min(e.x, e.y) < 1.15) c = d > 0.6 ? mix(c, vec3(1.0), 0.7) : d > -0.1 ? mix(c, cL, 0.8) : mix(c, cM, 0.7);
#endif
  vec3 Lc = uCore - vP; float r = length(Lc); Lc /= r; float g = max(dot(N, Lc) + 0.3, 0.0) / (1.0 + r * r * 0.05) * uAmt; c = mix(c, uGlow, clamp(floor(g * 5.0) / 5.0, 0.0, 0.72));
  float py = (vP.y - (uCore.y - 5.4)) / 2.0; c = mix(c, uGlow, step(0.5, N.z) * step(py, 1.05) * floor(clamp(py, 0.0, 1.0) * 3.0) / 3.0 * 0.34 * min(uAmt, 1.0));   // the pedestal's front catches the glow in flat steps, strongest under the platform
  float b = step(uCore.y + 1.3, vP.y) * max(dot(N, uBey), 0.0) * uBeyA * (0.3 + 0.7 * step(0.55, sin(dot(vP.xz, vec2(0.7, 0.5)) * 1.3 + vP.y * 0.6 - uT * 0.24))); c = mix(c, uBeyC, clamp(floor(b * 4.0) / 4.0, 0.0, 0.42));
#endif
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb = clamp((gl_FragColor.rgb - uOv * uOvA) / (1.0 - uOvA), 0.0, 1.0);   // the 'hut' veil of the set is drawn over the opaque pass: undo it here so the machine stays vivid while the world dims
}`});
  MAY_MATS.set(k, m); return m; };
const mayHex = (m: THREE.MeshLambertMaterial) => `#${m.color.getHexString(THREE.SRGBColorSpace)}`;
export const MayHut: React.FC<{trang: 'rap' | 'chay' | 'chayDen'; f?: number; lit?: number; pal?: BwPal; tat?: number}> = ({trang, f = 0, lit = 1, pal, tat = 0}) => {
  const dark = trang === 'chayDen', build = trang === 'rap', on = trang === 'chay' ? lit : 0, glow = on > 0.2, tho = 0.82 + 0.18 * Math.sin(f * 0.35);
  const cM = '#9cc6ec', cM2 = '#6f9bd4', cM3 = '#d6ecfc', cCu = '#e8602c', cAu = '#ffc62e';
  const stL = pal?.stone.lit ?? '#9c96b4', stD = pal?.stone.dark ?? '#6a6488', dim = dark ? '#7fb4bc' : '#4f8f7c', dishOff = ['#7fc4cc', '#3f7f9a', '#66aebc', '#356f8e', '#78bcc4', '#48889f'];
  const root = useRef<THREE.Group>(null);
  const apply = () => { const g = root.current; if (!g) return; const d = pal?.light.dir ?? [-9, 5, 4];
    MAY_U.uSun.value.set(d[0], d[1], d[2]).normalize(); g.updateWorldMatrix(true, false); g.localToWorld(MAY_U.uCore.value.set(0, 3.4, 0.4)); MAY_U.uAmt.value = on * tho * 1.05; MAY_U.uBeyA.value = on * 0.7; MAY_U.uT.value = f; MAY_U.uOvA.value = Math.min(0.62, tat * 0.62) * 0.72;
    g.traverse((o) => { const x = o as THREE.Mesh, m = x.material as THREE.MeshLambertMaterial; if (!x.isMesh || !m || m.map) return; if (m.isMeshLambertMaterial) x.material = mayMat(mayHex(m), !!x.geometry.attributes.uv, !!x.geometry.attributes.color); else if ((m as unknown as THREE.MeshBasicMaterial).isMeshBasicMaterial && !m.transparent) x.material = mayMat(mayHex(m), false, false, true); }); };
  useLayoutEffect(apply); useFrame(apply, -1);
  const Em: React.FC<{p: V3; s: V3; c?: string; r?: V3}> = ({p, s, c = '#7dffa4', r}) => glow ? <mesh position={p} rotation={r}><boxGeometry args={s} /><meshBasicMaterial color={c} toneMapped={false} /></mesh> : <B p={p} s={s} c={dim} r={r} cast={false} />;
  const Band: React.FC<{r0: number; y0: number; r1: number; y1: number; c: string; lamp?: boolean; off?: string}> = ({r0, y0, r1, y1, c, lamp = true, off}) =>
    <mesh position={[0, (y0 + y1) / 2, 0]}><cylinderGeometry args={[r1, r0, y1 - y0, 18, 1, true]} />{glow && lamp ? <meshBasicMaterial color={c} side={THREE.DoubleSide} toneMapped={false} /> : <meshLambertMaterial color={lamp ? off ?? dim : c} side={THREE.DoubleSide} />}</mesh>;
  const cC1 = '#b4d6f2', cC2 = '#7fa8dc', wob = dark ? 0 : Math.sin(f * 0.4) * 0.02, bs = 0.5, S = 0.7;
  const Claw: React.FC<{ang: number; n?: number; back?: boolean}> = ({ang, n = 6, back}) => {
    const pts = CLAW.slice(0, n + 1), tx = (i: number) => 0.95 - 0.42 * (i / 6), tz = (i: number) => 1.2 - 0.6 * (i / 6);
    const r = rnd(300 + Math.round(ang * 10) + Math.floor(f / 2)), zig = (off: number, z0: number) => { const q: V3[] = Array.from({length: 10}, (_, i) => { const [pr, py] = onClaw(i / 9); const e = i === 0 || i === 9 ? 0 : 1; return [pr + 0.6 + off + e * (r() - 0.5) * 0.5, py, z0 + e * (r() - 0.5) * 0.5] as V3; }); return q.slice(0, -1).map((a, i) => <Fil key={i} a={a} b={q[i + 1]} t={0.07} c={i % 2 ? '#ffffff' : '#b8ffd0'} />); };
    return <group rotation={[0, -ang, 0]}>
      <B p={[3.3, 0.5, 0]} s={[2.0, 1.0, 2.4]} c={cM2} /><B p={[3.3, 1.03, 0]} s={[1.7, 0.1, 2.1]} c={cCu} /><B p={[3.3, 0.12, 0]} s={[2.15, 0.14, 2.55]} c={cM3} />
      {pts.slice(0, -1).map((a, i) => { const b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), w = tx(i), z = tz(i);
        return <group key={i} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0]} rotation={[0, 0, -Math.atan2(dx, dy)]}>
          <B p={[0, 0, 0]} s={[w, L + 0.05, z]} c={i % 2 ? cC1 : cC2} />
          <B p={[w * 0.5 + 0.06, 0, 0]} s={[0.14, L * 0.8, z * 0.76]} c={cM3} />
          <B p={[w / 2 - 0.03, 0, 0]} s={[0.1, L * 0.97, z * 1.05]} c={cCu} /><B p={[-w / 2 + 0.03, 0, 0]} s={[0.1, L * 0.97, z * 1.05]} c={cCu} />
          {a[1] > 2.4 && !(back && a[1] < 3.6) ? <Em p={[-w / 2 - 0.03, 0, 0]} s={[0.05, L * 0.72, z * 0.3]} c="#9dffb8" /> : null}
          {(i === 1 && !back) || i === 3 || i === 4 ? [-0.32, -0.16, 0, 0.16, 0.32].map((o, k) => <group key={k}><Em p={[0, o * L, 0]} s={[w * 1.22, 0.09, z * 1.2]} c={(k + Math.floor(f / 3)) % 3 === 0 ? '#ffffff' : k % 2 ? '#35ff8a' : '#a8ffcc'} /></group>) : null}
        </group>; })}
      {pts.map((q, i) => <group key={i} position={[q[0], q[1], 0]}><B p={[0, 0, 0]} s={[tx(i) * 1.28, 0.4, tz(i) * 1.22]} c={cAu} /><B p={[0, 0, 0]} s={[0.3, 0.3, tz(i) * 1.6]} c={cCu} /></group>)}
      {n === 6 ? <group position={[CLAW[6][0], CLAW[6][1], 0]} rotation={[0, 0, -0.9]}><B p={[0, 0.25, 0]} s={[0.5, 0.9, 0.7]} c={cM3} /><B p={[0, 0.78, 0]} s={[0.3, 0.3, 0.5]} c={cAu} /></group> : null}
      {glow ? <>{zig(0, 0.2)}{zig(0.1, -0.25)}</> : null}
    </group>;
  };
  const Plate: React.FC<{a: number; rr: number; d: number; w: number; h: number; i: number; lamp?: boolean}> = ({a, rr, d, w, h, i, lamp}) =>
    <group position={[rr * Math.cos(a), 0, rr * Math.sin(a)]} rotation={[0, -a, 0]}><B p={[0, 0, 0]} s={[d, h, w]} c={i % 3 === 1 ? cM2 : i % 2 ? cM : cM3} /><B p={[0, h / 2, 0]} s={[d * 1.05, 0.06, w * 0.96]} c={cM2} />{lamp ? <Em p={[d * 0.1, h / 2 + 0.07, 0]} s={[d * 0.5, 0.1, w * 0.5]} c="#c8ffdc" /> : null}</group>;
  const Ring: React.FC<{y: number; rr: number; tilt: [number, number]; spin: number; n: number; d: number; h: number}> = ({y, rr, tilt, spin, n, d, h}) =>
    <group position={[0, y + wob, 0]} rotation={[tilt[0], 0, tilt[1]]}><group rotation={[0, spin, 0]}>
      {Array.from({length: n}, (_, i) => <Plate key={i} a={(i / n) * 6.2832} rr={rr} d={d} w={(6.2832 * rr) / n * 0.92} h={h} i={i} lamp={i % 3 === 0} />)}
      {[0, 1, 2, 3].map((k) => <Bar key={k} a={[0, 0, 0]} b={[(rr - d / 2) * Math.cos((k / 4) * 6.2832 + 0.4), 0, (rr - d / 2) * Math.sin((k / 4) * 6.2832 + 0.4)]} t={0.09} c={cM2} />)}
    </group></group>;
  const dY = (r: number) => 0.35 + 0.065 * r * r, dishR = [0.4, 1.2, 2.0, 2.8, 3.6, 4.2, 4.6], dishC = ['#f2fff6', '#46e88c', '#c8ffdc', '#2cc477', '#9affc2', '#3adb86'];
  const Scaff: React.FC<{x: number; z: number; h: number; w?: number}> = ({x, z, h, w = 1.1}) => <group position={[x, -2, z]}>
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Bar key={i} a={[a * w / 2, 0, b * w / 2]} b={[a * w / 2, h, b * w / 2]} t={0.16} c={cM2} />)}
    {Array.from({length: Math.floor(h / 1.5)}, (_, k) => { const y = 0.8 + k * 1.5; return <React.Fragment key={k}>
      <Bar a={[-w / 2, y, w / 2]} b={[w / 2, y + 1.5, w / 2]} t={0.07} c={cM} /><Bar a={[w / 2, y, -w / 2]} b={[-w / 2, y + 1.5, -w / 2]} t={0.07} c={cM} /><Bar a={[-w / 2, y, -w / 2]} b={[-w / 2, y + 1.5, w / 2]} t={0.07} c={cM} />
      <Bar a={[-w / 2, y, w / 2]} b={[w / 2, y, w / 2]} t={0.09} c={cM2} />{k % 2 ? <B p={[0, y, 0]} s={[w * 1.5, 0.1, w * 1.5]} c="#d8a448" /> : null}</React.Fragment>; })}
  </group>;
  return (
    <group ref={root}>
      {glow ? <pointLight position={[0, 2.6, 2.4]} color="#3dff8e" intensity={5.5 * on * tho} distance={15} decay={1.7} /> : null}
      {glow ? <Cut id="bw-may-datxanh" pos={[0, -1.95, 2.2]} w={19} h={15} px={512} rotX={-Math.PI / 2} order={2} add opacity={0.62 * on * tho} paint={(c, W, H2) => { [[0.5, 0.1], [0.38, 0.16], [0.27, 0.24], [0.16, 0.34]].forEach(([k, a]) => { c.fillStyle = `rgba(50,255,140,${a})`; c.beginPath(); c.ellipse(W / 2, H2 / 2, W * k, H2 * k, 0, 0, 7); c.fill(); }); }} /> : null}
      <group scale={[S, 1, S]}>
      {/* the stone pedestal wrapped round the mesa, its steps down to the ground */}
      <B p={[0.4, -1.0, 0.2]} s={[8.2, 2.0, 7.4]} c={stD} /><B p={[0.4, -0.01, 0.2]} s={[7.8, 0.06, 7.0]} c={stL} />
      <B p={[0.4, -1.45, 5.0]} s={[6.4, 1.1, 1.8]} c={stL} /><B p={[0.4, -1.75, 6.8]} s={[5.4, 0.5, 1.8]} c={stD} />
      <B p={[4.7, -1.2, 3.2]} s={[1.2, 1.6, 1.4]} c={stL} /><B p={[-3.9, -1.3, 3.0]} s={[1.0, 1.4, 1.2]} c={stL} />
      {[-3.6, 4.5].map((x, i) => <B key={i} p={[x, -0.6, -3.2]} s={[1.5, 2.8, 1.3]} c={stL} />)}
      {[-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6, 4.4].map((x, i) => <B key={i} p={[x, 0.06, 3.65]} s={[0.9, 0.2, 0.3]} c={i % 2 ? cM3 : cM2} />)}
      {/* cables as thick as arms: from the platform over the lip of the pedestal, down the steps, across the ground */}
      {[-1.5, 0, 1.5].map((ox, k) => { const pts: V3[] = [[ox, 0.3, 3.0], [ox * 1.05, 0.28, 3.9], [ox * 1.1, -0.8, 4.2], [ox * 1.2, -0.8, 5.2], [ox * 1.3, -1.45, 5.7], [ox * 1.5, -1.45, 6.6], [ox * 1.9 + k * 0.3, -1.9, 7.8], [ox * 2.6 + k * 0.9, -1.9, 9.6]];
        return pts.slice(0, -1).map((a, i) => <Bar key={`${k}${i}`} a={a} b={pts[i + 1]} t={0.3 - i * 0.014} c={k % 2 ? '#4f74b8' : '#3e5c9e'} />); })}
      {[-1.6, 0, 1.6].map((ox, k) => <B key={k} p={[ox * 1.05, 0.3, 3.5]} s={[0.55, 0.5, 0.35]} c={cCu} />)}
        {build ? <>
        <Scaff x={-5.4} z={-0.5} h={8} /><Scaff x={6.2} z={-1.2} h={6.5} /><Scaff x={-2.2} z={-5.2} h={9.5} w={1.3} /><Scaff x={3.4} z={-5.2} h={9.5} w={1.3} />
        <Bar a={[-2.2, 7.7, -5.2]} b={[3.4, 7.7, -5.2]} t={0.3} c={cM2} /><Bar a={[-2.2, 8.2, -5.2]} b={[3.4, 8.2, -5.2]} t={0.2} c={cM} />
        {[-1.0, 2.2].map((x, i) => <Bar key={i} a={[x, 7.6, -5.2]} b={[x + (i ? -1.2 : 1.2), 1.8, -1.0]} t={0.08} c="#2a2c34" />)}
        <Bar a={[-5.4, 6.2, -0.5]} b={[-3.8, 4.6, 0.8]} t={0.1} c={cM} />
        </> : null}
      </group>
      <group scale={S}>
      {/* the steel platform: a stepped ring with the middle open, a copper rim, lamps, a dark inlaid pad where Doom stands */}
      <FacetLathe profile={[[3.5, 0.02], [3.5, 0.14], [3.1, 0.22], [1.35, 0.22], [1.35, 0.02]]} sides={16} color={cM2} cast contact={false} />
      <FacetLathe profile={[[2.5, 0.22], [2.4, 0.34], [1.7, 0.34], [1.6, 0.22]]} sides={16} color={cAu} cast contact={false} />
      <FacetLathe profile={[[3.62, 0.02], [3.62, 0.12], [3.5, 0.14], [3.5, 0.02]]} sides={16} color={cCu} cast={false} contact={false} />
      <FacetLathe profile={[[1.35, 0.04], [1.35, 0.045], [0.0, 0.045]]} sides={16} color={cM2} cast={false} contact={false} />
      {Array.from({length: 16}, (_, i) => { const a = (i / 16) * 6.2832; return <Em key={i} p={[3.2 * Math.cos(a), 0.24, 3.2 * Math.sin(a)]} s={[0.4, 0.1, 0.4]} r={[0, -a, 0]} c="#9dffb8" />; })}
      {/* the claws */}
      {build ? <>
        <Claw ang={0.5} n={4} /><Claw ang={Math.PI - 0.5} n={2} />
        <group position={[-6.4, 1.3, 4.8]} rotation={[0, 0.5, -1.35]}><Claw ang={0} /></group>
      </> : <><Claw ang={0.5} /><Claw ang={Math.PI - 0.5} /><Claw ang={-Math.PI / 2} back /></>}
      {/* two great rings turning round the axis, a green ring and a core above the middle */}
      {!build ? <>
        <Ring y={3.3} rr={5.3} tilt={[-0.1, 0.04]} spin={f * 0.03} n={26} d={0.8} h={0.36} />
        <Ring y={5.3} rr={3.95} tilt={[0.08, -0.05]} spin={-f * 0.045} n={22} d={0.7} h={0.34} />
        <group position={[0, 4.55 + wob, 0]} rotation={[0.2, f * 0.08, 0.05]}>{Array.from({length: 20}, (_, i) => { const a = (i / 20) * 6.2832; return <Em key={i} p={[1.45 * Math.cos(a), 0, 1.45 * Math.sin(a)]} s={[0.5, 0.1, 0.32]} r={[0, -a, 0]} c={i % 2 ? '#6dffa0' : '#e4ffec'} />; })}</group>
        <group position={[0, 3.7 + wob, 0]} rotation={[0, f * 0.05, 0]}>
          {glow ? <><mesh scale={[0.85, 1.15, 0.85]}><octahedronGeometry args={[1, 0]} /><meshBasicMaterial color="#46e88c" toneMapped={false} /></mesh><mesh scale={[0.5, 0.66, 0.5]}><octahedronGeometry args={[1, 0]} /><meshBasicMaterial color="#f4fff8" toneMapped={false} /></mesh></>
            : <mesh scale={[0.85, 1.15, 0.85]}><octahedronGeometry args={[1, 0]} /><meshLambertMaterial color={dark ? '#7fb4bc' : '#4f8f7c'} flatShading /></mesh>}
        </group>
        {glow ? <><Halo pos={[0, 3.7, 0.6]} r={3.4 * on * tho} color="#46ff96" strength={0.5 * on} order={103} /><Em p={[0, 5.5, 0]} s={[0.3, 3.4, 0.3]} c="#e4ffec" /></> : <Bar a={[0, 4.6, 0]} b={[0, 6.6, 0]} t={0.28} c={cM2} />}
        {/* the dish: a collar on the claw tips, a tilted bowl (its inside faces the viewer), green rings in it */}
        <group position={[0, 6.4 + wob, 0]}>
          <FacetLathe profile={[[2.9, -0.5], [2.9, 0.15], [2.3, 0.45], [2.0, -0.1]]} sides={12} color={cM2} cast contact={false} />
          <FacetLathe profile={[[3.0, -0.2], [3.0, -0.05], [2.9, -0.05]]} sides={12} color={cCu} cast={false} contact={false} />
          <group rotation={[bs, 0, 0]}>
            <FacetLathe profile={[[0.9, -1.2], [1.6, -0.6], [1.9, 0.0], [1.7, 0.45]]} sides={10} color={cM2} cast contact={false} />
            <FacetLathe profile={[[4.4, dY(4.6) - 0.2], ...dishR.map((r) => [r * 0.96, dY(r) - 0.65] as [number, number]).reverse()]} sides={18} color={cM} cast contact={false} />
            {dishR.slice(0, -1).map((r, i) => <Band key={i} r0={r} y0={dY(r)} r1={dishR[i + 1]} y1={dY(dishR[i + 1])} c={dishC[i]} off={dishOff[i]} />)}
            <Band r0={4.75} y0={dY(4.6) - 0.3} r1={4.78} y1={dY(4.6) + 0.35} c={cAu} lamp={false} />
            {Array.from({length: 12}, (_, i) => { const a = (i / 12) * 6.2832; return <Em key={i} p={[4.6 * Math.cos(a), dY(4.6) + 0.45, 4.6 * Math.sin(a)]} s={[0.36, 0.2, 0.36]} c="#e4ffec" />; })}
            {glow ? <Em p={[0, 1.2, 0]} s={[0.55, 1.6, 0.55]} c="#ffffff" /> : <B p={[0, 1.0, 0]} s={[0.5, 1.3, 0.5]} c={cM3} />}
          </group>
        </group>
        {glow ? <Cut id="bw-core-star" pos={[0, 7.1, 0.9]} w={3.2} h={3.2} px={256} order={104} add opacity={on * 0.6 * tho} paint={(c, W, H2) => { const x = W / 2, y = H2 / 2; [[1, 1], [0.55, 0.55]].forEach(([k, a]) => { c.fillStyle = `rgba(230,255,240,${a})`; c.beginPath(); c.moveTo(x, y - H2 * 0.48 * k); c.lineTo(x + W * 0.07 * k, y - H2 * 0.07 * k); c.lineTo(x + W * 0.48 * k, y); c.lineTo(x + W * 0.07 * k, y + H2 * 0.07 * k); c.lineTo(x, y + H2 * 0.48 * k); c.lineTo(x - W * 0.07 * k, y + H2 * 0.07 * k); c.lineTo(x - W * 0.48 * k, y); c.lineTo(x - W * 0.07 * k, y - H2 * 0.07 * k); c.closePath(); c.fill(); }); }} /> : null}
        {glow ? <Halo pos={[0, 7.3, 1.2]} r={4.6 * on * tho} color="#46ff96" strength={0.22 * on} order={103} /> : null}
      </> : <group position={[-9.5, -1.2, 2.0]} rotation={[0.35, 0.4, 0.1]}>
        <FacetLathe profile={[[4.6, dY(4.6) + 0.1], ...dishR.map((r) => [r, dY(r) - 0.3] as [number, number]).reverse()]} sides={18} color={cM} cast contact={false} />
        {dishR.slice(0, -1).map((r, i) => <Band key={i} r0={r} y0={dY(r)} r1={dishR[i + 1]} y1={dY(dishR[i + 1])} c={dishOff[i]} lamp={false} />)}
      </group>}
      {dark ? <Cut id="bw-dish-crack" pos={[0.4, 7.5, 2.2]} w={4.5} h={3.2} px={256} fog order={5} paint={(c, W, H2) => { c.strokeStyle = '#1c1624'; c.lineWidth = 9; c.beginPath(); c.moveTo(W * 0.1, H2 * 0.15); c.lineTo(W * 0.4, H2 * 0.45); c.lineTo(W * 0.34, H2 * 0.62); c.lineTo(W * 0.8, H2 * 0.92); c.stroke(); }} /> : null}
      </group>
      {/* a column of light to the sky, shock rings on the ground, specks rising */}
      {trang === 'chay' && on > 0 ? <>
        {/* the column: flat saturated bands (normal blending, so it stays green on a bright sky), narrow enough to leave the dish and the ray to the Beyonder readable */}
        <Cut id="bw-beam2" pos={[0, 5.2 + 36, 0.2]} w={1.5} h={72} px={256} order={102} opacity={Math.min(1, on) * (0.86 + 0.14 * Math.sin(f * 0.7))} paint={(c, W, H2) => { c.clearRect(0, 0, W, H2); c.fillStyle = 'rgba(30,214,120,0.62)'; c.fillRect(0, 0, W, H2); c.fillStyle = 'rgba(120,255,180,0.85)'; c.fillRect(W * 0.2, 0, W * 0.6, H2); c.fillStyle = 'rgba(240,255,246,0.97)'; c.fillRect(W * 0.41, 0, W * 0.18, H2); }} />
        <Cut id="bw-beam-wide2" pos={[0, 5.2 + 36, 0.1]} w={3.1} h={72} px={128} order={101} opacity={Math.min(1, on) * 0.22} paint={(c, W, H2) => { c.clearRect(0, 0, W, H2); c.fillStyle = 'rgba(40,230,130,0.5)'; c.fillRect(0, 0, W, H2); }} />
        {[0, 1, 2].map((k) => { const ph = ((f + k * 14) % 42) / 42; return <Cut key={k} id="bw-shock" pos={[0, -1.93, 2]} w={4 + ph * 26} h={4 + ph * 26} px={256} rotX={-Math.PI / 2} order={5} add opacity={on * (1 - ph) * 0.9} paint={(c, W, H2) => { c.strokeStyle = 'rgba(170,255,205,0.95)'; c.lineWidth = W * 0.025; c.beginPath(); c.arc(W / 2, H2 / 2, W * 0.45, 0, 7); c.stroke(); c.lineWidth = W * 0.008; c.beginPath(); c.arc(W / 2, H2 / 2, W * 0.38, 0, 7); c.stroke(); }} />; })}
        <Hat f={f} box={[-3.2, 3.2, 0, 6.5, -2.5, 3]} n={Math.round(46 * on)} colors={['#b8ffd0', '#ffffff', '#6dffa0']} size={0.09} wind={[0, 1.4]} kind="kim" seed={12} order={8} />
      </> : null}
    </group>
  );
};
