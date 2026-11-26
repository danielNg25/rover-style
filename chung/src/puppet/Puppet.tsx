import React, {useContext, useMemo} from 'react';
import * as THREE from 'three';
import {BlobShadow, StageCtx, useTextures, clamp} from '../kit';
import type {V3} from '../kit';
import type {Pose, PuppetRig} from './types';
import {solveView, PIECE_Z} from './pose';

const srcsOf = (rig: PuppetRig, out = new Set<string>()): Set<string> => {
  Object.values(rig.pieces).forEach((p) => { if (p.src) out.add(p.src); });
  Object.values(rig.views ?? {}).forEach((v) => srcsOf(v, out));
  return out;
};
const shear = (deg: number) => new THREE.Matrix4().set(1, Math.tan((deg * Math.PI) / 180), 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

/** A flat cut-out puppet standing in the set. Origin = the point of the ground line under rig.centerX.
 *  rig    = a PuppetRig (src/chars/_lib/*). Its views are loaded too, so pose.view can swap without a hitch.
 *  pose   = IN A SHOT: A FUNCTION OF THE FRAME, pose={(f) => act(BEATS, f, {rig})} (add cycles with mix). The puppet
 *           calls it for this frame and the one before and THROWS when an odd frame differs from the even frame before
 *           it: characters move on twos (bible 8.5), so a per-frame tween or sine on a puppet cannot be rendered.
 *           A plain pose object is accepted only in a one-frame Still.
 *  pos    = where it stands; a function of the frame for a puppet that travels (glide(...)), checked the same way.
 *  height = world height of the figure; flip mirrors the whole puppet (it then faces the other way).
 *  shadow = one soft blob under the feet (default on; pass false for a puppet that is not on a floor).
 *  order  = draw order of the pieces (default 10; piece z is added, so one puppet uses about 10-30). Leave it alone:
 *           depth sorts puppets against the set, and see-through cards draw later by themselves (kit SEE_THROUGH). */
export const Puppet: React.FC<{rig: PuppetRig; pose?: Pose | ((f: number) => Pose); height: number; pos?: V3 | ((f: number) => V3); flip?: boolean; shadow?: boolean; tint?: string; order?: number}> =
  ({rig, pose = {}, height, pos: posIn = [0, 0, 0], flip, shadow = true, tint, order = 10}) => {
    const stage = useContext(StageCtx), tex = useTextures(useMemo(() => Array.from(srcsOf(rig)), [rig]));
    const moving = !!stage && stage.len > 1, f = stage?.f ?? 0;
    if (moving && typeof pose !== 'function') throw new Error(`puppet: ${rig.name} got a fixed pose in a moving shot. Pass a function of the frame, pose={(f) => act(BEATS, f, {rig})}, so the puppet can check that it moves on twos; a figure frozen in one pose fails liveness anyway.`);
    const cur = typeof pose === 'function' ? pose(f) : pose, pos = typeof posIn === 'function' ? posIn(f) : posIn;
    const {r, solved: {parts, root}} = solveView(rig, cur);
    if (moving && f % 2 === 1) {
      const was = typeof pose === 'function' ? solveView(rig, pose(f - 1)) : null;
      if (was && (was.r !== r || JSON.stringify(was.solved) !== JSON.stringify({parts, root}))) throw new Error(`puppet: ${rig.name} changes between frames ${f - 1} and ${f}. Characters move ON TWOS: build the pose from act() and the cycles (or feed twos(f) to your own formula); never tween or wobble a puppet per frame.`);
      if (typeof posIn === 'function' && posIn(f - 1).some((v, i) => v !== pos[i])) throw new Error(`puppet: ${rig.name} slides between frames ${f - 1} and ${f}. Move a puppet with glide(), which steps on twos.`);
    }
    if (!tex) return null;
    const names = Object.keys(r.pieces), s = height / r.height, fx = flip ? -1 : 1;
    const draw = (name: string, parentPivot: [number, number]): React.ReactNode => {
      const p = r.pieces[name], ps = parts[name] ?? {};
      if (ps.hide) return null;
      const t = p.src ? tex[p.src] : null, img = t?.image as HTMLImageElement | undefined;
      const hh = p.h ?? (img ? (p.w * img.height) / img.width : p.w);
      return (
        <group key={name} position={[(p.pivot[0] - parentPivot[0] + (ps.x ?? 0)) * s, -(p.pivot[1] - parentPivot[1] + (ps.y ?? 0)) * s, 0]}
          rotation={[0, 0, (-(ps.rot ?? 0) * Math.PI) / 180]} scale={[ps.sx ?? 1, ps.sy ?? 1, 1]}>
          <group matrixAutoUpdate={false} matrix={shear(ps.skew ?? 0)}>
            <mesh position={[(p.x + p.w / 2 - p.pivot[0]) * s, -(p.y + hh / 2 - p.pivot[1]) * s, p.z * PIECE_Z]} scale={[(p.mirror ? -1 : 1) * (t ? p.w * s : (p.w * s) / 2), t ? hh * s : (hh * s) / 2, 1]} renderOrder={order + p.z}>
              {t ? <planeGeometry args={[1, 1]} /> : p.shape === 'rect' ? <planeGeometry args={[2, 2]} /> : <circleGeometry args={[1, 40]} />}
              {t ? <meshBasicMaterial map={t} color={p.tint ?? tint ?? '#ffffff'} transparent alphaTest={0.04} side={THREE.DoubleSide} fog={false} />
                : <meshBasicMaterial color={p.fill ?? '#000000'} side={THREE.DoubleSide} fog={false} />}
            </mesh>
            {names.filter((n) => r.pieces[n].parent === name).map((k) => draw(k, p.pivot))}
          </group>
        </group>
      );
    };
    const sr = (r.shadow?.r ?? r.height * 0.3) * s * (1 - clamp(root.y / r.height, 0, 0.4)) * (1 + 0.5 * (root.sx - 1));
    return (
      <>
        {shadow ? <BlobShadow pos={[pos[0] + root.x * s * fx, pos[1] + 0.012, pos[2] + 0.04]} r={sr} sy={r.shadow?.sy ?? 0.4} /> : null}
        <group position={[pos[0] + root.x * s * fx, pos[1] + root.y * s, pos[2]]} scale={[fx * root.sx, root.sy, 1]}>
          {names.filter((n) => !r.pieces[n].parent).map((n) => draw(n, [r.centerX, r.groundY]))}
        </group>
      </>
    );
  };
