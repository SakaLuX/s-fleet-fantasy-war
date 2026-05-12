# S-Fleet Fantasy War ⚔️ — Update 6

Update 6 adaugă progresie avansată și companion systems:

- Hero max level: **100**
- După level 100, progresia continuă ca **Paragon Level**, până la **Paragon 250**
- Energia pornește de la **10** și crește cu **+1** pe fiecare level/paragon
- Tab nou: **🐴 Companions**
- Mount-uri cu bonusuri de HP, Attack, Defense, Mana, Energy și Power
- Mount gratuit de început: **Brown Horse**
- Mount-uri unlockabile: **War Wolf**, **Crystal Stag**, **Dragon Whelp**
- Paladin Companion:
  - **Protejează orașul**: bonus la producția/oră și city power
  - **Ajută în lupte**: adaugă stats și lovește inamicul în combat
- Paladinul poate fi antrenat până la level 100
- Compatibil cu salvările existente

## Supabase

Nu trebuie modificată tabela Supabase. Totul se salvează în același câmp JSONB `data` din `game_saves`.

## Cum faci update pe GitHub

1. Descarcă ZIP-ul Update 6.
2. Dezarhivează-l.
3. Intră în repository-ul GitHub `s-fleet-fantasy-war`.
4. Apasă **Add file → Upload files**.
5. Încarcă toate fișierele/folderele din pachet.
6. Apasă **Commit changes**.
7. Netlify va porni deploy automat.

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

Nu pune parola bazei de date, nu pune `service_role`, nu pune `secret key`.
