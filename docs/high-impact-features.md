# Student Portal — High-Impact Feature Plan

> Priority features for portfolio showcase. Ordered by impact/effort ratio.

---

## 🔥 High Impact, Medium Effort

### 1. ✅ Dashboard with Charts (recharts)
- GPA trends by semester (line chart)
- Grade distribution (bar/donut chart)
- Attendance stats (area chart)
- Cards with key metrics (average score, credits earned, rank)
- **Why**: Clients see charts first. Visual data = instant credibility.

### 2. ✅ Command Palette (Cmd+K)
- Global search across modules, pages, actions
- Keyboard navigation (arrow keys, enter, escape)
- Recent items + quick actions
- Fuzzy search
- **Why**: Linear/Raycast-level UX. Wow-factor ×100.

### 3. ✅ Dark Mode
- Full theme toggle (light/dark/system)
- TailwindCSS `dark:` variants across all components
- Persisted in localStorage via `useLocalStorage`
- Smooth transition animation
- Toggle in sidebar + settings page
- **Why**: Simple but visually impressive. Shows attention to UX.

---

## 💪 High Impact, High Effort

### 4. ✅ Admin Panel + Prisma Database Explorer
- User management table with CRUD operations
- Role assignment (student, teacher, admin)
- Search and filter (by role, status, name)
- Pagination with `usePagination` hook
- Bulk actions (activate/deactivate)
- Server actions for all mutations
- **Why**: Demonstrates full-stack capability and complex state management.

### 5. ✅ Real-time Notifications
- Bell icon in sidebar header with unread badge
- Live dropdown panel with notification list
- Polling-based (5s interval) or SSE
- Toast notifications for new events
- Mark as read / mark all as read
- **Why**: Shows understanding of real-time patterns and UX polish.

### 6. ✅ Multi-step Onboarding Wizard
- Post-registration flow: faculty selection → photo upload → preferences
- Progress bar with step indicators
- Per-step validation with Zod
- Skip option + resume later
- **Why**: Demonstrates complex form handling and user journey design.

---

## 📦 Quick Wins

### 7. ✅ Data Export (CSV/PDF)
- "Download CSV" button on grades table
- "Download PDF" on certificate history
- Client-side CSV generation, server-side PDF
- **Why**: Practical feature clients always need.

### 8. ✅ Skeleton Loaders
- Shimmer placeholders for tables, cards, profile
- Replace empty loading states
- Consistent with component design system
- **Why**: Polish that shows production-grade attention to detail.

---

## Implementation Order

| # | Feature | Est. Time | Dependencies |
|---|---------|-----------|-------------|
| 1 | Dashboard with Charts | ✅ Done | recharts |
| 2 | Command Palette | ✅ Done | cmdk |
| 3 | Dark Mode | ✅ Done | localStorage |
| 4 | Admin Panel + DB Explorer | ✅ Done | Prisma + JWT |
| 5 | Real-time Notifications | ✅ Done | Polling + Prisma |
| 6 | Onboarding Wizard | ✅ Done | Multi-step form |
| 7 | Data Export | ✅ Done | CSV/PDF |
| 8 | Skeleton Loaders | ✅ Done | UI primitives |
