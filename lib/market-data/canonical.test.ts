import { describe, expect, it } from 'vitest';
import { getCanonicalMarketCompanies, getCanonicalMarketSummary } from './canonical';

describe('canonical market data', () => {
  it('normalizes Egypt snapshot data with explicit metadata when persistence is unavailable', async () => {
    const result = await getCanonicalMarketCompanies('EG');
    expect(result.meta.market).toBe('EG');
    expect(result.meta.mode).toBe('snapshot');
    expect(result.meta.source).toBeTruthy();
    expect(result.meta.asOf).toBeTruthy();
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].rank).toBe(1);
    expect(result.data[0].currency).toBe('EGP');
  });

  it('supports every registered North Africa market', async () => {
    for (const market of ['EG', 'MA', 'TN', 'DZ']) {
      const result = await getCanonicalMarketSummary(market);
      expect(result.meta.market).toBe(market);
      expect(result.data.count).toBeGreaterThan(0);
      expect(result.data.fxRate).toBeGreaterThan(0);
    }
  });

  it('rejects unsupported markets instead of silently routing them to Egypt', async () => {
    await expect(getCanonicalMarketSummary('XX')).rejects.toThrow('Unsupported market: XX');
    await expect(getCanonicalMarketCompanies('XX')).rejects.toThrow('Unsupported market: XX');
  });
});
