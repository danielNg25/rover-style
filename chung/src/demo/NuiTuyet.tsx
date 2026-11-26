import React from 'react';
import {AbsoluteFill, Composition, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {GradeCtx, Grade, Finish, Ground} from '../lib3/look';
import {Plate, TheoTam, Sprite, rnd, P, Ctx, paintPeak, paintCastle, paintPine} from '../lib3/depth';
import {StageCam, AutoRecv} from '../lib3/kit';
import {Shot} from '../lib3/shot';
import {SnowPine, Tuft} from '../lib3/nature';
import {DriftSpecks} from '../lib3/kitLab';
import {FarLights, onPlate} from '../lib3/kitCamp';
import {CoPhuon, TuVienPlate, DenLongCam, DongDaKhac, FLAG5} from '../lib3/kitTayTang';
import type {TuVienPal} from '../lib3/kitTayTang';
import {RockShelter, SnowRock, SnowDrift, SnowGrave, StandRock, BrokenPine, Footprints, paintTwigs, snowCrustTex, Blizzard, SnowVeils, PathPair, WallShadow, PathSoldiers, SHELTER} from '../lib3/kitNuiTuyet';
import {Puppet3} from '../mould/Puppet3';
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
import {EXPR} from '../mould/expr';
import type {Spec} from '../mould/draw';

/** THE SNOWY MOUNTAINSIDE WITH A ROCK SHELTER (first built for the Doom episode, chapter d1c4 set C). World in metres,
 *  the lens looks along -z; the standard camera is EYE = [0, 1.6, 6].
 *    the shelter (lib3/kitNuiTuyet RockShelter): wall face z -4.0, x -2.5..2.5, 2.6 high; the overhang reaches z -2.8, underside
 *      2.1; buttresses at x -3.8..-2.5 and 2.5..3.9; drifts along the foot (to z -3.5) and against the buttresses.
 *    beside it: a low round boulder left (-3.6, -2.4), a snapped pine right (3.4, -3.0) with its top lying in the snow.
 *    near: snow mounds, rocks, dry twigs, a trail of footprints coming in from the front right into the shelter.
 *    middle (z -8..-24): snow-laden pines in clumps left and right, dark rocks out of the snow, drifts.
 *    painted: the far slope (z -35) with a zigzag path climbing from lower right to upper left; a shoulder (z -60) on the left
 *      with the Baron's castle; the far range (z -120); the sky; a cloud layer that moves (storm).
 *  STATES (one table, NUI_LOOK, plus the painted layers in NUI_PAL): 'dem-bao' = night of the storm (moon low through cloud
 *  from the upper left, snow driven from right to left in two layers, veils of snow along the ground, castle windows lit);
 *  'binh-minh' = dawn after it (pink sky low on the horizon, the low sun from the lens side on the left, sparse glittering snow,
 *  mist drifting on the far slope, the father's grave). A new state (chapters 8-9: Tibet) = one entry in NUI_PAL and NUI_LOOK;
 *  `land` picks the landmark painted on the shoulder ('castle' now; add 'monastery' there). */
type V3 = [number, number, number];
export type NuiState = 'dem-bao' | 'binh-minh' | 'tay-tang';
export const NUI_EYE: V3 = [0, 1.6, 6];
const EYE = NUI_EYE;

/** Marks (metres). Each checked in the state named. */
export const NUI_MARKS = {
  hocCha: [-0.6, 0, -2.7] as V3,   // dem-bao: the father, in front of the boy (he puts his arm round him), right at the overhang's edge
  hocCon: [0.3, 0, -3.15] as V3,   // dem-bao: the boy, 0.85 m in front of the wall
  moTuyet: [-0.6, 0, -3.0] as V3,  // binh-minh: the grave mound (1.6 long along x), where the father stood
  conMot: [0.7, 0, -2.6] as V3,    // binh-minh: the boy alone, to the right of the grave
  daDung: [1.0, 0.3, -3.25] as V3, // binh-minh (rock there in both states): the boy standing ON the low rock (feet at 0.3), 0.7 m from the wall
};
/** Marks of the Tibet state 'tay-tang' (d1c9 scenes 1-3; the shelter is switched off there, the ground is open snow). Wind blows from the RIGHT to the LEFT.
 *  victorDi = where he walks (towards screen right, against the wind) in view tt1; victorKhuyu = where he kneels and falls (tt2); victorNam = where he lies (tt3);
 *  the monks come in from the left: truTri kneels behind his shoulder (0.5 m), suTre holds the lantern, thoRen bends over him. */
export const NUI_MARKS_TT = {
  victorDi: [0.2, 0, -1.6] as V3,
  victorKhuyu: [1.2, 0, -1.2] as V3,
  victorNam: [0.9, 0, -1.4] as V3,
  truTri: [0.15, 0, -1.9] as V3,
  suTre: [-1.0, 0, -1.2] as V3,
  thoRen: [-0.15, 0, -0.6] as V3,
};
/** Camera positions for the shots of d1c4 (see the stage notes, out/d1c4/ghi-chu-san-khau-nui-tuyet.md). */
export const NUI_VIEWS = {
  std: EYE,
  s12: [6.0, 2.4, 3.2] as V3,      // the far slope and its path, the shelter a dark block at the lower left
  s13: [0.2, 1.6, 6.0] as V3,
  s14: [-0.15, 1.3, 0.6] as V3,
  s16: [-0.15, 1.3, 1.8] as V3,
  s18: [0.8, 2.4, 14.0] as V3,
  s21: [1.0, 0.9, 3.0] as V3,     // the boy on the rock (daDung moved to x 1.0: see the report)
  // 'tay-tang' (d1c9): tt1 = scene 1 (Victor walks into the storm), tt2 = scene 2 (he kneels and falls), tt3 = scene 3 (the monks find him, the monastery appears)
  tt1: [-0.4, 1.5, 6.2] as V3,
  tt2: [1.0, 1.1, 6.0] as V3,
  tt3: [1.4, 1.5, 7.4] as V3,
  /** the end of scene 3: the camera has flown to 22 m in front of the monastery's main hall (see NUI_TUVIEN); a closer eye shows the plate's own paper-cut blocks and windows large */
  ttCua: [-17.8, 13.0, -37.8] as V3,
};
/** Where the monastery stands: the plate's screen region on the 1600 x 900 frame of EYE, its distance, and the lower left window (world point), for a camera that flies into it. */
export const NUI_TUVIEN = {region: [-160, -30, 980, 520] as [number, number, number, number], d: 64, cua: onPlate(EYE, 64, 293, 168, 0.5)};

// ---------------------------------------------------------------- painted layers (screen units 1600 x 900 of EYE)
/** colours of the painted far layers by state */
type Pal = {
  sky: [string, string, string, string]; glow: {x: number; y: number; r: number; col: string; disc?: string}; cloud: [string, string, string]; streaks: number;
  peak: {light: string; dark: string; snow: string; snowShade: string}; peakHaze: string;
  shoulder: {lit: string; shade: string; rock: string}; castle: {stone: string; shade: string; roof: string; roofShade: string; mark: string; flag: string}; windows: boolean;
  slope: {lit: string; mid: string; shade: string; rock: string; path: string; pathEdge: string; pine: {light: string; dark: string; trunk: string}; cap: string}; mist: string;
  fg: {drift: string; top: string; rock: string; rockLit: string};
  tuVien?: TuVienPal;
};
export const NUI_PAL: Record<NuiState, Pal> = {
  'dem-bao': {
    sky: ['#222b46', '#36405e', '#4e5a7c', '#68749a'], glow: {x: 150, y: 78, r: 62, col: '214,224,248', disc: '#eef2fa'}, cloud: ['#36405e', '#4a5576', '#8892b4'], streaks: 70,
    peak: {light: '#626c8a', dark: '#4e5774', snow: '#a2acc8', snowShade: '#848fae'}, peakHaze: 'rgba(140,152,186,0.55)',
    shoulder: {lit: '#8c96b4', shade: '#6c7696', rock: '#3e4560'}, castle: {stone: '#5e6684', shade: '#525a78', roof: '#4a5272', roofShade: '#424a68', mark: '#ffcf6e', flag: '#8a2a2a'}, windows: true,
    slope: {lit: '#a2acc8', mid: '#8a94b2', shade: '#707a98', rock: '#3a4058', path: '#5e6888', pathEdge: '#c8d0e6', pine: {light: '#2e3a48', dark: '#24303e', trunk: '#1a1a20'}, cap: '#c0c8e0'}, mist: 'rgba(170,180,210,0.35)',
    fg: {drift: '#3a4260', top: '#56607e', rock: '#222838', rockLit: '#363e54'},
  },
  'binh-minh': {
    sky: ['#6f83aa', '#a9b2c8', '#e8c6be', '#f6d4a8'], glow: {x: -120, y: 470, r: 0, col: '255,214,170'}, cloud: ['#b8a8b8', '#d8c4c6', '#f4d8cc'], streaks: 0,
    peak: {light: '#a4acc6', dark: '#8a93b2', snow: '#fbe4dc', snowShade: '#c4c4d8'}, peakHaze: 'rgba(240,226,226,0.45)',
    shoulder: {lit: '#f2e2e0', shade: '#b8bdd4', rock: '#7c829c'}, castle: {stone: '#9aa0b8', shade: '#8a90aa', roof: '#7e86a2', roofShade: '#727a96', mark: '#6a6e88', flag: '#9a3a36'}, windows: false,
    slope: {lit: '#f6eae6', mid: '#dcd6e2', shade: '#b4b8d0', rock: '#6a6e88', path: '#bfc0d6', pathEdge: '#fff6f2', pine: {light: '#3c4a54', dark: '#2e3a44', trunk: '#2a2628'}, cap: '#f4ecec'}, mist: 'rgba(250,240,240,0.5)',
    fg: {drift: '#8c8eaa', top: '#b8b6cc', rock: '#3c4056', rockLit: '#5a5e76'},
  },
  /** Tibet, late afternoon in a blizzard (d1c9 scenes 1-3): pale lilac-grey snow country under a low overcast, driven snow, the white monastery a smudge up on the left. */
  'tay-tang': {
    sky: ['#626b8c', '#868eaf', '#aeb0c6', '#c9c6d4'], glow: {x: 330, y: 230, r: 0, col: '250,236,222'}, cloud: ['#6c7494', '#8e96b4', '#bcc0d4'], streaks: 110,
    peak: {light: '#98a2be', dark: '#7c86a6', snow: '#f2f2f8', snowShade: '#bcc3da'}, peakHaze: 'rgba(214,218,236,0.5)',
    shoulder: {lit: '#e8e6f0', shade: '#a8aec8', rock: '#69718e'}, castle: {stone: '#9aa0b8', shade: '#8a90aa', roof: '#7e86a2', roofShade: '#727a96', mark: '#6a6e88', flag: '#9a3a36'}, windows: false,
    slope: {lit: '#f0eef6', mid: '#d2d4e6', shade: '#a6acc6', rock: '#5a6280', path: '#bcc0d6', pathEdge: '#fafaff', pine: {light: '#38464f', dark: '#2c3840', trunk: '#2a2628'}, cap: '#eeecf4'}, mist: 'rgba(232,232,244,0.5)',
    fg: {drift: '#98a0bc', top: '#c4c8dc', rock: '#3c4056', rockLit: '#5a5e76'},
    tuVien: {wall: '#f6f2ea', wallShade: '#c6c6d8', band: '#8d2f2c', bandShade: '#6c2424', roof: '#e0b23c', roofShade: '#b08528', rock: '#5a6280', rockLit: '#7a84a2', snow: '#f4f2f8', win: '#ffd27a', flag: FLAG5, red: '#a8382c', redShade: '#7a2822', stone: '#9a9aae', stoneShade: '#6e6e88', wood: '#6a4a34'},
  },
};
/** The same state when the storm breaks (d1c9 scene 3): low gold light, a pink-cream sky, the white and gold monastery lit. Mixed in by `tan` (0..1, three steps). */
const TAN_PAL: Pal = {
  sky: ['#7d9acb', '#b2c2e0', '#efd0b8', '#f8dcb0'], glow: {x: 330, y: 300, r: 0, col: '255,214,150'}, cloud: ['#b2b2c8', '#d8cccf', '#f6dcc8'], streaks: 0,
  peak: {light: '#a6aec8', dark: '#8c95b4', snow: '#fff0e2', snowShade: '#c9c4d6'}, peakHaze: 'rgba(250,232,222,0.45)',
  shoulder: {lit: '#fff0e4', shade: '#b6bad2', rock: '#767e9a'}, castle: NUI_PAL['binh-minh'].castle, windows: false,
  slope: {lit: '#fff2e8', mid: '#e2d8e4', shade: '#b4b8d2', rock: '#626a86', path: '#c4c4da', pathEdge: '#fff8f2', pine: {light: '#3a4852', dark: '#2e3a42', trunk: '#2a2628'}, cap: '#fff0e8'}, mist: 'rgba(252,236,230,0.5)',
  fg: {drift: '#a6a4c0', top: '#d4cadc', rock: '#3c4056', rockLit: '#5a5e76'},
  tuVien: {wall: '#fff4e2', wallShade: '#d4c8d0', band: '#9a3430', bandShade: '#762a28', roof: '#f2c448', roofShade: '#c8942c', rock: '#6a7290', rockLit: '#8c92ae', snow: '#fff2e8', win: '#ffd27a', flag: FLAG5, red: '#b83e30', redShade: '#8a2c24', stone: '#b0a6b4', stoneShade: '#7e748e', wood: '#7a5638'},
};
const lerpHex = (a: string, b: string, t: number) => (a.startsWith('#') && b.startsWith('#') ? '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString() : a);
const mixDeep = (a: any, b: any, t: number): any => (typeof a === 'string' ? lerpHex(a, b, t) : typeof a === 'number' ? a + (b - a) * t : Array.isArray(a) ? a.map((x, i) => mixDeep(x, b[i], t)) : a && typeof a === 'object' ? Object.fromEntries(Object.keys(a).map((k) => [k, mixDeep(a[k], b[k], t)])) : a);
const sky = (p: Pal) => (c: Ctx) => {
  const g = c.createLinearGradient(0, -140, 0, 520); g.addColorStop(0, p.sky[0]); g.addColorStop(0.45, p.sky[1]); g.addColorStop(0.8, p.sky[2]); g.addColorStop(1, p.sky[3]); c.fillStyle = g; c.fillRect(-300, -200, 2200, 1300);
  const q = p.glow; if (q.disc) { const h = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 6); h.addColorStop(0, `rgba(${q.col},0.5)`); h.addColorStop(0.3, `rgba(${q.col},0.16)`); h.addColorStop(1, `rgba(${q.col},0)`); c.fillStyle = h; c.fillRect(q.x - q.r * 6, q.y - q.r * 6, q.r * 12, q.r * 12); c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fillStyle = q.disc; c.fill(); }
  else { const h = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, 900); h.addColorStop(0, `rgba(${q.col},0.75)`); h.addColorStop(0.4, `rgba(${q.col},0.25)`); h.addColorStop(1, `rgba(${q.col},0)`); c.fillStyle = h; c.fillRect(-300, -200, 2200, 1300); }
  // cloud banks: long flat streaks in three tones, thicker towards the top; at night the ones near the moon catch its edge
  const r = rnd(41);
  for (let i = 0; i < 26; i++) { const y = -120 + r() * 520 * (0.3 + 0.7 * r()), x = -300 + r() * 2100, w = 260 + r() * 620, h = 16 + r() * 40, near = Math.hypot(x + w / 2 - q.x, y - q.y) < 420;
    c.fillStyle = p.cloud[0]; c.beginPath(); c.roundRect(x, y + h * 0.35, w, h, h / 2); c.fill(); c.fillStyle = near && q.disc ? p.cloud[2] : p.cloud[1]; c.beginPath(); c.roundRect(x + w * 0.08, y, w * 0.8, h * 0.7, h / 2); c.fill(); }
  // a cloud over the lower half of the moon
  if (q.disc) { c.fillStyle = p.cloud[1]; c.beginPath(); c.roundRect(q.x - 160, q.y + 10, 380, 34, 17); c.fill(); c.fillStyle = p.cloud[2]; c.beginPath(); c.roundRect(q.x - 110, q.y + 6, 220, 10, 5); c.fill(); }
  // driven snow far off: thin slanted strokes
  for (let i = 0; i < p.streaks; i++) { const x = -300 + r() * 2200, y = -150 + r() * 700, l = 40 + r() * 90; c.strokeStyle = `rgba(210,220,245,${0.06 + r() * 0.1})`; c.lineWidth = 1.5 + r() * 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - l, y + l * 0.45); c.stroke(); }
};
/** loose clouds racing across in a storm (a separate layer that the scene slides with the frame) */
const scud = (p: Pal) => (c: Ctx) => { const r = rnd(77); for (let i = 0; i < 9; i++) { const x = -300 + r() * 2200, y = -60 + r() * 300, w = 300 + r() * 400, h = 20 + r() * 26; c.fillStyle = p.cloud[0]; c.globalAlpha = 0.75; c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fill(); c.fillStyle = p.cloud[1]; c.beginPath(); c.roundRect(x + w * 0.1, y - h * 0.3, w * 0.6, h * 0.7, h / 2); c.fill(); c.globalAlpha = 1; } };
const farRange = (p: Pal) => (c: Ctx) => {
  { const pk = {...p.peak, motSac: true}; paintPeak(c, 1000, 40, 520, 600, pk); paintPeak(c, 330, 120, 420, 600, pk); paintPeak(c, 1560, 90, 430, 600, pk); paintPeak(c, -200, 170, 330, 600, pk); paintPeak(c, 1900, 190, 300, 600, pk); }   // luật 13: núi xa một sắc (K6, 26/11)
  // (K6, 26/11/2026) bỏ 40 vệt tam giác tuyết và đá trên mặt núi: luật 13, núi xa mỗi lớp một sắc
  const g = c.createLinearGradient(0, 260, 0, 520); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, p.peakHaze); c.fillStyle = g; c.fillRect(-300, 260, 2200, 400);
};
/** the shoulder on the left with the landmark (the Baron's castle) */
const shoulder = (p: Pal, land: 'castle' | 'none' | 'monastery') => (c: Ctx) => {
  const pts = [[-320, 268], [-120, 250], [40, 262], [250, 262], [420, 300], [560, 352], [760, 420], [980, 470], [1200, 490], [1920, 500]];
  P(c, [...pts, [1920, 700], [-320, 700]], p.shoulder.shade);
  // the lit faces (slopes towards the upper left) and rock ribs with snow between
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; if (y1 >= y0) P(c, [[x0, y0], [x1, y1], [x1 - 40, 700], [x0 - 60, 700]], i % 2 ? p.shoulder.lit : p.shoulder.shade); }
  const r = rnd(9); for (let i = 0; i < 26; i++) { const x = -260 + r() * 1300, y = 300 + r() * 180; c.fillStyle = p.shoulder.rock; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 26 + r() * 40, y + 12 + r() * 20); c.lineTo(x + 6, y + 30 + r() * 30); c.closePath(); c.fill(); c.fillStyle = p.shoulder.lit; c.fillRect(x + 2, y - 2, 18 + r() * 16, 4); }
  for (let x = -260; x < 900; x += 18 + r() * 30) { const y = 312 + (x + 260) * 0.17 + r() * 20, h = 18 + r() * 16; paintPine(c, x, y, h, h * 0.5, p.slope.pine, 3); }
  if (land === 'castle') {
    paintCastle(c, 40, 262, 0.58, p.castle);
    if (p.windows) { const h = c.createRadialGradient(110, 222, 0, 110, 222, 120); h.addColorStop(0, 'rgba(255,196,110,0.32)'); h.addColorStop(1, 'rgba(255,196,110,0)'); c.fillStyle = h; c.fillRect(-20, 100, 260, 240);
      [[62, 230], [150, 196], [196, 226], [92, 244]].forEach(([x, y]) => { const g = c.createRadialGradient(x, y, 0, x, y, 16); g.addColorStop(0, 'rgba(255,220,140,0.9)'); g.addColorStop(1, 'rgba(255,190,100,0)'); c.fillStyle = g; c.fillRect(x - 16, y - 16, 32, 32); }); }
  }
};
/** the far slope with the zigzag path: screen points of the path, bottom right to top left (people go this way in shot 12) */
export const PATH_UV: [number, number][] = [[1530, 512], [1300, 486], [1430, 452], [1180, 420], [1300, 392], [1040, 360], [1130, 334], [900, 306]];
const SLOPE_D = 41;
const slope = (p: Pal) => (c: Ctx) => {
  const ridge = [[-320, 470], [120, 452], [420, 410], [700, 330], [880, 296], [1080, 270], [1320, 300], [1560, 352], [1920, 396]];
  P(c, [...ridge, [1920, 900], [-320, 900]], p.slope.mid);
  // (K6, 26/11/2026, Daniel: "phần đất ở dưới núi … vẫn nhiều màu dọc") sườn MỘT sắc nền; chỉ một dải sáng chạy ngang bám dưới đỉnh sườn, không chia mảng dọc
  const lech = 70; P(c, [...ridge, ...ridge.slice().reverse().map(([x, y]) => [x, y + lech + (x % 7) * 2])], p.slope.lit);
  const r = rnd(23);
  for (let i = 0; i < 18; i++) { const x = -200 + r() * 2000, y = 380 + r() * 160; c.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(40,46,70,0.16)'; c.lineWidth = 3 + r() * 4; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 120, y - 20 - r() * 20, x + 260 + r() * 120, y + 10); c.stroke(); }
  // rock bands: dark angular outcrops with snow on their tops
  [[260, 470, 70], [520, 420, 54], [640, 470, 90], [980, 330, 44], [1180, 380, 60], [1440, 410, 76], [1640, 440, 58], [80, 500, 66], [820, 400, 40]].forEach(([x, y, s]) => {
    P(c, [[x, y], [x + s, y - s * 0.3], [x + s * 1.3, y + s * 0.5], [x + s * 0.4, y + s * 0.8], [x - s * 0.2, y + s * 0.4]], p.slope.rock);
    P(c, [[x - 4, y + 2], [x + s, y - s * 0.32], [x + s * 1.1, y - s * 0.12], [x + s * 0.3, y + s * 0.14]], p.slope.cap);
  });
  // the zigzag path: a trodden groove with a light lip on its lower side
  const line = (w: number, col: string, dy: number) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); PATH_UV.forEach(([u, v], i) => (i ? c.lineTo(u, v + dy) : c.moveTo(u, v + dy))); c.stroke(); };
  line(10, p.slope.pathEdge, 3); line(7, p.slope.path, 0);
  // clumps of snow-laden pines
  [[-260, 60, 486, 4], [180, 120, 470, 5], [560, 80, 440, 3], [1500, 90, 420, 4], [1700, 140, 460, 6], [1220, 60, 430, 3]].forEach(([x0, w, y0, n]) => {
    for (let k = 0; k < n; k++) { const x = x0 + r() * w * 1.6, y = y0 + r() * 30, h = 26 + r() * 30; paintPine(c, x, y, h, h * 0.5, p.slope.pine, 3); c.fillStyle = p.slope.cap; c.globalAlpha = 0.8; for (let t = 0; t < 3; t++) { const ty = y - h * (0.85 - t * 0.27), tw = h * 0.12 * (t + 1); c.fillRect(x - tw, ty, tw * 1.3, 3); } c.globalAlpha = 1; }
  });
  const g = c.createLinearGradient(0, 470, 0, 560); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, p.mist); c.fillStyle = g; c.fillRect(-320, 470, 2240, 430);
};
/** a band of mist low on the far slope (dawn; slid with the frame) */
const mist = (p: Pal) => (c: Ctx) => { const r = rnd(3); for (let i = 0; i < 7; i++) { const x = -300 + r() * 2000, y = 440 + r() * 70, w = 380 + r() * 400, h = 26 + r() * 20, g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, p.mist); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fill(); } };
/** Tibet only: a middle ridge of dark rock and snow ribs between the far range and the monastery's shoulder, kept to the right so the monastery stands clear */
const midRidge = (p: Pal) => (c: Ctx) => {
  const r = rnd(61);
  [[820, 150, 300], [1090, 120, 330], [1380, 170, 300], [1700, 140, 340], [610, 230, 220]].forEach(([x, y, hw]) => paintPeak(c, x, y, hw, 520, {light: p.shoulder.shade, dark: p.shoulder.rock, snow: p.peak.snow, snowShade: p.peak.snowShade, motSac: true}));
  for (let i = 0; i < 46; i++) { const x = 560 + r() * 1300, y = 200 + r() * 220, h = 40 + r() * 90; c.fillStyle = r() < 0.5 ? p.shoulder.rock : p.peak.snowShade; c.globalAlpha = 0.55; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6 + r() * 14, y + h); c.lineTo(x - 7, y + h * 0.8); c.closePath(); c.fill(); c.globalAlpha = 1; }
  const g = c.createLinearGradient(0, 300, 0, 520); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, p.peakHaze); c.fillStyle = g; c.fillRect(-300, 300, 2200, 300);
};
/** Tibet only: banks of cloud clinging to the slopes, in front of the foot of the monastery and across the middle ridge */
const clingCloud = (p: Pal) => (c: Ctx) => {
  const r = rnd(73);
  for (let i = 0; i < 16; i++) { const x = -300 + r() * 2200, y = 345 + r() * 90, w = 220 + r() * 520, h = 12 + r() * 16; c.globalAlpha = 0.55; c.fillStyle = p.mist; c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fill(); c.globalAlpha = 0.4; c.beginPath(); c.roundRect(x + w * 0.1, y - h * 0.5, w * 0.6, h * 0.8, h / 2); c.fill(); c.globalAlpha = 1; }
};
/** the frame within the frame (standard view only): a dark drift along the lower edge, a black rock in the lower right */
const foreground = (p: Pal) => (c: Ctx) => {
  const r = rnd(8), pts: number[][] = [[-300, 940]]; for (let x = -300; x <= 1900; x += 60) { const e = Math.min(1, Math.abs(x - 760) / 900); pts.push([x, 905 - e * e * 70 - r() * 14]); } pts.push([1900, 940]);
  P(c, pts, p.fg.drift); c.strokeStyle = p.fg.top; c.lineWidth = 5; c.beginPath(); pts.slice(1, -1).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  P(c, [[1440, 940], [1470, 800], [1560, 742], [1700, 730], [1830, 790], [1880, 940]], p.fg.rock); P(c, [[1470, 800], [1560, 742], [1700, 730], [1640, 770], [1520, 800]], p.fg.rockLit);
  P(c, [[1530, 752], [1590, 728], [1700, 724], [1760, 742], [1660, 750], [1560, 762]], p.slope.cap);
  for (let x = -280; x < 300; x += 22 + r() * 30) { const h = 16 + r() * 30; c.strokeStyle = p.fg.rock; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 900); c.lineTo(x + (r() - 0.5) * 30, 900 - h); c.stroke(); }
};

// ---------------------------------------------------------------- the look of each state (light, haze, weather)
type Look = {grade: Grade; haze: string; fog: [number, number]; hemi: [string, string, number]; key: {dir: V3; color: string; k: number}; ground: [string, string];
  bounce: number; storm: boolean; glitter: boolean; grave: boolean; icicles: number; snowDepth: number; scudSpeed: number; mistSpeed: number; land: 'castle' | 'none' | 'monastery'; shelter?: boolean};
export const NUI_LOOK: Record<NuiState, Look> = {
  'dem-bao': {grade: 'nightExterior', haze: '#6c7698', fog: [14, 300], hemi: ['#aab6e0', '#6a7290', 1.3], key: {dir: [-7, 6, 6], color: '#d0dbf6', k: 0.6}, ground: ['#cad0e0', '#98a0bc'], bounce: 1.1,
    storm: true, glitter: false, grave: false, icicles: 1, snowDepth: 1, scudSpeed: 0.5, mistSpeed: 0, land: 'castle'},
  'binh-minh': {grade: 'snowExterior', haze: '#d8d2dc', fog: [20, 380], hemi: ['#b0bce4', '#8686a4', 1.1], key: {dir: [-9, 3.0, 10], color: '#ffc29a', k: 2.9}, ground: ['#f2ecec', '#d2d0e0'], bounce: 0,
    storm: false, glitter: true, grave: true, icicles: 0.8, snowDepth: 1, scudSpeed: 0, mistSpeed: 0.25, land: 'castle'},
  /** no shelter, broken pine, standing rock or footprints (chapter 4 things): open snow slope, the monastery on the left shoulder, a low overcast with a pale key from the left */
  'tay-tang': {grade: 'snowExterior', haze: '#cdcfe0', fog: [14, 300], hemi: ['#dadef0', '#9094ae', 1.5], key: {dir: [-8, 3.5, 8], color: '#f2e2d6', k: 0.9}, ground: ['#f0eef6', '#cfd2e6'], bounce: 0,
    storm: true, glitter: false, grave: false, icicles: 0, snowDepth: 1, scudSpeed: 0.9, mistSpeed: 0, land: 'monastery', shelter: false},
};
const TAN_KEY = {k: 2.5, color: '#ffd4a2', haze: '#e6d8d8'};
/** the scene's two lights (fill from the sky, ONE key with shadows), in the state's colours */
const NuiLight: React.FC<{look: Look; reach?: number; k?: number}> = ({look, reach = 16, k = 1}) => (
  <>
    <hemisphereLight args={look.hemi} />
    <directionalLight position={look.key.dir} intensity={look.key.k * k} color={look.key.color} castShadow shadow-mapSize={[4096, 4096]} shadow-radius={1.6} shadow-blurSamples={12} shadow-bias={-0.0005}
      shadow-camera-left={-reach} shadow-camera-right={reach} shadow-camera-top={reach} shadow-camera-bottom={-reach * 0.6} shadow-camera-near={1} shadow-camera-far={60} />
    {/* moonlight thrown back by the snow in front of the shelter: a cool light from low in front, no shadow, so the wall under the
        overhang and the faces in it stay readable (owner, 23/11/2026: scenes too dark; measured, skill 1) */}
    {look.bounce ? <><directionalLight position={[1, 0.6, 8]} intensity={look.bounce * k} color="#b4c2ea" />
      <pointLight position={[0.2, 1.3, -0.6]} intensity={look.bounce * 5 * k} distance={5.5} decay={1} color="#c0ccf0" /></> : null}
  </>
);

// ---------------------------------------------------------------- the solid pieces
const PINES: [number, number, number, number][] = [   // x, z, height, tiers (the right side kept low from x 4 to 10, so the far path shows in shot 12)
  [-7.6, -9.5, 5.4, 5], [-10.4, -13.5, 7.0, 5], [-5.6, -16.5, 5.6, 4], [-13.2, -19, 8.2, 5], [-8.8, -22, 6.2, 4], [-16, -12, 6.6, 5], [-5.2, -7.0, 2.4, 3],
  [11.5, -9.0, 6.5, 5], [13.5, -13.5, 7.6, 5], [12.2, -19.5, 6.4, 4], [15.6, -16, 8.0, 5], [14.2, -24, 7.0, 4], [17.4, -9.5, 6.4, 5],
  [4.6, -6.5, 2.0, 3], [-2.4, -19, 4.4, 4], [1.8, -22, 3.6, 4],
];
const ROCKS: [number, number, number, number, number][] = [   // x, z, width, height, seed
  [-3.7, -2.4, 1.3, 0.75, 2], [-6.1, -3.8, 1.9, 1.1, 3], [5.0, -8.4, 1.4, 0.8, 4], [-8.6, -6.2, 2.2, 1.3, 5], [8.2, -4.8, 1.6, 0.95, 6], [7.6, -11, 1.8, 0.9, 7], [9.4, -16, 2.2, 1.1, 17],
  [-2.6, -11.5, 1.6, 0.9, 8], [-11.5, -9, 2.4, 1.4, 9], [-0.6, -15, 1.9, 1.0, 11], [5.6, -2.0, 0.7, 0.4, 12], [-5.0, -0.6, 0.6, 0.35, 13], [1.6, 0.6, 0.4, 0.22, 14],
  [-2.2, 1.4, 0.36, 0.2, 15], [3.4, -0.8, 0.46, 0.26, 16], [-1.2, -7.6, 0.8, 0.5, 18], [3.0, -12.5, 1.2, 0.7, 19],
];
const MOUNDS: [number, number, number, number, number][] = [   // x, z, w, d, h
  [-4.6, -1.0, 2.6, 1.6, 0.36], [4.4, -0.2, 3.0, 1.6, 0.3], [-1.8, -6.5, 3.6, 1.8, 0.5], [2.2, -7.5, 3.0, 1.6, 0.42], [-6.5, -11, 4.5, 2.4, 0.7], [6.4, -12, 4.0, 2.2, 0.6],
  [0.6, -10.5, 3.4, 1.8, 0.4], [-9.5, -16, 5.0, 2.6, 0.8], [9.6, -19, 5.2, 2.6, 0.8], [-3.6, 3.0, 3.0, 1.4, 0.3], [3.8, 3.4, 2.6, 1.2, 0.26],
];
/** footprints: from the front right, across to the shelter (the father and son came in at night) */
const TRAIL: [number, number][] = [[4.6, 4.2], [3.6, 2.2], [2.4, 0.4], [1.3, -1.3], [0.5, -2.5]];
const TWIGS: [number, number, number][] = [[-1.9, -1.2, 0.5], [2.4, -0.5, 0.42], [-4.1, 0.6, 0.6], [3.9, -4.6, 0.55], [-2.9, -4.8, 0.45], [6.2, 0.8, 0.6]];

/** THE SET. state = 'dem-bao' | 'binh-minh'; f = frame (weather, clouds, mist); eye = the shot's camera (pass it when not the
 *  standard view, so the haze and the near weather follow it); gust 0..2 = how thick the blizzard is (1 normal, 2 a gust);
 *  climbers / torches = the two tiny climbers and the Baron's torches on the far path (shot 12): pass their progress in frames;
 *  grave / moTuyet (same thing): override the state's grave mound (shown at 'binh-minh'); moTuyet={false} for d1c4 shots 12, 13,
 *  which the director moved to a cold dawn BEFORE the father dies. soldiers = the Baron's men marching up the path by day (in place of
 *  the torches). light = the key light (moon or sun) times this, for a shot that
 *  dims or brightens over its frames (shot 17: 1 -> 0.7; shot 21: 0.6 -> 1). tf = the weather's clock in frames (default f): pass an
 *  integrated clock to slow the storm down without a jump (shot 17), with gust to thin it. */
export const NuiTuyet: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; state?: NuiState; gust?: number; climbers?: boolean; torches?: boolean; soldiers?: boolean; grave?: boolean; moTuyet?: boolean; weather?: boolean; light?: number; tf?: number; tan?: number; cuaSo?: number}> =
  ({children, f = 0, dx, dz, eye = EYE, state = 'dem-bao', gust = 1, climbers = false, torches = false, soldiers = false, grave, moTuyet, weather = true, light = 1, tf, tan = 0, cuaSo = 0}) => {
    // 'tay-tang' only: tan 0..1 = how far the storm has broken (three steps: palette, light and haze go from the storm's to the gold of the clearing); cuaSo = how many monastery windows are lit (0..7)
    const step = state === 'tay-tang' ? Math.round(clamp01(tan) * 2) : 0, tt = step / 2;
    const L0 = NUI_LOOK[state], L: Look = step ? {...L0, haze: lerpHex(L0.haze, TAN_KEY.haze, tt), key: {...L0.key, k: L0.key.k + (TAN_KEY.k - L0.key.k) * tt, color: lerpHex(L0.key.color, TAN_KEY.color, tt)}} : L0;
    const pal = step ? mixDeep(NUI_PAL[state], TAN_PAL, tt) as Pal : NUI_PAL[state], N = step ? `${state}-${step}` : state, crust = snowCrustTex(state === 'dem-bao' ? 1 : 2), showGrave = moTuyet ?? grave ?? L.grave, tv = pal.tuVien, lit = Math.max(0, Math.min(7, Math.round(cuaSo)));
    const path = PATH_UV.map(([u, v]) => onPlate(EYE, SLOPE_D, u, v, 0.8)), wf = tf ?? f;
    return (
      <GradeCtx.Provider value={L.grade}>
        <NuiLight look={L} k={light} />
        <StageCam eye={eye} haze={L.haze} fog={L.fog} dx={dx} dz={dz} />
        <Plate from={EYE} id={`nt-sky-${N}`} d={520} paint={sky(pal)} fog={false} />
        {L.scudSpeed ? <group position={[-f * L.scudSpeed, 0, 0]}><Plate from={EYE} id={`nt-scud-${N}`} d={300} paint={scud(pal)} fog={false} /></group> : null}
        <Plate from={EYE} id={`nt-far-${N}`} d={126} paint={farRange(pal)} />
        {state === 'tay-tang' ? <Plate from={EYE} id={`nt-mid-tt-${N}`} d={100} paint={midRidge(pal)} /> : null}
        <Plate from={EYE} id={`nt-shoulder-${N}-${L.land}`} d={66} paint={shoulder(pal, L.land)} />
        {L.land === 'monastery' && tv ? <TuVienPlate from={EYE} d={NUI_TUVIEN.d} region={NUI_TUVIEN.region} pal={tv} lit={lit} /> : null}
        {state === 'tay-tang' ? <group position={[-f * 0.012, 0, 0]}><Plate from={EYE} id={`nt-cling-tt-${N}`} d={58} paint={clingCloud(pal)} /></group> : null}
        <Plate from={EYE} id={`nt-slope-${N}`} d={SLOPE_D} paint={slope(pal)} />
        {L.mistSpeed ? <group position={[f * L.mistSpeed * 0.05, 0, 0]}><Plate from={EYE} id={`nt-mist-${N}`} d={SLOPE_D - 2} paint={mist(pal)} /></group> : null}
        <TheoTam from={EYE}>{/* đi trên tấm dốc: quay cùng tấm khi máy đi vòng */}
        {climbers ? <PathPair f={f} path={path} start={21} speed={0.03} h={1.7} tint={state === 'dem-bao' ? '#b8c0dc' : '#ffffff'} /> : null}
        {soldiers ? <PathSoldiers f={f} path={path} n={6} gap={1.3} speed={0.05} start={11} /> : null}
        {torches ? <FarLights f={f} path={path} n={7} gap={1.4} speed={0.05} start={11} torch size={0.17} /> : null}
        </TheoTam>
        <Ground near={L.ground[0]} far={L.ground[1]} size={[110, 80]} pos={[0, 0, -28]} swell={0.12} patch={0.07} farAt={0.5} map={crust} tile={3} />
        {(state === 'tay-tang' ? PINES.filter(([x, , h]) => !(x < -5 && h > 4.5)) : PINES).map(([x, z, h, t], i) => <SnowPine key={i} pos={[x, 0, z]} h={h} tiers={t} dark={state === 'dem-bao' ? '#24303c' : '#33444b'} snow={state === 'dem-bao' ? '#bcc6dc' : '#f4eeee'} />)}
        {ROCKS.map(([x, z, w, h, sd], i) => <SnowRock key={i} pos={[x, 0, z]} w={w} h={h} seed={sd} rotY={sd * 0.7} color={i % 3 === 0 ? '#3e4456' : i % 3 === 1 ? '#4a5062' : '#545a6a'} snow={state === 'dem-bao' ? '#d4dae8' : '#f6f0f0'} />)}
        {MOUNDS.map(([x, z, w, d, h], i) => <SnowDrift key={i} pos={[x, 0, z]} w={w} d={d} h={h} seed={30 + i} />)}
        {TWIGS.map(([x, z, w], i) => <Sprite key={i} name={`nt-twigs-${i % 3}`} art={paintTwigs(i % 3 + 1)} px={[200, 200]} w={w} pos={[x, 0, z]} flip={i % 2 === 1} shade={0} />)}
        {[[-2.8, -0.2], [1.9, 1.2], [-3.4, -5.4], [3.6, -5.8], [-1.2, 2.6], [5.0, -3.4]].map(([x, z], i) => <Tuft key={i} pos={[x, 0, z]} s={0.28} seed={i + 3} color={state === 'dem-bao' ? '#5a5448' : '#8a7a5a'} />)}
        {L.shelter !== false ? <Footprints points={TRAIL} soft={state === 'dem-bao' ? 0.35 : 0.8} /> : null}
        {L.shelter !== false ? <RockShelter icicles={L.icicles} snow={L.snowDepth} /> : null}
        {L.shelter !== false ? <BrokenPine pos={[3.45, 0, -3.0]} h={1.45} seed={4} /> : null}
        {L.shelter !== false ? <StandRock pos={[NUI_MARKS.daDung[0], 0, NUI_MARKS.daDung[2]]} top={NUI_MARKS.daDung[1]} /> : null}
        {showGrave ? <SnowGrave pos={NUI_MARKS.moTuyet} len={1.6} /> : null}
        {weather && L.storm ? <>
          <Blizzard f={f} tf={wf} eye={eye} amount={gust} n={state === 'tay-tang' ? 300 : 170} wind={2.8} fall={1.3} reach={[3.0, 18]} seed={7} size={state === 'tay-tang' ? 0.024 : undefined} />
          <Blizzard f={f} tf={wf} eye={eye} amount={gust} n={state === 'tay-tang' ? 260 : 140} wind={2.2} fall={1.0} reach={[8, 40]} size={0.03} height={10} seed={11} />
          <SnowVeils f={wf} box={[-7, 7, -2, 2.5]} opacity={(state === 'tay-tang' ? 0.34 : 0.22) * gust} />
          <DriftSpecks f={wf} box={[-6, 6, 0.02, 0.5, -3.4, 2]} n={40} color="#eef2fb" size={0.012} wind={[-1.4, 0.02]} glow={0} seed={9} />
        </> : null}
        {weather && L.glitter ? <Blizzard f={f} tf={wf} eye={eye} n={70} wind={0.35} fall={0.35} streak={0.01} size={0.012} glint={1} reach={[1.5, 16]} seed={5} color="#fff6ec" /> : null}
        {state === 'tay-tang' ? <>
          <CoPhuon a={[-1.4, 3.2, -6.5]} b={[3.6, 3.6, -9.2]} f={wf} wind={Math.min(1.4, gust * 0.8)} sag={0.4} tone={0.86 + 0.14 * tt} />
          <CoPhuon a={[5.2, 3.0, -12]} b={[11.0, 3.9, -9.6]} f={wf + 7} wind={Math.min(1.4, gust * 0.8)} sag={0.5} tone={0.86 + 0.14 * tt} />
        </> : null}
        {state === 'tay-tang' ? <>
          <DongDaKhac pos={[-4.4, 0, -3.6]} w={1.8} seed={1} rotY={0.2} /><DongDaKhac pos={[5.2, 0, -4.2]} w={1.5} seed={2} rotY={-0.3} /><DongDaKhac pos={[-7.4, 0, -6.5]} w={2.2} seed={3} rotY={0.5} />
          <SnowPine pos={[-3.3, 0, -4.6]} h={1.5} tiers={3} dark="#33444b" snow="#f4eeee" /><SnowPine pos={[3.8, 0, -3.5]} h={1.2} tiers={3} dark="#33444b" snow="#f4eeee" />
        </> : null}
        {children}
        <Plate from={EYE} id={`nt-fg-${N}`} d={2.8} paint={foreground(pal)} fog={false} order={900} />
      </GradeCtx.Provider>
    );
  };


export const Still: React.FC<{state: NuiState; children: React.ReactNode; eye?: V3; climbers?: boolean; torches?: boolean; soldiers?: boolean; grave?: boolean; f?: number; gust?: number; tan?: number; cuaSo?: number}> = ({state, children, eye, climbers, torches, soldiers, grave, f = 0, gust, tan, cuaSo}) => {
  const {width, height} = useVideoConfig();
  if (eye) return <Shot grade={NUI_LOOK[state].grade} eye={eye} finish={{warm: ''}} set={(inside, cam) => <NuiTuyet f={f} eye={eye} state={state} climbers={climbers} torches={torches} soldiers={soldiers} grave={grave} gust={gust} tan={tan} cuaSo={cuaSo} dx={cam.dx} dz={cam.dz}>{inside}</NuiTuyet>} figures={children} />;
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv /><NuiTuyet f={f} state={state} gust={gust} tan={tan} cuaSo={cuaSo}>{children}</NuiTuyet></ThreeCanvas></Finish></AbsoluteFill>;
};
const NuiS12: React.FC = () => <Still state="dem-bao" eye={NUI_VIEWS.s12} climbers torches f={20}>{null}</Still>;
const NuiS12Sang: React.FC = () => <Still state="binh-minh" eye={NUI_VIEWS.s12} climbers soldiers grave={false} f={20}>{null}</Still>;
/** the mountainside alone in each state, the standard view, no people (kho chung, 23/11/2026) */
const NuiDemBaoTrong: React.FC = () => <Still state="dem-bao">{null}</Still>;
const NuiBinhMinhTrong: React.FC = () => <Still state="binh-minh">{null}</Still>;
/** Tibet ('tay-tang', d1c9 scenes 1-3), no people. Still frames of the set at the three standard views, in the storm, in the gust, and as it breaks. */
const NuiTTDi: React.FC = () => <Still state="tay-tang" eye={NUI_VIEWS.tt1} gust={1.6} f={30}>{null}</Still>;
const NuiTTGuc: React.FC = () => <Still state="tay-tang" eye={NUI_VIEWS.tt2} gust={2} f={12}>{null}</Still>;
const NuiTTTan: React.FC = () => <Still state="tay-tang" eye={NUI_VIEWS.tt3} gust={0.7} tan={0.5} cuaSo={3} f={40}>{null}</Still>;
const NuiTTTuVien: React.FC = () => <Still state="tay-tang" eye={NUI_VIEWS.tt3} gust={0.3} tan={1} cuaSo={7} f={60}>{null}</Still>;
const NuiTTBayVao: React.FC = () => <Still state="tay-tang" eye={NUI_VIEWS.ttCua} gust={0.3} tan={1} cuaSo={7} f={60}>{null}</Still>;
const NuiTTChuan: React.FC = () => <Still state="tay-tang" gust={1} f={20}>{null}</Still>;
const NuiTTDenLong: React.FC = () => <Still state="tay-tang" eye={NUI_VIEWS.tt3} gust={1.0} tan={0} f={10}><DenLongCam pos={[-1.0, 1.75, -1.2]} f={10} /></Still>;
export const NuiTuyetComps: React.FC = () => (
  <>
    <Composition id="nui-tuyet-s12" component={NuiS12} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="nui-tuyet-s12-sang" component={NuiS12Sang} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="nui-tuyet-dem-bao-trong" component={NuiDemBaoTrong} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="nui-tuyet-binh-minh-trong" component={NuiBinhMinhTrong} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="nui-tay-tang-di" component={NuiTTDi} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="nui-tay-tang-guc" component={NuiTTGuc} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="nui-tay-tang-tan" component={NuiTTTan} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="nui-tay-tang-tu-vien" component={NuiTTTuVien} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="nui-tay-tang-bay-vao" component={NuiTTBayVao} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="nui-tay-tang-chuan" component={NuiTTChuan} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="nui-tay-tang-den-long" component={NuiTTDenLong} width={1280} height={720} fps={24} durationInFrames={1} />
  </>
);
