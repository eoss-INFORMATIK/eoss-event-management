import { notFound } from 'next/navigation';

import { getEvent } from '@/features/events/actions';
import { EventLanding } from '@/features/events/components/event-landing';
import { getEventOrganization } from '@/features/organizations/queries';
import { SingleEventRegistration } from '@/features/participants/components/single-event-registration';

import { createClient } from '@/server/supabase/server';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ event }, organization] = await Promise.all([
    getEvent(id),
    getEventOrganization(supabase, id),
  ]);
  if (!event) notFound();

  return (
    <EventLanding
      event={event}
      organization={organization}
      registration={<SingleEventRegistration params={params} />}
    />
  );
}
