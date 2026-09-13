export type ShareCountRecord = {
  sharesOutstanding: number;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  source: string;
  confidence: string;
};

export type HistoricalQuote = {
  ticker: string;
  price: number;
  timestamp: Date;
};

export type HistoricalFX = {
  rate: number;
  timestamp: Date;
};

export type HistoricalValuation = {
  ticker: string;
  timestamp: Date;
  price: number;
  sharesOutstanding: number;
  marketCapLocal: number;
  marketCapUSD: number;
  shareCountSource: string;
  shareCountConfidence: string;
  fxRate: number;
};

export function validateShareCountRecords(records: ShareCountRecord[]): string[] {
  const issues: string[] = [];
  const sorted = [...records].sort((a, b) => a.effectiveFrom.getTime() - b.effectiveFrom.getTime());

  for (const record of sorted) {
    if (!Number.isFinite(record.sharesOutstanding) || record.sharesOutstanding <= 0) {
      issues.push('sharesOutstanding must be finite and greater than zero');
    }
    if (!record.source.trim()) issues.push('share-count source is required');
    if (!record.confidence.trim()) issues.push('share-count confidence is required');
    if (record.effectiveTo && record.effectiveTo <= record.effectiveFrom) {
      issues.push('effectiveTo must be later than effectiveFrom');
    }
  }

  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    if (previous.effectiveTo && current.effectiveFrom < previous.effectiveTo) {
      issues.push(`overlapping share-count periods at ${current.effectiveFrom.toISOString()}`);
    }
  }

  return [...new Set(issues)];
}

export function resolveShareCount(records: ShareCountRecord[], timestamp: Date): ShareCountRecord | null {
  const issues = validateShareCountRecords(records);
  if (issues.length > 0) throw new Error(`Invalid share-count history: ${issues.join('; ')}`);

  const candidates = records.filter((record) =>
    record.effectiveFrom <= timestamp && (!record.effectiveTo || timestamp < record.effectiveTo),
  );

  if (candidates.length > 1) throw new Error(`Multiple share-count records apply at ${timestamp.toISOString()}`);
  return candidates[0] ?? null;
}

export function calculateHistoricalValuation(
  quote: HistoricalQuote,
  shareCount: ShareCountRecord,
  fx: HistoricalFX,
): HistoricalValuation {
  if (!Number.isFinite(quote.price) || quote.price <= 0) throw new Error(`Invalid historical price for ${quote.ticker}`);
  if (!Number.isFinite(fx.rate) || fx.rate <= 0) throw new Error('Historical FX rate must be finite and greater than zero');
  if (!Number.isFinite(shareCount.sharesOutstanding) || shareCount.sharesOutstanding <= 0) {
    throw new Error(`Invalid historical share count for ${quote.ticker}`);
  }

  const marketCapLocal = quote.price * shareCount.sharesOutstanding;
  return {
    ticker: quote.ticker,
    timestamp: quote.timestamp,
    price: quote.price,
    sharesOutstanding: shareCount.sharesOutstanding,
    marketCapLocal,
    marketCapUSD: marketCapLocal / fx.rate,
    shareCountSource: shareCount.source,
    shareCountConfidence: shareCount.confidence,
    fxRate: fx.rate,
  };
}
