# Gate Pass CRM

A CRM built to track gate pass requests, collections, companies and collector
performance — modeled after the original `gate_pass.xlsx` tracker (Dashboard,
Gate Pass Tracker, Pending Gate Pass, Collector Performance, Analyse Pivot).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (file-based, zero external services)
- Recharts for the dashboard charts

## Getting started

```bash
npm install          # also runs `prisma generate` via postinstall
cp .env.example .env # sets DATABASE_URL="file:./dev.db"
npm run db:migrate   # creates prisma/dev.db and applies the schema
npm run db:seed      # loads the 30 gate passes / 10 companies / 4 collectors
                      # extracted from the original spreadsheet
npm run dev
```

Open http://localhost:3000.

A pre-seeded `prisma/dev.db` is committed to the repo, so `npm install && npm run dev`
is enough to see data immediately — `db:migrate`/`db:seed` are only needed if you
reset the database.

## Structure

- `src/app/` — pages: `/` (Dashboard), `/gate-passes` (Tracker), `/pending`,
  `/collectors`, `/companies`, `/analytics` (Pivot), plus `/api/*` route handlers.
- `src/lib/gatepass.ts` — domain logic: processing time, delay category,
  pending-item priority, KPI/series/pivot computations. All analytics are
  computed live from the data, not stored, so they stay correct as records change.
- `prisma/schema.prisma` — `Company`, `Collector`, `GatePass` models.
- `prisma/seed.ts` + `prisma/data/gatepass_seed.json` — seed data extracted from
  the original Excel file.

## Notes

- `src/lib/prisma.ts` resolves the SQLite file with an absolute path built from
  `process.cwd()` rather than relying on the schema's relative `DATABASE_URL`.
  Turbopack/webpack rewrite `import.meta.url` inside the generated Prisma
  client, which otherwise breaks relative sqlite path resolution.
