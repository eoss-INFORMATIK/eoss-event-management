import { notFound } from 'next/navigation';

import { getEventAction } from '@/server/eventActions';

import { SingleEventMetaClient } from './single-event-meta.client';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function SingleEventMeta({ params }: EventPageProps) {
  const resolvedParams = await params;
  const { event, error } = await getEventAction(resolvedParams.id);

  if (error || !event) {
    notFound();
  }

  return <SingleEventMetaClient event={event} />;
}
