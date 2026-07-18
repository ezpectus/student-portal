# Changelog 31 — Audit Logging Expansion, Keyboard Shortcuts, Dead Code Cleanup

**Date:** 18.07.2026

## Security

### Password Reset Rate Limiting
- Added rate limiting to `resetPassword` in `auth.actions.ts` (keyed by `reset:{username}`)
- Returns typed `{ ok: false, error: 'rate-limited', retryAfterMs }` when blocked

### Audit Logging Expansion
- `settings.actions.ts` — `changeEmail`, `changePhoto`, `changePassword` now log audit events
- New audit action translations: `change_email`, `change_password`, `change_photo` (UK/EN)

## UX

### Keyboard Shortcuts Help Dialog
- **New component:** `src/components/command-palette/keyboard-shortcuts-help.tsx`
- Opens with `Shift + ?` — shows all available shortcuts in a dialog
- Groups: General (⌘K, ⇧?, ESC) and Navigation (⌘K → page)
- Integrated into private layout alongside CommandPalette
- **Translations:** UK/EN `commandPalette.shortcuts.*`

### Empty State Component
- **New component:** `src/components/utils/empty-state.tsx`
- Reusable empty state with icon, title, description, and optional action
- Can replace ad-hoc empty `<p>` tags across modules for consistent UX

## Dead Code Cleanup
- **Deleted:** `src/components/types.ts` — unused `IconPosition` type (zero imports)
- Confirmed already removed: `date-fns`, `react-day-picker`, `@tanstack/react-table` deps
- Confirmed already fixed: Q-12 (shared SVGO config), Q-03 (toast delay), Q-04 (useEffect deps)

## Files Created
- `src/components/command-palette/keyboard-shortcuts-help.tsx`
- `src/components/utils/empty-state.tsx`

## Files Modified
- `src/actions/auth.actions.ts` — rate limiting on password reset
- `src/actions/settings.actions.ts` — audit logging for email/photo/password changes
- `src/app/[locale]/(private)/layout.tsx` — KeyboardShortcutsHelp integration
- `src/messages/uk.json`, `src/messages/en.json` — shortcuts + audit action translations

## Files Deleted
- `src/components/types.ts`

## Verification

```bash
npm run tsc
npm run lint
npm test
```
