export type MarketExchange = {
  code: string;
  name: string;
};

export type MarketConfig = {
  countryCode: string;
  countryName: string;
  flag: string;
  exchangeCode: string;
  exchangeName: string;
  exchanges?: MarketExchange[];
  currencyCode: string;
  currencySymbol: string;
  timezone: string;
  benchmark?: string;
  dataSource: string;
  delay: string;
  lastUpdated: string;
};

export type MarketCompany = {
  id: string;
  countryCode: string;
  exchangeCode: string;
  ticker: string;
  name: string;
  sector?: string;
  industry?: string;
  currency: string;
  price?: number;
  previousClose?: number;
  changePercent?: number;
  sharesOutstanding?: number;
  marketCapLocal?: number;
  marketCapUSD?: number;
  marketCapSource?: 'provider' | 'calculated';
  timestamp?: string;
  dataSource?: string;
};

export type MarketSummary = {
  count: number;
  totalLocal: number;
  totalUSD?: number;
  industries: number;
  fxRate?: number;
  fxSource?: string;
  lastUpdated: string;
  dataSource: string;
  delay: string;
};

export type MarketDataProvider = {
  getCompanies(): Promise<MarketCompany[]>;
  getCompany(ticker: string): Promise<MarketCompany | undefined>;
  getMarketSummary(): Promise<MarketSummary>;
  getFX(): Promise<number | undefined>;
  getMarketStatus(): Promise<'open' | 'closed' | 'auction'>;
};
