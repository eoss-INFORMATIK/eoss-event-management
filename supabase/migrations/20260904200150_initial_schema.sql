-- Initial schema for the event management app.
--
-- Replaces the previous Drizzle schema. The next-auth tables (user, account,
-- session) are gone -- Supabase Auth owns identities in auth.users now.

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at current without doing it in application code
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  description text,
  -- timestamptz, not timestamp: the old schema stored naive timestamps, which
  -- silently shift for anyone not in the server's timezone.
  date timestamptz not null,
  organizer_id uuid not null references auth.users (id) on delete cascade,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_organizer_id_idx on public.events (organizer_id);
create index events_date_idx on public.events (date desc);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- event_participants
-- ---------------------------------------------------------------------------

create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  -- on delete cascade: without it, deleting an event that has registrations
  -- fails with a foreign key violation. The old schema had this gap.
  event_id uuid not null references public.events (id) on delete cascade,
  email varchar(255) not null,
  name varchar(255),
  status varchar(20) not null default 'pending'
    constraint event_participants_status_check
    check (status in ('pending', 'confirmed', 'declined', 'waitlisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index event_participants_event_id_idx
  on public.event_participants (event_id);

-- One registration per email address per event.
create unique index event_participants_event_email_idx
  on public.event_participants (event_id, lower(email));

create trigger event_participants_set_updated_at
  before update on public.event_participants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- This is the security boundary. Ownership checks in server actions exist only
-- to produce readable error messages -- they are not what protects the data.
--
-- auth.uid() is wrapped in a subselect so Postgres evaluates it once per query
-- (initplan) instead of once per row.
-- ---------------------------------------------------------------------------

alter table public.events enable row level security;
alter table public.event_participants enable row level security;

-- events: anyone may browse, only the organizer may change

create policy "Events are viewable by everyone"
  on public.events for select
  to anon, authenticated
  using (true);

create policy "Users can create their own events"
  on public.events for insert
  to authenticated
  with check ((select auth.uid()) = organizer_id);

create policy "Organizers can update their own events"
  on public.events for update
  to authenticated
  using ((select auth.uid()) = organizer_id)
  with check ((select auth.uid()) = organizer_id);

create policy "Organizers can delete their own events"
  on public.events for delete
  to authenticated
  using ((select auth.uid()) = organizer_id);

-- event_participants: anyone may register, only the organizer may read or manage
--
-- Note: participants cannot read back their own registration. The app has no
-- participant login, so there is no identity to match against.

create policy "Anyone can register for an event"
  on public.event_participants for insert
  to anon, authenticated
  with check (true);

create policy "Organizers can view participants of their events"
  on public.event_participants for select
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and e.organizer_id = (select auth.uid())
    )
  );

create policy "Organizers can update participants of their events"
  on public.event_participants for update
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and e.organizer_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and e.organizer_id = (select auth.uid())
    )
  );

create policy "Organizers can delete participants of their events"
  on public.event_participants for delete
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and e.organizer_id = (select auth.uid())
    )
  );
