'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { renameOrganization } from '@/features/organizations/actions';
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

type OrganizationFormProps = {
  organizationId: string;
  name: string;
};

export const OrganizationForm = ({
  organizationId,
  name,
}: OrganizationFormProps) => {
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: { name },
  });

  const handleSubmit = async (values: OrganizationFormValues) => {
    setError('');
    setIsSubmitting(true);

    try {
      const result = await renameOrganization(organizationId, values);

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

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting ? 'Speichert…' : 'Speichern'}
        </Button>
      </form>
    </Form>
  );
};
