# S-Fleet Fantasy War ⚔️

Prima versiune MVP: browser fantasy RPG cu oraș, erou, clase, lupte pe ture, questuri, login/register și salvare progres cu Supabase.

## Ce conține

- React + Vite
- Supabase Auth pentru login/register
- Supabase PostgreSQL pentru salvarea progresului
- fallback demo local dacă nu sunt configurate variabilele Supabase
- pregătit pentru Netlify
- `netlify.toml`
- script SQL în `supabase/schema.sql`

---

## 1. Test local pe PC

Instalează Node.js LTS, apoi în folderul proiectului rulează:

```bash
npm install
npm run dev
```

Deschide adresa afișată în terminal, de obicei:

```bash
http://localhost:5173
```

Fără Supabase configurat, jocul rulează în modul demo local.

---

## 2. Creează proiect Supabase

1. Intră în Supabase.
2. New project.
3. Alege nume, parolă database și regiune.
4. După creare, mergi la SQL Editor.
5. Creează un query nou.
6. Copiază tot conținutul din:

```txt
supabase/schema.sql
```

7. Apasă Run.

---

## 3. Ia cheile Supabase

În Supabase Dashboard:

1. Project Settings.
2. API.
3. Copiază:
   - Project URL
   - anon public key

Creează local fișierul `.env.local` în rădăcina proiectului:

```env
VITE_SUPABASE_URL=https://PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=anon_key_aici
```

Apoi rulează iar:

```bash
npm run dev
```

---

## 4. Upload pe GitHub

1. Creează repository nou pe GitHub.
2. Urcă toate fișierele din acest proiect.
3. Nu urca `.env.local`.

---

## 5. Deploy pe Netlify

În Netlify:

1. Add new site.
2. Import an existing project.
3. Alege GitHub.
4. Selectează repository-ul jocului.
5. Build command:

```bash
npm run build
```

6. Publish directory:

```bash
dist
```

7. La Environment variables adaugă:

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

8. Deploy.

---

## 6. Important pentru test login

Dacă Supabase cere confirmare email, ai două variante:

- verifici emailul după register;
- sau pentru test dezactivezi temporar email confirmation din Supabase Auth settings.

---

## Următoarele update-uri recomandate

1. Admin panel pentru balansare monștri și reward-uri.
2. PvP asincron.
3. Guilds.
4. Shop cu iteme.
5. Inventar și echipamente.
6. Timer pentru construcții.
7. Leaderboard.
