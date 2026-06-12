/**
 * Open-redirect guard: only relative, single-slash paths are followed.
 * `//evil.com` is protocol-relative and would leave the site.
 */
export function sanitizeRedirect(
  value: string | undefined,
  fallback = '/documents'
): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }

  return fallback;
}
