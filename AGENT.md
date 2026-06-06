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

**Modern Minimal** — `docs/DESIGN.md` is the source of truth; conform every
UI change to it. Not sport-themed. Tokens in `src/app/globals.css`
(`--ink`, `--paper`, `--surface`, `--blue` accent, status colors, oklch;
shadows `--shadow-card`/`--shadow-raised`). Radii: cards `rounded-2xl`,
inputs `rounded-xl`, buttons/chips `rounded-full` pills. Primary CTA = ink
pill; one blue accent for interactive; statuses: pending amber / approved
green / rejected red (wash + text). Utility classes: `.display`,
`.scoreboard`, `.rule`, `.press`. Font: Plus Jakarta Sans (self-hosted via
Fontsource). Mobile-first: ≥44px touch targets, 16px inputs below `sm`
(iOS zoom).

## Commands

- `npm run dev` / `npm run build` / `npm run lint`
- `npm test` — Vitest; live RLS probes run only when Supabase env vars are set
- DB changes: add a new file under `supabase/migrations/`, never edit applied ones
