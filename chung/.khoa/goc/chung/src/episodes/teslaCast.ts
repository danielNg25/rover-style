import type {Spec} from '../mould/draw';
import {EXPR} from '../mould/expr';
import {POSES} from '../mould/gestures';
import {SKINS, skinClearOf} from '../mould/palettes';

/** The cast of the "Tesla và Edison" passage (episodes/tesla-danh-sach-canh.md): one definition of each person, shared by every
 *  set and shot of the passage, so a character looks the same everywhere. Heights in metres.
 *  Recognised from afar by height, hair and clothes: Edison greying hair, white shirt and charcoal waistcoat; Tesla the tallest,
 *  black swept-back hair, three outfits; Westinghouse a full brown beard and a long dark coat.
 *  A figure in a 'coat' must carry its arm poses with show: true (withPose drops the flag): use coatArms(). */
const arms = {armL: {...POSES.idle[0]}, armR: {...POSES.idle[1]}};
/** arm poses for a coat figure: withPose() loses `show`, so a coat figure takes its arms through this */
export const coatArms = (pose: keyof typeof POSES = 'idle') => ({armL: {...POSES[pose][0], show: true}, armR: {...POSES[pose][1], show: true}});
export const HEIGHT = {edison: 1.74, tesla: 1.86, westinghouse: 1.8, extra: 1.7, extraShort: 1.62};

/** Thomas Edison, 1882-1886: premature grey hair, clean-shaven, white shirt, charcoal waistcoat, trousers a step darker and
 *  browner than the waistcoat (so the two do not merge). His look: smirk, narrowed eyes, sure of himself. */
export const EDISON: Spec = {outfit: 'vest', hair: 'level', build: 'adult', longLegs: true, expr: {...EXPR.smirk}, ...arms,
  palette: {...SKINS.fair, hair: '#a9a49a', hairLine: '#c4bfb4', brow: '#6f6a62', shirt: '#f1ede2', shirtEdge: '#d4cebf', shirtRim: '#faf7ee', vest: '#3b3f46', shorts: '#2c2722', shoe: '#1f1b1a', button: '#b9b2a0'}};

const teslaBase = {outfit: 'vest' as const, hair: 'sweep' as const, build: 'adult' as const, longLegs: true, expr: {...EXPR.neutral}, ...arms};
const teslaFace = {...SKINS.porcelain, hair: '#17131a', hairLine: '#38323c', brow: '#17131a'};
/** Nikola Tesla in Edison's works (shots 4-8): white shirt, navy waistcoat, dark grey trousers. */
export const TESLA_LAB: Spec = {...teslaBase, palette: {...teslaFace, shirt: '#f3efe6', shirtEdge: '#d6d0c2', shirtRim: '#fbf8f0', vest: '#26324a', shorts: '#3a3c42', shoe: '#1c1a1d'}};
/** Tesla digging ditches and calling on Westinghouse (shots 9, 10): a faded grey shirt, a worn brown waistcoat, brown-grey
 *  trousers, no jacket. */
export const TESLA_WORN: Spec = {...teslaBase, palette: {...teslaFace, shirt: '#d4cec2', shirtEdge: '#b9b2a4', shirtRim: '#e2ddd2', vest: '#5b4a3a', shorts: '#5f584f', shoe: '#2e2620', button: '#8a7a62'}};
/** Tesla at the fair, 1893 (shot 13): a long black coat with dark lapels (the fur collar in the coat's own dark, so it reads as
 *  lapels and not as a pale fur), white shirt. */
export const TESLA_FAIR: Spec = {...teslaBase, outfit: 'coat', ...coatArms(), palette: {...teslaFace, coat: '#24252c', coatLight: '#30313a', coatDark: '#1a1b21', fur: '#2c2d35', furDark: '#1f2026', trouser: '#1f2024', shoe: '#141316', shirt: '#f3efe6'}};

/** George Westinghouse (40s): dark brown hair swept back, a full beard of brown flecked with grey (the mould has only the full
 *  beard; it stands for his walrus moustache), a long brown-black coat. Calm, then a broad smile. */
export const WESTINGHOUSE: Spec = {outfit: 'coat', hair: 'sweep', beard: '#6b5644', build: 'adult', longLegs: true, expr: {...EXPR.neutral}, ...coatArms(),
  palette: {...SKINS.tan, hair: '#4e3d30', hairLine: '#6a5646', brow: '#3e3026', coat: '#3a2e28', coatLight: '#5c4a3c', coatDark: '#2a221d', fur: '#2a221d', furDark: '#211a16', trouser: '#2a2622', shoe: '#1c1816'}};

/** An extra of the 1880s-1890s (passers-by in the street, the ditch diggers, the crowd at the fair): a grown-up in a long coat
 *  (or a waistcoat for a working man), skin from skinClearOf so it never merges with the hair. No hats: the mould has none. */
export const extra = (coat: string, hair: string, kind: 'sweep' | 'level' | 'bald' = 'level', work = false): Spec => {
  const skin = skinClearOf(hair, coat + hair + kind);
  return work
    ? {outfit: 'vest', hair: kind, build: 'adult', longLegs: true, expr: {...EXPR.neutral}, ...arms,
        palette: {...skin, hair, brow: hair, vest: coat, shirt: '#cfc6b4', shirtEdge: '#b3a993', shirtRim: '#ddd5c4', shorts: '#4f473e', shoe: '#2a2420'}}
    : {outfit: 'coat', hair: kind, build: 'adult', longLegs: true, expr: {...EXPR.neutral}, ...coatArms(),
        palette: {...skin, hair, brow: hair, coat, coatLight: coat, coatDark: coat, fur: coat, furDark: coat, trouser: '#2c2a2c', shoe: '#1f1c1c'}};
};
