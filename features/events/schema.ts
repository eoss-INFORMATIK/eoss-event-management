import { z } from 'zod';

/**
 * Fields the event form collects and validates.
 *
 * The image is deliberately not part of this schema. It is a File on the
 * client and a URL on the server -- two different shapes for one field, which
 * is what made the previous drizzle-zod schema reject any event that had an
 * image attached.
 */
const eventFieldsSchema = z.object({
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

  // Sponsor oder Durchfuehrungsort: ein optionaler Block auf der Landingpage.
  //
  // `sponsorEnabled` ist reiner Transportwert -- in der Datenbank gibt es
  // bewusst keine Spalte dafuer (siehe docs/eos-36-dynamische-felder.md). Er
  // steht hier und nicht nur im Komponentenzustand, damit die Regel
  // "eingeschaltet heisst Name erforderlich" auch serverseitig gilt.
  sponsorEnabled: z.boolean(),
  sponsorName: z
    .string()
    .trim()
    .max(255, 'Name darf höchstens 255 Zeichen lang sein')
    .optional(),
  sponsorText: z
    .string()
    .trim()
    .max(2000, 'Zusatztext darf höchstens 2000 Zeichen lang sein')
    .optional(),
});

/**
 * Einmal definiert, auf beide Schemas angewandt.
 *
 * Der erste Anlauf baute `eventInputSchema` aus `eventFieldsSchema.def.shape`
 * neu -- und verlor dabei genau diese Regel, also die serverseitige
 * Durchsetzung. Eine Pruefung, die nur im Browser laeuft, ist keine.
 */
const requireSponsorName = (
  ctx: z.core.ParsePayload<{
    sponsorEnabled: boolean;
    sponsorName?: string;
  }>
) => {
  if (!ctx.value.sponsorEnabled || ctx.value.sponsorName) return;

  ctx.issues.push({
    code: 'custom',
    input: ctx.value.sponsorName,
    path: ['sponsorName'],
    message: 'Bitte einen Namen angeben oder den Block ausschalten',
  });
};

export const eventFormSchema = eventFieldsSchema.check(requireSponsorName);

/** What the server action accepts: form fields plus the uploaded image URLs. */
export const eventInputSchema = eventFieldsSchema
  .extend({
    imageUrl: z.url('Ungültige Bild-URL').optional().or(z.literal('')),
    sponsorImageUrl: z.url('Ungültige Bild-URL').optional().or(z.literal('')),
  })
  .check(requireSponsorName);

export type EventFormValues = z.infer<typeof eventFormSchema>;
export type EventInput = z.infer<typeof eventInputSchema>;
