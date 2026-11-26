import React, {useMemo} from 'react';
import * as THREE from 'three';
import {NguonBui} from './buiNguon';
import {B} from './kit';
import {FacetLathe, ContactShade, Halo} from './look';
import {Sprite, rnd, P, Ctx} from './depth';
import {useSurface, useWear} from './detail';
import {canvasTex, once} from './room';
import {tex} from './kitLab';

/** lib3/kitCampus: the pieces of a university's grounds (set G of the "Victor at university" passage), usable by any
 *  campus, college or old institutional yard: a red-brick lecture hall with its clock tower and front steps, a lower brick
 *  dormitory, an iron gate between brick piers, cast-iron lamps, a founder's statue, stone benches, a bicycle rack, paved
 *  paths, fallen leaves, and the flat painters for maples, ivy, bushes and the far layers.
 *  Every built piece takes `night` where it has lights (windows, lanterns). Positions are in metres; each piece's own
 *  front faces +z (the camera side). */
type V3 = [number, number, number];

// ---------------------------------------------------------------- surfaces
/** A textured face (brick, stone, slabs) lying in a plane: the near-white surface tinted by `color`, the wear picture over it. */
export const Face: React.FC<{w: number; h: number; pos: V3; color: string; kind?: 'brick' | 'stone' | 'slabs' | 'plaster'; tile?: number; seed?: number; rot?: V3; wear?: boolean}> =
  ({w, h, pos, color, kind = 'brick', tile = 3, seed = 1, rot = [0, 0, 0], wear = true}) => {
    const base = useSurface(kind, seed), stains = useWear(seed, 0.5);
    const map = useMemo(() => { const t = base.clone(); t.needsUpdate = true; t.repeat.set(w / tile, h / (tile * 0.5)); return t; }, [base, w, h, tile]);
    return (
      <group position={pos} rotation={rot}>
        <mesh receiveShadow><planeGeometry args={[w, h]} /><meshLambertMaterial color={color} map={map} /></mesh>
        {wear ? <mesh position={[0, 0, 0.003]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={stains} transparent depthWrite={false} /></mesh> : null}
      </group>
    );
  };

/** Slate: staggered rows of grey tiles with a darker shadow line under each row and a few odd tiles (tinted by the material). */
const slateTex = once(() => canvasTex(512, 512, (c) => {
  const r = rnd(17); c.fillStyle = '#e4e4e4'; c.fillRect(0, 0, 512, 512);
  for (let j = 0, row = 0; j < 512; j += 32, row++) for (let i = row % 2 ? -24 : 0; i < 512; i += 48) {
    const q = r(); c.fillStyle = q < 0.1 ? '#f6f6f6' : q < 0.22 ? '#cfcfcf' : q < 0.27 ? '#bdbdbd' : '#e2e2e2'; c.fillRect(i + 1, j + 1, 46, 30);
    c.fillStyle = 'rgba(40,40,50,0.35)'; c.fillRect(i, j + 27, 48, 5);
  }
}));
const useSlate = (rx: number, ry: number) => useMemo(() => { const t = slateTex().clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; }, [rx, ry]);

/** A hip roof (or a gable roof when hip = 0): eaves rectangle w x d at height 0, ridge at height h. uv laid so slate rows
 *  run along the eaves. */
const roofGeo = (w: number, d: number, h: number, hip: number) => {
  const W = w / 2, D = d / 2, R = Math.max(0, W - hip), v: number[] = [], uv: number[] = [];
  // slate rows run along the eaves: u along the eaves line, v down the slope (by height)
  const tri = (a: number[], b: number[], c: number[], along: 'x' | 'z') => [a, b, c].forEach((p) => { v.push(p[0], p[1], p[2]); uv.push((along === 'x' ? p[0] : p[2]) / 4, (h - p[1]) / 1.7); });
  const A = [-W, 0, D], Bq = [W, 0, D], C = [W, 0, -D], Dq = [-W, 0, -D], E = [-R, h, 0], F = [R, h, 0];
  tri(A, Bq, F, 'x'); tri(A, F, E, 'x');           // front slope
  tri(C, Dq, E, 'x'); tri(C, E, F, 'x');           // back slope
  tri(Dq, A, E, 'z'); tri(Bq, C, F, 'z');          // the two ends (hips, or gables standing upright when hip = 0)
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
};
export const Roof: React.FC<{w: number; d: number; h: number; hip?: number; pos: V3; color: string; ends?: string}> = ({w, d, h, hip = 0, pos, color, ends}) => {
  const geo = useMemo(() => roofGeo(w, d, h, hip), [w, d, h, hip]), map = useSlate(1, 1);
  // gable ends (hip 0) are walls, not slate: a separate pair of triangles in the wall colour
  const gable = useMemo(() => { if (hip > 0 || !ends) return null; const W = w / 2 - 0.25, D = d / 2 - 0.25, v = [-W, 0, D, -W, 0, -D, -W, h - 0.2, 0, W, 0, -D, W, 0, D, W, h - 0.2, 0]; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g; }, [w, d, h, hip, ends]);
  return (
    <group position={pos}>
      <mesh geometry={geo} castShadow receiveShadow><meshLambertMaterial color={color} map={map} side={THREE.DoubleSide} flatShading /></mesh>
      {gable ? <mesh geometry={gable} castShadow receiveShadow><meshLambertMaterial color={ends} side={THREE.DoubleSide} /></mesh> : null}
      {/* the ridge capping, a darker line along the top */}
      <B p={[0, h + 0.04, 0]} s={[Math.max(0.2, w - 2 * hip), 0.12, 0.2]} c="#4f5258" cast={false} />
    </group>
  );
};

// ---------------------------------------------------------------- windows and doors (in wall units: centre x, y; the wall face at z = 0)
const GLASS = {day: '#36445a', sun: '#f2c98c', sunDark: '#c98f5c', lit: '#f6d48a', cold: '#5d6a7e', night: '#28304a'};
type Glaze = 'day' | 'sun' | 'lit' | 'night' | 'cold' | 'machine';
const glassColor = (g: Glaze) => (g === 'machine' ? '#d6f0ff' : GLASS[g]);
/** A tall window with a round head (lecture hall): white frame, glazing bars, stone sill and keystone; `blind` = a cream
 *  blind drawn down over the top part (0-1); glaze = what the glass shows (dark sky, the low sun, a lit room). */
export const ArchWindow: React.FC<{x: number; y: number; w?: number; h?: number; glaze: Glaze; blind?: number; trim?: string; stone?: string}> = ({x, y, w = 1.3, h = 1.7, glaze, blind = 0, trim = '#f1ece0', stone = '#d8ccb4'}) => {
  const r = w / 2, lit = glaze === 'lit' || glaze === 'machine', gc = glassColor(glaze);
  const Glass = lit ? 'meshBasicMaterial' : 'meshLambertMaterial';
  return (
    <group position={[x, y, 0]}>
      {/* stone surround, then the white frame, then the glass set back */}
      <mesh position={[0, 0, 0.02]}><planeGeometry args={[w + 0.42, h]} /><meshLambertMaterial color={stone} /></mesh>
      <mesh position={[0, h / 2, 0.02]}><circleGeometry args={[r + 0.21, 20, 0, Math.PI]} /><meshLambertMaterial color={stone} /></mesh>
      <mesh position={[0, 0, 0.04]}><planeGeometry args={[w + 0.16, h]} /><meshLambertMaterial color={trim} /></mesh>
      <mesh position={[0, h / 2, 0.04]}><circleGeometry args={[r + 0.08, 20, 0, Math.PI]} /><meshLambertMaterial color={trim} /></mesh>
      <mesh position={[0, -0.04, 0.05]}><planeGeometry args={[w - 0.04, h - 0.1]} />{React.createElement(Glass, {color: gc})}</mesh>
      <mesh position={[0, h / 2 - 0.08, 0.05]}><circleGeometry args={[r - 0.02, 20, 0, Math.PI]} />{React.createElement(Glass, {color: glaze === 'sun' ? GLASS.sunDark : gc})}</mesh>
      {glaze === 'sun' ? <mesh position={[-w * 0.18, -h * 0.1, 0.055]} rotation={[0, 0, -0.5]}><planeGeometry args={[w * 0.16, h * 0.9]} /><meshBasicMaterial color="#fff1d2" transparent opacity={0.55} /></mesh> : null}
      {blind > 0 ? <mesh position={[0, h / 2 - (h * blind) / 2, 0.058]}><planeGeometry args={[w - 0.06, h * blind]} /><meshLambertMaterial color={lit ? '#f3dca2' : '#e9dcc0'} /></mesh> : null}
      {/* glazing bars: one upright into the head, two transoms */}
      <B p={[0, 0.2, 0.07]} s={[0.06, h + r * 0.8, 0.03]} c={trim} cast={false} />
      {[-0.18, 0.2].map((k) => <B key={k} p={[0, h * k, 0.07]} s={[w, 0.05, 0.03]} c={trim} cast={false} />)}
      <B p={[0, -h / 2 - 0.08, 0.1]} s={[w + 0.5, 0.12, 0.22]} c={stone} />
      <B p={[0, h / 2 + r + 0.16, 0.06]} s={[0.24, 0.3, 0.08]} c={stone} cast={false} />
    </group>
  );
};
/** A sash window (dormitory): white frame, 2 x 3 panes, stone lintel and sill; curtains at the sides; optional flower box
 *  or a towel hung over the sill. */
export const SashWindow: React.FC<{x: number; y: number; w?: number; h?: number; glaze: Glaze; curtain?: string; flowers?: boolean; towel?: string; trim?: string; stone?: string}> = ({x, y, w = 1.2, h = 1.6, glaze, curtain, flowers, towel, trim = '#efe9dc', stone = '#cfc3ab'}) => {
  const lit = glaze === 'lit' || glaze === 'machine', gc = glassColor(glaze), Glass = lit ? 'meshBasicMaterial' : 'meshLambertMaterial';
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, 0, 0.03]}><planeGeometry args={[w + 0.18, h + 0.18]} /><meshLambertMaterial color={trim} /></mesh>
      <mesh position={[0, 0, 0.045]}><planeGeometry args={[w, h]} />{React.createElement(Glass, {color: gc})}</mesh>
      {curtain ? [-1, 1].map((k) => <mesh key={k} position={[k * (w / 2 - w * 0.13), 0.02, 0.05]}><planeGeometry args={[w * 0.24, h * 0.96]} />{React.createElement(lit ? 'meshBasicMaterial' : 'meshLambertMaterial', {color: lit ? '#f0b870' : curtain})}</mesh>) : null}
      <B p={[0, 0, 0.065]} s={[0.05, h, 0.03]} c={trim} cast={false} /><B p={[0, 0.02, 0.07]} s={[w, 0.07, 0.03]} c={trim} cast={false} />
      {[-h / 4 - 0.1, h / 4 + 0.12].map((k) => <B key={k} p={[0, k, 0.068]} s={[w, 0.035, 0.025]} c={trim} cast={false} />)}
      <B p={[0, h / 2 + 0.2, 0.06]} s={[w + 0.36, 0.22, 0.1]} c={stone} cast={false} />
      <B p={[0, -h / 2 - 0.1, 0.1]} s={[w + 0.36, 0.1, 0.22]} c={stone} />
      {flowers ? <group position={[0, -h / 2 - 0.02, 0.24]}><B p={[0, 0, 0]} s={[w + 0.06, 0.2, 0.22]} c="#7a5236" />{[-0.4, -0.15, 0.1, 0.35].map((d, i) => <mesh key={d} position={[d * w, 0.16 + (i % 2) * 0.04, 0.12]}><circleGeometry args={[0.09, 7]} /><meshLambertMaterial color={['#c8463c', '#e8b23a', '#c8463c', '#4f7a3a'][i]} /></mesh>)}</group> : null}
      {towel ? <B p={[w * 0.18, -h / 2 - 0.12, 0.14]} s={[0.4, 0.4, 0.02]} c={towel} cast={false} /> : null}
    </group>
  );
};

/** A clock face: cream dial, dark rim, twelve marks, two hands at the given time (hours, 0-24). */
export const ClockFace: React.FC<{pos: V3; r: number; hour: number; night?: boolean}> = ({pos, r, hour, night}) => {
  const ha = -((hour % 12) / 12) * Math.PI * 2, ma = -((hour % 1) * Math.PI * 2);
  return (
    <group position={pos}>
      <mesh position={[0, 0, 0]}><circleGeometry args={[r + 0.2, 32]} /><meshLambertMaterial color="#d8ccb4" /></mesh>
      <mesh position={[0, 0, 0.01]}><ringGeometry args={[r, r + 0.1, 32]} /><meshLambertMaterial color="#2c2a2a" /></mesh>
      <mesh position={[0, 0, 0.01]}><circleGeometry args={[r, 32]} />{night ? <meshBasicMaterial color="#f2e2b0" /> : <meshLambertMaterial color="#f1ead8" />}</mesh>
      {Array.from({length: 12}, (_, i) => { const a = (i / 12) * Math.PI * 2; return <mesh key={i} position={[Math.sin(a) * r * 0.84, Math.cos(a) * r * 0.84, 0.02]} rotation={[0, 0, -a]}><planeGeometry args={[i % 3 ? 0.06 : 0.1, i % 3 ? 0.16 : 0.26]} /><meshBasicMaterial color="#2c2a2a" /></mesh>; })}
      <group rotation={[0, 0, ha]}><mesh position={[0, r * 0.26, 0.03]}><planeGeometry args={[0.1, r * 0.55]} /><meshBasicMaterial color="#1f1d1d" /></mesh></group>
      <group rotation={[0, 0, ma]}><mesh position={[0, r * 0.38, 0.035]}><planeGeometry args={[0.06, r * 0.8]} /><meshBasicMaterial color="#1f1d1d" /></mesh></group>
      <mesh position={[0, 0, 0.04]}><circleGeometry args={[0.07, 8]} /><meshBasicMaterial color="#1f1d1d" /></mesh>
    </group>
  );
};

// ---------------------------------------------------------------- the lecture hall
/** The red-brick lecture hall: three floors over a raised stone plinth, a clock tower in the middle with the main door,
 *  wide stone steps, slate hip roof with dormers and chimneys, round-headed white windows, ivy up the left corner, a flag.
 *  Local frame: the main front at z = 0, centre x = 0; the tower stands 1 m proud; the landing is at y = LANDING. */
export const HALL = {w: 32, d: 14, wall: 10.4, landing: 1.0, landingZ: [1.0, 2.4] as [number, number], stepsFront: 4.6, tower: 6, towerTop: 14.8};
export const LectureHall: React.FC<{pos: V3; night?: boolean; sun?: boolean; hour?: number; ivy?: string[]}> = ({pos, night, sun, hour = 17.2, ivy}) => {
  const brick = '#a65440', stone = '#d6cab2', plinth = '#b5ac9e', slate = '#6f747d', H = HALL;
  const r = rnd(5), bays = [-13.6, -10.8, -8.0, -5.2, 5.2, 8.0, 10.8, 13.6], floors = [2.6, 5.6, 8.6];
  // which windows are lit at night / catch the low sun / have a blind down: fixed by seed, never all alike
  const pick = bays.flatMap((x) => floors.map((y) => ({x, y, q: r(), b: r()})));
  return (
    <group position={pos}>
      {/* body and its brick front */}
      <B p={[0, H.wall / 2, -H.d / 2]} s={[H.w, H.wall, H.d]} c={brick} />
      <Face w={H.w} h={H.wall - 1} pos={[0, 1 + (H.wall - 1) / 2, 0.01]} color={brick} tile={3.2} seed={3} />
      <B p={[0, 0.5, 0.12]} s={[H.w + 0.2, 1.0, 0.26]} c={plinth} /><B p={[0, 1.02, 0.18]} s={[H.w + 0.24, 0.1, 0.36]} c={stone} cast={false} />
      {[4.0, 7.0].map((y) => <B key={y} p={[0, y, 0.08]} s={[H.w + 0.12, 0.18, 0.16]} c={stone} cast={false} />)}
      <B p={[0, H.wall + 0.12, 0.22]} s={[H.w + 0.6, 0.34, 0.6]} c={stone} />
      {Array.from({length: 54}, (_, i) => <B key={i} p={[-H.w / 2 + 0.3 + i * 0.595, H.wall - 0.14, 0.08]} s={[0.22, 0.16, 0.14]} c={stone} cast={false} />)}
      {/* quoins at the two corners, long and short in turn */}
      {[-1, 1].map((k) => Array.from({length: 15}, (_, i) => <B key={`${k}${i}`} p={[k * (H.w / 2 - (i % 2 ? 0.2 : 0.3)), 1.3 + i * 0.6, 0.04]} s={[i % 2 ? 0.4 : 0.6, 0.27, 0.06]} c={stone} cast={false} />))}
      {pick.map(({x, y, q, b}, i) => <ArchWindow key={i} x={x} y={y} h={y > 8 ? 1.5 : 1.7} glaze={night ? (q < 0.22 ? 'lit' : 'night') : sun ? (q < 0.45 ? 'sun' : 'day') : (q < 0.2 ? 'cold' : 'day')} blind={b < 0.3 ? 0.25 + b : 0} />)}
      {/* roof: slate hip, three dormers, two chimneys */}
      <Roof w={H.w + 0.7} d={H.d + 0.7} h={2.8} hip={6.2} pos={[0, H.wall + 0.28, -H.d / 2]} color={slate} />
      {[-10, -6, 6, 10].map((x) => <group key={x} position={[x, H.wall + 1.0, -1.5]}>
        <B p={[0, 0.5, 0]} s={[1.2, 1.2, 1.0]} c={brick} /><mesh position={[0, 1.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[1.0, 0.7, 4]} /><meshLambertMaterial color={slate} flatShading /></mesh>
        <mesh position={[0, 0.48, 0.51]}><planeGeometry args={[0.7, 0.8]} />{night && x === 6 ? <meshBasicMaterial color={GLASS.lit} /> : <meshLambertMaterial color={night ? GLASS.night : GLASS.day} />}</mesh><B p={[0, 0.48, 0.53]} s={[0.05, 0.8, 0.02]} c="#f1ece0" cast={false} />
      </group>)}
      {[-12, 12].map((x) => <group key={x} position={[x, H.wall + 1.4, -9]}><B p={[0, 1.2, 0]} s={[1.1, 2.4, 0.8]} c={brick} /><B p={[0, 2.46, 0]} s={[1.3, 0.16, 1.0]} c={stone} />{[-0.25, 0.22].map((d) => <FacetLathe key={d} profile={[[0.12, 0], [0.1, 0.36], [0.13, 0.4]]} sides={7} color="#9a5a3e" pos={[d, 2.54, 0]} contact={false} />)}</group>)}
      {/* ivy over the left corner, bushes along the plinth */}
      {ivy ? <Sprite name={`ivy-${ivy.join('')}`} art={(c, W, Hh) => paintIvy(c, W, Hh, ivy)} px={[500, 900]} w={4.6} pos={[-H.w / 2 + 2.0, 0.9, 0.12]} cast={false} shade={0} /> : null}
      <Tower night={night} sun={sun} hour={hour} brick={brick} stone={stone} slate={slate} />
      <Steps stone={stone} plinth={plinth} night={night} />
    </group>
  );
};
const Tower: React.FC<{night?: boolean; sun?: boolean; hour: number; brick: string; stone: string; slate: string}> = ({night, sun, hour, brick, stone, slate}) => {
  const T = HALL.tower, top = HALL.towerTop, zf = 1.0;
  return (
    <group>
      <B p={[0, top / 2, zf - T / 2]} s={[T, top, T]} c={brick} />
      <Face w={T} h={top - 1} pos={[0, 1 + (top - 1) / 2, zf + 0.01]} color={brick} tile={3.2} seed={7} />
      <B p={[0, 0.5, zf + 0.1]} s={[T + 0.2, 1.0, 0.22]} c="#b5ac9e" />
      {[5.0, 10.6].map((y) => <B key={y} p={[0, y, zf + 0.08]} s={[T + 0.16, 0.2, 0.18]} c={stone} cast={false} />)}
      {[-1, 1].map((k) => Array.from({length: 22}, (_, i) => <B key={`${k}${i}`} p={[k * (T / 2 - (i % 2 ? 0.2 : 0.3)), 1.3 + i * 0.6, zf + 0.04]} s={[i % 2 ? 0.4 : 0.6, 0.27, 0.06]} c={stone} cast={false} />))}
      {/* the main door: two leaves of dark oak with panels under a round fanlight, in a stone frame with columns and a cornice */}
      <group position={[0, 0, zf]}>
        <B p={[0, 2.6, 0.03]} s={[3.0, 3.4, 0.06]} c={stone} cast={false} />
        <mesh position={[0, 3.4, 0.07]}><circleGeometry args={[1.1, 20, 0, Math.PI]} />{night ? <meshBasicMaterial color="#e9c27a" /> : <meshLambertMaterial color={sun ? GLASS.sunDark : GLASS.day} />}</mesh>
        {[-0.5, 0, 0.5].map((a) => <B key={a} p={[Math.sin(a) * 0.55, 3.4 + Math.cos(a) * 0.55, 0.08]} s={[0.04, 1.0, 0.02]} r={[0, 0, -a]} c="#efe8d8" cast={false} />)}
        <B p={[0, 2.2, 0.08]} s={[2.2, 2.4, 0.06]} c="#4a2e22" />
        {[-0.55, 0.55].map((x) => [1.55, 2.75].map((y) => <B key={`${x}${y}`} p={[x, y, 0.12]} s={[0.8, y < 2 ? 0.8 : 1.1, 0.03]} c="#5d3b2b" cast={false} />))}
        <B p={[0, 2.2, 0.12]} s={[0.04, 2.4, 0.03]} c="#2e1d16" cast={false} />
        {[-0.2, 0.2].map((x) => <B key={x} p={[x, 2.2, 0.15]} s={[0.05, 0.22, 0.04]} c="#c9a650" cast={false} />)}
        {[-1.45, 1.45].map((x) => <FacetLathe key={x} profile={[[0.24, 0], [0.24, 0.2], [0.17, 0.28], [0.15, 3.2], [0.22, 3.3], [0.22, 3.5]]} sides={10} color={stone} pos={[x, 1.0, 0.22]} contact={false} />)}
        <B p={[0, 4.65, 0.22]} s={[3.6, 0.32, 0.4]} c={stone} />
        <B p={[0, 4.95, 0.18]} s={[3.2, 0.28, 0.3]} c={stone} />
      </group>
      <ArchWindow x={0} y={7.4} w={1.4} h={2.2} glaze={night ? 'night' : sun ? 'sun' : 'day'} />
      <ClockFace pos={[0, 12.6, zf + 0.02]} r={1.2} hour={hour} night={night} />
      <B p={[0, top + 0.14, zf - T / 2]} s={[T + 0.6, 0.3, T + 0.6]} c={stone} />
      {Array.from({length: 11}, (_, i) => <B key={i} p={[-T / 2 + 0.35 + i * 0.53, top - 0.16, zf + 0.06]} s={[0.22, 0.16, 0.14]} c={stone} cast={false} />)}
      <mesh position={[0, top + 1.2, zf - T / 2]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[T * 0.74, 2.0, 4]} /><meshLambertMaterial color={slate} flatShading /></mesh>
      <FacetLathe profile={[[0.06, 0], [0.04, 1.4], [0.09, 1.45], [0.02, 1.55]]} sides={6} color="#3a3a3a" pos={[0, top + 2.0, zf - T / 2]} contact={false} />
      {/* the school flag, maroon with a gold band, hanging still */}
      <group position={[0.06, top + 2.75, zf - T / 2]}><B p={[0.55, 0.32, 0]} s={[1.1, 0.64, 0.02]} c="#7d2232" cast={false} /><B p={[0.55, 0.32, 0.012]} s={[1.1, 0.12, 0.02]} c="#d8b04a" cast={false} /></group>
    </group>
  );
};
const Steps: React.FC<{stone: string; plinth: string; night?: boolean}> = ({stone, plinth, night}) => {
  const [z0, z1] = HALL.landingZ, run = (HALL.stepsFront - z1) / 4;
  return (
    <group>
      {Array.from({length: 5}, (_, k) => { const front = z1 + (4 - k) * run, d = front - z0; return <group key={k}>
        <B p={[0, k * 0.2 + 0.1, z0 + d / 2]} s={[8.0, 0.2, d]} c={k % 2 ? stone : '#cfc2a8'} />
        <B p={[0, k * 0.2 + 0.19, front - 0.03]} s={[8.0, 0.025, 0.07]} c="#9c9282" cast={false} />
      </group>; })}
      {/* cheek walls with a lamp on each, a worn dip in the middle of the steps, moss at the foot */}
      {[-1, 1].map((k) => <group key={k} position={[k * 4.3, 0, 0]}>
        <B p={[0, 0.7, (z0 + HALL.stepsFront) / 2]} s={[0.7, 1.4, HALL.stepsFront - z0]} c={plinth} /><B p={[0, 1.44, (z0 + HALL.stepsFront) / 2]} s={[0.84, 0.1, HALL.stepsFront - z0 + 0.1]} c={stone} />
        <CampusLamp pos={[0, 1.5, HALL.stepsFront - 0.4]} h={1.9} lit={night} />
        <B p={[k * -0.2, 0.08, HALL.stepsFront + 0.02]} s={[0.4, 0.14, 0.04]} c="#6f8a55" cast={false} />
      </group>)}
      <mesh position={[0, 1.004, z0 + 0.7]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.9, 16]} /><meshBasicMaterial color="#8a7e6c" transparent opacity={0.2} depthWrite={false} /></mesh>
    </group>
  );
};

// ---------------------------------------------------------------- the dormitory
/** A lower brick dormitory: two floors, sash windows with curtains and flower boxes, slate gable roof with chimneys, a door
 *  with a small porch and a lamp. Local frame: front at z = 0, from x = 0 to x = L. windows: index = floor * 10 + bay. */
export const DORM = {L: 28, d: 9, wall: 7.2, bays: Array.from({length: 10}, (_, k) => 1.6 + k * 2.8), floorY: [1.95, 5.0], door: 5};
export const Dormitory: React.FC<{pos: V3; night?: boolean; sun?: boolean; lit?: number[]; machine?: number}> = ({pos, night, sun, lit = [], machine}) => {
  const brick = '#8f4f3c', stone = '#cdbfa6', slate = '#62666f', D = DORM, r = rnd(9);
  return (
    <group position={pos}>
      <B p={[D.L / 2, D.wall / 2, -D.d / 2]} s={[D.L, D.wall, D.d]} c={brick} />
      <Face w={D.L} h={D.wall - 0.45} pos={[D.L / 2, 0.45 + (D.wall - 0.45) / 2, 0.01]} color={brick} tile={2.8} seed={11} />
      <B p={[D.L / 2, 0.22, 0.1]} s={[D.L + 0.1, 0.45, 0.2]} c="#a89f92" />
      <B p={[D.L / 2, 3.5, 0.07]} s={[D.L + 0.06, 0.14, 0.14]} c={stone} cast={false} />
      <B p={[D.L / 2, D.wall + 0.08, 0.2]} s={[D.L + 0.4, 0.22, 0.5]} c="#e9e2d2" />
      {[0.22, D.L - 0.22].map((x) => <B key={x} p={[x, D.wall / 2, 0.1]} s={[0.1, D.wall, 0.1]} c="#3a3d40" />)}
      {D.bays.map((x, b) => D.floorY.map((y, f) => {
        const idx = f * 10 + b; if (f === 0 && b === D.door) return null;
        const q = r(), g: Glaze = machine === idx ? (night ? 'machine' : sun ? 'sun' : 'day') : night ? (lit.includes(idx) ? 'lit' : 'night') : sun && q < 0.5 ? 'sun' : 'day';
        return <SashWindow key={idx} x={x} y={y} glaze={g} curtain={['#b8584a', '#d8c69a', '#5f7a8a', '#9a8a5a'][Math.floor(q * 4)]} flowers={q > 0.78} towel={q > 0.62 && q < 0.7 ? '#e8e2d4' : undefined} />;
      }))}
      {night && machine !== undefined ? <Halo pos={[D.bays[machine % 10], D.floorY[Math.floor(machine / 10)], 0.4]} r={1.7} color="#a9dcff" strength={0.4} /> : null}
      {/* the door and porch */}
      <group position={[D.bays[D.door], 0, 0]}>
        <B p={[0, 0.12, 0.6]} s={[2.4, 0.24, 1.2]} c={stone} /><B p={[0, 1.4, 0.04]} s={[1.6, 2.6, 0.06]} c={stone} cast={false} />
        <B p={[0, 1.35, 0.08]} s={[1.1, 2.2, 0.06]} c="#2f4a3c" /><B p={[0, 2.7, 0.08]} s={[1.1, 0.36, 0.04]} c={night ? '#e9c27a' : GLASS.day} cast={false} />
        <B p={[0, 3.0, 0.5]} s={[2.0, 0.12, 1.0]} c="#3a3d40" />
        <CampusLamp pos={[0.95, 1.9, 0.18]} h={0.9} lit={night} bracket />
      </group>
      <Roof w={D.L + 0.6} d={D.d + 0.7} h={2.8} pos={[D.L / 2, D.wall + 0.18, -D.d / 2]} color={slate} ends={brick} />
      {[7, 21].map((x) => <group key={x} position={[x, D.wall + 1.8, -D.d / 2]}><B p={[0, 1.0, 0]} s={[1.0, 2.0, 0.7]} c={brick} /><B p={[0, 2.06, 0]} s={[1.2, 0.14, 0.9]} c={stone} />{[-0.22, 0.2].map((d) => <FacetLathe key={d} profile={[[0.11, 0], [0.09, 0.32], [0.12, 0.36]]} sides={7} color="#9a5a3e" pos={[d, 2.13, 0]} contact={false} />)}</group>)}
    </group>
  );
};

// ---------------------------------------------------------------- yard pieces
/** A cast-iron lamp: fluted post (or a wall bracket), a four-sided lantern with a little roof; lit = glass glowing with a halo. */
/** bui (mặc định true): đèn tự đăng ký nguồn bụi (lib3/buiNguon) tại thân đèn ('den', khi sáng). */
export const CampusLamp: React.FC<{pos: V3; h?: number; lit?: boolean; bracket?: boolean; bui?: boolean}> = ({pos, h = 3.4, lit, bracket, bui = true}) => (
  <group position={pos}>{lit && bui ? <NguonBui kieu="den" pos={[0, h + 0.24, 0]} r={1.1} mau="#ffc070" /> : null}
    {bracket ? <B p={[0, h - 0.1, -0.05]} s={[0.05, 0.05, 0.3]} c="#22282a" /> : <FacetLathe profile={[[0.2, 0], [0.2, 0.25], [0.11, 0.38], [0.07, 0.6], [0.06, h - 0.2], [0.09, h - 0.1], [0.07, h]]} sides={8} color="#262d2c" contact={h > 2.5} />}
    <group position={[0, h, 0]}>
      <B p={[0, 0.02, 0]} s={[0.26, 0.04, 0.26]} c="#22282a" />
      <mesh position={[0, 0.24, 0]}><boxGeometry args={[0.28, 0.38, 0.28]} />{lit ? <meshBasicMaterial color="#ffe1a0" /> : <meshLambertMaterial color="#d9d6c4" />}</mesh>
      {[-1, 1].map((k) => <B key={k} p={[k * 0.14, 0.24, 0.142]} s={[0.025, 0.4, 0.02]} c="#22282a" cast={false} />)}
      <mesh position={[0, 0.52, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[0.28, 0.22, 4]} /><meshLambertMaterial color="#22282a" flatShading /></mesh>
      <FacetLathe profile={[[0.03, 0], [0.02, 0.12]]} sides={5} color="#22282a" pos={[0, 0.62, 0]} contact={false} />
      {lit && !bracket && h > 2.5 ? <mesh position={[0, -h + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}><planeGeometry args={[5, 5]} /><meshBasicMaterial map={poolTex()} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh> : null}
      {lit ? <><Halo pos={[0, 0.24, 0.25]} r={1.3} strength={0.5} /><Halo pos={[0, 0.24, 0.3]} r={0.5} color="#fff0c8" strength={0.7} /><pointLight position={[0, 0.1, 0.4]} color="#ffc070" intensity={4} distance={7} decay={2} /></> : null}
    </group>
  </group>
);
const poolTex = once(() => canvasTex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 2, 64, 64, 64); g.addColorStop(0, 'rgba(255,200,120,0.5)'); g.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); }));
/** A stone bench: a slab on two blocks, a darker weathered top edge, a leaf or two on the seat. */
export const StoneBench: React.FC<{pos: V3; rotY?: number; L?: number}> = ({pos, rotY = 0, L = 1.9}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {[-1, 1].map((k) => <B key={k} p={[k * (L / 2 - 0.3), 0.21, 0]} s={[0.3, 0.42, 0.46]} c="#9d978c" />)}
    <B p={[0, 0.48, 0]} s={[L, 0.13, 0.56]} c="#bdb6a8" /><B p={[0, 0.55, 0.2]} s={[L, 0.015, 0.14]} c="#a29b8e" cast={false} />
    <mesh position={[0.3, 0.548, -0.05]} rotation={[-Math.PI / 2, 0, 0.6]}><circleGeometry args={[0.07, 5]} /><meshLambertMaterial color="#c8502e" /></mesh>
    <ContactShade r={L * 0.5} strength={0.3} />
  </group>
);
/** The founder on his pedestal: stepped stone base with a bronze plaque, the bronze figure drawn flat (a person, so a picture). */
export const FounderStatue: React.FC<{pos: V3; tone?: [string, string, string]; name?: string}> = ({pos, tone = ['#5f6a52', '#46503e', '#7d8a68'], name = 'statue'}) => (
  <group position={pos}>
    <B p={[0, 0.2, 0]} s={[2.0, 0.4, 2.0]} c="#b3ab9c" /><B p={[0, 1.2, 0]} s={[1.3, 1.6, 1.3]} c="#c9c0ae" /><B p={[0, 2.1, 0]} s={[1.55, 0.22, 1.55]} c="#d8cfbd" />
    <B p={[0, 1.25, 0.66]} s={[0.7, 0.45, 0.03]} c="#6a5a3a" cast={false} />
    <B p={[0.4, 0.42, 1.0]} s={[0.5, 0.04, 0.02]} c="#7a8a5a" cast={false} />
    <Sprite name={name} art={(c, W, H) => paintFounder(c, W, H, tone)} px={[300, 600]} w={1.1} pos={[0, 2.21, 0]} shade={0} />
  </group>
);
/** An iron bicycle rack (hoops) with bicycles leaning in it (the bicycles drawn flat, side on). */
export const BikeRack: React.FC<{pos: V3; bikes?: string[]; night?: boolean}> = ({pos, bikes = ['#2f4a6a', '#7a2a2a', '#2e3a30'], night}) => (
  <group position={pos}>
    {Array.from({length: 5}, (_, i) => <group key={i} position={[i * 0.6 - 1.2, 0, 0]}><B p={[0, 0.4, 0.25]} s={[0.04, 0.8, 0.04]} c="#2a2e30" /><B p={[0, 0.4, -0.25]} s={[0.04, 0.8, 0.04]} c="#2a2e30" /><B p={[0, 0.8, 0]} s={[0.04, 0.04, 0.54]} c="#2a2e30" /></group>)}
    {bikes.map((col, i) => <Sprite key={i} name={`bike-${col}-${night ? 'n' : 'd'}`} art={(c, W, H) => paintBicycle(c, W, H, col, night)} px={[400, 240]} w={1.7} pos={[i * 0.6 - 0.9 + (i % 2) * 0.05, 0, 0.32 - i * 0.02]} shade={0.2} />)}
  </group>
);
/** The iron gate between two brick piers (a lantern on each), the leaves standing open inward, short wings of low wall and
 *  railing ending in smaller piers. Local: the gate's centre at x = 0, its outer face toward +z. */
export const IronGate: React.FC<{pos: V3; rotY?: number; open?: number; night?: boolean; wings?: [number, number]}> = ({pos, rotY = 0, open = 1.15, night, wings = [3.6, 3.6]}) => {
  const iron = '#232b29', brick = '#9d4f3c', stone = '#cdbfa6';
  const Pier: React.FC<{x: number; h?: number; w?: number; lamp?: boolean}> = ({x, h = 2.9, w = 0.8, lamp}) => <group position={[x, 0, 0]}>
    <B p={[0, 0.17, 0]} s={[w + 0.16, 0.34, w + 0.16]} c="#a89f92" /><B p={[0, 0.34 + (h - 0.34) / 2, 0]} s={[w, h - 0.34, w]} c={brick} />
    {Array.from({length: Math.floor((h - 0.4) / 0.3)}, (_, i) => <B key={i} p={[0, 0.5 + i * 0.3, 0]} s={[w + 0.012, 0.025, w + 0.012]} c="#c08a74" cast={false} />)}
    <B p={[0, h + 0.09, 0]} s={[w + 0.2, 0.18, w + 0.2]} c={stone} /><B p={[0, h + 0.22, 0]} s={[w - 0.1, 0.1, w - 0.1]} c={stone} />
    <B p={[0.12, 0.6, w / 2 + 0.005]} s={[0.3, 0.2, 0.01]} c="#6f8a55" cast={false} />
    {lamp ? <CampusLamp pos={[0, h + 0.27, 0]} h={0.5} lit={night} /> : <FacetLathe profile={[[0.18, 0], [0.24, 0.12], [0.12, 0.3], [0.05, 0.42]]} sides={8} color={stone} pos={[0, h + 0.27, 0]} contact={false} />}
  </group>;
  const Leaf: React.FC<{hinge: number; dir: 1 | -1}> = ({hinge, dir}) => <group position={[hinge, 0, 0]} rotation={[0, dir * open, 0]}>
    {[0.15, 1.1, 2.15].map((y) => <B key={y} p={[dir * 0.8, y, 0]} s={[1.6, 0.06, 0.05]} c={iron} />)}
    {Array.from({length: 11}, (_, i) => { const x = dir * (0.07 + i * 0.146), top = 2.25 + Math.sin((i / 10) * Math.PI * 0.5 + (dir < 0 ? 0 : 0)) * 0.0 + (dir > 0 ? i : 10 - i) * 0.035; return <group key={i}><B p={[x, top / 2 + 0.06, 0]} s={[0.035, top, 0.035]} c={iron} /><mesh position={[x, top + 0.13, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.05, 0.14, 4]} /><meshLambertMaterial color={iron} flatShading /></mesh></group>; })}
    {[0.42, 0.78].map((y, i) => <mesh key={y} position={[dir * 0.8, 1.62 + i * 0.0, 0.03]}><ringGeometry args={[y * 0.32, y * 0.32 + 0.04, 16]} /><meshLambertMaterial color={iron} side={THREE.DoubleSide} /></mesh>)}
  </group>;
  const Wing: React.FC<{from: number; len: number}> = ({from, len}) => { const s = Math.sign(from), mid = from + s * len / 2; return <group>
    <B p={[mid, 0.35, 0]} s={[len, 0.7, 0.42]} c={brick} /><B p={[mid, 0.74, 0]} s={[len + 0.06, 0.1, 0.52]} c={stone} />
    {[0.68, 0.36].map((y) => <B key={y} p={[mid, y - 0.32, 0.215]} s={[len, 0.02, 0.005]} c="#c08a74" cast={false} />)}
    <B p={[mid, 1.78, 0]} s={[len, 0.05, 0.05]} c={iron} /><B p={[mid, 1.0, 0]} s={[len, 0.04, 0.04]} c={iron} />
    {Array.from({length: Math.floor(len / 0.16)}, (_, i) => <B key={i} p={[from + s * (0.08 + i * 0.16), 1.32, 0]} s={[0.03, 1.08, 0.03]} c={iron} cast={i % 2 === 0} />)}
    <Pier x={from + s * (len + 0.3)} h={2.1} w={0.6} />
  </group>; };
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Pier x={-2.0} lamp /><Pier x={2.0} lamp />
      <Leaf hinge={-1.6} dir={1} /><Leaf hinge={1.6} dir={-1} />
      {wings[0] > 0 ? <Wing from={-2.4} len={wings[0]} /> : null}{wings[1] > 0 ? <Wing from={2.4} len={wings[1]} /> : null}
    </group>
  );
};
/** A paved path from a to b (ground points), width w: stone slabs in perspective, a kerb of pale stone each side. */
export const PavedPath: React.FC<{a: [number, number]; b: [number, number]; w: number; color: string; kerb?: string; seed?: number; y?: number}> = ({a, b, w, color, kerb = '#c9c0ae', seed = 2, y = 0.012}) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ang = Math.atan2(dx, dz), base = useSurface('slabs', seed);
  const map = useMemo(() => { const t = base.clone(); t.needsUpdate = true; t.repeat.set(w / 1.7, L / 1.7); return t; }, [base, w, L]);
  return (
    <group position={[(a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2]} rotation={[0, ang, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[w, L]} /><meshLambertMaterial color={color} map={map} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[k * (w / 2 + 0.09), 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[0.18, L]} /><meshLambertMaterial color={kerb} /></mesh>)}
    </group>
  );
};
/** Fallen leaves on the ground: small five-sided flakes in reds, oranges and a few yellows, denser near the centre. */
export const FallenLeaves: React.FC<{pos: V3; area: [number, number]; n: number; seed?: number; night?: boolean; keep?: [number, number, number][]}> = ({pos, area, n, seed = 3, night, keep = []}) => {
  const items = useMemo(() => { const r = rnd(seed), out: [number, number, number, number, number][] = []; for (let i = 0; i < n * 3 && out.length < n; i++) { const x = (r() - 0.5) * area[0] * (0.5 + r() * 0.5), z = (r() - 0.5) * area[1] * (0.5 + r() * 0.5); if (keep.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr)) continue; out.push([x, z, r() * 6, 0.07 + r() * 0.07, Math.floor(r() * 5)]); } return out; }, [n, seed, area[0], area[1], JSON.stringify(keep)]);
  const cols = night ? ['#5a3a3e', '#6a4038', '#4e3a40', '#6a4a3a', '#5a4a44'] : ['#c8462e', '#d8682e', '#b33a2e', '#e2a23a', '#c85a2a'];
  return <group position={pos}>{items.map(([x, z, a, s, k], i) => <mesh key={i} position={[x, 0.014 + (i % 7) * 0.0004, z]} rotation={[-Math.PI / 2, 0, a]} scale={[s, s * 0.7, 1]}><circleGeometry args={[1, 5]} /><meshLambertMaterial color={cols[k]} /></mesh>)}</group>;
};

// ---------------------------------------------------------------- flat painters (living things and pictures)
export type Pal3 = [string, string, string];
/** A maple: a short forked trunk under a broad crown of lobed clumps, three reds or oranges, a few yellow clumps and dark gaps. */
export const paintMaple = (c: Ctx, W: number, H: number, g: Pal3, trunk: [string, string] = ['#5e4636', '#47342a'], seed = 1) => {
  const u = W / 600, T = (x: number, y: number) => [x * u, H - (720 - y) * u], r = rnd(seed);
  P(c, [T(276, 720), T(326, 720), T(318, 520), T(380, 380), T(356, 372), T(304, 470), T(296, 360), T(272, 360), T(282, 500), T(214, 400), T(196, 412), T(276, 540)], trunk[0]);
  P(c, [T(304, 720), T(326, 720), T(318, 520), T(380, 380), T(356, 372), T(306, 480)], trunk[1]);
  const disc = (x: number, y: number, rad: number, f: string) => { const [a, b] = T(x, y); c.beginPath(); c.arc(a, b, rad * u, 0, 7); c.fillStyle = f; c.fill(); };
  // the crown: many middling clumps (never one big disc), each dark below, mid above, a light cap toward the upper left;
  // small loose leaf flecks round the rim break the outline; a few gaps show the branches
  const clumps: number[][] = [];
  for (let i = 0; i < 46; i++) { const a = r() * Math.PI * 2, d = Math.pow(r(), 0.7); clumps.push([300 + Math.cos(a) * d * 225, 250 + Math.sin(a) * d * 150, 30 + r() * 26]); }
  clumps.sort((p, q) => p[1] - q[1]);
  clumps.forEach(([x, y, q]) => disc(x + 4, y + 10, q * 1.05, g[0]));
  clumps.forEach(([x, y, q], i) => i % 5 !== 0 && disc(x - 2, y - 2, q * 0.86, g[1]));
  clumps.forEach(([x, y, q], i) => (i % 3 === 0 || y < 200) && disc(x - 10, y - 10, q * 0.46, g[2]));
  for (let i = 0; i < 70; i++) { const a = r() * Math.PI * 2, x = 300 + Math.cos(a) * (215 + r() * 40), y = 250 + Math.sin(a) * (140 + r() * 34); disc(x, y, 7 + r() * 8, g[Math.floor(r() * 3)]); }
  [[262, 330], [350, 300], [300, 372]].forEach(([x, y]) => { disc(x, y, 14, g[0]); c.strokeStyle = trunk[1]; c.lineWidth = 9 * u; const [a, b] = T(x - 20, y + 12), [d, e] = T(x + 22, y - 10); c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
};
/** Ivy climbing a wall corner from the ground: wandering stems and clumps of small leaves, thinning toward the top. */
export const paintIvy = (c: Ctx, W: number, H: number, g: string[]) => {
  const r = rnd(12);
  for (let s = 0; s < 5; s++) { let x = W * (0.2 + r() * 0.5), y = H; c.strokeStyle = g[0]; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); const top = H * (0.05 + r() * 0.45); while (y > top) { x += (r() - 0.5) * 50; y -= 30 + r() * 30; c.lineTo(Math.max(10, Math.min(W - 10, x)), y); } c.stroke(); }
  for (let i = 0; i < 260; i++) { const y = H * Math.pow(r(), 0.6), spread = 0.35 + (y / H) * 0.6, x = W * (0.45 + (r() - 0.5) * spread); const q = 7 + r() * 10; c.beginPath(); c.arc(x, y, q, 0, 7); c.fillStyle = g[1 + Math.floor(r() * (g.length - 1))]; c.fill(); }
};
/** A bronze figure on a pedestal: a man in a long coat, the right hand forward with a book held at the chest; three bronze tones. */
export const paintFounder = (c: Ctx, W: number, H: number, t: Pal3) => {
  const u = W / 300, Q = (pts: number[][], f: string) => P(c, pts.map(([x, y]) => [x * u, y * u]), f);
  Q([[96, 600], [102, 380], [84, 250], [110, 196], [190, 196], [216, 250], [204, 380], [212, 600]], t[1]);   // the long coat
  Q([[150, 196], [190, 196], [216, 250], [204, 380], [212, 600], [156, 600], [160, 380]], t[0]);              // its shadow side
  Q([[120, 600], [128, 560], [178, 560], [186, 600]], t[1]);
  Q([[110, 200], [70, 290], [86, 300], [124, 230]], t[0]);                                                     // left arm down
  Q([[188, 204], [230, 260], [214, 280], [178, 236]], t[1]); Q([[204, 248], [244, 236], [250, 262], [214, 280]], t[2]);   // the book
  c.beginPath(); c.ellipse(150 * u, 160 * u, 34 * u, 42 * u, 0, 0, 7); c.fillStyle = t[1]; c.fill();
  c.beginPath(); c.ellipse(140 * u, 152 * u, 22 * u, 30 * u, 0, 0, 7); c.fillStyle = t[2]; c.fill();
  Q([[116, 196], [184, 196], [170, 218], [130, 218]], t[0]);                                                   // collar
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(104 * u, 260 * u, 8 * u, 220 * u);                      // a worn highlight down the coat
};
/** A bicycle side on: two wheels, the frame, saddle and bars. */
export const paintBicycle = (c: Ctx, W: number, H: number, col: string, night?: boolean) => {
  const u = W / 400, ink = night ? '#1c1f26' : '#2a2a2a'; c.lineCap = 'round';
  [[90, 170], [310, 170]].forEach(([x, y]) => { c.strokeStyle = ink; c.lineWidth = 10 * u; c.beginPath(); c.arc(x * u, y * u, 62 * u, 0, 7); c.stroke(); c.strokeStyle = night ? '#4a4e58' : '#9a9a9a'; c.lineWidth = 2 * u; for (let k = 0; k < 6; k++) { const a = k * 0.52; c.beginPath(); c.moveTo((x + Math.cos(a) * 58) * u, (y + Math.sin(a) * 58) * u); c.lineTo((x - Math.cos(a) * 58) * u, (y - Math.sin(a) * 58) * u); c.stroke(); } });
  c.strokeStyle = col; c.lineWidth = 11 * u; c.beginPath(); c.moveTo(90 * u, 170 * u); c.lineTo(170 * u, 90 * u); c.lineTo(285 * u, 90 * u); c.lineTo(310 * u, 170 * u); c.moveTo(170 * u, 90 * u); c.lineTo(200 * u, 172 * u); c.lineTo(285 * u, 90 * u); c.moveTo(90 * u, 170 * u); c.lineTo(200 * u, 172 * u); c.stroke();
  c.strokeStyle = ink; c.lineWidth = 9 * u; c.beginPath(); c.moveTo(160 * u, 70 * u); c.lineTo(198 * u, 70 * u); c.moveTo(285 * u, 90 * u); c.lineTo(280 * u, 56 * u); c.lineTo(250 * u, 52 * u); c.stroke();
};

// ================================================================ the school's notice board (d1c5 shots 19, 20; d1c6 shot 1)
/** THE NOTICE BOARD, standing on the forecourt, its face toward +z. Numbers (metres, local): the board 1.6 wide, its face
 *  from 0.9 to 1.9 high, in a dark oak frame on two square posts sunk in the ground; a small gable roof of shingles over it.
 *  BOARD.sheets = the centres [x, y] of the three result sheets (0.42 x 0.56), BOARD.victorV = where the "Victor" line lies
 *  on each sheet (fraction of its height from the top), BOARD.face = z of the felt. */
export const BOARD = {w: 1.6, y0: 0.9, y1: 1.9, face: 0.035, sheet: [0.42, 0.56] as [number, number], sheets: [[-0.52, 1.39], [0, 1.41], [0.52, 1.38]] as [number, number][], victorV: 0.37, subjects: ['toán', 'vật lí', 'hoá học']};
/** where the star of sheet i sits (local to the board): just after the name on its Victor line, left of the mark */
export const boardStar = (i: number): V3 => { const [x, y] = BOARD.sheets[i]; return [x + BOARD.sheet[0] * 0.14, y + BOARD.sheet[1] * (0.5 - BOARD.victorV) + 0.004, BOARD.face + 0.02]; };
const HANDF = '"Chalkboard SE", "Noteworthy", "Comic Sans MS", cursive';
/** the felt: brown baize with a fibrous nap, a lighter sun-faded band at the top, hundreds of pin holes, pale rectangles
 *  where notices hung for years, torn corners of old notices still pinned, a rusty pin or two */
const feltTex = () => tex('board-felt-2', 1600, 1000, (c, W, H) => {
  const r = rnd(61); c.fillStyle = '#6a4630'; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 6000; k++) { c.fillStyle = r() < 0.5 ? `rgba(40,24,14,${0.1 + r() * 0.15})` : `rgba(150,110,80,${0.08 + r() * 0.12})`; c.fillRect(r() * W, r() * H, 2 + r() * 3, 1 + r() * 2); }
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(0.12, 'rgba(200,160,120,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.1)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 16; k++) { const x = r() * W, y = r() * H, w = 120 + r() * 260, h = 160 + r() * 260; c.fillStyle = `rgba(150,110,80,${0.08 + r() * 0.1})`; c.fillRect(x, y, w, h); }
  for (let k = 0; k < 400; k++) { c.fillStyle = 'rgba(25,14,8,0.7)'; c.beginPath(); c.arc(r() * W, r() * H, 1.6 + r() * 1.4, 0, 7); c.fill(); }
  for (let k = 0; k < 7; k++) { const x = r() * W, y = r() * H; c.fillStyle = '#e6dcc0'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 30 + r() * 30, y + r() * 10); c.lineTo(x + 10, y + 26 + r() * 20); c.closePath(); c.fill(); c.fillStyle = '#7a5a3a'; c.beginPath(); c.arc(x + 8, y + 8, 5, 0, 7); c.fill(); }
});
/** oak with grain and two tones, for the frame and posts */
const oakTex = () => tex('board-oak', 512, 128, (c, W, H) => { const r = rnd(7); c.fillStyle = '#4a3222'; c.fillRect(0, 0, W, H); for (let k = 0; k < 40; k++) { const y = r() * H; c.strokeStyle = r() < 0.5 ? 'rgba(20,10,4,0.35)' : 'rgba(140,100,64,0.25)'; c.lineWidth = 1 + r() * 2; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= W; x += 32) c.lineTo(x, y + Math.sin(x / 60 + k) * 3); c.stroke(); } c.fillStyle = 'rgba(20,10,4,0.5)'; c.beginPath(); c.ellipse(W * 0.7, H * 0.5, 10, 5, 0, 0, 7); c.fill(); });
const shingleTex = () => tex('board-shingles', 512, 256, (c, W, H) => { const r = rnd(9); c.fillStyle = '#5a3f30'; c.fillRect(0, 0, W, H); for (let y = 0, row = 0; y < H; y += 32, row++) for (let x = row % 2 ? -24 : 0; x < W; x += 48) { c.fillStyle = ['#6e4a36', '#5e3e2e', '#76543c', '#4e3426'][Math.floor(r() * 4)]; c.fillRect(x + 1, y, 46, 34); c.fillStyle = 'rgba(20,10,4,0.45)'; c.fillRect(x, y + 28, 48, 4); c.fillRect(x, y, 2, 32); } c.fillStyle = 'rgba(80,110,60,0.35)'; for (let k = 0; k < 20; k++) { c.beginPath(); c.arc(r() * W, H * (0.6 + r() * 0.4), 6 + r() * 10, 0, 7); c.fill(); } });
/** one result sheet: printed heading "KẾT QUẢ THI", the subject hand-written big, six numbered lines of names with marks,
 *  "Victor" first on every sheet; a thumb-smudge, a fold, the paper a little yellow at the edges */
const NAMES = [['Victor', 'A. Weber', 'T. Lowell', 'H. Martin', 'J. Carter', 'E. Brooks'], ['Victor', 'H. Martin', 'A. Weber', 'R. Hayes', 'T. Lowell', 'C. Price'], ['Victor', 'J. Carter', 'C. Price', 'A. Weber', 'E. Brooks', 'R. Hayes']];
const MARKS = [['100', '91', '88', '85', '80', '77'], ['100', '93', '89', '84', '81', '79'], ['100', '90', '87', '83', '82', '78']];
const resultTex = (i: number) => tex(`board-result-${i}`, 840, 1120, (c, W, H) => {
  const r = rnd(70 + i); c.fillStyle = '#f2e9cf'; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 400; k++) { c.fillStyle = `rgba(150,120,70,${0.03 + r() * 0.05})`; c.fillRect(r() * W, r() * H, 3 + r() * 12, 1 + r() * 3); }
  c.fillStyle = '#2a2a3a'; c.font = `bold ${W * 0.07}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('KẾT QUẢ THI', W / 2, H * 0.08);
  c.fillRect(W * 0.12, H * 0.115, W * 0.76, 3);
  c.fillStyle = '#7a2a22'; c.font = `bold ${W * 0.13}px ${HANDF}`; c.fillText(BOARD.subjects[i], W / 2, H * 0.2);
  c.strokeStyle = 'rgba(60,60,90,0.35)'; c.lineWidth = 2; for (let k = 0; k < 6; k++) { const y = H * (BOARD.victorV + k * 0.1 + 0.035); c.beginPath(); c.moveTo(W * 0.08, y); c.lineTo(W * 0.92, y); c.stroke(); }
  NAMES[i].forEach((nm, k) => { const y = H * (BOARD.victorV + k * 0.1); c.textAlign = 'left'; c.fillStyle = k === 0 ? '#1c2440' : '#2e2a2a'; c.font = `${k === 0 ? 'bold ' : ''}${W * (k === 0 ? 0.095 : 0.07)}px ${HANDF}`; c.fillText(`${k + 1}.  ${nm}`, W * 0.1, y); c.textAlign = 'right'; c.fillText(MARKS[i][k], W * 0.9, y); });
  c.fillStyle = 'rgba(70,60,50,0.12)'; c.beginPath(); c.ellipse(W * 0.82, H * 0.93, 40, 26, 0.5, 0, 7); c.fill();
  c.fillStyle = 'rgba(90,70,40,0.12)'; c.fillRect(0, H * 0.5 - 2, W, 4); c.fillStyle = 'rgba(255,252,240,0.25)'; c.fillRect(0, H * 0.5 + 2, W, 4);
  const e = c.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.8); e.addColorStop(0, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(160,120,60,0.3)'); c.fillStyle = e; c.fillRect(0, 0, W, H);
});
/** small notices pinned askew round the edges (hand-written; real words) */
const NOTICES = ['mất một chiếc ô đen,\nai thấy xin trả\nphòng 14', 'học nhóm toán\ntối thứ năm', 'bán sách cũ\ngiá rẻ', 'câu lạc bộ\ncờ vua'];
const noticeTex = (i: number) => tex(`board-notice-${i}`, 400, 300, (c, W, H) => {
  const r = rnd(90 + i); c.fillStyle = ['#efe6c8', '#e4ecd8', '#f0e0d0', '#e8e4f0'][i % 4]; c.fillRect(0, 0, W, H); for (let k = 0; k < 120; k++) { c.fillStyle = `rgba(150,120,70,${0.04 + r() * 0.05})`; c.fillRect(r() * W, r() * H, 4 + r() * 10, 1 + r() * 2); }
  c.fillStyle = '#2e2a30'; c.font = `bold ${W * 0.09}px ${HANDF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; const L = NOTICES[i].split('\n'); L.forEach((t, k) => c.fillText(t, W / 2, H * (0.5 + (k - (L.length - 1) / 2) * 0.24), W * 0.9));
  c.fillStyle = 'rgba(140,100,60,0.18)'; c.fillRect(0, H - 12, W, 12);
});
const starTex = () => tex('board-star', 256, 256, (c, W, H) => { c.clearRect(0, 0, W, H); const g = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2); g.addColorStop(0, 'rgba(255,230,140,0.6)'); g.addColorStop(1, 'rgba(255,230,140,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + (j * Math.PI) / 5, rr = j % 2 ? W * 0.16 : W * 0.38; c.lineTo(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr); } c.closePath(); c.fillStyle = '#f2c230'; c.fill(); c.strokeStyle = '#6a4a14'; c.lineWidth = 10; c.lineJoin = 'round'; c.stroke(); c.fillStyle = 'rgba(255,250,210,0.8)'; c.beginPath(); c.arc(W * 0.44, H * 0.4, 12, 0, 7); c.fill(); });
const pinColors = ['#c8372d', '#e2b13a', '#c8372d', '#3a6ab0', '#e2b13a', '#c8372d'];
const Pin: React.FC<{p: V3; col: string}> = ({p, col}) => <group position={p}><mesh castShadow><cylinderGeometry args={[0.012, 0.014, 0.012, 10]} /><meshLambertMaterial color={col} /></mesh></group>;
const Paper: React.FC<{map: THREE.Texture; x: number; y: number; w: number; h: number; z: number; rot?: number; pins?: number; seed?: number}> = ({map, x, y, w, h, z, rot = 0, pins = 2, seed = 0}) => (
  <group position={[x, y, z]} rotation={[0, 0, rot]}>
    <mesh receiveShadow castShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={map} side={THREE.DoubleSide} /></mesh>
    {(pins === 4 ? [[-1, 1], [1, 1], [-1, -1], [1, -1]] : pins === 1 ? [[0, 1]] : [[-1, 1], [1, 1]]).map(([a, b], k) => <group key={k} rotation={[Math.PI / 2, 0, 0]} position={[a * (w / 2 - 0.03), b * (h / 2 - 0.03), 0.008]}><Pin p={[0, 0, 0]} col={pinColors[(seed + k) % pinColors.length]} /></group>)}
  </group>
);
/** THE NOTICE BOARD (see BOARD). stars = the frames at which the gold star of sheet 0, 1, 2 pops out at its Victor line
 *  (with a bounce; the line glows a little); f = the frame (for the pops and a slow shimmer of the stars). Leave stars
 *  empty for the board at rest. */
export const NoticeBoard: React.FC<{pos: V3; rotY?: number; f?: number; stars?: number[]}> = ({pos, rotY = 0, f = 0, stars = []}) => {
  const {w, y0, y1, face} = BOARD, H = y1 - y0, cy = (y0 + y1) / 2, oak = oakTex();
  const pop = (at: number) => { const t = (f - at) / 6; if (t < 0) return 0; if (t >= 1) return 1; return t < 0.45 ? (t / 0.45) * 1.35 : 1 + 0.35 * Math.cos(((t - 0.45) / 0.55) * Math.PI * 1.5) * (1 - (t - 0.45) / 0.55); };
  return <group position={pos} rotation={[0, rotY, 0]}>
    {/* posts sunk in the ground: a tuft and a stone at each foot */}
    {[-1, 1].map((k) => <group key={k} position={[k * (w / 2 + 0.06), 0, 0]}>
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow><boxGeometry args={[0.09, 2.3, 0.09]} /><meshLambertMaterial map={oak} /></mesh>
      <B p={[0, 0.03, 0]} s={[0.16, 0.06, 0.16]} c="#8a8478" /><B p={[0.08 * k, 0.04, 0.09]} s={[0.1, 0.08, 0.08]} c="#9a938a" r={[0, 0.5, 0]} />
      <ContactShade r={0.25} strength={0.35} />
    </group>)}
    {/* the frame and the back board */}
    <B p={[0, cy, -0.02]} s={[w + 0.08, H + 0.08, 0.04]} c="#3e2a1c" />
    <mesh position={[0, cy, face]} receiveShadow><planeGeometry args={[w, H]} /><meshLambertMaterial map={feltTex()} /></mesh>
    {[[0, y1 + 0.03, w + 0.16, 0.07], [0, y0 - 0.03, w + 0.16, 0.07]].map(([x, y, ww, hh], k) => <mesh key={k} position={[x, y, 0.03]} castShadow receiveShadow><boxGeometry args={[ww, hh, 0.07]} /><meshLambertMaterial map={oak} /></mesh>)}
    {[-1, 1].map((k) => <mesh key={k} position={[k * (w / 2 + 0.035), cy, 0.03]} castShadow receiveShadow><boxGeometry args={[0.07, H + 0.1, 0.07]} /><meshLambertMaterial map={oak} /></mesh>)}
    <B p={[0, y0 - 0.075, 0.07]} s={[w + 0.1, 0.025, 0.1]} c="#4a3222" />
    {/* the little gable roof: two shingled boards, a ridge, its shadow falls on the top of the felt */}
    {[-1, 1].map((k) => <mesh key={k} position={[0, y1 + 0.2, 0.02 + k * 0.13]} rotation={[k * -0.62, 0, 0]} castShadow receiveShadow><boxGeometry args={[w + 0.36, 0.035, 0.34]} /><meshLambertMaterial map={shingleTex()} /></mesh>)}
    <B p={[0, y1 + 0.3, 0.02]} s={[w + 0.4, 0.05, 0.06]} c="#3a2618" />
    {[-1, 1].map((k) => <B key={k} p={[k * (w / 2 + 0.06), y1 + 0.12, 0.02]} s={[0.05, 0.22, 0.05]} c="#3e2a1c" />)}
    {/* the three result sheets, a little crooked, and the small notices at the edges */}
    {BOARD.sheets.map(([x, y], i) => <Paper key={i} map={resultTex(i)} x={x} y={y} w={BOARD.sheet[0]} h={BOARD.sheet[1]} z={face + 0.004 + i * 0.001} rot={[-0.02, 0.012, -0.03][i]} pins={4} seed={i} />)}
    <Paper map={noticeTex(0)} x={-0.66} y={1.78} w={0.22} h={0.16} z={face + 0.009} rot={0.08} pins={1} seed={1} />
    <Paper map={noticeTex(1)} x={0.69} y={1.79} w={0.2} h={0.15} z={face + 0.009} rot={-0.06} pins={1} seed={3} />
    <Paper map={noticeTex(2)} x={-0.27} y={1.02} w={0.18} h={0.13} z={face + 0.009} rot={-0.1} pins={1} seed={4} />
    <Paper map={noticeTex(3)} x={0.29} y={1.0} w={0.18} h={0.13} z={face + 0.01} rot={0.12} pins={1} seed={5} />
    {/* the stars and the glow on each Victor line */}
    {stars.map((at, i) => { const s = pop(at), [x, y] = BOARD.sheets[i], ly = y + BOARD.sheet[1] * (0.5 - BOARD.victorV), glow = Math.min(1, Math.max(0, (f - at) / 4)) * (0.8 + 0.2 * Math.sin(f * 0.3 + i)); if (s <= 0) return null;
      return <group key={i}>
        <Halo pos={[x - BOARD.sheet[0] * 0.06, ly, face + 0.016]} r={BOARD.sheet[0] * 0.5} color="#fff2a8" strength={0.45 * glow} order={5} />
        <mesh position={boardStar(i)} scale={[s, s, 1]} rotation={[0, 0, Math.sin(f * 0.15 + i) * 0.12]} renderOrder={6}><planeGeometry args={[0.095, 0.095]} /><meshBasicMaterial map={starTex()} transparent depthWrite={false} toneMapped={false} /></mesh>
      </group>; })}
  </group>;
};

/** DAPPLED SHADE ON THE GROUND: the soft shadow of a tree standing out of frame, lying flat on the lawn: a ragged mass of
 *  leaf clusters with sun holes through it, softer at the edges, stretched along the light (len along x). Breaks up a wide
 *  flat lawn in a low-sun shot. Use 0.25 to 0.4 opacity; night = a cooler, fainter shade. */
export const GroundShade: React.FC<{pos: V3; size: [number, number]; rotY?: number; seed?: number; opacity?: number; color?: string}> = ({pos, size, rotY = 0, seed = 1, opacity = 0.32, color = '#2a2418'}) => {
  const t = tex(`ground-shade-${seed}`, 1024, 512, (c, W, H) => {
    const r = rnd(seed * 17 + 3); c.clearRect(0, 0, W, H); c.filter = 'blur(10px)'; c.fillStyle = '#fff';
    for (let k = 0; k < 90; k++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()), x = W / 2 + Math.cos(a) * d * W * 0.4, y = H / 2 + Math.sin(a) * d * H * 0.36; c.beginPath(); c.ellipse(x, y, 30 + r() * 60, 18 + r() * 36, r() * 3, 0, 7); c.fill(); }
    c.filter = 'blur(4px)'; c.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 70; k++) { c.beginPath(); c.ellipse(W * (0.15 + r() * 0.7), H * (0.15 + r() * 0.7), 6 + r() * 16, 4 + r() * 10, r() * 3, 0, 7); c.fill(); }
    c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  });
  return <mesh position={[pos[0], 0.045, pos[2]]} rotation={[-Math.PI / 2, 0, rotY]} renderOrder={1}><planeGeometry args={size} /><meshBasicMaterial map={t} color={color} transparent opacity={opacity} depthWrite={false} /></mesh>;
};
