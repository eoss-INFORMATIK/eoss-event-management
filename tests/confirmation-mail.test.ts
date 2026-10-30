import { createElement } from 'react';

import { render } from '@react-email/render';
import { describe, expect, it } from 'vitest';

import {
  ConfirmationMail,
  type ConfirmationMailProps,
  confirmationSubject,
} from '@/features/email/confirmation-template';

/**
 * Inhalt der Bestaetigungsmail (TASK-51): Betreff, Anmeldedaten als Liste,
 * Organisation. Gerendert wie beim Versand (`@react-email/render`, das auch
 * Resend benutzt), geprueft wird der Text, nicht das Markup.
 *
 * Diese Tests brauchen keine Datenbank.
 */

const props: ConfirmationMailProps = {
  eventTitle: 'Sommerfest 2027',
  eventDate: '01.07.2027',
  name: 'Anna Müller',
  email: 'anna@example.ch',
  category: { label: 'Teilnahme als', value: 'mit Begleitung' },
  organizationName: 'HEV Wil und Umgebung',
};

const plain = (overrides: Partial<ConfirmationMailProps> = {}) =>
  render(createElement(ConfirmationMail, { ...props, ...overrides }), {
    plainText: true,
  });

describe('Bestätigungsmail', () => {
  it('Betreff ist "Anmeldung <Event>"', () => {
    expect(confirmationSubject('Sommerfest 2027')).toBe(
      'Anmeldung Sommerfest 2027'
    );
  });

  it('nennt den Anlass, die Anmeldedaten und die Organisation', async () => {
    const text = await plain();
    expect(text).toContain('Sommerfest 2027');
    expect(text).toContain('01.07.2027');
    expect(text).toContain('Anna Müller');
    expect(text).toContain('anna@example.ch');
    expect(text).toContain('Teilnahme als');
    expect(text).toContain('mit Begleitung');
    expect(text).toContain('HEV Wil und Umgebung');
  });

  it('lässt Name und Kategorie weg, wenn sie fehlen', async () => {
    const text = await plain({ name: null, category: null });
    expect(text).not.toContain('Name');
    expect(text).not.toContain('Teilnahme als');
  });

  it('schreibt einen Namen mit HTML als Text, nicht als Markup', async () => {
    // Der Name kommt aus dem oeffentlichen Formular.
    const html = await render(
      createElement(ConfirmationMail, { ...props, name: '<b>x</b>' })
    );
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
