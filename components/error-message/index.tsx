import type { ComponentProps } from 'react';

import { cn } from 'cn';

/**
 * Fehlermeldung ueber einem Formular oder einer Ansicht.
 *
 * Stand vorher fuenfmal fast gleich im Code -- mit festen roten Tailwind-Shades
 * statt --destructive, mit unterschiedlichem Padding, und in vier von fuenf
 * Faellen ohne `role="alert"`. Ohne das liest ein Screenreader die Meldung beim
 * Erscheinen nicht vor: man bekommt die Fehlermeldung nur mit, wenn man
 * zufaellig hinsieht.
 */
export const ErrorMessage = ({
  className,
  children,
  ...props
}: ComponentProps<'p'>) => (
  <p
    role="alert"
    className={cn(
      'bg-destructive-text/10 text-destructive-text rounded-md p-3',
      className
    )}
    {...props}
  >
    {children}
  </p>
);
