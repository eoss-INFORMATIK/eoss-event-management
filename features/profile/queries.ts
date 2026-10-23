import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Profile } from '@/types';

/**
 * Das Profil des angemeldeten Nutzers.
 *
 * Bis zu dieser Scheibe wurde `profiles` zwar bei jeder Anmeldung geschrieben,
 * aber nirgends gelesen -- die Profilseite zeigte `user.user_metadata`. Das war
 * der Grund, warum der Name nicht aenderbar war: Provider-Metadaten gehoeren
 * dem Provider.
 *
 * Die RLS-Policy auf `profiles` laesst ohnehin nur die eigene Zeile durch; der
 * Filter steht trotzdem da, damit die Absicht im Code lesbar ist und nicht nur
 * in der Policy.
 */
export const getMyProfile = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Profile | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return data ?? null;
};
