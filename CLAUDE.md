# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stand

Die Migration von Neon/Drizzle/next-auth auf Supabase ist durch; `MIGRATION.md`
wurde nach Abschluss entfernt, die Historie steht in den Commits. Schema und RLS
liegen auf dem Supabase-Projekt, Anmeldung und Konto-Einrichtung sind gegen den
lokalen Stack verifiziert.

**Laufende Arbeit:** Multi-Org nach `docs/EOS-20_Multi_Org_Setup`, Schritt 1.
Die Tabellen `organizations`, `organization_user` und `profiles` stehen samt RLS
und Trigger, und `ensureOrganization()` richtet Profil und Organisation bei der
Anmeldung ein. Noch offen: `events`, `event_participants` und der Storage-Pfad
hängen am User statt an der Organisation, und `organization_user` fehlt das
`on delete cascade` auf beiden Fremdschlüsseln.

## Arbeitsmodus: Liefermodus

Dieses Projekt hat Kundeninteresse und läuft ab 2026-10-19 als **normales
agentic-engineering-Projekt**: der Agent schreibt, erklärt knapp, liefert.
Die frühere Lernvereinbarung (Sh schreibt, Agent fragt) gilt hier **nicht mehr**
— sie ist nach `README.learn.md` ausgezogen und für neue Projekte ohne Kunden
gedacht.

Was aus dem Lernmodus bleibt, weil es Qualität ist und nicht Didaktik:

- **Entscheidung vor Code.** Architekturentscheidungen stehen geschrieben,
  bevor sie implementiert werden — Muster siehe `docs/EOS-20_Multi_Org_Setup`
  (Problem / Entscheidung / Wirkung).
- **Kleine Scheiben.** Eine Migration pro Belang, ein verifizierbares Ergebnis
  pro Schritt. Nicht drei Tabellen plus Policies plus Trigger in einem Zug.
- **Keine stillen Entscheidungen.** Wo zwei Wege vertretbar sind, nennt der
  Agent beide und seine Empfehlung, statt einen einfach zu bauen.

## Branches und Deployment

**`main` ist der Production-Branch — ein Commit dorthin ist ein Release.** Vercel
deployt jeden Push auf `main` nach Produktion. Deshalb:

- **Nie direkt auf `main` committen.** Jede Änderung über einen Branch und einen
  Pull Request, auch Einzeiler. Ein Ruleset auf GitHub erzwingt das.
- Branchnamen `<typ>/<kurz>`: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`.
- Gemerged wird erst, wenn **beide Checks grün** sind: der Vercel-Preview-Build
  und `CI / verify`.
- Keine Review-Pflicht — Sh arbeitet allein, und eine Pflicht, die man selbst
  abnickt, ist Zeremonie.

### Was welcher Check abdeckt

| | Vercel | `CI / verify` |
|---|---|---|
| Build | ✓ | — (nicht doppelt) |
| TypeScript | ✓ | ✓ (`npm run typecheck`) |
| ESLint | **nein** | ✓ (`npm run lint`) |
| Tests | nein | hier, sobald es welche gibt |

`next build` lintet seit Next 15 nicht mehr mit — ein Lint-Fehler würde ohne den
CI-Workflow unbemerkt nach Produktion gehen.

### Pre-commit-Hook

`husky` + `lint-staged` formatieren und linten **nur die gestageten Dateien**.
Bewusst keine Tests und kein Typecheck im Hook: der Hook muss unter zwei
Sekunden bleiben, sonst wird er mit `--no-verify` umgangen und ist Theater. Und
er schützt ohnehin nur den lokalen Rechner — die Grenze, die wirklich hält, ist
der Status-Check am Pull Request, weil der serverseitig erzwungen wird.

## Project Overview

EOSS Event Management — a Next.js application for creating events and managing
participant registrations. Organizers create events, participants register via a
public form, organizers see and manage their participant lists and send emails.

## Development Commands

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint
npm run format       # Prettier

supabase gen types typescript --linked > types/database.ts   # Regenerate DB types
supabase migration new <name>                                # New SQL migration
supabase db push                                             # Apply migrations
```

## Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components, Server Actions)
- **Auth & Database**: Supabase (SSR configuration)
- **Styling**: Tailwind CSS v4 with shadcn/ui
- **Forms**: react-hook-form + Zod
- **Email**: Resend
- **Storage**: Supabase Storage (event images)
- **Type Safety**: TypeScript strict mode, `@t3-oss/env-nextjs` for env vars

No ORM. Database access goes through `supabase-js`; the schema lives as SQL
migrations under `supabase/migrations/`.

### Directory Structure

```
app/                   # Next.js App Router pages
├── auth/              # Sign-in, verify, callback
├── events/            # Event list, detail, admin
└── profile/

components/            # NUR bereichsuebergreifende Komponenten
├── ui/                # shadcn/ui — nicht von Hand editieren, via `shadcn add` neu holen
├── surface/           # eigene Flaeche (Rahmen, Radius, Hintergrund) — Ersatz fuer shadcns Card
├── header/            # laeuft auf allen Seiten
└── nav/

features/              # Domaenenmodule: Actions, Schemas UND Komponenten
├── auth/              # + components/ (sign-in, sign-out-button)
├── events/            # + components/ (event-card, event-meta, Formulare, add-event-button)
├── participants/      # + components/ (participants-table, registration)
└── email/

server/supabase/       # Supabase client factories
├── client.ts          # Browser client — Client Components
├── server.ts          # Server client — Server Components, Actions, Route Handlers
└── proxy.ts           # Proxy client — session refresh

env/index.ts           # Validated, typed environment variables
proxy.ts               # Next 16 proxy (formerly middleware.ts)

supabase/migrations/   # SQL migrations (Supabase CLI)
lib/                   # Shared utilities (cn, etc.)
types/                 # Shared types, incl. generated database.ts
```

**Wo eine Komponente hingehoert:** `features/<domain>/components/`, sobald sie nur
in dieser Domaene Sinn hat. In `components/` bleibt ausschliesslich, was
bereichsuebergreifend ist — `ui/`, `surface/`, `header/`, `nav/`. Ein Ordner, der
nach technischer Art benennt (fruehere `components/forms/`), gruppiert Dinge, die
sich aus verschiedenen Gruenden aendern, und ist deshalb aufgeloest.

Wenn Komponenten verschoben werden: **auch `eslint.config.mjs` pruefen.** Die
Regel-Overrides dort adressieren Dateipfade; nach einem Umzug greifen sie
stillschweigend nicht mehr, und eine absichtliche Unterdrueckung wird wieder zur
Warnung.

Path alias `@/*` maps to the project root. There is no `src/` directory.

## Supabase Integration

### Critical Pattern: Server-Side Client Usage

**NEVER create the Supabase server client at module level.** Always create it inside
the function that needs it:

```tsx
// ❌ WRONG — causes "cookies outside request scope"
'use server';
import { createClient } from '@/server/supabase/server';

const supabase = await createClient();

export const getEvents = async () => supabase.from('events').select();

// ✅ CORRECT
'use server';
import { createClient } from '@/server/supabase/server';

export const getEvents = async () => {
  const supabase = await createClient();
  return await supabase.from('events').select();
};
```

`cookies()` must be called during a request, not at module load. Never reuse a
client across requests.

A `'use server'` module may only export async functions. Constants that belong to a
feature go in a sibling file — see `features/auth/errors.ts`.

### RLS is the security boundary

Row Level Security policies enforce access control:

- `events` — public SELECT; INSERT/UPDATE/DELETE only where `organizer_id = auth.uid()`
- `event_participants` — public INSERT (registration); SELECT/UPDATE/DELETE only for
  the organizer of the parent event

Server Actions still check ownership, but **only to return a readable error message**
to the user. Never treat an action-level check as the thing that protects the data —
if a policy is missing, add the policy. A new table without RLS enabled is a bug.

## Tests

```bash
npm test          # RLS-Tests gegen den laufenden lokalen Stack
npm run test:watch
```

**Die Tests laufen gegen eine echte Postgres-Instanz, nicht gegen Mocks.**
Geprüft werden RLS-Policies — eine gemockte Policy beweist nichts. Der lokale
Stack muss laufen (`npm run db:start`); die Keys holt das npm-Script selbst aus
`supabase status -o env`, es braucht keine eigene Konfigurationsdatei.

Was getestet wird und warum gerade das: RLS ist die Sicherheitsgrenze dieses
Projekts, und **eine kaputte Policy ist im UI unsichtbar**, bis sie jemand
ausnutzt. Das ist die einzige Fehlerklasse hier, die man beim Durchklicken nicht
findet. Komponententests kommen später und sind weniger wert.

Die Tests legen eigene Nutzer mit Passwort an (über die Admin-API) — die App
benutzt Magic Link und Google, aber für `auth.uid()` ist die Anmeldeart
unerheblich, und Passwort ist der kürzeste Weg zu einem echten JWT. Aufgeräumt
wird explizit: beim Löschen eines Nutzers verschwindet nur seine Mitgliedschaft,
die Organisation bleibt zurück (dokumentiert in der Migration
`organization_user_cascade`).

In CI läuft das als eigener Job `rls`, der den ganzen Stack in Docker hochfährt.
`verify` bleibt davon getrennt und schnell.

## Server Actions Pattern

Server Actions live in `features/<domain>/` and use the `'use server'` directive.
They return a discriminated result rather than throwing:

```ts
'use server';

import { createClient } from '@/server/supabase/server';

type ActionResponse = { success?: boolean; error?: string };

export const deleteEvent = async (eventId: string): Promise<ActionResponse> => {
  const supabase = await createClient();

  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) return { error: 'Failed to delete event' };

  revalidatePath('/events');
  return { success: true };
};
```

Validate input with Zod at the action boundary. Call `revalidatePath` for every
route whose data changed.

## Domain Model

- **events** — `id`, `title`, `description`, `date`, `organizer_id` → `auth.users`,
  `image_url`, timestamps
- **event_participants** — `id`, `event_id` → `events`, `email`, `name`, `status`,
  timestamps

Participant `status` is one of `pending` | `confirmed` | `declined` | `waitlisted`,
default `pending`.

## Code Style

### Import Order (enforced by Prettier)

1. React/Next.js
2. Third-party modules
3. `@/*` alias imports
4. Relative imports

### Conventions

- Arrow function consts over function declarations; `prefer-arrow-callback`, `prefer-template`
- Early returns over nested conditionals
- Event handlers prefixed `handle` (`handleClick`, `handleSubmit`)
- PascalCase for components, camelCase for everything else
- kebab-case for file and directory names
- Tailwind classes for styling — no separate CSS files beyond `globals.css`
- `.ts` for files without JSX, `.tsx` only for files that contain JSX

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=
SITE_URL=
```

Env vars are validated and typed in `env/index.ts` — add new ones there, and never
read `process.env` directly outside that file (enforced by `n/no-process-env`).

## Gotchas

- **`next/image`: `images.remotePatterns`, nicht `domains`.** `domains` ist seit
  Next 14 deprecated, weil es Protokoll, Port und Pfad nicht einschraenken kann.
  Das Muster wird in `next.config.ts` aus `NEXT_PUBLIC_SUPABASE_URL` abgeleitet
  und auf den Bucket-Pfad begrenzt — ein Muster auf Hostebene machte den
  Bild-Optimizer zum offenen Proxy fuer die REST-API und alle anderen Buckets.
  Zwei Fallen dabei: der Schluessel heisst `images` (ein Tippfehler wie `image`
  faellt **nicht** auf, weil `NextConfig` eine Index-Signatur hat und TypeScript
  deshalb schweigt), und `remotePatterns` wird beim **Build** eingebacken — eine
  geaenderte Variable wirkt erst nach neuem Build, nicht nach Neustart. Was
  tatsaechlich gilt, steht in `.next/required-server-files.json` unter
  `config.images`.
- **Next 16 lehnt Remote-Bilder auf privaten IPs ab (SSRF-Schutz)** und meldet
  dem Client dafuer `"url" parameter is not allowed` — genau dieselbe Zeile wie
  bei einem nicht erlaubten Muster. Der echte Grund steht **nur im Server-Log**
  („hostname resolved to private IP"). Der lokale Supabase-Stack laeuft auf
  127.0.0.1, deshalb setzt `next.config.ts` dort `dangerouslyAllowLocalIP` —
  abgeleitet aus dem Host, ein Prod-Build setzt es nie.
- **`.env.local` ist generiert — nicht editieren.** Quellen sind `.env.hosted`
  und `.env.localstack`, umgeschaltet mit `npm run env:local` /
  `npm run env:hosted`, aktives Ziel mit `npm run env:show`. Niemals eine
  Datei `.env.development.local` anlegen: Next laedt `.env.$(NODE_ENV).local`
  **vor** `.env.local` und bricht beim ersten Treffer ab (siehe
  `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`), so
  eine Datei kapert `next dev` also lautlos. Genau das hat einmal einen ganzen
  Nachmittag gekostet.
- **Beweis fuer „Migration ist deployed" ist `npm run db:check`
  (`supabase migration list`), nicht `types/database.ts`.** So blieb
  `create_organization` einmal lokal haengen, waehrend die Typen sie auswiesen.
- **Committet wird, was `npm run db:types:hosted` (`--linked`) erzeugt.**
  `npm run db:types` (lokal) ist fuer die Entwicklung einer noch nicht
  gepushten Migration da und gehoert nicht in einen Commit. Zwei Gruende:
  1. Lokal ist *Migrationen plus Seed*. Alles im Schema `public` landet in den
     Typen — eine Hilfsfunktion aus `seed.sql` wuerde dort behaupten, sie gaebe
     es auch in Produktion. Deshalb liegt der Seed-Helfer im Schema `seed`,
     das `[api] schemas` nicht exponiert.
  2. Der lokale Generator laesst `__InternalSupabase.PostgrestVersion` weg, das
     der gehostete setzt. Mit der lokalen Fassung zu committen verliert diese
     Angabe.

  Reihenfolge bei einer Schemaaenderung: Migration schreiben → lokal anwenden →
  `db:types` zum Entwickeln → `db:push` → `db:types:hosted` → **die** Fassung
  committen.
- **`supabase start` erzeugt keine Container neu.** Aenderungen an
  `config.toml` landen als Environment im Container, und das wird beim
  *Erzeugen* gesetzt, nicht beim Starten — ein `start` auf einem bestehenden
  Container laeuft also mit der alten Config weiter. Nach jeder Aenderung an
  `config.toml`: `npm run db:stop && npm run db:start`. Genau so galten die
  Mail-Templates nicht, obwohl sie korrekt eingetragen waren; die Mail trug den
  Default-Betreff und den `{{ .ConfirmationURL }}`-Link, und der Magic Link
  endete auf `missing_code`. Pruefen mit
  `docker inspect supabase_auth_<projekt> --format '{{range .Config.Env}}{{println .}}{{end}}' | grep MAILER`.
- **Entwickelt wird lokal, nicht gegen das gehostete Projekt.** `npm run
  db:start` / `db:reset`; Studio auf Port 54323, Mailcatcher auf 54324. Es gibt
  bewusst kein Script fuer `db reset --linked` — das setzt Produktion zurueck.
- **`config.toml` wirkt nur lokal, solange niemand `supabase config push`
  aufruft.** Site URL, Redirect-URLs, OAuth-Provider und Mail-Templates des
  gehosteten Projekts stehen im Dashboard. `config.toml` enthaelt bewusst
  lokale Werte (`site_url = http://localhost:3000`, Google mit
  `skip_nonce_check = true`) — ein `config push` wuerde damit die
  Dashboard-Konfiguration ueberschreiben. Nicht aufrufen, ohne die Datei vorher
  fuer beide Ziele tauglich zu machen.

- **Routing entry point is `proxy.ts`, not `middleware.ts`.** Next 16 renamed the
  convention; a file called `middleware.ts` builds with a deprecation warning and
  will eventually stop working.
- **Timestamps come back as ISO strings, not `Date`.** Use the helpers in
  `lib/format.ts` rather than calling `.toLocaleDateString()` on a query result.
- **Columns are snake_case** (`image_url`, `organizer_id`, `created_at`); form
  fields and TypeScript stay camelCase. Server actions map between the two.
- **Auth-Mails (Magic Link) verschickt Supabase, nicht Resend — und der
  eingebaute Versand ist nach wenigen Mails pro Stunde dicht.** In Produktion
  kam dadurch `[auth] send_failed: email rate limit exceeded`, waehrend Google
  weiterlief (verschickt keine Mail). Resend muss deshalb als **Custom SMTP**
  im Supabase-Dashboard hinterlegt sein (Project Settings → Authentication →
  SMTP Settings, `smtp.resend.com`, User `resend`, Passwort = `RESEND_API_KEY`);
  danach laesst sich unter Authentication → Rate Limits das Limit hochsetzen.
  Das ist keine Kosmetik fuer die Absenderadresse, sondern Voraussetzung dafuer,
  dass der Magic Link ueberhaupt funktioniert. Die Mail-Templates haengen nicht
  am SMTP und bleiben unberuehrt. Fuer die Teilnehmer-Bestaetigungsmail wird
  Resend ohnehin direkt benutzt.
- DB Triggers. Triggers on DBs always have to documented in three palces: Migration, DB Sckript and Function where the Insert / Action is expecteed.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
