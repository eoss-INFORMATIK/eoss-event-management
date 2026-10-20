import { notFound } from 'next/navigation';

import { getEvent } from '@/features/events/actions';

import { SingleEventRegistrationClient } from './single-event-registration.client';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function SingleEventRegistration({ params }: EventPageProps) {
  const resolvedParams = await params;
  const { event, error } = await getEvent(resolvedParams.id);

  if (error || !event) {
    notFound();
  }

  return <SingleEventRegistrationClient eventId={event.id} />;
}
