/**
 * Size-capped JSON body reader. App Router route handlers have NO built-in
 * body limit when self-hosted — an unbounded request.json() lets a single
 * huge payload exhaust process memory. Checks Content-Length first (cheap
 * reject), then caps the actual stream (defends against chunked/lying
 * clients).
 */

export const DEFAULT_JSON_BODY_LIMIT = 64 * 1024; // 64 KB — plenty for auth/JSON APIs

export class PayloadTooLargeError extends Error {
  constructor() {
    super('Payload too large');
    this.name = 'PayloadTooLargeError';
  }
}

export async function readJsonBody(
  request: Request,
  maxBytes: number = DEFAULT_JSON_BODY_LIMIT
): Promise<unknown> {
  const contentLength = Number(request.headers.get('content-length'));

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new PayloadTooLargeError();
  }

  if (!request.body) {
    throw new SyntaxError('Empty body');
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    received += value.byteLength;

    if (received > maxBytes) {
      await reader.cancel();
      throw new PayloadTooLargeError();
    }

    chunks.push(value);
  }

  // SyntaxError on invalid JSON — route handlers map it to a 400.
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
