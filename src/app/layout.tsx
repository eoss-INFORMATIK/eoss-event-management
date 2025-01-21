import type { Metadata } from 'next';
import { Poppins, Space_Grotesk } from 'next/font/google';

import { SessionProvider } from 'next-auth/react';

import { Header } from '@/components/header';

import { cn } from '@/lib/utils';

import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk-variable',
});

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
    <SessionProvider>
      <html lang="de" className={cn(poppins.variable, spaceGrotesk.variable)}>
        <head>
          <link
            rel="icon"
            href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚀</text></svg>"
          ></link>
        </head>
        <body>
          <Header />
          <main className="bg-background">{children}</main>
        </body>
      </html>
    </SessionProvider>
  );
}
