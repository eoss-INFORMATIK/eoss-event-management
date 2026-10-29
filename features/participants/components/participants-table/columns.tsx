'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import { deleteParticipant } from '@/features/participants/actions';

import type { EventParticipant as DbEventParticipant } from '@/types';

export type ParticipantRow = DbEventParticipant & {
  eventName: string | null;
  categoryLabel: string | null;
};

export const columns: ColumnDef<ParticipantRow>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'E-Mail',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    // Die Spalte bleibt stehen, auch wenn das Event keine Kategorien anbietet
    // -- dann ist sie schlicht leer. Eine Spalte je nach Event ein- und
    // auszublenden waere Zustand, den die Tabelle sonst nirgends braucht.
    accessorKey: 'categoryLabel',
    header: 'Kategorie',
  },
  {
    accessorKey: 'eventName',
    header: 'Event',
  },
  {
    header: 'Aktionen',
    id: 'actions',
    cell: ({ row }) => {
      const participant = row.original;
      return (
        <button
          onClick={async () => {
            const result = await deleteParticipant(
              participant.id,
              participant.event_id
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
