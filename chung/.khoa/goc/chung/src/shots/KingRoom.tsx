import React from 'react';
import {Box, Cyl, Poly, Ball} from '../three/prims';

// An ordinary royal room: grey-mauve stone wall, small blue windows, blue pennants with gold trim,
// a tall gold-and-red throne on a red carpet with gold borders.
const G1 = '#efbd46', G2 = '#d9a23a', G3 = '#c48f2e', RED = '#a8152b', RED2 = '#8a1024', CARPET = '#86142a';
const WALL = '#5e5660', WALL2 = '#615962', MORTAR = '#544d57', FLOOR = '#857e7c', FLOOR2 = '#8a8382';

const Pillar: React.FC<{x: number; z: number}> = ({x, z}) => (
  <group>
    <Box size={[1.04, 9, 0.7]} pos={[x, 4.5, z]} color={G1} />
    {/* darker inner stripe facing the seat */}
    <Box size={[0.32, 9, 0.02]} pos={[x - Math.sign(x) * 0.36, 4.5, z + 0.36]} color={G2} cast={false} />
    {[2.9, 5.2].map((y) => <Box key={y} size={[1.08, 0.14, 0.74]} pos={[x, y, z]} color={G3} cast={false} />)}
  </group>
);

export const KingThrone: React.FC = () => (
  <group>
    {/* red back panel with three gold beads */}
    <Box size={[2.7, 9, 0.3]} pos={[0, 4.5, -1.75]} color={RED} />
    {[-0.73, 0, 0.73].map((x) => <Ball key={x} r={0.08} pos={[x, 5.15, -1.58]} color={G1} cast={false} />)}
    <Pillar x={-1.86} z={-1.55} />
    <Pillar x={1.86} z={-1.55} />
    {/* seat */}
    <Box size={[1.9, 1.15, 1.1]} pos={[0, 0.575, -1.1]} color={RED2} />
    {/* armrest blocks with round gold knobs on the outer top corners */}
    {[-1, 1].map((k) => (
      <group key={k}>
        <Box size={[1.53, 1.68, 1.7]} pos={[k * 1.66, 0.84, -0.85]} color={G1} />
        <Cyl r={0.25} h={0.04} rot={[Math.PI / 2, 0, 0]} pos={[k * 2.15, 1.45, 0.02]} color={'#e8b23a'} cast={false} />
      </group>
    ))}
  </group>
);

const Window: React.FC<{x: number}> = ({x}) => (
  <group>
    <Box size={[1.6, 1.8, 0.1]} pos={[x, 6.0, -3.85]} color={'#686068'} cast={false} />
    <Box size={[1.25, 1.6, 0.05]} pos={[x, 6.05, -3.78]} color={'#26326a'} cast={false} unlit />
    <Box size={[0.05, 1.6, 0.06]} pos={[x, 6.05, -3.74]} color={'#535060'} cast={false} />
    <Box size={[1.9, 0.18, 0.4]} pos={[x, 5.05, -3.7]} color={'#8a8488'} />
  </group>
);

const Pennant: React.FC<{x: number; w?: number}> = ({x, w = 3.4}) => (
  <group>
    <Poly pts={[[-w / 2, 0], [w / 2, 0], [0, -1.75]]} color={'#d8a23a'} pos={[x, 6.65, -3.55]} fog={false} />
    <Poly pts={[[-w / 2 + 0.3, 0], [w / 2 - 0.3, 0], [0, -1.5]]} color={'#2c3f8c'} pos={[x, 6.65, -3.54]} fog={false} />
  </group>
);

export const KingRoom: React.FC = () => {
  const blocks: React.ReactNode[] = [];
  // stone courses: horizontal mortar lines and staggered joints
  [1.0, 2.65, 4.3, 5.95].forEach((y, r) => {
    blocks.push(<Box key={`h${r}`} size={[24, 0.05, 0.02]} pos={[0, y, -3.88]} color={MORTAR} cast={false} receive={false} />);
    for (let i = -6; i <= 6; i++) {
      const x = i * 2.1 + (r % 2 ? 1.05 : 0);
      blocks.push(<Box key={`v${r}${i}`} size={[0.05, 1.65, 0.02]} pos={[x, y + 0.82, -3.88]} color={MORTAR} cast={false} receive={false} />);
      if ((i + r) % 3 === 0) blocks.push(<Box key={`b${r}${i}`} size={[2.0, 1.55, 0.01]} pos={[x + 1.05, y + 0.82, -3.89]} color={WALL2} cast={false} />);
    }
  });
  return (
    <group>
      {/* wall */}
      <Box size={[26, 14, 0.2]} pos={[0, 7, -4]} color={WALL} />
      {blocks}
      {/* soft light shafts slanting down from the windows, and darker shading low on the wall */}
      {[[-4.9, 2.2, 0.16], [-3.7, 1.2, 0.1], [4.6, 2.0, 0.14], [5.8, 1.1, 0.09]].map(([x, w, o], i) => (
        <Poly key={`sh${i}`} pts={[[x - w / 2, 5.0], [x + w / 2, 5.0], [x + w / 2 + 1.6, 0], [x - w / 2 + 1.6, 0]]} color={'#b8acb8'} pos={[0, 0, -3.84]} opacity={o} />
      ))}
      {[[-7.5, 2.4], [7.6, 2.0]].map(([x, w], i) => <Poly key={`dk${i}`} pts={[[x - w, 0], [x + w, 0], [x + w * 0.6, 7], [x - w * 0.6, 7]]} color={'#2c2830'} pos={[0, 0, -3.835]} opacity={0.22} />)}
      <Poly pts={[[-14, 0], [14, 0], [14, 1.2], [-14, 1.2]]} color={'#2c2830'} pos={[0, 0, -3.83]} opacity={0.12} />
      <Window x={-4.75} />
      <Window x={4.75} />
      {/* dark iron lamp brackets */}
      {[-3.35, 3.35].map((x) => <Box key={x} size={[0.3, 0.8, 0.1]} pos={[x, 5.75, -3.8]} color={'#3c3840'} />)}
      {[-6.3, 6.3].map((x) => <Pennant key={x} x={x} />)}
      {/* floor, dais edge and carpet */}
      <Box size={[26, 0.2, 14]} pos={[0, -0.1, 3]} color={FLOOR} />
      <Box size={[26, 0.06, 0.08]} pos={[0, 0.0, -3.86]} color={FLOOR2} cast={false} />
      <Box size={[6.4, 0.02, 10]} pos={[0, 0.01, 4.9]} color={'#d9a23a'} cast={false} />
      <Box size={[5.8, 0.03, 10]} pos={[0, 0.02, 4.9]} color={CARPET} cast={false} />
      <KingThrone />
    </group>
  );
};
