import {
  type FilterFn,
  type Table,
  type TableOptions,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';

import type { EventParticipant } from '@/types';

/**
 * Filter, Pagination und Export der Teilnehmertabelle -- ohne JSX, damit
 * `tests/participants-filter.test.ts` dieselbe Konfiguration benutzt wie die
 * Seite.
 *
 * Alles laeuft im Browser auf den bereits geladenen Zeilen. Die Liste eines
 * Events ist klein genug, und der Export nimmt dieselben Zeilen, die die
 * Tabelle zeigt -- ein serverseitiger Filter muesste beides zweimal bauen.
 */

export type ParticipantRow = EventParticipant & {
  eventName: string | null;
  categoryLabel: string | null;
};

export const PAGE_SIZE = 50;

/**
 * Textsuche auf Name **und** E-Mail. Der Name ist bei der Anmeldung optional;
 * wer ohne Namen angemeldet ist, waere sonst unauffindbar.
 *
 * Haengt an der Spalte `email`, nicht am globalen Filter: der globale Filter
 * laeuft ueber jede Spalte und braeuchte eine Ausnahmeliste.
 */
export const searchParticipant: FilterFn<ParticipantRow> = (
  row,
  _columnId,
  query: string
) => {
  const needle = query.trim().toLowerCase();
  const { name, email } = row.original;
  return (
    (name ?? '').toLowerCase().includes(needle) ||
    email.toLowerCase().includes(needle)
  );
};
searchParticipant.autoRemove = (query?: string) => !query?.trim();

/**
 * Mehrfachauswahl: die Zeile bleibt, wenn ihr Wert unter den gewaehlten ist.
 * `null` ist ein gueltiger Wert -- "Ohne Kategorie".
 */
export const inSelection: FilterFn<ParticipantRow> = (
  row,
  columnId,
  selected: (string | null)[]
) => selected.includes(row.getValue<string | null>(columnId));
inSelection.autoRemove = (selected?: unknown[]) => !selected?.length;

export const participantTableOptions = {
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  // Die Optionen in den Filtern kommen aus den Anmeldungen, mit Anzahl. Der
  // facettierte Stand einer Spalte beruecksichtigt die uebrigen Filter, nicht
  // den eigenen -- die Zahlen zeigen also, was ein Klick ergeben wuerde.
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: { pagination: { pageIndex: 0, pageSize: PAGE_SIZE } },
} satisfies Partial<TableOptions<ParticipantRow>>;

/**
 * Was der Export schreibt: die ganze gefilterte Auswahl, nicht die angezeigte
 * Seite. `getRowModel()` waere hier falsch -- es ist nach der Pagination.
 */
export const selectedRows = (table: Table<ParticipantRow>) =>
  table.getFilteredRowModel().rows.map((row) => row.original);
