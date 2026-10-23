-- ---------------------------------------------------------------------------
-- event_participants: eigene organization_id, per Trigger gefuellt
-- ---------------------------------------------------------------------------
-- EOS-20: "Der Trigger macht es bequem, der Fremdschluessel macht es unmoeglich
-- falsch."
--
-- PROBLEM: die Anmeldung ist oeffentlich. Ein Client, der die Organisation
-- mitliefert, kann sie falsch mitliefern. Die Policies brauchen die Spalte
-- nicht (sie joinen seit 2c-2 durch events), aber jede kuenftige Auswertung auf
-- Teilnehmerebene braucht sie, und sie muss dann stimmen.
--
-- DREI SCHICHTEN, jede mit eigener Aufgabe:
--   Server Action   liest die Organisation aus dem Event und setzt sie --
--                   erlaubt eine lesbare Fehlermeldung bei unbekanntem Event
--   Trigger         setzt sie UNBEDINGT aus dem Event und ueberschreibt einen
--                   mitgelieferten Wert. Kein Client hat einen legitimen Grund,
--                   ihn zu setzen, also gibt es auch keine Luecke
--   Fremdschluessel (event_id, organization_id) -> events(id, organization_id).
--                   Macht ein Paar, das nicht zusammengehoert, unmoeglich --
--                   auch auf Wegen, die den Trigger nicht nehmen
--
-- WARUM DER UNIQUE-INDEX auf events(id, organization_id):
-- Postgres verlangt fuer einen zusammengesetzten Fremdschluessel einen
-- Unique-Index auf den referenzierten Spalten. `id` allein ist eindeutig, das
-- Paar damit trivialerweise auch -- der Index sagt es Postgres aber explizit.
-- EOS-20 plante den Fremdschluessel ohne diese Vorarbeit; ohne sie laesst er
-- sich nicht anlegen.
--
-- TRIGGER AUCH BEI UPDATE, nicht nur bei INSERT: sonst koennte ein Mitglied der
-- Organisation die Spalte per Update auf null oder auf einen fremden Wert
-- setzen. Ein Fremdschluessel mit einer null-Spalte wird unter MATCH SIMPLE
-- nicht geprueft, die Luecke waere also offen. Mit dem Trigger auf beiden
-- Pfaden ist `not null` am Ende sicher.
--
-- security invoker (Standard, hier ausdruecklich): die Funktion liest
-- public.events, und das darf jeder -- events hat eine oeffentliche
-- SELECT-Policy. Kein Grund fuer Besitzerrechte. Sollte diese Policy je enger
-- werden, schlaegt die Anmeldung laut fehl (not null) statt still falsch zu
-- werden.
--
-- Der bisherige einspaltige Fremdschluessel auf event_id entfaellt: der
-- zusammengesetzte deckt ihn ab, und er traegt beide Cascade-Regeln.
-- ---------------------------------------------------------------------------

-- Voraussetzung fuer den zusammengesetzten Fremdschluessel
alter table public.events
  add constraint events_id_organization_id_key unique (id, organization_id);

alter table public.event_participants add column organization_id uuid;

-- Bestand aus dem Eltern-Event
update public.event_participants p
set organization_id = e.organization_id
from public.events e
where e.id = p.event_id;

-- ---------------------------------------------------------------------------
-- Trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_participant_organization()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $BODY$
begin
  select e.organization_id
    into new.organization_id
    from public.events e
   where e.id = new.event_id;

  return new;
end;
$BODY$;

comment on function public.set_participant_organization() is
  'Setzt event_participants.organization_id unbedingt aus dem Eltern-Event und ueberschreibt einen mitgelieferten Wert. Die Anmeldung ist oeffentlich, ein Client darf die Organisation nicht bestimmen.';

create trigger event_participants_set_organization
  before insert or update on public.event_participants
  for each row
  execute function public.set_participant_organization();

-- ---------------------------------------------------------------------------
-- Fremdschluessel und not null
-- ---------------------------------------------------------------------------
alter table public.event_participants
  drop constraint event_participants_event_id_fkey,
  add constraint event_participants_event_id_organization_id_fkey
    foreign key (event_id, organization_id)
    references public.events (id, organization_id)
    on update cascade
    on delete cascade;

alter table public.event_participants
  alter column organization_id set not null;
