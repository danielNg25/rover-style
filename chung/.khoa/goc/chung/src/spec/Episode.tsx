import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Scene3, Finish, distanceFor} from '../lib3/look';
import {Place, FOCUS} from '../lib3/places';
import {stageCast} from '../lib3/town';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import {act, blink, Key} from '../mould/act';
import {perform, lintBeats, POSES, BODY_MOVES} from '../mould/gestures';
import type {Spec} from '../mould/draw';
import {headSpan} from '../mould/draw';
import type {EpisodeSpec, SceneSpec, ShotSpec} from './types';

/** THE BUILDER: plays a shot sheet (spec/types.ts). It stages the cast by rule, compiles the beats into acting, places the
 *  camera by rule from the shot size and who the shot is on, softens the set in close shots, and refuses to render a
 *  sheet that breaks a rule (unknown names, a figure left too long without a beat, a shot too short). */
type V3 = [number, number, number];
const H = {adult: 1.7, child: 1.15};
export const episodeFrames = (e: EpisodeSpec) => e.scenes.reduce((n, s) => n + s.shots.reduce((m, q) => m + q.len, 0), 0);

export const lintEpisode = (e: EpisodeSpec) => {
  const bad: string[] = [];
  e.scenes.forEach((s) => {
    const len = s.shots.reduce((m, q) => m + q.len, 0);
    if (!e.places[s.place]) bad.push(`scene ${s.id}: unknown place "${s.place}"`);
    s.cast.forEach((c) => { if (!e.cast[c]) bad.push(`scene ${s.id}: unknown cast member "${c}"`); if (!s.acting[c]) bad.push(`scene ${s.id}: no acting for "${c}"`); });
    Object.entries(s.acting).forEach(([c, a]) => {
      a.beats.forEach((b) => { if (b.pose && !(b.pose in POSES)) bad.push(`scene ${s.id}, ${c}: unknown pose "${b.pose}"`); if (b.face && !(b.face in EXPR)) bad.push(`scene ${s.id}, ${c}: unknown face "${b.face}"`); if (b.body && !BODY_MOVES.includes(b.body)) bad.push(`scene ${s.id}, ${c}: unknown body move "${b.body}"`); });
      const gaps = lintBeats(a.beats, len, a.role); if (gaps.length) bad.push(`scene ${s.id}, ${c} (${a.role}) stands too long without a beat: frames ${gaps.join(', ')}`);
    });
    let at = 0;
    s.shots.forEach((q, i) => {
      // enough ACTING in every shot, counted before rendering: moves of the arms, the body or the mouth (a look or a face alone does not count)
      const who = q.size === 'wide' || !q.on ? s.cast : [q.on].flat(), n = who.reduce((m, c) => m + (s.acting[c]?.beats ?? []).filter((b) => b.f >= at && b.f < at + q.len && (b.pose || b.body || b.say)).length, 0), need = Math.floor(q.len / (q.size === 'wide' ? 15 : 20));
      if (n < need) bad.push(`scene ${s.id}, shot ${i + 1} (${q.size}): ${n} acting beats in ${q.len} frames, at least ${need} needed`);
      at += q.len;
      if (q.len < 20) bad.push(`scene ${s.id}, shot ${i + 1}: ${q.len} frames is under 20`);
      // a shot must be long enough to say its words and not linger long after them (until real word timings replace this estimate)
      const syl = q.say ? q.say.trim().split(/\s+/).length : 0; if (syl && q.len < (syl * 24) / 5.5) bad.push(`scene ${s.id}, shot ${i + 1}: ${q.len} frames is too short for ${syl} syllables`); if (syl && q.len > (syl * 24) / 2.2 + 24) bad.push(`scene ${s.id}, shot ${i + 1}: ${q.len} frames is too long for ${syl} syllables`); [q.on ?? []].flat().forEach((c) => { if (!s.cast.includes(c)) bad.push(`scene ${s.id}, shot ${i + 1}: "${c}" is not in the scene`); }); });
  });
  return bad;
};

type CamKey = {pos: V3; look: V3};
/** Camera by rule: the shot size sets how much of the frame the subject fills (wide 0.42 of the frame height, medium 0.78,
 *  close: the head fills it), the move runs at constant speed from the first frame to the last, with a slight roll. */
const camFor = (q: ShotSpec, P: {x: number; z: number; h: number; head: number; top: number}[], on: number[], i: number): {a: CamKey; b: CamKey; roll: number; soft: boolean} => {
  const S = on.length ? on.map((k) => P[k]) : P, xs = S.map((p) => p.x), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = S.reduce((m, p) => m + p.z, 0) / S.length, tall = S.reduce((m, p) => (p.top > m.top ? p : m)), h = tall.top, span = Math.max(...xs) - Math.min(...xs);
  let pos: V3, look: V3;
  // wide: the tallest person in the scene stands 42 % of the frame high (a child alone is not left tiny), framed on the focus
  if (q.size === 'wide') { const hW = Math.max(...P.map((p) => p.h)), k = hW / 1.7, wx = FOCUS[0] + (P.length === 1 ? (P[0].x - FOCUS[0]) * 0.45 : 0.1); pos = [wx, 1.6 * k, FOCUS[1] + 1.9 * k + distanceFor(hW, 0.42)]; look = [wx, 1.35 * k, FOCUS[1] + 0.9 * k]; }
  // medium and close are framed from the HEAD, not from eye level: the head fills 30 % of the frame height in a medium shot (or
  // the frame widens until everybody the shot is on fits), 50 % in a close shot, and little room is left above it
  // (reference: 'little or no headroom' is the recorded habit; eye-level framing left a third of the frame empty above the heads)
  else if (q.size === 'medium') { const Hh = Math.max(tall.head / 0.3, (span + 0.8 * h) / (16 / 9)), cy = h + 0.13 * Hh - 0.5 * Hh; pos = [cx - 0.1, cy + 0.08, cz + distanceFor(Hh, 1)]; look = [cx, cy, cz]; }
  else { const Hh = tall.head / 0.5, cy = h - tall.head * 0.5 - 0.04 * Hh; pos = [cx - 0.1, cy + 0.03, cz + distanceFor(Hh, 1)]; look = [cx - 0.05, cy, cz]; }
  const k = q.size === 'wide' ? 1 : q.size === 'medium' ? 0.55 : 0.32, d: Record<string, [V3, V3]> = {   // [offset of pos at the start, offset of look at the start]; the shot ends on pos / look
    push: [[0, 0, 0.42 * k], [0, 0, 0]], pull: [[0, 0, -0.42 * k], [0, 0, 0]], down: [[0, 0.45 * k, 0.2 * k], [0, 0.4 * k, 0]], up: [[0, -0.4 * k, 0.15 * k], [0, -0.35 * k, 0]],
    left: [[0.3 * k, 0, 0], [0.3 * k, 0, 0]], right: [[-0.3 * k, 0, 0], [-0.3 * k, 0, 0]], hold: [[0, 0, 0.14 * k], [0, 0, 0]],
  }, [dp, dl] = d[q.camera];
  return {a: {pos: [pos[0] + dp[0], pos[1] + dp[1], pos[2] + dp[2]], look: [look[0] + dl[0], look[1] + dl[1], look[2] + dl[2]]}, b: {pos, look}, roll: (i % 2 ? -1 : 1) * (q.size === 'wide' ? 0.7 : 0.5), soft: q.size === 'close'};
};
const Cam: React.FC<{c: ReturnType<typeof camFor>; t: number}> = ({c, t}) => {
  const {camera} = useThree(), cam = camera as THREE.PerspectiveCamera, m = (k: 'pos' | 'look', i: number) => c.a[k][i] + (c.b[k][i] - c.a[k][i]) * t;
  cam.position.set(m('pos', 0), m('pos', 1), m('pos', 2)); cam.fov = 28; cam.near = 0.1; cam.far = 200; cam.lookAt(m('look', 0), m('look', 1), m('look', 2)); cam.rotateZ((-c.roll * t * Math.PI) / 180); cam.updateProjectionMatrix();
  return null;
};

const useScene = (e: EpisodeSpec, s: SceneSpec) => useMemo(() => {
  const P = stageCast(FOCUS, s.cast.length, 3.0), place = e.places[s.place];
  const people = s.cast.map((id, i) => {
    const c = e.cast[id], a = s.acting[id], f0 = EXPR[c.face ?? 'neutral'];
    const coat = c.outfit === 'coat', armBase = coat ? {show: true} : {};   // under a coat the arms only show when they leave the body
    const base: Spec = {outfit: c.outfit ?? 'vest', hair: c.hair, backHair: c.backHair, beard: c.beard, longLegs: c.build === 'adult', build: c.build, view: P[i].back ? 'back' : 'front', expr: {...f0, ...(c.look ? {gaze: c.look} : {})}, armL: {...POSES.idle[0], ...armBase}, armR: {...POSES.idle[1], ...armBase}, palette: c.palette, faceDy: coat ? -24 : 0, whites: place.kind === 'snow' ? '#e6e3df' : undefined};
    const keys: Key[] = perform(a.beats, {dirDefault: a.dir ?? (P[i].flip ? -1 : 1), mirror: P[i].flip});
    // blinks by rule (D18): one every 3 to 4 seconds from a seeded start; the blank-whites recipe for speakers
    const blinks = Array.from({length: 12}, (_, k) => 20 + i * 17 + k * (76 + i * 9));
    return {id, base, keys, blinks, recipe: (a.role === 'speaker' ? 'blank' : 'half') as 'blank' | 'half', h: H[c.build], head: H[c.build] * headSpan(c).size, top: H[c.build] * headSpan(c).top, ...P[i]};
  });
  return {people, keep: P.map((q) => [q.x, q.z, 0.75] as [number, number, number])};
}, [e, s]);

// live: figures are small in a wide shot, so their idle movement is larger there (reference: a change moves 5.9 % of the acting
// area in wides although the figures are a third the size of a close shot's)
const People: React.FC<{people: ReturnType<typeof useScene>['people']; f: number; sharp?: number[]; live?: number}> = ({people, f, sharp = [], live = 1}) => (
  <>{people.map((p, i) => <Puppet3 key={p.id} height={p.h} pos={[p.x, 0, p.z]} res={sharp.includes(i) ? 2.4 : p.near === 1 ? 2 : 1.6} flip={p.flip} spec={blink(act(p.base, p.keys, f, {seed: i + 1, live}), f, p.blinks, p.recipe)} />)}</>
);

const SceneView: React.FC<{e: EpisodeSpec; s: SceneSpec; f: number; gain: number}> = ({e, s, f, gain}) => {
  const {width, height} = useVideoConfig(), {people, keep} = useScene(e, s);
  let g = f, i = 0; while (i < s.shots.length - 1 && g >= s.shots[i].len) { g -= s.shots[i].len; i++; }
  const q = s.shots[i], on = [q.on ?? []].flat().map((id) => s.cast.indexOf(id)), c = camFor(q, people, on, i), cam = <Cam c={c} t={q.len > 1 ? g / (q.len - 1) : 0} />, place = e.places[s.place];
  if (c.soft) return (
    <Finish>
      <AbsoluteFill style={{filter: 'blur(1.6px)', transform: 'scale(1.01)'}}><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>{cam}<Place spec={place} gain={gain} keep={keep} f={f} /></ThreeCanvas></AbsoluteFill>
      <AbsoluteFill><ThreeCanvas width={width} height={height} flat gl={{antialias: true, alpha: true}}>{cam}<Scene3 grade={place.grade ?? ({street: 'dayExterior', camp: 'nightExterior', snow: 'snowExterior'} as const)[place.kind]} gain={gain}><People people={people.filter((_, k) => on.includes(k))} f={f} sharp={[0]} /></Scene3></ThreeCanvas></AbsoluteFill>
    </Finish>
  );
  return <Finish><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>{cam}<Place spec={place} gain={gain} keep={keep} f={f}><People people={people} f={f} live={1} /></Place></ThreeCanvas></Finish>;
};

export const Episode: React.FC<{spec: EpisodeSpec; gain?: number}> = ({spec, gain = 1}) => {
  const frame = useCurrentFrame(), bad = useMemo(() => lintEpisode(spec), [spec]);
  if (bad.length) throw new Error(`shot sheet ${spec.id} breaks ${bad.length} rule(s):\n- ` + bad.join('\n- '));
  let f = frame, i = 0; const lens = spec.scenes.map((s) => s.shots.reduce((m, q) => m + q.len, 0));
  while (i < spec.scenes.length - 1 && f >= lens[i]) { f -= lens[i]; i++; }
  return <AbsoluteFill style={{background: '#000'}}><SceneView e={spec} s={spec.scenes[i]} f={f} gain={spec.scenes[i].gain ?? gain} /></AbsoluteFill>;
};
