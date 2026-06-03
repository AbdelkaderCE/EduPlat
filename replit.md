# PDF Watermarking & Tracking System

A secure, institutional-grade system for distributing personalized PDF documents. Every download is stamped with the recipient's username and a unique serial number — making documents traceable back to their source.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/pdf-watermark run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Supabase Postgres connection string
- Required env: `SESSION_SECRET` — session signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + connect-pg-simple
- DB: PostgreSQL (Supabase) + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- PDF: `pdf-lib` (on-the-fly watermarking)
- File uploads: `multer` (disk storage)
- Auth: bcryptjs passwords + server-side sessions
- Frontend: React + Vite + Tailwind + shadcn/ui + wouter
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/watermark.ts` — DB tables: wm_users, wm_pdfs, wm_download_history
- `artifacts/api-server/src/routes/auth.ts` — login, logout, /me
- `artifacts/api-server/src/routes/pdfs.ts` — list PDFs, download with watermark
- `artifacts/api-server/src/routes/admin.ts` — upload PDFs, search by serial number
- `artifacts/api-server/src/lib/watermark.ts` — pdf-lib watermarking logic + serial number generation
- `artifacts/api-server/src/lib/session.ts` — express-session with PostgreSQL store
- `artifacts/pdf-watermark/src/` — React frontend (login, user dashboard, admin dashboard)
- `/home/runner/workspace/data/pdfs/` — uploaded PDF files on disk

## Architecture decisions

- Session store uses `connect-pg-simple` with the Supabase PostgreSQL pool. The `wm_sessions` table is created manually via SQL (not `createTableIfMissing: true`) because esbuild can't bundle the `table.sql` file that `connect-pg-simple` needs.
- PDF watermarking is done entirely in-memory on every download request using `pdf-lib` — the original file is never served directly.
- Serial numbers follow format `SN-2026-XXXX` and are assigned lazily on first download.
- All watermarking tables use a `wm_` prefix to avoid conflicts with existing Supabase tables.
- CORS is configured with `credentials: true` so session cookies work across the Replit proxy.

## Seeded accounts

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | admin |
| alice    | user123   | user  |
| bob      | user123   | user  |

## Product

- **User dashboard** — lists available PDFs; each download gets personalized watermark (username + serial number stamped diagonally on every page + in PDF metadata). Serial number is displayed prominently.
- **Admin dashboard** — upload new PDFs to the system; search any serial number to reveal which user it was assigned to and their full download history.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after any schema change before typechecking artifacts — the lib declarations need to be rebuilt first.
- After schema changes, run `pnpm --filter @workspace/db run push` to sync to Supabase.
- The `wm_sessions` table must exist before starting the server. It was created manually; re-create it if the DB is reset.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
