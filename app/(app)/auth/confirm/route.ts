import { type NextRequest, NextResponse } from 'next/server';

import {
  type EmailOtpType,
  isAuthRetryableFetchError,
} from '@supabase/supabase-js';

import { ensureOrganization } from '@/features/auth/ensure-organization';

import { createClient } from '@/server/supabase/server';

/**
 * Magic link target.
 *
 * Supabase's default email template links to `{{ .ConfirmationURL }}`, which
 * returns the session as a URL fragment (`#access_token=...`). A fragment never
 * reaches the server, so a server-side flow can only see an empty query string.
 *
 * The email template must therefore link here instead:
 *
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 *
 * `verifyOtp` then trades the hash for a session and sets the auth cookies.
 * OAuth keeps using /auth/callback -- that flow does return a `code` param.
 */
export const GET = async (request: NextRequest) => {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/profile';

  const redirectTo =
    next.startsWith('/') && !next.startsWith('//') ? next : '/';

  const fail = (code: string, detail?: string) => {
    // eslint-disable-next-line no-console
    console.error(
      `[auth/confirm] ${code}${detail ? `: ${detail}` : ''} — ${request.nextUrl.search || '(keine Parameter)'}`
    );
    return NextResponse.redirect(`${origin}/sign-in?error=${code}`);
  };

  if (!tokenHash || !type) return fail('missing_code');

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  // Siehe /auth/callback: unerreichbar und ungueltig sind verschiedene Dinge.
  if (error)
    return fail(
      isAuthRetryableFetchError(error) ? 'service_unavailable' : 'auth_failed',
      error.message
    );

  // Siehe /auth/callback: beide Anmeldefluesse muessen das Konto fertig
  // einrichten, sonst haengt der Zustand davon ab, wie sich jemand angemeldet
  // hat.
  const setup = await ensureOrganization(supabase);

  if (setup.error) {
    await supabase.auth.signOut();
    return fail('setup_failed', setup.error);
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
};
