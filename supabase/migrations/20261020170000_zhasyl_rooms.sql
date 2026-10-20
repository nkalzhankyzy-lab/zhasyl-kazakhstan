-- Кабинеттер: көлемі, терезе бағыты және ондағы гүлдер (data.plants ішінде).
create table if not exists public.zk_rooms (
  id text primary key,
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zk_rooms_size check (pg_column_size(data) < 1500000)
);
alter table public.zk_rooms enable row level security;
create policy "zk_rooms: барлығы көреді" on public.zk_rooms for select to anon, authenticated using (true);
create policy "zk_rooms: редактор қосады" on public.zk_rooms for insert to authenticated with check ((select public.zk_is_editor()));
create policy "zk_rooms: редактор өзгертеді" on public.zk_rooms for update to authenticated using ((select public.zk_is_editor())) with check ((select public.zk_is_editor()));
create policy "zk_rooms: редактор өшіреді" on public.zk_rooms for delete to authenticated using ((select public.zk_is_editor()));
create trigger zk_rooms_touch before update on public.zk_rooms for each row execute function public.zk_touch_updated_at();
create index if not exists zk_rooms_created_by on public.zk_rooms (created_by);
alter publication supabase_realtime add table public.zk_rooms;
