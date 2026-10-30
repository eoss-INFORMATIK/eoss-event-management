import { Header } from '@/components/header';

/** Rahmen der App: Navigation oben, Inhalt auf max-w-7xl. */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="bg-background mx-auto flex max-w-7xl px-4 py-10">
        {children}
      </main>
    </>
  );
}
