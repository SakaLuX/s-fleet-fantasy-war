-- S-Fleet Fantasy War ⚔️ — Update 7
-- Rulează tot scriptul în Supabase Dashboard > SQL Editor > New query > Run.
-- Păstrează salvările existente și adaugă profil public pentru Leaderboard + PvP.

create table if not exists public.game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  player_name text not null default 'Lord S-Fleet',
  class_name text not null default 'Knight',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_saves add column if not exists public_profile jsonb not null default '{}'::jsonb;

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
create index if not exists game_saves_public_power_idx on public.game_saves(((public_profile->>'power')::int));

create or replace function public.get_public_players(limit_count int default 50)
returns table (
  user_id uuid,
  player_name text,
  class_name text,
  public_profile jsonb,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    gs.user_id,
    gs.player_name,
    gs.class_name,
    gs.public_profile,
    gs.updated_at
  from public.game_saves gs
  where gs.public_profile is not null
    and gs.public_profile <> '{}'::jsonb
  order by coalesce((gs.public_profile->>'power')::int, 0) desc, gs.updated_at desc
  limit greatest(1, least(limit_count, 100));
$$;

grant execute on function public.get_public_players(int) to authenticated;
