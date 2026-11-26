// Cảnh thử lớp bụi theo nguồn (lib3/buiNguon), 24/11/2026. Bốn bối cảnh có sẵn, không người, 96 khung:
//   thu-bui-nang  giảng đường sáng (Sun qua cửa sổ)      -> bụi be chỉ trong vệt nắng
//   thu-bui-lua   lò rèn đêm (Flame của lò, trăng qua cửa) -> tàn lửa sát lò, bụi lạnh trong vệt trăng
//   thu-bui-ngoai thung lũng ban ngày, không tuyết         -> lớp nền ngoài trời rất thưa, vài lá
//   thu-bui-phep  phòng thí nghiệm, máy đang chạy          -> hạt xanh quấn quanh cuộn dây (Halo tự đăng ký 'phep')
// Thêm 25/11/2026 (bản 2: trăng trong nhà đã tắt, phép đậm hơn, ngoài trời ngày dày gấp đôi):
//   thu-bui-nhan-vat CẢNH SIGNATURE: giảng đường, người mặc tím, <BuiNhanVat kieu="tim" /> -> bụi tím bay khắp phòng (bản -truoc: cảnh
//                    thường, chỉ bụi nắng) -> <BuiNhanVat kieu="tim" /> quanh người
//   thu-bui-xanh     lò rèn, cảnh quay chọn màu bụi 'xanh'  -> <MauBuiCanh kieu="xanh" /> đổi màu lớp nền
//   thu-bui-cay      thung lũng ngày, thêm một cây và hai bụi hoa gần máy -> lá rơi từ tán, phấn hoa bay, hạt cỏ trôi (Sprite tự đăng ký)
// Mỗi cảnh có thêm bản `-truoc` (BuiNguon tắt) để ghép ảnh TRƯỚC | SAU.
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Composition, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Finish} from '../lib3/look';
import {BuiNguonCtx, BuiNhanVat, MauBuiCanh} from '../lib3/buiNguon';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import {withPose} from '../mould/gestures';
import type {Spec} from '../mould/draw';
import {AutoRecv} from '../lib3/kit';
import {GiangDuong, LOP} from './Classroom';
import {Forge} from './Forge';
import {Valley} from './Valley';
import {Lab} from './Lab';
import {Sprite, paintTree, paintBush} from '../lib3/depth';

/** người mẫu mặc tím (thử bụi theo màu nhân vật) */
const TIM: Spec = withPose({outfit: 'vest', hair: 'level', build: 'adult', longLegs: true, expr: {...EXPR.smile, gaze: [-14, 4]}, palette: {hair: '#2a2420', hairLine: '#4a3f38', brow: '#2a2420', vest: '#6a3a9a', shirt: '#e8dcf4', shirtEdge: '#cfc0e0', shirtRim: '#f4eefa', shorts: '#4a2a6a', shoe: '#2a2428'}}, 'point');
const CHO_TIM: [number, number, number] = [3.4, 0.22, 1.35];   // trên bục giảng đường, trước bảng (bối cảnh sáng)

type Ten = 'nang' | 'lua' | 'ngoai' | 'phep' | 'nhan-vat' | 'xanh' | 'cay';
const CANH: Record<Ten, {warm?: string; ve: (f: number, sau: boolean) => React.ReactNode; truocBat?: boolean}> = {
  nang: {ve: (f) => <GiangDuong f={f} />},
  lua: {warm: '', ve: (f) => <Forge f={f} state="trong" />},
  ngoai: {ve: (f) => <Valley gio="ngay" tuyet={0} f={f} />},
  phep: {warm: '', ve: (f) => <Lab f={f} view="wide" machine={{coils: 8, lamps: 6, lever: 1}} glow={{strength: 0.8}} />},
  'nhan-vat': {truocBat: true, ve: (f, sau) => <GiangDuong f={f}><Puppet3 height={1.75} pos={CHO_TIM} rotY={-LOP.yaw} spec={TIM} />{sau ? <BuiNhanVat kieu="tim" /> : null}</GiangDuong>},
  xanh: {warm: '', ve: (f) => <Forge f={f} state="trong"><MauBuiCanh kieu="xanh" /></Forge>},
  cay: {ve: (f) => <Valley gio="ngay" tuyet={0} f={f}>
    <Sprite name="tree" art={(c, W, H) => paintTree(c, W, H)} px={[600, 720]} w={3.2} pos={[-2.7, 0, 1.6]} />
    <Sprite name="bush#e88aa0" art={(c, W, H) => paintBush(c, W, H, undefined, '#e88aa0')} px={[400, 240]} w={1.6} pos={[-1.3, 0, -0.4]} />
    <Sprite name="bush#f4e27a" art={(c, W, H) => paintBush(c, W, H, undefined, '#f4e27a')} px={[400, 240]} w={1.4} pos={[1.8, 0, 0.3]} flip />
  </Valley>},
};
const Thu: React.FC<{ten: Ten; bat: boolean}> = ({ten, bat}) => {
  const {width, height} = useVideoConfig(), f = useCurrentFrame(), c = CANH[ten];
  return <AbsoluteFill><Finish warm={c.warm}><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv />
    <BuiNguonCtx.Provider value={{bat: bat || !!c.truocBat}}>{c.ve(f, bat)}</BuiNguonCtx.Provider>
  </ThreeCanvas></Finish></AbsoluteFill>;
};
export const ThuBuiNguonComps: React.FC = () => <>{(Object.keys(CANH) as Ten[]).map((t) => <React.Fragment key={t}>
  <Composition id={`thu-bui-${t}`} component={() => <Thu ten={t} bat />} width={1280} height={720} fps={24} durationInFrames={96} />
  <Composition id={`thu-bui-${t}-truoc`} component={() => <Thu ten={t} bat={false} />} width={1280} height={720} fps={24} durationInFrames={96} />
</React.Fragment>)}</>;
