import React from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

export type V3 = [number, number, number];
export const Cam: React.FC<{pos: V3; look: V3; fov: number}> = ({pos, look, fov}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos); c.fov = fov; c.near = 0.5; c.far = 500; c.lookAt(...look); c.updateProjectionMatrix();
  return null;
};
export const Lights: React.FC = () => (
  <>
    <hemisphereLight args={['#fffdf6', '#c2bfe0', 1.6]} />
    <directionalLight position={[-6, 18, 12]} intensity={2.05} color={'#fff4e0'} castShadow
      shadow-mapSize={[2048, 2048]} shadow-radius={10} shadow-blurSamples={18} shadow-bias={-0.0006} shadow-normalBias={0.03}
      shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={26} shadow-camera-bottom={-12} shadow-camera-near={1} shadow-camera-far={80} />
  </>
);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
/** ease-out with a small overshoot (settle) */
export const outBack = (t: number, s = 1.6) => { const u = clamp01(t) - 1; return 1 + (s + 1) * u * u * u + s * u * u; };
export const inOut = (t: number) => { const u = clamp01(t); return u * u * (3 - 2 * u); };
/** value that goes a -> b between frames f0..f1 using `ease` */
export const tween = (f: number, f0: number, f1: number, a: number, b: number, ease: (t: number) => number = inOut) => lerp(a, b, ease((f - f0) / (f1 - f0)));
/** piecewise pose channel: keys = [[frame, value], ...]; moves use ease-out-back by default */
export const keys = (f: number, ks: [number, number][], ease: (t: number) => number = outBack) => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (f <= ks[i][0]) return tween(f, ks[i - 1][0], ks[i][0], ks[i - 1][1], ks[i][1], ease);
  return ks[ks.length - 1][1];
};

/** Pose-to-pose track: the value jumps to each key's value starting AT the key frame and settles over `n` frames
 *  (ease-out with a little overshoot), then holds. keys = [[frame, value], ...] sorted by frame. */
export const track = (f: number, ks: [number, number][], n = 5, ease: (t: number) => number = outBack) => {
  let v = ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [k, target] = ks[i];
    if (f < k) break;
    v = lerp(v, target, ease((f - k) / n));
  }
  return v;
};
/** Same, for a bag of named numbers: keys = [[frame, {a: 1, b: 2}], ...]; fields missing from a key keep their value. */
export const trackObj = <T extends Record<string, number>>(f: number, ks: [number, Partial<T>][], n = 5, ease: (t: number) => number = outBack): T => {
  const out: Record<string, number> = {};
  const names = new Set<string>(); ks.forEach(([, o]) => Object.keys(o).forEach((k) => names.add(k)));
  names.forEach((name) => {
    const list = ks.filter(([, o]) => o[name] !== undefined).map(([k, o]) => [k, o[name] as number] as [number, number]);
    out[name] = track(f, list, n, ease);
  });
  return out as T;
};
/** tiny organic drift: sum of two sines, amplitude 1 */
export const drift = (f: number, seed = 0) => 0.6 * Math.sin(f * 0.11 + seed * 1.7) + 0.4 * Math.sin(f * 0.047 + seed * 3.1 + 1.3);
