-- TASK-53 (2/2): Kurztext fuer die Event-Karte.
--
-- Selbst geschrieben und optional. Fehlt er, zeigt die Karte die ersten 160
-- Zeichen der Beschreibung als Klartext -- dieser Rueckfall steht im Code
-- (`eventExcerpt` in features/events/description.tsx), nicht hier, damit es
-- genau eine Stelle gibt, die ihn bildet. Leere Formularfelder speichert die
-- Server Action als NULL.
--
-- Eigene Spalte statt `description` zum Kurztext umzudeuten: die bestehenden
-- Beschreibungen sind lang, Umdeuten waere Verschaerfen mit Uebergangszustand.
--
-- varchar(160): die Grenze haelt die Datenbank, auch fuer Schreibzugriffe am
-- Formular vorbei.
--
-- Keine neue Policy: die bestehenden Policies auf `events` gelten zeilenweise
-- und decken die Spalte mit ab. Lesen ist oeffentlich wie beim Rest des Events.
--
-- Erweitern, also Migration zuerst: der alte Code kennt die Spalte nicht.

alter table public.events
  add column excerpt varchar(160);
