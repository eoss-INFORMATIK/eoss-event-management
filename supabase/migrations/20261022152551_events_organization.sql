-- ---------------------------------------------------------------------------
-- events: organization_id, created_by, updated_by -- rein additiv
-- ---------------------------------------------------------------------------
-- EOS-20: der Organizer ist kuenftig die Organisation und nicht der Nutzer. Wer
-- angelegt und wer zuletzt geaendert hat, kommt in created_by / updated_by.
--
-- DIESER SCHRITT AENDERT BEWUSST KEIN VERHALTEN:
--   * organization_id bleibt NULLABLE. Ein `not null` wuerde createEvent sofort
--     brechen, weil die Server Action die Spalte noch nicht setzt. Das `not
--     null` kommt erst, wenn der Code sie fuellt.
--   * Die Policies bleiben unangetastet -- sie pruefen weiter organizer_id.
--   * organizer_id bleibt bestehen und wird erst entfernt, wenn kein Code sie
--     mehr liest.
--
-- Damit laeuft die bereits ausgelieferte App unveraendert weiter. Das ist die
-- Eigenschaft, auf die es beim Pushen gegen eine Produktionsdatenbank ankommt:
-- zwischen Migration und Deployment laeuft dort die alte Version.
--
-- LOESCHVERHALTEN, pro Spalte entschieden:
--   organization_id -> cascade. Ein Event ohne Organisation waere nach dem
--     Policy-Umbau fuer niemanden mehr erreichbar. Entspricht ausserdem dem
--     heutigen Verhalten, denn organizer_id kaskadiert schon von auth.users.
--   created_by, updated_by -> set null. Das Event gehoert der Organisation und
--     soll die Loeschung der Person ueberleben, die es angelegt hat.
--
-- BACKFILL nutzt die Schritt-1-Einschraenkung unique(user_id) auf
-- organization_user: ein Nutzer ist in genau einer Organisation, die Zuordnung
-- ist also eindeutig. Sobald Schritt 2 diese Einschraenkung aufhebt, waere ein
-- solcher Backfill ohne Zusatzinformation nicht mehr moeglich -- hier ist er es
-- noch. Events, deren Organizer keine Mitgliedschaft hat, bleiben null; das
-- faellt in der Abnahme auf.
-- ---------------------------------------------------------------------------

alter table public.events
  add column organization_id uuid,
  add column created_by uuid,
  add column updated_by uuid;

-- Fremdschluessel mit explizitem Namen, damit die naechste Aenderung sie nicht
-- erst suchen muss (Lektion aus organization_user).
alter table public.events
  add constraint events_organization_id_fkey
    foreign key (organization_id) references public.organizations (id)
    on delete cascade,
  add constraint events_created_by_fkey
    foreign key (created_by) references auth.users (id)
    on delete set null,
  add constraint events_updated_by_fkey
    foreign key (updated_by) references auth.users (id)
    on delete set null;

update public.events e
set organization_id = ou.organization_id,
    created_by = e.organizer_id
from public.organization_user ou
where ou.user_id = e.organizer_id;

-- Fuer die kuenftige Liste "Events meiner Organisation".
create index events_organization_id_idx on public.events (organization_id);
