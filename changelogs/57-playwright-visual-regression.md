# Tech Debt — Playwright Visual Regression Tests

## Added
- **`e2e/visual-regression.spec.ts`**:
  - Login page screenshot comparison (`toHaveScreenshot`)
  - Register page screenshot comparison
  - `maxDiffPixelRatio: 0.01` for minor rendering tolerance
  - Animations disabled for deterministic snapshots
- **`e2e/modules.spec.ts`**:
  - Calendar module loads after admin login
  - Chat module loads with room list
  - Analytics module loads with charts
  - All tests authenticate via test credentials first

## Files Changed
- `e2e/visual-regression.spec.ts` (new)
- `e2e/modules.spec.ts` (new)
