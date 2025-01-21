'use client';

import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';

const SignOutButton = () => {
  return (
    <Button variant="default" onClick={() => signOut()}>
      Logout
    </Button>
  );
};

export default SignOutButton;
