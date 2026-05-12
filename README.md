# S-Fleet Fantasy War ⚔️ — Update 5

Update 5 adaugă modificările de economie și limite pentru oraș.

## Ce este nou

- clădire nouă **Wood Collector** pentru producția de lemn;
- **Citadel** are maxim **level 50**;
- **Citadel** controlează nivelul maxim al celorlalte clădiri;
- celelalte clădiri pot crește în continuare, dar niciodată peste nivelul Citadel;
- exemplu: dacă Citadel este level 3, restul clădirilor pot urca doar până la level 3;
- exemplu: dacă Citadel este level 25, restul clădirilor pot urca până la level 25;
- producția pe oră include acum Wood Collector;
- progresul salvat rămâne compatibil cu jucătorii existenți.

## Supabase

Nu trebuie să modifici Supabase. Wood Collector se adaugă automat în salvarea JSON existentă.

## Upload pe GitHub

1. Descarcă ZIP-ul.
2. Dezarhivează-l.
3. Intră în repository-ul tău `s-fleet-fantasy-war`.
4. Upload/înlocuiește toate fișierele cu cele din acest pachet.
5. Apasă **Commit changes**.
6. Netlify va face deploy automat.

## Build settings Netlify

```txt
Build command: npm run build
Publish directory: dist
Base directory: gol
Functions directory: gol
```

## Environment variables

Rămân aceleași:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```
