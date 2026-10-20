import { z } from 'zod';

export const PARTICIPANT_STATUSES = [
  'pending',
  'confirmed',
  'declined',
  'waitlisted',
] as const;

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
});

export type ParticipantFormValues = z.infer<typeof participantFormSchema>;
export type ParticipantStatus = z.infer<typeof participantStatusSchema>;
