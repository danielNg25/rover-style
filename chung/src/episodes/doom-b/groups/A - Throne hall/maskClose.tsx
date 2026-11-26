import React from 'react';
import {Poly, Disc, Stroke, RefPlane, refSpace, bezier, circlePts, track, trackStep, idle} from '../../../../kit';
import type {Pt, V3, RefSpace} from '../../../../kit';
import {Hall, HALL, Column, PAL} from './hall';

/* S1: the ruler's mask in extreme close-up, DRAWN IN CODE (the 415 px raster would be enlarged four times).
 * Shapes and greys are copied from public/doom (mask #bcbbbd, eye plate #707170, brow #626360, slit #141518,
 * pupil #fff4d0, hood #358642 / #0e2409). All coordinates are pixels of the 1280x720 frame on frame 0, y down.
 * Behind the screen-left slit: skin, an eye, an upper lid and three scar ridges, in a SHADOW state and a LIT state;
 * every inside shape is clipped to the slit outline, so nothing ever shows on the metal. */

export const S1_CAM = {pos: [0, 0, 10] as V3, look: [0, 0, 0] as V3, fov: 30};
export const S1_M: RefSpace = refSpace({cam: S1_CAM.pos, fov: S1_CAM.fov});

// ---- small 2D helpers (pixel space, y down)
const rot = (p: Pt, c: Pt, a: number): Pt => { const r = (a * Math.PI) / 180, x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)]; };
/** rounded bar w x h centred on c, turned a degrees clockwise (convex) */
const bar = (c: Pt, w: number, h: number, r: number, a = 0): Pt[] => {
  const out: Pt[] = [], k: [number, number, number][] = [[w / 2 - r, -h / 2 + r, -90], [w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180]];
  k.forEach(([x, y, a0]) => { for (let i = 0; i <= 5; i++) { const t = ((a0 + i * 18) * Math.PI) / 180; out.push(rot([c[0] + x + Math.cos(t) * r, c[1] + y + Math.sin(t) * r], c, a)); } });
  return out;
};
const shift = (pts: Pt[], dx: number, dy = 0): Pt[] => pts.map(([x, y]) => [x + dx, y + dy]);
/** keep the part of a polygon on the left of the directed line a -> b (Sutherland-Hodgman, one edge) */
const cut = (pts: Pt[], a: Pt, b: Pt): Pt[] => {
  const side = (p: Pt) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]), out: Pt[] = [];
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length], sp = side(p), sq = side(q);
    if (sp >= 0) out.push(p);
    if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  });
  return out;
};
/** polygon clipped to a convex outline */
const clipTo = (pts: Pt[], clip: Pt[]): Pt[] => {
  let area = 0; clip.forEach((p, i) => { const q = clip[(i + 1) % clip.length]; area += p[0] * q[1] - q[0] * p[1]; });
  let out = pts;
  clip.forEach((p, i) => { const q = clip[(i + 1) % clip.length]; if (out.length >= 3) out = area > 0 ? cut(out, p, q) : cut(out, q, p); });
  return out;
};
/** thick curved band along a quadratic curve, width w0 at the start and w1 at the end */
const band = (p0: Pt, p1: Pt, p2: Pt, w0: number, w1: number, n = 14): Pt[] => {
  const c = bezier(p0, p1, p2, n), up: Pt[] = [], dn: Pt[] = [];
  c.forEach((p, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l;
    const u = i / n, w = (w0 + (w1 - w0) * u) / 2 * (i === 0 || i === n ? 0.55 : 1);
    up.push([p[0] + nx * w, p[1] + ny * w]); dn.push([p[0] - nx * w, p[1] - ny * w]);
  });
  return [...up, ...dn.reverse()];
};
const Px: React.FC<{pts: Pt[]; color: string; z: number}> = ({pts, color, z}) => (pts.length >= 3 ? <Poly pts={pts} color={color} pos={[0, 0, z]} /> : null);

// ---- fixed outlines (frame pixels; the scale is 9 px per pixel of the puppet's mask, whose slit is 54 wide: 486 px = 38 % of the frame)
const SLIT_C: Pt = [372, 372];
const SLIT = bar(SLIT_C, 486, 128, 44, 7);
const EYE_C: Pt = [366, 374];
const EYE = circlePts(EYE_C, 112, 0, 360, 28, 0.3).map((p) => rot(p, EYE_C, 7));   // the eye opening (convex)
// the far side of the mask is turned away from us: everything on it is drawn at FAR of its width
const FAR = 0.5, FAR_C: Pt = [905, 372];
const SLIT2 = bar(FAR_C, 156, 124, 40, -7);
/** near-slit coordinates -> the mirrored, foreshortened far slit */
const far = (p: Pt): Pt => [FAR_C[0] - (p[0] - EYE_C[0]) * FAR, p[1] - 2];
// lantern light on metal (bible 8b): the planes are warm greys of ONE family, lighter where they face the lantern and darker where they turn away; the plate itself and the eye plates stay the puppet's neutral greys
const GREY = {plate: '#b9b8ba', light: '#d2c9ae', low: '#a79b7e', side: '#918568', recess: '#707170', recess2: '#5f6061', brow: '#626360', browLow: '#565755', line: '#8c8c8e', rivet: '#767776', edge: '#4a4b4e', dark: '#141518', rim: '#dccfa6', rim2: '#c9bf9f'};
const SKIN = {sh: '#3b2622', lit: '#c9976f', sh2: '#352220', lit2: '#b5835f', band: '#e9bd94'};
const SCAR = {sh: '#49322c', lit: '#eda792', edgeSh: '#3b2622', edgeLit: '#a55c4c'};
const LID = {sh: '#33201d', lit: '#bb8a66', lineSh: '#28181a', lineLit: '#855843'};
const PUPIL = '#fff4d0';
type Shape = [Pt[], string, string];

/** What is behind a slit: skin, the eye, the pupil, the upper lid and (near side only) three raised scar ridges, each
 *  as [points, shadow colour, lit colour] in NEAR-slit coordinates. o = sideways shift, L = how far the lid has dropped. */
const eyeShapes = (o: number, L: number, pupil: Pt, scars: boolean): Shape[] => {
  const e = shift(EYE, o), ec: Pt = [EYE_C[0] + o, EYE_C[1]];
  const lidEdge = bezier([255, 360 + L * 0.4], [366, 340 + L * 1.3], [477, 388 + L * 0.4], 12);
  const ridge = (p0: Pt, p1: Pt, p2: Pt, w0: number, w1: number): Shape[] => [
    [shift(band([p0[0] + 3, p0[1] + 3], [p1[0] + 3, p1[1] + 3], [p2[0] + 3, p2[1] + 3], w0 + 2, w1 + 2), o), SCAR.edgeSh, SCAR.edgeLit],
    [shift(band(p0, p1, p2, w0, w1), o), SCAR.sh, SCAR.lit],
  ];
  return [
    [[[60, 200], [700, 200], [700, 560], [60, 560]], SKIN.sh, SKIN.lit],
    // lower skin tone under the eye
    [shift([[60, 410], [300, 404], [520, 420], [700, 444], [700, 560], [60, 560]], o), SKIN.sh2, SKIN.lit2],
    [e, GREY.dark, '#241619'],
    [clipTo(circlePts([ec[0] + pupil[0], ec[1] + pupil[1]], 21, 0, 360, 22), e), PUPIL, PUPIL],
    // upper lid: skin that comes down over the eye, with its edge line
    [shift([[190, 250], [560, 290], [500, 394 + L * 0.4], ...[...lidEdge].reverse(), [205, 344]], o), LID.sh, LID.lit],
    [shift(band(lidEdge[0], lidEdge[6], lidEdge[12], 5, 6), o), LID.lineSh, LID.lineLit],
    // three raised scar ridges, each with a darker edge: two cross brow and lid diagonally (the first carries on under the eye), one lies under the eye
    ...(scars ? [
      ...ridge([256, 292], [282, 328], [302, 358 + L * 0.8], 7, 11),
      ...ridge([324, 404], [331, 420], [339, 442], 10, 6),
      ...ridge([418, 298], [440, 330], [453, 364 + L * 0.9], 6, 10),
      ...ridge([388, 424], [452, 414], [528, 432], 6, 9),
    ] : []),
  ];
};

/** One slit as a real hole: the metal's thickness shows as a darker grey edge on the TOP and LEFT only (no outline),
 *  and everything behind it is clipped to the opening. `edge` = x of the light edge: left of it is shadow, right lit. */
const Hole: React.FC<{slit: Pt[]; shapes: Shape[]; edge: number; sweeping: boolean; z: number}> = ({slit, shapes, edge, sweeping, z}) => {
  const inner = (pts: Pt[]) => clipTo(clipTo(pts, slit), shift(slit, 8, 10));
  const A: Pt = [edge - 80, 100], B: Pt = [edge + 80, 640]; // the light edge, leaning like the slit's end
  return (
    <>
      <Px pts={slit} color={GREY.edge} z={z} />
      {shapes.map(([pts, sh, lit], i) => {
        const c = inner(pts);
        return <React.Fragment key={i}><Px pts={cut(c, A, B)} color={sh} z={z + 0.4 + i * 0.3} /><Px pts={cut(c, B, A)} color={lit} z={z + 0.4 + i * 0.3} /></React.Fragment>;
      })}
      {/* the light itself while it travels: one lighter parallelogram on the skin, 70 px wide, behind the eye and scars */}
      {sweeping ? <Px pts={cut(cut(inner(shapes[0][0]), B, A), [A[0] + 70, A[1]], [B[0] + 70, B[1]])} color={SKIN.band} z={z + 0.55} /> : null}
    </>
  );
};

const Rivet: React.FC<{at: Pt; r?: number}> = ({at, r = 11}) => (
  <group position={[at[0], at[1], 0.5]}><Disc r={r + 2.5} color={GREY.low} pos={[1.5, 2, -0.1]} /><Disc r={r} color={GREY.rivet} /><Disc r={r * 0.45} color={GREY.line} pos={[-r * 0.2, -r * 0.2, 0.2]} /></group>
);

/** where the hall stands behind the mask: its right lantern sits in the sliver at the right frame edge (about 28 units from the camera) */
const HALL_AT: V3 = [6.25, -4.33, -11.2];

/** Whole S1 picture. f = frame in the shot. */
export const MaskClose: React.FC<{f: number}> = ({f}) => {
  const m = S1_M;
  // beat 26 ('face'): head turns toward the lantern, 3 drawings; the hood edge follows 4 f late; what is behind the slit moves less
  // between beats the head is held alive: a small offset that changes on twos (bible 6.2.5), never a sine
  const dx = track(f, [[0, 0], [26, 12]], 6) + idle(f, 2, 10) * 3, dy = idle(f + 4, 3, 12) * 3, hx = track(f, [[0, 0], [30, 12]], 6), ix = track(f, [[0, 0], [26, -5]], 6);
  const browY = trackStep(f, [[0, 0], [48, 10]]);
  const sway = idle(f, 5, 4) * 13, sway2 = idle(f + 2, 9, 4) * 10;
  // beat 10 ('it'): the pupil starts in the LEFT CORNER of the eye, half hidden by the lid (he was looking off-screen at the Earth), and snaps to us
  const pupil = trackStep<Pt>(f, [[0, [-90, -3]], [10, [0, 0]], [52, [50, 14]]]);
  const L = trackStep(f, [[0, 0], [48, 20]]);     // beat 48: the scarred upper lid drops halfway
  // beat 36 ('scarred'): the lantern light comes from screen right, so it crosses the far slit first (34, one drawing)
  // and then slides across the near one over 8 f on twos (36-42)
  const edge = trackStep<number>(f, [[0, 9999], [36, 520], [38, 380], [40, 230], [42, -9999]]) + dx;
  const edgeFar = trackStep<number>(f, [[0, 9999], [34, 910], [36, -9999]]) + dx;
  const nearShapes = eyeShapes(dx + ix, L, pupil, true);
  const farShapes = eyeShapes(0, L * 0.8, [-pupil[0], pupil[1]], false).map(([pts, a, b]) => [shift(pts.map(far), dx + ix), a, b] as Shape);
  const browN = band([64, 190], [352, 118], [690, 240], 34, 104), browF = band([806, 246], [900, 152], [1010, 178], 98, 30);
  return (
    <>
      {/* ---- far right: the real hall set behind the mask (sharp): its right lantern, a column edge, balustrade, towers, sky with constant stars */}
      <group position={HALL_AT}>
        <Hall f={f} stars={150} starSeed={21} noColR />
        <Column pos={[HALL.lanternR[0] + 1.75, HALL.daisY, HALL.lanternR[2] + 0.6]} banner={false} />
      </group>

      {/* ---- the mask plate and everything fixed to it */}
      <RefPlane m={m} z={0}>
        <group position={[dx, dy, 0]}>
          <Px pts={[[110, -60], [1000, -60], [1016, 200], [1022, 480], [1012, 790], [104, 790], [88, 520], [86, 220]]} color={GREY.plate} z={0} />
          {/* tones: the forehead above the seam a step lighter; the side plane turned away from the lantern and the cheek a step darker */}
          <Px pts={[[108, -60], [1000, -60], [1008, 84], [800, 60], [560, 60], [330, 82], [98, 118]]} color={GREY.light} z={0.2} />
          <Px pts={[[86, 220], [98, 118], [196, 100], [182, 300], [178, 520], [204, 790], [104, 790], [88, 520]]} color={GREY.side} z={0.25} />
          <Px pts={[[178, 566], [320, 600], [560, 650], [640, 790], [204, 790]]} color={GREY.low} z={0.2} />
          <Px pts={[[830, 640], [1016, 600], [1012, 790], [790, 790]]} color={GREY.low} z={0.2} />
          {/* the forehead seam, a second plate seam down the cheek, the warm edge the lantern puts on the plate's right side */}
          <Stroke pts={bezier([96, 118], [560, 38], [1008, 84])} width={8} color={GREY.line} pos={[0, 0, 0.4]} />
          <Stroke pts={bezier([96, 126], [560, 46], [1008, 92])} width={3} color={GREY.light} pos={[0, 0, 0.42]} />
          <Stroke pts={[[226, 560], [236, 660], [262, 790]]} width={5} color={GREY.line} pos={[0, 0, 0.4]} />
          <Px pts={[[984, -60], [1000, -60], [1016, 200], [1022, 480], [1012, 790], [996, 790], [1006, 480], [1000, 200]]} color={GREY.rim} z={0.45} />
          {([[742, 34], [300, 44], [134, 226], [140, 632], [972, 610], [470, 700]] as Pt[]).map((at, i) => <Rivet key={i} at={at} r={i === 5 ? 8 : 11} />)}
          {/* two dents (a darker hollow with a light lower lip) and two scratches */}
          {([[566, 604, 30, -8], [884, 690, 22, 12]] as const).map(([x, y, r, a], i) => (
            <group key={i} position={[x, y, 0.5]} rotation={[0, 0, (a * Math.PI) / 180]}>
              <Disc r={r} sy={0.42} color={GREY.low} /><Disc r={r * 0.9} sy={0.3} color={GREY.light} pos={[2, r * 0.2, 0.1]} /><Disc r={r * 0.86} sy={0.3} color={GREY.side} pos={[0, -1, 0.2]} />
            </group>
          ))}
          <Stroke pts={[[404, 566], [452, 590], [476, 596]]} width={3} taper={0.6} color={GREY.light} pos={[0, 0, 0.5]} />
          <Stroke pts={[[306, 664], [352, 648]]} width={3} taper={0.6} color={GREY.side} pos={[0, 0, 0.5]} />
          {/* eye plates (recessed, darker): each with an upper edge in shadow and a lower lip tone */}
          <Px pts={bar([372, 380], 590, 300, 58)} color={GREY.recess} z={1} />
          <Px pts={clipTo(bar([372, 380], 590, 300, 58), [[0, 484], [800, 484], [800, 600], [0, 600]])} color={GREY.recess2} z={1.2} />
          <Px pts={bar([905, 380], 222, 300, 46)} color={GREY.recess} z={1} />
          <Px pts={clipTo(bar([905, 380], 222, 300, 46), [[780, 484], [1200, 484], [1200, 600], [780, 600]])} color={GREY.recess2} z={1.2} />
          {/* nose bridge: a lit facet, a shaded facet and the lantern's warm edge on its right side */}
          <Px pts={[[726, 270], [752, 270], [744, 790], [668, 790]]} color={GREY.light} z={2.2} />
          <Px pts={[[752, 270], [768, 270], [826, 790], [744, 790]]} color={GREY.low} z={2.3} />
          <Px pts={[[764, 270], [770, 270], [832, 790], [820, 790]]} color={GREY.rim2} z={2.4} />
          {/* the shadow each brow casts on the plate and the recess below it (a darker tone, never black) */}
          <Poly pts={shift(browN, 10, browY + 22)} color="#1d1c2a" opacity={0.2} pos={[0, 0, 1.3]} />
          <Poly pts={shift(browF, 6, 22)} color="#1d1c2a" opacity={0.2} pos={[0, 0, 1.3]} />
          {/* brows: heavy angled pieces with a darker underside; the screen-left one lowers a step on beat 48 */}
          <group position={[0, browY, 9]}>
            <Px pts={browN} color={GREY.brow} z={0} />
            <Px pts={band([150, 196], [372, 150], [680, 262], 10, 36)} color={GREY.browLow} z={0.2} />
          </group>
          <Px pts={browF} color={GREY.brow} z={9} />
          <Px pts={band([816, 268], [902, 196], [1000, 194], 34, 10)} color={GREY.browLow} z={9.2} />
        </group>
        {/* the two slits: real holes, the far one foreshortened; same face behind both */}
        <group position={[0, dy, 0]}>
          <Hole slit={shift(SLIT, dx)} shapes={nearShapes} edge={edge} sweeping={f >= 36 && f < 42} z={3} />
          <Hole slit={shift(SLIT2, dx)} shapes={farShapes} edge={edgeFar} sweeping={false} z={3} />
        </group>
      </RefPlane>

      {/* ---- the hood: nearer than the mask, so it slides against it in the push; its inner edge and folds sway on twos */}
      <RefPlane m={m} z={0.45}>
        <group position={[hx, 0, 0]}>
          <Px pts={[[-80, -80], [206, -80], [168 + sway2, 120], [142 + sway, 360], [152 + sway2, 600], [182, 800], [-80, 800]]} color="#0e2409" z={0} />
          <Px pts={[[-80, -80], [140, -80], [106 + sway2, 150], [86 + sway, 380], [98 + sway2, 620], [122, 800], [-80, 800]]} color="#358642" z={0.5} />
          <Px pts={[[-80, -80], [58, -80], [30 + sway2 * 0.6, 200], [22 + sway * 0.6, 420], [40, 800], [-80, 800]]} color="#3d9450" z={0.7} />
          <Px pts={band([84, -40], [54 + sway, 300], [92, 760], 9, 14)} color="#2b7237" z={0.8} />
          <Px pts={band([26, 60], [8 + sway * 0.6, 380], [34, 700], 5, 9)} color="#2b7237" z={0.9} />
          <Px pts={[[1004, -80], [1090, -80], [1076, 200], [1080, 500], [1068, 800], [1010, 800], [1026, 480], [1020, 200]]} color="#0e2409" z={0} />
          <Px pts={[[1040, -80], [1128, -80], [1108 - sway2 * 0.5, 210], [1116 - sway * 0.5, 500], [1100, 800], [1036, 800], [1048, 480]]} color="#358642" z={0.5} />
          <Px pts={band([1096, -20], [1082 - sway * 0.5, 340], [1090, 760], 6, 10)} color="#2b7237" z={0.8} />
          {/* the lantern's warm edge on the hood's outer fold */}
          <Px pts={band([1122, -40], [1106 - sway * 0.5, 350], [1098, 780], 5, 7)} color="#7fb86a" z={0.9} />
        </group>
      </RefPlane>
    </>
  );
};
