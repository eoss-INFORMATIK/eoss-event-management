'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { type Event } from '@/db/schema/events';

import { EditEventForm } from '@/components/forms/edit-event-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { deleteEventAction } from '@/server/eventActions';

interface SingleEventMetaClientProps {
  event: Event;
}

export function SingleEventMetaClient({ event }: SingleEventMetaClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  const router = useRouter();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
    }).format(date);
  };

  if (isEditing) {
    return (
      <div className="container mx-auto p-6">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle className="text-3xl">Edit Event</CardTitle>
          </CardHeader>
          <CardContent>
            <EditEventForm event={event} onCancel={() => setIsEditing(false)} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="default" className="mb-4" asChild>
          <Link href="/events">← Back to Events</Link>
        </Button>
      </div>
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">{event.title}</CardTitle>
              <CardDescription className="mt-2">
                <div className="space-y-1">
                  <p className="text-base">
                    <span className="font-medium">Start:</span>{' '}
                    {formatDate(event.date)}
                  </p>
                </div>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Event
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
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-2 font-semibold">Description</h3>
            <p className="text-gray-600">
              {event.description || 'No description provided'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="mb-4 font-semibold">Event Timeline</h3>
            <div className="text-gray-600 space-y-2 text-sm">
              <p>
                <span className="font-medium">Created:</span>{' '}
                {formatDate(event.createdAt)}
              </p>
              <p>
                <span className="font-medium">Last Updated:</span>{' '}
                {formatDate(event.updatedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
