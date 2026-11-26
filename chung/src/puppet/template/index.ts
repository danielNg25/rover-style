/** THE CHARACTER STANDARD: one skeleton, one face kit, one set of expressions for every human character. Read CHARACTERS.md. */
export * from './types';
export {fromTemplate, extraFromTemplate, lids, tAct, worldHeight, BUILDS, MOUTHS, HANDS, STD_HEIGHT} from './fromTemplate';
export type {Build, BuildName, BrowWeight, TemplatePose, TemplateBeat, MouthId, HandId} from './fromTemplate';
export {EXPRESSIONS, EXPRESSION_NAMES, TRANSITION, expr, toExpression, expressionBeats} from './expressions';
export type {ExpressionName, Expression} from './expressions';
export {HUMAN_V1} from './human-v1';
export {HUMAN_V2} from './human-v2';
export {EXTRA_V1} from './extra-v1';
