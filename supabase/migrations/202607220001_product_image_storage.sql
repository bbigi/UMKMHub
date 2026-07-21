  -- Product images are uploaded to Supabase Storage instead of accepting an
  -- arbitrary image URL from the product form.
  alter table public.products
    add column if not exists image_path text;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'product-images',
    'product-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
  on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

  drop policy if exists "Gambar produk dapat dibaca publik" on storage.objects;
  drop policy if exists "Pemilik mengunggah gambar produk" on storage.objects;
  drop policy if exists "Pemilik mengubah gambar produk" on storage.objects;
  drop policy if exists "Pemilik menghapus gambar produk" on storage.objects;

  create policy "Gambar produk dapat dibaca publik"
  on storage.objects for select
  using (bucket_id = 'product-images');

  create policy "Pemilik mengunggah gambar produk"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

  create policy "Pemilik mengubah gambar produk"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

  create policy "Pemilik menghapus gambar produk"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

