-- Мектеп ауласы: ағаштар, бұталар, гүлзарлар топтары және олардың картадағы орны.
create table if not exists public.zk_yard_items (
  id text primary key,
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zk_yard_items_size check (pg_column_size(data) < 1500000)
);
alter table public.zk_yard_items enable row level security;
create policy "zk_yard_items: барлығы көреді" on public.zk_yard_items for select to anon, authenticated using (true);
create policy "zk_yard_items: редактор қосады" on public.zk_yard_items for insert to authenticated with check ((select public.zk_is_editor()));
create policy "zk_yard_items: редактор өзгертеді" on public.zk_yard_items for update to authenticated using ((select public.zk_is_editor())) with check ((select public.zk_is_editor()));
create policy "zk_yard_items: редактор өшіреді" on public.zk_yard_items for delete to authenticated using ((select public.zk_is_editor()));
create trigger zk_yard_items_touch before update on public.zk_yard_items for each row execute function public.zk_touch_updated_at();
create index if not exists zk_yard_items_created_by on public.zk_yard_items (created_by);
alter publication supabase_realtime add table public.zk_yard_items;
