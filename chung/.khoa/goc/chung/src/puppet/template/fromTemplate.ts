import type {Beat, ActOpts} from '../act';
import {act} from '../act';
import {singlePicture} from '../single';
import type {SinglePic} from '../single';
import type {Pose, PoseOf, PuppetPiece, PuppetRig, Pt} from '../types';
import {HUMAN_V1} from './human-v1';
import {HUMAN_V2} from './human-v2';
import {expr} from './expressions';
import type {ExpressionName} from './expressions';
import {EXTRA_V1} from './extra-v1';
import type {Manifest, Slot, Template, TplPiece} from './types';

/** puppet/template/fromTemplate: a complete PuppetRig from the slot map (human-v1) and a sliced character's manifest.
 *  No pixel position is typed per character: every piece is put on the canvas by the template (function place, the
 *  twin of tools/art/template/tpl.py), every joint is the skeleton's. Read CHARACTERS.md. */

export const MOUTHS = ['closed', 'small', 'wide', 'smile', 'frown', 'flat', 'o', 'teeth'] as const;
export const HANDS = ['open', 'fist', 'point', 'grip'] as const;
export type MouthId = (typeof MOUTHS)[number];
export type HandId = (typeof HANDS)[number];
/** px height of the standard adult on the template canvas */
export const STD_HEIGHT = HUMAN_V2.height;
/** the layouts a sheet may have been generated on: same skeleton and face kit, different places on the sheet */
const TEMPLATES: Record<string, Template> = {[HUMAN_V1.name]: HUMAN_V1, [HUMAN_V2.name]: HUMAN_V2};
export type BrowWeight = 'thin' | 'medium' | 'thick';
const BROWS: BrowWeight[] = ['thin', 'medium', 'thick'];
const DEFAULT_IRIS = '#7a4a2b';

/** BUILD VARIANTS. Applied to the skeleton AFTER cutting; the sheet is always drawn on the standard adult.
 *  overall = whole figure; head = head and face about the neck; limb = length of arms and legs; torso = torso
 *  length; width = torso and limb width (and how far shoulders and hips stand apart). */
export type Build = {overall: number; head: number; limb: number; torso: number; width: number};
export const BUILDS = {
  adult: {overall: 1, head: 1, limb: 1, torso: 1, width: 1},
  // a child is a short adult with a head that stays big: 0.68 of the adult height, about 2.0 heads tall
  child: {overall: 0.8, head: 1.02, limb: 0.72, torso: 0.72, width: 0.88},
  heavy: {overall: 1, head: 1.02, limb: 1, torso: 1.04, width: 1.32},
  tall: {overall: 1, head: 0.94, limb: 1.24, torso: 1.1, width: 0.96},
} satisfies Record<string, Build>;
export type BuildName = keyof typeof BUILDS;

export type TemplatePose = PoseOf<{mouth: MouthId; handL: HandId; handR: HandId; view: 'front' | 'back'; sel: {prop: 'none' | 'held'; lids: 'both' | 'L' | 'R'}}>;
export type TemplateBeat = TemplatePose & Pick<Beat, 'f' | 'note' | 'blink' | 'n' | 'dip'>;

const FIT_CLAMP: Pt = [0.8, 1.25];
/** canvas rect of a cut piece (screen-left or centre instance), the picture's padding included. Twin of tpl.place(). */
const place = (slot: Slot, art: number[], pad: number, adj: {dx?: number; dy?: number; scale?: number} = {}) => {
  const s = slot.scale, [tx0, ty0, tx1, ty1] = slot.tpl, [cx, cy, cw, ch] = slot.canvas, bw = art[2] - art[0], bh = art[3] - art[1];
  let k = slot.fit === 'h' ? (ty1 - ty0) / bh : slot.fit === 'w' ? (tx1 - tx0) / bw : 1;
  k = Math.min(FIT_CLAMP[1], Math.max(FIT_CLAMP[0], k)) * (adj.scale ?? 1);
  const w = (bw / s) * k, h = (bh / s) * k, [ax, ay] = slot.anchor, p = (pad / s) * k;
  const x = (ax === 'c' ? cx + cw / 2 - w / 2 : cx + (art[0] - tx0) / s) + (adj.dx ?? 0);
  const y = (ay === 't' ? cy : ay === 'b' ? cy + ch - h : ay === 'c' ? cy + ch / 2 - h / 2 : cy + (art[1] - ty0) / s) + (adj.dy ?? 0);
  return {x: x - p, y: y - p, w: w + 2 * p, h: h + 2 * p};
};

type Affine = {ax: number; bx: number; ay: number; by: number};
const ap = (m: Affine, p: number[]): Pt => [m.ax * p[0] + m.bx, m.ay * p[1] + m.by];
const about = (from: number[], to: number[], sx: number, sy: number): Affine => ({ax: sx, bx: to[0] - sx * from[0], ay: sy, by: to[1] - sy * from[1]});
const then = (a: Affine, b: Affine): Affine => ({ax: a.ax * b.ax, bx: a.bx * b.ax + b.bx, ay: a.ay * b.ay, by: a.by * b.ay + b.by});

/** the skeleton of a build: one axis-aligned map per body part and side, standard canvas -> this build's canvas */
const skeleton = (T: Template, b: Build) => {
  const J = T.joints!, cx = T.centerX, G = T.groundY, side = (p: number[], s: 'L' | 'R'): Pt => [s === 'L' ? p[0] : 2 * cx - p[0], p[1]];
  const all = about([cx, G], [cx, G], b.overall, b.overall);
  const legY = (y: number) => G + (y - G) * b.limb;
  const torso = about(J.lean, [cx, legY(J.lean[1])], b.width, b.torso);
  const head = about(J.neck, ap(torso, J.neck), b.head, b.head);
  const part = (kind: string, s: 'L' | 'R'): Affine => {
    if (kind === 'torso') return then(torso, all);
    if (kind === 'head') return then(head, all);
    if (kind === 'leg') { const h = side(J.hip, s); return then(about(h, [cx + (h[0] - cx) * b.width, legY(h[1])], b.width, b.limb), all); }
    const sh = side(J.shoulder, s), arm = about(sh, ap(torso, sh), b.width, b.limb);
    if (kind === 'arm') return then(arm, all);
    const wr = side(J.wrist, s), hs = (b.width + b.limb) / 2;   // hand: uniform, hung on the wrist
    return then(about(wr, ap(arm, wr), hs, hs), all);
  };
  return {part, headScale: b.head * b.overall};
};

const shade = (hex: string, k: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');

/** A complete rig for a sliced character.
 *  o.build   a name of BUILDS or your own numbers; o.name the rig name (default: the manifest id);
 *  o.lid     'shape' (default): the upper lid is a flat block in the head's own skin colour, so it can never mismatch
 *            the face; 'art' uses the generated lid slot (eye shadow, a metal lid);
 *  o.rest    the default expression: a name ('pleased') or a pose;
 *  o.iris    iris colour: draws the standard iris ring with the sheet's pupil as its black centre (done by itself when
 *            the sheet's pupil is a plain dark dot); o.brow 'thin' | 'medium' | 'thick': the brow's thickness.
 *  Every option defaults to the manifest's "options" (written by slice.py from the brief), so a generated rig file
 *  calls fromTemplate(MANIFEST) and nothing is edited by hand.
 *  The rig has: thigh / shin per leg, torso, arm / fore / four hands per side, ears, head, cap, eye whites, pupils,
 *  lids, brows, eight mouths, an optional hand prop, and a back view when the sheet has one.
 *  ACT IT THROUGH tAct() (or wrap your pose function in lids()): the lids are driven from eyeOpen and eyeSlant there. */
export const fromTemplate = (man: Manifest, opt: {build?: BuildName | Build; name?: string; lid?: 'shape' | 'art'; rest?: Pose | ExpressionName; iris?: string; brow?: BrowWeight} = {}): PuppetRig => {
  const T = TEMPLATES[man.template];
  if (!T) throw new Error(`fromTemplate: manifest ${man.id} was cut with template ${man.template}; this builder knows ${Object.keys(TEMPLATES).join(', ')}`);
  const o = {...(man.options ?? {}), ...opt} as typeof opt;   // the character's own options (slice.py --brief) are the defaults
  const build = typeof o.build === 'object' ? o.build : BUILDS[o.build ?? 'adult'], sk = skeleton(T, build), cx = T.centerX, J = T.joints!;
  const F = T.face!, [ew, eh] = F.eye as number[], lidTop = J.eye[1] - eh / 2 - LID_ABOVE;
  const browH = (F.browH as number[])[BROWS.indexOf(o.brow ?? 'medium')];
  // a pupil drawn as a plain dark dot gets the standard iris ring from the rig; a drawn iris is kept (o.iris forces the ring)
  const ring = !!opt.iris || (man.measure?.pupilDark ?? 0) > 0.6, irisD = F.irisD as number;
  const missing = Object.entries(T.slots).filter(([n, s]) => !s.optional && !man.slots[n]).map(([n]) => n);
  if (missing.length) throw new Error(`fromTemplate: ${man.id} lacks the required slot(s) ${missing.join(', ')}: slice.py reported them, regenerate the sheet`);
  const hasBack = !!(man.slots.backHead && man.slots.backTorso), hasProp = !!man.slots.prop;
  const mk = (p: TplPiece): PuppetPiece | null => {
    const slot = T.slots[p.slot], ms = man.slots[p.slot];
    if (!ms) return null;
    const s = p.mirror ? 'R' : 'L', m = sk.part(p.part, s);
    let r = place(slot, ms.art, man.pad, man.adjust?.[p.slot]);
    if (p.slot === 'lid') // the lid is a standard block from LID_ABOVE px above the eye to LID_BELOW px below it, hung on its top edge
      r = {x: J.eye[0] - ew / 2 - LID_SIDE, y: lidTop, w: ew + LID_SIDE + 1, h: eh + LID_ABOVE + LID_BELOW};   // 1 px past the inner edge only: the two whites overlap there
    if (p.slot === 'brow') r = {...r, y: r.y + r.h / 2 - browH / 2, h: browH};   // the standard sets the brow's thickness, the art its shape and length
    if (p.slot === 'pupil' && ring) { const d = irisD * 0.56; r = {x: J.eye[0] - d / 2, y: J.eye[1] - d / 2, w: d, h: d}; } // the drawn dot becomes the black centre
    if (p.mirror) r = {...r, x: 2 * cx - r.x - r.w};
    const [x, y] = ap(m, [r.x, r.y]), pivot = ap(m, p.slot === 'lid' ? [p.pivot[0], lidTop] : p.pivot);
    const base = {x, y, w: r.w * m.ax, h: r.h * m.ay, pivot, parent: p.parent ?? undefined, z: p.z};
    if (p.slot === 'lid' && (o.lid ?? 'shape') === 'shape') return {...base, shape: 'rect', fill: man.colours.head ?? man.colours.lid ?? '#cccccc'};
    return {...base, src: ms.file, mirror: p.mirror || undefined};
  };
  const collect = (view: 'front' | 'back') => {
    const out: Record<string, PuppetPiece> = {};
    T.pieces.filter((p) => p.view === view || p.view === 'both').forEach((p) => { const q = mk(p); if (q) out[p.name] = q; });
    if (view === 'front' && ring) (['L', 'R'] as const).forEach((s) => {
      // the iris is the piece the eyes move; the drawn black dot (with its highlight) rides on it
      const dot = out[`pupil${s}`], k = sk.headScale, c: Pt = dot.pivot;
      out[`pupil${s}`] = {shape: 'ellipse', fill: o.iris ?? DEFAULT_IRIS, x: c[0] - (irisD * k) / 2, y: c[1] - (irisD * k) / 2, w: irisD * k, h: irisD * k, pivot: c, parent: dot.parent, z: dot.z};
      out[`dot${s}`] = {...dot, parent: `pupil${s}`, z: dot.z + 0.02};
    });
    return out;
  };
  const hands = (s: 'L' | 'R', v: string) => ({default: 'open', options: Object.fromEntries(HANDS.map((h) => [h, [`${h}${s}${v}`]]))});
  const limbs = (v: string) => ({
    arms: {
      L: {upper: [`armL${v}`], lower: [`foreL${v}`], end: [...HANDS.map((h) => `${h}L${v}`), ...(hasProp && !v ? ['prop'] : [])]},
      R: {upper: [`armR${v}`], lower: [`foreR${v}`], end: HANDS.map((h) => `${h}R${v}`)},
    },
    legs: {L: {upper: ['thighL'], lower: ['shinL']}, R: {upper: ['thighR'], lower: ['shinR']}},
  });
  const pieces = collect('front'), hs = sk.headScale, headM = sk.part('head', 'L');
  // the lid line: a thin darker edge along the bottom of each lid; lids() shows it only when the eye is shut
  (['L', 'R'] as const).forEach((s) => {
    const l = pieces[`lid${s}`];
    pieces[`lash${s}`] = {shape: 'rect', fill: shade(man.colours.head ?? '#cccccc', 0.5), x: l.x + l.w * 0.1, y: l.y + (l.h ?? 0) - 3.2 * hs, w: l.w * 0.8, h: 3.2 * hs, pivot: l.pivot, parent: `lid${s}`, z: l.z + 0.02};
  });
  const top = Math.min(...['head', 'cap'].map((n) => pieces[n].y)), height = T.groundY - top;
  const palm = (s: 'L' | 'R'): Pt => { const w = [s === 'L' ? J.wrist[0] : 2 * cx - J.wrist[0], J.wrist[1] + 22]; return ap(sk.part('hand', s), w); };
  const rest: Pose = {shL: 4, shR: 4, ...(typeof o.rest === 'string' ? expr(o.rest) : o.rest ?? {})};
  const shadow = {r: 118 * build.width * build.overall, sy: 0.3};
  const rig: PuppetRig = {
    name: o.name ?? man.id, canvas: [T.canvas[0], T.canvas[1]], groundY: T.groundY, centerX: cx, height, pieces,
    roles: {body: ['torso'], hips: ['torso'], head: 'head', ...limbs('')},
    variants: {
      handL: hands('L', ''), handR: hands('R', ''),
      mouth: {default: 'closed', options: Object.fromEntries(MOUTHS.map((m) => [m, [`mouth_${m}`]]))},
      // which lids follow eyeOpen (see lids()): 'L' or 'R' leaves the other eye wide open (a raised brow, a doubtful look)
      lids: {default: 'both', options: {both: [], L: [], R: []}},
      ...(hasProp ? {prop: {default: 'none', options: {none: [], held: ['prop']}}} : {}),
    },
    face: {
      eyes: {L: {white: 'whiteL', pupil: 'pupilL', lid: 'lidL', brow: 'browL'}, R: {white: 'whiteR', pupil: 'pupilR', lid: 'lidR', brow: 'browR'}},
      mouth: MOUTHS.map((m) => `mouth_${m}`), extras: [{piece: 'earL', turn: -5 * hs, up: 0}, {piece: 'earR', turn: -5 * hs, up: 0}],
      parallax: {base: [0, 0], eyes: [9 * hs, 4 * hs], nose: [0, 0], mouth: [11 * hs, 4 * hs]},
      pupilTravel: [(T.face!.pupilTravel as number[])[0] * hs, (T.face!.pupilTravel as number[])[1] * hs],
      farNarrow: 0.1, lidTravel: 0,   // the lid does not slide: lids() squashes it from its top edge instead
    },
    rest, shadow,
    points: {
      palmL: {piece: 'openL', at: palm('L')}, palmR: {piece: 'openR', at: palm('R')},
      top: {piece: 'head', at: [cx, top]}, mouth: {piece: 'head', at: ap(headM, J.mouth)},
    },
  };
  if (hasBack) {
    const bp = collect('back');
    rig.views = {back: {
      name: `${rig.name}-back`, canvas: rig.canvas, groundY: rig.groundY, centerX: cx, height, pieces: bp,
      roles: {body: ['torsoBack'], hips: ['torsoBack'], head: 'headBack', ...limbs('B')},
      variants: {handL: hands('L', 'B'), handR: hands('R', 'B')}, rest: {shL: 4, shR: 4}, shadow,
      points: {palmL: {piece: 'openLB', at: palm('L')}, palmR: {piece: 'openRB', at: palm('R')}, top: {piece: 'headBack', at: [cx, top]}},
    }};
  }
  return rig;
};

const LID_ABOVE = 9, LID_BELOW = 4, LID_SIDE = 4;
/** THE LIDS OF A TEMPLATE RIG. Wrap the pose function: pose={(f) => lids(act(BEATS, f, {rig}))} (tAct does it).
 *  eyeOpen  1 = no lid; below 0.95 the lid block covers the eye from the top down to (1 - eyeOpen) of its height;
 *  eyeSlant the lid's cutting edge tilts: + = angry (inner ends lower), - = sad (outer ends lower), degrees;
 *  sel.lids 'L' or 'R': only that eye's lid acts, the other eye stays wide open.
 *  A blink (act's blink: true) still shuts both eyes. The engine itself only shows or hides the lid piece. */
export const lids = (pose: Pose, rig?: PuppetRig): Pose => {
  const open = pose.eyeOpen ?? 1, only = pose.sel?.lids ?? 'both', slant = pose.eyeSlant ?? 0, eyeH = (HUMAN_V2.face!.eye as number[])[1];
  if (open >= 0.95) return pose;
  const full = LID_ABOVE + eyeH + LID_BELOW, sy = (LID_ABOVE + (eyeH + LID_BELOW) * (1 - Math.max(0, open))) / full;
  // The block is squashed from its top edge and its CUTTING EDGE turns about the point under the eye centre: turning
  // it about the top (as the engine would) swings the edge sideways and bares a corner of the white. So the turn is
  // followed by the shift that puts the middle of the edge back (h = the lid's height now, in this build's canvas px).
  const h = (rig?.pieces.lidL?.h ?? full) * sy, shut = open <= 0.2;
  const one = (s: 'L' | 'R') => {
    if (only !== 'both' && only !== s && !shut) return {hide: true};
    const rot = shut ? 0 : (s === 'L' ? 1 : -1) * slant, a = (rot * Math.PI) / 180;
    return {sy, rot, x: h * Math.sin(a), y: h * (1 - Math.cos(a))};
  };
  return {...pose, parts: {...(pose.parts ?? {}), lidL: one('L'), lidR: one('R'), ...(shut ? {} : {lashL: {hide: true}, lashR: {hide: true}})}};
};
/** act() for a template rig: the same beat lists, with the lids applied */
export const tAct = (beats: Beat[], f: number, o: ActOpts = {}): Pose => lids(act(beats, f, o), o.rig);
/** world height to give <Puppet height=...> so that this rig stands at the right size next to a standard adult of `adult` world units */
export const worldHeight = (rig: PuppetRig, adult: number) => (adult * rig.height) / STD_HEIGHT;

/** A single-picture extra from a sheet generated on extra-v1 (front calm, front startled, back): blinks, leans, hops;
 *  sel: {pic: 'startled'} swaps the drawing, view: 'back' shows the back. `skin` colours the blink lids. */
export const extraFromTemplate = (man: Manifest, o: {name?: string; skin?: string} = {}): PuppetRig => {
  const T = EXTRA_V1;
  if (man.template !== T.name) throw new Error(`extraFromTemplate: manifest ${man.id} was cut with template ${man.template}, not ${T.name}`);
  const pic = (slot: string): SinglePic | undefined => {
    const ms = man.slots[slot], s = T.slots[slot]; if (!ms) return undefined;
    const kx = (ms.art[2] - ms.art[0]) / (s.tpl[2] - s.tpl[0]), ky = (ms.art[3] - ms.art[1]) / (s.tpl[3] - s.tpl[1]), er = T.face!.eyeR as number[];
    const eyes = ['eyeL', 'eyeR'].filter((k) => s.pivots[k]).map((k) => ({at: [man.pad + (s.pivots[k][0] - s.tpl[0]) * kx, man.pad + (s.pivots[k][1] - s.tpl[1]) * ky] as Pt, r: [er[0] * kx, er[1] * ky] as Pt}));
    return {src: ms.file, size: [ms.size[0], ms.size[1]], eyes: eyes.length ? eyes : undefined};
  };
  const front = pic('front'); if (!front) throw new Error(`extraFromTemplate: ${man.id} has no front figure`);
  const startled = pic('startled'), back = pic('back'), name = o.name ?? man.id;
  const rig = singlePicture({name, skin: o.skin, ...front, alts: startled ? {startled} : undefined});
  if (back) rig.views = {back: singlePicture({name: `${name}-back`, ...back})};
  return rig;
};
