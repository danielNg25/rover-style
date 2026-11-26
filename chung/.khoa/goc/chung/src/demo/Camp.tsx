import React, {useMemo} from 'react';
import {datNoiBui} from '../lib3/mauBui';
import {AbsoluteFill, Composition, useVideoConfig, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Scene3, Finish, Ground, FacetLathe, Halo} from '../lib3/look';
import {Bunting} from '../lib3/town';
import {Plate, TheoTam, Sprite, VIEW, rnd, P, Ctx, paintPeak, paintHills, paintPine, paintCastle, paintCloud, paintBush, paintTuft, paintRock} from '../lib3/depth';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import {POSES, withPose, perform, Beat} from '../mould/gestures';
import {act, blink} from '../mould/act';
import type {Spec} from '../mould/draw';
import {B, StageCam, Sack, LogSeat, Lantern, Fire, Fireflies} from '../lib3/kit';
import {NomadTent, PlankCrate, Cask, Bucket, ClayPot, Basket, Stool, LogPile, StickBundle, ChopBlock, ClothesLine, GroundRug, SaddleRack, HandCart, DoorPole, CookHearth, LoadedWagon, NomadWagon, DousedFire, RitualSite, RottenLog, KnockFire, CampAir, PostLantern, FarLights, HillWalkers, onPlate} from '../lib3/kitCamp';
import {Shot, frameOn} from '../lib3/shot';

/** The travellers' camp at dusk, rebuilt in layers (the first version was one row of cones on a black field).
 *  What the reference does in this kind of place: the far layers are cool, greyed and of middle brightness (dusk, not black
 *  night); everything warm (canvas, fire, lamps, lit doorways, flags) sits in the middle distance and carries the picture. */
export type V3 = [number, number, number];
const HAZE = '#7d839c', EYE: V3 = [0, 1.5, 7];   // a closer, lower camera than the valley's: the figures stand about half the frame high
/** tent A, Victor's family's (the lit one left of centre at the end of d1mo shot 7 and in d1c2) */
export const TENT_A: V3 = [-6.8, 0, -7.8];
const PINE = [{light: '#35444f', dark: '#2a3742', trunk: '#231f1d'}, {light: '#303f4b', dark: '#26333e', trunk: '#231f1d'}, {light: '#3a4951', dark: '#2e3b45', trunk: '#231f1d'}];

// ---------------------------------------------------------------- painted layers, back to front (screen units 1600 x 900)
const sky = (c: Ctx) => {
  const g = c.createLinearGradient(0, -140, 0, 540); g.addColorStop(0, '#545b78'); g.addColorStop(1, '#8e91a9'); c.fillStyle = g; c.fillRect(-300, -200, 2200, 1300);
  const r = rnd(21); for (let i = 0; i < 46; i++) { c.beginPath(); c.arc(-240 + r() * 2080, -120 + r() * 400, 1.4 + r() * 1.8, 0, 7); c.fillStyle = `rgba(232,236,248,${0.5 + r() * 0.45})`; c.fill(); }
  c.beginPath(); c.arc(1150, 292, 74, 0, 7); c.fillStyle = '#dca596'; c.fill(); c.beginPath(); c.arc(1138, 280, 54, 0, 7); c.fillStyle = '#e4b4a4'; c.fill();   // the low moon, half behind the nearer range
  paintCloud(c, 120, 96, 0.9, {light: '#7b819c', dark: '#6a708d'}); paintCloud(c, 880, 52, 0.8, {light: '#757b97', dark: '#666c89'}); paintCloud(c, 1010, 250, 0.5, {light: '#b79aa0', dark: '#9c8893'});
};
const farRange = (c: Ctx) => {
  const t = {light: '#8e95af', dark: '#7b829d', snow: '#e6e9f1', snowShade: '#b7bdd0'};
  paintPeak(c, 800, -60, 560, 640, t); paintPeak(c, 170, 110, 430, 640, t); paintPeak(c, 1420, 40, 480, 640, t); paintPeak(c, 1840, 150, 300, 640, t); paintPeak(c, -240, 170, 300, 640, t);
  // a castle far off on the shoulder of the range, a silhouette with lit windows
  P(c, [[60, 300], [110, 238], [330, 238], [390, 300]], '#6a718d');
  paintCastle(c, 132, 240, 0.72, {stone: '#687090', shade: '#5e6684', roof: '#566080', roofShade: '#4e5776', mark: '#f0cf78', flag: '#687090'});
};
const midRange = (c: Ctx) => {
  const t = {light: '#626a86', dark: '#545c77'};
  paintPeak(c, 1010, 236, 430, 660, t); paintPeak(c, 70, 300, 390, 660, t); paintPeak(c, 540, 330, 330, 660, t); paintPeak(c, 1530, 276, 410, 660, t);
};
const ridge = (pts: number[][]) => (x: number) => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const k = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k; } return pts[pts.length - 1][1]; };
const farHills = (c: Ctx) => {
  const pts = [[-260, 452], [140, 408], [400, 446], [660, 420], [920, 458], [1210, 432], [1500, 400], [1860, 448]], yAt = ridge(pts), r = rnd(13), t = {light: '#39475a', dark: '#2f3c4e', trunk: '#262a33'};
  paintHills(c, pts, 680, {light: '#4d556d', dark: '#434b62'});
  [[-220, 90], [200, 520], [700, 860], [1000, 1300], [1420, 1860]].forEach(([a, b]) => { for (let x = a; x < b; x += 14 + r() * 12) { const h = 36 + r() * 30; paintPine(c, x, yAt(x) + 5, h, h * 0.44, t, 3); } });
  // two far tents with a lit doorway, small enough to read as distance
  [[610, 470, 30], [1130, 478, 26]].forEach(([x, y, s]) => { P(c, [[x - s, y], [x, y - s * 1.25], [x + s, y]], '#8d7a5c'); P(c, [[x, y - s * 1.25], [x + s, y], [x + s * 0.25, y]], '#766650'); P(c, [[x - s * 0.22, y], [x, y - s * 0.6], [x + s * 0.22, y]], '#f4cf7c'); });
};
const nearHills = (c: Ctx) => {
  const pts = [[-260, 508], [80, 474], [320, 502], [560, 488], [800, 512], [1040, 494], [1320, 480], [1580, 462], [1860, 494]], yAt = ridge(pts), r = rnd(6);
  paintHills(c, pts, 700, {light: '#454e5e', dark: '#3b4453'});
  [[-240, 400], [560, 760], [900, 1100], [1300, 1860]].forEach(([a, b]) => { for (let x = a; x < b; x += 24 + r() * 22) { const h = 64 + r() * 52; paintPine(c, x, yAt(x) + 8, h, h * 0.44, PINE[Math.floor(r() * 3)], 4); } });
};
// ---------------------------------------------------------------- the same layers in the early morning (state 'sang', d1c2 shot 14)
const HAZE_SANG = '#c6ccd6';
const PINE_S = [{light: '#4a6560', dark: '#3c5550', trunk: '#3a3430'}, {light: '#46605a', dark: '#39504b', trunk: '#3a3430'}, {light: '#516b63', dark: '#425a54', trunk: '#3a3430'}];
const skySang = (c: Ctx) => {
  const g = c.createLinearGradient(0, -140, 0, 540); g.addColorStop(0, '#8ea8cc'); g.addColorStop(0.62, '#cbd3dc'); g.addColorStop(1, '#f2dcb2'); c.fillStyle = g; c.fillRect(-300, -200, 2200, 1300);
  const s = c.createRadialGradient(240, 420, 10, 240, 420, 420); s.addColorStop(0, 'rgba(255,244,210,0.9)'); s.addColorStop(0.25, 'rgba(255,232,180,0.45)'); s.addColorStop(1, 'rgba(255,232,180,0)'); c.fillStyle = s; c.fillRect(-300, 0, 1100, 900);
  paintCloud(c, 120, 96, 0.9, {light: '#f3e9e2', dark: '#d9ccd0'}); paintCloud(c, 880, 52, 0.8, {light: '#eee6e4', dark: '#d2c8cf'}); paintCloud(c, 1010, 250, 0.5, {light: '#f6e2cc', dark: '#e2c8b8'});
};
const farRangeSang = (c: Ctx) => {
  const t = {light: '#b8c3d8', dark: '#97a3bf', snow: '#ffffff', snowShade: '#d6dcea'};
  paintPeak(c, 800, -60, 560, 640, t); paintPeak(c, 170, 110, 430, 640, t); paintPeak(c, 1420, 40, 480, 640, t); paintPeak(c, 1840, 150, 300, 640, t); paintPeak(c, -240, 170, 300, 640, t);
  P(c, [[60, 300], [110, 238], [330, 238], [390, 300]], '#a1abc3');
  paintCastle(c, 132, 240, 0.72, {stone: '#8f98b2', shade: '#818aa6', roof: '#7a84a0', roofShade: '#6f7894', mark: '#6a7290', flag: '#8f98b2'});
  const g = c.createLinearGradient(0, 300, 0, 470); g.addColorStop(0, 'rgba(240,238,236,0)'); g.addColorStop(1, 'rgba(240,238,236,0.55)'); c.fillStyle = g; c.fillRect(-300, 300, 2200, 400);
};
const midRangeSang = (c: Ctx) => {
  const t = {light: '#8c9bb3', dark: '#7a88a2'};
  paintPeak(c, 1010, 236, 430, 660, t); paintPeak(c, 70, 300, 390, 660, t); paintPeak(c, 540, 330, 330, 660, t); paintPeak(c, 1530, 276, 410, 660, t);
  const g = c.createLinearGradient(0, 360, 0, 470); g.addColorStop(0, 'rgba(236,236,240,0)'); g.addColorStop(1, 'rgba(236,236,240,0.6)'); c.fillStyle = g; c.fillRect(-300, 360, 2200, 400);
};
/** the path over the far hill on the right that the sick walk in on (d1c2 shot 14), screen units of the far-hills plate */
const WALK_UV: [number, number][] = [[1440, 409], [1340, 430], [1240, 445], [1130, 459], [1020, 477]];
const farHillsSang = (c: Ctx) => {
  const pts = [[-260, 452], [140, 408], [400, 446], [660, 420], [920, 458], [1210, 432], [1500, 400], [1860, 448]], yAt = ridge(pts), r = rnd(13), t = {light: '#4f685f', dark: '#445b53', trunk: '#3c3530'};
  paintHills(c, pts, 680, {light: '#6e8577', dark: '#62796c'});
  [[-220, 90], [200, 520], [700, 860], [1000, 1300], [1420, 1860]].forEach(([a, b]) => { for (let x = a; x < b; x += 14 + r() * 12) { const h = 36 + r() * 30; paintPine(c, x, yAt(x) + 5, h, h * 0.44, t, 3); } });
  [[610, 470, 30], [1130, 478, 26]].forEach(([x, y, s]) => { P(c, [[x - s, y], [x, y - s * 1.25], [x + s, y]], '#b29c78'); P(c, [[x, y - s * 1.25], [x + s, y], [x + s * 0.25, y]], '#9a8666'); P(c, [[x - s * 0.22, y], [x, y - s * 0.6], [x + s * 0.22, y]], '#4a3e34'); });
  // the path: a pale trodden band with darker edges, winding down the slope towards the camp
  const line = (w: number, col: string) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); WALK_UV.forEach(([u, v], i) => (i ? c.lineTo(u, v) : c.moveTo(u, v))); c.stroke(); };
  line(11, '#8a7c62'); line(7, '#c8b894');
  const g = c.createLinearGradient(0, 440, 0, 520); g.addColorStop(0, 'rgba(236,236,240,0)'); g.addColorStop(1, 'rgba(236,236,240,0.4)'); c.fillStyle = g; c.fillRect(-300, 440, 2200, 300);
};
const nearHillsSang = (c: Ctx) => {
  const pts = [[-260, 508], [80, 474], [320, 502], [560, 488], [800, 512], [1040, 494], [1320, 480], [1580, 462], [1860, 494]], yAt = ridge(pts), r = rnd(6);
  paintHills(c, pts, 700, {light: '#5d7363', dark: '#526858'});
  // a gap in the pines (x 960-1340) so the path over the far hill shows
  [[-240, 400], [560, 760], [900, 960], [1340, 1860]].forEach(([a, b]) => { for (let x = a; x < b; x += 24 + r() * 22) { const h = 64 + r() * 52; paintPine(c, x, yAt(x) + 8, h, h * 0.44, PINE_S[Math.floor(r() * 3)], 4); } });
};
const pineSang = (k: number) => (c: Ctx, W: number, H: number) => paintPine(c, W / 2, H, H, W, PINE_S[k], 4 + (k % 2));
/** the walkers' path, the Baron's torches (shot 9) and the lanterns of the people leaving (shot 11), in world points */
const WALK_PATH: V3[] = WALK_UV.map(([u, v]) => onPlate(EYE, 70, u, v, 1.0));
// high up behind the camp's right side (seen from d1c2 shot 9 above the caravan's roof, among the dark pines of the slope)
// ---------------------------------------------------------------- the same layers at a still-bright dusk (state 'chang-vang', d1c3 shots 6-9)
const HAZE_DUSK = '#b48c9c';
const skyDusk = (c: Ctx) => {
  const g = c.createLinearGradient(0, -140, 0, 540); g.addColorStop(0, '#5e5288'); g.addColorStop(0.45, '#b2729a'); g.addColorStop(0.8, '#ee9a72'); g.addColorStop(1, '#f8c27a'); c.fillStyle = g; c.fillRect(-300, -200, 2200, 1300);
  const s = c.createRadialGradient(300, 470, 10, 300, 470, 520); s.addColorStop(0, 'rgba(255,220,150,0.9)'); s.addColorStop(0.3, 'rgba(255,170,110,0.45)'); s.addColorStop(1, 'rgba(255,170,110,0)'); c.fillStyle = s; c.fillRect(-300, 0, 1300, 900);
  const r = rnd(21); for (let i = 0; i < 18; i++) { c.beginPath(); c.arc(-240 + r() * 2080, -120 + r() * 220, 1.2 + r() * 1.4, 0, 7); c.fillStyle = `rgba(250,236,240,${0.35 + r() * 0.4})`; c.fill(); }
  paintCloud(c, 120, 96, 0.9, {light: '#d690a4', dark: '#b07890'}); paintCloud(c, 880, 52, 0.8, {light: '#c886a2', dark: '#a87090'}); paintCloud(c, 1010, 250, 0.5, {light: '#f6b08a', dark: '#de9078'});
};
const farRangeDusk = (c: Ctx) => {
  const t = {light: '#b08aa6', dark: '#866e98', snow: '#fad6c4', snowShade: '#c4a0b6'};
  paintPeak(c, 800, -60, 560, 640, t); paintPeak(c, 170, 110, 430, 640, t); paintPeak(c, 1420, 40, 480, 640, t); paintPeak(c, 1840, 150, 300, 640, t); paintPeak(c, -240, 170, 300, 640, t);
  P(c, [[60, 300], [110, 238], [330, 238], [390, 300]], '#8a7096');
  paintCastle(c, 132, 240, 0.72, {stone: '#806a92', shade: '#74608a', roof: '#6c5a84', roofShade: '#62527a', mark: '#f6d07a', flag: '#806a92'});
};
const midRangeDusk = (c: Ctx) => { const t = {light: '#7e6a90', dark: '#6c5c82'}; paintPeak(c, 1010, 236, 430, 660, t); paintPeak(c, 70, 300, 390, 660, t); paintPeak(c, 540, 330, 330, 660, t); paintPeak(c, 1530, 276, 410, 660, t); };
const farHillsDusk = (c: Ctx) => {
  const pts = [[-260, 452], [140, 408], [400, 446], [660, 420], [920, 458], [1210, 432], [1500, 400], [1860, 448]], yAt = ridge(pts), r = rnd(13), t = {light: '#4e4a66', dark: '#433f5a', trunk: '#2e2a33'};
  paintHills(c, pts, 680, {light: '#5e5672', dark: '#544c68'});
  [[-220, 90], [200, 520], [700, 860], [1000, 1300], [1420, 1860]].forEach(([a, b]) => { for (let x = a; x < b; x += 14 + r() * 12) { const h = 36 + r() * 30; paintPine(c, x, yAt(x) + 5, h, h * 0.44, t, 3); } });
  [[610, 470, 30], [1130, 478, 26]].forEach(([x, y, s]) => { P(c, [[x - s, y], [x, y - s * 1.25], [x + s, y]], '#9a7e66'); P(c, [[x, y - s * 1.25], [x + s, y], [x + s * 0.25, y]], '#826a58'); P(c, [[x - s * 0.22, y], [x, y - s * 0.6], [x + s * 0.22, y]], '#f4cf7c'); });
};
const nearHillsDusk = (c: Ctx) => {
  const pts = [[-260, 508], [80, 474], [320, 502], [560, 488], [800, 512], [1040, 494], [1320, 480], [1580, 462], [1860, 494]], yAt = ridge(pts), r = rnd(6);
  paintHills(c, pts, 700, {light: '#4e4c62', dark: '#444258'});
  [[-240, 400], [560, 760], [900, 1100], [1300, 1860]].forEach(([a, b]) => { for (let x = a; x < b; x += 24 + r() * 22) { const h = 64 + r() * 52; paintPine(c, x, yAt(x) + 8, h, h * 0.44, PINE[Math.floor(r() * 3)], 4); } });
};
/** the pines behind the ritual place, lighter than the camp's (moonlit at night, misty green in the morning) */
const ritualPine = (k: number, sang: boolean) => (c: Ctx, W: number, H: number) => paintPine(c, W / 2, H, H, W, (sang ? [{light: '#7c9a8c', dark: '#6a887c', trunk: '#4a4038'}, {light: '#749286', dark: '#628074', trunk: '#4a4038'}, {light: '#82a092', dark: '#6e8c80', trunk: '#4a4038'}] : [{light: '#5a6c80', dark: '#4a5b6e', trunk: '#302c2e'}, {light: '#54667a', dark: '#455668', trunk: '#302c2e'}, {light: '#607286', dark: '#4e6074', trunk: '#302c2e'}])[k], 4 + (k % 2));
/** a soft band of mist: clear at the top, thicker towards the ground, fading at both ends */
const mistTex = () => { const key = 'camp-mist'; return mistCache.t ?? (mistCache.t = (() => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const c = cv.getContext('2d')!; const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.6, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0.9)'); c.fillStyle = g; c.fillRect(0, 0, 512, 256); c.globalCompositeOperation = 'destination-in'; const h = c.createLinearGradient(0, 0, 512, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.2, 'rgba(0,0,0,1)'); h.addColorStop(0.8, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = h; c.fillRect(0, 0, 512, 256); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; void key; return t; })()); };
const mistCache: {t?: THREE.CanvasTexture} = {};
/** dark pines behind the ritual place (z -7 to -14), clear of tent C at (-11, -12) */
const RITUAL_TREES: [number, number, number, number][] = [[-16.8, -8.6, 8.2, 0], [-13.8, -10.2, 7.6, 2], [-18.8, -11.6, 9, 1], [-15.8, -13.4, 8.4, 0], [-20.2, -8.4, 7.8, 2], [-12.4, -15.2, 8, 1]];
const TORCH_PATH: V3[] = [[21, 8.2, -34], [18.5, 7.4, -34.5], [16, 6.6, -34], [13.5, 5.9, -33.5], [11, 5.3, -33]];
const LEAVING_PATH: V3[] = [[15, 1.2, -23], [9, 1.1, -23.5], [3, 1.0, -23], [-6, 1.1, -22.5]];
const foreground = (c: Ctx) => {
  // the frame within the frame: the dark corner of a crate and a pole at the left, tufts along the lower edge at the corners
  P(c, [[-260, 930], [-260, 640], [40, 628], [86, 650], [86, 930]], '#2a2622'); P(c, [[-260, 640], [40, 628], [86, 650], [-230, 664]], '#3a342c'); c.strokeStyle = '#1f1c19'; c.lineWidth = 7; c.beginPath(); c.moveTo(-230, 676); c.lineTo(70, 914); c.stroke(); c.lineWidth = 4; [700, 760, 820, 880].forEach((y) => { c.beginPath(); c.moveTo(-260, y); c.lineTo(86, y + 8); c.stroke(); }); c.strokeStyle = '#3a342c'; c.lineWidth = 12; c.strokeRect(-262, 660, 340, 280);
  const r = rnd(4), g = ['#232b27', '#2c3630'];
  for (let x = -260; x < 1860; x += 12 + r() * 16) { const edge = Math.min(1, Math.abs(x - 800) / 800); if (edge < 0.45 && r() < 0.75) continue; const h = 10 + r() * 20 + edge * edge * 46, w = 6 + r() * 5, lean = (r() - 0.5) * 20; P(c, [[x - w, 912], [x + lean, 900 - h], [x + w, 912]], g[r() < 0.5 ? 0 : 1]); }
};

// ---------------------------------------------------------------- built pieces
/** The flame as the reference draws it: flat tongues in four tones, the outer ones tall and pointed. */
const paintFlame = (c: Ctx, W: number, H: number) => {
  const u = W / 400, Q = (pts: number[][], f: string) => P(c, pts.map(([x, y]) => [x * u, H - (460 - y) * u]), f);
  Q([[40, 460], [20, 330], [70, 250], [60, 170], [120, 230], [150, 90], [200, 190], [235, 20], [280, 170], [320, 110], [330, 240], [375, 200], [380, 340], [360, 460]], '#ee6a22');
  Q([[90, 460], [80, 350], [120, 290], [140, 200], [185, 270], [230, 120], [265, 250], [300, 210], [310, 330], [320, 460]], '#f79a36');
  Q([[140, 460], [135, 380], [170, 320], [200, 250], [232, 330], [255, 300], [270, 380], [268, 460]], '#fcd462'); Q([[180, 460], [182, 410], [205, 360], [228, 410], [232, 460]], '#fff3c4');
};

const pine = (k: number) => (c: Ctx, W: number, H: number) => paintPine(c, W / 2, H, H, W, PINE[k], 4 + (k % 2));
const TREES: [number, number, number, number][] = [[-9.6, -14, 8.6, 0], [-12.5, -18, 9.6, 1], [-6.2, -19, 7, 2], [-15, -24, 9, 0], [-3.4, -24, 7.6, 1], [0.8, -21, 8.4, 0], [3.6, -26, 7, 2], [7.4, -17, 9.4, 1], [10.6, -21, 8, 0], [13.5, -16, 9.2, 2], [15.5, -26, 8.4, 1], [-8.5, -28, 7.4, 2], [6, -30, 7, 0], [-18, -30, 8, 1]];
const FATHER: Spec = withPose({outfit: 'vest', hair: 'bald', beard: '#b9b4ac', build: 'adult', longLegs: true, expr: {...EXPR.smile, gaze: [18, 6]},
  palette: {skinA: '#d9a37c', skinB: '#c99573', skinC: '#b7866a', skin: '#c99573', brow: '#8a857d', vest: '#5a7a4a', shirt: '#e6dcc2', shirtEdge: '#cbbf9f', shirtRim: '#f2ead6', shorts: '#4f4034', shoe: '#2c221c'}}, 'present');
const BOY: Spec = withPose({outfit: 'vest', hair: 'sweep', build: 'child', expr: {...EXPR.happy, gaze: [18, -14]}, palette: {}}, 'akimbo');
/** The states of the camp (d1c2): 'dem' = dusk as it always was (d1mo shot 7, d1c2 shots 1, 4, 6, 9, 15); 'do-leu' = the night
 *  the camp is struck (shot 11: fire put out, tents B and D coming down from f 0 and f 20, tent C down, the loaded caravan
 *  rolling left from f 36, lanterns of people leaving on the hill); 'sang' = early morning (shot 14: pale sky, mist, low sun
 *  from the left, no lamps, thin kitchen smoke, the people walking in on the path over the far hill on the right).
 *  torches = the Baron's torches coming down the hill on the right (d1c2 shot 9), only at 'dem'. */
export type CampState = 'dem' | 'do-leu' | 'sang' | 'chang-vang';
/** the grade a Shot over the camp should use for its people (d1c3: 'chang-vang' = the still-bright dusk of the ritual) */
export const campGrade = (state: CampState) => (state === 'sang' || state === 'chang-vang' ? 'lateDay' : 'nightExterior') as 'lateDay' | 'nightExterior';
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** what the struck camp does at frame f of d1c2 shot 11 (66 frames) */
export const doLeuPlan = (f: number) => ({tentB: clamp01(f / 30), tentD: clamp01((f - 20) / 30), wagonRoll: 0.8 * clamp01((f - 36) / 30)});
/** d1c3, d1c4 (all optional; leaving them out gives the approved pictures unchanged):
 *  ritual = the ritual place / Cynthia's grave at RITUAL_AT on the camp's left edge, in state 'phep', 'phep-chay' or 'mo'
 *  (with more pines behind it and a rotten log in front); ritualGlow 0-1 = cracks and signs glowing (phep); candleBoost =
 *  candles flaring; scarfFaded 0-1 and graveSnow 0-1 (mo); knock = frames since the soldier's blow to the camp fire's
 *  tripod (d1c3 shot 3); donTruoc = the cask, bucket and stool before tent A moved left of x -9 (as at 'sang'); leuAToi =
 *  tent A empty (dark, no smoke, door flaps let down, lamp out, herbs dried black, dustier); walkers = the people on the
 *  path at 'sang' (default true). */
/** more (d1c4, 23/11/2026): vatCuaA = only tent A's door flaps let down (no dust, no dry herbs: that is leuAToi);
 *  hillSoldiers hides the big pine at (7.4, -17) (it stands in front of the hill path from the low cameras on the right of
 *  tent A, d1c4 shot 11; it is off-frame in every other day shot); soldierPath = their own path (world points) instead of the
 *  painted path over the far hill (WALK_PATH). By day ('sang', 'chang-vang') the unlit tents show their dim warm insides. */
export type RitualState = 'phep' | 'phep-chay' | 'mo';
export {WALK_PATH};
/** the soldiers' path seen from d1c4 shot 11 (máy [-5.6, 1.5, 2.0]): on the face of the far hill straight over the camp, in the
 *  gap between the pines of the nearer hill (screen x about 0.60-0.74), coming down towards the left */
export const SOLDIER_PATH_C11: V3[] = ([[1030, 461], [930, 464], [840, 468], [770, 472]] as [number, number][]).map(([u, v]) => onPlate(EYE, 70, u, v, 1.0));
export const RITUAL_AT: V3 = [-14.0, 0, -4.5];
export const Camp: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; state?: CampState; torches?: boolean;
  ritual?: RitualState; ritualGlow?: number; candleBoost?: number; scarfFaded?: number; graveSnow?: number; knock?: number; donTruoc?: boolean; leuAToi?: boolean; walkers?: boolean; lua?: boolean; hillSoldiers?: boolean; vatCuaA?: boolean; soldierPath?: V3[]; scarfWind?: number; bui?: boolean; buiK?: number}> =
  ({children, f = 0, dx, dz, state = 'dem', torches = false, ritual, ritualGlow = 0, candleBoost = 1, scarfFaded = 0, graveSnow = 0, knock, donTruoc = false, leuAToi = false, walkers = true, lua = false, hillSoldiers = false, vatCuaA = false, soldierPath, scarfWind, bui = true, buiK = 1}) => { datNoiBui('ngoai-troi');
  const dusk = state === 'chang-vang', dem = state === 'dem' || dusk, leu = state === 'do-leu', sang = state === 'sang', plan = doLeuPlan(f), N = sang ? 's' : 'n';
  const fireOn = dem || (sang && lua), inside = sang || dusk ? 'day' as const : 'dark' as const;
  const tuftArt = sang ? (c: Ctx, W: number, H: number) => paintTuft(c, W, H, {light: '#8a9a6a', dark: '#6e7d58'}) : (c: Ctx, W: number, H: number) => paintTuft(c, W, H, {light: '#55604c', dark: '#444e40'});
  const rockArt = sang ? (c: Ctx, W: number, H: number) => paintRock(c, W, H, ['#b4b2aa', '#98968e', '#7c7a74']) : (c: Ctx, W: number, H: number) => paintRock(c, W, H, ['#8a8d98', '#72768a', '#5d6174']);
  return (
  <Scene3 grade={sang || dusk ? 'lateDay' : 'nightExterior'} gain={sang ? 0.95 : dusk ? 0.9 : 1.5} reach={20} dir={sang ? [-9, 4.2, 2.5] : dusk ? [-9, 3.2, 1.2] : undefined}>
    <StageCam eye={EYE} haze={sang ? HAZE_SANG : dusk ? HAZE_DUSK : HAZE} fog={[16, 430]} dx={dx} dz={dz} />
    {dusk ? <><Plate from={EYE} id="cd-sky" d={520} paint={skyDusk} fog={false} /><Plate from={EYE} id="cd-far" d={215} paint={farRangeDusk} /><Plate from={EYE} id="cd-mid" d={140} paint={midRangeDusk} /><Plate from={EYE} id="cd-hills" d={70} paint={farHillsDusk} /><Plate from={EYE} id="cd-near" d={46} paint={nearHillsDusk} /></>
      : sang ? <><Plate from={EYE} id="cs-sky" d={520} paint={skySang} fog={false} /><Plate from={EYE} id="cs-far" d={215} paint={farRangeSang} /><Plate from={EYE} id="cs-mid" d={140} paint={midRangeSang} /><Plate from={EYE} id="cs-hills" d={70} paint={farHillsSang} /><Plate from={EYE} id="cs-near" d={46} paint={nearHillsSang} /></>
      : <><Plate from={EYE} id="c-sky" d={520} paint={sky} fog={false} /><Plate from={EYE} id="c-far" d={215} paint={farRange} /><Plate from={EYE} id="c-mid" d={140} paint={midRange} /><Plate from={EYE} id="c-hills" d={70} paint={farHills} /><Plate from={EYE} id="c-near" d={46} paint={nearHills} /></>}
    {dusk ? <Ground near="#726a5c" far="#66626c" size={[110, 54]} pos={[0, 0, -13.5]} swell={0.03} patch={0.05} farAt={0.6} /> : sang ? <Ground near="#7d8762" far="#72806e" size={[110, 54]} pos={[0, 0, -13.5]} swell={0.03} patch={0.05} farAt={0.6} /> : <Ground near="#5d6352" far="#4e5654" size={[110, 54]} pos={[0, 0, -13.5]} swell={0.03} patch={0.05} farAt={0.6} />}
    {/* the trodden middle of the camp and a few paler and darker patches of ground */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.6, 0.008, -2.4]} scale={[1, 0.5, 1]} receiveShadow><circleGeometry args={[6.2, 40]} /><meshLambertMaterial color={sang ? '#9a8a6c' : '#73695a'} /></mesh>
    {[[-7, -6, 2.4, 1], [6, -9, 3, 0], [-2, -12, 3.4, 1], [9, -3, 2, 0], [-10, -1.5, 2.6, 0], [2, -16, 4, 1]].map(([x, z, q, l], i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006, z]} scale={[1, 0.34, 1]} receiveShadow><circleGeometry args={[q, 28]} /><meshLambertMaterial color={sang ? (l ? '#8e9670' : '#748060') : l ? '#6a705c' : '#4e5548'} /></mesh>)}
    {TREES.map(([x, z, h, k], i) => hillSoldiers && ((x === 7.4 && z === -17) || (x === -3.4 && z === -24)) ? null : <Sprite key={i} name={`${N}pine${k}`} art={sang ? pineSang(k) : pine(k)} px={[300, 600]} w={h * 0.42} pos={[x, 0, z]} flip={i % 2 === 1} />)}
    {/* the camp: five tents at four depths (tent A, the lit one on the left, is Victor's family's), the wagon, flags from
        pole to pole. Rebuilt 22/11/2026 with lib3/kitCamp: real canvas tents and the things of a camp where people live,
        in clusters round each tent. Kept free: the strip in front of tent A (x -7.2 to -2.4, z -4.4 to -6.4, the queue of
        d1c2 shot 14) and every mark round the fire (episodes/d1c2-danh-sach-canh.md). */}
    <NomadTent inside={inside} pos={TENT_A} s={1.15} lit={dem && !leuAToi} seed={1} cloth="#c2a271" trim={['#8c3b2c', '#d8b468']} age={leuAToi ? 1 : 0.8} pattern={0} patches={5} res={4096} smoke={!leuAToi} closed={leuAToi || vatCuaA} f={f} />
    <NomadTent inside={inside} pos={[1.5, 0, -11]} s={1.0} rotY={-0.12} lit={dem} seed={2} cloth="#b8a07a" trim={['#3f5a6e', '#d6c08a']} age={0.5} pattern={1} patches={3} smoke={!leu} f={f + 40} down={leu ? plan.tentB : 0} />
    <NomadTent inside={inside} pos={[-11, 0, -12]} s={1.05} rotY={0.3} seed={3} cloth="#a68d68" trim={['#5d6a50', '#c9a95a']} age={0.95} pattern={2} patches={4} down={leu ? 1 : 0} />
    <NomadTent inside={inside} pos={[5.4, 0, -14.5]} s={0.95} rotY={-0.1} lit={dem} down={leu ? plan.tentD : 0} seed={4} cloth="#bfa57c" trim={['#7a3a5a', '#e0c890']} age={0.6} pattern={3} patches={2} />
    <NomadTent inside={inside} pos={[12.5, 0, -11]} s={1.1} rotY={-0.45} seed={5} cloth="#b09674" trim={['#8c5a2c', '#d8c8a0']} age={0.85} pattern={1} patches={3} />
    {/* the family caravan, turned a little more than the old box (-0.28) so its door end shows as well as its side */}
    {leu ? <LoadedWagon pos={[6.0, 0, -8.6]} rotY={-0.5} roll={plan.wagonRoll} /> : <NomadWagon pos={[6.0, 0, -8.6]} rotY={-0.5} lit={!sang} />}
    <Bunting a={[-6.8, 3.85, -7.95]} b={[1.5, 3.3, -11.1]} sag={0.55} n={14} /><Bunting a={[1.5, 3.3, -11.1]} b={[5.2, 2.75, -8.2]} sag={0.4} n={9} /><Bunting a={[-11, 3.45, -12.1]} b={[-6.8, 3.85, -7.95]} sag={0.45} n={9} />
    {sang ? <><PostLantern pos={[-0.9, 0, -6.4]} /><PostLantern pos={[2.6, 0, -8]} h={2.1} /></> : <><Lantern pos={[-0.9, 0, -6.4]} />{leu ? null : <Lantern pos={[2.6, 0, -8]} h={2.1} />}</>}
    {/* tent A: the lamp pole with herbs, bells and a charm left of the door, a mat at the door, a low pair of crates (low and
        left, never over the door), the family's own hearth on the right with its pots, the washing line behind it */}
    <DoorPole pos={[-8.6, 0, -5.9]} arm={0.78} glow={sang || leuAToi ? 0 : 0.8} dry={leuAToi} shadow={sang || dusk ? 'none' : 'full'} />
    <GroundRug pos={[-6.75, 0, -5.15]} w={1.25} d={0.7} rotY={0.06} c="#7a3428" c2="#d6b47a" />
    <PlankCrate pos={[-7.6, 0, -3.85]} size={[0.8, 0.6, 0.66]} rotY={0.32} seed={3} base="#94704a" />
    <PlankCrate pos={[-8.45, 0, -4.35]} size={[0.56, 0.42, 0.5]} rotY={-0.25} seed={6} base="#8a6a48" />
    <Basket pos={[-8.25, 0, -3.35]} fill="#8a4a3a" seed={2} />
    <ChopBlock pos={[-9.4, 0, -6.6]} rotY={0.4} />
    <StickBundle pos={[-9.9, 0, -8.6]} rotY={0.5} seed={2} />
    <CookHearth pos={[-4.0, 0, -8.1]} f={f} glow={sang ? 0 : leu ? 0.5 : 1} />
    <ClayPot pos={[-3.2, 0, -7.55]} kind="jar" seed={3} /><ClayPot pos={[-2.85, 0, -7.95]} kind="jug" seed={4} color="#a86a44" /><ClayPot pos={[-4.75, 0, -7.4]} kind="bowl" seed={5} color="#8a5236" />
    <ClayPot pos={[-3.35, 0, -8.75]} kind="pot" iron seed={6} s={0.9} />
    <Stool pos={[-2.9, 0, -8.9]} rotY={0.3} />
    <LogPile pos={[-2.3, 0, -9.6]} rotY={0.25} seed={3} />
    <ClothesLine a={[-3.6, 0, -10.0]} b={[-0.9, 0, -10.3]} items={[{k: 'shirt', c: '#c9c0a4'}, {k: 'blanket', c: '#6e3a2e', c2: '#d6b878'}, {k: 'pants', c: '#5a5e6a', c2: '#8a6a4a'}]} seed={1} />
    <HandCart pos={[-2.2, 0, -13.2]} rotY={0.4} seed={5} />
    {/* the cask, a bucket and a stool low at the right in front (shot 7 / d1c2 shot 1: "thùng rượu thấp bên phải giữa") */}
    {/* 'sang': moved left of x -9 so the queue in front of tent A (d1c2 shot 14) stands clear */}
    {sang || donTruoc ? <><Cask pos={[-10.3, 0, -4.3]} seed={3} rotY={0.3} /><Bucket pos={[-9.6, 0, -3.6]} seed={4} /><Stool pos={[-9.35, 0, -4.75]} rotY={-0.4} seed={7} /></>
      : <><Cask pos={[-3.55, 0, -3.7]} seed={3} rotY={0.3} /><Bucket pos={[-2.85, 0, -3.35]} seed={4} /><Stool pos={[-4.25, 0, -3.15]} rotY={-0.4} seed={7} /></>}
    {/* round the big fire (marks of d1c2 shots 6, 9, 11 kept free): pots, a stool, the bucket, sacks, the log seat, a pile */}
    {/* 'do-leu': the sacks, pots, bucket, stool and the wood pile are packed (on the caravan); the fire is put out */}
    {leu ? null : <><Sack pos={[-0.9, 0, -4.6]} /><Sack pos={[-0.1, 0, -4.9]} s={0.85} />
    <Bucket pos={[0.9, 0, -3.4]} seed={8} /><Stool pos={[0.3, 0, -3.25]} seed={9} />
    <ClayPot pos={[2.35, 0, -3.55]} kind="pot" iron seed={9} /><ClayPot pos={[3.3, 0, -3.45]} kind="jug" seed={10} color="#9a5a3a" /><ClayPot pos={[3.75, 0, -3.15]} kind="bowl" seed={11} />
    <LogPile pos={[4.6, 0, -3.7]} seed={5} /></>}
    {leu ? null : <LogSeat pos={[1.1, 0, -4.4]} rotY={0.1} />}
    {fireOn ? (knock === undefined ? <Fire pos={[2.75, 0, -2.4]} f={f} /> : <KnockFire pos={[2.75, 0, -2.4]} f={f} knock={knock} />) : <DousedFire pos={[2.75, 0, -2.4]} f={f} glow={leu ? 1 : 0} />}
    {/* tent B: crates, a basket; tent C: a cask, firewood; tent D: a second washing line, jars, a basket; tent E: the saddle */}
    {leu ? null : <><PlankCrate pos={[3.5, 0, -9.8]} size={[0.8, 0.66, 0.66]} rotY={-0.2} seed={8} /><PlankCrate pos={[3.55, 0.66, -9.85]} size={[0.56, 0.44, 0.5]} rotY={0.15} seed={9} base="#9a7650" /></>}
    <Basket pos={[-0.3, 0, -8.9]} tall fill="#5d6a50" seed={4} />
    {ritual ? null : <><Cask pos={[-12.6, 0, -9.3]} seed={6} rotY={-0.5} /><LogPile pos={[-13.8, 0, -10.0]} rotY={0.6} seed={7} /></>}
    <ClothesLine a={[7.6, 0, -13.0]} b={[10.0, 0, -13.7]} items={[{k: 'rug', c: '#2f4a5e', c2: '#d0a050'}, {k: 'shirt', c: '#a8a080'}]} seed={5} />
    <ClayPot pos={[4.3, 0, -12.4]} kind="jar" seed={12} color="#8a5a3c" /><Basket pos={[6.4, 0, -12.5]} tall seed={6} />
    <SaddleRack pos={[9.6, 0, -7.6]} rotY={-0.35} />
    {/* the ground is never bare: tufts and stones down to the lower edge */}
    {([[-3.2, 0.6, 0.5], [-0.4, -1.6, 0.4], [1.6, 0.9, 0.46], [3.6, -0.2, 0.42], [-5.4, -1.0, 0.5], [4.6, -5.6, 0.5], [-2.6, -6.4, 0.44], [0.2, -7.4, 0.46], [-8.6, -7.6, 0.5], [2.2, 1.6, 0.4], [-1.6, 1.5, 0.44], [5.4, 0.8, 0.5]] as number[][]).map(([x, z, w], i) => <Sprite key={`t${i}`} name={`${N}tuft`} art={tuftArt} px={[160, 110]} w={w} pos={[x, 0, z]} flip={i % 2 === 0} cast={false} shade={0} />)}
    {/* the near ground seen only from the raised wide camera: tufts, stones, wood chips, a dropped sack */}
    {([[-7.5, 3.2, 0.5], [-4.6, 2.2, 0.44], [-1.2, 3.6, 0.5], [2.4, 2.8, 0.46], [5.6, 3.4, 0.5], [8.2, 1.6, 0.48], [-9.6, 0.8, 0.5], [9.8, -1.6, 0.46], [6.4, 0.6, 0.42], [-6.2, 0.6, 0.44]] as number[][]).map(([x, z, w], i) => <Sprite key={`ft${i}`} name={`${N}tuft`} art={tuftArt} px={[160, 110]} w={w} pos={[x, 0, z]} flip={i % 2 === 1} cast={false} shade={0} />)}
    {([[-3.0, 2.6, 0.36], [3.9, 1.8, 0.3], [-8.4, 2.0, 0.42], [7.2, 2.6, 0.34], [0.6, 3.4, 0.3]] as number[][]).map(([x, z, w], i) => <Sprite key={`fr${i}`} name={`${N}rock`} art={rockArt} px={[240, 150]} w={w} pos={[x, 0, z]} flip={i % 2 === 0} shade={0.3} />)}
    <GroundRug pos={[3.8, 0, 1.0]} w={1.3} d={0.85} rotY={-0.3} c="#5a3a2e" c2="#b89a60" seed={7} />
    <StickBundle pos={[1.6, 0, 2.3]} rotY={-0.4} seed={4} /><Basket pos={[6.2, 0, 2.0]} fill="#6e5a3a" seed={5} /><Bucket pos={[-4.2, 0, 1.8]} seed={12} />
    {/* small tufts and pebbles just in front of tent A (low: they must not hide the feet of the queue of d1c2 shot 14) */}
    {([[-5.3, -4.1, 0.3], [-4.5, -4.55, 0.26], [-6.0, -4.3, 0.28], [-3.9, -5.1, 0.24]] as number[][]).map(([x, z, w], i) => <Sprite key={`qt${i}`} name={`${N}tuft`} art={tuftArt} px={[160, 110]} w={w} pos={[x, 0, z]} flip={i % 2 === 1} cast={false} shade={0} />)}
    {([[-4.95, -4.3, 0.2], [-5.7, -4.75, 0.16]] as number[][]).map(([x, z, w], i) => <Sprite key={`qr${i}`} name={`${N}rock`} art={rockArt} px={[240, 150]} w={w} pos={[x, 0, z]} flip={i % 2 === 0} shade={0.3} />)}
    {([[-2.2, -0.9, 0.34], [0.9, -2.0, 0.28], [4.3, 0.6, 0.4], [-4.4, 0.9, 0.36], [3.0, -6.6, 0.4]] as number[][]).map(([x, z, w], i) => <Sprite key={`r${i}`} name={`${N}rock`} art={rockArt} px={[240, 150]} w={w} pos={[x, 0, z]} flip={i % 2 === 1} shade={0.3} />)}
    {[[-3.4, -7.6, 1.5], [3.4, -11.5, 1.6], [-8.2, -9, 1.7], [9.8, -9.5, 1.5], [-1.6, -15, 1.6]].map(([x, z, w], i) => <Sprite key={i} name={`${N}bush`} art={sang ? (c, W, H) => paintBush(c, W, H, ['#4e6650', '#5a7458', '#688262']) : (c, W, H) => paintBush(c, W, H, ['#2f3d3c', '#384846', '#43544f'])} px={[400, 240]} w={w} pos={[x, 0, z]} flip={i % 2 === 0} />)}
    {dem && !dusk ? <Fireflies f={f} /> : null}
    {/* vật đi trên các tấm nền xa: quay cùng tấm khi máy đi vòng (TheoTam) */}
    <TheoTam from={EYE}>
    {dem && !dusk && torches ? <FarLights f={f} path={TORCH_PATH} n={7} gap={1.1} speed={0.09} start={6} torch size={0.15} /> : null}
    {leu ? <FarLights f={f} path={LEAVING_PATH} n={8} gap={1.9} speed={0.06} start={9} torch={false} size={0.09} /> : null}
    {sang && walkers && !hillSoldiers ? <HillWalkers f={f} path={WALK_PATH} n={5} gap={2.4} /> : null}
    {sang && hillSoldiers ? <HillWalkers f={f} path={soldierPath ?? WALK_PATH} n={5} gap={1.5} speed={0.05} kind="soldiers" /> : null}
    </TheoTam>
    {/* d1c3: the ritual place / the grave at the left edge, with denser dark pines behind it and a rotten log in front */}
    {ritual ? <>
      <RitualSite pos={RITUAL_AT} state={ritual} f={f} glow={ritualGlow} boost={candleBoost} faded={scarfFaded} snow={graveSnow} scarfWind={scarfWind} />
      {/* light (23/11/2026, "các cảnh hơi tối"): the pines behind the ring are moonlit blue-grey at night and pale green with mist
          (kept left of tent C, x < -13.2) in the morning, a soft moonlight / morning light falls on the clearing, the clearing's ground is paler than the camp's */}
      {RITUAL_TREES.map(([x, z, h, k], i) => <Sprite key={`rt${i}`} name={`${N}rpine${k}`} art={ritualPine(k, sang)} px={[300, 600]} w={h * 0.42} pos={[x, 0, z]} flip={i % 2 === 0} />)}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[RITUAL_AT[0], 0.005, RITUAL_AT[2]]} scale={[1, 0.75, 1]} receiveShadow><circleGeometry args={[4.6, 36]} /><meshLambertMaterial color={sang ? '#8e9672' : dusk ? '#7a7066' : '#6c7064'} /></mesh>
      {[-7.6, -10.2, -12.8].map((z, i) => <mesh key={`rm${i}`} position={[-17.8, 2.2, z]} renderOrder={1}><planeGeometry args={[9.2, 4.4]} /><meshBasicMaterial map={mistTex()} color={sang ? '#f4f2ec' : dusk ? '#e0b0b0' : '#a8b4d8'} transparent opacity={sang ? 0.24 : dusk ? 0.2 : 0.16} depthWrite={false} /></mesh>)}
      <directionalLight position={[RITUAL_AT[0] - 6, 9, RITUAL_AT[2] + 5]} target-position={RITUAL_AT} color={sang ? '#fff0d8' : dusk ? '#ffc8a0' : '#b4c2ee'} intensity={sang ? 0.55 : dusk ? 0.6 : 0.75} />
      {[[-16.6, -6.6, 1.4], [-11.9, -7.2, 1.2], [-17.6, -3.4, 1.3]].map(([x, z, w], i) => <Sprite key={`rb${i}`} name={`${N}bush`} art={sang ? (c, W, H) => paintBush(c, W, H, ['#4e6650', '#5a7458', '#688262']) : (c, W, H) => paintBush(c, W, H, ['#2f3d3c', '#384846', '#43544f'])} px={[400, 240]} w={w} pos={[x, 0, z]} flip={i % 2 === 1} />)}
      {([[-15.2, -3.2, 0.42], [-12.6, -5.8, 0.4], [-15.9, -5.4, 0.46], [-13.0, -2.6, 0.36]] as number[][]).map(([x, z, w], i) => <Sprite key={`rtf${i}`} name={`${N}tuft`} art={tuftArt} px={[160, 110]} w={w} pos={[x, 0, z]} flip={i % 2 === 0} cast={false} shade={0} />)}
      <RottenLog pos={[-16.1, 0, -2.3]} rotY={0.35} />
    </> : null}
    {/* the air (23/11/2026, Daniel: "thiếu các bụi bay"): dust by depth, leaves by day, fireflies at dusk and night, sparks
        over the burning fire, the cook hearth and the ritual candles; none in the snow of the grave years on */}
    {bui && !(ritual === 'mo' && graveSnow > 0) ? <CampAir f={f} mode={sang ? 'day' : dusk ? 'dusk' : 'night'} k={buiK}
      sparks={[...(fireOn ? [[2.75, 0.9, -2.3] as V3] : []), ...(!sang ? [[-4.0, 0.5, -8.0] as V3] : []), ...(ritual === 'phep' ? [[RITUAL_AT[0] + 0.8, 0.8, RITUAL_AT[2] + 0.9] as V3, [RITUAL_AT[0] - 1.1, 0.7, RITUAL_AT[2] + 0.5] as V3] : [])]} /> : null}
    {children}
    <Plate from={EYE} id="c-fg" d={2.6} paint={foreground} fog={false} order={900} />
  </Scene3>
  );
};
const CampStill: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill><Finish><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>
      <Camp><Puppet3 height={1.7} pos={[-1.9, 0, -0.2]} spec={FATHER} /><Puppet3 height={1.15} pos={[0.0, 0, 0]} flip spec={BOY} /></Camp>
    </ThreeCanvas></Finish></AbsoluteFill>
  );
};
// ---------------------------------------------------------------- ten seconds by the fire
const F0: Spec = {...FATHER, armL: {...POSES.idle[0]}, armR: {...POSES.idle[1]}}, B0: Spec = {...BOY, expr: {...EXPR.smile, gaze: [18, -12]}, armL: {...POSES.idle[0]}, armR: {...POSES.idle[1]}};
const F_BEATS: Beat[] = [{f: 14, pose: 'present', say: 26}, {f: 46, pose: 'explain'}, {f: 68, body: 'shift'}, {f: 88, pose: 'point', big: true, say: 20, dir: 1}, {f: 114, pose: 'chest', body: 'leanIn'}, {f: 142, pose: 'idle', body: 'upright'}, {f: 162, pose: 'offer', say: 18}, {f: 190, pose: 'hips'}, {f: 216, body: 'shift', dir: -1}];
const B_BEATS: Beat[] = [{f: 40, pose: 'akimbo'}, {f: 74, look: [20, -4]}, {f: 98, body: 'shift'}, {f: 122, face: 'happy', look: [18, -12], pose: 'open', body: 'bounce'}, {f: 152, pose: 'chest', face: 'smile'}, {f: 178, body: 'step'}, {f: 204, pose: 'idle'}];
const KF = perform(F_BEATS, {dirDefault: 1}), KB = perform(B_BEATS, {dirDefault: -1, mirror: true});
const CampSeq: React.FC = () => {
  const {width, height} = useVideoConfig(), f = useCurrentFrame(), t = f / 239;
  return (
    <AbsoluteFill><Finish><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>
      <Camp f={f} dx={-0.22 + 0.44 * t} dz={-0.35 * t}>
        <Puppet3 height={1.7} pos={[-1.9, 0, -0.2]} spec={blink(act(F0, KF, f, {seed: 1}), f, [34, 120, 196], 'blank')} />
        <Puppet3 height={1.15} pos={[0.0, 0, 0]} flip spec={blink(act(B0, KB, f, {seed: 2}), f, [20, 92, 168, 226], 'half')} />
      </Camp>
    </ThreeCanvas></Finish></AbsoluteFill>
  );
};
/** the whole camp from a raised camera further back (no people): every tent and every cluster of things */
export const CAMP_WIDE: V3 = [0.5, 2.8, 14];
const CampWide: React.FC = () => <Shot grade="nightExterior" eye={CAMP_WIDE} set={(inside, cam) => <Camp dx={cam.dx} dz={cam.dz}>{inside}</Camp>} figures={null} />;
/** the rest frame of d1mo shot 7 / first frame of d1c2 shot 1, without the snow (for checking the set alone) */
const CampTentA: React.FC = () => <Shot grade="nightExterior" eye={[-5.2, 1.7, 3.0]} set={(inside, cam) => <Camp dx={cam.dx} dz={cam.dz}>{inside}</Camp>} figures={null} />;
export const ritualShot = (eye: V3, state: CampState, props: Partial<React.ComponentProps<typeof Camp>>, figures: React.ReactNode, soft = 0) => <Shot grade={campGrade(state)} eye={eye} soft={soft} set={(inside, cam) => <Camp state={state} {...props} dx={cam.dx} dz={cam.dz}>{inside}</Camp>} figures={figures} />;
/** brightness checks (chung/skills/1-dung-canh.md, "Độ sáng"): the remaining camera positions of the camp shots, no people */
const CHECK_VIEWS: [string, V3, Partial<React.ComponentProps<typeof Camp>>][] = [
  ['camp-sang-kiem-d1c2-c4', [0.5, 3.4, 13], {}], ['camp-sang-kiem-d1c2-c6', [2.4, 1.25, 2.6], {}], ['camp-sang-kiem-d1c3-c1', [-9.0, 1.25, 2.5], {}],
  ['camp-sang-kiem-d1c3-c7', [-13.6, 1.0, 5.5], {ritual: 'phep', ritualGlow: 0.3}],
];
/** the same, at the new hours of d1c3 / d1c4 (lượt ba): day ('sang') and the still-bright dusk ('chang-vang') */
const CHECK_DAY: [string, V3, CampState, Partial<React.ComponentProps<typeof Camp>>][] = [
  ['camp-ngay-kiem-d1c3-c1', [-9.0, 1.25, 2.5], 'sang', {walkers: false}], ['camp-ngay-kiem-d1c3-c4', [0.45, 1.4, 2.0], 'sang', {walkers: false, lua: true}],
  ['camp-ngay-kiem-d1c3-c7', [-13.6, 1.0, 5.5], 'chang-vang', {ritual: 'phep', ritualGlow: 0.3}], ['camp-ngay-kiem-d1c4-c10', [-6.3, 1.0, -1.6], 'sang', {walkers: false, vatCuaA: true}], ['camp-ngay-kiem-changvang', [-5.2, 1.7, 3.0], 'chang-vang', {f: 30}], ['camp-ngay-kiem-d1c4-c11', [-5.6, 1.5, 2.0], 'sang', {walkers: false, hillSoldiers: true, f: 20}], ['camp-ngay-kiem-d1c4-c11b', [-5.6, 1.5, 2.0], 'sang', {walkers: false, hillSoldiers: true, soldierPath: SOLDIER_PATH_C11, f: 20}],
  ['camp-ngay-kiem-d1c3-c10', [3.0, 1.2, 4.5], 'sang', {walkers: false, lua: true}],
];

/** check (23/11/2026, d1c5): a person standing in front of tent A's right guy rope, at d1c5 shot 15's camera */
const RopeCheck: React.FC = () => ritualShot([-4.2, 1.7, 3.0], 'sang', {f: 0, walkers: false}, <Puppet3 height={1.7} pos={[-4.2, 0, -5.6]} spec={FATHER} />, 1.0);
export const CampComps: React.FC = () => <><Composition id="camp-kiem-day-neo" component={RopeCheck} width={1280} height={720} fps={24} durationInFrames={1} />{CHECK_DAY.map(([id, eye, st, pr]) => <Composition key={id} id={id} component={() => ritualShot(eye, st, {f: 0, ...pr}, null)} width={1280} height={720} fps={24} durationInFrames={1} />)}{CHECK_VIEWS.map(([id, eye, pr]) => <Composition key={id} id={id} component={() => ritualShot(eye, 'dem', {f: 0, ...pr}, null)} width={1280} height={720} fps={24} durationInFrames={1} />)}<Composition id="camp-toan-canh" component={CampWide} width={1280} height={720} fps={24} durationInFrames={1} /><Composition id="camp-leu-a" component={CampTentA} width={1280} height={720} fps={24} durationInFrames={1} /><Composition id="camp-still" component={CampStill} width={1280} height={720} fps={24} durationInFrames={1} /><Composition id="camp-seq" component={CampSeq} width={1280} height={720} fps={24} durationInFrames={240} /></>;
