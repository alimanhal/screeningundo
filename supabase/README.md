# Supabase Setup

## Order

1. Create a free Supabase project at [supabase.com](https://supabase.com).
2. In the SQL editor (or via the Supabase CLI), apply the migrations
   **in alphabetical order**:
   - `migrations/0001_init.sql`
   - `migrations/0002_gmaps_link.sql`
   - `migrations/0002_remove_photos.sql`
   - `migrations/0003_open_submissions.sql`
   - `migrations/0004_optional_location.sql`
3. Run the seeds in this order:
   - `seed/teams.sql` — all 48 WC26 teams (required)
   - `seed/matches.sql` — full 104-match fixture list (required)
   - `seed/demo_venues.sql` — optional demo data; no-ops in production
4. Add `http://localhost:3000/**` (and your production URL once
   deployed) to **Auth → URL Configuration → Redirect URLs**.

That's it. There is no admin role, no moderation queue, and no
storage bucket — submissions go live immediately and venues link to
Google Maps rather than uploading photos.

## Reference data vs. user data

| Table | Source | Safe to clear? |
| --- | --- | --- |
| `teams` | `seed/teams.sql` | **No** — required for the app to work |
| `matches` | `seed/matches.sql` | **No** — required for the app to work |
| `venues` | user submissions | Yes — cascades to children below |
| `venue_matches` | user submissions | Yes (cascades from `venues`) |
| `votes` | signed-in users | Yes (cascades from `venues`) |
| `reports` | signed-in users | Yes (cascades from `venues`) |
| `profiles` | auto-created on signup | Cascades from `auth.users` |

## Clearing test data

To wipe every user-submitted row while keeping reference data and auth
accounts intact, run this in the SQL editor:

```sql
begin;
delete from public.reports;
delete from public.votes;
delete from public.venue_matches;
delete from public.venues;   -- cascades; the three deletes above are
                             -- just for visible per-table counts
commit;
```

## Resolving reports

There is no in-app moderation UI by design. To act on a report, query
the table directly:

```sql
-- See open reports with their venue context
select r.id, r.reason, r.details, r.created_at,
       v.name as venue_name, v.city, v.country
from public.reports r
join public.venues v on v.id = r.venue_id
where r.status = 'open'
order by r.created_at;

-- Hide a bad venue (cascades delete its votes, reports, matches)
delete from public.venues where id = '<venue-uuid>';

-- Mark a report resolved without deleting the venue
update public.reports set status = 'resolved' where id = '<report-uuid>';
```

## Demo venues

`seed/demo_venues.sql` is wrapped in a `DO` block that no-ops unless a
placeholder `auth.users` row with id `00000000-0000-0000-0000-000000000000`
exists. This makes it safe to run accidentally in production. For
local dev, either:

1. Edit the file to use a real `auth.users.id` from your project, or
2. Insert a temporary `auth.users` row with the placeholder UUID
   before running the seed, then delete it after.
