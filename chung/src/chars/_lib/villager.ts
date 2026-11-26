import {singlePicture} from '../../puppet';
import type {PoseOf, Beat} from '../../puppet';

/** A VILLAGER as a single-picture puppet (public/village): calm drawing plus a shocked one (sel: {pic: 'shock'}).
 *  Blink lids sit on the drawn eyes; it tilts, leans, squashes, hops, shivers and fake-walks. Other villagers: copy this
 *  with their file pair (v-3/v-8, v-1/v-9, v-4/v-11, v-5/v-12, v-6/v-10) and measure the eye centres. */
export const VILLAGER = singlePicture({
  name: 'villager', skin: '#f7c299',
  src: 'village/v-2.png', size: [195, 446], eyes: [{at: [68, 92], r: [29, 29]}, {at: [124, 92], r: [29, 29]}],
  alts: {shock: {src: 'village/v-7.png', size: [198, 450], eyes: [{at: [72, 85], r: [29, 29]}, {at: [125, 85], r: [29, 29]}]}},
});
/** the villager's poses and beats with the real drawing ids, so a typo fails in tsc: const BEATS: VillagerBeat[] = [...] */
export type VillagerPose = PoseOf<{view: 'front'; sel: {pic: 'base' | 'shock'}}>;
export type VillagerBeat = VillagerPose & Pick<Beat, 'f' | 'note' | 'blink' | 'n' | 'dip'>;
