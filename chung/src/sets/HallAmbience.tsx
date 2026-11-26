import React, {useMemo} from 'react';
import {Speck, Poly} from '../three/prims';
const PolyFlat: React.FC<{pts: [number, number][]; color: string}> = ({pts, color}) => <Poly pts={pts} color={color} fog={false} />;
import {Flare} from '../shots/bkit';

/** Ambient life for ThroneHall (adds only; never moves the architecture). */
type V3 = [number, number, number];
const rand = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

/** Dense star dust, bigger diamond stars and a few 4-point flares, all twinkling on their own phases,
 *  plus slow purple cloud lumps high in the sky (the reference's upper sky is banded with them). */
export const HallSky: React.FC<{frame: number}> = ({frame}) => {
  const dust = useMemo(() => { const r = rand(71); return Array.from({length: 420}, () => [(r() - 0.5) * 320, r() * 100 + 2, 0.1 + r() * 0.22] as const); }, []);
  const big = useMemo(() => { const r = rand(83); return Array.from({length: 34}, () => [(r() - 0.5) * 300, r() * 90 + 8, 0.45 + r() * 0.5] as const); }, []);
  const flares = useMemo(() => { const r = rand(97); return Array.from({length: 10}, () => [(r() - 0.5) * 260, 12 + r() * 80, 1.1 + r() * 0.8] as const); }, []);
    const drift = frame * 0.03;
  return (
    <group>
      {/* purple cloud band high in the sky: two scalloped layers (lighter in front), drifting slowly */}
      {[['#2b2766', 66, 0, 7], ['#352e74', 59, 0.1, 5.5]].map(([c, y0, dz, amp], j) => {
        const pts: [number, number][] = [[-230, 160]];
        for (let i = 0; i <= 46; i++) { const x = -230 + i * 10; pts.push([x, (y0 as number) + Math.abs(Math.sin(i * 0.9 + j * 1.3)) * (amp as number) + (i % 3) * 1.5]); }
        pts.push([230, 160]);
        const geo = pts;
        return <group key={j} position={[drift * (1 + j * 0.4), 0, -157.6 + (dz as number)]}><PolyFlat pts={geo} color={c as string} /></group>;
      })}
      {dust.map(([x, y, s], i) => {
        const tw = 0.5 + 0.5 * Math.sin(frame * (0.1 + (i % 11) * 0.025) + i * 1.93);
        return <Speck key={`d${i}`} pos={[x, y, -155.5]} s={s * (0.6 + 0.6 * tw)} color={'#ffffff'} opacity={0.3 + 0.6 * tw} />;
      })}
      {big.map(([x, y, s], i) => {
        const tw = 0.5 + 0.5 * Math.sin(frame * (0.18 + (i % 5) * 0.04) + i * 2.9);
        return <Speck key={`b${i}`} pos={[x, y, -155.4]} s={s * (0.55 + 0.7 * tw)} color={i % 6 ? '#ffffff' : '#fff1b8'} opacity={0.5 + 0.5 * tw} />;
      })}
      {flares.map(([x, y, s], i) => {
        const tw = 0.5 + 0.5 * Math.sin(frame * (0.16 + (i % 4) * 0.05) + i * 1.3);
        return <Flare key={`f${i}`} pos={[x, y, -155.3]} s={s * (0.6 + 0.6 * tw)} opacity={0.55 + 0.45 * tw} />;
      })}
    </group>
  );
};

/** Short glints that pop on the gold sun ring and on the throne balls, each on its own cycle. */
export const HallGlints: React.FC<{frame: number}> = ({frame}) => {
  const ring: V3[] = [-0.2, 0.5, 1.2, 1.9, 2.6, 3.2].map((a) => [-1.2 + Math.cos(a) * 4.75, 6.1 + Math.sin(a) * 4.75, -9.3]);
  const balls: V3[] = [[-3.77, 4.25, -6.45], [1.37, 4.25, -6.45], [-1.2, 7.45, -7.45], [1.1, 2.68, -7.55], [4.4, 2.68, -7.55]];
  const pts = [...ring, ...balls];
  return (
    <group>
      {pts.map((p, i) => {
        const P = 34 + (i % 4) * 7, ph = (frame + i * 11) % P, o = Math.max(0, 1 - Math.abs(ph - 4) / 4);
        return <Flare key={i} pos={p} s={(i < ring.length ? 0.32 : 0.22) * (0.4 + o)} color={'#fff6d6'} opacity={o} />;
      })}
    </group>
  );
};
