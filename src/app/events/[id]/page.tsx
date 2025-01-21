import { SingleEventMeta } from '@/components/single-event-meta';
import { SingleEventRegistration } from '@/components/single-event-registration.tsx';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  return (
    <section className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-2 gap-12">
        <SingleEventMeta params={params} clientView={true} />
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Anmeldung</h2>
          <SingleEventRegistration params={params} />
        </div>
      </div>
    </section>
  );
}
