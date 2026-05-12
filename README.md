# S-Fleet Fantasy War ⚔️ — English Localization Update

This package translates the game interface to English and keeps all Update 16 systems intact.

## Included systems

- City raid damage system
- Protection Wall damage rules
- Citadel / Gold Mine / Wood Collector damage rules
- Resource stealing based on breached structures
- S-Coins are never stealable
- Battle reports for city raids
- VIP, achievements and titles
- Guild Wars
- World Boss
- Advanced Auction House
- Mobile/PWA files

## Important

The Supabase schema is included as `supabase/schema.sql`. If you have already run the Update 16 SQL, you do not need to run it again just for translation. Run it only if your Supabase database is missing the latest functions/tables.

## Deploy

Upload these files to the same GitHub repository, commit changes, and Netlify will deploy automatically.

Build settings remain:

```txt
Build command: npm run build
Publish directory: dist
Base directory: empty
Functions directory: empty
```

## Environment variables

Keep the same Netlify variables:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Do not upload your database password, service role key, or secret key.
