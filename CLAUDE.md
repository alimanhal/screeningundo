# WC26 Screenings — project notes

Next.js 16 (App Router, `src/`, `@/*` alias, Tailwind 4) + Supabase
(Postgres/RLS/Auth/Storage) + Leaflet/OSM. Free-tier only — no paid APIs.

## Architecture

- **Verification model lives in the database.** All client writes use the
  user-session anon-key client; RLS + triggers in
  `supabase/migrations/0001_init.sql` enforce pending-by-default venues,
  admin-only moderation columns, and anti-spam caps. Never introduce
  service-role keys into request paths.
- Admin check = `is_admin()` Postgres function (deny-all `admin_users`
  table). Server-side helper: `getIsAdmin()` in `src/lib/supabase/helpers.ts`.
- Session refresh in `src/proxy.ts` (Next 16 proxy convention) via
  `src/lib/supabase/middleware.ts`. Protected prefixes: `/submit`, `/me`,
  `/admin`.
- Pure, testable logic lives in `src/lib/venues.ts` and `src/lib/matches.ts`
  (filtering, distance, sorting, highlight rules) — UI components stay thin.
- Maps: `react-leaflet` always loaded with `next/dynamic` + `ssr: false`;
  Leaflet CSS imported once in `src/app/layout.tsx`.
- Geocoding only via `/api/geocode` (Nominatim proxy, 1.1 s global throttle).
  Pin-drop is the primary location flow — search is best-effort.

## Theme

"Matchday signage": tokens in `src/app/globals.css` (`--pitch`, `--gold`,
`--ink`, `--paper`, oklch). Gold is reserved for favorite-team moments.
Utility classes: `.display` (signage headings), `.scoreboard` (tabular nums),
`.pitch-divider`.

## Commands

- `npm run dev` / `npm run build` / `npm run lint`
- `npm test` — Vitest; live RLS probes run only when Supabase env vars are set
- DB changes: add a new file under `supabase/migrations/`, never edit applied ones
