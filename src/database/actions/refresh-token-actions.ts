import { eq } from 'drizzle-orm';

import { db } from '@/database/database';
import {
  refreshTokens,
  type NewRefreshToken,
  type RefreshToken,
} from '@/database/schema/refresh-tokens-schema';

export async function createRefreshToken(
  data: NewRefreshToken
): Promise<RefreshToken> {
  const [token] = await db.insert(refreshTokens).values(data).returning();

  if (!token) {
    throw new Error('Failed to create refresh token');
  }

  return token;
}

export async function getRefreshTokenByValue(
  token: string
): Promise<RefreshToken | undefined> {
  return db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.token, token),
  });
}

export async function deleteRefreshToken(token: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
}

export async function deleteRefreshTokensByUserId(
  userId: string
): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}
