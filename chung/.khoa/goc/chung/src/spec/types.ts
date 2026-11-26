import type {PlaceSpec} from '../lib3/places';
import type {Palette} from '../mould/draw';
import type {Beat} from '../mould/gestures';

/** THE SHOT SHEET: an episode as plain data (JSON), written from a narration script by a planner and turned into
 *  pictures by src/spec/Episode.tsx. Nothing in it is code; every name comes from a library:
 *  places (lib3/places), poses, body moves and faces (mould/gestures, mould/expr), camera moves (below). */
export type CastSpec = {build: 'adult' | 'child'; hair: 'level' | 'sweep' | 'bald'; backHair?: 'bob' | 'long'; outfit?: 'vest' | 'coat'; beard?: string; palette: Palette; face?: string; look?: [number, number]};
export type CameraMove = 'push' | 'pull' | 'down' | 'up' | 'left' | 'right' | 'hold';
export type ShotSpec = {
  len: number;                              // frames at 24 fps
  size: 'wide' | 'medium' | 'close';        // reference shares of all shots: wide about 40 %, medium 40 %, close 20 %
  on?: string | string[];                   // who the shot is on (medium, close); default: everybody
  camera: CameraMove;                       // constant speed from the first frame to the cut (rule B8)
  say?: string;                             // the narration words this shot covers (kept for the record)
};
export type SceneSpec = {
  id: string; place: string; gain?: number;   // gain: the light multiplier tools/classnorms.py asks for, per scene
  cast: string[];                           // staging order: with 3 or more, the first stands in the foreground with their back to us
  acting: Record<string, {role: 'speaker' | 'listener'; dir?: 1 | -1; beats: Beat[]}>;   // frames count from the scene's first frame, across its cuts
  shots: ShotSpec[];
};
export type EpisodeSpec = {id: string; places: Record<string, PlaceSpec>; cast: Record<string, CastSpec>; scenes: SceneSpec[]};
