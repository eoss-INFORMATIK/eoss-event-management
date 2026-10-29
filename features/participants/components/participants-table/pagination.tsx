'use client';

import type { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

/** Erscheint erst, wenn die Auswahl mehr als eine Seite fuellt. */
export function Pagination<TData>({ table }: { table: Table<TData> }) {
  if (table.getPageCount() <= 1) return null;

  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const from = pageIndex * pageSize + 1;
  const to = Math.min(from + pageSize - 1, total);

  return (
    <div className="flex items-center justify-end gap-4">
      <span className="text-muted-foreground text-sm tabular-nums">
        {from}–{to} von {total}
      </span>
      <Button
        variant="outline"
        size="icon"
        aria-label="Vorherige Seite"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Nächste Seite"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
