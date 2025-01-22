'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { InsertEventParticipantSchema } from '@/db/schema/event-participants';

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

import { sendConfirmationEmailAction } from '@/server/email-actions';
import { addEventParticipantAction } from '@/server/event-participant-actions';

export function EventRegistrationForm({ eventId }: { eventId: string }) {
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  const form = useForm<z.infer<typeof InsertEventParticipantSchema>>({
    resolver: zodResolver(InsertEventParticipantSchema),
    defaultValues: {
      email: '',
      name: '',
      eventId: eventId,
    },
  });

  const handleSubmit = async (
    values: z.infer<typeof InsertEventParticipantSchema>
  ) => {
    setStatus('loading');
    try {
      const result = await addEventParticipantAction(values, eventId);
      if (result.error) {
        setError(result.error);
        console.error(result.error);
        return;
      } else {
        setStatus('success');
        await sendConfirmationEmailAction(
          values.name || '',
          'Event Registration',
          values.email,
          eventId
        );
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setError('An error occurred while submitting the form');
    }
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
      <form
        onSubmit={form.handleSubmit(
          (values) => {
            handleSubmit(values);
          },
          (errors) => {
            console.error(errors);
          }
        )}
        className="space-y-6"
      >
        {error && (
          <div className="bg-red-50 text-red-500 rounded-md p-3">{error}</div>
        )}

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
