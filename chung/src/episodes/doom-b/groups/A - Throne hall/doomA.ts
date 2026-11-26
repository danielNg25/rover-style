import type {PuppetRig, PuppetPiece} from '../../../../puppet';
import {DOOM} from '../../../../chars/_lib/doom';

/* Group A's copy of the ruler rig. Same pieces, joints and channels as chars/_lib/doom (which stays untouched); what
 * changes is only the art it points at and two additions the review asked for:
 *  - every picture is the cleaned copy under public/doom-b/A/doom (tools/prep_art.py): no magenta edge fringe, twice
 *    the pixels with a steep alpha edge, so the S4 close-up is crisp;
 *  - `neck`: a flat dark shape behind the hood (the hood's own inside colour), so a head lift never opens a gap that
 *    shows the set between mask and collar (S3);
 *  - the back view is two pieces, cloak and hood, so the hood can turn by itself (S5: headTilt). */

const A = 'doom-b/A/doom/';
const remap = (pieces: Record<string, PuppetPiece>): Record<string, PuppetPiece> =>
  Object.fromEntries(Object.entries(pieces).map(([k, p]) => [k, p.src ? {...p, src: A + p.src.replace(/^doom\//, '')} : p]));
// the glow hands are not used in this group: they keep the stock picture (never shown)
const front = remap(Object.fromEntries(Object.entries(DOOM.pieces).filter(([k]) => !k.startsWith('glow'))));

const BW = 927, BH = 1450;
const BACK: PuppetRig = {
  name: 'doom-back-2', canvas: [BW, BH], groundY: BH, centerX: BW / 2, height: BH,
  pieces: {
    cloak: {src: A + 'back-cloak.png', x: 0, y: 0, w: BW, h: BH, pivot: [BW / 2, BH * 0.9], z: 1},
    hoodB: {src: A + 'back-hood.png', x: 0, y: 0, w: BW, h: BH, pivot: [BW / 2, 640], parent: 'cloak', z: 2},
  },
  roles: {body: ['cloak'], head: 'hoodB'},
  shadow: {r: 400, sy: 0.32},
  points: {top: {piece: 'hoodB', at: [BW / 2, 10]}},
};

export const DOOM_A: PuppetRig = {
  ...DOOM,
  name: 'doom-a',
  pieces: {
    ...front,
    glowL: DOOM.pieces.glowL, glowR: DOOM.pieces.glowR,
    neck: {shape: 'rect', fill: '#0e2409', x: 128, y: 150, w: 144, h: 96, pivot: [200, 222], parent: 'body', z: 5.9},
  },
  views: {back: BACK},
};
