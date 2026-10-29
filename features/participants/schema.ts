import { z } from 'zod';

export const PARTICIPANT_STATUSES = [
  'pending',
  'confirmed',
  'declined',
  'waitlisted',
] as const;

/** Anzeige fuer Menschen ausserhalb der App, etwa im Export. */
export const PARTICIPANT_STATUS_LABELS: Record<
  (typeof PARTICIPANT_STATUSES)[number],
  string
> = {
  pending: 'Ausstehend',
  confirmed: 'Bestätigt',
  declined: 'Abgesagt',
  waitlisted: 'Warteliste',
};

export const participantStatusSchema = z.enum(PARTICIPANT_STATUSES, {
  error: 'Ungültiger Status',
});

/** What the public registration form collects. */
export const participantFormSchema = z.object({
  email: z.email('Bitte eine gültige E-Mail-Adresse angeben').max(255),
  name: z
    .string()
    .trim()
    .max(255, 'Name darf höchstens 255 Zeichen lang sein')
    .optional(),
  /**
   * Die gewaehlte Kategorie, falls das Event welche anbietet.
   *
   * Dass die Id zu DIESEM Event gehoert, erzwingt der zusammengesetzte
   * Fremdschluessel `(event_id, category_id)` in der Datenbank -- nicht dieses
   * Schema. Die Anmeldung ist oeffentlich, eine Pruefung im Formular waere
   * eine Hoeflichkeit, keine Grenze.
   */
  categoryId: z.uuid('Bitte einen gültigen Wert wählen').optional(),
});

export type ParticipantFormValues = z.infer<typeof participantFormSchema>;
export type ParticipantStatus = z.infer<typeof participantStatusSchema>;

/** Unbekannte Werte erscheinen roh statt zu verschwinden. */
export const statusLabel = (status: string) =>
  PARTICIPANT_STATUS_LABELS[status as ParticipantStatus] ?? status;
