/** @jest-environment node */
import * as refreshTokenActions from '@/database/actions/refresh-token-actions';
import * as userActions from '@/database/actions/user-actions';
import type { User } from '@/database/schema/users-schema';
import * as tokenService from '@/services/token.service';

jest.mock('@/database/actions/refresh-token-actions');
jest.mock('@/database/actions/user-actions');

const mockedRefreshTokenActions = jest.mocked(refreshTokenActions);
const mockedUserActions = jest.mocked(userActions);

const user = { id: 'user-1', email: 'santi@example.com' };

const fullUser: User = {
  id: 'user-1',
  email: 'santi@example.com',
  passwordHash: 'hash',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('generateAuthTokens', () => {
  it('returns a verifiable access token with the user payload', async () => {
    const tokens = await tokenService.generateAuthTokens(user);

    const payload = tokenService.verifyAccessToken(tokens.accessToken);

    expect(payload).toEqual({ userId: 'user-1', email: 'santi@example.com' });
  });

  it('persists the refresh token with a future expiry', async () => {
    const before = Date.now();

    await tokenService.generateAuthTokens(user);

    const stored =
      mockedRefreshTokenActions.createRefreshToken.mock.calls[0]?.[0];
    expect(stored?.userId).toBe('user-1');
    expect(stored?.token).toMatch(/^[a-f0-9]{64}$/);
    expect(stored?.expiresAt.getTime()).toBeGreaterThan(before);
  });
});

describe('verifyAccessToken', () => {
  it('throws on a forged token', () => {
    expect(() => tokenService.verifyAccessToken('not-a-jwt')).toThrow(
      'Invalid access token'
    );
  });
});

describe('rotateRefreshToken', () => {
  it('throws when the token is unknown (already rotated or forged)', async () => {
    mockedRefreshTokenActions.getRefreshTokenByValue.mockResolvedValue(
      undefined
    );

    await expect(tokenService.rotateRefreshToken('unknown')).rejects.toThrow(
      'Invalid refresh token'
    );
  });

  it('deletes an expired token and rejects', async () => {
    mockedRefreshTokenActions.getRefreshTokenByValue.mockResolvedValue({
      id: 'token-1',
      token: 'expired-token',
      userId: 'user-1',
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
    });

    await expect(
      tokenService.rotateRefreshToken('expired-token')
    ).rejects.toThrow('Refresh token expired');

    expect(mockedRefreshTokenActions.deleteRefreshToken).toHaveBeenCalledWith(
      'expired-token'
    );
  });

  it('rotates a valid token: deletes the old one and issues a new pair', async () => {
    mockedRefreshTokenActions.getRefreshTokenByValue.mockResolvedValue({
      id: 'token-1',
      token: 'valid-token',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    });
    mockedUserActions.getUserById.mockResolvedValue(fullUser);

    const tokens = await tokenService.rotateRefreshToken('valid-token');

    expect(mockedRefreshTokenActions.deleteRefreshToken).toHaveBeenCalledWith(
      'valid-token'
    );
    expect(tokens.refreshToken).not.toBe('valid-token');
    expect(tokenService.verifyAccessToken(tokens.accessToken).userId).toBe(
      'user-1'
    );
  });
});
