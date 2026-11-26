/** DÁNG NGƯỜI THƯỜNG (23/11/2026): ngồi, quỳ một gối, khuỵu hai gối, ngã chống tay, nằm, cho `vest` và `coat`, người lớn và trẻ con.
 *  Một dáng là một bộ SỐ, không phải một hình: `mixPosture` trộn hai bộ số nên `act` chuyển giữa đứng và các dáng trên MỘT hình.
 *  Số đo theo đơn vị khuôn. Điểm gối và cổ chân ghi bằng độ lệch so với chỗ của chúng lúc đứng (bộ khuôn `vest`: hông y 952,
 *  gối y 1056, cổ chân y 1160); `amt` là phần đường đã đi từ dáng đứng, để người mặc `coat` (hai chân sát nhau hơn) tới đúng cùng một chỗ. */
export type LegBend = {
  kx: number; ky: number; ax: number; ay: number; toe: number;
  /** 1 = cẳng chân gập ra sau (đầu gối chạm đất, chỉ thấy mũi giày ló ra); 0 = cẳng chân thẳng xuống bàn chân */
  fold: number;
  /** 1 = đùi chĩa về phía máy, vẽ đè lên vạt áo và có mảng đầu gối; 0 = chân nằm dưới vạt áo như lúc đứng */
  fore: number;
};
export type Posture = {
  amt: number; drop: number; shift: number; tilt: number;
  /** cả người xoay trong mặt phẳng tấm (độ), rồi tự hạ cho điểm thấp nhất chạm đất; rollX dời ngang để người nằm giữa chỗ đứng */
  roll: number; rollX: number;
  /** gấu áo `coat` / váy: chỗ gấu nằm so với lúc đứng (đơn vị khuôn, dương là thấp xuống) */
  hem: number;
  /** thân đổ về phía máy nên ngắn lại: 1 = thẳng, 0,36 = gần như chúi hẳn (đầu giữ nguyên cỡ, chỉ hạ theo). sink = đầu hạ thêm xuống giữa hai vai */
  squash: number; sink: number;
  /** 1 = hai tay thẳng, chống xuống đất ngay ngoài hai vai, bàn tay úp (cánh tay trong spec chỉ là chỗ xuất phát); 0 = tay theo spec */
  plant: number;
  /** vạt áo `coat` xoè rộng ra trên mặt đất (0,5 = rộng thêm một nửa) */
  spread: number;
  L: LegBend; R: LegBend;
  /** (23/11/2026, dáng đánh nhau; mọi dáng cũ không có các trường này) hanh 0..1 = dáng hành động: bật tấm rộng, bật cách vẽ riêng của Doom và áo choàng bay.
   *  faceUp = đầu xoay ngược lại thân (độ), để người bay ngang vẫn thấy mặt. rise = rời đất bao nhiêu đơn vị khuôn (Puppet3 nâng cả tấm).
   *  capeX -1..1 = áo choàng bay sang trái, phải của hình (ngược hướng lực); capeLen = độ dài áo. flameWind = lưỡi lửa bị gió thổi ngang (âm là về bên trái). */
  hanh?: number; faceUp?: number; rise?: number;
  /** phần của `rise` vẽ ngay trong tấm (người xoay ngang có tay, áo thò xuống dưới đường chân, nằm sát đáy tấm thì bị cắt) */
  cardUp?: number;
  capeX?: number; capeLen?: number; flameWind?: number;
};
const UPRIGHT = {squash: 1, sink: 0, plant: 0, spread: 0};
const ACT = {...UPRIGHT, amt: 1, hanh: 1, roll: 0, rollX: 0};
const leg = (kx = 0, ky = 0, ax = 0, ay = 0, fold = 0, fore = 0, toe = 0): LegBend => ({kx, ky, ax, ay, toe, fold, fore});
export const POSTURES = {
  stand: {...UPRIGHT, amt: 0, drop: 0, shift: 0, tilt: 0, roll: 0, rollX: 0, hem: 0, L: leg(), R: leg()},
  /** ngồi ghế nhìn thẳng: hông ngang gối, đùi chĩa về máy, cẳng chân thẳng xuống. Mặt ghế cao `seatHeight(cao)` mét */
  sit: {...UPRIGHT, amt: 1, drop: 104, shift: 0, tilt: 0, roll: 0, rollX: 0, hem: 36, L: leg(-36, 14, -14, 0, 0, 1), R: leg(36, 14, 14, 0, 0, 1)},
  /** quỳ một gối: chân trái của hình dựng gối, bàn chân đặt phẳng; chân phải gối chạm đất, mũi giày ló sau. Muốn đổi bên: `flip` */
  kneel: {...UPRIGHT, amt: 1, drop: 128, shift: 8, tilt: 0, roll: 0, rollX: 0, hem: 118, L: leg(-72, -6, -56, 0, 0, 1), R: leg(14, 116, 46, 18, 1, 1)},
  /** quỳ hai gối nhìn chính diện: hai gối tròn chạm đất, rộng hơn hông; đùi ngắn vì hướng về máy, mông gần gót, không có ống quần dưới gối;
   *  thân đổ trước, vai sụp. Cao khoảng 2/3 lúc đứng. Áo `coat`: vạt xoè nằm trên đất */
  buckle: {amt: 1, drop: 168, shift: 0, tilt: 0, roll: 0, rollX: 0, hem: 126, squash: 0.66, sink: 36, plant: 0, spread: 0.42, L: leg(-27, 110, -22, 18, 1, 1), R: leg(27, 110, 22, 18, 1, 1)},
  /** ngã chúi chống hai tay, nhìn chính diện: hai gối (đúng chỗ của `buckle`, nên chuyển dáng không trượt gối) và hai bàn tay úp cùng chạm đất,
   *  tay thẳng ngay ngoài vai, thân chúi về máy, đầu thấp giữa hai vai (ngẩng bằng `head.dy` âm). Cao khoảng một nửa lúc đứng */
  fall: {amt: 1, drop: 112, shift: 0, tilt: 0, roll: 0, rollX: 0, hem: 126, squash: 0.36, sink: 128, plant: 1, spread: 0.5, L: leg(-27, 110, -22, 18, 1, 1), R: leg(27, 110, 22, 18, 1, 1)},
  /** nằm: đầu về bên trái khung (muốn ngược lại: `flip`), lưng trên mặt đất */
  lie: {...UPRIGHT, amt: 1, drop: 0, shift: 0, tilt: 0, roll: -90, rollX: 340, hem: 0, L: leg(-4, 0, -6, 0), R: leg(4, 0, 6, 0)},
  // ---- DÁNG ĐÁNH NHAU (23/11/2026). Tất cả hướng về BÊN PHẢI khung khi không `flip`. Tay đi kèm: POSES cùng tên, hoặc gọi gọn bằng `withDang`, `dangKey` (gestures.ts)
  /** đấm thẳng: chân tấn rộng, gối trước gập, chân sau duỗi, thân đổ tới */
  dam: {...ACT, drop: 62, shift: 34, tilt: 12, hem: 40, capeX: -0.72, L: leg(-74, 26, -176, 0), R: leg(150, 8, 158, 0)},
  /** lao tới: thân đổ mạnh, chân sau duỗi dài, gót nhấc */
  lao: {...ACT, drop: 84, shift: 72, tilt: 27, hem: 50, capeX: -1, capeLen: 1.08, flameWind: -0.5, L: leg(-120, 36, -276, -8, 0, 0, -16), R: leg(186, -4, 196, 0)},
  /** nhảy: rời đất, hai gối co lệch nhau */
  nhay: {...ACT, drop: 26, shift: 10, tilt: 7, hem: 10, rise: 210, capeX: -0.34, capeLen: 0.94, L: leg(-54, -34, -96, -92, 0, 0, -24), R: leg(84, -66, 104, -44, 0, 0, -12)},
  /** né: trọng tâm dồn về sau, thân ngả khỏi đòn, chân trước duỗi */
  ne: {...ACT, drop: 46, shift: -56, tilt: -17, hem: 30, capeX: 0.5, L: leg(-82, 14, -86, 0), R: leg(74, 22, 176, 0)},
  /** bị hất văng: thân ngửa về sau, rời đất, tay chân văng về phía trước */
  hat: {...ACT, drop: 10, shift: 0, tilt: -8, roll: -50, rollX: 210, hem: 0, rise: 150, cardUp: 150, faceUp: 22, capeX: 0.86, capeLen: 1.05, flameWind: 0.5, L: leg(18, -30, 4, -108, 0, 0, -30), R: leg(92, -14, 160, -48, 0, 0, -20)},
  /** chống đỡ: thấp người, hai chân rộng, trụ vững */
  chongDo: {...ACT, drop: 52, shift: -16, tilt: -5, hem: 34, capeX: 0.3, capeLen: 0.94, L: leg(-94, 16, -128, 0), R: leg(94, 16, 122, 0)},
  /** đứng bắn tia: chân trước bước tới, thân hơi đổ */
  ban: {...ACT, drop: 34, shift: 14, tilt: 5, hem: 24, capeX: -0.46, L: leg(-60, 14, -112, 0), R: leg(88, 10, 120, 0)},
  /** bay: thân gần nằm ngang, đầu về bên phải, hai chân duỗi, mũi chân miết về sau; nâng thêm bằng y của `pos` */
  bay: {...ACT, drop: 0, shift: 0, tilt: 0, roll: 74, rollX: -300, hem: 0, rise: 300, cardUp: 300, faceUp: -52, capeX: -0.14, capeLen: 1.55, flameWind: -1.1, L: leg(14, 0, 34, 4, 0, 0, -74), R: leg(-14, 6, -42, 22, 0, 0, -74)},
  /** bay chúi xuống: như `bay` nhưng đầu thấp hơn chân, để thân nằm trên đường chéo từ trên trái xuống dưới phải */
  bayChui: {...ACT, drop: 0, shift: 0, tilt: 0, roll: 106, rollX: -300, hem: 0, rise: 300, cardUp: 300, faceUp: -88, capeX: -0.14, capeLen: 1.55, flameWind: -1.1, L: leg(14, 0, 34, 4, 0, 0, -74), R: leg(-14, 6, -42, 22, 0, 0, -74)},
  /** Ben vung nắm đấm lên cao, thân ngả ra sau lấy đà */
  benVung: {...ACT, drop: 54, shift: -22, tilt: -11, hem: 30, L: leg(-96, 16, -136, 0), R: leg(96, 12, 132, 0)},
  /** Ben nện nắm đấm xuống: thân gập tới, gối khuỵu sâu */
  benDap: {...ACT, drop: 118, shift: 44, tilt: 19, hem: 60, L: leg(-110, 30, -196, 0), R: leg(146, -4, 170, 0)},
} satisfies Record<string, Posture>;
export type PostureName = keyof typeof POSTURES;
export const resolvePosture = (p: PostureName | Posture | undefined): Posture => (p === undefined ? POSTURES.stand : typeof p === 'string' ? POSTURES[p] : p);
const l = (a: number, b: number, t: number) => a + (b - a) * t;
const mixLeg = (a: LegBend, b: LegBend, t: number): LegBend => ({kx: l(a.kx, b.kx, t), ky: l(a.ky, b.ky, t), ax: l(a.ax, b.ax, t), ay: l(a.ay, b.ay, t), toe: l(a.toe, b.toe, t), fold: l(a.fold, b.fold, t), fore: l(a.fore, b.fore, t)});
export const mixPosture = (A: PostureName | Posture | undefined, B: PostureName | Posture | undefined, t: number): Posture => {
  const a = resolvePosture(A), b = resolvePosture(B);
  return {amt: l(a.amt, b.amt, t), drop: l(a.drop, b.drop, t), shift: l(a.shift, b.shift, t), tilt: l(a.tilt, b.tilt, t), roll: l(a.roll, b.roll, t), rollX: l(a.rollX, b.rollX, t), hem: l(a.hem, b.hem, t), squash: l(a.squash, b.squash, t), sink: l(a.sink, b.sink, t), plant: l(a.plant, b.plant, t), spread: l(a.spread, b.spread, t), L: mixLeg(a.L, b.L, t), R: mixLeg(a.R, b.R, t),
    ...(a.hanh !== undefined || b.hanh !== undefined ? {hanh: l(a.hanh ?? 0, b.hanh ?? 0, t), faceUp: l(a.faceUp ?? 0, b.faceUp ?? 0, t), rise: l(a.rise ?? 0, b.rise ?? 0, t), cardUp: l(a.cardUp ?? 0, b.cardUp ?? 0, t), capeX: l(a.capeX ?? 0, b.capeX ?? 0, t), capeLen: l(a.capeLen ?? 1, b.capeLen ?? 1, t), flameWind: l(a.flameWind ?? 0, b.flameWind ?? 0, t)} : {})};
};
/** quãng đường của một lần đổi dáng, để `act` chọn số hình trung gian */
export const postureTravel = (A: PostureName | Posture | undefined, B: PostureName | Posture | undefined) => { const a = resolvePosture(A), b = resolvePosture(B); return Math.abs(a.drop - b.drop) + Math.abs(a.roll - b.roll) * 2 + Math.abs(a.L.ky - b.L.ky) + Math.abs(a.R.ky - b.R.ky) + Math.abs(a.sink - b.sink) * 0.4 + 120 * Math.abs((a.hanh ?? 0) - (b.hanh ?? 0)) + 0.5 * Math.abs((a.rise ?? 0) - (b.rise ?? 0)); };
/** độ cao mặt ghế (mét) cho người cao `height` mét ngồi bằng `posture: 'sit'` */
export const seatHeight = (height: number) => (height * (1197 - (952 + POSTURES.sit.drop) - 30)) / 1191;
