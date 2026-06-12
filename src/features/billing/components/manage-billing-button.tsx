'use client';

import { useState } from 'react';

import { openBillingPortal } from '@/client-api/billing';
import { Button } from '@/components/ui/button';

export function ManageBillingButton() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handleOpenPortal() {
    setIsRedirecting(true);

    const result = await openBillingPortal();

    if (!result.success) {
      setIsRedirecting(false);
      return;
    }

    window.location.assign(result.url);
  }

  return (
    <Button
      variant="secondary"
      onClick={handleOpenPortal}
      disabled={isRedirecting}
      data-id="manage-billing-button"
      className="px-4 py-2 text-sm"
    >
      {isRedirecting ? 'Opening…' : 'Manage billing'}
    </Button>
  );
}
