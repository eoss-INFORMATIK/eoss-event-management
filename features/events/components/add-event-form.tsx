'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { addEvent } from '@/features/events/actions';
import { SponsorFields } from '@/features/events/components/sponsor-fields';
import {
  type EventFormValues,
  eventFormSchema,
} from '@/features/events/schema';
import { uploadEventImage } from '@/features/events/upload';

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
import { Textarea } from '@/components/ui/textarea';

export function AddEventForm() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sponsorFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      date: new Date(),
      sponsorEnabled: false,
      sponsorName: '',
      sponsorText: '',
    },
  });

  const handleSubmit = async (values: EventFormValues) => {
    setError('');
    setIsSubmitting(true);

    try {
      let imageUrl = '';
      const file = fileInputRef.current?.files?.[0];

      if (file) {
        const upload = await uploadEventImage(file);
        if (upload.error) {
          setError(upload.error);
          return;
        }
        imageUrl = upload.url ?? '';
      }

      let sponsorImageUrl = '';
      const sponsorFile = sponsorFileInputRef.current?.files?.[0];

      if (values.sponsorEnabled && sponsorFile) {
        const upload = await uploadEventImage(sponsorFile);
        if (upload.error) {
          setError(upload.error);
          return;
        }
        sponsorImageUrl = upload.url ?? '';
      }

      const result = await addEvent({ ...values, imageUrl, sponsorImageUrl });

      if (result.error) {
        setError(result.error);
        return;
      }

      toast.success('Event erfolgreich erstellt');
      router.push('/events');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titel</FormLabel>
              <FormControl>
                <Input placeholder="Titel des Events" {...field} />
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
                  placeholder="Beschreibung des Events"
                  className="resize-none"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/*
          The image is deliberately outside the form state: it is a File here
          and a URL after upload. Keeping it in the schema is what made the old
          form reject every event that had an image attached.
        */}
        <div className="space-y-2">
          <label htmlFor="event-image" className="text-sm font-medium">
            Bild
          </label>
          <Input
            id="event-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            ref={fileInputRef}
          />
        </div>

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
                    field.value instanceof Date && !isNaN(field.value.getTime())
                      ? field.value.toISOString().split('T')[0]
                      : ''
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SponsorFields form={form} fileInputRef={sponsorFileInputRef} />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Wird erstellt…' : 'Event erstellen'}
        </Button>
      </form>
    </Form>
  );
}
