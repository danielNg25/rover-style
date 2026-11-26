import {idle, clamp} from '../kit';
import {NUM_KEYS, Num, Pose, PuppetRig, REST, Pt} from './types';
import {canvasPoint, solve, solveView, viewOf} from './pose';

/** puppet/act: acting written as a BEAT LIST and evaluated ON TWOS (bible 6.2, 8.5, 8.6).
 *  A beat = {f, note, ...the channels that change on that frame}. Channels not named keep their value. */
export type Beat = Pose & {
  f: number;        // frame inside the shot (EVEN: drawings change on twos)
  note?: string;    // what the beat means, for the reader
  blink?: boolean;  // one blink starting here (4 frames). Blinks happen ONLY where a beat asks for one
  n?: number;       // frames this beat's moves take AT LEAST. It can slow a move down; it can never make one faster than the per-drawing limits allow
  dip?: boolean;    // force (true) or forbid (false) the small head dip that big changes get by themselves
};

/** per channel: frames a move takes at least, and the largest change ONE DRAWING may show (a bigger change gets more
 *  drawings). px values are for a 520 px tall rig and scale with rig.height. */
const MOVE: Record<keyof Num, [n: number, perDrawing: number, px?: boolean]> = {
  eyeOpen: [0, 9], eyeSlant: [0, 99], browL: [0, 99], browR: [0, 99], browYL: [0, 99, true], browYR: [0, 99, true], px: [0, 9], py: [0, 9],
  turn: [4, 0.45], up: [4, 0.45], headTilt: [4, 5], headX: [4, 8, true], headY: [4, 8, true],
  bodyX: [4, 12, true], bodyY: [4, 12, true], bob: [4, 6, true], lean: [4, 3], squash: [4, 0.06], cloth: [4, 4], hair: [4, 4], hem: [0, 9],
  shL: [8, 22], elL: [8, 26], wrL: [4, 30], shR: [8, 22], elR: [8, 26], wrR: [4, 30],
  hipL: [4, 18], kneeL: [4, 24], footL: [4, 30], hipR: [4, 18], kneeR: [4, 24], footR: [4, 30],
};
/** bible 8.5: how far the top of the head / a hand may travel WITHOUT AN IN-BETWEEN, in px of a 520 px rig (about
 *  the px of a 1080p frame for a figure half the frame tall; scales with rig.height). A move longer than this gets at
 *  least one in-between drawing, one longer than 4 times this at least two; no single drawing may carry a point
 *  further than 4 times this. (It is NOT a cap of 25 px on every drawing: the reference carries a hand from the
 *  armrest to the chin through two travel poses, bible 6.2.3 "arms ease over 8-12 f", AUDIT king item 1.) */
export const STEP_LIMIT = {head: 15, hand: 25};
const HEAD: (keyof Num)[] = ['turn', 'up', 'headTilt', 'headX'];
/** the channels that carry the head, hands and feet through space: on one beat they share one number of drawings */
const MOTION: (keyof Num)[] = ['headTilt', 'headX', 'headY', 'bodyX', 'bodyY', 'bob', 'lean', 'squash', 'shL', 'elL', 'wrL', 'shR', 'elR', 'wrR', 'hipL', 'kneeL', 'footL', 'hipR', 'kneeR', 'footR'];
const PICKS = ['mouth', 'handL', 'handR', 'view'] as const;

export type ActOpts = {
  rig?: PuppetRig;   // gives the start pose (rig.rest), scales the px limits and lets act() measure how far head and hands travel
  seed?: number;     // each puppet its own seed, so their idles do not move together
  alive?: number;    // strength of the held-pose life: 1 default, 0 = frozen (never ship 0), 0.5 for a far extra
};

// ---- the points whose travel is limited: top of the head and both hands (feet belong to the walk cycle)
type Tracked = {name: string; piece: string; at: Pt; limit: number};
const farEnd = (rig: PuppetRig, piece: string): Pt => { const p = rig.pieces[piece], h = p.h ?? p.w; return [2 * (p.x + p.w / 2) - p.pivot[0], 2 * (p.y + h / 2) - p.pivot[1]]; };
export const trackedPoints = (rig: PuppetRig): Tracked[] => {
  const out: Tracked[] = [], R = rig.roles, P = rig.points ?? {};
  if (P.top) out.push({name: 'head', ...P.top, limit: STEP_LIMIT.head});
  else if (R.head) out.push({name: 'head', piece: R.head, at: [rig.pieces[R.head].pivot[0], rig.pieces[R.head].y], limit: STEP_LIMIT.head});
  else { const b = R.body?.[0] ?? Object.keys(rig.pieces)[0]; out.push({name: 'head', piece: b, at: [rig.centerX, rig.groundY - rig.height], limit: STEP_LIMIT.head}); }
  (['L', 'R'] as const).forEach((s) => {
    const a = R.arms?.[s], hand = a?.end?.[0] ?? a?.lower?.[0] ?? a?.upper?.[0];
    if (P[`palm${s}`]) out.push({name: `hand ${s}`, ...P[`palm${s}`], limit: STEP_LIMIT.hand});
    else if (hand) out.push({name: `hand ${s}`, piece: hand, at: farEnd(rig, hand), limit: STEP_LIMIT.hand});
  });
  return out;
};
const numbers = (rig?: PuppetRig): Num => ({...REST, ...(rig?.rest ?? {})}) as Num;
/** per beat: how many drawings the travelling channels need so that no tracked point exceeds its limit */
const PLANS = new WeakMap<Beat[], Map<PuppetRig, number[]>>();
const planOf = (beats: Beat[], rig: PuppetRig): number[] => {
  let m = PLANS.get(beats); if (!m) PLANS.set(beats, (m = new Map()));
  const hit = m.get(rig); if (hit) return hit;
  const plan: number[] = [];
  let A: Pose = {...numbers(rig), sel: {}};
  beats.forEach((b, i) => {
    const B: Pose = {...A, sel: {...A.sel, ...(b.sel ?? {})}};
    NUM_KEYS.forEach((k) => { if (b[k] !== undefined) B[k] = b[k]; });
    PICKS.forEach((k) => { if (b[k] !== undefined) B[k] = b[k]; });
    plan[i] = 0;
    if (b.f > 0 && MOTION.some((k) => b[k] !== undefined && b[k] !== A[k])) {
      const r = viewOf(rig, B), pts = trackedPoints(r), STEPS = 6;
      const at = (t: number) => { const p: Pose = {...B, view: undefined}; MOTION.forEach((k) => { p[k] = (A[k] ?? 0) + ((B[k] ?? 0) - (A[k] ?? 0)) * t; }); const s = r === rig ? solve(r, p) : solveView(rig, {...p, view: B.view}).solved; return pts.map((q) => canvasPoint(r, s, q.piece, q.at)); };
      let prev = at(0); const travel = pts.map(() => 0);
      for (let j = 1; j <= STEPS; j++) { const cur = at(j / STEPS); cur.forEach((c, q) => { travel[q] += Math.hypot(c.x - prev[q].x, c.y - prev[q].y); }); prev = cur; }
      // over the limit: one in-between (2 drawings); over 4 limits: two (3 drawings); never more than 4 limits in one drawing
      plan[i] = Math.max(0, ...pts.map((q, k) => { const lim = q.limit * (r.height / 520), t = travel[k]; return t <= lim ? 0 : Math.max(t > 4 * lim ? 3 : 2, Math.ceil(t / (4 * lim) + 0.5)); }));
    }
    A = B;
  });
  m.set(rig, plan);
  return plan;
};
/** share of a move done on frame f, for a move that starts on frame f0 and takes nd drawings: even steps on twos,
 *  the last one half-size (so the largest single step is 1 / (nd - 0.5) of the change) */
const done = (f: number, f0: number, nd: number) => { if (f < f0) return 0; const q = Math.floor((f - f0) / 2) + 1; return q >= nd ? 1 : q / (nd - 0.5); };
const drawings = (b: Beat, key: keyof Num, d: number, sc: number, need: number) => {
  const [n0, lim, isPx] = MOVE[key], step = isPx ? lim * sc : lim;
  return Math.max(1, Math.ceil((b.n ?? n0) / 2), Math.abs(d) > step ? Math.ceil(Math.abs(d) / step + 0.5) : 1, MOTION.includes(key) ? need : 0);
};
/** one numeric channel of a beat list at frame f */
const chan = (beats: Beat[], f: number, key: keyof Num, start: number, sc: number, plan: number[], early?: (b: Beat) => boolean): number => {
  let prev = start, v = start;
  beats.forEach((b, i) => {
    const target = b[key]; if (target === undefined) return;
    if (b.f <= 0) { prev = v = target; return; }
    const d = target - prev;
    v += d * done(f, early?.(b) ? b.f - 2 : b.f, drawings(b, key, d, sc, plan[i] ?? 0));
    prev = target;
  });
  return v;
};
const last = <T,>(beats: Beat[], f: number, get: (b: Beat) => T | undefined): T | undefined => { let v: T | undefined; for (const b of beats) { if (b.f > f) break; const x = get(b); if (x !== undefined) v = x; } return v; };

/** Evaluates a beat list at frame f and returns the pose.
 *  - every number changes only every 2nd frame (on EVEN frames) and passes through staged in-betweens: even steps,
 *    the last one half-size;
 *  - no drawing moves a channel further than its limit (head tilt 5 deg, turn 0.45, lean 3 deg, shoulder 22 deg,
 *    elbow 26 deg, body 12 px): a bigger move simply takes more drawings;
 *  - with opts.rig the travel of the head top and of each hand is measured: over 15 px (head) or 25 px (hand) the
 *    move gets an in-between, over 4 times that a second one (px of a 520 px rig);
 *  - faces snap; heads and bodies take 4 frames or more; arms 8 or more; `n` on a beat can only lengthen a move;
 *  - EYES LEAD: on a beat that moves the head, the pupils go one drawing (2 frames) earlier;
 *  - a big head or body change gets a small HEAD DIP on its first drawings;
 *  - cloth follows the lean, and hair the head, ONE DRAWING (2 frames) late;
 *  - a held pose stays alive through small offsets that are HELD and change on twos (bob, tilt, pupil dart, arm settle);
 *  - beats must be sorted by f. */
export const act = (beats: Beat[], f: number, o: ActOpts = {}): Pose => {
  const {rig, seed = 0, alive = 1} = o;
  const view = last(beats, f, (b) => b.view), shown = rig ? viewOf(rig, {view}) : undefined; // a view has its own neutral pose
  const sc = (rig?.height ?? 520) / 520, rest = numbers(shown), plan = rig ? planOf(beats, rig) : [];
  const out: Pose = {}, at = (k: keyof Num, frame = f) => chan(beats, frame, k, rest[k], sc, plan);
  NUM_KEYS.forEach((k) => { if (k !== 'px' && k !== 'py') out[k] = at(k); });
  // pupils: keys on head-moving beats happen one drawing early; a head turn without a pupil key drags them ahead
  const headBeat = (b: Beat) => b.f > 0 && HEAD.some((k) => b[k] !== undefined);
  (['px', 'py'] as const).forEach((k) => {
    const src = k === 'px' ? 'turn' : 'up';
    let lead = 0, was = rest[src];
    beats.forEach((b, i) => {
      const t = b[src]; if (t === undefined) return;
      if (b.f > 0 && b[k] === undefined) { const nd = drawings(b, src, t - was, sc, plan[i] ?? 0); lead += (t - was) * (done(f + 2, b.f, nd) - done(f, b.f, nd)); }
      was = t;
    });
    out[k] = clamp(chan(beats, f, k, rest[k], sc, plan, headBeat) + lead * 0.9, -1, 1);
  });
  // head dip on big changes, blink beats
  let dip = 0, open = 1; const prev: Num = {...rest};
  for (const b of beats) {
    const big = b.dip ?? (Math.abs((b.turn ?? prev.turn) - prev.turn) >= 0.5 || Math.abs((b.headTilt ?? prev.headTilt) - prev.headTilt) >= 8
      || Math.abs((b.bodyX ?? prev.bodyX) - prev.bodyX) >= 20 * sc || Math.abs((b.lean ?? prev.lean) - prev.lean) >= 5);
    const d = f - b.f;
    if (b.f > 0 && big && d >= 0 && d < 4) dip = d < 2 ? 1 : 0.4;
    if (b.blink && d >= 0 && d < 4) open = d < 2 ? 0.04 : 0.5;
    NUM_KEYS.forEach((k) => { if (b[k] !== undefined) prev[k] = b[k] as number; });
  }
  out.headY = (out.headY ?? 0) - dip * 5 * sc;
  out.eyeOpen = (out.eyeOpen ?? 1) * open;
  // follow-through, one drawing (2 frames) late, so it stays on the twos grid (unless the beats drive it)
  if (!beats.some((b) => b.cloth !== undefined)) out.cloth = at('lean', f - 2) * 0.7 + (at('bodyX', f - 2) - (out.bodyX ?? 0)) * 0.12 / sc;
  if (!beats.some((b) => b.hair !== undefined)) out.hair = (at('headTilt', f - 2) - (out.headTilt ?? 0)) * 0.8 + (at('turn', f - 2) - (out.turn ?? 0)) * 8 + (out.cloth ?? 0) * 0.5;
  // life in the holds: held offsets on their own clocks (never a sine). The bob lifts the hips; planted legs stay put
  if (alive > 0) {
    const a = alive;
    out.bob = (out.bob ?? 0) + idle(f, seed + 11, 12) * 2.5 * sc * a;
    out.headTilt = (out.headTilt ?? 0) + idle(f, seed + 23, 14) * 1.4 * a;
    out.headY = out.headY + idle(f + 4, seed + 31, 12) * 1 * sc * a;
    out.px = clamp((out.px ?? 0) + idle(f, seed + 37, 18) * 0.1 * a, -1, 1);
    out.cloth = (out.cloth ?? 0) + idle(f + 6, seed + 41, 10) * 0.9 * a;
    out.hair = (out.hair ?? 0) + idle(f + 2, seed + 43, 10) * 0.9 * a;
    out.shL = (out.shL ?? 0) + idle(f + 2, seed + 53, 16) * 1.2 * a; out.elL = (out.elL ?? 0) + idle(f + 8, seed + 59, 16) * 1.6 * a;
    out.shR = (out.shR ?? 0) + idle(f + 10, seed + 61, 16) * 1.2 * a; out.elR = (out.elR ?? 0) + idle(f + 4, seed + 67, 16) * 1.6 * a;
  }
  // discrete picks: the last beat at or before f
  PICKS.forEach((k) => { const v = last(beats, f, (b) => b[k]); if (v !== undefined) out[k] = v; });
  const sel: Record<string, string> = {};
  beats.forEach((b) => { if (b.f <= f && b.sel) Object.assign(sel, b.sel); });
  out.sel = sel;
  const parts = last(beats, f, (b) => b.parts); if (parts) out.parts = parts;
  return out;
};

/** For each beat after frame 0: the frame it starts on and the frame its last drawing lands on (its moves are still
 *  running in between). Start the next move of the same limb after `end`, or the two add up and may pop. */
export const beatSpans = (beats: Beat[], o: {rig?: PuppetRig} = {}): {f: number; end: number; note?: string}[] => {
  const sc = (o.rig?.height ?? 520) / 520, plan = o.rig ? planOf(beats, o.rig) : [], prev = numbers(o.rig), out: {f: number; end: number; note?: string}[] = [];
  beats.forEach((b, i) => {
    let nd = 1;
    NUM_KEYS.forEach((k) => { const t = b[k]; if (t === undefined) return; if (b.f > 0 && t !== prev[k]) nd = Math.max(nd, drawings(b, k, t - prev[k], sc, plan[i] ?? 0)); prev[k] = t; });
    if (b.f > 0) out.push({f: b.f, end: b.f + 2 * (nd - 1), note: b.note});
  });
  return out;
};

/** the frames on which a beat list changes something: paste into the liveness declaration ({kind: 'puppet', beats}) */
export const beatFrames = (beats: Beat[]) => beats.filter((b) => b.f > 0).map((b) => b.f);

export type CastEntry = Beat[] | {beats: Beat[]; rig: PuppetRig; seed?: number; alive?: number; extra?: (f: number) => Pose};
/** Checks beat lists against the bible before a render. cast = {name: beats} or, better, {name: {beats, rig, seed}}.
 *  Returns a list of problems (empty = fine). Call it at module level and throw.
 *  Always: two puppets changing on the same frame (6.2.4), a gap over 1.5 s without any beat (7.1 G5), a puppet with
 *  no beat, odd beat frames, unsorted beats.
 *  With a rig, the acting is also PLAYED frame by frame: an unknown pick or an out-of-range channel, any change on an
 *  odd frame, a POP (the head top over about 15 px or a hand over about 25 px in one drawing with no in-between
 *  before or after it) and any drawing that carries one of them further than 4 times that (px of a 520 px rig;
 *  drawing swaps are not counted; the ceiling is not applied when a cycle is mixed in). `extra` = cycles mixed on
 *  top, as f => Pose (hop, walk ...). */
export const lintBeats = (cast: Record<string, CastEntry>, len: number, sync: number[] = []): string[] => {
  const out: string[] = [], seen = new Map<number, string>(), all: number[] = [0, len];
  Object.entries(cast).forEach(([name, entry]) => {
    const beats = Array.isArray(entry) ? entry : entry.beats, fr = beatFrames(beats);
    if (!fr.length) out.push(`${name}: no beat after frame 0`);
    beats.forEach((b, i) => { if (i && b.f < beats[i - 1].f) out.push(`${name}: beats are not sorted at f=${b.f}`); if (b.f % 2) out.push(`${name}: beat at odd frame ${b.f}`); });
    Array.from(new Set(fr)).forEach((k) => { if (seen.has(k) && !sync.includes(k)) out.push(`${seen.get(k)} and ${name} both change on frame ${k}`); seen.set(k, name); all.push(k); });
    if (Array.isArray(entry)) return;
    const {rig, seed, alive, extra} = entry;
    try {
      const poseAt = (f: number): Pose => { const p = act(beats, f, {rig, seed, alive}), e = extra?.(f); if (!e) return p; const m: Pose = {...p, ...e, sel: {...p.sel, ...(e.sel ?? {})}}; NUM_KEYS.forEach((k) => { if (e[k] !== undefined) m[k] = (p[k] ?? 0) + (e[k] as number); }); return m; };
      let was = solveView(rig, poseAt(0)), odd = 0; const steps = new Map<string, number>();
      for (let f = 1; f < len; f++) {
        const now = solveView(rig, poseAt(f));
        if (f % 2) { if (!odd && (now.r !== was.r || JSON.stringify(now.solved) !== JSON.stringify(was.solved))) { odd = 1; out.push(`${name}: changes on odd frame ${f} (must move on twos)`); } }
        else if (now.r === was.r) {
          const next = f + 2 < len ? solveView(rig, poseAt(f + 2)) : now;
          trackedPoints(now.r).forEach((q) => {
            const P = (v: typeof now) => canvasPoint(now.r, v.solved, q.piece, q.at), a = P(was), b = P(now), c = next.r === now.r ? P(next) : b;
            const d = Math.hypot(a.x - b.x, a.y - b.y), after = Math.hypot(c.x - b.x, c.y - b.y), before = steps.get(q.name) ?? 0, lim = q.limit * (now.r.height / 520);
            const running = beatSpans(beats, {rig}).filter((sp) => sp.f <= f && sp.end >= f).map((sp) => `f=${sp.f} (runs to ${sp.end})`).join(' and ');
            if (d > lim * 1.3 && before < d * 0.25 && after < d * 0.25) out.push(`${name}: ${q.name} pops ${d.toFixed(0)} px in ONE drawing on frame ${f} with no in-between (over about ${lim.toFixed(0)} px a move needs one)`);
            else if (!extra && d > lim * 4.4) out.push(`${name}: ${q.name} travels ${d.toFixed(0)} px in the drawing on frame ${f} (ceiling about ${(lim * 4).toFixed(0)}). Moves add up there: beats ${running}. Start the later beat after the earlier one has landed`);
            steps.set(q.name, d);
          });
        }
        was = now;
      }
    } catch (e) { out.push(`${name}: ${(e as Error).message}`); }
  });
  all.sort((a, b) => a - b).forEach((k, i) => { if (i && k - all[i - 1] > 36) out.push(`no beat between frames ${all[i - 1]} and ${k} (over 1.5 s)`); });
  return out;
};
