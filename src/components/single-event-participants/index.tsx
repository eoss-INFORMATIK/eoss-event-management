import { notFound } from 'next/navigation';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getEventParticipants } from '@/queries/event-participants-queries';

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
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Teilnehmer</h2>
      <Table></Table>
      <Table>
        <TableHeader>
          <TableRow key="header">
            <TableHead>Name</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Registriert am</TableHead>
          </TableRow>
        </TableHeader>
        {!participants ? (
          <p>No participants found</p>
        ) : (
          <TableBody>
            {participants.map((participant) => {
              return (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">
                    {participant.name}
                  </TableCell>
                  <TableCell>{participant.email}</TableCell>
                  <TableCell>{participant.status}</TableCell>
                  <TableCell className="text-right">
                    {participant.createdAt.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>
    </section>
  );
};
