# S-Fleet Fantasy War ⚔️ — Update 31

Update 31 focuses on stability, balance, admin safety, server-side controls and anti-cheat checks.

## Included

- New **Security** tab
- Local save audit and repair
- Player save backup export
- Admin server security panel
- Admin action logs
- Server-side resource grants, including S-Coins
- Balance config JSON stored in Supabase
- Admin player backup/export
- Marketplace secure buy validation
- Marketplace secure claim sales validation
- Anti-cheat style checks for negative values, over-max energy, item upgrades and suspicious values
- Admin edits are logged through Supabase

## Important SQL step

Run the full SQL file again:

```txt
Supabase → SQL Editor → New query → paste supabase/schema.sql → Run
```

This adds:

- `admin_action_logs`
- `game_balance_config`
- `admin_get_action_logs`
- `admin_grant_resource`
- `admin_set_balance_config`
- `admin_export_player_save`
- `secure_buy_market_listing`
- `secure_claim_market_sales`

## Admin email

If you did not already add your admin email, run:

```sql
insert into public.admin_users(email)
values ('your-email@example.com')
on conflict (email) do nothing;
```

## Deploy

Upload all files to GitHub, replacing the existing project files.

Netlify settings remain:

```txt
Build command: npm run build
Publish directory: dist
Base directory: empty
Functions directory: empty
```

Environment variables remain:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```
