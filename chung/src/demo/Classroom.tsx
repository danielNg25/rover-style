import React, {useMemo} from 'react';
import {AbsoluteFill, Composition, useVideoConfig, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {GradeCtx, Finish, Ground, FacetLathe} from '../lib3/look';
import {Scatter, Paper, Sign, useSurface} from '../lib3/detail';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import {withPose} from '../mould/gestures';
import type {Spec} from '../mould/draw';
import {Plate, Sprite, VIEW, rnd, P, Ctx, paintCloud, paintSchoolBlock, paintAlmondTree, paintSchoolbag, paintPotPlant, paintBouquet, paintBroom, paintTree} from '../lib3/depth';
import {B, StageCam} from '../lib3/kit';
import {RoomCtx, Spr, Sun, WindowWall, Cabinet, TeacherDesk, Desk, CeilingFan, canvasTex, once, bookTex} from '../lib3/room';
import {LectureWindowWall, PictureRail, Blackboard, ChalkWriting, LectureDesk, PendantLamp, WallMap, paintDeskGlobe, paintCollegeFront, paintWindowMaples, wainscotPaint, OAK, PLASTER} from '../lib3/kitGiangDuong';

/** TRANSFER TEST: a primary-school classroom on a November morning, built from CACH-DUNG-CANH-XEP-LOP.md alone (no frame of the
 *  reference film looked at). The outdoor layer stack is carried indoors like this:
 *    outside, seen through the open windows: sky, far roofs and trees, the school block across the yard, the yard's almond tree;
 *    the room shell (window wall, front wall, ceiling) as solid boxes that cast the real sun patches;
 *    the set: blackboard, banner, notice board, cabinet, the platform and the teacher's desk;
 *    the rows of desks and benches, then small things on them; a painted near layer in the lower corners.
 *  The camera stands at the back of the room looking at the front-left corner (the room is turned, not the camera, so the
 *  painted plates still face the lens). The open floor in front of the platform, reached by the aisle, is left for figures. */
type V3 = [number, number, number];
const HAZE = '#e6e2d4', EYE: V3 = [0, 1.5, 0];
const YAW = -0.46, CAM: [number, number] = [6.6, 9.4];   // camera position in room units (x along the front wall, z out from it)
const RW = 8.6, RL = 10.4, RH = 3.6;                      // room width, length, height
const WINS: [number, number][] = [[0.8, 2.5], [3.5, 5.2], [6.2, 7.9]];   // window openings on the left wall (z ranges)
const SILL = 0.8, HEAD = 2.8;

// ---------------------------------------------------------------- outside, through the windows (screen units 1600 x 900)
const sky = (c: Ctx) => {
  const g = c.createLinearGradient(0, -100, 0, 470); g.addColorStop(0, '#9cc6e2'); g.addColorStop(1, '#f4ead2'); c.fillStyle = g; c.fillRect(-300, -200, 2200, 1300);
  paintCloud(c, 60, 120, 0.8, {light: '#fbf7ee', dark: '#e9e4d8'}); paintCloud(c, 330, 250, 0.55, {light: '#fbf6ea', dark: '#ebe3d2'}); paintCloud(c, -260, 300, 0.7, {light: '#fbf6ea', dark: '#ebe3d2'});
  [[300, 262], [326, 252], [350, 266]].forEach(([x, y]) => P(c, [[x - 9, y - 3], [x, y + 2], [x + 9, y - 4], [x, y - 1]], '#6f7480'));
};
const farTown = (c: Ctx) => {
  // roofs and trees of the town beyond the school wall, cool and pale
  const r = rnd(5);
  for (let x = -320; x < 1000; x += 40 + r() * 50) { const h = 30 + r() * 70, w = 50 + r() * 60; c.fillStyle = r() < 0.5 ? '#b8c3c8' : '#aab7bf'; c.fillRect(x, 470 - h, w, h + 40); c.fillStyle = '#9fabb4'; c.fillRect(x + w * 0.7, 470 - h, w * 0.3, h + 40); }
  for (let x = -320; x < 1020; x += 22 + r() * 18) { c.beginPath(); c.arc(x, 462 - r() * 14, 16 + r() * 18, 0, 7); c.fillStyle = r() < 0.5 ? '#94ad9e' : '#86a092'; c.fill(); }
  c.fillStyle = '#a9b6bc'; c.fillRect(396, 300, 8, 170); c.fillStyle = '#c2584c'; P(c, [[404, 300], [452, 312], [404, 326]], '#c2584c');   // the school flag
};
const schoolAcross = (c: Ctx) => {
  paintSchoolBlock(c, -200, 540, 860, 160, {wall: '#e8cf86', shade: '#cdb571', roof: '#b4583e', roofShade: '#97492f', mark: '#8a7a5c', rail: '#6f8a7e'});
  c.fillStyle = '#cfc4ad'; c.fillRect(-320, 538, 1500, 400); c.fillStyle = '#c2b69e'; for (let y = 560; y < 900; y += 26) c.fillRect(-320, y, 1500, 3);   // the yard
  c.fillStyle = '#b8b0a0'; c.fillRect(-320, 532, 1500, 10);
};
const yardTree = (c: Ctx) => {
  c.save(); c.translate(236, 300); paintAlmondTree(c, 230, 300, 3); c.restore();
  c.save(); c.translate(110, 420); paintTree(c, 150, 180, ['#5d8f55', '#6c9e60', '#82b06c']); c.restore();
  c.fillStyle = '#a59a86'; c.fillRect(-300, 620, 1500, 14);   // the low wall round the tree beds
};
// near layer: the top of a schoolbag lower left (the nearest desk of the right column is the near layer on the right)
const foreground = (c: Ctx) => {
  c.beginPath(); c.roundRect(-140, 790, 330, 260, 70); c.fillStyle = '#3f7f86'; c.fill(); c.beginPath(); c.roundRect(-140, 790, 330, 90, [70, 70, 20, 20]); c.fillStyle = '#2f646a'; c.fill(); c.fillStyle = '#e8c25a'; c.fillRect(10, 862, 46, 30);
  c.strokeStyle = '#285559'; c.lineWidth = 18; c.beginPath(); c.arc(30, 790, 70, Math.PI * 1.05, Math.PI * 1.9); c.stroke();
};

// ---------------------------------------------------------------- painted surfaces
/** Plastered wall, distemper yellow above a green dado (sill height), stains from the top, scuffs along the dado, tape marks. */
const wallPaint = (W: number, H: number, ppm: number, seed: number) => (c: Ctx) => {
  const r = rnd(seed), dado = H - 0.9 * ppm;
  c.fillStyle = '#f2e3b6'; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 40; k++) { const x = r() * W, y = r() * dado, q = 60 + r() * 160, g = c.createRadialGradient(x, y, 0, x, y, q); g.addColorStop(0, r() < 0.5 ? 'rgba(255,250,235,0.22)' : 'rgba(150,120,70,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - q, y - q, q * 2, q * 2); }
  for (let k = 0; k < 9; k++) { const x = r() * W, w = 10 + r() * 30, h = 60 + r() * 200, g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(120,96,60,0.22)'); g.addColorStop(1, 'rgba(120,96,60,0)'); c.fillStyle = g; c.fillRect(x, 0, w, h); }
  c.fillStyle = 'rgba(110,90,60,0.25)'; c.fillRect(0, 0, W, 6);
  c.fillStyle = '#93bba6'; c.fillRect(0, dado, W, H - dado); c.fillStyle = '#6b9482'; c.fillRect(0, dado - 8, W, 10);
  for (let k = 0; k < 30; k++) { c.fillStyle = `rgba(60,70,60,${0.1 + r() * 0.18})`; c.fillRect(r() * W, dado + 10 + r() * (H - dado - 20), 8 + r() * 40, 3 + r() * 5); }
  for (let k = 0; k < 6; k++) { c.fillStyle = 'rgba(255,248,226,0.5)'; c.fillRect(r() * W, 80 + r() * (dado - 200), 24, 9); }
  c.strokeStyle = 'rgba(90,70,50,0.45)'; c.lineWidth = 2; c.beginPath(); let x = W * 0.08, y = H * 0.12; c.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.4) * 30; y += 14 + r() * 20; c.lineTo(x, y); } c.stroke();
};
const frontWallTex = once(() => canvasTex(2048, 784, wallPaint(2048, 784, 2048 / 9.4, 3)));
const boardTex = once(() => canvasTex(1632, 624, (c) => {
  const W = 1632, H = 624, r = rnd(13);
  c.fillStyle = '#2f4d42'; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 26; k++) { c.strokeStyle = `rgba(230,236,226,${0.03 + r() * 0.05})`; c.lineWidth = 30 + r() * 50; c.beginPath(); const x = r() * W, y = r() * H; c.arc(x, y, 60 + r() * 120, r() * 6, r() * 6 + 2.5); c.stroke(); }
  c.fillStyle = 'rgba(240,240,230,0.9)'; c.fillRect(W * 0.62, 30, 4, H - 60);
  const chalk = (t: string, x: number, y: number, s: number, col = 'rgba(244,244,236,0.92)', align: CanvasTextAlign = 'left') => { c.font = `${s}px "Chalkboard SE", "Comic Sans MS", "Marker Felt", cursive`; c.fillStyle = col; c.textAlign = align; c.fillText(t, x, y); };
  chalk('Thứ Bảy, ngày 21 tháng 11 năm 2026', 40, 70, 40);
  chalk('Tập đọc', W * 0.31, 170, 72, 'rgba(244,244,236,0.95)', 'center'); c.fillStyle = 'rgba(244,244,236,0.8)'; c.fillRect(W * 0.2, 186, W * 0.22, 4);
  chalk('Người thầy cũ', W * 0.31, 260, 56, 'rgba(250,226,140,0.95)', 'center');
  [330, 390, 450, 510].forEach((y, i) => { c.fillStyle = 'rgba(236,238,230,0.55)'; c.fillRect(60, y, 360 + ((i * 137) % 300), 6); c.fillRect(500 + ((i * 59) % 80), y, 180 + ((i * 89) % 160), 6); });
  chalk('20-11', W * 0.81, 180, 120, 'rgba(246,170,190,0.95)', 'center');
  chalk('Chúc mừng Ngày Nhà giáo', W * 0.81, 260, 40, 'rgba(250,230,150,0.92)', 'center');
  // a chalk flower under the greeting
  const fx = W * 0.81, fy = 420; for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; c.beginPath(); c.ellipse(fx + Math.cos(a) * 34, fy + Math.sin(a) * 34, 30, 16, a, 0, 7); c.strokeStyle = 'rgba(246,170,190,0.9)'; c.lineWidth = 6; c.stroke(); }
  c.beginPath(); c.arc(fx, fy, 14, 0, 7); c.fillStyle = 'rgba(250,230,150,0.95)'; c.fill(); c.strokeStyle = 'rgba(170,220,160,0.9)'; c.lineWidth = 6; c.beginPath(); c.moveTo(fx, fy + 50); c.quadraticCurveTo(fx + 10, fy + 120, fx - 6, H - 30); c.stroke();
}));
const shutterTex = once(() => canvasTex(160, 384, (c) => {
  c.fillStyle = '#4f7d6c'; c.fillRect(0, 0, 160, 384); c.fillStyle = '#3c6556'; c.fillRect(14, 14, 132, 356);
  for (let y = 22; y < 362; y += 16) { c.fillStyle = '#6a9886'; c.fillRect(16, y, 128, 8); c.fillStyle = '#2f5245'; c.fillRect(16, y + 8, 128, 3); }
  c.fillStyle = 'rgba(240,236,220,0.35)'; c.fillRect(40, 120, 30, 50);   // a patch where the paint has flaked
}));
const clockTex = once(() => canvasTex(256, 256, (c) => {
  c.beginPath(); c.arc(128, 128, 124, 0, 7); c.fillStyle = '#3e4a5a'; c.fill(); c.beginPath(); c.arc(128, 128, 108, 0, 7); c.fillStyle = '#f6f2e6'; c.fill();
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.save(); c.translate(128, 128); c.rotate(a); c.fillStyle = '#3e4a5a'; c.fillRect(-4, -100, 8, k % 3 ? 12 : 22); c.restore(); }
  c.strokeStyle = '#2a2a30'; c.lineCap = 'round'; c.lineWidth = 9; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + 50 * Math.cos(-2.4), 128 + 50 * Math.sin(-2.4)); c.stroke();   // ten past seven
  c.lineWidth = 6; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + 84 * Math.cos(-0.52), 128 + 84 * Math.sin(-0.52)); c.stroke(); c.beginPath(); c.arc(128, 128, 8, 0, 7); c.fillStyle = '#c8443a'; c.fill();
}));
const pictureTex = once(() => canvasTex(320, 240, (c) => {
  c.fillStyle = '#a9cbe0'; c.fillRect(0, 0, 320, 240); P(c, [[0, 150], [80, 70], [150, 140], [220, 60], [320, 150], [320, 240], [0, 240]], '#88a8bd');
  c.fillStyle = '#7fae6a'; c.fillRect(0, 160, 320, 80); c.fillStyle = '#6a9a58'; for (let x = 0; x < 320; x += 30) c.fillRect(x, 160, 14, 80);
  c.beginPath(); c.arc(250, 50, 20, 0, 7); c.fillStyle = '#f6e08a'; c.fill();
}));

// ---------------------------------------------------------------- built pieces (boxes), in room units
const WALL = '#eedfae', DADO = '#93bba6';


const FrontWall: React.FC = () => (
  <group>
    <B p={[4.3, RH / 2, -0.15]} s={[9.4, RH, 0.3]} c={WALL} cast={false} />
    <mesh position={[4.3, RH / 2, 0.002]} receiveShadow><planeGeometry args={[9.4, RH]} /><meshLambertMaterial map={frontWallTex()} /></mesh>
    {/* blackboard: frame, board, chalk tray with chalk and a duster */}
    <B p={[3.65, 1.6, 0.03]} s={[3.56, 1.46, 0.06]} c="#7a5a3c" /><mesh position={[3.65, 1.6, 0.065]} receiveShadow><planeGeometry args={[3.4, 1.3]} /><meshLambertMaterial map={boardTex()} /></mesh>
    <B p={[3.65, 0.87, 0.1]} s={[3.5, 0.04, 0.14]} c="#8a6a48" />{[[2.6, '#f4f2ea'], [2.7, '#f4b4c4'], [2.76, '#f4f2ea'], [4.9, '#f2e08a']].map(([x, col]) => <B key={x as number} p={[x as number, 0.905, 0.1]} s={[0.08, 0.02, 0.02]} c={col as string} cast={false} />)}
    <B p={[4.4, 0.92, 0.1]} s={[0.2, 0.05, 0.08]} c="#4a3a2e" /><B p={[4.4, 0.9, 0.1]} s={[0.21, 0.02, 0.09]} c="#c9c0ae" cast={false} />
    {/* the motto over the board, the clock, a picture, the tube lamps */}
    <Sign text="Tiên học lễ - Hậu học văn" x={3.65} y={2.78} w={3.0} h={0.38} board="#a8342a" ink="#f0cf5a" z={0.05} />
    <group position={[5.85, 2.78, 0.03]}><mesh><circleGeometry args={[0.2, 24]} /><meshLambertMaterial map={clockTex()} transparent /></mesh></group>
    {[1.7, 5.6].map((x) => <group key={x} position={[x, 3.3, 0.08]}><B p={[0, 0, 0]} s={[1.24, 0.08, 0.1]} c="#d8d8d2" /><B p={[0, -0.05, 0.02]} s={[1.18, 0.05, 0.05]} c="#fbfbf6" cast={false} /></group>)}
    <B p={[1.0, 2.78, 0.03]} s={[0.7, 0.54, 0.04]} c="#6a4c34" /><mesh position={[1.0, 2.78, 0.052]}><planeGeometry args={[0.6, 0.44]} /><meshLambertMaterial map={pictureTex()} /></mesh>
    {/* the class notice board, left of the board */}
    <group position={[1.0, 0, 0.02]}>
      <B p={[0, 1.75, 0.02]} s={[1.34, 1.04, 0.04]} c="#7a5a3c" /><B p={[0, 1.75, 0.045]} s={[1.24, 0.94, 0.02]} c="#b98a5a" cast={false} />
      <Sign text="Bảng tin lớp 3A" x={0} y={2.13} w={0.9} h={0.15} board="#3f6a8a" ink="#f2ead0" z={0.065} />
      <group position={[0, 0, 0.06]}><Paper x={-0.32} y={1.78} w={0.42} h={0.5} rot={-3} accent="#5a8f5a" seed={2} /><Paper x={0.18} y={1.82} w={0.46} h={0.36} rot={2} tone="#f6efd8" accent="#c8463c" seed={3} /><Paper x={0.32} y={1.46} w={0.32} h={0.26} rot={6} tone="#f9d9a0" accent="#d9785a" seed={5} /><Paper x={-0.2} y={1.43} w={0.3} h={0.22} rot={-6} tone="#d8e8f0" accent="#3f6a8a" seed={6} /></group>
    </group>
  </group>
);


const Platform: React.FC = () => {
  const plank = useSurface('plank', 5); const m = useMemo(() => { const t = plank.clone(); t.needsUpdate = true; t.repeat.set(6.6 / 1.6, 1.7 / 1.6); return t; }, [plank]);
  return (
    <group>
      <mesh position={[3.6, 0.11, 0.85]} castShadow receiveShadow><boxGeometry args={[6.6, 0.22, 1.7]} /><meshLambertMaterial color="#a8805a" map={m} /></mesh>
      <B p={[3.6, 0.215, 1.7]} s={[6.62, 0.03, 0.05]} c="#7a5a3c" cast={false} /><B p={[3.6, 0.1, 1.71]} s={[6.62, 0.2, 0.02]} c="#8a6644" cast={false} />
      {/* a step of scuffs where everyone climbs up */}
      <mesh position={[3.4, 0.2215, 1.45]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.2, 0.5]} /><meshBasicMaterial color="#5a4030" transparent opacity={0.12} depthWrite={false} /></mesh>
    </group>
  );
};




const TEACHER: Spec = withPose({outfit: 'vest', hair: 'level', build: 'adult', longLegs: true, expr: {...EXPR.smile, gaze: [-14, 4]}, palette: {hair: '#2a2420', hairLine: '#4a3f38', brow: '#2a2420', vest: '#3f5a7a', shirt: '#f4f1e8', shirtEdge: '#d8d2c4', shirtRim: '#fbf9f2', shorts: '#3a3f4a', shoe: '#2a2428'}}, 'point');
const PUPIL: Spec = withPose({outfit: 'vest', hair: 'sweep', build: 'child', expr: {...EXPR.happy, gaze: [16, -12]}, palette: {vest: '#f4f1e8', shirt: '#f4f1e8', shirtEdge: '#d8d2c4', shirtRim: '#fbf9f2', shorts: '#2f3f66', shoe: '#2a2428', button: '#c9c2b0'}}, 'chest');
const Room: React.FC = () => {
  const tiles = useSurface('slabs', 4);
  return (
    <RoomCtx.Provider value={YAW}><group rotation={[0, YAW, 0]}><group position={[-CAM[0], 0, -CAM[1]]}>
      <Sun from={[-19.8, 11.2, 19.0]} to={[3, 0, 3]} intensity={5.0} color="#ffe0ae" />
      {/* the teacher at the board and a pupil called up, on the platform: the place the room was composed around */}
      <Puppet3 height={1.7} pos={[3.95, 0.22, 1.05]} rotY={-YAW} spec={TEACHER} /><Puppet3 height={1.15} pos={[2.75, 0.22, 1.25]} rotY={-YAW} spec={PUPIL} />
      <Ground near="#d9c8a6" far="#cbbb9a" size={[RW, RL]} pos={[RW / 2, 0, RL / 2]} swell={0} patch={0.05} farAt={0.9} map={tiles} tile={0.9} />
      <WindowWall length={RL} height={RH} sill={SILL} head={HEAD} windows={WINS} wall={WALL} dado={DADO}>
        <Spr name="sillpot" art={(c, W, H) => paintPotPlant(c, W, H, 4)} px={[200, 240]} w={0.4} pos={[0.12, SILL + 0.01, 1.95]} shade={0.2} />
        {/* between the first two windows: the class timetable and a calendar */}
      <group position={[0.02, 0, 3.0]} rotation={[0, Math.PI / 2, 0]}><Paper x={-0.1} y={1.75} w={0.62} h={0.8} rot={2} tone="#f2ecd8" accent="#3f6a8a" seed={4} /><Paper x={0.32} y={1.25} w={0.3} h={0.4} rot={-4} tone="#efe6cf" accent="#c8463c" seed={7} /></group>
      </WindowWall><FrontWall />
      <B p={[RW / 2 + 0.5, RH + 0.1, RL / 2]} s={[RW + 1.4, 0.2, RL + 0.6]} c="#f4ead2" />{[3.0, 6.6].map((z) => <B key={z} p={[RW / 2, RH - 0.12, z]} s={[RW + 0.4, 0.24, 0.26]} c="#e4ddcb" />)}
      <B p={[RW + 0.15, RH / 2, RL / 2]} s={[0.3, RH, RL]} c={WALL} /><B p={[RW / 2, RH / 2, RL + 0.15]} s={[RW + 0.6, RH, 0.3]} c={WALL} />
      <Platform /><Cabinet pos={[6.45, 0, 0.26]} /><TeacherDesk pos={[1.75, 0.22, 0.85]} />
      <CeilingFan pos={[2.2, RH, 2.9]} turn={0.3} /><CeilingFan pos={[5.6, RH, 2.9]} turn={0.9} /><CeilingFan pos={[2.2, RH, 7.4]} /><CeilingFan pos={[5.6, RH, 7.4]} turn={0.5} />
      {/* three columns of desks, five rows, aisles at x 3.0 and 5.65; the front row stands back from the platform */}
      {[1.25, 4.95, 7.35].map((x, ci) => [4.5, 5.7, 6.9, 8.1].map((z, ri) => (ci === 1 && ri === 0 ? null : <Desk key={`${ci}${ri}`} pos={[x, 0, z]} seed={ci * 7 + ri * 3 + 1} wood={ri % 2 ? '#b0865a' : '#a87e54'} />)))}
      {/* the corner by the windows: broom, bin, a water jar on a stool */}
      <Spr name="broom" art={paintBroom} px={[120, 520]} w={0.3} pos={[0.18, 0, 0.3]} shade={0.2} />
      <FacetLathe profile={[[0.16, 0], [0.19, 0.36], [0.2, 0.4], [0.18, 0.4]]} sides={10} color="#4f8a6a" pos={[0.3, 0, 2.2]} tones={[0.86, 1.1, 1]} />
      <B p={[7.9, 0.22, 1.9]} s={[0.4, 0.44, 0.4]} c="#8a6644" /><FacetLathe profile={[[0.12, 0], [0.18, 0.12], [0.18, 0.3], [0.12, 0.38], [0.04, 0.42], [0.01, 0.42]]} sides={10} color="#dfe3e6" pos={[7.9, 0.44, 1.9]} contact={false} tones={[0.9, 1, 1.12, 1, 0.8]} />
      <Spr name="floorpot" art={(c, W, H) => paintPotPlant(c, W, H, 2)} px={[220, 260]} w={0.7} pos={[0.45, 0, 5.6]} shade={0.3} />
      {/* traces: a paper plane in the aisle, a red scarf left on a bench, scuffs and scraps on the floor */}
      <group position={[3.2, 0.02, 5.2]} rotation={[0, 0.7, 0]}><mesh rotation={[-Math.PI / 2 + 0.25, 0, 0]}><shapeGeometry args={[new THREE.Shape([new THREE.Vector2(0, 0.22), new THREE.Vector2(0.09, -0.08), new THREE.Vector2(0, -0.02), new THREE.Vector2(-0.09, -0.08)])]} /><meshLambertMaterial color="#f6f2e6" side={THREE.DoubleSide} /></mesh></group>
      <mesh position={[4.2, 0.445, 5.42]} rotation={[-Math.PI / 2, 0, 0.4]}><shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-0.3, 0), new THREE.Vector2(0.3, 0.02), new THREE.Vector2(0.05, 0.14)])]} /><meshLambertMaterial color="#d23a30" side={THREE.DoubleSide} /></mesh>
      <Scatter kind="floor" area={[8, 8]} pos={[RW / 2, 0, 6]} seed={8} density={1.6} keep={[[3.2, 2.8, 1.5]]} />
    </group></group></RoomCtx.Provider>
  );
};

const Classroom: React.FC = () => (
  <GradeCtx.Provider value="brightInterior">
    {/* the light story of a morning room: a cool, soft fill from the sky in the windows; ONE warm low sun that only gets in
        through the openings (the room's own walls and ceiling cast the rest of the room into shade) */}
    <hemisphereLight args={['#eef2f8', '#dccfb2', 1.95]} />
    <StageCam eye={EYE} haze={HAZE} fog={[14, 320]} />
    <Plate from={EYE} id="c-sky" d={520} paint={sky} fog={false} /><Plate from={EYE} id="c-town" d={160} paint={farTown} /><Plate from={EYE} id="c-school" d={48} paint={schoolAcross} /><Plate from={EYE} id="c-tree" d={22} paint={yardTree} />
    <Room />
  </GradeCtx.Provider>
);
const ClassroomStill: React.FC = () => { const {width, height} = useVideoConfig(); return <AbsoluteFill><Finish><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><Classroom /></ThreeCanvas></Finish></AbsoluteFill>; };

// ================================================================ STATE `dai-hoc`: an American lecture room of the early 1900s (d1c5 shot 15; 23/11/2026)
// Same shell, same openings, same camera as the classroom above (which is left exactly as it was): oak wainscot and cream
// plaster, tall wooden sashes looking out on a red-brick college with a clock tower and maples, a big slate blackboard with
// chalk that writes itself (ChalkWriting), the lecturer's desk at the RIGHT end of the platform with a small globe, a
// bookcase, a pull-down map, green pendant lamps (off), long dark oak desks. No fans, no banner, no Vietnamese things.
// People are children in ROOM units (x along the front wall, z out from it; on the platform y = 0.22), turned with
// rotY={-LOP.yaw}. Shot positions: LOP.eye(room point) gives the world eye for <Shot>.
export const LOP = {yaw: YAW, cam: CAM, w: RW, l: RL, h: RH, platformY: 0.22, platformFront: 1.7,
  /** the world eye for a camera standing at a room point (the lens still looks along world -z) */
  eye: (p: V3): V3 => { const x = p[0] - CAM[0], z = p[2] - CAM[1], c = Math.cos(YAW), s = Math.sin(YAW); return [x * c + z * s, p[1], -x * s + z * c]; }};
export const DH_BOARD = {x: 3.4, y0: 1.0, w: 4.2, h: 1.5};
const dhFrontTex = once(() => canvasTex(2048, 784, wainscotPaint(2048, 784, 2048 / 9.4, 1.0, 5)));
const DH_WALL = PLASTER;
const DaiHocRoom: React.FC<{f: number; bangSach?: boolean; children?: React.ReactNode}> = ({f, bangSach, children}) => {
  const plank = useSurface('plank', 6);
  return (
    <RoomCtx.Provider value={YAW}><group rotation={[0, YAW, 0]}><group position={[-CAM[0], 0, -CAM[1]]}>
      <Sun from={[-19.8, 11.2, 19.0]} to={[3, 0, 3]} intensity={5.0} color="#ffe0ae" />
      <Ground near="#a8845c" far="#9a7a54" size={[RW, RL]} pos={[RW / 2, 0, RL / 2]} swell={0} patch={0.05} farAt={0.9} map={plank} tile={1.2} />
      <LectureWindowWall length={RL} height={RH} sill={SILL} head={HEAD} windows={WINS} />
      {/* the front wall: plaster over oak wainscot, the board, the clock, the map, the bookcase */}
      <B p={[4.3, RH / 2, -0.15]} s={[9.4, RH, 0.3]} c={DH_WALL} cast={false} />
      <mesh position={[4.3, RH / 2, 0.002]} receiveShadow><planeGeometry args={[9.4, RH]} /><meshLambertMaterial map={dhFrontTex()} /></mesh>
      <Blackboard {...DH_BOARD} sach={bangSach} /><ChalkWriting f={f} />
      <group position={[DH_BOARD.x, 2.88, 0.03]}><mesh><circleGeometry args={[0.2, 24]} /><meshLambertMaterial map={clockTex()} transparent /></mesh></group>
      <WallMap x={0.72} y={1.85} w={0.72} h={0.95} />
      <Cabinet pos={[6.45, 0, 0.26]} />
      {/* ceiling, beams, the far walls with wainscot */}
      <B p={[RW / 2 + 0.5, RH + 0.1, RL / 2]} s={[RW + 1.4, 0.2, RL + 0.6]} c="#f2ead6" />{[3.0, 6.6].map((z) => <B key={z} p={[RW / 2, RH - 0.12, z]} s={[RW + 0.4, 0.24, 0.26]} c="#e2d8c2" />)}
      <B p={[RW + 0.15, RH / 2, RL / 2]} s={[0.3, RH, RL]} c={DH_WALL} /><B p={[RW / 2, RH / 2, RL + 0.15]} s={[RW + 0.6, RH, 0.3]} c={DH_WALL} />
      <B p={[RW - 0.01, 0.5, RL / 2]} s={[0.04, 1.0, RL]} c={OAK} /><B p={[RW / 2, 0.5, RL - 0.01]} s={[RW, 1.0, 0.04]} c={OAK} />
      <Platform />
      <TeacherDesk pos={[5.4, 0.22, 0.85]} />
      <Spr name="dh-globe" art={paintDeskGlobe} px={[200, 280]} w={0.28} pos={[4.95, 0.22 + 0.785, 0.8]} shade={0.2} />
      <PictureRail y={2.66} x0={0.3} x1={8.5} /><PictureRail y={3.42} x0={1.2} x1={5.6} portraits={[[1.95, 0.4, 0.5], [4.85, 0.4, 0.5]]} />
      {[[2.2, 2.9], [5.6, 2.9], [2.2, 7.4], [5.6, 7.4]].map(([x, z]) => <PendantLamp key={`${x}${z}`} pos={[x, RH, z]} drop={0.9} />)}
      {/* three columns of long desks, four rows, aisles as before; the middle front one left out for the floor in front */}
      {[1.25, 4.95, 7.35].map((x, ci) => [4.5, 5.7, 6.9, 8.1].map((z, ri) => (ci === 1 && ri === 0 ? null : <LectureDesk key={`${ci}${ri}`} pos={[x, 0, z]} seed={ci * 7 + ri * 3 + 1} />)))}
      <Scatter kind="floor" area={[8, 8]} pos={[RW / 2, 0, 6]} seed={9} density={0.8} keep={[[3.8, 2.6, 2.2]]} />
      {children}
    </group></group></RoomCtx.Provider>
  );
};
/** THE LECTURE ROOM (`dai-hoc`): f = frame (the chalk), dx/dz slide the camera (as StageCam), children = people in room units */
export const GiangDuong: React.FC<{f?: number; dx?: number; dz?: number; bangSach?: boolean; children?: React.ReactNode}> = ({f = 0, dx, dz, bangSach, children}) => (
  <GradeCtx.Provider value="brightInterior">
    <hemisphereLight args={['#eef2f8', '#dccfb2', 2.25]} />
    <StageCam eye={EYE} haze={HAZE} fog={[14, 320]} dx={dx} dz={dz} />
    <Plate from={EYE} id="c-sky" d={520} paint={sky} fog={false} /><Plate from={EYE} id="dh-college" d={48} paint={paintCollegeFront} /><Plate from={EYE} id="dh-maples" d={22} paint={paintWindowMaples} />
    <DaiHocRoom f={f} bangSach={bangSach}>{children}</DaiHocRoom>
  </GradeCtx.Provider>
);
/** the still: the chalk lines finished (frame 47 of shot 15) */
const GiangDuongStill: React.FC = () => { const {width, height} = useVideoConfig(), f = 47; return <AbsoluteFill><Finish><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><GiangDuong f={f} /></ThreeCanvas></Finish></AbsoluteFill>; };
export const ClassroomComps: React.FC = () => <>
  <Composition id="classroom-still" component={ClassroomStill} width={1280} height={720} fps={24} durationInFrames={1} />
  <Composition id="giang-duong-dai-hoc-trong" component={GiangDuongStill} width={1280} height={720} fps={24} durationInFrames={1} />
</>;
