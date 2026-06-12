/** @jest-environment node */
import {
  PayloadTooLargeError,
  readJsonBody,
} from '@/lib/security/read-json-body';

function jsonRequest(body: string): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

describe('readJsonBody', () => {
  it('parses a valid JSON body under the limit', async () => {
    const result = await readJsonBody(jsonRequest('{"a":1}'), 1024);

    expect(result).toEqual({ a: 1 });
  });

  it('rejects via Content-Length before reading the stream', async () => {
    const big = JSON.stringify({ data: 'x'.repeat(2000) });

    await expect(readJsonBody(jsonRequest(big), 1024)).rejects.toThrow(
      PayloadTooLargeError
    );
  });

  it('caps the actual stream when Content-Length lies', async () => {
    const chunk = new TextEncoder().encode('x'.repeat(512));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(chunk);
        controller.enqueue(chunk);
        controller.enqueue(chunk);
        controller.close();
      },
    });
    // No content-length header at all — only the stream cap can catch it.
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      body: stream,
      // @ts-expect-error Node requires duplex for stream bodies
      duplex: 'half',
    });

    await expect(readJsonBody(request, 1024)).rejects.toThrow(
      PayloadTooLargeError
    );
  });

  it('throws SyntaxError on invalid JSON (maps to 400, not 500)', async () => {
    await expect(readJsonBody(jsonRequest('not-json'), 1024)).rejects.toThrow(
      SyntaxError
    );
  });
});
