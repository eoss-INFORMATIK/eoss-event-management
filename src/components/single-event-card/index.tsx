import Image from 'next/image';
import Link from 'next/link';

import { type Event } from '@/db/schema/events';

import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';

interface SingleEventCardProps {
  event: Event;
}

export const SingleEventCard = ({ event }: SingleEventCardProps) => {
  return (
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
          <Link href={`/events/${event.id}`}>Ansicht</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/events/${event.id}/admin`}>Event Admin</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
