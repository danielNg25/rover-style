import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Halo} from './look';
import {rnd, Ctx} from './depth';
import {SineWave} from './kit';
import {tex, popScale} from './kitLab';

/** lib3/kitBanDo: the map of Europe and of Latveria (d1c2 graphic D, shots 5 and 10), in the channel's map style (cream paper
 *  with foxing and fold creases, grey-blue sea hatched along the coast, land a deeper cream, mountains as little ink
 *  triangles, forests as green dots, brown ink lines; NO name of any other country). Made 22/11/2026.
 *  Latveria sits where the comics put it: in the Banat, where Hungary, Romania and Serbia meet (Daniel approved, 22/11/2026).
 *  Sheets lie in the x-y plane facing +z, centred on the origin; the camera looks at them straight on (see `mapEye`). */
type V3 = [number, number, number];
type LL = [number, number];

// ---------------------------------------------------------------- the projection of the Europe sheet
/** lon -12..44, lat 35..60; x stretched a little (0.78 of a degree of latitude per degree of longitude) so that the sheet is
 *  16:9 and Europe fills it */
export const EUROPE = {lon: [-12, 44] as [number, number], lat: [35, 60] as [number, number], aspect: (56 * 0.78) / 25,
  /** Latveria's dot (lon, lat) */
  latveria: [20.9, 45.6] as LL};
/** (lon, lat) -> fractions of the Europe sheet (u from the left, v from the TOP) */
export const euUV = ([lon, lat]: LL): [number, number] => [(lon - EUROPE.lon[0]) / (EUROPE.lon[1] - EUROPE.lon[0]), (EUROPE.lat[1] - lat) / (EUROPE.lat[1] - EUROPE.lat[0])];

const MAINLAND: LL[] = [[44.5, 60.6], [30.25, 60.6], [30.2, 59.95], [28, 59.5], [27, 59.45], [25.5, 59.55], [24, 59.4], [23.4, 59.2], [23.5, 58.9], [23.7, 58.3], [24.4, 58.3], [24.5, 58], [24.3, 57.4], [24.4, 57.1], [24.1, 57], [23.6, 56.97], [22.6, 57.6], [21.6, 57.55], [21.05, 56.8], [21, 56.4], [21.1, 55.8], [21.2, 55.2], [20.6, 54.95], [19.9, 54.95], [19.6, 54.45], [18.95, 54.35], [18.6, 54.45], [18.45, 54.75], [17.6, 54.8], [16.6, 54.6], [15.6, 54.2], [14.3, 53.95], [13.8, 54.1], [13.4, 54.25], [12.4, 54.45], [11.5, 54.1], [10.9, 54], [10.85, 54.4], [10.2, 54.45], [9.9, 54.85], [9.9, 55.3], [10, 55.7], [10.2, 56.1], [10.6, 56.5], [10.3, 56.95], [10.5, 57.4], [10.6, 57.75], [9.8, 57.55], [9, 57.15], [8.6, 57.1], [8.15, 56.6], [8.1, 56], [8.3, 55.5], [8.6, 55], [8.7, 54.6], [8.9, 54.2], [8.6, 53.9], [8.1, 53.55], [7.1, 53.6], [6.4, 53.45], [5.4, 53.35], [4.75, 52.95], [4.55, 52.3], [4.05, 51.95], [3.6, 51.5], [3, 51.3], [2.4, 51.05], [1.6, 50.95], [1.55, 50.3], [1.1, 49.95], [0.2, 49.7], [0.1, 49.4], [-1.2, 49.35], [-1.25, 49.7], [-1.9, 49.7], [-1.6, 48.8], [-2.3, 48.65], [-3.2, 48.85], [-4.2, 48.7], [-4.75, 48.4], [-4.3, 48.1], [-4.4, 47.85], [-3.5, 47.7], [-2.5, 47.3], [-2.1, 47], [-1.95, 46.7], [-1.2, 46.2], [-1.25, 45.6], [-1.1, 44.6], [-1.4, 43.6], [-1.8, 43.4], [-3, 43.4], [-4.5, 43.4], [-5.8, 43.6], [-7, 43.6], [-8.3, 43.5], [-9.2, 43.2], [-9, 42.7], [-8.9, 42], [-8.8, 41.2], [-8.7, 40.5], [-9, 39.9], [-9.4, 39.3], [-9.5, 38.75], [-8.9, 38.5], [-8.8, 37.95], [-8.95, 37], [-7.9, 37], [-7.4, 37.2], [-6.4, 36.8], [-6, 36.2], [-5.6, 36], [-5.3, 36.3], [-4.4, 36.7], [-3.4, 36.72], [-2.1, 36.75], [-1.7, 37.3], [-0.8, 37.6], [-0.6, 38.3], [0.2, 38.75], [-0.3, 39.4], [-0.1, 39.9], [0.6, 40.6], [1, 41.05], [2.2, 41.35], [3.2, 41.9], [3.15, 42.45], [3.05, 43], [3.9, 43.5], [4.8, 43.4], [5.5, 43.2], [6.3, 43.1], [7, 43.55], [7.6, 43.8], [8.3, 44], [8.9, 44.4], [9.6, 44.15], [10.2, 43.9], [10.5, 43.3], [10.6, 42.95], [11.1, 42.5], [11.8, 42.1], [12.3, 41.7], [13, 41.25], [13.8, 41.15], [14.3, 40.85], [14.7, 40.6], [15.1, 40.15], [15.7, 40], [16.1, 39.5], [16, 38.9], [15.65, 38.25], [15.85, 38], [16.1, 37.95], [16.6, 38.45], [17.15, 38.95], [17.2, 39.35], [16.55, 39.7], [16.5, 39.95], [16.9, 40.4], [17.5, 40.3], [18, 40.1], [18.5, 40.15], [18.45, 40.45], [17.9, 40.7], [17.2, 40.95], [16.4, 41.3], [15.95, 41.6], [16.1, 41.95], [15.2, 41.95], [14.5, 42.25], [13.9, 42.8], [13.6, 43.55], [12.7, 44], [12.3, 44.5], [12.4, 45], [12.3, 45.4], [13, 45.75], [13.6, 45.75], [13.75, 45.2], [13.9, 44.8], [14.4, 45.3], [14.9, 45], [15.2, 44.3], [15.9, 43.6], [16.5, 43.45], [17.4, 43], [18.1, 42.6], [18.6, 42.4], [19.1, 42.05], [19.4, 41.85], [19.5, 41.4], [19.35, 40.8], [19.45, 40.35], [20, 39.7], [20.4, 39.3], [20.7, 38.95], [21.1, 38.4], [21.5, 38.2], [21.65, 37.65], [21.6, 37.1], [21.95, 36.8], [22.5, 36.4], [22.75, 36.8], [23.1, 36.5], [23.2, 37], [22.8, 37.55], [23.3, 37.65], [24, 37.7], [24.05, 38.2], [23.6, 38.4], [22.8, 38.9], [23, 39.3], [22.65, 39.65], [22.6, 40.25], [22.9, 40.55], [23.7, 40.2], [23.9, 40.4], [24.4, 40.15], [24.1, 40.65], [24.9, 40.9], [25.6, 40.85], [26.05, 40.65], [26.3, 40.15], [26.2, 39.45], [26.8, 38.9], [26.6, 38.4], [27.1, 38], [27.3, 37.4], [27.6, 36.95], [28.3, 36.75], [29.1, 36.6], [29.7, 36.15], [30.5, 36.4], [30.8, 36.85], [31.7, 36.6], [32.6, 36.1], [33.6, 36.2], [34.4, 36.65], [35, 36.75], [35.8, 36.65], [36.15, 36.1], [35.9, 35.4], [35.85, 34.5], [44.5, 34.5]];
const SCANDINAVIA: LL[] = [[4.9, 60.6], [5, 60], [5.3, 59.4], [5.6, 58.9], [5.6, 58.5], [6, 58.1], [6.9, 58], [7.9, 58.05], [8.8, 58.5], [9.6, 58.95], [10.4, 59.3], [10.6, 59.85], [10.7, 59.3], [11.1, 59.1], [11.4, 58.8], [11.6, 58.2], [11.9, 57.7], [12.2, 57.2], [12.7, 56.6], [12.9, 56.2], [12.6, 55.7], [13, 55.4], [14.2, 55.4], [14.4, 55.6], [14.2, 56], [14.7, 56.2], [15.9, 56.1], [16.4, 56.6], [16.6, 57.3], [16.7, 57.9], [16.9, 58.4], [17.6, 58.8], [18.3, 59.1], [18.9, 59.6], [18.6, 60], [18.4, 60.6]];
const FINLAND: LL[] = [[21.3, 60.6], [21.5, 60.4], [22, 60.25], [22.5, 59.95], [23.2, 59.85], [24.5, 60.15], [25.6, 60.3], [26.8, 60.5], [28.5, 60.55], [29.5, 60.25], [30.2, 59.95], [30.3, 60.6]];
const AFRICA: LL[] = [[-6.5, 34.4], [-6.2, 35.5], [-5.9, 35.8], [-5.4, 35.9], [-5.3, 35.2], [-4, 35.2], [-2.9, 35.3], [-2, 35.1], [-1, 35.7], [0.1, 35.9], [1, 36.5], [2.9, 36.8], [4.8, 36.9], [6.4, 37.1], [7.8, 36.9], [9, 37.2], [9.8, 37.35], [10.3, 37], [11.1, 37.05], [10.5, 36.4], [10.9, 35.7], [11.1, 35.2], [10.8, 34.4]];
const ISLANDS: LL[][] = [
  [[-5.7, 50.05], [-4.2, 50.4], [-3.4, 50.6], [-2, 50.6], [-0.8, 50.75], [0.4, 50.8], [1.4, 51.15], [0.9, 51.5], [1.6, 52.1], [1.75, 52.7], [1.3, 53], [0.3, 53.4], [0.1, 53.6], [-0.5, 54.4], [-1.2, 54.65], [-1.6, 55.6], [-2, 56], [-2.8, 56.05], [-2.6, 56.3], [-1.8, 56.8], [-2, 57.65], [-3.2, 57.7], [-4, 57.6], [-3.1, 58.6], [-4.4, 58.6], [-5, 58.6], [-5.1, 58.2], [-5.7, 57.9], [-5.6, 57.3], [-5.8, 56.8], [-5.6, 56.3], [-5.4, 55.8], [-4.9, 55.7], [-4.6, 55.4], [-5, 55], [-4.8, 54.7], [-4.4, 54.85], [-3.6, 54.95], [-3.4, 54.4], [-3, 53.95], [-3, 53.4], [-4.3, 53.4], [-4.7, 52.8], [-4.1, 52.6], [-4.1, 52], [-5.2, 51.75], [-4.2, 51.55], [-3.2, 51.45], [-4.2, 51.2], [-5.1, 50.6]],
  [[-6, 52.1], [-6.2, 53], [-6, 53.4], [-6.2, 54], [-5.5, 54.4], [-5.7, 54.75], [-6.2, 55.2], [-7.3, 55.35], [-8.3, 55.1], [-8.6, 54.6], [-9.9, 54.2], [-9.9, 53.4], [-9.3, 53.1], [-9.9, 52.6], [-10.3, 51.95], [-9.6, 51.55], [-8.6, 51.65], [-7.5, 52], [-6.4, 52.2]],
  [[9.4, 43], [9.55, 42.5], [9.4, 41.6], [9.2, 41.37], [8.7, 41.6], [8.6, 42.1], [8.6, 42.5], [9.2, 42.9]],
  [[9.2, 41.25], [9.8, 40.9], [9.7, 40], [9.6, 39.15], [9, 39], [8.4, 39], [8.4, 39.7], [8.5, 40.4], [8.2, 40.9], [8.8, 40.95]],
  [[12.4, 38.1], [13.4, 38.2], [15.6, 38.3], [15.1, 37.3], [15, 36.7], [14.3, 36.8], [13, 37.5], [12.4, 37.8]],
  [[23.5, 35.5], [24.3, 35.35], [25.8, 35.3], [26.3, 35.2], [26, 35], [24.8, 34.95], [23.6, 35.2]],
  [[32.3, 35.1], [33, 35.4], [34.6, 35.7], [34, 35], [33, 34.6], [32.4, 34.75]],
  [[11, 55.9], [12.3, 56.1], [12.6, 55.6], [12.1, 55.2], [11.2, 55.2]], [[9.7, 55.5], [10.5, 55.6], [10.8, 55.1], [10.1, 55.05]],
  [[18.1, 57.9], [18.9, 57.8], [18.6, 57.2], [18.2, 56.9], [18.1, 57.3]], [[2.4, 39.6], [3.1, 39.95], [3.45, 39.7], [3.2, 39.3], [2.6, 39.5]],
  [[22, 58.6], [23.3, 58.6], [22.9, 58], [22, 58.2]], [[23.8, 38.9], [24.6, 38.2], [24.3, 38.05], [23.5, 38.6]],
];
const BLACK_SEA: LL[] = [[28, 41.6], [28, 42.6], [27.6, 42.6], [28.5, 43.6], [28.65, 44.3], [29.6, 45], [29.7, 45.6], [30.6, 46.4], [31.6, 46.6], [32.4, 46.2], [33.5, 45.9], [32.5, 45.4], [33.6, 44.4], [34.4, 44.5], [35.3, 45], [36.5, 45.3], [35.5, 45.4], [35, 45.7], [35.5, 46], [36.6, 46.4], [38.2, 47.1], [39.2, 47.2], [38.3, 46.6], [37.8, 46], [37.4, 45.3], [37.3, 44.9], [38.3, 44.4], [39.5, 43.6], [40.6, 43], [41.6, 42.3], [41.6, 41.6], [40.4, 41], [39.3, 41], [37.8, 41.1], [36.8, 41.4], [36, 41.7], [35.2, 42], [33.4, 42], [32, 41.6], [31.2, 41.1], [30, 41.15], [29.1, 41.2], [28.6, 41.3]];
const MARMARA: LL[] = [[26.7, 40.4], [27.6, 40.35], [29, 40.7], [28.9, 41], [27.7, 40.95], [26.9, 40.75]];
const LAKES: LL[][] = [[[17.3, 46.75], [17.95, 46.95], [18.1, 46.9], [17.4, 46.68]], [[6.2, 46.3], [6.9, 46.42], [6.8, 46.5], [6.3, 46.47]]];
const RIVERS: LL[][] = [
  [[8.2, 47.95], [9.5, 48.2], [10.9, 48.7], [12.1, 49], [13.5, 48.55], [14.5, 48.25], [16.3, 48.2], [17.1, 48.1], [18.2, 47.75], [18.9, 47.8], [19.05, 47.5], [18.95, 46.9], [18.85, 46.2], [18.9, 45.8], [19.3, 45.3], [20, 45.2], [20.45, 44.85], [21.4, 44.75], [22, 44.55], [22.5, 44.6], [22.7, 44.2], [22.9, 43.85], [24, 43.7], [25.4, 43.65], [26.1, 43.95], [27.4, 44.05], [28, 44.15], [28.2, 45], [28.6, 45.3], [29.3, 45.3], [29.65, 45.2]],
  [[9.5, 47.6], [8.6, 47.6], [7.6, 47.6], [7.8, 48.6], [8.4, 49.5], [8, 50], [7.6, 50.4], [7.1, 50.9], [6.6, 51.6], [6.1, 51.85], [5, 51.85], [4.2, 51.9]],
  [[18.9, 49.7], [19.9, 50], [21, 50.5], [21.6, 51.4], [21, 52.2], [19.6, 52.6], [18.6, 53.1], [18.8, 54.3]],
  [[30.5, 51.5], [30.6, 50.4], [32, 49.4], [33.4, 48.6], [35.1, 47.8], [34, 47.2], [32.6, 46.6]],
  [[7.7, 45], [9.1, 45.1], [10.6, 44.95], [12, 44.9], [12.4, 44.95]], [[3.1, 46.9], [2, 47.6], [0.7, 47.4], [-0.5, 47.4], [-2.1, 47.25]],
  [[23, 48], [22, 48.2], [21, 47.6], [20.2, 46.5], [20.1, 45.6], [20.3, 45.2]], [[12.8, 51.0], [11.8, 52.0], [11.0, 52.9], [10.0, 53.5], [8.8, 53.9]],
];
const RANGES: LL[][] = [
  [[5.8, 45], [6.8, 45.8], [7.8, 45.95], [9, 46.4], [10.5, 46.6], [12, 46.8], [13.5, 47], [15, 47.2]], [[-1.5, 43], [0, 42.8], [1.5, 42.6], [2.6, 42.4]],
  [[17.5, 49.2], [19.5, 49.3], [21.5, 49.3], [23, 48.8], [24.5, 48], [25.4, 47.2], [25.8, 46.3], [25.6, 45.6], [24.5, 45.45], [23, 45.35], [22.3, 45]],
  [[22.5, 43.6], [23.5, 42.9], [25, 42.7], [26.5, 42.7]], [[15.5, 45], [16.8, 44], [18.3, 43.2], [19.6, 42.6]],
  [[8.8, 44.4], [10.5, 44], [12, 43.3], [13.4, 42.4], [14.5, 41.5], [15.6, 40.6], [16, 39.8]], [[6.6, 58.8], [7.4, 59.4], [8.2, 59.9], [9, 60.4]],
  [[39.5, 43.8], [41.5, 43.3], [43.5, 42.8]], [[30, 37.3], [32, 37.2], [34, 37.4], [36, 37.8], [38, 38.3], [40, 38.5], [42, 38.8]],
  [[-4.5, 40.5], [-3.5, 40.8], [-2.5, 41.1]], [[-4.5, 37.1], [-3, 37.1], [-2, 37.3]], [[2.5, 45.2], [3, 45.6]], [[21, 41.8], [22, 40.8], [21.6, 39.8]],
];
/** forests: [lon, lat, half-width, half-height] of an irregular patch (made of a few overlapping blobs) */
const FORESTS: [number, number, number, number][] = [[11.2, 50.6, 2.2, 1.2], [8.6, 48.6, 0.9, 0.7], [14.6, 49.6, 1.1, 0.6], [20.2, 52.4, 2.2, 0.9], [29.5, 55.2, 3.5, 1.8], [35, 52.5, 2, 1.2], [3, 47.2, 1.5, 0.8], [21.6, 43.7, 1.3, 0.7], [14.6, 58.4, 1.6, 0.9], [24.3, 47.3, 1.1, 0.9], [30.5, 49.6, 1.8, 0.9], [-6.4, 42.2, 1.2, 0.6], [25.8, 57.3, 1.4, 0.7], [17.8, 45.2, 0.9, 0.5]];

// ================================================================ THE MAP STYLE (shared by every map of the episode)
// Lượt hai (22/11/2026, Daniel: "chỗ bản đồ mình nghĩ nên làm đẹp hơn"): old paper with depth, mountains and forests drawn
// in relief, tapered rivers, a decorated frame, a compass rose, hand-writing big enough to read. All painters work in canvas
// pixels; `makeGeoMap` builds a whole sheet from lon/lat data so the map to America and the world map reuse the same look.
const INK = '#4e321e', SEA = '#b9cdca', SEA_DEEP = '#9fb9b8', LAND = '#ead9b0', PAPER = '#ecdcb4';
const blob = (c: Ctx, x: number, y: number, rad: number, col: string) => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); };

/** OLD PAPER WITH DEPTH, painted OVER a finished map (multiply-like washes): broad mottling in two scales, paper fibres,
 *  foxing spots, two coffee rings, fold creases (a lit ridge beside a shadowed valley, 3 x 2 panels), the light falling from
 *  the top left across the sheet, darkened and burnt edges with small torn nicks, a worn corner. */
export const paintOldPaper = (c: Ctx, W: number, H: number, seed = 1) => {
  const r = rnd(seed + 100), S = W / 4096;
  for (let k = 0; k < 90; k++) blob(c, r() * W, r() * H, (300 + r() * 700) * S, r() < 0.5 ? 'rgba(255,246,220,0.07)' : 'rgba(120,80,30,0.07)');
  for (let k = 0; k < 900; k++) blob(c, r() * W, r() * H, (8 + r() * 40) * S, `rgba(${130 + r() * 50},${90 + r() * 40},${40 + r() * 30},${0.03 + r() * 0.06})`);
  c.lineWidth = 1.2 * S; for (let k = 0; k < 2600; k++) { const x = r() * W, y = r() * H, a = r() * 6.28, L = (6 + r() * 22) * S; c.strokeStyle = r() < 0.5 ? 'rgba(90,60,30,0.10)' : 'rgba(255,250,235,0.12)'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + 0.5) * L * 0.5, y + Math.sin(a + 0.5) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke(); }
  for (let k = 0; k < 160; k++) { const x = r() * W, y = r() * H, q = (2 + Math.pow(r(), 3) * 14) * S; c.fillStyle = `rgba(140,90,40,${0.12 + r() * 0.2})`; c.beginPath(); c.ellipse(x, y, q, q * (0.7 + r() * 0.3), r() * 3, 0, 7); c.fill(); }
  [[0.86, 0.2, 120], [0.08, 0.62, 90]].forEach(([u, v, rr]) => { c.strokeStyle = 'rgba(120,76,34,0.07)'; c.lineWidth = 7 * S; c.beginPath(); c.arc(u * W, v * H, rr * S, 0.3, 5.9); c.stroke(); blob(c, u * W, v * H, rr * S, 'rgba(150,100,40,0.06)'); });
  // fold creases: each a shadowed valley with a lit ridge beside it; the panels between them bow a little (soft shading)
  const folds: [number, number, number, number][] = [[W / 3, 0, W / 3, H], [(2 * W) / 3, 0, (2 * W) / 3, H], [0, H / 2, W, H / 2]];
  [1, 3, 5].forEach((i) => { const x = (i * W) / 6; const g = c.createLinearGradient(x - W / 6, 0, x + W / 6, 0); g.addColorStop(0, 'rgba(90,60,30,0.07)'); g.addColorStop(0.5, 'rgba(255,248,230,0.06)'); g.addColorStop(1, 'rgba(90,60,30,0.07)'); c.fillStyle = g; c.fillRect(x - W / 6, 0, W / 3, H); });
  folds.forEach(([x0, y0, x1, y1]) => { const vert = x0 === x1; c.fillStyle = 'rgba(70,45,20,0.20)'; if (vert) c.fillRect(x0 - 2 * S, 0, 4 * S, H); else c.fillRect(0, y0 - 2 * S, W, 4 * S); c.fillStyle = 'rgba(255,252,240,0.30)'; if (vert) c.fillRect(x0 + 3 * S, 0, 5 * S, H); else c.fillRect(0, y0 + 3 * S, W, 5 * S); });
  // the light from the top left
  const lg = c.createLinearGradient(0, 0, W, H); lg.addColorStop(0, 'rgba(255,250,232,0.10)'); lg.addColorStop(1, 'rgba(60,35,15,0.12)'); c.fillStyle = lg; c.fillRect(0, 0, W, H);
  // darkened, burnt edges with nicks
  const e = 120 * S;
  ([[0, 0, W, e, 0, 1], [0, H - e, W, e, 0, -1], [0, 0, e, H, 1, 0], [W - e, 0, e, H, -1, 0]] as number[][]).forEach(([x, y, w, h, dx, dy]) => { const g = dx ? c.createLinearGradient(dx > 0 ? x : x + w, 0, dx > 0 ? x + w : x, 0) : c.createLinearGradient(0, dy > 0 ? y : y + h, 0, dy > 0 ? y + h : y); g.addColorStop(0, 'rgba(90,50,18,0.55)'); g.addColorStop(0.35, 'rgba(110,70,30,0.18)'); g.addColorStop(1, 'rgba(110,70,30,0)'); c.fillStyle = g; c.fillRect(x, y, w, h); });
  for (let k = 0; k < 70; k++) { const side = Math.floor(r() * 4), t = r(), x = side < 2 ? t * W : side === 2 ? 0 : W, y = side >= 2 ? t * H : side === 0 ? 0 : H; blob(c, x, y, (20 + r() * 60) * S, 'rgba(70,35,10,0.35)'); }
  c.fillStyle = 'rgba(40,22,10,0.9)'; for (let k = 0; k < 26; k++) { const side = Math.floor(r() * 4), t = r(), d = (6 + r() * 16) * S, w = (10 + r() * 30) * S; c.beginPath(); if (side === 0) { c.moveTo(t * W - w, 0); c.lineTo(t * W, d); c.lineTo(t * W + w, 0); } else if (side === 1) { c.moveTo(t * W - w, H); c.lineTo(t * W, H - d); c.lineTo(t * W + w, H); } else if (side === 2) { c.moveTo(0, t * H - w); c.lineTo(d, t * H); c.lineTo(0, t * H + w); } else { c.moveTo(W, t * H - w); c.lineTo(W - d, t * H); c.lineTo(W, t * H + w); } c.fill(); }
};

/** THE DECORATED FRAME: an outer ink rule, a band of alternating dark and cream degree segments with a fine rule each side,
 *  an inner rule; a square ornament at each corner with a four-petal rosette; a scrolled cartouche bracket in the middle of
 *  the top and bottom bands. m = the band's inset in pixels. */
export const paintMapFrame = (c: Ctx, W: number, H: number, m = 70, band = 34) => {
  const S = W / 4096;
  c.strokeStyle = INK; c.lineWidth = 9 * S; c.strokeRect(m, m, W - 2 * m, H - 2 * m);
  const a = m + 12 * S, b = a + band * S;
  c.lineWidth = 3 * S; c.strokeRect(a, a, W - 2 * a, H - 2 * a); c.strokeRect(b, b, W - 2 * b, H - 2 * b);
  const seg = 110 * S;
  for (let x = b, i = 0; x < W - b; x += seg, i++) if (i % 2 === 0) { const w = Math.min(seg, W - b - x); c.fillStyle = INK; c.fillRect(x, a, w, b - a); c.fillRect(x, H - b, w, b - a); }
  for (let y = b, i = 0; y < H - b; y += seg, i++) if (i % 2 === 0) { const h = Math.min(seg, H - b - y); c.fillStyle = INK; c.fillRect(a, y, b - a, h); c.fillRect(W - b, y, b - a, h); }
  c.lineWidth = 2 * S; c.strokeRect(b + 10 * S, b + 10 * S, W - 2 * b - 20 * S, H - 2 * b - 20 * S);
  // corners
  [[a, a], [W - b, a], [a, H - b], [W - b, H - b]].forEach(([x, y]) => { const s = b - a; c.fillStyle = PAPER; c.fillRect(x - 8 * S, y - 8 * S, s + 16 * S, s + 16 * S); c.strokeStyle = INK; c.lineWidth = 4 * S; c.strokeRect(x - 8 * S, y - 8 * S, s + 16 * S, s + 16 * S); const cx = x + s / 2, cy = y + s / 2; c.fillStyle = '#9a3a28'; for (let k = 0; k < 4; k++) { const ang = (k * Math.PI) / 2; c.beginPath(); c.ellipse(cx + Math.cos(ang) * s * 0.22, cy + Math.sin(ang) * s * 0.22, s * 0.22, s * 0.1, ang, 0, 7); c.fill(); } c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(cx, cy, s * 0.12, 0, 7); c.fill(); });
  // scroll brackets in the middle of the top and bottom bands
  [a, H - b].forEach((y) => { const cx = W / 2, w = 260 * S, h = b - a; c.fillStyle = PAPER; c.fillRect(cx - w / 2, y - 10 * S, w, h + 20 * S); c.strokeStyle = INK; c.lineWidth = 4 * S; c.strokeRect(cx - w / 2, y - 10 * S, w, h + 20 * S); [-1, 1].forEach((sd) => { c.beginPath(); c.arc(cx + sd * (w / 2 + 16 * S), y + h / 2, 14 * S, 0, 7); c.stroke(); c.beginPath(); c.arc(cx + sd * (w / 2 + 16 * S), y + h / 2, 5 * S, 0, 7); c.fillStyle = INK; c.fill(); }); c.fillStyle = '#9a3a28'; c.beginPath(); c.moveTo(cx - 40 * S, y + h / 2); c.lineTo(cx, y - 2 * S); c.lineTo(cx + 40 * S, y + h / 2); c.lineTo(cx, y + h + 2 * S); c.closePath(); c.fill(); });
};

/** A COMPASS ROSE: sixteen points (the four main ones long, dark on the right half and cream on the left, the diagonals in
 *  madder red), three rings with ticks, a gold boss, a fleur-de-lis on north and an N. r = radius in pixels. */
export const paintCompassRose = (c: Ctx, x: number, y: number, rr: number) => {
  const S = rr / 160;
  c.save(); c.translate(x, y);
  blob(c, 6 * S, 8 * S, rr * 1.15, 'rgba(60,35,15,0.18)');
  c.fillStyle = 'rgba(245,234,205,0.85)'; c.beginPath(); c.arc(0, 0, rr * 0.74, 0, 7); c.fill();
  c.strokeStyle = INK; [0.74, 0.68, 0.36].forEach((q, i) => { c.lineWidth = (i === 1 ? 2 : 4) * S; c.beginPath(); c.arc(0, 0, rr * q, 0, 7); c.stroke(); });
  for (let k = 0; k < 64; k++) { const a = (k / 64) * Math.PI * 2, l = k % 4 ? 0.035 : 0.06; c.lineWidth = 2 * S; c.beginPath(); c.moveTo(Math.cos(a) * rr * 0.68, Math.sin(a) * rr * 0.68); c.lineTo(Math.cos(a) * rr * (0.68 + l), Math.sin(a) * rr * (0.68 + l)); c.stroke(); }
  const point = (a: number, L: number, wd: number, dark: string, light: string) => { const tx = Math.sin(a) * L, ty = -Math.cos(a) * L, lx = Math.sin(a - Math.PI / 2) * wd, ly = -Math.cos(a - Math.PI / 2) * wd;
    c.fillStyle = light; c.beginPath(); c.moveTo(0, 0); c.lineTo(tx, ty); c.lineTo(lx, ly); c.closePath(); c.fill(); c.fillStyle = dark; c.beginPath(); c.moveTo(0, 0); c.lineTo(tx, ty); c.lineTo(-lx, -ly); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2 * S; c.beginPath(); c.moveTo(lx, ly); c.lineTo(tx, ty); c.lineTo(-lx, -ly); c.stroke(); };
  for (let k = 0; k < 8; k++) point(Math.PI / 8 + (k * Math.PI) / 4, rr * 0.5, rr * 0.06, '#7a6a4a', '#e8dcbc');
  for (let k = 0; k < 4; k++) point(Math.PI / 4 + (k * Math.PI) / 2, rr * 0.66, rr * 0.1, '#8c2f22', '#d86a4e');
  for (let k = 0; k < 4; k++) point((k * Math.PI) / 2, rr * (k === 0 ? 1.0 : 0.9), rr * 0.13, INK, '#f2e6c8');
  c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(0, 0, rr * 0.07, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 2 * S; c.stroke();
  // fleur-de-lis above north, then N
  c.fillStyle = '#8c2f22'; c.save(); c.translate(0, -rr * 1.1); c.beginPath(); c.moveTo(0, -24 * S); c.quadraticCurveTo(10 * S, -8 * S, 0, 6 * S); c.quadraticCurveTo(-10 * S, -8 * S, 0, -24 * S); c.fill();
  [-1, 1].forEach((sd) => { c.beginPath(); c.moveTo(sd * 2 * S, 2 * S); c.quadraticCurveTo(sd * 24 * S, -14 * S, sd * 18 * S, 6 * S); c.quadraticCurveTo(sd * 12 * S, 0, sd * 2 * S, 6 * S); c.fill(); }); c.fillRect(-12 * S, 6 * S, 24 * S, 5 * S); c.restore();
  c.fillStyle = INK; c.font = `bold ${44 * S}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', 0, -rr * 1.32);
  c.restore();
};

/** A MOUNTAIN IN RELIEF: the lit face on the left (warm ochre), the shadow face on the right (umber) with hatching, a
 *  jagged ridge, snow on the high ones, an ink outline, a soft shadow at its foot to the lower right. s = half its width. */
export const paintReliefPeak = (c: Ctx, x: number, y: number, s: number, r: () => number, snow = false) => {
  const h = s * (1.05 + r() * 0.5), tx = x + (r() - 0.5) * s * 0.3, ty = y - h, S = Math.max(1, s / 22);
  blob(c, x + s * 0.5, y + s * 0.05, s * 1.1, 'rgba(70,45,20,0.22)');
  const midx = tx + s * (0.05 + r() * 0.15);
  c.fillStyle = '#e2c98f'; c.beginPath(); c.moveTo(x - s, y); c.lineTo(tx - s * 0.18, ty + h * 0.32); c.lineTo(tx, ty); c.lineTo(midx, y); c.closePath(); c.fill();
  c.fillStyle = '#9a7448'; c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + s * 0.3, ty + h * 0.28); c.lineTo(x + s, y); c.lineTo(midx, y); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(70,44,22,0.55)'; c.lineWidth = S; for (let k = 1; k < 6; k++) { const t = k / 6; c.beginPath(); c.moveTo(tx + (x + s - tx) * t * 0.9, ty + (y - ty) * t); c.lineTo(midx + (x + s - midx) * t * 0.5, y); c.stroke(); }
  if (snow) { c.fillStyle = '#fbf6ea'; c.beginPath(); c.moveTo(tx - s * 0.18 * 0.9, ty + h * 0.29); c.lineTo(tx, ty); c.lineTo(tx + s * 0.28, ty + h * 0.27); c.lineTo(tx + s * 0.12, ty + h * 0.2); c.lineTo(tx + s * 0.02, ty + h * 0.3); c.lineTo(tx - s * 0.08, ty + h * 0.22); c.closePath(); c.fill(); }
  c.strokeStyle = INK; c.lineWidth = 1.6 * S; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x - s, y); c.lineTo(tx - s * 0.18, ty + h * 0.32); c.lineTo(tx, ty); c.lineTo(tx + s * 0.3, ty + h * 0.28); c.lineTo(x + s, y); c.stroke();
  c.lineWidth = S; c.beginPath(); c.moveTo(tx, ty); c.lineTo(midx, y); c.stroke();
};
/** A TREE ICON in relief: a conifer (two stacked triangles) or a round broadleaf, lit on the left, dark on the right, a tiny
 *  trunk and a shadow to the lower right. s = height in pixels. */
export const paintTreeIcon = (c: Ctx, x: number, y: number, s: number, r: () => number, conifer = r() < 0.55) => {
  const S = Math.max(1, s / 26);
  blob(c, x + s * 0.3, y, s * 0.5, 'rgba(40,50,20,0.25)');
  c.fillStyle = '#5a3e22'; c.fillRect(x - s * 0.05, y - s * 0.22, s * 0.1, s * 0.22);
  if (conifer) { [[0.95, 0.55, 0.36], [0.62, 0.22, 0.28]].forEach(([top, bot, hw]) => { c.fillStyle = '#7d9a5a'; c.beginPath(); c.moveTo(x, y - s * top); c.lineTo(x - s * hw, y - s * bot + s * 0.12); c.lineTo(x, y - s * bot + s * 0.12); c.closePath(); c.fill(); c.fillStyle = '#4e6a38'; c.beginPath(); c.moveTo(x, y - s * top); c.lineTo(x + s * hw, y - s * bot + s * 0.12); c.lineTo(x, y - s * bot + s * 0.12); c.closePath(); c.fill(); c.strokeStyle = 'rgba(40,50,20,0.8)'; c.lineWidth = S; c.beginPath(); c.moveTo(x - s * hw, y - s * bot + s * 0.12); c.lineTo(x, y - s * top); c.lineTo(x + s * hw, y - s * bot + s * 0.12); c.stroke(); }); }
  else { c.fillStyle = '#5e7a40'; c.beginPath(); c.arc(x, y - s * 0.55, s * 0.34, 0, 7); c.fill(); c.fillStyle = '#8eaa66'; c.beginPath(); c.arc(x - s * 0.1, y - s * 0.62, s * 0.2, 0, 7); c.fill(); c.strokeStyle = 'rgba(40,50,20,0.8)'; c.lineWidth = S; c.beginPath(); c.arc(x, y - s * 0.55, s * 0.34, 0, 7); c.stroke(); }
};
/** a river in ink: tapered from the source (first point) to the mouth (last), a pale line down its middle */
const paintRiver = (c: Ctx, pts: [number, number][], w0: number, w1: number) => {
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 0; i < pts.length - 1; i++) { const t = i / (pts.length - 1), w = w0 + (w1 - w0) * t; c.strokeStyle = '#3f6b80'; c.lineWidth = w; c.beginPath(); c.moveTo(...pts[i]); c.lineTo(...pts[i + 1]); c.stroke(); }
  for (let i = 0; i < pts.length - 1; i++) { const t = i / (pts.length - 1), w = (w0 + (w1 - w0) * t) * 0.35; c.strokeStyle = 'rgba(200,225,230,0.7)'; c.lineWidth = w; c.beginPath(); c.moveTo(...pts[i]); c.lineTo(...pts[i + 1]); c.stroke(); }
};
/** a small sailing ship in ink on the sea (decoration), facing right */
const paintShip = (c: Ctx, x: number, y: number, s: number) => {
  c.save(); c.translate(x, y); c.strokeStyle = INK; c.lineWidth = s * 0.05; c.fillStyle = '#7a4a2a';
  c.beginPath(); c.moveTo(-s, 0); c.lineTo(s, 0); c.lineTo(s * 0.7, s * 0.3); c.lineTo(-s * 0.8, s * 0.3); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-s * 0.2, 0); c.lineTo(-s * 0.2, -s * 1.3); c.moveTo(s * 0.4, 0); c.lineTo(s * 0.4, -s * 1.0); c.stroke();
  c.fillStyle = '#f2e8d0'; [[-0.2, 1.25, 0.5], [0.4, 0.95, 0.4]].forEach(([mx, top, wd]) => { c.beginPath(); c.moveTo(s * mx, -s * top); c.quadraticCurveTo(s * (mx + wd), -s * top * 0.6, s * mx, -s * 0.15); c.closePath(); c.fill(); c.stroke(); });
  c.fillStyle = '#9a3a28'; c.beginPath(); c.moveTo(-s * 0.2, -s * 1.3); c.lineTo(-s * 0.55, -s * 1.22); c.lineTo(-s * 0.2, -s * 1.14); c.fill();
  c.strokeStyle = 'rgba(78,50,30,0.6)'; c.lineWidth = s * 0.04; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(-s * 0.6 + k * s * 0.6, s * 0.5, s * 0.25, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  c.restore();
};

/** A WHOLE SHEET from geography, in the episode's map style. uv = (lon, lat) -> fractions of the sheet (v from the top);
 *  lands, waters (inland seas over the land), lakes, rivers (source first), ranges (lines of peaks; snow = high), forests
 *  ([lon, lat, half-width, half-height]); compass = where the rose stands (fractions) and its size (share of W); ships =
 *  decorations on the sea; dots = small dark dots (fractions); scale = the size of the relief (1 for a continent). The
 *  paper, the frame and the light are painted over it. Re-use it for every map of the episode (Europe, America, the world). */
export type GeoMap = {uv: (p: LL) => [number, number]; lands: LL[][]; waters?: LL[][]; lakes?: LL[][]; rivers?: LL[][]; ranges?: {pts: LL[]; snow?: boolean}[];
  forests?: [number, number, number, number][]; compass?: [number, number, number]; ships?: [number, number, number][]; dots?: [number, number][]; scale?: number; seed?: number};
export const makeGeoMap = (o: GeoMap) => (c: Ctx, W: number, H: number) => {
  const r = rnd(o.seed ?? 1), S = W / 4096, k = o.scale ?? 1, pt = (p: LL): [number, number] => { const [u, v] = o.uv(p); return [u * W, v * H]; };
  const path = (pts: LL[], wob = 0) => { const p = new Path2D(); pts.forEach((q, i) => { const [x, y] = pt(q), j = wob && i % 2 ? (r() - 0.5) * wob : 0; if (i) p.lineTo(x + j, y + j); else p.moveTo(x, y); }); p.closePath(); return p; };
  const lands = o.lands.map((p) => path(p, 3 * S)), waters = (o.waters ?? []).map((p) => path(p, 2 * S));
  const onLand = (x: number, y: number) => lands.some((p) => c.isPointInPath(p, x, y)) && !waters.some((p) => c.isPointInPath(p, x, y));
  // 1. the sea: deeper away from the coast, a wash of lighter water along every coast, wave curls in the open sea
  c.fillStyle = SEA_DEEP; c.fillRect(0, 0, W, H);
  c.save(); c.filter = `blur(${60 * S}px)`; c.strokeStyle = SEA; c.lineWidth = 260 * S; lands.forEach((p) => c.stroke(p)); c.restore();
  [[70, 'rgba(60,90,100,0.10)'], [44, 'rgba(60,90,100,0.14)'], [20, 'rgba(60,90,100,0.22)']].forEach(([w, col]) => { c.strokeStyle = col as string; c.lineWidth = (w as number) * S; lands.forEach((p) => c.stroke(p)); });
  c.strokeStyle = 'rgba(60,90,100,0.35)'; c.lineWidth = 2.5 * S; for (let q = 0; q < 260; q++) { const x = r() * W, y = r() * H; if (lands.some((p) => c.isPointInPath(p, x, y))) continue; c.beginPath(); c.arc(x, y, 9 * S, Math.PI * 1.1, Math.PI * 1.9); c.arc(x + 16 * S, y, 9 * S, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  // 2. the land: parchment, a tinted band inside every coast, relief shading under the ranges, a wash under the forests
  c.fillStyle = LAND; lands.forEach((p) => c.fill(p));
  lands.forEach((p) => { c.save(); c.clip(p); c.strokeStyle = 'rgba(190,160,90,0.35)'; c.lineWidth = 50 * S; c.stroke(p); c.strokeStyle = 'rgba(150,120,60,0.3)'; c.lineWidth = 14 * S; c.stroke(p); c.restore(); });
  for (let q = 0; q < 500; q++) { const x = r() * W, y = r() * H; if (onLand(x, y)) blob(c, x, y, (30 + r() * 110) * S, r() < 0.5 ? 'rgba(255,248,225,0.10)' : 'rgba(160,120,60,0.08)'); }
  (o.ranges ?? []).forEach(({pts}) => { c.save(); c.filter = `blur(${26 * S}px)`; c.strokeStyle = 'rgba(150,110,60,0.35)'; c.lineWidth = 90 * S * k; c.lineCap = 'round'; c.beginPath(); pts.forEach((q, i) => { const [x, y] = pt(q); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke(); c.restore(); });
  (o.forests ?? []).forEach(([lo, la, rx, ry]) => { const [x, y] = pt([lo, la]), [x1] = pt([lo + rx, la]), [, y1] = pt([lo, la - ry]); c.save(); c.filter = `blur(${20 * S}px)`; c.fillStyle = 'rgba(120,150,80,0.28)'; c.beginPath(); c.ellipse(x, y, Math.abs(x1 - x), Math.abs(y1 - y), 0, 0, 7); c.fill(); c.restore(); });
  c.fillStyle = SEA; waters.forEach((p) => c.fill(p)); c.save(); waters.forEach((p) => { c.save(); c.clip(p); c.strokeStyle = 'rgba(60,90,100,0.2)'; c.lineWidth = 40 * S; c.stroke(p); c.restore(); }); c.restore();
  (o.lakes ?? []).forEach((l) => { const p = path(l); c.fillStyle = SEA; c.fill(p); c.strokeStyle = INK; c.lineWidth = 2.5 * S; c.stroke(p); });
  // 3. the graticule, faint
  c.strokeStyle = 'rgba(90,60,30,0.10)'; c.lineWidth = 2 * S; c.setLineDash([14 * S, 10 * S]); for (let lo = -180; lo <= 180; lo += 10) { const [x0, y0] = pt([lo, 89]), [x1, y1] = pt([lo, -89]); if (x0 < -1 || x0 > W + 1) continue; c.beginPath(); c.moveTo(x0, Math.max(0, y0)); c.lineTo(x1, Math.min(H, y1)); c.stroke(); } for (let la = -80; la <= 80; la += 5) { const [, y] = pt([0, la]); if (y < 0 || y > H) continue; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } c.setLineDash([]);
  // 4. coasts in ink, a hair-line offset shadow below them
  c.lineJoin = 'round'; c.strokeStyle = 'rgba(60,35,15,0.25)'; c.lineWidth = 6 * S; c.save(); c.translate(3 * S, 4 * S); lands.forEach((p) => c.stroke(p)); c.restore();
  c.strokeStyle = INK; c.lineWidth = 5 * S; lands.forEach((p) => c.stroke(p)); waters.forEach((p) => c.stroke(p));
  // 5. rivers, tapered
  (o.rivers ?? []).forEach((rv, i) => paintRiver(c, rv.map(pt), (i === 0 ? 3 : 2) * S, (i === 0 ? 11 : 7) * S));
  // 6. relief: peaks along every range, drawn back (top of the sheet) to front; forests as tree icons, back to front
  const icons: {y: number; draw: () => void}[] = [];
  (o.ranges ?? []).forEach(({pts, snow}) => { for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pt(pts[i]), [x1, y1] = pt(pts[i + 1]), L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / (30 * S * k))); for (let q = 0; q < n; q++) { const t = (q + r() * 0.6) / n, rows = 2; for (let j = 0; j < rows; j++) { const x = x0 + (x1 - x0) * t + (r() - 0.5) * 40 * S * k, y = y0 + (y1 - y0) * t + (j - 0.5) * 28 * S * k + (r() - 0.5) * 12 * S * k, s = (16 + r() * 16) * S * k * (j ? 0.85 : 1.1); const sn = !!snow && r() < 0.7 && j === 0; icons.push({y, draw: () => paintReliefPeak(c, x, y, s, r, sn)}); } } } });
  (o.forests ?? []).forEach(([lo, la, rx, ry]) => { const blobs = Array.from({length: 4}, () => [lo + (r() - 0.5) * rx, la + (r() - 0.5) * ry, rx * (0.45 + r() * 0.4), ry * (0.45 + r() * 0.4)]); blobs.forEach(([bx, by, bw, bh]) => { const n = Math.round(10 + bw * bh * 10); for (let q = 0; q < n; q++) { const a = r() * 6.28, d = Math.sqrt(r()); const [x, y] = pt([bx + Math.cos(a) * d * bw, by + Math.sin(a) * d * bh]); if (!onLand(x, y)) continue; const s = (20 + r() * 12) * S * k, con = r() < 0.6; icons.push({y, draw: () => paintTreeIcon(c, x, y, s, r, con)}); } }); });
  icons.sort((p, q) => p.y - q.y).forEach((i) => i.draw());
  // 7. decorations and dots
  (o.ships ?? []).forEach(([u, v, s]) => paintShip(c, u * W, v * H, s * W));
  (o.dots ?? []).forEach(([u, v]) => { c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(u * W, v * H, 8 * S, 0, 7); c.fill(); c.strokeStyle = '#efe3c3'; c.lineWidth = 2 * S; c.stroke(); });
  if (o.compass) paintCompassRose(c, o.compass[0] * W, o.compass[1] * H, o.compass[2] * W);
  // 8. paper and frame over everything
  paintOldPaper(c, W, H, o.seed ?? 1); paintMapFrame(c, W, H, 70 * S, 34);
};

/** THE MAP OF EUROPE (no names), in the map style: relief mountains (snow on the Alps, the Pyrenees, the Caucasus), forests
 *  of little trees, tapered rivers (the Danube runs past Latveria), two ships, a compass rose on the Atlantic, old paper, a
 *  decorated frame; Latveria a very small dark dot in the Banat. */
export const paintEuropeMap = (seed = 1) => makeGeoMap({uv: euUV, lands: [MAINLAND, SCANDINAVIA, FINLAND, AFRICA, ...ISLANDS], waters: [BLACK_SEA, MARMARA], lakes: LAKES, rivers: RIVERS,
  ranges: RANGES.map((pts, i) => ({pts, snow: i === 0 || i === 1 || i === 7})), forests: FORESTS, compass: [0.075, 0.76, 0.05], ships: [[0.07, 0.38, 0.012], [0.33, 0.83, 0.009], [0.27, 0.17, 0.008]],
  dots: [euUV(EUROPE.latveria)], scale: 1, seed});
export const europeTex = () => tex('map-europe-4', 6144, Math.round(6144 / EUROPE.aspect), paintEuropeMap(1));

// ---------------------------------------------------------------- the sheet of Latveria itself (shot 10)
/** Places on the Latveria sheet (fractions, v from the TOP): the castle in the north; A..D the camping places in the order
 *  the camp is driven from one to the next; label = where "latveria" is written. */
export const LATVERIA = {castle: [0.5, 0.2] as [number, number], A: [0.27, 0.56] as [number, number], B: [0.43, 0.7] as [number, number],
  C: [0.6, 0.5] as [number, number], D: [0.76, 0.68] as [number, number], label: [0.24, 0.3] as [number, number], aspect: 16 / 9};
const LAT_BORDER: [number, number][] = [[0.12, 0.42], [0.2, 0.22], [0.34, 0.13], [0.5, 0.1], [0.64, 0.12], [0.8, 0.2], [0.9, 0.34], [0.92, 0.52], [0.88, 0.7], [0.78, 0.84], [0.6, 0.88], [0.42, 0.86], [0.26, 0.8], [0.14, 0.66]];
/** LATVERIA CLOSE UP in the map style: the country inside a red-brown dashed border with a red wash along it, the land
 *  outside paler and hatched; big relief mountains (a snowy range in the north behind the castle, a range down the east),
 *  forests of tree icons, the Danube along the south (tapered) with a tributary, a dotted track from the castle; the
 *  castle drawn in relief (keep, towers, gate, red flag); a compass rose bottom right; old paper and the decorated frame. */
export const paintLatveriaMap = (seed = 2) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), X = (u: number) => u * W, Y = (v: number) => v * H, S = W / 4096;
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  const border = new Path2D(); LAT_BORDER.forEach(([u, v], i) => (i ? border.lineTo(X(u), Y(v)) : border.moveTo(X(u), Y(v)))); border.closePath();
  c.save(); c.fillStyle = 'rgba(196,178,140,0.5)'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(90,60,30,0.14)'; c.lineWidth = 3 * S; for (let k = -H; k < W; k += 30 * S) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + H, H); c.stroke(); } c.restore();
  c.fillStyle = LAND; c.fill(border);
  for (let k = 0; k < 260; k++) { const x = r() * W, y = r() * H; if (c.isPointInPath(border, x, y)) blob(c, x, y, (40 + r() * 120) * S, r() < 0.5 ? 'rgba(255,248,225,0.12)' : 'rgba(160,120,60,0.08)'); }
  // relief washes under the ranges and the forests
  const washLine = (pts: [number, number][], w: number, col: string) => { c.save(); c.filter = `blur(${40 * S}px)`; c.strokeStyle = col; c.lineWidth = w * S; c.lineCap = 'round'; c.beginPath(); pts.forEach(([u, v], i) => (i ? c.lineTo(X(u), Y(v)) : c.moveTo(X(u), Y(v)))); c.stroke(); c.restore(); };
  washLine([[0.22, 0.25], [0.42, 0.18]], 220, 'rgba(150,110,60,0.35)'); washLine([[0.58, 0.18], [0.84, 0.28], [0.86, 0.58]], 220, 'rgba(150,110,60,0.35)');
  const FOR: [number, number, number, number][] = [[0.37, 0.43, 0.07, 0.07], [0.68, 0.7, 0.06, 0.08], [0.24, 0.72, 0.06, 0.06], [0.71, 0.37, 0.05, 0.05], [0.41, 0.78, 0.05, 0.04]];
  FOR.forEach(([u, v, a, b]) => { c.save(); c.filter = `blur(${30 * S}px)`; c.fillStyle = 'rgba(120,150,80,0.3)'; c.beginPath(); c.ellipse(X(u), Y(v), X(a) * 1.1, Y(b) * 1.1, 0, 0, 7); c.fill(); c.restore(); });
  // rivers: the Danube along the south, a tributary from the north-east into it
  const curve = (p0: number[], p1: number[], p2: number[], p3: number[], n = 40): [number, number][] => Array.from({length: n + 1}, (_, i) => { const t = i / n, u = 1 - t; return [X(u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]), Y(u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1])]; });
  paintRiver(c, curve([0.86, 0.05], [0.82, 0.35], [0.68, 0.62], [0.66, 0.94]), 4 * S, 12 * S);
  paintRiver(c, curve([-0.02, 0.92], [0.3, 0.86], [0.55, 1.0], [1.02, 0.9]), 18 * S, 26 * S);
  // a dotted track from the castle down through the country
  c.strokeStyle = 'rgba(110,70,40,0.75)'; c.lineWidth = 6 * S; c.setLineDash([6 * S, 16 * S]); c.lineCap = 'round'; c.beginPath(); c.moveTo(X(0.5), Y(0.25)); c.bezierCurveTo(X(0.46), Y(0.42), X(0.56), Y(0.55), X(0.5), Y(0.86)); c.stroke(); c.setLineDash([]);
  // relief: peaks and trees, back to front
  const icons: {y: number; draw: () => void}[] = [];
  const range = (u0: number, v0: number, u1: number, v1: number, n: number, s: number, snow: boolean) => { for (let k = 0; k < n; k++) { const t = (k + r() * 0.6) / n; for (let j = 0; j < 2; j++) { const x = X(u0 + (u1 - u0) * t) + (r() - 0.5) * 50 * S, y = Y(v0 + (v1 - v0) * t) + (j - 0.4) * 60 * S, sz = s * S * (0.7 + r() * 0.5) * (j ? 0.8 : 1.1), sn = snow && j === 0 && r() < 0.8; icons.push({y, draw: () => paintReliefPeak(c, x, y, sz, r, sn)}); } } };
  range(0.22, 0.26, 0.42, 0.2, 9, 62, true); range(0.58, 0.2, 0.84, 0.3, 10, 62, true); range(0.82, 0.38, 0.87, 0.6, 6, 52, false); range(0.15, 0.5, 0.2, 0.66, 4, 42, false); range(0.47, 0.41, 0.54, 0.45, 3, 40, false);
  FOR.forEach(([u, v, a, b]) => { for (let k = 0; k < 46; k++) { const ang = r() * 6.28, d = Math.sqrt(r()), x = X(u + Math.cos(ang) * d * a), y = Y(v + Math.sin(ang) * d * b), sz = (38 + r() * 20) * S, con = r() < 0.6; icons.push({y, draw: () => paintTreeIcon(c, x, y, sz, r, con)}); } });
  icons.sort((p, q) => p.y - q.y).forEach((i) => i.draw());
  // the border: a red wash inside it, a pale band, the dashed line
  c.save(); c.clip(border); c.strokeStyle = 'rgba(190,70,50,0.22)'; c.lineWidth = 60 * S; c.stroke(border); c.restore();
  c.strokeStyle = 'rgba(255,245,225,0.5)'; c.lineWidth = 16 * S; c.stroke(border); c.strokeStyle = '#8c2f22'; c.lineWidth = 8 * S; c.setLineDash([34 * S, 18 * S]); c.stroke(border); c.setLineDash([]);
  // the castle in relief: shadow, towers lit on the left, roofs, crenels, a gate, windows, a red flag
  { const cx = X(LATVERIA.castle[0]), cy = Y(LATVERIA.castle[1]), s = W / 1600;
    blob(c, cx + 30 * s, cy + 48 * s, 110 * s, 'rgba(60,35,15,0.35)');
    const tower = (x: number, y: number, w: number, h: number, roof: boolean) => {
      c.fillStyle = '#e6d6b2'; c.fillRect(x, y, w * 0.6, h); c.fillStyle = '#b89a6a'; c.fillRect(x + w * 0.6, y, w * 0.4, h);
      c.strokeStyle = 'rgba(80,55,30,0.4)'; c.lineWidth = 1.2 * s; for (let yy = y + 8 * s; yy < y + h; yy += 8 * s) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); }
      c.strokeStyle = INK; c.lineWidth = 3.5 * s; c.strokeRect(x, y, w, h);
      if (roof) { c.fillStyle = '#9a3a28'; c.beginPath(); c.moveTo(x - 4 * s, y); c.lineTo(x + w / 2, y - w * 0.9); c.lineTo(x + w + 4 * s, y); c.closePath(); c.fill(); c.fillStyle = '#6e2418'; c.beginPath(); c.moveTo(x + w / 2, y - w * 0.9); c.lineTo(x + w + 4 * s, y); c.lineTo(x + w / 2, y); c.closePath(); c.fill(); c.stroke(); }
      else for (let k = 0; k < w / (8 * s) - 1; k += 2) { c.fillStyle = k / (w / (8 * s)) < 0.6 ? '#e6d6b2' : '#b89a6a'; c.fillRect(x + k * 8 * s, y - 8 * s, 8 * s, 8 * s); c.strokeRect(x + k * 8 * s, y - 8 * s, 8 * s, 8 * s); }
    };
    tower(cx - 56 * s, cy - 14 * s, 112 * s, 60 * s, false); tower(cx - 80 * s, cy - 44 * s, 30 * s, 90 * s, true); tower(cx + 50 * s, cy - 44 * s, 30 * s, 90 * s, true); tower(cx - 18 * s, cy - 70 * s, 36 * s, 56 * s, true);
    c.fillStyle = '#2a1a10'; c.beginPath(); c.moveTo(cx - 13 * s, cy + 46 * s); c.lineTo(cx - 13 * s, cy + 20 * s); c.arc(cx, cy + 20 * s, 13 * s, Math.PI, 0); c.lineTo(cx + 13 * s, cy + 46 * s); c.fill();
    [[-66, -20], [64, -20], [0, -50], [-30, 8], [30, 8]].forEach(([dx, dy]) => { c.fillStyle = '#ffd27a'; c.fillRect(cx + dx * s - 3.5 * s, cy + dy * s, 7 * s, 12 * s); c.strokeStyle = INK; c.lineWidth = 1.5 * s; c.strokeRect(cx + dx * s - 3.5 * s, cy + dy * s, 7 * s, 12 * s); });
    c.strokeStyle = INK; c.lineWidth = 3.5 * s; c.beginPath(); c.moveTo(cx, cy - 102 * s); c.lineTo(cx, cy - 140 * s); c.stroke();
    c.fillStyle = '#c8302a'; c.beginPath(); c.moveTo(cx, cy - 140 * s); c.quadraticCurveTo(cx + 22 * s, cy - 136 * s, cx + 40 * s, cy - 128 * s); c.quadraticCurveTo(cx + 20 * s, cy - 124 * s, cx, cy - 118 * s); c.fill(); }
  paintCompassRose(c, X(0.9), Y(0.82), 0.045 * W);
  paintOldPaper(c, W, H, seed); paintMapFrame(c, W, H, 70 * S, 34);
};
export const latveriaTex = () => tex('map-latveria-4', 4096, 2304, paintLatveriaMap(2));

// ---------------------------------------------------------------- the marks drawn on the maps
/** a small tent: a striped tipi in ink, the door dark, poles crossing at the top (the camp on the map) */
const tentIconTex = () => tex('map-tent-icon-2', 256, 256, (c, W, H) => {
  c.clearRect(0, 0, W, H); const P = (pts: number[][], f: string) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * W, y * H) : c.moveTo(x * W, y * H))); c.closePath(); c.fillStyle = f; c.fill(); };
  c.fillStyle = 'rgba(50,30,10,0.3)'; c.beginPath(); c.ellipse(W * 0.56, H * 0.92, W * 0.38, H * 0.05, 0, 0, 7); c.fill();
  P([[0.12, 0.9], [0.5, 0.14], [0.88, 0.9]], '#e2c07a'); P([[0.5, 0.14], [0.88, 0.9], [0.6, 0.9]], '#b8924e');
  c.strokeStyle = '#8c3b2c'; c.lineWidth = 14; c.beginPath(); c.moveTo(0.27 * W, 0.62 * H); c.lineTo(0.73 * W, 0.62 * H); c.stroke();
  P([[0.42, 0.9], [0.5, 0.56], [0.58, 0.9]], '#3a2416');
  c.strokeStyle = INK; c.lineWidth = 9; c.lineJoin = 'round'; c.beginPath(); c.moveTo(0.12 * W, 0.9 * H); c.lineTo(0.5 * W, 0.14 * H); c.lineTo(0.88 * W, 0.9 * H); c.closePath(); c.stroke();
  c.lineWidth = 7; c.beginPath(); c.moveTo(0.42 * W, 0.04 * H); c.lineTo(0.56 * W, 0.26 * H); c.moveTo(0.58 * W, 0.04 * H); c.lineTo(0.44 * W, 0.26 * H); c.stroke();
});
/** where a camp stood: a ring of ash and a black fire scar */
const scarTex = () => tex('map-camp-scar', 256, 256, (c, W, H) => { c.clearRect(0, 0, W, H); blob(c, W / 2, H / 2, W * 0.4, 'rgba(40,25,15,0.55)'); c.fillStyle = 'rgba(30,20,12,0.85)'; for (let k = 0; k < 7; k++) { const a = k * 0.9; c.beginPath(); c.ellipse(W / 2 + Math.cos(a) * W * 0.12, H / 2 + Math.sin(a) * H * 0.1, W * 0.06, H * 0.03, a, 0, 7); c.fill(); } });
const xTex = () => tex('map-x-red', 256, 256, (c, W, H) => { c.clearRect(0, 0, W, H); c.strokeStyle = '#c8302a'; c.lineCap = 'round'; c.lineWidth = 34; c.beginPath(); c.moveTo(W * 0.18, H * 0.2); c.quadraticCurveTo(W * 0.5, H * 0.48, W * 0.84, H * 0.82); c.moveTo(W * 0.8, H * 0.16); c.quadraticCurveTo(W * 0.48, H * 0.52, W * 0.2, H * 0.84); c.stroke(); });
/** a torch: a short stick with a flame (the soldiers on the map) */
const torchTex = () => tex('map-torch', 128, 256, (c, W, H) => { c.clearRect(0, 0, W, H); c.strokeStyle = INK; c.lineCap = 'round'; c.lineWidth = 14; c.beginPath(); c.moveTo(W * 0.5, H * 0.95); c.lineTo(W * 0.5, H * 0.5); c.stroke(); c.fillStyle = '#ff7a2a'; c.beginPath(); c.moveTo(W * 0.5, H * 0.04); c.quadraticCurveTo(W * 0.95, H * 0.34, W * 0.6, H * 0.52); c.lineTo(W * 0.4, H * 0.52); c.quadraticCurveTo(W * 0.05, H * 0.34, W * 0.5, H * 0.04); c.fill(); c.fillStyle = '#ffd25a'; c.beginPath(); c.moveTo(W * 0.5, H * 0.2); c.quadraticCurveTo(W * 0.72, H * 0.38, W * 0.55, H * 0.5); c.lineTo(W * 0.45, H * 0.5); c.quadraticCurveTo(W * 0.28, H * 0.38, W * 0.5, H * 0.2); c.fill(); });
const INK_HAND = '"Chalkboard SE", "Noteworthy", "Comic Sans MS", cursive';
/** HAND-WRITTEN WORDS THAT WRITE THEMSELVES IN: the word appears from left to right as `p` goes 0..1 (a pen nib glows at the
 *  front while it writes), over a faint shadow so it reads on any part of the map. pos = centre; h = letter height. */
export const InkWrite: React.FC<{text: string; pos: V3; h: number; p: number; color?: string}> = ({text, pos, h, p, color = '#c8302a'}) => {
  const map = tex(`ink-write2-${text}-${color}`, 1024, 256, (c, W, H) => { c.clearRect(0, 0, W, H); c.font = `bold 150px ${INK_HAND}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.strokeStyle = 'rgba(250,240,215,0.85)'; c.lineWidth = 26; c.strokeText(text, W / 2, H * 0.55, W * 0.96); c.fillStyle = color; c.fillText(text, W / 2, H * 0.55, W * 0.96); });
  const q = Math.min(1, Math.max(0, p)), w = h * 4 * 1.5, hh = h * 1.5;
  const geo = useMemo(() => { if (q <= 0) return null; const g = new THREE.PlaneGeometry(w * q, hh); const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * q); g.translate(-w / 2 + (w * q) / 2, 0, 0); return g; }, [q, w, hh]);
  if (!geo) return null;
  return <group position={pos}>
    <mesh geometry={geo} renderOrder={7}><meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} /></mesh>
    {q < 1 ? <Halo pos={[-w / 2 + w * q, 0, 0.002]} r={h * 0.5} color="#ff9a7a" strength={0.5} /> : null}
  </group>;
};
/** a pop-in icon lying on the sheet (popScale timing), with an opacity; dy lifts it (a hop), rot tilts it */
const Icon: React.FC<{map: THREE.Texture; x: number; y: number; z: number; size: number; s: number; opacity?: number; order?: number; aspect?: number; rot?: number}> = ({map, x, y, z, size, s, opacity = 1, order = 8, aspect = 1, rot = 0}) =>
  s > 0 ? <mesh position={[x, y, z]} rotation={[0, 0, rot]} scale={[s, s, 1]} renderOrder={order}><planeGeometry args={[size * aspect, size]} /><meshBasicMaterial map={map} transparent opacity={opacity} depthWrite={false} toneMapped={false} /></mesh> : null;

/** THE EUROPE MAP INSERT (d1c2 shot 5): the sheet `w` wide, centred on the origin, facing +z; on frame f a red ring draws
 *  itself round Latveria's dot (t.ring = [from, to]), "latveria" writes itself in red beside it (t.label = [from, to]) and a
 *  small tent pops up in the ring (t.tent). Defaults follow the shot list. Camera: `mapEye`. Lượt hai: the word is twice
 *  as big (it reads from 1.5x up) and the ring a little bolder. */
export const EuropeMap: React.FC<{f: number; w?: number; t?: {ring: [number, number]; label: [number, number]; tent: number}}> = ({f, w = 1.6, t = {ring: [25, 37], label: [37, 58], tent: 50}}) => {
  const h = w / EUROPE.aspect, [lu, lv] = euUV(EUROPE.latveria), L: [number, number] = [-w / 2 + lu * w, h / 2 - lv * h];
  const rr = w * 0.013, ring = useMemo(() => Array.from({length: 26}, (_, i) => { const a = -2.3 + (i / 25) * (Math.PI * 2 + 0.55), q = 1 + 0.06 * Math.sin(a * 3 + 1); return [L[0] + Math.cos(a) * rr * 1.15 * q, L[1] + Math.sin(a) * rr * q + (i / 25) * rr * 0.12] as [number, number]; }), [w]);
  const pr = Math.min(1, Math.max(0, (f - t.ring[0]) / (t.ring[1] - t.ring[0]))), pl = (f - t.label[0]) / (t.label[1] - t.label[0]), lh = w * 0.012;
  return <group>
    <mesh><planeGeometry args={[w, h]} /><meshBasicMaterial map={europeTex()} toneMapped={false} /></mesh>
    {pr > 0 ? <group position={[0, 0, 0.002]}><SineWave pts={ring} progress={pr} amp={0} wave={w * 0.004} width={w * 0.0022} color="#c8302a" head={pr < 1} emissive={0.6} /></group> : null}
    <InkWrite text="latveria" pos={[L[0] + rr * 1.4 + lh * 3, L[1] + rr * 1.7, 0.004]} h={lh} p={pl} />
    <Icon map={tentIconTex()} x={L[0]} y={L[1] + rr * 0.25} z={0.005} size={rr * 1.25} s={popScale(f, t.tent, 6, 0.3)} />
  </group>;
};

/** THE LATVERIA SHEET (d1c2 shot 10): the country close up, `w` wide, centred on the origin. The camp (three small tents)
 *  stands at A; for each leg i (t.legs[i] = [from, to]) the tents pull up and run along a red dashed line that draws itself
 *  behind them to the next place, hopping as they go; a fire scar is left where they stood and a red X stamps it (t.x[i]);
 *  they land and settle with a bounce (t.tent[i]). Three torches chase along the route t.lag frames behind (the soldiers).
 *  Same parameters and default timings as the first version. */
export const LatveriaMap: React.FC<{f: number; w?: number; t?: {legs: [number, number][]; x: number[]; tent: number[]; lag: number}; label?: boolean}> =
  ({f, w = 1.6, t = {legs: [[2, 10], [14, 22], [24, 32]], x: [10, 21, 31], tent: [12, 23, 33], lag: 6}, label = true}) => {
    const h = w / LATVERIA.aspect, Lp = (q: [number, number]): [number, number] => [-w / 2 + q[0] * w, h / 2 - q[1] * h];
    const stops = [LATVERIA.A, LATVERIA.B, LATVERIA.C, LATVERIA.D].map(Lp), size = w * 0.04;
    const leg = (i: number, s: number): [number, number] => { const a = stops[i], b = stops[i + 1], m: [number, number] = [(a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.18, (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.18]; const u = 1 - s; return [u * u * a[0] + 2 * u * s * m[0] + s * s * b[0], u * u * a[1] + 2 * u * s * m[1] + s * s * b[1]]; };
    const ease = (x: number) => { const q = Math.min(1, Math.max(0, x)); return q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2; };
    /** where the camp is at frame g: [x, y, hop height, moving] */
    const camp = (g: number): [number, number, number, boolean] => {
      for (let i = 0; i < 3; i++) { const [a, b] = t.legs[i]; if (g < a) return [...stops[i], 0, false]; if (g <= b) { const k = (g - a) / (b - a), p = leg(i, ease(k)); return [p[0], p[1], Math.abs(Math.sin(k * Math.PI * 4)) * size * 0.35, true]; } }
      return [...stops[3], 0, false];
    };
    const dashes = 9, dashW = w * 0.005;
    const arrived = (i: number) => (i === 0 ? 1 : f >= t.legs[i - 1][1] ? popScale(f, t.legs[i - 1][1], Math.max(3, t.tent[i - 1] - t.legs[i - 1][1] + 2), 0.35) : 0);
    return <group>
      <mesh><planeGeometry args={[w, h]} /><meshBasicMaterial map={latveriaTex()} toneMapped={false} /></mesh>
      {label ? <InkWrite text="latveria" pos={[Lp(LATVERIA.label)[0], Lp(LATVERIA.label)[1], 0.003]} h={w * 0.032} p={1} /> : null}
      {/* the dashed line, drawn behind the running tents */}
      {t.legs.map(([a, b], i) => Array.from({length: dashes}, (_, k) => { const s0 = k / dashes, s1 = (k + 0.55) / dashes, pr = ease((f - a) / (b - a)); if (pr < s1) return null; const p0 = leg(i, s0), p1 = leg(i, s1), ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
        return <mesh key={`${i}-${k}`} position={[(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0.004]} rotation={[0, 0, ang]} renderOrder={6}><planeGeometry args={[Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), dashW]} /><meshBasicMaterial color="#c8302a" toneMapped={false} /></mesh>; }))}
      {/* the places left behind: a fire scar and a red X */}
      {stops.slice(0, 3).map((p, i) => <group key={i}>
        <Icon map={scarTex()} x={p[0]} y={p[1] - size * 0.35} z={0.0045} size={size * 0.9} s={f >= t.legs[i][0] ? 1 : 0} opacity={0.8} order={6} />
        <Icon map={xTex()} x={p[0]} y={p[1] - size * 0.1} z={0.007} size={size * 1.1} s={popScale(f, t.x[i], 5, 0.45)} order={9} />
      </group>)}
      {/* the camp: three small tents running in a bunch, each a little behind the one before */}
      {[0, 1, 2].map((k) => { const [x, y, hop, moving] = camp(f - k * 1.5), i = [0, 1, 2, 3].reduce((a, j) => (j > 0 && f - k * 1.5 >= t.legs[j - 1][1] ? j : a), 0), land = moving ? 1 : arrived(i);
        const off: [number, number] = [(k - 1) * size * 0.55, (k === 1 ? 0.18 : -0.05) * size], tilt = moving ? Math.sin((f - k) * 1.2) * 0.18 : 0;
        return <Icon key={k} map={tentIconTex()} x={x + off[0]} y={y + off[1] + hop + size * 0.35} z={0.006 + k * 0.0005} size={size * (k === 1 ? 1 : 0.82)} s={land} rot={tilt} order={10 + k} />; })}
      {/* the torches chasing behind */}
      {[0, 1, 2].map((k) => { const g = f - t.lag - k * 2.5; if (g < t.legs[0][0]) return null; const [x, y, hop] = camp(g), fl = 1 + 0.15 * Math.sin(f * 1.3 + k * 2);
        return <group key={k} position={[x + (k - 1) * w * 0.01, y - w * 0.006 * (k % 2) + hop * 0.5 + size * 0.3, 0.008]}>
          <Icon map={torchTex()} x={0} y={0} z={0} size={size * 0.7} s={1} aspect={0.5} rot={Math.sin(f * 0.9 + k) * 0.15} order={12} />
          <Halo pos={[0, size * 0.22, 0.001]} r={w * 0.018 * fl} color="#ff7a2a" strength={0.7} />
        </group>; })}
    </group>;
  };

/** Where the camera stands to look at a sheet `w` wide (centred on the origin, aspect a) straight on: zoom 1 = the sheet's
 *  width fills the frame; (u, v) = the point of the sheet at the middle of the frame (v from the top). */
export const mapEye = (w: number, aspect: number, u = 0.5, v = 0.5, zoom = 1): V3 => { const h = w / aspect; return [-w / 2 + u * w, h / 2 - v * h, w / (0.887 * zoom)]; };

// ================================================================ EUROPE TO AMERICA (d1c5 shots 8 and 16; made 23/11/2026)
/** The sheet from the east coast of North America (left) across the Atlantic to Europe (right), in the same map style
 *  (`makeGeoMap`). lon -84..34, lat 20..60, x scaled by 0.6026 so the sheet is 16:9. Latveria is the same dot in the Banat;
 *  `newYork` is where the route ends; `port` is the French coast where the sea crossing starts (Le Havre). */
export const ATLANTIC = {lon: [-84, 34] as [number, number], lat: [20, 60] as [number, number], aspect: 16 / 9,
  latveria: [20.9, 45.6] as LL, newYork: [-74.0, 40.7] as LL, port: [0.1, 49.5] as LL};
export const atUV = ([lon, lat]: LL): [number, number] => [(lon - ATLANTIC.lon[0]) / (ATLANTIC.lon[1] - ATLANTIC.lon[0]), (ATLANTIC.lat[1] - lat) / (ATLANTIC.lat[1] - ATLANTIC.lat[0])];
/** the route Latveria -> overland west to the port -> across the sea to New York (lon, lat); the sea leg starts at index 3 */
const ROUTE_LL: LL[] = [[20.9, 45.6], [14, 47.4], [7, 48.5], [0.1, 49.5], [-10, 50.2], [-24, 49.6], [-38, 47.6], [-52, 44.6], [-64, 42.2], [-74.0, 40.7]];
const AFRICA_W: LL[] = [[-17.5, 14], [-17.1, 20.8], [-16, 23.7], [-14.5, 26.1], [-13.2, 27.7], [-11.5, 28.3], [-9.8, 29.9], [-9.6, 30.5], [-9.8, 31.4], [-8.5, 33.2], [-7, 33.9], [-6.2, 35.5], [-5.9, 35.8], [-5.4, 35.9],
  [-5.3, 35.2], [-4, 35.2], [-2.9, 35.3], [-2, 35.1], [-1, 35.7], [0.1, 35.9], [1, 36.5], [2.9, 36.8], [4.8, 36.9], [6.4, 37.1], [7.8, 36.9], [9, 37.2], [9.8, 37.35], [10.3, 37], [11.1, 37.05], [10.5, 36.4], [10.9, 35.7], [11.1, 35.2],
  [10.1, 33.8], [11.1, 33.2], [12.5, 32.8], [15.2, 32.3], [15.5, 31.5], [17.5, 30.9], [19, 30.3], [20, 31], [20.1, 32.3], [21.5, 32.8], [23, 32.6], [24.9, 31.9], [25.2, 31.6], [27.3, 31.3], [29, 30.9], [30.3, 31.5], [31.6, 31.5], [32.3, 31.2], [34.2, 31.3], [36, 31.5], [36, 14]];
/** North America from the Gulf coast round Florida, up the east coast to Labrador (closed far outside the sheet) */
const N_AMERICA: LL[] = [[-95, 29.5], [-89, 30.3], [-86, 30.4], [-84.2, 30.0], [-83.1, 29.1], [-82.8, 27.8], [-81.8, 26.1], [-81.2, 25.2], [-80.4, 25.2], [-80.1, 25.8], [-80.0, 26.7], [-80.6, 28.4], [-81.0, 29.3], [-81.4, 30.4], [-81.1, 31.6],
  [-80.4, 32.4], [-79.2, 33.2], [-77.9, 33.9], [-76.6, 34.7], [-75.5, 35.25], [-75.9, 36.5], [-75.9, 36.9], [-76.3, 37.6], [-75.6, 37.7], [-75.1, 38.4], [-74.9, 38.95], [-74.4, 39.4], [-74.0, 40.1], [-74.0, 40.5], [-73.9, 40.75], [-73.2, 41.15], [-72.0, 41.3],
  [-71.4, 41.45], [-70.6, 41.5], [-70.0, 41.6], [-69.95, 41.95], [-70.2, 42.05], [-70.6, 41.8], [-70.9, 42.2], [-70.6, 42.65], [-70.8, 43.0], [-70.2, 43.65], [-69.0, 44.0], [-68.0, 44.4], [-67.0, 44.7], [-66.9, 45.2], [-65.9, 45.3], [-64.8, 45.6], [-64.2, 45.8],
  [-65, 45.1], [-66.2, 44.4], [-65.8, 43.6], [-65.3, 43.5], [-64.3, 44.3], [-63.5, 44.6], [-62, 45], [-61, 45.3], [-60.0, 45.9], [-60.5, 47.0], [-61.5, 46.0], [-62.5, 45.7], [-64.0, 46.0], [-64.8, 46.8], [-64.8, 47.8], [-66.3, 48.0], [-65.2, 48.3],
  [-64.2, 48.6], [-64.4, 49.1], [-66.5, 49.2], [-68.5, 48.4], [-70.0, 47.4], [-71.2, 46.8], [-69.5, 48.2], [-68.0, 49.3], [-66.5, 50.2], [-64, 50.3], [-61.5, 50.2], [-59.5, 50.5], [-57.2, 51.4], [-55.8, 52.2], [-56.0, 53.6], [-57.5, 54.5], [-59.5, 55.3],
  [-61.0, 56.0], [-61.8, 57.5], [-62.6, 58.4], [-64.0, 59.5], [-64.6, 60.6], [-95, 60.6]];
const AM_ISLANDS: LL[][] = [
  [[-59.3, 47.6], [-58, 47.7], [-56, 47.6], [-55, 46.9], [-53.6, 46.6], [-52.7, 47.5], [-53.0, 48.4], [-53.5, 49.2], [-55.0, 49.6], [-55.6, 50.4], [-56.3, 51.5], [-57.0, 51.6], [-58.0, 50.0], [-58.8, 49.0], [-59.3, 48.3]],
  [[-74.0, 40.58], [-72.8, 40.72], [-71.9, 41.07], [-72.6, 41.0], [-73.4, 40.95], [-73.9, 40.8]], [[-64.4, 46.6], [-63.0, 46.5], [-62.0, 46.4], [-62.6, 46.0], [-63.8, 46.2]],
  [[-84.9, 21.9], [-84, 22.6], [-82.5, 23.1], [-81, 23.2], [-79.5, 22.6], [-77.5, 21.8], [-75.7, 21], [-74.2, 20.3], [-75.1, 19.9], [-77.3, 19.9], [-77.8, 20.6], [-79.5, 21.6], [-81.6, 22.1], [-82.9, 22.4], [-84.3, 21.8]],
  [[-78.2, 26.8], [-77.0, 26.6], [-77.2, 26.2], [-78.0, 26.5]], [[-77.9, 25.1], [-77.2, 24.6], [-77.5, 24.0], [-78.1, 24.4]], [[-76.3, 25.4], [-75.6, 24.6], [-75.8, 24.4], [-76.4, 25.0]],
  [[-18.0, 28.8], [-17.7, 28.5], [-18.0, 28.4]], [[-16.9, 28.6], [-16.1, 28.5], [-16.5, 28.0], [-16.9, 28.2]], [[-15.8, 28.2], [-15.4, 28.1], [-15.6, 27.8]], [[-14.5, 28.7], [-13.9, 28.5], [-14.2, 28.1]], [[-13.9, 29.2], [-13.4, 29.0], [-13.8, 28.8]],
  [[-17.3, 32.85], [-16.7, 32.8], [-17.0, 32.6]], [[-28.8, 38.6], [-28.0, 38.45], [-28.6, 38.4]], [[-25.9, 37.9], [-25.2, 37.85], [-25.6, 37.7]], [[-27.4, 38.8], [-27.0, 38.7], [-27.3, 38.6]],
];
const AM_LAKES: LL[][] = [[[-79.8, 43.3], [-77.5, 43.3], [-76.2, 43.5], [-76.4, 44.2], [-77.5, 43.95], [-79.2, 43.6]], [[-83.4, 41.7], [-81.5, 41.5], [-79, 42.8], [-79.3, 42.5], [-81, 42.2], [-82.5, 42.0]],
  [[-84.5, 46.0], [-83.5, 46.1], [-81.7, 45.9], [-80.2, 45.3], [-80.6, 44.6], [-81.6, 44.9], [-81.7, 43.3], [-82.5, 43.0], [-83.5, 44.0], [-84.5, 45.0]]];
const AM_RIVERS: LL[][] = [[[-76.4, 44.2], [-75.2, 44.9], [-73.6, 45.5], [-72.4, 46.2], [-71.2, 46.8], [-70.2, 47.3]], [[-73.9, 43.4], [-73.7, 42.6], [-73.9, 41.8], [-73.95, 41.2], [-74.0, 40.75]],
  [[-80.2, 40.4], [-79.0, 39.2], [-77.6, 38.9], [-76.8, 38.5], [-76.3, 37.9]], [[-83.5, 35.5], [-82.0, 34.3], [-80.6, 33.3], [-79.3, 33.0]]];
const AM_RANGES: LL[][] = [[[-84.6, 34.4], [-83, 35.6], [-81.5, 36.6], [-80, 37.6], [-78.6, 39.0], [-77.2, 40.4], [-75.6, 41.6], [-74.4, 42.4], [-73.0, 43.6], [-71.6, 44.4], [-70.4, 45.2]], [[-75, 46.6], [-72.5, 47.6], [-70, 48.8], [-67, 49.8]], [[-63.5, 54], [-62, 56], [-63, 58]]];
const AM_FORESTS: [number, number, number, number][] = [[-79.5, 45.2, 2.6, 1.3], [-71, 45.6, 1.8, 1.2], [-74.5, 48.4, 3.4, 1.0], [-64, 52.4, 3.6, 1.6], [-82.0, 38.0, 1.6, 1.4], [-78, 35.4, 1.6, 0.8], [-66.4, 46.3, 1.2, 0.7], [-60, 57.6, 1.6, 1.2]];

/** THE MAP FROM EUROPE TO AMERICA (no names): North America's east coast on the left (the Great Lakes, the Appalachians, the
 *  St Lawrence, Newfoundland, Florida and Cuba at the bottom), the open Atlantic in the middle (wave curls, two sailing
 *  ships, the compass rose, the Azores, Madeira and the Canaries), Europe and North Africa on the right; Latveria the same
 *  very small dark dot in the Banat. */
export const paintAtlanticMap = (seed = 5) => makeGeoMap({uv: atUV, lands: [MAINLAND, SCANDINAVIA, FINLAND, AFRICA_W, ...ISLANDS, N_AMERICA, ...AM_ISLANDS], waters: [BLACK_SEA, MARMARA], lakes: [...LAKES, ...AM_LAKES],
  rivers: [...RIVERS, ...AM_RIVERS], ranges: [...RANGES.map((pts, i) => ({pts, snow: i === 0 || i === 1 || i === 7})), ...AM_RANGES.map((pts) => ({pts}))], forests: [...FORESTS, ...AM_FORESTS],
  compass: [0.47, 0.79, 0.042], ships: [[0.3, 0.86, 0.008], [0.58, 0.2, 0.007]], dots: [atUV(ATLANTIC.latveria)], scale: 0.62, seed});
export const atlanticTex = () => tex('map-atlantic-1', 6144, 3456, paintAtlanticMap(5));

/** where the route is at s 0..1 (sheet fractions, v from the top): a smooth curve through ROUTE_LL, even in length */
const ROUTE = (() => {
  const P = ROUTE_LL.map(atUV), out: [number, number][] = [];
  for (let i = 0; i < P.length - 1; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < 24; k++) { const t = k / 24, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)) as [number, number]); } }
  out.push(P[P.length - 1]);
  const L = [0]; for (let i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot((out[i][0] - out[i - 1][0]) * ATLANTIC.aspect, out[i][1] - out[i - 1][1]));
  const port = (() => { const q = atUV(ATLANTIC.port); let best = 0; out.forEach((p, i) => { if (Math.hypot(p[0] - q[0], p[1] - q[1]) < Math.hypot(out[best][0] - q[0], out[best][1] - q[1])) best = i; }); return L[best] / L[L.length - 1]; })();
  const at = (s: number): [number, number] => { const d = Math.min(1, Math.max(0, s)) * L[L.length - 1]; let i = 1; while (i < L.length - 1 && L[i] < d) i++; const k = (d - L[i - 1]) / Math.max(1e-9, L[i] - L[i - 1]); return [out[i - 1][0] + (out[i][0] - out[i - 1][0]) * k, out[i - 1][1] + (out[i][1] - out[i - 1][1]) * k]; };
  return {at, port};
})();
/** the route's position for s 0..1 (sheet fractions) and the s where the sea crossing starts */
export const atlanticRoute = ROUTE.at, ATLANTIC_PORT_S = ROUTE.port;

/** a small steamship in ink, facing LEFT: black hull with a red band, cream deck house with portholes, one funnel (red with a
 *  black top) leaning back, a mast with a little sail, flat grey smoke puffs streaming back to the right */
const steamerTex = () => tex('map-steamer-1', 512, 320, (c, W, H) => {
  c.clearRect(0, 0, W, H); c.lineJoin = 'round'; c.lineCap = 'round';
  const P2 = (pts: number[][], f: string) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = f; c.fill(); c.strokeStyle = INK; c.lineWidth = 7; c.stroke(); };
  // smoke first (behind the funnel), three flat puffs growing and paling to the right
  [[300, 70, 30, 'rgba(120,112,104,0.9)'], [362, 52, 38, 'rgba(150,142,134,0.8)'], [438, 40, 46, 'rgba(184,176,166,0.65)']].forEach(([x, y, r, col]) => { c.fillStyle = col as string; c.beginPath(); c.ellipse(x as number, y as number, (r as number) * 1.3, r as number, -0.1, 0, 7); c.fill(); c.strokeStyle = 'rgba(78,50,30,0.55)'; c.lineWidth = 4; c.stroke(); });
  P2([[262, 150], [282, 70], [318, 70], [306, 150]], '#b8342a'); c.fillStyle = '#2a1a10'; c.fillRect(280, 66, 40, 18);
  c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(150, 170); c.lineTo(150, 50); c.stroke(); P2([[150, 60], [204, 120], [150, 130]], '#f2e8d0');
  P2([[120, 150], [360, 150], [360, 196], [120, 196]], '#efe3c3'); c.fillStyle = INK; [150, 190, 230, 270, 310].forEach((x) => { c.beginPath(); c.arc(x, 174, 8, 0, 7); c.fill(); });
  P2([[30, 196], [470, 196], [440, 262], [80, 262]], '#2e2420'); c.fillStyle = '#b8342a'; c.fillRect(52, 236, 400, 10);
  c.strokeStyle = 'rgba(255,250,235,0.55)'; c.lineWidth = 4; c.beginPath(); c.moveTo(60, 206); c.lineTo(440, 206); c.stroke();
  // the bow wave and the water line
  c.strokeStyle = '#f6f0e2'; c.lineWidth = 9; c.beginPath(); c.moveTo(20, 268); c.quadraticCurveTo(60, 250, 96, 270); c.stroke();
  c.strokeStyle = 'rgba(78,50,30,0.6)'; c.lineWidth = 5; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(70 + k * 90, 292, 30, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
});
const goldDotTex = () => tex('map-gold-dot', 256, 256, (c, W, H) => { c.clearRect(0, 0, W, H); blob(c, W / 2, H / 2, W * 0.5, 'rgba(255,214,90,0.55)'); c.fillStyle = '#e8b020'; c.beginPath(); c.arc(W / 2, H / 2, W * 0.2, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 12; c.stroke(); c.fillStyle = '#fff3c0'; c.beginPath(); c.arc(W * 0.45, H * 0.44, W * 0.06, 0, 7); c.fill(); });
const wakeTex = () => tex('map-wake', 256, 64, (c, W, H) => { c.clearRect(0, 0, W, H); const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,252,240,0.95)'); g.addColorStop(1, 'rgba(255,252,240,0)'); c.strokeStyle = g; c.lineCap = 'round'; c.lineWidth = 10; [[18, 0.32], [46, 0.68]].forEach(([y0]) => { c.beginPath(); c.moveTo(6, H / 2); c.quadraticCurveTo(W * 0.5, y0, W, y0 < 30 ? 8 : 56); c.stroke(); }); });

/** THE EUROPE-TO-AMERICA INSERT (d1c5 shots 8 and 16), `w` wide, centred on the origin, facing +z. On frame f:
 *    t.ring  [from, to]  a hand-drawn red ring pops round Latveria (with a bounce) and "latveria" writes itself beside it
 *    t.waves [from, to]  thin red-orange arcs ripple out from Latveria to the LEFT, one every t.every frames, fading as they go
 *    t.route [from, to]  a red dashed line draws itself from Latveria west to the coast and across the sea to New York
 *    t.dot   frame        a gold dot pops at New York (with a halo) and "nước mỹ" writes itself in t.label frames
 *    t.ship  [from, to]  (shot 16) a small steamship pops at the port and sails left along the line to New York, bobbing,
 *                        a white wake behind it; t.hop = frame the gold dot hops once more when it arrives
 *  route = true draws the line already finished (shot 16 starts with it there); null timings are skipped. Defaults are
 *  shot 8. Camera: `mapEye(w, ATLANTIC.aspect, u, v, zoom)`; ATLANTIC_VIEWS has the start and end of shot 8. */
export type AtlanticT = {ring?: [number, number] | null; waves?: [number, number] | null; every?: number; route?: [number, number] | null; dot?: number | null; label?: number; ship?: [number, number] | null; hop?: number | null};
export const SHOT8_T: AtlanticT = {ring: [0, 10], waves: [10, 42], every: 8, route: [10, 42], dot: 44, label: 8, ship: null, hop: null};
export const SHOT16_T: AtlanticT = {ring: [-30, -20], waves: null, route: [-40, -10], dot: -8, label: 1, ship: [4, 54], hop: 56};
export const AtlanticMap: React.FC<{f: number; w?: number; t?: AtlanticT}> = ({f, w = 1.6, t = SHOT8_T}) => {
  const h = w / ATLANTIC.aspect, S = (q: [number, number]): [number, number] => [-w / 2 + q[0] * w, h / 2 - q[1] * h];
  const L = S(atUV(ATLANTIC.latveria)), NY = S(atUV(ATLANTIC.newYork)), rr = w * 0.012, every = t.every ?? 8;
  const ring = useMemo(() => Array.from({length: 26}, (_, i) => { const a = -2.3 + (i / 25) * (Math.PI * 2 + 0.55), q = 1 + 0.06 * Math.sin(a * 3 + 1); return [Math.cos(a) * rr * 1.15 * q, Math.sin(a) * rr * q + (i / 25) * rr * 0.12] as [number, number]; }), [w]);
  const ease = (x: number) => { const q = Math.min(1, Math.max(0, x)); return q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2; };
  const pr = t.ring ? Math.min(1, Math.max(0, (f - t.ring[0]) / (t.ring[1] - t.ring[0]))) : 0, ringPop = t.ring ? popScale(f, t.ring[0], 8, 0.35) : 0;
  const route = t.route ? ease((f - t.route[0]) / (t.route[1] - t.route[0])) : 0, dashes = 64, lh = w * 0.021;
  const dotS = t.dot != null ? popScale(f, t.dot, 6, 0.4) * (t.hop != null ? 1 + 0.35 * Math.max(0, Math.sin(Math.min(1, Math.max(0, (f - t.hop) / 6)) * Math.PI)) : 1) : 0;
  const ship = t.ship ? Math.min(1, Math.max(0, (f - t.ship[0]) / (t.ship[1] - t.ship[0]))) : -1;
  // the ship leaves port at an easy pace and slows right down as it comes in to New York (ease out, cubic); s runs from the
  // port to the end of the route. It keeps level: its heading follows the route only a little (clamped to +-0.12 rad) and is
  // taken from the stretch just BEHIND it, so it never flips at the end of the line; the nose dips with the swell, and the
  // swell dies away as it docks.
  const shipE = ship < 0 ? 0 : 1 - Math.pow(1 - ship, 3), shipS = ATLANTIC_PORT_S + (1 - ATLANTIC_PORT_S) * shipE;
  const shipP = S(atlanticRoute(shipS)), behind = S(atlanticRoute(Math.max(ATLANTIC_PORT_S, shipS - 0.02))), shipPop = t.ship ? popScale(f, t.ship[0], 6, 0.35) : 0;
  const sea = ship < 0 ? 0 : 1 - Math.max(0, (ship - 0.85) / 0.15), bob = Math.sin(f * 0.55) * w * 0.0015 * sea, roll = Math.sin(f * 0.55 + 0.8) * 0.06 * sea;
  const dx = shipP[0] - behind[0], dy = shipP[1] - behind[1], head = Math.abs(dx) + Math.abs(dy) < 1e-9 ? 0 : Math.max(-0.12, Math.min(0.12, Math.atan2(-dy, -dx)));   // 0 when sailing straight left
  return <group>
    <mesh><planeGeometry args={[w, h]} /><meshBasicMaterial map={atlanticTex()} toneMapped={false} /></mesh>
    {/* the ripples: arcs open to the right (they travel left), each grows for 4 * every frames and fades */}
    {t.waves ? Array.from({length: Math.ceil((t.waves[1] - t.waves[0]) / every)}, (_, k) => { const age = f - (t.waves![0] + k * every), life = every * 3; if (age < 0 || age > life) return null; const q = age / life, R = w * (0.02 + q * 0.2);
      return <mesh key={k} position={[L[0] - R * 0.55, L[1], 0.003]} renderOrder={6}><ringGeometry args={[R, R + w * 0.0024 * (1 - q * 0.5), 64, 1, Math.PI * 0.42, Math.PI * 1.16]} /><meshBasicMaterial color="#d2552e" transparent opacity={0.85 * (1 - q) * Math.min(1, age / 3)} depthWrite={false} toneMapped={false} /></mesh>; }) : null}
    {/* the dashed route */}
    {route > 0 ? Array.from({length: dashes}, (_, k) => { const s0 = k / dashes, s1 = (k + 0.55) / dashes; if (route < s1) return null; const p0 = S(atlanticRoute(s0)), p1 = S(atlanticRoute(s1)), ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      return <mesh key={k} position={[(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0.004]} rotation={[0, 0, ang]} renderOrder={6}><planeGeometry args={[Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), w * 0.0026]} /><meshBasicMaterial color="#c8302a" toneMapped={false} /></mesh>; }) : null}
    {route > 0 && route < 1 ? <Halo pos={[...S(atlanticRoute(route)), 0.005]} r={w * 0.008} color="#ff8a5a" strength={0.7} order={7} /> : null}
    {/* the ring and the word */}
    {pr > 0 ? <group position={[L[0], L[1], 0.002]} scale={[ringPop, ringPop, 1]}><SineWave pts={ring} progress={pr} amp={0} wave={w * 0.004} width={w * 0.002} color="#c8302a" head={pr < 1} emissive={0.6} /></group> : null}
    {t.ring ? <InkWrite text="latveria" pos={[L[0] - lh * 0.6, L[1] + rr * 1.4 + lh * 0.9, 0.004]} h={lh} p={(f - t.ring[0] - 2) / 10} /> : null}
    {/* the gold dot at New York and the word */}
    <Icon map={goldDotTex()} x={NY[0]} y={NY[1]} z={0.006} size={w * 0.022} s={dotS} order={9} />
    {t.dot != null && f >= t.dot ? <Halo pos={[NY[0], NY[1], 0.0065]} r={w * 0.02 * (1 + 0.08 * Math.sin(f * 0.4))} color="#ffd25a" strength={0.55} order={8} /> : null}
    {t.dot != null ? <InkWrite text="nước mỹ" pos={[NY[0] + lh * 3.3, NY[1] - lh * 1.5, 0.004]} h={lh} p={(f - t.dot - 1) / (t.label ?? 8)} /> : null}
    {/* the steamer and its wake */}
    {ship >= 0 && shipPop > 0 ? <group position={[shipP[0], shipP[1] + w * 0.009 + bob, 0.008]} rotation={[0, 0, roll + head]} scale={[shipPop, shipPop, 1]}>
      {ship > 0 && ship < 0.97 ? <mesh position={[w * 0.026, -w * 0.008, -0.001]} renderOrder={9}><planeGeometry args={[w * 0.04, w * 0.01]} /><meshBasicMaterial map={wakeTex()} transparent depthWrite={false} toneMapped={false} /></mesh> : null}
      <mesh renderOrder={10}><planeGeometry args={[w * 0.04, w * 0.025]} /><meshBasicMaterial map={steamerTex()} transparent depthWrite={false} toneMapped={false} /></mesh>
    </group> : null}
  </group>;
};
/** the camera at the start of shot 8 (close on Latveria, Europe filling the right half) and on the whole sheet */
export const ATLANTIC_VIEWS = {latveria: {u: 0.66, v: 0.42, zoom: 1.6}, whole: {u: 0.5, v: 0.5, zoom: 1}};
