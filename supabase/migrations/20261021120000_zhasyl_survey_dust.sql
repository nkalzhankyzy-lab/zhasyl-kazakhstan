-- Оқушылар сауалнамасы (атсыз) және шаң тәжірибесі.
-- Сауалнаманы кірмеген оқушы да жібереді, бірақ тек zk_submit_survey функциясы арқылы (тексерумен).
-- Өзгерту мен өшіру — тек редактор (мұғалім).

create table if not exists public.zk_survey (
  id text primary key,
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zk_survey_size check (pg_column_size(data) < 20000)
);
alter table public.zk_survey enable row level security;
create policy "zk_survey: барлығы көреді" on public.zk_survey for select to anon, authenticated using (true);
create policy "zk_survey: редактор қосады" on public.zk_survey for insert to authenticated with check ((select public.zk_is_editor()));
create policy "zk_survey: редактор өзгертеді" on public.zk_survey for update to authenticated using ((select public.zk_is_editor())) with check ((select public.zk_is_editor()));
create policy "zk_survey: редактор өшіреді" on public.zk_survey for delete to authenticated using ((select public.zk_is_editor()));
create trigger zk_survey_touch before update on public.zk_survey for each row execute function public.zk_touch_updated_at();
create index if not exists zk_survey_created_by on public.zk_survey (created_by);
create index if not exists zk_survey_created_at on public.zk_survey (created_at);
alter publication supabase_realtime add table public.zk_survey;

create or replace function public.zk_submit_survey(
  p_room text,
  p_class text,
  p_air int,
  p_energy int,
  p_head int,
  p_dry int,
  p_mood int
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid text;
  cls text := btrim(coalesce(p_class, ''));
  local_date text := to_char(now() at time zone 'Asia/Qyzylorda', 'YYYY-MM-DD');
  ts text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  if not exists (select 1 from public.zk_rooms where id = p_room) then
    raise exception 'unknown room' using errcode = '22023';
  end if;
  if length(cls) = 0 or length(cls) > 20 then
    raise exception 'bad class' using errcode = '22023';
  end if;
  if p_air not between 1 and 5 or p_energy not between 1 and 5 or p_head not between 1 and 5
     or p_dry not between 1 and 5 or p_mood not between 1 and 5 then
    raise exception 'value out of range' using errcode = '22003';
  end if;
  -- Қорғау: бір кабинетке тәулігіне 300-ден көп жауап қабылданбайды
  if (select count(*) from public.zk_survey where data->>'roomId' = p_room and data->>'date' = local_date) >= 300 then
    raise exception 'too many' using errcode = '54000';
  end if;
  rid := 'survey-' || replace(gen_random_uuid()::text, '-', '');
  insert into public.zk_survey (id, data, created_by)
  values (
    rid,
    jsonb_build_object(
      'id', rid, 'status', 'user', 'roomId', p_room, 'className', cls, 'date', local_date,
      'air', p_air, 'energy', p_energy, 'head', p_head, 'dry', p_dry, 'mood', p_mood,
      'createdAt', ts, 'updatedAt', ts
    ),
    null
  );
  return rid;
end;
$$;
revoke all on function public.zk_submit_survey(text, text, int, int, int, int, int) from public;
grant execute on function public.zk_submit_survey(text, text, int, int, int, int, int) to anon, authenticated;

-- Шаң тәжірибесі: ақ қағазға жиналған шаң бөлшектерінің саны (1 см²-дегі орташа)
create table if not exists public.zk_dust (
  id text primary key,
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zk_dust_size check (pg_column_size(data) < 50000)
);
alter table public.zk_dust enable row level security;
create policy "zk_dust: барлығы көреді" on public.zk_dust for select to anon, authenticated using (true);
create policy "zk_dust: редактор қосады" on public.zk_dust for insert to authenticated with check ((select public.zk_is_editor()));
create policy "zk_dust: редактор өзгертеді" on public.zk_dust for update to authenticated using ((select public.zk_is_editor())) with check ((select public.zk_is_editor()));
create policy "zk_dust: редактор өшіреді" on public.zk_dust for delete to authenticated using ((select public.zk_is_editor()));
create trigger zk_dust_touch before update on public.zk_dust for each row execute function public.zk_touch_updated_at();
create index if not exists zk_dust_created_by on public.zk_dust (created_by);
alter publication supabase_realtime add table public.zk_dust;
