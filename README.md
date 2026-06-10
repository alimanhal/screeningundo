# Screening Undo ⚽

A community map of public screening locations for the **2026 FIFA
World Cup**, focused on **Kerala 🇮🇳** but usable anywhere. Anyone can
browse, anyone can add a venue — no sign-in needed.

Built on free tiers: Next.js 16 + Supabase + OpenStreetMap.

## Why

The best part of any World Cup isn't the stadium — it's the packed
pub, the public square, the tea shop with a projector. These places
are everywhere but invisible online. Screening Undo puts them on one
map.

## How to use

**Find a venue:** open the home page, tap *Near me* to sort by
distance, use filters to narrow down, tap any card's 📍 icon for
Google Maps directions.

**Add a venue:** click *Add a venue*, fill the basics, pick the
location (type, drop a pin, or use *Add location* for GPS), paste a
Google Maps link, pick which matches it screens, submit. It's live
immediately.

**Sign in** (magic link or Google) only if you want to upvote, report
bad listings, or set a favorite team.

## Run it locally

```bash
git clone https://github.com/<your-username>/wc26-screenings.git
cd wc26-screenings
npm install
cp .env.example .env.local      # add your Supabase URL + anon key
npm run dev
```

Set up Supabase first — see [`supabase/README.md`](supabase/README.md)
for the migration and seed order.

## Contributing

PRs welcome. Please ⭐ the repo, fork it, and read
[`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.
Be kind — see [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## License

MIT — see [`LICENSE`](LICENSE).

Not affiliated with FIFA. Map data © OpenStreetMap contributors.
