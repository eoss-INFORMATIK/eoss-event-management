'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Pencil, Trash } from 'lucide-react';
import { toast } from 'sonner';

import { deleteEvent } from '@/features/events/actions';
import { QrCodeButton } from '@/features/events/components/qr-code-button';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface EventAdminActionsProps {
  eventId: string;
  title: string;
  /** Oeffentliche URL des Events, fuer den QR-Code. */
  publicUrl: string;
  /** Fuer die Rueckfrage: Loeschen kaskadiert auf alle Anmeldungen. */
  participantCount: number;
}

/**
 * Die Aktionen der Admin-Ansicht, rechts in der Leiste neben "zu allen
 * Events". Weitere (Teilnehmer hinzufuegen) kommen hier dazu.
 *
 * Bearbeiten ist ein Link auf `/events/[id]/edit`, kein Zustand -- so braucht
 * die Leiste nichts mit der Event-Karte darunter zu teilen.
 */
export function EventAdminActions({
  eventId,
  title,
  publicUrl,
  participantCount,
}: EventAdminActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Erst nach Erfolg weg -- vorher navigierte die Seite, ohne auf das Ergebnis
  // zu warten, und ein Fehler blieb unsichtbar.
  const remove = () =>
    startTransition(async () => {
      const result = await deleteEvent(eventId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Event gelöscht');
      router.push('/events');
    });

  return (
    <div className="flex gap-2">
      <QrCodeButton url={publicUrl} title={title} />
      <Button variant="outline" size="icon" asChild>
        <Link href={`/events/${eventId}/edit`} aria-label="Event bearbeiten">
          <Pencil />
        </Link>
      </Button>
      <Button
        variant="destructive"
        size="icon"
        aria-label="Event löschen"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash />
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Event wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {participantCount === 0
                ? `„${title}“ wird endgültig entfernt.`
                : `„${title}“ und ${participantCount === 1 ? 'eine Anmeldung' : `${participantCount} Anmeldungen`} werden endgültig entfernt.`}{' '}
              Das lässt sich nicht rückgängig machen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                remove();
              }}
              disabled={pending}
            >
              {pending ? 'Wird gelöscht…' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
