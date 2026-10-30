import type { Metadata } from 'next';
import { Poppins, Space_Grotesk } from 'next/font/google';

import { Toaster } from '@/components/ui/sonner';

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
  title: 'eoss Event Manager',
  description: 'Event Manager von eoss',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={cn(poppins.variable, spaceGrotesk.variable)}>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📅</text></svg>"
        ></link>
      </head>
      {/*
        overflow-x-clip: Anmelden und Registrieren sind `w-screen` breit, und
        100vw zaehlt unter Windows die Scrollleiste mit -- ohne das gaebe es
        einen waagrechten Scrollbalken. `clip` statt `hidden`, damit
        `position: sticky` weiter funktioniert.

        Header und Rahmen liegen in den Routengruppen: `(app)` fuer die App,
        `(public)` fuer Seiten, die Teilnehmende sehen (TASK-55).
      */}
      <body className="overflow-x-clip">
        {children}
        <Toaster expand={true} />
      </body>
    </html>
  );
}
