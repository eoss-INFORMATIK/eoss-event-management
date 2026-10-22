-- ---------------------------------------------------------------------------
-- Seed fuer den LOKALEN Stack
--
-- Laeuft automatisch bei `npm run db:reset` -- siehe [db.seed] in config.toml.
-- Wird nie auf ein gehostetes Projekt angewendet: `supabase db push` fuehrt
-- keine Seeds aus, und `db reset --linked` benutzen wir nicht (es gibt bewusst
-- kein npm-Script dafuer).
--
-- WARUM EIN EIGENES SCHEMA `seed` UND NICHT `public`:
-- Alles in `public` landet in `supabase gen types`. Eine Hilfsfunktion, die nur
-- lokal existiert, wuerde damit in types/database.ts auftauchen und
-- behaupten, sie gaebe es auch in Produktion -- TypeScript winkt den Aufruf
-- durch, und die Antwort ist PGRST202. Genau das war der Fall, als die Funktion
-- noch `public.seed_demo_events` hiess.
-- `[api] schemas` in config.toml exponiert nur `public` und `graphql_public`,
-- also ist alles unter `seed` fuer die API und fuer die Typgenerierung
-- unsichtbar.
--
-- Warum hier KEINE Nutzer angelegt werden:
-- `auth.users` von Hand zu befuellen ist fragil -- die Tabelle hat
-- Pflichtspalten und eine zweite Tabelle `auth.identities`, die mitgepflegt
-- werden muss, und beides gehoert Supabase, nicht uns. Es ist auch unnoetig:
-- der lokale Mailcatcher faengt den Magic Link ab, und die erste Anmeldung
-- erzeugt Nutzer, Profil und Organisation ueber `ensureOrganization` -- also
-- genau den Code, den man beim Entwickeln ohnehin pruefen will.
--
-- Ablauf nach einem Reset:
--   1. npm run db:reset
--   2. npm run dev, auf /sign-in mit einer beliebigen Adresse anmelden
--   3. Mail im Catcher oeffnen: http://127.0.0.1:54324
--   4. in Studio (http://127.0.0.1:54323) im SQL-Editor:
--        select * from seed.demo_events();
-- ---------------------------------------------------------------------------

create schema if not exists seed;

-- Demo-Events fuer den zuerst angelegten Nutzer. Absichtlich eine Funktion und
-- keine festen INSERTs: zur Seed-Zeit existiert noch kein Nutzer, auf den
-- organizer_id zeigen koennte.
--
-- ACHTUNG bei Scheibe 2: sobald events an einer Organisation statt an einem
-- Nutzer haengt, muss diese Funktion mitgeaendert werden (organization_id und
-- created_by setzen).
create or replace function seed.demo_events(p_count int default 3)
returns setof public.events
language plpgsql
as $BODY$
declare
  v_user uuid;
begin
  select id into v_user from auth.users order by created_at limit 1;

  if v_user is null then
    raise exception
      'Kein Nutzer vorhanden. Erst einmal anmelden (Mailcatcher auf Port 54324), dann erneut aufrufen.';
  end if;

  return query
  with eingefuegt as (
    insert into public.events (title, description, date, organizer_id)
    select
      format('Demo-Event %s', i),
      'Angelegt von seed.demo_events() -- existiert nur lokal.',
      now() + (i || ' days')::interval,
      v_user
    from generate_series(1, p_count) as i
    returning *
  )
  select * from eingefuegt;
end;
$BODY$;

comment on function seed.demo_events(int) is
  'Nur lokal: Demo-Events fuer den ersten Nutzer. Definiert in supabase/seed.sql, nicht in einer Migration. Liegt bewusst nicht in public, damit es nicht in die generierten Typen gerät.';
