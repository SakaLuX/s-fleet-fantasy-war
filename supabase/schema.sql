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
