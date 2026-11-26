// lib3/chuyenCanh: GHÉP CHUỖI CẢNH NGAY TRONG REMOTION và CHUYỂN CẢNH CÓ LÝ DO (Daniel duyệt bộ 18 kiểu 25/11/2026; cách dùng: skill 0 mục Chuyển cảnh, skill 4 mục Ghép chương, luật 9b).
// Trước đây mỗi cảnh quay dựng riêng rồi nối cứng bằng ffmpeg (tools/ghep-chuong.sh). Ở đây mỗi cảnh là một <Sequence> có thể CHỒNG
// lên cảnh kề vài khung, nên dùng được các kiểu dưới. Mọi lớp phủ vẽ kiểu cắt giấy: mảng phẳng 2–3 sắc, mép sắc, không gradient mềm.
// Không có wipe kỹ thuật số (tròn, sao, kẻ ô): đừng thêm. Các kiểu cần máy 3D nằm ở lib3/chuyenCanhMay.tsx.
// Hướng theo quy ước của kieuMay: huong = hướng MÁY đi hay lia ('phai' = máy sang phải, hình trôi sang trái).
//
// BẢNG 18 LOẠI. Một API: mọi loại đặt vào trường `chuyen` (16 loại chuyển cảnh) hoặc `noi` (2 loại nối cắt) của CanhNoi, ghép bằng
// NoiCanh. 2D: file này. Có máy: lib3/chuyenCanhMay (chi tiết tham số ở bảng đầu file đó). Toạ độ khung [x, y] là phần bề ngang, bề
// cao khung (0..1, gốc trên trái). Chung mọi loại: chong (số khung chồng; thiếu thì lấy CHONG_MAC_DINH / CHONG_MAY_MAC_DINH),
// truoc (số khung chồng nằm trước chỗ cắt, mặc định nửa), som (cảnh sau đã chạy trong các khung trước chỗ cắt; mặc định không).
//
// | #  | tên (kieu)  | là gì                                                     | dùng khi nào                                   | tham số riêng                             |
// |----|-------------|-----------------------------------------------------------|------------------------------------------------|-------------------------------------------|
// |  1 | gat-vat     | vật sát máy lướt ngang che khung, cảnh mới lộ sau mép vật | đổi nơi / đổi giờ trong cùng mạch kể           | vat 'cay'|'cot'|'nguoi'|'mang', huong,    |
// |    |             | (thân cây, cột, bóng người của bộ khuôn, mảng giấy)       |                                                | nguoi (Spec, bắt buộc khi vat 'nguoi')    |
// |  2 | lia-nhanh   | máy lia vụt, hai cảnh trôi cùng chiều, nhoè theo chiều lia | nối hai nơi trong cùng một câu, một ý          | huong (chiều máy đang trôi); 6–10 khung   |
// |  3 | hoa-hinh    | cảnh sau hiện dần lên trên cảnh trước                      | thời gian trôi trong cùng một nơi              | 10–16 khung, nên nằm trong quãng lặng     |
// |  4 | vao-bong    | đẩy vào một vùng tối (áo, bóng) tới gần kín rồi mở ra      | đổi nhịp mạnh, từ một người sang nơi khác      | tam [x, y], mau vùng tối                  |
// |  5 | khoi-phu    | khói / bụi / tuyết cắt giấy dâng (tuyết rơi) phủ kín, tan | sau nổ, trận đánh, bão; đổi nơi có khói bụi    | chat 'khoi'|'bui'|'tuyet', huong (trôi)   |
// |  6 | chop-trang  | chớp trắng phẳng 2–4 khung rồi mở                         | va chạm, loé sáng, ký ức ập về                 | chong 3–4, mau                            |
// |  7 | nham-mat    | mí trên dưới khép tối rồi mở ra cảnh sau                  | ngất, ngủ, tỉnh dậy; nhìn qua mắt nhân vật     | mo (mờ khi khép và mới mở; mặc định có)   |
// |  8 | lat-giay    | góc khung bóc lên như trang giấy, thấy mặt sau, có bóng   | sang chương, sang kỷ niệm, chuyện "trên giấy"  | huong ('trai': góc dưới phải bóc sang trái)|
// |  9 | ra-den      | tối hẳn, giữ đen vài khung, rồi mở                        | hết chương, cái chết, khoảng lặng dài          | mau; 16–30 khung                          |
// | 10 | lao-cua     | máy lao vào ô cửa của cảnh trước, cảnh sau nở ra từ ô kính | ngoài nhìn vào phòng, chung sang riêng         | cua [x, y, rộng, cao] ô kính, mau         |
// | 11 | lui-cua     | ngược lao-cua: cảnh trước thu vào ô cửa của cảnh sau      | trong phòng ra ngoài, kết chuỗi cảnh trong nhà | cua = ô kính trong CẢNH SAU, mau          |
// | 12 | vao-mat     | máy lao vào mắt; con ngươi phản chiếu cảnh sau rồi nở ra  | nhớ lại, tưởng tượng, nhìn thấy điều gì        | mat [x, y] (hoặc dãy theo khung), r, mau  |
// | 13 | khop-hinh   | dời, phóng cảnh trước cho một hình trùng hình ở cảnh sau  | hai vật cùng dáng ở hai nơi, hai thời          | a [x, y, r] cảnh trước, b [x, y, r] sau   |
// | 14 | ngoc-troi   | ngước lên trời cắt giấy, giữ một nhịp, hạ xuống nơi mới   | đổi nơi ngoài trời, thời gian trôi trong ngày  | gio, gioSau 'ngay'|'chang-vang'|'dem'     |
// | 15 | bay-dia-cau | lùi ra quả địa cầu, cầu quay sang nơi mới, lao vào lại    | đổi nước, đổi châu lục                         | noiDi, noiDen [kinh, vĩ]                  |
// | 16 | theo-vat    | vật cắt giấy bay khỏi cảnh trước, máy theo, rơi vào cảnh sau | nối hai nơi bằng một đồ vật (thư, bóng, giấy) | vat 'thu'|'bong'|'giay', tu, den, huong,  |
// |    |             |                                                           |                                                | cao, co                                   |
// | 17 | noi 'dong-tac' | cắt giữa động tác: cảnh sau vào khi động tác đang chạy | bước, vung tay, vặn, quay người qua chỗ cắt    | vao 2–4 (mặc định 3) — trường của CanhNoi |
// | 18 | noi 'nhin'  | cắt theo hướng nhìn: người quay nhìn, cảnh sau là thứ ấy  | phản ứng, phát hiện                            | vao thường 0 — trường của CanhNoi         |
//
// Máy phụ `may` (MayPhu): trượt / đẩy rất nhẹ cả lớp hình (2D, phóng ≤ 4,4 %) cho cảnh dựng sẵn không nhận kiểu máy, để một chuỗi
//   cảnh cùng nơi giữ MỘT hướng máy. Cảnh mới thì dùng `Shot may={{kieu, D, muc}}` (lib3/kieuMay).
// Không import gì của kênh: người lướt qua nhận Spec từ nơi gọi.
import React from 'react';
import {AbsoluteFill, Freeze, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {bongTex} from '../mould/BongNguoi';
import {BOX, SOLE_Y, CENTRE_X, HAIR_TOP} from '../mould/draw';
import type {Spec} from '../mould/draw';
// import vòng với chuyenCanhMay: hai bên chỉ dùng của nhau bên trong hàm, không dùng lúc nạp file
import {laChuyenMay, lopChuyenMay, chongMay, LopNenMay, LopPhuMay, coLopNenMay, useNapBanDoCau} from './chuyenCanhMay';
import type {ChuyenMay} from './chuyenCanhMay';

export type HuongChuyen = 'trai' | 'phai';
export type KieuChuyen = 'gat-vat' | 'lia-nhanh' | 'hoa-hinh' | 'vao-bong' | 'khoi-phu' | 'chop-trang' | 'nham-mat' | 'lat-giay' | 'ra-den';
export type VatGan = 'cay' | 'cot' | 'nguoi' | 'mang';
export type ChatKhoi = 'khoi' | 'bui' | 'tuyet';
export type NoiCat = 'dong-tac' | 'nhin';
/** một chuyển cảnh, đặt ở chỗ cắt giữa hai cảnh.
 *  chong = số khung hai cảnh cùng hiện (thiếu thì lấy CHONG_MAC_DINH); truoc = bao nhiêu khung trong số đó nằm TRƯỚC chỗ cắt (mặc
 *  định nửa); som = cảnh sau đã chạy trong các khung chồng trước chỗ cắt (true) hay đứng ở khung đầu của nó tới chỗ cắt (false, mặc
 *  định: giữ khớp hình với lời). Các trường còn lại xem bảng đầu file. */
export type Chuyen = {kieu: KieuChuyen; chong?: number; huong?: HuongChuyen; truoc?: number; som?: boolean;
  vat?: VatGan; nguoi?: Spec; chat?: ChatKhoi; mo?: boolean; mau?: string; tam?: [number, number]};
export const CHONG_MAC_DINH: Record<KieuChuyen, number> = {'gat-vat': 10, 'lia-nhanh': 8, 'hoa-hinh': 14, 'vao-bong': 16, 'khoi-phu': 20, 'chop-trang': 4, 'nham-mat': 22, 'lat-giay': 18, 'ra-den': 22};
/** máy phụ: quang = % bề ngang khung trôi cả cảnh (≤ 4); day = % đẩy vào cả cảnh (≤ 3) */
export type MayPhuO = {huong?: HuongChuyen; quang?: number; day?: number};

const kep = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const muot = (p: number) => { const x = kep(p); return x * x * (3 - 2 * x); };
const diaChieu = (h?: HuongChuyen) => (h === 'trai' ? 1 : -1);   // chiều HÌNH trôi trên màn hình (+1 = sang phải) khi máy đi theo h
export const chongCua = (c: Chuyen) => Math.max(2, Math.round(c.chong ?? CHONG_MAC_DINH[c.kieu]));
const truocCua = (c: Chuyen | ChuyenMay) => (c.truoc ?? Math.floor((laChuyenMay(c) ? chongMay(c) : chongCua(c)) / 2));
/** các kiểu PHỦ KÍN khung ở giữa: đổi cảnh dưới lớp phủ, đúng ở p = 0,5 */
const PHU_KIN: KieuChuyen[] = ['vao-bong', 'khoi-phu', 'chop-trang', 'nham-mat', 'ra-den'];
const CO_LOP_PHU: KieuChuyen[] = ['gat-vat', 'vao-bong', 'khoi-phu', 'chop-trang', 'nham-mat', 'lat-giay', 'ra-den'];

type P2 = [number, number];
const da = (pts: P2[]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const ngauNhien = (i: number, seed: number) => { const r = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453; return r - Math.floor(r); };

/** MÁY PHỤ cho một cảnh dựng sẵn: dời và phóng cả lớp hình đều tốc theo khung f trong dur khung (khung giữa = khung gốc). */
export const MayPhu: React.FC<{f: number; dur: number; o?: MayPhuO; children: React.ReactNode}> = ({f, dur, o, children}) => {
  if (!o || (!o.quang && !o.day)) return <>{children}</>;
  const q = kep(o.quang ?? 0, 0, 4), d = kep(o.day ?? 0, 0, 3), t = kep(dur > 1 ? f / (dur - 1) : 0.5), u = t - 0.5;
  const s0 = 1 + q / 100 + 0.004, s = s0 * (1 + (d / 100) * t);
  return <AbsoluteFill style={{transform: `translateX(${diaChieu(o.huong) * u * q}%) scale(${s})`, transformOrigin: '50% 50%'}}>{children}</AbsoluteFill>;
};

/** bộ lọc nhoè một chiều (ngang) cho lớp HTML; id phải duy nhất trong khung */
const NhoeNgang: React.FC<{id: string; px: number}> = ({id, px}) => <svg style={{position: 'absolute', width: 0, height: 0}} aria-hidden>
  <defs><filter id={id} x="-10%" y="0%" width="120%" height="100%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation={`${Math.max(0, px)} 0`} edgeMode="duplicate" /></filter></defs>
</svg>;

// ------------------------------------------------------------------------------------------------ hình học dùng chung
/** cắt đa giác bằng nửa mặt phẳng g(x) ≥ 0 (Sutherland–Hodgman một cạnh) */
const catNua = (poly: P2[], g: (p: P2) => number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], ga = g(a), gb = g(b);
    if (ga >= 0) out.push(a);
    if ((ga >= 0) !== (gb >= 0)) { const t = ga / (ga - gb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
};

/** LẬT GIẤY: góc dưới của khung bóc lên theo một đường gấp. Trả phần đã bóc (cảnh sau lộ ra), vạt giấy lật (mặt sau) và dải gần nếp gấp. */
const latGiay = (p: number, W: number, H: number, h?: HuongChuyen) => {
  const phai = h !== 'phai';   // 'trai' (mặc định): góc dưới PHẢI bóc sang trái
  const C: P2 = phai ? [W, H] : [0, H], vx = phai ? -1 : 1, vy = -0.32, n = Math.hypot(vx, vy), v: P2 = [vx / n, vy / n];
  const xa = Math.max(...([[0, 0], [W, 0], [0, H], [W, H]] as P2[]).map(([x, y]) => (x - C[0]) * v[0] + (y - C[1]) * v[1]));
  const e = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p), s = (2 * xa + 40) * e;   // nhanh dần rồi chậm dần
  const M: P2 = [C[0] + (s / 2) * v[0], C[1] + (s / 2) * v[1]], u: P2 = [-v[0], -v[1]];
  const g = (x: P2) => (x[0] - M[0]) * u[0] + (x[1] - M[1]) * u[1];   // > 0: phía góc đã bóc
  const khung: P2[] = [[0, 0], [W, 0], [W, H], [0, H]];
  const boc = catNua(khung, g), lat = (x: P2): P2 => { const d = g(x); return [x[0] - 2 * d * u[0], x[1] - 2 * d * u[1]]; };
  const vat = boc.map(lat), dai = catNua(vat, (x) => 0.07 * W + g(x));   // vạt nằm phía g < 0; dải sẫm sát nếp gấp
  return {boc, vat, dai, u};
};

/** mép lồi lõm của khói / bụi / tuyết: một dải ngang cao Hb, mép trên và mép dưới là các cục tròn VẼ BẰNG CẠNH THẲNG (mảng giấy cắt) */
const daiKhoi = (W: number, Hb: number, r: number, seed: number): P2[] => {
  const mep = (y0: number, chieu: number, sd: number): P2[] => {
    const pts: P2[] = []; let x = -r * 1.5, i = 0;
    while (x < W + r * 1.5) {
      const rr = r * (0.6 + 0.8 * ngauNhien(i, sd)), cx = x + rr;
      for (let k = 0; k <= 5; k++) { const a = Math.PI - (Math.PI * k) / 5; pts.push([cx + rr * Math.cos(a), y0 - chieu * rr * Math.sin(a) * (0.7 + 0.3 * ngauNhien(i + 7, sd))]); }
      x += rr * 2 * (0.75 + 0.2 * ngauNhien(i + 3, sd)); i++;
    }
    return pts;
  };
  return [...mep(0, 1, seed), ...mep(Hb, -1, seed + 11).reverse()];
};
const MAU_KHOI: Record<ChatKhoi, [string, string, string]> = {
  khoi: ['#77726e', '#9b958f', '#5e5a57'], bui: ['#a8835a', '#c4a175', '#8a6845'], tuyet: ['#d5dee6', '#f2f5f8', '#bcc8d3'],
};

// ------------------------------------------------------------------------------------------------ lớp cảnh
/** kiểu của lớp cảnh TRƯỚC (vai 'truoc') hoặc SAU ('sau') ở tiến độ p (0 → 1 qua các khung chồng) */
export const lopChuyen = (c: Chuyen, vai: 'truoc' | 'sau', p: number, W: number, H: number): {style: React.CSSProperties; nhoe: number} => {
  const s = diaChieu(c.huong), an = vai === 'sau' ? p < 0.5 : p >= 0.5;
  if (PHU_KIN.includes(c.kieu) && c.kieu !== 'vao-bong' && c.kieu !== 'nham-mat') return {style: an ? {opacity: 0} : {}, nhoe: 0};
  switch (c.kieu) {
    case 'hoa-hinh': return {style: vai === 'sau' ? {opacity: muot(p)} : {}, nhoe: 0};
    case 'lia-nhanh': {
      // hai cảnh trôi cùng chiều nửa khung; cảnh sau nằm TRÊN, mép đi trước của nó tan dần trên nửa khung, nên mép cứng của cảnh trước
      // luôn nằm dưới phần đặc của cảnh sau: không còn đường nối dọc. Nhoè theo tốc độ (nhanh nhất ở giữa).
      const D = 0.5 * W, e = 0.5 - 0.5 * Math.cos(Math.PI * kep(p)), v = Math.sin(Math.PI * kep(p));
      if (vai === 'truoc') return {style: {transform: `translateX(${s * e * D}px)`}, nhoe: 0.055 * W * v};
      const mask = `linear-gradient(${s > 0 ? 'to right' : 'to left'}, #000 ${D}px, transparent ${W}px)`;
      return {style: {transform: `translateX(${s * (e - 1) * D}px)`, maskImage: mask, WebkitMaskImage: mask}, nhoe: 0.055 * W * v};
    }
    case 'vao-bong': {
      const [cx, cy] = c.tam ?? [0.5, 0.5], o = `${cx * 100}% ${cy * 100}%`;
      if (vai === 'truoc') { const k = kep(p / 0.5), e = k * k; return {style: {transform: `scale(${1 + 0.3 * e})`, transformOrigin: o, filter: `brightness(${1 - 0.9 * e})`, opacity: an ? 0 : 1}, nhoe: 0}; }
      const k = kep((p - 0.5) / 0.5), e = 1 - (1 - k) * (1 - k);
      return {style: {transform: `scale(${1.1 - 0.1 * e})`, transformOrigin: o, filter: `brightness(${0.1 + 0.9 * e})`, opacity: an ? 0 : 1}, nhoe: 0};
    }
    case 'nham-mat': {
      // mờ khi mí khép lại và khi mới mở, rõ dần (mo = true, mặc định)
      const mo = c.mo === false ? 0 : vai === 'truoc' ? 7 * muot(p / 0.45) : 7 * (1 - muot((p - 0.55) / 0.45));
      return {style: {opacity: an ? 0 : 1, ...(mo > 0.2 ? {filter: `blur(${mo.toFixed(1)}px)`} : {})}, nhoe: 0};
    }
    case 'gat-vat': {
      // cảnh sau chỉ lộ ở phía vật ĐÃ đi qua; đường cắt nằm giữa lõi vật nên không bao giờ thấy
      if (vai === 'truoc') return {style: {}, nhoe: 0};
      const giua = gatGiua(p, W, c);
      return {style: {clipPath: s > 0 ? `inset(0 ${W - giua}px 0 0)` : `inset(0 0 0 ${giua}px)`}, nhoe: 0};
    }
    case 'lat-giay': {
      if (vai === 'truoc') return {style: {}, nhoe: 0};
      const {boc} = latGiay(p, W, H, c.huong);
      return {style: {clipPath: boc.length >= 3 ? `polygon(${boc.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')})` : 'inset(0 0 100% 0)'}, nhoe: 0};
    }
    default: return {style: {}, nhoe: 0};
  }
};

// ------------------------------------------------------------------------------------------------ vật gần máy (gat-vat)
const GAT_W: Record<VatGan, number> = {cay: 0.62, cot: 0.5, mang: 0.7, nguoi: 0.9};
/** tâm vật theo p: đi đều tốc từ ngoài mép này sang ngoài mép kia, qua giữa khung ở p = 0,5 */
const gatGiua = (p: number, W: number, c: Chuyen) => {
  const w = GAT_W[c.vat ?? 'cay'] * W, x = -w / 2 + (W + w) * kep(p);
  return diaChieu(c.huong) > 0 ? x : W - x;
};
/** hình vật gần máy trong hộp 0..1 (bề ngang vật) × 0..1 (bề cao khung): lõi đặc từ 0,18 tới 0,82 phủ kín bề cao */
const hinhVat = (vat: Exclude<VatGan, 'nguoi'>) => {
  const rang = (x0: number, n: number, bien: number, seed: number) => Array.from({length: n + 1}, (_, i) => [x0 + (ngauNhien(i, seed) - 0.5) * bien, -0.02 + (1.04 * i) / n] as P2);
  if (vat === 'cot') return [   // cột nhà gỗ sơn: mặt chính, cạnh sáng phía nắng, cạnh tối, đầu cột và chân cột
    {pts: [[0.1, -0.02], [0.9, -0.02], [0.9, 1.02], [0.1, 1.02]] as P2[], mau: '#2c241f'},
    {pts: [[0.1, -0.02], [0.24, -0.02], [0.24, 1.02], [0.1, 1.02]] as P2[], mau: '#43372d'},
    {pts: [[0.8, -0.02], [0.9, -0.02], [0.9, 1.02], [0.8, 1.02]] as P2[], mau: '#1a1512'},
    {pts: [[0.02, -0.02], [0.98, -0.02], [0.98, 0.07], [0.02, 0.07]] as P2[], mau: '#382e27'},
    {pts: [[0.03, 0.92], [0.97, 0.92], [0.97, 1.02], [0.03, 1.02]] as P2[], mau: '#382e27'},
  ];
  if (vat === 'mang') return [   // mảng giấy tối xé hai mép, một mảng sẫm hơn lệch chồng lên
    {pts: [...rang(0.1, 9, 0.12, 3), ...rang(0.9, 9, 0.12, 7).reverse()], mau: '#221d1d'},
    {pts: [...rang(0.42, 9, 0.1, 5), ...rang(0.95, 9, 0.08, 9).reverse()], mau: '#161212'},
  ];
  const trai = rang(0.12, 11, 0.09, 5), phai = rang(0.86, 11, 0.08, 9).reverse();   // thân cây phong, sọc vỏ phía nắng, nhánh, tán
  return [
    {pts: [...trai, ...phai], mau: '#2a1d16'},
    {pts: [...rang(0.62, 11, 0.05, 2), ...rang(0.8, 11, 0.05, 4).reverse()], mau: '#3b2a1f'},
    {pts: [[0.7, 0.36], [1.12, 0.06], [1.2, 0.1], [0.78, 0.44]] as P2[], mau: '#2a1d16'},
    {pts: [[0.0, -0.05], [1.18, -0.05], [1.22, 0.05], [1.06, 0.1], [0.9, 0.07], [0.7, 0.13], [0.46, 0.08], [0.24, 0.11], [0.04, 0.05]] as P2[], mau: '#4e1c12'},
    {pts: [[0.9, -0.05], [1.2, -0.05], [1.26, 0.07], [1.12, 0.13], [0.98, 0.09]] as P2[], mau: '#6a2614'},
  ];
};
/** bóng người của bộ khuôn (bongTex: đúng đường viền nhân vật), làm ảnh để dùng làm mặt nạ trong lớp HTML */
const ANH_NGUOI = new Map<string, string>();
const anhNguoi = (spec: Spec) => {
  const k = JSON.stringify(spec); let u = ANH_NGUOI.get(k);
  if (!u) { u = (bongTex(spec, {blur: 0, S: 0.5}).image as HTMLCanvasElement).toDataURL('image/png'); ANH_NGUOI.set(k, u); if (ANH_NGUOI.size > 8) ANH_NGUOI.delete(ANH_NGUOI.keys().next().value as string); }
  return u;
};
/** người đi ngang sát máy: thấy từ giữa đầu tới hông (cả người cao gấp 2,2 khung, đỉnh tóc ở -0,45 khung), hai mảng: viền sáng phía nắng và thân sẫm */
const NguoiGan: React.FC<{spec: Spec; giua: number; W: number; H: number}> = ({spec, giua, W, H}) => {
  const k = (2.2 * H) / (SOLE_Y - HAIR_TOP), top = -0.45 * H, url = `url(${anhNguoi(spec)})`;
  const hop = (dx: number, mau: string) => <div style={{position: 'absolute', left: giua - (CENTRE_X - BOX.x) * k + dx, top: top - (HAIR_TOP - BOX.y) * k, width: BOX.w * k, height: BOX.h * k,
    background: mau, maskImage: url, WebkitMaskImage: url, maskSize: '100% 100%', WebkitMaskSize: '100% 100%'}} />;
  return <>{hop(-10, '#3a2c24')}{hop(0, '#15100d')}</>;
};

// ------------------------------------------------------------------------------------------------ lớp phủ
/** LỚP PHỦ của chuyển cảnh ở tiến độ p; hoa-hinh và lia-nhanh không có lớp phủ */
export const LopPhu: React.FC<{c: Chuyen; p: number; id: string}> = ({c, p, id}) => {
  const {width: W, height: H} = useVideoConfig(), s = diaChieu(c.huong);
  switch (c.kieu) {
    case 'vao-bong': { const a = 1 - Math.abs(kep(p) - 0.5) / 0.5; return <AbsoluteFill style={{background: c.mau ?? '#0b0908', opacity: 0.85 * a * a}} />; }
    case 'ra-den': { const a = p < 0.4 ? muot(p / 0.4) : p <= 0.6 ? 1 : 1 - muot((p - 0.6) / 0.4); return <AbsoluteFill style={{background: c.mau ?? '#000', opacity: a}} />; }
    case 'chop-trang': { const a = 1 - Math.pow(Math.abs(kep(p) - 0.5) * 2, 3); return <AbsoluteFill style={{background: c.mau ?? '#fff8ec', opacity: a}} />; }
    case 'nham-mat': {
      // mí trên và mí dưới: mảng tối, mép cong (giữa sâu hơn hai góc), một dải sẫm đỏ nâu sát mép như hàng mi; khép kín ở 0,45–0,55
      const k = p < 0.45 ? muot(p / 0.45) : p <= 0.55 ? 1 : 1 - muot((p - 0.55) / 0.45), y = 0.66 * H * k - 0.12 * H, cong = 0.09 * H;   // khép: hai góc chồng 0,04 khung, giữa chồng 0,22
      const mep = (y0: number, chieu: number) => Array.from({length: 17}, (_, i) => { const x = (W * i) / 16; return [x, y0 + chieu * cong * Math.sin((Math.PI * i) / 16)] as P2; });
      const tren = mep(y, 1), duoi = mep(H - y, -1);
      const mi = (m: P2[], chieu: number, d: number): P2[] => [...m.map(([x, yy]) => [x, yy - chieu * d] as P2)];
      return <AbsoluteFill><svg width={W} height={H} style={{position: 'absolute'}}>
        <polygon points={da([[0, -10], [W, -10], ...tren.slice().reverse()])} fill="#3a2320" />
        <polygon points={da([[0, -10], [W, -10], ...mi(tren, 1, 9).reverse()])} fill="#0d0908" />
        <polygon points={da([[0, H + 10], [W, H + 10], ...duoi.slice().reverse()])} fill="#3a2320" />
        <polygon points={da([[0, H + 10], [W, H + 10], ...mi(duoi, -1, 9).reverse()])} fill="#0d0908" />
      </svg></AbsoluteFill>;
    }
    case 'khoi-phu': {
      // ba dải: dải trước (lệch sớm, sắc sáng), dải chính (phủ kín khung ở p = 0,5), dải sau (muộn, sắc sẫm); tuyết rơi xuống, khói bụi dâng lên
      const chat = c.chat ?? 'khoi', mau = MAU_KHOI[chat], xuong = chat === 'tuyet', r = 0.11 * H, Hb = 1.7 * H;
      const lop = ([['lead', 0.1, mau[1], 0.8 * Hb, 3], ['main', 0, mau[0], Hb, 5], ['sau', -0.12, mau[2], 0.7 * Hb, 8]] as [string, number, string, number, number][]).map(([ten, lech, m, hb, sd]) => {
        const q = kep(p + lech), dich = H + r - (H + hb + 2 * r) * q, y = ten === 'main' ? dich + (hb - Hb) / 2 : dich, x = -s * 0.08 * W * (q - 0.5);
        const yy = xuong ? H - y - hb : y;
        return <g key={ten} transform={`translate(${x.toFixed(1)} ${yy.toFixed(1)})`}><polygon points={da(daiKhoi(W, hb, r, sd))} fill={m} /></g>;
      });
      // dải chính phải phủ kín ở giữa: vẽ nó sau cùng; vài mảnh rời bay theo mép (bông tuyết là hình lục giác phẳng)
      const manh = Array.from({length: 14}, (_, i) => {
        const q = kep(p * 1.15 - 0.08 + 0.05 * ngauNhien(i, 21)), bx = W * ngauNhien(i, 23), by = H * (1.15 - 1.5 * q) + 0.3 * H * ngauNhien(i, 29), rr = (xuong ? 0.012 : 0.03) * H * (0.6 + ngauNhien(i, 31));
        const yy = xuong ? H - by : by, pts = Array.from({length: 6}, (_, k) => [bx + rr * Math.cos((Math.PI * k) / 3 + i), yy + rr * Math.sin((Math.PI * k) / 3 + i)] as P2);
        return <polygon key={i} points={da(pts)} fill={mau[i % 2 ? 1 : 2]} />;
      });
      return <AbsoluteFill><svg width={W} height={H} style={{position: 'absolute'}}>{lop[0]}{lop[2]}{lop[1]}{manh}</svg></AbsoluteFill>;
    }
    case 'lat-giay': {
      const {vat, dai, u} = latGiay(p, W, H, c.huong), bx = -u[0] * 16, by = -u[1] * 16 + 6;
      if (vat.length < 3) return null;
      return <AbsoluteFill><svg width={W} height={H} style={{position: 'absolute'}}>
        <polygon points={da(vat.map(([x, y]) => [x + bx, y + by] as P2))} fill="#1a120c" opacity={0.32} />
        <polygon points={da(vat)} fill="#ece0c4" />
        {dai.length >= 3 ? <polygon points={da(dai)} fill="#d4c29b" /> : null}
      </svg></AbsoluteFill>;
    }
    case 'gat-vat': {
      const vat = c.vat ?? 'cay', w = GAT_W[vat] * W, giua = gatGiua(p, W, c), tocDo = ((W + w) / chongCua(c)) * 0.08;
      if (vat === 'nguoi') {
        if (!c.nguoi) throw new Error('chuyenCanh: gat-vat với vat "nguoi" cần Spec ở trường nguoi');
        return <AbsoluteFill style={{filter: `url(#${id})`}}><NhoeNgang id={id} px={tocDo} /><NguoiGan spec={c.nguoi} giua={giua} W={W} H={H} /></AbsoluteFill>;
      }
      return <AbsoluteFill>
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <defs><filter id={id} x="-20%" y="0%" width="140%" height="100%"><feGaussianBlur stdDeviation={`${tocDo} 0`} /></filter></defs>
          <g filter={`url(#${id})`}><g transform={`translate(${giua - w / 2} 0) scale(${s < 0 ? -w : w} ${H})${s < 0 ? ' translate(-1 0)' : ''}`}>
            {hinhVat(vat).map((m, i) => <polygon key={i} points={da(m.pts)} fill={m.mau} />)}
          </g></g>
        </svg>
      </AbsoluteFill>;
    }
    default: return null;
  }
};

// ------------------------------------------------------------------------------------------------ ghép chuỗi
/** một cảnh trong chuỗi: C = component cảnh dựng sẵn; dai = số khung trên dòng thời gian (giữ đúng mốc lời); vao = khung bắt đầu
 *  của chính cảnh; noi = kiểu nối cắt vào cảnh này ('dong-tac' thì vao mặc định 3); may = máy phụ; chuyen = chuyển cảnh TỪ cảnh
 *  trước VÀO cảnh này; het = số khung của chính cảnh (layCanh trả `n`): quá khung cuối thì đứng ở khung cuối, không cho cảnh chạy
 *  ra ngoài phần đã diễn (có cảnh tính ra NaN) */
/** vi = lý do trong truyện của chuyển cảnh (bắt buộc khi có chuyen; tools/kiem_canh.py rà), vd 'từ ngoài sân vào phòng thí nghiệm' */
export type CanhNoi = {C: React.FC; dai: number; vao?: number; noi?: NoiCat; may?: MayPhuO; chuyen?: Chuyen | ChuyenMay; vi?: string; ten?: string; het?: number};

/** chuyển cảnh nào cũng được (2D ở file này, có máy ở chuyenCanhMay) */
export type ChuyenNao = Chuyen | ChuyenMay;
const chongNao = (c: ChuyenNao) => (laChuyenMay(c) ? chongMay(c) : chongCua(c));
const lopNao = (c: ChuyenNao, vai: 'truoc' | 'sau', p: number, W: number, H: number, id: string): {style: React.CSSProperties; defs: React.ReactNode} => {
  if (laChuyenMay(c)) return lopChuyenMay(c, vai, p, W, H, id);
  const {style, nhoe} = lopChuyen(c, vai, p, W, H), loc = [style.filter, nhoe > 0.3 ? `url(#${id})` : ''].filter(Boolean).join(' ');
  return {style: {...style, filter: loc || undefined}, defs: nhoe > 0.3 ? <NhoeNgang id={id} px={nhoe} /> : null};
};
const LopCanh: React.FC<{k: CanhNoi; i: number; truoc: number; vaoC?: ChuyenNao; raC?: ChuyenNao}> = ({k, i, truoc, vaoC, raC}) => {
  const l = useCurrentFrame(), {width: W, height: H} = useVideoConfig();
  const vao = k.vao ?? (k.noi === 'dong-tac' ? 3 : 0), c = Math.min(k.het ? k.het - 1 : Infinity, Math.max(0, vao + (vaoC?.som ? l : l - truoc)));   // khung của chính cảnh
  let r: {style: React.CSSProperties; defs: React.ReactNode} = {style: {}, defs: null};
  if (vaoC && l < chongNao(vaoC)) r = lopNao(vaoC, 'sau', (l + 0.5) / chongNao(vaoC), W, H, `nhoe-canh-${i}-vao`);
  const batDauRa = truoc + k.dai - (raC ? truocCua(raC) : 0);
  if (raC && l >= batDauRa) r = lopNao(raC, 'truoc', (l - batDauRa + 0.5) / chongNao(raC), W, H, `nhoe-canh-${i}-ra`);
  return <AbsoluteFill style={r.style}>
    {r.defs}
    <MayPhu f={c} dur={k.dai} o={k.may}><Freeze frame={c}><k.C /></Freeze></MayPhu>
  </AbsoluteFill>;
};
/** lớp phủ trên hai cảnh (zIndex 2: lui-cua đặt cảnh trước lên trên cảnh sau bằng zIndex 1) */
const PhuTheoKhung: React.FC<{c: ChuyenNao; id: string}> = ({c, id}) => {
  const l = useCurrentFrame(), p = (l + 0.5) / chongNao(c);
  if (laChuyenMay(c)) return <LopPhuMay c={c} p={p} id={id} />;
  return <AbsoluteFill style={{zIndex: 2}}><LopPhu c={c} p={p} id={id} /></AbsoluteFill>;
};
/** lớp nền dưới hai cảnh (chỉ bay-dia-cau) */
const NenTheoKhung: React.FC<{c: ChuyenMay}> = ({c}) => { const l = useCurrentFrame(); return <LopNenMay c={c} p={(l + 0.5) / chongMay(c)} />; };

/** GHÉP CẢ CHUỖI: mỗi cảnh một Sequence, chồng lên cảnh kề ở chỗ có chuyển cảnh (2D hay có máy); tổng số khung = tổng `dai` (mốc lời
 *  không đổi). Thứ tự lớp: nền của chuyển cảnh (bay-dia-cau), các cảnh (cảnh sau nằm trên), lớp phủ. */
export const NoiCanh: React.FC<{canh: CanhNoi[]}> = ({canh}) => {
  useNapBanDoCau();   // vao-mat cần tấm bản đồ dời hình nạp xong trước khi chụp khung
  const dau = canh.reduce<number[]>((a, k, i) => [...a, i ? a[i - 1] + canh[i - 1].dai : 0], []);
  return <AbsoluteFill style={{background: '#000'}}>
    {canh.map((k, i) => {
      const c = i > 0 ? k.chuyen : undefined;
      if (!laChuyenMay(c) || !coLopNenMay(c)) return null;
      return <Sequence key={`nen-${i}`} name={`nen-${c.kieu}-${i}`} from={dau[i] - truocCua(c)} durationInFrames={chongMay(c)}><NenTheoKhung c={c} /></Sequence>;
    })}
    {canh.map((k, i) => {
      const vaoC = i > 0 ? k.chuyen : undefined, raC = canh[i + 1]?.chuyen;
      const truoc = vaoC ? truocCua(vaoC) : 0, sau = raC ? chongNao(raC) - truocCua(raC) : 0;
      return <Sequence key={i} name={k.ten ?? `canh-${i + 1}`} from={dau[i] - truoc} durationInFrames={k.dai + truoc + sau}>
        <LopCanh k={k} i={i} truoc={truoc} vaoC={vaoC} raC={raC} />
      </Sequence>;
    })}
    {canh.map((k, i) => {
      const c = i > 0 ? k.chuyen : undefined;
      if (!c || (!laChuyenMay(c) && !CO_LOP_PHU.includes(c.kieu))) return null;
      return <Sequence key={`phu-${i}`} name={`chuyen-${c.kieu}-${i}`} from={dau[i] - truocCua(c)} durationInFrames={chongNao(c)}><PhuTheoKhung c={c} id={`phu-${i}`} /></Sequence>;
    })}
  </AbsoluteFill>;
};

/** Lấy component và số khung của một composition đã đăng ký trong một bảng <XComps /> (cảnh dựng sẵn không export component riêng).
 *  Không sửa file cảnh; chỉ đọc bảng đăng ký của nó. */
export const layCanh = (Bang: React.FC, id: string): {C: React.FC; n: number} => {
  const tim = (el: unknown): {C: React.FC; n: number} | null => {
    if (!el || typeof el !== 'object') return null;
    if (Array.isArray(el)) { for (const x of el) { const r = tim(x); if (r) return r; } return null; }
    const pr = (el as {props?: {id?: string; component?: React.FC; durationInFrames?: number; children?: unknown}}).props;
    if (pr?.id === id && pr.component) return {C: pr.component, n: pr.durationInFrames ?? 0};
    return pr ? tim(pr.children) : null;
  };
  const r = tim((Bang as (p: object) => React.ReactNode)({}));
  if (!r) throw new Error(`layCanh: không thấy composition ${id}`);
  return r;
};

// các kiểu chuyển cảnh có máy (lao-cua, lui-cua, vao-mat, khop-hinh, ngoc-troi, bay-dia-cau, theo-vat); NoiCanhMay là bí danh của NoiCanh
export * from './chuyenCanhMay';
