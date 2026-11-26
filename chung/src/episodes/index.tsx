import React from 'react';
import {Composition} from 'remotion';
import {Episode, episodeFrames} from '../spec/Episode';
import type {EpisodeSpec} from '../spec/types';
import market from './market.json';
import victor from './victor.json';

/** Every shot sheet in this folder becomes a composition "ep-<id>". A sheet is data only (see spec/types.ts). */
const SHEETS = [market, victor] as unknown as EpisodeSpec[];
export const EpisodeComps: React.FC = () => <>{SHEETS.map((s) => <Composition key={s.id} id={`ep-${s.id}`} component={() => <Episode spec={s} />} width={1280} height={720} fps={24} durationInFrames={episodeFrames(s)} />)}</>;
