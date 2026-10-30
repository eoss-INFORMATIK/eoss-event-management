import { Ticket } from 'lucide-react';

import { Surface } from '@/components/surface';

/**
 * Ziel des QR-Codes in der Bestaetigungsmail (TASK-51).
 *
 * Heute nur ein Hinweis, damit ein Teilnehmer, der seinen eigenen Code
 * scannt, keine 404 sieht. Die Seite liest bewusst nichts: der Check-in --
 * Admin scannt, Teilnehmer wird "Teilgenommen" -- ist ein eigener Task und
 * kommt hierher, hinter eine Anmeldung.
 */
export default function TicketPage() {
  return (
    <Surface className="m-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <Ticket className="size-12" aria-hidden />
      <h1 className="text-2xl font-bold">Ihr Ticket</h1>
      <p className="text-muted-foreground">
        Bitte zeigen Sie den QR-Code aus Ihrer Bestätigungsmail am Eingang vor.
      </p>
    </Surface>
  );
}
