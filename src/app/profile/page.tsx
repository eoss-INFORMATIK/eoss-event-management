import SignOutButton from '@/components/Sign-Out-Button';

import { auth } from '@/config/auth';

const Profile = async () => {
  const session = await auth();
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Profile Page</h1>
      <p>Name: {session?.user?.name}</p>
      <p>Email: {session?.user?.email}</p>
      <img
        src={session?.user?.image || ''}
        alt="Profile Picture"
        className="h-16 w-16 rounded-full"
      />
      <SignOutButton />
    </section>
  );
};

export default Profile;
