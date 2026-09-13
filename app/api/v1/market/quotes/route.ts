import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalMarketCompanies } from '@/lib/market-data/canonical';

export const dynamic = 'force-dynamic';

const ALLOWED_LIMITS = [10, 20, 50, 100, 200, 300, 500, 1000] as const;

export async function GET(req: NextRequest) {
  const market = (req.nextUrl.searchParams.get('market') ?? 'EG').toUpperCase();
  const rawLimit = Number(req.nextUrl.searchParams.get('limit') ?? '100');
  const limit = ALLOWED_LIMITS.includes(rawLimit as (typeof ALLOWED_LIMITS)[number]) ? rawLimit : 100;
  const ticker = req.nextUrl.searchParams.get('ticker')?.trim().toUpperCase();

  try {
    const response = await getCanonicalMarketCompanies(market);
    const filtered = ticker ? response.data.filter((company) => company.ticker.toUpperCase() === ticker) : response.data;
    const data = filtered.slice(0, limit);
    return NextResponse.json({ data, meta: { ...response.meta, count: data.length, available: filtered.length, requestedLimit: limit, calculated: true } }, { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Market quotes unavailable.' }, { status: 400 });
  }
}
