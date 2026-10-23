#!/usr/bin/env node
/**
 * Einmaliger Umzug: Event-Bilder von <user-id>/ nach <organization_id>/.
 *
 * WARUM EIN SKRIPT UND KEINE MIGRATION:
 * `update storage.objects set name = ...` benennt nur die Metadatenzeile um,
 * nicht die abgelegte Datei. Nachgemessen: danach antwortet der neue Pfad mit
 * 500 und der alte mit 400 -- das Objekt ist kaputt. Verschieben geht nur ueber
 * die Storage-API.
 *
 * Idempotent: Ordner, die schon eine Organisations-ID sind, werden
 * uebersprungen. Mehrfach laufen lassen ist unschaedlich.
 *
 * Aufruf lokal:
 *   npm run storage:migrate            (Dry-Run)
 *   npm run storage:migrate -- --apply
 *
 * Gegen das gehostete Projekt (Service-Role-Key aus dem Dashboard, nicht in
 * einer Datei ablegen):
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<key> \
 *   node scripts/move-images-to-organization.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'event-images';
const apply = process.argv.includes('--apply');

// Lokal liefert `supabase status -o env` API_URL und SERVICE_ROLE_KEY; fuer das
// gehostete Projekt werden die SUPABASE_*-Varianten gesetzt.
const url = process.env.SUPABASE_URL ?? process.env.API_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    'URL oder Service-Role-Key fehlt. Lokal: `npm run storage:migrate` ' +
      '(das Script liest sie aus `supabase status`).'
  );
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const log = (...args) => console.log(apply ? '' : '[Dry-Run]', ...args);

const { data: orgs, error: orgError } = await db
  .from('organizations')
  .select('id');

if (orgError) {
  console.error('Organisationen nicht lesbar:', orgError.message);
  process.exit(1);
}

const orgIds = new Set(orgs.map((o) => o.id));

const { data: entries, error: listError } = await db.storage
  .from(BUCKET)
  .list('', { limit: 1000 });

if (listError) {
  console.error('Bucket nicht lesbar:', listError.message);
  process.exit(1);
}

// Ordner haben keine id -- so unterscheidet die Storage-API sie von Dateien.
const folders = entries.filter((e) => e.id === null).map((e) => e.name);
let moved = 0;
let skipped = 0;

for (const folder of folders) {
  if (orgIds.has(folder)) {
    log(`Ordner ${folder} ist schon eine Organisation, uebersprungen`);
    skipped += 1;
    continue;
  }

  const { data: membership } = await db
    .from('organization_user')
    .select('organization_id')
    .eq('user_id', folder)
    .maybeSingle();

  if (!membership) {
    console.warn(
      `Ordner ${folder}: keine Organisation gefunden (Nutzer geloescht?) -- ` +
        'uebersprungen, bitte von Hand ansehen'
    );
    continue;
  }

  const target = membership.organization_id;
  const { data: files } = await db.storage.from(BUCKET).list(folder, {
    limit: 1000,
  });

  for (const file of files ?? []) {
    const from = `${folder}/${file.name}`;
    const to = `${target}/${file.name}`;

    log(`verschiebe ${from} -> ${to}`);

    if (!apply) continue;

    const { error: moveError } = await db.storage.from(BUCKET).move(from, to);

    if (moveError) {
      console.error(`  fehlgeschlagen: ${moveError.message}`);
      continue;
    }

    moved += 1;
  }
}

/**
 * URLs in einem eigenen Durchgang, NICHT pro Ordner.
 *
 * Grund: eine image_url kann auf einen Ordner zeigen, den es im Bucket nicht
 * mehr gibt -- etwa weil die Datei schon anders verschoben wurde. Ueber die
 * Ordnerliste zu laufen wuerde solche Zeilen uebersehen. Dieser Durchgang
 * fragt die Events und leitet den Zielordner aus dem Pfad ab.
 */
const { data: withImage } = await db
  .from('events')
  .select('id, image_url')
  .not('image_url', 'is', null);

let rewritten = 0;

for (const event of withImage ?? []) {
  const marker = `/${BUCKET}/`;
  const at = event.image_url.indexOf(marker);

  if (at === -1) continue;

  const rest = event.image_url.slice(at + marker.length);
  const first = rest.split('/')[0];

  if (!first || orgIds.has(first)) continue;

  const { data: membership } = await db
    .from('organization_user')
    .select('organization_id')
    .eq('user_id', first)
    .maybeSingle();

  if (!membership) {
    console.warn(
      `Event ${event.id}: Pfad zeigt auf ${first}, dazu keine Organisation -- ` +
        'bitte von Hand ansehen'
    );
    continue;
  }

  const next = event.image_url.replace(
    `${marker}${first}/`,
    `${marker}${membership.organization_id}/`
  );

  log(
    `image_url von Event ${event.id}: ${first} -> ${membership.organization_id}`
  );

  if (!apply) continue;

  await db.from('events').update({ image_url: next }).eq('id', event.id);
  rewritten += 1;
}

log(
  `fertig. verschoben: ${moved}, URLs umgeschrieben: ${rewritten}, ` +
    `uebersprungene Ordner: ${skipped}`
);

if (!apply) {
  console.log('\nNichts geaendert. Mit --apply ausfuehren.');
}
