import { describe, expect, it } from 'vitest';

import { eventFormSchema, eventInputSchema } from '@/features/events/schema';

/**
 * Der Sponsorblock hat eine Regel, die kein Feldtyp ausdrueckt: eingeschaltet
 * heisst Name erforderlich.
 *
 * Warum es diesen Test gibt: beim Bauen stand die Regel zuerst nur auf
 * `eventFormSchema`. `eventInputSchema` wurde aus der Feldliste neu
 * zusammengesetzt und verlor sie dabei -- die Pruefung lief also nur im
 * Browser, und genau das ist keine Pruefung. Der Fehler war unsichtbar:
 * Typecheck, Lint und Build waren gruen.
 *
 * Diese Tests brauchen keine Datenbank. Sie halten eine Regel fest, nicht eine
 * Policy.
 */

const gueltigeBasis = {
  title: 'Sommerfest',
  date: new Date('2027-07-01'),
};

describe('eventFormSchema: Sponsor eingeschaltet verlangt einen Namen', () => {
  it('lehnt eingeschaltet ohne Namen ab', () => {
    const result = eventFormSchema.safeParse({
      ...gueltigeBasis,
      sponsorEnabled: true,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['sponsorName']);
  });

  it('nimmt eingeschaltet mit Namen an', () => {
    const result = eventFormSchema.safeParse({
      ...gueltigeBasis,
      sponsorEnabled: true,
      sponsorName: 'Kulturhaus Helferei',
    });

    expect(result.success).toBe(true);
  });

  it('nimmt ausgeschaltet ohne Namen an', () => {
    const result = eventFormSchema.safeParse({
      ...gueltigeBasis,
      sponsorEnabled: false,
    });

    expect(result.success).toBe(true);
  });
});

describe('eventInputSchema: dieselbe Regel, serverseitig', () => {
  it('lehnt eingeschaltet ohne Namen ab', () => {
    const result = eventInputSchema.safeParse({
      ...gueltigeBasis,
      sponsorEnabled: true,
      imageUrl: '',
      sponsorImageUrl: '',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['sponsorName']);
  });

  it('nimmt eingeschaltet mit Namen an', () => {
    const result = eventInputSchema.safeParse({
      ...gueltigeBasis,
      sponsorEnabled: true,
      sponsorName: 'Kulturhaus Helferei',
      imageUrl: '',
      sponsorImageUrl: '',
    });

    expect(result.success).toBe(true);
  });
});
