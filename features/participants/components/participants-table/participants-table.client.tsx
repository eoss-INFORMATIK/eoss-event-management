'use client';

import { type ParticipantRow, columns } from './columns';
import { DataTable } from './data-table';
import { ExportMenu } from './export-menu';

/**
 * Eigene Client-Datei, weil die Toolbar eine Funktion der Tabelle ist und eine
 * Funktion nicht aus der Server Component heraus uebergeben werden kann.
 */
export function ParticipantsTableClient({ data }: { data: ParticipantRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      toolbar={(table) => <ExportMenu table={table} />}
    />
  );
}
