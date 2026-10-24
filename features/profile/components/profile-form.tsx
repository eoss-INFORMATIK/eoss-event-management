'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { updateProfile } from '@/features/profile/actions';
import {
  type ProfileFormValues,
  profileFormSchema,
} from '@/features/profile/schema';

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

type ProfileFormProps = {
  name: string;
  /** Kommt aus `auth.users` und ist hier nicht aenderbar: die E-Mail zu
   *  wechseln ist eine Auth-Operation mit Bestaetigungsmail, keine Profilzeile. */
  email: string;
};

export const ProfileForm = ({ name, email }: ProfileFormProps) => {
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name },
  });

  const handleSubmit = async (values: ProfileFormValues) => {
    setError('');
    setIsSubmitting(true);

    try {
      const result = await updateProfile(values);

      if (result.error) {
        setError(result.error);
        return;
      }

      form.reset(values);
      toast.success('Profil gespeichert');
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">E-Mail</span>
          <span className="text-muted-foreground text-sm">{email}</span>
        </div>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting ? 'Speichert…' : 'Speichern'}
        </Button>
      </form>
    </Form>
  );
};
