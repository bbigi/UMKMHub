-- Spatial foundation for UMKMku. Latitude/longitude remain available for the
-- existing frontend, while PostGIS becomes the indexed source for GIS queries.
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

alter table public.umkm
  add column if not exists location extensions.geography(Point, 4326);

update public.umkm
set location = extensions.st_setsrid(
  extensions.st_makepoint(longitude, latitude),
  4326
)::extensions.geography
where location is null;

alter table public.umkm
  alter column location set not null;

create index if not exists umkm_location_gist_idx
  on public.umkm using gist (location);

create or replace function public.sync_umkm_spatial_location()
returns trigger
language plpgsql
security invoker
set search_path = public, extensions
as $$
begin
  new.location := st_setsrid(st_makepoint(new.longitude, new.latitude), 4326)::geography;
  return new;
end;
$$;

drop trigger if exists sync_umkm_spatial_location on public.umkm;
create trigger sync_umkm_spatial_location
before insert or update of latitude, longitude on public.umkm
for each row execute function public.sync_umkm_spatial_location();

create or replace function public.search_nearby_umkm(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_meters integer default 3000
)
returns table (
  id uuid,
  nama_usaha text,
  kategori text,
  alamat text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    u.id,
    u.nama_usaha,
    u.kategori,
    u.alamat,
    u.latitude,
    u.longitude,
    st_distance(
      u.location,
      st_setsrid(st_makepoint(p_longitude, p_latitude), 4326)::geography
    ) as distance_meters
  from public.umkm as u
  where u.status = 'aktif'
    and p_latitude between -90 and 90
    and p_longitude between -180 and 180
    and st_dwithin(
      u.location,
      st_setsrid(st_makepoint(p_longitude, p_latitude), 4326)::geography,
      least(greatest(coalesce(p_radius_meters, 3000), 100), 20000)
    )
  order by distance_meters asc;
$$;

grant execute on function public.search_nearby_umkm(double precision, double precision, integer)
to anon, authenticated;

create or replace view public.umkm_gis_public
with (security_invoker = true)
as
select
  id,
  nama_usaha,
  kategori,
  alamat,
  latitude,
  longitude,
  extensions.st_asgeojson(location::extensions.geometry)::jsonb as geometry
from public.umkm
where status = 'aktif';

grant select on public.umkm_gis_public to anon, authenticated;

comment on column public.umkm.location is
  'PostGIS WGS84 point synchronized from longitude and latitude.';
comment on function public.search_nearby_umkm(double precision, double precision, integer) is
  'Returns active UMKM ordered by distance, with radius limited to 100-20000 meters.';
comment on view public.umkm_gis_public is
  'Public active UMKM as GeoJSON-compatible features for GIS clients such as QGIS.';
