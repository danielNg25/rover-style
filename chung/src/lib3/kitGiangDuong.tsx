import React, {useMemo} from 'react';
import * as THREE from 'three';
import {B} from './kit';
import {FacetLathe, Halo} from './look';
import {rnd, Ctx, P, paintCloud} from './depth';
import {tex} from './kitLab';
import {HandWrite, handWidth} from './kitGiayTo';

/** lib3/kitGiangDuong: AN AMERICAN LECTURE ROOM OF THE EARLY 1900s (state `dai-hoc` of src/demo/Classroom.tsx, d1c5 shot 15;
 *  made 23/11/2026). Pieces in ROOM units (the room of Classroom.tsx: x along the front wall, z out from it, y up), so they
 *  go inside its turned group: the window wall with tall wooden sashes (no iron grille) and dark oak wainscot, the front wall
 *  (cream plaster over panelled oak), the big slate blackboard with old faint work on it, chalk that writes itself by frame,
 *  long dark oak desks with benches, green enamel pendant lamps (off), a pull-down wall map, a small painted globe, and the
 *  view through the windows (red brick college front with a clock tower, maples). */
type V3 = [number, number, number];
export const OAK = '#6a4a30', OAK_DARK = '#4a3020', PLASTER = '#f4ecd8';
const blob = (c: Ctx, x: number, y: number, rad: number, col: string) => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); };

// ---------------------------------------------------------------- walls
/** cream plaster over oak wainscot (wainscot `dado` m high): raised panels with lit top edges and dark lower edges, a moulded
 *  chair rail, a skirting board; plaster with soft stains and a few pin holes. ppm = pixels per metre. */
export const wainscotPaint = (W: number, H: number, ppm: number, dado = 1.0, seed = 3) => (c: Ctx) => {
  const r = rnd(seed), top = H - dado * ppm;
  c.fillStyle = PLASTER; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 40; k++) blob(c, r() * W, r() * top, 60 + r() * 160, r() < 0.5 ? 'rgba(255,252,240,0.25)' : 'rgba(150,120,80,0.045)');
  for (let k = 0; k < 4; k++) { const x = r() * W, w = 12 + r() * 30, h = 60 + r() * 160, g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(120,96,60,0.16)'); g.addColorStop(1, 'rgba(120,96,60,0)'); c.fillStyle = g; c.fillRect(x, 0, w, h); }
  c.fillStyle = 'rgba(110,90,60,0.25)'; c.fillRect(0, 0, W, 6);
  // the wainscot
  c.fillStyle = OAK; c.fillRect(0, top, W, H - top);
  for (let k = 0; k < 120; k++) { const y = top + r() * (H - top); c.strokeStyle = r() < 0.5 ? 'rgba(20,10,4,0.25)' : 'rgba(150,110,70,0.18)'; c.lineWidth = 1 + r() * 2; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= W; x += 40) c.lineTo(x, y + Math.sin(x / 70 + k) * 2); c.stroke(); }
  const pw = 0.62 * ppm, ph = (dado - 0.32) * ppm, py = top + 0.12 * ppm;
  for (let x = 0.08 * ppm; x < W - 0.2 * ppm; x += pw + 0.1 * ppm) { c.fillStyle = 'rgba(30,16,8,0.35)'; c.fillRect(x, py, pw, ph); c.fillStyle = '#62432b'; c.fillRect(x + 6, py + 6, pw - 12, ph - 12); c.fillStyle = 'rgba(230,190,140,0.28)'; c.fillRect(x, py, pw, 4); c.fillRect(x, py, 4, ph); c.fillStyle = 'rgba(20,10,4,0.45)'; c.fillRect(x, py + ph - 4, pw, 4); c.fillRect(x + pw - 4, py, 4, ph); }
  c.fillStyle = OAK_DARK; c.fillRect(0, top - 10, W, 14); c.fillStyle = 'rgba(230,190,140,0.4)'; c.fillRect(0, top - 10, W, 3);
  c.fillStyle = OAK_DARK; c.fillRect(0, H - 0.12 * ppm, W, 0.12 * ppm); c.fillStyle = 'rgba(230,190,140,0.25)'; c.fillRect(0, H - 0.12 * ppm, W, 3);
  for (let k = 0; k < 30; k++) { c.fillStyle = `rgba(230,200,160,${0.08 + r() * 0.1})`; c.fillRect(r() * W, top + r() * (H - top), 10 + r() * 40, 2); }
};
/** THE WINDOW WALL of the lecture room (the left wall, x = 0, in room units): oak wainscot up to the sill, cream piers, tall
 *  sash windows in dark oak frames with glazing bars (no grille), a broad oak sill; same openings as the old classroom. */
export const LectureWindowWall: React.FC<{length: number; height: number; sill: number; head: number; windows: [number, number][]; children?: React.ReactNode}> = ({length, height, sill, head, windows, children}) => {
  const piers: [number, number][] = []; let z = 0; windows.forEach(([a, b]) => { piers.push([z, a]); z = b; }); piers.push([z, length]);
  const t = useMemo(() => tex('gd-sidewall-dado', 2048, Math.round((2048 * sill) / length), wainscotPaint(2048, Math.round((2048 * sill) / length), 2048 / length, sill, 7)), [length, sill]);
  return <group>
    <B p={[-0.15, sill / 2, length / 2]} s={[0.3, sill, length]} c={OAK} /><B p={[-0.15, (head + height) / 2, length / 2]} s={[0.3, height - head, length]} c={PLASTER} />
    {piers.map(([a, b]) => <B key={a} p={[-0.15, (sill + head) / 2, (a + b) / 2]} s={[0.3, head - sill, b - a]} c={PLASTER} />)}
    {/* the panelled wainscot below the sill only (the openings stay open) */}
    <mesh position={[0.003, sill / 2, length / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[length, sill]} /><meshLambertMaterial map={t} /></mesh>
    {windows.map(([a, b]) => <group key={a}>
      <B p={[0.02, sill - 0.02, (a + b) / 2]} s={[0.36, 0.06, b - a + 0.16]} c={OAK} />
      {[a + 0.04, b - 0.04].map((zz) => <B key={zz} p={[-0.06, (sill + head) / 2, zz]} s={[0.14, head - sill, 0.08]} c={OAK_DARK} />)}<B p={[-0.06, head - 0.04, (a + b) / 2]} s={[0.14, 0.08, b - a]} c={OAK_DARK} />
      {/* the meeting rail of the sash and the glazing bars: three panes across, two up in each sash */}
      <B p={[-0.14, (sill + head) / 2 + 0.05, (a + b) / 2]} s={[0.05, 0.06, b - a]} c={OAK_DARK} />
      {[1, 2].map((k) => <B key={k} p={[-0.14, (sill + head) / 2, a + (k * (b - a)) / 3]} s={[0.025, head - sill, 0.025]} c={OAK_DARK} cast={false} />)}
      {[0.25, 0.75].map((k) => <B key={k} p={[-0.14, sill + (head - sill) * k, (a + b) / 2]} s={[0.025, 0.025, b - a]} c={OAK_DARK} cast={false} />)}
    </group>)}
    {children}
  </group>;
};

// ---------------------------------------------------------------- the blackboard and the chalk
/** slate board: dark green-black slate with wide erased swirls, a faint grid of old work on the RIGHT part (a circle and a
 *  triangle with labels, a column of sums half wiped), the left part clean for the new work; worn corners. w x h metres. */
const slateTex = (w: number, h: number, sach = false) => tex(`gd-slate-${w}-${h}${sach ? '-sach' : ''}`, 2048, Math.round((2048 * h) / w), (c, W, H) => {
  const r = rnd(9); c.fillStyle = '#2f453d'; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 30; k++) { c.strokeStyle = `rgba(225,232,222,${0.03 + r() * 0.05})`; c.lineWidth = 30 + r() * 60; c.beginPath(); c.arc(r() * W, r() * H, 60 + r() * 160, r() * 6, r() * 6 + 2.5); c.stroke(); }
  for (let k = 0; k < 600; k++) { c.fillStyle = `rgba(230,236,228,${0.02 + r() * 0.04})`; c.fillRect(r() * W, r() * H, 2 + r() * 4, 1 + r() * 2); }
  if (!sach) {   // sach = bảng đã lau, không có hình và phép tính mờ cũ ở nửa phải (d1c6 cảnh 3: hai người cùng viết)
  const ch = 'rgba(236,238,230,0.42)'; c.strokeStyle = ch; c.lineWidth = 5; c.lineCap = 'round';
  const x0 = W * 0.66; c.beginPath(); c.arc(x0 + 120, H * 0.38, 110, 0, 7); c.stroke(); c.beginPath(); c.moveTo(x0 + 10, H * 0.38); c.lineTo(x0 + 230, H * 0.38); c.moveTo(x0 + 120, H * 0.38); c.lineTo(x0 + 190, H * 0.16); c.stroke();
  c.beginPath(); c.moveTo(x0 + 330, H * 0.6); c.lineTo(x0 + 560, H * 0.6); c.lineTo(x0 + 560, H * 0.2); c.closePath(); c.stroke();
  c.font = `60px "Chalkboard SE", "Comic Sans MS", cursive`; c.fillStyle = ch; c.fillText('a', x0 + 430, H * 0.68); c.fillText('b', x0 + 580, H * 0.42); c.fillText('c', x0 + 410, H * 0.38); c.fillText('r', x0 + 160, H * 0.33);
  c.fillStyle = 'rgba(236,238,230,0.3)'; c.fillText('a² + b² = c²', x0 + 300, H * 0.82);
  for (let k = 0; k < 4; k++) { c.fillStyle = 'rgba(236,238,230,0.18)'; c.fillRect(W * 0.52, H * (0.2 + k * 0.14), 120 + ((k * 97) % 90), 7); }
  }
  const e = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.6); e.addColorStop(0, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(10,20,16,0.3)'); c.fillStyle = e; c.fillRect(0, 0, W, H);
});
/** THE BLACKBOARD on the front wall (room units): centre x, bottom y0, width w, height h; an oak frame, a chalk tray with
 *  sticks of chalk and a felt duster. Its writing face is at z = 0.07 (BOARD_Z). */
export const BOARD_Z = 0.078;
export const Blackboard: React.FC<{x: number; y0: number; w: number; h: number; sach?: boolean}> = ({x, y0, w, h, sach}) => <group>
  <B p={[x, y0 + h / 2, 0.035]} s={[w + 0.16, h + 0.16, 0.07]} c={OAK_DARK} />
  <mesh position={[x, y0 + h / 2, BOARD_Z]} receiveShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={slateTex(w, h, sach)} /></mesh>
  <B p={[x, y0 - 0.07, 0.1]} s={[w + 0.1, 0.04, 0.14]} c={OAK} /><B p={[x, y0 - 0.045, 0.165]} s={[w + 0.1, 0.03, 0.01]} c={OAK_DARK} cast={false} />
  {[[-0.9, '#f4f2ea'], [-0.75, '#f4f2ea'], [0.6, '#f2e6a0'], [1.2, '#f4f2ea']].map(([dx, col]) => <B key={dx as number} p={[x + (dx as number), y0 - 0.04, 0.1]} s={[0.08, 0.02, 0.02]} c={col as string} cast={false} />)}
  <B p={[x + 0.9, y0 - 0.025, 0.1]} s={[0.2, 0.05, 0.07]} c="#4a3a2e" /><B p={[x + 0.9, y0 - 0.045, 0.1]} s={[0.21, 0.02, 0.08]} c="#c9c0ae" cast={false} />
</group>;
/** CHALK THAT WRITES ITSELF (room units, on the board face): lines = [text, x of its left end, y of its middle, frame it
 *  starts, frame it ends]; letters h tall, white chalk with a faint bloom, a pale glow at the chalk tip while writing.
 *  under = [x0, x1, y, frame] for underline strokes (each drawn in 3 frames). CHALK_SHOT15 = the three lines of shot 15. */
export type ChalkLine = [string, number, number, number, number];
export const CHALK_SHOT15: {lines: ChalkLine[]; under: [number, number, number, number][]; h: number} = {
  h: 0.13,
  lines: [['x² − 5x + 6 = 0', 2.05, 2.22, 2, 12], ['(x − 2)(x − 3) = 0', 2.05, 1.92, 13, 23], ['x = 2 ;  x = 3', 2.05, 1.62, 24, 34]],
  under: [[2.0, 3.05, 1.52, 36], [2.04, 3.0, 1.49, 38]],
};
export const ChalkWriting: React.FC<{f: number; lines?: ChalkLine[]; under?: [number, number, number, number][]; h?: number; z?: number}> = ({f, lines = CHALK_SHOT15.lines, under = CHALK_SHOT15.under, h = CHALK_SHOT15.h, z = BOARD_Z + 0.004}) => <group>
  {lines.map(([t, x, y, a, b], i) => <HandWrite key={i} text={t} pos={[x, y, z]} h={h} p={(f - a) / (b - a)} color="#f2f2ea" halo="rgba(240,244,236,0.18)" nib="#ffffff" order={6} />)}
  {under.map(([x0, x1, y, at], i) => { const q = Math.min(1, Math.max(0, (f - at) / 3)); if (q <= 0) return null; const w = (x1 - x0) * q; return <mesh key={`u${i}`} position={[x0 + w / 2, y, z]} rotation={[0, 0, i ? 0.012 : -0.008]} renderOrder={6}><planeGeometry args={[w, h * 0.09]} /><meshBasicMaterial color="#f2f2ea" transparent opacity={0.9} depthWrite={false} toneMapped={false} /></mesh>; })}
</group>;
/** the width a chalk line takes (to place the hand at its growing end): x + chalkWidth(text) * p */
export const chalkWidth = (text: string, h = CHALK_SHOT15.h) => handWidth(text, h);

// ---------------------------------------------------------------- furniture and fittings
/** A LONG LECTURE DESK with its bench (room units, foot at pos, front of the desk toward +z like the old Desk): dark oak top
 *  1.5 x 0.46 with a lit front edge, a closed front panel with two sunk panels, end standards, a footrail; the bench behind it;
 *  nothing on it. */
export const LectureDesk: React.FC<{pos: V3; seed?: number}> = ({pos, seed = 1}) => {
  const r = rnd(seed), rot = (r() - 0.5) * 0.04;
  return <group position={[pos[0], 0, pos[2]]} rotation={[0, rot, 0]}>
    <B p={[0, 0.74, 0]} s={[1.56, 0.05, 0.48]} c={OAK} /><B p={[0, 0.715, 0.245]} s={[1.56, 0.02, 0.01]} c="#8a6444" cast={false} />
    <B p={[0, 0.42, -0.22]} s={[1.5, 0.6, 0.03]} c={OAK_DARK} />{[-0.37, 0.37].map((x) => <B key={x} p={[x, 0.42, -0.236]} s={[0.6, 0.44, 0.01]} c="#4a3020" cast={false} />)}
    {[-0.76, 0.76].map((x) => <B key={x} p={[x, 0.37, 0]} s={[0.05, 0.74, 0.46]} c={OAK_DARK} />)}<B p={[0, 0.08, 0.1]} s={[1.48, 0.04, 0.04]} c={OAK_DARK} cast={false} />
    <B p={[0, 0.44, 0.56]} s={[1.5, 0.05, 0.28]} c={OAK} />{[-0.68, 0.68].map((x) => <B key={x} p={[x, 0.21, 0.56]} s={[0.05, 0.42, 0.24]} c={OAK_DARK} />)}
    <B p={[0, 0.74, 0.7]} s={[1.5, 0.3, 0.03]} c={OAK_DARK} />
  </group>;
};
/** a pendant lamp hanging from the ceiling (room units, pos = the ceiling point): a rod, a green enamel cone shade with a
 *  white inside, the bulb off */
export const PendantLamp: React.FC<{pos: V3; drop?: number}> = ({pos, drop = 1.0}) => <group position={pos}>
  <B p={[0, -drop / 2, 0]} s={[0.02, drop, 0.02]} c="#2a2a26" cast={false} />
  <FacetLathe profile={[[0.03, 0], [0.06, -0.04], [0.24, -0.2], [0.25, -0.22]]} sides={12} color="#2f6a4a" pos={[0, -drop, 0]} contact={false} tones={[1, 0.9, 1.1, 1]} />
  <mesh position={[0, -drop - 0.17, 0]}><boxGeometry args={[0.07, 0.07, 0.07]} /><meshLambertMaterial color="#e8e4d6" /></mesh>
</group>;
/** a pull-down wall map (room units, on the front wall): an oak roller at the top with a cord and ring, the cloth map (the two
 *  hemispheres, blue sea, ochre and green land, a cartouche), a wooden batten at the bottom */
const wallMapTex = () => tex('gd-wallmap', 512, 640, (c, W, H) => {
  const r = rnd(4); c.fillStyle = '#efe3c2'; c.fillRect(0, 0, W, H);
  [[W * 0.28, H * 0.48], [W * 0.72, H * 0.48]].forEach(([x, y], i) => { const R = W * 0.21; c.fillStyle = '#9fc4d2'; c.beginPath(); c.arc(x, y, R, 0, 7); c.fill(); c.save(); c.beginPath(); c.arc(x, y, R, 0, 7); c.clip();
    for (let k = 0; k < 9; k++) { c.fillStyle = r() < 0.5 ? '#c9b06a' : '#8aa860'; c.beginPath(); c.ellipse(x + (r() - 0.5) * R * 1.3, y + (r() - 0.5) * R * 1.5 + (i ? 0 : 0), R * (0.12 + r() * 0.22), R * (0.1 + r() * 0.3), r() * 3, 0, 7); c.fill(); }
    c.strokeStyle = 'rgba(60,70,90,0.35)'; c.lineWidth = 1.5; for (let k = -3; k <= 3; k++) { c.beginPath(); c.ellipse(x, y, Math.abs(k) * R / 3.5 + 1, R, 0, 0, 7); c.stroke(); c.beginPath(); c.moveTo(x - R, y + (k * R) / 3.5); c.lineTo(x + R, y + (k * R) / 3.5); c.stroke(); } c.restore();
    c.strokeStyle = '#3e2818'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, R, 0, 7); c.stroke(); });
  c.fillStyle = '#3e2818'; c.fillRect(W * 0.2, H * 0.08, W * 0.6, H * 0.08); c.fillStyle = '#efe3c2'; c.font = `bold ${H * 0.045}px Georgia, serif`; c.textAlign = 'center'; c.fillText('✦  ✦  ✦', W / 2, H * 0.135);
  c.strokeStyle = '#3e2818'; c.lineWidth = 6; c.strokeRect(10, 10, W - 20, H - 20);
  for (let k = 0; k < 20; k++) blob(c, r() * W, r() * H, 20 + r() * 50, 'rgba(150,110,60,0.08)');
});
export const WallMap: React.FC<{x: number; y: number; w?: number; h?: number}> = ({x, y, w = 0.8, h = 1.0}) => <group position={[x, y, 0.04]}>
  <mesh receiveShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={wallMapTex()} /></mesh>
  <mesh position={[0, h / 2 + 0.03, 0.02]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.03, 0.03, w + 0.1, 10]} /><meshLambertMaterial color={OAK} /></mesh>
  <B p={[0, -h / 2 - 0.02, 0.01]} s={[w + 0.04, 0.04, 0.03]} c={OAK} /><B p={[0, -h / 2 - 0.12, 0.012]} s={[0.006, 0.16, 0.006]} c="#c9b07a" cast={false} />
</group>;
/** a small globe on a turned stand, drawn flat (a picture, so it can sit on a desk in the turned room via Spr) */
export const paintDeskGlobe = (c: Ctx, W: number, H: number) => {
  const cx = W / 2, cy = H * 0.4, R = W * 0.34;
  c.fillStyle = '#5a3c26'; c.beginPath(); c.ellipse(cx, H * 0.95, W * 0.28, H * 0.04, 0, 0, 7); c.fill(); c.fillRect(cx - 6, cy + R * 0.6, 12, H * 0.95 - cy - R * 0.6);
  c.strokeStyle = '#b08a4a'; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R + 8, Math.PI * 0.6, Math.PI * 2.4); c.stroke();
  c.fillStyle = '#7fb0c6'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip();
  P(c, [[cx - R * 0.7, cy - R * 0.5], [cx - R * 0.2, cy - R * 0.7], [cx - R * 0.1, cy - R * 0.1], [cx - R * 0.4, cy + R * 0.2], [cx - R * 0.6, cy + R * 0.1]], '#9ab46a');
  P(c, [[cx + R * 0.1, cy - R * 0.6], [cx + R * 0.6, cy - R * 0.5], [cx + R * 0.5, cy + R * 0.1], [cx + R * 0.3, cy + R * 0.6], [cx + R * 0.15, cy + R * 0.1]], '#c9b06a');
  const g = c.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.1, cx, cy, R); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(20,30,60,0.35)'); c.fillStyle = g; c.fillRect(cx - R, cy - R, 2 * R, 2 * R); c.restore();
  c.strokeStyle = '#2a3a4a'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
};

// ---------------------------------------------------------------- through the windows (screen units 1600 x 900, from the room's eye)
/** the college across the lawn: a long red-brick front with white-trimmed windows in three rows, a slate roof with dormers,
 *  a clock tower with a white face and a flag; lawn and a path in front; lit from the left */
export const paintCollegeFront = (c: Ctx) => {
  const r = rnd(12), base = 560, top = 300;
  c.fillStyle = '#8a9a6a'; c.fillRect(-320, base, 1500, 400); c.fillStyle = '#c9b99a'; P(c, [[120, 900], [260, base], [300, base], [260, 900]], '#d2c4a4');
  c.fillStyle = '#a34a36'; c.fillRect(-260, top, 980, base - top); c.fillStyle = '#8a3c2c'; c.fillRect(560, top, 160, base - top);
  for (let y = top + 6; y < base; y += 9) { c.fillStyle = 'rgba(60,20,14,0.18)'; c.fillRect(-260, y, 980, 2); }
  for (let row = 0; row < 3; row++) for (let x = -240; x < 700; x += 62) { const y = top + 30 + row * 78; c.fillStyle = '#efe6d2'; c.fillRect(x - 3, y - 3, 34, 52); c.fillStyle = r() < 0.3 ? '#e8c98a' : '#3e4c5e'; c.fillRect(x, y, 28, 46); c.fillStyle = '#efe6d2'; c.fillRect(x + 13, y, 2, 46); c.fillRect(x, y + 22, 28, 2); }
  c.fillStyle = '#efe6d2'; c.fillRect(-260, top - 8, 980, 10);
  P(c, [[-280, top - 6], [-200, top - 70], [700, top - 70], [740, top - 6]], '#5f6670'); P(c, [[460, top - 70], [700, top - 70], [740, top - 6], [560, top - 6]], '#4f5660');
  [-120, 40, 200, 520].forEach((x) => { P(c, [[x, top - 30], [x + 20, top - 60], [x + 40, top - 30]], '#4f5660'); c.fillStyle = '#efe6d2'; c.fillRect(x + 10, top - 44, 20, 16); });
  // the clock tower
  const tx = 230; c.fillStyle = '#a34a36'; c.fillRect(tx, 90, 120, top - 60); c.fillStyle = '#8a3c2c'; c.fillRect(tx + 84, 90, 36, top - 60);
  c.fillStyle = '#efe6d2'; c.fillRect(tx - 6, 84, 132, 10); P(c, [[tx - 10, 86], [tx + 60, 20], [tx + 130, 86]], '#5f6670'); P(c, [[tx + 60, 20], [tx + 130, 86], [tx + 84, 86]], '#4f5660');
  c.strokeStyle = '#3a2a20'; c.lineWidth = 3; c.beginPath(); c.moveTo(tx + 60, 20); c.lineTo(tx + 60, -10); c.stroke(); P(c, [[tx + 60, -10], [tx + 86, -4], [tx + 60, 2]], '#c23a2a');
  c.beginPath(); c.arc(tx + 60, 150, 34, 0, 7); c.fillStyle = '#f6f0dc'; c.fill(); c.strokeStyle = '#3a2a20'; c.lineWidth = 4; c.stroke(); c.beginPath(); c.moveTo(tx + 60, 150); c.lineTo(tx + 60, 126); c.moveTo(tx + 60, 150); c.lineTo(tx + 78, 158); c.stroke();
  for (let row = 0; row < 2; row++) { c.fillStyle = '#3e4c5e'; c.fillRect(tx + 46, 200 + row * 60, 28, 40); }
  paintCloud(c, -100, 120, 0.7, {light: '#fbf7ee', dark: '#e9e4d8'}); paintCloud(c, 560, 60, 0.5, {light: '#fbf6ea', dark: '#ebe3d2'});
};
/** maples in autumn between the room and the college: two round crowns of clustered leaves in three reds and oranges, dark
 *  trunks, a few fallen leaves on the lawn */
export const paintWindowMaples = (c: Ctx) => {
  const r = rnd(22); [[60, 330, 150], [470, 360, 120]].forEach(([x, y, R]) => {
    c.fillStyle = '#4a3426'; c.fillRect(x - 10, y, 20, 300);
    for (let k = 0; k < 160; k++) { const a = r() * 6.28, d = Math.sqrt(r()) * R; c.beginPath(); c.arc(x + Math.cos(a) * d, y - 40 + Math.sin(a) * d * 0.8, 10 + r() * 14, 0, 7); c.fillStyle = ['#a4302a', '#cc4a2c', '#ec8f3e', '#d8672e'][Math.floor(r() * 4)]; c.fill(); }
  });
  for (let k = 0; k < 40; k++) { c.fillStyle = ['#c8462e', '#e2a23a'][k % 2]; c.beginPath(); c.ellipse(-200 + r() * 1000, 640 + r() * 200, 8, 4, r() * 3, 0, 7); c.fill(); }
};
/** a picture rail across a wall and framed portraits hanging from it (room units, on the front wall at z 0): oak rail at
 *  y, each portrait [x, w, h] an oval of a bearded scholar in sepia inside a gilt frame, hung on two cords */
const portraitTex = (seed: number) => tex(`gd-portrait-${seed}`, 256, 320, (c, W, H) => { const r = rnd(seed); c.fillStyle = '#c9a24a'; c.fillRect(0, 0, W, H); c.fillStyle = '#8a6a2a'; c.fillRect(10, 10, W - 20, H - 20); c.fillStyle = '#d8c8a0'; c.beginPath(); c.ellipse(W / 2, H / 2, W * 0.36, H * 0.38, 0, 0, 7); c.fill();
  c.fillStyle = '#5a4630'; c.beginPath(); c.ellipse(W / 2, H * 0.78, W * 0.3, H * 0.2, 0, Math.PI, 0); c.fill(); c.fillStyle = '#b89a78'; c.beginPath(); c.ellipse(W / 2, H * 0.42, W * 0.13, H * 0.14, 0, 0, 7); c.fill();
  c.fillStyle = r() < 0.5 ? '#8a8078' : '#4a3a2e'; c.beginPath(); c.ellipse(W / 2, H * 0.55, W * 0.12, H * 0.08, 0, 0, Math.PI); c.fill(); c.fillStyle = '#3a2a1e'; c.fillRect(W * 0.43, H * 0.4, 8, 4); c.fillRect(W * 0.53, H * 0.4, 8, 4); });
export const PictureRail: React.FC<{y: number; x0: number; x1: number; portraits?: [number, number, number][]}> = ({y, x0, x1, portraits = []}) => <group>
  <B p={[(x0 + x1) / 2, y, 0.025]} s={[x1 - x0, 0.06, 0.05]} c={OAK} /><B p={[(x0 + x1) / 2, y + 0.035, 0.03]} s={[x1 - x0, 0.015, 0.06]} c={OAK_DARK} cast={false} />
  {portraits.map(([x, w, h], i) => <group key={i} position={[x, y - 0.12 - h / 2, 0.03]} rotation={[0, 0, (i % 2 ? 1 : -1) * 0.015]}>
    <mesh castShadow receiveShadow><boxGeometry args={[w, h, 0.03]} /><meshLambertMaterial color="#b08a3a" /></mesh><mesh position={[0, 0, 0.016]}><planeGeometry args={[w * 0.92, h * 0.92]} /><meshLambertMaterial map={portraitTex(i + 3)} /></mesh>
    {[-1, 1].map((k) => <B key={k} p={[k * w * 0.3, h / 2 + 0.06, -0.005]} s={[0.006, 0.14, 0.004]} c="#6a5a3a" cast={false} />)}
  </group>)}
</group>;
void Halo;
