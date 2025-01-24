'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import { deleteEventParticipantAction } from '@/server/event-participant-actions';

export type EventParticipant = {
  id: string;
  eventId: string;
  name: string | null;
  email: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  eventName: string;
};

export const columns: ColumnDef<EventParticipant>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'eventName',
    header: 'Event Name',
  },
  {
    header: 'Aktionen',
    id: 'actions',
    cell: ({ row }) => {
      const participant = row.original;
      return (
        <button
          onClick={async () => {
            const result = await deleteEventParticipantAction(
              participant.id,
              participant.eventId
            );
            if (result.success) {
              toast.success('Teilnehmer erfolgreich gelöscht');
            } else {
              toast.error('Fehler beim Löschen des Teilnehmers');
            }
          }}
        >
          <MoreHorizontal />
        </button>
      );
    },
  },
];
