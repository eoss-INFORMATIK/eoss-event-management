import { createClient } from '@/server/supabase/server';
import type { EventParticipant } from '@/types';

type ParticipantsResponse = {
  participants?: (EventParticipant & { eventName: string | null })[];
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
    .select('*, events (title)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) return { error: 'Teilnehmer konnten nicht geladen werden' };

  const participants = data.map(({ events, ...participant }) => ({
    ...participant,
    eventName: events?.title ?? null,
  }));

  return { participants };
};
