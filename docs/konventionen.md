# Konventionen und Struktur

**Was hier hineingehört:** wie der Code aufgebaut ist und aussieht. Das meiste
davon erzwingen ESLint und Prettier — hier steht, was dahintersteckt, und das,
was sich nicht erzwingen lässt.

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
├── layout.tsx         # nur html/body, Schriften, Toaster
├── (app)/             # Header + Navigation: alles, was Organisatoren sehen
│   ├── auth/          # Sign-in, verify, callback
│   ├── events/        # Event-Liste, admin, edit
│   └── profile/
└── (public)/          # weiss, ohne App-Navigation: was Teilnehmende sehen
    ├── events/[id]/   # Event-Landingpage
    └── t/[code]/      # Ticket-Ziel des QR-Codes

Neue Seite: Sehen sie Teilnehmende, gehoert sie nach `(public)`, sonst nach
`(app)`. Die Klammern erscheinen nicht in der URL.

components/            # NUR bereichsuebergreifende Komponenten
├── ui/                # shadcn/ui — nicht von Hand editieren, via `shadcn add` neu holen
├── surface/           # eigene Flaeche (Rahmen, Radius, Hintergrund) — Ersatz fuer shadcns Card
├── header/            # laeuft auf allen Seiten unter (app)/
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
