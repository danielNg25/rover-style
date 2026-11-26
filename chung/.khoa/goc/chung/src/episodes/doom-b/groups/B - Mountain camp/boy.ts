import type {PuppetRig, PoseOf, Beat} from '../../../../puppet';
import {VICTOR} from '../../../../chars/_lib/doom-b-victor';

/* Fix-pass rigs of boy Victor for group B (the shared rig file src/chars/_lib/doom-b-victor.ts is not edited).
 * Extra pieces are code-made by make_fix_art.py in this folder.
 * VICTOR_FX (front, S8) adds to VICTOR:
 *   glow   'a' | 'b' | 'off'  flat orange-warm firelight on the screen-left cheek, ear and shoulder (two values to
 *                             swap on twos) plus a cooler, darker far edge of the face;
 *   lashes                    a dark lash arc along the lower rim of each lid and a slightly darker lid, so a blink
 *                             or shut eyes read as closed eyes, not as a blank face;
 *   arms   'none' | 'up'      forearms with the cupped hands IN FRONT of the chin (blowing into his hands); move them
 *                             with parts: {armsUp: {y}}.
 * VICTOR_BACK2 (S7): the back-view drawing split into shawl and head, so the head can tip (headTilt, headX, headY). */
const CX = 450, EYE = {L: 346.5, R: 553.5}, EYE_Y = 421.5;
const full = (src: string, z: number) => ({src, x: 106, y: 0, w: 663, h: 675, pivot: [CX, 640] as [number, number], parent: 'head', z});
const bust = (src: string) => ({src, x: 123, y: 590, w: 653, h: 451, pivot: [CX, 1030] as [number, number], parent: 'bust', z: 2.2});
const lash = (s: 'L' | 'R') => ({src: `doom-b/victor/vic-lash-${s === 'L' ? 'l' : 'r'}.png`, x: EYE[s] - 69.5, y: EYE_Y - 78, w: 139, h: 170, pivot: [EYE[s], EYE_Y] as [number, number], parent: `lid${s}`, z: 5.35});

export const VICTOR_FX: PuppetRig = {
  ...VICTOR, name: 'victor-fx',
  pieces: {
    ...VICTOR.pieces,
    lidL: {...VICTOR.pieces.lidL, tint: '#fae9df'}, lidR: {...VICTOR.pieces.lidR, tint: '#fae9df'},
    lashL: lash('L'), lashR: lash('R'),
    lightA: full('doom-b/victor/vic-light-a.png', 5.1), lightB: full('doom-b/victor/vic-light-b.png', 5.1), shade: full('doom-b/victor/vic-shade.png', 5.12),
    bustLightA: bust('doom-b/victor/vic-bustlight-a.png'), bustLightB: bust('doom-b/victor/vic-bustlight-b.png'),
    armsUp: {src: 'doom-b/victor/vic-arms-up.png', x: CX - 210, y: 652, w: 420, h: 330, pivot: [CX, 900], parent: 'bust', z: 6},
    handsUp: {src: 'doom-b/victor/vic-hands.png', x: CX - 170, y: 548, w: 340, pivot: [CX, 640], parent: 'armsUp', z: 6.2},
  },
  variants: {
    ...VICTOR.variants,
    glow: {default: 'a', options: {a: ['lightA', 'bustLightA', 'shade'], b: ['lightB', 'bustLightB', 'shade'], off: []}},
    arms: {default: 'none', options: {none: [], up: ['armsUp', 'handsUp']}},
  },
  views: undefined,
};
type VM = 'closed' | 'o' | 'open' | 'flat';
export type VictorFxPose = PoseOf<{mouth: VM; view: 'front'; sel: {mouth: VM; hands: 'none' | 'cup'; glow: 'a' | 'b' | 'off'; arms: 'none' | 'up'}}>;
export type VictorFxBeat = VictorFxPose & Pick<Beat, 'f' | 'note' | 'blink' | 'n' | 'dip'>;

/** back view, seated on the crate: canvas = the drawing (427 x 501), ground at its bottom edge */
export const VICTOR_BACK2: PuppetRig = {
  name: 'victor-back2', canvas: [427, 501], groundY: 501, centerX: 213, height: 501,
  pieces: {
    body: {src: 'doom-b/camp/camp-victor-back-body.png', x: 0, y: 0, w: 427, h: 501, pivot: [213, 470], z: 1},
    head: {src: 'doom-b/camp/camp-victor-back-head.png', x: 0, y: 0, w: 427, h: 501, pivot: [206, 288], parent: 'body', z: 2},
  },
  roles: {body: ['body'], head: 'head'},
  limits: {headTilt: [-18, 18], lean: [-6, 6]},
  shadow: {r: 190, sy: 0.25},
  points: {top: {piece: 'head', at: [200, 10]}},
};
export type BackBeat = Beat;
