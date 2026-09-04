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

**Zum Build-Status:** Ursprünglich war geplant, dass jede Phase mit lauffähigem
`npm run build` endet. Das ist nicht haltbar — sobald Drizzle und next-auth aus
den Dependencies fliegen, baut das Projekt erst wieder, wenn ihre Ersatzteile in
Phase 4 geschrieben sind. Phasen 1 bis 4 sind also eine zusammenhängende Strecke
ohne grünen Build.

Was stattdessen gilt: **nach jeder Phase sind die verbleibenden Fehler
vollständig erklärbar und auf den noch nicht migrierten Layer begrenzt.** Nach
Phase 2 heisst das: 0 ESLint-Fehler, und `tsc` meldet ausschliesslich fehlende
DB-/Auth-Module. Das ist die Kontrollgrösse, an der sich jede Phase messen lässt.

### Phase 0 — Vorbereitung

- [x] Branch `refactor/supabase` anlegen
- [x] Offene `package.json`-Änderung committen (React-19-Pin von RC auf `^19.0.0`)
- [x] Supabase CLI installieren (2.116.0 via Homebrew)
- [ ] **Supabase-Projekt anlegen, Keys notieren** — offen, manuell im Dashboard
- [x] `CLAUDE.md` für dieses Projekt schreiben (Zielzustand, nicht Ist-Zustand)
- [x] `.cursorrules` löschen — brauchbarer Inhalt geht in die `CLAUDE.md`

Beim Anlegen des Projekts: Region eu-central-2 (Zürich) oder eu-central-1
(Frankfurt). Die bestehenden Google-OAuth-Credentials aus `.env` können
wiederverwendet werden — in Supabase unter Authentication → Providers → Google
eintragen und in der Google Cloud Console die Redirect-URI
`https://<projekt-ref>.supabase.co/auth/v1/callback` ergänzen.

### Phase 1 — Scaffold-Reset ✅

Statt Tailwind 3→4 zu migrieren, ESLint auf Flat Config umzuschreiben und shadcn
neu zu initialisieren: frisches Scaffold, Configs übernehmen.

- [x] `create-next-app@latest` im Scratchpad (ohne `src/`, Alias `@/*`, TW 4, ESLint 9)
- [x] Configs übernommen → Next 16.3.4, React 19.2.8, Tailwind 4, ESLint 9 Flat Config
- [x] Entfallen: `tailwind.config.ts`, `.eslintrc.json`, `drizzle.config.ts`,
      `docker-compose.yml`, `migrations/`, `overrides` mit `types-react@19.0.0-rc.1`
- [x] shadcn-Komponenten für TW 4 neu gezogen (button, card, form, input, label,
      sonner, table, textarea)
- [x] `globals.css` auf TW 4 portiert — Markenfarben (`--primary: hsl(43 97.5% 52.2%)`)
      und Schriften (Poppins / Space Grotesk) unverändert übernommen
- [x] ESLint-Regeln aus `.eslintrc.json` portiert (`n/no-process-env`, `check-file`,
      `prefer-template`, `prefer-arrow-callback`)
- [x] Prettier-Setup + Import-Sortierung übernommen (`@/db` → `@/features`)

Nebenbei entfernt, weil nirgends verwendet: `@paralleldrive/cuid2`, `bcryptjs`,
`@types/bcryptjs` — Altlasten aus den ersten Auth-Versuchen.

Ebenfalls vorgezogen: **Zod 3 → 4** (`z.string().email()` → `z.email()`,
`error.errors` → `error.issues`). Die Schemas werden in Phase 4 ohnehin von
`drizzle-zod` auf plain Zod umgeschrieben — zwei Migrationen in einer.

Zwei React-Compiler-Regeln aus `eslint-config-next` 16 (`react-hooks/refs`,
`react-hooks/incompatible-library`) melden Fehlalarme auf react-hook-form und
TanStack Table. Gezielt abgeschaltet für `components/forms/**` und
`components/participants-table/**`, nicht global.

### Phase 2 — Struktur & Komponenten-Umzug ✅

- [x] `src/app` → `app/`, `src/components` → `components/`, `src/lib` → `lib/`,
      `src/env` → `env/`, `src/middleware.ts` → `middleware.ts`
- [x] `src/server/` + `src/queries/` → `features/events/actions.ts`,
      `features/participants/{actions,queries}.ts`, `features/email/`
- [x] `src/db/` und `src/config/` gelöscht (werden in Phase 3/4 ersetzt)
- [x] Namens-Cleanup: `Sign-Out-Button/` → `sign-out-button/`,
      `single-event-registration.tsx/` → `single-event-registration/`,
      `.tsx` ohne JSX → `.ts`
- [x] Import-Pfade auf den neuen Alias
- [x] `env/server.ts` → `env/index.ts`, auf Supabase-Variablen umgestellt
      (aus Phase 5 vorgezogen, weil die Datei ohnehin angefasst wurde)

**Stand nach Phase 2:** `npx eslint` läuft mit 0 Fehlern. `tsc` meldet 34 Fehler —
ausnahmslos fehlende `drizzle-orm` / `next-auth` / `@vercel/blob` / `@/db` /
`@/config/auth`. Kein einziger Fehler ausserhalb des DB/Auth-Layers.

### Phase 3 — Supabase-Schema ✅ (Code) / offen (Deployment)

- [x] `supabase init`
- [x] `20260904200150_initial_schema.sql` — events + event_participants,
      next-auth-Tabellen entfallen, `organizer_id` → `auth.users`
- [x] RLS-Policies für beide Tabellen
- [x] `20260904201001_event_images_storage.sql` — Bucket `event-images`
      (5 MB, nur Bildformate) mit Policies, ersetzt Vercel Blob
- [x] `types/database.ts` — von Hand geschrieben, damit Phase 4 nicht auf die
      CLI-Anmeldung warten musste
- [ ] `supabase login` — **manuell, interaktiv**
- [ ] `supabase link --project-ref mcztjefizxfpcfsqmlec`
- [ ] `supabase db push`
- [ ] `supabase gen types typescript --linked > types/database.ts` — ersetzt die
      handgeschriebene Fassung und bestätigt, dass sie stimmt

Bewusste Abweichungen vom alten Schema:

- `timestamptz` statt `timestamp` — naive Timestamps verschieben sich für alle
  ausserhalb der Serverzeitzone
- `on delete cascade` auf `event_participants.event_id` — vorher schlug das
  Löschen eines Events mit Anmeldungen an einer Foreign-Key-Verletzung fehl
- `check`-Constraint auf `status` — vorher stand die Werteliste nur im Kommentar
- `updated_at` per Trigger statt in der Anwendung
- **Neu: Unique-Index auf `(event_id, lower(email))`** — eine Anmeldung pro
  Adresse und Event. Verhaltensänderung; falls unerwünscht, ist es eine Zeile.

### Phase 4 — Auth + Datenschicht ✅

- [x] `server/supabase/{client,server,proxy}.ts`
- [x] `proxy.ts` an der Wurzel (Next 16 hat `middleware.ts` abgelöst)
- [x] `next-auth`, `@auth/drizzle-adapter` entfernt
- [x] `features/auth/` — Magic Link + Google, `app/auth/callback/route.ts`
- [x] Events, Teilnehmer, E-Mail auf `supabase-js`
- [x] Zod-Schemas statt `drizzle-zod`
- [x] Drizzle, `postgres`, `migrations/`, `drizzle.config.ts`,
      `docker-compose.yml`, `src/db/` gelöscht

### Phase 5 — Storage & Abschluss

- [x] Vercel Blob → Supabase Storage, Upload direkt aus dem Browser
- [x] `.env` → `.env.local` mit Supabase-Variablen
- [ ] Google-OAuth im Supabase-Dashboard hinterlegen (Credentials liegen in der
      alten `.env`), Redirect-URI in der Google Cloud Console ergänzen:
      `https://mcztjefizxfpcfsqmlec.supabase.co/auth/v1/callback`
- [ ] Site URL und Redirect URLs im Supabase-Dashboard setzen
- [ ] Optional: Resend als Custom SMTP in Supabase, damit Magic Links von
      `hello@resend.eoss.ch` kommen statt von Supabase
- [ ] Durchklicken: Anmelden, Event anlegen, Bild hochladen, anmelden als Gast,
      Teilnehmer verwalten
- [ ] Alte `.env` löschen (enthält noch Neon- und Blob-Zugangsdaten)
- [ ] README aktualisieren
- [ ] `MIGRATION.md` löschen

## Im Bestand gefundene Fehler

Beim Umbau aufgefallen und mitbehoben — keine Regressionen, sondern Dinge, die
vorher schon falsch waren:

1. **`deleteParticipant` und `setParticipantStatus` hatten keine Auth-Prüfung.**
   Jeder Besucher konnte Teilnehmer fremder Events löschen oder deren Status
   ändern. Jetzt durch RLS abgedeckt.
2. **`/api/event/upload` akzeptierte Uploads ohne Session.** Route entfernt,
   Storage-Policies verlangen eine Anmeldung.
3. **Das Formular-Schema wies jedes Event mit Bild zurück.** `imageUrl` war als
   `z.string()` deklariert, das Formular schrieb aber ein `File`-Objekt hinein.
4. **Das Registrierungsformular hing bei Fehlern auf „Loading…".** `status`
   wurde nie zurückgesetzt, die Fehlermeldung war nie sichtbar.
5. **E-Mail-Versand lief per HTTP-Request an die eigene API-Route** — aus einer
   Server Action heraus, also ein voller Roundtrip zu Code im selben Prozess.
6. **Ungenutzter Code:** `components/file-upload.tsx` (Demo mit „Upload Your
   Avatar"), `@paralleldrive/cuid2`, `bcryptjs`.

## Was erhalten bleibt

Der Grund, warum umgebaut und nicht neu aufgesetzt wurde:

- Formulare: `add-event-form`, `edit-event-form`, `event-registration-form`
- `participants-table` (columns + data-table, TanStack Table)
- `header`, `nav`, `single-event-card`, `single-event-meta`, `email-template`
- Domänenmodell (Events, Teilnehmer, Status-Workflow)
- Git-Historie ab Oktober 2024
