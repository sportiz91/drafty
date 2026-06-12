/**
 * Edge-compatible JWT verification for Next.js middleware.
 * Uses jose (Web Crypto API) — jsonwebtoken needs Node crypto and cannot
 * run on the Edge runtime. Only import this from middleware.
 */
import { jwtVerify } from 'jose';

import type { AccessTokenPayload } from '@/types/auth.types';

export async function verifyAccessTokenEdge(
  token: string
): Promise<AccessTokenPayload> {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }

  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
    algorithms: ['HS256'],
  });

  return payload as unknown as AccessTokenPayload;
}
