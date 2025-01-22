import { createEnv } from '@t3-oss/env-nextjs';
import { ZodError, z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    AUTH_SECRET: z.string(),
    AUTH_GOOGLE_ID: z.string(),
    AUTH_GOOGLE_SECRET: z.string(),
    DB_HOST: z.string().optional(),
    DB_USER: z.string().optional(),
    DB_PASSWORD: z.string().optional(),
    DB_NAME: z.string().optional(),
    DB_PORT: z.coerce.number().optional(),
    DATABASE_URL: z.string().url(),
    // Email configuration
    EMAIL_FROM_ADDRESS: z.string().email(),
    RESEND_API_KEY: z.string(),
    BLOB_READ_WRITE_TOKEN: z.string(),
    SITE_URL: z.string().url(),
  },
  onValidationError: (error: ZodError) => {
    // eslint-disable-next-line no-console
    console.error(
      '❌ Invalid environment variables:',
      JSON.stringify(error.flatten().fieldErrors)
    );
    throw new Error('Invalid environment variables');
  },
  emptyStringAsUndefined: true,
  // eslint-disable-next-line n/no-process-env
  experimental__runtimeEnv: process.env,
});
