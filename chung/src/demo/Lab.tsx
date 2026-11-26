import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Composition, useVideoConfig, useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {GradeCtx, Finish, Ground, FacetLathe, Halo} from '../lib3/look';
import {useSurface} from '../lib3/detail';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import {withPose} from '../mould/gestures';
import type {Spec} from '../mould/draw';
import {Plate, rnd, P, Ctx, VIEW} from '../lib3/depth';
import {B, StageCam, Crate, Motes} from '../lib3/kit';
import {act, blink} from '../mould/act';
import {RoomCtx, Sun} from '../lib3/room';
import {tex, paintWhitewash, HoledWall, ArchWindow, Machine, MACHINE, Cable, paintPlan, Sheet, calcSheetTex, boardTex, LabDesk, DESK, Stool, IronBed, PendulumClock, CrookedShelf, GlassShelf, LabDoor, Rug, Spot, CALC_LINES,
  paintSooty, paintBurnt, HangingSheet, BurntSheet, BrokenArchWindow, FloorDecal, scorchTex, EmberBed, WreckedMachine, DeskOverturned, FallenLamp, SpiltPapers, BookPile, BOOKPILE, PhotoCracked} from '../lib3/kitLab';

/** Set P of episodes/doom-dai-hoc-danh-sach-canh.md: Victor's laboratory in a student dormitory, AT NIGHT, before the explosion.
 *  Room units (metres): x along the back wall from the left corner, z out from the back wall towards the camera, y up.
 *    back wall (z 0):  the arched window (x 1.35-2.55) with the machine standing in front of it; the wall of pinned plans
 *                      over the desk (x 3.5-5.1); the blackboard with the calculation sheet (x 5.2-6.5); crooked shelves.
 *    right wall (x 6.6): the iron bed in the far corner, the pendulum clock, the door to the lit corridor (z 2.6-3.6),
 *                      the shelf of glassware.
 *    floor: the long desk (x 3.7-5.6, z 1.8-2.6) with Victor's place behind it; cables from the machine run to the camera.
 *  Light: a dark blue room (dim sky fill), ONE warm pool from the desk lamp (a spot with shadows + a weak spill), cool moonlight
 *  through the window (a directional light that only gets in through the opening), the corridor's warm light through the
 *  door, and a faint cold glow at the machine. The room is turned for each view (the lens never turns). */
type V3 = [number, number, number];
export const RW = 6.6, RL = 6.4, RH = 3.3;
export type LabViewSpec = {yaw: number; cam: [number, number]; eye: number};
/** The camera positions. cam = where the camera stands in room units [x, z]; eye = lens height; yaw = how far the room is
 *  turned. A close view for a later shot can be passed to <Lab view={...}> as an object of the same shape. */
export const LAB_VIEWS = {
  wide: {yaw: 0.22, cam: [2.6, 9.6], eye: 1.55},       // master: diagonal into the back-right corner, from outside the open front
  machine: {yaw: 0.25, cam: [1.0, 9.8], eye: 1.0},     // shot 3: low wide on the machine, Victor small at the right edge
  door: {yaw: 1.92, cam: [3.48, 1.25], eye: 1.25},     // eye at the figures' shoulder (a 1.7 figure's drawn eyes are near 1.3)      // shot 5: over Victor's left shoulder towards the door
  // shot 11: square on to the machine, the ring's centre on the lens axis (eye = ring centre height), the whole ring with air
  // above it, the floor in front of the plinth at the bottom. cam z 10.5 is as far back as it goes: further, and the open
  // front edge of the left wall comes into the left of the frame (keep dz >= -0.2 and |dx| <= 0.1 when filming).
  front: {yaw: 0, cam: [1.95, 10.5], eye: 1.72},
} satisfies Record<string, LabViewSpec>;
export type LabView = keyof typeof LAB_VIEWS;
/** Marks (room units) for the figures. */
export const LAB_MARKS = {victorDesk: [4.65, 0, 1.5] as V3, victorDoorView: [5.0, 0, 1.5] as V3, reedDoor: [5.85, 0, 3.15] as V3, reedThreshold: [6.3, 0, 3.1] as V3, victorMachine: [5.2, 0, 3.3] as V3,
  /** shot 9 ('dark', view 'wide'): on the lens side of the console, 1.5 m in front of the lever, his right arm held out
   *  level so that his hand lies over the lever's grip (MACHINE.leverSide) in the picture. In front of the desk's left end
   *  (0.15 m behind his plane, to his left), plinth's front-right corner 0.95 m behind-left, cable by his right foot. */
  victorLever: [3.42, 0, 2.75] as V3,
  /** shot 11 ('dark', view 'front'): back to the lens, on the ring's axis, 0.75 m in front of the plinth (1.25 m from the
   *  ring's plane): a raised arm stays clear of the ring. Stands in the moon patch. */
  victorFront: [1.95, 0, 2.5] as V3,
  /** shots 13-14 ('wrecked', view 'wide'): the middle of the room, back to the shot 13 camera; behind his head on the wall,
   *  the two pale patches where plans hung. */
  victorWreck: [4.1, 0, 3.0] as V3,
  /** shot 13: Reed in the door opening (in the thickness of the wall), clear of both casings by 0.3 m. */
  reedWreckDoor: [6.74, 0, 3.05] as V3};
const MACH: V3 = [1.95, 0, 1.25], DESKP: V3 = [4.65, 0, 2.2];
/** Where things are (room units), for framing the close shots. */
export const LAB_SPOTS = {
  machine: MACH, ringCentre: [MACH[0], MACHINE.ring.y, MACH[2]] as V3,
  lamps: Array.from({length: 5}, (_, i) => [MACH[0] + MACHINE.lamp(i)[0], MACHINE.lamp(i)[1], MACH[2] + MACHINE.console[2] + 0.09] as V3),
  lever: [MACH[0] + MACHINE.lever[0] + 0.13, MACHINE.lever[1], MACH[2] + MACHINE.lever[2]] as V3,
  gaps: MACHINE.gaps.map(([x, z]) => [MACH[0] + x, 1.0, MACH[2] + z] as V3),
  desk: DESKP, deskBulb: [DESKP[0] + DESK.bulb[0], DESK.h + DESK.bulb[1], DESKP[2] + DESK.bulb[2]] as V3,
  photo: [DESKP[0] + DESK.photo[0], DESK.h + 0.115, DESKP[2] + DESK.photo[2]] as V3,
  sheet: [5.72, 1.72, 0.07] as V3, sheetSize: [0.42, 0.55] as [number, number], board: [6.0, 1.7, 0.03] as V3,
  clock: [RW - 0.17, 1.73, 2.0] as V3, door: [RW, 1.07, 3.1] as V3, window: [1.95, 2.0, 0] as V3, bed: [6.15, 0, 1.0] as V3,
  /** ('dark' state on) the lever beside the console (MACHINE.leverSide), at its pivot; its grip, up, is at about
   *  [3.14, 0.98, 1.3] */
  leverSide: [MACH[0] + MACHINE.leverSide[0] + 0.13, MACHINE.leverSide[1] + 0.02, MACH[2] + MACHINE.leverSide[2]] as V3,
  /** ('wrecked') the mother's photograph standing on the front step of a heap of fallen books, leaning back against the
   *  heap, facing the 'wide' camera: the middle of its bottom edge. Low left in the 'wide' frame. */
  photoFloor: [2.35, BOOKPILE.step, 3.2] as V3,
};
/** Screen position (0..1 across, 0..1 down) of a room point in a view: the formula of skill 1 with the room turned. */
export const labScreen = (v: LabViewSpec, [x, y, z]: V3) => {
  const c = Math.cos(v.yaw), s = Math.sin(v.yaw), dx = x - v.cam[0], dz = z - v.cam[1], X = dx * c + dz * s, D = dz * -c + dx * s;
  return [0.5 + X / (0.887 * D), 0.5 - (y - v.eye) / (0.4986 * D), D] as const;
};

// ---------------------------------------------------------------- outside the window (painted for each view, screen units)
/** moon = where the moon stands in the window, as fractions of the window's width from its centre (right, up);
 *  time = the tower clock [hours, minutes] (undefined: the approved picture, hands near twenty to midnight). */
type SkyOpt = {moon?: [number, number]; time?: [number, number]};
/** (d1c6) 'chang-vang' = the room at dusk: warm low light through the window, the window sky at sunset, the desk lamp lit */
export type LabHour = 'chang-vang';
const nightSky = (v: LabViewSpec, o: SkyOpt = {}) => (c: Ctx) => {
  const [wx0, wy0, wd] = labScreen(v, [1.95, 2.0, 0]), seen = wd > 0.5, ww = seen ? (1.2 / (0.887 * wd)) * 1600 : 240, X = seen ? wx0 * 1600 : 800, Y = seen ? wy0 * 900 : 450, r = rnd(17);   // window behind the lens: paint a generic sky
  const g = c.createLinearGradient(0, Y - ww * 1.2, 0, Y + ww * 0.8); g.addColorStop(0, '#111a35'); g.addColorStop(0.7, '#25335c'); g.addColorStop(1, '#3a4a78'); c.fillStyle = g; c.fillRect(-400, -300, 2400, 1500);
  for (let k = 0; k < 260; k++) { const a = 0.3 + r() * 0.7; c.fillStyle = `rgba(240,240,255,${a})`; const s = r() < 0.08 ? 2.4 : 1.3; c.fillRect(-400 + r() * 2400, -300 + r() * 1300, s, s); }
  // a waning moon high in the arch
  const mx = X + ww * (o.moon?.[0] ?? 0.24), my = Y - ww * (o.moon?.[1] ?? 0.5); const halo = c.createRadialGradient(mx, my, 4, mx, my, ww * 0.32); halo.addColorStop(0, 'rgba(220,230,255,0.35)'); halo.addColorStop(1, 'rgba(220,230,255,0)'); c.fillStyle = halo; c.fillRect(mx - ww, my - ww, ww * 2, ww * 2);
  c.beginPath(); c.arc(mx, my, ww * 0.075, 0, 7); c.fillStyle = '#f2ecd4'; c.fill(); c.beginPath(); c.arc(mx + ww * 0.035, my - ww * 0.02, ww * 0.07, 0, 7); c.fillStyle = '#1a2444'; c.fill();
  // the town's roofs and chimneys, a few lit windows
  const hz = Y + ww * 0.62;
  for (let x = -400; x < 2000; x += 30 + r() * 60) { const h = ww * (0.05 + r() * 0.16), w = 40 + r() * 70; c.fillStyle = r() < 0.5 ? '#1b2340' : '#212a4a'; c.fillRect(x, hz - h, w, h + 600); P(c, [[x - 4, hz - h], [x + w / 2, hz - h - ww * 0.06], [x + w + 4, hz - h]], '#18203a'); if (r() < 0.45) { c.fillStyle = r() < 0.6 ? '#e8b860' : '#d8a050'; c.fillRect(x + w * (0.2 + r() * 0.5), hz - h * (0.3 + r() * 0.4), 6, 8); } if (r() < 0.25) { c.fillStyle = '#18203a'; c.fillRect(x + w * 0.7, hz - h - ww * 0.1, 8, ww * 0.08); } }
  // the university's clock tower, its face lit (twenty to midnight)
  const tx = X - ww * 0.16, tw = ww * 0.15, th = ww * 0.85, top = hz - th;
  c.fillStyle = '#2b3660'; c.fillRect(tx - tw / 2, top, tw, th + 600); c.fillStyle = '#212a4e'; c.fillRect(tx + tw * 0.12, top, tw * 0.38, th + 600);
  P(c, [[tx - tw * 0.62, top], [tx, top - th * 0.34], [tx + tw * 0.62, top]], '#1c2446'); P(c, [[tx - tw * 0.62, top], [tx, top - th * 0.34], [tx, top]], '#273158');
  c.fillStyle = '#1c2446'; c.fillRect(tx - tw * 0.6, top - 2, tw * 1.2, 6); c.fillRect(tx - 1.5, top - th * 0.46, 3, th * 0.14);
  const fy = top + th * 0.2, fr = tw * 0.33; const fh = c.createRadialGradient(tx, fy, 2, tx, fy, fr * 3); fh.addColorStop(0, 'rgba(255,230,160,0.55)'); fh.addColorStop(1, 'rgba(255,230,160,0)'); c.fillStyle = fh; c.fillRect(tx - fr * 3, fy - fr * 3, fr * 6, fr * 6);
  c.beginPath(); c.arc(tx, fy, fr, 0, 7); c.fillStyle = '#f2dfa0'; c.fill(); c.strokeStyle = '#3a3020'; c.lineWidth = Math.max(1.2, fr * 0.14); c.lineCap = 'round';
  const ha = o.time ? (((o.time[0] % 12) + o.time[1] / 60) / 12) * Math.PI * 2 : -0.17 * Math.PI, ma = ((o.time ? o.time[1] : 40) / 60) * Math.PI * 2;
  c.beginPath(); c.moveTo(tx, fy); c.lineTo(tx + Math.sin(ha) * fr * 0.55, fy - Math.cos(ha) * fr * 0.55); c.moveTo(tx, fy); c.lineTo(tx + Math.sin(ma) * fr * 0.85, fy - Math.cos(ma) * fr * 0.85); c.stroke();
  for (let k = 0; k < 3; k++) { c.fillStyle = k === 1 ? '#e8b860' : '#3a4670'; c.fillRect(tx - tw * 0.14, top + th * (0.42 + k * 0.16), tw * 0.28, th * 0.07); }
  // a bare branch reaching in from the top left of the window
  c.strokeStyle = '#0f1424'; c.lineCap = 'round'; const bx = X - ww * 0.75, by = Y - ww * 0.95;
  const twig = (x: number, y: number, a: number, l: number, wdt: number, d: number) => { const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.lineWidth = wdt; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + x2) / 2, (y + y2) / 2 - l * 0.08, x2, y2); c.stroke(); if (d > 0) { twig(x2, y2, a - 0.5 + r() * 0.2, l * 0.62, wdt * 0.6, d - 1); twig(x2, y2, a + 0.35 + r() * 0.2, l * 0.55, wdt * 0.55, d - 1); } else { c.fillStyle = '#141a2e'; c.beginPath(); c.ellipse(x2, y2, 7, 3.5, a, 0, 7); c.fill(); } };
  twig(bx, by, 0.45, ww * 0.42, ww * 0.045, 4);
};

/** (d1c6) the same window at dusk (gio 'chang-vang'): violet above, orange at the roofs, the low sun's flat glow, the clock tower
 *  a dark cut-out with its face just lit, a few first windows and stars. Painted with the same window geometry as nightSky. */
const duskSky = (v: LabViewSpec) => (c: Ctx) => {
  const [wx0, wy0, wd] = labScreen(v, [1.95, 2.0, 0]), seen = wd > 0.5, ww = seen ? (1.2 / (0.887 * wd)) * 1600 : 240, X = seen ? wx0 * 1600 : 800, Y = seen ? wy0 * 900 : 450, r = rnd(19);
  const g = c.createLinearGradient(0, Y - ww * 1.2, 0, Y + ww * 0.8); g.addColorStop(0, '#5a4a88'); g.addColorStop(0.4, '#a3689a'); g.addColorStop(0.75, '#f09a78'); g.addColorStop(1, '#fcc47e'); c.fillStyle = g; c.fillRect(-400, -300, 2400, 1500);
  for (let k = 0; k < 24; k++) { c.fillStyle = `rgba(250,240,255,${0.35 + r() * 0.4})`; c.fillRect(-400 + r() * 2400, -300 + r() * 700, 1.8, 1.8); }
  const sx = X - ww * 0.45, sy = Y + ww * 0.5;
  ([[ww * 0.8, 'rgba(255,196,130,0.16)'], [ww * 0.45, 'rgba(255,210,142,0.3)'], [ww * 0.2, 'rgba(255,232,176,0.6)']] as [number, string][]).forEach(([q, f]) => { c.beginPath(); c.arc(sx, sy, q, 0, 7); c.fillStyle = f; c.fill(); });
  [[X - ww * 0.9, Y - ww * 0.35, 0.5], [X + ww * 0.55, Y - ww * 0.55, 0.42], [X + ww * 0.1, Y - ww * 0.15, 0.3]].forEach(([cx, cy, k]) => { c.beginPath(); c.ellipse(cx, cy, ww * k, ww * k * 0.12, 0, 0, 7); c.fillStyle = 'rgba(240,150,130,0.75)'; c.fill(); c.beginPath(); c.ellipse(cx, cy - ww * k * 0.1, ww * k * 0.8, ww * k * 0.07, 0, 0, 7); c.fillStyle = 'rgba(176,108,150,0.8)'; c.fill(); });
  const hz = Y + ww * 0.62;
  for (let x = -400; x < 2000; x += 30 + r() * 60) { const h = ww * (0.05 + r() * 0.16), w = 40 + r() * 70; c.fillStyle = r() < 0.5 ? '#6a3e72' : '#7a4a78'; c.fillRect(x, hz - h, w, h + 600); P(c, [[x - 4, hz - h], [x + w / 2, hz - h - ww * 0.06], [x + w + 4, hz - h]], '#5c3466'); if (r() < 0.3) { c.fillStyle = '#f6c878'; c.fillRect(x + w * (0.2 + r() * 0.5), hz - h * (0.3 + r() * 0.4), 6, 8); } }
  const tx = X - ww * 0.16, tw = ww * 0.15, th = ww * 0.85, top = hz - th;
  c.fillStyle = '#5a3468'; c.fillRect(tx - tw / 2, top, tw, th + 600); c.fillStyle = '#4a2a5c'; c.fillRect(tx + tw * 0.12, top, tw * 0.38, th + 600);
  P(c, [[tx - tw * 0.62, top], [tx, top - th * 0.34], [tx + tw * 0.62, top]], '#44285a'); P(c, [[tx - tw * 0.62, top], [tx, top - th * 0.34], [tx, top]], '#523068');
  const fy = top + th * 0.2, fr = tw * 0.33; c.beginPath(); c.arc(tx, fy, fr, 0, 7); c.fillStyle = '#f6dca0'; c.fill(); c.strokeStyle = '#3a2438'; c.lineWidth = Math.max(1.2, fr * 0.14); c.lineCap = 'round';
  c.beginPath(); c.moveTo(tx, fy); c.lineTo(tx + Math.sin(0.5) * fr * 0.55, fy - Math.cos(0.5) * fr * 0.55); c.moveTo(tx, fy); c.lineTo(tx - Math.sin(0.3) * fr * 0.85, fy - Math.cos(0.3) * fr * 0.85); c.stroke();
  c.strokeStyle = '#3a2440'; c.lineCap = 'round'; const bx = X - ww * 0.75, by = Y - ww * 0.95;
  const twig = (x: number, y: number, a: number, l: number, wdt: number, d: number) => { const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.lineWidth = wdt; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + x2) / 2, (y + y2) / 2 - l * 0.08, x2, y2); c.stroke(); if (d > 0) { twig(x2, y2, a - 0.5 + r() * 0.2, l * 0.62, wdt * 0.6, d - 1); twig(x2, y2, a + 0.35 + r() * 0.2, l * 0.55, wdt * 0.55, d - 1); } };
  twig(bx, by, 0.45, ww * 0.42, ww * 0.045, 4);
};

// ---------------------------------------------------------------- the room
/** The state of the room. 'night' = the approved set (shots 2-8); 'dark' = later the same night, the desk lamp off, the
 *  moon higher, the clocks near midnight, the lever moved into sight (shots 9-11); 'wrecked' = after the explosion
 *  (shots 13-14). */
export type LabState = 'night' | 'dark' | 'wrecked';
const wallBack = () => tex('lab-wall-back', 2048, 1024, paintWhitewash(3, RW, RH));
const wallRight = () => tex('lab-wall-right', 2048, 1024, paintWhitewash(8, RL, RH));
const wallLeft = () => tex('lab-wall-left', 2048, 1024, paintWhitewash(12, RL, RH));
/** wrecked: which plans were torn away (pale patches where they hung, behind Victor's head in shot 13), which hang by one
 *  pin, which burnt where they hung. Index = PLANS. */
const PLAN_FATE: ({gone: true} | {hang: 'tl' | 'tr'; angle: number; side: 'left' | 'right' | 'bottom'; amount: number} | {side: 'left' | 'right' | 'bottom' | 'top'; amount: number; pins?: [boolean, boolean]})[] = [
  {hang: 'tr', angle: 24, side: 'left', amount: 0.4}, {side: 'bottom', amount: 0.22}, {side: 'left', amount: 0.12}, {hang: 'tr', angle: 38, side: 'left', amount: 0.5},
  {gone: true}, {gone: true}, {side: 'bottom', amount: 0.45, pins: [false, true]}, {gone: true}, {side: 'left', amount: 0.15},
];
const wallBackSooty = () => tex('lab-wall-back-soot', 2048, 1024, paintSooty(paintWhitewash(3, RW, RH), 5, RW, RH,
  [{x: 1.95, y: 1.6, r: 2.3}, {x: 3.0, y: 0.75, r: 1.1, k: 0.6}, {x: 2.6, y: 2.8, r: 3.8, k: 0.72}],
  PLANS.flatMap(([x, y, w, h, rot], i) => ('gone' in PLAN_FATE[i] ? [{x, y, w, h, rot}] : []))));
const wallRightSooty = () => tex('lab-wall-right-soot', 2048, 1024, paintSooty(paintWhitewash(8, RL, RH), 6, RL, RH, [{x: 0.6, y: 3.1, r: 2.6, k: 0.4}]));
const wallLeftSooty = () => tex('lab-wall-left-soot', 2048, 1024, paintSooty(paintWhitewash(12, RL, RH), 7, RL, RH, [{x: 5.15, y: 1.5, r: 2.2, k: 0.9}, {x: 5.0, y: 3.0, r: 2.8, k: 0.45}]));
const PLANS: [number, number, number, number, number, 'blue' | 'cream'][] = [   // x, y, w, h, rot, kind: the wall of plans over the desk
  [3.85, 2.25, 0.62, 0.46, -3, 'blue'], [4.5, 2.32, 0.56, 0.42, 4, 'cream'], [4.95, 2.05, 0.42, 0.56, -5, 'cream'], [3.75, 1.62, 0.44, 0.58, 5, 'cream'],
  [4.28, 1.75, 0.66, 0.5, -2, 'blue'], [4.85, 1.45, 0.5, 0.38, 6, 'cream'], [4.25, 1.22, 0.4, 0.3, -7, 'cream'], [3.62, 2.62, 0.36, 0.28, 8, 'cream'], [4.95, 2.6, 0.34, 0.26, -4, 'blue'],
];
const BackWall: React.FC<{state: LabState}> = ({state}) => (
  <group>
    <HoledWall w={RW} h={RH} map={state === 'wrecked' ? wallBackSooty() : wallBack()} holes={[{kind: 'arch', x0: 1.35, x1: 2.55, y0: 1.0, spring: 2.2}]} />
    {state === 'wrecked' ? <BrokenArchWindow x0={1.35} x1={2.55} sill={1.0} spring={2.2} /> : <ArchWindow x0={1.35} x1={2.55} sill={1.0} spring={2.2} />}
    {/* skirting, a picture rail */}
    <B p={[RW / 2, 0.06, 0.012]} s={[RW, 0.12, 0.025]} c="#4a3828" cast={false} /><B p={[RW / 2, 2.98, 0.012]} s={[RW, 0.035, 0.025]} c="#5a4430" cast={false} />
    {/* the wall of plans, pinned over one another */}
    {state !== 'wrecked' ? PLANS.map(([x, y, w, h, rot, kind], i) => <Sheet key={i} map={tex(`lab-plan-${i}`, kind === 'blue' ? 640 : 600, Math.round((kind === 'blue' ? 640 : 600) * h / w), paintPlan(kind, 11 + i * 7))} x={x} y={y} w={w} h={h} rot={rot} z={0.01 + i * 0.006} pin={i % 3 ? '#c8372d' : '#c9a24a'} />)
      : PLANS.map(([x, y, w, h, rot, kind], i) => { const fate = PLAN_FATE[i]; if ('gone' in fate) return null; const W0 = kind === 'blue' ? 640 : 600, map = tex(`lab-plan-burnt-${i}`, W0, Math.round(W0 * h / w), paintBurnt(paintPlan(kind, 11 + i * 7), 50 + i, fate.side, fate.amount)), pin = i % 3 ? '#c8372d' : '#c9a24a';
        if ('hang' in fate) { const cs = (rot * Math.PI) / 180, px = fate.hang === 'tl' ? -1 : 1, ox = px * (w / 2 - 0.025), oy = h / 2 - 0.025; return <HangingSheet key={i} map={map} pin={[x + ox * Math.cos(cs) - oy * Math.sin(cs), y + ox * Math.sin(cs) + oy * Math.cos(cs)]} w={w} h={h} corner={fate.hang} hang={fate.angle} z={0.01 + i * 0.006} pinColor={pin} />; }
        return <BurntSheet key={i} map={map} x={x} y={y} w={w} h={h} rot={rot} z={0.01 + i * 0.006} pin={pin} pins={fate.pins} />; })}
    {/* the blackboard, its chalk tray, chalk and a duster; the calculation sheet pinned on it */}
    <B p={[6.0, 1.7, 0.02]} s={[1.18, 1.18, 0.04]} c="#4a3020" />
    <mesh position={[6.0, 1.7, 0.043]} receiveShadow><planeGeometry args={[1.08, 1.08]} /><meshLambertMaterial map={boardTex()} /></mesh>
    <B p={[6.0, 1.12, 0.07]} s={[1.12, 0.035, 0.1]} c="#5a3c28" />{[[5.6, '#f2f0e6'], [5.68, '#f2f0e6'], [6.4, '#f2c8a0']].map(([x, col]) => <B key={x as number} p={[x as number, 1.15, 0.07]} s={[0.07, 0.018, 0.018]} c={col as string} cast={false} />)}
    <B p={[6.12, 1.16, 0.07]} s={[0.17, 0.045, 0.07]} c="#3a2a20" /><B p={[6.12, 1.14, 0.07]} s={[0.18, 0.018, 0.075]} c="#c9c0ae" cast={false} />
    <Sheet map={calcSheetTex()} x={LAB_SPOTS.sheet[0]} y={LAB_SPOTS.sheet[1]} w={LAB_SPOTS.sheetSize[0]} h={LAB_SPOTS.sheetSize[1]} rot={-2} z={0.055} pins={4} />
    {/* crooked shelves: over the board, over the plans, beside the window (after the blast the two nearest the machine hang
        steeply, the one beside the window is down to one bracket) */}
    <CrookedShelf pos={[5.85, 2.52, 0]} w={1.2} tilt={0.04} seed={3} /><CrookedShelf pos={[4.3, 2.92, 0]} w={1.3} tilt={state === 'wrecked' ? -0.09 : -0.03} seed={7} /><CrookedShelf pos={[0.62, state === 'wrecked' ? 2.2 : 2.3, 0]} w={0.9} tilt={state === 'wrecked' ? 0.32 : 0.05} seed={11} />
    {/* where the machine is fed: a junction box with a knife switch on the wall */}
    <group position={[3.32, 0.62, 0.04]}><B p={[0, 0, 0]} s={[0.26, 0.34, 0.08]} c="#3a4048" /><B p={[0, 0, 0.045]} s={[0.2, 0.28, 0.01]} c="#2a2e34" cast={false} /><B p={[0, 0.04, 0.07]} s={[0.025, 0.18, 0.025]} r={[0, 0, 0.25]} c="#c9a24a" /><B p={[0, -0.12, 0.05]} s={[0.12, 0.03, 0.03]} c="#6a2a24" /></group>
  </group>
);
const RightWall: React.FC<{state: LabState; door?: number; bolt?: number}> = ({state, door, bolt}) => (
  // turned so that its face looks into the room (-x); along it, local x = room z
  <group position={[RW, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
    <HoledWall w={RL} h={RH} map={state === 'wrecked' ? wallRightSooty() : wallRight()} notch={[2.6, 3.6, 2.15]} />
    <group position={[2.6, 0, 0]}><LabDoor w={1.0} h={2.15} open={door === undefined ? -1.2 : -1.2 * (1 - door)} hinge="right" corridor={1.7} />{door !== undefined ? <DoorExtras door={door} bolt={bolt ?? 0} /> : null}</group>
    <B p={[1.3, 0.06, 0.012]} s={[2.6, 0.12, 0.025]} c="#4a3828" cast={false} /><B p={[5.0, 0.06, 0.012]} s={[2.8, 0.12, 0.025]} c="#4a3828" cast={false} />
    {state === 'night' ? <PendulumClock pos={[2.0, 0.85, 0]} /> : state === 'dark' ? <PendulumClock pos={[2.0, 0.85, 0]} time={[11, 56]} />
      : <group position={[2.0, 2.1, 0]} rotation={[0, 0, -0.13]}><PendulumClock pos={[0, -1.25, 0]} swing={0.02} time={[11, 58]} /></group>}{/* wrecked: stopped two minutes to midnight, hanging crooked from its nail */}
    <GlassShelf pos={[4.45, 1.5, 0]} w={1.0} /><CrookedShelf pos={[4.45, 2.15, 0]} w={1.1} tilt={-0.02} seed={19} />
    {/* a timetable and a sketch pinned by the door */}
    <Sheet map={tex('lab-timetable', 400, 520, (c, W, H) => { c.fillStyle = '#efe6cf'; c.fillRect(0, 0, W, H); c.fillStyle = '#22304e'; c.font = 'bold 30px Georgia, serif'; c.fillText('Lịch học', 30, 50); c.strokeStyle = 'rgba(40,40,60,0.6)'; c.lineWidth = 2; for (let i = 0; i <= 6; i++) { c.beginPath(); c.moveTo(30, 80 + i * 64); c.lineTo(W - 30, 80 + i * 64); c.stroke(); } for (let j = 0; j <= 4; j++) { c.beginPath(); c.moveTo(30 + j * 85, 80); c.lineTo(30 + j * 85, 464); c.stroke(); } c.fillStyle = 'rgba(40,60,110,0.6)'; for (let k = 0; k < 14; k++) c.fillRect(40 + (k % 4) * 85, 100 + Math.floor(k / 4) * 64 + 12, 50, 8); c.strokeStyle = 'rgba(190,40,40,0.8)'; c.lineWidth = 4; c.beginPath(); c.moveTo(40, 300); c.lineTo(360, 230); c.stroke(); })} x={5.45} y={1.6} w={0.3} h={0.39} rot={3} z={0.01} />
    <Sheet map={tex('lab-plan-door', 520, 400, paintPlan('cream', 5))} x={1.0} y={1.75} w={0.46} h={0.35} rot={-4} z={0.01} />
  </group>
);
const LeftWall: React.FC<{state: LabState}> = ({state}) => (
  <group position={[0, 0, RL]} rotation={[0, Math.PI / 2, 0]}>
    <HoledWall w={RL} h={RH} map={state === 'wrecked' ? wallLeftSooty() : wallLeft()} />
    <B p={[RL / 2, 0.06, 0.012]} s={[RL, 0.12, 0.025]} c="#4a3828" cast={false} />
    {/* a coat on a hook, a framed diploma */}
    <B p={[4.6, 1.75, 0.04]} s={[0.05, 0.05, 0.08]} c="#3a3430" /><B p={[4.6, 1.38, 0.07]} s={[0.46, 0.72, 0.06]} r={[0, 0, 0.03]} c="#2e3236" />
    <B p={[3.3, 1.8, 0.02]} s={[0.5, 0.38, 0.03]} c="#5a3a24" /><mesh position={[3.3, 1.8, 0.037]}><planeGeometry args={[0.42, 0.3]} /><meshLambertMaterial color="#e6dcc0" /></mesh>
  </group>
);
const ceilSoot = () => tex('lab-ceiling-soot', 512, 512, (c, W, H) => { const r = rnd(8); const g = c.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H / 2, W / 2); g.addColorStop(0, 'rgba(18,14,12,0.9)'); g.addColorStop(0.5, 'rgba(24,20,16,0.55)'); g.addColorStop(1, 'rgba(24,20,16,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); for (let k = 0; k < 60; k++) { const x = W * (0.15 + r() * 0.7), y = H * (0.15 + r() * 0.7), q = 10 + r() * 40, b = c.createRadialGradient(x, y, 0, x, y, q); b.addColorStop(0, 'rgba(15,12,10,0.25)'); b.addColorStop(1, 'rgba(15,12,10,0)'); c.fillStyle = b; c.fillRect(x - q, y - q, q * 2, q * 2); } });
const Ceiling: React.FC<{state: LabState}> = ({state}) => (
  <group>
    {state === 'wrecked' ? <mesh position={[1.95, RH - 0.003, 1.2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[4.2, 3.6]} /><meshLambertMaterial map={ceilSoot()} transparent depthWrite={false} /></mesh> : null}
    <B p={[RW / 2, RH + 0.1, RL / 2]} s={[RW + 0.6, 0.2, RL + 0.4]} c="#8a8272" />
    {[0.55, 1.85, 3.15, 4.45, 5.75].map((x, i) => <group key={x}><B p={[x, RH - 0.11, RL / 2]} s={[0.17, 0.22, RL]} c={i % 2 ? '#4a3626' : '#43301f'} /><B p={[x + 0.09, RH - 0.11, RL / 2]} s={[0.006, 0.18, RL]} c="#2e2014" cast={false} /></group>)}
    <B p={[RW / 2, RH - 0.14, 0.12]} s={[RW, 0.28, 0.24]} c="#3e2c1e" />
    {/* a bare bulb on a flex, switched off */}
    <B p={[3.0, RH - 0.45, 3.2]} s={[0.012, 0.7, 0.012]} c="#1e1e20" cast={false} /><FacetLathe profile={[[0.02, 0], [0.05, 0.04], [0.045, 0.1], [0.02, 0.13]]} sides={8} color="#b8b0a0" pos={[3.0, RH - 0.93, 3.2]} contact={false} cast={false} />
  </group>
);

/** (d1c6) THE TARPAULIN over the machine, cut-paper flat: a draped sheet of flat triangles in three tones with a sharp ragged hem,
 *  hanging from the top of the ring down to the plinth. cover 0..1 = how much of the machine's width it covers, from the left
 *  (0.5 = the left half under the cloth, the console and lever side bare). Cyan light leaks out of the hem and through the cloth
 *  over each covered coil. Origin = the machine's origin (MACH). The machine under it is the ordinary Machine. */
const coverGeo = (cover: number) => {
  const x0 = -1.5, x1 = x0 + 3.0 * cover, nx = Math.max(3, Math.round(16 * cover)), ny = 8, top = 3.1, pos: number[] = [], col: number[] = [];
  const tones = ['#6a6454', '#777060', '#857d6a'].map((h) => new THREE.Color(h));
  const hem = (y: number) => x1 + (cover >= 0.999 ? 0 : 0.1 * Math.sin(y * 2.4 + 0.7));
  // a thin sheet lying over the ring's front (z 0.27), vertical pleats, a sagging lower hem above the plinth (y about 0.55-0.95)
  const ybot = (x: number) => 0.8 + 0.2 * Math.sin(x * 4.1 + 0.6) - 0.12 * Math.max(0, Math.sin(x * 9));
  const pt = (i: number, j: number): [number, number, number] => { const xe = Math.max(hem(1.5), x0 + 0.3), x = x0 + (i / nx) * (xe - x0), yb = ybot(x), y = yb + (j / ny) * (top - yb); return [x, y, 0.27 + 0.045 * Math.sin(x * 11) + 0.02 * Math.sin(x * 4.3 + y)]; };
  let n = 0; const tri = (a: number[], b: number[], c2: number[]) => { [a, b, c2].forEach((q) => pos.push(q[0], q[1], q[2])); n++; const t = tones[Math.abs(Math.round((a[0] - x0) * 5.2)) % 3]; for (let k = 0; k < 3; k++) col.push(t.r, t.g, t.b); };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = pt(i, j), b = pt(i + 1, j), c3 = pt(i, j + 1), d = pt(i + 1, j + 1); if ((i + j) % 2) { tri(a, b, d); tri(a, d, c3); } else { tri(a, b, c3); tri(b, d, c3); } }
  const bt = [[x0, top, -0.2], [x1, top, -0.2], [x1, top, 0.27], [x0, top, 0.27]]; tri(bt[0], bt[1], bt[2]); tri(bt[0], bt[2], bt[3]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
};
const MachineCover: React.FC<{pos: V3; cover: number; f: number}> = ({pos, cover, f}) => {
  const geo = React.useMemo(() => coverGeo(cover), [cover]);
  const xe = -1.5 + 3.0 * cover, coils = Array.from({length: 8}, (_, k) => k).filter((k) => { const a = Math.PI / 2 - (k * Math.PI) / 4; return Math.cos(a) * 1.15 < xe - 0.2; });
  const flick = 0.75 + 0.25 * Math.sin(f * 0.7);
  return (
    <group position={pos}>
      <mesh geometry={geo} castShadow receiveShadow><meshLambertMaterial vertexColors flatShading side={THREE.DoubleSide} /></mesh>
      {/* the glow inside: through the cloth over each covered coil, and out of the hem along the floor */}
      <pointLight position={[Math.min(0, xe - 0.5), MACHINE.ring.y, 0.5]} color="#5fe2ff" intensity={0.9 * flick * Math.min(1, cover * 2)} distance={5} decay={2} />
      {coils.map((k) => { const a = Math.PI / 2 - (k * Math.PI) / 4, mid = (MACHINE.ring.R + MACHINE.ring.r) / 2; return <Halo key={k} pos={[Math.cos(a) * mid, MACHINE.ring.y + Math.sin(a) * mid, 0.4]} r={0.55} color="#6fe6ff" strength={0.4 * flick} />; })}
      <Halo pos={[xe - 0.5, 0.85, 0.45]} r={0.6} color="#7feaff" strength={0.45 * flick} />
    </group>
  );
};
/** (d1c6) what a shut door shows: the line of light under it, a fan of it on the floor, the slide bolt. In the wall's frame
 *  (origin = the opening's left foot on the wall face, wall facing +z). door 0..1 = how shut (1 = shut), bolt 0..1 = how far the bolt is shot. */
const DoorExtras: React.FC<{door: number; bolt: number}> = ({door, bolt}) => {
  const fan = React.useMemo(() => tex('lab-door-fan', 128, 128, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,214,140,0.95)'); g.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(W * 0.02, 0); c.lineTo(W * 0.98, 0); c.lineTo(W * 0.78, H); c.lineTo(W * 0.22, H); c.closePath(); c.fill(); }), []);
  if (door < 0.5) return null;
  return <group>
    <mesh position={[0.5, 0.004, 0.02]}><boxGeometry args={[0.88, 0.014, 0.012]} /><meshBasicMaterial color="#ffe0a0" /></mesh>
    <mesh position={[0.5, 0.006, 0.34]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}><planeGeometry args={[0.96, 0.62]} /><meshBasicMaterial map={fan} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
    {/* the slide bolt on the door's face at the latch side: a plate, two staples, the rod, a knob; shot, the rod enters the casing */}
    <B p={[0.3, 1.45, 0.058]} s={[0.4, 0.07, 0.012]} c="#2a2c30" cast={false} /><B p={[0.2, 1.45, 0.068]} s={[0.04, 0.05, 0.02]} c="#6a6e76" cast={false} /><B p={[0.4, 1.45, 0.068]} s={[0.04, 0.05, 0.02]} c="#6a6e76" cast={false} />
    <B p={[0.3 - 0.14 + bolt * 0.14 - 0.0, 1.45, 0.074]} s={[0.32, 0.03, 0.022]} c="#aab0b8" /><B p={[0.3 - 0.14 + bolt * 0.14, 1.52, 0.078]} s={[0.04, 0.06, 0.03]} c="#c9a24a" />
  </group>;
};
/** The figures' colour in this room: they are unlit cards, so the light they stand in is given by tint. */
export const LAB_TINT = {lamp: '#e9cfa8', room: '#a9aabb', back: '#8a8488', corridorEdge: '#c9b9a0'};

export type MachineState = {lamps?: number | boolean[]; coils?: number; needles?: [number, number, number]; lever?: number};
/** (shots 2-8) LAYERS for a shot with a soft background. A canvas draws one layer of the same shot:
 *  'all' = everything (the default, as before); 'back' = the set and `extra` in colour, the figures present but INVISIBLE
 *  (they still cast their shadows on the set); 'figures' = the figures in colour, the set invisible but still there (it hides
 *  what stands behind it and throws its shadows on the figures), no sky, transparent background; 'front' = only `fg` (a
 *  near prop to be blurred more than the background), lit by the room's lights. */
export type LabLayer = 'all' | 'back' | 'figures' | 'front';
/** Draws its children into depth only (colour writes off): invisible, but they still hide what is behind them and cast shadows. */
const Ghost: React.FC<{on: boolean; children?: React.ReactNode}> = ({on, children}) => {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => { if (!on || !ref.current) return; ref.current.traverse((o) => { const m = (o as THREE.Mesh).material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { x.colorWrite = false; }); }); });
  return <group ref={ref}>{children}</group>;
};
/** The camera of the 'figures' and 'front' layers: StageCam's placement, but no background and no fog (the canvas is transparent). */
const LayerCam: React.FC<{eye: V3; dx?: number; dz?: number}> = ({eye, dx = 0, dz = 0}) => {
  const {camera, scene, size} = useThree(), c = camera as THREE.PerspectiveCamera;
  c.position.set(eye[0] + dx, eye[1], eye[2] + dz); c.near = 0.1; c.far = 900; c.lookAt(eye[0] + dx, eye[1], eye[2] + dz - 100); c.fov = VIEW.fov; c.aspect = size.width / size.height; c.clearViewOffset(); c.updateProjectionMatrix();
  scene.background = null; scene.fog = null;
  return null;
};

/** The machine's glow (shots 9-11), driven per frame by the filming step: strength 0 = nothing, 1 = the wall behind the
 *  machine clearly lit, a figure 3 m away visibly cyan. Two lights: one at the ring's centre (walls, floor, ceiling, the
 *  machine's own iron) and a weaker spill a little in front of the ring's opening, which is what reaches the FRONT of the
 *  flat figures (a card lit only from behind its own plane stays dark). */
/** spill (default 1) = share of the light in front of the ring: shot 11 turns it down so that a figure standing between the
 *  ring and the lens stays a dark shape against the portal (added for shots 9-14 filming; default = as before). */
export type LabGlow = {strength: number; color?: string; spill?: number};
const Glow: React.FC<{glow?: LabGlow}> = ({glow}) => {
  const k = Math.max(0, glow?.strength ?? 0), col = glow?.color ?? '#5fe2ff', c = LAB_SPOTS.ringCentre;
  if (k <= 0) return null;
  return <>
    <pointLight position={c} color={col} intensity={9 * k} distance={11} decay={2} />
    {(glow?.spill ?? 1) > 0 ? <pointLight position={[c[0], c[1] - 0.45, c[2] + 1.9]} color={col} intensity={9 * k * (glow?.spill ?? 1)} distance={10} decay={1.6} /> : null}
  </>;
};
/** wrecked: embers (room points) near the machine */
const EMBERS: V3[] = [[1.45, 0.49, 1.55], [2.35, 0.49, 1.15], [1.05, 0.025, 2.05], [2.7, 0.025, 2.2], [1.75, 0.025, 2.45], [2.05, 0.49, 1.6], [0.95, 0.49, 1.3]];
const Room: React.FC<{v: LabViewSpec; view?: LabView; f: number; machine?: MachineState; deskLamp?: boolean; children?: React.ReactNode; layer?: LabLayer; extra?: React.ReactNode; fg?: React.ReactNode; state?: LabState; glow?: LabGlow; gio?: LabHour; cover?: number; door?: number; bolt?: number; crates?: boolean; stoolAt?: V3}> = ({v, view, f, machine = {}, deskLamp = true, children, layer = 'all', extra, fg, state = 'night', glow, gio, cover, door, bolt, crates, stoolAt}) => {
  const plank = useSurface('plank', 6), night = state === 'night', wreck = state === 'wrecked';
  return (
    <RoomCtx.Provider value={v.yaw}><group rotation={[0, v.yaw, 0]}><group position={[-v.cam[0], 0, -v.cam[1]]}>
      {/* LIGHTS. moon: through the arched window only; lamp: a warm cone on the desk + a weak spill; corridor: through the door;
          machine: a faint cold glow by the console */}
      {gio === 'chang-vang' ? <Sun nguocSang from={[0.2, 4.6, -6.6]} to={[3.2, 0, 2.8]} intensity={6.4} color="#ffa466" />
        : night ? <Sun nguocSang from={[1.3, 7.2, -6.6]} to={[2.4, 0, 2.6]} intensity={3.6} color="#a9bcf0" />
        : <Sun nguocSang from={[1.45, 8.4, -6.6]} to={[2.15, 0, 2.7]} intensity={wreck ? 4.6 : 4.4} color="#a3b8f2" />}{/* later: the moon higher, its patch on the floor right in front of the plinth */}
      {deskLamp ? <><Spot from={LAB_SPOTS.deskBulb} to={[DESKP[0] - 0.45, DESK.h, DESKP[2] + 0.05]} color="#ffc777" intensity={5} angle={1.0} penumbra={0.75} distance={6} />
      {/* the spill: the light the shade lets out downward and the desk throws back, reaching the plans and the man; it never
          reaches the ceiling (a spot pointing down with a wide cone, no shadow) */}
      <Spot from={[LAB_SPOTS.deskBulb[0], LAB_SPOTS.deskBulb[1] - 0.05, LAB_SPOTS.deskBulb[2]]} to={[4.7, 0.7, 1.2]} color="#ffbf70" intensity={1.6} angle={1.3} penumbra={1} distance={5} shadow={false} /></> : null}
      <Spot from={[8.0, 2.4, 3.1]} to={[4.8, 0, 2.9]} color="#ffcf8a" intensity={door !== undefined ? 7 * (1 - 0.85 * door) : 7} angle={0.6} penumbra={0.5} distance={9} />
      {!wreck ? <pointLight position={[MACH[0] + 0.2, 1.3, MACH[2] + 0.7]} color="#6fd6ea" intensity={0.3} distance={2.6} decay={2} />
        : <pointLight position={[MACH[0] + 0.1, 0.75, MACH[2] + 0.85]} color="#ff8a40" intensity={0.9} distance={3.4} decay={2} />}{/* wrecked: the last embers */}
      <Glow glow={glow} />
      {layer === 'front' ? fg : <>
      <Ghost on={layer === 'figures'}>
      {deskLamp ? <Halo pos={[LAB_SPOTS.deskBulb[0], LAB_SPOTS.deskBulb[1] - 0.06, LAB_SPOTS.deskBulb[2] + 0.1]} r={0.28} color="#ffcf80" strength={0.45} /> : null}

      <Ground near="#5e4632" far="#54402e" size={[RW, RL]} pos={[RW / 2, 0, RL / 2]} swell={0} patch={0.06} farAt={0.9} map={plank} tile={1.4} />
      <BackWall state={state} /><RightWall state={state} door={door} bolt={bolt} /><LeftWall state={state} /><Ceiling state={state} />
      {wreck ? <Rug pos={[4.75, 0, 1.95]} w={2.3} d={1.5} rotY={0.24} /> : <Rug pos={[4.6, 0, 1.75]} w={2.3} d={1.5} rotY={0.03} />}
      {wreck ? <><WreckedMachine pos={MACH} /><FloorDecal pos={[MACH[0], 0, 1.79 + 2.25 - 0.18]} size={[5, 4.5]} map={scorchTex()} /><EmberBed pts={EMBERS} /></>
        : night ? <Machine pos={MACH} {...machine} /> : <Machine pos={MACH} leverAt={MACHINE.leverSide} {...machine} />}
      {cover && !wreck ? <MachineCover pos={MACH} cover={cover} f={f} /> : null}
      {/* cables: from the plinth across the floor towards the camera; one up the wall to the switch */}
      <Cable pts={[[3.05, 0.25, 1.45], [3.18, 0.03, 1.75], [3.35, 0.03, 2.9], [2.9, 0.03, 4.3], [2.35, 0.03, 6.0], [2.1, 0.03, 7.6]]} />
      <Cable pts={[[0.95, 0.22, 1.76], [0.95, 0.03, 2.2], [1.35, 0.03, 3.5], [1.05, 0.03, 5.1], [1.4, 0.03, 7.4]]} r={0.026} color="#2a2422" />
      <Cable pts={[[2.95, 0.5, 0.95], [3.1, 0.03, 0.6], [3.32, 0.03, 0.25], [3.32, 0.45, 0.06]]} r={0.02} color="#3a2a22" />
      {wreck ? <>
        {/* the desk thrown on its side, what was on it spilt across the floor, the lamp fallen; the stool knocked over */}
        <DeskOverturned pos={[4.65, 0, 1.2]} rotY={-Math.PI / 2} />{/* top against the bed side at x 5.45, legs pointing left at the room */}
        <SpiltPapers pos={[4.35, 0, 2.75]} area={[2.6, 1.9]} n={18} books={5} seed={4} keep={[[LAB_MARKS.victorWreck[0], LAB_MARKS.victorWreck[2], 0.42]]} />
        <FallenLamp pos={[3.85, 0, 2.3]} rotY={0.5} />
        <group position={[3.05, 0.18, 3.0]} rotation={[0, 0.1, 0]}><group rotation={[0, 0, Math.PI / 2 - 0.25]}><Stool pos={[0, 0, 0]} /></group></group>
        <BookPile pos={[LAB_SPOTS.photoFloor[0], 0, LAB_SPOTS.photoFloor[2]]} rotY={0.1} />
        <PhotoCracked pos={LAB_SPOTS.photoFloor} rotY={Math.atan2(LAB_VIEWS.wide.cam[0] - LAB_SPOTS.photoFloor[0], LAB_VIEWS.wide.cam[1] - LAB_SPOTS.photoFloor[2])} lean={0.38} />
        <IronBed pos={[5.98, 0, 0.45]} rotY={0.08} />
      </> : <>
        <LabDesk pos={DESKP} lampOn={deskLamp && night} />
        {night ? <Stool pos={stoolAt ?? [3.4, 0, 3.0]} /> : <Stool pos={[4.15, 0, 3.3]} />}{/* dark: pushed aside, out of the way of the lever */}
        <IronBed pos={[6.15, 0, 0.05]} />
      </>}
      {/* a wastepaper basket, crumpled sheets on the floor, a crate of parts */}
      <FacetLathe profile={[[0.13, 0], [0.17, 0.34], [0.18, 0.36], [0.17, 0.36]]} sides={10} color="#6a5a44" pos={[5.45, 0, 1.25]} tones={[0.85, 1.1, 1]} />
      {[[5.42, 0.36, 1.25], [3.75, 0, 3.05], [4.35, 0, 3.25], [5.15, 0, 3.0], [5.75, 0, 1.6]].map(([x, y, z], i) => <FacetLathe key={i} profile={[[0.035, 0], [0.055, 0.025], [0.05, 0.06], [0.025, 0.085]]} sides={7} wobble={0.35} seed={i + 21} color="#f2ead6" pos={[x, y, z]} s={0.8} contact={y === 0} />)}
      {/* a pile on the floor by the desk: books lying open and shut, a rolled plan, loose sheets */}
      <group position={[4.7, 0, 3.9]} rotation={[0, 0.3, 0]}>
        <B p={[0, 0.03, 0]} s={[0.32, 0.06, 0.24]} c="#5a2e2a" /><B p={[0.02, 0.085, 0.01]} s={[0.28, 0.05, 0.2]} r={[0, 0.25, 0]} c="#2e4a6a" />
        <mesh position={[-0.36, 0.006, 0.1]} rotation={[-Math.PI / 2, 0, 0.4]} receiveShadow><planeGeometry args={[0.36, 0.26]} /><meshLambertMaterial color="#e2d8bc" /></mesh>
        <mesh position={[0.3, 0.008, -0.2]} rotation={[-Math.PI / 2, 0, -0.3]} receiveShadow><planeGeometry args={[0.3, 0.4]} /><meshLambertMaterial map={tex('lab-floorplan', 300, 400, paintPlan('cream', 23))} /></mesh>
        <mesh position={[-0.1, 0.045, -0.28]} rotation={[0, 0.9, Math.PI / 2]} castShadow><cylinderGeometry args={[0.045, 0.045, 0.6, 9]} /><meshLambertMaterial color="#d8ccae" /></mesh>
      </group>
      {crates === false ? null : <><Crate pos={[6.15, 0, 4.6]} s={0.55} rotY={0.2} /><Crate pos={[6.2, 0.55, 4.55]} s={0.4} rotY={-0.15} /></>}
      {view === 'machine' ? <group>
        {/* the near layer for the low view: a coil of spare cable and a toolbox on the floor */}
        {[0, 1, 2].map((k) => <mesh key={k} position={[2.55, 0.03 + k * 0.05, 4.4]} rotation={[-Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.26 - k * 0.02, 0.028, 6, 22]} /><meshLambertMaterial color={k % 2 ? '#2a2624' : '#1f1e22'} /></mesh>)}
        <group position={[0.75, 0, 4.2]} rotation={[0, 0.4, 0]}><B p={[0, 0.13, 0]} s={[0.5, 0.26, 0.24]} c="#7a2a24" /><B p={[0, 0.3, 0]} s={[0.2, 0.04, 0.05]} c="#2a2a2e" /></group>
      </group> : null}
      {extra}
      </Ghost>
      <Ghost on={layer === 'back'}>{children}</Ghost>
      {layer === 'all' ? fg : null}
      </>}
    </group></group></RoomCtx.Provider>
  );
};

/** The scene. Figures are passed as children in ROOM units, with rotY={-yaw} (read it with useContext(RoomCtx)).
 *  machine = the machine's state (lamps lit from the left, glowing coils, gauge needles, lever 0 up .. 1 pulled);
 *  deskLamp = false switches the desk lamp and its light off (shot 9). Neither changes the default picture. */
export const Lab: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; view?: LabView | LabViewSpec; machine?: MachineState; deskLamp?: boolean;
  /** (shots 2-8) layer = which layer this canvas draws (see LabLayer); extra = things added to the SET for one shot (drawn and
   *  blurred with it); fg = a near prop for a third, more blurred layer. All default to the old single picture. */
  layer?: LabLayer; extra?: React.ReactNode; fg?: React.ReactNode;
  /** (shots 9-14) state = which state of the room (LabState, default 'night' = as approved); 'dark' and 'wrecked' force the
   *  desk lamp off and ignore `machine` in 'wrecked'. glow = the machine's light, per frame (LabGlow). */
  state?: LabState; glow?: LabGlow;
  /** (d1c6) gio 'chang-vang' = the room at dusk (state 'night' furniture, desk lamp on, sunset at the window); cover 0..1 = the tarpaulin over the
   *  machine (0 = none = as before, 0.5 = the left half covered, 1 = all, cyan light leaking out); door 0..1 = how shut the corridor door is (undefined = open
   *  as before, 1 = shut with a line of light under it); bolt 0..1 = the slide bolt on the shut door (1 = shot). All default to the old picture. */
  gio?: LabHour; cover?: number; door?: number; bolt?: number;
  /** (d1c6) crates = false leaves out the two crates at the right-hand corner; stoolAt = where the stool stands in the 'night' room (default (3.4, 0, 3.0)) */
  crates?: boolean; stoolAt?: V3}> = ({children, f = 0, dx, dz, view = 'wide', machine, deskLamp = true, layer = 'all', extra, fg, state = 'night', glow, gio, cover, door, bolt, crates, stoolAt}) => {
  const v: LabViewSpec = typeof view === 'string' ? LAB_VIEWS[view] : view, EYE: V3 = [0, v.eye, 0];
  const key = (typeof view === 'string' ? view : `${v.yaw.toFixed(3)}-${v.cam.join('-')}-${v.eye}`) + (state === 'night' ? '' : `-${state}`) + (gio ? `-${gio}` : '');
  const sky: SkyOpt = state === 'night' ? {} : {moon: [0.13, 0.6], time: state === 'dark' ? [11, 56] : [0, 9]};
  return (
    <GradeCtx.Provider value="darkInterior">
      {/* a dim, cool fill for the whole room: night comes in through the window as an ambient blue */}
      <hemisphereLight args={gio === 'chang-vang' ? ['#e0b4c8', '#8a6a5c', 3.4] : state === 'night' ? ['#7686ba', '#665648', 1.0] : state === 'dark' ? ['#6c7cb4', '#5a4c42', 0.8] : ['#7284b4', '#5a524a', 1.0]} />{/* a night room is DIM, not black: everything must still read (0.55 left the lower half of the frame black); 'dark' is a step darker, not black */}
      {layer === 'all' || layer === 'back' ? <><StageCam eye={EYE} haze="#141a2c" fog={[30, 500]} dx={dx} dz={dz} />
      <Plate from={EYE} id={`lab-sky-${key}`} d={300} paint={gio === 'chang-vang' ? duskSky(v) : nightSky(v, sky)} fog={false} /></> : <LayerCam eye={EYE} dx={dx} dz={dz} />}
      <Room v={v} view={typeof view === 'string' ? view : undefined} f={f} machine={machine} deskLamp={deskLamp && state === 'night'} layer={layer} extra={extra} fg={fg} state={state} glow={glow} gio={gio} cover={cover} door={door} bolt={bolt} crates={crates} stoolAt={stoolAt}>{children}</Room>
    </GradeCtx.Provider>
  );
};

export {CALC_LINES};
/** the room alone in each state, the wide view, no people (kho chung, 23/11/2026) */
const LabEmpty: React.FC<{state?: LabState}> = ({state}) => {
  const {width, height} = useVideoConfig();
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><Lab view="wide" state={state} /></ThreeCanvas></Finish></AbsoluteFill>;
};
export const LabComps: React.FC = () => (
  <>
    <Composition id="lab-trong" component={LabEmpty} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="lab-toi-trong" component={() => <LabEmpty state="dark" />} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="lab-do-nat-trong" component={() => <LabEmpty state="wrecked" />} width={1280} height={720} fps={24} durationInFrames={1} />
  </>
);
