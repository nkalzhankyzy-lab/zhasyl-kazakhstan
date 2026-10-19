-- Датчиктер: құрылғы өлшемді өз құпия токенімен жібереді (/api/readings → zk_ingest_reading).
-- Токеннің өзі сақталмайды, тек SHA-256 хэші.
--
-- Датчик қосу (SQL Editor-да, токенді өзіңіз ойлап табыңыз — ұзын кездейсоқ жол):
--   insert into public.zk_devices (id, classroom_id, name, token_hash)
--   values ('bio-co2-1', 'kzo-23-bio', 'Биология кабинеті, CO₂ датчигі',
--           encode(extensions.digest('ҰЗЫН-КЕЗДЕЙСОҚ-ТОКЕН', 'sha256'), 'hex'));

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.zk_devices (
  id text primary key,
  classroom_id text not null,
  name text not null default '',
  token_hash text not null unique,
  active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);
-- Клиенттерге ешқандай саясат жоқ: кестені тек төмендегі функция оқиды.
alter table public.zk_devices enable row level security;

create or replace function public.zk_ingest_reading(
  p_token text,
  p_co2 numeric default null,
  p_temperature numeric default null,
  p_humidity numeric default null,
  p_pm25 numeric default null,
  p_measured_at timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  d public.zk_devices%rowtype;
  t timestamptz := coalesce(p_measured_at, now());
  rid text;
begin
  if p_token is null or length(p_token) < 16 then
    raise exception 'invalid token' using errcode = '28000';
  end if;
  select * into d from public.zk_devices
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') and active;
  if not found then
    raise exception 'invalid token' using errcode = '28000';
  end if;
  if p_co2 is null and p_temperature is null and p_humidity is null and p_pm25 is null then
    raise exception 'no values' using errcode = '22023';
  end if;
  if (p_co2 is not null and (p_co2 < 0 or p_co2 > 40000))
     or (p_temperature is not null and (p_temperature < -40 or p_temperature > 60))
     or (p_humidity is not null and (p_humidity < 0 or p_humidity > 100))
     or (p_pm25 is not null and (p_pm25 < 0 or p_pm25 > 2000)) then
    raise exception 'value out of range' using errcode = '22003';
  end if;
  if t > now() + interval '10 minutes' or t < now() - interval '30 days' then
    raise exception 'bad timestamp' using errcode = '22007';
  end if;
  -- Тым жиі жіберуден қорғау: бір құрылғыдан минутына бір өлшем
  if d.last_seen_at is not null and d.last_seen_at > now() - interval '50 seconds' then
    raise exception 'too frequent' using errcode = '54000';
  end if;

  rid := 'dev-' || d.id || '-' || to_char(t at time zone 'UTC', 'YYYYMMDD"T"HH24MISS');
  insert into public.zk_sensor_readings (id, classroom_id, measured_at, data, created_by)
  values (
    rid, d.classroom_id, t,
    jsonb_build_object(
      'id', rid,
      'classroomId', d.classroom_id,
      'status', 'user',
      'timestamp', to_char(t at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'co2Ppm', round(p_co2),
      'temperatureC', round(p_temperature, 1),
      'humidityPct', round(p_humidity),
      'pm25UgM3', round(p_pm25, 1),
      'occupants', null,
      'ventilation', null,
      'ventilationEvent', false,
      'note', '',
      'source', 'sensor'
    ),
    null
  )
  on conflict (id) do nothing;
  update public.zk_devices set last_seen_at = now() where id = d.id;
  return rid;
end;
$$;
revoke all on function public.zk_ingest_reading(text, numeric, numeric, numeric, numeric, timestamptz) from public;
grant execute on function public.zk_ingest_reading(text, numeric, numeric, numeric, numeric, timestamptz) to anon, authenticated;
