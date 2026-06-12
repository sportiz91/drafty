import crypto from 'crypto';

import jwt, { type SignOptions } from 'jsonwebtoken';

import * as refreshTokenActions from '@/database/actions/refresh-token-actions';
import * as userActions from '@/database/actions/user-actions';
import { serverConfig } from '@/lib/config/config';
import type { AccessTokenPayload, AuthTokens } from '@/types/auth.types';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_DAYS = 7;

/**
 * Refresh tokens are credentials — stored hashed (like passwords) so a
 * leaked database copy cannot be replayed. SHA-256 (not bcrypt) is right
 * here: the input is 256 bits of entropy, not a guessable password.
 */
function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

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
    // Cast constraint: jsonwebtoken types expiresIn as a template-literal
    // duration; our value is a validated env string ("15m" by default).
    { expiresIn: serverConfig.jwtAccessTokenExpiry } as SignOptions
  );

  const refreshToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  await refreshTokenActions.createRefreshToken({
    token: hashRefreshToken(refreshToken),
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
    // Algorithm pinned — never accept tokens signed with anything else.
    const payload = jwt.verify(token, serverConfig.jwtSecret, {
      algorithms: ['HS256'],
    });

    if (typeof payload === 'string') {
      throw new Error('Unexpected token payload');
    }

    const { userId, email } = payload;

    if (typeof userId !== 'string' || typeof email !== 'string') {
      throw new Error('Malformed token payload');
    }

    return { userId, email };
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
  const hashed = hashRefreshToken(refreshToken);
  const stored = await refreshTokenActions.getRefreshTokenByValue(hashed);

  if (!stored) {
    throw new Error('Invalid refresh token');
  }

  if (stored.expiresAt.getTime() < Date.now()) {
    await refreshTokenActions.deleteRefreshToken(hashed);
    throw new Error('Refresh token expired');
  }

  const user = await userActions.getUserById(stored.userId);

  if (!user) {
    throw new Error('User not found');
  }

  await refreshTokenActions.deleteRefreshToken(hashed);

  return generateAuthTokens(user);
}

/** Revokes a refresh token (logout). No-op when the token is unknown. */
export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await refreshTokenActions.deleteRefreshToken(hashRefreshToken(refreshToken));
}
