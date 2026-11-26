import React from 'react';
import {Puppet3} from './Puppet3';
import type {Spec} from './draw';

export type NacLon = {spec: Spec; height: number};
const ss = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };
const HEX = /^#[0-9a-fA-F]{6}$/;
const mixHex = (a: string, b: string, f: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - f) + parseInt(b.slice(i, i + 2), 16) * f).toString(16).padStart(2, '0')).join('');
/** pha hai giá trị bất kì của một spec: số thì nội suy, màu `#rrggbb` thì pha màu, vật thì pha từng trường, còn lại đổi ở giữa quãng */
const mix = (a: unknown, b: unknown, f: number): unknown => {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * f;
  if (typeof a === 'string' && typeof b === 'string' && HEX.test(a) && HEX.test(b)) return mixHex(a, b, f);
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) return a.map((x, i) => mix(x, b[i], f));
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const o: Record<string, unknown> = {}, A = a as Record<string, unknown>, B = b as Record<string, unknown>;
    new Set([...Object.keys(A), ...Object.keys(B)]).forEach((k) => { o[k] = k in A && k in B ? mix(A[k], B[k], f) : f < 0.5 ? A[k] : B[k]; });
    return o;
  }
  return f < 0.5 ? a : b;
};
const headK = (s: Spec) => s.headK ?? (s.build === 'adult' ? 0.8 : 1);
/** MỘT người nằm giữa hai nấc tuổi: cỡ đầu, viền mặt, màu áo, góc tay đều nội suy, nên không có hai hình chồng nhau. */
export const phaNac = (a: Spec, b: Spec, f: number): Spec => {
  const s = mix(a, b, f) as Spec, a0 = a.faceShape ?? 'round', b0 = b.faceShape ?? 'round';
  const aT = a.faceTo?.shape ?? a0, aK = a.faceTo ? a.faceTo.k : 0, bT = b.faceTo?.shape ?? b0, bK = b.faceTo ? b.faceTo.k : 0;
  s.headK = headK(a) + (headK(b) - headK(a)) * f;
  s.faceShape = a0;
  if (a0 === b0) s.faceTo = aT === bT || aK === 0 ? {shape: bT, k: aK + (bK - aK) * f} : bK === 0 ? {shape: aT, k: aK * (1 - f)} : f < 0.5 ? a.faceTo : b.faceTo;
  else s.faceTo = {shape: b0, k: aT === b0 ? aK + (1 - aK) * f : f};   // sang một dáng mặt khác: đi thẳng tới dáng của nấc sau
  return s;
};

/** LỚN LÊN: một người biến đổi dần qua các nấc tuổi ngay trong một cảnh (Daniel, 23/11/2026: lớn lên phải là "biến đổi lên",
 *  không cắt giật sang một người cao hơn có khuôn mặt khác). stages = các nấc (ít nhất hai); t chạy từ 0 tới stages.length - 1.
 *  Giữa hai nấc mọi thứ NỘI SUY trên cùng một hình: chiều cao, cỡ đầu (`headK`), viền mặt (`faceTo`), màu quần áo, góc tay. Chỉ
 *  những thứ không pha được (kiểu tóc, `messy`, kiểu áo) đổi ở giữa quãng, nên hai nấc liền nhau nên chung kiểu tóc và kiểu áo.
 *  Bản đầu vẽ hai hình chồng mờ lên nhau, ra hai cái đầu lệch cỡ như bóng ma; đã bỏ.
 *  pose = hàm đặt tư thế và nét mặt cho từng nấc (góc tay của hai nấc được nội suy). Chân đứng yên ở pos. */
export const LonLen: React.FC<{stages: NacLon[]; t: number; pos?: [number, number, number]; flip?: boolean; order?: number; pose?: (spec: Spec, i: number) => Spec}> =
  ({stages, t, pos, flip, order = 500, pose}) => {
    const n = stages.length - 1, tt = Math.max(0, Math.min(n, t)), i = Math.min(n - 1, Math.floor(tt)), f = ss(tt - i);
    const a = stages[i], b = stages[i + 1], P = (sp: Spec, k: number) => (pose ? pose(sp, k) : sp);
    return <Puppet3 spec={phaNac(P(a.spec, i), P(b.spec, i + 1), f)} height={a.height + (b.height - a.height) * f} pos={pos} flip={flip} order={order} />;
  };
