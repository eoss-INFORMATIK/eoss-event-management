-- TASK-51 (2/2): Ticket-Code fuer den QR-Code in der Bestaetigungsmail.
--
-- Der QR-Code enthaelt `<SITE_URL>/t/<ticket_code>`. Spaeter (eigener Task)
-- scannt der Admin ihn, landet auf einer geschuetzten Check-in-Seite und setzt
-- "Teilgenommen". Eine eigene Spalte statt der Teilnehmer-ID: der Code laesst
-- sich neu ausstellen und gibt keinen Primaerschluessel preis.
--
-- 32 Hex-Zeichen aus `gen_random_uuid()` = 122 Bit Zufall, nicht erratbar.
-- Der Default fuellt bestehende Zeilen (ein volatiler Default wird pro Zeile
-- ausgewertet) und jeden Insert, der keinen Code mitbringt -- etwa das
-- manuelle Hinzufuegen. Die oeffentliche Anmeldung erzeugt den Code im Server
-- im selben Format und schreibt ihn mit: die anonyme Anmeldung darf ihre Zeile
-- nicht zuruecklesen, die Mail braucht den Code aber.
--
-- Lesen darf ihn, wer die Zeile lesen darf: Mitglieder der Organisation.
--
-- Erweitern, also Migration zuerst: der alte Code kennt die Spalte nicht und
-- bekommt den Default. Begruendung: docs/task-51-bestaetigungsmail.md

alter table public.event_participants
  add column ticket_code text not null
    default replace(gen_random_uuid()::text, '-', '')
    constraint event_participants_ticket_code_key unique;
