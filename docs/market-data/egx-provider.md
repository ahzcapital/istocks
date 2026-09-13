# EGX production provider

The production market-data pipeline is provider-agnostic and fails closed when a configured live source is unavailable. The repository does **not** contain a fabricated or unverified EGX endpoint.

## Required production configuration

Set these server-side environment variables in the deployment environment:

- `EGX_MARKET_DATA_URL` — HTTPS JSON endpoint supplied by an authorized market-data provider.
- `EGX_MARKET_DATA_API_KEY` — optional provider credential when required.
- `ADMIN_TOKEN` — required for authenticated administrative diagnostics and refresh operations.

Credentials must never be exposed to client components or committed to the repository.

## Provider contract

The endpoint must return JSON with this shape:

```json
{
  "observations": [
    {
      "ticker": "COMI",
      "price": 1,
      "previousClose": 1,
      "changePercent": 0,
      "volume": 0,
      "timestamp": "2026-09-13T10:00:00Z",
      "source": "authorized-provider",
      "currency": "EGP",
      "countryCode": "EG"
    }
  ],
  "fx": {
    "baseCurrency": "USD",
    "quoteCurrency": "EGP",
    "rate": 50,
    "timestamp": "2026-09-13T10:00:00Z",
    "source": "authorized-provider"
  },
  "marketStatus": "open"
}
```

The downstream validation, reconciliation, historical valuation, and persistence layers remain authoritative. A provider response that fails validation must not be persisted as production data.

## Health check

`GET /api/admin/provider-health` requires `Authorization: Bearer <ADMIN_TOKEN>`.

The endpoint reports whether the live provider is configured and, when configured, performs a real provider request and reports latency, observation count, latest observation timestamp, FX timestamp, and market status. Provider errors return HTTP 503.

## Production refresh

`POST /api/admin/refresh` with the same authorization header runs the production refresh path. If a live provider is configured and fails, the system does not silently substitute the static snapshot.

## Source policy

Only configure a source that is legitimately licensed/authorized for the application's intended use. ICE Data Services publishes Egyptian Exchange streaming, historical and EOD offerings, but its private API/feed credentials and endpoint details must come from the customer's licensed service agreement. Do not infer or invent an ICE endpoint.
