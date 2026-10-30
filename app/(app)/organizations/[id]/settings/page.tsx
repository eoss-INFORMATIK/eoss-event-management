import { notFound, redirect } from 'next/navigation';

import { OrganizationForm } from '@/features/organizations/components/organization-form';
import { getOrganization } from '@/features/organizations/queries';

import { createClient } from '@/server/supabase/server';

/**
 * Die Route traegt die Organisations-Id, obwohl ein Nutzer heute in genau einer
 * Organisation ist. Eine Route `/organization/settings` haette spaeter keinen
 * Platz fuer die Id, und eine URL umzubauen heisst kaputte Lesezeichen plus
 * eine Umbenennung quer durch den Code. Siehe Leitplanken in CLAUDE.md.
 */
interface OrganizationSettingsPageProps {
  params: Promise<{ id: string }>;
}

const OrganizationSettingsPage = async ({
  params,
}: OrganizationSettingsPageProps) => {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  // Die SELECT-Policy unterscheidet "gibt es nicht" und "du bist nicht
  // Mitglied" nicht -- und die Seite soll es auch nicht: wer nicht Mitglied
  // ist, soll nicht einmal erfahren, dass es diese Organisation gibt.
  const organization = await getOrganization(supabase, id);

  if (!organization) notFound();

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{organization.name}</h1>

      <OrganizationForm
        organizationId={organization.id}
        name={organization.name}
      />
    </section>
  );
};

export default OrganizationSettingsPage;
