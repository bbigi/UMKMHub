-- Bind business data to the authenticated owner and remove anonymous submissions.
alter table public.umkm
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

create index if not exists umkm_owner_id_idx on public.umkm(owner_id);

drop policy if exists "Pendaftaran UMKM mengikuti pengaturan platform" on public.umkm;
drop policy if exists "Pemilik membaca UMKM sendiri" on public.umkm;
drop policy if exists "Pemilik menambah UMKM sendiri" on public.umkm;
drop policy if exists "Pemilik mengubah UMKM sendiri" on public.umkm;

create policy "Pemilik membaca UMKM sendiri" on public.umkm for select to authenticated
using (owner_id = auth.uid());

create policy "Pemilik menambah UMKM sendiri" on public.umkm for insert to authenticated
with check (
  owner_id = auth.uid()
  and status = 'menunggu'
  and coalesce((select owner_can_submit_umkm from public.platform_settings where id = true), false)
);

create policy "Pemilik mengubah UMKM sendiri" on public.umkm for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Owners may only attach products to a business they own.
drop policy if exists "Produk dapat diajukan" on public.products;
drop policy if exists "Pemilik membaca produk sendiri" on public.products;
drop policy if exists "Pemilik menambah produk sendiri" on public.products;
drop policy if exists "Pemilik mengubah produk sendiri" on public.products;
drop policy if exists "Pemilik menghapus produk sendiri" on public.products;

create policy "Pemilik membaca produk sendiri" on public.products for select to authenticated
using (exists (
  select 1 from public.umkm u where u.id = products.umkm_id and u.owner_id = auth.uid()
));

create policy "Pemilik menambah produk sendiri" on public.products for insert to authenticated
with check (
  status = 'menunggu'
  and exists (select 1 from public.umkm u where u.id = products.umkm_id and u.owner_id = auth.uid())
);

create policy "Pemilik mengubah produk sendiri" on public.products for update to authenticated
using (exists (
  select 1 from public.umkm u where u.id = products.umkm_id and u.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.umkm u where u.id = products.umkm_id and u.owner_id = auth.uid()
));

create policy "Pemilik menghapus produk sendiri" on public.products for delete to authenticated
using (exists (
  select 1 from public.umkm u where u.id = products.umkm_id and u.owner_id = auth.uid()
));

-- An owner cannot approve their own business or product by changing status.
create or replace function public.protect_moderation_status()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() and not public.is_government() then
    if tg_op = 'INSERT' then
      new.status := 'menunggu';
    else
      new.status := old.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_umkm_moderation_status on public.umkm;
create trigger protect_umkm_moderation_status
before insert or update on public.umkm
for each row execute function public.protect_moderation_status();

drop trigger if exists protect_product_moderation_status on public.products;
create trigger protect_product_moderation_status
before insert or update on public.products
for each row execute function public.protect_moderation_status();

-- Prevent oversized anonymous report payloads at the database boundary.
alter table public.user_reports
  drop constraint if exists user_reports_content_length_check;
alter table public.user_reports
  add constraint user_reports_content_length_check check (
    char_length(reporter_name) between 1 and 120
    and char_length(reporter_contact) <= 200
    and char_length(subject) between 3 and 160
    and char_length(description) between 10 and 4000
  );

alter table public.announcements
  drop constraint if exists announcements_content_length_check;
alter table public.announcements
  add constraint announcements_content_length_check check (
    char_length(title) between 3 and 160
    and char_length(content) between 3 and 5000
  );

-- Create the first pending business from trusted signup metadata. This keeps
-- registration atomic even when email confirmation means no session exists yet.
create or replace function public.handle_new_umkm_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_category text := new.raw_user_meta_data ->> 'kategori';
begin
  if new.raw_user_meta_data ->> 'role' = 'umkm'
    and nullif(trim(new.raw_user_meta_data ->> 'nama_usaha'), '') is not null
    and selected_category in ('Makanan & Minuman', 'Kerajinan', 'Fashion', 'Pertanian', 'Jasa')
  then
    insert into public.umkm (
      owner_id, nama_usaha, no_whatsapp, kategori, deskripsi, alamat,
      latitude, longitude, status
    ) values (
      new.id,
      trim(new.raw_user_meta_data ->> 'nama_usaha'),
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), '-'),
      selected_category,
      coalesce(new.raw_user_meta_data ->> 'deskripsi', ''),
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'alamat'), ''), 'Karangwuni, Wates'),
      -7.9229,
      110.0936,
      'menunggu'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_umkm on auth.users;
create trigger on_auth_user_created_create_umkm
after insert on auth.users
for each row execute function public.handle_new_umkm_user();
