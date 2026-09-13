import { prisma } from '@/lib/prisma';
import type { FXObservation, MarketObservation, MarketStatus } from './pipeline';

export type PersistEgyptMarketDataInput = { observations: MarketObservation[]; fx: FXObservation; marketStatus: MarketStatus; timestamp: Date };

export async function persistEgyptMarketData(input: PersistEgyptMarketDataInput) {
  if (!process.env.DATABASE_URL) return { persisted: false as const, reason: 'DATABASE_URL is not configured.' };
  await prisma.$transaction(async (tx) => {
    let totalMarketCapEGP = 0;
    for (const observation of input.observations) {
      const company = await tx.company.findUnique({ where: { ticker: observation.ticker } });
      if (!company) throw new Error(`Cannot persist unknown company ticker: ${observation.ticker}`);
      await tx.marketQuote.create({ data: {
        companyId: company.id, price: observation.price, previousClose: observation.previousClose,
        changePercent: observation.changePercent, volume: observation.volume,
        change: observation.previousClose !== undefined ? observation.price - observation.previousClose : undefined,
        timestamp: new Date(observation.timestamp), source: observation.source,
      }});
      totalMarketCapEGP += observation.price * Number(company.sharesOutstanding);
    }
    await tx.fxRate.create({ data: { baseCurrency: input.fx.baseCurrency, quoteCurrency: input.fx.quoteCurrency, rate: input.fx.rate, timestamp: new Date(input.fx.timestamp), source: input.fx.source } });
    await tx.marketSnapshot.create({ data: { timestamp: input.timestamp, totalMarketCapEGP, totalMarketCapUSD: input.fx.rate > 0 ? totalMarketCapEGP / input.fx.rate : 0, marketStatus: input.marketStatus } });
  });
  return { persisted: true as const };
}
