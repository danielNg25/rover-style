/** puppet/template: types of the character TEMPLATE (tools/art/template/*.json) and of a sliced character's MANIFEST
 *  (public/<id>/manifest.json, written by tools/art/template/slice.py). Read CHARACTERS.md. */
export type Slot = {
  box: number[];                 // the slot on the sheet [x0, y0, x1, y1]
  scale: number;                 // sheet px per canvas px in this slot
  tpl: number[];                 // bbox of the mannequin's piece on the sheet
  canvas: number[];              // [x, y, w, h] of that piece on the character canvas (screen-left or centre instance)
  anchor: string[];              // how generated art is put on the canvas: x 'c' (centred on the mannequin piece) or 'fixed' (same sheet position); y 't', 'b', 'c' or 'fixed'
  fit: string;                   // 'h' / 'w': the art is scaled so that its height / width equals the mannequin piece (joints stay closed); 'none': sheet scale is trusted
  optional: boolean;
  pivots: Record<string, number[]>; // joints inside the slot, sheet px
  words: string;                 // what the generation prompt says about this slot
};
export type TplPiece = {name: string; slot: string; view: string; mirror: boolean; pivot: number[]; parent: string | null; z: number; part: string; group?: string; option?: string};
export type Template = {
  name: string; sheet: number[]; key: string; canvas: number[]; groundY: number; centerX: number; height: number;
  slots: Record<string, Slot>; pieces: TplPiece[]; groups: Record<string, {default: string; options: string[]}>;
  joints?: Record<string, number[]>; face?: Record<string, number | number[]>; proportions?: Record<string, number>;
  tolerance?: unknown; mirror_rule?: string;
};
export type ManifestSlot = {file: string; size: number[]; art: number[]; dev: {dx: number; dy: number; w: number; h: number}; ok: boolean};
export type Manifest = {
  id: string; template: string; sheet: string; sheet_sha256: string; key: string; pad: number;
  slots: Record<string, ManifestSlot>; absent: string[]; colours: Record<string, string>;
  measure?: {pupilDark?: number; propGrip?: boolean; forehead?: {in_window_px: number; of_cap: number; trimmed: boolean}}; // what slice.py measured on the art
  options?: {build?: string; rest?: string; iris?: string; brow?: string};   // the character's own defaults (slice.py --brief / flags), read by fromTemplate
  adjust: Record<string, {dx?: number; dy?: number; scale?: number}>; // hand corrections in canvas px (slice.py keeps them)
};
