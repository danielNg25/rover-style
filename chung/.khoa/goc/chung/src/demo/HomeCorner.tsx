import React from 'react';
import {Composition, useCurrentFrame} from 'remotion';
import {GradeCtx} from '../lib3/look';
import {StageCam, Label, SineWave} from '../lib3/kit';
import {Spot, popScale} from '../lib3/kitLab';
import {Shot} from '../lib3/shot';
import {PaintedWall, WallCalendar, WallSocket, SOCKET, Cable, SideTable, DeskLamp, LAMP, TeaCup} from '../lib3/kitHomeCorner';

/** Set NHA of episodes/tesla-danh-sach-canh.md: the corner of a wall in a home today, for ONE insert (shot 14). One wall facing
 *  the camera, nothing else; the camera only pushes or pulls a little.
 *  Plan (metres; the wall is the plane z = 0, x right, y up): the frame at the standard camera is 1.4 m wide (x -0.7..0.7) and
 *  0.79 m high (y 0.6..1.4). The double socket at [-0.25, 1.2] (a third from the left, at an adult's hand), the plug in its
 *  right outlet; the cable sags from the plug to the table's left edge and along the table top to the lamp; the side table
 *  x -0.02..0.6, top at 0.72; the desk lamp at x 0.25 (a third from the right), its shade 1.03..1.2; the tea cup at x 0.5; the
 *  calendar's lower edge at the top left (y 1.25). Evening: a dim blue-grey room; a faint light picks out the socket. */
type V3 = [number, number, number];
export const HOME_EYE: V3 = [0, 1.0, 1.6];
export const HOME_SPOTS = {
  socket: [-0.25, 1.2, 0] as V3,
  lamp: [0.25, 0.72, 0.2] as V3,
  /** where "~ 220 V" can pop up: on the wall right of the socket, above the cable */
  label: [-0.04, 1.25, 0.014] as V3,
  /** the cable's path from the plug to the lamp's foot; the wave of shot 14 runs along exactly this */
  cable: [[-0.216, 1.165, 0.045], [-0.214, 1.08, 0.05], [-0.2, 0.96, 0.06], [-0.16, 0.86, 0.075], [-0.1, 0.79, 0.09], [-0.04, 0.765, 0.12], [-0.005, 0.735, 0.18], [0.04, 0.7245, 0.22], [0.12, 0.7245, 0.22], [0.175, 0.729, 0.21]] as V3[],
};
/** The wave of shot 14 is the shared SineWave (src/lib3/kit.tsx), which lies flat in a plane. It lies in the plane z = WAVE_Z,
 *  just in front of the cable, along the cable's path seen from the camera (each point of the cable pushed along its line of
 *  sight onto that plane), so on screen it runs exactly over the cord from the socket to the lamp. */
export const WAVE_Z = 0.25;
export const WAVE_PTS: [number, number][] = HOME_SPOTS.cable.map(([x, y, z]) => { const k = (HOME_EYE[2] - WAVE_Z) / (HOME_EYE[2] - z); return [HOME_EYE[0] + (x - HOME_EYE[0]) * k, HOME_EYE[1] + (y - HOME_EYE[1]) * k]; });
/** a light level that comes on at frame `at`, spreads over 6 frames with a small swell, then holds */
export const lampOn = (f: number, at: number) => (f < at ? 0 : f < at + 6 ? ((f - at + 1) / 6) * 1.15 : 1 + 0.15 * Math.exp(-(f - at - 6) / 3));
/** shot 14: dark until 6; the wave runs out of the socket along the cable 6-22; the lamp comes on at 22; "~ 220 V" pops at 30;
 *  the waves keep crawling along the cable to the end */
export const homeShot14 = (f: number) => ({
  wave: f < 6 ? null : {from: 0, to: Math.min(1, (f - 6) / 16), phase: f * 0.45},
  lamp: lampOn(f, 22),
  label: popScale(f, 30, 7, 0.3),
});

const Lights: React.FC<{lamp: number}> = ({lamp}) => (
  <>
    {/* evening: the blue-grey of a window somewhere to the left, very little of it */}
    <hemisphereLight args={['#7c8cc8', '#3a3632', 0.95 - 0.15 * Math.min(1, lamp)]} />
    <directionalLight position={[-2.5, 2.6, 3.2]} intensity={0.55} color="#aab6d8" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0008} shadow-camera-left={-2} shadow-camera-right={2} shadow-camera-top={2} shadow-camera-bottom={-1} shadow-camera-near={0.1} shadow-camera-far={10} />
    {/* the socket, subject of the insert, gets a faint light of its own */}
    <Spot from={[-0.7, 1.7, 1.3]} to={[-0.25, 1.18, 0]} color="#e8e4dc" intensity={1.4} angle={0.16} penumbra={0.9} distance={4} shadow />
  </>
);

/** f = frame; lamp = the desk lamp's level (lampOn); wave = the part of the cable the wave covers (null = none) */
export const HomeCorner: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; lamp?: number; wave?: {from: number; to: number; phase: number} | null; label?: number}> =
  ({children, f = 0, dx, dz, lamp = 0, wave = null, label = 0}) => (
    <GradeCtx.Provider value="darkInterior">
      <Lights lamp={lamp} />
      <StageCam eye={HOME_EYE} haze="#2a2c36" fog={[6, 30]} dx={dx} dz={dz} />
      <PaintedWall w={6} h={3} />
      <WallCalendar pos={[-0.56, 1.25, 0]} w={0.36} />
      <WallSocket pos={[HOME_SPOTS.socket[0], HOME_SPOTS.socket[1], 0]} plug={1} />
      <Cable pts={HOME_SPOTS.cable} />
      <SideTable pos={[0.29, 0, 0.012]} w={0.62} d={0.42} />
      <DeskLamp pos={HOME_SPOTS.lamp} on={lamp} f={f} />
      <TeaCup pos={[0.5, 0.72, 0.28]} />
      {wave ? <group position={[0, 0, WAVE_Z]}><SineWave pts={WAVE_PTS} progress={wave.to} phase={-wave.phase} amp={0.009} wave={0.048} width={0.0045} color="#3a8cff" emissive={1.2} order={9} /></group> : null}
      {label > 0 ? <group position={HOME_SPOTS.label} scale={[label, label, 1]}><Label text="~ 220 V" p={[0, 0, 0]} w={0.2} h={0.06} ink="#3a9bff" lit={false} /></group> : null}
      {children}
    </GradeCtx.Provider>
  );
void SOCKET; void LAMP;

const Plan: React.FC = () => { const f = useCurrentFrame(), p = homeShot14(f);
  return <Shot grade="darkInterior" eye={HOME_EYE} finish={{warm: ''}} set={(inside, cam) => <HomeCorner f={f} lamp={p.lamp} wave={p.wave} label={p.label} dx={cam.dx} dz={cam.dz}>{inside}</HomeCorner>} figures={null} />; };
const Lit: React.FC = () => { const f = useCurrentFrame();
  return <Shot grade="darkInterior" eye={HOME_EYE} finish={{warm: ''}} set={(inside, cam) => <HomeCorner f={f} lamp={1} wave={{from: 0, to: 1, phase: f * 0.45}} label={1} dx={cam.dx} dz={cam.dz}>{inside}</HomeCorner>} figures={null} />; };
export const HomeCornerComps: React.FC = () => <>
  <Composition id="nha-a" component={Plan} width={1280} height={720} fps={24} durationInFrames={60} />
  <Composition id="nha-sang" component={Lit} width={1280} height={720} fps={24} durationInFrames={60} />
</>;
