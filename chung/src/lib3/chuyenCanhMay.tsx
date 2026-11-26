// lib3/chuyenCanhMay: CHUYỂN CẢNH CÓ MÁY (bản THỬ 25/11/2026, chưa thành luật: luật 25a). Đi kèm lib3/chuyenCanh (gat, lia, vao-bong, hoa).
// Mọi kiểu ở đây ghép 2D trên hai lớp cảnh dựng sẵn (dời, phóng, cắt, hoà) cộng một lớp vẽ cắt giấy (trời, tròng mắt, vật bay, quả
// địa cầu). Chuyển cảnh được tăng giảm tốc ở hai đầu (khác máy trong cảnh). Mỗi kiểu dài 10–24 khung chồng. Toạ độ khung: [x, y] là
// phần bề ngang và bề cao khung (0..1, gốc trên trái); bán kính là phần BỀ CAO khung.
//
// | tên         | là gì                                                     | dùng khi                                   | tham số (ngoài kieu, chong, truoc, som) |
// |-------------|-----------------------------------------------------------|--------------------------------------------|-----------------------------------------|
// | lao-cua     | máy lao vào một ô cửa của cảnh trước; ô kính loé sáng,    | ra ngoài nhìn vào phòng, đi từ chung sang  | cua [tâm x, tâm y, rộng, cao] = Ô KÍNH  |
// |             | cảnh sau hiện trong ô rồi nở ra kín khung (thị sai: cảnh  | riêng (6-08 → 6-09 làm bằng 3D, đây là bản | (không gồm khung gỗ); mau = ánh kính    |
// |             | sau nằm sâu hơn ô cửa nên to dần chậm hơn ô)              | 2D dùng lại cho mọi cảnh có ô cửa, cửa ra  | (mặc định '#fff1cf')                    |
// |             |                                                           | vào, cửa sổ xe, khung tranh)               | chong 16–22                              |
// | lui-cua     | ngược lao-cua: cảnh trước thu lại thành ô cửa trong cảnh  | từ trong phòng ra ngoài, kết một chuỗi     | cua = ô kính trong CẢNH SAU; mau        |
// |             | sau, máy lùi ra; ô loé sáng rồi trả lại kính của cảnh sau | cảnh trong nhà                             | chong 16–22                              |
// | vao-mat     | máy lao vào mắt nhân vật; con ngươi phản chiếu cảnh sau   | nhớ lại, tưởng tượng, nhìn thấy điều gì;   | mat [x, y] tâm tròng mắt; đầu trôi thì  |
// |             | (tròn, cong như mặt cầu, có lóa), rồi hình phản chiếu nở  | cảnh trước trung hoặc cận mặt, mắt mở      | cho dãy [[x, y], ...] chia đều từ khung |
// |             | ra kín khung                                              | suốt các khung chồng (không chớp), tròng   | chồng đầu tới cuối (lệch vài px là lộ   |
// |             |                                                           | mắt ≥ 12 px ở 720p                         | vành tròng thật); r bán kính tròng; mau |
// |             |                                                           |                                            | màu tròng — chong 14–18 (lao nhanh)      |
// | khop-hinh   | nối hai hình giống nhau: cảnh trước dời và phóng để hình  | vòng máy → quả cầu, mặt trăng → đĩa đèn,   | a [x, y, r] hình ở cảnh trước,          |
// |             | trùng hình cảnh sau, hoà vài khung, cảnh sau về khung     | ô cửa → khung tranh: hai vật cùng dáng ở   | b [x, y, r] hình ở cảnh sau             |
// |             | chuẩn (cả hai được phóng thêm chung quanh tâm hình khi    | hai nơi, hai thời                           | chong 14–20                              |
// |             | cần, để không lộ mép)                                     |                                            |                                          |
// | ngoc-troi   | máy ngước lên trời cắt giấy (mây trôi, mặt trời / trăng,  | đổi nơi ngoài trời, thời gian trôi trong   | gio 'ngay' | 'chang-vang' | 'dem' (trời |
// |             | mây che đường nối), giữ một nhịp, rồi hạ xuống nơi mới    | ngày (trời đổi màu trong nhịp giữ)         | lúc ngước), gioSau (trời lúc hạ)        |
// |             | (2D: máy 3D chỉ ngước được 2,5°)                          |                                            | chong 20–24                              |
// | bay-dia-cau | lùi ra quả địa cầu (kitDiaCau), cầu quay sang nơi mới,     | đổi nước, đổi châu lục                     | noiDi [kinh, vĩ], noiDen [kinh, vĩ]      |
// |             | đường chấm chạy theo, rồi lao vào cảnh sau                 |                                            | chong 24 (ba nhịp 34 / 32 / 34 %)       |
// | theo-vat    | một vật cắt giấy bị ném ra khỏi khung cảnh trước, máy đi  | nối hai nơi bằng một đồ vật đi qua (lá     | vat 'thu' | 'bong' | 'giay'; tu [x, y]   |
// |             | theo (lia ngang), vật rơi vào khung cảnh sau và xa dần    | thư gửi đi, quả bóng, tờ giấy bay)         | trong cảnh trước; den [x, y] trong cảnh |
// |             |                                                           |                                            | sau; huong 'phai' | 'trai'; cao (vồng,  |
// |             |                                                           |                                            | mặc định 0,3); co (cỡ vật, mặc định     |
// |             |                                                           |                                            | 0,07) — chong 18–24                      |
//
// CÁCH DÙNG. Đặt kiểu ở đây vào trường `chuyen` của CanhNoi và ghép bằng `NoiCanh` (lib3/chuyenCanh): NoiCanh tự gọi lopChuyenMay,
// LopNenMay (dưới hai cảnh), LopPhuMay (trên, zIndex 2) và useNapBanDoCau. `NoiCanhMay` chỉ còn là bí danh của NoiCanh.
// Không import gì của kênh.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {NoiCanh} from './chuyenCanh';
import type {Chuyen, CanhNoi} from './chuyenCanh';
import {DiaCau, NenVuTru, DuongDi, cauEye} from './kitDiaCau';
import {StageCam} from './kit';

export type KieuChuyenMay = 'lao-cua' | 'lui-cua' | 'vao-mat' | 'khop-hinh' | 'ngoc-troi' | 'bay-dia-cau' | 'theo-vat';
export const KIEU_CHUYEN_MAY: KieuChuyenMay[] = ['lao-cua', 'lui-cua', 'vao-mat', 'khop-hinh', 'ngoc-troi', 'bay-dia-cau', 'theo-vat'];
type XY = [number, number];
export type GioTroi = 'ngay' | 'chang-vang' | 'dem';
export type VatBay = 'thu' | 'bong' | 'giay';
/** một chuyển cảnh có máy. chong / truoc / som như Chuyen của lib3/chuyenCanh (thiếu chong thì lấy CHONG_MAY_MAC_DINH).
 *  Tham số riêng từng kiểu: xem bảng đầu file. */
export type ChuyenMay = {
  kieu: KieuChuyenMay; chong?: number; truoc?: number; som?: boolean;
  cua?: [number, number, number, number]; mau?: string;
  mat?: XY | XY[]; r?: number;
  a?: [number, number, number]; b?: [number, number, number];
  gio?: GioTroi; gioSau?: GioTroi;
  noiDi?: XY; noiDen?: XY;
  vat?: VatBay; tu?: XY; den?: XY; huong?: 'trai' | 'phai'; cao?: number; co?: number;
};
export const CHONG_MAY_MAC_DINH: Record<KieuChuyenMay, number> = {'lao-cua': 20, 'lui-cua': 20, 'vao-mat': 16, 'khop-hinh': 16, 'ngoc-troi': 24, 'bay-dia-cau': 24, 'theo-vat': 22};
export const chongMay = (c: ChuyenMay) => Math.max(2, Math.round(c.chong ?? CHONG_MAY_MAC_DINH[c.kieu]));
export type ChuyenBatKy = Chuyen | ChuyenMay;
export const laChuyenMay = (c?: ChuyenBatKy): c is ChuyenMay => !!c && (KIEU_CHUYEN_MAY as string[]).includes(c.kieu);
/** bí danh cũ: CanhNoi đã nhận cả hai bộ kiểu */
export type CanhNoiMay = CanhNoi;
/** kết quả cho một lớp cảnh: style đặt lên lớp; defs (bộ lọc SVG) vẽ BÊN TRONG lớp */
export type LopMay = {style: React.CSSProperties; defs: React.ReactNode};

const kep = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const muot = (p: number) => { const x = kep(p); return x * x * (3 - 2 * x); };
/** tiến độ có gia tốc vừa phải ở hai đầu, trong đoạn [a, b] của p */
const doan = (p: number, a: number, b: number) => muot((p - a) / (b - a));
const px = (v: number) => `${v.toFixed(2)}px`;
const tron = (v: number) => Math.max(0, v);

/** bộ lọc nhoè một chiều (x, y = độ lệch chuẩn theo px của lớp) */
const NhoeLoc: React.FC<{id: string; x: number; y: number}> = ({id, x, y}) => <svg style={{position: 'absolute', width: 0, height: 0}} aria-hidden>
  <defs><filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation={`${Math.max(0, x)} ${Math.max(0, y)}`} edgeMode="duplicate" /></filter></defs>
</svg>;
const coNhoe = (id: string, x: number, y: number): LopMay | null => (x > 0.3 || y > 0.3 ? {style: {filter: `url(#${id})`}, defs: <NhoeLoc id={id} x={x} y={y} />} : null);

/** bề lớp cảnh (đặt tâm ở (cx, cy), phóng g) phải phủ phần vùng R nằm trong khung: g nhỏ nhất */
const phuG = (cx: number, cy: number, R: number[], W: number, H: number) => {
  const x0 = Math.max(0, R[0]), y0 = Math.max(0, R[1]), x1 = Math.min(W, R[2]), y1 = Math.min(H, R[3]);
  if (x1 <= x0 || y1 <= y0) return 0;
  return Math.max((cx - x0) / (W / 2), (x1 - cx) / (W / 2), (cy - y0) / (H / 2), (y1 - cy) / (H / 2));
};

// ================================================================ lao-cua / lui-cua
/** hình học ô cửa ở tiến độ q (0 = cảnh NGOÀI đứng ở khung chuẩn, ô cửa nhỏ; 1 = ô cửa đã nở kín khung).
 *  Cảnh ngoài phóng theo luỹ thừa (đều trên thang log, như máy lao đều), tâm ô trôi về giữa khung cùng nhịp phóng.
 *  Cảnh trong nằm sâu hơn ô: phóng chậm hơn (luỹ thừa 0,6), nhưng luôn đủ phủ phần ô đang thấy. */
const hinhCua = (cua: [number, number, number, number], q: number, W: number, H: number) => {
  const x0 = cua[0] * W, y0 = cua[1] * H, ww = Math.max(4, cua[2] * W), hh = Math.max(4, cua[3] * H);
  const S = Math.max(W / ww, H / hh, 1.01), E = muot(q), s = Math.pow(S, E), k = (s - 1) / (S - 1);
  const cx = x0 + (W / 2 - x0) * k, cy = y0 + (H / 2 - y0) * k;
  const R = [cx - (s * ww) / 2, cy - (s * hh) / 2, cx + (s * ww) / 2, cy + (s * hh) / 2];
  const g = Math.max(Math.pow(s / S, 0.6), phuG(cx, cy, R, W, H));
  const tx = cx - (g * W) / 2, ty = cy - (g * H) / 2;
  const l = (R[0] - tx) / g, t = (R[1] - ty) / g, r = (R[2] - tx) / g, b = (R[3] - ty) / g;
  return {
    R, s,
    ngoai: {transform: `translate(${px(cx - s * x0)}, ${px(cy - s * y0)}) scale(${s.toFixed(5)})`, transformOrigin: '0 0'} as React.CSSProperties,
    trong: {transform: `translate(${px(tx)}, ${px(ty)}) scale(${g.toFixed(5)})`, transformOrigin: '0 0', clipPath: `inset(${px(tron(t))} ${px(tron(W - r))} ${px(tron(H - b))} ${px(tron(l))})`} as React.CSSProperties,
  };
};
const CUA0: [number, number, number, number] = [0.5, 0.4, 0.06, 0.1];
/** q của ô cửa theo p: lao-cua đi tới, lui-cua đi lùi */
const qCua = (c: ChuyenMay, p: number) => (c.kieu === 'lui-cua' ? 1 - p : p);
/** độ hiện của cảnh trong ô (dưới lớp kính loé) và độ loé của kính theo q */
const hienTrong = (q: number) => doan(q, 0.03, 0.2);
const loeKinh = (q: number) => 0.85 * doan(q, 0, 0.12) * (1 - doan(q, 0.3, 0.62));

// ================================================================ vao-mat
/** bản đồ dời hình cho mặt cầu (feDisplacementMap): điểm ở bán kính u (phần bán kính đĩa) lấy hình ở bán kính u·(0,75 + 0,55 u²):
 *  giữa phóng to, mép nén lại (thấy rộng hơn 1,3 lần), như hình soi trên con ngươi lồi. Mã hoá: kênh = 0,5 + độ dời / CAU_A. */
const CAU_A = 0.64, CAU_N = 256;
let banDo: string | null = null;
export const banDoCau = () => {
  if (banDo) return banDo;
  const cv = document.createElement('canvas'); cv.width = CAU_N; cv.height = CAU_N;
  const c = cv.getContext('2d')!, img = c.createImageData(CAU_N, CAU_N), d = img.data;
  for (let j = 0; j < CAU_N; j++) for (let i = 0; i < CAU_N; i++) {
    const ux = ((i + 0.5) / CAU_N) * 2 - 1, uy = ((j + 0.5) / CAU_N) * 2 - 1, u = Math.hypot(ux, uy), f = u < 1 ? 0.75 - 1 + 0.55 * u * u : 0;
    const o = (j * CAU_N + i) * 4; d[o] = Math.round(255 * kep(0.5 + (ux * f) / CAU_A)); d[o + 1] = Math.round(255 * kep(0.5 + (uy * f) / CAU_A)); d[o + 2] = 128; d[o + 3] = 255;
  }
  c.putImageData(img, 0, 0); banDo = cv.toDataURL('image/png');
  return banDo;
};
/** nạp sẵn tấm bản đồ trước khi chụp khung (gọi một lần trong component ghép chuỗi) */
export const useNapBanDoCau = () => {
  const [h] = useState(() => delayRender('chuyenCanhMay: ban do mat cau'));
  useEffect(() => { const img = new Image(); img.onload = () => continueRender(h); img.onerror = () => continueRender(h); img.src = banDoCau(); }, [h]);
};
/** tâm mắt ở tiến độ p: một điểm, hoặc dãy điểm chia đều theo p (nội suy thẳng giữa hai điểm kề) */
const diemMat = (m: XY | XY[] | undefined, p: number): XY => {
  if (!m) return [0.5, 0.4];
  if (!Array.isArray(m[0])) return m as XY;
  const L = m as XY[];
  if (L.length < 2) return L[0] ?? [0.5, 0.4];
  const t = kep(p) * (L.length - 1), i = Math.min(L.length - 2, Math.floor(t)), u = t - i;
  return [L[i][0] + (L[i + 1][0] - L[i][0]) * u, L[i][1] + (L[i + 1][1] - L[i][1]) * u];
};
const hinhMat = (c: ChuyenMay, p: number, W: number, H: number) => {
  const m = diemMat(c.mat, p), x0 = W * m[0], y0 = H * m[1];
  const r0 = Math.max(3, (c.r ?? 0.03) * H), S = Math.max(1.01, (1.04 * Math.hypot(W / 2, H / 2)) / r0);
  const E = doan(p, 0.04, 1), s = Math.pow(S, E), k = (s - 1) / (S - 1);
  const cx = x0 + (W / 2 - x0) * k, cy = y0 + (H / 2 - y0) * k;
  const ri = r0 * s, rho = ri * (0.8 + 0.2 * E * E), cong = 1 - doan(E, 0.6, 1);   // giữ cong rõ tới khi con ngươi đã lớn, rồi phẳng dần
  const gFit = Math.min(1, (2 * 1.32 * rho) / H), rr = rho * (1 + 0.3 * cong);
  const g = Math.max(gFit, phuG(cx, cy, [cx - rr, cy - rr, cx + rr, cy + rr], W, H));
  return {x0, y0, s, cx, cy, ri, rho, cong, g, E};
};

// ================================================================ khop-hinh
/** khop-hinh: hoà từ KHOP_HOA[0] tới KHOP_HOA[1] của p (cảnh sau hiện trên cảnh trước) */
const KHOP_HOA: [number, number] = [0.32, 0.6];
const khopHinhHoc = (c: ChuyenMay, W: number, H: number) => {
  const a = c.a ?? [0.5, 0.5, 0.3], b = c.b ?? [0.5, 0.5, 0.3];
  const A = {x: kep(a[0], 0.01, 0.99) * W, y: kep(a[1], 0.01, 0.99) * H, r: Math.max(2, a[2] * H)}, B = {x: kep(b[0], 0.01, 0.99) * W, y: kep(b[1], 0.01, 0.99) * H, r: Math.max(2, b[2] * H)};
  /** tâm, bán kính hình chung C ở p; độ phóng của hai lớp; độ phóng thêm (quanh C) nhỏ nhất để các lớp đang thấy phủ kín khung */
  const tai = (p: number) => {
    const E = muot(p), Cx = A.x + (B.x - A.x) * E, Cy = A.y + (B.y - A.y) * E, Cr = A.r * Math.pow(B.r / A.r, E), ka = Cr / A.r, kb = Cr / B.r;
    const can = (k: number, P: {x: number; y: number}) => Math.max(Cx / (k * P.x), (W - Cx) / (k * (W - P.x)), Cy / (k * P.y), (H - Cy) / (k * (H - P.y)));
    return {Cx, Cy, ka, kb, can: Math.max(p <= KHOP_HOA[1] ? can(ka, A) : 0, p >= KHOP_HOA[0] ? can(kb, B) : 0)};
  };
  // phóng thêm là MỘT vòm mượt (0 ở hai đầu, đỉnh Z suốt quãng hoà), không giật theo lúc lớp sau bắt đầu được tính
  let Z = 1;
  for (let i = 0; i <= 40; i++) Z = Math.max(Z, tai(i / 40).can);
  return {A, B, tai, Z};
};
const hinhKhop = (c: ChuyenMay, p: number, W: number, H: number) => {
  const {A, B, tai, Z} = khopHinhHoc(c, W, H), t = tai(p);
  const vom = doan(p, 0, KHOP_HOA[0]) * (1 - doan(p, KHOP_HOA[1], 1)), z = Math.max(Math.pow(Z, vom), t.can);
  const lop = (k: number, P: {x: number; y: number}): React.CSSProperties => ({transform: `translate(${px(t.Cx - z * k * P.x)}, ${px(t.Cy - z * k * P.y)}) scale(${(z * k).toFixed(5)})`, transformOrigin: '0 0'});
  return {truoc: lop(t.ka, A), sau: lop(t.kb, B)};
};

// ================================================================ ngoc-troi
const nhipTroi = (p: number, H: number) => {
  const e1 = doan(p, 0, 0.42), e2 = doan(p, 0.58, 1);
  return {e1, e2, ranh: p < 0.5 ? H * e1 : H * (1 - e2)};   // ranh = đường nối trời với cảnh (mép trên của cảnh đang thấy)
};
/** tốc độ đường nối (px / khung) để làm nhoè dọc */
const tocTroi = (p: number, H: number, chong: number) => Math.abs(nhipTroi(kep(p + 0.5 / chong), H).ranh - nhipTroi(kep(p - 0.5 / chong), H).ranh);

// ================================================================ bay-dia-cau
const CAU_DI = 0.34, CAU_DEN = 0.66, CAU_M = 3, CAU_CHIEM = 0.62;
const nhipCau = (c: ChuyenMay, p: number) => {
  const di = c.noiDi ?? [-74, 40.7], den = c.noiDen ?? [20.9, 45.6];
  // nhịp đi: mép mờ hiện dần (cảnh còn nguyên cỡ) rồi mới co; nhịp đến ngược lại. Khung chồng đầu và cuối là đúng khung chuẩn.
  const u = doan(p, 0.1, CAU_DI), v = doan(p, CAU_DEN, 0.9), w = doan(p, CAU_DI, CAU_DEN);
  const mo = p < 0.5 ? doan(p, 0.02, 0.16) : 1 - doan(p, 0.84, 0.98);
  const m = p < 0.5 ? Math.pow(CAU_M, 1 - u) : Math.pow(CAU_M, v);
  return {u, v, w, m, mo, lon: di[0] + (den[0] - di[0]) * w, lat: di[1] + (den[1] - di[1]) * w, di, den};
};
/** lớp cảnh co vào quả cầu: phóng nhỏ quanh giữa khung, mép mờ theo hình elip. mo (0..1) = độ mờ mép: lên đủ TRƯỚC khi cảnh co
 *  (mép lớp đã trong suốt khi cảnh bắt đầu nhỏ lại), nên không bao giờ thấy mép chữ nhật của cảnh trên nền vũ trụ, và quả cầu lộ
 *  ra dần ở bốn góc chứ không bật ra trong một khung. */
const coVaoCau = (scale: number, mo: number, hien: number, W: number, H: number): React.CSSProperties => {
  const R = 1.6 - 0.6 * mo - 0.3 * kep((0.9 - scale) / 0.6), fe = 0.05 + 0.35 * mo;
  const mask = `radial-gradient(${px((R * W) / 2)} ${px((R * H) / 2)} at 50% 50%, #000 ${((1 - fe) * 100).toFixed(1)}%, transparent 100%)`;
  return {transform: `scale(${scale.toFixed(5)})`, transformOrigin: '50% 50%', opacity: hien, maskImage: mask, WebkitMaskImage: mask};
};

// ================================================================ theo-vat
const nhipVat = (c: ChuyenMay, p: number, W: number, H: number) => {
  const dir = c.huong === 'trai' ? -1 : 1, X = W * doan(p, 0.12, 0.88), tu = c.tu ?? [0.3, 0.5], den = c.den ?? [0.6, 0.8];
  const F = kep(p / 0.92), xw = tu[0] * W + (dir * W + den[0] * W - tu[0] * W) * F;
  const y = (tu[1] + (den[1] - tu[1]) * F) * H - (c.cao ?? 0.3) * H * 4 * F * (1 - F);
  const co = (c.co ?? 0.07) * H * (0.7 + 0.3 * doan(p, 0, 0.08)) * (1 + 0.3 * Math.sin(Math.PI * F)) * (1 - 0.45 * doan(p, 0.8, 1));
  const kind = c.vat ?? 'giay', quay = kind === 'thu' ? 25 * Math.sin(F * Math.PI * 3) + dir * F * 40 : kind === 'bong' ? dir * F * 540 : dir * F * 400;
  return {dir, X, x: xw - dir * X, y, co, quay, hien: doan(p, 0, 0.08) * (1 - doan(p, 0.9, 1))};
};

// ================================================================ lớp cảnh
/** style (và defs) của lớp cảnh TRƯỚC (vai 'truoc') hoặc SAU ('sau') ở tiến độ p (0 → 1 qua các khung chồng). id: duy nhất trong khung. */
export const lopChuyenMay = (c: ChuyenMay, vai: 'truoc' | 'sau', p: number, W: number, H: number, id: string): LopMay => {
  const none: LopMay = {style: {}, defs: null};
  switch (c.kieu) {
    case 'lao-cua': case 'lui-cua': {
      const q = qCua(c, p), h = hinhCua(c.cua ?? CUA0, q, W, H), ngoai = (c.kieu === 'lao-cua') === (vai === 'truoc');
      if (ngoai) return {style: h.ngoai, defs: null};
      // cảnh trong ô: lao-cua là cảnh sau (vốn nằm trên); lui-cua là cảnh trước, phải nâng lên trên cảnh sau
      return {style: {...h.trong, opacity: hienTrong(q), ...(c.kieu === 'lui-cua' ? {zIndex: 1} : {})}, defs: null};
    }
    case 'vao-mat': {
      const m = hinhMat(c, p, W, H);
      if (vai === 'truoc') return {style: {transform: `translate(${px(m.cx - m.s * m.x0)}, ${px(m.cy - m.s * m.y0)}) scale(${m.s.toFixed(5)})`, transformOrigin: '0 0'}, defs: null};
      const Rl = m.rho / m.g, tx = m.cx - (m.g * W) / 2, ty = m.cy - (m.g * H) / 2, sc = m.cong * CAU_A * Rl;
      return {
        style: {transform: `translate(${px(tx)}, ${px(ty)}) scale(${m.g.toFixed(5)})`, transformOrigin: '0 0', clipPath: `circle(${px(Rl)} at ${px(W / 2)} ${px(H / 2)})`,
          opacity: doan(p, 0, 0.16), filter: `${sc > 0.5 ? `url(#${id}) ` : ''}brightness(${(0.88 + 0.12 * m.E).toFixed(3)})`},
        defs: sc > 0.5 ? <svg style={{position: 'absolute', width: 0, height: 0}} aria-hidden><defs>
          <filter id={id} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x={0} y={0} width={W} height={H} colorInterpolationFilters="sRGB">
            <feFlood floodColor="rgb(128,128,128)" result="nen" />
            <feImage href={banDoCau()} x={W / 2 - Rl} y={H / 2 - Rl} width={2 * Rl} height={2 * Rl} preserveAspectRatio="none" result="ban" />
            <feMerge result="ma"><feMergeNode in="nen" /><feMergeNode in="ban" /></feMerge>
            <feDisplacementMap in="SourceGraphic" in2="ma" scale={sc} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs></svg> : null,
      };
    }
    case 'khop-hinh': {
      const h = hinhKhop(c, p, W, H);
      return vai === 'truoc' ? {style: h.truoc, defs: null} : {style: {...h.sau, opacity: doan(p, KHOP_HOA[0], KHOP_HOA[1])}, defs: null};
    }
    case 'ngoc-troi': {
      const t = nhipTroi(p, H), n = coNhoe(id, 0, 0.12 * tocTroi(p, H, chongMay(c)));
      const tr = vai === 'truoc' ? `translateY(${px(H * t.e1)})` : `translateY(${px(H * (1 - t.e2))})`;
      return {style: {transform: tr, ...(n?.style ?? {})}, defs: n?.defs ?? null};
    }
    case 'bay-dia-cau': {
      const k = nhipCau(c, p);
      return vai === 'truoc' ? {style: coVaoCau(k.m / CAU_M, k.mo, 1 - doan(p, 0.14, CAU_DI), W, H), defs: null}
        : {style: coVaoCau(k.m / CAU_M, k.mo, doan(p, CAU_DEN, 0.86), W, H), defs: null};
    }
    case 'theo-vat': {
      const v = nhipVat(c, p, W, H), toc = Math.abs(nhipVat(c, kep(p + 0.5 / chongMay(c)), W, H).X - nhipVat(c, kep(p - 0.5 / chongMay(c)), W, H).X), n = coNhoe(id, 0.14 * toc, 0);
      const x = vai === 'truoc' ? -v.dir * v.X : v.dir * (W - v.X);
      return {style: {transform: `translateX(${px(x)})`, ...(n?.style ?? {})}, defs: n?.defs ?? null};
    }
  }
  return none;
};

// ================================================================ lớp phủ (trên cả hai cảnh) và lớp nền (dưới cả hai cảnh)
type Mau3 = [number, number, number];
const hex = (h: string): Mau3 => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const tron2 = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * kep(t))).join(',')})`; };
const BANG_TROI: Record<GioTroi, {troi: string; cao: string; may: string; bong: string; mat: string; quang: string}> = {
  'ngay': {troi: '#8cc4e8', cao: '#6eaedf', may: '#fbfbf5', bong: '#cfe0ee', mat: '#fff3c4', quang: '#ffe9a6'},
  'chang-vang': {troi: '#f2a77c', cao: '#c9789a', may: '#ffe0b8', bong: '#e8977f', mat: '#ffd986', quang: '#ffbf6a'},
  'dem': {troi: '#2d3a7c', cao: '#222a64', may: '#4a5aa8', bong: '#38438a', mat: '#efe8cf', quang: '#3d4a90'},
};
/** trời đổi giờ đi qua một bảng tím hồng ở giữa (trộn thẳng xanh với cam ra màu xám) */
const TROI_GIUA = {troi: '#b9a6d8', cao: '#8e7cc0', may: '#f6e6f0', bong: '#c9b0d2', mat: '#ffe6b0', quang: '#f3c6a0'};
const tron3 = (a: string, giua: string, b: string, t: number) => (a === b ? a : t < 0.5 ? tron2(a, giua, 2 * t) : tron2(giua, b, 2 * t - 1));
/** dáng mây cắt giấy: đáy gần phẳng có răng nhỏ, đỉnh là vài u tròn cắt thành cạnh gãy (7 điểm một u) */
const dangMay = (cx: number, cy: number, w: number, h: number, seed: number, day = 0.04) => {
  const hs = (i: number) => { const r = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453; return r - Math.floor(r); };
  const n = 3 + (seed % 3), pts: string[] = [];
  for (let i = 0; i <= 6; i++) pts.push(`${(cx - w / 2 + (w * i) / 6).toFixed(1)},${(cy + h * day * (hs(i + 20) - 0.3)).toFixed(1)}`);
  for (let i = n - 1; i >= 0; i--) {
    const bw = w / n, bx = cx - w / 2 + bw * (i + 0.5), rx = bw * 0.62, ry = h * (0.45 + 0.55 * hs(i));
    for (let k = 0; k <= 6; k++) { const a = (Math.PI * k) / 6; pts.push(`${(bx + rx * Math.cos(a)).toFixed(1)},${(cy - ry * Math.sin(a)).toFixed(1)}`); }
  }
  return pts.join(' ');
};
/** mây: [x (phần khung), độ cao trên đường nối (phần khung), bề ngang (phần khung), hệ số thị sai] */
const MAY_XA: [number, number, number, number][] = [[0.14, 0.86, 0.2, 0.68], [0.57, 1.02, 0.15, 0.68], [0.9, 0.79, 0.17, 0.7], [0.36, 1.2, 0.12, 0.66]];
const MAY_GIUA: [number, number, number, number][] = [[0.3, 0.55, 0.27, 0.86], [0.8, 0.43, 0.22, 0.88], [0.04, 0.37, 0.19, 0.85], [0.62, 0.68, 0.14, 0.84]];
const SAO: XY[] = [[0.07, 0.9], [0.2, 1.1], [0.33, 0.8], [0.45, 1.25], [0.52, 0.93], [0.66, 1.15], [0.74, 0.84], [0.86, 1.05], [0.95, 0.88], [0.13, 1.32], [0.41, 1.02], [0.6, 1.36], [0.81, 1.3], [0.27, 1.45]];
const TroiGiay: React.FC<{c: ChuyenMay; p: number; id: string; l: number}> = ({c, p, id, l}) => {
  const {width: W, height: H} = useVideoConfig(), t = nhipTroi(p, H), Y = t.ranh;
  if (Y <= 0.5) return null;
  const g0 = BANG_TROI[c.gio ?? 'ngay'], g1 = BANG_TROI[c.gioSau ?? c.gio ?? 'ngay'], k = doan(p, 0.36, 0.66), m = (key: keyof typeof g0) => tron3(g0[key], TROI_GIUA[key], g1[key], k);
  const dem = ((c.gio ?? 'ngay') === 'dem' ? 1 - k : 0) + ((c.gioSau ?? c.gio) === 'dem' ? k : 0);
  const yv = (v: number, f: number) => Y - v * H * f, troi = (f: number) => l * 0.0009 * W * f;
  const nh = 0.12 * tocTroi(p, H, chongMay(c)), bang = kep(Y / (0.1 * H));   // dải mây nối hiện dần khi đường nối mới vào khung
  const may = (list: [number, number, number, number][], seed0: number) => list.map(([x, v, w, f], i) => {
    const cx = ((x * W + troi(f)) % (W * 1.3)) - 0.1 * W, cy = yv(v, f), ww = w * W, hh = ww * 0.42;
    return <g key={`${seed0}-${i}`}><polygon points={dangMay(cx + 0.006 * W, cy + 0.009 * H, ww, hh, seed0 + i)} fill={m('bong')} /><polygon points={dangMay(cx, cy, ww, hh, seed0 + i)} fill={m('may')} /></g>;
  });
  // dải mây che đường nối: các u chồng nhau dọc theo đường nối, đáy răng cưa, chìm xuống dưới đường nối 5 % khung
  // cỡ, khoảng cách, độ nhô lệch nhau (không thành hàng răng đều)
  const daiNoi = [[-0.04, 0.2, 0.3, 0.01], [0.13, 0.13, 0.42, -0.012], [0.27, 0.24, 0.26, 0.006], [0.43, 0.11, 0.48, -0.006], [0.55, 0.19, 0.3, 0.014],
    [0.7, 0.15, 0.4, -0.01], [0.83, 0.22, 0.28, 0.004], [0.99, 0.14, 0.38, -0.008]].map(([x, w, h, dy]) => ({x: x * W + troi(1), w: w * W, h: w * W * h, dy: dy * H}));
  const mx = 0.72 * W, my = yv(0.6 + 0.12 * k, 0.75), mr = 0.075 * H;
  return <AbsoluteFill style={{zIndex: 2, pointerEvents: 'none'}}>
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      {nh > 0.3 ? <defs><filter id={id} x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation={`0 ${nh.toFixed(2)}`} /></filter></defs> : null}
      <g filter={nh > 0.3 ? `url(#${id})` : undefined}>
        <rect x={0} y={-H} width={W} height={Y + H} fill={m('troi')} />
        {/* mảng trời cao sẫm hơn: một tấm cắt, mép dưới là vài vòng cung nông dài không đều (không phải sọc, không răng cưa như núi) */}
        <polygon points={[[-0.05, 1.9], [1.05, 1.9], ...Array.from({length: 23}, (_, i): XY => { const x = 1.05 - (i * 1.1) / 22; return [x, 1.09 - 0.035 * Math.abs(Math.sin(x * 6.3 + 0.7)) + 0.02 * Math.sin(x * 2.1)]; })].map(([x, v]) => `${(x * W).toFixed(1)},${yv(v, 0.66).toFixed(1)}`).join(' ')} fill={m('cao')} />
        {dem > 0.02 ? SAO.map(([x, v], i) => <rect key={i} x={x * W} y={yv(v, 0.66)} width={i % 3 ? 2.5 : 4} height={i % 3 ? 2.5 : 4} fill="#fdf8e8" opacity={dem * 0.85} />) : null}
        <circle cx={mx} cy={my} r={mr * 1.55} fill={m('quang')} opacity={0.45} />
        <circle cx={mx} cy={my} r={mr} fill={m('mat')} />
        {may(MAY_XA, 11)}
        {may(MAY_GIUA, 31)}
        <g opacity={bang}>
          {daiNoi.map((d, i) => <polygon key={`b${i}`} points={dangMay(d.x + 0.006 * W, Y + d.dy + 0.055 * H, d.w, d.h, 50 + i, 0.25)} fill={m('bong')} />)}
          {daiNoi.map((d, i) => <polygon key={`m${i}`} points={dangMay(d.x, Y + d.dy + 0.045 * H, d.w, d.h, 50 + i, 0.25)} fill={m('may')} />)}
        </g>
      </g>
    </svg>
  </AbsoluteFill>;
};
/** vật bay cắt giấy, vẽ trong hộp đơn vị quanh gốc (cạnh ≈ 1) */
const HinhVat: React.FC<{vat: VatBay; id: string}> = ({vat, id}) => {
  if (vat === 'thu') return <>
    <polygon points="-0.7,-0.45 0.7,-0.45 0.7,0.45 -0.7,0.45" fill="#f2e4c2" />
    <polygon points="-0.7,0.45 0,-0.02 0.7,0.45" fill="#e6d3a6" />
    <polygon points="-0.7,-0.45 0.7,-0.45 0,0.12" fill="#dcc592" />
    <circle cx={0} cy={0.1} r={0.13} fill="#b8322a" /><circle cx={-0.035} cy={0.07} r={0.05} fill="#d9584a" />
  </>;
  if (vat === 'bong') return <>
    <defs><clipPath id={id}><circle cx={0} cy={0} r={0.5} /></clipPath></defs>
    <g clipPath={`url(#${id})`}>
      <circle cx={0} cy={0} r={0.5} fill="#a8321f" />
      <circle cx={-0.07} cy={-0.07} r={0.47} fill="#d6452e" />
      <polygon points="-0.55,-0.2 -0.2,-0.08 0.2,0.06 0.55,0.2 0.55,0.36 0.2,0.22 -0.2,0.08 -0.55,-0.04" fill="#f4efe4" />
    </g>
  </>;
  return <>
    <polygon points="-0.55,-0.6 0.1,-0.66 0.58,-0.5 0.52,0.1 0.6,0.62 -0.08,0.58 -0.6,0.64 -0.5,0.05" fill="#f3f0e4" />
    <polygon points="0.1,-0.66 0.58,-0.5 0.52,0.1 0.05,-0.05" fill="#d9d4c3" />
    <polygon points="-0.6,0.64 -0.5,0.05 -0.05,0.2" fill="#e4dfcf" />
    {[[-0.36, -0.4, 0.34], [-0.38, -0.22, 0.4], [-0.36, -0.04, 0.22], [-0.3, 0.16, 0.46], [-0.34, 0.34, 0.3]].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height={0.045} fill="#9a9384" />)}
  </>;
};
/** LỚP PHỦ của chuyển cảnh có máy (zIndex 2): ánh kính ô cửa, tròng mắt và lóa, trời giấy, vật bay. Không có thì trả null. */
export const LopPhuMay: React.FC<{c: ChuyenMay; p: number; id: string}> = ({c, p, id}) => {
  const {width: W, height: H} = useVideoConfig(), l = useCurrentFrame();
  const goc = (children: React.ReactNode) => <AbsoluteFill style={{zIndex: 2, pointerEvents: 'none'}}><svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>{children}</svg></AbsoluteFill>;
  switch (c.kieu) {
    case 'lao-cua': case 'lui-cua': {
      const q = qCua(c, p), h = hinhCua(c.cua ?? CUA0, q, W, H), a = loeKinh(q), [x0, y0, x1, y1] = h.R, dx = (x1 - x0) * 0.18, dy = (y1 - y0) * 0.14;
      if (a < 0.01) return null;
      // ánh kính: lõi phẳng đúng ô, một mảng hắt rộng hơn nhạt hơn (hai sắc, mép sắc)
      return goc(<>
        <rect x={x0 - dx} y={y0 - dy} width={x1 - x0 + 2 * dx} height={y1 - y0 + 2 * dy} fill={c.mau ?? '#fff1cf'} opacity={0.22 * a} />
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={c.mau ?? '#fff1cf'} opacity={a} />
      </>);
    }
    case 'vao-mat': {
      const m = hinhMat(c, p, W, H), hien = doan(p, 0, 0.14), loa = hien * (1 - doan(m.E, 0.72, 0.96)), mau = c.mau ?? '#6b3d1f';
      const vong = (r0: number, r1: number) => `M ${m.cx - r1} ${m.cy} a ${r1} ${r1} 0 1 0 ${2 * r1} 0 a ${r1} ${r1} 0 1 0 ${-2 * r1} 0 Z M ${m.cx - r0} ${m.cy} a ${r0} ${r0} 0 1 0 ${2 * r0} 0 a ${r0} ${r0} 0 1 0 ${-2 * r0} 0 Z`;
      const r = m.rho, gx = m.cx - 0.36 * r, gy = m.cy - 0.42 * r;
      return goc(<g opacity={hien}>
        {/* tròng mắt hai sắc quanh con ngươi soi hình, viền tối ngoài cùng; vành bóng mặt cầu phía trong mép con ngươi */}
        <path d={vong(r, m.ri * 1.02)} fill={mau} fillRule="evenodd" />
        <path d={vong(Math.max(r, m.ri * 0.93), m.ri * 1.06)} fill="#2a160b" fillRule="evenodd" />
        <path d={vong(r * 0.86, r)} fill="#0c1230" fillRule="evenodd" opacity={0.3 * (1 - m.E)} />
        <g opacity={loa}>
          <polygon points={[[-1, -0.5], [0.8, -1], [1, 0.45], [-0.85, 0.95]].map(([x, y]) => `${(gx + x * 0.17 * r).toFixed(1)},${(gy + y * 0.1 * r).toFixed(1)}`).join(' ')} fill="#ffffff" opacity={0.88} transform={`rotate(-32 ${gx} ${gy})`} />
          <circle cx={m.cx + 0.32 * r} cy={m.cy + 0.34 * r} r={0.055 * r} fill="#ffffff" opacity={0.7} />
        </g>
      </g>);
    }
    case 'ngoc-troi': return <TroiGiay c={c} p={p} id={id} l={l} />;
    case 'theo-vat': {
      const v = nhipVat(c, p, W, H);
      if (v.hien < 0.01) return null;
      return goc(<g transform={`translate(${v.x.toFixed(1)} ${v.y.toFixed(1)}) rotate(${v.quay.toFixed(1)}) scale(${v.co.toFixed(2)})`} opacity={v.hien}><HinhVat vat={c.vat ?? 'giay'} id={`${id}-vat`} /></g>);
    }
  }
  return null;
};
/** LỚP NỀN dưới hai cảnh: chỉ bay-dia-cau (quả địa cầu giữa vũ trụ, máy đi gần xa bằng dz, cầu quay theo kinh vĩ) */
export const LopNenMay: React.FC<{c: ChuyenMay; p: number}> = ({c, p}) => {
  const {width, height} = useVideoConfig(), f = useCurrentFrame();
  if (c.kieu !== 'bay-dia-cau') return null;
  const k = nhipCau(c, p), eye = cauEye(1, CAU_CHIEM), dz = eye[2] / k.m - eye[2];
  return <AbsoluteFill><ThreeCanvas width={width} height={height} flat gl={{antialias: true}}>
    <StageCam eye={eye} haze="#2f4c86" fog={[200, 900]} dz={dz} />
    <NenVuTru f={f} seed={7} />
    <DiaCau f={f} lon={k.lon} lat={k.lat}>
      <DuongDi from={k.di} to={k.den} p={k.w} f={f} mover="cham" color="#ff5a3a" />
    </DiaCau>
  </ThreeCanvas></AbsoluteFill>;
};
export const coLopNenMay = (c: ChuyenMay) => c.kieu === 'bay-dia-cau';

// ================================================================ ghép chuỗi
/** NoiCanh của lib3/chuyenCanh nhận cả hai bộ kiểu; giữ tên cũ làm bí danh. Bọc trong hàm (không gán thẳng `= NoiCanh`): hai file
 *  import vòng nhau, gán thẳng lúc nạp file sẽ gặp NoiCanh chưa kịp khởi tạo. */
export const NoiCanhMay: React.FC<{canh: CanhNoi[]}> = (p) => <NoiCanh {...p} />;
