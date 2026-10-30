/**
 * Ticket-Code einer Anmeldung (TASK-51): 32 Hex-Zeichen, 122 Bit Zufall --
 * dasselbe Format wie der Default der Spalte `event_participants.ticket_code`.
 *
 * Die oeffentliche Anmeldung erzeugt ihn im Server und schreibt ihn mit, weil
 * sie ihre Zeile nicht zuruecklesen darf, die Mail den Code aber braucht.
 */
export const newTicketCode = () => crypto.randomUUID().replaceAll('-', '');

/**
 * Was im QR-Code steht. `/t/<code>` ist der Einstieg fuer den spaeteren
 * Check-in; heute zeigt die Seite nur, dass es ein Ticket ist.
 */
export const ticketUrl = (siteUrl: string, code: string) =>
  `${siteUrl}/t/${code}`;
