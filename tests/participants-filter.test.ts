import {
  type ColumnDef,
  type ColumnFiltersState,
  createTable,
} from '@tanstack/react-table';
import { describe, expect, it } from 'vitest';

import {
  PAGE_SIZE,
  type ParticipantRow,
  inSelection,
  participantTableOptions,
  searchParticipant,
  selectedRows,
} from '@/features/participants/table';

/**
 * Die Behauptung dieses Tasks: der Export enthaelt genau die gefilterte
 * Auswahl -- ueber Seitengrenzen hinweg, nicht nur die angezeigte Seite.
 *
 * Gebaut mit derselben Konfiguration wie die Seite (`participantTableOptions`)
 * und denselben Filterfunktionen. Die Spalten sind hier nachgebildet, weil
 * `columns.tsx` die Server Actions importiert.
 *
 * Diese Tests brauchen keine Datenbank.
 */

const columns: ColumnDef<ParticipantRow>[] = [
  { accessorKey: 'email', filterFn: searchParticipant },
  { accessorKey: 'name' },
  { accessorKey: 'status', filterFn: inSelection },
  { accessorKey: 'categoryLabel', filterFn: inSelection },
];

const participant = (
  i: number,
  overrides: Partial<ParticipantRow> = {}
): ParticipantRow => ({
  id: `id-${i}`,
  event_id: 'event',
  organization_id: 'org',
  category_id: null,
  name: `Person ${i}`,
  email: `person${i}@example.ch`,
  status: 'registered',
  created_at: '2026-10-29T10:00:00Z',
  updated_at: '2026-10-29T10:00:00Z',
  eventName: 'Sommerfest',
  categoryLabel: null,
  ...overrides,
});

const tableWith = (
  data: ParticipantRow[],
  columnFilters: ColumnFiltersState
) => {
  const table = createTable<ParticipantRow>({
    ...participantTableOptions,
    data,
    columns,
    state: {},
    onStateChange: () => {},
    renderFallbackValue: null,
  });
  table.setOptions((prev) => ({
    ...prev,
    state: { ...table.initialState, columnFilters },
  }));
  return table;
};

describe('Export der gefilterten Auswahl', () => {
  it('nimmt alle Treffer, nicht nur die angezeigte Seite', () => {
    const data = Array.from({ length: 130 }, (_, i) =>
      participant(i, { status: i % 2 ? 'attended' : 'registered' })
    );
    const table = tableWith(data, [{ id: 'status', value: ['attended'] }]);

    expect(table.getRowModel().rows).toHaveLength(PAGE_SIZE);
    expect(selectedRows(table)).toHaveLength(65);
    expect(selectedRows(table).every((p) => p.status === 'attended')).toBe(
      true
    );
  });

  it('nimmt ohne Filter alle', () => {
    const table = tableWith(
      Array.from({ length: 70 }, (_, i) => participant(i)),
      []
    );
    expect(selectedRows(table)).toHaveLength(70);
  });
});

describe('Filter', () => {
  const data = [
    participant(1, { name: 'Anna Müller', categoryLabel: 'Mitglied' }),
    participant(2, { name: null, email: 'ohne.name@example.ch' }),
    participant(3, { name: 'Ben', categoryLabel: 'Gast', status: 'attended' }),
  ];

  it('sucht im Namen, ohne Gross-/Kleinschreibung', () => {
    const table = tableWith(data, [{ id: 'email', value: 'müll' }]);
    expect(selectedRows(table).map((p) => p.id)).toEqual(['id-1']);
  });

  it('findet Teilnehmer ohne Namen über die E-Mail', () => {
    const table = tableWith(data, [{ id: 'email', value: 'ohne.name' }]);
    expect(selectedRows(table).map((p) => p.id)).toEqual(['id-2']);
  });

  it('filtert nach mehreren Kategorien, inklusive "Ohne Kategorie"', () => {
    const table = tableWith(data, [
      { id: 'categoryLabel', value: ['Gast', null] },
    ]);
    expect(selectedRows(table).map((p) => p.id)).toEqual(['id-2', 'id-3']);
  });

  it('verknüpft verschiedene Filter mit UND', () => {
    const table = tableWith(data, [
      { id: 'categoryLabel', value: ['Gast', 'Mitglied'] },
      { id: 'status', value: ['attended'] },
    ]);
    expect(selectedRows(table).map((p) => p.id)).toEqual(['id-3']);
  });

  it('zählt Optionen unter Berücksichtigung der anderen Filter', () => {
    const table = tableWith(data, [{ id: 'status', value: ['registered'] }]);
    const counts = table.getColumn('categoryLabel')!.getFacetedUniqueValues();
    expect(counts.get('Mitglied')).toBe(1);
    expect(counts.get(null)).toBe(1);
    expect(counts.has('Gast')).toBe(false);
  });
});
