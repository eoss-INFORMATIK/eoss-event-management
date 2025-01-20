import Link from 'next/link';

import { Nav } from '../nav';
import { Button } from '../ui/button';

export const Header = () => {
  return (
    <header className="bg-background py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <h1 className="text-lg font-semibold">
          <Link href="/">eoss Base Next App</Link>
        </h1>
        <Nav>
          <Button variant="outline" size="sm" className="text-xs">
            <Link href="/signin">Login</Link>
          </Button>
          <Button variant="default" size="sm" className="text-xs">
            <Link href="/register">Register</Link>
          </Button>
        </Nav>
      </div>
    </header>
  );
};
