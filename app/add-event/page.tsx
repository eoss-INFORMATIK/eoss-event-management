import { redirect } from 'next/navigation';

import { AddEventForm } from '@/components/forms/add-event-form';

import { auth } from '@/config/auth';

export default async function AddEventPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-8 text-3xl font-bold">Create New Event</h1>
      <AddEventForm />
    </div>
  );
}
