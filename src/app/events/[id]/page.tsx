import { SingleEventMeta } from '@/components/single-event-meta';
import { SingleEventParticipants } from '@/components/single-event-participants';
import { SingleEventRegistration } from '@/components/single-event-registration.tsx';

import { auth } from '@/config/auth';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const session = await auth();

  return (
    <section className="flex flex-col gap-4">
      <SingleEventMeta params={params} />
      <div className="flex flex-row gap-4">
        <SingleEventRegistration params={params} />
        {session?.user && <SingleEventParticipants params={params} />}
      </div>
    </section>
  );
}
