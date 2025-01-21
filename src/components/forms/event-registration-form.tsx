'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { InsertEventParticipantSchema } from '@/db/schema/eventParticipants';

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

import { addEventParticipantAction } from '@/server/eventParticipantActions';

export function EventRegistrationForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>('');

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
    try {
      const result = await addEventParticipantAction(values, eventId);
      if (result.error) {
        setError(result.error);
        return;
      }

      router.push(`/events/${eventId}`);
      router.refresh();
    } catch (error) {
      setError('An error occurred while submitting the form');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          (values) => {
            console.log('Form submitted with values:', values);
            handleSubmit(values);
          },
          (errors) => {
            console.log('Validation errors:', errors);
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
