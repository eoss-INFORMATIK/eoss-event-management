import Link from 'next/link';

import { CircleArrowLeft } from 'lucide-react';

import { SingleEventMeta } from '@/components/single-event-meta';
import { SingleEventRegistration } from '@/components/single-event-registration.tsx';
import { Button } from '@/components/ui/button';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  return (
    <section className="flex w-full flex-col gap-4">
      <Button variant="default" className="mb-4 max-w-fit" asChild>
        <Link className="px-12" href="/events">
          <CircleArrowLeft className="mr-2" />
          zu allen Events
        </Link>
      </Button>
      <div className="grid grid-cols-2 gap-12">
        <SingleEventMeta params={params} />
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Anmeldung</h2>
          <SingleEventRegistration params={params} />
        </div>
      </div>
    </section>
  );
}
