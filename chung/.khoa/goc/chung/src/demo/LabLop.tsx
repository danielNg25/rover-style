// Tiện ích dựng cảnh quay trong phòng thí nghiệm theo lớp (bộ dựng nền mờ, người sắc, đồ gần mờ), khung ghi đè cho tấm kiểm,
// hướng nhìn theo màn hình, đặt người trong phòng xoay. Tách từ src/demo/DaiHoc.tsx ngày 23/11/2026 (các cảnh của đoạn
// "Victor ở đại học" dời về thư mục của kênh); TeslaShotsX.tsx và các cảnh của kênh dùng chung các hàm này.
import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Composition, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Finish, Halo} from '../lib3/look';
import {Motes, B, AutoRecv} from '../lib3/kit';
import {Puppet3} from '../mould/Puppet3';
import {act, blink} from '../mould/act';
import type {Key} from '../mould/act';
import type {Spec, Expr, ArmPose} from '../mould/draw';
import {Lab, LAB_VIEWS, LAB_MARKS, LAB_SPOTS, CALC_LINES} from './Lab';
import type {LabLayer, LabViewSpec} from './Lab';
import {SheetMarks, SoftShadow, tex, paintPlan} from '../lib3/kitLab';
export type V3 = [number, number, number];
export const W = 1280, H = 720;

/** The check sheets render several frames of a shot side by side: they override the frame through this context. */
export const FrameOv = createContext<number | null>(null);
export const useF = () => { const o = useContext(FrameOv), f = useCurrentFrame(); return o ?? f; };

// ---------------------------------------------------------------- helpers
/** Gaze written in SCREEN terms (x > 0 = towards screen right). The mould draws the pupils in its own space and a flipped
 *  figure is mirrored, so for a flipped figure the sign is turned. */
export const look = (flip: boolean, x: number, y: number): [number, number] => [flip ? -x : x, y];
/** Puppet3 adds spec.x along the ROOM's x axis, which in a turned room is not across the screen. So the figure's sideways
 *  travel (from act: walks, shifts, leans) is moved here along the screen's own sideways direction; depth = metres away from
 *  the lens (negative = towards it), for a walk that also comes closer. Returns the pos to give Puppet3 and the spec without x. */
export const place = (yaw: number, at: V3, s: Spec, height: number, flip: boolean, depth = 0) => {
  const lat = (s.x ?? 0) * (height / 1191) * (flip ? -1 : 1), c = Math.cos(yaw), sn = Math.sin(yaw);
  return {pos: [at[0] + c * lat + sn * depth, at[1], at[2] + sn * lat - c * depth] as V3, spec: {...s, x: 0}};
};
export const Fig: React.FC<{v: LabViewSpec; at: V3; spec: Spec; height: number; flip?: boolean; depth?: number; lift?: number}> = ({v, at, spec, height, flip = false, depth = 0, lift}) => {
  const p = place(v.yaw, at, spec, height, flip, depth);
  return <Puppet3 height={height} pos={p.pos} rotY={-v.yaw} spec={p.spec} flip={flip} lift={lift} />;
};
export const arm = (sh: number, el: number, hand: ArmPose['hand'] = 'open', wrist = 0): ArmPose => ({sh, el, hand, wrist});

type LabArgs = {view: LabViewSpec | 'machine'; f: number; dx?: number; dz?: number; machine?: React.ComponentProps<typeof Lab>['machine']; extra?: React.ReactNode};
export const Canvas: React.FC<{children: React.ReactNode; alpha?: boolean}> = ({children, alpha}) => <ThreeCanvas width={W} height={H} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true, alpha: !!alpha}}><AutoRecv />{children}</ThreeCanvas>;
/** One shot in the lab. soft = blur of the set in pixels (0 = one sharp picture); fg = a near prop drawn on its own
 *  canvas blurred by fgSoft. */
export const LabShot: React.FC<{lab: LabArgs; figures?: React.ReactNode; soft?: number; fg?: React.ReactNode; fgSoft?: number}> = ({lab, figures, soft = 0, fg, fgSoft = 4}) => {
  const L = (layer: LabLayer, kids?: React.ReactNode) => <Lab view={lab.view} f={lab.f} dx={lab.dx} dz={lab.dz} machine={lab.machine} extra={lab.extra} fg={fg} layer={layer}>{kids}</Lab>;
  if (!soft && !fg) return <AbsoluteFill><Finish warm=""><Canvas>{L('all', figures)}</Canvas></Finish></AbsoluteFill>;
  return (
    <AbsoluteFill><Finish warm="">
      <AbsoluteFill style={soft ? {filter: `blur(${soft}px)`, transform: 'scale(1.012)'} : undefined}><Canvas>{L('back', figures)}</Canvas></AbsoluteFill>
      {figures ? <AbsoluteFill><Canvas alpha>{L('figures', figures)}</Canvas></AbsoluteFill> : null}
      {fg ? <AbsoluteFill style={{filter: `blur(${fgSoft}px)`}}><Canvas alpha>{L('front')}</Canvas></AbsoluteFill> : null}
    </Finish></AbsoluteFill>
  );
};
/** The dust in the lamp light. */
export const LampDust: React.FC<{f: number; n?: number; seed?: number}> = ({f, n = 18, seed = 5}) => {
  const b = LAB_SPOTS.deskBulb;
  return <Motes f={f} box={[b[0] - 0.5, b[0] + 0.7, 0.85, b[1] + 0.2, b[2] - 0.3, b[2] + 0.45]} n={n} color="#ffe2b0" size={0.008} drift={0.08} glow={0.22} seed={seed} />;
};

