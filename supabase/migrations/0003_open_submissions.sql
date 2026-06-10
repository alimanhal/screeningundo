-- 0003_open_submissions.sql
--
-- Removes the admin/approval moderation model from venues entirely.
--
-- Effects:
--   * Anyone (anonymous or signed-in) can insert a venue.
--   * Venues are public on insert (no pending/approved/rejected status).
--   * Admin role, admin_users, is_admin() and the moderation queue are gone.
--   * Votes & reports remain login-required (their RLS no longer keys on
--     venues.status, which has been dropped).
--   * reports table is preserved for record-keeping; without an admin UI
--     resolution must be done manually via the SQL editor.
--
-- Safe to re-run: every DROP uses IF EXISTS and policies are recreated.

-- -----------------------------------------------------------------------------
-- 1. Drop moderation triggers & policies that reference status / created_by
-- -----------------------------------------------------------------------------

drop trigger if exists enforce_venue_insert_limits on public.venues;
drop trigger if exists enforce_venue_update_rules on public.venues;

drop function if exists public.enforce_venue_insert_limits();
drop function if exists public.enforce_venue_update_rules();

-- venues policies (old model)
drop policy if exists "approved venues are readable by everyone" on public.venues;
drop policy if exists "venue owners can select their venues" on public.venues;
drop policy if exists "admins can select all venues" on public.venues;
drop policy if exists "authenticated users can submit pending venues" on public.venues;
drop policy if exists "venue owners can update pending venues" on public.venues;
drop policy if exists "admins can update all venues" on public.venues;

-- venue_matches policies (old model, all keyed on status / created_by)
drop policy if exists "approved venue matches are readable by everyone" on public.venue_matches;
drop policy if exists "venue owners can select their venue matches" on public.venue_matches;
drop policy if exists "admins can select all venue matches" on public.venue_matches;
drop policy if exists "venue owners can add matches while pending" on public.venue_matches;
drop policy if exists "venue owners can remove matches while pending" on public.venue_matches;

-- votes policies referencing is_admin / status
drop policy if exists "users can read own votes" on public.votes;
drop policy if exists "users can insert own votes" on public.votes;
drop policy if exists "users can delete own votes" on public.votes;

-- reports admin policies
drop policy if exists "admins can select all reports" on public.reports;
drop policy if exists "admins can update reports" on public.reports;

-- public storage policies referencing is_admin
drop policy if exists "users can delete own venue photos or admins can delete any" on storage.objects;
drop policy if exists "users can upload venue photos to own folder" on storage.objects;

-- -----------------------------------------------------------------------------
-- 2. Drop view that filters on venues.status before we drop the column
-- -----------------------------------------------------------------------------

drop view if exists public.venue_vote_counts;

-- -----------------------------------------------------------------------------
-- 3. Drop status-keyed indexes
-- -----------------------------------------------------------------------------

drop index if exists public.venues_status_country_city_idx;
drop index if exists public.venues_status_venue_type_idx;
drop index if exists public.venues_created_by_status_idx;
drop index if exists public.venues_status_lat_lng_idx;

-- -----------------------------------------------------------------------------
-- 4. Drop venues.created_by FK + moderation columns
-- -----------------------------------------------------------------------------

alter table public.venues drop constraint if exists venues_created_by_fkey;
alter table public.venues drop constraint if exists venues_status_check;

alter table public.venues drop column if exists status;
alter table public.venues drop column if exists approved_by;
alter table public.venues drop column if exists approved_at;
alter table public.venues drop column if exists rejected_by;
alter table public.venues drop column if exists rejected_at;
alter table public.venues drop column if exists rejection_note;
alter table public.venues drop column if exists hidden_reason;
alter table public.venues drop column if exists created_by;

-- Replacement non-status indexes for common filters
create index if not exists venues_country_city_idx on public.venues (country, city);
create index if not exists venues_venue_type_idx on public.venues (venue_type);
create index if not exists venues_lat_lng_idx on public.venues (lat, lng);

-- -----------------------------------------------------------------------------
-- 5. Drop admin role + helper
-- -----------------------------------------------------------------------------

drop function if exists public.is_admin();
drop table if exists public.admin_users;

-- -----------------------------------------------------------------------------
-- 6. Recreate RLS for the open-submission model
-- -----------------------------------------------------------------------------

-- venues: world-readable, world-writable (insert). Updates/deletes locked
-- down by default (no policy = no access via the anon/authenticated client);
-- moderation moves to the SQL editor / service role.
create policy "venues are readable by everyone"
on public.venues for select
to anon, authenticated
using (true);

create policy "anyone can insert venues"
on public.venues for insert
to anon, authenticated
with check (true);

-- venue_matches: visible to everyone, insertable by anyone (mirrors venues).
-- Deletes intentionally have no policy.
create policy "venue matches are readable by everyone"
on public.venue_matches for select
to anon, authenticated
using (true);

create policy "anyone can add venue matches"
on public.venue_matches for insert
to anon, authenticated
with check (true);

-- votes: still login-required, still own-row only (no admin override).
create policy "users can read own votes"
on public.votes for select
to authenticated
using (user_id = (select auth.uid()));

create policy "users can insert own votes"
on public.votes for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "users can delete own votes"
on public.votes for delete
to authenticated
using (user_id = (select auth.uid()));

-- reports: still login-required, own-row only. No admin UI; resolve via SQL.
-- (existing "users can insert own reports" + "users can select own reports"
--  from 0001_init.sql are preserved.)

-- Storage policies — keep deletion gated to the uploader; drop admin override
-- and drop the per-user-folder requirement (no user id for anonymous uploads).
create policy "anyone can upload venue photos"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'venue-photos');

create policy "uploaders can delete their venue photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'venue-photos' and owner = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- 7. Recreate the public aggregate view (no status filter)
-- -----------------------------------------------------------------------------

create or replace view public.venue_vote_counts as
select v.venue_id, count(*)::int as vote_count
from public.votes v
group by v.venue_id;

revoke all on public.venue_vote_counts from public;
grant select on public.venue_vote_counts to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 8. Update report insert limit trigger — no longer needs is_admin().
-- -----------------------------------------------------------------------------

create or replace function public.enforce_report_insert_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'open'
     and (
       select count(*)
       from public.reports
       where user_id = new.user_id
         and status = 'open'
     ) >= 10 then
    raise exception 'open report limit reached';
  end if;

  return new;
end;
$$;
