import type {Spec} from './draw';
import {EXPR} from './expr';
import {POSES} from './gestures';
import {SKINS, skinClearOf, SkinName} from './palettes';

/** NGƯỜI MẪU CỦA PHẦN CHUNG (23/11/2026, gỡ phần chung khỏi kênh đầu tiên). Các bảng trong kho chung (bảng tông da, nét mặt,
 *  tư thế tay, phụ kiện, dáng mặt), hiệu ứng có người (cửa sáng, bóng hoá bóng) và nhóm người phụ cần một người mẫu dựng sẵn.
 *  Trước đây chúng mượn nhân vật của kênh đầu tiên; giờ là BẢN CHÉP NGUYÊN GIÁ TRỊ ở đây, để ảnh kho không đổi một điểm ảnh và
 *  phần chung không cần kênh nào. Kênh sửa nhân vật của mình thì bảng chung vẫn đứng yên. Đừng sửa các giá trị dưới đây trừ khi
 *  muốn đổi ảnh kho (và dựng lại ảnh kho bằng tools/kho.py). Nhân vật thật của một kênh nằm ở kenh/<kênh>/cast/. */
const arms = {armL: {...POSES.idle[0]}, armR: {...POSES.idle[1]}};
const showArms = {armL: {...POSES.idle[0], show: true}, armR: {...POSES.idle[1], show: true}};

/** chiều cao (m) của các người mẫu dưới đây */
export const CAO_MAU = {nam: 1.68, ong: 1.7, sinhVien: 1.66, ba: 1.56, giap: 1.86, be: 1.15, nuKhanVang: 1.56};

/** thanh niên áo sơ mi, gi-lê xanh rêu, tóc đen vuốt, da rám (người mẫu của các bảng) */
export const NAM_MAU: Spec = {outfit: 'vest', hair: 'sweep', build: 'adult', longLegs: true, expr: {...EXPR.neutral}, ...arms,
  palette: {...SKINS.tan, hair: '#1f1c22', hairLine: '#3a3640', brow: '#1f1c22', shirt: '#f1ede2', shirtEdge: '#d4cebf', shirtRim: '#faf7ee', vest: '#3f5a44', shorts: '#3a3d45', shoe: '#231f20'}};
/** ông già hói, râu bạc, áo khoác dài đen */
export const ONG_MAU: Spec = {outfit: 'coat', hair: 'bald', beard: '#c9c5bd', build: 'adult', longLegs: true, expr: {...EXPR.squint}, armL: {...POSES.idle[0], show: true}, armR: {...POSES.idle[1], show: true},
  palette: {...SKINS.fair, brow: '#8a857d', coat: '#2b2b33', coatLight: '#3a3a44', coatDark: '#1f1f26', fur: '#3a3a44', furDark: '#2b2b33', trouser: '#26262c', shoe: '#1c1a1c'}};
/** người đàn bà tóc búi, váy mận dài, khăn choàng */
export const BA_MAU: Spec = {outfit: 'coat', hair: 'bun', build: 'adult', longLegs: true, shawl: '#5c4a66', expr: {...EXPR.smile, gaze: [0, 6]},
  armL: {...POSES.idle[0], show: true}, armR: {...POSES.idle[1], show: true},
  palette: {...SKINS.tan, hair: '#2a2228', hairLine: '#463c46', brow: '#2a2228', coat: '#8a4a5c', coatLight: '#a25c6c', coatDark: '#6b3848', shoe: '#3a2a30'}};
/** người mặc bộ giáp mũ trùm của bộ khuôn (outfit 'doom'): dùng cho hiệu ứng bóng hoá bóng */
export const GIAP_MAU: Spec = {outfit: 'doom', hair: 'sweep', build: 'adult', longLegs: true, bulk: 1.3, expr: {...EXPR.neutral, upper: 'none', lower: 'none', brow: 'none'}, ...arms, palette: {...SKINS.tan}};
/** cậu bé tóc rối khoác áo choàng nâu cổ lông dài quá chân */
export const BE_AO_CHOANG_MAU: Spec = {faceShape: 'heart', outfit: 'coat', hair: 'sweep', messy: true, build: 'child', expr: {...EXPR.neutral}, ...showArms,
  palette: {...SKINS.tan, hair: '#1f1c22', hairLine: '#3a3640', brow: '#1f1c22', coat: '#6b4a32', coatLight: '#7e5a3e', coatDark: '#553a27', fur: '#4a3424', furDark: '#3a281b', trouser: '#4f4840', shoe: '#2a221c'}};

/** người đàn bà khăn trùm vàng, áo choàng đỏ sẫm, mặt trái tim (dùng cho ảnh xem trước của linh hồn trong lồng lửa) */
export const NU_KHAN_VANG_MAU: Spec = {faceShape: 'heart', outfit: 'coat', hair: 'level', build: 'adult', longLegs: true, scarf: '#d9a531', expr: {...EXPR.neutral}, ...showArms,
  palette: {...SKINS.tan, hair: '#1c1614', hairLine: '#2a2220', brow: '#1c1614', coat: '#7a2228', coatLight: '#8e2c30', coatDark: '#5e1a1e', fur: '#7a2228', furDark: '#5e1a1e', trouser: '#3a1a1c', shoe: '#2a1a18'}};
/** sinh viên cho nhóm người xa: vài màu là ra một người khác */
export const sinhVien = (vest: string, hair: string, kind: 'sweep' | 'level' = 'level', skin?: SkinName): Spec => ({outfit: 'vest', hair: kind, build: 'adult', longLegs: true, expr: {...EXPR.smile}, ...arms,
  palette: {...(skin ? SKINS[skin] : skinClearOf(hair, vest + hair + kind)), hair, brow: hair, vest, shirt: '#ece6d6', shirtEdge: '#cfc7b2', shirtRim: '#f7f3e8', shorts: '#4a4a52', shoe: '#2a2428'}});
/** một người dân áo choàng dài màu trầm, nhìn từ sau lưng (đám đông); extra phủ lên phần còn lại của Spec */
export const danThuong = (coat: string, hair: string, kind: 'sweep' | 'level' | 'bald' | 'bun' = 'level', extra: Partial<Spec> = {}): Spec => ({outfit: 'coat', hair: kind, build: 'adult', longLegs: true, view: 'back', expr: {...EXPR.neutral},
  armL: {...POSES.idle[0], show: true}, armR: {...POSES.idle[1], show: true},
  palette: {...skinClearOf(hair, coat + hair + kind), hair, hairLine: hair, brow: hair, coat, coatLight: coat, coatDark: coat, fur: coat, furDark: coat, trouser: '#2a282a', shoe: '#1f1c1c'}, ...extra});
/** sáu người dân khác nhau nhìn từ sau lưng (trẻ con, đàn bà khăn trùm, đàn ông đội mũ, tóc dài, ông già hói hơi còng) */
export const THAN_DAN_MAU: {h: number; spec: Spec}[] = [
  {h: 1.12, spec: danThuong('#6a4a2e', '#5a3a22', 'level', {outfit: 'vest', build: 'child', longLegs: false, backHair: 'bob',
    palette: {...SKINS.fair, hair: '#5a3a22', hairLine: '#6e4a2e', brow: '#5a3a22', vest: '#6a4a2e', shirt: '#d6cdb8', shirtEdge: '#bcb29c', shirtRim: '#e4dccb', shorts: '#3e3a36', shoe: '#2a221c'}})},
  {h: 1.55, spec: danThuong('#5a3a40', '#4a3426', 'bun', {backHair: 'scarf', backCloth: '#a0803e', shawl: '#6e5a3e'})},
  {h: 1.76, spec: danThuong('#3e342c', '#2a2220', 'level', {backHair: 'hat', backCloth: '#24201d'})},
  {h: 1.62, spec: danThuong('#6a4a2e', '#2a2228', 'bun', {shawl: '#3a4a5e'})},
  {h: 1.82, spec: danThuong('#2f3a4e', '#1f1c22', 'level', {backHair: 'long'})},
  {h: 1.6, spec: danThuong('#3c4a3e', '#d2cec4', 'bald', {lean: -5, head: {dy: 14}})},
];
