'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { InsertEventSchema } from '@/db/schema/events';

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

import { addEventAction } from '@/server/event-actions';

export function AddEventForm() {
  const router = useRouter();
  const [error, setError] = useState<string>('');

  const form = useForm<z.infer<typeof InsertEventSchema>>({
    resolver: zodResolver(InsertEventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: new Date(),
    },
  });

  const handleSubmit = async (values: z.infer<typeof InsertEventSchema>) => {
    try {
      const result = await addEventAction(values); // Server action will handle adding organizer_id

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push('/events');
      router.refresh();
    } catch (error) {
      setError('An error occurred while submitting the form');
      console.error(error);
    }
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
              <FormLabel>Event Title</FormLabel>
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
              <FormLabel>Description</FormLabel>
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

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <Button type="submit" className="w-full">
          Create Event
        </Button>
      </form>
    </Form>
  );
}
