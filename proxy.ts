import { type NextRequest } from 'next/server';

import { updateSession } from '@/server/supabase/proxy';

export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Every path except static assets and images. The session needs refreshing
     * on real page requests, not on every .svg.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
