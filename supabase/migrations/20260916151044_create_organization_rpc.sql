-- ---------------------------------------------------------------------------
-- create_organization
--
-- Legt eine Organisation an und gibt sie zurueck.
--
-- Warum eine Funktion statt insert().select():
-- Bei "insert ... returning" wertet Postgres die SELECT-Policy aus, BEVOR der
-- after-insert-Trigger die Mitgliedschaft anlegt. Die SELECT-Policy auf
-- organizations verlangt aber genau diese Mitgliedschaft. Ergebnis:
-- "new row violates row-level security policy for table organizations".
-- Innerhalb dieser Funktion laeuft alles mit Besitzerrechten, RLS greift
-- nicht, und die Reihenfolge spielt keine Rolle mehr.
--
-- Sicherheit: die Funktion nimmt ausschliesslich den Namen entgegen. Die
-- Identitaet kommt aus auth.uid() INNERHALB der Funktion, nie vom Aufrufer.
-- Die Mitgliedschaft legt weiterhin der Trigger set_organization_user an --
-- damit gilt sie auch fuer Organisationen, die auf anderem Weg entstehen.
--
-- Aufruf aus der App: supabase.rpc('create_organization', { p_name: '...' })
-- ---------------------------------------------------------------------------

create or replace function public.create_organization(p_name text)
returns public.organizations
security definer
set search_path = ''
language plpgsql
as $BODY$
declare
  v_organization public.organizations;
begin
  if auth.uid() is null then
    raise exception 'create_organization braucht eine angemeldete Session';
  end if;

  insert into public.organizations (name)
  values (p_name)
  returning * into v_organization;

  return v_organization;
end;
$BODY$;

-- Standardmaessig darf PUBLIC jede neue Funktion ausfuehren. Hier nicht:
-- ohne Session bricht sie ohnehin ab, aber die Absicht gehoert explizit
-- hingeschrieben statt implizit auf dem Exception-Pfad zu landen.
revoke execute on function public.create_organization(text) from public;
revoke execute on function public.create_organization(text) from anon;
grant  execute on function public.create_organization(text) to authenticated;
