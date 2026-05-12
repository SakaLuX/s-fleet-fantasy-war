# S-Fleet Fantasy War ⚔️ — Update 2

Update 2 adaugă sistemul de loot și echipamente.

## Ce este nou

- tab nou **Inventory**
- item drops după lupte câștigate
- rarități: Common, Rare, Epic, Legendary
- sloturi de echipament: Weapon, Armor, Ring, Amulet
- butoane Equip / Unequip / Sell
- bonusuri pe iteme: HP, Attack, Defense, Mana
- Power calculat și din echipamente
- quest nou: Loot Collector
- compatibilitate cu salvările existente

## Important pentru Supabase

Nu trebuie să schimbi tabela Supabase.

Inventarul și echipamentele sunt salvate în același câmp JSONB:

```txt
game_saves.data
```

Dacă ai deja jocul live și progresul se salvează, trebuie doar să faci update la fișierele din GitHub.

## Cum faci update pe GitHub

1. Descarcă ZIP-ul.
2. Dezarhivează-l.
3. Intră în repository-ul GitHub al jocului.
4. Încarcă / înlocuiește fișierele din pachet.
5. Apasă **Commit changes**.
6. Netlify va porni deploy automat.

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
