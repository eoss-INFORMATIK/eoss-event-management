'use client';

import type { Column } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Value = string | null;

interface FacetFilterProps<TData> {
  column: Column<TData, unknown>;
  title: string;
  /** Anzeige eines Werts; `null` ist "ohne". */
  label: (value: Value) => string;
  /** Reihenfolge der Optionen. Ohne: alphabetisch, `null` zuletzt. */
  order?: (a: Value, b: Value) => number;
}

const alphabetical = (a: Value, b: Value) =>
  a === null ? 1 : b === null ? -1 : a.localeCompare(b, 'de-CH');

/**
 * Mehrfachauswahl ueber die Werte, die in den Anmeldungen tatsaechlich
 * vorkommen, jeweils mit Anzahl. Die Optionen stammen aus
 * `getFacetedUniqueValues()` -- eine Kategorie ohne Anmeldung erscheint nicht,
 * weil sie nichts finden wuerde.
 */
export function FacetFilter<TData>({
  column,
  title,
  label,
  order = alphabetical,
}: FacetFilterProps<TData>) {
  const counts = column.getFacetedUniqueValues() as Map<Value, number>;
  const selected = (column.getFilterValue() as Value[] | undefined) ?? [];
  // Gewaehlte Werte bleiben sichtbar, auch wenn ein anderer Filter ihre Anzahl
  // auf null drueckt -- sonst liesse sich die Auswahl nicht mehr aufheben.
  const options = [...new Set<Value>([...counts.keys(), ...selected])].sort(
    order
  );

  const toggle = (value: Value, checked: boolean) => {
    const next = checked
      ? [...selected, value]
      : selected.filter((v) => v !== value);
    column.setFilterValue(next.length ? next : undefined);
  };

  if (options.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {title}
          {selected.length > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full px-2 text-xs">
              {selected.length}
            </span>
          )}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((value) => (
          <DropdownMenuCheckboxItem
            key={value ?? '__none__'}
            checked={selected.includes(value)}
            onCheckedChange={(checked) => toggle(value, checked)}
            // Offen lassen: Mehrfachauswahl heisst mehrere Klicks.
            onSelect={(event) => event.preventDefault()}
          >
            <span className="flex-1">{label(value)}</span>
            <span className="text-muted-foreground ml-4 tabular-nums">
              {counts.get(value) ?? 0}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => column.setFilterValue(undefined)}>
              Auswahl aufheben
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
