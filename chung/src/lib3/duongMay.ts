// Đường máy "đi ngang và cong nhẹ" (Daniel, 23/11/2026). Bản đầu chỉ cho máy tiến lùi theo đường vòng, ống kính không xoay, nên nhìn như
// zoom vào zoom ra (Daniel chê). Bản này LƯỢN THẬT quanh một điểm cách máy D mét: máy dời ngang và ống kính xoay theo, nên chủ thể gần
// như đứng yên, nền trượt ngược lại, cỡ người không đổi.
// cung = tổng góc lượn cả cảnh, độ (dương: máy đi sang phải, ống kính quay sang trái); ngang = thêm % bề ngang khung đi thẳng;
// day = % khoảng cách đẩy vào suốt cảnh (mặc định 0). Khung GIỮA cảnh đúng bằng khung của bảng phân cảnh.
// Giữ tổng góc từ 8 độ trở xuống: các lớp nền xa (Plate) chỉ vẽ dư khoảng 6 độ mỗi bên.
import {createContext} from 'react';

/** góc xoay của ống kính (radian) cho StageCam; đặt BÊN TRONG ThreeCanvas (Shot có prop `yaw`) */
export const XoayCtx = createContext(0);
/** góc ngước của ống kính (radian, dương = ngước lên) và độ nâng máy (mét, dương = lên) cho StageCam; mặc định 0 = như cũ.
 *  Shot đặt hai giá trị này khi có prop `may` (lib3/kieuMay: kiểu nâng / hạ). */
export const NgocCtx = createContext(0);
export const NangCtx = createContext(0);
/** MÁY ĐI VÒNG (lib3/kieuMay, kiểu vong): các tấm Plate quay góc `nen` (radian) quanh chủ thể, cách mắt máy chuẩn D mét thẳng phía
 *  trước, để máy vòng 12–20° mà mép tấm không lộ. null (mặc định) = tấm đứng yên như cũ. */
export const VongCtx = createContext<{nen: number; D: number} | null>(null);
/** độ lệch máy do kiểu máy (Shot prop `may`) gây ra: bụi khí (kit/BuiKhi) đi theo để hạt luôn nằm trước ống kính hiện tại.
 *  null (mặc định, kể cả cảnh dùng dx / dz / yaw kiểu cũ) = bụi đứng như trước. */
export const MayCtx = createContext<{dx: number; dy: number; dz: number; yaw: number; pitch: number} | null>(null);
export type DuongMay = {ngang?: number; cung?: number; day?: number};

export const duongMay = (f: number, dur: number, D: number, {ngang = 0, cung = 0, day = 0}: DuongMay = {}) => {
  const t = dur > 1 ? Math.min(1, Math.max(0, f / (dur - 1))) : 0.5, u = t - 0.5, yaw = (u * cung * Math.PI) / 180;
  return {dx: ((u * ngang) / 100) * 0.887 * D + D * Math.sin(yaw), dz: D * (Math.cos(yaw) - 1) - ((u * day) / 100) * D, yaw};
};
