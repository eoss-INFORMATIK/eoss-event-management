import { signOut } from '@/features/auth/actions';

import { Button } from '@/components/ui/button';

type SignOutButtonProps = {
  variant?: React.ComponentProps<typeof Button>['variant'];
  children?: React.ReactNode;
};

/**
 * Server Component wrapping a form. Sign-out clears an httpOnly cookie, which
 * only the server can do -- there is nothing here that needs client JS.
 */
export const SignOutButton = ({
  variant = 'default',
  children = 'Logout',
}: SignOutButtonProps) => (
  <form action={signOut}>
    <Button type="submit" variant={variant}>
      {children}
    </Button>
  </form>
);

export default SignOutButton;
