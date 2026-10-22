import type { createClient } from '@/server/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Die Organisation des angemeldeten Nutzers.
 *
 * In Schritt 1 ist ein Nutzer in genau einer Organisation -- `unique(user_id)`
 * auf `organization_user` erzwingt das -- deshalb genuegt `maybeSingle()`.
 * Sobald Schritt 2 mehrere Organisationen pro Nutzer erlaubt, faellt diese
 * Einschraenkung weg und es braucht eine Auswahl (aktive Organisation). Diese
 * Funktion ist dann die Stelle, an der sie hinkommt.
 *
 * Die RLS-Policy auf `organization_user` laesst ohnehin nur die eigenen Zeilen
 * durch; der Filter steht trotzdem da, damit die Absicht im Code lesbar ist und
 * nicht nur in der Policy.
 */
export const getMyOrganizationId = async (
  supabase: SupabaseServerClient,
  userId: string
): Promise<string | null> => {
  const { data } = await supabase
    .from('organization_user')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle();

  return data?.organization_id ?? null;
};
