import {KitShot} from '../../../kit';
import {S6_SHOT} from "./C - Tower view and king's room/Outlook";
import {S9_SHOT} from "./C - Tower view and king's room/KingRoomBirth";

/* Build group C: Tower view (S6, film frames 305-349) and the king's stone room (S9, 435-480). No new art.
 * Beats are frames INSIDE the shot (film frame - f0). The sets, the scenes and the liveness declarations live in
 * "./C - Tower view and king's room/": Outlook.tsx (S6), KingRoomBirth.tsx (S9), lib.tsx (pixel layers, off-axis push).
 * S9 owns the "before" half of the pair (PAIR, BUNDLE in ../shared.ts) that S10 (group B) must match. */

/** S6 305-349. Tight long-lens view; towers un-build, pines pop in; anchor 'back' at 321 (in-shot 16). */
export const S6: KitShot = S6_SHOT;

/** S9 435-480. King rocks the gold cradle under the pointed canopy; anchor 'Kings' at 443 (in-shot 8). */
export const S9: KitShot = S9_SHOT;

export const GROUP_C: KitShot[] = [S6, S9];
