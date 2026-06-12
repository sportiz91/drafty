import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { setAuthCookies } from '@/lib/auth/auth-cookies';
import * as authService from '@/services/auth.service';
import { registerSchema } from '@/validators/auth.validators';

/**
 * POST /api/v1/auth/register
 * Creates a user and signs them in (tokens in httpOnly cookies).
 */
export async function POST(request: NextRequest) {
  try {
    const data = registerSchema.parse(await request.json());
    const result = await authService.register(data);

    const response = NextResponse.json(
      { user: result.user, expiresIn: result.tokens.expiresIn },
      { status: 201 }
    );
    setAuthCookies(response, result.tokens);

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === 'Email already registered'
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
