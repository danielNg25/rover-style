import type {Expr} from './draw';

/** Named face states fitted to the reference (LUAT-CUTOUT3D-v3 D18-22 and the self-check of the grave sequence).
 *  Use these instead of building a face by hand. Rule: fully round eyes (no upper lid) belong ONLY to shock, surprise
 *  and delight; a sad, tired, bored or suspicious character keeps its lid line even while it talks or looks up. */
export const EXPR: Record<string, Expr> = {
  neutral: {upper: 'flat', lidL: [-58, -58], lidR: [-58, -58], brow: 'arc', mouth: 'flat'},
  sad: {upper: 'sad', brow: 'sad', mouth: 'down', gaze: [0, 26]},
  /** sad and speaking or looking up: the lids lift a little, the slant stays */
  sadTalk: {upper: 'sad', lidL: [-28, -58], lidR: [-28, -58], brow: 'sad', browY: -8, mouth: 'aw', gaze: [4, -10]},
  /** suspicious, sizing someone up: both lids half down and nearly level, flat mouth */
  squint: {upper: 'flat', lidL: [-34, -24], lidR: [-34, -24], lower: 'curve', lowerAmt: 0.8, brow: 'angry', browY: 44, mouth: 'flat', gaze: [0, 14]},
  angry: {upper: 'angry', lower: 'curve', lowerAmt: 1, brow: 'angry', browY: 58, mouth: 'down', gaze: [0, 6]},
  glare: {upper: 'angry', lidL: [-62, -8], lidR: [-62, -8], lower: 'curve', lowerAmt: 1.6, brow: 'angry', browY: 62, mouth: 'down', gaze: [0, 6]},
  happy: {upper: 'none', lower: 'curve', lowerAmt: 3, brow: 'arc', browY: 4, mouth: 'open', gaze: [8, -20]},
  smile: {upper: 'none', lower: 'curve', lowerAmt: 2.2, brow: 'arc', mouth: 'up'},
  shock: {upper: 'none', pupil: 'dot', brow: 'none', mouth: 'o'},
  bored: {upper: 'flat', lidL: [6, 6], lidR: [6, 6], brow: 'arc', browY: 10, mouth: 'flat', gaze: [8, 24]},
  /** contempt: half-lowered lids, one corner of the mouth pulled up */
  smirk: {upper: 'flat', lidL: [14, 10], lidR: [8, 14], brow: 'arc', browY: 14, mouth: 'smirk', gaze: [-20, 4]},
};
const ROUND_OK = new Set(['happy', 'smile', 'shock']);
/** Throws when a face that is not shock, surprise or delight has no upper lid: the mistake the first build made. */
export const lintExpr = (name: string, e: Expr) => {
  if (e.upper === 'none' && !e.lidL && !ROUND_OK.has(name)) throw new Error(`mould: expression "${name}" has fully round eyes. Round eyes are for shock and delight only; keep the lid line (use sadTalk, squint ...).`);
};
Object.entries(EXPR).forEach(([n, e]) => lintExpr(n, e));
