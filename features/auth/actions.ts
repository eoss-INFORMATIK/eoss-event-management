'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { z } from 'zod';

import { env } from '@/env';
import { createClient } from '@/server/supabase/server';

/**
 * These are used directly as `<form action={...}>`, so they must resolve to
 * void. Failures come back as a redirect with an `error` code, which the
 * sign-in page renders -- see ./errors.ts.
 */

const emailSchema = z.email();

const failWith = (code: string): never => redirect(`/sign-in?error=${code}`);

/** Magic link sign-in. Supabase sends this email, not Resend -- see README. */
export const signInWithEmail = async (formData: FormData): Promise<void> => {
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) failWith('invalid_email');

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data!,
    options: { emailRedirectTo: `${env.SITE_URL}/auth/callback` },
  });

  if (error) failWith('send_failed');

  redirect('/verify');
};

export const signInWithGoogle = async (): Promise<void> => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${env.SITE_URL}/auth/callback?next=${encodeURIComponent('/profile')}`,
    },
  });

  if (error || !data.url) failWith('oauth_failed');

  redirect(data.url!);
};

export const signOut = async (): Promise<void> => {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/');
};
