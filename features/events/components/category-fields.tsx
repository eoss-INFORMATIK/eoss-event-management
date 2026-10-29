'use client';

import { Plus, X } from 'lucide-react';
import { type UseFormReturn, useFieldArray } from 'react-hook-form';

import { DEFAULT_CATEGORY_LABEL } from '@/features/events/categories';
import type { EventFormValues } from '@/features/events/schema';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

type CategoryFieldsProps = {
  form: UseFormReturn<EventFormValues>;
};

/**
 * Die Werte, die der Teilnehmer bei der Anmeldung waehlen kann.
 *
 * Im Figma steht hier ein Select mit "Option 1 / Option 2 / Option 3". Das ist
 * das Ergebnis, nicht das Erfassen -- ein Dropdown sieht nicht nach Eingabe
 * aus, und wo der Organisator die Werte eintippt, war dort nicht gezeichnet.
 * Gebaut ist es deshalb als Liste von Textfeldern: dieselbe Absicht, ehrlicher
 * dargestellt.
 */
export const CategoryFields = ({ form }: CategoryFieldsProps) => {
  const enabled = form.watch('categoriesEnabled');

  // `useFieldArray` statt eines eigenen Zustands: react-hook-form haelt damit
  // Validierungsfehler an der richtigen Zeile, auch wenn dazwischen eine
  // geloescht wird.
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'categories',
  });

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="categoriesEnabled"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);

                  // Einschalten mit leerer Liste gibt sofort eine Zeile zum
                  // Tippen -- ohne die stuende da ein eingeschalteter Block
                  // ohne jede Eingabemoeglichkeit.
                  if (checked && fields.length === 0) append({ label: '' });
                }}
              />
            </FormControl>
            <FormLabel className="font-bold">Kategorien</FormLabel>
          </FormItem>
        )}
      />

      {enabled && (
        <>
          <FormField
            control={form.control}
            name="categoryLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beschriftung des Feldes</FormLabel>
                <FormControl>
                  <Input
                    placeholder={DEFAULT_CATEGORY_LABEL}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-2">
            <FormLabel>Auswahlwerte</FormLabel>

            {fields.map((item, index) => (
              <FormField
                key={item.id}
                control={form.control}
                name={`categories.${index}.label`}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          placeholder="z. B. Einzelperson"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Wert ${index + 1} entfernen`}
                        onClick={() => remove(index)}
                      >
                        <X />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              className="self-start"
              onClick={() => append({ label: '' })}
            >
              <Plus />
              Wert hinzufügen
            </Button>

            <FormField
              control={form.control}
              name="categories"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="categoryRequired"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Angabe ist Pflicht</FormLabel>
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
};
