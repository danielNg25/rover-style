import React from 'react';
import {Stage, StageCanvas, Poly, Disc, Rect, RoundRect, Card, SignText} from '../../../kit';
import {Puppet} from '../../../puppet';
import {DOOM} from '../../../chars/_lib/doom';

/* Proportion mock-up for boy Victor (design: decide BEFORE sheet 1 is generated). Two rough code figures, both 55 % of
 * the ruler's height, with a visible neck and real shoulders: (a) head : body = 1 : 1.3, (b) 1 : 1.6 (bible).
 * Still "ep-doom-b-proportion". Decision recorded in art/decisions.md. */
export const H_RULER = 2.9, H_QUEEN = 3.0, H_BOY = H_RULER * 0.55;

const MockBoy: React.FC<{x: number; ratio: number; label: string}> = ({x, ratio, label}) => {
  const H = H_BOY, head = H / (1 + ratio), body = H - head, r = head * 0.5;
  const neck = head * 0.1, sh = body - neck;            // shoulder line height
  const hw = r * 0.95;                                  // half shoulder width
  const cy = body + r * 0.98;
  return (
    <group position={[x, 0, 0]}>
      {/* shawl: too big, trailing to the ground, a darker inner fold */}
      <Poly pts={[[-hw * 1.5, 0], [-hw * 1.05, sh * 0.72], [-hw, sh], [hw, sh], [hw * 1.05, sh * 0.72], [hw * 1.7, 0.02], [hw * 1.2, 0]]} color="#2f7a43" />
      <Poly pts={[[-hw * 0.25, 0], [-hw * 0.1, sh * 0.8], [hw * 0.2, sh * 0.8], [hw * 0.45, 0]]} color="#235c33" pos={[0, 0, 0.004]} />
      {/* hood down: a thick collar roll */}
      <RoundRect w={hw * 2.3} h={sh * 0.22} r={sh * 0.1} color="#3b8f52" pos={[0, sh * 0.96, 0.008]} />
      {/* neck */}
      <Rect w={r * 0.5} h={neck + r * 0.3} color="#e3ad88" pos={[0, body, 0.006]} />
      {/* head, ears, hair with one tuft */}
      <Disc r={r * 0.2} color="#eba58d" pos={[-r * 0.98, cy - r * 0.1, 0.01]} /><Disc r={r * 0.2} color="#eba58d" pos={[r * 0.98, cy - r * 0.1, 0.01]} />
      <Disc r={r} color="#f2c3a0" pos={[0, cy, 0.012]} />
      <Poly pts={[[-r * 1.03, cy + r * 0.15], [-r * 0.85, cy + r * 0.8], [-r * 0.2, cy + r * 1.08], [0.02, cy + r * 1.3], [r * 0.2, cy + r * 1.05], [r * 0.85, cy + r * 0.8], [r * 1.03, cy + r * 0.15], [r * 0.6, cy + r * 0.45], [0, cy + r * 0.3], [-r * 0.6, cy + r * 0.5]]} color="#2d2522" pos={[0, 0, 0.016]} />
      {/* small separated oval eyes, pupils, heavy angled brows, pink nose, closed mouth */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * r * 0.38, cy - r * 0.08, 0.02]}>
          <Disc r={r * 0.2} sy={1.2} color="#f6f1e4" /><Disc r={r * 0.08} color="#221c1c" pos={[0, 0, 0.002]} />
          <group position={[0, r * 0.3, 0.004]} rotation={[0, 0, s * 0.3]}><Rect w={r * 0.5} h={r * 0.12} color="#2d2522" /></group>
        </group>
      ))}
      <Disc r={r * 0.09} color="#e8928a" pos={[0, cy - r * 0.32, 0.02]} />
      <Rect w={r * 0.3} h={r * 0.05} color="#8a4a40" pos={[0, cy - r * 0.6, 0.02]} />
      <SignText text={label} pos={[0, -0.3, 0]} height={0.16} color="#3a3a3a" />
    </group>
  );
};

export const Proportion: React.FC = () => (
  <StageCanvas bg="#d9d3c4">
    <Stage cam={{pos: [0, 1.45, 11], look: [0, 1.45, 0], fov: 28}} f={0} len={1} mood="dayInterior" bg="#d9d3c4">
      <Rect w={30} h={0.02} color="#8a8474" pos={[0, 0, -0.1]} />
      <Card src="queen/q-1.png" height={H_QUEEN} pos={[-3.6, 0, 0]} pivot={[0.5, 1]} />
      <Puppet rig={DOOM} height={H_RULER} pos={[-1.4, 0, 0]} shadow={false} />
      <MockBoy x={0.9} ratio={1.3} label="A 1:1.3" />
      <MockBoy x={3.0} ratio={1.6} label="B 1:1.6" />
    </Stage>
  </StageCanvas>
);
