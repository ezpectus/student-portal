# Changelog 29 — Layout, Onboarding, Remaining Audit Fixes

**Date:** 18.07.2026

## Architecture

- **A-01 (accessibility):** Moved `<html lang={locale}>` and `<body>` from root `layout.tsx` to `[locale]/layout.tsx` with dynamic `lang` attribute. Root layout now just passes through `children`. Root `not-found.tsx` has its own minimal `<html>` wrapper for non-locale 404s.
- **I-02:** Added `setRequestLocale(locale)` to admin page — was the only module page missing it.
- **Admin page fix:** Corrected `searchParams` destructuring that was using `params` instead of the resolved search params.

## Error Handling

- **E-04:** Removed silent try/catch in `studysheet/[id]/page.tsx` that caused infinite `LoadingScreen` on API failure. Errors now propagate to the error boundary with retry button.
- **E-03:** Verified — `profile.actions.ts` already throws with HTTP status code (not generic "Bad request").
- **E-06:** Verified — `code-of-honor.middleware.ts` was removed; no more silent error swallowing.

## Code Quality

- **Q-10:** Verified — only 2 valid recaptcha FIXMEs remain (library limitation, no action needed).
- **S-01:** Verified — all `target="_blank"` links have `rel="noopener noreferrer"` including the dynamic `PublicLink` component.

## New Feature: Multi-step Onboarding Wizard

- **3-step wizard:** Academic info → Personal details → Photo upload
- **Progress indicator:** Animated step dots showing current/completed/pending
- **Per-step validation:** Zod schemas with translated validation messages
- **Skip options:** Skip individual steps or skip all
- **Server actions:** `updateOnboardingProfile`, `uploadOnboardingPhoto`, `completeOnboarding` in `onboarding.actions.ts`
- **Post-registration redirect:** Registration now redirects to `/onboarding` instead of `/`
- **Translations:** Full UK/EN translation keys under `private.onboarding.*`
- **Loading state:** `loading.tsx` with `LoadingScreen`

### Files Created
- `src/actions/onboarding.actions.ts`
- `src/components/onboarding/onboarding-wizard.tsx`
- `src/app/[locale]/(private)/onboarding/page.tsx`
- `src/app/[locale]/(private)/onboarding/loading.tsx`

### Files Modified
- `src/app/layout.tsx` — simplified to pass-through children
- `src/app/[locale]/layout.tsx` — added `<html lang={locale}>` and `<body>`
- `src/app/not-found.tsx` — standalone HTML wrapper for root 404
- `src/app/[locale]/(private)/module/studysheet/[id]/page.tsx` — removed silent catch
- `src/actions/monitoring.actions.ts` — added return type annotations
- `src/app/[locale]/(private)/module/admin/page.tsx` — added setRequestLocale, fixed searchParams
- `src/app/[locale]/(public)/(auth)/register/register-form.tsx` — redirect to onboarding
- `src/messages/uk.json` — added onboarding translations
- `src/messages/en.json` — added onboarding translations
- `docs/high-impact-features.md` — marked notifications and onboarding as done

## Feature Status

All 8 high-impact features are now complete:
1. ✅ Dashboard with Charts
2. ✅ Command Palette
3. ✅ Dark Mode
4. ✅ Admin Panel + DB Explorer
5. ✅ Real-time Notifications
6. ✅ Multi-step Onboarding Wizard
7. ✅ Data Export (CSV/PDF)
8. ✅ Skeleton Loaders
