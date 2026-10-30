import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { CircleArrowLeft } from 'lucide-react';

import { getEvent } from '@/features/events/actions';
import {
  DEFAULT_CATEGORY_LABEL,
  getEventCategories,
} from '@/features/events/categories';
import { EventAdminActions } from '@/features/events/components/event-admin-actions';
import { SingleEventMeta } from '@/features/events/components/single-event-meta';
import { AddParticipantDialog } from '@/features/participants/components/add-participant-dialog';
import ParticipantsTable from '@/features/participants/components/participants-table';

import { Button } from '@/components/ui/button';

import { env } from '@/env';
import { createClient } from '@/server/supabase/server';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventAdminPage({ params }: EventPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/`);
  }

  const { id } = await params;
  const { event } = await getEvent(id);
  if (!event) notFound();

  // Fuer "Teilnehmer hinzufuegen": die Kategorien des Events zur Auswahl.
  const categories = await getEventCategories(supabase, id);

  // Nur die Anzahl, fuer die Rueckfrage beim Loeschen. RLS zaehlt fuer
  // Nicht-Mitglieder null.
  const { count } = await supabase
    .from('event_participants')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id);

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="mb-4 flex flex-row items-center justify-between gap-4">
        <Button variant="default" className="max-w-fit" asChild>
          <Link className="px-12" href="/events">
            <CircleArrowLeft className="mr-2" />
            zu allen Events
          </Link>
        </Button>
        <div className="flex gap-2">
          <AddParticipantDialog
            eventId={event.id}
            categories={categories}
            categoryLabel={event.category_label || DEFAULT_CATEGORY_LABEL}
          />
          <EventAdminActions
            eventId={event.id}
            title={event.title}
            publicUrl={`${env.SITE_URL}/events/${event.id}`}
            participantCount={count ?? 0}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-12">
        <SingleEventMeta params={params} clientView={false} />
      </div>
      <div className="flex flex-row gap-4">
        <ParticipantsTable params={params} />
      </div>
    </section>
  );
}
