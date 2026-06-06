# WC26 Screenings ⚽

Community-curated **public screening locations for the 2026 World Cup**.
Anyone can browse fan zones, pubs and plazas showing the matches; signed-in
fans can submit new spots, which are **verified by moderators** before going
live.

Built entirely on free tiers: **Next.js 16 (App Router)** on Vercel Hobby +
**Supabase Free** (Postgres, RLS, Auth, Storage) + **Leaflet/OpenStreetMap**
(no map API key needed).

## Features

- 🗺️ Map + filterable list of approved venues (type, indoor/outdoor, free
  entry, big screen, food, family-friendly)
- 📍 "Near me" geolocation sorting
- 📅 Full 104-match schedule with per-match "where to watch" pages
- ⭐ Favorite team — venues screening your team's next match get highlighted
- ➕ Auth-gated submissions with pin-drop location, address search
  (rate-limited Nominatim proxy), and browser-side photo compression
- ✅ Admin moderation queue (approve / reject with note / unpublish), report
  triage with priority sorting
- ▲ Upvotes and 🚩 reports from signed-in users

## Setup

### 1. Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. Follow **`supabase/README.md`**: run `supabase/migrations/*.sql`, then the
   seeds (`teams.sql`, `matches.sql`, optionally `demo_venues.sql`), then
   insert your first admin into `admin_users`.
3. Enable the **Google** provider under Auth → Providers (optional; magic
   link works out of the box). Set the Site URL and redirect URLs under
   Auth → URL Configuration (`http://localhost:3000/**` for dev).

### 2. App

```bash
cp .env.example .env.local   # fill in your project URL + anon key
npm install
npm run dev
```

### 3. Tests

```bash
npm test                      # unit tests
# With env vars set, live RLS policy probes run against your project too.
```

### 4. Deploy (Vercel Hobby)

Import the repo in Vercel, set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, deploy. Add your production URL to the
Supabase Auth redirect allowlist.

## Free-tier notes & mitigations

| Concern | Mitigation |
| --- | --- |
| Supabase Free pauses after ~7 days inactivity | Fine during the tournament; restore from dashboard |
| 1 GB storage / 5 GB egress | Photos are resized + WebP-compressed in the browser before upload (~≤300 KB) |
| OSM tile policy | Leaflet defaults (attribution, browser caching), no prefetching, conservative zooms |
| Nominatim 1 req/s policy | Server-side proxy at `/api/geocode` with global 1.1 s throttle + cache; pin-drop is the primary flow |
| Spam | Sign-in required to submit, honeypot field, max 3 pending submissions per user, report rate caps, admin approval before publish |

Verification model: all writes go through Supabase **RLS**. Venues insert as
`pending` (enforced by policy + trigger), only admins (deny-all
`admin_users` table + `is_admin()` security-definer function) can change
status or moderation fields. Reports never auto-unpublish — they flag venues
for admin priority.

Fixture data is seeded from [openfootball](https://github.com/openfootball/worldcup);
verify kickoff times against FIFA if timing is critical.

*Not affiliated with FIFA. Map data © OpenStreetMap contributors.*
