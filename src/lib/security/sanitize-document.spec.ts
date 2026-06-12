/** @jest-environment node */
import { sanitizeDocumentHtml } from '@/lib/security/sanitize-document';

describe('sanitizeDocumentHtml', () => {
  it('keeps the allowlisted editor markup', () => {
    const html =
      '<h1>Title</h1><p>Hello <strong>world</strong> <em>italic</em></p><ul><li>item</li></ul>';

    expect(sanitizeDocumentHtml(html)).toBe(html);
  });

  it('strips script tags entirely', () => {
    expect(sanitizeDocumentHtml('<p>hi</p><script>alert(1)</script>')).toBe(
      '<p>hi</p>'
    );
  });

  it('strips event handler attributes', () => {
    expect(sanitizeDocumentHtml('<p onclick="alert(1)">hi</p>')).toBe(
      '<p>hi</p>'
    );
  });

  it('kills javascript: hrefs but keeps https links with forced rel', () => {
    expect(sanitizeDocumentHtml('<a href="javascript:alert(1)">x</a>')).toBe(
      '<a rel="noopener noreferrer nofollow">x</a>'
    );

    expect(sanitizeDocumentHtml('<a href="https://example.com">x</a>')).toBe(
      '<a href="https://example.com" rel="noopener noreferrer nofollow">x</a>'
    );
  });

  it('strips iframes, images and style attributes', () => {
    expect(
      sanitizeDocumentHtml(
        '<iframe src="https://evil.com"></iframe><img src="x" onerror="alert(1)"><p style="background:url(x)">a</p>'
      )
    ).toBe('<p>a</p>');
  });
});
