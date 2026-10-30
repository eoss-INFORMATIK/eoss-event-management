import { toBuffer } from 'qrcode';

import { QR_OPTIONS } from '@/lib/qr';

/** Verweis im Mail-HTML: `<img src="cid:ticket-qr">`. */
export const TICKET_CID = 'ticket-qr';

/**
 * Der QR-Code zweimal: einmal inline (mit `contentId`, im Mailtext sichtbar --
 * Gmail zeigt `data:`-Bilder nicht an), einmal als normaler Anhang, den man
 * speichern oder ausdrucken kann.
 */
export const ticketAttachments = async (url: string) => {
  const png = await toBuffer(url, { ...QR_OPTIONS, type: 'png' });

  return [
    {
      filename: 'qr-code.png',
      content: png,
      contentType: 'image/png',
      contentId: TICKET_CID,
    },
    { filename: 'ticket.png', content: png, contentType: 'image/png' },
  ];
};
