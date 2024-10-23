import { useState } from 'react';

import Header from '@/components/header';

export default function Home() {
  const [count] = useState(0);
  return (
    <div>
      <h1>hello world</h1>
      <Header />
      <p>{count}</p>
    </div>
  );
}
