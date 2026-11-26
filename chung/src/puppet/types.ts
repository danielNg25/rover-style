import type {PartPose} from '../kit';

/** puppet/types: the declarative RIG format and the POSE (control channels). Read PUPPET.md.
 *  All rig numbers are in the puppet's own CANVAS pixels: x right, y DOWN. Nothing here knows any character. */
export type Pt = [number, number];

/** One flat piece: a picture (src) or a plain shape (shape + fill, used for blink lids). */
export type PuppetPiece = {
  src?: string;                 // PNG with alpha under public/
  shape?: 'ellipse' | 'rect';   // instead of src: a flat shape filling the w x h box
  fill?: string;                // colour of the shape
  x: number; y: number;         // top-left on the canvas
  w: number; h?: number;        // drawn size (h defaults to the picture's aspect; required for a shape)
  pivot: Pt;                    // joint the piece turns about (canvas coords)
  parent?: string;              // piece it is attached to (moves and turns with it)
  z: number;                    // stacking order, higher = nearer the camera
  mirror?: boolean;             // flip the picture left-right (one arm drawing serves both sides)
  tint?: string;                // multiply colour (far-side legs, distance)
};

type Names = string | string[];
/** Layers of one eye; every field optional. A field may list several pieces (one per head variant). */
export type EyeDef = {plate?: Names; white?: Names; pupil?: Names; lid?: Names; brow?: Names};
/** Layered face: which pieces are which, and how far each layer slides per unit of head turn / look up (parallax). */
export type FaceDef = {
  base?: string;                               // the blank face (slides least)
  eyes: {L?: EyeDef; R?: EyeDef};              // L = screen left; a profile drawing gives only the eye it shows
  nose?: string; mouth?: Names;
  extras?: {piece: string; turn: number; up: number}[]; // anything else that should slide (fringe, ears, cheek marks)
  parallax: {base: Pt; eyes: Pt; nose: Pt; mouth: Pt}; // px per unit of [turn, up]
  pupilTravel: Pt;                             // px the pupil travels for px = 1, py = 1
  farNarrow?: number; nearWiden?: number;      // far-side eye gets narrower on a turn (default 0.16 / 0.03)
  openScalesWhite?: boolean;                   // slit eyes: eyeOpen squashes the white itself (no lid piece needed)
  lidTravel?: number;                          // lid piece: px it slides up at eyeOpen = 1 (it is hidden above 0.95)
};
export type LimbDef = {upper?: string[]; lower?: string[]; end?: string[]};
export type QuadDef = {nearHind: string; nearFront: string; farHind: string; farFront: string; body?: string; tail?: string; ear?: string; trunk?: string};

export type PuppetRig = {
  name: string;
  canvas: Pt;                 // design canvas size
  groundY: number;            // y of the ground line (soles)
  centerX: number;            // x that sits on the puppet's world position
  height: number;             // px from the ground line to the top of the figure: `height` world units map to this
  pieces: Record<string, PuppetPiece>;
  /** which pieces the standard channels drive */
  roles: {
    body?: string[];          // lean
    hips?: string[];          // bob: the pieces that rise and sink on the idle bob while the legs stay planted (torso or pelvis; the legs must NOT be their children). Without it the bob moves the whole puppet
    head?: string;            // headTilt, headX, headY
    cloth?: (string | {piece: string; follows: 'body' | 'head'})[]; // hangs and lags: a plain name follows the body (cape, skirt; channel `cloth`), follows: 'head' is hair, a veil, a hat ribbon (channel `hair`). Cloth SHEARS about its pivot, so its hem stays level
    hem?: string[];           // flips on a fake walk
    arms?: {L?: LimbDef; R?: LimbDef}; // upper = shoulder, lower = elbow, end = wrist (all hand drawings)
    legs?: {L?: LimbDef; R?: LimbDef}; // upper = hip, lower = knee, end = foot
    quad?: QuadDef;
  };
  /** swap groups: exactly one option of a group is visible. Standard group names: handL, handR, mouth, head. */
  variants?: Record<string, {default: string; options: Record<string, string[]>}>;
  face?: FaceDef;
  rest?: Pose;                // the character's neutral pose (channels not given are REST)
  limits?: Partial<Record<keyof Num, [number, number]>>; // allowed range of a channel on this rig (solve throws outside it)
  views?: Record<string, PuppetRig>; // other drawings of the same character: threeQuarter, back ... (pose.view picks one). A view is a rig of its own: its own rest, points and variants
  shadow?: {r: number; sy?: number}; // blob shadow radius in canvas px (default 0.3 x height)
  points?: Record<string, {piece: string; at: Pt}>; // named attach points: palmL, palmR, mouth, top ...
};

/** The numeric control channels. Angles in degrees, offsets in canvas px. "Up" and "raise" are positive everywhere. */
export type Num = {
  // face
  turn: number;      // -1 looks to screen left .. +1 screen right (features slide with parallax)
  up: number;        // -1 looks down .. +1 up
  eyeOpen: number;   // 1 open, 0.45 squint, 0 shut
  eyeSlant: number;  // + angry (inner ends lower), - sad
  browL: number; browR: number;   // brow angle, + angry, - sad
  browYL: number; browYR: number; // brow height in px, + raised
  px: number; py: number;         // pupils -1..1, px + screen right, py + up
  // head
  headTilt: number;  // + clockwise on screen
  headX: number; headY: number;   // px, + right, + up
  // body
  bodyX: number; bodyY: number;   // whole puppet, px, + right, + up (the shadow stays on the ground): a hop, a walk dip
  bob: number;       // px, + up: the idle rise and sink. Moves roles.hips above planted legs (the whole puppet when the rig has no hips role)
  lean: number;      // + leans to screen right
  squash: number;    // 0.1 = 10 % shorter and wider about the feet; negative stretches
  cloth: number;     // shear of the body-following cloth pieces, degrees (act() fills it with the lagging lean)
  hair: number;      // shear of the head-following cloth pieces, degrees (act() fills it with the lagging head tilt and turn)
  hem: number;       // -1 / +1 flips the hem pieces (fake walk)
  // arms: + raises the arm outward on BOTH sides (the right side is mirrored for you)
  shL: number; elL: number; wrL: number;
  shR: number; elR: number; wrR: number;
  // legs: same mirroring. A side-view walk swings hipL and hipR with the same sign
  hipL: number; kneeL: number; footL: number;
  hipR: number; kneeR: number; footR: number;
};
export const REST: Num = {
  turn: 0, up: 0, eyeOpen: 1, eyeSlant: 0, browL: 0, browR: 0, browYL: 0, browYR: 0, px: 0, py: 0,
  headTilt: 0, headX: 0, headY: 0, bodyX: 0, bodyY: 0, bob: 0, lean: 0, squash: 0, cloth: 0, hair: 0, hem: 0,
  shL: 0, elL: 0, wrL: 0, shR: 0, elR: 0, wrR: 0, hipL: 0, kneeL: 0, footL: 0, hipR: 0, kneeR: 0, footR: 0,
};
export const NUM_KEYS = Object.keys(REST) as (keyof Num)[];

/** A pose: any of the numbers, plus the discrete picks. */
export type Pose = Partial<Num> & {
  mouth?: string; handL?: string; handR?: string; // shorthand for sel.mouth / sel.handL / sel.handR
  view?: string;                                  // 'front' (default) or a key of rig.views
  sel?: Record<string, string>;                   // any other variant group: {head: 'shock'}
  parts?: Record<string, PuppetPart>;             // escape hatch: raw extra transform per piece (added on top)
};
/** transform of one piece: PartPose (rot, x, y, sx, sy, hide) plus skew = shear in degrees about the pivot (+ = the part below the pivot swings to screen left, as a clockwise turn would, but its lower edge stays level) */
export type PuppetPart = PartPose & {skew?: number};
/** Narrows the picks of a pose to the ids one rig really has, so a typo fails in tsc:
 *  type DoomPose = PoseOf<{handL: 'fist' | 'open'; handR: 'fist' | 'open'; view: 'front' | 'back'}> */
type Pick1<P, K extends string, D> = K extends keyof P ? P[K] : D;
export type PoseOf<P extends {mouth?: string; handL?: string; handR?: string; view?: string; sel?: Record<string, string>}> =
  Omit<Pose, 'mouth' | 'handL' | 'handR' | 'view' | 'sel'> & {mouth?: Pick1<P, 'mouth', string>; handL?: Pick1<P, 'handL', string>; handR?: Pick1<P, 'handR', string>; view?: Pick1<P, 'view', string>; sel?: Partial<Pick1<P, 'sel', Record<string, string>>>};
