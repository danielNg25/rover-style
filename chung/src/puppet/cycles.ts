import {twos, hash, lerp, clamp} from '../kit';
import type {V3} from '../kit';
import type {Pose, PuppetRig} from './types';

/** puppet/cycles: repeating actions as functions f -> Pose. Add them onto the acting with mix(act(...), walk(f)).
 *  Everything is sampled ON TWOS. Offsets are canvas px for a 520 px rig: pass `sc = rig.height / 520` for other sizes. */
const TAU = Math.PI * 2;

/** Walk or pace for a biped WITH leg pieces (rig.roles.legs), side view: the legs scissor, the passing knee bends,
 *  the arms counter-swing, and the whole figure sinks exactly as far as the swung legs shorten, so the soles stay on
 *  the ground line. period = frames per two steps (16-20 walk, 12 hurry); leg = hip-to-ankle length in canvas px
 *  (default 0.4 of a 520 px rig, times sc). Move the puppet with glide(). Example rig: src/chars/_lib/walker.ts.
 *  Bible 6.4: keep it tiny, from behind or under 1 s; a long full-body profile walk fails review. */
export const walk = (f: number, o: {period?: number; swing?: number; arm?: number; knee?: number; leg?: number; sc?: number} = {}): Pose => {
  const {period = 16, swing = 20, arm = 12, knee = 16, sc = 1} = o, leg = o.leg ?? 208 * sc, p = (twos(f) / period) * TAU, s = Math.sin(p);
  const hip = swing * s, kL = -knee * Math.max(0, Math.cos(p)), kR = -knee * Math.max(0, -Math.cos(p));
  return {
    hipL: hip, hipR: hip, kneeL: kL, kneeR: kR, footL: -(hip + kL), footR: -(hip + kR), // feet counter-turn: the soles stay level
    shL: -arm * s, shR: -arm * s, bodyY: -leg * (1 - Math.cos((hip * Math.PI) / 180)), lean: 1.2 * s,
  };
};

/** Fake walk for legless, robed or single-picture rigs (bible 6.4): bob + hem flip + lean; move the puppet with glide().
 *  period = frames per step. */
export const fakeWalk = (f: number, o: {period?: number; bob?: number; lean?: number; dir?: 1 | -1; sc?: number} = {}): Pose => {
  const {period = 8, bob = 5, lean = 2, dir = 1, sc = 1} = o, g = twos(f), step = Math.floor(g / period), t = (g - step * period) / period;
  return {bodyY: bob * sc * Math.sin(Math.PI * t), hem: step % 2 ? -1 : 1, lean: lean * dir + (step % 2 ? 0.8 : -0.8), cloth: -3 * dir + (t < 0.5 ? 1.5 : -1.5)};
};

/** Position of a puppet sliding from a to b between frames f0 and f1, stepping on twos (use with fakeWalk or walk). */
export const glide = (f: number, a: V3, b: V3, f0: number, f1: number): V3 => {
  const t = clamp((twos(f) - f0) / Math.max(1, f1 - f0));
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
};

/** Four-legged lateral walk from separate leg pieces (rig.roles.quad). The planted leg shortens a little, the body dips
 *  twice per cycle, tail / ear / trunk swing on their own phases. period = frames per stride (28 heavy, 14 trot). */
export const quadGait = (rig: PuppetRig, f: number, o: {period?: number; swing?: number; bob?: number; seed?: number} = {}): Pose => {
  const q = rig.roles.quad; if (!q) throw new Error(`puppet: rig ${rig.name} has no roles.quad`);
  const {period = 28, swing = 13, bob = 3, seed = 0} = o, p = (twos(f) / period) * TAU + seed;
  const leg = (a: number) => ({rot: swing * Math.sin(a), sy: 1 - 0.07 * Math.max(0, -Math.cos(a))});
  const parts: NonNullable<Pose['parts']> = {[q.nearHind]: leg(p), [q.nearFront]: leg(p + Math.PI), [q.farHind]: leg(p + Math.PI), [q.farFront]: leg(p)};
  const dip = bob * Math.cos(2 * p);
  if (q.body) parts[q.body] = {y: dip, rot: 0.6 * Math.sin(p)};
  if (q.tail) parts[q.tail] = {rot: 7 * Math.sin(2 * p + 1)};
  if (q.ear) parts[q.ear] = {rot: 3 * Math.sin(2 * p + 0.5)};
  if (q.trunk) parts[q.trunk] = {rot: 5 * Math.sin(p + 0.8)};
  return {parts};
};

/** One hop starting at f0: crouch (2 frames), up and down (dur), land squash (4 frames). height in px. Works on any rig. */
export const hop = (f: number, f0: number, o: {height?: number; dur?: number; sc?: number} = {}): Pose => {
  const {height = 34, dur = 8, sc = 1} = o, d = twos(f) - f0;
  if (d < 0 || d >= dur + 6) return {};
  if (d < 2) return {squash: 0.1};
  if (d < 2 + dur) { const t = (d - 2 + 1) / dur; return {bodyY: height * sc * 4 * t * (1 - t), squash: -0.06}; }
  return {squash: d < dur + 4 ? 0.1 : 0.04};
};

/** Shiver (cold, fear): tiny left-right jitter that alternates every drawing, uneven in size. amp in px. */
export const shiver = (f: number, o: {amp?: number; seed?: number; sc?: number} = {}): Pose => {
  const {amp = 2.2, seed = 0, sc = 1} = o, i = Math.floor(f / 2), k = (i % 2 ? 1 : -1) * (0.55 + 0.45 * hash(i, seed));
  return {bodyX: amp * sc * k, headTilt: 0.8 * k, shL: -1.5 * Math.abs(k), shR: -1.5 * Math.abs(k)};
};

/** Talk: mouth flaps at PHRASE level, 2-3 per second, only inside the phrases. phrases = [[startFrame, endFrame], ...].
 *  Phrase starts must be EVEN frames. Returns the mouth pick (ids of the rig's `mouth` variant group) and a 1-2 px head nod on each opening, which is all
 *  a covered-face rig shows. Each flap holds 4-6 frames open, 4-6 closed. */
export const talk = (f: number, phrases: [number, number][], o: {open?: string; closed?: string; nod?: number; seed?: number; sc?: number} = {}): Pose => {
  const {open = 'open', closed = 'closed', nod = 2, seed = 0, sc = 1} = o;
  for (const [a, b] of phrases) {
    if (f < a || f >= b) continue;
    let t = a, i = 0;
    while (t < b) {
      const up = 4 + 2 * Math.round(hash(i, seed + a)), down = 4 + 2 * Math.round(hash(i, seed + a + 7));
      if (f < t + up) return {mouth: open, headY: (f < t + 2 ? nod : nod * 0.5) * sc};
      if (f < t + up + down) return {mouth: closed};
      t += up + down; i++;
    }
  }
  return {mouth: closed};
};
