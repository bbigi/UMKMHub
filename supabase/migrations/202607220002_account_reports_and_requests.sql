-- Connect reports/requests to the authenticated sender so UMKM and government
-- accounts can follow the handling status set by the administrator.
alter table public.user_reports
  add column if not exists reporter_id uuid references auth.users(id) on delete set null,
  add column if not exists reporter_role text,
  add column if not exists report_type text not null default 'masalah';

alter table public.user_reports
  drop constraint if exists user_reports_report_type_check;
alter table public.user_reports
  add constraint user_reports_report_type_check
  check (report_type in ('masalah', 'permohonan', 'verifikasi'));

create index if not exists user_reports_reporter_id_idx
  on public.user_reports(reporter_id, created_at desc);

create or replace function public.set_reporter_identity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.reporter_id := auth.uid();
  new.reporter_role := case
    when auth.jwt() -> 'app_metadata' ->> 'role' in ('admin', 'government')
      then auth.jwt() -> 'app_metadata' ->> 'role'
    when auth.jwt() -> 'user_metadata' ->> 'role' = 'umkm'
      then 'umkm'
    else 'authenticated'
  end;
  new.status := 'baru';
  return new;
end;
$$;

drop trigger if exists set_user_report_identity on public.user_reports;
create trigger set_user_report_identity
before insert on public.user_reports
for each row execute function public.set_reporter_identity();

drop policy if exists "Pengguna terautentikasi dapat mengirim laporan" on public.user_reports;
drop policy if exists "Pengguna membaca laporan sendiri" on public.user_reports;

create policy "Pengguna terautentikasi dapat mengirim laporan"
on public.user_reports for insert to authenticated
with check (reporter_id = auth.uid() and status = 'baru');

create policy "Pengguna membaca laporan sendiri"
on public.user_reports for select to authenticated
using (reporter_id = auth.uid());
