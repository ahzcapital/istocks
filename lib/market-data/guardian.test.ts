import { describe, expect, it } from 'vitest';
import { validateMarketDataInvariants } from './guardian';

describe('market data guardian', () => {
  it('accepts internally consistent quote and snapshot data', () => {
    expect(validateMarketDataInvariants(
      [{ ticker: 'TEST', price: 10, marketCapLocal: 1_000_000, marketCapUSD: 20_000, timestamp: new Date('2026-09-13T10:00:00Z') }],
      { rate: 50 },
      { totalMarketCapLocal: 1_000_000, totalMarketCapUSD: 20_000 },
    )).toEqual([]);
  });

  it('rejects duplicate tickers and bad prices', () => {
    const issues = validateMarketDataInvariants(
      [
        { ticker: 'TEST', price: 10, marketCapLocal: 1, marketCapUSD: 0.02, timestamp: new Date('2026-09-13T10:00:00Z') },
        { ticker: 'TEST', price: 0, marketCapLocal: 1, marketCapUSD: 0.02, timestamp: new Date('2026-09-13T10:01:00Z') },
      ],
      { rate: 50 },
    );
    expect(issues).toContain('duplicate quote ticker: TEST');
    expect(issues).toContain('invalid price: TEST');
  });

  it('rejects FX reconciliation drift', () => {
    const issues = validateMarketDataInvariants(
      [{ ticker: 'TEST', price: 10, marketCapLocal: 1_000_000, marketCapUSD: 19_000, timestamp: new Date('2026-09-13T10:00:00Z') }],
      { rate: 50 },
    );
    expect(issues).toContain('FX reconciliation failure: TEST');
  });
});
