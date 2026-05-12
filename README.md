# S-Fleet Fantasy War ⚔️ — Mega Update 32–40

This bundle is built on Update 31 and keeps existing saves compatible.

## Build status

Verified with:

```txt
npm run build
```

Build passes. Vite may show a bundle-size warning because the game is now large; it is not a deploy-blocking error.

## Included updates

### Update 32 — Real Graphics Pack + Better City / World Visuals
- New **Visuals** tab.
- Better fantasy city scene.
- Better world region cards.
- City defense / attack visual summary.

### Update 33 — Multiplayer Chat + Guild Chat
- New **Chat** tab.
- Global chat.
- Guild chat for alliance members.
- Lightweight polling refresh.

### Update 34 — Real-time-like Notifications
- New **Alerts** tab.
- Notification bar for unread mail, daily reward, empty energy and shield status.
- Browser notification permission support.
- Test alert button.

### Update 35 — Better Admin Dashboard
- New **Admin+** tab for admin accounts.
- Top players summary.
- S-Coin request summary.
- Admin/security log preview.

### Update 36 — S-Coin Request / Manual Payment Panel
- New **Requests** tab.
- Players can request S-Coins.
- Creator/admin approves or rejects manually.
- Approval grants S-Coins server-side using `admin_grant_resource`.

### Update 37 — Real Tutorial Flow
- New **Guide** tab.
- Step-by-step onboarding path.
- One-time beginner reward.

### Update 38 — Sound Effects + Accessibility
- New **Sound** tab.
- Optional UI/battle/reward sounds.
- Reduced motion toggle.
- Compact UI mode.

### Update 39 — Better Combat Animations
- Combat animation direction/demo added in Sound/Combat Animation Lab.
- CSS animation layer for battle feedback.

### Update 40 — Production Optimization
- New **Optimize** tab.
- PWA/app cache tools.
- Save trimming/optimization.
- Production checklist.

## Required SQL

Run the updated SQL file in Supabase:

```txt
supabase/schema.sql
```

Supabase path:

```txt
Supabase
→ SQL Editor
→ New query
→ paste all from supabase/schema.sql
→ Run
```

This adds:

```txt
game_chat_messages
s_coin_requests
admin_dashboard_summary()
```

It also keeps previous SQL from Update 31.

## Deploy

Upload these files to GitHub and replace the old project files.

Netlify settings remain:

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
