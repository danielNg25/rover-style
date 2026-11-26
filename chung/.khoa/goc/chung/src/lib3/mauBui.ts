// BỤI THEO KHUNG HÌNH. Cách dùng của kênh phim-tv ghi ở kenh/phim-tv/ghi-chu.md.
// Daniel 23–24/11/2026: "bụi trắng là tuyết"; "chỗ trong phòng có nến thì bụi vàng, chỗ purple man thì bụi tím, trong phòng thí nghiệm của doom
// là bụi màu xanh của doom"; rồi "bụi quá nhiều rồi, xem lại chương 10-14, các chương đó mới là mình thích".
// MẪU ĐỘ DÀY: chương 10–14 của doom-1, bản 3. Bụi thưa, hạt nhỏ, lẫn vài mảnh hình thoi, nhìn thấy nhưng không chiếm khung. Không sửa các chương đó.
// Phần chung không biết kênh nào: tập gọi `datBuiAm(/mã composition/, /cảnh đặc biệt/, {khi: /cảnh có lớp bụi khí/, canh: [[/cảnh/, 'tim'], ...]})`.
// Với composition khớp mẫu, hạt không khí có sẵn (Motes, DriftSpecks, Hat kiểu kim) chỉ giữ lại một phần. Hạt của hiệu ứng nhỏ (dưới 9 hạt), mảnh vỡ,
// sao và lửa giữ nguyên. Cảnh đặc biệt (hào quang, biến đổi) giữ màu của nó và còn nhiều hạt hơn.
// Composition khớp `khi` có thêm lớp bụi khí và màu theo khung hình: bảng `canh` của tập > màu bối cảnh trong `datNoiBui(noi, kieu)` > màu của nơi.
import {useVideoConfig} from 'remotion';

export type NoiBui = 'trong-nha' | 'ngoai-troi' | 'tuyet' | 'battleworld' | 'tren-may' | 'vu-tru';
/** vang-nen: phòng có nến, lò; tim: nhân vật hoặc phép màu tím; xanh: máy móc, phép màu xanh; lua: dung nham, đám cháy; khong: tắt lớp bụi khí */
export type KieuBui = 'vang-nen' | 'tim' | 'xanh' | 'kem' | 'cat' | 'lua' | 'may' | 'khong';
export const MAU_BUI: Record<Exclude<KieuBui, 'khong'>, string[]> = {
  'vang-nen': ['#ffe49a', '#ffd36e', '#fff1c4'],
  tim: ['#a85cff', '#8f45f0', '#c792ff'],   // đậm hơn các màu khác để còn thấy tím trên tường sáng
  xanh: ['#8dffba', '#4ff09a', '#d2ffe3'],
  kem: ['#efe4c8', '#e6d8b8'],
  cat: ['#d8b98f', '#c7a27c', '#b9947a'],
  lua: ['#ffb14a', '#ff8a3a', '#ffd988'],
  may: ['#ffeeda', '#fff5ea'],
};
/** giu, sang, mau: hạt có sẵn của bối cảnh, đúng công thức của chương 10–14; khi: số hạt lớp bụi khí; kieu: màu theo khung hình mặc định của nơi */
const BANG: Record<NoiBui, {giu: number; sang: number; mau: string[] | null; khi: number; kieu: KieuBui | null}> = {
  'trong-nha': {giu: 0.2, sang: 0.25, mau: ['#cdbb98', '#bfae8e', '#d9c9a8'], khi: 28, kieu: 'kem'},
  'ngoai-troi': {giu: 0.16, sang: 0.25, mau: ['#efe4c8', '#e6d8b8'], khi: 22, kieu: 'kem'},
  tuyet: {giu: 0.16, sang: 0.25, mau: ['#efe4c8', '#e6d8b8'], khi: 0, kieu: 'kem'},   // nơi đã có tuyết rơi: tuyết là hạt của cảnh
  battleworld: {giu: 0.16, sang: 0.25, mau: ['#d8b98f', '#c7a27c', '#b9947a'], khi: 26, kieu: 'cat'},
  'tren-may': {giu: 0.2, sang: 0.3, mau: ['#ffeeda', '#fff5ea'], khi: 16, kieu: 'may'},
  'vu-tru': {giu: 0.45, sang: 0.6, mau: null, khi: 0, kieu: null},   // đã có sao
};
const KHI_CHI_DINH = 26;   // nơi mặc định không có lớp khí nhưng tập chỉ định màu riêng
let mau: RegExp | null = null, dacBiet: RegExp | null = null, khiMau: RegExp | null = null, theoCanh: [RegExp, KieuBui][] = [], noi: NoiBui = 'trong-nha', kieuNoi: KieuBui | undefined;
export const datBuiAm = (r: RegExp, dac?: RegExp, o: {khi?: RegExp; canh?: [RegExp, KieuBui][]} = {}) => { mau = r; dacBiet = dac ?? null; khiMau = o.khi ?? null; theoCanh = o.canh ?? []; };
/** Giờ trong ngày cho lớp bụi nền của BuiNguon (lib3/buiNguon). Không ghi thì BuiNguon đoán theo GradeCtx và màu nền trời. */
export type GioBui = 'ngay' | 'chang-vang' | 'dem';
let gioNoi: GioBui | undefined, noiDaDat = false;
/** gọi ở đầu mỗi bối cảnh, trước khi vẽ hạt; kieu = màu bụi riêng của bối cảnh (sảnh có nến: 'vang-nen', phòng máy: 'xanh');
 *  gio = giờ trong ngày cho lớp bụi nền của BuiNguon (tuỳ chọn) */
export const datNoiBui = (n: NoiBui, kieu?: KieuBui, gio?: GioBui) => { noi = n; kieuNoi = kieu; gioNoi = gio; noiDaDat = true; };
/** Nơi đã đặt bằng datNoiBui (BuiNguon đọc). daDat = false: bối cảnh chưa gọi datNoiBui lần nào, BuiNguon tự đoán theo GradeCtx. */
export const noiBuiHienTai = () => ({noi, kieu: kieuNoi, gio: gioNoi, daDat: noiDaDat});
/** true khi composition này khớp `datBuiAm` của một tập đã duyệt: mức bụi đã khoá, BuiNguon và các nguồn không vẽ gì thêm. */
export const useBuiKhoa = () => { const {id} = useVideoConfig(); return !!mau && mau.test(id); };
const kieuCua = (id: string): {kieu: KieuBui | null; chiDinh: boolean} => {
  const c = theoCanh.find(([r]) => r.test(id));
  return c ? {kieu: c[1], chiDinh: true} : {kieu: kieuNoi ?? BANG[noi].kieu, chiDinh: false};
};
const bangMau = (k: KieuBui | null) => (k && k !== 'khong' ? MAU_BUI[k] : null);
const doiMau = (c: string) => {
  const m = /^#([0-9a-f]{6})$/i.exec(c); if (!m) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)), hi = Math.max(r, g, b), lo = Math.min(r, g, b);
  return (hi >= 200 && (hi - lo) / hi <= 0.38) || (r >= 200 && g >= 140 && r >= g && g >= b);   // trắng, kem, xám sáng, hoặc vàng ấm
};
const giuLai = (i: number, seed: number, k: number) => { const x = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453; return x - Math.floor(x) < k; };
/** mau(c, i): màu của hạt; giu(i, n, seed): có vẽ hạt này không; sang: nhân độ quầng */
export const useBui = () => {
  const {id} = useVideoConfig(), bat = !!mau && mau.test(id), dac = bat && !!dacBiet && dacBiet.test(id), p = BANG[noi];
  if (!bat) return {mau: (c: string, _i = 0) => c, giu: (_i: number, _n: number, _s = 0) => true, sang: 1};
  if (dac) return {mau: (c: string, _i = 0) => c, giu: (i: number, n: number, s = 0) => n < 9 || giuLai(i, s, 0.55), sang: 0.7};
  const m = khiMau && khiMau.test(id) ? bangMau(kieuCua(id).kieu) ?? p.mau : p.mau;
  return {mau: (c: string, i = 0) => (m && doiMau(c) ? m[Math.abs(i) % m.length] : c), giu: (i: number, n: number, s = 0) => n < 9 || giuLai(i, s, p.giu), sang: p.sang};
};

/** Lớp bụi khí do StageCam vẽ, chỉ cho composition khớp `khi`. Cảnh đặc biệt và kiểu 'khong' không có lớp này. */
export const useBuiKhi = () => {
  const {id} = useVideoConfig(), bat = !!mau && mau.test(id) && !!khiMau && khiMau.test(id), dac = bat && !!dacBiet && dacBiet.test(id), {kieu, chiDinh} = kieuCua(id), m = bangMau(kieu);
  const n = bat && !dac && m ? (chiDinh ? Math.max(BANG[noi].khi, KHI_CHI_DINH) : BANG[noi].khi) : 0;
  return {n, mau: m ?? ['#ffffff'], seed: id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7)};
};
