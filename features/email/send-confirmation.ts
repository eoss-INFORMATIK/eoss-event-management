import { createElement } from 'react';

import { Resend } from 'resend';

import {
  ConfirmationMail,
  confirmationSubject,
} from '@/features/email/confirmation-template';
import { logoAttachment } from '@/features/email/logo-attachment';
import {
  TICKET_CID,
  ticketAttachments,
} from '@/features/email/ticket-attachments';
import { getEventOrganization } from '@/features/organizations/queries';

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
 * ist: Event und Kategorie (oeffentliche SELECT-Policies) und Name, Logo,
 * Adresse und Kontakt der Organisation ueber `event_organization()` -- dieselbe
 * Definer-Funktion wie die Landingpage (TASK-56).
 * Begruendung: docs/task-51-bestaetigungsmail.md, docs/entscheidungen.md
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

  const organization = await getEventOrganization(supabase, eventId);

  const [tickets, logo] = await Promise.all([
    ticketAttachments(ticketUrl(env.SITE_URL, ticketCode)),
    logoAttachment(organization?.logoUrl ?? null, env.NEXT_PUBLIC_SUPABASE_URL),
  ]);

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM_ADDRESS,
    to: [email],
    subject: confirmationSubject(event.title),
    attachments: logo ? [...tickets, logo.attachment] : tickets,
    react: createElement(ConfirmationMail, {
      eventTitle: event.title,
      eventDate: formatDate(event.date),
      name,
      email,
      category: category
        ? { label: event.category_label || 'Kategorie', value: category.label }
        : null,
      organization,
      logo: logo?.logo ?? null,
      qrImageSrc: `cid:${TICKET_CID}`,
    }),
  });

  return error ? { error: error.message } : {};
};
