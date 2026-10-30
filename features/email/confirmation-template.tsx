/**
 * Bestaetigungsmail nach der Anmeldung (TASK-51).
 *
 * Inline-Styles, weil Mailprogramme `<style>` und Klassen nur teilweise
 * kennen. Keine Bilder von aussen: der QR-Code kommt als Anhang mit
 * `contentId` (Scheibe 2), Gmail zeigt `data:`-Bilder nicht an.
 */

export interface ConfirmationMailProps {
  eventTitle: string;
  /** Bereits formatiert, z. B. "28.10.2026". */
  eventDate: string;
  name: string | null;
  email: string;
  /** Beschriftung und Wert der Kategorie, falls gewaehlt. */
  category: { label: string; value: string } | null;
  organizationName: string | null;
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

export function ConfirmationMail({
  eventTitle,
  eventDate,
  name,
  email,
  category,
  organizationName,
}: ConfirmationMailProps) {
  const rows: [string, string][] = [
    ['Anlass', eventTitle],
    ['Datum', eventDate],
    ...(name ? [['Name', name] as [string, string]] : []),
    ['E-Mail', email],
    ...(category ? [[category.label, category.value] as [string, string]] : []),
  ];

  return (
    <div style={{ ...text, maxWidth: '560px' }}>
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

      <p style={{ ...text, marginTop: '24px' }}>
        Freundliche Grüsse
        {organizationName && (
          <>
            <br />
            {organizationName}
          </>
        )}
      </p>
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
  organizationName: 'HEV Wil und Umgebung',
} satisfies ConfirmationMailProps;

export default ConfirmationMail;
