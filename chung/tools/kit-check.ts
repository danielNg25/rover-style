/* Kit and puppet self-check (no browser). Run: ./kit-check.sh
 * 1 every rig, acted by sample beat lists: nothing changes on an odd frame; head / hand steps stay inside the limits
 * 2 bad picks and out-of-range channels throw    3 the camera guard rejects static, slow, fast, snap and jitter rigs
 * 4 liveness rejects forbidden families and a wide shot without an acting figure */
import {act, lintBeats, beatSpans, trackedPoints, canvasPoint, solve, solveView, puppetAttach, puppetPoint, walk, mix, Beat} from '../src/puppet';
import {DOOM, DOOM_FACE} from '../src/chars/_lib/doom';
import {KING, KING_FACE} from '../src/chars/_lib/king';
import {VILLAGER} from '../src/chars/_lib/villager';
import {WALKER} from '../src/chars/_lib/walker';
import {camPush, camHold, camTruck, camShake, assertCamMoves, checkLiveness, liveness, track, nFor, litColor, solidFor, CamRig} from '../src/kit';

let fails = 0;
const ok = (name: string, cond: boolean, info = '') => { if (!cond) fails++; console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${info ? `  ${info}` : ''}`); };
const throws = (fn: () => unknown) => { try { fn(); return ''; } catch (e) { return (e as Error).message; } };

// PUPPET.md worked example
const REACT: Beat[] = [
  {f: 0, ...DOOM_FACE.neutral},
  {f: 8, turn: -0.7, px: -0.7, headTilt: -3},
  {f: 18, blink: true},
  {f: 22, ...DOOM_FACE.wide, bodyX: 16, bodyY: 10, lean: 6, squash: -0.04},
  {f: 28, bodyY: 0, squash: 0.05},
  {f: 34, shL: 70, elL: 95, handL: 'open', squash: 0},
  {f: 50, bodyX: 4, lean: 1, shL: 25, elL: 40, ...DOOM_FACE.squint, turn: -0.5},
  {f: 62, handL: 'fist', shL: 6, elL: 0},
];
const BIG: Beat[] = [{f: 0}, {f: 4, shL: 120, elL: 100, shR: 90, lean: 9, bodyX: 60, headTilt: 14, turn: 1, n: 2}, {f: 40, shL: 0, elL: 0, shR: 0, lean: -6, bodyX: -40, headTilt: -10, turn: -1}];
const KB: Beat[] = [{f: 0, ...KING_FACE.smug}, {f: 12, handR: 'chin', shR: 8, lean: -1.5}, {f: 28, ...KING_FACE.shock, handL: 'up', handR: 'up', shL: -20, shR: -20, lean: 3, bodyY: 26, n: 2}, {f: 44, shL: 12, shR: 12, bodyY: 0}];
const VB: Beat[] = [{f: 0}, {f: 10, lean: -4, bodyX: -8}, {f: 30, sel: {pic: 'shock'}, lean: 2, bodyX: 6}];
const WB: Beat[] = [{f: 0}, {f: 12, headTilt: 9, shL: 40}, {f: 40, headTilt: -5, lean: 3}];
const LEN = 72;
ok('lint: DOOM worked example', lintBeats({doom: {beats: REACT, rig: DOOM, seed: 1}}, LEN).length === 0, lintBeats({doom: {beats: REACT, rig: DOOM, seed: 1}}, LEN).join(' | '));
ok('lint: DOOM huge beats with n: 2 (limits still held)', lintBeats({doom: {beats: BIG, rig: DOOM, seed: 4}}, LEN).length === 0, lintBeats({doom: {beats: BIG, rig: DOOM, seed: 4}}, LEN).join(' | '));
ok('lint: KING', lintBeats({king: {beats: KB, rig: KING, seed: 2}}, LEN).filter((x) => !x.includes('no beat between')).length === 0, lintBeats({king: {beats: KB, rig: KING, seed: 2}}, LEN).join(' | '));
ok('lint: VILLAGER', lintBeats({vil: {beats: VB, rig: VILLAGER, seed: 3}}, LEN).filter((x) => !x.includes('no beat between')).length === 0, lintBeats({vil: {beats: VB, rig: VILLAGER, seed: 3}}, LEN).join(' | '));
ok('lint: WALKER + walk()', lintBeats({w: {beats: WB, rig: WALKER, seed: 5, extra: (f) => walk(f, {sc: WALKER.height / 520, leg: 200})}}, LEN).filter((x) => !x.includes('no beat between')).length === 0, lintBeats({w: {beats: WB, rig: WALKER, seed: 5, extra: (f) => walk(f, {sc: WALKER.height / 520, leg: 200})}}, LEN).join(' | '));
console.log('     spans of the worked example: ' + beatSpans(REACT, {rig: DOOM}).map((x) => `${x.f}-${x.end}`).join(' '));
// odd frames, counted directly
let odd = 0;
([[DOOM, REACT], [DOOM, BIG], [KING, KB], [VILLAGER, VB], [WALKER, WB]] as const).forEach(([rig, beats], i) => {
  for (let f = 1; f < LEN; f += 2) if (JSON.stringify(solveView(rig, act(beats as Beat[], f, {rig, seed: i}))) !== JSON.stringify(solveView(rig, act(beats as Beat[], f - 1, {rig, seed: i})))) odd++;
});
ok('no change on any odd frame (5 casts x 36 odd frames)', odd === 0, `${odd} odd-frame changes`);
ok('lint reports a per-frame sine', lintBeats({d: {beats: REACT, rig: DOOM, extra: (f) => ({headTilt: Math.sin(f / 5) * 3})}}, LEN).some((x) => x.includes('odd frame')));
ok('lint reports a one-drawing pop', lintBeats({d: {beats: REACT, rig: DOOM, extra: (f) => (f >= 40 ? {bodyX: 70} : {})}}, LEN).some((x) => x.includes('pops')));
// largest step of the head top and of a hand over one drawing, measured on the solved puppet
const maxStep = (rig: typeof DOOM, beats: Beat[], seed: number) => { const m: Record<string, number> = {}; for (let f = 2; f < LEN; f += 2) trackedPoints(rig).forEach((q) => { const a = canvasPoint(rig, solve(rig, act(beats, f - 2, {rig, seed})), q.piece, q.at), b = canvasPoint(rig, solve(rig, act(beats, f, {rig, seed})), q.piece, q.at); m[q.name] = Math.max(m[q.name] ?? 0, Math.hypot(a.x - b.x, a.y - b.y)); }); return Object.entries(m).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(', '); };
console.log(`     largest step in one drawing, canvas px: worked example: ${maxStep(DOOM, REACT, 1)};  huge beats with n: 2: ${maxStep(DOOM, BIG, 4)}`);
// soles stay on the ground line through a walk
let sole = 0;
for (let f = 0; f < 48; f++) { const p = walk(f, {sc: WALKER.height / 520, leg: 200}), s = solve(WALKER, p); (['footL', 'footR'] as const).forEach((n) => { const piece = WALKER.pieces[n]; let low = -1e9; ([[piece.x, 520], [piece.x + piece.w, 520]] as [number, number][]).forEach((at) => { const pt = puppetPoint(WALKER, p, n, at, 500, [0, 0, 0]); low = Math.max(low, -pt[1]); }); sole = Math.max(sole, low); void s; }); }
ok('walk(): no sole sinks more than 6 px under the ground line', sole < 6, `deepest ${sole.toFixed(1)} px`);
// picks and ranges
ok('unknown sel option throws', throws(() => solve(VILLAGER, {sel: {pic: 'nope'}})).includes('no option "nope"'));
ok('unknown sel group throws', throws(() => solve(DOOM, {sel: {hat: 'x'}})).includes('no variant group'));
ok('unknown hand id throws', throws(() => solve(DOOM, {handL: 'opne'})).includes('no option "opne"'));
ok('unknown view throws', throws(() => solveView(DOOM, {view: 'side'})).includes('no view "side"'));
ok('out-of-range channel throws', throws(() => solve(KING, {shL: 200})).includes('outside its range'));
ok('lintBeats reports a bad pick', lintBeats({v: {beats: [{f: 0}, {f: 4, sel: {pic: 'nope'}}], rig: VILLAGER}}, 24).some((x) => x.includes('nope')));
ok('point on a view without points falls back (no throw)', throws(() => puppetPoint(DOOM, {view: 'back'}, '', 'palmR', 2.7, [0, 0, 0])) === '');
const att = puppetAttach(DOOM, {shR: 60}, '', 'palmR', 2.7, [0, 0, 0]);
ok('puppetAttach returns an angle and a depth', Math.abs(att.deg + 60) < 1e-6 && att.pos[2] > 0.03 && att.pos[2] < 0.04, `deg ${att.deg.toFixed(1)}, z ${att.pos[2].toFixed(4)}`);
// track
const first = Math.abs(track(0, [[-2, 0], [0, 100]], nFor(100, 22)));
ok('track + nFor: first drawing inside the limit', first <= 22, `first step ${first.toFixed(1)} of 100 with n = ${nFor(100, 22)}`);
// camera guard
const base = {pos: [0, 2, 10] as [number, number, number], look: [0, 2, 0] as [number, number, number], fov: 30};
ok('camera: push 2 %/s passes', throws(() => assertCamMoves(camPush(base), 48)) === '');
ok('camera: hold with drift passes', throws(() => assertCamMoves(camHold(base), 48)) === '');
ok('camera: eased truck passes', throws(() => assertCamMoves(camTruck(base, {ease: true, len: 48}), 48)) === '');
ok('camera: shake on a hold passes', throws(() => assertCamMoves(camShake(camHold(base), {at: 20}), 48)) === '');
ok('camera: static throws', throws(() => assertCamMoves(((f: number) => base) as CamRig, 48)).includes('static'));
ok('camera: snap zoom 60 %/s throws', throws(() => assertCamMoves(camPush(base, {pctPerSec: 60}), 48)).includes('ceiling'));
ok('camera: jitter throws', throws(() => assertCamMoves(((f: number) => ({...base, pos: [Math.sin(f) * 3, 2, 10]})) as CamRig, 48)) !== '');
ok('camera: 0.2 %/s throws', throws(() => assertCamMoves(camPush(base, {pctPerSec: 0.2}), 48)).includes('floor'));
ok('camera: a jump cut inside the shot throws', throws(() => assertCamMoves(((f: number) => camPush(f < 24 ? base : {...base, pos: [0, 2, 7]})(f)) as CamRig, 48)).includes('jerks'));
// liveness
ok('liveness: dust / flare / bloom rejected', checkLiveness(liveness('wideInterior', [{name: 'c', kind: 'camera'}, {name: 'p', kind: 'puppet', beats: [10]}, {name: 'a', kind: 'ambient', family: 'dust' as never}, {name: 'b', kind: 'ambient', family: 'flare' as never}, {name: 'd', kind: 'ambient', family: 'bloom' as never}]), 30).filter((x) => x.includes('allowed')).length === 3);
ok('liveness: wide shot without an acting figure rejected', checkLiveness(liveness('wideInterior', [{name: 'c', kind: 'camera'}, {name: 'a', kind: 'ambient', family: 'flame'}, {name: 'b', kind: 'ambient', family: 'cloth'}, {name: 'd', kind: 'ambient', family: 'light'}, {name: 'e', kind: 'effect', beats: [10]}, {name: 'g', kind: 'state', beats: [20]}]), 30).some((x) => x.includes('figure that acts')));
ok('liveness: missing declaration rejected', checkLiveness(undefined, 30).length === 1);
// colour
console.log(`     nightExterior: a lit '#8a5a40' front shows ${litColor('nightExterior', '#8a5a40')}; to show '#8a5a40' give ${solidFor('nightExterior', '#8a5a40')}`);
console.log(fails ? `\n${fails} CHECK(S) FAILED` : '\nall checks passed');
process.exit(fails ? 1 : 0);
