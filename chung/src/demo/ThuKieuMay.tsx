import React from 'react';
import {Composition, useCurrentFrame} from 'remotion';
import {Valley} from './Valley';
import {Camp} from './Camp';
import {NuiTuyet, NUI_EYE} from './NuiTuyet';
import {GiangDuong, LOP} from './Classroom';
import {Shot} from '../lib3/shot';
import {KIEU_MAY, KieuMay} from '../lib3/kieuMay';
import {Puppet3} from '../mould/Puppet3';
import {NAM_MAU, CAO_MAU} from '../mould/nguoi-mau';

/** CẢNH THỬ KIỂU MÁY (lib3/kieuMay): thung lũng ban ngày (Valley, có lớp nền xa), người mẫu đứng giữa khoảng trống trước máy,
 *  mỗi kiểu máy một composition `thu-may-<kieu>` dài 96 khung, mức 'nhe'. Máy đứng ngang ngực cách người D = 6,5 m. */
type V3 = [number, number, number];
const EYE: V3 = [0, 1.3, 6.5], NGUOI: V3 = [0, 0, 0], D = EYE[2] - NGUOI[2];
const thu = (kieu: KieuMay): React.FC => () => {
  const f = useCurrentFrame();
  return <Shot grade="dayExterior" eye={EYE} may={{kieu, D}} set={(inside, cam) => <Valley dx={cam.dx} dz={cam.dz} f={f}>{inside}</Valley>}
    figures={<Puppet3 spec={NAM_MAU} height={CAO_MAU.nam} pos={NGUOI} />} />;
};
/** TRONG PHÒNG: giảng đường (Classroom, `GiangDuong`), máy đứng giữa phòng nhìn về bục giảng, người đứng trước bục cách máy 3,5 m.
 *  Phòng hở mặt trước: CUNG_PHONG là cung vòng lớn nhất còn chưa lộ mép phòng. Soi 25/11/2026: máy nhìn về tường bục giảng thì
 *  đủ trần 20° vẫn kín (tường trước, cửa sổ trái, tủ sách phải lấp khung). Máy quay về phía mặt hở của phòng thì phải soi lại. */
export const CUNG_PHONG = 20;
const EYE_P = LOP.eye([6.2, 1.45, 6.5]), D_P = 4.5;
/** điểm thế giới -> điểm trong phòng (ngược của LOP.eye) */
const vaoPhong = (w: V3): V3 => { const c = Math.cos(LOP.yaw), s = Math.sin(LOP.yaw); return [w[0] * c - w[2] * s + LOP.cam[0], w[1], w[0] * s + w[2] * c + LOP.cam[1]]; };
const NGUOI_P = vaoPhong([EYE_P[0], 0, EYE_P[2] - D_P]);
const thuPhong = (kieu: KieuMay): React.FC => () => <Shot grade="brightInterior" eye={EYE_P} may={{kieu, D: D_P, cung: CUNG_PHONG}} set={(inside, cam) => <GiangDuong f={47} bangSach dx={cam.dx} dz={cam.dz}>{inside}</GiangDuong>}
  figures={<Puppet3 spec={NAM_MAU} height={CAO_MAU.nam} pos={NGUOI_P} rotY={-LOP.yaw} />} />;
/** đèn cửa sổ và cờ lâu đài (vật gắn lên tấm, bọc TheoTam) khi máy vòng mức vừa 20°: đèn phải bám đúng cửa vẽ */
const thuDen: React.FC = () => { const f = useCurrentFrame(); return <Shot grade="lateDay" eye={EYE} may={{kieu: 'vong-phai', D, muc: 'vua'}} set={(inside, cam) => <Valley gio="chieu-ta" cua={3} dx={cam.dx} dz={cam.dz} f={f} tuyet={0}>{inside}</Valley>}
  figures={<Puppet3 spec={NAM_MAU} height={CAO_MAU.nam} pos={NGUOI} />} />; };
/** vật gắn lên tấm khi máy vòng đủ 20° (mức vừa, 192 khung): người đi trên đồi xa ở Camp; tu viện, đuốc và người leo dốc ở NuiTuyet */
const CAMP_EYE: V3 = [0, 1.5, 7];
const thuCamp: React.FC = () => { const f = useCurrentFrame(); return <Shot grade="dayExterior" eye={CAMP_EYE} may={{kieu: 'vong-phai', D: 5.5, muc: 'vua'}} set={(inside, cam) => <Camp state="sang" walkers dx={cam.dx} dz={cam.dz} f={f}>{inside}</Camp>}
  figures={<Puppet3 spec={NAM_MAU} height={CAO_MAU.nam} pos={[0, 0, 1.5]} />} />; };
const thuNui: React.FC = () => { const f = useCurrentFrame(); return <Shot grade="snowExterior" eye={NUI_EYE} may={{kieu: 'vong-trai', D: 5.5, muc: 'vua'}} set={(inside, cam) => <NuiTuyet state="tay-tang" tan={1} cuaSo={7} torches climbers dx={cam.dx} dz={cam.dz} f={f}>{inside}</NuiTuyet>}
  figures={<Puppet3 spec={NAM_MAU} height={CAO_MAU.nam} pos={[0, 0, 0.5]} />} />; };
const DAI: Record<string, number> = {'vong-camp': 192, 'vong-nui': 192};
const CANH = [['vong-den', thuDen] as const, ['vong-camp', thuCamp] as const, ['vong-nui', thuNui] as const, ...KIEU_MAY.map((k) => [k, thu(k)] as const), ['vong-phong-trai', thuPhong('vong-trai')] as const, ['vong-phong-phai', thuPhong('vong-phai')] as const];
export const ThuKieuMayComps: React.FC = () => <>{CANH.map(([k, C]) => <Composition key={k} id={`thu-may-${k}`} component={C} width={1280} height={720} fps={24} durationInFrames={DAI[k] ?? 96} />)}</>;
