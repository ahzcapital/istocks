import { prisma } from '@/lib/prisma';
import { getMarketCompaniesSync, getMarketSummarySync, getMarketStatusSync, hasMarket, rankMarketCompanies } from '@/lib/markets/registry';
import type { MarketCompany, MarketSummary } from '@/lib/markets/types';
import { ConfiguredMoroccoHttpProvider } from './morocco-provider';
import { ConfiguredTunisiaHttpProvider } from './tunisia-provider';

export type CanonicalDataMode = 'database' | 'live-http' | 'snapshot';
export type CanonicalMeta = { market: string; mode: CanonicalDataMode; source: string; delay: string; asOf: string; retrievedAt: string; marketStatus: 'open' | 'closed' | 'auction' };
export type CanonicalResponse<T> = { data: T; meta: CanonicalMeta };

function snapshotMeta(market: string, summary: MarketSummary): CanonicalMeta {
  return { market, mode: 'snapshot', source: summary.dataSource, delay: summary.delay, asOf: summary.lastUpdated, retrievedAt: new Date().toISOString(), marketStatus: getMarketStatusSync(market) };
}

async function getConfiguredRows(market: string): Promise<CanonicalResponse<MarketCompany[]> | undefined> {
  const provider = market === 'MA' ? new ConfiguredMoroccoHttpProvider() : market === 'TN' ? new ConfiguredTunisiaHttpProvider() : undefined;
  if (!provider?.isConfigured()) return undefined;
  const data = rankMarketCompanies(await provider.getCompanies());
  if (data.length === 0) throw new Error(`Configured ${market} provider returned no observations.`);
  const asOf = data.reduce((latest, row) => row.timestamp && (!latest || row.timestamp > latest) ? row.timestamp : latest, undefined as string | undefined) ?? new Date().toISOString();
  return { data, meta: { market, mode: 'live-http', source: data[0].dataSource ?? `configured-${market.toLowerCase()}-http-provider`, delay: 'Provider-defined', asOf, retrievedAt: new Date().toISOString(), marketStatus: getMarketStatusSync(market) } };
}

export async function getCanonicalMarketCompanies(marketCode: string): Promise<CanonicalResponse<MarketCompany[]>> {
  const market = marketCode.toUpperCase();
  if (!hasMarket(market)) throw new Error(`Unsupported market: ${market}`);
  const configured = await getConfiguredRows(market);
  if (configured) return configured;

  if (process.env.DATABASE_URL && market === 'EG') {
    const [quotes, companyCount] = await Promise.all([
      prisma.marketQuote.findMany({ include: { company: true }, orderBy: { timestamp: 'desc' }, take: 5000 }),
      prisma.company.count({ where: { country: 'EG', active: true } }),
    ]);
    const latestByCompany = new Map<string, (typeof quotes)[number]>();
    for (const quote of quotes) if (!latestByCompany.has(quote.companyId)) latestByCompany.set(quote.companyId, quote);
    if (companyCount > 0 && latestByCompany.size >= companyCount) {
      const fx = await prisma.fXRate.findFirst({ where: { baseCurrency: 'USD', quoteCurrency: 'EGP' }, orderBy: { timestamp: 'desc' } });
      const fxRate = fx ? Number(fx.rate) : undefined;
      const rows = [...latestByCompany.values()].map((quote) => {
        const shares = Number(quote.company.sharesOutstanding);
        const price = Number(quote.price);
        const marketCapLocal = price * shares;
        return { id: `EG-EGX-${quote.company.ticker}`, countryCode: 'EG', exchangeCode: quote.company.exchange, ticker: quote.company.ticker, name: quote.company.name, sector: quote.company.industry, industry: quote.company.industry, currency: quote.company.currency, price, previousClose: quote.previousClose === null ? undefined : Number(quote.previousClose), changePercent: quote.changePercent === null ? undefined : Number(quote.changePercent), volume: quote.volume === null ? undefined : Number(quote.volume), sharesOutstanding: shares, marketCapLocal, marketCapUSD: fxRate && fxRate > 0 ? marketCapLocal / fxRate : undefined, marketCapSource: 'calculated' as const, timestamp: quote.timestamp.toISOString(), dataSource: quote.source } satisfies MarketCompany;
      });
      const asOf = rows.reduce((latest, row) => row.timestamp > latest ? row.timestamp : latest, rows[0].timestamp);
      return { data: rankMarketCompanies(rows), meta: { market, mode: 'database', source: rows[0].dataSource ?? 'persisted-market-data', delay: 'Provider-defined', asOf, retrievedAt: new Date().toISOString(), marketStatus: getMarketStatusSync(market) } };
    }
  }

  const summary = getMarketSummarySync(market);
  return { data: rankMarketCompanies(getMarketCompaniesSync(market)), meta: snapshotMeta(market, summary) };
}

export async function getCanonicalMarketSummary(marketCode: string): Promise<CanonicalResponse<MarketSummary>> {
  const market = marketCode.toUpperCase();
  if (!hasMarket(market)) throw new Error(`Unsupported market: ${market}`);
  const configured = await getConfiguredRows(market);
  if (configured) {
    const { data, meta } = configured;
    const totalLocal = data.reduce((sum, row) => sum + (row.marketCapLocal ?? 0), 0);
    const totalUSD = data.reduce((sum, row) => sum + (row.marketCapUSD ?? 0), 0);
    const fxRate = data.find((row) => row.marketCapLocal && row.marketCapUSD)?.marketCapLocal && data.find((row) => row.marketCapLocal && row.marketCapUSD)?.marketCapUSD
      ? (data.find((row) => row.marketCapLocal && row.marketCapUSD)!.marketCapLocal! / data.find((row) => row.marketCapLocal && row.marketCapUSD)!.marketCapUSD!)
      : undefined;
    const summary: MarketSummary = { count: data.length, totalLocal, totalUSD, industries: new Set(data.map((row) => row.sector).filter(Boolean)).size, fxRate, fxSource: meta.source, lastUpdated: meta.asOf, dataSource: meta.source, delay: meta.delay };
    return { data: summary, meta };
  }

  if (process.env.DATABASE_URL && market === 'EG') {
    const [snapshot, fx] = await Promise.all([
      prisma.marketSnapshot.findFirst({ orderBy: { timestamp: 'desc' } }),
      prisma.fXRate.findFirst({ where: { baseCurrency: 'USD', quoteCurrency: 'EGP' }, orderBy: { timestamp: 'desc' } }),
    ]);
    if (snapshot) {
      const companies = await prisma.company.findMany({ where: { country: 'EG', active: true }, select: { industry: true } });
      const summary: MarketSummary = { count: companies.length, totalLocal: Number(snapshot.totalMarketCapEGP), totalUSD: Number(snapshot.totalMarketCapUSD), industries: new Set(companies.map((company) => company.industry)).size, fxRate: fx ? Number(fx.rate) : undefined, fxSource: fx?.source, lastUpdated: snapshot.timestamp.toISOString(), dataSource: fx?.source ?? 'persisted-market-data', delay: 'Provider-defined' };
      return { data: summary, meta: snapshotMeta(market, summary) };
    }
  }

  const summary = getMarketSummarySync(market);
  return { data: summary, meta: snapshotMeta(market, summary) };
}
