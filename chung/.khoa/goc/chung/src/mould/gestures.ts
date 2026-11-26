import type {ArmPose, Spec, Expr} from './draw';
import type {Key} from './act';
import {EXPR} from './expr';
import type {PostureName} from './dang';

/** mould/gestures: NAMED acting at full size, so a scene is written as beats ("greet", "lean in", "shock") and not as
 *  angles. Sources: the arm poses counted on the reference (hang 69, bent low 38, raised open 36, crossed 29, reach 20,
 *  chest 17, chin 14, hip 13, point 5 of 260 arms) and the cadence measurement (tools/cadence.py: a figure in the
 *  reference shows a new drawing on about half of all frames, and each change moves about 8 % of the acting area; our
 *  first sequence managed 15 % and 3.6 %). */
const A = {
  hang: {sh: 6, el: 0, wrist: 0, hand: 'relaxed'}, low: {sh: 22, el: 46, wrist: 0, hand: 'open'}, out: {sh: 62, el: 26, wrist: 0, hand: 'open'},
  up: {sh: 74, el: 96, wrist: 0, hand: 'open'}, high: {sh: 126, el: 36, wrist: 0, hand: 'open'}, hip: {sh: 38, el: -78, wrist: 0, hand: 'fist'},
  chest: {sh: 24, el: -142, wrist: 0, hand: 'open'}, chin: {sh: 14, el: -164, wrist: 0, hand: 'fist'}, point: {sh: 64, el: 58, wrist: 0, hand: 'point'},
  pointUp: {sh: 104, el: 48, wrist: 0, hand: 'point'}, fistUp: {sh: 84, el: 102, wrist: 0, hand: 'fist'}, cross: {sh: 26, el: -114, wrist: 0, hand: 'edge'},
  present: {sh: 48, el: 52, wrist: 0, hand: 'open'}, shrug: {sh: 40, el: 112, wrist: 0, hand: 'open'}, cup: {sh: 30, el: 70, wrist: 0, hand: 'cup'},
  // 23/11/2026, long arms (`len`): a hand above the head, a hand on a board at shoulder height, a hand flat on the ground (body in `posture: 'fall'`), a hand on the thigh (seated)
  reachUp: {sh: 150, el: 8, wrist: 0, hand: 'open', len: 2.3}, reachBoard: {sh: 112, el: 8, wrist: 0, hand: 'point', len: 1.6},
  prop: {sh: 14, el: 0, wrist: 0, hand: 'open'}, knee: {sh: 10, el: -12, wrist: 0, hand: 'relaxed'},
} satisfies Record<string, ArmPose>;
/** TAY CỦA DÁNG ĐÁNH NHAU (23/11/2026), viết cho người hướng về BÊN PHẢI: `armR` là tay ra đòn. `show` để áo `coat` hiện tay; `dai` kéo dài tay ngắn của Doom. */
const F = (sh: number, el: number, hand: ArmPose['hand'], o: Partial<ArmPose> = {}): ArmPose => ({sh, el, wrist: 0, hand, show: true, dai: 1.42, ...o});
const FA = {
  damThang: F(102, 0, 'fist'), coVe: F(30, -128, 'fist'), laoToi: F(118, 0, 'fist'), laoSau: F(58, 26, 'fist'),
  nhayTruoc: F(112, 14, 'fist'), nhaySau: F(98, 34, 'fist'), neTruoc: F(58, 74, 'open'), neSau: F(26, -118, 'fist'),
  hatA: F(132, 22, 'open'), hatB: F(112, 34, 'open'), doL: F(44, -136, 'fist', {front: true}), doR: F(50, -140, 'fist', {front: true}),
  banThang: F(96, 0, 'open', {wrist: -14}), banSau: F(24, -96, 'fist'), banCheo: F(-84, 0, 'open', {front: true, wrist: 14, len: 1.55, dai: 2.1}),
  bayTruoc: F(166, 0, 'fist'), bayDoc: F(16, 8, 'relaxed'),
  benCao: F(146, 20, 'fist'), benChan: F(52, 44, 'fist'), benDap: F(62, 10, 'fist'), benSau: F(46, 34, 'fist'),
  reedGian: {sh: 100, el: 0, wrist: 0, hand: 'fist', show: true, stretch: 2.6, bow: 18} as ArmPose,
  khienR: F(98, 0, 'open', {wrist: -22}), khienL: F(-80, 4, 'open', {front: true, wrist: 22, len: 1.55, dai: 2.1}),
} satisfies Record<string, ArmPose>;
/** both arms at once: [left, right] of the figure as drawn (a mirrored figure swaps them) */
export const POSES = {
  idle: [A.hang, A.hang], greet: [A.hang, A.up], wave: [A.hang, A.high], present: [A.hang, A.present], offer: [A.low, A.low], open: [A.out, A.out],
  cheer: [A.high, A.high], hips: [A.hip, A.hip], akimbo: [A.hip, A.hang], chest: [A.hang, A.chest], think: [A.hip, A.chin], cross: [A.cross, A.cross],
  point: [A.hang, A.point], pointUp: [A.hip, A.pointUp], scold: [A.hip, A.pointUp], fist: [A.hang, A.fistUp], fists: [A.fistUp, A.fistUp], shrug: [A.shrug, A.shrug],
  explain: [A.low, A.present], hold: [A.cup, A.cup], gasp: [A.chest, A.chest],
  reachUp: [A.hang, A.reachUp], reachBoard: [A.hang, A.reachBoard], prop: [A.prop, A.prop], knees: [A.knee, A.knee],
  // dáng đánh nhau: đi với `posture` cùng tên (bảng DANG bên dưới)
  dam: [FA.coVe, FA.damThang], lao: [FA.laoSau, FA.laoToi], nhay: [FA.nhaySau, FA.nhayTruoc], ne: [FA.neSau, FA.neTruoc], hat: [FA.hatA, FA.hatB], chongDo: [FA.doL, FA.doR],
  banTia: [FA.banSau, FA.banThang], banTia2: [FA.banCheo, FA.banThang], bay: [FA.bayDoc, FA.bayTruoc], benVung: [FA.benChan, FA.benCao], benDap: [FA.benSau, FA.benDap], reedDam: [FA.coVe, FA.reedGian], sueKhien: [FA.khienL, FA.khienR],
} satisfies Record<string, [ArmPose, ArmPose]>;
export type PoseName = keyof typeof POSES;
/** DÁNG ĐÁNH NHAU (23/11/2026): một tên = dáng thân + hai tay + đầu. Mọi dáng hướng về bên PHẢI khung; hướng trái thì `flip` (Puppet3). `withDang` cho ảnh tĩnh, `dangKey` cho `act`. */
export const DANG = {
  dam: {posture: 'dam', pose: 'dam', head: {dy: 8, rot: -5}}, lao: {posture: 'lao', pose: 'lao', head: {dy: 14, rot: -14}}, nhay: {posture: 'nhay', pose: 'nhay', head: {dy: -4, rot: -4}},
  ne: {posture: 'ne', pose: 'ne', head: {dy: 6, rot: 10}}, hat: {posture: 'hat', pose: 'hat', head: {dy: -8, rot: 8}}, chongDo: {posture: 'chongDo', pose: 'chongDo', head: {dy: 16, rot: 0}},
  banTia: {posture: 'ban', pose: 'banTia', head: {dy: 2, rot: -3}}, banTia2: {posture: 'ban', pose: 'banTia2', head: {dy: 4, rot: -3}}, bay: {posture: 'bay', pose: 'bay', head: {dy: 0, rot: 0}}, bayChui: {posture: 'bayChui', pose: 'bay', head: {dy: 0, rot: 0}},
  benVung: {posture: 'benVung', pose: 'benVung', head: {dy: -6, rot: 7}}, benDap: {posture: 'benDap', pose: 'benDap', head: {dy: 12, rot: -10}},
  reedDam: {posture: 'dam', pose: 'reedDam', head: {dy: 6, rot: -4}}, sueKhien: {posture: 'ban', pose: 'sueKhien', head: {dy: 4, rot: -3}},
} satisfies Record<string, {posture: PostureName; pose: PoseName; head: {dy: number; rot: number}}>;
export type DangName = keyof typeof DANG;
/** đặt người vào một dáng đánh nhau (ảnh tĩnh, hoặc hình xuất phát của `act`) */
export const withDang = (s: Spec, d: DangName): Spec => { const g = DANG[d], [l, r] = POSES[g.pose]; return {...s, posture: g.posture, armL: {...l}, armR: {...r}, head: {...s.head, ...g.head}}; };
/** một nhịp của `act` đưa người tới dáng đó. `fast: true` cho cú ra đòn: tới nơi trong `inb` hình (mặc định 1) */
export const dangKey = (f: number, d: DangName, o: Partial<Key> = {}): Key => { const g = DANG[d], [l, r] = POSES[g.pose]; return {f, posture: g.posture, armL: {...l}, armR: {...r}, head: {...g.head}, ...o}; };

/** whole-body moves. Sideways ones take the direction from `dir` (1 = screen right, -1 = left). */
export const BODY_MOVES = ['leanIn', 'leanBack', 'upright', 'bounce', 'dip', 'shift', 'step', 'walk', 'hop', 'recoil', 'slump', 'shiver'] as const;
export type BodyMove = (typeof BODY_MOVES)[number];

export type Beat = {
  f: number;                       // frame the beat lands on (rounded to twos)
  pose?: PoseName; face?: keyof typeof EXPR; look?: [number, number];
  body?: BodyMove; dir?: 1 | -1;
  dist?: number; over?: number;    // walk: how far (mould units; a figure is 1191 tall) and over how many frames
  say?: number;                    // talk for this many frames from f (mouth cycles, head bobs with the words)
  big?: boolean;                   // a large change: one more in-between, a stronger accent
  posture?: PostureName;           // (23/11/2026) sit, kneel, buckle, fall, lie, stand: the body goes there on one drawing
  resetLid?: boolean;              // (23/11/2026) with `face`: start from clean lids
};
const RESET = {lidL: undefined, lidR: undefined, lower: undefined, lowerAmt: undefined, browY: undefined, pupil: undefined, blank: undefined, closed: undefined} as Partial<Expr>;
const even = (f: number) => f - (f % 2);

/** Density rule (LUAT-CUTOUT3D-v3 A2, measured holds of 10-27 frames): a SPEAKER gets a new beat at least every 24
 *  frames, a LISTENER at least every 48. Returns the gaps that break it. */
export const lintBeats = (beats: Beat[], len: number, role: 'speaker' | 'listener' = 'speaker', from = 0) => {
  const max = role === 'speaker' ? 24 : 48, fs = [from, ...beats.map((b) => b.f).filter((f) => f >= from && f < from + len).sort((a, b) => a - b), from + len], bad: string[] = [];
  for (let i = 1; i < fs.length; i++) if (fs[i] - fs[i - 1] > max) bad.push(`${fs[i - 1]}-${fs[i]}`);
  return bad;
};

/** Turns beats into the keys mould/act plays. Every beat that changes the pose also gets, automatically:
 *  an in-between (two for a big change; the first is drawn as a smear by act), a small nod of the head on the same frame,
 *  an overshoot of the wrist and a settle 4 and 8 frames later, and a hand that re-angles once more while it is held. */
export const perform = (beats: Beat[], o: {dirDefault?: 1 | -1; mirror?: boolean} = {}): Key[] => {
  const K = new Map<number, Key>(), put = (f: number, k: Partial<Key>) => { const e = even(Math.max(0, f)), cur = K.get(e) ?? {f: e}; K.set(e, {...cur, ...k, expr: {...cur.expr, ...k.expr}, head: {...cur.head, ...k.head}, armL: k.armL || cur.armL ? {...cur.armL, ...k.armL} : undefined, armR: k.armR || cur.armR ? {...cur.armR, ...k.armR} : undefined, inb: Math.max(cur.inb ?? 0, k.inb ?? 0) || undefined}); };
  let x = 0, lean = 0, mouth: Expr['mouth'] = 'flat';
  [...beats].sort((a, b) => a.f - b.f).forEach((b) => {
    // dir is a SCREEN direction (1 = to screen right); a figure drawn mirrored moves and leans in its own, mirrored space
    const d = (b.dir ?? o.dirDefault ?? 1) * (o.mirror ? -1 : 1), acc = b.big ? 1.6 : 1;
    if (b.face) { const e = EXPR[b.face]; mouth = e.mouth; put(b.f, {expr: {...RESET, ...e, ...(b.look ? {gaze: b.look} : {})}}); }
    else if (b.look) put(b.f, {expr: {gaze: b.look}});
    if (b.pose) {
      const [l, r] = POSES[b.pose];
      put(b.f, {armL: {...l}, armR: {...r}, inb: b.big ? 2 : 1, head: {dy: 7 * acc}});
      put(b.f + 6, {armL: {wrist: 12 * acc}, armR: {wrist: -12 * acc}, head: {dy: -3}});          // overshoot
      put(b.f + 10, {armL: {wrist: 0}, armR: {wrist: 0}, head: {dy: 0}});                       // settle
    }
    if (b.posture) put(b.f, {posture: b.posture});
    if (b.resetLid) put(b.f, {resetLid: true});
    if (b.body) {
      if (b.body === 'leanIn') { lean = 4 * d; x += 16 * d; put(b.f, {lean, x, inb: 1}); }   // slight: the reference leans a torso by a few degrees over planted feet
      if (b.body === 'leanBack') { lean = -3.5 * d; x -= 12 * d; put(b.f, {lean, x, inb: 1}); }
      if (b.body === 'upright') { lean = 0; put(b.f, {lean, inb: 1}); }
      if (b.body === 'shift') { x += 26 * d; lean = -2 * d; put(b.f, {x, lean, inb: 1}); put(b.f + 8, {lean: 0}); lean = 0; }
      if (b.body === 'step') { x += 96 * d; put(b.f, {x, kick: 0.2}); }   // one step: the footwork in mould/act moves the feet
      if (b.body === 'walk') { x += (b.dist ?? 600) * d; put(b.f, {x, walk: b.over ?? Math.round((b.dist ?? 600) / 29)}); }   // 29 units a frame: the reference pace
      if (b.body === 'bounce') { put(b.f, {y: 26 * acc}); put(b.f + 2, {y: 12}); put(b.f + 4, {y: -8}); put(b.f + 6, {y: 0}); }
      if (b.body === 'hop') { put(b.f - 2, {y: -14}); put(b.f, {y: 46 * acc}); put(b.f + 4, {y: -12}); put(b.f + 6, {y: 0}); }
      if (b.body === 'dip') { put(b.f, {y: -20 * acc}); put(b.f + 4, {y: 0}); }
      if (b.body === 'recoil') { lean = -7 * d; x -= 40 * d; put(b.f, {lean, x, y: 14}); put(b.f + 4, {y: 0, lean: -4 * d}); lean = -4 * d; }
      if (b.body === 'shiver') { for (let i = 0; i < 8; i++) put(b.f + i * 2, {x: x + (i % 2 ? -9 : 9)}); put(b.f + 16, {x}); }   // cold or fear: a second of small fast shakes
      if (b.body === 'slump') { lean = 0; put(b.f, {y: -26, lean: 0, inb: 1, head: {dy: 18, rot: 4 * d}}); }
    }
    if (b.say) {
      const cyc: Expr['mouth'][] = mouth === 'down' ? ['aw', 'down', 'aw', 'flat'] : ['open', 'up', 'aw', 'up'];
      for (let i = 0; i * 4 < b.say; i++) put(b.f + i * 4, {expr: {mouth: cyc[i % cyc.length]}});
      put(b.f + b.say, {expr: {mouth}});
    }
  });
  return [...K.values()].sort((a, b) => a.f - b.f);
};
/** Start pose of a figure from a pose name (so the first frame already holds a gesture). */
export const withPose = (s: Spec, pose: PoseName): Spec => ({...s, armL: {...POSES[pose][0]}, armR: {...POSES[pose][1]}});
/** (station test, stage 2) The named poses are written for one side (point, greet, present: the figure's right arm, which
 *  reaches toward the side the figure faces). To gesture with the OTHER arm, behind the figure (point back over its
 *  shoulder at something it has its side to), swap the two arms of the keys in a frame range after perform(). */
export const swapArms = (keys: Key[], from: number, to: number): Key[] => keys.map((k) => (k.f >= from && k.f <= to && (k.armL || k.armR) ? {...k, armL: k.armR, armR: k.armL} : k));
