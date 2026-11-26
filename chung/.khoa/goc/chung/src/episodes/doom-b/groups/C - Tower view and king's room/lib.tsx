import React from 'react';
import type {CamPose, CamRig, RefSpace, V3, Pt} from '../../../../kit';
import {FPS} from '../../../../kit';

/** Group C helpers (own folder; reported as kit requests).
 *  Layer: children are placed in FRAME PIXELS of frame 0 (x right, y UP from the bottom edge of the frame) on a
 *  plane at world depth z, so every layer keeps a real depth and the camera gives true parallax. Unlike the kit's
 *  RefPlane it keeps y up, so Flame / Smoke / PopIn / Puff / ClothSway work inside it unchanged. */
export const Layer: React.FC<{m: RefSpace; z: number; children: React.ReactNode}> = ({m, z, children}) => (
  <group position={m.pt(0, m.h, z)} scale={m.len(1, z)}>{children}</group>
);
/** frame pixel (y down) -> layer coordinates (y up) */
export const Y = (y: number) => 720 - y;
export const P = (pts: [number, number][]): Pt[] => pts.map(([x, y]) => [x, 720 - y]);

/** Push toward a world point that is NOT on the lens axis: the point keeps its place on screen and grows by
 *  pctPerSec percent per second; the camera only translates and keeps looking straight down -z. (camPush pushes at
 *  the centre of the frame only.) */
export const camPushTo = (base: {pos: V3; fov: number}, target: V3, o: {pctPerSec?: number} = {}): CamRig => {
  const rig = ((f: number): CamPose => {
    const s = 1 + ((o.pctPerSec ?? 2) / 100) * (f / FPS);
    const pos: V3 = [target[0] + (base.pos[0] - target[0]) / s, target[1] + (base.pos[1] - target[1]) / s, target[2] + (base.pos[2] - target[2]) / s];
    return {pos, look: [pos[0], pos[1], target[2]], fov: base.fov};
  }) as CamRig;
  rig.shakes = [];
  return rig;
};
