# S-Fleet Fantasy War ⚔️ — Update 11-15 Bundle

Acest pachet include toate update-urile cerute într-un singur deploy:

- Update 11: VIP + Achievements + Titles
- Update 12: Guild Wars
- Update 13: World Boss
- Update 14: Auction House avansat
- Update 15: Mobile UI polish + PWA app
- Blocare atac/PvP între membri din aceeași alianță
- Monștri mai puternici în funcție de nivel, uneori Elite/Strong peste nivelul tău
- Buton **Cheamă aliat** în lupta normală, pentru ajutor de la alianță

## Foarte important

Rulează din nou `supabase/schema.sql` în Supabase SQL Editor. Scriptul este safe pentru datele existente și adaugă:

- `get_guild_members`
- `guild_wars`
- `declare_guild_war`
- `get_guild_wars`
- `add_guild_war_score`
- `world_boss_state`
- `get_world_boss`
- `attack_world_boss`
- protecție SQL: nu poți ataca un oraș din aceeași alianță

## Netlify

Build settings rămân la fel:

```txt
Build command: npm run build
Publish directory: dist
Base directory: gol
Functions directory: gol
```

Environment variables rămân:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## PWA

Pachetul include:

- `manifest.webmanifest`
- `sw.js`
- `icon.svg`

Pe telefon, site-ul poate fi adăugat pe ecranul principal din browser.
