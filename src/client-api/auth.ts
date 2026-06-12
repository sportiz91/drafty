import type { PublicUser } from '@/types/auth.types';
import type { LoginInput, RegisterInput } from '@/validators/auth.validators';

export type AuthResult =
  | { success: true; user: PublicUser }
  | { success: false; error: string };

async function postAuth(path: string, body: unknown): Promise<AuthResult> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data !== null &&
      typeof data === 'object' &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : 'Something went wrong. Please try again.';

    return { success: false, error: message };
  }

  return { success: true, user: (data as { user: PublicUser }).user };
}

export function login(input: LoginInput): Promise<AuthResult> {
  return postAuth('/api/v1/auth/login', input);
}

export function register(input: RegisterInput): Promise<AuthResult> {
  return postAuth('/api/v1/auth/register', input);
}

export async function logout(): Promise<void> {
  await fetch('/api/v1/auth/logout', { method: 'POST' });
}
