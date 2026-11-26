import React, {useContext, useEffect, useMemo, useState} from 'react';
import * as THREE from 'three';
import {delayRender, continueRender, cancelRender, staticFile} from 'remotion';
import {useThree} from '@react-three/fiber';
import type {V3, Pt} from './math';
import {FlatMat, YDown, useOrder} from './shapes';

/** kit/pictures: PNG cut-outs (files under public/). Crisp alpha edge, no soft shadow by default. */
const cache = new Map<string, THREE.Texture>();
/** Loads a picture once and holds the render until it is in. A missing file cancels the render with its name. */
export const useTex = (src: string) => {
  const [tex, setTex] = useState<THREE.Texture | null>(cache.get(src) ?? null);
  const [handle] = useState(() => (cache.has(src) ? null : delayRender(`picture ${src}`)));
  const advance = useThree((st) => st.advance);
  useEffect(() => {
    if (tex) return;
    new THREE.TextureLoader().load(staticFile(src), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; cache.set(src, t); setTex(t); },
      undefined, () => cancelRender(new Error(`kit: missing picture public/${src}`)));
  }, [src]);
  useEffect(() => { if (tex && handle !== null) { advance(performance.now()); continueRender(handle); } }, [tex]);
  return tex;
};
const useCrop = (tex: THREE.Texture | null, crop?: [number, number, number, number]) => useMemo(() => {
  if (!tex || !crop) return tex;
  const [x0, y0, x1, y1] = crop, t = tex.clone(); t.repeat.set(x1 - x0, y1 - y0); t.offset.set(x0, 1 - y1); t.needsUpdate = true; return t;
}, [tex, crop?.join(',')]);

type Pic = {src: string; rot?: number; flip?: boolean; tint?: string; opacity?: number; hide?: boolean;
  /** keep only this window of the picture: [x0, y0, x1, y1] as fractions 0..1 from its top-left */
  crop?: [number, number, number, number]};
/** Free-standing picture in the set. height = world units; pivot = the point of the picture (fractions from its
 *  top-left, default bottom-centre [0.5, 1]) that sits on `pos` and that `rot` (degrees, clockwise) turns about.
 *  Children are placed in the picture's own pixels (x right, y down): put <Piece>s or flat shapes there. */
export const Card: React.FC<Pic & {height: number; pos?: V3; pivot?: Pt; cast?: boolean; order?: number; children?: React.ReactNode}> =
  ({src, height, pos = [0, 0, 0], rot = 0, flip, pivot = [0.5, 1], tint = '#ffffff', opacity = 1, hide, crop, cast = false, order, children}) => {
    const tex = useCrop(useTex(src), crop), ord = useOrder(order, opacity);
    if (!tex || hide) return null;
    const img = tex.image as HTMLImageElement, cw = crop ? crop[2] - crop[0] : 1, ch = crop ? crop[3] - crop[1] : 1;
    const pw = img.width * cw, ph = img.height * ch, w = (height * pw) / ph, k = height / ph, sx = flip ? -1 : 1;
    return (
      <group position={pos} rotation={[0, 0, (-rot * Math.PI) / 180]}>
        <group position={[(0.5 - pivot[0]) * w * sx, (pivot[1] - 0.5) * height, 0]}>
          <mesh scale={[sx, 1, 1]} castShadow={cast} renderOrder={ord}><planeGeometry args={[w, height]} /><FlatMat color={tint} opacity={opacity} map={tex} alphaTest={0.04} /></mesh>
          <group position={[(-w / 2) * sx, height / 2, 0.01]} scale={[k * sx, -k, k]}><YDown.Provider value={true}>{children}</YDown.Provider></group>
        </group>
      </group>
    );
  };
/** A picture piece inside a pixel space (Card children or RefPlane): `pivot` (in the piece's own pixels) sits on
 *  `at` (parent pixels) and the piece turns about it; rot in degrees clockwise; z stacks pieces (0.02 steps). */
export const Piece: React.FC<Pic & {at: Pt; pivot: Pt; scale?: number; sy?: number; z?: number}> =
  ({src, at, pivot, rot = 0, scale = 1, sy = 1, flip, z = 0.02, hide, crop, tint = '#ffffff', opacity = 1}) => {
    const tex = useCrop(useTex(src), crop);
    if (!tex || hide) return null;
    const img = tex.image as HTMLImageElement, w = img.width * (crop ? crop[2] - crop[0] : 1), h = img.height * (crop ? crop[3] - crop[1] : 1);
    const px = flip ? w - pivot[0] : pivot[0];
    return (
      <group position={[at[0], at[1], z]} rotation={[0, 0, (rot * Math.PI) / 180]} scale={[scale, scale * sy, 1]}>
        <mesh position={[w / 2 - px, h / 2 - pivot[1], 0]} scale={[flip ? -1 : 1, -1, 1]}><planeGeometry args={[w, h]} /><FlatMat color={tint} opacity={opacity} map={tex} alphaTest={0.04} /></mesh>
      </group>
    );
  };
/** internal: un-flips a child in a y-down plane */
export const Upright: React.FC<{children: React.ReactNode}> = ({children}) => { const yd = useContext(YDown); return <group scale={[1, yd ? -1 : 1, 1]}>{children}</group>; };
