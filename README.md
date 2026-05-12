# S-Fleet Fantasy War ⚔️ — Update 4

Update 4 adaugă cerințele cerute peste Update 3:

- readuce **Wins** sus lângă **Power**
- butonul **Colectează resurse** funcționează o singură dată pe oră
- colectarea strânge producția pe ore întregi trecute, până la maximum 24h
- la colectare energia se umple la maximul suportat de caracter
- energia se afișează ca `curent/maxim`
- clasa eroului este blocată după creare
- tabul Erou nu mai permite schimbarea clasei
- compatibil cu salvările existente

## Nu trebuie modificat Supabase

Tabela rămâne aceeași. Datele noi se salvează în același câmp JSONB `data`.

## Cum îl urci

1. Descarcă ZIP-ul.
2. Dezarhivează-l.
3. Intră în repository-ul GitHub `s-fleet-fantasy-war`.
4. Upload/înlocuiește toate fișierele din ZIP.
5. Apasă **Commit changes**.
6. Netlify pornește deploy automat.

Dacă deploy-ul nu pornește:

```txt
Netlify
→ site-ul tău
→ Deploys
→ Trigger deploy
→ Deploy site
```

## Build settings

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

Nu pune parola bazei de date, `service_role` sau `secret key`.
