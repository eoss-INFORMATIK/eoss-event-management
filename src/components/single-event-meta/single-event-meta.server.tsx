import { notFound } from 'next/navigation';

import { getEventAction } from '@/server/event-actions';

import { SingleEventMetaClient } from './single-event-meta.client';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
  clientView: boolean;
}

export async function SingleEventMeta({ params, clientView }: EventPageProps) {
  const resolvedParams = await params;
  const { event, error } = await getEventAction(resolvedParams.id);

  if (error || !event) {
    notFound();
  }

  return <SingleEventMetaClient event={event} clientView={clientView} />;
}
