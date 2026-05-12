-- S-Fleet Fantasy War ⚔️
-- Rulează tot scriptul în Supabase Dashboard > SQL Editor > New query.

create table if not exists public.game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  player_name text not null default 'Lord S-Fleet',
  class_name text not null default 'Knight',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;

drop policy if exists "Players can read own save" on public.game_saves;
create policy "Players can read own save"
on public.game_saves
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Players can insert own save" on public.game_saves;
create policy "Players can insert own save"
on public.game_saves
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Players can update own save" on public.game_saves;
create policy "Players can update own save"
on public.game_saves
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Players can delete own save" on public.game_saves;
create policy "Players can delete own save"
on public.game_saves
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_game_saves_updated_at on public.game_saves;
create trigger set_game_saves_updated_at
before update on public.game_saves
for each row
execute function public.set_updated_at();

create index if not exists game_saves_user_id_idx on public.game_saves(user_id);
