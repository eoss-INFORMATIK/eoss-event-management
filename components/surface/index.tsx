import type { ComponentProps } from 'react';

import { cn } from 'cn';

/**
 * Nur die Flaeche: Rahmen, Radius, Hintergrund, Schatten.
 *
 * Kein Layout, kein Grid, keine Annahme ueber den Inhalt -- genau das war an
 * shadcns `Card` das Problem. Dessen `CardHeader` ist ein Grid mit
 * `grid-rows-[auto_auto]` und einer bedingten zweiten Spalte; sobald etwas
 * anderes als Titel und Beschreibung hineinkommt, etwa ein Bild, wird es zur
 * Grid-Zeile und der Container ist nicht mehr neutral.
 *
 * Abstaende und Anordnung bestimmt hier die aufrufende Komponente. Das ist
 * bewusst *keine* Komponentenfamilie -- eine Abstraktion ohne Verhalten ist
 * selten eine.
 */
export const Surface = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn(
      'bg-card text-card-foreground rounded-xl border shadow-sm',
      className
    )}
    {...props}
  />
);
