# Contributing to Screening Undo

Thanks for thinking about helping. This is a community side project
for football fans, and every contribution — code, docs, translations,
bug reports — makes the next match easier to watch together. Please
read this guide before opening a pull request.

---

## Before you start

1. ⭐ **Star the repo** if you haven't already. It costs nothing and
   helps other contributors find the project.
2. 🤗 **Read our [Code of Conduct](CODE_OF_CONDUCT.md).** Be kind,
   assume good intent, and don't be the reason a first-time
   contributor walks away.
3. 🔍 **Search [existing issues](https://github.com/<your-username>/wc26-screenings/issues)**
   before opening a new one — your bug or feature might already be
   tracked.

---

## How to set up locally

See the [Quickstart in the README](README.md#quickstart). Short version:

```bash
git clone https://github.com/<your-username>/wc26-screenings.git
cd wc26-screenings
npm install
cp .env.example .env.local      # add your Supabase keys
npm run dev                     # http://localhost:3000
```

You need a free Supabase project to run the app locally — the home
page reads from a live Postgres. See
[`supabase/README.md`](supabase/README.md) for the migration + seed
order.

---

## Workflow

### 1. Fork & branch

- **Always work in a fork.** Don't push directly to `main` even on
  your own fork — keep `main` clean so it can track upstream.
- **One branch per change.** Don't pile unrelated work onto a single
  branch. Reviewers want small, focused PRs.

Branch naming convention:

```text
feat/<short-description>      # new functionality
fix/<short-description>       # bug fix
docs/<short-description>      # docs / README / comments only
refactor/<short-description>  # internal cleanup, no behavior change
chore/<short-description>     # tooling, deps, build, CI
test/<short-description>      # tests only
```

Example: `feat/add-malayalam-translations`, `fix/map-overflow-mobile`.

### 2. Make your change

- **Keep diffs small.** A 50-line PR gets reviewed in a day; a
  500-line PR can sit for weeks.
- **Match the existing style.** This project uses Tailwind 4 with
  custom design tokens — see [`docs/DESIGN.md`](docs/DESIGN.md). Don't
  introduce a new design language.
- **Pure logic goes in `src/lib/`.** UI components stay thin and
  testable. If your code has interesting branches, write a unit test.
- **Database changes are migrations.** Never edit an applied migration.
  Add a new file under `supabase/migrations/NNNN_short_name.sql`.
- **Don't use the service-role key in any request path.** All client
  writes use the anon key + RLS — keep it that way.

### 3. Before you push

Run the full check locally:

```bash
npm run lint        # ESLint — must pass with no new errors
npm test            # Vitest — all tests must pass
npm run build       # Production build — must succeed
```

If you added or changed pure-logic code in `src/lib/`, add a test for
it. If you touched a server action or RLS-sensitive query, run the
live RLS probes by setting your `.env.local` Supabase vars and running
`npm test` — the probe suite picks them up automatically.

### 4. Commit style

We follow **Conventional Commits**. Keep the subject line under ~70
characters, imperative mood ("add X", not "added X" or "adds X").

```text
feat: add Malayalam translations for filter pills
fix(map): prevent overflow on iPhone SE
docs(readme): clarify env variable setup
refactor(venues): extract getVenueMapHref helper
chore(deps): bump next to 16.2.7
test(venues): cover parseGmapsCoords short-link case
```

Allowed types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`,
`style`, `perf`, `ci`.

### 5. Open the pull request

- **Target branch:** `main`.
- **Title:** mirror the commit-message style above.
- **Description:** a few sentences on *what* changed and *why*. Link
  the issue with `Closes #123` if one exists.
- **Screenshots / GIFs:** required for any UI change. Mobile +
  desktop if it's a layout change.
- **Checklist:** confirm each item in the PR template (lint passes,
  tests pass, build passes, screenshots attached if UI).

### Don'ts

- ❌ Don't force-push to a branch after a review has started — it
  loses the review comments. Push fresh commits and squash on merge.
- ❌ Don't bundle unrelated changes in one PR. Split it up.
- ❌ Don't commit secrets, `.env.local`, or anything from
  `node_modules/`.
- ❌ Don't add a dependency just to use one function from it — write
  the function.

---

## What we love receiving

- 🌍 **Translations and regional copy.** The codebase is
  Kerala-focused but location-agnostic; new languages and city-
  specific defaults are very welcome.
- 🐛 **Bug fixes** with a failing test (or a clear reproduction step).
- ✨ **Small, focused features** — one PR, one thing.
- 📚 **Docs improvements.** README, code comments, examples.
- ♿ **Accessibility wins.** Contrast, keyboard nav, screen-reader
  labels, motion preferences.
- 🎨 **Visual polish** that respects the Modern Minimal theme in
  `docs/DESIGN.md`.

## What needs an issue first

Open an issue and discuss before writing code for:

- Big architectural changes (framework swaps, routing rewrites).
- Adding or removing core dependencies (Supabase, MapLibre,
  Tailwind).
- Database schema changes (anything that adds/removes a column or
  table).
- Changes to RLS policies.
- New protected routes or auth-flow changes.

A 5-minute conversation upfront beats a rejected 500-line PR.

---

## Reporting bugs

Open a [GitHub issue](https://github.com/<your-username>/wc26-screenings/issues/new)
with:

- **What you expected to happen.**
- **What actually happened** (with screenshots if visual).
- **How to reproduce it** — exact steps, browser, OS, device size if
  mobile.
- **Console errors**, if any.

For security-sensitive issues (auth bypass, RLS leak, etc.), please
**don't open a public issue**. Email the maintainers directly (contact
in the repo's *About* sidebar) so we can patch before disclosure.

---

## Releases & maintainers

This is a volunteer-run project. Maintainers review PRs in their spare
time — please be patient. If a PR sits for more than two weeks without
a response, feel free to ping it politely.

We follow no fixed release cadence; `main` is always deployable.

---

## License

By contributing, you agree that your contributions will be licensed
under the [MIT License](LICENSE) that covers the project. You retain
copyright to your contributions.

Thanks again. See you on game day. ⚽
