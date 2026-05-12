# S-Fleet Fantasy War ⚔️ — Update 8

Update 8 adaugă:

- Timer la construcții
- Finalizare construcții cu S-Coins
- Shop cu gold / diamonds / S-Coins
- Schimbare clasă cu S-Coins
- Energie instant cu S-Coins
- Pachete resurse și chest-uri în shop
- Paladin training limitat la nivelul eroului / Paragon
- Trade Center / Marketplace între jucători
- Vânzare iteme către marketplace
- Cumpărare iteme de la alți jucători cu gold/diamonds
- Colectare câștiguri din marketplace

## Important Supabase

Pentru Trade Center / Marketplace trebuie rulat scriptul nou:

```txt
supabase/schema.sql
```

Pași:

```txt
Supabase
→ SQL Editor
→ New query
→ lipești tot din supabase/schema.sql
→ Run
```

Scriptul păstrează salvările existente și adaugă tabela:

```txt
marketplace_listings
```

## S-Coins

S-Coins sunt moneda premium. În această versiune se adaugă manual de creator în Supabase, în salvarea jucătorului:

```txt
game_saves → data → resources → sCoins
```

Utilizări S-Coins:

- schimbare clasă
- energie instant
- finalizare construcții
- premium chest
- redenumire erou

## Deploy

În GitHub înlocuiești fișierele vechi cu cele din acest ZIP și apeși Commit changes.
Netlify face deploy automat.

Build settings:

```txt
Build command: npm run build
Publish directory: dist
Base directory: gol
Functions directory: gol
```
