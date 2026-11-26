import type {PuppetRig} from '../../puppet';

/** ELEPHANT as DATA (public/savanna a-1..6; placement read from src/shots/savannaAnimals.tsx). Side view facing right.
 *  Four legs from two drawings (near, and a darker far one): drive it with quadGait(ELEPHANT, f). */
const T = '#d9d3cd';
export const ELEPHANT: PuppetRig = {
  name: 'elephant', canvas: [535, 440], groundY: 440, centerX: 260, height: 426,
  pieces: {
    farHind: {src: 'savanna/a-6.png', x: 77, y: 216, w: 102, pivot: [128, 226], z: 0, tint: T},
    farFront: {src: 'savanna/a-6.png', x: 287, y: 216, w: 102, pivot: [338, 226], z: 0, tint: T},
    body: {src: 'savanna/a-1.png', x: 0, y: 0, w: 535, pivot: [260, 230], z: 3, tint: T},
    tail: {src: 'savanna/a-4.png', x: -29.1, y: 60.7, w: 51.7, pivot: [16, 64], parent: 'body', z: 1, tint: T},
    trunk: {src: 'savanna/a-3.png', x: 428, y: 140, w: 97, pivot: [474, 150], parent: 'body', z: 2, tint: T},
    ear: {src: 'savanna/a-2.png', x: 222, y: 22, w: 183, pivot: [398, 44], parent: 'body', z: 4, tint: '#f2ede8'},
    nearHind: {src: 'savanna/a-5.png', x: 28, y: 222, w: 104, pivot: [80, 232], z: 5, tint: T},
    nearFront: {src: 'savanna/a-5.png', x: 240, y: 222, w: 104, pivot: [292, 232], z: 5, tint: T},
  },
  roles: {body: ['body'], quad: {nearHind: 'nearHind', nearFront: 'nearFront', farHind: 'farHind', farFront: 'farFront', body: 'body', tail: 'tail', ear: 'ear', trunk: 'trunk'}},
  rest: {parts: {tail: {rot: -8}, trunk: {rot: -4}}},
  shadow: {r: 250, sy: 0.25},
};
