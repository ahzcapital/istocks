import { NextRequest, NextResponse } from 'next/server';
import { ConfiguredEgyptHttpProvider } from '@/lib/market-data/http-provider';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const expectedToken = process.env.ADMIN_TOKEN;

  if (!expectedToken || !auth || auth !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const provider = new ConfiguredEgyptHttpProvider();

  if (!provider.isConfigured()) {
    return NextResponse.json({
      ok: true,
      configured: false,
      mode: 'snapshot-only',
      liveData: false,
      reason: 'EGX_MARKET_DATA_URL is not configured.',
    });
  }

  const startedAt = Date.now();

  try {
    const payload = await provider.fetch();
    const timestamp = payload.observations.reduce<string | null>((latest, observation) => {
      if (!observation.timestamp) return latest;
      if (!latest) return observation.timestamp;
      return Date.parse(observation.timestamp) > Date.parse(latest) ? observation.timestamp : latest;
    }, null);

    return NextResponse.json({
      ok: true,
      configured: true,
      mode: provider.mode,
      liveData: true,
      latencyMs: Date.now() - startedAt,
      observationCount: payload.observations.length,
      latestObservationTimestamp: timestamp,
      fxTimestamp: payload.fx.timestamp,
      marketStatus: payload.marketStatus ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        mode: provider.mode,
        liveData: false,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'EGX provider health check failed',
      },
      { status: 503 },
    );
  }
}
