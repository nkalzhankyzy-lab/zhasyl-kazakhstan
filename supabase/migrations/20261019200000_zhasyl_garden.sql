-- «Менің гүлім»: сынып гүлдері және олардың бақылау жазбалары (жазбалар data.logs ішінде).
create table if not exists public.zk_garden_plants (
  id text primary key,
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zk_garden_plants_size check (pg_column_size(data) < 1500000)
);
alter table public.zk_garden_plants enable row level security;
create policy "zk_garden_plants: барлығы көреді" on public.zk_garden_plants for select to anon, authenticated using (true);
create policy "zk_garden_plants: редактор қосады" on public.zk_garden_plants for insert to authenticated with check ((select public.zk_is_editor()));
create policy "zk_garden_plants: редактор өзгертеді" on public.zk_garden_plants for update to authenticated using ((select public.zk_is_editor())) with check ((select public.zk_is_editor()));
create policy "zk_garden_plants: редактор өшіреді" on public.zk_garden_plants for delete to authenticated using ((select public.zk_is_editor()));
create trigger zk_garden_plants_touch before update on public.zk_garden_plants for each row execute function public.zk_touch_updated_at();
create index if not exists zk_garden_plants_created_by on public.zk_garden_plants (created_by);
alter publication supabase_realtime add table public.zk_garden_plants;
