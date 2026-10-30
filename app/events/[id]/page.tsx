import { notFound } from 'next/navigation';

import { getEvent } from '@/features/events/actions';
import { EventLanding } from '@/features/events/components/event-landing';
import { SingleEventRegistration } from '@/features/participants/components/single-event-registration';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const { event } = await getEvent(id);
  if (!event) notFound();

  return (
    <EventLanding
      event={event}
      registration={<SingleEventRegistration params={params} />}
    />
  );
}
