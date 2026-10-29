import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types';

export type EventCategory =
  Database['public']['Tables']['event_categories']['Row'];

/** Vorgabe, wenn der Organisator keine eigene Beschriftung gesetzt hat. */
export const DEFAULT_CATEGORY_LABEL = 'Kategorie';

/**
 * Die Kategorien eines Events, in der Reihenfolge, die der Organisator
 * festgelegt hat.
 *
 * Oeffentlich lesbar -- das Anmeldeformular auf der oeffentlichen Eventseite
 * braucht sie, genau wie das Event selbst. Nimmt deshalb `SupabaseClient`
 * und nicht den Server-Client-Typ.
 */
export const getEventCategories = async (
  supabase: SupabaseClient<Database>,
  eventId: string
): Promise<EventCategory[]> => {
  const { data } = await supabase
    .from('event_categories')
    .select('*')
    .eq('event_id', eventId)
    .order('position', { ascending: true });

  return data ?? [];
};
