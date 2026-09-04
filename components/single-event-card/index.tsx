import Image from 'next/image';
import Link from 'next/link';

import { formatDate } from '@/lib/format';
import type { Event } from '@/types/database';

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
        {event.image_url && (
          <Image
            src={event.image_url}
            alt={event.title}
            width={250}
            height={250}
            className="h-auto w-full"
          />
        )}
        <CardTitle>{event.title}</CardTitle>
        <CardDescription>
          <p>Datum: {formatDate(event.date)}</p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          {event.description || 'Keine Beschreibung vorhanden'}
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
