# v2.1 — Parent-Teacher Communication

## Added
- **`getParentOptionsForTeacher()`** in `msg.actions.ts`:
  - TEACHER: queries `Course` for teacher's students, then `ParentStudent` to find linked parents
  - ADMIN: queries all parents in school
  - Returns `{ id, name }[]` with deduplication
  - Safe default: returns `[]` on error or unauthorized
- **`sendMailToParents()`** in `msg.actions.ts`:
  - Creates `Notification` records for each parent recipient
  - Role-restricted: TEACHER and ADMIN only
  - Zod-validated inputs (recipients, subject, content)
  - Cache invalidation via `revalidateTag(MESSAGES_CACHE_TAG)`
- **Parent recipient type** in `individual.tsx` compose form:
  - New "Parent" radio option alongside "Employee" and "Student"
  - Fetches parent options on select via `getParentOptionsForTeacher()`
  - Uses `sendMailToParents()` on submit when recipient type is `parent`
  - Dedicated placeholder and empty indicator translations

## Module Access
- `msg` and `calendar` added to `getModulesForRole` for TEACHER, ADMIN, PARENT, and STUDENT roles

## Translations
- `uk.json`: `recipient-type.parent`, `form.select-parent-placeholder`, `form.no-parents`
- `en.json`: same keys in English

## Files Changed
- `src/actions/msg.actions.ts` (new actions + imports)
- `src/app/[locale]/(private)/module/msg/components/individual.tsx`
- `src/actions/local-auth.actions.ts` (getModulesForRole)
- `src/messages/uk.json`
- `src/messages/en.json`
