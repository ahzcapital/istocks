import type {BoycottEntry} from './types';

// Step 1 intentionally contains only two trial entries. Expand this dataset only
// with documented boycott campaigns and verified source metadata in later steps.
export const BOYCOTT_ENTRIES: BoycottEntry[] = [
  {
    id: 'carrefour',
    rank: 1,
    company: 'Carrefour',
    product: 'Carrefour',
    reason: 'Targeted in Palestine-related boycott campaigns in Tunisia and Morocco following the Gaza war.',
  },
  {
    id: 'mcdonalds',
    rank: 2,
    company: "McDonald's",
    product: "McDonald's",
    reason: 'Targeted by consumer boycott campaigns in Egypt and other Arab countries over perceived support or ties to Israel.',
  },
];
