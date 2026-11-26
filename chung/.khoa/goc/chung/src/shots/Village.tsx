import React, {useMemo} from 'react';
import * as THREE from 'three';
import type {ShotDef} from './types';
import {Box, Cyl, Poly, Speck} from '../three/prims';
import {ImageCard} from '../three/ImageCard';
import {Post} from '../three/Post';
import {Cam, V3, lerp, lerp3, track, trackObj, drift} from '../three/stage';
import {delayRender, continueRender, staticFile} from 'remotion';
import {useThree} from '@react-three/fiber';

// ---------------------------------------------------------------- measuring helpers
// The set is laid out straight from the reference frame (232): every element is given as a PIXEL rectangle / polygon at a
// chosen depth z, and converted to world units for the first-frame camera (pos [0, CY, CZ], looking level, fov 30).
const CY = 2.2, CZ = 17, FPX = 360 / Math.tan((15 * Math.PI) / 180); // focal length in px for a 720-high frame
const D = (z: number) => CZ - z;
const wx = (px: number, z: number) => ((px - 640) * D(z)) / FPX;
const wy = (py: number, z: number) => CY + ((360 - py) * D(z)) / FPX;
const ws = (len: number, z: number) => (len * D(z)) / FPX;
/** depth at which the ground (y=0) appears at screen row py */
const zAtRow = (py: number) => CZ - (CY * FPX) / (py - 360);
type R = [number, number, number, number]; // x0, y0, x1, y1 in px

/** lit box whose FRONT face covers pixel rect r at depth z */
const PBox: React.FC<{r: R; z: number; d?: number; color: string; cast?: boolean; unlit?: boolean}> = ({r, z, d = 0.3, color, cast, unlit}) => {
  const [x0, y0, x1, y1] = r;
  return <Box size={[ws(x1 - x0, z), ws(y1 - y0, z), d]} pos={[wx((x0 + x1) / 2, z), wy((y0 + y1) / 2, z), z - d / 2]} color={color} cast={cast ?? false} unlit={unlit} />;
};
/** flat unlit polygon from pixel points at depth z */
const PP: React.FC<{pts: [number, number][]; z: number; color: string}> = ({pts, z, color}) => (
  <Poly pts={pts.map(([x, y]) => [wx(x, z), wy(y, z)] as [number, number])} color={color} pos={[0, 0, z]} fog={false} />
);
const PR: React.FC<{r: R; z: number; color: string}> = ({r, z, color}) => <PP z={z} color={color} pts={[[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]]} />;
const PDisc: React.FC<{c: [number, number]; r: number; z: number; color: string; sy?: number}> = ({c, r, z, color, sy = 1}) => (
  <mesh position={[wx(c[0], z), wy(c[1], z), z]} scale={[1, sy, 1]}><circleGeometry args={[ws(r, z), 32]} /><meshBasicMaterial color={color} fog={false} /></mesh>
);
const rand = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

// ---------------------------------------------------------------- palette (sampled from the reference)
const C = {
  sky: '#a9bdd6', skyLow: '#c4d0dc',
  timber: '#523b2b', cream: '#e4dcc3', creamSh: '#d2c8ad', stone: '#a3967f', stoneLine: '#9d9078', stoneSh: '#bcb096',
  plum: '#55303a', plumDk: '#3f222b', brown: '#6b4a33', brownDk: '#4d3424', blue: '#4b5774', blueDk: '#384259', redRoof: '#7a3a30', redRoofDk: '#5a2a24',
  win: '#3c3a44', winFrame: '#5c4636', shBlue: '#4d6690', shRed: '#a0352f', shGreen: '#4b7f4b',
  ground: '#a99f8b', cobble: '#8a8274', cobbleLt: '#9a9284', pave: '#a8a397', paveLine: '#8b8679', curb: '#99917f',
  wood: '#6e4f35', woodDk: '#4f3826', awnRed: '#b51f37', awnWhite: '#f1eadf', vine: '#4d8a46', vineDk: '#3c6f38',
  plinth: '#b8b7b2', plinthSh: '#a2a19c', wellStone: '#bdbfc4', metal: '#b9bdc6', metalDk: '#8e939d',
};

// ---------------------------------------------------------------- building blocks
const Window: React.FC<{r: R; z: number; sh: string; shW?: number; box?: boolean}> = ({r, z, sh, shW = 25, box}) => {
  const [x0, y0, x1, y1] = r, w = x1 - x0, h = y1 - y0;
  return (
    <>
      <PR r={[x0 - 4, y0 - 4, x1 + 4, y1 + 4]} z={z + 0.01} color={C.winFrame} />
      <PR r={r} z={z + 0.015} color={C.win} />
      <PR r={[x0 + w / 2 - 2, y0, x0 + w / 2 + 2, y1]} z={z + 0.02} color={C.winFrame} />
      <PR r={[x0, y0 + h / 2 - 2, x1, y0 + h / 2 + 2]} z={z + 0.02} color={C.winFrame} />
      {[-1, 1].map((k) => {
        const sx = k < 0 ? x0 - 6 - shW : x1 + 6;
        return (
          <group key={k}>
            <PR r={[sx, y0 - 3, sx + shW, y1 + 3]} z={z + 0.025} color={sh} />
            {[0.17, 0.33, 0.5, 0.67, 0.83].map((q) => <PR key={q} r={[sx + 5, y0 + h * q - 1.3, sx + shW - 5, y0 + h * q + 1.3]} z={z + 0.03} color={'#2a2424'} />)}
          </group>
        );
      })}
      <PR r={[x0 - 7, y1 + 3, x1 + 7, y1 + 8]} z={z + 0.02} color={'#e9e1cc'} />
      <PR r={[x0 - 7, y1 + 8, x1 + 7, y1 + 10]} z={z + 0.02} color={'#b9ae96'} />
      {box ? <FlowerBox r={[x0 - 8, y1 + 6, x1 + 8, y1 + 24]} z={z + 0.1} pink={sh === C.shGreen || x0 > 640} /> : null}
    </>
  );
};
const tint = (hex: string, k: number) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
const shade = (hex: string) => tint(hex, 0.8);
const FlowerBox: React.FC<{r: R; z: number; pink?: boolean}> = ({r, z, pink}) => {
  const [x0, y0, x1, y1] = r; const rr = rand(Math.round(x0 * 7 + y0));
  return (
    <>
      <PBox r={r} z={z} d={0.25} color={C.wood} cast />
      {Array.from({length: 9}, (_, i) => <PDisc key={i} c={[x0 + 6 + ((x1 - x0 - 12) * i) / 8, y0 - 4 - rr() * 6]} r={6} z={z + 0.01} color={i % 2 ? '#5f9a48' : '#4b8a3e'} />)}
      {Array.from({length: 6}, (_, i) => <PDisc key={`f${i}`} c={[x0 + 10 + ((x1 - x0 - 20) * i) / 5 + rr() * 4, y0 - 8 - rr() * 6]} r={4} z={z + 0.02} color={pink ? '#e78bb0' : '#f1d145'} />)}
    </>
  );
};
/** gable roof drawn as a flat card: two thick slope bands over a filled gable */
const Gable: React.FC<{l: [number, number]; r: [number, number]; peak: [number, number]; z: number; fill: string | null; band: string; bandDk: string; t?: number; planks?: string}> = ({l, r, peak, z, fill, band, bandDk, t = 26, planks}) => {
  const rows = planks ? Math.floor((l[1] - peak[1]) / 20) : 0;
  return (
    <>
      {fill ? <PP z={z} color={fill} pts={[l, r, peak]} /> : null}
      {Array.from({length: rows}, (_, i) => {
        const y = peak[1] + 20 * (i + 1), q = (y - peak[1]) / (l[1] - peak[1]);
        return <PR key={i} r={[lerp(peak[0], l[0], q), y - 1.5, lerp(peak[0], r[0], q), y + 1.5]} z={z + 0.005} color={planks!} />;
      })}
      <PP z={z + 0.01} color={band} pts={[[l[0] - 6, l[1] + 4], [peak[0], peak[1] - t], [peak[0], peak[1]], [l[0] + 14, l[1] + 4]]} />
      <PP z={z + 0.01} color={band} pts={[[r[0] + 6, r[1] + 4], [peak[0], peak[1] - t], [peak[0], peak[1]], [r[0] - 14, r[1] + 4]]} />
      <PP z={z + 0.012} color={bandDk} pts={[[l[0] + 4, l[1] + 4], [peak[0], peak[1]], [peak[0], peak[1] + 8], [l[0] + 18, l[1] + 4]]} />
      <PP z={z + 0.012} color={bandDk} pts={[[r[0] - 4, r[1] + 4], [peak[0], peak[1]], [peak[0], peak[1] + 8], [r[0] - 18, r[1] + 4]]} />
    </>
  );
};
const Timber: React.FC<{a: [number, number]; b: [number, number]; z: number; w?: number}> = ({a, b, z, w = 9}) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = (-dy / L) * w / 2, ny = (dx / L) * w / 2;
  return <PP z={z} color={C.timber} pts={[[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]} />;
};
/** soft shade: stacked translucent dark bands, strongest at the given edge (bottom of walls, under eaves) */
const Shade: React.FC<{r: R; z: number; from?: 'bottom' | 'top'; k?: number}> = ({r, z, from = 'bottom', k = 1}) => {
  const [x0, y0, x1, y1] = r, n = 6;
  return <>{Array.from({length: n}, (_, i) => {
    const q0 = i / n, h = (y1 - y0) * (1 - q0);
    const rr: R = from === 'bottom' ? [x0, y1 - h, x1, y1] : [x0, y0, x1, y0 + h];
    return <Poly key={i} pts={[[wx(rr[0], z), wy(rr[1], z)], [wx(rr[2], z), wy(rr[1], z)], [wx(rr[2], z), wy(rr[3], z)], [wx(rr[0], z), wy(rr[3], z)]]} color={'#2b2116'} opacity={0.035 * k} pos={[0, 0, z + 0.008 + i * 0.0004]} fog={false} />;
  })}</>;
};
/** horizontal tile/plank rows clipped to a trapezoid (bottom y1 from xa0..xa1, top y0 from xb0..xb1) */
const TileRows: React.FC<{y0: number; y1: number; bot: [number, number]; top: [number, number]; z: number; color: string; step?: number}> = ({y0, y1, bot, top, z, color, step = 17}) => (
  <>{Array.from({length: Math.floor((y1 - y0) / step)}, (_, i) => {
    const y = y1 - step * (i + 1), q = (y1 - y) / (y1 - y0);
    return <PR key={i} r={[lerp(bot[0], top[0], q) + 4, y - 1.5, lerp(bot[1], top[1], q) - 4, y + 1.5]} z={z} color={color} />;
  })}</>
);
/** stone wall: base colour + staggered block joints + darker quoins at the corners */
const StoneWall: React.FC<{r: R; z: number; base: string; seed: number; quoin?: boolean}> = ({r, z, base, seed, quoin = true}) => {
  const [x0, y0, x1, y1] = r; const rr = rand(seed); const items: React.ReactNode[] = [];
  const line = tint(base, 0.93), q1 = tint(base, 1.04), q2 = tint(base, 0.97);
  for (let y = y0 + 22, row = 0; y < y1; y += 22, row++) {
    items.push(<PR key={`h${row}`} r={[x0, y - 1, x1, y + 1]} z={z + 0.004} color={line} />);
    for (let x = x0 + (row % 2 ? 30 : 0) + rr() * 20; x < x1; x += 50 + rr() * 30) items.push(<PR key={`v${row}-${x}`} r={[x - 1, y - 22, x + 1, y]} z={z + 0.004} color={line} />);
  }
  if (quoin) for (let y = y0, i = 0; y < y1 - 10; y += 22, i++) [x0, x1].forEach((xe, k) => {
    const w = i % 2 ? 22 : 34, xa = k ? xe - w : xe;
    items.push(<PR key={`q${i}-${k}`} r={[Math.min(xa, xa + (k ? w : w)), y + 1, Math.max(xa, xa + w), y + 21]} z={z + 0.006} color={i % 2 ? q2 : q1} />);
  });
  return <><PBox r={r} z={z} d={3} color={base} unlit />{items}</>;
};
const Vines: React.FC<{x: number; y0: number; y1: number; z: number; seed: number; spread?: number}> = ({x, y0, y1, z, seed, spread = 22}) => {
  const rr = rand(seed);
  return <>{Array.from({length: Math.floor((y1 - y0) / 9)}, (_, i) => <PDisc key={i} c={[x + Math.sin(i * 0.7 + seed) * spread * 0.6 + (rr() - 0.5) * spread, y0 + i * 9 + rr() * 6]} r={7 + rr() * 5} z={z + 0.05 + i * 0.0005} color={rr() > 0.5 ? C.vine : C.vineDk} />)}</>;
};
const Tufts: React.FC<{pts: [number, number][]}> = ({pts}) => (
  <>{pts.map(([x, z], i) => <Poly key={i} pts={[[-0.12, 0], [-0.07, 0.17], [-0.03, 0.04], [0, 0.22], [0.04, 0.05], [0.08, 0.16], [0.12, 0]]} color={i % 2 ? '#6d9a52' : '#5c8a45'} pos={[x, 0, z]} />)}</>
);

// ---------------------------------------------------------------- the set
const ZL = -3.6, ZC = -3.2, ZR = -3.4, ZFR = -3.9, ZBG = -12;
const Background: React.FC = () => (
  <>
    {/* sky + far town card */}
    <PR r={[-400, -300, 1700, 300]} z={-30} color={C.sky} />
    <PP z={ZBG} color={'#5c6684'} pts={[[-20, 70], [-20, -60], [60, -60], [60, 40]]} />
    <PR r={[380, 40, 520, 160]} z={ZBG} color={'#c7bea5'} />
    <PP z={ZBG + 0.01} color={'#55607e'} pts={[[372, 52], [445, -40], [528, 52]]} />
    <PR r={[478, 68, 512, 110]} z={ZBG + 0.02} color={'#4d5a74'} />
    <PR r={[495, -40, 655, 60]} z={ZBG - 1} color={'#7f978a'} />
    <PR r={[545, -10, 575, 30]} z={ZBG - 0.99} color={'#5f7569'} />
    <PR r={[520, 25, 562, 80]} z={ZBG + 0.1} color={'#8e5e4c'} /><PR r={[515, 20, 567, 32]} z={ZBG + 0.11} color={'#6d4438'} />
    <PR r={[668, 18, 702, 75]} z={ZBG + 0.1} color={'#8e5e4c'} /><PR r={[663, 14, 707, 26]} z={ZBG + 0.11} color={'#6d4438'} />
    {/* clock tower */}
    <PR r={[712, -40, 840, 170]} z={ZBG} color={'#c4bba3'} />
    <PDisc c={[780, 58]} r={44} z={ZBG + 0.01} color={'#a69e88'} />
    <PDisc c={[780, 58]} r={37} z={ZBG + 0.02} color={'#f0ebde'} />
    <PR r={[777, 30, 783, 60]} z={ZBG + 0.03} color={'#4c4a4a'} /><PR r={[778, 56, 800, 61]} z={ZBG + 0.03} color={'#4c4a4a'} />
    <PR r={[1090, -40, 1200, 20]} z={ZBG} color={'#7a4a3c'} />
    <PR r={[1180, -10, 1226, 90]} z={ZBG + 0.1} color={'#9b5d4a'} /><PR r={[1176, -14, 1230, 0]} z={ZBG + 0.11} color={'#7b4639'} />
    <PR r={[1220, 0, 1300, 60]} z={ZBG} color={'#5c6684'} />
  </>
);

const LeftHouse: React.FC = () => {
  const z = ZL;
  return (
    <>
      <StoneWall r={[95, 215, 405, 540]} z={z} base={C.stone} seed={3} />
      <PBox r={[85, 85, 412, 220]} z={z + 0.12} d={0.6} color={C.cream} unlit />
      <PP z={z + 0.12} color={C.cream} pts={[[85, 88], [412, 88], [248, -40]]} />
      <PDisc c={[248, 24]} r={27} z={z + 0.14} color={C.winFrame} />
      <PDisc c={[248, 24]} r={21} z={z + 0.15} color={C.win} />
      {/* timber frame */}
      <Timber a={[85, 90]} b={[412, 90]} z={z + 0.13} w={10} /><Timber a={[85, 214]} b={[412, 214]} z={z + 0.13} w={12} />
      {[90, 248, 407].map((x) => <Timber key={x} a={[x, 90]} b={[x, 214]} z={z + 0.13} />)}
      <Timber a={[200, 95]} b={[243, 210]} z={z + 0.13} /><Timber a={[296, 95]} b={[253, 210]} z={z + 0.13} />
      <Window r={[122, 105, 180, 165]} z={z + 0.13} sh={C.shBlue} />
      <Window r={[316, 105, 374, 165]} z={z + 0.13} sh={C.shBlue} />
      <Shade r={[95, 380, 405, 540]} z={z} k={1.3} />
      <Shade r={[95, 220, 405, 262]} z={z} from="top" k={1.6} />
      <Window r={[108, 355, 182, 418]} z={z} sh={C.shBlue} />
      <Window r={[318, 355, 380, 418]} z={z} sh={C.shBlue} />
      <Box size={[ws(340, z), 0.12, 0.7]} pos={[wx(248, z), wy(220, z) - 0.04, z + 0.25]} color={C.timber} cast />
      <PP z={z + 0.3} color={C.plum} pts={[[56, 86], [150, -20], [350, -20], [444, 86]]} />
      <PP z={z + 0.31} color={C.plumDk} pts={[[56, 86], [444, 86], [436, 76], [64, 76]]} />
      <TileRows y0={-20} y1={76} bot={[64, 436]} top={[150, 350]} z={z + 0.305} color={'#4a2832'} />
      <PDisc c={[245, 20]} r={28} z={z + 0.32} color={C.plumDk} />
      <PDisc c={[245, 20]} r={21} z={z + 0.33} color={C.win} />
      {/* right roof skirt running down behind the centre house */}
      <PP z={z - 0.1} color={C.plum} pts={[[400, 70], [460, 130], [460, 160], [400, 120]]} />
    </>
  );
};

const CentreHouse: React.FC = () => {
  const z = ZC;
  return (
    <>
      <StoneWall r={[436, 160, 786, 520]} z={z} base={'#d9ccb0'} seed={11} />
      <Gable l={[410, 172]} r={[810, 172]} peak={[608, 12]} z={z + 0.25} fill={C.brown} band={'#5a3d2a'} bandDk={C.brownDk} t={16} planks={'#5d402c'} />
      <Box size={[ws(400, z), ws(12, z), 0.9]} pos={[wx(610, z), wy(168, z), z + 0.15]} color={C.brownDk} cast />
      <Shade r={[436, 380, 786, 520]} z={z} k={1.2} />
      <Shade r={[436, 172, 786, 205]} z={z} from="top" k={1.6} />
      <Window r={[478, 196, 532, 250]} z={z} sh={C.shRed} box />
      <Window r={[688, 196, 742, 250]} z={z} sh={C.shRed} box />
      <Window r={[478, 356, 528, 420]} z={z} sh={C.shRed} />
      <Window r={[692, 356, 742, 420]} z={z} sh={C.shRed} />
      <PR r={[585, 330, 640, 505]} z={z + 0.01} color={'#6a4c36'} />
    </>
  );
};

const RightHouse: React.FC = () => {
  const z = ZR;
  return (
    <>
      <StoneWall r={[806, 190, 1140, 520]} z={z} base={C.stone} seed={21} />
      <PBox r={[810, 55, 1135, 196]} z={z + 0.12} d={0.6} color={C.cream} unlit />
      <PP z={z + 0.12} color={C.cream} pts={[[810, 58], [1135, 58], [968, -70]]} />
      <PDisc c={[968, 10]} r={27} z={z + 0.14} color={C.winFrame} />
      <PDisc c={[968, 10]} r={21} z={z + 0.15} color={C.win} />
      <Timber a={[810, 62]} b={[1135, 62]} z={z + 0.13} w={10} /><Timber a={[810, 190]} b={[1135, 190]} z={z + 0.13} w={12} />
      {[815, 970, 1130].map((x) => <Timber key={x} a={[x, 62]} b={[x, 190]} z={z + 0.13} />)}
      <Timber a={[912, 66]} b={[965, 186]} z={z + 0.13} /><Timber a={[1028, 66]} b={[975, 186]} z={z + 0.13} />
      <Window r={[848, 78, 904, 140]} z={z + 0.13} sh={C.shGreen} />
      <Window r={[1042, 78, 1098, 140]} z={z + 0.13} sh={C.shGreen} />
      <Shade r={[806, 360, 1140, 520]} z={z} k={1.3} />
      <Shade r={[806, 196, 1140, 236]} z={z} from="top" k={1.6} />
      <Window r={[1048, 356, 1108, 420]} z={z} sh={C.shGreen} />
      <Window r={[858, 356, 918, 420]} z={z} sh={C.shGreen} />
      <Box size={[ws(335, z), 0.12, 0.7]} pos={[wx(972, z), wy(196, z) - 0.04, z + 0.25]} color={C.timber} cast />
      <PP z={z + 0.3} color={C.blue} pts={[[770, 60], [860, -20], [1080, -20], [1165, 60]]} />
      <PP z={z + 0.31} color={C.blueDk} pts={[[770, 60], [1165, 60], [1157, 50], [778, 50]]} />
      <PP z={z + 0.29} color={C.blue} pts={[[770, 60], [800, 60], [812, 130], [790, 130]]} />
      <TileRows y0={-20} y1={50} bot={[778, 1157]} top={[860, 1080]} z={z + 0.305} color={'#414b66'} />
      <PDisc c={[972, 4]} r={28} z={z + 0.32} color={C.blueDk} />
      <PDisc c={[972, 4]} r={21} z={z + 0.33} color={C.win} />
      {/* wall lantern + sign bracket */}
      <PR r={[985, 266, 1030, 271]} z={z + 0.05} color={'#2f2b2b'} />
      <PR r={[1052, 300, 1056, 312]} z={z + 0.05} color={'#2f2b2b'} />
      <PR r={[1033, 312, 1060, 342]} z={z + 0.06} color={'#2f2b2b'} />
      <PR r={[1038, 317, 1055, 337]} z={z + 0.07} color={'#e8d9a6'} />
      <PR r={[1045, 317, 1048, 337]} z={z + 0.075} color={'#2f2b2b'} />
      <PP z={z + 0.07} color={'#2f2b2b'} pts={[[1030, 313], [1046, 302], [1063, 313]]} />
    </>
  );
};

const FarRightHouse: React.FC = () => {
  const z = ZFR;
  return (
    <>
      <StoneWall r={[1145, 270, 1400, 520]} z={z} base={C.stone} seed={31} />
      <PBox r={[1150, 130, 1400, 275]} z={z + 0.1} d={0.5} color={C.cream} unlit />
      <Timber a={[1150, 270]} b={[1400, 270]} z={z + 0.11} w={12} />
      <Timber a={[1160, 140]} b={[1160, 270]} z={z + 0.11} />
      <Window r={[1196, 168, 1262, 222]} z={z + 0.11} sh={C.shBlue} box />
      <PP z={z + 0.3} color={C.redRoof} pts={[[1118, 140], [1330, -10], [1330, 30], [1140, 160]]} />
      <PP z={z + 0.31} color={C.redRoofDk} pts={[[1130, 150], [1330, 20], [1330, 34], [1140, 160]]} />
      <Shade r={[1145, 380, 1400, 520]} z={z} k={1.3} />
      <Vines x={1205} y0={175} y1={480} z={z} seed={4} spread={30} />
    </>
  );
};

const FarLeftHouse: React.FC = () => {
  const z = ZFR;
  return (
    <>
      <StoneWall r={[-120, 140, 88, 540]} z={z} base={C.stone} seed={41} quoin={false} />
      <PBox r={[-120, 140, 70, 260]} z={z + 0.05} d={0.3} color={C.cream} unlit />
      <PP z={z + 0.3} color={C.redRoof} pts={[[-60, 20], [100, 150], [80, 165], [-60, 60]]} />
      <PP z={z + 0.31} color={C.redRoofDk} pts={[[-60, 52], [86, 162], [80, 165], [-60, 60]]} />
      <Vines x={22} y0={165} y1={290} z={z} seed={8} spread={40} />
    </>
  );
};

/** market stall, front at z: counter, posts, striped awning, produce */
const Stall: React.FC<{f: number}> = ({f}) => {
  const z = -0.9, sway = Math.sin(f * 0.12) * 1.5;
  const stripes = 7, ax0 = 105, ax1 = 386, sw = (ax1 - ax0) / stripes;
  return (
    <>
      <PBox r={[100, 432, 360, 535]} z={z} d={1.2} color={C.wood} cast />
      {[455, 478, 501].map((y) => <PR key={y} r={[100, y, 360, y + 3]} z={z + 0.01} color={C.woodDk} />)}
      {[106, 352].map((x) => <PBox key={x} r={[x, 255, x + 14, 535]} z={z - 0.1} d={0.12} color={C.woodDk} cast />)}
      {/* awning */}
      {Array.from({length: stripes}, (_, i) => (
        <PP key={i} z={z + 0.25} color={i % 2 ? C.awnRed : C.awnWhite} pts={[[ax0 + i * sw, 258], [ax0 + (i + 1) * sw, 258], [ax0 + (i + 1) * sw, 312], [ax0 + (i + 0.5) * sw, 322], [ax0 + i * sw, 312]]} />
      ))}
      <PR r={[ax0 - 4, 248, ax1 + 4, 260]} z={z + 0.26} color={'#9b1a2f'} />
      <Box size={[ws(285, z), 0.06, 1.2]} pos={[wx(245, z), wy(256, z), z - 0.35]} color={C.awnRed} cast />
      {/* awning shadow on the wall behind */}
      <Shade r={[105, 322, 386, 372]} z={-3.55} from="top" k={2.2} />
      {/* wicker produce crates with heaped produce */}
      {([[140, 194, '#f2d55a', 7], [200, 252, '#d38a3e', 9], [298, 346, '#f4efe2', 6]] as [number, number, string, number][]).map(([x0, x1, col, r], j) => (
        <group key={j}>
          <PBox r={[x0, 408, x1, 434]} z={z + 0.05} d={0.5} color={'#b08b5c'} cast />
          {[414, 421, 428].map((y) => <PR key={y} r={[x0, y, x1, y + 1.5]} z={z + 0.06} color={'#8e6d45'} />)}
          {Array.from({length: 7}, (_, i) => <PDisc key={i} c={[x0 + 8 + ((x1 - x0 - 16) * (i % 4)) / 3 + (i > 3 ? 7 : 0), i > 3 ? 396 : 404]} r={r} z={z + 0.055 + i * 0.001} color={i % 2 ? col : tint(col, 0.93)} sy={col === '#d38a3e' ? 0.7 : 1} />)}
        </group>
      ))}
      {/* brass balance scale on the counter's right end */}
      <PR r={[324, 380, 327, 432]} z={z + 0.08} color={'#c79a3a'} />
      <PR r={[306, 380, 346, 383]} z={z + 0.08} color={'#c79a3a'} />
      {[310, 342].map((x) => <PP key={x} z={z + 0.08} color={'#d6aa48'} pts={[[x - 9, 398], [x + 9, 398], [x + 5, 404], [x - 5, 404]]} />)}
      {/* hanging string of lemons, red pepper, lanterns */}
      <group>
        <PR r={[168, 322, 169.5, 412]} z={z + 0.19} color={'#6e5a3a'} />
        {Array.from({length: 8}, (_, i) => <PDisc key={i} c={[168 + (i % 2 ? 7 : -7) + Math.sin(f * 0.15 + i) * 0.8, 330 + i * 10]} r={7} z={z + 0.2 + i * 0.001} color={i % 2 ? '#f2dc8a' : '#e9cf72'} />)}
        <PP z={z + 0.2} color={'#b52b30'} pts={[[205 + sway * 0.4, 326], [228 + sway * 0.4, 326], [232 + sway, 352], [217 + sway * 1.6, 382], [204 + sway, 352]]} />
      </group>
      {[282, 314].map((x, i) => {
        const sw = Math.sin(f * 0.13 + i * 1.7) * 1.2;
        return (
          <group key={x}>
            <PR r={[x - 1, 316, x + 1, 330]} z={z + 0.2} color={'#2f2b2b'} />
            <PP z={z + 0.2} color={'#2f2b2b'} pts={[[x - 11 + sw, 334], [x + sw, 326], [x + 11 + sw, 334]]} />
            <PR r={[x - 10 + sw, 334, x + 10 + sw, 364]} z={z + 0.2} color={'#2f2b2b'} />
            <PR r={[x - 7 + sw, 337, x + 7 + sw, 361]} z={z + 0.21} color={'#f4f1ea'} />
            <PR r={[x - 1 + sw, 337, x + 1 + sw, 361]} z={z + 0.215} color={'#2f2b2b'} />
          </group>
        );
      })}
      {/* woven tomato basket in front-left */}
      <PBox r={[2, 488, 88, 535]} z={-0.2} d={0.7} color={'#c9a676'} cast />
      {[498, 508, 518, 528].map((y) => <PR key={y} r={[2, y, 88, y + 1.5]} z={-0.19} color={'#a7835a'} />)}
      {[12, 24, 36, 48, 60, 72, 84].map((x) => <PR key={x} r={[x, 488, x + 1.5, 535]} z={-0.19} color={'#a7835a'} />)}
      {[14, 28, 42, 56, 70, 82, 21, 35, 49, 63, 77].map((x, i) => <PDisc key={i} c={[x, i < 6 ? 485 : 476]} r={9} z={-0.185 + i * 0.001} color={i % 3 ? '#d23a2c' : '#c22f26'} />)}
    </>
  );
};

const Well: React.FC = () => {
  const z = -1.2;
  return (
    <>
      <PBox r={[848, 428, 1014, 525]} z={z} d={1.2} color={C.wellStone} cast />
      {[450, 475, 500].map((y) => <PR key={y} r={[848, y, 1014, y + 2]} z={z + 0.01} color={'#a4a6ac'} />)}
      {[856, 994].map((x) => <PBox key={x} r={[x, 298, x + 14, 430]} z={z - 0.3} d={0.14} color={C.woodDk} cast />)}
      <PR r={[848, 340, 1006, 350]} z={z - 0.25} color={C.wood} />
      <PR r={[925, 350, 929, 395]} z={z - 0.25} color={'#3a2a20'} />
      <PP z={z} color={'#7b4a3c'} pts={[[822, 300], [1036, 300], [928, 236]]} />
      <PP z={z + 0.01} color={'#5f382d'} pts={[[822, 300], [1036, 300], [1030, 310], [828, 310]]} />
      <Box size={[ws(200, z), 0.06, 1.3]} pos={[wx(929, z), wy(302, z), z - 0.5]} color={'#6d4236'} cast />
      {/* bucket */}
      {/* cart shaft poking in from the right edge */}
      <PP z={-1.6} color={'#5c4330'} pts={[[1212, 512], [1300, 470], [1300, 478], [1216, 518]]} />
      <PBox r={[1040, 470, 1078, 524]} z={-0.5} d={0.45} color={'#7b5636'} cast />
      <PR r={[1040, 480, 1078, 485]} z={-0.49} color={'#4a3a30'} /><PR r={[1040, 508, 1078, 513]} z={-0.49} color={'#4a3a30'} />
      <PP z={-0.49} color={'#3e3330'} pts={[[1040, 472], [1059, 452], [1078, 472], [1074, 472], [1059, 457], [1044, 472]]} />
    </>
  );
};

const Plinth: React.FC = () => {
  const z = -0.6;
  return (
    <>
      <PBox r={[586, 440, 712, 515]} z={z} d={1.0} color={C.plinth} cast />
      <PBox r={[578, 428, 720, 444]} z={z + 0.05} d={1.1} color={'#c8c7c2'} cast />
      <PBox r={[576, 505, 722, 516]} z={z + 0.05} d={1.1} color={C.plinthSh} cast />
      <PP z={z + 0.01} color={'#99988f'} pts={[[649, 452], [668, 473], [649, 494], [630, 473]]} />
      <PP z={z + 0.02} color={C.plinth} pts={[[649, 460], [660, 473], [649, 486], [638, 473]]} />
      <PR r={[608, 460, 690, 462]} z={z + 0.01} color={'#a3a29b'} />
    </>
  );
};

/** cobbled square + curb arc + big foreground paving slabs */
const Ground: React.FC = () => {
  const cobbles = useMemo(() => {
    const rr = rand(77); const out: {x: number; z: number; w: number; d: number; c: number}[] = [];
    // running-bond paving bricks with thin dark joints (counted on the reference: ~28 bricks across the frame, a row every ~7 px at the villagers)
    for (let z = -4, row = 0; z < 5.7; z += 0.17, row++) for (let x = -14 + (row % 2) * 0.22; x < 14; x += 0.44) out.push({x, z, w: 0.41, d: 0.145, c: rr()});
    return out;
  }, []);
  const ref = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => {
    const m = ref.current; if (!m) return; const o = new THREE.Object3D(); const col = new THREE.Color();
    cobbles.forEach((c, i) => {
      o.position.set(c.x, 0.004, c.z); o.rotation.set(-Math.PI / 2, 0, 0); o.scale.set(c.w, c.d, 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.set(c.c < 0.4 ? '#8e8679' : c.c < 0.8 ? '#928a7d' : '#979083'));
    });
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [cobbles]);
  const R0 = 34, zc = 5.75 - R0; // curb circle: closest point at z=5.75 (screen row ~625)
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color={'#7b7468'} roughness={1} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, cobbles.length]} receiveShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color={'#ffffff'} roughness={1} />
      </instancedMesh>
      {/* curb ring + paving outside it */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, zc]} receiveShadow>
        <ringGeometry args={[R0, R0 + 0.55, 160, 1]} />
        <meshBasicMaterial color={'#5f5a52'} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, zc]} receiveShadow>
        <ringGeometry args={[R0 + 0.55, R0 + 8, 160, 1]} />
        <meshStandardMaterial color={'#9a9488'} roughness={1} />
      </mesh>
      {/* slab joints */}
      {[[1.3, 0.05, '#7f7a6e'], [2.7, 0.28, '#615c54']].map(([dr, w, c], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, zc]}>
          <ringGeometry args={[R0 + (dr as number), R0 + (dr as number) + (w as number), 160, 1]} />
          <meshBasicMaterial color={c as string} />
        </mesh>
      ))}
      {Array.from({length: 26}, (_, i) => {
        const a = Math.PI / 2 + (i - 13) * 0.085 + 0.02; const r0 = R0 + 0.55, r1 = R0 + 1.3;
        return <Box key={i} size={[0.05, 0.004, r1 - r0]} pos={[Math.cos(a) * (r0 + r1) / 2, 0.012, zc + Math.sin(a) * (r0 + r1) / 2]} rot={[0, -a + Math.PI / 2, 0]} color={'#7f7a6e'} cast={false} unlit />;
      })}
      {Array.from({length: 22}, (_, i) => {
        const a = Math.PI / 2 + (i - 11) * 0.085 - 0.02; const r0 = R0 + 1.35, r1 = R0 + 2.7;
        return <Box key={`b${i}`} size={[0.05, 0.004, r1 - r0]} pos={[Math.cos(a) * (r0 + r1) / 2, 0.012, zc + Math.sin(a) * (r0 + r1) / 2]} rot={[0, -a + Math.PI / 2, 0]} color={'#7f7a6e'} cast={false} unlit />;
      })}
      {/* grass tufts along the wall bases and between the paving (counted ~14 in the reference) */}
      <Tufts pts={[[-3.1, -3.0], [-1.0, -2.9], [0.9, -2.95], [2.3, -2.9], [3.9, -2.8], [6.2, -3.1], [-6.5, -3.2], [-0.4, -0.8], [1.9, -0.7], [2.6, -1.0]]} />
      <Tufts pts={[[-4.0, 7.4], [4.9, 7.6], [3.4, 5.15], [-6.2, 5.1], [-1.4, -1.3], [0.6, -1.0], [3.2, -1.6], [1.0, -0.9], [-2.3, -2.6], [4.4, -2.1], [5.7, -2.8]]} />
    </>
  );
};

// ---------------------------------------------------------------- villagers (one Codex sheet: top row calm, bottom row startled, looking up)
// Each villager is two pictures (calm / startled) plus painted-on eyes: on the calm picture the drawn pupils are covered with white
// and new pupils are placed so the gaze can travel; skin-coloured lids blink on both pictures. Eye boxes measured on the PNGs.
type Eye = [number, number, number, number];
type Vil = {calm: string; react: string; cb: R; rb: R; px: number; feet: number; hPx: number; phase: number; skin: string;
  ce: [Eye, Eye]; cp: [[number, number], [number, number]]; re: [Eye, Eye];
  look: [number, number][]; blinks: number[]; at: number};
const VILS: Vil[] = [
  // beats read off the reference: man glances at the figure at 10, startles at 27 (hand to chest)
  {calm: 'v-2', react: 'v-7', cb: [58, 36, 253, 482], rb: [57, 538, 255, 988], px: 265, feet: 538, hPx: 204, phase: 0.0, skin: '#f6c39a',
    ce: [[45, 69, 95, 117], [99, 69, 148, 118]], cp: [[78.7, 95.7], [114.5, 95.8]], re: [[46, 65, 96, 112], [100, 65, 149, 111]], look: [[0, 0], [10, 1], [19, 0.6]], blinks: [5, 21, 44], at: 27},
  // woman: eyes slide to the figure at 14, hand to chest at 25
  {calm: 'v-3', react: 'v-8', cb: [309, 39, 511, 481], rb: [309, 541, 511, 988], px: 398, feet: 528, hPx: 184, phase: 1.3, skin: '#f8c29a',
    ce: [[53, 76, 100, 122], [103, 76, 150, 122]], cp: [[82.9, 99.4], [119.7, 99.8]], re: [[54, 69, 100, 113], [104, 69, 150, 113]], look: [[0, -0.2], [14, 1]], blinks: [9, 37, 52], at: 25},
  // guard: scowls toward the figure from 8, raises his hand at 28
  {calm: 'v-1', react: 'v-9', cb: [558, 18, 751, 482], rb: [545, 518, 792, 988], px: 478, feet: 529, hPx: 202, phase: 2.1, skin: '#f3bf95',
    ce: [[45, 92, 94, 136], [99, 92, 148, 137]], cp: [[79, 110.3], [113.8, 110.5]], re: [[58, 84, 107, 131], [112, 84, 160, 131]], look: [[0, 0], [8, 1]], blinks: [17, 47], at: 28},
  // girl: turns her eyes to the figure at 6, gasps early (13)
  {calm: 'v-4', react: 'v-11', cb: [807, 109, 986, 481], rb: [807, 605, 988, 988], px: 800, feet: 533, hPx: 150, phase: 3.4, skin: '#f8c299',
    ce: [[29, 67, 76, 113], [80, 66, 127, 113]], cp: [[61, 91.1], [95.1, 89.9]], re: [[29, 61, 76, 106], [80, 60, 127, 106]], look: [[0, 0], [6, -1]], blinks: [3, 34], at: 13},
  // old man: glares at 12, hand to his brow at 28
  {calm: 'v-5', react: 'v-12', cb: [1023, 50, 1226, 481], rb: [1002, 553, 1232, 988], px: 898, feet: 537, hPx: 182, phase: 4.2, skin: '#f5c39b',
    ce: [[50, 56, 99, 104], [104, 57, 153, 104]], cp: [[83.2, 82.4], [119, 82.5]], re: [[72, 49, 121, 95], [125, 49, 174, 95]], look: [[0, 0], [12, -1]], blinks: [6, 40], at: 28},
  // curly man: looks over at 4, raises his hand at 22
  {calm: 'v-6', react: 'v-10', cb: [1279, 32, 1473, 481], rb: [1279, 533, 1509, 988], px: 980, feet: 530, hPx: 196, phase: 5.0, skin: '#f7c097',
    ce: [[46, 74, 95, 123], [99, 74, 148, 123]], cp: [[79.5, 100.7], [114.6, 100.6]], re: [[46, 69, 95, 116], [99, 69, 148, 116]], look: [[0, 0], [4, -1]], blinks: [14, 30, 50], at: 22},
];
const Lids: React.FC<{eyes: [Eye, Eye]; skin: string; ox: number; oy: number}> = ({eyes, skin, ox, oy}) => (
  <>{eyes.map(([x0, y0, x1, y1], i) => {
    const cx = (x0 + x1) / 2 - ox, cy = (y0 + y1) / 2 - oy, r = (x1 - x0) / 2 + 2;
    return (
      <group key={i}>
        <mesh position={[cx, cy, 0.004]}><circleGeometry args={[r, 28]} /><meshBasicMaterial color={skin} fog={false} /></mesh>
        <mesh position={[cx, cy + 3, 0.005]}><planeGeometry args={[r * 1.7, 3.2]} /><meshBasicMaterial color={'#8c5a3e'} fog={false} /></mesh>
      </group>
    );
  })}</>
);
const Villager: React.FC<{v: Vil; f: number}> = ({v, f}) => {
  const z = zAtRow(v.feet), x = wx(v.px, z), H = ws(v.hPx, z);
  const k = H / (v.cb[3] - v.cb[1]); // world units per sheet pixel
  const reacting = f >= v.at, s = f / 24, df = f - v.at;
  // acting: breathing bob + slow sway | eyes travel to the figure | 3-frame squash (anticipation) | swap to the startled drawing with a
  // stretch-hop that settles | afterwards a small nervous shiver
  const antic = !reacting && df >= -3 ? Math.sin(((df + 3) / 3) * Math.PI) : 0;
  const sy = 1 - 0.035 * antic + (reacting ? 0.05 * Math.exp(-df / 2.5) * Math.cos(df * 0.9) : 0);
  const sx = 1 + 0.02 * antic - (reacting ? 0.025 * Math.exp(-df / 2.5) * Math.cos(df * 0.9) : 0);
  const hop = reacting ? 0.06 * Math.exp(-df / 3) * Math.abs(Math.sin((df + 1) * 0.75)) : 0;
  const shiver = reacting && df > 4 ? Math.sin(f * 2.3 + v.phase) * 0.35 : 0;
  const toward = v.px < 640 ? 1 : -1;
  const tilt = Math.sin(s * Math.PI * 2 / (2.4 + v.phase * 0.1) + v.phase) * 0.6 + drift(f, v.phase) * 0.3 + shiver
    + track(f, [[0, 0], [v.look[1][0], 0.9 * toward], [v.at, -2.2 * toward], [v.at + 9, -0.5 * toward]], 5);
  const bob = Math.sin(s * Math.PI * 2 / 1.3 + v.phase) * 0.006;
  const b = reacting ? v.rb : v.cb;
  const h = (b[3] - b[1]) * k, dx = ((b[0] + b[2]) / 2 - (v.cb[0] + v.cb[2]) / 2) * k;
  const blink = v.blinks.some((bf) => f >= bf && f < bf + 3);
  const g = track(f, v.look, 3);
  // eye overlay coordinates are relative to the card picture (its top-left = bbox top-left on the sheet)
  return (
    <group position={[x + dx, bob + hop, z]} scale={[sx, sy, 1]}>
      <ImageCard src={`village/${reacting ? v.react : v.calm}.png`} height={h} tilt={tilt}>
        {!reacting && !blink ? v.ce.map(([x0, y0, x1, y1], i) => {
          const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, [opx, opy] = v.cp[i];
          const px = Math.max(cx - 13, Math.min(cx + 13, opx + g * 10 + drift(f, v.phase + i) * 0.6)), py = opy + drift(f, v.phase + 3) * 0.6;
          return (
            <group key={i}>
              <mesh position={[opx, opy, 0.002]}><circleGeometry args={[8.2, 20]} /><meshBasicMaterial color={'#ffffff'} fog={false} /></mesh>
              <mesh position={[px, py, 0.003]}><circleGeometry args={[5.6, 20]} /><meshBasicMaterial color={'#2a2224'} fog={false} /></mesh>
            </group>
          );
        }) : null}
        {blink ? <Lids eyes={reacting ? v.re : v.ce} skin={v.skin} ox={0} oy={0} /> : null}
      </ImageCard>
    </group>
  );
};

// ---------------------------------------------------------------- the hooded figure, from behind, rising off the ground
const useTex = (src: string) => {
  const [tex, setTex] = React.useState<THREE.Texture | null>(null);
  const [handle] = React.useState(() => delayRender(`tex ${src}`));
  const advance = useThree((st) => st.advance);
  React.useEffect(() => { new THREE.TextureLoader().load(staticFile(src), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; setTex(t); }); }, [src]);
  React.useEffect(() => { if (tex) { advance(performance.now()); continueRender(handle); } }, [tex, advance, handle]);
  return tex;
};
/** textured piece in a pixel-space group (y down): w x h px, hung from its pivot at (0,0); pOff = pivot distance below the top edge */
const Piece: React.FC<{src: string; w: number; h: number; pOff: number; dz: number; mirror?: boolean}> = ({src, w, h, pOff, dz, mirror}) => {
  const tex = useTex(src);
  if (!tex) return null;
  return (
    <mesh position={[0, h / 2 - pOff, dz]} scale={[mirror ? -1 : 1, -1, 1]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.04} side={THREE.DoubleSide} fog={false} />
    </mesh>
  );
};
// rig piece sizes (doomImg.ts, rig units) scaled to back.png pixels: the rig is 520 units tall, back.png 1450 px
const RK = 1450 / 520;
const RigArm: React.FC<{side: 'L' | 'R'; arm: number; fore: number; wrist: number; open: boolean}> = ({side, arm, fore, wrist, open}) => {
  // angles in degrees, 0 = hanging straight down; positive = swung OUTWARD (away from the body)
  const m = side === 'L' ? 1 : -1, sx = side === 'L' ? 178 : 750, sy = 655, d = (a: number) => (m * a * Math.PI) / 180;
  return (
    <group position={[sx, sy, -0.04]} rotation={[0, 0, d(arm)]}>
      <Piece src="doom/p-5.png" w={60 * RK} h={80 * RK} pOff={28 * RK} dz={0} mirror={side === 'R'} />
      <group position={[0, 50 * RK, 0.001]} rotation={[0, 0, d(fore)]}>
        <Piece src="doom/p-6.png" w={54 * RK} h={74 * RK} pOff={10 * RK} dz={0} mirror={side === 'R'} />
        <group position={[0, 58 * RK, 0.001]} rotation={[0, 0, d(wrist)]}>
          {open ? <Piece src="doom/open-down.png" w={82 * RK} h={82 * RK * 269 / 249} pOff={12 * RK} dz={0.001} mirror={side === 'R'} />
            : <Piece src="doom/p-7.png" w={62 * RK} h={68 * RK} pOff={10 * RK} dz={0.001} mirror={side === 'R'} />}
        </group>
      </group>
    </group>
  );
};

/** back.png on a subdivided plane so the lower cape can swing (shear) and flare while the hood stays put */
const CapeCard: React.FC<{height: number; pos: V3; tilt: number; sway: number; flare: number; children?: React.ReactNode}> = ({height, pos, tilt, sway, flare, children}) => {
  const tex = useTex('doom/back.png');
  const W = (height * 927) / 1450;
  const geo = useMemo(() => new THREE.PlaneGeometry(W, height, 1, 24), [W, height]);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const pa = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pa.count; i++) {
    const bx = base[i * 3], by = base[i * 3 + 1], v = (by + height / 2) / height; // 0 bottom .. 1 top
    const wgt = Math.max(0, 1 - v / 0.58) ** 1.6; // only below the mantle
    pa.setX(i, bx * (1 + flare * wgt) + sway * height * wgt);
  }
  pa.needsUpdate = true;
  const k = height / 1450;
  if (!tex) return null;
  return (
    <group position={pos} rotation={[0, 0, (-tilt * Math.PI) / 180]}>
      <mesh geometry={geo} position={[0, height / 2, 0]} castShadow>
        <meshBasicMaterial map={tex} transparent alphaTest={0.04} side={THREE.DoubleSide} fog={false} />
      </mesh>
      <group position={[-W / 2, height, 0.01]} scale={[k, -k, 1]}>{children}</group>
    </group>
  );
};

// reference measurements, frame by frame (green cape bounding box): hem row in px and cape height in px
const HEM: [number, number][] = [[0, 555], [9, 555], [12, 544], [15, 537], [21, 533], [24, 511], [27, 505], [30, 501], [33, 499], [36, 489], [39, 483], [42, 475], [45, 469], [48, 461], [51, 453], [54, 441], [58, 436]];
const HPX: [number, number][] = [[0, 299], [12, 293], [24, 283], [45, 280], [58, 269]];
const interp = (f: number, t: [number, number][]) => { if (f <= t[0][0]) return t[0][1]; for (let i = 1; i < t.length; i++) if (f <= t[i][0]) return lerp(t[i - 1][1], t[i][1], (f - t[i - 1][0]) / (t[i][0] - t[i - 1][0])); return t[t.length - 1][1]; };
const camAt = (t: number) => lerp3([0, CY, CZ], [0, CY + 0.05, CZ + 0.55], t);

const Hooded: React.FC<{f: number; t: number}> = ({f, t}) => {
  // beats: 0 stands on the cobbles | 10 lifts off in two surges (12 and 24, as measured), drifting back toward the plinth
  // | 11 right arm swings out sideways (fist) | 14 left arm comes out low, angled down | 42 both arms sweep up and out, hands open
  // the cape hem swings on its own slower rhythm and flares as he lifts; the ground shadow shrinks and fades
  const H = 3.25, cam = camAt(t);
  const hemPx = interp(f, HEM) + 2, hPx = interp(f, HPX);
  const Dd = (H * FPX) / hPx, zf = cam[2] - Dd;
  const y = cam[1] + ((360 - hemPx) * Dd) / FPX + Math.sin(f * 0.21) * 0.01;
  const x = cam[0] + ((630 - 640) * Dd) / FPX + drift(f, 3) * 0.015;
  const air = Math.min(1, Math.max(0, (f - 9) / 8));
  const sway = air * (0.022 * Math.sin((f - 9) * 0.45) + 0.008 * Math.sin(f * 0.9)) - 0.01 * air;
  const flare = air * (0.15 + 0.05 * Math.sin((f - 9) * 0.45 + 1.2));
  const tilt = drift(f, 9) * 0.5 + track(f, [[0, 0], [11, -1.5], [26, 0.8], [40, 0]], 9);
  const R_ = trackObj<{arm: number; fore: number; wrist: number}>(f, [[0, {arm: 5, fore: 0, wrist: 0}], [11, {arm: 84, fore: 0, wrist: 5}], [26, {arm: 90, fore: 2, wrist: 8}], [42, {arm: 118, fore: 10, wrist: 18}], [52, {arm: 124, fore: 8, wrist: 22}]], 7);
  const L_ = trackObj<{arm: number; fore: number; wrist: number}>(f, [[0, {arm: 5, fore: 0, wrist: 0}], [14, {arm: 38, fore: 6, wrist: 0}], [28, {arm: 50, fore: 8, wrist: 4}], [43, {arm: 120, fore: 10, wrist: 18}], [53, {arm: 126, fore: 8, wrist: 22}]], 7);
  const lift = Math.max(0, y);
  const shR = 0.95 * (1 - 0.3 * Math.min(1, lift / 1.4)), shA = 0.38 * (1 - 0.55 * Math.min(1, lift / 1.4));
  return (
    <>
      <CapeCard height={H} pos={[x, y, zf]} tilt={tilt} sway={sway} flare={flare}>
        {f >= 10 ? <RigArm side="R" arm={R_.arm + drift(f, 6) * 2} fore={R_.fore} wrist={R_.wrist} open={f >= 42} /> : null}
        {f >= 15 ? <RigArm side="L" arm={L_.arm + drift(f, 7) * 2} fore={L_.fore} wrist={L_.wrist} open={f >= 43} /> : null}
        {[330, 600].map((bx) => <mesh key={bx} position={[bx, 1440, -0.02]} scale={[1, 0.45, 1]}><circleGeometry args={[105, 28]} /><meshBasicMaterial color={'#a9adb5'} /></mesh>)}
      </CapeCard>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, zf + 0.1]} scale={[1, 0.5, 1]}>
        <circleGeometry args={[shR, 32]} />
        <meshBasicMaterial color={'#3a3328'} transparent opacity={shA} depthWrite={false} />
      </mesh>
    </>
  );
};

/** a group pinned at pixel point (px, py) at depth z, rotated by deg; children use pixel offsets from the pin (y down) */
const Pinned: React.FC<{px: number; py: number; z: number; deg: number; children: React.ReactNode}> = ({px, py, z, deg, children}) => {
  const k = ws(1, z);
  return <group position={[wx(px, z), wy(py, z), z]} rotation={[0, 0, (-deg * Math.PI) / 180]}><group scale={[k, -k, 1]}>{children}</group></group>;
};
const Q: React.FC<{pts: [number, number][]; color: string; dz?: number}> = ({pts, color, dz = 0}) => <Poly pts={pts} color={color} pos={[0, 0, dz]} fog={false} />;
const Dot: React.FC<{c: [number, number]; r: number; color: string; dz?: number; sy?: number}> = ({c, r, color, dz = 0, sy = 1}) => (
  <mesh position={[c[0], c[1], dz]} scale={[1, sy, 1]}><circleGeometry args={[r, 20]} /><meshBasicMaterial color={color} side={THREE.DoubleSide} fog={false} /></mesh>
);

/** clothes line with a shirt, a red cloth and trousers, each swinging on its own phase around its pegs */
const Laundry: React.FC<{f: number}> = ({f}) => {
  const z = ZFR + 0.4, line = (x: number) => 96 + ((x - 1128) / 162) * 54 + Math.sin(((x - 1128) / 162) * Math.PI) * 6;
  const sw = (ph: number, amp: number) => Math.sin(f * 0.16 + ph) * amp + Math.sin(f * 0.07 + ph * 2) * amp * 0.5;
  return (
    <>
      {Array.from({length: 12}, (_, i) => { const xa = 1128 + i * 15, xb = xa + 15; return <PP key={i} z={z} color={'#2f2a2a'} pts={[[xa, line(xa)], [xb, line(xb)], [xb, line(xb) + 1.6], [xa, line(xa) + 1.6]]} />; })}
      <Pinned px={1190} py={line(1190)} z={z + 0.01} deg={sw(0, 3)}>
        <Q color={'#f2efe7'} pts={[[-14, 0], [14, 0], [27, 12], [20, 19], [14, 14], [14, 40], [-14, 40], [-14, 14], [-20, 19], [-27, 12]]} />
        <Q color={'#dcd8cf'} pts={[[-5, 0], [5, 0], [0, 6]]} dz={0.001} />
      </Pinned>
      <Pinned px={1236} py={line(1236)} z={z + 0.01} deg={sw(1.7, 5)}>
        <Q color={'#a8302e'} pts={[[-21, 0], [21, 0], [22, 46], [-20, 44]]} />
        <Q color={'#922826'} pts={[[8, 0], [21, 0], [22, 46], [10, 45]]} dz={0.001} />
      </Pinned>
      <Pinned px={1278} py={line(1278)} z={z + 0.01} deg={sw(3.1, 3)}>
        <Q color={'#4f6a96'} pts={[[-16, 0], [16, 0], [15, 52], [5, 52], [0, 18], [-5, 52], [-15, 52]]} />
      </Pinned>
    </>
  );
};

/** two pigeons on the centre house eave: head bobs, little turns */
const Pigeons: React.FC<{f: number}> = ({f}) => {
  const z = ZC + 0.7;
  const birds: [number, number[], number][] = [[708, [0, 21, 41], 1], [748, [0, 31], -1]];
  return (
    <>
      {birds.map(([x, turns, face0], j) => {
        let face = face0; turns.forEach((tf, i) => { if (i && f >= tf) face = -face; });
        const bob = Math.max(0, Math.sin(f * 0.45 + j * 2)) ** 6 * 2.5; // quick peck-like head dips
        const hop = turns.slice(1).some((tf) => f >= tf && f < tf + 3) ? 2 : 0;
        return (
          <group key={x} position={[wx(x, z), wy(152 - hop, z), z]} scale={[ws(1, z) * face, -ws(1, z), 1]}>
            <Q color={'#9aa1ad'} pts={[[-13, 0], [-5, -9], [7, -8], [11, -2], [4, 4], [-8, 3]]} />
            <Q color={'#7c838f'} pts={[[-14, -1], [-3, -7], [4, -3], [-6, 2]]} dz={0.001} />
            <Q color={'#5f6570'} pts={[[-13, -2], [-20, -4], [-18, 0]]} dz={0.001} />
            <Dot c={[8, -12 + bob]} r={4.6} color={'#b6bcc6'} dz={0.002} />
            <Dot c={[9.5, -13 + bob]} r={1.1} color={'#1f1f22'} dz={0.003} />
            <Q color={'#e39a3c'} pts={[[12, -13 + bob], [16, -11.5 + bob], [12, -10.5 + bob]]} dz={0.003} />
            <Q color={'#e39a3c'} pts={[[-2, 3], [-1, 3], [-1, 7], [-2, 7]]} />
            <Q color={'#e39a3c'} pts={[[3, 3], [4, 3], [4, 7], [3, 7]]} />
          </group>
        );
      })}
    </>
  );
};

/** foreground pole frame at the left edge with the teal pennant and a purple banner (near the camera, so it slides with parallax) */
const LeftPoles: React.FC<{f: number}> = ({f}) => {
  const z = -0.85, sw = Math.sin(f * 0.11) * 2 + Math.sin(f * 0.27) * 0.8;
  return (
    <>
      {[[16, 30], [36, 46]].map(([a, b]) => <PBox key={a} r={[a, 236, b, 528]} z={z} d={0.12} color={'#4f3826'} cast />)}
      <PR r={[-30, 236, 70, 242]} z={z + 0.07} color={'#4f3826'} />
      <Pinned px={-6} py={242} z={z + 0.08} deg={sw * 0.4}>
        <Q color={'#2b6a8d'} pts={[[-30, 0], [34, 0], [34, 62], [2, 74], [-30, 62]]} />
        <Q color={'#245a78'} pts={[[18, 0], [34, 0], [34, 62], [18, 68]]} dz={0.001} />
      </Pinned>
      <Pinned px={-14} py={322} z={z + 0.03} deg={sw * 0.6}>
        <Q color={'#6c3f86'} pts={[[-20, 0], [24, 0], [24, 70], [2, 80], [-20, 70]]} />
      </Pinned>
    </>
  );
};

const LampGlows: React.FC<{f: number}> = ({f}) => {
  const fl = (ph: number) => 0.75 + 0.25 * Math.sin(f * 0.9 + ph) * Math.sin(f * 0.37 + ph * 2);
  return (
    <>
      {[[282, 349, -0.65], [314, 349, -0.65], [1046, 327, ZR + 0.12]].map(([x, y, z], i) => (
        <group key={i}>
          <mesh position={[wx(x, z), wy(y, z), z]}><circleGeometry args={[ws(5, z), 16]} /><meshBasicMaterial color={'#fff2c2'} transparent opacity={0.5 * fl(i)} fog={false} /></mesh>
          <mesh position={[wx(x, z), wy(y, z), z - 0.001]}><circleGeometry args={[ws(16, z), 24]} /><meshBasicMaterial color={'#ffe7a0'} transparent opacity={0.12 * fl(i + 1)} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh>
        </group>
      ))}
    </>
  );
};

const Dust: React.FC<{f: number}> = ({f}) => {
  const specks = useMemo(() => { const rr = rand(5); return Array.from({length: 40}, () => [rr() * 16 - 8, rr() * 6 + 0.3, rr() * 8 - 2, rr()] as const); }, []);
  return <>{specks.map(([x, y, z, p], i) => <Speck key={i} pos={[x + Math.sin(f * 0.03 + p * 6) * 0.3, y + ((f * 0.006 + p) % 1) * 0.5, z]} s={0.035 + p * 0.03} color={'#fffbea'} opacity={0.35 + 0.35 * Math.sin(f * 0.15 + p * 9)} />)}</>;
};

const VLights: React.FC = () => (
  <>
    <hemisphereLight args={['#fffaf0', '#c9c0ae', 1.75]} />
    <directionalLight position={[-5, 22, 14]} intensity={1.5} color={'#fff6e6'} castShadow
      shadow-mapSize={[2048, 2048]} shadow-radius={12} shadow-blurSamples={18} shadow-bias={-0.0006} shadow-normalBias={0.03}
      shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-12} shadow-camera-near={1} shadow-camera-far={80} />
  </>
);

const Scene: React.FC<{f: number; t: number}> = ({f, t}) => {
  // camera: slow linear pull-back (~3 % over the shot) with a slight rise, measured on frames 232 vs 290
  const cam = camAt(t);
  return (
    <>
      <Cam pos={cam} look={[cam[0], cam[1], 0]} fov={30} />
      <VLights />
      <Post focus={[0, 1.3, 0]} blur={0.12} />
      <Background />
      <FarLeftHouse />
      <LeftHouse />
      <CentreHouse />
      <RightHouse />
      <FarRightHouse />
      <Ground />
      <Stall f={f} />
      <Well />
      <Plinth />
      {/* potted flower bush between knight and plinth */}
      <PBox r={[528, 476, 552, 498]} z={-0.7} d={0.25} color={'#b0613e'} cast />
      <PDisc c={[540, 464]} r={15} z={-0.69} color={'#5e9a4a'} />
      {[533, 545, 539].map((x, i) => <PDisc key={i} c={[x, 458 + i * 4]} r={3} z={-0.68} color={'#f4f0e8'} />)}
      {VILS.map((v) => <Villager key={v.calm} v={v} f={f} />)}
      <Hooded f={f} t={t} />
      <Laundry f={f} />
      <Pigeons f={f} />
      <LeftPoles f={f} />
      <LampGlows f={f} />
      <Dust f={f} />
    </>
  );
};

export const VillageShot: ShotDef = {id: 'village', len: 59, bg: C.sky, Scene};
