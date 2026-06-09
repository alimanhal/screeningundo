alter table public.venues
  add column gmaps_link text not null default '';

alter table public.venues
  alter column address drop not null,
  alter column city drop not null,
  alter column country drop not null;
