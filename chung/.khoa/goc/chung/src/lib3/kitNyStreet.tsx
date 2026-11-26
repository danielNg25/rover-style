import React, {useMemo} from 'react';
import * as THREE from 'three';
import {NguonBui} from './buiNguon';
import {B, LocoSmoke} from './kit';
import {FacetLathe, Halo} from './look';
import {Sprite, rnd, P, Ctx} from './depth';
import {useSurface, useWear, Sign, Awning, Paper} from './detail';
import {canvasTex, once} from './room';
import {Face, Roof} from './kitCampus';
import {BulbHalo} from './fx';

/** lib3/kitNyStreet: a city street of the 1880s (set PH of the "Tesla và Edison" passage, src/demo/NyStreet.tsx), usable by any
 *  19th-century town street at dusk or by day: brick and stone shop houses with a shop front, sign and striped awning on the
 *  ground floor; an electric power station of red brick with an arched iron door, two chimneys and a big knife switch on its
 *  front; timber poles with many cross-arms and a tangle of wires; cast-iron electric lamps whose globe, halo, pool of light and
 *  real light all follow one level (so a shot can switch them on one after another, or make one flicker); cobbles; a ditch dug
 *  in the road with its heap of earth, planks, tools and a red flag; clods of earth thrown up out of the ditch; a grey stone
 *  office with a gable end; the far tower of a suspension bridge for a backdrop plate.
 *  Every built piece faces +z in its own frame (turn it with rotY to face a street). Positions in metres. */
type V3 = [number, number, number];
const col = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), Math.min(1, Math.max(0, t))).getHexString();
const clamp = (x: number) => Math.min(1, Math.max(0, x));

// ================================================================ the light plan: one level per lamp and per window, by frame
/** One light of a street: what it is, where it is (world z, x), which block it belongs to (1 = nearest the power station). */
export type NyLight = {kind: 'lamp' | 'window' | 'shop' | 'station'; z: number; x: number; row: number; last?: boolean};
/** level of a light at this frame: 0 = off, 1 = on, a little above 1 for a few frames after it comes on (the halo swells and
 *  settles). The set multiplies it by the block's own strength (the third block is weaker and more orange). */
export type NyPower = (l: NyLight) => number;
/** A wave of switching-on along the street, as the shot list asks: the station's own lights at frame `station`; then every light
 *  at depth z comes on at  from + every * floor((z0 - z) / band)  (the nearer ones first), up to depth zEnd (beyond it nothing
 *  comes on: the end of Edison's wires). Lights nearer than z0 are on from the start (they came on in an earlier shot).
 *  flick = frames on which the LAST lamp (and the shop window next to it) flickers instead of burning steadily. */
export const nyWave = (o: {f: number; station?: number; from?: number; every?: number; band?: number; z0?: number; zEnd?: number; flick?: boolean; offs?: number[]}): NyPower => {
  const {f, station = -1e9, from = -1e9, every = 3, band = 6, z0 = 0, zEnd = -110, flick = false, offs = [18, 41]} = o;
  const swell = (t: number) => (f < t ? 0 : 1 + 0.45 * Math.exp(-(f - t) / 2.6));
  return (l) => {
    if (l.kind === 'station') return swell(station);
    if (l.z < zEnd) return 0;
    if (flick && l.last) return flickerLevel(f, 3, offs);
    if (flick && l.kind === 'shop' && l.row === 3 && l.z < -95) return flickerLevel(f + 2, 9, offs.map((q) => q + 5));
    return swell(l.z > z0 ? -1e9 : from + every * Math.floor((z0 - l.z) / band));
  };
};
/** A failing lamp: the level jumps between 0.4 and 0.7 every 2 to 4 frames, and is out for two frames at each frame in offs. */
export const flickerLevel = (f: number, seed: number, offs: number[] = []) => {
  if (offs.some((o) => f >= o && f < o + 2)) return 0;
  // steps of 2-4 frames, each with its own level (deterministic)
  let t = 0, k = 0; const r = rnd(seed * 7 + 1);
  while (t + 2 <= f) { t += 2 + Math.floor(r() * 3); k++; }
  const q = rnd(seed * 13 + k * 31)(); return 0.4 + 0.3 * q;
};

// ================================================================ surfaces
/** Cobbles: rounded setts in staggered rows, four greys, dark joints. A 1.6 m square repeats. */
const cobbleTex = once(() => {
  const t = canvasTex(480, 480, (c) => {
    const r = rnd(41); c.fillStyle = '#4a4744'; c.fillRect(0, 0, 480, 480);
    for (let j = 0, row = 0; j < 480; j += 30, row++) for (let i = row % 2 ? -20 : 0; i < 480; i += 40) {
      const q = r(), w = 34 + r() * 4, h = 24 + r() * 3, x = i + 3 + r() * 2, y = j + 3;
      c.fillStyle = q < 0.12 ? '#cfc9be' : q < 0.4 ? '#b3ada2' : q < 0.72 ? '#a49e93' : '#928c83';
      c.beginPath(); c.roundRect(x, y, w, h, 9); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.16)'; c.beginPath(); c.roundRect(x + 4, y + 3, w * 0.55, h * 0.32, 5); c.fill();
      if (i + 40 > 480) { c.fillStyle = q < 0.4 ? '#b3ada2' : '#a49e93'; c.beginPath(); c.roundRect(x - 480, y, w, h, 9); c.fill(); }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
});
/** A cobbled road surface lying flat: size = [width along x, depth along z], centre pos (its y is the road level); tint by colour.
 *  The rows run across the road. A wear picture (dark patches, wet joints) lies over the whole of it. */
export const CobbleRoad: React.FC<{pos: V3; size: [number, number]; color?: string; seed?: number; tile?: number}> = ({pos, size, color = '#c4bfb6', seed = 1, tile = 1.6}) => {
  const map = useMemo(() => { const t = cobbleTex().clone(); t.needsUpdate = true; t.repeat.set(size[0] / tile, size[1] / tile); return t; }, [size[0], size[1], tile]);
  const wear = useWear(seed + 30, 0.7, false);
  return (
    <group position={pos}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={size} /><meshLambertMaterial color={color} map={map} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}><planeGeometry args={size} /><meshBasicMaterial map={wear} transparent depthWrite={false} /></mesh>
    </group>
  );
};
/** A pavement of stone slabs raised one kerb (h) above the road: x0..x1, z0..z1 (any order); its top is at y = 0, so people
 *  standing on it stand at height 0. kerb = which long edge shows a lighter kerb stone: 'x0', 'x1', 'z0', 'z1' (or several). */
export const Sidewalk: React.FC<{x: [number, number]; z: [number, number]; h?: number; color?: string; kerb?: ('x0' | 'x1' | 'z0' | 'z1')[]; seed?: number}> = ({x, z, h = 0.12, color = '#b9b3a8', kerb = [], seed = 1}) => {
  const [x0, x1] = [Math.min(...x), Math.max(...x)], [z0, z1] = [Math.min(...z), Math.max(...z)], w = x1 - x0, d = z1 - z0;
  const base = useSurface('slabs', seed + 5), map = useMemo(() => { const t = base.clone(); t.needsUpdate = true; t.repeat.set(w / 2.4, d / 2.4); return t; }, [base, w, d]);
  const stone = '#d2ccc0';
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, -h / 2, (z0 + z1) / 2]} receiveShadow castShadow={false}><boxGeometry args={[w, h, d]} /><meshLambertMaterial color={color} map={map} /></mesh>
      {kerb.map((k) => k[0] === 'x'
        ? <B key={k} p={[k === 'x0' ? x0 + 0.13 : x1 - 0.13, -h / 2 + 0.004, (z0 + z1) / 2]} s={[0.26, h + 0.012, d]} c={stone} cast={false} />
        : <B key={k} p={[(x0 + x1) / 2, -h / 2 + 0.004, k === 'z0' ? z0 + 0.13 : z1 - 0.13]} s={[w, h + 0.012, 0.26]} c={stone} cast={false} />)}
    </group>
  );
};

// ================================================================ windows, shop fronts
const GLASS_DAY = '#3c4a5e', GLASS_NIGHT = '#1d2236';
/** glass that is dark until its level rises, then glows in the warm colour (unlit by the scene: it IS a light) */
const glass = (level: number, warm: string, night: boolean) => level > 0.02 ? col(night ? GLASS_NIGHT : GLASS_DAY, warm, Math.min(1, level)) : night ? GLASS_NIGHT : GLASS_DAY;
/** A tall sash window of a town house (wall units, centre x, y; the wall face at z = 0): stone lintel with a keystone, white
 *  frame, two-over-two panes, stone sill; lit = its level (0-1), a half-drawn blind on some. */
const TallWindow: React.FC<{x: number; y: number; w?: number; h?: number; level: number; warm: string; night: boolean; trim: string; stone: string; blind?: number; pot?: boolean}> =
  ({x, y, w = 0.95, h = 1.9, level, warm, night, trim, stone, blind = 0, pot}) => {
    const g = glass(level, warm, night);
    return (
      <group position={[x, y, 0]}>
        <mesh position={[0, 0, 0.02]}><planeGeometry args={[w + 0.16, h + 0.12]} /><meshLambertMaterial color={trim} /></mesh>
        <mesh position={[0, 0, 0.03]}><planeGeometry args={[w, h]} /><meshBasicMaterial color={g} /></mesh>
        {blind > 0 ? <mesh position={[0, h / 2 - (h * blind) / 2, 0.034]}><planeGeometry args={[w - 0.04, h * blind]} /><meshBasicMaterial color={level > 0.02 ? col('#3a3446', '#f6d9a0', level) : night ? '#2c2a36' : '#d9cdb2'} /></mesh> : null}
        {!night && level <= 0.02 ? <mesh position={[-w * 0.16, h * 0.08, 0.035]} rotation={[0, 0, -0.45]}><planeGeometry args={[w * 0.14, h * 0.7]} /><meshBasicMaterial color="#8ea0b4" transparent opacity={0.4} /></mesh> : null}
        <B p={[0, 0, 0.045]} s={[0.045, h, 0.03]} c={trim} cast={false} />
        <B p={[0, 0.02, 0.05]} s={[w, 0.06, 0.03]} c={trim} cast={false} />
        <B p={[0, h / 2 + 0.17, 0.06]} s={[w + 0.34, 0.24, 0.1]} c={stone} cast={false} />
        <B p={[0, h / 2 + 0.2, 0.1]} s={[0.18, 0.3, 0.06]} c={stone} cast={false} />
        <B p={[0, -h / 2 - 0.08, 0.1]} s={[w + 0.3, 0.1, 0.2]} c={stone} />
        {pot ? <group position={[w * 0.22, -h / 2 + 0.02, 0.14]}><B p={[0, 0.07, 0]} s={[0.2, 0.14, 0.14]} c="#9a5a3c" /><mesh position={[0, 0.22, 0.02]}><circleGeometry args={[0.13, 6]} /><meshLambertMaterial color="#4f6a3a" /></mesh></group> : null}
      </group>
    );
  };
/** Goods in a shop window: a few rows of small shapes in the shop's colours (bolts of cloth, tins, jars, hats on stands). */
const Goods: React.FC<{w: number; seed: number; night: boolean; level: number}> = ({w, seed, night, level}) => {
  const r = rnd(seed), cols = ['#b9523c', '#e0b04a', '#4f6a8a', '#d8d0bc', '#6f8a52', '#8a5a7a'];
  const items = Array.from({length: Math.round(w * 3.2)}, (_, i) => ({x: -w / 2 + 0.15 + r() * (w - 0.3), y: r() < 0.5 ? 0.12 : 0.62, h: 0.18 + r() * 0.26, w: 0.12 + r() * 0.16, c: cols[Math.floor(r() * cols.length)], k: i}));
  const dim = night && level < 0.1 ? 0.25 : 1;
  return <>{items.map((q) => <mesh key={q.k} position={[q.x, q.y + q.h / 2, 0.02]}><planeGeometry args={[q.w, q.h]} /><meshBasicMaterial color={col('#101018', q.c, dim * (night ? 0.55 + 0.45 * Math.min(1, level) : 0.8))} /></mesh>)}
    <mesh position={[0, 0.5, 0.015]}><planeGeometry args={[w - 0.1, 0.04]} /><meshBasicMaterial color={night ? '#2a2420' : '#5a4a3a'} /></mesh></>;
};
/** A ground-floor shop front (wall units, centre x; the wall face at z = 0): cast-iron pilasters, a wide display window with goods,
 *  a glazed door with a transom, a sign board in serif capitals, an optional striped awning; level = the window's light. */
const ShopFront: React.FC<{x: number; w: number; sign?: string; awning?: [string, string]; level: number; warm: string; night: boolean; seed: number; paint: string; board: string; ink: string; doorLeft?: boolean}> =
  ({x, w, sign, awning, level, warm, night, seed, paint, board, ink, doorLeft}) => {
    const dw = 1.05, ww = w - dw - 0.5, dx = doorLeft ? -w / 2 + 0.25 + dw / 2 : w / 2 - 0.25 - dw / 2, wx = doorLeft ? dx + dw / 2 + ww / 2 : dx - dw / 2 - ww / 2;
    const g = glass(level, warm, night), r = rnd(seed);
    return (
      <group position={[x, 0, 0]}>
        {/* the painted timber surround and the pilasters */}
        <mesh position={[0, 1.85, 0.03]}><planeGeometry args={[w, 3.7]} /><meshLambertMaterial color={paint} /></mesh>
        {[-w / 2 + 0.12, w / 2 - 0.12, doorLeft ? dx + dw / 2 + 0.05 : dx - dw / 2 - 0.05].map((px, i) => <B key={i} p={[px, 1.6, 0.1]} s={[0.2, 3.2, 0.14]} c={col(paint, '#000000', 0.25)} />)}
        {/* the display window over a panelled stall riser */}
        <B p={[wx, 0.38, 0.08]} s={[ww, 0.6, 0.06]} c={col(paint, '#000000', 0.15)} />{/* z 0,08 (25/11/2026, Daniel đồng ý): ở 0,07 mặt trước trùng gờ đá chân tường của Townhouse (cùng 0,12) nên nháy khi máy đi */}
        <mesh position={[wx, 1.75, 0.05]}><planeGeometry args={[ww, 2.1]} /><meshBasicMaterial color={g} /></mesh>
        <group position={[wx, 0.72, 0.055]}><Goods w={ww} seed={seed} night={night} level={level} /></group>
        {!night ? <mesh position={[wx - ww * 0.22, 1.9, 0.07]} rotation={[0, 0, -0.5]}><planeGeometry args={[ww * 0.09, 2.2]} /><meshBasicMaterial color="#a6b6c6" transparent opacity={0.35} /></mesh> : null}
        <B p={[wx, 1.75, 0.08]} s={[0.05, 2.1, 0.04]} c={col(paint, '#000000', 0.3)} cast={false} />
        {/* the door: lower panels, glass above, a transom light */}
        <B p={[dx, 0.6, 0.04]} s={[dw - 0.1, 1.2, 0.05]} c={col(paint, '#000000', 0.35)} />
        <mesh position={[dx, 1.75, 0.04]}><planeGeometry args={[dw - 0.24, 1.0]} /><meshBasicMaterial color={g} /></mesh>
        <mesh position={[dx, 2.62, 0.04]}><planeGeometry args={[dw - 0.12, 0.42]} /><meshBasicMaterial color={g} /></mesh>
        <B p={[dx + dw * 0.32, 1.15, 0.09]} s={[0.05, 0.05, 0.05]} c="#d8c27a" cast={false} />
        {sign ? <Sign text={sign} x={0} y={3.25} w={Math.min(w - 0.3, 4.6)} h={0.56} board={board} ink={ink} z={0.1} /> : null}
        {awning ? <Awning x={wx} y={2.95} w={ww + 0.2} depth={night ? 0.5 : 1.1} drop={night ? 0.2 : 0.5} a={awning[0]} b={awning[1]} /> : null}
        {r() < 0.7 ? <Paper x={doorLeft ? w / 2 - 0.12 : -w / 2 + 0.12} y={1.55} w={0.18} h={0.34} seed={seed + 3} rot={r() * 8 - 4} /> : null}
      </group>
    );
  };

// ================================================================ the town house
/** A brick or stone town house of the 1880s, four or five floors: shop front on the ground floor (sign, display window, door,
 *  striped awning), tall sash windows above with stone lintels and sills, a stone string course, a projecting cornice with a row
 *  of dentils, chimney stacks and sometimes a timber water tank on iron legs on the flat roof.
 *  Local frame: the street front at z = 0 facing +z, centred on x = 0, w wide, d deep, h high. end = which end wall (local -1 or
 *  +1 on x) faces a cross street and gets windows too. lit = the windows' level (0-1; some windows stay dark by seed),
 *  shop = the shop window's level, warm = the colour of the light (orange-er for a weak supply). */
export const Townhouse: React.FC<{pos: V3; rotY?: number; w: number; h?: number; d?: number; color: string; kind?: 'brick' | 'stone'; trim?: string; stone?: string;
  sign?: string; board?: string; ink?: string; awning?: [string, string]; paint?: string; seed?: number; night?: boolean; lit?: number; shop?: number; warm?: string; end?: -1 | 1 | 0; tank?: boolean; doorLeft?: boolean}> =
  ({pos, rotY = 0, w, h = 16, d = 14, color, kind = 'brick', trim = '#ece4d2', stone = '#d6cbb4', sign, board = '#1f3a2c', ink = '#e7c96a', awning, paint = '#3a4a3c', seed = 1, night = false, lit = 0, shop = 0, warm = '#ffd486', end = 0, tank, doorLeft}) => {
    const r = rnd(seed * 3 + 7), G = 4.2, floors = Math.max(2, Math.round((h - G - 1.0) / 3.25)), fh = (h - G - 1.0) / floors, cols = Math.max(2, Math.round(w / 2.3));
    const win = Array.from({length: floors * cols}, () => ({on: r() < 0.78, blind: r() < 0.35 ? 0.3 + r() * 0.3 : 0, pot: r() < 0.18}));
    const endCols = Math.max(2, Math.round(d / 3.4));
    const endWin = Array.from({length: floors * endCols}, () => r() < 0.7);
    return (
      <group position={pos} rotation={[0, rotY, 0]}>
        <B p={[0, h / 2, -d / 2]} s={[w, h, d]} c={color} />
        <Face w={w} h={h - 0.3} pos={[0, 0.3 + (h - 0.3) / 2, 0.01]} color={color} kind={kind} tile={kind === 'brick' ? 2.4 : 3.2} seed={seed} />
        <B p={[0, 0.15, 0.06]} s={[w, 0.3, 0.12]} c={col(stone, '#000000', 0.2)} />
        <group position={[0, 0, 0.02]}>
          <ShopFront x={0} w={w - 0.5} sign={sign} awning={awning} level={shop} warm={warm} night={night} seed={seed} paint={paint} board={board} ink={ink} doorLeft={doorLeft} />
        </group>
        <B p={[0, G - 0.12, 0.12]} s={[w + 0.04, 0.24, 0.24]} c={stone} />
        {Array.from({length: floors}, (_, f) => Array.from({length: cols}, (_, c) => { const q = win[f * cols + c]; return (
          <TallWindow key={`${f}-${c}`} x={-w / 2 + (w * (c + 0.5)) / cols} y={G + fh * (f + 0.5) + 0.1} h={Math.min(1.95, fh - 0.9)} level={q.on ? lit : 0} warm={warm} night={night} trim={trim} stone={stone} blind={q.blind} pot={q.pot} />); }))}
        {/* cornice: a frieze, a row of dentils, the projecting top */}
        <B p={[0, h - 0.55, 0.05]} s={[w, 0.5, 0.1]} c={stone} cast={false} />
        {Array.from({length: Math.floor(w / 0.32)}, (_, i) => <B key={i} p={[-w / 2 + 0.16 + i * 0.32, h - 0.22, 0.14]} s={[0.14, 0.16, 0.16]} c={stone} cast={false} />)}
        <B p={[0, h - 0.06, 0.24]} s={[w + 0.3, 0.2, 0.5]} c={col(stone, '#000000', 0.08)} />
        {[-1, 1].map((k) => <B key={k} p={[k * (w / 2 - 0.1), h / 2, 0.06]} s={[0.2, h, 0.1]} c={col(color, '#000000', 0.12)} cast={false} />)}
        {/* the end wall on a cross street */}
        {end !== 0 ? <group position={[end * (w / 2 + 0.01), 0, -d / 2]} rotation={[0, end * Math.PI / 2, 0]}>
          <Face w={d} h={h - 0.3} pos={[0, 0.3 + (h - 0.3) / 2, 0]} color={color} kind={kind} tile={kind === 'brick' ? 2.4 : 3.2} seed={seed + 50} />
          {Array.from({length: floors}, (_, f) => Array.from({length: endCols}, (_, c) => <TallWindow key={`e${f}-${c}`} x={-d / 2 + (d * (c + 0.5)) / endCols} y={G + fh * (f + 0.5) + 0.1} h={Math.min(1.95, fh - 0.9)} level={endWin[f * endCols + c] ? lit : 0} warm={warm} night={night} trim={trim} stone={stone} />))}
          <B p={[0, G - 0.12, 0.1]} s={[d, 0.24, 0.2]} c={stone} />
          <B p={[0, h - 0.06, 0.2]} s={[d + 0.2, 0.2, 0.4]} c={col(stone, '#000000', 0.08)} />
          {[-d / 2 + 2.2, d / 2 - 2.6].map((x, i) => <TallWindow key={`g${i}`} x={x} y={1.9} w={1.1} h={2.2} level={shop} warm={warm} night={night} trim={trim} stone={stone} />)}
        </group> : null}
        {/* roof: a low parapet, chimney stacks with pots, perhaps a water tank */}
        {[-w / 2 + 0.6 + r() * 0.8, w / 2 - 1.2 - r() * 0.6].map((x, i) => <group key={i} position={[x, h, -2 - i * 5 - r() * 3]}><B p={[0, 0.8, 0]} s={[0.9, 1.6, 0.6]} c={col(color, '#000000', 0.1)} /><B p={[0, 1.66, 0]} s={[1.0, 0.12, 0.7]} c={stone} />{[-0.2, 0.2].map((dx) => <FacetLathe key={dx} profile={[[0.09, 0], [0.07, 0.28], [0.1, 0.32]]} sides={6} color="#9a5a3e" pos={[dx, 1.72, 0]} contact={false} />)}</group>)}
        {tank ? <Sprite name={`ny-tank-${seed % 3}`} art={(c, W, H) => paintTank(c, W, H, seed % 3)} px={[260, 360]} w={3.2} pos={[w * 0.12, h, -d * 0.45]} cast={false} shade={0} /> : null}
      </group>
    );
  };
/** a timber water tank on iron legs, for a flat roof (flat: seen from the street it is a silhouette with its hoops) */
const paintTank = (c: Ctx, W: number, H: number, k: number) => {
  const wood = ['#6f5a46', '#76604a', '#665240'][k], dark = '#4a3c30';
  [[0.18, 0.62], [0.82, 0.62], [0.36, 0.6], [0.64, 0.6]].forEach(([x]) => P(c, [[W * x - 5, H], [W * x - 3, H * 0.55], [W * x + 3, H * 0.55], [W * x + 5, H]], '#2c2a2a'));
  c.strokeStyle = '#2c2a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.18, H * 0.95); c.lineTo(W * 0.82, H * 0.62); c.moveTo(W * 0.82, H * 0.95); c.lineTo(W * 0.18, H * 0.62); c.stroke();
  P(c, [[W * 0.12, H * 0.57], [W * 0.14, H * 0.2], [W * 0.86, H * 0.2], [W * 0.88, H * 0.57]], wood);
  P(c, [[W * 0.6, H * 0.57], [W * 0.62, H * 0.2], [W * 0.86, H * 0.2], [W * 0.88, H * 0.57]], dark);
  [0.27, 0.38, 0.5].forEach((y) => { c.fillStyle = '#2f2a28'; c.fillRect(W * 0.12, H * y, W * 0.76, 4); });
  P(c, [[W * 0.08, H * 0.21], [W * 0.5, H * 0.02], [W * 0.92, H * 0.21]], '#4f4440'); P(c, [[W * 0.5, H * 0.02], [W * 0.92, H * 0.21], [W * 0.62, H * 0.21]], '#3c3430');
};

// ================================================================ the knife switch
/** A big knife switch on a wall (1880s): a varnished board, a slate panel, two copper blades hinged at the top with a black
 *  porcelain handle on their cross-bar, copper jaws at the bottom, cables up the wall. pull = 0: the blades swung up and out
 *  (open, the handle high and in front of the board); pull = 1: pulled down into the jaws (closed, the handle low).
 *  Local frame: the wall at z = 0, the board's centre at the origin. SWITCH holds the sizes. */
export const SWITCH = {w: 0.7, h: 0.82, hinge: 0.2, blade: 0.27, gap: 0.22, open: 150};
/** where the handle's knob is (local to the switch's centre), for a hand to lie over it: at pull 0 and at pull 1 */
export const switchHandle = (pull: number): V3 => { const a = -(1 - clamp(pull)) * SWITCH.open * Math.PI / 180, L = SWITCH.blade + 0.04; return [0, SWITCH.hinge - L * Math.cos(a), 0.12 - L * Math.sin(a) + 0.08]; };
export const KnifeSwitch: React.FC<{pos: V3; pull?: number; rotY?: number}> = ({pos, pull = 0, rotY = 0}) => {
  const S = SWITCH, a = -(1 - clamp(pull)) * S.open * Math.PI / 180, copper = '#d08a4c', cu2 = '#f0b878';
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <B p={[0, 0, 0.03]} s={[S.w, S.h, 0.06]} c="#9a6638" />
      <B p={[0, 0, 0.065]} s={[S.w - 0.12, S.h - 0.12, 0.015]} c="#5a6068" cast={false} />
      {[-1, 1].map((k) => <React.Fragment key={k}>
        {/* the hinge posts at the top, the jaws at the bottom */}
        <B p={[k * S.gap / 2, S.hinge, 0.1]} s={[0.06, 0.08, 0.07]} c={copper} />
        <B p={[k * S.gap / 2 - 0.022, S.hinge - S.blade, 0.1]} s={[0.014, 0.1, 0.07]} c={copper} /><B p={[k * S.gap / 2 + 0.022, S.hinge - S.blade, 0.1]} s={[0.014, 0.1, 0.07]} c={copper} />
        {/* cables from the posts up the wall */}
        <B p={[k * S.gap / 2, S.h / 2 + 0.6, 0.02]} s={[0.035, 1.2, 0.035]} c="#1e1c1c" />
        <B p={[k * S.gap / 2, -S.h / 2 - 0.3, 0.02]} s={[0.035, 0.6, 0.035]} c="#1e1c1c" />
      </React.Fragment>)}
      {[-0.22, 0.22].map((x) => [-0.34, 0.34].map((y) => <B key={`${x}${y}`} p={[x, y, 0.075]} s={[0.03, 0.03, 0.02]} c="#b8b0a0" cast={false} />))}
      {/* the moving part: blades, cross-bar, handle, turning about the hinge line */}
      <group position={[0, S.hinge, 0.1]} rotation={[a, 0, 0]}>
        {[-1, 1].map((k) => <B key={k} p={[k * S.gap / 2, -S.blade / 2, 0]} s={[0.045, S.blade, 0.02]} c={cu2} />)}
        <B p={[0, -S.blade + 0.05, 0]} s={[S.gap + 0.06, 0.04, 0.04]} c="#2a2624" />
        <group position={[0, -S.blade + 0.05, 0.02]} rotation={[Math.PI / 2, 0, 0]}><FacetLathe profile={[[0.035, 0], [0.03, 0.05], [0.06, 0.09], [0.062, 0.15], [0.03, 0.18]]} sides={8} color="#16161a" contact={false} cast={false} /></group>
      </group>
      {/* an enamel plate under it, the one trace of use */}
      <B p={[0, -S.h / 2 - 0.12, 0.03]} s={[0.36, 0.12, 0.012]} c="#e8e2d0" cast={false} />
      <B p={[0, -S.h / 2 - 0.12, 0.04]} s={[0.28, 0.025, 0.005]} c="#a8322c" cast={false} />
    </group>
  );
};

// ================================================================ the power station
/** An electric power station of the 1880s: four floors of dark red brick, a tall arched entrance with two iron doors and a glazed
 *  fanlight, a sign board over it, round-headed windows, a stone plinth and string courses, a big knife switch on the front left
 *  of the door, a round electric lamp on an iron arm over the door, two tall chimneys with smoke on the roof.
 *  Local frame: the front's left corner at the origin (the front runs +x from 0 to STATION.w at z = 0, facing +z; the left
 *  side wall runs back along -z at x = 0, facing -x). lit = windows' level, door = fanlight's level, lamp = the door lamp's
 *  level, pull = the switch, f = frame (smoke). */
export const STATION = {w: 14, d: 30, h: 16, door: {x: 4.6, w: 2.4, h: 2.9}, switchAt: [2.55, 0.74, 0] as V3, lamp: [2.85, 2.98, 0.62] as V3, sign: [4.6, 3.33] as [number, number],
  lowWindows: [0.85, 7.4, 9.6, 11.8, 13.2], text: 'EDISON ELECTRIC ILLUMINATING CO.'};
export const PowerStation: React.FC<{pos: V3; night?: boolean; lit?: number; door?: number; lamp?: number; pull?: number; f?: number; smoke?: boolean; warm?: string}> =
  ({pos, night = false, lit = 0, door = 0, lamp = 0, pull = 0, f = 0, smoke = true, warm = '#ffd486'}) => {
    const S = STATION, brick = '#7e3a2e', stone = '#d2c2a2', trim = '#e8dcc4', iron = '#2a2e30', D = S.door, g = glass(door, warm, night), r = rnd(12);
    const floorsY = [6.1, 9.4, 12.7];
    return (
      <group position={pos}>
        <B p={[S.w / 2, S.h / 2, -S.d / 2]} s={[S.w, S.h, S.d]} c={brick} />
        <Face w={S.w} h={S.h - 0.5} pos={[S.w / 2, 0.5 + (S.h - 0.5) / 2, 0.01]} color={brick} tile={2.2} seed={21} />
        <B p={[S.w / 2, 0.25, 0.08]} s={[S.w, 0.5, 0.16]} c="#a89c88" />
        {/* the arched entrance: stone surround, iron doors with rivets, a glazed fanlight */}
        <group position={[D.x, 0, 0.02]}>
          <mesh position={[0, (D.h - D.w / 2) / 2, 0.01]}><planeGeometry args={[D.w + 0.5, D.h - D.w / 2]} /><meshLambertMaterial color={stone} /></mesh>
          <mesh position={[0, D.h - D.w / 2, 0.01]}><circleGeometry args={[D.w / 2 + 0.25, 24, 0, Math.PI]} /><meshLambertMaterial color={stone} /></mesh>
          <mesh position={[0, (D.h - D.w / 2) / 2, 0.02]}><planeGeometry args={[D.w, D.h - D.w / 2]} /><meshLambertMaterial color={iron} /></mesh>
          <mesh position={[0, D.h - D.w / 2, 0.02]}><circleGeometry args={[D.w / 2, 24, 0, Math.PI]} /><meshBasicMaterial color={g} /></mesh>
          {[-0.62, -0.31, 0, 0.31, 0.62].map((k) => <B key={k} p={[0, D.h - D.w / 2 + 0.02, 0.03]} s={[0.035, D.w * 0.98, 0.02]} r={[0, 0, k * 1.6]} c={iron} cast={false} />)}
          <mesh position={[0, D.h - D.w / 2 + 0.02, 0.035]}><circleGeometry args={[0.28, 12, 0, Math.PI]} /><meshLambertMaterial color={iron} /></mesh>
          <B p={[0, D.h - D.w / 2 - 0.03, 0.04]} s={[D.w, 0.08, 0.04]} c={iron} />
          {[-1, 1].map((k) => <group key={k}>
            <B p={[k * D.w / 4, (D.h - D.w / 2) / 2, 0.04]} s={[D.w / 2 - 0.06, D.h - D.w / 2 - 0.08, 0.04]} c={k < 0 ? '#323739' : '#2d3133'} />
            {[0.4, 1.0, 1.55].map((y) => <B key={y} p={[k * D.w / 4, y, 0.07]} s={[D.w / 2 - 0.2, 0.05, 0.02]} c="#3e4446" cast={false} />)}
            {Array.from({length: 7}, (_, i) => <B key={`r${i}`} p={[k * (D.w / 2 - 0.12), 0.25 + i * 0.25, 0.07]} s={[0.04, 0.04, 0.02]} c="#565e60" cast={false} />)}
          </group>)}
          <B p={[0.12, 1.0, 0.09]} s={[0.05, 0.3, 0.05]} c="#8a7a5a" cast={false} />
          <B p={[0, D.h + 0.16, 0.06]} s={[0.36, 0.42, 0.1]} c={stone} cast={false} />
        </group>
        {/* the sign over the door */}
        <Sign text={S.text} x={S.sign[0]} y={S.sign[1]} w={3.1} h={0.46} board="#1e3242" ink="#efe2bc" z={0.08} />
        {/* string courses */}
        <B p={[S.w / 2, 3.72, 0.1]} s={[S.w + 0.06, 0.2, 0.2]} c={stone} />
        {floorsY.map((y) => <B key={y} p={[S.w / 2, y - 1.42, 0.07]} s={[S.w, 0.14, 0.14]} c={stone} cast={false} />)}
        {/* windows: two low ones on the front (left of the switch, right of the door), round-headed ones above */}
        {S.lowWindows.map((x, i) => <TallWindow key={`l${i}`} x={x} y={1.95} w={1.0} h={1.75} level={lit} warm={warm} night={night} trim={trim} stone={stone} blind={i === 2 ? 0.35 : 0} />)}
        {floorsY.map((y, fi) => [1.4, 3.6, 6.2, 8.8, 11.0, 13.0].map((x, i) => <TallWindow key={`${fi}-${i}`} x={x} y={y} w={1.0} h={2.05} level={r() < 0.85 ? lit : 0} warm={warm} night={night} trim={trim} stone={stone} />))}
        {/* cornice */}
        <B p={[S.w / 2, S.h - 0.5, 0.06]} s={[S.w, 0.5, 0.12]} c={stone} cast={false} />
        {Array.from({length: 40}, (_, i) => <B key={i} p={[0.2 + i * 0.35, S.h - 0.2, 0.15]} s={[0.15, 0.16, 0.16]} c={stone} cast={false} />)}
        <B p={[S.w / 2, S.h - 0.05, 0.26]} s={[S.w + 0.4, 0.22, 0.55]} c="#c4b494" />
        {/* the side wall on the main street */}
        <group position={[-0.01, 0, -S.d / 2]} rotation={[0, -Math.PI / 2, 0]}>
          <Face w={S.d} h={S.h - 0.5} pos={[0, 0.5 + (S.h - 0.5) / 2, 0]} color={brick} tile={2.2} seed={22} />
          <B p={[0, 3.72, 0.1]} s={[S.d, 0.2, 0.2]} c={stone} />
          <B p={[0, S.h - 0.05, 0.26]} s={[S.d + 0.4, 0.22, 0.55]} c="#c4b494" />
          {[-12.5, -9.5, -6.5, -3.5, -0.5, 2.5, 5.5, 8.5, 11.5].map((x, i) => <React.Fragment key={x}>
            <TallWindow x={x} y={1.95} w={1.2} h={1.9} level={i % 4 === 3 ? 0 : lit} warm={warm} night={night} trim={trim} stone={stone} />
            {floorsY.map((y, fi) => <TallWindow key={fi} x={x} y={y} w={1.1} h={2.05} level={(i + fi) % 5 === 2 ? 0 : lit} warm={warm} night={night} trim={trim} stone={stone} />)}
          </React.Fragment>)}
          <Sign text="DYNAMO ROOM" x={-14} y={3.25} w={2.4} h={0.4} board="#1e3242" ink="#efe2bc" z={0.08} />
        </group>
        {/* the switch, its cables, the lamp over the door */}
        <KnifeSwitch pos={S.switchAt} pull={pull} />
        <group position={[S.lamp[0], 0, 0]}>
          <B p={[0, S.lamp[1] + 0.5, 0.33]} s={[0.05, 0.05, 0.66]} c={iron} />
          <B p={[0, S.lamp[1] + 0.27, 0.06]} s={[0.05, 0.5, 0.05]} c={iron} />
          <B p={[0, S.lamp[1] + 0.33, 0.62]} s={[0.025, 0.3, 0.025]} c={iron} />
          <Globe pos={[0, S.lamp[1], S.lamp[2]]} level={lamp} tone="#ffe2a0" r={0.15} f={f} seed={4} light={night} />
        </group>
        {/* the chimneys and their smoke */}
        {[3.6, 10.6].map((x, i) => <group key={x} position={[x, S.h, -16 - i * 4]}>
          <FacetLathe profile={[[1.1, 0], [0.95, 7.5], [0.82, 9.6], [1.0, 9.8], [1.0, 10.3], [0.85, 10.4]]} sides={10} color="#6e3428" contact={false} />
          {smoke ? <LocoSmoke pos={[0, 10.4, 0]} f={f + i * 30} n={9} life={110} rise={7} wind={4} size={1.5} /> : null}
        </group>)}
        {/* boxes and a barrel by the door are set by the scene; posters on the pier left of the switch */}
        <Paper x={1.75} y={1.45} w={0.34} h={0.48} seed={7} rot={-3} />
      </group>
    );
  };

// ================================================================ electric street lamp
const poolTex = once(() => canvasTex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 2, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.4, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); }));
/** A glowing globe: a faceted glass ball (dull when off), the many-sided halo of fx/BulbHalo and a soft Halo when on, and an
 *  optional real light. level 0-1 (above 1 swells the halo for a moment). */
/** bui (mặc định true): quả cầu đèn tự đăng ký nguồn bụi 'den' (lib3/buiNguon) khi sáng. */
const Globe: React.FC<{pos: V3; level: number; tone: string; r: number; f: number; seed: number; light?: boolean; lightAt?: number; lightReach?: number; bui?: boolean}> = ({pos, level, tone, r, f, seed, light = true, lightAt = 14, lightReach = 13, bui = true}) => {
  const L = Math.min(1, level), sw = Math.max(1, Math.min(1.6, level));
  return (
    <group position={pos}>
      {bui && L > 0.1 ? <NguonBui kieu="den" pos={[0, -r * 0.5, 0]} r={Math.max(0.6, r * 5)} mau={tone} k={L} /> : null}
      <group position={[0, -r, 0]}><FacetLathe profile={[[0.25, 0], [0.8, 0.18], [1, 0.5], [0.8, 0.82], [0.3, 1], [0.02, 1.02]]} s={r} sides={8} color={L > 0.02 ? col('#c8c4b6', tone, L) : '#bdb9ae'} contact={false} cast={false} /></group>
      <B p={[0, r + 0.04, 0]} s={[r * 1.1, 0.08, r * 1.1]} c="#22282a" />
      {L > 0.02 ? <>
        <mesh position={[0, 0, 0.01]}><circleGeometry args={[r * 0.9, 10]} /><meshBasicMaterial color={col('#d8d0b8', '#fff8e4', L)} /></mesh>
        <BulbHalo pos={[0, 0, r + 0.02]} r={r * 1.7 * sw * (0.5 + 0.5 * L)} f={f} color={tone} core="#fff8e4" seed={seed} />
        <Halo pos={[0, 0, r + 0.05]} r={r * 14 * sw * L} color={tone} strength={0.42 * L} />
      </> : null}
      {light ? <pointLight position={[0, -0.1, 0.25]} color={tone} intensity={lightAt * L} distance={lightReach} decay={1.6} /> : null}
    </group>
  );
};
/** A cast-iron electric street lamp of the 1880s: a fluted post with a ring base, a curved arm reaching over the road, a round
 *  faceted glass globe hanging from it, a soft pool of light on the ground under it. level 0-1 (above 1 = the swell of
 *  switching on), tone = its colour (warm white; orange for a weak supply), arm = which way it reaches (+1 = +x).
 *  light = a real light that lights the walls and people near it (off for far lamps if the scene has too many). */
export const ElectricLamp: React.FC<{pos: V3; level?: number; tone?: string; f?: number; h?: number; arm?: 1 | -1; light?: boolean; pool?: number; seed?: number}> =
  ({pos, level = 0, tone = '#ffe4a4', f = 0, h = 4.7, arm = 1, light = true, pool = 3.4, seed = 1}) => {
    const iron = '#262c2c', L = Math.min(1, level), ax = arm * 0.75;
    return (
      <group position={pos}>
        <FacetLathe profile={[[0.2, 0], [0.2, 0.22], [0.14, 0.32], [0.1, 0.62], [0.08, 0.7], [0.075, h - 0.25], [0.1, h - 0.15], [0.07, h]]} sides={8} color={iron} />
        <FacetLathe profile={[[0.13, 0.9], [0.15, 1.0], [0.13, 1.1]]} sides={8} color="#363c3c" contact={false} cast={false} />
        {/* the arm: two straight pieces and a scroll, the hanger */}
        <B p={[ax / 2, h + 0.05, 0]} s={[Math.abs(ax) + 0.1, 0.05, 0.05]} c={iron} />
        <B p={[ax * 0.35, h - 0.18, 0]} s={[Math.abs(ax) * 0.55, 0.035, 0.035]} r={[0, 0, arm * 0.55]} c={iron} cast={false} />
        <B p={[ax, h - 0.08, 0]} s={[0.03, 0.22, 0.03]} c={iron} cast={false} />
        <Globe pos={[ax, h - 0.38, 0]} level={level} tone={tone} r={0.19} f={f} seed={seed} light={light} />
        {L > 0.02 && pool > 0 ? <mesh position={[ax, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}><planeGeometry args={[pool * 2, pool * 2]} /><meshBasicMaterial map={poolTex()} color={tone} transparent opacity={Math.min(1, 0.85 * L)} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh> : null}
      </group>
    );
  };
/** The old gas lamp, lit: the campus cast-iron lamp with a small, weak yellow-green flame in its lantern (no real light). */
export const GasGlow: React.FC<{pos: V3; h?: number; on?: number}> = ({pos, h = 3.4, on = 1}) => (
  <group position={[pos[0], pos[1] + h + 0.24, pos[2]]}>
    <mesh position={[0, 0, 0.15]}><planeGeometry args={[0.18, 0.24]} /><meshBasicMaterial color={col('#8c9068', '#e6eaa0', on)} /></mesh>
    <Halo pos={[0, 0, 0.2]} r={0.9 * on} color="#d6e49a" strength={0.36 * on} />
  </group>
);

// ================================================================ poles and wires
const Wire: React.FC<{a: V3; b: V3; sag: number; r?: number; color?: string}> = ({a, b, sag, r = 0.014, color = '#1c1a1c'}) => {
  const geo = useMemo(() => {
    const pts = Array.from({length: 13}, (_, i) => { const u = i / 12; return new THREE.Vector3(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - 4 * u * (1 - u) * sag, a[2] + (b[2] - a[2]) * u); });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, r, 3, false);
  }, [a.join(), b.join(), sag, r]);
  return <mesh geometry={geo}><meshBasicMaterial color={color} /></mesh>;
};
/** Timber poles of the early electric and telegraph lines: tall, a little crooked, with many cross-arms full of glass insulators,
 *  and the wires sagging from pole to pole (the tangle over a New York street of the 1880s). feet = the poles' feet; arms =
 *  cross-arms per pole; per = wires per arm; extra = more wires [from, to, sag] (across the street to a house, down to a lamp). */
export const WirePoles: React.FC<{feet: V3[]; h?: number; arms?: number; per?: number; extra?: [V3, V3, number][]; seed?: number}> = ({feet, h = 9, arms = 4, per = 4, extra = [], seed = 3}) => {
  const r = rnd(seed), lean = useMemo(() => feet.map(() => (r() - 0.5) * 0.05), [feet.length]);
  const armY = (k: number) => h - 0.25 - k * 0.7, armW = (k: number) => 1.9 - k * 0.15, slot = (k: number, i: number) => -armW(k) / 2 + 0.12 + (i * (armW(k) - 0.24)) / (per - 1);
  return (
    <>
      {feet.map((p, i) => <group key={i} position={p} rotation={[lean[i], 0, lean[i] * 0.6]}>
        <FacetLathe profile={[[0.16, 0], [0.13, h - 1], [0.1, h + 0.25]]} sides={7} color={i % 2 ? '#5e4c3c' : '#6a5644'} seed={i + seed} />
        {Array.from({length: arms}, (_, k) => <React.Fragment key={k}>
          <B p={[0, armY(k), 0]} s={[armW(k), 0.11, 0.11]} c="#5a4a3a" />
          {Array.from({length: per}, (_, j) => <B key={j} p={[slot(k, j), armY(k) + 0.1, 0]} s={[0.05, 0.1, 0.05]} c="#6f9a8c" cast={false} />)}
        </React.Fragment>)}
        <B p={[0.02, h - 3.5, 0.1]} s={[0.05, 0.9, 0.03]} c="#8a7a62" cast={false} />
      </group>)}
      {feet.slice(1).map((b, i) => { const a = feet[i]; return Array.from({length: arms}, (_, k) => Array.from({length: per}, (_, j) => <Wire key={`${i}-${k}-${j}`} a={[a[0] + slot(k, j), a[1] + armY(k) + 0.15, a[2]]} b={[b[0] + slot(k, j), b[1] + armY(k) + 0.15, b[2]]} sag={0.35 + ((i + k + j) % 3) * 0.12} />)); })}
      {extra.map(([a, b, s], i) => <Wire key={`x${i}`} a={a} b={b} sag={s} r={0.012} />)}
    </>
  );
};

// ================================================================ the ditch, its heap, its tools; earth thrown out of it
/** a long heap of dug earth: a ridge with a lumpy crest, three browns, clods on its flanks */
const Mound: React.FC<{x: number; z: [number, number]; w: number; h: number; y?: number; seed?: number}> = ({x, z, w, h, y = 0, seed = 1}) => {
  const geo = useMemo(() => {
    const L = Math.abs(z[1] - z[0]), g = new THREE.PlaneGeometry(w, L, 10, Math.round(L * 2)), p = g.attributes.position as THREE.BufferAttribute, cl: number[] = [];
    const A = new THREE.Color('#7a5a3e'), Bc = new THREE.Color('#5e4430'), C = new THREE.Color('#94744e');
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / (w / 2), v = p.getY(i), bump = 0.18 * Math.sin(v * 1.7 + seed) + 0.12 * Math.sin(v * 4.3 + seed * 2) + 0.08 * Math.sin(u * 5 + v * 3);
      const prof = Math.max(0, 1 - u * u), end = Math.min(1, (L / 2 - Math.abs(v)) / 1.2);
      p.setZ(i, h * prof * (0.85 + bump) * Math.max(0, end));
      const q = (Math.sin(v * 7.1 + u * 11 + seed) + 1) / 2, c = A.clone().lerp(q < 0.5 ? Bc : C, Math.abs(q - 0.5) * 1.6);
      cl.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.computeVertexNormals(); return g;
  }, [w, h, z[0], z[1], seed]);
  return <mesh geometry={geo} position={[x, y, (z[0] + z[1]) / 2]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow><meshLambertMaterial vertexColors flatShading /></mesh>;
};
const paintShovel = (c: Ctx, W: number, H: number) => {
  c.save(); c.translate(W / 2, H); c.rotate(-0.12);
  P(c, [[-5, -H * 0.98], [5, -H * 0.98], [5, -H * 0.32], [-5, -H * 0.32]], '#8a6a44'); P(c, [[1, -H * 0.98], [5, -H * 0.98], [5, -H * 0.32], [1, -H * 0.32]], '#6a5034');
  P(c, [[-14, -H * 0.99], [14, -H * 0.99], [14, -H * 0.93], [-14, -H * 0.93]], '#6a5034');
  P(c, [[-24, -H * 0.34], [24, -H * 0.34], [26, -H * 0.1], [0, 0], [-26, -H * 0.1]], '#7d8288'); P(c, [[4, -H * 0.34], [24, -H * 0.34], [26, -H * 0.1], [4, -H * 0.02]], '#5f646a');
  P(c, [[-20, -H * 0.12], [20, -H * 0.12], [0, -2]], '#6a5038'); c.restore();
};
const paintPick = (c: Ctx, W: number, H: number) => {
  c.save(); c.translate(W / 2, H); c.rotate(0.14);
  P(c, [[-5, -H * 0.86], [5, -H * 0.86], [6, 0], [-6, 0]], '#8a6a44'); P(c, [[1, -H * 0.86], [5, -H * 0.86], [6, 0], [1, 0]], '#6a5034');
  c.strokeStyle = '#5f646a'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(-W * 0.44, -H * 0.72); c.quadraticCurveTo(0, -H * 0.98, W * 0.44, -H * 0.72); c.stroke();
  c.strokeStyle = '#8a9096'; c.lineWidth = 4; c.beginPath(); c.moveTo(-W * 0.36, -H * 0.8); c.quadraticCurveTo(0, -H * 0.97, W * 0.3, -H * 0.82); c.stroke(); c.restore();
};
const paintFlag = (c: Ctx, W: number, H: number) => {
  P(c, [[W * 0.2 - 3, H], [W * 0.2 - 2, 4], [W * 0.2 + 3, 4], [W * 0.2 + 3, H]], '#6a5034');
  P(c, [[W * 0.2 + 3, 8], [W * 0.95, 18], [W * 0.88, 36], [W * 0.98, 58], [W * 0.2 + 3, 62]], '#c83a2e'); P(c, [[W * 0.2 + 3, 40], [W * 0.92, 46], [W * 0.98, 58], [W * 0.2 + 3, 62]], '#9e2a22');
};
/** A ditch dug in a road (to lay cables or pipes) with all that goes with it: straight earth walls, a floor of wet earth, timber
 *  shoring across it here and there, a long heap of the dug earth on one side, planks laid over it, a shovel and a pick stuck in
 *  the heap, red flags on stakes at both ends. x = its middle line, z = [near, far], w = width, depth below the road at y = road.
 *  heap = which side the heap lies on (-1 = -x); keep = z of places in the ditch kept free of shoring (where people stand);
 *  planks / tools = z of the planks across and of the tools. */
export const DITCH = {w: 1.2, floor: -0.95};
export const Trench: React.FC<{x: number; z: [number, number]; w?: number; floor?: number; road?: number; heap?: -1 | 1; heapAt?: number; keep?: number[]; planks?: number[]; tools?: number[]; seed?: number}> =
  ({x, z, w = DITCH.w, floor = DITCH.floor, road = -0.12, heap = -1, heapAt, keep = [], planks = [], tools = [], seed = 1}) => {
    const [zn, zf] = [Math.max(...z), Math.min(...z)], L = zn - zf, depth = road - floor, earth = '#5a4232', wet = '#463428', zc = (zn + zf) / 2;
    const shores = Array.from({length: Math.floor(L / 4.5)}, (_, i) => zn - 2.2 - i * 4.5).filter((q) => keep.every((k) => Math.abs(q - k) > 1.6));
    const hx = heapAt ?? x + heap * (w / 2 + 0.9);
    return (
      <group>
        {/* walls (planking shows on the upper half), floor, ends */}
        {[-1, 1].map((k) => <React.Fragment key={k}>
          <mesh position={[x + k * w / 2, road - depth / 2, zc]} rotation={[0, -k * Math.PI / 2, 0]} receiveShadow><planeGeometry args={[L, depth]} /><meshLambertMaterial color={earth} side={THREE.DoubleSide} /></mesh>
          {Array.from({length: Math.floor(L / 1.6)}, (_, i) => <B key={i} p={[x + k * (w / 2 - 0.03), road - 0.22, zn - 0.8 - i * 1.6]} s={[0.04, 0.32, 1.5]} c={i % 3 ? '#7a6248' : '#6a5440'} cast={false} />)}
        </React.Fragment>)}
        <mesh position={[x, floor + 0.005, zc]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[w, L]} /><meshLambertMaterial color={wet} /></mesh>
        {[zn, zf].map((q) => <mesh key={q} position={[x, road - depth / 2, q]} rotation={[0, q === zn ? Math.PI : 0, 0]}><planeGeometry args={[w, depth]} /><meshLambertMaterial color={earth} side={THREE.DoubleSide} /></mesh>)}
        {shores.map((q) => <B key={q} p={[x, road - 0.35, q]} s={[w, 0.09, 0.09]} c="#7a6248" />)}
        {/* the heap and its clods */}
        <Mound x={hx} z={[zn - 0.3, zf + 0.6]} w={1.9} h={0.72} y={heap < 0 ? 0 : road} seed={seed} />
        {/* planks laid across */}
        {planks.map((q, i) => <B key={`p${q}`} p={[x, road + 0.03, q]} s={[w + 0.9, 0.05, 0.32]} c={i % 2 ? '#9a7a54' : '#8a6c4a'} r={[0, 0.05 * (i % 2 ? 1 : -1), 0]} />)}
        {/* tools stuck in the heap, flags at the two ends */}
        {tools.map((q, i) => <Sprite key={`t${q}`} name={i % 2 ? 'ny-pick' : 'ny-shovel'} art={i % 2 ? paintPick : paintShovel} px={i % 2 ? [180, 300] : [120, 320]} w={i % 2 ? 0.75 : 0.42} pos={[hx + 0.35 * -heap, 0.25, q]} cast={false} shade={0} />)}
        {[zn - 1.2, zf - 0.4].map((q, i) => <Sprite key={`f${i}`} name="ny-flag" art={paintFlag} px={[160, 400]} w={0.42} pos={[i ? x - heap * (w / 2 + 0.25) : hx + heap * 1.1, i ? road : 0, q]} cast={false} shade={0} />)}
      </group>
    );
  };
const clodTex = once(() => canvasTex(64, 64, (c) => { P(c, [[8, 36], [20, 12], [44, 8], [58, 30], [48, 54], [18, 56]], '#6a4e36'); P(c, [[20, 12], [44, 8], [50, 22], [24, 26]], '#8a6a48'); P(c, [[30, 40], [48, 54], [18, 56]], '#4a3626'); }));
/** Clods of earth thrown up out of a ditch: every `every` frames (give or take two) two or three clods leave `from`, fly up on a
 *  curve and land on the heap at `to` ([x, z] ranges, at height y), turning as they go, with a faint puff of dust when they land.
 *  Lagged throws: pass several with different `seed` and `delay`. Runs on every frame. */
export const DirtThrow: React.FC<{f: number; from: V3; to: {x: [number, number]; z: [number, number]; y: number}; every?: number; delay?: number; n?: number; up?: number; seed?: number; size?: number}> =
  ({f, from, to, every = 12, delay = 0, n = 3, up = 1.8, seed = 1, size = 0.22}) => {
    const life = 13, out: React.ReactNode[] = [];
    for (let k = Math.max(0, Math.floor((f - delay - life - 4) / every)); k <= Math.floor((f - delay) / every) + 1; k++) {
      const r = rnd(seed * 97 + k * 13), t0 = delay + k * every + Math.floor(r() * 5) - 2, m = 2 + (r() < 0.5 ? 1 : 0);
      for (let i = 0; i < Math.min(n, m); i++) {
        const u = (f - t0 - i) / life, tx = to.x[0] + r() * (to.x[1] - to.x[0]), tz = to.z[0] + r() * (to.z[1] - to.z[0]), h = up * (0.75 + r() * 0.5), s = size * (0.6 + r() * 0.8), spin = (r() - 0.5) * 1.4;
        if (u < 0 || u > 1.35) continue;
        if (u <= 1) {
          const x = from[0] + (tx - from[0]) * u + (r() - 0.5) * 0.1, y = from[1] + (to.y - from[1]) * u + 4 * h * u * (1 - u), zz = from[2] + (tz - from[2]) * u;
          out.push(<mesh key={`${k}-${i}`} position={[x, y, zz]} rotation={[0, 0, spin * (f - t0)]} renderOrder={5}><planeGeometry args={[s, s]} /><meshBasicMaterial map={clodTex()} transparent depthWrite={false} /></mesh>);
        } else out.push(<Halo key={`d${k}-${i}`} pos={[tx, to.y + 0.1, tz]} r={0.35 + (u - 1) * 1.2} color="#b89a74" strength={0.35 * (1.35 - u) / 0.35} />);
      }
    }
    return <>{out}</>;
  };

// ================================================================ the grey stone office (Westinghouse)
/** A three-floor office of pale grey stone with its gable end on the street: a recessed entrance with two stone steps and a
 *  two-leaf panelled wooden door (ajar: dark and warm inside), a sign board over the door, two ground-floor windows, smaller
 *  windows above, a pediment with a round window, a brass plate by the door. Local frame: the gable front at z = 0 facing +z,
 *  centred on x = 0; doorX = the door's offset; the right side wall (local +x) gets windows (it faces the main street).
 *  sign = the words on the board ('' = a plain band), night / lit = windows at night. */
export const OFFICE = {w: 16, d: 14, h: 11, recess: 0.55, door: 1.3, steps: 2, top: 2.62, sign: 2.9};
export const StoneOffice: React.FC<{pos: V3; doorX?: number; sign?: string; night?: boolean; lit?: number; warm?: string; ajar?: number}> = ({pos, doorX = 3, sign = '', night = false, lit = 0, warm = '#ffd486', ajar = 0.25}) => {
  const O = OFFICE, stone = '#b9b6ae', light = '#d6d2c8', trim = '#ece6da', dark = '#8e8a82';
  return (
    <group position={pos}>
      <B p={[0, O.h / 2, -O.d / 2 - O.recess]} s={[O.w, O.h, O.d - 2 * O.recess]} c={stone} />
      {/* the front in three pieces round the door opening (the box stands back, so the recess is open) */}
      {(() => { const a = doorX - O.door / 2, b = doorX + O.door / 2, H = O.h - 0.4, top = 2.62; return <>
        <Face w={a + O.w / 2} h={H} pos={[(-O.w / 2 + a) / 2, 0.4 + H / 2, 0.01]} color={stone} kind="stone" tile={3.4} seed={31} />
        <Face w={O.w / 2 - b} h={H} pos={[(b + O.w / 2) / 2, 0.4 + H / 2, 0.01]} color={stone} kind="stone" tile={3.4} seed={33} />
        <Face w={O.door} h={O.h - top} pos={[doorX, top + (O.h - top) / 2, 0.01]} color={stone} kind="stone" tile={3.4} seed={34} />
        <B p={[(-O.w / 2 + a) / 2, O.h / 2, -O.recess / 2]} s={[a + O.w / 2, O.h, O.recess - 0.02]} c={stone} />
        <B p={[(b + O.w / 2) / 2, O.h / 2, -O.recess / 2]} s={[O.w / 2 - b, O.h, O.recess - 0.02]} c={stone} />
        <B p={[doorX, (top + O.h) / 2, -O.recess / 2]} s={[O.door, O.h - top, O.recess - 0.02]} c={stone} />
      </>; })()}
      {[[-O.w / 2, doorX - O.door / 2 - 0.4], [doorX + O.door / 2 + 0.4, O.w / 2]].map(([x0, x1]) => <B key={x0} p={[(x0 + x1) / 2, 0.2, 0.08]} s={[x1 - x0, 0.4, 0.16]} c={dark} />)}
      {/* the pediment of the gable */}
      <mesh position={[0, O.h, 0.01]}><shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-O.w / 2 - 0.2, 0), new THREE.Vector2(O.w / 2 + 0.2, 0), new THREE.Vector2(0, 3.6)])]} /><meshLambertMaterial color={light} /></mesh>
      <mesh position={[0, O.h + 1.3, 0.03]}><circleGeometry args={[0.55, 16]} /><meshBasicMaterial color={glass(lit, warm, night)} /></mesh>
      <B p={[0, O.h + 0.06, 0.2]} s={[O.w + 0.5, 0.2, 0.45]} c={light} />
      {[-1, 1].map((k) => <B key={k} p={[k * (O.w / 4 + 0.95), O.h + 1.8, 0.05]} s={[O.w / 2 + 2.3, 0.16, 0.2]} r={[0, 0, -k * 0.42]} c={light} cast={false} />)}
      {/* the entrance: a deep stone surround, the recess with its steps, the door ajar */}
      <group position={[doorX, 0, 0]}>
        {[-1, 1].map((k) => <B key={k} p={[k * (O.door / 2 + 0.2), O.top / 2, 0.08]} s={[0.4, O.top, 0.16]} c={light} />)}
        <B p={[0, O.top - 0.1, 0.08]} s={[O.door + 0.8, 0.2, 0.16]} c={light} />
        <mesh position={[0, O.top / 2, -O.recess + 0.01]}><planeGeometry args={[O.door, O.top]} /><meshLambertMaterial color="#6a5a48" /></mesh>
        {[-1, 1].map((k) => <mesh key={k} position={[k * O.door / 2, O.top / 2, -O.recess / 2]} rotation={[0, -k * Math.PI / 2, 0]}><planeGeometry args={[O.recess, O.top]} /><meshLambertMaterial color={dark} /></mesh>)}
        {Array.from({length: O.steps}, (_, i) => <B key={i} p={[0, 0.08 + i * 0.15, -0.14 - i * 0.18]} s={[O.door + (O.steps - i) * 0.3, 0.16 + i * 0.15, 0.28 + (O.steps - 1 - i) * 0.04]} c={i ? light : '#cdc8bc'} />)}
        {/* two leaves: the left shut, the right open by `ajar` (warm dark inside) */}
        <mesh position={[0, 0.3 + (O.top - 0.32) / 2, -O.recess + 0.015]}><planeGeometry args={[O.door - 0.08, O.top - 0.32]} /><meshBasicMaterial color={night ? '#3a2a1e' : '#4a3424'} /></mesh>
        <mesh position={[0, 1.4, -O.recess + 0.017]}><planeGeometry args={[O.door * 0.5, 2.0]} /><meshBasicMaterial color={night ? '#f0c27a' : '#7a5636'} transparent opacity={night ? 0.5 * lit : 0.6} /></mesh>
        <B p={[-O.door / 4, 0.3 + (O.top - 0.32) / 2, -O.recess + 0.05]} s={[O.door / 2 - 0.05, O.top - 0.32, 0.06]} c="#6a4a30" />
        <group position={[O.door / 2, 0, -O.recess + 0.05]} rotation={[0, ajar * 1.2, 0]}><B p={[-O.door / 4, 0.3 + (O.top - 0.32) / 2, 0]} s={[O.door / 2 - 0.05, O.top - 0.32, 0.06]} c="#73513a" /></group>
        {[0.85, 1.85].map((y) => <B key={y} p={[-O.door / 4, y, -O.recess + 0.09]} s={[O.door / 2 - 0.25, 0.65, 0.02]} c="#5e4230" cast={false} />)}
        <B p={[-0.08, 1.5, -O.recess + 0.1]} s={[0.04, 0.12, 0.04]} c="#d8c27a" cast={false} />
        {/* the brass plate and a boot scraper */}
        <B p={[O.door / 2 + 0.7, 1.0, 0.03]} s={[0.36, 0.24, 0.02]} c="#c8a858" cast={false} />
        <B p={[O.door / 2 + 0.55, 0.12, 0.12]} s={[0.3, 0.06, 0.04]} c="#2a2a2c" cast={false} />
      </group>
      {sign ? <Sign text={sign} x={doorX} y={O.sign} w={3.8} h={0.36} board="#151515" ink="#e2c055" z={0.1} /> : <B p={[doorX, O.sign, 0.06]} s={[3.8, 0.36, 0.08]} c={light} cast={false} />}
      <B p={[0, 4.25, 0.1]} s={[O.w + 0.04, 0.22, 0.22]} c={light} />
      <B p={[0, 3.2, 0.06]} s={[O.w + 0.04, 0.12, 0.12]} c={light} cast={false} />
      {/* ground-floor windows either side of the door, the floors above */}
      {[doorX - 3.4, doorX + 3.0, -6.0].map((x, i) => <TallWindow key={`g${i}`} x={x} y={1.95} w={1.2} h={2.0} level={lit} warm={warm} night={night} trim={trim} stone={light} blind={i === 1 ? 0.3 : 0} />)}
      {[6.4, 9.3].map((y) => [-6, -3, 0, 3, 6].map((x, i) => <TallWindow key={`${y}-${x}`} x={x} y={y} w={1.0} h={1.75} level={(i + y) % 3 < 1 ? 0 : lit} warm={warm} night={night} trim={trim} stone={light} />))}
      {[-1, 1].map((k) => <B key={k} p={[k * (O.w / 2 - 0.2), O.h / 2, 0.08]} s={[0.4, O.h, 0.14]} c={light} cast={false} />)}
      {/* the side wall on the main street */}
      <group position={[O.w / 2 + 0.01, 0, -O.d / 2]} rotation={[0, Math.PI / 2, 0]}>
        <Face w={O.d} h={O.h - 0.4} pos={[0, 0.4 + (O.h - 0.4) / 2, 0]} color={stone} kind="stone" tile={3.4} seed={32} />
        <B p={[0, 4.25, 0.1]} s={[O.d, 0.22, 0.22]} c={light} />
        <B p={[0, O.h + 0.06, 0.2]} s={[O.d + 0.3, 0.2, 0.4]} c={light} />
        {[-4.5, -1.5, 1.5, 4.5].map((x) => [1.95, 6.4, 9.3].map((y, j) => <TallWindow key={`${x}-${y}`} x={x} y={y} w={1.1} h={j ? 1.75 : 2.0} level={(x + j) % 2 === 0 ? 0 : lit} warm={warm} night={night} trim={trim} stone={light} />))}
      </group>
      {/* a slate gable roof whose gable stands over the front pediment */}
      <group position={[0, O.h + 0.12, -O.d / 2 - 0.4]} rotation={[0, Math.PI / 2, 0]}><Roof w={O.d - 0.6} d={O.w + 0.5} h={3.35} pos={[0, 0, 0]} color="#5a5c62" ends={stone} /></group>
    </group>
  );
};

// ================================================================ the far tower of the bridge (a plate painter)
/** The stone tower of a great suspension bridge, far off in the haze: two tall piers joined at the top, two pointed (gothic)
 *  arches through it, a cornice, the main cables sagging away on both sides with thin hangers, the deck below. Painted in plate
 *  units: x = centre, base = foot, s = scale (s = 1 is about 120 x 300). The arches are cut out of the picture (see-through):
 *  paint the tower FIRST on its plate. t = stone, shade (right face), cable. */
export const paintBridgeTower = (c: Ctx, x: number, base: number, s: number, t: {stone: string; shade: string; cable: string}) => {
  const W = 120 * s, H = 300 * s, top = base - H, deck = base - H * 0.36;
  P(c, [[x - W / 2, base], [x - W / 2 + 4 * s, top + 22 * s], [x + W / 2 - 4 * s, top + 22 * s], [x + W / 2, base]], t.stone);
  P(c, [[x + W * 0.18, base], [x + W * 0.18, top + 22 * s], [x + W / 2 - 4 * s, top + 22 * s], [x + W / 2, base]], t.shade);
  P(c, [[x - W / 2 - 4 * s, top + 24 * s], [x - W / 2 - 4 * s, top + 10 * s], [x + W / 2 + 4 * s, top + 10 * s], [x + W / 2 + 4 * s, top + 24 * s]], t.shade);
  P(c, [[x - W / 2, top + 10 * s], [x - W / 2, top], [x + W / 2, top], [x + W / 2, top + 10 * s]], t.stone);
  // the two pointed arches, cut through
  c.save(); c.globalCompositeOperation = 'destination-out';
  [-1, 1].forEach((k) => { const ax = x + k * W * 0.22, aw = W * 0.16, spring = top + H * 0.3, foot = deck + 4 * s; c.beginPath(); c.moveTo(ax - aw, foot); c.lineTo(ax - aw, spring); c.quadraticCurveTo(ax - aw, spring - aw * 1.3, ax, spring - aw * 2.1); c.quadraticCurveTo(ax + aw, spring - aw * 1.3, ax + aw, spring); c.lineTo(ax + aw, foot); c.closePath(); c.fill(); });
  c.restore();
  // the deck, the cables and hangers
  c.fillStyle = t.shade; c.fillRect(x - 900 * s, deck, 1800 * s, 7 * s);
  c.strokeStyle = t.cable; c.lineWidth = 2.6 * s;
  [-1, 1].forEach((k) => { [0.24, 0.3].forEach((o) => { c.beginPath(); c.moveTo(x + k * W * o, top + 14 * s); c.quadraticCurveTo(x + k * 380 * s, deck + 40 * s, x + k * 820 * s, deck - 70 * s); c.stroke(); }); });
  c.lineWidth = 1.1 * s;
  for (let i = 1; i < 26; i++) [-1, 1].forEach((k) => { const u = i / 26, px = x + k * (W * 0.27 + u * 760 * s), py = (1 - u) * (1 - u) * (top + 14 * s) + 2 * u * (1 - u) * (deck + 40 * s) + u * u * (deck - 70 * s); c.beginPath(); c.moveTo(px, py); c.lineTo(px, deck); c.stroke(); });
};
