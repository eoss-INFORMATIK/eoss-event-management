'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import {
  type ProfileFormValues,
  profileFormSchema,
} from '@/features/profile/schema';

import { createClient } from '@/server/supabase/server';
import type { ActionResponse } from '@/types/actions';

/**
 * Besitz erzwingt die Policy (`id = auth.uid()`, seit
 * `profiles_update_with_check` auch im `with check`). Die Pruefung hier liefert
 * nur eine lesbare Meldung -- ein Update, das unter RLS keine Zeile sieht,
 * gelingt mit null betroffenen Zeilen und waere sonst ein stilles Nichts.
 */
export const updateProfile = async (
  formData: ProfileFormValues
): Promise<ActionResponse> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return { error: 'Du musst angemeldet sein, um dein Profil zu aendern' };

  const parsed = profileFormSchema.safeParse(formData);
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const { data, error } = await supabase
    .from('profiles')
    .update({ name: parsed.data.name, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select('id');

  if (error) return { error: 'Profil konnte nicht gespeichert werden' };

  if (!data || data.length === 0)
    return { error: 'Zu deinem Konto gehoert kein Profil' };

  revalidatePath('/profile');
  return { success: true };
};
