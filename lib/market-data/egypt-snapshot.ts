import { companies } from '@/lib/companies';
import { marketSummary, rankCompanies } from '@/lib/market';
import type { FXObservation, MarketObservation } from './pipeline';

export function getEgyptSnapshotObservations(): MarketObservation[] {
  const summary = marketSummary();

  return rankCompanies().map((company) => ({
    ticker: company.ticker,
    price: company.price,
    previousClose: undefined,
    changePercent: undefined,
    timestamp: summary.updatedAt,
    source: summary.source,
    currency: 'EGP',
    countryCode: 'EG',
  }));
}

export function getExpectedEgyptTickers(): string[] {
  return companies.map((company) => company.ticker);
}

export function getEgyptSnapshotFX(): FXObservation {
  const summary = marketSummary();
  return {
    baseCurrency: 'USD',
    quoteCurrency: 'EGP',
    rate: summary.fx,
    timestamp: summary.updatedAt,
    source: summary.source,
  };
}
