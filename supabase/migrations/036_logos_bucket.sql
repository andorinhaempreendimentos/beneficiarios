-- Bucket público para a logo do sistema (trocável via Configurações)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do nothing;

create policy "logos_public_read" on storage.objects
  for select using (bucket_id = 'logos');

create policy "logos_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'logos');

create policy "logos_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'logos');

create policy "logos_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'logos');
