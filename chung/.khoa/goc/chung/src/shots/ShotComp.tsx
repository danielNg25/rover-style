import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import type {ShotDef} from './types';
import {SHOTS_A} from './registry-a';
import {SHOTS_B} from './registry-b';
import {SHOTS_C} from './registry-c';
import {SHOTS_D} from './registry-d';
import {AutoRecv} from '../lib3/kit';

/** Wraps a ShotDef in a canvas so it can be rendered on its own (composition id = `shot-<id>`). */
export const ShotComp: React.FC<{shot: ShotDef; offset?: number}> = ({shot: given, offset = 0}) => {
  // props are serialized by the renderer, which drops the Scene function: look the shot up again by id
  const shot = [...SHOTS_A, ...SHOTS_B, ...SHOTS_C, ...SHOTS_D].find((s) => s.id === given.id) ?? given;
  const frame = useCurrentFrame() - offset; const {width, height} = useVideoConfig();
  const f = Math.max(0, Math.min(shot.len - 1, frame));
  return (
    <AbsoluteFill style={{background: shot.bg ?? '#000'}}>
      <ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv />
        <shot.Scene f={f} t={shot.len > 1 ? f / (shot.len - 1) : 0} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
