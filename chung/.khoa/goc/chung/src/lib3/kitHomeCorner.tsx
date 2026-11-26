import React, {useMemo} from 'react';
import * as THREE from 'three';
import {NguonBui} from './buiNguon';
import {B} from './kit';
import {FacetLathe, Halo, lathe} from './look';
import {rnd} from './depth';
import {canvasTex, once} from './room';

/** lib3/kitHomeCorner: a corner of a home today (set NHA of the "Tesla và Edison" passage, src/demo/HomeCorner.tsx), usable by
 *  any close insert on a wall of a flat or house: a painted wall with a soft mottle and a wall calendar; a white double wall
 *  socket of the Vietnamese kind (two round holes per outlet); a black plug with its cable sagging along a path; a small wooden
 *  side table; a modern desk lamp with a white shade that switches on (the shade glows, a warm pool spreads on the wall); a tea
 *  cup; and a SINE WAVE that draws itself along any path (current running along a wire, a line across a map).
 *  Every piece faces +z (the wall is the plane z = 0). Positions in metres. */
type V3 = [number, number, number];
const col = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), Math.min(1, Math.max(0, t))).getHexString();
const clamp = (x: number) => Math.min(1, Math.max(0, x));

// ================================================================ the wall
const wallTex = (seed: number) => canvasTex(1024, 768, (c) => {
  const r = rnd(seed); c.fillStyle = '#ffffff'; c.fillRect(0, 0, 1024, 768);
  // a soft mottle of roller marks and damp: large faint patches, a few long vertical streaks, fine speckle
  for (let i = 0; i < 70; i++) { const x = r() * 1024, y = r() * 768, rr = 60 + r() * 220, g = c.createRadialGradient(x, y, 0, x, y, rr), d = r() < 0.5; g.addColorStop(0, d ? 'rgba(120,100,70,0.07)' : 'rgba(255,255,255,0.09)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  for (let i = 0; i < 16; i++) { const x = r() * 1024, w = 30 + r() * 60; c.fillStyle = `rgba(110,90,60,${0.02 + r() * 0.03})`; c.fillRect(x, 0, w, 768); }
  for (let i = 0; i < 2600; i++) { c.fillStyle = r() < 0.5 ? 'rgba(90,70,50,0.10)' : 'rgba(255,255,255,0.14)'; c.fillRect(r() * 1024, r() * 768, 1.5, 1.5); }
  // a hairline crack low on the left, a nail hole with a faint mark where a picture once hung
  c.strokeStyle = 'rgba(80,64,44,0.35)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(70, 640); c.lineTo(96, 610); c.lineTo(92, 590); c.lineTo(120, 552); c.stroke();
  c.fillStyle = 'rgba(60,50,40,0.6)'; c.beginPath(); c.arc(780, 140, 2.5, 0, 7); c.fill(); c.strokeStyle = 'rgba(120,100,70,0.12)'; c.strokeRect(700, 150, 160, 120);
});
/** A painted wall standing in the plane z = 0 (front facing +z): w x h metres, centred on x = 0, foot at y = 0; color = the
 *  paint (cream by default); a soft mottle, a hairline crack, a nail hole; a skirting board. */
export const PaintedWall: React.FC<{w?: number; h?: number; color?: string; seed?: number}> = ({w = 5, h = 3, color = '#ead9a6', seed = 3}) => {
  const map = useMemo(() => wallTex(seed), [seed]);
  return (
    <group>
      <mesh position={[0, h / 2, 0]} receiveShadow><planeGeometry args={[w, h]} /><meshLambertMaterial color={color} map={map} /></mesh>
      <B p={[0, 0.05, 0.008]} s={[w, 0.1, 0.016]} c={col(color, '#5a4a38', 0.55)} cast={false} />
    </group>
  );
};
const calTex = once(() => canvasTex(360, 520, (c) => {
  c.fillStyle = '#f6f2e8'; c.fillRect(0, 0, 360, 520);
  c.fillStyle = '#c0392b'; c.fillRect(0, 0, 360, 70); c.fillStyle = '#ffffff'; c.font = '700 34px "Helvetica Neue", Arial'; c.fillText('THÁNG 11', 24, 48);
  c.fillStyle = '#7a8a9a'; c.font = '600 18px Arial'; ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach((d, i) => c.fillText(d, 18 + i * 48, 106));
  for (let k = 0; k < 35; k++) { const i = k % 7, j = Math.floor(k / 7), n = k - 5; if (n < 1 || n > 30) continue; c.fillStyle = i === 6 ? '#c0392b' : '#3a3a40'; c.font = '700 22px Arial'; c.fillText(String(n), 20 + i * 48, 150 + j * 52); }
  c.strokeStyle = '#c0392b'; c.lineWidth = 3; c.beginPath(); c.arc(20 + 6 * 48 + 12, 150 + 3 * 52 - 8, 20, 0, 7); c.stroke();
  c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(0, 500, 360, 20);
}));
/** A wall calendar hanging flat on the wall: a red header and a month of dates (only the lower part need show). pos = its
 *  bottom centre; w = width. */
export const WallCalendar: React.FC<{pos: V3; w?: number}> = ({pos, w = 0.36}) => {
  const h = (w * 520) / 360;
  return <group position={pos}>
    <mesh position={[0.006, h / 2 - 0.006, 0.003]}><planeGeometry args={[w, h]} /><meshBasicMaterial color="#000000" transparent opacity={0.18} /></mesh>
    <mesh position={[0, h / 2, 0.006]} receiveShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={calTex()} /></mesh>
    <mesh position={[0, 0.004, 0.012]} rotation={[-0.5, 0, 0]}><planeGeometry args={[w, 0.012]} /><meshLambertMaterial color="#e8e2d2" /></mesh>
  </group>;
};

// ================================================================ socket, plug, cable
/** A white double wall socket of the Vietnamese kind: a rounded plate with two outlets side by side, each a recessed round
 *  face with two round holes. pos = its centre on the wall; plug = which outlet holds a plug (-1 left, 1 right, 0 none). */
export const SOCKET = {w: 0.15, h: 0.085, pitch: 0.068};
export const WallSocket: React.FC<{pos: V3; plug?: -1 | 0 | 1}> = ({pos, plug = 1}) => (
  <group position={pos}>
    <B p={[0.003, -0.003, 0.004]} s={[SOCKET.w + 0.006, SOCKET.h + 0.006, 0.004]} c="#b8ae96" cast={false} />
    <B p={[0, 0, 0.011]} s={[SOCKET.w, SOCKET.h, 0.014]} c="#f4f2ec" />
    <B p={[0, 0, 0.019]} s={[0.004, SOCKET.h - 0.02, 0.002]} c="#dcd8ce" cast={false} />
    {[-1, 1].map((q) => <group key={q} position={[q * SOCKET.pitch / 2, 0, 0.019]}>
      <mesh><circleGeometry args={[0.024, 20]} /><meshLambertMaterial color="#e2ded4" /></mesh>
      {q !== plug ? [-1, 1].map((k) => <mesh key={k} position={[k * 0.0095, 0, 0.001]}><circleGeometry args={[0.0042, 12]} /><meshBasicMaterial color="#26241f" /></mesh>) : null}
    </group>)}
    {plug ? <group position={[plug * SOCKET.pitch / 2, 0, 0.02]}>
      <B p={[0, 0, 0.018]} s={[0.036, 0.044, 0.034]} c="#1e1e22" />
      <B p={[0, 0.006, 0.0352]} s={[0.026, 0.018, 0.002]} c="#34343a" cast={false} />
      <B p={[0, -0.03, 0.02]} s={[0.014, 0.022, 0.014]} c="#1e1e22" />
    </group> : null}
  </group>
);
/** a smooth path through points (the cable's line; the wave follows the same) */
export const pathCurve = (pts: V3[]) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.4);
/** A black electric cable along a path (a sag from a plug, across a table): a thin round tube with a dull shine. */
export const Cable: React.FC<{pts: V3[]; r?: number; color?: string}> = ({pts, r = 0.0042, color = '#16161a'}) => {
  const geo = useMemo(() => new THREE.TubeGeometry(pathCurve(pts), 80, r, 6, false), [JSON.stringify(pts), r]);
  return <mesh geometry={geo} castShadow><meshLambertMaterial color={color} /></mesh>;
};

// ================================================================ table, lamp, cup
/** A small wooden side table against the wall: top w x d at height h, four square legs, an apron; warm brown wood with grain
 *  strips and one pale ring where a wet glass stood. pos = the middle of its back edge on the floor. */
export const SideTable: React.FC<{pos: V3; w?: number; d?: number; h?: number; wood?: string}> = ({pos, w = 0.72, d = 0.42, h = 0.72, wood = '#8a5a36'}) => {
  const dark = col(wood, '#2a1a10', 0.35), light = col(wood, '#f0c89a', 0.18);
  return (
    <group position={pos}>
      <B p={[0, h - 0.016, d / 2]} s={[w, 0.032, d]} c={wood} />
      <B p={[0, h - 0.001, d / 2]} s={[w - 0.01, 0.002, d - 0.01]} c={light} cast={false} />
      {[-0.4, -0.31, -0.17, -0.02, 0.09, 0.24, 0.37].map((x, i) => <B key={i} p={[x * w, h + 0.0015, d / 2 + (i % 2 ? 0.03 : -0.02)]} s={[w * 0.012, 0.001, d * (0.6 + (i % 3) * 0.12)]} c={col(wood, dark, 0.5)} cast={false} />)}
      <mesh position={[w * 0.3, h + 0.002, d * 0.68]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.028, 0.034, 24]} /><meshBasicMaterial color={light} transparent opacity={0.5} /></mesh>
      <B p={[0, h - 0.07, d / 2]} s={[w - 0.08, 0.08, d - 0.08]} c={dark} />
      {[[-1, 0], [1, 0], [-1, 1], [1, 1]].map(([sx, sz], i) => <B key={i} p={[sx * (w / 2 - 0.035), (h - 0.03) / 2, sz ? d - 0.035 : 0.035]} s={[0.04, h - 0.03, 0.04]} c={wood} />)}
    </group>
  );
};
/** A modern desk lamp: a round white base, a thin upright stem, a white drum shade wider at the foot. on = 0..1 (above 1 for
 *  the swell just after switching on): the shade glows from inside, a warm halo, real warm light on the wall and the table.
 *  pos = the centre of its base on the table. */
export const LAMP = {stem: 0.3, shade: 0.17};
const shadeGlow = once(() => lathe([[0.13, 0], [0.12, 0.05], [0.1, LAMP.shade]], 20, 1));
/** bui (mặc định true): đèn tự đăng ký nguồn bụi (lib3/buiNguon) tại thân đèn ('den', khi bật). */
export const DeskLamp: React.FC<{pos: V3; on?: number; f?: number; tone?: string; bui?: boolean}> = ({pos, on = 0, f = 0, tone = '#ffcf86', bui = true}) => {
  const L = clamp(on), sw = Math.max(1, Math.min(1.5, on)), sy = 0.012 + LAMP.stem;
  return (
    <group position={pos}>
      <FacetLathe profile={[[0.085, 0], [0.085, 0.01], [0.075, 0.016], [0.02, 0.02]]} sides={16} color="#f0eee8" />
      <FacetLathe pos={[0, 0.016, 0]} profile={[[0.008, 0], [0.008, LAMP.stem]]} sides={8} color="#d8d6d0" contact={false} />
      <FacetLathe pos={[0, sy, 0]} profile={[[0.13, 0], [0.12, 0.05], [0.1, LAMP.shade]]} sides={20} color={col('#ecebe6', '#fff3d6', L)} contact={false} cast={L < 0.05} />
      {L > 0.02 ? <>
        <mesh geometry={shadeGlow()} position={[0, sy, 0]} scale={[1.012, 1, 1.012]} renderOrder={4}><meshBasicMaterial color={tone} transparent opacity={0.55 * L} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.FrontSide} /></mesh>
        <mesh position={[0, sy - 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.125, 20]} /><meshBasicMaterial color={col('#ffeac0', '#fffaf0', L)} transparent opacity={L} /></mesh>
        <Halo pos={[0, sy + 0.08, 0.16]} r={0.42 * sw * L} color={tone} strength={0.3 * L} />{bui && L > 0.1 ? <NguonBui kieu="den" pos={[0, sy, 0.02]} r={0.5} mau={tone} k={L} /> : null}
        <pointLight position={[0, sy + 0.05, 0.02]} color={tone} intensity={0.42 * L} distance={2.2} decay={1.6} />
        <pointLight position={[0, sy - 0.03, 0.0]} color={tone} intensity={0.25 * L} distance={0.9} decay={1.6} />
      </> : null}
    </group>
  );
};
/** A tea cup on its saucer: white glazed with a thin blue band, a little steam is not drawn. pos = the foot on a surface. */
export const TeaCup: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <FacetLathe profile={[[0.06, 0], [0.065, 0.006], [0.05, 0.01]]} sides={16} color="#efede6" />
    <FacetLathe pos={[0, 0.008, 0]} profile={[[0.022, 0], [0.03, 0.01], [0.038, 0.04], [0.04, 0.05]]} sides={16} color="#f2f0ea" contact={false} tones={[0.9, 1.0, 1.12]} />
    <FacetLathe pos={[0, 0.04, 0]} profile={[[0.0395, 0], [0.0405, 0.006]]} sides={16} color="#4a6fa8" contact={false} cast={false} />
    <mesh position={[0.045, 0.034, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.011, 0.003, 6, 12, Math.PI]} /><meshLambertMaterial color="#efede6" /></mesh>
    <mesh position={[0, 0.056, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.035, 16]} /><meshLambertMaterial color="#9a6a2a" /></mesh>
  </group>
);
