-- S-Fleet Fantasy War ⚔️ — Update 15
-- Run the full script in Supabase Dashboard > SQL Editor > New query > Run.
-- Keeps existing saves and adds VIP, Guild Wars, World Boss, Auction House and anti-friendly-fire protection.

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
-- Admin pe email, Guild / Alliance, City Attacks cu 10 minute travel time + Shield Protection.

-- Admin users: manually add your email here after running the script:
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

  if attacker_profile ? 'guildId'
     and defender_profile ? 'guildId'
     and nullif(attacker_profile->>'guildId', '') is not null
     and nullif(defender_profile->>'guildId', '') is not null
     and attacker_profile->>'guildId' = defender_profile->>'guildId' then
    raise exception 'You cannot attack a member from the same guild';
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
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  attacker_data jsonb;
  defender_data jsonb;
  attacker_profile jsonb;
  defender_profile jsonb;

  remaining int;
  wall_before int;
  wall_after int;
  wall_defense int;
  wall_loss int;
  wall_breached boolean;

  citadel_before int;
  citadel_after int;
  citadel_defense int;
  citadel_breached boolean;

  mine_before int;
  mine_after int;
  mine_defense int;
  mine_breached boolean;

  lumber_before int;
  lumber_after int;
  lumber_defense int;
  lumber_breached boolean;

  tower_level int;
  defense_power int;
  attacker_win boolean;
  steal_gold int;
  steal_wood int;
  steal_crystals int;
  steal_diamonds int;
  gold_pct numeric := 0;
  wood_pct numeric := 0;
  crystals_pct numeric := 0;
  diamonds_pct numeric := 0;

  def_gold int;
  def_wood int;
  def_crystals int;
  def_diamonds int;
  def_scoins int;
  atk_gold int;
  atk_wood int;
  atk_crystals int;
  atk_diamonds int;
  atk_scoins int;
  res jsonb;
  damage jsonb;
  old_stat int;
  new_result jsonb;
begin
  for rec in
    select ca.*
    from public.city_attacks ca
    where ca.status = 'pending'
      and ca.lands_at <= now()
      and (ca.attacker_id = auth.uid() or ca.defender_id = auth.uid())
    order by ca.lands_at asc
  loop
    select data, public_profile into attacker_data, attacker_profile
    from public.game_saves
    where user_id = rec.attacker_id
    for update;

    select data, public_profile into defender_data, defender_profile
    from public.game_saves
    where user_id = rec.defender_id
    for update;

    if defender_data is null or attacker_data is null then
      update public.city_attacks ca
      set status = 'cancelled', resolved_at = now(), result = jsonb_build_object('cancelled', true, 'reason', 'Missing save data'), updated_at = now()
      where ca.id = rec.id;
      continue;
    end if;

    wall_before := greatest(1, coalesce(nullif(defender_data #>> '{buildings,wall,level}', '')::int, coalesce(nullif(defender_profile->>'wallLevel','')::int, 1)));
    citadel_before := greatest(1, coalesce(nullif(defender_data #>> '{buildings,citadel,level}', '')::int, coalesce(nullif(defender_profile->>'citadelLevel','')::int, 1)));
    mine_before := greatest(1, coalesce(nullif(defender_data #>> '{buildings,mine,level}', '')::int, coalesce(nullif(defender_profile->>'goldMineLevel','')::int, 1)));
    lumber_before := greatest(1, coalesce(nullif(defender_data #>> '{buildings,lumber,level}', '')::int, coalesce(nullif(defender_profile->>'woodCollectorLevel','')::int, 1)));
    tower_level := greatest(1, coalesce(nullif(defender_data #>> '{buildings,watchtower,level}', '')::int, coalesce(nullif(defender_profile->>'watchtowerLevel','')::int, 1)));

    wall_after := wall_before;
    citadel_after := citadel_before;
    mine_after := mine_before;
    lumber_after := lumber_before;
    wall_breached := false;
    citadel_breached := false;
    mine_breached := false;
    lumber_breached := false;

    remaining := greatest(0, rec.attack_power);
    wall_defense := greatest(120, wall_before * 520 + tower_level * 60);

    if remaining > wall_defense then
      wall_breached := true;
      wall_after := 1;
      remaining := remaining - wall_defense;
    else
      wall_loss := greatest(1, floor(wall_before * least(1.0, remaining::numeric / wall_defense::numeric))::int);
      wall_after := greatest(1, wall_before - wall_loss);
      remaining := 0;
    end if;

    if wall_breached and remaining > 0 then
      citadel_defense := greatest(160, citadel_before * 410);
      if remaining > citadel_defense then
        citadel_breached := true;
        citadel_after := 1;
        remaining := remaining - citadel_defense;
      else
        citadel_after := greatest(1, citadel_before - greatest(1, floor(citadel_before * least(1.0, remaining::numeric / citadel_defense::numeric))::int));
        remaining := 0;
      end if;
    end if;

    if wall_breached and remaining > 0 then
      mine_defense := greatest(120, mine_before * 310);
      if remaining > mine_defense then
        mine_breached := true;
        mine_after := 1;
        remaining := remaining - mine_defense;
      else
        mine_after := greatest(1, mine_before - greatest(1, floor(mine_before * least(1.0, remaining::numeric / mine_defense::numeric))::int));
        remaining := 0;
      end if;
    end if;

    if wall_breached and remaining > 0 then
      lumber_defense := greatest(120, lumber_before * 310);
      if remaining > lumber_defense then
        lumber_breached := true;
        lumber_after := 1;
        remaining := remaining - lumber_defense;
      else
        lumber_after := greatest(1, lumber_before - greatest(1, floor(lumber_before * least(1.0, remaining::numeric / lumber_defense::numeric))::int));
        remaining := 0;
      end if;
    end if;

    attacker_win := wall_breached;

    if wall_breached then
      gold_pct := gold_pct + 0.03;
      wood_pct := wood_pct + 0.03;
      crystals_pct := crystals_pct + 0.01;
    end if;
    if citadel_breached then
      gold_pct := gold_pct + 0.05;
      wood_pct := wood_pct + 0.05;
      crystals_pct := crystals_pct + 0.03;
      diamonds_pct := diamonds_pct + 0.02;
    end if;
    if mine_breached then
      gold_pct := gold_pct + 0.15;
      crystals_pct := crystals_pct + 0.02;
      diamonds_pct := diamonds_pct + 0.01;
    end if;
    if lumber_breached then
      wood_pct := wood_pct + 0.15;
      crystals_pct := crystals_pct + 0.02;
      diamonds_pct := diamonds_pct + 0.01;
    end if;

    gold_pct := least(gold_pct, 0.35);
    wood_pct := least(wood_pct, 0.35);
    crystals_pct := least(crystals_pct, 0.18);
    diamonds_pct := least(diamonds_pct, 0.08);

    def_gold := greatest(0, coalesce(nullif(defender_data #>> '{resources,gold}', '')::int, 0));
    def_wood := greatest(0, coalesce(nullif(defender_data #>> '{resources,wood}', '')::int, 0));
    def_crystals := greatest(0, coalesce(nullif(defender_data #>> '{resources,crystals}', '')::int, 0));
    def_diamonds := greatest(0, coalesce(nullif(defender_data #>> '{resources,diamonds}', '')::int, 0));
    def_scoins := greatest(0, coalesce(nullif(defender_data #>> '{resources,sCoins}', '')::int, 0));

    atk_gold := greatest(0, coalesce(nullif(attacker_data #>> '{resources,gold}', '')::int, 0));
    atk_wood := greatest(0, coalesce(nullif(attacker_data #>> '{resources,wood}', '')::int, 0));
    atk_crystals := greatest(0, coalesce(nullif(attacker_data #>> '{resources,crystals}', '')::int, 0));
    atk_diamonds := greatest(0, coalesce(nullif(attacker_data #>> '{resources,diamonds}', '')::int, 0));
    atk_scoins := greatest(0, coalesce(nullif(attacker_data #>> '{resources,sCoins}', '')::int, 0));

    steal_gold := floor(def_gold * gold_pct)::int;
    steal_wood := floor(def_wood * wood_pct)::int;
    steal_crystals := floor(def_crystals * crystals_pct)::int;
    steal_diamonds := floor(def_diamonds * diamonds_pct)::int;

    -- Defender loses stolen resources, but S-Coins are protected forever.
    res := coalesce(defender_data->'resources', '{}'::jsonb) || jsonb_build_object(
      'gold', greatest(0, def_gold - steal_gold),
      'wood', greatest(0, def_wood - steal_wood),
      'crystals', greatest(0, def_crystals - steal_crystals),
      'diamonds', greatest(0, def_diamonds - steal_diamonds),
      'sCoins', def_scoins
    );
    defender_data := jsonb_set(defender_data, '{resources}', res, true);

    defender_data := jsonb_set(
      defender_data,
      '{buildings}',
      coalesce(defender_data->'buildings', '{}'::jsonb) || jsonb_build_object(
        'wall', coalesce(defender_data #> '{buildings,wall}', '{}'::jsonb) || jsonb_build_object('level', wall_after),
        'citadel', coalesce(defender_data #> '{buildings,citadel}', '{}'::jsonb) || jsonb_build_object('level', citadel_after),
        'mine', coalesce(defender_data #> '{buildings,mine}', '{}'::jsonb) || jsonb_build_object('level', mine_after),
        'lumber', coalesce(defender_data #> '{buildings,lumber}', '{}'::jsonb) || jsonb_build_object('level', lumber_after)
      ),
      true
    );

    old_stat := greatest(0, coalesce(nullif(defender_data #>> '{stats,cityDefenseWins}', '')::int, 0));
    if attacker_win then
      old_stat := greatest(0, coalesce(nullif(defender_data #>> '{stats,cityDefenseLosses}', '')::int, 0));
      defender_data := jsonb_set(defender_data, '{stats}', coalesce(defender_data->'stats','{}'::jsonb) || jsonb_build_object('cityDefenseLosses', old_stat + 1), true);
    else
      defender_data := jsonb_set(defender_data, '{stats}', coalesce(defender_data->'stats','{}'::jsonb) || jsonb_build_object('cityDefenseWins', old_stat + 1), true);
    end if;

    -- Attacker gains only non-premium stolen resources.
    res := coalesce(attacker_data->'resources', '{}'::jsonb) || jsonb_build_object(
      'gold', atk_gold + steal_gold,
      'wood', atk_wood + steal_wood,
      'crystals', atk_crystals + steal_crystals,
      'diamonds', atk_diamonds + steal_diamonds,
      'sCoins', atk_scoins
    );
    attacker_data := jsonb_set(attacker_data, '{resources}', res, true);

    if attacker_win then
      old_stat := greatest(0, coalesce(nullif(attacker_data #>> '{stats,cityAttackWins}', '')::int, 0));
      attacker_data := jsonb_set(attacker_data, '{stats}', coalesce(attacker_data->'stats','{}'::jsonb) || jsonb_build_object('cityAttackWins', old_stat + 1), true);
    else
      old_stat := greatest(0, coalesce(nullif(attacker_data #>> '{stats,cityAttackLosses}', '')::int, 0));
      attacker_data := jsonb_set(attacker_data, '{stats}', coalesce(attacker_data->'stats','{}'::jsonb) || jsonb_build_object('cityAttackLosses', old_stat + 1), true);
    end if;

    defense_power := greatest(
      50,
      coalesce(nullif(defender_profile->>'power','')::int, 100) * 42 / 100 +
      citadel_after * 135 +
      wall_after * 520 +
      tower_level * 95
    );

    damage := jsonb_build_object(
      'wall', jsonb_build_object('from', wall_before, 'to', wall_after, 'breached', wall_breached),
      'citadel', jsonb_build_object('from', citadel_before, 'to', citadel_after, 'breached', citadel_breached),
      'goldMine', jsonb_build_object('from', mine_before, 'to', mine_after, 'breached', mine_breached),
      'woodCollector', jsonb_build_object('from', lumber_before, 'to', lumber_after, 'breached', lumber_breached)
    );

    new_result := jsonb_build_object(
      'attackerWin', attacker_win,
      'attackPower', rec.attack_power,
      'defensePower', defense_power,
      'wallBefore', wall_before,
      'wallAfter', wall_after,
      'wallBreached', wall_breached,
      'wallLevel', wall_after,
      'watchtowerLevel', tower_level,
      'buildingDamage', damage,
      'stolen', jsonb_build_object('gold', steal_gold, 'wood', steal_wood, 'crystals', steal_crystals, 'diamonds', steal_diamonds, 'sCoins', 0),
      'stealPercent', jsonb_build_object('gold', gold_pct, 'wood', wood_pct, 'crystals', crystals_pct, 'diamonds', diamonds_pct),
      'sCoinsProtected', true
    );

    update public.game_saves
    set data = attacker_data,
        updated_at = now()
    where user_id = rec.attacker_id;

    update public.game_saves
    set data = defender_data,
        public_profile = coalesce(public_profile, '{}'::jsonb) || jsonb_build_object(
          'citadelLevel', citadel_after,
          'goldMineLevel', mine_after,
          'woodCollectorLevel', lumber_after,
          'wallLevel', wall_after,
          'watchtowerLevel', tower_level,
          'cityDefensePower', defense_power
        ),
        updated_at = now()
    where user_id = rec.defender_id;

    update public.city_attacks ca
    set status = 'resolved',
        resolved_at = now(),
        result = new_result,
        updated_at = now()
    where ca.id = rec.id;
  end loop;

  return query
  select ca.id, ca.attacker_id, ca.defender_id, ca.attacker_name, ca.defender_name,
         ca.attack_power, ca.defense_power_at_launch, ca.status, ca.lands_at, ca.resolved_at, ca.result
  from public.city_attacks ca
  where (ca.attacker_id = auth.uid() or ca.defender_id = auth.uid())
    and ca.status = 'resolved'
    and ca.resolved_at >= now() - interval '2 days'
  order by ca.resolved_at desc;
end;
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


-- Update 15: guild members helper
create or replace function public.get_guild_members(target_guild_id uuid)
returns table (
  user_id uuid,
  player_name text,
  class_name text,
  power int,
  role text,
  public_profile jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    gm.user_id,
    coalesce(gs.player_name, 'Unknown Hero') as player_name,
    coalesce(gs.class_name, 'Knight') as class_name,
    coalesce((gs.public_profile->>'power')::int, 0) as power,
    gm.role,
    coalesce(gs.public_profile, '{}'::jsonb) as public_profile
  from public.guild_members gm
  left join public.game_saves gs on gs.user_id = gm.user_id
  where gm.guild_id = target_guild_id
  order by power desc, gm.joined_at asc;
$$;

grant execute on function public.get_guild_members(uuid) to authenticated;

-- Update 15: Guild Wars
create table if not exists public.guild_wars (
  id uuid primary key default gen_random_uuid(),
  attacker_guild_id uuid not null references public.guilds(id) on delete cascade,
  defender_guild_id uuid not null references public.guilds(id) on delete cascade,
  attacker_score int not null default 0,
  defender_score int not null default 0,
  status text not null default 'active' check (status in ('active', 'finished', 'cancelled')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '24 hours'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guild_wars_no_self check (attacker_guild_id <> defender_guild_id)
);

alter table public.guild_wars enable row level security;

drop trigger if exists set_guild_wars_updated_at on public.guild_wars;
create trigger set_guild_wars_updated_at
before update on public.guild_wars
for each row
execute function public.set_updated_at();

drop policy if exists "Players can view guild wars" on public.guild_wars;
create policy "Players can view guild wars"
on public.guild_wars
for select
to authenticated
using (true);

create index if not exists guild_wars_active_idx on public.guild_wars(status, ends_at desc);

create or replace function public.declare_guild_war(target_guild_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  my_guild_id uuid;
  new_id uuid;
begin
  select gm.guild_id into my_guild_id
  from public.guild_members gm
  where gm.user_id = auth.uid();

  if my_guild_id is null then
    raise exception 'You are not in a guild';
  end if;

  if my_guild_id = target_guild_id then
    raise exception 'You cannot declare war on your own guild';
  end if;

  if exists(
    select 1 from public.guild_wars gw
    where gw.status = 'active'
      and gw.ends_at > now()
      and ((gw.attacker_guild_id = my_guild_id and gw.defender_guild_id = target_guild_id)
        or (gw.attacker_guild_id = target_guild_id and gw.defender_guild_id = my_guild_id))
  ) then
    raise exception 'A guild war is already active between these alliances';
  end if;

  insert into public.guild_wars(attacker_guild_id, defender_guild_id, created_by)
  values (my_guild_id, target_guild_id, auth.uid())
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.declare_guild_war(uuid) to authenticated;

create or replace function public.get_guild_wars()
returns table (
  id uuid,
  attacker_guild_id uuid,
  defender_guild_id uuid,
  attacker_name text,
  attacker_tag text,
  defender_name text,
  defender_tag text,
  attacker_score int,
  defender_score int,
  status text,
  starts_at timestamptz,
  ends_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  update public.guild_wars
  set status = 'finished', updated_at = now()
  where status = 'active' and ends_at <= now();

  select
    gw.id,
    gw.attacker_guild_id,
    gw.defender_guild_id,
    ag.name as attacker_name,
    ag.tag as attacker_tag,
    dg.name as defender_name,
    dg.tag as defender_tag,
    gw.attacker_score,
    gw.defender_score,
    gw.status,
    gw.starts_at,
    gw.ends_at
  from public.guild_wars gw
  join public.guilds ag on ag.id = gw.attacker_guild_id
  join public.guilds dg on dg.id = gw.defender_guild_id
  where gw.status = 'active' or gw.created_at >= now() - interval '7 days'
  order by gw.status asc, gw.ends_at desc
  limit 100;
$$;

grant execute on function public.get_guild_wars() to authenticated;

create or replace function public.add_guild_war_score(score_points int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  my_guild_id uuid;
  clean_points int := greatest(1, least(score_points, 100000));
begin
  select gm.guild_id into my_guild_id
  from public.guild_members gm
  where gm.user_id = auth.uid();

  if my_guild_id is null then
    raise exception 'You are not in a guild';
  end if;

  update public.guild_wars
  set attacker_score = attacker_score + clean_points,
      updated_at = now()
  where status = 'active'
    and ends_at > now()
    and attacker_guild_id = my_guild_id;

  update public.guild_wars
  set defender_score = defender_score + clean_points,
      updated_at = now()
  where status = 'active'
    and ends_at > now()
    and defender_guild_id = my_guild_id;

  return true;
end;
$$;

grant execute on function public.add_guild_war_score(int) to authenticated;

-- Update 15: World Boss shared state
create table if not exists public.world_boss_state (
  id text primary key default 'current',
  name text not null default 'Ancient Dragon',
  emoji text not null default '🐉',
  hp int not null default 500000,
  max_hp int not null default 500000,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '24 hours'),
  updated_at timestamptz not null default now()
);

alter table public.world_boss_state enable row level security;

drop policy if exists "Players can view world boss" on public.world_boss_state;
create policy "Players can view world boss"
on public.world_boss_state
for select
to authenticated
using (true);

insert into public.world_boss_state(id)
values ('current')
on conflict (id) do nothing;

create or replace function public.reset_world_boss_if_needed()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.world_boss_state(id)
  values ('current')
  on conflict (id) do nothing;

  update public.world_boss_state
  set hp = max_hp,
      starts_at = now(),
      ends_at = now() + interval '24 hours',
      updated_at = now()
  where id = 'current'
    and (hp <= 0 or ends_at <= now());
end;
$$;

create or replace function public.get_world_boss()
returns table (
  id text,
  name text,
  emoji text,
  hp int,
  max_hp int,
  starts_at timestamptz,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.reset_world_boss_if_needed();
  return query
  select wb.id, wb.name, wb.emoji, wb.hp, wb.max_hp, wb.starts_at, wb.ends_at
  from public.world_boss_state wb
  where wb.id = 'current';
end;
$$;

grant execute on function public.get_world_boss() to authenticated;

create or replace function public.attack_world_boss(damage_points int)
returns table (
  id text,
  name text,
  emoji text,
  hp int,
  max_hp int,
  starts_at timestamptz,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  dmg int := greatest(1, least(coalesce(damage_points, 1), 250000));
begin
  perform public.reset_world_boss_if_needed();

  update public.world_boss_state as boss
  set hp = greatest(0, boss.hp - dmg),
      updated_at = now()
  where boss.id = 'current';

  return query
  select wb.id, wb.name, wb.emoji, wb.hp, wb.max_hp, wb.starts_at, wb.ends_at
  from public.world_boss_state as wb
  where wb.id = 'current';
end;
$$;

grant execute on function public.attack_world_boss(int) to authenticated;

-- S-Fleet Fantasy War ⚔️ — Update 31
-- Security + Balance + Admin Logs + server-side grants/backups/market purchase validation.

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  admin_email text,
  target_user_id uuid references auth.users(id) on delete set null,
  action_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_action_logs enable row level security;

drop policy if exists "Admins can read admin action logs" on public.admin_action_logs;
create policy "Admins can read admin action logs"
on public.admin_action_logs
for select
to authenticated
using (public.is_current_user_admin());

create index if not exists admin_action_logs_created_idx on public.admin_action_logs(created_at desc);
create index if not exists admin_action_logs_target_idx on public.admin_action_logs(target_user_id, created_at desc);

create table if not exists public.game_balance_config (
  id text primary key default 'current',
  config jsonb not null default '{
    "version": 1,
    "xpMultiplier": 1,
    "goldMultiplier": 1,
    "dropRateMultiplier": 1,
    "marketplaceMaxGoldPrice": 100000000,
    "marketplaceMaxDiamondPrice": 1000000,
    "raidStealMultiplier": 1,
    "worldBossRewardMultiplier": 1,
    "notes": "Edit from Update 31 Security Center"
  }'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.game_balance_config(id)
values ('current')
on conflict (id) do nothing;

alter table public.game_balance_config enable row level security;

drop policy if exists "Players can read balance config" on public.game_balance_config;
create policy "Players can read balance config"
on public.game_balance_config
for select
to authenticated
using (true);

create or replace function public.log_admin_action(target_user_id uuid, action_type text, details jsonb default '{}'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not public.is_current_user_admin() then
    raise exception 'Not admin';
  end if;

  insert into public.admin_action_logs(admin_user_id, admin_email, target_user_id, action_type, details)
  values (auth.uid(), coalesce(auth.jwt()->>'email', ''), target_user_id, action_type, coalesce(details, '{}'::jsonb))
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.log_admin_action(uuid, text, jsonb) to authenticated;

create or replace function public.admin_get_action_logs(limit_count int default 50)
returns table (
  id uuid,
  admin_email text,
  target_user_id uuid,
  action_type text,
  details jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select l.id, l.admin_email, l.target_user_id, l.action_type, l.details, l.created_at
  from public.admin_action_logs l
  where public.is_current_user_admin()
  order by l.created_at desc
  limit greatest(1, least(coalesce(limit_count, 50), 200));
$$;

grant execute on function public.admin_get_action_logs(int) to authenticated;

create or replace function public.get_balance_config()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select config from public.game_balance_config where id = 'current';
$$;

grant execute on function public.get_balance_config() to authenticated;

create or replace function public.admin_set_balance_config(new_config jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Not admin';
  end if;

  update public.game_balance_config
  set config = coalesce(new_config, '{}'::jsonb), updated_by = auth.uid(), updated_at = now()
  where id = 'current';

  perform public.log_admin_action(null, 'balance_config_update', jsonb_build_object('config', new_config));

  return (select config from public.game_balance_config where id = 'current');
end;
$$;

grant execute on function public.admin_set_balance_config(jsonb) to authenticated;

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
    data = coalesce(new_data, '{}'::jsonb),
    player_name = coalesce(nullif(new_data->>'playerName', ''), player_name),
    class_name = coalesce(nullif(new_data->>'className', ''), class_name),
    updated_at = now()
  where user_id = target_user_id;

  if found then
    perform public.log_admin_action(target_user_id, 'player_save_update', jsonb_build_object('playerName', new_data->>'playerName', 'className', new_data->>'className'));
  end if;

  return found;
end;
$$;

grant execute on function public.admin_update_player_data(uuid, jsonb) to authenticated;

create or replace function public.admin_grant_resource(target_user_id uuid, resource_key text, amount_delta int, reason_text text default 'Manual admin grant')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed text[] := array['gold','wood','crystals','diamonds','sCoins','energy'];
  current_data jsonb;
  current_value int;
  new_value int;
begin
  if not public.is_current_user_admin() then
    raise exception 'Not admin';
  end if;
  if not resource_key = any(allowed) then
    raise exception 'Invalid resource key';
  end if;
  if amount_delta = 0 then
    raise exception 'Amount cannot be zero';
  end if;

  select data into current_data from public.game_saves where user_id = target_user_id for update;
  if current_data is null then
    raise exception 'Player save not found';
  end if;

  current_data := jsonb_set(current_data, '{resources}', coalesce(current_data->'resources', '{}'::jsonb), true);
  current_value := coalesce((current_data #>> array['resources', resource_key])::int, 0);
  new_value := greatest(0, current_value + amount_delta);

  current_data := jsonb_set(current_data, array['resources', resource_key], to_jsonb(new_value), true);
  current_data := jsonb_set(current_data, '{security,lastServerGrantAt}', to_jsonb(now()::text), true);

  update public.game_saves
  set data = current_data, updated_at = now()
  where user_id = target_user_id;

  perform public.log_admin_action(
    target_user_id,
    'resource_grant',
    jsonb_build_object('resource', resource_key, 'amountDelta', amount_delta, 'oldValue', current_value, 'newValue', new_value, 'reason', reason_text)
  );

  return current_data;
end;
$$;

grant execute on function public.admin_grant_resource(uuid, text, int, text) to authenticated;

create or replace function public.admin_export_player_save(target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  if not public.is_current_user_admin() then
    raise exception 'Not admin';
  end if;

  select jsonb_build_object(
    'user_id', user_id,
    'player_name', player_name,
    'class_name', class_name,
    'public_profile', public_profile,
    'data', data,
    'updated_at', updated_at
  ) into payload
  from public.game_saves
  where user_id = target_user_id;

  perform public.log_admin_action(target_user_id, 'player_save_export', '{}'::jsonb);
  return payload;
end;
$$;

grant execute on function public.admin_export_player_save(uuid) to authenticated;

create or replace function public.secure_buy_market_listing(listing_id uuid)
returns table (
  id uuid,
  item jsonb,
  price_gold int,
  price_diamonds int,
  seller_id uuid,
  buyer_data jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  listing public.marketplace_listings%rowtype;
  buyer jsonb;
  buyer_gold int;
  buyer_diamonds int;
  inventory jsonb;
  inventory_count int;
  item_value int;
begin
  select * into listing
  from public.marketplace_listings
  where marketplace_listings.id = listing_id
    and marketplace_listings.status = 'active'
  for update;

  if listing.id is null then
    raise exception 'Listing is not active';
  end if;
  if listing.seller_id = auth.uid() then
    raise exception 'You cannot buy your own listing';
  end if;

  select data into buyer from public.game_saves where user_id = auth.uid() for update;
  if buyer is null then
    raise exception 'Buyer save not found';
  end if;

  buyer_gold := coalesce((buyer #>> '{resources,gold}')::int, 0);
  buyer_diamonds := coalesce((buyer #>> '{resources,diamonds}')::int, 0);
  if buyer_gold < listing.price_gold or buyer_diamonds < listing.price_diamonds then
    raise exception 'Insufficient resources';
  end if;

  inventory := coalesce(buyer->'inventory', '[]'::jsonb);
  inventory_count := jsonb_array_length(inventory);
  item_value := greatest(50, coalesce((listing.item->>'value')::int, 50));

  buyer := jsonb_set(buyer, '{resources,gold}', to_jsonb(buyer_gold - listing.price_gold), true);
  buyer := jsonb_set(buyer, '{resources,diamonds}', to_jsonb(buyer_diamonds - listing.price_diamonds), true);

  if inventory_count < 80 then
    buyer := jsonb_set(buyer, '{inventory}', inventory || jsonb_build_array(listing.item), true);
  else
    buyer := jsonb_set(buyer, '{resources,gold}', to_jsonb((buyer #>> '{resources,gold}')::int + item_value), true);
  end if;

  update public.game_saves set data = buyer, updated_at = now() where user_id = auth.uid();

  update public.marketplace_listings ml
  set status = 'sold', buyer_id = auth.uid(), sold_at = now(), updated_at = now()
  where ml.id = listing.id;

  insert into public.admin_action_logs(admin_user_id, admin_email, target_user_id, action_type, details)
  values (auth.uid(), coalesce(auth.jwt()->>'email', ''), listing.seller_id, 'marketplace_secure_buy', jsonb_build_object('listingId', listing.id, 'priceGold', listing.price_gold, 'priceDiamonds', listing.price_diamonds));

  return query select listing.id, listing.item, listing.price_gold, listing.price_diamonds, listing.seller_id, buyer;
end;
$$;

grant execute on function public.secure_buy_market_listing(uuid) to authenticated;

create or replace function public.secure_claim_market_sales()
returns table (
  claimed_gold int,
  claimed_diamonds int,
  sales_count int,
  seller_data jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  gold_sum int;
  diamond_sum int;
  sale_count int;
  current_data jsonb;
begin
  with updated as (
    update public.marketplace_listings ml
    set proceeds_claimed = true, updated_at = now()
    where ml.seller_id = auth.uid()
      and ml.status = 'sold'
      and ml.proceeds_claimed = false
    returning ml.price_gold, ml.price_diamonds
  )
  select coalesce(sum(price_gold),0)::int, coalesce(sum(price_diamonds),0)::int, count(*)::int
  into gold_sum, diamond_sum, sale_count
  from updated;

  select data into current_data from public.game_saves where user_id = auth.uid() for update;
  if current_data is null then
    raise exception 'Seller save not found';
  end if;

  current_data := jsonb_set(current_data, '{resources,gold}', to_jsonb(coalesce((current_data #>> '{resources,gold}')::int,0) + gold_sum), true);
  current_data := jsonb_set(current_data, '{resources,diamonds}', to_jsonb(coalesce((current_data #>> '{resources,diamonds}')::int,0) + diamond_sum), true);

  update public.game_saves set data = current_data, updated_at = now() where user_id = auth.uid();

  return query select gold_sum, diamond_sum, sale_count, current_data;
end;
$$;

grant execute on function public.secure_claim_market_sales() to authenticated;

-- S-Fleet Fantasy War ⚔️ — Update 32-40 Bundle
-- Adds multiplayer chat, manual S-Coin requests and admin dashboard helpers.

create table if not exists public.game_chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'global' check (channel in ('global', 'guild')),
  guild_id uuid null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null default 'Hero',
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.game_chat_messages enable row level security;

drop policy if exists "Players can read global and own guild chat" on public.game_chat_messages;
create policy "Players can read global and own guild chat"
on public.game_chat_messages
for select
to authenticated
using (
  channel = 'global'
  or sender_id = auth.uid()
  or exists (
    select 1 from public.game_saves gs
    where gs.user_id = auth.uid()
      and (gs.data->'guild'->>'id')::uuid = game_chat_messages.guild_id
  )
);

drop policy if exists "Players can insert own chat" on public.game_chat_messages;
create policy "Players can insert own chat"
on public.game_chat_messages
for insert
to authenticated
with check (sender_id = auth.uid());

create index if not exists game_chat_channel_created_idx on public.game_chat_messages(channel, created_at desc);
create index if not exists game_chat_guild_created_idx on public.game_chat_messages(guild_id, created_at desc);
grant select, insert on public.game_chat_messages to authenticated;

create table if not exists public.s_coin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_name text not null default 'Hero',
  amount int not null check (amount > 0 and amount <= 100000),
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.s_coin_requests enable row level security;

drop policy if exists "Players can read own coin requests" on public.s_coin_requests;
create policy "Players can read own coin requests"
on public.s_coin_requests
for select
to authenticated
using (user_id = auth.uid() or public.is_current_user_admin());

drop policy if exists "Players can create own coin requests" on public.s_coin_requests;
create policy "Players can create own coin requests"
on public.s_coin_requests
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Admins can update coin requests" on public.s_coin_requests;
create policy "Admins can update coin requests"
on public.s_coin_requests
for update
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create index if not exists s_coin_requests_status_idx on public.s_coin_requests(status, created_at desc);
create index if not exists s_coin_requests_user_idx on public.s_coin_requests(user_id, created_at desc);
grant select, insert, update on public.s_coin_requests to authenticated;

create or replace function public.admin_dashboard_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_current_user_admin() then
    raise exception 'Only admins can read dashboard summary';
  end if;

  select jsonb_build_object(
    'players', (select count(*) from public.game_saves),
    'marketActive', (select count(*) from public.marketplace_listings where status = 'active'),
    'coinRequestsPending', (select count(*) from public.s_coin_requests where status = 'pending'),
    'chatMessages24h', (select count(*) from public.game_chat_messages where created_at > now() - interval '24 hours'),
    'adminLogs24h', (select count(*) from public.admin_action_logs where created_at > now() - interval '24 hours')
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_dashboard_summary() to authenticated;

-- S-Fleet Fantasy War ⚔️ — Update 41-50 Bundle
-- Player profiles, direct messages, moderation scaffolding, event scheduler and beta launch metadata.

create table if not exists public.player_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null default 'Hero',
  receiver_name text not null default 'Hero',
  message text not null check (char_length(message) between 1 and 500),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.player_direct_messages enable row level security;

drop policy if exists "Players can read own direct messages" on public.player_direct_messages;
create policy "Players can read own direct messages"
on public.player_direct_messages
for select
to authenticated
using (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_current_user_admin());

drop policy if exists "Players can send direct messages" on public.player_direct_messages;
create policy "Players can send direct messages"
on public.player_direct_messages
for insert
to authenticated
with check (sender_id = auth.uid());

create index if not exists player_dm_receiver_created_idx on public.player_direct_messages(receiver_id, created_at desc);
create index if not exists player_dm_sender_created_idx on public.player_direct_messages(sender_id, created_at desc);
grant select, insert, update on public.player_direct_messages to authenticated;

create table if not exists public.player_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid references auth.users(id) on delete set null,
  reason text not null default '',
  details text not null default '',
  status text not null default 'open' check (status in ('open','reviewed','dismissed','actioned')),
  created_at timestamptz not null default now()
);

alter table public.player_reports enable row level security;

drop policy if exists "Players can create reports" on public.player_reports;
create policy "Players can create reports"
on public.player_reports
for insert
to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "Admins can read reports" on public.player_reports;
create policy "Admins can read reports"
on public.player_reports
for select
to authenticated
using (public.is_current_user_admin() or reporter_id = auth.uid());

grant select, insert, update on public.player_reports to authenticated;

create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default now() + interval '24 hours',
  config jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

alter table public.game_events enable row level security;

drop policy if exists "Players can read game events" on public.game_events;
create policy "Players can read game events"
on public.game_events
for select
to authenticated
using (true);

drop policy if exists "Admins can manage game events" on public.game_events;
create policy "Admins can manage game events"
on public.game_events
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

grant select, insert, update, delete on public.game_events to authenticated;

create or replace function public.beta_launch_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return jsonb_build_object(
    'currentUpdate', 'Update 50 · Beta Launch Pack',
    'previousMilestones', jsonb_build_array(
      'Update 16 · City Raid System',
      'Update 31 · Security + Balance + Admin Logs',
      'Update 40 · Live RPG Bundle'
    ),
    'players', (select count(*) from public.game_saves),
    'activeMarketplaceListings', (select count(*) from public.marketplace_listings where status = 'active'),
    'activeEvents', (select count(*) from public.game_events where now() between starts_at and ends_at)
  );
end;
$$;

grant execute on function public.beta_launch_summary() to authenticated;

-- Update 51 · Beta Stability + Bug Tracker
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  player_name text not null default '',
  area text not null default 'Other',
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  description text not null default '',
  steps text not null default '',
  debug jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','fixed','ignored')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bug_reports enable row level security;

drop policy if exists "Players can create own bug reports" on public.bug_reports;
create policy "Players can create own bug reports"
on public.bug_reports
for insert
to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "Players can read own bug reports" on public.bug_reports;
create policy "Players can read own bug reports"
on public.bug_reports
for select
to authenticated
using (reporter_id = auth.uid() or public.is_current_user_admin());

drop policy if exists "Admins can update bug reports" on public.bug_reports;
create policy "Admins can update bug reports"
on public.bug_reports
for update
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

grant select, insert, update on public.bug_reports to authenticated;

create index if not exists bug_reports_status_idx on public.bug_reports(status);
create index if not exists bug_reports_created_at_idx on public.bug_reports(created_at desc);

create or replace function public.admin_bug_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  return jsonb_build_object(
    'currentUpdate', 'Update 51 · Beta Stability',
    'open', (select count(*) from public.bug_reports where status = 'open'),
    'fixed', (select count(*) from public.bug_reports where status = 'fixed'),
    'ignored', (select count(*) from public.bug_reports where status = 'ignored'),
    'critical', (select count(*) from public.bug_reports where severity = 'critical' and status = 'open'),
    'generatedAt', now()
  );
end;
$$;

grant execute on function public.admin_bug_summary() to authenticated;

-- Update 52 · Real Game Balance Pass
-- Adds explicit server-side balance helpers for the Update 52 Balance panel.

update public.game_balance_config
set config = jsonb_build_object(
  'configVersion', 52,
  'xp', jsonb_build_object('multiplier', 0.85, 'levelCurve', 'soft-early / slower-paragon'),
  'energyCosts', jsonb_build_object('normalBattle', 1, 'dungeon', 2, 'boss', 3, 'cityAttack', 5, 'worldBoss', 3),
  'buildingCost', jsonb_build_object('earlyMultiplier', 1.0, 'midMultiplier', 1.28, 'lateMultiplier', 1.72, 'citadelLateMultiplier', 2.15),
  'rewards', jsonb_build_object('goldMultiplier', 0.92, 'woodMultiplier', 0.95, 'crystalMultiplier', 0.90, 'diamondMultiplier', 0.80),
  'drops', jsonb_build_object('baseBattleChance', 0.58, 'dungeonMultiplier', 0.90, 'bossBonus', 0.08, 'legendaryCapPercent', 4),
  'marketplace', jsonb_build_object('minPrice', 25, 'maxPrice', 250000, 'taxPercent', 5, 'maxListings', 20),
  'pvp', jsonb_build_object('sameTargetCooldownMinutes', 120, 'outgoingLimit', 5, 'sameGuildBlocked', true),
  'raid', jsonb_build_object('baseStealPercent', 4, 'wallBreakBonusPercent', 3, 'citadelBreakBonusPercent', 5, 'mineBreakBonusPercent', 4, 'lumberBreakBonusPercent', 4, 'diamondStealCapPercent', 2, 'sCoinsProtected', true),
  'shop', jsonb_build_object('energyPackSCoins', 2, 'classChangeSCoins', 10, 'renameSCoins', 2, 'premiumChestSCoins', 5),
  'worldBoss', jsonb_build_object('energyCost', 3, 'dailySoftLimit', 25, 'rewardMultiplier', 0.85),
  'notes', 'Update 52 beta balance pass default configuration'
), updated_at = now()
where id = 'current'
and coalesce((config->>'configVersion')::int, 0) < 52;

create or replace function public.admin_get_balance_v52()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;
  return (select config from public.game_balance_config where id = 'current');
end;
$$;

grant execute on function public.admin_get_balance_v52() to authenticated;

create or replace function public.admin_set_balance_v52(new_config jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  update public.game_balance_config
  set config = coalesce(new_config, '{}'::jsonb), updated_by = auth.uid(), updated_at = now()
  where id = 'current';

  perform public.log_admin_action(null, 'update_52_balance_config', jsonb_build_object('configVersion', coalesce(new_config->>'configVersion', 'unknown'), 'config', new_config));

  return (select config from public.game_balance_config where id = 'current');
end;
$$;

grant execute on function public.admin_set_balance_v52(jsonb) to authenticated;


-- =========================================================
-- Update 53–60 · Beta Launch Polish
-- Adds helper tables/functions for direct messages, reports,
-- event scheduling, scout reports and beta launch summary.
-- Safe to run multiple times.
-- =========================================================

create table if not exists public.player_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete set null,
  recipient_email text,
  body text not null check (char_length(body) between 1 and 1000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.player_direct_messages enable row level security;

-- Update 60 compatibility fix: older schemas created this table with receiver_id/message columns.
-- These ALTER statements make the table compatible with the email-based DM flow.
alter table public.player_direct_messages add column if not exists recipient_email text;
alter table public.player_direct_messages add column if not exists body text;
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'player_direct_messages' and column_name = 'receiver_id') then
    alter table public.player_direct_messages alter column receiver_id drop not null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'player_direct_messages' and column_name = 'message') then
    alter table public.player_direct_messages alter column message drop not null;
  end if;
end $$;
update public.player_direct_messages
set body = coalesce(body, message, '')
where body is null and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'player_direct_messages' and column_name = 'message');
create index if not exists player_dm_recipient_email_created_idx on public.player_direct_messages(lower(recipient_email), created_at desc);

drop policy if exists "Players can send direct messages" on public.player_direct_messages;
create policy "Players can send direct messages"
on public.player_direct_messages for insert to authenticated
with check (auth.uid() = sender_id);

drop policy if exists "Players can read sent or addressed messages" on public.player_direct_messages;
create policy "Players can read sent or addressed messages"
on public.player_direct_messages for select to authenticated
using (auth.uid() = sender_id or lower(recipient_email) = lower(auth.email()));

create table if not exists public.scout_reports (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete set null,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.scout_reports enable row level security;

drop policy if exists "Players can manage own scout reports" on public.scout_reports;
create policy "Players can manage own scout reports"
on public.scout_reports for all to authenticated
using (auth.uid() = scout_id)
with check (auth.uid() = scout_id);

create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  name text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  config jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.game_events enable row level security;

drop policy if exists "Players can read game events" on public.game_events;
create policy "Players can read game events"
on public.game_events for select to authenticated
using (true);

create table if not exists public.server_combat_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  target_id uuid references auth.users(id) on delete set null,
  combat_type text not null default 'audit',
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.server_combat_logs enable row level security;

drop policy if exists "Players can read own combat logs" on public.server_combat_logs;
create policy "Players can read own combat logs"
on public.server_combat_logs for select to authenticated
using (auth.uid() = actor_id or auth.uid() = target_id or public.is_admin_email(auth.email()));

create or replace function public.beta_launch_summary()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'version', 'Update 67 · Beta Testing Tools',
    'players', (select count(*) from public.game_saves),
    'active_events', (select count(*) from public.game_events where now() between starts_at and ends_at),
    'direct_messages', (select count(*) from public.player_direct_messages),
    'scout_reports', (select count(*) from public.scout_reports),
    'systems', jsonb_build_array(
      'Update 53 · Server-Side Combat Prep',
      'Update 54 · Real Player Profile',
      'Update 55 · Direct Messages',
      'Update 56 · Guild Rank System',
      'Update 57 · Guild Shop + Guild Research',
      'Update 58 · Event Scheduler',
      'Update 59 · City Scout System',
      'Update 67 · Beta Testing Tools'
    )
  );
$$;

grant execute on function public.beta_launch_summary() to authenticated;

-- Update 61–67 · UI Cleanup + Beta Testing Tools
-- Safe to run multiple times. Adds beta testing tables and fixes admin helper functions if missing.

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin_email(input_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where lower(au.email) = lower(coalesce(input_email, ''))
  );
$$;

grant execute on function public.is_admin_email(text) to authenticated;
grant execute on function public.is_admin_email(text) to anon;

insert into public.admin_users(email)
values ('sakal.hiv@gmail.com')
on conflict (email) do nothing;

create table if not exists public.beta_test_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  area text not null default 'general',
  status text not null default 'open',
  severity text not null default 'medium',
  title text not null default 'Beta test report',
  description text not null default '',
  debug jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.beta_test_reports enable row level security;

drop policy if exists "Players can create beta reports" on public.beta_test_reports;
create policy "Players can create beta reports"
on public.beta_test_reports for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Players can read own beta reports" on public.beta_test_reports;
create policy "Players can read own beta reports"
on public.beta_test_reports for select to authenticated
using (auth.uid() = user_id or public.is_admin_email(auth.email()));

drop policy if exists "Admins can update beta reports" on public.beta_test_reports;
create policy "Admins can update beta reports"
on public.beta_test_reports for update to authenticated
using (public.is_admin_email(auth.email()))
with check (public.is_admin_email(auth.email()));

create table if not exists public.economy_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  audit_type text not null default 'update67',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.economy_audit_logs enable row level security;

drop policy if exists "Admins can read economy audits" on public.economy_audit_logs;
create policy "Admins can read economy audits"
on public.economy_audit_logs for select to authenticated
using (public.is_admin_email(auth.email()));

drop policy if exists "Players can create own economy audits" on public.economy_audit_logs;
create policy "Players can create own economy audits"
on public.economy_audit_logs for insert to authenticated
with check (auth.uid() = user_id);

create table if not exists public.game_rules_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  version text not null default 'Update 67 · Beta Testing Tools',
  accepted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.game_rules_acknowledgements enable row level security;

drop policy if exists "Players can manage own rules acknowledgement" on public.game_rules_acknowledgements;
create policy "Players can manage own rules acknowledgement"
on public.game_rules_acknowledgements for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.beta_testing_summary()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'version', 'Update 67 · Beta Testing Tools',
    'players', (select count(*) from public.game_saves),
    'bug_reports', (select count(*) from public.bug_reports),
    'beta_reports', (select count(*) from public.beta_test_reports),
    'open_beta_reports', (select count(*) from public.beta_test_reports where status = 'open'),
    'rules_accepted', (select count(*) from public.game_rules_acknowledgements),
    'systems', jsonb_build_array(
      'Update 61 · UI Cleanup + Game Polish',
      'Update 62 · Better Battle Animations',
      'Update 63 · Real Assets / Fantasy Graphics Pack',
      'Update 64 · Better City Map',
      'Update 65 · Server-Side Economy Hardening',
      'Update 66 · Public Landing Page + Game Rules',
      'Update 67 · Beta Testing Tools'
    )
  );
$$;

grant execute on function public.beta_testing_summary() to authenticated;

-- =============================================================
-- Update 68–73 · Production Cleanup + Launch + Economy Hardening
-- Safe to run multiple times.
-- =============================================================

create table if not exists public.player_feedback_surveys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  rating int not null default 5 check (rating between 1 and 5),
  message text not null default '',
  version text not null default 'Update 73',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.player_feedback_surveys enable row level security;

drop policy if exists "Players can insert own feedback surveys" on public.player_feedback_surveys;
create policy "Players can insert own feedback surveys"
on public.player_feedback_surveys for insert to authenticated
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Players can read own feedback surveys" on public.player_feedback_surveys;
create policy "Players can read own feedback surveys"
on public.player_feedback_surveys for select to authenticated
using (auth.uid() = user_id or public.is_admin_email(auth.email()));

create table if not exists public.s_coin_package_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  contact_email text,
  amount int not null default 0 check (amount >= 0 and amount <= 100000),
  note text not null default '',
  status text not null default 'pending',
  version text not null default 'Update 73',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.s_coin_package_requests enable row level security;

drop policy if exists "Players can create s coin package requests" on public.s_coin_package_requests;
create policy "Players can create s coin package requests"
on public.s_coin_package_requests for insert to authenticated
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Players can read own s coin package requests" on public.s_coin_package_requests;
create policy "Players can read own s coin package requests"
on public.s_coin_package_requests for select to authenticated
using (auth.uid() = user_id or public.is_admin_email(auth.email()));

drop policy if exists "Admins can update s coin package requests" on public.s_coin_package_requests;
create policy "Admins can update s coin package requests"
on public.s_coin_package_requests for update to authenticated
using (public.is_admin_email(auth.email()))
with check (public.is_admin_email(auth.email()));

create table if not exists public.launch_readiness_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  readiness int not null default 0 check (readiness between 0 and 100),
  notes text not null default '',
  version text not null default 'Update 73',
  created_at timestamptz not null default now()
);

alter table public.launch_readiness_logs enable row level security;

drop policy if exists "Players can insert own launch readiness logs" on public.launch_readiness_logs;
create policy "Players can insert own launch readiness logs"
on public.launch_readiness_logs for insert to authenticated
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Admins can read launch readiness logs" on public.launch_readiness_logs;
create policy "Admins can read launch readiness logs"
on public.launch_readiness_logs for select to authenticated
using (auth.uid() = user_id or public.is_admin_email(auth.email()));

create or replace function public.admin_update73_summary()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select case
    when not public.is_admin_email(auth.email()) then jsonb_build_object('error', 'not_admin')
    else jsonb_build_object(
      'version', 'Update 73 · Server-Side Economy Hardening',
      'players', (select count(*) from public.game_saves),
      'feedback', (select count(*) from public.player_feedback_surveys),
      's_coin_requests_pending', (select count(*) from public.s_coin_package_requests where status = 'pending'),
      'launch_logs', (select count(*) from public.launch_readiness_logs),
      'systems', jsonb_build_array(
        'Update 68 · Production Cleanup + Launch Preparation',
        'Update 69 · Real Art Pack + Icons',
        'Update 70 · Beta Launch v1',
        'Update 71 · Feedback System + Player Survey',
        'Update 72 · S-Coin Monetization Admin Flow',
        'Update 73 · Server-Side Economy Hardening'
      )
    )
  end;
$$;

grant execute on function public.admin_update73_summary() to authenticated;
