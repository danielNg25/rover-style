import React from 'react';
import {Still, Composition, AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {ThroneHall} from './sets/ThroneHall';
import {SvgRig, PartPose} from './three/SvgRig';
import {doomRig} from './chars/doom';
import {humanRig} from './chars/human';
import {Post} from './three/Post';
import {Glow, Speck} from './three/prims';
import {ImageCard} from './three/ImageCard';
import {ImageRig, rigPoint} from './three/ImageRig';
import {doomImgRig, doomHands, facePose, FACE, FACE0, HAND_CENTRE} from './chars/doomImg';

import {Cam, Lights, V3} from './three/stage';
import {HallSeq, HALL_SEQ_FRAMES} from './HallSeq';
import {ShotComp} from './shots/ShotComp';
import {Full, FULL_FRAMES} from './Full';
import {SHOTS_A} from './shots/registry-a';
import {SHOTS_B} from './shots/registry-b';
import {SHOTS_C} from './shots/registry-c';
import {SHOTS_D} from './shots/registry-d';
import {KitDemoComps} from './demo/KitDemo';
import {PuppetDemoComps} from './demo/PuppetDemo';
import {TemplateDemoComps} from './demo/TemplateDemo';
import {TrialComps} from './demo/_trial/TrialShot';
import {TestCharComps} from './demo/_trial/TestChar';
import {DoomBComps} from './episodes/doom-b';
import {DoomBArtComps} from './episodes/doom-b/art';
import {Lit3DComps} from './demo/Lit3D';
import {ShadowTestComps} from './demo/ShadowTest';
import {MouldTestComps} from './demo/MouldTest';
import {MouldCanvasComps} from './demo/MouldCanvas';
import {GraveTestComps} from './demo/GraveTest';
import {Lib3MatchComps} from './demo/Lib3Match';
import {MarketSeqComps} from './demo/MarketSeq';
import {EpisodeComps} from './episodes';
import {ValleyComps} from './demo/Valley';
import {CampComps} from './demo/Camp';
import {VillageComps} from './demo/Village';
import {LabComps} from './demo/Lab';
import {BenhXaComps} from './demo/BenhXa';
import {CampusComps} from './demo/Campus';
import {TeslaShotsXComps} from './demo/TeslaShotsX';
import {CatalogComps} from './catalog/Catalog';
import {ClassroomComps} from './demo/Classroom';
import {StationComps} from './demo/Station';
import {NyStreetComps} from './demo/NyStreet';
import {ChicagoFairComps} from './demo/ChicagoFair';
import {HomeCornerComps} from './demo/HomeCorner';
import {TeslaShotsPHComps} from './demo/TeslaShotsPH';
import {TeslaShotsHCComps} from './demo/TeslaShotsHC';
import {ForgeComps} from './demo/Forge';
import {ThuBuiNguonComps} from './demo/ThuBuiNguon';
import {SanhNgaiComps} from './demo/SanhNgai';
// Composition của các kênh (cảnh quay từng tập) nằm ở cutout3d/kenh/; danh sách kênh ở kenh/index.tsx.
import {LeuThayLangComps} from './demo/LeuThayLang';
import {PhongNguComps} from './demo/PhongNguNamTuoc';
import {BanDoLatveriaComps} from './demo/BanDoLatveria';
import {DoHoaGiayComps} from './demo/DoHoaGiay';
import {DiaCauComps} from './demo/DiaCau';
import {CoiLuaComps} from './demo/CoiLua';
import {NuiTuyetComps} from './demo/NuiTuyet';
import {DienHocComps} from './demo/DienHoc';
import {QuangTruongComps} from './demo/QuangTruong';
import {HamMayDoomComps} from './demo/HamMayDoom';
import {Lo1517DoComps} from './demo/Lo1517Do';
import {VuTruComps} from './demo/VuTru';
import {TrenMayComps} from './demo/TrenMay';
import {BattleworldComps} from './demo/Battleworld';
import {ThuKieuMayComps} from './demo/ThuKieuMay';
import {KhoiTuAnhThuComps} from './thu/KhoiTuAnhThu';
import {PhoNewYorkComps} from './demo/PhoNewYork';
import {PhongReedComps} from './demo/PhongReed';
import {QuanAnComps} from './demo/QuanAn';
export const NEW_SHOTS = [...SHOTS_A, ...SHOTS_B, ...SHOTS_C, ...SHOTS_D];

type Shot = {arms: Record<string, PartPose>; hand: 'L' | 'R'; cam: {pos: V3; look: V3; fov: number}; doom: V3; doomPose: Record<string, PartPose>; glow: V3; blur: number; queen: boolean};
// pose helpers: arm down = default; `open*`/`fist*` hand variants toggled with hide
const HANDS_DOWN = {openL: {hide: true}, openR: {hide: true}};
export const SHOTS: Record<string, Shot> = {
  wide: {
    cam: {pos: [0.25, 2.65, 7.6], look: [0.25, 2.5, -6], fov: 28},
    arms: {armL: {rot: 62}, foreL: {rot: 76}, armR: {rot: -34}, foreR: {rot: -18}}, hand: 'L',
    doom: [-1.2, 0.9, -4.7], queen: true, blur: 0.25, glow: [-1.98, 2.45, -4.6],
    doomPose: {...HANDS_DOWN, openL: {}, fistL: {hide: true}, armL: {rot: 70}, foreL: {rot: 130}, armR: {rot: -18}, foreR: {rot: -10}},
  },
  medium: {
    cam: {pos: [-1.2, 2.0, 9.95], look: [-1.2, 2.03, -6], fov: 28},
    arms: {armR: {rot: -90}, foreR: {rot: -50}, armL: {rot: 30}, foreL: {rot: 16}}, hand: 'R',
    doom: [-1.2, 0, 5.7], queen: false, blur: 0.55, glow: [-0.18, 1.52, 5.8],
    doomPose: {...HANDS_DOWN, openR: {}, fistR: {hide: true}, armR: {rot: -60}, foreR: {rot: -105}, armL: {rot: 14}, foreL: {rot: 8}},
  },
};

export const HallShot: React.FC<{shot: keyof typeof SHOTS; gen?: boolean}> = ({shot, gen}) => {
  const {width, height} = useVideoConfig();
  const s = SHOTS[shot];
  return (
    <AbsoluteFill style={{background: '#1c2271'}}>
      <ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>
        <Cam {...s.cam} />
        <Lights />
        <Post focus={[s.doom[0], s.doom[1] + 2, s.doom[2]]} blur={s.blur} />
        <ThroneHall frontColumns={shot === 'medium'} />
        {gen ? (() => {
          const pose = {...doomHands(s.hand === 'L' ? 'glow' : 'fist', s.hand === 'R' ? 'glow' : 'fist'), ...facePose({...FACE0, turn: s.hand === 'L' ? -0.6 : 0.6, px: s.hand === 'L' ? -0.6 : 0.6}), ...s.arms};
          const rig = doomImgRig;
          const g = rigPoint(rig, pose, `glow${s.hand}`, HAND_CENTRE[s.hand], 2.9, s.doom);
          return (<>
            <ImageRig rig={rig} worldHeight={2.9} pos={s.doom} pose={pose} />
            <Glow pos={g} r={0.46} color={'#7dffa0'} strength={0.85} />
            {[[0.5, 0.4], [-0.45, 0.2], [0.3, -0.5], [-0.6, -0.35], [0.75, -0.1], [0.1, 0.7]].map(([x, y], i) => <Speck key={i} pos={[g[0] + x, g[1] + y, g[2] + 0.05]} s={0.035 + (i % 3) * 0.015} color={'#b6ffc4'} />)}
          </>);
        })() : (<>
          <SvgRig rig={doomRig('angry', shot === 'wide' ? 'L' : 'R')} worldHeight={2.9} pos={s.doom} pose={s.doomPose} />
          <Glow pos={s.glow} r={0.42} color={'#7dffa0'} strength={0.9} />
          {[[0.5, 0.4], [-0.45, 0.2], [0.3, -0.5], [-0.6, -0.35], [0.75, -0.1], [0.1, 0.7]].map(([x, y], i) => <Speck key={i} pos={[s.glow[0] + x, s.glow[1] + y, s.glow[2] + 0.05]} s={0.035 + (i % 3) * 0.015} color={'#b6ffc4'} />)}
        </>)}
        {s.queen && gen ? <ImageCard src="queen/q-1.png" height={3.0} pos={[2.75, 0.9, -5.3]} /> : null}
        {s.queen && !gen ? <SvgRig rig={humanRig({hair: '#e8cf7a', hairStyle: 'long', top: '#f4f1e8', topDark: '#d8d2c2', dress: '#f4f1e8', shoes: '#b9c0cc', crown: true, puff: true, clasp: true, eye: '#5f7fa6', cape: '#d6d3cb', mood: 'sad'})} worldHeight={3.05} pos={[2.75, 0.9, -5.3]} /> : null}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const RigPreview: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#e9e4d6'}}>
      <ThreeCanvas width={width} height={height} flat gl={{antialias: true}}>
        <Cam pos={[0, 1.5, 9]} look={[0, 1.5, 0]} fov={28} />
        <ImageRig rig={doomImgRig} worldHeight={2.9} pos={[-2.6, 0, 0]} pose={{...doomHands(), ...facePose(FACE0)}} />
        <ImageRig rig={doomImgRig} worldHeight={2.9} pos={[0, 0, 0]} pose={{...doomHands('fist', 'glow'), ...facePose({...FACE0, ...FACE.neutral, turn: 0.8, px: 0.8} as any), armR: {rot: -60}, foreR: {rot: -105}, armL: {rot: 14}, foreL: {rot: 8}}} />
        <ImageRig rig={doomImgRig} worldHeight={2.9} pos={[2.6, 0, 0]} pose={{...doomHands('open', 'fist'), ...facePose({...FACE0, ...FACE.sad, turn: -0.8, px: -0.6, py: 0.6} as any), armL: {rot: 58}, foreL: {rot: 104}, armR: {rot: -18}, foreR: {rot: -10}}} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

/** Danh sách composition của phần chung, cộng với của MỘT kênh (hoặc mọi kênh) truyền vào. Mỗi kênh có file vào riêng
 *  `kenh/<kênh>/entry.ts` gọi RootOf(<comps của kênh>): code của kênh khác không nằm trong gói dựng của kênh này. */
export const RootOf = (Kenh: React.FC): React.FC => () => (
  <>
    <Composition id="full" component={Full} width={1280} height={720} fps={24} durationInFrames={FULL_FRAMES} />
    <Composition id="hall-seq" component={HallSeq} width={1280} height={720} fps={24} durationInFrames={HALL_SEQ_FRAMES} />
    {NEW_SHOTS.map((sh) => <Composition key={sh.id} id={`shot-${sh.id}`} component={ShotComp} width={1280} height={720} fps={24} durationInFrames={sh.len} defaultProps={{shot: sh}} />)}
    <KitDemoComps />
    <PuppetDemoComps />
    <TemplateDemoComps />
    <TrialComps />
    <TestCharComps />
    <DoomBComps />
    <DoomBArtComps />
    <Still id="rig-doom" component={RigPreview} width={1920} height={1080} />
    {(['wide', 'medium'] as const).map((k) => (
      <React.Fragment key={k}>
        <Still id={`hall-${k}`} component={HallShot} width={1920} height={1080} defaultProps={{shot: k}} />
        <Still id={`gen-${k}`} component={HallShot} width={1920} height={1080} defaultProps={{shot: k, gen: true}} />
      </React.Fragment>
    ))}
    <Lit3DComps />
    <ShadowTestComps />
    <MouldTestComps />
    <MouldCanvasComps />
    <GraveTestComps />
    <Lib3MatchComps />
    <MarketSeqComps />
    <EpisodeComps />
    <ValleyComps />
    <CampComps />
    <VillageComps />
    <LabComps />
    <BenhXaComps />
    <CampusComps />
    <TeslaShotsXComps />
    <CatalogComps />
    <ClassroomComps />
    <StationComps />
    <NyStreetComps />
    <ChicagoFairComps />
    <HomeCornerComps />
    <TeslaShotsPHComps />
    <TeslaShotsHCComps />
    <ForgeComps />
    <ThuBuiNguonComps />
    <SanhNgaiComps />
    <Kenh />
    <LeuThayLangComps />
    <PhongNguComps />
    <BanDoLatveriaComps />
    <DoHoaGiayComps />
    <DiaCauComps />
    <CoiLuaComps />
    <NuiTuyetComps />
    <DienHocComps />
    <QuangTruongComps />
    <HamMayDoomComps />
    <Lo1517DoComps />
    <PhoNewYorkComps />
    <PhongReedComps />
    <QuanAnComps />
    <VuTruComps />
    <TrenMayComps />
    <BattleworldComps />
    <ThuKieuMayComps />
    <KhoiTuAnhThuComps />
  </>
);
