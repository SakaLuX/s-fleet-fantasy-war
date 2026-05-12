# S-Fleet Fantasy War ⚔️ — Update 73

This package contains **Update 68–73** on top of the existing beta build.

## Current badge

```txt
Update 73 · Server-Side Economy Hardening
```

## Included updates

- **Update 68 · Real Production Cleanup + Launch Preparation**
- **Update 69 · Real Art Pack + Icons**
- **Update 70 · Beta Launch v1**
- **Update 71 · Feedback System + Player Survey**
- **Update 72 · S-Coin Monetization Admin Flow**
- **Update 73 · Server-Side Economy Hardening**

## What changed

- cleaner launch panel
- starter pack for new/beta players
- beta rules acceptance
- feedback/survey panel
- manual S-Coin package request flow
- admin economy hardening panel
- marketplace safety caps
- Update 73 changelog entries
- Supabase SQL for feedback, S-Coin package requests and launch readiness logs

## Supabase

Run the full file:

```txt
supabase/schema.sql
```

in:

```txt
Supabase → SQL Editor → New query → Run
```

## Netlify

Same settings as before:

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
