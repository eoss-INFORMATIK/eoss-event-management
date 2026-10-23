import { z } from 'zod';

/**
 * Der Anzeigename, wie ihn der Nutzer selbst setzt.
 *
 * Bis hierher kam der Name aus den Metadaten des Anmeldeanbieters und war
 * deshalb gar nicht aenderbar. `profiles.name` ist nullable -- leer ist ein
 * gueltiger Datenbankzustand, aber kein gueltige Formulareingabe: wer das
 * Formular abschickt, will einen Namen setzen.
 */
export const profileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Bitte gib einen Namen an')
    .max(80, 'Der Name darf hoechstens 80 Zeichen lang sein'),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
