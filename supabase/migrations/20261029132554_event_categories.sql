-- ---------------------------------------------------------------------------
-- Kategorien am Event, waehlbar bei der Anmeldung
-- ---------------------------------------------------------------------------
-- Der Organisator legt pro Event eine Liste von Werten fest ("Einzelperson /
-- mit Begleitung / Firma"), der Teilnehmer waehlt bei der Anmeldung einen
-- davon. Begruendung in docs/eos-36-dynamische-felder.md.
--
-- WARUM EINE TABELLE UND NICHT `text[]` AM EVENT:
-- Die Anmeldung ist oeffentlich -- der Client bestimmt, was er schickt. Mit
-- einem Array am Event und einer Textspalte am Teilnehmer koennte jemand
-- "Gratis-VIP" eintragen, und es stuende in der Teilnehmerliste. Der
-- zusammengesetzte Fremdschluessel unten macht eine Kategorie, die nicht zu
-- diesem Event gehoert, UNMOEGLICH -- dieselbe Idee wie bei
-- (event_id, organization_id), nur ohne Trigger: der Wert darf vom Client
-- kommen, solange er zum Event passt.
--
-- KEIN `organization_id` AUF DIESER TABELLE, anders als bei den Teilnehmern.
-- Dort war die Spalte noetig, weil der zusammengesetzte Fremdschluessel auf
-- events(id, organization_id) zeigt. Hier zeigt er auf das Event selbst, also
-- gibt es nichts zu denormalisieren -- und damit auch keinen Trigger, der es
-- synchron halten muesste. Die Policies gehen ueber das Eltern-Event.
--
-- KEIN `categories_enabled` AM EVENT, gleiche Begruendung wie beim Sponsor:
-- eingeschaltet heisst "es gibt mindestens eine Kategorie". Ein Schalter
-- daneben waere ein zweiter Zustand, der dem ersten widersprechen kann.
--
-- Reihenfolge: reines Erweitern -- neue Tabelle, nullable Spalte am Teilnehmer,
-- neue Spalten am Event mit Default. Migration zuerst.
-- ---------------------------------------------------------------------------

create table public.event_categories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  label varchar(120) not null,
  -- Reihenfolge im Select. Eine Spalte, keine Array-Position: eine umbenannte
  -- oder verschobene Kategorie laesst bestehende Anmeldungen unberuehrt.
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Ziel des zusammengesetzten Fremdschluessels unten. Ein solcher verlangt
  -- einen Unique-Index auf genau diesen Spalten -- auch wenn `id` allein schon
  -- Primaerschluessel ist. Diese Falle hat bei den Teilnehmern schon einmal
  -- Zeit gekostet.
  unique (event_id, id)
);

create index event_categories_event_id_idx on public.event_categories (event_id);

create trigger event_categories_set_updated_at
  before update on public.event_categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Lesen ist oeffentlich: die Werte stehen im Anmeldeformular auf der
-- oeffentlichen Eventseite, genau wie das Event selbst.
-- Schreiben nur Mitglieder der Organisation des Eltern-Events.
--
-- Keine Rekursion: die Policy liest `events` (dort oeffentliche SELECT-Policy)
-- und `organization_user` (dort greift user_id = auth.uid(), ein
-- Spaltenvergleich ohne Tabellenzugriff).

alter table public.event_categories enable row level security;

create policy "Event categories are viewable by everyone"
  on public.event_categories for select
  to anon, authenticated
  using (true);

create policy "Event categories can be created by members of the organization"
  on public.event_categories for insert
  to authenticated
  with check (
    exists (
      select 1 from public.events e
      join public.organization_user ou on ou.organization_id = e.organization_id
      where e.id = event_categories.event_id
        and ou.user_id = (select auth.uid())
    )
  );

-- Zum UPDATE gehoert hier beides ausgeschrieben, weil `with check` etwas
-- anderes pruefen muss als `using`: ohne das liesse sich eine eigene Kategorie
-- per Update an ein fremdes Event haengen.
create policy "Event categories can be updated by members of the organization"
  on public.event_categories for update
  to authenticated
  using (
    exists (
      select 1 from public.events e
      join public.organization_user ou on ou.organization_id = e.organization_id
      where e.id = event_categories.event_id
        and ou.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.events e
      join public.organization_user ou on ou.organization_id = e.organization_id
      where e.id = event_categories.event_id
        and ou.user_id = (select auth.uid())
    )
  );

create policy "Event categories can be deleted by members of the organization"
  on public.event_categories for delete
  to authenticated
  using (
    exists (
      select 1 from public.events e
      join public.organization_user ou on ou.organization_id = e.organization_id
      where e.id = event_categories.event_id
        and ou.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Teilnehmer: die gewaehlte Kategorie
-- ---------------------------------------------------------------------------
-- Nullable: Events ohne Kategorien, und Events, bei denen die Angabe optional
-- ist. Unter MATCH SIMPLE wird der Fremdschluessel bei null nicht geprueft --
-- hier ist das gewollt und nicht wie beim organization_id-Trigger eine Luecke,
-- weil "keine Kategorie" ein gueltiger Zustand ist.
--
-- on delete RESTRICT, nicht cascade: eine Kategorie zu loeschen, auf die
-- Anmeldungen zeigen, muss scheitern statt die Anmeldung stillschweigend zu
-- entwerten.

alter table public.event_participants
  add column category_id uuid;

alter table public.event_participants
  add constraint event_participants_event_id_category_id_fkey
  foreign key (event_id, category_id)
  references public.event_categories (event_id, id)
  on update cascade
  on delete restrict;

-- ---------------------------------------------------------------------------
-- Event: Beschriftung und Pflicht
-- ---------------------------------------------------------------------------
-- Der Organisator benennt das Feld selbst. Fuer "Einzelperson / mit Begleitung
-- / Firma" ist "Kategorie" die falsche Ueberschrift, "Teilnahme als" die
-- richtige. Nullable, die Anzeige faellt im Code auf "Kategorie" zurueck.

alter table public.events
  add column category_label varchar(120),
  add column category_required boolean not null default false;
