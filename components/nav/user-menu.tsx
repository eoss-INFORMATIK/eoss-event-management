'use client';

import Link from 'next/link';

import { Settings } from 'lucide-react';

import { signOut } from '@/features/auth/actions';

import { Avatar } from '@/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type UserMenuProps = {
  name: string;
  email: string;
  /** Eine Liste, auch wenn heute genau eine Organisation drin ist. */
  organizations: { id: string; name: string }[];
};

/**
 * Client Component, weil das Oeffnen und Schliessen, die Tastaturbedienung und
 * das Schliessen per Escape echte Arbeit sind -- genau der Fall, fuer den laut
 * `docs/entscheidungen.md` shadcn bleibt.
 *
 * Nicht im Dropdown, obwohl im Figma sichtbar: das Rollen-Label und
 * "User einladen" (beides erst mit den Rollen beziehungsweise Einladungen) und
 * der Org-Wechsel-Chevron (es gibt nur eine Organisation).
 */
export const UserMenu = ({ name, email, organizations }: UserMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      aria-label="Konto und Organisation"
      className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:outline-none"
    >
      <Avatar name={name} />
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
      sideOffset={12}
      className="border-muted w-[min(30rem,calc(100vw-2rem))] rounded-3xl border-2 p-0 py-12"
    >
      <div className="flex flex-col gap-1 px-6 py-2">
        <span className="text-2xl font-bold">{name || 'Mein Konto'}</span>
        <span className="text-muted-foreground text-lg break-all">{email}</span>
      </div>

      <DropdownMenuSeparator className="bg-muted my-4 h-0.5" />

      <ul>
        {organizations.map((organization) => (
          <li key={organization.id}>
            <DropdownMenuItem asChild className="rounded-none px-6 py-2">
              <Link href={`/organizations/${organization.id}/settings`}>
                <span className="text-2xl font-bold">{organization.name}</span>
                <Settings className="size-6" />
              </Link>
            </DropdownMenuItem>
          </li>
        ))}
      </ul>

      <DropdownMenuSeparator className="bg-muted my-4 h-0.5" />

      <DropdownMenuItem asChild className="rounded-none px-6 py-2">
        <Link href="/profile">
          <span className="text-2xl font-bold">Profil</span>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild className="rounded-none px-6 py-2">
        <form action={signOut}>
          <button type="submit" className="w-full text-left text-2xl font-bold">
            Logout
          </button>
        </form>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
