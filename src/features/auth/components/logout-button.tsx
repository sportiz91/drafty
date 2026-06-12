'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { logout } from '@/client-api/auth';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <Button
      variant="secondary"
      onClick={handleLogout}
      disabled={isLoggingOut}
      data-id="logout-button"
      className="px-4 py-2 text-sm"
    >
      {isLoggingOut ? 'Logging out…' : 'Log out'}
    </Button>
  );
}
