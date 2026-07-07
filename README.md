# RCH Gate Pass CRM

A CRM built to track gate pass requests, collections, companies and collector
performance for RCH's client sites in Qatar (Doha Towers, Mesaieed, Ras Laffan,
Dukhan, Offshore). Branded with RCH's identity (logo, magenta/navy palette).

Each gate pass tracks: company, site **location**, **gate pass type**
(Permanent/Temporary), **request type** (New/Lost), and **pass category**
(Main/Supplementary), alongside submission/collection dates, status and the
collector who processed it.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (file-based, zero external services)
- Recharts for the dashboard charts

## Getting started

```bash
npm install          # also runs `prisma generate` via postinstall
cp .env.example .env # sets DATABASE_URL="file:./dev.db"
npm run db:migrate   # creates prisma/dev.db and applies the schema
npm run db:seed      # loads the 32 gate passes / 4 companies / 4 collectors
                      # sample dataset (EY Consulting, Welltec, Tenaris Global,
                      # Tenaris Investment)
npm run dev
```

Open http://localhost:3000.

A pre-seeded `prisma/dev.db` is committed to the repo, so `npm install && npm run dev`
is enough to see data immediately — `db:migrate`/`db:seed` are only needed if you
reset the database.

## Structure

- `src/app/` — pages: `/` (Dashboard), `/gate-passes` (Tracker), `/pending`,
  `/collectors`, `/companies`, `/analytics` (cross-tab reports), plus `/api/*`
  route handlers.
- `src/lib/gatepass.ts` — domain logic: processing time, delay category,
  pending-item priority, KPI/series/pivot computations (including the
  location pivot). All analytics are computed live from the data, not stored,
  so they stay correct as records change.
- `prisma/schema.prisma` — `Company`, `Collector`, `GatePass` models, plus the
  `Location`, `GatePassType`, `RequestType` and `PassCategory` enums.
- `prisma/seed.ts` + `prisma/data/gatepass_seed.json` — sample seed data.
- `gate-pass-crm.html` — a standalone, self-contained single-file build of the
  same CRM (embedded data, vanilla JS, localStorage persistence) for sharing
  without running the Next.js app.

## Notes

- `src/lib/prisma.ts` resolves the SQLite file with an absolute path built from
  `process.cwd()` rather than relying on the schema's relative `DATABASE_URL`.
  Turbopack/webpack rewrite `import.meta.url` inside the generated Prisma
  client, which otherwise breaks relative sqlite path resolution.
