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

  // Kategorien im Anmeldeformular. `categoriesEnabled` ist wie
  // `sponsorEnabled` reiner Transportwert -- eingeschaltet heisst in der
  // Datenbank schlicht "es gibt mindestens eine Kategorie".
  categoriesEnabled: z.boolean(),
  // Der Organisator benennt das Feld selbst. Fuer "Einzelperson / mit
  // Begleitung / Firma" ist "Kategorie" die falsche Ueberschrift.
  categoryLabel: z
    .string()
    .trim()
    .max(120, 'Die Beschriftung darf höchstens 120 Zeichen lang sein')
    .optional(),
  categoryRequired: z.boolean(),
  // `id` fehlt bei neu hinzugefuegten Zeilen. Vorhandene behalten ihre Id,
  // damit Umbenennen ein Update bleibt und bestehende Anmeldungen mitziehen,
  // statt dass Loeschen plus Neuanlegen sie entwertet.
  categories: z
    .array(
      z.object({
        id: z.uuid().optional(),
        label: z
          .string()
          .trim()
          .max(120, 'Ein Wert darf höchstens 120 Zeichen lang sein'),
      })
    )
    .max(50, 'Höchstens 50 Werte'),
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

/**
 * Eingeschaltet heisst: mindestens ein nicht leerer Wert. Ein Select ohne
 * Optionen waere ein Pflichtfeld, das sich nicht ausfuellen laesst.
 */
const requireCategoryValues = (
  ctx: z.core.ParsePayload<{
    categoriesEnabled: boolean;
    categories: { label: string }[];
  }>
) => {
  if (!ctx.value.categoriesEnabled) return;
  if (ctx.value.categories.some((category) => category.label.trim())) return;

  ctx.issues.push({
    code: 'custom',
    input: ctx.value.categories,
    path: ['categories'],
    message:
      'Bitte mindestens einen Wert angeben oder die Kategorien ausschalten',
  });
};

export const eventFormSchema = eventFieldsSchema
  .check(requireSponsorName)
  .check(requireCategoryValues);

/** What the server action accepts: form fields plus the uploaded image URLs. */
export const eventInputSchema = eventFieldsSchema
  .extend({
    imageUrl: z.url('Ungültige Bild-URL').optional().or(z.literal('')),
    sponsorImageUrl: z.url('Ungültige Bild-URL').optional().or(z.literal('')),
  })
  .check(requireSponsorName)
  .check(requireCategoryValues);

export type EventFormValues = z.infer<typeof eventFormSchema>;
export type EventInput = z.infer<typeof eventInputSchema>;
