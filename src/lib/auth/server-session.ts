import { cookies } from 'next/headers';
import { cache } from 'react';

import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/auth-cookies';
import * as tokenService from '@/services/token.service';
import type { AccessTokenPayload } from '@/types/auth.types';

/**
 * Session for server components. Wrapped in React cache() so layout, page
 * and generateMetadata share one verification per request.
 */
export const getServerSession = cache(
  async (): Promise<AccessTokenPayload | null> => {
    const store = await cookies();
    const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!accessToken) {
      return null;
    }

    try {
      return tokenService.verifyAccessToken(accessToken);
    } catch {
      return null;
    }
  }
);
