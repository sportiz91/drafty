'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { register } from '@/client-api/auth';
import { Button } from '@/components/ui/button';
import { AuthFormField } from '@/features/auth/components/auth-form-field';
import {
  registerSchema,
  type RegisterInput,
} from '@/validators/auth.validators';

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function handleRegister(values: RegisterInput) {
    setServerError(null);

    const result = await register(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.push('/documents');
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(handleRegister)}
      className="space-y-5"
      noValidate
    >
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
        autoComplete="new-password"
        placeholder="At least 8 characters"
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
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-ink underline-offset-2 hover:underline"
          data-id="go-to-login"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
