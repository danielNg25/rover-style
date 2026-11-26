import type {Spec, ArmPose, Expr, Leg} from './draw';
import {mixPosture, postureTravel} from './dang';
import type {Posture, PostureName} from './dang';

/** Pop-and-hold acting (LUAT-CUTOUT3D-v3 A1-7): poses change at key frames; arms, the head and the figure's position
 *  pass through in-between drawings, each held 2 frames (how many: see HOW LONG A MOVE TAKES below); faces switch in one frame;
 *  everything moves on twos.
 *  Hanging garments are not keyed: their hem follows the shoulders on a damped spring (see follow), which gives the
 *  trailing while the figure travels and the swing past rest when it stops that the reference shows.
 *  kick = an extra spread of the hem at that key (an arm thrown up, a sharp turn). */
export type Key = {f: number; inb?: number; expr?: Partial<Expr>; armL?: Partial<ArmPose>; armR?: Partial<ArmPose>; head?: Spec['head']; faceDy?: number; view?: Spec['view']; x?: number; y?: number; lean?: number; feet?: Spec['feet']; kick?: number;
  /** walk = this key's x is reached by WALKING over that many frames: the position is new on every frame, the legs step on twos */
  walk?: number;
  /** fast = a deliberate snap (a flick, a slap): only this key's own `inb`, no slowing by distance; a big swing smears on its first drawing */
  fast?: boolean;
  /** (23/11/2026) change the body's pose ('sit', 'kneel', 'buckle', 'fall', 'lie', 'stand'): it moves there through in-betweens of ONE drawing */
  posture?: PostureName | Posture;
  /** (23/11/2026) clear the lids, lower lid, brow height, pupil and blink left by the previous face before this key's `expr` (EXPR.shock after glare) */
  resetLid?: boolean};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixArm = (a: ArmPose | undefined, b: ArmPose | undefined, t: number): ArmPose | undefined =>
  !b ? a : !a ? b : {...b, sh: lerp(a.sh, b.sh, t), el: lerp(a.el ?? 0, b.el ?? 0, t), wrist: lerp(a.wrist ?? 0, b.wrist ?? 0, t), hand: t < 0.5 ? a.hand ?? b.hand : b.hand, show: a.show || b.show, ...(a.len !== undefined || b.len !== undefined ? {len: lerp(a.len ?? 1, b.len ?? 1, t)} : {}), ...(a.stretch !== undefined || b.stretch !== undefined ? {stretch: lerp(a.stretch ?? 1, b.stretch ?? 1, t)} : {}), ...(a.dai !== undefined || b.dai !== undefined ? {dai: lerp(a.dai ?? 1, b.dai ?? 1, t)} : {})};
const LID_CLEAR: Partial<Expr> = {lidL: undefined, lidR: undefined, lower: undefined, lowerAmt: undefined, browY: undefined, pupil: undefined, blank: undefined, closed: undefined, dazed: undefined};
const apply = (s: Spec, k: Key): Spec => ({
  ...s, ...(k.posture !== undefined ? {posture: k.posture} : {}), view: k.view ?? s.view, expr: {...s.expr, ...(k.resetLid ? LID_CLEAR : {}), ...k.expr}, faceDy: k.faceDy ?? s.faceDy, x: k.x ?? s.x, y: k.y ?? s.y, lean: k.lean ?? s.lean,
  head: {...s.head, ...k.head}, armL: k.armL ? {sh: 6, ...s.armL, ...k.armL} : s.armL, armR: k.armR ? {sh: 6, ...s.armR, ...k.armR} : s.armR,
});

/** HOW LONG A MOVE TAKES. Measured on the reference with the camera removed (tools/steps.py --stats, every third shot, 241
 *  moves that start and end inside their shot, 21/11/2026): a move lasts 11 frames at the median, 6 drawings held two frames
 *  each; a quarter last 6 frames or less, a quarter 16 or more. Ours popped through 1-2 in-betweens (median 6 frames), which
 *  Daniel saw as "cử động hơi nhanh quá". So the number of in-between drawings now comes from HOW FAR the part travels, a key's
 *  own `inb` can only add to it, and the spacing eases: quick away from the old pose, a long settle into the new one.
 *  `fast` on a key keeps a deliberate snap (a flick, a slap): only its own `inb`, and a smear on the first drawing of a big swing.
 *  Every part (each arm, the head, the body) runs its own move, so a mouth key in the middle of an arm move no longer cuts the
 *  arm short; a move is shortened only when the NEXT key for the same part comes before it could arrive. */
const armTravel = (a?: ArmPose, b?: ArmPose) => (a && b ? Math.abs(b.sh - a.sh) + Math.abs((b.el ?? 0) - (a.el ?? 0)) + 0.5 * Math.abs((b.wrist ?? 0) - (a.wrist ?? 0)) + 40 * Math.abs((b.stretch ?? 1) - (a.stretch ?? 1)) : 0);
const paceArm = (d: number) => (d < 8 ? 0 : Math.max(1, Math.min(6, Math.round(d / 26))));          // hang -> point (116 degrees): 4 in-betweens, 10 frames
const paceBody = (d: number) => (d < 3 ? 0 : Math.max(1, Math.min(4, Math.round(d / 8))));
const paceHead = (d: number) => (d < 3 ? 0 : Math.max(1, Math.min(3, Math.round(d / 7))));
const settle = (t: number) => 0.5 * t * t * (3 - 2 * t) + 0.5 * (1 - (1 - t) * (1 - t));
type Part = 'armL' | 'armR' | 'head' | 'body' | 'posture';
const sets = (k: Key, c: Part) => (c === 'posture' ? k.posture !== undefined : c === 'body' ? k.x !== undefined || k.y !== undefined || k.lean !== undefined : k[c] !== undefined);

const keyed = (base: Spec, keys: Key[], f: number): Spec => {
  const st: Spec[] = [base]; let n = 0;
  for (const k of keys) { if (k.f > f) break; st.push(apply(st[n], k)); n++; }
  const cur = st[n];
  if (!n) return cur;
  /** where the part is in its own move: the state before, the state after, how far along (1 = arrived), first drawing of a fast big swing */
  const at = (c: Part) => {
    let i = n - 1; while (i >= 0 && !sets(keys[i], c)) i--;
    if (i < 0) return null;
    const k = keys[i], a = st[i], b = st[i + 1], ha = a.head ?? {}, hb = b.head ?? {};
    const d = c === 'posture' ? postureTravel(a.posture, b.posture) : c === 'body' ? Math.abs((b.x ?? 0) - (a.x ?? 0)) / 9 + Math.abs((b.lean ?? 0) - (a.lean ?? 0)) * 5 + Math.abs((b.y ?? 0) - (a.y ?? 0)) / 5
      : c === 'head' ? Math.abs((hb.dy ?? 0) - (ha.dy ?? 0)) + Math.abs((hb.dx ?? 0) - (ha.dx ?? 0)) + 3 * Math.abs((hb.rot ?? 0) - (ha.rot ?? 0)) : armTravel(a[c as 'armL' | 'armR'], b[c as 'armL' | 'armR']);
    let m = k.fast ? k.inb ?? 1 : Math.max(k.inb ?? 0, c === 'body' ? (k.walk ? 0 : paceBody(d)) : c === 'head' ? paceHead(d) : c === 'posture' ? (d < 2 ? 0 : Math.max(3, Math.min(8, Math.round(d / 34)))) : paceArm(d));
    const nx = keys.slice(i + 1).find((q) => sets(q, c)); if (nx) m = Math.min(m, Math.max(0, Math.floor((nx.f - k.f) / 2) - 1));
    const step = (f - k.f) / 2 + 1;
    return step > m ? null : {a, b, t: k.fast ? step / (m + 1) : settle(step / (m + 1)), smear: !!k.fast && step === 1 && d > 60};
  };
  const L = at('armL'), R = at('armR'), H = at('head'), B = at('body'), out: Spec = {...cur};
  if (L) { const v = mixArm(L.a.armL, L.b.armL, L.t); out.armL = v && L.smear ? {...v, smear: true} : v; }
  if (R) { const v = mixArm(R.a.armR, R.b.armR, R.t); out.armR = v && R.smear ? {...v, smear: true} : v; }
  if (H) { const h0 = H.a.head ?? {}, h1 = H.b.head ?? {}; out.head = {...cur.head, dx: lerp(h0.dx ?? 0, h1.dx ?? 0, H.t), dy: lerp(h0.dy ?? 0, h1.dy ?? 0, H.t), rot: lerp(h0.rot ?? 0, h1.rot ?? 0, H.t)}; }
  if (cur.posture !== undefined) { const Q = at('posture'); if (Q) out.posture = mixPosture(Q.a.posture, Q.b.posture, Q.t); }
  if (B) { out.x = lerp(B.a.x ?? 0, B.b.x ?? 0, B.t); out.y = lerp(B.a.y ?? 0, B.b.y ?? 0, B.t); out.lean = lerp(B.a.lean ?? 0, B.b.lean ?? 0, B.t); }
  return out;
};

/** Hem follower, stepped on twos from the start of the shot: the hem chases the body with a spring, sway = hem - body. */
const follow = (base: Spec, keys: Key[], f: number) => {
  let h = base.x ?? 0, v = 0, flare = 0, sway = 0;
  for (let t = 0; t <= f; t += 2) {
    const b = keyed(base, keys, t).x ?? 0;
    h += v; v = (v + 0.6 * (b - h)) * 0.5; sway = h - b;
    flare *= 0.55; for (const k of keys) if (k.kick && k.f >= t && k.f < t + 2) flare += k.kick;
  }
  // a hanging hem is never quite still: a slow drift of a few units, also on twos
  return {sway: sway + Math.sin(f * 0.11) * 4, flare: flare + Math.min(0.25, Math.abs(sway) / 160)};
};

/** Where the body wants to be at a frame: the keyed x, or, inside a walk, a straight run from the last place to the key's. */
const targetX = (base: Spec, keys: Key[], frame: number) => {
  let prev = base.x ?? 0;
  for (const k of keys) { if (k.f > frame) break; if (k.x === undefined) continue; if (k.walk && frame < k.f + k.walk) return prev + ((k.x - prev) * (frame - k.f)) / k.walk; prev = k.x; }
  return keyed(base, keys, frame - (frame % 2)).x ?? 0;
};
const walking = (keys: Key[], frame: number) => keys.some((k) => k.walk && k.x !== undefined && frame >= k.f && frame < k.f + k.walk);
/** FOOTWORK. Measured by eye on the reference (shots 89, 104, 106, 457, 502): a standing figure keeps both feet exactly where
 *  they are while the torso shifts its weight; when the body travels, the legs take steps drawn on twos, one foot at a time
 *  (lifted, passing, planted: about 6 frames a step), the body tips a few degrees over the standing leg and rises a little.
 *  So the feet are simulated from the first frame: each foot stays put until the body has moved too far from it, then steps
 *  to where the body will be when it lands. For a single step the body follows 4 frames late, so the foot goes out FIRST. */
const STANCE = 50, REACH = 34, LAG = 4;
const footwork = (base: Spec, keys: Key[], f: number) => {
  const T = (t: number) => targetX(base, keys, Math.max(0, t));
  let b = T(0), L = b - STANCE, R = b + STANCE, air: {side: 'L' | 'R'; from: number; to: number; n: number} | null = null;
  let pl = {x: L, lift: 0, toe: 0}, pr = {x: R, lift: 0, toe: 0}, tilt = 0, bob = 0, hip = 0, rel = false;
  let walked = false;
  for (let t = 0; t <= f; t += 2) {
    const was = b; b = T(t); const v = (b - was) / 2;
    pl = {x: L, lift: 0, toe: 0}; pr = {x: R, lift: 0, toe: 0}; tilt = 0; bob = 0; hip = 0; rel = false;
    const wk = keys.find((q) => q.walk && q.x !== undefined && t >= q.f && t < q.f + q.walk);
    if (wk) {
      // WALKING (reference shots 460 and 502, close-ups of the legs over 12 consecutive frames each): the legs stay straight and
      // upright UNDER the body; a step is one foot drawn straight UP by about a tenth of the leg (the leg gets shorter, the shoe
      // stays flat) for one drawing, then down; then the other foot. Nothing swings sideways and the feet never cross.
      // The body tips a little over the standing leg and rises with each lift. A cycle is 8 frames.
      const k = T(t + 2) - b >= 0 ? 1 : -1, ph = Math.floor((t - wk.f) / 2) % 4;
      const lead = [{x: 3, lift: 27, toe: 0}, {x: 0, lift: 0, toe: 0}, {x: 0, lift: 0, toe: 0}, {x: 0, lift: 0, toe: 0}][ph], trail = [{x: 0, lift: 0, toe: 0}, {x: 0, lift: 0, toe: 0}, {x: 3, lift: 27, toe: 0}, {x: 0, lift: 0, toe: 0}][ph];
      L = b - STANCE; R = b + STANCE; air = null; rel = true;
      const pLead = {x: (k > 0 ? R : L) + k * lead.x, lift: lead.lift, toe: lead.toe}, pTrail = {x: (k > 0 ? L : R) + k * trail.x, lift: trail.lift, toe: trail.toe};
      pl = k > 0 ? pTrail : pLead; pr = k > 0 ? pLead : pTrail; tilt = [-2.4, 0, 2.4, 0][ph] * k; bob = [5, 0, 5, 0][ph]; hip = [-6, 0, 6, 0][ph] * k;
      walked = true;
      continue;
    }
    // the walk has just ended: the feet ARRIVE with the body. (They used to stay where the last walking drawing left them, two
    // frames of travel behind, so the figure stumbled into two extra settling steps at every stop.)
    if (walked) { walked = false; L = b - STANCE; R = b + STANCE; air = null; pl = {x: L, lift: 0, toe: 0}; pr = {x: R, lift: 0, toe: 0}; }
    if (air) {
      air.n++;
      const k = air.side === 'L' ? -1 : 1;
      if (air.n < 3) air.to = b + k * STANCE + v * (3 + (3 - air.n) * 2);   // lands ahead of a body that keeps walking
      const at = air.n === 1 ? air.from + (air.to - air.from) * 0.4 : air.n === 2 ? air.from + (air.to - air.from) * 0.85 : air.to;
      const o = {x: at, lift: air.n === 1 ? 30 : air.n === 2 ? 14 : 0, toe: air.n === 1 ? -8 : air.n === 2 ? 14 : 0};
      if (air.side === 'L') pl = o; else pr = o;
      if (air.n < 3) { tilt = -k * 2.4; hip = -k * 9; bob = air.n === 2 ? 9 : 5; }   // over the standing leg, and a little up
      else { if (air.side === 'L') L = air.to; else R = air.to; air = null; }
    }
    if (!air) {
      const eL = b - STANCE - L, eR = b + STANCE - R;
      if (Math.max(Math.abs(eL), Math.abs(eR)) > REACH) {
        // the foot that is further from its place goes; when both are as far, the one on the side the body travels to
        const side = Math.abs(Math.abs(eL) - Math.abs(eR)) < 8 ? (eL + eR > 0 ? 'R' : 'L') : Math.abs(eL) > Math.abs(eR) ? 'L' : 'R';
        air = {side, from: side === 'L' ? L : R, to: b + (side === 'L' ? -STANCE : STANCE) + v * 9, n: 0};
      }
    }
  }
  return {pl, pr, tilt, bob, hip, rel, b};
};

/** Measured on the reference with the camera removed (tools/cadence.py, 212 shots): in the acting area a new drawing
 *  appears on about HALF of all frames. Part of that is a MOVING HOLD: a slow, small drift of the head, the upper body and
 *  the arms that steps on twos under the keyed acting, a little livelier while the mouth is open. It is deliberately small
 *  and it never moves the feet: the first version slid the whole figure sideways (skating) and hopped it while talking,
 *  which read as too much movement. The life of a shot comes from its beats, not from this.
 *  live = strength (1 = standard, 0 = off); seed = a different rhythm per character. */
export const act = (base: Spec, keys: Key[], frame: number, o: {live?: number; seed?: number} = {}): Spec => {
  const f = frame - (frame % 2), s = {...keyed(base, keys, f), ...follow(base, keys, f)}, L = o.live ?? 1, q = (o.seed ?? 1) * 1.7;
  // the body is where the target was LAG frames ago (on every frame during a walk); the feet are where the footwork left them
  // (only for a single step or a shift: in a walk the body keeps pace with the feet, or it would trail far behind them)
  const lag = walking(keys, frame) || walking(keys, frame - LAG) ? 0 : LAG, x = targetX(base, keys, Math.max(0, frame - lag)), fw = footwork(base, keys, f);
  // standing: the feet are pinned to the ground, so they are placed against where the body is on this very frame; walking: against the body they travel with
  const leg = (p: {x: number; lift: number; toe: number}, k: number): Leg => ({dx: Math.round((p.x - ((fw.rel ? fw.b : x) + k * STANCE)) * 10) / 10, lift: p.lift, toe: p.toe});
  const talking = s.expr.mouth === 'aw' || s.expr.mouth === 'open' || s.expr.mouth === 'o', k = L * (talking ? 1.4 : 1), w = (a: number, sp: number, ph: number) => a * k * Math.sin(f * sp + ph + q);
  const h = s.head ?? {}, arm = (a: typeof s.armL, ph: number) => (a ? {...a, sh: a.sh + w(2.1, 0.23, ph), el: (a.el ?? 0) + w(3.6, 0.19, ph + 1), wrist: (a.wrist ?? 0) + w(4.8, 0.31, ph + 2)} : a);
  return {...s, x, hip: fw.hip + w(5, 0.1, 0.4), hipDy: fw.bob + (talking ? Math.max(0, w(3, 0.75, 0.3)) : 0), sway: (s.sway ?? 0) + w(3.6, 0.13, 2), lean: (s.lean ?? 0) + fw.tilt + w(0.8, 0.085, 1.7),
    head: {dx: (h.dx ?? 0) + w(4.2, 0.17, 1.1), dy: (h.dy ?? 0) + w(3, 0.24, 2.3) + (talking ? w(3.6, 0.8, 0) : 0), rot: (h.rot ?? 0) + w(1.9, 0.13, 0.7)},
    armL: arm(s.armL, 3.1), armR: arm(s.armR, 4.6), legL: leg(fw.pl, -1), legR: leg(fw.pr, 1)};
};

/** Blink, three recipes from the reference (v3 D18; about 54 / 55 / 15 shots):
 *  'half'  half-closed 2 frames, closed 2, half-closed 2 (default; wides and groups)
 *  'blank' closed 4 frames, then ONE frame of whites with no pupils, then open (medium and close shots)
 *  'swap'  closed 3 frames, no half-lid
 *  Pass the true frame (not the frame on twos): the blank-whites drawing lasts exactly one frame. */
export const blink = (s: Spec, frame: number, at: number[], recipe: 'half' | 'blank' | 'swap' = 'half'): Spec => {
  for (const a of at) {
    const d = frame - a;
    if (d < 0) continue;
    if (recipe === 'half' && d < 6) return {...s, expr: d >= 2 && d < 4 ? {...s.expr, closed: true} : {...s.expr, upper: 'flat', lidL: [16, 16], lidR: [16, 16]}};
    if (recipe === 'blank' && d < 4) return {...s, expr: {...s.expr, closed: true}};
    if (recipe === 'blank' && d === 4) return {...s, expr: {...s.expr, blank: true}};
    if (recipe === 'swap' && d < 3) return {...s, expr: {...s.expr, closed: true}};
  }
  return s;
};
