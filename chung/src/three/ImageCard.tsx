import React, {useEffect, useState} from 'react';
import * as THREE from 'three';
import {delayRender, continueRender, staticFile} from 'remotion';
import {useThree} from '@react-three/fiber';

/** Flat picture card (PNG with alpha), origin at bottom-centre, `height` world units tall. Casts a cut-out shaped shadow. */
export const ImageCard: React.FC<{src: string; height: number; pos?: [number, number, number]; flip?: boolean; tilt?: number; children?: React.ReactNode}> = ({src, height, pos = [0, 0, 0], flip, tilt = 0, children}) => {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => delayRender(`texture ${src}`));
  useEffect(() => {
    new THREE.TextureLoader().load(staticFile(src), (t) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true;
      setTex(t);
    });
  }, [src]);
  const advance = useThree((st) => st.advance);
  // the canvas only redraws when Remotion changes frame, so force one draw once the texture is in, then release the render
  useEffect(() => { if (tex) { advance(performance.now()); continueRender(handle); } }, [tex, advance, handle]);
  if (!tex) return null;
  const img = tex.image as HTMLImageElement;
  const w = (height * img.width) / img.height;
  // children are placed in the picture's own pixel space via <CardSpace>-style helpers: (px, py) from the top-left of the image
  const k = height / img.height;
  return (
    <group position={pos} rotation={[0, 0, (-tilt * Math.PI) / 180]}>
      <mesh position={[0, height / 2, 0]} scale={[flip ? -1 : 1, 1, 1]} castShadow>
        <planeGeometry args={[w, height]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.04} side={THREE.DoubleSide} fog={false} />
      </mesh>
      {/* pixel-space overlay group: x right, y down, origin at the image's top-left, slightly in front */}
      <group position={[-w / 2, height, 0.01]} scale={[k, -k, 1]}>{children}</group>
    </group>
  );
};
