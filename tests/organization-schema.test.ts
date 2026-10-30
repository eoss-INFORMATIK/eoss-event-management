import { describe, expect, it } from 'vitest';

import {
  organizationFormSchema,
  organizationInputSchema,
} from '@/features/organizations/schema';

/** Ein gueltiges Formular ohne Kontaktangaben -- so sieht es nach EOS-20 aus. */
const empty = {
  name: 'HEV Wil',
  street: '',
  addressAddition: '',
  postalCode: '',
  city: '',
  contactEmail: '',
  phone: '',
};

describe('organizationFormSchema: Kontakt (TASK-55)', () => {
  it('alle Kontaktfelder leer ist gueltig', () => {
    expect(organizationFormSchema.safeParse(empty).success).toBe(true);
  });

  it('trimmt, und nur Leerzeichen gilt als leer', () => {
    const parsed = organizationFormSchema.parse({
      ...empty,
      street: '  Bahnhofstrasse 1 ',
      phone: '   ',
    });

    expect(parsed.street).toBe('Bahnhofstrasse 1');
    expect(parsed.phone).toBe('');
  });

  it('prueft die E-Mail nur, wenn eine eingetragen ist', () => {
    expect(
      organizationFormSchema.safeParse({ ...empty, contactEmail: 'kein-mail' })
        .success
    ).toBe(false);
    expect(
      organizationFormSchema.safeParse({
        ...empty,
        contactEmail: ' info@hev-wil.ch ',
      }).success
    ).toBe(true);
  });

  it('haelt die Spaltenlaengen ein', () => {
    expect(
      organizationFormSchema.safeParse({ ...empty, postalCode: '12345678901' })
        .success
    ).toBe(false);
  });
});

describe('organizationInputSchema: Logo (TASK-55)', () => {
  it('kein Logo ist gueltig', () => {
    expect(
      organizationInputSchema.safeParse({ ...empty, logoUrl: '' }).success
    ).toBe(true);
  });

  it('nimmt nur eine URL an', () => {
    expect(
      organizationInputSchema.safeParse({ ...empty, logoUrl: 'logo.png' })
        .success
    ).toBe(false);
    expect(
      organizationInputSchema.safeParse({
        ...empty,
        logoUrl:
          'https://example.supabase.co/storage/v1/object/public/event-images/a/logo.png',
      }).success
    ).toBe(true);
  });
});
