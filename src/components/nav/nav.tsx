import Link from 'next/link';

import { auth } from '@/config/auth';

import SignOutButton from '../Sign-Out-Button';

export const Nav = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  const MENU_ITEMS: { label: string; href: string }[] = [];

  if (session?.user) {
    MENU_ITEMS.push(
      {
        label: 'Meine Events',
        href: '/events',
      },
      {
        label: 'Profile',
        href: '/profile',
      }
    );
  }

  return (
    <nav className="flex items-center justify-between gap-6">
      {MENU_ITEMS.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
      {!session?.user && children}
      {session?.user && <SignOutButton />}
    </nav>
  );
};
