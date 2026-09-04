import { cookies } from 'next/headers';

import { createServerClient } from '@supabase/ssr';

import { env } from '@/env';
import type { Database } from '@/types/database';

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Must be called inside the function that needs it -- never at module level.
 * `cookies()` is only available during a request, and a client created at
 * import time would be shared across requests.
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component, which cannot write cookies.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    }
  );
};
