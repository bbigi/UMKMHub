-- Follow-up hardening for findings recorded in audit.md.

-- Public reports were vulnerable to anonymous spam. Reports now require a
-- signed-in account; dashboards already have an authenticated session.
drop policy if exists "Pengguna dapat mengirim laporan" on public.user_reports;
drop policy if exists "Pengguna terautentikasi dapat mengirim laporan" on public.user_reports;
create policy "Pengguna terautentikasi dapat mengirim laporan"
on public.user_reports for insert to authenticated
with check (status = 'baru');

-- Any owner edit returns moderated content to the review queue. Admin and
-- government updates keep the status they explicitly selected.
create or replace function public.protect_moderation_status()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() and not public.is_government() then
    new.status := 'menunggu';
  end if;
  return new;
end;
$$;

-- Respect the admin feature flag inside the trusted signup trigger as well as
-- in RLS. Without this check, SECURITY DEFINER could bypass the disabled flag.
create or replace function public.handle_new_umkm_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_category text := new.raw_user_meta_data ->> 'kategori';
  registration_enabled boolean := coalesce(
    (select owner_can_submit_umkm from public.platform_settings where id = true),
    false
  );
begin
  if registration_enabled
    and new.raw_user_meta_data ->> 'role' = 'umkm'
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

-- Admin-only RPCs expose the minimum auth data needed to connect legacy UMKM
-- records to their owner without exposing auth.users directly to the client.
create or replace function public.admin_list_umkm_owners()
returns table (id uuid, email text, display_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  return query
  select
    users.id,
    users.email::text,
    coalesce(users.raw_user_meta_data ->> 'nama', users.email, 'Tanpa nama')::text
  from auth.users as users
  where coalesce(users.raw_app_meta_data ->> 'role', users.raw_user_meta_data ->> 'role', '') = 'umkm'
  order by users.created_at desc;
end;
$$;

create or replace function public.admin_assign_umkm_owner(p_umkm_id uuid, p_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from auth.users
    where id = p_owner_id
      and coalesce(raw_app_meta_data ->> 'role', raw_user_meta_data ->> 'role', '') = 'umkm'
  ) then
    raise exception 'selected account is not an UMKM owner' using errcode = '22023';
  end if;

  update public.umkm set owner_id = p_owner_id where id = p_umkm_id;
  if not found then
    raise exception 'UMKM not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_list_umkm_owners() from public;
revoke all on function public.admin_assign_umkm_owner(uuid, uuid) from public;
grant execute on function public.admin_list_umkm_owners() to authenticated;
grant execute on function public.admin_assign_umkm_owner(uuid, uuid) to authenticated;
