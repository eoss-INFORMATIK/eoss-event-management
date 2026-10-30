'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { updateOrganization } from '@/features/organizations/actions';
import {
  type OrganizationFormValues,
  organizationFormSchema,
} from '@/features/organizations/schema';

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

import type { Organization } from '@/types';

type OrganizationFormProps = {
  organization: Organization;
};

/** Die optionalen Felder in Formularreihenfolge, mit Beschriftung. */
const CONTACT_FIELDS = [
  { name: 'street', label: 'Strasse', autoComplete: 'address-line1' },
  {
    name: 'addressAddition',
    label: 'Adresszusatz',
    autoComplete: 'address-line2',
  },
  { name: 'postalCode', label: 'PLZ', autoComplete: 'postal-code' },
  { name: 'city', label: 'Ort', autoComplete: 'address-level2' },
  {
    name: 'contactEmail',
    label: 'E-Mail',
    autoComplete: 'email',
    type: 'email',
  },
  { name: 'phone', label: 'Telefon', autoComplete: 'tel', type: 'tel' },
] as const satisfies readonly {
  name: Exclude<keyof OrganizationFormValues, 'name'>;
  label: string;
  autoComplete: string;
  type?: string;
}[];

export const OrganizationForm = ({ organization }: OrganizationFormProps) => {
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: organization.name,
      street: organization.street ?? '',
      addressAddition: organization.address_addition ?? '',
      postalCode: organization.postal_code ?? '',
      city: organization.city ?? '',
      contactEmail: organization.contact_email ?? '',
      phone: organization.phone ?? '',
    },
  });

  const handleSubmit = async (values: OrganizationFormValues) => {
    setError('');
    setIsSubmitting(true);

    try {
      const result = await updateOrganization(organization.id, values);

      if (result.error) {
        setError(result.error);
        return;
      }

      form.reset(values);
      toast.success('Organisation gespeichert');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex max-w-sm flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name der Organisation</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <fieldset className="mt-4 flex flex-col gap-4">
          <legend className="text-lg font-semibold">
            Öffentlicher Kontakt
          </legend>
          {/* Kein FormDescription: das braucht den Kontext eines FormField. */}
          <p className="text-muted-foreground text-sm">
            Diese Angaben erscheinen öffentlich in der Fusszeile deiner
            Event-Seiten. Alle Felder sind optional.
          </p>

          {CONTACT_FIELDS.map((contactField) => (
            <FormField
              key={contactField.name}
              control={form.control}
              name={contactField.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{contactField.label}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type={'type' in contactField ? contactField.type : 'text'}
                      autoComplete={contactField.autoComplete}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </fieldset>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting ? 'Speichert…' : 'Speichern'}
        </Button>
      </form>
    </Form>
  );
};
