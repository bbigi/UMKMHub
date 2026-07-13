create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_name text not null default 'Anonim',
  reporter_contact text not null default '',
  subject text not null,
  description text not null,
  status text not null default 'baru' check (status in ('baru','diproses','selesai','ditolak')),
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  audience text not null default 'semua' check (audience in ('semua','umkm','pemerintah')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  umkm_id uuid references public.umkm(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(14,2) not null default 0 check (price >= 0),
  image_url text,
  status text not null default 'menunggu' check (status in ('menunggu','aktif','ditolak')),
  created_at timestamptz not null default now()
);

alter table public.user_reports enable row level security;
alter table public.announcements enable row level security;
alter table public.products enable row level security;

create policy "Pengguna dapat mengirim laporan" on public.user_reports for insert with check (status = 'baru');
create policy "Admin mengelola laporan" on public.user_reports for all using (public.is_admin()) with check (public.is_admin());
create policy "Pengumuman aktif dapat dibaca publik" on public.announcements for select using (active = true);
create policy "Admin mengelola pengumuman" on public.announcements for all using (public.is_admin()) with check (public.is_admin());
create policy "Produk aktif dapat dibaca publik" on public.products for select using (status = 'aktif');
create policy "Produk dapat diajukan" on public.products for insert with check (status = 'menunggu');
create policy "Admin memoderasi produk" on public.products for all using (public.is_admin()) with check (public.is_admin());

alter table public.platform_settings add column if not exists platform_name text not null default 'UMKM Nusantara';
alter table public.platform_settings add column if not exists maintenance_mode boolean not null default false;
alter table public.platform_settings add column if not exists support_contact text not null default '';

