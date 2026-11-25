# Aadai — Feature-wise Task Checklist (Lead & Junior)

## MVP build checklist for Mahbub (Lead) and the Junior developer

> Based on the Aadai Product, Business & Technical Plan (segments S0.x–S1.x, business rules BR-x.y, API list §11). UI designs: Stitch project https://stitch.google.com/projects/553130861876911257 (Bangla-first, very simple UI). Stack: ASP.NET Core (.NET 10) + MS SQL Server with Clean Architecture, Next.js (App Router, TypeScript) web, Flutter mobile.

## How to use this checklist

- Work **feature by feature, top to bottom**. Within a feature, LEAD tasks that others depend on come first; JUNIOR tasks show a **Depends on** note when they need LEAD work merged before starting.
- Each task should take **0.5–2 days**. If a task grows larger, split it and add the new tasks here.
- Tick the checkbox only when the task meets the **Definition of Done** below and its PR is merged.
- References like S1.2, BR-5.6 and §11.5 point to sections of the main plan document; API routes are relative to /api/v1.
- JUNIOR tasks include **AC (acceptance criteria)** so they can be done independently; if an AC is unclear, ask before starting, not after.

## Owner legend

- **[LEAD] — Mahbub:** architecture, core business logic, security, ledger/balance engine, multi-tenancy, auth, payment & messaging integrations, background jobs, sync engine, deployment, and code review of every PR.
- **[JUNIOR] — Junior developer:** well-scoped CRUD endpoints, UI screens from Stitch, forms & validation, list/search/filter, simple read endpoints, tests, seed data, documentation, and translations.

## Status convention

- ☐ Not started → ☐ add "(in progress – name, date)" after the task while working → ☑ Done (merged + DoD met).
- Blocked tasks: add "(BLOCKED: reason)" at the end and tell the Lead the same day.
- Optional: copy each feature into the issue tracker (GitHub Issues/Projects) using the task text as the issue title and the AC as the description.

## Branch, PR & review rules

- Branch from main: feat/<segment>-<short-name> (e.g., feat/S1.1-customer-list), fix/<short-name>. One task (or a few tiny related ones) per PR.
- Conventional Commits: feat(customers): add list endpoint, fix(ledger): …, test(…), docs(…).
- PR size target < 600 changed lines (excluding generated code and migrations). Include: what/why, rules implemented (BR-x.y), how to test, screenshots for UI.
- All CI checks green + **Lead approval required** before merge. Junior never merges own PRs touching ledger, auth, tenancy, payments or migrations without Lead review.
- Never use float/double for money, never hard-delete ledger data, never bypass tenant filters, never commit secrets.

## Definition of Done (every task)

- [ ] Code follows Clean Architecture layering and conventions (Appendix A of the plan).
- [ ] Acceptance criteria met and demonstrated (test or screenshot/video).
- [ ] Unit/integration tests added; endpoints tested for 400 / 401 / 403 / 404 (cross-tenant).
- [ ] No warnings; lint/analyzers clean; CI green.
- [ ] OpenAPI updated and web/mobile API clients regenerated when an endpoint changed.
- [ ] UI text in Bangla and English (no hard-coded strings); screen matches Stitch; works at 360 px width.
- [ ] Docs/README updated if setup or behavior changed.
- [ ] Reviewed and approved by Lead; deployed to staging and smoke-tested.

## Summary

| Feature | Lead tasks | Junior tasks | Suggested order / week |
|---|---|---|---|
| 1. Project Setup & DevOps (S0.1, S0.2) | 6 | 6 | Week 1 |
| 2. Cross-cutting Backend Foundation (S0.3) | 5 | 4 | Weeks 1–2 |
| 3. Database & Multi-tenancy (S0.4) | 4 | 2 | Week 2 |
| 4. Auth, Users & Roles (S0.5, S0.6) | 7 | 6 | Week 2 |
| 5. Business (Tenant) & Settings (S0.5, S1.10 partial) | 2 | 6 | Weeks 2–3 |
| 6. Customers (S1.1, S1.4) | 2 | 11 | Weeks 3–4 |
| 7. Suppliers (S1.1) | 0 | 3 | Week 4 |
| 8. Ledger Entries & Balance Engine (S1.2, S1.3) | 6 | 11 | Weeks 3–5 |
| 9. Due Dates, Overdue & Aging (S1.5) | 2 | 5 | Week 5 |
| 10. Promise-to-Pay (S1.5) | 2 | 3 | Week 5 |
| 11. Messaging & Reminders (SMS, WhatsApp, Templates, Rules, Hangfire) (S1.8, S1.9) | 7 | 12 | Weeks 7–8 |
| 12. Customer Statement Link (S1.7) | 1 | 4 | Week 6 |
| 13. Collector App, Approvals & Cash Hand-over (S1.13, S1.14) | 2 | 4 | Weeks 10–11 |
| 14. Offline Sync (Mobile) (S1.12) | 3 | 2 | Weeks 10–11 |
| 15. Dashboard & Daily Summary (S1.6, S1.15) | 1 | 3 | Week 6 (+ digest Week 11) |
| 16. Reports & Export (S1.6, S1.16) | 2 | 5 | Week 6 (+ import Week 12) |
| 17. Notifications (S1.15) | 1 | 2 | Week 11 |
| 18. Audit Log & Security (S1.3, S1.17) | 2 | 2 | Week 4 (+ hardening Week 12) |
| 19. Subscription, Billing & Platform Admin (S1.10) | 3 | 5 | Week 9 |
| 20. Localization (Bangla / English) | 1 | 3 | Ongoing, Weeks 1–12 |
| 21. Testing & QA (cross-feature) | 1 | 3 | Ongoing (+ E2E Week 12) |
| 22. Deployment & Pilot Onboarding (S1.17, S1.18) | 4 | 3 | Weeks 12–13 |
| 23. Phase 2 (brief — plan after MVP) | 4 | 4 | Months 4–7 |
| **Total** | **68** | **109** | MVP ≈ 13 weeks, then Phase 2 |

## 1. Project Setup & DevOps (S0.1, S0.2)

**Backend / Repo**
- [ ] **[LEAD]** Create mono-repo layout (src/, web/, mobile/, docs/, deploy/) and .NET 10 solution: Aadai.Domain, Aadai.Application, Aadai.Infrastructure, Aadai.Api (+ test projects). Directory.Build.props (nullable, warnings as errors), Directory.Packages.props, global.json, .editorconfig.
- [ ] **[LEAD]** Write ADR-0001 (Clean Architecture) and ADR-0002 (multi-tenancy: shared DB + TenantId filter) in docs/adr/.
- [ ] **[LEAD]** Decide library licences (Mediator vs MediatR, Mapster, QuestPDF, Shouldly) and record them in an ADR.
- [ ] **[JUNIOR]** docker-compose.yml with SQL Server 2022, Seq and MinIO. **AC:** `docker compose up` starts all three; README section "Run locally" lists ports and default credentials (dev only).
- [ ] **[JUNIOR]** README.md: prerequisites (.NET 10 SDK, Node LTS, Flutter stable, Docker), how to run API/web/mobile, how to run tests. **AC:** a new machine can follow it end to end without help.

**Web (Next.js)**
- [x] **[JUNIOR]** Scaffold web/ with Next.js App Router, TypeScript strict, ESLint, Prettier, Tailwind, shadcn/ui. **AC:** `npm run lint` and `npm run build` pass; one placeholder page renders. *(mock data, API wiring pending)*
- [x] **[JUNIOR]** Add next-intl with bn/en message files and a language switcher in the layout. **AC:** switching language changes a sample string without reload errors; bn is default. *(mock data, API wiring pending)*

**Mobile (Flutter)**
- [ ] **[JUNIOR]** Scaffold mobile/ with flavors (dev/staging/prod), flutter_lints, Riverpod, go_router, intl/ARB (bn default, en). **AC:** `flutter analyze` clean; app launches to a placeholder screen in Bangla on Android emulator.
- [ ] **[LEAD]** Mobile core folder structure (core/, features/<x>/data|domain|presentation) and dio client skeleton with interceptors.

**CI/CD**
- [ ] **[LEAD]** GitHub Actions: backend build + test (Testcontainers SQL Server), web lint/typecheck/build, mobile analyze/test; branch protection on main.
- [x] **[JUNIOR]** PR template with Definition of Done checklist and Dependabot/Renovate config. **AC:** opening a PR shows the template; Dependabot opens update PRs weekly.
- [ ] **[LEAD]** Architecture tests (NetArchTest): Domain references nothing; Application doesn't reference Infrastructure/Api.

## 2. Cross-cutting Backend Foundation (S0.3)

**Backend API**
- [ ] **[LEAD]** Result<T>/Error types, base Entity/AggregateRoot/ValueObject, domain events.
- [ ] **[LEAD]** Money value object (decimal(18,2), MidpointRounding.AwayFromZero, BR-2.1–2.3) and PhoneNumber (BD E.164 normalization, BR-1.2).
- [ ] **[LEAD]** Mediator pipeline behaviors: Validation, Logging, Authorization, UnitOfWork/Transaction, Idempotency, Performance.
- [ ] **[LEAD]** Global exception handler → ProblemDetails with error codes (§11.1); API versioning (/api/v1).
- [ ] **[JUNIOR]** OpenAPI + Scalar UI in Development, health checks /health/live and /health/ready (DB). **AC:** both URLs return 200 locally; ready returns 503 when SQL container is stopped.
- [ ] **[JUNIOR]** Serilog setup (console + Seq) with CorrelationId middleware. **AC:** every log line has CorrelationId; response header X-Correlation-Id is returned.
- [ ] **[LEAD]** IClock / ITenantClock (Asia/Dhaka local date) using TimeProvider.

**Tests**
- [ ] **[JUNIOR]** Unit tests for PhoneNumber: 017XXXXXXXX, +88017…, 88017…, invalid (012…, short, letters). **AC:** ≥ 12 cases, all green, named after BR-1.2.
- [ ] **[JUNIOR]** Unit tests for Money rounding & formatting helpers (0.005 → 0.01, lakh/crore grouping 1,23,456.00). **AC:** ≥ 10 cases green.

## 3. Database & Multi-tenancy (S0.4)

**DB**
- [ ] **[LEAD]** AppDbContext, schemas, conventions (decimal(18,2), datetime2, nvarchar), interceptors: audit columns, soft delete, tenant stamping & guard (BR-1.1), SyncChangeLog writer, outbox.
- [ ] **[LEAD]** Global query filters (TenantId + IsDeleted) and ITenantContext from JWT claim `tid`; ITenantConnectionResolver stub.
- [ ] **[LEAD]** Initial migration: Tenants, Branches, Plans, Subscriptions, Users, Memberships, Roles, RolePermissions, OtpCodes, UserSessions, RefreshTokens, AuditLogs, SecurityEvents.
- [ ] **[JUNIOR]** Seed data: system roles (Owner, Manager, Staff, Collector, Viewer) with permission mapping from §7.10, and 3 default plans (Starter/Business/Premium) from §13.2. **AC:** seeding is idempotent (running twice creates no duplicates); values match the plan tables.
- [ ] **[JUNIOR]** Demo data seeder (dev only): 1 tenant, 200 customers with Bangla names, 20 suppliers, realistic phone numbers. **AC:** `dotnet run -- seed-demo` (or similar) populates a clean DB in < 30 s.

**Tests**
- [ ] **[LEAD]** Integration tests: tenant A data invisible to tenant B; cross-tenant update throws; soft-deleted rows hidden.

## 4. Auth, Users & Roles (S0.5, S0.6)

**Backend API**
- [ ] **[LEAD]** OTP request/verify (POST /auth/otp/request, /auth/otp/verify): hashed codes, 5-min TTL, attempt & rate limits; fake SMS gateway logs OTP in dev.
- [ ] **[LEAD]** Signup, login, refresh-token rotation with reuse detection, logout, password reset/change (POST /auth/signup, /auth/login, /auth/refresh, /auth/logout, /auth/password/*).
- [ ] **[LEAD]** JWT issuing (sub, tid, role, perm, sid), switch-tenant (POST /auth/switch-tenant), permission policy provider + [HasPermission].
- [ ] **[JUNIOR]** GET/PATCH /me and GET/DELETE /me/sessions/{id}. **Depends on:** LEAD auth. **AC:** user can list own sessions and revoke one; revoked session's refresh token fails with 401.
- [ ] **[LEAD]** Members & invitations: POST /members/invitations, POST /invitations/{token}/accept, last-owner rule (BR-1.3).
- [ ] **[JUNIOR]** GET /members, PUT /members/{id} (role/branch/active), GET /roles, GET /permissions. **Depends on:** invitations. **AC:** Manager cannot assign Owner role (403); integration tests for 200/403/404.

**Web (Next.js)**
- [x] **[LEAD]** BFF auth route handlers (/api/auth/*) with httpOnly refresh cookie; access token kept in memory; route protection middleware. *(mock data, API wiring pending)*
- [x] **[JUNIOR]** Login, signup, OTP verify, forgot-password pages from Stitch designs (Bangla first). **Depends on:** BFF handlers. **AC:** full signup with test OTP works; form errors shown in Bangla from ProblemDetails; works at 360 px width. *(mock data, API wiring pending)*
- [x] **[JUNIOR]** Members page: list, invite dialog (phone + role), change role, deactivate. **AC:** matches Stitch; buttons hidden when user lacks permission. *(mock data, API wiring pending)*

**Mobile (Flutter)**
- [ ] **[LEAD]** Auth interceptor (single-flight refresh on 401), secure token storage (flutter_secure_storage).
- [ ] **[JUNIOR]** Login / OTP / signup screens from Stitch with big inputs and Bangla labels. **Depends on:** auth interceptor. **AC:** login with test number reaches home; invalid OTP shows Bangla error; widget tests for the 3 screens.
- [ ] **[JUNIOR]** App lock: PIN + biometric (local_auth) toggle in settings, auto-lock after 5 min idle. **AC:** re-opening app after idle asks for PIN/fingerprint; can be turned off.

**Tests**
- [ ] **[LEAD]** Tests: OTP expiry/attempts, refresh rotation & reuse revoke, 429 on OTP flood, 403 on missing permission.

## 5. Business (Tenant) & Settings (S0.5, S1.10 partial)

**Backend API**
- [ ] **[LEAD]** POST /tenants (creator = Owner; creates default branch, trial subscription, wallet with trial credit, default reminder rules & templates).
- [ ] **[JUNIOR]** GET /tenant, PUT /tenant (profile), PUT /tenant/settings (credit days, send window, digest time, flags) with FluentValidation. **AC:** invalid send window (end < start) returns 400; only Owner can update (403 test).
- [ ] **[JUNIOR]** POST /tenant/logo via pre-signed upload URL (POST /files/upload-url). **AC:** jpg/png ≤ 2 MB accepted; others rejected with 400.
- [ ] **[JUNIOR]** GET /tenant/setup-checklist (customers added, opening balances, reminder rules reviewed, test message sent, staff invited). **AC:** each item flips to done based on real data; unit tested.
- [ ] **[LEAD]** POST /tenant/period-lock (BR-2.7) enforcement hook for ledger.

**Web**
- [x] **[JUNIOR]** Create-business wizard + business switcher in top bar (Stitch). **AC:** new user creates a business and lands on dashboard; switching business reloads data. *(mock data, API wiring pending)*
- [x] **[JUNIOR]** Settings → Business profile & preferences pages. **AC:** saves and shows success toast; Bangla/English labels. *(mock data, API wiring pending)*

**Mobile**
- [ ] **[JUNIOR]** Business picker & create-business screen; settings screen (language, app lock, logout). **AC:** matches Stitch; language change applies instantly.

## 6. Customers (S1.1, S1.4)

**Backend API**
- [ ] **[LEAD]** Party aggregate & rules (BR-1.2, BR-4.6), opening-balance hook into ledger, collector scoping (BR-6.1).
- [ ] **[JUNIOR]** GET /customers with pagination, search (name/phone/code, Bangla & English), filters (group, area, collector, overdue, balance range), sort. **Depends on:** Party aggregate. **AC:** 5,000 seeded customers search < 400 ms; returns `{items,page,pageSize,totalCount,totalPages}`.
- [ ] **[JUNIOR]** POST/PUT/GET /customers/{id}, DELETE (soft, only zero balance), archive/unarchive/restore. **AC:** delete with non-zero balance returns 422 with rule BR-4.6; ETag/If-Match on PUT returns 409 on stale version.
- [ ] **[JUNIOR]** GET /customers/check-duplicate?phone= and PUT /customers/{id}/collector, POST /customers/bulk/assign-collector. **AC:** duplicate check normalizes phone formats; bulk assign of 100 customers in one call.
- [ ] **[JUNIOR]** Party groups CRUD (GET/POST/PUT/DELETE /party-groups). **AC:** cannot delete a group in use (or moves customers to "none" — documented).
- [ ] **[LEAD]** PUT /customers/{id}/consent with ConsentEvents (BR-8.10); dispute flag endpoints.

**DB**
- [ ] **[JUNIOR]** EF configurations & migration for Parties, PartyGroups, PartyConsents, ConsentEvents with indexes from §10.4. **Depends on:** LEAD review of entity design. **AC:** migration applies cleanly; indexes exist (check with SSMS/sql query).

**Web**
- [x] **[JUNIOR]** Customer list page (TanStack Table, server pagination, debounce search, filters, Bangla numerals toggle) from Stitch. **AC:** matches Stitch; empty state and loading skeleton; works at 360 px. *(mock data, API wiring pending)*
- [x] **[JUNIOR]** Add/Edit customer form (Zod mirrors backend rules), duplicate-phone warning. **AC:** server validation errors map to fields; success toast. *(mock data, API wiring pending)*
- [x] **[JUNIOR]** Customer detail page shell: balance card, aging mini-chart placeholder, tabs (Ledger, Promises, Messages, Timeline). **AC:** data loads from GET /customers/{id}; tabs routed. *(mock data, API wiring pending)*

**Mobile**
- [ ] **[JUNIOR]** Customer list with search & filter chips, customer detail screen, add/edit form (very simple, Bangla). **AC:** matches Stitch; search works on Bangla and English names.
- [ ] **[JUNIOR]** Import from phone contacts (flutter_contacts): pick multiple → create customers. **AC:** permission flow handled; duplicates skipped with message.

**Tests**
- [ ] **[JUNIOR]** Integration tests for all customer endpoints: 200, 400, 401, 403, 404 (cross-tenant). **AC:** one test class per endpoint group; all green in CI.

## 7. Suppliers (S1.1)

**Backend API**
- [ ] **[JUNIOR]** Reuse party handlers for /suppliers (list, create, update, delete, archive, ledger). **Depends on:** Customers backend. **AC:** same tests as customers pass for suppliers; supplier balance shown as "দেবো" (we owe).

**Web / Mobile**
- [x] **[JUNIOR]** Supplier list, form and detail pages (web) — clone customer pages with supplier wording. **AC:** matches Stitch; payable shown in red "দেবো ৳X". *(mock data, API wiring pending)*
- [ ] **[JUNIOR]** Supplier list/detail/form screens (mobile). **AC:** same as web.

## 8. Ledger Entries & Balance Engine (S1.2, S1.3)

**Backend API (core — LEAD owns logic)**
- [ ] **[LEAD]** LedgerEntry aggregate (append-only, BR-4.1), entry types table §7.3, DocumentSequences (BR-3.4).
- [ ] **[LEAD]** DueItems & Allocations, AllocationService (FIFO + manual), over-payment → advance (BR-5.1–5.8).
- [ ] **[LEAD]** BalanceAfter maintenance incl. back-dated inserts (BR-3.3), Party.CurrentBalance with rowversion concurrency (BR-3.2).
- [ ] **[LEAD]** Endpoints: POST /ledger/credit-sales, /ledger/payments-received, /ledger/credit-purchases, /ledger/payments-made, /ledger/adjustments with Idempotency-Key.
- [ ] **[LEAD]** Reverse & correct: POST /ledger/entries/{id}/reverse, /correct (BR-4.2–4.5) with staff time window.
- [ ] **[JUNIOR]** GET /ledger/entries (tenant-wide list with filters: date range, type, method, user, collector) and GET /ledger/entries/{id}. **Depends on:** ledger aggregate. **AC:** paginated; filters combine with AND; cross-tenant 404 test.
- [ ] **[JUNIOR]** GET /customers/{id}/ledger and /suppliers/{id}/ledger with date range and running balance. **AC:** running balance column equals BalanceAfter; sorted by EntryDate, SequenceNo.
- [ ] **[JUNIOR]** PATCH /ledger/entries/{id} for note/reference/attachment only, with audit row. **AC:** attempt to change amount is ignored/400; audit log shows before/after.
- [ ] **[JUNIOR]** GET /ledger/allocation-preview?customerId=&amount=. **Depends on:** AllocationService. **AC:** returns same allocation as actual payment would (test compares both).
- [ ] **[JUNIOR]** GET /ledger/entries/{id}/receipt.pdf with QuestPDF and Bangla font (Noto Sans Bengali / Hind Siliguri). **AC:** Bangla renders correctly (no broken conjuncts) on a sample receipt.

**Web**
- [x] **[JUNIOR]** "বাকি দিন" (Give credit) and "জমা নিন" (Receive payment) dialogs from Stitch: big amount input, method picker, due date auto-filled, allocation preview, credit-limit warning. **Depends on:** LEAD endpoints. **AC:** Playwright test — create ৳5,000 credit, receive ৳3,000, balance ৳2,000. *(mock data, API wiring pending)*
- [x] **[JUNIOR]** Ledger tab with running balance, reversed entries struck through with "Corrected by" link, entry detail drawer. **AC:** matches Stitch. *(mock data, API wiring pending)*
- [x] **[JUNIOR]** Reverse/Correct dialog with mandatory reason. **AC:** reason required (form blocks empty); success refreshes balance. *(mock data, API wiring pending)*

**Mobile**
- [ ] **[JUNIOR]** Give credit / Receive payment screens with large numeric keypad (3 taps from customer detail), optional photo attachment, "send SMS" toggle. **AC:** matches Stitch; widget tests; works offline later (see section 14).
- [ ] **[JUNIOR]** Ledger list on customer detail with running balance; share receipt PDF. **AC:** share sheet opens with PDF.

**Tests**
- [ ] **[LEAD]** ≥ 30 domain tests + property-based test for invariant BR-5.8; concurrent payments test; idempotency test.
- [ ] **[JUNIOR]** Integration tests for read endpoints & PATCH (list, detail, party ledger, receipt). **AC:** all green; include cross-tenant 404.

## 9. Due Dates, Overdue & Aging (S1.5)

**Backend API**
- [ ] **[LEAD]** AgingCalculator (BR-5.7) in tenant timezone; "collect today" priority query (PTP today → due today → overdue by remaining × DPD).
- [ ] **[JUNIOR]** GET /collections/overdue and GET /customers/{id}/aging using AgingCalculator. **Depends on:** AgingCalculator. **AC:** bucket boundaries tested (DPD 0,1,30,31,60,61,90,91).
- [ ] **[LEAD]** GET /collections/today.
- [ ] **[JUNIOR]** AgingSnapshotJob (Hangfire, daily 00:15) writing AgingSnapshots. **Depends on:** Hangfire setup (section 11). **AC:** running twice on same day doesn't duplicate rows.

**Web / Mobile**
- [x] **[JUNIOR]** "আজ আদায় করুন" (Collect today) page/screen: list with call, WhatsApp, SMS, add-promise buttons. **AC:** matches Stitch; tel: and wa.me links open correctly on mobile. *(mock data, API wiring pending)*
- [x] **[JUNIOR]** Overdue list with bucket tabs (০–৩০, ৩১–৬০, ৬১–৯০, ৯০+). **AC:** counts match backend totals. *(mock data, API wiring pending)*
- [x] **[JUNIOR]** Contact attempt logging (POST /contact-attempts) dialog: outcome (promised, paid, not reachable, disputed, refused). **AC:** logged attempt appears in customer timeline. *(mock data, API wiring pending)*

## 10. Promise-to-Pay (S1.5)

**Backend API**
- [ ] **[LEAD]** PromiseToPay aggregate (one open per customer, superseding, BR-7.1) and evaluation logic (BR-7.2) + PtpEvaluationJob + evaluation on payment.
- [ ] **[JUNIOR]** GET /promises (filters), PUT /promises/{id}, POST /promises/{id}/cancel. **Depends on:** aggregate. **AC:** only Open promises editable (422 otherwise).
- [ ] **[LEAD]** POST /promises (creation + superseding) and reminder pause hook (BR-7.3).

**Web / Mobile**
- [x] **[JUNIOR]** Add-promise dialog/screen (amount, date picker defaulting to tomorrow, note) and Promises list with status chips (Open/Kept/Partially kept/Broken). **AC:** matches Stitch; Bangla status labels. *(mock data, API wiring pending)*

**Tests**
- [ ] **[JUNIOR]** Unit tests for PTP status transitions using FakeTimeProvider (given LEAD's evaluation logic). **AC:** Kept, PartiallyKept, Broken, Superseded cases covered.

## 11. Messaging & Reminders (SMS, WhatsApp, Templates, Rules, Hangfire) (S1.8, S1.9)

**Backend API**
- [ ] **[LEAD]** Hangfire setup (SQL storage, queues, dashboard only for SuperAdmin), job base class with explicit tenant context.
- [ ] **[LEAD]** ISmsGateway + first BD gateway adapter (after vendor choice) + fake gateway; IWhatsAppClient (Cloud API template send) + webhook with X-Hub-Signature-256 validation.
- [ ] **[LEAD]** OutboundMessages state machine (BR-8.13), wallet reserve/capture/release (BR-8.11), MessageDispatchJob with retries, channel router & SMS fallback (BR-8.6).
- [ ] **[LEAD]** ReminderSchedulerJob (BR-8.2–8.5): send window, Friday 12–3 skip, holidays, caps, eligibility, PTP pause, idempotency key.
- [ ] **[JUNIOR]** Template render engine: placeholders (BR-8.7), Bangla numerals for bn, unknown placeholder → validation error. **AC:** unit tests for every placeholder in Appendix B.
- [ ] **[JUNIOR]** SMS segment calculator (GSM-7 160/153, Unicode 70/67, BR-8.9). **AC:** boundary tests at 70, 71, 134, 135 Bangla chars and 160/161 English.
- [ ] **[JUNIOR]** Message templates CRUD + preview (GET/POST/PUT/DELETE /message-templates, POST /message-templates/preview) and seed global templates from Appendix B. **AC:** preview returns text, segments and cost; seed idempotent.
- [ ] **[JUNIOR]** GET /messages (log with filters), GET /messages/{id}, POST /messages/{id}/retry. **Depends on:** OutboundMessages. **AC:** retry only allowed for Failed (422 otherwise).
- [ ] **[JUNIOR]** Reminder rules endpoints: GET /reminder-rules, PUT /reminder-rules/{id}, seed defaults R1–R6. **AC:** values validated (offset −30..+365, repeat ≥ 1).
- [ ] **[LEAD]** POST /messages (single), POST /messages/bulk/preview, POST /messages/bulk, batches & cancel; GET /reminder-rules/simulate.
- [ ] **[JUNIOR]** GET /wallet, GET /wallet/transactions, PUT /wallet/threshold, GET /channel-rates. **AC:** transactions paginated, newest first.
- [ ] **[LEAD]** Transaction notifications on ledger events (BR-8.14) and inbound STOP handling (BR-8.10).

**Web**
- [x] **[JUNIOR]** Templates page with editor, live preview, character/segment/cost counter (Stitch). **AC:** counter updates as user types Bangla text. *(mock data, API wiring pending)*
- [x] **[JUNIOR]** Reminder rules page (toggle, offsets, template picker, preview of "who would get it tomorrow" via simulate). **AC:** matches Stitch. *(mock data, API wiring pending)*
- [x] **[JUNIOR]** Message log page with status chips and retry button; bulk send wizard (filter → template → preview 3 samples → cost → confirm). **Depends on:** LEAD bulk endpoints. **AC:** confirm step shows count and total cost before sending. *(mock data, API wiring pending)*
- [x] **[JUNIOR]** Wallet page (balance, history, low-balance threshold). **AC:** low balance banner when below threshold. *(mock data, API wiring pending)*

**Mobile**
- [ ] **[JUNIOR]** "Send reminder" action on customer detail: choose SMS/WhatsApp, preview, send; "Share via my WhatsApp" (wa.me deep link) free option. **AC:** both paths work on a real device.

**Tests**
- [ ] **[LEAD]** Time-travel tests for scheduler (quiet hours, Friday, holiday, caps, opt-out, PTP pause, double run no duplicates); wallet concurrency test.
- [ ] **[JUNIOR]** Webhook status mapping tests (sent/delivered/read/failed, duplicate webhook no double charge) using recorded sample payloads. **AC:** tests use JSON fixtures in tests/Fixtures/WhatsApp.

## 12. Customer Statement Link (S1.7)

**Backend API**
- [ ] **[LEAD]** StatementLinks: token generation (32+ bytes, stored as SHA-256 hash), expiry & revoke (BR-9.1–9.2); public endpoints rate-limited.
- [ ] **[JUNIOR]** GET /public/statements/{token}, /pdf and POST /public/statements/{token}/opt-out (BR-9.3) with view logging (StatementLinkViews). **Depends on:** token service. **AC:** expired/revoked token → 404; only that customer's data returned; opt-out writes ConsentEvent.
- [ ] **[JUNIOR]** GET /customers/{id}/statement.pdf?from=&to= (opening balance, entries, closing balance, Bangla font). **AC:** totals match ledger for the range.

**Web**
- [x] **[JUNIOR]** Public page s/[token] (SSR, mobile-first, noindex, Bangla/English by customer language, business branding, PDF button, "Stop messages", "Call business"). **AC:** Lighthouse mobile performance ≥ 90; friendly 404 page in Bangla. ✅ (web PR #7, mock data)
- [x] **[JUNIOR]** "Share statement link" button on customer detail (copy + WhatsApp share) and "Viewed on …" in timeline. **AC:** link copies; view appears after opening the link. *(mock data, API wiring pending)*

## 13. Collector App, Approvals & Cash Hand-over (S1.13, S1.14)

**Backend API**
- [ ] **[LEAD]** Approval mode (BR-6.2): PendingCollections aggregate, approve → post payment, receipts only on approval (BR-6.3), duplicate warning (BR-6.5).
- [ ] **[JUNIOR]** GET /pending-collections, POST /pending-collections/{id}/reject (reason). **Depends on:** aggregate. **AC:** collector sees only own; manager sees all.
- [ ] **[LEAD]** POST /pending-collections, POST /pending-collections/{id}/approve.
- [ ] **[JUNIOR]** Cash hand-over endpoints: GET/POST /cash-handovers, POST /cash-handovers/{id}/confirm with variance (BR-6.4). **AC:** non-zero variance requires note (400 otherwise); variance = confirmed − sum of cash collections.

**Web**
- [x] **[JUNIOR]** Approval queue page (approve/reject with reason) and Cash hand-over confirmation page. **AC:** matches Stitch; approving updates customer balance. *(mock data, API wiring pending)*

**Mobile**
- [ ] **[JUNIOR]** Collector home: today's assigned customers, collect button, own collections list, "Hand over cash" screen. **Depends on:** offline sync for offline use. **AC:** collector cannot open unassigned customers.

## 14. Offline Sync (Mobile) (S1.12)

**Backend API**
- [ ] **[LEAD]** GET /sync/bootstrap, GET /sync/pull (SyncChangeLog cursor, role scoping, tombstones), POST /sync/push (batched, idempotent per op, server receipt numbers).

**Mobile**
- [ ] **[LEAD]** Drift schema mirroring needed tables, outbox (pending_ops), sync engine (connectivity trigger, workmanager periodic, pull-to-refresh), conflict policy (§9.13).
- [ ] **[JUNIOR]** Sync status indicator (synced / syncing / X pending) in app bar and "Sync issues" screen listing rejected ops with reason. **Depends on:** sync engine. **AC:** matches Stitch; tapping an issue shows details.
- [ ] **[JUNIOR]** Repositories for customers & ledger reading from drift (local-first) for list/detail screens. **Depends on:** drift schema. **AC:** list/detail work in airplane mode after first sync.

**Tests**
- [ ] **[LEAD]** Offline scenario tests: 20 offline entries → reconnect → posted exactly once; kill app mid-sync resumes; period-locked op shows in Sync issues.

## 15. Dashboard & Daily Summary (S1.6, S1.15)

**Backend API**
- [ ] **[JUNIOR]** GET /dashboard/summary, /dashboard/aging, /dashboard/trends?months=6. **Depends on:** ledger & aging. **AC:** summary totals equal sum of party balances (test).
- [ ] **[LEAD]** OwnerDigestJob (per-tenant digest time, WhatsApp/SMS/push, idempotent once per day).

**Web**
- [x] **[JUNIOR]** Dashboard page: cards (মোট পাওনা, মোট দেনা, overdue, আজ আদায়, এ মাসে আদায়, আজকের প্রতিশ্রুতি, wallet), aging chart (Recharts), top debtors list. **AC:** matches Stitch; loads < 1.5 s on demo data. *(mock data, API wiring pending)*

**Mobile**
- [ ] **[JUNIOR]** Home screen with the same cards (big Bangla numbers) and quick actions (বাকি দিন, জমা নিন, আজ আদায়). **AC:** matches Stitch.

## 16. Reports & Export (S1.6, S1.16)

**Backend API**
- [ ] **[JUNIOR]** Report endpoints: /reports/dues-by-customer, /reports/aging, /reports/collections, /reports/payables, /reports/promises, /reports/daily-summary, /reports/message-usage. **Depends on:** ledger, aging, messaging. **AC:** each has an integration test with known seeded totals.
- [ ] **[JUNIOR]** Excel export (ClosedXML) for each report: GET /reports/{report}/export?format=xlsx. **AC:** Bangla text intact in Excel; header row bold; amounts numeric.
- [ ] **[LEAD]** ExportJob (async for > 5,000 rows) + notification when ready; PDF export template.
- [ ] **[JUNIOR]** Import: GET /imports/templates/{type}, POST /imports (validate → error report), GET /imports/{id}, POST /imports/{id}/commit. **Depends on:** LEAD review of opening-balance posting. **AC:** 5,000-row file with 20 bad rows → report lists exact rows/errors.
- [ ] **[LEAD]** Full tenant export (POST /exports, GET /exports/{id}) zip of xlsx/csv with UTF-8 BOM.

**Web**
- [x] **[JUNIOR]** Reports pages with filters (date range, group, collector) and Export buttons; Import wizard (upload → errors → commit). **AC:** matches Stitch; error report downloadable. *(mock data, API wiring pending)*

**Mobile**
- [ ] **[JUNIOR]** Reports screen (dues by customer, collections by date) with share as PDF/Excel. **AC:** share sheet works.

## 17. Notifications (S1.15)

- [ ] **[LEAD]** FCM sender (Infrastructure) and notification events (pending collection, approval result, PTP due today, wallet low, subscription expiry).
- [ ] **[JUNIOR]** POST /me/device-tokens, GET /notifications, POST /notifications/{id}/read, /read-all. **AC:** unread count correct; tokens deduplicated per device.
- [ ] **[JUNIOR]** Web notification bell with dropdown; mobile notification center + firebase_messaging setup (foreground & tap handling). **AC:** tapping a notification opens the related screen.

## 18. Audit Log & Security (S1.3, S1.17)

- [ ] **[LEAD]** Audit interceptor (BR-11.1) with before/after JSON, impersonation id; SecurityEvents (BR-11.3).
- [ ] **[JUNIOR]** GET /audit-logs with filters (user, entity, action, date). **AC:** paginated; Owner/Manager only (403 tests).
- [x] **[JUNIOR]** Web audit log page (table + JSON diff viewer). **AC:** before/after shown side by side. *(mock data, API wiring pending)*
- [ ] **[LEAD]** Tenant-isolation test suite generated from OpenAPI, security headers (CSP, HSTS), rate limit review, OWASP ZAP baseline in CI.

## 19. Subscription, Billing & Platform Admin (S1.10)

**Backend API**
- [ ] **[LEAD]** SubscriptionLifecycleJob (Trial → Active → PastDue → Suspended, BR-1.5) and plan-limit enforcement (§7.14).
- [ ] **[LEAD]** Impersonation (POST /admin/tenants/{id}/impersonate with reason, short-lived token, audit).
- [ ] **[JUNIOR]** Admin endpoints: GET /admin/tenants, GET /admin/tenants/{id}, POST /admin/tenants, PUT /admin/tenants/{id}/status, PUT /admin/tenants/{id}/subscription, POST /admin/tenants/{id}/invoices, POST /admin/invoices/{id}/mark-paid, POST /admin/tenants/{id}/wallet/topup. **Depends on:** LEAD lifecycle & policies. **AC:** SA/SP only (403 tests); top-up writes WalletTransaction.
- [ ] **[JUNIOR]** Admin CRUD: /admin/plans, /admin/channel-rates, /admin/holidays (seed BD public holidays), /admin/global-templates. **AC:** validation + tests.
- [ ] **[LEAD]** /admin/gateways (encrypted secrets) and /admin/health (queue depth, failed jobs, integrity alerts).
- [ ] **[JUNIOR]** GET /subscription (plan, usage vs limits, invoices) and invoice PDF. **AC:** usage numbers match DB counts.

**Web**
- [x] **[JUNIOR]** Admin area pages: tenants list/detail, plans, channel rates, holidays, invoices & mark paid, wallet top-up. **AC:** matches Stitch (or simple shadcn tables if not designed); only visible to SA/SP. ✅ (web PR #7, mock data)
- [x] **[JUNIOR]** Tenant-side "Plan & billing" page and expiry banner (7/3/1 days). **AC:** banner text in Bangla; disappears after payment. *(mock data, API wiring pending)*

## 20. Localization (Bangla / English)

- [ ] **[LEAD]** Localization rules: Bangla default, Bangla numerals toggle, lakh/crore grouping, Asia/Dhaka dates; shared money/date utils in web (lib/money.ts, lib/date.ts) and mobile (core/money, core/date).
- [ ] **[JUNIOR]** Translate all UI strings to bn.json/en.json (web) and ARB files (mobile) — no hard-coded text. **AC:** script/grep finds no hard-coded user-visible strings in components.
- [ ] **[JUNIOR]** Unit tests for formatBDT (bn/en), date formatting, Bangla numerals conversion. **AC:** ≥ 15 cases in web (Vitest) and mobile (flutter_test).
- [ ] **[JUNIOR]** Golden tests for key mobile screens in Bangla (home, customer detail, receive payment). **AC:** goldens committed; CI runs them.

## 21. Testing & QA (cross-feature)

- [ ] **[LEAD]** Test strategy setup: Testcontainers base class, Respawn reset, FakeTimeProvider helpers, coverage thresholds in CI.
- [ ] **[JUNIOR]** Playwright E2E suite for journeys F1–F5 (signup, give credit, receive payment, correct entry, collect today) in Bangla. **Depends on:** features done. **AC:** runs in CI against docker-compose stack; < 10 min.
- [ ] **[JUNIOR]** k6 load script (50 RPS mixed reads/writes) with thresholds from §12. **AC:** script in deploy/k6; README explains how to run.
- [x] **[JUNIOR]** Manual UAT checklist (Bangla) for pilot clients per release. **AC:** docs/uat-checklist.md covers all MVP flows.

## 22. Deployment & Pilot Onboarding (S1.17, S1.18)

- [ ] **[LEAD]** Provision staging & production (VMs/containers, managed SQL Server, blob storage, Cloudflare), secrets in vault, TLS.
- [ ] **[LEAD]** CD pipeline: images → staging (migrations bundle, smoke tests) → production with manual approval & rollback.
- [ ] **[LEAD]** Backups (full/diff/log), monthly restore drill, monitoring & alerts (Sentry, uptime, gateway failures).
- [ ] **[JUNIOR]** Smoke-test script (health, login with test account, create customer, create entry). **AC:** runs after each deploy in pipeline; fails the job on error.
- [ ] **[JUNIOR]** Play Store internal testing release (signing config, store listing in Bangla, screenshots). **Depends on:** LEAD signing keys. **AC:** build installable from internal track.
- [ ] **[JUNIOR]** Onboarding kit: Excel import template with Bangla instructions, 5 short how-to guides (screenshots) for owners & collectors. **AC:** reviewed by Mahbub; stored in docs/onboarding.
- [ ] **[LEAD]** Pilot onboarding of first 5–10 clients (data migration, sender ID & WhatsApp templates, training), feedback loop.

## 23. Phase 2 (brief — plan after MVP)

- [ ] **[LEAD]** Payment links: IPaymentProvider + bKash Tokenized Checkout, Nagad, SSLCommerz; webhook → idempotent PaymentReceived (S2.1–S2.3).
- [ ] **[JUNIOR]** "Pay now" button on statement page and payment status pages (success/failed) once provider API exists. **AC:** sandbox payment flow works end to end.
- [ ] **[LEAD]** Online SaaS billing & credit top-up with auto-renew (S2.4).
- [ ] **[JUNIOR]** Simple invoice with product catalogue UI (web + mobile) → creates CreditSale (S2.5). **AC:** invoice total = due created.
- [ ] **[LEAD]** Recurring charges engine (S2.6) and multi-branch scoping (S2.7).
- [ ] **[JUNIOR]** Recurring schedule screens (create, preview, history). **AC:** preview lists customers and amounts before generation.
- [ ] **[LEAD]** Tenant's own WhatsApp number (Embedded Signup) & SMS masking (S2.8); two-way WhatsApp inbox (S2.9).
- [ ] **[JUNIOR]** Cheque management screens and iOS build/release (S2.10). **AC:** iOS TestFlight build installs.
