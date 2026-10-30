'use client';

import { useState, useTransition } from 'react';

import { MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  deleteParticipant,
  setParticipantStatus,
} from '@/features/participants/actions';
import {
  PARTICIPANT_STATUSES,
  statusLabel,
} from '@/features/participants/schema';
import type { ParticipantRow } from '@/features/participants/table';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Das ⋯-Menue einer Zeile: Status setzen und Loeschen. Weitere Aktionen kommen
 * hier dazu.
 *
 * Der Dialog liegt neben dem Menue, nicht darin: das Menue schliesst sich beim
 * Auswaehlen und naehme einen eingebetteten Dialog mit.
 */
export function RowActions({ participant }: { participant: ParticipantRow }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const changeStatus = (status: string) => {
    if (status === participant.status) return;
    startTransition(async () => {
      const result = await setParticipantStatus(
        participant.id,
        status,
        participant.event_id
      );
      if (result.error) toast.error(result.error);
      else toast.success(`Status: ${statusLabel(status)}`);
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await deleteParticipant(
        participant.id,
        participant.event_id
      );
      if (result.error) toast.error(result.error);
      else toast.success('Teilnehmer gelöscht');
      setConfirmOpen(false);
    });
  };

  const who = participant.name
    ? `${participant.name} (${participant.email})`
    : participant.email;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Aktionen für ${participant.email}`}
            disabled={pending}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={participant.status}
            onValueChange={changeStatus}
          >
            {PARTICIPANT_STATUSES.map((status) => (
              <DropdownMenuRadioItem key={status} value={status}>
                {statusLabel(status)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2 />
            Löschen …
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Teilnehmer wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Anmeldung von {who} wird endgültig entfernt. Das lässt sich
              nicht rückgängig machen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              // Nicht schliessen, bevor die Action durch ist -- sonst
              // verschwindet ein Fehler mit dem Dialog.
              onClick={(event) => {
                event.preventDefault();
                remove();
              }}
              disabled={pending}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
