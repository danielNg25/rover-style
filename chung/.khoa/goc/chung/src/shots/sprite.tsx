import React, {useEffect, useState} from 'react';
import * as THREE from 'three';
import {delayRender, continueRender, staticFile} from 'remotion';
import {useThree} from '@react-three/fiber';

const cache = new Map<string, THREE.Texture>();
/** Loads a texture once (blocking the render until it is in). */
export const useTex = (src: string) => {
  const [tex, setTex] = useState<THREE.Texture | null>(cache.get(src) ?? null); // a given hook instance must keep the same src
  const [handle] = useState(() => (cache.has(src) ? null : delayRender(`tex ${src}`)));
  useEffect(() => {
    if (tex) return;
    new THREE.TextureLoader().load(staticFile(src), (t) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; cache.set(src, t); setTex(t);
    });
  }, [src]);
  const advance = useThree((st) => st.advance);
  useEffect(() => { if (tex && handle !== null) { advance(performance.now()); continueRender(handle); } }, [tex]);
  return tex;
};

/** A picture piece placed inside an ImageCard's pixel space (x right, y DOWN, units = parent pixels).
 *  `pivot` is the point of this picture (its own pixels) that sits on `at` and that it rotates about; rot in degrees, clockwise. */
export const Piece: React.FC<{src: string; at: [number, number]; pivot: [number, number]; rot?: number; scale?: number; sy?: number; flip?: boolean; z?: number; hide?: boolean; crop?: number; tint?: string}> =
  ({src, at, pivot, rot = 0, scale = 1, sy = 1, flip, z = 0.02, hide, crop = 1, tint = '#ffffff'}) => {
    const tex0 = useTex(src);
    // crop < 1 keeps only the top part of the picture (a cloned texture with a shorter window)
    const tex = React.useMemo(() => {
      if (!tex0 || crop >= 1) return tex0;
      const t = tex0.clone(); t.repeat.set(1, crop); t.offset.set(0, 1 - crop); t.needsUpdate = true; return t;
    }, [tex0, crop]);
    if (!tex || hide) return null;
    const img = tex.image as HTMLImageElement; const w = img.width, h = img.height * crop;
    // flip mirrors the picture around its own vertical centre line; the pivot is given in the un-mirrored picture
    const px = flip ? w - pivot[0] : pivot[0];
    return (
      <group position={[at[0], at[1], z]} rotation={[0, 0, (rot * Math.PI) / 180]} scale={[scale, scale * sy, 1]}>
        <mesh position={[w / 2 - px, h / 2 - pivot[1], 0]} scale={[flip ? -1 : 1, -1, 1]} castShadow>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={tex} color={tint} transparent alphaTest={0.04} side={THREE.DoubleSide} fog={false} />
        </mesh>
      </group>
    );
  };

/** Free-standing flat picture in world space, origin at a chosen pivot (fraction of the picture, 0..1 from top-left). */
export const Card: React.FC<{src: string; height: number; pos: [number, number, number]; rot?: number; flip?: boolean; pivot?: [number, number]; opacity?: number; shadow?: boolean; tint?: string}> =
  ({src, height, pos, rot = 0, flip, pivot = [0.5, 1], opacity = 1, shadow = true, tint = '#ffffff'}) => {
    const tex = useTex(src);
    if (!tex) return null;
    const img = tex.image as HTMLImageElement; const w = (height * img.width) / img.height;
    return (
      <group position={pos} rotation={[0, 0, (-rot * Math.PI) / 180]}>
        <mesh position={[(0.5 - pivot[0]) * w * (flip ? -1 : 1), (pivot[1] - 0.5) * height, 0]} scale={[flip ? -1 : 1, 1, 1]} castShadow={shadow}>
          <planeGeometry args={[w, height]} />
          <meshBasicMaterial map={tex} color={tint} transparent alphaTest={0.04} opacity={opacity} side={THREE.DoubleSide} fog={false} depthWrite={opacity >= 1} />
        </mesh>
      </group>
    );
  };
