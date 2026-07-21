  -- Set app_metadata.role = 'admin' pada user admin melalui Dashboard atau server tepercaya.
  create or replace function public.is_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
  $$;

  create policy "Admin dapat membaca semua UMKM" on public.umkm for select using (public.is_admin());
  create policy "Admin dapat menambah UMKM" on public.umkm for insert with check (public.is_admin());
  create policy "Admin dapat mengubah UMKM" on public.umkm for update using (public.is_admin()) with check (public.is_admin());
  create policy "Admin dapat menghapus UMKM" on public.umkm for delete using (public.is_admin());
