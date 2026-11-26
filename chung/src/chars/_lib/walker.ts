import type {PuppetRig, PuppetPiece, PoseOf, Beat} from '../../puppet';

/** WALKER: a TEST RIG made only of flat shapes (no art), side view facing screen right. It exists to exercise what the
 *  picture rigs do not have: separate legs (thigh, shin, foot) for walk(), a hips role (the torso bobs above planted
 *  legs), head-following hair, a one-eyed profile face, and a held prop as a rig piece in a variant group.
 *  Copy its structure for a legged character; replace the shapes by picture pieces. Canvas 300 x 520, 500 tall. */
const leg = (s: 'L' | 'R', fill: string, z: number): Record<string, PuppetPiece> => {
  const x = s === 'L' ? 146 : 154; // L = the near leg
  return {
    [`thigh${s}`]: {shape: 'rect', fill, x: x - 15, y: 296, w: 30, h: 116, pivot: [x, 304], z},
    [`shin${s}`]: {shape: 'rect', fill, x: x - 12, y: 400, w: 24, h: 104, pivot: [x, 406], parent: `thigh${s}`, z: z + 0.1},
    [`foot${s}`]: {shape: 'rect', fill: '#3a2f2a', x: x - 14, y: 500, w: 50, h: 20, pivot: [x, 504], parent: `shin${s}`, z: z + 0.2},
  };
};
export const WALKER: PuppetRig = {
  name: 'walker', canvas: [300, 520], groundY: 520, centerX: 150, height: 500,
  pieces: {
    ...leg('R', '#2f3a55', 0.5), ...leg('L', '#3d4a6b', 1.5),
    armR: {shape: 'rect', fill: '#2f6048', x: 140, y: 160, w: 22, h: 120, pivot: [151, 170], parent: 'torso', z: 1},
    torso: {shape: 'rect', fill: '#3f7a57', x: 114, y: 148, w: 72, h: 172, pivot: [150, 312], z: 2},
    hair: {shape: 'ellipse', fill: '#5a3c2e', x: 92, y: 52, w: 44, h: 150, pivot: [118, 66], parent: 'head', z: 2.5},
    head: {shape: 'ellipse', fill: '#f0c9a0', x: 106, y: 34, w: 96, h: 112, pivot: [150, 150], parent: 'torso', z: 3},
    cap: {shape: 'ellipse', fill: '#5a3c2e', x: 100, y: 26, w: 100, h: 62, pivot: [150, 60], parent: 'head', z: 3.2},
    eye: {shape: 'ellipse', fill: '#22222c', x: 172, y: 86, w: 12, h: 14, pivot: [178, 93], parent: 'head', z: 3.4},
    armL: {shape: 'rect', fill: '#4a8c66', x: 139, y: 160, w: 24, h: 120, pivot: [151, 170], parent: 'torso', z: 4},
    handL: {shape: 'ellipse', fill: '#f0c9a0', x: 138, y: 268, w: 26, h: 26, pivot: [151, 281], parent: 'armL', z: 4.2},
    // held prop: a rig piece on the hand, in a variant group, between the arm (z 4) and the hand (z 4.2)
    staff: {shape: 'rect', fill: '#8a6444', x: 147, y: 150, w: 8, h: 300, pivot: [151, 281], parent: 'armL', z: 4.1},
  },
  roles: {
    body: ['torso'], hips: ['torso'], head: 'head', cloth: [{piece: 'hair', follows: 'head'}],
    arms: {L: {upper: ['armL']}, R: {upper: ['armR']}},
    legs: {L: {upper: ['thighL'], lower: ['shinL'], end: ['footL']}, R: {upper: ['thighR'], lower: ['shinR'], end: ['footR']}},
  },
  variants: {prop: {default: 'none', options: {none: [], staff: ['staff']}}},
  face: {eyes: {L: {pupil: 'eye'}}, parallax: {base: [0, 0], eyes: [3, 2], nose: [0, 0], mouth: [0, 0]}, pupilTravel: [3, 2]},
  shadow: {r: 120, sy: 0.3},
  points: {palmL: {piece: 'handL', at: [151, 281]}, top: {piece: 'head', at: [150, 30]}},
};
export type WalkerPose = PoseOf<{view: 'front'; sel: {prop: 'none' | 'staff'}}>;
export type WalkerBeat = WalkerPose & Pick<Beat, 'f' | 'note' | 'blink' | 'n' | 'dip'>;
