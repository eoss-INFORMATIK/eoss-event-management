'use client';

import { EventRegistrationForm } from '@/features/participants/components/event-registration-form';

interface SingleEventRegistrationClientProps {
  eventId: string;
  categories: { id: string; label: string }[];
  categoryLabel: string;
  categoryRequired: boolean;
}

export function SingleEventRegistrationClient({
  eventId,
  categories,
  categoryLabel,
  categoryRequired,
}: SingleEventRegistrationClientProps) {
  return (
    <EventRegistrationForm
      eventId={eventId}
      categories={categories}
      categoryLabel={categoryLabel}
      categoryRequired={categoryRequired}
    />
  );
}
