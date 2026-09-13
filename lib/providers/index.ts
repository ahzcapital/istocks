import { getEgyptSnapshotFX, getEgyptSnapshotObservations } from '@/lib/market-data/egypt-snapshot';
import type { MarketStatus } from '@/lib/market-data/pipeline';

export type Quote = {
  ticker: string;
  price: number;
  previousClose?: number;
  changePercent?: number;
  volume?: number;
  timestamp: string;
  source: string;
};

export type FXRate = {
  baseCurrency: 'USD';
  quoteCurrency: 'EGP';
  rate: number;
  timestamp: string;
  source: string;
};

export interface MarketDataProvider {
  getQuotes(tickers?: string[]): Promise<Quote[]>;
  getQuote(ticker: string): Promise<Quote>;
  getHistoricalPrices(ticker: string): Promise<{ timestamp: string; price: number }[]>;
  getFX(): Promise<FXRate>;
  getMarketStatus(): Promise<MarketStatus>;
}

/**
 * Explicit snapshot adapter used until a real EGX provider is configured.
 * This is deliberately named as a snapshot so callers cannot mistake it for live data.
 */
export class EgyptSnapshotProvider implements MarketDataProvider {
  async getQuotes(tickers?: string[]): Promise<Quote[]> {
    const observations = getEgyptSnapshotObservations();
    const filtered = tickers?.length
      ? observations.filter((observation) => tickers.includes(observation.ticker))
      : observations;

    return filtered.map(({ ticker, price, previousClose, changePercent, volume, timestamp, source }) => ({
      ticker,
      price,
      previousClose,
      changePercent,
      volume,
      timestamp,
      source,
    }));
  }

  async getQuote(ticker: string): Promise<Quote> {
    const quote = (await this.getQuotes([ticker]))[0];
    if (!quote) throw new Error(`Snapshot quote not found for ${ticker}`);
    return quote;
  }

  async getHistoricalPrices(_ticker: string): Promise<{ timestamp: string; price: number }[]> {
    throw new Error('Historical provider is not configured; refusing to fabricate historical prices.');
  }

  async getFX(): Promise<FXRate> {
    return getEgyptSnapshotFX();
  }

  async getMarketStatus(): Promise<MarketStatus> {
    return 'closed';
  }
}

/**
 * Compatibility alias retained for existing imports. It no longer claims to be a live provider.
 */
export class FreeEGXProvider extends EgyptSnapshotProvider {}

export const marketDataProvider: MarketDataProvider = new EgyptSnapshotProvider();
