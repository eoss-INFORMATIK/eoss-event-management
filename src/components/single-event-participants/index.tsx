import { notFound } from 'next/navigation';

import {
  Table,
  TableBody,
  TableCaption,
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
    <Table>
      <TableCaption>Eine Liste mit allen Teilnehmern zum Event</TableCaption>
      <TableHeader>
        <TableRow key="header">
          <TableHead className="w-full">Name</TableHead>
          <TableHead className="w-full">E-Mail</TableHead>
          <TableHead className="w-full">Status</TableHead>
          <TableHead className="w-full text-right">Registriert am</TableHead>
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
  );
};
