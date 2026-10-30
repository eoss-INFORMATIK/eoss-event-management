import type { Column } from 'write-excel-file/browser';

import { statusLabel } from '@/features/participants/schema';

import type { EventParticipant } from '@/types';

/**
 * Teilnehmerexport als .xlsx, erzeugt im Browser aus den Zeilen der Tabelle.
 *
 * Im Browser und nicht auf dem Server, weil der Folgetask "gefilterter Export"
 * dann nur andere Zeilen uebergibt statt den Filterzustand an eine Route zu
 * schicken. Die Daten sind beim Laden der Tabelle bereits durch RLS gegangen.
 *
 * .xlsx und nicht .csv wegen Formel-Injection: Namen kommen aus dem
 * oeffentlichen Anmeldeformular. Jede Textzelle ist hier ausdruecklich
 * `type: String` -- ein Name wie `=HYPERLINK(...)` bleibt Text. Festgehalten in
 * `tests/participants-export.test.ts`.
 */

type ExportRow = Pick<
  EventParticipant,
  'name' | 'email' | 'status' | 'created_at'
> & { categoryLabel: string | null };

const TIME_ZONE = 'Europe/Zurich';

/**
 * Excel kennt keine Zeitzonen, und die Bibliothek schreibt die UTC-Zeit des
 * `Date`. Ohne diese Umrechnung stuende eine Anmeldung von 14:00 als 12:00 im
 * Export. Zurueck kommt ein `Date`, dessen UTC-Felder die Zuercher Ortszeit
 * tragen.
 */
export const toZurichWallClock = (value: string): Date => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(value))
      .map(({ type, value }) => [type, Number(value)])
  );

  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    )
  );
};

const header = (value: string) => ({ value, fontWeight: 'bold' as const });

export const participantExportColumns: Column<ExportRow>[] = [
  {
    // Vorne, weil immer gesetzt: eine leere erste Spalte laesst manche
    // Betrachter (die macOS-Vorschau) die Datei dort abschneiden. Gleiche
    // Reihenfolge wie in der Tabelle.
    header: header('E-Mail'),
    cell: (row) => ({ value: row.email, type: String }),
    width: 36,
  },
  {
    header: header('Name'),
    cell: (row) => ({ value: row.name ?? '', type: String }),
    width: 30,
  },
  {
    header: header('Status'),
    cell: (row) => ({ value: statusLabel(row.status), type: String }),
    width: 14,
  },
  {
    // Wie in der Tabelle: immer da, leer, wenn das Event keine Kategorien hat.
    header: header('Kategorie'),
    cell: (row) => ({ value: row.categoryLabel ?? '', type: String }),
    width: 20,
  },
  {
    header: header('Angemeldet am'),
    cell: (row) => ({
      value: toZurichWallClock(row.created_at),
      type: Date,
      format: 'dd.mm.yyyy hh:mm',
    }),
    width: 18,
  },
];

/**
 * `teilnehmer-sommerfest-2026-10-29.xlsx`, bei einer gefilterten Auswahl
 * `teilnehmer-sommerfest-auswahl-2026-10-29.xlsx` -- wer die Datei bekommt,
 * soll nicht annehmen, sie sei vollstaendig.
 */
export const participantExportFileName = (
  eventName: string | null,
  { filtered = false, today = new Date() } = {}
) => {
  const slug = (eventName ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const date = toZurichWallClock(today.toISOString())
    .toISOString()
    .slice(0, 10);

  return `${['teilnehmer', slug, filtered && 'auswahl', date].filter(Boolean).join('-')}.xlsx`;
};

/**
 * Laedt die Bibliothek erst beim Klick -- wer nie exportiert, laedt sie nie.
 */
export const downloadParticipantsXlsx = async (
  rows: ExportRow[],
  eventName: string | null,
  { filtered = false } = {}
) => {
  const { default: writeExcelFile } = await import('write-excel-file/browser');

  await writeExcelFile(rows, {
    columns: participantExportColumns,
    sheet: 'Teilnehmer',
    stickyRowsCount: 1,
  }).toFile(participantExportFileName(eventName, { filtered }));
};
