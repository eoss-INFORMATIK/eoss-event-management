import { z } from 'zod';

/**
 * Fields the event form collects and validates.
 *
 * The image is deliberately not part of this schema. It is a File on the
 * client and a URL on the server -- two different shapes for one field, which
 * is what made the previous drizzle-zod schema reject any event that had an
 * image attached.
 */
export const eventFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Titel ist erforderlich')
    .max(255, 'Titel darf höchstens 255 Zeichen lang sein'),
  description: z
    .string()
    .trim()
    .max(5000, 'Beschreibung darf höchstens 5000 Zeichen lang sein')
    .optional(),
  // z.date(), not z.coerce.date(): the date input already hands over a Date,
  // and coercion would type the resolver input as `unknown`.
  date: z.date({ error: 'Bitte ein gültiges Datum wählen' }),
});

/** What the server action accepts: form fields plus the uploaded image URL. */
export const eventInputSchema = eventFormSchema.extend({
  imageUrl: z.url('Ungültige Bild-URL').optional().or(z.literal('')),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;
export type EventInput = z.infer<typeof eventInputSchema>;
