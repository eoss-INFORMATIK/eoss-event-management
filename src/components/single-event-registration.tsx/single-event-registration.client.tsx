'use client';

import { EventRegistrationForm } from '@/components/forms/event-registration-form';

interface SingleEventRegistrationClientProps {
  eventId: string;
}

export function SingleEventRegistrationClient({
  eventId,
}: SingleEventRegistrationClientProps) {
  return (
    <div className="container mx-auto p-6">
      <EventRegistrationForm eventId={eventId} />
    </div>
  );
}
