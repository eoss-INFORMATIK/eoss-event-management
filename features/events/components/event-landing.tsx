import Image from 'next/image';
import type { ReactNode } from 'react';

import { formatDate } from '@/lib/format';
import type { Event } from '@/types';

interface EventLandingProps {
  event: Event;
  /** Das Anmeldeformular -- kommt aus `features/participants`, deshalb als Slot. */
  registration: ReactNode;
}

/**
 * Oeffentliche Seite eines Events (Figma "Event Usersicht", 142:1309).
 *
 * Zwei Spalten, die sich durch die ganze Seite ziehen: links Beschreibung und
 * Sponsor/Ort, rechts Anmeldung und das Sponsor-Bild. Unter `lg` untereinander.
 *
 * Abweichungen vom Figma, bewusst: das Datum steht unter dem Titel (im Figma
 * fehlt es, laut Task bleibt es); die Sponsor-Ueberschrift ist der erfasste
 * Name, nicht der feste Text "Durchfuehrung / Sponsor".
 */
export function EventLanding({ event, registration }: EventLandingProps) {
  return (
    <article className="flex w-full flex-col gap-12 lg:gap-24">
      {event.image_url && (
        // Volle Fensterbreite, obwohl `main` auf max-w-7xl begrenzt ist: der
        // Streifen bricht nach links und rechts aus und schliesst oben an die
        // Navigation an (`-mt-10` hebt das `py-10` von `main` auf).
        <div className="relative -mt-10 ml-[calc(50%-50vw)] aspect-[1512/289] w-screen overflow-hidden">
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
    </article>
  );
}
