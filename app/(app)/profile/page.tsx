import Link from 'next/link';
import { redirect } from 'next/navigation';

import SignOutButton from '@/features/auth/components/sign-out-button';
import { getMyOrganizations } from '@/features/organizations/queries';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { getMyProfile } from '@/features/profile/queries';

import { createClient } from '@/server/supabase/server';

const Profile = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  // Der Name kommt aus `profiles`, nicht aus `user_metadata`. Die Metadaten
  // gehoeren dem Anmeldeanbieter: Google ueberschreibt sie bei jeder Anmeldung,
  // und ein Magic Link liefert gar nichts.
  const profile = await getMyProfile(supabase, user.id);

  // Eine Liste, obwohl heute genau eine Organisation drin ist. Den Singular
  // durch Komponenten und Typen zu ziehen hiesse, `unique(user_id)` in den Code
  // zu schreiben -- dort muesste man es spaeter suchen. Siehe CLAUDE.md.
  const organizations = await getMyOrganizations(supabase, user.id);

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Profil</h1>

        <ProfileForm
          name={profile?.name ?? ''}
          email={profile?.email ?? user.email ?? ''}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Meine Organisationen</h2>

        {organizations.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Zu deinem Konto gehört keine Organisation.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {organizations.map((organization) => (
              <li key={organization.id}>
                <Link
                  href={`/organizations/${organization.id}/settings`}
                  className="underline underline-offset-4"
                >
                  {organization.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SignOutButton />
    </section>
  );
};

export default Profile;
