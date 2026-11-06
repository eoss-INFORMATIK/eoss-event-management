import { createElement } from 'react';

import { render } from '@react-email/render';
import jsQR from 'jsqr';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import {
  ConfirmationMail,
  type ConfirmationMailProps,
  FOOTER_ICON_CID,
  FOOTER_ICON_SIZE,
  confirmationSubject,
  footerParts,
} from '@/features/email/confirmation-template';
import {
  footerIconAttachments,
  footerIconPng,
  footerIconSvg,
} from '@/features/email/footer-icons';
import {
  LOGO_MAX_HEIGHT,
  LOGO_MAX_WIDTH,
  isOwnLogoUrl,
  logoAttachment,
  logoDisplaySize,
  prepareLogo,
} from '@/features/email/logo-attachment';
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
  organization: {
    name: 'HEV Wil und Umgebung',
    street: 'Obere Bahnhofstrasse 12',
    addressAddition: 'Postfach',
    postalCode: '9500',
    city: 'Wil',
    phone: '+41 71 911 22 33',
    contactEmail: 'info@hev-wil.ch',
  },
  logo: { src: 'cid:organization-logo', width: 160, height: 48 },
  qrImageSrc: 'cid:ticket-qr',
};

const noContact = {
  street: null,
  addressAddition: null,
  postalCode: null,
  city: null,
  phone: null,
  contactEmail: null,
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

describe('Kopfzeile: Logo der Organisation (TASK-56)', () => {
  it('zeigt das Logo über cid: mit festen Massen, vor dem Text', async () => {
    const html = await render(createElement(ConfirmationMail, props));
    expect(html).toContain('src="cid:organization-logo"');
    expect(html).toMatch(
      /<img[^>]*src="cid:organization-logo"[^>]*width="160"/
    );
    expect(html).toMatch(
      /<img[^>]*src="cid:organization-logo"[^>]*height="48"/
    );
    expect(html.indexOf('cid:organization-logo')).toBeLessThan(
      html.indexOf('Vielen Dank')
    );
  });

  it('lässt ohne Logo jedes Bild ausser dem QR-Code weg', async () => {
    const html = await render(
      createElement(ConfirmationMail, {
        ...props,
        logo: null,
        organization: { ...props.organization!, ...noContact },
      })
    );
    expect(html.match(/<img/g)).toHaveLength(1);
    expect(html).toContain(`src="cid:${TICKET_CID}"`);
  });

  it('verkleinert proportional auf höchstens 200 × 80, vergrössert nie', () => {
    expect(logoDisplaySize(1000, 300)).toEqual({ width: 200, height: 60 });
    expect(logoDisplaySize(400, 400)).toEqual({ width: 80, height: 80 });
    expect(logoDisplaySize(120, 40)).toEqual({ width: 120, height: 40 });
  });

  it('rechnet WebP in ein PNG in doppelter Anzeigegrösse um', async () => {
    const webp = await sharp({
      create: { width: 1000, height: 300, channels: 4, background: '#c00' },
    })
      .webp()
      .toBuffer();

    const { png, width, height } = await prepareLogo(webp);
    const meta = await sharp(png).metadata();

    expect({ width, height }).toEqual({ width: 200, height: 60 });
    expect(meta.format).toBe('png');
    expect({ w: meta.width, h: meta.height }).toEqual({ w: 400, h: 120 });
    expect(width).toBeLessThanOrEqual(LOGO_MAX_WIDTH);
    expect(height).toBeLessThanOrEqual(LOGO_MAX_HEIGHT);
  });

  it('lädt nur Logos aus dem eigenen Bucket (kein SSRF)', async () => {
    const base = 'https://abc.supabase.co';
    const own = `${base}/storage/v1/object/public/event-images/org/logo.png`;
    expect(isOwnLogoUrl(own, base)).toBe(true);

    for (const url of [
      'http://169.254.169.254/latest/meta-data/',
      'https://evil.example/storage/v1/object/public/event-images/x.png',
      `${base}/storage/v1/object/public/anderer-bucket/x.png`,
      `${base}/rest/v1/organizations`,
      'kein url',
    ]) {
      expect(isOwnLogoUrl(url, base)).toBe(false);
    }
    // Fremde URL: kein Netzzugriff, kein Logo.
    expect(await logoAttachment('http://127.0.0.1:1/x.png', base)).toBeNull();
    expect(await logoAttachment(null, base)).toBeNull();
  });
});

describe('Fusszeile: Kontaktdaten der Organisation (TASK-56)', () => {
  const footer = async (
    organization: ConfirmationMailProps['organization']
  ) => {
    const html = await render(
      createElement(ConfirmationMail, { ...props, organization })
    );
    // Nur der Teil nach der Trennlinie; Name steht sonst auch im Gruss.
    const start = html.indexOf('border-top');
    return start === -1 ? null : html.slice(start);
  };

  it('zeigt Name | Adresse | Telefon | E-Mail, Adresszusatz eingereiht', () => {
    expect(footerParts(props.organization)).toEqual([
      { kind: 'name', chunks: ['HEV Wil und Umgebung'] },
      {
        kind: 'address',
        chunks: ['Obere Bahnhofstrasse 12', 'Postfach', '9500 Wil'],
      },
      { kind: 'phone', value: '+41 71 911 22 33', href: 'tel:+41719112233' },
      {
        kind: 'email',
        value: 'info@hev-wil.ch',
        href: 'mailto:info@hev-wil.ch',
      },
    ]);
  });

  it('rendert die Teile mit | getrennt, Telefon und E-Mail mit Icon und Link', async () => {
    const html = await footer(props.organization);
    expect(html).not.toBeNull();
    expect(html!.match(/ \| /g)).toHaveLength(3);
    expect(html).toContain('href="tel:+41719112233"');
    expect(html).toContain('href="mailto:info@hev-wil.ch"');
    expect(html).toContain(`src="cid:${FOOTER_ICON_CID.phone}"`);
    expect(html).toContain(`src="cid:${FOOTER_ICON_CID.email}"`);
    // PLZ und Ort brechen nicht auseinander.
    expect(html).toMatch(/white-space:nowrap[^>]*>9500 Wil</);
  });

  it('zeigt die Adresse nur mit Strasse, PLZ und Ort', () => {
    const parts = footerParts({
      ...props.organization!,
      city: null,
    });
    expect(parts.map((p) => p.kind)).toEqual(['name', 'phone', 'email']);
  });

  it('lässt den Adresszusatz weg, wenn er fehlt', () => {
    const [, address] = footerParts({
      ...props.organization!,
      addressAddition: '  ',
    });
    expect(address).toEqual({
      kind: 'address',
      chunks: ['Obere Bahnhofstrasse 12', '9500 Wil'],
    });
  });

  it('erzeugt keine leeren Trennzeichen bei nur einer Angabe', async () => {
    const html = await footer({
      ...props.organization!,
      ...noContact,
      phone: '071 911 22 33',
    });
    expect(html!.match(/ \| /g)).toHaveLength(1);
    expect(html).not.toContain('mailto:');
  });

  it('ignoriert ungültige Telefonnummer und E-Mail', () => {
    expect(
      footerParts({
        ...props.organization!,
        ...noContact,
        phone: '-',
        contactEmail: 'keine',
      })
    ).toEqual([]);
  });

  it('zeigt keine Fusszeile mit nur dem Namen oder ohne Organisation', async () => {
    expect(await footer({ ...props.organization!, ...noContact })).toBeNull();
    expect(await footer(null)).toBeNull();
  });

  it('schreibt Kontaktdaten mit HTML als Text, nicht als Markup', async () => {
    const html = await footer({
      ...props.organization!,
      name: '<i>x</i>',
    });
    expect(html).not.toContain('<i>x</i>');
    expect(html).toContain('&lt;i&gt;x&lt;/i&gt;');
  });
});

describe('Footer-Icons: einheitlich als Bild statt Textzeichen (TASK-56)', () => {
  it('verwendet keine Unicode-Symbole mehr', async () => {
    const html = await render(createElement(ConfirmationMail, props));
    expect(html).not.toMatch(/[\u260E\u2709\uFE0E]/);
  });

  it('beide Icons: gleiche feste Grösse, mittig zur Schrift', async () => {
    const html = await render(createElement(ConfirmationMail, props));
    for (const cid of Object.values(FOOTER_ICON_CID)) {
      const img = html.match(new RegExp(`<img[^>]*cid:${cid}[^>]*>`))?.[0];
      expect(img).toContain(`width="${FOOTER_ICON_SIZE}"`);
      expect(img).toContain(`height="${FOOTER_ICON_SIZE}"`);
      expect(img).toContain('vertical-align:middle');
    }
  });

  it('erzeugt beide als quadratische PNGs gleicher Grösse', async () => {
    const [phone, mail] = await Promise.all([
      footerIconPng('phone'),
      footerIconPng('email'),
    ]);
    const a = await sharp(phone).metadata();
    const b = await sharp(mail).metadata();
    expect(a.format).toBe('png');
    expect({ w: a.width, h: a.height }).toEqual({ w: b.width, h: b.height });
    expect(a.width).toBe(a.height);
    expect(a.width! % FOOTER_ICON_SIZE).toBe(0);
  });

  it('Pfade stimmen mit Lucide überein (wie die App-Icons)', async () => {
    // @ts-expect-error -- interne Datei ohne Typen, nur im Test gelesen
    const phone = await import('lucide-react/dist/esm/icons/phone.js');
    // @ts-expect-error -- dito
    const mail = await import('lucide-react/dist/esm/icons/mail.js');
    const nodes = (node: [string, Record<string, string>][]) =>
      node.map(([, { d, x, y, width, height }]) => d ?? [x, y, width, height]);

    for (const value of nodes(phone.__iconNode).flat()) {
      expect(footerIconSvg('phone')).toContain(`"${value}"`);
    }
    for (const value of nodes(mail.__iconNode).flat()) {
      expect(footerIconSvg('email')).toContain(`"${value}"`);
    }
  });

  it('kein react-dom/server in den Mail-Modulen (bricht den Next-Build)', () => {
    // Die Module haengen ueber addParticipant an einer Server Action; Next.js
    // verbietet dort react-dom/server. Vitest merkt das nicht, nur `next build`.
    const dir = resolve(import.meta.dirname, '../features/email');
    for (const file of readdirSync(dir)) {
      expect(readFileSync(resolve(dir, file), 'utf8')).not.toMatch(
        /from ['"]react-dom\/server['"]/
      );
    }
  });

  it('hängt nur die Icons an, die die Fusszeile zeigt', async () => {
    const all = await footerIconAttachments(footerParts(props.organization));
    expect(all.map((a) => a.contentId)).toEqual([
      FOOTER_ICON_CID.phone,
      FOOTER_ICON_CID.email,
    ]);

    const onlyMail = await footerIconAttachments(
      footerParts({ ...props.organization!, phone: null })
    );
    expect(onlyMail.map((a) => a.contentId)).toEqual([FOOTER_ICON_CID.email]);

    expect(await footerIconAttachments([])).toEqual([]);
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
