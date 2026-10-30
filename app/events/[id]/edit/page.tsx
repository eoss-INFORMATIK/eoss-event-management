import { notFound, redirect } from 'next/navigation';

import { getEvent } from '@/features/events/actions';
import { getEventCategories } from '@/features/events/categories';
import { EditEventForm } from '@/features/events/components/edit-event-form';
import { getOrganization } from '@/features/organizations/queries';

import { createClient } from '@/server/supabase/server';

interface EditEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const { id } = await params;
  const { event } = await getEvent(id);
  if (!event) notFound();

  // Events sind oeffentlich lesbar, das Formular soll es nicht sein. Nur
  // Mitglieder sehen die Organisation (RLS) -- fuer alle anderen gibt es diese
  // Seite nicht. Die Grenze ist trotzdem die UPDATE-Policy, nicht diese Zeile.
  const organization = await getOrganization(supabase, event.organization_id);
  if (!organization) notFound();

  const categories = await getEventCategories(supabase, event.id);

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-8 text-3xl font-bold">Event bearbeiten</h1>
      <EditEventForm event={event} categories={categories} />
    </div>
  );
}
