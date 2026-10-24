import { cn } from '@/lib/utils';

/**
 * Initialen aus dem Anzeigenamen: "Simon Herensperger" -> "SH".
 *
 * Gibt bewusst einen leeren String zurueck, wenn kein Name da ist -- **kein**
 * Rueckfall auf die E-Mail. Was dort stattdessen stehen soll, ist offen (die
 * Idee sind Icons mit etwas Persoenlichkeit), und ein Rueckfall waere Arbeit,
 * die dann weggeworfen wird.
 */
const initialsFrom = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return (
    parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)
  ).toUpperCase();
};

type AvatarProps = {
  name: string;
  className?: string;
};

/**
 * Nur der Kreis mit den Initialen. Kein Bild, kein Rueckfall, kein Verhalten --
 * dieselbe Begruendung wie bei `Surface`: shadcns `Avatar` ist Radix fuer
 * Bild-Ladezustaende, und davon gibt es hier keinen.
 */
export const Avatar = ({ name, className }: AvatarProps) => (
  <span
    aria-hidden="true"
    className={cn(
      'bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold',
      className
    )}
  >
    {initialsFrom(name)}
  </span>
);
