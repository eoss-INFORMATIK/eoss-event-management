import { notFound } from 'next/navigation';

import { getEvent } from '@/features/events/actions';
import {
  DEFAULT_CATEGORY_LABEL,
  getEventCategories,
} from '@/features/events/categories';

import { createClient } from '@/server/supabase/server';

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

  // Oeffentlich lesbar, deshalb reicht der normale Client ohne Anmeldung --
  // die Policy auf event_categories laesst `select` fuer alle zu, genau wie
  // bei den Events selbst.
  const supabase = await createClient();
  const categories = await getEventCategories(supabase, event.id);

  return (
    <SingleEventRegistrationClient
      eventId={event.id}
      categories={categories.map(({ id, label }) => ({ id, label }))}
      categoryLabel={event.category_label ?? DEFAULT_CATEGORY_LABEL}
      categoryRequired={event.category_required}
    />
  );
}
