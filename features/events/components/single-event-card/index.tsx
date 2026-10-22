import Image from 'next/image';
import Link from 'next/link';

import { Surface } from '@/components/surface';
import { Button } from '@/components/ui/button';

import { formatDate } from '@/lib/format';
import type { Event } from '@/types';

interface SingleEventCardProps {
  event: Event;
}

export const SingleEventCard = ({ event }: SingleEventCardProps) => {
  const actions = [
    { href: `/events/${event.id}`, label: 'Ansicht' },
    { href: `/events/${event.id}/admin`, label: 'Event Admin' },
  ];

  return (
    <Surface className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        {event.image_url && (
          <div className="relative">
            <Image
              src={event.image_url}
              alt={event.title}
              width={250}
              height={250}
              className="h-auto w-full rounded-lg"
            />
            {/* Halbtransparent plus backdrop-blur, weil darunter ein beliebiges
                Foto liegt -- ohne das sind die Beschriftungen auf hellen
                Bildern nicht lesbar. */}
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              {actions.map(({ href, label }) => (
                <Button
                  key={href}
                  asChild
                  size="sm"
                  variant="outline"
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <Link href={href}>{label}</Link>
                </Button>
              ))}
            </div>
          </div>
        )}
        <h2 className="leading-none font-semibold">{event.title}</h2>
        <p className="text-muted-foreground text-sm">
          Datum: {formatDate(event.date)}
        </p>
      </div>

      <p className="text-muted-foreground text-sm">
        {event.description || 'Keine Beschreibung vorhanden'}
      </p>

      {/* Ohne Bild gibt es nichts, worueber die Buttons schweben koennten --
          dann stehen sie unten, aber als Reihe statt als Spalte. */}
      {!event.image_url && (
        <div className="flex gap-2">
          {actions.map(({ href, label }) => (
            <Button key={href} asChild variant="outline" className="flex-1">
              <Link href={href}>{label}</Link>
            </Button>
          ))}
        </div>
      )}
    </Surface>
  );
};
