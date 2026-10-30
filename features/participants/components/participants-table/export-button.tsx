'use client';

import { useState } from 'react';

import type { Table } from '@tanstack/react-table';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { downloadParticipantsXlsx } from '@/features/participants/export';
import {
  type ParticipantRow,
  selectedRows,
} from '@/features/participants/table';

import { Button } from '@/components/ui/button';

/**
 * Exportiert immer die aktuelle Auswahl -- ohne Filter sind das alle. Die Zahl
 * auf dem Button ist dieselbe Liste, die geschrieben wird (`selectedRows`),
 * nicht die angezeigte Seite.
 */
export function ExportButton({ table }: { table: Table<ParticipantRow> }) {
  const [busy, setBusy] = useState(false);
  const rows = selectedRows(table);
  const filtered = table.getState().columnFilters.length > 0;

  const exportRows = async () => {
    setBusy(true);
    try {
      await downloadParticipantsXlsx(rows, rows[0]?.eventName ?? null, {
        filtered,
      });
    } catch {
      toast.error('Export fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={exportRows}
      disabled={busy || rows.length === 0}
    >
      <Download />
      {rows.length} Teilnehmer exportieren
    </Button>
  );
}
