import React from 'react';
import * as THREE from 'three';
import {FacetLathe} from './look';
import {Wall, Sign, Awning, Paper} from './detail';
import {Foliage, WareRow, PicRow} from './flat';

/** lib3/town: staging in DEPTH for any street, square or yard, by rule (first blend test: "the studio stacks two or three
 *  layers and fills the frame edge to edge; buildings fill the top of the frame and sky barely shows").
 *  Layers, back to front: a row of facades taller than the frame, a central set piece the characters stand in front of,
 *  foreground props at the frame edges, and something strung across the top (bunting). */
type V3 = [number, number, number];
const rnd = (seed: number) => { let s = seed * 9301 + 49297; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

/** One window on a wall (wall units): frame, glass with two glints, glazing bars, sill, optional shutters and flower box. */
const Window: React.FC<{x: number; y: number; w?: number; h?: number; trim: string; shutters?: string; flowers?: boolean; lit?: boolean}> = ({x, y, w = 0.8, h = 1.1, trim, shutters, flowers, lit}) => (
  <group position={[x, y, 0]}>
    <mesh position={[0, 0, 0.07]} castShadow><boxGeometry args={[w + 0.18, h + 0.18, 0.14]} /><meshLambertMaterial color={trim} /></mesh>
    <mesh position={[0, 0, 0.142]}><planeGeometry args={[w, h]} /><meshLambertMaterial color={lit ? '#f3d98a' : '#2f3f5c'} /></mesh>
    <mesh position={[0, h * 0.36, 0.146]}><planeGeometry args={[w, h * 0.28]} /><meshBasicMaterial color="#000000" transparent opacity={0.22} /></mesh>
    <mesh position={[0, 0, 0.155]}><boxGeometry args={[0.045, h, 0.02]} /><meshLambertMaterial color={trim} /></mesh>
    <mesh position={[0, h * 0.12, 0.155]}><boxGeometry args={[w, 0.045, 0.02]} /><meshLambertMaterial color={trim} /></mesh>
    <mesh position={[0, -h / 2 - 0.1, 0.16]} castShadow><boxGeometry args={[w + 0.34, 0.08, 0.32]} /><meshLambertMaterial color={trim} /></mesh>
    {shutters ? [-1, 1].map((k) => <group key={k} position={[k * (w / 2 + 0.26), 0, 0.06]} rotation={[0, -k * 0.22, 0]}><mesh castShadow><boxGeometry args={[0.36, h + 0.1, 0.07]} /><meshLambertMaterial color={shutters} /></mesh>{[-0.3, 0, 0.3].map((d) => <mesh key={d} position={[0, d * h, 0.037]}><planeGeometry args={[0.26, 0.03]} /><meshBasicMaterial color="#000000" transparent opacity={0.18} /></mesh>)}</group>) : null}
    {flowers ? <group position={[0, -h / 2 - 0.02, 0.2]}><mesh castShadow><boxGeometry args={[w + 0.1, 0.16, 0.18]} /><meshLambertMaterial color="#7a5a3a" /></mesh><Foliage pos={[0, 0.06, 0.02]} w={w} h={0.3} color="#4f8a4a" seed={Math.round(x * 7 + y * 3)} />{[-0.3, -0.08, 0.14, 0.32].map((d, i) => <mesh key={d} position={[d * w, 0.26 + (i % 2) * 0.05, 0.03]}><circleGeometry args={[0.045, 10]} /><meshLambertMaterial color={['#e0566a', '#f2c84a', '#f2f2f2', '#e0566a'][i]} /></mesh>)}</group> : null}
  </group>
);

/** A house front of any colour and material: floors x cols windows by rule, a door or shop front on the ground floor,
 *  cornice, optional gable roof. Stand several side by side, each a different colour and height, to close the frame. */
export const Facade: React.FC<{pos?: V3; w: number; h: number; color: string; kind?: 'brick' | 'stone' | 'plaster'; trim?: string; shutters?: string; cols?: number; floors?: number; roof?: string; sign?: string; awning?: [string, string]; seed?: number; door?: string}> =
  ({pos = [0, 0, 0], w, h, color, kind = 'brick', trim = '#efe6d2', shutters, cols = 2, floors = 2, roof, sign, awning, seed = 1, door = '#5a3d2c'}) => {
    const r = rnd(seed), fh = (h - 2.9) / Math.max(1, floors);
    return (
      <group position={pos}>
        <Wall w={w} h={h} color={color} kind={kind} seed={seed} trim={trim}>
          {/* ground floor: a door and a shop window, or a sign and awning over them */}
          <mesh position={[-w * 0.26, 1.05, 0.03]}><boxGeometry args={[1.0, 2.1, 0.06]} /><meshLambertMaterial color={trim} /></mesh>
          <mesh position={[-w * 0.26, 1.0, 0.065]}><planeGeometry args={[0.82, 1.92]} /><meshLambertMaterial color={door} /></mesh>
          <mesh position={[-w * 0.26 + 0.28, 1.0, 0.08]}><sphereGeometry args={[0.04, 8, 6]} /><meshLambertMaterial color="#d8c27a" /></mesh>
          <Window x={w * 0.2} y={1.35} w={Math.min(1.7, w * 0.36)} h={1.25} trim={trim} />
          {sign ? <Sign text={sign} x={0} y={2.62} w={Math.min(w * 0.8, 3)} h={0.46} /> : null}
          {awning ? <Awning x={w * 0.2} y={2.3} w={Math.min(2.2, w * 0.45)} a={awning[0]} b={awning[1]} /> : null}
          {Array.from({length: floors}, (_, f) => Array.from({length: cols}, (_, c) => <Window key={`${f}-${c}`} x={-w / 2 + (w * (c + 0.5)) / cols} y={2.9 + fh * (f + 0.5)} trim={trim} shutters={shutters} flowers={r() < 0.45} lit={r() < 0.12} />))}
          <mesh position={[0, 2.86, 0.09]} castShadow><boxGeometry args={[w + 0.06, 0.12, 0.2]} /><meshLambertMaterial color={trim} /></mesh>
          {/* corner posts and, on plaster, timber beams: raised pieces that give the wall real depth */}
          {[-1, 1].map((k) => <mesh key={k} position={[k * (w / 2 - 0.09), h / 2, 0.06]} castShadow><boxGeometry args={[0.18, h, 0.12]} /><meshLambertMaterial color={kind === 'plaster' ? '#5a4030' : trim} /></mesh>)}
          {kind === 'plaster' ? Array.from({length: floors}, (_, f) => <mesh key={f} position={[0, 2.9 + fh * (f + 1) - 0.06, 0.06]} castShadow><boxGeometry args={[w, 0.14, 0.12]} /><meshLambertMaterial color="#5a4030" /></mesh>) : null}
          {r() < 0.6 ? <Paper x={-w * 0.02} y={1.5} w={0.34} h={0.46} seed={seed} rot={r() * 8 - 4} /> : null}
        </Wall>
        {roof ? <mesh position={[0, h + 0.55, -0.6]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 1]}><boxGeometry args={[w * 0.72, w * 0.72, 1.4]} /><meshLambertMaterial color={roof} /></mesh> : null}
      </group>
    );
  };

/** The central set piece of a street scene: a stall with a counter, posts, a striped awning, a name board and goods laid
 *  out in rows. goods = colours of the wares (loaves, fruit, jars: small turned solids). */
export const Stall: React.FC<{pos?: V3; w?: number; name?: string; body?: string; awning?: [string, string]; goods?: string[]; wares?: import('./flat').Ware[]; pics?: [string, number][]; shelf?: [string, number][]; seed?: number}> =
  ({pos = [0, 0, 0], w = 3.2, name = 'MARKET', body = '#2f5a48', awning = ['#c8463c', '#f1ead8'], goods = ['#c98a4a', '#e0b04a', '#b9523c', '#7fa650'], wares = ['loaf', 'buns', 'roundLoaf', 'cake', 'jar', 'jug'], pics, shelf, seed = 1}) => {
    return (
      <group position={pos}>
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow><boxGeometry args={[w, 1.0, 0.9]} /><meshLambertMaterial color={body} /></mesh>
        <mesh position={[0, 1.03, 0.04]} castShadow><boxGeometry args={[w + 0.16, 0.07, 1.06]} /><meshLambertMaterial color="#e9dfc6" /></mesh>
        {[-1, 1].map((k) => <mesh key={k} position={[k * (w / 2 - 0.08), 1.75, -0.36]} castShadow><boxGeometry args={[0.09, 1.5, 0.09]} /><meshLambertMaterial color="#3a2c22" /></mesh>)}
        <mesh position={[0, 1.7, -0.42]} receiveShadow><boxGeometry args={[w, 1.4, 0.06]} /><meshLambertMaterial color="#d8caa8" /></mesh>
        {/* two shelves on the back board, stocked with the same kind of wares as the counter (never abstract blocks) */}
        {[1.5, 1.98].map((y, j) => <group key={y}><mesh position={[0, y, -0.3]} castShadow><boxGeometry args={[w - 0.3, 0.05, 0.22]} /><meshLambertMaterial color="#8a6a48" /></mesh>
          {shelf ? <PicRow from={[-w / 2 + 0.3, y + 0.025, -0.28]} to={[w / 2 - 0.3, y + 0.025, -0.28]} items={j ? shelf : [...shelf].reverse()} seed={seed + 7 + j} /> : <WareRow from={[-w / 2 + 0.3, y + 0.025, -0.28]} to={[w / 2 - 0.3, y + 0.025, -0.28]} kinds={j ? ['bottle', 'jar', 'jug'] : ['jar', 'bottle', 'cheese']} seed={seed + j} size={0.26} />}</group>)}
        <group position={[0, 2.5, -0.42]}><Awning x={0} y={0} w={w + 0.3} depth={1.2} drop={0.4} a={awning[0]} b={awning[1]} /><Sign text={name} x={0} y={0.36} w={w * 0.6} h={0.4} z={0.04} /></group>
        <Sign text="" x={0} y={0.52} w={w * 0.7} h={0.5} z={0.46} board={body} ink="#e7c96a" />
        {/* wares on the counter: generated 2D pictures when given (pics), otherwise the coded flat drawings */}
        {pics ? <><PicRow from={[-w / 2 + 0.15, 1.065, 0.08]} to={[w / 2 - 0.15, 1.065, 0.08]} items={pics} seed={seed} /><PicRow from={[-w / 2 + 0.4, 1.065, 0.36]} to={[w / 2 - 0.4, 1.065, 0.36]} items={[...pics].reverse().map(([p, q]) => [p, q * 0.75] as [string, number])} seed={seed + 3} /></>
          : <><WareRow from={[-w / 2 + 0.2, 1.065, 0.1]} to={[w / 2 - 0.2, 1.065, 0.1]} kinds={wares} seed={seed} size={0.4} /><WareRow from={[-w / 2 + 0.35, 1.065, 0.34]} to={[w / 2 - 0.35, 1.065, 0.34]} kinds={[...wares].reverse()} seed={seed + 4} size={0.3} /></>}
        {[-1, 1].map((k) => <mesh key={k} position={[k * (w / 2 + 0.5), 0.22, 0.3]} rotation={[0, k * 0.3, 0]} castShadow receiveShadow><boxGeometry args={[0.6, 0.44, 0.5]} /><meshLambertMaterial color="#9a7448" /></mesh>)}
      </group>
    );
  };

/** Bunting between two points: a sagging string of small flags in the given colours. */
export const Bunting: React.FC<{a: V3; b: V3; sag?: number; n?: number; colors?: string[]}> = ({a, b, sag = 0.5, n = 14, colors = ['#c8463c', '#e7c96a', '#3f6a8a', '#5a8f5a']}) => (
  <group>{Array.from({length: n}, (_, i) => { const t = (i + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, z = a[2] + (b[2] - a[2]) * t;
    return <mesh key={i} position={[x, y - 0.12, z]}><shapeGeometry args={[(() => { const s = new THREE.Shape(); s.moveTo(-0.12, 0.12); s.lineTo(0.12, 0.12); s.lineTo(0, -0.16); return s; })()]} /><meshLambertMaterial color={colors[i % colors.length]} side={THREE.DoubleSide} /></mesh>; })}</group>
);

/** STAGING RULE for people in front of a set piece (all four blend-test judges: the reference puts figures at several
 *  depths, one seen from behind in the foreground, taking part in something; ours stood in a row facing the camera).
 *  focus = [x, z] of what they attend to; n = how many. Returns, per person: where they stand, whether they are seen
 *  from behind, whether to mirror them so they face the focus, and how near the camera they are (0 = by the set piece).
 *  The first person of three or more stands in the foreground with their back to the camera, cut by the frame. */
export const stageCast = (focus: [number, number], n: number, spread = 3.4) => {
  const out: {x: number; z: number; back: boolean; flip: boolean; near: number}[] = [];
  // one person alone stands BESIDE the focus, not in front of it
  if (n === 1) return [{x: focus[0] + 1.35, z: focus[1] + 0.7, back: false, flip: true, near: 0}];
  for (let i = 0; i < n; i++) {
    // the foreground figure stands a third of the way in from the frame edge, close enough to be cut at the knees
    if (i === 0 && n >= 3) { out.push({x: focus[0] - spread * 0.42, z: focus[1] + 3.5, back: true, flip: false, near: 1}); continue; }
    const k = n >= 3 ? i - 1 : i, m = n >= 3 ? n - 1 : n, t = m === 1 ? 0.5 : k / (m - 1), x = focus[0] + (t - (n >= 3 ? 0.2 : 0.42)) * spread * 0.8, z = focus[1] + (k % 2 ? 1.25 : 2.05);
    out.push({x, z, back: false, flip: x > focus[0], near: k % 2 ? 0 : 0.4});
  }
  return out;
};
