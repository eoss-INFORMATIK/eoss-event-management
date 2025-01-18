import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth, { type Session } from 'next-auth';
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';

import db from '@/db';

import { env } from '@/env/server';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev',
    }),
  ],
  pages: {
    signIn: '/',
    error: '/error',
    verifyRequest: '/verify',
  },
  session: {
    strategy: 'database',
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        (session.user as Session['user'] & { id: string }).id = user.id;
      }
      return session;
    },
  },
});
