import Image from 'next/image';
import Link from 'next/link';

import { Nav } from '../nav';
import { Button } from '../ui/button';
import logo from './logo.svg';

export const Header = () => {
  return (
    <header className="bg-background py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            unoptimized={true}
            src={logo}
            alt="eoss Events App"
            width={100}
            height={100}
          />
          <span className="text-xl font-bold">eoss Events App</span>
        </Link>

        <Nav>
          <Button variant="outline" size="sm" className="text-xs">
            <Link href="/sign-in">Login</Link>
          </Button>
          <Button variant="default" size="sm" className="text-xs">
            <Link href="/register">Register</Link>
          </Button>
        </Nav>
      </div>
    </header>
  );
};
