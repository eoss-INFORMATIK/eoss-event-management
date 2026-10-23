-- ---------------------------------------------------------------------------
-- Policies: Besitz ist die Organisation, nicht der Nutzer
-- ---------------------------------------------------------------------------
-- Bisher pruefte jede Schreib-Policy `auth.uid() = organizer_id`. Damit gehoerte
-- ein Event der Person. EOS-20 will es bei der Organisation haben -- erst dann
-- koennen mehrere Personen dasselbe Event verwalten, und erst dann sind
-- Einladungen moeglich.
--
-- SECHS Policies hingen an organizer_id, nicht drei: die drei auf events und
-- drei auf event_participants, die ueber das Eltern-Event gehen. Beide Tabellen
-- muessen gleichzeitig umgestellt werden, sonst bleibt organizer_id
-- unkuendbar.
--
-- REIHENFOLGE, wichtig: diese Migration verlangt, dass der Code
-- organization_id beim Insert setzt. Sie darf also erst NACH dem Deployment von
-- 2c-1 nach Produktion gepusht werden. Beim Erweitern laeuft die Migration
-- zuerst, beim Verschaerfen der Code.
--
-- KEINE REKURSION: eine Policy auf events liest organization_user, dort greift
-- `user_id = auth.uid()` -- ein Spaltenvergleich ohne Tabellenzugriff. Eine
-- Policy auf event_participants liest events (oeffentliche SELECT-Policy) und
-- organization_user. Die `security definer`-Funktion my_organization_ids() aus
-- EOS-20 wird erst noetig, wenn eine Policy auf organization_user selbst
-- dieselbe Tabelle lesen muss -- also bei "zeig mir die anderen Mitglieder".
--
-- Zum UPDATE gehoert ein `with check`, nicht nur ein `using`: ohne das koennte
-- man ein Event per Update in eine fremde Organisation verschieben.
--
-- organization_id ist noch nullable. Ein Event ohne Organisation waere mit
-- diesen Policies unschreibbar und unsichtbar fuer Teilnehmerzugriffe -- der
-- Bestand ist befuellt, der Code setzt die Spalte, und das `not null` folgt in
-- 2d.
-- ---------------------------------------------------------------------------

-- events -------------------------------------------------------------------

drop policy "Users can create their own events" on public.events;
drop policy "Organizers can update their own events" on public.events;
drop policy "Organizers can delete their own events" on public.events;

create policy "Events can be created by members of the organization"
  on public.events for insert
  to authenticated
  with check (
    exists (
      select 1 from public.organization_user ou
      where ou.organization_id = events.organization_id
        and ou.user_id = (select auth.uid())
    )
  );

create policy "Events can be updated by members of the organization"
  on public.events for update
  to authenticated
  using (
    exists (
      select 1 from public.organization_user ou
      where ou.organization_id = events.organization_id
        and ou.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.organization_user ou
      where ou.organization_id = events.organization_id
        and ou.user_id = (select auth.uid())
    )
  );

create policy "Events can be deleted by members of the organization"
  on public.events for delete
  to authenticated
  using (
    exists (
      select 1 from public.organization_user ou
      where ou.organization_id = events.organization_id
        and ou.user_id = (select auth.uid())
    )
  );

-- event_participants -------------------------------------------------------
-- Der Join geht durch events; eine eigene organization_id auf
-- event_participants ist dafuer NICHT noetig. Die kommt in einer eigenen
-- Scheibe und dient der oeffentlichen Anmeldung (Trigger plus zusammengesetzter
-- Fremdschluessel), nicht der Policy.

drop policy "Organizers can view participants of their events" on public.event_participants;
drop policy "Organizers can update participants of their events" on public.event_participants;
drop policy "Organizers can delete participants of their events" on public.event_participants;

create policy "Participants are visible to members of the event's organization"
  on public.event_participants for select
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      join public.organization_user ou
        on ou.organization_id = e.organization_id
      where e.id = event_participants.event_id
        and ou.user_id = (select auth.uid())
    )
  );

create policy "Participants can be updated by members of the event's organization"
  on public.event_participants for update
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      join public.organization_user ou
        on ou.organization_id = e.organization_id
      where e.id = event_participants.event_id
        and ou.user_id = (select auth.uid())
    )
  )
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

create policy "Participants can be deleted by members of the event's organization"
  on public.event_participants for delete
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      join public.organization_user ou
        on ou.organization_id = e.organization_id
      where e.id = event_participants.event_id
        and ou.user_id = (select auth.uid())
    )
  );
