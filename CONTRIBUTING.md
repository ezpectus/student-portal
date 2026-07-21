# Contributing to Student Portal

Thank you for your interest in contributing! This document covers the basics.

## Prerequisites

- Node.js 22+
- npm 10+
- SQLite (included, zero config) or PostgreSQL (optional)

## Getting Started

```bash
# Clone and install
git clone https://github.com/ezpectus/student-portal.git
cd student-portal
npm install

# Set up environment
cp .env.example .env.development
# Edit .env.development — set JWT_SECRET (min 16 chars)

# Create database and seed
npx prisma db push
npx tsx prisma/seed.ts

# Start dev server
npm run dev
```

Test accounts (after seeding): `admin` / `teacher` / `student` / `parent` — password: `test12345`

## Development Workflow

1. **Create a branch**: `git checkout -b feature/your-feature`
2. **Make changes**: Follow existing code style and patterns
3. **Run checks**:
   ```bash
   npx tsc --noEmit          # Type check
   npx eslint src/            # Lint
   npm run test               # Unit tests (Vitest)
   npm run build              # Production build
   ```
4. **Commit**: Use conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`)
5. **Push and open a PR**

## Code Style

- **TypeScript**: Strict mode, no `any` types
- **Imports**: Sorted by `simple-import-sort` (run `npx eslint src/ --fix`)
- **Server Actions**: Must be async, must call `requireCsrf()` on mutations
- **Validation**: Use Zod schemas via `validateInput()`
- **Auth**: Use `getLocalUserLite()` for id/role/schoolId, `getLocalUser()` for full profile
- **Error handling**: Mutations throw, reads return safe defaults
- **i18n**: All user-facing strings must have translations in `en.json` and `uk.json`

## Testing

```bash
# Run all tests
npm run test

# Run specific test file
npx vitest run src/lib/rate-limit.test.ts

# E2E tests (requires running server)
npx playwright test
```

## Project Structure

```
src/
├── actions/          # Server actions (Next.js)
├── app/              # App router pages and layouts
├── components/       # React components (UI + feature)
├── lib/              # Utilities, services, configuration
├── messages/         # i18n translations (en, uk)
├── types/            # TypeScript type definitions
└── generated/        # Prisma generated client (gitignored)
```

## Key Architectural Decisions

- **Dual auth mode**: Local auth (SQLite, JWT) for demo/portfolio, remote API for production
- **Prisma ORM**: SQLite for dev, PostgreSQL schema ready for production
- **Server Actions**: All mutations go through server actions with CSRF protection
- **Rate limiting**: In-memory by default, Redis when `REDIS_URL` is set
- **Email**: Nodemailer with graceful fallback when SMTP not configured

## Reporting Issues

Use the [GitHub issue tracker](https://github.com/ezpectus/student-portal/issues). Please include:

- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, browser)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
