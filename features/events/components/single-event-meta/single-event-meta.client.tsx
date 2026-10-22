'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Pencil, Trash } from 'lucide-react';

import { deleteEvent } from '@/features/events/actions';
import { EditEventForm } from '@/features/events/components/edit-event-form';

import { Surface } from '@/components/surface';
import { Button } from '@/components/ui/button';

import { formatDate } from '@/lib/format';
import type { Event } from '@/types';

interface SingleEventMetaClientProps {
  event: Event;
  clientView: boolean;
}

export function SingleEventMetaClient({
  event,
  clientView,
}: SingleEventMetaClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  const router = useRouter();

  // Einmal definiert, zweimal platziert: ueber dem Bild, oder -- wenn es keines
  // gibt -- oben rechts neben dem Titel. Nur der Rahmen unterscheidet sich,
  // damit die beiden Varianten nicht auseinanderlaufen.
  // aria-label ist bei reinen Icon-Buttons Pflicht, sonst meldet ein
  // Screenreader nur "Button".
  const actions = !clientView && (
    <>
      <Button
        variant="outline"
        size="icon"
        aria-label="Event bearbeiten"
        onClick={() => setIsEditing(true)}
      >
        <Pencil />
      </Button>
      <Button
        variant="destructive"
        size="icon"
        aria-label="Event löschen"
        onClick={() => {
          deleteEvent(event.id);
          router.push('/events');
        }}
      >
        <Trash />
      </Button>
    </>
  );

  if (isEditing) {
    return (
      <Surface className="flex flex-col gap-6 p-6">
        <h2 className="text-xl leading-none font-semibold">Event bearbeiten</h2>
        <EditEventForm event={event} setIsEditing={setIsEditing} />
      </Surface>
    );
  }

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
              {actions && (
                // Nicht die Buttons sind halbtransparent, sondern der Container
                // darum -- so behaelt das Rot des Loeschen-Buttons seine
                // Signalwirkung.
                <div className="bg-background/70 absolute top-2 right-2 z-10 flex gap-2 rounded-lg p-1 backdrop-blur-sm">
                  {actions}
                </div>
              )}
            </div>
          )}
          <h2 className="text-3xl leading-none font-semibold">{event.title}</h2>
          <p className="text-muted-foreground text-base">
            <span className="font-medium">Datum:</span> {formatDate(event.date)}
          </p>
        </div>
        {!event.image_url && actions && (
          <div className="flex gap-2">{actions}</div>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Beschreibung</h3>
        <p className="text-muted-foreground">
          {event.description || 'Keine Beschreibung vorhanden'}
        </p>
      </div>

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
