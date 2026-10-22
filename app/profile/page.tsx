import { redirect } from 'next/navigation';

import SignOutButton from '@/features/auth/components/sign-out-button';

import { createClient } from '@/server/supabase/server';

const Profile = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  // Google fills these; a magic-link sign-in leaves them empty.
  const name = user.user_metadata.full_name ?? user.user_metadata.name ?? '';
  const avatarUrl = user.user_metadata.avatar_url ?? user.user_metadata.picture;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Profil</h1>
      {name && <p>Name: {name}</p>}
      <p>E-Mail: {user.email}</p>
      {avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt="Profilbild"
          className="h-16 w-16 rounded-full"
        />
      )}
      <SignOutButton />
    </section>
  );
};

export default Profile;
