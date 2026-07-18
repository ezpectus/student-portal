# Changelogs

This folder documents every fix applied during the refactoring process. Each changelog file covers a batch of related fixes with exact file paths, line numbers, before/after code, and rationale.

## Files

| File | Description |
|------|-------------|
| [01-security-p0.md](./01-security-p0.md) | P0 critical security fixes: .gitignore, cookie flags, XSS sanitization, JWT validation |
| [02-security-p1.md](./02-security-p1.md) | P1 high security fixes: fetch timeout, open redirect, CSP headers, rel=noopener |
| [03-code-quality.md](./03-code-quality.md) | Code quality fixes: toast delay, filename typo, import placement, FC type, div onClick |
| [04-architecture.md](./04-architecture.md) | Architecture fixes: notFound→redirect, setTimeout leak, loading consistency |
