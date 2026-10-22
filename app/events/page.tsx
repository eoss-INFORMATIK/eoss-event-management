import { getUserEvents } from '@/features/events/actions';
import { AddEventButton } from '@/features/events/components/add-event-button';
import { SingleEventCard } from '@/features/events/components/single-event-card';

import { ErrorMessage } from '@/components/error-message';

export default async function EventsPage() {
  const { events, error } = await getUserEvents();

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorMessage>{error}</ErrorMessage>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-screen flex-col justify-start">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meine Events</h1>
        <AddEventButton />
      </div>

      {events?.length === 0 ? (
        <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-8">
          <div className="flex flex-col items-center">
            <p>Bist jetzt hast du noch keine Events erstellt.</p>
            <h2>Erstelle jetzt dein erstes Event!</h2>
          </div>
          <AddEventButton />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events?.map((event) => (
            <SingleEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
