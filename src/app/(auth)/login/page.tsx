import type { Metadata } from 'next';

import { AuthCard } from '@/features/auth/components/auth-card';
import { LoginForm } from '@/features/auth/components/login-form';
import { sanitizeRedirect } from '@/lib/auth/sanitize-redirect';

export const metadata: Metadata = { title: 'Log in' };

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;

  return (
    <AuthCard title="Welcome back" subtitle="Log in to your writing workspace">
      <LoginForm redirectTo={sanitizeRedirect(redirect)} />
    </AuthCard>
  );
}
