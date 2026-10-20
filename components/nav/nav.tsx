import Link from 'next/link';

import { createClient } from '@/server/supabase/server';

import SignOutButton from '../sign-out-button';

export const Nav = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const MENU_ITEMS = user
    ? [
        { label: 'Meine Events', href: '/events' },
        { label: 'Profil', href: '/profile' },
      ]
    : [];

  return (
    <nav className="flex items-center justify-between gap-6">
      {MENU_ITEMS.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
      {!user && children}
      {user && <SignOutButton />}
    </nav>
  );
};
