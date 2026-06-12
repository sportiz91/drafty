import bcrypt from 'bcryptjs';

import * as userActions from '@/database/actions/user-actions';
import type { User } from '@/database/schema/users-schema';
import * as tokenService from '@/services/token.service';
import type { AuthTokens, PublicUser } from '@/types/auth.types';
import type { LoginInput, RegisterInput } from '@/validators/auth.validators';

const BCRYPT_ROUNDS = 12;

// bcrypt hash of a random throwaway string. Compared when the email is
// unknown so both login paths cost one bcrypt compare — otherwise the
// fast "email not found" response is a user-enumeration timing oracle.
const DUMMY_PASSWORD_HASH =
  '$2b$12$KzG1tkFSsi1Z7.JFV9QK.O1AVhCQtHn1V9fJe38DXemuaZDif8c5u';

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

  // Always run exactly one bcrypt compare, and return the same error for
  // unknown email and wrong password — no enumeration via timing or text.
  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH
  );

  if (!user || !passwordMatches) {
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
    await tokenService.revokeRefreshToken(refreshToken);
  }
}
