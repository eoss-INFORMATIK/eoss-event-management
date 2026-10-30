-- TASK-55 (2/4): Adresse und Kontakt der Organisation.
--
-- Erscheinen spaeter (Scheibe 4) in der Fusszeile der oeffentlichen
-- Event-Seite. Alle optional: eine Organisation ohne Angaben zeigt dort nur
-- ihren Namen. Leere Formularfelder speichert die Server Action als NULL, nicht
-- als leeren Text -- "nicht angegeben" hat so genau eine Darstellung.
--
-- `contact_email` statt `email`: das ist die oeffentliche Kontaktadresse, nicht
-- die Anmeldeadresse eines Mitglieds.
--
-- Keine neue Policy: aendern duerfen Mitglieder (bestehende UPDATE-Policy),
-- lesen nur Mitglieder (bestehende SELECT-Policy). Oeffentlich wird nur, was
-- Scheibe 4 ueber eine Definer-Funktion gezielt herausgibt.
--
-- Erweitern, also Migration zuerst: der alte Code kennt die Spalten nicht.

alter table public.organizations
  add column street varchar(255),
  add column address_addition varchar(255),
  add column postal_code varchar(10),
  add column city varchar(255),
  add column contact_email varchar(255),
  add column phone varchar(50);
