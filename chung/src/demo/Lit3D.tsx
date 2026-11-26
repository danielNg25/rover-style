import React, {useMemo} from 'react';
import {AbsoluteFill, Still, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

/** TEST (2026-11-21): a character built as simple LIT 3D volumes with flat face features, standing in a set lit by real
 *  light sources (a campfire point light with shadows, a cool moon), to compare with the reference's look.
 *  Nothing here uses the kit: it is a look test, not engine code. */

type V3 = [number, number, number];
const SKIN = '#c9925f', HAIR = '#1d1512', SHIRT = '#e6d8b8', VEST = '#7c2c20', LEG = '#5a4636';

const M: React.FC<{c: string; em?: string; ei?: number}> = ({c, em, ei}) => (
  <meshStandardMaterial color={c} roughness={1} metalness={0} emissive={em ?? '#000000'} emissiveIntensity={ei ?? 0} side={THREE.DoubleSide} />
);
const Cam: React.FC<{pos: V3; look: V3; fov: number}> = ({pos, look, fov}) => {
  const {camera} = useThree(); const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos); c.fov = fov; c.near = 0.2; c.far = 300; c.lookAt(...look); c.updateProjectionMatrix();
  return null;
};
const Flat: React.FC<{pts: [number, number][]; c: string; pos?: V3; rot?: V3; lit?: boolean; em?: number}> = ({pts, c, pos, rot, lit, em}) => {
  const geo = useMemo(() => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); return new THREE.ShapeGeometry(s); }, [JSON.stringify(pts)]);
  return (
    <mesh geometry={geo} position={pos} rotation={rot}>
      {lit ? <meshStandardMaterial color={c} roughness={1} emissive={c} emissiveIntensity={em ?? 0.25} side={THREE.DoubleSide} /> : <meshBasicMaterial color={c} side={THREE.DoubleSide} fog={false} />}
    </mesh>
  );
};
const ellipse = (rx: number, ry: number, n = 40): [number, number][] => Array.from({length: n}, (_, i) => [Math.cos((i / n) * Math.PI * 2) * rx, Math.sin((i / n) * Math.PI * 2) * ry]);
/** part of an ellipse ABOVE the line y = y0 + slope * x: the heavy upper lid */
const lidShape = (rx: number, ry: number, y0: number, slope: number): [number, number][] => {
  const pts = ellipse(rx, ry, 64).filter(([x, y]) => y >= y0 + slope * x);
  return pts.sort((a, b) => Math.atan2(a[1] - 10, a[0]) - Math.atan2(b[1] - 10, b[0]));
};

/** The boy: origin at his feet, about 1.6 units tall. Head and body are lit volumes; the face is flat shapes on the head. */
const Boy3D: React.FC<{pos: V3; look?: [number, number]}> = ({pos, look = [-0.05, -0.035]}) => {
  const HY = 1.12, RX = 0.42, RY = 0.455, RZ = 0.40; // head centre height and radii
  const eye = (k: number) => {
    const ex = k * 0.166, ey = 0.045, slope = -k * 0.07; // lids slope down toward the outside: tired, sullen
    return (
      <group key={k} position={[ex, HY + ey, RZ - 0.012]}>
        <Flat pts={ellipse(0.155, 0.158)} c={'#f3eee0'} lit em={0.78} />
        {/* pupil with iris and a highlight, looking toward the fire */}
        <group position={[look[0], look[1], 0.004]}>
          <Flat pts={ellipse(0.052, 0.052, 24)} c={'#5c3a22'} lit em={0.7} />
          <Flat pts={ellipse(0.028, 0.028, 20)} c={'#1f130d'} pos={[0, 0, 0.002]} lit em={0.1} />
          <Flat pts={ellipse(0.011, 0.011, 12)} c={'#ffffff'} pos={[0.016, 0.018, 0.004]} />
        </group>
        {/* heavy upper lid: a grey-beige shape that cuts the eye straight across, with a darker lash line */}
        <Flat pts={lidShape(0.157, 0.16, 0.012, slope)} c={'#c9b49c'} pos={[0, 0, 0.008]} lit em={0.6} />
        <mesh position={[0, 0.012, 0.012]} rotation={[0, 0, Math.atan(slope)]}><planeGeometry args={[0.31, 0.014]} /><meshBasicMaterial color={'#6a4a36'} /></mesh>
      </group>
    );
  };
  const spikes: [number, number, number, number][] = [[-0.3, 0.33, 0.05, 0.9], [-0.17, 0.44, 0.1, 0.45], [0, 0.48, 0.12, 0], [0.17, 0.44, 0.1, -0.45], [0.3, 0.33, 0.05, -0.9], [-0.38, 0.16, -0.02, 1.3], [0.38, 0.16, -0.02, -1.3], [0.08, 0.46, -0.1, -0.2], [-0.1, 0.45, -0.12, 0.25]];
  return (
    <group position={pos}>
      {/* legs and shoes */}
      {[-1, 1].map((k) => (
        <group key={k}>
          <mesh position={[k * 0.11, 0.2, 0]} castShadow><cylinderGeometry args={[0.085, 0.08, 0.3, 14]} /><M c={LEG} /></mesh>
          <mesh position={[k * 0.115, 0.055, 0.05]} scale={[0.13, 0.07, 0.19]} castShadow><sphereGeometry args={[1, 16, 12]} /><M c={'#3a2a22'} /></mesh>
        </group>
      ))}
      {/* torso: cream shirt, open red-brown vest */}
      <mesh position={[0, 0.54, 0]} castShadow><cylinderGeometry args={[0.2, 0.245, 0.44, 20]} /><M c={SHIRT} /></mesh>
      <mesh position={[0, 0.54, 0]} castShadow><cylinderGeometry args={[0.216, 0.262, 0.42, 20, 1, true, 0.55, Math.PI * 2 - 1.1]} /><M c={VEST} /></mesh>
      <mesh position={[0, 0.76, 0]} castShadow><cylinderGeometry args={[0.13, 0.2, 0.06, 16]} /><M c={SHIRT} /></mesh>
      {/* arms and mitten hands */}
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.235, 0.7, 0]} rotation={[0, 0, k * 0.2]}>
          <mesh position={[0, -0.17, 0]} castShadow><capsuleGeometry args={[0.068, 0.24, 6, 12]} /><M c={SHIRT} /></mesh>
          <mesh position={[0, -0.38, 0.01]} scale={[1, 1.1, 0.9]} castShadow><sphereGeometry args={[0.083, 14, 12]} /><M c={SKIN} /></mesh>
        </group>
      ))}
      {/* head: one smooth lit volume, so the fire side goes warm and the far side falls into shade */}
      <mesh position={[0, HY, 0]} scale={[RX, RY, RZ]} castShadow receiveShadow><sphereGeometry args={[1, 48, 32]} /><M c={SKIN} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[k * 0.41, HY - 0.03, -0.02]} scale={[0.07, 0.095, 0.05]} castShadow><sphereGeometry args={[1, 14, 12]} /><M c={SKIN} /></mesh>)}
      {/* hair: a cap tipped back plus spikes */}
      <mesh position={[0, HY + 0.06, -0.06]} rotation={[-0.42, 0, 0]} scale={[RX * 1.05, RY * 1.04, RZ * 1.08]} castShadow><sphereGeometry args={[1, 40, 20, 0, Math.PI * 2, 0, 1.5]} /><M c={HAIR} /></mesh>
      {spikes.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, HY + y, z - 0.03]} rotation={[0, 0, r]} castShadow><coneGeometry args={[0.15, 0.26, 6]} /><M c={HAIR} /></mesh>
      ))}
      {/* fringe shapes on the forehead */}
      <Flat pts={[[-0.36, 0.3], [-0.2, 0.39], [0.02, 0.41], [0.24, 0.38], [0.37, 0.28], [0.3, 0.33], [0.2, 0.29], [0.1, 0.34], [-0.02, 0.28], [-0.14, 0.35], [-0.26, 0.29]]} c={HAIR} pos={[0, HY, RZ - 0.06]} lit em={0.05} />
      {eye(-1)}{eye(1)}
      {/* brows: thick dark strokes, one pressed low, one lifted */}
      <mesh position={[-0.17, HY + 0.255, RZ - 0.02]} rotation={[0, 0, 0.2]}><planeGeometry args={[0.22, 0.05]} /><meshBasicMaterial color={'#120d0a'} /></mesh>
      <mesh position={[0.18, HY + 0.275, RZ - 0.02]} rotation={[0, 0, -0.1]}><planeGeometry args={[0.2, 0.045]} /><meshBasicMaterial color={'#120d0a'} /></mesh>
      {/* mouth: one curved stroke, a frown */}
      <mesh position={[0.02, HY - 0.43, RZ - 0.035]} rotation={[0, 0, Math.PI * 0.2]}><torusGeometry args={[0.17, 0.012, 8, 28, Math.PI * 0.6]} /><meshBasicMaterial color={'#1a100c'} /></mesh>
    </group>
  );
};

// ---------------------------------------------------------------- 2D variant: flat cut-out pieces that take the scene's light
/** A flat piece whose colour is modulated like the reference's 2D puppets: scene ambient tint, a very soft form gradient,
 *  a warm rim on the side facing the light and a falloff on the far side. `c` and `r` give the piece's centre and size so
 *  the gradient is computed across the piece itself; the alpha is the piece's own silhouette. */
const LIGHT = {dir: new THREE.Vector2(-0.97, -0.24), col: new THREE.Color('#ff9a4a'), amb: new THREE.Color('#d9d4ea'), k: 0.42};
const LitFlat: React.FC<{pts: [number, number][]; color: string; pos?: V3; c?: [number, number]; r?: number; k?: number}> = ({pts, color, pos, c = [0, 0], r = 0.4, k = 1}) => {
  const geo = useMemo(() => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); return new THREE.ShapeGeometry(sh); }, [JSON.stringify(pts)]);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {uCol: {value: new THREE.Color(color)}, uAmb: {value: LIGHT.amb}, uLight: {value: LIGHT.col}, uDir: {value: LIGHT.dir.clone().normalize()}, uC: {value: new THREE.Vector2(c[0], c[1])}, uR: {value: r}, uK: {value: LIGHT.k * k}},
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vP; uniform vec3 uCol; uniform vec3 uAmb; uniform vec3 uLight; uniform vec2 uDir; uniform vec2 uC; uniform float uR; uniform float uK;
      void main(){
        vec2 q = (vP - uC) / uR; float d = dot(q, uDir);
        vec3 col = uCol * uAmb;
        col *= 1.0 + 0.05 * q.y;                                   // soft form gradient: a touch lighter toward the top
        col *= 1.0 - 0.30 * smoothstep(0.05, 1.0, -d);             // far side falls off
        col += uCol * uLight * uK * smoothstep(0.25, 1.05, d);     // warm light on the side facing the fire
        col += uLight * uK * 0.55 * smoothstep(0.80, 1.02, d);     // a thin brighter rim at the very edge
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  }), [color, c[0], c[1], r, k]);
  return <mesh geometry={geo} material={mat} position={pos} />;
};
const rrect = (w: number, h: number, rad: number, cx = 0, cy = 0): [number, number][] => {
  const out: [number, number][] = []; const cs: [number, number, number][] = [[w / 2 - rad, h / 2 - rad, 0], [-w / 2 + rad, h / 2 - rad, 1], [-w / 2 + rad, -h / 2 + rad, 2], [w / 2 - rad, -h / 2 + rad, 3]];
  cs.forEach(([x, y, q]) => { for (let i = 0; i <= 6; i++) { const a = (q + i / 6) * Math.PI / 2; out.push([cx + x + Math.cos(a) * rad, cy + y + Math.sin(a) * rad]); } });
  return out;
};
const off = (pts: [number, number][], dx: number, dy: number): [number, number][] => pts.map(([x, y]) => [x + dx, y + dy]);

/** The same boy as flat 2D pieces (a cut-out puppet), lit by the shader above; soft directional ground shadow. */
const Boy2D: React.FC<{pos: V3; look?: [number, number]}> = ({pos, look = [-0.05, -0.035]}) => {
  const HY = 1.12; const z = (i: number) => i * 0.004;
  const hair: [number, number][] = [[-0.45, -0.1], [-0.5, 0.1], [-0.44, 0.2], [-0.55, 0.32], [-0.4, 0.36], [-0.43, 0.54], [-0.26, 0.47], [-0.2, 0.66], [-0.06, 0.52], [0.05, 0.68], [0.15, 0.52], [0.3, 0.63], [0.31, 0.46], [0.47, 0.5], [0.42, 0.34], [0.55, 0.28], [0.46, 0.16], [0.5, 0.0], [0.42, -0.1], [0.41, 0.12], [0.3, 0.27], [0.12, 0.34], [-0.1, 0.31], [-0.3, 0.25], [-0.41, 0.1], [-0.42, -0.08]];
  const eye = (k: number) => {
    const ex = k * 0.166, ey = 0.045, slope = -k * 0.07;
    return (
      <group key={k} position={[ex, HY + ey, z(8)]}>
        <Flat pts={ellipse(0.155, 0.158)} c={'#f3eee0'} />
        <group position={[look[0], look[1], 0.002]}>
          <Flat pts={ellipse(0.052, 0.052, 24)} c={'#5c3a22'} /><Flat pts={ellipse(0.028, 0.028, 20)} c={'#1f130d'} pos={[0, 0, 0.001]} /><Flat pts={ellipse(0.011, 0.011, 12)} c={'#ffffff'} pos={[0.016, 0.018, 0.002]} />
        </group>
        <Flat pts={lidShape(0.157, 0.16, 0.012, slope)} c={'#c9b49c'} pos={[0, 0, 0.004]} />
        <mesh position={[0, 0.012, 0.006]} rotation={[0, 0, Math.atan(slope)]}><planeGeometry args={[0.31, 0.014]} /><meshBasicMaterial color={'#6a4a36'} /></mesh>
      </group>
    );
  };
  return (
    <group position={pos}>
      {/* ground shadow: soft, thrown away from the fire */}
      {[1, 0.75, 0.5].map((k, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0.34, 0.016 + i * 0.001, -0.02]} scale={[1.5 * k, 0.5 * k, 1]}><circleGeometry args={[0.42, 28]} /><meshBasicMaterial color={'#2a2f5c'} transparent opacity={0.2} depthWrite={false} /></mesh>)}
      <LitFlat pts={rrect(0.17, 0.34, 0.05, -0.11, 0.2)} color={LEG} pos={[0, 0, z(0)]} c={[-0.11, 0.2]} r={0.14} />
      <LitFlat pts={rrect(0.17, 0.34, 0.05, 0.11, 0.2)} color={LEG} pos={[0, 0, z(0)]} c={[0.11, 0.2]} r={0.14} />
      <LitFlat pts={ellipse(0.14, 0.065).map(([x, y]) => [x - 0.125, y + 0.055] as [number, number])} color={'#3a2a22'} pos={[0, 0, z(1)]} c={[-0.125, 0.055]} r={0.14} />
      <LitFlat pts={ellipse(0.14, 0.065).map(([x, y]) => [x + 0.125, y + 0.055] as [number, number])} color={'#3a2a22'} pos={[0, 0, z(1)]} c={[0.125, 0.055]} r={0.14} />
      {/* arms behind the torso, hands */}
      {[-1, 1].map((k) => (
        <group key={k}>
          <LitFlat pts={rrect(0.15, 0.4, 0.07, k * 0.27, 0.56)} color={SHIRT} pos={[0, 0, z(2)]} c={[k * 0.27, 0.56]} r={0.2} />
          <LitFlat pts={ellipse(0.085, 0.09).map(([x, y]) => [x + k * 0.29, y + 0.34] as [number, number])} color={SKIN} pos={[0, 0, z(3)]} c={[k * 0.29, 0.34]} r={0.09} />
        </group>
      ))}
      <LitFlat pts={[[-0.2, 0.78], [0.2, 0.78], [0.26, 0.32], [-0.26, 0.32]]} color={SHIRT} pos={[0, 0, z(4)]} c={[0, 0.55]} r={0.3} />
      <LitFlat pts={[[-0.2, 0.78], [-0.07, 0.78], [-0.1, 0.32], [-0.26, 0.32]]} color={VEST} pos={[0, 0, z(5)]} c={[0, 0.55]} r={0.3} />
      <LitFlat pts={[[0.2, 0.78], [0.07, 0.78], [0.1, 0.32], [0.26, 0.32]]} color={VEST} pos={[0, 0, z(5)]} c={[0, 0.55]} r={0.3} />
      {/* head, ears, hair */}
      {[-1, 1].map((k) => <LitFlat key={k} pts={ellipse(0.075, 0.1).map(([x, y]) => [x + k * 0.41, y + HY - 0.03] as [number, number])} color={SKIN} pos={[0, 0, z(5)]} c={[0, HY]} r={0.46} />)}
      <LitFlat pts={off(ellipse(0.42, 0.455, 56), 0, HY)} color={SKIN} pos={[0, 0, z(6)]} c={[0, HY]} r={0.45} />
      <LitFlat pts={off(hair, 0, HY)} color={'#2a1e19'} pos={[0, 0, z(7)]} c={[0, HY + 0.2]} r={0.6} k={0.55} />
      {eye(-1)}{eye(1)}
      <mesh position={[-0.17, HY + 0.255, z(10)]} rotation={[0, 0, 0.2]}><planeGeometry args={[0.22, 0.05]} /><meshBasicMaterial color={'#120d0a'} /></mesh>
      <mesh position={[0.18, HY + 0.275, z(10)]} rotation={[0, 0, -0.1]}><planeGeometry args={[0.2, 0.045]} /><meshBasicMaterial color={'#120d0a'} /></mesh>
      <mesh position={[0.02, HY - 0.43, z(10)]} rotation={[0, 0, Math.PI * 0.2]}><torusGeometry args={[0.17, 0.012, 8, 28, Math.PI * 0.6]} /><meshBasicMaterial color={'#1a100c'} /></mesh>
    </group>
  );
};

const rnd = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

const Tent: React.FC<{pos: V3; s?: number; lit?: boolean}> = ({pos, s = 1, lit}) => (
  <group position={pos} scale={s}>
    <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow><coneGeometry args={[2.3, 3.1, 4]} /><M c={'#b89a68'} /></mesh>
    <mesh position={[0, 3.0, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.62, 0.8, 4]} /><M c={'#e8eefc'} /></mesh>
    {/* the opening glows from a lamp inside */}
    <Flat pts={[[-0.5, 0], [0.5, 0], [0, 1.9]]} c={lit ? '#ffd27a' : '#3a2c22'} pos={[0, 0.02, 1.66]} rot={[-0.52, 0, 0]} />
    {lit ? <pointLight position={[0, 0.9, 2.1]} color={'#ffc46a'} intensity={5} distance={7} decay={2} /> : null}
    {[[-0.9, 1.0, 0.5], [0.8, 0.7, 0.42]].map(([x, y, w], i) => <mesh key={i} position={[x, y, 1.66 - y * 0.52 + 0.06]} rotation={[-0.52, 0, 0.1]}><planeGeometry args={[w, w * 0.8]} /><M c={i ? '#8c3b2c' : '#3f7a55'} /></mesh>)}
  </group>
);
const Pine: React.FC<{pos: V3; h: number}> = ({pos, h}) => (
  <group position={pos}>
    <mesh position={[0, h * 0.12, 0]}><cylinderGeometry args={[0.12, 0.16, h * 0.24, 6]} /><M c={'#2a1d18'} /></mesh>
    {[0, 1, 2].map((i) => (
      <group key={i}>
        <mesh position={[0, h * (0.36 + i * 0.22), 0]} castShadow><coneGeometry args={[h * (0.3 - i * 0.07), h * 0.42, 7]} /><M c={'#1c3a38'} /></mesh>
        <mesh position={[0.05, h * (0.44 + i * 0.22), 0.05]}><coneGeometry args={[h * (0.2 - i * 0.05), h * 0.2, 7]} /><M c={'#dfe7f8'} /></mesh>
      </group>
    ))}
  </group>
);

const Camp: React.FC = () => {
  const stars = useMemo(() => { const r = rnd(5); return Array.from({length: 70}, () => [(r() - 0.5) * 120, 14 + r() * 34, 0.1 + r() * 0.14] as const); }, []);
  const snow = useMemo(() => { const r = rnd(9); return Array.from({length: 60}, () => [(r() - 0.5) * 16, 0.3 + r() * 5.5, -5 + r() * 9, 0.018 + r() * 0.02] as const); }, []);
  const stones = Array.from({length: 9}, (_, i) => (i / 9) * Math.PI * 2);
  return (
    <group>
      {/* sky, stars, mountains: flat far cards, unlit */}
      <mesh position={[0, 20, -60]}><planeGeometry args={[240, 90]} /><meshBasicMaterial color={'#131a44'} /></mesh>
      {stars.map(([x, y, s], i) => <mesh key={i} position={[x, y, -59]} rotation={[0, 0, Math.PI / 4]}><planeGeometry args={[s, s]} /><meshBasicMaterial color={'#e8ecff'} /></mesh>)}
      <Flat pts={[[-70, 0], [-52, 15], [-40, 8], [-26, 20], [-12, 9], [2, 17], [16, 7], [30, 19], [44, 9], [58, 16], [70, 0]]} c={'#1b2556'} pos={[0, 1.5, -52]} />
      <Flat pts={[[-70, 0], [-48, 9], [-30, 4], [-14, 11], [4, 5], [22, 12], [40, 5], [56, 10], [70, 0]]} c={'#232f68'} pos={[0, 0.5, -42]} />
      {[[-26, 20], [2, 17], [30, 19]].map(([x, y], i) => <Flat key={i} pts={[[0, 0], [-4.5, -5], [-2, -4], [0, -6], [2.2, -4], [4.5, -5]]} c={'#8f9ccc'} pos={[x, y + 1.5, -51.8]} />)}
      {/* ground: snow that takes the light; a trodden patch round the fire */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[160, 160]} /><M c={'#cbd5ee'} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0.012, 0.2]} receiveShadow><circleGeometry args={[2.5, 36]} /><M c={'#8e7f79'} /></mesh>
      {[[-2.6, 2.2], [-3.3, 2.9], [-4.0, 3.3], [3.4, 2.4], [4.0, 3.0], [2.6, 3.6], [-0.8, 3.9]].map(([x, z], i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0.4]} position={[x, 0.014, z]} scale={[1, 0.6, 1]} receiveShadow><circleGeometry args={[0.13, 12]} /><M c={'#a9b5d6'} /></mesh>)}
      {/* campfire: logs, stones, flat flame shapes, tripod and pot, and the light it gives */}
      {stones.map((a, i) => <mesh key={i} position={[Math.cos(a) * 0.62, 0.09, Math.sin(a) * 0.62]} castShadow><dodecahedronGeometry args={[0.13, 0]} /><M c={'#6f7386'} /></mesh>)}
      {[0.3, 1.4, 2.5].map((r, i) => <mesh key={i} position={[0, 0.1, 0]} rotation={[0, r, 0.12]} castShadow><boxGeometry args={[0.95, 0.13, 0.15]} /><M c={'#3b2a20'} /></mesh>)}
      <Flat pts={[[-0.42, 0], [-0.5, 0.42], [-0.3, 0.3], [-0.2, 0.86], [-0.02, 0.5], [0.12, 1.06], [0.26, 0.48], [0.42, 0.7], [0.48, 0.25], [0.4, 0]]} c={'#e8502a'} pos={[0, 0.12, 0.02]} />
      <Flat pts={[[-0.3, 0], [-0.3, 0.3], [-0.16, 0.22], [-0.04, 0.62], [0.1, 0.34], [0.2, 0.7], [0.32, 0.28], [0.3, 0]]} c={'#f59a2c'} pos={[0, 0.12, 0.04]} />
      <Flat pts={[[-0.17, 0], [-0.14, 0.2], [-0.02, 0.4], [0.08, 0.2], [0.16, 0.36], [0.17, 0]]} c={'#ffd75a'} pos={[0, 0.12, 0.06]} />
      {[0, 2.1, 4.2].map((a, i) => <mesh key={i} position={[Math.cos(a) * 0.5, 1.15, Math.sin(a) * 0.5]} rotation={[Math.sin(a) * 0.42, 0, -Math.cos(a) * 0.42]} castShadow><cylinderGeometry args={[0.025, 0.025, 2.5, 6]} /><M c={'#2a211c'} /></mesh>)}
      <mesh position={[0, 1.25, 0]} castShadow><cylinderGeometry args={[0.2, 0.16, 0.26, 14]} /><M c={'#1d1d22'} /></mesh>
      <pointLight position={[0, 0.75, 0.25]} color={'#ff9a4a'} intensity={11} distance={22} decay={2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.004} shadow-radius={5} />
      {/* tents, wagon, stores */}
      <Tent pos={[-5.6, 0, -3.4]} lit /><Tent pos={[-1.6, 0, -6.4]} s={0.85} lit /><Tent pos={[-9.5, 0, -6]} s={0.8} />
      <group position={[5.4, 0, -2.6]}>
        <mesh position={[0, 1.45, 0]} castShadow receiveShadow><boxGeometry args={[3.0, 1.5, 1.6]} /><M c={'#8e3024'} /></mesh>
        <mesh position={[0, 2.3, 0]} castShadow><boxGeometry args={[3.3, 0.24, 1.9]} /><M c={'#2f5a44'} /></mesh>
        <mesh position={[0, 2.47, 0]}><boxGeometry args={[3.2, 0.12, 1.8]} /><M c={'#e4ebfa'} /></mesh>
        <mesh position={[-0.3, 1.55, 0.81]}><planeGeometry args={[0.8, 0.62]} /><meshBasicMaterial color={'#ffe2a0'} /></mesh>
        <mesh position={[-0.3, 1.55, 0.812]}><planeGeometry args={[0.04, 0.62]} /><meshBasicMaterial color={'#5a3a22'} /></mesh>
        <mesh position={[0.9, 1.3, 0.81]}><planeGeometry args={[0.5, 0.9]} /><M c={'#b4502e'} /></mesh>
        {[-0.95, 0.95].map((x, i) => <mesh key={i} position={[x, 0.62, 0.86]} castShadow><torusGeometry args={[0.52, 0.09, 8, 20]} /><M c={'#6a2c1e'} /></mesh>)}
        <pointLight position={[-0.3, 1.5, 1.4]} color={'#ffd08a'} intensity={4} distance={6} decay={2} />
      </group>
      {[[-3.4, 0.35, -1.2, 0.7], [-2.6, 0.3, -1.7, 0.6], [-3.2, 0.95, -1.3, 0.5]].map(([x, y, z, s], i) => <mesh key={i} position={[x, y, z]} rotation={[0, 0.3 * i, 0]} castShadow receiveShadow><boxGeometry args={[s, s, s]} /><M c={'#8a6238'} /></mesh>)}
      <mesh position={[-4.3, 0.45, -0.6]} castShadow><cylinderGeometry args={[0.36, 0.33, 0.9, 14]} /><M c={'#70492a'} /></mesh>
      {[[-1.9, -0.9], [-1.4, -1.3]].map(([x, z], i) => <mesh key={i} position={[x, 0.24, z]} scale={[0.3, 0.26, 0.26]} castShadow><sphereGeometry args={[1, 12, 10]} /><M c={'#a48c62'} /></mesh>)}
      {[[3.4, -1.0], [3.9, -1.0], [3.65, -0.72]].map(([x, z], i) => <mesh key={i} position={[x, 0.17 + (i === 2 ? 0.28 : 0), z + (i === 2 ? -0.28 : 0)]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.17, 0.17, 0.8, 10]} /><M c={'#9c6a3a'} /></mesh>)}
      {/* lantern on a post beside the boy */}
      <group position={[3.25, 0, -0.9]}>
        <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.04, 0.05, 2.4, 6]} /><M c={'#2a211c'} /></mesh>
        <mesh position={[0, 2.45, 0.12]}><boxGeometry args={[0.24, 0.34, 0.24]} /><meshBasicMaterial color={'#ffdc8c'} /></mesh>
        <mesh position={[0, 2.68, 0.12]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.23, 0.18, 4]} /><M c={'#3a2c22'} /></mesh>
        <pointLight position={[0, 2.4, 0.4]} color={'#ffc878'} intensity={3.5} distance={8} decay={2} />
      </group>
      {/* bunting between the tents and the wagon */}
      {Array.from({length: 13}, (_, i) => { const t = i / 12, x = -5.6 + t * 11, y = 3.3 - Math.sin(t * Math.PI) * 0.7, z = -3.2 + t * 0.7; return <Flat key={i} pts={[[-0.16, 0], [0.16, 0], [0, -0.34]]} c={['#b84a36', '#3f6a8a', '#c9a23c', '#3f7a55'][i % 4]} pos={[x, y, z]} lit em={0.12} />; })}
      {/* pines behind, falling snow */}
      {[[-13, -9, 5.5], [-7.5, -10.5, 6.5], [-3.5, -11, 5.2], [1.5, -10, 6.8], [5, -9.5, 5.6], [9, -8, 6.2], [12.5, -10, 5.4], [-11, -4, 4.6], [10.5, -4.5, 4.8]].map(([x, z, h], i) => <Pine key={i} pos={[x, 0, z]} h={h} />)}
      {snow.map(([x, y, z, s], i) => <mesh key={i} position={[x, y, z]}><circleGeometry args={[s, 8]} /><meshBasicMaterial color={'#eef2ff'} /></mesh>)}
      {/* night: cool and dim everywhere; the fire and lamps do the rest */}
      <hemisphereLight args={['#93a2e6', '#4d5282', 2.25]} />
      <directionalLight position={[-2, 4, 9]} color={'#ffe0c0'} intensity={0.55} />
      <directionalLight position={[9, 14, 3]} color={'#9bb2ff'} intensity={0.7} castShadow shadow-mapSize={[2048, 2048]} shadow-radius={6} shadow-bias={-0.0008}
        shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={12} shadow-camera-bottom={-8} shadow-camera-near={1} shadow-camera-far={40} />
    </group>
  );
};

const SHOTS: Record<string, {pos: V3; look: V3; fov: number}> = {
  close: {pos: [2.3, 1.15, 3.5], look: [1.55, 1.08, 0], fov: 30},
  wide: {pos: [0.5, 2.3, 10.5], look: [0.5, 1.15, 0], fov: 34},
};
export const Lit3D: React.FC<{shot: 'close' | 'wide'; flat2d?: boolean}> = ({shot, flat2d}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#131a44'}}>
      <ThreeCanvas width={width} height={height} flat shadows={{type: THREE.PCFSoftShadowMap}} gl={{antialias: true}}>
        <Cam {...SHOTS[shot]} />
        <Camp />
        {flat2d ? <Boy2D pos={[1.95, 0, 0.35]} /> : <Boy3D pos={[1.95, 0, 0.35]} />}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
export const Lit3DComps: React.FC = () => (
  <>
    <Still id="lit3d-close" component={Lit3D} width={1280} height={720} defaultProps={{shot: 'close'}} />
    <Still id="lit3d-wide" component={Lit3D} width={1280} height={720} defaultProps={{shot: 'wide'}} />
    <Still id="lit2d-close" component={Lit3D} width={1280} height={720} defaultProps={{shot: 'close', flat2d: true}} />
    <Still id="lit2d-wide" component={Lit3D} width={1280} height={720} defaultProps={{shot: 'wide', flat2d: true}} />
  </>
);
