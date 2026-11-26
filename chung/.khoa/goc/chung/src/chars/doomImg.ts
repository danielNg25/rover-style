import type {ImgRigDef, ImgPart} from '../three/ImageRig';
import type {PartPose} from '../three/SvgRig';

// Proportions measured on the reference frame (fractions of total height 520):
// head 0.395, hood width 0.42, mantle 0.395-0.525 (width 0.47), belt 0.70, hem 0.77, arm thickness ~0.10, cape hem width 0.77.
const ARM_X = {L: 93, R: 307};
const arm = (side: 'L' | 'R'): Record<string, ImgPart> => {
  const cx = ARM_X[side], m = side === 'R';
  return {
    [`arm${side}`]: {src: 'doom/p-5.png', x: cx - 30, y: 266, w: 60, h: 80, pivot: [cx, 294], parent: 'body', z: 3, mirror: m},
    [`fore${side}`]: {src: 'doom/p-6.png', x: cx - 27, y: 334, w: 54, h: 74, pivot: [cx, 344], parent: `arm${side}`, z: 4, mirror: m},
    [`fist${side}`]: {src: 'doom/p-7.png', x: cx - 31, y: 392, w: 62, h: 68, pivot: [cx, 402], parent: `fore${side}`, z: 8, mirror: m},
    [`open${side}`]: {src: 'doom/open-down.png', x: cx - 41, y: 390, w: 82, pivot: [cx, 402], parent: `fore${side}`, z: 8, mirror: m},
    [`glow${side}`]: {src: 'doom/open-down-glow.png', x: cx - 41, y: 390, w: 82, pivot: [cx, 402], parent: `fore${side}`, z: 8, mirror: m},
  };
};
// face layout on the mask (the mask fills ~76% of the hood's width, as measured on the reference)
const EYE_X = {L: 162, R: 238}, EYE_Y = 120, BROW_Y = 101;
const eye = (s: 'L' | 'R'): Record<string, ImgPart> => {
  const cx = EYE_X[s], m = s === 'R';
  return {
    [`plate${s}`]: {src: 'doom/plate.png', x: cx - 32, y: EYE_Y - 16.5, w: 64, h: 33, pivot: [cx, EYE_Y], parent: 'mask', z: 6.2, mirror: m},
    [`slit${s}`]: {src: 'doom/slit.png', x: cx - 27, y: EYE_Y - 7.5, w: 54, h: 15, pivot: [cx, EYE_Y], parent: 'mask', z: 6.3},
    [`pupil${s}`]: {src: 'doom/pupil.png', x: cx - 5.8, y: EYE_Y - 5.8, w: 11.6, pivot: [cx, EYE_Y], parent: 'mask', z: 6.4},
    [`brow${s}`]: {src: 'doom/brow.png', x: cx - 32, y: BROW_Y - 6.5, w: 64, h: 13, pivot: [cx, BROW_Y], parent: 'mask', z: 6.5, mirror: m},
  };
};

/** Doom puppet built from Codex-generated pieces. Canvas 400 x 560, ground at y=540, 520 tall.
 *  The head is LAYERED (hood / blank mask / eye plates / slits / pupils / brows / nose / mouth) so the face can turn,
 *  the eyes can dart and the brows can move on their own, driven by `facePose`. */
export const doomImgRig: ImgRigDef = {
  height: 520, footY: 540, centerX: 200,
  parts: {
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
};

type Hand = 'fist' | 'open' | 'glow';
/** Which hands are visible. Merge the result into a pose. */
export const doomHands = (handL: Hand = 'fist', handR: Hand = 'fist') => {
  const out: Record<string, PartPose> = {};
  (['fist', 'open', 'glow'] as Hand[]).forEach((h) => { if (h !== handL) out[`${h}L`] = {hide: true}; if (h !== handR) out[`${h}R`] = {hide: true}; });
  return out;
};

/** Everything the face can do, as plain numbers so it can be animated pose-to-pose. */
export type Face = {
  turn: number;   // -1 (toward viewer's left) .. +1 (right): features slide across the mask with parallax
  up: number;     // -1 (looking down) .. +1 (up)
  slant: number;  // eye slits: degrees, + = angry (inner ends lower), - = sad
  open: number;   // eye slit height, 1 = fully open, 0.4 = squint
  browL: number; browR: number;   // brow angle in degrees, + = angry, - = sad (each side on its own)
  browYL: number; browYR: number; // brow height in px, + = lower
  px: number; py: number;         // pupils: -1..1 inside the slit (py + = down)
};
export const FACE: Record<'angry' | 'neutral' | 'sad' | 'squint', Partial<Face>> = {
  angry: {slant: 10, open: 0.85, browL: 17, browR: 17, browYL: 2, browYR: 2},
  neutral: {slant: 0, open: 1, browL: 2, browR: 2, browYL: -1, browYR: -1},
  sad: {slant: -8, open: 0.9, browL: -15, browR: -15, browYL: -3, browYR: -3},
  squint: {slant: 4, open: 0.45, browL: 9, browR: 9, browYL: 3, browYR: 3},
};
export const FACE0: Face = {turn: 0, up: 0, slant: 10, open: 0.85, browL: 17, browR: 17, browYL: 2, browYR: 2, px: 0, py: 0};

/** Turns a Face into poses for the head layers. Parallax: mask 5px, eyes/brows 14px, mouth 15px, nose 22px per unit of turn. */
export const facePose = (f: Face): Record<string, PartPose> => {
  const T = f.turn, U = f.up;
  const far = (s: 'L' | 'R') => ((s === 'R' && T > 0) || (s === 'L' && T < 0) ? 1 - 0.16 * Math.abs(T) : 1 + 0.03 * Math.abs(T)); // far-side eye gets narrower
  const out: Record<string, PartPose> = {
    mask: {x: 5 * T, y: -1.5 * U},
    nose: {x: 17 * T, y: -2.5 * U},
    mouth: {x: 10 * T, y: -2.5 * U},
  };
  (['L', 'R'] as const).forEach((s) => {
    const k = s === 'L' ? 1 : -1, sx = far(s), slant = k * f.slant;
    const u = f.px * 18 * sx; // pupil travel along the slit, following its slant
    out[`plate${s}`] = {x: 9 * T, y: -3.5 * U, sx};
    out[`slit${s}`] = {x: 9 * T, y: -3.5 * U, rot: slant, sx, sy: f.open};
    out[`pupil${s}`] = {x: 9 * T + u, y: -3.5 * U + u * Math.tan((slant * Math.PI) / 180) + f.py * 3 * f.open, sy: Math.min(1, f.open * 1.3)};
    out[`brow${s}`] = {x: 9 * T, y: -3.5 * U + (s === 'L' ? f.browYL : f.browYR), rot: k * (s === 'L' ? f.browL : f.browR), sx};
  });
  return out;
};

/** Canvas point at the middle of the open hand (for placing glows). */
export const HAND_CENTRE: Record<'L' | 'R', [number, number]> = {L: [93, 444], R: [307, 444]};
