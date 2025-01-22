'use server';

import { eq } from 'drizzle-orm';

import db from '@/db';
import { events } from '@/db/schema';

import { env } from '@/env/server';

export const sendConfirmationEmailAction = async (
  firstName: string,
  subject: string,
  toEmail: string,
  eventId: string
) => {
  const event = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  const { title, description, imageUrl } = event[0];

  const response = await fetch(`${env.SITE_URL}/api/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName,
      subject,
      toEmail,
      title,
      description,
      imageUrl,
    }),
  });
  return response.json();
};
