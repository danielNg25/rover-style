import * as THREE from 'three';
import React, {useMemo} from 'react';
import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js';

export type PartPose = {rot?: number; x?: number; y?: number; sx?: number; sy?: number; hide?: boolean};
export type RigDef = {
  svg: string; // full <svg> markup; top-level <g id="part"> = rig parts, drawn in document order
  height: number; // svg px height of the character (feet y)
  footY: number; // svg y of the ground line
  centerX: number;
  parts?: Record<string, {parent?: string; pivot?: [number, number]}>;
};
type Layer = {geo: THREE.BufferGeometry; color: THREE.Color; opacity: number; part: string; order: number};

const Z_STEP = 0.0035;

/** Flat cut-out puppet built from SVG. World size: `worldHeight` units tall, origin at feet center. */
export const SvgRig: React.FC<{
  rig: RigDef;
  worldHeight: number;
  pose?: Record<string, PartPose>;
  pos?: [number, number, number];
  flip?: boolean;
  cast?: boolean;
}> = ({rig, worldHeight, pose = {}, pos = [0, 0, 0], flip, cast = true}) => {
  const layers = useMemo(() => {
    const data = new SVGLoader().parse(rig.svg);
    const out: Layer[] = [];
    let order = 0;
    for (const path of data.paths) {
      const node = (path.userData as any)?.node as Element | undefined;
      const style = (path.userData as any)?.style ?? {};
      let part = 'root';
      let el: Element | null | undefined = node;
      while (el && el.tagName !== 'svg') {
        if (el.tagName === 'g' && el.getAttribute('id')) part = el.getAttribute('id')!; // outermost id wins
        el = el.parentElement;
      }
      if (style.fill && style.fill !== 'none') {
        const shapes = SVGLoader.createShapes(path);
        const geo = new THREE.ShapeGeometry(shapes, 24);
        out.push({geo, color: new THREE.Color().setStyle(style.fill), opacity: (style.fillOpacity ?? 1) * (style.opacity ?? 1), part, order: order++});
      }
      if (style.stroke && style.stroke !== 'none') {
        for (const sub of path.subPaths) {
          const geo = SVGLoader.pointsToStroke(sub.getPoints(24), style);
          if (geo) out.push({geo, color: new THREE.Color().setStyle(style.stroke), opacity: style.strokeOpacity ?? 1, part, order: order++});
        }
      }
    }
    return out;
  }, [rig.svg]);

  const s = worldHeight / rig.height;
  const partNames = useMemo(() => Array.from(new Set(layers.map((l) => l.part))), [layers]);

  const renderPart = (name: string): React.ReactNode => {
    const def = rig.parts?.[name] ?? {};
    const pv = def.pivot ?? [rig.centerX, rig.footY];
    const p = pose[name] ?? {};
    if (p.hide) return null;
    const children = partNames.filter((n) => rig.parts?.[n]?.parent === name && n !== name);
    return (
      <group key={name} position={[pv[0] + (p.x ?? 0), pv[1] + (p.y ?? 0), 0]} rotation={[0, 0, ((p.rot ?? 0) * Math.PI) / 180]} scale={[p.sx ?? 1, p.sy ?? 1, 1]}>
        <group position={[-pv[0], -pv[1], 0]}>
          {layers.filter((l) => l.part === name).map((l) => (
            <mesh key={l.order} geometry={l.geo} position={[0, 0, -l.order * (Z_STEP / s)]} castShadow={cast && l.opacity > 0.9} renderOrder={l.order}>
              <meshBasicMaterial color={l.color} side={THREE.DoubleSide} fog={false} transparent={l.opacity < 1} opacity={l.opacity} depthWrite={l.opacity >= 1} />
            </mesh>
          ))}
          {children.map(renderPart)}
        </group>
      </group>
    );
  };
  const roots = partNames.filter((n) => !rig.parts?.[n]?.parent);
  // SVG y is down: flip Y. After flip, +z offset must go toward camera for later layers => negative local z (flipped by scale sign? no: only y flipped) -> use scale z = -1.
  return (
    <group position={pos} scale={[flip ? -s : s, -s, -s]}>
      <group position={[-rig.centerX, -rig.footY, 0]}>{roots.map(renderPart)}</group>
    </group>
  );
};
