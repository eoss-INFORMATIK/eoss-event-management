'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { sendConfirmationEmail } from '@/features/email/actions';
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

export function EventRegistrationForm({ eventId }: { eventId: string }) {
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

    // A failed confirmation mail does not undo the registration.
    await sendConfirmationEmail(
      values.name || '',
      'Anmeldung bestätigt',
      values.email,
      eventId
    );
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="E-Mail" {...field} />
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
                <Input
                  placeholder="Name"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Registrieren
        </Button>
      </form>
    </Form>
  );
}
