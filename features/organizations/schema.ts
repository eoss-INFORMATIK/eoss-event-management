import { z } from 'zod';

/**
 * Ein optionales Textfeld, getrimmt. Leer bleibt hier '' -- erst die Action
 * schreibt `null` (siehe `updateOrganization`). Ein `transform` im Schema
 * machte Ein- und Ausgabetyp verschieden, und das vertraegt `FormField` nicht.
 */
const optionalText = (max: number) =>
  z.string().trim().max(max, `Höchstens ${max} Zeichen`);

/**
 * Name, Adresse und Kontakt der Organisation, wie ein Mitglied sie setzt.
 *
 * Der Name entstand bis EOS-20 nur automatisch ("Organisation von ...").
 * `organizations.name` ist `not null`, ein leerer Name waere also auch in der
 * Datenbank ungueltig -- das Schema sagt es nur frueher und lesbarer.
 *
 * Adresse und Kontakt (TASK-55) sind alle optional und erscheinen oeffentlich
 * in der Fusszeile der Event-Seiten. Die Laengen entsprechen den Spalten.
 */
export const organizationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Bitte gib einen Namen an')
    .max(120, 'Der Name darf hoechstens 120 Zeichen lang sein'),
  street: optionalText(255),
  addressAddition: optionalText(255),
  postalCode: optionalText(10),
  city: optionalText(255),
  contactEmail: z
    .string()
    .trim()
    .max(255, 'Höchstens 255 Zeichen')
    .pipe(
      z.union([z.literal(''), z.email('Bitte gib eine gültige E-Mail an')])
    ),
  phone: optionalText(50),
});

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

/**
 * Was die Action annimmt: die Formularfelder plus die URL des Logos. Die Datei
 * selbst laedt der Browser direkt in den Storage, wie bei den Event-Bildern;
 * '' heisst "kein Logo".
 */
export const organizationInputSchema = organizationFormSchema.extend({
  logoUrl: z.url('Ungültige Bild-URL').or(z.literal('')),
});

export type OrganizationInput = z.infer<typeof organizationInputSchema>;
