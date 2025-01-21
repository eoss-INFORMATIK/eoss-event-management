'use server';

import { revalidatePath } from 'next/cache';

import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import db from '@/db';
import events, { type Event, InsertEventSchema } from '@/db/schema/events';
import { type User } from '@/db/schema/users';

import { auth } from '@/config/auth';

type ActionResponse = {
  success?: boolean;
  error?: string;
};

type EventsResponse = {
  events?: Event[];
  error?: string;
};

type EventResponse = {
  event?: Event;
  error?: string;
};

export async function addEventAction(
  formData: z.infer<typeof InsertEventSchema>
): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user) {
    return { error: 'You must be logged in to create an event' };
  }

  try {
    const validatedFields = InsertEventSchema.parse(formData);

    const dataToInsert = {
      ...validatedFields,
      organizerId: (session.user as User).id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(events).values(dataToInsert);
    revalidatePath('/events');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: 'Failed to create event' };
  }
}

export async function editEventAction(
  eventId: string,
  formData: z.infer<typeof InsertEventSchema>
): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user) {
    return { error: 'You must be logged in to edit an event' };
  }

  try {
    // First check if the event exists and belongs to the user
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!existingEvent) {
      return { error: 'Event not found' };
    }

    if (existingEvent.organizerId !== (session.user as User).id) {
      return { error: 'You are not authorized to edit this event' };
    }

    const validatedFields = InsertEventSchema.parse(formData);

    await db
      .update(events)
      .set({
        title: validatedFields.title,
        description: validatedFields.description || null,
        date: new Date(validatedFields.date),
        updatedAt: new Date(),
        imageUrl: validatedFields.imageUrl || null,
      })
      .where(eq(events.id, eventId));

    revalidatePath(`/events/${eventId}`);
    revalidatePath('/events');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: 'Failed to edit event' };
  }
}

export async function deleteEventAction(
  eventId: string
): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user) {
    return { error: 'You must be logged in to delete an event' };
  }

  try {
    // First check if the event exists and belongs to the user
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!existingEvent) {
      return { error: 'Event not found' };
    }

    if (existingEvent.organizerId !== (session.user as User).id) {
      return { error: 'You are not authorized to delete this event' };
    }

    await db.delete(events).where(eq(events.id, eventId));

    // Revalidate both the events list and the specific event page
    revalidatePath('/events');
    revalidatePath(`/events/${eventId}`);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete event' };
  }
}

export async function getUserEventsAction(): Promise<EventsResponse> {
  const session = await auth();

  if (!session?.user) {
    return { error: 'You must be logged in to view your events' };
  }

  try {
    const userEvents = await db
      .select()
      .from(events)
      .where(eq(events.organizerId, (session.user as User).id));

    return { events: userEvents };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to fetch your events' };
  }
}

export async function getAllEventsAction(): Promise<EventsResponse> {
  try {
    const allEvents = await db.select().from(events).orderBy(desc(events.date));

    return { events: allEvents };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to fetch events' };
  }
}

export async function getEventAction(eventId: string): Promise<EventResponse> {
  try {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      return { error: 'Event not found' };
    }

    return { event };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to fetch event' };
  }
}
