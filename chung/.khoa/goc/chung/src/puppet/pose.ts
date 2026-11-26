import type {V3} from '../kit';
import {NUM_KEYS, Num, Pose, PuppetPart, PuppetPiece, PuppetRig, REST, Pt} from './types';

/** puppet/pose: channels -> piece transforms. Pure functions; nothing here knows any character. */
const list = (n?: string | string[]) => (n === undefined ? [] : Array.isArray(n) ? n : [n]);
const rad = (d: number) => (d * Math.PI) / 180;
/** depth step between two pieces whose `z` differs by 1 (world units) */
export const PIECE_Z = 0.004;

/** adds a transform onto a piece: rot / x / y / skew add, sx / sy multiply, hide is sticky */
const put = (out: Record<string, PuppetPart>, name: string, p: PuppetPart) => {
  const o = out[name] ?? {};
  out[name] = {
    rot: (o.rot ?? 0) + (p.rot ?? 0), x: (o.x ?? 0) + (p.x ?? 0), y: (o.y ?? 0) + (p.y ?? 0), skew: (o.skew ?? 0) + (p.skew ?? 0),
    sx: (o.sx ?? 1) * (p.sx ?? 1), sy: (o.sy ?? 1) * (p.sy ?? 1), hide: o.hide || p.hide || undefined,
  };
};

/** the rig's neutral numbers with a pose laid over them */
export const fullPose = (rig: PuppetRig, pose: Pose = {}): Num & Pose => ({...REST, ...(rig.rest ?? {}), ...pose}) as Num & Pose;
const SHORT = ['mouth', 'handL', 'handR'] as const;
/** Throws on a pick the rig does not have (a typo would otherwise show the default drawing and never react) and on a
 *  channel outside rig.limits. Called by solve(), so by every <Puppet> on every frame, and by lintBeats(). */
export const checkPose = (rig: PuppetRig, pose: Pose): void => {
  // a pick is fine when the front drawing or the view being shown has it
  const shown = pose.view && pose.view !== 'front' ? rig.views?.[pose.view] : undefined, rigs = shown ? [rig, shown] : [rig];
  if (pose.view !== undefined && pose.view !== 'front' && !shown) throw new Error(`puppet: rig ${rig.name} has no view "${pose.view}" (it has: front${Object.keys(rig.views ?? {}).map((v) => `, ${v}`).join('')})`);
  const groups = Array.from(new Set(rigs.flatMap((r) => Object.keys(r.variants ?? {})))), ids = (g: string) => Array.from(new Set(rigs.flatMap((r) => Object.keys(r.variants?.[g]?.options ?? {}))));
  Object.entries(pose.sel ?? {}).forEach(([g, id]) => {
    if (!groups.includes(g)) throw new Error(`puppet: rig ${rig.name} has no variant group "${g}" (it has: ${groups.join(', ') || 'none'})`);
    if (!ids(g).includes(id)) throw new Error(`puppet: rig ${rig.name}, group "${g}" has no option "${id}" (it has: ${ids(g).join(', ')})`);
  });
  // the shorthands are checked only when the rig has that group (talk() on a rig without mouths is simply ignored)
  SHORT.forEach((g) => { const id = pose[g]; if (id !== undefined && groups.includes(g) && !ids(g).includes(id)) throw new Error(`puppet: rig ${rig.name}, ${g} has no option "${id}" (it has: ${ids(g).join(', ')})`); });
  Object.entries(rig.limits ?? {}).forEach(([k, lim]) => {
    const v = pose[k as keyof Num];
    if (v !== undefined && lim && (v < lim[0] - 3 || v > lim[1] + 3)) throw new Error(`puppet: rig ${rig.name}, channel ${k} = ${v.toFixed(1)} is outside its range ${lim[0]}..${lim[1]}`);
  });
};
/** which option of a variant group a pose selects */
export const picked = (rig: PuppetRig, pose: Pose, group: string): string => {
  const v = rig.variants?.[group]; if (!v) return '';
  const want = pose.sel?.[group] ?? (pose as Record<string, unknown>)[group] ?? rig.rest?.sel?.[group] ?? (rig.rest as Record<string, unknown> | undefined)?.[group];
  return typeof want === 'string' && v.options[want] ? want : v.default;
};
/** the drawing a pose asks for: the rig itself, or one of its views (an unknown view throws) */
export const viewOf = (rig: PuppetRig, pose: Pose): PuppetRig => {
  if (!pose.view || pose.view === 'front') return rig;
  const v = rig.views?.[pose.view]; if (!v) throw new Error(`puppet: rig ${rig.name} has no view "${pose.view}"`);
  return v;
};
/** a pose as one view sees it: picks that belong to another drawing of the character are dropped */
const forView = (rig: PuppetRig, r: PuppetRig, pose: Pose): Pose => {
  if (r === rig) return pose;
  const V = r.variants ?? {}, out: Pose = {...pose, view: undefined, sel: Object.fromEntries(Object.entries(pose.sel ?? {}).filter(([g, id]) => V[g]?.options[id]))};
  SHORT.forEach((g) => { const id = out[g]; if (id !== undefined && V[g] && !V[g].options[id]) delete out[g]; });
  return out;
};

export type Solved = {parts: Record<string, PuppetPart>; root: {x: number; y: number; sx: number; sy: number}};

/** Channels -> per-piece transforms (canvas px, degrees clockwise) plus the whole-puppet offset and squash.
 *  `rig` is the drawing itself (use viewOf first when the pose may carry a view). */
export const solve = (rig: PuppetRig, pose: Pose = {}): Solved => {
  checkPose(rig, {...pose, view: undefined});
  const c = fullPose(rig, pose), out: Record<string, PuppetPart> = {}, R = rig.roles;
  // body, cloth (shears, so the hem stays level and never dips through the floor), hem, head, hips
  (R.body ?? []).forEach((n) => put(out, n, {rot: c.lean}));
  (R.cloth ?? []).forEach((e) => (typeof e === 'string' ? put(out, e, {skew: c.cloth}) : put(out, e.piece, {skew: e.follows === 'head' ? c.hair : c.cloth})));
  if (c.hem) (R.hem ?? []).forEach((n) => put(out, n, {sx: c.hem < 0 ? -1 : 1, rot: c.hem * 1.5}));
  if (R.head) put(out, R.head, {rot: c.headTilt, x: c.headX, y: -c.headY});
  (R.hips ?? []).forEach((n) => put(out, n, {y: -c.bob}));
  // limbs: left as given, right mirrored, so "+ = outward" on both sides
  (['L', 'R'] as const).forEach((s) => {
    const k = s === 'L' ? 1 : -1, a = R.arms?.[s], l = R.legs?.[s];
    (a?.upper ?? []).forEach((n) => put(out, n, {rot: k * c[`sh${s}`]}));
    (a?.lower ?? []).forEach((n) => put(out, n, {rot: k * c[`el${s}`]}));
    (a?.end ?? []).forEach((n) => put(out, n, {rot: k * c[`wr${s}`]}));
    (l?.upper ?? []).forEach((n) => put(out, n, {rot: k * c[`hip${s}`]}));
    (l?.lower ?? []).forEach((n) => put(out, n, {rot: k * c[`knee${s}`]}));
    (l?.end ?? []).forEach((n) => put(out, n, {rot: k * c[`foot${s}`]}));
  });
  // layered face with parallax
  const F = rig.face;
  if (F) {
    const T = c.turn, U = c.up, P = F.parallax, open = c.eyeOpen;
    if (F.base) put(out, F.base, {x: P.base[0] * T, y: -P.base[1] * U});
    if (F.nose) put(out, F.nose, {x: P.nose[0] * T, y: -P.nose[1] * U});
    list(F.mouth).forEach((n) => put(out, n, {x: P.mouth[0] * T, y: -P.mouth[1] * U}));
    (F.extras ?? []).forEach((e) => put(out, e.piece, {x: e.turn * T, y: -e.up * U}));
    (['L', 'R'] as const).forEach((s) => {
      const k = s === 'L' ? 1 : -1, E = F.eyes[s]; if (!E) return;
      const far = (s === 'R' && T > 0) || (s === 'L' && T < 0);
      const sx = far ? 1 - (F.farNarrow ?? 0.16) * Math.abs(T) : 1 + (F.nearWiden ?? 0.03) * Math.abs(T);
      const ex = P.eyes[0] * T, ey = -P.eyes[1] * U, slant = k * c.eyeSlant, oy = F.openScalesWhite ? open : 1;
      const u = c.px * F.pupilTravel[0] * sx; // pupil travel along the eye, following its slant
      list(E.plate).forEach((n) => put(out, n, {x: ex, y: ey, sx}));
      list(E.white).forEach((n) => put(out, n, {x: ex, y: ey, rot: slant, sx, sy: F.openScalesWhite ? Math.max(0.02, open) : 1}));
      list(E.pupil).forEach((n) => put(out, n, {x: ex + u, y: ey + u * Math.tan(rad(slant)) - c.py * F.pupilTravel[1] * oy, sy: F.openScalesWhite ? Math.max(0.02, Math.min(1, open * 1.3)) : 1}));
      list(E.brow).forEach((n) => put(out, n, {x: ex, y: ey - (s === 'L' ? c.browYL : c.browYR), rot: k * (s === 'L' ? c.browL : c.browR), sx}));
      list(E.lid).forEach((n) => put(out, n, open >= 0.95 ? {hide: true} : {x: ex, y: ey - (F.lidTravel ?? 0) * Math.max(0, open)}));
    });
  }
  // variant groups: hide every option that is not picked
  Object.entries(rig.variants ?? {}).forEach(([g, v]) => {
    const on = new Set(v.options[picked(rig, c, g)] ?? []);
    Object.values(v.options).forEach((names) => names.forEach((n) => { if (!on.has(n)) put(out, n, {hide: true}); }));
  });
  // raw extras: the rig's own rest offsets, then the pose's
  Object.entries(rig.rest?.parts ?? {}).forEach(([n, p]) => put(out, n, p));
  Object.entries(pose.parts ?? {}).forEach(([n, p]) => put(out, n, p));
  return {parts: out, root: {x: c.bodyX, y: c.bodyY + (R.hips?.length ? 0 : c.bob), sx: 1 + 0.5 * c.squash, sy: 1 - c.squash}};
};
/** the drawing a pose shows and its solved transforms (what <Puppet> draws) */
export const solveView = (rig: PuppetRig, pose: Pose = {}): {r: PuppetRig; solved: Solved} => {
  checkPose(rig, pose);
  const r = viewOf(rig, pose);
  return {r, solved: solve(r, forView(rig, r, pose))};
};

/** A canvas point riding on a piece, after the pose: [x to the right of centerX, y above the ground line] in canvas px
 *  (whole-puppet offset and squash included), plus the piece's accumulated turn in degrees. */
export const canvasPoint = (r: PuppetRig, s: Solved, piece: string, at: Pt): {x: number; y: number; rot: number} => {
  let [x, y] = at, rot = 0; let name: string | undefined = piece;
  while (name) {
    const p: PuppetPiece | undefined = r.pieces[name]; if (!p) throw new Error(`puppet: rig ${r.name} has no piece "${name}"`);
    const ps = s.parts[name] ?? {}, a = rad(ps.rot ?? 0), dy = (y - p.pivot[1]) * (ps.sy ?? 1), dx = ((x - p.pivot[0]) - Math.tan(rad(ps.skew ?? 0)) * (y - p.pivot[1])) * (ps.sx ?? 1);
    x = p.pivot[0] + dx * Math.cos(a) - dy * Math.sin(a) + (ps.x ?? 0);
    y = p.pivot[1] + dx * Math.sin(a) + dy * Math.cos(a) + (ps.y ?? 0);
    rot += ps.rot ?? 0;
    name = p.parent;
  }
  return {x: (x - r.centerX) * s.root.sx + s.root.x, y: (r.groundY - y) * s.root.sy + s.root.y, rot};
};

const warned = new Set<string>();
/** WORLD placement of something attached to a piece (a held prop, a glow, sparks, a name-tag arrow), for a pose.
 *  `at` = a canvas point [x, y] riding on `piece`, or the name of one of rig.points (then `piece` is ignored).
 *  Returns pos (world; its z sits just in front of that piece, `lift` piece-steps nearer, so a prop can sit between
 *  layers: lift -0.5 puts it behind the piece), rot = the piece's turn as a three.js z rotation in RADIANS (give it
 *  to <group rotation={[0, 0, rot]}> and the prop turns with the hand), and deg = the same turn in degrees, clockwise.
 *  POINTS ARE PER VIEW: when the pose shows a view that lacks the named point (a one-drawing back view), the front
 *  rig's point is used, mirrored left-right, with one console warning. Give the view its own point for a hand prop. */
export const puppetAttach = (rig: PuppetRig, pose: Pose, piece: string, at: Pt | string, height: number, pos: V3, flip = false, lift = 0.5): {pos: V3; rot: number; deg: number} => {
  let {r, solved} = solveView(rig, pose), mirror = 1;
  if (typeof at === 'string') {
    let p = r.points?.[at];
    if (!p && r !== rig && rig.points?.[at]) {
      const key = `${rig.name}/${r.name}/${at}`;
      if (!warned.has(key)) { warned.add(key); console.warn(`puppet: view ${r.name} has no point "${at}"; using the front rig's point, mirrored`); }
      p = rig.points[at]; r = rig; solved = solve(rig, {...pose, view: undefined}); mirror = -1;
    }
    if (!p) throw new Error(`puppet: rig ${r.name} has no point "${at}" (it has: ${Object.keys(r.points ?? {}).join(', ') || 'none'})`);
    piece = p.piece; at = p.at;
  }
  const c = canvasPoint(r, solved, piece, at), s = height / r.height, k = (flip ? -1 : 1) * mirror;
  return {pos: [pos[0] + c.x * s * k, pos[1] + c.y * s, pos[2] + (r.pieces[piece].z + lift) * PIECE_Z], rot: -rad(c.rot) * k, deg: c.rot * k};
};
/** WORLD position of a point on a piece for a given pose (puppetAttach without the angle; the point sits in front of
 *  the whole puppet). */
export const puppetPoint = (rig: PuppetRig, pose: Pose, piece: string, at: Pt | string, height: number, pos: V3, flip = false): V3 => {
  const a = puppetAttach(rig, pose, piece, at, height, pos, flip);
  return [a.pos[0], a.pos[1], pos[2] + 0.06];
};

/** adds poses: numbers add (the first pose is the base), picks and views take the last one given, raw parts merge */
export const mix = (base: Pose, ...more: Pose[]): Pose => {
  const out: Pose = {...base, sel: {...(base.sel ?? {})}, parts: {...(base.parts ?? {})}};
  more.forEach((m) => {
    NUM_KEYS.forEach((k) => { if (m[k] !== undefined) out[k] = (out[k] ?? 0) + (m[k] as number); });
    (['mouth', 'handL', 'handR', 'view'] as const).forEach((k) => { if (m[k] !== undefined) out[k] = m[k]; });
    Object.assign(out.sel!, m.sel ?? {});
    Object.entries(m.parts ?? {}).forEach(([n, p]) => put(out.parts!, n, p));
  });
  return out;
};
