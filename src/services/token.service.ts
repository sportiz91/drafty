import crypto from 'crypto';

import jwt, { type SignOptions } from 'jsonwebtoken';

import * as refreshTokenActions from '@/database/actions/refresh-token-actions';
import * as userActions from '@/database/actions/user-actions';
import { serverConfig } from '@/lib/config/config';
import type { AccessTokenPayload, AuthTokens } from '@/types/auth.types';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_DAYS = 7;

/**
 * Issues a short-lived JWT access token plus an opaque refresh token
 * persisted in the database.
 */
export async function generateAuthTokens(user: {
  id: string;
  email: string;
}): Promise<AuthTokens> {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    serverConfig.jwtSecret,
    { expiresIn: serverConfig.jwtAccessTokenExpiry } as SignOptions
  );

  const refreshToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  await refreshTokenActions.createRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

/** Verifies the JWT access token. Throws on missing/expired/forged tokens. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, serverConfig.jwtSecret);

    if (typeof payload === 'string') {
      throw new Error('Unexpected token payload');
    }

    return {
      userId: payload['userId'] as string,
      email: payload['email'] as string,
    };
  } catch {
    throw new Error('Invalid access token');
  }
}

/**
 * Rotates a refresh token: validates it, deletes it, and issues a fresh
 * token pair. A reused (already-rotated) token is simply not found.
 */
export async function rotateRefreshToken(
  refreshToken: string
): Promise<AuthTokens> {
  const stored = await refreshTokenActions.getRefreshTokenByValue(refreshToken);

  if (!stored) {
    throw new Error('Invalid refresh token');
  }

  if (stored.expiresAt.getTime() < Date.now()) {
    await refreshTokenActions.deleteRefreshToken(refreshToken);
    throw new Error('Refresh token expired');
  }

  const user = await userActions.getUserById(stored.userId);

  if (!user) {
    throw new Error('User not found');
  }

  await refreshTokenActions.deleteRefreshToken(refreshToken);

  return generateAuthTokens(user);
}
