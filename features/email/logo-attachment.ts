import sharp from 'sharp';

import type { ConfirmationMailLogo } from '@/features/email/confirmation-template';

/**
 * Logo der Organisation als Inline-Anhang der Bestaetigungsmail (TASK-56).
 *
 * Warum Anhang statt externer URL: Outlook blockiert externe Bilder, bis man
 * sie freigibt, und WebP/AVIF -- beides laesst der Bucket zu -- zeigen
 * Outlook und Teile von Gmail nicht an. Also wird das Logo beim Versand
 * geladen, in ein PNG umgerechnet und wie der QR-Code ueber `cid:` eingebunden.
 *
 * Jeder Fehler (falsche URL, Timeout, kaputtes Bild) heisst: Mail ohne Logo.
 * Das Logo ist Dekoration, die Anmeldebestaetigung nicht.
 */

export const LOGO_CID = 'organization-logo';

/** Anzeigegroesse in der Mail. Breite Logos stossen an die Breite, hohe an die Hoehe. */
export const LOGO_MAX_WIDTH = 200;
export const LOGO_MAX_HEIGHT = 80;

/** Doppelte Aufloesung fuer hochaufloesende Bildschirme. */
const PIXEL_RATIO = 2;

const MAX_BYTES = 5 * 1024 * 1024; // wie das Limit des Buckets
const TIMEOUT_MS = 5_000;

/** Derselbe Bucket wie in `features/events/upload.ts` -- dort mit Browser-Client, hier nicht importierbar. */
const BUCKET = 'event-images';

/**
 * Nur Logos aus dem eigenen oeffentlichen Bucket werden geladen.
 *
 * `logo_url` validiert das Formular nur als "irgendeine URL". Ohne diese
 * Pruefung koennte ein Mitglied den Server bei jeder Anmeldung eine beliebige
 * Adresse abrufen lassen (SSRF), auch eine im internen Netz.
 */
export const isOwnLogoUrl = (logoUrl: string, supabaseUrl: string) => {
  try {
    const url = new URL(logoUrl);
    const base = new URL(supabaseUrl);
    return (
      url.origin === base.origin &&
      url.pathname.startsWith(`/storage/v1/object/public/${BUCKET}/`)
    );
  } catch {
    return false;
  }
};

/** Anzeigegroesse: proportional verkleinert, nie vergroessert. */
export const logoDisplaySize = (width: number, height: number) => {
  const scale = Math.min(1, LOGO_MAX_WIDTH / width, LOGO_MAX_HEIGHT / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

/** Bilddaten -> PNG in doppelter Anzeigegroesse, plus die Anzeigegroesse. */
export const prepareLogo = async (input: Buffer) => {
  // `rotate()` ohne Argument richtet nach EXIF aus, sonst kaemen Handyfotos quer.
  const image = sharp(input).rotate();
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error('Bild ohne Masse');

  const display = logoDisplaySize(width, height);
  const png = await image
    .resize({
      width: display.width * PIXEL_RATIO,
      height: display.height * PIXEL_RATIO,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  return { png, ...display };
};

export const logoAttachment = async (
  logoUrl: string | null,
  supabaseUrl: string
): Promise<{
  attachment: {
    filename: string;
    content: Buffer;
    contentType: string;
    contentId: string;
  };
  logo: ConfirmationMailLogo;
} | null> => {
  if (!logoUrl || !isOwnLogoUrl(logoUrl, supabaseUrl)) return null;

  try {
    const response = await fetch(logoUrl, {
      // Eine Weiterleitung koennte aus dem Bucket herausfuehren.
      redirect: 'error',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const length = Number(response.headers.get('content-length'));
    if (length > MAX_BYTES) return null;

    const input = Buffer.from(await response.arrayBuffer());
    if (input.byteLength > MAX_BYTES) return null;

    const { png, width, height } = await prepareLogo(input);

    return {
      attachment: {
        filename: 'logo.png',
        content: png,
        contentType: 'image/png',
        contentId: LOGO_CID,
      },
      logo: { src: `cid:${LOGO_CID}`, width, height },
    };
  } catch {
    return null;
  }
};
