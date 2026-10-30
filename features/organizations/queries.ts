import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Organization } from '@/types';

/**
 * Die Organisation des angemeldeten Nutzers.
 *
 * In Schritt 1 ist ein Nutzer in genau einer Organisation -- `unique(user_id)`
 * auf `organization_user` erzwingt das -- deshalb genuegt `maybeSingle()`.
 * Sobald Schritt 2 mehrere Organisationen pro Nutzer erlaubt, faellt diese
 * Einschraenkung weg und es braucht eine Auswahl (aktive Organisation). Diese
 * Funktion ist dann die Stelle, an der sie hinkommt.
 *
 * Nimmt bewusst `SupabaseClient<Database>` statt des Server-Client-Typs: der
 * Bild-Upload laeuft im Browser und braucht dieselbe Auskunft.
 *
 * Die RLS-Policy auf `organization_user` laesst ohnehin nur die eigenen Zeilen
 * durch; der Filter steht trotzdem da, damit die Absicht im Code lesbar ist und
 * nicht nur in der Policy.
 */
export const getMyOrganizationId = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> => {
  const { data } = await supabase
    .from('organization_user')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle();

  return data?.organization_id ?? null;
};

/**
 * Alle Organisationen des Nutzers -- als Liste, auch wenn es heute genau eine
 * ist (`unique(user_id)` auf `organization_user`).
 *
 * Bewusst getrennt von `getMyOrganizationId()`: das sind zwei verschiedene
 * Fragen. Diese hier heisst "welche gehoeren mir", die andere "in welcher
 * handle ich gerade". Heute faellt beides zusammen, mit mehreren
 * Organisationen pro Nutzer nicht mehr -- dann wird aus der zweiten eine
 * *aktive* Organisation, waehrend diese unveraendert bleibt.
 *
 * Die RLS-Policies lassen ohnehin nur die eigenen Mitgliedschaften und die
 * zugehoerigen Organisationen durch.
 */
export const getMyOrganizations = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Organization[]> => {
  const { data } = await supabase
    .from('organization_user')
    .select('organizations (*)')
    .eq('user_id', userId);

  return (data ?? [])
    .map((row) => row.organizations)
    .filter((organization) => organization !== null);
};

/**
 * Eine einzelne Organisation. Liefert `null`, wenn sie nicht existiert ODER der
 * Nutzer nicht Mitglied ist -- die SELECT-Policy unterscheidet das nicht, und
 * die Seite soll es auch nicht: beides ist "gibt es fuer dich nicht".
 */
export const getOrganization = async (
  supabase: SupabaseClient<Database>,
  organizationId: string
): Promise<Organization | null> => {
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .maybeSingle();

  return data ?? null;
};

/**
 * Was eine oeffentliche Event-Seite ueber den Veranstalter zeigt. Heute nur
 * der Name; Logo und Kontakt kommen mit TASK-55, Scheibe 4.
 */
export interface EventOrganization {
  name: string;
}

/**
 * Der Veranstalter eines Events, lesbar auch ohne Anmeldung.
 *
 * Nicht ueber `organizations`: deren SELECT-Policy zeigt nur Mitgliedern
 * etwas. Die Definer-Funktion gibt genau den Namen heraus und sonst nichts
 * (Begruendung: docs/task-51-bestaetigungsmail.md).
 */
export const getEventOrganization = async (
  supabase: SupabaseClient<Database>,
  eventId: string
): Promise<EventOrganization | null> => {
  const { data } = await supabase.rpc('event_organization_name', {
    p_event_id: eventId,
  });

  return data ? { name: data } : null;
};
