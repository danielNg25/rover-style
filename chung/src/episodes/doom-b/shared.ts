/** Episode doom-b: constants several build groups must agree on. PLAIN DATA ONLY (no React, no kit imports),
 *  so every group file, the film index and tools can import it. Source: design.json (shared_constants, shots, sets).
 *  Values marked PROPOSED are the producer's reading of design prose (the design gives words, not numbers);
 *  a builder who needs another value changes it HERE, never locally, and tells the other groups. */

export const FPS = 24;
export const TOTAL_FRAMES = 545;
export const W = 1280;
export const H = 720;
export const EP = 'ep-doom-b';

export type P2 = [number, number];
export type GroupId = 'A' | 'B' | 'C';
export type MoodName = 'dayInterior' | 'nightInterior' | 'dayExterior' | 'dusk' | 'nightExterior' | 'space';
export type CamMove = 'push' | 'pull' | 'truckRight' | 'truckLeft';
export type ShotMeta = {
  /** design id, e.g. 'S1' */
  id: string;
  /** composition id (also KitShot.id): ep-doom-b-s1 */
  comp: string;
  group: GroupId;
  /** film frames: first frame, and the frame of the cut (exclusive) */
  f0: number; f1: number; len: number;
  /** kit liveness shot type, mapped from the design's framing */
  type: 'wideExterior' | 'wideInterior' | 'medium' | 'close' | 'insert' | 'abstract';
  mood: MoodName;
  /** camera of the design: move and speed in percent per second */
  cam: CamMove; pct: number;
  /** anchor word and its FILM frame (subtract f0 for the in-shot frame) */
  anchor: string; anchorF: number;
  set: string;
  /** placeholder card colour only */
  tint: string;
};
const shot = (id: string, group: GroupId, f0: number, f1: number, type: ShotMeta['type'], mood: MoodName, cam: CamMove, pct: number,
  anchor: string, anchorF: number, set: string, tint: string): ShotMeta =>
  ({id, comp: `${EP}-${id.toLowerCase()}`, group, f0, f1, len: f1 - f0, type, mood, cam, pct, anchor, anchorF, set, tint});

/** All ten shots in film order. Hard cuts at f0. Lengths 60+72+62+62+49+44+42+44+45+65 = 545. */
export const SHOTS: ShotMeta[] = [
  shot('S1', 'A', 0, 60, 'close', 'nightExterior', 'push', 3, 'scarred', 36, 'Throne hall, position 3, extreme close', '#6b7088'),
  shot('S2', 'A', 60, 132, 'medium', 'nightExterior', 'push', 1, 'single', 84, 'Throne hall, position 2, cracked column', '#7d7f9c'),
  shot('S3', 'A', 132, 194, 'wideInterior', 'nightExterior', 'truckRight', 2, 'man', 156, 'Throne hall, position 1, clouds and snow', '#565f9a'),
  shot('S4', 'A', 194, 256, 'close', 'nightExterior', 'push', 2, 'one', 204, 'Throne hall, position 3, close', '#5d6a86'),
  shot('S5', 'A', 256, 305, 'wideInterior', 'nightExterior', 'pull', 3, 'leave', 280, 'Throne hall, position 6, lights out', '#3f4a8a'),
  shot('S6', 'C', 305, 349, 'insert', 'nightExterior', 'push', 3, 'back', 321, 'Hall outlook, rewind', '#7c80b8'),
  shot('S7', 'B', 349, 391, 'wideExterior', 'dusk', 'truckLeft', 2.5, 'camp', 369, 'Mountain camp, position 1, dusk', '#6f7f9c'),
  shot('S8', 'B', 391, 435, 'close', 'dusk', 'push', 0.8, 'boy', 403, 'Mountain camp, position 3, close', '#a39a86'),
  shot('S9', 'C', 435, 480, 'medium', 'dayInterior', 'push', 1, 'Kings', 443, "King's stone room, royal birth", '#8f8590'),
  shot('S10', 'B', 480, 545, 'medium', 'nightExterior', 'push', 1, 'Victor', 488, 'Mountain camp, position 2, birth night', '#4a5676'),
];
export const SHOT = Object.fromEntries(SHOTS.map((s) => [s.id, s])) as Record<string, ShotMeta>;
/** film frame -> frame inside the shot */
export const inShot = (id: string, filmFrame: number): number => filmFrame - SHOT[id].f0;

export const GROUPS: {id: GroupId; name: string; file: string; shots: string[]; newArt: boolean}[] = [
  {id: 'A', name: 'Throne hall', file: 'groups/A.tsx', shots: ['S1', 'S2', 'S3', 'S4', 'S5'], newArt: false},
  {id: 'B', name: 'Mountain camp', file: 'groups/B.tsx', shots: ['S7', 'S8', 'S10'], newArt: true},
  {id: 'C', name: "Tower view and king's room", file: 'groups/C.tsx', shots: ['S6', 'S9'], newArt: false},
];

// ---------------------------------------------------------------------------------------------------------------
// The S9 / S10 pair (groups C and B). Fractions are of the 1280x720 frame ON FRAME 0 OF EACH SHOT; px = the same in pixels.
// ---------------------------------------------------------------------------------------------------------------
export const PAIR = {
  /** canopy peak (S9) and tent peak (S10): the same screen point */
  apexFrac: [0.5, 0.2] as P2,
  /** apex to ground line, as a share of frame height */
  heightFrac: 0.6,
  /** base width as a share of frame width */
  baseFrac: 0.46,
  /** screen triangle in pixels, y down: apex, base left, base right */
  px: {apex: [640, 144] as P2, baseL: [345.6, 576] as P2, baseR: [934.4, 576] as P2, groundY: 576, height: 432, base: 588.8},
  /** both shots: constant drift-push centred on the apex column, running first frame to last */
  cam: {move: 'push' as const, pctPerSec: 1},
  /** sharp vertical foreground edge covering the leftmost 6 % of the frame at f0: stone pillar (S9), dark wagon edge (S10) */
  edge: {frac: 0.06, px: 76.8, s9: 'stone pillar', s10: 'wagon edge'},
};

/** The bundle: ONE closed polygon, clockwise, in a unit box (x right, y DOWN as listed in the design; flip y for a
 *  y-up card). Aspect 2.2 : 1. Drawn 9 % of frame width wide = 115.2 px x 52.4 px. White (cream) with one pale blue
 *  fold tone in the gold cradle (S9); a single dark shadow tone on the mother's forearms (S10). No face. */
export const BUNDLE = {
  pts: [[0, 0.5], [0.12, 0.15], [0.4, 0], [0.75, 0.05], [1, 0.4], [0.95, 0.75], [0.7, 1], [0.3, 1], [0.08, 0.85]] as P2[],
  aspect: 2.2,
  widthFrac: 0.09,
  px: {w: 115.2, h: 52.36},
  /** rocking, the same in both shots: plus and minus 4 degrees, period 16 f, on twos */
  rock: {deg: 4, period: 16},
  /** PROPOSED tones */
  s9: {fill: '#f3eee0', fold: '#c9d6ea'},
  s10: {fill: '#2b2a3c'},
};
/** bundle points scaled to a width, centred on its box, y UP (ready for a kit Poly) */
export const bundlePts = (width: number): P2[] => BUNDLE.pts.map(([x, y]) => [(x - 0.5) * width, (0.5 - y) * width / BUNDLE.aspect]);

// ---------------------------------------------------------------------------------------------------------------
// Snow: the film's time device. Group A owns the state machine; S6 (group C) continues it; S7 / S8 / S10 fall normally.
// ---------------------------------------------------------------------------------------------------------------
export const SNOW = {
  layers: 2,
  count: 48,
  countS10: 60,
  /** flake diameters: the design gives 4 px and 7 px at 1080p */
  px1080: [4, 7] as P2,
  px720: [2.67, 4.67] as P2,
  /** PROPOSED: cream-blue, never pure white */
  color: '#e6ecf5',
  colorFar: '#c9d4ea',
  /** FILM frames of the state machine */
  fallFrom: 179,
  hangAt: 280,
  riseFrom: 291,
  /** S6 (305-349) runs the same field upward for the whole shot; from S7 (349) it falls normally again */
  risingShot: 'S6',
  normalAgainFrom: 349,
};

/** Three flat pale clouds, 2 tones, first drawn in S3 (pop in f167, 169, 171, then drift right; they reverse from
 *  f291). S6 shows the edge of the LOWEST one drifting right to left. Tones copied from the hall's own cloud cards. */
export const CLOUDS = {
  count: 3,
  tones: {top: '#eef2fb', under: '#cfd8ee'},
  popFrames: [167, 169, 171],
  reverseFrom: 291,
  /** the hall's cloud lump layout (x, y, r in cloud units): top lumps, underside lumps, flat base w x h at y */
  lumpsTop: [[0, 0, 1.2], [-1.3, -0.3, 0.9], [1.4, -0.25, 1.0], [0.6, 0.5, 0.8], [-2.3, -0.6, 0.6], [2.5, -0.6, 0.6]] as [number, number, number][],
  lumpsUnder: [[-1.0, -0.65, 0.75], [0.9, -0.6, 0.8], [-0.1, -0.75, 0.7]] as [number, number, number][],
  base: {w: 6.4, h: 1, y: -1.0},
};

/** Three flat dark-green pines with cream-blue snow caps; the same order left to right in S6 and on the S7 tree line. */
export const PINES = {
  heights: [1, 0.8, 0.9] as [number, number, number],
  /** the hall's pine triangle: half base 2.1 for height h (hall heights 7-12 world units) */
  halfBaseOverHeight: 0.22,
  greens: ['#2f7a52', '#3b8a5c'] as [string, string],
  cap: '#e6ecf5',
  /** S6: pop in at film frames 337, 339, 341 where the towers stood, leaving the tallest tower's gap empty */
  popFrames: [337, 339, 341],
};

/** The hall's far mountain cards, copied point for point from src/sets/ThroneHall.tsx (world units of that set:
 *  each card is placed at `pos`). The landmark in S3, S5, S6, S7 and S10 is the TALLEST peak: range vertex [-78, 38].
 *  Copy these as POLYGONS (S6 enlarges them about 2.5 times); never a scaled raster. */
export const MOUNTAINS = {
  range: {pts: [[-170, 0], [-128, 30], [-104, 14], [-78, 38], [-50, 16], [-28, 30], [-4, 12], [24, 36], [50, 15], [78, 32], [108, 12], [136, 30], [170, 0]] as P2[],
    color: '#8e9cc4', pos: [0, -2, -140] as [number, number, number]},
  /** white cap, placed with its tip at each summit: pos = [x, y - 4, -139.5] for every summit below */
  cap: {pts: [[0, 0], [9, -11], [5, -9], [2, -13], [-2, -9], [-5, -12], [-9, -11]] as P2[], color: '#f6f8fd', dy: -4},
  summits: [[-128, 30], [-78, 38], [-28, 30], [24, 36], [78, 32], [136, 30]] as P2[],
  tallest: [-78, 38] as P2,
  /** PROPOSED (not in the hall as built, the design asks for it): the pale blue shadow facet on the tallest peak's
   *  screen-right flank, in the range card's own coordinates. Group A fixes it in S3; S5, S6, S7, S10 copy it. */
  facet: {pts: [[-78, 38], [-50, 16], [-66, 16], [-74, 27]] as P2[], color: '#b9c6e6'},
  frontRidge: {pts: [[-170, 0], [-120, 14], [-70, 6], [-20, 16], [30, 7], [80, 15], [130, 6], [170, 12], [170, -10], [-170, -10]] as P2[],
    color: '#b9c6e6', pos: [0, -2, -125] as [number, number, number]},
  snowField: {pts: [[-170, 0], [-110, 5], [-50, 1], [10, 6], [70, 2], [120, 6], [170, 1], [170, -8], [-170, -8]] as P2[],
    color: '#e8eef8', pos: [0, -3, -92] as [number, number, number]},
  /** green hill / forest band of the hall: plane 400 x 12 at [0, -8, -103] */
  hillBand: {w: 400, h: 12, color: '#2f7a52', pos: [0, -8, -103] as [number, number, number]},
};

/** The hall's towers as built (base position, height, width, body colour). Body = box w x h x w, cap box 1.2w x 0.3w,
 *  roof = 4-sided cone r 0.8w, h 2.4w, colour ROOF. Windows: diamonds 0.2w wide, 0.32w tall, at heights
 *  0.86 / 0.72 / 0.58 / 0.44 of h, alternating x = -0.2w / +0.2w. In this episode windows are FLAT and CONSTANT
 *  (no glow disc, no sine flicker); they only switch off as declared events. S6 uses three of these (tallest about
 *  70 % of frame height, the others 55 and 45 %): group C picks which three and writes the choice here. */
export const TOWERS = {
  roof: '#8d8a8c',
  window: '#ffe9a0',
  windowOff: '#6f7396',
  windowHeights: [0.86, 0.72, 0.58, 0.44],
  near: [
    {pos: [-15, -6, -40], h: 15, w: 3.6, c: '#b9bfe6'}, {pos: [-9, -6, -46], h: 12.5, w: 3.2, c: '#aeb4de'},
    {pos: [11, -6, -42], h: 14, w: 3.4, c: '#b9bfe6'}, {pos: [17, -6, -48], h: 19, w: 4, c: '#aeb4de'},
    {pos: [-22, -6, -50], h: 20, w: 4, c: '#aeb4de'},
  ],
  far: [
    {pos: [-34, -6, -82], h: 24, w: 5, c: '#aeb4dc'}, {pos: [-24, -6, -92], h: 19, w: 4, c: '#a2a8d4'},
    {pos: [22, -6, -86], h: 25, w: 4.6, c: '#aeb4dc'}, {pos: [36, -6, -80], h: 20, w: 4.4, c: '#a2a8d4'},
  ],
  /** S6 film frames: windows off 309 / 311 / 313; towers pop out 321 / 327 / 333 (tallest first) */
  s6WindowsOff: [309, 311, 313],
  s6PopOut: [321, 327, 333],
  /** S2: one lit tower window switches off (flat swap) */
  s2WindowOff: 104,
  /** S6: fire point and tiny seated figure appear in the tallest tower's gap */
  s6FirePoint: 343,
};

// ---------------------------------------------------------------------------------------------------------------
// Colours. `hall` is copied from the set as built. `camp`, `kingRoom` and `boy` are PROPOSED from the design's words.
// ---------------------------------------------------------------------------------------------------------------
export const COLORS = {
  hall: {
    cream: '#f6f0e0', cream2: '#e5dec8', cream3: '#eee7d4', gold: '#e2b63a', gold2: '#c99a2c', goldLight: '#f1d362',
    green: '#4cc05c', green2: '#2f9a48', sky: '#1c2271', sky2: '#262a8c', skyBand: '#3640a8', skyLow: '#3344a6',
    lilac: '#aeb4dc', roof: '#8d8a8c',
    /** lantern body and flame are FLAT cream / yellow shapes: no halo, no point-light bloom */
    lanternOn: '#fff3c4', lanternFlame: '#ffd77a', lanternOff: '#7f869c',
    /** S5 after both lanterns are off: floor and steps one cool step darker (never near white) */
    floor: '#e0d9c6', floorLightsOut: '#c3c6cf',
  },
  /** slate blue and blue-grey snow about 70 %, canvas cream and ochre about 20 %, warm points about 10 % */
  camp: {
    duskSky: ['#3d4a78', '#6a6f9a', '#b98f8f'] as [string, string, string],
    nightSky: ['#141a40', '#1c2456', '#28326a'] as [string, string, string],
    snow: '#c9d4ea', snowLight: '#e6ecf5', snowShade: '#9fb0d0', path: '#aebbd8',
    canvas: '#d9cfb4', canvasShade: '#b7ab8c', canvasLit: '#f0e2b4', canvasLitDim: '#dccf9e',
    ochrePatch: '#b98a45', greenPatch: '#2f9a48', wagon: '#4a3f4c', wagonEdge: '#2c2836', tin: '#8f97a8',
    fire: ['#ffd55a', '#f59b3a', '#d95f2c'] as [string, string, string],
    shadowFigure: '#2b2a3c',
  },
  kingRoom: {canopyRed: '#b8352f', canopyRed2: '#8f2726', gold: '#e2b63a', gold2: '#c99a2c', pillarEdge: '#6f6878', crown: '#f1d362'},
  /** the boy's shawl rhymes with the tent's green patch and the ruler's cloak: one green for all three */
  boy: {shawl: '#2f9a48', shawlShade: '#237a3a', patch: '#b98a45', hair: '#2a2430', skin: '#f0c9a0', coldPink: '#e89a94'},
  tinyFigure: {body: '#237a3a', head: '#1c2a24'},
};

/** Character scale. The ruler's front rig stands 2.9 world units in the hall as built. */
export const SCALE = {
  rulerWorldH: 2.9,
  queenWorldH: 3.0,
  /** the boy is about 55 % of the ruler's height */
  boyOverRuler: 0.55,
  boyWorldH: 1.6,
  /** share of frame height per shot, from the design's framing lines */
  frameShare: {
    S2: {ruler: 0.62}, S3: {ruler: 0.28, queen: 0.22}, S4: {rulerFace: 0.8}, S5: {ruler: [0.24, 0.225], queen: [0.2, 0.188]},
    S6: {tallestTower: 0.7, towers: [0.7, 0.55, 0.45], tinyFigure: 0.025}, S7: {campFolk: 0.2, boyBack: 0.2},
    S8: {boyFace: 0.7}, S9: {canopyGroup: 0.6, king: 0.58}, S10: {tent: 0.6, motherShadow: 0.38},
  },
  /** S1: the screen-left eye slit is 38 % of frame width */
  s1SlitWidthFrac: 0.38,
  /** S8 name tag: one word, glyph height at least 4 % of frame height, static after film frame 403, bump at 426 */
  tag: {text: 'victor', minGlyphFrac: 0.04, from: 391, bump: 426},
};

/** Finish rules every group applies (bible section 8): crisp, no blur anywhere in this segment, no Glow at all. */
export const FINISH = {blur: 0, glow: 0, starsHall: 30, starsS6: 8, starsCampNight: 20, starsCampDusk: 0, meanLumaTarget: 150};
