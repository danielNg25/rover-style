import React from 'react';
import {Poly, Disc, Stroke, track, twos, deg} from '../../../../kit';
import type {Pt} from '../../../../kit';
import {BUNDLE, bundlePts} from '../../shared';

/* THE MOTHER'S SHADOW on the lit tent canvas (S10), drawn in code as one flat tone: a seated woman in a headscarf
 * (smooth dome, a knot and two short tails at the nape, no hair), three-quarter to screen right, cradling a swaddled
 * baby. Units: layer pixels, origin = the middle of her lap on the ground line, y up; about 270 px tall.
 * Two poses: upright and rocking; CURLED over the bundle (head down and forward, shoulders rounded, forearms and
 * bundle pulled up to the chest), reached through one in-between on twos from `curlAt`.
 * The bundle is the shared S9 outline (BUNDLE), corners rounded, with a small head bump; `arms` = the baby's two arms
 * (angle pairs in degrees from straight up, or null). */
const chaikin = (pts: Pt[], n = 2): Pt[] => {
  let p = pts;
  for (let k = 0; k < n; k++) p = p.flatMap((a, i) => { const b = p[(i + 1) % p.length]; return [[a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]] as Pt[]; });
  return p;
};
const BW = BUNDLE.px.w, SWADDLE = chaikin(bundlePts(BW) as Pt[]);

const sm = (pts: Pt[], n = 2) => chaikin(pts, n);
const LAP = sm([[-90, -4], [-98, 24], [-88, 58], [-68, 86], [-40, 98], [38, 96], [84, 86], [118, 62], [134, 30], [132, -4]]);
const TORSO = sm([[-36, -14], [-44, 26], [-44, 60], [-34, 88], [-12, 100], [16, 98], [36, 88], [42, 64], [38, 30], [34, -14]]);
const HEAD = sm([[-28, 150], [-22, 168], [-6, 178], [14, 178], [32, 168], [42, 152], [43, 142], [50, 133], [43, 129], [44, 123], [39, 112], [26, 106], [10, 108], [-8, 108], [-24, 120], [-30, 136]], 2);
const NAPE = sm([[-28, 146], [-34, 122], [-26, 100], [-4, 96], [8, 104], [2, 130]]);
const TAIL1 = sm([[-30, 120], [-52, 102], [-50, 90], [-38, 96], [-28, 110]], 1), TAIL2 = sm([[-30, 114], [-42, 86], [-34, 78], [-26, 90], [-22, 108]], 1);

export const MotherShadow: React.FC<{f: number; color: string; curlAt: number; arms: [number, number] | null}> = ({f, color, curlAt, arms}) => {
  const c = track(f, [[0, 0], [curlAt, 1]], 4);                               // 0 upright .. 1 curled, in 2 steps on twos
  const rock = Math.sin((twos(f) / BUNDLE.rock.period) * Math.PI * 2) * (f >= curlAt ? 1 : BUNDLE.rock.deg);
  const S = (pts: Pt[], w: number) => <Stroke pts={pts} width={w} color={color} />;
  const D = (x: number, y: number, r: number) => <Disc r={r} color={color} pos={[x, y, 0]} seg={36} />;
  const P = (pts: Pt[]) => <Poly pts={pts} color={color} />;
  return (
    <group>
      {/* lap: seated, the skirt spreading on the floor, knees to screen right */}
      {P(LAP)}
      {/* upper body: turns about the waist (rocking; leaning forward when she curls) */}
      <group position={[-30, 84, 0]} rotation={[0, 0, deg(-rock * 0.5 - c * 14)]}>
        {P(TORSO)}
        {/* rounded shoulders when curled: the upper back humps */}
        {c > 0 ? D(-20 + c * 2, 72 + c * 4, 22 + c * 6) : null}
        {/* neck and head: scarf dome, face in profile, the knot with two short tails at the nape */}
        <group position={[2 + c * 6, 98 - c * 6, 0]} rotation={[0, 0, deg(-8 - c * 22)]}>
          <group position={[-2, -98, 0]}>{P(HEAD)}{P(NAPE)}{D(-30, 116, 8)}{P(TAIL1)}{P(TAIL2)}</group>
        </group>
        {/* arm: upper arm down from the shoulder, forearm under the bundle, hand at its far end; pulled in and up when curled */}
        {S([[16, 82], [30, 36]], 22)}{D(16, 82, 11)}{D(30, 36, 11)}
        <group position={[-c * 24, c * 16, 0]}>
          {S([[30, 36], [98, 58]], 21)}{D(100, 59, 11)}{D(110, 68, 7)}
          <group position={[104, 88, 0]} rotation={[0, 0, deg(12 + rock + c * 12)]}>
            {P(SWADDLE)}
            {D(BW * 0.42, BW * 0.14, BW * 0.19)}
            {arms ? arms.map((a, i) => (
              <group key={i} position={[BW * (i ? 0.27 : 0.16), BW * 0.1, 0]} rotation={[0, 0, deg(90 - 12 - a)]}>
                {S([[-4, 0], [28, 0]], 14)}{D(28, 0, 7.6)}
              </group>
            )) : null}
          </group>
        </group>
      </group>
    </group>
  );
};
