import type {Pose} from '../types';
import type {MouthId, TemplateBeat, TemplatePose} from './fromTemplate';

/** puppet/template/expressions: THE EIGHT EXPRESSIONS of the style bible (5.3) as presets of the standard face
 *  channels. They work on every rig built by fromTemplate (same eyes, lids, brows and mouth set on every character).
 *  What each one looks like in the professional reference: research/rover-explains-2026-11-20/expressions/chart.jpg.
 *
 *  Channels:  eyeOpen  1 = round open eye (no lid); 0.5 = the lid covers the top half
 *             eyeSlant the lid's cutting edge, degrees: + inner ends lower (angry), - outer ends lower (sad)
 *             lids     'both', or 'L' / 'R' = only that (screen) eye is lidded, the other stays round
 *             browL/R  brow angle, degrees: + inner end lower (angry), - inner end higher (sad, afraid)
 *             browYL/R brow height, canvas px: + raised, - pressed down onto the eye
 *             px, py   pupils -1..1: + screen right, + up
 *             mouth    one of the eight mouth shapes */
export type Expression = {eyeOpen: number; eyeSlant: number; lids?: 'both' | 'L' | 'R'; browL: number; browR: number; browYL: number; browYR: number; px: number; py: number; mouth: MouthId; talk: [MouthId, MouthId]; recipe: string};
export const EXPRESSION_NAMES = ['neutral', 'pleased', 'angry', 'sad', 'surprised', 'doubtful', 'smug', 'afraid'] as const;
export type ExpressionName = (typeof EXPRESSION_NAMES)[number];

export const EXPRESSIONS: Record<ExpressionName, Expression> = {
  neutral: {eyeOpen: 1, eyeSlant: 0, browL: 0, browR: 0, browYL: 0, browYR: 0, px: 0, py: 0, mouth: 'closed', talk: ['small', 'closed'],
    recipe: 'round open eyes, no lid; brows level, resting just above the eyes; pupils centred; mouth a short level line'},
  pleased: {eyeOpen: 1, eyeSlant: 0, browL: -5, browR: -5, browYL: 7, browYR: 7, px: 0, py: 0, mouth: 'smile', talk: ['wide', 'smile'],
    recipe: 'round open eyes (or shut into two thin arcs for bliss); brows lifted and relaxed; pupils centred; mouth a wide upward curve, a toothy grin when talking'},
  angry: {eyeOpen: 0.62, eyeSlant: 20, browL: 24, browR: 24, browYL: -11, browYR: -11, px: 0, py: 0, mouth: 'frown', talk: ['teeth', 'frown'],
    recipe: 'lids cut the eyes flat on a slant down to the nose; thick brows pressed onto the eyes, inner ends low, almost meeting; pupils centred under the lid; mouth a downward curve or clenched teeth'},
  sad: {eyeOpen: 0.66, eyeSlant: -15, browL: -19, browR: -19, browYL: 3, browYR: 3, px: 0, py: -0.45, mouth: 'frown', talk: ['small', 'frown'],
    recipe: 'lids droop over the outer halves of the eyes; brows tilted up at the inner ends; pupils low, looking down; mouth a small downward curve'},
  surprised: {eyeOpen: 1, eyeSlant: 0, browL: -4, browR: -4, browYL: 15, browYR: 15, px: 0, py: 0.1, mouth: 'o', talk: ['wide', 'o'],
    recipe: 'eyes fully round, no lid; brows jump high and stay nearly level; pupils centred, small in a lot of white; mouth a round "o" (wide open for a shout)'},
  doubtful: {eyeOpen: 0.56, eyeSlant: 4, lids: 'L', browL: 9, browR: -7, browYL: -8, browYR: 13, px: 0.55, py: 0, mouth: 'flat', talk: ['small', 'flat'],
    recipe: 'asymmetry: one eye half shut under a low brow, the other round under a raised brow; pupils slid to one side; mouth a flat line (a hand at the chin helps)'},
  smug: {eyeOpen: 0.5, eyeSlant: -3, browL: -6, browR: -6, browYL: 8, browYR: 8, px: 0.4, py: -0.1, mouth: 'smile', talk: ['small', 'smile'],
    recipe: 'both eyes half-lidded with a level lid, a thin dark lid line; brows high and relaxed (or one cocked); pupils to the side; mouth a closed smile, often lopsided (a smirk)'},
  afraid: {eyeOpen: 1, eyeSlant: 0, browL: -24, browR: -24, browYL: 10, browYR: 10, px: 0, py: 0, mouth: 'frown', talk: ['wide', 'frown'],
    recipe: 'eyes fully round, no lid; brows raised and steeply tilted, inner ends up; pupils small and centred (or darting); mouth a downward curve, clenched teeth for panic, open for a cry'},
};

/** the face pose of an expression (a bag of channels: spread it into a beat or a rest pose) */
export const expr = (name: ExpressionName): TemplatePose => {
  const {talk, recipe, lids, mouth, ...num} = EXPRESSIONS[name];
  return {...num, mouth, sel: {lids: lids ?? 'both'}};
};

/** THE TRANSITION RULE (bible 6 and 8.5: a face snaps, it never morphs; the eyes lead):
 *  1. the PUPILS go first, one drawing (2 frames) before the change;
 *  2. LIDS AND BROWS change together on the frame itself, in one drawing (no in-between: act() snaps face channels);
 *  3. the MOUTH follows one drawing (2 frames) later;
 *  so a change takes 3 drawings on twos = 6 frames from first to last movement. A change between opposite feelings
 *  (TRANSITION.opposite) is announced by a blink that ends as the pupils move: 5 drawings = 10 frames.
 *  Hold an expression at least `minHold` frames before the next change. */
export const TRANSITION = {
  pupilsLead: 2, mouthLag: 2, twos: 3, twosWithBlink: 5, blinkLead: 6, minHold: 12,
  opposite: [['pleased', 'angry'], ['pleased', 'sad'], ['pleased', 'afraid'], ['smug', 'afraid'], ['smug', 'sad'], ['neutral', 'surprised'], ['neutral', 'afraid']] as [ExpressionName, ExpressionName][],
};
const isOpposite = (a: ExpressionName, b: ExpressionName) => TRANSITION.opposite.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** Beats for "go to expression `name` at frame f" (f even; the lids and brows land on f). Spread them into a beat list:
 *    const BEATS: TemplateBeat[] = [{f: 0, ...expr('neutral')}, ...expressionBeats('angry', 24, {from: 'neutral'}), {f: 40, shL: 60}];
 *  o.from   the expression being left: a blink is added when the two are opposites (or pass blink: true / false);
 *  o.extra  more channels for the main beat (a head tilt, a hand).
 *  Keep the list sorted by f when you merge it with body beats. */
export const expressionBeats = (name: ExpressionName, f: number, o: {from?: ExpressionName; blink?: boolean; extra?: Pose; note?: string} = {}): TemplateBeat[] => {
  if (f % 2) throw new Error(`expressionBeats: frame ${f} is odd; characters change on even frames`);
  const {px, py, mouth, ...rest} = expr(name), blink = o.blink ?? (o.from ? isOpposite(o.from, name) : false), out: TemplateBeat[] = [];
  if (f < TRANSITION.pupilsLead) return [{f, note: o.note ?? name, ...expr(name), ...(o.extra ?? {})} as TemplateBeat];
  if (blink && f >= TRANSITION.blinkLead) out.push({f: f - TRANSITION.blinkLead, blink: true, note: `blink before ${name}`});
  out.push({f: f - TRANSITION.pupilsLead, px, py, note: `${name}: pupils first`});
  out.push({f, note: o.note ?? name, ...rest, ...(o.extra ?? {})} as TemplateBeat);
  out.push({f: f + TRANSITION.mouthLag, mouth, note: `${name}: mouth`});
  return out;
};
/** the same as one call for a whole sequence: toExpression([[0, 'neutral'], [24, 'angry'], [48, 'smug']]) */
export const toExpression = (seq: [number, ExpressionName][]): TemplateBeat[] =>
  seq.flatMap(([f, name], i) => (i === 0 ? [{f, note: name, ...expr(name)} as TemplateBeat] : expressionBeats(name, f, {from: seq[i - 1][1]})));
