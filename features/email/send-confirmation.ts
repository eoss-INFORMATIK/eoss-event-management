import { createElement } from 'react';

import { Resend } from 'resend';

import {
  ConfirmationMail,
  confirmationSubject,
} from '@/features/email/confirmation-template';
import {
  TICKET_CID,
  ticketAttachments,
} from '@/features/email/ticket-attachments';

import { env } from '@/env';
import { formatDate } from '@/lib/format';
import { ticketUrl } from '@/lib/ticket';
import { createClient } from '@/server/supabase/server';

/**
 * Versand der Bestaetigungsmail -- bewusst KEIN `'use server'`.
 *
 * Vorher war das eine oeffentliche Server Action mit Empfaenger und Event als
 * Parametern, aufgerufen vom Browser: jeder konnte damit beliebig oft an
 * beliebige Adressen Mails ueber die Absenderdomain verschicken. Jetzt ruft
 * nur `addParticipant` diese Funktion auf, nach einem erfolgreichen Insert.
 *
 * Laeuft im Kontext der anonymen Anmeldung. Gelesen wird nur, was oeffentlich
 * ist: Event und Kategorie (oeffentliche SELECT-Policies) und der
 * Organisationsname ueber `event_organization_name()`.
 * Begruendung: docs/task-51-bestaetigungsmail.md
 */

interface Registration {
  eventId: string;
  email: string;
  name: string | null;
  categoryId: string | null;
  ticketCode: string;
}

export const sendRegistrationConfirmation = async ({
  eventId,
  email,
  name,
  categoryId,
  ticketCode,
}: Registration): Promise<{ error?: string }> => {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from('events')
    .select('title, date, category_label')
    .eq('id', eventId)
    .maybeSingle();
  if (!event) return { error: 'Event nicht gefunden' };

  const { data: category } = categoryId
    ? await supabase
        .from('event_categories')
        .select('label')
        .eq('id', categoryId)
        .maybeSingle()
    : { data: null };

  const { data: organizationName } = await supabase.rpc(
    'event_organization_name',
    { p_event_id: eventId }
  );

  const attachments = await ticketAttachments(
    ticketUrl(env.SITE_URL, ticketCode)
  );

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM_ADDRESS,
    to: [email],
    subject: confirmationSubject(event.title),
    attachments,
    react: createElement(ConfirmationMail, {
      eventTitle: event.title,
      eventDate: formatDate(event.date),
      name,
      email,
      category: category
        ? { label: event.category_label || 'Kategorie', value: category.label }
        : null,
      organizationName: organizationName ?? null,
      qrImageSrc: `cid:${TICKET_CID}`,
    }),
  });

  return error ? { error: error.message } : {};
};
