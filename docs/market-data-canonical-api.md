# Canonical Market Data API

The application exposes a provider-independent market-data contract. Frontend consumers should use the canonical endpoints rather than provider-specific payloads.

## Endpoints

- `GET /api/v1/market/summary?market=EG`
- `GET /api/v1/market/quotes?market=EG&limit=100`
- `GET /api/v1/market/quotes?market=EG&ticker=COMI`

The legacy `/api/market/summary` endpoint now uses the same canonical service.

## Response contract

Every successful response contains `data` and `meta`.

`meta` includes:

- `market`
- `mode`: `database` or `snapshot`
- `source`
- `delay`
- `asOf`
- `retrievedAt`
- `marketStatus`

Snapshot mode is explicit and must never be presented as live provider data.

## Database behavior

For Egypt, persisted quotes are used only when the database is configured and the latest quote universe is complete. Partial persisted universes fall back to the registered snapshot rather than exposing an incomplete ranking.

Market caps from persisted quotes are calculated from the quote price and the company's current share count; historical persistence uses the separate effective-date share-count engine already established by the market-data pipeline.

## API safety

- Unsupported market codes return HTTP 400.
- Quote limits are bounded to an approved set.
- Ticker filters are exact after case normalization.
- Responses use short CDN caching with stale-while-revalidate.
- Provider credentials never enter API responses.
- No provider-specific endpoint or vendor behavior is hardcoded into the canonical consumer contract.
