import type { User } from '@supabase/supabase-js';

import type { createClient } from '@/server/supabase/server';
import type { ActionResponse } from '@/types/actions';

/**
 * Richtet ein Konto nach der Anmeldung fertig ein: Profilzeile anlegen, und
 * sicherstellen, dass der Nutzer in genau einer Organisation ist.
 *
 * Wird aus /auth/callback (OAuth) und /auth/confirm (Magic Link) aufgerufen --
 * beide Fluesse muessen es tun, sonst haengt es davon ab, wie sich jemand
 * angemeldet hat. Kein 'use server': nur Route Handler rufen das auf, eine
 * Server Action waere ein Endpoint, den niemand braucht.
 *
 * Idempotent. Mehrfach aufrufen ist der Normalfall -- es laeuft bei jeder
 * Anmeldung, nicht nur bei der ersten.
 *
 * Die Zeile in `organization_user` schreibt diese Funktion NICHT. Das macht der
 * Trigger `set_organization_user` auf `organizations` (siehe
 * supabase/migrations/20260909134951_organizations.sql). Hier steht nur der
 * Aufruf, der ihn ausloest.
 */

// Der Client kommt als Parameter: die Route hat bereits einen, und ein zweiter
// wuerde dieselben Cookies nochmal lesen.
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Anzeigename aus den Metadaten des Providers. Google liefert `full_name`,
 * manche Provider `name`, ein Magic Link liefert gar nichts -- dann bleibt der
 * Lokalteil der E-Mail. Schritt 2 ersetzt das durch ein Profilformular.
 */
const displayNameFrom = (user: User): string | null => {
  const meta = user.user_metadata as Record<string, unknown>;

  if (typeof meta.full_name === 'string' && meta.full_name.trim())
    return meta.full_name.trim();

  if (typeof meta.name === 'string' && meta.name.trim())
    return meta.name.trim();

  const localPart = user.email?.split('@')[0];

  return localPart ? localPart : null;
};

/**
 * Platzhaltername. Schritt 1 hat bewusst keine Seite zum Bearbeiten der
 * Organisation (siehe docs/EOS-20_Multi_Org_Setup, Abgrenzung), also muss der
 * Name ohne Zutun des Nutzers entstehen.
 */
const organizationNameFrom = (user: User): string =>
  `Organisation von ${displayNameFrom(user) ?? 'unbekannt'}`;

export const ensureOrganization = async (
  supabase: SupabaseServerClient
): Promise<ActionResponse> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) return { error: `getUser: ${userError.message}` };
  if (!user) return { error: 'getUser: keine Session' };

  // Anlegen, nie ueberschreiben. Bei einem Magic Link ist der Name leer; sobald
  // Schritt 2 ein Profilformular bringt, darf eine spaetere Anmeldung den dort
  // eingetragenen Namen nicht wieder mit Provider-Metadaten plattmachen.
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      name: displayNameFrom(user),
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  if (profileError) return { error: `profiles: ${profileError.message}` };

  // Die RLS-Policy auf organization_user laesst ohnehin nur die eigenen Zeilen
  // durch; der Filter steht trotzdem da, damit die Absicht im Code lesbar ist
  // und nicht nur in der Policy.
  const { data: membership, error: membershipError } = await supabase
    .from('organization_user')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError)
    return { error: `organization_user: ${membershipError.message}` };

  if (membership) return { success: true };

  const { error: createError } = await supabase.rpc('create_organization', {
    p_name: organizationNameFrom(user),
  });

  if (createError)
    return { error: `create_organization: ${createError.message}` };

  return { success: true };
};
