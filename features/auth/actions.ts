'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { z } from 'zod';

import { env } from '@/env';
import { createClient } from '@/server/supabase/server';
import type { ActionResponse } from '@/types/actions';




/**
 * These are used directly as `<form action={...}>`, so they must resolve to
 * void. Failures come back as a redirect with an `error` code, which the
 * sign-in page renders -- see ./errors.ts.
 */

const emailSchema = z.email();
const orgNameSchema = z.string().min(1).max(255)

const failWith = (code: string): never => redirect(`/sign-in?error=${code}`);



/**
 * Where to land after sign-in. The proxy appends `?redirectTo=` when it turns
 * someone away from a protected route; the sign-in form passes it through as a
 * hidden field. Only relative paths -- an absolute one would be an open
 * redirect.
 */
const nextPath = (formData: FormData) => {
  const target = formData.get('redirectTo');

  return typeof target === 'string' &&
    target.startsWith('/') &&
    !target.startsWith('//')
    ? target
    : '/profile';
};

/** OAuth returns a `code` query param. */
const callbackUrl = (formData: FormData) =>
  `${env.SITE_URL}/auth/callback?next=${encodeURIComponent(nextPath(formData))}`;

/** Magic links carry a token hash instead -- /auth/confirm handles those. */
const confirmUrl = (formData: FormData) =>
  `${env.SITE_URL}/auth/confirm?next=${encodeURIComponent(nextPath(formData))}`;

/**
 * Magic link sign-in. Supabase sends this email, not Resend.
 *
 * The link must point at /auth/confirm, not /auth/callback -- see that route
 * for why. That means the email template in the Supabase dashboard has to be
 * changed; the default one cannot work with a server-side session.
 */
export const signInWithEmail = async (formData: FormData): Promise<void> => {
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) failWith('invalid_email');

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data!,
    options: { emailRedirectTo: confirmUrl(formData) },
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


export const createOrganization = async (orgName: string): Promise<ActionResponse> => {
  const parsed = orgNameSchema.safeParse(orgName);
  if (!parsed.success) return ({ success: false, error: "Organisation could not be parsed" });

  const supabase = await createClient();
  const { error } = await supabase.rpc('create_organization', { p_name: parsed.data });

  if (error) return ({ success: false, error: "Organisation could not be created" });
  return ({ success: true });
}
