-- ---------------------------------------------------------------------------
-- events: verbleibende Nullen in organization_id / created_by auffuellen
-- ---------------------------------------------------------------------------
-- Zwischen der additiven Migration (events_organization) und diesem Schritt gab
-- es ein Fenster, in dem die Spalten existierten, der Code sie aber noch nicht
-- gesetzt hat. Events aus diesem Fenster haben organization_id = null.
--
-- In Produktion war das Fenster leer (dort wurde in der Zeit kein Event
-- angelegt, geprueft: 0 ohne Organisation). Lokal und in jeder kuenftigen Kopie
-- des Schemas kann es nicht leer sein, deshalb gehoert das Auffuellen in eine
-- Migration und nicht in ein Einzelkommando.
--
-- Idempotent: trifft nur Zeilen, die noch null sind.
--
-- Wie 2b nutzt der Backfill unique(user_id) auf organization_user -- in
-- Schritt 1 ist ein Nutzer in genau einer Organisation.
-- ---------------------------------------------------------------------------

update public.events e
set organization_id = ou.organization_id,
    created_by = coalesce(e.created_by, e.organizer_id)
from public.organization_user ou
where ou.user_id = e.organizer_id
  and e.organization_id is null;
