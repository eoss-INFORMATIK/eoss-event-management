import sharp from 'sharp';

import {
  FOOTER_ICON_CID,
  FOOTER_ICON_SIZE,
  type FooterPart,
} from '@/features/email/confirmation-template';

/**
 * Telefon- und E-Mail-Icon der Fusszeile als PNG-Anhaenge (TASK-56,
 * Korrektur). Warum Bilder statt Textzeichen: siehe `FOOTER_ICON_CID`.
 *
 * Beide aus Lucide (ISC-Lizenz, https://lucide.dev), wie die Icons der App:
 * gleiches 24er-Raster, gleiche Strichstaerke -- dadurch wirken sie gleich
 * gross. Farbe wie der Footer-Text. Gerendert in dreifacher Groesse, damit sie
 * auch auf hochaufloesenden Bildschirmen scharf bleiben.
 *
 * Die Pfade stehen hier als SVG-Text, abgeschrieben aus `lucide-react` 0.545
 * (`phone`, `mail`). Nicht ueber `lucide-react` + `react-dom/server`: Next.js
 * verbietet `react-dom/server` im Modulgraphen von Server Components und
 * Server Actions -- der Build bricht ab, und diese Datei haengt ueber
 * `addParticipant` an genau so einem Graphen.
 */

const COLOR = '#555555';
const PIXEL_RATIO = 3;

const PATHS = {
  phone:
    '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
  email:
    '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>',
} as const;

type IconKind = keyof typeof PATHS;

/** Lucide-Standardattribute: 24er-viewBox, Strich 2, runde Enden. */
export const footerIconSvg = (kind: IconKind) => {
  const size = FOOTER_ICON_SIZE * PIXEL_RATIO;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 24 24" fill="none" stroke="${COLOR}" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round">${PATHS[kind]}</svg>`
  );
};

export const footerIconPng = (kind: IconKind) =>
  sharp(Buffer.from(footerIconSvg(kind)))
    .png()
    .toBuffer();

/** Einmal pro Prozess erzeugt, die Icons aendern sich nicht. */
const cache = new Map<IconKind, Promise<Buffer>>();
const cachedPng = (kind: IconKind) => {
  if (!cache.has(kind)) cache.set(kind, footerIconPng(kind));
  return cache.get(kind)!;
};

/**
 * Nur die Icons, die die Fusszeile tatsaechlich zeigt. Schlaegt das Rendern
 * fehl, geht die Mail ohne Icons raus -- das Mailprogramm zeigt dann den
 * Alt-Text ("Telefon", "E-Mail"), die Bestaetigung haengt nicht daran.
 */
export const footerIconAttachments = async (parts: FooterPart[]) => {
  const kinds = parts
    .map((part) => part.kind)
    .filter((kind): kind is IconKind => kind === 'phone' || kind === 'email');

  return Promise.all(
    kinds.map(async (kind) => ({
      filename: `${kind}.png`,
      content: await cachedPng(kind),
      contentType: 'image/png',
      contentId: FOOTER_ICON_CID[kind],
    }))
  ).catch(() => []);
};
