-- Экопаспорт: сабақ журналы (кабинет, оқушы саны, басы мен соңындағы өлшемдер).
create table if not exists public.zk_lessons (
  id text primary key,
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zk_lessons_size check (pg_column_size(data) < 1500000)
);
alter table public.zk_lessons enable row level security;
create policy "zk_lessons: барлығы көреді" on public.zk_lessons for select to anon, authenticated using (true);
create policy "zk_lessons: редактор қосады" on public.zk_lessons for insert to authenticated with check ((select public.zk_is_editor()));
create policy "zk_lessons: редактор өзгертеді" on public.zk_lessons for update to authenticated using ((select public.zk_is_editor())) with check ((select public.zk_is_editor()));
create policy "zk_lessons: редактор өшіреді" on public.zk_lessons for delete to authenticated using ((select public.zk_is_editor()));
create trigger zk_lessons_touch before update on public.zk_lessons for each row execute function public.zk_touch_updated_at();
create index if not exists zk_lessons_created_by on public.zk_lessons (created_by);
alter publication supabase_realtime add table public.zk_lessons;
