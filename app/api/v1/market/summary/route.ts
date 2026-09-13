import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalMarketSummary } from '@/lib/market-data/canonical';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const market = (req.nextUrl.searchParams.get('market') ?? 'EG').toUpperCase();
  try {
    return NextResponse.json(await getCanonicalMarketSummary(market), { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Market summary unavailable.' }, { status: 400 });
  }
}
