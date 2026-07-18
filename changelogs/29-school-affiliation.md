# 29 — School Affiliation & Teacher/Course Linkage

**Date:** 19.07.2026
**Scope:** Multi-school data model, registration flow, and admin isolation

## Changes

### Database

- Added `School` model with `id`, `name`, `slug` (unique), and `createdAt` to both `prisma/schema.prisma` and `prisma-postgres/schema.prisma`.
- Added `User.schoolId` → `School` relation (`onDelete: SetNull`) and a composite `@@index([schoolId, role])`.
- Added `Course.schoolId` → `School` and `Course.teacherId` → `User` (`"teacherCourses"` relation) with indexes.

### Seed

- `prisma/seed.js` now creates a demo school (`slug: demo`) before creating users.
- Demo `admin`, `teacher`, and `student` accounts are linked to the demo school.
- Student courses are bound to both the school and the demo teacher.
- Random seeded users also receive `schoolId` and their courses receive `teacherId`/`schoolId`.
- Seed cleanup now also deletes `School` rows.
- Test credentials output includes the demo school code.

### Authentication

- `localRegister` accepts `schoolCode` and validates it against `School.slug`.
- Registration returns `school-not-found` error when the code is invalid.
- New users are automatically linked to the matched school.
- JWT payload now carries `schoolId`.
- `getLocalUser` returns `schoolId` and `schoolName`.

### UI

- `register-form.tsx` includes a "School code" field with validation and error handling.
- `header.tsx` displays the user's school name next to the profile info.

### Admin isolation

- `admin.actions.ts` `requireAdmin` returns the current admin's `schoolId`.
- All admin queries (`getAdminUsers`, `getAdminUserById`, `getAdminStats`, `getFaculties`, `getDbStats`, `getDbTableData`) are scoped to that school.
- `deleteUser` and `updateUserStatus` use `deleteMany`/`updateMany` with `id` + `schoolId` so an admin cannot touch users outside their school.

### Types & translations

- `User` interface extended with optional `schoolId` and `schoolName`.
- Ukrainian and English `auth.register` translations include `field.school-code`, `field.error.school-not-found`, and `validation.school-code-required`.

## Verification commands

```bash
# Validate schemas and regenerate Prisma client
npx --no-install prisma validate
npx --no-install prisma generate

# Type-check the codebase
npx --no-install tsc --noEmit

# Reset local SQLite database with the new seed
npm run db:push -- --force-reset
npm run db:seed

# Start dev server and test flows
npm run dev
```

Manual test flow:

1. Open `http://localhost:3000/register`.
2. Create a new account with School code `demo`.
3. Log in with username or email + password.
4. Confirm the header shows `Demo School`.
5. Open `/module/admin` and verify only demo-school users are listed.
