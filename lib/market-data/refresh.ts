import { getEgyptSnapshotFX, getEgyptSnapshotObservations, getExpectedEgyptTickers } from './egypt-snapshot';
import { validateFXObservation, validateMarketObservations } from './pipeline';

export async function refreshEgyptMarketData(now = new Date()) {
  // This is intentionally a snapshot adapter until a real EGX provider is configured.
  // It never presents the static dataset as live market data.
  const observations = getEgyptSnapshotObservations();
  const fx = getEgyptSnapshotFX();
  const validation = validateMarketObservations(observations, getExpectedEgyptTickers(), now);
  const fxIssues = validateFXObservation(fx, now);

  return {
    ok: validation.ok && fxIssues.length === 0,
    market: 'EG',
    providerMode: 'snapshot',
    providerConfigured: false,
    observations: validation,
    fx: {
      ok: fxIssues.length === 0,
      observation: fx,
      issues: fxIssues,
    },
    persisted: false,
    persistenceReason: 'Step 1 validates the provider pipeline. A live provider and persistence adapter are intentionally not fabricated.',
  };
}
