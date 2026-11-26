/** kit/math: types and deterministic helpers. No Math.random anywhere in a shot: use these. */
export type V3 = [number, number, number];
export type Pt = [number, number];

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** seeded generator: const r = rand(7); r() -> 0..1, same sequence every render */
export const rand = (seed: number) => { let s = Math.max(1, Math.floor(Math.abs(seed)) % 2147483646 || 1); return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
/** stateless hash -> 0..1 (same inputs, same output) */
export const hash = (a: number, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
/** seeded pick from a list */
export const pick = <T,>(list: T[], a: number, b = 0): T => list[Math.floor(hash(a, b) * list.length) % list.length];
export const deg = (d: number) => (d * Math.PI) / 180;
