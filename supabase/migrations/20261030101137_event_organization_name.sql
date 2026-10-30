-- TASK-51 (1/2): Organisationsname fuer die Bestaetigungsmail.
--
-- Die Mail wird bei einer anonymen Anmeldung verschickt, und RLS zeigt
-- Organisationen nur ihren Mitgliedern. Statt die SELECT-Policy auf
-- `organizations` zu oeffnen, gibt diese Funktion genau eine Sache heraus:
-- den Namen der Organisation eines existierenden Events. Keine Liste, keine
-- andere Spalte. Der Name steht ohnehin in jeder Bestaetigungsmail.
--
-- `security definer` mit leerem `search_path`: die Funktion laeuft mit den
-- Rechten ihres Besitzers, also muessen alle Namen voll qualifiziert sein,
-- sonst koennte ein Aufrufer ueber ein eigenes Schema etwas unterschieben.
--
-- Begruendung: docs/task-51-bestaetigungsmail.md

create function public.event_organization_name(p_event_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select o.name
    from public.events e
    join public.organizations o on o.id = e.organization_id
   where e.id = p_event_id;
$$;

revoke all on function public.event_organization_name(uuid) from public;
grant execute on function public.event_organization_name(uuid) to anon, authenticated;
