import type { Metadata } from 'next';

import SignIn from '@/components/sign-in';

import './globals.css';

export const metadata: Metadata = {
  title: 'eoss Base Next App',
  description: 'Next App Starter Project',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚀</text></svg>"
        ></link>
      </head>
      <body>
        <header>
          <nav>
            <SignIn />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
