'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { type EventInput, eventInputSchema } from '@/features/events/schema';

import { createClient } from '@/server/supabase/server';
import type { Event } from '@/types';

type ActionResponse = { success?: boolean; error?: string };
type EventsResponse = { events?: Event[]; error?: string };
type EventResponse = { event?: Event; error?: string };

/**
 * Ownership is enforced by RLS, not by these checks. The `auth.getUser()` calls
 * below exist so the user gets a readable message instead of a silent no-op --
 * a delete that matches no row under RLS succeeds with zero rows affected.
 */

export const addEvent = async (
  formData: EventInput
): Promise<ActionResponse> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return { error: 'Du musst angemeldet sein, um ein Event zu erstellen' };

  const parsed = eventInputSchema.safeParse(formData);
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const { error } = await supabase.from('events').insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    date: parsed.data.date.toISOString(),
    image_url: parsed.data.imageUrl || null,
    organizer_id: user.id,
  });

  if (error) return { error: 'Event konnte nicht erstellt werden' };

  revalidatePath('/events');
  return { success: true };
};

export const editEvent = async (
  eventId: string,
  formData: EventInput
): Promise<ActionResponse> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return { error: 'Du musst angemeldet sein, um ein Event zu bearbeiten' };

  const parsed = eventInputSchema.safeParse(formData);
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const { data, error } = await supabase
    .from('events')
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      date: parsed.data.date.toISOString(),
      image_url: parsed.data.imageUrl || null,
    })
    .eq('id', eventId)
    .select('id');

  if (error) return { error: 'Event konnte nicht gespeichert werden' };
  if (!data?.length) {
    return { error: 'Event nicht gefunden oder keine Berechtigung' };
  }

  revalidatePath('/events');
  revalidatePath(`/events/${eventId}`);
  return { success: true };
};

export const deleteEvent = async (eventId: string): Promise<ActionResponse> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return { error: 'Du musst angemeldet sein, um ein Event zu löschen' };

  const { data, error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .select('id');

  if (error) return { error: 'Event konnte nicht gelöscht werden' };
  if (!data?.length) {
    return { error: 'Event nicht gefunden oder keine Berechtigung' };
  }

  revalidatePath('/events');
  revalidatePath(`/events/${eventId}`);
  return { success: true };
};

export const getUserEvents = async (): Promise<EventsResponse> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return { error: 'Du musst angemeldet sein, um deine Events zu sehen' };

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', user.id)
    .order('date', { ascending: false });

  if (error) return { error: 'Events konnten nicht geladen werden' };
  return { events: data };
};

export const getAllEvents = async (): Promise<EventsResponse> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false });

  if (error) return { error: 'Events konnten nicht geladen werden' };
  return { events: data };
};

export const getEvent = async (eventId: string): Promise<EventResponse> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle();

  if (error) return { error: 'Event konnte nicht geladen werden' };
  if (!data) return { error: 'Event nicht gefunden' };

  return { event: data };
};
