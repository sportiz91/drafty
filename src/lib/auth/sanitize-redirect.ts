/**
 * Open-redirect guard: only relative, single-slash paths are followed.
 * `//evil.com` is protocol-relative and would leave the site; browsers
 * also normalize `\` to `/`, so `/\evil.com` is the same bypass.
 */
export function sanitizeRedirect(
  value: string | undefined,
  fallback = '/documents'
): string {
  if (
    value &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\')
  ) {
    return value;
  }

  return fallback;
}
