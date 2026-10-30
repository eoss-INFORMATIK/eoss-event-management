import { redirect } from 'next/navigation';

import { AddEventForm } from '@/features/events/components/add-event-form';

import { createClient } from '@/server/supabase/server';

export default async function AddEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-8 text-3xl font-bold">Neues Event erstellen</h1>
      <AddEventForm />
    </div>
  );
}
