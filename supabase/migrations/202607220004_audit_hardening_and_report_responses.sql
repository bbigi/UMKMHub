-- Close findings from the second technical audit without changing existing
-- public URLs or deleting data.

-- Always derive the PostGIS point from the canonical numeric coordinates.
-- This prevents direct API writes to `location` from desynchronizing GIS data.
drop trigger if exists sync_umkm_spatial_location on public.umkm;
create trigger sync_umkm_spatial_location
before insert or update on public.umkm
for each row execute function public.sync_umkm_spatial_location();

-- Only administrators may reassign ownership. Owners keep their own identity,
-- government-created records stay unassigned, and the trusted auth signup
-- trigger (where auth.uid() is null) may still provide the new user's id.
create or replace function public.protect_umkm_owner_identity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.owner_id := old.owner_id;
  elsif public.is_government() then
    new.owner_id := null;
  elsif auth.uid() is not null then
    new.owner_id := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists protect_umkm_owner_identity on public.umkm;
create trigger protect_umkm_owner_identity
before insert or update of owner_id on public.umkm
for each row execute function public.protect_umkm_owner_identity();

alter table public.user_reports
  add column if not exists admin_response text not null default '',
  add column if not exists updated_at timestamptz not null default now();

alter table public.user_reports
  drop constraint if exists user_reports_admin_response_length_check;
alter table public.user_reports
  add constraint user_reports_admin_response_length_check
  check (char_length(admin_response) <= 4000);

create or replace function public.touch_user_report_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_user_report_updated_at on public.user_reports;
create trigger touch_user_report_updated_at
before update on public.user_reports
for each row execute function public.touch_user_report_updated_at();

create index if not exists umkm_status_created_at_idx
  on public.umkm(status, created_at desc);
create index if not exists products_status_created_at_idx
  on public.products(status, created_at desc);
create index if not exists user_reports_status_created_at_idx
  on public.user_reports(status, created_at desc);

revoke all on function public.search_nearby_umkm(double precision, double precision, integer) from public;
grant execute on function public.search_nearby_umkm(double precision, double precision, integer)
to anon, authenticated;

comment on column public.user_reports.admin_response is
  'Administrator response visible to the authenticated report owner.';
