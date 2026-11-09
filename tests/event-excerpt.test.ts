import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { eventExcerpt } from '@/features/events/excerpt';
import { EXCERPT_LENGTH, eventInputSchema } from '@/features/events/schema';

import {
  type TestAccount,
  cleanup,
  createEvent,
  createTestAccount,
} from './helpers';

/**
 * Kurztext der Event-Karte (TASK-53, Scheibe 2): selbst geschrieben, sonst der
 * Anfang der Beschreibung. Die Grenze von 160 Zeichen steht an zwei Stellen --
 * im Schema fuer eine lesbare Meldung, in der Spalte (varchar(160)) als
 * eigentliche Grenze. Beide sind hier festgehalten.
 */

const lang = 'Wort '.repeat(60).trim();

describe('eventExcerpt', () => {
  it('nimmt den selbst geschriebenen Kurztext', () => {
    expect(
      eventExcerpt({ excerpt: 'Kurz und gut', description: '## Lang' })
    ).toBe('Kurz und gut');
  });

  it('faellt ohne Kurztext auf die Beschreibung als Klartext zurueck', () => {
    expect(
      eventExcerpt({ excerpt: '  ', description: '## Ablauf\n\n- **Apéro**' })
    ).toBe('Ablauf Apéro');
  });

  it('kuerzt eine lange Beschreibung an einer Wortgrenze', () => {
    const out = eventExcerpt({ excerpt: null, description: lang });

    expect(out.length).toBeLessThanOrEqual(EXCERPT_LENGTH);
    expect(out).toMatch(/ Wort…$/);
  });

  it('schneidet ein einziges ueberlanges Wort hart', () => {
    const out = eventExcerpt({ excerpt: null, description: 'x'.repeat(300) });

    expect(out).toBe(`${'x'.repeat(EXCERPT_LENGTH - 1)}…`);
  });

  it('ist leer ohne Kurztext und Beschreibung', () => {
    expect(eventExcerpt({ excerpt: null, description: null })).toBe('');
  });
});

describe('Kurztext: hoechstens 160 Zeichen', () => {
  const basis = {
    title: 'Sommerfest',
    date: new Date('2027-07-01'),
    sponsorEnabled: false,
    categoriesEnabled: false,
    categoryRequired: false,
    categories: [],
  };

  it('Schema: 160 geht, 161 nicht', () => {
    const ok = eventInputSchema.safeParse({
      ...basis,
      excerpt: 'x'.repeat(160),
    });
    const zuLang = eventInputSchema.safeParse({
      ...basis,
      excerpt: 'x'.repeat(161),
    });

    expect(ok.success).toBe(true);
    expect(zuLang.success).toBe(false);
  });

  describe('Datenbank, am Formular vorbei', () => {
    let account: TestAccount;
    let eventId: string;

    beforeAll(async () => {
      account = await createTestAccount('excerpt');
      eventId = await createEvent(account, 'Kurztext');
    });

    afterAll(async () => {
      await cleanup([account]);
    });

    it('nimmt 160 Zeichen an', async () => {
      const { error } = await account.client
        .from('events')
        .update({ excerpt: 'x'.repeat(160) })
        .eq('id', eventId);

      expect(error).toBeNull();
    });

    it('lehnt 161 Zeichen ab', async () => {
      const { error } = await account.client
        .from('events')
        .update({ excerpt: 'x'.repeat(161) })
        .eq('id', eventId);

      // 22001: string_data_right_truncation
      expect(error?.code).toBe('22001');
    });
  });
});
