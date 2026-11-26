import type {PuppetRig, PuppetPiece, PoseOf, Beat} from '../../puppet';

/** THE KING as DATA (pieces from public/king, placement read from src/shots/King.tsx).
 *  Canvas = the body picture k-2 (530 x 986, head and legs drawn in). What is separate:
 *  - arms: three WHOLE-ARM drawings per side (rest / chin / up), swapped with handL / handR and turned at the shoulder;
 *  - head: a second, shocked head (k-1) laid over the drawn one (sel: {head: 'shock'}). The calm head is PART OF the body
 *    picture, so this rig has NO head role: headTilt / headX / headY do nothing (tilting only the overlay showed the calm
 *    crown beside the shocked one). He acts with lean, bob, arms, lids and the head swap. To give him a head that
 *    tilts, cut the calm head out of k-2 into its own piece on a headless body, then add roles.head and a calm option;
 *  - eyelids: flat skin ellipses over the drawn eyes (eyeOpen below 0.95 shows them; blink beats work).
 *  Useful shoulder angles (shL / shR): rest 0 (hand on the armrest or hip) .. 12; chin 6 .. 12; up 0 (palm out) .. 35 (higher). */
const SH = {L: 118, R: 412}, SH_Y = 505;
const ARMS: Record<'rest' | 'chin' | 'up', {src: string; w: number; pivot: [number, number]; scale: number; rot0: number}> = {
  rest: {src: 'king/k-3.png', w: 164, pivot: [84, 30], scale: 0.84, rot0: -36},
  chin: {src: 'king/k-4.png', w: 194, pivot: [172, 238], scale: 0.95, rot0: -30},
  up: {src: 'king/k-5.png', w: 330, pivot: [52, 236], scale: 0.8, rot0: 5},
};
const armPieces = (s: 'L' | 'R'): Record<string, PuppetPiece> => {
  const out: Record<string, PuppetPiece> = {};
  (Object.keys(ARMS) as (keyof typeof ARMS)[]).forEach((k) => {
    const a = ARMS[k], w = a.w * a.scale, xr = SH.R - a.pivot[0] * a.scale; // placed for the screen-right side, mirrored about x = 265 for the left
    out[`${k}${s}`] = {src: a.src, x: s === 'R' ? xr : 530 - (xr + w), y: SH_Y - a.pivot[1] * a.scale, w, pivot: [SH[s], SH_Y], parent: 'body', z: 5, mirror: s === 'L'};
  });
  return out;
};
const armSet = (s: 'L' | 'R') => ({default: 'rest', options: {rest: [`rest${s}`], chin: [`chin${s}`], up: [`up${s}`]}});
const lid = (x: number): PuppetPiece => ({shape: 'ellipse', fill: '#e4a679', x: x - 54, y: 226 - 34, w: 108, h: 68, pivot: [x, 226], parent: 'body', z: 2.5});

export const KING: PuppetRig = {
  name: 'king', canvas: [530, 986], groundY: 986, centerX: 265, height: 986,
  pieces: {
    body: {src: 'king/k-2.png', x: 0, y: 0, w: 530, h: 986, pivot: [265, 900], z: 2},
    headShock: {src: 'king/k-1.png', x: 46, y: 0, w: 436, pivot: [264, 420], parent: 'body', z: 3},
    lidL: lid(207), lidR: lid(324),
    ...armPieces('L'), ...armPieces('R'),
  },
  roles: {
    body: ['body'],
    arms: {L: {upper: ['restL', 'chinL', 'upL']}, R: {upper: ['restR', 'chinR', 'upR']}},
  },
  variants: {handL: armSet('L'), handR: armSet('R'), head: {default: 'calm', options: {calm: [], shock: ['headShock']}}},
  face: {eyes: {L: {lid: 'lidL'}, R: {lid: 'lidR'}}, parallax: {base: [0, 0], eyes: [0, 0], nose: [0, 0], mouth: [0, 0]}, pupilTravel: [0, 0], lidTravel: 60},
  // the arm drawings were made at different angles: these raw turns bring each to its natural hang
  rest: {parts: Object.fromEntries((['L', 'R'] as const).flatMap((s) => (Object.keys(ARMS) as (keyof typeof ARMS)[]).map((k) => [`${k}${s}`, {rot: (s === 'R' ? 1 : -1) * ARMS[k].rot0}])))},
  limits: {shL: [-20, 35], shR: [-20, 35]},
  shadow: {r: 300, sy: 0.3},
  points: {palmL: {piece: 'upL', at: [-56, 372]}, palmR: {piece: 'upR', at: [586, 372]}, top: {piece: 'body', at: [265, 20]}},
};
/** face presets for beats */
export const KING_FACE: Record<'smug' | 'squint' | 'shock', {eyeOpen: number; sel: {head: 'calm' | 'shock'}}> = {
  smug: {eyeOpen: 1, sel: {head: 'calm'}}, squint: {eyeOpen: 0.6, sel: {head: 'calm'}}, shock: {eyeOpen: 1, sel: {head: 'shock'}},
};
/** the king's poses and beats with his real pick ids, so a typo fails in tsc: const BEATS: KingBeat[] = [...] */
export type KingPose = PoseOf<{handL: 'rest' | 'chin' | 'up'; handR: 'rest' | 'chin' | 'up'; view: 'front'; sel: {head: 'calm' | 'shock'; handL: 'rest' | 'chin' | 'up'; handR: 'rest' | 'chin' | 'up'}}>;
export type KingBeat = KingPose & Pick<Beat, 'f' | 'note' | 'blink' | 'n' | 'dip'>;
