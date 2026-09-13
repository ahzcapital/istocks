import { describe, expect, it } from 'vitest';
import { calculateHistoricalValuation, resolveShareCount, validateShareCountRecords, type ShareCountRecord } from './historical-valuation';

const d = (value: string) => new Date(value);

const base: ShareCountRecord = {
  sharesOutstanding: 1_000_000,
  effectiveFrom: d('2025-01-01T00:00:00.000Z'),
  effectiveTo: d('2026-01-01T00:00:00.000Z'),
  source: 'corporate-action-feed',
  confidence: 'high',
};

describe('historical valuation', () => {
  it('resolves the share count effective at a quote timestamp', () => {
    const records = [
      base,
      { ...base, sharesOutstanding: 2_000_000, effectiveFrom: d('2026-01-01T00:00:00.000Z'), effectiveTo: null },
    ];
    expect(resolveShareCount(records, d('2026-06-01T00:00:00.000Z'))?.sharesOutstanding).toBe(2_000_000);
  });

  it('rejects overlapping share-count periods', () => {
    const issues = validateShareCountRecords([
      base,
      { ...base, effectiveFrom: d('2025-06-01T00:00:00.000Z'), effectiveTo: d('2026-02-01T00:00:00.000Z') },
    ]);
    expect(issues.some((issue) => issue.includes('overlapping'))).toBe(true);
  });

  it('handles a split by changing the effective share count', () => {
    const records = [
      base,
      { ...base, sharesOutstanding: 2_000_000, effectiveFrom: d('2026-01-01T00:00:00.000Z'), effectiveTo: null },
    ];
    const shareCount = resolveShareCount(records, d('2026-02-01T00:00:00.000Z'))!;
    const valuation = calculateHistoricalValuation(
      { ticker: 'TEST', price: 10, timestamp: d('2026-02-01T00:00:00.000Z') },
      shareCount,
      { rate: 50, timestamp: d('2026-02-01T00:00:00.000Z') },
    );
    expect(valuation.marketCapLocal).toBe(20_000_000);
    expect(valuation.marketCapUSD).toBe(400_000);
  });

  it('fails closed on invalid price and FX', () => {
    const shareCount = { ...base, effectiveTo: null };
    expect(() => calculateHistoricalValuation(
      { ticker: 'TEST', price: 0, timestamp: d('2026-02-01T00:00:00.000Z') },
      shareCount,
      { rate: 50, timestamp: d('2026-02-01T00:00:00.000Z') },
    )).toThrow();
    expect(() => calculateHistoricalValuation(
      { ticker: 'TEST', price: 10, timestamp: d('2026-02-01T00:00:00.000Z') },
      shareCount,
      { rate: 0, timestamp: d('2026-02-01T00:00:00.000Z') },
    )).toThrow();
  });
});
