import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CircleArrowLeft } from 'lucide-react';

import { SingleEventMeta } from '@/components/single-event-meta';
import { SingleEventParticipants } from '@/components/single-event-participants';
import { Button } from '@/components/ui/button';

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
    <section className="flex w-full flex-col gap-4">
      <div className="flex flex-row gap-4">
        <Button variant="default" className="mb-4 max-w-fit" asChild>
          <Link className="px-12" href="/events">
            <CircleArrowLeft className="mr-2" />
            zu allen Events
          </Link>
        </Button>
        <div></div>
      </div>
      <div className="grid grid-cols-2 gap-12">
        <SingleEventMeta params={params} clientView={false} />
        <SingleEventParticipants params={params} />
      </div>
    </section>
  );
}
