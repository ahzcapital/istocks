export type MarketStatus = 'open' | 'closed' | 'auction';

export type MarketObservation = {
  ticker: string;
  price: number;
  previousClose?: number;
  changePercent?: number;
  volume?: number;
  timestamp: string;
  source: string;
  currency: string;
  countryCode: string;
};

export type FXObservation = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  timestamp: string;
  source: string;
};

export type ValidationIssue = {
  code: string;
  message: string;
  ticker?: string;
  severity: 'error' | 'warning';
};

export type MarketDataValidation = {
  ok: boolean;
  issues: ValidationIssue[];
  observationCount: number;
  uniqueTickerCount: number;
  source: string;
  generatedAt: string;
};

const CLOCK_SKEW_MS = 5 * 60 * 1000;

function validDate(value: string) {
  return Number.isFinite(Date.parse(value));
}

export function validateMarketObservations(
  observations: MarketObservation[],
  expectedTickers: string[] = [],
  now = new Date(),
): MarketDataValidation {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  const expected = new Set(expectedTickers);

  for (const observation of observations) {
    const ticker = observation.ticker.trim();

    if (!ticker) {
      issues.push({ code: 'EMPTY_TICKER', message: 'Ticker is empty.', severity: 'error' });
      continue;
    }

    if (seen.has(ticker)) {
      issues.push({ code: 'DUPLICATE_TICKER', ticker, message: `Duplicate observation for ${ticker}.`, severity: 'error' });
    }
    seen.add(ticker);

    if (expected.size > 0 && !expected.has(ticker)) {
      issues.push({ code: 'UNKNOWN_TICKER', ticker, message: `${ticker} is not part of the configured company universe.`, severity: 'error' });
    }

    if (!Number.isFinite(observation.price) || observation.price <= 0) {
      issues.push({ code: 'INVALID_PRICE', ticker, message: `${ticker} has an invalid price.`, severity: 'error' });
    }

    if (observation.previousClose !== undefined && (!Number.isFinite(observation.previousClose) || observation.previousClose <= 0)) {
      issues.push({ code: 'INVALID_PREVIOUS_CLOSE', ticker, message: `${ticker} has an invalid previous close.`, severity: 'error' });
    }

    if (observation.changePercent !== undefined && !Number.isFinite(observation.changePercent)) {
      issues.push({ code: 'INVALID_CHANGE_PERCENT', ticker, message: `${ticker} has an invalid change percentage.`, severity: 'error' });
    }

    if (observation.volume !== undefined && (!Number.isFinite(observation.volume) || observation.volume < 0)) {
      issues.push({ code: 'INVALID_VOLUME', ticker, message: `${ticker} has an invalid volume.`, severity: 'error' });
    }

    if (!observation.source.trim()) {
      issues.push({ code: 'MISSING_SOURCE', ticker, message: `${ticker} has no source metadata.`, severity: 'error' });
    }

    if (!observation.currency.trim() || !observation.countryCode.trim()) {
      issues.push({ code: 'MISSING_MARKET_METADATA', ticker, message: `${ticker} is missing currency or country metadata.`, severity: 'error' });
    }

    if (!validDate(observation.timestamp)) {
      issues.push({ code: 'INVALID_TIMESTAMP', ticker, message: `${ticker} has an invalid timestamp.`, severity: 'error' });
    } else if (Date.parse(observation.timestamp) > now.getTime() + CLOCK_SKEW_MS) {
      issues.push({ code: 'FUTURE_TIMESTAMP', ticker, message: `${ticker} has a timestamp too far in the future.`, severity: 'error' });
    }
  }

  for (const ticker of expected) {
    if (!seen.has(ticker)) {
      issues.push({ code: 'MISSING_TICKER', ticker, message: `${ticker} is missing from the provider response.`, severity: 'error' });
    }
  }

  return {
    ok: issues.every((issue) => issue.severity !== 'error'),
    issues,
    observationCount: observations.length,
    uniqueTickerCount: seen.size,
    source: observations[0]?.source ?? 'unknown',
    generatedAt: now.toISOString(),
  };
}

export function validateFXObservation(fx: FXObservation, now = new Date()): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!fx.baseCurrency.trim() || !fx.quoteCurrency.trim()) {
    issues.push({ code: 'INVALID_FX_CURRENCY', message: 'FX observation requires base and quote currencies.', severity: 'error' });
  }
  if (!Number.isFinite(fx.rate) || fx.rate <= 0) {
    issues.push({ code: 'INVALID_FX_RATE', message: 'FX rate must be finite and greater than zero.', severity: 'error' });
  }
  if (!fx.source.trim()) {
    issues.push({ code: 'MISSING_FX_SOURCE', message: 'FX observation has no source metadata.', severity: 'error' });
  }
  if (!validDate(fx.timestamp)) {
    issues.push({ code: 'INVALID_FX_TIMESTAMP', message: 'FX observation has an invalid timestamp.', severity: 'error' });
  } else if (Date.parse(fx.timestamp) > now.getTime() + CLOCK_SKEW_MS) {
    issues.push({ code: 'FUTURE_FX_TIMESTAMP', message: 'FX timestamp is too far in the future.', severity: 'error' });
  }

  return issues;
}
