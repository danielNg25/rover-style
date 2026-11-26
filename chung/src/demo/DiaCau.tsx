import React from 'react';
import {AbsoluteFill, Composition, useVideoConfig, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Finish} from '../lib3/look';
import {StageCam} from '../lib3/kit';
import {DiaCau, NenVuTru, SongLan, DuongDi, Ghim, cauEye, tienDo, NOI} from '../lib3/kitDiaCau';

/** THE GLOBE, two test compositions (kho chung, 23/11/2026), globe about 72 % of the frame height (cauEye default) in space:
 *    dia-cau-song-lan   72 frames: the Earth turns from Europe toward America while red rings spread from Latveria across
 *                       the Atlantic; a pin with "latveria" at the start, a pin with "nước mỹ" when the rings arrive
 *    dia-cau-duong-tau  96 frames: a dotted route draws itself from the French coast to New York, the little steamship
 *                       sailing on it at an even pace, the Earth turning to keep it in view */
type V3 = [number, number, number];
const Stage: React.FC<{children: React.ReactNode; eye?: V3}> = ({children, eye = cauEye()}) => { const {width, height} = useVideoConfig();
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat gl={{antialias: true}}><StageCam eye={eye} haze="#2f4c86" fog={[200, 900]} />{children}</ThreeCanvas></Finish></AbsoluteFill>; };
const SongLanThu: React.FC = () => { const f = useCurrentFrame(), k = tienDo(f, 4, 66);
  return <Stage><NenVuTru f={f} /><DiaCau f={f} lon={14 - 58 * k} lat={38 - 4 * k}>
    <Ghim lon={NOI.latveria[0]} lat={NOI.latveria[1]} f={f} at={2} kind="co" color="#e8302a" label="latveria" />
    <SongLan f={f} lon={NOI.latveria[0]} lat={NOI.latveria[1]} start={6} every={7} count={5} life={44} reach={80} />
    <Ghim lon={NOI.newYork[0]} lat={NOI.newYork[1]} f={f} at={42} label="nước mỹ" side={-1} />
  </DiaCau></Stage>; };
const DuongTauThu: React.FC = () => { const f = useCurrentFrame(), p = tienDo(f, 8, 88), k = tienDo(f, 0, 92);
  return <Stage><NenVuTru f={f} seed={5} /><DiaCau f={f} lon={-4 - 46 * k} lat={44 - 4 * k}>
    <Ghim lon={NOI.leHavre[0]} lat={NOI.leHavre[1]} f={f} at={0} kind="cham" color="#e8302a" />
    <DuongDi from={NOI.leHavre} to={NOI.newYork} p={p} f={f} mover="tau" />
    <Ghim lon={NOI.newYork[0]} lat={NOI.newYork[1]} f={f} at={86} label="nước mỹ" side={-1} />
  </DiaCau></Stage>; };
/** 24/11/2026: hai ghim mới của chương 15 (cảnh 13, 24): tháp nhỏ không tên ở vùng băng phía bắc; sáu đốm lửa trên lục địa, đốm đầu tắt ở khung 20 và mọc chấm xanh */
const LuaThapThu: React.FC = () => { const f = useCurrentFrame(), k = tienDo(f, 0, 47);
  return <Stage><NenVuTru f={f} seed={7} /><DiaCau f={f} lon={-30 + 40 * k} lat={44}>
    <Ghim lon={-40} lat={76} f={f} at={0} kind="thap" />
    {[[20, 48], [-5, 38], [35, 30], [-60, 38], [60, 52], [10, 20]].map(([lo, la], i) => <Ghim key={i} lon={lo} lat={la} f={f} at={2 + i} kind="lua" tat={i === 0 ? 20 : undefined} />)}
    <Ghim lon={20} lat={48} f={f} at={26} kind="cham" color="#3dff8e" />
  </DiaCau></Stage>; };
export const DiaCauComps: React.FC = () => <>
  <Composition id="dia-cau-ghim-lua-thap" component={LuaThapThu} width={1280} height={720} fps={24} durationInFrames={48} />
  <Composition id="dia-cau-song-lan" component={SongLanThu} width={1280} height={720} fps={24} durationInFrames={72} />
  <Composition id="dia-cau-duong-tau" component={DuongTauThu} width={1280} height={720} fps={24} durationInFrames={96} />
</>;
