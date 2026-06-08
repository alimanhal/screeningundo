-- Remove venue photo support (column + storage bucket).
-- Safe to run in the Supabase SQL editor.

-- 1. Drop the photo_url column from venues
alter table public.venues drop column if exists photo_url;

-- 2. Remove storage policies for venue-photos
drop policy if exists "venue photos are publicly readable" on storage.objects;
drop policy if exists "users can upload venue photos to own folder" on storage.objects;
drop policy if exists "users can delete own venue photos or admins can delete any" on storage.objects;

-- 3. Delete all objects in the bucket, then remove the bucket
delete from storage.objects where bucket_id = 'venue-photos';

delete from storage.buckets where id = 'venue-photos';
