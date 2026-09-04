'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { deleteEventAction } from '@/features/events/actions';

import { EditEventForm } from '@/components/forms/edit-event-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { type Event } from '@/db/schema/events';

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

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Event bearbeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <EditEventForm event={event} setIsEditing={setIsEditing} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            {event.imageUrl && (
              <div className="flex flex-col items-center justify-center">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  width={500}
                  height={500}
                  className="h-auto w-full"
                />
              </div>
            )}
            <CardTitle className="text-3xl">{event.title}</CardTitle>
            <CardDescription className="mt-2">
              <div className="space-y-1">
                <p className="text-base">
                  <span className="font-medium">Datum:</span>{' '}
                  {event.date.toLocaleDateString()}
                </p>
              </div>
            </CardDescription>
          </div>
          {!clientView && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Event bearbeiten
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteEventAction(event.id);
                  router.push('/events');
                }}
              >
                Event löschen
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-2 font-semibold">Beschreibung</h3>
          <p className="text-gray-600">
            {event.description || 'No description provided'}
          </p>
        </div>
        {!clientView && (
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-4 font-semibold">Event Timeline</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Erstellt:</span>{' '}
                {event.createdAt.toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Zuletzt aktualisisert:</span>{' '}
                {event.updatedAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
