import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Poly, Rect, Disc, Arc, Diamond, Flame, ClothSway, StarField, twos, rand, deg} from '../../../../kit';
import type {V3, Pt} from '../../../../kit';
import {COLORS, MOUNTAINS, TOWERS, CLOUDS} from '../../shared';

/* Throne hall, episode copy (group A). The layout is the hub the film already uses (src/sets/ThroneHall.tsx: lane at
 * x = -1.2, dais of three steps, big and small throne, sun ring, two lanterns, armillary, towers, pines, peaks), rebuilt
 * on the kit with the finish of bible section 8: every surface is a FLAT tone (no lights involved, so the picture is
 * the same under any mood), 2-3 tones per object, no halo on lanterns or windows, no glints, no dust, constant stars.
 * Everything here is static except what the place explains: lantern flames, armillary rings, the drape. */

const H = COLORS.hall;
export const PAL = {
  // cream family one step down from the first build (review: mean luma was 165-169, target about 150): the thrones stay
  // the lightest things in the hall, columns are a greyer stone, the floor is a mid tone with a darker band by the dais
  cream: '#e4dcc0', creamTop: '#eee7cd', creamSide: '#b7b097', creamIn: '#cdc5a8', creamDeep: '#b0a98f',
  col: '#b9b3a2', colSide: '#98937f', colFlute: '#a8a291', colTop: '#cbc5b3',
  floor: '#cbc4ae', floorFar: '#b9b29d', floorMid: '#c3bca6', seam: '#b4ad97',
  floorCool: '#a9aebb', floorFarCool: '#979dad', floorMidCool: '#a1a6b4', seamCool: '#9399a9',
  step: '#d9d2ba', stepFront: '#b4ad95', stepCool: '#b6bbc7', stepFrontCool: '#959bab',
  lane: '#d3bb5e', laneEdge: H.gold2, laneCool: '#aaa57e', laneFront: '#b99f43', laneFrontCool: '#8f8c72',
  shadow: '#2a2850', pool: '#f6e6a6',
  gold: H.gold, gold2: H.gold2, goldL: H.goldLight, green: H.green, green2: H.green2, green3: '#3fae52',
  sky: H.sky, sky2: '#232680', skyBand: H.skyBand, skyLow: H.skyLow, purple: '#2b2766', purple2: '#352e74',
  lilac: '#b9bfe6', lilac2: '#aeb4de', lilacSide: '#9aa1cf', roof: TOWERS.roof, roofL: '#a6a3a6',
  pine: '#2f7a52', pine2: '#3b8a5c', snow: '#e8eef8', snow2: '#d3dcf0',
};
/** hall landmarks other files need (world units) */
export const HALL = {
  laneX: -1.2, daisY: 0.9, daisFrontZ: 0.0,
  bigThrone: [-1.2, 0.9, -6.6] as V3, smallThrone: [2.75, 0.9, -7.6] as V3,
  lanternL: [-5.5, 2.68, -4.9] as V3, lanternR: [5.4, 1.88, -7.4] as V3, lanternS: 1.3,
  armillary: [-7.7, 5.6, -6.6] as V3,
  colR: [8.2, 0.9, -4.2] as V3, colL: [-10.6, 0.9, -4.2] as V3, colW: 1.5,
  ring: [-1.2, 6.1, -9.4] as V3,
  /** the far cards (shared.ts coordinates) are shown at this scale, about the origin */
  farK: 0.6, farKY: 0.75, farY: -1.2, peakK: 0.8, peakX: 14,
};
const mixHex = (a: string, b: string, t: number) => `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`;

/** Box in three flat tones: front (c), top, sides. Unlit: it shows exactly these colours. */
export const TBox: React.FC<{size: V3; pos: V3; c: string; top?: string; side?: string}> = ({size, pos, c, top, side}) => {
  const t = top ?? mixHex(c, '#ffffff', 0.3), s = side ?? mixHex(c, '#5f5a7c', 0.34);
  return (
    <mesh position={pos}>
      <boxGeometry args={size} />
      {[s, s, t, t, c, c].map((col, i) => <meshBasicMaterial key={i} attach={`material-${i}`} color={col} toneMapped={false} fog={false} />)}
    </mesh>
  );
};
/** flat card lying on a horizontal surface (w along x, d along z) */
const Lay: React.FC<{w: number; d: number; pos: V3; color: string}> = ({w, d, pos, color}) => <Rect w={w} h={d} pos={pos} rot={[-Math.PI / 2, 0, 0]} color={color} />;
/** A cast shadow on a horizontal surface: a darker tone of whatever it falls on (a see-through navy card), with a
 *  second, wider and fainter copy for a soft edge. pts = [x, z] on the surface at height y. */
export const FloorShade: React.FC<{pts: Pt[]; y: number; k?: number; color?: string}> = ({pts, y, k = 1, color = PAL.shadow}) => {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const flat = (g: number): Pt[] => pts.map(([x, z]) => [cx + (x - cx) * g, -(cz + (z - cz) * g)]);
  return (
    <>
      <Poly pts={flat(1.1)} color={color} opacity={0.09 * k} pos={[0, y, 0]} rot={[-Math.PI / 2, 0, 0]} order={2} />
      <Poly pts={flat(0.97)} color={color} opacity={0.15 * k} pos={[0, y + 0.004, 0]} rot={[-Math.PI / 2, 0, 0]} order={3} />
    </>
  );
};
/** the hall's key light comes from the upper left front (the left lantern side): shadows fall to the right and back */
export const SUN: [number, number] = [0.9, -0.42];
/** shadow of a box with footprint w x d centred on (x, z), thrown len units along SUN */
export const BoxShade: React.FC<{x: number; z: number; w: number; d: number; len: number; y: number; k?: number}> = ({x, z, w, d, len, y, k}) => {
  const dx = SUN[0] * len, dz = SUN[1] * len, a = x - w / 2, b = x + w / 2, f = z + d / 2, r = z - d / 2;
  return <FloorShade y={y} k={k} pts={[[a, f], [b, f], [b + dx, f + dz], [b + dx, r + dz], [a + dx, r + dz], [a, r]]} />;
};
/** soft shadow at a figure's feet: a blob stretched along SUN (bible 8c: short, offset away from the key light) */
export const FigureShade: React.FC<{pos: V3; r: number; k?: number}> = ({pos, r, k = 1}) => (
  <group position={[pos[0] + SUN[0] * r * 0.55, pos[1] + 0.03, pos[2] + SUN[1] * r * 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
    <group rotation={[0, 0, Math.atan2(-SUN[1], SUN[0])]}>
      <Disc r={r * 1.35} sy={0.5} color={PAL.shadow} opacity={0.1 * k} order={2} />
      <Disc r={r * 1.05} sy={0.44} color={PAL.shadow} opacity={0.16 * k} pos={[-r * 0.1, 0, 0.004]} order={3} />
    </group>
  </group>
);
/** pool of warm light a lit lantern throws on the surface under it (flat, two steps; this is light ON the floor, not a halo) */
const Pool: React.FC<{pos: V3; r: number}> = ({pos, r}) => (
  <group position={pos} rotation={[-Math.PI / 2, 0, 0]}>
    <Disc r={r} sy={0.8} color={PAL.pool} opacity={0.2} order={4} />
    <Disc r={r * 0.6} sy={0.8} color={PAL.pool} opacity={0.24} pos={[0, 0, 0.004]} order={5} />
  </group>
);

/** gold knob: a flat disc with one lighter tone block */
const Knob: React.FC<{pos: V3; r: number}> = ({pos, r}) => (
  <group position={pos}>
    <Disc r={r} color={PAL.gold} /><Disc r={r * 0.62} color={PAL.goldL} pos={[-r * 0.2, r * 0.22, 0.01]} /><Disc r={r * 0.98} sy={0.3} color={PAL.gold2} pos={[0, -r * 0.62, 0.02]} />
  </group>
);

const Diamonds: React.FC<{w: number; h: number; s?: number}> = ({w, h, s = 1}) => {
  const items: React.ReactNode[] = [];
  for (let r = 0; r < 4; r++) {
    const y = h * (0.14 + (r * 0.72) / 3) - h / 2, xs = r % 2 ? [-0.36, -0.14, 0.14, 0.36] : [-0.3, -0.12, 0.12, 0.3];
    xs.forEach((fx, i) => items.push(<Diamond key={`${r}${i}`} w={0.1 * s} h={0.19 * s} color={PAL.goldL} pos={[fx * w, y, 0.02]} />));
  }
  return <>{items}</>;
};

/** Throne: slab back with a gable, gold disc and two spires; green panel with gold frame and diamonds; seat with a green
 *  cushion; arm pillars with inset panels and gold knobs; low front blocks on the big one. */
const Throne: React.FC<{pos: V3; big?: boolean; f: number; drape?: boolean}> = ({pos, big, f, drape}) => {
  const W = big ? 4.3 : 3.0, Hh = big ? 6.4 : 4.4, PW = big ? 3.2 : 2.05, PH = big ? 3.7 : 2.6, PY = big ? 1.75 : 1.25;
  const pillarH = big ? 3.0 : 1.55, pillarW = big ? 1.35 : 0.8, px = W / 2 + pillarW / 2 - 0.25, g = big ? 1.35 : 1;
  return (
    <group position={pos}>
      <TBox size={[W, Hh, 0.5]} pos={[0, Hh / 2, -1.0]} c={PAL.cream} />
      {/* back slab trims: a darker inset border and a base band */}
      <Rect w={W - 0.3} h={Hh - 0.5} pos={[0, Hh / 2 - 0.05, -0.745]} color={PAL.creamTop} />
      <Rect w={W} h={0.3} pos={[0, 0.15, -0.74]} color={PAL.creamIn} />
      <TBox size={[W + 0.3, 0.22, 0.66]} pos={[0, Hh - 0.1, -1.0]} c={PAL.gold} top={PAL.goldL} side={PAL.gold2} />
      {/* gable with gold disc */}
      <TBox size={[W * 0.9, 0.24, 0.56]} pos={[0, Hh + 0.13, -1.0]} c={PAL.creamIn} />
      <Poly pts={[[-W * 0.45, 0], [W * 0.45, 0], [0, 1.25 * g]]} color={PAL.creamTop} pos={[0, Hh + 0.25, -0.74]} />
      <Poly pts={[[-W * 0.45, 0], [0, 1.25 * g], [0, 1.08 * g], [-W * 0.36, 0.08]]} color={PAL.creamSide} pos={[0, Hh + 0.25, -0.735]} />
      <Poly pts={[[W * 0.45, 0], [0, 1.25 * g], [0, 1.08 * g], [W * 0.36, 0.08]]} color={PAL.creamIn} pos={[0, Hh + 0.25, -0.735]} />
      <Disc r={0.26 * g} color={PAL.gold} pos={[0, Hh + 0.25 + 0.44 * g, -0.72]} /><Disc r={0.13 * g} color="#fbf0c4" pos={[0, Hh + 0.25 + 0.44 * g, -0.71]} />
      {[-1, 1].map((k) => (
        <group key={k} position={[k * (W / 2 - 0.12), Hh, -1.0]}>
          <TBox size={[0.34 * g, 1.3 * g, 0.34 * g]} pos={[0, 0.65 * g, 0]} c={PAL.cream} />
          <Poly pts={[[-0.2 * g, 0], [0.2 * g, 0], [0, 0.9 * g]]} color={PAL.gold} pos={[0, 1.3 * g, 0.18 * g]} />
          <Poly pts={[[0, 0], [0.2 * g, 0], [0, 0.9 * g]]} color={PAL.gold2} pos={[0, 1.3 * g, 0.185 * g]} />
        </group>
      ))}
      {/* green panel, gold frame, diamonds */}
      <group position={[0, PY + PH / 2, -0.72]}>
        <Rect w={PW + 0.3} h={PH + 0.3} color={PAL.gold} /><Rect w={PW + 0.12} h={PH + 0.12} color={PAL.gold2} pos={[0, 0, 0.005]} />
        <Rect w={PW} h={PH} color={PAL.green} pos={[0, 0, 0.01]} />
        <Rect w={PW} h={PH * 0.14} color={PAL.green3} pos={[0, -PH * 0.43, 0.015]} />
        <Diamonds w={PW} h={PH} s={big ? 1 : 0.7} />
      </group>
      {/* seat + cushion */}
      <TBox size={[W - 0.5, big ? 1.1 : 0.8, 1.5]} pos={[0, big ? 0.55 : 0.4, -0.1]} c={PAL.creamIn} top={PAL.creamTop} />
      <TBox size={[W - 0.9, 0.16, 1.3]} pos={[0, big ? 1.18 : 0.88, -0.05]} c={PAL.green2} top={PAL.green} side={PAL.green2} />
      <Rect w={(W - 0.9) * 0.3} h={big ? 0.8 : 0.56} color={PAL.green2} pos={[0, big ? 0.6 : 0.44, 0.66]} />
      <Rect w={(W - 0.9) * 0.3 + 0.12} h={big ? 0.8 : 0.56} color={PAL.gold} pos={[0, big ? 0.6 : 0.44, 0.655]} />
      {/* arm pillars */}
      {[-1, 1].map((k) => (
        <group key={k}>
          <TBox size={[pillarW, pillarH, 1.3]} pos={[k * px, pillarH / 2, -0.2]} c={PAL.cream} />
          <Rect w={pillarW * 0.58} h={pillarH * 0.62} color={PAL.creamIn} pos={[k * px, pillarH * 0.48, 0.46]} />
          <Rect w={pillarW * 0.58} h={0.06} color={PAL.creamDeep} pos={[k * px, pillarH * 0.48 + pillarH * 0.31, 0.465]} />
          <TBox size={[pillarW + 0.1, 0.1, 1.4]} pos={[k * px, pillarH + 0.05, -0.2]} c={PAL.gold} top={PAL.goldL} side={PAL.gold2} />
          <Knob pos={[k * px, pillarH + (big ? 0.42 : 0.3), 0.46]} r={big ? 0.33 : 0.22} />
        </group>
      ))}
      {big ? [-1, 1].map((k) => (
        <group key={k}>
          <TBox size={[1.05, 0.92, 1.0]} pos={[k * 1.22, 0.46, 1.5]} c={PAL.cream} />
          <TBox size={[1.12, 0.1, 1.07]} pos={[k * 1.22, 0.97, 1.5]} c={PAL.gold} top={PAL.goldL} side={PAL.gold2} />
          <Rect w={0.62} h={0.5} color={PAL.creamIn} pos={[k * 1.22, 0.42, 2.01]} />
        </group>
      )) : null}
      {/* the small throne's green drape: thrown over its right arm, loose edge free (AMBIENT cloth) */}
      {drape ? (
        <group position={[px + 0.02, pillarH + 0.12, 0.5]}>
          <Rect w={pillarW + 0.16} h={0.14} color={PAL.green2} pos={[0, 0, 0]} />
          <ClothSway kind="banner" pos={[0, -0.04, 0.012]} w={pillarW + 0.1} h={pillarH * 0.86} f={f} color={PAL.green} stripe={PAL.gold} notch amp={0.085} seed={3} />
        </group>
      ) : null}
    </group>
  );
};

/** Lantern: flat pieces. Lit = cream panes with a flat flame (no halo); off = slate panes, no flame. */
export const Lantern: React.FC<{pos: V3; s?: number; on: boolean; f: number; seed?: number}> = ({pos, s = 1, on, f, seed = 0}) => (
  <group position={pos} scale={s}>
    <Rect w={0.12} h={1.4} color={PAL.gold2} pos={[0, 0.7, 0]} />
    <Rect w={0.34} h={0.1} color={PAL.gold} pos={[0, 0.05, 0.005]} />
    <Rect w={0.7} h={0.1} color={PAL.gold} pos={[0, 1.42, 0.005]} />
    <Rect w={0.56} h={0.98} color={PAL.gold2} pos={[0, 1.94, 0]} />
    <Rect w={0.46} h={0.9} color={on ? H.lanternOn : H.lanternOff} pos={[0, 1.94, 0.005]} />
    {on ? <Flame pos={[0, 1.6, 0.01]} w={0.12} h={0.56} f={f} seed={seed} colors={['#f08a2c', H.lanternFlame, '#fff8de']} /> : null}
    {[-0.115, 0.115].map((x) => <Rect key={x} w={0.035} h={0.9} color={PAL.gold} pos={[x, 1.94, 0.02]} />)}
    <Rect w={0.46} h={0.035} color={PAL.gold} pos={[0, 2.12, 0.02]} />
    <Rect w={0.7} h={0.1} color={PAL.gold} pos={[0, 2.46, 0.005]} />
    <Poly pts={[[-0.42, 0], [0.42, 0], [0, 0.46]]} color={PAL.gold} pos={[0, 2.5, 0.006]} />
    <Poly pts={[[0, 0], [0.42, 0], [0, 0.46]]} color={PAL.gold2} pos={[0, 2.5, 0.008]} />
    <Disc r={0.09} color={PAL.goldL} pos={[0, 3.02, 0.01]} />
  </group>
);

/** Armillary: globe on a post with three rings that turn (mechanical loop, on twos). */
const Armillary: React.FC<{pos: V3; f: number}> = ({pos, f}) => {
  const t = twos(f);
  return (
    <group position={pos} scale={0.95}>
      <Rect w={0.14} h={4.6} color={PAL.gold2} pos={[0, -2.6, -0.02]} />
      <Rect w={1.3} h={0.14} color={PAL.gold} pos={[0, -1.35, -0.01]} />
      <Poly pts={[[-0.65, 0.07], [-0.65, 0.5], [-0.3, 0.07]]} color={PAL.goldL} pos={[0, -1.35, -0.01]} />
      <Disc r={0.62} color="#6f8fc4" /><Disc r={0.62} sy={0.5} color="#5f7fb8" pos={[0, -0.3, 0.004]} />
      {[[0.2, 0.25, 0.3], [-0.25, -0.05, 0.26], [0.1, -0.3, 0.2], [0.75, 0.1, 0.24], [-0.85, 0.3, 0.2]].map(([x0, y, r], i) => {
        const u = (((x0 / 0.62 + t * 0.045 + 1) % 2) + 2) % 2 - 1; if (Math.abs(u) > 0.86) return null;
        const k = Math.sqrt(1 - u * u);
        return <group key={i} position={[u * 0.6, y, 0.008]} scale={[k, 1, 1]}><Disc r={r * 0.8} color="#4f9b5a" /></group>;
      })}
      {[0, 1, 2].map((i) => {
        // fixed tilted rings; the beads all run the same way round, as the globe turns (one steady direction)
        const R = 1.0 + i * 0.17, tilt = [28, -38, 74][i], sy = [0.34, 0.5, 0.28][i], u = ((t * (0.022 + i * 0.006) + i * 0.37) % 1), a = Math.PI * (1 + u * 2);
        return (
          <group key={i} rotation={[0, 0, deg(tilt)]} position={[0, 0, 0.012 + i * 0.004]}>
            <group scale={[1, sy, 1]}><Arc r1={R - 0.045} r2={R + 0.045} color={i === 1 ? PAL.goldL : PAL.gold} /></group>
            {/* the bead crosses the front of its ring left to right, the way the globe turns, and is hidden while behind */}
            {u < 0.5 ? <Disc r={0.13} color="#f4f6ff" pos={[Math.cos(a) * R, Math.sin(a) * R * sy, 0.006]} /> : null}
          </group>
        );
      })}
    </group>
  );
};

/** Hall column: square, fluted, gold-banded base, a hanging cream banner with a gold chevron. y0 = floor it stands on. */
export const Column: React.FC<{pos: V3; w?: number; h?: number; banner?: number | false}> = ({pos, w = HALL.colW, h = 30, banner = 7.4}) => (
  <group position={pos}>
    <TBox size={[w * 1.42, 0.55, w * 1.42]} pos={[0, 0.275, 0]} c={PAL.cream} top={PAL.creamTop} side={PAL.creamSide} />
    <TBox size={[w * 1.28, 0.2, w * 1.28]} pos={[0, 0.65, 0]} c={PAL.gold} top={PAL.goldL} side={PAL.gold2} />
    <TBox size={[w, h, w]} pos={[0, 0.75 + h / 2, 0]} c={PAL.col} top={PAL.colTop} side={PAL.colSide} />
    {[-0.3, -0.1, 0.1, 0.3].map((x) => <Rect key={x} w={w * 0.07} h={h - 1.2} color={PAL.colFlute} pos={[x * w, 0.75 + h / 2 + 0.5, w / 2 + 0.006]} />)}
    {[-1, 1].map((k) => [-0.3, -0.1, 0.1, 0.3].map((x) => <Rect key={`${k}${x}`} w={w * 0.07} h={h - 1.2} color="#b3ab96" pos={[k * (w / 2 + 0.006), 0.75 + h / 2 + 0.5, x * w]} rot={[0, Math.PI / 2, 0]} />))}
    <Rect w={w} h={0.34} color={PAL.colTop} pos={[0, 1.0, w / 2 + 0.008]} />
    {banner !== false ? (
      <group position={[0, banner, w / 2 + 0.02]}>
        <Poly pts={[[-w * 0.36, 9], [w * 0.36, 9], [w * 0.36, 0.5], [0, 0], [-w * 0.36, 0.5]]} color={PAL.creamTop} />
        <Poly pts={[[-w * 0.36, 1.25], [0, 0.72], [w * 0.36, 1.25], [w * 0.36, 0.95], [0, 0.42], [-w * 0.36, 0.95]]} color={PAL.gold} pos={[0, 0, 0.006]} />
        <Rect w={w * 0.06} h={7.4} color={PAL.creamIn} pos={[-w * 0.2, 5.3, 0.006]} />
      </group>
    ) : null}
  </group>
);

/** One flat cloud in two tones (shared.ts CLOUDS: the same card the conjured clouds use). Origin = its centre. */
export const CloudCard: React.FC<{pos: V3; s: number; tones?: [string, string]}> = ({pos, s, tones = [CLOUDS.tones.top, CLOUDS.tones.under]}) => (
  <group position={pos} scale={[s, s, 1]}>
    {CLOUDS.lumpsUnder.map(([x, y, r], i) => <Disc key={`u${i}`} r={r} color={tones[1]} pos={[x, y, -0.02]} seg={28} />)}
    {CLOUDS.lumpsTop.map(([x, y, r], i) => <Disc key={i} r={r} color={tones[0]} pos={[x, y, 0]} seg={28} />)}
    <Rect w={CLOUDS.base.w} h={CLOUDS.base.h * 0.5} color={tones[0]} pos={[0, CLOUDS.base.y + 0.5, 0.01]} />
    <Rect w={CLOUDS.base.w * 0.8} h={0.26} color={tones[1]} pos={[0, CLOUDS.base.y + 0.13, 0.02]} />
  </group>
);

const Tower: React.FC<{pos: V3; h: number; w: number; c: string; off?: (i: number) => boolean}> = ({pos, h, w, c, off}) => (
  <group position={pos}>
    <Rect w={w} h={h} color={c} pos={[0, h / 2, 0]} />
    <Rect w={w * 0.26} h={h} color={PAL.lilacSide} pos={[w * 0.37, h / 2, 0.05]} />
    <Rect w={w * 1.2} h={w * 0.3} color={c} pos={[0, h, 0.1]} /><Rect w={w * 1.2} h={w * 0.08} color={PAL.lilacSide} pos={[0, h - w * 0.11, 0.15]} />
    <Rect w={w} h={w * 0.07} color={PAL.lilacSide} pos={[0, h * 0.3, 0.1]} />
    <Poly pts={[[-w * 0.66, 0], [w * 0.66, 0], [0, w * 2.3]]} color={PAL.roofL} pos={[0, h + w * 0.15, 0.1]} />
    <Poly pts={[[0, 0], [w * 0.66, 0], [0, w * 2.3]]} color={PAL.roof} pos={[0, h + w * 0.15, 0.15]} />
    {TOWERS.windowHeights.map((k, i) => <Diamond key={i} w={0.1 * w} h={0.16 * w} color={off?.(i) ? TOWERS.windowOff : TOWERS.window} pos={[(i % 2 ? 0.2 : -0.2) * w, h * k, 0.2]} />)}
  </group>
);

export type HallProps = {
  f: number;
  /** left and right lantern lit */
  lanterns?: [boolean, boolean];
  /** floor and steps one cool step darker (S5 after both lanterns are off) */
  cool?: boolean;
  /** foreground columns: x, z and width; they stand on the floor */
  fore?: {x: number; z: number; w?: number}[];
  /** tower window switched off: (tower index in near+far order, window index) */
  winOff?: (tower: number, win: number) => boolean;
  /** stars in the sky field (only a part is in frame); starBox = [centre x, centre y, width, height] of the field at z = -164 */
  stars?: number; starSeed?: number; starBox?: [number, number, number, number];
  drape?: boolean;
  /** hide the screen-right hall column (S2 draws its own cracked copy) */
  noColR?: boolean;
};

export const Hall: React.FC<HallProps> = ({f, lanterns = [true, true], cool, fore = [], winOff, stars = 150, starSeed = 4, starBox = [0, 44, 330, 84], drape = true, noColR}) => {
  const pines = useMemo(() => { const r = rand(5); return Array.from({length: 90}, (_, i) => [-135 + i * 3 + r() * 2, 7 + r() * 5] as const); }, []);
  const K = HALL.farK, M = MOUNTAINS;
  const floor = cool ? PAL.floorCool : PAL.floor, step = cool ? PAL.stepCool : PAL.step, stepF = cool ? PAL.stepFrontCool : PAL.stepFront, lane = cool ? PAL.laneCool : PAL.lane;
  const floorFar = cool ? PAL.floorFarCool : PAL.floorFar, floorMid = cool ? PAL.floorMidCool : PAL.floorMid, seam = cool ? PAL.seamCool : PAL.seam, laneF = cool ? PAL.laneFrontCool : PAL.laneFront;
  const sk = cool ? 0.75 : 1, dY = HALL.daisY + 0.012;
  const purple = (y0: number, amp: number, j: number): Pt[] => { const pts: Pt[] = [[-260, 170]]; for (let i = 0; i <= 52; i++) pts.push([-260 + i * 10, y0 + Math.abs(Math.sin(i * 0.9 + j * 1.3)) * amp + (i % 3) * 1.5]); pts.push([260, 170]); return pts; };
  return (
    <group>
      {/* ---------- sky: navy, two purple cloud bands high up, a lighter band at the horizon, constant stars ---------- */}
      <Rect w={700} h={300} color={PAL.sky} pos={[0, 60, -170]} />
      <Poly pts={purple(40, 8, 0)} color={PAL.purple} pos={[0, 0, -168]} />
      <Poly pts={purple(52, 6, 1)} color={PAL.purple2} pos={[14, 0, -167]} />
      <Poly pts={[[-260, -30], [260, -30], [260, 13], [150, 19], [40, 14], [-70, 20], [-180, 15], [-260, 18]]} color={PAL.skyLow} pos={[0, 0, -166]} />
      <Poly pts={[[-260, -30], [260, -30], [260, 6], [120, 10], [0, 5], [-130, 11], [-260, 7]]} color={PAL.skyBand} pos={[0, 0, -165]} />
      <StarField pos={[starBox[0], starBox[1], -164]} size={[starBox[2], starBox[3]]} count={stars} seed={starSeed} px={[4, 8]} colors={['#f6f1dc', '#f6f1dc', '#f6f1dc', '#ffe9a0', '#dfe6ff']} />

      {/* ---------- far cards (shared.ts shapes at scale K): peaks with caps and the shadow facet, ridge, pines, hill, snow ---------- */}
      <group position={[HALL.peakX, HALL.farY, 0]} scale={[HALL.peakK, HALL.peakK, 1]}>
        <Rect w={900} h={20} color={M.range.color} pos={[0, -12, M.range.pos[2] - 1]} />
        <Poly pts={M.range.pts} color={M.range.color} pos={M.range.pos} />
        <Poly pts={M.facet.pts} color={M.facet.color} pos={[M.range.pos[0], M.range.pos[1], M.range.pos[2] + 0.4]} />
        {M.summits.map(([x, y], i) => <Poly key={i} pts={M.cap.pts} color={M.cap.color} pos={[x, y + M.cap.dy, M.range.pos[2] + 0.8]} />)}
        <Rect w={900} h={16} color={M.frontRidge.color} pos={[0, -10, M.frontRidge.pos[2] - 1]} />
        <Poly pts={M.frontRidge.pts} color={M.frontRidge.color} pos={M.frontRidge.pos} />
      </group>
      <group position={[0, HALL.farY, 0]} scale={[K, HALL.farKY, 1]}>
        {([[-58, 9, 5.2], [-10, 8, 4.4], [36, 11, 5.6], [92, 8, 4.6], [-118, 10, 4.8], [140, 9, 4.2]] as const).map(([x, y, sc], i) => <CloudCard key={i} pos={[x, y, -119 - i * 0.6]} s={sc} tones={i % 2 ? ['#dfe6f6', '#c3cee8'] : ['#e9eef9', '#cdd7ee']} />)}
        {pines.map(([x, h], i) => <Poly key={i} pts={[[-2.1, 0], [0, h], [2.1, 0]]} color={i % 2 ? PAL.pine : PAL.pine2} pos={[x * 1.7, -3.5, -106 + (i % 3)]} />)}
        <Rect w={900} h={12} color={PAL.pine} pos={[0, -8, -103]} />
        <Rect w={900} h={10} color={M.snowField.color} pos={[0, -10, M.snowField.pos[2] - 0.5]} />
        <Poly pts={M.snowField.pts} color={M.snowField.color} pos={M.snowField.pos} />
        {TOWERS.far.map((t, i) => <Tower key={`f${i}`} pos={t.pos as V3} h={t.h} w={t.w} c={i % 2 ? '#a2a8d4' : PAL.lilac2} off={(w) => !!winOff?.(TOWERS.near.length + i, w)} />)}
        {/* rounded snow banks between the far and near towers */}
        {[[-46, -1, 13, 0], [-14, -2, 10, 1], [30, -1.5, 14, 0], [58, -2, 11, 1], [-78, -2, 12, 1], [88, -1, 12, 0]].map(([x, y, r, k], i) => <Disc key={i} r={r} sy={0.5} color={k ? PAL.snow2 : PAL.snow} pos={[x, y - 4, -60 + i * 0.5]} />)}
        {TOWERS.near.map((t, i) => <Tower key={`n${i}`} pos={t.pos as V3} h={t.h} w={t.w} c={i % 2 ? PAL.lilac2 : PAL.lilac} off={(w) => !!winOff?.(i, w)} />)}
        {[[-30, -3, 8, 0], [2, -4, 9, 1], [27, -3.5, 7, 0], [-58, -4, 9, 1], [52, -4, 8, 1]].map(([x, y, r, k], i) => <Disc key={i} r={r} sy={0.5} color={k ? PAL.snow2 : PAL.snow} pos={[x, y - 3.5, -34 + i * 0.4]} />)}
      </group>

      {/* ---------- sun ring behind the thrones ---------- */}
      <group position={HALL.ring}>
       <group rotation={[0, 0, -deg(twos(f) * 0.3)]}>
        {Array.from({length: 9}, (_, i) => { const a0 = -28.6 + i * 26.9; return <Arc key={i} r1={4.55} r2={4.95} a0={a0} a1={a0 + 21.8} color={i % 2 ? '#f0dc8c' : '#e6c659'} />; })}
        <Arc r1={4.05} r2={4.17} a0={-34} a1={214} color="#e3c458" pos={[0, 0, 0.01]} />
        {Array.from({length: 6}, (_, i) => { const a0 = -17 + i * 37.8; return <Arc key={i} r1={5.3} r2={5.42} a0={a0} a1={a0 + 24} color="#f0dc8c" pos={[0, 0, 0.01]} />; })}
        {[-0.3, 0.12, 0.55, 0.98, 1.4, 1.74, 2.16, 2.6, 3.02, 3.44].map((a, i) => <Poly key={i} pts={[[-0.36, 5.75], [0.36, 5.75], [0, i % 2 ? 7.3 : 6.7]]} color={i % 2 ? '#f1e39a' : '#e8cf6a'} rot={[0, 0, a - Math.PI / 2]} />)}
       </group>
       {/* the sun ring turns slowly as one piece (mechanical loop, on twos); its inner hoop is fixed */}
      </group>

      {/* ---------- floor, gold cross strips, lane with borders and diamond inlays ---------- */}
      <TBox size={[120, 1, 100]} pos={[0, -0.5, -8]} c={floor} top={floor} side={floor} />
      {/* the floor in three flat bands (darkest by the dais, where the lanterns do not reach), with stone seams */}
      <Lay w={120} d={4.6} pos={[0, 0.006, 2.3]} color={floorFar} />
      <Lay w={120} d={3.4} pos={[0, 0.006, 6.3]} color={floorMid} />
      {[-1, 1].map((k) => Array.from({length: 11}, (_, i) => <Lay key={`sx${k}${i}`} w={0.07} d={34} pos={[HALL.laneX + k * (5.0 + i * 3.6), 0.008, 17]} color={seam} />))}
      {[11.4, 14.8, 18.2, 21.6].map((z) => <Lay key={`sz${z}`} w={120} d={0.07} pos={[0, 0.008, z]} color={seam} />)}
      {[8, 4.6].map((z) => <Lay key={z} w={120} d={0.24} pos={[0, 0.012, z]} color={PAL.gold} />)}
      <Lay w={4.6} d={28} pos={[HALL.laneX, 0.016, 14]} color={lane} />
      {[-1, 1].map((k) => <Lay key={k} w={0.2} d={28} pos={[HALL.laneX + k * 2.2, 0.02, 14]} color={PAL.laneEdge} />)}
      {[-1, 1].map((k) => [1.6, 4.0, 6.4, 9.2, 12].map((z) => <Poly key={`${k}${z}`} pts={[[0, 0.42], [0.3, 0], [0, -0.42], [-0.3, 0]]} color={PAL.gold} pos={[HALL.laneX + k * 3.3, 0.014, z]} rot={[-Math.PI / 2, 0, 0]} />))}
      {/* dais: three steps with gold nosings; the lane climbs them */}
      {[[22, 13, 0.15, -6.5], [20, 12, 0.45, -7.0], [18, 11, 0.75, -7.5]].map(([w, d, y, z], i) => (
        <group key={i}>
          <TBox size={[w, 0.3, d]} pos={[1.4, y, z]} c={stepF} top={step} side={stepF} />
          <TBox size={[w + 0.06, 0.09, 0.14]} pos={[1.4, y + 0.11, z + d / 2 + 0.02]} c={PAL.gold} top={PAL.goldL} side={PAL.gold2} />
          <Rect w={4.6} h={0.3} color={laneF} pos={[HALL.laneX, y, z + d / 2 + 0.012]} />
        </group>
      ))}
      {[[0.312, -0.5, 1.0], [0.612, -1.5, 1.0], [0.912, -3.6, 3.2]].map(([y, z, d], i) => <Lay key={i} w={4.6} d={d} pos={[HALL.laneX, y, z]} color={lane} />)}
      {/* seams on the top step, cast shadows of everything that stands on the dais, and the lantern pools */}
      {[-6.4, -3.7, 1.3, 4.0, 6.7, 9.4].map((x) => <Lay key={`dx${x}`} w={0.06} d={10.6} pos={[x, dY - 0.004, -7.5]} color={stepF} />)}
      <BoxShade x={HALL.bigThrone[0]} z={HALL.bigThrone[2] - 0.2} w={6.3} d={2.4} len={2.6} y={dY} k={sk} />
      <BoxShade x={HALL.smallThrone[0]} z={HALL.smallThrone[2] - 0.2} w={4.1} d={2.2} len={1.9} y={dY} k={sk} />
      <BoxShade x={-5.5} z={-5.0} w={1.3} d={1.3} len={1.5} y={dY} k={sk} />
      <BoxShade x={-7.1} z={-4.0} w={1.0} d={1.0} len={1.0} y={dY} k={sk} />
      <BoxShade x={HALL.lanternR[0]} z={HALL.lanternR[2] - 0.1} w={1.0} d={1.0} len={1.1} y={dY} k={sk} />
      {noColR ? null : <BoxShade x={HALL.colR[0]} z={HALL.colR[2]} w={2.1} d={2.1} len={4.2} y={dY} k={sk} />}
      <BoxShade x={HALL.colL[0]} z={HALL.colL[2]} w={2.1} d={2.1} len={4.2} y={dY} k={sk} />
      {fore.map((c, i) => <BoxShade key={i} x={c.x} z={c.z} w={(c.w ?? 1.5) * 1.42} d={(c.w ?? 1.5) * 1.42} len={4.5} y={0.02} k={sk} />)}
      {/* the dais throws a thin shade on the floor in front of its lowest step */}
      <FloorShade y={0.02} k={sk * 0.9} pts={[[-9.6, 0.0], [12.4, 0.0], [12.9, 0.55], [-9.4, 0.55]]} />
      {lanterns[0] ? <Pool pos={[HALL.lanternL[0] + 0.5, dY + 0.01, HALL.lanternL[2] + 2.3]} r={2.5} /> : null}
      {lanterns[1] ? <Pool pos={[HALL.lanternR[0] - 0.2, dY + 0.01, HALL.lanternR[2] + 2.4]} r={2.2} /> : null}
      {/* balustrade: base, balusters, rail, posts with gold caps */}
      <TBox size={[80, 0.26, 0.6]} pos={[0, 0.13, -14.5]} c={PAL.creamIn} top={PAL.creamTop} />
      {Array.from({length: 114}, (_, i) => <Rect key={i} w={0.2} h={1.0} color={PAL.creamSide} pos={[-34 + i * 0.6, 0.76, -14.5]} />)}
      <TBox size={[80, 0.18, 0.8]} pos={[0, 1.35, -14.5]} c={PAL.cream} top={PAL.creamTop} />
      {Array.from({length: 13}, (_, i) => (
        <group key={i} position={[-36 + i * 6, 0, -14.45]}>
          <TBox size={[0.7, 1.7, 0.7]} pos={[0, 0.85, 0]} c={PAL.cream} /><TBox size={[0.84, 0.12, 0.84]} pos={[0, 1.76, 0]} c={PAL.gold} top={PAL.goldL} side={PAL.gold2} />
        </group>
      ))}

      {/* ---------- thrones ---------- */}
      <Throne pos={HALL.bigThrone} big f={f} />
      <Throne pos={HALL.smallThrone} f={f} drape={drape} />

      {/* ---------- left: pedestals, lantern, armillary ---------- */}
      <TBox size={[1.25, 1.7, 1.25]} pos={[-5.5, 1.75, -5.0]} c={PAL.cream} />
      <Rect w={0.75} h={1.0} color={PAL.creamIn} pos={[-5.5, 1.7, -4.37]} />
      <TBox size={[1.34, 0.12, 1.34]} pos={[-5.5, 1.0, -5.0]} c={PAL.gold} top={PAL.goldL} side={PAL.gold2} />
      <TBox size={[1.4, 0.1, 1.4]} pos={[-5.5, 2.63, -5.0]} c={PAL.gold} top={PAL.goldL} side={PAL.gold2} />
      <Lantern pos={HALL.lanternL} s={HALL.lanternS} on={lanterns[0]} f={f} seed={0} />
      <TBox size={[1.0, 1.0, 1.0]} pos={[-7.1, 1.4, -4.0]} c={PAL.creamIn} top={PAL.creamTop} />
      <TBox size={[1.06, 0.1, 1.06]} pos={[-7.1, 1.95, -4.0]} c={PAL.gold} top={PAL.goldL} side={PAL.gold2} />
      <Armillary pos={HALL.armillary} f={f} />
      {/* right lantern on its plinth */}
      <TBox size={[1.0, 0.9, 1.0]} pos={[HALL.lanternR[0], 1.35, HALL.lanternR[2] - 0.1]} c={PAL.cream} />
      <Rect w={0.6} h={0.5} color={PAL.creamIn} pos={[HALL.lanternR[0], 1.32, HALL.lanternR[2] + 0.41]} />
      <TBox size={[1.08, 0.1, 1.08]} pos={[HALL.lanternR[0], 1.83, HALL.lanternR[2] - 0.1]} c={PAL.gold} top={PAL.goldL} side={PAL.gold2} />
      <Lantern pos={HALL.lanternR} s={HALL.lanternS} on={lanterns[1]} f={f} seed={2.4} />

      {/* ---------- columns ---------- */}
      {noColR ? null : <Column pos={HALL.colR} banner={5.6} />}
      <Column pos={HALL.colL} banner={5.6} />
      {fore.map((c, i) => <Column key={i} pos={[c.x, 0, c.z]} w={c.w ?? 1.5} />)}
    </group>
  );
};
