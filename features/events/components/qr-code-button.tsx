'use client';

import { useState } from 'react';

import { QrCode } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { QR_OPTIONS } from '@/lib/qr';
import { slugify } from '@/lib/slug';

interface QrCodeButtonProps {
  /** Die oeffentliche Seite des Events, aufgeloest auf dem Server (`SITE_URL`). */
  url: string;
  title: string;
}

/**
 * Laedt einen QR-Code als PNG herunter, der die oeffentliche Event-Seite
 * oeffnet -- fuer gedruckte Einladungen. Die Bibliothek wird erst beim Klick
 * geladen.
 */
export function QrCodeButton({ url, title }: QrCodeButtonProps) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const { toDataURL } = await import('qrcode');
      const href = await toDataURL(url, QR_OPTIONS);
      const link = document.createElement('a');
      link.href = href;
      link.download = `qr-${slugify(title) || 'event'}.png`;
      link.click();
    } catch {
      toast.error('QR-Code konnte nicht erstellt werden');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="QR-Code herunterladen"
      title="QR-Code herunterladen"
      onClick={download}
      disabled={busy}
    >
      <QrCode />
    </Button>
  );
}
