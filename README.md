# S-Fleet Fantasy War ⚔️ — Update 7

Update 7 adaugă:

- fix pentru ecran negru: safe loader + error recovery panel
- hartă vizuală în oraș, cu clădiri clickabile
- Leaderboard după Power
- PvP Arena simplu între jucători
- profil public limitat pentru leaderboard/PvP
- compatibilitate cu salvările vechi

## Foarte important

Pentru Leaderboard și PvP trebuie rulat scriptul SQL actualizat:

```txt
supabase/schema.sql
```

Acesta adaugă coloana `public_profile` și funcția `get_public_players()`.
Nu șterge salvările existente.

## Pași update

1. Dezarhivează pachetul.
2. Intră în GitHub repository-ul jocului.
3. Înlocuiește fișierele cu cele din acest update.
4. Commit changes.
5. Netlify va face deploy automat.
6. În Supabase > SQL Editor > New query, rulează tot scriptul din `supabase/schema.sql`.
7. Intră în joc, fă o acțiune mică sau așteaptă salvarea automată.
8. Intră la tabul `🏆 Arena`.

## Dacă site-ul încă apare negru

1. Verifică în GitHub să fie fișierele direct în root:

```txt
package.json
index.html
src/App.jsx
src/styles.css
supabase/schema.sql
netlify.toml
```

2. În Netlify verifică:

```txt
Build command: npm run build
Publish directory: dist
Base directory: gol
```

3. Trigger deploy manual:

```txt
Netlify > Deploys > Trigger deploy > Deploy site
```

## Supabase

Variabilele rămân aceleași:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Nu pune parola bazei de date, `service_role` sau `secret key` în Netlify.
