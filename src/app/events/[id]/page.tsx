import { SingleEventMeta } from '@/components/single-event-meta';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  return (
    <>
      <SingleEventMeta params={params} />;
    </>
  );
}
