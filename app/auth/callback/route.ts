import { type NextRequest, NextResponse } from 'next/server';

import { ensureOrganization } from '@/features/auth/ensure-organization';

import { createClient } from '@/server/supabase/server';

/**
 * Exchanges the code from a magic link or OAuth redirect for a session.
 * Both Supabase auth flows land here.
 */
export const GET = async (request: NextRequest) => {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/profile';

  // Only allow relative paths -- an absolute `next` would be an open redirect.
  const redirectTo =
    next.startsWith('/') && !next.startsWith('//') ? next : '/';

  const fail = (code: string, detail?: string | null) => {
    // eslint-disable-next-line no-console
    console.error(
      `[auth/callback] ${code}${detail ? `: ${detail}` : ''} — ${request.nextUrl.search || '(keine Parameter)'}`
    );
    return NextResponse.redirect(`${origin}/sign-in?error=${code}`);
  };

  // Supabase reports its own failures as query params, not as a missing code.
  // Surfacing them beats reporting "link incomplete" for every cause.
  const providerError =
    searchParams.get('error') ?? searchParams.get('error_code');

  if (providerError) {
    return fail(
      'auth_failed',
      searchParams.get('error_description') ?? providerError
    );
  }

  if (!code) return fail('missing_code');

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return fail('auth_failed', error.message);

  // Eine Session ohne Organisation ist der Zustand, den das ganze Org-Design
  // verhindern soll -- also lieber abmelden und sauber neu versuchen lassen,
  // als mit halb eingerichtetem Konto weiterlaufen. ensureOrganization ist
  // idempotent, ein zweiter Versuch kostet nichts.
  const setup = await ensureOrganization(supabase);

  if (setup.error) {
    await supabase.auth.signOut();
    return fail('setup_failed', setup.error);
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
};
