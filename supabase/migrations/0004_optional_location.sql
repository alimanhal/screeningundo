-- 0004_optional_location.sql
--
-- Make all five location-ish columns on `venues` optional. Users may submit
-- a venue with as little as { name, description, venue_type, indoor_outdoor,
-- gmaps_link }. The lat/lng range CHECK constraints stay in force *when a
-- value is provided*; CHECK already returns true for NULL operands.
--
-- Safe to re-run.

alter table public.venues
  alter column lat drop not null,
  alter column lng drop not null,
  alter column address drop not null,
  alter column city drop not null,
  alter column country drop not null;
