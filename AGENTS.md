<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Aadai web client

This repository is the Next.js client for Aadai (আদায়). The ASP.NET API is a separate repo. Screens must keep working on the mock until that API is ready.

- Screens, hooks, and components call `getApi()` from `src/lib/api`. They do not call `fetch` for product data. The switch is `NEXT_PUBLIC_API_MODE=mock|real`.
- Money is integer paisa inside the mock engine and a decimal string on the service boundary. Do not use binary floats for money.
- User-visible copy lives in `messages/bn.json` and `messages/en.json`. Bangla is the default locale. Bangla URLs have no prefix.
- New Next.js code should follow `node_modules/next/dist/docs/` before older App Router habits. Route protection lives in `src/proxy.ts`.

## Checklist

Every future agent must tick the checklist items it fully completes in the same PR. Edit `docs/checklist.md` and change `- [ ]` to `- [x]` only for items whose acceptance criteria are fully met. Web items that work on the mock client count for the UI part; write `*(mock data, API wiring pending)*` next to those ticks. Leave an item unchecked when mobile, Lighthouse, a real backend, or any other part of its acceptance criteria is still missing.
