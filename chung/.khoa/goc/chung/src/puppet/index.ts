/** THE PUPPET SYSTEM: generic flat cut-out characters. Read PUPPET.md. Rig data lives in src/chars/_lib/. */
export * from './types';
export {solve, solveView, checkPose, canvasPoint, puppetPoint, puppetAttach, mix, fullPose, picked, viewOf, PIECE_Z} from './pose';
export type {Solved} from './pose';
export {Puppet} from './Puppet';
export {act, beatFrames, beatSpans, lintBeats, trackedPoints, STEP_LIMIT} from './act';
export type {Beat, ActOpts, CastEntry} from './act';
export {walk, fakeWalk, glide, quadGait, hop, shiver, talk} from './cycles';
export {singlePicture} from './single';
export type {SinglePic} from './single';
