import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div>
      <h1>hello world</h1>
      <Button>
        <Link href="/">Click me</Link>
      </Button>
    </div>
  );
}
