'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';

import { z } from 'zod';

import { sendRegistrationConfirmation } from '@/features/email/send-confirmation';
import {
  type OrganizerParticipantValues,
  type ParticipantFormValues,
  organizerParticipantSchema,
  participantFormSchema,
  participantStatusSchema,
} from '@/features/participants/schema';

import { newTicketCode } from '@/lib/ticket';
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
    .select('organization_id, category_required')
    .eq('id', eventId)
    .maybeSingle();

  if (!event) return { error: 'Event nicht gefunden' };

  // Ob die Angabe Pflicht ist, steht am Event -- nicht im Formular. Ein
  // oeffentlicher Client koennte das Feld sonst einfach weglassen.
  if (event.category_required && !parsed.data.categoryId)
    return { error: 'Bitte einen Wert auswählen' };

  // Im Server erzeugt und mitgeschrieben: die anonyme Anmeldung darf ihre
  // Zeile nicht zuruecklesen, die Mail braucht den Code fuer den QR-Code.
  const ticketCode = newTicketCode();

  const { error } = await supabase.from('event_participants').insert({
    event_id: eventId,
    email: parsed.data.email,
    name: parsed.data.name || null,
    organization_id: event.organization_id,
    category_id: parsed.data.categoryId || null,
    ticket_code: ticketCode,
  });

  if (error) {
    return {
      error: insertErrorMessage(error.code) ?? 'Anmeldung fehlgeschlagen',
    };
  }

  // Die Bestaetigungsmail geht nach der Antwort raus: die Anmeldung wartet
  // nicht auf Resend, und ein Fehler beim Versand macht sie nicht rueckgaengig.
  after(async () => {
    const result = await sendRegistrationConfirmation({
      eventId,
      email: parsed.data.email,
      name: parsed.data.name || null,
      categoryId: parsed.data.categoryId || null,
      ticketCode,
    });
    if (result.error) {
      // eslint-disable-next-line no-console
      console.error('[mail] Bestaetigung fehlgeschlagen', {
        eventId,
        error: result.error,
      });
    }
  });

  revalidatePath(`/events/${eventId}`);
  return { success: true };
};

/** Meldungen fuer Fehler, die beide Einfuege-Wege kennen. */
const insertErrorMessage = (code: string | undefined) => {
  // 23505 = unique_violation on (event_id, lower(email))
  if (code === '23505')
    return 'Für diese E-Mail-Adresse liegt bereits eine Anmeldung vor';
  // 23503 = foreign_key_violation: die Kategorie gehoert nicht zu diesem Event.
  if (code === '23503') return 'Der gewählte Wert gehört nicht zu diesem Event';
  return null;
};

/**
 * Organisator fuegt einen Teilnehmer von Hand hinzu, mit Status.
 *
 * Die Grenze ist die Policy "Members can add participants with any status":
 * ein Nicht-Mitglied faellt auf die oeffentliche Policy zurueck, und die
 * erlaubt nur `registered`. Die Kategorie ist hier optional, auch wenn das
 * Event sie bei der oeffentlichen Anmeldung verlangt -- der Organisator kennt
 * sie nicht immer. Es geht keine Mail raus.
 */
export const addParticipantAsOrganizer = async (
  formData: OrganizerParticipantValues,
  eventId: string
): Promise<ActionResponse> => {
  const parsed = organizerParticipantSchema.safeParse(formData);
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  if (!z.uuid().safeParse(eventId).success) {
    return { error: 'Ungültige Event-ID' };
  }

  const supabase = await createClient();

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
    status: parsed.data.status,
    organization_id: event.organization_id,
    category_id: parsed.data.categoryId || null,
  });

  if (error) {
    // 42501 = RLS: kein Mitglied der Organisation dieses Events.
    if (error.code === '42501') {
      return { error: 'Keine Berechtigung für dieses Event' };
    }
    return {
      error:
        insertErrorMessage(error.code) ??
        'Teilnehmer konnte nicht hinzugefügt werden',
    };
  }

  revalidatePath(`/events/${eventId}/admin`);
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
