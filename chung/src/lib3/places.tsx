import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Scene3, Ground, FacetLathe, GRADES, Grade} from './look';
import {useSurface, useWear, Studs, Scatter} from './detail';
import {Facade, Stall, Bunting} from './town';
import {Foliage, Pic2D} from './flat';
import {Tent, Campfire, Wagon, Headstone, Snowfall, SnowPine, Boulder, SnowField} from './nature';
import {Halo} from './look';

/** lib3/places: whole PLACES built by rule from a few words of description, so a shot sheet can say
 *  {kind: 'street', centre: {name: 'Bakery', wares: [...]}, shops: ['Books', 'Cafe']} and get a staged, filled, lit set.
 *  Every place puts its focus (what the cast attends to) at FOCUS and leaves the ground in front of it free. */
type V3 = [number, number, number];
export const FOCUS: [number, number] = [0.1, -0.9];
const rnd = (seed: number) => { let s = seed * 9301 + 49297; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
export type Wares = [string, number][];   // [picture under public/, width in the world]
export type StreetSpec = {kind: 'street'; grade?: Grade; seed?: number; centre: {name: string; wares: Wares; shelf?: Wares; body?: string; awning?: [string, string]}; shops?: string[]; loose?: Wares};

// house fronts a street draws from: wall colour, material, shutters, trim
const FRONTS: {color: string; kind: 'brick' | 'stone' | 'plaster'; shutters: string; trim?: string}[] = [
  {color: '#c9b48c', kind: 'plaster', shutters: '#3f6a58'}, {color: '#a8523d', kind: 'brick', shutters: '#2f4a6a'}, {color: '#d9cdb4', kind: 'stone', shutters: '#8a3a30', trim: '#8a6a4a'},
  {color: '#9a5a48', kind: 'brick', shutters: '#3a3f4a'}, {color: '#b8c0b0', kind: 'plaster', shutters: '#7a4a3a'}, {color: '#c8a070', kind: 'stone', shutters: '#3f5a7a'},
];
const AWN: [string, string][] = [['#3f6a8a', '#f1ead8'], ['#5a8f5a', '#f1ead8'], ['#b9863a', '#f1ead8']];

/** A street or square by day: a row of four house fronts (taller than the frame, each its own colour, material and
 *  height, some with a shop sign and awning), a further row closing the sky, the centre stall, edge props (bin, lamp,
 *  planter with a clipped bush, a tree), loose produce, bunting and ground dressing. keep = where the cast stands. */
export const Street: React.FC<{spec: StreetSpec; gain?: number; keep?: [number, number, number][]; children?: React.ReactNode}> = ({spec, gain = 1, keep = [], children}) => {
  const grade = spec.grade ?? 'dayExterior', seed = spec.seed ?? 1, {scene} = useThree();
  scene.background = useMemo(() => new THREE.Color(GRADES[grade].bg), [grade]);
  const cobbles = useSurface('stone', 5 + seed), gwear = useWear(4 + seed, 0.5, false);
  const fronts = useMemo(() => { const r = rnd(seed), o = Math.floor(r() * FRONTS.length), xs = [-6.3, -1.7, 3.2, 7.9], shops = spec.shops ?? [];
    return xs.map((x, i) => ({x, z: i % 2 ? -4.6 : -4.2, w: 4.5 + r() * 0.4, h: 7 + r() * 1.1, cols: 2 + (r() < 0.35 ? 1 : 0), floors: 2 + (r() < 0.5 ? 1 : 0), f: FRONTS[(o + i) % FRONTS.length], sign: i === 0 ? shops[0] : i === 2 ? shops[1] : undefined, awning: i === 1 || i === 2 ? AWN[(o + i) % AWN.length] : undefined, seed: seed * 7 + i})); }, [seed, JSON.stringify(spec.shops)]);
  const loose = spec.loose ?? [];
  return (
    <Scene3 grade={grade} gain={gain}>
      <Ground near="#bdb6a8" far="#9c968c" size={[60, 40]} swell={0.01} patch={0.05} farAt={0.6} pos={[0, 0, -8]} map={cobbles} tile={1.1} wear={gwear} />
      <Facade pos={[0.8, 0, -7.5]} w={18} h={11} color="#b9a48c" kind="plaster" cols={7} floors={4} seed={seed + 8} />
      {fronts.map((q) => <Facade key={q.x} pos={[q.x, 0, q.z]} w={q.w} h={q.h} color={q.f.color} kind={q.f.kind} trim={q.f.trim} shutters={q.f.shutters} cols={q.cols} floors={q.floors} seed={q.seed} sign={q.sign} awning={q.awning} />)}
      <Stall pos={[FOCUS[0], 0, FOCUS[1]]} w={3.4} name={spec.centre.name} seed={seed + 1} pics={spec.centre.wares} shelf={spec.centre.shelf} body={spec.centre.body} awning={spec.centre.awning} />
      {/* edge props, the same kinds on every street: a bin, a lamp post, a planter with a clipped bush, a tree */}
      <FacetLathe profile={[[0.3, 0], [0.34, 0.08], [0.36, 0.86], [0.4, 0.9], [0.4, 0.98], [0.26, 1.04]]} color="#3f6a58" pos={[-3.4, 0, 0.6]} tones={[0.8, 1, 1.18, 1.18, 0.9]} />
      <Studs pos={[-3.4, 0, 0.6]} r={0.365} y={0.8} n={12} />
      <FacetLathe profile={[[0.16, 0], [0.16, 0.12], [0.07, 0.2], [0.055, 2.9], [0.1, 2.96]]} sides={8} color="#2f3440" pos={[3.5, 0, -0.2]} />
      <FacetLathe profile={[[0.1, 2.96], [0.2, 3.02], [0.17, 3.32], [0.06, 3.4]]} sides={6} color="#f3e2a6" pos={[3.5, 0, -0.2]} contact={false} />
      <mesh position={[-3.7, 0.3, -1.0]} castShadow receiveShadow><boxGeometry args={[0.9, 0.6, 0.7]} /><meshLambertMaterial color="#b9a184" /></mesh>
      <Foliage pos={[-3.7, 0.55, -0.95]} w={1.0} h={1.9} shape="column" seed={seed + 2} />
      <mesh position={[4.3, 1.6, -2.4]} castShadow><boxGeometry args={[0.22, 3.2, 0.22]} /><meshLambertMaterial color="#5a4030" /></mesh>
      <Foliage pos={[4.3, 2.3, -2.3]} w={3.6} h={3.2} seed={seed + 5} />
      {/* loose produce on the ground by the stall, alternating sides */}
      {loose.map(([src, w], i) => <Pic2D key={i} src={src} w={w} pos={[i % 2 ? 2.75 : -2.6 - (i >> 1) * 0.45, i % 2 ? 0.44 : 0, i % 2 ? -0.55 : 0.3 + (i >> 1) * 0.25]} flip={i % 4 === 2} />)}
      <Bunting a={[-7, 5.6, -3.8]} b={[7.5, 5.8, -3.8]} sag={1.0} n={26} />
      <Scatter kind="street" area={[11, 3.4]} pos={[0, 0, 1.5]} seed={10 + seed} density={1.5} keep={keep} />
      {children}
    </Scene3>
  );
};
const Flat2: React.FC<{pts: [number, number][]; c: string; pos: V3}> = ({pts, c, pos}) => { const geo = useMemo(() => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); return new THREE.ShapeGeometry(sh); }, [JSON.stringify(pts)]); return <mesh geometry={geo} position={pos}><meshBasicMaterial color={c} /></mesh>; };
const Stars: React.FC<{seed: number}> = ({seed}) => { const pts = useMemo(() => { const r = rnd(seed); return Array.from({length: 60}, () => [(r() - 0.5) * 90, 9 + r() * 26, 0.12 + r() * 0.16] as const); }, [seed]); return <>{pts.map(([x, y, sz], i) => <mesh key={i} position={[x, y, -44]} rotation={[0, 0, Math.PI / 4]}><planeGeometry args={[sz, sz]} /><meshBasicMaterial color="#e8ecff" /></mesh>)}</>; };

export type CampSpec = {kind: 'camp'; grade?: Grade; seed?: number};
/** A travellers' camp at night: the campfire at the focus, lit tents and a wagon behind, lantern posts with halos, pines and
 *  two rows of hills, stars. The fire warms the ground and the nearest pieces (rule G35). */
export const Camp: React.FC<{spec: CampSpec; gain?: number; f?: number; keep?: [number, number, number][]; children?: React.ReactNode}> = ({spec, gain = 1, f = 0, keep = [], children}) => {
  const grade = spec.grade ?? 'nightExterior', seed = spec.seed ?? 1, {scene} = useThree();
  scene.background = useMemo(() => new THREE.Color(GRADES[grade].bg), [grade]);
  return (
    <Scene3 grade={grade} gain={gain}>
      <Stars seed={seed} />
      <Flat2 pts={[[-50, 0], [-50, 9], [-30, 15], [-14, 8], [2, 16], [20, 8], [36, 14], [50, 9], [50, 0]]} c="#2c3358" pos={[0, 0, -40]} />
      <Flat2 pts={[[-50, 0], [-50, 5], [-26, 9], [-8, 4], [10, 9], [30, 5], [50, 8], [50, 0]]} c="#353d66" pos={[0, 0, -32]} />
      <Ground near="#59675a" far="#39445a" size={[70, 46]} swell={0.05} patch={0.07} farAt={0.5} pos={[0, 0, -8]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[FOCUS[0], 0.01, FOCUS[1] + 0.2]} receiveShadow><circleGeometry args={[2.6, 9]} /><meshLambertMaterial color="#6f6558" /></mesh>
      <Campfire pos={[FOCUS[0], 0, FOCUS[1]]} f={f} seed={seed} />
      <Tent pos={[-4.6, 0, -3.6]} lit /><Tent pos={[4.4, 0, -4.4]} s={0.9} lit color="#a88a70" /><Tent pos={[-9.5, 0, -6.5]} s={0.85} color="#9a8a78" /><Tent pos={[0.4, 0, -8]} s={0.8} lit />
      <Wagon pos={[8.6, 0, -3.2]} rotY={-0.25} />
      {[[-2.6, -2.2], [2.9, -2.4]].map(([x, z], i) => <group key={i} position={[x, 0, z]}>
        <mesh position={[0, 1.2, 0]} castShadow><boxGeometry args={[0.09, 2.4, 0.09]} /><meshLambertMaterial color="#2a211c" /></mesh>
        <mesh position={[0, 2.5, 0.1]}><boxGeometry args={[0.24, 0.34, 0.24]} /><meshBasicMaterial color="#ffdc8c" /></mesh><Halo pos={[0, 2.5, 0.3]} r={0.9} /></group>)}
      {[[-13, -11, 5.5], [-7, -12, 6.5], [-2.5, -13, 5.2], [3, -12.5, 6.8], [8, -11, 5.6], [13, -10, 6.2]].map(([x, z, h], i) => <SnowPine key={i} pos={[x, 0, z]} h={h} snow="#3c5650" dark="#263a3c" />)}
      <mesh position={[-6.2, 0.35, -1.6]} castShadow receiveShadow><boxGeometry args={[0.7, 0.7, 0.7]} /><meshLambertMaterial color="#8a6238" /></mesh>
      <FacetLathe profile={[[0.34, 0], [0.38, 0.3], [0.38, 0.8], [0.33, 0.9]]} sides={12} color="#70492a" pos={[-5.2, 0, -1.0]} />
      <Scatter kind="meadow" area={[12, 4]} pos={[0, 0, 1.4]} seed={seed + 3} density={0.8} keep={[...keep, [FOCUS[0], FOCUS[1], 2.4]]} />
      {children}
    </Scene3>
  );
};

export type SnowSpec = {kind: 'snow'; grade?: Grade; seed?: number; grave?: {name: string; years?: string}};
/** A winter clearing: a rolling snow field, snow-laden pines, boulders, dry tufts, a mauve hill and a slate ridge, falling
 *  snow. With `grave`, a headstone stands at the focus; otherwise a big boulder marks it. */
export const Snow: React.FC<{spec: SnowSpec; gain?: number; f?: number; keep?: [number, number, number][]; children?: React.ReactNode}> = ({spec, gain = 1, f = 0, keep = [], children}) => {
  const grade = spec.grade ?? 'snowExterior', seed = spec.seed ?? 1, {scene} = useThree(), r = useMemo(() => rnd(seed), [seed]);
  scene.background = useMemo(() => new THREE.Color(GRADES[grade].bg), [grade]);
  const hill = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(-9, 0); sh.absellipse(-1.5, 0, 7.5, 5.6, Math.PI, 0, true); return new THREE.ShapeGeometry(sh, 40); }, []);
  const drifts = useMemo(() => { const q = rnd(seed + 40); return Array.from({length: 16}, () => { const z = 3 - q() * 11; return [(q() - 0.5) * 20, z, 0.5 + q() * 0.8, (q() - 0.5) * 0.5, Math.min(1, Math.max(0, (2 - z) / 11))] as const; }); }, [seed]);
  const mix = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
  const pines = useMemo(() => [[-7.5, -9, 6.2], [-3.4, -12, 7.2], [1.6, -11, 6.4], [5.2, -9.5, 7.4], [9.5, -12, 6], [-11, -13, 5.6], [12.5, -8.5, 5.2]].map(([x, z, h]) => [x + (r() - 0.5), z, h * (0.9 + r() * 0.2)]), [r]);
  return (
    <Scene3 grade={grade} gain={gain}>
      <mesh geometry={hill} position={[3 - seed, 0.2, -24]}><meshBasicMaterial color="#a69cab" /></mesh>
      <Flat2 pts={[[-40, 0], [-40, 3], [-22, 7], [-9, 3.4], [4, 8], [15, 4.4], [28, 7.5], [40, 4], [40, 0]]} c="#5c6283" pos={[0, 0.2, -21]} />
      <Flat2 pts={[[-22, 7], [-9, 3.4], [-11, 3.2], [-21, 5.8]]} c="#dfe2ee" pos={[0, 0.2, -20.9]} /><Flat2 pts={[[4, 8], [15, 4.4], [13, 4.2], [5, 6.6]]} c="#dfe2ee" pos={[0, 0.2, -20.9]} />
      <Flat2 pts={[[-46, 0], [-46, 6], [-30, 13], [-20, 8], [-8, 15], [6, 9], [18, 14], [32, 8], [46, 12], [46, 0]]} c="#777b9b" pos={[0, 0.2, -30]} />
      <Flat2 pts={[[-30, 13], [-26, 10.6], [-33, 10.9]]} c="#c6cade" pos={[0, 0.2, -29.9]} /><Flat2 pts={[[-8, 15], [-4, 12.2], [-12, 12]]} c="#c6cade" pos={[0, 0.2, -29.9]} /><Flat2 pts={[[18, 14], [22, 11.4], [14, 11.2]]} c="#c6cade" pos={[0, 0.2, -29.9]} />
      {/* a far tree line in two flat tones between the ridge and the pines */}
      <Flat2 pts={[[-30, 0], ...Array.from({length: 41}, (_, i) => [-30 + i * 1.5, i % 2 ? 4.6 + ((i * 7) % 5) * 0.5 : 1.6] as [number, number]), [30, 0]]} c="#4a5373" pos={[0, 0.2, -18]} />
      <Flat2 pts={[[-30, 0], ...Array.from({length: 31}, (_, i) => [-30 + i * 2, i % 2 ? 3.4 + ((i * 5) % 4) * 0.5 : 1.2] as [number, number]), [30, 0]]} c="#3d4a5e" pos={[1, 0.2, -15.5]} />
      <SnowField pos={[0, 0, -8]} />
      {/* the ground is never bare (reference snow grounds: drifts, prints, tufts, stones): drifts with a shaded side, a trail of footprints to the focus */}
      {drifts.map(([x, z, r0, rot, t], i) => <group key={i} position={[x, 0, z]} rotation={[0, rot, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[r0 * 0.16, 0.011, -r0 * 0.07]} scale={[1, 0.36, 1]} receiveShadow><circleGeometry args={[r0, 40]} /><meshLambertMaterial color={mix('#aab1c6', '#8e96ae', t)} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]} scale={[1, 0.36, 1]} receiveShadow><circleGeometry args={[r0, 40]} /><meshLambertMaterial color={mix('#d8dde8', '#b2b9cd', t)} /></mesh></group>)}
      {Array.from({length: 16}, (_, i) => { const u = i / 15, x = 2.6 - u * 1.6 + (i % 2 ? 0.13 : -0.13), z = 4.6 - u * 4.6; return <mesh key={i} rotation={[-Math.PI / 2, 0, 0.3]} position={[FOCUS[0] + x, 0.017, FOCUS[1] + z]} scale={[0.6, 1, 1]}><circleGeometry args={[0.085, 10]} /><meshBasicMaterial color="#8d95ad" transparent opacity={0.75} depthWrite={false} /></mesh>; })}
      <SnowPine pos={[-6.9, 0, -4.8]} h={3.4} /><SnowPine pos={[7.3, 0, -5.6]} h={3.0} /><SnowPine pos={[-10, 0, -6.8]} h={4.3} /><SnowPine pos={[10.4, 0, -3.6]} h={2.6} />
      {pines.map(([x, z, h], i) => <SnowPine key={i} pos={[x, 0, z]} h={h} />)}
      {spec.grave ? <Headstone pos={[FOCUS[0], 0, FOCUS[1]]} name={spec.grave.name} years={spec.grave.years} /> : <Boulder pos={[FOCUS[0] - 0.4, 0, FOCUS[1] - 2.0]} s={0.7} seed={seed} />}
      <Boulder pos={[-3.6, 0, -2.6]} s={0.55} seed={seed + 2} /><Boulder pos={[3.9, 0, -3.4]} s={0.7} seed={seed + 4} /><Boulder pos={[-5.5, 0, 0.6]} s={0.34} seed={seed + 6} />
      <Scatter kind="snow" area={[13, 5]} pos={[0, 0, 1.0]} seed={seed + 1} density={1.9} keep={[...keep, [FOCUS[0], FOCUS[1], 1.3]]} />
      <Snowfall f={f} seed={seed} />
      {children}
    </Scene3>
  );
};
export type PlaceSpec = StreetSpec | CampSpec | SnowSpec;
export const Place: React.FC<{spec: PlaceSpec; gain?: number; f?: number; keep?: [number, number, number][]; children?: React.ReactNode}> = ({spec, ...p}) =>
  spec.kind === 'camp' ? <Camp spec={spec} {...p} /> : spec.kind === 'snow' ? <Snow spec={spec} {...p} /> : <Street spec={spec} gain={p.gain} keep={p.keep}>{p.children}</Street>;
