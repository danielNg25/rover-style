import type {PuppetPiece, PuppetRig, Pt} from './types';

/** puppet/single: a SINGLE-PICTURE puppet. One whole-figure drawing (plus optional alternative drawings of the same
 *  character) becomes a rig that can blink (flat skin-coloured lids over the drawn eyes), tilt, lean, squash, hop,
 *  shiver and fake-walk. It has no arms or face layers: change expression by swapping the drawing (sel: {pic: id}). */
export type SinglePic = {
  src: string; size: Pt;                 // file and its pixel size
  eyes?: {at: Pt; r: Pt}[];              // centre and radii [rx, ry] of each drawn eye, in the picture's pixels (screen-left eye first)
};
export const singlePicture = (o: {name: string; skin?: string; pivotY?: number; alts?: Record<string, SinglePic>} & SinglePic): PuppetRig => {
  const all: Record<string, SinglePic> = {base: {src: o.src, size: o.size, eyes: o.eyes}, ...(o.alts ?? {})};
  const W = Math.max(...Object.values(all).map((p) => p.size[0])), H = Math.max(...Object.values(all).map((p) => p.size[1]));
  const pieces: Record<string, PuppetPiece> = {}, options: Record<string, string[]> = {}, lids: [string[], string[]] = [[], []];
  Object.entries(all).forEach(([id, p]) => {
    const name = id === 'base' ? 'pic' : `pic_${id}`, x0 = (W - p.size[0]) / 2, y0 = H - p.size[1];
    // every drawing stands on the same ground line and centre; it turns about a point near the hips
    pieces[name] = {src: p.src, x: x0, y: y0, w: p.size[0], h: p.size[1], pivot: [W / 2, H * (o.pivotY ?? 0.9)], z: 1};
    options[id] = [name];
    (p.eyes ?? []).slice(0, 2).forEach((e, i) => {
      const lid = `lid${i ? 'R' : 'L'}_${id}`; lids[i].push(lid);
      pieces[lid] = {shape: 'ellipse', fill: o.skin ?? '#f7c299', x: x0 + e.at[0] - e.r[0], y: y0 + e.at[1] - e.r[1], w: e.r[0] * 2, h: e.r[1] * 2, pivot: [x0 + e.at[0], y0 + e.at[1]], parent: name, z: 2};
    });
  });
  const ry = o.eyes?.[0]?.r[1] ?? 20;
  return {
    name: o.name, canvas: [W, H], groundY: H, centerX: W / 2, height: H, pieces,
    roles: {body: Object.keys(options).map((id) => options[id][0])},
    variants: {pic: {default: 'base', options}},
    face: lids[0].length ? {eyes: {L: {lid: lids[0]}, R: {lid: lids[1]}}, parallax: {base: [0, 0], eyes: [0, 0], nose: [0, 0], mouth: [0, 0]}, pupilTravel: [0, 0], lidTravel: ry * 1.5} : undefined,
    shadow: {r: W * 0.42},
  };
};
