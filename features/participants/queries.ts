import { createClient } from '@/server/supabase/server';
import type { EventParticipant } from '@/types';

type ParticipantsResponse = {
  participants?: (EventParticipant & {
    eventName: string | null;
    categoryLabel: string | null;
  })[];
  error?: string;
};

/**
 * Participants of one event, each annotated with the event title.
 *
 * One joined query instead of the previous two round trips. RLS returns an
 * empty list for anyone who does not organize this event.
 */
export const getEventParticipants = async (
  eventId: string
): Promise<ParticipantsResponse> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_participants')
    .select('*, events (title), event_categories (label)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
    // Gleichstandsregel: gleiche Zeitstempel (Import, gleichzeitige Anmeldung)
    // haben in Postgres keine feste Reihenfolge, und ein UPDATE schreibt die
    // Zeile neu -- ohne `id` sprang eine Zeile nach einer Statusaenderung.
    .order('id', { ascending: true });

  if (error) return { error: 'Teilnehmer konnten nicht geladen werden' };

  const participants = data.map(
    ({ events, event_categories, ...participant }) => ({
      ...participant,
      eventName: events?.title ?? null,
      categoryLabel: event_categories?.label ?? null,
    })
  );

  return { participants };
};
