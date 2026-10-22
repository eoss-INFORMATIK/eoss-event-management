import type { NextConfig } from 'next';

/**
 * Erlaubte Bild-Hosts fuer next/image.
 *
 * Abgeleitet aus NEXT_PUBLIC_SUPABASE_URL statt hart eingetragen: so erlaubt der
 * Prod-Build nur das Produktionsprojekt und der lokale Build nur den lokalen
 * Stack samt Port 54321. Ein spaeteres Staging-Projekt funktioniert damit ohne
 * Aenderung an dieser Datei.
 *
 * `remotePatterns` wird beim **Build** ausgewertet und in das Artefakt
 * eingebacken -- eine geaenderte Variable wirkt erst nach einem neuen
 * Deployment, nicht nach einem Neustart.
 *
 * next.config.ts laeuft vor `@/env`, deshalb hier direkt `process.env` mit
 * eigener Pruefung. Der trailing slash wird abgeschnitten, aus demselben Grund
 * wie bei SITE_URL: die Aufrufer haengen Pfade direkt an.
 */
const supabaseUrl = // eslint-disable-next-line n/no-process-env
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');

if (!supabaseUrl) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL fehlt — images.remotePatterns kann nicht gebildet werden'
  );
}

// Nur der oeffentliche Pfad dieses einen Buckets, nicht der ganze Host: unter
// derselben Domain liegen auch die REST-API und andere Buckets. Ein Muster auf
// Hostebene machte den Bild-Optimizer zum offenen Proxy dafuer.
const storagePattern = new URL(
  `${supabaseUrl}/storage/v1/object/public/event-images/**`
);

const isLocalHost = ['127.0.0.1', 'localhost', '[::1]', '::1'].includes(
  storagePattern.hostname
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [storagePattern],
    // Next 16 lehnt Remote-Bilder auf privaten IPs grundsaetzlich ab (SSRF) und
    // meldet dem Client dafuer dieselbe Zeile wie bei einem nicht erlaubten
    // Muster -- der echte Grund steht nur im Server-Log. Der lokale
    // Supabase-Stack laeuft auf 127.0.0.1, dort muss die Sperre fallen.
    // Haengt am abgeleiteten Host, ein Prod-Build setzt es deshalb nie.
    dangerouslyAllowLocalIP: isLocalHost,
  },
};

export default nextConfig;
