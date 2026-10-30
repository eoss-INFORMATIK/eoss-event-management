import type { QRCodeToDataURLOptions } from 'qrcode';

/**
 * Einstellungen fuer jeden QR-Code der App -- heute der Event-QR in der
 * Admin-Ansicht, spaeter die persoenlichen Codes in den Antwortmails. Dieselbe
 * Bibliothek (`qrcode`) laeuft im Browser (`toDataURL`) und auf dem Server
 * (`toBuffer`, als Mail-Anhang: Gmail blockiert `data:`-Bilder).
 *
 * - 1024 px: scharf im Druck auf einer Einladung, auch auf A5.
 * - Fehlerkorrektur `M` (15 %): verkraftet Knicke und Flecken, ohne dass der
 *   Code bei einer URL dieser Laenge zu dicht wird.
 * - Ruhezone 4 Module: das, was Scanner laut Norm erwarten.
 */
export const QR_OPTIONS = {
  type: 'image/png',
  width: 1024,
  margin: 4,
  errorCorrectionLevel: 'M',
  color: { dark: '#000000', light: '#ffffff' },
} satisfies QRCodeToDataURLOptions;
