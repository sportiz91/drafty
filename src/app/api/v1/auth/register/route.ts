import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { setAuthCookies } from '@/lib/auth/auth-cookies';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import {
  PayloadTooLargeError,
  readJsonBody,
} from '@/lib/security/read-json-body';
import * as authService from '@/services/auth.service';
import { EmailAlreadyRegisteredError } from '@/services/service-errors';
import { registerSchema } from '@/validators/auth.validators';

/**
 * POST /api/v1/auth/register
 * Creates a user and signs them in (tokens in httpOnly cookies).
 */
export async function POST(request: NextRequest) {
  // Strict limit: registration is an account-minting surface.
  const limited = enforceRateLimit(request, 'register', 3, 60_000);
  if (limited) {
    return limited;
  }

  try {
    const data = registerSchema.parse(await readJsonBody(request));
    const result = await authService.register(data);

    const response = NextResponse.json(
      { user: result.user, expiresIn: result.tokens.expiresIn },
      { status: 201 }
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

    if (error instanceof EmailAlreadyRegisteredError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
