import { AddEventButton } from '@/components/add-event-button';
import { SingleEventCard } from '@/components/single-event-card';

import { getUserEventsAction } from '@/server/event-actions';

export default async function EventsPage() {
  const { events, error } = await getUserEventsAction();

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 text-red-500 rounded-md p-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meine Events</h1>
        <AddEventButton />
      </div>

      {events?.length === 0 ? (
        <div className="text-gray-500 text-center">
          <p>Bist jetzt hast du noch keine Events erstellt.</p>
          <h2>Erstelle jetzt dein erstes Event!</h2>
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
