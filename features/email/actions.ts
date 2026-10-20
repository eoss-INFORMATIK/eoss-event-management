'use server';

import { createElement } from 'react';

import { Resend } from 'resend';

import { EmailTemplate } from '@/features/email/email-template';

import { env } from '@/env';
import { createClient } from '@/server/supabase/server';
import type { ActionResponse } from '@/types/actions';


const resend = new Resend(env.RESEND_API_KEY);

/**
 * Sends the registration confirmation.
 *
 * Calls Resend directly. The previous version POSTed to this app's own
 * /api/send route from inside a server action -- a full HTTP round trip to
 * reach code running in the same process.
 */
export const sendConfirmationEmail = async (
  firstName: string,
  subject: string,
  toEmail: string,
  eventId: string
): Promise<ActionResponse> => {
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('title, description, image_url')
    .eq('id', eventId)
    .maybeSingle();

  if (eventError || !event) {
    return { error: 'Event nicht gefunden' };
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM_ADDRESS,
    to: [toEmail],
    subject,
    react: createElement(EmailTemplate, {
      firstName,
      title: event.title,
      description: event.description ?? '',
      imageUrl: event.image_url ?? undefined,
    }),
  });

  if (error) return { error: 'Bestätigungsmail konnte nicht versendet werden' };

  return { success: true };
};
