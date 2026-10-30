import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { toDataURL } from 'qrcode';
import { describe, expect, it } from 'vitest';

import { QR_OPTIONS } from '@/lib/qr';

/**
 * Der QR-Code fuer gedruckte Einladungen muss die oeffentliche Event-Seite
 * oeffnen. Geprueft wird das Bild selbst: mit denselben Einstellungen erzeugt
 * wie im Browser, als PNG gelesen und mit einem unabhaengigen Decoder (`jsqr`)
 * wieder entschluesselt.
 *
 * Diese Tests brauchen keine Datenbank.
 */

const decode = async (text: string) => {
  const dataUrl = await toDataURL(text, QR_OPTIONS);
  const png = PNG.sync.read(
    Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64')
  );
  return {
    width: png.width,
    text: jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data,
  };
};

describe('QR-Code zum Event', () => {
  it('enthält genau die öffentliche Event-URL', async () => {
    const url =
      'https://events.eoss.ch/events/efa7b06a-da46-4169-9fef-c2b1202c37bc';
    expect((await decode(url)).text).toBe(url);
  });

  it('ist ein PNG in Druckgrösse', async () => {
    expect((await decode('https://example.ch/events/x')).width).toBe(1024);
  });
});
