import Link from 'next/link';

import { getMyOrganizations } from '@/features/organizations/queries';
import { getMyProfile } from '@/features/profile/queries';

import { UserMenu } from '@/components/nav/user-menu';
import { Button } from '@/components/ui/button';

import { createClient } from '@/server/supabase/server';

const MENU_ITEMS = [
  { label: 'meine Events', href: '/events' },
  { label: 'Teilnehmer', href: '/participants' },
];

export const Nav = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return (
      <div className="flex flex-1 items-center justify-end gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/sign-in">Login</Link>
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link href="/register">Registrieren</Link>
        </Button>
      </div>
    );

  const [profile, organizations] = await Promise.all([
    getMyProfile(supabase, user.id),
    getMyOrganizations(supabase, user.id),
  ]);

  return (
    <div className="flex flex-1 items-center justify-between gap-6">
      <nav className="flex items-center gap-6 text-lg">
        {MENU_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <UserMenu
        name={profile?.name ?? ''}
        email={profile?.email ?? user.email ?? ''}
        organizations={organizations.map(({ id, name }) => ({ id, name }))}
      />
    </div>
  );
};
