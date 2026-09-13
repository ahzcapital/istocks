import { NextRequest, NextResponse } from 'next/server';
import { refreshEgyptMarketData } from '@/lib/market-data/refresh';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const expectedToken = process.env.ADMIN_TOKEN;

  if (!expectedToken || !auth || auth !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await refreshEgyptMarketData();
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Market data refresh failed',
      },
      { status: 503 },
    );
  }
}
