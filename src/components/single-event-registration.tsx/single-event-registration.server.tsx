import { notFound } from 'next/navigation';

import { getEventAction } from '@/server/event-actions';

import { SingleEventRegistrationClient } from './single-event-registration.client';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function SingleEventRegistration({ params }: EventPageProps) {
  const resolvedParams = await params;
  const { event, error } = await getEventAction(resolvedParams.id);

  if (error || !event) {
    notFound();
  }

  return <SingleEventRegistrationClient eventId={event.id} />;
}
