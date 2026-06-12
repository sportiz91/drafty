'use client';

import { useState } from 'react';

import { startCheckout } from '@/client-api/billing';
import { Button } from '@/components/ui/button';

export function SubscribeButton() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setIsRedirecting(true);
    setError(null);

    const result = await startCheckout();

    if (!result.success) {
      setError(result.error);
      setIsRedirecting(false);
      return;
    }

    window.location.assign(result.url);
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSubscribe}
        disabled={isRedirecting}
        data-id="subscribe-button"
        className="w-full"
      >
        {isRedirecting ? 'Redirecting to checkout…' : 'Subscribe'}
      </Button>
      {error ? (
        <p className="text-sm text-accent" data-id="billing-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
