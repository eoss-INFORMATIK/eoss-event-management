'use client';

import { EventRegistrationForm } from '@/components/forms/event-registration-form';

interface SingleEventRegistrationClientProps {
  eventId: string;
}

export function SingleEventRegistrationClient({
  eventId,
}: SingleEventRegistrationClientProps) {
  return <EventRegistrationForm eventId={eventId} />;
}
