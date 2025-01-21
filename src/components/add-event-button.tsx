import Link from 'next/link';

import { CirclePlus } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const AddEventButton = () => {
  return (
    <Button asChild>
      <Link href="/add-event">
        <CirclePlus />
        Neuer Event
      </Link>
    </Button>
  );
};
