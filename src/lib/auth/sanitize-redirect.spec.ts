/** @jest-environment node */
import { sanitizeRedirect } from '@/lib/auth/sanitize-redirect';

describe('sanitizeRedirect', () => {
  it('keeps relative single-slash paths', () => {
    expect(sanitizeRedirect('/documents/abc')).toBe('/documents/abc');
  });

  it('falls back on absolute URLs', () => {
    expect(sanitizeRedirect('https://evil.com')).toBe('/documents');
  });

  it('falls back on protocol-relative URLs', () => {
    expect(sanitizeRedirect('//evil.com')).toBe('/documents');
  });

  it('falls back on backslash variants (browser-normalized to //)', () => {
    expect(sanitizeRedirect('/\\evil.com')).toBe('/documents');
    expect(sanitizeRedirect('/\\/evil.com')).toBe('/documents');
  });

  it('falls back when missing', () => {
    expect(sanitizeRedirect(undefined)).toBe('/documents');
  });
});
