# Starter Project for Next JS Projects @ eoss

This Starter Project acts as a base for all Next JS projects @ eoss. The Starter Project provides:

- Linting and Formatting Rules
- Folder Structure and Organization
- Styling and Components Library
- Forms
- ORM
- Database Setup [pending]
- Auth Setup [pending]
- Stripe Payments [pending]
- Emails [pending]
- Docker Setup [pending]

## eslint and prettier Rules

- Kebap Case Files and Folders: to prevent issues with Windows OS, all files and folders should be kebap cased.
- we prefer Arrow Functions when possible
- we use template strings when possible

- All Imports are sorted automatically
- All Tailwind Classes are ordered according to specifity

We provide editor settings for VS Code, please setup to auto format and fix on save if you dont use VS Code.

## Folder and Project Structure

## Styling and Components

We use Tailwind, react-feather and shadcn as styling tools and component library. To install a new shadcn component, use the cli command:

`npx shadcn@latest add button`

to add a button for example.

To use iconst import what ever you need from react-feather.


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
