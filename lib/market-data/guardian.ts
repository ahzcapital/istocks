export type GuardianQuote = {
  ticker: string;
  price: number;
  marketCapLocal: number;
  marketCapUSD: number;
  timestamp: Date;
};

export type GuardianFX = { rate: number };

export type GuardianSnapshot = {
  totalMarketCapLocal: number;
  totalMarketCapUSD: number;
};

export function validateMarketDataInvariants(
  quotes: GuardianQuote[],
  fx: GuardianFX,
  snapshot?: GuardianSnapshot,
): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  const timestamps = new Map<string, number>();

  if (!Number.isFinite(fx.rate) || fx.rate <= 0) issues.push('FX rate must be finite and greater than zero');

  for (const quote of quotes) {
    if (seen.has(quote.ticker)) issues.push(`duplicate quote ticker: ${quote.ticker}`);
    seen.add(quote.ticker);

    if (!Number.isFinite(quote.price) || quote.price <= 0) issues.push(`invalid price: ${quote.ticker}`);
    if (!Number.isFinite(quote.marketCapLocal) || quote.marketCapLocal < 0) issues.push(`invalid local market cap: ${quote.ticker}`);
    if (!Number.isFinite(quote.marketCapUSD) || quote.marketCapUSD < 0) issues.push(`invalid USD market cap: ${quote.ticker}`);

    const timestamp = quote.timestamp.getTime();
    const previousTimestamp = timestamps.get(quote.ticker);
    if (previousTimestamp !== undefined && timestamp < previousTimestamp) {
      issues.push(`non-monotonic timestamp: ${quote.ticker}`);
    }
    timestamps.set(quote.ticker, timestamp);

    if (fx.rate > 0 && quote.marketCapLocal / fx.rate > 0) {
      const expectedUSD = quote.marketCapLocal / fx.rate;
      const relativeError = Math.abs(expectedUSD - quote.marketCapUSD) / expectedUSD;
      if (relativeError > 0.000001) issues.push(`FX reconciliation failure: ${quote.ticker}`);
    }
  }

  if (snapshot) {
    if (!Number.isFinite(snapshot.totalMarketCapLocal) || snapshot.totalMarketCapLocal < 0) {
      issues.push('invalid snapshot local market cap');
    }
    if (!Number.isFinite(snapshot.totalMarketCapUSD) || snapshot.totalMarketCapUSD < 0) {
      issues.push('invalid snapshot USD market cap');
    }
    if (fx.rate > 0) {
      const expectedUSD = snapshot.totalMarketCapLocal / fx.rate;
      const relativeError = expectedUSD === 0
        ? Math.abs(snapshot.totalMarketCapUSD)
        : Math.abs(expectedUSD - snapshot.totalMarketCapUSD) / expectedUSD;
      if (relativeError > 0.000001) issues.push('snapshot FX reconciliation failure');
    }
  }

  return [...new Set(issues)];
}
