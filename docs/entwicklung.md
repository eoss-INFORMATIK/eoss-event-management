# Entwicklung

**Was hier hineingehört:** alles, was man braucht, um das Projekt lokal zum
Laufen zu bringen und am Laufen zu halten — Umgebungen, Datenbankbefehle,
Variablen. Keine Produktentscheidungen, keine Architektur.

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

## Umgebungen und Datenbank im Detail

Siehe [`../README.md`](../README.md) für den vollständigen Ablauf (Ziel
umschalten, lokaler Stack, Migrationen und Typen).

## Fallstricke

- **`.env.local` ist generiert — nicht editieren.** Quellen sind `.env.hosted`
  und `.env.localstack`, umgeschaltet mit `npm run env:local` /
  `npm run env:hosted`, aktives Ziel mit `npm run env:show`. Niemals eine
  Datei `.env.development.local` anlegen: Next laedt `.env.$(NODE_ENV).local`
  **vor** `.env.local` und bricht beim ersten Treffer ab (siehe
  `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`), so
  eine Datei kapert `next dev` also lautlos. Genau das hat einmal einen ganzen
  Nachmittag gekostet.

- **`supabase start` erzeugt keine Container neu.** Aenderungen an
  `config.toml` landen als Environment im Container, und das wird beim
  _Erzeugen_ gesetzt, nicht beim Starten — ein `start` auf einem bestehenden
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
