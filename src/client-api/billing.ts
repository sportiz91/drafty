import { fetchWithRefresh } from '@/lib/api/fetch-with-refresh';

export type BillingRedirectResult =
  | { success: true; url: string }
  | { success: false; error: string };

async function requestRedirectUrl(
  path: string
): Promise<BillingRedirectResult> {
  const response = await fetchWithRefresh(path, { method: 'POST' });
  const data: unknown = await response.json().catch(() => null);

  if (
    response.ok &&
    data !== null &&
    typeof data === 'object' &&
    'url' in data &&
    typeof data.url === 'string'
  ) {
    return { success: true, url: data.url };
  }

  const message =
    data !== null &&
    typeof data === 'object' &&
    'error' in data &&
    typeof data.error === 'string'
      ? data.error
      : 'Something went wrong. Please try again.';

  return { success: false, error: message };
}

export function startCheckout(): Promise<BillingRedirectResult> {
  return requestRedirectUrl('/api/v1/billing/checkout');
}

export function openBillingPortal(): Promise<BillingRedirectResult> {
  return requestRedirectUrl('/api/v1/billing/portal');
}
