# North Africa Hub — Step 1 Market Data Pipeline Agent Prompt

Act as a senior Next.js/TypeScript architect, financial-data engineer, database architect, QA engineer, and production reliability engineer.

Repository: `ahzcapital/istocks`

## Objective
Build Step 1 of the market-data architecture without redesigning the UI and without pretending static snapshots are live data.

## Current problem
The repository exposes a provider abstraction, but the Egypt provider is unbound and the current market dataset is a dated snapshot. The refresh endpoint currently only reports provider status. The first milestone is a validated, explicit data pipeline that can safely accept a real provider later.

## Required architecture

```text
Provider observation
        ↓
Normalization
        ↓
Validation
        ↓
Reconciliation / quality gate
        ↓
Persistence adapter
        ↓
Market API
        ↓
UI
```

## Rules
1. Inspect existing code before changing it.
2. Preserve existing public APIs unless there is a clear compatibility-safe improvement.
3. Do not invent, fabricate, or silently substitute financial data.
4. Treat the existing Egypt snapshot as `snapshot` data, not live data.
5. Every observation must carry source and timestamp metadata.
6. Validation must reject invalid prices, FX rates, timestamps, duplicate tickers, unknown tickers, and malformed observations.
7. Stale data must be explicitly marked; never present it as live.
8. Keep provider integration isolated from UI components.
9. Do not add dependencies unless necessary.
10. Do not make the Vercel build depend on a live database or unavailable provider credentials.

## Step 1 scope
- Create strongly typed market-data observation and validation primitives.
- Add a provider adapter for the existing Egypt snapshot so it flows through the same pipeline as future live providers.
- Add validation and quality-report logic.
- Upgrade the admin refresh endpoint to execute the pipeline and return a structured quality report.
- Add unit tests for validation and pipeline behavior.
- Keep the existing UI and market calculations compatible.

## Validation requirements
At minimum validate:
- ticker is non-empty and unique
- price is finite and > 0
- previous close is finite and > 0 when present
- change percent is finite when present
- timestamp parses to a valid date
- timestamp is not in the future beyond a small clock-skew tolerance
- source is non-empty
- FX rate is finite and > 0
- every configured company expected by the snapshot is represented
- no duplicate ticker observations

## Failure behavior
- Return a structured failure report.
- Never replace invalid values with guessed values.
- Keep the existing snapshot available when validation fails.
- Do not claim a successful refresh if no external provider was contacted.

## Verification
Run:
- `npm run typecheck`
- `npm test`
- `npm run build`

If a command cannot run in the execution environment, report that explicitly instead of claiming it passed.

## Completion criteria
Step 1 is complete only when:
- the provider contract is explicit;
- the Egypt snapshot is represented as a provider observation source;
- validation is deterministic and unit-tested;
- the refresh endpoint runs the validation pipeline;
- no existing market UI behavior is intentionally broken;
- typecheck, tests, and build pass, or any blocked verification is explicitly documented.
