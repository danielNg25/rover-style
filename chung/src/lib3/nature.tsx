import React, {useMemo} from 'react';
import * as THREE from 'three';
import {FacetLathe, softNormals, Ground} from './look';
import {NguonBui} from './buiNguon';

/** lib3/nature: set pieces built the way the reference builds them (LUAT-CUTOUT3D-v3 J48 and the deep-look notes):
 *  low-poly solids, every facet one flat tone that comes from the set's key light, caps and bevels as separate
 *  solids, nothing smooth. Each piece here was matched against a native reference crop before it was allowed in
 *  (see src/demo/Lib3Match.tsx and out/lib3/). New pieces for new subjects follow the same recipe and the same gate. */
type V3 = [number, number, number];
const flat = (color: string) => <meshLambertMaterial color={color} flatShading />;

/** Snow lying on a pine tier: a four-sided pyramid whose side corners droop and whose front and back corners sit high,
 *  so from the front it reads as two white wings with sharp tips and a notch in the middle where the dark tier shows. */
const useSnowGable = (R: number, h: number, rise: number, depth: number) => useMemo(() => {
  const A = [0, h, 0], L = [-R, 0, 0], F = [0, rise, depth], Rr = [R, 0, 0], B = [0, rise, -depth];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...A, ...L, ...F, ...A, ...F, ...Rr, ...A, ...Rr, ...B, ...A, ...B, ...L], 3));
  return softNormals(g, 0.3);
}, [R, h, rise, depth]);
const Tier: React.FC<{y: number; R: number; dark: string; snow: string}> = ({y, R, dark, snow}) => {
  // The snow is a pyramid that ENCLOSES the branch cone: side corners low (the two sharp tips), front and back corners
  // high. The cone shares the snow's apex, so it only comes out below the snow's front edge: the dark triangle in the notch.
  // Measured on frame 2905: the snow slope is steep (the hidden apex is about 1.8 half-widths above the tips), the notch
  // rises 0.57 of the half-width, and tiers nest deeply (one tier starts 0.95 of a half-width above the last).
  const gable = useSnowGable(R, R * 1.8, R * 0.57, R);
  const mass = useSnowGable(R * 1.04, R * 1.98, 0, R * 0.9);
  return (
    <group position={[0, y, 0]}>
      {/* the branch mass is the same four-sided pyramid, a little slimmer front to back and flat at the bottom, so it stays
          inside the snow above the notch and its two front faces give the light half and the dark half */}
      <mesh geometry={mass} position={[0, -R * 0.18, 0]} castShadow><meshLambertMaterial color={dark} side={THREE.DoubleSide} emissive={dark} emissiveIntensity={0.25} /></mesh>
      <mesh geometry={gable} castShadow><meshLambertMaterial color={snow} side={THREE.DoubleSide} emissive={snow} emissiveIntensity={0.3} /></mesh>
    </group>
  );
};
/** Snow-laden pine. h = total height; tiers 3-5 (the reference uses 4-5 on big trees, 3 on small ones). */
export const SnowPine: React.FC<{pos?: V3; h: number; tiers?: number; dark?: string; snow?: string; trunk?: string}> =
  ({pos = [0, 0, 0], h, tiers = 5, dark = '#33444b', snow = '#cfd5e2', trunk = '#3b2d2a'}) => {
    // measured on the reference (frame 2905): a tier is about 0.9 of its half-width tall, each tier 0.8 of the one below,
    // so a five-tier tree is about 0.6 of its height wide at the base
    const k = 0.8, STEP = 0.95, below = Array.from({length: tiers - 1}, (_, i) => Math.pow(k, i)).reduce((a, b) => a + b, 0), R0 = (h * 0.9) / (below * STEP + 1.8 * Math.pow(k, tiers - 1));
    let y = h * 0.1; const rows: {y: number; R: number}[] = [];
    for (let i = 0; i < tiers; i++) { const R = R0 * Math.pow(k, i); rows.push({y, R}); y += R * STEP; }
    return (
      <group position={pos}>
        <mesh position={[0, h * 0.07, 0]}><boxGeometry args={[R0 * 0.16, h * 0.16, R0 * 0.16]} />{flat(trunk)}</mesh>
        {rows.map((r, i) => <Tier key={i} y={r.y} R={r.R} dark={dark} snow={snow} />)}
      </group>
    );
  };

/** Boulder: a turned solid (lib3/look FacetLathe) with 8 uneven vertical facets, narrow at the foot, with a thick snow slab
 *  on its flat top. Lighter on the key-light side, darker on the other, as every solid in this look. */
export const Boulder: React.FC<{pos?: V3; s: number; color?: string; snow?: string | false; seed?: number}> = ({pos = [0, 0, 0], s, color = '#62677f', snow = '#d9deea', seed = 1}) => (
  <group position={pos}>
    <FacetLathe profile={[[0.5, 0], [0.64, 0.3], [0.62, 0.66], [0.47, 0.9]]} sides={8} s={s} color={color} wobble={0.1} seed={seed} squash={0.88} />
    {snow ? <FacetLathe profile={[[0.5, 0.88], [0.5, 0.93], [0.38, 1.03]]} sides={8} s={s} color={snow} wobble={0.05} seed={seed + 3} squash={0.88} soft={0.3} /> : null}
  </group>
);

/** Dry grass tuft: a fan of 4-7 thin pointed blades, olive-brown, leaning outward (the reference dots snow, roads and
 *  meadows with these; use several per wide shot). */
/** bui (mặc định true): bụi cỏ lẻ tự đăng ký nguồn 'hat-co' (lib3/buiNguon): hạt cỏ trắng ngà trôi ngang; chỉ ngoài trời. */
export const Tuft: React.FC<{pos?: V3; s?: number; color?: string; seed?: number; bui?: boolean}> = ({pos = [0, 0, 0], s = 0.3, color = '#84775a', seed = 1, bui = true}) => {
  const geo = useMemo(() => {
    const rnd = (i: number) => { const x = Math.sin(seed * 12.9 + i * 78.2) * 43758.5; return x - Math.floor(x); };
    const n = 4 + Math.floor(rnd(0) * 4), P: number[] = [];
    for (let i = 0; i < n; i++) { const a = (-0.9 + (1.8 * i) / (n - 1)) + (rnd(i + 1) - 0.5) * 0.25, L = s * (0.6 + rnd(i + 9) * 0.5), w = s * 0.09, x0 = (i - (n - 1) / 2) * s * 0.1; P.push(x0 - w, 0, 0, x0 + w, 0, 0, x0 + Math.sin(a) * L, Math.cos(a) * L, 0); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); return g;
  }, [s, seed]);
  return <><mesh geometry={geo} position={pos}><meshBasicMaterial color={color} side={THREE.DoubleSide} /></mesh>{bui ? <NguonBui kieu="hat-co" pos={pos} r={s * 0.6} w={0} h={s} mau="#f4efdc" bang={['#f4efdc', '#ece4c8']} /> : null}</>;
};

/** Snow field: the shared Ground with the snow palette (pale near the camera, slate with distance at night). */
export const SnowField: React.FC<{pos?: V3; size?: [number, number]; night?: boolean}> = ({pos = [0, 0, 0], size = [70, 46], night = true}) =>
  <Ground near={night ? '#c9cedb' : '#e3e8f1'} far={night ? '#9aa1b6' : '#b9c2d6'} pos={pos} size={size} swell={0.08} patch={0.06} farAt={0.42} />;

// ---------------------------------------------------------------- pieces for camps and winter places
const rndN = (seed: number) => { let s = seed * 9301 + 49297; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
/** A canvas tent: a four-sided pyramid, its door flap a flat triangle that glows when a lamp burns inside. */
export const Tent: React.FC<{pos?: V3; s?: number; color?: string; lit?: boolean}> = ({pos = [0, 0, 0], s = 1, color = '#b89a68', lit}) => (
  <group position={pos} scale={s}>
    <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow><coneGeometry args={[2.3, 3.1, 4]} /><meshLambertMaterial color={color} /></mesh>
    <mesh position={[0, 3.2, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.5, 0.6, 4]} /><meshLambertMaterial color="#7a4a3a" /></mesh>
    <mesh position={[0, 0.95, 1.14]} rotation={[-0.52, 0, 0]}><shapeGeometry args={[(() => { const sh = new THREE.Shape(); sh.moveTo(-0.55, -1); sh.lineTo(0.55, -1); sh.lineTo(0, 1); return sh; })()]} /><meshBasicMaterial color={lit ? '#ffd27a' : '#3a2c22'} /></mesh>
    {[[-1.0, 1.0, '#8c3b2c'], [0.95, 0.75, '#3f7a55']].map(([x, y, c], i) => <mesh key={i} position={[x as number, y as number, 1.2 - (y as number) * 0.5]} rotation={[-0.52, 0, 0.1]}><planeGeometry args={[0.5, 0.4]} /><meshLambertMaterial color={c as string} /></mesh>)}
  </group>
);
/** A campfire: stones, two logs, a flat flame in three tones whose outline is new on every frame (rule I44), and embers
 *  rising. f = frame. */
export const Campfire: React.FC<{pos?: V3; f: number; s?: number; seed?: number}> = ({pos = [0, 0, 0], f, s = 1, seed = 1}) => {
  const flame = (w: number, h: number, ph: number) => { const sh = new THREE.Shape(), N = 9; sh.moveTo(-w, 0);
    for (let i = 0; i <= N; i++) { const u = i / N, x = -w + 2 * w * u, env = Math.pow(Math.sin(u * Math.PI), 0.7), y = h * env * (0.55 + 0.45 * Math.abs(Math.sin(f * 1.9 + i * 2.3 + ph + seed))) * (i % 2 ? 1 : 0.62); sh.lineTo(x, Math.max(0.02, y)); }
    sh.lineTo(w, 0); return sh; };
  return (
    <group position={pos} scale={s}>
      {Array.from({length: 8}, (_, i) => { const a = (i / 8) * Math.PI * 2; return <FacetLathe key={i} profile={[[0.6, 0], [0.75, 0.3], [0.5, 0.6]]} sides={6} s={0.17} color="#6f7386" pos={[Math.cos(a) * 0.6, 0, Math.sin(a) * 0.45]} wobble={0.2} seed={i + seed} />; })}
      {[0.5, -0.6].map((r, i) => <mesh key={i} position={[0, 0.09, 0]} rotation={[0, r, 0.1]} castShadow><boxGeometry args={[0.95, 0.13, 0.15]} /><meshLambertMaterial color="#3b2a20" /></mesh>)}
      {([[0.44, 1.05, 0, '#e8552d'], [0.3, 0.72, 1.3, '#f6a52e'], [0.16, 0.4, 2.6, '#fde38a']] as [number, number, number, string][]).map(([w, h, ph, c], i) => <mesh key={i} position={[0, 0.12, 0.02 + i * 0.01]}><shapeGeometry args={[flame(w, h, ph)]} /><meshBasicMaterial color={c} /></mesh>)}
      {Array.from({length: 12}, (_, i) => { const life = 28 + (i % 5) * 6, q = f + i * 9 + seed * 5, u = (q % life) / life, c = Math.floor(q / life), x = (Math.sin(c * 12.9 + i * 4.1) * 0.5) * (0.3 + u) + Math.sin(u * 7 + i) * 0.05; return <mesh key={i} position={[x, 0.7 + u * 2.2, 0.05]} scale={1 - u * 0.7}><circleGeometry args={[0.025, 8]} /><meshBasicMaterial color="#f9b04a" /></mesh>; })}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0.2]}><circleGeometry args={[2.3, 36]} /><meshBasicMaterial color="#f2a35a" transparent opacity={0.2} depthWrite={false} /></mesh>
      <pointLight position={[0, 0.9, 0.5]} color="#ff9a4a" intensity={9} distance={9} decay={2} />
    </group>
  );
};
/** A covered wagon: boxes for the body and roof, flat discs for the wheels (form rule), a lit window. */
export const Wagon: React.FC<{pos?: V3; rotY?: number}> = ({pos = [0, 0, 0], rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <mesh position={[0, 1.4, 0]} castShadow receiveShadow><boxGeometry args={[3.0, 1.5, 1.6]} /><meshLambertMaterial color="#8e3024" /></mesh>
    <mesh position={[0, 2.26, 0]} castShadow><boxGeometry args={[3.3, 0.24, 1.9]} /><meshLambertMaterial color="#2f5a44" /></mesh>
    <mesh position={[-0.3, 1.5, 0.81]}><planeGeometry args={[0.8, 0.62]} /><meshBasicMaterial color="#ffe2a0" /></mesh>
    <mesh position={[-0.3, 1.5, 0.815]}><planeGeometry args={[0.05, 0.62]} /><meshBasicMaterial color="#5a3a22" /></mesh>
    {[-0.95, 0.95].map((x) => <group key={x} position={[x, 0.6, 0.86]}><mesh><circleGeometry args={[0.6, 20]} /><meshLambertMaterial color="#4a2c1e" /></mesh><mesh position={[0, 0, 0.005]}><circleGeometry args={[0.42, 20]} /><meshLambertMaterial color="#8a5a3a" /></mesh><mesh position={[0, 0, 0.01]}><circleGeometry args={[0.1, 10]} /><meshLambertMaterial color="#3a2218" /></mesh></group>)}
  </group>
);
/** A headstone with a snow cap and a carved inscription (real words: a set sign, rule J51). */
export const Headstone: React.FC<{pos?: V3; name: string; years?: string; s?: number}> = ({pos = [0, 0, 0], name, years, s = 1}) => {
  const slab = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(-0.58, 0); sh.lineTo(-0.58, 1.25); sh.absarc(0, 1.25, 0.58, Math.PI, 0, true); sh.lineTo(0.58, 0); return new THREE.ExtrudeGeometry(sh, {depth: 0.26, bevelEnabled: false}); }, []);
  const cap = useMemo(() => { const sh = new THREE.Shape(); sh.absarc(0, 1.25, 0.64, Math.PI * 0.94, Math.PI * 0.06, true); sh.absarc(0, 1.2, 0.58, Math.PI * 0.06, Math.PI * 0.94, false); return new THREE.ExtrudeGeometry(sh, {depth: 0.32, bevelEnabled: false}); }, []);
  const text = useMemo(() => { const c = document.createElement('canvas'); c.width = 512; c.height = 640; const g = c.getContext('2d')!; g.fillStyle = '#474b58'; g.textAlign = 'center'; const lines = name.toUpperCase().split('\n');
    lines.forEach((l, i) => { g.font = `900 ${i ? 70 : 88}px Georgia, "Times New Roman", serif`; g.fillText(l, 256, 130 + i * 100, 470); }); g.fillRect(96, 130 + lines.length * 100 - 44, 320, 8); if (years) { g.font = '700 56px Georgia, "Times New Roman", serif'; g.fillText(years, 256, 130 + lines.length * 100 + 60); }
    // wear: drip streaks under the cap, lichen spots, a crack
    g.fillStyle = 'rgba(60,64,78,0.35)'; [120, 250, 380].forEach((x) => g.fillRect(x, 0, 8, 46)); g.fillStyle = 'rgba(122,128,84,0.7)'; [[70, 470, 16], [100, 560, 12], [440, 380, 13]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    g.strokeStyle = 'rgba(60,64,78,0.7)'; g.lineWidth = 4; g.beginPath(); g.moveTo(470, 470); g.lineTo(420, 540); g.lineTo(440, 600); g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }, [name, years]);
  return (
    <group position={pos} scale={s}>
      <mesh geometry={slab} castShadow receiveShadow><meshLambertMaterial color="#9aa2ae" /></mesh>
      <mesh geometry={cap} position={[0, 0, -0.03]}><meshLambertMaterial color="#e6eaf2" /></mesh>
      <mesh position={[0, 0.98, 0.265]}><planeGeometry args={[0.98, 1.22]} /><meshBasicMaterial map={text} transparent /></mesh>
      <FacetLathe profile={[[1.0, 0], [0.86, 0.12], [0.4, 0.2]]} sides={9} s={0.95} color="#e6eaf2" pos={[-0.05, 0, 0.8]} squash={0.55} wobble={0.08} contact={false} />
    </group>
  );
};
/** Falling snow in three sizes; bigger flakes fall faster (reference: snowfall in 58 shots). f = frame. */
export const Snowfall: React.FC<{f: number; box?: [number, number, number, number]; count?: number; seed?: number}> = ({f, box = [-6, 12, -9, 11], count = 110, seed = 3}) => {
  const pts = useMemo(() => { const r = rndN(seed); return Array.from({length: count}, () => { const k = r(); return [r(), r(), r(), k < 0.6 ? 0.011 : k < 0.9 ? 0.017 : 0.026, 0.5 + r()] as const; }); }, [seed, count]);
  return <>{pts.map(([x, y, z, s, v], i) => { const yy = (((y - (f * v * (0.6 + s * 30))) / 260) % 1 + 1) % 1; return <mesh key={i} position={[box[0] + x * box[1] + Math.sin(f * 0.03 + i) * 0.05, yy * 5, box[2] + z * box[3]]}><circleGeometry args={[s, 8]} /><meshBasicMaterial color="#f4f6fb" /></mesh>; })}</>;
};
