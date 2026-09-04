# Migrationsplan: Neon/Drizzle/next-auth → Supabase

Status: **geplant**, noch nicht begonnen.
Branch: `refactor/supabase`

## Entscheidungen

| Thema | Entscheidung |
|---|---|
| Auth | Supabase Auth (ersetzt next-auth v5-beta vollständig) |
| Datenschicht | `supabase-js` + SQL-Migrationen via Supabase CLI, **kein Drizzle** |
| Bestandsdaten | Keine — grüne Wiese, Schema wird neu aufgesetzt |
| Ordnerstruktur | Angeglichen an das Referenzprojekt: kein `src/`, `features/`, `@/*` → Wurzel |
| Toolchain | Next 16, Tailwind 4, ESLint 9 Flat Config |
| Vorgehen Toolchain | Scaffold-Reset statt schrittweiser Migration |

## Abweichungen von der Referenz (bewusst)

Behalten, obwohl im Referenzprojekt nicht vorhanden:

- `zod` + `react-hook-form` — das Event-Formular und die Teilnehmer-Registrierung
  brauchen echte Formularvalidierung. Zod-Schemas werden von `drizzle-zod` auf
  plain Zod umgeschrieben.
- `@t3-oss/env-nextjs` — getypte Env-Variablen, ist bereits etabliert.

Zusätzlich, in der Referenz nicht abgedeckt:

- Bild-Upload läuft heute über `@vercel/blob` → wandert auf Supabase Storage,
  damit der Stack an einem Anbieter hängt.

## Phasen

Jede Phase endet mit lauffähigem `npm run build`.

### Phase 0 — Vorbereitung

- [ ] Branch `refactor/supabase` anlegen
- [ ] Offene `package.json`-Änderung committen (React-19-Pin von RC auf `^19.0.0`)
- [ ] Supabase CLI installieren (fehlt lokal)
- [ ] Supabase-Projekt anlegen, Keys notieren
- [ ] `CLAUDE.md` für dieses Projekt schreiben (Zielzustand, nicht Ist-Zustand)
- [ ] `.cursorrules` löschen — brauchbarer Inhalt geht in die `CLAUDE.md`

### Phase 1 — Scaffold-Reset

Statt Tailwind 3→4 zu migrieren, ESLint auf Flat Config umzuschreiben und shadcn
neu zu initialisieren: frisches Scaffold, Configs übernehmen.

- [ ] `create-next-app@latest` im Scratchpad (ohne `src/`, Alias `@/*`, TW 4, ESLint 9)
- [ ] Configs ins Repo übernehmen: `package.json`, `tsconfig.json`, `eslint.config.mjs`,
      `postcss.config.mjs`, `next.config.ts`, `app/globals.css`
- [ ] Entfällt dabei: `tailwind.config.ts`, `.eslintrc.json`, das `overrides`-Feld mit
      `types-react@19.0.0-rc.1`
- [ ] `shadcn` (nicht `shadcn-ui`) initialisieren, benötigte Komponenten neu ziehen:
      button, card, form, input, label, sonner, table, textarea
- [ ] Prettier-Setup + Import-Sortierung aus dem alten Stand übernehmen

### Phase 2 — Struktur & Komponenten-Umzug

Reiner Move plus Anpassung an TW 4 / neue shadcn-Komponenten. Keine Datenlogik.

- [ ] `src/app` → `app/`, `src/components` → `components/`, `src/lib` → `lib/`
- [ ] `src/server/` + `src/queries/` → `features/events/`, `features/participants/`,
      `features/email/`
- [ ] Namens-Cleanup:
      - `Sign-Out-Button/` → `sign-out-button/`
      - `single-event-registration.tsx/` (Verzeichnis mit `.tsx` im Namen) → `single-event-registration/`
      - `.tsx`-Dateien ohne JSX → `.ts`
- [ ] Import-Pfade auf den neuen Alias

### Phase 3 — Supabase-Schema

Die 4 Drizzle-Migrationen sind zusammen 91 Zeilen — Neuschreiben als SQL ist
sauberer als Übersetzen.

- [ ] `supabase init`
- [ ] Tabellen `user` / `account` / `session` entfallen → `auth.users`
- [ ] `events`: `organizer_id` → `references auth.users(id)`
- [ ] `event_participants` unverändert im Aufbau
- [ ] RLS-Policies:
      - `events`: SELECT öffentlich; INSERT/UPDATE/DELETE nur `organizer_id = auth.uid()`
      - `event_participants`: INSERT öffentlich (Anmeldung); SELECT/UPDATE/DELETE nur
        für den Organisator des zugehörigen Events
- [ ] `supabase gen types typescript` → `types/database.ts`

Die Ownership-Prüfungen, die heute in jeder Server Action stehen, bleiben — aber
als Nutzer-Fehlermeldung, nicht als Sicherheitsgrenze. Die Grenze ist ab jetzt RLS.

### Phase 4 — Auth + Datenschicht

Zusammen, weil jede Action beides gleichzeitig braucht. Slice-weise committen.

- [ ] `server/supabase/client.ts` (Browser), `server.ts` (Server), `middleware.ts`
- [ ] `middleware.ts` an der Wurzel: Session-Refresh, Redirect-Regeln
- [ ] `next-auth`, `@auth/drizzle-adapter` entfernen
- [ ] Auth-Seiten auf Supabase: `sign-in`, `verify`, `register`, neu `/auth/callback`
      (Google OAuth + Magic Link)
- [ ] Slice **events**: `features/events/` auf `supabase-js`
- [ ] Slice **participants**: inkl. Data-Table
- [ ] Slice **email**: Resend bleibt, nur der Datenzugriff ändert sich
- [ ] Löschen: `drizzle-orm`, `drizzle-zod`, `drizzle-kit`, `postgres`,
      `migrations/`, `drizzle.config.ts`, `docker-compose.yml`, `src/db/`

**Kritisch:** Supabase-Server-Client niemals auf Modulebene erzeugen, immer
innerhalb der Funktion — sonst „cookies outside request scope". Gehört in die
`CLAUDE.md`.

### Phase 5 — Storage & Abschluss

- [ ] Vercel Blob → Supabase Storage (Bucket + Policies), `@vercel/blob` entfernen
- [ ] `.env` → `.env.local`; `env/server.ts` auf `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`,
      `SITE_URL`
- [ ] README aktualisieren
- [ ] `MIGRATION.md` löschen

## Was erhalten bleibt

Der Grund, warum umgebaut und nicht neu aufgesetzt wird:

- Formulare: `add-event-form`, `edit-event-form`, `event-registration-form`
- `participants-table` (columns + data-table, TanStack Table)
- `header`, `nav`, `single-event-card`, `single-event-meta`, `file-upload`,
  `email-template`
- Domänenmodell (Events, Teilnehmer, Status-Workflow: pending/confirmed/declined/waitlisted)
- Git-Historie ab Oktober 2024
