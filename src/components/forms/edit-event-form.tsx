'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { type Event, InsertEventSchema } from '@/db/schema/events';

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
import { Textarea } from '@/components/ui/textarea';

import { editEventAction } from '@/server/event-actions';

interface EditEventFormProps {
  event: Event;
  onCancel: () => void;
}

export function EditEventForm({ event, onCancel }: EditEventFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string>('');

  const form = useForm<z.infer<typeof InsertEventSchema>>({
    resolver: zodResolver(InsertEventSchema),
    defaultValues: {
      title: event.title,
      description: event.description || '',
      date: event.date,
    },
  });

  const handleSubmit = async (values: z.infer<typeof InsertEventSchema>) => {
    const result = await editEventAction(event.id, values);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
    onCancel();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-500 rounded-md p-3">{error}</div>
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter event title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter event description"
                  className="resize-none"
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
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Datum</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                  value={
                    field.value instanceof Date
                      ? field.value.toISOString().split('T')[0]
                      : ''
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button type="submit">Änderungen speichern</Button>
        </div>
      </form>
    </Form>
  );
}
