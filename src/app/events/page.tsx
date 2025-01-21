import Image from 'next/image';
import Link from 'next/link';

import { AddEventButton } from '@/components/add-event-button';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { getUserEventsAction } from '@/server/event-actions';

export default async function EventsPage() {
  const { events, error } = await getUserEventsAction();

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 text-red-500 rounded-md p-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meine Events</h1>
        <AddEventButton />
      </div>

      {events?.length === 0 ? (
        <div className="text-gray-500 text-center">
          <p>Bist jetzt hast du noch keine Events erstellt.</p>
          <h2>Erstelle jetzt dein erstes Event!</h2>
          <AddEventButton />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events?.map((event) => (
            <Card key={event.id} className="flex flex-col justify-end">
              <CardHeader>
                {event.imageUrl && (
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
                    width={250}
                    height={250}
                    className="h-auto w-full"
                  />
                )}
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>
                  <p>Datum: {event.date.toLocaleDateString('de-CH')}</p>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  {event.description || 'No description provided'}
                </p>
              </CardContent>
              <CardFooter className="flex flex-row gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/events/${event.id}`}>Details</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/events/${event.id}/admin`}>Teilnehmer</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
