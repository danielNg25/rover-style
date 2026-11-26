/** cutout3d shared mould, drawn on a 2D canvas so the same picture serves stills and the 3D stage (as a texture
 *  that casts a real shadow). Source of the numbers: DANH-MUC-HINH-v2.md and the measured reference frames
 *  (close-up 2892, standing boy 2166, coat front 2798, coat back 2960).
 *  Units: the head mould's own (face 382 wide, eye line 290, chin 548, soles 1197, body centre x 272). */
import {resolvePosture, POSTURES} from './dang';
import type {Posture, PostureName} from './dang';
export type Upper = 'none' | 'flat' | 'angry' | 'sad';
export type Lower = 'none' | 'flat' | 'curve';
export type Mouth = 'down' | 'up' | 'flat' | 'open' | 'grit' | 'o' | 'aw' | 'smirk';
export type Brow = 'arc' | 'sad' | 'angry' | 'none';
export type Expr = {
  upper: Upper; lower?: Lower; closed?: boolean; pupil?: 'normal' | 'small' | 'dot'; gaze?: [number, number];
  blank?: boolean; lowerAmt?: number;   // lowerAmt: how far the curved lower lid rises (1 = normal, 1.6 = squint)   // whites with no pupils: the single frame on which a blink reopens (v3 D18)
  brow: Brow; browY?: number; mouth: Mouth;
  /** (23/11/2026) eyes that shine: a flat dot of this colour with a pale core over the pupil. With `blank: true` the dot is the whole eye (a robot) */
  glow?: string;
  /** (23/11/2026) mắt đờ của người bị thao túng: mí sụp ít nhất nửa mắt, nhìn thẳng vô hồn, không có đốm sáng. Một màu: tròng thành vòng màu đó, con ngươi tí hon;
   *  true: tròng thường, con ngươi nhỏ. Bật tắt qua `act`: {f, expr: {dazed: '#b878ff'}}, tắt bằng {dazed: undefined} hoặc `resetLid`. Không khai báo: mắt như cũ */
  dazed?: boolean | string;
  /** the name of a picture drawn on the iris, inside the eye's clip so the lids still cover it (registerIrisArt). Unset: the plain iris. */
  irisArt?: string;
  lidL?: [number, number]; lidR?: [number, number];   // exact lid line [outer y, inner y] from the eye centre
};
/** thân đá. light, dark, crack: ba sắc của mảng đá; size: cỡ mảng. Vóc khổng lồ (chỉ có khi khai báo): arm, fist, leg = độ to của tay, nắm đấm, chân; out, legOut = vai và hông dạt ra;
 *  tall = phóng cả người quanh bàn chân (đầu lún xuống thì vẫn cao đúng `height`); headDy = đầu lún giữa hai vai */
export type RockBody = {light: string; crack: string; dark?: string; size?: number; arm?: number; fist?: number; leg?: number; out?: number; legOut?: number; tall?: number; headDy?: number};
export type Hand = 'open' | 'back' | 'relaxed' | 'fist' | 'point' | 'edge' | 'cup' | 'grip' | 'clasp';
export type ArmPose = {sh: number; el?: number; wrist?: number; hand?: Hand; show?: boolean; front?: boolean; smear?: boolean;
  /** the arm drawn this many times longer (upper arm and forearm, same thickness, same shoulder), for a reach above the head, to a board or down to the ground. Unset: 1 */
  len?: number;
  /** (23/11/2026, Reed) a rubber arm: this many times its length along `sh`, thinner as it grows, a slow S of `bow` units (default 20); `el` is ignored. Needs `wideCard` on the Spec. */
  stretch?: number; bow?: number;
  /** (23/11/2026, dáng đánh nhau) tay giáp của Doom dài ra bấy nhiêu lần, để đòn với tới; người thường bỏ qua. Không có: tay Doom như cũ */
  dai?: number};   // smear: the blurred drawing of a fast swing (v3 A7)
export type Leg = {dx?: number; lift?: number; toe?: number};
export type Spec = {
  view?: 'front' | 'back'; outfit: 'vest' | 'coat' | 'doom'; hair: 'sweep' | 'level' | 'bald' | 'bun' | 'smooth'; expr: Expr;
  /** outfit 'doom' only (Doctor Doom: hood, cloak over a tunic, armour): what covers the face. 'iron' (default) = the riveted mask,
   *  whose eye openings show the mould's own eyes, so the lids, the gaze and the brow of `expr` still play; 'hot' = the same mask
   *  still glowing from the forge; 'none' = the bare face inside the hood (skin, scar and expression from the usual fields). */
  mask?: 'iron' | 'hot' | 'none' | 'dark';   // 'dark' = no mask yet and the face NOT shown: the inside of the hood is in shadow
  /** how hot the iron mask still is: 0 = cold grey (default), 1 = glowing as it left the forge ('hot' is the same as heat 1);
   *  animate it from 1 to 0 for the mask cooling on his face */
  heat?: number;
  /** outfit 'doom': bulk = how broad the body is. 1.3 (the default) is the build measured on the reference: shoulders 1.5 masks
   *  apart, fat limbs, a cape 2.6 masks wide; another value scales the breadth about the centre line. sit = seated: the body drops until the hips are level with the knees, the knees come forward over the hem of the
   *  tunic and the shins hang to the planted feet; put a seat under him in the set. */
  bulk?: number; sit?: boolean;
  /** a shawl over the shoulders of a coat figure (a long dress): its colour. It replaces the coat's fur collar. */
  shawl?: string;
  beard?: string;   // colour of a full beard drawn over the lower face (the mouth sits on it)
  /** a scar down one cheek: side in the mould's own space ('L' = screen left on a figure that is not flipped); fresh = still red */
  scar?: {side: 'L' | 'R'; fresh?: boolean; heavy?: boolean; paint?: boolean};   // heavy: a burnt cheek, a second cut on the other side and stitches (Doom without the mask)
  head?: {dx?: number; dy?: number; rot?: number}; faceDy?: number;
  /** x: the whole figure shifted sideways (mould units). sway: how far the hem of a hanging garment trails the shoulders;
   *  flare: the hem spread wider (0.3 = 30 %). feet: 'step' puts one foot out, for a shift of weight. */
  x?: number; sway?: number; flare?: number; feet?: 'stand' | 'step';
  /** Lower body. The FEET STAY PLANTED while the upper body moves above them: hip = hips, torso, arms and head shifted
   *  sideways over the feet (a shift of weight), hipDy = lifted (the bob of a walk), lean = tipped about the hip line.
   *  legL / legR place each foot: dx = the ankle moved sideways from its rest place, lift = raised, toe = the shoe turned up. */
  hip?: number; hipDy?: number; legL?: Leg; legR?: Leg;
  /** whole-body moves: y = lifted off the ground (mould units, up is positive: a hop; negative: a dip),
   *  lean = the upper body tipped about the hip line, in degrees (positive = toward the figure's own right; the feet do not turn) */
  y?: number; lean?: number;
  whites?: string;
  /** this character's own colours (skin, hair, shirt, vest, shorts, shoe ...): one mould, any person */
  palette?: Palette; longLegs?: boolean;
  /** 'adult' shrinks the head to the adult share of the figure (measured on the reference: an adult's head with hair is
   *  about 35 % of the height, a child's about 45 %; the mould itself was measured on a child). */
  build?: 'child' | 'adult';
  /** additions for the Latveria chapters (22/11/2026). moustache / goatee: their colour (a moustache with turned-up ends, a tuft on
   *  the chin; the full `beard` stays as it was). scarf: a headscarf's colour, with the hair falling long beside the face under it.
   *  helmet: an iron helmet's colour (dome, brim, nose guard), front and back. emblem: the colour of a diamond badge on the chest.
   *  apron: the colour of a work apron over a vest figure's shirt. */
  moustache?: string; goatee?: string; scarf?: string; helmet?: string; emblem?: string; apron?: string;
  /** tie: a necktie on a vest figure's shirt (its colour). skirt: a long skirt over a vest figure's legs, hips to ankles (its colour;
   *  the vest and shirt stay). ponytail: a long tail of hair brought forward over the figure's left shoulder (true), tied with a
   *  ribbon of this colour if a string. From behind use backHair 'long'. */
  tie?: string; skirt?: string; ponytail?: boolean | string;
  /** the outline of the face below the eyes, so that people do not all share one face (Daniel, 22/11/2026: "mặt cũng đang hình như
   *  dùng cùng 1 khuôn"): 'round' (default, the mould's own), 'square' (broad flat jaw), 'long' (narrow, long chin), 'heart'
   *  (wide cheekbones, pointed chin), 'wide' (heavy jowls). */
  faceShape?: 'round' | 'square' | 'long' | 'heart' | 'wide' | 'oval';
  /** a girl's or a woman's face (Daniel, 23/11/2026, Valeria: "con gái mà làm mặt con trai"): lashes = three lashes at the outer
   *  corner of each eye and a darker upper lid; lips = the colour of the lips (drawn under the mouth line); blush = the colour of
   *  the cheeks; sideLocks = a lock of hair down each side of the face to below the jaw. faceShape 'oval' = soft, narrow chin. */
  lashes?: boolean; lips?: string; blush?: string; sideLocks?: boolean;
  /** a sick or worn-out face: a dark crescent under each eye, in this colour (Daniel, 23/11/2026, the Baroness: "nhợt nhạt hơn kiểu
   *  bệnh hơn"). Use it with a pale, greyish skin palette. */
  eyeBags?: string;
  /** the face part-way to another outline: k 0 = faceShape, 1 = shape (a child's face growing into the adult's; see LonLen.tsx) */
  faceTo?: {shape: 'round' | 'square' | 'long' | 'heart' | 'wide' | 'oval'; k: number};
  /** the size of the head: 1 = a child's (build 'child'), 0.8 = an adult's (build 'adult'). Given, it replaces what `build` says,
   *  so that a child can grow into an adult without a jump (LonLen.tsx). */
  headK?: number;
  /** royal dress on a coat figure (a king, a baron): gold = the colour of the trim. Draws an ermine collar with black tails, gold
   *  bands down the front and round the hem with a row of gems, a jewelled chain with a pendant, and glints on the gold.
   *  gem = the colour of the stones. crown = a crown's colour (worn on the head). */
  regal?: {gold: string; gem?: string}; crown?: string;
  /** messy = unkempt hair: tufts standing out of the hair mass (a wild child). snow 0..1 = snow lying on the top of the head and
   *  on the shoulders (someone out in a blizzard); it is painted only on the figure. */
  messy?: boolean; snow?: number;
  backHair?: BackHead;
  /** colour of the headscarf or the hat of a head seen from behind (backHair 'scarf' / 'hat') */
  backCloth?: string;   // colour of the eye whites; they take the scene's cast (grey in cold scenes, cream in warm ones)
  armL?: ArmPose; armR?: ArmPose;
  /** a channel's own hair, costume or marks, painted by functions the channel registers (registerAddOn), so the mould stays common.
   *  Unset: nothing changes. Each entry names one add-on; opt is passed to it. */
  addOns?: {id: string; opt?: Record<string, unknown>}[];
  /** a standing vest figure's body and limbs narrowed about the centre line (0.85 = a thin teenager); the head keeps its width. Unset: 1. */
  slim?: number;
  /** (23/11/2026) an ordinary figure's body pose, `vest` or `coat`, adult or child: 'sit', 'kneel', 'buckle', 'fall', 'lie', 'stand', or the numbers
   *  part-way between two of them (mould/dang.ts; `act` moves through them on one drawing). Unset: the figure as it always was. */
  posture?: PostureName | Posture;
  /** (23/11/2026) a head wrapped in bandages, only the eyes showing: layers of cut paper in 3 tones, the eyes still act. true, or the cloth's colour and `tail: false` to drop the loose end. */
  bandage?: boolean | {color?: string; tail?: boolean};
  /** (23/11/2026) draw the brow of `expr` on a front face (it was never drawn there; off by default so that approved shots do not change). */
  browFront?: boolean;
  /** (25/11/2026) bộ khuôn KHÔNG vẽ hai mắt của nó: mắt do `mould/matChuan.ts` vẽ ở lớp `head` (mắt chuẩn theo số đo video gốc, Daniel duyệt). */
  noEyes?: boolean;
  /** (23/11/2026) Doom seen from behind, drawn in full (`view: 'back'`, outfit 'doom'): a peaked hood with a centre seam, a collar, a mantle over broad shoulders, a cape in sharp folds with
   *  a ragged hem, the armoured arms and gauntlets at its sides following armL / armR. tense 0..1 = the shoulders drawn up. Unset: the old plain shape. */
  backDetail?: boolean | {tense?: number};
  /** (23/11/2026) a hard rim of light down one side of the outline (fire, a hot mask). side in the mould's own space ('R' = screen right on a figure that is not flipped); amount 0..1 */
  rim?: {side: 'L' | 'R'; color: string; amount?: number};
  /** ---- lô chương 10-14 (23/11/2026), mỗi trường chỉ có tác dụng khi được khai báo; cách gọi ở skill 3, mục "Dàn lô 10-14" ----
   *  temples: màu mảng tóc ở hai thái dương. longHair: tóc dài rủ qua vai tới ngực (true = màu tóc, hoặc một màu).
   *  suit: bộ đồ liền trên người `vest` (cho shirt = vest = shorts cùng màu): glove = găng, boot = ủng, line = đường may, belt, plain = không đường may.
   *  broad: thân và tay rộng ra quanh trục giữa (đầu giữ nguyên), chạy cả với `posture`. wideCard: tấm rộng hơn cho tay dang xa, tay co giãn.
   *  rock: thân đá, các mảng đá đi theo từng bộ phận. flame: thân lửa, t = số khung. sheen: vệt phản chiếu dọc tay, ngực, đùi của thân kim loại.
   *  dust: bụi bám 0..1. cape: áo choàng sau lưng người mặc đồ liền. */
  temples?: string; longHair?: boolean | string;
  suit?: {glove?: string; gloveDark?: string; boot?: string; line?: string; belt?: string; plain?: boolean};
  broad?: number; wideCard?: boolean; rock?: RockBody; flame?: {t?: number; k?: number}; sheen?: string; dust?: number; cape?: {color: string; dark?: string};
  /** (23/11/2026) nhịp sóng của áo choàng đang bay trong dáng đánh nhau: truyền số khung */
  capeT?: number;
  /** (23/11/2026) người `vest`: tay áo xắn tới dưới khuỷu, cẳng tay để trần. Không khai báo: tay áo dài như cũ */
  rolled?: boolean;
};
/** The part of the mould space a figure can reach (arms spread or raised); the texture covers exactly this. */
export const BOX = {x: -240, y: -24, w: 1024, h: 1244};   // widened 22/11/2026: Doom's shoulders are broad, and his spread arms reach x -228 and 772
/** the card of a figure: BOX, or a wider one for a body that lies along the ground (posture with a roll) */
const BOX_WIDE = {x: -560, y: -24, w: 1664, h: 1244};
/** a body of fire: room above the head for the column of flame */
const BOX_FIRE = {x: -420, y: -460, w: 1384, h: 1680};
/** dáng đánh nhau: cao hơn BOX_WIDE vì tay vung, người bị hất vượt quá đỉnh đầu lúc đứng */
const BOX_ACT = {x: -560, y: -324, w: 1664, h: 1544};
/** người lửa trong dáng đánh nhau (bay ngang, tay vươn xa) */
const BOX_FIRE_ACT = {x: -860, y: -460, w: 2264, h: 1680};
export const boxOf = (s: Pick<Spec, 'posture' | 'wideCard' | 'flame'>) => { const acting = s.posture !== undefined && (resolvePosture(s.posture).hanh ?? 0) > 0; return s.flame ? (acting ? BOX_FIRE_ACT : BOX_FIRE) : acting ? BOX_ACT : (s.wideCard || (s.posture !== undefined && resolvePosture(s.posture).roll !== 0) ? BOX_WIDE : BOX); };
export const SOLE_Y = 1197, CENTRE_X = 272, HAIR_TOP = 6;

type C = CanvasRenderingContext2D;
type Pt = [number, number];
const EYE = {y: 290, rx: 86, ry: 80, L: 196, R: 361};
const K0 = {skinA: '#dba57d', skinB: '#cb9875', skinC: '#b98a6e', skin: '#cb9875', skinDark: '#a9785b', lidEdge: '#85624b', whiteA: '#f3efe7', whiteB: '#e5e1db',
  hair: '#1f1614', hairLine: '#4f433f', brow: '#140d0b', iris: '#69442e', pupil: '#161110', mouth: '#19120d', earMark: '#9d7455',
  shirt: '#dccfb0', shirtEdge: '#c4b08f', shirtRim: '#ebe2ca', vest: '#7e3b2f', shorts: '#59483a', shoe: '#372a23', button: '#94896c',
  coat: '#5e4329', coatDark: '#48321f', coatLight: '#6a4b2e', fur: '#a78f69', furDark: '#93794f', trouser: '#5d4c3c',
  cloak: '#2f7a3d', cloakDark: '#1e5529', cloakLight: '#429a52', cloakIn: '#133a1d', plate: '#b3bfcc', plateLine: '#4f5966', tunic: '#34853f', armour: '#a8adb3', armourDark: '#70767e', armourLight: '#d5d9dc',
  gold: '#dcae3a', goldDark: '#a47a1c', belt: '#6a4424', socket: '#24262a'};
/** the colours in use while one figure is drawn: the defaults above with that figure's own palette over them */
let K = {...K0};
/** set from the figure being drawn (drawFigureBase): gloves over the hands, stone plates, a metal sheen */
let FIRE_BODY = false, GLOVE: {a: string; d: string} | null = null, ROCK: RockBody | null = null, SHEEN: string | null = null, ROLLED = false;
export type Palette = Partial<typeof K0>;
/** CHANNEL ADD-ONS (23/11/2026). A channel registers painters from its own folder; a figure asks for them with `spec.addOns`.
 *  Layers, all in mould units: headBack = inside the head's transform, before the hair and the face (long hair behind the head);
 *  head = inside the head's transform, over the finished face and hair (headband, marks; eyes at x 196 and 361, y 290);
 *  chest = on the upper body, before the head (front views of vest and coat figures without a shawl);
 *  headFull = draws the WHOLE front of the head instead of the mould's own (hair, ears, face, eyes, mouth): a channel with another
 *  drawing style. Same space: the chin at about (272, 548), scaled by headK about that point;
 *  legs = after both legs and shoes of a standing vest figure, before the body; rearHead, rearBody = the same for a vest figure seen from
 *  behind (`view: 'back'`): over the back of the head, and over the back of the body before the head.
 *  rearPosed (23/11/2026) = like rearBody, for a vest figure seen from behind while it has a `posture` (kneeling); rearBody does not run there. */
export type AddOnLayer = 'headBack' | 'head' | 'chest' | 'headFull' | 'legs' | 'rearHead' | 'rearBody' | 'rearPosed';
export type AddOnPainter = Partial<Record<AddOnLayer, (c: CanvasRenderingContext2D, s: Spec, opt: Record<string, unknown>) => void>>;
const ADD_ONS: Record<string, AddOnPainter> = {};
export const registerAddOn = (id: string, p: AddOnPainter) => { ADD_ONS[id] = p; };
const runAddOns = (c: CanvasRenderingContext2D, s: Spec, layer: AddOnLayer) => s.addOns?.forEach((a) => ADD_ONS[a.id]?.[layer]?.(c, s, a.opt ?? {}));
/** a picture on the iris: (px, py) its centre, r the radius of the plain iris; drawn inside the eye's clip */
export type IrisArt = (c: CanvasRenderingContext2D, px: number, py: number, r: number, side: 'L' | 'R') => void;
const IRIS_ART: Record<string, IrisArt> = {};
export const registerIrisArt = (id: string, p: IrisArt) => { IRIS_ART[id] = p; };

const fillP = (c: C, d: string, style: string | CanvasGradient) => { c.fillStyle = style; c.fill(new Path2D(d)); };
const strokeP = (c: C, d: string, col: string, w: number, cap: CanvasLineCap = 'round') => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = cap; c.lineJoin = 'round'; c.stroke(new Path2D(d)); };
const seg = (c: C, x1: number, y1: number, x2: number, y2: number, w: number, col: string, cap: CanvasLineCap = 'round') => strokeP(c, `M${x1},${y1} L${x2},${y2}`, col, w, cap);
const ell = (c: C, cx: number, cy: number, rx: number, ry: number, style: string | CanvasGradient) => { c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = style; c.fill(); };
const shadeHex = (hex: string, k: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
const poly = (pts: Pt[]) => 'M' + pts.map((p) => p.join(',')).join(' L') + ' Z';

/** A curved stroke with pointed ends, `thick` wide in the middle; bend > 0 bows upward. */
const blade = (a: Pt, b: Pt, bend: number, thick: number) => {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
  let nx = dy / l, ny = -dx / l; if (ny > 0) { nx = -nx; ny = -ny; }
  const q = (k: number) => `${mx + nx * k * 2},${my + ny * k * 2}`;
  return `M${a[0]},${a[1]} Q${q(bend + thick / 2)} ${b[0]},${b[1]} Q${q(bend - thick / 2)} ${a[0]},${a[1]} Z`;
};
/** Closed outline through the points; corners are rounded except the indices in `sharp`. */
const soft = (pts: Pt[], sharp: number[]) => {
  const n = pts.length, mid = (i: number): Pt => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
  let d = `M${mid(n - 1).join(',')}`;
  pts.forEach((p, i) => { const m = mid(i); d += sharp.includes(i) ? ` L${p.join(',')} L${m.join(',')}` : ` Q${p.join(',')} ${m.join(',')}`; });
  return d + ' Z';
};
const range = (a: number, b: number) => Array.from({length: b - a + 1}, (_, i) => a + i);

// ---------- face ----------
const LID: Record<Exclude<Upper, 'none'>, [number, number]> = {flat: [10, 10], angry: [-72, -18], sad: [-13, -52]};
/** mắt đờ (`expr.dazed`): mép mí trên nằm thấp hơn tâm mắt chừng này */
const DAZED_LID = 4;

/** three lashes fanning out of the outer corner of an eye; up = -1 on a shut eye (they point down and out) */
const lashes = (c: C, x: number, y: number, out: number, up: number) => {
  ([[8, 40], [34, 44], [60, 34]] as number[][]).forEach(([deg, len]) => { const a = (deg * Math.PI) / 180; fillP(c, blade([x, y], [x + out * Math.cos(a) * len, y - up * Math.sin(a) * len], up * out * -3, 9), K.brow); });
};
const eye = (c: C, side: 'L' | 'R', e: Expr, skin: CanvasGradient, white: CanvasGradient, dy: number, lash = false) => {
  const cx = EYE[side], cy = EYE.y + dy, out = side === 'L' ? -1 : 1, xo = cx + out * (EYE.rx + 5), xi = cx - out * (EYE.rx + 5), xm = cx - out * 81;
  if (e.closed) { strokeP(c, `M${cx - 66},${cy + 14} Q${cx},${cy + 56} ${cx + 66},${cy + 14}`, lash ? K.brow : K.lidEdge, lash ? 9 : 7); if (lash) lashes(c, cx + out * 62, cy + 18, out, -1); return; }
  const lid0 = (side === 'L' ? e.lidL : e.lidR) ?? (e.upper === 'none' ? null : LID[e.upper]);
  const lid: [number, number] | null = e.dazed ? (lid0 ? [Math.max(lid0[0], DAZED_LID), Math.max(lid0[1], DAZED_LID)] : [DAZED_LID, DAZED_LID]) : lid0;   // mắt đờ: mí không bao giờ cao hơn nửa mắt, chớp mắt vẫn hạ thấp hơn được
  const yAt = (x: number) => (lid ? cy + lid[0] + ((lid[1] - lid[0]) * (x - xo)) / (xi - xo) : 0);
  const pr = e.pupil === 'dot' ? [9, 5, 2.5] : e.pupil === 'small' ? [19, 10, 4] : [27, 14, 5.5];
  const [gx, gy] = e.gaze ?? (e.dazed ? [0, 20] : [-out * 6, 12]), px = cx + gx, py = cy + gy;
  // lower lid (reference: a short curved stroke that rises toward the middle of each eye, never a straight line)
  const lowAmt = e.lowerAmt ?? 1, low = e.lower === 'flat' ? cy + 54 : e.lower === 'curve' ? cy + 80 - 10 * lowAmt : cy + 200, dip = e.lower === 'curve' ? 20 * lowAmt : 0;
  c.save();
  c.beginPath(); c.ellipse(cx, cy, EYE.rx, EYE.ry, 0, 0, Math.PI * 2); c.clip();
  c.clip(new Path2D(`M${xo},${lid ? cy + lid[0] : cy - 200} L${xi},${lid ? cy + lid[1] : cy - 200} L${xi},${low} Q${cx},${low - dip} ${xo},${low} Z`));
  c.fillStyle = white; c.fillRect(cx - 100, cy - 100, 200, 200);
  if (e.dazed && !e.blank) {   // ba vòng phẳng, không đốm sáng: nhìn mà không thấy gì
    if (typeof e.dazed === 'string') { ell(c, px, py, 38, 38, shadeHex(e.dazed, 0.55)); ell(c, px, py, 30, 30, e.dazed); ell(c, px, py, 15, 15, mixHex(e.dazed, '#ffffff', 0.72)); ell(c, px, py, 5, 5, K.pupil); }
    else { ell(c, px, py, 27, 27, K.iris); ell(c, px, py, 7, 7, K.pupil); }
  } else if (!e.blank) { ell(c, px, py, pr[0], pr[0], K.iris); ell(c, px, py, pr[1], pr[1], K.pupil); ell(c, px - pr[1] * 0.55, py - pr[1] * 0.6, pr[2], pr[2], '#ffffff'); if (e.irisArt) IRIS_ART[e.irisArt]?.(c, px, py, pr[0], side); }
  if (e.glow) { ell(c, px, py, 32, 32, e.glow); ell(c, px, py, 15, 15, '#f4fff4'); }
  c.restore();
  if (lid) seg(c, cx + out * (EYE.rx + 2), yAt(cx + out * (EYE.rx + 2)), xm, yAt(xm), 8, K.lidEdge, 'butt');
  if (lash) { if (lid) {   // a lowered lid: only the outer third of its edge is dark (a whole dark edge read as one thick straight brow
      // across both eyes, d1c5-11), and three short lashes stand on that third, over the lid
      const x0 = cx + out * (EYE.rx + 2), x1 = cx + out * EYE.rx * 0.34;
      seg(c, x0, yAt(x0), x1, yAt(x1), 10, K.brow, 'round');
      ([[0.86, 38, 24], [0.66, 58, 24], [0.46, 76, 20]] as number[][]).forEach(([kx, deg, len]) => { const a = (deg * Math.PI) / 180, xa = cx + out * EYE.rx * kx, ya = yAt(xa) - 3; fillP(c, blade([xa, ya], [xa + out * Math.cos(a) * len, ya - Math.sin(a) * len], -out * 2, 8), K.brow); });
    } else {   // a wide-open eye: a dark lash line along the outer two thirds of the upper edge, the lashes standing on it
      c.save(); c.strokeStyle = K.brow; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath();
      if (out < 0) c.ellipse(cx, cy, EYE.rx, EYE.ry, 0, Math.PI * 1.02, Math.PI * 1.64); else c.ellipse(cx, cy, EYE.rx, EYE.ry, 0, Math.PI * 1.36, Math.PI * 1.98);
      c.stroke(); c.restore();
      ([[0.9, 0.42, 20, 30], [0.72, 0.68, 42, 30], [0.48, 0.87, 66, 26]] as number[][]).forEach(([kx, ky, deg, len]) => { const a = (deg * Math.PI) / 180, x0 = cx + out * EYE.rx * kx, y0 = cy - EYE.ry * ky; fillP(c, blade([x0, y0], [x0 + out * Math.cos(a) * len, y0 - Math.sin(a) * len], -out * 3, 9), K.brow); });
    } }
  if (e.lower === 'flat') seg(c, cx - 62, cy + 54, cx + 62, cy + 54, 5, K.lidEdge, 'butt');
  if (e.lower === 'curve') {
    // The lid line must lie EXACTLY on the edge of the white (the same curve that clips it), never above it. The clip is the
    // quadratic P0 (xi, low), P1 (cx, low - dip), P2 (xo, low); the stroke is the part of that same curve between ua and ub.
    const P = [[xi, low], [cx, low - dip], [xo, low]], at = (a: number, b: number, k: 0 | 1) => (1 - a) * (1 - b) * P[0][k] + ((1 - a) * b + a * (1 - b)) * P[1][k] + a * b * P[2][k];
    const ua = 0.2, ub = 0.8;
    strokeP(c, `M${at(ua, ua, 0)},${at(ua, ua, 1)} Q${at(ua, ub, 0)},${at(ua, ub, 1)} ${at(ub, ub, 0)},${at(ub, ub, 1)}`, K.lidEdge, 6); }
};

const brow = (c: C, side: 'L' | 'R', kind: Brow, y: number, thick: number) => {
  if (kind === 'none') return;
  const cx = EYE[side], out = side === 'L' ? -1 : 1, xo = cx + out * 52, xi = cx - out * 54;
  const [yo, yi, bend] = ({arc: [0, 0, 16], sad: [22, -21, 5], angry: [-30, 30, 4]} as Record<string, number[]>)[kind];
  const d = blade([xo, y + yo], [xi, y + yi], bend, thick);
  fillP(c, d, K.brow); strokeP(c, d, K.brow, 5);
};

const mouth = (c: C, kind: Mouth, dy: number, lips?: string) => {
  const x = 271, y = 450 + dy;
  if (lips) {   // the lips lie under the mouth line: a fuller lower lip, a thin upper one
    if (kind === 'down') { const d = blade([x - 80, y + 13], [x + 80, y + 15], 25, 30); fillP(c, d, lips); }
    else if (kind === 'up') { const d = blade([x - 80, y - 14], [x + 80, y - 14], -25, 30); fillP(c, d, lips); }
    else if (kind === 'flat') { ell(c, x, y + 2, 62, 15, lips); }
    else if (kind === 'smirk') strokeP(c, `M${x - 52},${y + 6} Q${x + 14},${y + 12} ${x + 60},${y - 20}`, lips, 26);
    else if (kind === 'o') ell(c, x, y + 2, 28, 33, lips);
    else if (kind === 'grit') { c.fillStyle = lips; c.beginPath(); c.roundRect(x - 78, y - 32, 156, 64, 22); c.fill(); }
    else if (kind === 'aw') strokeP(c, `M${x - 56},${y + 24} Q${x - 50},${y - 22} ${x},${y - 22} Q${x + 50},${y - 22} ${x + 56},${y + 24} Q${x},${y + 14} ${x - 56},${y + 24} Z`, lips, 14);
    else { const oy = y + 16; strokeP(c, `M${x - 72},${oy - 30} Q${x},${oy - 6} ${x + 72},${oy - 30} Q${x + 70},${oy + 56} ${x},${oy + 58} Q${x - 70},${oy + 56} ${x - 72},${oy - 30} Z`, lips, 14); }
  }
  if (kind === 'down' || kind === 'up') { const d = kind === 'down' ? blade([x - 86, y + 13], [x + 86, y + 15], 25, 11) : blade([x - 86, y - 14], [x + 86, y - 14], -25, 11); fillP(c, d, K.mouth); strokeP(c, d, K.mouth, 4); return; }
  if (kind === 'flat') { seg(c, x - 57, y, x + 57, y, 10, K.mouth); return; }
  if (kind === 'smirk') { strokeP(c, `M${x - 52},${y + 6} Q${x + 14},${y + 12} ${x + 60},${y - 20}`, K.mouth, 10); return; }   // one corner pulled up: contempt
  if (kind === 'o') { ell(c, x, y + 2, 19, 24, K.mouth); return; }
  if (kind === 'grit') {
    c.fillStyle = K.mouth; c.beginPath(); c.roundRect(x - 70, y - 24, 140, 48, 16); c.fill();
    c.fillStyle = '#f4f1ea'; c.beginPath(); c.roundRect(x - 62, y - 16, 124, 32, 9); c.fill();
    [-31, 0, 31].forEach((d) => { c.fillStyle = K.mouth; c.fillRect(x + d - 1.5, y - 16, 3, 32); }); c.fillRect(x - 62, y - 1.5, 124, 3); return;
  }
  if (kind === 'aw') {   // talking while sad: a low arch, dark inside, tongue at the bottom
    c.save(); c.clip(new Path2D(`M${x - 56},${y + 24} Q${x - 50},${y - 22} ${x},${y - 22} Q${x + 50},${y - 22} ${x + 56},${y + 24} Q${x},${y + 14} ${x - 56},${y + 24} Z`));
    c.fillStyle = '#33111b'; c.fillRect(x - 70, y - 30, 140, 70); ell(c, x, y + 26, 40, 18, '#c66170'); c.restore(); return;
  }
  const oy = y + 16;   // open smile: corners higher than the middle of the top edge
  c.save(); c.clip(new Path2D(`M${x - 72},${oy - 30} Q${x},${oy - 6} ${x + 72},${oy - 30} Q${x + 70},${oy + 56} ${x},${oy + 58} Q${x - 70},${oy + 56} ${x - 72},${oy - 30} Z`));
  c.fillStyle = '#33111b'; c.fillRect(x - 80, oy - 40, 160, 100); ell(c, x, oy + 50, 46, 26, '#c66170');
  fillP(c, `M${x - 80},${oy - 40} L${x + 80},${oy - 40} L${x + 80},${oy - 12} Q${x},${oy + 14} ${x - 80},${oy - 12} Z`, '#f4f1ea'); c.restore();
};

const HAIR = {
  sweep: {top: [[76, 286], [46, 262], [38, 222], [46, 176], [52, 128], [84, 106], [116, 80], [107, 35], [165, 66], [233, 6], [286, 56], [336, 58], [367, 17], [400, 44], [412, 70], [458, 88], [506, 72], [486, 124], [505, 170], [498, 220]] as Pt[],
    spikes: range(5, 17), line: [[464, 236], [250, 160], [183, 158], [133, 146], [98, 178], [82, 222]] as Pt[], lock: [[492, 300], [488, 392], [474, 404], [458, 384]] as Pt[], skull: 90, hy: 0},
  // the young boy: lower, wider, more tufts, fringe level just above the eyes (frame 2166)
  level: {top: [[81, 357], [43, 281], [40, 215], [47, 166], [81, 120], [115, 59], [154, 101], [186, 70], [211, 92], [252, 56], [295, 44], [325, 90], [356, 62], [387, 74], [413, 118], [463, 135], [452, 170], [474, 204], [478, 262]] as Pt[],
    spikes: range(4, 16), line: [[463, 268], [428, 214], [356, 196], [203, 190], [122, 196], [92, 226], [81, 266]] as Pt[], lock: [[476, 300], [470, 340], [458, 350], [452, 330]] as Pt[], skull: 150, hy: 38},
  // combed smooth with a parting off the middle (a woman's or a tidy child's hair): one round dome, no tufts
  smooth: {top: [[81, 357], [46, 292], [38, 222], [50, 160], [84, 110], [132, 72], [192, 48], [254, 38], [314, 42], [372, 60], [420, 94], [456, 140], [474, 196], [478, 262]] as Pt[],
    spikes: [] as number[], line: [[463, 268], [436, 222], [382, 190], [310, 158], [236, 178], [160, 196], [112, 214], [88, 240], [81, 266]] as Pt[], lock: [[476, 300], [470, 340], [458, 350], [452, 330]] as Pt[], skull: 150, hy: 38},
};

const headFront = (c: C, s: Spec) => {
  const full = s.addOns?.find((a) => ADD_ONS[a.id]?.headFull);
  if (full) { ADD_ONS[full.id].headFull!(c, s, full.opt ?? {}); return; }
  if (s.bandage) { bandagedHead(c, s); return; }
  const bald = s.hair === 'bald', h = bald ? {...HAIR.sweep, skull: 90} : HAIR[s.hair === 'sweep' ? 'sweep' : s.hair === 'smooth' ? 'smooth' : 'level'], n = h.top.length, e = s.expr, dy = s.faceDy ?? 0;
  runAddOns(c, s, 'headBack');
  if (s.longHair && !bald) {   // long hair behind the face, over the shoulders, down to the chest, in a cut edge
    const col = typeof s.longHair === 'string' ? s.longHair : K.hair, ln = shadeHex(col, 0.78);
    fillP(c, 'M64,230 C14,420 8,640 40,800 L78,772 L104,822 L138,770 L150,560 L410,560 L410,770 L440,822 L470,772 L504,800 C536,640 530,420 480,230 Z', col);
    strokeP(c, 'M58,420 Q44,600 62,752 M100,520 Q90,650 104,780 M486,420 Q500,600 482,752 M444,520 Q454,650 440,780', ln, 5);
  }
  // 'bun': the level hair with a knot standing on the crown (drawn first, so the hair mass covers its foot)
  if (s.hair === 'bun') { ell(c, 272, 42, 66, 50, K.hair); strokeP(c, 'M226,44 Q272,14 318,44', K.hairLine, 5); }
  const skin = c.createLinearGradient(70, 200, 470, 500); skin.addColorStop(0, K.skinA); skin.addColorStop(0.45, K.skinB); skin.addColorStop(1, K.skinC);
  const white = c.createLinearGradient(110, 0, 444, 0); white.addColorStop(0, s.whites ?? K.whiteA); white.addColorStop(1, s.whites ?? K.whiteB);
  const form = c.createRadialGradient(215, 285, 186, 215, 285, 300); form.addColorStop(0, 'rgba(138,90,68,0)'); form.addColorStop(1, 'rgba(138,90,68,0.3)');
  const hairD = soft([...h.top, ...h.lock, [300, 300]], [...h.spikes, n + 2]);
  if (!bald) fillP(c, hairD, K.hair);
  if (s.temples && !bald) {   // the two temples in another colour, a jagged upper edge, cut to the hair
    c.save(); c.clip(new Path2D(hairD));
    fillP(c, poly([[20, 372], [20, 196], [62, 214], [78, 170], [102, 206], [134, 182], [136, 372]]), s.temples); fillP(c, poly([[524, 372], [524, 196], [482, 214], [466, 170], [442, 206], [410, 182], [408, 372]]), s.temples);
    c.restore();
  }
  ([[75, 338, 1], [470, 340, -1]] as number[][]).forEach(([x, y, k]) => {
    ell(c, x, y, 20, 40, skin);
    fillP(c, `M${x + k * 4},${y - 20} Q${x - k * 12},${y} ${x + k * 4},${y + 20} Q${x - k * 3},${y} ${x + k * 4},${y - 20} Z`, K.earMark);
  });
  const JAWS: Record<string, string> = {round: 'C463,440 404,548 272,548 C140,548 81,440 81,300', square: 'C466,470 440,548 344,548 L200,548 C104,548 78,470 81,300', long: 'C460,420 372,574 272,574 C172,574 84,420 81,300',
    heart: 'C470,400 352,512 272,556 C192,512 74,400 81,300', oval: 'C465,424 366,546 272,552 C178,546 79,424 81,300', wide: 'C486,462 428,548 272,548 C116,548 58,462 81,300'};
  // faceTo: the outline part-way to another shape (a face that changes as a child grows up). Every outline is brought to the
  // same form (a curve, a straight chin, a curve: 14 numbers; the shapes without a flat chin get one of no length) and mixed.
  const jawNums = (k: string) => { const v = (JAWS[k].match(/-?\d+(\.\d+)?/g) ?? []).map(Number); return v.length === 12 ? [...v.slice(0, 6), v[4], v[5], ...v.slice(6)] : v; };
  const jn = (() => { const a = jawNums(s.faceShape ?? 'round'); if (!s.faceTo) return a; const b = jawNums(s.faceTo.shape), k = Math.max(0, Math.min(1, s.faceTo.k)); return a.map((x, q) => x + (b[q] - x) * k); })();
  const jaw = `C${jn.slice(0, 6).join(' ')} L${jn[6]},${jn[7]} C${jn.slice(8).join(' ')}`;
  const face = `M81,300 C81,${h.skull + 60} 190,${h.skull} 272,${h.skull} C354,${h.skull} 463,${h.skull + 60} 463,300 ${jaw} Z`;
  fillP(c, face, skin); fillP(c, face, form);
  if (ROCK) rockTex(c, face, 50, 90, 490, 590);
  if (ROCK?.arm) { const m = 'M166,398 L232,376 L312,376 L378,398 L396,486 L330,530 L214,530 L148,486 Z'; fillP(c, m, K.skinB); strokeP(c, m, ROCK.crack, 8, 'butt'); }
  if (s.blush) ([132, 412] as number[]).forEach((bx) => { const g = c.createRadialGradient(bx, 404, 4, bx, 404, 50); g.addColorStop(0, s.blush + 'b0'); g.addColorStop(1, s.blush + '00'); c.save(); c.clip(new Path2D(face)); c.translate(0, 404 * (1 - 0.62)); c.scale(1, 0.62); ell(c, bx, 404, 50, 50, g); c.restore(); });
  if (s.eyeBags) ([EYE.L, EYE.R] as number[]).forEach((ex) => { c.save(); c.globalAlpha = 0.6; fillP(c, blade([ex - 62, EYE.y + EYE.ry + 2 + dy * 0.4], [ex + 62, EYE.y + EYE.ry + 2 + dy * 0.4], -13, 16), s.eyeBags as string); c.restore(); });
  if (!s.noEyes) { eye(c, 'L', e, skin, white, dy * 0.4, s.lashes); eye(c, 'R', e, skin, white, dy * 0.4, s.lashes); }
  if (s.browFront) { const by = 192 + (e.browY ?? 0) * 0.62 + dy * 0.4; brow(c, 'L', e.brow, by, 17); brow(c, 'R', e.brow, by, 17); }
  if (s.beard) { fillP(c, 'M84,330 Q110,372 180,384 Q272,360 364,384 Q434,372 460,330 Q470,470 400,560 Q272,640 144,560 Q74,470 84,330 Z', s.beard); fillP(c, blade([190, 404], [354, 404], 14, 26), shadeHex(s.beard, 1.12)); }
  mouth(c, e.mouth, dy, s.lips);
  if (s.scar?.paint) scarMarks(c, s.scar, face);
  if (s.sideLocks && !bald) {   // a lock down each side of the face, over the edge of the cheek, to below the jaw
    fillP(c, 'M62,250 Q34,420 70,596 Q86,616 104,588 Q92,470 98,340 Q94,286 62,250 Z', K.hair); fillP(c, 'M482,250 Q510,420 474,596 Q458,616 440,588 Q452,470 446,340 Q450,286 482,250 Z', K.hair);
    strokeP(c, 'M74,310 Q60,440 86,576 M470,310 Q484,440 458,576', K.hairLine, 4);
  }
  if (s.goatee) { fillP(c, 'M224,502 Q272,486 320,502 Q314,570 272,600 Q230,570 224,502 Z', s.goatee); fillP(c, blade([272, 506], [272, 584], 2, 8), shadeHex(s.goatee, 1.25)); }
  if (s.moustache) fillP(c, 'M272,408 Q236,386 196,404 Q170,414 158,392 Q160,428 196,430 Q238,434 272,418 Q306,434 348,430 Q384,428 386,392 Q374,414 348,404 Q308,386 272,408 Z', s.moustache);
  if (s.scarf) {
    const d = shadeHex(s.scarf, 0.78);
    fillP(c, 'M86,300 Q58,470 104,650 L150,640 Q116,480 118,320 Z', K.hair); fillP(c, 'M458,300 Q486,470 440,650 L394,640 Q428,480 426,320 Z', K.hair);   // long hair beside the face
    fillP(c, 'M60,330 C38,130 150,14 272,12 C394,14 506,130 484,330 Q470,236 400,176 Q272,118 144,176 Q74,236 60,330 Z', s.scarf);
    strokeP(c, 'M70,300 Q90,214 150,170 Q272,112 394,170 Q454,214 474,300', d, 7); fillP(c, blade([200, 40], [150, 160], 5, 7), d); fillP(c, blade([344, 40], [394, 160], 5, 7), d);
  }
  if (s.messy && s.hair !== 'bald') [[118, 150, 78, 96], [168, 84, 140, 22], [236, 52, 226, -14], [300, 50, 318, -16], [366, 80, 398, 20], [424, 146, 470, 100], [96, 230, 52, 214], [448, 228, 494, 210]].forEach(([x1, y1, x2, y2]) => fillP(c, blade([x1, y1], [x2, y2], 6, 20), K.hair));
  if (s.helmet) helmet(c, s.helmet, false);
  if (s.crown) {
    const d = shadeHex(s.crown, 0.72), l = shadeHex(s.crown, 1.3), top = s.hair === 'bald' ? 96 : 40;
    fillP(c, `M120,${top + 110} L112,${top + 10} L168,${top + 62} L210,${top - 22} L250,${top + 56} L272,${top - 40} L294,${top + 56} L334,${top - 22} L376,${top + 62} L432,${top + 10} L424,${top + 110} Q272,${top + 84} 120,${top + 110} Z`, s.crown);
    strokeP(c, `M120,${top + 108} Q272,${top + 82} 424,${top + 108}`, d, 16); strokeP(c, `M122,${top + 92} Q272,${top + 66} 422,${top + 92}`, l, 4);
    [[112, top + 10], [210, top - 22], [272, top - 40], [334, top - 22], [432, top + 10]].forEach(([x, y]) => { ell(c, x, y, 13, 13, l); ell(c, x - 3, y - 3, 4, 4, '#ffffff'); });
    [[196, top + 92, '#c0243a'], [272, top + 84, '#2a8a5a'], [348, top + 92, '#c0243a']].forEach(([x, y, col]) => { ell(c, x as number, y as number, 14, 11, col as string); glint(c, (x as number) - 4, (y as number) - 4, 9); });
  }
  runAddOns(c, s, 'head');
};
/** a small four-pointed sparkle */
function glint(c: C, x: number, y: number, r: number) { fillP(c, `M${x},${y - r} Q${x + r * 0.18},${y - r * 0.18} ${x + r},${y} Q${x + r * 0.18},${y + r * 0.18} ${x},${y + r} Q${x - r * 0.18},${y + r * 0.18} ${x - r},${y} Q${x - r * 0.18},${y - r * 0.18} ${x},${y - r} Z`, '#ffffff'); }
function regalDress(c: C, r: {gold: string; gem?: string}) {
  const g = r.gold, d = shadeHex(g, 0.7), l = shadeHex(g, 1.3), gem = r.gem ?? '#c0243a';
  // gold bands down the front opening and round the hem, a row of stones in the hem
  fillP(c, 'M250,640 L294,640 L302,1052 L242,1052 Z', g); strokeP(c, 'M250,640 L242,1052 M294,640 L302,1052', d, 4); seg(c, 272, 650, 272, 1046, 3, l);
  [700, 780, 860, 940, 1010].forEach((y) => { fillP(c, `M272,${y - 16} L286,${y} L272,${y + 16} L258,${y} Z`, gem); glint(c, 268, y - 5, 6); });
  strokeP(c, 'M112,1040 Q272,1070 432,1040', g, 30); strokeP(c, 'M112,1027 Q272,1057 432,1027 M112,1053 Q272,1083 432,1053', d, 3);
  [150, 200, 344, 394].forEach((x) => { const y = 1046 + (1 - Math.abs(x - 272) / 160) * 10; ell(c, x, y, 9, 9, gem); glint(c, x - 3, y - 3, 5); });
  // ermine collar: white fur with black tails
  fillP(c, 'M140,532 Q272,570 404,532 Q440,552 446,596 Q428,640 400,668 Q364,646 330,662 Q300,634 272,650 Q244,634 214,662 Q180,646 144,668 Q116,640 98,596 Q104,552 140,532 Z', '#f4efe4');
  strokeP(c, 'M144,668 Q180,646 214,662 Q244,634 272,650 Q300,634 330,662 Q364,646 400,668', '#cfc6b2', 4);
  [[150, 596], [196, 620], [244, 606], [300, 606], [348, 620], [394, 596], [172, 566], [372, 566]].forEach(([x, y]) => fillP(c, `M${x - 5},${y - 12} Q${x + 7},${y} ${x},${y + 14} Q${x - 7},${y} ${x - 5},${y - 12} Z`, '#1a1614'));
  // the chain of office and its pendant
  strokeP(c, 'M176,650 Q272,760 368,650', d, 14); strokeP(c, 'M176,648 Q272,758 368,648', g, 8);
  [[200, 676], [232, 700], [312, 700], [344, 676]].forEach(([x, y]) => { ell(c, x, y, 9, 9, l); });
  ell(c, 272, 716, 30, 30, d); ell(c, 272, 716, 24, 24, g); ell(c, 272, 716, 14, 14, gem); glint(c, 264, 706, 12); glint(c, 300, 690, 7); glint(c, 226, 664, 6);
}
/** An iron helmet over the head: a dome, a brim band, a nose guard (front) or a neck guard (back). */
function helmet(c: C, col: string, back: boolean) {
  const d = shadeHex(col, 0.7), l = shadeHex(col, 1.3), g = c.createLinearGradient(80, 0, 470, 0); g.addColorStop(0, l); g.addColorStop(0.5, col); g.addColorStop(1, d);
  if (back) { fillP(c, 'M62,300 C50,90 170,0 272,0 C374,0 494,90 482,300 L482,430 Q272,500 62,430 Z', g); strokeP(c, 'M62,300 Q272,360 482,300', d, 8); }
  else { fillP(c, 'M70,200 C58,72 170,0 272,0 C374,0 486,72 474,200 Q272,152 70,200 Z', g); strokeP(c, 'M70,198 Q272,150 474,198', d, 12); fillP(c, 'M256,158 L288,158 L292,330 Q272,344 252,330 Z', col); strokeP(c, 'M256,158 L252,330 Q272,344 292,330 L288,158', d, 4); }
  fillP(c, blade([272, 6], [272, back ? 290 : 150], 2, 9), d);
  [120, 196, 348, 424].forEach((x) => ell(c, x, back ? 318 : (Math.abs(x - 272) > 100 ? 190 : 172), 7, 7, l));
}

// ---------- a head wrapped in bandages (23/11/2026): flat strips of cut paper in three tones, straight sharp edges, one slit for the eyes ----------
const WRAP = 'M82,318 L88,232 L118,160 L170,112 L236,86 L308,86 L374,112 L426,160 L456,232 L462,318 L458,410 L432,486 L384,538 L318,560 L226,560 L160,538 L112,486 L86,410 Z';
const WRAP_SLIT = 'M100,238 L186,214 L276,224 L366,210 L448,234 L456,318 L430,370 L338,382 L274,366 L204,384 L118,372 L92,318 Z';
const clampTone = (hex: string, k: number) => '#' + [1, 3, 5].map((i) => Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k)).toString(16).padStart(2, '0')).join('');
const wrapTones = (s: Spec) => { const col = (typeof s.bandage === 'object' ? s.bandage.color : undefined) ?? '#d9d0bd'; return {mid: col, light: clampTone(col, 1.09), dark: clampTone(col, 0.8), deep: clampTone(col, 0.58)}; };
type Strip = [Pt[], 'mid' | 'light' | 'dark'];
const WRAP_FRONT: Strip[] = [
  [[[50, 120], [500, 62], [500, 124], [50, 176]], 'mid'], [[[50, 170], [500, 112], [500, 168], [50, 226]], 'light'], [[[50, 216], [500, 158], [500, 214], [50, 262]], 'mid'],
  [[[40, 268], [292, 66], [346, 92], [64, 326]], 'light'],                                          // one strip across the others, up over the crown
  [[[50, 372], [500, 352], [500, 410], [50, 432]], 'light'], [[[50, 426], [500, 402], [500, 462], [50, 488]], 'mid'], [[[50, 482], [500, 454], [500, 514], [50, 546]], 'light'], [[[60, 538], [490, 498], [490, 590], [60, 610]], 'mid'],
  [[[112, 574], [424, 366], [478, 396], [186, 604]], 'dark'],                                       // one strip across the jaw
  [[[56, 214], [114, 236], [106, 392], [56, 404]], 'dark'], [[[488, 214], [440, 234], [448, 388], [488, 400]], 'dark'],   // the sides, beside the eyes
];
const WRAP_BACK: Strip[] = [
  [[[50, 110], [500, 70], [500, 132], [50, 170]], 'mid'], [[[50, 164], [500, 124], [500, 186], [50, 226]], 'light'], [[[50, 220], [500, 180], [500, 242], [50, 282]], 'mid'], [[[50, 276], [500, 236], [500, 300], [50, 340]], 'light'],
  [[[50, 334], [500, 294], [500, 358], [50, 398]], 'mid'], [[[50, 392], [500, 352], [500, 416], [50, 456]], 'light'], [[[50, 450], [500, 410], [500, 474], [50, 514]], 'mid'], [[[60, 508], [490, 468], [490, 590], [60, 610]], 'light'],
  [[[120, 96], [168, 80], [452, 470], [404, 500]], 'dark'],                                         // one strip across the others
];
const wrapStrips = (c: C, list: Strip[], t: ReturnType<typeof wrapTones>) => list.forEach(([pts, tone]) => { fillP(c, poly(pts), t[tone]); seg(c, pts[3][0], pts[3][1], pts[2][0], pts[2][1], 3.5, t.deep, 'butt'); });
const wrapTail = (c: C, s: Spec, t: ReturnType<typeof wrapTones>) => { if (typeof s.bandage === 'object' && s.bandage.tail === false) return; fillP(c, poly([[424, 482], [510, 540], [522, 604], [486, 566], [468, 618], [404, 528]]), t.dark); seg(c, 424, 482, 510, 540, 3, t.deep, 'butt'); };
const bandagedHead = (c: C, s: Spec) => {
  const t = wrapTones(s), e = s.expr, dy = (s.faceDy ?? 0) * 0.4, white = c.createLinearGradient(110, 0, 444, 0);
  white.addColorStop(0, s.whites ?? K.whiteA); white.addColorStop(1, s.whites ?? K.whiteB);
  wrapTail(c, s, t);
  fillP(c, WRAP, t.mid);
  c.save(); const rest = new Path2D(WRAP); rest.addPath(new Path2D(WRAP_SLIT)); c.clip(new Path2D(WRAP)); c.clip(rest, 'evenodd'); wrapStrips(c, WRAP_FRONT, t); c.restore();
  // the slit: the skin in the shadow of the cloth, the mould's own eyes (lids, gaze and blinks still play) cut to its edge
  fillP(c, WRAP_SLIT, e.closed ? K.skin : clampTone(K.skinDark, 0.66));   // mắt nhắm: mí là da sáng, không để cả khe thành một mảng nâu tối khi chớp mắt
  c.save(); c.clip(new Path2D(WRAP_SLIT)); eye(c, 'L', e, white, white, dy, s.lashes); eye(c, 'R', e, white, white, dy, s.lashes); c.restore();
  strokeP(c, WRAP_SLIT, t.deep, 6, 'butt'); strokeP(c, WRAP, t.deep, 3.5, 'butt');
};
const bandagedBack = (c: C, s: Spec) => {
  const t = wrapTones(s);
  wrapTail(c, s, t); fillP(c, WRAP, t.mid);
  c.save(); c.clip(new Path2D(WRAP)); wrapStrips(c, WRAP_BACK, t); c.restore();
  strokeP(c, WRAP, t.deep, 3.5, 'butt');
};

/** Back of the head, as the reference draws it (checked on frames 13826 and 4267: a crowd from behind and an
 *  over-the-shoulder shot): ONE rounded hair mass covers nearly the whole head, wider than the skull so the ears are
 *  hidden, with a few thin strand lines and a zig-zag edge low at the nape; only a thin crescent of skin shows under it,
 *  and the head sits straight on the collar with no neck. kind 'long' lets the hair fall over the shoulders. */
export type BackHead = 'bob' | 'long' | 'bald' | 'bun' | 'scarf' | 'hat';
/** Other heads from behind, so that a crowd seen from the back is not six copies of one hair mass (Daniel, 22/11/2026, the
 *  subjects in the throne hall: "đang quá đơn giản"): 'bald' (skin, ears, a fringe of hair low round the back), 'bun' (the hair
 *  mass with a knot on it), 'scarf' (a headscarf tied at the nape, two tails; cloth = its colour), 'hat' (a felt hat with a brim). */
const headBack = (c: C, kind: BackHead = 'bob', cloth = '#6a5a4a') => {
  fillP(c, 'M81,300 C81,150 190,90 272,90 C354,90 463,150 463,300 C463,440 404,548 272,548 C140,548 81,440 81,300 Z', K.skin);
  const sh = shadeHex(cloth, 0.76);
  if (kind === 'bald') {
    ell(c, 74, 330, 24, 44, K.skin); ell(c, 470, 330, 24, 44, K.skin); strokeP(c, 'M70,318 Q84,330 72,348 M474,318 Q460,330 472,348', K.skinDark, 4);
    fillP(c, 'M84,372 C96,476 176,548 272,548 C368,548 448,476 460,372 Q272,452 84,372 Z', K.hair); strokeP(c, 'M206,330 Q272,352 338,330', K.skinDark, 4);
    return;
  }
  if (kind === 'scarf') {
    fillP(c, 'M236,520 L188,700 L246,682 L270,560 Z', sh); fillP(c, 'M308,520 L356,700 L298,682 L274,560 Z', sh);   // the two tails
    fillP(c, 'M58,468 C22,250 96,30 272,26 C448,30 522,250 486,468 Q272,566 58,468 Z', cloth);
    [[150, 90, 110, 440], [272, 40, 272, 500], [394, 90, 434, 440]].forEach(([x1, y1, x2, y2]) => fillP(c, blade([x1, y1], [x2, y2], 5, 7), sh));
    strokeP(c, 'M66,430 Q272,528 478,430', sh, 7); ell(c, 272, 518, 44, 30, sh); ell(c, 272, 514, 30, 18, cloth);
    return;
  }
  const low = kind === 'long' ? 690 : 470, n = 9, zig: string[] = [];
  for (let i = 0; i <= n; i++) { const x = 476 - (i * (476 - 68)) / n; zig.push(`L${x},${low + (i % 2 ? 34 : 0) - (kind === 'long' ? Math.abs(i - n / 2) * 10 : Math.abs(i - n / 2) * 4)}`); }
  fillP(c, `M68,${low - 18} C28,250 96,34 272,30 C448,34 516,250 476,${low - 18} ${zig.join(' ')} Z`, K.hair);
  [[176, 120, 168, low - 60], [240, 96, 236, low - 40], [306, 96, 312, low - 40], [372, 120, 380, low - 64]].forEach(([x1, y1, x2, y2]) => fillP(c, blade([x1, y1], [x2, y2], 3, 6), K.hairLine));
  if (kind === 'bun') { ell(c, 272, 150, 104, 92, K.hairLine); ell(c, 272, 146, 96, 84, K.hair); strokeP(c, 'M214,120 Q272,170 330,120 M226,170 Q272,206 318,170', K.hairLine, 5); }
  if (kind === 'hat') {
    ell(c, 272, 236, 300, 66, sh); fillP(c, 'M124,236 C118,40 426,40 420,236 Q272,262 124,236 Z', cloth);
    strokeP(c, 'M128,214 Q272,244 416,214', sh, 20); fillP(c, blade([200, 70], [190, 200], 4, 7), sh);
  }
};

// ---------- hands (drawn pointing down from the wrist at 0,0; `out` = -1 on the screen-left arm) ----------
const hand = (c: C, kind: Hand, out: number) => {
  const S = GLOVE ? GLOVE.a : K.skin, D = GLOVE ? GLOVE.d : K.skinDark, fin = (deg: number, a: number, b: number, w = 19, cy = 34) => { const r = (deg * Math.PI) / 180; seg(c, Math.sin(r) * a, cy + Math.cos(r) * a, Math.sin(r) * b, cy + Math.cos(r) * b, w, S); };
  const knuckles = (xs: number[], y1: number, y2: number) => xs.forEach((x) => seg(c, x, y1, x, y2, 3, D));
  if (kind === 'open' || kind === 'back') {
    [-33, -11, 11, 33].forEach((d, i) => fin(d, 22, i === 0 || i === 3 ? 66 : 76));
    fin(out * 82, 16, 56, 20, 26); ell(c, 0, 32, 36, 34, S);
    if (kind === 'open') strokeP(c, `M${out * -16},28 Q${out * 2},44 ${out * 20},32`, D, 3); else knuckles([-18, -6, 6, 18], 50, 58);
    return;
  }
  if (kind === 'relaxed') {   // fingers together and slightly curled, thumb lying along the side
    seg(c, out * 24, 18, out * 30, 50, 19, S); c.fillStyle = S; c.beginPath(); c.roundRect(-30, -2, 60, 92, 28); c.fill();
    knuckles([-10, 4, 17], 62, 86); return;
  }
  if (kind === 'fist' || kind === 'grip') {
    c.fillStyle = S; c.beginPath(); c.roundRect(-34, -4, 68, 70, 27); c.fill(); seg(c, out * -6, 32, out * 22, 36, 20, S);
    knuckles([-14, 2, 18].map((x) => x * -out), 46, 62);
    if (kind === 'grip') ell(c, 0, 22, 12, 12, D);
    return;
  }
  if (kind === 'point') {
    c.fillStyle = S; c.beginPath(); c.roundRect(-32, -4, 64, 60, 26); c.fill(); seg(c, out * 14, 30, out * 16, 104, 20, S); seg(c, out * -10, 34, out * 14, 40, 19, S);
    knuckles([-12, 2].map((x) => x * out), 40, 54); return;
  }
  if (kind === 'edge') { c.fillStyle = S; c.beginPath(); c.roundRect(-17, -4, 34, 104, 17); c.fill(); seg(c, out * 10, 20, out * 22, 46, 15, S); return; }
  if (kind === 'cup') { [-30, -8, 14].forEach((d) => fin(d * -out, 20, 58, 19, 30)); fin(out * 70, 14, 50, 20, 24); ell(c, 0, 30, 36, 30, S); strokeP(c, `M-22,40 Q0,62 24,44`, D, 3); return; }
  // clasp: both hands locked together, drawn once, centred on the wrist
  c.fillStyle = S; c.beginPath(); c.roundRect(-46, 0, 92, 66, 28); c.fill(); knuckles([-22, -7, 8, 23], 20, 44); strokeP(c, 'M-40,34 Q0,24 40,34', D, 3);
};

// ---------- arms ----------
const ARM = {L: {x: 180, k: 1, out: -1}, R: {x: 364, k: -1, out: 1}}, UP = 110, FORE = 108, SH_Y = 612;
const arm = (c: C, side: 'L' | 'R', p: ArmPose, sleeve: string, edge: string, rim: string | null, upper = true) => {
  const a = ARM[side], rad = Math.PI / 180, UL = UP * (p.len ?? 1), FL = FORE * (p.len ?? 1);
  if (p.stretch !== undefined && p.stretch > 1) { rubberArm(c, a, p, sleeve, edge, rim); return; }
  c.save(); c.translate(a.x + a.out * (ROCK?.out ?? 0), SH_Y); c.rotate(a.k * p.sh * rad);
  if (p.smear) { c.filter = 'blur(7px)'; c.globalAlpha = 0.8; }
  if (upper) { c.save(); if (ROCK?.arm) c.scale(ROCK.arm, 1); if (rim) seg(c, 0, 0, 0, UL, 70, rim); seg(c, 0, 0, 0, UL, 64, sleeve); if (ROCK || SHEEN) armLook(c, UL, 32); c.restore(); }
  c.translate(0, UL); c.rotate(a.k * (p.el ?? 0) * rad);
  c.save(); c.translate(0, FL); c.rotate(a.k * (p.wrist ?? 0) * rad); c.scale(1.12 * (ROCK?.fist ?? 1), 1.12 * (ROCK?.fist ?? 1)); hand(c, p.hand ?? 'relaxed', a.out); if (ROCK?.fist && (p.hand ?? 'relaxed') === 'relaxed') rockTex(c, 'M-30,26 Q-30,-2 -2,-2 L2,-2 Q30,-2 30,26 L30,62 Q30,90 2,90 L-2,90 Q-30,90 -30,62 Z', -36, -8, 36, 94);
  if (ROCK?.fist && (p.hand === 'fist' || p.hand === 'grip')) { rockTex(c, 'M-34,20 Q-34,-4 -8,-4 L8,-4 Q34,-4 34,20 L34,42 Q34,66 8,66 L-8,66 Q-34,66 -34,42 Z', -40, -10, 40, 72); seg(c, -33, 30, 33, 30, 4, ROCK.crack, 'butt'); [-17, 0, 17].forEach((kx) => seg(c, kx, 30, kx, 65, 4, ROCK!.crack, 'butt')); } c.restore();
  c.save(); if (ROCK?.arm) c.scale(ROCK.arm, 1);
  // forearm: a sleeve that widens toward the cuff
  const d = `M-33,0 Q-36,-34 0,-34 Q36,-34 33,0 L43,${FL - 6} Q43,${FL + 8} 30,${FL + 8} L-30,${FL + 8} Q-43,${FL + 8} -43,${FL - 6} Z`;
  if (rim) strokeP(c, d, rim, 6); fillP(c, d, sleeve); if (ROLLED) rolledSleeve(c, FL, edge); if (ROCK || SHEEN) armLook(c, FL, 36, d); if (!ROLLED) seg(c, -41, FL - 12, 41, FL - 12, 3, edge, 'butt');
  if (GLOVE) { c.fillStyle = GLOVE.a; c.beginPath(); c.roundRect(-45, FL - 18, 90, 28, 8); c.fill(); }
  c.restore();
  c.restore();
};
/** `rolled`: cẳng tay trần hai sắc, trên đó là nếp vải xắn hai lớp */
const rolledSleeve = (c: C, FL: number, edge: string) => {
  fillP(c, `M-37,40 L37,40 L43,${FL - 6} Q43,${FL + 8} 30,${FL + 8} L-30,${FL + 8} Q-43,${FL + 8} -43,${FL - 6} Z`, K.skin);
  fillP(c, `M14,40 L37,40 L43,${FL - 6} Q43,${FL + 8} 30,${FL + 8} L20,${FL + 8} Z`, K.skinC);
  fillP(c, 'M-38,12 L38,12 L42,46 L-42,46 Z', K.shirtRim); seg(c, -42, 46, 42, 46, 4, edge, 'butt'); seg(c, -40, 29, 40, 29, 2.5, edge, 'butt');
};

// ---------- legs and feet ----------
/** The lower body, built the way the reference builds it: two separate straight legs, clearly narrower than the garment above
 *  them and of another tone, each ending in its own shoe; the garment's hem overhangs them and shades the hips.
 *  The feet are PLANTED: the upper body shifts, bobs and leans above them; a foot moves only to take a step (mould/act). */
const RAD = Math.PI / 180, HIP_Y = 952, HIPS = {L: 232, R: 312}, ANK = {L: 222, R: 322};
const upperT = (s: Spec) => { const a = (s.lean ?? 0) * RAD, dx = s.hip ?? 0, dy = -(s.hipDy ?? 0); return {a, dx, dy, pt: (x: number, y: number): [number, number] => { const X = x - 272, Y = y - 960; return [272 + X * Math.cos(a) - Y * Math.sin(a) + dx, 960 + X * Math.sin(a) + Y * Math.cos(a) + dy]; }}; };
type UpT = ReturnType<typeof upperT>;
const up = (c: C, u: UpT, fn: () => void) => { c.save(); c.translate(272 + u.dx, 960 + u.dy); c.rotate(u.a); c.translate(-272, -960); fn(); c.restore(); };
const shoeAt = (c: C, side: 'L' | 'R', x: number, leg: Leg | undefined, d: (k: number) => string) => { const k = side === 'L' ? -1 : 1; c.save(); c.translate(x + (leg?.dx ?? 0), 1197 - (leg?.lift ?? 0)); c.rotate(-k * (leg?.toe ?? 0) * RAD); if (ROCK?.leg) c.scale(ROCK.leg * 0.82, Math.min(1.2, ROCK.leg)); fillP(c, d(k), K.shoe); if (ROCK?.leg) rockTex(c, d(k), -100, -64, 100, 6); c.restore(); };

// ---------- bodies ----------
const vestLegs = (c: C, s: Spec, u: UpT) => {
  (['L', 'R'] as const).forEach((sd) => {
    const lo = (ROCK?.legOut ?? 0) * (sd === 'L' ? -1 : 1), wl = ROCK?.leg ?? 1, g = sd === 'L' ? s.legL : s.legR, [hx, hy] = u.pt(HIPS[sd] + lo, HIP_Y), ax = ANK[sd] + lo + (g?.dx ?? 0), ay = 1160 - (g?.lift ?? 0);
    const q = (t0: number, t1: number, w0: number, w1: number, f: string) => { const X = (t: number) => hx + (ax - hx) * t, Y = (t: number) => hy + (ay - hy) * t; fillP(c, `M${X(t0) - w0},${Y(t0)} L${X(t0) + w0},${Y(t0)} L${X(t1) + w1},${Y(t1)} L${X(t1) - w1},${Y(t1)} Z`, f); };
    if (s.longLegs) { q(0, 1, 31, 26, K.shorts); if (!FIRE_BODY) q(0, 1, 6, 5, shadeHex(K.shorts, 0.9)); }   // a crease down the trouser leg
    else { q(0, 1, 27 * wl, 23 * wl, K.skin); if (ROCK) rockTex(c, `M${hx - 27 * wl},${hy} L${hx + 27 * wl},${hy} L${ax + 23 * wl},${ay} L${ax - 23 * wl},${ay} Z`, Math.min(hx, ax) - 34 * wl, hy, Math.max(hx, ax) + 34 * wl, ay); q(0, 0.36, 33 * wl, 31 * wl, K.shorts); q(0.34, 0.37, 31 * wl, 31 * wl, shadeHex(K.shorts, 0.78)); }   // bare legs under shorts with a hem
    if (s.suit?.boot) q(0.62, 1, s.longLegs ? 30 : 26, s.longLegs ? 27 : 24, s.suit.boot);
    if (SHEEN) fillP(c, blade([hx + (ax - hx) * 0.08 - 12, hy + (ay - hy) * 0.08], [hx + (ax - hx) * 0.92 - 10, hy + (ay - hy) * 0.92], 2, 10), SHEEN);
    shoeAt(c, sd, ANK[sd] + lo, g, (k) => `M${-k * 34},0 Q${-k * 40},-51 ${-k * 8},-55 L${k * 8},-55 Q${k * 62},-47 ${k * 86},0 Z`);
  });
  runAddOns(c, s, 'legs');
};
const vestUpper = (c: C, s: Spec, back = false) => {
  fillP(c, 'M190,866 L354,866 L350,962 Q346,986 312,988 Q286,988 272,964 Q258,988 232,988 Q198,986 194,962 Z', K.shorts);
  if (!FIRE_BODY) seg(c, 190, 893, 354, 893, 14, shadeHex(K.shorts, 0.74), 'butt');   // the garment's shadow on the hips: where the body ends and the legs begin
  fillP(c, 'M182,572 Q272,548 362,572 L376,884 L168,884 Z', K.shirt);
  if (ROCK?.arm) bruteTorso(c);
  if (back) { fillP(c, 'M184,580 Q272,556 360,580 L374,884 L170,884 Z', K.vest); seg(c, 272, 640, 272, 884, 2.5, shadeHex(K.vest, 0.8), 'butt'); strokeP(c, 'M196,640 Q272,668 348,640', shadeHex(K.vest, 0.8), 2.5); }
  else if (s.suit) suitChest(c, s);
  else {
    fillP(c, 'M184,580 L226,560 L246,690 L242,884 L170,884 Z', K.vest); fillP(c, 'M360,580 L318,560 L298,690 L302,884 L374,884 Z', K.vest);
    seg(c, 272, 600, 272, 884, 2.5, K.shirtEdge, 'butt'); [690, 760, 826].forEach((y) => ell(c, 272, y, 6, 6, K.button));
    const col = 'M216,560 L262,612 L272,588 L282,612 L328,560 L300,548 L244,548 Z'; fillP(c, col, K.shirt); strokeP(c, col, K.shirtEdge, 2.5);
  }
  if (ROCK?.arm) rockTex(c, BRUTE, 110, 506, 434, 896); else if (ROCK) rockTex(c, TORSO, 160, 548, 384, 890);
  // an arm marked `front` (a hand over a cheek, over the mouth) is drawn AFTER the head, by drawFigure; from behind every arm is under the head
  (['L', 'R'] as const).forEach((sd) => { const p = (sd === 'L' ? s.armL : s.armR) ?? {sh: 5}; if (back || !p.front) arm(c, sd, p, K.shirt, K.shirtEdge, K.shirtRim); });
};

const coatPath = (fl: number) => {
  const X = (x: number, k = 1) => 272 + (x - 272) * (1 + fl * k);
  const hem = [[536, 1058], [492, 1066], [452, 1054], [372, 1070], [290, 1060], [272, 1072], [196, 1062], [150, 1072], [112, 1056], [70, 1064]].map(([x, y]) => `L${X(x)},${y}`).join(' ');
  return `M150,520 Q272,486 394,520 Q424,560 ${X(440, 0.5)},700 ${hem} L${X(112, 0.5)},700 Q122,560 150,520 Z`;
};
const furCollar = (c: C) => {
  const d = 'M150,532 Q272,566 394,532 Q426,548 432,580 Q416,612 392,636 Q360,618 330,630 Q300,604 284,618 Q262,602 236,624 Q206,610 176,636 Q140,606 126,572 Q130,546 150,532 Z';
  c.save();
  fillP(c, d, K.fur); strokeP(c, 'M236,624 Q248,600 244,576 M330,630 Q320,604 326,580', K.furDark, 3); c.restore();
};
// legs close together under the coat; the shoes meet at the centre line with the toes turned out (reference frames 2798, 2830)
const coatLegs = (c: C, s: Spec, u: UpT) => {
  (['L', 'R'] as const).forEach((sd) => {
    const g = sd === 'L' ? s.legL : s.legR, bx = sd === 'L' ? 243 : 303, [hx, hy] = u.pt(bx, 1036), ax = bx + (g?.dx ?? 0), ay = 1170 - (g?.lift ?? 0);
    fillP(c, `M${hx - 25},${hy} L${hx + 25},${hy} L${ax + 25},${ay} L${ax - 25},${ay} Z`, K.trouser);
    shoeAt(c, sd, 272, g, (k) => `M${k * 2},2 L${k * 6},-31 Q${k * 30},-65 ${k * 78},-47 Q${k * 128},-29 ${k * 152},2 Z`);
  });
};
const coatUpper = (c: C, s: Spec, back: boolean, hemK = 1) => {
  const sl = K.coatLight, hidden = {sh: 6, el: 0} as ArmPose;
  (['L', 'R'] as const).forEach((sd) => { const p = (sd === 'L' ? s.armL : s.armR) ?? hidden; if (p.show && !p.front) arm(c, sd, p, sl, K.coatDark, null); });
  // the coat hangs from the shoulders: the hem trails by `sway` and spreads by `flare`
  const fl = s.flare ?? 0, X = (x: number, k = 1) => 272 + (x - 272) * (1 + fl * k);
  c.save(); c.translate(0, 520); c.transform(1, 0, (s.sway ?? 0) / 545, 1, 0, 0); if (hemK !== 1) c.scale(1, hemK); c.translate(0, -520);   // hemK: a body that sits or kneels gathers the coat, the hem stays on the ground
  const g = c.createLinearGradient(X(70), 0, X(536), 0); g.addColorStop(0, K.coat); g.addColorStop(0.5, K.coatLight); g.addColorStop(1, K.coat);
  fillP(c, coatPath(fl), g);
  [[168, 620, 126, 1010], [372, 640, 420, 1000], [224, 700, 214, 1040]].forEach(([x1, y1, x2, y2]) => fillP(c, blade([x1, y1], [X(x2), y2], 2, 9), K.coatDark));
  seg(c, 272, back ? 560 : 610, 272, 1052, 3, K.coatDark, 'butt');
  c.restore();
};

// ---------- Doctor Doom: hood, iron mask, mantle, tunic, armour, a cape behind (character sheet: episodes/doom-nhan-vat.md) ----------
// Built to the proportions MEASURED on the reference's Doom (two frames with a grid, 22/11/2026), as shares of his height H from
// the top of the hood to the soles (here H = 1092, hood top at y 105): mask 0.27 wide and 0.26 high, its chin at 0.36; the hood
// runs down into a mantle that ends at 0.47 and is 0.39 wide; the arms come out from under the mantle's corners, 0.10 thick,
// their outer edges 0.45 apart, and are seen WHOLE, in front of the cape; tunic 0.30 wide; each leg 0.12 wide; the cape hangs
// BEHIND him, 0.68 wide. The first build had the mould's own narrow shoulders (arm span 0.30) with the cloak laid over the upper
// arms: only two short forearms stuck out of a green cone, and the head looked bigger than the man (Daniel, 22/11/2026).
const HOOD_OUT = 'M42,650 C22,400 10,67 272,67 C534,67 522,400 502,650 Q272,676 42,650 Z';   // a round arch 1.2 masks wide; its foot lies on the mantle
const HOOD_IN = 'M80,540 L80,330 C80,206 160,141 272,141 C384,141 464,206 464,330 L464,540 Q464,596 272,604 Q80,596 80,540 Z';   // a little wider than the mask: the dark inside of the hood shows around it
const MASK = 'M90,300 C90,232 132,200 200,200 L344,200 C412,200 454,232 454,300 L454,472 C454,526 420,558 366,560 L178,560 C124,558 90,526 90,472 Z';   // nearly square, as the reference's (364 wide, 360 high)
const cloakGrad = (c: C, x0: number, x1: number) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, K.cloak); g.addColorStop(0.5, K.cloakLight); g.addColorStop(1, K.cloak); return g; };
const rivet = (c: C, x: number, y: number) => { ell(c, x, y, 10, 10, K.armourDark); ell(c, x, y, 7, 7, K.armourLight); ell(c, x - 2, y - 2, 2.5, 2.5, '#ffffff'); };
/** The iron mask itself, in the head's own units. eyes = the expression whose eyes show in the slots (null: empty slots, for the
 *  mask as a thing lying on the anvil). heat 0..1 = how much it still glows. */
const mixHex = (a: string, b: string, t: number) => {   // a blend of two '#rrggbb' colours
  if (a.length !== 7 || b.length !== 7) return t > 0.5 ? b : a;
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, t)))).join(',')})`;
};
/** Scale: the dark skin of oxide that forms where hot iron cools first (corners, edges, thin places). Fixed shapes, in the head's units. */
const SCALE: Pt[][] = [
  [[96, 214], [150, 204], [178, 222], [152, 246], [112, 252]], [[380, 204], [440, 214], [452, 264], [424, 250], [394, 232]],
  [[92, 468], [128, 452], [148, 492], [150, 542], [112, 550]], [[404, 488], [436, 452], [454, 478], [440, 542], [402, 554]],
  [[214, 204], [300, 202], [320, 218], [262, 234], [222, 224]], [[198, 542], [250, 530], [330, 536], [352, 557], [206, 559]],
  [[94, 330], [116, 318], [130, 372], [112, 410], [92, 396]], [[432, 318], [452, 330], [452, 400], [436, 412], [424, 366]],
];
/** hairline cracks in the scale, glowing: broken lines, never closed rings (rings read as bubbles) */
const CRACKS: Pt[][] = [[[150, 246], [176, 266], [170, 298], [188, 318]], [[396, 232], [380, 262], [394, 288]], [[250, 530], [264, 502], [252, 474]], [[330, 536], [316, 508], [330, 486]],
  [[128, 452], [156, 438], [176, 446]], [[436, 452], [410, 440], [392, 450]], [[262, 234], [270, 258]], [[112, 410], [140, 424]], [[436, 412], [408, 426]]];
const PITS: Pt[] = [[168, 300], [232, 262], [318, 258], [386, 306], [150, 410], [398, 404], [226, 430], [322, 428], [272, 240], [206, 524], [340, 520], [272, 388], [136, 284], [410, 282]];
/** Iron at heat (0..1), laid over the grey plate: not one flat orange but the way hot iron really looks. The thick middle is the
 *  hottest (yellow, nearly white), the colour falls through orange to red towards the rim, the edge itself has cooled to a dark
 *  red, and patches of dark scale lie on it with bright cracks round them. As it cools the white goes first, then the orange;
 *  a dull red and the scale stay longest. (Daniel, 22/11/2026: the flat orange mask "chưa ra chất kim loại nóng".) */
const maskHeat = (c: C, heat: number) => {
  const k = Math.max(0, Math.min(1, heat)), cl = (v: number) => Math.max(0, Math.min(1, v));
  const red = cl(k * 3), orange = cl((k - 0.18) / 0.55), white = cl((k - 0.5) / 0.5);
  const blob = (x: number, y: number, r: number, rgb: string, a: number, mid = 0.5) => {
    const g = c.createRadialGradient(x, y, r * 0.08, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(mid, `rgba(${rgb},${a * 0.55})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  };
  c.save(); c.clip(new Path2D(MASK));
  fillP(c, MASK, mixHex('#5e1a10', '#aa240e', k).replace('rgb(', 'rgba(').replace(')', `,${0.95 * red})`));   // red heat right through the plate: dull and dark when nearly cold
  blob(272, 400, 330, '255,118,30', 0.96 * orange, 0.62);                                // orange over the body of it
  blob(250, 420, 190, '255,206,96', 0.95 * white); blob(316, 330, 150, '255,214,110', 0.85 * white); blob(272, 480, 150, '255,222,128', 0.8 * white);
  blob(262, 404, 96, '255,250,224', 0.9 * white, 0.4);                                   // the hottest place: nearly white
  c.save(); c.filter = 'blur(15px)'; strokeP(c, MASK, `rgba(74,10,6,${0.82 * red})`, 62); c.restore();   // the rim has cooled first
  c.save(); c.filter = 'blur(2.5px)';
  SCALE.forEach((f) => fillP(c, soft(f, []), `rgba(46,10,6,${0.62 * red})`));
  c.restore();
  CRACKS.forEach((l) => strokeP(c, 'M' + l.map(([x, y]) => `${x},${y}`).join(' L'), `rgba(255,206,110,${0.7 * orange})`, 1.8));
  PITS.forEach(([x, y], i) => ell(c, x, y, 1.6 + (i % 3) * 0.8, 1.6 + (i % 3) * 0.8, i % 2 ? `rgba(255,244,200,${0.6 * white + 0.15 * orange})` : `rgba(70,14,8,${0.5 * red})`));
  c.restore();
};
/** The iron mask itself, in the head's own units. eyes = the expression whose eyes show in the slots (null: empty slots, for the
 *  mask as a thing lying on the anvil). heat 0..1 = how much it still glows (see maskHeat); every line of it changes with heat. */
const maskPlate = (c: C, e: Expr | null, heat: number, whites?: string) => {
  const k = Math.max(0, Math.min(1, heat)), glow = Math.max(0, Math.min(1, (k - 0.2) / 0.6));
  const metal = c.createLinearGradient(100, 200, 440, 560); metal.addColorStop(0, K.armourLight); metal.addColorStop(0.5, K.armour); metal.addColorStop(1, K.armourDark);
  fillP(c, MASK, metal);
  if (k > 0) maskHeat(c, k);
  const line = mixHex(K.armourDark, '#4e1208', k * 1.6), lit = mixHex(K.armourLight, '#fff1c2', glow), edge = mixHex(K.socket, '#5c1508', k * 1.4);
  c.save(); c.clip(new Path2D(MASK));   // the details stay inside the plate
  // plates: a seam down each cheek. In hot iron a seam is a deeper, hotter place: it glows brighter than the face of the plate
  if (glow > 0) strokeP(c, 'M120,372 L150,520 M424,372 L394,520', `rgba(255,170,60,${0.55 * glow})`, 9);
  strokeP(c, 'M120,372 L150,520 M424,372 L394,520', mixHex(K.armourDark, '#ffe6a2', glow), 3);
  // eye openings: two slanted slots cut in the plate (the slant is the mask's own scowl). The mould's eyes sit behind them,
  // so the gaze, a blink and the lids of the expression still play; the brow of the expression is not drawn on a mask.
  const white = c.createLinearGradient(110, 0, 444, 0); white.addColorStop(0, whites ?? K.whiteA); white.addColorStop(1, whites ?? K.whiteB);
  const keep = K.lidEdge; K.lidEdge = K.socket;
  (['L', 'R'] as const).forEach((sd) => {
    const mx = (x: number) => (sd === 'L' ? x : 557 - x), slot = soft([[mx(112), 252], [mx(264), 296], [mx(260), 346], [mx(124), 350]], [0, 1]);
    if (glow > 0) strokeP(c, slot, `rgba(255,214,120,${0.85 * glow})`, 15);   // the cut edge of the hot plate, round the opening
    fillP(c, slot, K.socket);
    if (e) { c.save(); c.clip(new Path2D(slot)); eye(c, sd, e, white, white, 0); c.restore(); }
    strokeP(c, slot, edge, 7);
    strokeP(c, `M${mx(104)},${240} L${mx(270)},${286}`, lit, 6, 'butt');   // the ridge above the slot catches the light
  });
  K.lidEdge = keep;
  fillP(c, 'M256,352 L288,352 L300,412 L244,412 Z', lit); strokeP(c, 'M244,412 L300,412', line, 4, 'butt');   // nose plate
  if (glow > 0) { c.strokeStyle = `rgba(255,214,120,${0.85 * glow})`; c.lineWidth = 8; c.beginPath(); c.roundRect(172, 438, 200, 74, 12); c.stroke(); }
  c.fillStyle = mixHex(K.socket, '#2a0a06', k); c.beginPath(); c.roundRect(172, 438, 200, 74, 12); c.fill();   // mouth grille
  [-75, -45, -15, 15, 45, 75].forEach((d) => { c.fillStyle = mixHex(K.armour, '#ffc86e', glow); c.fillRect(272 + d - 6, 445, 12, 60); });
  [[150, 222], [394, 222], [116, 420], [428, 420], [150, 530], [394, 530]].forEach(([x, y]) => {
    if (k <= 0) { rivet(c, x, y); return; }
    ell(c, x, y, 10, 10, mixHex(K.armourDark, '#5c1508', k * 1.4)); ell(c, x, y, 7, 7, mixHex(K.armourLight, '#ffdf9a', glow)); ell(c, x - 2, y - 2, 2.5, 2.5, '#ffffff');
  });
  c.restore(); strokeP(c, MASK, line, 6);
  if (glow > 0) strokeP(c, 'M94,296 C96,236 134,206 200,205 L330,205', `rgba(255,236,186,${0.7 * glow})`, 3);   // a lit edge along the top
};
/** The part of the head's space the mask covers, and a painter for the mask alone (a prop: on the anvil, in his hands). */
export const MASK_BOX = {x: 78, y: 188, w: 388, h: 384};
export const paintMask = (canvas: HTMLCanvasElement, scale: number, heat = 0, palette?: Palette) => {
  const w = Math.round(MASK_BOX.w * scale), h = Math.round(MASK_BOX.h * scale);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const c = canvas.getContext('2d')!;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h); c.setTransform(scale, 0, 0, scale, -MASK_BOX.x * scale, -MASK_BOX.y * scale);
  K = {...K0, ...(palette ?? {})}; maskPlate(c, null, Math.max(0, Math.min(1, heat)));
  return canvas;
};
const doomHead = (c: C, s: Spec) => {
  const kind = s.mask ?? 'iron';
  fillP(c, HOOD_OUT, K.cloakDark);   // the inside of the hood, behind the face
  if (kind === 'none') { c.save(); c.clip(new Path2D(HOOD_IN)); headFront(c, {...s, hair: 'bald', beard: undefined}); c.restore(); }   // the bare face, cut to the opening (no ear outside the hood)
  else if (kind === 'dark') {
    // a face we are not shown yet: the inside of the hood in shadow, and in it the black shape of his own head (the hair's
    // outline tells there is a man in there; Daniel, 22/11/2026: "vẫn để bóng của đầu victor ở sau"). The head is painted on a
    // spare canvas and turned into one flat colour, so no feature of the face shows.
    const g = c.createRadialGradient(272, 380, 60, 272, 380, 320); g.addColorStop(0, '#2a5a3a'); g.addColorStop(1, '#16321f'); fillP(c, HOOD_IN, g);
    const t = document.createElement('canvas'); t.width = c.canvas.width; t.height = c.canvas.height;
    const x = t.getContext('2d')!; x.setTransform(c.getTransform()); x.translate(272, 560); x.scale(0.74, 0.74); x.translate(-272, -548); headFront(x, {...s, beard: undefined});   // smaller than the opening: the head's outline and the hair must stand clear of the hood's edge
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#050b08'; x.fillRect(0, 0, t.width, t.height);
    c.save(); c.clip(new Path2D(HOOD_IN)); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(t, 0, 0); c.restore();
  }
  else maskPlate(c, s.expr, kind === 'hot' ? 1 : Math.max(0, Math.min(1, s.heat ?? 0)), s.whites);
  // the rim of the hood: all of the hood outside the opening, over the edge of the mask, with its shadow on the face
  c.save(); c.clip(new Path2D(HOOD_IN)); strokeP(c, HOOD_IN, 'rgba(8,24,12,0.45)', 36); c.restore();
  const rim = new Path2D(HOOD_OUT); rim.addPath(new Path2D(HOOD_IN));
  c.fillStyle = cloakGrad(c, 44, 500); c.fill(rim, 'evenodd');
  strokeP(c, HOOD_IN, K.cloakDark, 4);
  fillP(c, blade([92, 180], [58, 560], 8, 7), K.cloakDark); fillP(c, blade([452, 180], [486, 560], 8, 7), K.cloakDark);   // two folds
};
/** The light a hot mask throws on what is round it (in the head's units, drawn last, over the finished figure): the inside of the
 *  hood, its rim, the mantle, the chest and the arms take an orange glow that falls off with distance, and the glare spreads over
 *  the edge of the plate. It is painted only ON the figure (source-atop), so the card's outline does not change; the bloom in
 *  the air round the head is added on the stage (Puppet3). Without it the hot mask was a painted face in a cold hood
 *  (Daniel, 22/11/2026: "ko đẹp, chắc đang thiếu glow"). */
const doomGlow = (c: C, heat: number) => {
  const a = Math.max(0, Math.min(1, (heat - 0.1) / 0.6)), w = Math.max(0, Math.min(1, (heat - 0.45) / 0.55));
  if (a <= 0) return;
  c.save(); c.globalCompositeOperation = 'source-atop';
  // everything but the plate itself: light falling on the cloth and the armour
  c.save(); const out = new Path2D('M-900,-900 L1500,-900 L1500,2200 L-900,2200 Z'); out.addPath(new Path2D(MASK)); c.clip(out, 'evenodd');
  const g = c.createRadialGradient(272, 392, 150, 272, 392, 640);
  // strong on the inside of the hood next to the plate, falling off quickly: light, not a new colour for the whole hood
  g.addColorStop(0, `rgba(255,180,84,${0.82 * a})`); g.addColorStop(0.13, `rgba(255,146,54,${0.5 * a})`); g.addColorStop(0.3, `rgba(255,116,40,${0.24 * a})`); g.addColorStop(0.62, `rgba(255,100,34,${0.09 * a})`); g.addColorStop(1, 'rgba(255,90,30,0)');
  c.fillStyle = g; c.fillRect(-900, -900, 2400, 3100);
  c.save(); c.filter = 'blur(10px)'; strokeP(c, MASK, `rgba(255,226,150,${0.85 * a})`, 26); c.restore();   // the glare right at the plate's edge, on the hood
  c.restore();
  // the plate: the glare over its middle
  c.save(); c.clip(new Path2D(MASK)); c.globalCompositeOperation = 'lighter';
  const b = c.createRadialGradient(266, 410, 10, 266, 410, 250); b.addColorStop(0, `rgba(255,236,190,${0.3 * w})`); b.addColorStop(1, 'rgba(255,200,120,0)');
  c.fillStyle = b; c.fillRect(60, 180, 430, 400); c.restore();
  c.restore();
};
const doomHeadBack = (c: C) => {
  fillP(c, HOOD_OUT, cloakGrad(c, 44, 500));
  [[272, 100, 272, 640], [160, 170, 138, 620], [384, 170, 406, 620]].forEach(([x1, y1, x2, y2]) => fillP(c, blade([x1, y1], [x2, y2], 4, 7), K.cloakDark));
};
/** Doom from behind, flat pieces of the three cloak greens with straight cut edges; drawn from the hood's shape on the front (HOOD_OUT) and the mantle's width. */
const doomBackHood = (c: C) => {
  const d = 'M42,650 C20,430 22,230 138,128 Q208,84 272,58 Q336,84 406,128 C522,230 524,430 502,650 Q272,684 42,650 Z';   // as wide as the hood on the front, a low peak
  fillP(c, d, K.cloak);
  c.save(); c.clip(new Path2D(d));
  fillP(c, poly([[272, 40], [540, 120], [540, 700], [272, 700]]), K.cloakDark);                            // the half away from the light
  fillP(c, poly([[118, 150], [186, 108], [132, 340], [86, 620], [26, 620], [46, 340]]), K.cloakDark);      // a fold down the near side
  fillP(c, poly([[426, 150], [358, 108], [412, 340], [458, 620], [518, 620], [498, 340]]), K.cloakIn);     // and down the far side
  fillP(c, poly([[40, 606], [504, 606], [520, 700], [24, 700]]), K.cloakIn);                               // the shadow where the hood meets the collar
  c.restore();
  strokeP(c, 'M272,60 L272,640', K.cloakIn, 7, 'butt');                                                     // the centre seam
};
const doomBackCape = (c: C, s: Spec) => {
  const fl = s.flare ?? 0, X = (dx: number, k = 1) => 272 + dx * (1 + fl * k);
  c.save(); c.translate(0, 520); c.transform(1, 0, (s.sway ?? 0) / 545, 1, 0, 0); c.translate(0, -520);
  if (s.sit) { c.translate(0, 470); c.scale(1, 0.86); c.translate(0, -470); }
  const hem: Pt[] = [[268, 1150], [210, 1120], [168, 1160], [112, 1126], [56, 1166], [0, 1130], [-60, 1168], [-116, 1126], [-172, 1162], [-214, 1122], [-272, 1148]];
  const d = poly([[X(-172, 0), 580], [X(172, 0), 580], [X(208, 0.4), 830], ...hem.map(([x, y]): Pt => [X(x), y]), [X(-208, 0.4), 830]]);
  fillP(c, d, K.cloakDark);
  c.save(); c.clip(new Path2D(d));
  ([[-132, 640, -282, 1180, -196, 1180, 'in'], [-82, 650, -146, 1180, -84, 1180, 'lit'], [-26, 640, -42, 1180, 26, 1180, 'in'], [36, 650, 62, 1180, 122, 1180, 'lit'], [102, 640, 150, 1180, 214, 1180, 'in'], [150, 650, 236, 1180, 290, 1180, 'lit']] as [number, number, number, number, number, number, string][])
    .forEach(([tx, ty, b0, y0, b1, y1, tone]) => fillP(c, poly([[X(tx, 0.2), ty], [X(b1), y1], [X(b0), y0]]), tone === 'in' ? K.cloakIn : K.cloak));
  c.restore(); c.restore();
};
const doomBackMantle = (c: C, tense: number) => {
  const up2 = 18 * tense, P = (x: number, y: number, k = 0): Pt => [272 + x, y - k * up2];
  const d = poly([P(-146, 548), P(146, 548), P(208, 594, 1), P(250, 652, 1), P(218, 718, 1), P(152, 696), P(94, 738), P(30, 708), P(-34, 740), P(-96, 702), P(-152, 736), P(-218, 716, 1), P(-250, 652, 1), P(-208, 594, 1)]);
  c.save(); c.translate(0, 14); fillP(c, d, 'rgba(8,24,12,0.35)'); c.restore();                             // its shadow on the cape and the arms
  fillP(c, d, K.cloak);
  c.save(); c.clip(new Path2D(d));
  fillP(c, poly([P(0, 540), P(270, 540), P(270, 760), P(0, 760)]), K.cloakDark);
  fillP(c, poly([P(-150, 590), P(-112, 590), P(-150, 740), P(-200, 740)]), K.cloakDark); fillP(c, poly([P(112, 590), P(150, 590), P(204, 740), P(152, 740)]), K.cloakIn);
  c.restore();
  fillP(c, poly([P(-158, 540), P(158, 540), P(176, 590), P(96, 612), P(0, 600), P(-96, 612), P(-176, 590)]), K.cloakIn);   // the collar under the hood
  strokeP(c, `M${272 - 170},588 L${272 - 96},608 L272,596 L${272 + 96},608 L${272 + 170},588`, K.cloakLight, 3.5, 'butt');
};
/** a hard rim of light on one side of the finished outline: the figure minus itself moved away from the light, in two steps */
const applyRim = (c: C, r: NonNullable<Spec['rim']>) => {
  const W = c.canvas.width, H = c.canvas.height, u = Math.abs(c.getTransform().a), sign = r.side === 'L' ? -1 : 1, a = Math.max(0, Math.min(1, r.amount ?? 1));
  const band = (w: number, alpha: number) => {
    const t = document.createElement('canvas'); t.width = W; t.height = H; const x = t.getContext('2d')!;
    x.drawImage(c.canvas, 0, 0); x.globalCompositeOperation = 'destination-out'; x.drawImage(c.canvas, -sign * w * u, w * u * 0.3);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = r.color; x.fillRect(0, 0, W, H);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = alpha; c.drawImage(t, 0, 0); c.restore();
  };
  band(26, 0.42 * a); band(11, 0.95 * a);
};
const SIT = 88;   // how far a seated body drops: the hips come level with the knees
const D_HEAD_UP = 58;   // the hooded head stands this much higher than an ordinary head: the mantle fills the gap
const D_HIP = {L: 204, R: 340}, D_ANK = {L: 200, R: 344};
// The shoulder lies INSIDE the torso (0.135 H from the centre; the tunic is 0.15 H to each side), under a mantle that is wider than
// both arms: an arm that hangs straight, or reaches out, starts in front of the body (Daniel, 22/11/2026: "khi thẳng tay, sau tay
// vẫn là thân"; five reference frames agree). Shoulders set outside the tunic made the torso read as a narrow column.
const D_ARM = {L: {x: -148, k: 1, out: -1}, R: {x: 148, k: -1, out: 1}}, D_SH = 634, D_UP = 90, D_FORE = 76;   // short arms: the hand of a hanging arm lies on the belt (reference: fingertips at 0.72 H)
const doomLegs = (c: C, s: Spec, u: UpT, sit = false) => {
  (['L', 'R'] as const).forEach((sd) => {
    const g = sd === 'L' ? s.legL : s.legR, k = sd === 'L' ? -1 : 1, ax = D_ANK[sd] + (g?.dx ?? 0), ay = 1148 - (g?.lift ?? 0);
    // seated: the thigh points at the viewer, so the leg starts at the knee, level with the lowered hip and a little further out
    const [hx, hy] = sit ? [D_HIP[sd] + k * 8 + (s.hip ?? 0), 1040] : u.pt(D_HIP[sd], HIP_Y);
    const X = (t: number) => hx + (ax - hx) * t, Y = (t: number) => hy + (ay - hy) * t, top = sit ? 0 : -44;   // standing: the leg begins under the tunic
    fillP(c, `M${X(0) - 62},${Y(0) + top} L${X(0) + 62},${Y(0) + top} L${X(1) + 58},${Y(1)} L${X(1) - 58},${Y(1)} Z`, K.plate);
    fillP(c, `M${X(0) + 30},${Y(0) + top} L${X(0) + 62},${Y(0) + top} L${X(1) + 58},${Y(1)} L${X(1) + 28},${Y(1)} Z`, 'rgba(112,118,126,0.2)');   // the side away from the light
    if (sit) { ell(c, hx, hy - 4, 68, 50, K.armour); ell(c, hx, hy - 9, 62, 44, K.plate); ell(c, hx - 16, hy - 26, 16, 9, '#ffffff'); }   // the knee, towards the viewer
    seg(c, X(0.78) - 58, Y(0.78), X(0.78) + 58, Y(0.78), 3, K.plateLine, 'butt');   // one seam low on the shin
    c.save(); c.translate(ax, 1197 - (g?.lift ?? 0)); c.rotate(-k * (g?.toe ?? 0) * RAD);   // a round grey shoe, toe outwards
    fillP(c, `M${-k * 66},0 L${-k * 66},-34 Q${-k * 62},-58 ${-k * 28},-58 L${k * 26},-58 Q${k * 84},-52 ${k * 104},0 Z`, K.armour);
    seg(c, -k * 66, -3, k * 104, -3, 6, K.armourDark, 'butt');
    c.restore();
  });
};
/** The cape hangs BEHIND him from under the mantle, as the reference's does: a broad dark inside, and down each side the lit front
 *  edge of the cloth curling forward. The body, the legs and both arms are in front of it. back = seen from behind: it covers him. */
const doomCape = (c: C, s: Spec, back = false) => {
  const fl = s.flare ?? 0, X = (dx: number, k = 1) => 272 + dx * (1 + fl * k);
  c.save(); c.translate(0, 520); c.transform(1, 0, (s.sway ?? 0) / 545, 1, 0, 0); c.translate(0, -520);
  if (s.sit) { c.translate(0, 470); c.scale(1, 0.86); c.translate(0, -470); }   // seated: the lowered body must not push the hem through the floor
  const left = `M${X(-176, 0)},470 C${X(-262, 0.3)},520 ${X(-304, 0.6)},660 ${X(-340)},790 C${X(-372)},900 ${X(-398)},1010 ${X(-394)},1090 Q${X(-392)},1160 ${X(-340)},1160`;
  const right = `M${X(176, 0)},470 C${X(256, 0.3)},520 ${X(292, 0.6)},660 ${X(322)},790 C${X(352)},900 ${X(378)},1010 ${X(374)},1090 Q${X(372)},1160 ${X(322)},1160`;
  const whole = `${left} L${X(-250)},1152 Q272,1126 ${X(236)},1152 L${X(322)},1160 Q${X(372)},1160 ${X(374)},1090 C${X(378)},1010 ${X(352)},900 ${X(322)},790 C${X(292, 0.6)},660 ${X(256, 0.3)},520 ${X(176, 0)},470 Z`;
  if (back) {
    fillP(c, whole, cloakGrad(c, X(-394), X(374))); seg(c, 272, 600, 272, 1134, 3, K.cloakDark, 'butt');
    [[-90, 640, -150, 1140, 9], [86, 640, 140, 1140, 9], [-170, 660, -290, 1146, 8], [164, 660, 268, 1146, 8]].forEach(([x1, y1, x2, y2, w]) => fillP(c, blade([X(x1, 0.3), y1], [X(x2), y2], 4, w), K.cloakDark));
    c.restore(); return;
  }
  fillP(c, whole, K.cloakIn);
  const gl = c.createLinearGradient(X(-394), 0, X(-200), 0); gl.addColorStop(0, K.cloak); gl.addColorStop(1, K.cloakLight);
  fillP(c, `${left} L${X(-250)},1152 C${X(-256)},1040 ${X(-272)},900 ${X(-262)},770 C${X(-254, 0.6)},690 ${X(-244, 0.3)},640 ${X(-236, 0)},560 L${X(-200, 0)},500 Z`, gl);
  const gr = c.createLinearGradient(X(200), 0, X(374), 0); gr.addColorStop(0, K.cloakLight); gr.addColorStop(1, K.cloak);
  fillP(c, `${right} L${X(240)},1152 C${X(246)},1040 ${X(262)},900 ${X(254)},770 C${X(248, 0.6)},690 ${X(242, 0.3)},640 ${X(236, 0)},560 L${X(200, 0)},500 Z`, gr);
  fillP(c, blade([X(-240, 0.5), 650], [X(-328), 1128], 8, 5), K.cloakDark); fillP(c, blade([X(232, 0.5), 650], [X(312), 1128], -8, 5), K.cloakDark);   // one fold down each edge
  c.restore();
};
/** One armoured arm, built as the reference builds it: a fat pale upper arm, a seam at the elbow, a forearm that narrows a little
 *  to the wrist, a big gauntlet. part: 'all'; or only the forearm and the hand ('fore'), or only the hand and its cuff ('hand'),
 *  for redrawing what must lie in front of the mantle or of the hood. */
const doomArm = (c: C, sd: 'L' | 'R', p: ArmPose, B: number, part: 'all' | 'upper' | 'fore' | 'hand' = 'all') => {
  const a = D_ARM[sd], rad = Math.PI / 180, keep = {skin: K.skin, skinDark: K.skinDark}, DU = D_UP * (p.dai ?? 1), DF = D_FORE * (p.dai ?? 1);
  K.skin = K.plate; K.skinDark = K.plateLine;   // the gauntlet is drawn by the mould's own hand, in the metal's colours: cool steel with dark joints, so that warm light does not turn it into a bare hand
  c.save(); c.translate(272 + a.x * B, D_SH); c.rotate(a.k * p.sh * rad);
  if (p.smear) { c.filter = 'blur(7px)'; c.globalAlpha = 0.8; }
  // raised above the shoulder, the upper arm lies wholly under the mantle; drawing it would leave its round end showing below the mantle's edge
  if ((part === 'all' || part === 'upper') && (Math.abs(p.sh) <= 100 || p.dai !== undefined)) { seg(c, 0, 0, 0, DU, 106, K.armour); seg(c, 0, 0, 0, DU, 100, K.plate); }
  if (part === 'upper') { c.restore(); K.skin = keep.skin; K.skinDark = keep.skinDark; return; }
  c.translate(0, DU); c.rotate(a.k * (p.el ?? 0) * rad);
  const kind = p.hand ?? 'relaxed';
  c.save(); c.translate(0, DF); c.rotate(a.k * (p.wrist ?? 0) * rad); c.scale(1.4, 1.14); hand(c, kind, a.out);
  // plates across the back of a closed gauntlet: without them a pale fist in warm light reads as a bare hand
  if (kind === 'relaxed' || kind === 'fist' || kind === 'grip') { seg(c, -27, 15, 27, 15, 3, K.plateLine, 'butt'); seg(c, -28, 36, 28, 36, 2.5, K.plateLine, 'butt'); ell(c, -17, 26, 3, 3, K.plateLine); ell(c, 17, 26, 3, 3, K.plateLine); }
  c.restore();
  if (part === 'hand') { c.beginPath(); c.rect(-70, DF - 30, 140, 70); c.clip(); }   // only the cuff, over the wrist
  const d = `M-50,0 Q-52,-48 0,-50 Q52,-48 50,0 L43,${DF - 10} Q42,${DF + 10} 0,${DF + 10} Q-42,${DF + 10} -43,${DF - 10} Z`;
  strokeP(c, d, K.armour, 5); fillP(c, d, K.plate);
  fillP(c, `M-44,${DF - 20} Q0,${DF - 12} 44,${DF - 20} L42,${DF - 2} Q0,${DF + 8} -42,${DF - 2} Z`, K.armour);   // the gauntlet's cuff: a darker band
  strokeP(c, `M-44,${DF - 20} Q0,${DF - 12} 44,${DF - 20}`, K.plateLine, 3, 'butt');
  strokeP(c, 'M-46,8 Q0,20 46,8', K.plateLine, 3, 'butt');   // the elbow
  c.restore(); K.skin = keep.skin; K.skinDark = keep.skinDark;
};
/** Arms folded on the chest, as the reference draws them: the two forearms cross in an X in front of the tunic, each ending in
 *  its gauntlet beyond the other arm; the upper arms stay under the mantle. (His forearms are too short to cross by the ordinary
 *  arm's angles: shoulders 296 apart, a forearm of 86.) */
const doomFolded = (c: C, B: number) => {
  const keep = {skin: K.skin, skinDark: K.skinDark}, e = 150 * B;
  const fore = (x1: number, y1: number, x2: number, y2: number, out: number) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    K.skin = K.plate; K.skinDark = K.plateLine;
    c.save(); c.translate(x2, y2); c.rotate(a - Math.PI / 2); c.scale(1.4, 1.14); hand(c, 'relaxed', out); c.restore();
    K.skin = keep.skin; K.skinDark = keep.skinDark;
    seg(c, x1, y1, x2, y2, 98, K.armour); seg(c, x1, y1, x2, y2, 92, K.plate);
    c.save(); c.translate(x2, y2); c.rotate(a - Math.PI / 2); strokeP(c, 'M-45,-20 Q0,-12 45,-20', K.armourDark, 3, 'butt'); c.restore();   // the cuff
  };
  fore(272 + e, 748, 272 - 78, 694, 1);    // the arm behind: from his left elbow up across the chest
  fore(272 - e, 706, 272 + 84, 752, -1);   // the arm in front: from his right elbow down across it
};
/** The mantle: the foot of the hood, lying over both shoulders down to the chest, wider than the two arms together (0.44 H).
 *  The arms come out from under its lower edge. */
const MANTLE = 'M88,470 L78,506 Q40,520 36,548 L30,598 Q28,622 54,624 Q272,634 490,624 Q516,622 514,598 L508,548 Q504,520 466,506 L456,470 Z';
const doomMantle = (c: C) => {
  c.save(); c.translate(0, 16); fillP(c, MANTLE, 'rgba(8,24,12,0.28)'); c.restore();   // its shadow on the arms and the chest
  fillP(c, MANTLE, cloakGrad(c, 60, 484));
  strokeP(c, 'M54,624 Q272,634 490,624', K.cloakDark, 3);
};
const doomUpper = (c: C, s: Spec) => {
  const hem = s.sit ? 926 : 948, T = (y: number) => (y < 838 ? 164 - ((y - 596) / 242) * 4 : 160 + ((y - 838) / 110) * 18), n = 6, w = (2 * T(hem)) / n;   // T = half the tunic's width at y
  let d = `M108,596 Q272,580 436,596 L${272 + T(838)},838 L${272 + T(hem)},${hem}`;
  for (let i = 0; i < n; i++) d += ` L${272 + T(hem) - w * (i + 0.5)},${hem + 26} L${272 + T(hem) - w * (i + 1)},${hem}`;   // the hem is cut in points
  fillP(c, d + ` L${272 - T(838)},838 Z`, K.tunic); seg(c, 272, 636, 272, 806, 3, K.cloakDark, 'butt');
  const y0 = 812, y1 = 864;   // the belt, in pieces as the reference's, and a big buckle
  fillP(c, `M${272 - T(y0)},${y0} L${272 + T(y0)},${y0} L${272 + T(y1)},${y1} L${272 - T(y1)},${y1} Z`, K.belt);
  [-1, 1].forEach((k) => fillP(c, `M${272 + k * 96},${y0 - 1} L${272 + k * 112},${y0 - 1} L${272 + k * 112},${y1 + 1} L${272 + k * 96},${y1 + 1} Z`, K.tunic));
  c.fillStyle = K.goldDark; c.beginPath(); c.roundRect(232, y0 - 10, 80, y1 - y0 + 20, 9); c.fill(); c.fillStyle = K.gold; c.beginPath(); c.roundRect(238, y0 - 4, 68, y1 - y0 + 8, 6); c.fill();
  c.fillStyle = K.belt; c.beginPath(); c.roundRect(252, y0 + 8, 40, 12, 3); c.fill(); c.beginPath(); c.roundRect(252, y0 + 31, 40, 12, 3); c.fill();
};
const doomClasps = (c: C) => {   // the two clasps and the chain between them, on the mantle
  strokeP(c, 'M186,560 Q272,608 358,560', K.goldDark, 11); strokeP(c, 'M186,558 Q272,606 358,558', K.gold, 6);
  [179, 365].forEach((x) => { ell(c, x, 553, 30, 30, K.goldDark); ell(c, x, 553, 25, 25, K.gold); c.strokeStyle = K.goldDark; c.lineWidth = 5; c.beginPath(); c.arc(x, 553, 13, 0, 7); c.stroke(); ell(c, x - 9, 543, 5, 5, '#fff2c0'); });
};

// ---------- additions for chapters 10-14 (23/11/2026): each runs only when its own field is set ----------
const TORSO = 'M182,572 Q272,548 362,572 L376,884 L168,884 Z';
const h2 = (i: number, j: number, k: number) => { const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return v - Math.floor(v); };
/** stone plates cut in flat paper, in the part's own coordinates, so that they move with the limb */
const rockTex = (c: C, d: string, x0: number, y0: number, x1: number, y1: number) => {
  if (!ROCK) return;
  const r = ROCK, S = r.size ?? 64, nx = Math.ceil((x1 - x0) / S) + 3, ny = Math.ceil((y1 - y0) / (S * 0.82)) + 3;
  const P = (i: number, j: number): Pt => [x0 - S + i * S + (j % 2 ? S / 2 : 0) + (h2(i, j, 1) - 0.5) * S * 0.47, y0 - S + j * S * 0.82 + (h2(i, j, 2) - 0.5) * S * 0.41];
  c.save(); c.clip(new Path2D(d));
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const q = poly([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)]);
    const v = h2(i, j, 3); if (r.dark ? v < 0.36 : v > 0.52) fillP(c, q, r.light); else if (r.dark && v > 0.7) fillP(c, q, r.dark);
    strokeP(c, q, r.crack, Math.max(5, S * 0.075), 'butt');
  }
  c.restore();
};
/** the look of one straight piece of arm: stone plates, or a hard reflection along a metal body */
const armLook = (c: C, L: number, w: number, d?: string) => {
  if (ROCK) rockTex(c, d ?? `M${-w},-4 L${w},-4 L${w},${L + 8} L${-w},${L + 8} Z`, -w - 12, -36, w + 12, L + 10);
  if (SHEEN) fillP(c, blade([-w * 0.42, 8], [-w * 0.42, L - 8], 2, 11), SHEEN);
};
/** an arm that stretches (ArmPose.stretch): one thin band from the shoulder along `sh`, thinner as it grows, with a slow S, the hand at its end */
const rubberArm = (c: C, a: typeof ARM.L, p: ArmPose, sleeve: string, edge: string, rim: string | null) => {
  const k = Math.max(1, p.stretch ?? 1), L = (UP + FORE) * k, amp = (p.bow ?? 20) * Math.min(1, (k - 1) * 1.2), wE = Math.max(20, 33 - 5 * (k - 1)), N = 32;
  const cx = (t: number) => amp * Math.sin(t * Math.PI * 2) * Math.sin(t * Math.PI), hw = (t: number) => 33 + (wE - 33) * Math.min(1, t * 2);
  const l: string[] = [], r: string[] = [];
  for (let i = 0; i <= N; i++) { const t = i / N; l.push(`${cx(t) - hw(t)},${t * L}`); r.unshift(`${cx(t) + hw(t)},${t * L}`); }
  const d = `M${l.join(' L')} L${r.join(' L')} Z`;
  c.save(); c.translate(a.x, SH_Y); c.rotate((a.k * p.sh * Math.PI) / 180);
  c.save(); c.translate(0, L); c.rotate((a.k * (p.wrist ?? 0) * Math.PI) / 180); c.scale(1.12, 1.12); hand(c, p.hand ?? 'open', a.out); c.restore();
  if (rim) strokeP(c, d, rim, 6);
  fillP(c, d, sleeve); seg(c, -wE, L - 12, wE, L - 12, 3, edge, 'butt');
  if (GLOVE) { c.fillStyle = GLOVE.a; c.beginPath(); c.roundRect(-wE - 3, L - 18, wE * 2 + 6, 26, 7); c.fill(); }
  if (SHEEN) fillP(c, blade([-wE * 0.4, 10], [-wE * 0.4, L - 22], 2, 9), SHEEN);
  c.restore();
};
/** the front of a one-piece suit (Spec.suit), in place of the waistcoat: flat side panels, a round neck, a belt */
const suitChest = (c: C, s: Spec) => {
  const su = s.suit!, line = su.line ?? shadeHex(K.shirt, 0.78);
  if (!ROCK?.arm) fillP(c, 'M212,566 Q272,536 332,566 L322,594 L222,594 Z', K.shirt);   // the suit comes up under the chin: a short face must not leave a gap above the shoulders
  if (!su.plain) {
    fillP(c, 'M186,580 L208,574 L230,720 L222,884 L170,884 Z', line); fillP(c, 'M358,580 L336,574 L314,720 L322,884 L374,884 Z', line);
    strokeP(c, 'M228,560 Q272,606 316,560', line, 10);
    fillP(c, 'M170,860 L374,860 L376,884 L168,884 Z', su.belt ?? line);
  }
  if (SHEEN) { fillP(c, blade([206, 610], [214, 840], 3, 13), SHEEN); fillP(c, blade([300, 640], [346, 628], 5, 7), SHEEN); fillP(c, blade([226, 742], [318, 742], -6, 5), SHEEN); }
};
/** the body of a giant of stone (rock.arm set): a torso wider at the shoulders than at the hips, wide hips */
const BRUTE = 'M116,572 Q150,520 272,512 Q394,520 428,572 L420,740 L392,890 L152,890 L124,740 Z';
const bruteTorso = (c: C) => {
  fillP(c, 'M146,862 L398,862 L410,982 Q402,1012 342,1012 Q300,1012 272,976 Q244,1012 202,1012 Q142,1012 134,982 Z', K.shorts);
  seg(c, 148, 894, 396, 894, 16, shadeHex(K.shorts, 0.74), 'butt');
  fillP(c, BRUTE, K.shirt);
};
/** the two masses of the shoulders, drawn over the sides of the head: he has no neck, the head sits sunk between them */
const bruteShoulders = (c: C) => ([['M78,664 L86,590 L132,544 L184,544 L204,588 L196,642 L148,676 Z', 70, 538, 212, 680], ['M466,664 L458,590 L412,544 L360,544 L340,588 L348,642 L396,676 Z', 332, 538, 474, 680]] as [string, number, number, number, number][]).forEach(([d, x0, y0, x1, y1]) => { fillP(c, d, K.shirt); rockTex(c, d, x0, y0, x1, y1); strokeP(c, d, ROCK!.crack, 6, 'butt'); });
/** a cape behind a suit, from the shoulders to the calves, a cut hem; dy, q: where a shortened body has its shoulders */
const capeBehind = (c: C, s: Spec, uu: UpT, dy = 0, q = 1) => up(c, uu, () => {
  const ca = s.cape!, d = ca.dark ?? shadeHex(ca.color, 0.72);
  c.save(); c.translate(0, 574 + dy); c.scale(1, q); c.translate(0, -574);
  const o = poly([[150, 572], [394, 572], [446, 760], [478, 1020], [424, 984], [376, 1050], [322, 996], [272, 1060], [222, 996], [168, 1050], [120, 984], [66, 1020], [98, 760]]);
  fillP(c, o, ca.color); c.save(); c.clip(new Path2D(o));
  fillP(c, poly([[272, 560], [500, 560], [500, 1080], [272, 1080]]), d);
  fillP(c, poly([[190, 600], [226, 600], [186, 1060], [120, 1060]]), d); fillP(c, poly([[330, 600], [356, 600], [430, 1060], [372, 1060]]), ca.color);
  c.restore(); c.restore();
});
/** THÂN LỬA (Spec.flame, làm lại 23/11/2026 theo ngôn ngữ của `ColorFlame`): lưỡi lửa bốn sắc lồng nhau, luôn liếm LÊN, mọc trên đúng viền người ở mọi tư thế,
 *  dài dần về vai và đầu, đầu thành một cột lửa. Mỗi lưỡi có vòng đời và pha riêng: mọc, cong theo gió, co lại, rồi đổi hình; hình đổi mỗi 2 khung.
 *  k 0..1: người thường bùng lửa từ chân lên đầu. Thân là lõi sáng, không thấy quần áo; mặt giữ nguyên nét. */
const FLAME_TONES: [string, number, number][] = [['#a81c10', 1, 1], ['#ee4e18', 0.8, 0.85], ['#ffa51f', 0.56, 0.64], ['#ffe45e', 0.3, 0.38]];
const lick = (c: C, x: number, y: number, w: number, h: number, f: number, seed: number, lean: number, sw = 1, sh = 1) => {
  if (h < 3 || w < 2) return;
  const N = 12, ww = w * sw, hh = h * sh, A = Math.min(w, h * 0.55);
  const pt = (i: number, side: number): Pt => { const t = i / N, yy = hh * t, ta = yy / h, bulge = Math.sin(Math.PI * Math.min(1, 0.22 + t * 1.15)); const hw = (ww / 2) * Math.pow(1 - t, 0.85) * (0.5 + 0.62 * bulge) * (1 + 0.24 * ta * Math.sin(f * 0.47 + ta * 9 + seed * 2.3));
    const cx = lean * h * ta * ta + A * (0.34 * Math.pow(ta, 1.4) * Math.sin(f * 0.29 + ta * 4.2 + seed * 1.7) + 0.1 * ta * Math.sin(f * 0.71 + ta * 7.5 + seed)); return [x + cx + side * hw, y - yy]; };
  c.beginPath(); let q = pt(0, -1); c.moveTo(q[0], q[1]);
  for (let i = 1; i <= N; i++) { q = pt(i, -1); c.lineTo(q[0], q[1]); }
  for (let i = N - 1; i >= 0; i--) { q = pt(i, 1); c.lineTo(q[0], q[1]); }
  const b0 = pt(0, -1), b1 = pt(0, 1), foot = (b1[0] - b0[0]) * 0.62;
  for (let j = 1; j < 6; j++) { const a = Math.PI * (j / 6); c.lineTo(b1[0] + ((b0[0] - b1[0]) * (1 - Math.cos(a))) / 2, y + Math.sin(a) * foot); }
  c.closePath(); c.fill();
};
const fireSpec = (s: Spec): Spec => ({...s, flame: undefined, addOns: undefined, tie: undefined, emblem: undefined, temples: undefined, suit: {plain: true}, hair: 'bald', messy: false, browFront: true, whites: '#fffdf0', palette: {...(s.palette ?? {}),
  skinA: '#fff6c8', skinB: '#ffe88a', skinC: '#ffcf52', skin: '#ffe88a', skinDark: '#ff9a24', lidEdge: '#c23a12', earMark: '#ff9a24', mouth: '#8e1f0a', iris: '#d14510', pupil: '#4e1206', hair: '#ffb324', hairLine: '#ffe45e', brow: '#b3200f',
  shirt: '#fff2b4', shirtEdge: '#fff2b4', shirtRim: '#ffc64a', vest: '#fff2b4', shorts: '#fff2b4', shoe: '#ffc23e', button: '#fff2b4'}});
const drawFlaming = (c: C, s: Spec) => {
  const fl = s.flame!, k = Math.max(0, Math.min(1, fl.k ?? 1)), t = fl.t ?? 0, f = t - (t % 2), plain: Spec = {...s, flame: undefined};
  if (k <= 0.001) { drawFigureBase(c, plain); return; }
  const W = c.canvas.width, H = c.canvas.height, T = c.getTransform();
  const layer = () => { const e = document.createElement('canvas'); e.width = W; e.height = H; const x = e.getContext('2d')!; x.setTransform(T); return {e, x}; };
  const burnY = (x: number) => 1300 - k * 1780 + Math.sin(x * 0.035 + f * 0.4) * 26 + Math.sin(x * 0.09 - f * 0.3) * 12;
  const burnD = () => { let d = 'M-900,2200'; for (let x = -900; x <= 1500; x += 16) d += ` L${x},${burnY(x) + ((x + 900) % 32 ? 10 : -10)}`; return d + ' L1500,2200 Z'; };
  const F = layer(); FIRE_BODY = true; drawFigureBase(F.x, fireSpec(s)); FIRE_BODY = false;
  const B = k < 1 ? layer() : null; if (B) drawFigureBase(B.x, plain);
  const Pz = s.posture !== undefined ? resolvePosture(s.posture) : null, drop = Pz ? Pz.drop + 412 * (1 - Pz.squash) + Pz.sink : 0;
  const acting = (Pz?.hanh ?? 0) > 0, hAct = acting ? posedPt(s, Pz!, 272 + (s.head?.dx ?? 0), 330 + (s.head?.dy ?? 0) + Pz!.sink) : null;
  const hx = hAct ? hAct[0] : 272 + (s.head?.dx ?? 0) + (s.hip ?? 0), hy = hAct ? hAct[1] : 330 + (s.head?.dy ?? 0) - (s.hipDy ?? 0) + drop, wind = 0.16 * Math.sin(f * 0.07) + 0.1 * Math.sin(f * 0.19 + 1) + (Pz?.flameWind ?? 0);
  // where the tongues stand: the outline, on a fixed grid, so that a tongue keeps its own rhythm while the pose changes
  const q = Math.max(2, Math.round(T.a * 5)), sm = document.createElement('canvas'); sm.width = Math.ceil(W / q); sm.height = Math.ceil(H / q);
  const sx = sm.getContext('2d', {willReadFrequently: true})!; sx.drawImage(F.e, 0, 0, sm.width, sm.height);
  const im = sx.getImageData(0, 0, sm.width, sm.height).data, on = (i: number, j: number) => im[(j * sm.width + i) * 4 + 3] > 70;
  const col = (x: number) => Math.round((x * T.a + T.e) / q), row = (y: number) => Math.round((y * T.d + T.f) / q), mx = (i: number) => (i * q - T.e) / T.a, my = (j: number) => (j * q - T.f) / T.d;
  type Tg = {x: number; y: number; w: number; h: number; id: number; lean: number; side: number};
  const tg: Tg[] = [], tops: Pt[] = [];
  const add = (x: number, y: number, id: number, side: number, boost = 1) => {
    const b = Math.max(0, Math.min(1, (y - burnY(x)) / 140)); if (b <= 0) return;
    const L = 12 + Math.floor(h2(id, 1, 5) * 14), cyc = (f + h2(id, 2, 5) * L * 7) / L, n = Math.floor(cyc), u = cyc - n, g0 = u < 0.3 ? u / 0.3 : 1 - (u - 0.3) / 0.7, g = g0 * g0 * (3 - 2 * g0);
    const r = Math.max(0, Math.min(1, (1197 - y) / 1000)), onHead = ((x - hx) / 236) ** 2 + ((y - hy) / 286) ** 2 < 1.15;
    // on a limb a tongue is 15-30 % of the limb (about 300 units), big and small in turn; on the head it grows into the column
    const peak = onHead ? (46 + 176 * Math.pow(r, 1.5)) * (0.74 + 0.52 * h2(id, n, 7)) : (46 + 34 * h2(id, n, 7)) * [1.12, 0.74, 0.94][Math.abs(Math.floor(id)) % 3] * (1 + 0.25 * r);
    const h3 = peak * boost * (onHead ? 0.5 + 0.72 * g : 0.62 + 0.48 * g) * b, bend = (u - 0.4) * 0.45 * (h2(id, n, 10) > 0.5 ? 1 : -1), lean = wind + side * (onHead ? 0.34 : 0.5) + (h2(id, n, 9) - 0.5) * 0.42 + bend, rx = x + side * (onHead ? -14 : 3), ry = y + 16;
    tg.push({side, x: rx, y: ry, w: Math.max(18, Math.min(176, h3 * (0.58 + 0.26 * h2(id, n, 8)))), h: h3, id: id + n * 0.37, lean});
    if (u > 0.55 && h2(id, n, 11) > 0.4) { const v = (u - 0.55) / 0.45; tg.push({side, x: rx + lean * h3, y: ry - h3 - v * (46 + 0.5 * h3), w: Math.max(6, h3 * 0.34 * (1 - v)), h: h3 * 0.58 * (1 - v * 0.6), id: id + n * 0.37 + 5, lean: lean * 0.5}); }   // the tip breaks off, rises and goes out
  };
  let id = 0;
  for (let gx = acting ? -860 : -420; gx <= (acting ? 1400 : 960); gx += 30, id++) { const i = col(gx); if (i < 0 || i >= sm.width) continue; for (let j = 0; j < sm.height; j++) if (on(i, j)) { add(mx(i), my(j), id, 0); tops.push([mx(i), my(j)]); break; } }
  // every edge on each row, also the inner ones: between the legs, under a raised arm
  for (let gy = -460, ro = 0; gy <= 1190; gy += 34, ro++) { const j = row(gy); if (j < 0 || j >= sm.height) continue; let inside = false, run = 0;
    for (let i = 0; i <= sm.width; i++) { const o = i < sm.width && on(i, j); if (o !== inside) { add(mx(o ? i : i - 1), my(j), 2000 + ro * 12 + run, o ? -1 : 1); inside = o; run++; } } }
  [-92, -46, 0, 46, 92].forEach((dx, n) => add(hx + dx, hy - 130 + Math.abs(dx) * 0.5, 900 + n, 0, (n === 2 ? 2.15 : n % 2 ? 1.75 : 1.35)));   // the column over the head
  tg.sort((a, b) => b.h - a.h);
  const tint = (col2: string) => { const e = document.createElement('canvas'); e.width = W; e.height = H; const x = e.getContext('2d')!; x.drawImage(F.e, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col2; x.fillRect(0, 0, W, H); return e; };
  const burn = new Path2D(burnD()), DIRS: Pt[] = [[1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7], [0, -1], [0.7, -0.7]];
  const ero = (r: number) => { const e = document.createElement('canvas'); e.width = W; e.height = H; const x = e.getContext('2d')!; x.drawImage(F.e, 0, 0); x.globalCompositeOperation = 'destination-in'; DIRS.forEach(([dx, dy]) => x.drawImage(F.e, dx * r, dy * r)); return e; };
  // the bright body: rivers of flame run up inside it, then a yellow and an orange band follow its outline. The face stays clear
  const cut = new Path2D('M-900,-900 L1500,-900 L1500,2200 L-900,2200 Z'); cut.ellipse(hx, hy, 208, 258, acting ? ((Pz!.roll + Pz!.tilt + (Pz!.faceUp ?? 0)) * Math.PI) / 180 : 0, 0, Math.PI * 2);
  const rings = ([['#ffc42e', 12], ['#ff9020', 5]] as [string, number][]).map(([tone, r]) => { const e = tint(tone), x = e.getContext('2d')!; x.globalCompositeOperation = 'destination-out'; x.drawImage(ero(r * T.a), 0, 0); return e; });
  F.x.save(); F.x.globalCompositeOperation = 'source-atop'; F.x.clip(cut, 'evenodd');
  (['#ffcf3a', '#ff9d24'] as string[]).forEach((tone, pass) => { F.x.fillStyle = tone; for (let i = 0; i < 5; i++) {   // a few long curved streaks running up the body, in two tones
    const a = i * 7 + pass * 31, L = 26 + Math.floor(h2(a, 1, 7) * 18), cyc = (f + h2(a, 2, 7) * L * 4) / L, n = Math.floor(cyc), u = cyc - n, bx = 196 + (s.hip ?? 0) + h2(a, n, 1) * 152, by = 1190 - u * 260, len = (330 + 160 * h2(a, n, 3)) * (pass ? 0.78 : 1), wd = (18 + 16 * h2(a, n, 4)) * Math.pow(Math.sin(Math.PI * u), 0.5) * (pass ? 0.72 : 1), N = 14;
    if (wd < 1) continue;
    const P = (t: number, sd: number): Pt => [bx + Math.sin(t * 3.4 + f * 0.16 + a) * 22 * (0.35 + t) + sd * (wd / 2) * Math.pow(Math.sin(Math.PI * t), 0.8), by - len * t];
    F.x.beginPath(); for (let q2 = 0; q2 <= N; q2++) { const v = P(q2 / N, -1); if (q2) F.x.lineTo(v[0], v[1]); else F.x.moveTo(v[0], v[1]); } for (let q2 = N; q2 >= 0; q2--) { const v = P(q2 / N, 1); F.x.lineTo(v[0], v[1]); } F.x.closePath(); F.x.fill();
  } });
  F.x.setTransform(1, 0, 0, 1, 0, 0); rings.forEach((e) => F.x.drawImage(e, 0, 0));
  F.x.restore();
  // from the outside in: the dark edge, orange, yellow, each a whole mass of the outline and the tongues
  FLAME_TONES.forEach(([tone, sw, sh], pass) => {
    const rad = [14, 9, 4, 0][pass] * T.a;
    if (rad > 0) { const e = tint(tone); c.save(); c.clip(burn); c.setTransform(1, 0, 0, 1, 0, 0); DIRS.forEach(([dx, dy]) => c.drawImage(e, dx * rad, dy * rad)); c.restore(); }
    c.fillStyle = tone; tg.forEach((g) => lick(c, g.x, g.y, g.w, g.h, f, g.id, g.lean, sw, sh));
  });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); if (B) c.drawImage(B.e, 0, 0); c.restore();
  c.save(); c.clip(burn); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(F.e, 0, 0); c.restore();
  // pieces that break off the top, rise and go out
  c.save(); c.clip(cut, 'evenodd');
  if (tops.length) for (let i = 0; i < 10; i++) {
    const L = 15 + (i % 5), cyc = (f + i * 7) / L, n = Math.floor(cyc), u = cyc - n, sp = tops[Math.floor(h2(i, n, 3) * tops.length) % tops.length]; if (sp[1] < burnY(sp[0])) continue;
    const sz = (16 + h2(i, n, 4) * 24) * (1 - u), x2 = sp[0] + (h2(i, n, 5) - 0.5) * 56 + wind * 120 * u, y2 = sp[1] - 56 - (70 + h2(i, n, 6) * 150) * u;
    FLAME_TONES.slice(1).forEach(([tone, sw, sh]) => { c.fillStyle = tone; lick(c, x2, y2, sz, sz * 2.3, f, i + n, wind, sw, sh); });
  }
  c.restore();
};
/** dust settled on a figure: small flat flecks, thicker low down; only on the figure */
const applyDust = (c: C, amount: number) => {
  const n = Math.max(0, Math.min(1, amount));
  c.save(); c.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 150 * n; i++) { const x = -40 + h2(i, 1, 9) * 640, y = 500 + Math.sqrt(h2(i, 2, 9)) * 700, r = 3 + h2(i, 3, 9) * 9; fillP(c, poly([[x - r, y], [x, y - r * 0.6], [x + r, y + r * 0.2], [x - r * 0.2, y + r * 0.7]]), i % 3 ? 'rgba(190,178,154,0.62)' : 'rgba(120,110,96,0.5)'); }
  c.restore();
};
/** the marks of `scar` with paint: true, inside the outline of the face. A cut under the eye to the jaw with two ticks; heavy adds stitches, a burnt
 *  cheek on the other side and a cut between the brows. Flat shapes with sharp edges. */
const scarMarks = (c: C, sc: NonNullable<Spec['scar']>, face: string) => {
  const X = (x: number) => (sc.side === 'L' ? x : 544 - x), col = sc.fresh ? '#b8322e' : mixHex(K.skinDark, '#74302a', 0.62), deep = sc.fresh ? '#7c1d1c' : mixHex(K.skinDark, '#4a1c1a', 0.7);
  const P = (a: Pt): Pt => [X(a[0]), a[1]], stitch = (x1: number, y1: number, x2: number, y2: number) => seg(c, X(x1), y1, X(x2), y2, 4.5, deep, 'butt');
  c.save(); c.clip(new Path2D(face));
  fillP(c, poly(([[136, 362], [150, 376], [148, 430], [134, 470], [136, 516], [122, 520], [116, 468], [130, 424]] as Pt[]).map(P)), col);
  strokeP(c, `M${X(142)},372 L${X(138)},430 L${X(124)},476 L${X(128)},514`, deep, 3.5, 'butt');
  fillP(c, poly(([[104, 408], [166, 392], [168, 400], [108, 420]] as Pt[]).map(P)), col); fillP(c, poly(([[98, 486], [150, 458], [154, 468], [104, 498]] as Pt[]).map(P)), col);
  if (sc.heavy) {
    [[116, 386, 156, 396], [112, 410, 152, 420], [108, 444, 148, 452], [102, 476, 142, 486]].forEach(([a, b, d, e]) => stitch(a, b, d, e));
    fillP(c, poly(([[396, 376], [452, 352], [474, 410], [452, 492], [404, 516], [376, 462], [392, 424]] as Pt[]).map(P)), mixHex(K.skinC, '#8e2a22', 0.62));   // the burnt cheek, on the other side
    fillP(c, poly(([[414, 398], [450, 382], [460, 424], [440, 470], [410, 480], [398, 440]] as Pt[]).map(P)), mixHex(K.skinDark, '#5e1a18', 0.72));
    [[414, 410, 452, 420], [408, 436, 448, 446], [410, 462, 442, 470]].forEach(([a, b, d, e]) => stitch(a, b, d, e));
    fillP(c, poly(([[262, 160], [282, 158], [292, 196], [280, 232], [266, 230], [274, 196]] as Pt[])), col);
    [[258, 178, 296, 186], [258, 204, 292, 212]].forEach(([a, b, d, e]) => seg(c, a, b, d, e, 4, deep, 'butt'));
  }
  c.restore();
};

const chestExtras = (c: C, s: Spec) => {
  if (s.skirt) {   // drawn over the legs and the hip piece: a bell from the waistband to the ankles, folds, a hem band
    const d = shadeHex(s.skirt, 0.78), l = shadeHex(s.skirt, 1.12);
    fillP(c, 'M178,858 L366,858 L412,1126 Q272,1150 132,1126 Z', s.skirt);
    strokeP(c, 'M214,880 Q204,1000 186,1124 M258,880 Q254,1010 246,1136 M300,880 Q308,1010 316,1136 M340,880 Q356,1000 374,1122', d, 5);
    strokeP(c, 'M236,884 Q230,1000 218,1128 M322,884 Q332,1000 346,1126', l, 3);
    strokeP(c, 'M138,1100 Q272,1124 406,1100', d, 9); seg(c, 178, 864, 366, 864, 12, d, 'butt');
  }
  if (s.tie) { const d = shadeHex(s.tie, 0.72); fillP(c, 'M266,616 L278,616 L288,744 L272,768 L256,744 Z', s.tie); strokeP(c, 'M272,630 L272,752', d, 2.5); fillP(c, 'M260,594 L284,594 L279,620 L265,620 Z', d); }
  if (s.ponytail) {   // behind the head (the head is drawn after this), in front of the shoulder and the chest
    fillP(c, 'M378,430 Q446,520 428,640 Q414,726 380,772 Q356,712 366,632 Q374,548 340,476 Z', K.hair);
    strokeP(c, 'M392,470 Q428,560 406,660 Q398,716 382,752', K.hairLine, 4);
    if (typeof s.ponytail === 'string') { fillP(c, 'M392,538 L440,522 L444,552 L396,566 Z', s.ponytail); fillP(c, 'M440,530 L468,512 L462,548 Z', shadeHex(s.ponytail, 0.8)); }
  }
  if (s.apron) { const d = shadeHex(s.apron, 0.76); strokeP(c, 'M226,640 Q210,600 200,572 M318,640 Q334,600 344,572', d, 9); fillP(c, 'M222,636 L322,636 L330,760 L356,772 L366,940 Q272,958 178,940 L188,772 L214,760 Z', s.apron); strokeP(c, 'M188,772 Q272,790 356,772', d, 6); fillP(c, 'M240,820 L304,820 L300,880 L244,880 Z', d); }
  if (s.emblem) { fillP(c, 'M272,640 L318,706 L272,772 L226,706 Z', shadeHex(s.emblem, 0.7)); fillP(c, 'M272,654 L308,706 L272,758 L236,706 Z', s.emblem); }
  runAddOns(c, s, 'chest');
};
// ---------- dáng đánh nhau (23/11/2026): chỉ chạy khi posture có `hanh` ----------
/** áo choàng bay ngược hướng lực: gốc ghim ở hai vai, thân áo chạy theo capeX, gợn sóng theo `phase`, gấu cắt răng cưa; mảng phẳng, mép sắc */
const capeWind = (c: C, P: Posture, phase: number, t: {main: string; dark: string; light: string; inner: string}, x0 = 112, x1 = 432, y0 = 500) => {
  const a = (P.capeX ?? 0) * 80 * RAD, L = 640 * (P.capeLen ?? 1), dx = Math.sin(a), dy = Math.cos(a), mx = (x0 + x1) / 2, hw0 = (x1 - x0) / 2, N = 16;
  const wave = (u: number) => (Math.sin(u * 5.4 + phase) * 34 + Math.sin(u * 11.5 + phase * 1.7) * 10) * u;
  const pt = (u: number, sd: number, k = 1): Pt => { const hw = (hw0 + 120 * u) * k, w = wave(u), e = Math.min(1, u * 2.4), bl = e * e * (3 - 2 * e), fx = mx + dx * L * u + dy * (w + sd * hw), fy = y0 + dy * L * u - dx * (w + sd * hw), rx = mx + sd * hw0 * k, ry = y0 + L * u * 0.2; return [rx + (fx - rx) * bl, ry + (fy - ry) * bl]; };
  const edge = (sd: number, k = 1, u0 = 0, u1 = 1) => Array.from({length: N + 1}, (_, i) => pt(u0 + ((u1 - u0) * i) / N, sd, k));
  const hem: Pt[] = []; for (let i = 1; i < 9; i++) { const v = 1 - (2 * i) / 9; hem.push(pt(i % 2 ? 0.9 : 1, v)); }
  fillP(c, poly([...edge(1), ...hem, ...edge(-1).reverse()]), t.inner);
  fillP(c, poly([...edge(1), ...edge(1, 0.5).reverse()]), t.main); fillP(c, poly([...edge(-1), ...edge(-1, 0.58).reverse()]), t.main);
  fillP(c, poly([...edge(1, 1, 0, 0.94), ...edge(1, 0.82, 0, 0.94).reverse()]), t.light);
  [-0.26, 0.2, 0.68].forEach((v, i) => { const A = pt(0.14, v), B = pt(0.9 - i * 0.05, v * 1.08), mid = pt(0.5, v + 0.05); fillP(c, poly([A, [mid[0] + 7, mid[1] + 7], B, [mid[0] - 9, mid[1] - 9]]), t.dark); });
};
/** hai chân giáp của Doom gập theo dáng đánh nhau, cùng màu và đường nối với chân đứng */
const doomLegsAct = (c: C, s: Spec, u: UpT, P: Posture) => (['L', 'R'] as const).forEach((sd) => {
  const b = P[sd], g = sd === 'L' ? s.legL : s.legR, k = sd === 'L' ? -1 : 1, H = u.pt(D_HIP[sd], HIP_Y - 22), N: Pt = [(D_HIP[sd] + D_ANK[sd]) / 2 + b.kx, (HIP_Y + 1148) / 2 + b.ky], A: Pt = [D_ANK[sd] + b.ax + (g?.dx ?? 0), 1148 + b.ay - (g?.lift ?? 0)];
  fillP(c, limbPath(H, N, A, 62, 60, 56), K.plate);
  const off = (p: Pt, d: number): Pt => [p[0] + d, p[1]]; fillP(c, poly([off(H, 30), off(H, 60), off(N, 58), off(A, 54), off(A, 28), off(N, 30)]), 'rgba(112,118,126,0.2)');
  const sx = N[0] + (A[0] - N[0]) * 0.56, sy = N[1] + (A[1] - N[1]) * 0.56, ang = Math.atan2(A[1] - N[1], A[0] - N[0]) - Math.PI / 2, ca = Math.cos(ang) * 54, sa = Math.sin(ang) * 54; seg(c, sx - ca, sy - sa, sx + ca, sy + sa, 3, K.plateLine, 'butt');
  ell(c, N[0], N[1], 42, 36, K.armour); ell(c, N[0], N[1] - 4, 36, 30, K.plate);
  c.save(); c.translate(A[0], A[1] + 49); c.rotate(-k * (b.toe + (g?.toe ?? 0)) * RAD); c.scale(1 - 0.32 * Math.min(1, Math.abs(b.toe) / 74), 1);
  fillP(c, `M${-k * 66},0 L${-k * 66},-34 Q${-k * 62},-58 ${-k * 28},-58 L${k * 26},-58 Q${k * 84},-52 ${k * 104},0 Z`, K.armour); seg(c, -k * 66, -3, k * 104, -3, 6, K.armourDark, 'butt');
  c.restore();
});
/** một điểm trong khuôn (người đứng thẳng) tới chỗ của nó khi người đang ở posture P: dồn, nghiêng, rồi xoay cả người */
const posedPt = (s: Spec, P: Posture, x: number, y: number): Pt => {
  const us = upperT({...s, hip: (s.hip ?? 0) + P.shift, hipDy: (s.hipDy ?? 0) - P.drop, lean: (s.lean ?? 0) + P.tilt}), [a, b] = us.pt(x, y + 412 * (1 - P.squash));
  if (!P.roll) return [a, b];
  const r = P.roll * RAD, X = a - 272, Y = b - 960; return [272 + X * Math.cos(r) - Y * Math.sin(r) + P.rollX, 960 + X * Math.sin(r) + Y * Math.cos(r) + rollDrop(P.roll, s.outfit === 'coat') - (P.cardUp ?? 0)];
};
/** CHỖ BÀN TAY trong khuôn (giữa lòng bàn tay), đúng với tay, thân, dáng đang có: để tia, lửa, khiên bắt đầu ĐÚNG ở tay */
export const handPoint = (s: Spec, side: 'L' | 'R'): Pt => {
  const doom = s.outfit === 'doom', p = (side === 'L' ? s.armL : s.armR) ?? {sh: 5}, B = (s.bulk ?? 1.3) / 1.3, A0 = doom ? D_ARM[side] : ARM[side], sx = doom ? 272 + A0.x * B : A0.x + A0.out * (s.rock?.out ?? 0), sy = doom ? D_SH : SH_Y;
  const t1 = A0.k * p.sh * RAD, t2 = t1 + A0.k * (p.el ?? 0) * RAD, DIR = (t: number): Pt => [-Math.sin(t), Math.cos(t)], stretched = !doom && (p.stretch ?? 1) > 1;
  const U = doom ? D_UP * (p.dai ?? 1) : UP * (p.len ?? 1), Fo = doom ? D_FORE * (p.dai ?? 1) : FORE * (p.len ?? 1), palm = doom ? 40 : 40 * (s.rock?.fist ?? 1);
  let x: number, y: number;
  if (stretched) { const L = (UP + FORE) * (p.stretch ?? 1) + palm, d = DIR(t1); x = sx + d[0] * L; y = sy + d[1] * L; }
  else { const d1 = DIR(t1), d2 = DIR(t2); x = sx + d1[0] * U + d2[0] * (Fo + palm); y = sy + d1[1] * U + d2[1] * (Fo + palm); }
  const P = s.posture !== undefined ? resolvePosture(s.posture) : POSTURES.stand; let q = posedPt(s, P, x, y);
  if (!doom && s.broad && s.broad !== 1) q = [272 + (q[0] - 272) * s.broad, q[1]];
  if (s.rock?.tall && s.rock.tall !== 1) q = [272 + (q[0] - 272) * s.rock.tall, SOLE_Y + (q[1] - SOLE_Y) * s.rock.tall];
  return q;
};
/** chỗ bàn tay trong THẾ GIỚI của một `Puppet3` đặt ở `pos`, cao `height`, có thể lật */
export const handWorld = (s: Spec, height: number, pos: [number, number, number], flip: boolean | undefined, side: 'L' | 'R'): [number, number, number] => {
  const u = height / (SOLE_Y - HAIR_TOP), [x, y] = handPoint(s, side), k = flip ? -1 : 1, Pw = s.posture !== undefined ? resolvePosture(s.posture) : null, rise = (Pw?.rise ?? 0) - (Pw?.cardUp ?? 0);
  return [pos[0] + ((s.x ?? 0) + (x - CENTRE_X)) * u * k, pos[1] + (SOLE_Y - y + rise + Math.max(0, s.y ?? 0)) * u, pos[2] + 0.02];
};

/** chỗ giữa hai cổ chân trong THẾ GIỚI, đúng với dáng đang có: gốc của đuôi lửa, vệt bụi khi lao */
export const feetWorld = (s: Spec, height: number, pos: [number, number, number], flip?: boolean): [number, number, number] => {
  const P: Posture = s.posture !== undefined ? resolvePosture(s.posture) : POSTURES.stand, u = height / (SOLE_Y - HAIR_TOP), k = flip ? -1 : 1, ax = 272 + (P.L.ax + P.R.ax) / 2, ay = 1160 + (P.L.ay + P.R.ay) / 2, r = P.roll * RAD, X = ax - 272, Y = ay - 960;
  let x = P.roll ? 272 + X * Math.cos(r) - Y * Math.sin(r) + P.rollX : ax, y = P.roll ? 960 + X * Math.sin(r) + Y * Math.cos(r) + rollDrop(P.roll, s.outfit === 'coat') - (P.cardUp ?? 0) : ay;
  if (s.rock?.tall && s.rock.tall !== 1) { x = 272 + (x - 272) * s.rock.tall; y = SOLE_Y + (y - SOLE_Y) * s.rock.tall; }
  return [pos[0] + ((s.x ?? 0) + x - CENTRE_X) * u * k, pos[1] + (SOLE_Y - y + (P.rise ?? 0) - (P.cardUp ?? 0) + Math.max(0, s.y ?? 0)) * u, pos[2] + 0.02];
};

/** Draws one figure in mould units. The caller sets the transform (see BOX). */
const drawFigureBase = (c: C, s: Spec) => {
  K = {...K0, ...(s.palette ?? {})};
  if (s.palette?.skinB && !s.palette.skin) K.skin = s.palette.skinB;
  GLOVE = s.suit?.glove ? {a: s.suit.glove, d: s.suit.gloveDark ?? shadeHex(s.suit.glove, 0.72)} : null; ROCK = s.rock ?? null; SHEEN = s.sheen ?? null; ROLLED = !!s.rolled && s.outfit === 'vest';
  const back = s.view === 'back', hd = s.head ?? {}, u = upperT(s);
  const hs = s.headK ?? (s.build === 'adult' ? 0.8 : 1);   // Doom's masked face is the size of any adult's face; only the hood adds to it
  const sink = s.posture !== undefined && s.outfit !== 'doom' ? resolvePosture(s.posture).sink : 0;   // a body pitched forward: the head sits lower between the shoulders
  const slim = s.outfit === 'vest' && s.posture === undefined ? s.slim ?? 1 : 1;
  const headT = (fn: () => void) => { c.save(); c.translate(272 + (hd.dx ?? 0), 548 + (hd.dy ?? 0) + (s.rock?.headDy ?? 0) + sink - (s.outfit === 'doom' ? D_HEAD_UP : 0)); if (slim !== 1) c.scale(1 / slim, 1); if (s.broad && s.outfit !== 'doom') c.scale(1 / s.broad, 1); c.rotate((((hd.rot ?? 0) + (s.posture !== undefined ? resolvePosture(s.posture).faceUp ?? 0 : 0)) * Math.PI) / 180); c.scale(hs, hs); c.translate(-272, -548); fn(); c.restore(); };
  if (s.outfit === 'doom') {
    // bulk 1.3 is the build measured on the reference (the geometry above); another value scales the breadth about the centre line
    const B = (s.bulk ?? 1.3) / 1.3, sit = !!s.sit && !back, us = s.sit ? upperT({...s, hipDy: (s.hipDy ?? 0) - SIT}) : u;
    const wide = (fn: () => void) => { c.save(); c.translate(272, 0); c.scale(B, 1); c.translate(-272, 0); fn(); c.restore(); };
    const body = (fn: () => void) => wide(() => up(c, us, fn));
    const pose = (sd: 'L' | 'R') => (sd === 'L' ? s.armL : s.armR) ?? {sh: 5};
    const folded = (['L', 'R'] as const).every((sd) => { const p = pose(sd); return p.hand === 'edge' && (p.el ?? 0) < -90 && !p.front; });   // the named pose 'cross'
    const arms = (which: (sd: 'L' | 'R') => 'all' | 'upper' | 'fore' | 'hand' | null) => (['L', 'R'] as const).forEach((sd) => { const part = which(sd); if (part) up(c, us, () => doomArm(c, sd, pose(sd), B, part)); });
    if (back && s.backDetail) {
      const tense = typeof s.backDetail === 'object' ? Math.max(0, Math.min(1, s.backDetail.tense ?? 0)) : 0;
      wide(() => doomLegs(c, s, us));
      // the arms come out at the sides of the cape: from behind the shoulders are the outer corners of the mantle, wider than the arm's place on the front
      (['L', 'R'] as const).forEach((sd) => up(c, us, () => { c.save(); c.translate((sd === 'L' ? -1 : 1) * 44 * B, -14 * tense); doomArm(c, sd, pose(sd), B, 'all'); c.restore(); }));
      body(() => { doomBackCape(c, s); doomBackMantle(c, tense); });
      up(c, us, () => headT(() => doomBackHood(c)));
      return;
    }
    if (back) { wide(() => doomLegs(c, s, us)); body(() => { doomCape(c, s, true); doomMantle(c); }); up(c, us, () => headT(() => doomHeadBack(c))); return; }
    const Pa = s.posture !== undefined ? resolvePosture(s.posture) : null;
    if (Pa && (Pa.hanh ?? 0) > 0 && !sit) {   // dáng đánh nhau của Doom: áo bay theo lực, chân gập, cả người có thể xoay
      const ua = upperT({...s, hip: (s.hip ?? 0) + Pa.shift, hipDy: (s.hipDy ?? 0) - Pa.drop, lean: (s.lean ?? 0) + Pa.tilt}), bodyA = (fn: () => void) => wide(() => up(c, ua, fn));
      const armsA = (part: 'all' | 'fore') => (['L', 'R'] as const).forEach((sd) => up(c, ua, () => doomArm(c, sd, pose(sd), B, part)));
      c.save(); if (Pa.roll) { c.translate(Pa.rollX, rollDrop(Pa.roll, false) - (Pa.cardUp ?? 0)); c.translate(272, 960); c.rotate(Pa.roll * RAD); c.translate(-272, -960); }
      bodyA(() => capeWind(c, Pa, (s.capeT ?? 0) * 0.34 + (s.sway ?? 0) * 0.2, {main: K.cloak, dark: K.cloakDark, light: K.cloakLight, inner: K.cloakIn}));
      wide(() => doomLegsAct(c, s, ua, Pa)); bodyA(() => doomUpper(c, s)); armsA('all'); bodyA(() => doomMantle(c));
      up(c, ua, () => headT(() => doomHead(c, s))); bodyA(() => doomClasps(c)); armsA('fore');
      c.restore(); return;
    }
    body(() => doomCape(c, s));
    if (!sit) wide(() => doomLegs(c, s, us));
    body(() => doomUpper(c, s));
    if (sit) wide(() => doomLegs(c, s, us, true));
    arms(() => (folded ? 'upper' : 'all'));   // every arm starts UNDER the mantle, in front of the tunic
    body(() => doomMantle(c));
    up(c, us, () => headT(() => doomHead(c, s)));
    body(() => doomClasps(c));
    if (folded) up(c, us, () => doomFolded(c, B));
    else arms(() => 'fore');
    const heat = s.mask === 'none' || s.mask === 'dark' ? 0 : s.mask === 'hot' ? 1 : Math.max(0, Math.min(1, s.heat ?? 0));
    if (heat > 0) up(c, us, () => headT(() => doomGlow(c, heat)));   // the forearm and the hand lie in front of the mantle, the clasps and the hood
    return;
  }
  const backKind = (): BackHead => s.backHair ?? (s.hair === 'bald' ? 'bald' : s.hair === 'bun' ? 'bun' : 'bob');
  const vestHead = () => headT(() => (back ? (s.bandage ? bandagedBack(c, s) : headBack(c, backKind(), s.backCloth), runAddOns(c, s, 'rearHead'), s.helmet ? helmet(c, s.helmet, true) : undefined) : headFront(c, s)));
  const vestRest = (noArms = false) => {
    const bowed = s.posture !== undefined && resolvePosture(s.posture).squash < 0.98;   // a body pitched forward: the head comes down in front of the shoulders
    if (ROCK?.arm && !back && bowed) bruteShoulders(c);
    vestHead();
    if (ROCK?.arm && !back && !bowed) bruteShoulders(c);
    if (!back && !noArms) (['L', 'R'] as const).forEach((sd) => { const p = sd === 'L' ? s.armL : s.armR; if (p?.front) arm(c, sd, p, K.shirt, K.shirtEdge, K.shirtRim); });
    if (back) fillP(c, 'M196,572 Q272,540 348,572 L352,598 Q272,574 192,598 Z', K.shirt);   // collar band over the foot of the head: no neck
  };
  /** o (only for a posture): shift = the top of the body lowered onto a shortened trunk; spread = the hem laid out on the ground; noArms = the arms are planted, drawn by beforeHead */
  const coatTop = (uu: UpT, hemK = 1, o: {shift?: number; spread?: number; noArms?: boolean; beforeHead?: () => void} = {}) => up(c, uu, () => {
    if (o.shift) c.translate(0, o.shift);
    const hide = (p?: ArmPose) => (p ? {...p, show: false} : p);
    coatUpper(c, o.spread || o.noArms ? {...s, flare: (s.flare ?? 0) + (o.spread ?? 0), ...(o.noArms ? {armL: hide(s.armL), armR: hide(s.armR)} : {})} : s, back, hemK); if (!back && !s.shawl) chestExtras(c, s);
    const gathered = (fn: () => void) => { if (hemK === 1) { fn(); return; } c.save(); c.translate(0, 520); c.scale(1, hemK); c.translate(0, -520); fn(); c.restore(); };
    if (back) {
      // the back of a long coat: folds from the shoulders to the hem; a shawl, if worn, hangs to a point on the back
      gathered(() => [[214, 640, 196, 1040], [330, 640, 352, 1044], [168, 700, 140, 1030], [378, 700, 404, 1030]].forEach(([x1, y1, x2, y2]) => fillP(c, blade([x1, y1], [x2, y2], 3, 7), K.coatDark)));
      if (s.shawl) {
        const d = shadeHex(s.shawl, 0.78);
        fillP(c, 'M140,584 Q272,548 404,584 L430,700 Q352,760 272,864 Q192,760 114,700 Z', s.shawl); strokeP(c, 'M114,700 Q192,760 272,864 Q352,760 430,700', d, 6);
        for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9, x = t < 0.5 ? 114 + (272 - 114) * t * 2 : 272 + (430 - 272) * (t - 0.5) * 2, y = t < 0.5 ? 700 + 164 * t * 2 : 864 - 164 * (t - 0.5) * 2; seg(c, x, y - 4, x, y + 24, 4, d); }
        fillP(c, blade([272, 600], [272, 820], 3, 6), d);
      }
      headT(() => { if (s.bandage) bandagedBack(c, s); else headBack(c, backKind(), s.backCloth ?? s.shawl); if (s.helmet) helmet(c, s.helmet, true); });
      if (!s.shawl) furCollar(c);
      return;
    }
    if (s.shawl) {   // a shawl crossed on the chest: two sides falling from the shoulders to a point, a fold where they cross, a fringe
      const d = shadeHex(s.shawl, 0.78);
      fillP(c, 'M146,590 Q272,548 398,590 L428,748 Q350,704 272,778 Q194,704 116,748 Z', s.shawl);
      fillP(c, 'M272,778 Q258,690 248,596 L296,596 Q286,690 272,778 Z', d); strokeP(c, 'M146,590 Q272,548 398,590', d, 4);
      [128, 158, 190, 222, 322, 354, 386, 416].forEach((x, i) => seg(c, x, 742 - Math.abs(3.5 - i) * 2 - (x > 180 && x < 364 ? 22 : 0), x - 2, 768 - (x > 180 && x < 364 ? 22 : 0), 4, d));
      o.beforeHead?.(); headT(() => headFront(c, s));
    } else if (s.regal) { gathered(() => regalDress(c, s.regal!)); o.beforeHead?.(); headT(() => headFront(c, s)); }
    else {
      const clasp = () => { furCollar(c); c.save(); c.translate(318, 668); c.rotate(-0.35); ell(c, 0, 0, 20, 12, K.coatDark); c.restore(); };
      if (sink > 0) clasp();   // the head has come down in front of the collar
      o.beforeHead?.(); headT(() => headFront(c, s));
      if (!(sink > 0)) clasp();
    }
    if (!o.noArms) (['L', 'R'] as const).forEach((sd) => { const p = sd === 'L' ? s.armL : s.armR; if (p?.show && p.front) arm(c, sd, p, K.coatLight, K.coatDark, null, false); });
  });
  if (s.posture !== undefined) { drawPosed(c, s, resolvePosture(s.posture), vestRest, coatTop); return; }
  if (s.outfit === 'vest') {
    if (slim !== 1) { c.save(); c.translate(272, 0); c.scale(slim, 1); c.translate(-272, 0); }
    if (s.cape && !back) capeBehind(c, s, u);
    vestLegs(c, s, u);
    up(c, u, () => { vestUpper(c, s, back); if (!back) chestExtras(c, s); else runAddOns(c, s, 'rearBody'); if (s.cape && back) capeBehind(c, s, {...u, a: 0, dx: 0, dy: 0}); vestRest(); });
    if (slim !== 1) c.restore();
    return;
  }
  coatLegs(c, s, u);
  coatTop(u);
};

// ---------- an ordinary figure sitting, kneeling, fallen or lying (23/11/2026; the numbers are in mould/dang.ts) ----------
/** one bent leg as one flat shape: hip, knee, ankle, half-widths w0, w1, w2; a mitre at the knee, so the bend stays a sharp paper corner */
const limbPath = (H: Pt, N: Pt, A: Pt, w0: number, w1: number, w2: number) => {
  const nor = (p: Pt, q: Pt): Pt => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
  const n1 = nor(H, N), n2 = Math.hypot(A[0] - N[0], A[1] - N[1]) < 1 ? n1 : nor(N, A); let mx = n1[0] + n2[0], my = n1[1] + n2[1]; const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
  const m = w1 / Math.max(0.6, mx * n1[0] + my * n1[1]);
  return poly([[H[0] + n1[0] * w0, H[1] + n1[1] * w0], [N[0] + mx * m, N[1] + my * m], [A[0] + n2[0] * w2, A[1] + n2[1] * w2], [A[0] - n2[0] * w2, A[1] - n2[1] * w2], [N[0] - mx * m, N[1] - my * m], [H[0] - n1[0] * w0, H[1] - n1[1] * w0]]);
};
const towards = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** how far a rolled body must come down for its lowest point to lie on the ground */
const rollDrop = (roll: number, coat: boolean) => { const a = roll * RAD, pts: Pt[] = [[96, 640], [448, 640], [122, 330], [422, 330], [92, 930], [452, 930], [200, 1197], [344, 1197], [272, 100], ...(coat ? [[70, 1064], [536, 1064]] as Pt[] : [])]; return SOLE_Y - Math.max(...pts.map(([x, y]) => 960 + (x - 272) * Math.sin(a) + (y - 960) * Math.cos(a))); };
/** a hand pressed flat on the ground, seen from the front: a broad palm, four short fingers spread towards the viewer, a short thumb on the inner side. The wrist is at (0, 0), the fingertips reach y 72 */
const flatHand = (c: C, thumb: number) => {
  const S = GLOVE ? GLOVE.a : K.skin, D = GLOVE ? GLOVE.d : K.skinDark;
  ([[-40, 36], [-14, 44], [12, 45], [38, 37]] as number[][]).forEach(([deg, l]) => { const r = deg * RAD, x0 = Math.sin(r) * 16, y0 = 26 + Math.cos(r) * 8; seg(c, x0, y0, x0 + Math.sin(r) * l, Math.min(64, y0 + Math.cos(r) * l), 16, S); });
  seg(c, thumb * 24, 24, thumb * 54, 46, 17, S);
  ell(c, 0, 24, 44, 26, S);
  strokeP(c, `M-24,38 Q0,46 24,38`, D, 3);
};
const drawPosed = (c: C, s: Spec, P: Posture, vestRest: (noArms?: boolean) => void, coatTop: (u: UpT, hemK?: number, o?: {shift?: number; spread?: number; noArms?: boolean; beforeHead?: () => void}) => void) => {
  const coat = s.outfit === 'coat', back = s.view === 'back', us = upperT({...s, hip: (s.hip ?? 0) + P.shift, hipDy: (s.hipDy ?? 0) - P.drop, lean: (s.lean ?? 0) + P.tilt});
  const q = P.squash, S = 412 * (1 - q), planted = P.plant > 0.02;   // S: how far the shoulders and the chin come down on the shortened trunk
  /** the arm as the spec has it; on a shortened body it shortens too, and a hand never goes through the ground */
  const armAt = (sd: 'L' | 'R'): ArmPose => {
    const p = (sd === 'L' ? s.armL : s.armR) ?? {sh: 5}; if (q >= 0.999) return p;
    // both knees on the ground: a hanging arm comes in and the hand rests on the thigh, ABOVE the knee, so that the round knees stay in sight
    const kneeling = Math.min(P.L.fold, P.R.fold) > 0.5, sh = kneeling && p.sh < 40 ? p.sh - 12 * Math.min(1, (1 - q) / 0.34) : p.sh;
    const a = ARM[sd], k0 = (p.len ?? 1) * (1 - (1 - q) * 0.65), t1 = a.k * sh * RAD, t2 = t1 + a.k * (p.el ?? 0) * RAD, y0 = us.pt(a.x, SH_Y + S)[1], dy = (UP * Math.cos(t1) + FORE * Math.cos(t2)) * k0, room = SOLE_Y - (kneeling ? 176 : 74) - y0;
    return {...p, sh, len: dy > room && dy > 0 ? k0 * Math.max(0.3, room / dy) : k0};
  };
  const legs = (['L', 'R'] as const).map((sd) => {
    const b = P[sd], g = sd === 'L' ? s.legL : s.legR, k = sd === 'L' ? -1 : 1, cx = sd === 'L' ? 243 : 303;
    const vK: Pt = [(HIPS[sd] + ANK[sd]) / 2, (HIP_Y + 1160) / 2], vA: Pt = [ANK[sd], 1160], rK: Pt = coat ? [cx, 1103] : vK, rA: Pt = coat ? [cx, 1170] : vA;
    const H = us.pt(coat ? cx + (HIPS[sd] - cx) * P.amt : HIPS[sd], coat ? 1036 + (HIP_Y - 1036) * P.amt : HIP_Y);
    const N: Pt = [rK[0] + (vK[0] - rK[0]) * P.amt + b.kx, rK[1] + (vK[1] - rK[1]) * P.amt + b.ky];
    const A: Pt = [rA[0] + (vA[0] - rA[0]) * P.amt + b.ax + (g?.dx ?? 0), rA[1] + (vA[1] - rA[1]) * P.amt + b.ay - (g?.lift ?? 0)];
    const sole = Math.min(SOLE_Y - (g?.lift ?? 0), A[1] + (coat ? 27 + 10 * P.amt : 37)), shoeX = coat ? 272 + (A[0] - cx) : A[0];
    const lo = ROCK?.legOut ? k * ROCK.legOut : 0;
    return {sd, b, k, H: [H[0] + lo, H[1]] as Pt, N: [N[0] + lo, N[1]] as Pt, A: [A[0] + lo, A[1]] as Pt, sole, shoeX: shoeX + lo};
  });
  type L = (typeof legs)[number];
  const shoe = (g: L) => { c.save(); c.translate(g.shoeX, g.sole); c.rotate(-g.k * g.b.toe * RAD); if (g.b.fold > 0) c.scale(1 - 0.4 * g.b.fold, 1); const lying = P.roll < -45 && !P.hanh, k = lying ? 1 : g.k; if (lying) c.scale(coat ? 0.5 : 0.62, 1); if (ROCK?.leg) c.scale(ROCK.leg, Math.min(1.25, ROCK.leg));   // lying on the back: both toes point up
    fillP(c, coat ? `M${k * 2},2 L${k * 6},-31 Q${k * 30},-65 ${k * 78},-47 Q${k * 128},-29 ${k * 152},2 Z` : `M${-k * 34},0 Q${-k * 40},-51 ${-k * 8},-55 L${k * 8},-55 Q${k * 62},-47 ${k * 86},0 Z`, K.shoe); c.restore(); };
  const leg = (g: L) => {
    // thigh and shin are two straight pieces meeting under the knee (a mitred single outline spiked on a short, foreshortened thigh)
    const col = coat ? K.trouser : s.longLegs ? K.shorts : K.skin, foot = g.b.fold > 0 ? towards(g.N, g.A, 1 - g.b.fold) : g.A, hasShin = g.b.fold < 0.95;   // a folded shin runs away from the viewer, behind the knee
    const piece = (a: Pt, e: Pt, wa: number, we: number, f: string) => { if (Math.hypot(e[0] - a[0], e[1] - a[1]) > 0.5) fillP(c, limbPath(a, towards(a, e, 0.5), e, wa, (wa + we) / 2, we), f); };
    const rl = ROCK?.leg ?? 1, [w0, w1, w2] = (coat ? [25, 25, 25] : s.longLegs ? [31, 28.5, 26] : [27, 25, 23]).map((v) => v * rl), front = g.b.fore > 0.3;
    piece(g.H, g.N, w0, w1, col); if (hasShin) piece(g.N, foot, w1, w2, col);
    if (ROCK && !coat) { const box = (a: Pt, e: Pt): [number, number, number, number] => [Math.min(a[0], e[0]) - 40, Math.min(a[1], e[1]) - 40, Math.max(a[0], e[0]) + 40, Math.max(a[1], e[1]) + 40]; rockTex(c, limbPath(g.H, towards(g.H, g.N, 0.5), g.N, w0, (w0 + w1) / 2, w1), ...box(g.H, g.N)); if (hasShin) rockTex(c, limbPath(g.N, towards(g.N, foot, 0.5), foot, w1, (w1 + w2) / 2, w2), ...box(g.N, foot)); }
    if (s.suit?.boot && !coat && hasShin) piece(towards(g.N, foot, 0.3), foot, w1 * 1.04, w2 * 1.04, s.suit.boot);
    if (!coat && s.longLegs && !FIRE_BODY) { if (!front) piece(g.H, g.N, 6, 5.5, shadeHex(col, 0.9)); if (hasShin) piece(g.N, foot, 5.5, 5, shadeHex(col, 0.9)); }
    if (!coat && !s.longLegs) { piece(g.H, towards(g.H, g.N, 0.72), 33 * rl, 31 * rl, K.shorts); piece(towards(g.H, g.N, 0.66), towards(g.H, g.N, 0.74), 31 * rl, 31 * rl, shadeHex(K.shorts, 0.78)); }
    if (!coat && front) {   // the knee towards the viewer, as on the seated Doom: a flat oval in two tones, the shin going back into its shadow
      const r = (s.longLegs ? 35 : 31) * rl * Math.min(1, g.b.fore) * (1 + 0.3 * g.b.fold * Math.min(1, (1 - q) / 0.34)), x = g.N[0], y = Math.min(g.N[1], SOLE_Y - r * 0.8 - 3);
      if (hasShin) piece(g.N, towards(g.N, foot, 0.42), w1, w1 * 0.97, clampTone(col, 0.76));
      ell(c, x, y, r + 3, r * 0.8 + 3, clampTone(col, 0.72)); ell(c, x, y - 3, r, r * 0.76, clampTone(col, 1.14)); if (ROCK) rockTex(c, `M${x - r},${y - 3} A${r},${r * 0.76} 0 1 0 ${x + r},${y - 3} A${r},${r * 0.76} 0 1 0 ${x - r},${y - 3} Z`, x - r - 8, y - r, x + r + 8, y + r);
    }
  };
  /** a coat over a knee: no shape of its own (an oval read as a button), only the cloth bending over it, a light arch and a dark fold under it */
  const drape = (g: L) => {
    if (g.b.fore < 0.3) return; const low = g.b.fold * Math.min(1, (1 - q) / 0.34), r = 52 * Math.min(1, g.b.fore) * (1 + 0.22 * low), x = g.N[0], y = Math.min(g.N[1], SOLE_Y - 34);
    if (low > 0.2) { ell(c, x, y - 2, r + 3, (r * 0.72 + 3), K.coatDark); ell(c, x, y - 6, r, r * 0.66, clampTone(K.coatLight, 1.14)); return; }   // a knee on the ground lifts the cloth into a round shape
    fillP(c, blade([x - r, y + 8], [x + r, y + 8], 11, 11), clampTone(K.coatLight, 1.22));
    fillP(c, blade([x - r * 0.9, y + 16], [x + r * 0.9, y + 16], -9, 9), K.coatDark);
  };
  /** the arms going down to the ground, in the card's own space: from where the spec holds them to straight arms just outside the shoulders, the hand flat, fingers spread, thumb inward */
  const base = () => c.getTransform();
  const plantedArms = (home: DOMMatrix) => {
    const keep = c.getTransform(); c.setTransform(home); const t = P.plant, sleeve = coat ? K.coatLight : K.shirt, edge = coat ? K.coatDark : K.shirtEdge, rim = coat ? K.coatDark : K.shirtRim;   // on a coat the arm is the coat's colour: a dark edge keeps it apart from the body
    if (t > 0.15) {   // the shoulders seen from the front of a body on all fours: one band behind the head, joining the two arms
      const y = 945 + (1 - t) * 40, h = 34 * t, x0 = 272 - 172 * t - 92 * (1 - t), x1 = 544 - x0;
      fillP(c, poly([[x0, y - h], [x1, y - h], [x1, y + h], [x0, y + h]]), sleeve);
    }
    (['L', 'R'] as const).forEach((sd) => {
      const p = armAt(sd), a = ARM[sd], o = sd === 'L' ? -1 : 1, len = p.len ?? 1, t1 = a.k * p.sh * RAD, t2 = t1 + a.k * (p.el ?? 0) * RAD;
      const b0: Pt = [a.x, SH_Y + S], e0b: Pt = [b0[0] - UP * len * Math.sin(t1), b0[1] + UP * len * Math.cos(t1)], w0b: Pt = [e0b[0] - FORE * len * Math.sin(t2), e0b[1] + FORE * len * Math.cos(t2)];
      const s0 = us.pt(b0[0], b0[1]), e0 = us.pt(e0b[0], e0b[1]), w0 = us.pt(w0b[0], w0b[1]), sT: Pt = [272 + o * 172, Math.min(s0[1], 945)], wT: Pt = [272 + o * 186, SOLE_Y - 72], eT = towards(sT, wT, 0.5);   // the shoulders stand clear of the big head
      const A0 = towards(s0, sT, t), E = towards(e0, eT, t), W = towards(w0, wT, t), rot = (u: Pt, v: Pt) => Math.atan2(-(v[0] - u[0]), v[1] - u[1]), fl = Math.hypot(W[0] - E[0], W[1] - E[1]);
      let h0 = us.a + t2 + a.k * (p.wrist ?? 0) * RAD; h0 = Math.atan2(Math.sin(h0), Math.cos(h0));
      c.save(); c.translate(A0[0], A0[1]); c.rotate(rot(A0, E)); const ul = Math.hypot(E[0] - A0[0], E[1] - A0[1]); if (ROCK?.arm) c.scale(ROCK.arm, 1); if (rim) seg(c, 0, 0, 0, ul, 70, rim); seg(c, 0, 0, 0, ul, 64, sleeve); if (ROCK || SHEEN) armLook(c, ul, 32); c.restore();
      c.save(); c.translate(W[0], W[1]); c.rotate(h0 * (1 - t)); if (ROCK?.fist) c.scale(ROCK.fist, ROCK.fist); if (t > 0.5) flatHand(c, -a.out); else { c.scale(1.12, 1.12 - 0.52 * t); hand(c, p.hand ?? 'relaxed', a.out); } c.restore();
      const d = `M-33,0 Q-36,-34 0,-34 Q36,-34 33,0 L43,${fl - 6} Q43,${fl + 8} 30,${fl + 8} L-30,${fl + 8} Q-43,${fl + 8} -43,${fl - 6} Z`;
      c.save(); c.translate(E[0], E[1]); c.rotate(rot(E, W)); if (ROCK?.arm) c.scale(ROCK.arm, 1); if (rim) strokeP(c, d, rim, 6); fillP(c, d, sleeve); if (ROCK || SHEEN) armLook(c, fl, 36, d); seg(c, -41, fl - 12, 41, fl - 12, 3, edge, 'butt'); if (GLOVE) { c.fillStyle = GLOVE.a; c.beginPath(); c.roundRect(-45, fl - 18, 90, 28, 8); c.fill(); } c.restore();
    });
    c.setTransform(keep);
  };
  c.save();
  if (P.roll) { c.translate(P.rollX, rollDrop(P.roll, coat) - (P.cardUp ?? 0)); c.translate(272, 960); c.rotate(P.roll * RAD); c.translate(-272, -960); }
  if (s.cape && !back) { if ((P.hanh ?? 0) > 0) up(c, us, () => capeWind(c, P, (s.capeT ?? 0) * 0.34 + (s.sway ?? 0) * 0.2, {main: s.cape!.color, dark: s.cape!.dark ?? shadeHex(s.cape!.color, 0.72), light: shadeHex(s.cape!.color, 1.16), inner: s.cape!.dark ?? shadeHex(s.cape!.color, 0.72)}, 150, 394, 574)); else capeBehind(c, s, us, S, q); }
  legs.forEach((g) => { if (g.b.fold > 0.5) shoe(g); });                                       // a folded leg: the shoe lies behind the knee
  legs.forEach((g) => { if (coat || g.b.fore < 0.4) { leg(g); if (g.b.fold <= 0.5) shoe(g); } });
  if (P.roll < -45 && !P.hanh) legs.forEach(shoe);                                                        // lying, both toes point the same way: no leg may cover the other's shoe
  const home = base();
  if (coat) {
    const hemK = (1066 + P.hem - (520 + P.drop + S)) / 546;
    coatTop(us, Math.abs(hemK - 1) < 1e-6 ? 1 : hemK, {shift: S, spread: P.spread, noArms: planted, beforeHead: back ? undefined : () => { const keep = c.getTransform(); c.setTransform(home); legs.forEach(drape); c.setTransform(keep); if (planted) plantedArms(home); }});
    if (back && planted) plantedArms(home);
  } else {
    const flat = q < 0.999 || planted, hid = (p?: ArmPose): ArmPose | undefined => (p ? {...p, front: true} : p);   // the arms are drawn after the legs; here they would be squashed with the trunk
    up(c, us, () => {
      c.save(); if (q < 0.999) { c.translate(0, 960); c.scale(1, q); c.translate(0, -960); }
      vestUpper(c, {...s, skirt: undefined, ...(flat ? {armL: hid(s.armL), armR: hid(s.armR)} : {})}, back);
      c.restore();
      if (s.skirt && !back) { const y0 = 960 - 102 * q, hk = Math.max(0.3, (Math.min(1192, 1150 + P.hem) - (y0 + P.drop)) / 292); c.save(); c.translate(0, y0); c.scale(1, hk); c.translate(0, -858); chestExtras(c, {skirt: s.skirt} as Spec); c.restore(); }
      c.save(); if (q < 0.999) { c.translate(0, 960); c.scale(1, q); c.translate(0, -960); }
      if (!back) chestExtras(c, {...s, skirt: undefined}); else runAddOns(c, s, 'rearPosed');
      c.restore();
    });
    legs.forEach((g) => { if (g.b.fore >= 0.4) { leg(g); if (g.b.fold <= 0.5) shoe(g); } });   // the thighs lie over the hem; the arms and the hands then lie over the thighs
    if (planted) plantedArms(home);
    up(c, us, () => {
      if (S) c.translate(0, S);
      if (!planted) (['L', 'R'] as const).forEach((sd) => { const p = armAt(sd); if (!p.front) arm(c, sd, p, K.shirt, K.shirtEdge, K.shirtRim); });
      vestRest(planted);
    });
  }
  c.restore();
};

/** Draws one figure in mould units. The caller sets the transform (see BOX). Snow, if any, is laid over the finished figure. */
export const drawFigure = (c: C, s: Spec) => {
  if (s.flame) { drawFlaming(c, s); if (s.rim) applyRim(c, s.rim); return; }
  const broad = s.outfit !== 'doom' ? s.broad ?? 1 : 1, tall = s.rock?.tall ?? 1;
  if (tall !== 1) { c.save(); c.translate(272, SOLE_Y); c.scale(tall, tall); c.translate(-272, -SOLE_Y); }
  if (broad !== 1) { c.save(); c.translate(272, 0); c.scale(broad, 1); c.translate(-272, 0); }
  drawFigureBase(c, s);
  if (broad !== 1) c.restore();
  if (tall !== 1) c.restore();
  if (s.dust) applyDust(c, s.dust);
  if (s.rim) applyRim(c, s.rim);
  const n = Math.max(0, Math.min(1, s.snow ?? 0));
  if (n <= 0 || s.outfit === 'doom') return;
  const k = s.headK ?? (s.build === 'adult' ? 0.8 : 1), top = 548 - (548 - (s.hair === 'bald' ? 90 : HAIR_TOP)) * k, hx = 272 + (s.head?.dx ?? 0);
  const Pz = s.posture !== undefined ? resolvePosture(s.posture) : null, sS = Pz ? 412 * (1 - Pz.squash) + Pz.drop : 0, sH = sS + (Pz?.sink ?? 0), topY = s.bandage ? 548 - (548 - 86) * k : top;
  c.save(); c.globalCompositeOperation = 'source-atop';
  if (Pz?.roll) { c.translate(Pz.rollX, rollDrop(Pz.roll, s.outfit === 'coat')); c.translate(272, 960); c.rotate(Pz.roll * RAD); c.translate(-272, -960); }
  const cap = (x: number, y: number, rx: number, ry: number) => { const g = c.createRadialGradient(x, y, 2, x, y, Math.max(rx, ry)); g.addColorStop(0, `rgba(250,252,255,${0.98 * n})`); g.addColorStop(0.6, `rgba(240,245,252,${0.9 * n})`); g.addColorStop(1, 'rgba(235,242,250,0)'); c.save(); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - rx, y - rx, rx * 2, rx * 2); c.restore(); };
  cap(hx, topY + 6 + sH, 230 * k, 90 * k * (0.6 + 0.4 * n)); const pl = Pz?.plant ?? 0, shY = 588 + sS + (915 - (588 + sS)) * pl, shO = 104 + 68 * pl, shR = 86 - 30 * pl; cap(272 - shO, shY, shR, 34); cap(272 + shO, shY, shR, 34);
  c.restore();
};

/** Paints a figure into a canvas sized BOX * scale and returns it. */
export const paint = (canvas: HTMLCanvasElement, s: Spec, scale: number) => {
  const B = boxOf(s), w = Math.round(B.w * scale), h = Math.round(B.h * scale);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const c = canvas.getContext('2d')!;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h); c.setTransform(scale, 0, 0, scale, -B.x * scale, -B.y * scale);
  drawFigure(c, s);
  return canvas;
};

/** A forearm and hand on their own, in the mould's drawing, for a hand that comes in from the edge of the frame (mould/BanTayRoi.tsx).
 *  The wrist is at (0, 0), the hand hangs down from it, the forearm runs up `len` units. bare = skin; otherwise the figure's own sleeve and cuff. */
export type LooseArm = {hand?: Hand; len?: number; wrist?: number; bare?: boolean; out?: 1 | -1;
  /** (23/11/2026) Doom's steel gauntlet and armoured forearm, in the colours of the spec's palette (plate, armour, plateLine) */
  gauntlet?: boolean};
export const looseArmBox = (len = 900) => ({x: -130, y: -len - 10, w: 260, h: len + 190});
export const paintLooseArm = (canvas: HTMLCanvasElement, s: Spec, a: LooseArm, scale: number) => {
  const len = a.len ?? 900, B = looseArmBox(len), w = Math.round(B.w * scale), h = Math.round(B.h * scale);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const c = canvas.getContext('2d')!;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h); c.setTransform(scale, 0, 0, scale, -B.x * scale, -B.y * scale);
  K = {...K0, ...(s.palette ?? {})}; if (s.palette?.skinB && !s.palette.skin) K.skin = s.palette.skinB;
  GLOVE = null; ROCK = null; SHEEN = null;
  if (a.gauntlet) {
    const kind = a.hand ?? 'open', keep = {skin: K.skin, skinDark: K.skinDark}; K.skin = K.plate; K.skinDark = K.plateLine;
    c.save(); c.rotate(((a.wrist ?? 0) * Math.PI) / 180); c.scale(1.4, 1.14); hand(c, kind, a.out ?? 1);
    if (kind === 'relaxed' || kind === 'fist' || kind === 'grip') { seg(c, -27, 15, 27, 15, 3, K.plateLine, 'butt'); seg(c, -28, 36, 28, 36, 2.5, K.plateLine, 'butt'); ell(c, -17, 26, 3, 3, K.plateLine); ell(c, 17, 26, 3, 3, K.plateLine); }
    else if (kind === 'open' || kind === 'back') {   // a steel plate over the back of the hand and a joint across each finger: an open gauntlet must not read as a grey bare hand
      fillP(c, 'M-27,8 L27,8 L30,40 L-30,40 Z', K.armour); strokeP(c, 'M-27,8 L27,8 L30,40 L-30,40 Z', K.plateLine, 2.5); ell(c, -17, 24, 3, 3, K.plateLine); ell(c, 17, 24, 3, 3, K.plateLine);
      [-33, -11, 11, 33].forEach((deg) => { const r = (deg * Math.PI) / 180, px = Math.sin(r), py = Math.cos(r), at = 34 + 44 * py, ax = px * 44; seg(c, ax - py * 8, at + px * 8, ax + py * 8, at - px * 8, 2.5, K.plateLine, 'butt'); });
    }
    c.restore(); K.skin = keep.skin; K.skinDark = keep.skinDark;
    const d = `M-52,${-len} L52,${-len} L43,-4 Q42,12 0,12 Q-42,12 -43,-4 Z`;
    strokeP(c, d, K.armour, 5); fillP(c, d, K.plate); fillP(c, `M20,${-len} L52,${-len} L43,-4 L24,-4 Z`, 'rgba(112,118,126,0.22)');
    for (let y = -130; y > -len; y -= 150) { seg(c, -49, y, 49, y + 8, 3, K.plateLine, 'butt'); ell(c, -36, y + 18, 4, 4, K.plateLine); ell(c, 36, y + 22, 4, 4, K.plateLine); }   // the bands of the armoured forearm
    fillP(c, 'M-44,-24 Q0,-14 44,-24 L42,-2 Q0,8 -42,-2 Z', K.armour); strokeP(c, 'M-44,-24 Q0,-14 44,-24', K.plateLine, 3, 'butt');
    return canvas;
  }
  c.save(); c.rotate(((a.wrist ?? 0) * Math.PI) / 180); c.scale(1.12, 1.12); hand(c, a.hand ?? 'open', a.out ?? 1); c.restore();
  if (a.bare) { fillP(c, `M-30,${-len} L30,${-len} L27,6 L-27,6 Z`, K.skin); fillP(c, `M12,${-len} L30,${-len} L27,6 L14,6 Z`, K.skinDark); seg(c, -26, -8, 26, -8, 3, K.skinDark, 'butt'); return canvas; }
  const coat = s.outfit === 'coat', sleeve = coat ? K.coatLight : K.shirt, edge = coat ? K.coatDark : K.shirtEdge, d = `M-36,${-len} L36,${-len} L43,-6 Q43,8 30,8 L-30,8 Q-43,8 -43,-6 Z`;
  if (!coat) strokeP(c, d, K.shirtRim, 6);
  fillP(c, d, sleeve); fillP(c, `M14,${-len} L36,${-len} L43,-6 L20,-6 Z`, edge); seg(c, -41, -12, 41, -12, 3, edge, 'butt');
  return canvas;
};

/** Where the head really is, as shares of the figure's nominal height (soles to the top of a child's hair): an adult's head
 *  is drawn at 0.8 about the chin and a bald head ends at the skull, so both stand lower than the nominal height.
 *  The camera frames medium and close shots from this, not from the nominal height. */
export const headSpan = (s: Pick<Spec, 'build' | 'hair' | 'headK'>) => { const k = s.headK ?? (s.build === 'adult' ? 0.8 : 1), top = 548 - (548 - (s.hair === 'bald' ? 90 : HAIR_TOP)) * k, n = SOLE_Y - HAIR_TOP; return {top: (SOLE_Y - top) / n, size: (548 - top) / n}; };
