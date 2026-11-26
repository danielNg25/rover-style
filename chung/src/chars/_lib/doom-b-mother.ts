import type {PuppetRig, PoseOf, Beat} from '../../puppet';

/** THE MOTHER (episode doom-b, S10): a SHADOW ONLY, never seen in the flesh. Two single-tone silhouette pieces
 *  (public/doom-b/camp, sheet gen/doom-b-camp-row.png; flattened to exactly #2f2b3a and the arms scaled and turned
 *  26 degrees into the hold by art/make_pieces.py): the body from the lap up in a headscarf, facing
 *  screen right with the head bowed, and both forearms in a cradling hold. Canvas 520 x 500 = sheet px, ground (lap
 *  line) at y = 496. Lay it on the tent canvas as a flat card; `tint` multiplies the tone, flip faces her left.
 *  Acting: rock = lean -3 .. 3 with bob; curl over the bundle = lean 5 + squash 0.05 + parts: {arms: {y: -14, rot: -4}}.
 *  The arms are one piece that turns about the shoulder line (shL also turns it). The bundle is NOT drawn: lay the
 *  shared bundle polygon on puppetAttach(MOTHER, pose, '', 'cradle', height, pos). No face, no lids, no head role. */
export const MOTHER: PuppetRig = {
  name: 'mother-shadow', canvas: [520, 500], groundY: 496, centerX: 250, height: 490,
  pieces: {
    body: {src: 'doom-b/camp/camp-mother-body-flat.png', x: 60, y: 6, w: 352, h: 490, pivot: [250, 480], z: 1},
    arms: {src: 'doom-b/camp/camp-mother-arms-set.png', x: 160, y: 250, w: 336, pivot: [262, 318], parent: 'body', z: 2},
  },
  roles: {body: ['body'], arms: {L: {upper: ['arms']}}},
  limits: {shL: [-15, 15]},
  shadow: {r: 1, sy: 0.01},
  points: {cradle: {piece: 'arms', at: [408, 396]}, top: {piece: 'body', at: [270, 10]}},
};
/** world height of the lap-up shadow when an adult stands 2.9 tall (scale it freely: it is a cast shadow) */
export const MOTHER_H = 1.45;
export type MotherPose = PoseOf<{view: 'front'}>;
export type MotherBeat = MotherPose & Pick<Beat, 'f' | 'note' | 'blink' | 'n' | 'dip'>;
