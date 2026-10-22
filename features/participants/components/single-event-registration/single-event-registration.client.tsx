'use client';

import { EventRegistrationForm } from '@/features/participants/components/event-registration-form';

interface SingleEventRegistrationClientProps {
  eventId: string;
}

export function SingleEventRegistrationClient({
  eventId,
}: SingleEventRegistrationClientProps) {
  return <EventRegistrationForm eventId={eventId} />;
}
