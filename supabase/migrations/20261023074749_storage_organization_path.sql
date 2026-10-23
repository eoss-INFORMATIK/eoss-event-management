-- ---------------------------------------------------------------------------
-- Storage: Schreibrechte an der Organisation, Uebergangszustand
-- ---------------------------------------------------------------------------
-- EOS-20: Event-Bilder liegen kuenftig unter <organization_id>/ statt
-- <user-id>/, und die Storage-Policy prueft die Mitgliedschaft statt der
-- Nutzer-ID.
--
-- WARUM NICHT IN EINEM SCHRITT:
-- Die alte Policy erlaubt nur den Ordner <user-id>, die neue nur
-- <organization_id>. Die bereits ausgelieferte Version laedt nach
-- <user-id>/ hoch -- mit einer reinen Org-Policy braeche jeder Upload sofort.
-- Umgekehrt wuerde neuer Code mit alter Policy genauso brechen. Es gibt also
-- keine Reihenfolge, die ohne Uebergang funktioniert.
--
-- Diese Policy akzeptiert BEIDES: den eigenen Nutzerordner und jeden Ordner
-- einer Organisation, in der man Mitglied ist. Danach:
--   1. Code laedt nach <organization_id>/ hoch, Deployment
--   2. Bestandsdateien verschieben (scripts/move-images-to-organization.mjs)
--   3. eigene Migration: die Nutzer-ID-Variante fallen lassen
--
-- Der Uebergang ist nicht unsicher, nur weiter als das Ziel: der eigene
-- Nutzerordner war schon vorher der eigene.
--
-- Lesen bleibt oeffentlich -- Bilder stehen auf oeffentlichen Eventseiten.
--
-- WARUM BESTANDSDATEIEN NICHT HIER VERSCHOBEN WERDEN:
-- Ein `update storage.objects set name = ...` benennt nur die Metadatenzeile
-- um, nicht die abgelegte Datei. Nachgemessen: danach antwortet der neue Pfad
-- mit 500 und der alte mit 400 -- das Objekt ist kaputt. Verschieben geht nur
-- ueber die Storage-API (POST /storage/v1/object/move), deshalb ein Skript und
-- keine Migration.
-- ---------------------------------------------------------------------------

drop policy "Authenticated users can upload event images" on storage.objects;
drop policy "Users can update their own event images" on storage.objects;
drop policy "Users can delete their own event images" on storage.objects;

create policy "Event images can be written by organization members"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.organization_user ou
        where ou.user_id = (select auth.uid())
          and ou.organization_id::text = (storage.foldername(name))[1]
      )
    )
  );

create policy "Event images can be updated by organization members"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'event-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.organization_user ou
        where ou.user_id = (select auth.uid())
          and ou.organization_id::text = (storage.foldername(name))[1]
      )
    )
  );

create policy "Event images can be deleted by organization members"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.organization_user ou
        where ou.user_id = (select auth.uid())
          and ou.organization_id::text = (storage.foldername(name))[1]
      )
    )
  );
