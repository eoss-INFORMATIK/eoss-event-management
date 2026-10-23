'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { type EventInput, eventInputSchema } from '@/features/events/schema';
import { getMyOrganizationId } from '@/features/organizations/queries';

import { createClient } from '@/server/supabase/server';
import type { Event } from '@/types';
import type { ActionResponse } from '@/types/actions';

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

  // Das Event gehoert der Organisation, nicht der Person. `ensureOrganization`
  // legt bei jeder Anmeldung eine an, hier darf also keine fehlen -- wenn doch,
  // ist der Zustand inkonsistent und eine lesbare Meldung besser als ein Insert
  // mit null.
  const organizationId = await getMyOrganizationId(supabase, user.id);

  if (!organizationId)
    return { error: 'Zu deinem Konto gehört keine Organisation' };

  const { error } = await supabase.from('events').insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    date: parsed.data.date.toISOString(),
    image_url: parsed.data.imageUrl || null,
    organization_id: organizationId,
    created_by: user.id,
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
      updated_by: user.id,
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

  // Ab hier ist die Organisation der Besitzer, nicht der Nutzer. Solange ein
  // Nutzer in genau einer Organisation ist (Schritt 1), liefert das dieselbe
  // Menge wie der alte Filter auf organizer_id -- der Unterschied entsteht erst
  // mit Einladungen, wenn mehrere Personen dieselbe Organisation teilen.
  const organizationId = await getMyOrganizationId(supabase, user.id);

  if (!organizationId)
    return { error: 'Zu deinem Konto gehört keine Organisation' };

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organization_id', organizationId)
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
