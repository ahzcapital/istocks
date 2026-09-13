import type {BoycottEntry} from './types';

const SEED_ENTRIES: BoycottEntry[] = [
  {
    id: 'carrefour',
    rank: 1,
    company: 'Carrefour',
    product: 'Carrefour',
    reason: 'Targeted in documented Palestine-related boycott campaigns; BDS identifies Carrefour as a priority target.',
    status: 'Documented campaign',
    source: 'BDS / North Africa campaigns',
    sourceUrl: 'https://bdsmovement.net/Guide-to-BDS-Boycott',
    confidence: 'high',
    campaignType: 'BDS priority / regional campaign',
  },
  {
    id: 'mcdonalds',
    rank: 2,
    company: "McDonald's",
    product: "McDonald's",
    reason: 'Targeted by documented consumer boycott campaigns in Egypt and other Arab countries; BDS also lists McDonald\'s among its priority targets.',
    status: 'Documented campaign',
    source: 'BDS / regional campaigns',
    sourceUrl: 'https://bdsmovement.net/Guide-to-BDS-Boycott',
    confidence: 'high',
    campaignType: 'BDS priority / regional campaign',
  },
];

const SOURCE_URL = 'https://www.is-boycott.com/en/all/companies';
const SOURCE_LABEL = 'Is-Boycott company database';

function cleanCompanyName(value: string) {
  return value
    .replace(/\s*Company\s*$/i, '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/Company$/i, '')
    .trim();
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function getBoycottEntries(): Promise<BoycottEntry[]> {
  try {
    const response = await fetch(SOURCE_URL, {
      next: { revalidate: 21600 },
      headers: { 'user-agent': 'North-Africa-Hub-Boycott-Reference/1.0' },
    });

    if (!response.ok) throw new Error(`Boycott source returned ${response.status}`);

    const html = await response.text();
    const matches = Array.from(
      html.matchAll(/<a[^>]+href=["']\/en\/c\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/gi),
    );

    const sourceEntries: BoycottEntry[] = [];
    const seen = new Set(SEED_ENTRIES.map(entry => entry.company.toLowerCase()));

    for (const match of matches) {
      const raw = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

      const company = cleanCompanyName(raw);
      if (!company || company.length < 2) continue;
      const key = company.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      sourceEntries.push({
        id: `source-${slugify(company)}`,
        rank: 0,
        company,
        product: company,
        reason: 'Listed in the source database. The database combines BDS priority targets, Who Profits research, OHCHR-related company records, and other boycott research; inclusion does not mean every entry is an official BDS consumer target.',
        status: 'Source database entry',
        source: SOURCE_LABEL,
        sourceUrl: SOURCE_URL,
        confidence: 'medium',
        campaignType: 'Third-party research database',
      });
    }

    const combined = [...SEED_ENTRIES, ...sourceEntries];
    return combined.map((entry, index) => ({ ...entry, rank: index + 1 }));
  } catch {
    return SEED_ENTRIES;
  }
}

// Kept for compatibility with existing imports/tests. Runtime pages should use getBoycottEntries().
export const BOYCOTT_ENTRIES: BoycottEntry[] = SEED_ENTRIES;
