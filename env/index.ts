import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM_ADDRESS: z.email(),
    // Ohne den trailing slash: die Aufrufer haengen Pfade direkt an
    // (`${env.SITE_URL}/auth/confirm`), ein Slash im Wert ergibt daraus
    // `//auth/confirm`. z.url() akzeptiert beide Formen, also wird hier
    // normalisiert statt sich auf die Schreibweise in Vercel zu verlassen.
    SITE_URL: z.url().transform((url) => url.replace(/\/+$/, '')),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  },
  onValidationError: (issues) => {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:', issues);
    throw new Error('Invalid environment variables');
  },
  emptyStringAsUndefined: true,
  // Client variables must be listed explicitly — Next.js inlines them at build
  // time, so `process.env` cannot be spread here.
  experimental__runtimeEnv: {
    /* eslint-disable n/no-process-env */
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    /* eslint-enable n/no-process-env */
  },
});
