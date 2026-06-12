'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { login } from '@/client-api/auth';
import { Button } from '@/components/ui/button';
import { AuthFormField } from '@/features/auth/components/auth-form-field';
import { loginSchema, type LoginInput } from '@/validators/auth.validators';

type LoginFormProps = {
  /** Sanitized relative path to land on after login. */
  redirectTo: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function handleLogin(values: LoginInput) {
    setServerError(null);

    const result = await login(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(handleLogin)} className="space-y-5" noValidate>
      <AuthFormField
        label="Email"
        id="email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        data-id="auth-email"
        error={errors.email?.message}
        {...registerField('email')}
      />
      <AuthFormField
        label="Password"
        id="password"
        type="password"
        autoComplete="current-password"
        placeholder="Your password"
        data-id="auth-password"
        error={errors.password?.message}
        {...registerField('password')}
      />
      {serverError ? (
        <p className="text-sm text-accent" data-id="auth-error" role="alert">
          {serverError}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
        data-id="auth-submit"
      >
        {isSubmitting ? 'Logging in…' : 'Log in'}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        New to Drafty?{' '}
        <Link
          href="/register"
          className="font-medium text-ink underline-offset-2 hover:underline"
          data-id="go-to-register"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
