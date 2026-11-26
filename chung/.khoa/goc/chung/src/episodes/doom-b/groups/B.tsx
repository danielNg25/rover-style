import {KitShot} from '../../../kit';

/* Build group B: Mountain camp (S7, S8 film frames 349-435; S10 480-545). NEEDS NEW ART: sheet 1 (boy front
 * parts) and sheet 2 (boy back view, mother silhouette body and forearms).
 * Built: the set and the three shots live in './B - Mountain camp/' (set.tsx, folk.ts, s7.tsx, s8.tsx, s10.tsx).
 * Beats are frames INSIDE the shot (film frame - f0).
 * S10 must match S9 (group C): take PAIR, BUNDLE and the camera move from ../shared.ts, do not re-derive. */

export {S7} from './B - Mountain camp/s7';
import {S7} from './B - Mountain camp/s7';

export {S8} from './B - Mountain camp/s8';
import {S8} from './B - Mountain camp/s8';

export {S10} from './B - Mountain camp/s10';
import {S10} from './B - Mountain camp/s10';

export const GROUP_B: KitShot[] = [S7, S8, S10];
