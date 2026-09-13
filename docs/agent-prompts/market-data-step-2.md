# North Africa Hub — Step 2 Live EGX + Persistence Agent Prompt

Act as a senior financial-data engineer, Next.js/TypeScript architect, PostgreSQL/Prisma engineer, API integration engineer, QA engineer, and production reliability engineer.

Repository: `ahzcapital/istocks`

## Objective
Advance the Step 1 validated market-data pipeline into a production-ready live-provider and persistence architecture for Egypt without fabricating a data source.

## Required architecture

```text
Licensed/authorized EGX provider or server-side proxy
                 ↓
        Provider adapter
                 ↓
           Normalization
                 ↓
            Validation
                 ↓
           Quality gate
                 ↓
      PostgreSQL / Prisma
                 ↓
             Market API
                 ↓
                UI
```

## Rules
1. Inspect the existing Step 1 implementation before changing it.
2. Never invent an API endpoint, provider, ticker, quote, FX value, or historical value.
3. The live provider must be configured through server-only environment variables.
4. Do not expose provider API keys to client code or `NEXT_PUBLIC_*` variables.
5. A configured live-provider failure must fail closed; do not silently replace it with the static snapshot.
6. The static Egypt dataset remains available as an explicitly labelled development snapshot only.
7. Persist only observations that pass validation.
8. Persist quotes, FX rates, and market snapshots transactionally.
9. Do not make the Vercel build require a database connection.
10. Do not redesign the UI in this step.

## Provider contract
The configurable HTTP adapter expects JSON shaped like:

```json
{
  "observations": [
    {
      "ticker": "COMI",
      "price": 100,
      "previousClose": 99,
      "changePercent": 1.01,
      "volume": 100000,
      "timestamp": "2026-09-13T10:30:00.000Z",
      "source": "provider-name",
      "currency": "EGP",
      "countryCode": "EG"
    }
  ],
  "fx": {
    "baseCurrency": "USD",
    "quoteCurrency": "EGP",
    "rate": 51.36,
    "timestamp": "2026-09-13T10:30:00.000Z",
    "source": "provider-name"
  },
  "marketStatus": "open"
}
```

## Environment
Use:
- `EGX_MARKET_DATA_URL`
- `EGX_MARKET_DATA_API_KEY`
- `DATABASE_URL`

Never commit real credentials.

## Persistence
Use the existing Prisma models:
- `Company`
- `MarketQuote`
- `FXRate`
- `MarketSnapshot`

Quote persistence must calculate `change` only when `previousClose` exists.
Market-cap snapshots must use the database company's `sharesOutstanding` and the validated quote price. Never manufacture a market cap from an unrelated number.

## Failure behavior
- Provider unavailable → return a failed refresh result.
- Invalid provider response → return a failed refresh result.
- Validation failure → do not persist anything.
- Database failure → transaction must roll back.
- Missing `DATABASE_URL` → do not crash the build; report persistence as unavailable.
- Never silently fall back from a configured live provider to static data.

## Verification
Run:
- `npm run typecheck`
- `npm test`
- `npm run build`

If execution is unavailable, explicitly report that fact. Never claim a command passed without actually running it.

## Completion criteria
Step 2 is complete only when:
- a real provider can be plugged in without changing the UI;
- live observations pass the same deterministic validation layer as snapshots;
- valid observations can be persisted transactionally;
- `/api/admin/refresh` distinguishes live vs snapshot mode;
- configured live-provider failures never silently fall back;
- no credentials are committed;
- typecheck/tests/build pass, or blocked verification is explicitly documented.
