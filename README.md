# S-Fleet Fantasy War ⚔️ — Update 61–67

Current live badge: **Update 67 · Beta Testing Tools**.

This bundle is built on the latest English/Supabase version and includes the full UI/polish/testing pass:

## Included updates

- **Update 61 · UI Cleanup + Game Polish**
  - grouped navigation
  - cleaner game sections
  - admin tools separated from normal player tools
- **Update 62 · Better Battle Animations**
  - critical/block/dodge/spell visual feedback pack
- **Update 63 · Real Assets / Fantasy Graphics Pack**
  - fantasy art direction cards and visual system
- **Update 64 · Better City Map**
  - polished city district overview
- **Update 65 · Server-Side Economy Hardening**
  - economy audit checklist and premium-currency protection plan
- **Update 66 · Public Landing Page + Game Rules**
  - beta rules, player-facing launch notes and rules acknowledgement support
- **Update 67 · Beta Testing Tools**
  - QA checklist
  - tester notes
  - debug export
  - beta readiness score
  - Supabase beta testing summary tables/functions

## Build settings on Netlify

```txt
Build command: npm run build
Publish directory: dist
Base directory: empty
Functions directory: empty
```

## Environment variables

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Supabase SQL

Run the full file:

```txt
supabase/schema.sql
```

in:

```txt
Supabase → SQL Editor → New query → Run
```

The Update 61–67 SQL is safe to run multiple times and adds:

- `beta_test_reports`
- `economy_audit_logs`
- `game_rules_acknowledgements`
- `beta_testing_summary()`
- safe admin helper function `is_admin_email(text)` if it is missing

## Deploy

Upload/replace all files in GitHub, then Netlify will deploy automatically.
