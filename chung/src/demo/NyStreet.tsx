import React, {useMemo} from 'react';
import {Composition, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {GradeCtx, GRADES, Grade} from '../lib3/look';
import {Plate, rnd, P, Ctx, paintCloud} from '../lib3/depth';
import {StageCam, Crate, Barrel, Sack, PoleLine} from '../lib3/kit';
import {Scatter} from '../lib3/detail';
import {CampusLamp} from '../lib3/kitCampus';
import {Shot} from '../lib3/shot';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import {POSES} from '../mould/gestures';
import type {Spec} from '../mould/draw';
import {CobbleRoad, Sidewalk, Townhouse, PowerStation, STATION, ElectricLamp, GasGlow, WirePoles, Trench, DirtThrow, StoneOffice, OFFICE, paintBridgeTower, nyWave, NyPower, NyLight, switchHandle} from '../lib3/kitNyStreet';
import {EDISON, TESLA_WORN, WESTINGHOUSE, HEIGHT, extra, coatArms} from '../episodes/teslaCast';

/** Set PH of episodes/tesla-danh-sach-canh.md: Pearl Street, New York, in the 1880s. ONE street, two states, five camera views.
 *  Plan (metres; x right, y up, the lens looks along -z; z = 0 is the front of Edison's power station):
 *    Pearl Street runs straight into the distance: road x -5..5 (cobbles, 0.12 below the pavements), pavements x 5..8 and -8..-5,
 *    house fronts at x = +-8. Blocks (rows) along z: 1 = 0..-30, 2 = -40..-70, 3 = -80..-110, 4 = -120..-190; cross streets
 *    between them (pavement 2.5, road 5, pavement 2.5) and in front of the station (z 0..+11). A low row of houses closes the
 *    end at z -196; beyond it, on the far plate, the city's roofs, spires, chimneys and the tower of the bridge (right of centre).
 *    Right of block 1: the power station (x 8..22, z 0..-30; front at z 0 facing the camera, the knife switch left of its arched
 *    door). Left of block 2: the grey stone office (x -24..-8, z -40..-54; its gable end faces +z with the door at x -13).
 *    Edison's line: timber poles on the right pavement (x 5.9) from z -11 to the LAST one at z -112; electric lamps on both
 *    pavements (x +-5.6) at z -5, -20, -45, -60, -85 and -98 (right) / -104 (left: the last lamp); beyond: only a thin telegraph
 *    line and the old gas lamps (they burn everywhere, weak and yellow-green). Block 3 is lit weakly and orange; block 4 is dark.
 *    Day (state 'ngay'): a ditch along the left kerb x -5..-3.8, z -42..-75, floor at y -0.95, the earth heaped on the left
 *    pavement, two diggers in it at z -56 and -64; no lamp burns; the office has its sign.
 *  The light of every lamp and window is a parameter of the set: power(light) -> level, built with nyWave (lib3/kitNyStreet). */
type V3 = [number, number, number];
export type NyTime = 'dem' | 'ngay';
export type NyView = 'a' | 'b' | 'c' | 'd' | 'e';
/** The five views (one per shot of the list): a = shot 1 at the station's door; b = shot 2 high down the street; c = shot 3 in
 *  block 3 at the last lamp, towards the dark; d = shot 9 low along the ditch; e = shot 10 at the office door.
 *  focus / reach = where the shadow-casting light is aimed and how far its shadows reach (the street is too long for one). */
export const NY_VIEWS: Record<NyView, {eye: V3; focus: V3; reach: number}> = {
  a: {eye: [10.6, 1.7, 8.5], focus: [11, 0, -1], reach: 16},
  b: {eye: [0, 7, 14], focus: [0, 0, -40], reach: 70},
  c: {eye: [-1.6, 1.7, -91], focus: [-2, 0, -106], reach: 22},
  d: {eye: [-3, 1.0, -40.5], focus: [-4.4, 0, -52], reach: 22},
  e: {eye: [-12.8, 1.6, -34], focus: [-13, 0, -39], reach: 12},
};
export const NY_ROWS: [number, number][] = [[0, -30], [-40, -70], [-80, -110], [-120, -190]];
export const rowOf = (z: number) => (z > -35 ? 1 : z > -75 ? 2 : z > -115 ? 3 : 4);
const ROW_STRENGTH = [0, 1, 1, 0.5, 0], LAMP_STRENGTH = [0, 1, 1, 0.8, 0], WARM = '#ffd486', WEAK = '#ff9e52';
export const LAMPS: {x: number; z: number; arm: 1 | -1; last?: boolean}[] = [
  ...[-5, -20, -45, -60, -85, -98].map((z) => ({x: 5.6, z, arm: -1 as const})),
  ...[-5, -20, -45, -60, -85].map((z) => ({x: -5.6, z, arm: 1 as const})), {x: -5.6, z: -104, arm: 1, last: true},
];
export const POLES: V3[] = [-11, -26, -41, -56, -71, -86, -101, -112].map((z) => [5.9, 0, z] as V3);
const GAS: [number, number][] = [[-5.3, -12], [5.3, -33.5], [-5.3, -58], [5.3, -75], [-5.3, -92], [5.3, -122], [-5.3, -128], [5.3, -142], [-5.3, -156], [5.3, -171], [-5.3, -185]];
/** where the station stands (its front-left corner) and the world positions of its switch and door lamp */
export const STATION_AT: V3 = [8, 0, 0];
export const NY_SPOTS = {
  switchCentre: [STATION_AT[0] + STATION.switchAt[0], STATION.switchAt[1], 0] as V3,
  /** the handle's knob in the world at pull p (0 = up and out, 1 = pulled down) */
  handle: (p: number): V3 => { const h = switchHandle(p); return [STATION_AT[0] + STATION.switchAt[0] + h[0], STATION.switchAt[1] + h[1], h[2]]; },
  doorLamp: [STATION_AT[0] + STATION.lamp[0], STATION.lamp[1], STATION.lamp[2]] as V3,
  door: [STATION_AT[0] + STATION.door.x, 0, 0] as V3,
  lastLamp: [-5.6 + 0.75, 4.7 - 0.38, -104] as V3,
  officeDoor: [-13, 0, -40] as V3,
  ditch: {x: -4.4, z: [-42, -75] as [number, number], floor: -0.95},
};
export const OFFICE_AT: V3 = [-16, 0, -40];

// ---------------------------------------------------------------- the houses along the street, by block and side
type House = {side: 1 | -1; z0: number; z1: number; color: string; kind: 'brick' | 'stone'; sign: string; awning?: [string, string]; paint: string; board: string; ink: string; h: number; seed: number; end: boolean; tank: boolean; doorLeft: boolean};
const COLORS: [string, 'brick' | 'stone'][] = [['#8a4434', 'brick'], ['#9a5c42', 'brick'], ['#c9b894', 'stone'], ['#74402f', 'brick'], ['#8c6a52', 'brick'], ['#b4a68a', 'stone'], ['#a2523a', 'brick'], ['#6e4a3c', 'brick']];
const SIGNS = ['HARDWARE', 'OYSTERS', 'DRY GOODS', 'TAILOR', 'TOBACCO', 'BAKERY', 'HATS & CAPS', 'GROCER', 'PHARMACY', 'BOOKS', 'STATIONER', 'SHOES', 'CHINA & GLASS', 'SADDLER', 'COFFEE', 'CLOCKS', 'WINES', 'LAMPS & OIL', 'FURS', 'PRINTER'];
const AWNINGS: [string, string][] = [['#b8463a', '#efe4cc'], ['#3f6a5a', '#efe4cc'], ['#c8923a', '#f1e8d2'], ['#4a5a7a', '#ece2ca'], ['#8a3a4a', '#efe4cc']];
const PAINTS: [string, string, string][] = [['#2f4a3a', '#1f3a2c', '#e7c96a'], ['#4a2e2a', '#3a1e1a', '#efd9a0'], ['#2a3a4e', '#1a2a3e', '#efe2bc'], ['#3a3a36', '#151515', '#e2c055'], ['#5a3a24', '#2e1e14', '#f0dcae']];
const HOUSES: House[] = (() => {
  const out: House[] = [], r = rnd(77); let k = 0;
  NY_ROWS.forEach(([za, zb], ri) => ([-1, 1] as const).forEach((side) => {
    if (ri === 0 && side === 1) return;   // the power station
    let z = ri === 1 && side === -1 ? -40 - OFFICE.d : za;   // the office takes the first 14 m of block 2 on the left
    let first = !(ri === 1 && side === -1);
    while (z - 5.5 > zb) {
      const w = Math.min(z - zb, 6 + Math.floor(r() * 4)), c = COLORS[k % COLORS.length], p = PAINTS[(k * 3) % PAINTS.length];
      out.push({side, z0: z, z1: z - w, color: c[0], kind: c[1], sign: SIGNS[k % SIGNS.length], awning: r() < 0.7 ? AWNINGS[k % AWNINGS.length] : undefined, paint: p[0], board: p[1], ink: p[2], h: 14 + Math.floor(r() * 3) * 1.6, seed: 10 + k, end: first, tank: r() < 0.35, doorLeft: r() < 0.5});
      z -= w; first = false; k++;
    }
  }));
  return out;
})();
/** the buildings facing the cross streets, behind the corner houses (seen down the gaps) */
const CROSS: {x: number; z: number; color: string; seed: number}[] = [[-40, 1], [-80, 1], [-120, 1], [-40, -1], [-80, -1], [-120, -1], [0, -1]].map(([z, s], i) => ({x: s * 33.5, z, color: COLORS[(i * 5 + 2) % COLORS.length][0], seed: 60 + i}));

// ---------------------------------------------------------------- painted layers
const skyDem = (c: Ctx) => {
  const g = c.createLinearGradient(0, -200, 0, 560), r = rnd(5);
  g.addColorStop(0, '#222a4a'); g.addColorStop(0.55, '#3c4670'); g.addColorStop(1, '#6a6f94'); c.fillStyle = g; c.fillRect(-400, -300, 2400, 1500);
  for (let i = 0; i < 90; i++) { c.beginPath(); c.arc(-300 + r() * 2200, -200 + r() * 560, 1.2 + r() * 1.8, 0, 7); c.fillStyle = `rgba(232,236,250,${0.35 + r() * 0.5})`; c.fill(); }
  // a last warm band low in the west (left), flat dark clouds
  const w = c.createLinearGradient(0, 380, 0, 520); w.addColorStop(0, 'rgba(176,130,140,0)'); w.addColorStop(1, 'rgba(176,130,140,0.35)'); c.fillStyle = w; c.fillRect(-400, 380, 1400, 140);
  paintCloud(c, -80, 120, 1.1, {light: '#4a5274', dark: '#3c4466'}); paintCloud(c, 980, 40, 1.3, {light: '#48506f', dark: '#3a4262'}); paintCloud(c, 520, 230, 0.7, {light: '#545b7a', dark: '#464d6c'}); paintCloud(c, 1380, 260, 0.8, {light: '#525a7a', dark: '#444b6a'});
};
const skyNgay = (c: Ctx) => {
  const g = c.createLinearGradient(0, -200, 0, 560); g.addColorStop(0, '#9aa0a2'); g.addColorStop(0.6, '#c8c0a4'); g.addColorStop(1, '#ddd0ac'); c.fillStyle = g; c.fillRect(-400, -300, 2400, 1500);
  // coal smoke lying over the town: long flat brownish-grey clouds
  [[-200, 60, 1.6], [500, 0, 1.9], [1200, 90, 1.4], [200, 250, 1.0], [900, 300, 0.9], [1500, 220, 1.0]].forEach(([x, y, s]) => paintCloud(c, x, y, s, {light: '#d8d0bc', dark: '#b8b09c'}));
  const sm = c.createLinearGradient(0, 330, 0, 520); sm.addColorStop(0, 'rgba(150,140,120,0)'); sm.addColorStop(1, 'rgba(150,140,120,0.35)'); c.fillStyle = sm; c.fillRect(-400, 330, 2400, 200);
};
/** the far city beyond the end of the street, painted for an eye at height `eyeY` and this view's x (vx): roofs and chimneys,
 *  church spires, water tanks, the bridge tower right of the street's end, all paling into the haze */
const farCity = (time: NyTime, eyeY: number, vx: number, d: number) => (c: Ctx) => {
  const night = time === 'dem', r = rnd(19), base = 450 + (eyeY / (0.4986 * d)) * 900, px = (x: number) => 800 + ((x - vx) / (0.887 * d)) * 1600;
  const T = night ? {far: '#4e5578', mid: '#454c6e', near: '#3c4364', lit: '#8a8466', stone: '#5a6080', shade: '#4c5274', cable: '#3a405c', smoke: 'rgba(120,126,160,0.5)'}
    : {far: '#b9b2a0', mid: '#aaa392', near: '#9c9584', lit: '', stone: '#b2ab98', shade: '#a19a88', cable: '#8a8474', smoke: 'rgba(230,222,206,0.6)'};
  // the bridge tower first (its arches are cut through the plate), right of the street's end
  paintBridgeTower(c, px(0) + 270, base + 4, 1.05, T);
  // three ranks of roofs, each nearer one darker and lower in the frame
  ([[T.far, 60, 140], [T.mid, 40, 100], [T.near, 24, 70]] as [string, number, number][]).forEach(([fill, lo, hi], rank) => {
    for (let x = -300; x < 1900; x += 30 + r() * 60) {
      const w = 40 + r() * 90, h = lo + r() * (hi - lo), b = base + rank * 3;
      if (x > px(0) + 200 && x < px(0) + 340 && rank === 0 && h > 90) continue;   // keep the tower's feet in view
      P(c, [[x, b], [x, b - h], [x + w, b - h], [x + w, b]], fill);
      if (r() < 0.45) { c.fillStyle = fill; c.fillRect(x + w * 0.7, b - h - 18, 7, 18); if (!night || r() < 0.6) { c.fillStyle = T.smoke; [0, 1, 2].forEach((q) => { c.beginPath(); c.arc(x + w * 0.7 + 4 + q * 7, b - h - 26 - q * 12, 6 + q * 3, 0, 7); c.fill(); }); } }
      if (r() < 0.2) { c.fillStyle = fill; c.fillRect(x + w * 0.3, b - h - 26, 3, 26); c.fillRect(x + w * 0.3 + 18, b - h - 26, 3, 26); P(c, [[x + w * 0.3 - 4, b - h - 26], [x + w * 0.3 + 11, b - h - 52], [x + w * 0.3 + 25, b - h - 26]], fill); }
      if (night && rank === 0 && r() < 0.25 && T.lit) { c.fillStyle = T.lit; c.fillRect(x + w * 0.4, b - h * 0.5, 4, 5); }
    }
  });
  // church spires
  [[px(-60), 230], [px(-14), 170], [px(70), 200]].forEach(([x, h]) => { P(c, [[x - 14, base], [x - 14, base - h * 0.6], [x + 14, base - h * 0.6], [x + 14, base]], T.mid); P(c, [[x - 16, base - h * 0.6], [x, base - h], [x + 16, base - h * 0.6]], T.mid); });
  c.fillStyle = T.near; c.fillRect(-300, base - 4, 2200, 60);
};

// ---------------------------------------------------------------- lights: one key with its shadows aimed at the view's focus
const Lights: React.FC<{grade: Grade; dir: V3; focus: V3; reach: number; gain?: number}> = ({grade, dir, focus, reach, gain = 1}) => {
  const g = GRADES[grade], target = useMemo(() => new THREE.Object3D(), []);
  target.position.set(...focus); target.updateMatrixWorld();
  return (
    <>
      <hemisphereLight args={[g.sky, g.ground, g.fill * gain]} />
      <primitive object={target} />
      <directionalLight position={[focus[0] + dir[0] * 4, focus[1] + dir[1] * 4, focus[2] + dir[2] * 4]} target={target} intensity={g.key * gain} color={g.keyColor} castShadow shadow-mapSize={[4096, 4096]} shadow-radius={1.6} shadow-blurSamples={12} shadow-bias={-0.0005}
        shadow-camera-left={-reach} shadow-camera-right={reach} shadow-camera-top={reach} shadow-camera-bottom={-reach} shadow-camera-near={1} shadow-camera-far={120} />
    </>
  );
};
const TIME = {
  dem: {grade: 'nightExterior' as Grade, dir: [-5, 7, 4] as V3, gain: 1.0, haze: '#4c5476', fog: [34, 280] as [number, number]},
  ngay: {grade: 'dayExterior' as Grade, dir: [-9, 8, 4] as V3, gain: 1.0, haze: '#cbc3aa', fog: [36, 330] as [number, number]},
};

// ---------------------------------------------------------------- the set
/** power: the level of each light (nyWave); default = everything Edison's line reaches is on (the end of shot 2). Ignored by day.
 *  pull = the knife switch (0 up, 1 down); default 1 when the station is lit. people = the set's own extras (passers-by by night;
 *  walkers and the two diggers by day). */
export const NyStreet: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; time?: NyTime; view?: NyView; power?: NyPower; pull?: number; people?: boolean}> =
  ({children, f = 0, dx, dz, time = 'dem', view = 'b', power, pull, people = true}) => {
    const T = TIME[time], V = NY_VIEWS[view], EYE = V.eye, night = time === 'dem', day = !night, k = `${time}-${view}`;
    const pw: NyPower = night ? power ?? nyWave({f: 0, station: -100, z0: 1}) : () => 0;
    const lv = (l: Omit<NyLight, 'row'>) => { const row = rowOf(l.z); return Math.min(1.6, pw({...l, row})) * (l.kind === 'lamp' ? LAMP_STRENGTH : ROW_STRENGTH)[row]; };
    const warmOf = (z: number) => (rowOf(z) === 3 ? WEAK : WARM);
    const stationOn = Math.min(1, pw({kind: 'station', z: 0, x: 8, row: 1}));
    const sw = pull ?? (stationOn > 0 ? 1 : 0);
    const roadY = -0.12, ditch = NY_SPOTS.ditch;
    return (
      <GradeCtx.Provider value={T.grade}>
        <Lights grade={T.grade} dir={T.dir} focus={V.focus} reach={V.reach} gain={T.gain} />
        <StageCam eye={EYE} haze={T.haze} fog={T.fog} dx={dx} dz={dz} />
        <Plate from={EYE} id={`ny-sky-${k}`} d={520} paint={night ? skyDem : skyNgay} fog={false} />
        <Plate from={EYE} id={`ny-city-${k}`} d={EYE[2] + 212} paint={farCity(time, EYE[1], EYE[0], EYE[2] + 212)} fog={false} />
        {/* the ground: cobbled roads (split round the ditch), pavements with kerbs */}
        <CobbleRoad pos={[-32.5, roadY, -92]} size={[55, 216]} seed={1} />
        <CobbleRoad pos={[28.1, roadY, -92]} size={[63.8, 216]} seed={2} />
        {day ? <><CobbleRoad pos={[-4.4, roadY, -13]} size={[1.2, 58]} seed={3} /><CobbleRoad pos={[-4.4, roadY, -137.5]} size={[1.2, 125]} seed={3} /></>
          : <CobbleRoad pos={[-4.4, roadY, -92]} size={[1.2, 216]} seed={3} />}
        {NY_ROWS.map(([za, zb], i) => ([-1, 1] as const).map((s) => <React.Fragment key={`${i}${s}`}>
          <Sidewalk x={[s * 5, s * 8]} z={[za + 2.5, zb - 2.5]} kerb={[s > 0 ? 'x0' : 'x1']} seed={i * 2 + (s > 0 ? 1 : 0)} />
          <Sidewalk x={[s * 8, s * 46]} z={[za, za + 2.5]} kerb={['z1']} seed={i + 20} />
          <Sidewalk x={[s * 8, s * 46]} z={[zb - 2.5, zb]} kerb={['z0']} seed={i + 30} />
        </React.Fragment>))}
        <Sidewalk x={[-46, 46]} z={[8, 12]} kerb={['z0']} seed={40} />
        <Sidewalk x={[-46, 46]} z={[-192.5, -200]} kerb={['z1']} seed={41} />
        {/* street litter, cracks, a few tufts */}
        <Scatter kind="street" pos={[0, roadY, -20]} area={[9, 40]} seed={4} density={1.6} keep={[[-0.5, 3, 2]]} />
        <Scatter kind="street" pos={[0, roadY, -60]} area={[9, 40]} seed={5} density={1.2} />
        <Scatter kind="street" pos={[0, roadY, -100]} area={[9, 30]} seed={6} />
        {/* the houses */}
        {HOUSES.map((q) => { const zc = (q.z0 + q.z1) / 2; return (
          <Townhouse key={q.seed} pos={[q.side * 8, 0, zc]} rotY={-q.side * Math.PI / 2} w={q.z0 - q.z1} h={q.h} color={q.color} kind={q.kind} sign={q.sign} awning={q.awning} paint={q.paint} board={q.board} ink={q.ink}
            seed={q.seed} night={night} lit={lv({kind: 'window', z: zc, x: q.side * 8})} shop={lv({kind: 'shop', z: zc, x: q.side * 8})} warm={warmOf(zc)} end={q.end ? (q.side > 0 ? 1 : -1) : 0} tank={q.tank} doorLeft={q.doorLeft} />); })}
        {CROSS.map((q, i) => <Townhouse key={`c${i}`} pos={[q.x, 0, q.z]} w={23} h={13 + (i % 3) * 1.6} d={12} color={q.color} seed={q.seed} night={night} lit={q.z > -200 ? lv({kind: 'window', z: q.z - 1, x: q.x}) : 0} shop={lv({kind: 'shop', z: q.z - 1, x: q.x})} warm={warmOf(q.z - 1)} sign={SIGNS[(i + 7) % SIGNS.length]} awning={AWNINGS[i % AWNINGS.length]} />)}
        {/* the end of the street */}
        {[-24, -12, 0, 12, 24].map((x, i) => <Townhouse key={`end${i}`} pos={[x, 0, -200]} w={12} h={12 + (i % 2) * 2.4} d={10} color={COLORS[(i * 3 + 1) % COLORS.length][0]} kind={COLORS[(i * 3 + 1) % COLORS.length][1]} seed={90 + i} night={night} sign={SIGNS[(i + 13) % SIGNS.length]} />)}
        <PowerStation pos={STATION_AT} night={night} lit={stationOn} door={stationOn} lamp={night ? Math.min(1.6, pw({kind: 'station', z: 0, x: 8, row: 1})) : 0} pull={sw} f={f} />
        <StoneOffice pos={OFFICE_AT} doorX={NY_SPOTS.officeDoor[0] - OFFICE_AT[0]} sign={day ? 'WESTINGHOUSE ELECTRIC CO.' : ''} night={night} lit={lv({kind: 'window', z: -47, x: -8})} warm={WARM} />
        {/* Edison's line: poles and wires, the lamps; the telegraph line and the gas lamps beyond */}
        <WirePoles feet={POLES} h={9} arms={4} per={4} extra={[
          ...[0, 1, 2, 3].map((i): [V3, V3, number] => [[8.05, 15.6, -2.5 - i * 0.4], [5.9 - 0.8 + i * 0.5, 8.9, -11], 0.5]),
          ...[-26, -56, -86].map((z, i): [V3, V3, number] => [[5.2, 8.85, z], [-7.95, 10.5 + i * 0.6, z - 4], 0.9]),
          ...[-41, -71].map((z): [V3, V3, number] => [[6.5, 8.15, z], [-7.95, 9.2, z + 3], 0.7]),
          ...LAMPS.filter((l) => l.x > 0).map((l): [V3, V3, number] => [[5.9, 6.4, POLES.reduce((a, p) => (Math.abs(p[2] - l.z) < Math.abs(a - l.z) ? p[2] : a), -11)], [l.x, 4.75, l.z], 0.15]),
          ...LAMPS.filter((l) => l.x < 0 && !l.last).map((l): [V3, V3, number] => [[5.4, 7.0, l.z - 6], [l.x, 4.75, l.z], 0.5]),
          [[-5.6, 4.78, -104], [5.9 - 0.5, 6.55, -112], 0.35],
        ]} />
        <PoleLine feet={[[5.9, 0, -112], [5.9, 0, -127], [5.9, 0, -142], [5.9, 0, -157], [5.9, 0, -172], [5.9, 0, -187]]} h={6.2} />
        {LAMPS.map((l, i) => <ElectricLamp key={i} pos={[l.x, 0, l.z]} arm={l.arm} f={f} seed={i} light={night} pool={night ? (l.last ? 5 : 4) : 0}
          level={lv({kind: 'lamp', z: l.z, x: l.x, last: l.last})} tone={l.last || rowOf(l.z) === 3 ? (l.last ? '#ff9a4a' : '#ffb466') : '#ffe4a4'} />)}
        {GAS.map(([x, z], i) => <React.Fragment key={`g${i}`}><CampusLamp pos={[x, 0, z]} h={3.4} />{night ? <GasGlow pos={[x, 0, z]} h={3.4} on={0.75 + 0.2 * Math.sin(i * 2.3)} /> : null}</React.Fragment>)}
        {/* life on the pavements: crates, barrels, sacks, a cart */}
        <Crate pos={[13.9, 0, 1.3]} s={0.62} rotY={0.3} /><Crate pos={[14.25, 0.62, 1.25]} s={0.42} rotY={-0.2} /><Barrel pos={[13.1, 0, 1.75]} />
        {([[-6.6, -9, 'c'], [-7.2, -24.5, 'b'], [6.9, -48.5, 'c'], [-6.8, -63, 's'], [7.0, -66, 'b'], [6.8, -88, 'c'], [-7.0, -97, 's'], [7.1, -108, 'b'], [-6.9, -83, 'c']] as [number, number, string][]).map(([x, z, t], i) =>
          t === 'c' ? <Crate key={`p${i}`} pos={[x, 0, z]} s={0.6} rotY={i * 0.4} /> : t === 'b' ? <Barrel key={`p${i}`} pos={[x, 0, z]} /> : <Sack key={`p${i}`} pos={[x, 0, z]} />)}
        {day ? <>
          <Trench x={ditch.x} z={ditch.z} floor={ditch.floor} road={roadY} heap={-1} heapAt={-5.75} keep={[-47, -56, -64]} planks={[-44.5, -69]} tools={[-48.8, -51.5]} seed={2} />
          <DirtThrow f={f} from={[-4.25, -0.1, -56]} to={{x: [-6.2, -5.4], z: [-54, -58], y: 0.5}} every={12} seed={1} />
          <DirtThrow f={f} from={[-4.25, -0.1, -64]} to={{x: [-6.2, -5.4], z: [-62, -66], y: 0.5}} every={13} delay={6} seed={2} />
        </> : null}
        {people ? (night ? <>
          {/* passers-by stopped on the pavements, looking up at the lamps */}
          <Puppet3 height={HEIGHT.extra} pos={[-6.5, 0, -13.5]} spec={look(extra('#3a3238', '#2a2228'), [10, -36])} />
          <Puppet3 height={HEIGHT.extraShort} pos={[-6.0, 0, -15.2]} flip spec={look(extra('#5a3a3a', '#6b4a2a', 'sweep'), [10, -36])} />
          <Puppet3 height={HEIGHT.extra} pos={[6.6, 0, -31.6]} flip spec={look(extra('#2e3a4a', '#a9a49a', 'bald'), [-10, -36])} />
          <Puppet3 height={HEIGHT.extraShort} pos={[-6.4, 0, -47.5]} spec={look(extra('#4a4434', '#1f1c22'), [8, -36])} />
        </> : <>
          <Puppet3 height={HEIGHT.extra} pos={[6.5, 0, -51]} flip spec={extra('#3a3a44', '#2a2420')} />
          <Puppet3 height={HEIGHT.extraShort} pos={[-6.6, 0, -86]} spec={extra('#5a4a3a', '#6b4a2a', 'sweep')} />
          <Puppet3 height={HEIGHT.extra} pos={[6.4, 0, -94]} flip spec={extra('#2e3a4a', '#1f1c22')} />
          <Puppet3 height={HEIGHT.extra} pos={[ditch.x, ditch.floor, -56]} flip spec={DIGGER_A} />
          <Puppet3 height={HEIGHT.extraShort} pos={[ditch.x, ditch.floor, -64]} spec={DIGGER_B} />
        </>) : null}
        {children}
      </GradeCtx.Provider>
    );
  };
const look = (s: Spec, gaze: [number, number], expr = s.expr): Spec => ({...s, expr: {...expr, gaze}});
export const DIGGER_A: Spec = look(extra('#6a5a46', '#2a2420', 'level', true), [-16, 20], EXPR.neutral);
export const DIGGER_B: Spec = look(extra('#4a5058', '#5a3a26', 'sweep', true), [16, 20], EXPR.neutral);

// ---------------------------------------------------------------- the stills: each view with its people at their marks, and
// the light plan of its shot running over the frames (no acting: only the set's lights change)
/** the marks of the passage's people in this set (see the stage notes, out/tesla/ghi-chu-san-khau-PH.md) */
export const NY_MARKS = {edison: [9.98, 0, 0.62] as V3, teslaDitch: [-4.4, -0.95, -47] as V3, teslaOffice: [-13.8, 0, -38.9] as V3, westOffice: [-12.0, 0, -39.2] as V3};
/** shot 1's light plan: the switch pulled at 24-26, the station lit at 27, the street lamps from 34, one every 5 frames, block 1 only */
export const powerShot1 = (f: number) => nyWave({f, station: 27, from: 34, every: 5, band: 15, z0: 0, zEnd: -32});
/** shot 2's: block 1 already on; blocks 2 and 3 come on by depth from frame 4, a step every 3 frames, to frame 40 */
export const powerShot2 = (f: number) => nyWave({f, station: -100, from: 4, every: 3, band: 6, z0: -36, zEnd: -110});
/** shot 3's: all on; the last lamp (and the shop window by it) flickers, out at frames 18 and 41 */
export const powerShot3 = (f: number) => nyWave({f, station: -100, z0: 1, zEnd: -110, flick: true, offs: [18, 41]});
const EDISON_REACH: Spec = {...EDISON, expr: {...EXPR.smirk, gaze: [30, 6]}, armR: {sh: 114, el: 8, wrist: 0, hand: 'grip'}};
const ViewA: React.FC = () => { const f = useCurrentFrame(), pull = f < 24 ? 0 : Math.min(1, (f - 24) / 2);
  return <Shot grade="nightExterior" eye={NY_VIEWS.a.eye} finish={{warm: ''}} set={(inside, cam) => <NyStreet time="dem" view="a" f={f} power={powerShot1(f)} pull={pull} dx={cam.dx} dz={cam.dz}>{inside}</NyStreet>}
    figures={<Puppet3 height={HEIGHT.edison} pos={NY_MARKS.edison} res={3} spec={EDISON_REACH} />} />; };
const ViewB: React.FC = () => { const f = useCurrentFrame();
  return <Shot grade="nightExterior" eye={NY_VIEWS.b.eye} finish={{warm: ''}} set={(inside, cam) => <NyStreet time="dem" view="b" f={f} power={powerShot2(f)} dx={cam.dx} dz={cam.dz}>{inside}</NyStreet>} figures={null} />; };
const ViewC: React.FC = () => { const f = useCurrentFrame();
  return <Shot grade="nightExterior" eye={NY_VIEWS.c.eye} finish={{warm: ''}} set={(inside, cam) => <NyStreet time="dem" view="c" f={f} power={powerShot3(f)} dx={cam.dx} dz={cam.dz}>{inside}</NyStreet>} figures={null} />; };
const ViewD: React.FC = () => { const f = useCurrentFrame();
  return <Shot grade="dayExterior" eye={NY_VIEWS.d.eye} finish={{warm: '#e8d6b0', warmAmount: 0.12}} set={(inside, cam) => <NyStreet time="ngay" view="d" f={f} dx={cam.dx} dz={cam.dz}>{inside}</NyStreet>}
    figures={<Puppet3 height={HEIGHT.tesla} pos={NY_MARKS.teslaDitch} res={3} spec={{...TESLA_WORN, expr: {...EXPR.sad, gaze: [0, 30]}}} />} />; };
const ViewE: React.FC = () => { const f = useCurrentFrame();
  return <Shot grade="dayExterior" eye={NY_VIEWS.e.eye} finish={{warm: '#e8d6b0', warmAmount: 0.12}} set={(inside, cam) => <NyStreet time="ngay" view="e" f={f} dx={cam.dx} dz={cam.dz}>{inside}</NyStreet>}
    figures={<>
      <Puppet3 height={HEIGHT.tesla} pos={NY_MARKS.teslaOffice} res={3} spec={{...TESLA_WORN, expr: {...EXPR.happy, gaze: [30, 0]}}} />
      <Puppet3 height={HEIGHT.westinghouse} pos={NY_MARKS.westOffice} res={3} flip spec={{...WESTINGHOUSE, expr: {...EXPR.neutral, brow: 'angry', browY: 8, gaze: [30, 0]}}} />
    </>} />; };
export const NyStreetComps: React.FC = () => <>
  <Composition id="ph-dem-a" component={ViewA} width={1280} height={720} fps={24} durationInFrames={54} />
  <Composition id="ph-dem-b" component={ViewB} width={1280} height={720} fps={24} durationInFrames={58} />
  <Composition id="ph-dem-c" component={ViewC} width={1280} height={720} fps={24} durationInFrames={56} />
  <Composition id="ph-ngay-d" component={ViewD} width={1280} height={720} fps={24} durationInFrames={44} />
  <Composition id="ph-ngay-e" component={ViewE} width={1280} height={720} fps={24} durationInFrames={60} />
</>;
