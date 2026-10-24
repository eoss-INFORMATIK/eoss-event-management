import Image from 'next/image';
import Link from 'next/link';

import { Nav } from '../nav';
import logo from './logo.svg';

/**
 * Die Navleiste liegt als angehobene Flaeche ueber der Seite: weiss auf dem
 * cremefarbenen Grund, abgesetzt durch den 2px-Rahmen. Dafuer gibt es seit
 * dieser Scheibe die Rolle `--popover` (siehe app/globals.css).
 */
export const Header = () => (
  <header className="bg-popover border-muted border-b-2">
    <div className="mx-auto flex h-24 max-w-7xl items-center gap-18 px-4">
      <Link href="/" className="flex shrink-0 items-center">
        <Image
          unoptimized={true}
          src={logo}
          alt=""
          width={102}
          height={102}
          className="-mr-3"
        />
        <span className="text-2xl font-bold">däbie</span>
      </Link>

      <Nav />
    </div>
  </header>
);
