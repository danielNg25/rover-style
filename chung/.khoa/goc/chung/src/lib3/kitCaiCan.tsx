import React, {useMemo} from 'react';
import * as THREE from 'three';
import {tex} from './kitLab';

/** lib3/kitCaiCan (23/11/2026, d1c6 cảnh 3): CÁI CÂN ĐỒNG CẮT GIẤY. Mảng phẳng, mép sắc, hai ba sắc đồng cho mỗi mảng (tối, giữa, sáng),
 *  mỗi mảng có một cái bóng đổ cứng lệch xuống dưới bên phải (như tấm giấy dày cắt rời đặt lên giấy nền), KHÔNG bóng mềm, không khối cầu.
 *  Dựng toàn bằng đa giác phẳng `meshBasicMaterial`, nên màu đúng như khai, không phụ thuộc đèn của cảnh.
 *
 *  Toạ độ trong cân tính bằng CHIỀU CAO CÂN (h = 1): gốc = giữa chân đế, y lên; trục đòn ở y 0,86; đòn dài 1,0 (±0,5); hai đĩa treo thấp hơn đầu đòn
 *  0,36. Truyền `h` (mét) để đặt cỡ thật. `beam` = góc nghiêng của đòn, độ (dương = đầu PHẢI của màn hình hạ xuống). Đĩa luôn treo thẳng đứng.
 *  `left` và `right` là thứ đặt trên đĩa (thẻ, đầu nhân vật…), vẽ trong toạ độ của cân (đơn vị chiều cao cân, gốc = giữa mặt đĩa, y lên): phần
 *  chung không biết gì về nhân vật, đầu truyền vào qua đây. `order` = thứ tự vẽ cơ sở của cả cân (mặc định 300; thẻ trên đĩa 320..; đầu người
 *  đặt `order` từ 330 trở lên). Phần chung không được import `kenh/`. */
type Pt = [number, number];
const BRASS = {dark: '#7a4a1c', mid: '#b9772c', light: '#e8b45a', hi: '#f6d68a'};
const SHADOW = {dx: 0.012, dy: -0.016, color: '#2a1608', opacity: 0.3};

const geoCache = new Map<string, THREE.ShapeGeometry>();
const shapeGeo = (pts: Pt[]) => {
  const key = pts.map((p) => p.join(',')).join(';');
  let g = geoCache.get(key);
  if (!g) { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); g = new THREE.ShapeGeometry(s); geoCache.set(key, g); }
  return g;
};
/** one flat cut piece: its hard shadow, then the piece. z only orders the layers (everything is transparent, so that the renderOrder alone decides, shadows included; depth off). */
export const Piece: React.FC<{pts: Pt[]; color: string; z?: number; base?: number; shadow?: boolean; opacity?: number}> = ({pts, color, z = 0, base = 300, shadow = true, opacity = 1}) => {
  const g = useMemo(() => shapeGeo(pts), [pts.map((p) => p.join(',')).join(';')]);
  return <>
    {shadow ? <mesh geometry={g} position={[SHADOW.dx, SHADOW.dy, 0]} renderOrder={base + z - 0.5}><meshBasicMaterial color={SHADOW.color} transparent opacity={SHADOW.opacity} depthTest={false} depthWrite={false} toneMapped={false} /></mesh> : null}
    <mesh geometry={g} renderOrder={base + z}><meshBasicMaterial color={color} transparent opacity={opacity} depthTest={false} depthWrite={false} toneMapped={false} /></mesh>
  </>;
};
/** a piece in three flat tones: the dark whole, the mid body inset to the lower-right, the light facet on the upper-left half */
const Facet: React.FC<{pts: Pt[]; light: Pt[]; z: number; base: number; shadow?: boolean; tones?: [string, string, string]}> = ({pts, light, z, base, shadow = true, tones = [BRASS.mid, BRASS.light, BRASS.dark]}) =>
  <><Piece pts={pts} color={tones[0]} z={z} base={base} shadow={shadow} /><Piece pts={light} color={tones[1]} z={z + 0.1} base={base} shadow={false} /></>;

const rot = (p: Pt, a: number): Pt => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
export const CAN = {pivotY: 0.86, half: 0.5, hang: 0.36, rim: 0.2};

export const CaiCan: React.FC<{h?: number; pos?: [number, number, number]; beam?: number; left?: React.ReactNode; right?: React.ReactNode; order?: number}> =
  ({h = 3, pos = [0, 0, 0], beam = 0, left, right, order = 300}) => {
    const a = (-beam * Math.PI) / 180, PY = CAN.pivotY;   // positive beam: the right end goes down, which is a negative turn about z
    const endL = rot([-CAN.half, 0], a), endR = rot([CAN.half, 0], a);
    const panL: Pt = [endL[0], PY + endL[1] - CAN.hang], panR: Pt = [endR[0], PY + endR[1] - CAN.hang];
    const O = order;
    const pan = (c: Pt, kids: React.ReactNode) => <group position={[c[0], c[1], 0]}>
      {/* three chains from the hook to the rim, as thin cut strips */}
      {([-1, 0, 1] as number[]).map((k) => <Piece key={k} pts={[[0 + k * 0.004 - 0.003, CAN.hang - 0.005], [0 + k * 0.004 + 0.003, CAN.hang - 0.005], [k * CAN.rim * 0.9 + 0.004, 0.0], [k * CAN.rim * 0.9 - 0.004, 0.0]]} color={BRASS.dark} z={1 + (k === 0 ? 0.2 : 0)} base={O} />)}
      {/* the pan: a shallow bowl with a lit rim band, sharp corners */}
      <Piece pts={[[-CAN.rim - 0.02, 0.004], [CAN.rim + 0.02, 0.004], [CAN.rim - 0.01, -0.03], [CAN.rim * 0.55, -0.058], [-CAN.rim * 0.55, -0.058], [-CAN.rim + 0.01, -0.03]]} color={BRASS.mid} z={3} base={O} />
      <Piece pts={[[-CAN.rim + 0.01, -0.03], [-CAN.rim * 0.55, -0.058], [CAN.rim * 0.2, -0.058], [CAN.rim * 0.05, -0.03]]} color={BRASS.dark} z={3.1} base={O} shadow={false} />
      <Piece pts={[[-CAN.rim - 0.02, 0.004], [CAN.rim + 0.02, 0.004], [CAN.rim + 0.012, -0.006], [-CAN.rim - 0.012, -0.006]]} color={BRASS.hi} z={3.2} base={O} shadow={false} />
      <Piece pts={[[-0.035 + 0, -0.058], [0.035, -0.058], [0.02, -0.082], [-0.02, -0.082]]} color={BRASS.dark} z={2.9} base={O} />
      <group position={[0, 0.004, 0]} renderOrder={O + 20}>{kids}</group>
    </group>;
    return (
      <group position={pos} scale={[h, h, h]}>
        {/* foot, two steps, then the column with a lit half and a collar */}
        <Facet pts={[[-0.24, 0], [0.24, 0], [0.19, 0.045], [-0.19, 0.045]]} light={[[-0.24, 0], [-0.02, 0], [-0.02, 0.045], [-0.19, 0.045]]} z={0} base={O} />
        <Facet pts={[[-0.15, 0.045], [0.15, 0.045], [0.1, 0.092], [-0.1, 0.092]]} light={[[-0.15, 0.045], [0, 0.045], [0, 0.092], [-0.1, 0.092]]} z={1} base={O} />
        <Facet pts={[[-0.024, 0.092], [0.024, 0.092], [0.014, PY], [-0.014, PY]]} light={[[-0.024, 0.092], [0, 0.092], [0, PY], [-0.014, PY]]} z={2} base={O} />
        <Facet pts={[[0, 0.4], [0.048, 0.44], [0, 0.48], [-0.048, 0.44]]} light={[[0, 0.4], [0, 0.48], [-0.048, 0.44]]} z={3} base={O} />
        <Facet pts={[[0, 0.2], [0.034, 0.225], [0, 0.25], [-0.034, 0.225]]} light={[[0, 0.2], [0, 0.25], [-0.034, 0.225]]} z={3} base={O} />
        {/* the finial over the pivot */}
        <Facet pts={[[0, PY + 0.03], [0.028, PY + 0.07], [0, PY + 0.14], [-0.028, PY + 0.07]]} light={[[0, PY + 0.03], [0, PY + 0.14], [-0.028, PY + 0.07]]} z={4} base={O} />
        {/* the beam: a pointed lens that turns about the pivot, a bright upper edge, hooks at both ends */}
        <group position={[0, PY, 0]} rotation={[0, 0, a]}>
          <Facet pts={[[-0.5, 0], [-0.44, 0.024], [-0.1, 0.034], [0, 0.044], [0.1, 0.034], [0.44, 0.024], [0.5, 0], [0.44, -0.024], [0.1, -0.034], [0, -0.044], [-0.1, -0.034], [-0.44, -0.024]]}
            light={[[-0.5, 0], [-0.44, 0.024], [-0.1, 0.034], [0, 0.044], [0.1, 0.034], [0.44, 0.024], [0.5, 0], [0.3, 0.004], [-0.3, 0.004]]} z={6} base={O} />
          {([-1, 1] as number[]).map((k) => <Facet key={k} pts={[[k * 0.5, 0.03], [k * 0.52, 0], [k * 0.5, -0.03], [k * 0.48, 0]]} light={[[k * 0.5, 0.03], [k * 0.52, 0], [k * 0.5, 0]]} z={6.5} base={O} />)}
          {([-1, 1] as number[]).map((k) => <Piece key={`h${k}`} pts={[[k * 0.5 - 0.008, -0.02], [k * 0.5 + 0.008, -0.02], [k * 0.5 + 0.004, -0.05], [k * 0.5 - 0.004, -0.05]]} color={BRASS.dark} z={6.6} base={O} />)}
        </group>
        {/* the pivot boss, in front of the beam */}
        <Facet pts={[[0.036, PY], [0.018, PY + 0.031], [-0.018, PY + 0.031], [-0.036, PY], [-0.018, PY - 0.031], [0.018, PY - 0.031]]} light={[[0.036, PY], [0.018, PY + 0.031], [-0.018, PY + 0.031], [-0.036, PY], [0, PY]]} z={8} base={O} />
        <Piece pts={[[0.014, PY], [0.007, PY + 0.012], [-0.007, PY + 0.012], [-0.014, PY], [-0.007, PY - 0.012], [0.007, PY - 0.012]]} color={BRASS.hi} z={8.2} base={O} shadow={false} />
        {pan(panL, left)}{pan(panR, right)}
      </group>
    );
  };

/** A name tag (a thẻ tên) lying on a pan: a cut card with a clipped corner, a thin darker border strip, a coloured band for the name, and room
 *  for a small head on its left (pass it as children: a Puppet3 inside a ClipBox, order from 330). Units = the scale's height (the card is `w` x `h` of it).
 *  Origin = the middle of the card's bottom edge (it rests on the pan). */
export const TheTen: React.FC<{w?: number; h?: number; label: string; band: string; ink?: string; rot?: number; base?: number; children?: React.ReactNode}> = ({w = 0.14, h = 0.07, label, band, ink = '#fbf3df', rot: rz = 0, base = 320, children}) => {
  const hw = w / 2, c = h * 0.28;
  const t = useMemo(() => tex(`caican-ten-${label}-${band}-${ink}`, 256, 96, (cx, W, H) => { cx.clearRect(0, 0, W, H); cx.fillStyle = ink; cx.font = 'bold 54px "Trebuchet MS", Verdana, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(label, W / 2, H / 2 + 3); }), [label, band, ink]);
  return (
    <group position={[0, 0, 0]} rotation={[0, 0, (rz * Math.PI) / 180]}>
      <Piece pts={[[-hw, 0], [hw, 0], [hw, h - c], [hw - c, h], [-hw, h]]} color="#e9dcc0" z={0} base={base} />
      <Piece pts={[[-hw + 0.004, 0.004], [hw - 0.004, 0.004], [hw - 0.004, h * 0.34], [-hw + 0.004, h * 0.34]]} color={band} z={0.2} base={base} shadow={false} />
      <Piece pts={[[-hw, h - 0.006], [hw - c, h - 0.006], [hw - c * 0.45, h - 0.006 - c * 0.45], [-hw, h - 0.012]]} color="#fbf3e2" z={0.3} base={base} shadow={false} />
      <mesh position={[hw * 0.18, h * 0.17, 0]} renderOrder={base + 0.6}><planeGeometry args={[w * 0.62, h * 0.3]} /><meshBasicMaterial map={t} transparent depthTest={false} depthWrite={false} toneMapped={false} /></mesh>
      <group position={[-hw * 0.5, h * 0.68, 0]}>{children}</group>
    </group>
  );
};
