import { auth, signIn, signOut } from '@/config/auth';

import { Button } from '../ui/button';

export async function SignIn() {
  const session = await auth();

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <p>Signed in as {session.user.email}</p>
        <form
          action={async () => {
            'use server';
            await signOut({
              redirectTo: '/',
            });
          }}
        >
          <Button variant="ghost">Sign out</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        action={async (formData: FormData) => {
          'use server';

          try {
            const email = formData.get('email');
            if (!email) return;

            await signIn('resend', {
              email: email.toString(),
              redirect: true,
              redirectTo: '/verify',
            });
          } catch (error) {
            console.error('Sign in error:', error);
          }
        }}
        className="flex gap-2"
      >
        <input
          type="email"
          name="email"
          placeholder="name@example.com"
          required
          className="rounded-md border px-4 py-2"
        />
        <Button type="submit">Sign in with Email</Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <form
        action={async () => {
          'use server';
          await signIn('google', {
            redirectTo: '/profile',
          });
        }}
      >
        <Button type="submit" className="w-full">
          Sign in with Google
        </Button>
      </form>
    </div>
  );
}
