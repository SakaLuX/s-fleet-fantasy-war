# S-Fleet Fantasy War ⚔️ — Mega Update 17–30

This bundle is based on the English version + Update 16 and includes the Arena crash fix.

## Critical fix

- Fixed Arena runtime error:
  - `Cannot access 'g' before initialization`
  - Cause: opponent/guild check variable order in the Arena component.
  - Result: Arena should no longer crash to the recovery screen.

## Included systems

### Update 17 — Real Combat System Upgrade
- Critical hits
- Dodge
- Block
- Multiple class skills
- Auto battle
- Battle speed x1/x2/x3
- Alliance helper support remains active

### Update 18 — Advanced Hero Classes
- Class evolution unlocks at level 50
- Knight → Paladin / Warlord
- Mage → Archmage / Necromancer
- Archer → Ranger / Assassin
- Evolution adds permanent stat and power bonuses

### Update 19–20 — Item Upgrade + Blacksmith
- New Blacksmith tab
- Upgrade item up to +15
- Socket gems
- Dismantle items for materials
- Craft random gear

### Update 21 — Campaign
- New Campaign tab
- Story chapters with level requirements and rewards

### Update 22–23 — Alliance/Map Expansion
- Guild systems remain active
- New strategic Kingdom Map tab

### Update 24 — Notifications
- Inbox/mail remains the central notification system for rewards, attacks, sales and events

### Update 25–26 — Admin/Economy/Security
- Existing admin tools remain active
- Save-safe logs and security structures are prepared in the player data

### Update 27 — S-Coin Requests
- S-Coin economy remains manual/admin controlled
- Premium actions still use S-Coins

### Update 28–30 — Mobile/PWA/Season/Tutorial
- Existing PWA files included
- New Season / Battle Pass tab
- New Tutorial tab with beginner reward

## Supabase

No new SQL is required only for this bundle if you already ran the Update 16 SQL.

If World Boss or city raids are not working, run:

```txt
supabase/schema.sql
```

in Supabase SQL Editor.

## Deploy

Upload all files to GitHub, replacing the existing project files.

Netlify settings:

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
