import React from 'react';
import {AbsoluteFill, Composition, Sequence} from 'remotion';
import {KitShot, shotComp} from '../../kit';
import {FPS, TOTAL_FRAMES, W, H, EP, SHOTS} from './shared';
import {S1, S2, S3, S4, S5} from './groups/A';
import {S7, S8, S10} from './groups/B';
import {S6, S9} from './groups/C';

/* Episode doom-b: the film (545 frames, 1280x720, 24 fps) as hard cuts between ten shots, one canvas per shot,
 * plus one composition per shot so each renders alone:
 *   ep-doom-b            the whole film
 *   ep-doom-b-s1 ... s10  one shot each, with its own length */

const BY_ID: Record<string, KitShot> = {S1, S2, S3, S4, S5, S6, S7, S8, S9, S10};

/** film order, with each shot's place in the film taken from shared.ts (design frame numbers) */
export const DOOM_B_SHOTS = SHOTS.map((m) => {
  const shot = BY_ID[m.id];
  if (!shot) throw new Error(`doom-b: no shot exported for ${m.id}`);
  if (shot.len !== m.len) throw new Error(`doom-b: ${m.id} is ${shot.len} frames, the design says ${m.len} (${m.f0}-${m.f1})`);
  if (shot.id !== m.comp) throw new Error(`doom-b: ${m.id} has id "${shot.id}", expected "${m.comp}"`);
  return {meta: m, shot, C: shotComp(shot)};
});
if (DOOM_B_SHOTS.reduce((a, s) => a + s.shot.len, 0) !== TOTAL_FRAMES) throw new Error('doom-b: shot lengths do not add up to 545');

export const DoomBFilm: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {DOOM_B_SHOTS.map(({meta, C}) => (
      <Sequence key={meta.id} from={meta.f0} durationInFrames={meta.len} name={meta.id}>
        <C />
      </Sequence>
    ))}
  </AbsoluteFill>
);

export const DoomBComps: React.FC = () => (
  <>
    <Composition id={EP} component={DoomBFilm} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} />
    {DOOM_B_SHOTS.map(({meta, shot, C}) => <Composition key={meta.id} id={shot.id} component={C} width={W} height={H} fps={FPS} durationInFrames={shot.len} />)}
  </>
);
