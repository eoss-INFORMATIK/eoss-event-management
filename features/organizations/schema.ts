import { z } from 'zod';

/**
 * Der Name der Organisation, wie ihn ein Mitglied setzt.
 *
 * Bis hierher entstand er nur automatisch ("Organisation von ..."), weil
 * Schritt 1 von EOS-20 bewusst keine Seite dafuer hatte. `organizations.name`
 * ist `not null`, ein leerer Name waere also auch in der Datenbank ungueltig --
 * das Schema sagt es nur frueher und lesbarer.
 */
export const organizationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Bitte gib einen Namen an')
    .max(120, 'Der Name darf hoechstens 120 Zeichen lang sein'),
});

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
