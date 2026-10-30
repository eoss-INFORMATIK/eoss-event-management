-- TASK-49 (3/3): Teilnehmer manuell hinzufuegen -- und wer beim Einfuegen
-- den Status bestimmen darf.
--
-- Vorher: "Anyone can register" mit `with check (true)`. Gemessen: ein
-- anonymer Aufruf direkt gegen die API legte eine Anmeldung mit Status
-- `attended` an. Mit den Status aus TASK-44 heisst das: sich selbst als
-- "Teilgenommen" oder "Eingeladen" eintragen, und mit der Warteliste spaeter
-- an ihr vorbei als "Angemeldet".
--
-- Nachher zwei INSERT-Policies, die Postgres mit ODER verknuepft:
--   1. oeffentlich: nur `registered`
--   2. Mitglieder der Organisation des Events: jeder Status
--
-- Migration zuerst, obwohl Policy 1 verschaerft: das oeffentliche Formular
-- setzt nie einen Status, es bekommt `registered` ueber den Default -- und der
-- greift vor der Pruefung. Der alte Code besteht die neue Policy also.

drop policy "Anyone can register for an event" on public.event_participants;

create policy "Anyone can register for an event"
  on public.event_participants for insert
  to anon, authenticated
  with check (status = 'registered');

create policy "Members can add participants with any status"
  on public.event_participants for insert
  to authenticated
  with check (
    exists (
      select 1
        from public.events e
        join public.organization_user ou
          on ou.organization_id = e.organization_id
       where e.id = event_participants.event_id
         and ou.user_id = (select auth.uid())
    )
  );
