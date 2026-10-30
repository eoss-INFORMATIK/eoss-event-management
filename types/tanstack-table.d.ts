import type { RowData } from '@tanstack/react-table';

/**
 * Spaltenbezogene Darstellung, die `DataTable` auf Kopf- und Datenzelle
 * anwendet -- etwa eine feste Breite oder erlaubter Zeilenumbruch.
 */
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}
