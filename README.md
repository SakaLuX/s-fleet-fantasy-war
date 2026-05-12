# S-Fleet Fantasy War ⚔️ — Update 52

## Update 52 · Real Game Balance Pass

This update focuses on making the beta version more balanced and playable before more feature expansion.

## Included

- Version badge updated to **Update 52 · Real Game Balance Pass**
- New **⚖️ Balance** tab
- Local balance normalization tool
- Export current balance config
- Admin server-side balance JSON loader/saver
- XP multiplier support
- Balanced building costs by level phase
- Balanced monster reward multipliers
- Balanced battle/dungeon/world boss energy costs
- Balanced item drop chances
- Marketplace min/max/tax rules shown in the new panel
- Raid/PvP balance values documented for the next server-side combat update

## Build

```txt
npm run build
```

Build passes. A large bundle warning can appear; it does not block deploy.

## Supabase

Run the new SQL:

```txt
Supabase → SQL Editor → New query → paste supabase/schema.sql → Run
```

This adds/updates:

- `admin_get_balance_v52()`
- `admin_set_balance_v52(new_config jsonb)`
- Update 52 default balance config in `game_balance_config`
- Admin logging for balance changes

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
