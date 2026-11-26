import React from 'react';
import {Still} from 'remotion';
import {Proportion} from './Mockup';
import {Models, ModelsExtreme} from './Models';

/** Art lead's stills for episode doom-b: the proportion mock-up and the model sheet. */
export const DoomBArtComps: React.FC = () => (
  <>
    <Still id="ep-doom-b-proportion" component={Proportion} width={1920} height={1080} />
    <Still id="ep-doom-b-models" component={Models} width={1920} height={1080} />
    <Still id="ep-doom-b-models-extreme" component={ModelsExtreme} width={1920} height={1080} />
  </>
);
