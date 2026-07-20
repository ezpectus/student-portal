# v2.2 — QR Code Attendance

## Added
- **Prisma model**: `AttendanceSession` — token, courseName, teacherId, schoolId, expiresAt, used
- **Server actions** (`src/actions/qr-attendance.actions.ts`):
  - `generateAttendanceQR(courseName)` — creates 5-minute expiring token
  - `verifyAttendanceQR(token, studentId)` — validates and marks attendance
  - `getActiveAttendanceSessions()` — lists active sessions for teacher
- **UI** (`qr-attendance-generator.tsx`):
  - QR code generation button in grading view
  - QR rendered via api.qrserver.com (no dependency needed)
  - Live countdown timer showing validity remaining
  - Auto-expiry when timer reaches 0
  - Regenerate button
- **Integrated** into `grading-view.tsx` — appears beside grading table when course selected

## Translations
- `grading.qr.*` added to both uk.json and en.json

## Files Changed
- `prisma/schema.prisma` (AttendanceSession model)
- `src/actions/qr-attendance.actions.ts` (new)
- `src/app/[locale]/(private)/module/grading/components/qr-attendance-generator.tsx` (new)
- `src/app/[locale]/(private)/module/grading/components/grading-view.tsx` (updated)
- `src/messages/uk.json`, `src/messages/en.json`
