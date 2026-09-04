import { type NextRequest, NextResponse } from 'next/server';

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

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
};
