-- S-Fleet Fantasy War ⚔️ — Update 8
-- Rulează tot scriptul în Supabase Dashboard > SQL Editor > New query > Run.
-- Păstrează salvările existente și adaugă Marketplace pentru item trading.

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

-- Marketplace / item trading
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  seller_name text not null default 'Unknown Hero',
  item jsonb not null,
  price_gold int not null default 0 check (price_gold >= 0),
  price_diamonds int not null default 0 check (price_diamonds >= 0),
  status text not null default 'active' check (status in ('active', 'sold', 'cancelled')),
  buyer_id uuid references auth.users(id) on delete set null,
  proceeds_claimed boolean not null default false,
  created_at timestamptz not null default now(),
  sold_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint marketplace_has_price check (price_gold > 0 or price_diamonds > 0)
);

alter table public.marketplace_listings enable row level security;

drop trigger if exists set_marketplace_listings_updated_at on public.marketplace_listings;
create trigger set_marketplace_listings_updated_at
before update on public.marketplace_listings
for each row
execute function public.set_updated_at();

drop policy if exists "Players can view marketplace" on public.marketplace_listings;
create policy "Players can view marketplace"
on public.marketplace_listings
for select
to authenticated
using (status = 'active' or seller_id = auth.uid() or buyer_id = auth.uid());

drop policy if exists "Players can create own listings" on public.marketplace_listings;
create policy "Players can create own listings"
on public.marketplace_listings
for insert
to authenticated
with check (seller_id = auth.uid() and status = 'active');

create index if not exists marketplace_active_idx on public.marketplace_listings(status, created_at desc);
create index if not exists marketplace_seller_idx on public.marketplace_listings(seller_id, status);

grant select, insert on public.marketplace_listings to authenticated;

create or replace function public.buy_market_listing(listing_id uuid)
returns table (
  id uuid,
  item jsonb,
  price_gold int,
  price_diamonds int,
  seller_id uuid
)
language sql
security definer
set search_path = public
as $$
  update public.marketplace_listings ml
  set status = 'sold',
      buyer_id = auth.uid(),
      sold_at = now(),
      updated_at = now()
  where ml.id = $1
    and ml.status = 'active'
    and ml.seller_id <> auth.uid()
  returning ml.id, ml.item, ml.price_gold, ml.price_diamonds, ml.seller_id;
$$;

grant execute on function public.buy_market_listing(uuid) to authenticated;

create or replace function public.cancel_market_listing(listing_id uuid)
returns table (
  id uuid,
  item jsonb
)
language sql
security definer
set search_path = public
as $$
  update public.marketplace_listings ml
  set status = 'cancelled', updated_at = now()
  where ml.id = $1
    and ml.status = 'active'
    and ml.seller_id = auth.uid()
  returning ml.id, ml.item;
$$;

grant execute on function public.cancel_market_listing(uuid) to authenticated;

create or replace function public.claim_market_sales()
returns table (
  claimed_gold int,
  claimed_diamonds int,
  sales_count int
)
language sql
security definer
set search_path = public
as $$
  with updated as (
    update public.marketplace_listings ml
    set proceeds_claimed = true, updated_at = now()
    where ml.seller_id = auth.uid()
      and ml.status = 'sold'
      and ml.proceeds_claimed = false
    returning ml.price_gold, ml.price_diamonds
  )
  select
    coalesce(sum(price_gold), 0)::int as claimed_gold,
    coalesce(sum(price_diamonds), 0)::int as claimed_diamonds,
    count(*)::int as sales_count
  from updated;
$$;

grant execute on function public.claim_market_sales() to authenticated;

-- S-Fleet Fantasy War ⚔️ — Update 10
-- Admin pe email, Guild / Alianță, City Attacks cu 10 minute travel time + Shield Protection.

-- Admin users: adaugă manual emailul tău aici după ce rulezi scriptul:
-- insert into public.admin_users(email) values ('EMAILUL_TAU') on conflict (email) do nothing;
create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users
for select
to authenticated
using (lower(email) = lower(coalesce(auth.jwt()->>'email', '')));

create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.admin_users au
    where lower(au.email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

grant execute on function public.is_current_user_admin() to authenticated;

create or replace function public.admin_list_players()
returns table (
  user_id uuid,
  email text,
  player_name text,
  class_name text,
  data jsonb,
  public_profile jsonb,
  updated_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  select
    gs.user_id,
    au.email,
    gs.player_name,
    gs.class_name,
    gs.data,
    gs.public_profile,
    gs.updated_at
  from public.game_saves gs
  left join auth.users au on au.id = gs.user_id
  where public.is_current_user_admin()
  order by gs.updated_at desc;
$$;

grant execute on function public.admin_list_players() to authenticated;

create or replace function public.admin_update_player_data(target_user_id uuid, new_data jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Not admin';
  end if;

  update public.game_saves
  set
    data = new_data,
    player_name = coalesce(nullif(new_data->>'playerName', ''), player_name),
    class_name = coalesce(nullif(new_data->>'className', ''), class_name),
    updated_at = now()
  where user_id = target_user_id;

  return found;
end;
$$;

grant execute on function public.admin_update_player_data(uuid, jsonb) to authenticated;

-- Guilds / alliances
create table if not exists public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  tag text not null unique,
  leader_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guild_members (
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'officer', 'member')),
  joined_at timestamptz not null default now(),
  primary key (user_id)
);

alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;

drop trigger if exists set_guilds_updated_at on public.guilds;
create trigger set_guilds_updated_at
before update on public.guilds
for each row
execute function public.set_updated_at();

drop policy if exists "Players can view guilds" on public.guilds;
create policy "Players can view guilds"
on public.guilds
for select
to authenticated
using (true);

drop policy if exists "Players can view guild members" on public.guild_members;
create policy "Players can view guild members"
on public.guild_members
for select
to authenticated
using (true);

create or replace function public.get_guilds(limit_count int default 50)
returns table (
  id uuid,
  name text,
  tag text,
  leader_id uuid,
  members_count int,
  total_power int,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    g.id,
    g.name,
    g.tag,
    g.leader_id,
    count(gm.user_id)::int as members_count,
    coalesce(sum(coalesce((gs.public_profile->>'power')::int, 0)), 0)::int as total_power,
    g.created_at
  from public.guilds g
  left join public.guild_members gm on gm.guild_id = g.id
  left join public.game_saves gs on gs.user_id = gm.user_id
  group by g.id
  order by total_power desc, members_count desc, g.created_at asc
  limit greatest(1, least(limit_count, 100));
$$;

grant execute on function public.get_guilds(int) to authenticated;

create or replace function public.create_guild(guild_name text, guild_tag text)
returns table (id uuid, name text, tag text, role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  clean_name text := trim(guild_name);
  clean_tag text := upper(trim(guild_tag));
begin
  if clean_name = '' or clean_tag = '' then
    raise exception 'Guild name and tag are required';
  end if;

  if exists(select 1 from public.guild_members where user_id = auth.uid()) then
    raise exception 'You are already in a guild';
  end if;

  insert into public.guilds(name, tag, leader_id)
  values (clean_name, clean_tag, auth.uid())
  returning guilds.id into new_id;

  insert into public.guild_members(guild_id, user_id, role)
  values (new_id, auth.uid(), 'leader');

  return query select g.id, g.name, g.tag, 'leader'::text from public.guilds g where g.id = new_id;
end;
$$;

grant execute on function public.create_guild(text, text) to authenticated;

create or replace function public.join_guild(target_guild_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists(select 1 from public.guild_members where user_id = auth.uid()) then
    raise exception 'You are already in a guild';
  end if;

  if not exists(select 1 from public.guilds where id = target_guild_id) then
    raise exception 'Guild not found';
  end if;

  insert into public.guild_members(guild_id, user_id, role)
  values (target_guild_id, auth.uid(), 'member');

  return true;
end;
$$;

grant execute on function public.join_guild(uuid) to authenticated;

create or replace function public.leave_guild()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.guild_members where user_id = auth.uid();
  return true;
end;
$$;

grant execute on function public.leave_guild() to authenticated;

-- City attacks: travel time 10 minutes
create table if not exists public.city_attacks (
  id uuid primary key default gen_random_uuid(),
  attacker_id uuid not null references auth.users(id) on delete cascade,
  defender_id uuid not null references auth.users(id) on delete cascade,
  attacker_name text not null default 'Unknown Attacker',
  defender_name text not null default 'Unknown Defender',
  attack_power int not null default 0,
  defense_power_at_launch int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'cancelled')),
  lands_at timestamptz not null default (now() + interval '10 minutes'),
  resolved_at timestamptz,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.city_attacks enable row level security;

drop trigger if exists set_city_attacks_updated_at on public.city_attacks;
create trigger set_city_attacks_updated_at
before update on public.city_attacks
for each row
execute function public.set_updated_at();

drop policy if exists "Players can view own city attacks" on public.city_attacks;
create policy "Players can view own city attacks"
on public.city_attacks
for select
to authenticated
using (attacker_id = auth.uid() or defender_id = auth.uid());

create index if not exists city_attacks_player_status_idx on public.city_attacks(attacker_id, defender_id, status, lands_at);

create or replace function public.launch_city_attack(target_user_id uuid)
returns table (
  id uuid,
  attacker_id uuid,
  defender_id uuid,
  attacker_name text,
  defender_name text,
  attack_power int,
  defense_power_at_launch int,
  status text,
  lands_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  attacker_profile jsonb;
  defender_profile jsonb;
  new_id uuid;
begin
  if target_user_id = auth.uid() then
    raise exception 'You cannot attack your own city';
  end if;

  select public_profile into attacker_profile from public.game_saves where user_id = auth.uid();
  select public_profile into defender_profile from public.game_saves where user_id = target_user_id;

  if defender_profile is null then
    raise exception 'Target player not found';
  end if;

  if defender_profile ? 'shieldUntil'
     and nullif(defender_profile->>'shieldUntil', '') is not null
     and (defender_profile->>'shieldUntil')::timestamptz > now() then
    raise exception 'Target city has active shield protection';
  end if;

  insert into public.city_attacks(
    attacker_id,
    defender_id,
    attacker_name,
    defender_name,
    attack_power,
    defense_power_at_launch,
    lands_at
  ) values (
    auth.uid(),
    target_user_id,
    coalesce(attacker_profile->>'playerName', 'Unknown Attacker'),
    coalesce(defender_profile->>'playerName', 'Unknown Defender'),
    greatest(50, coalesce((attacker_profile->>'cityAttackPower')::int, coalesce((attacker_profile->>'power')::int, 100))),
    greatest(50, coalesce((defender_profile->>'cityDefensePower')::int, coalesce((defender_profile->>'power')::int, 100))),
    now() + interval '10 minutes'
  ) returning city_attacks.id into new_id;

  return query
  select ca.id, ca.attacker_id, ca.defender_id, ca.attacker_name, ca.defender_name,
         ca.attack_power, ca.defense_power_at_launch, ca.status, ca.lands_at, ca.created_at
  from public.city_attacks ca
  where ca.id = new_id;
end;
$$;

grant execute on function public.launch_city_attack(uuid) to authenticated;

create or replace function public.resolve_due_city_attacks()
returns table (
  id uuid,
  attacker_id uuid,
  defender_id uuid,
  attacker_name text,
  defender_name text,
  attack_power int,
  defense_power_at_launch int,
  status text,
  lands_at timestamptz,
  resolved_at timestamptz,
  result jsonb
)
language sql
security definer
set search_path = public
as $$
  with due as (
    select ca.*,
      coalesce((d.public_profile->>'cityDefensePower')::int, ca.defense_power_at_launch) as current_defense,
      coalesce((d.public_profile->>'wallLevel')::int, 1) as wall_level,
      coalesce((d.public_profile->>'watchtowerLevel')::int, 1) as watchtower_level
    from public.city_attacks ca
    left join public.game_saves d on d.user_id = ca.defender_id
    where ca.status = 'pending'
      and ca.lands_at <= now()
      and (ca.attacker_id = auth.uid() or ca.defender_id = auth.uid())
  ), updated as (
    update public.city_attacks ca
    set status = 'resolved',
        resolved_at = now(),
        result = jsonb_build_object(
          'attackerWin', due.attack_power > due.current_defense,
          'attackPower', due.attack_power,
          'defensePower', due.current_defense,
          'wallLevel', due.wall_level,
          'watchtowerLevel', due.watchtower_level
        ),
        updated_at = now()
    from due
    where ca.id = due.id
    returning ca.*
  )
  select id, attacker_id, defender_id, attacker_name, defender_name, attack_power, defense_power_at_launch, status, lands_at, resolved_at, result
  from updated
  order by resolved_at desc;
$$;

grant execute on function public.resolve_due_city_attacks() to authenticated;

create or replace function public.get_city_attacks_for_player()
returns table (
  id uuid,
  attacker_id uuid,
  defender_id uuid,
  attacker_name text,
  defender_name text,
  attack_power int,
  defense_power_at_launch int,
  status text,
  lands_at timestamptz,
  resolved_at timestamptz,
  result jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select ca.id, ca.attacker_id, ca.defender_id, ca.attacker_name, ca.defender_name,
         ca.attack_power, ca.defense_power_at_launch, ca.status, ca.lands_at, ca.resolved_at, ca.result, ca.created_at
  from public.city_attacks ca
  where (ca.attacker_id = auth.uid() or ca.defender_id = auth.uid())
    and (ca.status = 'pending' or ca.created_at >= now() - interval '2 days')
  order by ca.created_at desc
  limit 100;
$$;

grant execute on function public.get_city_attacks_for_player() to authenticated;
