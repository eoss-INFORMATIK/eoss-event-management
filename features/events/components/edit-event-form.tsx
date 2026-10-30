'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { editEvent } from '@/features/events/actions';
import type { EventCategory } from '@/features/events/categories';
import { CategoryFields } from '@/features/events/components/category-fields';
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

import type { Event } from '@/types';

interface EditEventFormProps {
  event: Event;
  categories: EventCategory[];
}

export function EditEventForm({ event, categories }: EditEventFormProps) {
  const router = useRouter();
  const adminPath = `/events/${event.id}/admin`;
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sponsorFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event.title,
      description: event.description ?? '',
      date: new Date(event.date),
      // Gesetzter Name = der Block ist an. Es gibt keine eigene Spalte dafuer,
      // und genau deshalb kann hier nichts auseinanderlaufen.
      sponsorEnabled: Boolean(event.sponsor_name),
      sponsorName: event.sponsor_name ?? '',
      sponsorText: event.sponsor_text ?? '',
      // Gleiche Ableitung wie beim Sponsor: eingeschaltet heisst, es gibt
      // Werte. Keine eigene Spalte, die dem widersprechen koennte.
      categoriesEnabled: categories.length > 0,
      categoryLabel: event.category_label ?? '',
      categoryRequired: event.category_required,
      categories: categories.map(({ id, label }) => ({ id, label })),
    },
  });

  const handleSubmit = async (values: EventFormValues) => {
    setError('');
    setIsSubmitting(true);

    try {
      let imageUrl = event.image_url ?? '';
      const file = fileInputRef.current?.files?.[0];

      if (file) {
        const upload = await uploadEventImage(file);
        if (upload.error) {
          setError(upload.error);
          return;
        }
        imageUrl = upload.url ?? '';
      }

      let sponsorImageUrl = event.sponsor_image_url ?? '';
      const sponsorFile = sponsorFileInputRef.current?.files?.[0];

      if (values.sponsorEnabled && sponsorFile) {
        const upload = await uploadEventImage(sponsorFile);
        if (upload.error) {
          setError(upload.error);
          return;
        }
        sponsorImageUrl = upload.url ?? '';
      }

      const result = await editEvent(event.id, {
        ...values,
        imageUrl,
        sponsorImageUrl,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      toast.success('Event erfolgreich bearbeitet');
      router.push(adminPath);
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
        <div className="flex items-start justify-center gap-4">
          {event.image_url && (
            <Image
              src={event.image_url}
              alt={event.title}
              width={300}
              height={300}
            />
          )}
          {/* Outside the form state on purpose -- see add-event-form. */}
          <div className="space-y-2">
            <label htmlFor="event-image" className="text-sm font-medium">
              Bild ersetzen
            </label>
            <Input
              id="event-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              ref={fileInputRef}
            />
          </div>
        </div>
        <SponsorFields form={form} fileInputRef={sponsorFileInputRef} />

        <CategoryFields form={form} />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href={adminPath}>Abbrechen</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Wird gespeichert…' : 'Änderungen speichern'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
