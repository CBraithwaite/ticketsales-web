'use client';

import { useTransition } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function SignOutButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => start(() => signOut({ callbackUrl: '/' }))}
      disabled={pending}
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
