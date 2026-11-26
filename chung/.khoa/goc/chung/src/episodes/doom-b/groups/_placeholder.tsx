import React from 'react';
import {Stage, KitShot, Liveness, camPush, camPull, camTruck, Rect, SignText} from '../../../kit';
import {SHOT} from '../shared';

/** PLACEHOLDER scene of a shot that is not built yet: a flat coloured card, the shot id as in-world text and the
 *  design's camera move at the design's speed. A builder replaces `placeholder(...)` by the real KitShot and keeps
 *  the id, the length and the export name. Delete this file when no group imports it any more. */
export const placeholder = (id: string, live: Liveness): KitShot => {
  const m = SHOT[id];
  const base = {pos: [0, 2, 12] as [number, number, number], look: [0, 2, 0] as [number, number, number], fov: 30};
  const cam = m.cam === 'pull' ? camPull(base, {pctPerSec: m.pct})
    : m.cam === 'truckRight' ? camTruck(base, {pctPerSec: m.pct, dir: 1})
    : m.cam === 'truckLeft' ? camTruck(base, {pctPerSec: m.pct, dir: -1})
    : camPush(base, {pctPerSec: m.pct});
  const Scene: React.FC<{f: number; t: number}> = ({f}) => (
    <Stage cam={cam} f={f} len={m.len} mood={m.mood} bg={m.tint} name={m.comp}>
      <Rect w={40} h={24} pos={[0, 2, -3]} color={m.tint} />
      <Rect w={40} h={5} pos={[0, -2.2, -2.9]} color="#3a3f58" />
      <SignText text={m.id} pos={[0, 2.7, 0]} height={1.5} color="#f3ead2" />
      <SignText text={`${m.group} ${m.f0}-${m.f1}`} pos={[0, 1.2, 0]} height={0.45} color="#f3ead2" />
      <SignText text="chưa dựng" pos={[0, 0.5, 0]} height={0.32} color="#f3ead2" />
    </Stage>
  );
  return {id: m.comp, len: m.len, bg: m.tint, Scene, liveness: live};
};
