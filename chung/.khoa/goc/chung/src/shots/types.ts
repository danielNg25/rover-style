import React from 'react';
/** One shot of the film. `Scene` renders everything INSIDE the ThreeCanvas: camera, lights, post, set, characters.
 *  f = frame inside the shot (0 .. len-1), t = f / (len - 1). */
export type ShotDef = {id: string; len: number; bg?: string; Scene: React.FC<{f: number; t: number}>};
