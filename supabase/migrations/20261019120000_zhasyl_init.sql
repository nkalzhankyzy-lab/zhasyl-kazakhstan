-- Жасыл Қазақстан: пайдаланушы деректерінің кестелері.
-- Көру — барлығына (anon). Енгізу/өзгерту/өшіру — тек zk_editors тізіміндегі мұғалімдерге.

-- Редакторлар тізімі. Мұғалімді қосу:
--   insert into public.zk_editors (user_id) select id from auth.users where email = 'teacher@example.kz';
create table if not exists public.zk_editors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);
alter table public.zk_editors enable row level security;
create policy "zk_editors: өз жолын көру" on public.zk_editors
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.zk_is_editor()
returns boolean
language sql
stable
security invoker -- zk_editors RLS ережесі пайдаланушыға өз жолын ғана көрсетеді
set search_path = ''
as $$
  select exists (select 1 from public.zk_editors where user_id = (select auth.uid()));
$$;
revoke all on function public.zk_is_editor() from public, anon;
grant execute on function public.zk_is_editor() to authenticated;

create or replace function public.zk_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Топырақ үлгілері
create table if not exists public.zk_soil_samples (
  id text primary key,
  region_id text,
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zk_soil_samples_size check (pg_column_size(data) < 1500000)
);

-- Кабинет өлшемдері
create table if not exists public.zk_sensor_readings (
  id text primary key,
  classroom_id text not null,
  measured_at timestamptz not null,
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zk_sensor_readings_size check (pg_column_size(data) < 20000)
);
create index if not exists zk_sensor_readings_classroom_time on public.zk_sensor_readings (classroom_id, measured_at);

-- Зерттеу күнделігі
create table if not exists public.zk_research_entries (
  id text primary key,
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zk_research_entries_size check (pg_column_size(data) < 200000)
);

-- Кабинеттің нақты фотосы (ықшамдалған data URL)
create table if not exists public.zk_classroom_photos (
  classroom_id text primary key,
  photo text not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zk_classroom_photos_size check (length(photo) < 3000000 and photo like 'data:image/%')
);

do $$
declare t text;
begin
  foreach t in array array['zk_soil_samples', 'zk_sensor_readings', 'zk_research_entries', 'zk_classroom_photos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: барлығы көреді" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s: редактор қосады" on public.%I for insert to authenticated with check ((select public.zk_is_editor()))', t, t);
    execute format('create policy "%s: редактор өзгертеді" on public.%I for update to authenticated using ((select public.zk_is_editor())) with check ((select public.zk_is_editor()))', t, t);
    execute format('create policy "%s: редактор өшіреді" on public.%I for delete to authenticated using ((select public.zk_is_editor()))', t, t);
    execute format('create trigger %I before update on public.%I for each row execute function public.zk_touch_updated_at()', t || '_touch', t);
    execute format('alter publication supabase_realtime add table public.%I', t);
  end loop;
end $$;

create index if not exists zk_soil_samples_created_by on public.zk_soil_samples (created_by);
create index if not exists zk_sensor_readings_created_by on public.zk_sensor_readings (created_by);
create index if not exists zk_research_entries_created_by on public.zk_research_entries (created_by);
create index if not exists zk_classroom_photos_created_by on public.zk_classroom_photos (created_by);
