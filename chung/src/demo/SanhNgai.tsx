import React, {useMemo} from 'react';
import {datNoiBui} from '../lib3/mauBui';
import {AbsoluteFill, Composition, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {GradeCtx, Finish, Halo} from '../lib3/look';
import {B, StageCam} from '../lib3/kit';
import {HoledWall, tex} from '../lib3/kitLab';
import {Sun} from '../lib3/room';
import {Shot} from '../lib3/shot';
import {stoneTex, paintStone, StoneBox, Timber} from '../lib3/kitForge';
import {HALL, HALL_STONE, HallLook, StainedWindow, HallBanner, paintRunner, Dais, DAIS, DAIS_TOP, Throne, HallColumn, WallTorch, ArmourStand, LightShaft, Candelabra, WindowBeam, FloorPool, glassBlend, BanquetTable, GiaDiaCau, PaperScraps, ColumnFlag, LightColumn} from '../lib3/kitSanhNgai';
import {DriftSpecks} from '../lib3/kitLab';
import {SKINS} from '../mould/palettes';
import {Puppet3} from '../mould/Puppet3';
import type {Spec} from '../mould/draw';
import {frameOn} from '../lib3/shot';
import {POSES} from '../mould/gestures';
import {XapGiay, CoTron} from '../lib3/kitLo1517';
import {SmokeDrift} from '../lib3/fx';
import {rnd} from '../lib3/depth';

/** THE THRONE HALL OF DOOM'S CASTLE, AT NIGHT (passage d1mo shots 5 and 6, episodes/d1mo-danh-sach-canh.md). World units =
 *  hall units (metres), the hall is NOT turned: the camera looks straight down the carpet at the throne through the open front.
 *    hall: x -7..7 (left to right), back wall at z -12, open front at z 2, the vault lost in the dark above 7.5.
 *    back wall: three lancet windows of stained glass (centre one over the throne, x ±1.3, sill 2.3; side ones at x ±3.9,
 *               sill 1.7), a banner between each side window and the middle (x ±2.6), a string course at 1.55, a cornice.
 *    floor: dark polished flags; a carpet runner from the front up the three steps of the dais to the throne.
 *    dais: three steps (0.18 each) from z -8.6 back to the wall; the throne on top, seat front edge at z -10.15.
 *    sides: two pairs of round columns (x ±2.9 at z -7 and z -10) with torches on their inner faces; a suit of armour in front
 *           of each far column (x ±2.55, z -8).
 *  Light: a cool dim fill; the moon through the windows from high behind, nearly straight down the hall (green-gold: the
 *  centre window and the throne's shadow in it lie on the carpet before the dais); four torches; a pale shaft from high above onto the throne.
 *  States: 'doom' (green and gold). 'namTuoc' (the Baron's hall, chapter 2) = the same hall with the red palette; the throne
 *  can be moved with `throneX` and the side windows can be closed with `windows`. */
export type V3 = [number, number, number];
export const HW = 7, BACK = -12, FRONT = 2, RH = 10;
/** 'doom' = Doom's hall (d1mo, approved); 'nam-tuoc' (= 'namTuoc') = the same hall in the Baron's time (d1c2): red cloth and
 *  glass, his gold diamond on the banners, the throne and the shields. */
/** (23/11/2026, chapters 10-13) two more states, both in Doom's green and gold: 'yen-tiec' = the hall by DAY for the banquet of chapter 12 scene 14 (sun through the glass, a blue-clothed table across the carpet laid with food),
 *  'doom-toi' = the hall after the torches have burnt out (chapter 11 scenes 30-32: one torch left, no shaft of light, paper thrown on the steps). Y of both measured in the stage notes. */
/** (24/11/2026, chương 15-17) 'doom-ngay' = the hall by DAY in Doom's green and gold, as in 'yen-tiec' (sun through the glass, bright interior, dust in the sun) but with NO banquet table and the torches out: only the lights and the glass changed.
 *  Chương 16 adds `banHop` (the meeting table across the carpet, on the same table as the banquet: a wooden platform 0.25 high behind it with a tall chair back, three stools; papers by `giayTrai`, `giayPhai`) and `chieu` 0..1 (the sun and the glass go from yellow to orange, the beams lean longer).
 *  Chương 15: `coTron` = four plain flags on stands behind the kneeling presidents, each leaning toward the throne by its own 0..1. Chương 17: `doNen` 0..1 = a red-orange light from below on the throne; `hanhTinhKinh` 0..1 = the patched planet rising in the right pane (a green diamond pane, a green streak across the floor to the throne's foot);
 *  `khoi` 0..1 = thin smoke over each torch that is out (duoc) and over the candles when `nenTat`. */
export type HallState = 'doom' | 'nam-tuoc' | 'namTuoc' | 'yen-tiec' | 'doom-toi' | 'doom-ngay';
export const WINS = {centre: {x: 0, w: 2.6, sill: 2.3, h: 3.8}, side: {x: 4.3, w: 2.2, sill: 1.0, h: 4.6}};
/** the moon's direction (unit, into the hall and down): beams, pools and the moon light share it */
export const MOON_DIR: V3 = [-0.072, -0.623, 0.779];
export const THRONE_Z = -10.15;
/** Marks (world). ngai = Doom seated (y = top of the dais). The subjects stand either side of the carpet, backs to the lens. */
export const HALL_MARKS = {
  ngai: [0, DAIS_TOP, THRONE_Z + 0.15] as V3,
  danTrai1: [-1.4, 0, -5.4] as V3, danTrai2: [-2.05, 0, -6.2] as V3, danTrai3: [-1.5, 0, -7.1] as V3,
  danPhai1: [1.45, 0, -5.6] as V3, danPhai2: [2.1, 0, -6.4] as V3, danPhai3: [1.55, 0, -7.3] as V3,
  // added 23/11/2026 (chapters 10-13)
  robotTrai: [-1.9, 0, -8.0] as V3, robotPhai: [1.9, 0, -8.0] as V3,          // the two guard robots either side of the throne's foot (chapter 10 scene 15, chapter 11 scene 1, chapter 13 scene 6)
  quaCau: [1.55, 1.25, -7.8] as V3,                                          // centre of the world globe on its stand (`giaCau`), disc radius 0.42
  doomTiec: [0.9, 0, -7.2] as V3, surferTiec: [-0.9, 0.3, -7.2] as V3, banTiec: [0, 0, -6.35] as V3,   // 'yen-tiec': behind the table (its back edge z -6.8)
  // 24/11/2026: doomHop = Doom behind the meeting table on its platform (banHop); ghe1..3 = the three stools of the advisers (cv1, cv2 left, cv3 right); tongThong1..4 = the four presidents kneeling on the carpet (back to the lens); coTron1..4 = the four plain flag stands behind them;
  // ahTrai / ahPhai / ahGiua = the three heroes (ch15 s21); doomCau = Doom beside the globe (ch15 s23, s27)
  doomHop: [0, 0.25, -7.15] as V3, ghe1: [-1.75, 0, -7.2] as V3, ghe2: [-1.0, 0, -7.2] as V3, ghe3: [1.1, 0, -7.2] as V3,
  tongThong1: [-1.6, 0, -7.6] as V3, tongThong2: [-0.7, 0, -7.6] as V3, tongThong3: [0.7, 0, -7.6] as V3, tongThong4: [1.6, 0, -7.6] as V3,
  coTron1: [-2.4, 0, -8.3] as V3, coTron2: [-1.15, 0, -8.5] as V3, coTron3: [1.15, 0, -8.5] as V3, coTron4: [2.4, 0, -8.3] as V3,
  ahTrai: [-1.85, 0.18, -8.8] as V3, ahPhai: [1.85, 0.18, -8.8] as V3, ahGiua: [-0.95, 0, -7.9] as V3, doomCau: [0.95, 0, -7.4] as V3,
};
/** Camera positions. c5 = shot 5, the wide down the carpet (Doom about 30 % of the frame); c6 = shot 6, Doom from the knees
 *  up, about 65 %, room for the name label right of his head. */
export const HALL_VIEWS = {
  c5: [0, 1.75, -0.4] as V3,
  c6: [0, 1.6, -5.65] as V3,
  // added 23/11/2026: dep = ch10 s2 (Doom's back, the throne in the middle), vua = ch10 s4 (Doom seated from the chest up), can = ch10 s19 (the mask about 45 %), xa = ch11 s1 (seated Doom 45 %), toi = ch11 s30 (seated Doom 48 %),
  // bat = ch13 s6 (Doom 41 %), tiec = ch12 s14 (the banquet; run it with the camera path `duongMay`)
  dep: [0, 1.75, -2.6] as V3, vua: [0, 1.72, -7.1] as V3, can: [0.1, 1.76, -8.4] as V3, xa: [0, 1.7, -3.9] as V3, toi: [0, 1.7, -4.4] as V3, bat: [0, 1.75, -2.4] as V3, tiec: [0, 1.7, -1.0] as V3,
  // 24/11/2026 (d1c15 s21, s23, s27; d1c16 s4, s5, s12, s13, s14): ahCam, cau23, cau27, hop4, hop5, hop12, hop13, hop14
  ahCam: [0, 1.45, -3.2] as V3, cau23: [1.2, 1.6, -2.1] as V3, cau27: [1.25, 1.6, -5.0] as V3,
  hop4: [0.35, 1.25, -4.1] as V3, hop5: [-0.1, 1.7, -2.4] as V3, hop12: [-0.6, 1.3, -4.0] as V3, hop13: [0.1, 1.35, -4.6] as V3, hop14: [0.4, 1.7, -3.4] as V3,
};

// ---------------------------------------------------------------- the shell
const winHoles = () => [{...WINS.side, x: -WINS.side.x}, {...WINS.centre}, {...WINS.side}].map((w) => ({x0: HW + w.x - w.w / 2, x1: HW + w.x + w.w / 2, sill: w.sill, spring: w.sill + w.h - w.w / 2}));
const backTex = () => stoneTex('hall-wall-back3', HW * 2, RH, {...HALL_STONE, seed: 7, arches: winHoles(), damp: 0.8, course: [0.28, 0.5], len: [0.5, 1.2], soot: [{x: HW - 2.6, y: 3.2, r: 0.9, k: 0.35}, {x: HW + 2.6, y: 3.2, r: 0.9, k: 0.35}]}, 290);
const sideTex = (k: number) => stoneTex(`hall-wall-side3-${k}`, FRONT - BACK, RH, {...HALL_STONE, seed: 11 + k, damp: 0.8, course: [0.28, 0.5], len: [0.5, 1.2]}, 220);
const floorTex = () => tex('hall-floor3', 4000, 4000, paintStone(HW * 2, FRONT - BACK, {seed: 21, tones: ['#62706a', '#5a6862', '#6a7872', '#54625c', '#6e7c76', '#505e58', '#606e68'], mortar: '#2e3834', course: [0.7, 0.95], len: [0.7, 1.25], damp: 0, streaks: 0}));
const runnerTex = (look: HallLook) => tex(`hall-runner-${look.cloth}`, 400, 2200, paintRunner(look, 11, 5));

const Shell: React.FC<{look: HallLook}> = ({look}) => (
  <group>
    <group position={[-HW, 0, BACK]}><HoledWall w={HW * 2} h={RH} t={0.7} map={backTex()} slab="#3c4246" holes={winHoles().map((h) => ({kind: 'arch' as const, x0: h.x0, x1: h.x1, y0: h.sill, spring: h.spring}))} /></group>
    {/* deep sills */}
    {winHoles().map((h, i) => <StoneBox key={i} id={`hall-sill-${i}`} p={[(h.x0 + h.x1) / 2 - HW, h.sill - 0.06, BACK - 0.3]} s={[h.x1 - h.x0 + 0.04, 0.12, 0.66]} look={{...HALL_STONE, seed: 51 + i, course: [0.12, 0.12], len: [0.4, 0.6], damp: 0, streaks: 0}} />)}
    <group position={[-HW, 0, FRONT]} rotation={[0, Math.PI / 2, 0]}><HoledWall w={FRONT - BACK} h={RH} t={0.6} map={sideTex(0)} slab="#3c4246" /></group>
    <group position={[HW, 0, BACK]} rotation={[0, -Math.PI / 2, 0]}><HoledWall w={FRONT - BACK} h={RH} t={0.6} map={sideTex(1)} slab="#3c4246" /></group>
    {/* floor: polished dark flags (a little sheen from the torches); a dark vault above */}
    <mesh position={[0, 0, (BACK + FRONT) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[HW * 2, FRONT - BACK]} /><meshPhongMaterial map={floorTex()} shininess={70} specular="#4a5a56" /></mesh>
    <mesh position={[0, RH, (BACK + FRONT) / 2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[HW * 2, FRONT - BACK]} /><meshLambertMaterial color="#101412" /></mesh>
    {/* the back wall's courses: a plinth course, a string course under the side windows, a cornice; three beams of the roof */}
    <StoneBox id="hall-plinth-course" p={[0, 0.25, BACK + 0.06]} s={[HW * 2, 0.5, 0.12]} look={{...HALL_STONE, seed: 61, course: [0.5, 0.5], len: [0.6, 1.0], damp: 0.4}} />
    {[[-HW, -WINS.side.x - WINS.side.w / 2 - 0.08], [-WINS.side.x + WINS.side.w / 2 + 0.08, WINS.side.x - WINS.side.w / 2 - 0.08], [WINS.side.x + WINS.side.w / 2 + 0.08, HW]].map(([a, b], i) =>
      <StoneBox key={i} id={`hall-string-${i}`} p={[(a + b) / 2, 1.55, BACK + 0.06]} s={[b - a, 0.12, 0.12]} look={{...HALL_STONE, seed: 63 + i, course: [0.12, 0.12], len: [0.5, 0.8], damp: 0, streaks: 0}} />)}
    <StoneBox id="hall-cornice" p={[0, 6.55, BACK + 0.12]} s={[HW * 2, 0.3, 0.24]} look={{...HALL_STONE, seed: 67, course: [0.3, 0.3], len: [0.5, 0.8], damp: 0, streaks: 0}} />
    <B p={[0, 6.38, BACK + 0.1]} s={[HW * 2, 0.06, 0.2]} c={look.goldDark} />
    {Array.from({length: 22}, (_, i) => <B key={i} p={[-HW + 0.35 + i * 0.64, 6.32, BACK + 0.14]} s={[0.14, 0.14, 0.18]} c="#46524d" />)}
    {[-9.5, -5.5, -1.5].map((z, i) => <Timber key={z} p={[0, RH - 0.2, z]} s={[HW * 2, 0.36, 0.32]} seed={i} />)}
  </group>
);

const GHE = [HALL_MARKS.ghe1, HALL_MARKS.ghe2, HALL_MARKS.ghe3], CO_TRON = [HALL_MARKS.coTron1, HALL_MARKS.coTron2, HALL_MARKS.coTron3, HALL_MARKS.coTron4];
const mixHex = (a: string, b: string, k: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
// ---------------------------------------------------------------- 24/11/2026: the meeting set, the plain flags, the planet in the glass
/** the meeting set of chương 16 behind the banquet table: a wooden platform 0.25 high (x -1.35..1.35, z -7.95..-6.75), a tall-backed chair with green cloth (the seat at 0.5 above the platform, the back to 1.95), three stools of the advisers, a stack of papers each side of the table (its top at 0.75). */
const HopFurniture: React.FC<{look: HallLook; giayTrai: number; giayPhai: number}> = ({look, giayTrai, giayPhai}) => (
  <group>
    <B p={[0, 0.125, -7.35]} s={[2.7, 0.25, 1.2]} c="#6a4426" /><B p={[0, 0.252, -7.35]} s={[2.7, 0.012, 1.2]} c="#8a5a34" cast={false} /><B p={[0, 0.2, -6.74]} s={[2.7, 0.04, 0.03]} c={look.gold} cast={false} />
    <B p={[0, 0.75, -7.8]} s={[0.78, 1.5, 0.1]} c="#4a3220" /><B p={[0, 0.78, -7.74]} s={[0.62, 1.2, 0.04]} c={look.cloth} cast={false} /><B p={[0, 1.55, -7.8]} s={[0.9, 0.12, 0.14]} c={look.gold} />
    {[-0.36, 0.36].map((x) => <B key={x} p={[x, 0.55, -7.46]} s={[0.07, 0.6, 0.07]} c="#4a3220" />)}<B p={[0, 0.77, -7.4]} s={[0.78, 0.1, 0.62]} c={look.clothDark} />
    {GHE.map((q, i) => <group key={i} position={q}><mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.2, 0.17, 0.4, 8]} /><meshLambertMaterial color="#6a4426" flatShading /></mesh><mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.22, 0.22, 0.05, 8]} /><meshLambertMaterial color={look.clothDark} flatShading /></mesh></group>)}
    <XapGiay pos={[-1.3, 0.75, -6.35]} n={giayTrai} seed={1} /><XapGiay pos={[1.3, 0.75, -6.35]} n={giayPhai} seed={2} rotY={0.12} />
  </group>
);
/** the patched planet rising in the right pane (centre x 4.15, y 3.0): a diamond pane of the stained glass turned clear, a night sky in it and the planet (patches of forest, snow, desert, city, sea, stitched with green seams) coming up from the sill; k 0..1 */
const planetCanvas = (() => { let cv: HTMLCanvasElement | null = null; return () => {
  if (cv) return cv; const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d')!, r = rnd(31), pts = Array.from({length: 20}, () => [r() * S, r() * S, Math.floor(r() * 6)]);
  const cols = ['#3f7a44', '#eef3f6', '#c4623a', '#7a8794', '#2f5f9a', '#d9a43a'], img = x.createImageData(S, S), near = (px: number, py: number) => { let b = 0, bd = 1e9; pts.forEach((q, i) => { const d = (q[0] - px) ** 2 + (q[1] - py) ** 2; if (d < bd) { bd = d; b = i; } }); return b; };
  const idx = new Int16Array(S * S); for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) idx[j * S + i] = near(i, j);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const k = idx[j * S + i], seam = (i + 1 < S && idx[j * S + i + 1] !== k) || (j + 1 < S && idx[(j + 1) * S + i] !== k), dx = i - S / 2, dy = j - S / 2, inside = dx * dx + dy * dy < (S / 2) ** 2, c0 = new THREE.Color(seam ? '#3dff8e' : cols[pts[k][2]]), shade = i > S * 0.62 + (j - S / 2) * 0.1 ? 0.72 : 1, o = (j * S + i) * 4; img.data[o] = c0.r * 255 * shade; img.data[o + 1] = c0.g * 255 * shade; img.data[o + 2] = c0.b * 255 * shade; img.data[o + 3] = inside ? 255 : 0; }
  x.putImageData(img, 0, 0); cv = c; return c; }; })();
const HanhTinhKinh: React.FC<{k: number}> = ({k}) => {
  const q = Math.round(Math.max(0, Math.min(1, k)) * 12), map = useMemo(() => tex(`hall-hanhtinh-${q}`, 512, 512, (c, W) => {
    const cx = W / 2, R = W * 0.48, dia = (rr: number) => { c.beginPath(); c.moveTo(cx, cx - rr); c.lineTo(cx + rr, cx); c.lineTo(cx, cx + rr); c.lineTo(cx - rr, cx); c.closePath(); };
    c.clearRect(0, 0, W, W); c.fillStyle = '#10120c'; dia(R); c.fill(); c.fillStyle = '#0a2a22'; dia(R * 0.9); c.fill();
    c.save(); dia(R * 0.9); c.clip(); const rr = rnd(5); c.fillStyle = '#e6fff0'; for (let i = 0; i < 26; i++) c.fillRect(rr() * W, rr() * W, 2 + rr() * 2, 2 + rr() * 2);
    const t = q / 12, pr = W * 0.27, py = W * (0.98 - t * 0.48); c.fillStyle = 'rgba(61,255,142,0.3)'; c.beginPath(); c.arc(cx, py, pr * 1.12, 0, 7); c.fill(); c.drawImage(planetCanvas(), cx - pr, py - pr, pr * 2, pr * 2); c.restore();
    c.strokeStyle = '#3dff8e'; c.lineWidth = 5; dia(R * 0.9); c.stroke();
  }), [q]);
  const t = q / 12, floor = useMemo(() => { const sh = new THREE.Shape(); [[3.4, -11.7], [5.0, -11.7], [0.5, -8.7], [-0.9, -8.7]].forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z))); sh.closePath(); return new THREE.ShapeGeometry(sh); }, []);
  return (
    <group>
      <mesh position={[4.15, 3.0, BACK - 0.36]}><planeGeometry args={[1.8, 1.8]} /><meshBasicMaterial map={map} transparent toneMapped={false} /></mesh>
      <Halo pos={[4.15, 3.0, BACK + 0.2]} r={1.8} color="#3dff8e" strength={0.35 * t} />
      <mesh geometry={floor} position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}><meshBasicMaterial color="#3dff8e" transparent opacity={0.2 * t} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
      <pointLight position={[2.6, 2.2, -9.4]} color="#3dff8e" intensity={9 * t} distance={8} decay={1.4} />
    </group>
  );
};

type Extra = {an: ((c: CanvasRenderingContext2D, W: number, H: number) => void) | null; sunK: number; glowK: number; glassQ: number; lean: number; sway: number; lit: number[] | null; tiec: boolean; giaCau: boolean; giayVo: boolean; coKeo: number;
  dir: V3; banHop: boolean; giayTrai: number; giayPhai: number; coTron: number[] | null; khoi: number; nenTat: boolean; hanhTinh: number; vanBan: boolean};
const NO_EXTRA: Extra = {an: null, sunK: 1, glowK: 1, glassQ: 0, lean: 0, sway: 0, lit: null, tiec: false, giaCau: false, giayVo: false, coKeo: 0, dir: MOON_DIR, banHop: false, giayTrai: 7, giayPhai: 5, coTron: null, khoi: 0, nenTat: false, hanhTinh: 0, vanBan: false};
const Dressing: React.FC<{f: number; look: HallLook; throneX: number; x?: Extra}> = ({f, look, throneX, x: X = NO_EXTRA}) => {
  const gl = X.glassQ > 0 ? glassBlend(look, X.glassQ / 6) : look, gq = X.glassQ > 0 ? `-k${X.glassQ}` : '';
  return (
  <group>
    {/* stained glass */}
    {[-WINS.side.x, 0, WINS.side.x].map((x, i) => { const w = i === 1 ? WINS.centre : WINS.side; return <group key={i} position={[x, w.sill, BACK]}><StainedWindow id={`${look.cloth}-${i}${gq}`} w={w.w} h={w.h} look={gl} seed={3 + i} glow={X.glowK} /></group>; })}
    {/* banners between the windows */}
    {[-2.6, 2.6].map((x, i) => <HallBanner key={x} id={`${look.cloth}-${i}`} pos={[x, 5.6, BACK]} w={0.9} h={3.5} look={look} seed={2 + i} sway={X.sway} />)}
    {/* the dais and the throne */}
    <Dais x={throneX} look={look} />
    <Throne pos={[throneX, DAIS_TOP, THRONE_Z]} look={look} />
    {/* the carpet: from the front up the three steps to the throne */}
    <mesh position={[throneX, 0.008, (FRONT + DAIS.front[0]) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[1.9, FRONT - DAIS.front[0]]} /><meshPhongMaterial map={runnerTex(look)} shininess={8} specular="#222" /></mesh>
    {DAIS.front.map((zf, k) => { const top = DAIS.rise * (k + 1), back = k < 2 ? DAIS.front[k + 1] : THRONE_Z; return <group key={k}>
      <B p={[throneX, top - DAIS.rise / 2, zf + 0.012]} s={[1.9, DAIS.rise, 0.02]} c={look.clothDark} />
      <B p={[throneX, top + 0.006, (zf + back) / 2]} s={[1.9, 0.012, zf - back]} c={look.cloth} />
      {[-1, 1].map((s) => <B key={s} p={[throneX + s * 0.86, top + 0.008, (zf + back) / 2]} s={[0.12, 0.012, zf - back + 0.01]} c={look.gold} cast={false} />)}
      {/* brass stair rod across each riser foot */}
      <B p={[throneX, top - DAIS.rise + 0.03, zf + 0.04]} s={[2.0, 0.025, 0.025]} c={look.goldDark} />
    </group>; })}
    {/* columns, torches, armour */}
    {[-7, -10].flatMap((z, j) => [-1, 1].map((s) => <HallColumn key={`${z}${s}`} pos={[s * 2.9, 0, z]} h={9.6} seed={j * 2 + (s > 0 ? 1 : 0) + 1} band={look.gold} />))}
    {[-7, -10].flatMap((z, j) => [-1, 1].map((s) => <WallTorch key={`t${z}${s}`} pos={[s * (2.9 - 0.34), 2.75, z]} rotY={-s * Math.PI / 2} f={f} seed={j * 2 + (s > 0 ? 1 : 0)} lean={X.lean} out={X.lit ? !X.lit.includes(j * 2 + (s > 0 ? 1 : 0)) : false} />))}
    {[-1, 1].map((s) => <ArmourStand key={s} pos={[s * 2.55, 0, -8.0]} side={s as 1 | -1} look={look} scale={0.86} />)}
    {/* two pairs of tall gold candle stands: at the foot of the stair either side of the carpet, and on the dais beside the throne */}
    {[-1, 1].map((s) => <Candelabra key={`ca${s}`} pos={[throneX + s * 1.2, 0, -8.25]} h={1.6} f={f} look={look} seed={s + 2} light={!X.nenTat} tat={X.nenTat} />)}
    {[-1, 1].map((s) => <Candelabra key={`cb${s}`} pos={[throneX + s * 1.75, DAIS_TOP, -9.75]} h={1.5} f={f} look={look} seed={s + 5} light={!X.nenTat} tat={X.nenTat} />)}
    {/* the light of the windows in the air and on the floor */}
    {[-WINS.side.x, 0, WINS.side.x].map((x, i) => { const w = i === 1 ? WINS.centre : WINS.side; return <group key={`b${i}`}>
      <WindowBeam x={x} sill={w.sill} top={w.sill + w.h - 0.3} w={w.w * 0.92} wallZ={BACK - 0.3} dir={X.dir} look={gl} strength={(i === 1 ? 0.07 : 0.09) * X.sunK} f={f} seed={i} />
      <FloorPool id={`${look.cloth}-${i}${gq}`} x={x} sill={w.sill} top={w.sill + w.h - 0.3} w={w.w} wallZ={BACK - 0.3} dir={X.dir} look={gl} strength={0.6 * X.sunK} shadow={i === 1 ? [0.66, 0.76] : undefined} />
    </group>; })}
    {X.tiec ? <BanquetTable pos={HALL_MARKS.banTiec} look={look} f={f} an={X.an ?? undefined} /> : X.banHop ? <BanquetTable pos={HALL_MARKS.banTiec} look={look} f={f} an={X.an ?? (() => undefined)} vai={['#1f5a38', '#2a6c46']} ten="hall-feast-hop" /> : null}
    {X.banHop ? <HopFurniture look={look} giayTrai={X.giayTrai} giayPhai={X.giayPhai} /> : null}
    {X.banHop && X.vanBan ? <group>{/* 24/11/2026: vân gỗ và khăn trải giữa bàn họp (mặc định tắt) */}
      {/* 24/11/2026: các lớp từng cách nhau 1 mm (vân gỗ nhô 1 mm khỏi mặt bàn 0,805), máy nhìn sát mặt bàn thì nhấp nháy (chương 16 cảnh 4). Nay mỗi lớp nằm hẳn trên lớp dưới */}
      {/* bỏ 5 sợi vân gỗ (sâu 1–2 cm): máy nhìn sát mặt bàn thì mỗi sợi mỏng hơn một điểm ảnh, lúc hiện lúc mất (chương 16 cảnh 4). Viền vàng khăn dày 6 cm */}
      <B p={[0, 0.81, HALL_MARKS.banTiec[2]]} s={[3.2, 0.01, 0.56]} c="#1c4a30" cast={false} /><B p={[0, 0.818, HALL_MARKS.banTiec[2] - 0.25]} s={[3.2, 0.006, 0.06]} c="#e2b843" cast={false} /><B p={[0, 0.818, HALL_MARKS.banTiec[2] + 0.25]} s={[3.2, 0.006, 0.06]} c="#e2b843" cast={false} />
    </group> : null}
    {X.coTron ? X.coTron.map((k, i) => <CoTron key={i} pos={CO_TRON[i]} mau={['#6a7a96', '#a0443c', '#c9a04a', '#7d8a84'][i]} nga={k} f={f + i * 7} huong={i < 2 ? -1 : 1} seed={i + 1} />) : null}
    {X.khoi > 0 ? <>
      {[-7, -10].flatMap((z, j) => [-1, 1].map((sd) => { const idx = j * 2 + (sd > 0 ? 1 : 0); return X.lit && !X.lit.includes(idx) ? <SmokeDrift key={`sk${idx}`} f={f + idx * 17} box={[sd * 2.56 - 0.08, sd * 2.56 + 0.08, 2.9, 4.6, z - 0.06, z + 0.06]} n={2} color="#9a9a94" opacity={0.3 * X.khoi} size={0.3} wind={0.02} seed={idx + 3} /> : null; }))}
      {X.nenTat ? [-1, 1].map((sd) => <React.Fragment key={`sn${sd}`}>
        <SmokeDrift f={f + sd * 9} box={[sd * 1.2 - 0.18, sd * 1.2 + 0.18, 1.7, 3.2, -8.3, -8.2]} n={3} color="#9a9a94" opacity={0.28 * X.khoi} size={0.22} wind={0.02} seed={sd + 7} />
        <SmokeDrift f={f + sd * 5} box={[sd * 1.75 - 0.18, sd * 1.75 + 0.18, 2.0, 3.5, -9.8, -9.7]} n={3} color="#9a9a94" opacity={0.28 * X.khoi} size={0.22} wind={0.02} seed={sd + 11} />
      </React.Fragment>) : null}
    </> : null}
    {X.hanhTinh > 0 ? <HanhTinhKinh k={X.hanhTinh} /> : null}
    {X.giaCau ? <GiaDiaCau pos={HALL_MARKS.quaCau} /> : null}
    {X.giayVo ? <PaperScraps /> : null}
    {X.coKeo > 0 ? <>
      <ColumnFlag x={-3.25} z={-9.6} k={X.coKeo} hand={[-2.3, 1.35, -8.3]} look={look} f={f} /><ColumnFlag x={3.25} z={-9.6} k={Math.max(0, X.coKeo - 0.08)} hand={[2.3, 1.35, -8.3]} look={look} f={f + 9} />
    </> : null}
  </group>
  );
};

/** The scene. Figures are children (world units). state = palette; throneX = where the dais and the throne stand (0 = middle);
 *  f = frame (torches, embers, dust in the shaft); dx / dz = slide and push. */
export const SanhNgai: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; state?: HallState; throneX?: number; shaft?: number;
  /** added 23/11/2026 (all default to "as before"): kinhSang 0..1 = the glass turns white-violet and its light grows (ch13 s3); cot 0..1 = the pillar of white light on the throne (ch13 s6); gio -1..1 = a draught bending the torch flames and swaying the banners;
   *  bui = density of drifting dust (0 in the old states, 1 in 'yen-tiec' and 'doom-toi'); giaCau = the stand of the world globe at HALL_MARKS.quaCau; giayVo = paper thrown on the steps (default on in 'doom-toi'); coKeo 0..1 = a pennant hoisted up each back column (ch11 s1);
   *  duoc = which torches burn (indices 0..3: z -7 left, z -7 right, z -10 left, z -10 right), default all, one in 'doom-toi' */
  kinhSang?: number; cot?: number; gio?: number; bui?: number; giaCau?: boolean; giayVo?: boolean; coKeo?: number; duoc?: number[]; banTiecAn?: (c: CanvasRenderingContext2D, W: number, H: number) => void;
  /** 24/11/2026, see the HallState note: banHop, giayTrai, giayPhai, chieu, coTron, doNen, hanhTinhKinh, khoi, nenTat */
  banHop?: boolean; giayTrai?: number; giayPhai?: number; chieu?: number; coTron?: number[]; doNen?: number; hanhTinhKinh?: number; khoi?: number; nenTat?: boolean; vanBan?: boolean}> =
  ({children, f = 0, dx, dz, eye = HALL_VIEWS.c5, state = 'doom', throneX = 0, shaft = 1, kinhSang = 0, cot = 0, gio = 0, bui, giaCau = false, giayVo, coKeo = 0, duoc, banTiecAn, banHop = false, giayTrai = 7, giayPhai = 5, chieu = 0, coTron, doNen = 0, hanhTinhKinh = 0, khoi = 0, nenTat = false, vanBan = false}) => { datNoiBui('trong-nha', 'vang-nen');
    const tiec = state === 'yen-tiec', toi = state === 'doom-toi', ngay = state === 'doom-ngay', ch = Math.max(0, Math.min(1, chieu)), sunY = 13 - 6.5 * ch;
    const look = HALL[state === 'doom' || tiec || toi || ngay ? 'doom' : 'namTuoc'];
    const sh = toi ? 0 : tiec || ngay ? shaft * 0.3 : shaft, glassQ = Math.round(Math.max(0, Math.min(1, kinhSang)) * 6), ks = glassQ / 6;
    const sunK = (tiec ? 3.2 : ngay ? 3.0 : toi ? 0.35 : 1) * (1 + ks * 1.2), glowK = (tiec || ngay ? 1.3 : 1) * (1 + ks * 0.35), dust = bui ?? (tiec || toi || ngay ? 1 : 0);
    const x: Extra = {an: banTiecAn ?? null, sunK, glowK, glassQ, lean: -gio * 0.5, sway: gio * 0.05, lit: duoc ?? (toi ? [3] : ngay ? [] : null), tiec, giaCau, giayVo: giayVo ?? toi, coKeo,
      dir: ngay ? (() => { const v = new THREE.Vector3(-1.5, -sunY, 16.25).normalize(); return [v.x, v.y, v.z] as V3; })() : MOON_DIR, banHop, giayTrai, giayPhai, coTron: coTron ?? null, khoi, nenTat, hanhTinh: hanhTinhKinh, vanBan};
    return (
      <GradeCtx.Provider value={tiec || ngay ? 'brightInterior' : 'darkInterior'}>
        <StageCam eye={eye} haze={tiec || ngay ? '#9aa8a2' : '#0a0c10'} fog={[40, 900]} dx={dx} dz={dz} />
        {/* the fill: cool green-grey and strong (brightness pass 23/11/2026: the hall was Y 56-67, the reference's night rooms 69-76 and its throne hall 75; we aim at 88-105) */}
        <hemisphereLight args={ngay ? [mixHex('#fff2dc', '#ffd9a8', ch), '#a29c88', 3.0 - 0.4 * ch] : tiec ? ['#fff2dc', '#a29c88', 3.0] : toi ? ['#9cc0b2', '#4c5e56', 1.55] : ['#9cc0b2', '#4c5e56', 1.9]} />
        {/* the moon through the stained glass, high behind, nearly along the hall: the centre window lands on the carpet with the throne's shadow in it */}
        <Sun nguocSang from={[1.5, ngay ? sunY : 13, -28.25]} to={[0, 0, -12]} intensity={ngay ? 7.5 - 1.2 * ch : tiec ? 7.5 : toi ? 2.4 : 5.0 * (1 + ks * 0.5)} color={ngay ? mixHex('#ffe6b4', '#ffa858', ch) : tiec ? '#ffe6b4' : ks > 0 ? glassBlend(look, ks).light : look.light} />
        {/* a pale shaft from high above onto the throne */}
        <spotLight position={[throneX, 7.6, -8.4]} color="#f0e4c6" intensity={70 * sh} distance={14} angle={0.2} penumbra={0.7} decay={2} castShadow={false}
          ref={(l) => { if (l) { l.target.position.set(throneX, 0.8, THRONE_Z - 0.4); l.target.updateMatrixWorld(); } }} />
        {sh > 0 ? <LightShaft top={[throneX, 7.4, -9.0]} bottom={[throneX, DAIS_TOP + 0.1, THRONE_Z - 0.2]} r={1.0} strength={0.1 * sh} f={f} /> : null}
        <Shell look={look} />
        <Dressing f={f} look={look} throneX={throneX} x={tiec || toi || ngay || ks > 0 || gio !== 0 || giaCau || giayVo !== undefined || coKeo > 0 || duoc || banHop || coTron || khoi > 0 || nenTat || hanhTinhKinh > 0 ? x : undefined} />
        {tiec || ngay ? <pointLight position={[0, 3.2, -4.8]} color={ngay ? mixHex('#fff0d0', '#ffc888', ch) : '#fff0d0'} intensity={9} distance={12} decay={1.3} /> : null}
        {doNen > 0 ? <pointLight position={[throneX, 0.35, THRONE_Z + 1.3]} color="#ff5a2a" intensity={14 * doNen} distance={5} decay={1.3} /> : null}
        {cot > 0 ? <LightColumn x={throneX} z={THRONE_Z + 0.15} y0={DAIS_TOP} k={cot} f={f} /> : null}
        {dust > 0 ? <DriftSpecks f={f} box={[-5.5, 5.5, 0.4, 5.6, -11.2, Math.max(-10, Math.min(-1.5, eye[2] - 1.5))]} n={Math.round(54 * dust)} color={tiec || ngay ? '#ffe9b0' : '#e6f0e6'} size={0.012} wind={[0.04, 0.03]} glow={0.22} seed={5} /> : null}
        {children}
      </GradeCtx.Provider>
    );
  };
// ---------------------------------------------------------------- the hall alone (kho chung, 23/11/2026): the shot-5 view, no people
const HallEmpty: React.FC<{state?: HallState}> = ({state}) => {
  const {width, height} = useVideoConfig();
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><SanhNgai eye={HALL_VIEWS.c5} state={state} /></ThreeCanvas></Finish></AbsoluteFill>;
};
// ---------------------------------------------------------------- stills of the states and views added 23/11/2026 (no people)
const mkNew = (view: keyof typeof HALL_VIEWS, p: Partial<React.ComponentProps<typeof SanhNgai>> = {}, frame = 10): React.FC => () => {
  const {width, height} = useVideoConfig(), eye = HALL_VIEWS[view];
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><SanhNgai eye={eye} f={frame} {...p} /></ThreeCanvas></Finish></AbsoluteFill>;
};
const NEW_STILLS: [string, React.FC][] = [
  ['sanh-ngai-ngay-xa', mkNew('xa', {state: 'doom-ngay'})], ['sanh-ngai-ngay-c5', mkNew('c5', {state: 'doom-ngay'})], ['sanh-ngai-ngay-hop', mkNew('hop4', {state: 'doom-ngay', banHop: true, chieu: 0.7})], ['sanh-ngai-ngay-hop-xa', mkNew('xa', {state: 'doom-ngay', banHop: true, chieu: 0.3})],
  ['sanh-ngai-ngay-co', mkNew('bat', {state: 'doom-ngay', coTron: [0, 0.3, 0.7, 1]})], ['sanh-ngai-hanh-tinh', mkNew('c5', {hanhTinhKinh: 0.8, duoc: [0, 3], nenTat: true, khoi: 1, shaft: 0.3})], ['sanh-ngai-do-nen', mkNew('vua', {doNen: 0.8})],
  ['sanh-ngai-tiec-c5', mkNew('c5', {state: 'yen-tiec'})], ['sanh-ngai-tiec-gan', mkNew('tiec', {state: 'yen-tiec'})], ['sanh-ngai-toi-c5', mkNew('c5', {state: 'doom-toi'})], ['sanh-ngai-toi-lui', mkNew('toi', {state: 'doom-toi'})],
  ['sanh-ngai-cau-xa', mkNew('xa', {giaCau: true, coKeo: 0.5, bui: 1})], ['sanh-ngai-kinh-sang', mkNew('c5', {kinhSang: 0.85, gio: 1, bui: 1})], ['sanh-ngai-cot-sang', mkNew('bat', {cot: 0.9, bui: 1})], ['sanh-ngai-bui', mkNew('c6', {bui: 1})],
];
export const SanhNgaiComps: React.FC = () => (
  <>
    <Composition id="sanh-ngai-trong" component={HallEmpty} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="sanh-ngai-nam-tuoc-trong" component={() => <HallEmpty state="nam-tuoc" />} width={1280} height={720} fps={24} durationInFrames={1} />
    {NEW_STILLS.map(([id, C]) => <Composition key={id} id={id} component={C} width={1280} height={720} fps={24} durationInFrames={1} />)}
  </>
);
