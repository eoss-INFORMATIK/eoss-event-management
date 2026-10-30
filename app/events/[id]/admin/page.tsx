import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { CircleArrowLeft } from 'lucide-react';

import { getEvent } from '@/features/events/actions';
import { EventAdminActions } from '@/features/events/components/event-admin-actions';
import { SingleEventMeta } from '@/features/events/components/single-event-meta';
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
        <EventAdminActions
          eventId={event.id}
          title={event.title}
          publicUrl={`${env.SITE_URL}/events/${event.id}`}
          participantCount={count ?? 0}
        />
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
