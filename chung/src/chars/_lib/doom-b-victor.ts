import type {PuppetRig, PuppetPiece, Num, PoseOf, Beat} from '../../puppet';
import {singlePicture} from '../../puppet';

/** BOY VICTOR (episode doom-b), the lead's child state. Pieces: public/doom-b/victor (sheet gen/doom-b-boy-front.png,
 *  cut 1:1, so canvas px = sheet px) and public/doom-b/camp/camp-victor-back.png (sheet gen/doom-b-camp-row.png).
 *  Canvas 900 x 1500, ground at y = 1478, 1478 tall: head (tuft to chin) 640 px, body 838 px = 1 : 1.3 (art/decisions.md).
 *  Stand him at VICTOR_H beside the ruler at 2.9 (55 %). For the S8 close frame the head and collar; the lower shawl
 *  (vic-lower.png, drawn in code, art/make_pieces.py) is only there so the full figure can stand in a wide.
 *  FACE: eye whites, nose and ears are part of the head picture. Separate: pupils, skin lids (eyeOpen < 0.95 shows them,
 *  blink beats work), the two heavy brows (DRAWN at the scowl angle: browL / browR = 0 IS the glare, negative values
 *  flatten them, see VICTOR_FACE), 4 mouths (mouth: 'closed' | 'o' | 'open' | 'flat'), and the hair again as an overlay
 *  above the lids. `turn` and `up` slide pupils, brows and mouth a few px only (whites are fixed): keep |turn| <= 0.6.
 *  Keep lean within -3 .. 3 (the figure leans rigidly about the ground; at 6 a hem corner dips under the floor line).
 *  NO ARMS: the only hands are the cupped pair (sel: {hands: 'cup'}), which rises out of the shawl front; move it with
 *  parts: {hands: {y: -40}}. Whole figure: lean, bob, squash, hop, shiver, headTilt / headX / headY work.
 *  view: 'back' = the small low figure seen from behind (one drawing; world height VICTOR_BACK_H at the same scale). */
const EYE = {L: 346.5, R: 553.5}, EYE_Y = 421.5, CX = 450;
const eye = (s: 'L' | 'R'): Record<string, PuppetPiece> => {
  const cx = EYE[s], l = s === 'L' ? 'l' : 'r';
  return {
    [`pupil${s}`]: {src: `doom-b/victor/vic-pupil-${l}.png`, x: cx - 31, y: EYE_Y - 31, w: 62, pivot: [cx, EYE_Y], parent: 'head', z: 5.2},
    [`lid${s}`]: {src: `doom-b/victor/vic-lid-${l}.png`, x: cx - 69.5, y: EYE_Y - 85, w: 139, h: 170, pivot: [cx, EYE_Y], parent: 'head', z: 5.3},
    [`brow${s}`]: {src: `doom-b/victor/vic-brow-${l}.png`, x: cx - 78, y: 350 - 48, w: 156, pivot: [cx, 350], parent: 'head', z: 5.6},
  };
};
const mouth = (id: string, w: number, y = 566): PuppetPiece => ({src: `doom-b/victor/vic-mouth-${id}.png`, x: CX - w / 2, y, w, pivot: [CX, y], parent: 'head', z: 5.2});

const VICTOR_BACK: PuppetRig = {...singlePicture({name: 'victor-back', src: 'doom-b/camp/camp-victor-back.png', size: [427, 501]}), shadow: {r: 190, sy: 0.25}};

export const VICTOR: PuppetRig = {
  name: 'victor', canvas: [900, 1500], groundY: 1478, centerX: CX, height: 1478,
  pieces: {
    lower: {src: 'doom-b/victor/vic-lower.png', x: 0, y: 1010, w: 900, h: 480, pivot: [CX, 1474], z: 1},
    bust: {src: 'doom-b/victor/vic-bust.png', x: 123, y: 590, w: 653, h: 451, pivot: [CX, 1030], parent: 'lower', z: 2},
    hands: {src: 'doom-b/victor/vic-hands.png', x: CX - 125, y: 900, w: 250, pivot: [CX, 950], parent: 'bust', z: 3},
    head: {src: 'doom-b/victor/vic-head.png', x: 106, y: 0, w: 663, h: 675, pivot: [CX, 640], parent: 'bust', z: 5},
    ...eye('L'), ...eye('R'),
    hair: {src: 'doom-b/victor/vic-hair.png', x: 106, y: 0, w: 663, h: 675, pivot: [CX, 640], parent: 'head', z: 5.4},
    mouthClosed: mouth('closed', 112), mouthO: mouth('o', 62, 550), mouthOpen: mouth('open', 88, 556), mouthFlat: mouth('flat', 104, 572),
  },
  roles: {body: ['lower'], head: 'head'},
  variants: {
    mouth: {default: 'closed', options: {closed: ['mouthClosed'], o: ['mouthO'], open: ['mouthOpen'], flat: ['mouthFlat']}},
    hands: {default: 'none', options: {none: [], cup: ['hands']}},
  },
  face: {
    base: 'head', mouth: ['mouthClosed', 'mouthO', 'mouthOpen', 'mouthFlat'],
    eyes: {L: {pupil: 'pupilL', lid: 'lidL', brow: 'browL'}, R: {pupil: 'pupilR', lid: 'lidR', brow: 'browR'}},
    parallax: {base: [0, 0], eyes: [6, 4], nose: [0, 0], mouth: [9, 4]},
    pupilTravel: [17, 30], farNarrow: 0, nearWiden: 0, lidTravel: 152,
  },
  limits: {turn: [-0.7, 0.7], headTilt: [-10, 10], lean: [-6, 6]},
  shadow: {r: 400, sy: 0.22},
  points: {top: {piece: 'head', at: [CX, 10]}, mouth: {piece: 'head', at: [CX, 566]}, cup: {piece: 'hands', at: [CX, 925]}, nose: {piece: 'head', at: [448, 473]}},
  views: {back: VICTOR_BACK},
};

/** world heights at the design's scale (ruler 2.9): standing boy 55 %; the back view is the same boy low on the ground */
export const VICTOR_H = 2.9 * 0.55;
export const VICTOR_BACK_H = VICTOR_H * (501 * (663 / 300)) / 1478; // his head is 300 px wide on the back drawing, 663 on the front

/** face presets: spread into a beat ({f: 12, ...VICTOR_FACE.soft}). `glare` is his default (the mask's brows). */
export const VICTOR_FACE: Record<'glare' | 'soft' | 'sad' | 'squint' | 'wide', Partial<Num> & {mouth: 'closed' | 'o' | 'open' | 'flat'}> = {
  glare: {eyeOpen: 1, browL: 0, browR: 0, browYL: 0, browYR: 0, mouth: 'closed'},
  soft: {eyeOpen: 1, browL: -24, browR: -24, browYL: 34, browYR: 34, mouth: 'o'},
  wide: {eyeOpen: 1, browL: -18, browR: -18, browYL: 46, browYR: 46, mouth: 'open'},
  sad: {eyeOpen: 0.8, browL: -40, browR: -40, browYL: 16, browYR: 16, mouth: 'closed'},
  squint: {eyeOpen: 0.6, browL: 4, browR: 4, browYL: -8, browYR: -8, mouth: 'flat'},
};
type VM = 'closed' | 'o' | 'open' | 'flat';
export type VictorPose = PoseOf<{mouth: VM; view: 'front' | 'back'; sel: {mouth: VM; hands: 'none' | 'cup'}}>;
export type VictorBeat = VictorPose & Pick<Beat, 'f' | 'note' | 'blink' | 'n' | 'dip'>;
