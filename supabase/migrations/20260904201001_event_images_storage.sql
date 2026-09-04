-- Storage bucket for event images, replacing Vercel Blob.
--
-- The previous /api/event/upload route had no auth check at all: any visitor
-- could upload arbitrary files. These policies close that.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- Images are shown on public event pages, so reads are open.
create policy "Event images are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'event-images');

-- Writes require a session. Each user owns a folder named after their user id,
-- so nobody can overwrite anyone else's uploads.
create policy "Authenticated users can upload event images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update their own event images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own event images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
