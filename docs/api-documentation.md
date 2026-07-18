# API Documentation

## Internal API Routes

### Health Checks

#### `GET /api/healthz`
Liveness probe — returns 200 if the process is running.

**Response:**
```json
{ "status": "ok" }
```

#### `GET /api/ready`
Readiness probe — deep health check including database, external API, and circuit breaker state.

**Response (200 — healthy/degraded):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": [
    { "name": "database", "status": "healthy", "latencyMs": 5 },
    { "name": "external-api", "status": "healthy", "latencyMs": 120 }
  ]
}
```

**Response (503 — unhealthy):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": [
    { "name": "database", "status": "unhealthy", "detail": "Connection refused" },
    { "name": "external-api", "status": "healthy", "latencyMs": 120 }
  ]
}
```

### Data Export

#### `GET /api/export?type=grades`
Export the authenticated user's grades as a CSV file.

**Authentication:** Requires valid JWT cookie.

**Response:** CSV file download (`grades.csv`).

| Column | Type | Description |
|--------|------|-------------|
| Course | string | Course name |
| Grade | number | Numeric grade (0-100) |
| Grade Type | string | NUMERIC, LETTER, or ECTS |
| Credits | number | Credit hours |

#### `GET /api/export?type=attendance`
Export the authenticated user's attendance records as a CSV file.

**Authentication:** Requires valid JWT cookie.

**Response:** CSV file download (`attendance.csv`).

| Column | Type | Description |
|--------|------|-------------|
| Month | string | Month identifier |
| Present | number | Classes attended |
| Total | number | Total classes |
| Missed | number | Classes missed (total - present) |

---

## Server Actions

Server actions are the primary API surface for the Student Portal. They run on the server via Next.js Server Components and are not exposed as HTTP endpoints.

### Authentication (`src/actions/auth.actions.ts`)

| Action | Parameters | Returns | Throws |
|--------|-----------|---------|--------|
| `loginWithCredentials` | `{ username, password, rememberMe }` | JWT payload | `ValidationError`, `ActionError` |
| `registerUser` | `{ name, email, schoolCode, password, role }` | User object | `ValidationError`, `ActionError` |
| `resetPassword` | `{ username, recaptchaToken }` | void | `ValidationError`, `ActionError` |
| `getUserDetails` | — | `User \| null` | Never (safe default) |
| `logout` | — | void | Never |

### Grading (`src/actions/grading.actions.ts`)

| Action | Parameters | Returns | Throws |
|--------|-----------|---------|--------|
| `getTeacherCourses` | — | `TeacherCourse[]` | Never (safe default: `[]`) |
| `getCourseStudents` | `courseName: string` | `CourseStudent[]` | Never (safe default: `[]`) |
| `updateGrade` | `{ courseId, grade, gradeType }` | void | `ValidationError`, `Error` |
| `getGradeHistory` | `courseId: number` | `GradeHistoryEntry[]` | Never (safe default: `[]`) |

### Admin (`src/actions/admin.actions.ts`)

| Action | Parameters | Returns | Throws |
|--------|-----------|---------|--------|
| `getUsers` | `{ page, pageSize, search, role, status }` | `{ users, total }` | Never (safe default) |
| `getAdminStats` | — | `AdminStats` | Never (safe default) |
| `deleteUser` | `userId: number` | void | `UnauthorizedError`, `ActionError` |
| `updateUserStatus` | `{ userId, status }` | void | `UnauthorizedError`, `ActionError` |

### Messages (`src/actions/msg.actions.ts`)

| Action | Parameters | Returns | Throws |
|--------|-----------|---------|--------|
| `getMails` | `{ page }` | `{ items, total }` | Never (safe default) |
| `getMail` | `id: number` | `Mail \| null` | Never (safe default) |
| `sendMail` | `{ recipients, subject, content }` | void | `ValidationError`, `ActionError` |
| `getUnreadMailCount` | — | `number` | Never (safe default: `0`) |

### Profile (`src/actions/profile.actions.ts`)

| Action | Parameters | Returns | Throws |
|--------|-----------|---------|--------|
| `getContacts` | — | `Contact[]` | Never (safe default: `[]`) |
| `getContactTypes` | — | `ContactType[]` | Never (safe default: `[]`) |
| `createContact` | `{ typeId, value }` | `Contact` | `ValidationError`, `ActionError` |
| `updateContact` | `{ id, typeId, value }` | void | `ValidationError`, `ActionError` |
| `deleteContact` | `id: number` | void | `ValidationError`, `ActionError` |

### Certificates (`src/actions/certificates.actions.ts`)

| Action | Parameters | Returns | Throws |
|--------|-----------|---------|--------|
| `getCertificateTypes` | — | `CertificateType[]` | Never (safe default) |
| `getCertificateList` | — | `Certificate[]` | Never (safe default) |
| `createCertificate` | `{ type, text }` | `Certificate` | `ValidationError`, `ActionError` |
| `updateCertificate` | `{ id, status }` | void | `ActionError` |

### Dashboard (`src/actions/dashboard.actions.ts`)

| Action | Parameters | Returns | Throws |
|--------|-----------|---------|--------|
| `getDashboardData` | — | `DashboardData` | Never (cached, safe default) |

---

## Error Types

All server actions use typed errors from `src/lib/api-error.ts`:

| Error Type | HTTP Equivalent | Retryable | Example |
|-----------|----------------|-----------|---------|
| `ValidationError` | 400 | No | Invalid input data |
| `UnauthorizedError` | 401 | No | Missing/invalid JWT |
| `NotFoundError` | 404 | No | Resource doesn't exist |
| `PermanentError` | 4xx | No | Server rejected request |
| `TransientError` | 5xx | Yes | Server temporarily unavailable |

## Cache Tags

Cache invalidation is managed via tags in `src/lib/constants/cache-tags.ts`:

| Tag | Used By | Revalidated By |
|-----|---------|----------------|
| `dashboard` | `getDashboardData` | `updateGrade`, admin mutations |
| `admin` | Admin read actions | `deleteUser`, `updateUserStatus` |
| `rating` | Rating read actions | `updateGrade` |
| `messages` | Message read actions | `sendMail` |
| `certificates` | Certificate read actions | `createCertificate`, `updateCertificate` |
| `announcements` | Announcement read actions | `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement` |
| `user-profile` | Profile read actions | `createContact`, `updateContact`, `deleteContact` |

## Feature Toggles

Controlled via `NEXT_PUBLIC_FEATURE_*` environment variables. All default to ON.

| Feature | Env Variable | Default |
|---------|-------------|---------|
| Dark Mode | `NEXT_PUBLIC_FEATURE_DARK_MODE` | `true` |
| Command Palette | `NEXT_PUBLIC_FEATURE_COMMAND_PALETTE` | `true` |
| Realtime Notifications | `NEXT_PUBLIC_FEATURE_REALTIME_NOTIFICATIONS` | `true` |
| Admin Panel | `NEXT_PUBLIC_FEATURE_ADMIN_PANEL` | `true` |
| Data Export | `NEXT_PUBLIC_FEATURE_DATA_EXPORT` | `true` |
| Grading | `NEXT_PUBLIC_FEATURE_GRADING` | `true` |
