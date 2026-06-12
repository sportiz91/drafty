import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { setAuthCookies } from '@/lib/auth/auth-cookies';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import {
  PayloadTooLargeError,
  readJsonBody,
} from '@/lib/security/read-json-body';
import * as authService from '@/services/auth.service';
import { loginSchema } from '@/validators/auth.validators';

/**
 * POST /api/v1/auth/login
 * Authenticates a user (tokens in httpOnly cookies).
 */
export async function POST(request: NextRequest) {
  // Brute-force protection on credentials.
  const limited = enforceRateLimit(request, 'login', 5, 60_000);
  if (limited) {
    return limited;
  }

  try {
    const data = loginSchema.parse(await readJsonBody(request));
    const result = await authService.login(data);

    const response = NextResponse.json(
      { user: result.user, expiresIn: result.tokens.expiresIn },
      { status: 200 }
    );
    setAuthCookies(response, result.tokens);

    return response;
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Invalid credentials') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 });
  }
}
