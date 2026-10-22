/**
 * Re-Export, keine zweite Implementierung.
 *
 * Die shadcn-Komponenten importieren `cn` aus dem Paket `cn` (clsx +
 * tailwind-merge, kompiliert). Hier stand dieselbe Funktion ein zweites Mal von
 * Hand. `components.json` deklariert `@/lib/utils` als utils-Alias, deshalb
 * bleibt der Pfad bestehen -- nur die Implementierung ist jetzt eine.
 */
export { cn } from 'cn';
