# 04 — Database Concepts: ORM, Prisma & Multi-Database Strategy

**Project:** eCampus Student Portal
**Audience:** Developers learning database concepts
**Language:** English with code examples

---

## Table of Contents

1. [What Is an ORM?](#what-is-an-orm)
2. [Why Prisma?](#why-prisma)
3. [Prisma Schema Language](#prisma-schema-language)
4. [Prisma Adapters (v7)](#prisma-adapters-v7)
5. [SQLite vs PostgreSQL](#sqlite-vs-postgresql)
6. [WAL Mode (Write-Ahead Logging)](#wal-mode-write-ahead-logging)
7. [Connection Management](#connection-management)
8. [Transactions](#transactions)
9. [Indexing Strategy](#indexing-strategy)
10. [Data Seeding](#data-seeding)
11. [Schema Migrations vs Push](#schema-migrations-vs-push)
12. [Multi-Database Strategy in This Project](#multi-database-strategy-in-this-project)

---

## What Is an ORM?

### The problem without an ORM

```typescript
// Raw SQL — error-prone, no type safety
const result = await db.query(
  'SELECT id, username, email FROM users WHERE school_id = $1 AND role = $2',
  [schoolId, 'STUDENT']
);
// result.rows[0].usrname ← typo, no error until runtime
// result.rows[0].email ← is this a string? null? undefined?
```

### With an ORM (Prisma)

```typescript
// Prisma — type-safe, auto-completed, SQL injection-proof
const users = await prisma.user.findMany({
  where: {
    schoolId: schoolId,
    role: 'STUDENT',
  },
  select: {
    id: true,
    username: true,
    email: true,
  },
});
// users[0].username ← TypeScript knows this is a string
// users[0].usrname ← TypeScript error: Property 'usrname' does not exist
```

### What an ORM does

| Feature | Raw SQL | ORM (Prisma) |
|---------|---------|---------------|
| Type safety | ❌ (strings) | ✅ (TypeScript types) |
| Auto-complete | ❌ | ✅ (IDE suggests fields) |
| SQL injection protection | Manual (parameterized queries) | ✅ (built-in) |
| Schema changes | Manual SQL updates | `prisma db push` (auto) |
| Database portability | ❌ (vendor-specific SQL) | ✅ (same code, different DB) |
| Relations | Manual JOINs | ✅ (automatic includes) |
| Migrations | Manual files | ✅ (auto-generated) |

### Relations example

```typescript
// Raw SQL — 3 queries + manual joining
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
const courses = await db.query('SELECT * FROM courses WHERE student_id = $1', [userId]);
const grades = await db.query('SELECT * FROM grade_history WHERE course_id = ANY($1)', [courseIds]);

// Prisma — 1 query, automatic joins
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    courses: {
      include: {
        gradeHistory: true,
      },
    },
  },
});
// user.courses[0].gradeHistory[0].grade ← fully typed, 1 round trip
```

---

## Why Prisma?

### Prisma vs other ORMs

| Feature | Prisma | TypeORM | Sequelize | Drizzle |
|---------|--------|---------|-----------|---------|
| Type safety | ✅ (generated types) | Partial | ❌ | ✅ |
| Schema file | `.prisma` (declarative) | Decorators (code) | Models (code) | `.sql` or code |
| Query API | Object-based (no SQL) | SQL-like | SQL-like | SQL-like |
| Migrations | ✅ (auto) | ✅ | ✅ | Manual |
| Edge runtime | ✅ (adapters) | ❌ | ❌ | ✅ |
| Bundle size | Medium | Large | Large | Small |
| Learning curve | Low | Medium | Medium | Medium |

### Why Prisma for this project

1. **Type safety** — generated types match schema exactly, no drift
2. **Declarative schema** — `.prisma` file is the single source of truth
3. **Adapters (v7)** — runtime database selection (SQLite dev, PostgreSQL prod)
4. **Edge-compatible** — works in Next.js serverless/edge deployments
5. **Prisma Studio** — visual database browser (great for debugging)

---

## Prisma Schema Language

### Structure

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"    // How to generate the client
  output   = "../src/generated/prisma"  // Where to output
}

datasource db {
  provider = "sqlite"               // Database type
  url      = env("DATABASE_URL")    // Connection string from env
}

model User {
  id            Int       @id @default(autoincrement())
  username      String    @unique
  email         String    @unique
  passwordHash  String?
  role          Role      @default(STUDENT)
  schoolId      Int?
  school        School?   @relation(fields: [schoolId], references: [id])
  tokenVersion  Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  courses       Course[]  @relation("CourseStudent")
  attendance    Attendance[]
  refreshTokens RefreshToken[]

  @@index([schoolId, role])
  @@index([role])
}

enum Role {
  ADMIN
  TEACHER
  STUDENT
  PARENT
}
```

### Key annotations

| Annotation | Meaning | Example |
|-----------|---------|---------|
| `@id` | Primary key | `id Int @id @default(autoincrement())` |
| `@unique` | Unique constraint | `email String @unique` |
| `@default()` | Default value | `role Role @default(STUDENT)` |
| `@relation()` | Foreign key relation | `school School? @relation(fields: [schoolId], references: [id])` |
| `@updatedAt` | Auto-update timestamp | `updatedAt DateTime @updatedAt` |
| `@@index()` | Composite index | `@@index([schoolId, role])` |
| `@@unique` | Composite unique | `@@unique([userId, courseId])` |

### Relation types

```prisma
// 1:N — One user has many courses
model User {
  courses Course[] @relation("CourseStudent")
}
model Course {
  studentId Int
  student   User   @relation("CourseStudent", fields: [studentId], references: [id])
}

// N:M — Many users in many chat rooms (via join table)
model ChatRoom {
  members ChatMember[]
}
model ChatMember {
  roomId Int
  room   ChatRoom @relation(fields: [roomId], references: [id])
  userId Int
  user   User     @relation(fields: [userId], references: [id])
  @@unique([roomId, userId])  // prevent duplicate memberships
}

// 1:1 — One user has one profile (not in this project, but concept)
model User {
  profile Profile?
}
model Profile {
  userId Int      @unique
  user   User     @relation(fields: [userId], references: [id])
}
```

---

## Prisma Adapters (v7)

### What changed in Prisma 7?

Before Prisma 7, the Prisma Client included database drivers directly (e.g. `@prisma/client` bundled SQLite/PostgreSQL driver code). In Prisma 7, drivers are **adapters** — separate packages you install and configure:

```
Before:  prisma generate → PrismaClient (includes driver)
After:   prisma generate → PrismaClient (no driver) + adapter (separate package)
```

### Why adapters?

1. **Smaller bundle** — only include the driver you need
2. **Runtime selection** — choose database at runtime (dev vs prod)
3. **Edge compatibility** — adapters work in serverless/edge runtimes
4. **Community drivers** — anyone can write an adapter

### In this project

```typescript
// src/lib/prisma.ts
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
const isPostgres = databaseUrl.startsWith('postgresql://');

// Runtime adapter selection
const adapter = isPostgres
  ? new PrismaPg({ connectionString: databaseUrl })
  : new PrismaBetterSqlite3({ url: databaseUrl });

export const prisma = new PrismaClient({ adapter });
```

### Two separate schemas

Because SQLite and PostgreSQL have different capabilities (e.g. enums), Prisma needs separate schema files:

| File | Provider | When to use |
|------|----------|-------------|
| `prisma/schema.prisma` | `sqlite` | Local development |
| `prisma-postgres/schema.prisma` | `postgresql` | Production |

### Two separate configs

```typescript
// prisma-postgres.config.ts
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma-postgres/schema.prisma',
});
```

```bash
# SQLite commands
npm run db:generate    # prisma generate
npm run db:push        # prisma db push

# PostgreSQL commands
npm run db:generate:postgres   # prisma generate --config prisma-postgres.config.ts
npm run db:push:postgres       # prisma db push --config prisma-postgres.config.ts
```

---

## SQLite vs PostgreSQL

### Comparison

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Type | Embedded (file-based) | Server-based |
| Setup | Zero (just a file) | Requires server process |
| Concurrency | WAL mode (1 writer, many readers) | MVCC (many writers + readers) |
| Scale | Good for <100 concurrent users | Good for 10,000+ concurrent users |
| Data types | Limited (no native enums, no arrays) | Rich (enums, arrays, JSON, UUID) |
| Full-text search | Basic (FTS5 extension) | Advanced (tsvector, trigram) |
| Backup | Copy file | pg_dump / replication |
| Use case | Development, prototyping | Production |

### Why SQLite for development?

1. **Zero setup** — no server to install or configure
2. **Fast** — no network overhead (direct file access)
3. **Portable** — database is a single file (`dev.db`)
4. **Git-friendly** — can commit the file (though we don't)

### Why PostgreSQL for production?

1. **Concurrency** — MVCC allows many simultaneous writers
2. **Scalability** — handles thousands of concurrent connections
3. **Data integrity** — ACID compliance, foreign key enforcement
4. **Types** — native enums, arrays, JSON, UUID
5. **Ecosystem** — pgAdmin, Adminer, monitoring tools, replication

### The difference that matters most: concurrency

```
SQLite (without WAL):
  Writer A: BEGIN TRANSACTION → write row 1
  Writer B: BEGIN TRANSACTION → SQLITE_BUSY (wait for A)
  Writer B: retry... retry... retry... SQLITE_BUSY (timeout)

SQLite (with WAL):
  Writer A: writes to WAL log
  Reader C: reads from main database (not blocked)
  Writer B: SQLITE_BUSY (still only 1 writer at a time)

PostgreSQL (MVCC):
  Writer A: BEGIN → write row 1 (creates new row version)
  Writer B: BEGIN → write row 2 (creates new row version)
  Reader C: reads old versions (not blocked)
  All three run concurrently ✅
```

---

## WAL Mode (Write-Ahead Logging)

### What is WAL?

WAL (Write-Ahead Logging) is SQLite's concurrency mode. Instead of writing directly to the database file, writes go to a separate log file (`dev.db-wal`). Readers read the main database file. This allows concurrent reads and writes.

### Without WAL (default: rollback journal)

```
Writer: Lock database → Write to journal → Apply to database → Unlock
Reader: Must wait for writer to finish

Result: Readers block writers, writers block readers → SQLITE_BUSY
```

### With WAL

```
Writer: Append changes to WAL file (-wal)
Reader: Read from main database file (ignores WAL)
Checkpoint: WAL changes merged into main database (automatic)

Result: One writer + many readers concurrently
```

### In this project

```typescript
// src/lib/prisma.ts
if (!isPostgres && !globalForPrisma.prisma) {
  prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL').catch(() => {});
}
```

### WAL files

```
dev.db       — main database file
dev.db-wal   — write-ahead log (changes not yet checkpointed)
dev.db-shm   — shared memory index (used for WAL coordination)
```

### WAL checkpoint

The WAL file grows as writes accumulate. A **checkpoint** merges WAL changes into the main database file and resets the WAL file.

**Automatic checkpoint:** SQLite auto-checkpoints when the WAL reaches 1000 pages (~4MB).

**Manual checkpoint:**
```sql
PRAGMA wal_checkpoint(TRUNCATE);
-- TRUNCATE: checkpoint + reset WAL file to zero size
-- PASSIVE: checkpoint but don't block new writes
-- FULL: checkpoint and block until complete
```

**Risk in this project:** No manual checkpoint is scheduled. Under heavy write load, the WAL file can grow large. Not a problem for development, but worth monitoring.

---

## Connection Management

### The problem

```
Without singleton:
  Hot reload → new PrismaClient → new DB connection
  10 hot reloads → 10 connections → connection pool exhausted
  Next request → "too many connections" error
```

### The solution: globalThis singleton

```typescript
// src/lib/prisma.ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter, log: ['query'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### How it works

```
First load:
  globalForPrisma.prisma = undefined
  → create new PrismaClient
  → store in globalForPrisma.prisma

Hot reload (2nd load):
  globalForPrisma.prisma = existing PrismaClient
  → reuse existing instance (no new connection)

Production:
  globalForPrisma.prisma = undefined (fresh process)
  → create new PrismaClient
  → don't store in globalForPrisma (not needed, no hot reload)
```

### Connection pooling (PostgreSQL)

PostgreSQL has a maximum number of connections (default: 100). Each PrismaClient opens a connection pool.

```
PrismaClient default pool size: 10 connections (num_cpus * 2 + 1)
Docker container: 1 process → 10 connections
Multiple containers: 5 containers × 10 = 50 connections

If PostgreSQL max_connections = 100:
  10 containers × 10 = 100 → connection limit reached
  11th container → "too many connections" error
```

**Solutions:**
- PgBouncer (connection pooler) — sits between app and PostgreSQL
- Reduce pool size: `new PrismaClient({ adapter, poolSize: 5 })`
- Serverless: use Neon's connection pooler (built-in)

---

## Transactions

### What is a transaction?

A transaction is a group of operations that either all succeed or all fail. This ensures data consistency.

### Example: Transfer grade + audit log

```typescript
// Without transaction — partial failure possible
await prisma.course.update({ where: { id: 1 }, data: { grade: 95 } });
// ↑ succeeds
await prisma.auditLog.create({ data: { action: 'update_grade', ... } });
// ↑ fails (DB error) → grade updated but no audit record!

// With transaction — all or nothing
await prisma.$transaction([
  prisma.course.update({ where: { id: 1 }, data: { grade: 95 } }),
  prisma.auditLog.create({ data: { action: 'update_grade', ... } }),
]);
// If either fails, both are rolled back
```

### Interactive transactions

```typescript
// For conditional logic within a transaction
const result = await prisma.$transaction(async (tx) => {
  const course = await tx.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  if (course.grade === newGrade) {
    return { skipped: true };  // no change needed
  }

  await tx.course.update({ where: { id: courseId }, data: { grade: newGrade } });
  await tx.gradeHistory.create({ data: { courseId, oldGrade: course.grade, newGrade, ... } });

  return { skipped: false };
});
```

### In this project

Transactions are used sparingly — most operations are single queries. The audit logging is **non-blocking** (separate try/catch), so it doesn't need to be in the same transaction.

---

## Indexing Strategy

### What is an index?

An index is a data structure that speeds up database queries. Without an index, the database must scan every row (full table scan). With an index, it can find rows in O(log n) time.

### Without an index

```sql
-- No index on email
SELECT * FROM users WHERE email = 'john@example.com';
-- Database scans ALL rows → slow on large tables
```

### With an index

```sql
-- Index on email
SELECT * FROM users WHERE email = 'john@example.com';
-- Database uses index → finds row in milliseconds
```

### In this project

```prisma
model User {
  id       Int      @id @default(autoincrement())
  username String   @unique           // ← implicit index
  email    String   @unique           // ← implicit index
  role     Role
  schoolId Int?

  @@index([role])              // ← filter by role
  @@index([schoolId, role])    // ← filter by school + role (composite)
  @@index([lastActiveAt])      // ← sort by activity
}
```

### Composite indexes

```
@@index([schoolId, role])

Efficient for:
  WHERE schoolId = 1 AND role = 'STUDENT'     ✅ uses full index
  WHERE schoolId = 1                           ✅ uses leftmost part
  WHERE role = 'STUDENT'                       ❌ cannot use index (role is 2nd)
```

**Rule:** In a composite index, put the most selective (most filtered) column first.

### When NOT to index

- Small tables (<100 rows) — full scan is faster than index lookup
- Frequently updated columns — every update must also update the index
- Columns rarely used in WHERE clauses — waste of space

---

## Data Seeding

### What is seeding?

Seeding populates the database with initial data (demo users, sample courses, etc.).

### In this project

```typescript
// prisma/seed.ts
import { PrismaClient } from '@/generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create school
  const school = await prisma.school.create({
    data: { name: 'Demo University', code: 'DEMO' },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@demo.edu',
      passwordHash: adminPassword,
      role: 'ADMIN',
      schoolId: school.id,
    },
  });

  // Create teacher, student, sample courses...
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Running the seed

```bash
npm run db:seed                    # Normal seed
ALLOW_DESTRUCTIVE_SEED=true npm run db:seed  # Wipe + seed (destructive)
```

### In Docker

```env
SEED_DATABASE=true
ALLOW_DESTRUCTIVE_SEED=true
```

The Docker entrypoint script checks these env vars and runs seeding on container start.

---

## Schema Migrations vs Push

### `prisma db push`

```
Schema change → db push → Database updated directly
                           (no migration files created)
                           (data may be lost on breaking changes)
```

**Pros:** Simple, fast, no migration files to manage.
**Cons:** No history of schema changes, no rollback, data loss on breaking changes.

### `prisma migrate`

```
Schema change → migrate dev → Creates migration SQL file
                              → Applies migration to database
                              → Records in _prisma_migrations table

Production: migrate deploy → Applies pending migration files
```

**Pros:** Version-controlled schema history, rollback capability, safe for production.
**Cons:** More complex, migration files accumulate.

### In this project

This project uses `db push` (not `migrate`):

```bash
npm run db:push           # SQLite
npm run db:push:postgres  # PostgreSQL
```

**Why?** The project is in active development — schema changes frequently. Migration files would create noise. Once the schema stabilizes for production, switching to `migrate` is recommended.

### When to switch to migrations

```
Development phase:  db push (fast iteration, data loss acceptable)
Staging:            db push (still testing, data loss acceptable)
Production:         migrate (schema changes must be tracked, rollback needed)
```

---

## Multi-Database Strategy in This Project

### The challenge

```
Development:  SQLite (file:./dev.db) — zero setup, fast
Production:   PostgreSQL (Docker/Neon) — concurrent, scalable
```

The same codebase must work with both databases.

### How it works

```
1. Two schema files:
   prisma/schema.prisma          → provider: sqlite
   prisma-postgres/schema.prisma → provider: postgresql

2. Two Prisma clients (generated separately):
   npm run db:generate           → generates SQLite client
   npm run db:generate:postgres  → generates PostgreSQL client

3. Runtime adapter selection:
   DATABASE_URL=file:./dev.db                    → SQLite adapter
   DATABASE_URL=postgresql://user@host/db        → PostgreSQL adapter

4. Same application code:
   prisma.user.findMany(...)  ← works with both adapters
```

### Schema differences

The schemas are **almost identical**. The only difference is the `provider`:

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// prisma-postgres/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Enum handling difference

```
SQLite:      Enums stored as strings (Role = "ADMIN", "TEACHER", ...)
PostgreSQL:  Enums stored as native enum type (CREATE TYPE "Role" AS ENUM ...)
```

Prisma handles this transparently — the application code is the same regardless of database.

### Keeping schemas in sync

**Manual process:** When you change one schema, you must update the other.

```bash
# 1. Edit prisma/schema.prisma (add a field)
# 2. Edit prisma-postgres/schema.prisma (add the same field)
# 3. Generate both clients:
npm run db:generate && npm run db:generate:postgres
# 4. Push to both databases:
npm run db:push && npm run db:push:postgres
```

**Risk:** If schemas drift, one database may be missing fields or models. The application code expects both to be identical.

### Build for production

```bash
npm run build:postgres
# Runs: prisma generate --config prisma-postgres.config.ts && next build
```

This generates the PostgreSQL Prisma client and builds the Next.js app for production deployment.
