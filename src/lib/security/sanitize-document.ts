import sanitizeHtml from 'sanitize-html';

/**
 * Server-side sanitizer for editor content — the PRIMARY XSS control
 * (TipTap does not sanitize; CSP is only the backstop). The allowlist
 * matches exactly what our StarterKit configuration can produce; anything
 * else (scripts, styles, event handlers, iframes, images) is stripped
 * before it ever reaches the database.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'h1',
    'h2',
    'h3',
    'strong',
    'em',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'a',
    'blockquote',
    'code',
    'pre',
    'br',
    'hr',
  ],
  allowedAttributes: {
    a: ['href', 'rel', 'target'],
  },
  // Kills javascript: and data: URLs.
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      rel: 'noopener noreferrer nofollow',
    }),
  },
};

export function sanitizeDocumentHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}
