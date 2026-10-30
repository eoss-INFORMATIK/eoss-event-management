'use client';

import { ColumnDef } from '@tanstack/react-table';

import { statusLabel } from '@/features/participants/schema';
import {
  type ParticipantRow,
  inSelection,
  searchParticipant,
} from '@/features/participants/table';

import { RowActions } from './row-actions';

export type { ParticipantRow };

export const columns: ColumnDef<ParticipantRow>[] = [
  {
    // Die E-Mail steht vorne: sie identifiziert die Anmeldung und ist immer
    // gesetzt, der Name ist optional. Gleiche Reihenfolge wie im Export.
    accessorKey: 'email',
    header: 'E-Mail',
    // Die Textsuche haengt hier und prueft E-Mail und Name.
    filterFn: searchParticipant,
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => statusLabel(row.original.status),
    filterFn: inSelection,
  },
  {
    // Die Spalte bleibt stehen, auch wenn das Event keine Kategorien anbietet
    // -- dann ist sie schlicht leer. Eine Spalte je nach Event ein- und
    // auszublenden waere Zustand, den die Tabelle sonst nirgends braucht.
    accessorKey: 'categoryLabel',
    header: 'Kategorie',
    filterFn: inSelection,
  },
  {
    accessorKey: 'eventName',
    header: 'Event',
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Aktionen</span>,
    cell: ({ row }) => <RowActions participant={row.original} />,
  },
];
