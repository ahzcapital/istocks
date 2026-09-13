import { prisma } from '@/lib/prisma';

export type HistoricalPricePoint = {
  timestamp: string;
  price: number;
  previousClose?: number;
  changePercent?: number;
  volume?: number;
  source: string;
};

export type HistoricalPriceQuery = {
  ticker: string;
  from?: Date;
  to?: Date;
  limit?: number;
};

const DEFAULT_LIMIT = 365;
const MAX_LIMIT = 5000;

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function validateHistoricalRange(from?: Date, to?: Date): void {
  if (from && Number.isNaN(from.getTime())) throw new Error('Invalid from date.');
  if (to && Number.isNaN(to.getTime())) throw new Error('Invalid to date.');
  if (from && to && from > to) throw new Error('Historical price range is invalid.');
}

export async function getHistoricalPrices(query: HistoricalPriceQuery): Promise<HistoricalPricePoint[]> {
  const ticker = query.ticker.trim().toUpperCase();
  if (!ticker) throw new Error('Ticker is required.');
  validateHistoricalRange(query.from, query.to);

  const requestedLimit = query.limit ?? DEFAULT_LIMIT;
  if (!Number.isFinite(requestedLimit) || requestedLimit < 1) throw new Error('Limit must be a positive number.');
  const limit = Math.min(Math.floor(requestedLimit), MAX_LIMIT);

  const company = await prisma.company.findUnique({ where: { ticker }, select: { id: true } });
  if (!company) throw new Error(`Company not found for ticker ${ticker}.`);

  const quotes = await prisma.marketQuote.findMany({
    where: {
      companyId: company.id,
      ...(query.from || query.to
        ? { timestamp: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
        : {}),
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    select: { timestamp: true, price: true, previousClose: true, changePercent: true, volume: true, source: true },
  });

  return quotes.reverse().map((quote) => ({
    timestamp: quote.timestamp.toISOString(),
    price: Number(quote.price),
    previousClose: toNumber(quote.previousClose),
    changePercent: toNumber(quote.changePercent),
    volume: toNumber(quote.volume),
    source: quote.source,
  }));
}
