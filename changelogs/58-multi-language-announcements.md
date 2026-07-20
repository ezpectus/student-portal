# v3.2 — Multi-Language Announcements (Auto-Translate)

## Added
- **`autoTranslate` field** in announcement form:
  - Zod schema: `z.boolean().default(false)` in `schema.ts`
  - Type: `autoTranslate?: boolean` in `types.ts`
  - Action schema: `z.boolean().optional().default(false)` in `announcement.actions.ts`
  - `toAnnouncementCreate` maps the field to API payload
- **UI**: `<Switch>` toggle in `announcement-form.tsx` after language select
  - Label: "Автоматичний переклад іншими мовами" (uk) / "Auto-translate to other languages" (en)
  - Default: off
- **Translations**: `fields.autoTranslate` added to both `uk.json` and `en.json`

## Files Changed
- `src/app/[locale]/(private)/module/announcementseditor/components/schema.ts`
- `src/app/[locale]/(private)/module/announcementseditor/components/announcement-form.tsx`
- `src/app/[locale]/(private)/module/announcementseditor/types.ts`
- `src/actions/announcement.actions.ts`
- `src/messages/uk.json`
- `src/messages/en.json`
