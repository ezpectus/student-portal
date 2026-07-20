# Roadmap — Future Versions

## v1.x — Completed ✅

- **Parent Portal** — parents view child's grades, attendance, courses ✅
- **Analytics Dashboard** — user activity, role distribution, registrations, faculty breakdown, grade distribution ✅
- **Circuit breaker** — 5xx errors trip circuit, fast-fail after 5 failures ✅
- **Smart retry** — TransientError retried with backoff ✅
- **Rate limiting** — login (10/min) and registration (5/hour) ✅
- **Feature toggles** — env-based toggles for all major features ✅
- **Structured logging** — JSON output with scoped loggers and correlation IDs ✅
- **Audit logging** — all admin and grade mutations logged ✅
- **Error boundaries** — module, settings, profile error.tsx with retry ✅
- **Health checks** — `/api/healthz` (liveness), `/api/ready` (deep health) ✅
- **Docker rewrite** — multi-stage build, .dockerignore, proper healthchecks ✅

## v2.0 — AI & Intelligence
- **Grade predictions** — heuristic forecast based on grade history trend + attendance rate (no LLM, zero cost) ✅
- **Smart early warnings** — automatic alerts for students at risk of failing (low attendance + declining grades) ✅
- **AI study assistant** — keyword-based study helper with contextual GPA and attendance advice ✅
- **Plagiarism detection** — integrate with open-source plagiarism checkers for assignment submissions

## v2.1 — Parent Portal Extensions
- **Parent-teacher communication** — direct messaging between parents and teachers ✅
- **Weekly digest emails** — automated summary of student progress sent to parents ✅
- **Event calendar** — parent-teacher conferences, exam dates, school events ✅
- **Multi-child support** — link multiple students to one parent account (schema already supports this) ✅

## v2.2 — Mobile App (React Native)
- **Cross-platform** — iOS + Android from single codebase
- **Push notifications** — real-time grade updates, announcements, message alerts
- **Offline mode** — cached grades, schedule, and contacts available without internet
- **QR code attendance** — teacher generates QR, students scan to mark attendance (UI only, needs Prisma migration) ⚠️
- **Biometric login** — Face ID / Touch ID authentication

## v2.3 — LMS Integration
- **Moodle connector** — sync courses, assignments, and grades bi-directionally
- **Canvas LMS connector** — import course structure and export grades
- **Google Classroom** — sync assignments and announcements
- **Microsoft Teams** — integrate meetings and assignments
- **Generic LTI 1.3 support** — standards-based integration with any LMS

## v2.4 — Integration System
- **REST API** — public API with OAuth 2.0 for third-party integrations
- **Slack/Discord bots** — push notifications to team channels

## v2.5 — Multi-Tenant Architecture
- **School isolation** — each school gets separate data namespace, admins can only see their school's data ✅
- **Billing & plans** — freemium model with per-student pricing
- **Admin dashboard** — super-admin view across all schools with aggregated analytics

## v3.0 — Enterprise Features
- **SAML 2.0 SSO** — integrate with university identity providers (Active Directory, Okta, Auth0)
- **Audit compliance** — SOC 2 / GDPR compliance reporting, data retention policies
- **Data warehouse export** — nightly ETL to BigQuery/Snowflake for analytics
- **High availability** — multi-region deployment, read replicas, automatic failover

## v3.1 — Analytics & Insights (partially done ✅)
- **Admin analytics dashboard** — user activity, role distribution, registrations, faculty breakdown, grade distribution ✅
- **Cohort analysis** — track student groups across semesters ✅
- **Predictive dropout** — heuristic at-risk score based on GPA, attendance, and failing courses ✅
- **Grade predictions** — heuristic forecast based on grade history trend + attendance rate (no LLM, zero cost) ✅
- **Teacher effectiveness** — correlate teaching methods with student outcomes ✅
- **Curriculum analytics** — identify courses with high failure rates ✅
- **Custom dashboards** — drag-and-drop dashboard builder for admins ✅

## v3.2 — Communication Hub
- **In-app video calls** — WebRTC-based teacher-student conferences
- **Screen sharing** — for remote tutoring sessions
- **Group chat** — course-specific discussion channels ✅
- **Student feed** — community posts with images, likes, and comments (screenshot sharing) ✅
- **AI study assistant** — keyword-based study helper with contextual advice (GPA, attendance) ✅
- **Announcement scheduling** — schedule announcements for future dates ✅
- **Multi-language announcements** — auto-translate announcements to student's preferred language ✅

## Technical Debt & Infrastructure
- **Add Redis** for session storage and rate limiting (replace in-memory store)
- **Implement OpenTelemetry** for distributed tracing
- **Set up Grafana dashboards** for system health monitoring
- **Add Playwright visual regression tests** for UI components ✅
- **Migrate to Turborepo** if monorepo is needed (mobile + web + API)
- **Add CSP nonce-based script-src** — replace 'unsafe-inline' with per-request nonces ✅
- **Add CSRF tokens** for server action mutations ✅
- **Implement password reset flow** with email verification (currently only reCAPTCHA) ✅
- ~~**Add 2FA/TOTP** for admin accounts~~ — removed (overengineering for current scope)
