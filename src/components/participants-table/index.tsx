import { getEventParticipants } from '@/queries/event-participants-queries';

import { EventParticipant, columns } from './columns';
import { DataTable } from './data-table';

export type EventParticipantResponse = {
  participants: EventParticipant[];
  error?: string;
};

interface EventParticipantsTableProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventParticipantsTable({
  params,
}: EventParticipantsTableProps) {
  const resolvedParams = await params;

  const response = (await getEventParticipants(
    resolvedParams.id
  )) as EventParticipantResponse;
  const data = response.participants;

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
