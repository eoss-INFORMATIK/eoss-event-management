'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { PutBlobResult } from '@vercel/blob';
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof InsertEventSchema>>({
    resolver: zodResolver(InsertEventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: new Date(),
      imageUrl: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof InsertEventSchema>) => {
    try {
      setIsUploading(true);
      let imageUrl = '';

      const file = fileInputRef.current?.files?.[0];

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

      const result = await addEventAction({
        ...values,
        imageUrl: imageUrl,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push('/events');
      router.refresh();
    } catch (error) {
      setError('An error occurred while submitting the form');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {isUploading && <p>Uploading...</p>}
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
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Add Image</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    onChange(file);
                  }}
                  {...{ ...field, ref: fileInputRef }}
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

        <Button type="submit" className="w-full" disabled={isUploading}>
          Create Event
        </Button>
      </form>
    </Form>
  );
}
