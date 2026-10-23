import { redirect } from 'next/navigation';

import SignOutButton from '@/features/auth/components/sign-out-button';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { getMyProfile } from '@/features/profile/queries';

import { createClient } from '@/server/supabase/server';

const Profile = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  // Der Name kommt jetzt aus `profiles`, nicht mehr aus `user_metadata`.
  // Die Metadaten gehoeren dem Anmeldeanbieter: Google ueberschreibt sie bei
  // jeder Anmeldung, und ein Magic Link liefert gar nichts.
  const profile = await getMyProfile(supabase, user.id);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Profil</h1>

      <ProfileForm
        name={profile?.name ?? ''}
        email={profile?.email ?? user.email ?? ''}
      />

      <SignOutButton />
    </section>
  );
};

export default Profile;
