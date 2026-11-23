# আদায় — web client

Bangla-first web app for a shop's customer dues (বাকি), payments, collections, and reminders. It runs entirely on mock data until the ASP.NET API is connected.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Bangla is the default. English is at `/en`.

Demo password for every account: `aadai123`. Demo OTP: `123456`.

| Role | Phone |
| --- | --- |
| Owner (হাজী আব্দুর রহিম) | 01711345678 |
| Manager | 01812456789 |
| Collector | 01913567890 |

The owner also belongs to a second shop, রহিম ইলেকট্রনিক্স, and can switch from the sidebar.

## Scripts

- `npm run dev` — local app
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — Vitest
- `npm run test:e2e` — Playwright (the ৳5,000 / ৳3,000 / ৳2,000 ledger flow)
- `npm run build` — production build

## Environment

Copy `.env.example`.

| Variable | Meaning |
| --- | --- |
| `NEXT_PUBLIC_API_MODE` | `mock` (default) or `real` |
| `NEXT_PUBLIC_API_BASE_URL` | API origin, default `https://api.aadai.app/api/v1` |

`getApi()` is the only switch. Screens never call `fetch` for shop data. In `real` mode the same TypeScript client posts to the REST paths in the plan. Login stores the access token in memory. The refresh token is an httpOnly cookie set by `/api/auth/session` and exchanged at `/api/auth/refresh`. Mock mode keeps a copy of the refresh token in `localStorage` so a demo survives reload; that copy is not used in real mode.

## Folder structure

- `src/app/[locale]` — routes (login, dashboard, customers, suppliers, collections, reminders, reports, settings, public statement `/s/[token]`)
- `src/features` — screens
- `src/lib/api` — DTOs, `ApiClient`, mock engine, real HTTP client
- `src/proxy.ts` — locale routing and the session cookie gate
- `messages` — Bangla and English
- `docs/plan.md`, `docs/checklist.md` — product plan and the feature checklist

## Stack

Next.js App Router, TypeScript strict, Tailwind CSS, TanStack Query, TanStack Table, React Hook Form, Zod, next-intl, Recharts, Lucide, Vitest, Playwright. Icons are Lucide rather than Material Symbols. Amounts are integer paisa in the mock, not `decimal.js`.
