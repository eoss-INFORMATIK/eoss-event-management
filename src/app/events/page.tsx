import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { getUserEventsAction } from '@/server/eventActions';

export default async function EventsPage() {
  const { events, error } = await getUserEventsAction();

  console.log(events, error);
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 text-red-500 rounded-md p-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Events</h1>
        <Button asChild>
          <Link href="/add-event">Create New Event</Link>
        </Button>
      </div>

      {events?.length === 0 ? (
        <div className="text-gray-500 text-center">
          <p>You haven&apos;t created any events yet.</p>
          <p>Click the button above to create your first event!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events?.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>
                  {event.date.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  {event.description || 'No description provided'}
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/events/${event.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
