-- ---------------------------------------------------------------------------
-- events: organizer_id entfernen, organization_id verpflichtend machen
-- ---------------------------------------------------------------------------
-- Zweiter und letzter Schritt. Voraussetzung ist erfuellt: die ausgelieferte
-- Version setzt organizer_id nicht mehr (deployed), und seit 2c-2 referenziert
-- sie keine Policy. Besitz liegt bei organization_id, Autorschaft bei
-- created_by.
--
-- WAS DAMIT IN KRAFT TRITT -- der eigentliche Gewinn:
-- organizer_id kaskadiert von auth.users. Solange sie existiert, nimmt das
-- Loeschen eines Nutzers dessen Events mit, obwohl created_by bewusst auf
-- `on delete set null` steht, damit das Event der Organisation erhalten bleibt
-- (Entscheidung aus 2b). Gemessen vor dieser Migration: ein geloeschter Nutzer
-- riss 4 von 5 Events mit. Erst der Drop setzt die Entscheidung durch.
--
-- organization_id wird gleichzeitig verpflichtend. Der Code setzt sie seit
-- 2c-1, der Bestand ist befuellt, und mit den Policies aus 2c-2 waere eine
-- Zeile ohne Organisation ohnehin unschreibbar und ihre Teilnehmer unsichtbar
-- -- ein Zustand, den die Datenbank besser gar nicht zulaesst.
--
-- Der Index events_organizer_id_idx verschwindet mit der Spalte; ein Index auf
-- organization_id existiert seit 2b.
-- ---------------------------------------------------------------------------

alter table public.events alter column organization_id set not null;

alter table public.events drop column organizer_id;
