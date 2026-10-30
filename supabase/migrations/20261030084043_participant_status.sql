-- TASK-44: Status der Teilnehmer
--
-- Neue Werte, angezeigt als Eingeladen, Angemeldet, Warteliste, Abgemeldet,
-- Teilgenommen. Die Warteliste bleibt -- sie gehoert zum spaeteren Task mit
-- Kapazitaet, ihr Wert existiert aber schon.
--
--   pending    -> registered   (der bisherige Standard nach der Anmeldung)
--   confirmed  -> registered   ("bestaetigt" gibt es nicht mehr: angemeldet ist bestaetigt)
--   declined   -> cancelled
--   waitlisted    bleibt
--
-- Migration zuerst, obwohl die Constraint verschaerft wird: der alte Code
-- schreibt nie einen Status ausdruecklich, neue Anmeldungen bekommen ihn nur
-- ueber den Default -- und den setzt diese Migration mit. Bis zum Deployment
-- zeigt der alte Code `registered` hoechstens roh statt auf Deutsch.
--
-- Weiter Check-Constraint, kein Enum-Typ: einen Wert aus einem Enum zu
-- entfernen heisst den Typ neu bauen.

alter table public.event_participants
  drop constraint event_participants_status_check;

update public.event_participants
   set status = case status
                  when 'pending'   then 'registered'
                  when 'confirmed' then 'registered'
                  when 'declined'  then 'cancelled'
                end
 where status in ('pending', 'confirmed', 'declined');

alter table public.event_participants
  alter column status set default 'registered';

-- Scheitert, falls noch ein Wert ausserhalb der Liste steht -- dann bricht die
-- ganze Migration ab, statt halb umgestellt stehen zu bleiben.
alter table public.event_participants
  add constraint event_participants_status_check
  check (status in ('invited', 'registered', 'waitlisted', 'cancelled', 'attended'));
