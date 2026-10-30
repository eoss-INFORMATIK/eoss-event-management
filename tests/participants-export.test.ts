import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import writeExcelFile from 'write-excel-file/node';

import {
  participantExportColumns,
  participantExportFileName,
  toZurichWallClock,
} from '@/features/participants/export';

/**
 * Der Teilnehmerexport schreibt Daten aus dem oeffentlichen Anmeldeformular in
 * eine Datei, die jemand in Excel oeffnet. Ein Name wie `=1+1` darf dort nicht
 * als Formel ankommen -- bei einer CSV waere er eine.
 *
 * Geprueft wird die echte Datei: erzeugt mit denselben Spalten wie im Browser
 * (nur der Node-Build der Bibliothek), entpackt, und das Sheet-XML gelesen.
 * Eine Formelzelle ist dort ein `<f>`-Element.
 *
 * Diese Tests brauchen keine Datenbank.
 */

const participant = (name: string | null) => ({
  name,
  email: 'a@example.ch',
  status: 'confirmed',
  categoryLabel: 'Mitglied',
  created_at: '2026-07-01T12:00:00+00:00',
});

const sheetXml = async (rows: ReturnType<typeof participant>[]) => {
  const buffer = await writeExcelFile(rows, {
    columns: participantExportColumns,
  }).toBuffer();
  const files = unzipSync(new Uint8Array(buffer));
  return {
    sheet: strFromU8(files['xl/worksheets/sheet1.xml']),
    strings: strFromU8(files['xl/sharedStrings.xml'] ?? new Uint8Array()),
  };
};

describe('Teilnehmerexport', () => {
  it('schreibt einen Namen, der wie eine Formel aussieht, als Text', async () => {
    const { sheet, strings } = await sheetXml([
      participant('=1+1'),
      participant('=HYPERLINK("http://example.com","x")'),
      participant('@SUM(A1)'),
    ]);

    expect(sheet).not.toContain('<f>');
    expect(strings).toContain('=1+1');
  });

  it('beginnt jede Zeile mit einer Zelle, auch ohne Namen', async () => {
    // Die macOS-Vorschau hoert an der ersten Zeile mit leerer erster Spalte
    // auf zu lesen -- die Datei war vollstaendig, die Vorschau zeigte drei
    // von fuenfzehn. Die E-Mail ist immer gesetzt und steht deshalb vorne.
    const { sheet } = await sheetXml([
      participant('Anna'),
      participant(null),
      participant('Ben'),
    ]);
    const rows = sheet.match(/<row [^>]*>.*?<\/row>/g) ?? [];
    expect(rows).toHaveLength(4);
    rows.forEach((row, i) => expect(row).toContain(`r="A${i + 1}"`));
  });

  it('schreibt den Status deutsch', async () => {
    const { strings } = await sheetXml([participant('Anna')]);
    expect(strings).toContain('Bestätigt');
  });

  it('schreibt die Kategorie', async () => {
    const { strings } = await sheetXml([participant('Anna')]);
    expect(strings).toContain('Kategorie');
    expect(strings).toContain('Mitglied');
  });
});

describe('toZurichWallClock', () => {
  it('rechnet im Sommer zwei Stunden auf', () => {
    expect(toZurichWallClock('2026-07-01T12:00:00Z').toISOString()).toBe(
      '2026-07-01T14:00:00.000Z'
    );
  });

  it('rechnet im Winter eine Stunde auf', () => {
    expect(toZurichWallClock('2026-01-15T12:00:00Z').toISOString()).toBe(
      '2026-01-15T13:00:00.000Z'
    );
  });
});

describe('participantExportFileName', () => {
  it('macht aus dem Eventtitel einen Dateinamen', () => {
    expect(
      participantExportFileName('Sommerfest Zürich / 2027', {
        today: new Date('2026-10-29T10:00:00Z'),
      })
    ).toBe('teilnehmer-sommerfest-zurich-2027-2026-10-29.xlsx');
  });

  it('markiert eine gefilterte Auswahl', () => {
    expect(
      participantExportFileName('Sommerfest', {
        filtered: true,
        today: new Date('2026-10-29T10:00:00Z'),
      })
    ).toBe('teilnehmer-sommerfest-auswahl-2026-10-29.xlsx');
  });

  it('kommt ohne Eventtitel aus', () => {
    expect(
      participantExportFileName(null, {
        today: new Date('2026-10-29T10:00:00Z'),
      })
    ).toBe('teilnehmer-2026-10-29.xlsx');
  });
});
