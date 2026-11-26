import type {V3} from './math';
import {FPS, inOut} from './timing';

/** kit/camera: rigs are pure functions of the frame. Cameras run from frame 0 to the cut at CONSTANT speed, on ones
 *  (v3 B8-13). Kinds seen in the reference: push, pull, straight vertical slide (camPedestal, 140 shots), sideways slide
 *  (camTruck), a slight roll of 0.5-2 degrees over the shot (camRoll, about half of the measured shots), an arc
 *  (camArc, 37), a shake on impacts only (camShake, 10). Speeds are in percent per second as in bible 6.1: push/pull 1-3, truck 1-3
 *  (of frame width), hold drift 0.5-1. A rig can wrap another rig: camTruck(camPush(base), {...}). */
export type CamPose = {pos: V3; look: V3; fov: number; roll?: number};   // roll in degrees, positive = picture turns clockwise
/** a rig is a function of the frame; `shakes` lists the frame windows where a camShake runs (the guard skips them) */
export type CamRig = ((f: number) => CamPose) & {shakes?: [number, number][]};
const rig = (fn: (f: number) => CamPose, base: Base, shake?: [number, number]): CamRig => {
  const r = fn as CamRig, inherited = typeof base === 'function' ? base.shakes ?? [] : [];
  r.shakes = shake ? [...inherited, shake] : inherited;
  return r;
};
type Base = CamPose | CamRig;
const at = (b: Base, f: number): CamPose => (typeof b === 'function' ? b(f) : b);
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const frameW = (p: CamPose, aspect = 16 / 9) => 2 * len(sub(p.look, p.pos)) * Math.tan((p.fov * Math.PI) / 360) * aspect;
const axes = (p: CamPose) => { const d = norm(sub(p.look, p.pos)); const r = norm(cross(d, [0, 1, 0])); return {d, r, u: cross(r, d)}; };
const slide = (p: CamPose, v: V3, k: number): CamPose => ({...p, pos: add(p.pos, v, k), look: add(p.look, v, k)});

/** Push in: whatever sits at `look` grows by pctPerSec percent each second, at constant speed. Default 2. */
export const camPush = (base: Base, o: {pctPerSec?: number} = {}): CamRig => rig((f) => {
  const p = at(base, f), s = 1 + ((o.pctPerSec ?? 2) / 100) * (f / FPS), d = sub(p.pos, p.look);
  return {...p, pos: add(p.look, d, 1 / s)};
}, base);
/** Pull back: the subject shrinks by pctPerSec percent each second. Default 2. */
export const camPull = (base: Base, o: {pctPerSec?: number} = {}): CamRig => rig((f) => {
  const p = at(base, f), s = 1 + ((o.pctPerSec ?? 2) / 100) * (f / FPS), d = sub(p.pos, p.look);
  return {...p, pos: add(p.look, d, s)};
}, base);
const lateral = (axis: 'r' | 'u') => (base: Base, o: {pctPerSec?: number; dir?: 1 | -1; ease?: boolean; len?: number} = {}): CamRig => rig((f) => {
  const p = at(base, f), k = (frameW(p) * (o.pctPerSec ?? 2)) / 100;
  let t = f / FPS;
  // eased version keeps half of the linear speed so the camera still moves on frame 0 and at the cut
  if (o.ease && o.len && o.len > 1) { const u = f / (o.len - 1), T = (o.len - 1) / FPS; t = T * (0.5 * u + 0.5 * inOut(u)); }
  return slide(p, axes(p)[axis], k * t * (o.dir ?? 1));
}, base);
/** Truck: slide sideways by pctPerSec percent of the frame width per second (dir 1 = camera moves right, the
 *  picture slides left). Linear by default; {ease: true, len} gives a gentle ease that never stops. */
export const camTruck = lateral('r');
/** Pedestal: the same, vertically (dir 1 = camera rises). */
export const camPedestal = lateral('u');
/** Follow: the camera keeps a moving target framed the way it was on frame 0. target(f) = world position, and it
 *  must be SMOOTH (a formula of f, not a puppet position stepping on twos: the guard rejects a camera that jerks). */
export const camFollow = (base: Base, target: (f: number) => V3, o: {gain?: number} = {}): CamRig => rig((f) => {
  const p = at(base, f), t0 = target(0), t = target(f);
  return {...p, pos: add(p.pos, sub(t, t0), o.gain ?? 1), look: add(p.look, sub(t, t0), o.gain ?? 1)};
}, base);
/** Roll: the picture turns slowly about the lens axis, total degrees over `len` frames (keep 0.5-2; default 1). */
export const camRoll = (base: Base, o: {deg?: number; len: number}): CamRig => rig((f) => {
  const p = at(base, f); return {...p, roll: (p.roll ?? 0) + (o.deg ?? 1) * (f / Math.max(1, o.len - 1))};
}, base);
/** Arc: the camera orbits the look point by degPerSec (positive = camera moves to the right), keeping its distance. */
export const camArc = (base: Base, o: {degPerSec?: number} = {}): CamRig => rig((f) => {
  const p = at(base, f), a = (((o.degPerSec ?? 2) * f) / FPS) * (Math.PI / 180), d = sub(p.pos, p.look);
  return {...p, pos: [p.look[0] + d[0] * Math.cos(a) + d[2] * Math.sin(a), p.pos[1], p.look[2] - d[0] * Math.sin(a) + d[2] * Math.cos(a)]};
}, base);
/** Hold with drift: for shots where the picture itself changes. A slow creep in plus a slight diagonal slide. */
export const camHold = (base: Base, o: {driftPctPerSec?: number; seed?: number} = {}): CamRig => {
  const r = o.driftPctPerSec ?? 0.7, a = ((o.seed ?? 0) * 2.399) % (Math.PI * 2);
  return rig((f) => {
    const p = camPush(base, {pctPerSec: r})(f), ax = axes(p), k = (frameW(p) * r * 0.4) / 100 * (f / FPS);
    return slide(slide(p, ax.r, k * Math.cos(a)), ax.u, k * Math.sin(a) * 0.5);
  }, base);
};
/** Impact shake only (bible 6.1.5): 2-6 frames starting at frame `at`, amp in percent of frame width. */
export const camShake = (base: Base, o: {at: number; dur?: number; amp?: number}): CamRig => {
  const dur = Math.min(6, o.dur ?? 4);
  return rig((f) => {
    const p = at(base, f), q = f - o.at;
    if (q < 0 || q >= dur) return p;
    const ax = axes(p), k = (frameW(p) * (o.amp ?? 0.6)) / 100 * (1 - q / dur);
    return slide(slide(p, ax.r, k * (q % 2 ? -1 : 1)), ax.u, k * 0.6 * (q % 2 ? 1 : -1));
  }, base, [o.at, o.at + dur]);
};

const stepPct = (a: CamPose, b: CamPose) => {
  const da = len(sub(a.look, a.pos)), db = len(sub(b.look, b.pos));
  return (Math.abs(da / db - 1) + Math.abs(a.fov / b.fov - 1) + len(sub(b.look, a.look)) / frameW(a)) * 100;
};
/** How fast a rig moves over the shot, in percent of the frame per second (push/pull size change + lateral slide). */
export const camSpeed = (rig: CamRig, n: number) => stepPct(rig(0), rig(Math.max(1, n - 1))) / (Math.max(1, n - 1) / FPS);
/** The guard <Stage> runs on every shot; it THROWS (bible 6.1, liveness G1) when the camera
 *  - is static on any frame pair,
 *  - moves slower than `min` (0.5 %/s) or faster than `max` (8 %/s) over the shot or on its typical frame,
 *  - jerks: one frame moves more than 3 times the typical frame (snap zoom, jitter, a follow that steps on twos).
 *  Frames inside a camShake window are skipped. A shot of one frame (a Still) is not checked. */
export const assertCamMoves = (rig: CamRig, n: number, name = 'shot', o: {min?: number; max?: number} = {}) => {
  if (n <= 1) return;
  const min = o.min ?? 0.2, max = o.max ?? 8, shaken = (f: number) => (rig.shakes ?? []).some(([a, b]) => f >= a - 1 && f <= b);
  const steps: {f: number; v: number}[] = [];
  for (let f = 0; f < n - 1; f++) {
    const a = rig(f), b = rig(f + 1);
    if (shaken(f)) continue;
    if (len(sub(a.pos, b.pos)) < 1e-7 && Math.abs(a.fov - b.fov) < 1e-7 && Math.abs((a.roll ?? 0) - (b.roll ?? 0)) < 1e-7) throw new Error(`kit: camera of ${name} is static between frames ${f} and ${f + 1}. Use camPush / camTruck / camHold; a camera must move on every frame.`);
    steps.push({f, v: stepPct(a, b) * FPS});
  }
  if (!steps.length) return;
  const sorted = steps.map((s) => s.v).sort((x, y) => x - y), med = sorted[Math.floor(sorted.length / 2)], net = camSpeed(rig, n);
  const jerk = steps.find((s) => s.v > med * 3 + 0.05);
  if (jerk) throw new Error(`kit: camera of ${name} jerks at frame ${jerk.f}: ${jerk.v.toFixed(1)} %/s against a typical ${med.toFixed(1)} %/s. Cameras move smoothly at a steady speed (no snap zoom, no jitter; use camShake for an impact).`);
  if (med > max || net > max) throw new Error(`kit: camera of ${name} moves ${Math.max(med, net).toFixed(1)} %/s; the ceiling is ${max} %/s (bible 6.1: push 1-3, truck 1-3). If the script really calls for a fast move, pass camMax to <Stage>.`);
  if (med < min || net < min) throw new Error(`kit: camera of ${name} moves only ${Math.min(med, net).toFixed(2)} %/s; the floor is ${min} %/s (0.5-1 for a hold with drift, 1-3 otherwise).`);
};
