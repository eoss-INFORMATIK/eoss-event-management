# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Migration in progress

Migrated from Neon/Drizzle/next-auth to Supabase. The code is done; the schema has
not been pushed to the Supabase project yet, so nothing has run against a live
database. Read `MIGRATION.md` for what is left.

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

components/            # React components
├── ui/                # shadcn/ui — do not hand-edit, re-add via `shadcn add`
└── */                 # Feature components

features/              # Domain modules with server actions
├── auth/              # Sign-in, sign-out, error messages
├── events/            # Actions, Zod schemas, image upload
├── participants/
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

- **Routing entry point is `proxy.ts`, not `middleware.ts`.** Next 16 renamed the
  convention; a file called `middleware.ts` builds with a deprecation warning and
  will eventually stop working.
- **Timestamps come back as ISO strings, not `Date`.** Use the helpers in
  `lib/format.ts` rather than calling `.toLocaleDateString()` on a query result.
- **Columns are snake_case** (`image_url`, `organizer_id`, `created_at`); form
  fields and TypeScript stay camelCase. Server actions map between the two.
- Auth emails (magic links) are sent by Supabase, not Resend. To send them from
  `hello@resend.eoss.ch`, configure Resend as custom SMTP in the Supabase
  dashboard. Resend is still used directly for the confirmation mail.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
