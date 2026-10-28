'use client';

import type { RefObject } from 'react';

import type { UseFormReturn } from 'react-hook-form';

import type { EventFormValues } from '@/features/events/schema';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type SponsorFieldsProps = {
  form: UseFormReturn<EventFormValues>;
  fileInputRef: RefObject<HTMLInputElement | null>;
};

/**
 * Der optionale Sponsor- oder Ortsblock, geteilt von Anlegen und Bearbeiten.
 *
 * Heisst "Sponsor oder Ort", nicht nur "Sponsor": der Task nennt beides, Figma
 * beschriftet nur den Sponsor -- und dann findet niemand den
 * Durchfuehrungsort.
 *
 * Das Bild liegt wie das Eventbild ausserhalb des Formularzustands: hier eine
 * Datei, nach dem Hochladen eine URL. Zwei Gestalten fuer ein Feld sind genau
 * das, woran das alte Schema jedes Event mit Bild abgelehnt hat.
 */
export const SponsorFields = ({ form, fileInputRef }: SponsorFieldsProps) => {
  const enabled = form.watch('sponsorEnabled');

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="sponsorEnabled"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);

                  // Ausschalten verwirft den Inhalt sofort, statt ihn
                  // unsichtbar weiterzutragen. Sonst erscheint er beim
                  // naechsten Einschalten wieder, ohne dass jemand ihn
                  // eingegeben hat.
                  if (!checked) {
                    form.setValue('sponsorName', '');
                    form.setValue('sponsorText', '');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }
                }}
              />
            </FormControl>
            <FormLabel className="font-bold">Sponsor oder Ort</FormLabel>
          </FormItem>
        )}
      />

      {enabled && (
        <>
          <FormField
            control={form.control}
            name="sponsorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sponsorText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zusatztext</FormLabel>
                <FormControl>
                  <Textarea
                    className="resize-none"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <label htmlFor="sponsor-image" className="text-sm font-medium">
              Bild
            </label>
            <Input
              id="sponsor-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              ref={fileInputRef}
            />
          </div>
        </>
      )}
    </div>
  );
};
