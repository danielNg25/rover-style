import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import type {V3} from './math';
import {clamp} from './math';
import {CamPose, CamRig, assertCamMoves} from './camera';
import {StageCtx} from './shapes';
import {Liveness, checkLiveness} from './liveness';
import {AutoRecv} from '../lib3/kit';

/** kit/stage: the one wrapper of a shot. FINISH (bible 8, corrected): there is NO post-processing composer at
 *  all: no depth of field, no bloom, no grain. The picture is the antialiased flat render, crisp front to back.
 *  Blur exists only as <NearBlur> around one foreground object; glow only as <Glow> / <LightShaft>. */
export type Mood = 'dayInterior' | 'nightInterior' | 'dayExterior' | 'dusk' | 'nightExterior' | 'space';
type Light = {sky: string; ground: string; hemi: number; key: string; keyI: number; keyPos: V3; bg: string};
/** Lighting presets. Tuned for moderate brightness: a cream wall (#e9e2cf) lands near luma 150-160, not 190. */
export const MOODS: Record<Mood, Light> = {
  dayInterior: {sky: '#fff6e6', ground: '#d9cfc0', hemi: 2.36, key: '#fff0d8', keyI: 1.55, keyPos: [-6, 14, 10], bg: '#cfc6b0'},
  nightInterior: {sky: '#aab2dc', ground: '#5a5378', hemi: 2.09, key: '#ffd9a4', keyI: 1.35, keyPos: [5, 9, 9], bg: '#23233c'},
  dayExterior: {sky: '#f2f7ff', ground: '#cfd6b4', hemi: 2.50, key: '#fff2d2', keyI: 1.69, keyPos: [-8, 16, 9], bg: '#9fc4e4'},
  dusk: {sky: '#ffc7a0', ground: '#7a6890', hemi: 2.16, key: '#ffa873', keyI: 1.62, keyPos: [-12, 6, 6], bg: '#f0a274'},
  nightExterior: {sky: '#8fa0d8', ground: '#3a4066', hemi: 2.03, key: '#c4d0ff', keyI: 1.08, keyPos: [7, 14, 8], bg: '#1a1f44'},
  space: {sky: '#ffffff', ground: '#8a90b4', hemi: 2.03, key: '#fff8ea', keyI: 2.03, keyPos: [-9, 8, 10], bg: '#12142e'},
};

const isRig = (c: CamPose | CamRig): c is CamRig => typeof c === 'function';

// ---- colour of a LIT solid. Solids take the mood's light, flat cards do not: the same hex looks different on each.
const toLin = (hex: string) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const toHex = (v: number[]) => `#${new THREE.Color().setRGB(clamp(v[0]), clamp(v[1]), clamp(v[2])).getHexString()}`;
const FACES: Record<'front' | 'top' | 'left' | 'right', V3> = {front: [0, 0, 1], top: [0, 1, 0], left: [-1, 0, 0], right: [1, 0, 0]};
const lightOn = (mood: Mood, face: keyof typeof FACES | V3, light: number) => {
  const L = MOODS[mood], n = typeof face === 'string' ? FACES[face] : face, sky = toLin(L.sky), gr = toLin(L.ground), key = toLin(L.key);
  const kl = Math.hypot(...L.keyPos), nl = Math.max(0, (n[0] * L.keyPos[0] + n[1] * L.keyPos[1] + n[2] * L.keyPos[2]) / kl), w = 0.5 + 0.5 * n[1];
  return [0, 1, 2].map((i) => ((gr[i] + (sky[i] - gr[i]) * w) * L.hemi + key[i] * L.keyI * nl) * light / Math.PI);
};
/** The colour a LIT solid of colour `hex` shows on one face under a mood (face: 'front' = toward the camera, 'top',
 *  'left', 'right', or a normal). Give this to a flat card that must match a solid next to it. */
export const litColor = (mood: Mood, hex: string, face: keyof typeof FACES | V3 = 'front', light = 1) => { const k = lightOn(mood, face, light), a = toLin(hex); return toHex(a.map((v, i) => v * k[i])); };
/** The reverse: the colour to GIVE a lit solid so that its face shows `want` under a mood. A night mood darkens and
 *  blues a solid a lot (nightExterior shows '#8a5a40' as '#3e2a28'): either pass solidFor(mood, want), or make the
 *  prop `unlit` so it shows exactly the hex it is given. Colours brighter than the mood can reach come back clamped. */
export const solidFor = (mood: Mood, want: string, face: keyof typeof FACES | V3 = 'front', light = 1) => { const k = lightOn(mood, face, light), a = toLin(want); return toHex(a.map((v, i) => v / Math.max(1e-4, k[i]))); };
/** Wrap everything of a shot in this (inside a canvas: <StageCanvas>, shotComp(), or the existing ShotComp).
 *  cam   = a camera rig (camPush / camTruck / camHold ...). A static camera throws: pass len so it can be checked.
 *  mood  = lighting preset; bg overrides the preset's background colour; light scales the preset (0.8-1.2).
 *  shadows = 'none' (default: use <BlobShadow> under figures) or 'cast' (key light casts; then set cast on the few
 *  solids that should throw a shadow onto the FLOOR; never onto walls). */
export const Stage: React.FC<{cam: CamRig | CamPose; f: number; len: number; mood: Mood; bg?: string; light?: number; shadows?: 'none' | 'cast'; name?: string; camMax?: number; children: React.ReactNode}> =
  ({cam, f, len, mood, bg, light = 1, shadows = 'cast', name, camMax, children}) => {
    const {durationInFrames} = useVideoConfig();
    if (len <= 1 && durationInFrames > 1) throw new Error(`kit: ${name ?? 'shot'} passes len=${len} to <Stage> inside a ${durationInFrames}-frame composition. len is the real length of the shot; only a one-frame Still skips the camera and twos checks.`);
    useMemo(() => {
      if (len <= 1) return; // a Still composition: one frame, nothing to check
      if (!isRig(cam)) throw new Error(`kit: ${name ?? 'shot'} passes a fixed camera pose. Wrap it in a rig: cam={camPush(pose)} (or camHold for a held frame).`);
      assertCamMoves(cam, len, name, {max: camMax});
    }, [len, name, camMax]);
    const glows = useMemo(() => new Set<string>(), []), ctx = useMemo(() => ({f, len, glows}), [f, len, glows]);
    const {camera, scene} = useThree(), L = MOODS[mood], p = isRig(cam) ? cam(f) : cam, c = camera as THREE.PerspectiveCamera;
    c.position.set(...p.pos); c.fov = p.fov; c.near = 0.3; c.far = 600; c.up.set(0, 1, 0); c.lookAt(...p.look); if (p.roll) c.rotateZ((-p.roll * Math.PI) / 180); c.updateProjectionMatrix();
    scene.background = useMemo(() => new THREE.Color(bg ?? L.bg), [bg, L.bg]);
    return (
      <>
        <hemisphereLight args={[L.sky, L.ground, L.hemi * light]} />
        <directionalLight position={L.keyPos} intensity={L.keyI * light} color={L.key} castShadow={shadows === 'cast'}
          shadow-mapSize={[2048, 2048]} shadow-radius={8} shadow-blurSamples={16} shadow-bias={-0.0006} shadow-normalBias={0.03}
          shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={26} shadow-camera-bottom={-12} shadow-camera-near={1} shadow-camera-far={80} />
        <StageCtx.Provider value={ctx}>{children}</StageCtx.Provider>
      </>
    );
  };

/** The canvas for a stand-alone composition. vignette = corner darkening, clamped to 0.05 (default 0). */
export const StageCanvas: React.FC<{bg?: string; vignette?: number; children: React.ReactNode}> = ({bg = '#000', vignette = 0, children}) => {
  const {width, height} = useVideoConfig(), v = clamp(vignette, 0, 0.05);
  return (
    <AbsoluteFill style={{background: bg}}>
      <ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv />{children}</ThreeCanvas>
      {v > 0 ? <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 62%, rgba(0,0,0,${v}) 100%)`, pointerEvents: 'none'}} /> : null}
    </AbsoluteFill>
  );
};

/** A shot written with the kit. Same shape as src/shots/types ShotDef (so it also fits the old registries), plus
 *  the REQUIRED liveness declaration. Scene must return one <Stage>. */
export type KitShot = {id: string; len: number; bg?: string; Scene: React.FC<{f: number; t: number}>; liveness: Liveness};
/** Turns a KitShot into a Remotion component: <Composition component={shotComp(MY_SHOT)} durationInFrames={MY_SHOT.len} .../>
 *  The composition refuses to render (it throws, with the list) while the shot fails checkLiveness. */
export const shotComp = (shot: KitShot): React.FC => () => {
  const frame = useCurrentFrame(), f = clamp(frame, 0, shot.len - 1);
  const bad = useMemo(() => checkLiveness(shot.liveness, shot.len), []);
  if (bad.length) throw new Error(`kit: shot ${shot.id} fails the liveness contract (bible 7.2): ${bad.join('; ')}`);
  return <StageCanvas bg={shot.bg}><shot.Scene f={f} t={shot.len > 1 ? f / (shot.len - 1) : 0} /></StageCanvas>;
};
