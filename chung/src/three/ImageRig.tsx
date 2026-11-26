import React, {useEffect, useMemo, useState} from 'react';
import * as THREE from 'three';
import {delayRender, continueRender, staticFile} from 'remotion';
import {useThree} from '@react-three/fiber';
import type {PartPose} from './SvgRig';

/** One cut-out picture piece of a puppet. All numbers are in the puppet's "canvas" pixels (x right, y DOWN). */
export type ImgPart = {
  src: string;            // file in public/
  x: number; y: number;   // top-left of the piece on the canvas
  w: number;              // drawn width on the canvas (height follows the picture's aspect)
  h?: number;             // optional drawn height, to squash/stretch a piece
  pivot: [number, number];// joint the piece rotates around (canvas coords)
  parent?: string;        // piece this one is attached to
  z: number;              // stacking order, higher = closer to camera
  mirror?: boolean;       // flip the picture horizontally (reuse one arm for both sides)
};
export type ImgRigDef = {height: number; footY: number; centerX: number; parts: Record<string, ImgPart>};

const Z = 0.004;

/** Loads textures; holds the Remotion render until they are in and forces one redraw. */
export const useTextures = (srcs: string[]): Record<string, THREE.Texture> | null => {
  const key = srcs.join('|');
  const [tex, setTex] = useState<Record<string, THREE.Texture> | null>(null);
  const [handle] = useState(() => delayRender(`textures ${key.slice(0, 60)}`));
  const advance = useThree((st) => st.advance);
  useEffect(() => {
    let alive = true; const out: Record<string, THREE.Texture> = {}; let left = srcs.length;
    if (!left) { setTex({}); return; }
    srcs.forEach((s) => new THREE.TextureLoader().load(staticFile(s), (t) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; out[s] = t;
      if (--left === 0 && alive) setTex(out);
    }));
    return () => { alive = false; };
  }, [key]);
  useEffect(() => { if (tex) { advance(performance.now()); continueRender(handle); } }, [tex, advance, handle]);
  return tex;
};

/** Picture-based cut-out puppet. Same pose format as SvgRig: rot in degrees (positive = clockwise on screen), x/y offsets in canvas px. */
export const ImageRig: React.FC<{
  rig: ImgRigDef; worldHeight: number; pose?: Record<string, PartPose>; pos?: [number, number, number]; flip?: boolean;
}> = ({rig, worldHeight, pose = {}, pos = [0, 0, 0], flip}) => {
  const names = useMemo(() => Object.keys(rig.parts), [rig]);
  const tex = useTextures(useMemo(() => Array.from(new Set(names.map((n) => rig.parts[n].src))), [rig, names]));
  if (!tex) return null;
  const s = worldHeight / rig.height;
  const render = (name: string, parentPivot: [number, number]): React.ReactNode => {
    const p = rig.parts[name]; const ps = pose[name] ?? {};
    if (ps.hide) return null;
    const t = tex[p.src]; const img = t.image as HTMLImageElement;
    const hh = p.h ?? (p.w * img.height) / img.width;
    const kids = names.filter((n) => rig.parts[n].parent === name);
    return (
      <group key={name} position={[(p.pivot[0] - parentPivot[0] + (ps.x ?? 0)) * s, -(p.pivot[1] - parentPivot[1] + (ps.y ?? 0)) * s, 0]}
        rotation={[0, 0, (-(ps.rot ?? 0) * Math.PI) / 180]} scale={[ps.sx ?? 1, ps.sy ?? 1, 1]}>
        <mesh position={[(p.x + p.w / 2 - p.pivot[0]) * s, -(p.y + hh / 2 - p.pivot[1]) * s, p.z * Z]} scale={[p.mirror ? -1 : 1, 1, 1]} castShadow renderOrder={p.z}>
          <planeGeometry args={[p.w * s, hh * s]} />
          <meshBasicMaterial map={t} transparent alphaTest={0.04} side={THREE.DoubleSide} fog={false} />
        </mesh>
        {kids.map((k) => render(k, p.pivot))}
      </group>
    );
  };
  return (
    <group position={pos} scale={[flip ? -1 : 1, 1, 1]}>
      {names.filter((n) => !rig.parts[n].parent).map((n) => render(n, [rig.centerX, rig.footY]))}
    </group>
  );
};

/** Where a canvas point attached to `part` ends up in WORLD space for a given pose (follows the joint chain; ignores scale). */
export const rigPoint = (rig: ImgRigDef, pose: Record<string, PartPose>, part: string, pt: [number, number], worldHeight: number, pos: [number, number, number]): [number, number, number] => {
  let [x, y] = pt; let name: string | undefined = part;
  while (name) {
    const p: ImgPart = rig.parts[name]; const ps = pose[name] ?? {};
    const a = ((ps.rot ?? 0) * Math.PI) / 180, dx = x - p.pivot[0], dy = y - p.pivot[1];
    x = p.pivot[0] + dx * Math.cos(a) - dy * Math.sin(a) + (ps.x ?? 0);
    y = p.pivot[1] + dx * Math.sin(a) + dy * Math.cos(a) + (ps.y ?? 0);
    name = p.parent;
  }
  const s = worldHeight / rig.height;
  return [pos[0] + (x - rig.centerX) * s, pos[1] + (rig.footY - y) * s, pos[2] + 0.06];
};
