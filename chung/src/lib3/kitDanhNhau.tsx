import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {rnd} from './depth';

/** lib3/kitDanhNhau (23/11/2026): HIỆU ỨNG ĐÁNH NHAU kiểu cắt giấy. Mảng phẳng, mép sắc, nhiều sắc; không đốm tròn nhoè.
 *  Món nào cũng nhận `f` (số khung). Món xảy ra một lần nhận `at` (khung bắt đầu); món đi từ chỗ này tới chỗ kia nhận `a`, `b`.
 *  Thứ tự vẽ: người ở order 500. Mặc định: thứ trên đất 480 (dưới chân người), thứ trên không 560 (trước người).
 *  Tia phát từ tay: lấy `a` bằng `handWorld(spec, cao, pos, flip, 'R')` của mould/draw, để tia bắt đầu ĐÚNG ở bàn tay.
 *  Trong phòng bị xoay: truyền `rotY = -yaw` cho các món đứng. */
type V3 = [number, number, number];
type P2 = [number, number];
export type MauFx = 'doom' | 'lua' | 'bac' | 'sue' | 'da';
/** bốn sắc từ ngoài vào lõi */
export const MAU_FX: Record<MauFx, [string, string, string, string]> = {
  doom: ['#0c7040', '#22c46a', '#8dffb6', '#f4fff6'],
  lua: ['#ad1f10', '#f0531a', '#ffb224', '#fff3ac'],
  bac: ['#55718f', '#a4c3e0', '#dff1ff', '#ffffff'],
  sue: ['#2478c8', '#5fbff0', '#bcefff', '#f4fdff'],
  da: ['#7e4318', '#dc8636', '#ffd08a', '#fff4dc'],
};
const dam = (hex: string, k: number) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
const clamp = (x: number) => Math.min(1, Math.max(0, x));

/** một mảng phẳng đa giác; `hole` là lỗ khoét */
const Poly: React.FC<{pts: P2[]; hole?: P2[]; color: string; opacity?: number; order: number; z?: number}> = ({pts, hole, color, opacity = 1, order, z = 0}) => {
  const key = pts.map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join(' ') + (hole ? '|' + hole.map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join(' ') : '');
  const geo = useMemo(() => { const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))); if (hole) sh.holes.push(new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y)))); return new THREE.ShapeGeometry(sh); }, [key]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} position={[0, 0, z]} renderOrder={order}><meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} fog={false} toneMapped={false} /></mesh>;
};
/** ngôi sao nhiều cánh dài ngắn không đều */
const saoPts = (n: number, ri: number, ro: number, seed: number, rot = 0): P2[] => { const q = rnd(seed * 17 + n), out: P2[] = []; for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * Math.PI * 2 + (q() - 0.5) * (0.5 / n), r = i % 2 ? ri * (0.86 + q() * 0.28) : ro * (0.62 + q() * 0.46); out.push([Math.cos(a) * r, Math.sin(a) * r]); } return out; };

// ---------------------------------------------------------------- va chạm
/** SAO VA CHẠM: năm lớp sao phẳng (viền tối, ba sắc, lõi), bật lên trong 2 khung, giữ, rồi co lại. r = bán kính (m). */
export const SaoVaCham: React.FC<{f: number; at: number; pos: V3; r?: number; mau?: MauFx; len?: number; seed?: number; rotY?: number; order?: number}> =
  ({f, at, pos, r = 1, mau = 'lua', len = 14, seed = 1, rotY = 0, order = 572}) => {
    const d = f - at; if (d < 0 || d > len) return null;
    const k = d < 1 ? 0.62 : d < 2 ? 1.14 : d < 5 ? 1 : Math.max(0, 1 - ((d - 5) / Math.max(1, len - 5)) ** 2), rot = Math.floor(d / 2) * 0.16, C = MAU_FX[mau];
    if (k <= 0.01) return null;
    const lop: [string, number, number, number][] = [[dam(C[0], 0.55), 1.12, 0.5, 13], [C[0], 1, 0.46, 13], [C[1], 0.78, 0.38, 11], [C[2], 0.54, 0.28, 9], [C[3], 0.3, 0.17, 7]];
    return <group position={pos} rotation={[0, rotY, 0]} scale={[r * k, r * k, 1]}>{lop.map(([c, ro, ri, n], i) => <Poly key={i} pts={saoPts(n, ri, ro, seed + (i < 2 ? 0 : i), rot * (i % 2 ? 1 : -0.7) + i * 0.2)} color={c} order={order + i} z={i * 0.002} />)}</group>;
  };

/** VÒNG XUNG KÍCH trên mặt đất: hai vòng răng cưa nở ra từ chỗ va chạm, mỏng dần rồi hết. pos = điểm trên mặt đất. */
export const VongXungKich: React.FC<{f: number; at: number; pos: V3; r?: number; mau?: MauFx; len?: number; seed?: number; order?: number}> =
  ({f, at, pos, r = 3, mau = 'da', len = 18, seed = 1, order = 480}) => {
    const d = f - at; if (d < 0 || d > len) return null;
    const t = d / len, e = 1 - (1 - t) * (1 - t), R = r * (0.16 + 0.84 * e), w = r * 0.085 * (1 - t) + 0.012, C = MAU_FX[mau], N = 44;
    const vong = (R0: number, W: number, s: number) => { const q = rnd(s * 13 + 7), o: P2[] = [], h: P2[] = []; for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2, b = R0 + W * (i % 2 ? 0.55 + q() * 0.5 : 0.1); o.push([Math.cos(a) * b, Math.sin(a) * b]); h.push([Math.cos(a) * (R0 - W * 0.5), Math.sin(a) * (R0 - W * 0.5)]); } return {o, h: h.reverse()}; };
    const A = vong(R, w, seed), B = vong(R * 0.74, w * 0.6, seed + 3), Cc = vong(R, w * 0.42, seed + 5);
    return <group position={[pos[0], pos[1] + 0.025, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <Poly pts={A.o} hole={A.h} color={C[1]} order={order} /><Poly pts={Cc.o} hole={Cc.h} color={C[3]} order={order + 1} z={0.002} /><Poly pts={B.o} hole={B.h} color={C[2]} opacity={1 - t * 0.5} order={order} z={0.001} />
    </group>;
  };

/** NỀN NỨT: các đường nứt gãy khúc toả từ tâm, nhánh phụ, và những tấm nền bật lên. p 0..1 = nứt tới đâu. */
export const NenNut: React.FC<{pos: V3; r?: number; p?: number; n?: number; seed?: number; toi?: string; ria?: string; tam?: string; order?: number}> =
  ({pos, r = 2.6, p = 1, n = 9, seed = 1, toi = '#191412', ria = '#8c867e', tam = '#6e6a64', order = 476}) => {
    const k = clamp(p);
    const hinh = useMemo(() => { const q = rnd(seed * 29 + 3), nut: {pts: P2[]; w: number}[] = [], tams: P2[][] = [];
      for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2 + (q() - 0.5) * 0.5, L = r * (0.6 + q() * 0.5); let a = a0, x = Math.cos(a0) * r * 0.05, y = Math.sin(a0) * r * 0.05; const pts: P2[] = [[x, y]], m = 6;
        for (let j = 0; j < m; j++) { a += (q() - 0.5) * 0.85; x += Math.cos(a) * (L / m); y += Math.sin(a) * (L / m); pts.push([x, y]); if (j > 0 && j < m - 1 && q() < 0.62) { const b = a + (q() < 0.5 ? 1 : -1) * (0.6 + q() * 0.6), l = (L / m) * (0.9 + q()); nut.push({pts: [[x, y], [x + Math.cos(b) * l * 0.55, y + Math.sin(b) * l * 0.55], [x + Math.cos(b + 0.3) * l, y + Math.sin(b + 0.3) * l]], w: r * 0.018}); } }
        nut.push({pts, w: r * 0.04}); }
      for (let i = 0; i < n; i++) { const a = ((i + 0.5) / n) * Math.PI * 2 + (q() - 0.5) * 0.3, d = r * (0.14 + q() * 0.22), s = r * (0.08 + q() * 0.08), rot = q() * 6; tams.push(Array.from({length: 4 + (i % 2)}, (_, v) => { const b = rot + (v / (4 + (i % 2))) * Math.PI * 2, e = s * (0.72 + q() * 0.5); return [Math.cos(a) * d + Math.cos(b) * e, Math.sin(a) * d + Math.sin(b) * e] as P2; })); }
      return {nut, tams}; }, [r, n, seed]);
    if (k <= 0.01) return null;
    const dai = (pts: P2[], w: number): P2[] => { const m = (pts.length - 1) * k, keep: P2[] = []; for (let i = 0; i <= Math.floor(m); i++) keep.push(pts[i]); const fr = m - Math.floor(m); if (fr > 0 && pts[Math.floor(m) + 1]) { const u = pts[Math.floor(m)], v = pts[Math.floor(m) + 1]; keep.push([u[0] + (v[0] - u[0]) * fr, u[1] + (v[1] - u[1]) * fr]); }
      const top: P2[] = [], bot: P2[] = []; keep.forEach((c, i) => { const a = keep[Math.max(0, i - 1)], b = keep[Math.min(keep.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ww = w * (1 - i / Math.max(1, keep.length - 1)) + 0.004; top.push([c[0] - (dy / l) * ww, c[1] + (dx / l) * ww]); bot.unshift([c[0] + (dy / l) * ww, c[1] - (dx / l) * ww]); }); return [...top, ...bot]; };
    return <group position={[pos[0], pos[1] + 0.018, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      {hinh.tams.map((t, i) => k > 0.3 ? <group key={`t${i}`}><Poly pts={t.map(([x, y]) => [x + 0.02, y - 0.03] as P2)} color={toi} order={order} /><Poly pts={t} color={i % 2 ? tam : ria} order={order + 1} z={0.002} /></group> : null)}
      {hinh.nut.map((c, i) => <group key={`n${i}`}><Poly pts={dai(c.pts, c.w * 1.7)} color={ria} order={order + 2} z={0.003} /><Poly pts={dai(c.pts, c.w)} color={toi} order={order + 3} z={0.004} /></group>)}
    </group>;
  };

// ---------------------------------------------------------------- tia, lửa, khiên
/** TIA NĂNG LƯỢNG từ `a` tới `b`: bốn lớp bản răng cưa (ngoài, giữa, trong, lõi), bản hẹp ở tay rồi loe ra, loé ở miệng và đầu tia hình sao.
 *  kieu: 'doom' (xanh), 'lua' (Johnny), 'bac' (Surfer). p 0..1 = tia đã vươn tới đâu. rong = nửa bề rộng (m). sang = cường độ ánh hắt lên cảnh ở đầu tia. */
export const TiaNangLuong: React.FC<{f: number; a: V3; b: V3; kieu?: MauFx; rong?: number; p?: number; seed?: number; order?: number; dau?: boolean; sang?: number}> =
  ({f, a, b, kieu = 'doom', rong = 0.17, p = 1, seed = 1, order = 562, dau = true, sang = 0}) => {
    const k = clamp(p); if (k <= 0.01) return null;
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], Lxy = Math.hypot(dx, dy) || 1, L = Math.hypot(Lxy, dz) * k, rz = Math.atan2(dy, dx), ry = -Math.atan2(dz, Lxy), C = MAU_FX[kieu], buoc = Math.floor(f / 2), lua = kieu === 'lua', N = Math.max(10, Math.round(L / 0.16));
    const ban = (w: number, jag: number, s: number): P2[] => { const q = rnd(seed * 31 + buoc * 7 + s), tren: P2[] = [], duoi: P2[] = []; for (let i = 0; i <= N; i++) { const t = i / N, x = t * L, nen = 0.42 + 0.58 * clamp(t / 0.16), mui = t > 0.94 ? (1 - t) / 0.06 : 1, j1 = i % 2 ? 1 + q() * jag : 1 - q() * jag * 0.6, j2 = i % 2 ? 1 - q() * jag * 0.6 : 1 + q() * jag, wv = Math.sin(t * 9 + f * 0.5 + s) * w * 0.14 * (lua ? 1.7 : 0.8); tren.push([x, w * nen * mui * j1 + wv]); duoi.unshift([x, -w * nen * mui * j2 + wv]); } return [...tren, ...duoi]; };
    const lop: [string, number, number][] = [[dam(C[0], 0.72), 1.2, lua ? 0.5 : 0.3], [C[1], 0.92, lua ? 0.42 : 0.24], [C[2], 0.58, lua ? 0.3 : 0.18], [C[3], 0.27, 0.12]];
    return <>
      <group position={a} rotation={[0, 0, rz]}><group rotation={[0, ry, 0]}>{lop.map(([c, w, j], i) => <Poly key={i} pts={ban(rong * w, j, i)} color={c} order={order + i} z={i * 0.002} />)}</group></group>
      <group position={a} rotation={[0, 0, buoc * 0.6]}>{([[C[0], 2.1, 0.8], [C[1], 1.7, 0.66], [C[2], 1.2, 0.46], [C[3], 0.72, 0.28]] as [string, number, number][]).map(([c, ro, ri], i) => <Poly key={i} pts={saoPts(8, rong * ri, rong * ro, seed + buoc + i, i * 0.3)} color={c} order={order + 5 + i} z={0.01 + i * 0.002} />)}</group>
      {dau ? <group position={[a[0] + dx * k, a[1] + dy * k, a[2] + dz * k]} rotation={[0, 0, -buoc * 0.5]}>{([[dam(C[0], 0.7), 3.6, 1.2], [C[1], 2.9, 1], [C[2], 2, 0.72], [C[3], 1.15, 0.42]] as [string, number, number][]).map(([c, ro, ri], i) => <Poly key={i} pts={saoPts(11, rong * ri, rong * ro, seed + 3 + buoc + i, i * 0.27)} color={c} order={order + 10 + i} z={0.02 + i * 0.002} />)}</group> : null}
      {sang > 0 ? <pointLight position={[a[0] + dx * k, a[1] + dy * k, a[2] + dz * k + 0.6]} color={C[2]} intensity={sang} distance={7} decay={2} /> : null}
    </>;
  };

/** KHIÊN SUE: vòm năng lượng phẳng trước mặt người dựng nó: mảng trong mờ, ô tam giác, viền sáng hai sắc. Có `va` thì vòng gợn chạy ra từ chỗ bị đánh.
 *  pos = tâm vòm (đặt ngang ngực, ngay trước tay). huong 1 = lồi về bên phải khung. mo 0..1 = bung ra. */
export const KhienSue: React.FC<{f: number; pos: V3; r?: number; mo?: number; huong?: 1 | -1; va?: number; seed?: number; rotY?: number; order?: number}> =
  ({f, pos, r = 1.5, mo = 1, huong = 1, va, seed = 1, rotY = 0, order = 556}) => {
    const k = clamp(mo); if (k <= 0.01) return null;
    const C = MAU_FX.sue, N = 26, cung = (R: number, w = 0.68): P2[] => Array.from({length: N + 1}, (_, i) => { const a = -1.22 + (2.44 * i) / N; return [huong * Math.cos(a) * R * w, Math.sin(a) * R]; });
    const R = r * k, ngoai = cung(R), rim = [...cung(R), ...cung(R * 0.92, 0.58).reverse()], rim2 = [...cung(R * 0.89, 0.55), ...cung(R * 0.85, 0.5).reverse()], q = rnd(seed * 11 + 2), tho = 0.9 + 0.1 * Math.sin(f * 0.4);
    const o: P2[][] = []; for (let i = 0; i < 9; i++) { const a = -1 + (2 * i) / 8, b = a + 0.2, x0 = 0.16 + q() * 0.2, x1 = x0 + 0.17; o.push([[huong * Math.cos(a) * R * x1, Math.sin(a) * R * 0.8], [huong * Math.cos(b) * R * (x1 + 0.1), Math.sin(b) * R * 0.82], [huong * Math.cos((a + b) / 2) * R * x0, Math.sin((a + b) / 2) * R * 0.66]]); }
    const d = va === undefined ? -1 : f - va, gon = d >= 0 && d < 12 ? d / 12 : -1;
    return <group position={pos} rotation={[0, rotY, 0]}>
      <Poly pts={[...ngoai]} color={C[1]} opacity={0.44 * tho} order={order} />
      <Poly pts={[...cung(R * 0.8, 0.46)]} color={C[2]} opacity={0.3 * tho} order={order + 1} z={0.002} />
      {o.map((t, i) => <Poly key={i} pts={t} color={C[i % 2 ? 2 : 3]} opacity={0.42} order={order + 2} z={0.004} />)}
      <Poly pts={rim} color={C[2]} order={order + 3} z={0.006} /><Poly pts={rim2} color={C[3]} order={order + 4} z={0.008} />
      {gon >= 0 ? <Poly pts={[...cung(R * (0.4 + 0.6 * gon), 0.62), ...cung(R * (0.34 + 0.6 * gon), 0.56).reverse()]} color={C[3]} opacity={1 - gon} order={order + 5} z={0.01} /> : null}
    </group>;
  };

/** VỆT TỐC ĐỘ: các nêm mảnh song song chạy từ `a` về `b` (b là phía sau người đang lao), rộng `rong` mét theo chiều vuông góc. */
export const VetTocDo: React.FC<{f: number; a: V3; b: V3; n?: number; rong?: number; mau?: string; mau2?: string; seed?: number; order?: number; opacity?: number}> =
  ({f, a, b, n = 16, rong = 1.3, mau = '#ffffff', mau2 = '#bcd8ec', seed = 1, order = 494, opacity = 0.9}) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, rot = Math.atan2(dy, dx);
    return <group position={a} rotation={[0, 0, rot]}>{Array.from({length: n}, (_, i) => { const q = rnd(i * 23 + seed * 5), y = (q() - 0.5) * rong, dai = L * (0.3 + q() * 0.5), w = 0.012 + q() * 0.026, chu = 8 + Math.floor(q() * 8), u = ((f + q() * chu) % chu) / chu, x = u * L * 0.8 + q() * L * 0.2;
      return <Poly key={i} pts={[[x, y], [x + dai * 0.18, y + w], [x + dai, y], [x + dai * 0.18, y - w]]} color={i % 3 ? mau : mau2} opacity={opacity * (1 - u * 0.6)} order={order} z={i * 0.0005} />; })}</group>;
  };

/** ĐUÔI LỬA khi bay: từ `a` (chỗ gót chân) kéo tới `b`, bốn sắc lồng nhau, mép lưỡi lửa, thuôn dần về đuôi. Vẽ TRƯỚC người (order < 500) để gốc đuôi nằm sau thân. */
export const DuoiLua: React.FC<{f: number; a: V3; b: V3; r?: number; seed?: number; order?: number; mau?: MauFx}> = ({f, a, b, r = 0.42, seed = 1, order = 488, mau = 'lua'}) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, rot = Math.atan2(dy, dx), C = MAU_FX[mau], buoc = Math.floor(f / 2), N = 22;
  const luoi = (w: number, len: number, s: number): P2[] => { const q = rnd(seed * 41 + buoc * 3 + s), tren: P2[] = [], duoi: P2[] = []; for (let i = 0; i <= N; i++) { const t = i / N, x = t * L * len, day = Math.sin(Math.PI * Math.min(1, 0.26 + t * 0.74)) * (1 - t) ** 0.7, song = Math.sin(t * 8 + f * 0.42 + s) * r * 0.2 * t, rang = i % 2 ? 1 + q() * 0.42 : 0.66 + q() * 0.16; tren.push([x, song + w * r * day * rang]); duoi.unshift([x, song - w * r * day * (i % 2 ? 0.7 + q() * 0.2 : 1 + q() * 0.34)]); } return [...tren, ...duoi]; };
  return <group position={a} rotation={[0, 0, rot]}>{([[dam(C[0], 0.8), 1.2, 1], [C[1], 0.94, 0.86], [C[2], 0.62, 0.66], [C[3], 0.32, 0.42]] as [string, number, number][]).map(([c, w, len], i) => <Poly key={i} pts={luoi(w, len, i)} color={c} order={order + i} z={i * 0.002} />)}</group>;
};

// ---------------------------------------------------------------- mảnh vỡ, khói
/** MẢNH VỠ góc cạnh: văng từ `pos` lúc `at`, rơi theo trọng lực, xoay; ba tông cho mỗi loại. huong = hướng văng chính [x, y] (mét/giây). dat = cao độ mặt đất. */
export const ManhVo: React.FC<{f: number; at: number; pos: V3; n?: number; s?: number; huong?: [number, number]; toa?: number; dat?: number; mau?: string[]; seed?: number; order?: number; life?: number}> =
  ({f, at, pos, n = 24, s = 0.16, huong = [0, 3.4], toa = 4.6, dat = 0, mau = ['#8d8880', '#6a665f', '#b4aea4', '#3f3b37'], seed = 1, order = 566, life = 46}) => {
    const d = f - at; if (d < 0 || d > life) return null;
    return <>{Array.from({length: n}, (_, i) => { const q = rnd(i * 37 + seed * 9), a = q() * Math.PI * 2, v = toa * (0.35 + q() * 0.8), vx = huong[0] + Math.cos(a) * v, vy = huong[1] + Math.abs(Math.sin(a)) * v * 0.9, vz = (q() - 0.3) * 2.2, t = d / 24, x = pos[0] + vx * t, y0 = pos[1] + vy * t - 4.9 * t * t, nay = y0 < dat, y = nay ? dat + 0.02 : y0, z = pos[2] + vz * t, k = s * (0.45 + q() * 0.95) * (d > life - 8 ? (life - d) / 8 : 1), side = 3 + (i % 3), sp = (q() - 0.5) * 0.9, c = mau[i % mau.length];
      return <mesh key={i} position={[nay ? pos[0] + vx * Math.sqrt(Math.max(0, (2 * (pos[1] - dat + (vy * vy) / 19.6)) / 9.8)) * 0.72 : x, y, z]} rotation={nay ? [-Math.PI / 2, 0, i] : [d * sp, d * sp * 0.7, d * sp * 1.3 + i]} scale={[k * (1 + (i % 2) * 0.5), k, 1]} renderOrder={order}><circleGeometry args={[1, side]} /><meshBasicMaterial color={c} side={THREE.DoubleSide} transparent depthWrite={false} fog={false} toneMapped={false} /></mesh>; })}</>;
  };

/** KHÓI PHẲNG: các cụm hình tròn chồng nhau, ba sắc mép sắc (sẫm dưới, giữa, sáng trên), bốc lên, nở ra rồi co lại mà hết; không tô nhoè.
 *  Cùng cách vẽ với mây phẳng của `Explosion` ở cảnh nổ `dh-12`. tones = [sẫm, giữa, sáng]. */
export const KhoiPhang: React.FC<{f: number; at: number; pos: V3; s?: number; n?: number; rong?: number; bay?: number; gio?: number; tones?: [string, string, string]; seed?: number; life?: number; order?: number; rotY?: number}> =
  ({f, at, pos, s = 1, n = 10, rong = 1.4, bay = 1.6, gio = 0.3, tones = ['#57525c', '#8f8b94', '#c4c0c4'], seed = 1, life = 54, order = 554, rotY = 0}) => {
    const cum = useMemo(() => Array.from({length: n}, (_, i) => { const q = rnd(i * 43 + seed * 19); return {x: (q() - 0.5) * rong, sinh: Math.floor(q() * 12), v: bay * (0.55 + q() * 0.7), g: gio * (0.5 + q()), k: s * (0.42 + q() * 0.5), lobes: Array.from({length: 6}, () => [(q() - 0.5) * 1.05, (q() - 0.5) * 0.62, 0.3 + q() * 0.28] as V3)}; }), [n, rong, bay, gio, s, seed]);
    if (f < at) return null;
    return <group position={pos} rotation={[0, rotY, 0]}>{cum.map((p, i) => { const a = f - at - p.sinh; if (a < 0 || a > life) return null; const t = a / life, tg = a / 24, k = p.k * Math.min(1, a / 5) * (0.72 + 0.72 * t) * (t > 0.72 ? 1 - ((t - 0.72) / 0.28) ** 2 : 1); if (k <= 0.005) return null;
      return <group key={i} position={[p.x + p.g * tg, p.v * tg * (1 - t * 0.28) + 0.1, i * 0.006]} scale={[k, k, 1]}>
        {p.lobes.map(([x, y, r], j) => <mesh key={`a${j}`} position={[x + 0.05, y - 0.07, 0]} renderOrder={order}><circleGeometry args={[r * 1.06, 16]} /><meshBasicMaterial color={tones[0]} transparent depthWrite={false} fog={false} toneMapped={false} /></mesh>)}
        {p.lobes.map(([x, y, r], j) => <mesh key={`b${j}`} position={[x, y, 0.001]} renderOrder={order + 1}><circleGeometry args={[r * 0.92, 16]} /><meshBasicMaterial color={tones[1]} transparent depthWrite={false} fog={false} toneMapped={false} /></mesh>)}
        {p.lobes.slice(0, 4).map(([x, y, r], j) => <mesh key={`c${j}`} position={[x - r * 0.22, y + r * 0.24, 0.002]} renderOrder={order + 2}><circleGeometry args={[r * 0.54, 14]} /><meshBasicMaterial color={tones[2]} transparent depthWrite={false} fog={false} toneMapped={false} /></mesh>)}
      </group>; })}</group>;
  };
