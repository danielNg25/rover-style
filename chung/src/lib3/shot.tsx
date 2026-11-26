import React, {useRef, useLayoutEffect} from 'react';
import {AbsoluteFill, useVideoConfig, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Finish, GradeCtx, Grade, distanceFor} from './look';
import {ShotCtx, RiseCtx, VIEW} from './depth';
import {XoayCtx, NgocCtx, NangCtx, VongCtx, MayCtx} from './duongMay';
import {mayQuay, May} from './kieuMay';
import {headSpan} from '../mould/draw';
import type {Spec} from '../mould/draw';
import {AutoRecv} from './kit';

/** lib3/shot: ONE SET, MANY SHOTS. A set is built once for its wide view; a shot puts the camera somewhere else in it.
 *  Medium and close shots are framed from the HEAD of the person they are on (the head fills 30 % of the frame height in a
 *  medium shot, 50 % in a close one, with little room above it), and a close or medium single softens the set behind the
 *  figure: the set is drawn on its own layer and blurred, the figure is drawn sharp on top. Wides stay sharp throughout. */
type V3 = [number, number, number];
export type Subject = {pos: V3; height: number; spec: Pick<Spec, 'build' | 'hair'>};
/** Where the camera stands for a medium or close shot on one person. side = how far the person sits off centre, as a share of
 *  the frame width (0.12 = a little right of centre: leave the larger space on the side they look to). */
export const frameOn = (s: Subject, size: 'medium' | 'close', side = 0): V3 => {
  const hs = headSpan(s.spec), top = s.pos[1] + s.height * hs.top, head = s.height * hs.size;
  const Hh = size === 'medium' ? head / 0.3 : head / 0.5, cy = size === 'medium' ? top + 0.13 * Hh - 0.5 * Hh : top - head * 0.5 - 0.04 * Hh;
  return [s.pos[0] - side * Hh * (VIEW.W / VIEW.H), cy, s.pos[2] + distanceFor(Hh, 1)];
};
/** A point of a turned room (lib3/room: the room group is rotated by yaw, then moved so that `cam` sits at the origin) in world space. */
export const roomPoint = (yaw: number, cam: [number, number], p: V3): V3 => { const x = p[0] - cam[0], z = p[2] - cam[1], c = Math.cos(yaw), s = Math.sin(yaw); return [x * c + z * s, p[1], -x * s + z * c]; };
const BareCam: React.FC<{eye: V3; dx?: number; dz?: number}> = ({eye, dx = 0, dz = 0}) => { const c = useThree().camera as THREE.PerspectiveCamera; c.position.set(eye[0] + dx, eye[1], eye[2] + dz); c.fov = VIEW.fov; c.near = 0.1; c.far = 900; c.lookAt(eye[0] + dx, eye[1], eye[2] + dz - 100); c.updateProjectionMatrix(); return null; };

/** GHOST: draws its children with colour writes off. They are invisible but still fill the depth buffer and still cast
 *  shadows. Anything under a <Solid> inside it stays visible. This is how a soft-background shot keeps LIT figures: the back
 *  layer (blurred) draws the set with the figures as ghosts (their shadows fall on the set), the sharp layer draws the same
 *  set as a ghost with the figures solid (the set's lights reach them, and whatever stands in front still hides them).
 *  First worked out for the lab set (src/demo/Lab.tsx, `layer`); here for every set. */
export const Ghost: React.FC<{on?: boolean; children?: React.ReactNode}> = ({on = true, children}) => {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const walk = (o: THREE.Object3D, solid: boolean) => { const sd = solid || !!o.userData.solid, m = (o as THREE.Mesh).material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { x.colorWrite = sd || !on; }); o.children.forEach((q) => walk(q, sd)); };
    if (ref.current) walk(ref.current, false);
  });
  return <group ref={ref}>{children}</group>;
};
export const Solid: React.FC<{children?: React.ReactNode}> = ({children}) => <group userData={{solid: true}}>{children}</group>;
/** after the set's own camera has set its haze as background: none, so that the sharp layer is see-through */
const ClearBack: React.FC = () => { const {scene, gl} = useThree(); scene.background = null; gl.setClearColor(0x000000, 0); return null; };

/** One shot of a set. set = the set with whatever is put inside it (pass the figures through); figures = the people of the shot.
 *  eye = where the camera stands (from frameOn, or any position for another wide view); omit it for the set's own view.
 *  soft = blur of the set in pixels for a close or medium single (about 1.6 close, 1.0 medium); 0 = everything sharp.
 *  dx / dz = the slow slide and push during the shot, added to the eye.
 *  may = a named camera move (lib3/kieuMay: truot, day, keo, luon, theo, nang, ha, day-lia) over the whole shot, with D = metres
 *  from the camera to the subject; it is ADDED to dx / dz / yaw (and sets the tilt and rise of the camera). Without it nothing changes.
 *  rise = horizon pushed down by that share of the frame height (see RiseCtx): for tall things seen from near, with a figure
 *  large at the lower edge. Not for soft shots. A point at height y and distance D then sits at 0.5 + rise + (camera height - y) / (0.4986 D). */
export const Shot: React.FC<{set: (inside: React.ReactNode, cam: {dx: number; dz: number}) => React.ReactNode; figures: React.ReactNode; grade: Grade; eye?: V3; soft?: number; dx?: number; dz?: number; rise?: number; yaw?: number; may?: May; finish?: Omit<React.ComponentProps<typeof Finish>, 'children'>}> =
  ({set, figures, grade, eye, soft = 0, dx: dx0 = 0, dz: dz0 = 0, rise = 0, yaw: yaw0 = 0, may, finish}) => {
    const {width, height, durationInFrames, fps} = useVideoConfig(), f = useCurrentFrame(), m = may ? mayQuay(may.kieu, f, durationInFrames, may.D, may.muc, may.cung, fps) : null;
    const dx = m ? dx0 + m.dx : dx0, dz = m ? dz0 + m.dz : dz0, yaw = m ? yaw0 + m.yaw : yaw0, pitch = m ? m.pitch : 0, dy = m ? m.dy : 0;
    const vong = m && may!.kieu.startsWith('vong') ? {nen: m.nen, D: may!.D} : null;
    const wrap = (n: React.ReactNode) => <MayCtx.Provider value={m}><VongCtx.Provider value={vong}><XoayCtx.Provider value={yaw}><NgocCtx.Provider value={pitch}><NangCtx.Provider value={dy}><RiseCtx.Provider value={rise}>{eye ? <ShotCtx.Provider value={{eye}}>{n}</ShotCtx.Provider> : n}</RiseCtx.Provider></NangCtx.Provider></NgocCtx.Provider></XoayCtx.Provider></VongCtx.Provider></MayCtx.Provider>;
    if (!soft || !eye) return <AbsoluteFill><Finish {...finish}><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv />{wrap(set(figures, {dx, dz}))}</ThreeCanvas></Finish></AbsoluteFill>;
    return (
      <AbsoluteFill><Finish {...finish}>
        <AbsoluteFill style={{filter: `blur(${soft}px)`, transform: 'scale(1.012)'}}><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv />{wrap(set(<Ghost>{figures}</Ghost>, {dx, dz}))}</ThreeCanvas></AbsoluteFill>
        <AbsoluteFill><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true, alpha: true}}><AutoRecv />{wrap(<><Ghost>{set(<Solid>{figures}</Solid>, {dx, dz})}</Ghost><ClearBack /></>)}</ThreeCanvas></AbsoluteFill>
      </Finish></AbsoluteFill>
    );
  };
