'use client';

import { useState } from 'react';

import type { Table } from '@tanstack/react-table';
import { ChevronDown, Download } from 'lucide-react';
import { toast } from 'sonner';

import { downloadParticipantsXlsx } from '@/features/participants/export';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { ParticipantRow } from './columns';

/**
 * Bekommt die Tabelle, nicht die Daten: der gefilterte Export (Folgetask) wird
 * ein zweiter Eintrag mit `table.getFilteredRowModel()`.
 */
export function ExportMenu({ table }: { table: Table<ParticipantRow> }) {
  const [busy, setBusy] = useState(false);
  const rows = table.getCoreRowModel().rows.map((row) => row.original);

  const exportAll = async () => {
    setBusy(true);
    try {
      await downloadParticipantsXlsx(rows, rows[0]?.eventName ?? null);
    } catch {
      toast.error('Export fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={busy || rows.length === 0}>
          <Download />
          Exportieren
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={exportAll}>
          Alle Teilnehmer als Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
