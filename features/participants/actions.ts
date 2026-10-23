'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import {
  type ParticipantFormValues,
  participantFormSchema,
  participantStatusSchema,
} from '@/features/participants/schema';

import { createClient } from '@/server/supabase/server';
import type { ActionResponse } from '@/types/actions';

/** Public: anyone can register for an event. */
export const addParticipant = async (
  formData: ParticipantFormValues,
  eventId: string
): Promise<ActionResponse> => {
  const parsed = participantFormSchema.safeParse(formData);
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  if (!z.uuid().safeParse(eventId).success) {
    return { error: 'Ungültige Event-ID' };
  }

  const supabase = await createClient();

  // Die Organisation kommt aus dem Event, nie vom Client -- die Anmeldung ist
  // oeffentlich. Der Trigger `event_participants_set_organization` setzt sie
  // beim Insert ohnehin unbedingt neu und ueberschreibt jeden mitgelieferten
  // Wert; dieser Lookup existiert aus zwei anderen Gruenden: die generierten
  // Typen verlangen die Spalte (sie ist `not null` ohne Default), und ein
  // unbekanntes Event bekommt damit eine lesbare Meldung statt eines
  // Fremdschluesselfehlers.
  const { data: event } = await supabase
    .from('events')
    .select('organization_id')
    .eq('id', eventId)
    .maybeSingle();

  if (!event) return { error: 'Event nicht gefunden' };

  const { error } = await supabase.from('event_participants').insert({
    event_id: eventId,
    email: parsed.data.email,
    name: parsed.data.name || null,
    organization_id: event.organization_id,
  });

  if (error) {
    // 23505 = unique_violation on (event_id, lower(email))
    if (error.code === '23505') {
      return {
        error: 'Für diese E-Mail-Adresse liegt bereits eine Anmeldung vor',
      };
    }
    return { error: 'Anmeldung fehlgeschlagen' };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
};

/**
 * Organizer only -- enforced by RLS. Previously these two actions had no auth
 * check at all: any visitor could delete participants or change their status.
 */

export const deleteParticipant = async (
  participantId: string,
  eventId: string
): Promise<ActionResponse> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_participants')
    .delete()
    .eq('id', participantId)
    .select('id');

  if (error) return { error: 'Teilnehmer konnte nicht gelöscht werden' };
  if (!data?.length) {
    return { error: 'Teilnehmer nicht gefunden oder keine Berechtigung' };
  }

  revalidatePath(`/events/${eventId}/admin`);
  return { success: true };
};

export const setParticipantStatus = async (
  participantId: string,
  status: string,
  eventId: string
): Promise<ActionResponse> => {
  const parsed = participantStatusSchema.safeParse(status);
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_participants')
    .update({ status: parsed.data })
    .eq('id', participantId)
    .select('id');

  if (error) return { error: 'Status konnte nicht geändert werden' };
  if (!data?.length) {
    return { error: 'Teilnehmer nicht gefunden oder keine Berechtigung' };
  }

  revalidatePath(`/events/${eventId}/admin`);
  return { success: true };
};
