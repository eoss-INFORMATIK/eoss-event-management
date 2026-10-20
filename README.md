# eoss Event Management

Next.js-Anwendung zum Anlegen von Events und Verwalten von Anmeldungen.
Organisatoren erstellen Events, Teilnehmer melden sich ueber ein oeffentliches
Formular an, Organisatoren sehen und verwalten ihre Teilnehmerlisten und
versenden E-Mails.

Entstanden aus dem eoss-Next.js-Starter (Remote `upstream`), seit September 2026
mit eigenem Stack: Supabase statt Neon/Drizzle/next-auth.

- **Framework** Next.js 16 (App Router, Server Components, Server Actions)
- **Auth und Datenbank** Supabase, SQL-Migrationen via Supabase CLI, kein ORM
- **Styling** Tailwind CSS v4 mit shadcn/ui
- **Formulare** react-hook-form und Zod
- **E-Mail** Resend fuer Transaktionsmails, Supabase fuer Anmeldelinks
- **Storage** Supabase Storage fuer Event-Bilder

Konventionen, Architektur und die Fallstricke dieses Projekts stehen in
[`CLAUDE.md`](./CLAUDE.md) — die Datei ist fuer AI-Agenten geschrieben, aber die
Gotchas lohnen sich auch fuer Menschen. Fachliche Entwuerfe liegen unter
[`docs/`](./docs).

## Entwickeln

```bash
npm run env:local     # Ziel waehlen: lokaler Stack
npm run db:start      # Supabase lokal (Docker muss laufen)
npm run dev
```

Details und alle Datenbankbefehle weiter unten.

## Code-Konventionen

Durchgesetzt von ESLint und Prettier, nicht von Hand:

- **kebab-case** fuer Dateien und Ordner — verhindert Aerger unter Windows
- Arrow Functions statt `function`-Deklarationen, wo moeglich
- Template Strings statt Konkatenation
- Imports werden automatisch sortiert (React/Next, Fremdpakete, `@/*`, relativ)
- Tailwind-Klassen werden nach Spezifitaet geordnet
- `.ts` fuer Dateien ohne JSX, `.tsx` nur mit JSX

Editor-Einstellungen fuer VS Code liegen im Repo. Wer etwas anderes benutzt:
Format und Fix beim Speichern einschalten.

## Styling und Komponenten

Tailwind, shadcn/ui und react-feather. Neue shadcn-Komponente hinzufuegen:

```bash
npx shadcn@latest add button
```

Komponenten unter `components/ui/` werden **nicht** von Hand editiert — sie
kommen aus dem Generator und werden darueber aktualisiert. Icons aus
`react-feather` importieren.

## Datenbank und lokale Entwicklung

Entwickelt wird gegen einen **lokalen** Supabase-Stack, nicht gegen das
gehostete Projekt. Das gehostete Projekt ist Produktion: `supabase db push` ist
dort nicht rueckrollbar, ein Reset gibt es nicht, und sobald echte Teilnehmer
registriert sind, liegen dort Personendaten.

### Ziel umschalten

`.env.local` wird **generiert** und nicht editiert. Die Quellen sind
`.env.hosted` und `.env.localstack` (beide von git ignoriert):

```bash
npm run env:local      # auf den lokalen Stack
npm run env:hosted     # auf das gehostete Projekt
npm run env:show       # welches Ziel ist aktiv?
```

Nach dem Umschalten den Dev-Server neu starten -- Next liest die Env beim
Start, nicht pro Request.

### Lokaler Stack

```bash
npm run db:start       # Docker muss laufen (Colima oder Docker Desktop)
npm run db:reset       # Migrationen neu anwenden + supabase/seed.sql
npm run db:stop
```

Danach: Studio auf <http://127.0.0.1:54323>, Mailcatcher auf
<http://127.0.0.1:54324>. Magic Links gehen in den Catcher, es verlaesst keine
Mail den Rechner. Google-Anmeldung funktioniert lokal ebenfalls -- die
Credentials stehen in `.env.supabase`, und in der Google Cloud Console muss
`http://127.0.0.1:54321/auth/v1/callback` als autorisierte Redirect-URI am
bestehenden OAuth-Client eingetragen sein.

Es gibt bewusst **kein** Script fuer `db reset --linked`. Dieser Befehl setzt
das gehostete Projekt zurueck.

### Migrationen und Typen

```bash
npm run db:new -- organizations    # neue Migrationsdatei
npm run db:types                   # Typen aus dem lokalen Stack
npm run db:check                   # welche Migration liegt wo? local vs. remote
npm run db:push                    # auf das gehostete Projekt (nicht rueckrollbar)
```

Die Migrationsdateien sind die Wahrheit, nicht die Datenbank. `db:types`
generiert deshalb aus dem lokalen Stack, der sie frisch abgespielt hat.
`db:check` ist der einzige Beweis dafuer, dass eine Migration auch auf dem
gehosteten Projekt liegt -- die generierten Typen beweisen das nicht.
