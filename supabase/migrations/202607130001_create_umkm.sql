create extension if not exists pgcrypto;

create table if not exists public.umkm (
  id uuid primary key default gen_random_uuid(),
  nama_usaha text not null check (char_length(nama_usaha) between 2 and 120),
  no_whatsapp text not null,
  kategori text not null check (kategori in ('Makanan & Minuman', 'Kerajinan', 'Fashion', 'Pertanian', 'Jasa')),
  deskripsi text not null default '',
  alamat text not null,
  desa text not null default 'Karangwuni' check (desa = 'Karangwuni'),
  kecamatan text not null default 'Wates' check (kecamatan = 'Wates'),
  kabupaten text not null default 'Kulon Progo' check (kabupaten = 'Kulon Progo'),
  latitude double precision not null check (latitude between -7.965 and -7.875),
  longitude double precision not null check (longitude between 110.045 and 110.145),
  status text not null default 'menunggu' check (status in ('menunggu', 'aktif', 'ditolak')),
  created_at timestamptz not null default now()
);

alter table public.umkm enable row level security;

create policy "UMKM aktif dapat dibaca publik" on public.umkm for select using (status = 'aktif');
create policy "Pendaftaran UMKM dapat dikirim publik" on public.umkm for insert with check (status = 'menunggu');

create index if not exists umkm_status_idx on public.umkm(status);
create index if not exists umkm_location_idx on public.umkm(latitude, longitude);

