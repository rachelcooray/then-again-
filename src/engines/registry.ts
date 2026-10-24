import type { EngineId } from '../content/formats';
import { card } from './card';
import { grouping } from './grouping';
import { letterGridSearch } from './letter-grid-search';
import { letterGuess } from './letter-guess';
import { letterSet } from './letter-set';
import { logicGrid } from './logic-grid';
import { numberGrid } from './number-grid';
import type { AnyEngine } from './types';

/** Engines built so far. Formats whose engine isn't here yet show a "coming soon" screen. */
export const ENGINES: Partial<Record<EngineId, AnyEngine>> = {
  'letter-guess': letterGuess,
  'letter-grid-search': letterGridSearch,
  'number-grid': numberGrid,
  grouping,
  'letter-set': letterSet,
  card,
  'logic-grid': logicGrid,
};
