import type { FXObservation, MarketObservation, MarketStatus } from './pipeline';
import type { MarketCompany } from '@/lib/markets/types';
import { moroccoCompanies, MOROCCO_FX_USD_MAD } from '@/lib/markets/morocco';

type ProviderPayload = {
  observations: MarketObservation[];
  fx: FXObservation;
  marketStatus?: MarketStatus;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/**
 * Production boundary for an authorized Bourse de Casablanca feed or
 * certified redistributor. The endpoint is intentionally environment-driven;
 * no vendor-specific URL is hard-coded into the application.
 */
export class ConfiguredMoroccoHttpProvider {
  readonly mode = 'live-http' as const;
  private readonly url = process.env.MA_MARKET_DATA_URL;
  private readonly apiKey = process.env.MA_MARKET_DATA_API_KEY;

  isConfigured() {
    return Boolean(this.url);
  }

  async fetch(): Promise<ProviderPayload> {
    if (!this.url) throw new Error('MA_MARKET_DATA_URL is not configured.');
    const headers: Record<string, string> = { accept: 'application/json' };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
    const response = await fetch(this.url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Morocco market-data provider returned HTTP ${response.status}.`);

    const payload: unknown = await response.json();
    if (!isRecord(payload) || !Array.isArray(payload.observations) || !isRecord(payload.fx)) {
      throw new Error('Morocco market-data provider returned an unsupported response shape.');
    }

    const observations: MarketObservation[] = [];
    for (const item of payload.observations) {
      if (!isRecord(item)) continue;
      observations.push({
        ticker: asString(item.ticker) ?? '',
        price: asNumber(item.price) ?? Number.NaN,
        previousClose: asNumber(item.previousClose),
        changePercent: asNumber(item.changePercent),
        volume: asNumber(item.volume),
        timestamp: asString(item.timestamp) ?? '',
        source: asString(item.source) ?? 'configured-morocco-http-provider',
        currency: asString(item.currency) ?? 'MAD',
        countryCode: asString(item.countryCode) ?? 'MA',
      });
    }

    const fx: FXObservation = {
      baseCurrency: asString(payload.fx.baseCurrency) ?? 'USD',
      quoteCurrency: asString(payload.fx.quoteCurrency) ?? 'MAD',
      rate: asNumber(payload.fx.rate) ?? Number.NaN,
      timestamp: asString(payload.fx.timestamp) ?? '',
      source: asString(payload.fx.source) ?? 'configured-morocco-http-provider',
    };
    const status = payload.marketStatus;
    const marketStatus: MarketStatus | undefined =
      status === 'open' || status === 'closed' || status === 'auction' ? status : undefined;

    return { observations, fx, marketStatus };
  }

  async getCompanies(): Promise<MarketCompany[]> {
    const payload = await this.fetch();
    const byTicker = new Map(moroccoCompanies.map((company) => [company.ticker.toUpperCase(), company]));
    const fx = payload.fx.rate > 0 ? payload.fx.rate : MOROCCO_FX_USD_MAD;

    return payload.observations.map((observation) => {
      const reference = byTicker.get(observation.ticker.toUpperCase());
      if (!reference) throw new Error(`Unknown Morocco ticker from provider: ${observation.ticker}`);
      const shares = reference.sharesOutstanding ??
        (reference.marketCapLocal && reference.price && reference.price > 0
          ? reference.marketCapLocal / reference.price
          : undefined);
      const marketCapLocal = shares && observation.price > 0 ? observation.price * shares : undefined;
      return {
        ...reference,
        price: observation.price,
        previousClose: observation.previousClose,
        changePercent: observation.changePercent,
        volume: observation.volume,
        sharesOutstanding: shares,
        marketCapLocal,
        marketCapUSD: marketCapLocal !== undefined ? marketCapLocal / fx : undefined,
        marketCapSource: marketCapLocal !== undefined ? 'calculated' : undefined,
        timestamp: observation.timestamp,
        dataSource: observation.source,
      } satisfies MarketCompany;
    });
  }
}
