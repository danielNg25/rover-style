import React from 'react';
import {Poly, Disc, Rect, Stroke, Arc, Puff, track, trackStep, idle, twos, deg} from '../../../../kit';
import type {Pt} from '../../../../kit';
import {Fx, pen} from './set';

/* CAMP FOLK of S7: two flat cut-paper figures drawn in code (no sprites), in the boy's finish: flat tone blocks,
 * no outlines, small separated eyes, a visible neck, head about 1 : 2.2 of the body. Both are turned three-quarter
 * toward the fire at their screen left and carry a flat warm tone on the fire side.
 * Units: layer pixels, origin = the point on the ground between the feet, y up; each stands about 140 px tall.
 * Every moving value comes from track / trackStep / idle / twos(f): they act on twos. */
const WARM = '#f2b673', SKIN = '#e6b594', SKIN2 = '#c99480', EYE = '#f4ecdc', INK = '#2c2430';

/** Folk A: the old man at the pot, stirring it with a ladle. On 'camp' (leanAt) he leans to the pot and back. */
export const FolkA: React.FC<{f: number; leanAt: number; back: number}> = ({f, leanAt, back}) => {
  // lean about the feet toward the pot (screen left): 7.5 degrees through one in-between, held, and back
  const lean = track(f, [[0, 0], [leanAt, 7.5], [back, 0]], 4);
  const nod = track(f, [[0, 0], [leanAt, 7], [back, 1]], 4) + idle(f, 21, 12) * 1.5;
  const stir = [0, 5, 9, 4][Math.floor(twos(f) / 4) % 4] + lean * 0.6;          // the ladle hand circles on twos
  const bob = idle(f, 5, 10) * 0.8;
  const look = f >= leanAt - 2 && f < back ? -1.2 : 0;
  const g = pen(), h = pen(), a = pen();
  // boots (toes to the fire), trousers
  g.poly([[-19, 0], [-17, 6], [-4, 9], [-3, 0]], INK).poly([[0, 0], [1, 9], [13, 9], [14, 0], [-3, 0]], '#3a3038');
  g.rect(-9, 22, 11, 30, '#4b3d42').rect(7, 22, 11, 30, '#3f3338');
  // long coat: main tone, the side away from the fire a step darker, a flat warm tone on the fire side
  g.poly([[-18, 30], [-21, 68], [-16, 92], [-7, 98], [9, 98], [17, 92], [20, 66], [18, 30]], '#75764f');
  g.poly([[5, 30], [7, 98], [9, 98], [17, 92], [20, 66], [18, 30]], '#5c5e44');
  g.poly([[-18, 30], [-21, 68], [-16, 92], [-11, 95], [-15, 68], [-12, 30]], '#c8a45e');
  g.poly([[-18, 30], [-16, 38], [18, 38], [18, 30]], '#5c5e44');                                   // hem band
  g.rect(-1, 60, 39, 4.5, '#3a2f33').rect(-6, 60, 6, 6, '#c9a14e');                               // belt and buckle
  g.poly([[-3, 98], [-1, 62], [1, 62], [3, 98]], '#5c5e44');                                       // coat front seam
  // far arm, hanging behind
  g.line([[12, 90], [17, 74], [15, 58]], 8, '#5c5e44').disc(15, 55, 4.2, SKIN2);
  // scarf round the neck
  g.poly([[-13, 92], [-9, 101], [6, 102], [12, 94], [6, 90], [-6, 89]], '#a2584a').poly([[-10, 92], [-14, 76], [-7, 74], [-5, 91]], '#8a4a40');
  // head (three-quarter toward the fire): skin, grey hair at the back, beard, cap, small separated eyes
  h.disc(0, 0, 20, SKIN).poly([[4, -19], [14, -14], [20, -2], [18, 10], [12, 4], [10, -8]], SKIN2);
  h.disc(13, -1, 4.5, SKIN2);                                                                      // ear
  h.poly([[9, 12], [19, 8], [21, -4], [16, -12], [13, -4], [15, 4]], '#aeb2c4');                   // hair behind the ear
  h.poly([[-19, -2], [-18, -14], [-11, -24], [0, -27], [9, -22], [13, -12], [12, -2], [5, -7], [-4, -8], [-12, -6]], '#c9ccd9');
  h.poly([[0, -27], [9, -22], [13, -12], [12, -2], [5, -7], [3, -16]], '#aeb2c4');
  h.poly([[-21, 8], [-20, 17], [-10, 23], [6, 23], [16, 17], [18, 9], [6, 12], [-8, 12]], '#4d4250');   // fur cap
  h.poly([[-22, 6], [-21, 11], [-8, 14], [8, 14], [19, 11], [19, 6], [6, 9], [-8, 9]], '#6a5a68');
  h.put((z) => <group position={[0, 0, z]}><Arc r1={16.5} r2={20} a0={150} a1={215} color={WARM} /></group>);
  h.disc(-12, 2, 4.4, EYE, 1.2).disc(-1, 2, 4.4, EYE, 1.2).disc(-12.8 + look * 0.5, 1.2 + look, 2.1, INK).disc(-1.8 + look * 0.5, 1.2 + look, 2.1, INK);
  h.line([[-17, 8.5], [-8, 7.5]], 2.2, '#8a8d9e').line([[-5, 7.5], [4, 8.5]], 2.2, '#8a8d9e');     // brows
  h.disc(-8, -4, 3.6, '#d99a84');                                                                  // nose
  // near arm: shoulder to the ladle hand, the ladle reaching into the pot
  const hand: Pt = [-36 - stir * 0.5, 88 - stir * 0.6], tip: Pt = [-70, 80 - stir * 0.5];
  a.line([[-9, 91], [-22, 80], hand], 8.5, '#75764f').line([[-9, 91], [-22, 80]], 8.5, '#868758');
  a.line([hand, tip], 2.6, INK).disc(tip[0], tip[1] - 1, 4, INK, 0.7).disc(hand[0], hand[1], 4.6, SKIN);
  return (
    <group rotation={[0, 0, deg(lean)]}>
      <group position={[0, bob, 0]}>
        {g.out}
        <group position={[-3, 113, 6]} rotation={[0, 0, deg(nod)]}>{h.out}</group>
        <group position={[0, 0, 10]}>{a.out}</group>
      </group>
    </group>
  );
};

/** Folk B: the woman warming her hands at the fire. At stampAt she pulls her arms in and stamps twice against the
 *  cold (up, squash on landing, twice, with a small snow puff at each landing), then holds her hands out again. */
export const FolkB: React.FC<{f: number; stampAt: number; snow: string}> = ({f, stampAt, snow}) => {
  const s = stampAt;
  const hopY = trackStep(f, [[0, 0], [s, 8], [s + 2, 0], [s + 4, 8], [s + 6, 0]]);
  const sq = trackStep(f, [[0, 0], [s - 2, 0.05], [s, -0.05], [s + 2, 0.1], [s + 4, -0.05], [s + 6, 0.1], [s + 8, 0.03], [s + 10, 0]]);
  const hug = f >= s - 2 && f < s + 16;
  const tilt = trackStep(f, [[0, 0], [s - 2, 4], [s + 8, 2], [s + 16, 0]]) + idle(f, 33, 12) * 1.5;
  const bob = idle(f, 9, 10) * 0.8, shiver = hug ? (Math.floor(f / 2) % 2 ? 0.7 : -0.7) : 0;
  const g = pen(), h = pen(), a = pen();
  // boots, long skirt (shade side, hem stripe, warm fire side)
  g.poly([[-16, 0], [-14, 6], [-3, 7], [-2, 0]], INK).poly([[1, 0], [2, 7], [12, 7], [13, 0]], '#3a3038');
  g.poly([[-21, 3], [-15, 54], [13, 54], [21, 3]], '#96504c').poly([[6, 3], [5, 54], [13, 54], [21, 3]], '#7a4044');
  g.poly([[-21, 3], [-15, 54], [-10, 54], [-15, 3]], '#d58f58');
  g.poly([[-21, 3], [-20, 10], [20, 10], [21, 3]], '#d9cfc0').poly([[6, 3], [6, 10], [20, 10], [21, 3]], '#b9b0a8');
  // blouse and a wrap over the shoulders
  g.poly([[-15, 52], [-17, 80], [-10, 92], [9, 92], [15, 82], [13, 52]], '#d9cfc0').poly([[5, 52], [6, 92], [9, 92], [15, 82], [13, 52]], '#b9b0a8');
  g.poly([[-19, 72], [-11, 95], [10, 95], [18, 76], [11, 66], [0, 74], [-11, 66]], '#56688f').poly([[2, 73], [10, 95], [18, 76], [11, 66]], '#46567a');
  g.poly([[-19, 72], [-11, 95], [-7, 94], [-14, 73], [-11, 66]], '#b9945e');
  g.rect(-1, 55, 29, 4, '#3a2f33');
  // head: skin, headscarf tied under the chin, a little hair at the brow, small eyes, cold-pink cheeks
  h.disc(0, 0, 19, SKIN).poly([[5, -18], [14, -12], [19, 0], [15, 10], [11, 2], [9, -8]], SKIN2);
  h.poly([[-19, 3], [-17, 14], [-8, 22], [6, 21], [16, 13], [20, 0], [18, -12], [12, -18], [12, -6], [13, 4], [6, 13], [-8, 14], [-15, 9]], '#4f6aa3');
  h.poly([[6, 21], [16, 13], [20, 0], [18, -12], [12, -18], [12, -6], [13, 4], [6, 13]], '#3f5786');
  h.poly([[-15, 9], [-8, 14], [6, 13], [9, 9], [-2, 10], [-12, 6]], '#5a3a2c');                    // hair under the scarf
  h.poly([[-7, -17], [-2, -22], [5, -20], [3, -27], [-3, -30], [-8, -25]], '#4f6aa3');             // knot and tail
  h.put((z) => <group position={[0, 0, z]}><Arc r1={15.5} r2={19} a0={160} a1={225} color={WARM} /></group>);
  h.disc(-11, 0, 4.2, EYE, 1.2).disc(0, 0, 4.2, EYE, 1.2).disc(-12, -0.6, 2, INK).disc(-1, -0.6, 2, INK);
  h.line([[-15, 6], [-8, 7.5]], 1.8, '#5a3a2c').line([[-3, 7.5], [4, 6]], 1.8, '#5a3a2c');
  h.disc(-6.5, -5, 2.6, '#d99a84').disc(-14, -7, 3, '#e3988e').disc(4, -7, 3, '#e3988e');
  h.line([[-8, -11], [-3, -11]], 1.8, '#8a4a40');
  // arms: held out to the fire, or hugged across the chest
  if (hug) {
    a.line([[-13, 88], [-15, 72], [6, 70]], 8, '#d9cfc0').line([[11, 88], [14, 74], [-8, 76]], 8, '#b9b0a8');
    a.disc(8, 70, 4.4, SKIN).disc(-10, 76, 4.4, SKIN2);
  } else {
    a.line([[10, 88], [-6, 78], [-27, 80]], 8, '#b9b0a8').disc(-30, 81, 4.4, SKIN2);
    a.line([[-11, 88], [-22, 76], [-35, 73]], 8, '#d9cfc0').disc(-38, 73.5, 4.6, SKIN).poly([[-40, 78], [-36, 79], [-35, 68], [-39, 68]], SKIN);
  }
  return (
    <>
      <group position={[shiver, hopY + bob, 0]} scale={[1 + sq * 0.5, 1 - sq, 1]}>
        {g.out}
        <group position={[-2, 110, 6]} rotation={[0, 0, deg(tilt)]}>{h.out}</group>
        <group position={[0, 0, 10]}>{a.out}</group>
      </group>
      {[s + 2, s + 6].map((f0) => <group key={f0} position={[-2, 2, 14]}><Fx><Puff pos={[0, 0, 0]} f={f} f0={f0} dur={8} r={17} count={5} color={snow} seed={f0} /></Fx></group>)}
    </>
  );
};
