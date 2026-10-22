-- ---------------------------------------------------------------------------
-- organization_user: Fremdschluessel mit ON DELETE CASCADE
-- ---------------------------------------------------------------------------
-- Problem: beide Fremdschluessel standen ohne Loeschverhalten da. Einen
-- Auth-Nutzer zu loeschen brach deshalb ab:
--
--   ERROR: update or delete on table "users" violates foreign key constraint
--          "organization_user_user_id_fkey" on table "organization_user"
--
-- profiles und events kaskadieren bereits korrekt -- organization_user war die
-- Ausnahme, und zwar unbeabsichtigt.
--
-- Entscheidung: beide kaskadieren.
--   user_id         -- eine Mitgliedschaft ohne Nutzer ist sinnlos
--   organization_id -- eine Mitgliedschaft ohne Organisation ebenso
--
-- Postgres kann ON DELETE nicht nachtraeglich aendern, der Fremdschluessel muss
-- fallen und neu entstehen. Die Namen sind die von Postgres automatisch
-- vergebenen; hier stehen sie explizit, damit die naechste Aenderung sie nicht
-- erst suchen muss.
--
-- Bewusst NICHT Teil dieser Migration: loescht man den letzten Nutzer einer
-- Organisation, bleibt die Organisation ohne Mitglieder zurueck und ist durch
-- RLS fuer niemanden mehr sichtbar. Das Aufraeumen gehoert zur
-- Mitgliederverwaltung, nicht hierher.
-- ---------------------------------------------------------------------------

alter table public.organization_user
  drop constraint organization_user_user_id_fkey,
  add constraint organization_user_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.organization_user
  drop constraint organization_user_organization_id_fkey,
  add constraint organization_user_organization_id_fkey
    foreign key (organization_id) references public.organizations (id)
    on delete cascade;
