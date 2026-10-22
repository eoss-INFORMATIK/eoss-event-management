import { signInWithEmail, signInWithGoogle } from '@/features/auth/actions';
import { SignOutButton } from '@/features/auth/components/sign-out-button';
import { AUTH_ERRORS } from '@/features/auth/errors';

import { ErrorMessage } from '@/components/error-message';
import { Button } from '@/components/ui/button';

import { createClient } from '@/server/supabase/server';

export const SignIn = async ({
  error,
  redirectTo,
}: {
  error?: string;
  redirectTo?: string;
}) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <p>Angemeldet als {user.email}</p>
        <SignOutButton variant="ghost">Abmelden</SignOutButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <ErrorMessage>
          {AUTH_ERRORS[error] ?? 'Anmeldung fehlgeschlagen'}
        </ErrorMessage>
      )}
      <form action={signInWithEmail} className="flex gap-2">
        <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />
        <input
          type="email"
          name="email"
          placeholder="name@example.com"
          required
          className="rounded-md border px-4 py-2"
        />
        <Button type="submit">Mit E-Mail anmelden</Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Oder weiter mit
          </span>
        </div>
      </div>

      <form action={signInWithGoogle}>
        <input type="hidden" name="redirectTo" value={redirectTo ?? ''} />
        <Button type="submit" className="w-full">
          Mit Google anmelden
        </Button>
      </form>
    </div>
  );
};
