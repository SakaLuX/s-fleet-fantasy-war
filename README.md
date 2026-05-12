# S-Fleet Fantasy War ⚔️ — Update 3

Update 3 adaugă **World Map / Dungeon System**.

## Ce este nou

- tab nou **World**
- zone diferite:
  - Goblin Forest
  - Dark Wolves Valley
  - Skeleton Crypt
  - Infernal Gate
- fiecare zonă are:
  - level minim
  - cost de energie
  - monștri proprii
  - boss propriu
  - drop chance diferit
  - rarity boost pentru iteme
- boss fight pentru fiecare zonă
- progres salvat pentru boss defeated și clears pe zonă
- questuri noi:
  - Dungeon Runner
  - Boss Slayer
- compatibil cu salvările existente

## Important Supabase

Nu trebuie să schimbi tabela Supabase. Salvarea este în câmpul JSONB `data`, deci World Map, Dungeon, boss kills și clears se adaugă automat în salvarea existentă.

## Cum faci update pe GitHub

1. Descarcă ZIP-ul Update 3.
2. Dezarhivează-l.
3. Intră în repository-ul tău GitHub `s-fleet-fantasy-war`.
4. Înlocuiește fișierele vechi cu cele noi.
5. Apasă **Commit changes**.
6. Netlify pornește automat deploy.

## Dacă Netlify nu pornește automat

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
