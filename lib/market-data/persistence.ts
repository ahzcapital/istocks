import { prisma } from '@/lib/prisma';
import type { FXObservation, MarketObservation, MarketStatus } from './pipeline';

export type PersistEgyptMarketDataInput = {
  observations: MarketObservation[];
  fx: FXObservation;
  marketStatus: MarketStatus;
  timestamp: Date;
};

export async function persistEgyptMarketData(input: PersistEgyptMarketDataInput) {
  if (!process.env.DATABASE_URL) {
    return { persisted: false as const, reason: 'DATABASE_URL is not configured.' };
  }

  await prisma.$transaction(async (tx) => {
    for (const observation of input.observations) {
      const seed = await tx.company.findUnique({ where: { ticker: observation.ticker } });

      if (!seed) {
        throw new Error(`Cannot persist unknown company ticker: ${observation.ticker}`);
      }

      await tx.marketQuote.create({
        data: {
          companyId: seed.id,
          price: observation.price,
          previousClose: observation.previousClose,
          changePercent: observation.changePercent,
          volume: observation.volume,
          change:
            observation.previousClose !== undefined
              ? observation.price - observation.previousClose
              : undefined,
          timestamp: new Date(observation.timestamp),
          source: observation.source,
        },
      });
    }

    await tx.fxRate.create({
      data: {
        baseCurrency: input.fx.baseCurrency,
        quoteCurrency: input.fx.quoteCurrency,
        rate: input.fx.rate,
        timestamp: new Date(input.fx.timestamp),
        source: input.fx.source,
      },
    });

    const totalMarketCapEGP = input.observations.reduce((total, observation) => {
      const company = input.observations.find((candidate) => candidate.ticker === observation.ticker);
      return total + (company ? 0 : 0);
    }, 0);

    await tx.marketSnapshot.create({
      data: {
        timestamp: input.timestamp,
        totalMarketCapEGP,
        totalMarketCapUSD: input.fx.rate > 0 ? totalMarketCapEGP / input.fx.rate : 0,
        marketStatus: input.marketStatus,
      },
    });
  });

  return { persisted: true as const };
}
