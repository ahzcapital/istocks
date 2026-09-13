import { getEgyptSnapshotFX, getEgyptSnapshotObservations, getExpectedEgyptTickers } from './egypt-snapshot';
import { ConfiguredEgyptHttpProvider } from './http-provider';
import { validateFXObservation, validateMarketObservations, type MarketStatus } from './pipeline';
import { persistEgyptMarketData } from './persistence';

export async function refreshEgyptMarketData(now = new Date()) {
  const liveProvider = new ConfiguredEgyptHttpProvider();

  let observations;
  let fx;
  let marketStatus: MarketStatus = 'closed';
  let providerMode: 'live-http' | 'snapshot' = 'snapshot';
  let providerConfigured = liveProvider.isConfigured();

  if (providerConfigured) {
    providerMode = 'live-http';

    try {
      const live = await liveProvider.fetch();
      observations = live.observations;
      fx = live.fx;
      marketStatus = live.marketStatus ?? 'closed';
    } catch (error) {
      return {
        ok: false,
        market: 'EG',
        providerMode,
        providerConfigured,
        error: error instanceof Error ? error.message : 'Live EGX provider failed.',
        persisted: false,
        persistenceReason: 'No fallback to the static snapshot is performed after a configured live-provider failure.',
      };
    }
  } else {
    // Safe development fallback. This remains explicitly snapshot data and is never labelled live.
    observations = getEgyptSnapshotObservations();
    fx = getEgyptSnapshotFX();
  }

  const validation = validateMarketObservations(observations, getExpectedEgyptTickers(), now);
  const fxIssues = validateFXObservation(fx, now);

  if (!validation.ok || fxIssues.length > 0) {
    return {
      ok: false,
      market: 'EG',
      providerMode,
      providerConfigured,
      observations: validation,
      fx: { ok: false, observation: fx, issues: fxIssues },
      persisted: false,
      persistenceReason: 'Validation failed; no market data was persisted.',
    };
  }

  if (!providerConfigured) {
    return {
      ok: true,
      market: 'EG',
      providerMode: 'snapshot',
      providerConfigured: false,
      observations: validation,
      fx: { ok: true, observation: fx, issues: [] },
      persisted: false,
      persistenceReason: 'EGX_MARKET_DATA_URL is not configured; static snapshot was validated but not persisted as live data.',
    };
  }

  try {
    const persistence = await persistEgyptMarketData({
      observations,
      fx,
      marketStatus,
      timestamp: now,
    });

    return {
      ok: persistence.persisted,
      market: 'EG',
      providerMode,
      providerConfigured,
      observations: validation,
      fx: { ok: true, observation: fx, issues: [] },
      persisted: persistence.persisted,
      persistenceReason: 'reason' in persistence ? persistence.reason : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      market: 'EG',
      providerMode,
      providerConfigured,
      observations: validation,
      fx: { ok: true, observation: fx, issues: [] },
      persisted: false,
      persistenceReason: error instanceof Error ? error.message : 'Database persistence failed.',
    };
  }
}
