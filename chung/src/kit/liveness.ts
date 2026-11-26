/** kit/liveness: a shot DECLARES what moves in it, so QA tools (and reviewers) can read it without rendering.
 *  Floors are bible 7.2. It is REQUIRED on a KitShot, and shotComp() refuses to render a shot that fails it. */
export type MoverKind = 'camera' | 'puppet' | 'ambient' | 'effect' | 'state';
/** The ambient families that count (bible 7.2 / 7.4). Anything the place does not explain is not on the list:
 *  no dust, no motes, no flares, no bloom, no twinkle. Constant stars do not move, so they are not a mover. */
export const FAMILIES = ['flame', 'smoke', 'cloth', 'sky', 'light', 'weather', 'foliage', 'water', 'extras', 'creature', 'mechanical', 'paper', 'ink'] as const;
export type Family = (typeof FAMILIES)[number];
export type Mover = {
  name: string; kind: MoverKind;
  /** required on an ambient mover. flame (fire, candle, thruster) | smoke (also steam) | cloth (banner, flag, cape on a line)
   *  | sky (clouds, birds, bats) | light (a shaft, a lamp or window switching, a pulse) | weather (snow, rain)
   *  | foliage | water | extras (background figures) | creature (insects, an animal) | mechanical (a wheel, a ring, a
   *  gauge, any prop loop) | paper | ink (map and abstract shots) */
  family?: Family;
  /** acting or state changes this mover makes, as frames inside the shot */
  beats?: number[];
  /** where it is in the frame, [x0, y0, x1, y1] in 1280x720 pixels (optional, lets QA crop it) */
  box?: [number, number, number, number];
  note?: string;
};
export type ShotType = 'wideExterior' | 'wideInterior' | 'medium' | 'close' | 'insert' | 'abstract';
export type Liveness = {type: ShotType; movers: Mover[]};
export const LIVENESS_FLOORS: Record<ShotType, {families: number; movers: number}> = {
  wideExterior: {families: 3, movers: 5}, wideInterior: {families: 3, movers: 5}, medium: {families: 2, movers: 4},
  close: {families: 1, movers: 3}, insert: {families: 1, movers: 3}, abstract: {families: 4, movers: 5},
};
export const liveness = (type: ShotType, movers: Mover[]): Liveness => ({type, movers});
/** Returns the list of contract failures (empty = passes): camera present, every ambient mover in an allowed family,
 *  mover and ambient-family floors, a figure that acts in a wide or medium shot, at least one beat and one per 1.5 s
 *  (36 f), no two puppets changing on the same frame. */
export const checkLiveness = (l: Liveness | undefined, len: number): string[] => {
  if (!l || !Array.isArray(l.movers)) return ['no liveness declaration (KitShot.liveness is required)'];
  const out: string[] = [], fl = LIVENESS_FLOORS[l.type];
  if (!fl) return [`unknown shot type "${l.type}"`];
  if (!l.movers.some((m) => m.kind === 'camera')) out.push('no camera mover declared (G1)');
  const amb = l.movers.filter((m) => m.kind === 'ambient');
  amb.forEach((m) => { if (!m.family || !(FAMILIES as readonly string[]).includes(m.family)) out.push(`ambient mover "${m.name}" has family "${m.family ?? ''}"; allowed: ${FAMILIES.join(', ')} (no dust, motes, flares, bloom or twinkle)`); });
  l.movers.forEach((m) => { if (m.kind !== 'ambient' && m.family) out.push(`"${m.name}": only ambient movers take a family`); });
  // camera counts once, each puppet once, each ambient FAMILY once, effects and state changes once each
  const fam = new Set(amb.map((m) => m.family).filter((x) => x && (FAMILIES as readonly string[]).includes(x)));
  const movers = l.movers.filter((m) => m.kind !== 'ambient').length + fam.size;
  if (fam.size < fl.families) out.push(`${fam.size} ambient families, floor for ${l.type} is ${fl.families}`);
  if (movers < fl.movers) out.push(`${movers} independent movers, floor for ${l.type} is ${fl.movers}`);
  const pb = l.movers.filter((m) => m.kind === 'puppet');
  if ((l.type === 'wideExterior' || l.type === 'wideInterior' || l.type === 'medium') && !pb.some((m) => (m.beats ?? []).length > 0))
    out.push(`a ${l.type} shot needs a figure that acts: one puppet mover with at least one beat (bible 7.2)`);
  const beats = l.movers.flatMap((m) => m.beats ?? []).sort((a, b) => a - b);
  if (!beats.length) out.push('no acting or state change declared (G3)');
  const marks = [0, ...beats, len];
  for (let i = 1; i < marks.length; i++) if (marks[i] - marks[i - 1] > 36) out.push(`no event between frames ${marks[i - 1]} and ${marks[i]} (over 1.5 s, G5)`);
  for (let i = 0; i < pb.length; i++) for (let j = i + 1; j < pb.length; j++) {
    const same = (pb[i].beats ?? []).filter((b) => (pb[j].beats ?? []).includes(b));
    if (same.length) out.push(`${pb[i].name} and ${pb[j].name} change pose on the same frame (${same.join(', ')})`);
  }
  return out;
};
