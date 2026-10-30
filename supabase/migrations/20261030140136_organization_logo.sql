-- TASK-55 (3/4): Logo der Organisation.
--
-- Die URL des Bildes im Bucket `event-images`, Pfad `<organization_id>/...`.
-- Hochgeladen wird wie bei den Event-Bildern direkt aus dem Browser; die
-- bestehende Storage-Policy laesst nur Mitglieder in den Ordner ihrer
-- Organisation schreiben, und der Bucket nimmt nur Rasterbilder an (JPEG,
-- PNG, WebP, AVIF) -- kein SVG, das Skripte enthalten koennte.
--
-- Keine neue Policy: aendern und lesen nur Mitglieder. Oeffentlich wird das
-- Logo erst in Scheibe 4 ueber eine Definer-Funktion.
--
-- Erweitern, also Migration zuerst.

alter table public.organizations
  add column logo_url text;
