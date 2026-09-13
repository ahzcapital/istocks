import type { FXObservation, MarketObservation, MarketStatus } from './pipeline';

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

export class ConfiguredEgyptHttpProvider {
  readonly mode = 'live-http' as const;

  private readonly url = process.env.EGX_MARKET_DATA_URL;
  private readonly apiKey = process.env.EGX_MARKET_DATA_API_KEY;

  isConfigured() {
    return Boolean(this.url);
  }

  async fetch(): Promise<ProviderPayload> {
    if (!this.url) throw new Error('EGX_MARKET_DATA_URL is not configured.');
    const headers: Record<string, string> = { accept: 'application/json' };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
    const response = await fetch(this.url, { method: 'GET', headers, cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`EGX market-data provider returned HTTP ${response.status}.`);
    const payload: unknown = await response.json();
    if (!isRecord(payload) || !Array.isArray(payload.observations) || !isRecord(payload.fx)) throw new Error('EGX market-data provider returned an unsupported response shape.');
    const observations: MarketObservation[] = [];
    for (const item of payload.observations) {
      if (!isRecord(item)) continue;
      observations.push({
        ticker: asString(item.ticker) ?? '', price: asNumber(item.price) ?? Number.NaN,
        previousClose: asNumber(item.previousClose), changePercent: asNumber(item.changePercent), volume: asNumber(item.volume),
        timestamp: asString(item.timestamp) ?? '', source: asString(item.source) ?? 'configured-egx-http-provider',
        currency: asString(item.currency) ?? 'EGP', countryCode: asString(item.countryCode) ?? 'EG',
      });
    }
    const fx: FXObservation = {
      baseCurrency: asString(payload.fx.baseCurrency) ?? 'USD', quoteCurrency: asString(payload.fx.quoteCurrency) ?? 'EGP',
      rate: asNumber(payload.fx.rate) ?? Number.NaN, timestamp: asString(payload.fx.timestamp) ?? '',
      source: asString(payload.fx.source) ?? 'configured-egx-http-provider',
    };
    const status = payload.marketStatus;
    const marketStatus: MarketStatus | undefined = status === 'open' || status === 'closed' || status === 'auction' ? status : undefined;
    return { observations, fx, marketStatus };
  }
}
