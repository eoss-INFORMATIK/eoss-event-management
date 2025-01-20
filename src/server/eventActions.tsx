'use server';

import { revalidatePath } from 'next/cache';

import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import db from '@/db';
import events, { type Event } from '@/db/schema/events';
import { type User } from '@/db/schema/users';

import { auth } from '@/config/auth';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string().optional(),
  capacity: z.string().optional(),
});

type ActionResponse = {
  success?: boolean;
  error?: string;
};

export async function addEventAction(
  formData: z.infer<typeof eventSchema>
): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user) {
    return { error: 'You must be logged in to create an event' };
  }

  try {
    const validatedFields = eventSchema.parse(formData);
    const capacityValue = validatedFields.capacity
      ? parseInt(validatedFields.capacity, 10)
      : null;

    await db.insert(events).values({
      title: validatedFields.title,
      description: validatedFields.description || null,
      startDate: new Date(validatedFields.startDate),
      endDate: new Date(validatedFields.endDate),
      location: validatedFields.location || null,
      capacity: capacityValue,
      organizerId: (session.user as User).id,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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
  formData: z.infer<typeof eventSchema>
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

    const validatedFields = eventSchema.parse(formData);
    const capacityValue = validatedFields.capacity
      ? parseInt(validatedFields.capacity, 10)
      : null;

    await db
      .update(events)
      .set({
        title: validatedFields.title,
        description: validatedFields.description || null,
        startDate: new Date(validatedFields.startDate),
        endDate: new Date(validatedFields.endDate),
        location: validatedFields.location || null,
        capacity: capacityValue,
        updatedAt: new Date(),
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

type EventsResponse = {
  events?: Event[];
  error?: string;
};

export async function getUserEventsAction(): Promise<EventsResponse> {
  const session = await auth();

  if (!session?.user) {
    return { error: 'You must be logged in to view your events' };
  }

  try {
    const userEvents = await db
      .select()
      .from(events)
      .where(eq(events.organizerId, (session.user as User).id))
      .orderBy(desc(events.startDate));

    return { events: userEvents };
  } catch (error) {
    return { error: 'Failed to fetch your events' };
  }
}

export async function getAllEventsAction(): Promise<EventsResponse> {
  try {
    const allEvents = await db
      .select()
      .from(events)
      .orderBy(desc(events.startDate));

    return { events: allEvents };
  } catch (error) {
    return { error: 'Failed to fetch events' };
  }
}

type EventResponse = {
  event?: Event;
  error?: string;
};

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
    return { error: 'Failed to fetch event' };
  }
}
