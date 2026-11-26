import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rand, ro, Disc, Sparkle} from './flat2d';

/* Space backdrop pieces for the agent-a shots (pixel space). */

type Star = {x: number; y: number; s: number; b: number; ph: number; sp: number; amp: number; c: THREE.Color};
export type StarSpec = {
  seed: number; rect?: [number, number, number, number];
  tiny?: number; mid?: number; bright?: number;           // counts for the full rect
  clusters?: [number, number, number, number, number][]; // extra dust inside boxes: x0,y0,x1,y1,count
};

const WARM = ['#ffd9a3', '#ffc98a', '#ffe7b8'];
const COOL = ['#ffffff', '#eef1ff', '#f6f4ff', '#fff6e0'];

export const makeStars = (sp: StarSpec) => {
  const r = rand(sp.seed);
  const [x0, y0, x1, y1] = sp.rect ?? [-20, -20, 1300, 740];
  const pick = (a: string[]) => new THREE.Color(a[Math.floor(r() * a.length)]);
  const mk = (n: number, smin: number, smax: number, amp: number, warmP: number, bx = [x0, y0, x1, y1]): Star[] =>
    Array.from({length: n}, () => ({
      x: bx[0] + r() * (bx[2] - bx[0]), y: bx[1] + r() * (bx[3] - bx[1]), s: smin + r() * r() * (smax - smin),
      b: 0.55 + r() * 0.45, ph: r() * 6.28, sp: 0.15 + r() * 0.35, amp: amp * (0.4 + r() * 0.6), c: pick(r() < warmP ? WARM : COOL),
    }));
  const tiny = mk(sp.tiny ?? 1500, 0.55, 1.4, 0.5, 0.08);
  (sp.clusters ?? []).forEach(([a, b, c, d, n]) => tiny.push(...mk(n, 0.55, 1.5, 0.5, 0.05, [a, b, c, d])));
  const mid = mk(sp.mid ?? 180, 1.5, 2.6, 0.45, 0.15);
  const bright = mk(sp.bright ?? 45, 3.2, 5.6, 0.3, 0.3);
  return {tiny, mid, bright};
};

/** all stars of one class as diamonds in ONE geometry, rebuilt each frame (twinkle: brightness + size on own phase) */
const StarLayer: React.FC<{stars: Star[]; f: number; z: number; round?: boolean}> = ({stars, f, z}) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(stars.length * 12), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(stars.length * 12), 3));
    g.setIndex(Array.from({length: stars.length}, (_, i) => [i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3]).flat());
    return g;
  }, [stars]);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute, col = geo.getAttribute('color') as THREE.BufferAttribute;
  stars.forEach((st, i) => {
    const tw = 0.5 + 0.5 * Math.sin(f * st.sp + st.ph); // 0..1
    const k = st.b * (1 - st.amp * tw), s = st.s * (1 - 0.35 * st.amp * tw);
    const v = [[st.x, st.y - s], [st.x + s, st.y], [st.x, st.y + s], [st.x - s, st.y]];
    v.forEach(([x, y], j) => { pos.setXYZ(i * 4 + j, x, y, 0); col.setXYZ(i * 4 + j, st.c.r * k, st.c.g * k, st.c.b * k); });
  });
  pos.needsUpdate = true; col.needsUpdate = true;
  return (
    <mesh geometry={geo} renderOrder={ro(z)} frustumCulled={false}>
      <meshBasicMaterial vertexColors transparent depthTest={false} depthWrite={false} fog={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

export const StarField: React.FC<{stars: ReturnType<typeof makeStars>; f: number; z: number; flares?: [number, number, number][]}> = ({stars, f, z, flares = []}) => (
  <>
    <StarLayer stars={stars.tiny} f={f} z={z} />
    <StarLayer stars={stars.mid} f={f} z={z + 0.001} />
    {/* soft halo around the bright ones (small, so it reads as glow and not as a bokeh disc) */}
    {stars.bright.map((st, i) => {
      const tw = 0.5 + 0.5 * Math.sin(f * st.sp + st.ph);
      return (
        <group key={i}>
          <Disc x={st.x} y={st.y} r={st.s * 2.0} seg={18} color={'#fff1d6'} opacity={0.025 + 0.02 * (1 - tw)} z={z + 0.002} add />
          <Disc x={st.x} y={st.y} r={st.s * 1.25} seg={18} color={'#fff6e4'} opacity={0.06 + 0.04 * (1 - tw)} z={z + 0.0021} add />
        </group>
      );
    })}
    <StarLayer stars={stars.bright} f={f} z={z + 0.003} />
    {flares.map(([x, y, s], i) => {
      const tw = 0.5 + 0.5 * Math.sin(f * 0.33 + i * 2.1);
      return (
        <group key={i}>
          <Disc x={x} y={y} r={s * 0.45} seg={18} color={'#fff0c8'} opacity={0.18} z={z + 0.004} add />
          <Sparkle x={x} y={y} s={s * (0.8 + 0.25 * tw)} z={z + 0.005} opacity={0.75 + 0.25 * tw} />
        </group>
      );
    })}
  </>
);

/** nebula cloud: base lumps + lighter inner lumps (+ a few highlights), slow drift */
export type NebSpec = {x0: number; y0: number; x1: number; y1: number; c: [string, string, string]; drift: [number, number]};
export const makeNebula = (n: NebSpec, seed: number) => {
  const r = rand(seed);
  const w = n.x1 - n.x0, h = n.y1 - n.y0, cnt = Math.max(6, Math.round(w / 20));
  const base = Array.from({length: cnt}, (_, i) => {
    const rr = h * (0.24 + r() * 0.16), fx = (i + 0.5) / cnt + (r() - 0.5) * 0.08;
    const x = n.x0 + rr + fx * Math.max(1, w - 2 * rr), y = n.y0 + rr + r() * Math.max(1, h - 2 * rr);
    return [x, y, rr] as const;
  });
  const inner = base.map(([x, y, rr]) => [x - rr * 0.12 + (r() - 0.5) * rr * 0.2, y - rr * 0.1, rr * (0.55 + r() * 0.2)] as const);
  const hi = base.filter(() => r() < 0.35).map(([x, y, rr]) => [x - rr * 0.2, y - rr * 0.25, rr * 0.32] as const);
  return {base, inner, hi};
};
export const Nebula: React.FC<{n: NebSpec; d: ReturnType<typeof makeNebula>; t: number; z: number}> = ({n, d, t, z}) => (
  <group position={[n.drift[0] * t, n.drift[1] * t, 0]}>
    {d.base.map(([x, y, rr], i) => <Disc key={i} x={x} y={y} r={rr} color={n.c[0]} z={z} />)}
    {d.inner.map(([x, y, rr], i) => <Disc key={'i' + i} x={x} y={y} r={rr} color={n.c[1]} z={z + 0.001} />)}
    {d.hi.map(([x, y, rr], i) => <Disc key={'h' + i} x={x} y={y} r={rr} color={n.c[2]} z={z + 0.002} />)}
  </group>
);
