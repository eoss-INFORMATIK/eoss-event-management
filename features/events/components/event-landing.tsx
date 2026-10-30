import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { EventOrganization } from '@/features/organizations/queries';

import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Event } from '@/types';

interface EventLandingProps {
  event: Event;
  /** Der Veranstalter, fuer Kopf- und Fusszeile. */
  organization: EventOrganization | null;
  /** Das Anmeldeformular -- kommt aus `features/participants`, deshalb als Slot. */
  registration: ReactNode;
}

/**
 * Oeffentliche Seite eines Events (Figma "Event Usersicht", 142:1309).
 *
 * Zwei Spalten, die sich durch die ganze Seite ziehen: links Beschreibung und
 * Sponsor/Ort, rechts Anmeldung und das Sponsor-Bild. Unter `lg` untereinander.
 *
 * Die Seite tritt im Auftritt des Veranstalters auf (TASK-55): Kopfzeile mit
 * dessen Logo (ohne Logo der Name), Fusszeile mit Name, Adresse und Kontakt,
 * darunter klein der Verweis auf die App.
 *
 * Abweichungen vom Figma, bewusst: das Datum steht unter dem Titel (im Figma
 * fehlt es, laut Task bleibt es); die Sponsor-Ueberschrift ist der erfasste
 * Name, nicht der feste Text "Durchfuehrung / Sponsor"; die Linie der
 * Fusszeile liegt oben, als Trennung zum Inhalt, nicht am Seitenende.
 */
export function EventLanding({
  event,
  organization,
  registration,
}: EventLandingProps) {
  return (
    <>
      <header className="border-muted border-b-2">
        <div className={cn(CONTAINER, 'flex h-24 items-center')}>
          {organization?.logoUrl ? (
            <Image
              src={organization.logoUrl}
              alt={organization.name}
              width={320}
              height={160}
              priority
              className="h-auto max-h-16 w-auto max-w-full"
            />
          ) : (
            organization && (
              <p className="text-2xl font-bold">{organization.name}</p>
            )
          )}
        </div>
      </header>

      <main className="flex-1">
        <EventContent event={event} registration={registration} />
      </main>

      <footer className="border-muted border-t-2">
        <div className={cn(CONTAINER, 'flex flex-col gap-8 py-12')}>
          {organization && <OrganizationContact organization={organization} />}
          <p className="text-muted-foreground text-sm">
            Erstellt mit{' '}
            <Link href="/" className="underline underline-offset-4">
              eoss Event Manager
            </Link>
          </p>
        </div>
      </footer>
    </>
  );
}

/**
 * Name links, Adresse und Kontakt rechts (Figma 144:1566); unter `md`
 * untereinander. Leere Angaben fallen weg -- eine Organisation ohne Kontakt
 * zeigt nur ihren Namen.
 */
function OrganizationContact({
  organization,
}: {
  organization: EventOrganization;
}) {
  const place = [organization.postalCode, organization.city]
    .filter(Boolean)
    .join(' ');
  const address = [
    organization.street,
    organization.addressAddition,
    place,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6 text-lg md:flex-row md:items-center md:justify-between">
      <p className="font-bold">{organization.name}</p>

      <div className="flex flex-col gap-6 sm:flex-row sm:gap-24">
        {address.length > 0 && (
          <address className="flex flex-col gap-1 not-italic">
            {address.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
        )}
        {(organization.contactEmail || organization.phone) && (
          <div className="flex flex-col gap-1">
            {organization.contactEmail && (
              <a
                href={`mailto:${organization.contactEmail}`}
                className="underline-offset-4 hover:underline"
              >
                {organization.contactEmail}
              </a>
            )}
            {organization.phone && (
              <a
                href={`tel:${organization.phone.replace(/[^+\d]/g, '')}`}
                className="underline-offset-4 hover:underline"
              >
                {organization.phone}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Gleiche Breite und Seitenraender fuer Kopfzeile, Inhalt und Fusszeile. */
const CONTAINER = 'mx-auto w-full max-w-[1512px] px-6 lg:px-12';

function EventContent({
  event,
  registration,
}: Pick<EventLandingProps, 'event' | 'registration'>) {
  return (
    <article className="flex w-full flex-col">
      {event.image_url && (
        <div className="relative aspect-[1512/289] w-full overflow-hidden">
          <Image
            src={event.image_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className={cn(CONTAINER, 'flex flex-col gap-12 py-12 lg:gap-24')}>
        <header className="flex flex-col gap-2">
          <h1 className="text-[2rem] leading-tight font-bold">{event.title}</h1>
          <p className="text-muted-foreground text-lg">
            {formatDate(event.date)}
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-24">
          <div className="text-lg whitespace-pre-line">
            {event.description || (
              <span className="text-muted-foreground">
                Keine Beschreibung vorhanden
              </span>
            )}
          </div>

          <section className="flex flex-col gap-6" aria-labelledby="anmeldung">
            <h2 id="anmeldung" className="text-2xl font-bold">
              Anmeldung
            </h2>
            {registration}
          </section>

          {/*
          Sponsor oder Ort: erscheint, wenn ein Name gesetzt ist -- es gibt
          bewusst keine Spalte `sponsor_enabled`, die dem widersprechen koennte.
        */}
          {event.sponsor_name && (
            <>
              <section className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold">{event.sponsor_name}</h2>
                {event.sponsor_text && (
                  <p className="text-lg whitespace-pre-line">
                    {event.sponsor_text}
                  </p>
                )}
              </section>
              {event.sponsor_image_url && (
                <div>
                  <Image
                    src={event.sponsor_image_url}
                    alt={event.sponsor_name}
                    width={320}
                    height={320}
                    className="h-auto max-h-32 w-auto max-w-full"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
