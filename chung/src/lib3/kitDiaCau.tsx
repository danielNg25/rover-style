import React, {createContext, useContext, useMemo} from 'react';
import * as THREE from 'three';
import {Halo} from './look';
import {rnd, Ctx} from './depth';
import {tex, popScale} from './kitLab';
import {NameTag} from '../kit/text';
import {prog} from '../kit/timing';

/** lib3/kitDiaCau: THE GLOBE (23/11/2026; Daniel after the chapter-5 video: the reference channel shows journeys on a round
 *  Earth turning in space, not on paper maps). Learnt from the reference: a round world in a starry sky, turning, with a
 *  dotted route and a moving dot. Drawn our own way: our continents, palette, clouds and layout.
 *  The globe is a flat DISC (no 3D sphere, by the house rule) painted on a canvas every frame: each pixel of the disc is
 *  turned back into longitude and latitude (orthographic projection, true to the real coasts) and coloured from a painted
 *  world map, so the globe turns correctly as `lon`/`lat` change. Lit from the upper left with a soft night side, a sea
 *  glint, a fresnel rim, an atmosphere halo, drifting clouds.
 *  Overlays (SongLan, DuongDi, Ghim) are children of <DiaCau>: they read its centre and turn with it, and fade out when they
 *  go round the back. Everything stands in the x-y plane facing +z; the camera looks straight at it (`cauEye`). */
type V3 = [number, number, number];
type LL = [number, number];

// ================================================================ the world (lon, lat), coarse but true
const NAM: LL[] = [[-168, 66], [-162, 70], [-156, 71.3], [-140, 69.6], [-128, 70], [-115, 68.5], [-95, 68], [-90, 69], [-82, 66.5], [-86, 63], [-94, 59], [-92.5, 57], [-85, 55.3], [-82, 52.5], [-79, 51.5], [-78.5, 55], [-77, 59], [-78, 62.3], [-73, 62], [-69, 58.5], [-64, 60.3], [-61.8, 57.5], [-59.5, 55.3], [-56, 53.6], [-55.8, 52.2], [-57.2, 51.4], [-60, 50.2], [-64, 50.3], [-66.5, 49.2], [-64.4, 49.1], [-65, 48], [-64.8, 46.8], [-61, 46], [-60, 45.9], [-63.5, 44.6], [-65.8, 43.6], [-67, 44.7], [-70.2, 43.65], [-70.6, 42.65], [-70, 41.6], [-72, 41.3], [-74, 40.5], [-75.1, 38.4], [-76, 37], [-75.5, 35.25], [-77.9, 33.9], [-80.4, 32.4], [-81.4, 30.4], [-80.6, 28.4], [-80.1, 25.8], [-81.2, 25.2], [-82.8, 27.8], [-84.2, 30], [-89, 30.3], [-94, 29.5], [-97.4, 27.8], [-97.7, 24], [-97.2, 21], [-95, 18.6], [-91, 18.6], [-90.4, 21], [-87, 21.5], [-88.3, 18.5], [-88, 16], [-84, 15.8], [-83.4, 12], [-83.6, 10.9], [-81.5, 9], [-79.5, 9.6], [-77.4, 8.6], [-78.5, 7.3], [-80.4, 7.4], [-82, 8.2], [-85.7, 10], [-87.5, 13], [-91.4, 14], [-94.4, 16], [-96.5, 15.7], [-101, 17.3], [-105.5, 20], [-105.6, 23], [-109.5, 26.7], [-112.5, 29.5], [-114.8, 31.5], [-114, 28.5], [-112, 25], [-110, 22.9], [-112.2, 24.8], [-114.5, 27.5], [-117, 30.8], [-118.5, 34], [-120.6, 34.6], [-122.5, 37.7], [-124.2, 40.4], [-124, 46], [-124.7, 48.4], [-123, 49], [-127, 50.5], [-130, 54], [-133, 57.2], [-137, 58.5], [-140, 59.7], [-146, 60.8], [-151.5, 59.2], [-154, 57.5], [-158, 56.5], [-162.5, 55], [-158, 58.5], [-162, 60], [-165, 62.5], [-164.5, 63.2], [-161, 64.5], [-166, 65.3]];
const SAM: LL[] = [[-77.4, 8.6], [-75, 10.8], [-71.5, 12.4], [-68, 10.6], [-63, 10.7], [-60, 8.5], [-57, 6], [-53, 5.5], [-51, 4], [-50, 1.8], [-48.5, -1], [-44.5, -2.5], [-41, -2.9], [-38.5, -3.7], [-35.2, -5.5], [-34.8, -7.5], [-35.3, -9.5], [-37.5, -12.5], [-39, -15], [-39.7, -19.5], [-41, -22], [-44, -23], [-48, -25.6], [-48.6, -28.5], [-51, -31], [-53.4, -33.7], [-55, -34.9], [-57.5, -35], [-57.7, -38.2], [-62, -39], [-62.3, -41], [-65, -42.3], [-65.4, -45], [-67.5, -46.5], [-66, -48], [-69, -51], [-68.4, -53], [-70.5, -55], [-74.5, -52], [-75.3, -48], [-74, -44], [-73.6, -38], [-71.6, -33], [-71.4, -28], [-70.4, -23], [-70.2, -18.4], [-75.5, -15], [-77, -12], [-79.2, -8], [-81.2, -5], [-80, -2.5], [-80.3, 0], [-79, 1.5], [-77.6, 4], [-77.3, 7]];
const EURASIA: LL[] = [[-5.4, 36], [-2, 36.8], [0.2, 38.8], [3.2, 41.9], [3, 43.3], [6.3, 43.1], [8.9, 44.4], [10.5, 43.3], [12.3, 41.7], [15.7, 40], [16.1, 38], [17.2, 39.4], [18.5, 40.2], [16, 41.8], [13.9, 42.8], [12.3, 44.5], [13.6, 45.75], [15.2, 44.3], [18.6, 42.4], [19.4, 41], [20.4, 39.3], [21.6, 37], [23.1, 36.5], [24, 37.7], [22.6, 40.25], [24.4, 40.15], [26.3, 40.1], [26.2, 39.4], [27.3, 37.4], [29.1, 36.6], [32.6, 36.1], [35.8, 36.65], [35.9, 35.4], [35, 33], [34.2, 31.3], [34.9, 29.5], [35, 28], [37, 25], [39, 21.5], [41, 18], [43, 13], [45, 12.8], [49, 14], [52, 15.5], [55, 17.3], [57.5, 18.8], [58.8, 21], [59.8, 22.5], [57, 24], [56.3, 26], [54.5, 24.3], [51.5, 24.5], [51, 26], [50, 26.5], [48.5, 28.5], [48, 30], [50.2, 30], [51.6, 27.8], [54.5, 26.6], [57, 25.8], [61.5, 25.1], [66.5, 25.4], [68, 23.8], [70, 21], [72.8, 19], [73.5, 15.5], [75, 12], [76.5, 8.6], [77.5, 8], [78.2, 8.9], [79.8, 10.3], [80.3, 13.5], [80.2, 15.5], [82.3, 17], [85, 19.5], [87, 21.5], [89, 21.8], [91.5, 22.5], [92.3, 21], [94.3, 18.5], [94.2, 16], [97.6, 16.5], [98.2, 13], [98.5, 9], [100.2, 6.3], [100.4, 4], [101.3, 2.8], [103.5, 1.3], [104.3, 1.4], [103.4, 4.2], [102.3, 6.2], [100.5, 7.5], [100, 12.6], [100.9, 13.5], [102.5, 12.3], [104.5, 10.5], [105, 8.6], [106.7, 10.4], [109.2, 11.6], [109.3, 13.5], [108.5, 15.5], [106.6, 17.5], [105.7, 19], [106.7, 20.8], [108, 21.6], [110.5, 21.2], [113.5, 22.2], [117, 23.5], [119.5, 25.6], [121.5, 28.5], [122, 30.8], [121, 32.5], [119.2, 34.6], [120.5, 36.3], [122.5, 37], [121, 37.8], [118.5, 38.2], [117.7, 39], [119.5, 39.9], [121.5, 40.9], [122.2, 39.5], [124.3, 39.9], [125.4, 37.8], [126.5, 34.5], [129.4, 35.4], [129.6, 37], [128.4, 38.6], [127.6, 39.8], [129.7, 41], [130.8, 42.6], [132.5, 43.2], [135.5, 43.9], [138.2, 46.8], [140.4, 50], [141.4, 53], [137.3, 54], [135.3, 54.8], [140.5, 58], [143, 59.3], [148, 59.4], [152, 59], [155, 59.3], [156.8, 61.6], [160, 61.5], [163.5, 62.4], [160.5, 60], [157, 57.8], [156, 52.5], [158.3, 52.9], [160.2, 54.3], [162.2, 56.2], [163.2, 58.2], [166, 60], [170.5, 60], [174, 61.8], [177.5, 62.6], [179.9, 64.7], [179.9, 68.9], [176, 69.8], [170.6, 70.1], [161, 69.5], [152, 70.9], [143, 72.6], [136, 71.6], [129.7, 71.2], [128, 72.9], [118, 73.6], [113.4, 73.5], [112.8, 75.9], [106, 77.4], [104.3, 77.7], [100, 75.9], [96, 76], [89.3, 75.4], [86.6, 74.6], [87.2, 73.8], [80.6, 73.6], [80.8, 72.4], [75.1, 72.8], [72.8, 70.4], [73.6, 68.4], [69.2, 68.6], [68.5, 71.9], [66.7, 70.7], [66.7, 69.2], [60, 69.5], [54.4, 68.8], [53.7, 68.2], [44.9, 68.6], [43.4, 68.4], [44.2, 66.8], [40, 66.3], [38, 64.9], [36.5, 64.6], [37, 63.8], [35.4, 64.3], [34.8, 65.9], [33.2, 66.6], [34.8, 66.9], [41, 67.5], [39.8, 68.9], [33, 69.4], [30, 69.8], [28, 71], [24, 71], [20, 70], [16.5, 69], [14.5, 67.8], [12.5, 65.8], [10.5, 64.5], [7, 62.6], [5, 61.5], [5, 60], [5.6, 58.5], [6, 58.1], [8, 58.05], [10.4, 59.3], [10.6, 59.85], [11.1, 59.1], [11.9, 57.7], [12.7, 56.6], [12.6, 55.7], [14.2, 55.4], [15.9, 56.1], [16.7, 57.9], [18.9, 59.6], [17.2, 61.3], [17.5, 62.5], [20.5, 63.8], [21.5, 65], [23.3, 65.8], [25.4, 65.1], [24.6, 64.3], [21.5, 62.8], [21.3, 60.6], [22.5, 59.95], [25.6, 60.3], [28.5, 60.55], [30.2, 59.95], [28, 59.5], [23.5, 58.9], [24.4, 58.3], [24.1, 57], [21.6, 57.55], [21, 56.4], [21.2, 55.2], [19.9, 54.95], [18.6, 54.45], [16.6, 54.6], [14.3, 53.95], [12.4, 54.45], [10.9, 54], [9.9, 54.85], [10.6, 57.75], [8.6, 57.1], [8.1, 56], [8.6, 55], [8.6, 53.9], [7.1, 53.6], [4.75, 52.95], [3.6, 51.5], [1.6, 50.95], [1.1, 49.95], [-1.2, 49.35], [-1.9, 49.7], [-1.6, 48.8], [-4.75, 48.4], [-2.5, 47.3], [-1.2, 46.2], [-1.4, 43.6], [-4.5, 43.4], [-8.3, 43.5], [-9.2, 43.2], [-8.8, 41.2], [-9.5, 38.75], [-8.9, 37], [-6.4, 36.8]];
const AFRICA: LL[] = [[-5.9, 35.8], [-6.2, 35.5], [-8.5, 33.2], [-9.8, 30], [-13.2, 27.7], [-16, 23.7], [-17.1, 20.8], [-16.2, 19], [-16.5, 16], [-17.5, 14.7], [-16.7, 12.4], [-15, 11], [-13.3, 9], [-11.4, 6.9], [-8, 4.4], [-5, 5.1], [-2, 4.7], [1, 5.9], [3, 6.3], [4.8, 6.0], [6.1, 4.3], [8.5, 4.5], [9.6, 3], [9.4, 0.5], [9, -1], [11.8, -4.2], [12.2, -6], [13.4, -8.5], [12.4, -13.2], [11.7, -17], [14.5, -22.5], [15.2, -26.8], [17.1, -29], [18.4, -32.8], [18.4, -34.2], [20, -34.8], [22.5, -34], [25.6, -34], [27.5, -33.2], [30, -31.3], [32, -28.9], [32.6, -26], [35.5, -24], [35.5, -21], [37.2, -17.8], [40.5, -15], [40.6, -10.5], [39.5, -7], [39.2, -4.6], [41.6, -1.7], [44, 1.2], [47.9, 4.5], [50.5, 9.5], [51.3, 11.8], [49, 11.3], [45, 10.4], [43.3, 11.6], [42.7, 13.3], [39.5, 15.5], [38.5, 18.1], [37.3, 21], [35.7, 23.9], [34.2, 27], [32.6, 29.9], [32.3, 31.2], [31.6, 31.5], [30.3, 31.5], [29, 30.9], [25.2, 31.6], [23, 32.6], [20.1, 32.3], [19, 30.3], [15.5, 31.5], [15.2, 32.3], [11.1, 33.2], [10.1, 33.8], [11.1, 35.2], [10.9, 35.7], [11.1, 37.05], [9.8, 37.35], [6.4, 37.1], [2.9, 36.8], [0.1, 35.9], [-2.9, 35.3]];
const AUSTRALIA: LL[] = [[113.4, -22], [114.2, -26.3], [115, -29.5], [115.6, -33.6], [117.9, -35.1], [123.5, -33.9], [126, -32.3], [131.2, -31.5], [135.6, -34.8], [137.7, -33], [138.1, -34.9], [140.5, -38], [143.5, -38.8], [146.3, -39.1], [150, -37.5], [151.3, -33.8], [153.1, -30.5], [153.4, -27.5], [150.8, -22.8], [146.3, -19], [145.4, -14.9], [143.6, -14], [142.5, -10.7], [141.6, -13.5], [141.5, -17], [140, -17.7], [137.7, -15.5], [135.5, -14.8], [136.7, -12.3], [132.6, -11.5], [130.2, -12.9], [129.4, -15], [126.9, -13.8], [125, -15.5], [122.4, -17.3], [121.4, -19.5], [118.5, -20.3]];
const ISLES: LL[][] = [
  [[-73, 78], [-60, 82], [-35, 83.5], [-20, 82], [-18, 76], [-22, 70.5], [-26, 68.4], [-34, 66], [-40, 65], [-43, 60], [-48, 61], [-51.5, 64.5], [-53.5, 67], [-54, 70.5], [-58, 75.5], [-66, 76.5]],
  [[-80, 73.5], [-72, 72], [-68, 70], [-64, 67], [-62, 66.5], [-66, 63], [-72, 62.5], [-78, 64], [-74, 66], [-78, 70]],
  [[-24, 65.5], [-22, 66.4], [-16, 66.5], [-13.5, 65.2], [-18, 63.4], [-22.5, 63.8]],
  [[-84.9, 21.9], [-82.5, 23.1], [-81, 23.2], [-77.5, 21.8], [-74.2, 20.3], [-77.3, 19.9], [-79.5, 21.6], [-82.9, 22.4]], [[-74.4, 18.4], [-72.8, 19.9], [-70, 19.7], [-68.4, 18.6], [-71, 18.1]],
  [[-59.3, 47.6], [-56, 47.6], [-53.6, 46.6], [-52.7, 47.5], [-53.5, 49.2], [-55.6, 50.4], [-56.3, 51.5], [-58, 50], [-59.3, 48.3]],
  [[-5.7, 50.05], [-3, 50.6], [0.4, 50.8], [1.4, 51.15], [1.75, 52.7], [0.3, 53.4], [-0.5, 54.4], [-1.6, 55.6], [-2, 57.65], [-3.2, 57.7], [-3.1, 58.6], [-5, 58.6], [-5.6, 57.3], [-5.6, 56.3], [-4.9, 55.7], [-5, 55], [-3.4, 54.4], [-3, 53.4], [-4.7, 52.8], [-4.1, 52], [-5.2, 51.75], [-3.2, 51.45], [-5.1, 50.6]],
  [[-6, 52.1], [-6.2, 54], [-5.7, 54.75], [-7.3, 55.35], [-8.6, 54.6], [-9.9, 54.2], [-9.9, 53.4], [-10.3, 51.95], [-8.6, 51.65]],
  [[49.3, -12], [50.5, -15.5], [49.5, -17.5], [47.5, -24.9], [45.2, -25.5], [43.6, -23], [44.3, -19.5], [44, -17], [46.5, -15.7]],
  [[130, 31.2], [131.5, 31.4], [132, 33.5], [135, 33.5], [137, 34.6], [139, 34.9], [140.9, 35.7], [140.6, 38], [142, 39.5], [141.4, 41.4], [139.9, 40.6], [139.5, 38.2], [137, 36.9], [136, 35.6], [133, 35.5], [131, 34.3]], [[140, 41.5], [141.5, 42.5], [143.3, 42], [145.5, 43.3], [142, 45.4], [141.6, 43.4]],
  [[95.3, 5.6], [98, 4], [103.5, -1], [106, -3.2], [105.9, -5.8], [102.3, -4], [100.3, -1], [98.6, 1.8]], [[105.2, -6.8], [108, -6.3], [111, -6.4], [114.6, -7.7], [112, -8.3], [108.5, -7.8], [106, -7.3]],
  [[109, 1.5], [110, 1.7], [113, 3.2], [115.5, 5.2], [117, 7], [119, 5], [118, 1.2], [116.5, -1.5], [116, -3.8], [114.5, -3.5], [111, -3], [110.2, -1.6], [109.1, 0]],
  [[131, -1.3], [134, -1], [138, -1.5], [141, -2.6], [145.8, -4.9], [147.6, -6.1], [147.8, -8], [146, -8.1], [143.3, -9.1], [141, -9.1], [138.5, -8.3], [137.8, -5.2], [134.5, -4], [132.6, -4]],
  [[120.6, 18.5], [122.3, 18.4], [122.2, 16], [121.5, 14.3], [123, 13.8], [124, 12.5], [122.5, 13.5], [120.6, 14.6], [119.9, 16]], [[122, 7], [125.5, 9.8], [126.6, 7.2], [125.4, 5.6], [123.5, 7.8]],
  [[144.6, -40.7], [148.3, -40.9], [148, -43.2], [146, -43.6]], [[172.7, -34.4], [174.6, -36.5], [176, -37.6], [178.5, -37.7], [177, -39.5], [176.5, -41], [174.8, -41.3], [174.6, -39.8], [173.8, -39.2], [174.6, -38]],
  [[172.7, -40.5], [174.3, -41.7], [173, -43.8], [171.2, -44.5], [169, -46.6], [166.5, -46], [168.3, -44], [170.5, -43], [172, -41.5]],
  [[79.9, 9.8], [81.8, 7.5], [81.2, 6.1], [80, 6.5]], [[120.1, 23], [121.9, 25], [121.4, 22]],
  [[12.4, 38.1], [15.6, 38.3], [15.1, 37.3], [14.3, 36.8], [12.4, 37.8]], [[8.4, 39], [9.6, 39.15], [9.8, 40.9], [9.2, 41.25], [8.2, 40.9]], [[8.6, 41.6], [9.4, 41.6], [9.5, 42.5], [9.4, 43], [8.6, 42.5]],
  [[23.5, 35.5], [26.3, 35.2], [24.8, 34.95]], [[-78.3, 18.4], [-76.2, 18.0], [-76.8, 17.7]], [[-67.2, 18.5], [-65.6, 18.4], [-65.8, 18.0], [-67.2, 18.0]],
  [[-128.4, 50.8], [-125, 50.3], [-123.3, 48.4], [-124.8, 48.6]], [[108.6, 20], [111, 20.1], [110.4, 18.2], [108.7, 18.6]], [[142, 54.3], [143.3, 53.2], [143.6, 49.3], [142.5, 46], [141.9, 49], [141.7, 52]],
  [[10.5, 79.6], [18, 80.3], [27, 80], [22, 78.2], [17, 76.6], [13.5, 77.5]], [[51.5, 71.5], [57, 70.8], [58, 73.5], [69, 76.5], [61.5, 76.2], [55, 74]],
  [[119.5, 0.8], [125, 1.5], [123.3, -0.9], [121.5, -1.8], [123.3, -4.2], [122, -5.4], [120.3, -2.9], [120.6, 0.4]],
];
const ANTARCTICA: LL[] = [[-180, -90], [-180, -78], [-160, -77], [-140, -75], [-120, -73.5], [-100, -73], [-80, -73], [-68, -70], [-60, -64], [-57, -63.5], [-62, -66], [-66, -72], [-60, -76], [-40, -78], [-25, -75], [-10, -71], [0, -70], [20, -70], [40, -69], [60, -67], [80, -67], [100, -66], [120, -66.5], [140, -66.7], [160, -70], [170, -72], [165, -78], [180, -78], [180, -90]];
const WATERS: LL[][] = [
  [[28, 41.6], [27.6, 42.6], [28.65, 44.3], [29.7, 45.6], [30.6, 46.4], [33.5, 45.9], [33.6, 44.4], [36.5, 45.3], [38.2, 47.1], [37.3, 44.9], [39.5, 43.6], [41.6, 41.6], [40.4, 41], [36, 41.7], [33.4, 42], [31.2, 41.1], [29.1, 41.2]],
  [[47, 44.5], [49, 46.4], [51.5, 47], [53, 45.3], [51, 44.5], [52.8, 41.5], [54, 37.5], [50.2, 37.2], [49, 38.5], [49.6, 40.4], [47.6, 42.9]],
  [[-92, 46.8], [-89, 48], [-85, 47.5], [-84.6, 46.5], [-87, 46.5], [-90, 46.6]], [[-87.5, 41.7], [-86.2, 43.5], [-85.5, 45.8], [-87.8, 44.5]], [[-84, 45.9], [-82.5, 45.3], [-81.7, 43.2], [-82.5, 43], [-83.5, 44.0]],
  [[-83.4, 41.7], [-81.5, 41.5], [-79, 42.8], [-81, 42.2]], [[-79.8, 43.3], [-76.2, 43.5], [-76.4, 44.2], [-79.2, 43.6]],
];
/** mountain chains (painted as darker brown ridges with a lit edge, snow on the high ones) */
const RANGES: {pts: LL[]; snow?: boolean}[] = [
  {pts: [[-150, 62], [-135, 60], [-125, 55], [-118, 50], [-113, 45], [-108, 40], [-106, 35], [-104, 30], [-101, 24]], snow: true},
  {pts: [[-75, 8], [-78, 0], [-76, -10], [-70, -18], [-69, -28], [-71, -38], [-73, -48]], snow: true},
  {pts: [[-84.5, 34.5], [-80, 37.5], [-77, 40.5], [-73, 43.5]]},
  {pts: [[5.8, 45], [9, 46.4], [13.5, 47], [15, 47.2]], snow: true}, {pts: [[17.5, 49.2], [21.5, 49.3], [25.4, 47.2], [25.6, 45.6], [22.3, 45]]}, {pts: [[-1.5, 43], [2.6, 42.4]]},
  {pts: [[39.5, 43.8], [43.5, 42.8], [47, 41.5]], snow: true}, {pts: [[70, 36], [75, 35], [80, 32], [85, 28.5], [90, 28], [96, 28.5]], snow: true}, {pts: [[59, 50], [60, 55], [59.5, 60], [61, 65], [64, 68]]},
  {pts: [[-8, 31], [-3, 33], [3, 35], [9, 36]]}, {pts: [[6.6, 58.8], [9, 61], [14, 65], [18, 68.5]], snow: true}, {pts: [[30, 37.3], [36, 37.8], [42, 38.8], [48, 37], [56, 37.5]]}, {pts: [[80, 42], [90, 43], [100, 47]]},
  {pts: [[146, -37], [148, -33], [151, -28], [146, -20]]}, {pts: [[29, -27], [30, -30], [28, -32]]},
];
/** [lon, lat, half-width, half-height] patches */
const DESERTS: [number, number, number, number][] = [[2, 24, 18, 7], [24, 23, 10, 6], [46, 23, 8, 6], [105, 42, 12, 3.5], [60, 41, 8, 4], [127, -25, 12, 6], [20, -24, 6, 5], [-113, 33, 5, 4], [-70, -24, 3, 6], [70, 27, 4, 3]];
const FORESTS: [number, number, number, number][] = [[-62, -5, 14, 7], [20, 0, 9, 5], [105, 5, 10, 8], [-75, 52, 22, 5], [-120, 58, 14, 5], [90, 60, 40, 5], [30, 58, 14, 4], [-84, 37, 6, 4], [10, 49, 8, 3], [80, 22, 6, 4], [115, 28, 6, 4], [-47, -20, 6, 6]];

// ================================================================ the painted world map (equirectangular) and the clouds
const WM = 2048, HM = 1024;
const toXY = ([lon, lat]: LL, W: number, H: number): [number, number] => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
const blob = (c: Ctx, x: number, y: number, rad: number, col: string) => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
/** the world as a flat picture: sea deep blue-teal, paler in a wide band along every coast; land in several tones (green
 *  by latitude, ochre deserts, dark forests, brown ranges with snow, white ice caps), mottled; a fine darker coast line.
 *  Alpha 255 everywhere; the blue channel is kept above red on water (the globe uses that to put the sun's glint on sea). */
export const worldMapCanvas = (() => { let cv: HTMLCanvasElement | null = null; return () => {
  if (cv) return cv; cv = document.createElement('canvas'); cv.width = WM; cv.height = HM; const c = cv.getContext('2d')!, r = rnd(77);
  const path = (pts: LL[]) => { const p = new Path2D(); pts.forEach((q, i) => { const [x, y] = toXY(q, WM, HM); if (i) p.lineTo(x, y); else p.moveTo(x, y); }); p.closePath(); return p; };
  const lands = [NAM, SAM, EURASIA, AFRICA, AUSTRALIA, ANTARCTICA, ...ISLES].map(path), waters = WATERS.map(path);
  /** an irregular flat polygon (7-9 straight sides) round a centre, for a cut-paper patch */
  const shard = (x: number, y: number, rx: number, ry: number, col: string) => { const n = 7 + Math.floor(r() * 3), a0 = r() * 6.28; c.beginPath(); for (let k = 0; k < n; k++) { const a = a0 + (k / n) * 6.28, q = 0.65 + r() * 0.45; const px = x + Math.cos(a) * rx * q, py = y + Math.sin(a) * ry * q; if (k) c.lineTo(px, py); else c.moveTo(px, py); } c.closePath(); c.fillStyle = col; c.fill(); };
  // sea: one flat blue, a few paler flat shards, a flat shallow band along the coasts (hard edges, no blur)
  c.fillStyle = '#2a6596'; c.fillRect(0, 0, WM, HM);
  for (let k = 0; k < 60; k++) shard(r() * WM, r() * HM, 40 + r() * 120, 20 + r() * 60, r() < 0.5 ? '#3172a3' : '#255f8f');
  c.lineJoin = 'round'; c.strokeStyle = '#3f86b4'; c.lineWidth = 16; lands.forEach((p) => c.stroke(p)); c.strokeStyle = '#5a9cc4'; c.lineWidth = 6; lands.forEach((p) => c.stroke(p));
  // land: flat green, cut-paper patches (lighter plains, dark forests, ochre deserts, grey-green tundra, white ice), no gradient
  c.save(); const all = new Path2D(); lands.forEach((p) => all.addPath(p)); c.clip(all);
  c.fillStyle = '#7ea65a'; c.fillRect(0, 0, WM, HM);
  for (let k = 0; k < 260; k++) shard(r() * WM, HM * (0.15 + r() * 0.7), 14 + r() * 40, 10 + r() * 26, ['#8cb264', '#6f9a50', '#94b86a'][Math.floor(r() * 3)]);
  const band = (lat0: number, lat1: number, col: string) => { const [, y0] = toXY([0, lat0], WM, HM), [, y1] = toXY([0, lat1], WM, HM); c.beginPath(); c.moveTo(0, y1); for (let x = 0; x <= WM; x += 24) c.lineTo(x, y1 + (r() - 0.5) * 18); c.lineTo(WM, y0); for (let x = WM; x >= 0; x -= 24) c.lineTo(x, y0 + (r() - 0.5) * 18); c.closePath(); c.fillStyle = col; c.fill(); };
  band(56, 68, '#8fa576'); band(66, 90, '#b9c2a6'); band(-90, -60, '#b9c2a6');
  const patches = (list: [number, number, number, number][], cols: string[]) => list.forEach(([lo, la, rx, ry]) => { const [x, y] = toXY([lo, la], WM, HM), sx = (rx / 360) * WM, sy = (ry / 180) * HM; shard(x, y, sx, sy, cols[0]); for (let k = 0; k < 4; k++) shard(x + (r() - 0.5) * sx, y + (r() - 0.5) * sy, sx * (0.3 + r() * 0.3), sy * (0.3 + r() * 0.3), cols[1 + (k % (cols.length - 1))]); });
  patches(DESERTS, ['#d7b468', '#c9a058', '#e2c482']); patches(FORESTS, ['#4f8646', '#447a3e', '#5c9450']);
  band(72, 90, '#f2f4f2'); band(-90, -66, '#eef2f4');
  // mountains: rows of small flat triangles, lit face left, shadow face right, a white tip on the snowy ranges
  RANGES.forEach(({pts, snow}) => { const xy = pts.map((q) => toXY(q, WM, HM)); for (let i = 0; i < xy.length - 1; i++) { const L = Math.hypot(xy[i + 1][0] - xy[i][0], xy[i + 1][1] - xy[i][1]), n = Math.max(1, Math.round(L / 9)); for (let k = 0; k < n; k++) { const t = (k + r() * 0.5) / n, x = xy[i][0] + (xy[i + 1][0] - xy[i][0]) * t + (r() - 0.5) * 6, y = xy[i][1] + (xy[i + 1][1] - xy[i][1]) * t + (r() - 0.5) * 5, w = 5 + r() * 4, h = 7 + r() * 6;
    c.fillStyle = '#c4a272'; c.beginPath(); c.moveTo(x - w, y + h * 0.4); c.lineTo(x, y - h * 0.6); c.lineTo(x, y + h * 0.4); c.fill(); c.fillStyle = '#8a6844'; c.beginPath(); c.moveTo(x, y - h * 0.6); c.lineTo(x + w, y + h * 0.4); c.lineTo(x, y + h * 0.4); c.fill();
    if (snow) { c.fillStyle = '#f6f6f2'; c.beginPath(); c.moveTo(x - w * 0.35, y - h * 0.25); c.lineTo(x, y - h * 0.6); c.lineTo(x + w * 0.35, y - h * 0.25); c.fill(); } } } });
  c.restore();
  // greenland and the ice shelves white with a grey-blue shadow shard
  [ISLES[0]].forEach((pts) => { const p = path(pts); c.save(); c.clip(p); c.fillStyle = '#f2f4f4'; c.fillRect(0, 0, WM, HM); const [x, y] = toXY([-38, 72], WM, HM); shard(x + 20, y + 10, 50, 40, '#d4dde6'); c.restore(); });
  // inland seas and lakes flat, the coast line a fine dark edge
  waters.forEach((p) => { c.fillStyle = '#3172a3'; c.fill(p); });
  c.strokeStyle = '#2b4a2a'; c.lineWidth = 2.2; lands.forEach((p) => c.stroke(p)); waters.forEach((p) => c.stroke(p));
  return cv; }; })();
/** the clouds as flat cut-paper pieces: white shards with a pale blue-grey shadow shard offset down-right, in a loose belt
 *  near the equator and longer drifts in the middle latitudes; sharp edges (alpha 0 or 1). Drawn wrap-around. */
export const cloudCanvas = (() => { let cv: HTMLCanvasElement | null = null; return () => {
  if (cv) return cv; const W = 1024, H = 512; cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d')!, r = rnd(31);
  c.clearRect(0, 0, W, H);
  const piece = (x: number, y: number, rx: number, ry: number) => { const n = 7, a0 = r() * 6.28, pts = Array.from({length: n}, (_, k) => { const a = a0 + (k / n) * 6.28, q = 0.7 + r() * 0.4; return [Math.cos(a) * rx * q, Math.sin(a) * ry * q]; });
    [[3, 3, '#c9d6e6'], [0, 0, '#fbfdff']].forEach(([dx, dy, col]) => [-W, 0, W].forEach((o) => { c.beginPath(); pts.forEach(([px, py], k) => (k ? c.lineTo(x + o + px + (dx as number), y + py + (dy as number)) : c.moveTo(x + o + px + (dx as number), y + py + (dy as number)))); c.closePath(); c.fillStyle = col as string; c.fill(); })); };
  for (let k = 0; k < 26; k++) piece(r() * W, H * (0.47 + (r() - 0.5) * 0.08), 10 + r() * 16, 4 + r() * 5);
  [0.27, 0.71].forEach((v) => { for (let k = 0; k < 7; k++) { const x0 = r() * W, y0 = H * (v + (r() - 0.5) * 0.12); for (let j = 0; j < 4; j++) piece(x0 + j * (16 + r() * 8), y0 + (r() - 0.5) * 6, 14 + r() * 12, 4 + r() * 3); } });
  for (let k = 0; k < 10; k++) piece(r() * W, H * (r() < 0.5 ? 0.14 : 0.86), 18 + r() * 20, 3 + r() * 3);
  return cv; }; })();

// ================================================================ the globe
const D2R = Math.PI / 180;
/** where (lon, lat) falls on a globe of radius 1 seen from above (lon0, lat0): [x, y, z]; z > 0 = the side facing us */
export const cauChieu = (lon: number, lat: number, lon0: number, lat0: number): V3 => {
  const p = lat * D2R, p0 = lat0 * D2R, dl = (lon - lon0) * D2R;
  return [Math.cos(p) * Math.sin(dl), Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(dl), Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(dl)];
};
type CauState = {pos: V3; r: number; lon: number; lat: number};
const CauCtx = createContext<CauState>({pos: [0, 0, 0], r: 1, lon: 0, lat: 0});
/** the world position of (lon, lat) on the globe in context, lifted `lift` (share of r) off the surface; and how much it is
 *  in front (0 behind the limb, 1 facing us) */
export const useCauDiem = () => { const g = useContext(CauCtx); return (lon: number, lat: number, lift = 0): {p: V3; vis: number} => { const [x, y, z] = cauChieu(lon, lat, g.lon, g.lat), k = g.r * (1 + lift); return {p: [g.pos[0] + x * k, g.pos[1] + y * k, g.pos[2] + 0.02 + Math.max(0, z) * 0.001], vis: Math.min(1, Math.max(0, (z + 0.02) / 0.18))}; }; };
const S = 1280, RPX = S / 2 / 1.1;   // canvas size, the disc's radius in it (the rest is atmosphere)
/** THE GLOBE. pos = centre, r = radius (world units); lon, lat = the point at the middle of the disc (change them by frame
 *  to turn it: the Earth turns west to east, so lon INCREASES as the camera follows something eastward); f = frame (the
 *  clouds drift, cloud = their opacity 0..1); sun = light direction [x, y, z] (default upper left, a soft night side on the
 *  lower right). Children (SongLan, DuongDi, Ghim) follow it. */
export const DiaCau: React.FC<{lon: number; lat: number; r?: number; pos?: V3; f?: number; cloud?: number; drift?: number; sun?: V3; children?: React.ReactNode}> =
  ({lon, lat, r = 1, pos = [0, 0, 0], f = 0, cloud = 1, drift = 0.08, sun = [-0.78, 0.42, 0.46], children}) => {
    const t = useMemo(() => { const cv = document.createElement('canvas'); cv.width = S; cv.height = S; const tt = new THREE.CanvasTexture(cv); tt.colorSpace = THREE.SRGBColorSpace; return tt; }, []);
    const src = useMemo(() => { const w = worldMapCanvas(), cl = cloudCanvas(); return {w: w.getContext('2d')!.getImageData(0, 0, WM, HM).data, cl: cl.getContext('2d')!.getImageData(0, 0, cl.width, cl.height).data, cw: cl.width, ch: cl.height}; }, []);
    useMemo(() => {
      const cv = t.image as HTMLCanvasElement, c = cv.getContext('2d')!; c.clearRect(0, 0, S, S);
      const img = c.createImageData(S, S), d = img.data, cx = S / 2, cy = S / 2, p0 = lat * D2R, sp0 = Math.sin(p0), cp0 = Math.cos(p0);
      const L = (() => { const n = Math.hypot(...sun); return sun.map((v) => v / n); })(), Hh = (() => { const h = [L[0], L[1], L[2] + 1], n = Math.hypot(...h); return h.map((v) => v / n); })();
      const cOff = f * drift;   // cloud drift in degrees
      for (let py = Math.floor(cy - RPX) - 1; py <= cy + RPX + 1; py++) for (let px = Math.floor(cx - RPX) - 1; px <= cx + RPX + 1; px++) {
        const nx = (px + 0.5 - cx) / RPX, ny = -(py + 0.5 - cy) / RPX, d2 = nx * nx + ny * ny; if (d2 > 1) continue;
        const nz = Math.sqrt(1 - d2), la = Math.asin(Math.max(-1, Math.min(1, nz * sp0 + ny * cp0))), lo = lon * D2R + Math.atan2(nx, nz * cp0 - ny * sp0);
        let u = ((lo / D2R + 180) % 360 + 360) % 360 / 360, v = (90 - la / D2R) / 180;
        const mi = (Math.min(HM - 1, Math.floor(v * HM)) * WM + Math.min(WM - 1, Math.floor(u * WM))) * 4;
        let R = src.w[mi], G = src.w[mi + 1], B = src.w[mi + 2]; const water = B > R + 25;
        // clouds: flat pieces (white or their shadow tone), on or off
        const cu = ((lo / D2R + cOff + 180) % 360 + 360) % 360 / 360, ci = (Math.min(src.ch - 1, Math.floor(v * src.ch)) * src.cw + Math.min(src.cw - 1, Math.floor(cu * src.cw))) * 4;
        if (src.cl[ci + 3] > 128 && cloud > 0.5) { R = src.cl[ci]; G = src.cl[ci + 1]; B = src.cl[ci + 2]; }
        // the night side: ONE flat shade with a sharp curved edge (a crescent of shadow), cool blue
        const lam = nx * L[0] + ny * L[1] + nz * L[2];
        if (lam < 0.05) { R = R * 0.55 + 10; G = G * 0.58 + 16; B = B * 0.62 + 44; }
        void water; void Hh;
        const edge = Math.min(1, (1 - Math.sqrt(d2)) * RPX * 1.5);   // a crisp limb
        const o = (py * S + px) * 4; d[o] = Math.min(255, R); d[o + 1] = Math.min(255, G); d[o + 2] = Math.min(255, B); d[o + 3] = 255 * edge;
      }
      c.putImageData(img, 0, 0);
      // the atmosphere: one thin clear ring just outside the limb, and a second fainter one
      c.lineWidth = RPX * 0.022; c.strokeStyle = '#9fd0f2'; c.beginPath(); c.arc(cx, cy, RPX * 1.03, 0, 7); c.stroke();
      c.lineWidth = RPX * 0.01; c.strokeStyle = 'rgba(159,208,242,0.45)'; c.beginPath(); c.arc(cx, cy, RPX * 1.075, 0, 7); c.stroke();
      t.needsUpdate = true;
    }, [lon, lat, f, cloud, drift, sun[0], sun[1], sun[2]]);
    const size = r * (S / RPX);
    return <CauCtx.Provider value={{pos, r, lon, lat}}>
      <mesh position={pos} renderOrder={2}><planeGeometry args={[size, size]} /><meshBasicMaterial map={t} transparent depthWrite={false} toneMapped={false} /></mesh>
      {children}
    </CauCtx.Provider>;
  };
/** where the camera stands so a globe of radius r at pos fills `share` of the frame height (a little off centre with dx, dy) */
export const cauEye = (r = 1, share = 0.72, pos: V3 = [0, 0, 0], dx = 0, dy = 0): V3 => [pos[0] + dx, pos[1] + dy, pos[2] + (2 * r) / share / 0.4986];
/** an even, unhurried progress 0..1 between two frames (soft start and soft stop): for a ship or for turning the globe */
export const tienDo = (f: number, a: number, b: number) => { const q = Math.min(1, Math.max(0, (f - a) / (b - a))); return q * q * (3 - 2 * q); };

// ================================================================ space behind it
/** SPACE IN CUT PAPER: a deep indigo sky (not black), banks of nebula cut as flat layered shapes in three tones of indigo
 *  and violet, small dot stars and four-pointed stars, a small cut-paper crescent moon upper right; a plane `w` x `h` set behind the globe. Twinkling stars on top
 *  (they breathe by frame). Cut paper: flat shapes in two or three tones, sharp edges. */
const spaceTex = (seed: number) => tex(`space-paper-${seed}`, 2048, 1152, (c, W, H) => {
  const r = rnd(seed); c.fillStyle = '#2b3878'; c.fillRect(0, 0, W, H);
  /** a flat cut shape: a wobbly band of straight segments across the sky */
  const cloud = (x: number, y: number, w: number, h: number, col: string) => { c.beginPath(); const n = 14; for (let k = 0; k <= n; k++) { const t = k / n; c.lineTo(x + t * w, y - h * (0.4 + 0.6 * Math.sin(t * Math.PI)) * (0.75 + r() * 0.35)); } for (let k = n; k >= 0; k--) { const t = k / n; c.lineTo(x + t * w, y + h * 0.35 * Math.sin(t * Math.PI) * (0.6 + r() * 0.5)); } c.closePath(); c.fillStyle = col; c.fill(); };
  // nebula banks: three tones of indigo and violet layered, the lightest on top, sharp edges
  ([[-100, 0.32, 1300, 220, ['#34428a', '#3d4f9a', '#4859a8']], [900, 0.78, 1300, 260, ['#38388a', '#43409a', '#504aaa']], [1300, 0.25, 900, 160, ['#32448c', '#3c529c']], [-200, 0.92, 900, 180, ['#363c86', '#414898']]] as [number, number, number, number, string[]][]).forEach(([x, v, w, h, cols]) => cols.forEach((col, k) => cloud(x + k * 60, v * H + k * 14, w - k * 160, h - k * 50, col)));
  // stars: small dots, and small four-pointed stars
  for (let k = 0; k < 700; k++) { c.fillStyle = r() < 0.2 ? '#ffe9c2' : r() < 0.4 ? '#cfe0ff' : '#ffffff'; c.globalAlpha = 0.45 + r() * 0.5; const q = r() < 0.9 ? 1.2 + r() * 1.3 : 2.6; c.fillRect(r() * W, r() * H, q, q); } c.globalAlpha = 1;
  for (let k = 0; k < 30; k++) { const x = r() * W, y = r() * H, L = 6 + r() * 9; c.fillStyle = '#fdfaf0'; c.beginPath(); c.moveTo(x, y - L); c.lineTo(x + L * 0.22, y - L * 0.22); c.lineTo(x + L, y); c.lineTo(x + L * 0.22, y + L * 0.22); c.lineTo(x, y + L); c.lineTo(x - L * 0.22, y + L * 0.22); c.lineTo(x - L, y); c.lineTo(x - L * 0.22, y - L * 0.22); c.closePath(); c.fill(); }
  // a small cut-paper crescent moon, upper right: pale disc, the dark part cut off, two craters, a pale ring
  const mx = W * 0.87, my = H * 0.17, mr = H * 0.05; c.fillStyle = '#3a4688'; c.beginPath(); c.arc(mx, my, mr * 1.5, 0, 7); c.fill();
  c.fillStyle = '#efe8cf'; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill(); c.fillStyle = '#d6cdb0'; c.beginPath(); c.arc(mx - mr * 0.3, my + mr * 0.2, mr * 0.2, 0, 7); c.fill(); c.beginPath(); c.arc(mx - mr * 0.1, my - mr * 0.4, mr * 0.13, 0, 7); c.fill();
  c.fillStyle = '#3a4688'; c.beginPath(); c.arc(mx + mr * 0.55, my - mr * 0.15, mr * 0.95, 0, 7); c.fill();
});
const twinkleTex = () => tex('space-twinkle-4', 64, 64, (c, W, H) => { c.clearRect(0, 0, W, H); const x = W / 2, y = H / 2, L = W * 0.46; c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x, y - L); c.lineTo(x + L * 0.18, y - L * 0.18); c.lineTo(x + L, y); c.lineTo(x + L * 0.18, y + L * 0.18); c.lineTo(x, y + L); c.lineTo(x - L * 0.18, y + L * 0.18); c.lineTo(x - L, y); c.lineTo(x - L * 0.18, y - L * 0.18); c.closePath(); c.fill(); });
export const NenVuTru: React.FC<{f?: number; w?: number; h?: number; z?: number; seed?: number; twinkle?: number}> = ({f = 0, w = 16, h = 9, z = -4, seed = 3, twinkle = 28}) => {
  const stars = useMemo(() => { const r = rnd(seed + 50); return Array.from({length: twinkle}, () => [(r() - 0.5) * w, (r() - 0.5) * h, 0.6 + r() * 0.8, r() * 6.28, 0.12 + r() * 0.2] as const); }, [seed, twinkle, w, h]);
  return <group position={[0, 0, z]}>
    <mesh><planeGeometry args={[w, h]} /><meshBasicMaterial map={spaceTex(seed)} toneMapped={false} /></mesh>
    {stars.map(([x, y, s, ph, sp], i) => { const k = 0.45 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(f * sp + ph), 2); return <mesh key={i} position={[x, y, 0.01]} scale={[s * k, s * k, 1]} renderOrder={1}><planeGeometry args={[w * 0.008, w * 0.008]} /><meshBasicMaterial map={twinkleTex()} transparent opacity={k} depthWrite={false} toneMapped={false} /></mesh>; })}
  </group>;
};

// ================================================================ things that ride on the globe
/** a thin stroke along a list of [point, visibility], as short quads (hidden where it goes round the back) */
const Stroke: React.FC<{pts: {p: V3; vis: number}[]; width: number; color: string; opacity?: number; order?: number; dash?: [number, number]}> = ({pts, width, color, opacity = 1, order = 6, dash}) => <>
  {pts.slice(0, -1).map((a, i) => { const b = pts[i + 1]; if (dash && i % (dash[0] + dash[1]) >= dash[0]) return null; const v = Math.min(a.vis, b.vis) * opacity; if (v <= 0.01) return null; const dx = b.p[0] - a.p[0], dy = b.p[1] - a.p[1], L = Math.hypot(dx, dy); if (L < 1e-6) return null;
    return <mesh key={i} position={[(a.p[0] + b.p[0]) / 2, (a.p[1] + b.p[1]) / 2, Math.max(a.p[2], b.p[2])]} rotation={[0, 0, Math.atan2(dy, dx)]} renderOrder={order}><planeGeometry args={[L + width * 0.6, width]} /><meshBasicMaterial color={color} transparent opacity={v} depthWrite={false} toneMapped={false} /></mesh>; })}
</>;
/** the points of a small circle of angular radius a (degrees) round (lon, lat) */
const smallCircle = (lon: number, lat: number, a: number, n = 120): LL[] => {
  const p = lat * D2R, l = lon * D2R, ar = a * D2R; return Array.from({length: n + 1}, (_, i) => { const b = (i / n) * Math.PI * 2, la = Math.asin(Math.sin(p) * Math.cos(ar) + Math.cos(p) * Math.sin(ar) * Math.cos(b)), lo = l + Math.atan2(Math.sin(b) * Math.sin(ar) * Math.cos(p), Math.cos(ar) - Math.sin(p) * Math.sin(la)); return [lo / D2R, la / D2R]; });
};
/** RIPPLES SPREADING over the globe from (lon, lat): from frame `start` a new ring every `every` frames (count rings), each
 *  grows to `reach` degrees over `life` frames and fades; red-orange with a soft lighter twin inside. Rings follow the
 *  curve of the Earth and vanish round its back. Use: "the word spread as far as America" (from Eastern Europe, reach ~70). */
export const SongLan: React.FC<{f: number; lon: number; lat: number; start?: number; every?: number; count?: number; life?: number; reach?: number; color?: string; width?: number}> =
  ({f, lon, lat, start = 0, every = 8, count = 5, life = 34, reach = 70, color = '#ff7a3a', width = 0.018}) => {
    const at = useCauDiem(), g = useContext(CauCtx);
    return <>{Array.from({length: count}, (_, k) => { const age = f - (start + k * every); if (age < 0 || age > life) return null; const q = age / life, a = 1.5 + q * reach, fade = Math.min(1, (1 - q) / 0.35) * Math.min(1, age / 3);   // full strength until the last third, so a ring is still clear when it arrives
      const pts = smallCircle(lon, lat, a).map(([lo, la]) => at(lo, la));
      return <group key={k}><Stroke pts={pts} width={g.r * width * (1.2 - q * 0.5)} color={color} opacity={fade} order={7} /><Stroke pts={smallCircle(lon, lat, Math.max(0.5, a - 2.5)).map(([lo, la]) => at(lo, la))} width={g.r * width * 0.6} color="#ffd2a0" opacity={fade * 0.6} order={6} /></group>; })}
    </>;
  };
/** the great-circle path from a to b (lon, lat), n points, lifted in an arch (lift = share of r at the middle) */
const arcPts = (a: LL, b: LL, n: number, lift: number) => {
  const v = (q: LL): V3 => { const p = q[1] * D2R, l = q[0] * D2R; return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)]; };
  const A = v(a), B = v(b), om = Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])));
  return Array.from({length: n + 1}, (_, i) => { const t = i / n, s1 = om < 1e-6 ? 1 - t : Math.sin((1 - t) * om) / Math.sin(om), s2 = om < 1e-6 ? t : Math.sin(t * om) / Math.sin(om), x = A[0] * s1 + B[0] * s2, y = A[1] * s1 + B[1] * s2, z = A[2] * s1 + B[2] * s2;
    return {ll: [Math.atan2(y, x) / D2R, Math.asin(z / Math.hypot(x, y, z)) / D2R] as LL, lift: lift * Math.sin(t * Math.PI)}; });
};
/** a little steamship seen side on, bow to the RIGHT (flip for sailing left): dark hull with a red band, a cream deck house
 *  with portholes, one red funnel, a puff of smoke; a white bow wave */
const shipTex = () => tex('cau-ship-paper', 512, 320, (c, W, H) => { c.clearRect(0, 0, W, H); c.lineJoin = 'miter';
  const P2 = (pts: number[][], col: string) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = col; c.fill(); };
  // smoke: three flat cut puffs (octagons) trailing back over the stern, two tones each
  [[150, 70, 34], [104, 46, 26], [66, 30, 19]].forEach(([x, y, rr]) => { const oct = (dx: number, dy: number, q: number) => Array.from({length: 8}, (_, k) => [x + dx + Math.cos((k / 8) * 6.28 + 0.3) * q, y + dy + Math.sin((k / 8) * 6.28 + 0.3) * q * 0.8]); P2(oct(3, 4, rr), '#b9c2cf'); P2(oct(0, 0, rr * 0.92), '#eef2f6'); });
  // funnel: red with a black band, its shadow side darker
  P2([[204, 196], [196, 104], [244, 104], [248, 196]], '#c8342a'); P2([[226, 196], [222, 104], [244, 104], [248, 196]], '#9a2620'); P2([[194, 104], [246, 104], [246, 120], [195, 120]], '#1e1814');
  // deck house: cream, a darker roof line, round portholes
  P2([[128, 196], [128, 156], [372, 156], [372, 196]], '#f2e6c8'); P2([[120, 160], [380, 160], [380, 150], [120, 150]], '#6a4630'); c.fillStyle = '#2a1a10'; [160, 204, 248, 292, 336].forEach((x) => { c.beginPath(); c.arc(x, 177, 9, 0, 7); c.fill(); });
  // mast and a pennant
  P2([[318, 156], [322, 60], [328, 60], [326, 156]], '#3a2a1e'); P2([[328, 62], [370, 72], [328, 82]], '#e8b830');
  // hull: dark, a red waterline band, the bow raked to the right, a lit top edge
  P2([[40, 196], [480, 196], [440, 262], [76, 262]], '#2b2420'); P2([[40, 196], [480, 196], [476, 204], [44, 204]], '#6a5a4e'); P2([[66, 246], [450, 246], [440, 262], [76, 262]], '#c8342a');
  // the bow wave and a wake: flat white shards
  P2([[452, 262], [500, 238], [508, 252], [470, 270]], '#ffffff'); P2([[60, 262], [10, 252], [18, 270], [70, 270]], '#e6eef6');
});
/** THE ROUTE: a dotted path (great circle, a little arched) from `from` to `to` (lon, lat), drawn up to `p` 0..1 with a
 *  glowing head; `mover` rides at p: 'tau' = the little steamship (always level: it only bobs and dips its bow a touch on
 *  the swell, never turns on end), 'cham' = a red dot with a glow, null = nothing. Pass p from `tienDo` for an even pace. */
export const DuongDi: React.FC<{from: LL; to: LL; p: number; f?: number; mover?: 'tau' | 'cham' | null; lift?: number; color?: string; dots?: number; size?: number}> =
  ({from, to, p, f = 0, mover = 'tau', lift = 0.06, color = '#ff5a3a', dots = 0, size = 0.75}) => {
    const at = useCauDiem(), g = useContext(CauCtx);
    // one dot every 2.4 degrees of arc (dots = 0) so the dots stay apart: a DOTTED line, not a stroke
    const n = useMemo(() => { if (dots) return dots; const A = arcPts(from, to, 1, 0); const v = (q: LL) => [Math.cos(q[1] * D2R) * Math.cos(q[0] * D2R), Math.cos(q[1] * D2R) * Math.sin(q[0] * D2R), Math.sin(q[1] * D2R)]; const a = v(A[0].ll), b = v(A[1].ll); return Math.max(8, Math.round(Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) / D2R / 2.4)); }, [from[0], from[1], to[0], to[1], dots]);
    const path = useMemo(() => arcPts(from, to, n, lift), [from[0], from[1], to[0], to[1], n, lift]);
    const dotsN = n;
    const q = Math.min(1, Math.max(0, p)), upto = q * dotsN;
    const head = (() => { const i = Math.min(dotsN - 1, Math.floor(upto)), t = upto - i, a = path[i], b = path[Math.min(dotsN, i + 1)], A = at(a.ll[0], a.ll[1], a.lift), B = at(b.ll[0], b.ll[1], b.lift); return {p: [A.p[0] + (B.p[0] - A.p[0]) * t, A.p[1] + (B.p[1] - A.p[1]) * t, Math.max(A.p[2], B.p[2])] as V3, vis: Math.min(A.vis, B.vis), dir: Math.sign(B.p[0] - A.p[0]) || 1}; })();
    const s = g.r * size, bob = Math.sin(f * 0.5) * s * 0.04, dip = Math.sin(f * 0.5 + 0.9) * 0.05;
    return <>
      {path.map((pt, i) => { if (i > upto) return null; const A = at(pt.ll[0], pt.ll[1], pt.lift); if (A.vis <= 0.01) return null; return <group key={i} position={A.p}><mesh renderOrder={7}><circleGeometry args={[g.r * 0.019, 14]} /><meshBasicMaterial color="#4a1610" transparent opacity={A.vis} depthWrite={false} toneMapped={false} /></mesh><mesh position={[0, 0, 0.0005]} renderOrder={8}><circleGeometry args={[g.r * 0.0135, 14]} /><meshBasicMaterial color={color} transparent opacity={A.vis} depthWrite={false} toneMapped={false} /></mesh></group>; })}
      {q > 0 && q < 1 && head.vis > 0.05 ? <Halo pos={[head.p[0], head.p[1], head.p[2] + 0.001]} r={g.r * 0.05} color="#ffb07a" strength={0.6 * head.vis} order={8} /> : null}
      {mover === 'cham' && q > 0 ? <group position={[head.p[0], head.p[1], head.p[2] + 0.002]}><Halo pos={[0, 0, 0]} r={g.r * 0.07} color="#ff6a4a" strength={0.7 * head.vis} order={8} /><mesh renderOrder={9}><circleGeometry args={[g.r * 0.022, 20]} /><meshBasicMaterial color="#e8302a" transparent opacity={head.vis} toneMapped={false} /></mesh></group> : null}
      {mover === 'tau' && q > 0 ? <group position={[head.p[0], head.p[1] + s * 0.24 + bob, head.p[2] + 0.003]} rotation={[0, 0, dip * head.dir]} scale={[head.dir, 1, 1]}>
        <mesh renderOrder={10}><planeGeometry args={[s, s * 0.625]} /><meshBasicMaterial map={shipTex()} transparent opacity={head.vis} depthWrite={false} toneMapped={false} /></mesh>
      </group> : null}
    </>;
  };
/** A PIN on the globe at (lon, lat): 'cham' = a glowing dot, 'co' = a small red flag on a pole; pops at frame `at` (popScale);
 *  label = the channel's name tag (lower-case bold words with a curved arrow to the pin, `NameTag` of src/kit/text.tsx),
 *  its arrow drawn over `write` frames. */
/** 24/11/2026 (chương 15 cảnh 13, 24): thêm hai kiểu ghim. 'lua' = ngọn lửa cắt giấy ba sắc (cam đỏ, cam, vàng) lắc theo khung, vài tàn lửa ngay trên đỉnh; `tat` = khung ngọn lửa bắt đầu tắt (xẹp trong 6 khung rồi hết).
 *  'thap' = tháp nhỏ không tên: thân thang hình, mái nhọn, một ô sáng, đứng trên đế hẹp; `color` là màu thân. Hai kiểu cũ không đổi. */
const fShape = (pts: number[][]) => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath(); return new THREE.ShapeGeometry(sh); };
const LUA_GEO = [
  fShape([[-0.5, 0], [-0.62, 0.55], [-0.3, 1.0], [-0.34, 1.6], [0.0, 2.2], [0.12, 1.5], [0.42, 1.1], [0.6, 0.5], [0.5, 0]]),
  fShape([[-0.32, 0], [-0.38, 0.45], [-0.12, 0.85], [-0.1, 1.3], [0.08, 1.0], [0.34, 0.55], [0.3, 0]]),
  fShape([[-0.16, 0], [-0.2, 0.3], [0.0, 0.62], [0.2, 0.28], [0.16, 0]]),
];
const THAP_GEO = [
  fShape([[-0.5, 0], [-0.34, 3.0], [0.34, 3.0], [0.5, 0]]), fShape([[0.05, 0], [0.12, 3.0], [0.34, 3.0], [0.5, 0]]),
  fShape([[-0.5, 3.0], [0, 4.4], [0.5, 3.0]]), fShape([[0, 3.0], [0, 4.4], [0.5, 3.0]]), fShape([[-0.12, 1.9], [0.12, 1.9], [0.12, 2.4], [-0.12, 2.4]]),
];
export const Ghim: React.FC<{lon: number; lat: number; f: number; at?: number; kind?: 'cham' | 'co' | 'lua' | 'thap'; color?: string; label?: string; write?: number; side?: 1 | -1; size?: number; tat?: number}> =
  ({lon, lat, f, at = 0, kind = 'cham', color = '#ffcf4a', label, write = 10, side = 1, size = 1, tat}) => {
    const g = useContext(CauCtx), q = useCauDiem()(lon, lat), tatK = tat === undefined ? 1 : Math.max(0, Math.min(1, 1 - (f - tat) / 6)), s = popScale(f, at, 6, 0.4) * q.vis * tatK, u = g.r * 0.04 * size;
    if ((kind === 'lua' || kind === 'thap') && s > 0) {
      const k = u * 1.15, sw = Math.sin(f * 0.55 + lon) * 0.07, fl = 1 + Math.sin(f * 0.8 + lat) * 0.1;
      return <group position={q.p}>
        <group scale={[s, s, 1]}>
          {kind === 'lua' ? <>
            <Halo pos={[0, k * 0.9, 0.001]} r={u * 3.6} color="#ff7a30" strength={0.55} order={8} />
            <group scale={[k * 0.8, k * 0.8 * fl, 1]} rotation={[0, 0, sw]}>{LUA_GEO.map((geo, i) => <mesh key={i} geometry={geo} position={[0, 0, 0.001 * (i + 1)]} renderOrder={9 + i}><meshBasicMaterial color={['#e6401c', '#ff9a2e', '#ffe48a'][i]} toneMapped={false} /></mesh>)}</group>
            {[0, 1, 2].map((i) => { const a = ((f * 0.07 + i / 3) % 1), x = Math.sin(i * 5 + f * 0.1) * u * 0.9; return <mesh key={i} position={[x, k * (2.1 + a * 1.9), 0.01]} renderOrder={12}><planeGeometry args={[u * 0.2, u * 0.2]} /><meshBasicMaterial color="#ffd27a" transparent opacity={1 - a} toneMapped={false} /></mesh>; })}
          </> : <>
            <Halo pos={[0, k * 1.6, 0.001]} r={u * 2.4} color="#bfe6ff" strength={0.28} order={8} />
            <group scale={[k * 0.85, k * 0.85, 1]}>{THAP_GEO.map((geo, i) => <mesh key={i} geometry={geo} position={[0, 0, 0.001 * (i + 1)]} renderOrder={9 + i}><meshBasicMaterial color={[color === '#ffcf4a' ? '#d9dde4' : color, '#aeb6c2', '#4a5666', '#323c4a', '#ffd86a'][i]} toneMapped={false} /></mesh>)}</group>
            <mesh position={[0, -u * 0.06, 0.0005]} renderOrder={9}><planeGeometry args={[u * 1.6, u * 0.18]} /><meshBasicMaterial color="#e9f2fb" toneMapped={false} /></mesh>
          </>}
        </group>
      </group>;
    }
    if (kind === 'lua' || kind === 'thap') return null;
    if (s <= 0) return null;
    const lh = g.r * 0.11;
    return <group position={q.p}>
      <group scale={[s, s, 1]}>
        <Halo pos={[0, 0, 0.001]} r={u * 3} color={color} strength={0.6} order={8} />
        {kind === 'cham' ? <><mesh renderOrder={9}><circleGeometry args={[u * 1.25, 20]} /><meshBasicMaterial color="#3a2010" toneMapped={false} /></mesh><mesh position={[0, 0, 0.001]} renderOrder={10}><circleGeometry args={[u, 20]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh></>
          : <><mesh position={[0, u * 2.2, 0.001]} renderOrder={9}><planeGeometry args={[u * 0.25, u * 4.4]} /><meshBasicMaterial color="#3a2010" toneMapped={false} /></mesh>
            <mesh position={[u * 1.1, u * 3.6, 0.002]} renderOrder={10}><planeGeometry args={[u * 2, u * 1.3]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh></>}
      </group>
      {label ? (() => { const tx = side > 0 ? u * 2.5 : -u * 2.5 - lh * label.length * 0.52, ty = u * 5; return <NameTag text={label} pos={[tx, ty, 0.004]} height={lh} to={[-tx + (side > 0 ? u * 0.8 : -u * 0.8), -ty + u * 1.4]} p={prog(f, at + 2, write)} tone="white" />; })() : null}
    </group>;
  };
/** a few places, (lon, lat) */
export const NOI = {latveria: [20.9, 45.6] as LL, newYork: [-74.0, 40.7] as LL, leHavre: [0.1, 49.5] as LL};
