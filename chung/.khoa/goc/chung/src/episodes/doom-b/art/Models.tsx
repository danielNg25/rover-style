import React from 'react';
import {Stage, StageCanvas, Rect, Poly, SignText} from '../../../kit';
import {Puppet} from '../../../puppet';
import {DOOM} from '../../../chars/_lib/doom';
import {VICTOR, VICTOR_FACE, VICTOR_H, VICTOR_BACK_H} from '../../../chars/_lib/doom-b-victor';
import {MOTHER, MOTHER_H} from '../../../chars/_lib/doom-b-mother';

/* Model sheet of episode doom-b (still "ep-doom-b-models"): every new puppet beside the ruler at the design's scale
 * (boy = 55 % of the ruler), each in two expressions / poses. Plain kit Stage, no set. */
const Label: React.FC<{x: number; t: string}> = ({x, t}) => <SignText text={t} pos={[x, -0.28, 0]} height={0.13} color="#3a3a3a" />;
const CURL = {lean: 5, squash: 0.05, parts: {arms: {y: -14, rot: -4}}};
const TentCard: React.FC<{x: number}> = ({x}) => (
  <Poly pts={[[-0.95, 0], [-0.75, 1.9], [0.75, 1.9], [0.95, 0]]} color="#e9c88f" pos={[x, 0, -0.05]} />
);

export const Models: React.FC<{extreme?: boolean}> = ({extreme}) => (
  <StageCanvas bg="#d9d3c4">
    <Stage cam={{pos: [0.3, 1.35, 12.6], look: [0.3, 1.35, 0], fov: 28}} f={0} len={1} mood="dayInterior" bg="#d9d3c4">
      <Rect w={40} h={0.02} color="#8a8474" pos={[0, 0, -0.1]} />
      <Puppet rig={DOOM} height={2.9} pos={[-4.1, 0, 0]} shadow={false} />
      <Puppet rig={VICTOR} height={VICTOR_H} pos={[-2.2, 0, 0]} shadow={false}
        pose={extreme ? {...VICTOR_FACE.squint, lean: 6, headTilt: 8, turn: 0.6, px: 1, py: -1} : VICTOR_FACE.glare} />
      <Puppet rig={VICTOR} height={VICTOR_H} pos={[-0.6, 0, 0]} shadow={false}
        pose={extreme ? {...VICTOR_FACE.sad, eyeOpen: 0.45, headTilt: -8, turn: -0.6, sel: {hands: 'cup'}, parts: {hands: {y: -60}}} : {...VICTOR_FACE.soft, py: 0.5, sel: {hands: 'cup'}}} />
      <Puppet rig={VICTOR} height={VICTOR_BACK_H} pos={[0.95, 0, 0]} shadow={false} pose={extreme ? {view: 'back', headTilt: 0, lean: 6, eyeOpen: 0} : {view: 'back'}} />
      {extreme ? <Puppet rig={VICTOR} height={VICTOR_H} pos={[0.95, 1.7, 0]} shadow={false} pose={{...VICTOR_FACE.wide, eyeOpen: 0}} /> : null}
      <TentCard x={2.75} /><TentCard x={4.75} />
      <Puppet rig={MOTHER} height={MOTHER_H} pos={[2.75, 0, 0]} shadow={false} pose={extreme ? {lean: -3, shL: 12} : {}} />
      <Puppet rig={MOTHER} height={MOTHER_H} pos={[4.75, 0, 0]} shadow={false} pose={CURL} />
      <Label x={-4.1} t="RULER 2.9" /><Label x={-2.2} t="VICTOR glare" /><Label x={-0.6} t="VICTOR soft + cup" />
      <Label x={0.95} t="VICTOR back" /><Label x={2.75} t="MOTHER rock" /><Label x={4.75} t="MOTHER curl" />
    </Stage>
  </StageCanvas>
);
export const ModelsExtreme: React.FC = () => <Models extreme />;
