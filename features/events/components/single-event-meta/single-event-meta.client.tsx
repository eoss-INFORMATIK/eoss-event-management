'use client';

import Image from 'next/image';

import { Surface } from '@/components/surface';

import { formatDate } from '@/lib/format';
import type { Event } from '@/types';

interface SingleEventMetaClientProps {
  event: Event;
  /** Oeffentliche Ansicht: ohne Timeline. Die Aktionen stehen in der Leiste der Admin-Seite. */
  clientView: boolean;
}

export function SingleEventMetaClient({
  event,
  clientView,
}: SingleEventMetaClientProps) {
  return (
    <Surface className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {event.image_url && (
            <div className="relative">
              <Image
                src={event.image_url}
                alt={event.title}
                width={500}
                height={500}
                className="h-auto w-full rounded-lg"
              />
            </div>
          )}
          <h2 className="text-3xl leading-none font-semibold">{event.title}</h2>
          <p className="text-muted-foreground text-base">
            <span className="font-medium">Datum:</span> {formatDate(event.date)}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Beschreibung</h3>
        <p className="text-muted-foreground">
          {event.description || 'Keine Beschreibung vorhanden'}
        </p>
      </div>

      {/*
        Sponsor oder Ort. Erscheint, wenn ein Name gesetzt ist -- es gibt
        bewusst keine Spalte `sponsor_enabled`, die dem widersprechen koennte.
        Die Darstellung ist fest, der Organisator bestimmt nur den Inhalt.
      */}
      {event.sponsor_name && (
        <div className="flex flex-col gap-3 border-t pt-6">
          <h3 className="font-semibold">Sponsor oder Ort</h3>
          <div className="flex items-start gap-4">
            {event.sponsor_image_url && (
              <Image
                src={event.sponsor_image_url}
                alt={event.sponsor_name}
                width={120}
                height={120}
                className="h-auto w-30 shrink-0 rounded-lg"
              />
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-lg font-medium">{event.sponsor_name}</p>
              {event.sponsor_text && (
                <p className="text-muted-foreground">{event.sponsor_text}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!clientView && (
        <div className="bg-muted rounded-lg p-4">
          <h3 className="mb-4 font-semibold">Event Timeline</h3>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              <span className="font-medium">Erstellt:</span>{' '}
              {formatDate(event.created_at)}
            </p>
            <p>
              <span className="font-medium">Zuletzt aktualisiert:</span>{' '}
              {formatDate(event.updated_at)}
            </p>
          </div>
        </div>
      )}
    </Surface>
  );
}
