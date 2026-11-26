import {clamp, lerp, hash} from './math';

/** kit/timing. Rule (LUAT-CUTOUT3D-v3 A1): CHARACTERS change ON TWOS; cameras, fire, particles, glows, spinning props and
 *  anything that travels run ON ONES (355 of 731 reference shots state this split).
 *  Everything here is a pure function of the frame. */
export const FPS = 24;

/** frame quantised to twos: 0,0,2,2,4,4 ... Feed this to any acting or effect formula. */
export const twos = (f: number) => Math.floor(f / 2) * 2;
/** frame quantised to steps of n frames (n = 2 is twos, 3 for 30 fps threes, 4 for slow idles) */
export const steps = (f: number, n = 2) => Math.floor(f / n) * n;

// eases (camera, and the shape of in-betweens)
export const inOut = (t: number) => { const u = clamp(t); return u * u * (3 - 2 * u); };
export const easeOut = (t: number) => { const u = 1 - clamp(t); return 1 - u * u; };
export const outBack = (t: number, s = 1.6) => { const u = clamp(t) - 1; return 1 + (s + 1) * u * u * u + s * u * u; };
/** SMOOTH a -> b between frames f0..f1, on ones. CAMERA AND SET ONLY (a door, a cloud, a sun). Never a puppet or a
 *  hand-built figure: acting goes through track() / act(), which change on twos. */
export const camTween = (f: number, f0: number, f1: number, a: number, b: number, ease: (t: number) => number = inOut) => lerp(a, b, ease((f - f0) / (f1 - f0)));

/** Pose-to-pose track ON TWOS. keys = [[frame, value], ...] sorted, key frames EVEN. At each key frame the value
 *  leaves the old pose and reaches the new one over `n` frames, changing only every 2nd frame, in EVEN steps with a
 *  half-size last step (n = 8: steps of 2/7, 2/7, 2/7, 1/7 of the change). So the largest step of one drawing is
 *  change / (n/2 - 0.5): pick n with nFor(change, perDrawing). n = 0 or 2: a snap (faces, hand swaps). It then HOLDS
 *  exactly: no drift, no settle wobble. Passing `ease` replaces the even split (easeOut puts 44 % of a 4-drawing
 *  move into the first drawing: that pops, do not use it on anything large). */
export const track = (f: number, ks: [number, number][], n = 4, ease?: (t: number) => number) => {
  let v = ks[0][1];
  const nd = Math.max(1, Math.round(n / 2)); // number of drawings the move takes
  for (let i = 1; i < ks.length; i++) {
    const [k, target] = ks[i];
    if (f < k) break;
    const q = Math.floor((f - k) / 2) + 1; // drawing index since the key: 1, 2, 3 ...
    v = lerp(v, target, q >= nd ? 1 : ease ? ease(q / nd) : q / (nd - 0.5));
  }
  return v;
};
/** Frames (`n` of track) a change needs so that no single drawing moves further than perDrawing (bible 8.5: about
 *  15 px for a head, 25 px for a hand, measured on a 1080p frame). nFor(90, 20) = 10: a 90-degree arm swing whose
 *  hand may travel 20 degrees of arc per drawing takes 10 frames. */
export const nFor = (change: number, perDrawing: number) => 2 * Math.max(1, Math.ceil(Math.abs(change) / perDrawing + 0.5));
/** Same for a bag of named numbers: keys = [[frame, {a: 1, b: 2}], ...]; a field missing from a key keeps its value. */
export const trackObj = <T extends Record<string, number>>(f: number, ks: [number, Partial<T>][], n = 4, ease?: (t: number) => number): T => {
  const out: Record<string, number> = {};
  const names = new Set<string>(); ks.forEach(([, o]) => Object.keys(o).forEach((k) => names.add(k)));
  names.forEach((name) => {
    const list = ks.filter(([, o]) => o[name] !== undefined).map(([k, o]) => [k, o[name] as number] as [number, number]);
    out[name] = track(f, list, n, ease);
  });
  return out as T;
};
/** Discrete track (sprite or face name swaps): returns the value of the last key at or before f. */
export const trackStep = <T,>(f: number, ks: [number, T][]): T => { let v = ks[0][1]; for (const [k, x] of ks) { if (f >= k) v = x; else break; } return v; };

/** Idle (bible 8.6): a small HELD offset in -1..1 that moves to a new value every `hold` frames through one
 *  in-between, on twos. Not a sine wobble. Multiply by a few pixels or 2-3 degrees. */
export const idle = (f: number, seed = 0, hold = 10) => {
  const i = Math.floor(f / hold), a = hash(i - 1, seed) * 2 - 1, b = hash(i, seed) * 2 - 1;
  return (f - i * hold) < 2 ? (a + b) / 2 : b;
};
/** 0..1 progress of an event that starts at f0 and lasts dur frames, advancing on twos (draw-ons, pops, wipes) */
export const prog = (f: number, f0: number, dur: number) => clamp((twos(f - f0) + 2) / Math.max(2, dur));
/** true on the frames of a blink placed by hand at frame `at` (bible: blink serves a beat, never a timer) */
export const blinkAt = (f: number, at: number[], dur = 4) => at.some((b) => f >= b && f < b + dur);

/** Cut lead (bible 2.1 / 9.4): the frame a shot should START so that its anchor word lands `lead` frames in.
 *  anchorFrame = frame of the anchor word on the voice timeline; default lead 10 f (range 7-24 f). */
export const cutLead = (anchorFrame: number, lead = 10) => Math.max(0, Math.round(anchorFrame - clamp(lead, 7, 24)));
/** frame inside the shot on which the anchor word is spoken, given the same lead (time in-shot events to this) */
export const anchorIn = (lead = 10) => clamp(lead, 7, 24);
export const sec = (s: number) => Math.round(s * FPS);
