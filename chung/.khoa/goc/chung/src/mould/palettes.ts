import type {Palette} from './draw';

/** BỘ MÀU DA, ĐO TỪ VIDEO GỐC (26/11/2026; Daniel: "check lại màu da nhân vật của kênh gốc và chọn bộ có sẵn để agent chỉ chọn màu từ đó ra").
 *  Cách đo: trên 573 khung của thư viện cảnh mẫu, tìm lòng trắng mắt (đốm trắng kem có con ngươi sẫm ở cạnh) rồi lấy màu da ngay quanh đó, chỉ ở khung
 *  không bị phủ màu: 174 mẫu. Bốn tông sáng tách nhóm rõ; ba tông sẫm ít mẫu và lẫn thứ không phải mặt, nên lấy trung vị của các mặt đã soi tay.
 *  Da ở video gốc là một màu phẳng, sắc 23–28°, bão hoà từ 0,31 (tông sáng) tới 0,56 (tông sẫm). Bộ cũ (5 tông) lệch ở chỗ: `tan` rực hơn (bão hoà 0,50,
 *  video gốc 0,41), thiếu hai tông sáng gặp nhiều nhất (`warm`, `light`), và mặt tô chuyển sắc mạnh (sáng hơn 8 %, tối hơn 9 %).
 *  MỌI NHÂN VẬT DA NGƯỜI CHỈ LẤY MÀU DA TỪ BỘ NÀY: palette: {...SKINS.light, hair: …}. Không tự ghi mã màu da trong dàn nhân vật (`tools/kiem_mat.py`
 *  báo `da-ngoai-bo`). Nhân vật không phải da người (tượng, ma, người tím, người đá) ghi `da:ok <lý do>` trên dòng đó.
 *  skinB = skin = màu đo được; skinA sáng hơn 3 %, skinC tối hơn 5 % (mặt gần phẳng như video gốc); skinDark, lidEdge theo tỉ lệ của bộ cũ. */
export const SKINS = {
  porcelain: {skinA: '#f7cbaa', skinB: '#f0c5a5', skinC: '#e4bb9d', skin: '#f0c5a5', skinDark: '#c5a287', lidEdge: '#9e826d'},   // rất sáng (32 mẫu)
  warm: {skinA: '#f4bc99', skinB: '#edb795', skinC: '#e1ae8e', skin: '#edb795', skinDark: '#c2967a', lidEdge: '#9c7962'},   // sáng, ấm (53 mẫu; tông gặp nhiều nhất)
  light: {skinA: '#e3b18f', skinB: '#dcac8b', skinC: '#d1a384', skin: '#dcac8b', skinDark: '#b48d72', lidEdge: '#91725c'},   // sáng vừa (31 mẫu)
  fair: {skinA: '#d7a683', skinB: '#d1a17f', skinC: '#c79979', skin: '#d1a17f', skinDark: '#ab8468', lidEdge: '#8a6a54'},   // vừa (27 mẫu)
  tan: {skinA: '#bf9471', skinB: '#b9906e', skinC: '#b08968', skin: '#b9906e', skinDark: '#98765a', lidEdge: '#7a5f49'},   // ngăm (7 mặt đã soi tay)
  brown: {skinA: '#9d6745', skinB: '#986443', skinC: '#905f40', skin: '#986443', skinDark: '#7d5237', lidEdge: '#64422c'},   // nâu (5 mặt đã soi tay)
  dark: {skinA: '#7d4d37', skinB: '#794b35', skinC: '#734732', skin: '#794b35', skinDark: '#633d2b', lidEdge: '#503223'},   // nâu sẫm (3 mặt đã soi tay; tông sẫm nhất đo được)
} satisfies Record<string, Palette>;
export type SkinName = keyof typeof SKINS;
/** người phụ: tỉ lệ các tông theo số mẫu đo được ở video gốc (`dark` chỉ dùng khi chọn đích danh) */
const ORDER: SkinName[] = ['warm', 'light', 'porcelain', 'fair', 'warm', 'tan', 'porcelain', 'warm', 'light', 'brown', 'fair', 'warm'];
/** A skin for an extra, picked from any text that identifies them (their colours, their name): the same person always gets the
 *  same skin, a crowd gets a mix. */
export const skinFor = (id: string): Palette => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return SKINS[ORDER[h % ORDER.length]]; };

const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); };
/** skinFor, but never a skin whose tone sits on the hair's: brown hair over a dark face read as one mask with the eyes in it
 *  (seen in the asset store's preview of the extras, 21/11/2026). The next tone in the order is taken instead. */
export const skinClearOf = (hair: string, id: string): Palette => {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  for (let k = 0; k < ORDER.length; k++) { const s = SKINS[ORDER[(h + k) % ORDER.length]]; if (Math.abs(lum(s.skin) - lum(hair)) >= 30) return s; }
  return SKINS.fair;
};
