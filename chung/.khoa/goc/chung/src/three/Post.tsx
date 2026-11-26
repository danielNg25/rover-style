import React, {useEffect, useMemo} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {EffectComposer, RenderPass, EffectPass, DepthOfFieldEffect, BloomEffect, VignetteEffect, SMAAEffect} from 'postprocessing';

/** Finish stack: depth of field -> bloom on bright emissives -> vignette. */
export const Post: React.FC<{focus: [number, number, number]; blur?: number}> = ({focus, blur = 1}) => {
  const {gl, scene, camera, size} = useThree();
  const {composer, dof} = useMemo(() => {
    const composer = new EffectComposer(gl, {frameBufferType: THREE.HalfFloatType, multisampling: 4});
    composer.addPass(new RenderPass(scene, camera));
    const dof = new DepthOfFieldEffect(camera, {focusRange: 0.035, bokehScale: 3.2 * blur, resolutionScale: 0.6});
    const bloom = new BloomEffect({luminanceThreshold: 0.93, luminanceSmoothing: 0.05, intensity: 0.7, radius: 0.75, mipmapBlur: true});
    const vig = new VignetteEffect({offset: 0.32, darkness: 0.42});
    composer.addPass(new EffectPass(camera, dof));
    composer.addPass(new EffectPass(camera, bloom, vig, new SMAAEffect()));
    return {composer, dof};
  }, [gl, scene, camera, blur]);
  useEffect(() => { composer.setSize(size.width, size.height); }, [composer, size]);
  useFrame(() => {
    dof.target = new THREE.Vector3(...focus);
    composer.render();
  }, 1);
  return null;
};
