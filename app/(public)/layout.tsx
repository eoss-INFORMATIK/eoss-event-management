/**
 * Rahmen fuer Seiten, die Teilnehmende sehen (TASK-55): keine Navigation der
 * App, neutral weiss -- unabhaengig von Markenfarben und Dark Mode, denn die
 * Seite tritt im Namen der Organisation auf, nicht im Namen der App.
 *
 * Kopf- und Fusszeile mit Logo und Kontakt gehoeren zum Event und stehen
 * deshalb auf der Event-Seite, nicht hier: die Ticket-Seite kennt kein Event.
 */
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-black">
      {children}
    </div>
  );
}
