'use client';

import { useState } from 'react';

import { type ColumnFiltersState, useReactTable } from '@tanstack/react-table';
import { Search } from 'lucide-react';

import {
  PARTICIPANT_STATUSES,
  statusLabel,
} from '@/features/participants/schema';
import { participantTableOptions } from '@/features/participants/table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { type ParticipantRow, columns } from './columns';
import { DataTable } from './data-table';
import { ExportButton } from './export-button';
import { FacetFilter } from './facet-filter';
import { Pagination } from './pagination';

const byStatusOrder = (a: string | null, b: string | null) =>
  PARTICIPANT_STATUSES.indexOf(a as never) -
  PARTICIPANT_STATUSES.indexOf(b as never);

/**
 * Besitzt den Zustand der Tabelle, weil Filter, Pagination und Export ihn
 * teilen. Die Filter leben nur in diesem Zustand, nicht in der URL -- nach
 * einem Neuladen ist die Liste wieder vollstaendig.
 */
export function ParticipantsTableClient({ data }: { data: ParticipantRow[] }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    ...participantTableOptions,
    data,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
  });

  const search = (table.getColumn('email')?.getFilterValue() as string) ?? '';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            aria-label="E-Mail oder Name suchen"
            placeholder="E-Mail oder Name suchen"
            className="pl-9"
            value={search}
            onChange={(event) =>
              table.getColumn('email')?.setFilterValue(event.target.value)
            }
          />
        </div>
        <FacetFilter
          column={table.getColumn('status')!}
          title="Status"
          label={(value) => statusLabel(value ?? '')}
          order={byStatusOrder}
        />
        <FacetFilter
          column={table.getColumn('categoryLabel')!}
          title="Kategorie"
          label={(value) => value ?? 'Ohne Kategorie'}
        />
        {columnFilters.length > 0 && (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()}>
            Filter zurücksetzen
          </Button>
        )}
        <div className="ml-auto">
          <ExportButton table={table} />
        </div>
      </div>

      <DataTable
        table={table}
        empty={
          columnFilters.length > 0
            ? 'Keine Teilnehmer für diese Filter.'
            : 'Noch keine Anmeldungen.'
        }
      />

      <Pagination table={table} />
    </div>
  );
}
