import React from 'react';
import * as THREE from 'three';
import {B} from './kit';
import {Halo} from './look';
import {rnd, Ctx} from './depth';
import {tex} from './kitLab';
import {SpellBook, MAGIC_GREEN} from './kitLeuThayLang';

/** lib3/kitHanhLy: BOOKS AND LUGGAGE that people handle (made for d1c5, 23/11/2026; any period piece can use them):
 *  an old leather suitcase that stands upright and opens like a cupboard door (books go in standing, spines out; the lid
 *  shuts, two straps buckle, the brass lock snaps), the same suitcase carried; an open book held up in two hands (seen from
 *  behind its covers); a closed book flying in an arc (the fast-forward of shot 3); a folding book stand with an open book
 *  whose page turns (shot 4). Everything stands with its foot (or its centre, said in each) at `pos`, its front to +z. */
type V3 = [number, number, number];
const HAND = '"Chalkboard SE", "Noteworthy", "Comic Sans MS", cursive';
const blob = (c: Ctx, x: number, y: number, rad: number, col: string) => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); };

// ================================================================ leather
/** old brown leather: a pebbled grain, darker creases, scuffed pale patches at the edges, a stain, a stitched seam round the
 *  border (the panel's own edge); tone = the base colour */
export const leatherTex = (tone = '#7a4a2a', key = 'a', seam = true) => tex(`leather-${tone}-${key}-${seam}`, 512, 384, (c, W, H) => {
  const r = rnd(key.length * 13 + tone.length); c.fillStyle = tone; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 2600; k++) { c.fillStyle = r() < 0.5 ? `rgba(20,10,4,${0.06 + r() * 0.1})` : `rgba(255,220,180,${0.04 + r() * 0.06})`; c.beginPath(); c.arc(r() * W, r() * H, 1 + r() * 2.4, 0, 7); c.fill(); }
  c.strokeStyle = 'rgba(20,10,4,0.22)'; c.lineWidth = 1.5; for (let k = 0; k < 30; k++) { const x = r() * W, y = r() * H; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 20 - r() * 40, y + 10, x + 30 - r() * 60, y + 20 - r() * 40); c.stroke(); }
  for (let k = 0; k < 10; k++) { const sd = Math.floor(r() * 4), t = r(); blob(c, sd < 2 ? t * W : sd === 2 ? 0 : W, sd >= 2 ? t * H : sd === 0 ? 0 : H, 30 + r() * 50, 'rgba(230,190,140,0.3)'); }
  blob(c, W * (0.3 + r() * 0.4), H * (0.3 + r() * 0.4), 60, 'rgba(30,14,6,0.2)');
  if (seam) { c.strokeStyle = 'rgba(240,220,180,0.75)'; c.lineWidth = 3; c.setLineDash([10, 8]); c.strokeRect(16, 16, W - 32, H - 32); c.setLineDash([]); c.strokeStyle = 'rgba(20,10,4,0.35)'; c.lineWidth = 2; c.strokeRect(12, 12, W - 24, H - 24); }
});
/** the lining inside the case: faded madder cloth with a woven stripe, a paper label of a hotel (no name) half torn */
const liningTex = () => tex('valise-lining', 512, 384, (c, W, H) => {
  const r = rnd(4); c.fillStyle = '#8a3e34'; c.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 22) { c.fillStyle = 'rgba(240,200,170,0.12)'; c.fillRect(x, 0, 6, H); c.fillStyle = 'rgba(40,10,6,0.14)'; c.fillRect(x + 10, 0, 3, H); }
  for (let k = 0; k < 900; k++) { c.fillStyle = `rgba(30,8,4,${0.05 + r() * 0.08})`; c.fillRect(r() * W, r() * H, 2, 2); }
  const g = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,4,2,0.45)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.translate(W * 0.72, H * 0.3); c.rotate(-0.12); c.fillStyle = '#e6d6b0'; c.beginPath(); c.ellipse(0, 0, 60, 42, 0, 0, 7); c.fill(); c.strokeStyle = '#2f4a6a'; c.lineWidth = 4; c.stroke(); c.fillStyle = '#2f4a6a'; c.font = `bold 22px Georgia, serif`; c.textAlign = 'center'; c.fillText('✶ ✶ ✶', 0, 8); c.restore();
});
/** a book's spine: leather of `col`, raised bands in gold, a title panel of scribbles */
const spineTex = (col: string, sigil = false) => tex(`book-spine-${col}-${sigil}`, 96, 384, (c, W, H) => {
  c.fillStyle = col; c.fillRect(0, 0, W, H); { const r = rnd(col.length + (sigil ? 9 : 0)); for (let k = 0; k < 300; k++) { c.fillStyle = "rgba(0,0,0,0.12)"; c.fillRect(r() * W, r() * H, 2, 2); } }
  const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(0.45, 'rgba(255,240,210,0.15)'); g.addColorStop(1, 'rgba(0,0,0,0.4)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#c9a24a'; [0.1, 0.24, 0.72, 0.86].forEach((v) => { c.fillRect(0, v * H, W, 7); c.fillStyle = 'rgba(80,50,10,0.5)'; c.fillRect(0, v * H + 7, W, 3); c.fillStyle = '#c9a24a'; });
  c.fillStyle = '#e8d8a8'; c.fillRect(W * 0.18, H * 0.32, W * 0.64, H * 0.3); c.strokeStyle = '#3a2416'; c.lineWidth = 3; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(W * 0.3, H * (0.36 + k * 0.065)); c.lineTo(W * 0.7, H * (0.36 + k * 0.065) + 3); c.stroke(); }
  if (sigil) { c.strokeStyle = MAGIC_GREEN.deep; c.lineWidth = 4; c.beginPath(); c.arc(W / 2, H * 0.48, W * 0.28, 0, 7); c.stroke(); }
});

// ================================================================ the suitcase
/** THE OLD LEATHER SUITCASE (d1c5 shots 14, 15, 18), standing up on its long edge, the big face to +z, origin at the middle of
 *  its foot. 0.62 wide, 0.42 tall, 0.2 deep (shell 0.15 + lid 0.05). Brown leather with darker piping, brass corner caps,
 *  a leather handle on top, two straps with buckles round it, a brass lock plate in the middle of the lid's top edge.
 *    open   0..1  the lid (the front) swings out to the LEFT on hinges at its left edge, like a cupboard door (1 = 110 degrees)
 *    books  how many books stand inside, spines out (up to 5, colours from `colors`; the fifth has the green circle)
 *    straps 0..1  the two straps wrap round from the right (0 = hanging loose at the right end, 1 = buckled across the lid)
 *    snap   0..1  a flash on the lock as it shuts
 *  For carrying, put it in a hand with `carry`: its origin then is the middle of the handle (hang it from handWorld). */
export const VALISE = {w: 0.62, h: 0.42, d: 0.2, lid: 0.05, slots: [-0.21, -0.11, -0.01, 0.09, 0.19]};
/** depth of a book standing in the case (the shell is 0.15 deep inside its back lining) */
export const BOOK_D = 0.12;
export const BOOK_COLORS = ['#3e2a22', '#2e3a2a', '#4a2420', '#2a3448', '#3a2420'];
export const Valise: React.FC<{pos: V3; rotY?: number; open?: number; books?: number; straps?: number; snap?: number; colors?: string[]; carry?: boolean; swing?: number}> =
  ({pos, rotY = 0, open = 0, books = 0, straps = 1, snap = 0, colors = BOOK_COLORS, carry, swing = 0}) => {
    const {w, h, d, lid} = VALISE, sh = d - lid, leather = leatherTex('#7a4a2a', 'case'), edge = '#4a2c18', brass = '#c9a24a';
    const z0 = -d / 2, zf = z0 + sh;   // back of the shell, its open front
    const lidAng = -open * 1.92;
    const strap = (x: number) => {
      // across the top, down the lid front (only when the lid is shut enough), across the bottom: buckled at the lid's middle
      const k = Math.min(1, Math.max(0, straps)), shut = open < 0.05;
      return <group key={x} position={[x, 0, 0]}>
        <B p={[0, h + 0.004, 0]} s={[0.045, 0.008, d + 0.01]} c="#5a3620" cast={false} />
        <B p={[0, -0.002, 0]} s={[0.045, 0.006, d + 0.01]} c="#5a3620" cast={false} />
        {shut && k > 0 ? <>
          <B p={[0, h - (h * 0.5 * k) / 2, d / 2 + 0.006]} s={[0.045, h * 0.5 * k, 0.008]} c="#5a3620" cast={false} />
          <B p={[0, (h * 0.5 * k) / 2, d / 2 + 0.006]} s={[0.045, h * 0.5 * k, 0.008]} c="#5a3620" cast={false} />
          {k >= 1 ? <group position={[0, h * 0.5, d / 2 + 0.012]}><B p={[0, 0, 0]} s={[0.06, 0.05, 0.006]} c={brass} cast={false} /><B p={[0, 0, 0.004]} s={[0.04, 0.03, 0.004]} c="#5a3620" cast={false} /><B p={[0, 0.0, 0.007]} s={[0.006, 0.05, 0.004]} c="#e8c870" cast={false} /></group> : null}
        </> : null}
      </group>;
    };
    const body = <>
      {/* the shell: back, sides, top, bottom; leather outside, lining inside */}
      <mesh position={[0, h / 2, z0 + 0.008]} castShadow receiveShadow><boxGeometry args={[w, h, 0.016]} /><meshLambertMaterial map={leather} /></mesh>
      <mesh position={[0, h / 2, z0 + 0.017]} receiveShadow><planeGeometry args={[w - 0.03, h - 0.03]} /><meshLambertMaterial map={liningTex()} /></mesh>
      {[[0, h - 0.008, w, 0.016], [0, 0.008, w, 0.016]].map(([x, y, ww, hh], i) => <mesh key={i} position={[x, y, z0 + sh / 2]} castShadow receiveShadow><boxGeometry args={[ww, hh, sh]} /><meshLambertMaterial map={leather} /></mesh>)}
      {[-1, 1].map((k) => <mesh key={k} position={[k * (w / 2 - 0.008), h / 2, z0 + sh / 2]} castShadow receiveShadow><boxGeometry args={[0.016, h, sh]} /><meshLambertMaterial map={leather} /></mesh>)}
      {/* lining of the inner walls (darker in the depth) */}
      <mesh position={[0, h - 0.017, z0 + sh / 2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[w - 0.03, sh]} /><meshLambertMaterial color="#6a2e26" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.017, z0 + sh / 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[w - 0.03, sh]} /><meshLambertMaterial color="#7a3a30" side={THREE.DoubleSide} /></mesh>
      {/* piping along the front rim, brass corner caps */}
      {[[0, h, w, 0.014, 0.014], [0, 0, w, 0.014, 0.014]].map(([x, y, ww, hh, dd], i) => <B key={i} p={[x, y, zf]} s={[ww + 0.01, hh, dd]} c={edge} cast={false} />)}
      {[-1, 1].map((k) => <B key={k} p={[k * w / 2, h / 2, zf]} s={[0.014, h + 0.01, 0.014]} c={edge} cast={false} />)}
      {[[-1, 0], [1, 0], [-1, 1], [1, 1]].map(([sx, sy], i) => <group key={i} position={[sx * (w / 2 - 0.012), sy * h + (sy ? -0.012 : 0.012), z0 + 0.02]}><B p={[0, 0, 0]} s={[0.04, 0.04, 0.05]} c={brass} /></group>)}
      {/* the handle on top: two loops of brass and a leather grip */}
      {[-1, 1].map((k) => <B key={k} p={[k * 0.07, h + 0.02, 0]} s={[0.018, 0.03, 0.03]} c={brass} />)}
      <mesh position={[0, h + 0.05, 0]} castShadow><boxGeometry args={[0.16, 0.026, 0.034]} /><meshLambertMaterial color="#4a2a16" /></mesh>
      {[-1, 1].map((k) => <B key={k} p={[k * 0.075, h + 0.036, 0]} s={[0.02, 0.03, 0.03]} c="#4a2a16" />)}
      {/* the books standing inside, spines out, a little uneven */}
      {Array.from({length: Math.min(5, books)}, (_, i) => { const bh = 0.3 - (i % 3) * 0.02, bt = 0.07 + (i % 2) * 0.012, col = colors[i % colors.length];
        // books 0.12 deep standing on the back lining: their spines stop 0.012 inside the shell's rim, so the lid shuts over them
        return <group key={i} position={[VALISE.slots[i], 0.016 + bh / 2, z0 + 0.016 + BOOK_D / 2]} rotation={[0, 0, (i - 2) * 0.012]}>
          <mesh castShadow receiveShadow><boxGeometry args={[bt, bh, BOOK_D]} /><meshLambertMaterial color="#e6dac0" /></mesh>
          <mesh position={[0, 0, BOOK_D / 2 + 0.001]}><planeGeometry args={[bt, bh]} /><meshLambertMaterial map={spineTex(col, i === 4)} /></mesh>
          {[-1, 1].map((s) => <mesh key={s} position={[s * (bt / 2 + 0.001), 0, 0]} rotation={[0, s * Math.PI / 2, 0]}><planeGeometry args={[BOOK_D, bh]} /><meshLambertMaterial color={col} /></mesh>)}
        </group>; })}
      {/* the lid: hinged at the left front edge */}
      <group position={[-w / 2, 0, zf]} rotation={[0, lidAng, 0]}>
        <group position={[w / 2, 0, 0]}>
          <mesh position={[0, h / 2, lid - 0.008]} castShadow receiveShadow><boxGeometry args={[w, h, 0.016]} /><meshLambertMaterial map={leather} /></mesh>
          <mesh position={[0, h / 2, 0.0005]} rotation={[0, Math.PI, 0]}><planeGeometry args={[w - 0.03, h - 0.03]} /><meshLambertMaterial map={liningTex()} /></mesh>
          {[[0, h - 0.008], [0, 0.008]].map(([x, y], i) => <mesh key={i} position={[x, y, lid / 2]} castShadow><boxGeometry args={[w, 0.016, lid]} /><meshLambertMaterial map={leather} /></mesh>)}
          {[-1, 1].map((k) => <mesh key={k} position={[k * (w / 2 - 0.008), h / 2, lid / 2]} castShadow><boxGeometry args={[0.016, h, lid]} /><meshLambertMaterial map={leather} /></mesh>)}
          {/* a pocket on the inside of the lid, a strap across it */}
          <mesh position={[0, h * 0.35, 0.0015]} rotation={[0, Math.PI, 0]}><planeGeometry args={[w - 0.08, h * 0.4]} /><meshLambertMaterial color="#73332a" /></mesh>
          {/* piping, the lock plate on the top edge, the brass corners */}
          <B p={[0, h, lid]} s={[w + 0.01, 0.014, 0.014]} c={edge} cast={false} /><B p={[0, 0, lid]} s={[w + 0.01, 0.014, 0.014]} c={edge} cast={false} />
          {[-1, 1].map((k) => <B key={k} p={[k * w / 2, h / 2, lid]} s={[0.014, h + 0.01, 0.014]} c={edge} cast={false} />)}
          <group position={[0, h - 0.04, lid + 0.004]}><B p={[0, 0, 0]} s={[0.09, 0.06, 0.012]} c={brass} /><B p={[0, -0.004, 0.007]} s={[0.012, 0.022, 0.004]} c="#3a2a10" cast={false} /><B p={[0, 0.018, 0.007]} s={[0.07, 0.006, 0.003]} c="#f0d890" cast={false} /></group>
          {[[-1, 0], [1, 0], [-1, 1], [1, 1]].map(([sx, sy], i) => <B key={i} p={[sx * (w / 2 - 0.012), sy * h + (sy ? -0.012 : 0.012), lid - 0.01]} s={[0.04, 0.04, 0.03]} c={brass} />)}
          {/* scuffs and a faded travel label on the outside */}
          <mesh position={[w * 0.24, h * 0.3, lid + 0.0015]} rotation={[0, 0, 0.2]}><planeGeometry args={[0.1, 0.07]} /><meshLambertMaterial color="#d8c8a0" /></mesh>
          <mesh position={[w * 0.24, h * 0.3, lid + 0.002]} rotation={[0, 0, 0.2]}><ringGeometry args={[0.018, 0.024, 20]} /><meshLambertMaterial color="#7a3a2a" /></mesh>
        </group>
      </group>
      {[-0.17, 0.17].map((x) => strap(x))}
      {snap > 0 ? <Halo pos={[0, h - 0.03, d / 2 + 0.03]} r={0.09 * (0.5 + snap)} color="#fff2b8" strength={0.8 * snap} order={6} /> : null}
    </>;
    // carried: hang the case from its handle
    return carry ? <group position={pos} rotation={[0, rotY, swing]}><group position={[0, -(h + 0.05), 0]}>{body}</group></group> : <group position={pos} rotation={[0, rotY, 0]}>{body}</group>;
  };

// ================================================================ books in hand, books in the air
/** AN OPEN BOOK HELD UP TO READ (shot 3), seen from the front of the reader: the two covers in a shallow V, the spine nearest
 *  the lens, the cream page edges showing at the top and sides; origin = the middle of the spine. color = the cover leather;
 *  sigil = the green circle tooled on the covers; spread = how far it is open (0.5 = covers at about 130 degrees). Size of a
 *  real book (0.17 x 0.24 per cover). */
export const HeldBook: React.FC<{pos: V3; color?: string; sigil?: boolean; spread?: number; rotY?: number; rotZ?: number; rotX?: number; size?: [number, number]}> = ({pos, color = '#3e2a22', sigil, spread = 0.5, rotY = 0, rotZ = 0, rotX = 0, size = [0.17, 0.24]}) => {
  const [cw, chh] = size, a = (Math.PI / 2) * (1 - spread * 0.55), cover = leatherTex(color, sigil ? 'held-s' : 'held', false);
  return <group position={pos} rotation={[rotX, rotY, rotZ]}>
    {[-1, 1].map((s) => <group key={s} rotation={[0, s * a, 0]}>
      <mesh position={[s * cw / 2, 0, 0]} castShadow receiveShadow><boxGeometry args={[cw, chh, 0.008]} /><meshLambertMaterial map={cover} /></mesh>
      <mesh position={[s * cw / 2 - s * 0.004, 0, -0.012]} castShadow><boxGeometry args={[cw - 0.008, chh - 0.012, 0.016]} /><meshLambertMaterial color="#efe4c8" /></mesh>
      {[0.3, 0.7].map((v) => <mesh key={v} position={[s * cw * v, 0, 0.0045]}><planeGeometry args={[0.004, chh * 0.9]} /><meshLambertMaterial color="#b08a4a" /></mesh>)}
      {sigil ? <mesh position={[s * cw / 2, 0, 0.0046]}><ringGeometry args={[cw * 0.22, cw * 0.27, 32]} /><meshLambertMaterial color={MAGIC_GREEN.deep} emissive={MAGIC_GREEN.glow} emissiveIntensity={0.15} /></mesh> : null}
    </group>)}
    <mesh position={[0, 0, 0.004]}><boxGeometry args={[0.022, chh + 0.006, 0.01]} /><meshLambertMaterial color={color} /></mesh>
    {[-0.35, 0.35].map((v) => <mesh key={v} position={[0, v * chh, 0.0095]}><planeGeometry args={[0.022, 0.006]} /><meshLambertMaterial color="#c9a24a" /></mesh>)}
  </group>;
};
/** where a book thrown from `a` to `b` is at frame f (it leaves at `start`, lands after `dur` frames): a high arc (peak
 *  `lift` above the higher end), turning one and a half times in the air, then a small bounce on landing. Returns the
 *  position, the rotation for SpellBook's `rot`, and whether it has landed. */
export const bookFlight = (f: number, start: number, dur: number, a: V3, b: V3, lift = 0.5): {pos: V3; rot: V3; landed: boolean; flying: boolean} => {
  const t = (f - start) / dur;
  if (t <= 0) return {pos: a, rot: [0, 0, 0], landed: false, flying: false};
  if (t >= 1) { const k = (f - start - dur) / 4, hop = k < 1 ? Math.sin(k * Math.PI) * 0.03 : 0; return {pos: [b[0], b[1] + hop, b[2]], rot: [0, 0, k < 1 ? Math.sin(k * Math.PI) * 0.15 : 0], landed: true, flying: false}; }
  const e = t, top = Math.max(a[1], b[1]) + lift, y = (1 - e) * (1 - e) * a[1] + 2 * (1 - e) * e * (top * 2 - (a[1] + b[1]) / 2) + e * e * b[1];
  return {pos: [a[0] + (b[0] - a[0]) * e, y, a[2] + (b[2] - a[2]) * e], rot: [Math.sin(e * Math.PI) * 0.6, 0, -e * Math.PI * 3], landed: false, flying: true};
};
/** A FLYING BOOK: SpellBook carried by bookFlight (a, b = where it leaves and lands, its lowest face's centre). */
export const FlyingBook: React.FC<{f: number; start: number; dur: number; a: V3; b: V3; lift?: number; color?: string; sigil?: boolean; size?: V3}> = ({f, start, dur, a, b, lift, color, sigil, size = [0.2, 0.045, 0.27]}) => {
  const q = bookFlight(f, start, dur, a, b, lift);
  return <group position={q.pos} rotation={q.rot}><SpellBook pos={[0, -size[1] / 2, 0]} size={size} color={color} sigil={sigil} /></group>;
};

// ================================================================ the book stand and its turning page (shot 4)
type Spread = 'lieu' | 'cay';
/** the shade in the gutter of an open book: dark at the spine, fading out to both sides */
const gutterTex = () => tex('book-gutter', 128, 8, (c, W, H) => { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(0.42, 'rgba(60,40,20,0.35)'); g.addColorStop(0.5, 'rgba(50,32,16,0.55)'); g.addColorStop(0.58, 'rgba(60,40,20,0.35)'); g.addColorStop(1, 'rgba(60,40,20,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
const PAGE = [0.19, 0.27] as [number, number];
/** a page of the mother's book. lieu-L: hand-written lines and a dose table (ruled grid, numbers in a column, little phial
 *  drawings); lieu-R: lines with a red initial and a margin note. cay-L: a numbered recipe (1 to 6) with alchemical signs
 *  (triangle, circle with a dot, crescent) and a small flask; cay-R: an ink drawing of a medicinal plant with its root,
 *  leaves and flowers, small hand-written labels pointing at each part, a pressed leaf stuck on with a strip of paper. */
const pageTex = (k: `${Spread}-${'L' | 'R'}`) => tex(`stand-page-${k}`, 570, 810, (c, W, H) => {
  const r = rnd(k.length * 5 + (k.includes('cay') ? 3 : 1) + (k.endsWith('R') ? 7 : 0));
  c.fillStyle = '#efe2c0'; c.fillRect(0, 0, W, H); for (let q = 0; q < 500; q++) { c.fillStyle = `rgba(140,100,50,${0.03 + r() * 0.05})`; c.fillRect(r() * W, r() * H, 3 + r() * 10, 1 + r() * 2); }
  const inner = k.endsWith('L') ? W : 0, g = c.createLinearGradient(inner, 0, inner === 0 ? 60 : W - 60, 0); g.addColorStop(0, 'rgba(90,60,30,0.35)'); g.addColorStop(1, 'rgba(90,60,30,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const ink = '#3a2416', scribble = (x0: number, y: number, x1: number, wob = 4) => { c.strokeStyle = 'rgba(58,36,22,0.85)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, y); for (let x = x0; x < x1; x += 10) c.lineTo(x, y + Math.sin(x * 0.3 + y) * wob - (r() < 0.07 ? 8 : 0)); c.stroke(); };
  c.lineCap = 'round';
  if (k === 'lieu-L') { for (let j = 0; j < 6; j++) scribble(60, 80 + j * 34, W - 60 - r() * 60); c.strokeStyle = ink; c.lineWidth = 2.5; const tx = 60, ty = 330, cw = (W - 120) / 3; for (let j = 0; j <= 6; j++) { c.beginPath(); c.moveTo(tx, ty + j * 44); c.lineTo(W - 60, ty + j * 44); c.stroke(); } for (let j = 0; j <= 3; j++) { c.beginPath(); c.moveTo(tx + j * cw, ty); c.lineTo(tx + j * cw, ty + 264); c.stroke(); }
    c.font = `bold 30px ${HAND}`; c.fillStyle = ink; c.textAlign = 'center'; for (let j = 1; j < 6; j++) { c.fillText(String(j), tx + cw / 2, ty + j * 44 + 32); c.fillText(`${j * 3} giọt`, tx + cw * 1.5, ty + j * 44 + 32); }
    for (let j = 1; j < 6; j++) { const x = tx + cw * 2.5, y = ty + j * 44 + 22; c.strokeStyle = ink; c.lineWidth = 2; c.strokeRect(x - 8, y - 12, 16, 22); c.fillStyle = ['#6a9a5a', '#7a5a9a', '#c8902e', '#5a8aa0', '#9a4a3a'][j - 1]; c.fillRect(x - 6, y - 2, 12, 11); }
    for (let j = 0; j < 4; j++) scribble(60, 640 + j * 34, W - 70 - r() * 80); }
  if (k === 'lieu-R') { c.fillStyle = '#9a2a20'; c.font = `bold 90px Georgia, serif`; c.textAlign = 'left'; c.fillText('L', 50, 150); for (let j = 0; j < 3; j++) scribble(130, 90 + j * 34, W - 60); for (let j = 0; j < 14; j++) scribble(50, 200 + j * 34, W - 60 - (j % 5 === 4 ? 200 : r() * 40)); c.strokeStyle = 'rgba(154,42,32,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(W - 40, 300); c.lineTo(W - 40, 420); c.stroke(); }
  if (k === 'cay-L') { c.fillStyle = ink; c.font = `bold 34px ${HAND}`; c.textAlign = 'left';
    for (let j = 0; j < 6; j++) { const y = 90 + j * 96; c.fillText(`${j + 1}.`, 46, y + 10); scribble(100, y, W - 70 - r() * 60); scribble(100, y + 34, W - 120 - r() * 100);
      c.strokeStyle = '#7a2a20'; c.lineWidth = 3; const sx = W - 60, sy = y + 4; if (j % 3 === 0) { c.beginPath(); c.moveTo(sx - 14, sy + 12); c.lineTo(sx, sy - 14); c.lineTo(sx + 14, sy + 12); c.closePath(); c.stroke(); } else if (j % 3 === 1) { c.beginPath(); c.arc(sx, sy, 13, 0, 7); c.stroke(); c.beginPath(); c.arc(sx, sy, 3, 0, 7); c.fillStyle = '#7a2a20'; c.fill(); c.fillStyle = ink; } else { c.beginPath(); c.arc(sx, sy, 13, 0.6, 5.7); c.stroke(); } }
    c.strokeStyle = ink; c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2 - 14, 680); c.lineTo(W / 2 - 14, 710); c.lineTo(W / 2 - 46, 770); c.lineTo(W / 2 + 46, 770); c.lineTo(W / 2 + 14, 710); c.lineTo(W / 2 + 14, 680); c.stroke(); c.fillStyle = 'rgba(90,150,90,0.5)'; c.beginPath(); c.moveTo(W / 2 - 36, 750); c.lineTo(W / 2 + 36, 750); c.lineTo(W / 2 + 44, 768); c.lineTo(W / 2 - 44, 768); c.fill(); }
  if (k === 'cay-R') {
    const cx = W * 0.48; c.strokeStyle = ink; c.lineWidth = 3.5;
    // root
    for (let j = 0; j < 7; j++) { c.beginPath(); c.moveTo(cx, 610); c.quadraticCurveTo(cx + (j - 3) * 26, 660, cx + (j - 3) * 40 + (r() - 0.5) * 20, 720 + r() * 40); c.stroke(); }
    c.fillStyle = '#c8a878'; c.beginPath(); c.ellipse(cx, 615, 26, 14, 0, 0, 7); c.fill(); c.stroke();
    // stem, leaves (veined, shaded on one half), flowers
    c.beginPath(); c.moveTo(cx, 610); c.quadraticCurveTo(cx - 20, 400, cx + 6, 170); c.stroke();
    [[480, -1], [420, 1], [350, -1], [290, 1], [230, -1]].forEach(([y, s]) => { const x = cx - 10 + (610 - y) * -0.03; c.fillStyle = 'rgba(110,150,80,0.55)'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * 70, y - 50, x + s * 130, y - 20); c.quadraticCurveTo(x + s * 70, y + 20, x, y); c.fill(); c.stroke(); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + s * 124, y - 20); c.stroke(); for (let q = 1; q < 5; q++) { c.beginPath(); c.moveTo(x + s * q * 25, y - q * 4); c.lineTo(x + s * (q * 25 + 14), y - q * 4 - 16); c.stroke(); } c.lineWidth = 3.5; });
    [[cx + 6, 160], [cx - 40, 190], [cx + 44, 200]].forEach(([x, y]) => { c.beginPath(); c.moveTo(cx, 230); c.lineTo(x, y); c.stroke(); for (let q = 0; q < 5; q++) { const a = (q / 5) * 6.28; c.fillStyle = '#b86a9a'; c.beginPath(); c.ellipse(x + Math.cos(a) * 12, y + Math.sin(a) * 12, 10, 6, a, 0, 7); c.fill(); c.stroke(); } c.fillStyle = '#e8c040'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); });
    // labels with leader lines
    c.font = `bold 28px ${HAND}`; c.fillStyle = ink; c.lineWidth = 1.8; [['hoa', 60, 120, cx - 40, 185], ['lá', 60, 330, cx - 90, 350], ['thân', W - 140, 470, cx + 2, 470], ['rễ', W - 110, 700, cx + 50, 700]].forEach(([t, x, y, px, py]) => { c.textAlign = 'left'; c.fillText(t as string, x as number, y as number); c.beginPath(); c.moveTo((x as number) + 30, (y as number) + 6); c.lineTo(px as number, py as number); c.stroke(); });
    // a pressed leaf taped on in the top right
    c.save(); c.translate(W - 110, 90); c.rotate(0.4); c.fillStyle = '#8a9a4a'; c.beginPath(); c.ellipse(0, 0, 50, 22, 0, 0, 7); c.fill(); c.strokeStyle = '#5a6a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-50, 0); c.lineTo(50, 0); c.stroke(); c.restore(); c.fillStyle = 'rgba(240,232,210,0.85)'; c.fillRect(W - 140, 70, 60, 20);
  }
  // foxing, a candle-wax drip at the bottom
  for (let q = 0; q < 30; q++) blob(c, r() * W, r() * H, 6 + r() * 20, 'rgba(150,100,40,0.12)');
  blob(c, W * (k.endsWith('L') ? 0.2 : 0.8), H * 0.95, 30, 'rgba(240,230,200,0.6)');
});
/** THE FOLDING BOOK STAND with the open book (shot 4), its foot at `pos` (on the chest's lid), the book leaning back on it
 *  so the pages face the lens almost upright. from / to = the spread before and after the turn; flip 0..1 = a page turning
 *  from right to left about the spine (it curls a little and shades as it stands edge-on). The stand: two crossed slats
 *  (the X) seen at the sides, a back board, a lip at the bottom holding the book; walnut. */
export const BookStand: React.FC<{pos: V3; rotY?: number; from?: Spread; to?: Spread; flip?: number; lean?: number; color?: string}> = ({pos, rotY = 0, from = 'lieu', to = 'cay', flip = 0, lean = 0.28, color = '#4a2a1c'}) => {
  const [pw, ph] = PAGE, wood = '#5a3a24', f = Math.min(1, Math.max(0, flip)), turning = f > 0 && f < 1;
  const leftMap = pageTex(`${f >= 1 ? to : from}-L`), rightMap = pageTex(`${f > 0 ? to : from}-R`);
  const ang = -f * Math.PI;
  return <group position={pos} rotation={[0, rotY, 0]}>
    {/* the X legs at each side, the base slat, the back board and the lip */}
    {[-1, 1].map((s) => <group key={s} position={[s * (pw + 0.02), 0, -0.06]}>
      <B p={[0, 0.12, 0]} s={[0.018, 0.27, 0.02]} c={wood} r={[0.75, 0, 0]} /><B p={[0, 0.12, 0]} s={[0.018, 0.27, 0.02]} c={wood} r={[-0.75, 0, 0]} />
      <B p={[0, 0.12, 0]} s={[0.024, 0.024, 0.024]} c="#c9a24a" />
    </group>)}
    <B p={[0, 0.012, -0.03]} s={[pw * 2 + 0.08, 0.024, 0.2]} c={wood} />
    <group position={[0, 0.03, 0.02]} rotation={[-lean, 0, 0]}>
      <B p={[0, ph / 2 + 0.02, -0.02]} s={[pw * 2 + 0.04, ph + 0.04, 0.014]} c={wood} />
      <B p={[0, 0.012, 0.02]} s={[pw * 2 + 0.06, 0.024, 0.05]} c={wood} />
      {/* the book: covers behind, the page block, the two open pages bowed toward the spine */}
      <group position={[0, ph / 2 + 0.028, 0.0]}>
        {[-1, 1].map((s) => <mesh key={s} position={[s * (pw / 2 + 0.006), 0, -0.01]}><boxGeometry args={[pw + 0.014, ph + 0.014, 0.008]} /><meshLambertMaterial color={color} /></mesh>)}
        {/* the page block sits wholly BEHIND the open pages (front face at z -0.0005), a little smaller and darker so its
            edge never shows as a bright strip; the two pages lie flat in front of it (no tilt about their centre, which sank
            the inner halves behind the block); a soft gutter shade runs down the spine over both pages */}
        {[-1, 1].map((s) => <mesh key={s} position={[s * (pw / 2 - 0.002), 0, -0.0065]}><boxGeometry args={[pw - 0.006, ph - 0.004, 0.012]} /><meshLambertMaterial color="#cbbd98" /></mesh>)}
        <mesh position={[-pw / 2, 0, 0.002]} receiveShadow><planeGeometry args={[pw, ph]} /><meshLambertMaterial map={leftMap} /></mesh>
        <mesh position={[pw / 2, 0, 0.002]} receiveShadow><planeGeometry args={[pw, ph]} /><meshLambertMaterial map={rightMap} /></mesh>
        <mesh position={[0, 0, 0.0035]}><planeGeometry args={[0.05, ph]} /><meshBasicMaterial map={gutterTex()} transparent depthWrite={false} /></mesh>
        {/* the turning page: front = the old right page, back = the new left page */}
        {turning ? <group position={[0, 0, 0.006]} rotation={[0, ang, 0]}>
          <group position={[pw / 2, 0, 0]} rotation={[0, 0, 0]}>
            <mesh position={[0, 0, 0]} castShadow><planeGeometry args={[pw, ph]} /><meshLambertMaterial map={pageTex(`${from}-R`)} side={THREE.FrontSide} /></mesh>
            <mesh position={[0, 0, -0.0008]} rotation={[0, Math.PI, 0]}><planeGeometry args={[pw, ph]} /><meshLambertMaterial map={pageTex(`${to}-L`)} side={THREE.FrontSide} /></mesh>
          </group>
        </group> : null}
      </group>
    </group>
  </group>;
};
