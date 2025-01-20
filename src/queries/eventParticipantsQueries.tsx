import { eq } from 'drizzle-orm';

import db from '@/db';
import { eventParticipants } from '@/db/schema';

export const getEventParticipants = async (eventId: string) => {
  try {
    const participants = await db.query.eventParticipants.findMany({
      where: eq(eventParticipants.eventId, eventId),
    });
    return { participants };
  } catch (error) {
    console.error('Error fetching event participants:', error);
    return { error: 'Error fetching event participants' };
  }
};
