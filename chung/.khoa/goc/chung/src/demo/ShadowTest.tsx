import React from 'react';
import {AbsoluteFill, Still, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {ImageRig} from '../three/ImageRig';
import {doomImgRig, doomHands, facePose, FACE0} from '../chars/doomImg';
import {AutoRecv} from '../lib3/kit';

/** Shadow test: the flat picture puppet stands in a 3D set and ONE directional light casts its real shadow with the
 *  renderer's built-in shadow map. The pieces already carry castShadow and alphaTest, so the shadow has the
 *  puppet's outline and follows every pose. Two poses side by side to show the shadow changing with the arm. */
const Cam: React.FC = () => {
  const {camera} = useThree(); const c = camera as THREE.PerspectiveCamera;
  c.position.set(0, 4.6, 13.5); c.fov = 30; c.lookAt(0.4, 1.0, 0); c.updateProjectionMatrix();
  return null;
};
const base = {...doomHands('open', 'open'), ...facePose(FACE0)};
export const ShadowTest: React.FC<{real: boolean}> = ({real}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#bcd3e6'}}>
      <ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv />
        <Cam />
        <hemisphereLight args={['#ffffff', '#b9ab95', 1.55]} />
        <directionalLight position={[-7, 7, 3.5]} intensity={2.3} color={'#fff3df'} castShadow={real}
          shadow-mapSize={[2048, 2048]} shadow-radius={9} shadow-blurSamples={20} shadow-bias={-0.0005}
          shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={8} shadow-camera-bottom={-6} shadow-camera-near={1} shadow-camera-far={40} />
        {/* path and lawn, both take shadows; a low wall and a bench so props share the direction */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[80, 60]} /><meshLambertMaterial color={'#d9cfb8'} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -7]} receiveShadow><planeGeometry args={[80, 8]} /><meshLambertMaterial color={'#6fae62'} /></mesh>
        <mesh position={[0, 2.2, -11.2]} receiveShadow><planeGeometry args={[80, 4.6]} /><meshLambertMaterial color={'#b5563f'} /></mesh>
        <mesh position={[6.2, 0.45, 1.6]} castShadow receiveShadow><boxGeometry args={[1.9, 0.14, 0.6]} /><meshLambertMaterial color={'#6a4a32'} /></mesh>
        {[-0.8, 0.8].map((x) => <mesh key={x} position={[6.2 + x, 0.2, 1.6]} castShadow><boxGeometry args={[0.12, 0.4, 0.5]} /><meshLambertMaterial color={'#3a2c22'} /></mesh>)}
        <mesh position={[-6.6, 1.5, 1.2]} castShadow><cylinderGeometry args={[0.07, 0.09, 3, 8]} /><meshLambertMaterial color={'#2b2b30'} /></mesh>
        {!real ? [-3.6, 1.6].map((x) => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]} scale={[1, 0.3, 1]}><circleGeometry args={[1.0, 32]} /><meshBasicMaterial color={'#5a4d3c'} transparent opacity={0.28} /></mesh>) : null}
        <ImageRig rig={doomImgRig} worldHeight={2.9} pos={[-3.6, 0, 0]} pose={{...base, armL: {rot: 12}, foreL: {rot: 6}, armR: {rot: -12}, foreR: {rot: -6}}} />
        <ImageRig rig={doomImgRig} worldHeight={2.9} pos={[1.6, 0, 0]} pose={{...base, armL: {rot: 14}, foreL: {rot: 8}, armR: {rot: -105}, foreR: {rot: -40}}} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
export const ShadowTestComps: React.FC = () => (
  <>
    <Still id="shadow-real" component={ShadowTest} width={1280} height={720} defaultProps={{real: true}} />
    <Still id="shadow-blob" component={ShadowTest} width={1280} height={720} defaultProps={{real: false}} />
  </>
);
