import { createElement } from 'react';

import { Mail, Phone } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
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
 * Beide aus Lucide, wie die Icons der App: gleiches 24er-Raster, gleiche
 * Strichstaerke -- dadurch wirken sie gleich gross. Farbe wie der Footer-Text.
 * Gerendert in dreifacher Groesse, damit sie auch auf hochaufloesenden
 * Bildschirmen scharf bleiben.
 */

const COLOR = '#555555';
const PIXEL_RATIO = 3;
const ICONS = { phone: Phone, email: Mail } as const;

type IconKind = keyof typeof ICONS;

export const footerIconPng = (kind: IconKind) => {
  const svg = renderToStaticMarkup(
    createElement(ICONS[kind], {
      size: FOOTER_ICON_SIZE * PIXEL_RATIO,
      color: COLOR,
      strokeWidth: 2,
    })
  );
  return sharp(Buffer.from(svg)).png().toBuffer();
};

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
