-- ---------------------------------------------------------------------------
-- Storage: Uebergangszustand zusammenziehen, nur noch die Organisation
-- ---------------------------------------------------------------------------
-- Die vorige Migration liess BEIDES zu, den eigenen Nutzerordner und den Ordner
-- einer Organisation -- weil alte Policy und neuer Code sich sonst gegenseitig
-- ausgeschlossen haetten. Der Code ist deployed und laedt nach
-- <organization_id>/ hoch (in Produktion nachgeprueft: ein neu hochgeladenes
-- Bild liegt dort). Damit kann die Nutzer-ID-Variante fallen.
--
-- VORAUSSETZUNG, nicht verhandelbar: es darf keine Datei mehr in einem
-- Nutzerordner liegen. Danach waere sie zwar weiter oeffentlich lesbar (die
-- SELECT-Policy prueft nur den Bucket), aber fuer niemanden mehr aenderbar oder
-- loeschbar -- nur noch mit Service-Role. Umzug mit
-- scripts/move-images-to-organization.mjs, Pruefung:
--
--   select count(*) from storage.objects
--    where bucket_id = 'event-images'
--      and split_part(name, '/', 1) not in (select id::text from public.organizations);
--
-- Lesen bleibt oeffentlich -- Bilder stehen auf oeffentlichen Eventseiten.
-- ---------------------------------------------------------------------------

drop policy "Event images can be written by organization members" on storage.objects;
drop policy "Event images can be updated by organization members" on storage.objects;
drop policy "Event images can be deleted by organization members" on storage.objects;

create policy "Event images can be written by organization members"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and exists (
      select 1 from public.organization_user ou
      where ou.user_id = (select auth.uid())
        and ou.organization_id::text = (storage.foldername(name))[1]
    )
  );

create policy "Event images can be updated by organization members"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'event-images'
    and exists (
      select 1 from public.organization_user ou
      where ou.user_id = (select auth.uid())
        and ou.organization_id::text = (storage.foldername(name))[1]
    )
  );

create policy "Event images can be deleted by organization members"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and exists (
      select 1 from public.organization_user ou
      where ou.user_id = (select auth.uid())
        and ou.organization_id::text = (storage.foldername(name))[1]
    )
  );
