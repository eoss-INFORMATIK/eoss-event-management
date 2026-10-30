import { type NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

import { env } from '@/env';
import type { Database } from '@/types';

/** Routes reachable without a session. Everything else requires sign-in. */
const PUBLIC_ROUTES = [
  '/',
  '/events',
  '/auth',
  '/sign-in',
  '/verify',
  '/register',
  // Ziel des QR-Codes in der Bestaetigungsmail. Ein Teilnehmer, der seinen
  // Code scannt, soll keine Anmeldeseite fuer Organisatoren sehen. Der
  // spaetere Check-in unterscheidet auf der Seite selbst, ob ein Mitglied
  // angemeldet ist -- den Status setzen sichert ohnehin RLS ab.
  '/t',
];

const isPublicRoute = (pathname: string) =>
  PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

/**
 * Refreshes the auth session on every request and redirects unauthenticated
 * users away from protected routes.
 *
 * The response object must be the one returned -- it carries the refreshed
 * auth cookies. Creating a new response would drop them and log the user out.
 */
export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not remove: this call refreshes the session. Anything between
  // createServerClient and getUser() risks logging users out at random.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
};
