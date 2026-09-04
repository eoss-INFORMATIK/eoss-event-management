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

/**
 * Where to land after sign-in. The proxy appends `?redirectTo=` when it turns
 * someone away from a protected route; the sign-in form passes it through as a
 * hidden field. Only relative paths -- an absolute one would be an open
 * redirect.
 */
const callbackUrl = (formData: FormData) => {
  const target = formData.get('redirectTo');
  const next =
    typeof target === 'string' &&
    target.startsWith('/') &&
    !target.startsWith('//')
      ? target
      : '/profile';

  return `${env.SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`;
};

/** Magic link sign-in. Supabase sends this email, not Resend -- see README. */
export const signInWithEmail = async (formData: FormData): Promise<void> => {
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) failWith('invalid_email');

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data!,
    options: { emailRedirectTo: callbackUrl(formData) },
  });

  if (error) failWith('send_failed');

  redirect('/verify');
};

export const signInWithGoogle = async (formData: FormData): Promise<void> => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl(formData) },
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
