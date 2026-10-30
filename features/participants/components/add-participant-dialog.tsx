'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { addParticipantAsOrganizer } from '@/features/participants/actions';
import {
  type OrganizerParticipantValues,
  PARTICIPANT_STATUSES,
  organizerParticipantSchema,
  statusLabel,
} from '@/features/participants/schema';

import { ErrorMessage } from '@/components/error-message';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/** Radix-Select kennt keinen leeren Wert -- "keine Kategorie" braucht einen. */
const NO_CATEGORY = '__none__';

interface AddParticipantDialogProps {
  eventId: string;
  /** Leer, wenn das Event keine Kategorien anbietet. */
  categories: { id: string; label: string }[];
  categoryLabel: string;
}

const defaultValues: OrganizerParticipantValues = {
  email: '',
  name: '',
  categoryId: undefined,
  status: 'registered',
};

/**
 * "+" in der Admin-Leiste: Teilnehmer von Hand erfassen, mit Status -- etwa
 * jemand, der vor Ort auftaucht ("Teilgenommen"), oder eine Einladung, die
 * ausserhalb des Systems verschickt wurde ("Eingeladen"). Es geht keine Mail
 * raus; das kommt mit dem Anmeldeflow.
 */
export function AddParticipantDialog({
  eventId,
  categories,
  categoryLabel,
}: AddParticipantDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<OrganizerParticipantValues>({
    resolver: zodResolver(organizerParticipantSchema),
    defaultValues,
  });

  const handleSubmit = async (values: OrganizerParticipantValues) => {
    setError('');
    const result = await addParticipantAsOrganizer(values, eventId);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(`${values.email} hinzugefügt`);
    form.reset(defaultValues);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset(defaultValues);
          setError('');
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Teilnehmer hinzufügen"
          title="Teilnehmer hinzufügen"
        >
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Teilnehmer hinzufügen</DialogTitle>
          <DialogDescription>
            Es wird keine E-Mail verschickt.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail *</FormLabel>
                  <FormControl>
                    <Input type="email" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {categories.length > 0 && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{categoryLabel}</FormLabel>
                    <Select
                      value={field.value ?? NO_CATEGORY}
                      onValueChange={(value) =>
                        field.onChange(
                          value === NO_CATEGORY ? undefined : value
                        )
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_CATEGORY}>
                          Keine Angabe
                        </SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PARTICIPANT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Wird hinzugefügt…'
                  : 'Hinzufügen'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
