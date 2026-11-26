import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import type {V3, Pt} from './math';
import {FlatMat, RoundRect, Stroke, Poly, bezier} from './shapes';
import {Upright} from './pictures';

/** kit/text: in-world text only (bible 8.10). Vietnamese with full diacritics; uppercase for signage, lowercase
 *  bold for name tags; 1-4 words; glyph height at least 3 % of the frame when it must be read. */
// Helvetica Neue / Arial carry every Vietnamese glyph in bold; Avenir Next lacks the hook-above letters (ủ, ở, ả)
export const KIT_FONT = "'Helvetica Neue', Arial, sans-serif";
const useText = (text: string, color: string, weight: number, font: string) => {
  const r = useMemo(() => {
    const px = 160, c = document.createElement('canvas'), g = c.getContext('2d')!;
    const f = `${weight} ${px}px ${font}`; g.font = f;
    const m = g.measureText(text), pad = 12;
    // room for stacked Vietnamese marks above capitals and dots below
    const asc = Math.max(m.actualBoundingBoxAscent, px * 0.75), desc = Math.max(m.actualBoundingBoxDescent, px * 0.05);
    c.width = Math.ceil(m.width + pad * 2); c.height = Math.ceil(asc + desc + pad * 2);
    const g2 = c.getContext('2d')!; g2.font = f; g2.fillStyle = color; g2.textBaseline = 'alphabetic'; g2.fillText(text, pad, pad + asc);
    // faux-bold: headless Chrome does not always find the bold face, so thicken the glyphs a little ourselves
    g2.strokeStyle = color; g2.lineWidth = px * 0.045; g2.lineJoin = 'round'; g2.strokeText(text, pad, pad + asc);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return {tex: t, aspect: c.width / c.height};
  }, [text, color, weight, font]);
  useEffect(() => () => r.tex.dispose(), [r]);
  return r;
};
/** Text standing on a plane in the set (a shop sign, a banner, a document title). pos = centre of the text,
 *  height = world height of the text line, board = optional flat plate behind it. Uppercased by default. */
export const SignText: React.FC<{text: string; pos?: V3; rot?: V3; height: number; color?: string; board?: string; boardPad?: number; upper?: boolean; weight?: number; font?: string; opacity?: number; order?: number}> =
  ({text, pos = [0, 0, 0], rot, height, color = '#1c1a22', board, boardPad = 0.35, upper = true, weight = 700, font = KIT_FONT, opacity = 1, order = 0}) => {
    const {tex, aspect} = useText(upper ? text.toLocaleUpperCase('vi-VN') : text, color, weight, font), w = height * aspect;
    return (
      <group position={pos} rotation={rot}>
        <Upright>
          {board ? <RoundRect w={w + height * boardPad * 2} h={height * (1 + boardPad)} r={height * 0.12} color={board} pos={[0, 0, -0.01]} order={order} /> : null}
          <mesh renderOrder={order + 1}><planeGeometry args={[w, height]} /><FlatMat color={'#ffffff'} opacity={opacity} map={tex} alphaTest={0.02} /></mesh>
        </Upright>
      </group>
    );
  };
/** Name tag: lowercase bold label with a hand-drawn curved arrow, standing in the set so it parallaxes.
 *  pos = left end of the text baseline; height = text line height (world); to = the point the arrow ends at,
 *  relative to pos; p = 0..1 arrow draw-on (use prog(f, 0, 14); the text is there from frame 0). */
export const NameTag: React.FC<{text: string; pos: V3; height: number; to: Pt; p?: number; tone?: 'black' | 'white'; font?: string}> =
  ({text, pos, height, to, p = 1, tone = 'black', font = KIT_FONT}) => {
    const color = tone === 'black' ? '#121214' : '#fbf6e6';
    const {tex, aspect} = useText(text.toLocaleLowerCase('vi-VN'), color, 700, font), w = height * aspect;
    // arrow leaves from under (or over) the text, runs vertically, then curves to the target
    const below = to[1] < 0, sx = Math.max(w * 0.12, Math.min(w * 0.88, to[0] < 0 ? w * 0.15 : w * 0.8));
    const p0: Pt = [sx, below ? -height * 0.22 : height * 0.95], p1: Pt = [sx, to[1]];
    const curve = bezier(p0, p1, to, 28), a = curve[curve.length - 2], dx = to[0] - a[0], dy = to[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const ux = dx / l, uy = dy / l, hs = height * 0.3;
    const head: Pt[] = [[to[0] + ux * hs, to[1] + uy * hs], [to[0] - ux * hs * 0.5 - uy * hs * 0.6, to[1] - uy * hs * 0.5 + ux * hs * 0.6], [to[0] - ux * hs * 0.2, to[1] - uy * hs * 0.2], [to[0] - ux * hs * 0.5 + uy * hs * 0.6, to[1] - uy * hs * 0.5 - ux * hs * 0.6]];
    return (
      <group position={pos}>
        <Upright>
          <mesh position={[w / 2, height * 0.37, 0]} renderOrder={990}><planeGeometry args={[w, height]} /><FlatMat color={'#ffffff'} map={tex} alphaTest={0.02} /></mesh>
          <Stroke pts={curve} width={height * 0.075} taper={0.55} p={p} color={color} order={990} />
          {p >= 0.98 ? <Poly pts={head} color={color} order={991} /> : null}
        </Upright>
      </group>
    );
  };
