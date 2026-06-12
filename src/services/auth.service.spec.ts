/** @jest-environment node */
import crypto from 'crypto';

import bcrypt from 'bcryptjs';

import * as refreshTokenActions from '@/database/actions/refresh-token-actions';
import * as userActions from '@/database/actions/user-actions';
import type { User } from '@/database/schema/users-schema';
import * as authService from '@/services/auth.service';

jest.mock('@/database/actions/refresh-token-actions');
jest.mock('@/database/actions/user-actions');

const mockedUserActions = jest.mocked(userActions);
const mockedRefreshTokenActions = jest.mocked(refreshTokenActions);

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'santi@example.com',
    passwordHash: 'hash',
    createdAt: new Date('2026-06-12T00:00:00Z'),
    updatedAt: new Date('2026-06-12T00:00:00Z'),
    ...overrides,
  };
}

describe('register', () => {
  it('rejects an already-registered email', async () => {
    mockedUserActions.getUserByEmail.mockResolvedValue(buildUser());

    await expect(
      authService.register({
        email: 'santi@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('Email already registered');
  });

  it('hashes the password and lowercases the email', async () => {
    mockedUserActions.getUserByEmail.mockResolvedValue(undefined);
    mockedUserActions.createUser.mockImplementation(async data =>
      buildUser({ email: data.email, passwordHash: data.passwordHash })
    );
    mockedRefreshTokenActions.createRefreshToken.mockResolvedValue({
      id: 'token-1',
      token: 'x',
      userId: 'user-1',
      expiresAt: new Date(),
      createdAt: new Date(),
    });

    const result = await authService.register({
      email: 'Santi@Example.com',
      password: 'password123',
    });

    const created = mockedUserActions.createUser.mock.calls[0]?.[0];
    expect(created?.email).toBe('santi@example.com');
    expect(created?.passwordHash).not.toBe('password123');
    expect(
      await bcrypt.compare('password123', created?.passwordHash ?? '')
    ).toBe(true);
    expect(result.user).toEqual({
      id: 'user-1',
      email: 'santi@example.com',
      createdAt: '2026-06-12T00:00:00.000Z',
    });
  });
});

describe('login', () => {
  it('rejects an unknown email with a generic error', async () => {
    mockedUserActions.getUserByEmail.mockResolvedValue(undefined);

    await expect(
      authService.login({ email: 'ghost@example.com', password: 'whatever' })
    ).rejects.toThrow('Invalid credentials');
  });

  it('rejects a wrong password with the same generic error', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    mockedUserActions.getUserByEmail.mockResolvedValue(
      buildUser({ passwordHash })
    );

    await expect(
      authService.login({ email: 'santi@example.com', password: 'wrong' })
    ).rejects.toThrow('Invalid credentials');
  });

  it('returns the public user and tokens on valid credentials', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    mockedUserActions.getUserByEmail.mockResolvedValue(
      buildUser({ passwordHash })
    );
    mockedRefreshTokenActions.createRefreshToken.mockResolvedValue({
      id: 'token-1',
      token: 'x',
      userId: 'user-1',
      expiresAt: new Date(),
      createdAt: new Date(),
    });

    const result = await authService.login({
      email: 'santi@example.com',
      password: 'correct-password',
    });

    expect(result.user.email).toBe('santi@example.com');
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.user).not.toHaveProperty('passwordHash');
  });
});

describe('logout', () => {
  it('deletes the refresh token (by hash) when present', async () => {
    await authService.logout('some-refresh-token');

    expect(mockedRefreshTokenActions.deleteRefreshToken).toHaveBeenCalledWith(
      crypto.createHash('sha256').update('some-refresh-token').digest('hex')
    );
  });

  it('does nothing without a refresh token', async () => {
    await authService.logout(undefined);

    expect(mockedRefreshTokenActions.deleteRefreshToken).not.toHaveBeenCalled();
  });
});
