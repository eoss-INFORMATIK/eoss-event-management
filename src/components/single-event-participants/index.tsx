import { notFound } from 'next/navigation';

import { getEventParticipants } from '@/queries/eventParticipantsQueries';

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const SingleEventParticipants = async ({ params }: EventPageProps) => {
  const resolvedParams = await params;
  const { participants, error } = await getEventParticipants(resolvedParams.id);

  if (error) {
    notFound();
  }

  return (
    <div>
      <h1>Participants</h1>
      {!participants ? (
        <p>No participants found</p>
      ) : (
        participants.map((participant) => (
          <div key={participant.id}>
            <p>{participant.name}</p>
          </div>
        ))
      )}
    </div>
  );
};
