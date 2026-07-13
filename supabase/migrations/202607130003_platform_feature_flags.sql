create table if not exists public.platform_settings (
  id boolean primary key default true check (id = true),
  government_can_manage_umkm boolean not null default true,
  owner_can_submit_umkm boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id) values (true) on conflict (id) do nothing;
alter table public.platform_settings enable row level security;

create policy "Pengaturan fitur dapat dibaca publik" on public.platform_settings for select using (true);
create policy "Admin dapat mengubah pengaturan fitur" on public.platform_settings for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Pendaftaran UMKM dapat dikirim publik" on public.umkm;
create policy "Pendaftaran UMKM mengikuti pengaturan platform" on public.umkm for insert
with check (
  status = 'menunggu'
  and coalesce((select owner_can_submit_umkm from public.platform_settings where id = true), false)
);

create or replace function public.is_government()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'government'; $$;

create policy "Pemerintah dapat membaca semua UMKM" on public.umkm for select
using (public.is_government());
create policy "Pemerintah dapat menambah UMKM jika diizinkan" on public.umkm for insert
with check (public.is_government() and coalesce((select government_can_manage_umkm from public.platform_settings where id = true), false));
create policy "Pemerintah dapat mengubah UMKM jika diizinkan" on public.umkm for update
using (public.is_government() and coalesce((select government_can_manage_umkm from public.platform_settings where id = true), false))
with check (public.is_government() and coalesce((select government_can_manage_umkm from public.platform_settings where id = true), false));
create policy "Pemerintah dapat menghapus UMKM jika diizinkan" on public.umkm for delete
using (public.is_government() and coalesce((select government_can_manage_umkm from public.platform_settings where id = true), false));

