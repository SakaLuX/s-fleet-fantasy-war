# S-Fleet Fantasy War ⚔️ — Update 10

Update 10 adaugă sistemele zilnice și rezolvă problema cu energia care revenea la 10 după consum.

## Ce conține

- Daily Login Rewards pe 7 zile
- Daily Quests cu reset zilnic
- Inbox / Mail pentru reward-uri, shield, vânzări și progres
- Battle Reports pentru atacurile pe oraș
- Shield Protection 2h / 8h / 24h
- verificare shield în Supabase pentru city attacks
- buton **Vinde tot inventarul**
- fix energie: energia curentă rămâne 0 după consum și nu revine automat la 10
- energia maximă respectă regula: **level 1 = 10**, apoi **+1 / level sau Paragon**

## Important pentru Supabase

Pentru Shield Protection la atacurile pe oraș, rulează scriptul SQL nou:

```txt
Supabase
→ SQL Editor
→ New query
→ lipești tot din supabase/schema.sql
→ Run
```

Scriptul păstrează datele existente și actualizează funcția `launch_city_attack`, astfel încât orașele cu shield activ nu pot fi atacate.

## Cum urci update-ul

```txt
GitHub
→ repository s-fleet-fantasy-war
→ Add file
→ Upload files
→ tragi toate fișierele/folderele din ZIP
→ Commit changes
```

Netlify va face deploy automat.

Dacă nu pornește automat:

```txt
Netlify
→ site-ul tău
→ Deploys
→ Trigger deploy
→ Deploy site
```

## Build settings Netlify

```txt
Build command: npm run build
Publish directory: dist
Base directory: gol
Functions directory: gol
```

## Environment variables rămân aceleași

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Nu pune parola bazei de date, nu pune service_role, nu pune secret key.
