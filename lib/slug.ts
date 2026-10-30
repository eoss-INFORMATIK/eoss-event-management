/**
 * Dateinamen-tauglicher Teil aus einem Titel: `Sommerfest Zürich / 2027` wird
 * zu `sommerfest-zurich-2027`. Akzente fallen weg (NFKD zerlegt `ü` in `u` und
 * ein kombinierendes Zeichen, das der zweite Schritt entfernt).
 */
export const slugify = (value: string | null | undefined, maxLength = 60) =>
  (value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
