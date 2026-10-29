import { notFound } from 'next/navigation';

import { getEvent } from '@/features/events/actions';
import { getEventCategories } from '@/features/events/categories';

import { createClient } from '@/server/supabase/server';

import { SingleEventMetaClient } from './single-event-meta.client';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
  clientView: boolean;
}

export async function SingleEventMeta({ params, clientView }: EventPageProps) {
  const resolvedParams = await params;
  const { event, error } = await getEvent(resolvedParams.id);

  if (error || !event) {
    notFound();
  }

  // Die Kategorien braucht nur das Bearbeiten-Formular. Sie hier zu laden und
  // nicht im Client spart einen zweiten Rundlauf und haelt den Client frei von
  // Datenzugriff.
  const supabase = await createClient();
  const categories = await getEventCategories(supabase, event.id);

  return (
    <SingleEventMetaClient
      event={event}
      categories={categories}
      clientView={clientView}
    />
  );
}
