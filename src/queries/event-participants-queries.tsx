import { eq } from 'drizzle-orm';

import db from '@/db';
import { eventParticipants, events } from '@/db/schema';

export const getEventParticipants = async (eventId: string) => {
  try {
    const participants = await db.query.eventParticipants.findMany({
      where: eq(eventParticipants.eventId, eventId),
    });
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });
    return {
      participants: participants.map((participant) => ({
        ...participant,
        eventName: event?.title,
      })),
    };
  } catch (error) {
    console.error('Error fetching event participants:', error);
    return { error: 'Error fetching event participants' };
  }
};
