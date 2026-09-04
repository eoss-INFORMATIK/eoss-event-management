import { getEventParticipants } from '@/features/participants/queries';

import { columns } from './columns';
import { DataTable } from './data-table';

interface EventParticipantsTableProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventParticipantsTable({
  params,
}: EventParticipantsTableProps) {
  const resolvedParams = await params;
  const { participants } = await getEventParticipants(resolvedParams.id);

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={participants ?? []} />
    </div>
  );
}
