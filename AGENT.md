# WC26 Screenings — project notes

Next.js 16 (App Router, `src/`, `@/*` alias, Tailwind 4) + Supabase
(Postgres/RLS/Auth/Storage) + Leaflet/OSM. Free-tier only — no paid APIs.

## Architecture

- **Open submissions, no admin/approval.** Anyone (anonymous or signed-in)
  can add a venue and it goes live immediately. RLS in
  `supabase/migrations/0003_open_submissions.sql` allows anon insert/select on
  `venues` and `venue_matches`; `0004_optional_location.sql` makes
  `lat/lng/address/city/country` nullable. All client writes still use the
  user-session anon-key client — never introduce service-role keys into
  request paths.
- Votes and reports still require login (own-row RLS on `votes` and
  `reports`). Reports have no in-app moderation UI — resolve via SQL editor.
- Session refresh in `src/proxy.ts` (Next 16 proxy convention) via
  `src/lib/supabase/middleware.ts`. Only protected prefix: `/me`.
- Pure, testable logic lives in `src/lib/venues.ts` and `src/lib/matches.ts`
  (filtering, distance, sorting, highlight rules, `parseGmapsCoords`) — UI
  components stay thin.
- Maps: `react-leaflet` always loaded with `next/dynamic` + `ssr: false`;
  Leaflet CSS imported once in `src/app/layout.tsx`. Components that consume
  venue rows must treat `lat/lng/address/city/country` as nullable and skip /
  hide gracefully (no `NaN`, no MapLibre crashes).
- Geocoding only via `/api/geocode` (Nominatim proxy, 1.1 s global throttle).
  Pin-drop is the primary location flow — search is best-effort; coords are
  also extracted from a pasted Google Maps URL via `parseGmapsCoords`.

## Theme

**Modern Minimal** — `docs/DESIGN.md` is the source of truth; conform every
UI change to it. Not sport-themed. Tokens in `src/app/globals.css`
(`--ink`, `--paper`, `--surface`, `--blue` accent, status colors, oklch;
shadows `--shadow-card`/`--shadow-raised`). Radii: cards `rounded-2xl`,
inputs `rounded-xl`, buttons/chips `rounded-full` pills. Primary CTA = ink
pill; one blue accent for interactive. Utility classes: `.display`,
`.scoreboard`, `.rule`, `.press`. Font: Plus Jakarta Sans (self-hosted via
Fontsource). Mobile-first: ≥44px touch targets, 16px inputs below `sm`
(iOS zoom).

## Commands

- `npm run dev` / `npm run build` / `npm run lint`
- `npm test` — Vitest; live RLS probes run only when Supabase env vars are set
- DB changes: add a new file under `supabase/migrations/`, never edit applied ones
