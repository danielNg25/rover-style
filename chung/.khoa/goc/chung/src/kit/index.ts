/** THE KIT: the single import surface for shot builders. Read KIT.md. Import from 'src/kit' only; do not import
 *  src/three/Post, src/shots/flat2d, bkit, sprite or space in new shots. */
export * from './math';
export * from './timing';
export * from './camera';
export {Box, Cyl, Cone, Ball, Poly, Rect, RoundRect, Disc, Arc, Diamond, Stroke, bezier, circlePts, refSpace, RefPlane, SEE_THROUGH, StageCtx} from './shapes';
export type {Flat, RefSpace} from './shapes';
export {Card, Piece, useTex} from './pictures';
export {SignText, NameTag, KIT_FONT} from './text';
export * from './fx';
export * from './stage';
export * from './liveness';
// jointed picture puppets (unchanged engine): rig definition, renderer, world position of a point on a piece
export {ImageRig, rigPoint, useTextures} from '../three/ImageRig';
export type {ImgPart, ImgRigDef} from '../three/ImageRig';
export type {PartPose} from '../three/SvgRig';
