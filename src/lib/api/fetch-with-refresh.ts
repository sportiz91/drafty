/**
 * Client-side fetch with the 401 → refresh → retry flow. A shared promise
 * acts as a mutex so concurrent 401s trigger exactly one refresh call.
 */

let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshPromise ??= fetch('/api/v1/auth/refresh', { method: 'POST' })
    .then(response => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function fetchWithRefresh(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);

  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshSession();

  if (!refreshed) {
    return response;
  }

  return fetch(input, init);
}
