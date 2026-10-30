-- TASK-55 (4/4): Veranstalter auf der oeffentlichen Event-Seite.
--
-- Die Landingpage zeigt Logo, Name, Adresse und Kontakt der Organisation,
-- die ein Event veranstaltet -- fuer anonyme Besucher. RLS zeigt
-- `organizations` aber nur Mitgliedern, und das bleibt so. Diese Funktion gibt
-- genau diese Felder heraus, genau einer Organisation, und nur ueber ein
-- existierendes Event: keine Liste, keine Suche nach Organisations-Id, keine
-- weitere Spalte. Die Angaben sind zum Veroeffentlichen erfasst (das Formular
-- sagt es), die Funktion veroeffentlicht also nichts Neues.
--
-- Gleiches Muster wie `event_organization_name` (TASK-51): `security definer`
-- mit leerem `search_path`, alle Namen voll qualifiziert. Jene Funktion bleibt
-- vorerst fuer die Bestaetigungsmail; sie faellt weg, wenn die Mail auf diese
-- umsteigt (Entfernen heisst Code zuerst).
--
-- Erweitern, also Migration zuerst.

create function public.event_organization(p_event_id uuid)
returns table (
  name text,
  logo_url text,
  street text,
  address_addition text,
  postal_code text,
  city text,
  contact_email text,
  phone text
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.name, o.logo_url, o.street, o.address_addition, o.postal_code,
         o.city, o.contact_email, o.phone
    from public.events e
    join public.organizations o on o.id = e.organization_id
   where e.id = p_event_id;
$$;

revoke all on function public.event_organization(uuid) from public;
grant execute on function public.event_organization(uuid) to anon, authenticated;
