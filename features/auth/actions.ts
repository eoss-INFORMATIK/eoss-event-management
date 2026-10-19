'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { isAuthRetryableFetchError } from '@supabase/supabase-js';
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
const orgNameSchema = z.string().min(1).max(255);

/**
 * Der Code landet in der URL und wird auf der Anmeldeseite als Text gezeigt;
 * der technische Grund gehoert ins Log und nicht vor den Nutzer. Ohne das
 * Log blieb bei einem Fehlschlag nur die uebersetzte Meldung -- zu wenig, um
 * eine Ursache zu finden.
 */
const failWith = (code: string, detail?: string): never => {
  if (detail) {
    // eslint-disable-next-line no-console
    console.error(`[auth] ${code}: ${detail}`);
  }

  return redirect(`/sign-in?error=${code}`);
};

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

  if (error)
    failWith(
      isAuthRetryableFetchError(error) ? 'service_unavailable' : 'send_failed',
      error.message
    );

  redirect('/verify');
};

export const signInWithGoogle = async (formData: FormData): Promise<void> => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl(formData) },
  });

  // signInWithOAuth baut die Authorize-URL nur zusammen, es geht dabei kein
  // Request raus. Ein nicht erreichbares Supabase fliegt hier also NICHT auf,
  // sondern erst im Browser nach dem Redirect.
  if (error || !data.url)
    failWith('oauth_failed', error?.message ?? 'keine Redirect-URL erhalten');

  redirect(data.url!);
};

export const signOut = async (): Promise<void> => {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/');
};

/**
 * Explizites Anlegen einer Organisation. Noch ohne Aufrufer -- die Einrichtung
 * bei der Anmeldung laeuft ueber `ensureOrganization`. Diese Action bekommt
 * ihren Aufrufer in Schritt 2 (zweite Organisation, Umbenennen).
 */
export const createOrganization = async (
  orgName: string
): Promise<ActionResponse> => {
  const parsed = orgNameSchema.safeParse(orgName);

  if (!parsed.success) return { error: 'Name der Organisation ist ungültig' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('create_organization', {
    p_name: parsed.data,
  });

  if (error) return { error: 'Organisation konnte nicht angelegt werden' };

  return { success: true };
};
