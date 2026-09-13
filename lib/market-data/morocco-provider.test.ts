import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfiguredMoroccoHttpProvider } from './morocco-provider';

const payload = {
  observations: [
    {
      ticker: 'ATW',
      price: 710.1,
      previousClose: 705,
      changePercent: 0.72,
      volume: 12345,
      timestamp: '2026-09-13T14:30:00Z',
      source: 'authorized-provider',
      currency: 'MAD',
      countryCode: 'MA',
    },
  ],
  fx: {
    baseCurrency: 'USD',
    quoteCurrency: 'MAD',
    rate: 9.37,
    timestamp: '2026-09-13T14:30:00Z',
    source: 'authorized-fx-provider',
  },
  marketStatus: 'closed',
};

describe('ConfiguredMoroccoHttpProvider', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('is disabled when no production endpoint is configured', () => {
    vi.stubEnv('MA_MARKET_DATA_URL', '');
    expect(new ConfiguredMoroccoHttpProvider().isConfigured()).toBe(false);
  });

  it('normalizes a configured provider payload against the Morocco registry', async () => {
    vi.stubEnv('MA_MARKET_DATA_URL', 'https://provider.example.test/quotes');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 })));

    const rows = await new ConfiguredMoroccoHttpProvider().getCompanies();
    expect(rows).toHaveLength(1);
    expect(rows[0].ticker).toBe('ATW');
    expect(rows[0].price).toBe(710.1);
    expect(rows[0].marketCapLocal).toBeGreaterThan(0);
    expect(rows[0].marketCapUSD).toBeGreaterThan(0);
  });

  it('fails closed on an unknown provider ticker', async () => {
    vi.stubEnv('MA_MARKET_DATA_URL', 'https://provider.example.test/quotes');
    const unknownPayload = { ...payload, observations: [{ ...payload.observations[0], ticker: 'UNKNOWN' }] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(unknownPayload), { status: 200 })));

    await expect(new ConfiguredMoroccoHttpProvider().getCompanies()).rejects.toThrow('Unknown Morocco ticker');
  });

  it('rejects provider HTTP failures', async () => {
    vi.stubEnv('MA_MARKET_DATA_URL', 'https://provider.example.test/quotes');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('upstream failure', { status: 503 })));

    await expect(new ConfiguredMoroccoHttpProvider().fetch()).rejects.toThrow('HTTP 503');
  });
});
