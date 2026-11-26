import React from 'react';
import {Piece, Card} from './sprite';
import {Poly} from '../three/prims';

type V3 = [number, number, number];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- elephant (public/savanna/a-*.png, crisp geometric parts)
// a-1 body 535x255 (no legs/ear/trunk), a-2 ear, a-3 trunk, a-4 tail, a-5 near leg, a-6 far leg (darker). Pixel space: y down.
const E_FEET = 440; // foot line in body pixels
/** Walking elephant. h = world height (top of back to feet), period = frames per full stride cycle. */
export const Elephant: React.FC<{pos: V3; h: number; f: number; period?: number; seed?: number; tint?: string; children?: React.ReactNode}> =
  ({pos, h, f, period = 28, seed = 0, tint = '#d9d3cd', children}) => {
    const s = h / (E_FEET - 14);
    const ph = (f / period) * TAU + seed;
    const A = 13; // swing in degrees
    // lateral walk: hind and front of the same side half a cycle apart, far side mirrors the near side
    const leg = (p: number) => ({rot: A * Math.sin(p), sy: 1 - 0.07 * Math.max(0, -Math.cos(p))});
    const hn = leg(ph), fn = leg(ph + Math.PI), hf = leg(ph + Math.PI), ff = leg(ph);
    const bob = 3 * Math.cos(2 * ph); // two dips per cycle, in body pixels
    const sway = Math.sin(ph);
    return (
      <group position={[pos[0], pos[1] + E_FEET * s, pos[2]]} scale={[s, -s, 1]}>
        <group position={[-260, 0, 0]}>
          {/* far side, behind the body */}
          <Piece src="savanna/a-6.png" at={[128, 226]} pivot={[51, 10]} rot={hf.rot} sy={hf.sy} z={-0.03} tint={tint} />
          <Piece src="savanna/a-6.png" at={[338, 226]} pivot={[51, 10]} rot={ff.rot} sy={ff.sy} z={-0.03} tint={tint} />
          <Piece src="savanna/a-4.png" at={[16, 64 + bob]} pivot={[82, 6]} scale={0.55} rot={-8 + 7 * Math.sin(ph * 2 + 1)} z={-0.02} tint={tint} />
          <Piece src="savanna/a-3.png" at={[474, 150 + bob]} pivot={[46, 10]} rot={-4 + 5 * Math.sin(ph + 0.8)} z={-0.02} tint={tint} />
          {/* body */}
          <Piece src="savanna/a-1.png" at={[0, bob]} pivot={[0, 0]} rot={0.6 * sway} z={0} tint={tint} />
          {/* ear flaps a little */}
          <Piece src="savanna/a-2.png" at={[398, 44 + bob]} pivot={[176, 22]} rot={3 * Math.sin(ph * 2 + 0.5)} z={0.01} tint={'#f2ede8'} />
          {/* near side legs in front */}
          <Piece src="savanna/a-5.png" at={[80, 232]} pivot={[52, 10]} rot={hn.rot} sy={hn.sy} z={0.02} tint={tint} />
          <Piece src="savanna/a-5.png" at={[292, 232]} pivot={[52, 10]} rot={fn.rot} sy={fn.sy} z={0.02} tint={tint} />
          {children}
        </group>
      </group>
    );
  };
/** where a foot of the elephant is planted (world x offset) — used for kicked-up dust */
export const elephantPlant = (f: number, period: number, seed: number) => {
  const ph = (f / period) * TAU + seed;
  return [Math.cos(ph), Math.cos(ph + Math.PI)]; // values crossing -1 -> a foot touches down
};

// ---------------------------------------------------------------- giraffe (old soft body cropped above the legs + crisp code-rigged legs)
// s-3 is 278x454 facing left; crop at y=300 keeps body, neck and head. a-8 = one leg 77x249.
const G_CROP = 300 / 454, G_FEET = 452;
export const Giraffe: React.FC<{pos: V3; h: number; f: number; period?: number; seed?: number}> = ({pos, h, f, period = 34, seed = 0}) => {
  const s = h / G_FEET;
  const ph = (f / period) * TAU + seed;
  const A = 11, ls = 0.66;
  // pace: both legs of one side move together
  const leg = (p: number) => ({rot: -A * Math.sin(p), sy: ls * (1 - 0.05 * Math.max(0, -Math.cos(p)))});
  const near = leg(ph), far = leg(ph + Math.PI);
  const bob = 2.5 * Math.cos(2 * ph);
  return (
    <group position={[pos[0], pos[1] + G_FEET * s, pos[2]]} scale={[s, -s, 1]}>
      <group position={[-139, 0, 0]}>
        <Piece src="savanna/a-8.png" at={[128, 292]} pivot={[50, 8]} rot={far.rot} scale={ls} sy={far.sy / ls} z={-0.02} tint={'#d8c8ae'} flip />
        <Piece src="savanna/a-8.png" at={[246, 292]} pivot={[50, 8]} rot={far.rot} scale={ls} sy={far.sy / ls} z={-0.02} tint={'#d8c8ae'} flip />
        <Piece src="savanna/s-3.png" at={[0, bob]} pivot={[0, 0]} crop={G_CROP} rot={0.8 * Math.sin(ph * 2)} z={0} />
        <Piece src="savanna/a-8.png" at={[110, 296]} pivot={[50, 8]} rot={near.rot} scale={ls} sy={near.sy / ls} z={0.02} flip />
        <Piece src="savanna/a-8.png" at={[228, 296]} pivot={[50, 8]} rot={near.rot} scale={ls} sy={near.sy / ls} z={0.02} flip />
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- impala: three drawn walk poses swapped on 3-frame holds
const IMP = ['savanna/a-9.png', 'savanna/a-10.png', 'savanna/a-11.png', 'savanna/a-10.png'];
export const Impala: React.FC<{pos: V3; h: number; f: number; seed: number; left?: boolean}> = ({pos, h, f, seed, left}) => {
  const k = Math.floor((f + seed * 7) / 3) % 4;
  const hop = k === 2 ? 0.04 * h : 0;
  return (
    <>
      {[0, 1, 2].map((i) => (
        <group key={i} visible={IMP[k] === `savanna/a-${9 + i}.png`}>
          <Card src={`savanna/a-${9 + i}.png`} height={h} pos={[pos[0], pos[1] + hop, pos[2]]} flip={left} tint={'#dcc6b2'} />
        </group>
      ))}
    </>
  );
};

/** small tan dust puff that grows, drifts back and fades */
export const Dust: React.FC<{pos: V3; age: number; s?: number}> = ({pos, age, s = 0.35}) => {
  if (age < 0 || age > 10) return null;
  const k = s * (0.4 + age * 0.08), o = 0.45 * (1 - age / 10);
  const pts: [number, number][] = Array.from({length: 18}, (_, i) => [Math.cos((i / 18) * TAU), Math.sin((i / 18) * TAU) * 0.55]);
  return <group position={[pos[0] - age * 0.03, pos[1] + 0.12 + age * 0.015, pos[2] + 0.05]} scale={[k, k, 1]}><Poly pts={pts} color={'#e6cf9c'} opacity={o} fog={false} /></group>;
};
