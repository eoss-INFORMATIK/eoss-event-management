import { createElement } from 'react';

import { render } from '@react-email/render';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import {
  ConfirmationMail,
  type ConfirmationMailProps,
  confirmationSubject,
} from '@/features/email/confirmation-template';
import {
  TICKET_CID,
  ticketAttachments,
} from '@/features/email/ticket-attachments';

import { newTicketCode, ticketUrl } from '@/lib/ticket';

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
  qrImageSrc: 'cid:ticket-qr',
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

describe('QR-Ticket in der Mail', () => {
  it('bindet den QR-Code über cid: ein und sagt, dass er beiliegt', async () => {
    const html = await render(createElement(ConfirmationMail, props));
    expect(html).toContain(`src="cid:${TICKET_CID}"`);
    expect(await plain()).toContain('auch als Anhang');
  });

  it('hängt denselben PNG inline und als Anhang an, mit der Ticket-URL', async () => {
    const url = ticketUrl('https://events.eoss.ch', newTicketCode());
    const [inline, file] = await ticketAttachments(url);

    expect(inline.contentId).toBe(TICKET_CID);
    expect(file).not.toHaveProperty('contentId');
    expect(file.filename).toBe('ticket.png');

    const png = PNG.sync.read(file.content);
    const decoded = jsQR(
      new Uint8ClampedArray(png.data),
      png.width,
      png.height
    );
    expect(decoded?.data).toBe(url);
  });

  it('erzeugt Ticket-Codes im Format der Spalte: 32 Hex-Zeichen, verschieden', () => {
    const a = newTicketCode();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(newTicketCode()).not.toBe(a);
  });
});
