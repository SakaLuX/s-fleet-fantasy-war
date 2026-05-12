# S-Fleet Fantasy War ⚔️ — Update 41–50 Bundle

This bundle is based on Update 40 and includes the requested beta-launch features plus the World/Dungeon attack fix.

## Critical fixes

- Fixed World/Dungeon battle freeze after first attack.
  - Cause: World/Dungeon combat referenced battle speed without defining it inside that component.
  - Fix: local battle speed state added and the fight now resets a new monster after victory/defeat.
- Added visible release badge in the game top bar:
  - `Update 50 · Beta Launch Pack`
- Added release checklist mentioning:
  - `Update 16 · City Raid System`

## Included updates

### Update 41 — Player Profile + PvP Cooldown Prep
- Public profile fields
- Avatar/bio/title prep
- PvP cooldown storage prep
- Cleaner player profile surface

### Update 42 — Real Mail + Direct Messages Prep
- Direct message storage in save
- Supabase table for player direct messages

### Update 43 — Guild Rank System + Permissions Prep
- Leader / Officer / Member role model
- Guild permission text and prep

### Update 44 — City Skin / Cosmetic System
- Cosmetic city skin selection
- No power advantage from skins

### Update 45 — Event Scheduler
- Event history in save
- Supabase `game_events` table for live scheduling

### Update 46 — Server-side Combat Prep
- Server rule checklist for raids/PvP
- Same-alliance attack protection maintained
- Shield and S-Coin theft protection maintained

### Update 47 — Performance Cleanup
- Save trimming and PWA/cache tools retained
- Update 50 panel includes performance summary

### Update 48 — S-Coin Request / Manual Payment Workflow
- S-Coin request flow remains manual/admin controlled
- Admin grants remain logged through Update 31 tools

### Update 49 — Public Landing Page Prep
- Landing flag and beta-ready profile prep

### Update 50 — Beta Launch Pack
- Release badge
- Beta launch checklist
- Marketplace rules helper
- World/Dungeon attack fix

## Supabase

Run the new SQL if you want Update 41–50 server tables:

```txt
Supabase → SQL Editor → New query → paste supabase/schema.sql → Run
```

This adds:

- `player_direct_messages`
- `player_reports`
- `game_events`
- `beta_launch_summary()`

## Deploy

Upload all files to GitHub and commit. Netlify will deploy automatically.

Netlify settings stay the same:

```txt
Build command: npm run build
Publish directory: dist
Base directory: empty
Functions directory: empty
```

Environment variables stay the same:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```
