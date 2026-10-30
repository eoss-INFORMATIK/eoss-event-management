'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { addParticipant } from '@/features/participants/actions';
import {
  type ParticipantFormValues,
  participantFormSchema,
} from '@/features/participants/schema';

import { ErrorMessage } from '@/components/error-message';
import { Button } from '@/components/ui/button';
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

type EventRegistrationFormProps = {
  eventId: string;
  /** Leer, wenn das Event keine Kategorien anbietet. */
  categories: { id: string; label: string }[];
  categoryLabel: string;
  categoryRequired: boolean;
};

// Feldstil der Landingpage (Figma "Forms"): hoch, stark gerundet. Hintergrund
// transparent wie die shadcn-Vorgabe ueberall sonst -- keine eigene Farbe, die
// auf dem weissen Rahmen der Landingpage als Markenton auffiele.
const LABEL = 'text-lg font-normal';
const FIELD = 'border-muted h-12 rounded-2xl px-4 text-lg md:text-lg';

export function EventRegistrationForm({
  eventId,
  categories,
  categoryLabel,
  categoryRequired,
}: EventRegistrationFormProps) {
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  const form = useForm<ParticipantFormValues>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      email: '',
      name: '',
    },
  });

  const handleSubmit = async (values: ParticipantFormValues) => {
    setStatus('loading');
    setError('');

    const result = await addParticipant(values, eventId);

    if (result.error) {
      // Back to 'idle', not 'error': the form stays on screen so the message
      // is visible and the user can correct the entry.
      setStatus('idle');
      setError(result.error);
      return;
    }

    setStatus('success');
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'success') {
    return <div>Vielen Dank für deine Anmeldung!</div>;
  }

  if (status === 'error') {
    return <div>Error! {error}</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL}>Name</FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  className={FIELD}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL}>E-Mail *</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  className={FIELD}
                  {...field}
                />
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
                <FormLabel className={LABEL}>
                  {categoryLabel}
                  {categoryRequired && ' *'}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger
                      className={`${FIELD} w-full data-[size=default]:h-12`}
                    >
                      <SelectValue placeholder="Bitte wählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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

        <Button
          type="submit"
          className="h-auto rounded-full px-12 py-3 text-lg font-normal"
        >
          Anmelden
        </Button>
      </form>
    </Form>
  );
}
