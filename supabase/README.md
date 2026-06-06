# Supabase Setup

## Order

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor, or apply it with the Supabase CLI.
3. Run seeds in this order:
   - `supabase/seed/teams.sql`
   - `supabase/seed/matches.sql`
   - `supabase/seed/demo_venues.sql` (optional)
4. Create your first admin user after the user has signed up or been created in Auth.

## First Admin

Find the user's Auth UUID in Supabase Auth, then run:

```sql
insert into public.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000')
on conflict (user_id) do nothing;
```

Replace `00000000-0000-0000-0000-000000000000` with the real `auth.users.id`.

`admin_users` has RLS enabled with no client policies, so client-side reads and writes are denied. Manage this table through the SQL editor or trusted service-role server code.

## Venue Photos

The migration creates a public storage bucket named `venue-photos`.

Authenticated users can upload files only under a folder named with their own user id:

```text
<auth-user-id>/<filename>.webp
```

The bucket is limited to 5 MB files and accepts `image/jpeg`, `image/png`, and `image/webp`.

## Demo Venues

`supabase/seed/demo_venues.sql` uses the placeholder user id `00000000-0000-0000-0000-000000000000`. The seed skips itself if that Auth user does not exist. Replace the placeholder with a real `auth.users.id` or create a temporary Auth user with that id before running the demo seed.
