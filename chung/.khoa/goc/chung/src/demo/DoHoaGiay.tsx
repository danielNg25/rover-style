import React from 'react';
import {AbsoluteFill, Composition, useVideoConfig, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Finish} from '../lib3/look';
import {StageCam, Motes} from '../lib3/kit';
import {AtlanticMap, ATLANTIC, ATLANTIC_VIEWS, SHOT8_T, SHOT16_T, mapEye} from '../lib3/kitBanDo';
import {WoodDesk, Newspaper, InviteLetter, NotebookPage, ThoughtBubble, paperEye, NEWS} from '../lib3/kitGiayTo';
import {Puppet3} from '../mould/Puppet3';
import {BA_MAU, CAO_MAU} from '../mould/nguoi-mau';
import {EXPR} from '../mould/expr';

/** THE PAPER INSERTS of d1c5 at rest (made 23/11/2026; the shots move the camera themselves):
 *    ban-do-dai-tay-duong       the Europe-to-America map, shot 8 timing; frame 0 = the close start on Latveria, 55 = the
 *                               whole sheet with the route, the dot and both words (the camera eases from one to the other)
 *    ban-do-dai-tay-duong-tau   shot 16 timing on the whole sheet (frame 30 = the steamer half way)
 *    to-bao-cau-be-trong-leu    the newspaper on the desk, shot 10 timing (57 = done)
 *    thu-moi-nhap-hoc           the letter and its stamp, shot 11 timing (67 = done)
 *    trang-so-tay-hai-dong      the notebook page, shot 17 timing (80 = done)
 *    bong-bong-nghi-nguoi-mau   the thought bubble with the model woman in it (frame 30)
 *  The paper sheets stand at the origin facing the lens; `paperEye(h, share)` puts the camera so the sheet fills `share` of
 *  the frame height. MAP_W and the map views are those of the Europe map (BanDoLatveria.tsx). */
type V3 = [number, number, number];
export const MAP_W = 1.6;
/** the camera of shot 8 at frame f (0..56): eased from the close start to the whole sheet, slow at both ends */
export const shot8Eye = (f: number, len = 56): V3 => {
  const q = Math.min(1, Math.max(0, f / len)), e = q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2, A = ATLANTIC_VIEWS.latveria, B = ATLANTIC_VIEWS.whole;
  // zoom is eased in log space so the pull-out feels even
  const z = Math.exp(Math.log(A.zoom) + (Math.log(B.zoom) - Math.log(A.zoom)) * e);
  return mapEye(MAP_W, ATLANTIC.aspect, A.u + (B.u - A.u) * e, A.v + (B.v - A.v) * e, z);
};
/** the stage of a paper insert: the camera, a dark surround, a few motes of paper dust in the air */
export const PaperStage: React.FC<{eye: V3; f: number; dx?: number; dz?: number; children: React.ReactNode}> = ({eye, f, dx, dz, children}) => (
  <>
    <StageCam eye={eye} haze="#2a2420" fog={[200, 900]} dx={dx} dz={dz} />
    <ambientLight intensity={1} />
    {children}
    <Motes f={f} box={[eye[0] - eye[2] * 0.25, eye[0] + eye[2] * 0.25, eye[1] - eye[2] * 0.14, eye[1] + eye[2] * 0.14, 0.05, eye[2] * 0.6]} n={6} color="#fff4dc" size={eye[2] * 0.0007} glow={0} drift={0.03} seed={5} />
  </>
);
const Frame: React.FC<{children: React.ReactNode; lit?: boolean}> = ({children, lit}) => { const {width, height} = useVideoConfig(); return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat gl={{antialias: true}} shadows={lit ? {type: THREE.VSMShadowMap} : undefined}>{children}</ThreeCanvas></Finish></AbsoluteFill>; };

const Map8: React.FC = () => { const f = useCurrentFrame(); return <Frame><PaperStage eye={shot8Eye(f)} f={f}><AtlanticMap f={f} w={MAP_W} t={SHOT8_T} /></PaperStage></Frame>; };
const Map16: React.FC = () => { const f = useCurrentFrame(); return <Frame><PaperStage eye={mapEye(MAP_W, ATLANTIC.aspect, 0.5 - (0.04 * f) / 63, 0.5, 1.1)} f={f}><AtlanticMap f={f} w={MAP_W} t={SHOT16_T} /></PaperStage></Frame>; };
const News: React.FC = () => { const f = useCurrentFrame(); return <Frame><PaperStage eye={paperEye(1, 0.74, 0.02, -0.02)} f={f}><WoodDesk /><Newspaper f={f} h={1} /></PaperStage></Frame>; };
const Invite: React.FC = () => { const f = useCurrentFrame(); return <Frame><PaperStage eye={paperEye(1.44, 0.94)} f={f}><WoodDesk /><InviteLetter f={f} w={0.9} pos={[0, -0.418, 0]} /></PaperStage></Frame>; };
const Note: React.FC = () => { const f = useCurrentFrame(); return <Frame><PaperStage eye={paperEye(1, 0.92)} f={f}><WoodDesk /><NotebookPage f={f} h={1} /></PaperStage></Frame>; };
const Bubble: React.FC = () => { const f = useCurrentFrame(); return <Frame><PaperStage eye={[0, 0, 3]} f={f}><WoodDesk w={6} h={4} z={-0.5} />
  <ThoughtBubble f={f} at={0} pos={[0.25, 0.05, 0]} w={1.2} from={[-0.7, -0.5, 0]}>
    <Puppet3 spec={{...BA_MAU, expr: {...EXPR.happy}}} height={CAO_MAU.ba * 0.62} pos={[0, -0.68, 0]} order={645} lit={false} cast={false} />
  </ThoughtBubble></PaperStage></Frame>; };
void NEWS;

export const DoHoaGiayComps: React.FC = () => (
  <>
    <Composition id="ban-do-dai-tay-duong" component={Map8} width={1280} height={720} fps={24} durationInFrames={57} />
    <Composition id="ban-do-dai-tay-duong-tau" component={Map16} width={1280} height={720} fps={24} durationInFrames={64} />
    <Composition id="to-bao-cau-be-trong-leu" component={News} width={1280} height={720} fps={24} durationInFrames={58} />
    <Composition id="thu-moi-nhap-hoc" component={Invite} width={1280} height={720} fps={24} durationInFrames={68} />
    <Composition id="trang-so-tay-hai-dong" component={Note} width={1280} height={720} fps={24} durationInFrames={81} />
    <Composition id="bong-bong-nghi-nguoi-mau" component={Bubble} width={1280} height={720} fps={24} durationInFrames={40} />
  </>
);
