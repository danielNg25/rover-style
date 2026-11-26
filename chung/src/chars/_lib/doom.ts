import type {PuppetRig, PuppetPiece, Num, PoseOf, Beat} from '../../puppet';
import {singlePicture} from '../../puppet';

/** DOOM (green hood, grey metal mask) as DATA in the generic puppet format. Ported 1:1 from src/chars/doomImg.ts;
 *  same picture files (public/doom). Canvas 400 x 560, ground at y = 540, 520 tall.
 *  Covered face: he acts with eye slits, brows, pupils, head and hands; there is one mouth drawing (no flaps). */
const ARM_X = {L: 93, R: 307};
const arm = (s: 'L' | 'R'): Record<string, PuppetPiece> => {
  const cx = ARM_X[s], m = s === 'R';
  return {
    [`arm${s}`]: {src: 'doom/p-5.png', x: cx - 30, y: 266, w: 60, h: 80, pivot: [cx, 294], parent: 'body', z: 3, mirror: m},
    [`fore${s}`]: {src: 'doom/p-6.png', x: cx - 27, y: 334, w: 54, h: 74, pivot: [cx, 344], parent: `arm${s}`, z: 4, mirror: m},
    [`fist${s}`]: {src: 'doom/p-7.png', x: cx - 31, y: 392, w: 62, h: 68, pivot: [cx, 402], parent: `fore${s}`, z: 8, mirror: m},
    [`open${s}`]: {src: 'doom/open-down.png', x: cx - 41, y: 390, w: 82, pivot: [cx, 402], parent: `fore${s}`, z: 8, mirror: m},
    [`glow${s}`]: {src: 'doom/open-down-glow.png', x: cx - 41, y: 390, w: 82, pivot: [cx, 402], parent: `fore${s}`, z: 8, mirror: m},
  };
};
const EYE_X = {L: 162, R: 238}, EYE_Y = 120, BROW_Y = 101;
const eye = (s: 'L' | 'R'): Record<string, PuppetPiece> => {
  const cx = EYE_X[s], m = s === 'R';
  return {
    [`plate${s}`]: {src: 'doom/plate.png', x: cx - 32, y: EYE_Y - 16.5, w: 64, h: 33, pivot: [cx, EYE_Y], parent: 'mask', z: 6.2, mirror: m},
    [`slit${s}`]: {src: 'doom/slit.png', x: cx - 27, y: EYE_Y - 7.5, w: 54, h: 15, pivot: [cx, EYE_Y], parent: 'mask', z: 6.3},
    [`pupil${s}`]: {src: 'doom/pupil.png', x: cx - 5.8, y: EYE_Y - 5.8, w: 11.6, pivot: [cx, EYE_Y], parent: 'mask', z: 6.4},
    [`brow${s}`]: {src: 'doom/brow.png', x: cx - 32, y: BROW_Y - 6.5, w: 64, h: 13, pivot: [cx, BROW_Y], parent: 'mask', z: 6.5, mirror: m},
  };
};
const hands = (s: 'L' | 'R') => ({default: 'fist', options: {fist: [`fist${s}`], open: [`open${s}`], glow: [`glow${s}`]}});

export const DOOM: PuppetRig = {
  name: 'doom', canvas: [400, 560], groundY: 540, centerX: 200, height: 520,
  pieces: {
    cape: {src: 'doom/p-1.png', x: -40, y: 186, w: 480, h: 360, pivot: [200, 230], z: 0},
    legs: {src: 'doom/p-4.png', x: 100, y: 350, w: 200, pivot: [200, 400], z: 1},
    body: {src: 'doom/torso2.png', x: 85, y: 254, w: 230, h: 172, pivot: [200, 430], z: 2},
    ...arm('L'), ...arm('R'),
    hood: {src: 'doom/hood.png', x: 87, y: 18, w: 226, pivot: [200, 222], parent: 'body', z: 6},
    mask: {src: 'doom/mask.png', x: 116, y: 66, w: 168, h: 150, pivot: [200, 141], parent: 'hood', z: 6.1},
    ...eye('L'), ...eye('R'),
    nose: {src: 'doom/nose.png', x: 186, y: 112, w: 28, pivot: [200, 136], parent: 'mask', z: 6.45},
    mouth: {src: 'doom/mouth.png', x: 145, y: 153, w: 110, pivot: [200, 180], parent: 'mask', z: 6.3},
    mantle: {src: 'doom/p-3.png', x: 58, y: 214, w: 284, h: 88, pivot: [200, 222], parent: 'body', z: 7},
  },
  roles: {
    body: ['body'], head: 'hood', cloth: ['cape'], hem: ['cape'],
    arms: {
      L: {upper: ['armL'], lower: ['foreL'], end: ['fistL', 'openL', 'glowL']},
      R: {upper: ['armR'], lower: ['foreR'], end: ['fistR', 'openR', 'glowR']},
    },
  },
  variants: {handL: hands('L'), handR: hands('R')},
  face: {
    base: 'mask', nose: 'nose', mouth: 'mouth',
    eyes: {L: {plate: 'plateL', white: 'slitL', pupil: 'pupilL', brow: 'browL'}, R: {plate: 'plateR', white: 'slitR', pupil: 'pupilR', brow: 'browR'}},
    parallax: {base: [5, 1.5], eyes: [9, 3.5], nose: [17, 2.5], mouth: [10, 2.5]},
    pupilTravel: [18, 3], openScalesWhite: true,
  },
  // his neutral is the angry glare
  rest: {eyeSlant: 10, eyeOpen: 0.85, browL: 17, browR: 17, browYL: -2, browYR: -2},
  shadow: {r: 150, sy: 0.32},
  points: {palmL: {piece: 'openL', at: [93, 444]}, palmR: {piece: 'openR', at: [307, 444]}, top: {piece: 'hood', at: [200, 20]}, mouth: {piece: 'mouth', at: [200, 180]}},
  // back view: one whole drawing (public/doom/back.png): it can tilt, lean, squash, hop and fake-walk.
  // It has no points of its own: puppetAttach / puppetPoint fall back to the front points, mirrored
  views: {back: {...singlePicture({name: 'doom-back', src: 'doom/back.png', size: [927, 1450]}), shadow: {r: 400, sy: 0.32}}},
};

/** face presets: spread into a beat ({f: 12, ...DOOM_FACE.sad}) */
export const DOOM_FACE: Record<'angry' | 'neutral' | 'sad' | 'squint' | 'wide', Partial<Num>> = {
  angry: {eyeSlant: 10, eyeOpen: 0.85, browL: 17, browR: 17, browYL: -2, browYR: -2},
  neutral: {eyeSlant: 0, eyeOpen: 1, browL: 2, browR: 2, browYL: 1, browYR: 1},
  sad: {eyeSlant: -8, eyeOpen: 0.9, browL: -15, browR: -15, browYL: 3, browYR: 3},
  squint: {eyeSlant: 4, eyeOpen: 0.45, browL: 9, browR: 9, browYL: -3, browYR: -3},
  wide: {eyeSlant: -2, eyeOpen: 1.25, browL: -4, browR: -4, browYL: 6, browYR: 6},
};
/** DOOM's poses and beats with his real pick ids, so a typo fails in tsc: const BEATS: DoomBeat[] = [...] */
export type DoomPose = PoseOf<{handL: 'fist' | 'open' | 'glow'; handR: 'fist' | 'open' | 'glow'; view: 'front' | 'back'; sel: {handL: 'fist' | 'open' | 'glow'; handR: 'fist' | 'open' | 'glow'}}>;
export type DoomBeat = DoomPose & Pick<Beat, 'f' | 'note' | 'blink' | 'n' | 'dip'>;
