-- 0005_venue_editing.sql
--
-- Re-introduce venue ownership so signed-in submitters can edit their own
-- venues. The column is nullable so existing anonymous submissions remain
-- valid (and uneditable — there's no owner to auth against).
--
-- Safe to re-run: every DROP/ALTER uses IF EXISTS / IF NOT EXISTS.

-- -----------------------------------------------------------------------------
-- 1. Add created_by column (nullable, FK to auth.users)
-- -----------------------------------------------------------------------------

alter table public.venues
  add column if not exists created_by uuid references auth.users(id);

create index if not exists venues_created_by_idx on public.venues (created_by);

-- -----------------------------------------------------------------------------
-- 2. RLS: venue creators can update / delete their own venues
-- -----------------------------------------------------------------------------

create policy "venue creators can update their venues"
on public.venues for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "venue creators can delete their venues"
on public.venues for delete
to authenticated
using (created_by = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- 3. RLS: venue_matches — let creators manage matches for their venues
-- -----------------------------------------------------------------------------

create policy "venue creators can update venue matches"
on public.venue_matches for insert
to authenticated
with check (
  exists (
    select 1 from public.venues
    where venues.id = venue_id
    and venues.created_by = (select auth.uid())
  )
);

create policy "venue creators can delete venue matches"
on public.venue_matches for delete
to authenticated
using (
  exists (
    select 1 from public.venues
    where venues.id = venue_id
    and venues.created_by = (select auth.uid())
  )
);

-- -----------------------------------------------------------------------------
-- 4. Auto-set updated_at on venue updates
-- -----------------------------------------------------------------------------

create or replace function public.set_venue_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_venue_updated_at
  before update on public.venues
  for each row
  execute function public.set_venue_updated_at();
