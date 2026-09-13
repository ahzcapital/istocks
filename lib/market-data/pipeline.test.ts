import { describe, expect, it } from 'vitest';
import { validateFXObservation, validateMarketObservations } from './pipeline';

describe('validateMarketObservations', () => {
  const now = new Date('2026-09-13T12:00:00.000Z');

  it('accepts a complete valid observation set', () => {
    const result = validateMarketObservations(
      [
        {
          ticker: 'TEST',
          price: 100,
          previousClose: 99,
          changePercent: 1.01,
          timestamp: '2026-09-13T11:00:00.000Z',
          source: 'test-provider',
          currency: 'EGP',
          countryCode: 'EG',
        },
      ],
      ['TEST'],
      now,
    );

    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('rejects duplicate, unknown and invalid observations', () => {
    const result = validateMarketObservations(
      [
        {
          ticker: 'TEST',
          price: 0,
          timestamp: '2026-09-13T11:00:00.000Z',
          source: 'test-provider',
          currency: 'EGP',
          countryCode: 'EG',
        },
        {
          ticker: 'TEST',
          price: 100,
          timestamp: '2026-09-13T11:00:00.000Z',
          source: 'test-provider',
          currency: 'EGP',
          countryCode: 'EG',
        },
        {
          ticker: 'OTHER',
          price: 50,
          timestamp: '2026-09-13T11:00:00.000Z',
          source: 'test-provider',
          currency: 'EGP',
          countryCode: 'EG',
        },
      ],
      ['TEST', 'MISSING'],
      now,
    );

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['INVALID_PRICE', 'DUPLICATE_TICKER', 'UNKNOWN_TICKER', 'MISSING_TICKER']),
    );
  });

  it('rejects future timestamps beyond clock skew', () => {
    const result = validateMarketObservations(
      [
        {
          ticker: 'TEST',
          price: 100,
          timestamp: '2026-09-13T12:10:01.000Z',
          source: 'test-provider',
          currency: 'EGP',
          countryCode: 'EG',
        },
      ],
      ['TEST'],
      now,
    );

    expect(result.issues.some((issue) => issue.code === 'FUTURE_TIMESTAMP')).toBe(true);
  });
});

describe('validateFXObservation', () => {
  it('accepts a valid FX observation', () => {
    const issues = validateFXObservation({
      baseCurrency: 'USD',
      quoteCurrency: 'EGP',
      rate: 51.36,
      timestamp: '2026-09-13T11:00:00.000Z',
      source: 'test-provider',
    });

    expect(issues).toHaveLength(0);
  });

  it('rejects invalid FX rates', () => {
    const issues = validateFXObservation({
      baseCurrency: 'USD',
      quoteCurrency: 'EGP',
      rate: 0,
      timestamp: '2026-09-13T11:00:00.000Z',
      source: 'test-provider',
    });

    expect(issues.map((issue) => issue.code)).toContain('INVALID_FX_RATE');
  });
});
