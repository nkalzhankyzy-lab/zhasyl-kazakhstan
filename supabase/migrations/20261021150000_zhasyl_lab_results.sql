-- Зертханадағы кабинет тәжірибелерінің нәтижелері (CO₂ индикаторы, гүлдің су буландыруы, лептесік).
create table if not exists public.zk_lab_results (
  id text primary key,
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zk_lab_results_size check (pg_column_size(data) < 50000)
);
alter table public.zk_lab_results enable row level security;
create policy "zk_lab_results: барлығы көреді" on public.zk_lab_results for select to anon, authenticated using (true);
create policy "zk_lab_results: редактор қосады" on public.zk_lab_results for insert to authenticated with check ((select public.zk_is_editor()));
create policy "zk_lab_results: редактор өзгертеді" on public.zk_lab_results for update to authenticated using ((select public.zk_is_editor())) with check ((select public.zk_is_editor()));
create policy "zk_lab_results: редактор өшіреді" on public.zk_lab_results for delete to authenticated using ((select public.zk_is_editor()));
create trigger zk_lab_results_touch before update on public.zk_lab_results for each row execute function public.zk_touch_updated_at();
create index if not exists zk_lab_results_created_by on public.zk_lab_results (created_by);
alter publication supabase_realtime add table public.zk_lab_results;
