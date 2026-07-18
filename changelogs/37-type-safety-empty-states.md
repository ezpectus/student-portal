# Changelog 37 — Type Safety Fix, Empty States, Skeletons

**Date:** 18.07.2026

## Type Safety: Last `any` Eliminated

### `admin.actions.ts` — `Record<string, any>` → `Record<string, unknown>`
- `getAdminUsers` used `Record<string, any>` for Prisma `where` clause
- Replaced with `Record<string, unknown>` — type-safe, no `any` escape hatch
- **Result: Zero `any` types remaining in entire codebase**

## Empty States Added to Tables

Three table components were missing empty states when data array was empty:

### `history-table.tsx` (certificates)
- Wrapped `<Table>` in conditional: shows empty message when `certificates.length === 0`
- Translation: "У вас ще немає замовлень сертифікатів" / "You have no certificate orders yet"

### `all-docs-table.tsx` (facultycertificate)
- Early return with empty message when `certificates.length === 0`
- Translation: "Заявок на сертифікати поки немає" / "No certificate requests yet"

### `disciplines-table.tsx` (studysheet)
- Early return with empty message when `disciplines.length === 0`
- Translation: "Немає даних для відображення" / "No data to display"

All empty states follow the existing convention: `<p className="text-muted-foreground py-12 text-center text-sm">`.

## Files Modified
- `src/actions/admin.actions.ts` — `any` → `unknown`
- `src/app/[locale]/(private)/module/certificates/components/history-table.tsx` — empty state
- `src/app/[locale]/(private)/module/facultycertificate/components/all-docs-table.tsx` — empty state
- `src/app/[locale]/(private)/module/studysheet/components/disciplines-table.tsx` — empty state
- `src/messages/uk.json` — 3 new empty state translations
- `src/messages/en.json` — 3 new empty state translations

## Verification

```bash
npm run tsc
npm run lint
npm test
```
