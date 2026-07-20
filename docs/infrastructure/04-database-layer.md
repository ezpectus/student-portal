# 04 — Database Layer

**Project:** eCampus Student Portal
**Last updated:** July 2026

---

## Database Strategy

The project supports **two databases** through Prisma 7 adapters:

| Environment | Database | Adapter | Connection String |
|-------------|----------|---------|-------------------|
| Development | SQLite | `PrismaBetterSqlite3` | `file:./dev.db` |
| Production | PostgreSQL 17 | `PrismaPg` | `postgresql://user:pass@host:5432/db` |

### Adapter selection (runtime)

```typescript
// src/lib/prisma.ts
const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');

const adapter = isPostgres
  ? new PrismaPg({ connectionString: databaseUrl })
  : new PrismaBetterSqlite3({ url: databaseUrl });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
```

### Why not Prisma's built-in driver?

Prisma 7 uses **adapters** instead of built-in database drivers. This allows:
- Smaller Prisma client bundle (no driver code bundled)
- Runtime adapter selection (same codebase for dev + prod)
- Support for serverless/edge runtimes (no native binaries needed for PG)

---

## Prisma Client Singleton

```typescript
// src/lib/prisma.ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Why singleton?

Next.js dev mode hot-reloads modules. Without singleton, every reload creates a new `PrismaClient` instance, exhausting database connections. The `globalThis` pattern ensures one instance across hot reloads.

---

## SQLite WAL Mode

```typescript
// src/lib/prisma.ts
if (!isPostgres && !globalForPrisma.prisma) {
  prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL').catch(() => {});
}
```

### What is WAL?

WAL (Write-Ahead Logging) is SQLite's concurrency mode:
- **Without WAL (default):** Readers block writers, writers block readers. `SQLITE_BUSY` errors under concurrent access.
- **With WAL:** Writers append to a log file. Readers read the main database. One writer + multiple readers can run concurrently.

### When WAL causes issues

- WAL file (`dev.db-wal`) can grow large without checkpoint
- No automatic `PRAGMA wal_checkpoint(TRUNCATE)` in this project
- In production (PostgreSQL), WAL is irrelevant — PostgreSQL uses MVCC natively

---

## Schema Overview

### Models (16 total)

```
School
  ├── User (1:N)
  ├── Course (1:N)
  ├── Event (1:N)
  ├── ChatRoom (1:N)
  ├── AttendanceSession (1:N)
  └── FeedPost (1:N)

User
  ├── Course (1:N, as student)
  ├── Course (1:N, as teacher via "teacherCourses")
  ├── Attendance (1:N)
  ├── Notification (1:N, received)
  ├── Notification (1:N, sent via "sender")
  ├── AuditLog (1:N)
  ├── GradeHistory (1:N, as changer)
  ├── ParentStudent (1:N, as parent)
  ├── ParentStudent (1:N, as child)
  ├── Event (1:N, as creator)
  ├── ChatMember (1:N)
  ├── ChatRoom (1:N, as creator)
  ├── ChatMessage (1:N)
  ├── AttendanceSession (1:N, as teacher)
  ├── FeedPost (1:N, as author)
  ├── FeedComment (1:N, as author)
  ├── FeedLike (1:N)
  └── RefreshToken (1:N)

Course
  ├── User (N:1, student)
  ├── User (N:1, teacher)
  ├── School (N:1)
  └── GradeHistory (1:N)

ChatRoom
  ├── School (N:1)
  ├── User (N:1, creator)
  ├── ChatMember (1:N)
  └── ChatMessage (1:N)

FeedPost
  ├── User (N:1, author)
  ├── School (N:1)
  ├── FeedComment (1:N)
  └── FeedLike (1:N)

RefreshToken
  └── User (N:1)
```

### Enums

```
Role:
  ADMIN    — full access, admin panel
  TEACHER  — grading, analytics, all common modules
  STUDENT  — study sheet, rating, certificates, common modules
  PARENT   — limited access (parent portal, messaging, calendar, chat)
```

### Key indexes

| Model | Index | Purpose |
|-------|-------|---------|
| User | `@@index([role])` | Filter users by role |
| User | `@@index([schoolId, role])` | School-scoped role queries |
| User | `@@index([lastActiveAt])` | Activity-based sorting |
| Course | `@@index([teacherId])` | Teacher's courses lookup |
| Course | `@@index([schoolId])` | School-scoped course queries |
| Notification | `@@index([userId, read, createdAt])` | Unread notifications |
| AuditLog | `@@index([createdAt])` | Chronological audit trail |
| FeedPost | `@@index([schoolId, createdAt])` | School feed timeline |
| RefreshToken | `@@index([expiresAt])` | Expired token cleanup |
| RefreshToken | `@@index([userId])` | User's active tokens |

---

## School Isolation

Every data query that involves school-scoped data **must** filter by `schoolId`:

```typescript
// Pattern: school isolation in server actions
const user = await getLocalUser();
if (!user) throw new UnauthorizedError();

const posts = await prisma.feedPost.findMany({
  where: {
    schoolId: user.schoolId,  // ← school isolation
    // OR for super-admin (schoolId === undefined):
    ...(user.schoolId ? { schoolId: user.schoolId } : {}),
  },
});
```

### School isolation rules

1. **Regular users** (ADMIN, TEACHER, STUDENT, PARENT): can only access data within their `schoolId`
2. **Super-admin** (schoolId = null): can access data from all schools
3. **Cross-school access** is blocked at the query level, not at the UI level
4. All mutations (create, update, delete) must also enforce `schoolId`

---

## Two-Schema Management

| File | Provider | Commands |
|------|----------|----------|
| `prisma/schema.prisma` | sqlite | `npm run db:push`, `npm run db:generate` |
| `prisma-postgres/schema.prisma` | postgresql | `npm run db:push:postgres`, `npm run db:generate:postgres` |

### Keeping schemas in sync

Both schemas must have **identical models, fields, and relations**. The only difference is the `provider` field:

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
}

// prisma-postgres/schema.prisma
datasource db {
  provider = "postgresql"
}
```

### PostgreSQL-specific considerations

- `String` fields use `TEXT` type in PostgreSQL (no length limit by default)
- `Float` maps to `double precision` in PostgreSQL
- `Boolean` maps to `boolean`
- `DateTime` maps to `timestamp(3)`
- Enums are native in PostgreSQL (`enum Role { ADMIN, TEACHER, STUDENT, PARENT }`)
- In SQLite, enums are stored as strings (no native enum support)

---

## Seeding

```bash
npm run db:seed  # Runs prisma/seed.ts via tsx
```

The seeder creates:
- 1 school (if `schoolCode` env is set)
- Demo users: admin, teacher, student (with hashed passwords)
- Sample courses, attendance, notifications
- Grade history entries

### Destructive seeding

```bash
ALLOW_DESTRUCTIVE_SEED=true npm run db:seed  # Wipes existing data first
```

In Docker: `SEED_DATABASE=true` + `ALLOW_DESTRUCTIVE_SEED=true` env vars trigger seeding on container start.

---

## Database Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run db:generate` | Generate Prisma Client from SQLite schema |
| `npm run db:push` | Apply SQLite schema to database (no migration files) |
| `npm run db:seed` | Insert demo data |
| `npm run db:studio` | Open Prisma Studio (GUI database browser) |
| `npm run db:generate:postgres` | Generate Prisma Client from PostgreSQL schema |
| `npm run db:push:postgres` | Apply PostgreSQL schema to database |
| `npm run build:postgres` | Generate PG client + build for production |

### Why `db push` instead of `migrate`?

This project uses `prisma db push` (schema push) instead of `prisma migrate`:
- **db push:** Applies schema directly, no migration history. Good for prototyping and when data loss is acceptable.
- **migrate:** Creates timestamped migration files, tracks schema evolution. Better for production with existing data.

For production PostgreSQL deployment, consider switching to `prisma migrate` once the schema stabilizes.
