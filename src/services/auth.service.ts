import bcrypt from 'bcryptjs';

import * as refreshTokenActions from '@/database/actions/refresh-token-actions';
import * as userActions from '@/database/actions/user-actions';
import type { User } from '@/database/schema/users-schema';
import * as tokenService from '@/services/token.service';
import type { AuthTokens, PublicUser } from '@/types/auth.types';
import type { LoginInput, RegisterInput } from '@/validators/auth.validators';

const BCRYPT_ROUNDS = 12;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function register(
  input: RegisterInput
): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const email = input.email.toLowerCase();

  const existing = await userActions.getUserByEmail(email);

  if (existing) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await userActions.createUser({ email, passwordHash });
  const tokens = await tokenService.generateAuthTokens(user);

  return { user: toPublicUser(user), tokens };
}

export async function login(
  input: LoginInput
): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const user = await userActions.getUserByEmail(input.email.toLowerCase());

  // Same error for unknown email and wrong password — never leak which.
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error('Invalid credentials');
  }

  const tokens = await tokenService.generateAuthTokens(user);

  return { user: toPublicUser(user), tokens };
}

export async function getAuthenticatedUser(
  userId: string
): Promise<PublicUser | null> {
  const user = await userActions.getUserById(userId);

  return user ? toPublicUser(user) : null;
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (refreshToken) {
    await refreshTokenActions.deleteRefreshToken(refreshToken);
  }
}
