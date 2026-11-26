import React, {useMemo} from 'react';
import * as THREE from 'three';
import {NguonBui} from './buiNguon';
import {B} from './kit';
import {FacetLathe, Halo} from './look';
import {rnd, P, Ctx} from './depth';
import {canvasTex, once} from './room';
import {BulbHalo} from './fx';

/** lib3/kitChicagoFair: the "White City" of the Chicago fair of 1893 at dusk (set HC of the "Tesla và Edison" passage,
 *  src/demo/ChicagoFair.tsx), usable by any grand exhibition, palace square or waterfront of white neo-classical buildings at
 *  night: a long white palace with a two-storey colonnade, pavilions and a pediment; a domed hall with a golden ribbed dome and a
 *  lantern; strings of light bulbs drawn together as one cloud of points (thousands of bulbs at little cost), each bulb with its
 *  own level so a shot can switch them on as a running wave; their broken, rippling reflections; a dark lake whose water lets the
 *  mirrored buildings show through; searchlight beams sweeping the sky; a stone balustrade with turned balusters and cast-iron
 *  lamp posts with three globes; a gilded statue (flat); far walkers (flat).
 *  Every built piece faces +z in its own frame (turn it with rotY). Positions in metres. */
type V3 = [number, number, number];
const col = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), Math.min(1, Math.max(0, t))).getHexString();
const clamp = (x: number) => Math.min(1, Math.max(0, x));

// ================================================================ bulbs: what they are, and the light plan
export type FairBulbKind = 'tip' | 'ring' | 'rib' | 'hall' | 'cornice' | 'colonnade' | 'pillar' | 'post' | 'rail' | 'search' | 'wash';
/** One bulb (or one lamp, beam or wash of light) of the fair: its kind, where it is in the world, t = 0..1 along its line from
 *  the foot up (ribs of the dome, bands on the columns), k = its own number (for twinkling). */
export type FairBulb = {kind: FairBulbKind; x: number; y: number; z: number; t: number; k: number};
/** level of a light at this frame: 0 = off, 1 = on, up to about 1.45 for a few frames just after it comes on (swell) */
export type FairPower = (b: FairBulb) => number;
export const FAIR_DARK: FairPower = () => 0;
export const FAIR_LIT: FairPower = () => 1;
const swellAt = (f: number, t: number) => (f < t ? 0 : 1 + 0.45 * Math.exp(-(f - t) / 2.6));
const hash = (a: number, b: number) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
/** The fair switching on (shot 12 of the list), every time a parameter in frames:
 *  tip = the bulb on top of the dome; ring = the ring at the dome's foot (with its big halo); ribs = [first, last] frame of the
 *  eight ribs lighting from foot to top; hall = the cornice of the domed hall; wave = the frame the running wave leaves the far end
 *  of the palaces (z0) and perM = frames per metre it takes to run towards the camera (cornice first, the colonnade band `lag`
 *  frames later, each column band after the wave has passed its foot, bottom up over 6 frames); search = the searchlights;
 *  rail = the lamps on the near balustrade (the farthest from camX first, 1.5 frames apart); wash = [from, to] of the warm light
 *  on the white fronts and the darker sky; twinkle = from that frame a few bulbs dip out of step. */
export const fairWave = (o: {f: number; tip?: number; ring?: number; ribs?: [number, number]; hall?: number; wave?: number; z0?: number; perM?: number; lag?: number; search?: number; rail?: number; camX?: number; wash?: [number, number]; twinkle?: number}): FairPower => {
  const {f, tip = 0, ring = 8, ribs = [10, 22], hall = 12, wave = 16, z0 = -150, perM = 1 / 3.5, lag = 4, search = 28, rail = 52, camX = 7, wash = [40, 60], twinkle = 58} = o;
  const at = (z: number) => wave + Math.max(0, z - z0) * perM;
  return (b) => {
    let t: number;
    switch (b.kind) {
      case 'tip': t = tip; break;
      case 'ring': t = ring; break;
      case 'rib': t = ribs[0] + b.t * (ribs[1] - ribs[0]); break;
      case 'hall': t = hall + Math.abs(b.x) * 0.12; break;
      case 'cornice': t = at(b.z); break;
      case 'colonnade': t = at(b.z) + lag; break;
      case 'pillar': t = at(b.z) + lag + 1 + b.t * 6; break;
      case 'post': t = at(b.z) + 2; break;
      case 'rail': t = rail + Math.max(0, 6 - Math.abs(b.x - camX) / 3) * 1.5; break;
      case 'search': t = search; break;
      case 'wash': return clamp((f - wash[0]) / (wash[1] - wash[0]));
      default: t = 1e9;
    }
    const L = swellAt(f, t);
    if (L > 0 && f >= twinkle && hash(b.k, Math.floor(f / 3)) < 0.03) return L * 0.35;
    return L;
  };
};

const dotTex = once(() => canvasTex(64, 64, (c) => {
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.22, 'rgba(255,255,255,0.95)'); g.addColorStop(0.45, 'rgba(255,255,255,0.3)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
}));
const streakTex = once(() => canvasTex(64, 64, (c) => {
  // a thin upright streak, broken in two or three dashes: the reflection of one bulb in rippled water
  [[8, 18], [24, 16], [44, 14]].forEach(([y, h], i) => { const g = c.createLinearGradient(26, 0, 38, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.95 - i * 0.2})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(26, y, 12, h); });
}));
/** THE BULBS: all the bulbs of a set drawn as one cloud of points (a warm-white core and a wider amber glow), each at its own
 *  level from `power`. Off bulbs are not drawn. size = the core's size in metres (seen at the 28-degree lens); water = the
 *  height of a water surface: also draw each bulb's reflection under it as a broken upright streak that changes on every frame
 *  (only where the line of sight really meets the water: the set's ground hides the rest). */
export const BulbField: React.FC<{bulbs: FairBulb[]; power: FairPower; f: number; size?: number; core?: string; glow?: string; water?: number; reflect?: number}> =
  ({bulbs, power, f, size = 0.32, core = '#fff4d6', glow = '#ffb84a', water, reflect = 0.55}) => {
    const n = bulbs.length, K = 1 / Math.tan((28 * Math.PI) / 360);   // three.js sizes points as if the lens were 90 degrees
    const geo = useMemo(() => {
      const mk = (mirror: boolean) => { const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3); bulbs.forEach((b, i) => { p[i * 3] = b.x; p[i * 3 + 1] = mirror && water !== undefined ? 2 * water - b.y - 0.9 : b.y; p[i * 3 + 2] = b.z; });
        g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); return g; };
      return {core: mk(false), glow: mk(false), mirror: mk(true)};
    }, [bulbs, water]);
    const cc = new THREE.Color(core), gc = new THREE.Color(glow);
    const a = geo.core.attributes.color as THREE.BufferAttribute, b2 = geo.glow.attributes.color as THREE.BufferAttribute, m = geo.mirror.attributes.color as THREE.BufferAttribute;
    let any = false;
    for (let i = 0; i < n; i++) {
      const L = Math.min(1.6, power(bulbs[i])), k = Math.min(1, L), s = L;
      if (L > 0) any = true;
      a.setXYZ(i, cc.r * k, cc.g * k, cc.b * k);
      b2.setXYZ(i, gc.r * 0.55 * s, gc.g * 0.55 * s, gc.b * 0.55 * s);
      const rip = 0.35 + 0.65 * hash(i, f);   // ripples: each reflection flickers on its own on every frame
      m.setXYZ(i, gc.r * reflect * k * rip, gc.g * reflect * k * rip, gc.b * reflect * k * rip);
    }
    a.needsUpdate = b2.needsUpdate = m.needsUpdate = true;
    if (!any) return null;
    const mat = (map: THREE.Texture, sz: number, order: number) => <pointsMaterial map={map} size={sz * K} sizeAttenuation vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />;
    return (
      <>
        <points geometry={geo.glow} renderOrder={5}>{mat(dotTex(), size * 4.2, 5)}</points>
        <points geometry={geo.core} renderOrder={6}>{mat(dotTex(), size, 6)}</points>
        {water !== undefined ? <points geometry={geo.mirror} renderOrder={3}>{mat(streakTex(), size * 7, 3)}</points> : null}
      </>
    );
  };

/** sample a polyline into bulbs about `step` metres apart */
export const bulbLine = (kind: FairBulbKind, pts: V3[], step: number, k0 = 0): FairBulb[] => {
  const out: FairBulb[] = []; let total = 0; const seg = pts.slice(1).map((p, i) => { const q = pts[i], l = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); total += l; return l; });
  const n = Math.max(1, Math.round(total / step));
  for (let j = 0; j <= n; j++) {
    let d = (j / n) * total, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
    const u = seg[i] ? d / seg[i] : 0, a = pts[i], b = pts[i + 1] ?? a;
    out.push({kind, x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, z: a[2] + (b[2] - a[2]) * u, t: j / n, k: k0 + j});
  }
  return out;
};
/** a point of a piece's own frame (front facing +z) in the world, the piece standing at `at` turned by rotY */
export const placeAt = (at: V3, rotY: number) => (p: V3): V3 => { const c = Math.cos(rotY), s = Math.sin(rotY); return [at[0] + p[0] * c + p[2] * s, at[1] + p[1], at[2] - p[0] * s + p[2] * c]; };

// ================================================================ the white palace
/** Sizes of a palace (metres, its own frame): roof line h, columns from colY[0] to colY[1], bay = column spacing, porch = how
 *  far the columns stand in front of the wall, centre and end pavilions (width, how far they come forward, height). */
export const PALACE = {h: 19, colY: [3, 14.3] as [number, number], bay: 5, porch: 1.8, mid: {w: 20, fwd: 4.4, h: 23}, end: {w: 12, fwd: 2.4, h: 21}};
const COLUMN: [number, number][] = [[0.66, 0], [0.66, 0.45], [0.54, 0.6], [0.5, 10.4], [0.62, 10.75], [0.68, 11.3]];
const pedGeo = once(() => { const s = new THREE.Shape(); s.moveTo(-10.6, 0); s.lineTo(10.6, 0); s.lineTo(0, 4.6); s.closePath(); return new THREE.ExtrudeGeometry(s, {depth: 1.2, bevelEnabled: false}); });
const archGeo = once(() => new THREE.CircleGeometry(1, 20, 0, Math.PI));
/** A long white exhibition palace of the 1890s: a stone podium, a colonnade of two storeys (round columns with bases and
 *  capitals) before a wall of tall windows, an entablature, an attic and cornice with small statues on the roof line; a taller
 *  centre pavilion with a great arched door and a pediment, two end pavilions. L = length along its own x. glow = the windows
 *  lit warm from inside (0-1); warm = the cast of the fair's light on the white stone (0-1). */
export const Palace: React.FC<{pos: V3; rotY?: number; L?: number; d?: number; stone?: string; glow?: number; warm?: number; seed?: number}> = ({pos, rotY = 0, L = 130, d = 26, stone = '#ece6d6', glow = 0, warm = 0, seed = 1}) => {
  const st = col(stone, '#f2d7a2', warm * 0.22), trim = col(st, '#ffffff', 0.25), shade = col(st, '#8e8a96', 0.3), win = col('#3e4560', '#ffcf86', glow * 0.8), {porch, bay, mid, end} = PALACE;
  const r = rnd(seed);
  const runs: [number, number][] = [[-L / 2 + end.w, -mid.w / 2], [mid.w / 2, L / 2 - end.w]];
  // columns stand on the bay lines a, a + bay, ... b; a window between each two
  const colsOf = (a: number, b: number) => Array.from({length: Math.round((b - a) / bay) + 1}, (_, j) => a + j * ((b - a) / Math.round((b - a) / bay)));
  const statues: number[] = []; runs.forEach(([a, b]) => { for (let x = a + 5; x < b - 2; x += 10) statues.push(x); });
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {/* the body and the podium */}
      <B p={[0, PALACE.h / 2, -d / 2]} s={[L, PALACE.h, d]} c={st} />
      <B p={[0, 1.5, porch / 2 + 0.3]} s={[L, 3, porch + 0.6]} c={shade} />
      <B p={[0, 3.04, porch / 2 + 0.3]} s={[L + 0.1, 0.1, porch + 0.7]} c={trim} cast={false} />
      {/* the colonnade runs: windows in the wall behind, columns, entablature, attic, cornice */}
      {runs.map(([a, b], ri) => { const w = b - a, cx = (a + b) / 2; return <React.Fragment key={ri}>
        {colsOf(a, b).map((x, i, all) => <React.Fragment key={i}>
          <FacetLathe pos={[x, 3, porch]} profile={COLUMN} sides={10} color={st} />
          {i < all.length - 1 ? <>{(() => { const m = (x + all[i + 1]) / 2; return <>
            <B p={[m, 6.2, 0.03]} s={[2.2, 4.6, 0.06]} c={win} cast={false} />
            <mesh position={[m, 8.5, 0.035]} scale={[1.1, 1.1, 1]}><primitive object={archGeo()} attach="geometry" /><meshLambertMaterial color={win} /></mesh>
            <B p={[m, 12.0, 0.03]} s={[2.0, 2.2, 0.06]} c={win} cast={false} />
            <B p={[m, 10.6, 0.06]} s={[2.8, 0.25, 0.12]} c={trim} cast={false} /></>; })()}</> : null}
        </React.Fragment>)}
        <B p={[cx, 15.0, porch / 2 + 0.25]} s={[w, 1.4, porch + 0.95]} c={st} />
        <B p={[cx, 14.35, porch + 0.73]} s={[w, 0.12, 0.06]} c={shade} cast={false} />
        <B p={[cx, 17.2, 0.5]} s={[w, 2.8, 1.0]} c={st} />
        {Array.from({length: Math.floor(w / 2.5)}, (_, k) => <B key={k} p={[a + 1.25 + k * 2.5, 17.1, 1.02]} s={[1.6, 1.4, 0.04]} c={shade} cast={false} />)}
        <B p={[cx, 18.8, 0.85]} s={[w, 0.42, 1.9]} c={trim} />
      </React.Fragment>; })}
      {/* statues on the roof line (simple turned figures) */}
      {statues.map((x, i) => <FacetLathe key={`s${i}`} pos={[x, 19.0, 0.6]} profile={[[0.45, 0], [0.45, 0.5], [0.3, 0.6], [0.34, 1.7], [0.2, 1.95], [0.22, 2.3], [0.04, 2.5]]} sides={7} s={0.9 + r() * 0.15} color={trim} cast={false} />)}
      {/* the centre pavilion: great arched door, paired pilasters, pediment */}
      <group position={[0, 0, mid.fwd - 3]}>
        <B p={[0, mid.h / 2, 0]} s={[mid.w, mid.h, 6]} c={st} />
        <B p={[0, 7.0, 3.03]} s={[7, 8, 0.06]} c={col(win, '#2a2f44', 0.3)} cast={false} />
        <mesh position={[0, 11, 3.04]} scale={[3.5, 3.5, 1]}><primitive object={archGeo()} attach="geometry" /><meshLambertMaterial color={col(win, '#2a2f44', 0.3)} /></mesh>
        {[-8.6, -6.6, 6.6, 8.6].map((x) => <B key={x} p={[x, 10.5, 3.25]} s={[1.0, 15, 0.5]} c={trim} />)}
        {[-4.6, 4.6].map((x) => <B key={x} p={[x, 7.5, 3.1]} s={[0.6, 9, 0.2]} c={trim} />)}
        <B p={[0, 18.2, 3.3]} s={[mid.w + 0.6, 1.2, 0.8]} c={trim} />
        <B p={[0, 20.6, 3.1]} s={[mid.w, 3.4, 0.4]} c={st} />
        <B p={[0, 22.5, 3.3]} s={[mid.w + 0.8, 0.5, 0.9]} c={trim} />
        <mesh position={[0, 22.8, 2.2]} geometry={pedGeo()} castShadow receiveShadow><meshLambertMaterial color={st} /></mesh>
        <FacetLathe pos={[0, 27.3, 2.8]} profile={[[0.6, 0], [0.6, 0.6], [0.35, 0.8], [0.4, 2.4], [0.2, 2.8], [0.05, 3.0]]} sides={7} color={col(trim, '#d8b45a', 0.6)} cast={false} />
      </group>
      {/* the end pavilions */}
      {[-1, 1].map((sg) => <group key={sg} position={[sg * (L / 2 - end.w / 2), 0, end.fwd - 3]}>
        <B p={[0, end.h / 2, 0]} s={[end.w, end.h, 6]} c={st} />
        {[-1, 1].map((q) => <B key={q} p={[q * (end.w / 2 - 0.8), end.h / 2, 3.2]} s={[1.2, end.h - 2, 0.4]} c={trim} />)}
        <B p={[0, 6.5, 3.03]} s={[3.4, 6, 0.06]} c={win} cast={false} />
        <B p={[0, 13.5, 3.03]} s={[3.0, 4.2, 0.06]} c={win} cast={false} />
        <B p={[0, end.h - 0.4, 3.25]} s={[end.w + 0.6, 0.8, 0.9]} c={trim} />
      </group>)}
    </group>
  );
};
/** The bulb lines of a palace standing at `at` turned by rotY (world positions): the roof line and the pavilions' outlines and
 *  pediment ('cornice'), the band under the entablature ('colonnade'), an upright band on every other column ('pillar'). */
export const palaceBulbs = (at: V3, rotY: number, L = 130, k0 = 0): FairBulb[] => {
  const w = placeAt(at, rotY), {porch, bay, mid, end} = PALACE, out: FairBulb[] = [], add = (b: FairBulb[]) => b.forEach((q) => out.push({...q, k: k0 + out.length}));
  const runs: [number, number][] = [[-L / 2 + end.w, -mid.w / 2], [mid.w / 2, L / 2 - end.w]];
  runs.forEach(([a, b]) => {
    add(bulbLine('cornice', [w([a, 19.08, 1.84]), w([b, 19.08, 1.84])], 0.9));
    add(bulbLine('colonnade', [w([a, 14.26, porch + 0.82]), w([b, 14.26, porch + 0.82])], 0.9));
    const n = Math.round((b - a) / bay); for (let j = 0; j <= n; j += 2) { const x = a + j * ((b - a) / n); add(bulbLine('pillar', [w([x, 3.5, porch + 0.72]), w([x, 14.0, porch + 0.72])], 0.75)); }
  });
  // centre pavilion: its cornice, the pediment's two slopes, the arch of its door
  const mz = mid.fwd + 0.4;
  add(bulbLine('cornice', [w([-mid.w / 2 - 0.3, 22.8, mz]), w([mid.w / 2 + 0.3, 22.8, mz])], 0.9));
  add(bulbLine('cornice', [w([-10.6, 22.85, mz - 0.6]), w([0, 27.45, mz - 0.6]), w([10.6, 22.85, mz - 0.6])], 0.9));
  add(bulbLine('colonnade', Array.from({length: 13}, (_, i) => { const a = Math.PI - (i / 12) * Math.PI; return w([Math.cos(a) * 3.75, 11 + Math.sin(a) * 3.75, mid.fwd + 0.1]); }), 0.7));
  [-1, 1].forEach((sg) => { const x = sg * (L / 2 - end.w / 2), z = end.fwd + 0.35; add(bulbLine('cornice', [w([x - end.w / 2 - 0.3, end.h + 0.05, z]), w([x + end.w / 2 + 0.3, end.h + 0.05, z])], 0.9));
    [-1, 1].forEach((q) => add(bulbLine('pillar', [w([x + q * (end.w / 2 - 0.8), 1.5, z + 0.1]), w([x + q * (end.w / 2 - 0.8), end.h - 1, z + 0.1])], 0.8))); });
  return out;
};

// ================================================================ the domed hall
export const DOME = {w: 36, d: 30, base: 16, drum: [18, 27.6] as [number, number], r: 10, top: 43.6};
const domeProfile: [number, number][] = [[10, 0], [9.7, 2.4], [8.9, 5], [7.4, 7.6], [5.2, 9.8], [2.6, 11.2], [0.9, 11.8]];
/** The domed hall at the end of the water: a white square base with a great arched entrance, paired pilasters and four small
 *  gilded cupolas on its corners, an eight-sided drum, a GOLDEN ribbed dome and a lantern. Front at z = 0, the dome over z = -15.
 *  gold = the dome's colour; warm = the fair's light on the white stone (0-1); glow = the entrance lit from inside. */
export const DomeHall: React.FC<{pos: V3; gold?: string; stone?: string; warm?: number; glow?: number}> = ({pos, gold = '#c49a46', stone = '#ece6d6', warm = 0, glow = 0}) => {
  const st = col(stone, '#f2d7a2', warm * 0.22), trim = col(st, '#ffffff', 0.25), dark = col('#363b56', '#ffcf86', glow * 0.7), cz = -DOME.d / 2;
  return (
    <group position={pos}>
      <B p={[0, DOME.base / 2, cz]} s={[DOME.w, DOME.base, DOME.d]} c={st} />
      <B p={[0, 1.2, 0.4]} s={[DOME.w + 1, 2.4, 1.2]} c={col(st, '#8e8a96', 0.25)} />
      <B p={[0, 6.6, 0.05]} s={[8, 8.4, 0.1]} c={dark} cast={false} />
      <mesh position={[0, 10.8, 0.06]} scale={[4, 4, 1]}><primitive object={archGeo()} attach="geometry" /><meshLambertMaterial color={dark} /></mesh>
      {[-1, 1].map((q) => <React.Fragment key={q}>
        {[5.6, 7.4, 13.6, 15.4].map((x) => <B key={x} p={[q * x, 8.6, 0.3]} s={[1.0, 13.2, 0.5]} c={trim} />)}
        <B p={[q * 10.5, 6, 0.04]} s={[2.4, 4, 0.06]} c={dark} cast={false} />
        <B p={[q * 10.5, 11.6, 0.04]} s={[2.0, 2.6, 0.06]} c={dark} cast={false} />
        {[2, cz * 2 + 2].map((z) => <group key={z} position={[q * (DOME.w / 2 - 2), DOME.base + 1.2, z - 2]}>
          <FacetLathe profile={[[2, 0], [2, 2.2], [2.3, 2.5]]} sides={8} color={st} />
          <FacetLathe pos={[0, 2.5, 0]} profile={[[2, 0], [1.6, 1.4], [0.8, 2.4], [0.1, 2.8]]} sides={8} color={gold} />
        </group>)}
      </React.Fragment>)}
      <B p={[0, DOME.base + 0.3, cz + 0.3]} s={[DOME.w + 1.2, 0.7, DOME.d + 1.2]} c={trim} />
      <B p={[0, DOME.base + 1.3, cz]} s={[DOME.w - 6, 1.6, DOME.d - 6]} c={st} />
      <FacetLathe pos={[0, DOME.drum[0], cz]} profile={[[11, 0], [11, 1], [10, 1.2], [10, 8.6], [10.8, 9], [10.8, 9.6]]} sides={8} color={st} />
      <FacetLathe pos={[0, DOME.drum[1], cz]} profile={domeProfile} sides={8} color={gold} tones={[0.86, 0.95, 1.02, 1.08, 1.14, 1.2]} />
      <FacetLathe pos={[0, DOME.drum[1] + 11.6, cz]} profile={[[1.3, 0], [1.3, 2.2], [1.7, 2.5], [1.0, 2.8], [0.15, 4.4]]} sides={8} color={gold} cast={false} />
      {/* windows on the drum's front faces */}
      {[-1, 0, 1].map((q) => { const a = Math.PI / 2 + q * (Math.PI / 4), x = Math.cos(a) * 10.05, z = Math.sin(a) * 10.05; return <B key={q} p={[x, DOME.drum[0] + 5, cz + z]} r={[0, -a + Math.PI / 2, 0]} s={[2.4, 4.6, 0.1]} c={dark} cast={false} />; })}
    </group>
  );
};
/** The bulb lines of the domed hall standing at `at`: the tip of the lantern ('tip'), the ring at the dome's foot and round the
 *  drum ('ring'), the eight ribs ('rib', t = 0 at the foot), the cornice of the base and the arch ('hall'). */
export const domeBulbs = (at: V3, k0 = 0): FairBulb[] => {
  const out: FairBulb[] = [], add = (b: FairBulb[]) => b.forEach((q) => out.push({...q, k: k0 + out.length})), cz = at[2] - DOME.d / 2, X = at[0];
  out.push({kind: 'tip', x: X, y: DOME.top + 0.3, z: cz, t: 0, k: k0});
  const ring = (y: number, r: number, n: number, kind: FairBulbKind) => add(Array.from({length: n}, (_, i) => { const a = (i / n) * Math.PI * 2; return {kind, x: X + Math.cos(a) * r, y, z: cz + Math.sin(a) * r, t: 0, k: 0}; }));
  ring(DOME.drum[1] + 0.15, 10.35, 72, 'ring'); ring(DOME.drum[0] + 9.75, 11.0, 72, 'ring');
  for (let q = 0; q < 8; q++) { const a = (q / 8) * Math.PI * 2 + 0.26; add(bulbLine('rib', domeProfile.map(([r, y]) => [X + Math.cos(a) * (r + 0.2), DOME.drum[1] + y + 0.1, cz + Math.sin(a) * (r + 0.2)] as V3), 0.75)); }
  add(bulbLine('hall', [[X - DOME.w / 2 - 0.6, DOME.base + 0.7, at[2] + 0.35], [X + DOME.w / 2 + 0.6, DOME.base + 0.7, at[2] + 0.35]], 0.9));
  add(bulbLine('hall', Array.from({length: 15}, (_, i) => { const a = Math.PI - (i / 14) * Math.PI; return [X + Math.cos(a) * 4.25, 10.8 + Math.sin(a) * 4.25, at[2] + 0.2] as V3; }), 0.7));
  add(bulbLine('hall', [[X - DOME.w / 2 - 0.6, 2.5, at[2] + 1.05], [X + DOME.w / 2 + 0.6, 2.5, at[2] + 1.05]], 1.0));
  return out;
};

// ================================================================ water
const rippleTex = once(() => { const t = canvasTex(256, 512, (c) => { const r = rnd(12); for (let i = 0; i < 260; i++) { const y = r() * 512, x = r() * 256, w = 20 + r() * 70; c.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.12})`; c.fillRect(x, y, w, 1.5 + r() * 1.5); if (x + w > 256) c.fillRect(x - 256, y, w, 2); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; });
/** A long basin of still dark water: x = [left, right], z = [near, far], level = the water's height (below the ground at 0).
 *  The water is a little see-through, so whatever is mirrored under it (Mirror) shows as a reflection; it darkens near the
 *  camera and takes the sky's tone far off; faint ripple lines move on every frame (f). A stone coping runs round its edge. */
export const Lake: React.FC<{x: [number, number]; z: [number, number]; level?: number; f?: number; near?: string; far?: string; opacity?: number; coping?: string}> =
  ({x, z, level = -0.55, f = 0, near = '#161b2c', far = '#3a4264', opacity = 0.78, coping = '#cfc8b8'}) => {
    const w = x[1] - x[0], d = z[0] - z[1], cx = (x[0] + x[1]) / 2, cz = (z[0] + z[1]) / 2;
    const geo = useMemo(() => { const g = new THREE.PlaneGeometry(w, d, 1, 24), p = g.attributes.position as THREE.BufferAttribute, a = new THREE.Color(near), b = new THREE.Color(far), c: number[] = [];
      for (let i = 0; i < p.count; i++) { const t = clamp(0.5 - p.getY(i) / d); const q = a.clone().lerp(b, Math.pow(1 - t, 1.6)); c.push(q.r, q.g, q.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); return g; }, [w, d, near, far]);
    const rt = useMemo(() => { const t = rippleTex().clone(); t.needsUpdate = true; t.repeat.set(w / 14, d / 9); return t; }, [w, d]);
    rt.offset.set((f * 0.013) % 1, (f * 0.021) % 1);
    return (
      <group>
        <mesh geometry={geo} position={[cx, level, cz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}><meshBasicMaterial vertexColors transparent opacity={opacity} depthWrite={false} /></mesh>
        <mesh position={[cx, level + 0.01, cz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}><planeGeometry args={[w, d]} /><meshBasicMaterial map={rt} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.5} /></mesh>
        {/* the coping and the short inner wall above the water (never below it: it would hide the reflections) */}
        {[x[0], x[1]].map((xx, i) => <React.Fragment key={i}><B p={[xx + (i ? 0.35 : -0.35), 0.06, cz]} s={[0.7, 0.14, d + 0.7]} c={coping} cast={false} /><B p={[xx, level / 2, cz]} s={[0.04, -level, d]} c="#6a6a76" cast={false} /></React.Fragment>)}
        {[z[0], z[1]].map((zz, i) => <React.Fragment key={i}><B p={[cx, 0.06, zz + (i ? -0.35 : 0.35)]} s={[w + 1.4, 0.14, 0.7]} c={coping} cast={false} /><B p={[cx, level / 2, zz]} s={[w, -level, 0.04]} c="#6a6a76" cast={false} /></React.Fragment>)}
      </group>
    );
  };
/** Draws its children upside down under a water surface at `level` (the reflection of what stands on the bank). Use it with a
 *  Lake: only the part seen through the water shows; the ground around hides the rest. */
export const Mirror: React.FC<{level: number; children: React.ReactNode}> = ({level, children}) => <group position={[0, 2 * level, 0]} scale={[1, -1, 1]}>{children}</group>;

// ================================================================ searchlights
/** A searchlight beam: a long, faint cone of light from a lamp housing on a roof, fading with distance. tilt = radians from the
 *  vertical towards +x, lean = towards -z (away from the camera); on = 0..1; len and spread in metres. */
export const Searchlight: React.FC<{pos: V3; tilt: number; lean?: number; on?: number; len?: number; spread?: number; color?: string}> = ({pos, tilt, lean = 0.25, on = 1, len = 240, spread = 11, color = '#cfe0ff'}) => {
  const geo = useMemo(() => { const make = (r: number) => { const g = new THREE.ConeGeometry(r, len, 28, 12, true); g.rotateX(Math.PI); g.translate(0, len / 2, 0);
    const p = g.attributes.position as THREE.BufferAttribute, c: number[] = []; for (let i = 0; i < p.count; i++) { const t = clamp(p.getY(i) / len), k = Math.pow(1 - t, 1.8) * (t < 0.02 ? t / 0.02 : 1); c.push(k, k, k); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); return g; }; return [make(spread * 2.2), make(spread), make(spread * 0.4)]; }, [len, spread]);
  const dir = new THREE.Vector3(Math.sin(tilt), Math.cos(tilt), -Math.sin(lean)).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const cc = new THREE.Color(color);
  return (
    <group position={pos}>
      <FacetLathe profile={[[0.5, 0], [0.5, 0.5], [0.3, 0.6], [0.3, 0.9], [0.62, 1.0], [0.62, 1.7], [0.5, 1.8]]} sides={8} color="#3a3a44" cast={false} />
      {on > 0 ? <group position={[0, 1.4, 0]} quaternion={q}>
        {geo.map((g, i) => <mesh key={i} geometry={g} renderOrder={4}><meshBasicMaterial vertexColors color={cc.clone().multiplyScalar(on * [0.026, 0.03, 0.03][i])} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} fog={false} /></mesh>)}
        <BulbHalo pos={[0, 0.2, 0.6]} r={0.7 * on} f={0} color="#dfe9ff" core="#ffffff" />
      </group> : null}
    </group>
  );
};

// ================================================================ balustrade and lamps
const BALUSTER: [number, number][] = [[0.11, 0], [0.11, 0.08], [0.07, 0.14], [0.13, 0.32], [0.06, 0.52], [0.05, 0.6], [0.09, 0.66], [0.09, 0.72]];
/** A stone balustrade along x at depth z: plinth, turned balusters about 0.3 m apart, a top rail, square pedestals at `posts`
 *  (x positions, where FairLamp stands). h = top of the rail. */
export const Balustrade: React.FC<{x: [number, number]; z: number; posts?: number[]; stone?: string; seed?: number}> = ({x, z, posts = [], stone = '#dcd5c4', seed = 1}) => {
  const w = x[1] - x[0], cx = (x[0] + x[1]) / 2, shade = col(stone, '#7e7a86', 0.25), r = rnd(seed);
  const bal: number[] = []; for (let q = x[0] + 0.2; q < x[1] - 0.1; q += 0.3) if (!posts.some((p) => Math.abs(p - q) < 0.45)) bal.push(q);
  return (
    <group>
      <B p={[cx, 0.1, z]} s={[w, 0.2, 0.5]} c={shade} />
      {bal.map((q, i) => <FacetLathe key={i} pos={[q, 0.2, z]} profile={BALUSTER} sides={8} color={col(stone, shade, r() * 0.25)} cast={false} contact={false} />)}
      <B p={[cx, 0.98, z]} s={[w, 0.14, 0.42]} c={stone} />
      <B p={[cx, 1.08, z]} s={[w + 0.04, 0.06, 0.5]} c={col(stone, '#ffffff', 0.2)} cast={false} />
      {posts.map((p, i) => <React.Fragment key={i}><B p={[p, 0.6, z]} s={[0.62, 1.2, 0.62]} c={stone} /><B p={[p, 1.24, z]} s={[0.74, 0.1, 0.74]} c={col(stone, '#ffffff', 0.2)} /></React.Fragment>)}
    </group>
  );
};
/** A cast-iron fair lamp: a fluted post on a pedestal (or on the ground), a cross-bar with three round globes. level 0-1.6
 *  (the swell of switching on above 1); light = a real warm light that reaches the people near it. */
/** bui (mặc định true): đèn tự đăng ký nguồn bụi (lib3/buiNguon) tại thân đèn ('den', khi sáng). */
export const FairLamp: React.FC<{pos: V3; h?: number; level?: number; f?: number; light?: boolean; tone?: string; seed?: number; s?: number; bui?: boolean}> = ({pos, h = 3.1, level = 0, f = 0, light = false, tone = '#ffd88a', seed = 1, s = 1, bui = true}) => {
  const iron = '#24292c', L = Math.min(1, level), sw = Math.max(1, Math.min(1.6, level)), globes: V3[] = [[0, h + 0.35, 0], [-0.42, h + 0.1, 0], [0.42, h + 0.1, 0]];
  return (
    <group position={pos} scale={s}>
      <FacetLathe profile={[[0.16, 0], [0.16, 0.2], [0.1, 0.3], [0.07, 0.5], [0.055, h - 0.1], [0.08, h]]} sides={8} color={iron} contact={pos[1] < 0.5} />
      <B p={[0, h + 0.02, 0]} s={[0.9, 0.04, 0.04]} c={iron} cast={false} />
      {globes.map((g, i) => <group key={i} position={g}>
        <FacetLathe pos={[0, -0.14, 0]} profile={[[0.06, 0], [0.13, 0.06], [0.15, 0.15], [0.12, 0.25], [0.04, 0.29]]} sides={8} color={L > 0.02 ? col('#e8e2cc', '#fff6dc', L) : '#d8d4c8'} cast={false} contact={false} />
        {L > 0.02 ? <BulbHalo pos={[0, 0, 0.2]} r={0.2 * sw * (0.5 + 0.5 * L)} f={f} color={tone} core="#fff8e4" seed={seed * 3 + i} /> : null}
      </group>)}
      {L > 0.02 ? <Halo pos={[0, h + 0.2, 0.3]} r={1.8 * sw * L} color={tone} strength={0.26 * L} /> : null}{bui && L > 0.1 ? <NguonBui kieu="den" pos={[0, h + 0.2, 0]} r={1.2} mau={tone} k={L} /> : null}
      {light && L > 0.02 ? <pointLight position={[0, h + 0.2, 0.4]} color={tone} intensity={6 * L} distance={14} decay={1.4} /> : null}
    </group>
  );
};

// ================================================================ flat pieces: the gilded statue, far walkers
/** The tall gilded statue of a robed woman, arms raised, a globe with an eagle in her right hand and a staff in her left (the
 *  "Republic"), painted flat; lit = brighter gold when the fair's lights are on. Use in a Sprite on a stone pedestal. */
export const paintGoldStatue = (lit = false) => (c: Ctx, W: number, H: number) => {
  const g = lit ? ['#f2c25a', '#d39a36', '#9a6a22'] : ['#b8924a', '#977538', '#6e5428'], cx = W / 2, s = W / 300;
  const x = (u: number) => cx + u * s, y = (v: number) => H - v * s;
  // robe: a long column widening to the foot, folds as darker strips
  P(c, [[x(-46), y(0)], [x(46), y(0)], [x(34), y(380)], [x(30), y(520)], [x(-30), y(520)], [x(-34), y(380)]], g[1]);
  P(c, [[x(-46), y(0)], [x(-8), y(0)], [x(-12), y(380)], [x(-6), y(520)], [x(-30), y(520)], [x(-34), y(380)]], g[0]);
  [[-24, 6], [6, 8], [24, 6]].forEach(([u, w]) => P(c, [[x(u - w / 2), y(10)], [x(u + w / 2), y(10)], [x(u * 0.7 + w / 2), y(360)], [x(u * 0.7 - w / 2), y(360)]], g[2]));
  // shoulders, head with a laurel crown
  P(c, [[x(-40), y(520)], [x(40), y(520)], [x(30), y(560)], [x(-30), y(560)]], g[0]);
  c.beginPath(); c.ellipse(x(0), y(590), 21 * s, 26 * s, 0, 0, 7); c.fillStyle = g[0]; c.fill();
  c.beginPath(); c.ellipse(x(5), y(590), 12 * s, 24 * s, 0, 0, 7); c.fillStyle = g[1]; c.fill();
  [-18, -8, 2, 12].forEach((u) => P(c, [[x(u), y(612)], [x(u + 5), y(632)], [x(u + 10), y(612)]], g[0]));
  // arms raised: right (screen left) with the globe and eagle, left (screen right) with the staff
  P(c, [[x(-34), y(548)], [x(-20), y(540)], [x(-62), y(700)], [x(-78), y(690)]], g[0]);
  c.beginPath(); c.arc(x(-74), y(722), 26 * s, 0, 7); c.fillStyle = g[0]; c.fill(); c.beginPath(); c.arc(x(-68), y(718), 18 * s, 0, 7); c.fillStyle = g[1]; c.fill();
  P(c, [[x(-110), y(770)], [x(-74), y(748)], [x(-38), y(770)], [x(-60), y(756)], [x(-74), y(790)], [x(-88), y(756)]], g[0]);
  P(c, [[x(34), y(548)], [x(20), y(540)], [x(62), y(700)], [x(76), y(690)]], g[1]);
  P(c, [[x(64), y(560)], [x(72), y(560)], [x(74), y(860)], [x(66), y(860)]], g[2]);
  P(c, [[x(58), y(860)], [x(80), y(860)], [x(70), y(890)]], g[0]);
};
/** A few small far walkers on a promenade at dusk: dark coats and dresses, pale faces, two or three tones; one group per seed. */
export const paintWalkers = (seed = 1) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), n = 4 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const x = (0.08 + (0.84 * i) / n + r() * 0.06) * W, h = H * (0.78 + r() * 0.2), w = h * 0.26, dress = r() < 0.4, coat = ['#2c2a34', '#3a3036', '#2a3040', '#463a30', '#34302c'][Math.floor(r() * 5)];
    P(c, dress ? [[x - w * 0.7, H], [x + w * 0.7, H], [x + w * 0.3, H - h * 0.62], [x - w * 0.3, H - h * 0.62]] : [[x - w * 0.42, H], [x + w * 0.42, H], [x + w * 0.5, H - h * 0.7], [x - w * 0.5, H - h * 0.7]], coat);
    P(c, [[x - w * 0.5, H - h * 0.68], [x + w * 0.5, H - h * 0.68], [x + w * 0.38, H - h * 0.8], [x - w * 0.38, H - h * 0.8]], coat);
    c.beginPath(); c.arc(x, H - h * 0.88, w * 0.3, 0, 7); c.fillStyle = '#c9a68a'; c.fill();
    c.beginPath(); c.arc(x, H - h * 0.93, w * 0.3, Math.PI, 0); c.fillStyle = '#231e1e'; c.fill();
  }
};
