# S-Fleet Fantasy War ⚔️ — Update 51

## Update 51 · Beta Stability + Bug Tracker

This update adds beta stability tools on top of Update 50.

### Included

- Version badge: **Update 51 · Beta Stability**
- Report Bug panel for players
- Admin Bug Tracker panel
- Changelog panel with update history
- Debug JSON export
- Recovery mode improvements
- Local bug history
- Supabase `bug_reports` table
- Admin bug summary function

### Important SQL step

Run the new SQL file in Supabase:

```txt
Supabase
→ SQL Editor
→ New query
→ paste everything from supabase/schema.sql
→ Run
```

This adds:

```txt
bug_reports
admin_bug_summary()
```

### Deploy

Upload all files to GitHub, replacing the existing project files.

Netlify settings remain:

```txt
Build command: npm run build
Publish directory: dist
Base directory: empty
Functions directory: empty
```

Environment variables remain:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### After deploy

Check the new tabs:

```txt
📜 Changelog
🐞 Report Bug
🐞 Bug Tracker (admin only)
```
