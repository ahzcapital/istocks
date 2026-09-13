# Morocco production market-data provider

North Africa Hub supports a production provider boundary for Morocco (`MA`) without hard-coding a vendor URL or credentials.

## Configuration

Set these server-only environment variables in the deployment environment:

- `MA_MARKET_DATA_URL` — HTTPS endpoint supplied by Bourse de Casablanca or an authorized/certified redistributor.
- `MA_MARKET_DATA_API_KEY` — optional API credential when the provider requires bearer authentication.

The frontend must never receive these values.

## Expected payload

```json
{
  "observations": [
    {
      "ticker": "ATW",
      "price": 710.1,
      "previousClose": 705.0,
      "changePercent": 0.72,
      "volume": 12345,
      "timestamp": "2026-09-13T14:30:00Z",
      "source": "authorized-provider",
      "currency": "MAD",
      "countryCode": "MA"
    }
  ],
  "fx": {
    "baseCurrency": "USD",
    "quoteCurrency": "MAD",
    "rate": 9.37,
    "timestamp": "2026-09-13T14:30:00Z",
    "source": "authorized-fx-provider"
  },
  "marketStatus": "closed"
}
```

The provider is validated against the existing Morocco instrument registry. Unknown tickers fail closed instead of being silently added. Prices and FX values are validated by the canonical market-data pipeline before they can become production market data.

## Data-source policy

The Bourse de Casablanca offers official real-time, delayed, end-of-day and historical market-data products and provides data through certified redistributors. The application therefore keeps the vendor endpoint configurable until an authorized feed and credentials are available.

Until `MA_MARKET_DATA_URL` is configured, Morocco continues to use the verified snapshot dataset. It is explicitly reported as `snapshot` by the canonical API; it is not presented as live data.
