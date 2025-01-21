import { redirect } from 'next/navigation';

import { SingleEventMeta } from '@/components/single-event-meta';
import { SingleEventParticipants } from '@/components/single-event-participants';

import { auth } from '@/config/auth';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventAdminPage({ params }: EventPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/events/${params}`);
  }

  return (
    <section className="flex flex-col gap-4">
      <SingleEventMeta params={params} />
      <div className="flex flex-row gap-4">
        <SingleEventParticipants params={params} />
      </div>
    </section>
  );
}
