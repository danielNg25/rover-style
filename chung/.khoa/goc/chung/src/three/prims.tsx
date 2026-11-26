import * as THREE from 'three';
import React, {useMemo} from 'react';

type V3 = [number, number, number];
type P = {pos?: V3; rot?: V3; color: string; cast?: boolean; receive?: boolean; unlit?: boolean; emissive?: string; emissiveIntensity?: number};

const Mat: React.FC<P> = ({color, unlit, emissive, emissiveIntensity}) =>
  unlit ? <meshBasicMaterial color={color} fog={false} /> : (
    <meshStandardMaterial color={color} roughness={1} metalness={0} flatShading emissive={emissive ?? '#000'} emissiveIntensity={emissiveIntensity ?? 0} />
  );

export const Box: React.FC<P & {size: V3}> = (p) => (
  <mesh position={p.pos} rotation={p.rot} castShadow={p.cast ?? true} receiveShadow={p.receive ?? true} userData={{noRecv: p.receive === false}}>
    <boxGeometry args={p.size} />
    <Mat {...p} />
  </mesh>
);
export const Cyl: React.FC<P & {r: number; r2?: number; h: number; seg?: number}> = (p) => (
  <mesh position={p.pos} rotation={p.rot} castShadow={p.cast ?? true} receiveShadow={p.receive ?? true} userData={{noRecv: p.receive === false}}>
    <cylinderGeometry args={[p.r2 ?? p.r, p.r, p.h, p.seg ?? 16]} />
    <Mat {...p} />
  </mesh>
);
export const Cone: React.FC<P & {r: number; h: number; seg?: number}> = (p) => (
  <mesh position={p.pos} rotation={p.rot} castShadow={p.cast ?? true} receiveShadow={p.receive ?? true} userData={{noRecv: p.receive === false}}>
    <coneGeometry args={[p.r, p.h, p.seg ?? 8]} />
    <Mat {...p} />
  </mesh>
);
export const Ball: React.FC<P & {r: number; seg?: number}> = (p) => (
  <mesh position={p.pos} castShadow={p.cast ?? true} receiveShadow={p.receive ?? true} userData={{noRecv: p.receive === false}}>
    <sphereGeometry args={[p.r, p.seg ?? 14, p.seg ?? 10]} />
    <Mat {...p} />
  </mesh>
);
/** Flat unlit polygon card (points in local XY). */
export const Poly: React.FC<{pts: [number, number][]; color: string; pos?: V3; rot?: V3; fog?: boolean; opacity?: number}> = ({pts, color, pos, rot, fog, opacity}) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    return new THREE.ShapeGeometry(s);
  }, [JSON.stringify(pts)]);
  return (
    <mesh geometry={geo} position={pos} rotation={rot}>
      <meshBasicMaterial color={color} fog={fog ?? true} side={THREE.DoubleSide} transparent={opacity !== undefined} opacity={opacity ?? 1} />
    </mesh>
  );
};
/** Flat ring arc (unlit). */
export const Arc: React.FC<{r1: number; r2: number; a0: number; a1: number; color: string; pos?: V3; fog?: boolean}> = ({r1, r2, a0, a1, color, pos, fog}) => (
  <mesh position={pos}>
    <ringGeometry args={[r1, r2, 48, 1, a0, a1 - a0]} />
    <meshBasicMaterial color={color} fog={fog ?? false} side={THREE.DoubleSide} />
  </mesh>
);

/** Soft additive glow blob (stack of transparent discs), always unlit. */
export const Glow: React.FC<{pos: V3; r: number; color: string; strength?: number}> = ({pos, r, color, strength = 1}) => (
  <group position={pos}>
    {[1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.12].map((k, i) => (
      <mesh key={i} position={[0, 0, i * 0.002]} renderOrder={900 + i}>
        <circleGeometry args={[r * k, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.055 * strength * (1 + i * 0.12)} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
    ))}
  </group>
);
/** Tiny unlit square speck (dust / star / sparkle), rotated 45deg = diamond. */
export const Speck: React.FC<{pos: V3; s: number; color?: string; opacity?: number}> = ({pos, s, color = '#fff7d6', opacity = 1}) => (
  <mesh position={pos} rotation={[0, 0, Math.PI / 4]} renderOrder={950}>
    <planeGeometry args={[s, s]} />
    <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} fog={false} depthWrite={opacity >= 1} />
  </mesh>
);
