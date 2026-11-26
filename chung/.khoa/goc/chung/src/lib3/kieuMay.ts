// KIỂU MÁY QUAY CÓ TÊN (24/11/2026). Chủ kênh chê máy chỉ trượt/đẩy thẳng, có lúc đi quá mạnh, chưa có kiểu vừa đi vừa xoay.
// mayQuay(kieu, f, dur, D, muc, cung?) trả độ lệch của máy so với khung chuẩn: {dx, dy, dz (mét), yaw, pitch, nen (radian)}.
//   D   = khoảng cách từ máy tới chủ thể (mét); chủ thể coi như đứng THẲNG trước máy ở khung chuẩn.
//   muc = 'nhe' (quãng ≈ 2,5 % khung) hoặc 'vua' (≈ 4 % khung). "Khung" = bề ngang khung hình tại khoảng cách D (0,887·D);
//         với nâng/hạ là bề cao (0,4986·D); với đẩy/kéo là 2,5 / 4 % khoảng cách D (cỡ chủ thể đổi chừng ấy).
// Luật giữ nguyên: máy đi ĐỀU TỐC từ khung đầu tới khung cuối (mọi giá trị là bậc nhất theo thời gian, trừ kiểu lượn / vòng đi
// cung tròn qua duongMay); khung GIỮA cảnh là khung chuẩn (độ lệch bằng 0, đường đối xứng); không làm độ cong bằng tiến lùi.
// Giới hạn kẹp trong code: quãng ≤ 4 % (theo, nâng/hạ: độ trôi nhìn thấy, xem dưới), |yaw| tổng ≤ 5° (trừ kiểu vong), |pitch| tổng ≤ 2,5°.
//   truot-trai / truot-phai     dời ngang thuần (máy sang trái / phải), ống kính không xoay
//   day / keo                   đẩy vào / kéo ra theo trục nhìn
//   luon-trai / luon-phai       lượn quanh chủ thể (duongMay): máy đi sang trái / phải, ống kính xoay theo; cung 3° nhẹ, 4,5° vừa
//   theo-trai / theo-phai       máy dời ngang và lia 70 % góc cần để giữ chủ thể: chủ thể trôi 30 %, nền xa trôi ngược 70 %
//   nang / ha                   máy lên / xuống, kèm cúi / ngước 80 % góc cần: chủ thể trôi 20 %, nền xa trôi ngược 80 %
//   QUÃNG CỦA THEO VÀ NÂNG/HẠ = ĐỘ TRÔI NHÌN THẤY (25/11/2026; luật "tổng 2–4 %" của Daniel là về chuyển động thấy trên màn hình).
//   Máy dời bao nhiêu cũng được, miễn trên màn hình nền xa trôi ≤ 4 % và chủ thể trôi ≤ 2,5 % (bề ngang khung cho theo, bề cao
//   cho nâng/hạ). Mục tiêu TROI_MAY: nhẹ = nền 3,5 %, người 1,5 %; vừa = nền 4 %, người 2,5 %. Máy dời T = min(nền / bù,
//   người / (1 − bù)): chạm mục tiêu nào trước thì dừng ở đó. Ra: theo nhẹ (bù 70 %, 25/11) nền 3,5 %, người 1,5 %; theo vừa nền
//   4 %, người 1,7 %; nâng nhẹ nền 3,5 %, người 0,9 %; nâng vừa nền 4 %, người 1 %. (Bản bù 35 % / 50 % thử 25/11 chỉ dồn chuyển động
//   sang người, nền còn trôi ít hơn: độ trượt tương đối giữa người và nền chỉ do quãng dời máy quyết định.)
//   day-lia-trai / day-lia-phai đẩy vào như `day` và lia chậm sang trái / phải một góc bằng quãng đó của bề ngang khung
//   vong-trai / vong-phai       máy đi cung TRÒN quanh chủ thể (giữ khoảng cách D, ống kính luôn nhìn chủ thể) theo TỐC ĐỘ GÓC:
//                               1,5°/giây nhẹ, 2,5°/giây vừa; cung = tốc độ × thời lượng cảnh (cảnh 4 s nhẹ = 6°), trần 20° hoặc trần riêng `cung` (25/11/2026: cung cố định 12° Daniel thấy hơi nhanh).
//                               Các tấm Plate quay theo máy một phần quanh chủ thể (trường `nen`, Shot đặt vào VongCtx) để với chúng máy chỉ như vòng ±4,5°: mép không lộ, lớp xa vẫn trôi hơn
//                               lớp gần; khối 3D, Sprite và người thấy đủ cung thật.
//                               Vật gắn lên tấm (điểm từ onPlate: đèn cửa sổ, cờ, người đi trên đồi vẽ) và tấm tự vẽ không qua
//                               Plate phải bọc trong <TheoTam from={...}> (lib3/depth) thì mới quay cùng tấm. Phần chung đã bọc hết
//                               (Valley: đèn, cờ lâu đài; Camp: đuốc, đoàn người, người đi trên đồi; NuiTuyet: người leo, lính,
//                               đuốc trên dốc; kitTayTang: TuVienPlate). File của kênh tự bọc TheoTam cho vật onPlate của mình.
//   Bụi: BuiKhi (kit) đi theo độ lệch của kiểu máy qua MayCtx; BuiNguon tự đọc camera thật nên vốn đã theo máy.
import {duongMay} from './duongMay';

export type KieuMay = 'truot-trai' | 'truot-phai' | 'day' | 'keo' | 'luon-trai' | 'luon-phai' | 'theo-trai' | 'theo-phai' | 'nang' | 'ha' | 'day-lia-trai' | 'day-lia-phai' | 'vong-trai' | 'vong-phai';
export type MucMay = 'nhe' | 'vua';
/** cung: chỉ cho kiểu vong, TRẦN RIÊNG của cảnh (độ, tổng cả cảnh), ví dụ phòng hở mặt trước: cung thật = min(tốc độ × thời lượng, cung, 20°) */
export type May = {kieu: KieuMay; D: number; muc?: MucMay; cung?: number};
export const KIEU_MAY: KieuMay[] = ['truot-trai', 'truot-phai', 'day', 'keo', 'luon-trai', 'luon-phai', 'theo-trai', 'theo-phai', 'nang', 'ha', 'day-lia-trai', 'day-lia-phai', 'vong-trai', 'vong-phai'];

const DEG = Math.PI / 180;
/** bề ngang / bề cao khung hình tại khoảng cách 1 m (ống kính 28° dọc, khung 16:9) */
const NGANG = 0.887, CAO = 0.4986, HFOV = 47.8;
/** quãng (%), cung lượn và cung vòng (độ) theo mức; và trần cứng không cho vượt */
/** vong = tốc độ góc của kiểu vòng (độ / giây) */
export const MUC_MAY = {nhe: {quang: 2.5, cung: 3, vong: 1.5}, vua: {quang: 4, cung: 4.5, vong: 2.5}} as const;
/** nenNua = nửa góc vòng lớn nhất mà các tấm Plate được thấy (chúng chỉ vẽ dư ~6° mỗi bên) */
export const TRAN_MAY = {quang: 4, cung: 5, yaw: 5, pitch: 2.5, vong: 20, nenNua: 4.5, nenTroi: 4, nguoiTroi: 2.5} as const;
/** độ trôi nhìn thấy (% khung) mà theo và nâng/hạ nhắm tới */
export const TROI_MAY = {nhe: {nen: 3.5, nguoi: 1.5}, vua: {nen: 4, nguoi: 2.5}} as const;
const THEO = 0.7, NANG = 0.8;
const kep = (v: number, m: number) => Math.max(-m, Math.min(m, v));

export const mayQuay = (kieu: KieuMay, f: number, dur: number, D: number, muc: MucMay = 'nhe', cung?: number, fps = 24) => {
  const t = dur > 1 ? Math.min(1, Math.max(0, f / (dur - 1))) : 0.5, u = t - 0.5, d = Math.max(0.1, D);
  const m = MUC_MAY[muc] ?? MUC_MAY.nhe, q = kep(m.quang, TRAN_MAY.quang) / 100;
  // tổng góc tối đa (radian) cả cảnh; u chạy -0,5..0,5 nên giá trị tức thời ≤ nửa trần mỗi bên
  const kYaw = (a: number) => kep(a, TRAN_MAY.yaw * DEG), kPitch = (a: number) => kep(a, TRAN_MAY.pitch * DEG);
  const o = {dx: 0, dy: 0, dz: 0, yaw: 0, pitch: 0, nen: 0};   // nen = góc các tấm Plate quay theo máy quanh chủ thể (chỉ kiểu vong)
  const s = kieu.endsWith('phai') ? 1 : -1, tr = TROI_MAY[muc] ?? TROI_MAY.nhe;
  /** quãng dời máy (phần của khung) để nền xa trôi ≤ tr.nen và chủ thể trôi ≤ tr.nguoi, với phần bù b */
  const dong = (b: number) => Math.min(Math.min(tr.nen, TRAN_MAY.nenTroi) / b, Math.min(tr.nguoi, TRAN_MAY.nguoiTroi) / (1 - b)) / 100;
  switch (kieu) {
    case 'truot-trai': case 'truot-phai': o.dx = s * u * q * NGANG * d; break;
    case 'day': o.dz = -u * q * d; break;
    case 'keo': o.dz = u * q * d; break;
    case 'luon-trai': case 'luon-phai': { const r = duongMay(f, dur, d, {cung: s * kep(m.cung, TRAN_MAY.cung)}); o.dx = r.dx; o.dz = r.dz; o.yaw = r.yaw; break; }
    case 'theo-trai': case 'theo-phai': { const T = dong(THEO) * NGANG * d; o.dx = s * u * T; o.yaw = u * s * kYaw((THEO * T) / d); break; }   // yaw > 0 = nhìn sang trái: máy sang phải thì quay trái về chủ thể
    case 'nang': case 'ha': { const k = kieu === 'nang' ? 1 : -1, H = dong(NANG) * CAO * d; o.dy = k * u * H; o.pitch = -k * u * kPitch((NANG * H) / d); break; }   // pitch > 0 = ngước
    case 'day-lia-trai': case 'day-lia-phai': o.dz = -u * q * d; o.yaw = -s * u * kYaw(q * HFOV * DEG); break;   // lia trái = yaw tăng dương
    case 'vong-trai': case 'vong-phai': {
      const C = Math.min(TRAN_MAY.vong, Math.abs(cung ?? TRAN_MAY.vong), (m.vong * dur) / fps), r = duongMay(f, dur, d, {cung: s * C}), thay = Math.min(1, (2 * TRAN_MAY.nenNua) / Math.max(C, 1e-6));
      o.dx = r.dx; o.dz = r.dz; o.yaw = r.yaw; o.nen = r.yaw * (1 - thay); break;   // với các tấm Plate máy chỉ vòng r.yaw * thay
    }
  }
  return o;
};
