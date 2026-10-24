'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import {
  type OrganizationFormValues,
  organizationFormSchema,
} from '@/features/organizations/schema';

import { createClient } from '@/server/supabase/server';
import type { ActionResponse } from '@/types/actions';

/**
 * Mitgliedschaft erzwingt die Policy, nicht dieser Code. Die Pruefung hier
 * liefert nur eine lesbare Meldung -- ein Update, das unter RLS keine Zeile
 * sieht, gelingt mit null betroffenen Zeilen und waere sonst ein stilles
 * Nichts.
 *
 * Jedes Mitglied darf umbenennen; Rollen gibt es noch keine (siehe
 * docs/datenmodell.md).
 */
export const renameOrganization = async (
  organizationId: string,
  formData: OrganizationFormValues
): Promise<ActionResponse> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return {
      error: 'Du musst angemeldet sein, um die Organisation zu aendern',
    };

  const parsed = organizationFormSchema.safeParse(formData);
  if (!parsed.success) return { error: z.prettifyError(parsed.error) };

  const { data, error } = await supabase
    .from('organizations')
    .update({ name: parsed.data.name, updated_at: new Date().toISOString() })
    .eq('id', organizationId)
    .select('id');

  if (error) return { error: 'Organisation konnte nicht gespeichert werden' };

  if (!data || data.length === 0)
    return {
      error: 'Organisation nicht gefunden oder keine Berechtigung',
    };

  revalidatePath(`/organizations/${organizationId}/settings`);
  revalidatePath('/profile');
  return { success: true };
};
