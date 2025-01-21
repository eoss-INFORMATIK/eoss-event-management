'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { PutBlobResult } from '@vercel/blob';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof InsertEventSchema>>({
    resolver: zodResolver(InsertEventSchema),
    defaultValues: {
      title: event.title,
      description: event.description || '',
      date: event.date,
      imageUrl: event.imageUrl || '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof InsertEventSchema>) => {
    try {
      const file = fileInputRef.current?.files?.[0];
      let imageUrl = event.imageUrl || '';

      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/event/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const blob = (await response.json()) as PutBlobResult;
        imageUrl = blob.url;
      }

      const result = await editEventAction(event.id, {
        ...values,
        imageUrl: imageUrl,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push('/events');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
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
        <div className="flex justify-center">
          {event.imageUrl && (
            <Image
              src={event.imageUrl}
              alt="Event Image"
              width={300}
              height={300}
            />
          )}
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field: { ...field } }) => (
              <FormItem>
                <FormLabel>Add Image</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    {...{ ...field, ref: fileInputRef }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
