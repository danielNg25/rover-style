import React from 'react';
import {AbsoluteFill, Composition, useVideoConfig, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Finish} from '../lib3/look';
import {StageCam, Motes} from '../lib3/kit';
import {EuropeMap, LatveriaMap, EUROPE, LATVERIA, euUV, mapEye} from '../lib3/kitBanDo';

/** GRAPHIC D of d1c2: the map of Europe (shot 5) and Latveria close up (shot 10). The sheets lie at the origin facing the
 *  lens; the camera is `mapEye(w, aspect, u, v, zoom)`. These compositions only show the graphic at rest (the shots move
 *  the camera themselves): ban-do-chau-au = the whole sheet with the ring, the word and the tent done (frame 66);
 *  ban-do-chau-au-zoom = 2.5 times in on Latveria (end of shot 5); ban-do-latveria = shot 10 done (frame 35). */
type V3 = [number, number, number];
export const MAP_W = 1.6;
const LAT_UV = euUV(EUROPE.latveria);
/** camera positions: whole Europe; the end of shot 5 (2.5x, Latveria a little left of centre so the word fits); shot 10 */
export const MAP_VIEWS = {
  europe: mapEye(MAP_W, EUROPE.aspect, 0.5, 0.5, 1),
  europeZoom: mapEye(MAP_W, EUROPE.aspect, LAT_UV[0] + 0.03, LAT_UV[1] - 0.01, 2.5),
  latveria: mapEye(MAP_W, LATVERIA.aspect, 0.5, 0.5, 1),
};
/** the stage for a map shot: the camera, a dark surround, the faint paper dust in the air */
export const MapStage: React.FC<{eye: V3; f: number; dx?: number; dz?: number; children: React.ReactNode}> = ({eye, f, dx, dz, children}) => (
  <>
    <StageCam eye={eye} haze="#2a2420" fog={[200, 900]} dx={dx} dz={dz} />
    <ambientLight intensity={1} />
    {children}
    <Motes f={f} box={[eye[0] - 0.4, eye[0] + 0.4, eye[1] - 0.22, eye[1] + 0.22, 0.05, eye[2] * 0.6]} n={10} color="#fff4dc" size={0.0016} glow={0} drift={0.03} seed={3} />
  </>
);
const Frame: React.FC<{children: React.ReactNode}> = ({children}) => { const {width, height} = useVideoConfig(); return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat gl={{antialias: true}}>{children}</ThreeCanvas></Finish></AbsoluteFill>; };
const Europe: React.FC = () => { const f = useCurrentFrame(); return <Frame><MapStage eye={MAP_VIEWS.europe} f={f}><EuropeMap f={f} w={MAP_W} /></MapStage></Frame>; };
const EuropeZoom: React.FC = () => { const f = useCurrentFrame(); return <Frame><MapStage eye={MAP_VIEWS.europeZoom} f={f}><EuropeMap f={f} w={MAP_W} /></MapStage></Frame>; };
const Latveria: React.FC = () => { const f = useCurrentFrame(); return <Frame><MapStage eye={MAP_VIEWS.latveria} f={f}><LatveriaMap f={f} w={MAP_W} /></MapStage></Frame>; };
export const BanDoLatveriaComps: React.FC = () => (
  <>
    <Composition id="ban-do-chau-au" component={Europe} width={1280} height={720} fps={24} durationInFrames={67} />
    <Composition id="ban-do-chau-au-zoom" component={EuropeZoom} width={1280} height={720} fps={24} durationInFrames={67} />
    <Composition id="ban-do-latveria" component={Latveria} width={1280} height={720} fps={24} durationInFrames={36} />
  </>
);
