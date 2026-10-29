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

/**
 * Der Sponsorblock als Spaltenwerte.
 *
 * Ausgeschaltet heisst: alle drei Spalten null. Es gibt bewusst keine Spalte
 * `sponsor_enabled` -- ein Schalter neben den Daten waere ein zweiter Zustand,
 * der dem ersten widersprechen kann. Siehe docs/eos-36-dynamische-felder.md.
 */
const sponsorColumns = (input: EventInput) =>
  input.sponsorEnabled
    ? {
        sponsor_name: input.sponsorName ?? null,
        sponsor_text: input.sponsorText || null,
        sponsor_image_url: input.sponsorImageUrl || null,
      }
    : { sponsor_name: null, sponsor_text: null, sponsor_image_url: null };

/**
 * Bringt die Kategorien eines Events auf den eingereichten Stand.
 *
 * Kein "alles loeschen und neu anlegen": das wuerde jede bestehende Anmeldung
 * entwerten, weil `category_id` darauf zeigt. Stattdessen abgleichen --
 * vorhandene aktualisieren, neue anlegen, verschwundene loeschen.
 *
 * Das Loeschen kann scheitern, und das ist Absicht: auf der Kategorie liegt
 * `on delete restrict`. Wer einen Wert entfernt, auf den bereits Anmeldungen
 * zeigen, bekommt eine lesbare Meldung statt einer stillschweigend entwerteten
 * Teilnehmerliste. 23503 ist foreign_key_violation.
 */
const syncCategories = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  input: EventInput
): Promise<ActionResponse> => {
  const wanted = input.categoriesEnabled
    ? input.categories
        .map((category, index) => ({
          ...category,
          label: category.label.trim(),
          index,
        }))
        .filter((category) => category.label)
    : [];

  const { data: existing, error: readError } = await supabase
    .from('event_categories')
    .select('id')
    .eq('event_id', eventId);

  if (readError) return { error: 'Kategorien konnten nicht geladen werden' };

  const keptIds = new Set(
    wanted.map((category) => category.id).filter(Boolean) as string[]
  );
  const removed = (existing ?? [])
    .map((row) => row.id)
    .filter((id) => !keptIds.has(id));

  if (removed.length) {
    const { error } = await supabase
      .from('event_categories')
      .delete()
      .in('id', removed);

    if (error?.code === '23503')
      return {
        error:
          'Ein Wert lässt sich nicht entfernen, weil bereits Anmeldungen darauf verweisen',
      };

    if (error) return { error: 'Kategorien konnten nicht gespeichert werden' };
  }

  for (const category of wanted) {
    const { error } = category.id
      ? await supabase
          .from('event_categories')
          .update({ label: category.label, position: category.index })
          .eq('id', category.id)
      : await supabase.from('event_categories').insert({
          event_id: eventId,
          label: category.label,
          position: category.index,
        });

    if (error) return { error: 'Kategorien konnten nicht gespeichert werden' };
  }

  return { success: true };
};

/** Die Spalten am Event, die zu den Kategorien gehoeren. */
const categoryColumns = (input: EventInput) =>
  input.categoriesEnabled
    ? {
        category_label: input.categoryLabel?.trim() || null,
        category_required: input.categoryRequired,
      }
    : { category_label: null, category_required: false };

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

  // `select('id')`, weil die Kategorien danach das frisch angelegte Event
  // brauchen. Ohne das muesste man es wieder suchen.
  const { data: created, error } = await supabase
    .from('events')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      date: parsed.data.date.toISOString(),
      image_url: parsed.data.imageUrl || null,
      organization_id: organizationId,
      created_by: user.id,
      ...sponsorColumns(parsed.data),
      ...categoryColumns(parsed.data),
    })
    .select('id')
    .single();

  if (error || !created) return { error: 'Event konnte nicht erstellt werden' };

  const categories = await syncCategories(supabase, created.id, parsed.data);
  if (categories.error) return categories;

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
      ...sponsorColumns(parsed.data),
      ...categoryColumns(parsed.data),
    })
    .eq('id', eventId)
    .select('id');

  if (error) return { error: 'Event konnte nicht gespeichert werden' };
  if (!data?.length) {
    return { error: 'Event nicht gefunden oder keine Berechtigung' };
  }

  const categories = await syncCategories(supabase, eventId, parsed.data);
  if (categories.error) return categories;

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
