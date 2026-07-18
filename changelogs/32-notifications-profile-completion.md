# Changelog 32 — Notification Preferences, Profile Completion, Audit Cleanup

**Date:** 18.07.2026

## Audit Verification
All 66 items from `docs/05-code-level-audit.md` verified as resolved:
- P0 (4): XSS, JWT validation, cookie flags, env gitignore — all fixed
- P1 (5): CSP headers, rate limiting, open redirect, fetch timeout, IP sanitization — all fixed
- P2 (2): Env validation, error info — all fixed
- Code Quality (12): imports, typo, toast, deps, types, FC, TODOs, logging, SVG — all fixed
- Error Handling (6): consistent strategy, response.ok checks, error propagation — all fixed
- Performance (4): cache strategy, image optimization, SSR conversions — all fixed
- Accessibility (3): lang attribute, aria-labels — all fixed
- React Anti-patterns (4): key={index}, useEffect deps, sleep, Suspense — all fixed
- Dead Code (4): unused deps, Storybook, unused files — all fixed
- i18n (5): hardcoded strings, setRequestLocale, generateMetadata — all fixed
- Navigation (3): loading.tsx, Suspense fallbacks, locale-aware redirects — all fixed
- Security target=_blank (1): rel="noopener noreferrer" — all fixed
- Architecture (12): Radix imports, FC+async, loading consistency, HEALTHCHECK, engines, test script — all fixed

## New Features

### Notification Preferences
- **Prisma schema:** Added `notifyEmail`, `notifyAnnouncements`, `notifyMessages` boolean fields to User model
- **New action:** `updateNotificationPreferences` in `settings.actions.ts` — supports both local (Prisma) and remote (API) auth
- **Settings UI:** New "Notifications" section with Switch toggles for email, announcements, messages
- **Optimistic updates:** Toggle updates immediately, reverts on error
- **Audit logging:** `change_notifications` action logged
- **Translations:** UK/EN for all notification preference labels and hints

### Profile Completion Indicator
- **New component:** `src/app/[locale]/(private)/components/profile-completion-card.tsx`
- Calculates completion percentage from 7 profile fields (photo, phone, faculty, speciality, groupName, birthDate, address)
- Shows progress bar, checklist of missing fields, and "Complete profile" CTA button
- Hides checklist and CTA when profile is 100% complete
- **New UI primitive:** `src/components/ui/progress.tsx` — accessible progress bar with ARIA
- **Integrated** into dashboard alongside SupportCard
- **Translations:** UK/EN for all field labels and UI text

## Files Created
- `src/app/[locale]/(private)/components/profile-completion-card.tsx`
- `src/components/ui/progress.tsx`

## Files Modified
- `prisma/schema.prisma` — notification preference fields on User
- `src/actions/settings.actions.ts` — `updateNotificationPreferences` action, env + prisma imports
- `src/actions/local-auth.actions.ts` — return notification fields from `getLocalUser`
- `src/app/[locale]/(private)/page.tsx` — ProfileCompletionCard on dashboard
- `src/app/[locale]/(private)/settings/settings-form.tsx` — notification preferences section
- `src/messages/uk.json`, `src/messages/en.json` — notification + profile completion translations

## Verification

```bash
npm run db:generate
npm run db:push
npm run tsc
npm run lint
npm test
```
