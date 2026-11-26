import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {HallSeq} from './HallSeq';
import {ShotComp} from './shots/ShotComp';

/** The first 22.5 s of the reference, shot by shot (frame ranges are the reference's own cut points at 24 fps). */
const ORDER: {id: string; start: number; len: number; hall?: number}[] = [
  {id: 'earth', start: 0, len: 47},
  {id: 'hall-back', start: 47, len: 29, hall: 0},
  {id: 'maskcase', start: 76, len: 22},
  {id: 'alcove', start: 98, len: 44},
  {id: 'closeup', start: 142, len: 31},
  {id: 'king', start: 173, len: 59},
  {id: 'village', start: 232, len: 59},
  {id: 'savanna', start: 291, len: 22},
  {id: 'ocean', start: 313, len: 19},
  {id: 'sun', start: 332, len: 34},
  {id: 'hall-rest', start: 366, len: 174, hall: 29},
];
export const FULL_FRAMES = 540;

export const Full: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {ORDER.map((o) => (
      <Sequence key={o.id} from={o.start} durationInFrames={o.len} layout="none">
        {o.hall !== undefined ? <HallSeq from={o.hall} /> : <ShotComp shot={{id: o.id, len: o.len} as any} />}
      </Sequence>
    ))}
  </AbsoluteFill>
);
