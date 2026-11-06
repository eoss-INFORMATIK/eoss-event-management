/**
 * Bestaetigungsmail nach der Anmeldung (TASK-51), mit Logo und Kontaktzeile
 * der Organisation (TASK-56).
 *
 * Inline-Styles, weil Mailprogramme `<style>` und Klassen nur teilweise
 * kennen. Keine Bilder von aussen: QR-Code und Logo kommen als Anhang mit
 * `contentId` und werden ueber `cid:` eingebunden -- Gmail zeigt `data:`-Bilder
 * nicht an, Outlook blockiert externe Bilder, bis man sie freigibt.
 */

/** Was die Mail ueber die Organisation zeigt. Alles ausser dem Namen optional. */
export interface ConfirmationMailOrganization {
  name: string;
  street: string | null;
  addressAddition: string | null;
  postalCode: string | null;
  city: string | null;
  phone: string | null;
  contactEmail: string | null;
}

/**
 * Das Logo als Inline-Anhang. Breite und Hoehe sind die Anzeigegroesse in
 * Pixeln, aus den echten Bildmassen berechnet (`features/email/logo-attachment.ts`)
 * -- so verzerrt auch Outlook nichts, das CSS-`max-width` ignoriert.
 */
export interface ConfirmationMailLogo {
  /** `cid:...` des Logo-Anhangs. */
  src: string;
  width: number;
  height: number;
}

export interface ConfirmationMailProps {
  eventTitle: string;
  /** Bereits formatiert, z. B. "28.10.2026". */
  eventDate: string;
  name: string | null;
  email: string;
  /** Beschriftung und Wert der Kategorie, falls gewaehlt. */
  category: { label: string; value: string } | null;
  organization: ConfirmationMailOrganization | null;
  logo: ConfirmationMailLogo | null;
  /** `cid:...` des QR-Anhangs. */
  qrImageSrc: string;
}

export const confirmationSubject = (eventTitle: string) =>
  `Anmeldung ${eventTitle}`;

const text = {
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#111111',
} as const;

const cell = { ...text, padding: '4px 16px 4px 0', verticalAlign: 'top' };

const footerText = {
  ...text,
  fontSize: '13px',
  color: '#555555',
} as const;

/** Leerzeichen und leere Werte gelten als "nicht angegeben". */
const clean = (value: string | null | undefined) => value?.trim() || null;

/** Wie das Formular (z.email), nur grob: ein @, davor und dahinter etwas, ein Punkt in der Domain. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Eine Telefonnummer enthaelt Ziffern -- "-" oder "keine" ist keine. */
const PHONE = /\d/;

/**
 * Teile der Fusszeile, in Anzeigereihenfolge. Jeder Teil besteht aus Stuecken,
 * die nicht umbrechen duerfen (`nowrap`); zwischen Stuecken und zwischen
 * Teilen darf der Mailclient umbrechen. So bleiben "PLZ Ort", die
 * Telefonnummer und die E-Mail-Adresse zusammen, ohne dass eine lange Strasse
 * die Zeile ueber den Rand schiebt.
 *
 * Leer, wenn es neben dem Namen keine vollstaendige Adresse, kein Telefon und
 * keine E-Mail gibt -- dann erscheint keine Fusszeile.
 */
export type FooterPart =
  | { kind: 'name'; chunks: string[] }
  | { kind: 'address'; chunks: string[] }
  | { kind: 'phone'; value: string; href: string }
  | { kind: 'email'; value: string; href: string };

export const footerParts = (
  organization: ConfirmationMailOrganization | null
): FooterPart[] => {
  if (!organization) return [];

  const name = clean(organization.name);
  const street = clean(organization.street);
  const addition = clean(organization.addressAddition);
  const postalCode = clean(organization.postalCode);
  const city = clean(organization.city);
  const phone = clean(organization.phone);
  const email = clean(organization.contactEmail);

  const contact: FooterPart[] = [];

  if (street && postalCode && city) {
    contact.push({
      kind: 'address',
      chunks: [
        street,
        ...(addition ? [addition] : []),
        `${postalCode} ${city}`,
      ],
    });
  }
  if (phone && PHONE.test(phone)) {
    contact.push({
      kind: 'phone',
      value: phone,
      href: `tel:${phone.replace(/[^+\d]/g, '')}`,
    });
  }
  if (email && EMAIL.test(email)) {
    contact.push({ kind: 'email', value: email, href: `mailto:${email}` });
  }

  if (!name || contact.length === 0) return [];
  return [{ kind: 'name', chunks: [name] }, ...contact];
};

/**
 * Icons als Textzeichen statt Bilder: keine weiteren Anhaenge, nichts, was ein
 * Client blockiert. U+FE0E erzwingt die Textform -- ohne macht iOS daraus ein
 * buntes Emoji.
 */
const ICON = { phone: '☎︎', email: '✉︎' } as const;

const nowrap = { whiteSpace: 'nowrap' } as const;
const link = { color: '#555555', textDecoration: 'none' } as const;

function FooterPartView({ part }: { part: FooterPart }) {
  switch (part.kind) {
    case 'name':
      return (
        <strong style={{ ...nowrap, color: '#111111' }}>
          {part.chunks[0]}
        </strong>
      );
    case 'address':
      return (
        <>
          {part.chunks.map((chunk, index) => (
            // Reihenfolge ist fest, zwei gleiche Stuecke sind moeglich.
            <span key={index}>
              {index > 0 && ' '}
              <span style={nowrap}>{chunk}</span>
            </span>
          ))}
        </>
      );
    case 'phone':
    case 'email':
      return (
        <span style={nowrap}>
          {ICON[part.kind]}&nbsp;
          <a href={part.href} style={link}>
            {part.value}
          </a>
        </span>
      );
  }
}

function Footer({ parts }: { parts: FooterPart[] }) {
  if (parts.length === 0) return null;

  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      width="100%"
      style={{ marginTop: '32px', borderTop: '1px solid #dddddd' }}
    >
      <tbody>
        <tr>
          <td style={{ ...footerText, paddingTop: '12px' }}>
            {parts.map((part, index) => (
              <span key={part.kind}>
                {index > 0 && <span style={{ color: '#999999' }}> | </span>}
                <FooterPartView part={part} />
              </span>
            ))}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function ConfirmationMail({
  eventTitle,
  eventDate,
  name,
  email,
  category,
  organization,
  logo,
  qrImageSrc,
}: ConfirmationMailProps) {
  const rows: [string, string][] = [
    ['Anlass', eventTitle],
    ['Datum', eventDate],
    ...(name ? [['Name', name] as [string, string]] : []),
    ['E-Mail', email],
    ...(category ? [[category.label, category.value] as [string, string]] : []),
  ];

  const organizationName = clean(organization?.name);

  return (
    <div style={{ ...text, maxWidth: '560px' }}>
      {logo && (
        // next/image gibt es in einer Mail nicht -- Mailprogramme brauchen <img>.
        // width/height als Attribute fuer Outlook, als CSS fuer alle anderen.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo.src}
          alt={organizationName ?? 'Logo'}
          width={logo.width}
          height={logo.height}
          style={{
            display: 'block',
            width: `${logo.width}px`,
            height: `${logo.height}px`,
            maxWidth: '100%',
            border: 0,
            outline: 'none',
            textDecoration: 'none',
            marginBottom: '24px',
          }}
        />
      )}

      <p style={text}>
        Vielen Dank für Ihre Anmeldung. Wir freuen uns, Sie zum Anlass „
        {eventTitle}“ begrüssen zu dürfen.
      </p>

      <p style={{ ...text, fontWeight: 'bold', marginTop: '24px' }}>
        Ihre Anmeldedaten
      </p>
      <table role="presentation" cellPadding={0} cellSpacing={0}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td style={{ ...cell, color: '#555555' }}>{label}</td>
              <td style={cell}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ ...text, fontWeight: 'bold', marginTop: '24px' }}>
        Ihr Ticket
      </p>
      {/* next/image gibt es in einer Mail nicht -- Mailprogramme brauchen <img>. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrImageSrc}
        alt="QR-Code Ihres Tickets"
        width={200}
        height={200}
        style={{ display: 'block', width: '200px', height: '200px' }}
      />
      <p style={text}>
        Bitte zeigen Sie diesen QR-Code am Eingang vor. Er liegt dieser Mail
        auch als Anhang bei.
      </p>

      <p style={{ ...text, marginTop: '24px' }}>
        Freundliche Grüsse
        {organizationName && (
          <>
            <br />
            {organizationName}
          </>
        )}
      </p>

      <Footer parts={footerParts(organization)} />
    </div>
  );
}

/** Vorschau fuer `npm run email`. */
ConfirmationMail.PreviewProps = {
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
  logo: {
    src: 'https://placehold.co/320x96/png?text=Logo',
    width: 160,
    height: 48,
  },
  qrImageSrc: 'https://placehold.co/200x200/png?text=QR',
} satisfies ConfirmationMailProps;

export default ConfirmationMail;
