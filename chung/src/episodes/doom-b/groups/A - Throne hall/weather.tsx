import React, {useMemo} from 'react';
import {Disc, Puff, rand} from '../../../../kit';
import type {V3} from '../../../../kit';
import {SNOW, CLOUDS} from '../../shared';
import {CloudCard} from './hall';

/* The film's time device, owned by group A (shared.ts SNOW / CLOUDS): three conjured clouds and the snow under them.
 * Everything is a function of the FILM frame F, so S3, S4 and S5 show one continuous state machine:
 *   clouds pop in at 167 / 169 / 171, drift right, and drift back (five times faster, so it is seen) from 291;
 *   snow leaves the clouds at 179, falls, STOPS at 280 (over 4 f), hangs, and rises from 291, accelerating
 *   (the near layer is about 95 px above its hanging place at the cut, 305). */

/** how far the snow has fallen by film frame F, in "frames of normal fall" (it shrinks again once the snow rises) */
export const snowTravel = (F: number): number => {
  const a = SNOW.fallFrom, h = SNOW.hangAt, r = SNOW.riseFrom;
  if (F <= a) return 0;
  if (F <= h) return F - a;
  const stop = h - a + (F >= h + 4 ? 2 : (F - h) - ((F - h) ** 2) / 8); // hard stop: decelerates over 4 f
  if (F <= r) return stop;
  return stop - ((F - r) ** 2) / 11; // rises, accelerating: at the cut (304) the near layer is about 95 px, the far one about 64 px above where it hung
};
/** cloud drift in seconds of travel to the right; from 291 they run back five times as fast */
export const cloudTravel = (F: number, pop: number): number => (Math.max(0, Math.min(F, CLOUDS.reverseFrom) - pop) - 5 * Math.max(0, F - CLOUDS.reverseFrom)) / 24;

export type CloudSpot = {pos: V3; s: number};
/** The three conjured clouds. `pop` = pop in with a puff at their film frames (S3); otherwise they are simply there. */
export const HallClouds: React.FC<{F: number; spots: CloudSpot[]; speed?: number; pop?: boolean}> = ({F, spots, speed = 0.9, pop}) => (
  <>
    {spots.map((c, i) => {
      const p0 = CLOUDS.popFrames[i]; if (F < p0) return null;
      const k = pop ? [0.55, 1.12, 0.96, 1][Math.min(3, Math.floor((F - p0) / 2))] : 1, x = c.pos[0] + speed * cloudTravel(F, p0) * (1 + i * 0.25);
      return (
        <group key={i}>
          <CloudCard pos={[x, c.pos[1], c.pos[2]]} s={c.s * k} />
          {pop ? <Puff pos={[x, c.pos[1] - c.s * 0.4, c.pos[2] + 0.3]} f={F} f0={p0} dur={8} r={c.s * 1.5} count={6} color={CLOUDS.tones.top} seed={i} /> : null}
        </group>
      );
    })}
  </>
);

export type SnowLayer = {
  /** x range, top (cloud base) and bottom of the layer, its depth, flake radius in world units */
  x0: number; x1: number; top: number; bottom: number; z: number; r: number;
  /** world units fallen per frame */
  speed: number;
  /** x ranges of this layer left empty (a figure stands behind them: a hanging flake there reads as a spot on the figure) */
  skip?: [number, number][];
};
/** Crisp cream-blue flakes in two depth layers (near = SNOW.color, far = SNOW.colorFar).
 *  `emit` (S3): the flakes come out of the cloud base. They are pre-rolled: from film 176 the band under the clouds
 *  fills from the top down in three drawings (176 / 178 / 180), so by 179-180 a third of the sky is already snowing
 *  and the fall is plain well before the cut. Without `emit` the field is already full (S4, S5).
 *  Flakes drift sideways only as far as they have fallen, so they hang truly still at 280 and retrace their path
 *  when they rise. */
export const Snow: React.FC<{F: number; near: SnowLayer; far: SnowLayer; count?: number; emit?: boolean; seed?: number}> = ({F, near, far, count = SNOW.count, emit, seed = 7}) => {
  const ps = useMemo(() => { const r = rand(seed * 53 + 11); return Array.from({length: count}, (_, i) => ({x: r(), y: r(), near: i % 2 === 0, v: 0.8 + r() * 0.4, ph: r() * 6.28, k: 0.8 + r() * 0.4})); }, [count, seed]);
  const s = emit ? Math.max(0, F - (SNOW.fallFrom - 3)) : snowTravel(F);
  return (
    <>
      {ps.map((p, i) => {
        const L = p.near ? near : far, Hh = L.top - L.bottom, d = s * L.speed * p.v;
        if (emit && F < SNOW.fallFrom - 3 + 2 * Math.floor(p.y * 3)) return null;
        const q = emit ? d + p.y * Hh * 0.42 : d + p.y * Hh;
        if (emit && q > Hh) return null;
        const x = L.x0 + p.x * (L.x1 - L.x0) + Math.sin(d * 1.1 + p.ph) * 0.14 * (L.r / 0.03) * 0.3;
        if (L.skip?.some(([a, b]) => x > a && x < b)) return null;
        const y = L.top - (((q % Hh) + Hh) % Hh);
        return <Disc key={i} r={L.r * p.k} color={p.near ? SNOW.color : SNOW.colorFar} pos={[x, y, L.z + (i % 5) * 0.01]} seg={12} />;
      })}
    </>
  );
};
