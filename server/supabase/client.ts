import { createBrowserClient } from '@supabase/ssr';

import { env } from '@/env';
import type { Database } from '@/types';

/** Supabase client for Client Components. */
export const createClient = () =>
  createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
