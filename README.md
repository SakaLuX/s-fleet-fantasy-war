# S-Fleet Fantasy War ⚔️ — Update 9

Update 9 adaugă:

- **Guild / Alianță**
- **Admin Panel** pe email
- **Protection Wall** la Citadel, crescut separat până la nivel 10
- **Observation Tower** pentru atacuri incoming
- **Atacuri pe orașele jucătorilor** cu timp de drum de 10 minute
- buton în Arena: **Trimite atac spre oraș · 10 min**
- City Defense panel în tabul Oraș

## Important: SQL obligatoriu

Pentru Update 9 trebuie rulat `supabase/schema.sql` în Supabase:

```txt
Supabase
→ SQL Editor
→ New query
→ lipești tot din supabase/schema.sql
→ Run
```

## Activare Admin Panel pe email

După ce rulezi SQL-ul, adaugă emailul contului care trebuie să fie admin.

În Supabase > SQL Editor rulezi:

```sql
insert into public.admin_users(email)
values ('EMAILUL_TAU_AICI')
on conflict (email) do nothing;
```

Exemplu:

```sql
insert into public.admin_users(email)
values ('admin@example.com')
on conflict (email) do nothing;
```

Apoi intri în joc cu acel cont, iar tabul **🧰 Admin** apare automat.

## Admin poate modifica

Admin Panel permite editarea salvării JSON pentru orice jucător:

- resurse
- level / paragon
- clădiri
- inventory
- echipamente
- mount-uri
- Paladin
- guild info
- orice alt câmp din salvare

## City Attacks

Atacurile spre orașe funcționează așa:

1. Intri în **Arena**.
2. Alegi un jucător.
3. Apeși **Trimite atac spre oraș · 10 min**.
4. Atacul apare la tine ca outgoing.
5. La defender apare ca incoming în Oraș, prin **Observation Tower**.
6. După 10 minute se rezolvă automat când unul dintre jucători intră/refresh în joc.

## Clădiri noi

- **Protection Wall**: max level 10, crește City Defense.
- **Observation Tower**: arată atacurile incoming.

## Deploy

Înlocuiești fișierele din GitHub cu cele din ZIP, apoi Netlify face deploy automat.

Build settings rămân:

```txt
Build command: npm run build
Publish directory: dist
Base directory: gol
Functions directory: gol
```
