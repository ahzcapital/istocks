import { prisma } from '@/lib/prisma';
import type { FXObservation, MarketObservation, MarketStatus } from './pipeline';
import { calculateHistoricalValuation, resolveShareCount } from './historical-valuation';

export type PersistEgyptMarketDataInput = { observations: MarketObservation[]; fx: FXObservation; marketStatus: MarketStatus; timestamp: Date };

export async function persistEgyptMarketData(input: PersistEgyptMarketDataInput) {
  if (!process.env.DATABASE_URL) return { persisted: false as const, reason: 'DATABASE_URL is not configured.' };

  await prisma.$transaction(async (tx) => {
    let totalMarketCapEGP = 0;

    for (const observation of input.observations) {
      const company = await tx.company.findUnique({ where: { ticker: observation.ticker } });
      if (!company) throw new Error(`Cannot persist unknown company ticker: ${observation.ticker}`);

      const quoteTimestamp = new Date(observation.timestamp);
      let history = await tx.shareCountHistory.findMany({
        where: { companyId: company.id },
        orderBy: { effectiveFrom: 'asc' },
      });

      if (history.length === 0) {
        await tx.shareCountHistory.create({
          data: {
            companyId: company.id,
            sharesOutstanding: company.sharesOutstanding,
            effectiveFrom: quoteTimestamp,
            source: 'company.current_shares_outstanding',
            confidence: 'fallback',
          },
        });
        history = await tx.shareCountHistory.findMany({
          where: { companyId: company.id },
          orderBy: { effectiveFrom: 'asc' },
        });
      }

      const effectiveShareCount = resolveShareCount(
        history.map((record) => ({
          sharesOutstanding: Number(record.sharesOutstanding),
          effectiveFrom: record.effectiveFrom,
          effectiveTo: record.effectiveTo,
          source: record.source,
          confidence: record.confidence,
        })),
        quoteTimestamp,
      );

      if (!effectiveShareCount) {
        throw new Error(`No effective share-count record exists for ${observation.ticker} at ${quoteTimestamp.toISOString()}`);
      }

      await tx.marketQuote.create({
        data: {
          companyId: company.id,
          price: observation.price,
          previousClose: observation.previousClose,
          changePercent: observation.changePercent,
          volume: observation.volume,
          change: observation.previousClose !== undefined ? observation.price - observation.previousClose : undefined,
          timestamp: quoteTimestamp,
          source: observation.source,
        },
      });

      const valuation = calculateHistoricalValuation(
        { ticker: observation.ticker, price: observation.price, timestamp: quoteTimestamp },
        effectiveShareCount,
        { rate: input.fx.rate, timestamp: new Date(input.fx.timestamp) },
      );
      totalMarketCapEGP += valuation.marketCapLocal;
    }

    await tx.fXRate.create({
      data: {
        baseCurrency: input.fx.baseCurrency,
        quoteCurrency: input.fx.quoteCurrency,
        rate: input.fx.rate,
        timestamp: new Date(input.fx.timestamp),
        source: input.fx.source,
      },
    });

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
