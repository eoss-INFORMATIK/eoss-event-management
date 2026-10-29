-- ---------------------------------------------------------------------------
-- Sponsor oder Durchfuehrungsort am Event
-- ---------------------------------------------------------------------------
-- Ein optionaler Block auf der Landingpage: Name, Zusatztext, Bild. Die
-- Darstellung ist fest, der Organisator bestimmt nur den Inhalt.
-- Begruendung und Abgrenzung in docs/eos-36-dynamische-felder.md.
--
-- BEWUSST KEINE SPALTE `sponsor_enabled`. Ein Schalter neben den Daten ist ein
-- zweiter Zustand, der dem ersten widersprechen kann: aktiviert ohne Name, oder
-- Name bei deaktiviert. Der Block erscheint, wenn `sponsor_name` gesetzt ist.
-- Der Schalter im Formular blendet nur ein und leert beim Ausschalten.
--
-- Genau EIN Sponsor pro Event. Mehrere waeren eine eigene Tabelle; der Umstieg
-- darauf ist eine mechanische Migration, aber eine. Bewusst eingegangen.
--
-- Reihenfolge: reines Erweitern, alle Spalten nullable. Migration zuerst, die
-- laufende alte Version ignoriert, was sie nicht kennt.
--
-- Kein Policy-Wechsel noetig: die Spalten haengen an `events`, und dort gilt
-- weiterhin "oeffentlich lesbar, schreiben nur Mitglieder der Organisation".
-- Das Bild liegt wie jedes Eventbild unter <organization_id>/ im Bucket
-- event-images, also greift dieselbe Storage-Policy.
-- ---------------------------------------------------------------------------

alter table public.events
  add column sponsor_name varchar(255),
  add column sponsor_text text,
  add column sponsor_image_url text;

comment on column public.events.sponsor_name is
  'Sponsor oder Durchfuehrungsort. Gesetzt = der Block wird auf der Landingpage angezeigt.';
