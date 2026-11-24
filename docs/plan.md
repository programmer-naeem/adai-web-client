# Aadai (আদায়) — Dues, Collections & Payments SaaS
## Product, Business & Technical Plan (MVP → Scale)

> **Working name:** *Aadai* (আদায় = "collection"). Rename freely; the name is used only so documents, code namespaces and agents have one consistent term.
>
> **Owner:** Mahbub Hasan · **Version:** 1.0 (draft) · **Date:** 23 Nov 2026 · **Market:** Bangladesh first (BDT, Asia/Dhaka, Bangla + English)
>
> **Stack:** ASP.NET Core Web API on **.NET 10 (LTS)** + MS SQL Server · Clean Architecture + CQRS · Next.js (App Router, TypeScript) web · Flutter mobile (offline-first)

---

## Table of Contents
1. Executive Summary & Vision
2. Target Customers & Personas
3. Problem Statement
4. Competitor Analysis, Gaps & Differentiators
5. Product Scope & Feature List (MVP / Phase 2 / Phase 3)
6. Core Concepts & Glossary
7. Business Logic & Rules
8. Key User Flows
9. System Architecture
10. Database Design
11. REST API Specification
12. Non-Functional Requirements
13. Subscription, Billing & Pricing Model
14. Segment-wise Implementation Plan (for AI agents) & Timeline
15. Testing Strategy
16. DevOps, CI/CD & Deployment
17. Risks & Mitigations
18. KPIs & Success Metrics
19. Appendix A — Agent Instructions, Coding Conventions & Definition of Done
20. Appendix B — Message Template Library (Bangla/English)
21. Appendix C — Research Sources

---

## 1. Executive Summary & Vision

### 1.1 One-line pitch
**Aadai helps a business owner know exactly who owes them money, remind them automatically by SMS/WhatsApp in Bangla, and collect it faster — with a human team that sets everything up for them.**

### 1.2 Summary
Bangladeshi small and medium businesses run on *baki* (credit sales). Wholesalers, distributors, pharmacies, hardware and building-material shops, and service businesses routinely have lakhs of taka sitting with customers. Existing apps (TallyKhata, Hishabee, Amar Hisab and others) are either **mass-market mobile khata apps** that try to do everything (wallet, QR, loans, top-up, POS, inventory) or **general accounting software** (income/expense, invoices, payroll, attendance). Neither is designed around the single job that hurts most: **getting dues collected on time without damaging the customer relationship.**

Aadai is a **collection-first** SaaS:
- A clean, trustworthy **ledger** for customers (receivables) and suppliers (payables).
- **Due dates, aging buckets and promise-to-pay** tracking so the owner knows *what to chase today*.
- **Automated, polite, branded reminders** over SMS and the official WhatsApp Business (Cloud) API, in Bangla or English, with opt-out and quiet hours.
- A **customer self-service statement link** (no app needed) showing the running balance — later with a bKash/Nagad "Pay now" button.
- **Field collector** support (assign customers/routes, collect cash on mobile, owner approves).
- **Web (Next.js) + mobile (Flutter, works offline)** on one backend.
- **High-touch service**: white-glove onboarding, migrating the paper khata/Excel, configuring sender ID & WhatsApp number, training staff, a named account manager.

### 1.3 Vision
- **Year 1 (MVP → paid pilot):** 20–50 hand-picked businesses, deep relationships, prove that Aadai measurably reduces Days-Sales-Outstanding (DSO) and overdue amount.
- **Year 2:** 300–1,000 businesses in 2–3 verticals (wholesale/distribution, pharmacy, building materials), referral-driven, self-serve signup added.
- **Year 3:** thousands of tenants; payment links (bKash/Nagad/SSLCommerz), recurring billing, open API; option of dedicated databases for premium clients.

### 1.4 Guiding principles ("simpler and better")
1. **Do one job brilliantly:** dues & collections. No wallet, no loans marketplace, no POS, no payroll in MVP.
2. **Trust is the product:** an immutable ledger with full audit trail — numbers never "change by themselves" (a top complaint about a competitor, see §4).
3. **Honest pricing:** no feature bait-and-switch after a trial; data export always free.
4. **Bangla-first, owner-friendly UX:** 3 taps to record a baki, 1 tap to remind.
5. **Service over scale:** premium clients get a human; the software is designed so one support person can serve many clients (admin impersonation with audit, health dashboards).
6. **Built for agents:** every module has crisp rules, contracts and acceptance criteria so AI coding agents can implement segment by segment.

---

## 2. Target Customers & Personas

### 2.1 Ideal Customer Profile (ICP) for the MVP
| Attribute | Value |
|---|---|
| Business type | B2B / B2C businesses with **recurring credit customers**: wholesalers & distributors (FMCG, rice/oil, pharma), dealers of building materials/hardware/electrical, pharmacies with institutional customers, auto parts, garments accessories suppliers, service providers (ISP, cable/dish line, coaching centres, rentals) |
| Size | 1–3 branches, 1–15 staff, 50–3,000 credit customers |
| Outstanding dues | ৳2 lakh – ৳2 crore at any time |
| Current tool | Paper khata, Excel, or a free khata app they've outgrown |
| Pain intensity | Weekly cash-flow crunch because of late payments; staff spend hours phoning customers |
| Willingness to pay | ৳500–৳5,000/month if collections improve visibly |
| Location | Dhaka, Chattogram, Narayanganj, Gazipur, Sylhet first (on-site onboarding possible) |

### 2.2 Personas
**P1 — Rahim (Owner, wholesale distributor, 42)**
- 600 retailer customers on credit, ৳35 lakh outstanding, 4 field salesmen.
- Goals: know total dues and who is overdue *right now*; stop customers disputing amounts; collect faster without being rude.
- Frustrations: salesmen collect cash and record it late; disputes ("I paid you last week"); no time to phone 100 customers.
- Uses: Android phone all day, laptop in the evening for reports.

**P2 — Nasrin (Accountant/Manager, 29)**
- Enters invoices and payments, reconciles cash with salesmen, prints statements.
- Goals: fast data entry on the web, bulk import, accurate statements, end-of-day cash summary.

**P3 — Sohel (Field Collector/Salesman, 25)**
- Visits 30 shops/day. Low-end Android, patchy internet.
- Goals: see today's route and each customer's balance offline, record a collection with a receipt SMS sent automatically, show the customer the statement.

**P4 — Karim (End customer, retailer, 35)** — *not a user, but a stakeholder*
- Receives SMS/WhatsApp, opens statement link, wants to verify entries, may pay via bKash later. Must feel respected, never spammed.

**P5 — Aadai Support Agent (internal)**
- Onboards clients, imports data, configures templates and sender IDs, monitors message delivery & failed jobs, impersonates (with audit) to help.

**P6 — Platform Super Admin (Mahbub)**
- Manages tenants, plans, message credit pricing, gateways, feature flags, revenue.

---

## 3. Problem Statement

1. **Invisible receivables:** owners don't know total dues by customer, by age, by salesman, so cash-flow planning is guesswork.
2. **Collection is manual and awkward:** phoning customers is time-consuming and socially uncomfortable; reminders are inconsistent.
3. **Disputes and mistrust:** paper records and editable apps lead to "I already paid" disputes; there is no shared source of truth the customer can see.
4. **Field cash leakage:** cash collected by salesmen is recorded late or not at all.
5. **Tools don't fit:** mass-market khata apps impose entry limits, ads and paywalls on basic features; accounting software is too broad and requires bookkeeping knowledge; neither offers real service.

**Outcome we promise:** *"Within 60 days, reduce your overdue amount by 20%+ and stop dues disputes — or we work with you until we do."*

---

## 4. Competitor Analysis, Gaps & Differentiators

> Research done on 23 Nov 2026 from the competitors' own websites, Google Play listings and third-party review/comparison sites (sources in Appendix C). Where a fact was not publicly available (e.g., a price), it is marked "not public".

### 4.1 Competitor snapshot
| | **TallyKhata** (Progoti Systems) | **Amar Hisab** (amarhisab.com) | **Hishabee** | **Khatabook** (India, reference) |
|---|---|---|---|---|
| Positioning | Mass-market digital khata + TallyPay wallet (Bangladesh Bank PSP licensed) | Bangla online accounting software for shops to larger firms | Mobile business manager for small shops & distributors | Free digital ledger for Indian merchants |
| Platforms | Android app (10M+ installs, ~46.7K reviews, rating shown 3.8–4.3 depending on listing/locale) | Web (browser, works on mobile & desktop) | Android app (1M+ installs, 4.5★, 14.6K reviews) + web/desktop | Android/iOS/web |
| Core dues features | Customer & supplier lists with balances, transaction messages, *tagada* (reminder) messages with payment link, works offline, auto backup | Customer & group statements, invoices with partial payment → automatic due, loans payable/receivable, SMS to customer/group, **scheduled due reminders** | Due list (baki khata) by customer/supplier, SMS & WhatsApp reminders, payment links | Customer ledger, scheduled WhatsApp/SMS reminders, UPI payment links/QR |
| Beyond dues | TallyPay QR (34 banks/MFS), wallet, recharge, business loans, stock (Gold) | Income/expense categories, invoices, bank/bKash accounts, budgets, products, staff salary & attendance, 20+ reports, users & roles, delete log | POS, inventory, expiry/batch tracking, barcode, purchases, expenses, online store, top-up, staff access | Multi-business, reports, QR payments |
| Pricing | Standard free; **Gold** paid (unlimited entries, 5 businesses, stock, group tagada, report download, 25 free messages/month); 30-day Gold trial; paid via bKash auto-renew; Gold price not public in sources found | 7-day free trial (20 clients, 20 invoices, 1 user); **Basic ৳189/mo, Professional ৳489/mo, Business ৳989/mo** (billed yearly, 25% off yearly), Enterprise custom; **SMS setup charge ৳1,000** on all plans | Free tier; 7-day trial of premium; premium price not public | Free; bulk reminders paid via coins (SMS 1 coin, IVR call 3 coins) |
| Support | Helpline 16726, WhatsApp | Live chat, phone, email Mon–Fri 9am–10pm (per site FAQ); Enterprise: dedicated account manager, WhatsApp & call support, dedicated server, API | 24h customer service claim; call centre | 24×7 multilingual claim; first response 24h, resolution 3 business days |
| Notable user complaints | "Basic features become paid after a few days… misleading" (Oct 2026); report download became paid (Dec 2025); Gold customer reports **balance shown negative / increased unexpectedly** and unresolved support for 12+ days (Aug 2026); PIN on every login, wants fingerprint; users unsure whether backup works after phone loss | Few public reviews of the web product found (Play listings named "Amar Hisab" belong to different developers — do not confuse) | Prices not public (comparison sites flag this); more a shop manager than a collection tool | Bulk reminders cost coins; coins expire |

### 4.2 What competitors do well (keep)
- **Bangla-first** language and very simple entry ("You gave / You got").
- **Customer + supplier** balances in one place.
- **Transaction/receipt messages** after every entry to avoid disputes.
- **Reminder (tagada) messages with a payment link** (TallyKhata, Khatabook).
- **Offline entry** on mobile (TallyKhata, Hishabee).
- **Users & roles + delete log** (Amar Hisab).
- **Transparent public pricing** (Amar Hisab).

### 4.3 Gaps we can exploit
| Gap | Evidence | Aadai answer |
|---|---|---|
| Trust in balances | Review of unexplained balance changes (TallyKhata) | Append-only ledger, reversal entries, per-entry audit, "balance explained" view, nightly balance integrity check |
| Paywall surprises | Reviews about basic features becoming paid, report download paywalled | All core features in every plan; limits only on volume/users/messages; **export always free** |
| Reminders are manual "tagada" blasts | Group tagada is a premium bulk-send | **Rule-based automated reminder schedules** (before due, on due, after due, escalation), quiet hours, opt-out, per-customer channel preference |
| No due-date/aging discipline | Most khata apps show only a running balance | Due dates per credit entry, credit terms per customer, aging buckets (0–30/31–60/61–90/90+), promise-to-pay tracking |
| No field collection workflow | Not a focus of any competitor reviewed | Collector role, assigned customers/routes, offline collection with receipt, owner approval & cash hand-over reconciliation |
| Customer can't verify | Statements are PDF shares | **Live tokenized statement link** (mobile web, Bangla) — later with Pay-now |
| WhatsApp via phone share | "Share via WhatsApp/Imo" opens the phone app | **Official WhatsApp Cloud API** with approved templates, business name & delivery/read receipts (plus free "share via my WhatsApp" fallback) |
| Generic support | Support complaints even for paying users | Named account manager, onboarding & data migration included, SLA by plan |
| Everything-app complexity | Wallet, loans, POS, payroll, top-up | Focused scope; integrate (not rebuild) POS/accounting later via import/API |

### 4.4 Positioning statement
*For growing Bangladeshi businesses that sell on credit, Aadai is the collections assistant that tells you who to chase today, reminds customers automatically in polite Bangla over SMS and WhatsApp, and gives every customer a live statement they trust — set up for you by our team. Unlike mass-market khata apps, Aadai has no paywall surprises, no ads and a ledger that can never change silently.*

### 4.5 Differentiator summary (top 8)
1. **Collection engine:** due dates, aging, promise-to-pay, automated reminder rules.
2. **Official WhatsApp + branded SMS** with delivery tracking and per-tenant message wallet.
3. **Live customer statement link** (and later pay link).
4. **Field collector app** with offline mode and cash hand-over reconciliation.
5. **Immutable, auditable ledger** with integrity checks.
6. **Owner daily digest** on WhatsApp ("Today: ৳1,25,000 collected, 14 promises due, 23 overdue >60 days").
7. **White-glove onboarding & migration**, named account manager.
8. **Web + mobile + offline** on one clean, API-first backend (ready for integrations).

---

## 5. Product Scope & Feature List

Priority legend: **P0** = must for MVP launch, **P1** = should (MVP if time allows / early Phase 2), **P2** = later.

### 5.1 MVP (Phase 1) — "Know, Remind, Collect"
| # | Module | Feature | Priority |
|---|---|---|---|
| M1 | Onboarding & Auth | Sign-up by mobile number + OTP (SMS); password login; JWT + refresh tokens; forgot password via OTP; device sessions list & revoke | P0 |
| M1 | | Business profile: name (bn/en), logo, address, phone, business type, default credit days, invoice/receipt prefix | P0 |
| M1 | | Staff invitation by phone, roles: Owner, Manager, Staff, Collector, Viewer | P0 |
| M1 | | Fingerprint/Face unlock + app PIN on mobile (lock screen, not re-login) | P1 |
| M2 | Customers | CRUD, phone (validated BD format), alt phone, address/area, group/tags, credit limit, credit days, preferred language (bn/en), preferred channel (SMS/WhatsApp/none), assigned collector, notes, opening balance | P0 |
| M2 | | Search (name/phone/code, Bangla & English), filters (group, area, collector, overdue, balance range), sort by balance/age | P0 |
| M2 | | Bulk import from Excel/CSV with validation report; import from phone contacts (mobile) | P0 |
| M2 | | Customer detail: balance, overdue, aging, ledger, promises, reminders history | P0 |
| M3 | Suppliers | Same as customers for payables (no reminders to suppliers in MVP; payment-due alerts to owner) | P0 |
| M4 | Ledger | Record **Credit Sale / Due (Baki)** with amount, date, due date (auto from credit days), reference/memo no., note, attachment photo | P0 |
| M4 | | Record **Payment Received** (cash, bKash, Nagad, Rocket, bank, cheque, other) with reference; partial payments; auto-allocation FIFO to oldest dues | P0 |
| M4 | | Supplier side: **Purchase on credit** and **Payment Made** | P0 |
| M4 | | Adjustments: discount/write-off, opening balance, refund/return (credit note) | P0 |
| M4 | | Correction via **reversal** (void) with mandatory reason; no hard edits/deletes | P0 |
| M4 | | Running balance per party; receipt number auto-sequence per business | P0 |
| M4 | | Transaction SMS/WhatsApp to customer after each entry (toggle per tenant and per entry) | P0 |
| M5 | Collections | Overdue list, aging buckets, "Collect today" list (due today + promises today + overdue by priority) | P0 |
| M5 | | Promise-to-pay (PTP): amount + date + note; auto status Kept/Broken/Partially kept | P0 |
| M5 | | Collector assignment; collector sees only assigned customers; collections recorded by collectors require approval (configurable) | P1 |
| M5 | | Cash hand-over: collector submits day's cash, manager confirms; variance flagged | P1 |
| M6 | Messaging | SMS via BD gateway (masking/non-masking), Unicode Bangla, segment counting & cost preview | P0 |
| M6 | | WhatsApp Cloud API: tenant uses platform number (MVP) with approved utility templates; delivery/read status webhooks | P0 |
| M6 | | "Share via my WhatsApp" deep link (free, manual) fallback on mobile | P0 |
| M6 | | Template library (bn/en) with placeholders; tenant can customize within approved structure | P0 |
| M6 | | Manual send to one customer; bulk send to filtered list with preview and cost confirmation | P0 |
| M6 | | **Automated reminder rules** (before due, on due, after due every N days, max attempts), quiet hours, Friday/holiday skip, opt-out & consent tracking | P0 |
| M6 | | Message wallet (credits), top-up by Super Admin (MVP) / online (Phase 2), low-balance alert | P0 |
| M6 | | Message log with status (queued/sent/delivered/read/failed) and cost | P0 |
| M7 | Statement | Public tokenized customer statement link (mobile web, bn/en): business name, balance, last N entries, PDF download; token revocable/expiring | P0 |
| M7 | | PDF statement for a date range (web & mobile), share/print | P0 |
| M8 | Dashboard & Reports | Dashboard: total receivable, total payable, overdue, collected today/this month, PTP due today, aging chart, top debtors | P0 |
| M8 | | Reports: Dues by customer, Aging, Collections by date/method/collector, Customer statement, Supplier payables, Message usage; export Excel/PDF (always free) | P0 |
| M8 | | Owner daily digest via WhatsApp/SMS/push at configured time | P1 |
| M9 | Mobile | Flutter app: all of the above for Owner/Staff/Collector, **offline-first** with sync, Bangla UI | P0 (offline P1 if timeline tight; design for it from day 1) |
| M10 | Settings & Audit | Audit log (who/what/when/before/after), login history, roles & permission matrix, notification preferences | P0 |
| M10 | | Data export (full tenant export to Excel/CSV) | P0 |
| M11 | Platform Admin | Tenant list, plan assignment, trial/expiry, suspend, message credit top-up & pricing, gateway config, template approval status, impersonation with audit, system health, failed jobs | P0 |
| M11 | | Subscription invoices (manual payment recording in MVP) | P0 |

### 5.2 Phase 2 — "Get paid & grow"
| Feature | Priority |
|---|---|
| Online payment links on statement & reminders: **bKash Tokenized Checkout, Nagad, SSLCommerz**; webhook → auto Payment Received entry | P0 |
| Online subscription & message-credit purchase by tenants | P0 |
| Simple **invoice** with line items (products/services catalogue, discount, VAT optional) → creates the due | P0 |
| **Recurring charges** (monthly fees for ISP/cable/tuition/rent): schedules auto-create dues on a day of month; bulk generation preview | P0 |
| Multi-branch: branch-level ledgers, branch managers, consolidated reports | P1 |
| Tenant's own WhatsApp Business number (Embedded Signup) & own SMS masking sender ID | P1 |
| Collector routes/beats, visit check-in with GPS, route sheet | P1 |
| Cheque management (received cheques, due date, bounced → auto reversal + fee) | P1 |
| Customer risk score & credit-limit blocking warnings | P1 |
| Email channel, voice/IVR reminder (via gateway) | P2 |
| Two-way WhatsApp inbox (customer replies routed to tenant) | P1 |
| Expense & cash book (simple), daily cash closing | P2 |
| iOS app release | P1 |

### 5.3 Phase 3 — "Scale & integrate"
| Feature | Priority |
|---|---|
| Public REST API + API keys + webhooks for tenants (integrate POS/ERP) | P0 |
| Dedicated database per premium tenant (tenant catalog routing) | P0 |
| Accounting/POS integrations (import sales from POS, Tally/Excel sync) | P1 |
| AI assistant: suggest who to call, best time/channel, auto-draft polite messages, anomaly detection | P1 |
| Customer portal (customer logs in to see all businesses they owe — network effect) | P2 |
| Reseller/partner program, white-label | P2 |
| Advanced analytics: DSO trend, collector performance, cohort of repayment behaviour | P1 |
| Multi-country readiness (currency/timezone per tenant) | P2 |

### 5.4 Explicitly out of scope (to stay simple)
Wallet/e-money, lending, mobile top-up, full POS, inventory/stock, payroll/attendance, full double-entry general ledger, tax filing. Integrate later rather than build.

---

## 6. Core Concepts & Glossary

| Term (EN) | বাংলা | Definition |
|---|---|---|
| **Platform** | প্ল্যাটফর্ম | The Aadai SaaS as a whole, operated by Mahbub's company. |
| **Tenant / Business** | ব্যবসা | A subscribing business. All data is isolated by `TenantId`. One owner may own several tenants (switch business). |
| **Branch** | শাখা | Optional sub-unit of a tenant (Phase 2). MVP: every tenant has one default branch; all records carry `BranchId` from day 1 to avoid migration later. |
| **User** | ইউজার | A person with login credentials (phone-based identity). A user can be a member of multiple tenants with different roles. |
| **Membership** | সদস্যপদ | Link of User ↔ Tenant with a Role and optional branch/collector scope. |
| **Role** | ভূমিকা | Named set of permissions: Owner, Manager, Staff, Collector, Viewer (tenant roles); SuperAdmin, Support (platform roles). |
| **Permission** | অনুমতি | Atomic capability, e.g. `ledger.create`, `ledger.reverse`, `customers.export`. |
| **Party** | পক্ষ | Common abstraction for Customer or Supplier. |
| **Customer** | কাস্টমার / দেনাদার | A party who buys on credit and owes the business (receivable / পাওনা). |
| **Supplier** | সাপ্লায়ার / পাওনাদার | A party the business buys from on credit and owes money to (payable / দেনা). |
| **Ledger** | খাতা / লেজার | Ordered, append-only list of ledger entries for a party. |
| **Ledger Entry** | লেনদেন | One immutable financial event for a party: type, amount, date, direction (Debit/Credit). |
| **Debit (Dr)** | ডেবিট | Increases what a customer owes us; for suppliers, decreases what we owe (payment made). |
| **Credit (Cr)** | ক্রেডিট | Decreases what a customer owes us (payment received); for suppliers, increases what we owe (purchase on credit). |
| **Due / Baki** | বাকি | An open amount from a credit sale (customer) that has not yet been paid. Each credit-sale entry creates a **Due Item** with a due date. |
| **Due Date** | পরিশোধের তারিখ | Date by which a due item should be paid. Default = entry date + customer's credit days (or tenant default). |
| **Overdue** | মেয়াদোত্তীর্ণ বাকি | A due item with remaining amount > 0 and due date < today (Asia/Dhaka). |
| **Days Past Due (DPD)** | | `today − dueDate` in days for an overdue item. |
| **Aging Bucket** | বয়সভিত্তিক বাকি | Grouping of open dues: Current (not yet due), 1–30, 31–60, 61–90, 90+ DPD. |
| **Payment** | পেমেন্ট / জমা | Money received from a customer (or paid to a supplier). May be partial. |
| **Allocation** | সমন্বয় | Link that says which due items a payment settled, and how much. Default FIFO (oldest due first). |
| **Collection** | আদায় | A payment received, especially by a collector in the field; may need approval before it is posted. |
| **Pending Collection** | অনুমোদনের অপেক্ষায় | A collector-recorded collection waiting for manager approval (if approval mode is on). Not yet in the ledger. |
| **Cash Hand-over** | ক্যাশ জমা | Collector hands collected cash to the business; manager confirms the amount; variance recorded. |
| **Reversal** | বাতিল এন্ট্রি | A new ledger entry that exactly cancels a previous entry (opposite direction, same amount) with a reason. Original is marked `IsReversed`. |
| **Adjustment** | সমন্বয় এন্ট্রি | Discount, write-off (bad debt), return/credit note, opening balance. |
| **Opening Balance** | প্রারম্ভিক ব্যালেন্স | Balance carried in when a party is created (migration from paper/Excel). Creates a due item (customers) with a configurable due date. |
| **Balance** | ব্যালেন্স | Σ Debits − Σ Credits (customers: positive = customer owes us). For suppliers stored the same way: negative = we owe them; UI shows "You owe ৳X". |
| **Advance** | অগ্রিম | Negative customer balance (customer paid more than owed). Shown as "Advance ৳X"; auto-allocated to future dues. |
| **Credit Limit** | বাকির সীমা | Max balance allowed; exceeding shows a warning (MVP) or block (Phase 2, configurable). |
| **Promise-to-Pay (PTP)** | পরিশোধের প্রতিশ্রুতি | Customer's commitment to pay an amount by a date. Status: Open, Kept, PartiallyKept, Broken, Cancelled. |
| **Reminder** | তাগাদা | A message to a customer about dues: manual or automated by a Reminder Rule. |
| **Reminder Rule** | তাগাদার নিয়ম | Tenant-configured schedule (offset days relative to due date, channel, template, max attempts). |
| **Message Template** | মেসেজ টেমপ্লেট | Text with placeholders (`{{customer_name}}`, `{{balance}}`, ...) per language and channel. WhatsApp templates must be pre-approved by Meta. |
| **Channel** | মাধ্যম | SMS, WhatsApp (Cloud API), WhatsApp-share (manual), Push (to users), Email (Phase 2). |
| **Message Wallet / Credits** | মেসেজ ব্যালেন্স | Prepaid tenant balance (in BDT) consumed per SMS segment / WhatsApp message. |
| **Consent / Opt-out** | সম্মতি / বন্ধ | Whether a customer agreed to receive messages on a channel; opt-out stops automated & bulk messages. |
| **Quiet Hours** | নীরব সময় | Time outside the send window when automated messages are not sent (default send window 10:00–20:00 Asia/Dhaka). |
| **Statement Link** | স্টেটমেন্ট লিংক | Public URL with an unguessable token showing a customer's balance and recent entries. |
| **Receipt** | রসিদ | Numbered confirmation of a payment, shareable as SMS/WhatsApp/PDF. |
| **Audit Log** | অডিট লগ | Immutable record of who did what, when, from which device/IP, with before/after values. |
| **Plan / Subscription** | প্ল্যান | Tenant's commercial plan defining limits (users, customers, branches) and included message credits. |
| **Sync** | সিঙ্ক | Mobile offline changes pushed to and pulled from the server. |
| **Idempotency Key** | | Client-generated key ensuring a retried request doesn't create duplicates (critical for payments and offline sync). |

---

## 7. Business Logic & Rules

> Rules are numbered (BR-x.y) so agents and tests can reference them. "MUST" = enforced by the backend (Domain/Application layer), never only by the UI.

### 7.1 Tenancy & identity
- **BR-1.1** Every business-owned row MUST have `TenantId`; all queries MUST be filtered by the current tenant (EF Core global query filter). Cross-tenant access returns 404 (never 403, to avoid leaking existence).
- **BR-1.2** A user's identity is their **mobile number** in E.164 (`+8801XXXXXXXXX`). BD mobile validation: `^\+8801[3-9]\d{8}$`. Input like `017...`, `8801...` is normalized.
- **BR-1.3** A tenant MUST always have at least one active Owner. The last Owner cannot be removed or demoted.
- **BR-1.4** Every tenant has a default Branch created at signup; `BranchId` is required on ledger entries.
- **BR-1.5** Subscription status gates write access: `Trial`, `Active`, `PastDue` (7-day grace, full access + banner), `Suspended` (read-only + export), `Cancelled` (data retained 90 days then purged after notice).

### 7.2 Money, rounding, time
- **BR-2.1** Currency is BDT for all tenants (column `CurrencyCode` = 'BDT' kept for future). Amounts stored as `decimal(18,2)`; never float/double. In C# use `decimal`; in TypeScript, use integer paisa or a decimal library (e.g., `decimal.js`/`big.js`) — never JS `number` arithmetic on money.
- **BR-2.2** Amount on any entry MUST be > 0 and ≤ 999,999,999.99. Direction is expressed by entry type, never by negative amounts.
- **BR-2.3** Rounding: banker's rounding is NOT used; use `MidpointRounding.AwayFromZero` to 2 decimals. Percent discounts compute then round once per entry.
- **BR-2.4** Display: Bangla numerals optional by user preference (`৳ ১,২৩,৪৫৬.০০`); Indian/BD digit grouping (lakh/crore: `1,23,456.00`).
- **BR-2.5** All timestamps stored in UTC (`datetime2`, suffix `Utc`). Business dates (`EntryDate`, `DueDate`, `PromiseDate`) stored as `date` and interpreted in the **tenant's timezone (default Asia/Dhaka, UTC+6, no DST)**. "Today" = current date in tenant timezone.
- **BR-2.6** Back-dated entries are allowed up to `Tenant.BackdateLimitDays` (default 90) for Owner/Manager; Staff/Collector only today (configurable). Future-dated entries are not allowed except due/promise dates.
- **BR-2.7** Period lock: Owner can lock entries before a date (`Tenant.LockedUntilDate`); no new entries or reversals dated on/before it.

### 7.3 Ledger entry types and balance
| Entry Type | Party | Direction | Effect on balance (Dr − Cr) | Creates/affects |
|---|---|---|---|---|
| `OpeningBalance` | Customer | Dr | + | Due item |
| `OpeningBalance` | Supplier | Cr | − | Payable item |
| `CreditSale` (বাকি বিক্রি) | Customer | Dr | + | Due item (due date) |
| `PaymentReceived` (জমা) | Customer | Cr | − | Allocations to due items |
| `Discount` / `WriteOff` | Customer | Cr | − | Allocations (like payment, but non-cash) |
| `SalesReturn` (credit note) | Customer | Cr | − | Allocations |
| `Refund` (we pay customer back an advance) | Customer | Dr | + | — |
| `CreditPurchase` (বাকিতে কেনা) | Supplier | Cr | − | Payable item |
| `PaymentMade` (পরিশোধ) | Supplier | Dr | + | Allocations to payable items |
| `PurchaseReturn` | Supplier | Dr | + | Allocations |
| `Reversal` | Any | Opposite of original | Cancels original | Undo allocations of original |
| `ChargeFee` (late fee / cheque bounce fee, Phase 2) | Customer | Dr | + | Due item |

- **BR-3.1** **Balance(party) = Σ Dr − Σ Cr** over all non-deleted entries (reversals included; reversed + reversal net to zero).
- **BR-3.2** `Party.CurrentBalance` is a **denormalized cache** updated in the same DB transaction as the entry insert, protected by optimistic concurrency (`rowversion`). A nightly job recomputes balances from entries and raises an alert on any mismatch (integrity check) — never silently "fixes" without logging.
- **BR-3.3** Each entry stores `BalanceAfter` (running balance snapshot) for fast statements. Back-dated inserts recalculate `BalanceAfter` for later entries of that party in the same transaction (ordered by `EntryDate`, then `SequenceNo`).
- **BR-3.4** Entry numbering: per-tenant gapless sequence per document type (`RCPT-000123`, `DUE-000456`) generated via a `DocumentSequence` table with row lock (`UPDLOCK, HOLDLOCK`) inside the transaction.
- **BR-3.5** Customer UI wording: positive balance → "পাবো ৳X (You'll get)"; negative → "অগ্রিম ৳X (Advance)". Supplier UI: negative → "দেবো ৳X (You'll give)".

### 7.4 Immutability, corrections & soft delete
- **BR-4.1** Ledger entries are **append-only**. No UPDATE of financial fields (amount, type, party, date) and no DELETE, ever — enforced in Domain (no setters) and by a DB trigger/permissions safeguard (optional) on `LedgerEntries`.
- **BR-4.2** Correction = **Reverse** (creates `Reversal` entry referencing original, same amount, opposite direction, reason required, original flagged `IsReversed=true`) + optionally create a corrected new entry. The UI offers "Edit" which performs exactly this pair atomically and links them (`CorrectionOfEntryId`).
- **BR-4.3** Non-financial fields (note, attachment, reference no.) may be edited; every edit is written to the audit log with before/after.
- **BR-4.4** A reversal cannot itself be reversed (re-enter instead). An entry can be reversed once.
- **BR-4.5** Reversal permission: Owner/Manager always; Staff only own entries within `Tenant.StaffReverseWindowMinutes` (default 30); Collector never (can request).
- **BR-4.6** Master data (customers, suppliers, users, templates) uses **soft delete** (`IsDeleted`, `DeletedAtUtc`, `DeletedBy`). A party with non-zero balance cannot be deleted (archive instead). Soft-deleted records excluded by global filter; restorable by Owner for 30 days.
- **BR-4.7** Customer merge (duplicates): moves entries to target by creating transfer entries pair (`TransferOut`/`TransferIn`) — Phase 2.

### 7.5 Due items, payments & allocation
- **BR-5.1** Every customer `CreditSale`, `OpeningBalance` (if > 0) and `ChargeFee` creates a **DueItem** {OriginalAmount, PaidAmount, Remaining, DueDate, Status: Open/PartiallyPaid/Paid/Cancelled}.
- **BR-5.2** `DueDate` default = `EntryDate + Customer.CreditDays` (fallback `Tenant.DefaultCreditDays`, default 0 = due immediately; typical 7/15/30). User may override per entry.
- **BR-5.3** Every credit-type entry (PaymentReceived, Discount, WriteOff, SalesReturn) is **allocated** to open due items: default **FIFO by DueDate, then EntryDate**; optional manual allocation to specific due items (e.g., a specific memo). Allocation rows: {CreditEntryId, DueItemId, Amount}.
- **BR-5.4** Partial payments are normal: allocation reduces `Remaining`; status becomes PartiallyPaid.
- **BR-5.5** Over-payment: excess remains as **unallocated credit (advance)** and is automatically allocated to the next new due item for that customer (FIFO) when it is created.
- **BR-5.6** Reversal of a payment removes its allocations (due items reopen); reversal of a credit sale cancels its due item — if that due item had allocations, those payment amounts become unallocated and are re-allocated FIFO to other open dues (or stay as advance).
- **BR-5.7** Aging is computed from open DueItems: bucket by `DPD = today − DueDate` → Current (≤0), 1–30, 31–60, 61–90, 90+. Customer-level aging = sum of remaining per bucket. Aging snapshot stored daily for trend reports (`AgingSnapshots`).
- **BR-5.8** Invariant: Σ Remaining(open due items) − Σ unallocated credit = CurrentBalance (for customers). Checked by integrity job and by unit tests.
- **BR-5.9** Payment methods: Cash, bKash, Nagad, Rocket, Bank, Cheque, Card, Other; `ReferenceNo` required for MFS/Bank/Cheque (configurable).
- **BR-5.10** Credit limit: on CreditSale, if `newBalance > CreditLimit` (and CreditLimit > 0) return a warning flag in response (`creditLimitExceeded=true`); block only if `Tenant.EnforceCreditLimit` (Phase 2).
- **BR-5.11** Supplier side mirrors this with **PayableItems** (for "payments due to suppliers" alerts) — MVP keeps allocations for suppliers too, to report what we owe by due date.

### 7.6 Collections, collectors & approvals
- **BR-6.1** Collector sees only customers where `AssignedCollectorId = me` (and can search others only if `Tenant.CollectorCanSeeAll`).
- **BR-6.2** If `Tenant.RequireCollectionApproval = true`, a collector's payment creates a **PendingCollection** (not a ledger entry). Manager/Owner approves → posts `PaymentReceived` (with `CollectedByUserId`) and sends receipt; rejects → reason sent to collector. Default for MVP: **off** (direct posting) with collector entries flagged for review.
- **BR-6.3** Receipt message to customer is sent at posting time (approval) — never for a pending collection, to avoid confirming money not yet accepted. Optional instant "collection acknowledgement" template (Phase 2).
- **BR-6.4** Cash Hand-over: collector submits {date, amount declared, list of collections}; manager confirms received amount; `Variance = confirmed − Σ cash collections`; non-zero variance requires note and appears in the collector report.
- **BR-6.5** Duplicate protection: same customer + same amount + same method within 2 minutes by same user → warning "possible duplicate" (client and server); idempotency key prevents true duplicates.

### 7.7 Promise-to-Pay
- **BR-7.1** PTP = {CustomerId, Amount, PromiseDate (≥ today), Note, CreatedBy, Channel (call/visit/WhatsApp)}. A customer may have only one **Open** PTP at a time (new one supersedes → old becomes Cancelled with reason "Superseded").
- **BR-7.2** Evaluation (daily job at 23:30 tenant time and on each payment): payments received from PTP creation through PromiseDate are summed: ≥ Amount → **Kept**; > 0 but < Amount after PromiseDate → **PartiallyKept**; 0 after PromiseDate → **Broken**.
- **BR-7.3** While a PTP is Open, automated "overdue" reminders for that customer are **paused** until PromiseDate; on PromiseDate morning a "promise reminder" template is sent (if rule enabled); on Broken, the escalation reminder sequence resumes.
- **BR-7.4** PTP history feeds the customer reliability indicator (Phase 2 risk score): kept rate, avg days late.

### 7.8 Reminders & messaging
- **BR-8.1 Reminder rules** (per tenant, editable, defaults seeded):
  | Rule | Trigger | Default |
  |---|---|---|
  | R1 Pre-due | DueDate − 2 days, customer has open due item due that day | Off |
  | R2 On due | DueDate = today | On |
  | R3 Overdue | DPD = 3, then every 7 days | On, max 4 attempts per due item cycle |
  | R4 Escalation | DPD ≥ 60, monthly, firmer template | Off |
  | R5 PTP reminder | PromiseDate = today | On |
  | R6 Monthly statement | Day 1 of month to customers with balance > 0 | Off |
- **BR-8.2** Reminders are **per customer, not per due item**: one message per customer per day maximum (`Tenant.MaxRemindersPerCustomerPerDay`, default 1) aggregating total overdue. Global cap per customer per 7 days (default 3).
- **BR-8.3** Eligibility: customer active, not soft-deleted, balance > `Tenant.MinReminderBalance` (default ৳100), channel consented & not opted out, valid phone, no Open PTP (except R5), not in "Do not remind" list, tenant subscription Active/Trial/PastDue, wallet has sufficient credit.
- **BR-8.4** **Quiet hours:** automated messages only between `Tenant.SendWindowStart` and `SendWindowEnd` (default 10:00–20:00 Asia/Dhaka). Skip Friday 12:00–15:00 (Jumu'ah) by default and configured holidays (tenant holiday calendar; seeded with BD public holidays e.g., Eid days). Messages scheduled in a blocked window move to the next allowed slot.
- **BR-8.5** Scheduler runs every 15 min: computes due reminders for tenants whose local time is within window, enqueues `OutboundMessage` rows idempotently with key `{tenantId}:{customerId}:{ruleId}:{localDate}`.
- **BR-8.6** **Channel selection:** customer preferred channel; if WhatsApp chosen but customer has no WhatsApp/opt-in or WhatsApp send fails with "not a WhatsApp user" → fall back to SMS if `Tenant.FallbackToSms` (default on) and SMS consent exists.
- **BR-8.7** **Templates:** stored per {TenantId|null(global), Key, Channel, Language}. Placeholders: `{{customer_name}}`, `{{business_name}}`, `{{balance}}`, `{{overdue_amount}}`, `{{due_date}}`, `{{last_payment_amount}}`, `{{last_payment_date}}`, `{{statement_link}}`, `{{promise_amount}}`, `{{promise_date}}`, `{{receipt_no}}`, `{{amount}}`, `{{business_phone}}`. Unknown placeholders fail validation. Amounts render with Bangla numerals for bn templates.
- **BR-8.8** **WhatsApp:** business-initiated messages MUST use Meta-approved templates (category **Utility** for transactional reminders/receipts — not Marketing) with variables; free-form text only within a 24-hour customer-service window after a customer message. Template approval status is synced; only `APPROVED` templates are selectable.
- **BR-8.9** **SMS:** Bangla requires Unicode (UCS-2): 70 chars per single segment, 67 per segment when concatenated; GSM-7 English: 160 / 153. Cost = segments × rate. UI shows live character/segment counter and cost before send. Sender: masking (approved brand name) or non-masking number per BTRC rules via gateway.
- **BR-8.10** **Opt-out:** customer can opt out by replying STOP/বন্ধ (where the gateway supports inbound) or via the statement page "Stop messages" button, or by tenant marking it. Opt-out blocks automated and bulk messages for that channel; transactional receipts still allowed only if `Tenant.ReceiptsIgnoreOptOut` = false by default (i.e., opt-out blocks all). Every consent change is logged (`ConsentEvents`).
- **BR-8.11** **Cost & wallet:** before enqueueing, reserve estimated cost; on final status, capture actual cost (failed = refund reserved credit). Wallet cannot go negative; if insufficient, the message is `Blocked_InsufficientCredit` and Owner is notified once per day. Low-balance alert at configurable threshold (default ৳200).
- **BR-8.12** **Rate limiting:** per-gateway throughput limits respected via queue workers; per-tenant bulk send max 5,000 recipients per batch (MVP).
- **BR-8.13** Statuses: `Queued → Sending → Sent → Delivered → Read(WhatsApp)` or `Failed(reason)`, `Blocked(reason)`, `Cancelled`. Retries: transient failures retried 3× with exponential backoff (1, 5, 30 min); permanent failures not retried.
- **BR-8.14** Transaction messages (after an entry) are sent immediately (still respecting opt-out, not quiet hours — owner initiated), configurable per tenant and overridable per entry ("Send SMS" checkbox).
- **BR-8.15** Bulk send requires permission `messages.bulk`, preview of first 3 rendered messages, recipient count, total cost estimate and explicit confirmation.

### 7.9 Statement link
- **BR-9.1** Token = 32+ bytes cryptographically random, URL-safe; stored hashed (SHA-256); link format `https://pay.aadai.app/s/{token}`.
- **BR-9.2** Default expiry 30 days, refreshed when a new reminder includes it; tenant/owner can revoke all links for a customer.
- **BR-9.3** Page shows: business name/logo/phone, customer name (masked phone), current balance, overdue, last 20 entries (date, type, amount, running balance), PDF download, "Stop messages" link, (Phase 2) Pay button. No other customers' data, no PII beyond that customer.
- **BR-9.4** Rate-limited, `noindex`, no caching by CDN of personalized content, views logged (`StatementLinkViews`) — owner sees "Customer viewed statement on 12 Nov 14:05".

### 7.10 Permissions matrix (tenant roles)
| Permission | Owner | Manager | Staff | Collector | Viewer |
|---|---|---|---|---|---|
| View dashboard & reports | ✅ | ✅ | ✅ (no profit/payables if restricted) | Own collections only | ✅ |
| Manage business settings, plan, wallet | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invite/manage users & roles | ✅ | ✅ (not Owner role) | ❌ | ❌ | ❌ |
| Create/edit customers & suppliers | ✅ | ✅ | ✅ | Assigned customers: edit phone/address only | ❌ |
| Delete/archive parties | ✅ | ✅ | ❌ | ❌ | ❌ |
| Record credit sale / purchase | ✅ | ✅ | ✅ | ❌ (configurable ✅) | ❌ |
| Record payment received | ✅ | ✅ | ✅ | ✅ (assigned; may require approval) | ❌ |
| Record payment made (supplier) | ✅ | ✅ | ✅ (configurable) | ❌ | ❌ |
| Discount / write-off | ✅ | ✅ (≤ limit) | ❌ | ❌ | ❌ |
| Reverse entry | ✅ | ✅ | Own within window | ❌ (request) | ❌ |
| Approve collections / hand-over | ✅ | ✅ | ❌ | ❌ | ❌ |
| Send single message | ✅ | ✅ | ✅ | ✅ (assigned) | ❌ |
| Bulk messages | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit reminder rules & templates | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export data | ✅ | ✅ | ❌ | ❌ | ❌ (configurable) |
| View audit log | ✅ | ✅ | ❌ | ❌ | ❌ |
| Period lock | ✅ | ❌ | ❌ | ❌ | ❌ |

Platform roles: **SuperAdmin** (everything incl. plans, pricing, gateways), **Support** (read tenant data via impersonation with reason, top-up credits, resend messages; cannot reverse ledger entries unless tenant grants "support edit" for a session). Implementation: permission strings in code (`Permissions.Ledger.Reverse`), roles → permissions mapping seeded and stored in DB (custom roles in Phase 2).

### 7.11 Audit trail
- **BR-11.1** Audit every command that changes state: {TenantId, UserId, ImpersonatorId?, Action, EntityType, EntityId, BeforeJson, AfterJson, IpAddress, UserAgent/DeviceId, CorrelationId, TimestampUtc}.
- **BR-11.2** Audit log is append-only, retained ≥ 7 years for ledger-related actions (tenant data retention policy), viewable/filterable by Owner/Manager.
- **BR-11.3** Security events (login success/failure, OTP requests, token refresh reuse detection, permission denied, impersonation start/end) go to `SecurityEvents`.

### 7.12 Notifications to users (internal)
Push (FCM) / in-app: new pending collection, collection approved/rejected, PTP due today (morning digest), wallet low, message failures spike, subscription expiring (7/3/1 days), daily owner digest at `Tenant.DigestTime` (default 21:00).

### 7.13 Data import rules
- Excel/CSV template with columns: Name*, Phone, Type (Customer/Supplier)*, Opening Balance, Opening Due Date, Group, Area, Credit Days, Credit Limit, Language, Notes.
- Validate all rows first → return report (row, field, error). Commit only valid rows (or all-or-nothing, user's choice). Duplicate phone within tenant → merge suggestion/skip. Max 10,000 rows per file (MVP). Import runs as background job with progress.

### 7.14 Limits & plan enforcement
Plan limits (users, active customers, branches, monthly included messages) checked in Application layer; exceeding returns `402/403 PLAN_LIMIT_REACHED` with upgrade hint. Never block recording payments due to plan limits (only new customers/users).

---

## 8. Key User Flows

### F1 — Sign-up & guided setup (Owner, web or mobile)
1. Enter mobile number → receive OTP (6 digits, 5-min expiry, max 5 attempts, resend after 60 s).
2. Verify → set name + password (optional on mobile; PIN/biometric for app lock).
3. Create business: name (bn/en), type, address, default credit days, language.
4. Setup checklist shown on dashboard: ① add/import customers ② set opening balances ③ choose reminder rules ④ test a message to yourself ⑤ invite staff. (Premium onboarding: support agent completes this with the owner.)
5. Trial starts (14 days, full features, ৳50 free message credit).

### F2 — Record a baki (credit sale) in 3 taps (mobile)
1. Home → "বাকি দিন" (Give credit) → pick/search customer (recent first) or "+ new".
2. Enter amount (big numeric keypad), optional note/memo no./photo; due date auto-filled (editable).
3. Save → balance updates instantly (offline OK) → toggle "Send SMS/WhatsApp" (default per settings) → message queued (sent when online).
- Credit-limit exceeded → yellow warning before save.

### F3 — Receive payment (partial) & receipt
1. Customer → "জমা নিন" (Receive) → amount, method (Cash/bKash/…), reference.
2. Preview shows allocation: "Settles DUE-0012 (৳3,000) and ৳500 of DUE-0015".
3. Save → receipt no. generated → receipt message sent → balance and aging update; open PTP evaluated.

### F4 — Correct a mistaken entry
1. Open entry → "Correct" → choose: *Reverse only* or *Reverse & re-enter* → reason (required).
2. System creates Reversal (+ new entry) atomically; both shown in ledger with strikethrough on original and "Corrected by #…" link; audit logged; optional correction message to customer.

### F5 — Daily collection routine (Owner/Manager)
1. Dashboard "আজ আদায় করুন" (Collect today): PTPs due today, dues due today, overdue sorted by amount × DPD.
2. For each: Call (tel: link, logs call outcome), WhatsApp, SMS, or "Add promise".
3. After call: record outcome {Promised, Paid, Not reachable, Disputed, Refused} → PTP created or dispute flag set (pauses reminders, notifies owner).

### F6 — Automated reminders (system)
1. Every 15 min scheduler → eligible customers per rules → enqueue message (idempotent key).
2. Worker renders template (language) → wallet reserve → gateway send → status webhook/poll → wallet capture/refund.
3. Owner sees message log & weekly "reminders worked" report: amount collected within 7 days of a reminder.

### F7 — Field collection (Collector, offline)
1. Morning: app syncs assigned customers, balances, open dues, PTPs.
2. At shop (offline): open customer → show statement on screen → record collection (cash) → local receipt no. placeholder `TMP-…` → "SMS will be sent when synced".
3. Back online: sync pushes collections (idempotency keys) → server posts (or pending approval) → definitive receipt no. → receipt SMS sent.
4. Evening: "Hand over cash" → manager confirms amount → variance recorded.

### F8 — Customer views statement (end customer, no app)
1. Receives WhatsApp/SMS with link → opens mobile web page (Bangla) → sees balance, recent entries, downloads PDF.
2. Can tap "Call business", "Stop messages", (Phase 2) "Pay with bKash/Nagad" → payment webhook → auto `PaymentReceived` + receipt.

### F9 — Bulk reminder campaign
1. Customers → filter (e.g., overdue > 30 days, area = Mirpur) → "Send reminder" → choose template & channel.
2. Preview 3 rendered samples, count, segments, cost; confirm → batch job; progress & results.

### F10 — Import paper khata/Excel (support-assisted)
1. Download template → fill → upload → validation report → fix → commit → opening balances created as `OpeningBalance` entries with due dates → summary "1,245 customers, ৳38,40,500 opening dues".

### F11 — Platform admin: onboard premium client
1. Create tenant (or approve sign-up) → assign plan & setup fee invoice → configure SMS sender (masking) & WhatsApp templates → top-up credits → impersonate (reason logged) to import data → mark onboarding complete → schedule 7/30-day check-ins.

### F12 — Subscription renewal
1. 7/3/1 days before expiry: push + SMS to owner → pay (MVP: bKash to merchant number, admin records payment; Phase 2: online checkout) → plan extended; on expiry → PastDue (7-day grace) → Suspended (read-only + export).

---

## 9. System Architecture

### 9.1 High-level view
```
 ┌──────────────┐   ┌──────────────┐   ┌────────────────────┐
 │ Next.js Web  │   │ Flutter App  │   │ Public Statement   │
 │ (owner/staff │   │ (owner/staff │   │ page (Next.js,     │
 │ /admin)      │   │ /collector)  │   │ SSR, no login)     │
 └──────┬───────┘   └──────┬───────┘   └─────────┬──────────┘
        │ HTTPS/JSON (JWT)  │ HTTPS + sync API    │ token
        ▼                   ▼                     ▼
 ┌──────────────────────────────────────────────────────────┐
 │        ASP.NET Core Web API (.NET 10) — /api/v1          │
 │  Auth · Tenancy · Parties · Ledger · Collections ·       │
 │  Messaging · Reminders · Statements · Reports · Admin    │
 │  Clean Architecture + CQRS (Mediator) + FluentValidation │
 └──────┬──────────────┬──────────────┬──────────────┬──────┘
        │              │              │              │
 ┌──────▼─────┐ ┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼────────┐
 │ SQL Server │ │ Hangfire    │ │ Blob store │ │ Redis (opt.) │
 │ (app DB +  │ │ workers     │ │ (S3/Azure/ │ │ cache, rate  │
 │ Hangfire)  │ │ (same image)│ │ MinIO)     │ │ limit, OTP   │
 └────────────┘ └──────┬──────┘ └────────────┘ └──────────────┘
                       │
   ┌───────────────────┼─────────────────────┬──────────────────┐
   ▼                   ▼                     ▼                  ▼
 SMS gateways     WhatsApp Cloud API     FCM push        bKash/Nagad/
 (SSL Wireless,   (Meta Graph API,       notifications   SSLCommerz
 BulkSMSBD, ...)  webhooks)                              (Phase 2)
```

### 9.2 Backend — Clean Architecture
**Layers & dependency rule:** `Domain` ← `Application` ← `Infrastructure` / `Api`. Domain has zero framework dependencies. Application defines interfaces (ports); Infrastructure implements them (adapters). Api is the composition root.

| Layer | Contents |
|---|---|
| **Domain** | Entities & aggregates (`Tenant`, `Party`, `LedgerEntry`, `DueItem`, `PromiseToPay`, `ReminderRule`, `OutboundMessage`...), value objects (`Money`, `PhoneNumber`, `LocalDate`), enums, domain events (`LedgerEntryPosted`, `PaymentReceived`, `PromiseBroken`), domain services (`AllocationService`, `AgingCalculator`), domain errors. |
| **Application** | Use cases as Commands/Queries + Handlers (CQRS), DTOs, validators (FluentValidation), pipeline behaviors (validation, logging, transaction/unit-of-work, authorization, idempotency, performance), interfaces (`IAppDbContext`, `ISmsGateway`, `IWhatsAppClient`, `IClock`, `ICurrentUser`, `ITenantContext`, `IFileStorage`, `IBackgroundJobs`), mapping. |
| **Infrastructure** | EF Core `AppDbContext` (SQL Server), configurations, migrations, interceptors (audit, soft delete, tenant stamping, UTC), repositories (only where useful), Hangfire jobs, SMS/WhatsApp/FCM adapters, blob storage, PDF (QuestPDF), Excel (ClosedXML), identity (password hashing, JWT issuing), OTP, caching. |
| **Api** | Minimal APIs or Controllers (choose **Controllers** for clarity with agents) grouped by module, versioning, auth policies, ProblemDetails error handling, rate limiting, OpenAPI, health checks, webhooks endpoints. |

**Libraries (verify licenses at project start):**
- Mediator: **MediatR** (note: v13+ uses a commercial license with a free community tier — check eligibility) or the free source-generated **`Mediator`** (martinothamar) / a thin in-house dispatcher. Keep handler interfaces abstract so the library can be swapped.
- Validation: FluentValidation. Mapping: manual mapping or **Mapster** (avoid AutoMapper's commercial versions unless licensed).
- ORM: EF Core 10 (SQL Server provider); Dapper for heavy read reports (optional).
- Auth: ASP.NET Core Identity password hasher (not full Identity UI), JWT bearer, custom refresh tokens.
- Jobs: Hangfire (SQL Server storage). Logging: Serilog → Seq (dev) / OpenTelemetry → Grafana/Loki or Azure App Insights.
- Resilience: `Microsoft.Extensions.Http.Resilience` (Polly) for gateway calls.
- PDF: QuestPDF (check community license threshold). Excel: ClosedXML. Phone: libphonenumber-csharp.
- Tests: xUnit, **Shouldly** or plain asserts (FluentAssertions v8 is commercial), NSubstitute, Testcontainers (SQL Server), Respawn, WebApplicationFactory, Verify (snapshot), NetArchTest (architecture rules).

**.NET solution structure**
```
aadai/
├─ src/
│  ├─ Aadai.Domain/
│  │  ├─ Common/ (Entity, AggregateRoot, ValueObject, IDomainEvent, Result, Error)
│  │  ├─ Tenancy/ (Tenant, Branch, Plan, Subscription)
│  │  ├─ Identity/ (User, Membership, Role, Permission)
│  │  ├─ Parties/ (Party, PartyType, CustomerGroup, Consent)
│  │  ├─ Ledger/ (LedgerEntry, EntryType, DueItem, Allocation, DocumentSequence, AllocationService)
│  │  ├─ Collections/ (PromiseToPay, PendingCollection, CashHandover, CallLog)
│  │  ├─ Messaging/ (MessageTemplate, OutboundMessage, ReminderRule, MessageWallet, WalletTransaction)
│  │  └─ Statements/ (StatementLink)
│  ├─ Aadai.Application/
│  │  ├─ Common/ (Behaviors/, Interfaces/, Models/ (PagedResult, ...), Security/ (Permissions.cs), Exceptions/)
│  │  ├─ Auth/ (Commands: RequestOtp, VerifyOtp, Login, Refresh, Logout; Queries: Me)
│  │  ├─ Tenants/ ...
│  │  ├─ Parties/ (Commands/CreateCustomer/CreateCustomerCommand.cs, ...Handler.cs, ...Validator.cs; Queries/...)
│  │  ├─ Ledger/ ...
│  │  ├─ Collections/ ...
│  │  ├─ Messaging/ ...
│  │  ├─ Reminders/ ...
│  │  ├─ Reports/ ...
│  │  ├─ Sync/ ...
│  │  └─ Admin/ ...
│  ├─ Aadai.Infrastructure/
│  │  ├─ Persistence/ (AppDbContext, Configurations/, Migrations/, Interceptors/, Seed/)
│  │  ├─ Identity/ (JwtTokenService, PasswordHasher, OtpService)
│  │  ├─ Messaging/ (Sms/SslWirelessGateway.cs, Sms/BulkSmsBdGateway.cs, WhatsApp/WhatsAppCloudClient.cs, Push/FcmSender.cs)
│  │  ├─ Jobs/ (ReminderSchedulerJob, MessageDispatchJob, PtpEvaluationJob, AgingSnapshotJob, IntegrityCheckJob, DigestJob, SubscriptionJob)
│  │  ├─ Files/ (BlobStorage), Pdf/, Excel/
│  │  └─ DependencyInjection.cs
│  ├─ Aadai.Api/
│  │  ├─ Controllers/v1/ ...
│  │  ├─ Webhooks/ (WhatsAppWebhookController, SmsDlrController, PaymentWebhookController)
│  │  ├─ Middleware/ (TenantResolution, CorrelationId, ExceptionHandling)
│  │  ├─ Program.cs, appsettings*.json
│  └─ Aadai.Worker/ (optional separate host for Hangfire server; same Application/Infrastructure)
├─ tests/
│  ├─ Aadai.Domain.Tests/  ├─ Aadai.Application.Tests/
│  ├─ Aadai.Api.IntegrationTests/  └─ Aadai.ArchitectureTests/
├─ web/            (Next.js app)
├─ mobile/         (Flutter app)
├─ docs/           (this plan, ADRs, API contracts)
├─ deploy/         (docker-compose, IaC, nginx)
└─ .github/workflows/
```

### 9.3 Multi-tenancy strategy
- **MVP: shared database, shared schema, `TenantId` discriminator** on every tenant-owned table, enforced by:
  1. `ITenantContext` resolved from JWT claim `tid` (users select active business; token re-issued per business).
  2. EF Core **global query filters** `e => e.TenantId == _tenant.Id && !e.IsDeleted`.
  3. `SaveChanges` interceptor stamps `TenantId` on insert and throws if a modified entity's TenantId ≠ current.
  4. Composite indexes beginning with `TenantId`.
  5. Integration tests that try cross-tenant access on every endpoint (automated "tenant isolation" test suite).
  6. Optional defense-in-depth: SQL Server **Row-Level Security** with `SESSION_CONTEXT('TenantId')` set per connection (Phase 2).
- **Phase 3: hybrid** — a `TenantCatalog` table maps tenant → connection string; premium clients can be moved to a **dedicated database** (same schema) with a migration tool; `AppDbContext` connection chosen per request. Design code so DbContext creation goes through `ITenantConnectionResolver` from day 1.
- Platform-level tables (Plans, Users, Gateways, global templates) have no TenantId.

### 9.4 Authentication & authorization
- **Identity:** phone + OTP (sign-up, login, reset) and phone + password; optional Google sign-in later.
- **Tokens:** JWT access token (15 min, HS256 w/ rotated key or RS256), claims: `sub` (userId), `tid` (tenantId), `bid` (branch, optional), `role`, `perm` (compact permission codes or permission version), `sid` (session id). Refresh token: opaque 256-bit random, **stored hashed**, 30-day sliding, **rotation on every use**, reuse detection → revoke whole session family.
- **Sessions:** `UserSessions` table per device (name, platform, last seen, IP); user can revoke.
- **Authorization:** policy-based, `[HasPermission(Permissions.Ledger.Reverse)]` attribute + Application-level authorization behavior (so handlers are protected even if called from jobs). Resource rules (e.g., collector only assigned customers) in handlers/specifications.
- **OTP:** 6 digits, hashed, 5 min TTL, max 5 verify attempts, max 5 sends/hour/phone and per-IP limits; SMS via platform gateway; test numbers in non-prod.
- **Mobile app lock:** PIN/biometric to unlock local session (not a server login), auto-lock after inactivity.
- **Impersonation:** SuperAdmin/Support obtains a short-lived token with `imp` claim (impersonator id) after entering a reason; all audit rows record it; banner shown in UI; tenant Owner can see impersonation history.

### 9.5 Background jobs (Hangfire)
| Job | Schedule | Purpose |
|---|---|---|
| `ReminderSchedulerJob` | every 15 min | Evaluate reminder rules per tenant in send window; enqueue messages idempotently |
| `MessageDispatchJob` | fire-and-forget per message (queue `messages`) | Render, reserve credit, send via gateway, update status |
| `SmsDeliveryStatusPollJob` | every 10 min | Poll DLR for gateways without webhooks |
| `PtpEvaluationJob` | daily 23:30 tenant time (+ on payment) | Update PTP statuses |
| `DueStatusJob` / `AgingSnapshotJob` | daily 00:15 | Snapshot aging per tenant/customer for trends |
| `BalanceIntegrityJob` | nightly 02:00 | Recompute balances & due invariants; alert on mismatch |
| `OwnerDigestJob` | per tenant digest time | Daily summary to owner |
| `SubscriptionLifecycleJob` | daily 09:00 | Expiry reminders, PastDue/Suspended transitions |
| `ImportJob` | on demand | Excel import processing |
| `ExportJob` / `ReportPdfJob` | on demand | Large exports to blob, notify when ready |
| `WhatsAppTemplateSyncJob` | hourly | Sync template approval status from Meta |
| `CleanupJob` | daily | Expired OTPs, refresh tokens, statement tokens, temp files |
Jobs MUST be idempotent, tenant-aware (set tenant context explicitly), and use `[DisableConcurrentExecution]` where needed. Hangfire dashboard only for SuperAdmin.

### 9.6 Messaging integrations
**Abstraction:** `ISmsGateway { SendAsync(SmsRequest) ; GetStatusAsync(providerMsgId) }`, `IWhatsAppClient { SendTemplateAsync(...); SendTextAsync(...) }`, chosen via `IMessageChannelRouter`. Gateway credentials stored encrypted (platform-level in MVP; per-tenant own sender in Phase 2).

**SMS (Bangladesh):** integrate one primary + one fallback gateway. Candidates: **SSL Wireless** (enterprise, masking), **BulkSMSBD**, others such as Alpha SMS/MiMSMS/Infobip-local partners. Requirements to check during vendor selection: API (REST/HTTP), Unicode support, masking sender ID approval process (BTRC), DLR webhook/poll, per-SMS price at volume, throughput, uptime SLA. Store `ProviderMessageId`, segments, cost.

**WhatsApp Cloud API (Meta):**
- MVP: one platform-owned WhatsApp Business Account & phone number ("Aadai Reminders" display name), messages say "on behalf of {{business_name}}". Phase 2: **Embedded Signup** so premium tenants connect their own number (shows their business name).
- Send via Graph API `POST /{phone-number-id}/messages` with `type: template`; templates in Bangla & English, category Utility (reminder, receipt, statement, PTP reminder).
- Webhook endpoint `/webhooks/whatsapp` (verify token + `X-Hub-Signature-256` HMAC validation) for statuses (sent/delivered/read/failed) and inbound messages (STOP, replies → Phase 2 inbox).
- Pricing is per delivered template message, varying by recipient country and category; check Meta's current rate card for Bangladesh and keep the rate configurable in `ChannelRates`.

**Push:** Firebase Cloud Messaging for Flutter (and web push optional).

### 9.7 Payments (Phase 2)
- `IPaymentProvider` with adapters: **bKash Tokenized Checkout (PGW)**, **Nagad PGW**, **SSLCommerz** (cards + MFS aggregator).
- Flow: statement page "Pay" → create `PaymentIntent` {tenant, customer, amount, provider} → redirect → callback/webhook (verify signature & query transaction status server-side) → idempotently post `PaymentReceived` (method = provider, reference = trxId) → receipt.
- Settlement: initially into the **tenant's own merchant account** (tenant provides credentials) to avoid holding funds (no PSP license needed). Platform takes no cut in MVP.
- Same providers used for tenants paying their Aadai subscription and message credits.

### 9.8 File storage
S3-compatible blob storage (AWS S3 / Cloudflare R2 / DigitalOcean Spaces / MinIO self-hosted) or Azure Blob. Keys: `{tenantId}/{entity}/{yyyy}/{mm}/{guid}.{ext}`. Uploads via pre-signed URLs; allowed types jpg/png/pdf/xlsx/csv; max 5 MB images (client-side compression), 10 MB imports; virus scan optional (ClamAV) for imports.

### 9.9 Logging, monitoring & observability
- Serilog structured logs with `CorrelationId`, `TenantId`, `UserId`; never log OTPs, tokens, full phone numbers (mask), message bodies at Info.
- OpenTelemetry traces & metrics (request latency, job durations, gateway success rate, queue depth).
- Health checks: `/health/live`, `/health/ready` (DB, blob, Hangfire, gateways).
- Alerts: error rate > 2%, p95 latency > 800 ms, message failure rate > 10% per gateway, Hangfire failed jobs > N, integrity mismatch (any), DB CPU > 80%, disk, backup failure.
- Error tracking: Sentry (API, Next.js, Flutter).
- Admin "System health" page (gateway status, queue depth, failed jobs, wallet totals).

### 9.10 Security
- OWASP ASVS L2 as target; HTTPS everywhere (HSTS), TLS 1.2+.
- Input validation (FluentValidation) + parameterized queries (EF) + output encoding.
- Rate limiting (ASP.NET Core rate limiter): auth endpoints, OTP, statement pages, webhooks.
- Secrets in environment/secret manager (Azure Key Vault / AWS Secrets Manager / Doppler), never in repo. Sensitive columns (gateway credentials, payment credentials) encrypted (AES-GCM via Data Protection API or SQL Always Encrypted).
- CORS restricted to web origins; CSRF not needed for bearer tokens, but if web uses httpOnly cookies for refresh → SameSite=Strict + CSRF token.
- **Web token storage:** access token in memory, refresh token in httpOnly Secure cookie set by a Next.js route handler (BFF pattern). **Mobile:** tokens in `flutter_secure_storage`.
- Least-privilege DB users (app user without DDL; migrations user separate).
- Dependency scanning (Dependabot/Renovate), SAST (CodeQL), container scanning (Trivy).
- PII handling: phone numbers are personal data — privacy policy, data processing terms with tenants, data deletion on request; Bangladesh's personal data protection rules should be reviewed with a lawyer before scale.
- Webhook signature verification for Meta, SMS DLR (shared secret/IP allowlist), payment providers.

### 9.11 Backups & disaster recovery
- SQL Server: full backup daily, differential every 6 h, transaction log every 15 min (point-in-time). **RPO ≤ 15 min, RTO ≤ 4 h** (MVP).
- Backups encrypted, copied to a second region/provider; retention 35 days + monthly for 12 months.
- Monthly **restore drill** into staging with integrity check job.
- Blob storage versioning/soft delete enabled.
- Tenant-level export (Excel) available to owners anytime (also their own backup).

### 9.12 Next.js web app
- Next.js (latest stable, App Router), TypeScript strict, Tailwind CSS + **shadcn/ui**, **TanStack Query** for server state, **React Hook Form + Zod**, **next-intl** (bn/en), TanStack Table for grids, Recharts for charts, date-fns-tz for Asia/Dhaka.
- API client generated from OpenAPI (**orval** or openapi-typescript) — no hand-written fetch types.
- Auth: BFF route handlers (`/api/auth/*`) hold refresh cookie; middleware protects routes; tenant switcher.
- Areas: `(auth)`, `(app)` (tenant app), `(admin)` (platform), `s/[token]` (public statement, SSR, separate minimal layout).
```
web/
├─ src/app/
│  ├─ [locale]/(auth)/login, signup, verify-otp, forgot-password
│  ├─ [locale]/(app)/dashboard, customers, customers/[id], suppliers, suppliers/[id],
│  │   ledger, collections (today, promises, pending, handovers), messages (log, bulk, templates),
│  │   reminders (rules), reports/*, settings (business, users, roles, wallet, billing, audit, import-export)
│  ├─ [locale]/(admin)/admin/tenants, plans, gateways, templates, wallet-topups, health, jobs
│  ├─ s/[token]/page.tsx            (public statement)
│  └─ api/auth/[...]/route.ts       (BFF)
├─ src/features/<module>/ (components, hooks, schemas, api)
├─ src/lib/ (api-client generated, money.ts, phone.ts, date.ts, permissions.ts)
├─ src/components/ui/ (shadcn)
├─ messages/bn.json, en.json
└─ tests/ (vitest unit, playwright e2e)
```

### 9.13 Flutter mobile app
- Flutter stable, Dart 3, **Riverpod** (state/DI), **go_router**, **dio** (+ interceptors for auth refresh, idempotency key, tenant header), **drift** (SQLite, offline DB), **freezed/json_serializable**, **flutter_secure_storage**, **local_auth** (biometric), **firebase_messaging**, **intl** + ARB (bn/en), **workmanager** (background sync), **connectivity_plus**, `pdf`/`printing` for receipts, `url_launcher` (tel/WhatsApp deep links), `contacts_service`/`flutter_contacts` (import), image_picker + compression.
- Architecture: feature-first Clean Architecture: `presentation` (widgets, controllers) → `domain` (entities, use cases, repository interfaces) → `data` (remote API, local drift DAOs, repository impl, sync).
```
mobile/lib/
├─ core/ (config, network/dio_client.dart, db/app_database.dart, sync/sync_engine.dart, money, phone, l10n, theme, router)
├─ features/
│  ├─ auth/  ├─ business/  ├─ customers/  ├─ suppliers/  ├─ ledger/
│  ├─ collections/  ├─ messages/  ├─ reports/  ├─ settings/
│  └─ each: data/ domain/ presentation/
└─ main.dart
```
**Offline-first sync design**
- All entities use client-generatable **UUID (v7 preferred)** primary keys → no ID remapping.
- Local writes go to drift tables + an **outbox** (`pending_ops`: id, entity, op, payload, idempotencyKey, createdAt, attempts).
- **Push:** `POST /api/v1/sync/push` with batch of ops (≤ 200); server processes each idempotently, returns per-op result (ok / rejected with reason / server-assigned numbers like receipt no.).
- **Pull:** `GET /api/v1/sync/pull?since={cursor}` returns changed rows per entity since a server cursor (monotonic `ChangeVersion` via SQL `rowversion` or a `ChangeLog` sequence per tenant), plus tombstones for deletions; scoped (collector gets only assigned customers).
- **Conflicts:** ledger entries are append-only → no conflicts (server just accepts or rejects e.g., period-locked). Party profile edits: field-level last-writer-wins by server receive time, conflicts logged. Balance is always **server-authoritative**; client shows provisional balance (local) with "syncing" indicator.
- Server validations still apply (permissions, limits); rejected ops surface in an "Sync issues" screen.
- Receipt numbers: provisional `TMP-` locally; final number returned by server and the receipt message sent server-side only after posting.

---

## 10. Database Design (MS SQL Server)

### 10.1 Conventions
- Schema per bounded context: `tenancy`, `identity`, `party`, `ledger`, `collect`, `msg`, `billing`, `audit`, `sync` (or single `dbo` with prefixes — pick schemas).
- PK: `Id uniqueidentifier` (UUIDv7 generated in app for index locality; or `NEWSEQUENTIALID()` server default). Human numbers (receipt no.) are separate columns.
- Every tenant-owned table: `TenantId uniqueidentifier NOT NULL` (FK → Tenants), first column of most indexes.
- Auditable columns: `CreatedAtUtc datetime2(3)`, `CreatedBy uniqueidentifier`, `UpdatedAtUtc`, `UpdatedBy`; soft delete: `IsDeleted bit`, `DeletedAtUtc`, `DeletedBy`; concurrency: `RowVersion rowversion`.
- Money `decimal(18,2)`; business dates `date`; text `nvarchar` (Bangla Unicode); enums stored as `tinyint`/`smallint` with a lookup in code (or `varchar(30)` for readability — choose `varchar` for agent clarity).
- Collation: default `Latin1_General_100_CI_AS_SC_UTF8` or keep `nvarchar` with default collation; full-text search optional for Bangla names.

### 10.2 Tables
**Tenancy & billing**
| Table | Key columns | Notes |
|---|---|---|
| `Tenants` | Id, Name, NameBn, BusinessType, Phone, Email, Address, LogoUrl, TimeZone ('Asia/Dhaka'), CurrencyCode ('BDT'), DefaultLanguage, DefaultCreditDays, BackdateLimitDays, LockedUntilDate, Settings (json: send window, flags), Status, CreatedAtUtc | Root. Settings JSON validated by a typed options class. |
| `Branches` | Id, TenantId, Name, Address, Phone, IsDefault, IsActive | One default per tenant. |
| `Plans` | Id, Code, Name, PriceMonthly, PriceYearly, MaxUsers, MaxCustomers, MaxBranches, IncludedMessageCredit, Features (json), IsActive | Platform table. |
| `Subscriptions` | Id, TenantId, PlanId, Status, StartDate, EndDate, TrialEndsAt, BillingCycle, AutoRenew, Notes | One active per tenant. |
| `SubscriptionInvoices` | Id, TenantId, SubscriptionId, InvoiceNo, PeriodStart, PeriodEnd, Amount, SetupFee, Discount, Status(Unpaid/Paid/Void), PaidAtUtc, PaymentMethod, PaymentRef | Manual recording in MVP. |
| `TenantHolidays` | Id, TenantId (null=global), Date, Name | BD public holidays seeded globally. |
| `TenantCatalog` (Phase 3) | TenantId, ConnectionStringName, DbKind(Shared/Dedicated) | Routing. |

**Identity**
| Table | Key columns | Notes |
|---|---|---|
| `Users` | Id, PhoneE164 (unique), FullName, Email, PasswordHash, PreferredLanguage, IsPlatformAdmin, PlatformRole, Status, LastLoginAtUtc | Global (not tenant-scoped). |
| `Memberships` | Id, TenantId, UserId, RoleId, BranchId (null=all), IsActive, InvitedBy, JoinedAtUtc | Unique (TenantId, UserId). |
| `Roles` | Id, TenantId (null=system role), Code (Owner/Manager/Staff/Collector/Viewer), Name, IsSystem | |
| `RolePermissions` | RoleId, Permission (varchar(100)) | PK (RoleId, Permission). |
| `Invitations` | Id, TenantId, PhoneE164, RoleId, Token hash, ExpiresAtUtc, Status | |
| `OtpCodes` | Id, PhoneE164, Purpose, CodeHash, ExpiresAtUtc, Attempts, ConsumedAtUtc, IpAddress | Cleanup job. |
| `UserSessions` | Id, UserId, TenantId, DeviceId, DeviceName, Platform, IpAddress, CreatedAtUtc, LastSeenAtUtc, RevokedAtUtc | |
| `RefreshTokens` | Id, SessionId, TokenHash (unique), FamilyId, ExpiresAtUtc, ReplacedById, RevokedAtUtc, CreatedAtUtc | Rotation + reuse detection. |

**Parties**
| Table | Key columns | Notes |
|---|---|---|
| `Parties` | Id, TenantId, BranchId, PartyType (Customer/Supplier), Code (per tenant), Name, NameBn, PhoneE164, AltPhoneE164, Email, Address, Area, GroupId, CreditLimit, CreditDays, PreferredLanguage, PreferredChannel, AssignedCollectorId, Notes, **CurrentBalance**, LastEntryAtUtc, LastPaymentAtUtc, IsArchived, DoNotRemind, IsDisputed, soft delete, RowVersion | Unique (TenantId, PartyType, Code); index (TenantId, PartyType, PhoneE164). |
| `PartyGroups` | Id, TenantId, Name, Color | e.g., "Mirpur retailers". |
| `PartyTags` / `PartyTagLinks` | — | Optional (P1). |
| `PartyConsents` | Id, TenantId, PartyId, Channel, Status (OptedIn/OptedOut/Unknown), Source, ChangedAtUtc, ChangedBy | Latest consent per channel; history in `ConsentEvents`. |
| `ConsentEvents` | Id, TenantId, PartyId, Channel, OldStatus, NewStatus, Source (Tenant/StatementPage/InboundSTOP/Import), AtUtc | Append-only. |

**Ledger**
| Table | Key columns | Notes |
|---|---|---|
| `LedgerEntries` | Id, TenantId, BranchId, PartyId, PartyType, EntryType, Direction (Dr/Cr), Amount, EntryDate, DocumentNo, SequenceNo (per party, monotonic), BalanceAfter, PaymentMethod, ReferenceNo, Note, AttachmentUrl, DueDate (for debit types), CollectedByUserId, Source (Web/Mobile/Import/Payment/System), IdempotencyKey, ReversalOfEntryId, IsReversed, ReversedByEntryId, ReversalReason, CorrectionOfEntryId, CreatedAtUtc, CreatedBy | **Append-only.** Unique (TenantId, IdempotencyKey) filtered not null; unique (TenantId, DocumentNo). |
| `DueItems` | Id, TenantId, PartyId, SourceEntryId, OriginalAmount, AllocatedAmount, RemainingAmount (computed persisted), DueDate, Status, ClosedAtUtc, RowVersion | Also used for supplier payable items (PartyType). |
| `Allocations` | Id, TenantId, CreditEntryId, DueItemId, Amount, CreatedAtUtc, IsReversed | Reversal sets IsReversed + writes new rows if re-allocated. |
| `DocumentSequences` | TenantId, DocType, Prefix, NextValue | PK (TenantId, DocType), row-locked increments. |
| `AgingSnapshots` | Id, TenantId, SnapshotDate, PartyId (null = tenant total), Current, B1_30, B31_60, B61_90, B90Plus, TotalOutstanding | Daily. |
| `PeriodLocks` | (or Tenant.LockedUntilDate + history in audit) | |

**Collections**
| Table | Key columns | Notes |
|---|---|---|
| `PromisesToPay` | Id, TenantId, PartyId, Amount, PromiseDate, Status, AmountPaid, Note, Channel, CreatedBy, CreatedAtUtc, ResolvedAtUtc, SupersededById | One Open per party (filtered unique index). |
| `PendingCollections` | Id, TenantId, PartyId, CollectorId, Amount, PaymentMethod, ReferenceNo, CollectedAtUtc, Lat, Lng, Note, Status (Pending/Approved/Rejected), ReviewedBy, ReviewedAtUtc, RejectReason, PostedEntryId, IdempotencyKey | |
| `CashHandovers` | Id, TenantId, CollectorId, HandoverDate, DeclaredAmount, ConfirmedAmount, Variance, Status, Note, ConfirmedBy, ConfirmedAtUtc | Links to entries via `CashHandoverItems` (HandoverId, EntryId). |
| `CallLogs` (contact attempts) | Id, TenantId, PartyId, UserId, Channel (Call/Visit/WhatsApp), Outcome, Note, AtUtc | Feeds "collect today". |
| `Disputes` (P1) | Id, TenantId, PartyId, EntryId?, Reason, Status, ResolvedNote | Pauses reminders. |

**Messaging & reminders**
| Table | Key columns | Notes |
|---|---|---|
| `MessageTemplates` | Id, TenantId (null=global), Key (ReminderDue, ReminderOverdue, Receipt, CreditSaleNotice, PtpReminder, Statement, Custom), Channel, Language, Body, WhatsAppTemplateName, WhatsAppStatus, Variables (json), IsActive, Version | |
| `ReminderRules` | Id, TenantId, Code, Name, IsEnabled, TriggerType (BeforeDue/OnDue/AfterDue/Ptp/MonthlyStatement), OffsetDays, RepeatEveryDays, MaxAttempts, MinBalance, MinDpd, Channel (Preferred/SMS/WhatsApp), TemplateKey, AppliesToGroupId (null=all) | |
| `OutboundMessages` | Id, TenantId, PartyId, Channel, TemplateId, Language, RenderedBody, ToPhoneE164, Status, FailureReason, Provider, ProviderMessageId, Segments, CostEstimate, CostActual, ScheduledForUtc, SentAtUtc, DeliveredAtUtc, ReadAtUtc, TriggerType (Manual/Bulk/Rule/Transaction/System), RuleId, BatchId, RelatedEntryId, IdempotencyKey, Attempts, CreatedBy | Index (TenantId, Status, ScheduledForUtc); (TenantId, PartyId, CreatedAtUtc); unique (TenantId, IdempotencyKey). |
| `MessageBatches` | Id, TenantId, Name, Filter (json), TemplateId, Channel, RecipientCount, EstimatedCost, Status, CreatedBy | |
| `InboundMessages` | Id, TenantId?, FromPhone, Channel, Body, ProviderMessageId, ReceivedAtUtc, MatchedPartyId, Handled | STOP detection. |
| `MessageWallets` | TenantId (PK), Balance, ReservedAmount, LowBalanceThreshold, RowVersion | |
| `WalletTransactions` | Id, TenantId, Type (TopUp/Reserve/Capture/Release/Adjustment/PlanCredit), Amount, BalanceAfter, OutboundMessageId, Reference, Note, CreatedBy, CreatedAtUtc | Append-only. |
| `ChannelRates` | Id, Channel, Provider, UnitType (Segment/Message), PricePerUnit (sell), CostPerUnit (buy), EffectiveFrom | Platform table. |
| `GatewayConfigs` | Id, Provider, Channel, IsPrimary, IsActive, SettingsEncrypted | Platform (tenant-level in Phase 2). |
| `UserNotifications` / `DeviceTokens` | Id, UserId, TenantId, Type, Title, Body, Data, ReadAtUtc / Token, Platform | Push & in-app. |

**Statements, files, imports**
| Table | Key columns | Notes |
|---|---|---|
| `StatementLinks` | Id, TenantId, PartyId, TokenHash (unique), ExpiresAtUtc, RevokedAtUtc, CreatedAtUtc, LastViewedAtUtc, ViewCount | |
| `StatementLinkViews` | Id, StatementLinkId, ViewedAtUtc, IpHash, UserAgent | |
| `FileObjects` | Id, TenantId, Key, ContentType, Size, Purpose, CreatedBy | |
| `ImportJobs` | Id, TenantId, FileId, Type, Status, TotalRows, ValidRows, ErrorRows, ErrorReportFileId, Mode (Partial/AllOrNothing), CreatedBy, CompletedAtUtc | |
| `ExportJobs` | Id, TenantId, Type, Params, Status, FileId | |

**Audit & sync**
| Table | Key columns | Notes |
|---|---|---|
| `AuditLogs` | Id (bigint identity), TenantId, UserId, ImpersonatorId, Action, EntityType, EntityId, BeforeJson, AfterJson, IpAddress, DeviceId, CorrelationId, AtUtc | Append-only; partition by month at scale; index (TenantId, AtUtc), (TenantId, EntityType, EntityId). |
| `SecurityEvents` | Id, UserId?, PhoneE164?, Type, Ip, Details, AtUtc | |
| `SyncChangeLog` | Seq (bigint identity), TenantId, EntityType, EntityId, Op (Upsert/Delete), AtUtc | Pull cursor = Seq; written by SaveChanges interceptor. |
| `IdempotencyRecords` | TenantId, Key, RequestHash, ResponseJson, StatusCode, CreatedAtUtc | 48 h TTL; for non-ledger POSTs. |

**Phase 2 additions:** `Invoices`, `InvoiceLines`, `Products`, `RecurringSchedules`, `PaymentIntents`, `PaymentProviderConfigs`, `Cheques`, `Routes`, `RouteStops`, `Visits`, `ApiKeys`, `Webhooks`, `WebhookDeliveries`.

### 10.3 Relationships (summary)
```
Tenant 1─* Branch, Membership, Party, LedgerEntry, ReminderRule, MessageTemplate(tenant), OutboundMessage
User 1─* Membership *─1 Role 1─* RolePermission
Party 1─* LedgerEntry ; Party 1─* DueItem ; Party 1─* PromiseToPay ; Party 1─* OutboundMessage ; Party 1─* StatementLink
LedgerEntry(debit) 1─0..1 DueItem ; LedgerEntry(credit) 1─* Allocation *─1 DueItem
LedgerEntry 0..1─0..1 LedgerEntry (ReversalOf / CorrectionOf)
OutboundMessage *─1 MessageTemplate ; *─0..1 ReminderRule ; *─0..1 MessageBatch ; 1─* WalletTransaction
CashHandover 1─* CashHandoverItem *─1 LedgerEntry
```

### 10.4 Key indexes
- `Parties (TenantId, PartyType, IsDeleted, CurrentBalance DESC) INCLUDE (Name, PhoneE164)` — dues list.
- `Parties (TenantId, PhoneE164)`; `Parties (TenantId, AssignedCollectorId)`; full-text or `(TenantId, Name)` for search.
- `LedgerEntries (TenantId, PartyId, EntryDate, SequenceNo)` — statement; `(TenantId, EntryDate) INCLUDE (EntryType, Amount, PaymentMethod, CollectedByUserId)` — daily reports.
- `DueItems (TenantId, Status, DueDate) INCLUDE (PartyId, RemainingAmount)` filtered `Status IN ('Open','PartiallyPaid')` — aging & reminders.
- `PromisesToPay (TenantId, PartyId) WHERE Status='Open'` unique filtered; `(TenantId, PromiseDate, Status)`.
- `OutboundMessages (TenantId, Status, ScheduledForUtc)`; `(ProviderMessageId)` for webhooks.
- `SyncChangeLog (TenantId, Seq)`.
- `AuditLogs (TenantId, AtUtc DESC)`.

### 10.5 Data volume assumptions (sizing)
Per active tenant/month: ~3,000 ledger entries, ~1,500 messages. 1,000 tenants → 3M entries/month → 36M/year: fine on a single SQL Server with proper indexes; partition `LedgerEntries`, `OutboundMessages`, `AuditLogs` by month when > 100M rows; archive messages > 18 months.

---

## 11. REST API Specification

### 11.1 Conventions
- Base URL: `https://api.aadai.app/api/v1` — URL-segment versioning (`Asp.Versioning.Mvc`); breaking changes → v2; non-breaking additive changes allowed in v1.
- JSON camelCase; dates `YYYY-MM-DD` (business dates), timestamps ISO-8601 UTC (`2026-11-23T06:44:00Z`); money as **string decimal** `"12500.00"` (avoids float issues in JS/Dart) — clients parse with decimal libs.
- Auth: `Authorization: Bearer <jwt>`; tenant comes from token (`tid`); no tenantId in URLs for tenant APIs.
- **Idempotency:** `Idempotency-Key` header (UUID) REQUIRED on all POSTs that create ledger entries, collections, messages, payments; server returns the original response on replay (same key + same body) or `409 IDEMPOTENCY_CONFLICT` (same key, different body).
- **Pagination:** `?page=1&pageSize=20` (max 100) → `{ items: [], page, pageSize, totalCount, totalPages }`. For sync/large feeds: cursor `?cursor=...&limit=...` → `{ items, nextCursor }`.
- **Filtering/sorting:** `?search=...&sort=balance:desc,name:asc&groupId=...&status=overdue`.
- **Errors:** RFC 9457 ProblemDetails:
```json
{ "type": "https://docs.aadai.app/errors/validation", "title": "Validation failed", "status": 400,
  "code": "VALIDATION_ERROR", "traceId": "00-...", "errors": { "amount": ["Amount must be greater than 0."] } }
```
  Codes: `VALIDATION_ERROR`(400), `UNAUTHORIZED`(401), `FORBIDDEN`(403), `NOT_FOUND`(404), `CONFLICT`/`CONCURRENCY_CONFLICT`(409), `IDEMPOTENCY_CONFLICT`(409), `BUSINESS_RULE_VIOLATION`(422, with `rule: "BR-4.4"`), `PLAN_LIMIT_REACHED`(402), `SUBSCRIPTION_INACTIVE`(402), `INSUFFICIENT_CREDIT`(402), `RATE_LIMITED`(429), `INTERNAL_ERROR`(500).
- Concurrency: `ETag`/`If-Match` (base64 RowVersion) on PUT/PATCH of master data.
- OpenAPI 3.1 document at `/openapi/v1.json`; Scalar/Swagger UI in non-prod.
- Roles column: **O**=Owner, **M**=Manager, **S**=Staff, **C**=Collector, **V**=Viewer, **SA**=SuperAdmin, **SP**=Support, **Pub**=public. (Actual checks are permission-based; roles shown are defaults.)

### 11.2 Auth & account
| Method | Route | Purpose | Roles |
|---|---|---|---|
| POST | /auth/otp/request | Send OTP {phone, purpose: signup/login/reset} | Pub (rate-limited) |
| POST | /auth/otp/verify | Verify OTP → returns signup/reset ticket or tokens | Pub |
| POST | /auth/signup | Complete signup {ticket, fullName, password?} → tokens | Pub |
| POST | /auth/login | Phone + password → tokens (+ list of businesses) | Pub |
| POST | /auth/refresh | Rotate refresh token → new access/refresh | Pub (refresh token) |
| POST | /auth/logout | Revoke current session | Any |
| POST | /auth/password/reset | {ticket, newPassword} | Pub |
| POST | /auth/password/change | {current, new} | Any |
| POST | /auth/switch-tenant | {tenantId} → tokens scoped to tenant | Any member |
| GET | /me | Profile, memberships, current permissions | Any |
| PATCH | /me | Update name, language, email | Any |
| GET | /me/sessions | List device sessions | Any |
| DELETE | /me/sessions/{id} | Revoke a session | Any |
| POST | /me/device-tokens | Register FCM token | Any |

### 11.3 Business (tenant), branches, users
| Method | Route | Purpose | Roles |
|---|---|---|---|
| POST | /tenants | Create a business (user becomes Owner) | Any authenticated |
| GET | /tenant | Current business profile & settings | O M S C V |
| PUT | /tenant | Update profile | O |
| PUT | /tenant/settings | Update settings (credit days, send window, flags, digest time) | O |
| POST | /tenant/logo | Upload logo (pre-signed URL flow) | O |
| POST | /tenant/period-lock | Set LockedUntilDate | O |
| GET | /tenant/setup-checklist | Onboarding progress | O M |
| GET | /branches · POST /branches · PUT /branches/{id} | Branch CRUD (P2 multi-branch) | O (M read) |
| GET | /members | List members & roles | O M |
| POST | /members/invitations | Invite by phone + role | O M |
| POST | /invitations/{token}/accept | Accept invitation | Invitee |
| PUT | /members/{id} | Change role/branch/active | O M (not Owner role) |
| DELETE | /members/{id} | Remove member (not last Owner) | O |
| GET | /roles | Roles & permissions | O M |
| GET | /permissions | All permission codes (for UI) | O M |

### 11.4 Customers & suppliers (parties)
`{type}` = `customers` | `suppliers` (same handlers with PartyType).
| Method | Route | Purpose | Roles |
|---|---|---|---|
| GET | /{type} | List/search/filter/sort (balance, overdue, group, area, collector, archived) | O M S V; C (assigned) |
| POST | /{type} | Create (with optional opening balance + due date) | O M S |
| GET | /{type}/{id} | Detail: profile, balance, overdue, aging, open PTP, consent | O M S V; C (assigned) |
| PUT | /{type}/{id} | Update profile (If-Match) | O M S; C (limited fields) |
| DELETE | /{type}/{id} | Soft delete (only zero balance) | O M |
| POST | /{type}/{id}/archive · /unarchive | Archive/unarchive | O M |
| POST | /{type}/{id}/restore | Restore soft-deleted (≤30 days) | O |
| GET | /{type}/{id}/ledger | Ledger entries (date range, paginated, running balance) | O M S V; C (assigned) |
| GET | /{type}/{id}/aging | Open due items & buckets | O M S V C |
| GET | /{type}/{id}/messages | Message history for party | O M S |
| GET | /{type}/{id}/timeline | Combined: entries, messages, PTPs, calls, statement views | O M S |
| PUT | /customers/{id}/consent | Set channel consent/opt-out | O M S |
| PUT | /customers/{id}/collector | Assign collector | O M |
| POST | /customers/bulk/assign-collector | Bulk assign | O M |
| POST | /customers/{id}/dispute · DELETE …/dispute | Flag/resolve dispute (pauses reminders) | O M S |
| GET | /party-groups · POST · PUT /{id} · DELETE /{id} | Groups | O M (S read) |
| GET | /{type}/check-duplicate?phone= | Duplicate check | O M S |

### 11.5 Ledger
| Method | Route | Purpose | Roles |
|---|---|---|---|
| POST | /ledger/credit-sales | Customer baki {customerId, amount, entryDate, dueDate?, referenceNo?, note?, attachmentFileId?, notify?:bool} | O M S (C if enabled) |
| POST | /ledger/payments-received | {customerId, amount, method, referenceNo?, entryDate, allocations?: [{dueItemId, amount}], notify?} → entry + allocation result + receipt no. | O M S C* |
| POST | /ledger/credit-purchases | Supplier purchase on credit | O M S |
| POST | /ledger/payments-made | Pay supplier | O M S* |
| POST | /ledger/adjustments | {partyId, type: Discount/WriteOff/SalesReturn/PurchaseReturn/Refund/OpeningBalance, amount, reason} | O M |
| GET | /ledger/entries | Tenant-wide entry list (filters: date range, type, method, user, collector, branch) | O M S V |
| GET | /ledger/entries/{id} | Entry detail incl. allocations, reversal links, audit | O M S V |
| PATCH | /ledger/entries/{id} | Edit non-financial fields (note, reference, attachment) | O M (S own) |
| POST | /ledger/entries/{id}/reverse | {reason} → Reversal entry | O M (S own in window) |
| POST | /ledger/entries/{id}/correct | {reason, newEntry} → reversal + new entry atomically | O M (S own in window) |
| GET | /ledger/entries/{id}/receipt.pdf | Receipt PDF | O M S C |
| POST | /ledger/entries/{id}/resend-notification | Resend receipt/notice | O M S |
| GET | /ledger/allocation-preview?customerId=&amount= | Preview FIFO allocation | O M S C |

### 11.6 Collections
| Method | Route | Purpose | Roles |
|---|---|---|---|
| GET | /collections/today | "Collect today" list (PTP due, due today, overdue priority) | O M S; C (assigned) |
| GET | /collections/overdue | Overdue list with DPD & buckets | O M S V; C |
| GET | /promises | List PTPs (status, date range) | O M S V; C |
| POST | /promises | Create PTP | O M S C |
| PUT | /promises/{id} | Update amount/date/note (Open only) | O M S |
| POST | /promises/{id}/cancel | Cancel with reason | O M S |
| POST | /contact-attempts | Log call/visit outcome | O M S C |
| GET | /pending-collections | Pending approvals | O M; C (own) |
| POST | /pending-collections | Collector records collection (approval mode) | C |
| POST | /pending-collections/{id}/approve | Approve → posts payment | O M |
| POST | /pending-collections/{id}/reject | Reject with reason | O M |
| GET | /cash-handovers | List | O M; C (own) |
| POST | /cash-handovers | Collector submits hand-over | C (S) |
| POST | /cash-handovers/{id}/confirm | Confirm amount → variance | O M |

### 11.7 Messaging, templates, reminders, wallet
| Method | Route | Purpose | Roles |
|---|---|---|---|
| GET | /message-templates | List (global + tenant), filter by key/channel/language | O M S |
| POST | /message-templates | Create tenant template (SMS); WhatsApp requests submission | O M |
| PUT | /message-templates/{id} | Update | O M |
| DELETE | /message-templates/{id} | Deactivate | O M |
| POST | /message-templates/preview | Render with sample/real party → text, segments, cost | O M S |
| POST | /messages | Send single message {partyId, channel, templateId or body(SMS only), variables?} | O M S C |
| POST | /messages/bulk/preview | {filter, templateId, channel} → count, samples, cost | O M |
| POST | /messages/bulk | Create & start batch | O M |
| GET | /messages | Message log (status, channel, date, party, trigger) | O M S |
| GET | /messages/{id} | Detail incl. provider status | O M S |
| POST | /messages/{id}/retry | Retry failed | O M |
| GET | /message-batches · GET /message-batches/{id} | Batch progress | O M |
| POST | /message-batches/{id}/cancel | Cancel remaining | O M |
| GET | /reminder-rules | List rules | O M |
| PUT | /reminder-rules/{id} | Update/enable/disable | O M |
| POST | /reminder-rules | Create custom rule (P1) | O M |
| GET | /reminder-rules/simulate?date= | Who would be reminded on date (dry run) | O M |
| GET | /wallet | Balance, reserved, threshold | O M |
| GET | /wallet/transactions | Wallet history | O |
| PUT | /wallet/threshold | Low-balance threshold | O |
| POST | /wallet/topups | (P2) start online top-up | O |
| GET | /channel-rates | Current prices per channel | O M |

### 11.8 Statements (public & internal)
| Method | Route | Purpose | Roles |
|---|---|---|---|
| POST | /customers/{id}/statement-links | Create/refresh link | O M S C |
| DELETE | /customers/{id}/statement-links | Revoke all links | O M |
| GET | /customers/{id}/statement.pdf?from=&to= | Statement PDF | O M S C V |
| GET | /public/statements/{token} | Public statement data | Pub (rate-limited) |
| GET | /public/statements/{token}/pdf | Public PDF | Pub |
| POST | /public/statements/{token}/opt-out | Customer opts out | Pub |
| POST | /public/statements/{token}/pay (P2) | Create payment intent | Pub |

### 11.9 Dashboard & reports
| Method | Route | Purpose | Roles |
|---|---|---|---|
| GET | /dashboard/summary | Receivable, payable, overdue, collected today/month, PTP today, wallet | O M S V |
| GET | /dashboard/aging | Tenant aging buckets | O M S V |
| GET | /dashboard/trends?months=6 | Outstanding & collections trend | O M V |
| GET | /reports/dues-by-customer | Dues list (filters, export) | O M S V |
| GET | /reports/aging | Aging by customer/group/collector | O M V |
| GET | /reports/collections | By date/method/collector/user | O M V; C (own) |
| GET | /reports/payables | Supplier payables & due dates | O M V |
| GET | /reports/promises | PTP kept/broken rates | O M V |
| GET | /reports/message-usage | Messages & cost by channel/period | O M |
| GET | /reports/reminder-effectiveness | Collected within N days after reminder | O M |
| GET | /reports/daily-summary?date= | Day book summary | O M V |
| GET | /reports/{report}/export?format=xlsx (or pdf) | Export (async for large → ExportJob) | O M (V configurable) |

### 11.10 Import / export / files
| Method | Route | Purpose | Roles |
|---|---|---|---|
| GET | /imports/templates/{type} | Download Excel template | O M |
| POST | /imports | Upload & validate (returns job id) | O M |
| GET | /imports/{id} | Status, validation report | O M |
| POST | /imports/{id}/commit | Commit valid rows | O M |
| POST | /exports | Full tenant export (xlsx/csv zip) | O |
| GET | /exports/{id} | Status & download URL | O |
| POST | /files/upload-url | Pre-signed upload URL (attachments) | O M S C |

### 11.11 Sync (mobile)
| Method | Route | Purpose | Roles |
|---|---|---|---|
| GET | /sync/bootstrap | Initial dataset (scoped) + cursor | O M S C V |
| GET | /sync/pull?cursor=&limit= | Changes since cursor (+ tombstones) | O M S C V |
| POST | /sync/push | Batch of ops with idempotency keys → per-op results | O M S C |

### 11.12 Notifications & audit
| Method | Route | Purpose | Roles |
|---|---|---|---|
| GET | /notifications | In-app notifications | Any |
| POST | /notifications/{id}/read · /read-all | Mark read | Any |
| GET | /audit-logs | Filter by user/entity/action/date | O M |
| GET | /subscription | Current plan, usage vs limits, invoices | O |
| GET | /subscription/invoices/{id}.pdf | Invoice PDF | O |

### 11.13 Webhooks (inbound)
| Method | Route | Purpose |
|---|---|---|
| GET | /webhooks/whatsapp | Meta verification challenge |
| POST | /webhooks/whatsapp | Status updates & inbound messages (HMAC verified) |
| POST | /webhooks/sms/{provider}/dlr | SMS delivery reports |
| POST | /webhooks/sms/{provider}/inbound | Inbound SMS (STOP) |
| POST | /webhooks/payments/{provider} | (P2) payment callbacks |

### 11.14 Platform admin (`/admin/*`, SA/SP)
| Method | Route | Purpose | Roles |
|---|---|---|---|
| GET | /admin/tenants | List/search tenants, status, plan, usage, health | SA SP |
| GET | /admin/tenants/{id} | Tenant detail, members, wallet, messages stats | SA SP |
| POST | /admin/tenants | Create tenant for a client (assisted onboarding) | SA SP |
| PUT | /admin/tenants/{id}/status | Activate/suspend/cancel | SA |
| PUT | /admin/tenants/{id}/subscription | Change plan/dates/trial | SA |
| POST | /admin/tenants/{id}/invoices | Create subscription invoice | SA |
| POST | /admin/invoices/{id}/mark-paid | Record manual payment | SA |
| POST | /admin/tenants/{id}/wallet/topup | Add message credit | SA SP |
| POST | /admin/tenants/{id}/impersonate | {reason} → short-lived token | SA SP |
| GET/POST/PUT | /admin/plans | Plans CRUD | SA |
| GET/PUT | /admin/channel-rates | Message pricing | SA |
| GET/PUT | /admin/gateways | Gateway configs, primary/fallback | SA |
| GET/POST/PUT | /admin/global-templates | Global templates, WhatsApp submission | SA |
| GET | /admin/messages | Cross-tenant message monitor | SA SP |
| GET | /admin/health | System health (queues, failures, integrity alerts) | SA SP |
| GET | /admin/audit | Platform audit (impersonations, admin actions) | SA |
| GET/PUT | /admin/holidays | Global holiday calendar | SA |
| GET | /admin/metrics | MRR, active tenants, messages, DSO aggregates | SA |

### 11.15 Example payloads
**POST /ledger/payments-received** (headers: `Idempotency-Key: 0193...`)
```json
{ "customerId": "0193a1c2-...", "amount": "3500.00", "method": "Bkash", "referenceNo": "BK8X2…",
  "entryDate": "2026-11-23", "notify": true }
```
Response `201`:
```json
{ "entryId": "0193a1c3-...", "documentNo": "RCPT-000124", "balanceAfter": "12500.00",
  "allocations": [ { "dueItemId": "…", "documentNo": "DUE-000098", "amount": "3000.00", "dueItemStatus": "Paid" },
                   { "dueItemId": "…", "documentNo": "DUE-000102", "amount": "500.00", "dueItemStatus": "PartiallyPaid" } ],
  "unallocated": "0.00", "promiseUpdated": { "id": "…", "status": "Kept" },
  "notification": { "messageId": "…", "channel": "WhatsApp", "status": "Queued" } }
```

---

## 12. Non-Functional Requirements

| Category | Requirement (MVP target) |
|---|---|
| Performance | API p95 < 300 ms for reads, < 500 ms for ledger writes at 50 RPS; dashboard < 1.5 s; customer list (5,000 parties) search < 400 ms; mobile cold start < 3 s on mid-range Android |
| Scalability | Stateless API (horizontal scale), Hangfire workers scalable separately; supports 1,000 tenants / 50M entries on one SQL Server (vertical scale) before sharding/dedicated DBs |
| Availability | 99.5% monthly (MVP), 99.9% (Phase 3); planned maintenance in low-traffic window (02:00–05:00 Asia/Dhaka) |
| Reliability | Zero lost ledger entries (transactions, idempotency); message dispatch at-least-once with idempotent provider calls; integrity job daily |
| Data durability | RPO ≤ 15 min, RTO ≤ 4 h; encrypted backups off-site |
| Security | OWASP ASVS L2; tenant isolation tests on every endpoint; encryption in transit and at rest; secrets in vault; pen-test before public launch |
| Privacy | Minimal PII; masked phone in logs; tenant data export & deletion on request; privacy policy & DPA |
| Usability | Bangla & English complete; core actions ≤ 3 taps; works on 5" screens; accessible contrast (WCAG AA); large numeric inputs |
| Offline | Mobile: view assigned customers & record entries offline for ≥ 7 days; sync conflicts surfaced |
| Low bandwidth | Mobile payloads gzip/brotli; delta sync; images compressed < 300 KB |
| Compatibility | Android 8+ (API 26+), iOS 15+ (Phase 2), latest 2 versions of Chrome/Edge/Firefox/Safari |
| Observability | Structured logs, traces, metrics, alerts (see §9.9) |
| Maintainability | Clean Architecture enforced by architecture tests; ≥ 80% unit coverage in Domain/Application; ADRs for key decisions |
| Localization | Asia/Dhaka default; Bangla numerals & lakh/crore grouping; bn/en templates |
| Compliance | BTRC rules for SMS masking/content; Meta WhatsApp Business policies (opt-in, template categories); Bangladesh Bank rules if handling payments (avoid holding funds); VAT on subscription invoices as applicable |
| Auditability | Every state change audited; ledger immutable |

---

## 13. Subscription, Billing & Pricing Model

### 13.1 Strategy
Premium, high-touch, niche: **charge for outcome and service, not for basic features.** Price above mass-market apps (Amar Hisab plans are ৳189–৳989/month billed yearly; TallyKhata Standard is free), justified by automated collections, WhatsApp API, field collection and human onboarding. Messages are **pass-through credits** with a margin.

### 13.2 Suggested plans (validate with first 10 clients)
| Plan | Price (BDT) | For | Includes |
|---|---|---|---|
| **Starter** | ৳799/month or ৳7,990/year | Single shop, owner + 1 staff | 2 users, 500 active customers, auto reminders, statement links, reports, mobile + web, ৳100 message credit/month |
| **Business** (recommended) | ৳1,999/month or ৳19,990/year | Wholesalers/distributors | 6 users incl. collectors, 3,000 customers, collector app & approvals, cash hand-over, owner digest, bulk campaigns, ৳300 credit/month, priority WhatsApp support |
| **Premium (Managed)** | from ৳4,999/month | Larger distributors, multi-branch | 15+ users, unlimited customers, multi-branch (P2), own WhatsApp number & SMS masking setup, named account manager, monthly collections review call, custom templates/reports, ৳700 credit/month |
| **Enterprise** | Custom | Chains/groups | Dedicated DB, API access, SLA, custom integrations |

- **Onboarding / setup fee (one-time):** Starter ৳0 (self-serve), Business ৳3,000, Premium ৳10,000 — includes data migration from paper/Excel, template setup, staff training (on-site in Dhaka or video). Can be waived for annual plans or pilot clients.
- **Trial:** 14 days, full features; pilot clients: 60 days free in exchange for feedback & a case study.
- **Message credits (pass-through + margin):** price per SMS segment and per WhatsApp utility message set in `ChannelRates` after gateway quotes (BD SMS gateways and Meta's Bangladesh rate card must be checked at vendor selection — do not hard-code). Target margin 20–40%. Credit packs: ৳500, ৳1,000, ৳5,000 (bonus 5–10%).
- **Masking SMS sender ID setup:** cost pass-through (competitor Amar Hisab charges a ৳1,000 SMS setup fee).
- **Guarantee:** if overdue doesn't drop 20% in 60 days for an active Business/Premium client following the playbook, next month free.
- **No paywall surprises:** limits are users/customers/messages; core features and exports never locked.

### 13.3 Billing mechanics
- MVP: invoices generated by admin; tenant pays via bKash/Nagad merchant or bank transfer; admin marks paid; subscription extended.
- Phase 2: online checkout (SSLCommerz/bKash), auto-renew (bKash tokenized agreement), automatic receipts, VAT invoice.
- Dunning: reminders 7/3/1 days before; PastDue 7-day grace; Suspended = read-only + export; data retained 90 days after cancel.

### 13.4 Unit economics (illustrative, to validate)
At 100 Business-plan tenants: MRR ≈ ৳2,00,000 + message margin; infra (2–3 VMs + managed SQL + storage) ≈ ৳25,000–৳50,000/month; support: 1 agent per ~80–120 premium tenants. Gross margin target ≥ 70%.

---

## 14. Segment-wise Implementation Plan (for AI coding agents)

### 14.1 How to use this plan with agents
- Work **one segment at a time**, in order. Each segment = a focused PR (or a small set) that compiles, passes tests and meets its acceptance criteria (AC).
- Give the agent: this document (relevant sections), the segment ID, Appendix A (conventions & DoD), and the current repo.
- Each segment lists **Depends on**, **Tasks**, **Deliverables**, **Acceptance Criteria**. Business rules are referenced by ID (BR-x.y) — the agent must implement and test those rules.
- After each segment: human review, merge, deploy to staging, quick manual check.

### 14.2 Phase overview & timeline (solo developer + agents, indicative)
| Phase | Segments | Duration | Outcome |
|---|---|---|---|
| **Phase 0 — Foundation** | S0.1–S0.6 | Weeks 1–2 | Repo, solution skeleton, CI, DB, auth, tenancy, web & mobile shells |
| **Phase 1 — MVP Core** | S1.1–S1.10 | Weeks 3–8 | Parties, ledger, allocation, dashboard, reports, statements, messaging, reminders, admin |
| **Phase 1b — MVP Mobile & Field** | S1.11–S1.15 | Weeks 7–11 | Flutter app (online first, then offline sync), collectors, hand-over |
| **Phase 1c — Hardening & Pilot** | S1.16–S1.18 | Weeks 11–13 | Security, performance, backups, pilot onboarding (5–10 clients) |
| **Phase 2 — Get paid & grow** | S2.1–S2.10 | Months 4–7 | Payment links, online billing, invoices, recurring charges, multi-branch, own WhatsApp number, iOS |
| **Phase 3 — Scale** | S3.1–S3.6 | Months 8–12 | Public API & webhooks, dedicated DB, integrations, AI assistant, analytics |

### 14.3 Phase 0 — Foundation

**S0.1 — Repository & solution skeleton**
- Depends on: —
- Tasks: create mono-repo layout (§9.2); .NET 10 solution with projects Domain/Application/Infrastructure/Api/(Worker) + test projects; `Directory.Build.props` (nullable enable, warnings as errors, analyzers, `LangVersion latest`), `Directory.Packages.props` (central package management), `.editorconfig`; `global.json` pinning SDK; Next.js app (`web/`) with TypeScript strict, ESLint, Prettier, Tailwind, shadcn/ui; Flutter app (`mobile/`) with flavors (dev/staging/prod), lints (`very_good_analysis` or `flutter_lints`); `docker-compose.yml` with SQL Server 2022, Seq, MinIO, (Redis); README with run instructions; ADR-0001 (architecture), ADR-0002 (multi-tenancy).
- AC: `dotnet build` and `dotnet test` pass; `docker compose up` starts infra; `npm run build` passes; `flutter analyze` and `flutter test` pass; architecture test ensures Domain has no reference to other projects/EF/ASP.NET.

**S0.2 — CI pipeline**
- Depends on: S0.1
- Tasks: GitHub Actions: backend (restore, build, test with Testcontainers SQL Server, coverage report), web (lint, typecheck, unit tests, build), mobile (analyze, test, build APK debug); CodeQL; Dependabot/Renovate; PR template with DoD checklist.
- AC: All workflows green on main; PR shows status checks; failing test blocks merge.

**S0.3 — Cross-cutting backend foundation**
- Depends on: S0.1
- Tasks: `Result<T>`/`Error` types; base `Entity`, `AggregateRoot` (domain events), `ValueObject`; `Money` and `PhoneNumber` (BD normalization per BR-1.2) value objects with tests; Mediator setup + pipeline behaviors (Logging, Validation, Authorization, UnitOfWork/Transaction, Idempotency stub, Performance); global exception handler → ProblemDetails with codes (§11.1); API versioning; OpenAPI + Scalar; Serilog + CorrelationId middleware; health checks; `IClock` (UTC) + `ITenantClock` (Asia/Dhaka local date); rate limiter policies.
- AC: Unit tests for Money rounding (BR-2.3), phone normalization (valid/invalid samples), validation behavior returns 400 ProblemDetails with field errors; `/health/ready` reports DB status; OpenAPI JSON served.

**S0.4 — Persistence & multi-tenancy**
- Depends on: S0.3
- Tasks: `AppDbContext` with schemas, conventions (decimal(18,2), datetime2, nvarchar), interceptors: auditing columns, soft delete, tenant stamping & guard (BR-1.1), `SyncChangeLog` writer, domain event dispatch after commit (outbox table `OutboxMessages` for reliable events); global query filters (tenant + soft delete); `ITenantContext` from claims; `ITenantConnectionResolver` (single connection now); initial migration: Tenants, Branches, Plans, Subscriptions, Users, Memberships, Roles, RolePermissions, OtpCodes, UserSessions, RefreshTokens, AuditLogs, SecurityEvents; seed system roles + permissions + default plans.
- AC: Integration test: entity created under tenant A invisible under tenant B; modifying entity of another tenant throws; soft-deleted rows hidden; audit columns auto-filled; migration applies on clean DB in CI.

**S0.5 — Authentication & authorization**
- Depends on: S0.4
- Tasks: OTP request/verify (hashed codes, limits per §9.4) with `ISmsGateway` fake in dev (logs OTP) ; signup, login, refresh rotation with reuse detection, logout, password reset/change, switch-tenant, `/me`, sessions list/revoke; JWT issuing (claims §9.4); permission constants (`Permissions.*`) and `[HasPermission]` policy provider; Authorization pipeline behavior; create-tenant command (creator = Owner, default branch, trial subscription, wallet with trial credit, default reminder rules & templates seeded); members & invitations endpoints.
- AC: Tests cover: OTP expiry/attempt limits; refresh rotation (old token invalid; reused old token revokes family); permission denied returns 403 ProblemDetails; last-owner rule (BR-1.3); rate limiting on OTP (429); all §11.2–11.3 endpoints in OpenAPI.

**S0.6 — Web & mobile shells with auth**
- Depends on: S0.5
- Tasks: Web: OpenAPI client generation (orval) script; BFF auth route handlers (refresh cookie httpOnly), login/signup/OTP pages, business creation & switcher, app layout (sidebar, topbar, language toggle bn/en), permission-aware navigation, error/toast handling, money/date/phone utils with tests. Mobile: dio client with auth interceptor (refresh on 401, single-flight), secure storage, login/OTP/signup screens, business picker, bottom-nav shell, localization bn/en, theme, app lock (PIN/biometric) toggle.
- AC: E2E (Playwright): sign up with OTP (test mode), create business, see empty dashboard, switch language; mobile widget tests for login flow; tokens never in localStorage (web) — verified by test/code review.

### 14.4 Phase 1 — MVP Core

**S1.1 — Customers & suppliers (backend)**
- Depends on: S0.5
- Tasks: Party aggregate (BR-1.2, BR-4.6), PartyGroups, consents (+ConsentEvents); CRUD/search/filter/sort endpoints (§11.4) with pagination; duplicate check by phone; archive/restore; collector assignment; opening balance on create (creates `OpeningBalance` entry — implement after S1.2 or stub via domain service interface); ETag concurrency.
- AC: Tests: create/update/search (Bangla & English names), phone uniqueness warning, delete blocked when balance ≠ 0, collector sees only assigned (BR-6.1), soft delete/restore ≤30 days; list endpoint p95 < 400 ms with 5,000 parties (perf test seed).

**S1.2 — Ledger core: entries, due items, allocation**
- Depends on: S1.1
- Tasks: LedgerEntry (append-only, BR-4.1), entry types table §7.3, DocumentSequences (BR-3.4), DueItems & Allocations (BR-5.1–5.8), `AllocationService` (FIFO + manual), `BalanceAfter` maintenance incl. back-dated inserts (BR-3.3), Party.CurrentBalance update with concurrency (BR-3.2), credit limit warning (BR-5.10), back-date & period lock rules (BR-2.6/2.7), idempotency (unique key) ; endpoints §11.5 (except PDF/resend); domain events `LedgerEntryPosted`, `PaymentReceived`.
- AC: Domain unit tests (≥ 30 cases) for: FIFO across multiple dues, partial payment, over-payment → advance auto-applied to next due (BR-5.5), reversal of payment reopens dues (BR-5.6), reversal of credit sale with allocations re-allocates, reversal of reversal rejected (BR-4.4), invariant BR-5.8 holds after random sequences (property-based test with FsCheck or randomized loop), back-dated entry recalculates BalanceAfter; integration test: same Idempotency-Key twice → one entry; concurrent payments for same customer → consistent balance (no lost update).

**S1.3 — Corrections, reversals & audit log**
- Depends on: S1.2
- Tasks: reverse & correct commands (BR-4.2–4.5) with permission/window logic; PATCH non-financial fields with audit; audit interceptor writing AuditLogs with before/after JSON (BR-11.1); audit log query endpoint with filters; optional DB safeguard (DENY UPDATE/DELETE on LedgerEntries for app user except allowed columns via trigger).
- AC: Staff can reverse own entry within 30 min, not after (test with fake clock); collector cannot; every reversal has reason; audit log shows before/after for profile edits and entry reversals; attempted UPDATE of Amount via SQL by app user fails (if safeguard enabled).

**S1.4 — Web: customers, suppliers & ledger UI**
- Depends on: S1.1–S1.3, S0.6
- Tasks: customer/supplier list (TanStack Table, server pagination, filters, search debounce), create/edit forms (Zod mirrors backend rules), detail page (balance card, aging mini-chart, ledger with running balance, timeline tabs), quick actions "Give credit", "Receive payment" dialogs with allocation preview, credit-limit warning, reversal/correction dialog with reason, entry detail drawer, attachment upload (pre-signed), Bangla numerals toggle.
- AC: Playwright: create customer → give ৳5,000 credit due in 15 days → receive ৳3,000 → balance ৳2,000 and allocation shown → reverse payment → balance ৳5,000; forms show server validation errors; works at 360px width.

**S1.5 — Collections: overdue, aging, PTP, contact attempts**
- Depends on: S1.2
- Tasks: Aging calculator (BR-5.7) + endpoints; "Collect today" query (priority = PTP today, due today, then overdue sorted by remaining × DPD weight); PTP aggregate (BR-7.1–7.3) + endpoints; PtpEvaluationJob (Hangfire) + evaluation on payment; contact attempts; dispute flag; AgingSnapshotJob.
- AC: Tests: bucket boundaries (DPD 0, 1, 30, 31, 60, 61, 90, 91) in Asia/Dhaka date (fake clock at 23:59 vs 00:01 local); one open PTP per customer (superseding); Kept/PartiallyKept/Broken transitions; web pages for Collect today & Promises (S1.4 patterns) with Playwright test.

**S1.6 — Dashboard & reports**
- Depends on: S1.5
- Tasks: summary, aging, trends endpoints; reports §11.9 (dues by customer, aging, collections, payables, promises, daily summary); Excel export (ClosedXML) & PDF (QuestPDF) with Bangla font embedding (e.g., Noto Sans Bengali / Hind Siliguri) ; async ExportJob for > 5,000 rows; web dashboard (cards, aging chart, top debtors) & report pages with filters and export buttons.
- AC: Report totals equal sum of party balances (test); PDF renders Bangla correctly (snapshot/visual check); export of 10,000 rows completes < 30 s async with notification; dashboard loads < 1.5 s on seeded tenant (1,000 customers, 20,000 entries).

**S1.7 — Statements (PDF & public link)**
- Depends on: S1.2
- Tasks: statement PDF (date range, opening balance, entries, closing balance); StatementLinks (BR-9.1–9.4) create/revoke; public endpoints (rate-limited, no auth); Next.js public page `s/[token]` (SSR, bn/en by customer language, mobile-first, noindex, business branding), opt-out button; view logging; "viewed" event on timeline.
- AC: Invalid/expired/revoked token → friendly 404 page; token stored hashed (DB inspection test); page shows only that customer's data; opt-out updates consent & ConsentEvents; Lighthouse mobile performance ≥ 90 on statement page.

**S1.8 — Messaging infrastructure (SMS, WhatsApp, wallet, templates)**
- Depends on: S1.1
- Tasks: MessageTemplates (global seeds from Appendix B) + render engine (placeholders BR-8.7, Bangla numerals, validation), SMS segment calculator (BR-8.9), `ISmsGateway` with 1 real BD provider adapter + fake; `IWhatsAppClient` (Cloud API template send) + webhook endpoint with signature validation + status mapping; OutboundMessages state machine (BR-8.13); wallet reserve/capture/release (BR-8.11) with concurrency; MessageDispatchJob with retries/backoff; channel router & SMS fallback (BR-8.6); single send, bulk preview & bulk send (BR-8.15), batches; transaction notifications on ledger events (BR-8.14) via domain event handler; message log endpoints; WhatsAppTemplateSyncJob; inbound STOP handling (BR-8.10).
- AC: Unit tests: segment counts (English 160/153, Bangla 70/67 boundaries), template rendering with missing variable → validation error; wallet never negative under concurrent dispatch (integration test); failed send releases reservation; webhook with bad signature → 401; status updates idempotent (duplicate webhook doesn't double-charge); end-to-end in staging: send real SMS & WhatsApp template to test phone and see Delivered status.

**S1.9 — Automated reminders engine**
- Depends on: S1.5, S1.8
- Tasks: ReminderRules (seed defaults BR-8.1) CRUD/enable; ReminderSchedulerJob (BR-8.2–8.5) with tenant timezone, send window, Friday/holiday skip, caps, eligibility (BR-8.3), PTP pause (BR-7.3), idempotency key; simulate endpoint (dry-run); web UI for rules (toggle, offsets, template pick, preview), templates editor with live preview & segment/cost counter; reminder effectiveness report.
- AC: Time-travel tests with fake clock covering: due today at 09:00 → sent at 10:00 not before; Friday 12:30 → deferred to 15:00; holiday → next day; max 1/customer/day even with multiple rules; opted-out customer skipped; open PTP pauses overdue rule; scheduler run twice in same window → no duplicate messages; simulate returns same set as actual run.

**S1.10 — Platform admin (backend + web)**
- Depends on: S0.5, S1.8
- Tasks: admin area routes (§11.14): tenants list/detail, create tenant for client, plan & subscription management, invoices & mark paid, wallet top-up, channel rates, gateway config (encrypted secrets), global templates, holidays, impersonation with reason & banner, system health (Hangfire stats, failed messages, integrity alerts), metrics (MRR, tenants, messages); SubscriptionLifecycleJob (BR-1.5) and plan limit enforcement (§7.14).
- AC: Only SA/SP can access (403 tests); impersonation writes audit with impersonator id, token TTL ≤ 60 min; suspended tenant gets 402 on writes but can read & export; plan limit blocks creating customer #501 on Starter but not payments.

### 14.5 Phase 1b — Mobile & Field

**S1.11 — Mobile online features**
- Depends on: S1.4–S1.9 APIs
- Tasks: Home (dashboard cards, collect today), customer list/search/detail, give credit / receive payment (big keypad, allocation preview), ledger view, PTP add, call/WhatsApp/SMS actions (tel:, wa.me deep links for "share via my WhatsApp"), send template message, statement link share, receipt PDF share/print, notifications (FCM), settings, bn/en.
- AC: Widget/integration tests for credit & payment flows; record payment in ≤ 3 taps from customer detail; works on 5" 720p device; golden tests for key screens in Bangla.

**S1.12 — Offline-first data layer & sync**
- Depends on: S1.11
- Tasks: Backend: `/sync/bootstrap`, `/sync/pull` (SyncChangeLog cursor, scoped by role/collector), `/sync/push` (batched ops, per-op idempotent results, server numbers). Mobile: drift schema mirroring needed tables, outbox, sync engine (on connectivity regain, periodic via workmanager, manual pull-to-refresh), provisional balances, sync status UI & "sync issues" screen, conflict policy (§9.13).
- AC: Test: create 20 entries offline (airplane mode) → reconnect → all posted exactly once, receipt numbers assigned, balances match server; kill app mid-sync → resumes without duplicates; server rejects period-locked entry → appears in Sync issues; pull after server-side reversal updates local ledger.

**S1.13 — Collector role & approvals**
- Depends on: S1.12
- Tasks: collector scoped views; approval mode setting (BR-6.2); PendingCollections endpoints & web approval queue; receipts sent on approval only (BR-6.3); duplicate warning (BR-6.5); collector daily summary.
- AC: With approval ON, collector payment doesn't change balance until approved; rejection notifies collector (push); with approval OFF, posts directly with `CollectedByUserId`; collector cannot see unassigned customers via any endpoint (tests).

**S1.14 — Cash hand-over**
- Depends on: S1.13
- Tasks: hand-over submission (mobile), confirmation (web/mobile manager), variance (BR-6.4), collector cash report.
- AC: Variance computed correctly; non-zero variance requires note; report lists collections not yet handed over.

**S1.15 — Owner daily digest & notifications**
- Depends on: S1.8, S1.5
- Tasks: OwnerDigestJob at tenant digest time (WhatsApp/SMS/push per preference) with: collected today, new dues, PTPs due tomorrow, broken promises, top 5 overdue; in-app notifications center; subscription expiry notices.
- AC: Digest sent once per day per owner (idempotent), content numbers match dashboard; owner can disable.

### 14.6 Phase 1c — Hardening & Pilot

**S1.16 — Import/export & onboarding tools**
- Tasks: Excel templates, ImportJob with validation report, commit modes (§7.13), contacts import (mobile), full tenant export (zip of xlsx/csv), setup checklist API & UI.
- AC: Import 5,000-row file with 20 bad rows → report lists exact rows/errors; committing valid rows creates parties + opening balances with correct totals; export opens in Excel with Bangla text intact (UTF-8 BOM for CSV).

**S1.17 — Security, performance & reliability hardening**
- Tasks: tenant isolation test suite across all endpoints (auto-generated from OpenAPI); rate limits review; security headers (CSP, HSTS); secrets to vault; dependency/container scanning; load test (k6) 50 RPS mixed; query plan review & indexes (§10.4); BalanceIntegrityJob + alerting; backup/restore drill script; Sentry in all apps; privacy policy & terms pages.
- AC: k6 thresholds met (§12); zero cross-tenant leaks; integrity job reports 0 mismatches on seeded data; restore drill documented with timings ≤ RTO; OWASP ZAP baseline scan no high findings.

**S1.18 — Production deployment & pilot launch**
- Tasks: provision prod (§16), domain & TLS, CI/CD to prod with manual approval, monitoring dashboards & alerts, Play Store internal → closed testing release, onboarding 5–10 pilot clients with support runbook, feedback loop (in-app feedback button).
- AC: Pilot clients actively recording; uptime monitored; on-call runbook exists (gateway outage, failed jobs, restore); release notes process.

### 14.7 Phase 2 — Get paid & grow (segments)
| ID | Segment | Key tasks | Acceptance criteria |
|---|---|---|---|
| S2.1 | Payment provider abstraction + bKash | `IPaymentProvider`, PaymentIntents, bKash Tokenized Checkout (sandbox→prod), callback + status query, idempotent posting of PaymentReceived | Sandbox payment creates exactly one entry; replayed callbacks ignored; failed/cancelled payments don't post |
| S2.2 | Nagad & SSLCommerz | Adapters + tenant credential config (encrypted) | Same AC as S2.1 per provider |
| S2.3 | Pay-now on statement & reminders | Pay button, amount (full/partial), template variable `{{pay_link}}` | Customer pays from WhatsApp link end-to-end in staging |
| S2.4 | Online SaaS billing & credit top-up | Checkout for invoices & wallet, auto-renew, VAT invoice PDF | Paid invoice extends subscription automatically |
| S2.5 | Invoices & product catalogue | Invoice with lines/discount → creates CreditSale; print/share | Invoice total = due created; partial payment at invoice time posts payment |
| S2.6 | Recurring charges | Schedules (monthly day, amount, customers/group), preview, generation job, notifications | Generation idempotent per period; skipped for archived customers |
| S2.7 | Multi-branch | Branch scoping in queries/permissions, branch reports, consolidated view | Branch manager sees only own branch; consolidated totals = sum |
| S2.8 | Own WhatsApp number & SMS masking per tenant | Meta Embedded Signup, tenant gateway configs, template management per WABA | Messages show tenant's business name; fallback to platform number configurable |
| S2.9 | Two-way WhatsApp inbox & disputes | Inbound routing to tenant inbox, 24h window replies, dispute workflow | Reply within window sends free-form; outside window enforces template |
| S2.10 | Routes/visits, cheques, risk score, iOS | Route sheets with GPS check-in, cheque lifecycle with bounce reversal, risk score from PTP/DPD history, iOS build | Bounced cheque auto-reverses payment & optional fee; risk score documented & tested |

### 14.8 Phase 3 — Scale (segments)
| ID | Segment | Key tasks | Acceptance criteria |
|---|---|---|---|
| S3.1 | Public API & webhooks | API keys (hashed, scoped), per-key rate limits, outbound webhooks (signed, retries), developer docs | Third-party can create payment via API; webhook signature verifiable |
| S3.2 | Dedicated DB per tenant | TenantCatalog routing, migration tool shared→dedicated, migrations runner across DBs | Tenant moved with zero data loss and < 15 min downtime |
| S3.3 | Integrations | POS/accounting import connectors, scheduled Excel/Google Sheets sync | Imported sales create correct dues |
| S3.4 | AI collections assistant | Prioritization model (DPD, PTP history, response to channels), suggested message drafts (bn), anomaly detection on entries | Assistant suggestions measurable via A/B on collection rate |
| S3.5 | Advanced analytics | DSO, cohort repayment, collector performance, benchmarks | Metrics reconcile with raw data |
| S3.6 | Scale-out & cost optimization | Read replicas for reports, partitioning, archiving, CDN, autoscaling | Supports 5,000 tenants at NFR targets |

### 14.9 Suggested calendar (from kickoff, Monday 7 Dec 2026 as example)
| Week | Focus |
|---|---|
| 1–2 | Phase 0 (S0.1–S0.6) |
| 3–4 | S1.1–S1.3 (parties, ledger, corrections) |
| 5 | S1.4 (web ledger UI), S1.5 (collections) |
| 6 | S1.6 (dashboard/reports), S1.7 (statements) |
| 7–8 | S1.8 (messaging), S1.9 (reminders), start S1.11 (mobile online) |
| 9 | S1.10 (admin), S1.11 continues |
| 10–11 | S1.12–S1.15 (offline sync, collectors, hand-over, digest) |
| 12 | S1.16–S1.17 (import/export, hardening) |
| 13 | S1.18 (prod & pilot launch ≈ early March 2027) |
| Months 4–7 | Phase 2 |
| Months 8–12 | Phase 3 |
Parallel non-code tasks (start week 1): pick SMS gateway & apply for masking sender ID; create Meta Business account, verify business, register WhatsApp number, submit templates (approval takes days); bKash/Nagad merchant applications (Phase 2 lead time); recruit 10 pilot clients; trade licence/company & VAT registration for SaaS billing.

---

## 15. Testing Strategy

| Level | Scope | Tools | Targets |
|---|---|---|---|
| Domain unit | Entities, value objects, AllocationService, aging, PTP evaluation, reminder eligibility, template rendering, SMS segments | xUnit, Shouldly, FsCheck (property-based) | ≥ 90% line coverage in Domain |
| Application unit | Handlers, validators, authorization rules (with in-memory fakes / NSubstitute) | xUnit, NSubstitute | ≥ 80% |
| Integration (API) | Real SQL Server (Testcontainers), WebApplicationFactory, migrations, interceptors, tenant isolation, idempotency, concurrency | Testcontainers, Respawn, Verify | Every endpoint: happy path + auth + validation + cross-tenant |
| Architecture | Layer dependencies, naming, handlers sealed, no EF in Domain | NetArchTest / ArchUnitNET | Runs in CI |
| Contract | OpenAPI diff on PR (breaking change detection); generated clients compile | oasdiff, orval | No unapproved breaking changes |
| Jobs / time | Scheduler, PTP, digest with fake clock & time travel | `TimeProvider` (FakeTimeProvider) | All BR-7/BR-8 rules covered |
| Web unit/component | Utils (money, phone, dates), forms, components | Vitest, Testing Library | Utils 100% |
| Web E2E | Critical journeys (F1–F5, F7 web parts, F8, F9, admin) | Playwright (bn & en) | Run on PR against ephemeral stack |
| Mobile | Unit (use cases), widget, golden (Bangla), integration (flows, offline sync) | flutter_test, integration_test, mocktail | Critical flows covered |
| Performance | API load, report queries, sync bursts | k6, SQL Query Store | NFR §12 |
| Security | SAST, dependency, DAST baseline, manual pen-test before launch | CodeQL, Trivy, OWASP ZAP | No high/critical open |
| UAT | Pilot clients scripted scenarios in Bangla | Checklists | Sign-off per release |

**Test data:** seeders for demo tenants (Bangla names, realistic amounts, 1,000 customers, 20,000 entries); fake SMS/WhatsApp gateways that record messages; test phone numbers whitelisted in staging.

**Golden rules for financial correctness (must have explicit tests):** balance = Σ entries; invariant BR-5.8; idempotent posting; reversal symmetry; no money as float anywhere (lint rule/grep check in CI for `double`/`float` in money contexts).

---

## 16. DevOps, CI/CD & Deployment

### 16.1 Environments
| Env | Purpose | Data |
|---|---|---|
| Local | Developer/agent machines via docker-compose | Seed data |
| CI ephemeral | PR checks, E2E | Seed |
| Staging | Pre-prod, pilot demos, gateway sandboxes/test numbers | Anonymized/demo |
| Production | Clients | Real |

### 16.2 Hosting options (choose by cost & latency to Bangladesh)
- **Option A (cost-effective, recommended for MVP):** Cloud VMs in Singapore/Mumbai region (DigitalOcean, AWS Lightsail/EC2, Azure) running Docker: API + Worker containers behind Nginx/Caddy (or a managed load balancer), **managed SQL Server** (Azure SQL Database / AWS RDS for SQL Server — check licensing cost; SQL Server Express is limited to 10 GB/DB and is OK only for very early pilots), S3-compatible storage, Cloudflare for DNS/CDN/WAF. Next.js on Vercel or as a Node container.
- **Option B (Azure-native):** Azure App Service / Container Apps for API & worker, Azure SQL, Blob Storage, Key Vault, App Insights, Front Door. Simpler ops, higher cost.
- **Local data-residency option (Premium/Enterprise):** BD data centre/cloud (e.g., local providers) if a client requires it — supported by dedicated-DB design.

### 16.3 CI/CD pipeline (GitHub Actions)
1. **On PR:** build, unit + integration tests (Testcontainers), architecture tests, lint/typecheck web, Flutter analyze/test, OpenAPI diff, CodeQL, Trivy; preview deploy of web (optional).
2. **On merge to `main`:** build Docker images (API, Worker, Web) tagged with git SHA → push to registry → run EF migrations bundle against **staging** (`dotnet ef migrations bundle`) → deploy staging → smoke tests (health, login, create entry) → Playwright E2E.
3. **Release to production:** manual approval (GitHub Environments) → backup snapshot → migrations (backward-compatible "expand/contract" pattern only) → rolling/blue-green deploy → smoke tests → automatic rollback on failed health checks.
4. **Mobile:** Fastlane/Codemagic: build signed AAB → Play Console internal track on tag; staged rollout to production (10% → 50% → 100%); minimum supported app version endpoint to force-update on breaking changes.
5. **Secrets:** GitHub OIDC to cloud; no long-lived secrets in repo.

### 16.4 Database migrations policy
- EF Core migrations, reviewed SQL scripts (`dotnet ef migrations script --idempotent`) in PR.
- Never destructive in one step: add column (nullable) → backfill job → enforce constraint in next release → drop old later.
- Migrations run by pipeline with a migration-only DB user.

### 16.5 Operations
- Runbooks: gateway outage (switch primary/fallback in admin), WhatsApp template rejected, Hangfire backlog, DB restore, tenant data export/deletion request, suspicious login.
- On-call: owner + 1 developer (pilot); status page (e.g., Better Stack/Uptime Kuma).
- Cost monitoring with monthly budget alerts.

---

## 17. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Low willingness to pay vs free apps | Med | High | Niche ICP with large outstanding dues; outcome guarantee; ROI report ("collected ৳X after reminders"); pilot case studies |
| 2 | WhatsApp template rejection / policy change / pricing changes | Med | High | Utility-category templates with neutral wording; SMS fallback; configurable rates; follow Meta policy; opt-in capture |
| 3 | SMS masking approval delays (BTRC/gateway) | Med | Med | Start applications week 1; non-masking fallback; two gateways |
| 4 | Customers perceive reminders as harassment | Med | High | Polite templates, caps, quiet hours, Friday/holiday skip, opt-out, PTP pause, dispute pause |
| 5 | Ledger bugs damage trust | Low | Critical | Append-only design, property-based tests, integrity job, audit trail, reversal-only corrections |
| 6 | Tenant data leak | Low | Critical | Global filters + interceptor guard + isolation test suite + RLS (P2) + code review checklist |
| 7 | Offline sync duplicates/conflicts | Med | High | UUIDs, idempotency keys, append-only ledger, server-authoritative balances, sync issue UI |
| 8 | Agent-generated code quality drift | Med | Med | Segment-sized tasks, DoD, architecture tests, mandatory human review, CI gates |
| 9 | Scope creep toward "everything app" | High | Med | Out-of-scope list (§5.4); integrate rather than build; roadmap review monthly |
| 10 | Licensing costs (SQL Server, commercial .NET libs like MediatR/QuestPDF/AutoMapper/FluentAssertions) | Med | Med | Check licenses at S0.1; choose free alternatives; budget managed SQL; abstract dependencies |
| 11 | Support load from high-touch model | Med | Med | Self-serve onboarding checklist, admin tools, templates library, limit premium seats per support agent |
| 12 | Payment integration complexity / merchant onboarding (Phase 2) | Med | Med | Start merchant applications early; tenant-owned merchant accounts; sandbox-first |
| 13 | Single-founder bus factor / ops burnout | Med | High | Managed services, runbooks, automated backups/alerts, documentation-first |
| 14 | Regulatory (data protection, payments) | Low/Med | High | Legal review before scale; don't hold customer funds; privacy policy & DPA |

---

## 18. KPIs & Success Metrics

**Customer outcome (the north star):** *Overdue amount reduction* and *DSO reduction* per tenant within 60/90 days.

| Area | KPI | Target (pilot / Year 1) |
|---|---|---|
| Outcome | Overdue (≥ 30 DPD) amount change after 60 days | −20% |
| Outcome | DSO (days sales outstanding) change | −15% |
| Outcome | Collected within 7 days of a reminder (% of reminded amount) | ≥ 25% |
| Outcome | PTP kept rate | ≥ 60% |
| Engagement | Weekly active tenants / paying tenants | ≥ 85% |
| Engagement | Entries per active tenant per week | ≥ 50 |
| Engagement | % tenants with auto-reminders on | ≥ 80% |
| Engagement | Statement link open rate | ≥ 40% |
| Growth | Paying tenants | 20 by month 4, 100 by month 12 |
| Growth | Trial→paid conversion (assisted) | ≥ 50% |
| Revenue | MRR, ARPA | ARPA ≥ ৳1,800 |
| Retention | Monthly logo churn | ≤ 3% |
| Quality | Message delivery rate | SMS ≥ 95%, WhatsApp ≥ 90% |
| Quality | Uptime | ≥ 99.5% |
| Quality | Integrity mismatches | 0 |
| Support | First response time | < 1 h (business hours), Premium < 15 min |
| Support | NPS | ≥ 50 |

---

## 19. Appendix A — Agent Instructions, Coding Conventions & Definition of Done

### A.1 Instructions to every coding agent
1. Read: this document's relevant sections, the segment card, existing code in the module, and ADRs. Do **not** invent business rules — if something is ambiguous, implement the documented default and add a `// TODO(question): ...` plus a note in the PR description.
2. Keep changes within the segment scope. No unrelated refactors.
3. Reference business rules by ID in tests (`[Trait("Rule","BR-5.6")]`) and in code comments only where non-obvious.
4. Every public API change updates OpenAPI and regenerates web/mobile clients.
5. Write tests first for domain rules (TDD encouraged for ledger/allocation/reminders).
6. Never use `float`/`double` for money; never store local time without zone; never hard-delete ledger data; never bypass tenant filters (`IgnoreQueryFilters()` only in platform-admin or jobs, with a comment and test).
7. Never commit secrets; use user-secrets/env vars; add new settings to `appsettings.json` with safe defaults and document them.
8. Produce a PR description: what/why, rules implemented, how to test, screenshots (UI), migration notes.

### A.2 Backend conventions (.NET)
- Feature folders per use case: `Application/Ledger/Commands/RecordPayment/{RecordPaymentCommand, RecordPaymentHandler, RecordPaymentValidator, RecordPaymentResponse}.cs`.
- Commands return `Result<T>`; handlers don't throw for expected business failures (use `Error` with code, mapped to ProblemDetails); exceptions only for unexpected errors.
- Naming: PascalCase types/methods, `_camelCase` private fields, async methods end with `Async`, `CancellationToken` passed everywhere.
- Domain entities: private setters, factory methods (`LedgerEntry.CreateCreditSale(...)`), invariants enforced in constructors/methods, no public parameterless constructors except for EF (private).
- Controllers thin: map request → command → `ISender.Send` → map result. Route attributes per §11. Use `[HasPermission]`.
- EF: configurations via `IEntityTypeConfiguration<T>`; no lazy loading; `AsNoTracking()` for queries; projections to DTOs in queries (`Select`), not entity returns; pagination helper.
- Transactions: one command = one transaction (UnitOfWork behavior); domain events dispatched after commit via outbox.
- Logging: structured (`_logger.LogInformation("Payment {EntryId} posted for {PartyId}", ...)`), no PII values beyond IDs.
- Dates: use `TimeProvider`/`IClock`; `DateOnly` for business dates; `DateTime` UTC (`Kind=Utc`) for timestamps.
- Options pattern with validation (`ValidateOnStart`).

### A.3 Web conventions (Next.js)
- TypeScript strict, no `any`; server components by default, client components only for interactivity.
- Data fetching via generated client + TanStack Query hooks per feature; query keys centralized.
- Forms: React Hook Form + Zod schemas mirroring backend validators; show ProblemDetails `errors` per field.
- Money: `lib/money.ts` (decimal library), formatting `formatBDT(value, {locale:'bn'|'en'})`; never `Number()` math on money.
- i18n: all user-visible strings in `messages/bn.json`/`en.json`; no hard-coded text.
- Permissions: `can(permission)` helper gates UI, but backend is the authority.
- Accessibility: labels, focus states, keyboard navigation in tables/dialogs.

### A.4 Mobile conventions (Flutter)
- Feature-first Clean Architecture; Riverpod providers per feature; immutable models with freezed; no business logic in widgets.
- Repository pattern: repositories read from local DB (drift) and enqueue writes to outbox; sync engine talks to API.
- Money with `decimal` package; dates with `timezone` package (Asia/Dhaka).
- All strings in ARB (bn/en); golden tests for Bangla rendering.
- Errors: map API ProblemDetails to typed failures; user-friendly Bangla messages.

### A.5 Git & PR workflow
- Trunk-based: short-lived branches `feat/S1.2-ledger-core`, `fix/...`; Conventional Commits (`feat(ledger): add FIFO allocation`).
- PR size target < 600 changed lines (excluding generated code/migrations).
- Required checks green + 1 human review for merge.

### A.6 Definition of Done (per segment)
- [ ] All tasks implemented; acceptance criteria demonstrably met (tests or recorded manual check).
- [ ] Business rules referenced by ID have unit tests; edge cases covered.
- [ ] Integration tests for new endpoints incl. auth (401/403), validation (400), tenant isolation (404 cross-tenant), idempotency where applicable.
- [ ] No warnings; analyzers/lints clean; architecture tests pass; coverage thresholds met.
- [ ] OpenAPI updated; clients regenerated; breaking changes approved.
- [ ] DB migration added, reviewed, idempotent script generated; seed data updated if needed.
- [ ] Logs/metrics added for new jobs/integrations; no sensitive data logged.
- [ ] UI strings in bn & en; responsive (360px+) ; basic accessibility.
- [ ] Docs updated (README, ADR if decision made, this plan if rules changed).
- [ ] Deployed to staging and smoke-tested.

---

## 20. Appendix B — Message Template Library (seed, Bangla/English)

> SMS versions should stay within 2 Unicode segments (≤ 134 chars) for Bangla where possible. WhatsApp versions must be submitted to Meta as **Utility** templates; variables shown as `{{n}}` there and mapped from named placeholders.

| Key | Language | Text |
|---|---|---|
| `CreditSaleNotice` | bn | {{business_name}}: আপনার নামে ৳{{amount}} বাকি যোগ হয়েছে। মোট বাকি ৳{{balance}}। পরিশোধের তারিখ {{due_date}}। বিস্তারিত: {{statement_link}} |
| `CreditSaleNotice` | en | {{business_name}}: ৳{{amount}} added to your account. Total due ৳{{balance}}, due by {{due_date}}. Details: {{statement_link}} |
| `Receipt` | bn | {{business_name}}: ৳{{amount}} জমা পেয়েছি, ধন্যবাদ! রসিদ {{receipt_no}}। বর্তমান বাকি ৳{{balance}}। |
| `Receipt` | en | {{business_name}}: Received ৳{{amount}}, thank you! Receipt {{receipt_no}}. Current balance ৳{{balance}}. |
| `ReminderDue` | bn | প্রিয় {{customer_name}}, {{business_name}}-এ আপনার ৳{{overdue_amount}} পরিশোধের তারিখ আজ। মোট বাকি ৳{{balance}}। হিসাব দেখুন: {{statement_link}} |
| `ReminderDue` | en | Dear {{customer_name}}, ৳{{overdue_amount}} is due today at {{business_name}}. Total balance ৳{{balance}}. View: {{statement_link}} |
| `ReminderOverdue` | bn | প্রিয় {{customer_name}}, {{business_name}}-এ আপনার ৳{{overdue_amount}} বকেয়া রয়েছে। সুবিধামতো দ্রুত পরিশোধের অনুরোধ রইলো। হিসাব: {{statement_link}} যোগাযোগ: {{business_phone}} |
| `ReminderOverdue` | en | Dear {{customer_name}}, ৳{{overdue_amount}} is overdue at {{business_name}}. Kindly pay at your earliest convenience. Statement: {{statement_link}} Call: {{business_phone}} |
| `ReminderEscalation` | bn | {{customer_name}}, আপনার ৳{{overdue_amount}} বকেয়া ৬০ দিনের বেশি সময় ধরে অপরিশোধিত। অনুগ্রহ করে {{business_phone}} নম্বরে যোগাযোগ করে পরিশোধের তারিখ জানান। — {{business_name}} |
| `ReminderEscalation` | en | {{customer_name}}, ৳{{overdue_amount}} has been overdue for over 60 days. Please call {{business_phone}} to arrange payment. — {{business_name}} |
| `PtpReminder` | bn | প্রিয় {{customer_name}}, আজ ({{promise_date}}) ৳{{promise_amount}} পরিশোধের কথা ছিল। ধন্যবাদ — {{business_name}} |
| `PtpReminder` | en | Dear {{customer_name}}, as agreed, ৳{{promise_amount}} is to be paid today ({{promise_date}}). Thank you — {{business_name}} |
| `MonthlyStatement` | bn | {{business_name}}: {{customer_name}}, এই মাসের শুরুতে আপনার মোট বাকি ৳{{balance}}। বিস্তারিত হিসাব: {{statement_link}} |
| `MonthlyStatement` | en | {{business_name}}: {{customer_name}}, your balance as of this month is ৳{{balance}}. Full statement: {{statement_link}} |
| `OwnerDigest` | bn | আজকের হিসাব ({{date}}): আদায় ৳{{collected}}, নতুন বাকি ৳{{new_dues}}, মোট পাওনা ৳{{receivable}}, আগামীকাল প্রতিশ্রুতি {{ptp_tomorrow}}টি, ভাঙা প্রতিশ্রুতি {{ptp_broken}}টি। |
| `Otp` | bn/en | Aadai: আপনার কোড {{code}}। ৫ মিনিট কার্যকর। কাউকে জানাবেন না। / Your Aadai code is {{code}}. Valid 5 min. Do not share. |

Opt-out footer (SMS, bulk/automated): bn "বন্ধ করতে STOP লিখুন" / en "Reply STOP to opt out" (only where the gateway supports inbound; otherwise statement-page opt-out).

---

## 21. Appendix C — Research Sources (accessed 23 Nov 2026)
- TallyKhata website — features (digital khata, TallyPay wallet, Bangla QR from 34 banks/MFS, business loans; customer & supplier lists; transaction & tagada messages via SMS/Imo/WhatsApp/Messenger; 10 lakh+ monthly users): https://www.tallykhata.com/ and https://www.tallykhata.com/en/khata-features/
- TallyKhata Google Play listing (10M+ downloads, ~46.7K reviews; Standard free vs Gold features incl. unlimited entries, 5 businesses, stock, group tagada, report download, 25 free messages/month; 30-day Gold trial; bKash auto-renew; user reviews Aug–Oct 2026): https://play.google.com/store/apps/details?id=com.progoti.tallykhata ; AppBrain https://www.appbrain.com/ (TallyKhata page) ; AppRecs review (Dec 2025 complaint on paid report download)
- Amar Hisab website (features: income/expense, invoices with partial payment & dues, customer groups & statements, accounts incl. bKash, loans payable/receivable, budgets, products, SMS incl. scheduled due reminders, staff salary & attendance, 20+ reports, users & roles with delete log; plans ৳189/৳489/৳989 per month billed yearly, Enterprise custom, ৳1,000 SMS setup charge, 7-day trial): https://amarhisab.com/
- Hishabee Google Play listing (1M+ downloads, 4.5★, 14.6K reviews; features) https://play.google.com/store/apps/details?id=com.hishabee.business ; Hishabee blog 2026 guide https://www.hishabee.io/blog/hishabee-business-manager-comprehensive-guide-2026 ; Deshiz POS comparison (22 Nov 2026) https://deshiz.com/pos-software-bangladesh/ ; Bisnesy comparison (Nov 2026) https://bisnesy.com/blog/bisnesy-vs-other-pos-software-bangladesh
- Khatabook (reference): https://khatabook.com/en/ ; features blog https://khatabook.com/blog/khatabook-app-features/ ; help centre (reminder coins) https://khatabook.com/help/
- Meta WhatsApp Business Platform pricing (per-message, by market & category): https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- .NET support policy (.NET 8 & 9 end of support 10 Nov 2026; .NET 10 LTS to Nov 2028): https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core

*Note:* Several unrelated Google Play apps also use the name "Amar Hisab" (different developers, personal finance/ERP); the competitor analysed here is the web product at amarhisab.com.

---
*End of document.*
